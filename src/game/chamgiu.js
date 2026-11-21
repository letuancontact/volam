// Đè giữ để xem ở máy tính bảng (anh 09/11 — người chơi iPad: "bấm xem đồ k đc", "đè vào nó nó copy", "k có chuột phải nên k xài vật phẩm đc"). Máy bảng lớn giữ giao diện máy tính (dienthoai.js laDienThoai) mà ô xem
// món / chiêu chỉ hiện khi rê chuột (onmousemove của từng ô), chạm thì thành bấm luôn nên không có cách nào xem, cũng không có chuột phải. Đè ngón GIU_MS lên món / chiêu: gửi mousemove cho ô dưới ngón -> ô xem hiện như rê chuột;
// nhả tay ô xem còn nguyên và không thành cú bấm; dưới ô xem của món có hàng nút việc làm như điện thoại (đọc từ dòng gợi ý — dienthoai.js hanhDong: Dùng, Mặc, Tháo, Bán, Tách…, bấm nút = gửi đúng sự kiện chuột vào món).
// Chạm tiếp chỗ khác thì tắt. Chạm nhanh vẫn là bấm như cũ. Chỉ đọc sự kiện touch nên chuột không bị ảnh hưởng; giao diện điện thoại có lớp chạm riêng (dienthoai.js _cham) nên không đụng.
// Hộp "Sao chép" của iOS khi đè: game.css (-webkit-touch-callout, -webkit-user-select).
//   chamGiu(() => GW, () => đang dùng giao diện điện thoại, P.win)
import { hanhDong, nutClient } from "./dienthoai.js";

const GIU_MS = 350, XA = 10; // ngón đi quá XA điểm trước khi đủ GIU_MS: thôi xem (đang vuốt)

export function chamGiu(GW, laDt, W) {
  let g = null, canh = 0;
  const hang = document.createElement("div");
  hang.id = "cg-hanh";
  document.body.appendChild(hang);
  const anHang = () => { clearInterval(canh); hang.style.display = "none"; hang.textContent = ""; };
  const dangXem = () => { const G = GW(); return !!G && [G.itTip, G.skTip].some((t) => t && t.style.display === "block"); };
  const tat = () => { anHang(); const G = GW(); if (G) { G._hideTip(); G._hideSkTip(); } };
  const bo = () => { if (g) clearTimeout(g.t); g = null; };
  // bấm nút việc làm: gửi đúng sự kiện chuột vào món đã đè như dienthoai.js _lam (món vẽ lại thì lấy phần tử ở chỗ đã đè)
  const lam = (c, h) => {
    const el = c.el.isConnected ? c.el : document.elementFromPoint(c.x, c.y);
    tat(); if (!el) return;
    const o = { bubbles: true, cancelable: true, view: window, clientX: c.x, clientY: c.y, ...h.mod };
    if (h.loai === "contextmenu") return void el.dispatchEvent(new MouseEvent("contextmenu", { ...o, button: 2, buttons: 2 }));
    el.dispatchEvent(new MouseEvent("mousedown", { ...o, button: 0, buttons: 1 }));
    el.dispatchEvent(new MouseEvent("mouseup", { ...o, button: 0 }));
    el.dispatchEvent(new MouseEvent("click", { ...o, button: 0 }));
  };
  const nut = (chu, phu, fn) => { const s = document.createElement("span"); s.className = "dt-hn" + (phu ? " dt-hphu" : ""); s.textContent = chu; s.onclick = fn; return s; };
  // hàng nút ngay dưới ô xem (và ô món đang mặc để so), không đủ chỗ thì lên trên; ô xem tắt thì hàng nút tắt theo
  const veHang = (c) => {
    const G = GW(), t = G && G.itTip; if (!t || t.style.display !== "block") return;
    const ds = hanhDong(G.tipHint); if (!ds.length) return;
    hang.replaceChildren(...ds.map((h) => nut(h.chu, h.th, () => lam(c, h))), nut("Đóng", true, tat));
    hang.style.display = "flex"; nutClient(W, hang);
    const R = [t, G.itTip2].filter((x) => x && x.style.display === "block").map((x) => x.getBoundingClientRect()), H = hang.getBoundingClientRect();
    const duoi = Math.max(...R.map((r) => r.bottom)) + 6, tren = Math.min(...R.map((r) => r.top)) - H.height - 6;
    hang.style.top = Math.round(duoi + H.height <= innerHeight - 4 ? duoi : Math.max(4, tren)) + "px";
    hang.style.left = Math.round(Math.max(H.width / 2 + 4, Math.min(innerWidth - H.width / 2 - 4, R[0].left + R[0].width / 2))) + "px";
    clearInterval(canh); canh = setInterval(() => { if (t.style.display !== "block") anHang(); }, 200);
  };
  addEventListener("touchstart", (e) => {
    if (e.target.closest && e.target.closest("#cg-hanh")) return; // chạm nút việc làm: để click tới nút, chưa tắt ô xem
    bo();
    if (laDt()) return;
    tat();
    const t = e.touches[0];
    if (e.touches.length !== 1 || !e.target.closest || !e.target.closest("#jxwin, #jxhud")) return;
    const c = (g = { el: e.target, x: t.clientX, y: t.clientY, xem: false });
    c.t = setTimeout(() => {
      if (g !== c || !c.el.isConnected) return;
      const o = { bubbles: true, cancelable: true, view: window, clientX: c.x, clientY: c.y }, G = GW();
      if (G) G.camUng = true; // ô xem bỏ dòng "Chuột phải: …" như điện thoại — đã có nút (windows.js _showTip)
      c.el.dispatchEvent(new MouseEvent("mouseover", o));
      c.el.dispatchEvent(new MouseEvent("mousemove", o));
      if (G) G.camUng = false;
      c.xem = dangXem();
      if (c.xem) veHang(c);
    }, GIU_MS);
  }, { capture: true, passive: true });
  addEventListener("touchmove", (e) => { const t = e.touches[0]; if (g && !g.xem && t && Math.hypot(t.clientX - g.x, t.clientY - g.y) > XA) bo(); }, { capture: true, passive: true });
  addEventListener("touchend", (e) => { if (g && g.xem && e.cancelable) e.preventDefault(); bo(); }, { capture: true, passive: false }); // đã hiện ô xem: nhả tay không thành cú bấm
  addEventListener("touchcancel", bo, true);
}
