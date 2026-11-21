// Biểu cảm chat như client (anh 31/10 "thêm hệ thống biểu cảm"). Client \Ui\表情大全.ini: 139 mặt — tên, mã gõ (":)", ":D", "(kl)"…), hình động
// (cong-cu/dung-bieu-cam.mjs -> assets/ui/bieu-cam.json + assets/ui/bieu-cam/*.png, mọi khung xếp ngang). Chat gửi mã chữ như client (máy chủ
// không đổi gì); dòng chat (khung chat máy tính, khung chat + 2 dòng tin của điện thoại) đổi mã thành hình động — dải khung chạy bằng CSS
// steps (game.css .bc). Bảng chọn = KUiFaceSelector (ui\ui3\表情符号选择窗口.ini): ô 26 × 26; bảng nhỏ 5 cột × 6 hàng, ô cuối "Biểu thị nhiều
// hơn"; bảng lớn 10 cột × 6 hàng mỗi trang, 2 ô cuối đúng chỗ [BtnLess] / [BtnMore] của ini ("Biểu thị ít hơn" -> bảng nhỏ, "nhiều hơn" ->
// trang sau); nền 0,0,0, ô dưới chuột 54,86,68, viền 87,85,79. Rê chuột: ô gợi ý của game (data-tip — windows.js _tipChu) tên + mã; bấm mặt:
// chèn mã vào ô gõ chat ở chỗ con trỏ rồi đóng bảng (như client). Nút mở: Face của thanh dưới (main.js), nút biểu cảm khung chat điện thoại
const BASE = "assets/ui/";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rgb = (c) => `rgb(${c.join(",")})`;
const MOI_DONG = 20; // tối đa số hình mỗi dòng chat (mã thừa giữ chữ)

export const BieuCam = {
  J: null, ds: [], theoMa: new Map(), re: null, lon: false, trang: 0,
  nap(J) {
    if (!J || !Array.isArray(J.ds) || !J.ds.length) return;
    this.J = J; this.ds = J.ds; this.theoMa = new Map(J.ds.map((x) => [x.ma, x]));
    this.re = new RegExp(J.ds.map((x) => x.ma).sort((a, b) => b.length - a.length).map(reEsc).join("|"), "g"); // mã dài khớp trước: "!:D" trước ":D"
  },
  // 1 mặt: <i class="bc"> đúng cỡ hình; nhiều khung thì chạy (--n khung, --w bề ngang 1 khung, mỗi khung ms của .spr)
  hinh(x) {
    const chay = x.n > 1 ? `;--n:${x.n};--w:${x.w}px;animation-duration:${x.n * x.ms}ms` : "";
    return `<i class="bc${x.n > 1 ? " chay" : ""}" style="width:${x.w}px;height:${x.h}px;background-image:url(${BASE}${x.file})${chay}"></i>`;
  },
  // chữ chat -> HTML: mã thành hình, phần còn lại thoát HTML
  html(t) {
    t = String(t ?? "");
    if (!this.re) return esc(t);
    let out = "", i = 0, so = 0;
    for (const m of t.matchAll(this.re)) {
      if (so >= MOI_DONG) break;
      out += esc(t.slice(i, m.index)) + this.hinh(this.theoMa.get(m[0]));
      i = m.index + m[0].length; so++;
    }
    return out + esc(t.slice(i));
  },
  // chèn mã vào ô gõ ở chỗ con trỏ (không quá maxlength của ô)
  chen(input, ma) {
    if (!input) return;
    const max = input.maxLength > 0 ? input.maxLength : 1e9, a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a;
    if (input.value.length - (b - a) + ma.length > max) return false;
    input.setRangeText(ma, a, b, "end");
    return true;
  },
  // bảng chọn ở trên nút mở (phần tử); bấm mặt -> chon(mã). Bấm lại nút mở / chỗ khác: đóng
  mo(nutMo, chon) {
    const cu = document.querySelector(".bc-chon"); if (cu) { cu.remove(); return true; }
    if (!this.J || !nutMo) return false;
    const neo = nutMo.getBoundingClientRect();
    const C = this.J.chon, m = document.createElement("div");
    m.className = "bc-chon";
    Object.assign(m.style, { background: rgb(C.nen), borderColor: rgb(C.vien) });
    m.style.setProperty("--re", rgb(C.nenRe));
    const nut = (v, n) => n ? `<div data-v="${v}" data-tip="${esc(n.tip)}"><i style="width:${n.w}px;height:${n.h}px;background-image:url(${BASE}${n.file})"></i></div>` : "";
    const ve = () => {
      const cot = this.lon ? C.cotLon : C.cot, so = cot * C.hang - (this.lon ? 2 : 1), trang = Math.max(1, Math.ceil(this.ds.length / so));
      if (this.trang >= trang) this.trang = 0;
      const dau = this.lon ? this.trang * so : 0, o = [];
      for (let k = 0; k < so; k++) { const x = this.ds[dau + k]; o.push(x ? `<div data-i="${dau + k}" data-tip="${esc(x.ten)}  ${esc(x.ma)}">${this.hinh(x)}</div>` : `<div class="trong"></div>`); }
      m.style.gridTemplateColumns = `repeat(${cot}, var(--o))`;
      m.innerHTML = o.join("") + (this.lon ? nut("bot", C.bot) : "") + nut("them", C.them);
      dat();
    };
    // trên nút mở, mép trái thẳng nút (không lòi khỏi màn)
    const dat = () => {
      const w = m.offsetWidth, h = m.offsetHeight;
      m.style.left = Math.round(Math.max(4, Math.min(innerWidth - w - 4, neo.left))) + "px";
      m.style.top = Math.round(Math.max(4, neo.top - h - 4)) + "px";
    };
    m.onclick = (e) => {
      const d = e.target.closest("[data-i], [data-v]"); if (!d) return;
      if (d.dataset.v === "them") { if (this.lon) this.trang++; else { this.lon = true; this.trang = 0; } return ve(); }
      if (d.dataset.v === "bot") { this.lon = false; return ve(); }
      const x = this.ds[+d.dataset.i]; if (!x) return;
      dong(); chon(x.ma);
    };
    const ngoai = (e) => { if (!m.contains(e.target) && !nutMo.contains(e.target)) dong(); }; // nút mở: để click của nó đóng (bật / tắt)
    const dong = () => { m.remove(); removeEventListener("pointerdown", ngoai, true); };
    document.body.appendChild(m);
    ve();
    setTimeout(() => addEventListener("pointerdown", ngoai, true), 0);
    return true;
  },
};
