// Chiến báo Tống Kim — gói giao diện của trận thật (anh 06/11 chọn mẫu: máy tính A đúng client, điện thoại B khung cửa sổ game — ảnh mẫu
// scratchpad tk2/mau a-desktop.png / b-phone.png; đặc tả tk2/dac-ta-dot2.md mục 4). Kiểu ở src/game/game.css (mục Tống Kim: #tkcb-nut, #tkcb, #tkkq).
//   Máy tính (mẫu A, đúng client):
//     - nút "▼ Chiến báo" ngay dưới bảng gọn #tktt (bảng do tongkim.js ve vẽ) bật / tắt chiến báo tức thời 即时战报界面.ini: hộp 750 × 350 trong suốt
//       (bóng 0,30,19) ở chỗ client (135, 150 trong khung 1024 × 768 giữa màn — như cửa sổ uiwin.js; đè bảng gọn thì dịch sang trái): hàng trên
//       Chiến trường / Cấp / Điều kiện thắng / Tỉ lệ / Còn lại, thành tích của mình, 10 người đứng đầu (cả bot) màu dòng lẻ 255,255,255 / chẵn
//       255,255,80, tiêu đề 235,231,148, vạch 0,255,255. Không chặn chuột: bấm xuyên xuống cảnh (mở chiến báo vẫn đi / đánh được)
//     - hết trận: bảng 宋金快报.ini giữa màn — hình client assets/ui/tongkim/cb_bang.png 250 × 428 (cong-cu/dung-chien-bao.mjs), 14 dòng ô 框.spr,
//       nút Đóng 关闭.spr 3 khung (thường / nhấn / rê chuột); phần thưởng của mình thành dòng tin ở khung chat (như client báo thưởng)
//   Điện thoại (mẫu B, body.dt):
//     - nút "Chiến báo" dưới bảng gọn -> cửa sổ khung 任务记事 (tin_nen.png 433 × 300, nút "Đóng lại"): mình (phe, chức, hạng, tích lũy, PK, giết NPC,
//       tử vong, liên trảm, còn bao nhiêu điểm lên chức) + 5 người đầu + dòng của mình
//     - hết trận: khung 排名 "Xếp hạng" (x_28e872de.png 480 × 300, nút "Đóng" — như kết quả boss thế giới windows.js ketQuaBoss): cột trái bảng điểm
//       (10 người đầu, mình chữ vàng), cột phải phe thắng / mình / 4 ô thưởng (kinh nghiệm, Nhạc Vương Hồn Thạch, Huân công bài — hình món thật của
//       ItemDB, điểm Tống Kim) / vinh danh
//   Esc đóng bảng trên cùng (bảng kết thúc trước); đóng rồi là ẩn hẳn — không còn gì chặn bấm cảnh.
// Gọi từ src/game/tongkim.js (có module thì gọi): ChienBao.ve(p, ctx) mỗi khung lúc ở trận thật (p = trạng thái "tk" của máy chủ; null kèm ctx = tạm
// mất trạng thái (kênh đứt): ẩn nút + chiến báo; null kèm null = rời trận: bỏ hết), ChienBao.ketQua(ket, ctx) 1 lần lúc xong trận; ctx = { ten, phe,
// tran, chu, dt, gioSv(), raLuc }. Trạng thái (may-chu/tong-kim.js phat / ketCua):
//   p.me = [điểm, giết, chết, chức, giết NPC, liên trảm cao nhất, liên trảm hiện tại]; p.top = 10 dòng [tên, phe, điểm, giết, chết, chức, liên trảm
//   cao nhất, giết NPC] (cả bot); p.ng = người thật [tên, phe, điểm, giết, chết, chức, trong phòng, giết NPC, liên trảm cao nhất, liên trảm hiện tại];
//   p.diem = [Tống, Kim]; p.pha "bd" | "danh" | "xong"; p.kc / het / soaiLuc / soaiMoc = giờ máy chủ (ms); ket = { thang, lyDo, diem, bang (30 dòng như
//   top), me { ten, phe, diem, giet, chet, chuc, lienMax, binh, hang, thang } | null, thuong { tài khoản: { diemTk, ht, kn, hc } } (chỉ phần của mình —
//   không đủ điều kiện thì {}), soai, x2 (Thiên Tử), ra }
import { ItemDB } from "./itemdb.js";
import { TongKim } from "./tongkim.js";

const PHE = ["Tống", "Kim"], LOP = ["song", "kim"], CHUC = ["Binh sĩ", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng"];
// số của cau-hinh.json tongKim mà trạng thái không gửi xuống (đổi ở đó thì sửa cả đây): mốc chức (chuc), đẳng cấp vào trận (cap), điểm thưởng mỗi
// người thắng / thua (thuong.thang / thua), điểm trận tối thiểu có thưởng (thuong.diemMin), hệ số Thiên Tử (thienTu.heSo)
const MOC_CHUC = [1000, 3000, 6000, 10000], CAP = 100, THUONG = [1200, 600], DIEM_MIN = 100, HS_X2 = 2;
const HT = "qk:507", HC = "ms:1773"; // Nhạc Vương Hồn Thạch, Huân công bài Tống Kim (thuong.htMon / hcMon)
const KN_HINH = "assets/ui/win/img/jingyan_icon_018ex_558575b2.png"; // ô kinh nghiệm 48 × 48 (\Ui\PictureList.ini hình 4 — win.json thuong.hinh)
// chiến báo tức thời (即时战报界面.ini — assets/ui/tongkim/cb.json chienBao): 750 × 350 ở (135, 150); hàng trên y 3, vạch y 17 / 172, thành tích y
// 19–158, 10 người đầu từ y 174; bề rộng 5 ô hàng trên theo tỉ lệ client (BattleWar 28, Level 8, WinCondition 24, Proportion 16, LeftTime 12)
const CBA = { w: 750, h: 350, x: 135, y: 150, tren: 3, vach1: 17, minh: 19, quanHam: 158, vach2: 172, top: 174, cot: [28, 8, 24, 16, 12] };
const COT10 = [["Tên", 190], ["Chức", 96], ["Giết NPC", 84], ["PK", 70], ["Liên trảm", 90], ["Tử vong", 84], ["Tích lũy", 132]];
// bảng kết thúc (宋金快报.ini — cb.json ketQua): nền 250 × 428, ô tên x 22 + ô giá trị x 136 (框.spr 112 × 17), 14 dòng cách 22 từ y 39; tên ngắn
// của mẫu A (client: "Phe thắng trong chiến trường Tống Kim", "Người pk nhiều nhất", "Tống binh có giá trị nhất"…)
const KQA = { w: 250, h: 428, tenX: 22, giaTriX: 136, y0: 39, cach: 22 };
const TEN14 = ["Phe thắng", "Tống Kim Phong Vân", "PK nhiều nhất", "NPC Thiên Địch", "Tống binh giá trị", "Kim binh giá trị", "Tống binh đồng tình",
  "Kim binh đồng tình", "Tích phân cao nhất", "Thưởng mỗi người", "Tích phân phe mình", "Điểm thắng lợi", "Điểm cuối cùng", "Đồng điểm"];
// điện thoại: khung 任务记事 (cửa sổ "tin" của win.json) và khung 排名 (cửa sổ "xephang")
const KB1 = { w: 433, h: 300 }, KB2 = { w: 480, h: 300 };
const CHO_MS = 250; // đặt lại chỗ (đo bảng gọn / cỡ màn) tối đa 4 lần / giây

const so = (n) => Math.round(+n || 0).toLocaleString("vi-VN");
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
const p01 = (v) => (+v ? 1 : 0);
const tenP = (t, p) => `<span class="${LOP[p01(p)]}">${esc(t)}</span>`;
const tenMon = (k, du) => { const x = ItemDB.item(k); return (x && x.n) || du; };
const dsDong = (a) => (Array.isArray(a) ? a.filter(Array.isArray) : []);
const gioCua = (ctx) => (ctx && typeof ctx.gioSv === "function" ? ctx.gioSv() : Date.now());
const pheCua = (p, ctx) => p01(ctx && ctx.phe != null ? ctx.phe : p && p.phe);
const diemPhe = (d) => [Math.max(0, +(Array.isArray(d) ? d[0] : 0) || 0), Math.max(0, +(Array.isArray(d) ? d[1] : 0) || 0)];

// ---------- số liệu (hàm thuần) ----------
// thành tích của mình (p.me)
export function minhCua(p) {
  const m = Array.isArray(p && p.me) ? p.me : [], v = (i) => Math.max(0, +m[i] || 0);
  return { diem: v(0), giet: v(1), chet: v(2), chuc: Math.min(4, v(3) | 0), binh: v(4), lienMax: v(5), lt: v(6) };
}
// quân hàm: chức kế (null = cao nhất rồi), điểm còn thiếu, % đi từ mốc chức đang giữ tới mốc kế (chức máy chủ = số mốc ≤ điểm)
export function quanHam(diem, chuc) {
  const c = Math.max(0, Math.min(4, chuc | 0));
  if (c >= MOC_CHUC.length) return { ke: null, con: 0, pt: 100 };
  const tu = c > 0 ? MOC_CHUC[c - 1] : 0, toi = MOC_CHUC[c];
  return { ke: CHUC[c + 1], con: Math.max(0, toi - diem), pt: Math.max(0, Math.min(100, ((diem - tu) * 100) / Math.max(1, toi - tu))) };
}
// hạng của mình trong 10 người đầu (p.top — cả bot); ngoài 10 thì 0 (trạng thái không có cả bảng)
export function hangCua(p, ten) {
  const i = dsDong(p && p.top).findIndex((r) => String(r[0]) === String(ten || ""));
  return i >= 0 ? i + 1 : 0;
}
// phần thưởng của mình trong kết quả (thuong chỉ có 1 tài khoản — của mình) | null
export function thuongCua(ket) {
  const T = ket && ket.thuong; if (!T || typeof T !== "object") return null;
  for (const v of Object.values(T)) if (v && typeof v === "object") return { diemTk: +v.diemTk || 0, ht: +v.ht || 0, kn: +v.kn || 0, hc: +v.hc || 0 };
  return null;
}
// vinh danh từ bảng kết quả (30 dòng đầu, cả bot) + người thật lúc cuối (p.ng — kẻ chết nhiều nhất thường nằm dưới 30 dòng đầu):
// { phongVan, pk, npc, giaTri: [Tống, Kim], dongTinh: [Tống, Kim] } — mỗi mục { ten, phe, v } | null
export function vinhDanh(ket, ng) {
  const ds = dsDong(ket && ket.bang).map((r) => ({ ten: String(r[0] || ""), phe: p01(r[1]), diem: +r[2] || 0, giet: +r[3] || 0, chet: +r[4] || 0, binh: +r[7] || 0 }));
  const co = new Set(ds.map((x) => x.ten));
  for (const r of dsDong(ng)) if (!co.has(String(r[0] || ""))) ds.push({ ten: String(r[0] || ""), phe: p01(r[1]), diem: +r[2] || 0, giet: +r[3] || 0, chet: +r[4] || 0, binh: +r[7] || 0 });
  const nhat = (L, k) => { let b = null; for (const x of L) if (x[k] > 0 && (!b || x[k] > b[k])) b = x; return b ? { ten: b.ten, phe: b.phe, v: b[k] } : null; };
  const theoPhe = (ph) => ds.filter((x) => x.phe === ph);
  const dau = ds.length ? ds.reduce((b, x) => (x.diem > b.diem ? x : b), ds[0]) : null;
  return { phongVan: dau ? { ten: dau.ten, phe: dau.phe, v: dau.diem } : null, pk: nhat(ds, "giet"), npc: nhat(ds, "binh"),
    giaTri: [0, 1].map((ph) => nhat(theoPhe(ph), "diem")), dongTinh: [0, 1].map((ph) => nhat(theoPhe(ph), "chet")) };
}
// 14 dòng bảng kết thúc (宋金快报): [tên, giá trị, lớp màu?]
// Anh 06/11 xem bảng kết thúc: "đọc không hiểu gì cả" — dòng client (Điểm thắng lợi / Điểm cuối cùng / Đồng điểm / Tống binh đồng tình…) không có nghĩa
// ở S1 -> giữ hình khung client, 14 dòng nói thẳng: kết quả, điểm 2 phe, thành tích của mình, phần thưởng, người giỏi nhất
export function dong14(ket, ng, pheMinh) {
  const K = ket || {}, D = diemPhe(K.diem), V = vinhDanh(K, ng), me = K.me && typeof K.me === "object" ? K.me : null, th = thuongCua(K);
  const thang = p01(K.thang), hs = K.x2 ? HS_X2 : 1, ly = /soái|soai/i.test(String(K.lyDo || "")) ? " · hạ Soái" : "";
  const kem = (x) => (x ? `${x.ten} (${so(x.v)})` : "—"), cong = (v) => (v > 0 ? `+${so(v)}` : "0");
  const khong = me && (+me.diem || 0) < DIEM_MIN ? `chưa đủ ${DIEM_MIN} điểm` : "—";
  return [
    ["Phe thắng", PHE[thang] + ly, LOP[thang]],
    ["Điểm phe Tống", so(D[0]), LOP[0]],
    ["Điểm phe Kim", so(D[1]), LOP[1]],
    ["Hạng của bạn", me && me.hang ? String(me.hang | 0) : "—", ""],
    ["Điểm trận của bạn", so(me ? me.diem : 0), ""],
    ["Chức", me ? CHUC[me.chuc | 0] || CHUC[0] : "—", ""],
    ["Hạ người / quân", me ? `${so(me.giet)} / ${so(me.binh)}` : "—", ""],
    ["Tử vong", so(me ? me.chet : 0), ""],
    ["Điểm Tống Kim", th ? cong(th.diemTk) + (hs > 1 ? ` (×${hs})` : "") : khong, th ? "xanh" : ""],
    ["Kinh nghiệm", th ? cong(th.kn) : khong, th ? "xanh" : ""],
    ["Hồn Thạch", th ? cong(th.ht) : "—", ""],
    ["Huân công bài", th ? cong(th.hc) : "—", ""],
    ["Điểm cao nhất", kem(V.phongVan), ""],
    ["PK nhiều nhất", kem(V.pk), ""],
  ];
}
// Nguyên Soái phe ph: chưa ra -> "sau m:ss" (soaiLuc — máy chủ chốt ở phút soai1; chưa chốt thì mốc sớm nhất soaiMoc[0]); đã ra -> % máu (quân bậc 5
// của TongKim.st.binh) / "đã hạ"
function soaiTt(p, ph, now) {
  const luc = (Array.isArray(p.soaiLuc) && +p.soaiLuc[ph]) || (Array.isArray(p.soaiMoc) && +p.soaiMoc[0]) || 0, st = TongKim.st;
  let e = null;
  if (st && st.binh) for (const x of st.binh.values()) if (x.binh === 5 && x.tkPhe === ph) e = x;
  if (e) return e.alive ? `${Math.max(1, Math.round((e.hp * 100) / Math.max(1, e.hpMax)))}%` : "đã hạ";
  return luc > now ? `sau ${mmss(luc - now)}` : luc ? "đã ra" : "—";
}
// dòng Nguyên Soái: chưa chốt phe nào ra trước -> "phe ít điểm ra sau m:ss"; đã chốt -> từng phe (ngan: chỉ số, màu phe)
function soaiChu(p, now, ngan) {
  const M = Array.isArray(p.soaiMoc) ? p.soaiMoc : null;
  if (!Array.isArray(p.soaiLuc)) return M && +M[0] > now ? `${ngan ? "" : "phe ít điểm ra "}sau ${mmss(+M[0] - now)}` : "—";
  return ngan ? `<span class="song">${soaiTt(p, 0, now)}</span> / <span class="kim">${soaiTt(p, 1, now)}</span>`
    : `${tenP("Tống", 0)} ${soaiTt(p, 0, now)} · ${tenP("Kim", 1)} ${soaiTt(p, 1, now)}`;
}
// giờ: báo danh -> khai chiến sau; đánh -> còn lại; xong -> đã kết thúc
const gioTran = (p, now) => (p.pha === "bd" ? ["Khai chiến:", mmss((+p.kc || 0) - now)] : p.pha === "xong" ? ["Đã kết thúc", ""] : ["Còn lại:", mmss((+p.het || 0) - now)]);

// ---------- HTML ----------
// A — chiến báo tức thời (bố cục 即时战报界面.ini)
function htmlCbA(p, ctx) {
  const now = gioCua(ctx), m = minhCua(p), D = diemPhe(p.diem), pm = pheCua(p, ctx), hang = hangCua(p, ctx.ten), qh = quanHam(m.diem, m.chuc);
  const c = CBA.cot, tong = c.reduce((a, b) => a + b, 0), w = (i) => Math.floor((746 * c[i]) / tong), gio = gioTran(p, now);
  const tren = `<div class="ab" style="top:${CBA.tren}px">`
    + `<span style="width:${w(0)}px"><span class="t">Chiến trường:</span> Tống Kim (Biện Kinh)</span>`
    + `<span style="width:${w(1)}px"><span class="t">Cấp:</span> ${CAP}+</span>`
    + `<span style="width:${w(2)}px"><span class="t">Điều kiện thắng:</span> hạ Nguyên Soái</span>`
    + `<span style="width:${w(3)}px"><span class="t">Tỉ lệ:</span> <span class="song">${so(D[0])}</span>:<span class="kim">${so(D[1])}</span></span>`
    + `<span style="width:${w(4)}px"><span class="t">${gio[0]}</span> ${gio[1]}</span></div>`;
  const g = (L) => L.map(([n, v]) => `<span class="t">${n}</span><span>${v}</span>`).join("");
  const minh = `<div class="dg t" style="top:${CBA.minh + 2}px;left:4px">Thành tích của bạn — phe ${tenP(PHE[pm], pm)}${hang ? ` · hạng ${hang}` : ""}</div>`
    + `<div class="g" style="left:14px;top:${CBA.minh + 24}px">${g([["Tích lũy", so(m.diem)], ["Người chơi PK", so(m.giet)], ["Giết NPC", so(m.binh)]])}</div>`
    + `<div class="g" style="left:390px;top:${CBA.minh + 24}px">${g([["Tử vong", so(m.chet)], ["Liên trảm cao nhất", so(m.lienMax)], ["Liên trảm hiện tại", so(m.lt)]])}</div>`
    + `<div class="dg" style="top:${CBA.minh + 92}px"><span class="t">Điểm phe:</span> ${tenP("Tống " + so(D[0]), 0)} — ${tenP(so(D[1]) + " Kim", 1)} · <span class="t">Nguyên Soái:</span> ${soaiChu(p, now, false)}</div>`
    + `<div class="dg" style="top:${CBA.quanHam - 18}px"><span class="t">Quân hàm:</span> ${CHUC[m.chuc]}${qh.ke ? ` — còn ${so(qh.con)} điểm lên ${qh.ke}` : " — quân hàm cao nhất"}</div>`;
  const T = dsDong(p.top).slice(0, 10);
  const bang = `<table style="top:${CBA.top}px"><colgroup>${COT10.map(([, x]) => `<col style="width:${x}px">`).join("")}</colgroup>`
    + `<tr>${COT10.map(([t]) => `<th>${t}</th>`).join("")}</tr>`
    + T.map((r, i) => `<tr class="${i % 2 ? "chan" : "le"}"><td>${esc(r[0])}</td><td>${CHUC[r[5] | 0] || ""}</td><td>${so(r[7])}</td><td>${so(r[3])}</td><td>${so(r[6])}</td><td>${so(r[4])}</td><td>${so(r[2])}</td></tr>`).join("")
    + `</table>`;
  return tren + `<div class="v" style="top:${CBA.vach1}px"></div>` + minh + `<div class="v" style="top:${CBA.vach2}px"></div>` + bang;
}
// B — cửa sổ Chiến báo (khung 任务记事): mình + 5 người đầu + dòng của mình
function htmlCbB(p, ctx, tong) {
  const now = gioCua(ctx), m = minhCua(p), D = diemPhe(p.diem), pm = pheCua(p, ctx), hang = hangCua(p, ctx.ten), qh = quanHam(m.diem, m.chuc);
  const gio = gioTran(p, now), tg = p.pha === "bd" ? `khai chiến sau ${gio[1]}` : p.pha === "xong" ? "đã kết thúc" : `còn ${gio[1]}`;
  const WS = [28, 130, 90, 50, 80];
  const r = (a, cls = "") => `<div class="r ${cls}">${a.map((t, i) => `<span style="width:${WS[i]}px${i > 1 ? ";text-align:right" : ""}">${t}</span>`).join("")}</div>`;
  const o = (n, v) => `<div class="r"><span style="width:110px">${n}</span><span>${v}</span></div>`;
  const T = dsDong(p.top).slice(0, 5), ten = String(ctx.ten || "");
  const hg = hang ? `hạng ${hang}${tong ? "/" + tong : ""}` : `ngoài 10${tong ? "/" + tong : ""}`;
  const than = `<div class="h">Bạn — phe ${tenP(PHE[pm], pm)} · ${CHUC[m.chuc]} · ${hg}</div>`
    + `<div class="lu">${o("Tích lũy", `<span class="toi">${so(m.diem)}</span>`)}${o("Tử vong", so(m.chet))}${o("Người chơi PK", so(m.giet))}`
    + `${o("Liên trảm", `${so(m.lt)} <span class="xam">(cao nhất ${so(m.lienMax)})</span>`)}${o("Giết NPC", so(m.binh))}`
    + `${qh.ke ? o("Lên " + qh.ke, "còn " + so(qh.con)) : o("Quân hàm", "cao nhất")}</div>`
    + `<div class="thanh"><u style="width:calc(${qh.pt.toFixed(1)}% - 2px)"></u></div>`
    + `<div class="h">Năm người đứng đầu</div>`
    + (T.length ? r(["", "Tên", "Chức", "PK", "Tích lũy"], "xam") + T.map((x, i) => r([i + 1 + ".", tenP(x[0], x[1]), CHUC[x[5] | 0] || "", so(x[3]), so(x[2])], String(x[0]) === ten ? "toi" : "")).join("")
      : `<div class="r xam">Chưa có ai lập công</div>`)
    + (hang >= 1 && hang <= 5 ? "" : `<div class="minh">${r([hang ? hang + "." : "–", tenP(ten, pm), CHUC[m.chuc], so(m.giet), so(m.diem)], "toi")}</div>`);
  return `<div class="tieu">Chiến báo</div>`
    + `<div class="dai">${tenP("Tống " + so(D[0]), 0)} : ${tenP(so(D[1]) + " Kim", 1)} · ${tg} · Nguyên Soái ${soaiChu(p, now, true)}</div>`
    + `<div class="than">${than}</div><div class="dong"></div>`;
}
// A — bảng kết thúc 宋金快报 (14 dòng trên hình client)
function htmlKqA(ket, ctx, p) {
  let h = "";
  dong14(ket, p && p.ng, ctx.phe).forEach(([t, v, c], i) => {
    const y = KQA.y0 + i * KQA.cach;
    h += `<div class="o ten${t.length > 18 ? " hep" : ""}" style="left:${KQA.tenX}px;top:${y}px">${esc(t)}</div>`
      + `<div class="o${c ? " " + c : ""}${String(v).length > 18 ? " hep" : ""}" style="left:${KQA.giaTriX}px;top:${y}px">${esc(v)}</div>`;
  });
  return h + `<div class="dong"></div>`;
}
// B — kết quả khung 排名 "Xếp hạng": cột trái bảng điểm, cột phải phe thắng / mình / 4 ô thưởng / vinh danh
function htmlKqB(ket, ctx, p, dem) {
  const D = diemPhe(ket.diem), thang = p01(ket.thang), me = ket.me && typeof ket.me === "object" ? ket.me : null, th = thuongCua(ket), ten = String(ctx.ten || "");
  const tong = dem[0] + dem[1], V = vinhDanh(ket, p && p.ng), B = dsDong(ket.bang);
  const dong = (h, t, d, ph, cls = "") => `<div class="r ${cls}"><span style="width:26px;text-align:right">${h}</span><span style="width:84px;padding-left:6px">${ph == null ? esc(t) : tenP(t, ph)}</span><span style="width:46px;text-align:right">${d}</span></div>`;
  const trai = dong("Hạng", "Tên", "Điểm", null, "xam")
    + B.slice(0, 10).map((r, i) => dong(i + 1, r[0], so(r[2]), r[1], String(r[0]) === ten ? "toi" : "")).join("")
    + (me && (me.hang | 0) > 10 ? `<div class="r xam" style="justify-content:center">…</div>` + dong(me.hang | 0, me.ten || ten, so(me.diem), me.phe, "toi") : "")
    + (tong ? `<div class="r" style="color:#c9b27a">&nbsp;Phe:&nbsp;${tenP("Tống " + dem[0], 0)}&nbsp;·&nbsp;${tenP(dem[1] + " Kim", 1)}</div>` : "");
  const oMon = (k, n, chu) => { const x = ItemDB.item(k); return `<div class="oT${n > 0 ? "" : " mat"}">${x && x.ic ? `<img src="assets/web/icon/${esc(x.ic)}" alt="" draggable="false">` : `<span>${chu}</span>`}<b>${so(n)}</b></div>`; };
  const ten2 = (x) => (x ? tenP(x.ten, x.phe) : "—");
  const qua = th
    ? `<div class="qua"><div class="oT${th.kn > 0 ? "" : " mat"}"><img src="${KN_HINH}" alt="" draggable="false"></div>${oMon(HT, th.ht, "Hồn<br>Thạch")}${oMon(HC, th.hc, "Huân<br>công")}`
      + `<div class="oT rong"><div><em>+${so(th.diemTk)}</em><span>điểm Tống Kim</span></div></div></div>`
      + `<div class="dg xam">${[th.ht > 0 ? `${tenMon(HT, "Nhạc Vương Hồn Thạch")} ×${th.ht}` : "", th.hc > 0 ? `Huân công bài ×${th.hc}` : ""].filter(Boolean).join(" · ") || "Không có vật phẩm thưởng"}</div>`
    : `<div class="dg xam">${me && (+me.diem || 0) < DIEM_MIN ? `Chưa đủ ${DIEM_MIN} điểm trận — không có thưởng` : "Không có thưởng cuối trận"}</div>`;
  const phai = `<div class="dau ${LOP[thang]}">Phe ${PHE[thang]} thắng</div>`
    + (ket.lyDo ? `<div class="dg xam">${esc(ket.lyDo)}</div>` : "")
    + `<div class="dg">${tenP("Tống " + so(D[0]), 0)} — ${tenP(so(D[1]) + " Kim", 1)}</div>`
    + (me ? `<div class="dg">Bạn: <span class="toi">hạng ${me.hang | 0}${tong ? "/" + tong : ""}</span> · ${so(me.diem)} điểm · ${CHUC[me.chuc | 0] || ""}</div>` : "")
    + `<div class="h">Phần thưởng${th ? ` <span class="xanh">${so(th.kn)} kinh nghiệm</span>` : ""}${ket.x2 ? ` <span class="toi">(Thiên Tử ×${HS_X2})</span>` : ""}</div>` + qua
    + `<div class="h">Vinh danh</div>`
    + `<div class="dg"><span class="xam">Phong Vân</span> ${ten2(V.phongVan)} · <span class="xam">PK</span> ${ten2(V.pk)}${V.pk ? " " + V.pk.v : ""}</div>`
    + `<div class="dg"><span class="xam">NPC Thiên Địch</span> ${ten2(V.npc)}${V.npc ? " " + V.npc.v : ""}</div>`;
  return `<div class="cot1">${trai}</div><div class="cot2">${phai}</div><div class="dong"></div>`;
}

// ---------- điều khiển ----------
export const ChienBao = {
  p: null, ctx: null, dt: null, ket: null, ketKhoa: "", nut: null, cb: null, kq: null, cbMo: false, kqMo: false,
  dem: [0, 0], _cbP: null, _cbLuc: 0, _nutLuc: 0, _day: 0, _dayLuc: 0, _man: "", _phim: null, _phimOn: false,

  // mỗi khung (tongkim.js tick) lúc ở trận thật
  ve(p, ctx) {
    if (!p || typeof p !== "object") { if (ctx) this.an(); else this.boHet(); return; }
    this.p = p; if (ctx) this.ctx = ctx;
    const dt = !!(this.ctx && this.ctx.dt);
    if (dt !== this.dt) { this.dt = dt; this.doiKieu(); }
    this.demNguoi(p);
    this.veNut();
    if (this.cbMo) this.veCb();
    if (this.kqMo && this.kq) this.datCho(this.kq, this.dt ? "kqB" : "kqA");
  },
  // xong trận (1 lần): đóng chiến báo, mở bảng kết thúc; máy tính: phần thưởng của mình thành dòng tin
  ketQua(ket, ctx) {
    if (!ket || typeof ket !== "object") return;
    if (ctx) this.ctx = ctx;
    if (this.dt == null) this.dt = !!(this.ctx && this.ctx.dt);
    this.ket = ket;
    if (this.cbMo) this.dongCb();
    this.moKq();
    const k = [ket.ra, diemPhe(ket.diem).join(":"), ket.thang].join("|");
    if (k !== this.ketKhoa) { this.ketKhoa = k; if (!this.dt) this.baoThuong(ket); }
    if (this.nut) { this._nutLuc = 0; this.veNut(); }
  },
  // số người mỗi phe (người thật p.ng + bot — danh sách bot của tongkim.js / p.b): đếm lúc chưa xong (xong thì máy chủ bỏ bot)
  demNguoi(p) {
    if (p.pha === "xong") return;
    const d = [0, 0];
    for (const r of dsDong(p.ng)) d[p01(r[1])]++;
    const R = TongKim.rows;
    if (R && R.size) for (const o of R.values()) { if (o && Array.isArray(o.r)) d[p01(o.r[2])]++; }
    else for (const r of dsDong(p.b)) d[p01(r[2])]++;
    this.dem = d;
  },
  // nút bật / tắt — ngay dưới bảng gọn #tktt (bảng cao lên thì nút xuống ngay, thấp đi thì 10 giây sau mới lên: dòng tin hạ địch hiện 8 giây — nút
  // không nhảy lên xuống lúc đang bấm); bảng gọn ẩn thì nút ẩn
  veNut() {
    const t = performance.now();
    if (!this.nut) {
      const b = (this.nut = document.createElement("div")); b.id = "tkcb-nut"; b.style.display = "none";
      b.addEventListener("click", (e) => { e.stopPropagation(); this.bam(); });
      document.body.appendChild(b);
    }
    const b = this.nut, mo = this.ket ? this.kqMo : this.cbMo, chu = this.dt ? `Chiến báo ${mo ? "▴" : "▾"}` : `${mo ? "▲" : "▼"} Chiến báo`;
    if (b._chu !== chu) { b._chu = chu; b.textContent = chu; }
    if (t - this._nutLuc < CHO_MS && b.style.display !== "none") return;
    this._nutLuc = t;
    const tt = document.getElementById("tktt"), r = tt && tt.style.display !== "none" ? tt.getBoundingClientRect() : null;
    if (!r || !r.height) { if (b.style.display !== "none") b.style.display = "none"; return; }
    let day = Math.round(r.bottom + (this.dt ? 2 : 3)), man = innerWidth + "x" + innerHeight;
    if (man !== this._man) { this._man = man; this._day = 0; } // đổi cỡ màn: đặt lại ngay
    if (day >= this._day || t - this._dayLuc > 10000) { this._day = day; this._dayLuc = t; } else day = this._day;
    const S = b.style, phai = Math.max(0, Math.round(innerWidth - r.right)) + "px", top = day + "px", rong = this.dt ? Math.round(r.width) + "px" : "";
    if (S.top !== top) S.top = top;
    if (S.right !== phai) S.right = phai;
    if (S.width !== rong) S.width = rong;
    if (S.display === "none") S.display = "";
  },
  bam() {
    if (this.ket) { if (this.kqMo) this.dongKq(); else this.moKq(); }
    else if (this.cbMo) this.dongCb(); else this.moCb();
    this._nutLuc = 0; this.veNut();
  },
  taoEl(id) {
    const el = document.createElement("div"); el.id = id; el.style.display = "none";
    el.addEventListener("click", (e) => { if (e.target.closest(".dong")) { e.stopPropagation(); if (id === "tkkq") this.dongKq(); else this.dongCb(); this._nutLuc = 0; this.veNut(); } });
    document.body.appendChild(el);
    return el;
  },
  // ---------- chiến báo tức thời ----------
  moCb() { this.cbMo = true; this._cbP = null; this.veCb(true); this.ganPhim(); },
  dongCb() { this.cbMo = false; if (this.cb) this.cb.style.display = "none"; this.ganPhim(); },
  veCb(ngay) {
    const p = this.p; if (!p) return;
    const el = this.cb || (this.cb = this.taoEl("tkcb")), lop = this.dt ? "b" : "a", t = performance.now();
    if (el.className !== lop) { el.className = lop; el._sig = ""; el._cho = ""; }
    // dựng lại khi có trạng thái mới hoặc nửa giây (giờ còn lại); chỉ ghi DOM khi khác
    if (ngay || p !== this._cbP || t - this._cbLuc > 500) {
      this._cbP = p; this._cbLuc = t;
      const ctx = this.ctx || {}, h = this.dt ? htmlCbB(p, ctx, this.dem[0] + this.dem[1]) : htmlCbA(p, ctx);
      if (el._sig !== h) { el._sig = h; el.innerHTML = h; }
    }
    this.datCho(el, this.dt ? "cbB" : "cbA", ngay);
    if (el.style.display === "none") el.style.display = "";
  },
  // ---------- bảng kết thúc ----------
  moKq() {
    if (!this.ket) return;
    const el = this.kq || (this.kq = this.taoEl("tkkq")), ctx = this.ctx || {};
    el.className = this.dt ? "b" : "a";
    el.innerHTML = this.dt ? htmlKqB(this.ket, ctx, this.p, this.dem) : htmlKqA(this.ket, ctx, this.p);
    el._cho = ""; this.datCho(el, this.dt ? "kqB" : "kqA", true);
    el.style.display = ""; this.kqMo = true; this.ganPhim();
  },
  dongKq() { this.kqMo = false; if (this.kq) this.kq.style.display = "none"; this.ganPhim(); },
  // máy tính: phần thưởng của mình thành dòng tin ở khung chat (tongkim.js api.msg — như PhongHoa.api.msg)
  baoThuong(ket) {
    const api = TongKim.api; if (!api || typeof api.msg !== "function") return;
    const me = ket.me && typeof ket.me === "object" ? ket.me : null, th = thuongCua(ket);
    if (me) api.msg(`Chiến báo: bạn hạng ${me.hang | 0} · ${so(me.diem)} điểm trận · ${CHUC[me.chuc | 0] || ""} · hạ ${so(me.giet)} người, ${so(me.binh)} quân · tử vong ${so(me.chet)}`, "#ffd54a");
    // dòng phần thưởng: máy chủ gửi qua nhịp (h.tkTin — main.js in ra) — không in ở đây cho khỏi lặp (06/11); chỉ báo khi không có thưởng
    if (!th) api.msg(me && (+me.diem || 0) < DIEM_MIN ? `Chiến báo: chưa đủ ${DIEM_MIN} điểm trận — không có thưởng cuối trận` : "Chiến báo: không có thưởng cuối trận", "#c9b27a");
  },
  // ---------- chỗ đặt ----------
  // cbA: chỗ client trong khung 1024 × 768 giữa màn (màn hẹp thu như uiwin.js), đè bảng gọn thì dịch trái (không đủ chỗ thì thu nhỏ); kqA: giữa màn;
  // cbB / kqB (điện thoại): vừa bề ngang, chiến báo ở y 150 (dưới bản đồ nhỏ — như mẫu), kết quả giữa phần cảnh (--dt-day = đỉnh bảng dưới)
  datCho(el, kieu, ngay) {
    const t = performance.now();
    if (!ngay && t - (el._choLuc || 0) < CHO_MS) return;
    el._choLuc = t;
    const vw = innerWidth, vh = innerHeight, Q = kieu === "cbA" ? CBA : kieu === "kqA" ? KQA : kieu === "cbB" ? KB1 : KB2, W = Q.w, H = Q.h;
    let tl = 0, day = 0;
    if (kieu === "cbA") { const tt = document.getElementById("tktt"); if (tt && tt.style.display !== "none") tl = Math.round(tt.getBoundingClientRect().left); }
    if (kieu === "kqB") day = parseFloat(getComputedStyle(document.body).getPropertyValue("--dt-day")) || 0;
    const k = `${kieu}|${vw}|${vh}|${tl}|${day}`;
    if (el._cho === k) return;
    el._cho = k;
    let s = 1, x = 0, y = 0;
    if (kieu === "cbA") {
      s = Math.min(1, vw / 1024);
      const x0 = (vw - 1024 * s) / 2, y0 = Math.max(0, (vh - 768 * s) / 2);
      x = x0 + CBA.x * s; y = y0 + CBA.y * s;
      if (tl > 0 && x + W * s > tl - 6) { x = Math.max(4, tl - 6 - W * s); if (x + W * s > tl - 6) { s = Math.max(0.5, (tl - 10) / W); x = 4; } }
      y = Math.max(4, Math.min(y, vh - H * s - 4));
    } else if (kieu === "kqA") {
      s = Math.min(1, vw / 1024, (vh - 8) / H); x = (vw - W * s) / 2; y = Math.max(4, (vh - H * s) / 2);
    } else {
      s = Math.min(1, (vw - 8) / W, (vh - 16) / H); x = (vw - W * s) / 2;
      y = kieu === "cbB" ? 150 : (70 + (day > 0 ? day : vh) - H * s) / 2;
      y = Math.max(4, Math.min(y, vh - H * s - 4));
    }
    const S = el.style;
    S.left = Math.round(x) + "px"; S.top = Math.round(y) + "px"; S.transform = s < 0.999 ? `scale(${s.toFixed(4)})` : "";
  },
  // đổi kiểu (xoay màn: điện thoại <-> giao diện máy tính): dựng lại bảng đang mở theo kiểu mới
  doiKieu() {
    this._day = 0; this._nutLuc = 0;
    if (this.nut) this.nut._chu = "";
    if (this.cbMo && this.p) this.veCb(true);
    if (this.kqMo) this.moKq();
  },
  // Esc (bắt trước main.js — GW.esc mở bảng hệ thống): đóng bảng kết thúc trước, rồi chiến báo; đang gõ chữ / bảng khác giữ phím thì thôi
  ganPhim() {
    const can = this.cbMo || this.kqMo;
    if (!this._phim) this._phim = (e) => this.phim(e);
    if (can === this._phimOn) return;
    this._phimOn = can;
    if (can) addEventListener("keydown", this._phim, true); else removeEventListener("keydown", this._phim, true);
  },
  phim(e) {
    if (e.key !== "Escape" || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
    const t = e.target, cua = t === document.body || t === document.documentElement || (t && t.id === "cv") || (t && t.closest && t.closest("#tkcb, #tkkq, #tkcb-nut"));
    if (!cua) return;
    if (this.kqMo) this.dongKq(); else if (this.cbMo) this.dongCb(); else return;
    e.preventDefault(); e.stopPropagation();
    this._nutLuc = 0; if (this.p) this.veNut();
  },
  // tạm mất trạng thái: ẩn nút + chiến báo (giữ cờ mở — có trạng thái lại thì hiện lại); bảng kết thúc giữ nguyên
  an() {
    if (this.nut && this.nut.style.display !== "none") this.nut.style.display = "none";
    if (this.cb && this.cb.style.display !== "none") this.cb.style.display = "none";
    this.p = null;
  },
  // rời trận: bỏ hết
  boHet() {
    for (const el of [this.nut, this.cb, this.kq]) if (el) el.style.display = "none";
    this.cbMo = false; this.kqMo = false; this.ganPhim();
    this.p = null; this.ket = null; this._cbP = null; this._day = 0; this.dem = [0, 0];
  },
};
export default ChienBao;
