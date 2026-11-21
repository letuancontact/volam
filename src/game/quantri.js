// Bảng quản trị (anh 28/10 "làm bảng quản trị trong game cho tài khoản quản trị: người chơi, khóa / đá, gửi quà, thông báo, nhật ký hoạt
// động"): chỉ tài khoản quản trị (Net.me.admin), phím F10 (F9 là PK như client). Cùng kiểu bảng Công cụ thử (src/game/devtool.js — lớp .dv), mở giữa màn hình, kéo
// được bằng thanh tiêu đề. Hỏi xác nhận bằng khung client (GW.hoi — api.hoi). Máy chủ: may-chu/quan-tri.js, nhật ký may-chu/nhat-ky.js.
//   Dòng trên: tình trạng máy chủ (đang chơi, số tài khoản, thời gian chạy, RAM, sao lưu gần nhất) — bảng mở thì tự làm mới DS_MS.
//   Người chơi: danh sách tài khoản (đang chơi / vắng / bị khóa, nhân vật, IP); bấm 1 dòng: chi tiết — Đá ra / Khóa (thời hạn) / Mở khóa /
//     Đổi mật khẩu, từng nhân vật: ngân lượng, Xu, đồ mặc / túi / rương, Soi đồ (anh 30/10: khung Trang bị của client cho nhân vật đó — trỏ
//     / chạm món xem đủ chi tiết; windows.js soiDo), Gửi quà (ngân lượng, Xu, vật phẩm tìm theo tên — trang bị chọn số dòng xanh + ngũ hành). Tạo tài khoản thường. Đổi mật khẩu của tôi (anh 29/10): tài khoản quản trị đang dùng bảng — cần mật khẩu hiện tại,
//     giữ phiên đang chơi (ô nhập che chữ bằng CSS .qt-an — không dùng type=password).
//   Nhật ký: chọn ngày, loại việc, tài khoản, chữ cần tìm — mới trước. Tự cập nhật (anh 03/11 "cái của gm có thêm nút làm mới hay cập nhật theo
//     thời gian thực dc k"): xem ngày mới nhất thì mỗi NK_MS tải lại (ô Tự cập nhật — mặc định bật), dòng mới tô sáng, đang cuộn xuống thì giữ chỗ.
//     Tên món có kèm bản chụp (anh 04/11 "người chơi rớt đồ xịn thì acc GM cũng xem được đó là món gì dòng nào" — nhặt đồ hiếm, chợ trời, giao dịch;
//     may-chu/nhat-ky.js mon) tô màu, trỏ chuột vào: ô xem món như client (monChu — api.tipMon).
//   Bảo trì (anh 31/10 khuya — may-chu/bao-tri.js): nút Bảo trì -> giờ mở (giờ Việt Nam) + lời nhắn: chỉ tài khoản quản trị vào game, tới giờ
//     tự mở; Tắt = mở ngay. Dòng trên báo đang bảo trì tới giờ nào.
//   Nghi tăng tốc trình duyệt (may-chu/chong-hack.js): tài khoản bị đánh dấu hiện đỏ ở danh sách + chi tiết (số lần, đồng hồ ×, nhịp / giây,
//     nhân vật), dòng trên đếm số tài khoản; "Xóa cờ" sau khi đã nhắc. Nhật ký loại "Gian lận".
//   Nghi dùng công cụ tự động (anh 13/11 — may-chu/nghi-tool.js, npc-gan.js; công cụ "S2 PRO AUTO"): tài khoản có cờ hiện ⚠ ở danh sách (đỏ: tín hiệu mạnh; vàng: chỉ
//     tín hiệu yếu — xa NPC chỉ ghi, móc fetch…) + chi tiết (mã, số lần, ~8 dòng bằng chứng mới nhất), lọc "Nghi dùng công cụ", "Xóa cờ" sau khi xem. Không tự khóa —
//     anh tự quyết. Nhật ký loại "Công cụ". "Treo 24/7" là nhãn riêng (chưa làm).
//   Thông báo: 1 dòng tới mọi người đang chơi (tin hệ thống ở khung chat + loaThongBao). Ghim ở khung chat (anh 03/11): dòng [Ghim] đầu khung
//     chat của mọi người (cả người vào sau — may-chu/quan-tri.js ghim, hud.js ghim), Ghim mới thay ghim cũ, Bỏ ghim.
//   Mã quà (anh 29/10): tạo mã kích hoạt (mã tự đặt / tự sinh, quà như Gửi quà, số lượt, hạn dùng) — người chơi nhập ở Lễ quan Ba Lăng;
//     danh sách mã: tình trạng, ai đã dùng, Sửa (gia hạn, số lượt, quà, lời nhắn — anh 09/11), Tắt / Mở lại / Xóa (may-chu/ma-qua.js).
//     Ô "Khóa vĩnh viễn" ở dòng Hạn dùng (anh 11/11): món nhận từ mã khóa bảo hiểm vĩnh viễn — ô riêng (maForm.maKhoa), không dính ô của Gửi thẳng.
// loaThongBao(text): dòng chữ vàng giữa trên màn hình LOA_MS (mọi người chơi — main.js gọi khi nhịp nhận tin qt của máy chủ).
// api = { me() -> Net.me, hoi(html, ok, huy) -> Promise<bool>, msg(text), facName(fac, series), soiDo(nv), tipMon(món, chuột), anTip() }
import { Net } from "./net.js";
import { boMau } from "./npcdlg.js"; // loa thông báo: bỏ thẻ màu của tin hệ thống
import { ItemDB } from "./itemdb.js";
import { fmtMoney } from "./money.js";
import { CauHinhQt } from "./qt-cauhinh.js"; // thẻ Cấu hình: sửa thông số máy chủ, khởi động lại an toàn, bắt F5 (anh 11/11)
import { HoatDongQt, HD_NHOM } from "./qt-hoatdong.js"; // Người chơi → Xem hoạt động: sổ riêng từng tài khoản (anh 11/11)
import { TimMonQt } from "./qt-timmon.js"; // thẻ Tìm món: quét trang bị mọi tài khoản + nguồn gốc + món trùng mã (anh 18/11 tối)

// anh 11/11 (máy chủ lag lúc ~130 người, ~530 tài khoản): mỗi lần tải danh sách máy chủ đọc lại toàn bộ tệp tài khoản (cả máy chủ đứng 0,1–0,6 giây),
// nhật ký đọc lại cả ngày -> bảng mở thì 30 giây / 15 giây 1 lần (trước 10 / 5)
const DS_MS = 30000, TIM_MS = 250, LOA_MS = 10000, NK_MS = 15000;
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const LOAI = { vao: "Đăng nhập", "sai-mk": "Sai mật khẩu", choi: "Vào game", roi: "Rời game", thoat: "Đăng xuất", nv: "Nhân vật", cap: "Lên cấp", hiem: "Đồ hiếm", ktc: "Kỳ Trân Các", xu: "Đổi Xu", qt: "Quản trị", tb: "Thông báo", ma: "Mã kích hoạt", gd: "Giao dịch", cho: "Chợ trời", hack: "Gian lận", tool: "Công cụ", sao: "Sao chép", huy: "Hủy vật phẩm", pt: "Phân thân", bc: "Bầu Cua", hd: "Hoạt động", mk: "Mật khẩu", bh: "Bang hội", kham: "Khảm nạm", nguon: "Không rõ nguồn" }; // bc: đặt cửa / thắng thua Bầu Cua (may-chu/bau-cua.js — 10/11); mk: khóa an toàn — mật khẩu cấp 2, đổi mật khẩu, nhập sai (may-chu/bao-mat.js — 10/11); bh: lập, vào, rời, đuổi, bổ nhiệm, chuyển vị, giải tán, quản trị sửa (may-chu/bang-hoi.js — anh 14/11)
// nhóm con của Hoạt động (anh 18/11: "chia ra cái hoạt động với thêm khảm nạm, để biết được người chơi làm những gì" — máy chủ xếp theo tên hoạt động đứng
// đầu câu: may-chu/nhat-ky.js HD_NHOM, cùng mã); danh sách HD_NHOM ở qt-hoatdong.js (dùng chung với sổ hoạt động từng tài khoản)
const HD_TEN = new Map(HD_NHOM);
// ô chọn nhóm: mục có cờ thứ 3 nằm trong nhóm "Hoạt động" (optgroup)
const chonNhom = (ds, chon) => { let s = "", trong = false; for (const [v, n, g] of ds) { if (g && !trong) { s += `<optgroup label="Hoạt động">`; trong = true; } else if (!g && trong) { s += "</optgroup>"; trong = false; } s += `<option value="${v}"${v === chon ? " selected" : ""}>${n}</option>`; } return s + (trong ? "</optgroup>" : ""); };
const NHOM = [["", "Mọi việc"], ["vao,sai-mk,choi,roi,thoat", "Vào / ra"], ["mk,sai-mk", "Mật khẩu, khóa an toàn"], ["nv,cap", "Nhân vật, lên cấp"], ["hiem", "Đồ hiếm"], ["gd,cho", "Giao dịch, chợ trời"], ["huy", "Hủy vật phẩm (Lễ quan)"], ["pt", "Thuê phân thân"], ["bc", "Bầu Cua"], ["bh", "Bang hội"], ["ktc,xu", "Kỳ Trân Các, đổi Xu"], ["ma", "Mã kích hoạt"], ["hd", "Mọi hoạt động", 1], ...HD_NHOM.map(([k, n]) => ["hd:" + k, n, 1]), ["kham", "Khảm nạm"], ["nguon", "Món không rõ nguồn"], ["qt,tb", "Quản trị, thông báo"], ["hack", "Gian lận (tăng tốc)"], ["tool", "Nghi dùng công cụ (gọi NPC từ xa, x-trang, dò trình duyệt)"], ["sao", "Chống sao chép (trang ngoài, tải trộm)"]]; // sao: may-chu/chong-sao-chep.js (anh 10/11); tool: may-chu/nghi-tool.js (anh 13/11)
// nghi dùng công cụ (anh 13/11 — may-chu/nghi-tool.js): tên từng mã tín hiệu; mã yếu (có thể do tiện ích hợp lệ / thao tác lạ của người thật) tô vàng
const MA_TOOL = { "xa-npc": "việc NPC gọi từ bản đồ khác (đã chặn)", "xa-npc-log": "thao tác xa NPC (chỉ ghi)", "xa-npc-gan": "việc của NPC khi đứng xa, cùng bản đồ (đã chặn)",
  "npc-vi-tri": "việc của NPC khi chưa rõ chỗ đứng (đã chặn)", "tu-lam-xa": "Tự làm gọi khi không ở bản đồ của NPC (đã chặn)", "x-trang": "gọi API ngoài trang game (x-trang)", "sec-fetch": "gọi API từ trang khác (Sec-Fetch-Site)",
  "dct:chu": "chữ bảng công cụ trên trang", "dct:an": "giả trạng thái tab (tiện ích giữ tab luôn mở / chống ngủ tab cũng gây ra — chưa chắc là công cụ)", "dct:fetch": "móc fetch", "dct:xhr": "móc XMLHttpRequest", "dct:ws": "móc WebSocket", "dct:wd": "trình duyệt tự động (webdriver)" };
// anh 13/11 tối (nhiều người chỉ dính "an" bị khóa, họ không phục): dct:an cũng là tín hiệu YẾU — tiện ích giữ tab luôn mở chạy trên mọi trang. Đỏ / vàng tính ở đây từ mã
// (không theo manh của máy chủ — bản máy chủ cũ chưa khởi động lại vẫn coi an là mạnh)
const TOOL_YEU = new Set(["xa-npc-log", "xa-npc-gan", "npc-vi-tri", "tu-lam-xa", "dct:an", "dct:fetch", "dct:xhr", "dct:ws"]);
const laManh = (c) => !!c && (c.ma || []).some((m) => !TOOL_YEU.has(m));
const tenMaTool = (m) => MA_TOOL[m] || (String(m).startsWith("dct:") ? `trình duyệt dò: ${String(m).slice(4)}` : String(m));
const KHOA_GIO = [[1, "1 giờ"], [24, "1 ngày"], [168, "7 ngày"], [720, "30 ngày"], [0, "Vĩnh viễn"]];
const MA_HAN = [[0, "Không hạn"], [1, "1 ngày"], [3, "3 ngày"], [7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"]];
const MA_TT = { mo: ["qt-xanh", "Đang dùng được"], tat: ["qt-do", "Đã tắt"], het: ["qt-do", "Hết hạn"], day: ["qt-vang", "Hết lượt"] };
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// chữ đưa vào khung hỏi client (richText tự thoát HTML; bỏ < > để chữ người gõ không thành thẻ màu)
const rt = (t) => String(t ?? "").replace(/[<>]/g, "");
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const so = (n) => Math.round(n || 0).toLocaleString("vi-VN");
// giờ Việt Nam (như ngày của nhật ký — may-chu/nhat-ky.js): "21:05 28/10" | giay: "21:05:12"
const p2 = (n) => String(n).padStart(2, "0");
function luc(t, giay) {
  if (!t) return "—";
  const d = new Date(t + 7 * 3600e3), g = `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
  return giay ? `${g}:${p2(d.getUTCSeconds())}` : `${g} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`;
}
const mb = (b) => `${so(b / 1048576)} MB`;
const gb = (b) => (b / 1073741824).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
function thoiGian(s) { const g = Math.floor(s / 3600), p = Math.floor((s % 3600) / 60); return g >= 24 ? `${Math.floor(g / 24)} ngày ${g % 24} giờ` : g ? `${g} giờ ${p} phút` : `${p} phút`; }
const icon = (m) => (m.ic ? `<img loading="lazy" src="assets/web/icon/${esc(m.ic)}" alt="">` : `<img alt="">`);
// 1 món: tên + số dòng xanh / số lượng
const tenMon = (m) => `${esc(m.n)}${m.d ? ` <i class="qt-xanh">(${m.d} dòng)</i>` : ""}${m.sl > 1 ? ` ×${m.sl}` : ""}${m.con != null ? ` (còn ${m.con})` : ""}`;

export function loaThongBao(text) {
  let el = document.querySelector(".qt-loa");
  if (!el) { el = document.createElement("div"); el.className = "qt-loa"; document.body.appendChild(el); }
  el.textContent = boMau(text);
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  clearTimeout(el._het); el._het = setTimeout(() => el.classList.remove("on"), LOA_MS);
}

export class QuanTri {
  constructor(api) {
    this.api = api;
    this.el = null;
    this.tab = "nguoi";
    this.ds = null; this.may = null;
    this.loc = { q: "", kieu: "tat", vang: 0 }; // vang: vắng ≥ N ngày (anh 17/11 — 0 = không lọc)
    this.tich = new Set();                // tài khoản đã tích để thao tác hàng loạt (anh 17/11) — đổi bộ lọc thì bỏ chọn hết
    this.chon = null; this.ct = null;     // tài khoản đang xem + chi tiết (máy chủ)
    this.xemDo = new Set();               // ô nhân vật đang mở danh sách đồ
    this.qua = null;                      // khung gửi quà { o, mon: [{ k, n, loai, ic, so, dong, he }], kq: kết quả tìm }
    this.nk = { ngay: "", loai: "", tk: "", q: "", ds: null, ngays: [], tong: 0, tu: 1 }; // tu: tự cập nhật (ngày mới nhất)
    this.tb = null;                       // thông báo đã gửi hôm nay
    this.maDs = null; this.maMo = new Set(); // thẻ Mã quà: danh sách mã (máy chủ) + mã đang mở danh sách người đã dùng
    this.maForm = { o: -1, mon: [], tien: 0, xu: 0, loi: "", tim: "", kq: [] }; // quà của mã đang tạo (dùng chỗ this.qua khi ở thẻ Mã quà)
    this.maSua = null;                    // mã đang sửa { ma, toiDa, daDung, het } — thẻ Mã quà dùng khung tạo mã để sửa | null
    this.taoTk = false;
    this.hen = 0; this.timHen = 0; this.henNk = 0;
  }

  get on() { return !!(this.el && this.el.classList.contains("on")); }
  // mở bảng: khóa an toàn trước (anh 10/11 — tài khoản quản trị bắt buộc có mật khẩu cấp 2, mở F10 phải mở khóa: main.js api.khoa -> khoaantoan.js
  // dam); bấm Hủy thì không mở. Tự tải lại (10 s / 5 s) gọi ngầm (goi im) — không bật khung hỏi
  async toggle(force) {
    const on = force ?? !this.on;
    // đóng: không cần phiên (mất phiên — Net.me đã null — vẫn đóng được, dừng tự tải lại — rà soát 10/11)
    if (!on) { if (this.el) { this.el.classList.remove("on"); this.api.anTip(); } clearInterval(this.hen); clearInterval(this.henNk); return; }
    const me = this.api.me();
    if (!me || !me.admin) return;
    if (!this.el) this.build();
    if (!this.on && this.api.khoa && !(await this.api.khoa("Mở bảng quản trị (F10) cần mở khóa an toàn"))) return;
    this.el.classList.add("on");
    clearInterval(this.hen); clearInterval(this.henNk);
    this.render(); this.taiDs(); this.hen = setInterval(() => this.taiDs(), DS_MS); this.henNk = setInterval(() => this.tuNk(), NK_MS);
  }

  build() {
    const el = (this.el = document.createElement("div"));
    el.className = "dv qt";
    // tiêu đề + ✕ 1 dòng, các thẻ ở lưới đều bên dưới (soát 17/11 — anh "xem lại bố cục kích thước các tab … tránh vỡ form": trước thẻ xuống hàng tự do, dòng dưới lẻ
    // 2 thẻ + ✕; game.css .qt-tabs: 6 cột, khung hẹp / điện thoại 4 cột)
    el.innerHTML = `<div class="dv-head"><b>Quản trị máy chủ</b><button data-act="dong" title="Đóng (F10)">✕</button><div class="qt-tabs">${[["nguoi", "Người chơi"], ["nk", "Nhật ký"], ["tb", "Thông báo"], ["ma", "Quà & mã"], ["lich", "Lịch hoạt động"], ["bot", "Bot mẫu"], ["timmon", "Tìm món"], ["cauhinh", "Cấu hình"]]
      .map(([k, n]) => `<button class="dv-tab" data-tab="${k}">${n}</button>`).join("")}</div></div>
      <div class="qt-may dv-note"></div><div class="qt-bao"></div><div class="dv-body"></div>`;
    // ngay trước lớp cửa sổ client (#jxwin, cùng z-index): bảng nằm trên HUD nhưng dưới khung hỏi xác nhận / cửa sổ client
    const win = document.getElementById("jxwin");
    if (win && win.parentNode === document.body) document.body.insertBefore(el, win); else document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab],[data-act]");
      if (!t) return;
      if (t.dataset.tab) { this.tab = t.dataset.tab; this.render(); return; }
      this.act(t.dataset.act, t);
    });
    el.addEventListener("input", (e) => this.nhap(e.target));
    el.addEventListener("change", (e) => this.nhap(e.target, true));
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") this.toggle(false); e.stopPropagation(); });
    el.querySelector(".dv-head").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const mv = (ev) => { el.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - ox)) + "px"; el.style.top = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)) + "px"; el.style.transform = "none"; };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
      e.preventDefault();
    });
  }

  // câu báo dưới dòng tình trạng (kết quả việc vừa làm / lỗi)
  bao(t, loi = false) { const b = this.el && this.el.querySelector(".qt-bao"); if (!b) return; b.textContent = t || ""; b.classList.toggle("loi", !!loi); }
  async goi(viec, b, im) {
    try { return await Net.quanTri(viec, b, im ? { im: 1 } : undefined); }
    catch (e) {
      // gọi ngầm (tự tải lại 5 / 10 giây) gặp khóa an toàn đã khóa lại (máy chủ khởi động lại lúc lên VPS, Khóa lại, thẻ khác…): đóng bảng + báo — trước
      // bảng đứng hình, số liệu cũ mà không báo gì (rà soát 10/11). Mở lại F10 sẽ hỏi mật khẩu cấp 2
      if (im && (e.ma === "can-mk2" || e.ma === "can-dat-mk2")) {
        if (this.on) { if (this.api.khoaLai) this.api.khoaLai(e.ma); this.toggle(false); this.api.msg("Khóa an toàn đã khóa lại (máy chủ vừa khởi động lại hoặc vừa Khóa lại) — bấm F10 để mở khóa"); }
        return null;
      }
      if (e.ma !== "het-phien" && !im && !e.boQua) this.bao(e.message, true);
      return null;
    }
  }

  // ---------- vẽ ----------
  render() {
    if (!this.el) return;
    this.el.querySelectorAll(".dv-tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === this.tab));
    const body = this.el.querySelector(".dv-body");
    // thẻ Mã quà dùng các dòng chọn quà của Gửi quà (this.qua) cho mã đang tạo; rời thẻ thì trả lại
    if (this.tab === "ma") this.qua = this.maForm; else if (this.qua === this.maForm) this.qua = null;
    if (this.tab === "nguoi") { body.innerHTML = this.tabNguoi(); this.veDs(); this.veCt(); }
    else if (this.tab === "nk") { body.innerHTML = this.tabNk(); this.veNk(); if (!this.nk.ds) this.xemNk(); }
    else if (this.tab === "ma") { body.innerHTML = this.tabMa(); this.veMa(); this.taiMa(); }
    else if (this.tab === "lich") { body.innerHTML = `<div class="dv-note">Đổi giờ áp dụng ngay, không cần khởi động lại máy chủ — khung Hướng dẫn hoạt động, chữ trong game và lệnh khởi động lại máy chủ đều theo lịch mới. Hoạt động đang diễn ra giữ giờ kết thúc cũ (lịch mới tính từ lần sau). Phú Quý: giờ quay / hạn nhận mới áp dụng từ ngày mai. Lịch lưu trên máy chủ (du-lieu/lich-hd.json) — gửi mã lên VPS không ghi đè.</div><div class="r"><button data-act="lhTai">Tải lại</button></div><div class="qt-lich">Đang tải…</div>`; this.taiLich(); }
    else if (this.tab === "cauhinh") { if (!this.ch) this.ch = new CauHinhQt(this); this.ch.render(body); }
    else if (this.tab === "timmon") { if (!this.tm) this.tm = new TimMonQt(this); this.tm.render(body); } // anh 18/11 tối — src/game/qt-timmon.js
    else if (this.tab === "bot") { body.innerHTML = `<div class="dv-note">Bot Tống Kim mặc đồ và đánh theo nhân vật mẫu. Thêm mẫu: thẻ Người chơi → chọn tài khoản → nút Làm mẫu bot ở nhân vật đó (chụp đồ, kỹ năng lúc bấm; bấm lại để cập nhật). Mỗi phái tối đa 3 mẫu, bot phái đó bốc ngẫu nhiên. Phái chưa có mẫu thì bot tự sinh như cũ. Áp dụng từ trận sau.</div><div class="qt-mau"></div>`; this.taiMau(); }
    else { body.innerHTML = this.tabTb(); this.xemTb(); }
    this.veMay();
  }
  veMay() {
    const m = this.may, el = this.el && this.el.querySelector(".qt-may");
    if (!el || !m) return;
    el.innerHTML = esc(`Đang chơi ${m.dang} · Tài khoản ${m.tk} · Máy chủ chạy ${thoiGian(m.chay)} · RAM game ${mb(m.ram)} (máy còn ${gb(m.ramTrong)} / ${gb(m.ramMay)} GB)` +
      `${m.tai ? ` · CPU ${m.tai.toFixed(2)}` : ""} · Sao lưu ${m.saoLuu ? m.saoLuu.slice(8, 10) + "/" + m.saoLuu.slice(5, 7) : "chưa có"}`) +
      (m.baoTri ? ` · <span class="qt-do">Đang bảo trì${m.baoTri.den ? ` tới ${luc(m.baoTri.den)}` : ""} (chỉ quản trị vào game)</span>` : "") +
      (m.duyet && m.duyet.bat ? ` · <span class="qt-xanh">Duyệt vào game: chỉ quản trị + ${m.duyet.n} tài khoản đã duyệt</span>` : "") + // anh 11/11 khuya — may-chu/duyet.js
      (m.hack ? ` · <span class="qt-do">⚠ ${m.hack} tài khoản nghi tăng tốc</span> <button data-act="boHackHet" style="padding:0 6px">Xóa cờ hàng loạt</button>` : "") +
      (m.dame ? ` · <span class="qt-do">⚠ ${m.dame} tài khoản nghi hack sát thương</span> <button data-act="locDame" style="padding:0 6px">Xem</button>` : "") + // anh 16/11 — may-chu/nghi-dame.js
      ((() => { // anh 13/11 — may-chu/nghi-tool.js: chỉ đếm tín hiệu MẠNH là "nghi dùng công cụ"; tín hiệu yếu (tiện ích trình duyệt) đếm riêng, màu vàng
        const ds = Array.isArray(this.ds) && this.ds.length ? this.ds.filter((t) => t.tool) : null, manh = ds ? ds.filter((t) => laManh(t.tool)).length : m.tool | 0, yeu = ds ? ds.length - manh : 0;
        // anh 16/11: Xem chỉ lọc tín hiệu mạnh; tín hiệu yếu (Trợ Thủ của game, tiện ích trình duyệt) chữ nhỏ, xem riêng
        return (manh ? ` · <span class="qt-do">⚠ ${manh} tài khoản nghi dùng công cụ</span> <button data-act="locTool" style="padding:0 6px">Xem</button>` : "") +
          (yeu ? ` · <small class="qt-vang" data-act="locToolYeu" style="cursor:pointer;opacity:.8">${yeu} tín hiệu yếu (Trợ Thủ, tiện ích trình duyệt — chưa đủ căn cứ)</small>` : "");
      })());
  }

  tabNguoi() {
    return `<div class="r"><input data-in="q" placeholder="Tìm tài khoản / nhân vật" value="${esc(this.loc.q)}" style="flex:1">
        <select data-in="kieu">${[["tat", "Tất cả"], ["dang", "Đang chơi"], ["duyet", "Đã duyệt"], ["chuaDuyet", "Chưa duyệt"], ["chuaNv", "Chưa có nhân vật"], ["khoa", "Bị khóa"], ["trungIp", "Trùng IP"], ["hack", "Nghi tăng tốc"], ["tool", "Nghi dùng công cụ"], ["toolYeu", "Tín hiệu yếu (chưa đủ căn cứ)"], ["dame", "Nghi hack sát thương"]].map(([v, n]) => `<option value="${v}"${this.loc.kieu === v ? " selected" : ""}>${n}</option>`).join("")}</select>
        <span class="dv-note">Vắng ≥</span><input data-in="vang" type="number" min="0" max="3650" step="1" value="${this.loc.vang || ""}" placeholder="0" title="" style="width:54px" autocomplete="off"><span class="dv-note">ngày</span>
        <button data-act="moi">Làm mới</button><button data-act="taoTk"${this.taoTk ? ' class="on"' : ""}>Tạo tài khoản</button>
        <button data-act="mkToi"${this.mkToi ? ' class="on"' : ""}>Đổi mật khẩu của tôi</button><button data-act="baoTri"${this.btForm ? ' class="on"' : ""}>Bảo trì</button><button data-act="duyet"${this.dyForm ? ' class="on"' : ""}>Duyệt vào game</button></div>
      ${this.btForm ? this.veBaoTri() : ""}
      ${this.dyForm ? this.veDuyet() : ""}
      ${this.taoTk ? `<div class="r qt-tao"><span class="k">Tài khoản mới</span><input data-in="tkTen" placeholder="tên (chữ thường, số, _)" maxlength="20" autocomplete="off">
        <input data-in="tkMk" placeholder="mật khẩu (≥ 4 ký tự)" maxlength="40" autocomplete="off">
        <input data-in="tkChu" placeholder="người chơi (tên Zalo / SĐT)" maxlength="40" autocomplete="off"><button data-act="taoTkGui">Tạo</button></div>` : ""}
      ${this.mkToi ? `<div class="r qt-tao"><span class="k">Mật khẩu ${esc((this.api.me() || {}).ten || "")}</span>
        <input data-in="mkCu" class="qt-an" placeholder="mật khẩu hiện tại" maxlength="40" autocomplete="off">
        <input data-in="mkMoi" class="qt-an" placeholder="mật khẩu mới (≥ 4 ký tự)" maxlength="40" autocomplete="off">
        <input data-in="mkLai" class="qt-an" placeholder="nhập lại mật khẩu mới" maxlength="40" autocomplete="off"><button data-act="mkToiGui">Đổi</button></div>` : ""}
      <div class="qt-ds"></div><div class="qt-ct"></div>`;
  }
  // ---------- Lịch hoạt động (anh 05/11: "thêm vào trong quản lý server để anh tuỳ ý chỉnh thời gian của các hoạt động, GM chỉnh xong thì theo lịch đó")
  async taiLich() { const j = await this.goi("lich-hd", { viec: "xem" }); if (j) { this.lich = j; this.veLich(); } }
  veLich() {
    const box = this.el && this.el.querySelector(".qt-lich"); if (!box || !this.lich) return;
    const THU = [[1, "T2"], [2, "T3"], [3, "T4"], [4, "T5"], [5, "T6"], [6, "T7"], [0, "CN"]], now = this.lich.gio || Date.now();
    const hm = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`; };
    const con = (t) => { const p = Math.max(0, Math.ceil((t - now) / 60000)); return p >= 60 ? `${Math.floor(p / 60)} giờ ${p % 60} phút` : `${p} phút`; };
    const tt = (x) => { const t = x.tt || {}; if (t.dang) return `<i class="qt-xanh">Đang diễn ra</i> — ${esc(t.chu || "")}${t.den ? ` (tới ${hm(t.den).slice(0, 5)})` : ""}`;
      if (!x.bat) return `<i class="qt-do">Đang tạm dừng</i>`; return `${t.nghi ? `<i class="qt-do">Hôm nay nghỉ</i> · ` : ""}${t.toi ? `Lần tới: <b class="qt-vang">${hm(t.toi)}</b> (còn ${con(t.toi)})` : "—"}${t.chu && !t.dang ? " · " + esc(t.chu) : ""}`; };
    box.innerHTML = this.lich.ds.map((x) => {
      // Phú Quý có giờ đang chờ áp dụng: ô giờ hiện giờ chờ (lưu lại — vd chỉ tắt / bật — giữ giờ chờ)
      const gio = x.kieu === "pq" ? `<span class="k">Giờ quay</span><input data-lh="quay" value="${esc((x.cho && x.cho.quay) || x.quay || "")}" maxlength="5" style="width:52px" autocomplete="off"><span>hạn nhận tới</span><input data-lh="hetNhan" value="${esc((x.cho && x.cho.hetNhan) || x.hetNhan || "")}" maxlength="5" style="width:52px" autocomplete="off"><span>hôm sau${x.cho ? " (đang chờ áp dụng)" : ""}</span>`
        : `<span class="k">Giờ</span><input data-lh="gio" value="${esc(x.gio)}" maxlength="140" style="${x.kieu === "mot" ? "width:52px" : "flex:1;min-width:220px"}" autocomplete="off"><span class="dv-note">${x.kieu === "mot" ? "HH:MM" : x.kieu === "gio" ? "giờ 0–23, cách nhau dấu phẩy (mỗi chuyến báo danh 10 phút)" : "nhiều giờ HH:MM, cách nhau dấu phẩy"}</span>`;
      const thu = x.thu ? `<div class="r"><span class="k">Ngày</span>${THU.map(([d, n]) => `<label class="qt-thu"><input type="checkbox" data-lh="thu" value="${d}"${x.thu.includes(d) ? " checked" : ""}>${n}</label>`).join("")}</div>` : "";
      const so = x.so.length ? `<div class="r">${x.so.map(([k, n, a, b, v, st]) => `<span>${esc(n)}</span><input data-lh="${k}" type="number" min="${a}" max="${b}" step="${st || 1}" value="${v}" style="width:56px">`).join("")}</div>` : "";
      const mac = x.kieu === "pq" ? `quay ${x.mac.quay}, nhận tới ${x.mac.hetNhan}` : `${x.mac.gio}${x.mac.so.length ? " · " + x.so.map((s, i) => `${s[1].toLowerCase()} ${x.mac.so[i]}`).join(", ") : ""}`;
      const sua = x.sua ? ` · sửa lần cuối: ${esc(x.sua.ai)} lúc ${hm(x.sua.luc)}${x.sua.mac ? " (về mặc định)" : ""}` : "";
      return `<div class="qt-lich-o${x.bat ? "" : " tat"}" data-id="${x.id}"><div class="r"><b class="qt-vang">${esc(x.ten)}</b><label class="qt-thu"><input type="checkbox" data-lh="bat"${x.bat ? " checked" : ""}>Bật</label><span>${tt(x)}</span></div>` +
        `<div class="r">${gio}</div>${thu}${so}${x.cho ? `<div class="dv-note qt-vang">Chờ áp dụng từ ${x.cho.tu.slice(8, 10)}/${x.cho.tu.slice(5, 7)}: quay ${esc(x.cho.quay)}, nhận tới ${esc(x.cho.hetNhan)}</div>` : ""}` +
        `<div class="r"><button data-act="lhLuu" data-id="${x.id}">Lưu</button>${x.daSua || x.cho ? `<button data-act="lhMac" data-id="${x.id}">Về mặc định</button>` : ""}<span class="dv-note">Mặc định: ${esc(mac)}${sua}</span></div></div>`;
    }).join("");
  }
  // thẻ Bot mẫu (anh 09/11): nhân vật mẫu cho bot Tống Kim, gom theo phái
  async taiMau() { const j = await this.goi("xu-ly", { viec: "ds-mau-bot" }); if (j && this.on && this.tab === "bot") { this.mauBot = j.ds; this.veMau(); } }
  veMau() {
    const box = this.el.querySelector(".qt-mau"); if (!box) return;
    const L = this.mauBot || [], phai = [...new Set(L.map((m) => m.fk))];
    box.innerHTML = L.length ? phai.map((k) => { const ds = L.filter((m) => m.fk === k); return `<div class="r"><span class="k">${esc(this.api.facName(ds[0].fac, ds[0].series))}</span>${ds.map((m) => `<b class="qt-vang">${esc(m.ten)}</b><small>cấp ${m.lvl}</small><button data-act="boMau" data-i="${m.i}">Xóa</button>`).join(" ")}</div>`; }).join("") : `<div class="dv-note">Chưa có mẫu nào — bot đang tự sinh đồ và kỹ năng.</div>`;
  }
  docLich(id) { // giá trị đang nhập của 1 hoạt động
    const o = this.el.querySelector(`.qt-lich-o[data-id="${id}"]`); if (!o) return null;
    const b = { id, thu: [] };
    for (const i of o.querySelectorAll("[data-lh]")) { const k = i.dataset.lh; if (k === "bat") b.bat = i.checked; else if (k === "thu") { if (i.checked) b.thu.push(+i.value); } else b[k] = i.type === "number" ? +i.value : i.value.trim(); }
    if (!o.querySelector('[data-lh="thu"]')) delete b.thu;
    return b;
  }
  // duyệt người chơi vào game (anh 11/11 khuya "anh sẽ nhập id người chơi vào, anh đồng ý cho vào game để giới hạn người chơi … mỗi người 1 acc thôi" —
  // may-chu/duyet.js, quan-tri.js duyet): bật / tắt chế độ, ô nhập ID tài khoản hoặc tên nhân vật (nhiều cái cách nhau dấu phẩy), kết quả lần duyệt gần
  // nhất (vì sao không duyệt được, trùng IP), danh sách đã duyệt + Bỏ duyệt
  veDuyet() {
    const d = this.dy, K = this.dyKet || [];
    if (!d) return `<div class="qt-dy"><div class="dv-note">Đang tải danh sách duyệt…</div></div>`;
    const ket = K.length ? `<div class="qt-dy-ket">${K.map((k) => `<div class="${k.ok ? "qt-xanh" : "qt-do"}">${k.ok ? "✓" : "✗"} ${esc(k.ten || k.s)}${k.ten && k.s && fold(k.s) !== fold(k.ten) ? ` <small>(${esc(k.s)})</small>` : ""} — ${k.ok ? "đã duyệt" : esc(k.ly)}${k.canh ? ` <span class="qt-vang">⚠ ${esc(k.canh)}</span>` : ""}</div>`).join("")}</div>` : "";
    const dong = (t) => `<div class="qt-dy-dong"><b>${esc(t.ten)}</b>${t.chu ? ` <small class="qt-vang">${esc(t.chu)}</small>` : ""}
        <span>${t.nv.length ? t.nv.map((h) => `${esc(h.name)} <small>(${h.lvl})</small>`).join(", ") : "<small>chưa có nhân vật</small>"}</span>${t.co ? "" : ' <small class="qt-do">tài khoản không còn</small>'}
        <small class="dv-note">duyệt ${luc(t.luc)}</small><button data-act="dyBo" data-ten="${esc(t.ten)}">Bỏ duyệt</button></div>`;
    return `<div class="qt-dy">
      <div class="r"><span class="k">Duyệt vào game</span>${d.bat
        ? `<b class="qt-xanh">ĐANG BẬT</b><span class="dv-note">chỉ tài khoản quản trị + ${d.n} tài khoản đã duyệt vào được game</span><button data-act="dyTat">Tắt (ai cũng vào được)</button>`
        : `<b class="qt-vang">ĐANG TẮT</b><span class="dv-note">mọi tài khoản vào game như thường</span><button data-act="dyBat">Bật duyệt</button>`}</div>
      <div class="r"><input data-in="dyNhap" placeholder="ID tài khoản hoặc tên nhân vật — nhiều người cách nhau dấu phẩy" maxlength="600" style="flex:1" autocomplete="off"><button data-act="dyThem">Duyệt</button></div>
      ${ket}
      <div class="dv-note">Mỗi người 1 tài khoản: tài khoản ghi cùng “người chơi” chỉ duyệt được 1 cái; trùng IP với tài khoản đã duyệt thì hiện ⚠ để anh xem. Tài khoản quản trị luôn vào được.</div>
      <div class="qt-dy-ds">${d.ds.length ? `<div class="dv-note">Đã duyệt ${d.ds.length} tài khoản:</div>` + d.ds.map(dong).join("") : `<div class="dv-note">Chưa duyệt tài khoản nào</div>`}</div></div>`;
  }
  async taiDy() { const j = await this.goi("duyet", { viec: "xem" }, true); if (j) this.dy = j.duyet; }
  // dòng đặt bảo trì: giờ + ngày mở (giờ Việt Nam) — mặc định 13:00 hôm nay (quá 13:00 thì ngày mai), đang bảo trì thì giờ đang đặt
  veBaoTri() {
    const bt = (this.may || {}).baoTri, vn = new Date((bt && bt.den ? bt.den : Date.now()) + 7 * 3600e3);
    if (!(bt && bt.den) && vn.getUTCHours() >= 13) vn.setUTCDate(vn.getUTCDate() + 1);
    const gio = bt && bt.den ? `${p2(vn.getUTCHours())}:${p2(vn.getUTCMinutes())}` : "13:00", ngay = `${p2(vn.getUTCDate())}/${p2(vn.getUTCMonth() + 1)}`;
    return `<div class="r qt-tao"><span class="k">Bảo trì${bt ? ' <i class="qt-do">đang bật</i>' : ""}</span><span>mở lúc</span><input data-in="btGio" value="${gio}" maxlength="5" style="width:52px" autocomplete="off">
        <span>ngày</span><input data-in="btNgay" value="${ngay}" maxlength="5" style="width:52px" autocomplete="off"><input data-in="btLoi" placeholder="lời nhắn thêm (không bắt buộc)" maxlength="120" style="flex:1" autocomplete="off">
        <button data-act="btBat">${bt ? "Đổi giờ" : "Bật bảo trì"}</button>${bt ? `<button data-act="btTat">Tắt (mở ngay)</button>` : ""}</div>
      <div class="dv-note">Đang bảo trì: chỉ tài khoản quản trị đăng nhập / vào game; người đang chơi bị đưa về màn đăng nhập kèm giờ mở. Tới giờ thì tự mở.</div>`;
  }
  // danh sách tài khoản (lọc theo ô tìm + kiểu)
  veDs() {
    const box = this.el && this.el.querySelector(".qt-ds");
    if (!box) return;
    if (!this.ds) { box.innerHTML = `<div class="dv-note">Đang tải…</div>`; return; }
    const q = fold(this.loc.q).trim(), k = this.loc.kieu;
    const L = this.ds.filter((t) => (k !== "dang" || t.dang) && (k !== "khoa" || t.khoa) && (k !== "hack" || t.hack) && (k !== "tool" || laManh(t.tool)) && (k !== "toolYeu" || (t.tool && !laManh(t.tool))) && (k !== "dame" || t.dame) && (k !== "duyet" || t.duyet) && (k !== "chuaDuyet" || (!t.duyet && !t.admin)) && (k !== "chuaNv" || (!t.nv.length && !t.admin)) && this.vangDu(t) && (!q || fold(`${t.ten} ${t.chu || ""} ${t.nv.map((h) => h.name).join(" ")}`).includes(q)));
    this.dsLoc = L; // danh sách đang hiện — "chọn tất cả" (tichHet) chọn đúng các tài khoản này
    const tichO = (t) => (t.admin ? '<i class="qt-tich-trong"></i>' : `<label class="qt-tich" data-act="tich"><input type="checkbox" data-in="tich" data-ten="${esc(t.ten)}"${this.tich.has(t.ten) ? " checked" : ""}></label>`);
    const dong = (t) => `<div class="qt-row${t.ten === this.chon ? " on" : ""}${this.tich.has(t.ten) ? " tich" : ""}" data-act="chon" data-ten="${esc(t.ten)}">
        <span class="c1">${tichO(t)}${esc(t.ten)}${t.admin ? ' <i class="qt-vang">quản trị</i>' : ""}${t.duyet ? ' <b class="qt-xanh" title="Đã duyệt vào game">✓ duyệt</b>' : ""}${t.chu ? ` <small class="qt-vang">${esc(t.chu)}</small>` : ""}</span>
        <span class="c2">${t.nv.length ? t.nv.map((h) => `${esc(h.name)} <small>(${h.lvl} · ${esc(this.api.facName(h.fac, h.series))})</small>`).join(", ") : '<small>chưa có nhân vật</small>'}</span>
        <span class="c3">${this.trangThai(t)}</span><span class="c4">${esc(t.ip || "—")}</span></div>`;
    const coChon = L.filter((t) => !t.admin), het = coChon.length > 0 && coChon.every((t) => this.tich.has(t.ten));
    const dau = `<div class="qt-row qt-tieude"><span class="c1"><label class="qt-tich" data-act="tich" title=""><input type="checkbox" data-in="tichHet"${het ? " checked" : ""}></label>Tài khoản</span><span class="c2">Nhân vật</span><span class="c3">Trạng thái</span><span class="c4">IP</span></div>`;
    // Trùng IP (anh 10/11 "nếu trùng ip thì thêm cho a danh sách lọc, gom tk trùng ip vào"): nhóm các tài khoản dùng chung ít nhất 1 IP đăng nhập
    // gần đây (tk.ips — tài khoản cũ chỉ có IP lần cuối); nhóm nhiều tài khoản trước. Cùng wifi nhà / quán net cũng trùng — anh xem rồi quyết
    if (k === "trungIp") {
      const goc = new Map(), tim = (a) => { while (goc.get(a) !== a) a = goc.get(a); return a; }, theoIp = new Map();
      for (const t of L) { goc.set(t.ten, t.ten); for (const ip of t.ips || (t.ip ? [t.ip] : [])) { if (!ip || ip === "?" || /^(::1|127\.|::ffff:127\.)/.test(ip)) continue; if (!theoIp.has(ip)) theoIp.set(ip, []); theoIp.get(ip).push(t.ten); } }
      for (const ds of theoIp.values()) for (const ten of ds.slice(1)) { const a = tim(ds[0]), b = tim(ten); if (a !== b) goc.set(b, a); }
      const nhom = new Map(); for (const t of L) { const g = tim(t.ten); if (!nhom.has(g)) nhom.set(g, []); nhom.get(g).push(t); }
      const G = [...nhom.values()].filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
      box.innerHTML = G.length ? `<div class="dv-note">${G.length} nhóm tài khoản dùng chung IP (cùng wifi nhà / quán net cũng trùng — xem rồi quyết)</div>` + G.map((g, i) => {
        const ips = [...new Set(g.flatMap((t) => t.ips || []))].filter((ip) => g.filter((t) => (t.ips || []).includes(ip)).length > 1);
        return `<div class="qt-nhomip"><div class="r"><b class="qt-vang">Nhóm ${i + 1} · ${g.length} tài khoản</b><span class="dv-note">IP chung: ${esc(ips.join(", "))}</span></div>${dau}${g.map(dong).join("")}</div>`;
      }).join("") : `<div class="dv-note">Không có tài khoản nào dùng chung IP</div>`;
      return;
    }
    box.innerHTML = this.veLoat(L) + dau + (L.length ? L.map(dong).join("") : `<div class="dv-note">Không có tài khoản nào khớp</div>`);
  }
  // lọc vắng (anh 17/11 "chưa online trong 1 thời gian nào đó"): lần vào game cuối (chưa vào lần nào: lúc tạo) cách đây ≥ loc.vang ngày, không đang chơi / đăng nhập
  vangDu(t) {
    const n = +this.loc.vang || 0; if (n <= 0) return true;
    if (t.dang || t.mo) return false;
    return Date.now() - (t.vao || t.tao || 0) >= n * 864e5;
  }
  // thanh thao tác hàng loạt (anh 17/11): số khớp + số đã tích; có tích thì Duyệt / Bỏ duyệt / Xóa tài khoản / Bỏ chọn
  veLoat(L) {
    const n = this.tich.size;
    return `<div class="qt-loat"><span>${L.length} tài khoản khớp${n ? ` · <b class="qt-vang">đã chọn ${n}</b>` : " · tích ô đầu dòng để chọn (ô ở dòng tiêu đề = chọn tất cả)"}</span>` +
      (n ? `<button data-act="loatDuyet">Duyệt</button><button data-act="loatBoDuyet">Bỏ duyệt</button><button data-act="loatXoa" style="color:#ff8a7a">Xóa tài khoản</button><button data-act="loatBo">Bỏ chọn</button>` : "") + "</div>";
  }
  trangThai(t) {
    const h = t.hack ? `<span class="qt-do">⚠ nghi tăng tốc ×${String(t.hack.x).replace(".", ",")}</span> ` : "";
    // nghi dùng công cụ (anh 13/11): đỏ = có tín hiệu mạnh, vàng = chỉ tín hiệu yếu. Anh 16/11 ("hiển thị quá trời, toàn do auto của mình gây ra" — nhật ký S2
    // 3 ngày: 93 tài khoản có cờ, 5 có tín hiệu mạnh; còn lại Trợ Thủ việc ở thành / mua ở Quân Nhu quan Tống Kim, tiện ích trình duyệt): hàng chỉ có tín hiệu yếu
    // không hiện dấu ở danh sách — chỉ hiện khi lọc "Tín hiệu yếu"; chi tiết tài khoản vẫn đủ bằng chứng
    const manh = t.tool && laManh(t.tool);
    const c = t.tool && (manh || this.loc.kieu === "toolYeu") ? `<span class="${manh ? "qt-do" : "qt-vang"}">⚠ nghi công cụ ×${so(t.tool.lan)} (${esc((t.tool.ma || []).map((m) => (String(m).startsWith("dct:") ? String(m).slice(4) : m)).join(", "))})</span> ` : "";
    const dm = t.dame ? `<span class="qt-do">⚠ nghi hack sát thương ×${so(t.dame.lan)} (vượt tới ×${String(t.dame.x).replace(".", ",")})</span> ` : ""; // anh 16/11 — may-chu/nghi-dame.js
    return h + dm + c + this.trangThai0(t);
  }
  trangThai0(t) {
    if (t.khoa) return `<span class="qt-do">Khóa ${t.khoa.den ? `tới ${luc(t.khoa.den)}` : "vĩnh viễn"}</span>`;
    if (t.dang) return `<span class="qt-xanh">● ${esc(t.dang.name)} · ${esc(t.dang.bai)}</span>`;
    if (t.mo) return `<span class="qt-xanh">● Đang đăng nhập (chưa vào game)</span>`;
    return t.vao ? `<small>Vắng · vào lần cuối ${luc(t.vao)}</small>` : `<small>Chưa vào game lần nào${t.tao ? ` · tạo ${luc(t.tao)}` : ""}</small>`;
  }
  // chi tiết tài khoản đang chọn
  veCt() {
    const box = this.el && this.el.querySelector(".qt-ct");
    if (!box) return;
    const t = this.ct;
    if (!this.chon) { box.innerHTML = `<div class="dv-note">Bấm 1 tài khoản để xem chi tiết, đá / khóa, gửi quà.</div>`; return; }
    if (!t || t.ten !== this.chon) { box.innerHTML = `<div class="dv-note">Đang tải ${esc(this.chon)}…</div>`; return; }
    const toi = t.ten === (this.api.me() || {}).ten;
    const xuLy = t.admin ? `<div class="dv-note">Tài khoản quản trị — không đá / khóa / đổi mật khẩu từ đây.${toi ? " Đổi mật khẩu của bạn: nút “Đổi mật khẩu của tôi” ở trên." : ""}</div>` : `
      <div class="r"><span class="k">Duyệt vào game</span>${t.duyet ? `<b class="qt-xanh">✓ đã duyệt</b><button data-act="dyBo" data-ten="${esc(t.ten)}">Bỏ duyệt</button>` : `<span class="dv-note">chưa duyệt</span><button data-act="dyCt" data-ten="${esc(t.ten)}">Duyệt tài khoản này</button>`}</div>
      <div class="r"><span class="k">Lý do</span><input data-in="lyDo" placeholder="(không bắt buộc — người chơi thấy)" maxlength="100" style="flex:1" autocomplete="off"></div>
      <div class="r"><span class="k">Xử lý</span><button data-act="da">Đá ra khỏi game</button><button data-act="xoaTk" style="color:#ff8a7a">Xóa tài khoản</button>
        <select data-in="gio">${KHOA_GIO.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select><button data-act="khoa">Khóa</button>
        ${t.khoa ? `<button data-act="moKhoa">Mở khóa</button>` : ""}</div>
      <div class="r"><span class="k">Mật khẩu mới</span><input data-in="mk" placeholder="≥ 4 ký tự — người chơi phải tự đổi lần đăng nhập tới" maxlength="40" autocomplete="off" style="flex:1"><button data-act="doiMk">Đặt lại mật khẩu</button>
        ${t.mk && t.mk.mk2 ? `<button data-act="xoaMk2" style="color:#ff8a7a">Xóa mk cấp 2</button>` : ""}</div>
      <div class="r"><span class="k">Người chơi</span><input data-in="chu" value="${esc(t.chu || "")}" placeholder="tên Zalo / số điện thoại" maxlength="40" autocomplete="off"><button data-act="luuChu">Lưu</button></div>
      <div class="r"><span class="k">Nhắn riêng</span><input data-in="nhanT" placeholder="tin của GM — người chơi thấy khung báo + kênh Mật (đang vắng thì lần vào sau)" maxlength="200" style="flex:1" autocomplete="off"><button data-act="nhanGui">Gửi</button></div>`;
    box.innerHTML = `<div class="qt-box">
      <div class="r"><b class="qt-vang">${esc(t.ten)}</b><span class="dv-note">tạo ${luc(t.tao)} · vào lần cuối ${luc(t.vao)} · IP ${esc(t.ip || "—")}${t.chu ? ` · người chơi ${esc(t.chu)}` : ""}</span><button data-act="ctMoi" style="margin-left:auto">Làm mới</button></div>
      ${(t.ips || []).length > 1 ? `<div class="dv-note">IP đã dùng gần đây: ${esc(t.ips.join(", "))}</div>` : ""}
      ${this.veMk(t)}
      ${t.dang ? `<div class="r qt-xanh">● Đang chơi: ${esc(t.dang.name)} (cấp ${t.dang.lvl}) · ${esc(t.dang.bai)}${t.admin ? "" : `<button data-act="toiCho" style="margin-left:8px">Dịch chuyển tới</button>`}</div>` : ""}
      ${t.khoa ? `<div class="qt-do">Đang khóa ${t.khoa.den ? `tới ${luc(t.khoa.den)}` : "vĩnh viễn"}${t.khoa.lyDo ? ` — ${esc(t.khoa.lyDo)}` : ""} (${esc(t.khoa.boi)} khóa lúc ${luc(t.khoa.luc)})</div>` : ""}
      ${t.hack ? `<div class="r qt-do">⚠ Nghi dùng tăng tốc trình duyệt (Cheat Engine / nút tăng tốc): ${t.hack.lan} lần, gần nhất ${luc(t.hack.luc)} — ${esc(t.hack.nv || "")}: đồng hồ trang ×${String(t.hack.x).replace(".", ",")}, ${String(t.hack.f).replace(".", ",")} nhịp / giây (bình thường ×1 và ≤ 2). Nhắc / cảnh cáo rồi xóa cờ; tái phạm thì khóa.<button data-act="boHack" style="margin-left:auto">Xóa cờ (đã nhắc)</button></div>` : ""}
      ${t.dame ? this.veDame(t.dame) : ""}
      ${t.tool ? this.veTool(t.tool) : ""}
      ${xuLy}
      ${t.nv.length ? t.nv.map((h) => this.veNv(h)).join("") : `<div class="dv-note">Chưa có nhân vật.</div>`}</div>`;
    // sổ hoạt động (anh 11/11 "xem được hết hoạt động của họ, mua gì, nhặt gì, lấy gì" — qt-hoatdong.js)
    const hdMo = this.hd && this.hd.tk === t.ten;
    box.insertAdjacentHTML("beforeend", `<div class="qt-box"><div class="r"><b class="qt-vang">Hoạt động</b><span class="dv-note">mua · bán · nhặt · nhận quà / mở rương · rương chứa đồ · dùng · giao dịch · chợ trời · Kỳ Trân Các — sổ riêng của tài khoản, giữ 60 ngày</span><button data-act="hoatDong" style="margin-left:auto">${hdMo ? "Ẩn" : "Xem hoạt động"}</button></div><div class="qt-hd"></div></div>`);
    if (hdMo) this.hd.render(box.querySelector(".qt-hd"));
  }
  // nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js tk.nghiDame, CHỈ GHI): số lần, lần vượt lớn nhất, bằng chứng mới nhất trước (mỗi dòng: lúc, nơi, số, mốc của
  // người cùng phái cùng mốc cấp, lần vượt, nhân vật); Xóa cờ sau khi xem / nhắc
  // sổ hoạt động vừa tải lần đầu (qt-hoatdong.js): kéo khung ngoài cho cả khung Hoạt động (lọc + danh sách) nằm trong vùng nhìn thấy — điện thoại khung thấp,
  // danh sách không còn che hết chỗ vuốt khung ngoài (anh 18/11: "trên mobile cái xem hoạt động bị kẹt, không kéo xuống được")
  hienHd() {
    const b = this.el && this.el.querySelector(".dv-body"), x = this.el && this.el.querySelector(".qt-hd"), k = x && x.closest(".qt-box"); if (!b || !k) return;
    const r = k.getBoundingClientRect(), rb = b.getBoundingClientRect(); if (r.bottom > rb.bottom) b.scrollTop += Math.max(0, Math.min(r.top - rb.top, r.bottom - rb.bottom));
  }
  veDame(c) {
    const bang = (c.bang || []).slice().reverse().map((s) => `<div class="dv-note">${esc(s)}</div>`).join("");
    return `<div class="r qt-do">⚠ Nghi hack sát thương: ${so(c.lan)} lần, gần nhất ${luc(c.luc)}${c.nv ? ` — ${esc(c.nv)}` : ""}, vượt tới ×${String(+c.x || 0).replace(".", ",")} so với người cùng phái cùng mốc cấp. Máy chủ chỉ ghi, không cắt / không khóa — đối chiếu bằng chứng (thử lại đúng cấp, đồ, chiêu ở dev tool) rồi nhắc / xử lý, xong xóa cờ.<button data-act="boDame" style="margin-left:auto">Xóa cờ</button></div>${bang}`;
  }
  // nghi dùng công cụ (anh 13/11 — may-chu/nghi-tool.js tk.nghiTool): số lần, mã (số lần từng mã), bằng chứng mới nhất trước; Xóa cờ sau khi xem / nhắc
  veTool(c) {
    const ma = (c.ma || []).map((m) => `<b class="${TOOL_YEU.has(m) ? "qt-vang" : "qt-do"}">${esc(tenMaTool(m))}${c.dem && c.dem[m] ? ` ×${so(c.dem[m])}` : ""}</b>`).join(" · ");
    const bang = (c.bang || []).slice().reverse().map((s) => `<div class="dv-note">${esc(s)}</div>`).join("");
    return `<div class="r ${laManh(c) ? "qt-do" : "qt-vang"}">⚠ ${laManh(c) ? "Nghi dùng công cụ tự động" : "Chỉ có tín hiệu YẾU (tiện ích trình duyệt cũng gây ra) — chưa đủ căn cứ để phạt"}: ${so(c.lan)} lần, gần nhất ${luc(c.luc)}${c.nv ? ` — ${esc(c.nv)}` : ""}. Bằng chứng để xem — máy chủ không tự khóa; nhắc / cảnh cáo rồi xóa cờ.<button data-act="boTool" style="margin-left:auto">Xóa cờ</button></div>
      <div class="dv-note">Tín hiệu: ${ma || "—"}</div>${bang}`;
  }
  // khóa an toàn của tài khoản (anh 10/11 "Hệ thống vẫn sẽ ghi nhận dc" — may-chu/bao-mat.js tomTat): mật khẩu đăng nhập còn mật khẩu quản trị cấp /
  // người chơi đã tự đổi lúc nào; mật khẩu cấp 2 đã đặt chưa; lần nhập sai gần nhất. Mật khẩu lưu dạng băm — quản trị không xem được, chỉ đặt lại / xóa
  veMk(t) {
    const m = t.mk; if (!m) return "";
    const mk1 = m.batDoiMk ? `<span class="qt-vang">mật khẩu quản trị cấp — chờ người chơi đổi ở lần đăng nhập tới</span>` : m.mkLuc ? `người chơi tự đổi lúc ${luc(m.mkLuc)}` : "chưa tự đổi lần nào";
    const mk2 = m.mk2 ? `<span class="qt-xanh">đã đặt</span>${m.mk2Luc ? ` lúc ${luc(m.mk2Luc)}` : ""}` : `<span class="qt-do">chưa đặt</span>`;
    const s = m.mk2SaiCuoi;
    return `<div class="dv-note">Mật khẩu đăng nhập: ${mk1} · Mật khẩu cấp 2: ${mk2}${s ? ` · <span class="qt-do">nhập sai gần nhất ${luc(s.luc)} (lần ${s.n | 0}) · IP ${esc(s.ip || "—")}</span>` : ""}${m.khoaNhap > 0 ? ` · <span class="qt-do">đang khóa nhập ${Math.ceil(m.khoaNhap / 60000)} phút</span>` : ""}
      <button data-act="xemMkNk" style="margin-left:6px">Nhật ký mật khẩu</button></div>`;
  }
  veNv(h) {
    const mo = this.xemDo.has(h.o), q = this.qua && this.qua.o === h.o ? this.qua : null;
    const ds = (L) => (L.length ? L.map((m) => `<div class="qt-mon">${icon(m)}<span>${tenMon(m)}</span></div>`).join("") : `<small>trống</small>`);
    return `<div class="qt-nv">
      <div class="r"><b>${esc(h.name)}</b><span>cấp ${h.lvl} · ${h.sex === "f" ? "nữ" : "nam"} · ${esc(this.api.facName(h.fac, h.series))}${h.bai ? ` · ${esc(h.bai)}` : ""}</span>
        <button data-act="xemDo" data-o="${h.o}"${mo ? ' class="on"' : ""} style="margin-left:auto">Đồ</button><button data-act="lamMau" data-o="${h.o}">Làm mẫu bot</button><button data-act="soiDo" data-o="${h.o}">Soi đồ</button><button data-act="moQua" data-o="${h.o}"${q ? ' class="on"' : ""}>Gửi quà</button></div>
      <div class="dv-note">Ngân lượng ${fmtMoney(h.gold)} · Xu ${so(h.xu)} · tiền rương ${fmtMoney(h.tienRuong)} · kinh nghiệm ${so(h.exp)}${h.leadLv != null ? ` · thống soái ${so(h.leadLv)}` : ""}${h.bang ? ` · bang <span class="qt-vang">${esc(h.bang)}</span>` : ""}${h.quaCho ? ` · <span class="qt-vang">${h.quaCho} lần quà chưa nhận</span>` : ""}</div>
      ${mo ? `<div class="qt-do-ds"><div class="k">Đang mặc</div>${ds(h.mac)}<div class="k">Hành trang (${h.tui.length})</div>${ds(h.tui)}<div class="k">Rương (${h.ruong.length})</div>${ds(h.ruong)}</div>` : ""}
      ${this.ct && !this.ct.admin ? this.veQl(h) : ""}
      ${q ? this.veQua(h) : ""}</div>`;
  }
  // quản lý nhân vật (anh 04/11): giải kẹt về Ba Lăng, tăng cấp, chuyển môn phái (may-chu/quan-tri.js xu-ly giai-ket / cap / phai); đổi giới tính (anh 14/11 — xu-ly gioi)
  veQl(h) {
    const F = this.api.factions ? this.api.factions() : [];
    return `<div class="r"><span class="k">Quản lý</span><button data-act="giaiKet" data-o="${h.o}">Giải kẹt (về Ba Lăng)</button>
      <input data-in="qlLv${h.o}" type="number" min="${h.lvl + 1}" max="200" placeholder="cấp mới" style="width:76px"><button data-act="tangCap" data-o="${h.o}">Tăng cấp</button>
      <select data-in="qlFac${h.o}"><option value="">— chọn phái —</option>${F.filter((f) => !f.nhap && f.id !== h.fac).map((f) => `<option value="${f.id}">${esc(f.n)} (${HE[f.series]})</option>`).join("")}</select><button data-act="doiPhai" data-o="${h.o}">Đổi phái</button>
      <button data-act="doiGioi" data-o="${h.o}">Đổi giới tính</button></div>`;
  }
  veQua(h) {
    return `<div class="qt-qua">${this.veMucQua()}
      <div class="r"><button data-act="guiQua">Gửi quà cho ${esc(h.name)}</button><button data-act="dongQua">Đóng</button></div></div>`;
  }
  // các dòng chọn quà (this.qua): ngân lượng, Xu, vật phẩm, lời nhắn — Gửi quà và Tạo mã kích hoạt (thẻ Mã quà) dùng chung
  veMucQua() {
    const q = this.qua;
    return `<div class="r"><span class="k">Ngân lượng</span><input data-in="qTien" type="number" min="0" value="${q.tien || ""}" placeholder="0" style="width:120px"><span class="dv-note qt-qtien">${q.tien ? fmtMoney(q.tien) : ""}</span></div>
      <div class="r"><span class="k">Xu</span><input data-in="qXu" type="number" min="0" value="${q.xu || ""}" placeholder="0" style="width:120px"></div>
      <div class="r"><span class="k">Vật phẩm</span><input data-in="qTim" placeholder="gõ tên món — không dấu cũng được" value="${esc(q.tim || "")}" style="flex:1" autocomplete="off"></div>
      <div class="dv-list qt-kq">${this.veKq()}</div>
      <div class="qt-chon">${this.veChon()}</div>
      <div class="r"><span class="k">Lời nhắn</span><input data-in="qLoi" maxlength="100" value="${esc(q.loi || "")}" placeholder="(không bắt buộc — người nhận thấy)" style="flex:1" autocomplete="off"></div>`;
  }

  // ---------- Mã quà (anh 29/10 — mã kích hoạt nhập ở Lễ quan Ba Lăng; may-chu/ma-qua.js) ----------
  tabMa() {
    const S = this.maSua;
    return `<div class="qt-box"><div class="k">${S ? `Đang sửa mã <b class="qt-vang">${esc(S.ma)}</b> — quà của mã` : "Quà — gửi thẳng toàn máy chủ hoặc tạo mã kích hoạt"}</div>
      ${this.veMucQua()}
      ${S ? "" : `<div class="r"><span class="k">Gửi thẳng</span><select data-in="quaAi"><option value="tat">Mọi nhân vật (cả người đang vắng)</option><option value="dang">Chỉ nhân vật đang chơi</option></select>
        <label class="qt-thu"><input type="checkbox" data-in="quaCao"${this.maForm.cao ? " checked" : ""}>Chỉ nhân vật cấp cao nhất mỗi tài khoản</label>
        <label class="qt-thu"><input type="checkbox" data-in="quaKhoa"${this.maForm.khoa ? " checked" : ""}>Khóa vĩnh viễn</label>
        <button data-act="guiTat">Gửi toàn máy chủ</button><span class="dv-note">vào thẳng hành trang — túi đầy thì quà chờ, dọn túi là nhận · không gửi tài khoản quản trị</span></div>`}
      <div class="k" style="margin-top:6px">${S ? `Số lượt, hạn dùng của mã ${esc(S.ma)}` : "Mã kích hoạt (nhập ở Lễ quan)"}</div>
      ${S ? "" : `<div class="r"><span class="k">Mã</span><input data-in="maTen" maxlength="32" placeholder="để trống = tự sinh 10 ký tự (chữ không dấu, số, - _)" style="flex:1" autocomplete="off"></div>`}
      <div class="r"><span class="k">Số lượt</span><input data-in="maLuot" type="number" min="0" value="${S ? S.toiDa : 0}" style="width:90px"><span class="dv-note">tổng cả máy chủ, 0 = không giới hạn · ${S ? `đã dùng ${S.daDung} lượt` : "mỗi tài khoản dùng 1 lần"}</span></div>
      <div class="r"><span class="k">Hạn dùng</span><select data-in="maNgay">${(S ? this.hanSua(S) : MA_HAN).map(([v, n]) => `<option value="${v}">${esc(n)}</option>`).join("")}</select>
        <label class="qt-thu"><input type="checkbox" data-in="maKhoa"${this.maForm.maKhoa ? " checked" : ""}>Khóa vĩnh viễn</label><span class="dv-note">món nhận từ mã không giao dịch, bày bán được · Mật đồ thần bí luôn không khóa</span></div>
      <div class="r">${S ? `<button data-act="luuMa">Lưu thay đổi</button><button data-act="huySua">Hủy sửa</button><span class="dv-note">Người đã dùng mã giữ nguyên quà cũ và không dùng lại được</span>` : `<button data-act="taoMa">Tạo mã</button><span class="dv-note">Người chơi nói chuyện với Lễ quan (Ba Lăng huyện) → Nhập mã kích hoạt</span>`}</div></div>
      <div class="k" style="margin-top:6px">Các mã đã tạo</div><div class="qt-ma-ds"></div>`;
  }
  // các lựa chọn hạn khi sửa mã (anh 09/11 "gia hạn hay sửa đổi code đã tạo"): còn hạn thì cộng vào hạn đang có, hết hạn hoặc không hạn thì tính từ bây giờ (may-chu/ma-qua.js)
  hanSua(S) {
    const now = Date.now(), con = S.het > now, goc = con ? S.het : now;
    return [["giu", `Giữ nguyên (${S.het ? `${con ? "đến" : "đã hết"} ${luc(S.het)}` : "không hạn"})`],
      ...MA_HAN.filter(([v]) => v).map(([v]) => [v, `${con ? "Thêm" : "Dùng được"} ${v} ngày, đến ${luc(goc + v * 864e5)}`]), [0, "Không hạn"]];
  }
  boSua() { this.maSua = null; this.maForm = { o: -1, mon: [], tien: 0, xu: 0, loi: "", tim: "", kq: [] }; this.render(); }
  veMa() {
    const box = this.el && this.el.querySelector(".qt-ma-ds"), L = this.maDs;
    if (!box) return;
    if (!L) { box.innerHTML = `<div class="dv-note">Đang tải…</div>`; return; }
    if (!L.length) { box.innerHTML = `<div class="dv-note">Chưa có mã nào</div>`; return; }
    box.innerHTML = L.map((m) => { const [lop, chu] = MA_TT[m.tt] || MA_TT.mo, mo = this.maMo.has(m.ma); return `<div class="qt-nv">
      <div class="r"><b class="qt-vang qt-ma">${esc(m.ma)}</b><span class="${lop}">${chu}</span>
        <span class="dv-note">${m.daDung}${m.toiDa ? ` / ${m.toiDa}` : ""} lượt · ${m.het ? `hạn ${luc(m.het)}` : "không hạn"} · ${esc(m.tao.boi)} tạo ${luc(m.tao.luc)}</span>
        <button data-act="maAi" data-ma="${esc(m.ma)}"${mo ? ' class="on"' : ""} style="margin-left:auto">Ai đã dùng</button>
        <button data-act="maSua" data-ma="${esc(m.ma)}"${this.maSua && this.maSua.ma === m.ma ? ' class="on"' : ""}>Sửa</button>
        <button data-act="${m.tt === "tat" ? "maMoLai" : "maTat"}" data-ma="${esc(m.ma)}">${m.tt === "tat" ? "Mở lại" : "Tắt"}</button><button data-act="maXoa" data-ma="${esc(m.ma)}">Xóa</button></div>
      <div class="dv-note">Quà${m.khoa ? ` (<span class="qt-vang">món khóa vĩnh viễn</span>)` : ""}: ${esc(m.qua)}${m.loi ? ` · lời nhắn: "${esc(m.loi)}"` : ""}</div>
      ${mo ? (m.ai.length ? m.ai.map((d) => `<div class="qt-nkr"><span class="t">${luc(d.luc)}</span><span class="a">${esc(d.tk)}</span><span class="m">${esc(d.nv)}</span></div>`).join("") : `<div class="dv-note">Chưa ai dùng</div>`) : ""}</div>`; }).join("");
  }
  async taiMa() {
    const j = await this.goi("ma-qua", { viec: "ds" }, true);
    if (!j) return;
    this.maDs = j.ds;
    if (this.tab === "ma") this.veMa();
  }
  veKq() {
    const q = this.qua;
    if (!q.tim) return `<div class="dv-note" style="padding:2px 4px">Tìm món rồi bấm Thêm (thuốc, Thủy Tinh, Tiên Thảo Lộ, trang bị…)</div>`;
    if (!q.kq) return `<div class="dv-note" style="padding:2px 4px">Đang tìm…</div>`;
    if (!q.kq.length) return `<div class="dv-note" style="padding:2px 4px">Không thấy món nào</div>`;
    return q.kq.map((m) => `<div class="dv-it" data-act="themMon" data-k="${esc(m.k)}">${icon(m)}<div style="flex:1;min-width:0">${esc(m.n)}<small>${m.loai === "do" ? `trang bị · ${esc(m.ln)} · cấp ${m.lv}` : m.loai === "chong" ? "xếp chồng" : m.loai === "leBao" ? "lễ bao" : "1 ô"} · ${esc(m.k)}</small></div><button>Thêm</button></div>`).join("");
  }
  veChon() {
    const q = this.qua;
    if (!q.mon.length) return "";
    return `<div class="k">Quà sẽ gửi</div>` + q.mon.map((m, i) => `<div class="qt-mon">${icon(m)}<span style="flex:1">${esc(m.n)}</span>
      ${m.loai === "do" ? `<select data-in="qDong" data-i="${i}">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<option value="${d}"${m.dong === d ? " selected" : ""}>${d ? `${d} dòng` : "trắng"}</option>`).join("")}</select>
        <select data-in="qHe" data-i="${i}"><option value="-1">hệ ngẫu nhiên</option>${HE.map((n, s) => `<option value="${s}"${m.he === s ? " selected" : ""}>${n}</option>`).join("")}</select>` : ""}
      <span class="dv-note">số lượng</span><input data-in="qSo" data-i="${i}" type="number" min="1" max="${m.loai === "chong" ? 999 : m.loai === "do" ? 10 : 20}" value="${m.so}" style="width:56px">
      <button data-act="boMon" data-i="${i}" title="Bỏ món này">✕</button></div>`).join("");
  }

  tabNk() {
    const N = this.nk, ngays = N.ngays.length ? N.ngays : [N.ngay || "hôm nay"];
    return `<div class="r"><select data-in="nkNgay">${ngays.map((d) => `<option value="${esc(d)}"${d === N.ngay ? " selected" : ""}>${esc(d)}</option>`).join("")}</select>
        <select data-in="nkLoai">${chonNhom(NHOM, N.loai)}</select>
        <input data-in="nkTk" placeholder="tài khoản" value="${esc(N.tk)}" style="width:110px" autocomplete="off">
        <input data-in="nkQ" placeholder="tìm chữ (tên, món, IP…)" value="${esc(N.q)}" style="flex:1" autocomplete="off"><button data-act="nkXem">Xem</button>
        <label class="qt-tu" title="Đang xem ngày mới nhất: mỗi ${NK_MS / 1000} giây tự tải dòng mới (tô sáng)"><input type="checkbox" data-in="nkTu"${N.tu ? " checked" : ""}> Tự cập nhật</label></div>
      <div class="dv-note qt-nk-dem"></div><div class="qt-nk"></div>`;
  }
  veNk() {
    const box = this.el && this.el.querySelector(".qt-nk"), dem = this.el && this.el.querySelector(".qt-nk-dem"), N = this.nk;
    if (!box) return;
    if (!N.ds) { box.innerHTML = `<div class="dv-note">Đang tải…</div>`; return; }
    dem.textContent = N.tong ? `${so(N.tong)} dòng khớp${N.tong > N.ds.length ? ` — hiện ${so(N.ds.length)} dòng mới nhất` : ""}` : "";
    box.innerHTML = N.ds.length ? N.ds.map((o, i) => `<div class="qt-nkr${N.moi && N.moi.has(o) ? " moi" : ""}"><span class="t">${luc(o.t, true)}</span><span class="l l-${esc(o.l)}">${esc((o.hn && HD_TEN.get(o.hn)) || LOAI[o.l] || o.l)}</span>
      <span class="a" data-act="nkTkLoc" data-tk="${esc(o.tk || "")}">${esc(o.tk || "")}</span><span class="m">${o.nv ? `<b>${esc(o.nv)}</b> ` : ""}${this.monChu(o, i)}${o.ip ? ` <small>· ${esc(o.ip)}</small>` : ""}</span></div>`).join("")
      : `<div class="dv-note">Không có dòng nào${N.ngay ? ` ngày ${esc(N.ngay)}` : ""}</div>`;
    box.onmousemove = (e) => { const t = e.target.closest(".qt-nkm"), L = t && (N.ds[t.dataset.i] || {}).mon, m = L && L[t.dataset.j]; if (m) this.api.tipMon(m, e); else this.api.anTip(); };
    box.onmouseleave = () => this.api.anTip();
  }
  // câu nhật ký o (dòng thứ i): tên món có bản chụp (o.mon) tô màu — xanh nếu có dòng xanh — trỏ vào xem ô xem món; tên không thấy trong câu
  // thì thêm ở cuối. Tìm lần lượt từ chỗ tên trước (giao dịch: món đưa rồi món nhận, đúng thứ tự trong câu)
  monChu(o, i) {
    let s = esc(o.m), tu = 0, them = "";
    (o.mon || []).forEach((m, j) => {
      const x = m && ItemDB.item(m.k); if (!x) return;
      const ten = esc(String(x.n || m.k).trim()), the = `<span class="qt-nkm${(m.d || []).length ? " x" : ""}" data-i="${i}" data-j="${j}">${ten}</span>`, at = s.indexOf(ten, tu);
      if (at < 0) { them += " " + the; return; }
      s = s.slice(0, at) + the + s.slice(at + ten.length); tu = at + the.length;
    });
    return s + them;
  }

  tabTb() {
    return `<div class="r"><input data-in="tb" maxlength="200" placeholder="Nội dung thông báo tới mọi người đang chơi" style="flex:1" autocomplete="off"><button data-act="guiTb">Gửi</button></div>
      <div class="dv-note">Hiện ở khung chat (tin hệ thống) và dòng chữ vàng giữa trên màn hình của mọi người đang chơi; người vào game sau đó không thấy.</div>
      <div class="k" style="margin-top:8px">Ghim ở khung chat</div>
      <div class="r"><input data-in="ghim" maxlength="200" placeholder="Nội dung ghim (mã quà, sự kiện mới…)" style="flex:1" autocomplete="off"><button data-act="ghim">Ghim</button><button data-act="boGhim">Bỏ ghim</button></div>
      <div class="dv-note qt-ghim-nay">…</div>
      <div class="k" style="margin-top:6px">Đã gửi hôm nay</div><div class="qt-tb-ds"></div>`;
  }
  // ghim ở khung chat (anh 03/11 — may-chu/quan-tri.js ghim): dòng [Ghim] đầu khung chat của mọi người, cả người vào game sau; ghim mới thay ghim cũ
  async xemGhim() {
    const j = await this.goi("ghim", {}, true), el = this.el && this.el.querySelector(".qt-ghim-nay");
    if (!el || this.tab !== "tb") return;
    el.innerHTML = j && j.ghim && j.ghim.t ? `Đang ghim: <span class="qt-vang">${esc(j.ghim.t)}</span> — ghim mới sẽ thay dòng này` : "Chưa ghim gì. Ghim hiện ở đầu khung chat của mọi người (cả người vào game sau); người chơi bấm × thì ẩn trên máy họ tới khi có ghim mới.";
  }
  async xemTb() {
    this.xemGhim();
    const j = await this.goi("nhat-ky", { loai: ["tb"], n: 30 }, true), box = this.el && this.el.querySelector(".qt-tb-ds");
    if (!box || this.tab !== "tb") return;
    box.innerHTML = j && j.ds.length ? j.ds.map((o) => `<div class="qt-nkr"><span class="t">${luc(o.t, true)}</span><span class="a">${esc(o.tk)}</span><span class="m">${esc(o.m)}</span></div>`).join("") : `<div class="dv-note">Chưa có</div>`;
  }

  // thao tác hàng loạt trên các tài khoản đã tích (anh 17/11 — máy chủ quan-tri.js loat): hỏi lại bằng khung của game, xong bỏ chọn + tải lại danh sách
  async loat(a) {
    const api = this.api, ten = [...this.tich], L = (this.ds || []).filter((t) => this.tich.has(t.ten));
    if (!ten.length) return;
    const n = ten.length, viec = a === "loatDuyet" ? "duyet" : a === "loatBoDuyet" ? "boDuyet" : "xoa";
    if (viec === "xoa") {
      const coNv = L.filter((t) => t.nv.length), dang = L.filter((t) => t.dang || t.mo).length;
      const cao = coNv.flatMap((t) => t.nv.map((h) => ({ ...h, tk: t.ten }))).sort((x, y) => (y.lvl | 0) - (x.lvl | 0))[0];
      if (!(await api.hoi(`<color=red>XÓA ${n} tài khoản<color> cùng toàn bộ nhân vật?<enter>${coNv.length ? `<color=yellow>${coNv.length}<color> tài khoản CÓ nhân vật${cao ? ` (cao nhất ${rt(cao.name)} cấp ${cao.lvl | 0} — ${rt(cao.tk)})` : ""}` : "Không tài khoản nào có nhân vật"}.${dang ? `<enter>${dang} tài khoản đang chơi sẽ được bỏ qua.` : ""}<enter>Tệp chuyển sang thư mục da-xoa (xóa nhầm vẫn cứu được).`, "Xóa", "Hủy bỏ"))) return;
    } else if (!(await api.hoi(`${viec === "duyet" ? "Duyệt vào game" : "Bỏ duyệt"} <color=yellow>${n}<color> tài khoản đã chọn?${viec === "boDuyet" && this.dy && this.dy.bat ? "<enter>Chế độ duyệt đang bật: các tài khoản này không vào game được nữa." : ""}`, viec === "duyet" ? "Duyệt" : "Bỏ duyệt", "Hủy bỏ"))) return;
    const j = await this.goi("loat", { viec, ds: ten, lyDo: this.val("lyDo") || undefined });
    if (!j) return;
    if (j.duyet) this.dy = j.duyet;
    this.tich.clear(); this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
    if (viec === "xoa" && this.chon && (j.ket || []).some((k) => k.ok && k.ten === this.chon)) { this.chon = null; this.ct = null; this.xemDo.clear(); this.qua = null; this.veCt(); }
    return this.taiDs();
  }

  // ---------- tải từ máy chủ ----------
  async taiDs() {
    const j = await this.goi("ds", {}, true);
    if (!j || !this.on) return;
    this.ds = j.ds; this.may = j.may; this.veMay();
    if (this.tab === "nguoi") this.veDs();
  }
  async taiCt(ten) {
    const j = await this.goi("tk", { ten });
    if (!j || ten !== this.chon) return;
    this.ct = j.tk;
    if (this.tab === "nguoi") this.veCt();
  }
  // tu: tự cập nhật (tuNk) — lỗi không báo; dòng chưa có ở lần tải trước tô sáng (N.moi); đang cuộn xuống: giữ đúng chỗ đang xem (dòng mới thêm ở đầu)
  async xemNk(tu) {
    const N = this.nk;
    if (tu && this.nkDang) return;
    this.nkDang = true;
    const j = await this.goi("nhat-ky", { ngay: N.ngay || undefined, loai: N.loai ? N.loai.split(",") : undefined, tk: N.tk || undefined, q: N.q || undefined }, tu).finally(() => { this.nkDang = false; });
    if (!j) return;
    const khoa = (o) => o.t + "|" + o.l + "|" + (o.tk || "") + "|" + o.m, cu = tu && N.ds ? new Set(N.ds.map(khoa)) : null;
    N.moi = cu ? new Set(j.ds.filter((o) => !cu.has(khoa(o)))) : null;
    if (tu && N.ds && !N.moi.size && j.tong === N.tong) return; // không có gì mới: khỏi vẽ lại
    Object.assign(N, { ngay: j.ngay, ngays: j.ngays, ds: j.ds, tong: j.tong });
    if (this.tab !== "nk") return;
    const ng = this.el.querySelector('[data-in="nkNgay"]');
    if (ng && !ng.querySelector(`option[value="${j.ngay}"]`)) return this.render();
    const box = this.el.querySelector(".qt-nk"), top = box ? box.scrollTop : 0, cao = box ? box.scrollHeight : 0;
    this.veNk();
    if (box && top > 0) box.scrollTop = top + (box.scrollHeight - cao);
  }
  // tự cập nhật nhật ký (NK_MS): bảng mở ở thẻ Nhật ký, ô Tự cập nhật bật, đang xem ngày mới nhất
  tuNk() {
    const N = this.nk;
    if (!this.on || this.tab !== "nk" || !N.tu || !N.ds || (N.ngays.length && N.ngay !== N.ngays[0])) return;
    this.xemNk(true);
  }
  timMon() {
    clearTimeout(this.timHen);
    const q = this.qua; if (!q) return;
    q.kq = null;
    const box = this.el.querySelector(".qt-kq"); if (box) box.innerHTML = this.veKq();
    if (!q.tim) return;
    this.timHen = setTimeout(async () => {
      const tim = q.tim, j = await this.goi("mon", { q: tim }, true);
      if (this.qua !== q || q.tim !== tim) return;
      q.kq = j ? j.ds : [];
      const b = this.el.querySelector(".qt-kq"); if (b) b.innerHTML = this.veKq();
    }, TIM_MS);
  }

  // ---------- nhập / bấm ----------
  nhap(t, xong) {
    const k = t.dataset.in, v = t.value;
    if (!k) return;
    if (k === "q" || k === "kieu" || k === "vang") { this.loc[k] = k === "vang" ? Math.max(0, Math.min(3650, Math.floor(+v || 0))) : v; this.tich.clear(); this.veDs(); return; }
    if (k === "tich") { if (t.checked) this.tich.add(t.dataset.ten); else this.tich.delete(t.dataset.ten); if (xong) this.veDs(); return; }
    if (k === "tichHet") { const L = (this.dsLoc || []).filter((x) => !x.admin); if (t.checked) for (const x of L) this.tich.add(x.ten); else for (const x of L) this.tich.delete(x.ten); if (xong) this.veDs(); return; }
    if (k === "nkNgay") { this.nk.ngay = v; this.nk.ds = null; this.veNk(); this.xemNk(); return; }
    if (k === "nkLoai") { this.nk.loai = v; this.xemNk(); return; }
    if (k === "nkTu") { this.nk.tu = t.checked ? 1 : 0; if (t.checked) this.xemNk(true); return; }
    if (k === "nkTk" || k === "nkQ") { this.nk[k === "nkTk" ? "tk" : "q"] = v.trim(); if (xong) this.xemNk(); return; }
    if (k === "quaCao" || k === "quaKhoa") { this.maForm[k === "quaCao" ? "cao" : "khoa"] = !!t.checked; return; } // quà toàn máy chủ: 2 ô tích (anh 10/11)
    if (k === "maKhoa") { this.maForm.maKhoa = !!t.checked; return; } // mã kích hoạt khóa vĩnh viễn (anh 11/11) — ô riêng, không dính ô của Gửi thẳng
    const q = this.qua; if (!q) return;
    if (k === "qTien") { q.tien = Math.max(0, Math.floor(+v || 0)); const n = this.el.querySelector(".qt-qtien"); if (n) n.textContent = q.tien ? fmtMoney(q.tien) : ""; }
    else if (k === "qXu") q.xu = Math.max(0, Math.floor(+v || 0));
    else if (k === "qLoi") q.loi = v;
    else if (k === "qTim") { q.tim = v.trim(); this.timMon(); }
    else if (k === "qSo" || k === "qDong" || k === "qHe") {
      const m = q.mon[t.dataset.i | 0]; if (!m) return;
      if (k === "qSo") m.so = Math.max(1, Math.floor(+v || 1)); else if (k === "qDong") m.dong = v | 0; else m.he = +v;
    }
  }
  val(k) { const i = this.el.querySelector(`[data-in="${k}"]`); return i ? i.value.trim() : ""; }

  async act(a, t) {
    const api = this.api, ct = this.ct;
    switch (a) {
      case "dong": return this.toggle(false);
      case "hoatDong": this.hd = this.hd && this.hd.tk === this.chon ? null : new HoatDongQt(this, this.chon); return this.veCt();
      case "moi": this.bao(""); return this.taiDs();
      case "taoTk": this.taoTk = !this.taoTk; return this.render();
      case "baoTri": this.btForm = !this.btForm; return this.render();
      // duyệt người chơi vào game (anh 11/11 khuya — veDuyet, may-chu/duyet.js)
      case "duyet": this.dyForm = !this.dyForm; this.dyKet = null; this.render(); if (this.dyForm) { await this.taiDy(); this.render(); } return;
      case "dyBat": case "dyTat": {
        const n = (this.dy && this.dy.n) | 0;
        if (a === "dyBat" && !(await api.hoi(`Bật duyệt vào game?<enter>Chỉ tài khoản quản trị + <color=yellow>${n}<color> tài khoản đã duyệt đăng nhập / chơi được — người khác đang chơi bị đưa về màn đăng nhập.`, "Bật duyệt", "Hủy bỏ"))) return;
        const j = await this.goi("duyet", { viec: a === "dyBat" ? "bat" : "tat" }); if (!j) return;
        this.dy = j.duyet; this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`); return this.taiDs().then(() => this.render());
      }
      case "dyThem": case "dyCt": {
        const s = a === "dyCt" ? t.dataset.ten : this.val("dyNhap");
        if (!s) return this.bao("Nhập ID tài khoản hoặc tên nhân vật", true);
        const j = await this.goi("duyet", { viec: "them", ds: s }); if (!j) return;
        this.dy = j.duyet; this.dyKet = j.ket || [];
        const loi1 = this.dyKet.find((k) => !k.ok);
        this.bao(a === "dyCt" && loi1 ? `Không duyệt được ${loi1.ten || loi1.s}: ${loi1.ly}` : j.msg, !!(a === "dyCt" && loi1));
        await this.taiDs(); if (a === "dyCt" && ct) await this.taiCt(ct.ten); return this.render();
      }
      case "dyBo": {
        const ten = t.dataset.ten; if (!ten) return;
        if (!(await api.hoi(`Bỏ duyệt <color=yellow>${rt(ten)}<color>?${this.dy && this.dy.bat ? "<enter>Chế độ duyệt đang bật: tài khoản này không vào game được nữa (đang chơi thì bị đưa về màn đăng nhập)." : ""}`, "Bỏ duyệt", "Hủy bỏ"))) return;
        const j = await this.goi("duyet", { viec: "bo", ten }); if (!j) return;
        this.dy = j.duyet; this.bao(j.msg); await this.taiDs(); if (ct && ct.ten === ten) await this.taiCt(ten); return this.render();
      }
      case "lhTai": this.bao(""); return this.taiLich();
      case "lhLuu": case "lhMac": {
        const id = t.dataset.id, x = this.lich && this.lich.ds.find((d) => d.id === id); if (!x) return;
        if (a === "lhMac") {
          if (!(await api.hoi(`Đưa lịch <color=yellow>${esc(x.ten)}<color> về mặc định (cấu hình máy chủ)?`, "Xác nhận", "Hủy bỏ"))) return;
          const j = await this.goi("lich-hd", { viec: "macDinh", id }); if (!j) return;
          this.lich = j; this.veLich(); return this.bao(`Đã đưa lịch ${x.ten} về mặc định`);
        }
        const b = this.docLich(id); if (!b) return;
        const moTa = x.kieu === "pq" ? `quay ${b.quay}, nhận tới ${b.hetNhan} (áp dụng từ ngày mai)` : `giờ ${b.gio}`;
        if (!(await api.hoi(`Lưu lịch <color=yellow>${esc(x.ten)}<color>: ${b.bat ? "" : "<color=red>TẠM DỪNG<color> · "}${esc(moTa)}?<enter>Áp dụng ngay, không cần khởi động lại máy chủ.`, "Lưu", "Hủy bỏ"))) return;
        const j = await this.goi("lich-hd", { viec: "luu", ...b }); if (!j) return;
        this.lich = j; this.veLich(); this.bao(`Đã lưu lịch ${x.ten}`); return api.msg(`Quản trị: đã lưu lịch ${x.ten}`);
      }
      case "btBat": case "btTat": {
        if (a === "btTat") {
          if (!(await api.hoi("Tắt bảo trì — mở máy chủ cho mọi người vào ngay?", "Xác nhận", "Hủy bỏ"))) return;
          const j = await this.goi("bao-tri", { bat: false }); if (!j) return;
          this.bao("Đã tắt bảo trì — mọi người vào được"); this.btForm = false; return this.taiDs().then(() => this.render());
        }
        const g = /^(\d{1,2}):(\d{2})$/.exec(this.val("btGio")), d = /^(\d{1,2})\/(\d{1,2})$/.exec(this.val("btNgay"));
        if (!g || !d || +g[1] > 23 || +g[2] > 59) return this.bao("Giờ dạng 13:00, ngày dạng 01/11", true);
        const nam = new Date(Date.now() + 7 * 3600e3).getUTCFullYear(), den = Date.UTC(nam, +d[2] - 1, +d[1], +g[1] - 7, +g[2]);
        if (!(den > Date.now())) return this.bao("Giờ mở đã qua — chọn giờ sau bây giờ", true);
        if (!(await api.hoi(`Bật bảo trì tới <color=yellow>${p2(+g[1])}:${g[2]} ngày ${p2(+d[1])}/${p2(+d[2])}<color> (giờ Việt Nam)?<enter>Chỉ tài khoản quản trị vào được game; người đang chơi bị đưa về màn đăng nhập.`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("bao-tri", { bat: true, den, loi: this.val("btLoi") }); if (!j) return;
        this.bao(`Đã bật bảo trì — ${j.baoTri ? j.baoTri.cau : ""}`); api.msg("Quản trị: đã bật bảo trì"); this.btForm = false; return this.taiDs().then(() => this.render());
      }
      case "boHack": {
        if (!ct || !(await api.hoi(`Xóa cờ nghi tăng tốc của <color=yellow>${rt(ct.ten)}<color>? (nhật ký vẫn giữ)`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "bo-hack", ten: ct.ten, lyDo: this.val("lyDo") }); if (!j) return;
        this.bao(j.msg); this.taiDs(); return this.taiCt(ct.ten);
      }
      // nghi dùng công cụ (anh 13/11 — may-chu/nghi-tool.js): xóa cờ của tài khoản đang xem (nhật ký "tool" vẫn giữ); Xem ở dòng trên: lọc danh sách
      case "boTool": {
        if (!ct || !(await api.hoi(`Xóa cờ nghi dùng công cụ của <color=yellow>${rt(ct.ten)}<color>? (nhật ký vẫn giữ)`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "bo-tool", ten: ct.ten, lyDo: this.val("lyDo") }); if (!j) return;
        this.bao(j.msg); this.taiDs(); return this.taiCt(ct.ten);
      }
      case "locTool": this.tab = "nguoi"; this.loc.kieu = "tool"; return this.render();
      case "locToolYeu": this.tab = "nguoi"; this.loc.kieu = "toolYeu"; return this.render(); // anh 16/11: tín hiệu yếu xem riêng
      // nghi hack sát thương (anh 16/11 — may-chu/nghi-dame.js): lọc danh sách / xóa cờ của tài khoản đang xem (nhật ký "hack" vẫn giữ)
      case "locDame": this.tab = "nguoi"; this.loc.kieu = "dame"; return this.render();
      case "boDame": {
        if (!ct || !(await api.hoi(`Xóa cờ nghi hack sát thương của <color=yellow>${rt(ct.ten)}<color>? (nhật ký vẫn giữ)`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "bo-dame", ten: ct.ten, lyDo: this.val("lyDo") }); if (!j) return;
        this.bao(j.msg); this.taiDs(); return this.taiCt(ct.ten);
      }
      // xóa cờ hàng loạt (anh 11/11 "cho anh cái xóa cờ hàng loạt"): cờ CŨ của bộ dò trước (không có v) hệ số dưới ×2 — phần lớn báo nhầm lúc máy
      // chủ cũ lag; cờ ×2 trở lên và cờ của bộ dò mới (nghi thật) giữ lại để xem từng người (lọc Nghi tăng tốc) — may-chu/quan-tri.js bo-hack-het
      case "boHackHet": {
        const co = (this.ds || []).filter((t) => t.hack), nhe = co.filter((t) => !t.hack.v && !(+t.hack.x >= 2)).length, giu = co.length - nhe;
        const cau = this.ds ? `Xóa cờ nghi tăng tốc của <color=yellow>${nhe} tài khoản<color> do bộ dò cũ đặt, hệ số dưới ×2 — phần lớn là báo nhầm lúc máy chủ cũ lag?${giu ? `<enter>Giữ lại ${giu} cờ ×2 trở lên hoặc do bộ dò mới bắt, để xem từng người.` : ""}<enter>Nhật ký vẫn giữ các lần đã ghi.`
          : `Xóa cờ nghi tăng tốc cũ hệ số dưới ×2? Cờ nặng và cờ của bộ dò mới giữ lại.<enter>Nhật ký vẫn giữ các lần đã ghi.`;
        if (this.ds && !nhe) return this.bao(giu ? `Còn ${giu} cờ cần xem từng người (×2 trở lên hoặc do bộ dò mới bắt)` : "Không có cờ nào", true);
        if (!(await api.hoi(cau, "Xóa cờ", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "bo-hack-het", duoi: 2, lyDo: this.val("lyDo") }); if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`); await this.taiDs(); if (ct) this.taiCt(ct.ten); return;
      }
      // đổi mật khẩu của chính tài khoản quản trị đang dùng bảng (anh 29/10 "quản lý sever thêm cái đổi mk" — bảng không đổi mật khẩu tài khoản
      // quản trị): từ 10/11 dùng chung khung Đổi mật khẩu đăng nhập của khóa an toàn (src/game/khoaantoan.js — luật như người chơi: ≥ 6 ký tự, khác
      // tên, nhập sai tính vào khóa nhập); máy cũ không có khung thì vẫn ô cũ (may-chu/quan-tri.js doi-mk-minh)
      case "mkToi": return api.doiMk1 && api.doiMk1(); // máy chủ bỏ đường cũ doi-mk-minh (rà soát 10/11) — luôn khung khóa an toàn
      // xóa mật khẩu cấp 2 của người chơi quên (lựa chọn 3a: chỉ quản trị xóa — xác minh qua Zalo / điện thoại trước)
      case "xoaMk2": {
        if (!ct || !(await api.hoi(`Xóa mật khẩu cấp 2 của <color=yellow>${rt(ct.ten)}<color>?<enter>Chỉ làm khi đã xác minh đúng chủ tài khoản. Lần tới cần giao dịch / bày bán / vứt / hủy đồ, người chơi sẽ được hỏi đặt mật khẩu mới.`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "xoa-mk2", ten: ct.ten }); if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`); this.taiDs(); return this.taiCt(ct.ten);
      }
      // nhật ký mật khẩu của tài khoản đang xem (loại mk + sai-mk, hôm nay)
      case "xemMkNk": {
        if (!ct) return;
        Object.assign(this.nk, { tk: ct.ten, loai: "mk,sai-mk", ds: null, tu: 1 }); this.tab = "nk"; this.render(); return this.xemNk && this.xemNk();
      }
      case "mkToiGui": {
        const cu = this.val("mkCu"), mk = this.val("mkMoi"), lai = this.val("mkLai"), me = (api.me() || {}).ten || "";
        if (!cu) return this.bao("Nhập mật khẩu hiện tại", true);
        if (mk.length < 4) return this.bao("Mật khẩu mới cần ít nhất 4 ký tự", true);
        if (mk !== lai) return this.bao("Nhập lại mật khẩu mới chưa khớp", true);
        if (mk === cu) return this.bao("Mật khẩu mới giống mật khẩu hiện tại", true);
        if (!(await api.hoi(`Đổi mật khẩu tài khoản <color=yellow>${rt(me)}<color> của bạn?<enter>Lần đăng nhập sau dùng mật khẩu mới.`, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "doi-mk-minh", cu, mk });
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`); this.mkToi = false; return this.render();
      }
      case "taoTkGui": {
        const ten = this.val("tkTen"), mk = this.val("tkMk"), chu = this.val("tkChu");
        if (!ten || !mk) return this.bao("Nhập tên và mật khẩu cho tài khoản mới", true);
        const j = await this.goi("xu-ly", { viec: "tao", ten, mk, chu });
        if (!j) return;
        this.bao(j.msg); this.taoTk = false; this.render(); return this.taiDs();
      }
      case "chon": {
        const ten = t.dataset.ten;
        if (this.chon !== ten) { this.chon = ten; this.ct = null; this.xemDo.clear(); this.qua = null; }
        this.veDs(); this.veCt(); return this.taiCt(ten);
      }
      case "ctMoi": return this.chon && this.taiCt(this.chon);
      // anh 10/11: gắn người chơi (chủ) cho tài khoản · nhắn riêng · dịch chuyển tới chỗ người đang chơi (may-chu/quan-tri.js xu-ly chu / nhan / toi)
      case "luuChu": {
        if (!ct) return;
        const j = await this.goi("xu-ly", { viec: "chu", ten: ct.ten, chu: this.val("chu") }); if (!j) return;
        this.bao(j.msg); this.taiDs(); return this.taiCt(ct.ten);
      }
      case "nhanGui": {
        if (!ct) return;
        const tin = this.val("nhanT"); if (!tin) return this.bao("Nhập nội dung tin nhắn", true);
        const j = await this.goi("xu-ly", { viec: "nhan", ten: ct.ten, t: tin }); if (!j) return;
        const o = this.el.querySelector('[data-in="nhanT"]'); if (o) o.value = "";
        return this.bao(j.msg);
      }
      case "toiCho": {
        if (!ct) return;
        const j = await this.goi("xu-ly", { viec: "toi", ten: ct.ten }); if (!j || !j.toi) return;
        if (api.toi) { this.toggle(); api.toi(j.toi.z, j.toi.x, j.toi.y, j.toi.chung); }
        return api.msg(`Quản trị: ${j.msg}`);
      }
      case "lamMau": { // anh 09/11 — chụp đồ + kỹ năng của nhân vật này làm mẫu cho bot Tống Kim cùng phái
        const j = ct && (await this.goi("xu-ly", { viec: "mau-bot", ten: ct.ten, o: t.dataset.o | 0 }));
        if (j) { this.mauBot = j.ds; this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`); }
        return;
      }
      case "boMau": {
        const x = (this.mauBot || []).find((m) => m.i === (t.dataset.i | 0)); if (!x) return;
        if (!(await api.hoi(`Xóa mẫu bot <color=yellow>${rt(x.ten)}<color>?`, "Xóa", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "bo-mau-bot", i: x.i });
        if (j) { this.mauBot = j.ds; this.veMau(); this.bao(j.msg); }
        return;
      }
      case "tich": return; // ô tích (thay đổi xử lý ở nhap) — không mở chi tiết dòng
      case "loatBo": this.tich.clear(); return this.veDs();
      case "loatDuyet": case "loatBoDuyet": case "loatXoa": return this.loat(a);
      case "xoaTk": { // anh 09/11 "cho admin quyền xóa tài khoản" — máy chủ chuyển tệp sang du-lieu/da-xoa (cứu được nếu xóa nhầm)
        if (!ct) return;
        const lyDo = this.val("lyDo");
        if (!(await api.hoi(`<color=red>XÓA<color> tài khoản <color=yellow>${rt(ct.ten)}<color> cùng toàn bộ nhân vật?<enter>Người đó bị đưa ra khỏi game và không đăng nhập được nữa.`, "Xóa", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: "xoa-tk", ten: ct.ten, lyDo });
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
        this.chon = null; this.ct = null; this.xemDo.clear(); this.qua = null;
        this.veCt(); return this.taiDs();
      }
      case "da": case "khoa": case "moKhoa": case "doiMk": {
        if (!ct) return;
        const lyDo = this.val("lyDo"), gio = +this.val("gio") || 0, mk = this.val("mk");
        if (a === "doiMk" && mk.length < 4) return this.bao("Mật khẩu mới cần ít nhất 4 ký tự", true);
        const han = (KHOA_GIO.find(([v]) => v === gio) || [0, "vĩnh viễn"])[1].toLowerCase();
        const cau = { da: `Đưa <color=yellow>${rt(ct.ten)}<color> ra khỏi game?`, khoa: `Khóa tài khoản <color=yellow>${rt(ct.ten)}<color> ${rt(han)}?`,
          moKhoa: `Mở khóa tài khoản <color=yellow>${rt(ct.ten)}<color>?`, doiMk: `Đặt lại mật khẩu tài khoản <color=yellow>${rt(ct.ten)}<color>? Tài khoản đó sẽ bị đăng xuất; lần đăng nhập tới người chơi phải tự đổi mật khẩu mới vào game được. Mật khẩu cấp 2 giữ nguyên.` }[a];
        if (!(await api.hoi(cau + (lyDo && (a === "da" || a === "khoa") ? `<enter>Lý do: ${rt(lyDo)}` : ""), "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", { viec: { da: "da", khoa: "khoa", moKhoa: "mo-khoa", doiMk: "doi-mk" }[a], ten: ct.ten, lyDo, gio, mk });
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
        this.taiDs(); return this.taiCt(ct.ten);
      }
      case "xemDo": { const o = t.dataset.o | 0; if (this.xemDo.has(o)) this.xemDo.delete(o); else this.xemDo.add(o); return this.veCt(); }
      // nút bỏ chọn (blur): Esc tới game -> đóng khung soi đồ (nằm trên bảng) thay vì đóng bảng (keydown của bảng)
      case "soiDo": { const j = ct && (await this.goi("soi", { ten: ct.ten, o: t.dataset.o | 0 })); if (j) { t.blur(); api.soiDo(j.nv); } return; }
      case "moQua": { const o = t.dataset.o | 0; this.qua = this.qua && this.qua.o === o ? null : { o, mon: [], tien: 0, xu: 0, loi: "", tim: "", kq: [] }; return this.veCt(); }
      case "dongQua": this.qua = null; return this.veCt();
      case "themMon": {
        const q = this.qua, m = q && (q.kq || []).find((x) => x.k === t.dataset.k);
        if (!m) return;
        if (q.mon.length >= 20) return this.bao("Mỗi lần gửi tối đa 20 món", true);
        q.mon.push({ ...m, so: 1, dong: m.loai === "do" ? 3 : 0, he: -1 });
        const b = this.el.querySelector(".qt-chon"); if (b) b.innerHTML = this.veChon();
        return;
      }
      case "boMon": { const q = this.qua; if (!q) return; q.mon.splice(t.dataset.i | 0, 1); const b = this.el.querySelector(".qt-chon"); if (b) b.innerHTML = this.veChon(); return; }
      case "guiQua": {
        const q = this.qua, h = ct && ct.nv.find((x) => x.o === q.o);
        if (!q || !h) return;
        const ds = [...q.mon.map((m) => `${m.so} ${m.n}${m.loai === "do" ? ` (${m.dong ? `${m.dong} dòng` : "trắng"}${m.he >= 0 ? `, ${HE[m.he]}` : ""})` : ""}`),
          ...(q.tien ? [fmtMoney(q.tien)] : []), ...(q.xu ? [`${so(q.xu)} Xu`] : [])];
        if (!ds.length) return this.bao("Chưa chọn quà", true);
        if (!(await api.hoi(`Gửi cho <color=yellow>${rt(h.name)}<color> (${rt(ct.ten)}):<enter>${ds.map(rt).join(", ")}${q.loi ? `<enter>Lời nhắn: ${rt(q.loi)}` : ""}`, "Gửi quà", "Hủy bỏ"))) return;
        const j = await this.goi("qua", { ten: ct.ten, o: q.o, tien: q.tien, xu: q.xu, loi: q.loi, mon: q.mon.map((m) => ({ k: m.k, n: m.so, ...(m.loai === "do" ? { dong: m.dong, he: m.he } : {}) })) });
        if (!j) return;
        this.bao(`${j.msg}: ${j.ds.join(", ")}`); api.msg(`Quản trị: ${j.msg}`);
        this.qua = null; return this.taiCt(ct.ten);
      }
      case "taoMa": {
        const q = this.maForm, ma = this.val("maTen"), toiDa = Math.max(0, Math.floor(+this.val("maLuot") || 0)), ngay = +this.val("maNgay") || 0;
        const ds = [...q.mon.map((m) => `${m.so} ${m.n}${m.loai === "do" ? ` (${m.dong ? `${m.dong} dòng` : "trắng"}${m.he >= 0 ? `, ${HE[m.he]}` : ""})` : ""}`),
          ...(q.tien ? [fmtMoney(q.tien)] : []), ...(q.xu ? [`${so(q.xu)} Xu`] : [])];
        if (!ds.length) return this.bao("Chưa chọn quà cho mã", true);
        const han = (MA_HAN.find(([v]) => v === ngay) || [0, "không hạn"])[1].toLowerCase();
        // luôn ghi trạng thái khóa (soát 11/11: bảng có 2 ô "Khóa vĩnh viễn" — tích nhầm ô của Gửi thẳng thì khung xác nhận cho thấy ngay)
        if (!(await api.hoi(`Tạo mã kích hoạt <color=yellow>${ma ? rt(ma.toUpperCase()) : "(tự sinh)"}<color>${q.maKhoa ? " — <color=yellow>món khóa vĩnh viễn<color>" : " — món không khóa"}:<enter>${ds.map(rt).join(", ")}<enter>${toiDa ? `${toiDa} lượt` : "Không giới hạn lượt"} · ${rt(han)}`, "Tạo mã", "Hủy bỏ"))) return;
        const j = await this.goi("ma-qua", { viec: "tao", ma, toiDa, ngay, tien: q.tien, xu: q.xu, loi: q.loi, ...(q.maKhoa ? { khoa: 1 } : {}), mon: q.mon.map((m) => ({ k: m.k, n: m.so, ...(m.loai === "do" ? { dong: m.dong, he: m.he } : {}) })) });
        if (!j) return;
        this.bao(`${j.msg} — đưa mã này cho người chơi nhập ở Lễ quan`); api.msg(`Quản trị: ${j.msg}`);
        this.maForm = { o: -1, mon: [], tien: 0, xu: 0, loi: "", tim: "", kq: [] };
        return this.render();
      }
      // quà toàn máy chủ (anh 04/11): dùng các dòng chọn quà của thẻ (this.maForm) — vào thẳng nhân vật (may-chu/quan-tri.js quaTat)
      case "guiTat": {
        const q = this.maForm, ai = this.val("quaAi") === "dang" ? "dang" : "tat", cao = !!q.cao && ai === "tat", khoa = !!q.khoa;
        const ds = [...q.mon.map((m) => `${m.so} ${m.n}${m.loai === "do" ? ` (${m.dong ? `${m.dong} dòng` : "trắng"}${m.he >= 0 ? `, ${HE[m.he]}` : ""})` : ""}`),
          ...(q.tien ? [fmtMoney(q.tien)] : []), ...(q.xu ? [`${so(q.xu)} Xu`] : [])];
        if (!ds.length) return this.bao("Chưa chọn quà", true);
        if (!(await api.hoi(`Gửi quà cho <color=yellow>${ai === "dang" ? "mọi nhân vật đang chơi" : cao ? "nhân vật cấp cao nhất của mỗi tài khoản" : "MỌI nhân vật của mọi tài khoản"}<color>${khoa ? " — <color=yellow>món khóa vĩnh viễn<color>" : " — món không khóa"}:<enter>${ds.map(rt).join(", ")}${q.loi ? `<enter>Lời nhắn: ${rt(q.loi)}` : ""}<enter>Vào thẳng hành trang, không thu hồi được.`, "Gửi toàn máy chủ", "Hủy bỏ"))) return;
        const j = await this.goi("qua-tat", { ai, tien: q.tien, xu: q.xu, loi: q.loi, ...(cao ? { cao: 1 } : {}), ...(khoa ? { khoa: 1 } : {}), mon: q.mon.map((m) => ({ k: m.k, n: m.so, ...(m.loai === "do" ? { dong: m.dong, he: m.he } : {}) })) });
        if (!j) return;
        this.bao(`${j.msg}: ${j.ds.join(", ")}`); api.msg(`Quản trị: ${j.msg}`);
        this.maForm = { o: -1, mon: [], tien: 0, xu: 0, loi: "", tim: "", kq: [] };
        return this.render();
      }
      // đổi giới tính (anh 14/11 — may-chu/quan-tri.js doiGioi): máy chủ kiểm trước (xem: phái chỉ nhận 1 giới, hệ không phái nào nhận, hành trang thiếu chỗ cất đồ chỉ
      // hợp giới cũ — chặn thì câu báo ở dòng trên của bảng) rồi mới hỏi bằng khung của game, kèm các món sẽ cất vào hành trang
      case "doiGioi": {
        const o = t.dataset.o | 0, h = ct && ct.nv.find((x) => x.o === o);
        if (!h) return;
        const G = { m: "nam", f: "nữ" }, b = { ten: ct.ten, o, viec: "gioi", sex: h.sex === "f" ? "m" : "f" };
        const x = await this.goi("xu-ly", { ...b, xem: 1 }), X = x && x.xem;
        if (!X) return;
        if (!(await api.hoi(`Đổi giới tính <color=yellow>${rt(h.name)}<color> từ ${G[X.tu]} sang <color=yellow>${G[X.sang]}<color>?${X.ra ? "<enter>Tài khoản đang đăng nhập — sẽ bị đưa ra màn đăng nhập." : ""}${X.mon.length ? `<enter>Cất ${X.mon.length} món chỉ ${G[X.tu]} mặc được vào hành trang: ${X.mon.map(rt).join(", ")}.` : ""}`, "Đổi giới tính", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", b);
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
        this.taiDs(); return this.taiCt(ct.ten);
      }
      // quản lý nhân vật (anh 04/11): giải kẹt / tăng cấp / đổi phái — tài khoản thường
      case "giaiKet": case "tangCap": case "doiPhai": {
        const o = t.dataset.o | 0, h = ct && ct.nv.find((x) => x.o === o);
        if (!h) return;
        let b = { ten: ct.ten, o }, cau = "";
        if (a === "giaiKet") { b.viec = "giai-ket"; cau = `Đưa <color=yellow>${rt(h.name)}<color> về Ba Lăng huyện?<enter>Đang chơi thì chuyển ngay; không chơi thì lần vào game sau đứng ở Ba Lăng.`; }
        else if (a === "tangCap") {
          const lv = Math.floor(+this.val("qlLv" + o) || 0);
          if (!(lv > h.lvl)) return this.bao(`Nhập cấp mới lớn hơn cấp hiện tại (${h.lvl})`, true);
          if (lv > 200) return this.bao("Cấp tối đa là 200", true);
          b = { ...b, viec: "cap", lv }; cau = `Nâng <color=yellow>${rt(h.name)}<color> từ cấp ${h.lvl} lên cấp ${lv}?<enter>Kinh nghiệm của cấp về 0.`;
        } else {
          const v = this.val("qlFac" + o), F = (this.api.factions ? this.api.factions() : []).find((f) => String(f.id) === v);
          if (!F) return this.bao("Chọn môn phái cần chuyển", true);
          b = { ...b, viec: "phai", fac: F.id };
          cau = `Chuyển <color=yellow>${rt(h.name)}<color> sang <color=yellow>${rt(F.n)}<color> (hệ ${HE[F.series]})?<enter>Võ công phái cũ và sách 90 / 120 đã học bị bỏ, điểm kỹ năng trả lại để cộng lại.${ct.dang ? "<enter>Người này đang chơi — sẽ bị đưa ra màn đăng nhập." : ""}`;
        }
        if (!(await api.hoi(cau, "Xác nhận", "Hủy bỏ"))) return;
        const j = await this.goi("xu-ly", b);
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
        this.taiDs(); return this.taiCt(ct.ten);
      }
      case "maAi": { const k = t.dataset.ma; if (this.maMo.has(k)) this.maMo.delete(k); else this.maMo.add(k); return this.veMa(); }
      // Sửa mã (anh 09/11): nạp mã vào khung tạo mã ở đầu thẻ
      case "maSua": {
        const j = await this.goi("ma-qua", { viec: "lay", ma: t.dataset.ma });
        if (!j) return;
        this.maSua = { ma: j.ma, toiDa: j.toiDa, daDung: j.daDung, het: j.het };
        this.maForm = { o: -1, mon: j.mon, tien: j.tien, xu: j.xu, loi: j.loi, tim: "", kq: [], maKhoa: !!j.khoa };
        this.render();
        const b = this.el.querySelector(".dv-body"); if (b) b.scrollTop = 0;
        return this.bao(`Đang sửa mã ${j.ma} ở đầu thẻ`);
      }
      case "huySua": this.bao(""); return this.boSua();
      case "luuMa": {
        const S = this.maSua, q = this.maForm; if (!S) return;
        const toiDa = Math.max(0, Math.floor(+this.val("maLuot") || 0)), v = this.val("maNgay"), ngay = v === "giu" ? "giu" : +v || 0;
        const ds = [...q.mon.map((m) => `${m.so} ${m.n}${m.loai === "do" ? ` (${m.dong ? `${m.dong} dòng` : "trắng"}${m.he >= 0 ? `, ${HE[m.he]}` : ""})` : ""}`),
          ...(q.tien ? [fmtMoney(q.tien)] : []), ...(q.xu ? [`${so(q.xu)} Xu`] : [])];
        if (!ds.length) return this.bao("Chưa chọn quà cho mã", true);
        const han = (this.hanSua(S).find(([x]) => String(x) === v) || [0, ""])[1];
        if (!(await api.hoi(`Lưu thay đổi mã <color=yellow>${rt(S.ma)}<color>${q.maKhoa ? " — <color=yellow>món khóa vĩnh viễn<color>" : " — món không khóa"}:<enter>${ds.map(rt).join(", ")}<enter>${toiDa ? `${toiDa} lượt` : "Không giới hạn lượt"} · ${rt(han)}`, "Lưu", "Hủy bỏ"))) return;
        const j = await this.goi("ma-qua", { viec: "sua", ma: S.ma, toiDa, ngay, tien: q.tien, xu: q.xu, loi: q.loi, khoa: q.maKhoa ? 1 : 0, mon: q.mon.map((m) => ({ k: m.k, n: m.so, ...(m.loai === "do" ? { dong: m.dong, he: m.he } : {}) })) });
        if (!j) return;
        this.bao(j.msg); api.msg(`Quản trị: ${j.msg}`);
        return this.boSua();
      }
      case "maTat": case "maMoLai": case "maXoa": {
        const k = t.dataset.ma;
        if (a === "maXoa" && !(await api.hoi(`Xóa mã <color=yellow>${rt(k)}<color>? Người chơi sẽ không nhập được mã này nữa.`, "Xóa", "Hủy bỏ"))) return;
        const j = await this.goi("ma-qua", { viec: { maTat: "tat", maMoLai: "mo", maXoa: "xoa" }[a], ma: k });
        if (!j) return;
        this.bao(j.msg);
        if (a === "maXoa" && this.maSua && this.maSua.ma === k) return this.boSua();
        return this.taiMa();
      }
      case "nkXem": { this.nk.tk = this.val("nkTk"); this.nk.q = this.val("nkQ"); return this.xemNk(); }
      case "nkTkLoc": { if (!t.dataset.tk) return; this.nk.tk = t.dataset.tk; this.render(); return this.xemNk(); }
      case "guiTb": {
        const text = this.val("tb");
        if (!text) return this.bao("Nhập nội dung thông báo", true);
        if (!(await api.hoi(`Gửi thông báo tới mọi người đang chơi?<enter><color=yellow>${rt(text)}<color>`, "Gửi", "Hủy bỏ"))) return;
        const j = await this.goi("thong-bao", { t: text });
        if (!j) return;
        this.bao(j.msg);
        const i = this.el.querySelector('[data-in="tb"]'); if (i) i.value = "";
        return this.xemTb();
      }
      case "ghim": case "boGhim": {
        const text = a === "ghim" ? this.val("ghim") : "";
        if (a === "ghim" && !text) return this.bao("Nhập nội dung ghim", true);
        if (!(await api.hoi(a === "ghim" ? `Ghim lên đầu khung chat của mọi người?<enter><color=yellow>${rt(text)}<color>` : "Bỏ dòng ghim ở khung chat của mọi người?", a === "ghim" ? "Ghim" : "Bỏ ghim", "Hủy bỏ"))) return;
        const j = await this.goi("ghim", a === "ghim" ? { t: text } : { bo: 1 });
        if (!j) return;
        this.bao(j.msg);
        const i = this.el.querySelector('[data-in="ghim"]'); if (i && a === "ghim") i.value = "";
        return this.xemTb();
      }
    }
  }
}
