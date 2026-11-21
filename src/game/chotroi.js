// Chợ trời — bày bán kiểu client, phía trình duyệt (anh 02/11: sạp Rao bán kiểu client + bảng Chợ Trời, thuế 20 %, NPC trông sạp 3 hình ngẫu
// nhiên, sạp 6 × 10 ô — máy chủ may-chu/cho-troi.js). Khung client 摆摊 (cong-cu/dung-khung-bay-ban.mjs -> win.json):
//   sap      khung RAO BÁN 摆摊物品.ini: sạp của mình (hero.sap) hoặc sạp đang xem (máy chủ "xem") — lưới 6 × 10 như túi; rê chuột: chú thích món
//            + giá (câu client G_CORESHELL_STALL_*: người bán "Giá niêm yết ( thu nhập )", người mua "Giá bán (gồm thuế )" + "Thuế suất"). Người
//            mua bấm món = khung mua bán của client (windows.js _tradeOpen "sap" — 1 bước); sạp của mình: bấm = định giá lại, chuột phải = không bán
//   dinhgia  khung Rao bán 摆摊标价.ini: tên món + ô Giá bán (giá niêm yết = thu nhập của người bán); dưới khung (S1 thêm): người mua trả bao nhiêu
//   loirao   khung lời rao 摆摊设置广告.ini (1 – 16 chữ) — chữ trên bảng hiệu
//   chotroi  bảng Chợ Trời trên khung Kỳ Trân Các (anh duyệt mẫu B, ô hình dọc B2): thẻ Vũ khí / Phòng cụ / Trang sức / Ngựa / Khác, ô tìm (tên +
//            dòng thuộc tính, không dấu cũng được), 15 món / trang rẻ trước, tên món + giá gồm thuế + chủ sạp, Mua; Treo bán (mở túi ở chế độ Định
//            giá), Sạp của tôi. Thẻ Dã Tẩu (anh 02/11 khuya): hàng của sạp Hệ thống (máy chủ may-chu/da-tau.js choHt — món Dã Tẩu hay đòi, 5–8 vạn,
//            không thuế): dòng tên = yêu cầu như lời Dã Tẩu (chữ vàng), món của nhiệm vụ đang làm đứng đầu ("Dã Tẩu: đang cần"), theo thứ tự máy chủ
// Nút Hành trang (随身物品.ini): Lời rao (MakeAdvBtn) · Định giá (MarkPriceBtn — bật: bấm món trong túi = định giá, sạp của mình mở bên trái túi) ·
// Rao bán (MakeStallBtn, ô đánh dấu — mở sạp ở chỗ đang đứng / đóng sạp; main.js moSap: kiểm tra cưỡi ngựa, ngồi xuống).
//   const C = new ChoTroi(gw)   C.nutTui(w) · C.dinhGiaMon(it, e, tren) · C.xemSap(k) · C.moSapMinh() · C.moBang() · C.ve() · C.goiY(it) (dòng gợi ý
//                               món túi ở chế độ Định giá) · C.mua(it) (khung mua bán bấm Xác nhận)
import { ItemDB, SLOT_OF } from "./itemdb.js";
import { fmtMoney } from "./money.js";
import { itemTipHtml } from "./itemtip.js";

const UNIT = 28;
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rgb = (c) => `rgb(${c.join(",")})`;
// thẻ của bảng: loại ô trang bị (itemdb SLOT_OF) -> thẻ; thuốc / phù / vật phẩm Kỳ Trân Các / sách / nguyên liệu -> Khác; hàng Hệ thống -> Dã Tẩu
const THE = [["Vũ khí", ["Weapon"]], ["Phòng cụ", ["Cloth", "Cap", "Shoes", "Sash", "Bangle"]], ["Trang sức", ["Ring1", "Necklace", "Pendant"]], ["Ngựa", ["Horse"]], ["Khác", null], ["Dã Tẩu", null]];
const THE_KHAC = 4, THE_DT = 5;
const theCua = (r) => { if (r.ht) return THE_DT; const x = ItemDB.item(r.it.k), s = x && !x.thuoc && !x.phu && !x.ktc ? SLOT_OF[x.t] : null; const i = THE.findIndex(([, L]) => L && L.includes(s)); return i < 0 ? THE_KHAC : i; };
const VANG = "rgb(255,255,0)", HE_THONG = "rgb(255,199,0)", CHU = "rgb(255,237,165)"; // chữ vàng lời Dã Tẩu; tên Hệ thống; tên chủ sạp
// tìm không dấu: "khang doc" khớp "Kháng độc"
const bo = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
// giá gọn cho ô hàng: [số, đơn vị] — "144" vạn, "144,5" vạn, "9500" lượng
const giaNgan = (n) => (n >= 1e4 ? [String(Math.round(n / 1e3) / 10).replace(".", ","), "vạn"] : [String(n), "lượng"]);
// màu tên món như tên vật trên đất của client: có dòng xanh -> xanh, vật phẩm Kỳ Trân Các -> vàng cam, còn lại trắng
const mauTen = (it) => { const x = ItemDB.item(it.k) || {}; return (it.d || []).length ? "rgb(100,100,255)" : x.ktc ? "rgb(255,199,0)" : "rgb(255,255,255)"; };

export class ChoTroi {
  constructor(gw) {
    this.gw = gw; this.W = gw.W; this.api = gw.api;
    this.dinhGiaMo = false; // chế độ Định giá của Hành trang
    this.xem = null;        // sạp người khác đang xem { k, ten, qc, thue, minh, ds } — null: khung RAO BÁN đang là sạp của mình
    this.gia = null;        // món đang định giá { it, tren (món trên sạp) }
    this.ds = null; this.the = 0; this.trang = 0; this.tim = ""; // bảng Chợ Trời
    this._sap(); this._gia(); this._qc(); this._bang();
  }
  get P() { return this.api.P; }
  sapMinh() { const h = this.api.hero(); return (h && h.sap) || { qc: "", mo: 0, ds: [], thue: (this.api.luat().choTroi || {}).thue ?? 20 }; }
  thue() { return (this.xem && this.xem.thue) ?? this.sapMinh().thue ?? 20; }
  // thuế chia người mua / người bán (anh 18/11 — may-chu/cho-troi.js THUE_MUA / THUE_BAN); máy chủ cũ không gửi: người mua chịu hết như trước
  tMua() { const o = this.xem || this.sapMinh(), L = this.api.luat().choTroi || {}; return o.thueMua ?? L.thueMua ?? o.thue ?? 20; }
  tBan() { const o = this.xem || this.sapMinh(), L = this.api.luat().choTroi || {}; return o.thueBan ?? (o.thueMua == null ? L.thueBan : null) ?? 0; }

  // ---------- nút của Hành trang ----------
  nutTui(w) {
    w.on("MakeAdvBtn", () => this.moQc());
    w.on("MarkPriceBtn", () => this.batDinhGia(!this.dinhGiaMo));
    w.on("MakeStallBtn", () => { this.veNut(); this.api.moSap(!this.sapMinh().mo).then(() => this.veNut()); });
    for (const [k, t] of [["MakeAdvBtn", "Lời rao: chữ trên bảng hiệu khi bày bán"], ["MarkPriceBtn", "Định giá: bấm món trong hành trang để đặt giá niêm yết (thu nhập) — món lên sạp"], ["MakeStallBtn", "Rao bán: ngồi bày bán ở chỗ đang đứng (trong thành) — đi luyện công / thoát game sạp vẫn mở"]]) w.node(k).title = t;
  }
  veNut() { const w = this.W.get("items"); w.check("MarkPriceBtn", this.dinhGiaMo).check("MakeStallBtn", !!this.sapMinh().mo); }
  batDinhGia(on) {
    this.dinhGiaMo = !!on; this.veNut(); this.gw._bagSig = null; this.gw.refresh(true);
    if (!on) { this.W.get("dinhgia").hide(); return; }
    this.api.P.audio.ui("click");
    this.api.msg("Định giá: bấm món trong hành trang, nhập giá niêm yết (số tiền bạn nhận) — món lên sạp. Bấm Định giá lần nữa để thôi");
    this.moSapMinh(true);
  }
  // dòng gợi ý của món trong túi ở chế độ Định giá
  goiY(it) { return it.kbh ? "Vật phẩm khóa bảo hiểm không bày bán được" : ItemDB.item(it.k) && it.het ? "Ngựa có hạn của Kỳ Trân Các không bày bán được" : "Bấm: định giá — bày lên sạp"; } // kbh: anh 05/11

  // ---------- khung RAO BÁN ----------
  _sap() {
    const w = this.W.get("sap"), box = w.node("ItemBox"), ib = w.def.sec.ItemBox;
    // nền lưới của hình client trong suốt (ini Trans 1) — lót nền tối dưới lưới cho khỏi lộ chữ / cảnh phía sau
    const nen = document.createElement("div");
    Object.assign(nen.style, { position: "absolute", left: ib.x - 2 + "px", top: ib.y - 2 + "px", width: ib.w + 4 + "px", height: ib.h + 4 + "px", background: "rgba(6,8,6,.78)", pointerEvents: "none" });
    w.el.insertBefore(nen, w.el.firstChild);
    box.classList.add("jw-box");
    box.oncontextmenu = (e) => e.preventDefault();
    w.on("CloseBtn", () => w.hide());
    w.cb.hide = () => { this.gw._hideTip(); this.xem = null; };
  }
  // ben: mở cạnh trái Hành trang (chế độ Định giá)
  moSapMinh(ben) {
    const w = this.W.get("sap");
    this.xem = null;
    if (ben) { const t = this.W.get("items").el; w.el.style.left = Math.max(0, (parseInt(t.style.left) || 0) - 218) + "px"; w.el.style.top = (parseInt(t.style.top) || 0) + 30 + "px"; }
    this._veSap(); w.show();
  }
  xemSap(k) {
    return this.api.cho({ viec: "xem", k }).then((j) => {
      if (!j || !j.xem) return;
      if (j.xem.minh) return this.moSapMinh();
      const w = this.W.get("sap");
      if (!w.visible) Object.assign(w.el.style, { left: "236px", top: "96px" }); // cạnh phải bảng nhiệm vụ góc trái (ini 40 / 145 đè lên bảng đó)
      this.xem = j.xem; this._veSap(); w.show(); this.api.P.audio.ui("click");
    });
  }
  _veSap() {
    const w = this.W.get("sap"), h = this.api.hero(); if (!h) return;
    const M = this.sapMinh(), S = this.xem || { ten: h.name, minh: true, qc: M.qc, ds: M.ds || [] }, set = w.def.sec.Settings || {};
    w.set("Owner", S.ten);
    w.node("Owner").title = S.qc ? `Lời rao: ${S.qc}` : "Chưa có lời rao";
    const box = w.node("ItemBox"), B = w.def.sec.ItemBox.unitBorder ?? 2;
    box.querySelectorAll(".jw-it").forEach((e) => e.remove());
    for (const it of S.ds) {
      const x = ItemDB.item(it.k); if (!x || it.x == null) continue;
      const [cw, ch] = x.c || [1, 1], el = document.createElement("div"), so = x.thuoc || x.phu || x.ktc;
      el.className = "jw-it";
      Object.assign(el.style, { left: it.x * UNIT + "px", top: it.y * UNIT + "px", width: cw * UNIT + "px", height: ch * UNIT + "px" });
      let html = "";
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) html += `<i class="jw-cell sap" style="left:${i * UNIT + B}px;top:${j * UNIT + B}px;width:${UNIT - 2 * B}px;height:${UNIT - 2 * B}px;background:rgba(${(set.bGSpriteColor || [243, 194, 70]).join(",")},0.26);box-shadow:inset 0 0 0 1px ${rgb(set.bGBorderColor || [100, 80, 30])}"></i>`;
      el.innerHTML = html + (x.ic ? `<img class="jw-icon" src="assets/web/icon/${esc(x.ic)}" alt="">` : "") + (so && it.n > 1 ? `<b class="jw-n">${it.n}</b>` : "");
      const t = this.tMua(), tb = this.tBan();
      const goiY = S.minh
        ? [`Giá niêm yết : ${fmtMoney(it.gia)}`, `Bạn nhận: ${fmtMoney(it.gia - Math.floor((it.gia * tb) / 100))}${tb ? ` (trừ thuế ${tb}%)` : ""}`, `Người mua trả: ${fmtMoney(it.mua)} (gồm thuế ${t}%)`, "Bấm: định giá lại · Chuột phải: không bán (về hành trang)"]
        : [`Giá bán (gồm thuế ) : ${fmtMoney(it.mua)}`, `Thuế người mua: ${t}%`, "Bấm: mua"];
      el.onmousemove = (e) => this.gw._showTip(it, e, goiY);
      el.onmouseleave = () => this.gw._hideTip();
      el.onclick = (e) => { this.gw._hideTip(); if (S.minh) this.dinhGiaMon(it, e, true); else this.gw._tradeOpen("sap", { ...it, sapK: S.k, chu: S.ten }); };
      el.oncontextmenu = (e) => { e.preventDefault(); this.gw._hideTip(); if (S.minh) this.thuHoi(it); else this.gw._tradeOpen("sap", { ...it, sapK: S.k, chu: S.ten }); };
      box.appendChild(el);
    }
  }
  thuHoi(it) { return this.api.cho({ viec: "thuHoi", u: it.u }); }
  // khung mua bán bấm Xác nhận (windows.js _trade "sap")
  mua(it) {
    return this.api.cho({ viec: "mua", k: it.sapK, u: it.u, gia: it.mua }).then((j) => {
      if (!j) return null;
      const w = this.W.get("sap");
      if (this.xem && this.xem.k === it.sapK) { if (j.xem) { this.xem = j.xem; this._veSap(); } else w.hide(); }
      if (this.W.get("chotroi").visible) this._taiBang();
      return j;
    });
  }

  // ---------- khung định giá ----------
  _gia() {
    const w = this.W.get("dinhgia"), sec = w.def.sec;
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = 12; inp.inputMode = "numeric"; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "gia-ban";
    inp.style.color = rgb(sec.PriceInput.color);
    const o = w.node("PriceInput");
    o.style.width = Math.min(sec.PriceInput.w, sec.Main.w - sec.PriceInput.x - 6) + "px"; // ini rộng 88 vượt mép khung 122
    o.appendChild(inp);
    w.el.style.overflow = "visible";
    const them = document.createElement("div");
    them.className = "jw-gia-them"; them.style.top = sec.Main.h + 2 + "px";
    w.el.appendChild(them);
    const so = () => Math.max(0, parseInt(inp.value, 10) || 0);
    const upd = () => {
      const n = so(), t = this.tMua(), tb = this.tBan();
      them.innerHTML = n ? `= ${esc(fmtMoney(n))}<br>Bạn nhận: ${esc(fmtMoney(n - Math.floor((n * tb) / 100)))}${tb ? ` (trừ thuế ${tb}%)` : ""}<br>Người mua trả: ${esc(fmtMoney(n + Math.floor((n * t) / 100)))} (gồm thuế ${t}%)` : `Giá niêm yết: người mua trả thêm ${t}%${tb ? `, bạn nhận bớt ${tb}%` : ""} (thuế)`;
    };
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, "").replace(/^0+/, ""); upd(); };
    const ok = () => {
      const G = this.gia; if (!G) return;
      const n = so(); if (!n) return this.api.msg("Nhập giá niêm yết (lượng) — số tiền bạn nhận khi bán được");
      this.api.cho({ viec: "dinhGia", u: G.it.u, gia: n }).then((j) => { if (j && this.gia === G) w.hide(); });
    };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") ok(); else if (e.key === "Escape") w.hide(); };
    w.on("OkBtn", ok).on("CancelBtn", () => { const G = this.gia; w.hide(); if (G && G.tren) this.thuHoi(G.it); });
    w.node("CancelBtn").title = "Không bán: món trên sạp về hành trang";
    w.cb.hide = () => { this.gia = null; inp.blur(); };
    this._giaInp = inp; this._giaUpd = upd;
  }
  // khung giá ngay trên chỗ bấm (như client — ini Left 0 Top 0: engine đặt cạnh món)
  dinhGiaMon(it, e, tren) {
    const w = this.W.get("dinhgia"), x = ItemDB.item(it.k); if (!x) return;
    if (!tren && it.het) return this.api.msg("Ngựa có hạn của Kỳ Trân Các không bày bán được");
    if (!tren && it.kbh) return this.api.msg("Không thể đặt vào vật phẩm đã được khóa bảo hiểm!"); // client G_STR_NO_BINDITEM (anh 05/11)
    this.gia = { it, tren: !!tren };
    w.set("ObjectName", x.n.trim());
    this._giaInp.value = tren && it.gia ? String(it.gia) : "";
    this._giaUpd();
    const r = this.W.root.getBoundingClientRect(), s = r.width / 1024 || 1, m = w.def.sec.Main;
    const cx = e ? (e.clientX - r.left) / s : 512, cy = e ? (e.clientY - r.top) / s : 384;
    const yTren = cy - m.h - 14; // trên chỗ bấm; sát mép trên (món hàng đầu của túi) thì dưới chỗ bấm
    w.el.style.left = Math.round(Math.max(0, Math.min(1024 - m.w, cx - m.w / 2))) + "px";
    w.el.style.top = Math.round(Math.max(0, Math.min(768 - m.h - 60, yTren < 30 ? cy + 24 : yTren))) + "px";
    w.show(); this.api.P.audio.ui("click");
    if (!document.body.classList.contains("dt")) { this._giaInp.focus(); this._giaInp.select(); }
  }

  // ---------- khung lời rao ----------
  _qc() {
    const w = this.W.get("loirao"), sec = w.def.sec;
    Object.assign(w.el.style, { left: Math.round((1024 - sec.Main.w) / 2) + "px", top: Math.round((768 - sec.Main.h) / 2) + "px" });
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = sec.AdvEditor.maxLen || 16; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "loi-rao";
    inp.style.color = rgb(sec.AdvEditor.color);
    w.node("AdvEditor").appendChild(inp);
    const ok = () => {
      const qc = inp.value.trim(); if (!qc) return this.api.msg(`Lời rao 1 – ${inp.maxLength} chữ`);
      this.api.cho({ viec: "loiRao", qc }).then((j) => { if (j) w.hide(); });
    };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") ok(); else if (e.key === "Escape") w.hide(); };
    w.on("BtnOK", ok).on("BtnCancel", () => w.hide());
    w.cb.hide = () => inp.blur();
    this._qcInp = inp;
  }
  moQc() {
    this._qcInp.value = this.sapMinh().qc || "";
    this.W.get("loirao").show(); this.api.P.audio.ui("click");
    if (!document.body.classList.contains("dt")) { this._qcInp.focus(); this._qcInp.select(); }
  }

  // ---------- bảng Chợ Trời (khung Kỳ Trân Các — windows.js _market) ----------
  _bang() {
    const w = this.W.get("chotroi"), sec = w.def.sec;
    for (const k of w.def.order) if (/^MarketGoods_/.test(k)) w.hideItem(k, true);
    // tiêu đề như Kỳ Trân Các: chữ sáng xanh xám, đậm (vẽ lặp lệch 1 điểm), viền đen
    const tieuDe = document.createElement("div");
    Object.assign(tieuDe.style, { position: "absolute", left: "215px", top: "27px", width: "146px", height: "16px", font: '16px/16px "VK Sans Serif 16", monospace', letterSpacing: "1px",
      color: "rgb(170,196,185)", textAlign: "center", whiteSpace: "pre", pointerEvents: "none", textShadow: "1px 0 0 rgb(170,196,185),2px 0 #010101,-1px 0 #010101,0 1px #010101,0 -1px #010101,1px 1px #010101,1px -1px #010101,2px 1px #010101,2px -1px #010101,-1px 1px #010101,-1px -1px #010101" });
    tieuDe.textContent = "Chợ Trời";
    w.el.appendChild(tieuDe);
    const tpl = w.node("SellType"), st = sec.SellType;
    tpl.remove();
    this.tabs = THE.map(([n], i) => {
      const el = tpl.cloneNode(true);
      el.style.left = st.x + i * (st.w + 2) + "px";
      el.querySelector(".jw-t").textContent = n;
      const item = { s: st, el, lab: el.querySelector(".jw-t"), on: false, dis: false, over: false };
      w._wire(item, "SellType");
      item.fn = () => { this.the = i; this.trang = 0; this.gw._hideTip(); this._veBang(); this.api.P.audio.ui("click"); };
      w.el.appendChild(el);
      return item;
    });
    const nhan = (k, t, tip) => { const q = w.node(k).querySelector(".jw-t"); if (q) q.textContent = t; w.node(k).title = tip; };
    nhan("PrePaid", "Treo bán", "Mở hành trang ở chế độ Định giá: bấm món để đặt giá rồi bày lên sạp");
    nhan("ShoppingCart", "Sạp của tôi", "Xem sạp của mình: món đang bày, giá niêm yết");
    w.on("PrePaid", () => { const t = this.W.get("items"); t.show(); this.batDinhGia(true); });
    w.on("ShoppingCart", () => this.moSapMinh());
    // ô tìm giữa nút Treo bán và Trước / Kế — nền tối viền như ô nhập của client
    const tim = document.createElement("input");
    tim.className = "jw-tim"; tim.placeholder = "Tìm tên / dòng…"; tim.spellcheck = false; tim.autocomplete = "off"; tim.name = "tim-cho";
    tim.oninput = () => { this.tim = tim.value; this.trang = 0; this._veBang(); };
    tim.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Escape") { tim.value = ""; tim.oninput(); } };
    w.el.appendChild(tim);
    // 15 ô hàng 3 × 5 như Kỳ Trân Các; ô hình dọc 30 × 52 (anh chọn B2) đè ô đen 26 × 26 + chỗ nhãn "hàng mới"
    const g = sec.MarketGoods, S = (k) => sec["MarketGoods_" + k] || {};
    const txt = (s, extra = {}) => {
      const d = document.createElement("div");
      Object.assign(d.style, { position: "absolute", left: s.x + "px", top: s.y + "px", width: (s.w || 60) + "px", height: "13px", font: '13px/13px "VK Sans Serif 13", monospace', color: rgb(s.color || [255, 255, 255]),
        textAlign: s.hAlign === 1 ? "center" : s.hAlign === 2 ? "right" : "left", whiteSpace: "pre", overflow: "hidden", pointerEvents: "none", ...extra });
      return d;
    };
    const BUY = S("Buy"), btnTpl = w.node("MarketGoods_Buy"), so1 = S("OriginalPrice_Number"), dv = { ...so1, x: so1.x + so1.w + 3, w: 20 };
    this.o = Array.from({ length: 15 }, (_, i) => {
      const d = document.createElement("div");
      d.className = "jw-i jw-goods";
      Object.assign(d.style, { left: 24 + (i % 3) * (g.w + 9) + "px", top: 108 + Math.floor(i / 3) * (g.h + 3) + "px", width: g.w + "px", height: g.h + "px", pointerEvents: "auto" });
      if (g.img) w._img(d, g.img, 0);
      const ten = txt(S("GoodsName"), { textOverflow: "ellipsis" }), lGia = txt(S("OriginalPrice")), lChu = txt(S("Price"));
      lGia.textContent = "Giá:"; lChu.textContent = "Chủ sạp:";
      const so = txt(so1, { color: "rgb(34,228,36)" }), donVi = txt(dv), chu = txt({ ...S("Price_Number"), x: S("Price_Number").x - 8, w: dv.x + dv.w - S("Price_Number").x + 8 }, { color: CHU, textAlign: "right" });
      const box = document.createElement("div");
      Object.assign(box.style, { position: "absolute", left: "8px", top: "20px", width: "30px", height: "52px", background: "#000", boxShadow: "inset 0 0 0 1px rgb(40,44,40)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "inherit" });
      const btn = btnTpl.cloneNode(true); btn.style.display = ""; btn.style.left = BUY.x + "px"; btn.style.top = BUY.y + "px";
      const bi = { s: BUY, el: btn, lab: btn.querySelector(".jw-t"), on: false, dis: false, over: false };
      w._wire(bi, "MarketGoods_Buy"); w._paint(bi);
      d.append(ten, box, lGia, lChu, so, donVi, chu, btn);
      w.el.appendChild(d);
      return { d, ten, box, lChu, so, donVi, chu, bi };
    });
    // mục chưa có món: dòng chữ giữa vùng ô hàng
    const rong = document.createElement("div");
    Object.assign(rong.style, { position: "absolute", left: "24px", top: "282px", width: "531px", textAlign: "center", font: '13px/18px "VK Sans Serif 13", monospace', color: "rgb(202,230,171)", whiteSpace: "pre-line", pointerEvents: "none",
      textShadow: "1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000", display: "none" });
    w.el.appendChild(rong);
    this._rong = rong;
    const trang = (n) => { const L = this._loc(), k = Math.max(1, Math.ceil(L.length / 15)); if (k < 2) return; this.trang = (this.trang + n + k) % k; this.gw._hideTip(); this._veBang(); };
    w.on("LeftBtn", () => trang(-1)).on("RightBtn", () => trang(1));
    w.cb.hide = () => this.gw._hideTip();
    this._timEl = tim;
  }
  moBang() {
    const w = this.W.get("chotroi");
    w.show(); this._veBang(); this._taiBang(); this.api.P.audio.ui("click");
  }
  _taiBang() { return this.api.cho({ viec: "ds" }).then((j) => { if (j && j.ds) { this.ds = j.ds; this._chu = null; this._veBang(); } }); }
  // món của thẻ đang chọn khớp ô tìm (tên + chủ sạp + yêu cầu Dã Tẩu + mọi dòng chú thích), rẻ trước; thẻ Dã Tẩu giữ thứ tự máy chủ
  _loc() {
    const L = this.ds || [], q = bo(this.tim).trim();
    if (q && !this._chu) {
      const P = this.api.P, h = this.api.hero();
      this._chu = new Map(L.map((r) => [r, bo(r.ten + " " + (r.yc || "") + " " + String(itemTipHtml(P.skillTip, r.it, h, { factions: P.factions })).replace(/<[^>]+>/g, " "))]));
    }
    const ds = L.filter((r) => theCua(r) === this.the && (!q || q.split(/\s+/).every((t) => (this._chu.get(r) || "").includes(t))));
    return this.the === THE_DT ? ds : ds.sort((a, b) => a.it.mua - b.it.mua);
  }
  _veBang() {
    const w = this.W.get("chotroi"); if (!w.visible) return;
    this.tabs.forEach((x, i) => { x.on = i === this.the; w._paint(x); });
    const L = this._loc(), n = Math.max(1, Math.ceil(L.length / 15));
    this.trang = Math.min(this.trang, n - 1);
    w.set("PageInfo", this.ds ? `${this.trang + 1}/${n}` : "…");
    const P = L.slice(this.trang * 15, this.trang * 15 + 15);
    // ô không có món: giữ khung ô (bảng ít hàng không lộ cảnh phía sau qua nền trong suốt), ẩn chữ / hình / nút; cả mục trống: ẩn hết khung, chỉ để
    // dòng hướng dẫn
    const rong = !!this.ds && !L.length;
    this.o.forEach((q, i) => {
      const r = P[i];
      q.d.style.visibility = rong ? "hidden" : "visible";
      for (const c of q.d.children) c.style.visibility = r ? "" : "hidden";
      if (!r) return;
      const x = ItemDB.item(r.it.k) || {}, [so, dv] = giaNgan(r.it.mua);
      // hàng Hệ thống: dòng tên = yêu cầu như lời Dã Tẩu; món nhiệm vụ đang làm: "Dã Tẩu: đang cần" thay chỗ chủ sạp
      q.ten.textContent = r.ht ? r.yc : (x.n || r.it.k).trim() + (r.it.n > 1 ? ` ×${r.it.n}` : ""); q.ten.style.color = r.ht ? VANG : mauTen(r.it);
      q.lChu.textContent = r.can ? "Dã Tẩu:" : "Chủ sạp:";
      q.so.textContent = so; q.donVi.textContent = dv; q.chu.textContent = r.can ? "đang cần" : r.ten; q.chu.style.color = r.can ? VANG : r.ht ? HE_THONG : CHU;
      q.box.innerHTML = x.ic ? `<img src="assets/web/icon/${esc(x.ic)}" alt="" style="max-width:28px;max-height:50px;image-rendering:pixelated">` : "";
      const it = { ...r.it, sapK: r.k, chu: r.ten };
      const goiY = r.ht
        ? [`Giá bán : ${fmtMoney(r.it.mua)}`, "Hàng Hệ thống — giá cố định, không thu thuế", r.can ? `Dã Tẩu đang đòi: ${r.yc}` : `Dã Tẩu Xem vật phẩm: ${r.yc} — nộp là Dã Tẩu giữ luôn`, "Bấm Mua để mua"]
        : [`Giá bán (gồm thuế ) : ${fmtMoney(r.it.mua)}`, `Thuế người mua: ${this.tMua()}% · Chủ sạp: ${r.ten} (${r.tenBai})`, "Bấm Mua để mua"];
      q.box.onmousemove = (e) => this.gw._showTip(r.it, e, goiY);
      q.box.onmouseleave = () => this.gw._hideTip();
      q.bi.fn = () => { this.gw._hideTip(); this.api.P.audio.ui("click"); this.gw._tradeOpen("sap", it); };
      q.box.onclick = () => q.bi.fn(); // bấm hình món cũng mua (điện thoại: nút Mua của hàng việc làm gửi bấm vào ô xem món — dienthoai.js hanhDong)
    });
    this._rong.style.display = this.ds && !L.length ? "" : "none";
    this._rong.textContent = this.tim.trim() ? `Không có món nào khớp "${this.tim.trim()}" ở mục ${THE[this.the][0]}` : this.the === THE_DT ? "Hệ thống chưa bày hàng" : `Chưa có món nào ở mục ${THE[this.the][0]}\nBày bán: Hành trang → Định giá → Lời rao → Rao bán (trong thôn / thành)`;
  }

  // làm mới các khung chợ đang mở (sạp của mình đổi — máy chủ gửi sap)
  ve() {
    this.veNut();
    if (this.W.get("sap").visible && !this.xem) this._veSap();
  }
}
