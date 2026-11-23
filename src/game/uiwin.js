// Cửa sổ giống client PC (kho assets/ui/win — tools/build-ui-windows.mjs: ini + hình của client). Dựng DOM theo đúng từng mục ini:
//   - hình nền: mục Main của cửa sổ / trang con;
//   - nút: mục có hình — khung Up / Over / Down / DisableFrame; CheckBox giữ khung Down khi chọn; chữ Label màu Color / OverColor /
//     SelectColor (đang chọn) / DisableColor, canh HAlign (0 trái, 1 giữa, 2 phải), LabelYOffset;
//   - chữ cố định: mục có Text; ô dữ liệu: mục chỉ có vị trí (+ màu, canh lề) — game điền chữ bằng set().
// Tọa độ hệ 1024×768 của client; cùng tỉ lệ + căn giữa như 2 dải HUD (src/game/hud.js). Cửa sổ Moveable kéo được bằng nền.
//
//   const W = await UiWins.load();
//   const w = W.get("status"); w.toggle(); w.page("attr"); w.set("Name", "abc", "attr"); w.on("CloseBtn", fn); w.check("BtnAttribPage", true)


const BASE = "assets/ui/win/";
const SKIP = new Set(["Main", "Init", "Settings"]);
const rgb = (c) => `rgb(${c.join(",")})`;
export const shadow = (c) => { const k = rgb(c); return `1px 0 ${k},-1px 0 ${k},0 1px ${k},0 -1px ${k},1px 1px ${k},-1px -1px ${k},1px -1px ${k},-1px 1px ${k}`; };
// cỡ chữ ini -> font client: Vn.fon chỉ có 8 pt (13 px) và 10 pt (16 px)
const font = (f) => (f >= 16 ? '16px/16px "VL Co Dien", "IBM Plex Mono", Georgia, "Times New Roman", serif' : '13px/13px "VL Co Dien", "IBM Plex Mono", Georgia, "Times New Roman", serif');
// Khung hội thoại NPC (Talk 提示2 / Say 滚动选择界面 / Describe npc描述界面): font chữ ảnh của client — ui\ui3\vn\fontsetting.ini cỡ Font=
// -> \font\vn\gbk_fs<cỡ>.fnt (assets/ui/hud/font/jx-asf-*.ttf). Đối chiếu ảnh client anh gửi 23/10: chữ đều nhau 7 điểm (cỡ 14),
// dòng chữ cao đúng cỡ chữ, ngắt dòng theo ký tự (ô 377 điểm = 53 ký tự, giữ cả dấu cách), chữ có viền tối 1 điểm dù ini để
// chú thích BorderColor. Các cửa sổ khác giữ Vn.fon tới khi có ảnh client để so.
const ASF_WINS = new Set(["info2", "msgsel", "describe", "hoi"]);
const ASF = { 12: 12, 13: 12, 14: 14, 16: 16 }; // fontsetting.ini: cỡ 13 dùng chung font 12; cỡ 10 client không có file
export const asfPx = (f) => ASF[f] || (f >= 16 ? 16 : f >= 14 ? 14 : 12);
const asfFont = (f) => { const n = asfPx(f); return `${n}px/${n}px "VL Co Dien", "IBM Plex Mono", Georgia, "Times New Roman", serif`; };
const ASF_BORDER = [0, 0, 0]; // TẠM: viền mặc định đen (ảnh client: viền tối; màu đúng chưa đo được qua nền trong suốt)

export class UiWins {
  static async load(base = BASE) {
    const r = await fetch(base + "win.json");
    if (!r.ok) throw new Error("Không đọc được win.json");
    return new UiWins(await r.json(), base);
  }

  constructor(meta, base) {
    this.M = meta.windows; this.base = base; this.wins = {}; this.z = 10;
    this.portrait = meta.portrait; this.shopTypes = meta.shopTypes || []; // chân dung (settings/portrait.ini), mục bán Kỳ Trân Các
    this.strings = meta.strings || {}; // bảng chữ giao diện client (lang/vn/stringtable_client.txt)
    this.root = document.createElement("div");
    this.root.id = "jxwin";
    document.body.appendChild(this.root);
    this.layout();
    addEventListener("resize", () => this.layout());
  }

  // như HUD: khung 1024×768 căn giữa (ngang + dọc — màn cao hơn 768 thì cửa sổ không dính sát mép trên; anh muốn 23/10),
  // màn hẹp hơn thì thu nhỏ. Anh 03/11 ("từ giao diện thu nhỏ khi phóng to thì có 1 số tab nhảy lung tung, như cái trợ thủ"): đổi cỡ thì bảng
  // đang mở tự đặt lại chỗ (cb.layout — Trợ Thủ dán lại mép phải) rồi kéo vào trong màn (keoVao)
  layout() {
    const s = Math.min(1, innerWidth / 1024);
    this.offY = Math.max(0, (innerHeight - 768 * s) / 2);
    this.root.style.top = this.offY + "px";
    this.root.style.transform = `translateX(-50%) scale(${s})`;
    for (const w of Object.values(this.wins)) if (w.visible) { if (w.cb.layout) w.cb.layout(); w.keoVao(); }
  }
  get(key) { return this.wins[key] || (this.wins[key] = new UiWindow(this, key, this.M[key])); }
  open() { return Object.values(this.wins).filter((w) => w.visible).sort((a, b) => b.z - a.z); }
  closeTop() { const w = this.open().filter((x) => !x.sticky)[0]; if (w) w.hide(); return !!w; } // sticky (bảng trọng thương): Esc không đóng
  closeAll() { for (const w of Object.values(this.wins)) w.hide(); }
}

export class UiWindow {
  constructor(mgr, key, def) {
    if (!def) throw new Error("Không có cửa sổ " + key);
    this.mgr = mgr; this.key = key; this.def = def; this.cb = {}; this.z = 0;
    this.asf = ASF_WINS.has(key);
    const m = def.sec.Main;
    this.el = this._box(m, "jw");
    this.el.style.display = "none";
    this.it = this._items(def, this.el);
    this.pages = {};
    for (const [p, pd] of Object.entries(def.pages || {})) {
      const org = pd.sec.Main ? null : this._origin(pd, m);
      const el = this._box(pd.sec.Main || org, "jw-page");
      this.el.appendChild(el);
      this.pages[p] = { el, it: this._items(pd, el, org) };
    }
    mgr.root.appendChild(this.el);
    // kéo cửa sổ bằng nền (không phải nút / ô nhập); bấm vào là lên trên cùng
    this.el.addEventListener("mousedown", (e) => {
      this.front();
      const t = e.target, grab = t === this.el || t.classList.contains("jw-page") || t.classList.contains("jw-bg") || (t.closest(".jw-drag") && !t.closest("input, select, textarea, [data-click]"));
      if (!m.moveable || !grab) return;
      e.preventDefault();
      const s = mgr.root.getBoundingClientRect().width / 1024, x0 = e.clientX, y0 = e.clientY, l0 = this.el.offsetLeft, t0 = this.el.offsetTop;
      const mv = (ev) => { this.daKeo = true; this.el.style.left = l0 + (ev.clientX - x0) / s + "px"; this.el.style.top = Math.max(-mgr.offY / s, t0 + (ev.clientY - y0) / s) + "px"; }; // kéo được tới mép trên màn; daKeo: người chơi đã tự đặt chỗ (cb.layout giữ)
      const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); };
      addEventListener("mousemove", mv); addEventListener("mouseup", up);
    });
    // nút đóng của client (tên mục khác nhau giữa các ini)
    for (const k of ["Close", "CloseBtn", "BtnClose"]) if (this.it[k]) this.on(k, () => this.hide());
  }

  // Trang con không có mục Main (vd 玩家装备与人物状态_装备.ini: 2 hình nền Male / Female tự đặt ở (2, 56) / (2, 55)): gốc trang
  // = chỗ hình nền lớn đầu tiên, các mục khác tính từ gốc đó như mọi trang con; hình nền đặt lại theo gốc.
  _origin(pd, m) {
    const big = pd.order.filter((k) => { const s = pd.sec[k]; return s.img && s.x != null && s.w >= m.w * 0.8; });
    const s0 = big.length ? pd.sec[big[0]] : { x: 0, y: 0, w: m.w, h: m.h };
    return { x: s0.x, y: s0.y, w: s0.w, h: s0.h, bg: new Set(big) };
  }

  // khung có hình nền (mục Main)
  _box(s, cls) {
    const el = document.createElement("div");
    el.className = cls;
    const w = s.w || (s.img && s.img.w) || 0, h = s.h || (s.img && s.img.h) || 0;
    Object.assign(el.style, { left: (s.x || 0) + "px", top: (s.y || 0) + "px", width: w + "px", height: h + "px" });
    if (s.img) this._img(el, s.img, 0);
    return el;
  }
  _img(el, im, f) {
    el.style.backgroundImage = `url(${this.mgr.base}${im.file})`;
    el.style.backgroundSize = `${im.w * im.n}px ${im.h}px`;
    el.style.backgroundPosition = `${-Math.min(f, im.n - 1) * im.w}px 0`;
  }

  _items(def, parent, org) {
    const out = {};
    for (const name of def.order) {
      const s = def.sec[name];
      if (SKIP.has(name) || s.x == null || s.y == null) continue;
      const el = document.createElement("div");
      // mục có hình: vẽ đúng cỡ 1 khung hình (ini có chỗ ghi rộng hơn hình, vd CloseBtn của 奇珍阁购物车.ini rộng 543 trên cửa sổ 366
      // -> lộ khung kế bên); hình lặp (RepeatImg, vd thanh cuộn) giữ cỡ ini. Ô chữ ini không ghi chiều cao (vd PageInfo) -> 1 dòng chữ.
      const fit = s.img && !s.repeatImg;
      const w = fit ? s.img.w : s.w || (s.img && s.img.w) || 0, h = fit ? s.img.h : s.h || (s.img && s.img.h) || (s.img ? 0 : 14);
      const bg = org && org.bg.has(name), x = bg ? s.x - org.x : s.x, y = bg ? s.y - org.y : s.y;
      el.className = "jw-i";
      el.dataset.n = name;
      Object.assign(el.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px", font: this.asf ? asfFont(s.font || 12) : font(s.font || 12) });
      if (s.tip) el.title = s.tip;
      const text = s.label ?? s.text;
      const lab = document.createElement("span");
      lab.className = "jw-t";
      Object.assign(lab.style, {
        textAlign: ["left", "center", "right"][s.hAlign ?? (s.img ? 1 : 0)] || "left",
        // LabelYOffset của client = chỗ mép trên dòng chữ trong nút (anh 27/10: chữ "Nạp thẻ", thẻ Kỳ Trân Các… nằm thấp — bản trước canh giữa
        // rồi còn cộng thêm LabelYOffset): có LabelYOffset thì dòng cao đúng cỡ chữ + 1, đặt ở LabelYOffset
        lineHeight: (s.labelYOffset != null ? (s.font || 12) + 1 : s.vAlign === 1 || s.img ? h : Math.max(h, 13)) + "px",
        paddingTop: (s.labelYOffset || 0) + "px",
        whiteSpace: s.multiLine ? "normal" : "nowrap",
      });
      if (s.multiLine) {
        lab.style.lineHeight = "15px";
        if (this.asf) Object.assign(lab.style, { lineHeight: asfPx(s.font || 12) + "px", whiteSpace: "break-spaces", wordBreak: "break-all" });
        // nhiều dòng + VAlign 1 (vd Info của 提示2.ini): khối chữ canh giữa theo chiều dọc ô như client
        if (s.vAlign === 1) { Object.assign(el.style, { display: "flex", alignItems: "center" }); Object.assign(lab.style, { width: "100%", height: "auto" }); }
      }
      else if (s.text != null && !s.img) lab.style.overflow = "visible"; // chữ cố định (tiêu đề cột…) không cắt theo khung như client
      if (s.borderColor) lab.style.textShadow = shadow(s.borderColor);
      if (text != null) lab.textContent = text;
      el.appendChild(lab);
      const item = { s, el, lab, on: false, dis: false, over: false };
      if (s.img) { el.classList.add(this._isBtn(s) ? "jw-btn" : "jw-bg"); if (s.repeatImg) el.style.backgroundRepeat = "repeat-y"; this._wire(item, name); }
      this._paint(item);
      parent.appendChild(el);
      out[name] = item;
    }
    return out;
  }
  _isBtn(s) { return s.up != null || s.down != null || s.over != null || s.checkBox != null || s.label != null; }
  // khung + màu chữ theo trạng thái: tắt > rê chuột / nhấn > đang chọn > thường
  _paint(t, press) {
    const s = t.s;
    if (s.img) {
      let f = s.up ?? 0;
      if (t.dis && s.disableFrame != null) f = s.disableFrame;
      else if (press && s.down != null) f = s.down;
      else if (t.on && s.down != null) f = s.checkFrame ?? s.down;
      else if (t.over && s.over != null) f = s.over;
      this._img(t.el, s.img, f);
    }
    const c = t.dis ? s.disableColor : press && !s.img && s.selColor ? s.selColor : t.over && s.overColor ? s.overColor : t.on && s.selectColor ? s.selectColor : s.color;
    t.lab.style.color = c ? rgb(c) : "";
    if (!s.img && s.selBgColor) t.el.style.background = press ? rgb(s.selBgColor) : "";
    const bc = s.borderColor || (this.asf ? ASF_BORDER : null);
    t.lab.style.textShadow = t.over && s.overBorderColor ? shadow(s.overBorderColor) : bc ? shadow(bc) : "";
  }
  _wire(t, name) {
    if (!this._isBtn(t.s)) return;
    const el = t.el;
    el.onmouseenter = () => { t.over = true; this._paint(t); };
    el.onmouseleave = () => { t.over = false; this._paint(t); };
    el.onmousedown = (e) => { if (t.dis) return; e.preventDefault(); this._paint(t, true); };
    el.onmouseup = () => this._paint(t);
    el.onclick = (e) => { if (t.dis) return; e.stopPropagation(); if (t.fn) t.fn(name, e); };
  }

  // ---------- dùng ----------
  item(name, page) { return (page ? this.pages[page] && this.pages[page].it : this.it)[name] || null; }
  node(name, page) { const t = this.item(name, page); return t && t.el; }
  set(name, text, page) { const t = this.item(name, page); if (t && t.lab.textContent !== String(text)) t.lab.textContent = text; return this; }
  on(name, fn, page) {
    const t = this.item(name, page); if (!t) return this;
    t.fn = fn;
    if (!t.s.img) {
      const el = t.el;
      el.classList.add("jw-link");
      el.onmouseenter = () => { t.over = true; this._paint(t); };
      el.onmouseleave = () => { t.over = false; this._paint(t); };
      el.onmousedown = (e) => { e.preventDefault(); this._paint(t, true); };
      el.onmouseup = () => this._paint(t);
      el.onclick = (e) => { e.stopPropagation(); fn(name, e); };
    }
    return this;
  }
  check(name, on, page) { const t = this.item(name, page); if (t) { t.on = !!on; this._paint(t); } return this; }
  disable(name, on, page) { const t = this.item(name, page); if (t) { t.dis = !!on; t.el.classList.toggle("dis", t.dis); this._paint(t); } return this; }
  hideItem(name, hide, page) { const t = this.item(name, page); if (t) t.el.style.display = hide ? "none" : ""; return this; }
  page(p) { this.cur = p; for (const [k, v] of Object.entries(this.pages)) v.el.style.display = k === p ? "" : "none"; return this; }
  get visible() { return this.el.style.display !== "none"; }
  front() { this.z = ++this.mgr.z; this.el.style.zIndex = this.z; }
  show() { if (!this.visible) { this.el.style.display = ""; if (this.cb.show) this.cb.show(); this.keoVao(); } this.front(); return this; }
  // bảng lòi ra ngoài màn (đổi cỡ cửa sổ, mở lại sau khi màn nhỏ đi — anh 03/11) -> kéo vào: vừa màn thì nằm trọn, to hơn màn thì mép trái / trên
  // trong màn. Giao diện điện thoại tự xếp cửa sổ (dienthoai.js _xepCuaSo) — bỏ qua
  keoVao() {
    if (document.body.classList.contains("dt")) return;
    const r = this.el.getBoundingClientRect(); if (!r.width) return;
    const s = this.mgr.root.getBoundingClientRect().width / 1024 || 1;
    const dx = r.width > innerWidth || r.left < 0 ? -r.left : r.right > innerWidth ? innerWidth - r.right : 0;
    const dy = r.height > innerHeight || r.top < 0 ? -r.top : r.bottom > innerHeight ? innerHeight - r.bottom : 0;
    if (dx) this.el.style.left = this.el.offsetLeft + dx / s + "px";
    if (dy) this.el.style.top = this.el.offsetTop + dy / s + "px";
  }
  hide() { if (this.visible) { this.el.style.display = "none"; if (this.cb.hide) this.cb.hide(); } return this; }
  toggle(on = !this.visible) { return on ? this.show() : this.hide(); }
}
