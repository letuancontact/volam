// Nhóm Zalo (anh 09/11: "thêm cái phần icon tham gia nhóm zalo, ng chơi mở ra thì sẽ thêm cái ảnh zalo để họ quét vào nhóm", chọn mẫu A): khung ghép từ khung Thuộc tính khác của client như Trợ Thủ
// (nền + tiêu đề + nút Đóng), giữa khung là mã QR (assets/ui/zalo-qr.png — cắt từ ảnh anh gửi; đổi nhóm thì thay tệp này) + nút Lưu ảnh cho người chơi điện thoại (không quét được chính màn hình của mình).
// Mở: ô 5 cột icon (hud.js) / ô Nhóm Zalo bảng Giang hồ (dienthoai.js) -> onButton("NhomZalo") (main.js).
const QR = "assets/ui/zalo-qr.png";

export class NhomZalo {
  constructor(W, api) {
    this.W = W; this.api = api;
    const O = W.M.other.sec;
    W.M.nhomzalo = { n: "Nhóm Zalo", ini: "(game — ghép từ khung client)", order: ["Main", "Title", "Close"],
      sec: { Main: { ...O.Main, x: 350, y: 120 }, Title: { ...O.Title, x: 58, w: 200, text: "Nhóm Zalo VLTK" }, Close: O.Close } };
    const w = (this.w = W.get("nhomzalo"));
    w.item("Title").el.classList.add("jw-drag");
    const box = document.createElement("div");
    box.className = "tt jw-drag zl-qr";
    box.innerHTML = `<img src="${QR}" alt="Mã QR nhóm Zalo VLTK" draggable="false"><p></p><span class="tt-b" data-click="1">Lưu ảnh</span>`;
    this.ghi = box.querySelector("p");
    box.querySelector(".tt-b").onclick = () => this.luu();
    w.el.appendChild(box);
  }
  open() {
    const dt = document.body.classList.contains("dt");
    this.ghi.textContent = dt ? "Bấm Lưu ảnh, mở Zalo, quét mã rồi chọn ảnh vừa lưu" : "Mở Zalo trên điện thoại, quét mã để vào nhóm VLTK";
    if (!dt && !this.w.daKeo) { // giữa màn hình; kéo tay rồi thì giữ chỗ
      const r = this.W.root.getBoundingClientRect(), s = r.width / 1024 || 1, M = this.W.M.nhomzalo.sec.Main;
      this.w.el.style.left = Math.round((innerWidth / 2 - r.left) / s - M.w / 2) + "px";
      this.w.el.style.top = Math.round((innerHeight / 2 - r.top) / s - M.h / 2) + "px";
    }
    this.w.show();
    this.api.P.audio.ui("click");
  }
  toggle() { if (this.w.visible) this.w.hide(); else this.open(); }
  luu() {
    this.api.P.audio.ui("click");
    const a = document.createElement("a");
    a.href = QR; a.download = "nhom-zalo-vltk.png";
    document.body.appendChild(a); a.click(); a.remove();
    this.api.msg("Đang lưu ảnh mã QR nhóm Zalo");
  }
}
