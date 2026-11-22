"use strict";
const DO = require("./do.js");
const N = DO.NOI;
const BHO = () => require("./bang-hoi");
const Y = (t) => "<color=yellow>" + t + "<color>";
const KHOA = "<color=green>Vật phẩm thưởng được khóa bảo hiểm vĩnh viễn.<color>";
const QUA = [
  { ngay: 1, tien: 100000, do: [["ms:1884", 1]] },
  { ngay: 2, tien: 150000, do: [["ms:71", 1]], ch: 30 },
  { ngay: 3, tien: 200000, do: [["ms:1884", 2], ["ms:122", 1]] },
  { ngay: 4, tien: 250000, do: [["ms:71", 1]], ch: 50 },
  { ngay: 5, tien: 300000, do: [["ms:1884", 3], ["ms:125", 1]] },
  { ngay: 6, tien: 400000, do: [["ms:1181", 1]], ch: 80 },
  { ngay: 7, tien: 500000, do: [["ms:1884", 5]], xu: 2, ch: 100 }
];

function tenQua(q) {
  const ds = [];
  if (q.tien > 0) ds.push(N.tien(q.tien));
  for (const [k, n] of q.do || []) { const x = N.BY.get(k); if (x) ds.push(((n | 0) > 1 ? n + " " : "") + x.n.trim()); }
  if (q.xu > 0) ds.push(q.xu + " Xu");
  if (q.ch > 0) ds.push(q.ch + " Cống hiến bang");
  return ds.join(" + ");
}
function trangThai(tk, t = Date.now()) {
  const hom = N.ngayVN(t);
  if (!tk.dd7 || typeof tk.dd7 !== "object") tk.dd7 = { buoc: 0, ngay: "", vong: 1 };
  const d = tk.dd7;
  const daHomNay = d.ngay === hom;
  if (!daHomNay && (d.buoc | 0) >= QUA.length) { d.buoc = 0; d.vong = (d.vong | 0 || 1) + 1; }
  return { d, hom, daHomNay, buoc: Math.max(0, Math.min(QUA.length, d.buoc | 0)) };
}
function coNhan(tk, t = Date.now()) {
  if (!tk) return false;
  const d = tk.dd7;
  return !d || d.ngay !== N.ngayVN(t);
}
function khung(tk) {
  const st = trangThai(tk);
  const dong = QUA.map((q, i) => {
    const tt = i < st.buoc ? "đã nhận" : (!st.daHomNay && i === st.buoc ? "<color=green>có thể nhận<color>" : "chưa tới");
    return "Ngày " + q.ngay + ": " + Y(tenQua(q)) + " — " + tt;
  });
  const dau = "Điểm danh 7 ngày (chu kỳ " + (st.d.vong | 0 || 1) + " — " + st.buoc + "/7 ngày)" + (st.daHomNay ? " — hôm nay đã nhận." : ".");
  const opts = st.daHomNay ? [["Kết thúc", null]] : [["Điểm danh nhận quà Ngày " + (st.buoc + 1), "nhan"], ["Kết thúc", null]];
  return { say: { text: [dau, ...dong, KHOA].join("<enter>"), opts } };
}
function lam(tk, h, b) {
  const st = trangThai(tk);
  if (b.viec !== "nhan") return khung(tk);
  if (st.daHomNay) return { tin: ["Hôm nay tài khoản đã điểm danh rồi — ngày mai quay lại nhé!"], ...khung(tk) };
  const q = QUA[st.buoc];
  if (!q) return khung(tk);
  const truoc = h.bag.map((o) => ({ ...o })), uN = h.uN;
  try { for (const [k, n] of q.do || []) { const x = N.BY.get(k); if (x) N.themChong(h, x, n | 0 || 1, N.KBH_VV); } }
  catch { h.bag = truoc; h.uN = uN; return { tin: ["Không đủ ô trống trong hành trang của đại hiệp!"], ...khung(tk) }; }
  if (q.tien > 0) h.gold = (h.gold || 0) + q.tien;
  if (q.xu > 0) h.xu = (h.xu | 0) + q.xu;
  let congOk = false;
  if (q.ch > 0) { try { const B = BHO(); if (B.idCua && B.idCua(tk.ten)) { B.cong(tk.ten, null, h.name, "dd7", q.ch); congOk = true; } } catch {} }
  st.d.buoc = st.buoc + 1;
  st.d.ngay = st.hom;
  if (!st.d.vong) st.d.vong = 1;
  const msg = "Điểm danh Ngày " + q.ngay + ": nhận được " + tenQua(q) + (q.ch > 0 && !congOk ? " (chưa vào bang nên bỏ qua Cống hiến)" : "");
  return { tin: [msg], ...khung(tk) };
}
module.exports = { coNhan, lam, QUA };
