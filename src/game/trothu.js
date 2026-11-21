// Khung Trợ Thủ (auto trong game, anh muốn 25/10 — bố cục theo "Trợ Thủ Kiếm Hiệp" VLTK 2.0: 4 thẻ Cơ bản · Kỹ năng · Treo máy · Khác).
// Client mình không có khung này -> ghép từ đồ client: nền + tiêu đề + nút Đóng của khung Thuộc tính khác (玩家其它属性.ini — thanh tiêu
// đề trống, nền hoa văn), các thẻ = hình nút thẻ của khung Nhân vật (BtnAttribPage), ô đánh dấu = hình ToggleStatus của khung Tùy chọn.
// Cài đặt: hero.auto (src/game/auto.js) — đổi gì lưu ngay (api.save). Mở: nút Trợ Thủ ở cột icon phải (25/10 dưới bản đồ nhỏ, 27/10 dời vào cột icon), phím K,
// chuột phải ô phím tắt trống ở thanh dưới (nút "Ủy thác" của bảng Esc nay là Tin cập nhật — 29/10). Lần đầu mở: sát góc phải màn hình, dưới bản đồ nhỏ (anh muốn);
// kéo được bằng tiêu đề / nền như các cửa sổ khác (lớp jw-drag — src/game/uiwin.js), kéo rồi thì giữ chỗ.
//   const T = new TroThu(W, api); T.open(thẻ?)   api = { P, net, hoi(html, ok, huy) -> Promise, hero(), world(), save(), msg(t), doItem(b), farmZones(), moBai(bãi), capVao(bãi),
//                                                  coChung(bãi) -> có bản quái chung, qcPct() -> % thưởng bản chung, treo(), shown(mở), skills() -> [{ id, n, lv, kind }], skillsChanged(), doi() -> tổ đội | null,
//                                                  boCuc(việc) (main.js — bố cục màn hình), dangKeo() -> đang kéo thả bảng,
//                                                  dt() -> giao diện điện thoại dọc (dienthoai.js) | null }

import { ItemDB, KICH, SINH, laVatTk } from "./itemdb.js";
import { LOC_DONG, chuanNhat, BOSS_TAM } from "./auto.js";
import { getUiTheme, setUiTheme } from "./ui-theme.js";

// anh 26/10 "gom các nhóm cùng mục đích, bỏ giải thích lằng nhằng"; anh 28/10 lần 4: thêm thẻ Nhặt đồ (tự nhặt + lọc dòng + không nhặt), "treo
// máy có thể để qua cùng với cái tự đánh" -> bãi treo máy sang thẻ Đánh quái (cùng tổ đội), thẻ Treo máy còn lại việc về thành -> "Về thành".
// Thuốc (tự uống, tự dùng) · Kỹ năng (đánh: chiêu + bùa hại; hỗ trợ: hồi máu, bùa lợi, vòng sáng) · Đánh quái (thẻ con Quái thường: tự đánh, bãi treo
// máy, tổ đội; thẻ con Boss Hoàng Kim — anh 03/11) · Nhặt đồ · Về thành (mọi điều kiện tự về thành, việc ở thành) · Tiện ích (anh 03/11 — thẻ con
// Ngũ hành: cách mặc đồ ngũ hành; Nhiệm vụ ngày: tự làm Dã Tẩu / Boss Sát thủ) · Khác (hiển thị). Giải thích dài ở chữ hiện khi rê chuột (title)
// anh 06/11: thẻ PK (hàng 2 ô 4) — cài đặt riêng cho trận Tống Kim (auto.js pk)
const TABS = ["Thuốc", "Kỹ năng", "Đánh quái", "Nhặt đồ", "Về thành", "Tiện ích", "Khác", "PK"];
// thẻ xếp nhiều hàng (anh 03/11: 7 thẻ 1 hàng phải hạ chữ xuống cỡ 11 — "em có thể làm thành 2 hàng vì mình sẽ còn mở thêm các tab khác nữa"): mỗi hàng
// TAB_HANG nút rộng bằng nhau 312 / 4 = 78 điểm (gần đúng hình nút thẻ 77 của client, chữ 12 như client), đủ 4 thì xuống hàng — thêm thẻ chỉ cần thêm
// tên vào TABS; ô nội dung lùi xuống theo số hàng (constructor)
const TAB_HANG = 4, TAB_W = Math.round(312 / TAB_HANG), TAB_SO_HANG = Math.ceil(TABS.length / TAB_HANG), TAB_NHAT = TABS.indexOf("Nhặt đồ");
const TAB_X = TABS.map((_, i) => 2 + (i % TAB_HANG) * TAB_W);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const TU_DUNG_TOI_DA = 6; // số dòng "Tự dùng khi đang tự đánh" (thẻ Thuốc)
// ngũ hành (thẻ Tiện ích → Ngũ hành): tên hệ, màu chữ như ảnh hướng dẫn anh gửi 03/11 (Kim vàng, Mộc xanh lá, Thủy xanh dương, Hỏa đỏ, Thổ trắng),
// tên ô trang bị của client (G_ITEM_10..19 — như itemtip.js)
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const HE_MAU = ["#ffd84a", "#5ee05e", "#4fb6ff", "#ff5a4a", "#f2ead8"];
const TEN_O = { Cap: "Nón", Cloth: "Y phục", Sash: "Thắt lưng", Weapon: "Vũ khí", Shoes: "Hài", Bangle: "Hộ uyển", Necklace: "Dây chuyền", Ring1: "Nhẫn trên", Ring2: "Nhẫn dưới", Pendant: "Ngọc bội" };
// hệ cần của từng ô khi vũ khí hệ w: ô liên kết của ô X (KICH[X] — 2 ô kích dòng ẩn của X) phải là hệ sinh ra hệ của X -> lan từ ô vũ khí ra đủ 10 ô
// (vũ khí Kim: nón Kim, y phục + dây chuyền Thổ, thắt lưng + nhẫn dưới Hỏa, hộ uyển + ngọc bội Mộc, hài + nhẫn trên Thủy — đúng ảnh anh gửi)
function heCacO(w) {
  const me = (s) => SINH.indexOf(s), he = { Weapon: w }, hang = ["Weapon"];
  while (hang.length) { const o = hang.shift(); for (const l of KICH[o] || []) if (he[l] == null) { he[l] = me(he[o]); hang.push(l); } }
  return he;
}

export class TroThu {
  constructor(W, api) {
    this.W = W; this.api = api; this.tab = 0; this.con = {}; // con: thẻ con đang mở của từng thẻ (Đánh quái, Tiện ích)
    const O = W.M.other.sec, B = W.M.status.sec.BtnAttribPage;
    W.M.trothu = {
      n: "Trợ Thủ", ini: "(game — ghép từ khung client)", order: ["Main", "Title", ...TABS.map((_, i) => "Tab" + i), "Close"],
      sec: { Main: { ...O.Main, x: 20, y: 40 }, Title: { ...O.Title, x: 58, w: 200, text: "Trợ Thủ Kiếm Hiệp" },
        ...Object.fromEntries(TABS.map((t, i) => ["Tab" + i, { ...B, x: TAB_X[i], y: B.y + Math.floor(i / TAB_HANG) * B.h, w: TAB_W, img: { ...B.img, w: TAB_W }, label: t, tip: undefined }])), Close: O.Close },
    };
    const w = (this.w = W.get("trothu"));
    TABS.forEach((_, i) => w.on("Tab" + i, () => { this.tab = i; this.render(); api.P.audio.ui("click"); }));
    this.box = document.createElement("div");
    this.box.className = "tt jw-drag";
    // ô nội dung (game.css .tt: top 62, cao 346 cho 1 hàng thẻ) lùi xuống mỗi hàng thẻ thêm 1 nút cao, đáy giữ nguyên
    const lui = (TAB_SO_HANG - 1) * B.h;
    if (lui) Object.assign(this.box.style, { top: 62 + lui + "px", height: 346 - lui + "px" });
    w.item("Title").el.classList.add("jw-drag");
    w.el.appendChild(this.box);
    this.chk = W.M.options.sec.ToggleStatus.img; // ô đánh dấu của client: khung 0 trống, 1 đánh dấu
    w.cb.show = () => { this.render(); if (api.shown) api.shown(true); };
    w.cb.hide = () => { this._dongXo(); if (api.shown) api.shown(false); };
    w.cb.layout = () => { if (!w.daKeo) this.place(); }; // đổi cỡ cửa sổ (uiwin.js layout): chưa kéo tay thì dán lại mép phải
  }
  open(tab) { if (tab != null) this.tab = tab; if (!this.placed || !this.w.daKeo) this.place(); this.w.show(); this.render(); }
  // sát góc phải màn hình (không phải mép phải khung 1024 — màn rộng thì khung giữa màn), dưới bản đồ nhỏ (bản đồ nhỏ dán góc phải trên);
  // chừa cột icon mép phải (x 994 — nút Trợ Thủ / nhận thưởng ở đó từ 27/10, khung không che nút). Tính lại mỗi lần mở / đổi cỡ cửa sổ (anh 03/11:
  // bản trước tính 1 lần lúc mở đầu — mở ở cửa sổ nhỏ / giao diện điện thoại rồi phóng to thì bảng nằm giữa màn hoặc sát mép trên); kéo tay thì giữ
  place() {
    const W = this.W, r = W.root.getBoundingClientRect(), s = r.width / 1024 || 1, M = W.M.trothu.sec.Main, MM = this.api.P.hud.M.minimap;
    this.w.el.style.left = Math.round((innerWidth - r.left) / s - (1024 - 994) - 4 - M.w) + "px";
    this.w.el.style.top = Math.round(MM.y + MM.h + 26 - W.offY / s) + "px";
    this.placed = true;
  }
  toggle() { this.w.visible ? this.w.hide() : this.open(); }

  // ---------- điều khiển (gắn thẳng vào ô cài đặt, đổi là lưu) ----------
  _save() { this.api.save(); }
  // hàng "Áp dụng" đầu thẻ chiến đấu (anh 08/11 "làm 1 cái áp dụng cho các phần khác nhau, ví dụ anh đi pk thì a bấm áp dụng auto pk, thì nó sẽ chỉ đánh theo cài đặt ở đó
  // thôi, tương tự như đánh quái"): thẻ đang áp dụng ghi chữ, thẻ kia có nút chuyển sang
  _apDung(on, ten, lam) {
    if (!on) return this._row(this._b(`Áp dụng ${ten}`, () => { lam(); this._save(); this.render(); this.api.msg(`Trợ Thủ: áp dụng ${ten}`); }));
    const x = this._x(`● Đang áp dụng ${ten}`); x.style.color = "#5ee05e";
    return this._row(x);
  }
  // Ngũ hành ở Hướng dẫn hoạt động (anh 08/11 "check ngũ hành đưa vào trong cái hướng dẫn hoạt động đi"): phần vẽ của _nguHanh, đổi hệ thì vẽ lại ở chỗ gọi
  // -> { hang (nút chọn hệ), bang (khung trang bị), ghi (dòng hệ nhân vật | null), nhom: [{ ten, mau, o: [tên ô] }] các ô cần mặc cùng hệ — anh 09/11 chọn mẫu C }
  nguHanhDom(h, lai) {
    const t = Object.create(this); t.render = lai;
    const [hang, bang, ghi] = t._nguHanh(h.auto, h), E = h.equip || {}, vk = E.Weapon && E.Weapon.s != null ? E.Weapon.s : null, he = heCacO(h.auto.nh.he >= 0 ? h.auto.nh.he : vk ?? 0), M = new Map();
    for (const o of Object.keys(TEN_O)) { if (!M.has(he[o])) M.set(he[o], []); M.get(he[o]).push(TEN_O[o]); }
    return { hang, bang, ghi: ghi || null, nhom: [...M].map(([i, ds]) => ({ ten: HE[i], mau: HE_MAU[i], o: ds })) };
  }
  _c(o, k, then) {
    const el = document.createElement("i"); el.className = "tt-c"; el.dataset.click = 1;
    const draw = () => (el.style.backgroundPosition = `${-(o[k] ? 1 : 0) * this.chk.w}px 0`);
    Object.assign(el.style, { backgroundImage: `url(assets/ui/win/${this.chk.file})`, width: this.chk.w + "px", height: this.chk.h + "px" });
    el.onclick = () => { o[k] = o[k] ? 0 : 1; draw(); this._save(); this.api.P.audio.ui("click"); if (then) then(); };
    draw();
    return el;
  }
  _n(o, k, a, b, w = 36) {
    const el = document.createElement("input"); el.className = "tt-n"; el.value = o[k]; el.style.width = w + "px"; el.inputMode = "numeric";
    el.onkeydown = (e) => e.stopPropagation();
    el.onchange = () => { const v = Math.max(a, Math.min(b, parseInt(el.value, 10) || 0)); o[k] = v; el.value = v; this._save(); };
    return el;
  }
  // thanh xổ kiểu game (anh 02/11 chọn mẫu B — "thanh xổ này vẫn đang là màu trắng, không đồng bộ được với style game à"): ô đang chọn (chữ vàng,
  // rộng theo dòng dài nhất — mọi dòng chồng 1 ô lưới, chỉ dòng đang chọn hiện) + khung xổ tự vẽ (_xo) thay <select> của trình duyệt — điện thoại
  // cũng vậy. opts = [[giá trị, chữ, khóa?]] (khóa: hiện xám, không chọn được)
  _s(o, k, opts, then) {
    const el = document.createElement("span"); el.className = "tt-s"; el.dataset.click = 1;
    // giá trị đã lưu không còn trong danh sách (chiêu đổi loại, quên chiêu…) -> về lựa chọn đầu
    if (opts.length && !opts.some(([v]) => String(v) === String(o[k]))) o[k] = opts[0][0];
    const ve = () => { el.innerHTML = opts.map(([v, t, , mau]) => `<b${String(v) === String(o[k]) ? ' class="on"' : ""}${mau ? ` style="color:${mau}"` : ""}>${esc(t)}</b>`).join("") + "<i></i>"; }; // mau: màu chữ dòng (bản quái chung)
    ve();
    el.onclick = () => {
      this.api.P.audio.ui("click");
      if (this._xoMo && this._xoMo.el === el) return this._dongXo();
      this._xo(el, opts, String(o[k]), (v) => { o[k] = v; ve(); this._save(); if (then) then(); });
    };
    return el;
  }
  // khung xổ của _s (game.css .tt-xo): dưới ô (không đủ chỗ thì lên trên), cuộn bằng lăn chuột / kéo ngón; bấm ra ngoài, Esc, cuộn bảng, vẽ lại,
  // đóng bảng: đóng
  _xo(el, opts, cur, chon) {
    this._dongXo();
    const r = el.getBoundingClientRect(), d = document.createElement("div");
    d.className = "tt-xo";
    d.innerHTML = opts.map(([v, t, khoa, mau], i) => `<b data-i="${i}" class="${String(v) === cur ? "on" : ""}${khoa ? " khoa" : ""}"${mau && !khoa ? ` style="color:${mau}"` : ""}>${esc(t)}</b>`).join("");
    document.body.appendChild(d);
    const H = innerHeight, cao = Math.min(d.scrollHeight, 268), duoi = H - r.bottom - 4 >= cao || r.top < H - r.bottom;
    d.style.cssText = `left:${Math.round(Math.max(4, Math.min(innerWidth - Math.max(r.width, d.offsetWidth) - 4, r.left)))}px;min-width:${Math.round(r.width)}px;` +
      `${duoi ? "top:" + Math.round(r.bottom + 1) : "bottom:" + Math.round(H - r.top + 1)}px;max-height:${cao}px`;
    const on = d.querySelector("b.on"); if (on) d.scrollTop = on.offsetTop - cao / 2 + on.offsetHeight / 2;
    d.onclick = (e) => {
      const b = e.target.closest("b[data-i]"); if (!b || b.classList.contains("khoa")) return;
      this.api.P.audio.ui("click"); const v = opts[+b.dataset.i][0]; this._dongXo(); chon(v);
    };
    const ngoai = (e) => { if (!d.contains(e.target) && !el.contains(e.target)) this._dongXo(); };
    const phim = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); this._dongXo(); } };
    const cuon = () => this._dongXo();
    addEventListener("pointerdown", ngoai, true); addEventListener("keydown", phim, true); this.box.addEventListener("scroll", cuon);
    this._xoMo = { el, d, bo: () => { removeEventListener("pointerdown", ngoai, true); removeEventListener("keydown", phim, true); this.box.removeEventListener("scroll", cuon); } };
  }
  _dongXo() { const x = this._xoMo; if (!x) return; this._xoMo = null; x.bo(); x.d.remove(); }
  _b(text, fn) { const el = document.createElement("span"); el.className = "tt-b"; el.dataset.click = 1; el.textContent = text; el.onclick = () => { this.api.P.audio.ui("click"); fn(); }; return el; }
  _row(...parts) {
    const d = document.createElement("div"); d.className = "tt-r";
    for (const p of parts) d.append(typeof p === "string" ? Object.assign(document.createElement("span"), { textContent: p }) : p);
    return d;
  }
  _h(t, tip) { const d = document.createElement("div"); d.className = "tt-h"; d.textContent = t; if (tip) d.title = tip; return d; }
  _tip(el, tip) { el.title = tip; return el; }
  _in() { return Object.assign(document.createElement("span"), { className: "tt-in" }); } // thụt lề dòng con
  _g(t) { const d = document.createElement("div"); d.className = "tt-g"; d.textContent = t; return d; }
  _x(t, cls = "") { return Object.assign(document.createElement("span"), { className: "tt-x " + cls, textContent: t }); } // chữ xanh nhạt (tên món, số đang có)

  render() {
    const h = this.api.hero(); if (!h || !h.auto) return;
    // anh 16/11: Tiếp cận (thẻ Đánh quái + thẻ PK) tối đa = tầm chiêu xa nhất của phái — số cũ lưu lớn hơn thì kẹp ngay khi mở, thẻ nào cũng vậy
    { const tp = this._tamPhai(), A = h.auto; let doi = false; for (const o of [A.danh, A.pk]) if (o && o.tiep > tp) { o.tiep = tp; doi = true; } if (doi) this._save(); }
    this._dongXo();
    TABS.forEach((_, i) => this.w.check("Tab" + i, i === this.tab));
    const top = this.box.scrollTop, khoa = this.tab + ":" + (this.con[this.tab] | 0), cu = khoa === this._tabVe;
    this.box.textContent = "";
    this.box.append(...[this._thuoc, this._ky, this._danh, this._nhat, this._ve, this._tienIch, this._khac, this._pk][this.tab].call(this, h.auto, h));
    this.box.scrollTop = cu ? top : 0; // vẽ lại cùng thẻ (bấm Xóa, Thêm…): giữ chỗ đang cuộn
    this._tabVe = khoa;
  }
  // thanh thẻ con trong 1 thẻ (anh 03/11: Đánh quái chia Quái thường / Boss Hoàng Kim; Tiện ích chia Ngũ hành / Nhiệm vụ ngày) -> [thanh, chỉ số đang mở]
  _con(ds) {
    const i = Math.min(ds.length - 1, this.con[this.tab] | 0), d = document.createElement("div");
    d.className = "tt-con";
    ds.forEach((t, j) => {
      const b = document.createElement("span"); b.textContent = t; b.dataset.click = 1; if (j === i) b.className = "on";
      b.onclick = () => { if (j === i) return; this.con[this.tab] = j; this.api.P.audio.ui("click"); this.render(); };
      d.append(b);
    });
    return [d, i];
  }

  // ---------- Thuốc: tự uống theo 3 dòng + tự dùng ----------
  // Mỗi dòng chọn LOẠI thuốc (anh 29/10: "thay vì dùng ô, đổi thành dùng loại thuốc nào, thanh xổ xuống và chọn" — bản trước chọn 1 trong 9
  // ô phím tắt thanh dưới): mọi loại thuốc của kho đồ (15 loại Dược điếm + Hồi Thiên Tái Tạo Đơn), dòng sinh lực chỉ thuốc có hồi sinh lực,
  // dòng nội lực chỉ thuốc có hồi nội lực; loại đang có trong túi lên đầu (kèm số bình). "Bất kỳ" = thuốc cùng loại trong túi, chồng ít bình
  // nhất (main.js autoDrink — hết loại đã chọn cũng uống như vậy)
  // Chỉ hiện loại đang có trong túi (anh 30/10 lần 2: "chỉ cho chọn các loại máu / mana đang có trong túi đồ") + loại đang chọn của dòng đó
  // (đã hết bình: ghi "hết" để biết dòng đang đặt loại nào). Anh 03/11: "bất kì loại thuốc sinh / nội nào cũng tác dụng với các loại hồi cả 2 như hồi
  // thiên hay ngũ hoa" -> Bất kỳ (và hết loại đã chọn) uống cả thuốc hồi cả hai, sau thuốc một loại (main.js autoDrink)
  _thuoc(A, h) {
    const so = (k) => (h.bag || []).reduce((t, b) => t + (b.k === k ? b.n || 1 : 0), 0);
    const all = [...(ItemDB.by ? ItemDB.by.values() : [])].filter((x) => x.thuoc);
    const opts = (hp, chon) => [["", hp ? "Bất kỳ thuốc sinh lực" : "Bất kỳ thuốc nội lực"],
      ...all.filter((x) => (hp ? x.hp : x.mp)).map((x) => ({ x, n: so(x.k) })).filter(({ x, n }) => n > 0 || x.k === chon)
        .sort((a, b) => (b.n > 0) - (a.n > 0) || (parseInt(a.x.k.split(":")[1], 10) || 0) - (parseInt(b.x.k.split(":")[1], 10) || 0))
        .map(({ x, n }) => [x.k, `${x.n} ${n ? `×${n}` : "(hết)"}`])];
    const out = [this._h("Tự uống thuốc", "Chọn loại thuốc để tự uống khi sinh lực / nội lực dưới mức. Hết loại đó (hoặc chọn Bất kỳ) thì uống thuốc khác trong túi có hồi sinh lực / nội lực — cả thuốc hồi cả hai (Ngũ Hoa Ngọc Lộ Hoàn, Hồi Thiên Tái Tạo Đơn…) sau thuốc một loại, chồng ít bình nhất trước. Uống khi bình trước đã hồi xong.")];
    A.thuoc.forEach((r) => {
      out.push(this._row(this._c(r, "on"), r.loai === "hp" ? "SL <" : "NL <", this._n(r, "pct", 1, 99, 28), "% uống"));
      const s = this._s(r, "k", opts(r.loai === "hp", r.k)); s.style.maxWidth = "250px";
      out.push(this._row(this._in(), s));
    });
    // tự dùng khi đang tự đánh (main.js tuDungTick): anh 28/10 lần 4 Tiên Thảo Lộ / Bách Quả Lộ / Thiên Sơn Bảo Lộ, 31/10 + các loại hoàn; 31/10 lần 3
    // ("cái này rối á, em cho chọn thanh xổ xuống, loại nào có thì mới được chọn tự động dùng"): mỗi dòng = ô bật / tắt + thanh xổ xuống chọn món có
    // trạng thái (lộ, hoàn của Kỳ Trân Các) — chỉ món đang có trong túi (+ món dòng đó đang chọn: hết thì ghi "hết"), bỏ món đã chọn ở dòng khác và
    // Nội … hoàn khác khi đã chọn 1 loại Nội (ăn loại này loại kia mất); "Bỏ dòng này" để xóa; dòng cuối "Chọn thêm" (tối đa TU_DUNG_TOI_DA dòng)
    out.push(this._h("Tự dùng khi đang tự đánh", "Chọn lộ / hoàn đang có trong túi. Đang tự đánh mà hết hiệu quả thì dùng 1 món. Lộ: 1 giờ (dùng chồng lên thì vô hiệu như client); hoàn: 5 phút (Nội … hoàn 10 phút). Giờ chỉ trôi lúc đang chơi."));
    const ttMon = [...(ItemDB.by ? ItemDB.by.values() : [])].filter((x) => x.dung && x.dung.loai === "trangThai");
    const ds = (A.dung.ds = A.dung.ds.filter((r) => ItemDB.item(r.k)));
    const nhom = (k) => ((ItemDB.item(k) || {}).dung || {}).nhom;
    // hoàn Tống Kim (anh 06/11 — đặc tả đợt 2): chỉ tự dùng trong chiến trường (main.js tuDungTick bỏ qua ngoài trận)
    const nhan = (x) => { const n = so(x.k), T = ItemDB.buffDef(x.dung.buff) || {}; return `${x.n.replace(/\s+/g, " ").trim()} ${n ? `×${n}` : "(hết)"} — ${T.d || ""}${laVatTk(x.k) ? " (chỉ trong Tống Kim)" : ""}`; };
    const duoc = (r) => ttMon.filter((x) => (so(x.k) > 0 || (r && x.k === r.k)) && !ds.some((o) => o !== r && (o.k === x.k || (x.dung.nhom && nhom(o.k) === x.dung.nhom))));
    for (const r of ds) {
      const s = this._s(r, "k", [...duoc(r).map((x) => [x.k, nhan(x)]), ["", "— Bỏ dòng này —"]], () => { if (!r.k) ds.splice(ds.indexOf(r), 1); this._save(); this.render(); });
      s.style.width = s.style.maxWidth = "262px"; // cùng bề rộng (game.css .tt-s max-width 170)
      out.push(this._row(this._c(r, "on"), s));
    }
    const them = duoc(null);
    if (ds.length < TU_DUNG_TOI_DA && them.length) {
      const moi = { k: "" };
      const s = this._s(moi, "k", [["", "— Chọn thêm vật phẩm tự dùng —"], ...them.map((x) => [x.k, nhan(x)])], () => { if (moi.k) { ds.push({ k: moi.k, on: 1 }); this._save(); this.render(); } });
      s.style.width = s.style.maxWidth = "262px"; // cùng bề rộng (game.css .tt-s max-width 170)
      out.push(this._row(this._in(), s));
    } else if (!ds.length) out.push(this._g("Trong túi chưa có lộ / hoàn nào (Kỳ Trân Các bán)."));
    out.push(this._tip(this._row(this._c(A.dung.leBao, "on"), "Hết Hồi Thiên Tái Tạo Đơn: rút", this._n(A.dung.leBao, "n", 1, 60, 28), "viên"),
      "Rút từ Hồi thiên tái tạo lễ bao trong túi (mỗi bao 60 viên). Mang tối đa 60 bình thuốc mọi loại."));
    out.push(this._row(this._in(), this._x(`từ Hồi thiên tái tạo lễ bao (đang có ${so("ms:2527")} bao)`)));
    return out;
  }

  // ---------- Kỹ năng: chiêu đã học (cấp ≥ 1) ----------
  _ky(A) {
    const D = A.danh, out = [];
    const L = this.api.skills ? this.api.skills() : [], name = (x) => [x.id, `${x.n} (cấp ${x.lv})`];
    const opt = (k, none) => [[0, none], ...L.filter((x) => x.kind === k && !x.heal).map(name)];
    out.push(this._h("Đánh", "Con mới nhắm: ra lần lượt các bùa hại (bùa nào hết thì ra lại) rồi mới đánh."));
    out.push(this._row("Chiêu đánh:", this._s(D, "chieu", opt("attack", "theo ô tay trái"))));
    // đổi chiêu theo nội lực (anh 03/11 "dưới bao nhiêu % nội lực thì dùng chiêu nào … đánh thiên địa vô cực còn dưới 30% mana thì chuyển sang
    // đánh nhân kiếm hợp thể để hút mana, sau khi mana đến 1 mức nào đó lại quay sang đánh thiên địa vô cực") — vocong.js atkPlan
    out.push(this._tip(this._row(this._c(D.noi, "on"), "NL <", this._n(D.noi, "duoi", 1, 99, 28), "% đánh", this._s(D.noi, "id", [[0, "đòn thường"], ...L.filter((x) => x.kind === "attack").map(name)])),
      "Đang tự đánh mà nội lực dưới mức này thì đổi sang chiêu này (chiêu ít tốn nội lực, hoặc đòn thường khi vũ khí có dòng hút nội lực) tới khi nội lực hồi đủ mức dòng dưới rồi về chiêu đánh chính."));
    out.push(this._row(this._in(), "tới khi NL ≥", this._n(D.noi, "len", 2, 100, 28), "% thì về chiêu đánh chính"));
    // bùa hại: số dòng = số bùa hại phái đã học (1–3 — anh 26/10 "bùa hại nếu có trên 2"); anh 03/11 "bùa hại chọn mục tiêu (tất cả quái / người chơi /
    // tinh anh + thủ lĩnh + boss st + boss hoàng kim)" — dòng con "dùng lên" khi đã chọn bùa (world.js autoBuff — danh.haiMuc)
    const nHai = Math.max(1, Math.min(3, L.filter((x) => x.kind === "curse").length));
    const MUC = [["tat", "Tất cả quái"], ["db", "Tinh anh, thủ lĩnh, boss"], ["nguoi", "Người chơi (chưa có PK)", 1]];
    for (let i = 0; i < nHai; i++) {
      out.push(this._row(`Bùa hại ${i + 1}:`, this._s(D.hai, i, opt("curse", "không"), () => this.render())));
      if (D.hai[i]) out.push(this._tip(this._row(this._in(), "dùng lên", this._s(D.haiMuc, i, MUC)), "Tinh anh (tên xanh), thủ lĩnh (tên cam), Boss Sát thủ, Boss Hoàng Kim và boss khác (Vượt Ải…). Chọn mục này thì quái thường không bị ra bùa — đỡ tốn nội lực, đánh nhanh hơn"));
    }
    const nm = this._ngaMy();
    out.push(this._h("Hỗ trợ", nm ? "Bùa lợi còn dưới 3 giây thì dùng lại. Chọn 2–3 vòng sáng: đang tự đánh thì ô tay phải đổi vòng mỗi 0,5 giây; vòng vừa đổi còn tác dụng thêm 1 giây (Phật Tâm Từ Hữu 8 giây) như client nên giữ đủ các vòng đã chọn, cả cho đồng đội đứng gần."
      : "Bùa lợi còn dưới 3 giây thì dùng lại. Vòng sáng đặt vào ô tay phải (mỗi lúc 1 vòng sáng như client)."));
    // chiêu hồi máu (Nga My — Từ Hàng Phổ Độ): phái không có thì không hiện. Hồi máu đồng đội (anh 03/11 "cho nga mi tùy chọn buff máu khi dưới
    // bao nhiêu % cho đồng đội") — world.js buaDoi
    const heals = L.filter((x) => x.heal);
    if (heals.length) {
      if (!D.hoi.id) D.hoi.id = heals[0].id;
      out.push(this._row(this._c(D.hoi, "on"), "Hồi máu", this._s(D.hoi, "id", heals.map(name)), "khi SL <", this._n(D.hoi, "pct", 1, 99, 28), "%"));
      out.push(this._tip(this._row(this._c(D.hoiDoi, "on"), "Hồi máu đồng đội khi SL <", this._n(D.hoiDoi, "pct", 1, 99, 28), "%"),
        "Đồng đội cùng tổ đội, cùng bãi, đứng trong tầm chiêu mà sinh lực dưới mức này thì dùng chiêu hồi máu ở dòng trên lên người đó (mỗi người cách ít nhất 3 giây)."));
    }
    D.bua.forEach((_, i) => out.push(this._row(`Bùa lợi ${i + 1}:`, this._s(D.bua, i, opt("buff", "không")))));
    // Nga My: tối đa 3 vòng sáng xoay ở ô tay phải (anh 03/11 — world.js xoayVong); phái khác 1 vòng
    const doiVong = () => this.api.skillsChanged && this.api.skillsChanged();
    out.push(this._row(nm ? "Vòng sáng 1:" : "Vòng sáng:", this._s(D, "vong", opt("aura", "không đổi"), doiVong)));
    if (nm) (D.xoay = D.xoay || [0, 0]).forEach((_, i) => out.push(this._row(`Vòng sáng ${i + 2}:`, this._s(D.xoay, i, opt("aura", "không"), doiVong))));
    return out;
  }
  // ---------- PK (anh 06/11 — mẫu 1 "thanh xổ"; "hơi rối, làm đủ dùng … buff bùa lợi trước, xong bùa hại nếu cần hoặc không thì tự dùng kĩ năng bùa
  // hại. Sau đó là các chức năng cần thiết như bơm máu"; "bấm vào PK thì sẽ mặc định ở PK thôi, không lẫn lộn các hoạt động khác") ----------
  // Chỉ có tác dụng trong trận Tống Kim (world.js pk / pkChon / pkLui, main.js autoDrink + doiTick). Anh bỏ: né lửa, "bị 3 người đánh thì lui"
  _pk(A) {
    const K = A.pk, out = [], L = this.api.skills ? this.api.skills() : [], name = (x) => [x.id, `${x.n} (cấp ${x.lv})`];
    const ds = (k) => L.filter((x) => x.kind === k && !x.heal).map(name);
    const UU = [["gan", "Gần nhất"], ["mau", "Máu thấp nhất"], ["tra", "Kẻ đang đánh mình"], ["nguoi", "Người chơi trước"]];
    out.push(this._apDung(!!K.on, "Auto PK", () => { K.on = 1; }));
    out.push(this._g(K.on ? "Trong trận Tống Kim chỉ đánh phe kia theo thẻ này: không đánh quái, không nhặt đồ, không về thành, không làm nhiệm vụ, không tự mời / theo đội." : "Đang áp dụng thẻ Đánh quái: trong trận Tống Kim tự đánh theo thẻ Đánh quái. Ngoài trận thẻ này không có tác dụng."));
    out.push(this._h("Thứ tự ra chiêu", "Bùa lợi còn dưới 3 giây thì dùng lại → bùa hại lên mục tiêu (thiếu bùa nào thì ra bùa đó, thử lại sau 3 giây) → chiêu đánh"));
    const bua = [[0, "không"], ...ds("buff")];
    K.bua.forEach((_, i) => out.push(this._tip(this._row(i ? this._in() : "1. Bùa lợi:", this._s(K.bua, i, bua)), "Không chọn bùa nào: dùng bùa lợi đã chọn ở thẻ Kỹ năng")));
    out.push(this._row("2. Bùa hại:", this._s(K, "hai", [["tu", "Tự dùng bùa hại đã học"], ...ds("curse"), [0, "Không dùng"]], () => this.render())));
    // thêm 2 ô bùa hại (anh 12/11 "bùa hại thêm 2 ô nữa vào"): ô đầu chọn 1 bùa cụ thể thì ô 2, 3 chọn thêm bùa (ra lần lượt — world.js pkHai); ô đầu "Tự dùng" /
    // "Không dùng" thì 2 ô sau mờ, không dùng
    const tuDung = !K.hai || K.hai === "tu", haiThem = [[0, "không"], ...ds("curse")];
    for (const k of ["hai2", "hai3"]) {
      const s = this._s(K, k, haiThem); if (tuDung) Object.assign(s.style, { opacity: 0.45, pointerEvents: "none" }); // ô chọn của Trợ Thủ là span: chặn bấm
      out.push(this._tip(this._row(this._in(), s), tuDung ? "Chọn 1 bùa cụ thể ở ô đầu thì dùng thêm được ô này" : "Bùa hại thêm — ra lần lượt sau bùa ở ô đầu"));
    }
    out.push(this._row("3. Chiêu đánh:", this._s(K, "chieu", [[0, "như thẻ Kỹ năng"], ...ds("attack")])));
    out.push(this._tip(this._row("Ưu tiên:", this._s(K, "uu", UU), "phạm vi", this._n(K, "hd", 200, 1500, 40)),
      "Chọn mục tiêu phe kia trong phạm vi quanh nhân vật (không đánh người đang đứng trong doanh của họ). Kẻ đang đánh mình: không còn ai đánh thì gần nhất"));
    // anh 13/11 (lượt 86): "auto pk, thêm cái bỏ qua quái nhỏ (kim binh tống binh npc)" — world.js pkChon
    out.push(this._tip(this._row(this._c(K, "boBinh"), "Bỏ qua quân lính NPC (trừ Nguyên soái)"),
      "Tích: Auto PK chỉ đánh người chơi và tướng sĩ phe kia — không đánh Tống binh / Kim binh, Hiệu úy … Đại tướng NPC của trận. Nguyên soái vẫn đánh"));
    // anh 06/11 "auto PK thêm 1 ô tiếp cận để ng chơi chọn, thêm nút tích đồng bộ với phạm vi kĩ năng ở phần này" (auto.js pk.tiep / tiepTam — world.js
    // updateHero): tích = tới tầm chiêu mà đánh (ô Tiếp cận mờ, không dùng); bỏ tích = Tiếp cận như ô của thẻ Đánh quái (cùng đơn vị)
    const tp = this._tamPhai(); if (K.tiep > tp) { K.tiep = tp; this._save(); } // anh 16/11: Tiếp cận tối đa = tầm chiêu xa nhất của phái
    const tiep = this._n(K, "tiep", 0, tp, 40), moTiep = () => { tiep.disabled = !!K.tiepTam; tiep.style.opacity = K.tiepTam ? 0.45 : 1; };
    out.push(this._tip(this._row("Tiếp cận", tiep, this._c(K, "tiepTam", moTiep), "Theo phạm vi kỹ năng"),
      `Tích Theo phạm vi kỹ năng: đứng ở tầm chiêu đánh mà đánh (chiêu tầm xa thì đứng xa), ô Tiếp cận không dùng. Bỏ tích: chạy tới cách mục tiêu chừng này rồi mới ra chiêu (đơn vị như tầm chiêu, đánh tay không là 75). Tầm chiêu ngắn hơn thì theo tầm chiêu; 0 = đứng ở tầm chiêu mà đánh. Tối đa ${tp} (tầm chiêu xa nhất của môn phái). Đánh boss: phái tầm xa phải vào trong ${BOSS_TAM}`));
    moTiep();
    out.push(this._h("Bơm máu", "Dùng loại thuốc đã chọn ở thẻ Thuốc; lúc PK uống theo mức dưới đây"));
    out.push(this._row("SL <", this._n(K, "sl", 1, 99, 28), "% · NL <", this._n(K, "nl", 1, 99, 28), "% uống thuốc"));
    out.push(this._tip(this._row(this._c(K, "ve"), "SL <", this._n(K, "vePct", 1, 90, 28), "% về doanh, đủ", this._n(K, "ra", 10, 100, 28), "% ra lại"),
      "Sinh lực dưới mức thì thôi đánh, chạy về doanh phe mình (khu an toàn) uống thuốc / hồi tới mức sau rồi ra đánh tiếp"));
    return out;
  }
  _ngaMy() { const h = this.api.hero && this.api.hero(); return !!h && h.fac != null && ((this.api.P.factions || []).find((f) => f.id === +h.fac) || {}).key === "emei"; }
  // Tiếp cận tối đa (anh 16/11): tầm chiêu xa nhất của môn phái (vocong.js tamPhai — đơn vị client); chưa có World thì giữ trần cũ 2000
  _tamPhai() { const w = this.api.world && this.api.world(); return w && typeof w.tamPhai === "function" ? w.tamPhai() : 2000; }

  // ---------- Đánh quái: thẻ con Quái thường (tự đánh + bãi treo máy + tổ đội) / Boss Hoàng Kim / Phong Hỏa ----------
  _danh(A, h) {
    const [con, i] = this._con(["Quái thường", "Boss Hoàng Kim", "Phong Hỏa"]);
    return [con, ...(i === 2 ? this._ph(A, h) : i ? this._boss(A, h) : this._quai(A, h))];
  }
  // Phong Hỏa Liên Thành (anh 04/11 — "có thể cho 1 tùy chọn để auto train k bị ảnh hưởng đến quá trình phong hỏa liên thành"; Trợ Thủ không tự đi,
  // người chơi tự vào ở Vệ binh thành môn Biện Kinh): ở lại trận (ph.o — main.js onRested / phMuaTick)
  _ph(A) {
    const H = A.ph, l = this.api.phLich ? this.api.phLich() : null, out = [];
    out.push(this._h("Phong Hỏa Liên Thành", `${(l && l.gio) || "19:00"} mỗi ngày: báo danh ở Vệ binh thành môn Biện Kinh (đẳng cấp ${(l && l.cap) || 90}), giữ thành trước quân Tống. Người chơi tự vào trận — Trợ Thủ không tự đi.`));
    const pha = l && l.pha, t = l && (pha === "bd" ? l.kc : l.het), p = t ? Math.max(0, Math.ceil((t - Date.now()) / 60000)) : 0;
    out.push(this._g(pha === "bd" ? `Đang nhận báo danh — còn ${p} phút khai chiến` : pha === "danh" ? `Đang đánh — còn ${p} phút${l.mo ? " (còn vào được)" : ""}` : "Chưa tới giờ"));
    out.push(this._tip(this._row(this._c(H, "o"), "Đang ở trận: tự đánh ở lại trận"), "Trong trận Phong Hỏa: tự đánh chỉ đánh quân địch trong phạm vi bên dưới quanh chỗ nhân vật đang đứng — kéo nhân vật đi đâu đánh ở đó, quân tới gần mới đánh, không tự chạy đi chỗ khác. Trọng thương hồi sinh ở đại doanh thì đứng chờ (kéo ra trận để đánh tiếp); sắp hết thuốc (mức Treo máy) thì về Quân Nhu quan mua — không về bãi treo máy. Tắt: như ở bãi thường. Hết trận về Biện Kinh: bán / mua rồi về bãi treo máy"));
    // anh 04/11 lượt 25 ("chỉ tự đánh trong phạm vi 500-600 thôi"): phạm vi tự đánh ở hoạt động — Phong Hỏa + đứng gần Boss Hoàng Kim (world.js hdR)
    out.push(this._tip(this._row(this._in(), "Phạm vi đánh quanh nhân vật", this._n(A.danh, "hd", 200, 1500, 40)), "Dùng chung cho Phong Hỏa và lúc đứng gần Boss Hoàng Kim (mặc định 550 — cùng đơn vị với ô Quanh chỗ bật, phạm vi)"));
    return out;
  }
  _quai(A, h) {
    const D = A.danh, w = this.api.world(), out = [this._apDung(!A.pk.on, "Đánh quái", () => { A.pk.on = 0; })]; // anh 08/11 — trong trận Tống Kim đánh theo thẻ đang áp dụng
    out.push(this._h("Tự đánh", "Bật / tắt tự đánh: phím Space hoặc nút Tự đánh dưới bản đồ nhỏ."));
    const radio = (v, ...rest) => {
      const el = document.createElement("i"); el.className = "tt-o" + (D.cach === v ? " on" : ""); el.dataset.click = 1;
      el.onclick = () => { D.cach = v; this._save(); this.render(); };
      return this._row(el, ...rest);
    };
    out.push(this._tip(radio("kc", "Quanh chỗ bật, phạm vi", this._n(D, "kc", 0, 5000, 40)), "Phạm vi 0 = cả bãi"));
    const bai = D.td.bai != null && D.td.bai === (w && w.zone.id) ? w.zone.n : D.td.bai != null ? "bãi khác" : "chưa lấy";
    out.push(this._tip(radio("td", `Theo tọa độ (${bai}), tìm`, this._n(D, "tim", 50, 2000, 40)), "Đánh quái trong phạm vi tìm quanh từng tọa độ (tối đa 5) rồi sang tọa độ kế"));
    D.td.ds.forEach((p, i) => {
      const o = { x: p[0], y: p[1] };
      const nx = this._n(o, "x", 0, 9999, 34), ny = this._n(o, "y", 0, 9999, 34);
      nx.addEventListener("change", () => { p[0] = o.x; this._save(); }); ny.addEventListener("change", () => { p[1] = o.y; this._save(); });
      out.push(this._row(this._in(), `${i + 1}.`, nx, "/", ny, this._b("Xóa", () => { D.td.ds.splice(i, 1); this._save(); this.render(); })));
    });
    out.push(this._row(this._in(), this._b("Lấy tọa độ đang đứng", () => {
      const W = this.api.world(), P = this.api.P; if (!W || !P.hud.mmMap) return;
      if (D.td.bai !== W.zone.id) { D.td.bai = W.zone.id; D.td.ds = []; }
      if (D.td.ds.length >= 5) return this.api.msg("Tối đa 5 tọa độ");
      D.td.ds.push(P.hud.mmMap.toClient(W.player.x, W.player.y)); D.cach = "td"; this._save(); this.render();
    })));
    const uu = this._s(D, "uuTien", [["gan", "Gần nhất"], ["dacbiet", "Tinh anh / Thủ lĩnh / Boss"], ["nguoi", "Người chơi (chưa có PK)", 1]]);
    out.push(this._tip(this._row("Ưu tiên:", uu), "Tinh anh (tên xanh, ra sau mỗi 50 con) và thủ lĩnh (tên cam, sau mỗi 250 con)"));
    // ưu tiên đánh boss thế giới (danh.boss) -> thẻ con Boss Hoàng Kim (anh 03/11)
    // anh 03/11 "né boss sát thủ khi farm quái" (World.nearestMob / autoIdle — danh.neSat)
    out.push(this._tip(this._row(this._c(D, "neSat"), "Né Boss Sát thủ"), "Không đánh Boss Sát thủ (trừ boss nhiệm vụ của mình); đánh hết quái quanh boss thì tự sang chỗ khác"));
    out.push(this._row("Đổi mục tiêu sau", this._n(D, "doi", 2, 60, 28), "giây kẹt"));
    // anh 27/10: ô "Chạy sát quái rồi mới ra chiêu" -> Tiếp cận người chơi tự điền, mặc định 75 (đơn vị client — đánh tay không 75)
    const tp = this._tamPhai(); if (D.tiep > tp) { D.tiep = tp; this._save(); } // anh 16/11: Tiếp cận tối đa = tầm chiêu xa nhất của phái
    out.push(this._tip(this._row("Tiếp cận", this._n(D, "tiep", 0, tp, 40)), `Chạy tới cách quái chừng này rồi mới ra chiêu (đơn vị như tầm chiêu, đánh tay không là 75). Tầm chiêu ngắn hơn thì theo tầm chiêu; 0 = đứng ở tầm chiêu mà đánh. Tối đa ${tp} (tầm chiêu xa nhất của môn phái). Đánh boss (Hoàng Kim, Sát thủ, Vượt Ải, Viêm Đế, thủ lĩnh…): phái tầm xa phải vào trong ${BOSS_TAM} mới đánh được`));
    out.push(...this._bai(A, h), ...this._doi(A, h));
    return out;
  }
  // Boss Hoàng Kim (anh 03/11 "đánh quái chia ra thêm 1 tab dùng để đánh boss hoàng kim, đang đánh hết máu xong nó về mua rồi lên lại bãi, rất là bất
  // tiện"): ưu tiên đánh boss (danh.boss — World.nearestMob), không tự về thành gần boss (treo.boss — main.js treoTick), trọng thương / về thành thì
  // xong việc quay lại boss, boss xuất hiện tự đi đánh, boss chết về bãi treo máy (boss — main.js bossTick)
  _boss(A) {
    const D = A.danh, T = A.treo, B = A.boss, b = this.api.bossTg ? this.api.bossTg() : null, out = [];
    // giờ theo lịch sống (anh 05/11 — GM đổi ở F10 → Lịch hoạt động; chưa tải lịch thì giờ mặc định)
    const LB = ((this.api.lichHd && this.api.lichHd()) || { ds: [] }).ds.find((x) => x.id === "bossTg"), THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const gioB = LB && LB.gio.length ? LB.gio.join(", ") : "20:00", ngayB = LB && LB.thu ? " (" + LB.thu.map((d) => THU[d]).join(", ") + ")" : " mỗi ngày", songB = LB && LB.dai ? LB.dai : 120;
    const lichB = LB && !LB.bat ? "đang tạm dừng" : `${gioB}${ngayB}`;
    out.push(this._h("Boss Hoàng Kim", `Boss thế giới: ${lichB} xuất hiện ngoài cổng Ba Lăng huyện hoặc Biện Kinh, sống ${songB % 60 ? songB + " phút" : songB / 60 + " giờ"}. Đánh càng nhiều thưởng càng lớn.`));
    out.push(this._g(b && !b.ket ? `Đang có: ${b.ten} — ${b.tenBai}${b.noi ? " " + b.noi : ""} (${b.X}/${b.Y})` : `Chưa có boss — ${lichB}`));
    out.push(this._tip(this._row(this._c(D, "boss"), "Ưu tiên đánh boss khi đứng gần"), "Boss Hoàng Kim đứng gần mình (trong vùng đánh) thì đánh nó trước mọi con khác"));
    out.push(this._tip(this._row(this._in(), "Phạm vi đánh quanh nhân vật", this._n(D, "hd", 200, 1500, 40)), "Đứng gần boss: tự đánh chỉ đánh trong phạm vi này quanh chỗ nhân vật đang đứng — kéo nhân vật ra xa thì đứng chờ, không tự chạy lại (dùng chung với Phong Hỏa; mặc định 550)"));
    out.push(this._tip(this._row(this._c(T, "boss"), "Đang đánh boss: không tự về thành"), "Boss còn sống, đứng gần mình: không về thành vì túi, thuốc, độ bền hay sinh lực — vẫn tự uống thuốc. Boss chết / mình ra xa thì như cũ"));
    out.push(this._tip(this._row(this._c(B, "quay"), "Trọng thương / về thành: quay lại boss"), "Đang đánh boss mà bị hạ hoặc phải về thành: bán, mua, sửa xong thì đi lại tới chỗ boss (boss còn sống) — không về bãi treo máy"));
    out.push(this._tip(this._row(this._c(B, "tuDi"), "Boss xuất hiện thì tự đi đánh, từ cấp", this._n(B, "cap", 1, 200, 34)), "Đang tự đánh ở bãi luyện công mà boss xuất hiện: dùng Thổ Địa Phù về thành, bán / mua xong đi tới chỗ boss đánh"));
    out.push(this._tip(this._row(this._c(B, "veBai"), "Boss chết thì về bãi treo máy"), "Trợ Thủ đưa đi đánh boss (tự đi / quay lại): boss chết thì về thành bán / mua rồi đi Xa phu về chỗ cũ"));
    return out;
  }
  // dòng bản quái chung trong danh sách bãi treo máy (anh 03/11 chọn: chữ kiểu 2, màu xanh lá kiểu 3; null: như dòng thường)
  _tenChung(z, ten, pct) { return `${ten} · Quái chung +${pct}%`; }
  _mauChung() { return "#7cf07c"; }
  // bãi treo máy (anh 28/10 lần 4 "treo máy có thể để qua cùng với cái tự đánh" — trước ở thẻ Treo máy)
  _bai(A, h) {
    const T = A.treo, api = this.api, zs = api.farmZones(), out = [];
    out.push(this._h("Bãi treo máy", `Đi bằng Xa phu. Bật "Treo ở": về thành xong quay lại bãi này (không bật: về chỗ đã dùng Thổ Địa Phù). Bãi có dòng "Quái chung": đánh chung một bầy quái với người chơi khác, thêm ${api.qcPct()}% kinh nghiệm và ngân lượng.`));
    if (T.bai == null && zs.length) T.bai = (zs.find((z) => z.id === h.farmZone) || zs[0]).id;
    // mọi bãi Xa phu đi được — cả bãi phụ (anh 01/11 "xa phu đi được nhiều bãi mà auto không treo được"; bản trước chỉ bãi chính), xếp theo cấp như
    // danh sách cũ (bản có dòng nhóm "Cấp 70 – 80" anh chê xấu, sai ý — bỏ). Bãi chưa đủ cấp: hiện mà không chọn được (main.js moBai — anh 25/10).
    // Bãi có bản quái chung (anh 03/11 — main.js laQc): thêm dòng bản chung ngay sau dòng bãi đó; giá trị "c<mã>" -> T.bai + T.chung
    const ten = (z) => `${z.n} (${z.lo}–${z.hi})`, khoa = (z) => (api.moBai(z) ? "" : " — cần cấp " + api.capVao(z));
    const ds = zs.flatMap((z) => [[z.id, ten(z) + khoa(z), !api.moBai(z)], ...(api.coChung(z) ? [["c" + z.id, this._tenChung(z, ten(z), api.qcPct()) + khoa(z), !api.moBai(z), this._mauChung()]] : [])]);
    if (T.chung && !zs.some((z) => z.id === T.bai && api.coChung(z))) T.chung = 0;
    const chon = { v: T.chung ? "c" + T.bai : T.bai };
    const bai = this._s(chon, "v", ds, () => { const s = String(chon.v); T.chung = s[0] === "c" ? 1 : 0; T.bai = +s.replace("c", ""); this._save(); });
    // ô đóng rộng tới hết dòng (game.css .tt-s chỉ 170): tên bãi dài bị cắt trước chữ "· Quái chung" -> dòng riêng / chung của 1 bãi trông y hệt khi đóng
    // (soát 14/11 — "Trường Bạch sơn Nam (140–1…" cả 2 dòng, người chơi tưởng bãi 140–150 hết bản riêng; cũng 80–90, 120–130, 150–160, 190–200)
    bai.style.maxWidth = "240px";
    if (String(chon.v) !== String(T.chung ? "c" + T.bai : T.bai)) { const s = String(chon.v); T.chung = s[0] === "c" ? 1 : 0; T.bai = +s.replace("c", ""); } // bãi đã lưu không còn: dòng đầu
    out.push(this._row(this._c(T, "on"), "Treo ở", bai));
    // nút Ủy thác (anh 11/11 — main.js moUyThac, như Esc → Ủy thác): ở bãi thì rời game cho máy chủ cày thay, ở thành thì đưa ra bãi rồi tự ủy thác
    out.push(this._row(this._in(), this._b("Bắt đầu treo máy", () => { T.on = 1; this._save(); this.render(); api.treo(); }),
      this._tip(this._b("Ủy thác", () => { this.w.hide(); if (api.uyThac) api.uyThac(); }), "Rời game, máy chủ vẫn đánh quái thay bạn ở bãi luyện công (cần giờ Bạch Câu Hoàn) — như Esc → Ủy thác")));
    return out;
  }
  // tổ đội (anh 28/10 lần 4 — main.js doiTick / doiApply / theoCua, máy chủ may-chu/to-doi.js). Anh 04/11 bỏ nút "Mở khung Lập nhóm" (điện thoại mở
  // chồng lên Trợ Thủ — "xấu quá, có thể bỏ"): khung Lập nhóm mở bằng nút Tổ đội
  _doi(A, h) {
    const D = A.doi, api = this.api, t = api.doi ? api.doi() : null, w = api.world(), toi = h.name, out = [];
    out.push(this._h("Tổ đội", "Tự mời / theo sau / đánh cùng mục tiêu chạy khi đang tự đánh; tự vào đội lúc nào cũng chạy. Khung Lập nhóm: nút Tổ đội (điện thoại: Giang hồ → Tổ đội). Đồng đội cùng bãi đứng gần được chia kinh nghiệm như client; số người tối đa theo cấp thống soái của đội trưởng."));
    out.push(this._g(t ? `Đội của ${t.truong} — ${t.tv.length}/${t.toiDa || 8} người${t.truong === toi ? " (bạn là đội trưởng)" : ""} · thống soái cấp ${h.leadLv || 1}` : `Chưa có đội · thống soái cấp ${h.leadLv || 1}`));
    out.push(this._tip(this._row(this._c(D, "tuMoi"), "Tự mời người chơi xung quanh"), "Mỗi 3 giây mời 1 người chơi gần (cùng bãi) chưa có đội; mỗi người 1 phút mời 1 lần. Chưa có đội thì bạn lập đội, làm đội trưởng"));
    out.push(this._tip(this._row(this._in(), this._c(D, "truong"), "Luôn làm đội trưởng"), "Không tự vào đội người khác — có lời mời thì hiện khung hỏi"));
    out.push(this._tip(this._row(this._c(D, "tuVao"), "Tự vào đội khi được mời"), "Lúc đang tự đánh: chưa có đội (hoặc đội chỉ có mình) thì nhận lời mời ngay, không hỏi. Tự chơi thì luôn hiện khung hỏi"));
    // theo sau: chọn người — đội trưởng (mặc định), người trong đội, người chơi cùng bãi; người đã chọn mà không ở gần vẫn giữ
    const ds = [["", "Đội trưởng"]], co = new Set([""]);
    const them = (n, ghi) => { if (n && n !== toi && !co.has(n)) { co.add(n); ds.push([n, ghi ? `${n} (${ghi})` : n]); } };
    for (const x of t ? t.tv : []) them(x.ten, "đội");
    for (const o of w ? w.others.values() : []) them(o.name);
    them(D.theo.ten, "không ở gần");
    out.push(this._tip(this._row(this._c(D.theo, "on"), "Theo sau", this._s(D.theo, "ten", ds)), "Đứng sát người đó, người đó đi thì chạy theo ngay; đánh quái quanh người đó, đi xa quá thì bỏ quái chạy lại"));
    out.push(this._tip(this._row(this._c(D, "cungMuc"), "Đánh cùng mục tiêu với đội trưởng"), "Bãi quái chung (Lâm Du Quan…) / Vượt Ải: đánh đúng con đội trưởng đang đánh, đội trưởng đổi con thì đổi theo. Bãi quái riêng: con gần chỗ đội trưởng đang đánh nhất"));
    // bùa lợi lên đồng đội (anh 02/11 — world.js buaDoi): bùa chọn ở thẻ Kỹ năng mà client cho dùng lên người khác (skills.json target.ally)
    out.push(this._tip(this._row(this._c(D, "bua"), "Bùa lợi cho đồng đội"), "Bùa lợi đã chọn ở thẻ Kỹ năng mà dùng được lên người khác (Côn Lôn: Thanh Phong phù, Thiên Thanh Địa Trọc, Nhất Khí Tam Thanh; Thiếu Lâm: Bất Động Minh Vương) — dùng lên đồng đội đứng trong tầm khi họ chưa có hoặc sắp hết. Hồi máu đồng đội (Nga My: Từ Hàng Phổ Độ) bật riêng ở thẻ Kỹ năng"));
    return out;
  }

  // ---------- Nhặt đồ (anh 28/10 lần 4): tự nhặt + chỉ trang sức + lọc dòng thuộc tính + danh sách không nhặt (auto.js nhatMon) ----------
  _nhat(A) {
    const N = A.nhat, P = this.api.P, out = [];
    // anh 08/11 ("ngoài cái tự cấu hình ra, còn thêm 1 cái có thể bấm vào để auto có thể chuyển sang dạng nhặt tất cả rác sau đó về thành bán rác, rồi giữ lại những món đúng
    // dòng yêu cầu … tương tự cho 1 loại dùng để train và lọc đồ, thường sẽ hạn chế về thành, cắm map là chính trừ khi full rương hay hết máu"): auto.js nhatMon, main.js treoTick
    const KIEU = [["tu", "Tự cấu hình", "Nhặt theo các ô bên dưới, về thành theo thẻ Về thành."],
      ["rac", "Nhặt rác", "Nhặt hết trang bị rơi. Gần đầy túi thì về thành bán sạch; món đúng dòng đã tích ở Lọc dòng (chưa tích: đồ xanh đủ số dòng bên dưới) thì giữ lại, cất vào rương."],
      ["train", "Train lọc đồ", "Chỉ nhặt đồ xanh qua bộ lọc bên dưới, bỏ đồ trắng. Cắm bãi là chính: chỉ về thành khi đầy túi, hết thuốc sinh lực hoặc sinh lực thấp."]];
    const kieu = this._row("Kiểu:");
    for (const [v, t] of KIEU) { const b = this._b(t, () => { N.kieu = v; this._save(); this.render(); }); if (N.kieu === v) b.classList.add("on"); kieu.append(b); }
    out.push(this._h("Kiểu nhặt"), kieu, this._g(KIEU.find(([v]) => v === N.kieu)[2]), ...this._thamKhao(KIEU));
    out.push(this._h("Tự nhặt", "Đã mang đủ 60 bình thuốc (mọi loại) thì không nhặt thuốc nữa."));
    out.push(this._row(this._c(N, "on"), "Bật — phạm vi", this._n(N, "r", 50, 3000, 40)));
    out.push(this._row(this._c(N, "tien"), "Tiền", this._c(N, "thuoc"), "Thuốc", this._c(N, "trang"), "Đồ trắng"));
    out.push(this._row("Đồ xanh từ", this._s(N, "dong", [1, 2, 3, 4, 5, 6].map((d) => [d, d + " dòng"])), "trở lên"));
    out.push(this._tip(this._row(this._c(N, "trangSuc"), "Chỉ nhặt trang sức (nhẫn, dây chuyền, ngọc bội)"), "Trang bị khác (vũ khí, áo, mũ, giày, đai, hộ uyển…) không nhặt. Tiền, thuốc, đồ đặc biệt vẫn theo các ô ở trên"));
    out.push(this._h("Lọc dòng thuộc tính", "Bật: đồ xanh phải có ít nhất 1 dòng đã tích đạt mức (≥ số) mới nhặt — không khớp thì để lại trên đất. Chưa tích dòng nào = không lọc. Số mặc định ở khoảng giữa của dòng (dòng cấp 1–10), tự sửa được."));
    // anh 28/10 lần 5: thêm "Chọn hết" cạnh "Bỏ tích hết" cho dễ thao tác (3 nút xuống dòng riêng cho vừa bề ngang khung)
    out.push(this._row(this._c(N.loc, "on"), "Bật lọc"));
    out.push(this._row(this._in(),
      this._b("Chọn hết", () => { for (const v of Object.values(N.loc.ds)) v.on = 1; this._save(); this.render(); }),
      this._b("Bỏ tích hết", () => { for (const v of Object.values(N.loc.ds)) v.on = 0; this._save(); this.render(); }),
      this._b("Số mặc định", () => { for (const [k, n] of LOC_DONG) N.loc.ds[k].n = n; this._save(); this.render(); })));
    const T = (P.skillTip && P.skillTip.magic) || {};
    for (const [k] of LOC_DONG) {
      const v = N.loc.ds[k], txt = String(T[ItemDB.serDmg[k] || k] || k);
      const nhan = this._x(this._tenDong(k), "tt-l"); nhan.title = txt.replace(/#d1[+\-~]?/g, "…");
      out.push(this._row(this._c(v, "on"), nhan, ...(k === "indestructible_b" ? [] : ["≥", this._n(v, "n", 0, 9999, 34)])));
    }
    out.push(this._h("Không nhặt", "Món có tên chứa chữ này thì không nhặt (không phân biệt hoa thường), vd: Thổ Địa Phù, Kim Sang. Tối đa 30 tên."));
    const inp = document.createElement("input"); inp.className = "tt-n tt-t"; inp.maxLength = 40; inp.placeholder = "tên món…"; inp.spellcheck = false; inp.autocomplete = "off";
    const them = () => { const t = inp.value.trim(); if (!t) return; if (N.boQua.length >= 30) return this.api.msg("Tối đa 30 tên"); if (!N.boQua.includes(t)) N.boQua.push(t); this._save(); this.render(); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") them(); };
    out.push(this._row(inp, this._b("Thêm", them)));
    N.boQua.forEach((t, i) => out.push(this._row(this._in(), this._x(t, "tt-l"), this._b("Xóa", () => { N.boQua.splice(i, 1); this._save(); this.render(); }))));
    return out;
  }

  // tên dòng lọc = chữ client (settings\magicdesc.ini — tip.json magic; "kỹ năng hệ X" của vũ khí là sát thương nội công như ô xem đồ), rút gọn
  _tenDong(k) {
    const P = this.api.P, T = (P.skillTip && P.skillTip.magic) || {}, txt = String(T[ItemDB.serDmg[k] || k] || k);
    return txt.split(":")[0].replace(" - ngoại công", " (ngoại)").replace(" - nội công", " (nội)").replace(" mỗi nửa giây", "") + (txt.includes("%") ? " %" : "");
  }
  // ---------- Tham khảo cài đặt nhặt đồ của người khác (anh 09/11 chọn mẫu A, chỉ hiện người đã bấm Chia sẻ — may-chu/nhat-chia-se.js) ----------
  // this._ck = { ds: [{ ten, cap, fac, gio, nhat }] người khác, toi: lúc mình chia sẻ | null, ai: tên đang chọn, luc: lần tải gần nhất }. Mở thẻ thì tải (cách nhau ít nhất 20 giây); danh sách đổi mới vẽ lại
  _thamKhao(KIEU) {
    this._ckTai();
    const c = this._ck, out = [this._h("Tham khảo người khác")];
    if (c.ds.length) {
      const phai = (id) => { const f = (this.api.P.factions || []).find((x) => x.id === id); return f ? f.n.replace(/\s+phái$/i, "") : "Vô Môn"; };
      const chon = this._s(c, "ai", c.ds.map((x) => [x.ten, `${x.ten} · ${x.cap} ${phai(x.fac)}`]), () => this.render());
      Object.assign(chon.style, { flex: "0 1 auto", minWidth: "0" }); // tên dài: co lại, hiện "…", nút Áp dụng không bị đẩy ra ngoài khung
      out.push(this._row("Của:", chon, this._b("Áp dụng", () => this._ckApDung())), this._g(this._ckTomTat(c.ds.find((x) => x.ten === c.ai), KIEU)));
    } else out.push(this._g("Chưa có ai khác chia sẻ cài đặt."));
    out.push(this._row(this._b("Chia sẻ cài đặt của tôi", () => this._ckLam({ viec: "chiaSe", nhat: this.api.hero().auto.nhat }, "Trợ Thủ: đã chia sẻ cài đặt nhặt đồ của bạn")),
      this._x(c.toi ? `Đã chia sẻ ${c.toi}` : "Chưa chia sẻ"), ...(c.toi ? [this._b("Gỡ", () => this._ckLam({ viec: "go" }, "Trợ Thủ: đã gỡ bản chia sẻ của bạn"))] : [])));
    return out;
  }
  _ckTomTat(x, KIEU) {
    const N = chuanNhat(x.nhat), tich = N.loc.on ? Object.entries(N.loc.ds).filter(([, v]) => v.on) : []; // đúng những gì Áp dụng sẽ nhận
    const loc = tich.length ? `lọc ${tich.length} dòng: ${tich.slice(0, 3).map(([k, v]) => this._tenDong(k) + (k === "indestructible_b" ? "" : ` ≥ ${v.n}`)).join(", ")}${tich.length > 3 ? " …" : ""}` : "không lọc dòng";
    return `${KIEU.find(([v]) => v === N.kieu)[1]} · đồ xanh từ ${N.dong} dòng · ${loc} · chia sẻ ${x.gio}`;
  }
  _ckGoi(b) {
    const c = this._ck;
    return this.api.net.nhatChiaSe(this.api.hero().slot | 0, b).then((j) => {
      const cu = JSON.stringify([c.ds, c.toi]);
      c.ds = j.ds || []; c.toi = j.toi || null;
      if (cu !== JSON.stringify([c.ds, c.toi]) && this.w.visible && this.tab === TAB_NHAT) this.render();
    });
  }
  _ckTai() {
    const c = this._ck || (this._ck = { ds: [], toi: null, ai: "", luc: -1e9 });
    if (performance.now() - c.luc < 20000) return;
    c.luc = performance.now(); // ghi trước khi gọi: lỗi mạng cũng không gọi lại liên tục
    this._ckGoi({ viec: "ds" }).catch(() => {});
  }
  _ckLam(b, xong) { this._ckGoi(b).then(() => this.api.msg(xong)).catch((e) => { if (e.ma !== "het-phien") this.api.msg(e.message); }); }
  async _ckApDung() {
    const c = this._ck, x = c.ds.find((n) => n.ten === c.ai); if (!x) return;
    // font của hộp hỏi vẽ sai chữ hoa có dấu ("Á" thành "ế") nên câu hỏi không mở đầu bằng "Áp dụng"
    if (!(await this.api.hoi(`Dùng cài đặt nhặt đồ của <color=yellow>${x.ten}<color>?<enter>Cài đặt nhặt đồ hiện tại của bạn sẽ bị thay thế.`))) return;
    Object.assign(this.api.hero().auto.nhat, chuanNhat(x.nhat));
    this._save(); this.render(); this.api.msg(`Trợ Thủ: đã áp dụng cài đặt nhặt đồ của ${x.ten}`);
  }

  // ---------- Về thành: mọi điều kiện tự về thành, việc ở thành ----------
  _ve(A, h) {
    const T = A.treo, api = this.api, out = [];
    out.push(this._h("Tự về thành khi", "Khi đang tự đánh ở bãi luyện công (không cần bật Treo máy). Về bằng Thổ Địa Phù, xong việc ở thành đi Xa phu về chỗ cũ. Ra thành mà vẫn không đỡ (không bán được, hết tiền) thì thôi về vì lý do đó tới khi khá lên."));
    out.push(this._row(this._c(A.veThanh, "on"), "Sinh lực <", this._n(A.veThanh, "pct", 1, 90, 28), "% (về dưỡng sức)"));
    // "Đang đánh boss thế giới: không tự về thành" (treo.boss — anh 31/10) -> thẻ Đánh quái → Boss Hoàng Kim (anh 03/11)
    // anh 08/11 ("cái chỗ về thành khi còn mấy ô đang lỗi, nó đếm ô tổng"): xét chỗ trống thật cho 1 món to (main.js conChoMon)
    out.push(this._tip(this._row(this._c(T, "tuiOn"), "Hành trang hết chỗ cho món", this._s(T, "oMon", [[6, "6 ô"], [8, "8 ô"]])), "Tính theo chỗ trống thật trong hành trang: không còn ô trống liền nhau đủ đặt 1 món 6 ô (2 × 3) hoặc 8 ô (2 × 4) thì dùng Thổ Địa Phù về thành. Kiểu Nhặt rác / Train lọc đồ (thẻ Nhặt đồ) luôn về khi hết chỗ, dù không tích ô này"));
    out.push(this._row(this._c(T, "thuocOn"), "Thuốc sinh lực còn ≤", this._n(T, "thuoc", 0, 300, 34), "bình"));
    out.push(this._row(this._c(T, "nlOn"), "Thuốc nội lực còn ≤", this._n(T, "nl", 0, 300, 34), "bình"));
    out.push(this._tip(this._row(this._c(T.sua, "on"), "Độ bền trang bị ≤", this._n(T.sua, "pct", 1, 90, 28), "%"), "Vũ khí hao khi ra đòn; mũ, áo, đai, bao tay khi bị đánh trúng; giày khi đi. Trang sức không hao."));
    out.push(this._h("Ở thành", "Túi mang tối đa 60 bình thuốc mọi loại — dòng mua trên mua trước. Thổ Địa Phù không tính vào 60 bình."));
    // anh 03/11 "chỗ về thành cho chọn nơi lưu rương (ba lăng - biện kinh)": thành Trợ Thủ về — Thổ Địa Phù đưa về đó, bán / sửa / mua / cất rương ở đó
    // (main.js shopTown; rương chứa đồ dùng chung mọi thành)
    const thanh = [[53, "Ba Lăng huyện"], [37, "Biện Kinh"]].filter(([z]) => this.api.coBai ? this.api.coBai(z) : true);
    if (thanh.length > 1) out.push(this._tip(this._row("Về thành:", this._s(T, "thanh", thanh)), "Thổ Địa Phù đưa về thành này; bán đồ, sửa, mua thuốc, cất đồ / tiền vào rương ở đây (rương chứa đồ dùng chung mọi thành). Trọng thương lúc tự đánh cũng về thành này"));
    const loc = { n: h.locDo | 0 };
    const sel = this._s(loc, "n", [[0, "tắt"], [1, "đồ trắng"], [2, "dưới 2 dòng"], [3, "dưới 3 dòng"], [4, "dưới 4 dòng"]], () => api.doItem({ act: "loc", n: loc.n }));
    out.push(this._row(this._c(T, "ban"), "Bán đồ trong túi:", sel));
    // anh 31/10 "đồ nào phù hợp bộ lọc không bán thì chạy tới rương cất vào rương chứa đồ" (main.js treoTick bước ruong — máy chủ act catDo)
    out.push(this._tip(this._row(this._c(T, "catDo"), "Cất đồ giữ lại vào rương"), "Bán xong: món đủ dòng theo mức trên (không bán) — chạy tới Rương chứa đồ cất vào rương chính, đầy thì rương mở rộng"));
    out.push(this._tip(this._row(this._c(T.sua, "thanh"), "Sửa trang bị"), "Đồ đang mặc trước rồi đồ trong túi; đủ tiền món nào sửa món đó"));
    const thuoc = (ItemDB.shops[39] || []).map((k) => [k, ItemDB.item(k).n]);
    for (const m of T.mua) out.push(this._row(this._c(m, "on"), "Mua", this._s(m, "k", thuoc), "đủ", this._n(m, "n", 1, 60, 34)));
    out.push(this._row(this._c(T.phu, "on"), "Mua Thổ Địa Phù đủ", this._n(T.phu, "n", 1, 60, 34), "tấm"));
    // anh 28/10 lần 4 "cất hết tiền vào rương, chỉ để 1 số tiền nhất định khi treo máy, mặc định 10 vạn" (máy chủ do.js act thanh — b.cat)
    out.push(this._tip(this._row(this._c(T.cat, "on"), "Cất tiền vào rương, giữ lại", this._n(T.cat, "giu", 0, 2e9, 70), "lượng"),
      "Bán / sửa / mua xong: tiền trên người quá số này thì cất phần dư vào rương chính (mặc định 10 vạn = 100000)"));
    return out;
  }

  // ---------- Tiện ích (anh 03/11 "thêm 1 tab mới tiện ích, trong đó chia làm 2"): Ngũ hành / Nhiệm vụ ngày ----------
  _tienIch(A, h) {
    const [con, i] = this._con(["Nhiệm vụ ngày", "Tra cứu"]); // Ngũ hành chuyển sang Hướng dẫn hoạt động (anh 08/11 — nguHanhDom)
    return [con, ...(i ? this._traCuu() : this._nvNgay(A, h))];
  }
  // Tra cứu (anh 05/11 — "tab tiện ích: làm 1 phần đầy đủ chi tiết về các hoạt động, rơi gì, tỉ lệ bao nhiêu; rương mở ra gì, tỉ lệ ntn, kiếm ở đâu"):
  // tìm nhanh (bỏ dấu) trong dữ liệu Tra cứu của khung Hướng dẫn hoạt động (may-chu/tra-cuu.js) — bấm 1 kết quả / "Mở bảng tra cứu" mở bảng lớn
  _traCuu() {
    const out = [], api = this.api, TC = api.traCuu && api.traCuu();
    const bd = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
    out.push(this._h("Tra cứu", "Rương mở ra gì, quái rơi gì, tỉ lệ bao nhiêu, món có từ đâu, thưởng từng hoạt động — bảng đầy đủ ở khung Hướng dẫn hoạt động (nút cờ ở cột icon)."));
    const o = document.createElement("div"); o.className = "tt-tim";
    o.innerHTML = `<input maxlength="40" spellcheck="false" placeholder="Tìm: rương, món, hoạt động…" value="${esc(this.tcTim || "")}">`;
    const kq = document.createElement("div"); kq.className = "tt-tckq";
    const ve = () => {
      if (!TC) { kq.innerHTML = `<div class="tt-g">Đang tải dữ liệu tra cứu…</div>`; return; }
      const q = bd((this.tcTim || "").trim()), tu = q.split(/\s+/).filter(Boolean), N = TC.nhom || [];
      if (!tu.length) { kq.innerHTML = N.map((g) => `<div class="tt-tcm" data-n="${esc(g.id)}"><b>${esc(g.ten)}</b><em>${g.muc.length} mục</em></div>`).join(""); return; }
      const ds = N.flatMap((g) => g.muc.filter((m) => { const s = bd(m.ten + " " + (m.tom || "") + " " + (m.tim || "")); return tu.every((t) => s.includes(t)); }).map((m) => [g, m]));
      kq.innerHTML = ds.length ? ds.slice(0, 30).map(([g, m]) => `<div class="tt-tcm" data-m="${esc(m.id)}"><b>${esc(m.ten)}</b><em>${esc(g.ten)}${m.tom ? " · " + esc(String(m.tom).replace(/<\/?[ygc]>/g, "")) : ""}</em></div>`).join("") +
        (ds.length > 30 ? `<div class="tt-g">… còn ${ds.length - 30} mục — mở bảng tra cứu để xem hết</div>` : "") : `<div class="tt-g">Không thấy mục nào khớp</div>`;
    };
    o.firstChild.addEventListener("input", (e) => { this.tcTim = e.target.value; ve(); });
    kq.addEventListener("click", (e) => {
      const t = e.target.closest("[data-m],[data-n]"); if (!t || !TC) return; api.P.audio.ui("click");
      if (t.dataset.m) return api.moTraCuu(t.dataset.m, "");
      const g = (TC.nhom || []).find((x) => x.id === t.dataset.n); if (g && g.muc[0]) api.moTraCuu(g.muc[0].id, "");
    });
    if (!TC && api.layTraCuu) api.layTraCuu();
    ve();
    out.push(o, this._row(this._b("Mở bảng tra cứu", () => api.moTraCuu(null, this.tcTim || ""))), kq);
    return out;
  }
  // Ngũ hành (anh 03/11: "chỉ cho cách người chơi mang đồ ngũ hành, giao diện như trang bị nhân vật, người chơi sẽ chọn hệ vũ khí, sau đó hệ thống sẽ tự
  // điền các ô khác, trang bị cần hệ gì" — anh xem 3 bản, chọn bản 1 khung trang bị): nút chọn hệ vũ khí (mặc định hệ vũ khí đang cầm — gạch chân), nền
  // trang Trang bị của client (nam / nữ — ô in sẵn tên) với chữ hệ cần đặt cạnh từng ô như ảnh anh gửi (cột trái: bên trái ô; cột giữa, cột phải: bên phải
  // ô) — hệ cần mỗi ô: heCacO (bảng kích của game); cắt dòng Tên / PK trên đầu và hàng dưới (mặt nạ, phi phong, ấn — không kích dòng ẩn); dòng cuối: hệ
  // được ngũ hành nhân vật kích thêm 1 dòng
  _nguHanh(A, h) {
    const E = h.equip || {}, vk = E.Weapon && E.Weapon.s != null ? E.Weapon.s : null, w = A.nh.he >= 0 ? A.nh.he : vk ?? 0, he = heCacO(w), out = [];
    // chữ gợi ý chỉ ở nhãn, ngắn (anh 03/11 "cái này hơi vướng": bản đầu gắn cả hàng — rê chuột lên nút hệ là khung gợi ý 6 dòng che mất hình)
    const r = this._row(this._tip(Object.assign(document.createElement("span"), { textContent: "Vũ khí hệ:" }), "Các ô hiện hệ cần mặc để kích đủ dòng ẩn. Hệ gạch chân: vũ khí đang cầm."));
    HE.forEach((t, i) => {
      const b = document.createElement("span"); b.className = "tt-he" + (i === w ? " on" : "") + (i === vk ? " cam" : ""); b.textContent = t; b.style.color = HE_MAU[i]; b.dataset.click = 1;
      b.onclick = () => { A.nh.he = i; this._save(); this.api.P.audio.ui("click"); this.render(); };
      r.append(b);
    });
    out.push(r);
    const S = this.W.M.status.pages.equip.sec, nen = S[h.sex === "f" ? "Female" : "Male"], W0 = 296, k = W0 / nen.img.w, Y0 = 44, cao = Math.round((296 - Y0) * k);
    const d = document.createElement("div"); d.className = "tt-nh1";
    Object.assign(d.style, { height: cao + "px", backgroundImage: `url(assets/ui/win/${nen.img.file})`, backgroundSize: `${W0}px auto`, backgroundPosition: `0 ${-Math.round(Y0 * k)}px` });
    for (const o of Object.keys(TEN_O)) {
      const s = S[o], l = document.createElement("b"); if (!s) continue;
      l.textContent = HE[he[o]].toUpperCase(); l.style.color = HE_MAU[he[o]];
      Object.assign(l.style, s.x < 100 ? { right: Math.round(W0 - s.x * k + 3) + "px" } : { left: Math.round((s.x + s.w) * k + 3) + "px" }, { top: Math.round((s.y - Y0 + s.h / 2) * k - 8) + "px" });
      d.append(l);
    }
    out.push(d);
    const sh = h.series != null ? SINH[h.series] : null;
    if (sh != null) out.push(this._g(`Nhân vật hệ ${HE[h.series]}: món hệ ${HE[sh]} kích thêm 1 dòng ẩn`));
    return out;
  }

  // Nhiệm vụ ngày (anh 03/11: "tiện ích tự hoàn thành dã tẩu trong ngày, tự săn sát thủ, phí mỗi lần hoàn thành 40 nv là 10 xu, hoàn thành sát thủ toàn
  // bộ 5 xu, mở khóa xong là dc dùng trong ngày, ngắt quãng cũng k sao … auto tự làm tự mua các item cần thiết và hoàn thành nhiệm vụ, boss sát thủ thì
  // chọn loại bằng cấp nhân vật") — src/game/tulam.js chạy, máy chủ may-chu/tu-lam.js mở khóa / làm từng bước
  _nvNgay(A, h) {
    const api = this.api, L = A.tuLam, t = (api.tl && api.tl()) || { dt: 0, st: 0, gia: { dt: 10, st: 5 } }, dc = h.dtc || {}, S = h.satThu || {}, out = [];
    out.push(this._h("Dã Tẩu", "Trợ Thủ tự nhận nhiệm vụ, tự mua món ở sạp Hệ thống của Chợ Trời (5–8 vạn mỗi món), tự đi đánh quái cho nhiệm vụ thu thập địa đồ / kinh nghiệm / Sơn Hà Xã Tắc, về gặp Dã Tẩu trả nhiệm vụ, chọn thưởng — tới đủ 40 nhiệm vụ trong ngày. Mở khóa 1 lần dùng cả ngày (tắt, thoát game giữa chừng vẫn còn)."));
    out.push(t.dt ? this._row(this._x(`Đã mở khóa hôm nay · xong ${dc.xongNgay | 0}/${dc.gioiHan || 40} nhiệm vụ`)) : this._row(this._b(`Mở khóa hôm nay — ${t.gia.dt} Xu`, () => api.moTl("dt")), this._x(`có ${h.xu | 0} Xu`)));
    const nut = (loai) => (t[loai] && api.tlNut ? [this._b(api.tlChay(loai) ? "Dừng" : "Bắt đầu", () => api.tlNut(loai))] : []); // Bắt đầu / Dừng riêng (anh 08/11 — tulam.js nut)
    out.push(this._row(this._c(L.dt, "on", () => this.render()), "Tự làm Dã Tẩu", ...nut("dt")));
    out.push(this._row(this._in(), "Chọn thưởng:", this._s(L.dt, "thuong", [["kn", "Kinh nghiệm"], ["vat", "Vật phẩm"], ["tien", "Tiền"]])));
    out.push(this._tip(this._row(this._in(), "Lấy cơ hội hủy khi còn dưới", this._n(L.dt, "giuHuy", 0, 10, 28), "lần"), "Trong 3 ô thưởng có ô cơ hội hủy bỏ nhiệm vụ mà số cơ hội hủy đang có ít hơn số này thì chọn ô đó (0 = không lấy)"));
    out.push(this._tip(this._row(this._in(), this._c(L.dt, "gian"), "Nộp Sát Thủ Giản trong túi khi được đòi"), "Không bật: nhiệm vụ đòi Sát Thủ Giản thì hủy như nhiệm vụ không làm được"));
    // anh 10/11: "trợ lý khi bị kẹt không được dùng mảnh để hủy, có thể dùng mảnh để hoàn thành, cấm hủy mất chuỗi" — bỏ lựa chọn "Hủy, làm lại chuỗi"
    out.push(this._tip(this._row(this._in(), "Không làm được: không bao giờ hủy mất chuỗi"),
      "Nhiệm vụ đòi món sạp Hệ thống không bán: đầu chuỗi thì đổi nhiệm vụ, còn cơ hội hủy thì dùng, đủ mảnh Sơn Hà Xã Tắc thì nộp mảnh để xong ngay (số mảnh như ở hội thoại Dã Tẩu; nhiệm vụ nộp mảnh Sơn Hà thì không). Hết cả: Trợ Thủ thôi làm Dã Tẩu, báo để bạn tự xử lý — không hủy bằng mảnh, không hủy làm lại chuỗi."));
    out.push(this._h("Boss Sát thủ", "Trợ Thủ về Ba Lăng huyện nhận nhiệm vụ ở Nhiếp Thí Trần (bậc đúng cấp nhân vật), đi Xa phu tới bản đồ có boss, hạ boss rồi về nhận tiếp — tới đủ 8 boss trong ngày. Bị hạ 3 lần ở cùng 1 boss thì thôi săn sát thủ hôm đó."));
    out.push(t.st ? this._row(this._x(`Đã mở khóa hôm nay · đã hạ ${S.dem | 0}/${S.toiDa || 8} boss`)) : this._row(this._b(`Mở khóa hôm nay — ${t.gia.st} Xu`, () => api.moTl("st")), this._x(`có ${h.xu | 0} Xu`)));
    out.push(this._row(this._c(L.st, "on", () => this.render()), "Tự săn Boss Sát thủ", ...nut("st")));
    const dang = api.tlDang ? api.tlDang() : "";
    if (dang) out.push(this._g(dang));
    return out;
  }

  // ---------- Khác: (điện thoại dọc) cách di chuyển, hiển thị, bảo vệ, bố cục màn hình ----------
  _khac(A) {
    const P = this.api.P, S = P.settings, D = this.api.dt && this.api.dt(), out = [];
    // anh 29/10: "cài đặt nút joystick để di chuyển bằng cách kéo … chọn chạm hoặc joystick trong phần Khác" — nhớ ở máy này (dienthoai.js datCan)
    if (D && D.on) {
      out.push(this._h("Điện thoại", "Cần điều khiển: vùng dưới bên trái phần cảnh, kéo để chạy, thả là đứng; không dùng thì mờ đi. Chạm đất để chạy vẫn dùng được. Nút khóa cạnh ô kỹ năng: khóa = chạm ô để dùng, kéo chiêu để ngắm; mở = chạm ô để gắn chiêu / thuốc, kéo để đổi chỗ / gỡ"));
      const chon = (v, chu) => {
        const el = document.createElement("i"); el.className = "tt-o" + (D.can === v ? " on" : ""); el.dataset.click = 1;
        el.onclick = () => { D.datCan(v); P.audio.ui("click"); this.render(); };
        return this._row(el, chu);
      };
      out.push(chon(true, "Di chuyển bằng cần điều khiển (kéo)"), chon(false, "Di chuyển bằng chạm đất"));
      // anh 31/10 "thêm cài đặt khóa hoặc không khóa cái joystick" (dienthoai.js datCanKhoa)
      if (D.can) {
        const k = document.createElement("i"); k.className = "tt-o" + (D.canKhoa ? " on" : ""); k.dataset.click = 1;
        k.onclick = () => { D.datCanKhoa(!D.canKhoa); P.audio.ui("click"); this.render(); };
        out.push(this._tip(this._row(k, "Khóa vị trí cần điều khiển"), "Khóa: cần đứng yên giữa vùng dưới bên trái, chạm trong vòng mới chạy. Không khóa: chạm chỗ nào trong vùng thì cần hiện ở đó"));
        // cỡ cần (anh 01/11 "cho phép phóng to thu nhỏ joystick" — dienthoai.js datCanCo)
        const cc = (v) => { const el = document.createElement("i"); el.className = "tt-o" + (Math.abs((D.canCo || 1) - v) < 0.01 ? " on" : ""); el.dataset.click = 1; el.onclick = () => { D.datCanCo(v); P.audio.ui("click"); this.render(); }; return el; };
        out.push(this._row("Cỡ cần:", ...[0.8, 1, 1.2, 1.4, 1.6].flatMap((v) => [cc(v), Math.round(v * 100) + "%"])));
      }
      // anh 30/10 lần 3: "giao diện nhỏ hơn như kiểu zoom, bé hơn 10–20%" — cả màn (nút, cửa sổ, cảnh) nhỏ đều; dọc và ngang (dienthoai.js datCo).
      // Máy tính kéo cửa sổ hẹp (D.mt): không có — trình duyệt máy tính bỏ qua viewport, cỡ theo phóng to của trình duyệt (Ctrl + / −)
      if (!D.mt) {
        out.push(this._h("Cỡ giao diện", "Nhỏ hơn: thấy cảnh rộng hơn, nút và chữ nhỏ lại. Nhớ ở máy này"));
        const co = (v, chu) => {
          const el = document.createElement("i"); el.className = "tt-o" + (D.co === v ? " on" : ""); el.dataset.click = 1;
          el.onclick = () => { D.datCo(v); P.audio.ui("click"); this.render(); };
          return this._row(el, chu);
        };
        out.push(co(1, "100% (như cũ)"), co(0.9, "90%"), co(0.85, "85%"), co(0.8, "80%"));
      }
      // anh 30/10 lần 2: "black shark cũ thấy game trên web mobile khá hao pin và nóng máy"; 31/10: "máy mạnh thì không giới hạn, mặc định 60"
      // (dienthoai.js datKhung, main.js loop)
      out.push(this._h("Khung hình", "Số lần vẽ cảnh mỗi giây. 30: đỡ hao pin, đỡ nóng máy (trận đấu vẫn tính đủ). 60: mặc định. Không giới hạn: theo màn hình (90–144 Hz), máy mạnh mượt nhất. Nhớ ở máy này"));
      const kh = (v, chu) => {
        const el = document.createElement("i"); el.className = "tt-o" + (D.khung === v ? " on" : ""); el.dataset.click = 1;
        el.onclick = () => { D.datKhung(v); P.audio.ui("click"); this.render(); };
        return this._row(el, chu);
      };
      out.push(kh(30, "30 khung / giây (tiết kiệm pin)"), kh(60, "60 khung / giây (mặc định)"), kh(0, "Không giới hạn (máy mạnh)"));
      // anh 31/10: "bật 144 Hz trên Black Shark mà game chỉ 60–61" — số lần trình duyệt gọi vẽ mỗi giây đo được (main.js loop, trước giới hạn khung):
      // ~60 là trình duyệt / máy đang giữ 60, chọn Không giới hạn cũng không hơn được
      const hz = this.api.hz ? this.api.hz() : 0;
      if (hz) out.push(this._row(this._in(), this._x(`Máy đang cho vẽ tối đa ~${hz} lần / giây`)));
      if (hz && hz <= 65) out.push(this._g("Màn 90–144 Hz mà vẫn ~60: trình duyệt hoặc máy đang giữ 60 — xem Cài đặt → Màn hình (tần số quét cho mọi ứng dụng), tắt tiết kiệm pin, ứng dụng game của máy (thêm trình duyệt vào danh sách)"));
    }
    // cửa sổ không đang dùng (anh 03/11 "treo có 1 con tụt fps" — main.js khungNen): máy tính treo nhiều cửa sổ; điện thoại thật chỉ 1 trang
    if (this.api.khungNen && (!D || !D.on || D.mt)) {
      out.push(this._h("Cửa sổ không đang dùng", "Treo nhiều cửa sổ trên 1 máy: cửa sổ không đang bấm vào chỉ vẽ ít khung để nhường máy cho cửa sổ đang dùng (đỡ tụt khung). Tự đánh, nhặt đồ, về thành vẫn chạy đủ. Nhớ ở máy này"));
      const kn = (v, chu) => {
        const el = document.createElement("i"); el.className = "tt-o" + (this.api.khungNen() === v ? " on" : ""); el.dataset.click = 1;
        el.onclick = () => { this.api.datKhungNen(v); P.audio.ui("click"); this.render(); };
        return this._row(el, chu);
      };
      out.push(kn(20, "20 khung / giây (mặc định)"), kn(10, "10 khung / giây (nhẹ máy nhất)"), kn(0, "Như cửa sổ đang dùng"));
    }
    // Chuyển đổi giao diện Kiếm hiệp hiện đại / Cổ điển (mặc định: Hiện đại, nhớ theo máy)
    out.push(this._h("Giao diện", "Kiếm hiệp hiện đại (mặc định): khung kính tối viền vàng kim sắc nét cho cả máy tính và điện thoại. Cổ điển: giao diện Võ Lâm PC gốc. Nhớ ở máy này"));
    const curUi = getUiTheme();
    const uiChon = (v, chu) => {
      const el = document.createElement("i"); el.className = "tt-o" + (curUi === v ? " on" : ""); el.dataset.click = 1;
      el.onclick = () => { setUiTheme(v); P.audio.ui("click"); this.render(); };
      return this._row(el, chu);
    };
    out.push(uiChon("modern", "Kiếm hiệp hiện đại (mặc định)"), uiChon("classic", "Cổ điển (Võ Lâm PC gốc)"));
    out.push(this._h("Hiển thị"));
    const set = { name: S.showName !== false ? 1 : 0, life: S.showLife ? 1 : 0 };
    out.push(this._row(this._c(A.hien, "tenVat"), "Tên vật phẩm trên đất"));
    out.push(this._row(this._c(set, "name", () => { S.showName = !!set.name; this.api.saveSettings(); }), "Tên nhân vật (F7)"));
    out.push(this._row(this._c(set, "life", () => { S.showLife = !!set.life; this.api.saveSettings(); }), "Thanh sinh lực (F8)"));
    // anh 31/10 "cho người khác thấy hiệu ứng của người chơi khác khi đánh boss, có thể tắt bật trong Trợ Thủ nếu máy yếu, lag" (main.js chieuAo)
    set.hu = S.hieuUngNguoi !== false ? 1 : 0;
    out.push(this._tip(this._row(this._c(set, "hu", () => { S.hieuUngNguoi = !!set.hu; this.api.saveSettings(); }), "Hiệu ứng chiêu của người khác"), "Thấy chiêu người chơi khác cùng bãi ra (đạn bay, nổ). Máy yếu, giật thì tắt đi"));
    // anh 11/11 (người chơi: "về Tân Thủ Thôn lag quá", "ẩn được sạp hàng không"): ẩn bớt người chơi khác / sạp hàng cho đỡ giật — chỉ máy này
    // (P.settings — world.js nguoiHien, anSap)
    const nh = { v: S.nguoiHien >= 0 ? S.nguoiHien : -1 };
    const nhS = this._s(nh, "v", [[-1, "Hiện tất cả"], [30, "30 người gần nhất"], [20, "20 người gần nhất"], [10, "10 người gần nhất"], [5, "5 người gần nhất"], [0, "Ẩn hết"]], () => { S.nguoiHien = +nh.v; this.api.saveSettings(); });
    out.push(this._tip(this._row("Người chơi khác:", nhS), "Chỗ đông người (Tân Thủ Thôn, thành) bị giật thì hiện bớt: chỉ vẽ chừng ấy người gần mình nhất. Đồng đội và người đang nhắm luôn hiện; trận Tống Kim luôn hiện đủ. Nhớ ở máy này"));
    set.sap = S.anSap ? 1 : 0;
    out.push(this._tip(this._row(this._c(set, "sap", () => { S.anSap = !!set.sap; this.api.saveSettings(); }), "Ẩn sạp hàng (chợ trời)"), "Ẩn người trông sạp và bảng hiệu bày bán trên bản đồ cho đỡ giật. Vẫn mua bán được ở bảng Chợ Trời (Kỳ Trân Các). Nhớ ở máy này"));
    // anh 27/10: bật / tắt bảo vệ trang bị (khung hỏi lại khi vứt / bán đồ quý — main.js throwHeld, windows.js bán)
    out.push(this._h("Bảo vệ"));
    out.push(this._tip(this._row(this._c(A, "baoVe"), "Bảo vệ trang bị"), "Vứt ra đất / bán món từ 4 dòng phải xác nhận lại. Tắt: vứt / bán luôn, không hỏi"));
    // anh 13/11 lượt 88: "cho phép tắt bật so sánh trang bị trong cài đặt trợ thủ" (windows.js _showTip)
    out.push(this._tip(this._row(this._c(A, "soSanh"), "So sánh trang bị"), "Trỏ vào món chưa mặc thì hiện thêm ô của món đang mặc cùng loại (đã trang bị) để so. Tắt: chỉ hiện ô của món đang trỏ"));
    // anh 29/10 lần 3: kéo thả các bảng trên màn hình rồi lưu — lần sau vào lại nhân vật này lấy bố cục đó (main.js boCuc, hud.js keoBang).
    // Điện thoại dọc không có các bảng đó (bố cục riêng) -> không hiện
    if (D && D.on) return out;
    out.push(this._h("Bố cục màn hình"));
    const keo = { on: this.api.dangKeo() ? 1 : 0 };
    out.push(this._tip(this._row(this._c(keo, "on", () => this.api.boCuc(keo.on ? "bat" : "tat")), "Kéo thả bảng trên màn hình"),
      "Bảng nhiệm vụ, đội ngũ, biểu tượng trạng thái, mộc nhân luyện công hiện khung vàng: giữ chuột trái kéo tới chỗ mới rồi bấm Lưu bố cục"));
    const da = Object.keys(A.boCuc || {}).length;
    out.push(this._row(this._b("Lưu bố cục", () => this.api.boCuc("luu")), this._b("Về mặc định", () => this.api.boCuc("macDinh")), this._x(da ? `đã lưu chỗ ${da} bảng` : "đang ở chỗ mặc định")));
    return out;
  }
}
