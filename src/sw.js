// Service worker (anh 28/10 "lần đầu tải trước, trình duyệt tự lưu để lần sau khỏi tải lại"): giữ file trong assets/ ở Cache Storage
// của trình duyệt, kèm phiên bản thư mục (x-ban) lấy từ GET /api/tai-nguyen (may-chu/tai-nguyen.js). Hỏi file assets/: còn bản đúng
// phiên bản -> trả luôn, không qua mạng; chưa có / thư mục đã đổi -> tải (hỏi lại máy chủ, 304 nếu trình duyệt còn) rồi cất. Mọi file
// assets/ đã dùng đều được cất (bản đồ, hình nhân vật, quái…), không chỉ gói tải trước (src/game/tai-truoc.js).
// Không đụng: code (src/, game.html — F5 là có bản mới như cũ), /api/, file có ?…, yêu cầu Range (nhạc), yêu cầu gắn x-tai-truoc (trang
// tự tải gói lần đầu và tự cất). Mỗi lần mở / F5 trang: hỏi lại bảng phiên bản -> file vừa dựng lại có ngay. Chỉ chạy ở https / localhost
// (trình duyệt chỉ cho service worker ở đó — đường hầm Cloudflare là https); vào bằng http qua mạng LAN thì như trước.
const KHO = "vl-tn-1";
let thu = null, luc = 0, dangHoi = null;
// Bảng phiên bản: trình duyệt tắt service worker khi rảnh (~30 giây) -> mất bảng trong bộ nhớ. Bản đầu khi đó MỌI file assets/ chờ hỏi lại máy
// chủ, không có hạn: mạng / đường hầm khựng là màn chờ đổi bản đồ treo mãi (anh 28/10 "thanh loading kiểm tra kĩ"). Nay: hỏi máy chủ có hạn
// HOI_MS; chưa có bảng trong bộ nhớ thì dùng ngay bản đã cất trong kho (hỏi máy chủ chạy song song, có bản mới thì thay)
const HOI_MS = 8000;
// tải 1 file assets/ cho trang: bám theo yêu cầu của trang (trang bỏ — vd src/tai-tep.js khựng 15 giây — thì bỏ luôn, nhả kết nối) + phải có
// phản hồi trong TEP_MS. Thử 28/10 (máy chủ trung gian giữ im vài file): bản đầu trang đã bỏ mà service worker vẫn giữ yêu cầu của nó, chiếm
// hết 6 kết nối tới máy chủ -> mọi yêu cầu khác (cả /api/ — rời ải, nhịp) phải xếp hàng chờ mãi
const TEP_MS = 20000;
const thuDaCat = async () => { try { const r = await (await caches.open(KHO)).match("/__thu"); return r ? (await r.json()).thu : null; } catch { return null; } };
function layThu(moi) {
  if (thu && !moi && Date.now() - luc < 10 * 60e3) return Promise.resolve(thu);
  if (!dangHoi) dangHoi = (async () => {
    const ctl = new AbortController(), het = setTimeout(() => ctl.abort(), HOI_MS);
    try {
      const r = await fetch("/api/tai-nguyen", { cache: "no-store", signal: ctl.signal });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      thu = j.thu; luc = Date.now();
      (await caches.open(KHO)).put("/__thu", new Response(JSON.stringify(j), { headers: { "Content-Type": "application/json" } }));
    } catch { // mất mạng / quá hạn: dùng bảng đã lưu
      if (!thu) { const t = await thuDaCat(); if (t) { thu = t; luc = Date.now() - 9 * 60e3; } }
    } finally { clearTimeout(het); dangHoi = null; }
    return thu;
  })();
  if (!thu && !moi) { const hoi = dangHoi; return thuDaCat().then((t) => { if (t && !thu) { thu = t; luc = Date.now() - 9 * 60e3; } return thu || hoi; }); }
  return dangHoi;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("vl-tn-") && k !== KHO) await caches.delete(k); // kho bản cũ
  await self.clients.claim();
})()));
self.addEventListener("message", (e) => { if (e.data === "lamMoi") e.waitUntil(layThu(true)); });
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === "navigate") { e.waitUntil(layThu(true)); return; } // mở / F5 trang: hỏi lại bảng phiên bản
  if (!u.pathname.startsWith("/assets/") || u.search || r.headers.has("range") || r.headers.has("x-tai-truoc")) return;
  e.respondWith(phat(r, u));
});

// File dữ liệu .json (danh sách bãi, NPC, giá Kỳ Trân Các…): luôn hỏi máy chủ trước (304 nếu không đổi — nhẹ), lỗi / quá JSON_MS mới dùng bản
// đã cất (anh 28/10: bấm đi đảo Tẩy Tủy mà không di chuyển — F5 trong 10 phút vẫn dùng bảng phiên bản cũ nên trang lấy map.json cũ chưa có đảo).
// Hình / tiếng / bản đồ ảnh vẫn lấy bản đã cất theo phiên bản như trước
const JSON_MS = 6000;
async function phat(req, u) {
  let p; try { p = decodeURIComponent(u.pathname).slice(1); } catch { return fetch(req); }
  if (p.endsWith(".json")) return phatJson(req, u);
  const T = await layThu(), v = T && T[p.slice(0, p.lastIndexOf("/"))];
  const c = await caches.open(KHO);
  const co = await c.match(u.pathname);
  if (co && v && co.headers.get("x-ban") === v) return co;
  let r;
  const ctl = new AbortController(), het = setTimeout(() => ctl.abort(), TEP_MS);
  if (req.signal) { if (req.signal.aborted) ctl.abort(); else req.signal.addEventListener("abort", () => ctl.abort(), { once: true }); }
  try { r = await fetch(req, { cache: "no-cache", signal: ctl.signal }); } catch (err) { if (co) return co; throw err; } // mất mạng / quá hạn: bản cũ còn hơn không
  finally { clearTimeout(het); }
  if (r.ok && r.status === 200 && v) {
    const h = new Headers({ "Content-Type": r.headers.get("Content-Type") || "application/octet-stream", "x-ban": v });
    r.clone().arrayBuffer().then((b) => c.put(u.pathname, new Response(b, { headers: h }))).catch(() => {});
  }
  return r;
}
async function phatJson(req, u) {
  const c = await caches.open(KHO), ctl = new AbortController(), het = setTimeout(() => ctl.abort(), JSON_MS);
  if (req.signal) { if (req.signal.aborted) ctl.abort(); else req.signal.addEventListener("abort", () => ctl.abort(), { once: true }); }
  try {
    const r = await fetch(req, { cache: "no-cache", signal: ctl.signal });
    if (r.ok && r.status === 200) {
      const h = new Headers({ "Content-Type": r.headers.get("Content-Type") || "application/json", "x-ban": "json" });
      r.clone().arrayBuffer().then((b) => c.put(u.pathname, new Response(b, { headers: h }))).catch(() => {});
    }
    return r;
  } catch (err) { const co = await c.match(u.pathname); if (co) return co; throw err; } // mất mạng / quá hạn: bản đã cất
  finally { clearTimeout(het); }
}
