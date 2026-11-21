// F10 → thẻ Tìm món (anh 18/11 tối — "sao mà anh làm admin mà ng chơi lấy đồ từ đâu cũng k biết vậy em"): quét trang bị của MỌI tài khoản trên máy đang mở
// bảng (mặc, túi, rương, rương mở rộng, túi tử mẫu, sạp chợ trời) theo tên / mã món, lọc món nhiều dòng tối đa, lọc theo nguồn gốc (không rõ nguồn, quản
// trị tạo…) + danh sách món trùng mã (có thể bị nhân bản). Trỏ vào tên món: ô xem món đủ dòng + Nguồn gốc (itemtip.js — chỉ quản trị thấy).
// Máy chủ: POST /api/quan-tri/tim-mon { q, loc, nguon } -> { quet, tong, ds: [{ tk, nv, noi, it, nd, nMax, n90 }], trung: [{ g, so, ds }], cat? }
// (may-chu/tim-mon.js — chỉ đọc). Nguồn gốc món: may-chu/nguon-mon.js (món sinh ra từ 18/11 tối; đồ có từ trước ghi "Có từ trước khi gắn nguồn").
import { cauNguon, gioNguon } from "./itemtip.js";
import { ItemDB } from "./itemdb.js";
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const so = (n) => Number(n || 0).toLocaleString("vi-VN");

export class TimMonQt {
  constructor(qt) { this.qt = qt; this.f = { q: "", loc: "", nguon: "" }; this.d = null; this.dang = false; }
  render(body) {
    const F = this.f, chon = (v, L) => L.map(([k, n]) => `<option value="${k}"${k === v ? " selected" : ""}>${n}</option>`).join("");
    body.innerHTML = `<div class="qtm">
      <div class="r"><input data-in="q" placeholder="Tên món hoặc mã món" value="${esc(F.q)}">
        <select data-in="loc">${chon(F.loc, [["", "Mọi món"], ["cao", "≥ 4 dòng ≥ 90% mức cao nhất"], ["max", "Mọi dòng ở mức cao nhất"]])}</select>
        <select data-in="nguon">${chon(F.nguon, [["", "Mọi nguồn"], ["?", "Không rõ nguồn"], ["qt", "Quản trị tạo"], ["moi", "Có nguồn (từ 18/11)"], ["cu", "Có từ trước 18/11"]])}</select>
        <button data-tm="tim">Tìm</button></div>
      <div class="dv-note">Quét trang bị của mọi tài khoản trên máy này: đang mặc, túi, rương, túi tử mẫu, sạp chợ trời. Trỏ vào tên món để xem đủ dòng và nguồn gốc. Món sinh ra từ 18/11 tối mới có nguồn; đồ có từ trước ghi "Có từ trước khi gắn nguồn". Để trống ô tên và 2 ô lọc thì chỉ xem món trùng mã.</div>
      <div class="qtm-dem dv-note"></div><div class="qtm-tr"></div><div class="qtm-kq"></div></div>`;
    this.el = body.querySelector(".qtm");
    this.el.addEventListener("click", (e) => { if (e.target.closest("[data-tm='tim']")) this.tim(); });
    this.el.addEventListener("change", (e) => { const t = e.target.closest("[data-in]"); if (t) this.f[t.dataset.in] = t.value; });
    this.el.addEventListener("input", (e) => { const t = e.target.closest("[data-in='q']"); if (t) this.f.q = t.value; });
    this.el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.closest("[data-in='q']")) { e.preventDefault(); this.tim(); } });
    const kq = this.el.querySelector(".qtm-kq");
    kq.onmousemove = (e) => { const t = e.target.closest(".mn"), o = t && this.d && this.d.ds[t.dataset.i]; if (o) this.qt.api.tipMon(o.it, e); else this.qt.api.anTip(); };
    kq.onmouseleave = () => this.qt.api.anTip();
    this.ve();
  }
  async tim() {
    if (this.dang) return;
    this.dang = true; this.ve();
    const j = await this.qt.goi("tim-mon", { q: this.f.q.trim(), loc: this.f.loc, nguon: this.f.nguon });
    this.dang = false;
    if (j) this.d = j;
    this.ve();
  }
  ve() {
    if (!this.el) return;
    const d = this.d, dem = this.el.querySelector(".qtm-dem"), tr = this.el.querySelector(".qtm-tr"), kq = this.el.querySelector(".qtm-kq");
    if (this.dang) { dem.textContent = "Đang quét…"; return; }
    if (!d) { dem.textContent = ""; tr.innerHTML = ""; kq.innerHTML = ""; return; }
    dem.textContent = `Đã quét ${so(d.quet)} tài khoản · ${so(d.tong)} món khớp${d.cat ? ` — hiện ${so(d.ds.length)} món nhiều dòng tối đa nhất` : ""}`;
    tr.innerHTML = d.trung && d.trung.length
      ? `<b>⚠ ${d.trung.length} mã món có ở nhiều chỗ (có thể bị nhân bản):</b> ` + d.trung.map((x) => `<div>· ${esc(x.ds[0].n)} — mã ${esc(x.g)} — ${x.so} chỗ: ${x.ds.map((c) => `${esc(c.tk)} / ${esc(c.nv)} (${esc(c.noi)})`).join(", ")}</div>`).join("")
      : `<span class="dv-note">Không có món trùng mã.</span>`;
    if (!d.ds.length) { kq.innerHTML = `<div class="dv-note">${this.f.q || this.f.loc || this.f.nguon ? "Không có món nào khớp." : ""}</div>`; return; }
    kq.innerHTML = `<div class="qtm-r dau"><span>Tài khoản</span><span>Nhân vật</span><span class="no">Nơi</span><span>Món</span><span class="ng">Nguồn gốc</span></div>` +
      d.ds.map((o, i) => {
        const ng = Array.isArray(o.it.ng) ? o.it.ng : null, l0 = ng ? ng[0] : "", lop = l0 === "?" ? "ng-x" : l0 === "qt" ? "ng-qt" : l0 === "cu" || !ng ? "ng-cu" : "";
        const gio = ng && +ng[2] > 0 ? ` · ${gioNguon(ng[2])}` : "", di = (o.it.di || []).length ? ` · ${o.it.di.length} lần đổi chủ / khảm` : "";
        return `<div class="qtm-r"><span title="${esc(o.tk)}">${esc(o.tk)}</span><span title="${esc(o.nv)}">${esc(o.nv)}</span><span class="no">${esc(o.noi)}</span>` +
          `<span><span class="mn" data-i="${i}">${esc(ItemTen(o))}</span> ${o.nd ? `${o.nd} dòng` : ""}${o.nMax ? ` · <span class="mx">${o.nMax} tối đa</span>` : ""}</span>` +
          `<span class="ng ${lop}" title="${esc(cauNguon(ng) + gio + di)}">${esc(cauNguon(ng))}${esc(gio)}${esc(di)}</span></div>`;
      }).join("");
  }
}
// tên món hiện trong bảng: máy chủ không gửi tên -> lấy từ kho đồ của trình duyệt (ItemDB nạp sẵn lúc vào game)
function ItemTen(o) { const x = ItemDB.item(o.it.k); return x ? String(x.n || o.it.k).trim() : o.it.k; }
