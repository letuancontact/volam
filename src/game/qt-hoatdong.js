// Sổ hoạt động của 1 tài khoản (anh 11/11 tối: "bảng admin theo dõi thông tin của 1 người chơi, thì phải xem được hết hoạt động của họ, mua gì, nhặt
// gì, lấy gì" — F10 → Người chơi → chọn tài khoản → Xem hoạt động; máy chủ: may-chu/nhat-ky.js hoatDong, README lượt 75): chọn ngày (ngày có sổ),
// lọc loại, tìm chữ; mới trước. Nhặt gộp mỗi phút 1 dòng.
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const p2 = (n) => String(n).padStart(2, "0");
const gio = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
// nhóm con của Hoạt động (anh 18/11 — mã như may-chu/nhat-ky.js HD_NHOM; quantri.js dùng cho Nhật ký chung)
export const HD_NHOM = [["tk", "Tống Kim"], ["ph", "Phong Hỏa Liên Thành"], ["ld", "Lôi đài, Tỉ thí"], ["dn", "Đua ngựa"], ["va", "Vượt Ải"], ["vd", "Viêm Đế"],
  ["pld", "Phong Lăng Độ"], ["st", "Boss Sát thủ"], ["dt", "Dã Tẩu"], ["nhim", "Săn Nhím"], ["btg", "Boss Hoàng Kim"], ["bd", "Sự kiện Báo Đáp Ân Sư"]];
export const LOAI_HD = [["mua", "Mua"], ["ban", "Bán"], ["nhat", "Nhặt"], ["nhan", "Nhận / mở"], ["ruong", "Rương chứa đồ"], ["dung", "Dùng / vứt / hủy"], ["gd", "Giao dịch"], ["cho", "Chợ trời"], ["kham", "Khảm nạm"],
  ["ktc", "Kỳ Trân Các"], ["xu", "Đổi Xu"], ["hiem", "Đồ hiếm"], ["huy", "Hủy vật phẩm"], ["cap", "Lên cấp"], ["vao", "Đăng nhập"], ["choi", "Vào game"], ["roi", "Rời game"], ["thoat", "Thoát"],
  ["nv", "Nhân vật"], ["ma", "Mã quà"], ["pt", "Phân thân"], ["bc", "Bầu Cua"], ["hd", "Mọi hoạt động"], ...HD_NHOM.map(([k, n]) => ["hd:" + k, "· " + n]), ["mk", "Khóa an toàn"], ["qt", "Quản trị"]];
const TEN = new Map(LOAI_HD), HD_TEN = new Map(HD_NHOM);

export class HoatDongQt {
  constructor(qt, tk) { this.qt = qt; this.tk = tk; this.ngay = ""; this.loai = ""; this.q = ""; this.d = null; this.dang = false; this.henQ = 0; }
  async tai() {
    this.dang = true; this.ve();
    const j = await this.qt.goi("so-hoat-dong", { tk: this.tk, ...(this.ngay ? { ngay: this.ngay } : {}), ...(this.loai ? { loai: [this.loai] } : {}), ...(this.q ? { q: this.q } : {}), n: 1000 });
    this.dang = false; if (j) { this.d = j; this.ngay = j.ngay; } this.ve();
    if (j && !this.daHien) { this.daHien = true; requestAnimationFrame(() => this.qt.hienHd && this.qt.hienHd()); } // lần tải đầu: khung Hoạt động vào vùng nhìn thấy (quantri.js)
  }
  render(box) {
    this.box = box;
    box.innerHTML = `<div class="qhd"><div class="r qhd-loc"></div><div class="qhd-ds"></div></div>`;
    box.addEventListener("click", (e) => { const t = e.target.closest("[data-hd-act]"); if (t && t.dataset.hdAct === "moi") this.tai(); });
    box.addEventListener("change", (e) => { const t = e.target; if (t.dataset.hdIn === "ngay") { this.ngay = t.value; this.tai(); } else if (t.dataset.hdIn === "loai") { this.loai = t.value; this.tai(); } });
    box.addEventListener("input", (e) => { const t = e.target; if (t.dataset.hdIn !== "q") return; this.q = t.value.trim(); clearTimeout(this.henQ); this.henQ = setTimeout(() => this.tai(), 400); });
    if (!this.d && !this.dang) this.tai(); else this.ve();
  }
  ve() {
    if (!this.box || !this.box.isConnected) return;
    const d = this.d, loc = this.box.querySelector(".qhd-loc"), ds = this.box.querySelector(".qhd-ds");
    const ngays = (d && d.ngays) || [], qf = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.hdIn === "q";
    if (!qf) loc.innerHTML = `<span class="k">Ngày</span><select data-hd-in="ngay">${(ngays.length ? ngays : [this.ngay || ""]).map((n) => `<option value="${esc(n)}"${n === this.ngay ? " selected" : ""}>${n ? `${n.slice(8, 10)}/${n.slice(5, 7)}/${n.slice(0, 4)}` : "hôm nay"}</option>`).join("")}</select>
      <select data-hd-in="loai"><option value="">Mọi loại</option>${LOAI_HD.map(([k, n]) => `<option value="${k}"${k === this.loai ? " selected" : ""}>${n}</option>`).join("")}</select>
      <input data-hd-in="q" placeholder="tìm chữ (tên món, nhân vật…)" value="${esc(this.q)}" style="flex:1"><button data-hd-act="moi">Tải lại</button>
      <span class="dv-note">${this.dang ? "Đang tải…" : d ? `${d.tong} dòng${d.tong > d.ds.length ? ` (hiện ${d.ds.length} mới nhất)` : ""}` : ""}</span>`;
    if (!d) { ds.innerHTML = `<div class="dv-note">${this.dang ? "Đang tải…" : ""}</div>`; return; }
    ds.innerHTML = d.ds.length ? d.ds.map((o) => `<div class="qhd-dong"><b class="qt-vang">${gio(o.t)}</b><i class="qhd-loai qhd-${esc(o.l)}">${esc((o.hn && HD_TEN.get(o.hn)) || TEN.get(o.l) || o.l)}</i>${o.nv ? `<span class="qhd-nv">${esc(o.nv)}</span>` : ""}<span>${esc(o.m)}</span></div>`).join("")
      : `<div class="dv-note">Không có dòng nào${this.loai || this.q ? " khớp bộ lọc" : " trong ngày này"}. Sổ hoạt động ghi từ bản 11/11 tối (mua, bán, nhặt, nhận, rương…); trước đó chỉ có các việc của nhật ký chung.</div>`;
  }
}
