// Tải trước lần đầu vào game (anh 28/10: "người chơi lần đầu vào game thì tự tải trước 1 phần tài nguyên — giao diện cơ bản, kĩ năng, shop
// thuốc — chỉ lần đầu, sau đó trình duyệt tự lưu để lần sau không phải tải lại").
//   dangKy()                       đăng ký service worker src/sw.js (lúc mở trang): giữ mọi file assets/ đã dùng trong Cache Storage
//   await taiTruoc(LOADING, P, hero)   lúc bấm Vào Trò Chơi: gói GET /api/tai-truoc (may-chu/tai-nguyen.js — giao diện, icon đồ + võ công,
//                                  bảng dữ liệu, tiếng cơ bản…) + hình / tiếng võ công CỦA PHÁI MÌNH (vocong.json). Cất vào cùng kho với
//                                  service worker (x-ban = phiên bản thư mục). Màn chờ ghi "Tải tài nguyên lần đầu" + số MB / số tệp, nút
//                                  "Vào game ngay" (phần còn lại tải tiếp lúc chơi).
// Lần sau: khoa của gói (máy chủ băm phiên bản) + phái khớp với lần tải đủ trước (localStorage vl_taiTruoc) -> vào thẳng; thư mục nào đổi
// thì chỉ tải file đổi của thư mục đó. Trình duyệt không có Cache Storage (vào http qua mạng LAN): tải 1 lượt cho bộ nhớ đệm thường của
// trình duyệt (ảnh giữ 1 ngày).
const KHO = "vl-tn-1", SONG = 6, NHO = "vl_taiTruoc", HOI_MS = 6000;
const coKho = () => typeof caches !== "undefined" && self.isSecureContext;

export function dangKy() {
  if (!("serviceWorker" in navigator) || !self.isSecureContext) return;
  navigator.serviceWorker.register("src/sw.js", { scope: "/" }).catch(() => {});
}

// hình + tiếng của các chiêu (như VoCongPack.warm: vận công, đạn, chiêu con / sự kiện, hình trạng thái)
function voCong(M, ids) {
  const spr = new Set(), snd = new Set(), seen = new Set();
  const di = (id) => {
    const k = M.sk[id]; if (!k || seen.has(id)) return; seen.add(id);
    if (k.pre) spr.add(k.pre);
    for (const s of k.snd || []) if (s) snd.add(s);
    const st = k.state != null && M.st[k.state]; if (st && st.spr) spr.add(st.spr);
    const d = k.mis && M.mi[k.mis];
    if (d) { for (const a of [...(d.a || []), ...(d.b || [])]) if (a && a.spr) spr.add(a.spr); for (const s of d.snd || []) if (s) snd.add(s); }
    if (k.kid) di(k.kid);
    for (const v of Object.values(k.ev || {})) di(v);
  };
  for (const id of ids) di(id);
  const tep = new Set([...spr].map((k) => `assets/web/vocong/spr/${k}.spr`));
  for (const k of snd) if (M.snd[k]) tep.add(`assets/web/vocong/snd/${M.snd[k]}`);
  return tep;
}
const docNho = () => { try { return localStorage.getItem(NHO); } catch { return null; } };
const ghiNho = (v) => { try { localStorage.setItem(NHO, v); } catch {} };
const mb = (b, T) => (T < 1048576 ? Math.ceil(b / 1024) + " KB" : (b / 1048576).toFixed(1).replace(".", ",") + " MB");
const url = (p) => new URL("/" + p, location.origin).pathname; // khóa trong kho = đường dẫn đã mã hóa, như service worker thấy

export async function taiTruoc(L, P, hero) {
  let j;
  // hỏi danh sách gói có hạn HOI_MS (anh 10/11 21:05 "người ở ngoài không vào được game": máy chủ quá tải -> /api/tai-truoc treo, màn
  // "Đang vào game… 0%" chờ mãi). Quá hạn / lỗi: bỏ tải trước, vào game luôn — tài nguyên tải dần lúc chơi như bình thường
  const ctl = new AbortController(), hanHoi = setTimeout(() => ctl.abort(), HOI_MS);
  try { const r = await fetch("api/tai-truoc", { cache: "no-store", signal: ctl.signal }); if (!r.ok) return; j = await r.json(); } catch { return; } finally { clearTimeout(hanHoi); }
  const fac = (P.factions || []).find((f) => f.id === hero.fac), khoa = `${j.khoa}:${fac ? fac.key : "-"}`;
  const cu = docNho();
  if (cu === khoa) return;
  const vc = P.vc && P.vc.M ? voCong(P.vc.M, fac ? fac.skills : []) : new Set();
  const ds = j.ds.filter(([p]) => !p.startsWith("assets/web/vocong/") || p.endsWith(".json") || vc.has(p));
  // bỏ file đã có đúng phiên bản trong kho
  const kho = coKho() ? await caches.open(KHO).catch(() => null) : null;
  const co = kho ? await Promise.all(ds.map(([p, , v]) => kho.match(url(p)).then((r) => !!r && r.headers.get("x-ban") === v).catch(() => false))) : ds.map(() => false);
  const can = ds.filter((_, i) => !co[i]);
  if (!can.length) return ghiNho(khoa);

  const tong = can.reduce((a, f) => a + f[1], 0);
  let xong = 0, byte = 0, hong = 0, i = 0;
  const ten = cu ? "Cập nhật tài nguyên" : "Tải tài nguyên lần đầu (chỉ 1 lần, lần sau vào ngay)"; // cu: đã tải đủ 1 lần, nay có file đổi
  L.start(null, ten + "…");
  const bao = L.part(tong);
  const ve = () => { bao(byte, tong); L.chu(`${ten}: ${mb(byte, tong)} / ${mb(tong, tong)} · ${xong} / ${can.length} tệp`); };
  ve();
  const mot = async ([p, s, v]) => {
    try {
      const r = await fetch(url(p), { cache: kho ? "no-cache" : "default", headers: { "x-tai-truoc": "1" } });
      if (!r.ok) throw new Error(r.status);
      const b = await r.arrayBuffer();
      if (kho) await kho.put(url(p), new Response(b, { headers: { "Content-Type": r.headers.get("Content-Type") || "application/octet-stream", "x-ban": v } }));
    } catch { hong++; }
    xong++; byte += s; ve();
  };
  const tho = async () => { while (i < can.length) await mot(can[i++]); };
  const het = Promise.all(Array.from({ length: SONG }, tho)).then(() => { if (!hong) ghiNho(khoa); });
  // "Vào game ngay": không chờ — phần còn lại tải tiếp lúc chơi
  let bo;
  const thoi = new Promise((r) => { bo = r; });
  L.nut("Vào game ngay (tải tiếp lúc chơi)", () => bo());
  await Promise.race([het, thoi]);
  L.nut(null);
}
