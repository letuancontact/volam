// Phân Thân (anh 05/11 — thuê phân thân của người chơi khác bằng Mật đồ thần bí; KHÔNG phải hệ Đồng hành của client). Khung = Kiểu 2 anh chọn:
// bố cục khung Lập nhóm 队伍管理.ini của client, nền đã che chữ in sẵn (assets/ui/win/img/pt_nen.png — cong-cu/dung-phan-than.mjs):
//   trái "Phân thân của ta" (phân thân đang thuê: tên · cấp · phái, đang theo / đã cất — anh 18/11: thuê được nhiều con (thueToiDa), ra trận tối đa toiDa (2),
//   quản trị không giới hạn; danh sách cuộn được), giữa 5 nút Thuê · Gọi ra · Cất đi ·
//   Cất hết · Làm mới, phải "Thuê được" (bảng xếp hạng: người khác, cấp ≤ cấp mình + 30), dưới: giờ còn lại hôm nay, cấp tối đa, Hướng dẫn, Đóng.
// Máy chủ: may-chu/phan-than.js (POST /api/phan-than; nhịp mang pt { v, con, ra }). Phân thân đi theo / đánh: src/game/nhanvatmay.js (main.js nối).
//   new PhanThan(W, api)   api = { P, net, hero(), msg(t), hoi(html, ok, huy) -> Promise<bool>, bao(html), chon(html, [nhãn]) -> Promise<chỉ số | -1> (khung chọn
//                          của game — gói thuê), apply(j) (túi / nhân vật mới),
//                          doiTheo(trạng thái đầy đủ) (phân thân đang theo đổi — main.js dựng / bỏ nhân vật máy) }
//   toggle() · open() · nhip(pt) (nhịp) · ds (trạng thái đầy đủ mới nhất: { v, con, ra, ds: [{ id, ten, lvl, fac, snap }] })
import { ganCuon } from "./npcdlg.js";

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// gói thuê [giờ, phí] -> chữ (anh 12/11: 12 giờ 120, cả ngày 360 Mật đồ)
const tenGoi = ([g, p]) => `${g % 24 === 0 ? (g === 24 ? "Cả ngày (24 giờ)" : `${g / 24} ngày`) : `${g} giờ`} — ${p} Mật đồ thần bí`;
const gio = (s) => { s = Math.max(0, Math.floor(s / 60)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const NUT = [["thue", "Thuê", 58], ["goi", "Gọi ra", 78], ["cat", "Cất đi", 98], ["catHet", "Cất hết", 118], ["moi", "Làm mới", 138]];
// phái viết tắt + hệ ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ) — đầu dòng 2 danh sách (dauDong)
const PHAI_NGAN = { "Thiếu Lâm": ["TL", 0], "Thiên Vương": ["TV", 0], "Đường Môn": ["ĐM", 1], "Ngũ Độc": ["NĐ", 1], "Nga My": ["NM", 2], "Thúy Yên": ["TY", 2], "Thiên Nhẫn": ["TN", 3], "Cái Bang": ["CB", 3], "Võ Đang": ["VĐ", 4], "Côn Lôn": ["CL", 4] };
const MAU_HE = ["#ffd94e", "#7fe06a", "#6ec8ff", "#ff8f66", "#e0b77c"];

export class PhanThan {
  constructor(W, api) {
    this.W = W; this.api = api; this.tt = null; this.uv = []; this.chonTa = null; this.chonUv = null; this.dangGoi = false; this.luc = 0;
    const T = W.M.team.sec, B = "img/";
    W.M.phanthan = {
      n: "Phân Thân", ini: "(game — bố cục khung client 队伍管理.ini, nền che chữ: cong-cu/dung-phan-than.mjs)",
      order: ["Main", "LeaderAbility", "MemberList", "NearbyList", "NearbyScroll", "NearbyScroll_Btn", "Cancel"],
      sec: {
        Main: { x: 342, y: 220, w: 340, h: 229, moveable: 1, trans: 0, img: { file: B + "pt_nen.png", w: 340, h: 229, n: 1 } },
        LeaderAbility: { ...T.LeaderAbility, x: 76, w: 72 }, MemberList: { ...T.MemberList }, NearbyList: { ...T.NearbyList },
        NearbyScroll: { ...T.NearbyScroll }, NearbyScroll_Btn: { ...T.NearbyScroll_Btn }, Cancel: { ...T.Cancel, tip: "Đóng khung Phân Thân" },
      },
    };
    const w = (this.w = W.get("phanthan"));
    w.el.classList.add("pt-khung");
    const them = (cls, x, y, wd, ht, html) => { const e = document.createElement("div"); e.className = cls; Object.assign(e.style, { left: x + "px", top: y + "px", width: wd + "px", height: ht + "px" }); e.innerHTML = html; w.el.appendChild(e); return e; };
    them("pt-tieude", 118, 4, 104, 18, "PHÂN THÂN");
    them("pt-dau", 9, 37, 118, 15, "Phân thân của ta");
    them("pt-dau", 213, 37, 104, 15, "Thuê được");
    them("pt-nhan", 4, 179, 70, 14, "Còn lại");
    them("pt-nhan", 150, 179, 58, 14, "Tới cấp");
    this.capEl = them("pt-gt", 210, 179, 126, 13, "");
    this.nut = {};
    for (const [k, t, y] of NUT) { const e = them("pt-nut", 140, y, 60, 16, t); e.dataset.k = k; e.onclick = () => this._bam(k); this.nut[k] = e; }
    const hd = them("pt-nut pt-hd", 4, 207, 173, 18, "Hướng dẫn"); hd.onclick = () => this._huongDan();
    this.ta = w.node("MemberList"); this.ds = w.node("NearbyList");
    for (const el of [this.ta, this.ds]) { el.classList.add("jw-list", "pt-ds"); el.oncontextmenu = (e) => e.preventDefault(); }
    this.ta.classList.add("pt-ta"); // thuê nhiều phân thân (anh 18/11): cột trái cuộn được (game.css)
    this.cuon = ganCuon(W, w, "NearbyList", "NearbyScroll");
    this.ta.onclick = (e) => { const d = e.target.closest("[data-id]"); if (!d) return; this.chonTa = d.dataset.id; this.api.P.audio.ui("click"); this.ve(); };
    this.ds.onclick = (e) => { const d = e.target.closest("[data-id]"); if (!d) return; this.chonUv = d.dataset.id; this.api.P.audio.ui("click"); this.ve(); };
    this.ds.ondblclick = (e) => { const d = e.target.closest("[data-id]"); if (d) { this.chonUv = d.dataset.id; this._bam("thue"); } };
    w.on("Cancel", () => { this.api.P.audio.ui("click"); w.hide(); });
    w.cb.show = () => { if (this.api.dangMo) this.api.dangMo(true); this.ve(); this.tai(); };
    w.cb.hide = () => { if (this.api.dangMo) this.api.dangMo(false); };
    // đếm ngược giờ còn lại khi khung mở (nhịp mang số chính xác)
    this._dem = setInterval(() => { if (w.visible) this._veGio(); }, 1000);
  }
  phai(id) { const f = id == null ? null : (this.api.P.factions || []).find((x) => x.id === id); return f ? f.n.split(/\s+/).slice(0, 2).join(" ") : "Vô phái"; } // 2 chữ đầu: "Thiên Vương Bang" -> "Thiên Vương", "Cái Bang" / "Đường Môn" giữ nguyên
  // đầu dòng danh sách (mẫu B anh chọn 09/11 — người chơi: "tên dài quá hok thấy phái gì luôn"): phái viết tắt tô màu ngũ hành + cấp trước tên, tên dài chỉ cụt phần cuối
  dauDong(x) { const [ngan, he] = PHAI_NGAN[this.phai(x.fac)] || ["VP", -1]; return `<span class="pt-ph"${x.da || he < 0 ? "" : ` style="color:${MAU_HE[he]}"`}>${ngan}</span> <span class="pt-cap">${x.lvl}</span> ${esc(x.ten)}`; }
  open() {
    const M = this.W.M.phanthan.sec.Main;
    if (!this.w.visible) Object.assign(this.w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
    this.w.show(); this.api.P.audio.ui("click");
  }
  toggle() { if (this.w.visible) this.w.hide(); else this.open(); }
  // vào game bằng nhân vật khác (main.js vaoGame): bỏ trạng thái của nhân vật trước — nhịp đầu tải lại (nhip)
  datLai() { this.tt = null; this.uv = []; this.chonTa = null; this.chonUv = null; if (this.w.visible) this.w.hide(); }
  // máy chủ trả trạng thái đầy đủ (mở khung / thuê / gọi / cất)
  nhan(j) {
    if (!j) return;
    if (j.pt) { const cu = this.tt; this.tt = j.pt; this.luc = Date.now(); if (!cu || cu.v !== j.pt.v || JSON.stringify(cu.ra) !== JSON.stringify(j.pt.ra)) this.api.doiTheo(this.tt); }
    if (j.ds) this.uv = j.ds;
    if (j.tui || j.nv) this.api.apply(j);
    if (j.msg) this.api.msg(j.msg);
    if (this.w.visible) this.ve();
  }
  // nhịp: pt gọn { v, con, ra } — phiên bản đổi (sang ngày, hết giờ, máy khác đổi) thì tải đầy đủ (cần bản chụp để dựng phân thân)
  nhip(pt) {
    if (!pt) return;
    const cu = this.tt;
    if (!cu || cu.v !== pt.v) { if (!this._dangTai) this.tai(); return; }
    const ra = Array.isArray(pt.ra) ? pt.ra : [];
    if (JSON.stringify(cu.ra) !== JSON.stringify(ra)) { cu.ra = ra.slice(); this.api.doiTheo(cu); }
    if (this.w.visible) this._veGio();
  }
  async tai() {
    const h = this.api.hero(); if (!h) return;
    this._dangTai = true;
    try { this.nhan(await this.api.net.phanThan(h.slot | 0, { viec: "mo" })); }
    catch (e) { if (e.ma !== "het-phien") this.api.msg("Phân thân: " + e.message); }
    finally { this._dangTai = false; }
  }
  // giây còn của 1 phân thân (anh 10/11: tính từ lúc thuê, cả lúc thoát game — máy chủ gửi x.con lúc tải trạng thái)
  conCua(x) { return Math.max(0, (x.con || 0) - (Date.now() - this.luc) / 1000); }
  _veGio() {
    const la = this.w.node("LeaderAbility"), t = this.tt; if (!la) return;
    const x = t && t.ds.find((y) => y.id === this.chonTa);
    la.innerHTML = t ? `<span class="pt-vang">${x ? gio(this.conCua(x)) + " giờ" : "—"}</span>` : "";
    for (const e of this.ta.querySelectorAll("[data-con]")) { const d = t && t.ds.find((y) => y.id === e.dataset.con); if (d) e.textContent = gio(this.conCua(d)); }
  }
  ve() {
    const t = this.tt, h = this.api.hero() || {};
    const theo = new Set((t && t.ra) || []), da = (t && t.ds) || [];
    if (this.chonTa && !da.some((x) => x.id === this.chonTa)) this.chonTa = null;
    if (!this.chonTa && da.length) this.chonTa = da[0].id;
    this.ta.innerHTML = da.length ? da.map((x) => `<div data-id="${esc(x.id)}" class="pt-dong${x.id === this.chonTa ? " chon" : ""}"><div class="pt-ten">${this.dauDong(x)}</div>`
      + `<div class="pt-tt ${theo.has(x.id) ? "theo" : ""}">${theo.has(x.id) ? "đang theo" : "đã cất"} · còn <span data-con="${esc(x.id)}">${gio(this.conCua(x))}</span></div></div>`).join("")
      + (t && (t.admin || !(t.thueToiDa > 0) || da.length < t.thueToiDa) ? `<div class="pt-trong">— ô trống —</div>` : "")
      : `<div class="pt-trong">Chưa thuê phân thân nào</div>`;
    if (this.chonUv && !this.uv.some((x) => x.id === this.chonUv)) this.chonUv = null;
    this.ds.innerHTML = this.uv.length ? this.uv.map((x) => `<div data-id="${esc(x.id)}" class="pt-dong1${x.id === this.chonUv ? " chon" : ""}${x.da ? " da" : ""}">${this.dauDong(x)}</div>`).join("")
      : `<div class="pt-trong">${this._dangTai ? "Đang tải…" : "Chưa có ai thuê được"}</div>`;
    if (this.cuon) this.cuon.sync();
    this.capEl.innerHTML = t ? `<span class="pt-xanh">${t.capToi} (cấp mình + ${t.capToi - (h.lvl | 0)})</span>` : "";
    this._veGio();
    // nút: mờ khi không làm được
    const x = da.find((y) => y.id === this.chonTa), uv = this.uv.find((y) => y.id === this.chonUv);
    // thuê: không giới hạn lượt / ngày (anh 12/11); người đang thuê (uv.da) = gia hạn, người mới cần còn chỗ (thueToiDa cùng lúc — anh 18/11); gọi ra: tối đa toiDa
    // con ra trận cùng lúc; quản trị (t.admin) không giới hạn cả 2
    const toiDa = (t && t.toiDa) || 2, ad = !!(t && t.admin), thueMax = (t && t.thueToiDa) | 0;
    const tat = { thue: !uv || (!uv.da && !ad && thueMax > 0 && da.length >= thueMax), goi: !x || theo.has(x.id) || !t || (!ad && theo.size >= toiDa), cat: !x || !theo.has(x.id), catHet: !theo.size, moi: false };
    for (const [k, e] of Object.entries(this.nut)) e.classList.toggle("tat", !!tat[k]);
  }
  async _goi(b, hoi) {
    const h = this.api.hero(); if (!h || this.dangGoi) return;
    if (hoi && !(await this.api.hoi(...hoi))) return;
    this.dangGoi = true;
    try { this.nhan(await this.api.net.phanThan(h.slot | 0, b)); this.api.P.audio.ui("click"); }
    catch (e) { if (e.ma !== "het-phien") this.api.msg(e.message); }
    finally { this.dangGoi = false; if (this.w.visible) this.ve(); }
  }
  _bam(k) {
    if (this.nut[k] && this.nut[k].classList.contains("tat")) return this._lyDo(k);
    this.api.P.audio.ui("click");
    const t = this.tt;
    if (k === "moi") return this.tai();
    if (k === "thue") {
      const uv = this.uv.find((y) => y.id === this.chonUv); if (!uv) return;
      return this._thue(uv);
    }
    if (k === "goi") return this._goi({ viec: "goi", id: this.chonTa });
    if (k === "cat") return this._goi({ viec: "cat", id: this.chonTa });
    if (k === "catHet") return this._goi({ viec: "cat", id: "tat" });
  }
  // chọn gói thuê (anh 12/11 "120 mật đồ 12 tiếng, 360 mật đồ cả ngày") ở khung chọn của game -> thuê / gia hạn (người đang thuê: cộng thêm giờ vào giờ còn lại)
  async _thue(uv) {
    const t = this.tt || {}, goi = Array.isArray(t.goi) && t.goi.length ? t.goi : [[t.gioThue || 12, t.phi || 120]];
    const cu = ((t.ds) || []).find((x) => x.id === uv.id || x.ten === uv.ten);
    const dau = cu ? `Gia hạn phân thân <color=yellow>${esc(uv.ten)}<color> (còn ${gio(this.conCua(cu))} giờ) — giờ của gói cộng thêm vào giờ còn lại.`
      : `Thuê phân thân <color=yellow>${esc(uv.ten)}<color> (cấp ${uv.lvl} · ${esc(this.phai(uv.fac))}) — tính từ lúc thuê, kể cả lúc thoát game.`;
    const i = await this.api.chon(`${dau}<enter>Chọn gói thuê:`, goi.map(tenGoi));
    if (!(i >= 0) || !goi[i]) return;
    return this._goi({ viec: "thue", id: uv.id, goi: i });
  }
  // nút mờ: nói vì sao (dòng tin của game, không hộp trình duyệt)
  _lyDo(k) {
    const t = this.tt, toiDa = (t && t.toiDa) || 2, theo = new Set((t && t.ra) || []);
    const m = { thue: !this.chonUv ? "Chọn 1 người ở cột Thuê được trước" : `Đang thuê đủ ${(t && t.thueToiDa) | 0} phân thân cùng lúc — chờ 1 phân thân hết giờ (chọn người đang thuê để gia hạn)`,
      goi: !this.chonTa ? "Chưa có phân thân — thuê trước" : theo.has(this.chonTa) ? "Phân thân này đang theo rồi" : `Đang có ${toiDa} phân thân ra trận — cất bớt 1 phân thân rồi gọi`,
      cat: "Phân thân này chưa gọi ra", catHet: "Chưa có phân thân nào đang theo" }[k];
    if (m) this.api.msg(m);
  }
  _huongDan() {
    this.api.P.audio.ui("click");
    const t = this.tt || {};
    this.api.bao([
      "<color=yellow>Phân thân<color>: thuê bản sao của cao thủ khác trên bảng xếp hạng — mang <color=yellow>100%<color> chỉ số của người đó lúc thuê.",
      `• Gói thuê: ${(Array.isArray(t.goi) && t.goi.length ? t.goi : [[t.gioThue || 12, t.phi || 120]]).map((g) => `<color=yellow>${tenGoi(g)}<color>`).join(", ")}. Tính từ lúc thuê, kể cả lúc thoát game; qua 0 giờ không mất phân thân đang thuê.`,
      `• Không giới hạn lượt thuê. Thuê cùng lúc ${t.thueToiDa > 0 ? `tối đa <color=yellow>${t.thueToiDa}<color>` : "bao nhiêu cũng được"} phân thân, <color=yellow>ra trận cùng lúc tối đa ${t.toiDa || 2}<color> (Gọi ra / Cất đi để đổi con); thuê lại người đang thuê = gia hạn (cộng thêm giờ). Người bị sao chép nhận 10% tiền công. Chỉ thuê được cao thủ không quá cấp mình + 30.`,
      "• Phân thân đi theo, dùng vòng sáng / bùa lợi / hồi máu cho đại hiệp và đánh quái. Quái phân thân giết: đại hiệp nhận đủ kinh nghiệm, không rơi tiền, đồ — riêng Boss Sát thủ phân thân hạ thì đồ rơi cho đại hiệp.",
      "• Vào thành / hoạt động thì phân thân tạm ẩn; ủy thác không có phân thân.",
    ].join("<enter>"));
  }
}
