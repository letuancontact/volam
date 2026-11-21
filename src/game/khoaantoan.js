// Khóa an toàn — mật khẩu cấp 2 + tự đổi mật khẩu đăng nhập trong game (anh 10/11: "Họ có thể tự đổi mk cấp 1 và tạo thêm mk cấp 2 ingame", đề
// xuất đầy đủ "Duyệt hết a" — máy chủ may-chu/bao-mat.js). Client gốc có ổ khóa Security Lock (script\ui\security_lock_ui.lua: khóa / mở bằng mật
// khẩu / đổi mật khẩu; hình spr\Ui3\securitylock\locked.spr, unlocked.spr -> assets/ui/hud/btn/khoa_dong.png / khoa_mo.png — cong-cu/dung-o-khoa.js).
// Các khung ở lớp riêng #kat trên cùng trang (không nằm trong #jxwin): dùng được cả ở màn chọn nhân vật (xóa nhân vật — chưa có khung game) lẫn
// trong game, máy tính lẫn điện thoại. Khung chồng nhau (đổi mật khẩu đăng nhập -> hỏi mở khóa): khung trên cùng hiện, đóng thì khung dưới hiện lại.
//   const kat = new KhoaAnToan({ P, msg(t), onDoi(tt) })   dựng 1 lần lúc tải trang (main.js boot) — gắn Net.onBaoMat
//   kat.capNhat({ co, mo })   trạng thái máy chủ (nhịp km, trả lời bao-mat, Net.me.co2): co = đã có mật khẩu cấp 2, mo = trang này đang mở -> onDoi
//   kat.hoi(ma, cau)          -> Promise<bool>: Net.call gặp 403 can-mk2 (bàn phím số: mở khóa) / can-dat-mk2 (đặt: mật khẩu đăng nhập + 6 số × 2);
//                                mọi yêu cầu đang chờ dùng chung 1 khung
//   kat.dam(viec)             -> Promise<bool>: đang mở thì true ngay, chưa thì hỏi (bảng quản trị F10)
//   kat.moKhung()             khung Khóa an toàn (bấm ổ khóa): trạng thái + Mở khóa / Khóa lại / Đặt · Đổi mật khẩu cấp 2 / Đổi mật khẩu đăng nhập
//   kat.doiMk1()              khung Đổi mật khẩu đăng nhập (bảng quản trị "Đổi mật khẩu của tôi" cũng mở khung này)
//   kat.dangHoi()             đang có khung (main.js: bấm cảnh lúc cầm món thì không vứt)
// Bàn phím số: hình + chỗ phím của client 数字键盘.ini (P.win.M.banphim — như mật mã rương windows.js _banPhim): chữ số chỉ bấm bằng chuột / chạm
// (phím số trên bàn phím bị bỏ qua — chống phần mềm ghi phím, như client), Enter = Đồng ý, Esc = Hủy, Backspace = xóa 1 số. Đúng 6 số (số 0 đầu được).
import { Net } from "./net.js";

const BASE = "assets/ui/win/";
const SO = 6; // mật khẩu cấp 2: đúng 6 chữ số (may-chu/bao-mat.js MK2_RE)
const MK1_MIN = 6; // mật khẩu đăng nhập người chơi tự đặt (bao-mat.js kiemMk1)
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const p2 = (n) => String(n).padStart(2, "0");
export const gioNgay = (t) => { const d = new Date(t); return `${p2(d.getHours())}:${p2(d.getMinutes())} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}`; };
const VIEC_CAN = "giao dịch, bày bán / mua ở Chợ Trời, vứt đồ, hủy vật phẩm ở Lễ quan, xóa nhân vật, đổi mật khẩu";

export class KhoaAnToan {
  constructor(api) {
    this.api = api; this.tt = { co: 0, mo: 0 }; this._cho = null; this.ngan = []; this._khung = null;
    const el = (this.el = document.createElement("div"));
    el.id = "kat"; el.className = "kat-lop";
    document.body.appendChild(el);
    // phím: gắn 1 lần lúc tải trang (trước mọi khung game — Enter / Esc của khung khóa an toàn chạy trước khung hỏi giao dịch… — rà soát 10/11)
    addEventListener("keydown", (e) => this._phimBam(e), true);
    Net.onBaoMat = (ma, cau) => this.hoi(ma, cau);
  }
  _am() { try { this.api.P.audio.ui("click"); } catch {} }
  capNhat(s) {
    if (!s || s.co == null) return;
    const moi = { co: s.co ? 1 : 0, mo: s.mo ? 1 : 0 }, doi = moi.co !== this.tt.co || moi.mo !== this.tt.mo;
    this.tt = moi;
    if (doi) { if (this.api.onDoi) this.api.onDoi(this.tt); if (this._khung) this._khung.ve(); }
  }
  dangHoi() { return this.ngan.length > 0; }
  hoi(ma, cau) {
    if (!this._cho) this._cho = (ma === "can-dat-mk2" ? this.hoiDat(cau) : this.hoiMo(cau)).finally(() => { this._cho = null; });
    return this._cho;
  }
  dam(viec) { return this.tt.mo ? Promise.resolve(true) : this.hoi(this.tt.co ? "can-mk2" : "can-dat-mk2", viec); }

  // ---------- chồng khung ----------
  _mo(hop) {
    // ô chữ của game đang nhận phím (giá Chợ Trời, chat…): bỏ — phím số gõ lúc khung mở không lọt vào đó (rà soát 10/11: mật khẩu cấp 2 dính vào giá bày bán)
    const a = document.activeElement; if (a && a !== document.body && !this.el.contains(a) && a.blur) a.blur();
    for (const h of this.ngan) h.el.style.display = "none";
    this.ngan.push(hop); this.el.appendChild(hop.el); this.el.classList.add("on"); document.body.classList.add("kat-mo");
    const o = hop.el.querySelector("input:not([hidden])"); if (o && !matchMedia("(pointer: coarse)").matches) setTimeout(() => o.focus(), 30);
  }
  _dong(hop) {
    const i = this.ngan.indexOf(hop); if (i < 0) return;
    this.ngan.splice(i, 1); hop.el.remove();
    const tren = this.ngan[this.ngan.length - 1];
    if (tren) tren.el.style.display = "";
    else { this.el.classList.remove("on"); document.body.classList.remove("kat-mo"); }
  }
  // khung: tiêu đề, nội dung (html), nút [[chữ, mã]] -> { el, loi(câu, tốt?), ban(bool), on(mã) }
  _hop(tieu, noi, nut, lop = "") {
    const el = document.createElement("div");
    el.className = "kat-hop " + lop;
    el.innerHTML = `<div class="kat-tieu">${esc(tieu)}</div><div class="kat-noi">${noi}</div><div class="kat-loi"></div>` +
      (nut.length ? `<div class="kat-nuts">${nut.map(([t, k]) => `<span class="kat-nut" data-k="${k}">${esc(t)}</span>`).join("")}</div>` : "");
    const hop = {
      el,
      loi: (t, tot) => { const L = el.querySelector(".kat-loi"); L.textContent = t || ""; L.classList.toggle("tot", !!tot); },
      ban: (b) => el.classList.toggle("ban", !!b),
      gt: (k) => { const o = el.querySelector(`[data-o="${k}"]`); return o ? o.value : ""; },
      on: null, huy: null, ok: null,
    };
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]");
      if (!b || (el.classList.contains("ban") && b.dataset.k !== "huy")) return; // đang chờ máy chủ: vẫn Hủy được
      this._am();
      if (b.dataset.k === "huy" && hop.huy) return hop.huy();
      if (b.dataset.k === "ok" && hop.ok) return hop.ok();
      if (hop.on) hop.on(b.dataset.k, b);
    });
    return hop;
  }
  // bàn phím số của client (P.win.M.banphim) gắn vào khung: xong(6 số) khi bấm Đồng ý đủ số, huy() khi bấm Hủy
  _phim(hop, xong, huy) {
    const W = this.api.P && this.api.P.win, d = W && W.M && W.M.banphim && W.M.banphim.sec;
    let s = "";
    const wrap = document.createElement("div"); wrap.className = "kat-phimw";
    if (d && d.Main && d.Main.img) {
      const nen = d.Main.img, N = d.Number;
      const nut = (k, sec, chu) => `<div class="kat-pn" data-p="${k}" style="left:${sec.x}px;top:${sec.y}px;width:${sec.img.w}px;height:${sec.img.h}px;--w:${sec.img.w}px;background-image:url('${BASE}${sec.img.file}')"${chu ? ` title="${esc(chu)}"` : ""}></div>`;
      wrap.innerHTML = `<div class="kat-phim" style="width:${nen.w}px;height:${nen.h}px;background-image:url('${BASE}${nen.file}')">` +
        `<div class="kat-so" style="left:${N.x}px;top:${N.y}px;width:${nen.w - 2 * N.x}px;height:${N.h}px"></div>` +
        [...Array(10).keys()].map((i) => nut(String(i), d[String(i)])).join("") +
        nut("xoa", d.Clear, "Xóa hết") + nut("dongy", d.Confirm, "Đồng ý") + nut("huy", d.Cancel, "Hủy") + "</div>";
    } else { // không có gói khung client: bàn phím chữ
      wrap.innerHTML = `<div class="kat-phim tho"><div class="kat-so"></div>${[1, 2, 3, 4, 5, 6, 7, 8, 9, "xoa", 0, "dongy"].map((k) => `<div class="kat-pn" data-p="${k}">${k === "xoa" ? "Xóa" : k === "dongy" ? "Đồng ý" : k}</div>`).join("")}<div class="kat-pn" data-p="huy">Hủy</div></div>`;
    }
    const so = wrap.querySelector(".kat-so");
    const ve = () => { so.textContent = "*".repeat(s.length) + "·".repeat(SO - s.length); };
    const dongY = () => { if (s.length !== SO) return hop.loi(`Nhập đủ ${SO} chữ số`); const v = s; s = ""; ve(); xong(v); };
    const P = {
      them: (c) => { if (s.length >= SO) return; s += c; ve(); hop.loi(""); },
      xoa: () => { s = ""; ve(); }, lui: () => { s = s.slice(0, -1); ve(); }, dongY,
    };
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]"); if (!b || (hop.el.classList.contains("ban") && b.dataset.p !== "huy")) return; // đang chờ: vẫn Hủy được
      this._am();
      const k = b.dataset.p;
      if (/^\d$/.test(k)) P.them(k); else if (k === "xoa") P.xoa(); else if (k === "dongy") dongY(); else if (k === "huy") huy();
    });
    ve();
    hop.el.querySelector(".kat-noi").after(wrap);
    hop.phim = P;
    return P;
  }
  // khung chỉ có bàn phím (nhập 1 ô số): -> 6 số | null
  _nhapSo(tieu, cau) {
    return new Promise((xong) => {
      const hop = this._hop(tieu, cau ? `<div>${esc(cau)}</div>` : "", [], "kat-chiphim");
      const dong = (v) => { this._dong(hop); xong(v); };
      this._phim(hop, (v) => dong(v), () => dong(null));
      hop.huy = () => dong(null);
      this._mo(hop);
    });
  }
  // ô 6 số trong khung (bấm -> bàn phím): trả hàm đọc giá trị
  _oSo(hop, k) {
    const o = hop.el.querySelector(`[data-so="${k}"]`), v = { s: "" };
    o.addEventListener("click", async () => {
      if (hop.el.classList.contains("ban")) return;
      this._am();
      const s = await this._nhapSo(o.dataset.tieu || "Mật khẩu cấp 2", o.dataset.cau || "");
      if (s != null) { v.s = s; o.querySelector("b").textContent = "******"; o.classList.add("co"); hop.loi(""); }
    });
    return () => v.s;
  }

  // ---------- mở khóa (can-mk2) ----------
  hoiMo(cau) {
    return new Promise((xong) => {
      const hop = this._hop("KHÓA AN TOÀN", `<div>${esc(cau || "Việc này cần mở khóa an toàn")}</div>` +
        `<div class="kat-nho">Nhập mật khẩu cấp 2 (6 chữ số). Mở tới khi thoát game hoặc tải lại trang. Quên mật khẩu cấp 2: nhắn GM.</div>`, [], "kat-chiphim");
      const dong = (v) => { this._dong(hop); xong(v); };
      this._phim(hop, async (so) => {
        hop.ban(true); hop.loi("");
        try { const r = await Net.baoMat({ viec: "mo", mk: so }); this.capNhat(r); dong(true); if (this.api.msg) this.api.msg("Đã mở khóa an toàn — tới khi thoát game hoặc tải lại trang"); }
        catch (e) { hop.ban(false); hop.loi(e.message); if (e.ma === "het-phien") dong(false); }
      }, () => dong(false));
      hop.huy = () => dong(false);
      this._mo(hop);
    });
  }

  // ---------- đặt mật khẩu cấp 2 lần đầu (can-dat-mk2 / khung Khóa an toàn) ----------
  hoiDat(cau) {
    return new Promise((xong) => {
      const ten = (Net.me && Net.me.ten) || "";
      const hop = this._hop("ĐẶT MẬT KHẨU CẤP 2", `<div>${esc(cau || "Việc này cần mật khẩu cấp 2")}</div>` +
        `<div class="kat-nho">Đặt 1 lần cho cả tài khoản: ${SO} chữ số, bấm trên bàn phím số. Cần khi ${VIEC_CAN}. Không trùng mật khẩu đăng nhập.</div>` +
        `<form class="kat-form" onsubmit="return false"><input type="text" name="username" autocomplete="username" value="${esc(ten)}" hidden>` +
        `<label>Mật khẩu đăng nhập<input type="password" data-o="mk1" autocomplete="current-password" maxlength="64"></label></form>` +
        `<div class="kat-o" data-so="moi" data-tieu="MẬT KHẨU CẤP 2 MỚI" data-cau="${SO} chữ số"><span>Mật khẩu cấp 2</span><b>bấm để nhập</b></div>` +
        `<div class="kat-o" data-so="lai" data-tieu="NHẬP LẠI MẬT KHẨU CẤP 2"><span>Nhập lại</span><b>bấm để nhập</b></div>`,
      [["Đặt mật khẩu", "ok"], ["Hủy", "huy"]]);
      const moi = this._oSo(hop, "moi"), lai = this._oSo(hop, "lai");
      const dong = (v) => { this._dong(hop); xong(v); };
      hop.huy = () => dong(false);
      hop.ok = async () => {
        const mk1 = hop.gt("mk1");
        if (!mk1) return hop.loi("Nhập mật khẩu đăng nhập");
        if (moi().length !== SO) return hop.loi("Bấm ô Mật khẩu cấp 2 để nhập 6 chữ số");
        if (moi() !== lai()) return hop.loi("2 lần nhập mật khẩu cấp 2 không giống nhau");
        hop.ban(true); hop.loi("");
        try {
          const r = await Net.baoMat({ viec: "dat", mk1, moi: moi() }); this.capNhat(r);
          dong(true); if (this.api.msg) this.api.msg("Đã đặt mật khẩu cấp 2 — khóa an toàn đang mở tới khi thoát game hoặc tải lại trang");
        } catch (e) { hop.ban(false); hop.loi(e.message); if (e.ma === "het-phien") dong(false); }
      };
      this._mo(hop);
    });
  }

  // ---------- đổi mật khẩu cấp 2 ----------
  doiMk2() {
    return new Promise((xong) => {
      const hop = this._hop("ĐỔI MẬT KHẨU CẤP 2",
        `<div class="kat-o" data-so="cu" data-tieu="MẬT KHẨU CẤP 2 ĐANG DÙNG"><span>Mật khẩu cũ</span><b>bấm để nhập</b></div>` +
        `<div class="kat-o" data-so="moi" data-tieu="MẬT KHẨU CẤP 2 MỚI" data-cau="${SO} chữ số"><span>Mật khẩu mới</span><b>bấm để nhập</b></div>` +
        `<div class="kat-o" data-so="lai" data-tieu="NHẬP LẠI MẬT KHẨU MỚI"><span>Nhập lại</span><b>bấm để nhập</b></div>`,
      [["Đổi mật khẩu", "ok"], ["Hủy", "huy"]]);
      const cu = this._oSo(hop, "cu"), moi = this._oSo(hop, "moi"), lai = this._oSo(hop, "lai");
      const dong = (v) => { this._dong(hop); xong(v); };
      hop.huy = () => dong(false);
      hop.ok = async () => {
        if (cu().length !== SO) return hop.loi("Bấm ô Mật khẩu cũ để nhập");
        if (moi().length !== SO) return hop.loi("Bấm ô Mật khẩu mới để nhập 6 chữ số");
        if (moi() !== lai()) return hop.loi("2 lần nhập mật khẩu mới không giống nhau");
        hop.ban(true); hop.loi("");
        try { const r = await Net.baoMat({ viec: "doi", cu: cu(), moi: moi() }); this.capNhat(r); dong(true); if (this.api.msg) this.api.msg("Đã đổi mật khẩu cấp 2"); }
        catch (e) { hop.ban(false); hop.loi(e.message); if (e.ma === "het-phien") dong(false); }
      };
      this._mo(hop);
    });
  }

  // ---------- đổi mật khẩu đăng nhập (người chơi tự đổi — cần mở khóa / đặt mật khẩu cấp 2 trước: Net.call tự hỏi rồi gửi lại) ----------
  doiMk1() {
    return new Promise((xong) => {
      const ten = (Net.me && Net.me.ten) || "";
      const hop = this._hop("ĐỔI MẬT KHẨU ĐĂNG NHẬP",
        `<div class="kat-nho">Mật khẩu mới ít nhất ${MK1_MIN} ký tự, khác tên tài khoản. Đổi xong máy này vẫn chơi tiếp; lần đăng nhập sau dùng mật khẩu mới.</div>` +
        `<form class="kat-form" onsubmit="return false"><input type="text" name="username" autocomplete="username" value="${esc(ten)}" hidden>` +
        `<label>Mật khẩu đang dùng<input type="password" data-o="cu" autocomplete="current-password" maxlength="64"></label>` +
        `<label>Mật khẩu mới<input type="password" data-o="moi" autocomplete="new-password" maxlength="64"></label>` +
        `<label>Nhập lại<input type="password" data-o="lai" autocomplete="new-password" maxlength="64"></label></form>`,
      [["Đổi mật khẩu", "ok"], ["Hủy", "huy"]]);
      const dong = (v) => { this._dong(hop); xong(v); };
      hop.huy = () => dong(false);
      hop.ok = async () => {
        const cu = hop.gt("cu"), moi = hop.gt("moi"), lai = hop.gt("lai");
        if (!cu) return hop.loi("Nhập mật khẩu đang dùng");
        if (moi.length < MK1_MIN) return hop.loi(`Mật khẩu mới ít nhất ${MK1_MIN} ký tự`);
        if (moi.toLowerCase() === ten.toLowerCase()) return hop.loi("Mật khẩu không được trùng tên tài khoản");
        if (moi !== lai) return hop.loi("2 lần nhập mật khẩu mới không giống nhau");
        hop.ban(true); hop.loi("");
        try {
          const r = await Net.call("POST", "bao-mat", { viec: "doiMk1", cu, moi }); this.capNhat(r);
          for (const i of hop.el.querySelectorAll("input[type=password]")) i.value = "";
          dong(true); if (this.api.msg) this.api.msg("Đã đổi mật khẩu đăng nhập — lần đăng nhập sau dùng mật khẩu mới");
        } catch (e) { hop.ban(false); hop.loi(e.boQua ? "Chưa mở khóa an toàn — chưa đổi" : e.message); if (e.ma === "het-phien") dong(false); }
      };
      this._mo(hop);
    });
  }

  // ---------- khung Khóa an toàn (bấm ổ khóa) ----------
  async moKhung() {
    if (this._khung) return;
    const khung = (this._khung = { ve: () => {} });
    let khoaNhap = 0;
    try { const r = await Net.baoMat({ viec: "xem" }); this.capNhat(r); khoaNhap = r.khoaNhap | 0; } catch (e) { if (e.ma === "het-phien") { this._khung = null; return; } }
    const hop = this._hop("KHÓA AN TOÀN", "", []);
    hop.el.classList.add("kat-khung");
    const nd = hop.el.querySelector(".kat-noi");
    const day = document.createElement("div"); day.className = "kat-nuts"; hop.el.appendChild(day);
    khung.ve = () => {
      const { co, mo } = this.tt;
      const tt = !co ? `<b class="kat-chua">Chưa đặt mật khẩu cấp 2</b>` : mo ? `<b class="kat-mo">Đang mở</b> — tới khi thoát game hoặc tải lại trang` : `<b class="kat-khoa">Đang khóa</b>`;
      nd.innerHTML = `<div class="kat-tt"><i class="kat-ic ${co && !mo ? "dong" : "mo"}"></i>${tt}</div>` +
        `<div class="kat-nho">Mật khẩu cấp 2 hỏi khi ${VIEC_CAN}. Nhập 1 lần dùng tới khi thoát game. Rương chứa đồ vẫn dùng mật mã rương riêng như cũ.</div>` +
        (khoaNhap > 0 ? `<div class="kat-loi">Đang khóa nhập do nhập sai nhiều lần — còn khoảng ${Math.ceil(khoaNhap / 60000)} phút</div>` : "") +
        `<div class="kat-nho">Quên mật khẩu cấp 2: nhắn GM để được xác minh và xóa.</div>`;
      day.innerHTML = [!co ? ["Đặt mật khẩu cấp 2", "dat"] : mo ? ["Khóa lại", "khoa"] : ["Mở khóa", "mo"], co ? ["Đổi mật khẩu cấp 2", "doi2"] : null, ["Đổi mật khẩu đăng nhập", "doi1"], ["Đóng", "huy"]]
        .filter(Boolean).map(([t, k]) => `<span class="kat-nut" data-k="${k}">${t}</span>`).join("");
    };
    const dong = () => { this._khung = null; this._dong(hop); };
    hop.huy = dong;
    hop.on = async (k) => {
      khoaNhap = 0;
      if (k === "mo") await this.hoi("can-mk2");
      else if (k === "dat") await this.hoi("can-dat-mk2", "Đặt mật khẩu cấp 2 cho tài khoản");
      else if (k === "khoa") { try { this.capNhat(await Net.baoMat({ viec: "khoa" })); if (this.api.msg) this.api.msg("Đã khóa an toàn"); } catch (e) { hop.loi(e.message); } }
      else if (k === "doi2") await this.doiMk2();
      else if (k === "doi1") await this.doiMk1();
      if (this._khung === khung) khung.ve();
    };
    khung.ve();
    this._mo(hop);
  }
  // đóng hết (thoát game / mất phiên): khung đang hỏi coi như Hủy (yêu cầu đang chờ báo lỗi như cũ)
  dongHet() {
    for (let i = 0; i < 20 && this.ngan.length; i++) { const h = this.ngan[this.ngan.length - 1]; if (h.huy) h.huy(); else this._dong(h); }
    this._khung = null;
  }

  // phím lúc có khung: Esc = Hủy / đóng khung trên cùng, Enter = Đồng ý; bàn phím số: Backspace xóa 1 số, phím số bỏ qua (chỉ bấm trên màn hình
  // như client). Phím không tới game (phím tắt, chiêu…) trừ F1–F12 / Ctrl (tải lại trang…); đang gõ ô chữ thì để ô nhận phím
  _phimBam(e) {
    const tren = this.ngan[this.ngan.length - 1]; if (!tren) return;
    if (/^F\d+$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    const go = e.target && tren.el.contains(e.target) && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName); // chỉ ô chữ của khung trên cùng
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); if (tren.huy) tren.huy(); return; }
    if (e.key === "Enter") {
      e.preventDefault(); e.stopImmediatePropagation();
      if (tren.el.classList.contains("ban")) return;
      if (tren.phim) tren.phim.dongY(); else if (tren.ok) tren.ok();
      return;
    }
    if (go) return;
    if (tren.phim && e.key === "Backspace") tren.phim.lui();
    e.preventDefault(); e.stopImmediatePropagation();
  }
}
