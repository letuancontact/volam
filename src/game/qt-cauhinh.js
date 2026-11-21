// Thẻ "Cấu hình" của bảng quản trị F10 (anh 11/11 tối: "tất cả cái nào điều chỉnh trong sv đều để cho admin điều chỉnh được … chỉ cần 1 lần thì
// sau này mình rất là nhàn" — máy chủ: may-chu/cau-hinh-qt.js, README lượt 75).
//   - Thường dùng: các số hay chỉnh gom 1 trang (kinh nghiệm, rơi đồ, giá Xu, đổi phái, ủy thác, cấp tham gia hoạt động — tự tìm mọi mục có "cap",
//     tài khoản) + nút mở các mục quà.
//   - Kỹ năng phái: % sát thương võ công từng phái + từng chiêu (cau-hinh.json kyNangPhai — vocong.js kyK).
//   - Mọi mục của cau-hinh.json: lời giải thích có sẵn + ô sửa theo kiểu (số / bật tắt / chữ / danh sách / nhóm / dòng); danh sách [mã món, số] hiện
//     tên món + ô tìm món theo tên để thêm; dòng (mảng nhóm) thêm / xóa được; chỗ phức tạp sửa dạng chữ JSON. Ô khác mặc định có ghi "mặc định: …".
//   - Lưu từng mục (máy chủ kiểm kiểu, lưu du-lieu — gửi mã lên VPS không ghi đè), Về mặc định, lịch sử sửa; Khởi động lại máy chủ an toàn (hẹn N
//     giây, báo cả máy chủ; chặn khi đang có hoạt động) + Bắt cả máy chủ F5 (đếm ngược rồi tự tải lại, vào lại đúng nhân vật).
// Hỏi xác nhận bằng khung trong game (api.hoi) — không dùng hộp thoại trình duyệt.
// Anh 17/11 lần 2 ("tab này khá khó hiểu, bấm vào rồi lại k có nút quay lại" · "xem thử có cái quà nào mình bỏ sót k" · "còn cái kia anh mở vô k dám sửa"):
// trang "🎁 Quà & thưởng" gom mọi nguồn quà theo nhóm (thêm 9 nguồn trước chưa có nút); mỗi nguồn 1 trang gọn: tên tiếng Việt, 1–2 câu giải thích, chỉ các
// ô phần thưởng (nhãn tiếng Việt, tên món, bảng có tiêu đề cột, số dễ đọc vạn / triệu); "Mọi thông số (nâng cao)" và "Ghi chú kỹ thuật" thu gọn; nút
// "← Quay lại" về đúng trang + chỗ cuộn cũ. Nhãn: src/game/qt-qua.js.
import { ItemDB } from "./itemdb.js";
import { DINH, NHOM_QUA, CHUNG, TU } from "./qt-qua.js";

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const laDT = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const sao = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const prim = (v) => v === null || ["number", "string", "boolean"].includes(typeof v);
const maMon = (v) => Array.isArray(v) && v.length >= 1 && v.length <= 3 && typeof v[0] === "string" && /^[a-z]+:[\w:.-]+$/i.test(v[0]) && (v.length < 2 || typeof v[1] === "number");
const P = (p) => esc(JSON.stringify(p));
const p2 = (n) => String(n).padStart(2, "0");
const gio = (t) => { const d = new Date(t + 7 * 3600e3); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`; };
const tenMon = (k) => { try { return ((ItemDB.item(k) || {}).n || k).trim(); } catch { return k; } };
const ngan = (v) => { const s = JSON.stringify(v); return s && s.length > 40 ? s.slice(0, 37) + "…" : s; };
// nhãn ngắn của mục: tên tiếng Việt ở qt-qua.js, không có thì phần đầu lời giải thích (trước: Boss thế giới / Vượt Ải hiện "anh 31/10 tối" / "anh 28/10")
const nhan = (m) => { if (DINH[m.id] && DINH[m.id].ten) return DINH[m.id].ten; const g = String(m.ghi || ""); const c = g.split(/[(:—.\n]/)[0].trim(); return c && c.length <= 46 ? c : c.slice(0, 44) + "…"; };
const laMa = (s) => typeof s === "string" && /^[a-z]+:[\w:.-]+$/i.test(s); // mã món "ms:71", "qk:238", "potion:15"
const coMa = (r) => (Array.isArray(r) ? r.findIndex((c) => laMa(c) || (Array.isArray(c) && c.some(laMa))) : -1); // ô chứa mã món trong 1 dòng bảng
const oBang = (r) => Array.isArray(r) && r.every((c) => prim(c) || (Array.isArray(c) && c.every((z) => typeof z === "string")));
const so2 = (x) => String(+(+x).toFixed(2)).replace(".", ",");
// số dễ đọc cạnh ô số: 500000 -> "50 vạn", 20000000 -> "20 triệu"
const docSo = (n) => { const a = Math.abs(+n); if (!Number.isFinite(a) || a < 10000) return ""; return a >= 1e9 ? `${so2(n / 1e9)} tỷ` : a >= 1e6 ? `${so2(n / 1e6)} triệu` : `${so2(n / 1e4)} vạn`; };
// đường dẫn trong mục để tra nhãn: bỏ số thứ tự dòng (số), khóa là số -> "*" (mocNgay."30" -> "mocNgay.*")
const rel = (p) => p.slice(1).filter((k) => typeof k !== "number").map((k) => (/^\d+$/.test(String(k)) ? "*" : k)).join(".");
// tra M theo đường dẫn r: đúng khóa trước, rồi khóa mẫu có "*" (1 đoạn bất kỳ — "mucTieu.loai.*.can" khớp "mucTieu.loai.vuotAi.can")
const timMau = (k) => new RegExp("^" + k.split(".").map((z) => (z === "*" ? "[^.]+" : z.replace(/[$()*+?.[\\\]^{|}]/g, "\\$&"))).join("\\.") + "$");
const tim = (M, r) => {
  if (!M) return undefined;
  if (Object.prototype.hasOwnProperty.call(M, r)) return M[r];
  for (const k of Object.keys(M)) if (k.includes("*") && timMau(k).test(r)) return M[k];
  return undefined;
};
const ptSo = (x) => `= ${so2((+x || 0) * 100)} %`; // số dạng phần (0,05) -> "= 5 %"
const TEN_TRANG = { "@thuong": "Thường dùng", "@qua": "Quà & thưởng", "@kyNang": "Kỹ năng phái", "@lichSu": "Lịch sử sửa" };

// số hay chỉnh: [nhóm, [[đường dẫn, tên, gợi ý]]]
const THUONG = [
  ["Kinh nghiệm & rơi đồ", [[["kinhNghiem"], "Hệ số kinh nghiệm toàn máy chủ", "× kinh nghiệm đánh quái"], [["roiDo", "quaiThuong"], "Tỉ lệ rơi đồ — quái thường", "0,01 = 1 %"], [["roiDo", "trum"], "Tỉ lệ rơi đồ — trùm", "0,2 = 20 %"], [["mayManToiDa"], "May mắn tối đa", ""]]], // gietToiDa (chống báo giết quái giả — tên khóa dau / moiGiay khó hiểu): bỏ khỏi trang (anh 11/11)
  ["Tiền tệ & chợ", [[["tienTrang", "luongMotXu"], "Tiền trang: ngân lượng đổi 1 Xu", "500000 = 50 vạn"], [["tienTrang", "luongBanXu"], "Tiền trang: 1 Xu đổi ra ngân lượng", "250000 = 25 vạn — phải nhỏ hơn giá mua 1 Xu"], [["tienTrang", "banXuNgay"], "Tiền trang: Xu đổi ra tối đa / tài khoản / ngày", "10"], [["choTroi", "thue"], "Chợ trời: thuế % (tổng)", ""], [["choTroi", "thueMua"], "Chợ trời: thuế người mua %", "cộng vào giá người mua trả (anh 18/11)"], [["choTroi", "thueBan"], "Chợ trời: thuế người bán %", "trừ vào tiền người bán nhận (anh 18/11)"], [["choTroi", "cap"], "Chợ trời: cấp mở sạp", ""]]],
  ["Đổi môn phái", [[["doiPhai", "cap"], "Cấp tối thiểu", ""], [["doiPhai", "ngay"], "Số ngày giữa 2 lần đổi", "7 = mỗi tuần"]]],
  ["Ủy thác", [[["uyThac", "gioNgay"], "Giờ ủy thác mỗi ngày", ""], [["uyThac", "tiLe"], "Tỉ lệ kinh nghiệm so với đánh tay", "0,7 = 70 %"], [["uyThac", "mucDinh"], "Tốc độ mặc định (quái / giờ)", "dùng khi bãi chưa đo được tốc độ"], [["uyThac", "vangGiay"], "Vắng mặt quá (giây) thì bắt đầu ủy thác", "90 = 1,5 phút"]]], // soát chéo 17/11: nhãn cũ "Mức định" / "Ngân lượng mỗi giây" sai nghĩa (do.js UT, uyThacVe)
  ["Tài khoản", [[["taiKhoan", "toiDaMoiNguoi"], "Số tài khoản tối đa mỗi người", "0 = không giới hạn"]]],
  // anh 17/11 tối ("điều chỉnh số người tham gia tối thiểu của các hoạt động, vì s1 đang yêu cầu cho đi viêm đế và VA solo"): mỗi máy chủ chỉnh riêng; lưu là ăn ngay cho lượt báo danh
  // mới (may-chu/vuot-ai.js toiThieu(), viem-de.js DOI()). Độ mạnh quái theo mốc đội 3 người, không theo số tối thiểu
  ["Tổ đội Vượt Ải / Viêm Đế (lưu là có hiệu lực ngay)", [
    [["vuotAi", "toiThieu"], "Vượt Ải — số người tối thiểu", "1 = cho đi một mình"],
    [["viemDe", "doi", "toiThieu"], "Viêm Đế — số người tối thiểu", "1 = cho đi một mình (tối đa vẫn theo Viêm Đế › toiDa)"],
    [["vuotAi", "heSo", "goc"], "Vượt Ải — quái mạnh × ở đội 3 người", "máu + sát thương quái, boss"],
    [["vuotAi", "heSo", "them"], "Vượt Ải — mỗi người thêm / bớt", "0,5: 1 người ×1 · 2 người ×1,5 · 3 người ×2 · 4 người ×2,5 (thấp nhất ×0,5)"],
    [["viemDe", "doi", "goc"], "Viêm Đế — quái mạnh × ở đội 3 người", "máu + sát thương đệ tử, boss"],
    [["viemDe", "doi", "them"], "Viêm Đế — mỗi người thêm / bớt", "0,5: 1 người ×1 · 2 người ×1,5 · 3 người ×2 (thấp nhất ×0,5)"],
  ]],
];
const QUA = NHOM_QUA.flatMap(([, ids]) => ids); // mọi nguồn quà (qt-qua.js — trước chỉ 10, thiếu Minh Chủ, Phú Quý, Săn Nhím, Viêm Đế, Phong Hỏa, Tống Kim, Đua ngựa, Phong Lăng Độ, Báo Đáp Ân Sư)

export class CauHinhQt {
  // truoc = trang mở ra trang đang xem (nút ← Quay lại), cuon = vị trí cuộn từng trang, day = mục đang xem Mọi thông số, ghiMo = mục đang mở Ghi chú kỹ thuật
  constructor(qt) { this.qt = qt; this.d = null; this.chon = "@thuong"; this.sua = {}; this.loc = ""; this.mo = new Set(); this.json = new Set(); this.timKq = {}; this.henTim = 0; this.truoc = null; this.cuon = {}; this.day = new Set(); this.ghiMo = new Set(); }
  get api() { return this.qt.api; }
  muc(id) { return this.d && this.d.muc.find((m) => m.id === id); }
  gia(id) { return id in this.sua ? this.sua[id] : (this.muc(id) || {}).gia; }
  lay(p) { let v = this.gia(p[0]); for (const k of p.slice(1)) v = v == null ? undefined : v[k]; return v; }
  layGoc(p) { let v = (this.muc(p[0]) || {}).goc; for (const k of p.slice(1)) v = v == null ? undefined : v[k]; return v; }
  dat(p, x) {
    const id = p[0]; if (!(id in this.sua)) this.sua[id] = sao((this.muc(id) || {}).gia);
    if (p.length === 1) { this.sua[id] = x; return; }
    let o = this.sua[id]; for (const k of p.slice(1, -1)) { if (o[k] == null) o[k] = typeof k === "number" ? [] : {}; o = o[k]; }
    const k = p[p.length - 1];
    if (x === undefined) { if (Array.isArray(o)) o.splice(k, 1); else delete o[k]; } else o[k] = x;
  }

  render(body) {
    body.innerHTML = `<div class="qch"><div class="qch-tren"></div><div class="qch-giua"><div class="qch-trai"></div><div class="qch-phai"></div></div></div>`;
    const el = (this.el = body.querySelector(".qch"));
    el.addEventListener("click", (e) => { const t = e.target.closest("[data-ch-act],[data-ch-muc]"); if (!t) return; if (t.dataset.chMuc) { this.di(t.dataset.chMuc, !!t.closest(".qch-phai")); return; } this.act(t.dataset.chAct, t); });
    el.addEventListener("input", (e) => this.nhap(e.target, false));
    el.addEventListener("change", (e) => this.nhap(e.target, true));
    if (!this.d) this.tai(); else this.ve();
  }
  async tai() { const j = await this.qt.goi("cau-hinh", { viec: "xem" }); if (j) { this.d = j; this.ve(); } }
  ve() { if (!this.el || !this.el.isConnected || !this.d) return; this.veTren(); this.veTrai(); this.vePhai(); }
  // sang trang id; tuNoiDung = bấm nút trong trang (nhớ trang cũ + chỗ cuộn để ← Quay lại), bấm cột trái thì không có Quay lại
  di(id, tuNoiDung) {
    const ph = this.el.querySelector(".qch-phai"); if (ph) this.cuon[this.chon] = ph.scrollTop;
    if (!tuNoiDung) this.truoc = null; else if (id !== this.chon) this.truoc = this.chon; // cột trái: luôn trang của cột (Đua ngựa đang mở trang gọn -> bấm cột trái ra trang đủ)
    this.chon = id; this.ve();
    const ph2 = this.el.querySelector(".qch-phai"); if (ph2) ph2.scrollTop = 0;
  }
  quayLai() {
    const c = this.truoc || (DINH[this.chon] && QUA.includes(this.chon) ? "@qua" : "@thuong");
    this.truoc = null; this.chon = c; this.ve();
    const ph = this.el.querySelector(".qch-phai"); if (ph) ph.scrollTop = this.cuon[c] || 0;
  }
  dinh(id) { return DINH[id] || null; }
  // nhãn tiếng Việt của ô theo đường dẫn đầy đủ p = [mục, khóa…] (qt-qua.js): cot["a.b"] -> cot[khóa] -> CHUNG[khóa]; khóa là số: "Mốc N"; không có: tên khóa gốc
  nhanK(p) {
    const D = this.dinh(p[0]) || {}, C = D.cot || {}, k = p[p.length - 1], r = rel(p), so = /^\d+$/.test(String(k));
    const lay = (x) => (x == null ? null : typeof x === "function" ? x(String(k)) : x);
    let v = lay(tim(C, r));
    if (v == null && so) v = `Mốc ${k}`;
    if (v == null && laMa(String(k))) v = tenMon(String(k)); // khóa là mã món (roiDacBiet.thuLinh["qk:353"]) -> tên món
    if (v == null && k === "biKip") v = TU.biKip;
    if (v == null) v = lay(C[k]);
    if (v == null) v = lay(CHUNG[k]);
    if (v == null) return { t: String(k), g: "" };
    return Array.isArray(v) ? { t: v[0], g: v[1] || "" } : { t: String(v), g: "" };
  }

  veTren() {
    const d = this.d, doi = d.muc.filter((m) => m.doi && !m.song).map((m) => m.id), doiSong = d.muc.filter((m) => m.doi && m.song).map((m) => m.id), dangSua = Object.keys(this.sua);
    this.el.querySelector(".qch-tren").innerHTML = `<div class="r"><button data-ch-act="khoiDong">Khởi động lại máy chủ</button><input data-ch-in="kdGiay" type="number" min="10" max="300" value="60" style="width:52px"><span>giây</span>
        ${d.hen ? `<button data-ch-act="huyHen">Hủy hẹn</button>` : ""}<button data-ch-act="taiLai">Bắt cả máy chủ F5</button><input data-ch-in="tlGiay" type="number" min="10" max="120" value="30" style="width:52px"><span>giây</span>
        <button data-ch-act="moi">Tải lại số</button></div>
      <div class="dv-note">${d.hen ? `<b class="qt-do">Đang hẹn khởi động lại lúc ${gio(d.hen.luc)} (${esc(d.hen.ai)})</b> · ` : ""}${doi.length ? `<b class="qt-vang">Đã sửa từ lúc máy chủ bật: ${esc(doi.join(", "))}</b> — phần đọc lúc dùng đã theo số mới; bấm Khởi động lại máy chủ để mọi phần chắc chắn theo (+ Bắt cả máy chủ F5 nếu chữ / số hiện trong game đổi) · ` : ""}${doiSong.length ? `<b class="qt-xanh">Đã sửa, đã có hiệu lực ngay: ${esc(doiSong.join(", "))}</b> · ` : ""}${doi.length || doiSong.length ? "" : "Chưa sửa gì từ lúc máy chủ bật · "}${dangSua.length ? `<b class="qt-do">Chưa lưu: ${esc(dangSua.join(", "))}</b> · ` : ""}Đã bắt F5 ${d.tl.v} lần · bản trình duyệt ${esc(d.ban || "?")}. Số sửa ở đây lưu trên máy chủ (du-lieu/cau-hinh-qt.json) — gửi mã lên VPS không ghi đè.</div>`;
  }
  veTrai() {
    // anh 11/11 ("bỏ mấy cái này, vì anh đọc không hiểu"): bỏ ô tìm + danh sách mục gốc (tên khóa tiếng Anh của cau-hinh.json) — chỉ còn 3 trang
    // dễ đọc; mục Quà & thưởng vẫn mở từ nút ở trang Thường dùng
    // trang 1 nguồn quà (mở từ trang Quà & thưởng / Thường dùng): sáng mục 🎁 Quà & thưởng ở cột trái
    const dang = QUA.includes(this.chon) && this.truoc ? (this.truoc === "@thuong" ? "@thuong" : "@qua") : this.chon;
    const o = (id, ten) => `<div class="qch-m${dang === id ? " on" : ""}" data-ch-muc="${esc(id)}">${ten}</div>`;
    // Lôi đài (anh 15/11 — mục loiDai của cau-hinh.json: bật, số sân, giờ, thể thức, người xem, báo kênh, cấp, phí): trang sửa chung của mục (veMuc)
    this.el.querySelector(".qch-trai").innerHTML = o("@thuong", "★ Thường dùng") + o("@qua", "🎁 Quà &amp; thưởng") + o("@kyNang", "⚔ Kỹ năng phái") + (this.muc("loiDai") ? o("loiDai", "⚔ Lôi đài") : "") + (this.muc("tiThi") ? o("tiThi", "⚔ Tỉ thí") : "") + (this.muc("duaNgua") ? o("duaNgua", "🏇 Đua ngựa") : "") + o("@lichSu", "☰ Lịch sử sửa");
  }
  vePhai() {
    const box = this.el.querySelector(".qch-phai"), c = this.chon;
    // ← Quay lại: trang mở từ nút trong trang khác (nhớ ở di)
    const lui = this.truoc ? `<div class="r qch-lui"><button data-ch-act="quayLai">← Quay lại ${esc(TEN_TRANG[this.truoc] || nhan(this.muc(this.truoc) || { id: this.truoc }))}</button></div>` : "";
    let h;
    if (c === "@thuong") h = this.veThuong();
    else if (c === "@qua") h = this.veQuaDs();
    else if (c === "@kyNang") h = this.veKyNang();
    else if (c === "@lichSu") h = this.veLichSu();
    // Lôi đài / Đua ngựa bấm từ cột trái: trang đủ mọi thông số như cũ; Đua ngựa mở từ trang quà: trang gọn phần thưởng
    else { const m = this.muc(c), D = this.dinh(c); h = !m ? `<div class="dv-note">Không có mục này</div>` : D && D.f && !this.day.has(c) && this.truoc ? this.veQua(m, D) : this.veMuc(m); }
    box.innerHTML = lui + h;
  }
  nutLuu(ids) { const co = ids.filter((id) => this.sua[id] !== undefined); return `<div class="r qch-nut"><button data-ch-act="luu" data-ids="${esc(ids.join(","))}"${co.length ? "" : " disabled"}>Lưu${co.length ? ` (${co.length} mục)` : ""}</button>${co.length ? `<button data-ch-act="boSua" data-ids="${esc(co.join(","))}">Bỏ thay đổi</button>` : ""}</div>`; }

  // ---------- Thường dùng ----------
  veThuong() {
    const ids = new Set(), o = (p, ten, goi) => { const v = this.lay(p); if (v === undefined) return ""; ids.add(p[0]); return `<div class="qch-o"><span class="qch-k">${esc(ten)}${goi ? `<small>${esc(goi)}</small>` : ""}</span><div class="qch-v">${this.veGia(v, p, this.layGoc(p))}</div></div>`; };
    let html = `<div class="dv-note">Các số hay chỉnh gom 1 trang. Sửa xong bấm Lưu (cuối trang), rồi Khởi động lại máy chủ (+ Bắt cả máy chủ F5 nếu chữ / số hiện trong game đổi).</div>`;
    for (const [nhom, L] of THUONG) { const r = L.map(([p, t, g]) => o(p, t, g)).join(""); if (r) html += `<h4 class="qch-h">${esc(nhom)}</h4>${r}`; }
    const cap = this.d.muc.filter((m) => laDT(m.gia) && typeof m.gia.cap === "number" && !["doiPhai", "choTroi"].includes(m.id));
    if (cap.length) html += `<h4 class="qch-h">Cấp tham gia hoạt động</h4>` + cap.map((m) => o([m.id, "cap"], nhan(m))).join(""); // bỏ tên khóa tiếng Anh trong ngoặc (anh 11/11 "đọc không hiểu")
    html += `<h4 class="qch-h">Quà &amp; thưởng</h4><div class="dv-note">Bấm 1 nguồn quà để xem / sửa (có nút ← Quay lại). Cùng danh sách, kèm giải thích: mục 🎁 Quà &amp; thưởng ở cột trái.</div><div class="r">${QUA.filter((id) => this.muc(id)).map((id) => `<button data-ch-muc="${id}">${esc(nhan(this.muc(id)))}</button>`).join("")}</div>`;
    return html + this.nutLuu([...ids]);
  }
  // ---------- Quà & thưởng: mọi nguồn quà theo nhóm, mỗi nguồn 1 dòng giải thích ----------
  veQuaDs() {
    let h = `<div class="dv-note">Mọi nguồn quà của máy chủ. Bấm tên để xem / sửa phần thưởng — mỗi trang ghi rõ lưu xong có hiệu lực ngay hay phải khởi động lại máy chủ. Mã quà tặng riêng: thẻ Quà &amp; mã.</div>`;
    for (const [nhom, ids] of NHOM_QUA) {
      const ds = ids.filter((id) => this.muc(id)); if (!ds.length) continue;
      h += `<h4 class="qch-h">${esc(nhom)}</h4>` + ds.map((id) => { const m = this.muc(id), D = this.dinh(id); return `<div class="qch-qua"><button data-ch-muc="${esc(id)}">${esc(D.ten)}</button><span>${esc(D.gt || "")}${m.sua ? ' <i class="qt-vang">(đang khác mặc định)</i>' : ""}${this.sua[id] !== undefined ? ' <b class="qt-do">(chưa lưu)</b>' : ""}</span></div>`; }).join("");
    }
    return h;
  }
  // dòng báo lưu là ăn ngay / cần khởi động lại / cần F5 (soát 14/11: máy chủ báo — may-chu/cau-hinh-qt.js SONG / CAN_KD / CAN_F5)
  hieuLuc(m) {
    return m.song ? `<div class="qch-hl qt-xanh">✓ Lưu là có hiệu lực ngay — không cần khởi động lại máy chủ</div>`
      : m.kd ? `<div class="qch-hl qt-do">⚠ Mục này lưu xong phải bấm Khởi động lại máy chủ mới có hiệu lực</div>`
      : m.f5 ? `<div class="qch-hl qt-vang">⚠ Lưu xong bấm Bắt cả máy chủ F5 — số này chạy trên máy người chơi</div>` : "";
  }
  trangThai(m) { return `${m.sua ? ' <i class="qt-vang">(đang khác mặc định)</i>' : ""}${m.doi ? (m.song ? ' <b class="qt-xanh">(đã sửa — đã có hiệu lực)</b>' : ' <i class="qt-do">(đã sửa — cần khởi động lại)</i>') : ""}`; }
  // ---------- 1 nguồn quà, trang gọn: chỉ các ô phần thưởng (DINH[id].f), nhãn tiếng Việt ----------
  veQua(m, D) {
    const id = m.id, mo = this.ghiMo.has(id);
    const o = ([p, ten, goi]) => {
      const fp = [id, ...p], v = this.lay(fp); if (v === undefined) return "";
      const r = rel(fp), so = tim(D.so, r), doc = laDT(v) || (Array.isArray(v) && (v.some((x) => !prim(x)) || (so && v.length > 4) || (!v.length && tim(D.bang, r))));
      return `<div class="qch-o${doc ? " doc" : ""}"><span class="qch-k">${esc(ten)}${goi ? `<small>${esc(goi)}</small>` : ""}</span><div class="qch-v">${this.veGia(v, fp, this.layGoc(fp))}</div></div>`;
    };
    return `<div class="qch-tieu"><b>${esc(D.ten)}</b>${this.trangThai(m)}</div>` + this.hieuLuc(m) + (D.gt ? `<div class="dv-note">${esc(D.gt)}</div>` : "") +
      D.f.map(o).join("") +
      `<div class="r qch-them">${m.sua ? `<button data-ch-act="macDinh" data-id="${esc(id)}">Về mặc định</button>` : ""}<button data-ch-act="day" data-id="${esc(id)}">Mọi thông số (nâng cao)</button>${m.ghi ? `<button data-ch-act="ghi" data-id="${esc(id)}">Ghi chú kỹ thuật ${mo ? "▴" : "▾"}</button>` : ""}</div>` +
      (mo && m.ghi ? `<div class="dv-note qch-ghi">${esc(m.ghi)}</div>` : "") + this.nutLuu([id]);
  }
  // ---------- Kỹ năng phái ----------
  veKyNang() {
    if (!this.muc("kyNangPhai")) return `<div class="dv-note">Máy chủ chưa có mục kyNangPhai (cau-hinh.json) — lên bản mã mới.</div>`;
    const K = this.gia("kyNangPhai") || {}, F = this.api.factions() || [];
    const o = (p, v) => `<input type="number" min="1" max="1000" step="1" data-ch-p='${P(p)}' data-ch-trong="1" value="${v ?? ""}" placeholder="100" style="width:64px"><span>%</span>`;
    return `<div class="dv-note">% sát thương võ công (100 = như client, để trống = 100). % phái nhân với % chiêu. Áp cho mọi chiêu kể cả độc, phân thân, bot Tống Kim. Lưu → Khởi động lại máy chủ → Bắt cả máy chủ F5 (trình duyệt nhận số mới khi tải lại).</div>` +
      F.map((f) => { const mo = this.mo.has("kn:" + f.key); return `<div class="qch-phai-o"><div class="r"><b class="qt-vang" style="min-width:110px">${esc(f.n)}</b>${o(["kyNangPhai", "phai", f.key], (K.phai || {})[f.key])}<button data-ch-act="moKn" data-k="${esc(f.key)}">${mo ? "Ẩn chiêu" : "Từng chiêu ▾"}</button></div>` +
        (mo ? `<div class="qch-chieu">${(f.skills || []).map((id) => { const s = this.api.skill ? this.api.skill(id) : null; return `<div class="r"><span class="qch-k">${esc((s && s.n) || "Chiêu " + id)}<small>mã ${id}${s && s.req ? ` · cấp ${s.req}` : ""}</small></span>${o(["kyNangPhai", "chieu", String(id)], (K.chieu || {})[id])}</div>`; }).join("")}</div>` : "") + `</div>`; }).join("") + this.nutLuu(["kyNangPhai"]);
  }
  veLichSu() {
    const L = this.d.ls || [];
    return L.length ? L.map((x) => `<div class="qch-ls"><b class="qt-vang">${gio(x.luc)}</b> · ${esc(x.ai)} · <b>${esc(x.id)}</b>${x.mac ? " (về mặc định)" : ""}<div>${(x.ds || []).map((s) => esc(s)).join("<br>")}</div></div>`).join("") : `<div class="dv-note">Chưa có lần sửa nào.</div>`;
  }
  // ---------- 1 mục ----------
  veMuc(m) {
    const v = this.gia(m.id), dangJson = this.json.has(m.id), D = this.dinh(m.id), gon = D && D.f && this.truoc;
    // soát 14/11: máy chủ báo mục nào lưu là ăn ngay (song) / phải khởi động lại (kd) / phải bắt F5 (f5) — hieuLuc. Tiêu đề: tên tiếng Việt (17/11 lần 2 — trước: tên khóa "ruongXanh")
    return `<div class="qch-tieu"><b>${esc(nhan(m))}</b>${gon ? " — mọi thông số" : ""}${this.trangThai(m)}</div>` + this.hieuLuc(m) +
      (m.ghi ? `<div class="dv-note qch-ghi">${esc(m.ghi)}</div>` : "") +
      `<div class="r">${gon ? `<button data-ch-act="day" data-id="${esc(m.id)}">← Về trang gọn</button>` : ""}<button data-ch-act="json" data-id="${esc(m.id)}">${dangJson ? "Sửa từng ô" : "Sửa dạng chữ (JSON)"}</button>${m.sua ? `<button data-ch-act="macDinh" data-id="${esc(m.id)}">Về mặc định</button>` : ""}</div>` +
      (dangJson ? `<textarea class="qch-json" data-ch-json-muc="${esc(m.id)}" spellcheck="false">${esc(JSON.stringify(v, null, 1))}</textarea>` : `<div class="qch-form">${this.veGia(v, [m.id], m.goc)}</div>`) + this.nutLuu([m.id]);
  }
  veGia(v, p, goc) {
    const mac = goc !== undefined && JSON.stringify(goc) !== JSON.stringify(v) ? `<small class="qch-mac" title="${esc(JSON.stringify(goc))}">mặc định: ${esc(ngan(goc))}</small>` : "";
    if (typeof v === "number") { const pt = tim((this.dinh(p[0]) || {}).pt, rel(p)); return `<input type="number" step="any" data-ch-p='${P(p)}' value="${v}" class="qch-so"><small class="qch-doc${pt ? " pt" : ""}">${pt ? ptSo(v) : docSo(v)}</small>${mac}`; }
    if (typeof v === "boolean") return `<label class="qch-bat"><input type="checkbox" data-ch-p='${P(p)}'${v ? " checked" : ""}> bật</label>${mac}`;
    if (typeof v === "string") return (v.length > 60 ? `<textarea data-ch-p='${P(p)}' rows="2">${esc(v)}</textarea>` : `<input data-ch-p='${P(p)}' value="${esc(v)}">`) + (laMa(v) ? `<small class="qch-doc">${esc(tenMon(v))}</small>` : "") + mac; // mã món: tên món bên cạnh
    if (v === null || v === undefined) return `<i class="dv-note">trống</i>`;
    if (Array.isArray(v)) {
      const mau = Array.isArray(goc) ? goc : v, D = this.dinh(p[0]) || {}, r = rel(p), so = tim(D.so, r), bg = tim(D.bang, r);
      // "mặc định" của bảng / danh sách số: chữ dễ đọc (tên món, Kinh nghiệm…) thay JSON, 1 dòng riêng bên dưới
      const docO = (c) => (laMa(c) ? tenMon(c) : Array.isArray(c) ? `1 trong ${c.map((z) => (laMa(z) ? tenMon(z) : TU[z] || z)).join(" / ")}` : typeof c === "string" && TU[c] ? TU[c] : typeof c === "number" ? so2(c) : String(c));
      const macDong = mac && Array.isArray(goc) ? `<small class="qch-mac dong">mặc định: ${esc(goc.length ? goc.map((x) => (Array.isArray(x) ? x.map(docO).join(" ") : docO(x))).join(" · ") : "trống")}</small>` : mac;
      // danh sách số có nhãn từng ô (Ngày 1…42, 0…6 dòng, Thắng / Thua…) — qt-qua.js so
      if (so && (v.length ? v : mau).every((x) => typeof x === "number")) return this.veSoNhan(v, p, so) + macDong;
      // bảng (mảng các dòng [loại / mã món, số, tỉ lệ…]): ô có tiêu đề cột — qt-qua.js bang; dòng nào cũng [mã món, số] mà không có tiêu đề thì giữ kiểu danh sách món
      const ds = v.length ? v : mau;
      if (ds.length && ds.every(oBang) && (bg || !ds.every(maMon))) return this.veBang(v, p, bg) + macDong;
      // danh sách món: "mặc định" ghi tên món dễ đọc, 1 dòng riêng dưới danh sách (anh 14/11: chữ JSON mặc định đè lên các dòng món)
      if (v.length ? v.every(maMon) : mau.length && mau.every(maMon)) return this.veMon(v, p) + (mac && Array.isArray(goc) ? `<small class="qch-mac dong">mặc định: ${esc(goc.length ? goc.map((x) => `${x[1] ?? 1} ${tenMon(x[0])}`).join(" · ") : "trống")}</small>` : mac);
      // danh sách chữ có câu chứa dấu phẩy / câu dài (tiThi.cau — câu khịa): ô nhiều dòng, mỗi dòng 1 câu (phiên Tỉ thí 17/11 — trước cắt vụn câu theo dấu phẩy)
      if (v.every(prim) && (!mau.length || mau.every(prim)) && [...v, ...mau].some((x) => typeof x === "string" && (x.includes(",") || x.length > 40)))
        return `<textarea data-ch-p='${P(p)}' data-ch-ds="dong" rows="${Math.min(16, Math.max(3, v.length + 1))}" spellcheck="false">${esc(v.join("\n"))}</textarea><small>mỗi dòng 1 câu</small>${mac}`;
      if (v.every(prim) && (!mau.length || mau.every(prim))) return `<input data-ch-p='${P(p)}' data-ch-ds="${mau.length && typeof mau[0] === "number" ? "so" : "chu"}" value="${esc(v.join(", "))}" class="qch-dsach"><small>cách nhau dấu phẩy</small>${mac}`;
      if (v.every(laDT)) { // dòng i so với dòng i của mặc định (dòng mới thêm: không ghi mặc định); chữ đầu dòng: qt-qua.js dong ("Mốc", "Bậc")
        const dg = tim(D.dong, r) || "Dòng";
        return `<div class="qch-dongs">${v.map((o, i) => `<div class="qch-dong"><div class="r"><b>${esc(dg)} ${i + 1}</b><button data-ch-act="xoaDong" data-p='${P([...p, i])}'>Xóa ${esc(dg.toLowerCase())}</button></div>${this.veDT(o, [...p, i], Array.isArray(goc) && laDT(goc[i]) ? goc[i] : null)}</div>`).join("")}<button data-ch-act="themDong" data-p='${P(p)}'>+ Thêm ${esc(dg.toLowerCase())}</button></div>${mac}`;
      }
      return `<textarea data-ch-p='${P(p)}' data-ch-jsono="1" rows="2" spellcheck="false">${esc(JSON.stringify(v))}</textarea><small>dạng chữ JSON</small>${mac}`;
    }
    return this.veDT(v, p, laDT(goc) ? goc : {});
  }
  veDT(o, p, goc) {
    const ghi = Object.entries(o).filter(([k, x]) => k[0] === "_" && typeof x === "string").map(([, x]) => `<div class="dv-note qch-ghi">${esc(x)}</div>`).join("");
    // giá trị nhiều tầng (nhóm / dòng / danh sách món): tên trên 1 dòng riêng, ô sửa rộng hết bên dưới
    const phuc = (x) => laDT(x) || (Array.isArray(x) && !(x.length && x.every(prim)));
    // nhãn tiếng Việt (qt-qua.js — anh 17/11 lần 2); khóa chưa có nhãn giữ tên gốc
    return `<div class="qch-nhom">${ghi}${Object.keys(o).filter((k) => k[0] !== "_").map((k) => { const L = this.nhanK([...p, k]); return `<div class="qch-o${phuc(o[k]) ? " doc" : ""}"><span class="qch-k">${esc(L.t)}${L.g ? `<small>${esc(L.g)}</small>` : ""}</span><div class="qch-v">${this.veGia(o[k], [...p, k], goc ? goc[k] : undefined)}</div></div>`; }).join("")}</div>`;
  }
  // danh sách [mã món, số, (số thứ 3 — tỉ lệ…)]: tên món + ô số + xóa; ô tìm món theo tên để thêm
  veMon(v, p) {
    return `<div class="qch-mon">${v.map((x, i) => `<div class="r"><span class="qch-mon-ten">${esc(tenMon(x[0]))}</span><small>${esc(x[0])}</small><span>×</span><input type="number" step="any" data-ch-p='${P([...p, i, 1])}' value="${x[1] ?? 1}" style="width:64px">${x.length > 2 ? `<input type="number" step="any" data-ch-p='${P([...p, i, 2])}' value="${x[2]}" style="width:56px" title="số thứ 3 (tỉ lệ % …)">` : ""}<button data-ch-act="xoaMon" data-p='${P([...p, i])}'>✕</button></div>`).join("")}
      ${this.veTim(p)}</div>`;
  }
  // ô tìm món theo tên (gọi máy chủ như Gửi quà) + kết quả: bấm = thêm (themMon)
  veTim(p) {
    const kq = this.timKq[JSON.stringify(p)];
    return `<div class="r"><input data-ch-tim='${P(p)}' placeholder="Tìm món theo tên để thêm…" value="${esc((kq && kq.q) || "")}" style="flex:1"></div>
      ${kq && kq.ds ? `<div class="qch-tim">${kq.ds.length ? kq.ds.slice(0, 24).map((m) => `<button data-ch-act="themMon" data-p='${P(p)}' data-k="${esc(m.k)}">${esc(m.n || m.k)}</button>`).join("") : '<i class="dv-note">Không thấy món nào</i>'}</div>` : ""}`;
  }
  // danh sách số có nhãn từng ô (qt-qua.js so: mảng chữ | hàm(i) | { nhan, tong })
  veSoNhan(v, p, so) {
    const nh = typeof so === "function" ? so : Array.isArray(so) ? (i) => so[i] ?? `Ô ${i + 1}` : typeof so.nhan === "function" ? so.nhan : (i) => `Ô ${i + 1}`;
    const tong = so && so.tong ? v.reduce((s, x) => s + (+x || 0), 0) : null;
    return `<div class="qch-sonhan">${v.map((x, i) => `<label><span>${esc(nh(i))}</span><input type="number" step="any" data-ch-p='${P([...p, i])}' value="${x}"><small class="qch-doc">${docSo(x)}</small></label>`).join("")}</div>${tong !== null ? `<small class="qch-tong${Math.abs(tong - 100) > 0.001 ? " qt-vang" : ""}">Tổng: ${so2(tong)}</small>` : ""}`;
  }
  // bảng: mỗi dòng 1 mảng [loại / mã món / [mã…], số, tỉ lệ…] (qt-qua.js bang: tiêu đề cột; { tong } dòng Tổng; { ts } trọng số -> ≈ % từng dòng).
  // Ô số sửa được; ô mã món hiện tên món; ô loại hiện chữ (TU); [mã…] = bốc 1 trong. Thêm: nút theo loại (chép dòng cuối cùng loại), tìm món (chép dòng có món, thay món)
  veBang(v, p, H) {
    const ds = v.length ? v : [], nc = Math.max(1, ...ds.map((r) => r.length), H ? H.length : 0);
    const hd = (j) => { const h = H && H[j]; return typeof h === "string" ? { t: h } : h || { t: j === 0 ? "Loại / vật phẩm" : `Cột ${j + 1}` }; };
    const tong = []; for (let j = 0; j < nc; j++) if (hd(j).ts || hd(j).tong) tong[j] = ds.reduce((s, r) => s + (typeof r[j] === "number" ? r[j] : 0), 0);
    const o = (c, i, j) => {
      if (typeof c === "number") { const h = hd(j); return `<input type="number" step="any" data-ch-p='${P([...p, i, j])}' value="${c}">${h.ts ? `<small class="qch-doc ts">${tong[j] ? `≈ ${so2((c / tong[j]) * 100)} %` : ""}</small>` : h.pt ? `<small class="qch-doc pt">${ptSo(c)}</small>` : `<small class="qch-doc">${docSo(c)}</small>`}`; }
      if (laMa(c)) return `<span class="qch-mon-ten">${esc(tenMon(c))}</span>`;
      if (Array.isArray(c)) return `<span class="qch-mon-ten qch-1trong">1 trong: ${esc(c.map((z) => (laMa(z) ? tenMon(z) : TU[z] || z)).join(" / "))}</span>`;
      if (typeof c === "string" && TU[c]) return `<span class="qch-loai">${esc(TU[c])}</span>`;
      if (typeof c === "boolean") return `<input type="checkbox" data-ch-p='${P([...p, i, j])}'${c ? " checked" : ""}>`;
      return `<input data-ch-p='${P([...p, i, j])}' value="${esc(c)}">`;
    };
    const loai = [...new Set(ds.map((r) => r[0]).filter((c) => typeof c === "string" && TU[c] && c !== "mon"))]; // loại có thể thêm dòng (Kinh nghiệm, Xu…)
    const coMon = ds.some((r) => coMa(r) >= 0), coTong = tong.some((x) => x !== undefined);
    return `<div class="qch-bang-w"><table class="qch-bang"><tr>${Array.from({ length: nc }, (_, j) => `<th>${esc(hd(j).t)}</th>`).join("")}<th></th></tr>` +
      ds.map((r, i) => `<tr>${Array.from({ length: nc }, (_, j) => `<td>${j < r.length ? o(r[j], i, j) : ""}</td>`).join("")}<td><button data-ch-act="xoaDong" data-p='${P([...p, i])}' class="qch-x">✕</button></td></tr>`).join("") +
      (coTong ? `<tr class="qch-bang-tong">${Array.from({ length: nc }, (_, j) => `<td data-j="${j}">${tong[j] !== undefined ? `Tổng: ${so2(tong[j])}` : ""}</td>`).join("")}<td></td></tr>` : "") + `</table></div>` +
      `<div class="r qch-bang-them">${loai.map((w) => `<button data-ch-act="themLoai" data-p='${P(p)}' data-w="${esc(w)}">+ ${esc(TU[w])}</button>`).join("")}${!coMon && !loai.length ? `<button data-ch-act="themDong" data-p='${P(p)}'>+ Thêm dòng</button>` : ""}</div>` +
      (coMon ? `<div class="qch-mon">${this.veTim(p)}</div>` : "");
  }

  // ---------- nhập ----------
  nhap(t, xong) {
    if (t.dataset.chIn === "loc") { this.loc = t.value; this.focLoc = true; this.veTrai(); return; }
    if (t.dataset.chTim) { // tìm món (gọi máy chủ — như Gửi quà)
      const p = t.dataset.chTim, q = t.value.trim(); clearTimeout(this.henTim);
      this.henTim = setTimeout(async () => { if (q.length < 2) { delete this.timKq[p]; this.vePhai(); return; } const j = await this.qt.goi("mon", { q }, true); this.timKq[p] = { q, ds: (j && j.ds) || [] }; const f = document.activeElement === t; this.vePhai(); if (f) { const n = this.el.querySelector(`[data-ch-tim='${CSS.escape(p)}']`); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } } }, 300);
      return;
    }
    if (t.dataset.chJsonMuc) { // cả mục dạng chữ JSON
      if (!xong) return;
      try { this.dat([t.dataset.chJsonMuc], JSON.parse(t.value)); t.classList.remove("loi"); this.veTren(); this.veTrai(); const n = this.el.querySelector(".qch-nut"); if (n) n.outerHTML = this.nutLuuCho(); } catch { t.classList.add("loi"); this.qt.bao("Chữ JSON chưa đúng — kiểm dấu phẩy, ngoặc", true); } // soát chéo 17/11: nút Lưu bật lại sau khi sửa chữ JSON
      return;
    }
    if (!t.dataset.chP) return;
    const p = JSON.parse(t.dataset.chP); let x;
    if (t.type === "checkbox") x = t.checked;
    else if (t.dataset.chJsono) { if (!xong) return; try { x = JSON.parse(t.value); t.classList.remove("loi"); } catch { t.classList.add("loi"); return; } }
    else if (t.dataset.chDs) { const L = t.value.split(t.dataset.chDs === "dong" ? "\n" : ",").map((s) => s.trim()).filter((s) => s !== ""); x = t.dataset.chDs === "so" ? L.map(Number) : L; if (x.some((n) => typeof n === "number" && !Number.isFinite(n))) { t.classList.add("loi"); return; } t.classList.remove("loi"); }
    else if (t.type === "number") { if (t.value === "") { if (t.dataset.chTrong) x = undefined; else return; } else { x = +t.value; if (!Number.isFinite(x)) return; } }
    else x = t.value;
    this.dat(p, x);
    // chú thích số dễ đọc ngay cạnh ô (50 vạn / 20 triệu) theo số đang gõ; ô trọng số (≈ %) vẽ lại khi xong
    const doc = t.type === "number" && t.nextElementSibling; if (doc && doc.classList.contains("qch-doc") && !doc.classList.contains("ts")) doc.textContent = doc.classList.contains("pt") ? ptSo(x) : docSo(x);
    if (t.closest(".qch-bang, .qch-sonhan")) this.capNhatTong(t); // soát chéo 17/11: cập nhật tại chỗ — trước vẽ lại cả trang trong 'change' làm mất ô vừa bấm / Tab
    if (xong) { this.veTren(); this.veTrai(); const n = this.el.querySelector(".qch-nut"); if (n) n.outerHTML = this.nutLuuCho(); }
  }
  // sửa 1 ô số của bảng / danh sách số: cập nhật dòng Tổng + "≈ %" của cột đó ngay tại chỗ (giữ ô đang gõ / ô vừa bấm)
  capNhatTong(t) {
    const p = JSON.parse(t.dataset.chP), bang = t.closest(".qch-bang"), sn = t.closest(".qch-sonhan");
    if (bang && p.length >= 3) {
      const j0 = p[p.length - 1], L = this.lay(p.slice(0, -2)) || [], tong = L.reduce((s, r) => s + (Array.isArray(r) && typeof r[j0] === "number" ? r[j0] : 0), 0);
      for (const i of bang.querySelectorAll("input[data-ch-p]")) { const q = JSON.parse(i.dataset.chP), d = i.nextElementSibling; if (q[q.length - 1] === j0 && d && d.classList.contains("ts")) d.textContent = tong ? `≈ ${so2(((+i.value || 0) / tong) * 100)} %` : ""; }
      const td = bang.querySelector(`.qch-bang-tong td[data-j="${j0}"]`); if (td && td.textContent) td.textContent = `Tổng: ${so2(tong)}`;
    }
    if (sn) { const tg = sn.nextElementSibling; if (tg && tg.classList.contains("qch-tong")) { const s = (this.lay(p.slice(0, -1)) || []).reduce((a, x) => a + (+x || 0), 0); tg.textContent = `Tổng: ${so2(s)}`; tg.classList.toggle("qt-vang", Math.abs(s - 100) > 0.001); } }
  }
  // vẽ lại trang phải, giữ chỗ cuộn
  vePhaiGiu() { const ph = this.el.querySelector(".qch-phai"), y = ph ? ph.scrollTop : 0; this.veTren(); this.veTrai(); this.vePhai(); const ph2 = this.el.querySelector(".qch-phai"); if (ph2) ph2.scrollTop = y; }
  nutLuuCho() { const c = this.chon, ids = c === "@kyNang" ? ["kyNangPhai"] : c === "@thuong" ? [...new Set([...this.el.querySelectorAll(".qch-phai [data-ch-p]")].map((i) => JSON.parse(i.dataset.chP)[0]))] : [c]; return this.nutLuu(ids); }

  // ---------- việc ----------
  async act(a, t) {
    const hoi = (html) => (this.api.hoi ? this.api.hoi(html) : Promise.resolve(true));
    const so = (k, md) => { const i = this.el.querySelector(`[data-ch-in="${k}"]`); return i ? +i.value || md : md; };
    if (a === "moi") { this.sua = {}; return this.tai(); }
    if (a === "quayLai") return this.quayLai();
    if (a === "day") { const id = t.dataset.id; if (this.day.has(id)) this.day.delete(id); else this.day.add(id); return this.vePhaiGiu(); } // trang gọn <-> mọi thông số
    if (a === "ghi") { const id = t.dataset.id; if (this.ghiMo.has(id)) this.ghiMo.delete(id); else this.ghiMo.add(id); return this.vePhaiGiu(); }
    if (a === "themLoai") { // bảng: thêm dòng cùng loại (chép dòng cuối có loại đó — Kinh nghiệm, Xu…)
      const p = JSON.parse(t.dataset.p), w = t.dataset.w, L = this.lay(p) || [], mau = [...L].reverse().find((r) => Array.isArray(r) && r[0] === w) || [...(this.layGoc(p) || [])].reverse().find((r) => Array.isArray(r) && r[0] === w);
      if (mau) this.dat([...p, L.length], sao(mau));
      return this.vePhaiGiu();
    }
    if (a === "moKn") { const k = "kn:" + t.dataset.k; if (this.mo.has(k)) this.mo.delete(k); else this.mo.add(k); return this.vePhai(); }
    if (a === "json") { const id = t.dataset.id; if (this.json.has(id)) this.json.delete(id); else this.json.add(id); return this.vePhai(); }
    if (a === "xoaDong" || a === "xoaMon") { this.dat(JSON.parse(t.dataset.p), undefined); return this.vePhaiGiu(); }
    if (a === "themDong") { const p = JSON.parse(t.dataset.p), L = this.lay(p) || [], mau = L[L.length - 1] || (this.layGoc(p) || [])[0] || {}; this.dat([...p, L.length], sao(mau)); return this.vePhaiGiu(); }
    if (a === "themMon") {
      const p = JSON.parse(t.dataset.p), L = this.lay(p) || [], k = t.dataset.k, D = this.dinh(p[0]) || {}, bg = tim(D.bang, rel(p));
      // dòng bảng (có tiêu đề cột ở qt-qua.js, hoặc dòng dạng [loại, mã, …]): chép dòng có món gần nhất, thay món (giữ số / tỉ lệ để sửa tiếp)
      const mauB = [...L].reverse().find((r) => coMa(r) >= 0) || [...(this.layGoc(p) || [])].reverse().find((r) => coMa(r) >= 0);
      if (mauB && (bg || !maMon(mauB))) { const j = coMa(mauB), moi = sao(mauB); moi[j] = Array.isArray(mauB[j]) ? [k] : k; this.dat([...p, L.length], moi); } // giữ dạng ô: [tỉ lệ, [mã…]] -> [tỉ lệ, [mã mới]] (soát chéo 17/11)
      else { const mau = L[L.length - 1] || (this.layGoc(p) || [])[0]; this.dat([...p, L.length], mau && mau.length > 2 ? [k, 1, mau[2]] : [k, 1]); }
      delete this.timKq[JSON.stringify(p)]; return this.vePhaiGiu();
    }
    if (a === "boSua") { for (const id of t.dataset.ids.split(",")) delete this.sua[id]; return this.ve(); }
    if (a === "luu") {
      const ids = t.dataset.ids.split(",").filter((id) => this.sua[id] !== undefined); if (!ids.length) return;
      for (const id of ids) {
        const j = await this.qt.goi("cau-hinh", { viec: "luu", id, gia: this.sua[id] });
        if (!j) return this.ve(); // lỗi kiểm kiểu: câu báo ở dòng trên bảng — giữ phần đang sửa
        delete this.sua[id]; this.d = j; this.qt.bao(j.msg);
      }
      return this.ve();
    }
    if (a === "macDinh") {
      const id = t.dataset.id; if (!(await hoi(`Đưa mục <color=yellow>${esc(id)}<color> về mặc định (cau-hinh.json)?`))) return;
      const j = await this.qt.goi("cau-hinh", { viec: "macDinh", id }); if (j) { delete this.sua[id]; this.d = j; this.qt.bao(j.msg); this.ve(); }
      return;
    }
    if (a === "khoiDong") {
      const g = Math.max(10, Math.min(300, so("kdGiay", 60)));
      if (Object.keys(this.sua).length && !(await hoi("Còn mục <color=yellow>chưa lưu<color> — khởi động lại sẽ không có các thay đổi đó. Vẫn khởi động lại?"))) return;
      if (!(await hoi(`Khởi động lại máy chủ sau <color=yellow>${g} giây<color>? Cả máy chủ được báo trước; người chơi mất kết nối vài giây rồi tự nối lại. Đang có / sắp có hoạt động thì máy chủ từ chối.`))) return;
      const j = await this.qt.goi("cau-hinh", { viec: "khoiDong", giay: g }); if (j) { this.d = j; this.qt.bao(j.msg); this.ve(); }
      return;
    }
    if (a === "huyHen") { const j = await this.qt.goi("cau-hinh", { viec: "khoiDong", huy: 1 }); if (j) { this.d = j; this.qt.bao(j.msg); this.ve(); } return; }
    if (a === "taiLai") {
      const g = Math.max(10, Math.min(120, so("tlGiay", 30)));
      if (!(await hoi(`Bắt mọi người đang chơi tải lại trang (F5) sau <color=yellow>${g} giây<color>? Ai cũng thấy đếm ngược rồi tự tải lại, vào lại đúng nhân vật.`))) return;
      const j = await this.qt.goi("cau-hinh", { viec: "taiLai", giay: g }); if (j) { this.d = j; this.qt.bao(j.msg); this.ve(); }
    }
  }
}
