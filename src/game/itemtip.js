// Ô xem món như client (rê chuột lên món trong túi / ô trang bị) — theo ẢNH GAME THẬT anh gửi 25/10 (Huyền Thiết Kiếm [cấp 10] đồ xanh 5
// dòng, Khinh Cát sam [cấp 2] chưa đủ yêu cầu, Đồng Sát Phỉ Thúy Ngọc Hạng Khuyên Hoàng Kim). Khung = ô mô tả của client (cùng nền / chữ
// với ô xem chiêu: ui\ui3\弹出说明文字.ini [MouseOverWnd], tip.json), KHÔNG có 2 thanh viền (ảnh món không có). Chữ canh giữa, viền đen.
// Thứ tự dòng (engine):
//   tên + " [cấp N]" (G_ITEM_22; đồ xanh: Blue, đồ trắng: White) · "Thuộc tính Ngũ hành: <hệ>" (G_ITEM_3..7, tên hệ màu hệ của engine)
//   · câu mô tả của bảng đồ (chia dòng như ô xem chiêu — splitDesc) · trống · thuộc tính cơ bản theo thứ tự bảng đồ, giữ cả số 0 ("Tỉ lệ
//   công kích chính xác: -0%", độ bền "Độ bền: %3d / %3d" G_ITEM_9_1) · yêu cầu theo thứ tự bảng đồ, giữ cả số 0 ("Yêu cầu thân pháp: 0
//   điểm"; chưa đủ: Red) · dòng xanh (có tác dụng: Blue; dòng ẩn chưa được kích: xám DBlue).
// Câu chữ = settings\magicdesc.ini của client (tip.json magic): #d1+ có dấu (số 0 engine in "-0"), #d1- số, #d1~ số âm, #s1- tên hệ,
// #x1- giới, #m1- môn phái. Game thêm 1 dòng gợi ý thao tác ở cuối (Gold).
// Thuốc (25/10): tên · câu mô tả · tác dụng (lifepotion_v / manapotion_v "Phục hồi sinh lực mỗi nửa giây: +10 điểm") · giá ở cửa hàng
// ("Giá cả: %d %s" G_ITEM_2) · gợi ý.
//   const html = itemTipHtml(T, it, hero, { factions, hint, kich, price, slot, dangMac })   // T = tip.json, it = món, kich = số dòng ẩn
//   đang được kích, price = giá (cửa hàng), slot = ô đang mặc (không có = món trong túi), dangMac = ô so sánh món đang mặc
// Dòng gợi ý kích (anh 29/10 gửi ảnh client "Cần hệ Thủy của Dây chuyền và Y phục để kích thuộc tính ẩn"): engine KItem::GetDesc in ở cuối
// mô tả đồ xanh — cả dòng màu hệ của món, "hệ X" Cyan, tên 2 ô màu hệ X (X = hệ sinh ra hệ của món; 2 ô = KICH, khớp bảng ms_ActivedEquip
// của engine). Chuỗi G_ITEM_21 của lang\vn ghi "thuộc tính âm" — theo ảnh anh: "ẩn". Chỉ món có dòng ẩn; nhẫn trong túi chưa biết ô -> 2 dòng
// (trên / dưới). Ô so sánh (dangMac — engine nType 1): tên thêm "(đã trang bị)" màu Green (anh 30/10: màu khác tên món cho dễ nhận ra),
// không có dòng gợi ý.

import { ItemDB, coTacDung, benMax, KICH, SINH, SLOT_OF, diemCo, laVatTk } from "./itemdb.js";
import { splitDesc } from "./skilltip.js";
import { LE_PHUC } from "../char/jx-char.js";

// chuỗi engine (client lang\vn\stringtable_core.txt)
const SERIES = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const SERIES_COL = ["Metal", "Wood", "Water", "Fire", "Earth"];       // G_ITEM_3..7 "<color=White>Thuộc tính Ngũ hành: <color=Metal>Kim"
const LEVEL = " [cấp %d]";                                              // G_ITEM_22
const DURABILITY = "Độ bền: %3d / %3d";                                 // G_ITEM_9_1
const DURABILITY_LOW = "Độ bền %3d / %3d";                              // G_ITEM_9_2 (<color=red>) — còn ≤ 3 như engine KItem
const BROKEN = "Đã tổn hại, không thể tiếp tục sử dụng";               // G_STR_ITEM_ABRADETOZERO (độ bền 0)
const PRICE = "Giá cả: %d %s";                                          // G_ITEM_2
const TEN_O = { Cap: "Nón", Cloth: "Y phục", Sash: "Thắt lưng", Weapon: "Vũ khí", Shoes: "Hài", Bangle: "Hộ uyển", Necklace: "Dây chuyền", // G_ITEM_10..19
  Ring1: "Nhẫn trên", Ring2: "Nhẫn dưới", Pendant: "Ngọc bội" };
const DA_MAC = " (đã trang bị)";                                       // engine "(已装备)" sau tên món ở ô so sánh
// khóa bảo hiểm (anh 05/11 — it.kbh, may-chu/do.js): engine KItem::GetDesc in dòng khóa màu Green ngay dưới tên món, chữ client
// G_ITEM_BIND_STATE (khóa thường — chưa dùng) / G_ITEM_BIND_STATE2 (vĩnh viễn — thưởng thăng cấp / online)
const BIND = ["", "Vật phẩm này đã được khóa bảo hiểm", "Vật phẩm này đã được khóa bảo hiểm vĩnh viễn"];
// khóa có hạn (anh 11/11 — it.kbh 1 + it.kbhHet: trang bị mở từ Bảo rương đồ xanh khóa, may-chu/do.js KBH_TAM): dòng thứ 2 chữ client G_ITEM_UNBIND_STATE
// (engine giữ giờ mở khóa theo giờ — YYYYMMDDHH) -> số giờ còn, làm tròn lên (còn dưới 1 giờ vẫn ghi 1); hết giờ máy chủ bỏ khóa ở nhịp
const UNBIND = "Thời gian chờ mở khóa: %d giờ";
export const gioMoKhoa = (it) => (it && (it.kbh | 0) === 1 && +it.kbhHet > 0 ? Math.max(1, Math.ceil((+it.kbhHet - Date.now()) / 3600e3)) : 0);
const TK_CHI = "Chỉ dùng trong chiến trường Tống Kim"; // hoàn / Chiến cổ / Lệnh Bài / Càn Khôn Tạo Hóa Đan (itemdb.js laVatTk — client checkmapid.lua)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad3 = (n) => String(n).padStart(3, " ");
// nguồn gốc món (anh 18/11 tối — may-chu/nguon-mon.js: it.g mã riêng, it.ng [loại, chi tiết, giờ, người có đầu tiên], it.di đường đi): chỉ tài khoản quản trị
// thấy (main.js datXemNguon khi đăng nhập) — vài dòng cuối ô xem món, trước dòng gợi ý
let XEM_NGUON = false;
export const datXemNguon = (b) => { XEM_NGUON = !!b; };
const TEN_NGUON = { roi: "Rơi từ", ruong: "Mở", qua: "Quà / thưởng", mua: "Mua ở", he: "Hệ thống", ngua: "Dùng", dung: "Dùng", qt: "Quản trị tạo", cu: "Có từ trước khi gắn nguồn (18/11)", "?": "KHÔNG RÕ NGUỒN" };
export function cauNguon(ng) {
  if (!Array.isArray(ng)) return "Chưa gắn nguồn";
  const [l, c] = ng, t = TEN_NGUON[l] || l;
  return l === "cu" ? t : `${t}${c ? (l === "?" ? " — " : ": ") + c : ""}`;
}
export const gioNguon = (t) => { const d = new Date(+t + 7 * 3600e3), p = (n) => String(n).padStart(2, "0"); return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`; }; // giờ Việt Nam

export function itemTipHtml(T, it, hero, opt = {}) {
  const x = ItemDB.item(it.k); if (!x) return "";
  const g = ItemDB.base(it.k), d = it.d || [], out = [];
  const col = (n) => `rgb(${(T.colors[n] || T.colors.White).join(",")})`;
  const line = (html) => out.push(`<div>${html || "&nbsp;"}</div>`);
  const span = (t, c) => `<span style="color:${col(c)}">${esc(t)}</span>`;
  const fac = (v) => ((opt.factions || []).find((f) => f.id === v) || {}).n || String(v);
  const fill = (k, v) => String(T.magic[k] || `${k}: #d1-`)
    .replace(/#([dsxm])1([+\-~]?)/g, (m, t, sg) => {
      if (t === "s") return SERIES[v] ?? String(v);
      if (t === "x") return v ? "Nữ" : "Nam";
      if (t === "m") return fac(v);
      if (sg === "+") return v > 0 ? "+" + v : "-" + Math.abs(v);
      if (sg === "~") return v > 0 ? "-" + v : String(-v);
      return String(v);
    })
    .replace(/#[a-zA-Z]\d[+\-~]?/g, "").replace(/<\/?color(?:=[^>]*)?>/gi, "");

  const hint = () => { if (opt.hint) { line(""); for (const h of [].concat(opt.hint)) line(span(h, "Gold")); } };
  const khoa = () => { // dòng khóa bảo hiểm ngay dưới tên (engine GetDesc); khóa có hạn thêm dòng giờ chờ mở khóa
    if (it.kbh) line(span(BIND[it.kbh] || BIND[2], "Green"));
    const g = gioMoKhoa(it); if (g) line(span(UNBIND.replace("%d", g), "Green"));
  };
  if (x.thuoc || x.phu) { // thuốc, Thổ Địa Phù: tên · mô tả · tác dụng · giá
    line(span(x.n, "White"));
    khoa();
    if (x.intro) for (const l of splitDesc(x.intro)) line(span(l, "White"));
    if (x.hp) line(span(fill("lifepotion_v", x.hp[0]), "White"));
    if (x.mp) line(span(fill("manapotion_v", x.mp[0]), "White"));
    if (opt.price != null) line(span(PRICE.replace("%d", opt.price).replace("%s", "lượng"), "White"));
    hint();
    return out.join("");
  }
  if (x.ktc) { // món Kỳ Trân Các (27/10 — cong-cu/dung-ky-tran-cac.js): tên · câu mô tả client (<enter> xuống dòng) · giá Xu
    line(span(x.n.trim(), "White"));
    khoa();
    if (x.intro) for (const p of String(x.intro).replace(/<\/?color(?:=[^>]*)?>/gi, "").split(/<enter>|\n/i)) for (const l of splitDesc(p.trim())) line(span(l, "White"));
    if (laVatTk(it.k)) line(span(TK_CHI, "Orange")); // hàng Quân Nhu quan Tống Kim (đặc tả đợt 2): chỉ dùng trong chiến trường
    // món có hạn (Huân công bài Tống Kim — hết hạn 24:00 ngày hôm sau, máy chủ bỏ khi hết hạn)
    if (it.het) { const s = Math.max(0, (it.het - Date.now()) / 1000), gi = Math.floor(s / 3600), ph = Math.floor((s % 3600) / 60); line(span(`Hạn sử dụng: còn ${gi ? gi + " giờ " : ""}${ph} phút`, "Red")); }
    if (opt.price != null) line(span(PRICE.replace("%d", opt.price).replace("%s", "Xu"), "White"));
    hint();
    return out.join("");
  }
  const mauTen = d.length ? "Blue" : x.gr === "xanh" ? "White" : "Yellow";
  line(span(x.n, mauTen) + (opt.dangMac ? span(DA_MAC, "Green") : "") + span(LEVEL.replace("%d", g.cl || 1), mauTen));
  khoa();
  // ngựa từ mã bài Kỳ Trân Các: hạn 30 ngày từ lúc dùng (máy chủ bỏ món khi hết hạn — may-chu/do.js chuan)
  if (it.het) { const s = Math.max(0, (it.het - Date.now()) / 1000), ng = Math.floor(s / 86400), gi = Math.floor((s % 86400) / 3600); line(span(`Hạn sử dụng: còn ${ng ? ng + " ngày " : ""}${gi} giờ`, "Red")); }
  // món Dã Tẩu mua ở sạp Hệ thống của Chợ Trời (may-chu/da-tau.js choHt): Trợ Thủ không tự bán / cất; nộp loại nào Dã Tẩu cũng giữ (cả Xem vật phẩm —
  // anh 04/11)
  if (it.dt) line(span("Món Dã Tẩu (sạp Hệ thống) — nộp là Dã Tẩu giữ, Trợ Thủ không tự bán", "Gold"));
  // Phi Phong đã kích hoạt trên y phục này (anh 13/11 lượt 86 — may-chu/do.js it.pp): mặc áo này thì có áo choàng; đi theo áo khi giao dịch / bày bán
  // lễ phục không khoác Phi Phong (anh 15/11 — src/char/jx-char.js LE_PHUC): áo đã lỡ kích hoạt thì không ghi dòng này (không có áo choàng)
  if (it.pp > 0 && !(x.g === "armor" && LE_PHUC.has(x.id))) line(span("Đã kích hoạt Phi Phong", "Gold"));
  if (it.s != null && SERIES[it.s]) line(span("Thuộc tính Ngũ hành: ", "White") + span(SERIES[it.s], SERIES_COL[it.s]));
  if (g.intro) for (const l of splitDesc(g.intro)) line(span(l, "White"));
  line("");
  // độ bền: còn / tối đa (it.ben — máy chủ giữ, không có = đầy); còn ≤ 3: chữ đỏ G_ITEM_9_2; 0: món không còn tác dụng tới khi sửa
  const ben = (v) => {
    const c = it.ben ?? v, low = c <= 3;
    line(span((low ? DURABILITY_LOW : DURABILITY).replace("%3d", pad3(c)).replace("%3d", pad3(v)), low ? "Red" : "White"));
    if (c <= 0) line(span(BROKEN, "Red"));
  };
  // "Không thể phá hủy" (indestructible_b) số 0 = món phá hủy được -> không in (vũ khí có độ bền từ 26/10, in ra thành ngược nghĩa)
  for (const [k, v] of g.base || []) if (k === "durability_v") ben(benMax(it.k) || v); else if (!(k === "indestructible_b" && !v)) line(span(fill(k, v), "White"));
  // vũ khí: bảng client không có độ bền -> độ bền của game (ItemDB.vuKhi) ở cuối thuộc tính cơ bản
  if (!(g.base || []).some(([k]) => k === "durability_v") && benMax(it.k)) ben(benMax(it.k));
  // yêu cầu: chưa đủ thì đỏ như client — sức mạnh / thân pháp / sinh khí / nội công tính cả dòng xanh của đồ đang mặc (itemdb.js diemCo — như
  // máy chủ kiểm khi mặc; anh 30/10: "các dòng sinh khí sức mạnh thân pháp trên trang bị không cộng vào chỉ số như trên client"). Ngũ hành / môn
  // phái: S1 không đòi (anh 04/11 bỏ giới hạn) -> không in dòng đó (áo Đạo hệ Thổ, áo Cái Bang)
  const c = diemCo(hero);
  const ok = {
    requirelevel: (v) => (hero.lvl || 1) >= v, requirestr: (v) => c.str >= v, requiredex: (v) => c.dex >= v, requirevit: (v) => c.vit >= v, requireeng: (v) => c.eng >= v,
    requiresex: (v) => (v ? "f" : "m") === hero.sex, require_translife: () => false,
  };
  for (const [k, v] of g.req || []) if (k !== "requireseries" && k !== "requiremenpai") line(span(fill(k, v), !ok[k] || ok[k](v) ? "White" : "Red"));
  // dòng xanh: "kỹ năng hệ X" của vũ khí hiện thành sát thương nội công hệ tương ứng (như bản 2 — attr.json serDmg)
  d.forEach(([k, v], i) => line(span(fill(ItemDB.serDmg[k] || k, v), coTacDung(i, opt.kich || 0) && it.ben !== 0 ? "Blue" : "DBlue"))); // độ bền 0: xám hết
  // gợi ý kích dòng ẩn (dòng trống trước như engine)
  const loai = opt.slot || SLOT_OF[x.t], gen = SINH.indexOf(it.s);
  if (!opt.dangMac && d.length > 1 && gen >= 0 && KICH[loai]) {
    const Ci = SERIES_COL[it.s], Cx = SERIES_COL[gen];
    const goi = (o, dau = "") => line(span(dau + (dau ? "cần " : "Cần "), Ci) + span(`hệ ${SERIES[gen]}`, "Cyan") + span(" của ", Ci) + span(TEN_O[KICH[o][0]], Cx)
      + span(" và ", Ci) + span(TEN_O[KICH[o][1]], Cx) + span(" để kích thuộc tính ẩn", Ci));
    line("");
    if (loai === "Ring1" && !opt.slot) { goi("Ring1", "Nhẫn trên: "); goi("Ring2", "Nhẫn dưới: "); } else goi(loai);
  }
  if (XEM_NGUON && it.g) { // nguồn gốc (chỉ quản trị): nơi sinh ra, giờ + người có đầu tiên, 4 bước đường đi gần nhất, mã món
    const l0 = Array.isArray(it.ng) ? it.ng[0] : "";
    line("");
    line(span(`Nguồn gốc: ${cauNguon(it.ng)}`, l0 === "?" ? "Red" : l0 === "qt" ? "Gold" : "Cyan"));
    if (Array.isArray(it.ng) && +it.ng[2] > 0) line(span(`${gioNguon(it.ng[2])}${it.ng[3] ? ` · có đầu tiên: ${it.ng[3]}` : ""}`, "DBlue"));
    for (const [t, , c] of (Array.isArray(it.di) ? it.di : []).slice(-4)) line(span(`${gioNguon(t)} — ${c}`, "White"));
    line(span(`Mã món: ${it.g}`, "DBlue"));
  }
  hint();
  return out.join("");
}
