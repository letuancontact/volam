// Cửa sổ của các nút thanh dưới, giống client PC (khung + nút + chữ: src/game/uiwin.js đọc ini client; file này điền dữ liệu + gắn việc):
//   Nhân vật (4 thẻ: Thuộc tính, Trang bị, Đánh giá, Kinh mạch) + Thuộc tính khác + Chọn chân dung · Đồ dùng (túi 6×10) · Túi hành
//   trang (3 trang) · Võ công (Chiêu thức / Kỹ năng sống) · Nhiệm vụ · Hệ thống (nút Tùy chỉnh / phím Esc) + Tùy chọn · Kỳ Trân Các
//   + Giỏ hàng · Tổ đội (máy chủ — may-chu/to-doi.js) · Hảo hữu "LIÊN LẠC" · Bang phái (Bang hội đợt 1, anh 14/11 — may-chu/bang-hoi.js) · Phòng chat
//   (khung client; nội dung khi dựng máy chủ).
//   Bang phái: GW.bangFill(BangXem | null | undefined, ds?) (main.js bhNhan) · GW.bangTai() (nhịp báo bang đổi) · GW.moBangPhai(trang?) · GW.moTaoBang(xong, qt?) (NPC lập
//   bang) · GW.bangXoa() (thoát nhân vật); api.bh(việc, { im }) -> Promise<trả lời | { loi }>, api.bhMinh() -> { id, ten, cv, v } | null
// Trang Thuộc tính: chỉ số theo luật client (src/game/rules.js) + đồ đang mặc; nút + cộng điểm tiềm năng (bấm +1, Ctrl + bấm +10).
// Đồ (25/10, máy chủ quyết — may-chu/do.js): chuột phải món trong túi = mặc, Ctrl + chuột phải = bán, chuột phải ô trang bị = tháo;
// dòng dưới Tiền = Xu (h.xu, máy chủ giữ). Võ công, nhiệm vụ… làm ở M3. Việc cần máy chủ chưa làm (bày bán, ý kiến,
// khóa đồ…) báo như các nút nhiều người chơi.
// Cửa hàng NPC (25/10, anh: mua thuốc, mỗi lần tối đa 60 bình): khung client npc买卖界面.ini (Mua / Bán / Sửa, lưới hàng 6 × 10) + khung
// mua bán 买卖确认.ini (số lượng, tổng tiền, Xác nhận / Hủy bỏ). Thuốc trong túi: số bình góc dưới phải, chuột phải = uống.
// Sửa đồ (26/10): nút Sửa của cửa hàng = con trỏ sửa của client (修物品), bấm trang bị trong túi / ô đang mặc -> máy chủ sửa đầy độ bền (giá
// như engine — itemdb.js giaSua). Rương chứa đồ (26/10): khung client 储物箱.ini + khung nhập số tiền 取钱界面.ini (gửi / rút ngân lượng).
// Đăng nhập nhận thưởng (27/10): khung client loginprizeloginprize.ini (42 ô thưởng đăng nhập liên tục) — máy chủ may-chu/do.js thuongDN.
//
//   const GW = new GameWindows(await UiWins.load(), api); GW.toggle("Status"); GW.refresh(); GW.esc(); GW.openShop(Sale, tên NPC)
//   GW.openStore()  (Rương chứa đồ — vật bản đồ Ba Lăng) · GW.openLoginPrize() (nút nhận thưởng cột phải)
//   GW.openXepHang()  bảng xếp hạng (排名.ini — ô Hạng dải trên)
//   GW.banPhim(lời?) -> Promise<chuỗi số | null>  bàn phím số của client (数字键盘.ini — mở khóa rương)
//   GW.tachMon(b) — Shift + chuột phải trên chồng ≥ 2 trong túi: khung tách món 拆分 của client (anh 28/10), máy chủ act "tach"
//   GW.chonSo({ tieuDe, ten, toiDa, san?, thongTin?(n) }) -> Promise<số | null>  khung chọn số lượng (物品拆分.ini — như AskClientForNumber
//     của script client: Tiền trang, rút thuốc lễ bao) · GW.bao(lời) thông báo 1 nút (提示.ini)
//   GW.nhapChu({ tieuDe, toiDa? }) -> Promise<chữ | null>  khung nhập chữ (输入字串界面2.ini — như AskClientForString: mã kích hoạt Lễ quan)
//   GW.hoi(lời, nút đồng ý?, nút hủy?) -> Promise<true | false>  khung hỏi 2 nút của client (提示.ini) — lời giữ thẻ <color=…>, <enter>
//   api = { P, hero(), world(), save(), msg(t), leaveGame(), toggleAuto(), toggleSound(), dev (công cụ thử | null), applyLooks(),
//           doItem({ act, u?, slot?, n?, k? }), drink(món trong túi), luat() -> { chong, mua, banLai, giaBan, sua, dangNhap }, bought(khóa thuốc),
//           thuongDN({ nhan?, chon? }) -> Promise<{ tt: { n, da } } | null>,
//           tin() -> [tin cập nhật mới nhất trước], tinXem() -> id tin đã xem, daXemTin(), quanTri() -> tài khoản quản trị? }
//   GW.openGiupDo()  khung HỖ TRỢ (F1 / Esc → Giúp đỡ — nội dung src/game/giupdo.js) · GW.openTin() khung Tin cập nhật (Esc → Tin cập nhật)
//   GW.datTinMoi(có tin chưa xem) — chữ "Mới" ở nút Tin cập nhật + chấm đỏ ở nút Tùy chỉnh thanh dưới

import { ItemDB, soKich, canWear, isPotion, benMax, benCua, giaSua, SLOT_OF, laHoan } from "./itemdb.js";
import { MUC_GIUP, giupHtml } from "./giupdo.js";
import { skillTipHtml, wrapRich } from "./skilltip.js";
import { capChieu, LUYEN, MOC, chanNang, khangDu, ccCong, capCong, skCong, xungHieu } from "./rules.js"; // ccCong / capCong / skCong: +cấp kỹ năng Báo Đáp Ân Sư (anh 16/11)
// cấp kỹ năng cộng thêm (Nhất Kỷ / Càn khôn) ở bảng Võ công — không trùng màu icon ngũ hành (Kim vàng, Mộc xanh lá, Thủy xanh dương, Hỏa đỏ, Thổ nâu); anh chọn mẫu (16/11)
// CC_KIEU "goc": "+N" góc trên ô chiêu kiểu CC_GOC · "so": số cấp dưới ô = cấp đang dùng, màu CC_MAU
const CC_KIEU = "goc", CC_MAU = "rgb(120,160,255)";
// anh 16/11: "+N" màu tím của client (tip.json colors.Violet 188,64,255 — màu dòng thuộc tính tím ở ô xem trang bị), chữ đậm, viền đen như số cấp cho khỏi chìm
// (bản trắng viền tím trước "lên hình xấu")
const CC_GOC = { color: "rgb(188,64,255)", fontWeight: "bold", textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 2px #000" };
import { fmtMoney } from "./money.js";
import { itemTipHtml, gioMoKhoa } from "./itemtip.js";
import { richText, ganCuon, chiaTrang, chuMau } from "./npcdlg.js";
import { shadow } from "./uiwin.js";
import { popup } from "./hud.js"; // menu thả xuống kiểu .jx-menu (Bang phái: sắp xếp thành viên, khuynh hướng / hoạt động chiêu mộ — anh 14/11)
import { ChoTroi } from "./chotroi.js";
import { kyChuan, voKy } from "./an-ky.js"; // ấn ký bản gốc (anh 11/11)
// ô kháng ở bảng chỉ số như client (anh 13/11 — ảnh "75%+9%"): dưới trần hiện đúng số; vượt trần hiện "trần%" + "+N%" xanh lá, N = kháng thật cộng thêm (mỗi 10 % dư
// = +1 % — rules.js khangThat). v: kháng hiện có (đã trừ bùa), c: trần
function khangO(w, ten, A, v, c) {
  const t = w.item(ten, A); if (!t) return;
  const du = khangDu(v, c), goc = Math.round(v > c ? c : v), key = goc + "/" + du;
  if (t.lab.dataset.kh === key) return;
  t.lab.dataset.kh = key; t.lab.textContent = `${goc}%`;
  if (du > 0) { const s = document.createElement("span"); s.className = "kh-du"; s.textContent = `+${du}%`; t.lab.appendChild(s); }
}

const SERIES = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
// mua lại đồ đã bán cho NPC (anh 13/11 lượt 88 — may-chu/do.js act muaLai): câu khịa của chủ tiệm; danh sách hero.muaLai [{ it: món, gia, het: giờ máy chủ }] còn hạn —
// now = giờ máy chủ ước tính (lech: GameWindows.mlLech — main.js applyServer)
const CAU_KHIA = "Bán rồi còn đòi lại à? Vậy thì phải trả cái giá tương xứng nhé đại hiệp, hahaha!";
const dsMuaLai = (h, lech = 0) => { const t = Date.now() + lech; return (Array.isArray(h && h.muaLai) ? h.muaLai : []).filter((e) => e && e.it && e.it.k && e.het > t && e.gia > 0); };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const SERVER_ONLY = "cần máy chủ chơi nội bộ — làm khi dựng máy chủ";
// Bang hội đợt 1 (anh 14/11 — THIET-KE-BANG-HOI.md): tên chức vụ theo mã máy chủ (client tong_header.lua = core 325–329, bỏ dấu cách thừa), thứ tự chức, phe bang
// (mã phe của game: 1 Chánh, 2 Tà, 3 Trung lập — chữ của 帮会基础信息页面.ini), số dòng mỗi trang danh sách thành viên (23 × 14: hàng nút y 343 đè đáy ô 340),
// danh hiệu tối đa 12 chữ (ini cho 80, NPC client nói "4 chữ hán" — kq3 F.6), câu nút của đợt sau
const BH_CV = { chu: "Bang chủ", lao: "Trưởng Lão", doi: "Đội trưởng", de: "Đệ tử", an: "ẩn sỹ" };
const BH_CV_THU = { chu: 0, lao: 1, doi: 2, de: 3, an: 4 };
const BH_DONG = 23, BH_DH_MAX = 12, BH_DOT_SAU = "Đợt sau mới mở";
const BH_KHONG_QUYEN = "Không có quyền hạn để thực hiện thao tác này!"; // core 955
// Bang hội đợt 2 (anh 14/11 — HOP-DONG-DOT-2 mục 10): kiến thiết / chiến bị / kiến thiết dự trữ / phí máy chủ gửi bằng "lượng quy đổi" (1 vạn = BH_VAN) -> hiện vạn,
// 1 chữ số lẻ khi < 100 ("1.234 vạn", "2,5 vạn"); lam: cách làm tròn (quỹ đang có: xuống; phí / mức cần: lên). Ngân quỹ hiện như ngân lượng (fmtMoney)
const BH_VAN = 10000;
const bhVan = (x, lam = Math.floor) => { const v = (+x || 0) / BH_VAN, a = Math.abs(v) < 100 ? lam(Math.round(v * 1000) / 100) / 10 : lam(v); return a.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " vạn"; };
// 7 loại tác phường của client (settings\tong\workshop\workshops.txt TYPE 1–7 — win.json faction.anhThem.tacPhuong) -> khóa máy chủ (BangXem tp / tpLoai); đợt 2 chỉ có leVat
const BH_TP = { 1: "binhGiap", 2: "thienCong", 3: "matNa", 4: "luyenTap", 5: "thienY", 6: "leVat", 7: "hoatDong" };
let BH_CONG = () => 0; // điểm cống hiến cá nhân đang có (cửa hàng Lễ phẩm — TIEN_DIEM.bh; _faction gắn theo BangXem)
// chữ người chơi gõ (tên bang, tên nhân vật, danh hiệu, tin chiêu mộ) đưa vào khung hỏi / ô gợi ý (richText): bỏ < > (không thành thẻ màu), chặn %s / {TEN}
// (richText thay bằng tên mình) bằng ký tự rộng 0
const bhTen = (s) => String(s ?? "").replace(/[<>]/g, "").replace(/%/g, "%\u200b").replace(/\{/g, "{\u200b"); // ký tự rộng 0 viết dạng thoát (soát 14/11 — công cụ xóa ký tự vô hình không làm hỏng)
const bhVang = (s) => `<color=yellow>${bhTen(s)}<color>`;
const bhSo = (v) => { const n = v == null || v === "" ? -1 : Math.floor(+v); return Number.isFinite(n) ? n : -1; }; // mục menu chiêu mộ: số từ 0, -1 = chưa chọn
const KBH_DAT = "Không thể đặt vào vật phẩm đã được khóa bảo hiểm!"; // client G_STR_NO_BINDITEM — món khóa bảo hiểm (anh 05/11) vào khung giao dịch / sạp
const STATUS_TABS = { BtnAttribPage: "attr", BtnEquipPage: "equip", BtnJudgePage: "judge", BtnMeridianPage: "meridian" };
const EQUIP_SLOTS = ["Cap", "Weapon", "Necklace", "Mask", "Bangle", "Cloth", "Sash", "Ring1", "Ring2", "Pendant", "Shoes", "Horse", "Mantle", "Signet", "Shipin"];
const UNIT = 28; // 1 ô túi đồ = 28 px (ItemBox 168×280 / HUnits 6 × VUnits 10)
// cửa hàng bán bằng điểm (openShop(id, tiền)): pd — phúc duyên (Thần bí Thương Nhân Liễu Ất, Sale 93); tk — điểm Tống Kim (Quân Nhu quan Biện Kinh, anh 06/11 —
// đặc tả đợt 2: hero.diemTk, máy chủ do.js muaTk). ten: ghi ở gợi ý giá, o: ô đơn vị khung mua (~5 chữ), co(h): đang có, act: việc mua, thieu: nút Mua tối đa
const TK_GIA_THUOC = 1; // thuốc mua ở Quân y trong trận Tống Kim: mọi loại 1 lượng / bình (anh 13/11 lượt 86 "máu tống kim giờ mua đồng giá 1 đồng" — máy chủ tong-kim.js CF.giaThuocCo)
const TIEN_DIEM = {
  pd: { ten: "điểm phúc duyên", o: "điểm", co: (h) => ((h && h.pd) || {}).diem | 0, act: "muaPd", thieu: "Không đủ phúc duyên" },
  tk: { ten: "điểm Tống Kim", o: "điểm", co: (h) => (h && h.diemTk) | 0, act: "muaTk", thieu: "Không đủ điểm Tống Kim" },
  // Lễ phẩm của Khu Lễ vật (Bang hội đợt 2 — anh 14/11): giá bằng điểm cống hiến cá nhân (BangXem toi.cong), mua qua api.bh({ viec: "lePham" }) — không qua /api/do (_bhMua)
  bh: { ten: "điểm cống hiến", o: "điểm", co: () => BH_CONG(), thieu: "Không đủ điểm cống hiến", bh: 1 },
  // Shop đặc biệt của Thương nhân thần bí (anh 17/11 lần 2 — Hoán Linh Thạch, Hoán Hình Phù, Hoán Tính Lệnh): giá Xu, mua qua api.khamNam({ viec: "muaDb" }) (_dbMua)
  db: { ten: "Xu", o: "Xu", co: (h) => (h && h.xu) | 0, thieu: "Không đủ Xu", db: 1 },
};
// lưới nhận món (data-tha) -> món cầm từ đâu thì bấm vào lưới đó là đặt đúng ô dưới chuột (khung chỗ đặt — _oDat; ô trang bị "mac": riêng)
const THA = { tui: ["bag", "kho", "equip"], kho: ["bag", "kho"], giao: ["bag", "giao"], gd: ["bag", "gd"] };
// dòng gợi ý khoe đồ (anh 12/11 — main.js khoeDo) ở ô xem món của Hành trang / Trang bị; điện thoại: nút "Khoe đồ" (dienthoai.js HANH "Ctrl + bấm")
const KHOE = "Ctrl + bấm: khoe đồ (lên kênh chat)";
const HANH_CAO = 40; // điện thoại: chỗ chừa dưới ô xem cho hàng nút việc làm (game.css #dt-hanh: nút client 20 × phóng 1,35 + khe 6 + chừa mép)
// điện thoại dọc (dienthoai.js): việc làm với món thành nút dưới ô xem (Mặc, Dùng, Cầm lên, Bán…) -> bỏ các đoạn "Bấm: …", "Chuột phải: …",
// "Shift / Ctrl + chuột phải: …" khỏi dòng gợi ý của ô xem; hint: chuỗi | mảng chuỗi (anh 29/10: "chưa mang được đồ … thiết kế cách mang đồ khác")
const HANH_RE = /^(Bấm|Chuột phải|(Shift|Ctrl|Alt) \+ chuột phải)( \(.*\))?:|^Bấm Mua để mua$/i;
const boHanh = (s) => {
  if (Array.isArray(s)) return s.map(boHanh).filter((x) => x);
  return typeof s === "string" ? s.split(" · ").filter((d) => !HANH_RE.test(d.trim())).join(" · ") : s;
};

export class GameWindows {
  constructor(W, api) {
    this.W = W; this.api = api; this.itTip = null;
    this._status(); this._items(); this._itemex(); this._skills(); this._task(); this._system(); this._options(); this._other();
    this._portrait(); this._market(); this._cart(); this._team(); this._faction(); this._chatroom(); this._friend(); this._shop(); this._trade();
    this._store(); this._money(); this._loginprize(); this._hoi(); this._xephang(); this._banPhim(); this._mk("datmk"); this._mk("doimk"); this._soLuong(); this._nhapChu(); this._tumau(); this._giao(); this._kham(); this._giaoDich(); this._thuong(); this._giupDo(); this._tin(); this._tipChu();
    // chợ trời — bày bán kiểu client (anh 02/11 — src/game/chotroi.js): nút Lời rao / Định giá / Rao bán của Hành trang, khung RAO BÁN, bảng Chợ Trời
    this.cho = new ChoTroi(this);
    this.cho.nutTui(this.W.get("items"));
    // các cửa sổ cần làm mới khi đang mở
    this.live = ["status", "items", "other", "skills", "store"];
  }

  // nút thanh dưới -> cửa sổ (nút Tùy chỉnh = 系统按钮 của client mở bảng hệ thống như phím Esc)
  toggle(btn) {
    if (btn === "ItemEx") { this.toggleTuMau(); return true; }
    const key = { Status: "status", Items: "items", Skills: "skills", Task: "task", Options: "system", Market: "market", Team: "team", Faction: "faction", ChatRoom: "chatroom", Friend: "friend" }[btn];
    if (!key) return false;
    this.W.get(key).toggle();
    this.refresh(true);
    return true;
  }
  // Esc như client: đóng cửa sổ trên cùng, không còn cửa sổ nào thì mở bảng hệ thống. Khung hỏi đang mở: Esc = hủy, món cầm tay vẫn giữ
  esc() { this._hideTip(); this._hideSkTip(); if (this._hoiCb) return void this.W.get("hoi").hide(); if (this._handDrop()) return; if (!this.W.closeTop()) this.W.get("system").show(); }
  closeAll() { this._hideTip(); this._hideSkTip(); this._handDrop(); this.W.closeAll(); }
  get holding() { return this.hand ? this.hand.it : null; }
  drop() { return this._handDrop(); }

  refresh(force) {
    const now = performance.now();
    if (!force && now - (this._at || 0) < 250) return;
    this._at = now;
    const h = this.api.hero(), w = this.api.world();
    if (!h || !w) return;
    const st = this.W.get("status");
    if (st.visible) { if (st.cur === "attr") this._fillAttr(h, w); if (st.cur === "equip") this._fillEquip(h); }
    if (this.W.get("items").visible) this._fillItems(h);
    if (this.W.get("shop").visible && !this.shopTien) this._muaLaiFill(); // mua lại (lượt 88): vừa bán / mua lại -> danh sách + số trên nút
    if (this.W.get("store").visible) this._fillStore(h);
    if (this.W.get("itemex").visible) this._fillItemex(h);
    if (this.W.get("tumau") && this.W.get("tumau").visible) this._fillTuMau(h);
    if (this.W.get("other").visible) this._fillOther(h, w);
    if (this.W.get("skills").visible) this._fillSkills(h);
    if (this._gd) this._gdVe();
    // khung chỗ đặt đang hiện (_oDat): cửa sổ dưới chuột đóng / đổi trang, giao dịch khóa… mà chuột đứng yên -> tính lại ở chỗ chuột cuối (khung đã vẽ
    // từ chuột thật nên isTrusted)
    if (this.hand && this._chuot && this.datEl && this.datEl.style.display !== "none") this._oDat({ clientX: this._chuot[0], clientY: this._chuot[1], isTrusted: true });
  }

  // ---------- Nhân vật ----------
  _status() {
    const w = this.W.get("status"), api = this.api;
    this._suaNen(w, "Nhân vật"); // tiêu đề / nhãn Xếp hạng in sai trong hình nền client (anh 17/11)
    const tab = (p) => { w.page(p); for (const [b, pp] of Object.entries(STATUS_TABS)) w.check(b, pp === p); this.refresh(true); };
    for (const [b, p] of Object.entries(STATUS_TABS)) w.on(b, () => { api.P.audio.ui("click"); tab(p); });
    tab(["attr", "equip", "judge"][w.def.sec.Init?.initPage ?? 0] || "attr");
    w.on("Item", () => this.W.get("items").toggle());
    // thuộc tính
    const A = "attr";
    // chân dung: chưa chọn thì hiện chữ "Nhấp vào đây để chọn hình dáng" như client; bấm -> cửa sổ chọn chân dung
    const pick = () => this.W.get("portrait").show();
    w.on("ClickHere", pick, A).on("Face", pick, A);
    w.hideItem("DelSignButton", true, A);
    // cộng điểm tiềm năng (mỗi cấp +5): bấm +1, Ctrl + bấm +10
    for (const [b, k] of [["AddStrength", "str"], ["AddVitality", "vit"], ["AddDexterity", "dex"], ["AddEnergy", "eng"]]) {
      w.on(b, (_, e) => { const n = api.world().addPoint(k, e && e.ctrlKey ? 10 : 1); if (n) { api.P.audio.ui("click"); api.save(); this.refresh(true); } }, A);
    }
    // cộng nhiều điểm 1 lần (anh 30/10 lần 2: "bấm vào chỉ số để tăng nhanh bằng cách nhập và có thêm bước xác nhận"): bấm số Sức mạnh / Sinh
    // khí / Thân pháp / Nội công -> khung số lượng của client (tối đa = điểm tiềm năng còn) -> khung hỏi xác nhận -> cộng
    for (const [o, k, ten] of [["Strength", "str", "Sức mạnh"], ["Vitality", "vit", "Sinh khí"], ["Dexterity", "dex", "Thân pháp"], ["Energy", "eng", "Nội công"]]) {
      const el = w.node(o, A); if (!el) continue;
      el.classList.add("jw-link"); el.style.pointerEvents = "auto";
      el.onclick = async () => {
        const con = api.hero().pts | 0;
        if (con < 1) return api.msg("Không còn điểm tiềm năng để cộng");
        const n = await this.chonSo({ tieuDe: "Cộng điểm tiềm năng", ten, toiDa: con, san: con, thongTin: (v) => `Còn lại ${con - v} điểm` });
        if (!n || !(await this.hoi(`Cộng <color=yellow>${n}<color> điểm vào <color=yellow>${ten}<color>?<enter>Cộng rồi không trả lại được (trừ Tẩy Tủy).`))) return;
        if (api.world().addPoint(k, n)) { api.P.audio.ui("click"); api.save(); this.refresh(true); }
      };
    }
    w.on("SummitSign", () => api.msg("Ý kiến: " + SERVER_ONLY), A);
    w.on("ViewAttrib", () => this.W.get("other").toggle(), A);
    w.on("PublicCheckBox", () => api.msg("Hiển thị ngoại quan mặt nạ — làm cùng đồ (M4)"), A);
    // trang bị: ô đồ (bấm chuột phải để tháo như client), nút khóa / gắn / gỡ gắn
    const E = "equip";
    for (const s of EQUIP_SLOTS) {
      const el = w.node(s, E); if (!el) continue;
      el.classList.add("jw-slot");
      el.dataset.tha = "mac"; el.dataset.o = s; // khung chỗ đặt (_oDat)
      el.oncontextmenu = (e) => { e.preventDefault(); this._hideTip(); if (!this.hand && (api.hero().equip || {})[s] && !this._khoaChan()) api.doItem({ act: "thao", slot: s }); };
      el.onclick = (e) => {
        const it = (api.hero().equip || {})[s];
        if (it && e.ctrlKey && !e.shiftKey && !e.altKey && !this.hand && api.khoe) { this._hideTip(); return api.khoe(it); } // Ctrl + bấm: khoe đồ (anh 12/11)
        this._slotClick(s, e);
      };
      el.onmousemove = (e) => { const it = (api.hero().equip || {})[s]; if (it && !this.hand) this._showTip(it, e, this._sua() ? this._suaHint(it) : ["Bấm: cầm lên · Chuột phải: tháo", KHOE], s); else this._hideTip(); };
      el.onmouseleave = () => this._hideTip();
    }
    for (const b of ["BtnBind", "BtnUnBind"]) w.on(b, () => api.msg(`${{ BtnBind: "Gắn", BtnUnBind: "Gỡ gắn" }[b]} đồ — làm cùng đồ (M4)`), E);
    // Khóa (anh 28/10 lần 3 "đồng bộ nút khóa này với khóa rương, 2 cái chính là 1"): cùng khóa h.khoa với nút Khóa / Mở khóa của rương — khóa thì
    // trang bị trên người không mặc / tháo được, đồ + tiền trong rương không lấy ra được; ô đánh dấu theo trạng thái (_fillEquip)
    w.on("BtnLock", () => this._khoaBam(), E);
    w.cb.hide = () => { this._hideTip(); if (this.hand && this.hand.from === "equip") this._handDrop(); };
  }
  _fillAttr(h, wd) {
    const w = this.W.get("status"), A = "attr", p = wd.player, P = this.api.P;
    const need = P.chr.exp[h.lvl - 1] || 0;
    // Xưng hiệu: xưng hiệu môn phái theo cấp (rules.js xungHieu — client factiontitle.txt, anh 17/11); Xếp hạng: hạng cấp cả máy chủ như ô Hạng dải trên
    // (nhịp hang — may-chu/xep-hang.js; anh 17/11 chọn mẫu A); tiêu đề + chữ "Xếp hàng" in sai trong hình nền client: _suaNen
    const f0 = h.fac == null ? null : P.factions.find((f) => f.id === h.fac), hang = this.api.hang ? this.api.hang() : null;
    this._face(h); this._suaNen(w, "Nhân vật");
    w.set("Name", h.name, A).set("Title", xungHieu(f0 && f0.key, h.lvl), A).set("Luck", 0, A).set("Prestige", 0, A).set("Level", h.lvl, A).set("WorldRank", hang == null ? "-" : hang, A);
    w.set("Life", `${fmt(p.hp)}/${fmt(p.hpMax)}`, A).set("Mana", `${fmt(p.mp)}/${fmt(p.mpMax)}`, A).set("Stamina", `${fmt(p.st)}/${fmt(p.stMax)}`, A).set("Status", SERIES[h.series] ?? "", A);
    w.set("Strength", p.str, A).set("Vitality", p.vit, A).set("Dexterity", p.dex, A).set("Energy", p.eng, A);
    for (const b of ["AddStrength", "AddVitality", "AddDexterity", "AddEnergy"]) w.disable(b, !(h.pts > 0), A);
    w.set("Exp", `${fmt(h.exp || 0)}/${fmt(need)}`, A);
    // lực tay trái / phải = sát thương chiêu ở ô T / P (World.handDamage — engine GetEchoDamage); chưa có võ công: lực vũ khí
    const O = h.oChieu || {}, hand = (id) => { const d = wd.handDamage ? wd.handDamage(id) : p.dmg; return d ? `${d[0]} - ${d[1]}` : ""; };
    w.set("LeftDamage", hand(O.trai), A).set("RightDamage", hand(O.phai), A);
    // chính xác / né tránh theo Thân pháp + đồ, tốc độ chạy 10 (basevalue.ini RunSpeed) × (1 + tốc độ di chuyển % của giày / ngựa),
    // tốc độ đánh: % cộng thêm (đồ + võ công) "ngoại công / nội công" — ngoại công: đòn thường + chiêu ngoại công; nội công: chiêu nội
    // công + bùa (thi pháp). Ô client chỉ có 1 ô AttackSpeed
    w.set("Attack", fmt(p.ar), A).set("Defense", fmt(p.def), A).set("MoveSpeed", Math.round(10 * (1 + (p.moveSpeed || 0) / 100)), A)
      .set("AttackSpeed", `${p.atkSpeed || 0}/${p.castSpeed || 0}`, A).set("RemainPoint", h.pts || 0, A);
    // kháng theo hệ: bảng client level_add.txt
    // vượt trần: "75%+1%" như client (khangO); số đã trừ bùa giảm kháng phe kia đang dính (World.khangHien)
    const r = p.res || {}, rc = p.resCap || {}, KH = wd.khangHien ? wd.khangHien(p) : null;
    for (const [ten, k] of [["ResistPhy", "phys"], ["ResistCold", "cold"], ["ResistLighting", "light"], ["ResistFire", "fire"], ["ResistPoison", "poison"]]) {
      const [v, c] = KH && KH[k] ? KH[k] : [r[k] ?? 0, rc[k] ?? 75];
      khangO(w, ten, A, v, c);
    }
  }
  _fillEquip(h) {
    this.W.get("status").check("BtnLock", !!h.khoa, "equip");
    const w = this.W.get("status"), E = "equip";
    w.hideItem("Male", h.sex === "f", E).hideItem("Female", h.sex !== "f", E);
    w.set("Name", h.name, E).set("PKValue", 0, E).set("TransLife", "", E);
    if (!ItemDB.pack) { ItemDB.load().then(() => this.refresh(true)).catch((e) => this.api.msg("Không tải được kho đồ: " + e.message)); return; }
    const held = this.hand && this.hand.from === "equip" ? this.hand.slot : "";
    const eq = h.equip || {}, sig = JSON.stringify([eq, held]);
    if (sig === this._eqSig) return;
    this._eqSig = sig;
    for (const s of EQUIP_SLOTS) {
      const el = w.node(s, E); if (!el) continue;
      const x = eq[s] && s !== held && ItemDB.item(eq[s].k); // món đang cầm trên tay: ô để trống
      el.querySelector("img")?.remove();
      if (x && x.ic) { const im = document.createElement("img"); im.src = "assets/web/icon/" + x.ic; im.className = "jw-icon"; el.appendChild(im); }
    }
  }

  // ô chân dung trang Thuộc tính
  _face(h) {
    const w = this.W.get("status"), face = w.node("Face", "attr"), P = this.W.portrait;
    if (face._p === h.portrait) return;
    face._p = h.portrait;
    const im = h.portrait && P && P.list[h.portrait - 1];
    face.style.backgroundImage = im ? `url(${this.W.base}${im.file})` : "";
    face.style.backgroundSize = "100% 100%";
    w.hideItem("ClickHere", !!im, "attr");
  }

  // ---------- Soi đồ (anh 30/10 — bảng quản trị F10, nút "Soi đồ" của từng nhân vật): trang Trang bị của khung Nhân vật client, bản thứ 2
  // (cửa sổ "soido" chung định nghĩa với "status") cho nhân vật khác — chỉ xem: chỉ còn nút trang Trang bị (sáng sẵn), ẩn nút Đồ dùng / Khóa / Gắn / Gỡ gắn, không
  // cầm / tháo; trỏ (điện thoại: chạm) ô đồ -> ô xem món tính theo chính nhân vật đó (yêu cầu đủ / thiếu, dòng ẩn được kích), không so sánh.
  // nv = may-chu/quan-tri.js soi { name, lvl, sex, series, fac, start, attr, equip }; lần đầu mở giữa màn hình ----------
  // Anh 17/11 (xem người khác "cho chỉn chu", chọn mẫu B): tiêu đề "Thông tin nhân vật" (_suaNen), 2 thẻ Thuộc tính + Trang bị (ô 2 thẻ còn lại phủ kín), mở ở thẻ
  // Thuộc tính: chân dung, tên, xưng hiệu môn phái, cấp, xếp hạng (phần trên của trang client) + bảng thông tin chung (môn phái, bang hội, ngũ hành, giới tính, chỗ
  // đứng) phủ phần chỉ số — chỉ số chi tiết là bí mật của người ta. nv thêm (may-chu/api.js xemDo): portrait, hang, bang { ten, cv }; them (main.js
  // xemTrangBi): { bh: nhãn bang trên đầu "Tên(Chức)" khi máy chủ cũ chưa gửi bang, noi: "Bãi (X/Y)" }
  soiDo(nv, them = {}) {
    if (!ItemDB.pack) { ItemDB.load().then(() => this.soiDo(nv, them)).catch((e) => this.api.msg("Không tải được kho đồ: " + e.message)); return; }
    const W = this.W, E = "equip", A = "attr";
    W.M.soido = W.M.soido || W.M.status;
    const w = W.get("soido");
    if (!w.soi) {
      for (const b of [...Object.keys(STATUS_TABS), "Item"]) w.hideItem(b, b !== "BtnEquipPage" && b !== "BtnAttribPage");
      for (const b of ["MaskFeature", "BtnLock", "BtnBind", "BtnUnBind", "Settings"]) w.hideItem(b, true, E);
      for (const b of ["AddStrength", "AddVitality", "AddDexterity", "AddEnergy", "SummitSign", "ViewAttrib", "PublicCheckBox", "ClickHere", "DelSignButton"]) w.hideItem(b, true, A);
      const tab = (p) => { w.page(p); w.check("BtnAttribPage", p === A); w.check("BtnEquipPage", p === E); this._hideTip(); };
      w.on("BtnAttribPage", () => { this.api.P.audio.ui("click"); tab(A); }).on("BtnEquipPage", () => { this.api.P.audio.ui("click"); tab(E); });
      w.soiTab = tab;
      const S = w.def.sec, s0 = S.BtnJudgePage, s1 = S.BtnMeridianPage;
      if (s0 && s1) { const d = document.createElement("div"); Object.assign(d.style, { position: "absolute", left: s0.x + "px", top: s0.y + "px", width: s1.x + s1.w - s0.x + "px", height: s0.h + "px", background: "#1b1d1a", pointerEvents: "none" }); w.el.appendChild(d); }
      // bảng thông tin chung: phủ phần chỉ số của trang Thuộc tính (từ dưới ô chân dung) bằng vân hoa của chính nền trang (dải trống y 98–142, lật xen kẽ)
      const pg = w.pages[A] && w.pages[A].el;
      if (pg) {
        const phu = document.createElement("div"); phu.className = "soi-phu"; pg.appendChild(phu);
        const nen = (W.M.status.pages.attr.sec.Main || {}).img;
        if (nen) { const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = 314; c.height = 280; const g = c.getContext("2d"); g.fillStyle = "#151714"; g.fillRect(0, 0, 314, 280);
          for (let y = 0, i = 0; y < 280; y += 44, i++) { g.save(); if (i % 2) { g.translate(0, y + 44); g.scale(1, -1); g.drawImage(im, 0, 98, 314, 44, 0, 0, 314, 44); } else g.drawImage(im, 0, 98, 314, 44, 0, y, 314, 44); g.restore(); }
          phu.style.backgroundImage = `url(${c.toDataURL()})`; }; im.src = W.base + nen.file; }
        w.soiTT = document.createElement("div"); w.soiTT.className = "soi-tt"; pg.appendChild(w.soiTT);
      }
      for (const s of EQUIP_SLOTS) {
        const el = w.node(s, E); if (!el) continue;
        el.classList.add("jw-slot");
        el.oncontextmenu = (e) => e.preventDefault();
        el.onmousemove = (e) => { const it = w.soi.equip[s]; if (it) this._showTip(it, e, undefined, s, undefined, w.soi); else this._hideTip(); };
        el.onmouseleave = () => this._hideTip();
      }
      w.cb.hide = () => this._hideTip();
      const m = w.def.sec.Main;
      Object.assign(w.el.style, { left: Math.round((1024 - m.w) / 2) + "px", top: Math.round((768 - m.h) / 2) + "px" });
    }
    w.soi = { ...nv, equip: nv.equip || {} };
    w.hideItem("Male", nv.sex === "f", E).hideItem("Female", nv.sex !== "f", E);
    w.set("Name", nv.name, E).set("PKValue", 0, E).set("TransLife", "", E);
    for (const s of EQUIP_SLOTS) {
      const el = w.node(s, E); if (!el) continue;
      const x = w.soi.equip[s] && ItemDB.item(w.soi.equip[s].k);
      el.querySelector("img")?.remove();
      if (x && x.ic) { const im = document.createElement("img"); im.src = "assets/web/icon/" + x.ic; im.className = "jw-icon"; el.appendChild(im); }
    }
    // thẻ Thuộc tính (mẫu B)
    this._suaNen(w, "Thông tin nhân vật");
    const P = this.api.P, f = nv.fac == null ? null : (P.factions || []).find((x) => x.id === nv.fac), PT = W.portrait, anh = nv.portrait && PT && PT.list[nv.portrait - 1];
    const face = w.node("Face", A);
    if (face) { face.style.backgroundImage = anh ? `url(${W.base}${anh.file})` : ""; face.style.backgroundSize = "100% 100%"; face.innerHTML = anh ? "" : `<span class="soi-chua">Chưa chọn chân dung</span>`; }
    w.set("Name", nv.name, A).set("Title", xungHieu(f && f.key, nv.lvl), A).set("Luck", 0, A).set("Prestige", 0, A).set("Level", nv.lvl || 1, A).set("WorldRank", nv.hang || "-", A);
    if (w.soiTT) {
      const B = nv.bang, bh = B && B.ten ? `<span class="lam">${esc(B.ten)}</span>${B.cv ? ` (${esc(B.cv)})` : ""}` : them.bh ? `<span class="lam">${esc(String(them.bh).replace(/\(([^()]*)\)$/, " ($1)"))}</span>` : "—";
      const he = nv.series | 0, hi = P.hud && P.hud.seriesImg ? P.hud.seriesImg(he) : null;
      const dong = [["Môn phái", f ? `<span class="vang">${esc(f.n)}</span>` : "Vô môn phái"], ["Bang hội", bh],
        ["Ngũ hành", `${hi ? `<img src="${hi.src}" alt="">` : ""}${SERIES[he] ?? ""}`], ["Giới tính", nv.sex === "f" ? "Nữ" : "Nam"], ...(them.noi ? [["Đang ở", `<span class="lam">${esc(them.noi)}</span>`]] : [])];
      w.soiTT.innerHTML = `<div class="soi-bang">${dong.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join("")}</div><div class="soi-chu">Chỉ số chi tiết là bí mật của mỗi người</div>`;
    }
    if (w.soiTab) w.soiTab(A); else w.page(E).check("BtnEquipPage", true);
    this._hideTip();
    w.show();
  }

  // Hình nền client của khung Nhân vật (status / soido chung định nghĩa) in sẵn tiêu đề "Hướng dẫn hoạt động" và nhãn "Xếp hàng" (sai chính tả) — anh 17/11:
  // phủ dải tiêu đề bằng vân không chữ của chính dải đó (x 61–85, lật xen kẽ) rồi ghi chu; nhãn ở trang Thuộc tính (chữ 201,215,163 tại x 199–256, y 53–70):
  // xóa chữ cũ bằng điểm nền gần nhất cùng hàng (giữ vân), ghi "Xếp hạng" cùng màu, canh phải như cũ. Chỉ phủ DOM — không sửa hình client
  _suaNen(w, chu) {
    if (w.suaNen === chu) return;
    const lan1 = w.suaNen === undefined; w.suaNen = chu;
    let td = w.el.querySelector(".jw-td");
    if (!td) { td = document.createElement("div"); td.className = "jw-td"; w.el.appendChild(td); }
    td.textContent = chu;
    if (!lan1) return;
    const W = this.W, M = W.M.status, nap = (f, cb) => { const im = new Image(); im.onload = () => cb(im); im.src = W.base + f; };
    nap(M.sec.Main.img.file, (im) => {
      const c = document.createElement("canvas"); c.width = 196; c.height = 25; const g = c.getContext("2d");
      for (let x = 0, i = 0; x < 196; x += 24, i++) { g.save(); if (i % 2) { g.translate(x + 24, 0); g.scale(-1, 1); g.drawImage(im, 61, 5, 24, 25, 0, 0, 24, 25); } else g.drawImage(im, 61, 5, 24, 25, x, 0, 24, 25); g.restore(); }
      td.style.backgroundImage = `url(${c.toDataURL()})`;
    });
    const pa = M.pages && M.pages.attr && M.pages.attr.sec.Main && M.pages.attr.sec.Main.img, pg = w.pages.attr && w.pages.attr.el;
    if (!pa || !pg) return;
    const nh = document.createElement("div"); nh.className = "jw-xh"; nh.textContent = "Xếp hạng"; pg.appendChild(nh);
    nap(pa.file, (im) => {
      const X = 199, Y = 53, R = 57, H = 17, c = document.createElement("canvas"); c.width = R; c.height = H; const g = c.getContext("2d");
      g.drawImage(im, X, Y, R, H, 0, 0, R, H);
      const d = g.getImageData(0, 0, R, H), p = d.data, sang = (i) => p[i] + p[i + 1] + p[i + 2] > 300;
      for (let y = 0; y < H; y++) for (let x = 0; x < R; x++) {
        const i = (y * R + x) * 4; if (!sang(i)) continue;
        let j = -1; for (let k = 1; k < R && j < 0; k++) for (const xx of [x - k, x + k]) if (xx >= 0 && xx < R && !sang((y * R + xx) * 4)) { j = (y * R + xx) * 4; break; }
        if (j >= 0) { p[i] = p[j]; p[i + 1] = p[j + 1]; p[i + 2] = p[j + 2]; p[i + 3] = p[j + 3]; }
      }
      g.putImageData(d, 0, 0); nh.style.backgroundImage = `url(${c.toDataURL()})`;
    });
  }

  // ---------- Chọn chân dung (玩家头像.ini + settings/portrait.ini: 34 hình 70×70) ----------
  _portrait() {
    const w = this.W.get("portrait"), api = this.api, sec = w.def.sec, S = sec.Set || {}, P = this.W.portrait;
    if (!P || !P.list.length) return;
    const [cw, ch] = P.size, cols = S.column || 5, rows = S.line || 3, gx = S.spacingH || 10, gy = S.spacingV || 23;
    const clip = document.createElement("div");
    clip.className = "jw-clip";
    Object.assign(clip.style, { left: (S.listLeft || 17) + "px", top: (S.listTop || 60) + "px", width: cols * cw + (cols - 1) * gx + "px", height: rows * ch + (rows - 1) * gy + "px" });
    const inner = document.createElement("div");
    inner.style.position = "absolute";
    P.list.forEach((im, i) => {
      const d = document.createElement("div");
      d.className = "jw-face";
      Object.assign(d.style, { left: (i % cols) * (cw + gx) + "px", top: Math.floor(i / cols) * (ch + gy) + "px", width: cw + "px", height: ch + "px", backgroundImage: `url(${this.W.base}${im.file})` });
      d.onclick = () => { this.pSel = i + 1; inner.querySelectorAll(".jw-face").forEach((e, j) => e.classList.toggle("on", j === i)); };
      d.ondblclick = () => w.it.Confirm.fn();
      inner.appendChild(d);
    });
    clip.appendChild(inner);
    w.el.appendChild(clip);
    // cuộn theo hàng: lăn chuột / bấm thanh cuộn (ScrollBar: nút chạy từ SlideBegin tới SlideEnd)
    const total = Math.ceil(P.list.length / cols), maxRow = Math.max(0, total - rows), sb = sec.ScrollBar, bar = w.node("ScrollBar"), knob = w.node("ScrollBar_Btn");
    if (bar && knob) bar.appendChild(knob);
    let row = 0;
    const go = (r) => {
      row = Math.max(0, Math.min(maxRow, r));
      inner.style.top = -row * (ch + gy) + "px";
      if (knob) knob.style.top = sb.slideBegin + (maxRow ? row / maxRow : 0) * (sb.slideEnd - sb.slideBegin - sec.ScrollBar_Btn.h) + "px";
    };
    clip.onwheel = (e) => { e.preventDefault(); go(row + Math.sign(e.deltaY)); };
    if (bar) bar.onmousedown = (e) => { const r = bar.getBoundingClientRect(), y = (e.clientY - r.top) / (r.height / sb.h); go(Math.round(((y - sb.slideBegin) / (sb.slideEnd - sb.slideBegin)) * maxRow)); };
    w.on("Confirm", () => { if (this.pSel) { api.hero().portrait = this.pSel; api.save(); this.refresh(true); } w.hide(); });
    w.on("Cancel", () => w.hide());
    w.cb.show = () => {
      this.pSel = api.hero().portrait || 0;
      inner.querySelectorAll(".jw-face").forEach((e, j) => e.classList.toggle("on", j + 1 === this.pSel));
      go(this.pSel ? Math.floor((this.pSel - 1) / cols) - 1 : 0);
    };
  }

  // ---------- Thuộc tính khác (玩家其它属性.ini: 26 dòng N_msg / N_id của client) ----------
  _other() {
    const w = this.W.get("other"), L = w.def.sec.AttribList;
    const rows = Object.keys(L).filter((k) => /^\d+_msg$/.test(k)).sort((a, b) => parseInt(a) - parseInt(b)).map((k) => ({ n: L[k], id: L[k.replace("_msg", "_id")] }));
    const box = w.node("AttribList"), gap = L.rowInterval || 4;
    box.classList.add("jw-list");
    box.innerHTML = rows.map((r) => `<div class="jw-row" style="margin-bottom:${gap}px;color:rgb(${L.msgColor || [255, 255, 255]})"><span>${esc(r.n)}</span><b data-id="${r.id}">-</b></div>`).join("");
    box.onwheel = (e) => { e.preventDefault(); box.scrollTop += Math.sign(e.deltaY) * 18; };
    box.title = "Giá trị tính từ trang bị — làm ở M4";
    w.hideItem("AttribListScroll_Btn", true);
  }
  _fillOther() {}

  // ---------- Kỳ Trân Các (奇珍阁界面.ini) + Giỏ hàng (奇珍阁购物车.ini) ----------
  // Bày hàng 27/10 (anh gửi ảnh Kỳ Trân Các game thật — "đủ như ảnh, giá anh điều chỉnh sau"): thẻ + hàng + giá Xu = ItemDB.ktc.the
  // (assets/data/ky-tran-cac.json — cong-cu/dung-ky-tran-cac.js). Ô hàng (mục MarketGoods 171×75 không có tọa độ — máy tự xếp): lưới 3 × 5
  // vừa khung nền; trong ô theo ini: tên (MarketGoods_GoodsName), ô món 26 × 26 (_ItemBox), "Giá gốc:" / "Giá thực:" + số Xu (_OriginalPrice /
  // _Price / _Number — bản mình không giảm giá: 2 số bằng nhau như ảnh), nút Mua (_Buy). Mua: khung nhập số lượng (Enter = 1) -> hỏi xác nhận ->
  // máy chủ trừ Xu (act muaKtc — may-chu/do.js). Xu có từ đăng nhập nhận thưởng + Tiền trang Ba Lăng (đổi ngân lượng).
  _market() {
    const w = this.W.get("market"), api = this.api, sec = w.def.sec;
    for (const k of w.def.order) if (/^MarketGoods_/.test(k)) w.hideItem(k, true);
    const THE = ItemDB.ktc.the || [], c = (a) => `rgb(${a.join(",")})`;
    // trang của từng thẻ: 15 ô / trang, { trangMoi } sang trang mới (thẻ Bí Kíp như ảnh: trang 3 mở đầu bằng Đại Thành Bí Kíp)
    // anh 16/11 — hàng sự kiện (dòng có sk — "bdas" Báo Đáp Ân Sư): chỉ bày khi sự kiện đang mở (_skMo); tính lại trang mỗi lần vẽ (sự kiện mở / đóng lúc đang chơi)
    const trangCua = (t) => { const P = [[]]; for (const o of t.hang) { if (o.trangMoi) { if (P[P.length - 1].length) P.push([]); continue; } if (o.sk && !this._skMo(o.sk)) continue; if (P[P.length - 1].length >= 15) P.push([]); P[P.length - 1].push(o); } return P; };
    this.ktcTrang = THE.map(trangCua);
    const tpl = w.node("SellType"), st = sec.SellType;
    tpl.remove();
    const tabs = THE.map((t, i) => {
      const el = tpl.cloneNode(true);
      el.style.left = st.x + i * (st.w + 2) + "px";
      el.querySelector(".jw-t").textContent = t.n;
      const item = { s: st, el, lab: el.querySelector(".jw-t"), on: false, dis: false, over: false };
      w._wire(item, "SellType");
      item.fn = () => { tabs.forEach((x, j) => { x.on = j === i; w._paint(x); }); this.shopTab = i; this.ktcSo = 0; ve(); };
      w.el.appendChild(el);
      w._paint(item);
      return item;
    });
    // tiêu đề (anh 27/10 "đổi cả giao diện, font lệch với game"): ảnh nền đã xóa chữ "KỲ TRÂN CÁC" vẽ sẵn (chữ đen trên dải sáng — cong-cu/
    // dung-khung-cua-hang.mjs) -> viết như tiêu đề các khung khác của client (Phần thưởng nhiệm vụ: chữ sáng ~155–190 xanh xám, đậm, viền đen 1 điểm)
    // bằng Vn.fon 16 của game, giữa 2 đồng tiền trang trí của dải
    const tieuDe = document.createElement("div");
    Object.assign(tieuDe.style, { position: "absolute", left: "215px", top: "27px", width: "146px", height: "16px", font: '16px/16px "VK Sans Serif 16", monospace', letterSpacing: "1px",
      // chữ đậm như tiêu đề client: vẽ lặp lệch 1 điểm (font điểm ảnh không có kiểu đậm) + viền đen bao cả 2 lớp
      color: "rgb(170,196,185)", textAlign: "center", whiteSpace: "pre", pointerEvents: "none", textShadow: "1px 0 0 rgb(170,196,185),2px 0 #010101,-1px 0 #010101,0 1px #010101,0 -1px #010101,1px 1px #010101,1px -1px #010101,2px 1px #010101,2px -1px #010101,-1px 1px #010101,-1px -1px #010101" });
    tieuDe.textContent = "Kỳ Trân Các";
    w.el.appendChild(tieuDe);
    const g = sec.MarketGoods, cols = 3, rows = 5, x0 = 24, y0 = 108, gx = 9, gy = 3;
    const S = (k) => sec["MarketGoods_" + k] || {}, txt = (s, html, extra = {}) => {
      const d = document.createElement("div");
      // cùng font với thẻ / nút của khung và các khung khác: Vn.fon 13 đúng cỡ 13 điểm (anh 27/10 "font lệch với game" — bản trước cỡ 12 làm font
      // điểm ảnh bị co, nhòe), không viền như ini, mép trên dòng chữ ở Top của ini
      Object.assign(d.style, { position: "absolute", left: s.x + "px", top: s.y + "px", width: (s.w || 60) + "px", height: "13px", font: '13px/13px "VK Sans Serif 13", monospace', color: c(s.color || [255, 255, 255]),
        textAlign: s.hAlign === 1 ? "center" : s.hAlign === 2 ? "right" : "left", whiteSpace: "pre", overflow: "hidden", pointerEvents: "none", ...extra });
      d.innerHTML = html; return d;
    };
    const IB = S("ItemBox"), BUY = S("Buy"), btnTpl = w.node("MarketGoods_Buy");
    const o = Array.from({ length: cols * rows }, (_, i) => {
      const d = document.createElement("div");
      d.className = "jw-i jw-goods";
      Object.assign(d.style, { left: x0 + (i % cols) * (g.w + gx) + "px", top: y0 + Math.floor(i / cols) * (g.h + gy) + "px", width: g.w + "px", height: g.h + "px", pointerEvents: "auto" });
      if (g.img) w._img(d, g.img, 0);
      const ten = txt(S("GoodsName"), ""), goc = txt(S("OriginalPrice"), "Giá gốc:"), thuc = txt(S("Price"), "Giá thực:");
      const so1 = txt(S("OriginalPrice_Number"), ""), so2 = txt(S("Price_Number"), "");
      const xu1 = txt({ ...S("OriginalPrice_Number"), x: S("OriginalPrice_Number").x + S("OriginalPrice_Number").w + 3, w: 20 }, "Xu"), xu2 = txt({ ...S("Price_Number"), x: S("Price_Number").x + S("Price_Number").w + 3, w: 20 }, "Xu");
      const box = document.createElement("div");
      Object.assign(box.style, { position: "absolute", left: IB.x + "px", top: IB.y + "px", width: IB.w + "px", height: IB.h + "px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "inherit" });
      const btn = btnTpl.cloneNode(true); btn.style.display = ""; btn.style.left = BUY.x + "px"; btn.style.top = BUY.y + "px";
      const bi = { s: BUY, el: btn, lab: btn.querySelector(".jw-t"), on: false, dis: false, over: false };
      w._wire(bi, "MarketGoods_Buy"); w._paint(bi);
      d.append(ten, box, goc, thuc, so1, so2, xu1, xu2, btn);
      w.el.appendChild(d);
      return { d, ten, box, so1, so2, bi };
    });
    const ve = () => {
      this.ktcTrang = THE.map(trangCua); // hàng sự kiện bật / tắt theo ngày (anh 16/11)
      const P = this.ktcTrang[this.shopTab | 0] || [[]], n = Math.max(1, P.length), so = Math.min(this.ktcSo | 0, n - 1), L = P[so] || [];
      w.set("PageInfo", `${so + 1}/${n}`);
      o.forEach((q, i) => {
        const h = L[i], x = h && ItemDB.item(h.k);
        q.d.style.visibility = x ? "visible" : "hidden";
        if (!x) return;
        q.ten.textContent = x.n.trim(); q.so1.textContent = q.so2.textContent = h.gia;
        q.box.innerHTML = x.ic ? `<img src="assets/web/icon/${esc(x.ic)}" alt="" style="max-width:${IB.w + 6}px;max-height:${IB.h + 6}px;image-rendering:pixelated">` : "";
        // món mua bằng Xu khóa bảo hiểm vĩnh viễn (anh 12/11 — may-chu/do.js muaKtc): ô xem hiện sẵn dòng khóa + cách hủy như món sẽ nhận
        const it = { k: h.k, kbh: 2 }, KHOA_XU = "Không giao dịch, bày bán, vứt, bán — hủy ở Lễ quan (Ba Lăng)";
        q.box.onmousemove = (e) => this._showTip(it, e, x.dung ? [KHOA_XU, "Bấm Mua để mua"] : [x.goiY || "Chưa dùng được (game chưa có chức năng này)", KHOA_XU, "Bấm Mua để mua"], null, h.gia);
        q.box.onmouseleave = () => this._hideTip();
        q.bi.fn = () => { this._hideTip(); api.P.audio.ui("click"); this._ktcMua(h, x); };
      });
    };
    this._ktcVe = ve;
    const trang = (d) => { const n = (this.ktcTrang[this.shopTab | 0] || []).length; if (n < 2) return; this.ktcSo = ((this.ktcSo | 0) + d + n) % n; this._hideTip(); ve(); };
    w.on("LeftBtn", () => trang(-1)).on("RightBtn", () => trang(1));
    w.on("PrePaid", () => api.msg(`Trên người có ${fmt(api.hero().xu | 0)} Xu — đổi ngân lượng lấy Xu ở Chủ tiền trang (Ba Lăng), nhận Xu mỗi ngày ở Đăng nhập nhận thưởng`));
    w.on("ShoppingCart", () => api.msg("Bấm nút Mua ở từng món để mua"));
    w.cb.hide = () => this._hideTip();
    w.cb.show = () => ve(); // mở lại khung: hàng sự kiện theo trạng thái lúc này (anh 16/11 — Báo Đáp Ân Sư)
    if (tabs.length) tabs[0].fn();
  }
  // hàng sự kiện sk của Kỳ Trân Các đang bán? "bdas" — Báo Đáp Ân Sư (anh 16/11): luat().baoDapAnSu.dang (main.js đè bằng trạng thái mới nhất Võ Sư / Cung Nữ hỏi)
  // và hôm nay (giờ Việt Nam) chưa tới ngày đóng den; máy chủ cũng chặn (do.js muaKtc). Sự kiện khác chưa có -> không bày
  _skMo(sk) {
    if (sk !== "bdas") return false;
    const B = (this.api.luat() || {}).baoDapAnSu, nay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    if (this.api.quanTri && this.api.quanTri()) return true; // quản trị thử ngoài ngày sự kiện (anh 16/11 — máy chủ cũng cho: do.js skMo)
    // theo ngày (tu ≤ hôm nay < den) chứ không theo cờ dang chụp lúc vào game — người vào trước 0 giờ ngày mở vẫn thấy hàng (soát 16/11)
    if (B && B.tu && B.bat !== undefined) return B.bat !== false && B.tu <= nay && (!B.den || nay < B.den);
    return !!(B && B.dang) && (!B.den || nay < B.den);
  }
  // mua món Kỳ Trân Các: khung mua bán của client (Số lượng / Tổng + − / Giá Xu / Mua tối đa) — 1 bước, Xác nhận là mua
  _ktcMua(h, x) {
    // chỉ mua ở thành thị / thôn trang, ở bãi luyện công chỉ xem (anh 28/10 lần 3 — máy chủ cũng chặn: may-chu/do.js muaKtc)
    if (this.api.oThanh && !this.api.oThanh()) return this.bao("Bảo vật chỉ mua được ở <color=yellow>thành thị<color> hoặc <color=yellow>thôn trang<color> — ở bãi luyện công chỉ xem được.");
    const co = this.api.hero().xu | 0;
    if (co < h.gia) return this.bao(`Không đủ Xu — <color=yellow>${x.n.trim()}<color> giá ${h.gia} Xu, trên người có ${co} Xu.<enter>Đổi ngân lượng lấy Xu ở Chủ tiền trang (Ba Lăng).`);
    this._tradeOpen("ktc", { k: h.k, gia: h.gia });
  }
  _cart() {
    const w = this.W.get("cart"), api = this.api;
    for (const k of w.def.order) if (/^GoodsInfo/.test(k)) w.hideItem(k, true);
    w.on("PrePaid", () => api.msg("Nạp thẻ: " + SERVER_ONLY));
    w.on("ConfirmBuy", () => api.msg("Giỏ hàng trống"));
    w.cb.show = () => w.set("TotalCostValueText", 0).set("TotalSaveValueText", 0).set("OwnValueText", fmt(api.hero().coin || 0));
  }

  // ---------- Tổ đội / Bang phái / Phòng chat: khung client, nút báo cần máy chủ ----------
  _server(w, names) { for (const n of names) if (w.it[n]) w.on(n, () => this.api.msg(`${w.def.n}: ${SERVER_ONLY}`)); }
  // Tổ đội (队伍管理.ini — anh 28/10 lần 4 làm thật: may-chu/to-doi.js, main.js doiLam / doiApply -> teamFill). Trái "Nhóm của mình"
  // (MemberList 8 dòng × 14 = tối đa 8 người như client — số đội viên theo sức thống soái của đội trưởng; đội trưởng dòng đầu chữ vàng, người đã
  // rời game chữ xám), phải "Người chơi" cùng bãi
  // chưa ở trong đội (NearbyList — World.others). Bấm dòng để chọn: Mời nhóm (người chọn bên phải, hoặc tên gõ ở ô Tìm kiếm — Enter cũng mời;
  // bấm đúp tên bên phải cũng mời), Trục xuất / Giao quyền (người chọn bên trái — chỉ đội trưởng; hình nút Giao quyền của client không có chữ ->
  // viết chữ lên), Cập nhật (vẽ lại danh sách người chơi), Rời nhóm / Giải tán cùng 1 chỗ (đội trưởng thấy Giải tán), ô "Lập nhóm" (anh 28/10 lần 6
  // theo engine KPlayer::SetTeamState): chưa có đội -> lập đội (mở); đội trưởng -> mở / đóng nhận người (đánh dấu = đang mở = cờ trên đầu); đội
  // viên: không đổi được
  _team() {
    const w = this.W.get("team"), api = this.api, sec = w.def.sec, L = sec.MemberList, Nb = sec.NearbyList, c = (x) => "rgb(" + x.join(",") + ")";
    const vien = (x) => ["1px 0", "-1px 0", "0 1px", "0 -1px"].map((o) => o + " " + c(x)).join(",");
    this.doiTt = null;
    let chonTv = null, chonGan = null;
    w.hideItem("NearbyScroll_Btn", true);
    Object.assign(sec.Appoint, { color: [169, 211, 190], overColor: [124, 255, 125], disableColor: [100, 100, 100] }); // màu chữ như nút thẻ client
    w.set("Appoint", "Giao quyền");
    const boxM = w.node("MemberList"), boxN = w.node("NearbyList");
    boxM.classList.add("jw-list"); boxN.classList.add("jw-list");
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = sec.InputEdit.maxLen || 16; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "tim-nguoi";
    Object.assign(inp.style, { color: c(sec.InputEdit.color), textAlign: "left" });
    w.node("InputEdit").appendChild(inp);
    const moi = () => {
      const ten = inp.value.trim() || chonGan;
      if (!ten) return api.msg("Chọn người chơi ở danh sách bên phải hoặc gõ tên vào ô Tìm kiếm");
      api.doi({ viec: "moi", ten }).then((j) => { if (j) inp.value = ""; });
    };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") moi(); else if (e.key === "Escape") inp.blur(); };
    const dong = (ten, chon, mau, vm) => `<div class="jw-mem" data-ten="${esc(ten)}" style="cursor:pointer;color:${c(mau)};text-shadow:${vien(vm)};${chon ? "background:" + c(L.selItemBgColor) : ""}">${esc(ten)}</div>`;
    const draw = () => {
      const t = this.doiTt, h = api.hero(), toi = h && h.name, truong = !!t && t.truong === toi, W0 = api.world();
      if (t && chonTv && !t.tv.some((x) => x.ten === chonTv)) chonTv = null;
      w.check("CloseTeam", !!t && !!t.mo);
      w.hideItem("Leave", truong).hideItem("Dismiss", !truong);
      w.disable("Kick", !truong || !chonTv || chonTv === toi).disable("Appoint", !truong || !chonTv || chonTv === toi).disable("Leave", !t).disable("Invite", !!t && !truong);
      boxM.innerHTML = t ? t.tv.slice(0, 8).map((x, i) => dong(x.ten, x.ten === chonTv, !x.on ? [140, 140, 140] : i === 0 ? L.selColor : L.color, i === 0 ? L.selBorderColor : L.borderColor)).join("") : "";
      const trong = new Set(t ? t.tv.map((x) => x.ten) : []);
      const gan = W0 ? [...W0.others.values()].map((o) => o.name).filter((n) => !trong.has(n)).sort() : [];
      if (chonGan && !gan.includes(chonGan)) chonGan = null;
      boxN.innerHTML = gan.slice(0, 8).map((n) => dong(n, n === chonGan, Nb.color, Nb.borderColor)).join("");
      // tài lãnh đạo = cấp thống soái của mình (nhân vật mới cấp 1 — newplayerini ileadlevel=1; lên cấp khi làm đội trưởng và đội chia kinh
      // nghiệm — may-chu/do.js themThongSoai; cấp càng cao dẫn càng nhiều đội viên — to-doi.js)
      w.set("LeaderAbility", (h && h.leadLv) || 1);
    };
    const ten = (e) => { const d = e.target.closest("[data-ten]"); return d ? d.dataset.ten : null; };
    boxM.onclick = (e) => { const n = ten(e); if (n) { chonTv = n; draw(); } };
    boxN.onclick = (e) => { const n = ten(e); if (n) { chonGan = n; inp.value = ""; draw(); } };
    boxN.ondblclick = (e) => { const n = ten(e); if (n) { chonGan = n; inp.value = ""; moi(); } };
    w.on("Invite", moi);
    w.on("Kick", () => chonTv && api.doi({ viec: "duoi", ten: chonTv }));
    w.on("Appoint", () => chonTv && api.doi({ viec: "giao", ten: chonTv }));
    w.on("Refresh", draw);
    w.on("Leave", () => api.doi({ viec: "roi" }));
    w.on("Dismiss", () => api.doi({ viec: "giai" }));
    w.on("CloseTeam", () => {
      const t = this.doiTt;
      if (!t) api.doi({ viec: "lap" });
      else if (t.truong === (api.hero() || {}).name) api.doi({ viec: "mo", on: t.mo ? 0 : 1 });
      else api.msg("Chỉ nhóm trưởng mới mở / đóng nhận người vào nhóm");
      draw();
    });
    w.on("Cancel", () => w.hide());
    w.cb.show = draw;
    w.cb.hide = () => inp.blur();
    this.teamFill = (d) => { this.doiTt = d; if (w.visible) draw(); };
    draw();
  }
  // ---------- Bang phái (_faction - khôi phục) ----------
  _faction() {
    const w = this.W.get("faction"), api = this.api;
    if (!w) return;
    const CV_TEN = { chu: "Bang chủ", lao: "Trưởng Lão", doi: "Đội trưởng", de: "Đệ tử", an: "Ẩn sỹ" };
    const PHE_TEN = { 1: "Chính phái", 2: "Tà phái", 3: "Trung lập" };
    const QUYEN_DS = [
      ["BtnDepose", "1001", "Bổ nhiệm / Chiêu mộ"],
      ["BtnChangeCamp", "1002", "Đổi phe bang hội"],
      ["BtnChangeTitle", "1003", "Đổi danh hiệu"],
      ["BtnKickOut", "1004", "Trục xuất thành viên"],
      ["BtnRecordEvent", "1005", "Sửa công cáo / Ký lục"],
      ["BtnUpgradeBuildLevel", "2001", "Tăng cấp bang hội"],
      ["BtnFundManagement", "2002", "Quản lý ngân quỹ"],
      ["BtnWorkshopManagement", "2003", "Quản lý tác phường"],
      ["BtnMapManagement", "2004", "Quản lý khu vực bang"],
      ["BtnWeekGoalManagement", "2005", "Mục tiêu tuần / Tế Đàn"]
    ];
    const TP_DS = [
      { k: "leVat", ten: "Khu Lễ vật" },
      { k: "binhGiap", ten: "Binh giáp phường" },
      { k: "thienCong", ten: "Thiên công phường" },
      { k: "diDung", ten: "Dị dung phường" },
      { k: "thienY", ten: "Thiên ý phường" },
      { k: "thiLuyen", ten: "Thí luyện phường" },
      { k: "hoatDong", ten: "Hoạt động phường" }
    ];
    const st = {
      bh: null, ds: null, coBh: null, trang: "base", tvTrang: 0, tvOn: false,
      chon: null, tpChon: "leVat", subFun: 1, recTab: "announce", sua: false,
      cm: null, cmSua: false, q: null, qSua: false, dsLuc: 0, loi: "",
      oz: 0, ozChon: null, donChon: null, xin: new Set(), cho: 0
    };
    this._bh = st;
    BH_CONG = () => ((st.bh && st.bh.toi && st.bh.toi.cong) | 0);

    const B = () => st.bh;
    const goi = (viec, them = {}) => api.bh({ viec, ...them }, { im: true }).then((j) => {
      if (j && j.loi && !j.boQua) this.bao(esc(j.loi));
      return j;
    });
    const tai = (luc) => {
      const co = !!(api.bhMinh && api.bhMinh());
      if (!luc && st.dsLuc && performance.now() - st.dsLuc < 1500) return;
      st.dsLuc = performance.now();
      api.bh({ viec: co ? "xem" : "ds" }, { im: true }).then(() => ve());
    };
    const taiDs = () => api.bh({ viec: "ds" }, { im: true }).then(() => ve());

    // Hộp nhập chữ / số dùng lại khung bhDanhHieu sẵn có trong win.json
    const nhapO = (tieuDe, giaTri, cb) => {
      const d = this.W.get("bhDanhHieu"); if (!d) return;
      d.set("Target", tieuDe);
      const box = d.node("EditTitle");
      let inp = box && box.querySelector("input");
      if (box && !inp) {
        box.innerHTML = "";
        inp = document.createElement("input");
        Object.assign(inp.style, { width: "100%", height: "100%", boxSizing: "border-box", background: "#1b140d", color: "#ffe9a8", border: "1px solid #6b532e", padding: "1px 4px" });
        box.appendChild(inp);
      }
      if (inp) inp.value = giaTri == null ? "" : String(giaTri);
      d.on("Cancel", () => d.hide());
      d.on("Confirm", () => { const v = (inp && inp.value || "").trim(); d.hide(); if (cb) cb(v); });
      d.show();
      if (inp) { inp.focus(); inp.select(); }
    };

    const makeBox = (pg, key, styleExtra = {}) => {
      const el = w.node(key, pg);
      if (!el) return null;
      el.innerHTML = "";
      Object.assign(el.style, {
        overflowY: "auto", overflowX: "hidden", color: "#f6e7c1",
        fontSize: "12px", lineHeight: "17px", padding: "2px 4px", boxSizing: "border-box",
        ...styleExtra
      });
      return el;
    };
    const makeInput = (pg, key, multi = false) => {
      const el = w.node(key, pg);
      if (!el) return null;
      el.innerHTML = "";
      const inp = document.createElement(multi ? "textarea" : "input");
      Object.assign(inp.style, {
        width: "100%", height: "100%", boxSizing: "border-box",
        background: "rgba(18,14,10,0.75)", color: "#ffe9a8",
        border: "1px solid #6b532e", font: "inherit", padding: "2px 4px", resize: "none"
      });
      el.appendChild(inp);
      return inp;
    };

    const tvBoxes = {};
    for (const pg of ["base", "workshop", "funuse", "right"]) {
      tvBoxes[pg] = makeBox(pg, "MemberList");
      w.on("BtnOnlinePriority", () => { st.tvOn = !st.tvOn; st.tvTrang = 0; ve(); }, pg);
      w.on("BtnPrevPage", () => { if (st.tvTrang > 0) { st.tvTrang--; ve(); } }, pg);
      w.on("BtnNextPage", () => { st.tvTrang++; ve(); }, pg);
    }

    const inpJiyu = makeInput("zhaomu", "Jiyu", true);
    const inpAutoLv = makeInput("zhaomu", "AutoAcceptLevel", false);
    const boxApply = makeBox("zhaomu", "ApplyerList");
    const boxRec = makeBox("record", "RecordList_List") || makeBox("record", "RecordList");
    const inpCc = makeInput("record", "AnnounceEditor", true);
    const boxWarn = makeBox("workshop", "WarnInfo");

    const addSmallBtn = (parent, text, rightPx, bottomPx, fn) => {
      if (!parent) return null;
      const b = document.createElement("button");
      b.type = "button"; b.textContent = text;
      Object.assign(b.style, {
        position: "absolute", right: rightPx + "px", bottom: bottomPx + "px", zIndex: 5,
        background: "#4a2c14", color: "#ffe28a", border: "1px solid #b5893e",
        padding: "2px 8px", fontSize: "12px", cursor: "pointer", borderRadius: "2px"
      });
      b.onclick = (e) => { e.stopPropagation(); fn(); };
      parent.appendChild(b);
      return b;
    };
    addSmallBtn(w.pages.record && w.pages.record.el, "Mở Tế Đàn", 12, 12, () => api.teDan && api.teDan());
    addSmallBtn(w.pages.workshop && w.pages.workshop.el, "Sử dụng Tác phường", 12, 12, () => {
      if (st.tpChon === "leVat") api.leVat && api.leVat();
      else if (api.tacPhuong) api.tacPhuong(st.tpChon);
    });
    addSmallBtn(w.pages.workshop && w.pages.workshop.el, "Đặc kỹ bang", 150, 12, () => api.dacKy && api.dacKy());

    const TAB_MAP = {
      base: "BtnBaseInfo", zhaomu: "BtnZhaoMu", otherzhaomu: "BtnOtherZhaoMu",
      workshop: "BtnWorkshop", funuse: "BtnFunUse", right: "BtnRightManage", record: "BtnTongRecord"
    };
    for (const [pg, btn] of Object.entries(TAB_MAP)) {
      w.on(btn, () => {
        if (pg !== "otherzhaomu" && !B()) { st.trang = "otherzhaomu"; taiDs(); return; }
        st.trang = pg;
        if (pg === "otherzhaomu") taiDs();
        ve();
      });
    }
    w.on("BtnRefresh", () => tai(true));
    w.on("BtnTongList", () => this._bhDs());
    w.on("BtnEnterMap", () => api.khuVao && api.khuVao());
    w.on("BtnTongHelp", () => this.bao("Gặp <color=yellow>Người hướng dẫn bang hội<color> tại Ba Lăng huyện hoặc Biện Kinh để lập bang, mở Tế Đàn và Lễ phẩm phường.<enter>Phím tắt: <color=yellow>Ctrl+B<color> mở khung Bang phái · <color=yellow>Ctrl+chuột phải<color> người chơi để mời vào bang."));

    // --- Trang Chiêu mộ (zhaomu) ---
    w.on("Save", () => {
      goi("chieuMo", { bat: 1, text: (inpJiyu && inpJiyu.value || "").trim(), cap: +(inpAutoLv && inpAutoLv.value) || 0, phai: "" });
    }, "zhaomu");
    w.on("AcceptApply", () => { if (st.donChon) goi("duyet", { ten: st.donChon, dong: 1 }); }, "zhaomu");
    w.on("RefuseApply", () => { if (st.donChon) goi("duyet", { ten: st.donChon, dong: 0 }); }, "zhaomu");

    // --- Trang Bang khác (otherzhaomu) ---
    for (let i = 1; i <= 4; i++) {
      w.on("ApplyBtn" + i, () => {
        const list = st.ds || [], item = list[st.oz * 4 + (i - 1)];
        if (!item) return;
        goi("xinVao", { id: item.id }).then((j) => { if (j && !j.loi) { st.xin.add(String(item.id)); ve(); } });
      }, "otherzhaomu");
      w.on("LookBtn" + i, () => {
        const list = st.ds || [], item = list[st.oz * 4 + (i - 1)];
        if (!item) return;
        this.bao(`Bang hội: <color=yellow>${esc(item.ten)}<color><enter>Bang chủ: ${esc(item.chu)} · Phe: ${esc(item.tenPhe || PHE_TEN[item.phe] || "Trung lập")}<enter>Đẳng cấp: ${item.cap} · Thành viên: ${item.soTv}/${item.maxTv}<enter>Lời chiêu mộ: ${esc((item.cm && item.cm.text) || "Không có")}`);
      }, "otherzhaomu");
    }
    w.on("LastPage", () => { if (st.oz > 0) { st.oz--; ve(); } }, "otherzhaomu");
    w.on("NextPage", () => { const maxP = Math.max(0, Math.ceil(((st.ds || []).length) / 4) - 1); if (st.oz < maxP) { st.oz++; ve(); } }, "otherzhaomu");

    // --- Trang Tác phường (workshop) ---
    w.on("BtnLearnWorkshop", () => goi("tpMoDong", { tp: st.tpChon }), "workshop");
    w.on("BtnOpenWorkshop", () => goi("tpMoDong", { tp: st.tpChon }), "workshop");
    w.on("BtnCloseWorkshop", () => goi("tpMoDong", { tp: st.tpChon }), "workshop");
    w.on("BtnUpgradeWorkshop", () => goi("tpLenCap", { tp: st.tpChon }), "workshop");
    w.on("BtnSetUseLevelWorkshop", () => {
      const b = B(), t = b && b.tp && b.tp[st.tpChon];
      if (!t || (t.cap | 0) < 1) return this.bao("Tác phường chưa thành lập");
      nhapO(`Cấp sử dụng ${t.ten} (1–${t.cap})`, t.sd || 1, (v) => {
        const c = parseInt(v, 10);
        if (c >= 1 && c <= t.cap) goi("tpCapSd", { tp: st.tpChon, cap: c });
      });
    }, "workshop");

    // --- Trang Chức năng (funuse) ---
    const chonTv = () => {
      const b = B(); if (!b) return null;
      const m = (b.tv || []).find((x) => x.ten === st.chon);
      if (!m) this.bao("Hãy chọn một thành viên ở danh sách bên phải trước");
      return m;
    };
    const hoiSoVan = (tieu, fn) => nhapO(tieu, "10", (v) => {
      const so = parseInt(v, 10);
      if (so > 0) fn(so);
    });
    for (let i = 1; i <= 4; i++) w.on("BtnSubPage" + i, () => { st.subFun = i; ve(); }, "funuse");
    w.on("BtnUpgradeBuildLevel", () => {
      const b = B(); if (!b) return;
      this.hoi(`Tăng đẳng cấp kiến thiết bang lên cấp ${(b.cap | 0) + 1}?`).then((ok) => ok && goi("lenCapBang"));
    }, "funuse");
    w.on("BtnStoreTongMoney", () => hoiSoVan("Quyên góp vào ngân quỹ (vạn):", (van) => goi("quyenTien", { van })), "funuse");
    w.on("BtnStoreBuildFund", () => hoiSoVan("Nạp vào ngân quỹ (vạn):", (van) => goi("napQuy", { van })), "funuse");
    w.on("BtnTransformMoney", () => hoiSoVan("Chuyển ngân quỹ -> kiến thiết:", (van) => goi("chuyenKt", { van })), "funuse");
    w.on("BtnAssignTongOffer", () => hoiSoVan("Phát quỹ dự trữ (điểm):", (van) => goi("phatDuTru", { van })), "funuse");
    w.on("BtnAssignTongMoney", () => hoiSoVan("Phát ngân quỹ (vạn):", (van) => goi("phatQuy", { van })), "funuse");
    w.on("BtnDepose", () => { const m = chonTv(); if (m) this._bhBoNhiem(B(), m); }, "funuse");
    w.on("BtnDemise", () => {
      const m = chonTv(); if (!m) return;
      this.hoi(`Truyền vị Bang chủ cho <color=yellow>${esc(m.ten)}<color>?`).then((ok) => ok && goi("chuyenVi", { ten: m.ten }));
    }, "funuse");
    w.on("BtnKickOut", () => {
      const m = chonTv(); if (!m) return;
      this.hoi(`Trục xuất <color=yellow>${esc(m.ten)}<color> khỏi bang hội?`).then((ok) => ok && goi("duoi", { ten: m.ten }));
    }, "funuse");
    w.on("BtnChangeTitle", () => { const m = chonTv(); if (m) this._bhDanhHieu(B(), m); }, "funuse");
    w.on("BtnChangeMaleTitle", () => {
      const b = B(); if (!b) return;
      nhapO("Danh hiệu chung nam:", (b.dhChung && b.dhChung.nam) || "Đệ tử", (v) => {
        goi("danhHieuChung", { nam: v || "Đệ tử", nu: (b.dhChung && b.dhChung.nu) || "Đệ tử" });
      });
    }, "funuse");
    w.on("BtnChangeFemaleTitle", () => {
      const b = B(); if (!b) return;
      nhapO("Danh hiệu chung nữ:", (b.dhChung && b.dhChung.nu) || "Đệ tử", (v) => {
        goi("danhHieuChung", { nam: (b.dhChung && b.dhChung.nam) || "Đệ tử", nu: v || "Đệ tử" });
      });
    }, "funuse");
    w.on("BtnChangeCamp", (_, ev) => {
      document.querySelector(".jx-menu")?.remove();
      const menu = document.createElement("div");
      menu.className = "jx-menu";
      menu.style.cssText = `position:fixed;left:${(ev && ev.clientX) || 400}px;top:${(ev && ev.clientY) || 300}px;z-index:9999;`;
      menu.innerHTML = `<div class="dau">Đổi phe bang hội</div><div data-p="1">Chính phái</div><div data-p="2">Tà phái</div><div data-p="3">Trung lập</div>`;
      const dong = () => { menu.remove(); document.removeEventListener("mousedown", ngoai); };
      const ngoai = (e) => { if (!menu.contains(e.target)) dong(); };
      menu.onclick = (e) => {
        const d = e.target.closest("[data-p]"); if (!d) return;
        const phe = +d.dataset.p; dong();
        this.hoi(`Đổi phe bang hội sang <color=yellow>${PHE_TEN[phe]}<color>?`).then((ok) => ok && goi("doiPhe", { phe }));
      };
      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("mousedown", ngoai), 0);
    }, "funuse");
    w.on("BtnCreateTongMap", () => api.khuTaoBanDo && api.khuTaoBanDo(), "funuse");
    w.on("BtnConfigureTongMap", () => api.khuThietLap && api.khuThietLap(), "funuse");
    w.on("BtnLeaveTong", () => {
      const b = B(); if (!b) return;
      const laChu = b.toi && b.toi.cv === "chu";
      const cau = laChu ? `Bạn muốn giải tán bang hội <color=yellow>${esc(b.ten)}<color>? Mọi thành viên sẽ rời bang.` : `Bạn muốn rời khỏi bang hội <color=yellow>${esc(b.ten)}<color>?`;
      this.hoi(cau).then((ok) => ok && goi(laChu ? "giaiTan" : "roi"));
    }, "funuse");
    w.on("BtnRecruit", () => { st.trang = "zhaomu"; ve(); }, "funuse");
    w.on("BtnHelp", () => api.teDan && api.teDan(), "funuse");

    // --- Trang Quyền hạn (right) ---
    for (const [btnName, ma] of QUYEN_DS) {
      w.on(btnName, () => {
        const b = B(); if (!b) return;
        st.q = { ...(st.q || b.quyen || {}) };
        st.q[ma] = st.q[ma] ? 0 : 1;
        st.qSua = true;
        ve();
      }, "right");
    }
    w.on("BtnSelectAll", () => {
      st.q = {}; for (const [, ma] of QUYEN_DS) st.q[ma] = 1; st.qSua = true; ve();
    }, "right");
    w.on("BtnDistribute", () => {
      const b = B(); if (!b) return;
      goi("quyen", { quyen: st.q || b.quyen || {} }).then((j) => { if (j && !j.loi) { st.qSua = false; ve(); } });
    }, "right");

    // --- Trang Ký lục / Công cáo (record) ---
    w.on("BtnAnnounce", () => { st.recTab = "announce"; ve(); }, "record");
    w.on("BtnWeekDaily", () => { st.recTab = "week"; ve(); }, "record");
    w.on("BtnTongAffair", () => { st.recTab = "affair"; ve(); }, "record");
    w.on("BtnTongHistory", () => { st.recTab = "affair"; ve(); }, "record");
    w.on("BtnEditAnnounce", () => {
      const text = (inpCc && inpCc.value || "").trim();
      goi("congCao", { text });
    }, "record");
    w.on("BtnLeaveWord", () => api.teDan && api.teDan(), "record");

    const veTvList = (pg, b) => {
      const box = tvBoxes[pg]; if (!box) return;
      const ds = ((b && b.tv) || []).filter((x) => !st.tvOn || x.on);
      const PER = 12, maxP = Math.max(0, Math.ceil(ds.length / PER) - 1);
      st.tvTrang = Math.max(0, Math.min(maxP, st.tvTrang));
      w.check("BtnOnlinePriority", st.tvOn, pg);
      w.set("TitlePage", `${st.tvTrang + 1}/${maxP + 1}`, pg);
      const sub = ds.slice(st.tvTrang * PER, st.tvTrang * PER + PER);
      box.innerHTML = sub.map((x) => {
        const sel = st.chon === x.ten ? "background:rgba(196,144,52,0.35);" : "";
        const col = x.on ? "#ffe89e" : "#9c9484";
        return `<div data-ten="${esc(x.ten)}" style="display:flex;justify-content:space-between;padding:1px 3px;cursor:pointer;color:${col};${sel}"><span>${esc(x.ten)}</span><span>${esc(x.dh || CV_TEN[x.cv] || "")} · ${x.cong | 0}</span></div>`;
      }).join("") || '<div style="color:#888;padding:4px">Chưa có thành viên</div>';
      box.onclick = (e) => {
        const row = e.target.closest("[data-ten]"); if (!row) return;
        st.chon = row.dataset.ten; ve();
      };
    };

    const ve = () => {
      const b = B();
      if (!b && st.trang !== "otherzhaomu") st.trang = "otherzhaomu";
      w.page(st.trang);
      for (const [pg, btn] of Object.entries(TAB_MAP)) {
        w.check(btn, st.trang === pg);
        w.disable(btn, pg !== "otherzhaomu" && !b);
      }
      w.disable("BtnEnterMap", !b);

      if (st.trang === "otherzhaomu") {
        const ds = st.ds || [];
        for (let i = 1; i <= 4; i++) {
          const item = ds[st.oz * 4 + (i - 1)];
          w.set("Name" + i, item ? item.ten : "", "otherzhaomu");
          w.set("Info" + i, item ? `Bang chủ: ${item.chu} · Cấp ${item.cap} · ${item.soTv}/${item.maxTv} TV` : "", "otherzhaomu");
          w.set("QingXiang" + i, item ? (item.tenPhe || PHE_TEN[item.phe] || "Trung lập") : "", "otherzhaomu");
          w.set("HuoDong" + i, item && item.cm && item.cm.cap ? `Yêu cầu cấp ${item.cm.cap}+` : (item ? "Tự do" : ""), "otherzhaomu");
          w.set("JiYu" + i, item && item.cm ? (item.cm.text || "") : "", "otherzhaomu");
          w.hideItem("LookBtn" + i, !item, "otherzhaomu");
          w.hideItem("ApplyBtn" + i, !item || !!b, "otherzhaomu");
        }
        return;
      }
      if (!b) return;

      if (st.trang === "base") {
        w.set("TxtTongName", b.ten, "base");
        w.set("TxtMaster", b.chu, "base");
        w.set("TxtLeague", "Không", "base");
        w.set("TxtCamp", b.tenPhe || PHE_TEN[b.phe] || "Trung lập", "base");
        w.set("TxtBuildLevel", String(b.cap | 0), "base");
        w.set("TxtMemberNum", `${(b.tv || []).length}`, "base");
        w.set("TxtTongLevel", String(b.cap | 0), "base");
        w.set("TxtServiceFee", `${fmt((b.phi && b.phi.ngay) | 0)} vạn`, "base");
        w.set("TxtStandFund", `${fmt(b.duTru | 0)}`, "base");
        w.set("TxtTongCapital", `${fmt(b.quy | 0)} vạn`, "base");
        w.set("TxtBuildFund", `${fmt(b.kt | 0)} vạn`, "base");
        w.set("TxtBattleFund", `${fmt(b.cb | 0)}`, "base");
        w.set("TxtTotalOffer", fmt(b.tongCong | 0), "base");
        w.set("TxtStoredBuildFund", fmt(b.duTru | 0), "base");
        w.set("TxtPersonalOffer", fmt((b.toi && b.toi.cong) | 0), "base");
        w.set("TxtWeeklyOffer", fmt((b.toi && b.toi.congTuan) | 0), "base");
        w.set("TxtHelp", b.congCao || "Chưa có công cáo bang hội", "base");
        veTvList("base", b);
      }

      if (st.trang === "zhaomu") {
        if (inpJiyu && document.activeElement !== inpJiyu) inpJiyu.value = (b.cm && b.cm.text) || "";
        if (inpAutoLv && document.activeElement !== inpAutoLv) inpAutoLv.value = String((b.cm && b.cm.cap) | 0);
        if (boxApply) {
          const ds = b.don || [];
          boxApply.innerHTML = ds.map((d) => {
            const sel = st.donChon === d.ten ? "background:rgba(196,144,52,0.35);" : "";
            return `<div data-don="${esc(d.ten)}" style="padding:2px 4px;cursor:pointer;${sel}">${esc(d.ten)} · cấp ${d.cap | 0} ${esc(d.phai || "")}</div>`;
          }).join("") || '<div style="color:#888;padding:4px">Chưa có đơn xin gia nhập</div>';
          boxApply.onclick = (e) => { const r = e.target.closest("[data-don]"); if (r) { st.donChon = r.dataset.don; ve(); } };
        }
      }

      if (st.trang === "workshop") {
        const tps = b.tp || {};
        const soMo = Object.values(tps).filter((x) => x && x.cap > 0).length;
        w.set("TxtWorkshopNum", `${soMo}/7`, "workshop");
        w.set("TxtMaxRank", String((b.cap | 0) * 2 + 1), "workshop");
        w.set("TxtServiceFee", `${fmt((b.phi && b.phi.ngay) | 0)} vạn`, "workshop");
        if (boxWarn) {
          boxWarn.innerHTML = TP_DS.map((d) => {
            const t = tps[d.k] || { cap: 0, sd: 0, mo: 0 };
            const sel = st.tpChon === d.k ? "background:rgba(196,144,52,0.35);color:#fff;" : "";
            const tt = t.cap < 1 ? "Chưa xây" : (t.mo ? `Đang mở (cấp ${t.sd}/${t.cap})` : `Đang đóng (cấp ${t.cap})`);
            return `<div data-tp="${d.k}" style="display:flex;justify-content:space-between;padding:2px 4px;cursor:pointer;${sel}"><span>${d.ten}</span><span>${tt}</span></div>`;
          }).join("");
          boxWarn.onclick = (e) => { const r = e.target.closest("[data-tp]"); if (r) { st.tpChon = r.dataset.tp; ve(); } };
        }
        veTvList("workshop", b);
      }

      if (st.trang === "funuse") {
        w.set("TxtTongName", b.ten, "funuse");
        w.set("TxtTongUnion", "Không", "funuse");
        w.set("TxtBuildLevel", String(b.cap | 0), "funuse");
        w.set("TxtTotalOffer", fmt(b.tongCong | 0), "funuse");
        w.set("TxtTongMoney", `${fmt(b.quy | 0)} vạn`, "funuse");
        w.set("TxtBuildFund", `${fmt(b.kt | 0)} vạn`, "funuse");
        w.set("TxtBattleFund", `${fmt(b.cb | 0)}`, "funuse");
        w.set("TxtStoredBuildFund", fmt(b.duTru | 0), "funuse");
        w.set("TxtPersonalOffer", fmt((b.toi && b.toi.cong) | 0), "funuse");
        w.set("TxtTongMoney2", `${fmt(b.quy | 0)} vạn`, "funuse");
        w.set("TxtBuildFund2", `${fmt(b.kt | 0)} vạn`, "funuse");
        for (let i = 1; i <= 4; i++) w.check("BtnSubPage" + i, st.subFun === i, "funuse");
        const p1 = ["BtnRecruit", "BtnForceToRetire", "BtnDemise", "BtnKickOut", "BtnDepose", "Btn_DispenseOffer", "BtnChangeMaleTitle", "BtnChangeFemaleTitle", "BtnChangeTitle", "BtnChangeCamp"];
        const p2 = ["BtnCreateTongMap", "BtnConfigureTongMap", "BtnTongStunt", "BtnTongChallenge", "BtnTongDetect"];
        const p3 = ["BtnCreateUnion", "BtnApplyJionUnion", "BtnAcceptUnionReq", "BtnLeaveUnion", "BtnKickUnionTong", "BtnAppointMinister", "BtnFireMinister"];
        for (const k of p1) w.hideItem(k, st.subFun !== 1, "funuse");
        for (const k of p2) w.hideItem(k, st.subFun !== 2, "funuse");
        for (const k of p3) w.hideItem(k, st.subFun !== 3, "funuse");
        veTvList("funuse", b);
      }

      if (st.trang === "right") {
        const q = st.qSua && st.q ? st.q : (b.quyen || {});
        for (const [btnName, ma] of QUYEN_DS) w.check(btnName, !!q[ma], "right");
        veTvList("right", b);
      }

      if (st.trang === "record") {
        w.check("BtnAnnounce", st.recTab === "announce", "record");
        w.check("BtnWeekDaily", st.recTab === "week", "record");
        w.check("BtnTongAffair", st.recTab === "affair", "record");
        if (inpCc && document.activeElement !== inpCc) inpCc.value = b.congCao || "";
        if (boxRec) {
          if (st.recTab === "week" && b.mt) {
            boxRec.innerHTML = `<div style="padding:6px;line-height:19px">
              <div><b style="color:#ffd86b">Mục tiêu tuần:</b> ${esc(b.mt.ten)} (Độ khó cấp ${b.mt.doKho})</div>
              <div>Tiến độ bang hội: <b style="color:#9eff9e">${fmt(b.mt.tienDo)} / ${fmt(b.mt.can)}</b></div>
              <div>Tiến độ cá nhân: <b style="color:#ffe28a">${fmt(b.mt.toi)}</b> · Thưởng: ${fmt(b.mt.thuong)} điểm cống hiến</div>
              <div style="margin-top:6px;color:#cbb892">Bấm nút <b>Mở Tế Đàn</b> góc dưới để điểm danh hàng ngày và lĩnh thưởng mục tiêu tuần.</div>
            </div>`;
          } else if (st.recTab === "affair") {
            boxRec.innerHTML = (b.suKien || []).map((x) => {
              const d = new Date(x.luc || Date.now());
              const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              return `<div style="padding:2px 4px;border-bottom:1px solid rgba(255,255,255,0.06)">[${t}] ${esc(x.t)}</div>`;
            }).join("") || '<div style="color:#888;padding:4px">Chưa có sự kiện bang hội</div>';
          } else {
            boxRec.innerHTML = `<div style="padding:6px;white-space:pre-wrap">${esc(b.congCao || "Chưa có công cáo bang hội")}</div>`;
          }
        }
      }
    };

    w.cb.show = () => { tai(true); ve(); };
    this._bhTai = tai;
    this._bhVe = ve;

    this._bhDs = () => {
      const d = this.W.get("bhDs"); if (!d) return;
      let trang = 0;
      const drawDs = () => {
        const ds = st.ds || [], PER = 12, maxP = Math.max(0, Math.ceil(ds.length / PER) - 1);
        trang = Math.max(0, Math.min(maxP, trang));
        const el = d.node("MemberList");
        if (el) {
          Object.assign(el.style, { overflowY: "auto", color: "#f6e7c1", fontSize: "12px", lineHeight: "18px", padding: "3px" });
          el.innerHTML = ds.slice(trang * PER, trang * PER + PER).map((x, idx) =>
            `<div style="display:flex;justify-content:space-between;padding:1px 3px"><span>${trang * PER + idx + 1}. ${esc(x.ten)} (Cấp ${x.cap})</span><span>${esc(x.chu)} · ${x.soTv} TV</span></div>`
          ).join("") || '<div style="color:#888;padding:6px">Chưa có bang hội nào</div>';
        }
      };
      d.on("BtnPrevPage", () => { trang--; drawDs(); });
      d.on("BtnNextPage", () => { trang++; drawDs(); });
      d.show();
      taiDs().then(drawDs);
    };

    this._bhBoNhiem = (b, m) => {
      const d = this.W.get("bhBoNhiem"); if (!d || !m) return;
      let cv = m.cv === "chu" ? "lao" : m.cv;
      d.set("PlayerName", m.ten);
      d.set("ErrorBox", "");
      const sync = () => {
        d.check("BtnDirector", cv === "lao");
        d.check("BtnManager", cv === "doi");
        d.check("BtnMember", cv === "de");
      };
      d.on("BtnDirector", () => { cv = "lao"; sync(); });
      d.on("BtnManager", () => { cv = "doi"; sync(); });
      d.on("BtnMember", () => { cv = "de"; sync(); });
      d.on("BtnCancel", () => d.hide());
      d.on("BtnConfirm", () => {
        goi("boNhiem", { ten: m.ten, cv }).then((j) => { if (j && !j.loi) d.hide(); });
      });
      sync();
      d.show();
    };

    this._bhDanhHieu = (b, m) => {
      if (!m) return;
      nhapO(m.ten, m.dh || "", (dh) => goi("danhHieu", { ten: m.ten, dh }));
    };

    this.moTaoBang = (xong, qt) => {
      const d = this.W.get("bhTao"); if (!d) return;
      let phe = 1;
      const box = d.node("EditTongName");
      let inp = box && box.querySelector("input");
      if (box && !inp) {
        box.innerHTML = "";
        inp = document.createElement("input");
        Object.assign(inp.style, { width: "100%", height: "100%", boxSizing: "border-box", background: "#1b140d", color: "#ffe9a8", border: "1px solid #6b532e", padding: "1px 4px" });
        box.appendChild(inp);
      }
      if (inp) inp.value = "";
      d.set("ErrorBox", "");
      const syncPhe = () => {
        d.check("BtnOrder", phe === 1);
        d.check("BtnChaos", phe === 2);
        d.check("BtnNatural", phe === 3);
      };
      d.on("BtnOrder", () => { phe = 1; syncPhe(); });
      d.on("BtnChaos", () => { phe = 2; syncPhe(); });
      d.on("BtnNatural", () => { phe = 3; syncPhe(); });
      d.on("BtnCancel", () => d.hide());
      d.on("BtnDone", () => {
        const ten = (inp && inp.value || "").trim();
        if (ten.length < 2 || ten.length > 16) { d.set("ErrorBox", "Tên bang hội từ 2–16 ký tự"); return; }
        api.bh({ viec: "lap", ten, phe, ...(qt ? { qt: 1 } : {}) }, { im: true }).then((j) => {
          if (!j || j.loi) { d.set("ErrorBox", (j && j.loi) || "Không lập được bang"); return; }
          d.hide();
          if (xong) xong(j);
        });
      });
      syncPhe();
      d.show();
      if (inp) inp.focus();
    };

    this.moLePham = () => {
      const b = B(), lv = b && b.leVat, ds = lv && lv.shop;
      if (!ds || !ds.length) return this.bao("Hiện chưa có lễ phẩm để đổi");
      this.openShop(ds, "bh");
    };
  }
  bangFill(bh, ds, cho) {
    const st = this._bh; if (!st) return;
    if (bh !== undefined) st.bh = bh || null;
    if (Array.isArray(ds)) st.ds = ds;
    if (cho != null) st.cho = cho | 0;
    const w = this.W.get("faction");
    if (w && w.visible && this._bhVe) this._bhVe();
    if (this.shopTien === "bh" && this.W.get("shop").visible && st.bh && st.bh.leVat && st.bh.leVat.shop) {
      this.openShop(st.bh.leVat.shop, "bh", { giu: true });
    }
  }
  bangTai() { const w = this.W.get("faction"); if (w && w.visible && this._bhTai) this._bhTai(true); }
  // ---------- Hết Bang phái ----------
  // thoát nhân vật (main.js bhThoat): quên dữ liệu bang của nhân vật cũ
  bangXoa() {
    const st = this._bh; if (!st) return;
    Object.assign(st, { bh: null, ds: null, coBh: null, chon: null, sua: false, cm: null, cmSua: false, q: null, qSua: false, dsLuc: 0, loi: "", oz: 0, ozChon: null, donChon: null, xin: new Set(), cho: 0 });
    for (const k of ["faction", "bhTao", "bhDs", "bhBoNhiem", "bhDanhHieu"]) { const x = this.W.M[k] && this.W.get(k); if (x && x.visible) x.hide(); }
    if (this.shopTien === "bh") this.W.get("shop").hide(); // cửa hàng Lễ phẩm của bang cũ (đợt 2)
  }
  // mở khung Bang phái ở 1 trang (main.js — NPC Người hướng dẫn bang hội "Mở giao diện chiêu mộ bang hội": chưa có bang -> chiêu mộ của bang khác, có bang -> Chiêu mộ)
  moBangPhai(trang) {
    const w = this.W.get("faction"), st = this._bh; if (!st) return;
    if (trang) st.trang = trang;
    if (!w.visible) { w.show(); this.refresh(true); } else this._bhVe();
  }
  // ---------- Hảo hữu "LIÊN LẠC" (聊天主窗口.ini, lớp KUiChatCentre của client) ----------
  // Cửa sổ co giãn (ini ghi tọa độ lúc danh sách 0 dòng): phần trên 124×80 (tiêu đề, 4 thẻ — chữ lấy từ bảng chữ client); ROWS dòng
  // danh sách ListBgImg 120×14 từ y 66 (dòng 0: nút cuộn lên ScrollUp y 67, dòng 1: tên nhóm GroupBtn y 81); phần đuôi TailImg 124×76
  // ở y 66 + ROWS × 14 — đo điểm ảnh: dải xám 1–12, dải tối 13–26 (nút cuộn xuống ScrollDown, ini y 82 = đuôi + 16), dải 30–47 có
  // sẵn chữ "Đăng nhập ẩn" (ô Invisible, ini y 96 = đuôi + 30), dải 54–71 (Tìm / Đóng, ini y 120 = đuôi + 54). Mọi mục từ đuôi trở
  // xuống dời ROWS × 14. ROWS = 16: cao 366, như ảnh client anh gửi 23/10. Danh sách bạn / cừu nhân cần máy chủ.
  _friend() {
    const w = this.W.get("friend"), api = this.api, sec = w.def.sec, S = this.W.strings || {}, ROWS = 16;
    const row = sec.ListBgImg, tail = sec.TailImg, dy = row.h * ROWS;
    w.el.style.height = tail.y + dy + tail.img.h + "px";
    const bgRow = w.node("ListBgImg");
    for (let i = 0; i < ROWS; i++) { const r = bgRow.cloneNode(true); r.style.top = row.y + row.h * i + "px"; w.el.insertBefore(r, bgRow); }
    bgRow.remove();
    for (const k of ["TailImg", "ScrollDown", "Invisible", "FindBtn", "CloseBtn"]) { const el = w.node(k); if (el) el.style.top = sec[k].y + dy + "px"; }
    for (const k of ["GroupBtn", "ScrollUp", "ScrollDown", "Invisible", "FindBtn", "CloseBtn"]) w.node(k)?.parentElement.appendChild(w.node(k)); // vẽ trên các dòng / đuôi
    const units = { UnitBtnFriend: S.G_FRIEND_UNITNAME || "Bạn hữu", UnitBtnBrother: S.G_BROTHER_UNITNAME || "Thân nhân", UnitBtnEnemy: S.G_ENEMY_UNITNAME || "Cừu nhân", UnitBtnOther: S.G_UiChatCentre_6 || "Khác" };
    const shadow = (c) => ["1px 0", "-1px 0", "0 1px", "0 -1px"].map((o) => `${o} rgb(${c.join(",")})`).join(",");
    const tab = (k) => {
      this.friendTab = k;
      for (const [u, n] of Object.entries(units)) {
        const s = sec[u], on = u === k, lab = w.item(u).lab;
        lab.textContent = n; lab.style.textAlign = "center";
        lab.style.color = `rgb(${(on ? s.selColor : s.color).join(",")})`; lab.style.textShadow = shadow(on ? s.selBorderColor : s.borderColor);
      }
      w.set("GroupBtn", units[k]);
    };
    for (const u of Object.keys(units)) {
      w.on(u, () => { api.P.audio.ui("click"); tab(u); });
      const el = w.node(u), s = sec[u];
      el.onmouseenter = () => { if (u !== this.friendTab) w.item(u).lab.style.color = `rgb(${s.overColor.join(",")})`; };
      el.onmouseleave = () => tab(this.friendTab);
    }
    tab("UnitBtnFriend");
    w.on("GroupBtn", () => {});
    w.on("Invisible", () => { const h = api.hero(); h.invisible = !h.invisible; w.check("Invisible", h.invisible); api.save(); api.msg("Đăng nhập ẩn: " + (h.invisible ? "Bật" : "Tắt")); });
    w.on("FindBtn", () => api.msg("Thêm bạn hữu: " + SERVER_ONLY));
    w.on("ScrollUp", () => {}).on("ScrollDown", () => {});
    w.cb.show = () => w.check("Invisible", !!api.hero().invisible);
  }

  _chatroom() {
    const w = this.W.get("chatroom");
    for (const k of ["PublicList_Scroll_Btn", "PrivateList_Scroll_Btn"]) w.hideItem(k, true);
    this._server(w, ["BtnCreateRoom", "BtnExitRoom", "BtnEnterRoom", "BtnRefresh"]);
    w.set("TxtCurRoomTitle", "Chưa vào phòng nào");
  }

  // ---------- Đồ dùng ----------
  _items() {
    const w = this.W.get("items"), api = this.api;
    // dòng dưới Tiền: ini có Tiền vàng (GoldCoin, "X vạn Y" — G_ITEM_GOLDCOIN) và Tinh lực (Energy) cùng 1 chỗ. Anh muốn 25/10: dòng
    // dưới là xu -> hiện GoldCoin = h.xu (máy chủ giữ như ngân lượng; tiền của Kỳ Trân Các — client ghi giá bằng "Xu"), icon món Tiền đồng
    // của client (cong-cu/dung-khung-cua-hang.mjs) đặt vào chỗ icon Tinh lực. Ô "Tự bán" bản trước bỏ (anh muốn): mức bán chỉ còn ở
    // Trợ Thủ -> Treo máy.
    w.hideItem("Energy", true);
    const xi = w.node("EnergyIcon");
    Object.assign(xi.style, { backgroundImage: `url(${this.W.base}img/tongqian.png)`, backgroundSize: "100% 100%", backgroundPosition: "0 0" });
    for (const k of ["GoldCoin", "EnergyIcon"]) w.node(k).title = "Xu — tiền của Kỳ Trân Các (chưa có)";
    w.on("OpenStatus", () => { const s = this.W.get("status"); s.show(); s.it.BtnEquipPage.fn(); });
    // nút "Gửi tiền" của client: khi đang mở rương -> khung nhập số tiền gửi vào rương (G_STR_STORE_MONEY "Ngân lượng muốn gửi")
    w.on("GetMoneyBtn", () => (this.W.get("store").visible ? this._moneyOpen("gui") : api.msg("Gửi tiền: mở Rương chứa đồ ở Ba Lăng (cạnh Tạp hóa, Dược điếm) rồi bấm Gửi tiền")));
    const box = w.node("ItemBox"); // nút Lời rao / Định giá / Rao bán: chợ trời (src/game/chotroi.js nutTui — gắn sau khi dựng các khung)
    box.classList.add("jw-box");
    box.dataset.tha = "tui";
    box.oncontextmenu = (e) => e.preventDefault();
    // bấm (chuột trái): tay trống -> nhấc món ở ô đó lên tay; đang cầm -> đặt món xuống ô đó (src: _hand*)
    // cửa hàng đang ở chế độ Bán: bấm món = hỏi bán (khung mua bán)
    box.onclick = (e) => {
      const [cx, cy] = this._cellAt(box, e), h = api.hero();
      if (this.hand && this.hand.from === "giao") { this._handDrop(); this._giaoVe(); return; } // món từ lưới Giao: trả về túi (chỗ cũ)
      if (this.hand && this.hand.from === "kham") { this._handDrop(); this._khamVe(); return; } // món cầm từ khung Khảm nạm: trả về túi (chỗ cũ)
      if (this.hand) return this._handToBag(cx, cy);
      const it = this._itemAt(h.bag || [], cx, cy);
      if (it && e.ctrlKey && !e.shiftKey && !e.altKey && api.khoe) { this._hideTip(); return api.khoe(it); } // Ctrl + bấm: khoe đồ lên kênh chat (anh 12/11 — main.js khoeDo)
      if (it && this.cho && this.cho.dinhGiaMo) { this._hideTip(); return this.cho.dinhGiaMon(it, e); } // chế độ Định giá (chợ trời): khung Rao bán
      if (it && this._sua()) { this._hideTip(); return api.doItem({ act: "sua", u: it.u }); }
      if (it && this.shopMode === "sell" && this.W.get("shop").visible) { const kb = this._khongBan(it); return kb ? api.msg(kb) : this._tradeOpen("sell", it); }
      if (it) this._handPick(it, "bag", null, e, [cx - it.x, cy - it.y]);
    };
    w.cb.hide = () => { this._hideTip(); this._handDrop(); if (this.cho && this.cho.dinhGiaMo) this.cho.batDinhGia(false); };
    w.cb.show = () => { this._bagSig = null; if (this.cho) this.cho.veNut(); };
    this._nutXep(w, () => "tui", "hành trang");
  }
  // món ở ô (cx, cy) của lưới (túi / rương)
  _itemAt(list, cx, cy) { return list.find((b) => { const [cw, ch] = (ItemDB.item(b.k) || {}).c || [1, 1]; return cx >= b.x && cx < b.x + cw && cy >= b.y && cy < b.y + ch; }) || null; }
  // ô túi (cột, hàng) dưới chuột — cửa sổ có thể đang thu nhỏ theo màn hình
  _cellAt(box, e) {
    const r = box.getBoundingClientRect(), k = r.width / box.offsetWidth;
    return [Math.floor((e.clientX - r.left) / (UNIT * k)), Math.floor((e.clientY - r.top) / (UNIT * k))];
  }
  // Túi như client (ảnh game thật 25/10): mỗi món ở đúng ô của nó (it.x, it.y — máy chủ giữ, bán / mặc đi thì để trống chỗ, không tự xếp
  // lại); nền ô món mặc được: xanh rgb(0,56,41), không mặc được (thiếu yêu cầu): đỏ sậm rgb(49,0,0) — lấy màu trên ảnh. Tô TỪNG Ô, mỗi
  // ô chừa unitBorder (1) điểm mỗi bên như client (ảnh: đỏ 26 điểm · lưới 2 điểm · đỏ 26 điểm, cả trong 1 món) — đường lưới của khung
  // vẫn hiện giữa các món nằm sát nhau. Chỉ trang bị có nền màu: thuốc, quyển, vật phẩm khác không tô (anh xem client 25/10 — túi + cửa
  // hàng). Tiền "2 vạn 4499 lượng" (money.js).
  _fillItems(h) {
    const w = this.W.get("items");
    w.set("Money", fmtMoney(h.gold || 0)).set("GoldCoin", fmtMoney(h.xu || 0, "xu"));
    if (!ItemDB.pack) { ItemDB.load().then(() => this.refresh(true)).catch((e) => this.api.msg("Không tải được kho đồ: " + e.message)); return; }
    if (this.khamMoi && !this._khamBan) this._khamBu(); // chồng đá đang đặt bị gộp / hết: chuyển chồng trước khi tính món ẩn (soát chéo 17/11)
    const held = this.hand && (this.hand.from === "bag" || this.hand.from === "giao" || this.hand.from === "gd" || this.hand.from === "kham") ? this.hand.it.u : 0;
    const giao = [...(this.giaoMo ? this._giaoDs.map((o) => o.u) : []), ...(this._gd ? this._gd.ds.map((o) => o.u) : []), ...(this.khamMoi ? this._khamDs() : [])]; // món đã đặt vào khung Giao / khung giao dịch / khung khảm nạm
    // khung khảm mở: chồng đang đặt vào chữ ký -> Sắp xếp gộp chồng / mua thêm Hoán Linh cũng vẽ lại số viên ở ô (soát chéo 17/11); đang chạy hiệu ứng thì để sau
    const kh = this.khamMoi ? this._khamDs().map((u) => (h.bag || []).find((v) => v.u === u) || null) : 0;
    const bag = (h.bag || []).filter((b) => !giao.includes(b.u)), sig = JSON.stringify([bag, held, h.lvl, h.attr, h.fac, kh]);
    if (sig === this._bagSig) return;
    this._bagSig = sig;
    if (this.khamMoi && !this._khamBan) this._khamVe();
    const box = w.node("ItemBox"), B = w.def.sec.ItemBox.unitBorder ?? 1;
    box.querySelectorAll(".jw-it").forEach((e) => e.remove());
    for (const b of bag) {
      const x = ItemDB.item(b.k); if (!x || b.x == null) continue;
      const n = (b.d || []).length, pot = x.thuoc || x.phu, el = this._itemEl(h, b, x, B, held); // pot: xếp chồng
      // đang mở rương / rương mở rộng / túi tử mẫu: chuột phải = cất vào đó (_khoNhan); chế độ Sửa của cửa hàng: bấm = sửa
      const ruong = () => this._khoNhan() != null;
      const tach = (b.n | 0) > 1 ? " · Shift + chuột phải: tách" : ""; // chồng ≥ 2 (thuốc, phù, mật đồ…)
      const goiYDung = () => x.ktc ? this._ktcHint(b, x) : x.phu ? [`Còn ${b.n} tấm`, "Chuột phải: dùng — về thành, Xa phu đưa trở lại chỗ cũ" + tach] : pot ? this._potHint(x, b.n, "Chuột phải: uống · Bấm: cầm lên (đặt vào ô 1–9 thanh dưới)" + tach, b.tk) : b.het ? "Bấm: cầm lên · Chuột phải: mặc (ngựa Kỳ Trân Các không bán được)" : "Bấm: cầm lên · Chuột phải: mặc · Ctrl + chuột phải: bán";
      el.onmousemove = (e) => { if (!this.hand) this._showTip(b, e, this.cho && this.cho.dinhGiaMo ? this.cho.goiY(b) : this.giaoMo ? "Bấm: cầm lên (đặt vào ô của khung Giao) · Chuột phải: đặt vào khung Giao" : this.khamMoi ? "Bấm: cầm lên (đặt vào ô của khung Khảm nạm) · Chuột phải: đặt vào khung Khảm nạm" : this._sua() ? this._suaHint(b) : this.shopMode === "sell" && this.W.get("shop").visible ? this._khongBan(b) || "Bấm: bán" : [].concat(ruong() ? this._goiYKho(goiYDung) : goiYDung(), KHOE)); };
      el.onmouseleave = () => this._hideTip();
      // chuột phải: mặc (thuốc: uống); Shift + chuột phải trên chồng ≥ 2: tách (như client — anh 28/10); Ctrl (hoặc Shift trên món lẻ) + chuột
      // phải: bán — món từ 4 dòng hỏi lại cho chắc
      el.oncontextmenu = (e) => {
        e.preventDefault(); this._hideTip();
        if (this.hand) return;
        if (this.giaoMo) return this._giaoThem(b); // khung Giao vật phẩm (Dã Tẩu) đang mở: đặt món vào khung
        if (this.khamMoi) return this._khamThem(b); // khung Khảm nạm (Thợ rèn) đang mở: đặt món vào ô hợp với nó
        if (this._gd) return this._gdThem(b); // đang giao dịch: đặt món vào lưới giao dịch của mình
        if (e.shiftKey && !e.ctrlKey && (b.n | 0) > 1) return this.tachMon(b);
        if (ruong() && !(e.ctrlKey || e.shiftKey || e.altKey)) return this.api.doItem({ act: "cat", u: b.u, r: this._khoNhan() }); // Alt: nút Dùng / Mặc trên điện thoại (_goiYKho)
        if (!(e.ctrlKey || e.shiftKey)) return x.ktc ? this.api.dungVat(b) : x.phu ? this.api.dungPhu(b) : pot ? this.api.drink(b) : this._khoaChan() ? null : this.api.doItem({ act: "mac", u: b.u });
        const kb = this._khongBan(b); if (kb) return this.api.msg(kb);
        if (n < 4 || !((this.api.hero().auto || {}).baoVe)) return this.api.doItem({ act: "ban", u: b.u }); // Bảo vệ trang bị tắt (Trợ Thủ → Khác): bán luôn
        this.hoi(`Bán <color=yellow>${x.n} (${n} dòng)<color>?`).then((ok) => ok && this.api.doItem({ act: "ban", u: b.u }));
      };
      box.appendChild(el);
    }
  }

  // 1 món của lưới (túi / rương): nền từng ô (trang bị: xanh mặc được / đỏ sậm không mặc được), icon, số bình (món xếp chồng)
  _itemEl(h, b, x, B, held) {
    const [cw, ch] = x.c || [1, 1], bg = canWear(h, b) ? "ok" : "no", pot = x.thuoc || x.phu || x.ktc; // món Kỳ Trân Các: số chồng (lễ bao: số viên còn)
    const el = document.createElement("div");
    el.className = "jw-it" + (b.u === held ? " held" : "");
    Object.assign(el.style, { left: b.x * UNIT + "px", top: b.y * UNIT + "px", width: cw * UNIT + "px", height: ch * UNIT + "px" });
    let html = "";
    if (!pot) for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) html += `<i class="jw-cell ${bg}" style="left:${i * UNIT + B}px;top:${j * UNIT + B}px;width:${UNIT - 2 * B}px;height:${UNIT - 2 * B}px"></i>`;
    el.innerHTML = html + (x.ic ? `<img class="jw-icon" src="assets/web/icon/${esc(x.ic)}" alt="">` : "") + (pot ? `<b class="jw-n">${x.ktc ? (b.con != null && !(x.dung && x.dung.loai === "kimTe") ? b.con : b.n > 1 ? b.n : "") : b.n}</b>` : "");
    return el;
  }

  // ---------- cầm món trên tay (anh muốn 25/10, như client): bấm món trong túi / ô trang bị -> món dính theo chuột; bấm ô trong túi để
  // đặt (đè lên đúng 1 món cùng chỗ thì đổi chỗ), bấm ô trang bị để mặc; chuột phải / Esc: bỏ xuống (món về chỗ cũ) ----------
  // it = món, from = "bag" | "equip", slot = ô trang bị (from equip), grab = [cột, hàng] chỗ bấm trong món
  _handPick(it, from, slot, e, grab = [0, 0]) {
    const x = ItemDB.item(it.k); if (!x) return;
    this._hideTip();
    const [cw, ch] = x.c || [1, 1], box = this.W.get("items").node("ItemBox");
    const k = box && box.offsetWidth ? box.getBoundingClientRect().width / box.offsetWidth : 1, cell = UNIT * k;
    const el = document.createElement("div");
    el.className = "jw-hand";
    Object.assign(el.style, { width: cw * cell + "px", height: ch * cell + "px" });
    if (x.ic) el.innerHTML = `<img src="assets/web/icon/${esc(x.ic)}" alt="" style="transform:scale(${k})">`;
    document.body.appendChild(el);
    const off = [(grab[0] + 0.5) * cell, (grab[1] + 0.5) * cell];
    const move = (ev) => { this._chuot = [ev.clientX, ev.clientY]; this._oDat(ev); el.style.left = ev.clientX - off[0] + "px"; el.style.top = ev.clientY - off[1] + "px"; };
    const cancel = (ev) => { ev.preventDefault(); ev.stopPropagation(); this._handDrop(); };
    addEventListener("mousemove", move); addEventListener("contextmenu", cancel, true);
    move(e);
    this.hand = { it, from, slot, grab, el, off: () => { removeEventListener("mousemove", move); removeEventListener("contextmenu", cancel, true); } };
    this._oDat(e);
    this.api.P.audio.ui("click");
    this.refresh(true); this._eqSig = null;
  }
  _handDrop() {
    const H = this.hand; if (!H) return false;
    H.off(); H.el.remove(); this.hand = null; this._oDat(null); this._bagSig = null; this._eqSig = null;
    // món cầm từ lưới giao dịch của mình mà không đặt lại vào lưới (bỏ xuống, bấm túi…): về túi -> báo máy chủ danh sách mới
    if (H.from === "gd" && this._gd && !this._gd.ds.some((o) => o.u === H.it.u)) this._gdGui();
    this.refresh(true);
    return true;
  }
  // máy tính: khung vàng chỗ món đang cầm sẽ nằm khi bấm (anh 04/11 "trên PC lúc cầm đồ lên k có cái vòng dự báo ô đặt đồ xuống như mobile" — như
  // điện thoại dienthoai.js _dich / _oDich, cùng kiểu #dt-dich): lưới nhận món đó (data-tha, THA) -> ô trên trái = ô dưới chuột − chỗ đã cầm trong món
  // (như _handToBag), đỏ khi lòi ra ngoài lưới; ô trang bị -> cả ô khi cầm món trong túi (đỏ: món không mặc vào ô đó) hoặc món đang mặc trên chính
  // ô đó; chỗ khác: ẩn. Chỉ chuột thật (isTrusted) hoặc giao diện máy tính — điện thoại kéo bằng ngón tay vẽ khung của nó (chuột giả, LECH điểm)
  _oDat(ev) {
    const H = this.hand, el = H && ev && (ev.isTrusted || !document.body.classList.contains("dt")) ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
    const o = el && el.closest("#jxwin [data-tha]");
    let r = null, ngoai = false;
    if (o && o.dataset.tha === "mac") {
      const s = o.dataset.o, x = ItemDB.item(H.it.k), own = x && SLOT_OF[x.t];
      if (H.from === "bag" || (H.from === "equip" && H.slot === s)) { const b = o.getBoundingClientRect(); r = [b.left, b.top, b.width, b.height]; ngoai = H.from === "bag" && own !== s && !(own === "Ring1" && s === "Ring2"); }
    } else if (o && (THA[o.dataset.tha] || []).includes(H.from) && o.offsetWidth && !(o.dataset.tha === "gd" && this._gd && this._gd.p.khoa)) {
      const b = o.getBoundingClientRect(), c = UNIT * (b.width / o.offsetWidth), [cw, ch] = (ItemDB.item(H.it.k) || {}).c || [1, 1];
      const x0 = Math.floor((ev.clientX - b.left) / c) - H.grab[0], y0 = Math.floor((ev.clientY - b.top) / c) - H.grab[1];
      ngoai = x0 < 0 || y0 < 0 || x0 + cw > Math.round(o.offsetWidth / UNIT) || y0 + ch > Math.round(o.offsetHeight / UNIT);
      r = [b.left + x0 * c, b.top + y0 * c, cw * c, ch * c];
    }
    let d = this.datEl;
    if (!r) { if (d && d.style.display !== "none") d.style.display = "none"; return; }
    if (!d) { d = this.datEl = document.createElement("div"); d.id = "jw-dat"; document.body.appendChild(d); }
    Object.assign(d.style, { display: "block", left: r[0] + "px", top: r[1] + "px", width: r[2] + "px", height: r[3] + "px" });
    d.classList.toggle("ngoai", ngoai);
  }
  // đặt món đang cầm vào túi: ô trên trái = ô dưới chuột − chỗ đã bấm trong món
  _handToBag(cx, cy) {
    const H = this.hand, x = cx - H.grab[0], y = cy - H.grab[1];
    const req = H.from === "bag" ? { act: "dat", u: H.it.u, x, y } : H.from === "kho" ? { act: "lay", u: H.it.u, x, y, r: H.r } : { act: "thao", slot: H.slot, x, y };
    this.api.doItem(req).then((ok) => { if (ok && this.hand === H) this._handDrop(); });
  }
  // bấm ô trang bị: đang cầm món trong túi -> mặc vào ô đó; tay trống -> nhấc món đang mặc lên tay
  _slotClick(s, e) {
    const H = this.hand, eq = this.api.hero().equip || {};
    if (H) {
      if (H.from === "equip") { if (H.slot === s) this._handDrop(); return; }
      if (H.from === "kho") return this.api.msg("Lấy món ra túi trước rồi mới mặc");
      if (this._khoaChan()) return; // rương đang khóa: không mặc / tháo
      return this.api.doItem({ act: "mac", u: H.it.u, slot: s }).then((ok) => { if (ok && this.hand === H) this._handDrop(); });
    }
    if (eq[s] && this._sua()) { this._hideTip(); return this.api.doItem({ act: "sua", slot: s }); }
    if (eq[s] && !this._khoaChan()) this._handPick(eq[s], "equip", s, e, [0, 0]);
  }
  // chế độ Sửa của cửa hàng đang bật; dòng gợi ý của món khi rê chuột (giá sửa — engine KItem::GetRepairPrice; câu báo engine)
  _sua() { return this.shopMode === "repair" && this.W.get("shop").visible; }
  _suaHint(it) {
    const mx = benMax(it.k);
    if (!mx) return "Vật phẩm này không thể sửa!";
    if (benCua(it) >= mx) return "Vật phẩm này không cần sửa!";
    return [`Giá sửa: ${fmtMoney(giaSua(it, this.api.luat().sua))}`, "Bấm: sửa"];
  }

  // dòng gợi ý của thuốc (Gold, game thêm): tổng hồi + thời gian (client chỉ ghi số hồi mỗi nửa giây), số bình, thao tác
  // gợi ý món Kỳ Trân Các trong túi: công dụng có / chưa có (cong-cu/dung-ky-tran-cac.js), lễ bao: số viên còn, Bạch Câu Hoàn: giờ ủy thác còn
  _ktcHint(b, x) {
    const D = x.dung, h = this.api.hero(), L = [];
    if (b.n > 1) L.push(`Có ${b.n} món`);
    if (!D) L.push(x.goiY || "Chưa dùng được (game chưa có chức năng này)"); // goiY: cách dùng của S1 (Tinh Hồng / Thủy Tinh — đảo Tẩy Tủy; Nhạc Vương Kiếm)
    else if (D.loai === "leBao") L.push(`Trong bao còn ${b.con ?? D.so} viên`, "Chuột phải: rút thuốc");
    else if (D.loai === "kimTe") L.push(`Độ bền còn ${b.con ?? D.ben} / ${D.ben}${b.n > 1 ? " (viên đang dùng)" : ""}`, "Chuột phải: sửa đồ");
    else if (D.loai === "trangThai" && D.lamMoi) {
      const T = ItemDB.buffDef(D.buff) || {}; // + trạng thái Tống Kim dự phòng (itemdb.js TK_BUFF)
      L.push(`${T.d || ""} trong ${Math.round(D.giay / 60)} phút — dùng lại thì tính lại từ đầu`, ...(D.nhom === "noi" ? ["Dùng loại Nội … hoàn này thì loại Nội khác đang có hết công hiệu"] : D.nhom === "ngoai" ? ["Dùng loại Ngoại … hoàn này thì loại Ngoại khác hết công hiệu"] : []), ...this._heHoan(T), ...this._tkHoan(D), "Chuột phải: dùng");
    }
    else if (D.loai === "ruongDaTau") { // Bảo rương thần bí của Dã Tẩu: số chùy của S1 (luat — cau-hinh.json daTau.ruong.chuy; mô tả client ghi 6)
      const can = (this.api.luat() || {}).ruongChuy ?? 6, co = (h.bag || []).reduce((t, o) => t + (o.k === D.chuy ? o.n || 1 : 0), 0);
      L.push(`Mở cần ${can} Huyền Thiên Chùy (đang có ${co}) — chùy nhận ở Online nhận thưởng mốc 3 giờ`, "Chuột phải: mở");
    }
    else if (D.loai === "ruongXanh") { // Bảo rương đồ xanh (anh 04/11 — may-chu/do.js monRuongXanh): tỉ lệ số dòng theo luật máy chủ (cau-hinh.json ruongXanh.soDong)
      const w = ((this.api.luat() || {}).ruongXanh || {}).soDong || [0, 0, 0, 70, 22, 7, 1], tong = w.reduce((t, v) => t + v, 0) || 1;
      const pct = (v) => String(Math.round((v * 1000) / tong) / 10).replace(".", ",");
      const can = ((this.api.luat() || {}).ruongXanh || {}).oTrong ?? 6;
      L.push("Mở ra 1 món trang bị xanh, cấp món theo cấp nhân vật", w.map((v, i) => (v > 0 ? `${i} dòng ${pct(v)} %` : "")).filter(Boolean).join(" · "), ...(x.goiY ? [x.goiY] : []), `Cần ít nhất ${can} ô trống trong hành trang`, "Chuột phải: mở");
    }
    else if (D.loai === "biBaoVd") L.push(...(x.goiY ? [x.goiY] : []), "Chuột phải: mở"); // Viêm Đế Bí Bảo: chọn chìa ở khung NPC (main.js dungVat, viemde.js moBao)
    else if (D.loai === "phucDuyen") L.push(`+${D.diem} điểm phúc duyên — ${h.pd ? `đang có ${h.pd.diem | 0} điểm` : "mở công năng ở Nhận thưởng → Phúc duyên"}`, "Chuột phải: dùng");
    // Tống Kim (đặc tả đợt 2): Chiến cổ / Lệnh Bài — buff mình + người cùng phe đứng gần; Càn Khôn Tạo Hóa Đan — hồi theo nhịp
    else if (D.loai === "tkDoi") L.push(`${(ItemDB.buffDef(D.buff) || {}).d || ""} trong ${Math.round((D.giay || 180) / 60)} phút — cả người cùng phe đứng gần`, "Chuột phải: dùng");
    else if (D.loai === "tkHoi") L.push(`Hồi ${D.v} sinh lực + ${D.v} nội lực mỗi nửa giây trong ${D.giay || 3} giây`, "Chuột phải: dùng");
    else if (D.loai === "lenhDaTau") L.push("Hoàn thành ngay nhiệm vụ Dã Tẩu đang làm (mỗi lần 1 lệnh bài) — dùng ở đâu cũng được", "Chuột phải: dùng");
    // Tín vật môn phái (anh 11/11 — may-chu/doi-phai.js): đổi ở NPC môn phái của mình (Ba Lăng huyện), không dùng từ túi
    else if (D.loai === "tinVatPhai") { const dk = (this.api.luat() || {}).doiPhai || {}; L.push("Mang tới NPC môn phái của mình ở Ba Lăng huyện → Đổi môn phái", `Cần cấp ${+dk.cap || 120} · ${(+dk.ngay || 7) === 7 ? "mỗi tuần" : `${+dk.ngay || 7} ngày`} đổi 1 lần`, "Chiêu 90 / 120 giữ nguyên cấp, đổi sang chiêu phái mới"); } // cấp / số ngày theo cau-hinh.json doiPhai (LUAT)
    else if (D.loai === "doiGioi") L.push(`Đổi giới tính nhân vật (sang ${h.sex === "f" ? "nam" : "nữ"}) — dùng ở thành thị / thôn trấn`, "Đồ chỉ giới cũ mặc được tự cất vào hành trang", "Chuột phải: dùng"); // Dị Dung Bí Thuật (anh 16/11 — may-chu/do.js dungVat doiGioi)
    else if (D.loai === "choHoangKim")L.push(...(x.goiY || "Mở được khi game cập nhật trang bị Hoàng Kim").split(" — ")); // 2 dòng: ô xem không tự xuống dòng
    // anh 16/11 — Báo Đáp Ân Sư (may-chu/bao-dap-an-su.js, do.js dungVat): cách dùng của S1 dưới lời client của món (ô xem không tự xuống dòng — mỗi dòng ngắn)
    else if (D.loai === "bdasNl") L.push(...this._bdasNl(x), ...this._bdasNgay(false));
    else if (D.loai === "khamNam") L.push(...[].concat(x.goiY || [])); // khảm nạm (anh 17/11): Thủy Tinh / Hoán Linh Thạch dùng ở khung khảm của Thợ rèn (_kham)
    else if (D.loai === "huongBao") L.push(`Mở ra nhận kinh nghiệm${D.hb === "tt" ? "" : " kèm 1 vật phẩm"}`, ...this._bdasMo(D.hb), ...(D.hb === "ns" ? ["Hoặc dâng tặng Võ Sư (Ba Lăng huyện) đổi kinh nghiệm"] : []), ...this._bdasNgay(true), "Chuột phải: mở");
    else if (D.loai === "leBaoNhieu") L.push(`Mở ra ${D.so} ${String((ItemDB.item(D.mon) || {}).n || "vật phẩm").trim()}`, "Chuột phải: mở");
    else if (D.loai === "nen") L.push(`Kinh nghiệm đánh quái × 2 trong ${Math.round((D.giay || 1800) / 60)} phút`, "Cả tổ đội cùng bãi (bãi luyện công: cùng bản quái chung)", "Nhân thêm với Tiên Thảo Lộ — chỉ trôi lúc đang chơi", "Chuột phải: dùng");
    else if (D.loai === "satThuGian") L.push(`Mở ra ${D.so} Sát Thủ Giản theo cấp nhân vật`, "Chuột phải: mở");
    else if (D.loai === "shxt") L.push(`+${D.so} mảnh bản đồ Sơn Hà Xã Tắc (đang có ${h.shxt | 0})`, "Chuột phải: dùng");
    else if (D.loai === "pldBac") L.push("Đưa thẳng tới bờ Bắc Phong Lăng Độ", "Dùng ở thành thị / thôn trấn hoặc bờ Nam, cần có môn phái", "Chuột phải: dùng");
    else if (D.loai === "kinhNghiem") L.push(`+${fmt(D.kn || 0)} điểm kinh nghiệm`, "Chuột phải: dùng");
    else if (D.loai === "kyNang") L.push(`Mọi kỹ năng đã học +${D.cap} cấp trong ${D.ngay} ngày`, `Cộng dồn tối đa +3 (đang +${ccCong(h)}) — hạn trôi cả lúc rời mạng`,
      ...(D.capNv ? [`Cần cấp ${D.capNv}${(h.lvl | 0) < D.capNv ? " (chưa đủ)" : ""}`] : []), "Chuột phải: dùng");
    else if (D.loai === "ngua" && D.vinhVien) L.push(`Nhận 1 ${String((ItemDB.item(D.ngua) || {}).n || "ngựa").trim()} — không hạn sử dụng`, "Ngựa không bán cho cửa hàng được", "Chuột phải: dùng");
    else if (D.loai === "trangThai" && (D.buff === "kichCong" || D.buff === "amDuong")) {
      const T = ItemDB.buffDef(D.buff) || {}, dong = [];
      for (const p of String(T.d || "").split(/,\s*/).filter(Boolean)) { if (dong.length && (dong[dong.length - 1] + ", " + p).length <= 44) dong[dong.length - 1] += ", " + p; else dong.push(p); }
      L.push(...dong, `Trong ${Math.round((D.giay || 1800) / 60)} phút — chỉ trôi lúc đang chơi`, "Đang có hiệu quả thì dùng thêm vô hiệu", ...(this._heHoan(T).length ? ["Vật lý nội công: chỉ chiêu nội có vật lý"] : []), ...this._tkHoan(D), "Chuột phải: dùng");
    }
    else L.push(D.loai === "bch" ? `Chuột phải: dùng — ủy thác đang còn ${Math.floor((h.bch | 0) / 3600)} giờ ${Math.floor(((h.bch | 0) % 3600) / 60)} phút` : "Chuột phải: dùng");
    L.push("Bấm: cầm lên");
    return L;
  }
  // anh 17/11 ("các loại hoàn nội công chỉ tác dụng với đúng phái dùng nó"): hoàn sát thương hệ chỉ cộng vào chiêu CÓ đúng hệ đó (vocong.js elemOf) — 1 dòng nói rõ
  _heHoan(T) {
    const HE = { cold: "Băng", fire: "Hỏa", lighting: "Lôi", poison: "Độc" }, L = [];
    for (const k of Object.keys((T && T.attrs) || {})) {
      const m = /^add(cold|fire|lighting|poison)(damage|magic)_v$/.exec(k);
      if (m) L.push(`Chỉ tác dụng với chiêu ${m[2] === "magic" ? "nội" : "ngoại"} công có ${HE[m[1]]}`);
      else if (k === "addphysicsmagic_v") L.push("Chỉ tác dụng với chiêu nội công có vật lý");
    }
    return L;
  }
  // anh 17/11: hoàn (chỉ số chiến đấu) trong trận Tống Kim tối đa luat().tkHoan giây, trọng thương thì mất (may-chu/tong-kim.js hoanTran)
  _tkHoan(D) {
    if (!D || !laHoan(D.buff)) return [];
    const p = Math.max(1, Math.round((+(this.api.luat() || {}).tkHoan || 180) / 60));
    return D.tk ? ["Trọng thương thì mất hiệu quả — phải dùng lại"] : [`Tống Kim: tối đa ${p} phút, trọng thương thì mất`];
  }
  // anh 16/11 — Báo Đáp Ân Sư: nguyên liệu (bdasNl) mang tới đâu, làm gì (DAC-TA mục 6 / client config.lua [4]–[9]) — chuột phải chỉ báo, không trừ món
  _bdasNl(x) {
    const ten = (k) => String((ItemDB.item(k) || {}).n || k).trim(), HB = { "ms:2574": "ms:2577", "ms:2575": "ms:2578", "ms:2576": "ms:2579" };
    if (x.k === "ms:2572") return ["Mang tới Võ Sư (Ba Lăng huyện): mời võ sư dùng", "— nhận kinh nghiệm và 3 hoặc 6 Tây Hồ Long Tĩnh Trà"];
    if (x.k === "ms:2573") return ["Mang tới Chưởng Đăng Cung Nữ (Ba Lăng huyện):", "1 trà + 1 Tơ Tằm / Sợi chỉ màu / Trung Dược", "đổi 1 Tơ Tằm / Ngũ Sắc / Trung Dược Hương Bao"];
    if (HB[x.k]) return ["Mang tới Chưởng Đăng Cung Nữ (Ba Lăng huyện):", `1 ${ten(x.k)} + 1 ${ten("ms:2573")}`, `đổi 1 ${ten(HB[x.k])}`];
    return ["Nguyên liệu sự kiện Báo Đáp Ân Sư"];
  }
  // ngày sự kiện (luat().baoDapAnSu — tu / den / moHet "YYYY-MM-DD", den / moHet là ngày đã đóng): nguyên liệu -> "Sự kiện …: tu – ngày cuối"; hương bao -> "Mở được tới hết …"
  // anh 17/11 tối: số lần mở tối đa mỗi loại cả sự kiện + quà mốc ở cái cuối (may-chu/bao-dap-an-su.js moToiDa / bao — LUAT.baoDapAnSu)
  _bdasMo(hb) {
    const B = (this.api.luat() || {}).baoDapAnSu || {}, toi = ((B.moToiDa || {})[hb]) | 0, L = ((B.bao || {})[hb] || []).map((k) => String((ItemDB.item(k) || {}).n || k).trim());
    if (!(toi > 0)) return [];
    return [`Mỗi nhân vật mở tối đa ${toi.toLocaleString("vi-VN")} cái cả sự kiện`, ...(L.length ? [`Cái thứ ${toi.toLocaleString("vi-VN")} chắc chắn ra:`, L.join(" hoặc ")] : [])];
  }
  _bdasNgay(hb) {
    const B = (this.api.luat() || {}).baoDapAnSu; if (!B) return [];
    const ng = (s, lui) => { const t = Date.parse(String(s || "") + "T00:00:00Z"); if (!Number.isFinite(t)) return ""; const d = new Date(t - lui * 864e5); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
    if (hb) return B.moHet ? [`Mở được tới hết ${ng(B.moHet, 1)}`] : [];
    return B.tu && B.den ? [`Sự kiện Báo Đáp Ân Sư: ${ng(B.tu, 0)} – ${ng(B.den, 1)}`] : [];
  }
  // đang mở rương / túi tử mẫu: chuột phải = cất vào đó. Điện thoại / máy tính bảng không có cách khác để dùng món (anh 10/11 "người chơi điện thoại không dùng được item":
  // màn ngang luôn mở Túi tử mẫu cạnh túi đồ nên chỉ còn nút Cất) -> thêm việc dùng / mặc của món dưới dạng "Alt + chuột phải" (dienthoai.js HANH); máy tính giữ nguyên
  _goiYKho(thuong) {
    const ten = this._khoNhan() === "tm" ? "túi tử mẫu" : "rương", cat = `Bấm: cầm lên (đặt vào ô của ${ten}) · Chuột phải: cất vào ${ten}`;
    if (!document.body.classList.contains("dt") && !this.camUng) return cat;
    const dung = [].concat(thuong()).flatMap((d) => String(d).split(" · ")).map((d) => d.trim()).filter((d) => /^Chuột phải/i.test(d)).map((d) => d.replace(/^Chuột phải/i, "Alt + chuột phải"));
    return [...dung, cat];
  }
  // tk: thuốc Tống Kim (anh 12/11 — mua ở Quân y trong trận, nửa giá; rời trận / hết trận tự mất — may-chu/do.js CAU_TK)
  _potHint(x, n, act, tk) {
    const p = (e, t) => `${e[0] * e[1]} ${t} / ${String(e[1] / 2).replace(".", ",")} giây`;
    return [...(n != null ? [`Còn ${n} bình`] : []), "Hồi " + [x.hp && p(x.hp, "sinh lực"), x.mp && p(x.mp, "nội lực")].filter(Boolean).join(" · "),
      ...(tk ? ["Thuốc Tống Kim: chỉ dùng trong trận — rời trận / hết trận tự mất, không cất rương / giao dịch / bán"] : []), ...(act ? [].concat(act) : [])];
  }

  // Cửa sổ mở cùng nhau (anh 26/10: "mở lên đồng nhất, tránh lệch lạc"): khung bên trái (cửa hàng, rương) đỉnh ngang đỉnh cửa sổ Đồ dùng
  // (ini client: cửa hàng / rương y 145, Đồ dùng y 20); trang Trang bị mở từ nút Sửa đặt giữa cửa hàng và Đồ dùng nếu đủ chỗ, cùng đỉnh
  _ngang(w) { w.el.style.top = this.W.get("items").el.offsetTop + "px"; }
  _giua(w, trai) {
    const it = this.W.get("items").el, l = trai.el.offsetLeft + trai.el.offsetWidth + 2;
    if (l + w.el.offsetWidth <= it.offsetLeft - 2) w.el.style.left = l + "px";
    this._ngang(w);
  }

  // ---------- Cửa hàng NPC (npc买卖界面.ini: lưới hàng 6 × 10, nút Mua / Bán / Sửa / Đóng) ----------
  // Hàng = ItemDB.shops[Sale của script NPC] (assets/data/thuoc.json). Mua: bấm món -> khung mua bán (số lượng); Shift + chuột phải = mua
  // ngay 1 bình (client G_STR_ITEM_RCLICK_BUY_MSG). Bán: bật nút Bán rồi bấm món trong túi (con trỏ bán của client). Sửa: đồ chưa hao mòn.
  // Mở cửa hàng thì mở cả cửa sổ Đồ dùng như client.
  _shop() {
    const w = this.W.get("shop"), api = this.api, box = w.node("ItemBox");
    box.classList.add("jw-box");
    box.oncontextmenu = (e) => e.preventDefault();
    // con trỏ của client: bán 卖物品 (6), sửa 修物品 (7) — trên túi đồ và trang Trang bị
    // nút Mua lại (anh 13/11 lượt 88 — "em có thể làm 1 tab mua lại ở đây": hoa văn tròn giữa nút Sửa và Đóng): bấm -> lưới hiện đồ vừa bán (5 phút, giá × 50), bấm lần
    // nữa / Mua -> về hàng của tiệm. Số nhỏ trên nút = số món còn mua lại được
    const nut = document.createElement("div"); nut.className = "jw-mualai";
    const ML = () => ({ phut: 5, heSo: 50, ...((api.luat && api.luat().muaLai) || {}) }); // số của máy chủ (cau-hinh.json muaLai — F10)
    this._mlSo = ML; nut.onmouseenter = () => { nut.dataset.tip = `Mua lại đồ vừa bán (giữ ${ML().phut} phút, giá gấp ${ML().heSo} lần lúc bán)`; };
    nut.dataset.tip = "Mua lại đồ vừa bán";
    nut.innerHTML = "<i></i>"; this.nutMuaLai = nut;
    nut.onclick = (e) => { e.stopPropagation(); api.P.audio.ui("click"); mode(this.shopMode === "muaLai" ? "buy" : "muaLai"); };
    w.el.appendChild(nut);
    const mode = (m) => {
      const cu = this.shopMode;
      this.shopMode = m;
      for (const [b, k] of [["BuyBtn", "buy"], ["SellBtn", "sell"], ["RepairBtn", "repair"]]) w.check(b, k === m);
      nut.classList.toggle("on", m === "muaLai");
      clearInterval(this.mlHen); this.mlHen = null;
      if (m === "muaLai") { this.mlPage = 0; this._muaLaiFill(); api.msg(`Chủ tiệm: ${CAU_KHIA}`); this.mlHen = setInterval(() => { if (w.visible && this.shopMode === "muaLai") this._muaLaiFill(); }, 1000); }
      else if (cu === "muaLai") this._shopFill();
      const bag = this.W.get("items").node("ItemBox"), eqp = this.W.get("status").pages.equip;
      if (bag) bag.style.cursor = m === "sell" ? api.P.hud.cursorCss(6) : m === "repair" ? api.P.hud.cursorCss(7) : "";
      if (eqp) eqp.el.style.cursor = m === "repair" ? api.P.hud.cursorCss(7) : "";
    };
    const chiDoi = () => { if (this.shopTien !== "bh") return false; api.msg("Tổng quản Lễ phẩm phường chỉ đổi lễ phẩm bằng điểm cống hiến"); return true; }; // cửa hàng Lễ phẩm (Bang hội đợt 2): không bán / sửa
    w.on("BuyBtn", () => mode("buy")).on("SellBtn", () => { if (!chiDoi()) mode(this.shopMode === "sell" ? "buy" : "sell"); });
    // Sửa: mở luôn trang Trang bị để bấm món đang mặc
    w.on("RepairBtn", () => {
      if (chiDoi()) return;
      if (this.shopMode === "repair") return mode("buy");
      mode("repair");
      const s = this.W.get("status"); s.show(); s.it.BtnEquipPage.fn(); this._giua(s, w);
      api.msg("Sửa: bấm trang bị trong túi hoặc ô đang mặc (rê chuột xem giá sửa) — bấm Sửa lần nữa để thôi");
    });
    // ◀ ▶: trang hàng (openShop chia trang khi lưới 6 × 10 đầy)
    const trang = (d) => {
      if (this.shopMode === "muaLai") { const n = (this.mlPages || []).length; if (n < 2) return; this.mlPage = (this.mlPage + d + n) % n; this._hideTip(); this._muaLaiFill(); return api.msg(`Trang ${this.mlPage + 1} / ${n}`); }
      const n = (this.shopPages || []).length; if (n < 2) return; this.shopPage = (this.shopPage + d + n) % n; this._hideTip(); this._shopFill(); api.msg(`Trang ${this.shopPage + 1} / ${n}`);
    };
    w.on("LeftBtn", () => trang(-1)).on("RightBtn", () => trang(1));
    w.cb.hide = () => { mode("buy"); this._hideTip(); this.W.get("trade").hide(); };
    this._shopMode = mode;
    mode("buy");
  }
  // mở cửa hàng Sale(id) của NPC; false nếu game không có hàng của cửa hàng đó
  // hàng: khóa thuốc (giá trong thuoc.json) hoặc { k, gia, s } (Tạp hóa: Thổ Địa Phù, đồ trắng — giá, ngũ hành của hàng bày client). Món
  // trang bị chiếm đúng số ô của nó (áo 2 × 3…), xếp lần lượt vào chỗ trống đầu tiên của lưới như client; lưới 6 × 10 đầy thì sang trang
  // sau (nút ◀ ▶ LeftBtn / RightBtn của khung — Tạp hóa Ba Lăng 31 áo / mũ: 4 trang)
  // tien = "pd": cửa hàng phúc duyên (Thần bí Thương Nhân Liễu Ất — Sale 93, giá bằng điểm phúc duyên, mua qua act muaPd); "tk": Quân Nhu quan Tống Kim
  // (điểm Tống Kim — act muaTk) — bảng TIEN_DIEM
  // opt.tk: Quân y trong trận Tống Kim — thuốc đồng giá TK_GIA_THUOC lượng, mua ra thuốc Tống Kim (máy chủ do.js act mua — trongTran)
  // xếp món vào các trang lưới 6 × 10 của khung cửa hàng: ds = [{ o, x, eq, cw, ch, … }] -> [[{ …, at }]] (chỗ trống đầu tiên như client; đầy thì sang trang sau)
  _xepTrang(ds) {
    const I = this.W.get("shop").def.sec.ItemBox, pages = [[]];
    let used = [];
    const free = (cx, cy, cw, ch) => { for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (x >= I.hUnits || y >= I.vUnits || used[y * I.hUnits + x]) return false; return true; };
    const spot = (cw, ch) => { for (let i = 0; i < I.hUnits * I.vUnits; i++) { const cx = i % I.hUnits, cy = Math.floor(i / I.hUnits); if (free(cx, cy, cw, ch)) return [cx, cy]; } return null; };
    for (const g of ds) {
      let at = spot(g.cw, g.ch);
      if (!at) { pages.push([]); used = []; at = spot(g.cw, g.ch); if (!at) continue; }
      for (let y = 0; y < g.ch; y++) for (let xx = 0; xx < g.cw; xx++) used[(at[1] + y) * I.hUnits + at[0] + xx] = 1;
      pages[pages.length - 1].push({ ...g, at });
    }
    return pages;
  }
  // id: mã cửa hàng (Sale — ItemDB.shops) hoặc danh sách hàng truyền vào (Lễ phẩm của Khu Lễ vật — Bang hội đợt 2: [{ k, gia, mo?, goi?, lpCon?, lpTuan? }], tien "bh");
  // opt.giu: nạp lại hàng của cửa hàng đang mở (giữ trang, chỗ khung — sau khi đổi Lễ phẩm)
  openShop(id, tien, opt) {
    const goods = Array.isArray(id) ? id : (ItemDB.shops || {})[id];
    if (!goods || !goods.length) return false;
    this.shopTien = TIEN_DIEM[tien] ? tien : null;
    this.shopTk = !!(opt && opt.tk);
    const w = this.W.get("shop"), ds = [], giu = !!(opt && opt.giu) && w.visible, trang0 = this.shopPage | 0;
    for (const g of goods) {
      const o = typeof g === "string" ? { k: g } : g, x = ItemDB.item(o.k); if (!x) continue;
      const eq = !(x.thuoc || x.phu), [cw, ch] = eq ? x.c || [1, 1] : [1, 1];
      ds.push({ o, x, eq, cw, ch });
    }
    this.shopPages = this._xepTrang(ds); this.shopPage = giu ? Math.min(trang0, this.shopPages.length - 1) : 0;
    // nút Mua lại: cửa hàng ngân lượng (không phải cửa hàng điểm phúc duyên / Tống Kim / Lễ phẩm)
    if (this.nutMuaLai) this.nutMuaLai.style.display = this.shopTien ? "none" : "";
    if (giu) { this._hideTip(); this._shopFill(); return true; }
    this._shopFill();
    this._shopMode("buy");
    w.show();
    this.W.get("items").show();
    this._ngang(w);
    this.refresh(true);
    return true;
  }
  // đổi Lễ phẩm (cửa hàng "bh"): việc bang hội lePham (máy chủ trừ cống hiến, giao món — phiếu); -> true nếu đổi được
  _bhMua(k, n) { return this.api.bh({ viec: "lePham", k, n }).then((j) => !!(j && !j.loi)); }
  // mua ở Shop đặc biệt (TIEN_DIEM.db): main.js khamGoi áp túi / Xu + câu báo; lỗi (thiếu Xu, đứng xa…) báo ô tin -> true nếu mua được
  _dbMua(k, n) { return Promise.resolve(this.api.khamNam({ viec: "muaDb", k, n })).then(() => { this._bagSig = null; this.refresh(true); return true; }, (e) => { this.api.msg(String((e && e.message) || e)); return false; }); }
  // lưới mua lại (lượt 88): đồ đã bán còn hạn; bấm món -> hỏi lại (câu khịa + giá) -> act muaLai. Số trên nút Mua lại = số món
  _muaLaiFill() {
    const w = this.W.get("shop"), box = w.node("ItemBox"), api = this.api, h = api.hero(), lech = this.mlLech || 0, L = dsMuaLai(h, lech);
    const So = this._mlSo ? this._mlSo() : { phut: 5, heSo: 50 };
    if (this.nutMuaLai) this.nutMuaLai.querySelector("i").textContent = L.length ? String(L.length) : "";
    if (this.shopMode !== "muaLai") return;
    const sig = L.map((e) => `${e.it.u}:${e.het}`).join(",") + "|" + this.mlPage;
    if (box.dataset.ml === sig && box.querySelector(".jw-it, .jw-ml-trong")) return;
    box.dataset.ml = sig;
    if (this.mlTip) { this.mlTip = false; this._hideTip(); } // soát: món đang xem vừa hết hạn / vừa mua lại -> ô xem món không treo lại
    box.querySelectorAll(".jw-it, .jw-ml-trong").forEach((e) => e.remove());
    const ds = [];
    for (const e of L) { const x = ItemDB.item(e.it.k); if (!x) continue; const eq = !(x.thuoc || x.phu), [cw, ch] = eq ? x.c || [1, 1] : [1, 1]; ds.push({ e, x, eq, cw, ch }); }
    this.mlPages = this._xepTrang(ds); if (this.mlPage >= this.mlPages.length) this.mlPage = 0;
    if (!ds.length) { const t = document.createElement("div"); t.className = "jw-ml-trong"; t.textContent = `Chưa có món nào bán trong ${So.phut} phút qua`; box.appendChild(t); }
    // ◀ ▶: số trang của danh sách mua lại (soát: trước vẫn ghi số trang hàng của tiệm)
    const n = this.mlPages.length;
    w.node("LeftBtn").title = n > 1 ? `Trang trước (${this.mlPage + 1} / ${n})` : "";
    w.node("RightBtn").title = n > 1 ? `Trang sau (${this.mlPage + 1} / ${n})` : "";
    const dt = document.body.classList.contains("dt");
    for (const { e: ml, x, eq, at, cw, ch } of this.mlPages[this.mlPage] || []) {
      const e = ml.it; // món (giữ nguyên trường của món — hạn sử dụng riêng của ngựa…); giá / hạn mua lại ở ml
      const el = document.createElement("div"); el.className = "jw-it";
      Object.assign(el.style, { left: at[0] * UNIT + "px", top: at[1] * UNIT + "px", width: cw * UNIT + "px", height: ch * UNIT + "px" });
      el.innerHTML = (x.ic ? `<img class="jw-icon" src="assets/web/icon/${esc(x.ic)}" alt="">` : "") + (!eq && (e.n | 0) > 1 ? `<b class="jw-n">${e.n}</b>` : "");
      const con = () => { const s = Math.max(0, Math.round((ml.het - Date.now() - (this.mlLech || 0)) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
      const hint = () => [`Mua lại: ${fmt(ml.gia)} lượng (gấp ${So.heSo} lần lúc bán)`, `Còn ${con()} nữa chủ tiệm bán cho người khác`, dt ? "Chuột phải: mua lại" : "Bấm: mua lại"];
      el.onmousemove = (ev) => { if (!this.hand) { this.mlTip = true; this._showTip(e, ev, hint()); } };
      el.onmouseleave = () => { this.mlTip = false; this._hideTip(); };
      const mua = () => {
        this.mlTip = false; this._hideTip();
        this.hoi(`<color=yellow>Chủ tiệm<color>: ${CAU_KHIA}<enter>Mua lại <color=yellow>${esc(String(x.n).trim())}${(e.n | 0) > 1 ? " × " + e.n : ""}<color> giá <color=yellow>${fmt(ml.gia)} lượng<color>?`, "Mua lại", "Thôi")
          .then((ok) => ok && api.doItem({ act: "muaLai", u: e.u }));
      };
      el.onclick = (ev) => { ev.stopPropagation(); if (this.hand) return; mua(); };
      el.oncontextmenu = (ev) => { ev.preventDefault(); if (!this.hand) mua(); };
      box.appendChild(el);
    }
  }
  _shopFill() {
    const w = this.W.get("shop"), box = w.node("ItemBox"), pages = this.shopPages || [[]];
    box.querySelectorAll(".jw-it, .jw-ml-trong").forEach((e) => e.remove()); box.dataset.ml = "";
    this._muaLaiFill(); // số trên nút Mua lại
    for (const { o, x, eq, at, cw, ch } of pages[this.shopPage] || []) {
      const tk = this.shopTk && x.thuoc, k = o.k, gia = o.gia ?? (tk ? TK_GIA_THUOC : x.gia);
      const el = document.createElement("div"), it = { k, gia, ...(eq ? { s: o.s, d: [] } : {}), ...(tk ? { tk: 1 } : {}), ...(o.lpCon != null ? { lpCon: o.lpCon } : {}) };
      el.className = "jw-it" + (o.mo ? " bh-lp-mo" : ""); // Lễ phẩm chưa đổi được (cấp Khu Lễ vật / hết lượt tuần): mờ
      Object.assign(el.style, { left: at[0] * UNIT + "px", top: at[1] * UNIT + "px", width: cw * UNIT + "px", height: ch * UNIT + "px" });
      el.innerHTML = x.ic ? `<img class="jw-icon" src="assets/web/icon/${esc(x.ic)}" alt="">` : ""; // thuốc: không tô nền (như client)
      // điện thoại (anh 30/10 lần 2 "mua 1 món đồ mà phải bấm 2 lần, khá là nhọc nhằn"): hàng nút dưới ô xem — "Mua" mua ngay 1 món (đồ chỉ
      // mua 1 món mỗi lần: không mở khung số lượng nữa); thuốc / Thổ Địa Phù: "Mua 1 bình / tấm" + "Mua nhiều" (khung số lượng)
      const dt = document.body.classList.contains("dt"), chong = x.thuoc || x.phu;
      const hint = dt ? (chong ? `Chuột phải: mua 1 ${x.thuoc ? "bình" : "tấm"} · Bấm: mua nhiều` : "Chuột phải: mua")
        : x.thuoc ? "Bấm: mua · Shift + chuột phải: mua ngay 1 bình" : x.phu ? "Bấm: mua · Shift + chuột phải: mua ngay 1 tấm" : "Bấm: mua · Shift + chuột phải: mua ngay";
      // cửa hàng bán bằng điểm (phúc duyên / Tống Kim — TIEN_DIEM): giá ghi bằng điểm ở dòng gợi ý (ô xem món chỉ có giá ngân lượng), mua qua act của loại điểm
      const TD = TIEN_DIEM[this.shopTien], pd = !!TD, hintPd = pd ? [`Giá: ${fmt(gia)} ${TD.ten} (đang có ${fmt(TD.co(this.api.hero()))})`, ...(o.goi ? [o.goi] : []), o.mo ? "" : dt ? "Chuột phải: mua 1 · Bấm: mua nhiều" : "Bấm: mua · Shift + chuột phải: mua ngay 1"].filter(Boolean) : null;
      el.onmousemove = (e) => { if (!this.hand) this._showTip(it, e, pd ? hintPd : x.thuoc ? this._potHint(x, null, hint, tk) : hint, null, pd ? null : gia); };
      el.onmouseleave = () => this._hideTip();
      el.onclick = (e) => { e.stopPropagation(); if (this.hand) return; this._hideTip(); if (o.mo) return this.api.msg(o.goi || "Chưa đổi được món này"); this._tradeOpen(pd ? this.shopTien : "buy", it); };
      el.oncontextmenu = (e) => { e.preventDefault(); if ((e.shiftKey || dt) && !this.hand) { this._hideTip(); if (o.mo) return this.api.msg(o.goi || "Chưa đổi được món này"); if (pd) return TD.bh ? this._bhMua(k, 1) : TD.db ? this._dbMua(k, 1) : this.api.doItem({ act: TD.act, k, n: 1 }); this.api.doItem({ act: "mua", k, n: 1 }).then((ok) => ok && this.api.bought(k)); } };
      box.appendChild(el);
    }
    // số trang trên nút ◀ ▶ (client: chữ của nút trống — game ghi "trang / tổng" khi có nhiều trang)
    const n = pages.length;
    w.node("LeftBtn").title = n > 1 ? `Trang trước (${this.shopPage + 1} / ${n})` : "";
    w.node("RightBtn").title = n > 1 ? `Trang sau (${this.shopPage + 1} / ${n})` : "";
  }

  // ---------- Khung mua bán (买卖确认.ini) ----------
  // Mua: tên · số lượng (ô BuyNumber: gõ số, nút + / − bấm giữ để chạy, phím lên / xuống; 1 – luat().mua — anh chốt 25/10: tối đa 60
  // bình mỗi lần, mọi loại) · tổng tiền (không đủ tiền: màu CantBuyColor) · Xác nhận / Hủy bỏ. Bán: tên · số lượng (thuốc: cả chồng,
  // chỉ xem) · số tiền nhận. Hình tiêu đề của client: BuyImg / SaleImg (RepairImg chưa dùng). Đặt giữa màn hình như hộp thoại client.
  _trade() {
    const w = this.W.get("trade"), api = this.api, sec = w.def.sec;
    Object.assign(w.el.style, { left: Math.round((1024 - sec.Main.w) / 2) + "px", top: Math.round((768 - sec.Main.h) / 2) + "px" });
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = sec.BuyNumber.maxLen || 2; inp.inputMode = "numeric"; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "sl-mua";
    inp.style.color = `rgb(${sec.BuyNumber.color})`;
    w.node("BuyNumber").appendChild(inp);
    // mỗi lần mua ≤ luat().mua, và cả túi mang ≤ luat().mang bình thuốc mọi loại (anh 25/10) — máy chủ cũng chặn
    // Thổ Địa Phù: ≤ luat().mua mỗi lần (không tính giới hạn thuốc); đồ trắng: 1 món mỗi lần
    // Kỳ Trân Các (mode ktc — anh 27/10 "sao lại tận 2 bước xác nhận"): cùng khung này, giá bằng Xu, mỗi lần ≤ luat().mua món
    // chợ trời (mode sap — src/game/chotroi.js): mua cả món / cả chồng trên sạp, giá gồm thuế (it.mua), ô số lượng chỉ để xem
    const con = () => {
      const L = api.luat(), x = this.trade && ItemDB.item(this.trade.it.k);
      if (this.trade && this.trade.mode === "sap") return 1;
      if (this.trade && this.trade.mode === "bh") { const c2 = this.trade.it.lpCon; return Math.max(1, Math.min(20, c2 != null && c2 >= 0 ? c2 : 20)); } // Lễ phẩm: ≤ 20 / lần (máy chủ), món giới hạn tuần: còn lại tuần này
      if (this.trade && (this.trade.mode === "ktc" || TIEN_DIEM[this.trade.mode])) return L.mua;
      if (x && x.phu) return L.mua;
      if (x && !x.thuoc) return 1;
      const co = (api.hero().bag || []).reduce((t, b) => t + ((ItemDB.item(b.k) || {}).thuoc ? b.n || 0 : 0), 0); return Math.min(L.mua, (L.mang || 60) - co);
    };
    const max = () => Math.max(1, con());
    // "Mua tối đa" (anh 26/10): đủ tới giới hạn mang trên người (≤ luat().mua mỗi lần), không quá số tiền đang có (Xu / điểm phúc duyên / điểm Tống Kim)
    const tien = () => (this.trade && this.trade.mode === "ktc" ? api.hero().xu | 0 : this.trade && TIEN_DIEM[this.trade.mode] ? TIEN_DIEM[this.trade.mode].co(api.hero()) : api.hero().gold || 0);
    const toiDa = () => { const T = this.trade, x = T && ItemDB.item(T.it.k); return x ? Math.max(0, Math.min(con(), Math.floor(tien() / Math.max(1, T.it.gia ?? x.gia)))) : 0; };
    const btMax = document.createElement("button");
    btMax.className = "jw-max"; btMax.style.top = sec.Main.h + "px"; btMax.style.width = sec.Main.w + "px";
    w.el.style.overflow = "visible"; // nút nằm ngoài khung 122 × 115
    btMax.onclick = () => { const n = toiDa(); if (n > 0) { inp.value = String(n); upd(); } };
    w.el.appendChild(btMax);
    const num = () => Math.max(0, Math.min(max(), parseInt(inp.value, 10) || 0));
    const price = () => {
      const T = this.trade; if (!T) return 0;
      const x = ItemDB.item(T.it.k), L = api.luat();
      if (T.mode === "sap") return T.it.mua;
      if (T.mode === "buy" || T.mode === "ktc" || TIEN_DIEM[T.mode]) return (T.it.gia ?? x.gia) * num();
      return x.thuoc || x.phu ? Math.floor(x.gia * L.banLai) * T.it.n : Math.round(L.giaBan * (T.it.m || 1) * (1 + 2 * (T.it.d || []).length));
    };
    const upd = () => {
      const p = price(), t = w.item("Price");
      w.set("Price", p);
      t.lab.style.color = `rgb(${this.trade && this.trade.mode !== "sell" && p > tien() ? sec.Price.cantBuyColor : sec.Price.color})`;
      const n = toiDa(); btMax.disabled = n < 1; btMax.textContent = n > 0 ? `Mua tối đa (${n})` : con() > 0 ? (this.trade && this.trade.mode === "ktc" ? "Không đủ Xu" : this.trade && TIEN_DIEM[this.trade.mode] ? TIEN_DIEM[this.trade.mode].thieu : "Không đủ tiền") : "Đã mang đủ thuốc";
    };
    const step = (d) => { inp.value = String(Math.max(1, Math.min(max(), num() + d))); upd(); };
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, ""); if (num() > max() || +inp.value > max()) inp.value = String(max()); upd(); };
    const ok = () => {
      const T = this.trade; if (!T) return;
      if (T.mode === "sap") {
        if (T.it.mua > tien()) return api.msg("Bạn chưa đủ tiền.");
        return this.cho.mua(T.it).then((r) => { if (r && this.trade === T) w.hide(); });
      }
      if (T.mode === "ktc") {
        const n = num(); if (!n) return;
        if (T.it.gia * n > tien()) return api.msg(`Không đủ Xu — cần ${T.it.gia * n} Xu, trên người có ${tien()} Xu`);
        return api.doItem({ act: "muaKtc", k: T.it.k, n }).then((r) => { if (r && this.trade === T) w.hide(); });
      }
      if (TIEN_DIEM[T.mode]) { // cửa hàng bán bằng điểm: phúc duyên (Thần bí Thương Nhân Liễu Ất) / Tống Kim (Quân Nhu quan)
        const n = num(), TD = TIEN_DIEM[T.mode]; if (!n) return;
        if (T.it.gia * n > tien()) return api.msg(`Không đủ ${TD.ten} — cần ${fmt(T.it.gia * n)}, đang có ${fmt(tien())}`);
        if (TD.bh) return this._bhMua(T.it.k, n).then((r) => { if (r && this.trade === T) w.hide(); });
        if (TD.db) return this._dbMua(T.it.k, n).then((r) => { if (r && this.trade === T) w.hide(); }); // Shop đặc biệt (anh 17/11 lần 2): /api/kham-nam muaDb // Lễ phẩm (Bang hội đợt 2): việc bang hội, không qua /api/do
        return api.doItem({ act: TD.act, k: T.it.k, n }).then((r) => { if (r && this.trade === T) w.hide(); });
      }
      if (T.mode === "buy") {
        const n = num(); if (!n) return;
        api.doItem({ act: "mua", k: T.it.k, n }).then((r) => { if (r) { api.bought(T.it.k); if (this.trade === T) w.hide(); } });
      } else api.doItem({ act: "ban", u: T.it.u }).then((r) => { if (r && this.trade === T) w.hide(); });
    };
    inp.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") ok();
      else if (e.key === "Escape") w.hide();
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); step(e.key === "ArrowUp" ? 1 : -1); }
    };
    // nút + / − (SendHoldMsg: giữ chuột thì chạy tiếp)
    for (const [b, d] of [["Increase", 1], ["Decrease", -1]]) {
      const el = w.node(b); let t = 0, held = false;
      const stop = () => clearTimeout(t);
      w.on(b, () => { if (!held) step(d); held = false; });
      el.addEventListener("mousedown", () => { stop(); held = false; t = setTimeout(function rep() { held = true; step(d); t = setTimeout(rep, 60); }, 400); });
      el.addEventListener("mouseleave", stop);
      el.addEventListener("mouseup", stop);
    }
    w.on("OkBtn", ok).on("CancelBtn", () => w.hide());
    w.set("CurrencyType", "lượng");
    w.cb.hide = () => { this.trade = null; inp.blur(); };
    this._tradeUpd = upd; this._tradeInp = inp; this._tradeMax = btMax;
  }
  _tradeOpen(mode, it) {
    const w = this.W.get("trade"), x = ItemDB.item(it.k); if (!x) return;
    this.trade = { mode, it };
    const buy = mode !== "sell", sap = mode === "sap"; // sap: mua trên sạp chợ trời — cả món / cả chồng, không chỉnh số
    w.set("CurrencyType", mode === "ktc" ? "Xu" : TIEN_DIEM[mode] ? TIEN_DIEM[mode].o : "lượng"); // pd / tk: điểm phúc duyên / điểm Tống Kim (ô chữ chỉ vừa ~5 chữ)
    w.hideItem("BuyImg", !buy).hideItem("SaleImg", buy).hideItem("RepairImg", true);
    for (const k of ["Increase", "Decrease"]) w.hideItem(k, !buy || sap);
    this._tradeMax.style.display = buy && !sap ? "" : "none";
    w.set("ItemName", x.n);
    // Bán / mua trên sạp: ô số lượng chỉ để xem (cả chồng thuốc / 1 món)
    this._tradeInp.readOnly = !buy || sap;
    this._tradeInp.value = buy && !sap ? "1" : String(it.n || 1);
    this._tradeUpd();
    w.show();
    // điện thoại: không tự chọn ô số (bàn phím bật lên che nửa màn hình — ảnh anh gửi 30/10); chỉnh số bằng + / − / Mua tối đa, muốn gõ thì chạm ô
    if (buy && !document.body.classList.contains("dt")) { this._tradeInp.focus(); this._tradeInp.select(); }
    this.api.P.audio.ui("click");
  }

  // ---------- Rương chứa đồ — anh 26/10: Rương chứa đồ Ba Lăng (vật bản đồ — main.js) mở cả cửa sổ Đồ dùng như script client OpenBox();
  // tiền: Rút tiền (khung rương) / Gửi tiền (cửa sổ Đồ dùng) -> khung nhập số tiền ----------
  // ---------- kho dạng lưới dùng chung (anh 27/10): rương chính (r 0 — khung 储物箱), rương mở rộng 1–3 (khung 扩展箱子 "Mở rộng rương", thẻ
  // 1 / 2 / 3), túi tử mẫu (r "tm" — khung 同伴背包 "Hành trang"). Bấm món = cầm lên tay (this.hand.from "kho", hand.r = kho), bấm ô của kho =
  // đặt (cùng kho: datR, kho khác: chuyenR, từ túi: cat), chuột phải = lấy ra túi. Rương đang khóa: không lấy ra (trừ túi tử mẫu) ----------
  _khoList(h, r) { return r === "tm" ? h.tuiTM || [] : r ? (h.ruongPhu || [])[r - 1] || [] : h.ruong || []; }
  _khoBox(w, rCua) {
    const box = w.node("ItemBox"), api = this.api;
    box.classList.add("jw-box");
    box.dataset.tha = "kho";
    box.oncontextmenu = (e) => e.preventDefault();
    box.onclick = (e) => {
      const r = rCua(); if (r == null) return;
      const [cx, cy] = this._cellAt(box, e), H = this.hand;
      if (H) {
        if (H.from === "equip") return api.msg("Tháo món này vào túi trước rồi mới cất");
        const x = cx - H.grab[0], y = cy - H.grab[1];
        const req = H.from === "kho" ? (H.r === r ? { act: "datR", u: H.it.u, x, y, r } : { act: "chuyenR", u: H.it.u, x, y, tu: H.r, den: r }) : { act: "cat", u: H.it.u, x, y, r };
        return api.doItem(req).then((ok) => { if (ok && this.hand === H) this._handDrop(); });
      }
      const it = this._itemAt(this._khoList(api.hero(), r), cx, cy);
      if (it && (r === "tm" || !this._khoaChan())) { this._handPick(it, "kho", null, e, [cx - it.x, cy - it.y]); this.hand.r = r; }
    };
  }
  _khoVe(w, h, r, sigKey) {
    if (!ItemDB.pack) return;
    const list = this._khoList(h, r), held = this.hand && this.hand.from === "kho" ? this.hand.it.u : 0;
    const sig = JSON.stringify([list, held, h.lvl, h.attr, h.fac, r]);
    if (sig === this[sigKey]) return;
    this[sigKey] = sig;
    const box = w.node("ItemBox"), B = w.def.sec.ItemBox.unitBorder ?? 1;
    box.querySelectorAll(".jw-it").forEach((e) => e.remove());
    for (const b of list) {
      const x = ItemDB.item(b.k); if (!x || b.x == null) continue;
      const el = this._itemEl(h, b, x, B, held);
      el.onmousemove = (e) => { if (!this.hand) this._showTip(b, e, "Bấm: cầm lên (đặt vào túi / ô khác) · Chuột phải: lấy ra túi"); };
      el.onmouseleave = () => this._hideTip();
      el.oncontextmenu = (e) => { e.preventDefault(); this._hideTip(); if (!this.hand && (r === "tm" || !this._khoaChan())) this.api.doItem({ act: "lay", u: b.u, r }); };
      box.appendChild(el);
    }
  }
  // nút Sắp xếp (anh 06/11 "làm thêm nút sắp xếp túi đồ và rương, style đồng bộ với game"): thẻ của client kéo rộng (img/xep_the.png —
  // cong-cu/dung-nut-sap-xep.mjs) sát trên lưới, mép phải lưới — như thẻ 1 / 2 / 3 của khung Mở rộng rương; chữ viết lên (game.css .jw-xep).
  // kho() = "tui" | 0 | 1–3 | "tm" | null. Chỉ xếp khi bấm nút (túi không bao giờ tự xếp — anh 25/10); không hỏi lại
  _nutXep(w, kho, ten) {
    const box = w.node("ItemBox"), s = w.def.sec.ItemBox, el = document.createElement("div");
    el.className = "jw-i jw-xep";
    Object.assign(el.style, { left: s.x + 6 * UNIT - 50 + "px", top: s.y - 12 + "px", backgroundImage: `url(${this.W.base}img/xep_the.png)` });
    el.innerHTML = '<span class="jw-xepchu">Sắp xếp</span>';
    el.title = `Sắp xếp ${ten}: dồn các chồng cùng loại, xếp gọn theo loại (món khóa bảo hiểm để riêng)`; // _tipChu: khung chú thích của client
    el.onmousedown = (e) => e.preventDefault();
    el.onclick = (e) => { e.stopPropagation(); this._hideTip(); const k = kho(); if (k != null) this.xep(k); };
    box.parentNode.appendChild(el);
  }
  xep(kho) {
    const api = this.api;
    if (this.hand) return api.msg("Đặt món đang cầm xuống rồi mới sắp xếp được");
    if (this._gd) return api.msg("Đang giao dịch, không thể sắp xếp");
    if (this.giaoMo) return api.msg("Đang giao vật phẩm — đóng khung Giao vật phẩm rồi mới sắp xếp");
    if (this.cho && this.cho.dinhGiaMo) return api.msg("Đang định giá bày bán — tắt Định giá rồi mới sắp xếp");
    return api.doItem({ act: "xep", kho });
  }
  // kho nhận món khi chuột phải món trong túi: khung Mở rộng rương đang mở -> rương mở rộng đang xem; rương chính đang mở -> rương chính;
  // túi tử mẫu đang mở (còn hạn) -> túi tử mẫu; không có -> null (chuột phải = mặc / dùng như thường)
  _khoNhan() {
    const h = this.api.hero();
    if (this.W.get("itemex").visible && (this.exPage | 0) && (this.exPage | 0) <= (h.ruongMo | 0)) return this.exPage | 0;
    if (this.W.get("store").visible) return 0;
    if (this.W.get("tumau") && this.W.get("tumau").visible && h.tmHet > Date.now()) return "tm";
    return null;
  }
  // chưa mua chức năng mở rộng rương: câu client G_UI_BOX_WITHOUT (khung thông báo)
  _chuaMoRong() { this.bao(this.W.strings.G_UI_BOX_WITHOUT || "Bạn vẫn chưa mở chức năng bảo hộ và mở rộng rương. Xin hãy đến huyện Ba Lăng gặp Thẩm Cửu (188, 198) mua chức năng này."); }

  // ---------- Rương chứa đồ (储物箱.ini: lưới 6 × 10, dòng Tiền, Rút tiền / Đóng, Khóa / Mật mã / Mở rộng) ----------
  // Rương chính. Nút Mở rộng (anh 27/10: "nên làm như này, đẹp và linh hoạt hơn") mở khung "Mở rộng rương" của client cạnh rương — thẻ 1 / 2 / 3 =
  // 3 rương mở rộng mua ở Thẩm Cửu. Khóa / Mở khóa (2 hình client) đổi theo trạng thái; Mật mã: khung thiết lập / đổi + bàn phím số.
  _store() {
    const w = this.W.get("store"), api = this.api;
    this._khoBox(w, () => 0);
    this._nutXep(w, () => 0, "rương");
    w.on("GetMoneyBtn", () => { if (!this._khoaChan()) this._moneyOpen("rut"); });
    w.on("BtnBox", () => {
      if (!(api.hero().ruongMo | 0)) return this._chuaMoRong();
      const x = this.W.get("itemex"); if (x.visible) return x.hide();
      this.openRuongMR();
    });
    w.on("BtnKhoa", () => this._khoaBam()).on("BtnLock", () => this._khoaBam());
    w.on("BtnPassword", () => { const h = api.hero(); if (!h.ruongMo) return this._chuaMoRong(); this._mkMo(h.coMk ? "doimk" : "datmk"); });
    w.cb.show = () => { this._storeSig = null; this._bagSig = null; };
    w.cb.hide = () => {
      this._hideTip(); if (this.hand && this.hand.from === "kho" && this.hand.r !== "tm") this._handDrop();
      this.W.get("money").hide(); this.W.get("itemex").hide(); this._bagSig = null;
    };
  }
  // khóa / mở khóa chung (rương: nút Khóa / Mở khóa; khung Trang bị: nút Khóa): đang khóa -> bàn phím mật mã để mở; chưa khóa -> khóa (cần rương mở
  // rộng + mật mã như client)
  _khoaBam() {
    const api = this.api, h = api.hero();
    if (h.khoa) return this.banPhim().then((mk) => mk && api.doItem({ act: "moKhoa", mk }));
    if (!h.ruongMo) return this._chuaMoRong();
    if (!h.coMk) return this.bao("Chưa thiết lập mật mã rương — mở Rương chứa đồ, bấm nút <color=yellow>Mật mã<color> để thiết lập (1 – 9 chữ số).");
    api.doItem({ act: "khoa" });
  }
  openStore() { const w = this.W.get("store"); w.show(); this.W.get("items").show(); this._ngang(w); this.refresh(true); this.api.P.audio.ui("click"); }
  get storeOpen() { return this.W.get("store").visible; }
  _fillStore(h) {
    const w = this.W.get("store");
    w.set("Money", fmtMoney(h.tienRuong || 0));
    w.hideItem("BtnLock", !h.khoa).hideItem("BtnKhoa", !!h.khoa);
    this._khoVe(w, h, 0, "_storeSig");
  }

  // ---------- Mở rộng rương (扩展箱子.ini: thẻ 1 / 2 / 3, lưới 6 × 10, "Trang N", Đóng lại) — 3 rương mở rộng (h.ruongPhu) ----------
  // Thẻ chưa mua: khung thông báo giá của Thẩm Cửu. Rương mở rộng không cất tiền (như client). Mở bằng nút Mở rộng của rương chính, đặt sát phải
  // khung rương; đóng rương thì đóng theo.
  _itemex() {
    const w = this.W.get("itemex"), api = this.api;
    const pg = (n) => {
      const h = api.hero(), gia = (api.luat().ruong || {}).moRong || [];
      if (n > (h.ruongMo | 0)) return this.bao(`Rương mở rộng thứ <color=yellow>${n}<color> chưa mua — đến Thẩm Cửu (Ba Lăng 188, 198)${gia[h.ruongMo | 0] != null ? `, rương kế tiếp giá <color=yellow>${gia[h.ruongMo | 0]} Xu<color>` : ""}.`);
      if (this.hand && this.hand.from === "kho" && this.hand.r === this.exPage) this._handDrop();
      this.exPage = n; this._exSig = null;
      for (const i of [1, 2, 3]) w.check("BtnPage" + i, i === n);
      w.set("TextBtn", `Trang ${n}`);
      this.refresh(true);
    };
    for (const i of [1, 2, 3]) w.on("BtnPage" + i, () => { api.P.audio.ui("click"); pg(i); });
    this._exPg = pg;
    this._khoBox(w, () => (this.exPage | 0) || null);
    this._nutXep(w, () => (this.exPage | 0) || null, "rương mở rộng đang xem");
    w.cb.show = () => { this._exSig = null; this._bagSig = null; };
    w.cb.hide = () => { this._hideTip(); if (this.hand && this.hand.from === "kho" && typeof this.hand.r === "number" && this.hand.r > 0) this._handDrop(); this._bagSig = null; };
  }
  openRuongMR() {
    const w = this.W.get("itemex"), st = this.W.get("store").el, h = this.api.hero();
    Object.assign(w.el.style, { left: st.offsetLeft + st.offsetWidth + 2 + "px", top: st.offsetTop + "px" });
    w.show(); this._exPg(Math.min(Math.max(1, this.exPage | 0), Math.max(1, h.ruongMo | 0))); this.api.P.audio.ui("click");
  }
  _fillItemex(h) { if (this.exPage) this._khoVe(this.W.get("itemex"), h, this.exPage, "_exSig"); }

  // ---------- Hành trang — túi tử mẫu (同伴背包.ini, nút ItemEx thanh dưới; anh 27/10: "dành cho người ở trên bản đồ, như túi đồ phụ") ----------
  // Dùng được khi còn hạn (h.tmHet — Tử Mẫu Lệnh ở Kỳ Trân Các, mỗi viên +7 ngày: script client ib\zimudai.lua); chưa khai mở / hết hạn: lưới
  // phủ màu xanh tối như ảnh client anh gửi, bấm vào thì báo; hạn dùng báo ở khung tin khi mở túi. Đặt sát trái cửa sổ Đồ dùng.
  _tumau() {
    const w = this.W.get("tumau"); if (!w) return;
    const box = w.node("ItemBox"), phu = document.createElement("div");
    Object.assign(phu.style, { position: "absolute", inset: "0", background: "rgba(16,24,92,.62)", pointerEvents: "auto", display: "none", zIndex: 2 });
    phu.onclick = (e) => { e.stopPropagation(); const h = this.api.hero(); this.bao(`Túi tử mẫu ${h.tmHet ? "đã hết hạn" : "chưa khai mở"}.<enter>Dùng <color=yellow>Tử Mẫu Lệnh<color> (Kỳ Trân Các — nút Bảo vật) để ${h.tmHet ? "gia hạn" : "khai mở"}: mỗi lệnh dùng được thêm 7 ngày.`); };
    box.appendChild(phu);
    this._tmPhu = phu;
    w.hideItem("TextBtn", true); // dòng chữ ini y 345 đè lên thanh đáy hình nền (client để trống) — hạn dùng báo ở khung tin khi mở túi
    this._khoBox(w, () => (this.api.hero().tmHet > Date.now() ? "tm" : null));
    this._nutXep(w, () => "tm", "túi tử mẫu");
    w.cb.show = () => { this._tmSig = null; this._bagSig = null; };
    w.cb.hide = () => { this._hideTip(); if (this.hand && this.hand.from === "kho" && this.hand.r === "tm") this._handDrop(); this._bagSig = null; };
  }
  toggleTuMau() {
    const w = this.W.get("tumau"), it = this.W.get("items"); if (!w) return;
    if (w.visible) return w.hide();
    // sát trái cửa sổ Đồ dùng (chỗ của nó dù đang ẩn — mở túi sau cũng không đè nhau)
    const W0 = w.def.sec.Main.w, L = parseInt(it.el.style.left, 10), T = parseInt(it.el.style.top, 10);
    Object.assign(w.el.style, { left: Math.max(0, (Number.isFinite(L) ? L : 1024 - 214) - W0 - 2) + "px", top: (Number.isFinite(T) ? T : 20) + "px" });
    w.show(); this.refresh(true); this.api.P.audio.ui("click");
    const h = this.api.hero(), d = h.tmHet > Date.now() && new Date(h.tmHet + 7 * 3600e3), p = (n) => String(n).padStart(2, "0");
    this.api.msg(d ? `Túi tử mẫu dùng được tới ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} ngày ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}` : `Túi tử mẫu ${h.tmHet ? "đã hết hạn" : "chưa khai mở"} — dùng Tử Mẫu Lệnh (Kỳ Trân Các)`);
  }
  _fillTuMau(h) {
    const w = this.W.get("tumau"), con = h.tmHet > Date.now();
    this._tmPhu.style.display = con ? "none" : "block";
    this._khoVe(w, h, "tm", "_tmSig");
  }

  // ---------- Khung nhập số tiền (取钱界面.ini: ô MoneyInput, Xác nhận / Hủy bỏ) — gửi / rút ngân lượng của rương ----------
  // Mở sẵn số tối đa (cả số đang mang / cả số trong rương) -> Enter là gửi / rút hết. Đặt ngay cạnh nút đã bấm (anh 26/10): Gửi tiền -> sát
  // bên trái cửa sổ Đồ dùng, Rút tiền -> sát bên phải khung rương, đáy khung ngang đáy nút (khung client không có chữ nào khác ngoài "Số tiền")
  _money() {
    const w = this.W.get("money"), api = this.api, sec = w.def.sec;
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = sec.MoneyInput.maxLen || 16; inp.inputMode = "numeric"; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "so-tien";
    inp.style.color = `rgb(${sec.MoneyInput.color})`;
    w.node("MoneyInput").appendChild(inp);
    const ok = () => {
      const n = parseInt(inp.value, 10) || 0, m = this.moneyMode;
      if (!m || n <= 0) return w.hide();
      api.doItem({ act: m, n }).then((r) => { if (r) w.hide(); });
    };
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, ""); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") ok(); else if (e.key === "Escape") w.hide(); };
    w.on("OkBtn", ok).on("CancelBtn", () => w.hide());
    w.cb.hide = () => { this.moneyMode = null; inp.blur(); };
    this._moneyInp = inp;
  }
  // ---------- Chọn số lượng (物品拆分.ini — như AskClientForNumber của script client): rút thuốc lễ bao, đổi Xu ở Tiền trang ----------
  // anh 27/10: bản trước mượn khung nhập tiền ("Số tiền" vẽ sẵn trên hình) — "mở máu mà kêu số tiền?". Khung tách món của client có nền
  // 输入文字条4 không chữ: dòng tiêu đề (tieuDe — bỏ hình "Tách" HeaderImg), ô tên (ten), ô số + nút + / − (giữ chuột thì chạy tiếp), dòng
  // thông tin (thongTin(n) — chỗ ô "Tách liên tục" của client), Xác nhận / Hủy bỏ. Ô số không có tự điền / lưu của trình duyệt.
  // Khung tách món (o.tach — tachMon, anh 28/10): đúng khung client — hình tiêu đề 拆分 + 分出, ô đánh dấu "Tách toàn bộ" (client ghi "Nhập văn
  // tự" — bản dịch sai của 连续拆分; anh đổi chữ: hình ô đã xóa chữ — cong-cu/dung-o-tach-toan-bo.mjs, chữ viết lại bằng phông game)
  _soLuong() {
    const w = this.W.get("soluong"); if (!w) return;
    const sec = w.def.sec, c = (a) => "rgb(" + a.join(",") + ")";
    w.hideItem("HeaderImg", true).hideItem("ContinuouslyDivide", true);
    const cb = w.item("ContinuouslyDivide");
    if (cb) {
      cb.s.img = { ...cb.s.img, file: "img/tach-toan-bo.png" }; cb.s.checkFrame = 2; cb.s.color = [255, 252, 178]; // khung 2: dấu đỏ, chữ vàng (khung 1 xám)
      Object.assign(cb.lab.style, { paddingLeft: "23px", boxSizing: "border-box" }); cb.lab.textContent = "Tách toàn bộ";
      w.on("ContinuouslyDivide", () => { const E = this._slEl; E.het = !E.het; w.check("ContinuouslyDivide", E.het); this.api.P.audio.ui("click"); });
      w._paint(cb);
    }
    const txt = (y, h, mau, co) => { const d = document.createElement("div"); Object.assign(d.style, { position: "absolute", left: "4px", top: y + "px", width: (sec.Main.w - 8) + "px", height: h + "px", lineHeight: h + "px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", pointerEvents: "none", font: co + 'px/' + h + 'px "VK Sans Serif 13", monospace', color: mau, textShadow: "1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000" }); w.el.appendChild(d); return d; };
    const tieuDe = txt(5, 18, "rgb(243,231,190)", 13), thong = txt(74, 16, c(sec.ItemName.color || [255, 253, 122]), 12);
    const inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = 4; inp.inputMode = "numeric"; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "sl-" + Math.random().toString(36).slice(2);
    inp.style.color = c(sec.DivideCount.color || [255, 246, 108]);
    w.node("DivideCount").appendChild(inp);
    // toiThieu: Phú quý cẩm hạp 10–99; 0 = cho chọn 0 (phát ngân quỹ 3 bậc — bỏ bậc đó; Bang hội đợt 2); không ghi = 1
    const so = () => { const o = this._sl; if (!o) return 1; const m = o.toiThieu ?? 1, v = parseInt(inp.value, 10); return Math.max(m, Math.min(o.toiDa, Number.isFinite(v) ? v : m)); };
    // dòng thông tin dài hơn khung (anh 17/11 ảnh đổi hương bao "Cần 1 Tây Hồ Long Tĩnh" bị cắt): thu chữ 12 -> 9 px tới khi vừa
    const upd = () => { const o = this._sl; if (!o) return; thong.innerHTML = o.thongTin ? o.thongTin(so()) : ""; thong.style.fontSize = "12px"; for (let f = 11; f >= 9 && thong.scrollWidth > thong.clientWidth; f--) thong.style.fontSize = f + "px"; };
    const step = (d) => { const o = this._sl; if (!o) return; inp.value = String(Math.max(o.toiThieu ?? 1, Math.min(o.toiDa, so() + d))); upd(); };
    const xong = (v) => { const o = this._sl; this._sl = null; w.hide(); if (o) o.r(v); };
    const gia = () => (this._sl && this._sl.tach ? { n: so(), het: !!this._slEl.het } : so()); // tách: { số, tách toàn bộ }
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, ""); const o = this._sl; if (o && +inp.value > o.toiDa) inp.value = String(o.toiDa); upd(); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") xong(gia()); else if (e.key === "Escape") xong(null); else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); step(e.key === "ArrowUp" ? 1 : -1); } };
    for (const [b, d] of [["Increase", 1], ["Decrease", -1]]) {
      const el = w.node(b); let t = 0, held = false;
      const stop = () => clearTimeout(t);
      w.on(b, () => { if (!held) step(d); held = false; });
      el.addEventListener("mousedown", () => { stop(); held = false; t = setTimeout(function rep() { held = true; step(d); t = setTimeout(rep, 60); }, 400); });
      el.addEventListener("mouseleave", stop); el.addEventListener("mouseup", stop);
    }
    w.on("OkBtn", () => { this.api.P.audio.ui("click"); xong(gia()); }).on("CancelBtn", () => xong(null));
    w.cb.hide = () => { inp.blur(); const o = this._sl; this._sl = null; if (o) o.r(null); };
    this._slEl = { w, inp, tieuDe, thong, upd, het: false };
  }
  // ---------- Nhập chữ (输入字串界面2.ini — như AskClientForString của script client; anh 29/10: Lễ quan "đổi mã kích hoạt") ----------
  // Tiêu đề (Title), ô StringInput (tối đa MaxLen 32 ký tự của client), Xác nhận / Hủy bỏ; Enter = Xác nhận, Esc = Hủy bỏ. Ô không có tự điền /
  // lưu của trình duyệt.
  _nhapChu() {
    const w = this.W.get("nhapchu"); if (!w) return;
    const sec = w.def.sec, inp = document.createElement("input");
    inp.className = "jw-num"; inp.maxLength = sec.StringInput.maxLen || 32; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "nc-" + Math.random().toString(36).slice(2);
    inp.style.color = `rgb(${sec.StringInput.color || [255, 253, 122]})`;
    w.node("StringInput").appendChild(inp);
    const xong = (v) => { const o = this._nc; this._nc = null; w.hide(); if (o) o.r(v); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") xong(inp.value.trim() || null); else if (e.key === "Escape") xong(null); };
    w.on("OkBtn", () => { this.api.P.audio.ui("click"); xong(inp.value.trim() || null); }).on("CancelBtn", () => xong(null));
    w.cb.hide = () => { inp.blur(); const o = this._nc; this._nc = null; if (o) o.r(null); };
    this._ncEl = { w, inp };
  }
  // nhapChu({ tieuDe, toiDa? }) -> Promise<chữ đã gõ | null> — khung giữa màn hình
  nhapChu(o = {}) {
    const E = this._ncEl; if (!E) return Promise.resolve(null);
    if (this._nc) { const r = this._nc.r; this._nc = null; r(null); }
    return new Promise((r) => {
      this._nc = { r };
      E.w.set("Title", o.tieuDe || "");
      E.inp.maxLength = Math.min(E.w.def.sec.StringInput.maxLen || 32, o.toiDa || 32); E.inp.value = "";
      const M = E.w.def.sec.Main;
      Object.assign(E.w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
      E.w.show(); E.inp.focus();
      this.api.P.audio.ui("click");
    });
  }
  // thanh tiến trình của client (khung progressbar.ini — cong-cu/dung-khung-tien-do.mjs; anh 03/11 nhiệm vụ Võ Lâm Minh Chủ "Đang thu thập"):
  // tienDo(tiêu đề, 0–1) hiện / cập nhật, tienDo(null) ẩn. Mục Progress (PartType 0) vẽ một phần hình theo chiều ngang: rộng = tỉ lệ × rộng hình
  tienDo(title, k) {
    const w = this.W.get("tienDo"); if (!w) return;
    if (title == null) { w.hide(); return; }
    w.set("Title", title);
    const t = w.item("Progress"); if (t) t.el.style.width = Math.round((t.s.img ? t.s.img.w : t.s.w) * Math.max(0, Math.min(1, k || 0))) + "px";
    if (!w.visible) w.show();
  }
  // chonSo({ tieuDe, ten, toiDa, toiThieu? (mặc định 1 — Phú quý cẩm hạp 10), san?, thongTin?(n), tach? }) -> Promise<số | null> — khung giữa màn
  // hình; tach: khung tách món của client
  // (tiêu đề 拆分 vẽ sẵn, ô "Tách toàn bộ") -> Promise<{ n, het } | null>
  chonSo(o) {
    const E = this._slEl; if (!E) return Promise.resolve(null);
    if (this._sl) { const r = this._sl.r; this._sl = null; r(null); }
    return new Promise((r) => {
      this._sl = { ...o, toiDa: Math.max(1, o.toiDa | 0), r };
      const T = !!o.tach;
      E.w.hideItem("HeaderImg", !T).hideItem("ContinuouslyDivide", !T);
      E.tieuDe.style.display = E.thong.style.display = T ? "none" : "";
      E.het = false; E.w.check("ContinuouslyDivide", false);
      E.tieuDe.textContent = o.tieuDe || "Số lượng";
      E.w.set("ItemName", o.ten || "");
      E.inp.value = String(Math.max(o.toiThieu ?? 1, Math.min(this._sl.toiDa, o.san ?? 1)));
      const M = E.w.def.sec.Main;
      Object.assign(E.w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
      E.w.show(); E.upd(); E.inp.focus(); E.inp.select();
      this.api.P.audio.ui("click");
    });
  }
  // tách chồng b của túi: số tách ra 1 … n − 1 (mặc định 1); "Tách toàn bộ" = tách liên tục từng phần bằng số đó tới hết chồng / hết chỗ trống
  // (ảnh anh gửi: 100 Tiền đồng tách 1 -> đầy túi các chồng 1, chồng gốc còn 50). Phần tách ra nằm ở ô trống đầu tiên của hành trang
  tachMon(b) {
    const x = ItemDB.item(b.k); if (!x || (b.n | 0) < 2) return;
    this.chonSo({ tach: 1, ten: x.n, toiDa: b.n - 1, san: 1 }).then((r) => r && this.api.doItem({ act: "tach", u: b.u, n: r.n, het: r.het ? 1 : 0 }));
  }
  _moneyOpen(m) {
    const h = this.api.hero(), co = m === "gui" ? h.gold || 0 : h.tienRuong || 0;
    if (co <= 0) return this.api.msg(m === "gui" ? "Không mang theo ngân lượng nào để gửi" : "Rương không có ngân lượng");
    this.moneyMode = m;
    this._moneyInp.value = String(co);
    const w = this.W.get("money"), M = w.def.sec.Main, S = this.W.get(m === "gui" ? "items" : "store"), b = S.def.sec.GetMoneyBtn, gap = 4;
    const x = m === "gui" ? S.el.offsetLeft - M.w - gap : S.el.offsetLeft + S.el.offsetWidth + gap;
    w.el.style.left = Math.max(0, Math.min(1024 - M.w, x)) + "px";
    w.el.style.top = S.el.offsetTop + b.y + b.h - M.h + "px";
    w.show();
    this._moneyInp.focus(); this._moneyInp.select();
    this.api.P.audio.ui("click");
  }

  // ---------- Đăng nhập nhận thưởng (loginprizeloginprize.ini — anh 27/10, thưởng Xu) ----------
  // Nền client đã vẽ sẵn 42 ô + mũi tên; nút btnAward1–42 khung 0 thường / 1 nhấn / 2 (DisableFrame) xám. Như ảnh client anh gửi: ngày đã
  // qua xám, hôm nay bấm được (tài khoản đã nhận hôm nay thì xám + dòng chữ đỏ Text4), ngày sau để thường (bấm: máy chủ báo chưa nhận
  // được). Chữ gợi ý từng ô lấy số Xu máy chủ (luật dangNhap.xu) thay cho kinh nghiệm của client.
  _loginprize() {
    const w = this.W.get("loginprize"); if (!w) return;
    // giữa màn hình như các hộp thoại client khác (anh 27/10 — ini đặt góc trái trên 75, 75)
    Object.assign(w.el.style, { left: Math.round((1024 - w.def.sec.Main.w) / 2) + "px", top: Math.round((768 - w.def.sec.Main.h) / 2) + "px" });
    for (let i = 1; i <= 42; i++) w.on("btnAward" + i, () => this.api.thuongDN({ nhan: i }).then((j) => { if (j && j.tt) this._lpFill(j.tt); }));
    w.on("CloseBtn", () => w.hide());
    const M = w.def.sec.Message, lab = w.item("Message").lab;
    Object.assign(lab.style, { whiteSpace: "normal", lineHeight: "15px", color: `rgb(${M.msgColor || "255,255,255"})` });
  }
  openLoginPrize() {
    const w = this.W.get("loginprize");
    if (!w || w.visible) return w && w.hide();
    this.api.thuongDN({}).then((j) => { if (!j || !j.tt) return; this._lpFill(j.tt); w.show(); this.api.P.audio.ui("click"); });
  }
  loginPrizeFill(tt) { const w = this.W.get("loginprize"); if (w && w.visible) this._lpFill(tt); }
  _lpFill(tt) {
    const w = this.W.get("loginprize"), xu = ((this.api.luat() || {}).dangNhap || {}).xu || [], n = tt.n | 0;
    for (let i = 1; i <= 42; i++) {
      const homNay = i === n || (n >= 43 && i === 42);
      w.disable("btnAward" + i, homNay ? !!tt.da : i < n);
      w.node("btnAward" + i).classList.toggle("lp-hom", homNay && !tt.da); // ô nhận được hôm nay nhấp nháy (anh 08/11 "lỗi nhận thưởng": 42 ô như nhau, bấm nhầm ô báo "chưa thể nhận")
      w.node("btnAward" + i).title = `Đăng nhập liên tục phần thưởng ${i === 42 ? "42 ngày" : "ngày " + i}, có thể nhận ${fmt(xu[i - 1] || 0)} Xu`;
    }
    const M = w.def.sec.Message, red = (t) => esc(t).replace(/&lt;color=red&gt;([\s\S]*?)&lt;color&gt;/g, '<span style="color:#ff2020">$1</span>');
    w.item("Message").lab.innerHTML = [M.text1, M.text2, M.text3, tt.da ? M.text4 : ""].filter(Boolean).map((t) => `<div style="margin-bottom:${(M.rowInterval || 1) * 6}px">${red(t)}</div>`).join("");
  }

  // ---------- Hỏi xác nhận (提示.ini: lời Info + 2 nút chữ FirstBtn / SecondBtn) — anh 27/10: "thông báo phải là của game chứ không phải
  // của trình duyệt" (bản trước dùng confirm() của trình duyệt khi vứt / bán đồ quý). Enter = đồng ý, Esc / đóng khung = hủy ----------
  _hoi() {
    const w = this.W.get("hoi"); if (!w) return;
    const xong = (v) => { const r = this._hoiCb; this._hoiCb = null; this._hoiTrang = null; removeEventListener("keydown", this._hoiKey, true); w.hide(); if (r) r(v); };
    // câu nhiều trang (hoi — chiaTrang): nút đầu / Enter sang trang kế; trang cuối mới có nút của câu hỏi -> true nếu vừa sang trang
    const tiep = () => {
      const T = this._hoiTrang; if (!T || T.i >= T.T.length - 1) return false;
      T.i++; w.item("Info").lab.innerHTML = T.T[T.i]; this._hoiLuc = performance.now();
      if (T.i === T.T.length - 1) { this._hoiNut(w, T.ok, T.huy); this._hoiTrang = null; }
      return true;
    };
    // vừa sang trang (soát 11/11): bấm đúp "Trang kế" / giữ Enter không được trúng luôn nút của trang cuối (Hủy bỏ / Đóng nằm đúng chỗ nút vừa bấm) chưa kịp đọc
    const voi = () => performance.now() - (this._hoiLuc || 0) < 300;
    this._hoiKey = (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (e.repeat || voi()) return; this.api.P.audio.ui("click"); if (!tiep()) xong(true); } };
    w.on("FirstBtn", () => { if (voi()) return; this.api.P.audio.ui("click"); if (!tiep()) xong(true); }).on("SecondBtn", () => { if (voi()) return; this.api.P.audio.ui("click"); xong(false); });
    w.cb.hide = () => { this._hoiTrang = null; if (this._hoiCb) { const r = this._hoiCb; this._hoiCb = null; removeEventListener("keydown", this._hoiKey, true); r(false); } };
  }
  // chữ nút: 1 nút (thông báo — anh 27/10 "căn chỉnh lại nút đóng") nằm giữa khung; 2 nút: chỗ của ini
  _hoiNut(w, ok, huy) {
    w.set("FirstBtn", ok).set("SecondBtn", huy ?? "").hideItem("SecondBtn", huy == null);
    const F = w.def.sec.FirstBtn; w.node("FirstBtn").style.left = (huy == null ? Math.round((w.def.sec.Main.w - F.w) / 2) : F.x) + "px";
  }
  hoi(html, ok = "Xác nhận", huy = "Hủy bỏ") {
    const w = this.W.get("hoi");
    if (!w) return Promise.resolve(false);
    if (this._hoiCb) { const r = this._hoiCb; this._hoiCb = null; r(false); } // đang hỏi câu khác: câu cũ coi như hủy
    const it = w.item("Info");
    it.lab.innerHTML = richText(html, (this.api.hero() || {}).name || "");
    this._hoiNut(w, ok, huy);
    w.show();
    // câu dài hơn ô Info (anh 11/11 "chỗ này hình như lệch form": Hướng dẫn Phân Thân tràn đè nút Đóng, dòng đầu mất): chia trang vừa ô như khung NPC
    // (npcdlg chiaTrang — đo chữ thật nên đo sau khi hiện); trang trước chỉ có nút "Trang kế", trang cuối mới có nút của câu hỏi (trước đó Esc vẫn là hủy)
    const T = chiaTrang(it.el, it.lab, it.lab.innerHTML);
    this._hoiTrang = T.length > 1 ? { T, i: 0, ok, huy } : null;
    if (this._hoiTrang) this._hoiNut(w, "Trang kế", null);
    addEventListener("keydown", this._hoiKey, true);
    return new Promise((r) => { this._hoiCb = r; });
  }
  // ---------- Giao vật phẩm (给予界面.ini — script client GiveItemUI: Dã Tẩu "tìm / mua / hiển thị vật phẩm", hợp Sát thủ giản; anh 27/10) ----------
  // Lưới Items 6 × 4 như túi: món nằm đúng ô của nó (this._giaoDs = [{ u, x, y }] — món vẫn ở túi trên máy chủ, túi ẩn món đã đặt). Như client
  // (anh 28/10 "đặt đồ sai ô"): bấm món trong túi = cầm lên tay, bấm ô của lưới = đặt vào đúng ô đó (đè đúng 1 món thì đổi: món kia lên tay);
  // bấm món trong lưới = cầm lên (đặt ô khác / bấm túi = trả về túi); chuột phải món trong túi = đặt vào ô trống đầu tiên, chuột phải món trong
  // lưới = trả về túi. Ô lời ContentList = câu của NPC, Title = tiêu đề. Xác nhận -> danh sách mã món (máy chủ kiểm tra), Hủy bỏ / đóng -> null.
  _giao() {
    const w = this.W.get("giao"); if (!w) return;
    const I = w.def.sec.Items, L = w.def.sec.ContentList, B = I.unitBorder ?? 1;
    Object.assign(w.item("ContentList").lab.style, { whiteSpace: "normal", lineHeight: "14px", color: `rgb(${(L.msgColor || [255, 217, 78]).join(",")})`, alignItems: "flex-start" });
    w.hideItem("ContentScroll", true);
    const box = w.node("Items");
    box.classList.add("jw-box");
    box.dataset.tha = "giao";
    const xong = (v) => {
      const r = this._giaoCb; this._giaoCb = null; this._giaoDs = [];
      if (this.hand && this.hand.from === "giao") this._handDrop();
      w.hide(); this._bagSig = null; this.refresh(true); if (r) r(v);
    };
    w.on("Assemble", () => { this.api.P.audio.ui("click"); const ds = this._giaoDs.map((o) => o.u); if (this.hand && this.hand.from === "giao") ds.push(this.hand.it.u); xong(ds); }).on("Close", () => xong(null));
    w.cb.hide = () => { this._hideTip(); if (this._giaoCb) xong(null); };
    box.oncontextmenu = (e) => e.preventDefault();
    box.onclick = (e) => {
      const [cx, cy] = this._cellAt(box, e), H = this.hand;
      if (H) {
        if (H.from !== "bag" && H.from !== "giao") return this.api.msg("Chỉ đặt được món trong hành trang");
        return this._giaoDat(H, cx - H.grab[0], cy - H.grab[1]);
      }
      const o = this._giaoTai(cx, cy); if (!o) return;
      const b = (this.api.hero().bag || []).find((v) => v.u === o.u); if (!b) return;
      this._giaoDs = this._giaoDs.filter((v) => v !== o);
      this._handPick(b, "giao", null, e, [cx - o.x, cy - o.y]);
      this._giaoVe();
    };
    // vẽ lại lưới (nền ô + icon như túi)
    this._giaoVe = () => {
      box.querySelectorAll(".jw-it").forEach((e) => e.remove());
      const h = this.api.hero();
      for (const o of this._giaoDs) {
        const b = (h.bag || []).find((v) => v.u === o.u), x = b && ItemDB.item(b.k); if (!x) continue;
        const el = this._itemEl(h, { ...b, x: o.x, y: o.y }, x, B, 0);
        el.onmousemove = (e) => { if (!this.hand) this._showTip(b, e, "Bấm: cầm lên · Chuột phải: trả về hành trang"); };
        el.onmouseleave = () => this._hideTip();
        el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); if (this.hand) return; this._hideTip(); this._giaoDs = this._giaoDs.filter((v) => v !== o); this._giaoVe(); this._bagSig = null; this.refresh(true); };
        box.appendChild(el);
      }
    };
    this._giaoDs = [];
  }
  get giaoMo() { const w = this.W.get("giao"); return !!(w && w.visible && this._giaoCb); }
  // món của lưới Giao ở ô (cx, cy); _giaoCho(cỡ, x, y, bỏ qua) -> các món bị đè (null: ra ngoài lưới)
  _giaoTai(cx, cy) { return this._giaoDs.find((o) => { const [cw, ch] = this._giaoCo(o.u); return cx >= o.x && cx < o.x + cw && cy >= o.y && cy < o.y + ch; }) || null; }
  _giaoCo(u) { const b = (this.api.hero().bag || []).find((v) => v.u === u); return (b && (ItemDB.item(b.k) || {}).c) || [1, 1]; }
  _giaoCho([cw, ch], x, y) {
    const I = this.W.get("giao").def.sec.Items;
    if (x < 0 || y < 0 || x + cw > I.hUnits || y + ch > I.vUnits) return null;
    return this._giaoDs.filter((o) => { const [w2, h2] = this._giaoCo(o.u); return !(x + cw <= o.x || o.x + w2 <= x || y + ch <= o.y || o.y + h2 <= y); });
  }
  // đặt món đang cầm (từ túi / từ lưới) vào ô (x, y) của lưới Giao
  _giaoDat(H, x, y) {
    const c = this._giaoCo(H.it.u), de = this._giaoCho(c, x, y);
    if (!de || de.length > 1) return;
    this._handDrop();
    this._giaoDs.push({ u: H.it.u, x, y });
    if (de.length === 1) { // đổi chỗ: món bị đè lên tay
      const o = de[0], b = (this.api.hero().bag || []).find((v) => v.u === o.u);
      this._giaoDs = this._giaoDs.filter((v) => v !== o);
      if (b) this._handPick(b, "giao", null, { clientX: (this._chuot || [0, 0])[0], clientY: (this._chuot || [0, 0])[1] }, [0, 0]);
    }
    this._giaoVe(); this._bagSig = null; this.refresh(true); this.api.P.audio.ui("click");
  }
  // chuột phải món trong túi khi khung Giao vật phẩm đang mở: ô trống đầu tiên (trên xuống, trái sang)
  _giaoThem(b) {
    if (this._giaoDs.some((o) => o.u === b.u)) return;
    const I = this.W.get("giao").def.sec.Items, c = this._giaoCo(b.u);
    for (let i = 0; i < I.hUnits * I.vUnits; i++) {
      const x = i % I.hUnits, y = (i / I.hUnits) | 0, de = this._giaoCho(c, x, y);
      if (de && !de.length) { this._giaoDs.push({ u: b.u, x, y }); this._giaoVe(); this._bagSig = null; this.refresh(true); this.api.P.audio.ui("click"); return; }
    }
    this.api.msg("Khung giao không còn chỗ");
  }
  // giaoDo({ tieuDe, loi }) -> Promise<[mã món] | null>; mở kèm cửa sổ Đồ dùng
  giaoDo(o) {
    const w = this.W.get("giao"); if (!w) return Promise.resolve(null);
    if (this._giaoCb) { const r = this._giaoCb; this._giaoCb = null; r(null); }
    if (this.hand) this._handDrop();
    return new Promise((r) => {
      this._giaoCb = r; this._giaoDs = [];
      w.set("Title", o.tieuDe || "Giao vật phẩm");
      w.item("ContentList").lab.innerHTML = richText(o.loi || "", (this.api.hero() || {}).name || "");
      const M = w.def.sec.Main, it = this.W.get("items");
      Object.assign(w.el.style, { left: Math.round((1024 - M.w) / 2 - 120) + "px", top: Math.round((768 - M.h) / 2) + "px" });
      w.show(); this._giaoVe();
      if (!it.visible) it.show();
      this._bagSig = null; this.refresh(true); this.api.P.audio.ui("click");
    });
  }

  // ---------- Khảm nạm Thủy tinh (打造物品.ini — khung "kham"; anh 16/11 tối, chốt 17/11 — may-chu/kham-nam.js, main.js khamFn) ----------
  // Ô Item (giữa) = trang bị trong hành trang; ô Đẳng cấp = Tử Thủy Tinh, ô Linh lực = Lục Thủy Tinh, 5 ô ngũ hành = Lam Thủy Tinh (ô nào cũng được — hệ mới ngẫu
  // nhiên) / Hoán Linh Thạch (ô của hệ muốn đổi sang). Mỗi lần 1 viên (client G_TREMBLEITEM_2): đặt viên mới thì viên cũ về túi. Món vẫn ở túi trên máy chủ
  // (túi ẩn món đã đặt — _fillItems). Như khung Giao: bấm món trong túi = cầm lên, bấm ô = đặt; chuột phải món trong túi = đặt vào ô hợp với nó; bấm / chuột
  // phải ô đã có món = trả về túi; điện thoại: kéo thả vào ô (ô là .jw-slot — dienthoai.js). Khảm -> hỏi lại (phí, tỉ lệ) -> POST /api/kham-nam -> thành công:
  // hiệu ứng 合成特效.spr của client (mục Effect, 27 khung); thủy tinh còn trong chồng thì giữ ở ô để khảm tiếp
  _kham() {
    const w = this.W.get("kham"); if (!w) return;
    const O = { Item: "mon", GemLevel: "cap", GemSpirit: "linh", GemGold: 0, GemWood: 1, GemWater: 2, GemFire: 3, GemEarth: 4 };
    this._khamO = O; this._khamS = { mon: 0, da: 0, o: null };
    w.hideItem("Effect", true);
    const S = this.W.strings || {};
    for (const [ten, o] of Object.entries(O)) {
      const el = w.node(ten); if (!el) continue;
      el.classList.add("jw-slot"); el.dataset.kham = String(o);
      el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); if (this.hand) return this._handDrop(); if (this._khamBan) return; this._khamBo(o); };
      el.onclick = (e) => {
        e.stopPropagation();
        if (this._khamBan) return this.api.msg("Đang khảm nạm, xin chờ…");
        const H = this.hand;
        if (!H) return this._khamBo(o); // ô có món: trả về túi
        if (H.from !== "bag") return this.api.msg("Chỉ đặt được món trong hành trang");
        if (this._khamDat(H.it, o)) this._handDrop();
      };
      el.onmousemove = (e) => { if (this.hand) return; const b = this._khamMon(o); if (b) this._showTip(b, e, "Bấm / chuột phải: trả về hành trang"); }; // ô trống: chữ gợi ý data-tip (_khamVe — _tipChu)
      el.onmouseleave = () => this._hideTip();
    }
    const xong = () => { this._khamS = { mon: 0, da: 0, o: null }; if (this.hand && this.hand.from === "kham") this._handDrop(); this._khamVe(); this._bagSig = null; this.refresh(true); };
    w.on("Close", () => { this.api.P.audio.ui("click"); w.hide(); });
    w.cb.hide = () => { this._hideTip(); this._khamDung(); xong(); };
    w.on("Assemble", () => {
      this.api.P.audio.ui("click");
      if (this._khamBan) return;
      const K = this._khamS, L = (this.api.luat() || {}).khamNam || {}, h = this.api.hero();
      const mon = this._khamMon("mon"), da = K.da ? (h.bag || []).find((v) => v.u === K.da) : null;
      if (!mon) return this.api.msg(S.G_TREMBLEITEM_1 || "Xin đặt lên vật phẩm muốn khảm Bảo Thạch.");
      if (!da) return this.api.msg(S.G_TREMBLEITEM_0 || "Xin đặt lên ít nhất 1 viên Bảo Thạch");
      const x = ItemDB.item(mon.k) || {}, tenMon = String(x.n || "").trim(), tenDa = String((ItemDB.item(da.k) || {}).n || "").trim(), cl = this._khamCap(mon.k);
      const hl = da.k === (L.hl || {}).k, phi = hl ? +(L.hl || {}).phi || 0 : (+L.phiCap || 0) * cl;
      const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
      const viec = K.o === "cap" ? `nâng <color=yellow>${tenMon}<color> lên đẳng cấp ${cl + 1} — tỉ lệ thành công <color=yellow>${(L.tu || [])[cl - 1] ?? "?"}%<color>, trượt mất đá`
        : K.o === "linh" ? `quay lại các dòng của <color=yellow>${tenMon}<color> (giữ ngũ hành)`
          : hl ? `đổi <color=yellow>${tenMon}<color> từ hệ ${HE[mon.s | 0]} sang hệ <color=yellow>${HE[K.o]}<color>, giữ độ mạnh các dòng`
            : `đổi <color=yellow>${tenMon}<color> sang ngũ hành khác ngẫu nhiên, quay lại các dòng`;
      this.hoi(`Khảm <color=yellow>${tenDa}<color>: ${viec}.<enter>Phí ${fmtMoney(phi)}.`).then((ok) => {
        if (!ok || this._khamBan) return;
        // anh 17/11 lần 2: bấm Khảm là hiệu ứng chạy ngay 2 vòng (cả 3 loại thủy tinh + Hoán Linh, thành công lẫn thất bại), xong mới hiện câu báo
        // (main.js khamApply đợi promise); trong lúc chạy khóa khung (không bấm Khảm / đổi món); lỗi (thiếu tiền…) thì dừng hiệu ứng, báo ngay
        K.dk = da.k;
        this._khamBan = 1;
        const hu = this._khamHieuUng(2);
        Promise.resolve(this.api.khamNam({ viec: "kham", u: mon.u, da: da.u, oKham: K.o }, { sau: hu })).then(() => hu.then(() => {
          this._khamBan = 0;
          this._khamBu(); // hết chồng đang đặt: lấy chồng cùng loại còn trong túi
          this._khamVe(); this._bagSig = null; this.refresh(true);
        }), (e) => { this._khamBan = 0; this._khamDung(); this.api.msg(String((e && e.message) || e)); });
      });
    });
  }
  get khamMoi() { const w = this.W.get("kham"); return !!(w && w.visible); }
  // mã các món đang đặt ở khung (túi ẩn)
  _khamDs() { const K = this._khamS || {}; return [K.mon, K.da].filter(Boolean); }
  // chồng đá đang đặt không còn trong túi (khảm hết / Sắp xếp gộp vào chồng khác): lấy chồng cùng mã còn lại, bỏ chồng đang ở khung Giao / khung giao dịch / trên
  // tay (soát chéo 17/11: không thì khảm tiếp ăn vào đá đã đưa giao dịch -> giao dịch hỏng); không còn thì trống ô
  _khamBu() {
    const S = this._khamS, bag = this.api.hero().bag || [];
    if (!S || !S.da || bag.some((v) => v.u === S.da)) return;
    const an = new Set([...(this.giaoMo ? this._giaoDs.map((o) => o.u) : []), ...(this._gd ? this._gd.ds.map((o) => o.u) : []), ...(this.hand && this.hand.it ? [this.hand.it.u] : [])]);
    const khac = S.dk ? bag.find((v) => v.k === S.dk && v.u !== S.mon && !an.has(v.u)) : null;
    if (khac) S.da = khac.u; else { S.da = 0; S.o = null; S.dk = null; }
  }
  _khamCap(k) { return (ItemDB.base(k) || {}).cl || 1; } // cấp đồ (do-goc.json — ItemDB.base)
  _khamMon(o) {
    const K = this._khamS || {}, h = this.api.hero(), u = o === "mon" ? K.mon : K.o === o ? K.da : 0;
    return u ? (h.bag || []).find((v) => v.u === u) || null : null;
  }
  _khamGoiY(o) {
    const L = (this.api.luat() || {}).khamNam || {};
    if (o === "mon") return "Ô trang bị: đặt trang bị trong hành trang (tháo ra trước)";
    if (o === "cap") return "Ô Đẳng cấp: Tử Thủy Tinh — nâng cấp đồ";
    if (o === "linh") return "Ô Linh lực: Lục Thủy Tinh — quay lại các dòng";
    const he = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"][o];
    return `Ô ${he}: Lam Thủy Tinh (đổi hệ ngẫu nhiên) hoặc Hoán Linh Thạch (đổi sang hệ ${he}${L.hl ? ` — phí ${fmtMoney(+L.hl.phi || 0)}` : ""})`;
  }
  // món b (trong túi) đặt vào ô o? -> true đã đặt (false: báo lý do)
  _khamDat(b, o) {
    const L = (this.api.luat() || {}).khamNam || {}, D = L.da || {}, x = ItemDB.item(b.k) || {}, K = this._khamS;
    if (this._khamBan) { this.api.msg("Đang khảm nạm, xin chờ…"); return false; }
    if (o === "mon") {
      if (x.ktc || x.thuoc || x.phu || !(x.t >= 0 && x.t <= 9)) { this.api.msg("Ô giữa chỉ đặt trang bị (vũ khí, áo, mũ, đai, giày, hộ uyển, nhẫn, dây chuyền, ngọc bội)"); return false; }
      if (b.het) { this.api.msg("Trang bị có hạn sử dụng không khảm được"); return false; }
      K.mon = b.u;
    } else {
      const hop = o === "cap" ? b.k === D.tu : o === "linh" ? b.k === D.luc : b.k === D.lam || b.k === (L.hl || {}).k;
      if (!hop) { this.api.msg(o === "cap" ? "Ô Đẳng cấp chỉ đặt Tử Thủy Tinh" : o === "linh" ? "Ô Linh lực chỉ đặt Lục Thủy Tinh" : "Ô ngũ hành chỉ đặt Lam Thủy Tinh hoặc Hoán Linh Thạch"); return false; }
      K.da = b.u; K.o = o; K.dk = b.k; // mỗi lần 1 viên: viên cũ (nếu có) về túi
    }
    this._khamVe(); this._bagSig = null; this.refresh(true); this.api.P.audio.ui("click");
    return true;
  }
  _khamBo(o) {
    const K = this._khamS; if (!K || this._khamBan) return;
    if (o === "mon" && K.mon) K.mon = 0; else if (o !== "mon" && K.o === o && K.da) { K.da = 0; K.o = null; } else return;
    this._hideTip(); this._khamVe(); this._bagSig = null; this.refresh(true); this.api.P.audio.ui("click");
  }
  // chuột phải món trong túi khi khung đang mở: trang bị -> ô giữa; Tử -> Đẳng cấp; Lục -> Linh lực; Lam -> ô ngũ hành khác hệ món; Hoán Linh: phải kéo vào ô hệ muốn đổi
  _khamThem(b) {
    if (this._khamBan) return this.api.msg("Đang khảm nạm, xin chờ…");
    const L = (this.api.luat() || {}).khamNam || {}, D = L.da || {}, x = ItemDB.item(b.k) || {};
    if (b.k === (L.hl || {}).k) return this.api.msg("Kéo Hoán Linh Thạch vào ô ngũ hành muốn đổi sang");
    if (b.k === D.tu) return this._khamDat(b, "cap");
    if (b.k === D.luc) return this._khamDat(b, "linh");
    if (b.k === D.lam) { const m = this._khamMon("mon"); return this._khamDat(b, m && (m.s | 0) === 0 ? 1 : 0); }
    if (!x.ktc && x.t >= 0 && x.t <= 9) return this._khamDat(b, "mon");
    this.api.msg("Món này không dùng ở khung khảm nạm");
  }
  // vẽ icon các món đang đặt vào đúng ô (canh giữa ô, giữ cỡ icon)
  _khamVe() {
    const w = this.W.get("kham"), O = this._khamO; if (!w || !O) return;
    for (const [ten, o] of Object.entries(O)) {
      const el = w.node(ten); if (!el) continue;
      el.querySelectorAll("img.jw-icon, b.jw-n").forEach((e) => e.remove());
      const b = this._khamMon(o), x = b && ItemDB.item(b.k);
      if (b) delete el.dataset.tip; else el.dataset.tip = this._khamGoiY(o);
      if (!x || !x.ic) continue;
      const im = document.createElement("img");
      im.className = "jw-icon"; im.src = `assets/web/icon/${esc(x.ic)}`; im.alt = "";
      Object.assign(im.style, { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", maxWidth: "100%", maxHeight: "100%", pointerEvents: "none" });
      el.appendChild(im);
      // ô thủy tinh / Hoán Linh: số viên của chồng đang đặt, góc dưới phải như ô túi (anh 17/11 lần 2 "hiển thị số thủy tinh đang có trong ô khảm nạm")
      if (o !== "mon") { const n = document.createElement("b"); n.className = "jw-n"; n.textContent = String(Math.max(1, b.n | 0)); el.appendChild(n); }
    }
  }
  // hiệu ứng của client (mục Effect — 合成特效.spr 27 khung, ~18 khung / giây), chạy lan vòng -> promise xong khi hết vòng / khung đóng / _khamDung
  _khamHieuUng(lan = 1) {
    this._khamDung();
    const w = this.W.get("kham"), t = w && w.item("Effect");
    if (!t || !t.s.img || !w.visible) return Promise.resolve();
    return new Promise((xong) => {
      const n = t.s.img.n, het = n * Math.max(1, lan); let f = 0;
      this._khamHuXong = xong;
      w.hideItem("Effect", false); w._img(t.el, t.s.img, 0);
      this._khamHu = setInterval(() => { f++; if (f >= het || !w.visible) return this._khamDung(); w._img(t.el, t.s.img, f % n); }, 55);
    });
  }
  _khamDung() {
    clearInterval(this._khamHu); this._khamHu = 0;
    const w = this.W.get("kham"); if (w) w.hideItem("Effect", true);
    const x = this._khamHuXong; this._khamHuXong = null; if (x) x();
  }

  // ---------- Giao dịch giữa 2 người chơi (玩家间交易.ini — khung "exchange"; anh 30/10 "làm cơ chế giao dịch, tham khảo client") ----------
  // Máy chủ: may-chu/giao-dich.js — phiên p tới mỗi nhịp và mỗi lần bấm (main.js gdApply -> giaoDichVe). Trên: tên đối phương (+ đã khóa / đã xác
  // nhận), lưới 8 × 4 món của đối phương (chỉ xem — rê / chạm để xem món), tiền của đối phương; dòng InfoText (câu client G_STR_OPP_*, màu chờ /
  // khóa / bỏ khóa của ini — chưa có tin: "Chờ xác nhận" như chữ vẽ sẵn của nền); dưới: lưới 8 × 4 món mình đưa + ô tiền (gõ số, nút + / − mỗi
  // lần 1 vạn, giữ thì chạy liên tục — ini SendHoldMsg); phải: túi mang theo 6 × 10 + tiền mang theo (đã trừ tiền đưa). Đặt món như khung Giao: bấm
  // món trong túi = cầm lên, bấm ô của lưới mình = đặt đúng ô đó (đè đúng 1 món: đổi chỗ); chuột phải món trong túi = ô trống đầu tiên, chuột phải
  // món đã đặt = trả về túi; điện thoại: kéo thả (dienthoai.js). Món vẫn nằm ở túi trên máy chủ (túi ẩn món đã đặt) tới lúc giao. Đồng ý = khóa
  // giao dịch (OkBtn, bấm lần nữa: bỏ khóa của cả 2 bên), Xác nhận = giao (TradeBtn — 2 bên đều khóa mới bấm được), Hủy bỏ / Esc / đóng = hủy.
  // Anh 14/11 ("bỏ tiền vạn vào không cập nhật theo thời gian thực, dễ bị lừa"): ô tiền gõ tới đâu gửi tới đó (gom 250 ms), máy chủ đẩy ngay cho người
  // kia qua kênh tức thời (main.js Net.wsNghe "gd"); bên nào đổi tiền / món thì cả 2 mất Đồng ý; cạnh 2 dải tên: Chưa đồng ý / Đã đồng ý / Đã xác
  // nhận của từng bên (dải tên dưới = tên mình); tiền đối phương vừa đổi / tin mới ở InfoText: nháy
  _giaoDich() {
    const w = this.W.get("exchange"); if (!w) return;
    const api = this.api, S = w.def.sec;
    this._gd = null;
    for (const k of ["OtherItemsBox", "SelfItemsBox", "TakewithItemsBox"]) { const el = w.node(k); el.classList.add(k === "OtherItemsBox" ? "gd-xem" : "jw-box"); el.oncontextmenu = (e) => e.preventDefault(); }
    const minh = w.node("SelfItemsBox"), tui = w.node("TakewithItemsBox");
    minh.dataset.tha = "gd"; tui.dataset.tha = "tui"; // khung chỗ đặt (_oDat)
    // ô chữ trạng thái (ini không có mục): chép kiểu dải tên đối phương OtherName — dải tên dưới của nền (y 196) = tên mình; phần nền trống bên phải 2 dải
    // (x 150, rộng 82) = trạng thái bên đó (_gdVe)
    const tenHo = w.node("OtherName"), them = (n, y, x, r) => {
      const e = tenHo.cloneNode(true); e.dataset.n = n; e.style.top = y + "px"; if (x != null) Object.assign(e.style, { left: x + "px", width: r + "px" });
      tenHo.parentNode.appendChild(e); return e.firstChild;
    };
    this._gdNhan = { tenMinh: them("gdTenMinh", 196), ttHo: them("gdTtHo", 39, 150, 82), ttMinh: them("gdTtMinh", 196, 150, 82) };
    const khoa = () => { const g = this._gd; if (g && g.p.khoa) { api.msg("Đã khóa giao dịch — bấm Đồng ý lần nữa để bỏ khóa rồi mới đổi món / tiền"); return true; } return false; };
    // lưới mình: đang cầm món -> đặt vào ô; tay trống -> cầm món đã đặt lên (đặt ô khác / bấm túi = trả về túi)
    minh.onclick = (e) => {
      const g = this._gd, H = this.hand; if (!g || khoa()) return;
      const [cx, cy] = this._cellAt(minh, e);
      if (H) { if (H.from !== "bag" && H.from !== "gd") return api.msg("Chỉ đặt được món trong hành trang"); return this._gdDat(H, cx - H.grab[0], cy - H.grab[1]); }
      const o = this._gdTai(cx, cy), b = o && (api.hero().bag || []).find((v) => v.u === o.u); if (!b) return;
      g.ds = g.ds.filter((v) => v !== o);
      this._handPick({ ...b, x: o.x, y: o.y }, "gd", null, e, [cx - o.x, cy - o.y]);
      this._gdVe(true);
    };
    // túi mang theo: như lưới túi của khung Đồ dùng (cầm lên / đặt xuống ô khác của túi); món từ lưới mình: trả về túi
    tui.onclick = (e) => {
      const g = this._gd, H = this.hand, h = api.hero(); if (!g) return;
      const [cx, cy] = this._cellAt(tui, e);
      if (H && H.from === "gd") return void this._handDrop();
      if (H) return this._handToBag(cx, cy);
      const it = this._itemAt((h.bag || []).filter((b) => !g.ds.some((o) => o.u === b.u)), cx, cy);
      if (it) this._handPick(it, "bag", null, e, [cx - it.x, cy - it.y]);
    };
    // ô tiền đưa (anh 14/11): gõ tới đâu gửi tới đó (_gdTien "go" — gom 250 ms), Enter / rời ô / bấm Đồng ý: gửi luôn; bấm vào ô: chọn hết số cũ, gõ là
    // thay (trước: bấm vào ô "0" rồi gõ 500000 thành 5000000); quá tiền mang theo: ô về số tối đa. + / − mỗi lần 1 vạn; giữ nút: chạy liên tục, vừa chạy vừa gửi
    const inp = (this._gdInp = document.createElement("input"));
    inp.className = "jw-num"; inp.maxLength = S.SelfMoney.maxLen || 9; inp.inputMode = "numeric"; inp.spellcheck = false; inp.autocomplete = "off"; inp.name = "tien-giao-dich";
    inp.style.color = `rgb(${S.SelfMoney.color})`;
    w.node("SelfMoney").appendChild(inp);
    inp.oninput = () => { const s = inp.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""); if (s !== inp.value) inp.value = s; this._gdTien(parseInt(s, 10) || 0, "go"); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") inp.blur(); };
    inp.onfocus = () => { if (khoa()) return void inp.blur(); setTimeout(() => { if (document.activeElement === inp) inp.select(); }, 0); };
    inp.onblur = () => { this._gdGuiTien(); this._gdVe(true); };
    const VAN = 10000;
    for (const [k, buoc] of [["AddMoney", VAN], ["ReduceMoney", -VAN]]) {
      const el = w.node(k); let t = null, lap = null, da = false;
      const dung = () => { clearTimeout(t); clearInterval(lap); t = lap = null; if (da) this._gdGuiTien(); };
      el.addEventListener("pointerdown", (e) => { if (e.button || !this._gd || khoa()) return; da = false; t = setTimeout(() => { lap = setInterval(() => { da = true; this._gdTien(this._gd ? this._gd.tien + buoc : 0, "go"); }, 90); }, 400); });
      for (const ev of ["pointerup", "pointercancel", "pointerleave"]) el.addEventListener(ev, dung);
      w.on(k, () => { if (da) { da = false; return; } if (!this._gd || (this._gd.p.khoa && khoa())) return; api.P.audio.ui("click"); this._gdTien(this._gd.tien + buoc, true); });
    }
    // Đồng ý / Xác nhận: kèm phiên bản phần đối phương đang thấy (p.doi.v — đối phương vừa đổi mà mình chưa thấy thì máy chủ không nhận: giao-dich.js
    // xemLai); đang gõ tiền: gửi số đang gõ trước (bấm nút không làm ô nhập mất chọn — uiwin mousedown). Máy chủ không nhận: vẽ lại theo máy chủ
    const lai = (g) => (j) => { if (!j && this._gd === g) this._gdVe(true); return j; };
    w.on("OkBtn", () => {
      const g = this._gd; if (!g) return; api.P.audio.ui("click");
      if (document.activeElement === inp) inp.blur(); else this._gdGuiTien();
      w.check("OkBtn", !g.p.khoa); this._gdGoi({ viec: "khoa", on: g.p.khoa ? 0 : 1, v: g.p.doi.v }).then(lai(g));
    });
    w.on("TradeBtn", () => {
      const g = this._gd; if (!g) return;
      if (!(g.p.khoa && g.p.doi.khoa)) { w.check("TradeBtn", false); return api.msg("Hai bên đều bấm Đồng ý rồi mới Xác nhận được"); }
      api.P.audio.ui("click"); w.check("TradeBtn", !g.p.xn); this._gdGoi({ viec: "xn", on: g.p.xn ? 0 : 1, v: g.p.doi.v }).then(lai(g));
    });
    w.on("CancelBtn", () => { api.P.audio.ui("click"); w.hide(); });
    // đóng khung (Hủy bỏ, Esc, đóng tất cả): hủy giao dịch — máy chủ báo cả 2 bên (số tiền đang gõ dở: thôi gửi)
    w.cb.hide = () => {
      const g = this._gd; if (g) { clearTimeout(g.henTien); g.henTien = 0; g.guiTien = g.tien; }
      this._hideTip(); inp.blur();
      if (!g) return;
      this._gd = null;
      if (this.hand && this.hand.from === "gd") this._handDrop();
      this._gdGoi({ viec: "huy" });
      this._bagSig = null; this.refresh(true);
    };
  }
  // phiên giao dịch (main.js gdApply — mỗi nhịp và mỗi lần bấm): mới -> mở khung giữa màn hình (đóng các cửa sổ khác); null -> hết phiên: đóng khung
  giaoDichVe(p) {
    const w = this.W.get("exchange"); if (!w) return;
    if (!p) {
      if (!this._gd) return;
      clearTimeout(this._gd.henTien); this._gd = null;
      if (this.hand && this.hand.from === "gd") this._handDrop();
      w.hide(); this._bagSig = null; this.refresh(true);
      return;
    }
    if (!this._gd || this._gd.id !== p.id) {
      if (this._gd) { clearTimeout(this._gd.henTien); this._gd = null; w.hide(); }
      this.closeAll();
      // guiTien: số tiền đưa đã gửi máy chủ (_gdGuiTien — trùng thì thôi gửi); henTien: hẹn gửi số đang gõ (gom)
      this._gd = { id: p.id, p, ds: p.ds.slice(), tien: p.tien, guiTien: p.tien, henTien: 0, cho: 0, sig: null };
      const M = w.def.sec.Main;
      Object.assign(w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
      w.show(); this.api.P.audio.ui("click");
    }
    const g = this._gd; g.p = p;
    // món / tiền của mình: theo máy chủ khi không còn lệnh nào đang gửi / hẹn gửi và không cầm món của lưới mình trên tay
    if (!g.cho && !g.henTien && !(this.hand && this.hand.from === "gd")) { g.ds = p.ds.slice(); g.tien = g.guiTien = p.tien; }
    this._gdVe();
  }
  get gdMo() { return !!this._gd; }
  // gửi việc giao dịch lần lượt (đặt món rồi khóa ngay: máy chủ phải nhận đúng thứ tự) -> Promise<trả lời | null>
  _gdGoi(b) {
    const g = this._gd; if (g) g.cho++;
    const r = (this._gdHang || Promise.resolve()).then(() => this.api.gd(b)).then((j) => { if (g) g.cho--; return j; });
    this._gdHang = r.catch(() => null);
    return r;
  }
  // gửi danh sách món mình đặt; máy chủ không nhận (món đã bán / đã khóa…) -> lấy lại theo máy chủ
  _gdGui() {
    const g = this._gd; if (!g) return;
    this._gdGoi({ viec: "dat", ds: g.ds.map(({ u, x, y }) => ({ u, x, y })) }).then((j) => { if (!j && this._gd === g && !g.cho) { g.ds = g.p.ds.slice(); this._gdVe(true); } });
  }
  // tiền đưa = n (cắt về 0 … tiền mang theo); cach: "go" (đang gõ / giữ + −: gom — gửi chậm nhất 250 ms sau lần đổi đầu, người kia thấy gần như ngay) |
  // true (gửi ngay) | không có (chỉ vẽ)
  _gdTien(n, cach) {
    const g = this._gd, h = this.api.hero(); if (!g) return;
    g.tien = Math.max(0, Math.min(Math.floor(n) || 0, h.gold || 0, 999999999));
    this._gdVe(true);
    if (cach === "go") { if (!g.henTien) g.henTien = setTimeout(() => this._gdGuiTien(), 250); }
    else if (cach) this._gdGuiTien();
  }
  // gửi số tiền đưa đang để (bỏ hẹn gom); bằng số đã gửi thì thôi. Máy chủ không nhận (đã khóa…) -> lấy lại theo máy chủ
  _gdGuiTien() {
    const g = this._gd; if (!g) return;
    clearTimeout(g.henTien); g.henTien = 0;
    if (g.tien === g.guiTien) return;
    g.guiTien = g.tien;
    this._gdGoi({ viec: "tien", n: g.tien }).then((j) => { if (!j && this._gd === g && !g.cho && !g.henTien) { g.tien = g.guiTien = g.p.tien; this._gdVe(true); } });
  }
  // món của lưới mình ở ô (cx, cy); _gdCho(cỡ, x, y) -> các món bị đè (null: ra ngoài lưới 8 × 4)
  _gdTai(cx, cy) { return (this._gd ? this._gd.ds : []).find((o) => { const [cw, ch] = this._giaoCo(o.u); return cx >= o.x && cx < o.x + cw && cy >= o.y && cy < o.y + ch; }) || null; }
  _gdCho([cw, ch], x, y) {
    const I = this.W.get("exchange").def.sec.SelfItemsBox;
    if (x < 0 || y < 0 || x + cw > I.hUnits || y + ch > I.vUnits) return null;
    return this._gd.ds.filter((o) => { const [w2, h2] = this._giaoCo(o.u); return !(x + cw <= o.x || o.x + w2 <= x || y + ch <= o.y || o.y + h2 <= y); });
  }
  // đặt món đang cầm (từ túi / từ lưới mình) vào ô (x, y) của lưới mình; đè đúng 1 món: món đó lên tay
  _gdDat(H, x, y) {
    const g = this._gd, de = this._gdCho(this._giaoCo(H.it.u), x, y);
    if (!de || de.length > 1) return;
    if (H.it.het) return this.api.msg("Vật phẩm này không thể giao dịch!"); // món có hạn dùng (ngựa Kỳ Trân Các)
    if (H.it.kbh) return this.api.msg(KBH_DAT); // khóa bảo hiểm (anh 05/11)
    g.ds.push({ u: H.it.u, x, y });
    this._handDrop();
    if (de.length === 1) {
      const o = de[0], b = (this.api.hero().bag || []).find((v) => v.u === o.u);
      g.ds = g.ds.filter((v) => v !== o);
      if (b) this._handPick({ ...b, x: o.x, y: o.y }, "gd", null, { clientX: (this._chuot || [0, 0])[0], clientY: (this._chuot || [0, 0])[1] }, [0, 0]);
    }
    this._gdGui(); this._gdVe(true); this.api.P.audio.ui("click");
  }
  // chuột phải món trong túi mang theo: ô trống đầu tiên của lưới mình (trên xuống, trái sang)
  _gdThem(b) {
    const g = this._gd; if (!g || g.ds.some((o) => o.u === b.u)) return;
    if (g.p.khoa) return this.api.msg("Đã khóa giao dịch — bấm Đồng ý lần nữa để bỏ khóa rồi mới đổi món / tiền");
    if (b.het) return this.api.msg("Vật phẩm này không thể giao dịch!");
    if (b.kbh) return this.api.msg(KBH_DAT); // khóa bảo hiểm (anh 05/11)
    const I = this.W.get("exchange").def.sec.SelfItemsBox, c = this._giaoCo(b.u);
    for (let i = 0; i < I.hUnits * I.vUnits; i++) {
      const x = i % I.hUnits, y = (i / I.hUnits) | 0, de = this._gdCho(c, x, y);
      if (de && !de.length) { g.ds.push({ u: b.u, x, y }); this._gdGui(); this._gdVe(true); this.api.P.audio.ui("click"); return; }
    }
    this.api.msg("Khung giao dịch không còn chỗ");
  }
  // vẽ khung giao dịch (đổi gì mới vẽ lại — luon: vẽ ngay)
  _gdVe(luon) {
    const g = this._gd, w = this.W.get("exchange"), h = this.api.hero(); if (!g || !w.visible || !h || !ItemDB.pack) return;
    const p = g.p, S = w.def.sec, tay = this.hand && (this.hand.from === "bag" || this.hand.from === "gd") ? this.hand.it.u : 0;
    const sig = JSON.stringify([p, g.ds, g.tien, h.bag, h.gold, tay, h.lvl, h.attr]);
    if (!luon && sig === g.sig) return;
    g.sig = sig;
    // trạng thái 2 bên (anh 14/11): ô chữ cạnh dải tên — Chưa đồng ý (UnlockMsgColor) / Đã đồng ý (LockMsgColor viền đỏ) / Đã xác nhận (WaitTradeMsgColor —
    // ini: chữ "chờ giao dịch thực hiện"); dải tên đổi màu khóa khi bên đó Đồng ý. Chữ dài hơn ô (tên 14 ký tự, câu báo dài): thu nhỏ cho vừa, không cắt chữ
    const I = S.InfoText, mau = (c) => `rgb(${c.join(",")})`, N = this._gdNhan;
    const vua = (lab) => { lab.style.fontSize = ""; const c = parseFloat(getComputedStyle(lab).fontSize) || 14; for (let f = c - 1; f >= 9 && lab.scrollWidth > lab.clientWidth + 1; f--) lab.style.fontSize = f + "px"; };
    const tt = (lab, k, x) => {
      const [t, c, v] = x ? ["Đã xác nhận", I.waitTradeMsgColor, I.waitTradeMsgBorderColor] : k ? ["Đã đồng ý", I.lockMsgColor, I.lockMsgBorderColor] : ["Chưa đồng ý", I.unlockMsgColor, null];
      lab.textContent = t; lab.style.color = mau(c); lab.style.textShadow = v ? shadow(v) : ""; vua(lab);
    };
    w.set("OtherName", p.ten).set("OtherMoney", fmtMoney(p.doi.tien)).set("TakewithMoney", fmtMoney(Math.max(0, (h.gold || 0) - g.tien)));
    w.item("OtherName").lab.style.color = mau(p.doi.khoa ? I.lockMsgColor : S.OtherName.color);
    N.tenMinh.textContent = h.name || ""; N.tenMinh.style.color = mau(p.khoa ? I.lockMsgColor : S.OtherName.color);
    vua(w.item("OtherName").lab); vua(N.tenMinh); tt(N.ttHo, p.doi.khoa, p.doi.xn); tt(N.ttMinh, p.khoa, p.xn);
    // dòng InfoText: tin mới nhất cho mình (máy chủ — k: doi màu chờ / khoa chữ vàng viền đỏ / bo xám); chưa có: "Chờ xác nhận"
    const tin = p.tin && p.tin.t ? p.tin : { t: "Chờ xác nhận", k: "doi" }, lab = w.item("InfoText").lab;
    lab.textContent = tin.t;
    lab.style.color = mau(tin.k === "khoa" ? I.lockMsgColor : tin.k === "bo" ? I.unlockMsgColor : I.waitTradeMsgColor);
    lab.style.textShadow = tin.k === "bo" ? "" : shadow(tin.k === "khoa" ? I.lockMsgBorderColor : I.waitTradeMsgBorderColor);
    vua(lab);
    // tiền đối phương vừa đổi / tin mới: nháy cho dễ thấy (anh 14/11 — đổi tiền ngay trước lúc mình bấm)
    const nhay = (el, k) => { try { el.animate(k, { duration: 650, iterations: 2 }); } catch {} };
    if (g.tinN != null && p.tin && p.tin.t && p.tin.n !== g.tinN) nhay(lab, [{ filter: "brightness(2.2)" }, { filter: "none" }]);
    if (g.tienHo != null && p.doi.tien !== g.tienHo) nhay(w.item("OtherMoney").lab, [{ background: "rgba(255,40,40,.8)" }, { background: "rgba(255,40,40,0)" }]);
    g.tinN = p.tin ? p.tin.n : 0; g.tienHo = p.doi.tien;
    w.check("OkBtn", !!p.khoa).check("TradeBtn", !!p.xn);
    w.node("TradeBtn").classList.toggle("gd-tat", !(p.khoa && p.doi.khoa));
    // ô tiền: đang gõ thì giữ chữ đang gõ, trừ khi khác số thật (giữ + / −, quá tiền mang theo)
    const O = this._gdInp, dang = document.activeElement === O;
    if (!dang || (parseInt(O.value, 10) || 0) !== g.tien) O.value = String(g.tien);
    O.readOnly = !!p.khoa;
    const ve = (box, list, B, xem) => {
      box.querySelectorAll(".jw-it").forEach((e) => e.remove());
      for (const b of list) {
        const x = ItemDB.item(b.k); if (!x) continue;
        const el = this._itemEl(h, b, x, B, tay);
        el.onmousemove = (e) => { if (!this.hand) this._showTip(b, e, xem ? undefined : xem === false ? "Bấm: cầm lên · Chuột phải: trả về hành trang" : "Bấm: cầm lên (đặt vào ô giao dịch) · Chuột phải: đặt vào ô giao dịch"); };
        el.onmouseleave = () => this._hideTip();
        box.appendChild(el);
        if (xem) continue;
        el.oncontextmenu = (e) => {
          e.preventDefault(); e.stopPropagation(); this._hideTip();
          if (this.hand) return;
          if (xem !== false) return this._gdThem(b);
          if (g.p.khoa) return this.api.msg("Đã khóa giao dịch — bấm Đồng ý lần nữa để bỏ khóa rồi mới đổi món / tiền");
          g.ds = g.ds.filter((o) => o.u !== b.u); this._gdGui(); this._gdVe(true);
        };
      }
    };
    const bag = h.bag || [], dat = new Set(g.ds.map((o) => o.u));
    ve(w.node("OtherItemsBox"), p.doi.ds.map((o) => ({ ...o.it, x: o.x, y: o.y })), S.OtherItemsBox.unitBorder ?? 1, true);
    ve(w.node("SelfItemsBox"), g.ds.map((o) => { const b = bag.find((v) => v.u === o.u); return b && { ...b, x: o.x, y: o.y }; }).filter(Boolean), S.SelfItemsBox.unitBorder ?? 1, false);
    ve(w.node("TakewithItemsBox"), bag.filter((b) => !dat.has(b.u) && b.x != null), S.TakewithItemsBox.unitBorder ?? 1, null);
  }

  // ---------- Chọn phần thưởng (奖励界面.ini — script client Prise: lời PriseText + 3 ô PriseBtn1–3; Dã Tẩu, anh 27/10) ----------
  // Ô: hình 48 × 48 theo số hình máy chủ gửi (\Ui\PictureList.ini — win.json thuong.hinh: 3 tiền, 4 kinh nghiệm, 5 vật phẩm, 6 thử vận,
  // 7 hủy nhiệm vụ) vẽ ở góc trên-trái ô 57 × 57 như engine — khung ô trên nền 奖励面板.spr có lòng 56 × 56 lệch lên / trái so với ô ini, nên
  // hình nằm cách đều 4 px trong khung (căn giữa ô ini thì lệch xuống-phải); rê chuột: ô gợi ý ghi phần thưởng; bấm -> chỉ số 0–2, đóng -> null
  _thuong() {
    const w = this.W.get("thuong"); if (!w) return;
    const P = w.def.sec.PriseText;
    Object.assign(w.item("PriseText").lab.style, { whiteSpace: "normal", lineHeight: (P.font || 14) + 2 + "px" });
    const xong = (v) => { const r = this._thCb; this._thCb = null; w.hide(); if (r) r(v); };
    for (let i = 1; i <= 3; i++) {
      const n = w.node("PriseBtn" + i);
      Object.assign(n.style, { cursor: "inherit", pointerEvents: "auto" });
      n.onclick = (e) => { e.stopPropagation(); this.api.P.audio.ui("click"); xong(i - 1); };
    }
    w.cb.hide = () => { if (this._thCb) xong(null); };
  }
  chonThuong(o) {
    const w = this.W.get("thuong"); if (!w) return Promise.resolve(null);
    if (this._thCb) { const r = this._thCb; this._thCb = null; r(null); }
    const nm = (this.api.hero() || {}).name || "", H = w.def.hinh || {};
    w.item("PriseText").lab.innerHTML = richText(o.text || "", nm);
    (o.ds || []).slice(0, 3).forEach((d, j) => {
      const n = w.node("PriseBtn" + (j + 1)), im = H[d.h];
      n.innerHTML = im ? `<img src="${this.W.base}${im.file}" width="${im.w}" height="${im.h}" alt="" draggable="false" style="position:absolute;left:0;top:0">` : "";
      n.dataset.tip = d.ten || "";
    });
    const M = w.def.sec.Main;
    Object.assign(w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
    w.show(); this.api.P.audio.ui("click");
    return new Promise((r) => { this._thCb = r; });
  }

  // thông báo 1 nút (cùng khung 提示 — câu báo của client: chưa mua rương mở rộng, trang bị đang khóa…)
  bao(html, nut = "Đóng") { return this.hoi(html, nut, null); }
  // rương đang khóa (anh 27/10: "đồ trên người không tháo được, bấm tháo thì hệ thống báo rương đang khóa"): chặn ngay ở trình duyệt bằng câu
  // client G_STR_ITEM_LOCK_CANNOT_OPERATE (máy chủ cũng chặn — may-chu/do.js KHOA). Trả true nếu đang khóa
  _khoaChan() {
    if (!this.api.hero().khoa) return false;
    this._hideTip();
    this.bao((this.W.strings.G_STR_ITEM_LOCK_CANNOT_OPERATE || "Trang bị đã bị khóa mã rương, không thể thao tác!") + "<enter>Mở khóa: Rương chứa đồ → nút <color=yellow>Mở khóa<color>, nhập mật mã.");
    return true;
  }

  // ---------- Bàn phím số (数字键盘.ini) — mật mã rương (client: "sẽ hiện ra một ô nhỏ, trên đó có từ 0-9 số để nhập vào") ----------
  // Chỉ bấm nút trên bàn phím (anh 27/10: "không cho nhập số mà phải bấm nút trên ô đó") — phím số của bàn phím máy bị nuốt (khỏi dùng thuốc
  // ô 1–9), Enter = Xác nhận, Esc = Hủy. Ô Number hiện * thay chữ số, canh giữa ô. Luật client: số đầu không là 0 (G_UI_NO_ZERO_HEAD), tối đa
  // 9 số (G_UI_PWD_LEN_OVERFLOW). Nút "00" (đè ô 9 + ô Đính chính) và nút Lùi "Quay trở lại" (x 131, rộng 72 — đè ô số 2; ini cho khung rộng
  // 217 nhưng hình nền client chỉ 186) -> ẩn; xóa hết: Đính chính. Khung đặt giữa màn hình theo bề rộng hình nền (186), hoặc sát phải khung
  // gọi (khung thiết lập / đổi mật mã).
  _banPhim() {
    const w = this.W.get("banphim"); if (!w) return;
    const S = this.W.strings || {};
    let s = "";
    const lab = w.item("Number").lab;
    // ô Number: ini rộng 189 (cho khung 217) mà thanh trên hình nền 186 chỉ từ x 14 tới 172 -> ô rộng theo hình để dấu * giữa thanh; dấu * vẽ
    // ở phần trên dòng chữ (đo: mực dấu * cao 6–10 điểm trên chân chữ) -> hạ 3 điểm cho nằm giữa thanh theo chiều dọc (anh 27/10 "dấu sao chưa nằm giữa")
    const Mn = w.def.sec.Main, bwN = (Mn.img && Mn.img.w) || Mn.w, N = w.def.sec.Number;
    w.item("Number").el.style.width = bwN - 2 * N.x + "px";
    Object.assign(lab.style, { display: "block", width: "100%", height: N.h + "px", lineHeight: N.h + "px", position: "relative", top: "3px", paddingTop: "0", letterSpacing: "2px", textAlign: "center" });
    const ve = () => w.set("Number", "*".repeat(s.length));
    const xong = (v) => { const r = this._bpCb; this._bpCb = null; removeEventListener("keydown", this._bpKey, true); w.hide(); if (r) r(v); };
    const them = (d) => {
      if (!s && d === "0") return this.api.msg(S.G_UI_NO_ZERO_HEAD || "Số đầu của mật mã không thể là số 0.");
      if (s.length >= 9) return this.api.msg(S.G_UI_PWD_LEN_OVERFLOW || "Mật mã của Bạn đã đủ độ dài.");
      s += d; ve();
    };
    for (let i = 0; i <= 9; i++) w.on(String(i), () => { this.api.P.audio.ui("click"); them(String(i)); });
    w.hideItem("00", true); w.hideItem("Back", true);
    w.on("Clear", () => { this.api.P.audio.ui("click"); s = ""; ve(); });
    w.on("Confirm", () => {
      this.api.P.audio.ui("click");
      if (!s) return this.api.msg(S.G_UI_PASSWORD_NO_ZERO || "Mật mã không thể là số 0 hoặc để trống.");
      xong(s);
    }).on("Cancel", () => xong(null));
    this._bpKey = (e) => {
      if (e.key === "Escape") xong(null);
      else if (e.key === "Enter") { if (s) xong(s); }
      else if (!/^(\d|Backspace|Delete)$/.test(e.key) && !e.code.startsWith("Numpad")) return;
      e.preventDefault(); e.stopPropagation();
    };
    w.cb.show = () => { s = ""; ve(); };
    w.cb.hide = () => { if (this._bpCb) { const r = this._bpCb; this._bpCb = null; removeEventListener("keydown", this._bpKey, true); r(null); } };
  }
  banPhim(loi, canh) {
    const w = this.W.get("banphim"); if (!w) return Promise.resolve(null);
    if (this._bpCb) { const r = this._bpCb; this._bpCb = null; r(null); }
    if (loi) this.api.msg(loi);
    const M = w.def.sec.Main, bw = (M.img && M.img.w) || M.w, bh = (M.img && M.img.h) || M.h;
    const x = canh ? canh.offsetLeft + canh.offsetWidth + 4 : Math.round((1024 - bw) / 2), y = canh ? canh.offsetTop : Math.round((768 - bh) / 2);
    Object.assign(w.el.style, { left: Math.min(1024 - bw, x) + "px", top: Math.max(0, Math.min(768 - bh, y)) + "px" });
    w.show(); addEventListener("keydown", this._bpKey, true);
    return new Promise((r) => { this._bpCb = r; });
  }
  // ---------- Thiết lập / đổi mật mã rương (设置密码.ini: NewPassword + NewPassConfirm · 修改密码.ini: thêm Password cũ) ----------
  // Như client: bấm vào ô thì hiện bàn phím số để nhập (không có ô gõ phím — bản trước dùng ô mật khẩu của trình duyệt, Chrome tưởng mật mã
  // rương là mật khẩu đăng nhập và hỏi "Cập nhật mật khẩu?" — anh 27/10). Ô hiện * (ini Password=1). Đồng ý -> máy chủ (act datMk / doiMk —
  // may-chu/do.js); 2 lần nhập khác nhau: câu client G_UI_PASSWORD_NOT_MATCH.
  _mk(key) {
    const w = this.W.get(key); if (!w) return;
    const sec = w.def.sec, S = this.W.strings || {}, o = {};
    const ve = (f) => w.set(f, o[f] ? "*".repeat(o[f].length) : (sec[f].text || "chữ số"));
    for (const f of ["Password", "NewPassword", "NewPassConfirm"]) {
      if (!sec[f]) continue;
      const el = w.node(f);
      Object.assign(el.style, { pointerEvents: "auto", cursor: "pointer" });
      el.onclick = (e) => { e.stopPropagation(); this.api.P.audio.ui("click"); this.banPhim(null, w.el).then((v) => { if (v) { o[f] = v; ve(f); } }); };
    }
    const ok = () => {
      const moi = o.NewPassword, lai = o.NewPassConfirm;
      if (o.Password !== undefined && !o.Password && sec.Password) return this.api.msg("Bấm vào ô mật mã cũ để nhập");
      if (!moi) return this.api.msg(S.G_UI_PASSWORD_NO_ZERO || "Mật mã không thể là số 0 hoặc để trống.");
      if (moi !== lai) return this.api.msg(S.G_UI_PASSWORD_NOT_MATCH || "Mật mã điền nhập không phù hợp");
      this.api.doItem(sec.Password ? { act: "doiMk", mk: o.Password || "", moi } : { act: "datMk", moi }).then((r) => { if (r) w.hide(); });
    };
    w.on("Confirm", ok).on("Cancel", () => w.hide());
    w.cb.show = () => { for (const f of Object.keys(o)) delete o[f]; for (const f of ["Password", "NewPassword", "NewPassConfirm"]) if (sec[f]) { o[f] = ""; ve(f); } };
    w.cb.hide = () => { if (this._bpCb) this.W.get("banphim").hide(); };
  }
  _mkMo(key) {
    const w = this.W.get(key); if (!w) return;
    Object.assign(w.el.style, { left: Math.round(512 - w.def.sec.Main.w - 50) + "px", top: Math.round((768 - w.def.sec.Main.h) / 2) + "px" });
    w.show(); this.api.P.audio.ui("click");
    const dau = w.def.sec.Password ? "Password" : "NewPassword";
    w.node(dau).click(); // mở bàn phím cho ô đầu luôn
  }

  // ---------- Xếp hạng (排名.ini: danh sách mục IndexList bên trái, hạng MessageList bên phải) — anh 27/10, bước 7 ----------
  // Mục: Cấp độ (cả máy chủ) · Tài phú (ngân lượng mang theo + trong rương) · từng phái (cấp trong phái). Dữ liệu: GET /api/xep-hang
  // (máy chủ đọc lại mọi nhân vật nhiều nhất 30 giây 1 lần — may-chu/xep-hang.js). Mục đang chọn: chữ SelColor, nền SelItemBgColor, viền
  // chữ SelBorderColor như ini; nhân vật mình: dòng chữ vàng.
  _xephang() {
    const w = this.W.get("xephang"); if (!w) return;
    const api = this.api, sec = w.def.sec, I = sec.IndexList, M = sec.MessageList, c = (a) => `rgb(${a.join(",")})`;
    const idx = w.node("IndexList"), msg = w.node("MessageList");
    // anh 27/10 "BXH lỗi giao diện, text chạy lung tung, viền bị cắt": hình nền client 排名.spr rộng 480 (ini ghi 433 — của bản khác), vạch chia
    // 2 ô ở x 188–192, viền phải 462–480 -> khung rộng đúng hình, 2 danh sách + thanh cuộn phải + nút Đóng xếp theo hình (đo điểm ảnh)
    const BG = sec.Main.img || {}, wBg = Math.max(sec.Main.w, BG.w || 0);
    w.el.style.width = wBg + "px";
    const dat = (k, o) => { const t = w.item(k); if (t) Object.assign(t.el.style, Object.fromEntries(Object.entries(o).map(([a, v]) => [a, v + "px"]))); };
    dat("IndexList", { left: 22, top: 25, width: 162, height: 248 });
    dat("MessageList", { left: 198, top: 25, width: 260, height: 248 });
    dat("MessageScroll", { left: wBg - 16 });
    dat("BtnClose", { left: Math.round((wBg - sec.BtnClose.w) / 2) });
    for (const [el, s] of [[idx, I], [msg, M]]) { el.classList.add("jw-list"); el.style.color = c(s.color || s.msgColor || [255, 255, 255]); }
    const cuon = [ganCuon(this.W, w, "IndexList", "IndexScroll"), ganCuon(this.W, w, "MessageList", "MessageScroll")].filter(Boolean);
    w.on("BtnClose", () => w.hide());
    this._xh = { ds: null, luc: 0, chon: 0 };
    // cột: Hạng · Tên · Cấp · Môn phái (Tài phú: Hạng · Tên · Ngân lượng); tên phái gọn (bỏ "phái / Bang / Giáo / môn") cho vừa cột
    const phai = (id) => this._tenPhai(id).replace(/\s+(phái|Bang|Giáo|môn)$/i, "").replace(/^Vô$/, "Vô môn phái");
    // mục Bang hội (anh 14/11 — Bang hội đợt 1): /api/xep-hang trả thêm bang [{ ten, chu, cap, n, tongCap }] (vòng quét 5 phút của may-chu/xep-hang.js) — máy chủ
    // cũ không gửi thì không có mục; xếp cấp bang -> nhân số -> tổng cấp; bang mình chữ vàng
    const muc = () => [{ n: "Cấp độ", loc: () => true, cot: ["Cấp", "Môn phái"], gt: (r) => [r.lvl, phai(r.fac)] },
      { n: "Tài phú", loc: () => true, cot: ["Ngân lượng"], gt: (r) => [fmtMoney(r.tien)], xep: (a, b) => b.tien - a.tien },
      ...(Array.isArray(this._xh.bang) ? [{ n: "Bang hội", bang: 1, loc: () => true, cot: ["Cấp", "Nhân số"], gt: (r) => [r.cap | 0, `${r.n | 0} người`], xep: (a, b) => (b.cap | 0) - (a.cap | 0) || (b.kt || 0) - (a.kt || 0) || (b.tongCap | 0) - (a.tongCap | 0) || (b.n | 0) - (a.n | 0) }] : []), // thứ tự như máy chủ: cấp -> kiến thiết tích lũy (kt vạn — đợt 2) -> tổng cấp -> số người (soát 14/11)
      ...(api.P.factions || []).map((f) => ({ n: f.n, loc: (r) => r.fac === f.id, cot: ["Cấp"], gt: (r) => [r.lvl] }))];
    const o = (t, w, can = "left", them = "") => `<span style="display:inline-block;width:${w}px;text-align:${can};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;vertical-align:top;${them}">${esc(t)}</span>`;
    const dong = (m, hang, ten, gt, mau) => `<div style="height:16px;line-height:16px;white-space:nowrap;${mau ? `color:${mau}` : ""}">${o(hang, 28, "right")}${o(ten, 112, "left", "padding-left:8px")}${m.cot.length === 2 ? o(gt[0], 30, "right") + o(gt[1], 82, "left", "padding-left:8px") : o(gt[0], 112, "right")}</div>`;
    const ve = () => {
      const M0 = muc(), k = Math.min(this._xh.chon, M0.length - 1), m = M0[k], ten = (api.hero() || {}).name;
      idx.innerHTML = M0.map((x, i) => `<div data-i="${i}" style="height:16px;line-height:16px;padding-left:4px;cursor:pointer;white-space:nowrap;${i === k ? `color:${c(I.selColor)};background:${c(I.selItemBgColor)};text-shadow:1px 0 ${c(I.selBorderColor)},-1px 0 ${c(I.selBorderColor)},0 1px ${c(I.selBorderColor)},0 -1px ${c(I.selBorderColor)}` : ""}">${esc(x.n)}</div>`).join("");
      const L = ((m.bang ? this._xh.bang : this._xh.ds) || []).filter(m.loc), bm = m.bang && api.bhMinh ? (api.bhMinh() || {}).ten : null;
      if (m.xep) L.sort(m.xep);
      msg.innerHTML = dong(m, "Hạng", m.bang ? "Bang hội" : "Tên", m.cot, c(I.selColor)) + (!this._xh.ds ? `<div style="padding:4px">Đang tải…</div>`
        : !L.length ? `<div style="padding:4px">${m.bang ? "Chưa có bang hội nào" : "Chưa có ai"}</div>`
        : L.map((r, i) => (m.bang ? dong(m, i + 1, r.ten, m.gt(r), bm && r.ten === bm ? c([255, 217, 78]) : "") : dong(m, i + 1, r.n, m.gt(r), r.n === ten ? c([255, 217, 78]) : ""))).join(""));
      for (const x of cuon) x.sync();
    };
    idx.onclick = (e) => { const d = e.target.closest("[data-i]"); if (!d) return; api.P.audio.ui("click"); this._xh.chon = +d.dataset.i; msg.scrollTop = 0; ve(); };
    this._xhVe = ve;
    w.cb.show = () => {
      ve();
      if (this._xh.ds && Date.now() - this._xh.luc < 30000) return;
      api.xepHang().then((j) => { this._xh.ds = j.ds || []; this._xh.bang = Array.isArray(j.bang) ? j.bang : null; this._xh.luc = Date.now(); if (w.visible) ve(); }).catch((e) => api.msg("Xếp hạng: " + e.message));
    };
  }
  _tenPhai(id) { const f = id == null ? null : (this.api.P.factions || []).find((x) => x.id === id); return f ? f.n : "Vô môn phái"; }
  // giữa màn hình như các hộp thoại khác (ini đặt 290, 220)
  openXepHang() {
    const w = this.W.get("xephang"); if (!w) return;
    Object.assign(w.el.style, { left: Math.round((1024 - (parseInt(w.el.style.width, 10) || w.def.sec.Main.w)) / 2) + "px", top: Math.round((768 - w.def.sec.Main.h) / 2) + "px" });
    w.toggle(); this.api.P.audio.ui("click");
  }

  // ---------- Kết quả boss thế giới (src/game/bosstg.js — anh 31/10: "đánh boss có xếp hạng thì bảng xếp hạng nằm đâu; ra thưởng nên có icon
  // thưởng, sắp xếp lại bố cục cho đẹp") ----------
  // Khung 排名.ini của client (cửa sổ "btgkq" chung định nghĩa với "xephang" — nền in sẵn "Xếp hạng", nút "đóng lại"), xếp như _xephang: cột trái =
  // bảng xếp hạng sát thương lúc boss chết (10 người đầu, mình chữ vàng; ngoài 10 thì thêm dòng của mình), cột phải = tên boss, hạng / % của mình,
  // phần thưởng: ô 48 × 48 kinh nghiệm (\Ui\PictureList.ini hình 4 — win.json thuong.hinh) + ô từng món (icon của món, số góc dưới phải; rê chuột /
  // chạm: ô xem món); túi đầy: các món còn chờ + dòng đỏ. ds = [{ ten, hang (0: đứng xem), pct, kn, mon: [{ k, n }], kich?: { kn, mon }, day, cho,
  // bang: [[tên, %]], so, tenNv, khongDu?, chiXem? }] (may-chu/boss-tg.js nhanThuong)
  ketQuaBoss(ds) {
    const W = this.W, r = ds && ds[ds.length - 1]; if (!r) return;
    W.M.btgkq = W.M.btgkq || W.M.xephang;
    const w = W.get("btgkq"); if (!w) return;
    const sec = w.def.sec, I = sec.IndexList, c = (a) => `rgb(${a.join(",")})`, idx = w.node("IndexList"), msg = w.node("MessageList");
    if (!this._bk) {
      const BG = sec.Main.img || {}, wBg = Math.max(sec.Main.w, BG.w || 0);
      w.el.style.width = wBg + "px";
      const dat = (k, o) => { const t = w.item(k); if (t) Object.assign(t.el.style, Object.fromEntries(Object.entries(o).map(([a, v]) => [a, v + "px"]))); };
      dat("IndexList", { left: 22, top: 25, width: 162, height: 248 });
      dat("MessageList", { left: 198, top: 25, width: 260, height: 248 });
      dat("MessageScroll", { left: wBg - 16 });
      dat("BtnClose", { left: Math.round((wBg - sec.BtnClose.w) / 2) });
      for (const el of [idx, msg]) { el.classList.add("jw-list"); el.style.color = c(I.color || [218, 255, 165]); }
      this._bk = { cuon: [ganCuon(W, w, "IndexList", "IndexScroll"), ganCuon(W, w, "MessageList", "MessageScroll")].filter(Boolean) };
      w.on("BtnClose", () => w.hide());
      // ô món: ô xem món như túi đồ; ô kinh nghiệm: ô gợi ý chữ (data-tip — _tipChu)
      msg.onmousemove = (e) => { const o = e.target.closest("[data-k]"); if (o) this._showTip({ k: o.dataset.k, n: +o.dataset.n || 1 }, e); else this._hideTip(); };
      msg.onmouseleave = () => this._hideTip();
    }
    const so = (n) => Math.round(n).toLocaleString("vi-VN"), pt = (p) => String(p).replace(".", ","), vang = c([255, 217, 78]);
    const o = (t, wd, can = "left", them = "") => `<span style="display:inline-block;width:${wd}px;text-align:${can};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;vertical-align:top;${them}">${esc(t)}</span>`;
    const dong = (h, ten, p, mau) => `<div style="height:16px;line-height:16px;white-space:nowrap;${mau ? `color:${mau}` : ""}">${o(h, 30, "right")}${o(ten, 78, "left", "padding-left:6px")}${o(p, 44, "right")}</div>`;
    const bang = r.bang || [], minh = r.tenNv || (this.api.hero() || {}).name;
    idx.innerHTML = dong("Hạng", "Tên", "%", c(I.selColor || [255, 253, 122]))
      + bang.map(([t, p], i) => dong(i + 1, t, pt(p), t === minh ? vang : "")).join("")
      + (r.hang > bang.length ? `<div style="height:16px;line-height:16px;text-align:center">…</div>` + dong(r.hang, minh, pt(r.pct), vang) : "");
    const H = (W.M.thuong && W.M.thuong.hinh) || {}, exp = H[4];
    const oMon = (m) => { const x = ItemDB.item(m.k) || {}; return `<div class="bk-o" data-k="${esc(m.k)}" data-n="${m.n | 0}">${x.ic ? `<img src="assets/web/icon/${esc(x.ic)}" alt="" draggable="false">` : ""}${(m.n | 0) > 1 ? `<b>${m.n | 0}</b>` : ""}</div>`; };
    // anh 31/10: mọi người đánh / đứng xem đều có khung; 2 loại quà — xếp hạng (top 10, kinh nghiệm theo %) và kích sát (người ra đòn kết liễu)
    const nhan = r.mon || [], cho = r.day ? r.cho || [] : [], K = r.kich;
    // mỗi phần: tiêu đề + số kinh nghiệm, 1 hàng ô (ô EXP — rê / chạm: số kinh nghiệm — rồi ô món) — 2 phần vừa khung không phải cuộn
    const oKn = (kn) => `<div class="bk-o" data-tip="${so(kn)} điểm kinh nghiệm">${exp ? `<img src="${W.base}${exp.file}" width="${exp.w}" height="${exp.h}" alt="" draggable="false">` : ""}</div>`;
    const phan = (tieu, kn, L) => `<div class="bk-tieu">${tieu}${kn ? ` <em>${so(kn)} kinh nghiệm</em>` : ""}</div>` + (kn || L.length ? `<div class="bk-luoi">${kn ? oKn(kn) : ""}${L.map(oMon).join("")}</div>` : "");
    msg.innerHTML = `<div class="bk-dau">${esc(r.ten)}</div>`
      + (r.chiXem ? `<div class="bk-dong">Bạn: đứng xem, không đánh · ${r.so || bang.length} người đánh</div>` : `<div class="bk-dong">Bạn: <span style="color:${vang}">hạng ${r.hang}/${r.so || bang.length}</span> — ${pt(r.pct)}% sát thương</div>`)
      // chưa đủ % (anh 11/11 "không vào top vẫn có exp"): vẫn có kinh nghiệm theo %, không có quà xếp hạng
      + (r.chiXem ? `<div class="bk-tieu">Thưởng xếp hạng</div><div class="bk-dong bk-khong">Không đánh boss — không có thưởng</div>`
        : r.khongDu ? phan("Thưởng xếp hạng", r.kn, []) + `<div class="bk-dong bk-khong">Chưa đủ ${r.khongDu}% sát thương — không có quà xếp hạng</div>` : phan("Thưởng xếp hạng", r.kn, nhan))
      + (r.tg ? phan("Quà tham gia", 0, [{ k: "ms:1884", n: r.tg }]) : "") // anh 11/11: ai đánh boss cũng có Bảo rương đồ xanh (vào túi ở nhịp — hàng chờ)
      + (K ? phan("Thưởng kích sát", K.kn, K.mon || []) : "")
      + (cho.length ? `<div class="bk-dong bk-day">Hành trang đầy — dọn chỗ để nhận (giữ 30 phút):</div><div class="bk-luoi bk-cho">${cho.map(oMon).join("")}</div>` : "");
    for (const x of this._bk.cuon) x.sync();
    idx.scrollTop = 0; msg.scrollTop = 0;
    Object.assign(w.el.style, { left: Math.round((1024 - (parseInt(w.el.style.width, 10) || sec.Main.w)) / 2) + "px", top: Math.round((768 - sec.Main.h) / 2) + "px" });
    if (!w.visible) w.show();
    this.api.P.audio.ui("click");
  }

  // ---------- Kết quả lôi đài (src/game/loidai.js — anh 15/11 chọn mẫu A: khung 排名 "Xếp hạng" như ketQuaBoss; cửa sổ "ldkq" chung định nghĩa với "xephang") ----------
  // Cột trái: tuyển thủ 2 bên (bên thắng trước) + số hạ — còn trụ màu bên, bị hạ / rời sân xám. Cột phải: Lôi đài N · N vs N, bên thắng chữ lớn màu bên / Hòa / Trận hủy,
  // lý do, còn trụ mỗi bên, kết quả của mình (hoặc "Bạn xem trận này"), hạ nhiều nhất, "N giây nữa về <thành>" (đếm lùi). kq = { thang: 0 | 1 | -1, lyDo, ds: [[tên, bên,
  // hạ, kết thúc]], huy? }; o = { so, che, ten (mình), ng: [[tên, bên, hệ, cấp, còn sống, hạ]] lúc hết trận, doi: [[đội trưởng, …] × 2], veTen, ra (Date.now() lúc tự về) }
  ketQuaLoiDai(kq, o = {}) {
    const W = this.W; if (!kq) return;
    W.M.ldkq = W.M.ldkq || W.M.xephang;
    const w = W.get("ldkq"); if (!w) return;
    const sec = w.def.sec, I = sec.IndexList, c = (a) => `rgb(${a.join(",")})`, idx = w.node("IndexList"), msg = w.node("MessageList");
    if (!this._ldk) {
      const BG = sec.Main.img || {}, wBg = Math.max(sec.Main.w, BG.w || 0);
      w.el.style.width = wBg + "px";
      const dat = (k, x) => { const t = w.item(k); if (t) Object.assign(t.el.style, Object.fromEntries(Object.entries(x).map(([a, v]) => [a, v + "px"]))); };
      dat("IndexList", { left: 22, top: 25, width: 162, height: 248 });
      dat("MessageList", { left: 198, top: 25, width: 260, height: 248 });
      dat("MessageScroll", { left: wBg - 16 });
      dat("BtnClose", { left: Math.round((wBg - sec.BtnClose.w) / 2) });
      for (const el of [idx, msg]) { el.classList.add("jw-list"); el.style.color = c(I.color || [218, 255, 165]); }
      this._ldk = { cuon: [ganCuon(W, w, "IndexList", "IndexScroll"), ganCuon(W, w, "MessageList", "MessageScroll")].filter(Boolean), hen: 0 };
      w.on("BtnClose", () => w.hide());
    }
    const MAU = ["#ff92ff", "#55ff91"], BEN = ["Giáp", "Ất"], XAM = "#8f8a7e", vang = c([255, 217, 78]);
    const songCua = new Map((Array.isArray(o.ng) ? o.ng : []).filter(Array.isArray).map((r) => [String(r[0]), !!r[4]]));
    const ds = (Array.isArray(kq.ds) ? kq.ds : []).filter(Array.isArray).map(([ten, ben, giet, ket]) => ({ ten: String(ten ?? ""), ben: ben ? 1 : 0, giet: giet | 0, ket: String(ket ?? ""),
      song: songCua.has(String(ten ?? "")) ? songCua.get(String(ten ?? "")) : /còn/i.test(String(ket ?? "")) }));
    const huy = !!kq.huy || /hủy/i.test(String(kq.lyDo || "")), th = !huy && (kq.thang === 0 || kq.thang === 1) ? kq.thang : -1;
    const doi = Array.isArray(o.doi) ? o.doi : [], tenDoi = (i) => (Array.isArray(doi[i]) && doi[i][0] ? String(doi[i][0]) : "");
    const dong = (x) => `<div class="ldk-r"><span style="color:${x.song ? MAU[x.ben] : XAM}">${esc(x.ten)}</span><span>${x.giet}</span></div>`;
    idx.innerHTML = `<div class="ldk-h"><span>Tuyển thủ</span><span>Hạ</span></div>` + (th === 1 ? [1, 0] : [0, 1]).map((i) => {
      const L = ds.filter((x) => x.ben === i).sort((a, b) => b.song - a.song || b.giet - a.giet);
      return `<div class="ldk-ben" style="color:${MAU[i]}">${BEN[i]}${tenDoi(i) ? ` · Đội ${esc(tenDoi(i))}` : ""}</div>` + (L.length ? L.map(dong).join("") : `<div class="ldk-r ldk-xam">— không ai vào —</div>`);
    }).join("");
    const song = [0, 1].map((i) => ds.filter((x) => x.ben === i && x.song).length), minh = ds.find((x) => x.ten === o.ten);
    const top = ds.reduce((b, x) => (x.giet > (b ? b.giet : 0) ? x : b), null);
    const ketMinh = !minh ? "Bạn xem trận này" : `${esc(minh.ten)} · <span style="color:${MAU[minh.ben]}">${BEN[minh.ben]}</span> · hạ ${minh.giet} · `
      + (huy ? `<span class="ldk-xam">trận hủy</span>` : th < 0 ? `<span style="color:${vang}">Hòa</span>` : th === minh.ben ? `<span style="color:#7dff8a">Thắng</span>` : `<span style="color:#ff8a6a">Thua</span>`);
    msg.innerHTML = `<div class="bk-dau">${kq.tt ? "Tỉ thí · " : ""}Lôi đài ${o.so | 0} · ${o.che | 0} vs ${o.che | 0}</div>`
      + (huy ? `<div class="ldk-to ldk-xam">Trận hủy</div>` : th < 0 ? `<div class="ldk-to" style="color:${vang}">Hòa</div>` : `<div class="ldk-to" style="color:${MAU[th]}">${BEN[th]} thắng</div>`)
      + (kq.lyDo ? `<div class="ldk-d">${chuMau(kq.lyDo)}</div>` : "")
      + (huy ? "" : `<div class="ldk-d">Còn trụ: <span style="color:${MAU[0]}">Giáp ${song[0]}</span> · <span style="color:${MAU[1]}">Ất ${song[1]}</span></div>`)
      // tỉ thí (anh 17/11): tổng sát thương mỗi bên — hết giờ bên nhiều hơn thắng
      + (kq.tt && Array.isArray(kq.st) && !huy ? `<div class="ldk-d">Sát thương: ${[0, 1].map((i) => `<span style="color:${MAU[i]}">${esc(tenDoi(i) || BEN[i])} ${Math.round(+kq.st[i] || 0).toLocaleString("vi-VN")}</span>`).join(" · ")}</div>` : "")
      + `<div class="bk-tieu">Bạn</div><div class="ldk-d">${ketMinh}</div>`
      + (top ? `<div class="bk-tieu">Trận này</div><div class="ldk-d">Hạ nhiều nhất: <span style="color:${MAU[top.ben]}">${esc(top.ten)}</span> (${top.giet})</div>` : "")
      + `<div class="ldk-d ldk-dem"></div>`;
    // đếm lùi tới lúc tự về (loidai.js tick đưa về — ở đây chỉ chữ)
    const dem = msg.querySelector(".ldk-dem"), ve = o.veTen || "thành", ra = +o.ra || 0;
    const demLai = () => { const n = Math.ceil((ra - Date.now()) / 1000); dem.textContent = !ra ? "" : n > 0 ? `${n} giây nữa về ${ve}` : `Về ${ve}`; return n > 0; };
    clearInterval(this._ldk.hen);
    if (demLai()) this._ldk.hen = setInterval(() => { if (!dem.isConnected || !w.visible || !demLai()) clearInterval(this._ldk.hen); }, 1000);
    for (const x of this._ldk.cuon) x.sync();
    idx.scrollTop = 0; msg.scrollTop = 0;
    Object.assign(w.el.style, { left: Math.round((1024 - (parseInt(w.el.style.width, 10) || sec.Main.w)) / 2) + "px", top: Math.round((768 - sec.Main.h) / 2) + "px" });
    if (!w.visible) w.show();
    this.api.P.audio.ui("click");
  }
  // bảng tổng kết đua ngựa (anh 16/11 "lúc kết thúc không thấy bảng tổng kết gì, chỉ thấy trực tiếp đưa về ba lăng … khá là hụt hẫng" — src/game/duangua.js moBang): khung 排名 của
  // client như bảng kết quả lôi đài — trái: hạng · tên · thời gian người về đích (dòng của mình vàng), phải: kết quả của mình (hạng, thời gian, thưởng), số người về đích, đếm lùi về.
  // d = { ten, thu, ket (cả lượt đã xong), kq: [[hạng, tên, giây, bot]], th?: { hang, giay, chu }, roi, ve, soVe, n, minh (tên mình), ra (lúc tự về | 0), veTen }
  ketQuaDuaNgua(d) {
    const W = this.W; if (!d) return;
    W.M.dnkq = W.M.dnkq || W.M.xephang;
    const w = W.get("dnkq"); if (!w) return;
    const sec = w.def.sec, I = sec.IndexList, c = (a) => `rgb(${a.join(",")})`, idx = w.node("IndexList"), msg = w.node("MessageList");
    if (!this._dnk) {
      const BG = sec.Main.img || {}, wBg = Math.max(sec.Main.w, BG.w || 0);
      w.el.style.width = wBg + "px";
      const dat = (k, x) => { const t = w.item(k); if (t) Object.assign(t.el.style, Object.fromEntries(Object.entries(x).map(([a, v]) => [a, v + "px"]))); };
      // anh 16/11 "căn chỉnh lại vị trí và style, hơi xấu": cột trái trong ô trái của hình (x 20–187, vạch chia 188–192 — như _xephang; bản đầu rộng 182 đè vạch chia),
      // cao 247 = dòng đầu (23) + 14 dòng × 16, đáy 272 vừa khít trên viền dưới (bản đầu 248 + dòng đầu 23: dòng thứ 15 bị viền dưới cắt nửa)
      dat("IndexList", { left: 22, top: 25, width: 162, height: 247 });
      dat("MessageList", { left: 198, top: 25, width: 260, height: 247 });
      dat("MessageScroll", { left: wBg - 16 });
      dat("BtnClose", { left: Math.round((wBg - sec.BtnClose.w) / 2) });
      for (const el of [idx, msg]) { el.classList.add("jw-list"); el.style.color = c(I.color || [218, 255, 165]); }
      this._dnk = { cuon: [ganCuon(W, w, "IndexList", "IndexScroll"), ganCuon(W, w, "MessageList", "MessageScroll")].filter(Boolean), hen: 0 };
      w.on("BtnClose", () => w.hide());
    }
    const vang = c([255, 217, 78]), gio = (g) => `${Math.floor((g | 0) / 60)}:${String((g | 0) % 60).padStart(2, "0")}`;
    const kq = (Array.isArray(d.kq) ? d.kq : []).filter(Array.isArray), th = d.th && d.th.hang ? d.th : null;
    // hạng canh phải 1 cột (số 1–30 thẳng hàng), tên dài cắt "…", thời gian sát phải; bot (chỉ lượt thử) chữ nhạt, không thêm "(bot)" cho khỏi chật cột
    const so = (h) => `<b style="display:inline-block;width:20px;margin-right:5px;text-align:right;font-weight:normal">${h | 0}.</b>`;
    idx.innerHTML = `<div class="ldk-h"><span>Tuyển thủ</span><span>Thời gian</span></div>`
      + (kq.length ? kq.map(([h, ten, g, bot]) => `<div class="ldk-r"${String(ten) === d.minh ? ` style="color:${vang}"` : bot ? ` style="color:#a8a290"` : ""}><span>${so(h)}${esc(ten)}</span><span>${gio(g)}</span></div>`).join("")
        : `<div class="ldk-r ldk-xam">— chưa ai về đích —</div>`);
    msg.innerHTML = `<div class="bk-dau">${esc(d.ten || "Truy Phong Đại Loạn Đấu")}${d.thu ? ` <small style="font:13px/18px var(--jx);color:#a8a290">(lượt thử)</small>` : ""}</div>`
      + `<div class="ldk-to" style="color:${th ? vang : "#e9e3cf"}">${th ? `Về đích hạng ${th.hang | 0}` : d.ket ? "Cuộc đua kết thúc" : "Đang đua"}</div>`
      + (th ? `<div class="ldk-d">Thời gian: ${gio(th.giay)}</div><div class="bk-tieu">Phần thưởng</div><div class="ldk-d">${esc(th.chu || "—")}</div>`
        : `<div class="ldk-d">Bạn chưa về đích${d.roi ? " (đã rời đường đua)" : ""}${d.ket ? " — lượt này không có thưởng" : ""}.</div>`)
      + `<div class="bk-tieu">${d.ket ? "Lượt đua" : "Hiện tại"}</div><div class="ldk-d">${d.ve | 0} / ${d.soVe | 0} người về đích · ${d.n | 0} người đua</div>`
      + (d.ket ? "" : `<div class="ldk-d ldk-xam">Bảng tổng kết hiện lại khi cuộc đua kết thúc.</div>`)
      + `<div class="ldk-d ldk-dem"></div>`;
    const dem = msg.querySelector(".ldk-dem"), ve = d.veTen || "Ba Lăng huyện", ra = +d.ra || 0;
    const demLai = () => { const n = Math.ceil((ra - Date.now()) / 1000); dem.textContent = !ra ? "" : n > 0 ? `${n} giây nữa về ${ve}` : `Về ${ve}`; return n > 0; };
    clearInterval(this._dnk.hen);
    if (demLai()) this._dnk.hen = setInterval(() => { if (!dem.isConnected || !w.visible || !demLai()) clearInterval(this._dnk.hen); }, 1000);
    for (const x of this._dnk.cuon) x.sync();
    idx.scrollTop = 0; msg.scrollTop = 0;
    // dòng của mình trong danh sách: cuộn tới (danh sách dài 30 người)
    const minh = [...idx.querySelectorAll(".ldk-r")].find((r) => r.style.color); if (minh) idx.scrollTop = Math.max(0, minh.offsetTop - idx.clientHeight / 2);
    Object.assign(w.el.style, { left: Math.round((1024 - (parseInt(w.el.style.width, 10) || sec.Main.w)) / 2) + "px", top: Math.round((768 - sec.Main.h) / 2) + "px" });
    if (!w.visible) w.show();
    this.api.P.audio.ui("click");
  }

  // ---------- Võ công (技能主窗口: trang Chiêu thức 战斗技能分页 + lưới 战斗技能细分页 5 × 5 ô, 2 trang) ----------
  // Chiêu mốc 10–70 của phái tự hiện khi cấp nhân vật ≥ y/c của chiêu (anh chốt 23/10), từ cấp 0; nút + (AddPointBtn) cộng 1 điểm kỹ
  // năng / lần, tới cấp tối đa của chiêu (skills.txt MaxLevel). Theo ảnh client anh gửi 24/10: dưới mỗi icon là dải chữ (SkillText lệch
  // [0, 36], màu + viền của ini) — số cấp canh giữa phần bên trái, chiêu cấp 0 không hiện số; nút + sát phải dải đó (x + 22, y + 37 —
  // đo ảnh), luôn hiện: khung đỏ khi cộng được, xám (DisableFrame) khi hết điểm / đủ cấp. Rê chuột lên chiêu = ô xem chiêu như client
  // (src/game/skilltip.js).
  _skills() {
    const w = this.W.get("skills"), F = w.pages.fight, S = w.pages.fightSub, api = this.api, SUB = "fightSub";
    if (F && S) { F.el.appendChild(S.el); } // trang con lưới chiêu thức nằm trong trang Chiêu thức
    w.hideItem("AddPointBtn", true, SUB);
    const tab = (p) => { w.page(p); if (p === "fight" && S) S.el.style.display = ""; w.check("FightBtn", p === "fight").check("LiveBtn", p === "live"); };
    w.on("FightBtn", () => tab("fight")).on("LiveBtn", () => tab("live"));
    this.skPage = 0;
    for (const i of [0, 1]) w.on("SubPageBtn_" + i, () => { api.P.audio.ui("click"); this.skPage = i; for (const j of [0, 1]) w.check("SubPageBtn_" + j, i === j, "fight"); this._fillSkills(api.hero(), true); }, "fight");
    w.check("SubPageBtn_0", true, "fight");
    w.set("RemainPoint", 0, "fight").set("RemainPoint", 0, "live");
    for (const p of ["fightSub", "live"]) for (const [k, t] of Object.entries(w.pages[p]?.it || {})) if (/^Skill_\d+$/.test(k)) t.el.classList.add("jw-slot");
    // mỗi ô: icon + chữ cấp + nút + (dựng từ mục SkillText / AddPointBtn của ini, đặt theo ô)
    const sec = w.def.pages[SUB].sec, ST = sec.SkillText || {}, AB = sec.AddPointBtn, off = ST.offset || [0, 36];
    this.skSlots = [];
    if (S) for (let i = 0; S.it["Skill_" + i]; i++) {
      const t = S.it["Skill_" + i], s = t.s;
      const extra = w._items({ order: ["SkillText_" + i, "AddPointBtn_" + i], sec: {
        ["SkillText_" + i]: { ...ST, x: s.x + off[0], y: s.y + off[1], w: s.w - (AB ? AB.w : 0), h: 14, hAlign: 1 },
        ...(AB ? { ["AddPointBtn_" + i]: { ...AB, x: s.x + s.w - AB.w, y: s.y + s.h + 1 } } : {}),
      } }, S.el, null);
      Object.assign(S.it, extra);
      const icon = document.createElement("img"); icon.className = "jw-icon"; icon.alt = ""; icon.style.display = "none"; t.el.appendChild(icon);
      const slot = { i, t, icon, id: null };
      this.skSlots.push(slot);
      if (extra["AddPointBtn_" + i]) w.on("AddPointBtn_" + i, () => this._addSkill(slot.id), SUB);
      t.el.onmousemove = (e) => { if (slot.id != null) this._skillTipAt(slot.id, e); else this._hideSkTip(); };
      // kéo chiêu đã học sang thanh dùng nhanh 1–9 / ô T P (anh muốn 25/10)
      t.el.onpointerdown = (e) => { if (slot.id != null && this._skLv(slot.id) > 0 && api.dragSkill) { this._hideSkTip(); api.dragSkill(e, slot.id); } };
      t.el.onmouseleave = () => this._hideSkTip();
    }
    tab("fight");
    w.cb.show = () => { this._fillSkills(api.hero(), true); if (api.hero().fac == null) api.msg("Võ công: chưa nhập môn phái — gặp đệ tử tiếp dẫn của phái cùng hệ ở Ba Lăng huyện (cấp 10)"); };
    w.cb.hide = () => this._hideSkTip();
  }
  // chiêu đang hiện: mốc 10..70 của phái, mốc và y/c cấp ≤ cấp nhân vật (anh 01/11 — rules.js MOC), theo thứ tự mốc; rồi chiêu sách 90 / 120: chỉ chiêu đã học qua sách
  // (hero.books — máy chủ giữ; sách mua ở Kỳ Trân Các, anh 27/10 "phải đọc sách như client" — bản trước tự hiện khi đủ cấp; nhân vật đã
  // học từ trước giữ nguyên — may-chu/do.js chuan sachV)
  _skillList(h) {
    const P = this.api.P, f = h.fac == null ? null : P.factions.find((x) => x.id === h.fac);
    if (!f || !f.tiers) return [];
    const byTier = (T) => Object.keys(T || {}).map(Number).sort((a, b) => a - b).flatMap((t) => T[t]);
    const learned = new Set(h.books || []);
    return [...byTier(f.tiers).filter((id) => { const s = P.skillDb[id]; return s && (s.req || 0) <= h.lvl && (MOC.get(+id) || 0) <= h.lvl; }),
      ...byTier(f.books).filter((id) => P.skillDb[id] && learned.has(id))];
  }
  _skLv(id) { const h = this.api.hero(); return +id === 210 ? (h.fac != null ? 1 : 0) : ((h.skills || {})[id]) | 0; } // 210 Khinh công: ai đã vào phái đều có (vocong.js KC_ID)
  // anh 16/11 — Báo Đáp Ân Sư: cấp dùng = cấp đã học + Nhất Kỷ / Càn khôn còn hạn (rules.js capCong — kẹp theo dữ liệu chiêu); _skLv giữ cấp gốc (cộng điểm, kéo chiêu)
  _skLvCo(id) { const h = this.api.hero(), lv = this._skLv(id); return +id === 210 ? lv : capCong(this.api.P.skillDb[id], id, lv, ccCong(h)); }
  _fillSkills(h, force) {
    const w = this.W.get("skills"), P = this.api.P, list = this._skillList(h), pts = h.skPts | 0;
    const key = JSON.stringify([list, h.skills, pts, this.skPage, h.lvl, ccCong(h), this.ccKieu, this.ccMau, this.ccGoc]); // + cấp Báo Đáp Ân Sư (anh 16/11)
    if (!force && key === this._skKey) return;
    this._skKey = key;
    w.set("RemainPoint", pts, "fight");
    const per = this.skSlots.length, from = this.skPage * per;
    for (const sl of this.skSlots) {
      const id = list[from + sl.i] ?? null, s = id != null && P.skillDb[id], lv = id != null ? this._skLv(id) : 0;
      sl.id = id;
      const ic = id != null && P.skillIcon[id];
      if (ic) { const src = "assets/web/icon/" + ic; if (sl.icon.getAttribute("src") !== src) sl.icon.src = src; sl.icon.style.display = ""; } else sl.icon.style.display = "none";
      w.set("SkillText_" + sl.i, id != null && lv > 0 ? lv : "", "fightSub");
      // anh 16/11 — Báo Đáp Ân Sư: đang được cộng cấp (Nhất Kỷ / Càn khôn) -> "+N" ở góc trên phải ô chiêu (anh: "20+2" dưới ô xấu, để lại vị trí cũ; màu không trùng
      // màu icon ngũ hành — CC_MAU); số dưới ô vẫn là cấp đã học (cộng điểm theo số này), N = phần cộng thật sau khi kẹp theo dữ liệu chiêu
      // 2 kiểu (anh chọn — CC_KIEU): "goc" = "+N" ở góc trên ô chiêu (CC_GOC: chữ trắng viền tím sáng); "so" = số cấp dưới ô đổi thành cấp đang dùng (20 -> 22)
      // tô màu CC_MAU. Ô xem chiêu hiện "Đẳng cấp hiện thời: 20+2" ở cả 2 kiểu (skilltip.js lvGoc). this.ccKieu / ccMau: đổi lúc chạy để chụp mẫu cho anh chọn
      const them = id != null && lv > 0 ? this._skLvCo(id) - lv : 0, kieu = this.ccKieu || CC_KIEU, st = w.item("SkillText_" + sl.i, "fightSub");
      if (st && st._mau0 == null) st._mau0 = st.lab.style.color || "";
      if (kieu === "so" && them > 0) { w.set("SkillText_" + sl.i, lv + them, "fightSub"); if (st) st.lab.style.color = this.ccMau || CC_MAU; }
      else if (st) st.lab.style.color = st._mau0;
      const goc = kieu !== "so" && them > 0;
      if (goc && !sl.cong) {
        const b = sl.cong = document.createElement("b"); // cùng phông với số cấp dưới ô
        b.className = "jw-sk-cong";
        Object.assign(b.style, { position: "absolute", right: "1px", top: "0px", font: st ? st.el.style.font : "12px monospace", pointerEvents: "none", lineHeight: "13px", zIndex: 1 });
        sl.t.el.appendChild(b);
      }
      if (sl.cong) { Object.assign(sl.cong.style, this.ccGoc || CC_GOC); sl.cong.textContent = goc ? "+" + them : ""; sl.cong.style.display = goc ? "" : "none"; }
      // còn điểm và chưa tới mức của cấp nhân vật (rules.js capChieu — như engine: cấp chiêu ≤ cấp nhân vật − cấp yêu cầu + 1); chiêu luyện (sách 90 /
      // 120 có cờ luyện — anh 29/10) không cộng điểm: không có nút +
      const luyen = id != null && LUYEN.has(+id), can = id != null && !luyen && pts > 0 && !(s && lv >= capChieu(h, s, id));
      w.hideItem("AddPointBtn_" + sl.i, id == null || luyen, "fightSub").disable("AddPointBtn_" + sl.i, !can, "fightSub");
    }
  }
  _addSkill(id) {
    const api = this.api, h = api.hero(), s = id != null && api.P.skillDb[id];
    if (s && LUYEN.has(+id)) return api.msg(`${s.n.trim()}: kỹ năng luyện — lên cấp bằng độ luyện khi dùng đánh quái, không cộng điểm`);
    if (!s || (h.skPts | 0) <= 0) return;
    h.skills = h.skills || {};
    const lv = h.skills[id] | 0;
    if (lv >= capChieu(h, s, id)) return;
    // chiêu 90 / 150 cần chiêu nhỏ đủ cấp như client (rules.js chanNang — anh 31/10): câu chặn ở ô tin như client Msg2Player
    const chan = chanNang(h.skills, +id, (x) => ((api.P.skillDb[x] || {}).n || "chiêu " + x).trim());
    if (chan) { api.P.audio.ui("click"); return api.msg(chan); }
    h.skills[id] = lv + 1; h.skPts--;
    api.P.audio.ui("click"); api.save();
    if (api.skillsChanged) api.skillsChanged(lv === 0 ? id : null); // bị động / hỗ trợ chiêu khác: tính lại chỉ số; chiêu mới: gợi ý ô kỹ năng
    this._fillSkills(h, true);
    this._hideSkTip();
  }
  // ô xem chiêu như client: khung ui\ui3\弹出说明文字.ini (viền trên / dưới lặp ngang, nền 0,30,19 mờ, thụt lề, chữ cỡ 12 canh giữa),
  // thu phóng theo cửa sổ (1024 px = 1:1), đặt cạnh chuột trong màn hình
  _skillTipAt(id, e) {
    const P = this.api.P, T = P.skillTip; if (!T) return;
    const t = this.skTip = this.skTip || this._tipFrame(T);
    // cấp nhân vật ("Đẳng cấp yêu cầu") + cấp các chiêu đã học ("Hỗ trợ từ các kỹ năng khác") cũng đổi nội dung ô
    // chiêu luyện: độ luyện hiện tại = độ luyện đã có / độ luyện cần ở cấp đang có (bảng client — P.luyenKy)
    // anh 16/11 — Báo Đáp Ân Sư: ô xem chiêu theo cấp dùng (cấp đã học + Nhất Kỷ / Càn khôn — như engine hiện cấp có cộng từ vật phẩm), hỗ trợ từ chiêu khác cũng theo cấp
    // dùng; độ luyện theo cấp gốc (bảng luyện của cấp đã học)
    const h = this.api.hero(), lv0 = this._skLv(id), lv = this._skLvCo(id), bang = LUYEN.has(+id) && P.luyenKy && P.luyenKy[id], luyen = bang ? { exp: (h.luyen || {})[id] || 0, can: bang[lv0 - 1] || 0 } : null;
    const k = `${id}:${lv}:${h.lvl}:${JSON.stringify(h.skills || {})}:${ccCong(h)}:${luyen ? luyen.exp : ""}`;
    if (t.dataset.k !== k) { t.dataset.k = k; t.querySelector(".b").innerHTML = skillTipHtml(T, P.skillDb, id, lv, { heroLvl: h.lvl, heroSkills: skCong(h, P.skillDb), luyen, lvGoc: lv0 }).html; this._crisp(t, T.box); }
    this._placeFrame(t, e);
  }
  _hideSkTip() { if (this.skTip) { this.skTip.style.display = "none"; this.skTip.dataset.k = ""; } }
  // ô gợi ý chữ (nút thanh dưới / bản đồ nhỏ, biểu tượng trạng thái, dòng Trợ Thủ…) — anh 27/10: "vẫn đang dùng hiển thị của trình
  // duyệt để làm tool tip à, đồng bộ". Mọi chỗ có title / data-tip hiện bằng khung ô xem của client như ô xem chiêu (không viền thanh
  // như ô xem món); title được chuyển sang data-tip khi rê chuột tới để trình duyệt khỏi hiện ô của nó. Chữ giữ thẻ <color=…>, mỗi "\n"
  // một dòng, dòng dài xuống dòng theo chữ ở DESC_MAX 40 ký tự như mô tả chiêu. Ô dưới chuột bị vẽ lại (thanh trạng thái đổi số giây):
  // dò lại chỗ chuột mỗi 250 ms.
  _tipChu() {
    let cur = null, mx = 0, my = 0;
    const T = () => this.api.P.skillTip;
    const tat = () => { cur = null; if (this.chuTip) { this.chuTip.style.display = "none"; this.chuTip.dataset.k = ""; } };
    const tim = (el) => {
      const d = el && el.closest ? el.closest("[title],[data-tip]") : null;
      if (d && d.hasAttribute("title")) { d.dataset.tip = d.getAttribute("title"); d.removeAttribute("title"); }
      return d;
    };
    const hien = (d) => {
      const s = d && d.dataset.tip;
      if (!s || !T() || (this.skTip && this.skTip.style.display === "block") || (this.itTip && this.itTip.style.display === "block")) return tat();
      cur = d;
      const t = this.chuTip = this.chuTip || this._tipFrame(T(), false), nm = (this.api.hero() || {}).name || "";
      if (t.dataset.k !== s) {
        t.dataset.k = s;
        t.querySelector(".b").innerHTML = s.split("\n").flatMap((l) => wrapRich(l, 40)).map((l) => `<div>${richText(l, nm) || "&nbsp;"}</div>`).join("");
        this._crisp(t, T().box);
      }
      this._placeFrame(t, { clientX: mx, clientY: my });
    };
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; hien(tim(e.target)); }, true);
    addEventListener("mousedown", tat, true);
    document.addEventListener("mouseleave", tat);
    setInterval(() => { if (cur && (!cur.isConnected || !cur.dataset.tip || cur.hasAttribute("title"))) hien(tim(document.elementFromPoint(mx, my))); }, 250);
  }
  // khung ô xem của client (ui\ui3\弹出说明文字.ini [MouseOverWnd]) — dùng chung cho ô xem chiêu và ô xem món; bars = 2 thanh viền trên /
  // dưới (ô xem chiêu có; ảnh ô xem món game thật 25/10 không có)
  _tipFrame(T, bars = true) {
    const B = T.box, base = "assets/web/skill/", t = document.createElement("div");
    t.className = "jw-sktip";
    const bar = bars ? `<div style="height:${B.border.h}px;background:url(${base}${B.border.file}) repeat-x"></div>` : "";
    // content-box: _crisp đặt width = bề ngang dòng dài nhất, lề B.indent cộng thêm ngoài (game.css * border-box làm chữ tràn viền 2 × lề — anh 27/10)
    t.innerHTML = `${bar}<div class="b" style="box-sizing:content-box;padding:${bars ? 0 : (B.indent / 2) | 0}px ${B.indent}px;background:rgba(${B.bg.join(",")},${B.alpha});font:${B.font}px/${B.font}px 'JX ASF ${B.font}','VK Sans Serif 13',monospace"></div>${bar}`;
    document.body.appendChild(t);
    return t;
  }
  // Chữ nét như client (anh 25/10: chữ nhòe, "đọc đau mắt"): font chữ ảnh của client (JX ASF 12 — mỗi nét là 1 ô vuông 1 điểm) chỉ nét
  // khi chữ nằm đúng điểm ảnh nguyên. Canh giữa bằng CSS (lệch 0,5 điểm khi bề ngang chênh lẻ) và dòng cao 13 với chữ cỡ 12 (lệch 0,5
  // điểm dọc) làm trình duyệt tô mờ -> mỗi dòng cao đúng B.line, chữ cao đúng cỡ font (khỏi lệch dọc); đo bề ngang từng dòng, lề trái =
  // (rộng ô − rộng dòng) / 2 làm tròn xuống (khỏi lệch ngang). Gọi lại mỗi khi đổi nội dung ô.
  _crisp(t, B) {
    const b = t.querySelector(".b"), L = [...b.children];
    t.style.display = "block"; // đo được bề ngang (ngay sau đó _placeFrame đặt chỗ)
    b.style.width = ""; b.style.textAlign = "left";
    for (const d of L) Object.assign(d.style, { display: "inline-block", verticalAlign: "top", height: B.line + "px", lineHeight: B.font + "px", marginLeft: "0" });
    const ws = L.map((d) => d.offsetWidth), W = Math.max(0, ...ws);
    b.style.width = W + "px";
    L.forEach((d, i) => Object.assign(d.style, { display: "block", marginLeft: ((W - ws[i]) >> 1) + "px" }));
  }
  // ô dài (chiêu có tầng — vd Vi Đà Hiến Xử 46 dòng) cao hơn màn hình nhỏ -> thu thêm cho vừa chiều cao (thu nhỏ thì chữ hết nét — chỉ
  // khi bắt buộc; đủ chỗ thì không biến đổi gì để chữ giữ đúng điểm ảnh)
  _placeFrame(t, e) {
    Object.assign(t.style, { display: "block", transform: "none" });
    // điện thoại (dienthoai.js — body.dt): không thu theo khung 1024; ô xem (món, chiêu, chữ) GIỮA màn hình (anh 30/10 lần 2: "các tab popup em
    // đều làm nó bay lên tận góc trên màn hình — ở giữa màn hình mới hợp lý"; bản trước: ngay dưới thanh trên), chừa HANH_CAO cho hàng nút việc
    // làm (Dùng / Mặc / Đóng… — dienthoai.js _hanh đặt ngay dưới ô xem)
    const dt = document.body.classList.contains("dt");
    const s = Math.min(1, dt ? 1 : innerWidth / 1024, (innerHeight - 8 - (dt ? HANH_CAO : 0)) / t.offsetHeight, (innerWidth - 8) / t.offsetWidth);
    t.style.transform = s < 1 ? `scale(${s})` : "none";
    const Wd = t.offsetWidth * s, Ht = t.offsetHeight * s;
    if (dt) { t.style.left = Math.round((innerWidth - Wd) / 2) + "px"; t.style.top = Math.round(Math.max(4, (innerHeight - Ht - HANH_CAO) / 2)) + "px"; return; }
    t.style.left = Math.round(Math.max(4, Math.min(innerWidth - Wd - 4, e.clientX + 16))) + "px";
    t.style.top = Math.round(Math.max(4, Math.min(innerHeight - Ht - 4, e.clientY + 12))) + "px";
  }

  // ---------- Nhiệm vụ (新任务系统窗口.ini) ----------
  // Thẻ Nhiệm vụ (anh 03/11: "nhiệm vụ trên mobile chỉ hiển thị như này khá xấu, khung thì ok rồi, mà nội dung thì hơi chán; hiển thị text cũng dư cái
  // 1342" — bản trước 1 dòng chữ Dã Tẩu + số mảnh Sơn Hà Xã Tắc): nhiệm vụ hằng ngày đã nhận (main.js nhiemVuDs — hình, đã xong hôm nay, tiến độ, trạng
  // thái; đoạn xanh bấm được: đi tới NPC / chỗ boss — bấm thì đóng khung), vẽ lại khi đổi (taskVe — main.js nhiemVuHud gọi). Anh xem 3 bản, chọn bản 1
  // "ô nhiệm vụ như client": hàng ô trên của nền khung chọn nhiệm vụ, khung dưới chi tiết
  _task() {
    const w = this.W.get("task"), api = this.api;
    const box = (this._nvBox = document.createElement("div"));
    box.className = "nvx";
    w.el.appendChild(box);
    this._nvW = w;
    box.onclick = (e) => {
      const o = e.target.closest("[data-o]");
      if (o) { if (this.nvChon !== o.dataset.o) { this.nvChon = o.dataset.o; this.taskVe(true); } api.P.audio.ui("click"); return; }
      const k = e.target.closest("[data-k]");
      if (k) { api.P.audio.ui("click"); w.hide(); api.bamNv(k.dataset.k); }
    };
    const tab = (b) => {
      this.taskTab = b;
      for (const k of ["BtnGut", "BtnTask", "BtnEvent"]) w.check(k, k === b);
      const nv = b === "BtnTask";
      w.hideItem("TaskList", nv); box.style.display = nv ? "" : "none";
      if (nv) this.taskVe(true); else w.set("TaskList", { BtnGut: "Chưa có cốt truyện", BtnEvent: "Chưa có sự kiện" }[b]);
    };
    for (const b of ["BtnGut", "BtnTask", "BtnEvent"]) w.on(b, () => tab(b));
    for (const k of ["icon", "Font_Detail", "Font_Item", "DownScroll_Btn"]) w.hideItem(k, true);
    const lab = w.item("TaskList") && w.item("TaskList").lab;
    if (lab) Object.assign(lab.style, { whiteSpace: "pre-line", lineHeight: "18px", paddingTop: "8px" });
    w.cb.show = () => tab(this.taskTab || "BtnTask");
    tab("BtnTask");
  }
  // vẽ thẻ Nhiệm vụ (ep: vẽ dù không đổi — mở khung, đổi thẻ, chọn ô)
  taskVe(ep) {
    const w = this._nvW, box = this._nvBox;
    if (!w || !box || !w.visible || this.taskTab !== "BtnTask") return;
    const ds = this.api.nhiemVu ? this.api.nhiemVu() : [];
    const sig = JSON.stringify(ds) + "|" + this.nvChon;
    if (!ep && sig === this._nvSig) return;
    this._nvSig = sig;
    const TRANG = { lam: ["Đang làm", "#5ee05e"], tra: ["Về trả", "#ffd84a"] };
    const doan = ([t, mau, k]) => `<span${k ? ` class="bam" data-k="${esc(k)}"` : ""}${mau ? ` style="color:rgb(${mau.join(",")})"` : ""}>${esc(t)}</span>`;
    // dòng "Hôm nay a/b" và "Tiến độ: a/b" của bảng góc trái -> thanh tiến độ (bỏ khỏi chữ)
    const dong = (m) => m.dong.filter((d) => !(d.length === 1 && /^Hôm nay \d+\/\d+/.test(d[0][0])) && !(m.td && /^Tiến độ: /.test(d[0][0]))).map((d) => `<div class="nvx-d">${d.map(doan).join("")}</div>`).join("");
    // chữ phụ cạnh tên; "xong n/3" của Minh Chủ trùng thanh Hôm nay -> bỏ
    const phu = (m) => (m.phu && !(m.hom && m.phu === `xong ${m.hom[0]}/${m.hom[1]}`) ? `<small>${esc(m.phu)}</small>` : "");
    const hinh = (k) => { const x = ItemDB.item(k); return x && x.ic ? `<img src="assets/web/icon/${esc(x.ic)}" alt="" draggable="false">` : ""; };
    const chip = (m) => { const [t, c] = TRANG[m.trang] || TRANG.lam; return `<em style="color:${c};border-color:${c}">${t}</em>`; };
    const thanh = (a, b, ten) => `<div class="nvx-th"><span>${ten}</span><i><u style="width:${Math.round(Math.min(1, b ? a / b : 0) * 100)}%"></u></i><b>${a}/${b}</b></div>`;
    const thanhs = (m) => (m.td ? thanh(m.td[0], m.td[1], "Tiến độ") : "") + (m.hom ? thanh(m.hom[0], m.hom[1], "Hôm nay") : "");
    if (!ds.length) { box.innerHTML = `<div class="nvx-trong">Chưa nhận nhiệm vụ nào</div>`; return; }
    // ô nhiệm vụ như client: 2 hàng × 7 ô của nền khung (mỗi nhiệm vụ 1 ô: hình + chấm trạng thái), bấm ô xem chi tiết ở khung dưới (ô hình lớn của nền +
    // tên, trạng thái, thanh tiến độ, các dòng); mặc định nhiệm vụ cần làm nhất (về trả trước đang làm)
    const uu = { tra: 0, lam: 1 }, chon = ds.find((m) => m.k === this.nvChon) || [...ds].sort((a, b) => uu[a.trang] - uu[b.trang])[0];
    const o = ds.slice(0, 14).map((m, i) => `<div class="nvx-o${m === chon ? " on" : ""}" data-o="${esc(m.k)}" style="left:${9 + (i % 7) * 54.5}px;top:${2 + Math.floor(i / 7) * 55}px" title="${esc(m.ten)}">${hinh(m.icon)}<s class="${m.trang}"></s></div>`).join("");
    box.innerHTML = o + `<div class="nvx-hinh lon">${hinh(chon.icon)}</div><div class="nvx-dau1"><div class="nvx-ten">${esc(chon.ten)}${phu(chon)}${chip(chon)}</div>${thanhs(chon)}</div><div class="nvx-ct">${dong(chon)}</div>`;
  }

  // ---------- Hệ thống (ESC打开的界面.ini) ----------
  _system() {
    // nút Ủy thác (anh 11/11 "cho thêm chỗ bấm ủy thác trong bảng cài đặt này, để người chơi đỡ rối" — main.js moUyThac): thêm 1 nút dưới Tin cập
    // nhật (cùng nền không chữ, chữ "ỦY THÁC" như nút Tin cập nhật), Trở lại xuống 1 nút — sửa định nghĩa trước lúc dựng khung. Hình nền Main
    // (213 × 180: 4 dải đen sau 4 nút đầu) giữ nguyên cỡ: bản đầu kéo dài hình thêm 1 nút -> các dải đen lệch ra khe giữa các nút (anh 12/11 "chỗ
    // này bị màn đen"); khung Main vốn cao 250, đủ chỗ 6 nút
    // Ủng hộ tác giả (anh 12/11 "để trong cái phần thoát game ấy, đúng là tin cập nhật nhưng làm thêm 1 thanh khác ghi Ủng Hộ Tác Giả"): nút ngay dưới
    // Tin cập nhật (cùng nền), Ủy thác + Trở lại xuống 1 nút; khung Main cao thêm cho đủ 7 nút (nền 213 × 180 giữ nguyên cỡ — như lúc thêm Ủy thác),
    // dời lên nửa phần cao thêm để bảng vẫn giữa màn hình. Bấm: khung riêng Ủng hộ tác giả (src/game/ungho.js — main.js moUngHo)
    const D = this.W.M.system;
    if (D && !this.W.wins.system && !D.sec.UyThac) {
      const S = D.sec, buoc = S.ContiumeGame.y - S.OffLine.y;
      S.UyThac = { ...S.OffLine, y: S.OffLine.y + buoc };
      S.ContiumeGame = { ...S.ContiumeGame, y: S.OffLine.y + 2 * buoc };
      const cao = S.ContiumeGame.y + S.ContiumeGame.h + 2;
      if (S.Main.h < cao) S.Main = { ...S.Main, y: S.Main.y - Math.round((cao - S.Main.h) / 2), h: cao };
      D.order = D.order.flatMap((k) => (k === "ContiumeGame" ? ["UyThac", k] : [k]));
    }
    const w = this.W.get("system"), api = this.api;
    const u = w.node("UyThac");
    if (u) { const t = document.createElement("span"); t.className = "jw-escchu"; t.textContent = "ỦY THÁC"; u.appendChild(t); }
    w.on("UyThac", () => { w.hide(); if (api.uyThac) api.uyThac(); });
    w.on("ExitGame", () => { this.closeAll(); api.leaveGame(); });
    w.on("GameHelp", () => { w.hide(); api.help(); });
    w.on("Options", () => { w.hide(); this.W.get("options").show(); });
    // nút "Chức năng ủy thác" của client -> Tin cập nhật (anh 29/10: "thay đổi thành cái tab riêng thông báo cập nhật nội dung game gần đây";
    // Trợ Thủ vẫn mở bằng phím K / nút cột icon phải): nền nút không chữ (cong-cu/dung-khung-cua-hang.mjs) + chữ "TIN CẬP NHẬT" như 4 nút
    // kia; có tin chưa xem thì thêm chữ "Mới" đỏ (datTinMoi)
    const o = w.node("OffLine");
    if (o) { const t = document.createElement("span"); t.className = "jw-escchu"; t.innerHTML = "TIN CẬP NHẬT<b>Mới</b>"; o.appendChild(t); }
    w.on("OffLine", () => { w.hide(); this.openTin(); });
    w.on("ContiumeGame", () => w.hide());
  }
  // có tin cập nhật chưa xem: chữ "Mới" ở nút Tin cập nhật của bảng Esc + chấm đỏ ở nút Tùy chỉnh thanh dưới (nút mở bảng Esc)
  datTinMoi(on) {
    const o = this.W.get("system").node("OffLine"); if (o) o.classList.toggle("co-moi", !!on);
    const b = document.querySelector('#jxhud .jx-btn[data-k="Options"]'); if (b) b.classList.toggle("co-moi", !!on);
  }

  // ---------- Giúp đỡ (anh 29/10: "CÁI GIÚP đỡ bấm vào cũng đang khá rối, cần thiết kế lại cho thân thiện với người chơi" — bản trước in 4 dòng
  // phím tắt vào khung chat): khung HỖ TRỢ của client 详细帮助界面.ini — mục bên trái (IndexList), nội dung bên phải (MessageList), thanh cuộn 2
  // bên. 3 dòng liên kết trên mục: "Hướng dẫn người chơi mới!" mở mục Người chơi mới (hình giao diện của client chỉ vào HUD 800 × 600 nên không
  // dùng), "phím nóng!" / "ngũ hành!" mở khung hình 简单帮助界面.ini (bảng phím / bảng ngũ hành 800 × 600 của client — bấm vào hình hay Esc để
  // đóng). Nội dung: src/game/giupdo.js. Mục đang chọn tô như bảng xếp hạng (SelColor, nền SelItemBgColor, viền chữ SelBorderColor của ini).
  _dsMuc(w, ds, nd) {
    const sec = w.def.sec, I = sec[ds], c = (a) => `rgb(${a.join(",")})`, idx = w.node(ds), msg = w.node(nd);
    for (const el of [idx, msg]) el.classList.add("jw-list", "jw-gd");
    idx.style.color = c(I.color); msg.style.color = c(sec[nd].msgColor || I.color);
    for (const [k, v] of [["--chon", I.selColor], ["--chon-nen", I.selItemBgColor], ["--chon-vien", I.selBorderColor]]) idx.style.setProperty(k, c(v));
    return { idx, msg };
  }
  _giupDo() {
    const w = this.W.get("giupdo"), h = this.W.get("giupdohinh"); if (!w) return;
    const api = this.api, { idx, msg } = this._dsMuc(w, "IndexList", "MessageList");
    const cuon = [ganCuon(this.W, w, "IndexList", "IndexScroll"), ganCuon(this.W, w, "MessageList", "MessageScroll")].filter(Boolean);
    this._gd = 0;
    const ve = () => {
      const k = Math.min(this._gd, MUC_GIUP.length - 1), m = MUC_GIUP[k];
      idx.innerHTML = MUC_GIUP.map((x, i) => `<div data-i="${i}" class="gd-muc${i === k ? " on" : ""}">${esc(x.ten)}</div>`).join("");
      msg.innerHTML = `<div class="gd-ten">${esc(m.ten)}</div>${giupHtml(m.dong(api))}`;
      for (const x of cuon) x.sync();
    };
    const chon = (i) => { this._gd = i; msg.scrollTop = 0; ve(); };
    this._gdChon = chon; // openGiupDo(mục): mở thẳng 1 mục (chỉ đường tân thủ — tanthu.js)
    idx.onclick = (e) => { const d = e.target.closest("[data-i]"); if (!d) return; api.P.audio.ui("click"); chon(+d.dataset.i); };
    w.on("BtnClose", () => w.hide()).on("BtnPic", () => chon(0));
    // khung hình: Main 800 × 600 của ini (112, 84 = giữa màn hình 1024 × 768), nền = hình đang xem. Hình client nền trong suốt (vẽ đè lên game)
    // -> lót nền tối để khung HỖ TRỢ / cảnh game phía sau không lẫn vào chữ, dòng nhắc đóng ở đáy
    const hinh = (k) => { const im = h && h.def.sec.Main[k]; if (!im) return; api.P.audio.ui("click"); Object.assign(h.el.style, { backgroundImage: `url(${this.W.base}${im.file})`, backgroundSize: `${im.w}px ${im.h}px` }); h.show(); };
    w.on("BtnKeyboard", () => hinh("keyboardImage")).on("BtnWuxing", () => hinh("wuxingImage"));
    if (h) {
      h.el.classList.add("jw-hinh");
      const n = document.createElement("div"); n.className = "jw-hinh-nhac"; n.textContent = "Bấm vào hình hoặc Esc để đóng"; h.el.appendChild(n);
      h.el.addEventListener("click", () => h.hide());
    }
    w.cb.show = ve;
  }
  // F1 / Esc → Giúp đỡ (F1 lần nữa = đóng): giữa màn hình như các hộp thoại khác (ini đặt 290, 200)
  openGiupDo(muc) {
    const w = this.W.get("giupdo"); if (!w) return;
    if (w.visible && muc == null) return void w.hide();
    Object.assign(w.el.style, { left: Math.round((1024 - w.def.sec.Main.w) / 2) + "px", top: Math.round((768 - w.def.sec.Main.h) / 2) + "px" });
    w.show(); this.api.P.audio.ui("click");
    if (muc != null && this._gdChon) this._gdChon(muc);
  }

  // ---------- Tin cập nhật (anh 29/10 — nút "Chức năng ủy thác" của bảng Esc -> "tab riêng thông báo cập nhật nội dung game gần đây, để người
  // chơi tiện theo dõi"): khung Nhật ký của client 任务记事.ini, thẻ "Cập nhật sự kiện" + trang 任务记事-游戏更新记录.ini (tin bên trái TitleList,
  // nội dung bên phải MessageList — cong-cu/dung-khung-cua-hang.mjs ghép, xóa chữ vẽ sẵn của nền). Tin: assets/data/tin-cap-nhat.json (api.tin()),
  // mới nhất trên cùng; tin chưa xem (id > api.tinXem()) có chữ "Mới" đỏ; mở khung = đã xem hết (api.daXemTin() — chữ Mới còn tới lần mở sau)
  _tin() {
    if (kyChuan() >>> 16 !== 0xdb5) voKy("cửa sổ"); // ấn ký bản gốc (an-ky.js)
    const w = this.W.get("tin"); if (!w) return;
    const api = this.api, { idx, msg } = this._dsMuc(w, "TitleList", "MessageList");
    const cuon = [ganCuon(this.W, w, "TitleList", "Title_Scroll"), ganCuon(this.W, w, "MessageList", "Content_Scroll")].filter(Boolean);
    // tiêu đề: nền đã xóa chữ "Nhật ký" -> viết như tiêu đề Kỳ Trân Các (chữ sáng đậm viền đen), cỡ 13 cho vừa giữa 2 đồng tiền trang trí
    const td = document.createElement("div");
    td.className = "jw-tieude13"; td.textContent = "Tin cập nhật";
    w.el.appendChild(td);
    w.check("BulletinBtn", true).on("BulletinBtn", () => w.check("BulletinBtn", true));
    w.on("CloseBtn", () => w.hide());
    this._tinChon = 0; this._tinXem = 0;
    const ve = () => {
      const L = api.tin(), k = Math.min(this._tinChon, Math.max(0, L.length - 1)), t = L[k];
      idx.innerHTML = L.length ? L.map((x, i) => `<div data-i="${i}" class="gd-muc tin-muc${i === k ? " on" : ""}"><span class="tin-ngay">${esc(x.ngay)}</span><span class="tin-ten">${esc(x.ten)}</span>${x.id > this._tinXem ? '<b class="tin-moi">Mới</b>' : ""}</div>`).join("")
        : `<div class="gd-p">Chưa có tin</div>`;
      msg.innerHTML = t ? `<div class="gd-ten">${esc(t.ten)}</div><div class="tin-ngay2">Ngày ${esc(t.ngay)}</div>${giupHtml(t.noi || [])}` : "";
      for (const x of cuon) x.sync();
    };
    idx.onclick = (e) => { const d = e.target.closest("[data-i]"); if (!d) return; api.P.audio.ui("click"); this._tinChon = +d.dataset.i; msg.scrollTop = 0; ve(); };
    w.cb.show = () => { this._tinXem = api.tinXem(); this._tinChon = 0; msg.scrollTop = 0; ve(); api.daXemTin(); };
  }
  openTin() {
    const w = this.W.get("tin"); if (!w) return;
    Object.assign(w.el.style, { left: Math.round((1024 - w.def.sec.Main.w) / 2) + "px", top: Math.round((768 - w.def.sec.Main.h) / 2) + "px" });
    w.show(); this.api.P.audio.ui("click");
  }

  // ---------- Tùy chọn (选项.ini): 3 thanh trượt + phím tắt + các ô bật / tắt ----------
  _options() {
    const w = this.W.get("options"), api = this.api, P = api.P, sec = w.def.sec;
    const set = P.settings;
    // thanh trượt: rãnh Width, nút kéo chạy từ SlideBegin tới SlideEnd − rộng nút; bấm − / + ở 2 đầu (ngoài khoảng trượt) = ±PageSize
    const slider = (k, get, put) => {
      const s = sec[k], bar = w.node(k), knob = w.node(k + "_Btn"); if (!bar || !knob) return;
      bar.appendChild(knob);
      const kw = sec[k + "_Btn"].w, x0 = s.slideBegin, x1 = s.slideEnd - kw, span = s.max - s.min;
      const draw = () => { knob.style.left = x0 + ((get() - s.min) / span) * (x1 - x0) + "px"; };
      const fromX = (x) => put(Math.round(s.min + Math.max(0, Math.min(1, (x - x0 - kw / 2) / (x1 - x0))) * span));
      bar.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        const r = bar.getBoundingClientRect(), k2 = r.width / s.w, x = (e.clientX - r.left) / k2;
        if (x < s.slideBegin) put(Math.max(s.min, get() - s.pageSize));
        else if (x > s.slideEnd) put(Math.min(s.max, get() + s.pageSize));
        else {
          fromX(x);
          const mv = (ev) => { fromX((ev.clientX - r.left) / k2); draw(); };
          const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); };
          addEventListener("mousemove", mv); addEventListener("mouseup", up);
        }
        draw();
      };
      draw();
    };
    slider("Brightness", () => set.bright ?? 50, (v) => { set.bright = v; api.saveSettings(); api.applyBright(); });
    slider("Music", () => set.music ?? 45, (v) => { set.music = v; api.saveSettings(); P.audio.setVolume("music", v / 100); });
    slider("Sound", () => set.sound ?? 70, (v) => { set.sound = v; api.saveSettings(); P.audio.setVolume("sfx", v / 100); });
    w.set("ShortcutSet", "Mặc định").on("ShortcutSet", () => api.help()); // bộ phím của client (ui\autoexec.lua)
    // ô bật / tắt: client có 4 ô (rung hình, thời tiết, trong suốt, lựa chọn — game này không có) -> dùng chỗ của client cho tùy chọn của game
    const opts = [
      ["Bóng quái", () => set.mobShadow, () => { set.mobShadow = !set.mobShadow; api.saveSettings(); }],
      // anh 08/11 "riêng tài khoản admin em bỏ cái tự đánh này thành công cụ xử lý sever, vì trên mobile anh k mở dc f10": ô này mở / đóng bảng quản trị (F10)
      api.quanTri && api.quanTri() ? ["Công cụ server", () => api.qtBang().on, () => { Promise.resolve(api.qtBang().toggle()).then(() => { if (api.qtBang().on) w.hide(); }); }] : ["Tự đánh", () => api.world() && api.world().auto, () => api.toggleAuto()], // mở bảng chờ khóa an toàn (quantri.js toggle async — anh 10/11)
      ["Tắt tiếng", () => P.audio.muted, () => api.toggleSound()],
      ...(api.dev ? [["Công cụ thử", () => !!api.dev && api.dev.on, () => api.dev && api.dev.toggle()]] : []), // localhost / tài khoản quản trị
    ];
    const tb = sec.ToggleBtn, ts = sec.ToggleStatus, [dx, dy] = tb.interval, per = tb.countPerLine || 2;
    const btn = w.node("ToggleBtn"), box = w.node("ToggleStatus");
    btn.remove(); box.remove();
    const rows = [];
    opts.forEach(([name, get, flip], i) => {
      const ox = (i % per) * dx, oy = Math.floor(i / per) * dy;
      const b = btn.cloneNode(true), c = box.cloneNode(true);
      b.style.left = tb.x + ox + "px"; b.style.top = tb.y + oy + "px"; b.querySelector(".jw-t").textContent = name;
      b.querySelector(".jw-t").style.color = `rgb(${tb.color})`; b.classList.add("jw-link");
      c.style.left = ts.x + ox + "px"; c.style.top = ts.y + oy + "px";
      const draw = () => w._img(c, ts.img, get() ? ts.checkFrame : ts.notCheckFrame);
      b.onclick = c.onclick = (e) => { e.stopPropagation(); flip(); draw(); P.audio.ui("click"); };
      b.onmouseenter = () => (b.querySelector(".jw-t").style.color = `rgb(${tb.overColor})`);
      b.onmouseleave = () => (b.querySelector(".jw-t").style.color = `rgb(${tb.color})`);
      w.el.append(b, c);
      rows.push(draw);
      draw();
    });
    w.cb.show = () => rows.forEach((d) => d());
  }

  // ---------- ô xem món: khung + chữ như client (src/game/itemtip.js). it = món { u, k, s, d } (itemdb.js); slot = ô đang mặc, bỏ trống
  // = món trong túi: chưa mặc thì dòng ẩn chưa kích, hiện xám hết (ảnh game thật anh gửi 25/10 — Huyền Thiết Kiếm trong túi: đo màu
  // dòng 2 "Kháng lôi" và dòng 4 "Độc sát" đều xám DBlue 120,120,120; dòng 1, 3, 5 xanh Blue) ----------
  // nv: món của nhân vật khác (Soi đồ — soiDo): yêu cầu / dòng ẩn tính theo nhân vật đó thay vì nhân vật đang chơi
  // món không bán cho cửa hàng được (như may-chu/do.js act ban): món Kỳ Trân Các, ngựa có hạn, món khóa của bảng Kỳ Trân Các (thuốc Hồi Thiên rút từ
  // lễ bao mua bằng Xu — anh 12/11) -> câu báo; bán được -> null
  _khongBan(b) { const x = ItemDB.item(b.k) || {}; return x.ktc || b.het || (b.kbh && x.tuKtc) ? "Vật phẩm của Kỳ Trân Các không bán cho cửa hàng được" : null; }
  _showTip(it, e, hint, slot, price, nv) {
    const P = this.api.P, T = P.skillTip; if (!T || !ItemDB.item(it.k)) return;
    this.tipHint = hint; // dòng gợi ý gốc: điện thoại dọc đọc ra nút việc làm (dienthoai.js hanhDong)
    this.tipIt = it; // món đang xem: điện thoại bỏ nút Vứt với món khóa bảo hiểm / thuốc Tống Kim (dienthoai.js)
    if (document.body.classList.contains("dt") || this.camUng) hint = boHanh(hint) || undefined; // camUng: máy tính bảng đè giữ (chamgiu.js — có hàng nút việc làm)
    const t = this.itTip = this.itTip || this._tipFrame(T, false), h = nv || this.api.hero();
    const kich = slot ? soKich(h, slot, it) : 0;
    // khóa có hạn: số giờ chờ mở khóa vào khóa đệm -> mỗi giờ vẽ lại (anh 11/11 — itemtip.js gioMoKhoa)
    const key = `${it.u || 0}|${it.k}|${it.n || 0}|${it.kbh || 0}:${gioMoKhoa(it)}|${JSON.stringify(it.d || [])}|${h.lvl}|${JSON.stringify(h.attr || {})}|${kich}|${hint || ""}|${price ?? ""}|${slot || ""}|${nv ? nv.ten + "/" + nv.o : ""}`;
    if (t.dataset.k !== key) { t.dataset.k = key; t.querySelector(".b").innerHTML = itemTipHtml(T, it, h, { factions: P.factions, hint, kich, price, slot }); this._crisp(t, T.box); }
    this._placeFrame(t, e);
    // so sánh (anh 29/10: "trỏ vào 1 vũ khí thì hiện thêm thông tin vũ khí đang mang"; engine CoreShell inParam 1: món chưa mặc -> mô tả món
    // đang mặc cùng loại, tên thêm "(đã trang bị)"; nhẫn: nhẫn trên, không có thì nhẫn dưới) — ô thứ 2 bên trái con trỏ. Dòng ẩn của món
    // đang mặc theo kích thật (engine để 0 — xám hết — thì khó so)
    const ss = ((this.api.hero() || {}).auto || {}).soSanh !== 0; // Trợ Thủ → Khác → So sánh trang bị (lượt 88)
    const o = slot || !ss ? null : this._oSoSanh(h, it), eq = o && h.equip[o];
    if (!eq || eq === it) { if (this.itTip2) { this.itTip2.style.display = "none"; this.itTip2.dataset.k = ""; } return; }
    const t2 = this.itTip2 = this.itTip2 || this._tipFrame(T, false), k2 = soKich(h, o, eq);
    const key2 = `${eq.u || 0}|${eq.k}|${eq.kbh || 0}:${gioMoKhoa(eq)}|${JSON.stringify(eq.d || [])}|${eq.ben ?? ""}|${h.lvl}|${JSON.stringify(h.attr || {})}|${k2}|${o}`;
    if (t2.dataset.k !== key2) { t2.dataset.k = key2; t2.querySelector(".b").innerHTML = itemTipHtml(T, eq, h, { factions: P.factions, kich: k2, slot: o, dangMac: true }); this._crisp(t2, T.box); }
    this._placeCanh(t, t2, e);
  }
  // ô của món đang mặc để so với món it (chưa mặc): cùng loại ô (SLOT_OF), nhẫn: trên rồi tới dưới; không mặc gì ở đó -> null
  _oSoSanh(h, it) {
    const x = ItemDB.item(it.k), s = x && SLOT_OF[x.t], E = h.equip || {};
    if (!s) return null;
    if (s === "Ring1") return E.Ring1 ? "Ring1" : E.Ring2 ? "Ring2" : null;
    return E[s] ? s : null;
  }
  // ô so sánh BÊN TRÁI (anh 29/10: "đổi vị trí đồ đã trang bị qua bên trái"), cùng mép trên với ô xem món, mép phải cách con trỏ 16 điểm
  // như ô xem món bên phải con trỏ -> món đang trỏ lộ giữa 2 ô; ô xem món bị đẩy sang trái (sát mép phải màn hình) thì sát trái ô đó. Mép trái
  // màn hình không đủ chỗ: sang phải ô xem món (chật nữa thì sát mép phải màn hình)
  _placeCanh(t, t2, e) {
    Object.assign(t2.style, { display: "block", transform: "none" });
    // điện thoại dọc: màn hẹp không đủ 2 ô cạnh nhau -> ô món đang mặc nằm dưới (hoặc trên) ô xem món, co cho vừa chỗ còn lại
    if (document.body.classList.contains("dt")) {
      const r = t.getBoundingClientRect(), duoi = innerHeight - r.bottom - 8, tren = r.top - 8, cho = Math.max(duoi, tren);
      const k = Math.min(1, (innerWidth - 8) / t2.offsetWidth, cho / t2.offsetHeight), W2 = t2.offsetWidth * k, H2 = t2.offsetHeight * k;
      t2.style.transform = k < 1 ? `scale(${k})` : "none";
      t2.style.left = Math.round((innerWidth - W2) / 2) + "px";
      t2.style.top = Math.round(duoi >= tren ? r.bottom + 4 : r.top - H2 - 4) + "px";
      return;
    }
    const s = Math.min(1, innerWidth / 1024, (innerHeight - 8) / t2.offsetHeight), W2 = t2.offsetWidth * s, H2 = t2.offsetHeight * s;
    t2.style.transform = s < 1 ? `scale(${s})` : "none";
    const r = t.getBoundingClientRect();
    let x = Math.min(r.left - 4, e.clientX - 16) - W2;
    if (x < 4) x = Math.min(innerWidth - 4 - W2, r.right + 4);
    t2.style.left = Math.round(x) + "px";
    t2.style.top = Math.round(Math.max(4, Math.min(innerHeight - H2 - 4, r.top))) + "px";
  }
  _hideTip() { for (const t of [this.itTip, this.itTip2]) if (t) { t.style.display = "none"; t.dataset.k = ""; } }
}
