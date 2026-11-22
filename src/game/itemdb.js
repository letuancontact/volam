// Kho đồ dùng chung (assets/web/item — tools/build-item-pack.mjs) + bảng đồ client (assets/data/do-goc.json — cong-cu/dung-do-goc.js) +
// đổi tên "kỹ năng hệ X" -> sát thương nội công (assets/data/attr.json serDmg). Nạp 1 lần lúc khởi động (main.js boot): chỉ số nhân vật
// cần đồ đang mặc. Câu chữ ô xem món: src/game/itemtip.js.
//   await ItemDB.load(); ItemDB.item(k); ItemDB.base(k); await ItemDB.text(k) -> [cơ bản, thuộc tính, yêu cầu] (công cụ thử)
// Món (từ 25/10, máy chủ quyết — may-chu/do.js): { u, k, s, d, m } — u = mã món trong nhân vật, k = khóa kho đồ, s = ngũ hành món,
// d = [[khóa thuộc tính client, số], …] theo vị trí dòng (bảng client magicattrib.txt; dòng 2, 4, 6 là dòng ẩn — soKich), m = cấp quái
// đã rơi ra món. ItemDB.base(k) = bảng đồ client (do-goc.json: cấp đồ cl, câu mô tả, thuộc tính cơ bản, yêu cầu).
// hero.equip = { ô: món }, hero.bag = [món], hero.looks = kiểu dáng các
// món đang mặc (src/char/jx-char.js NONE khi trống), hero.ranged = đang cầm ám khí (món loại 1 "Vũ khí tầm xa" — đòn thường bắn đạn bay
// tầm 320, src/game/world.js). Mặc / tháo / bán: hỏi máy chủ (main.js doItem); wear / unwear ở đây chỉ còn cho công cụ thử.
// Thuốc (25/10): món { u, k: "potion:<dòng>", n: số bình } — bảng assets/data/thuoc.json (cong-cu/dung-thuoc.js): ItemDB.item(k) =
// { n, intro, ic, c, gia, hp: [hồi mỗi nửa giây, số lần], mp, thuoc: 1 }; ItemDB.shops[Sale của script NPC] = hàng của cửa hàng.

const BASE = "assets/web/item/";
// loại món (cột 2 bảng đồ client, items.json types) -> ô trang bị của trang Trang bị (玩家装备与人物状态_装备.ini)
export const SLOT_OF = { 0: "Weapon", 1: "Weapon", 2: "Cloth", 3: "Ring1", 4: "Necklace", 5: "Shoes", 6: "Sash", 7: "Cap", 8: "Bangle", 9: "Pendant", 10: "Horse", 11: "Mask", 12: "Mantle", 13: "Signet", 14: "Shipin", 15: "Shipin" };
export const GROUP_COL = { "Đồ xanh": "#8fb8ff", "Hoàng Kim": "#ffd54a", "Hoàng Kim môn phái": "#ffd54a", "Bạch Kim": "#c9f2ff" };
const WHITE = "#ffffff";
// dòng xanh (khóa thuộc tính client) -> chỉ số cộng (equipStats). Anh 30/10 "các dòng chỉ số của đồ xanh đều phải có tác dụng như client":
// cả 41 loại dòng của đồ S1 (dong-xanh.json) đều có tác dụng theo engine (KNpcAttribModify): hồi nội lực / thể lực mỗi nửa giây, hút sinh lực /
// nội lực chỉ ở đòn ngoại công (hutSinh / hutNoi), "Kỹ năng hệ X" hiện là sát thương nội công (MAGIC_LINE — cộng vào chiêu nội công), chuyển
// hóa sát thương thành nội lực (World.hit), độc của đồ mất dần theo nhịp (World.docDon), không thể phá hủy (máy chủ may-chu/do.js hao).
const STAT_LINE = { lifemax_v: "life", manamax_v: "mana", staminamax_v: "stamina", lifereplenish_v: "lifeRegen", strength_v: "str",
  manareplenish_v: "manaRegen", staminareplenish_v: "stRegen", stealmanaenhance_p: "hutNoi",
  dexterity_v: "dex", vitality_v: "vit", allres_p: "resAll", fastwalkrun_p: "moveSpeed", attackspeed_v: "atkSpeed",
  // tốc độ đánh nội công (thi pháp — chiêu nội công + bùa nhanh theo, anh 25/10); dòng (Dương) cộng như thường
  castspeed_v: "castSpeed", attackspeed_yan_v: "atkSpeed", castspeed_yan_v: "castSpeed",
  meleedamagereturn_v: "thorns", addphysicsdamage_v: "dmgAdd", addphysicsdamage_p: "dmgPct", lucky_v: "luck",
  steallifeenhance_p: "hutSinh", attackratingenhance_v: "ar", ignoredefense_p: "ignoreDef", damage2addmana_p: "dmg2mana",
  // chống trạng thái (anh 29/10 lần 4 — có tác dụng khi quái có võ công, cau-hinh.json quaiVoCong): Thời gian phục hồi (giật), làm chậm, choáng, trúng độc
  fasthitrecover_v: "tgph", fasthitrecover_yan_v: "tgph", freezetimereduce_p: "tglc", stuntimereduce_p: "tgc", poisontimereduce_p: "tgtd" };
const RES_LINE = { poisonres_p: "poison", fireres_p: "fire", coldres_p: "cold", lightingres_p: "light", physicsres_p: "phys" };
const ELEM_LINE = { addpoisondamage_v: "poison", addcolddamage_v: "cold", addfiredamage_v: "fire", addlightingdamage_v: "light" };
// sát thương nội công: dòng "Kỹ năng hệ X" của vũ khí hiện thành dòng nội công (attr.json serDmg — như bản 2) -> cộng vào mỗi đòn của chiêu nội
// công (vocong.js elemOf / poisonOf / skDamage — engine m_CurrentMagic…Damage, m_CurrentPhysicsMagicDamageV)
const MAGIC_LINE = { addphysicsmagic_v: "physics", addcoldmagic_v: "cold", addfiremagic_v: "fire", addlightingmagic_v: "light", addpoisonmagic_v: "poison" };

// Anh chốt 24/10: game còn 10 phái cũ — Hoa Sơn, Võ Hồn, Tiêu Dao bỏ hẳn (kho đồ không còn đồ của 3 phái, kể cả Đao thuẫn / Thuẫn đao /
// Cầm — tools/lib/phai.js). Món không còn trong kho: máy chủ bỏ khi nạp nhân vật (may-chu/do.js chuan).

const json = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
export const ItemDB = {
  pack: null, by: null, ktc: { the: [], buff: {}, bua: { hieu: {}, mon: {} } }, _bd: new Map(), goc: null, serDmg: {}, shops: {}, _text: null, _p: null, _pt: null,
  vuKhi: null, // độ bền + giá gốc vũ khí theo cấp đồ (máy chủ gửi: luat().vuKhi — cau-hinh.json doBen.vuKhi; main.js đặt lúc vào game)
  load() {
    // vat-pham.json (cong-cu/dung-tap-hoa.js): Thổ Địa Phù + hàng Tạp hóa Ba Lăng (shops[38] = [{ k, gia, s }]); thuốc: shops[39] = [khóa]
    return (this._p = this._p || Promise.all([json(BASE + "items.json"), json("assets/data/do-goc.json"), json("assets/data/attr.json"), json("assets/data/thuoc.json"), json("assets/data/vat-pham.json").catch(() => ({ items: {}, shops: {} })),
      json("assets/data/ky-tran-cac.json").catch(() => ({ items: {}, the: [], buff: {} }))]).then(([p, g, attr, th, vp, ktc]) => {
      this.pack = p; this.by = new Map(p.items.map((x) => [x.k, x]));
      for (const [k, x] of Object.entries(th.items)) this.by.set(k, { ...x, k, thuoc: 1 });
      for (const [k, x] of Object.entries(vp.items)) this.by.set(k, { ...x, k });
      // Kỳ Trân Các (anh 27/10 — cong-cu/dung-ky-tran-cac.js): món (ktc: 1, dung = công dụng | null) + thẻ hàng (Xu) + trạng thái vật phẩm
      for (const [k, x] of Object.entries(ktc.items)) this.by.set(k, { ...x, k, tuKtc: 1 }); // tuKtc: món của bảng Kỳ Trân Các (cả thuốc trong lễ bao) — windows.js _khongBan
      this.ktc = { the: ktc.the || [], buff: ktc.buff || {}, bua: ktc.bua || { hieu: {}, mon: {} } };
      this.goc = g.items; this.serDmg = attr.serDmg || {}; this.shops = { ...th.shops, ...vp.shops };
      // cửa hàng phúc duyên (Thần bí Thương Nhân Liễu Ất — Sale 93 của client; giá = điểm phúc duyên — anh 31/10 khuya lần 2): GW.openShop(93, "pd")
      if (ktc.phucDuyen && ktc.phucDuyen.length) this.shops[93] = ktc.phucDuyen.map((o) => ({ k: o.k, gia: o.gia }));
      return p;
    }).catch((e) => { this._p = null; throw e; }));
  },
  item(k) { return (this.by && this.by.get(k)) || null; },
  // trạng thái vật phẩm k của hero.buff (máy chủ đếm): Kỳ Trân Các (ktc.buff) hoặc bùa Phong Hỏa "ph:<hiệu quả>:<trị số>" (may-chu/do.js nhatBua —
  // ktc.bua.hieu: { ten, n, attrs, pt, ic }) -> { n, d, ic, attrs } | null. Trạng thái Tống Kim (tk…): ky-tran-cac.json chưa có thì bản dự phòng TK_BUFF
  buffDef(k) {
    const T = this.ktc.buff[k]; if (T) return T;
    if (TK_BUFF[k]) return TK_BUFF[k];
    if (this._bd.has(k)) return this._bd.get(k);
    /* BH_BUFF_DEF */
    const bm = /^bh:(\w+):(\d+)$/.exec(k);
    if (bm) {
      const loai = bm[1], c = Math.max(1, +bm[2] || 1);
      const defs = {
        tuLinh:    { n: "Đặc kỹ: Tụ Linh Quyết",    d: `Kinh nghiệm đánh quái +${c * 5}% (Bang hội)`,             ic: "item/medecine/tianshanyulu.png" },
        hoThe:     { n: "Đặc kỹ: Hộ Thể Chân Khí",  d: `Sinh lực & Nội lực tối đa +${c * 250} (Bang hội)`,       ic: "item/medecine/obj-potion15.png", attrs: { lifemax_v: [c * 250], manamax_v: [c * 250] } },
        thienPhuc: { n: "Đặc kỹ: Thiên Phúc",       d: `May mắn +${c * 4} (Bang hội)`,                           ic: "item/medecine/tianshanyulu.png" },
        thietBich: { n: "Đặc kỹ: Thiết Bích",       d: `Kháng tất cả +${c * 3}% (Bang hội)`,                     ic: "item/medecine/baiguolu.png", khang: c * 3 },
        thanHanh:  { n: "Đặc kỹ: Chiến Hồn Bang",   d: `Tốc độ đánh ngoại & nội công +${c * 6} (Bang hội)`,      ic: "item/questkey/003.png", attrs: { attackspeed_v: [c * 6], castspeed_v: [c * 6] } },
        binhGiap:  { n: "Binh giáp phường",         d: `Sinh lực tối đa +${c * 200}, Kháng tất cả +${c * 2}%`,  ic: "item/medecine/baiguolu.png", khang: c * 2, attrs: { lifemax_v: [c * 200] } },
        thienY:    { n: "Thiên ý phường",           d: `May mắn +${4 + c * 2} (Quẻ cầu phúc)`,                   ic: "item/medecine/tianshanyulu.png" },
        diDung:    { n: "Dị dung phường",           d: `Công kích vật lý +${c * 30}, Tốc độ đánh +${c * 5}`,     ic: "item/medecine/obj-potion15.png", attrs: { addphysicsdamage_v: [c * 30], attackspeed_v: [c * 5], castspeed_v: [c * 5] } }
      };
      const o = defs[loai] || null;
      if (o) this._bd.set(k, o);
      return o;
    }
    const m = /^ph:(\w+):(\d+)$/.exec(k), H = m && this.ktc.bua.hieu[m[1]];
    if (!H) return null;
    const v = +m[2], o = { n: H.ten, d: `${H.n} +${v}${H.pt ? "%" : ""} (bùa Phong Hỏa)`, ic: H.ic, attrs: Object.fromEntries(H.attrs.map((a) => [a, [v]])) };
    this._bd.set(k, o);
    return o;
  },
  base(k) { return (this.goc && this.goc[k]) || {}; },
  group(x) { return (this.pack && this.pack.groups[x.gr]) || ""; },
  type(x) { return (this.pack && this.pack.types[x.t]) || ""; },
  color(x) { return GROUP_COL[this.group(x)] || WHITE; },
  async text(k) {
    if (!this._text) this._text = await (this._pt = this._pt || fetch(BASE + "text.json").then((r) => { if (!r.ok) throw new Error("text.json " + r.status); return r.json(); }).then((j) => j.text).catch((e) => { this._pt = null; throw e; }));
    return this._text[k] || [];
  },
};

// Dòng ẩn (dòng 2, 4, 6 — "thuộc tính âm" của client, G_ITEM_21 "Cần %s của %s và %s để kích thuộc tính âm"): kích bởi ngũ hành nhân
// vật + 2 ô trang bị liên kết (cặp ô theo bản 2 SOURCE2/js/stats.js ACTIVATED_BY), hệ X kích món hệ Y khi X sinh Y (Kim sinh Thủy, Thủy
// sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim). GIỐNG may-chu/do.js (máy chủ tính may mắn) — sửa thì sửa cả 2.
export const KICH = { Cap: ["Cloth", "Necklace"], Cloth: ["Ring2", "Sash"], Sash: ["Pendant", "Bangle"], Weapon: ["Necklace", "Cloth"], Shoes: ["Weapon", "Cap"],
  Bangle: ["Shoes", "Ring1"], Necklace: ["Sash", "Ring2"], Ring1: ["Weapon", "Cap"], Ring2: ["Bangle", "Pendant"], Pendant: ["Shoes", "Ring1"] };
export const SINH = [2, 3, 1, 4, 0]; // 0 Kim -> 2 Thủy, 1 Mộc -> 3 Hỏa, 2 Thủy -> 1 Mộc, 3 Hỏa -> 4 Thổ, 4 Thổ -> 0 Kim
// số dòng ẩn được kích của món it đang mặc ở ô slot (món trong túi: chưa kích — windows.js _showTip)
export function soKich(hero, slot, it) {
  if (!it || it.s == null) return 0;
  let n = SINH[hero.series] === it.s ? 1 : 0;
  for (const o of KICH[slot] || []) { const x = (hero.equip || {})[o]; if (x && x !== it && x.s != null && SINH[x.s] === it.s) n++; }
  return n;
}
// dòng i (0 = dòng 1) có tác dụng: dòng 1, 3, 5 luôn có; dòng ẩn thứ j (dòng 2, 4, 6) khi j < số lần được kích
export const coTacDung = (i, kich) => i % 2 === 0 || (i - 1) / 2 < kich;
// Tống Kim (anh 06/11 — đặc tả đợt 2): trạng thái vật phẩm chỉ có tác dụng trong chiến trường (World.bonus bỏ qua ngoài trận; máy chủ cũng xóa khi rời
// trận). Bản dự phòng khi ky-tran-cac.json chưa có — dòng thuộc tính đúng chiêu trạng thái client (settings\skills.txt): hoàn 488 / 493 / 473 / 487 /
// 479 / 496, Chiến cổ 491, Lệnh Bài 492 (3 phút; Chiến cổ / Lệnh Bài cho cả người cùng phe đứng gần — tongkim.js dungDoi)
const HOAN_TK = "item/medecine/obj-potion15.png";
export const TK_BUFF = {
  tkTruongMenh: { n: "Tống Kim Trường Mệnh hoàn", d: "Sinh lực tối đa +500", attrs: { lifemax_v: [500] }, ic: HOAN_TK, tk: 1 },
  tkGiaBao: { n: "Tống Kim Gia Bào hoàn", d: "Tốc độ di chuyển +20%", attrs: { fastwalkrun_p: [20] }, ic: HOAN_TK, tk: 1 },
  tkPhoPhong: { n: "Tống Kim Phổ Phòng hoàn", d: "Kháng vật lý +50%", attrs: { physicsres_p: [50] }, ic: HOAN_TK, tk: 1 },
  tkNgoaiPho: { n: "Tống Kim Ngoại Phổ hoàn", d: "Sát thương vật lý ngoại công +50%", attrs: { addphysicsdamage_p: [50] }, ic: HOAN_TK, tk: 1 },
  tkNoiPho: { n: "Tống Kim Nội Phổ hoàn", d: "Sát thương vật lý nội công +100", attrs: { addphysicsmagic_v: [100] }, ic: HOAN_TK, tk: 1 },
  tkPhiToc: { n: "Tống Kim Phi Tốc hoàn", d: "Tốc độ đánh ngoại công + nội công +50", attrs: { attackspeed_v: [50], castspeed_v: [50] }, ic: HOAN_TK, tk: 1 },
  tkChienCo: { n: "Chiến cổ", d: "Sinh lực tối đa +30%, kháng tất cả +30%", attrs: { lifemax_p: [30], allres_p: [30] }, ic: "item/songjin/wardrum.png", tk: 1 },
  tkLenhBai: { n: "Lệnh Bài", d: "Tốc độ di chuyển +30%, tốc độ đánh ngoại công + nội công +50", attrs: { fastwalkrun_p: [30], attackspeed_v: [50], castspeed_v: [50] }, ic: "item/songjin/token.png", tk: 1 },
};
// khóa trạng thái của Tống Kim (tk + chữ hoa, hoặc ky-tran-cac.json đánh dấu tk)
// "hoàn" = trạng thái vật phẩm có chỉ số chiến đấu (hoàn Tống Kim + hoàn Kỳ Trân Các) — trong trận Tống Kim tối đa luat().tkHoan giây, trọng thương thì mất
// (anh 17/11 — may-chu/tong-kim.js hoanTran, do.js laHoan). Chiến cổ / Lệnh Bài (đồng đội), bùa Phong Hỏa không tính
export const laHoan = (k) => typeof k === "string" && k !== "tkChienCo" && k !== "tkLenhBai" && !k.startsWith("ph:") && !!(ItemDB.buffDef(k) || {}).attrs;
export const laBuffTk = (k) => typeof k === "string" && (/^tk[A-Z]/.test(k) || !!((ItemDB.ktc.buff || {})[k] || {}).tk);
// món chỉ dùng trong chiến trường Tống Kim (client checkmapid.lua "Vật phẩm này chỉ có thể sử dụng ở Chiến trường Tống Kim"): hàng Quân Nhu quan trừ Hồn
// Thạch — 6 hoàn, Chiến cổ, Lệnh Bài, Càn Khôn Tạo Hóa Đan; món mới đánh dấu dung.tk (cong-cu/dung-ky-tran-cac.js)
const TK_MON = new Set(["ms:156", "ms:157", "ms:178", "ms:181", "ms:186", "ms:187", "ms:190", "ms:191", "ms:215", "ms:216", "ms:217"]);
export const laVatTk = (k) => { const x = ItemDB.item(k); return TK_MON.has(k) || !!(x && x.dung && (x.dung.tk || laBuffTk(x.dung.buff))); };
export const isPotion = (it) => !!(it && (ItemDB.item(it.k) || {}).thuoc);
export const isPhu = (it) => !!(it && (ItemDB.item(it.k) || {}).phu); // Thổ Địa Phù (về thành)
export const isKtc = (it) => !!(it && (ItemDB.item(it.k) || {}).ktc); // món Kỳ Trân Các (chồng n món; lễ bao: con = số viên còn)
// độ bền (anh 26/10 "sửa đồ" — may-chu/do.js): tối đa = thuộc tính cơ bản durability_v của bảng đồ client (0 = món không có độ bền); vũ khí
// (client 8.1 không có): bảng ItemDB.vuKhi theo cấp đồ. Còn = it.ben (không có = đầy). Giá sửa GIỐNG may-chu/do.js giaSua (engine
// KItem::GetRepairPrice; L = luat().sua { gia, dong })
const laVuKhi = (k) => { const x = ItemDB.item(k); return !!x && !x.thuoc && (x.t === 0 || x.t === 1); };
export const benMax = (k) => {
  if (ItemDB.vuKhi && laVuKhi(k)) return (ItemDB.vuKhi.ben || [])[(ItemDB.base(k).cl || 1) - 1] || 0;
  const b = (ItemDB.base(k).base || []).find((x) => x[0] === "durability_v"); return b ? b[1] : 0;
};
const giaGoc = (k) => (ItemDB.vuKhi && laVuKhi(k) ? (ItemDB.vuKhi.gia || [])[(ItemDB.base(k).cl || 1) - 1] || 0 : ItemDB.base(k).price || 0);
export const benCua = (it) => (it.ben == null ? benMax(it.k) : it.ben);
export function giaSua(it, L = { gia: 50, dong: 16 }) {
  const mx = benMax(it.k), cur = benCua(it);
  if (!mx || cur >= mx) return 0;
  return Math.floor((Math.floor((Math.floor(giaGoc(it.k) * L.gia / 100) * (mx - cur)) / mx) * (L.dong + (it.d || []).length)) / L.dong);
}
// nhân vật mặc được món này không (đủ yêu cầu — GIỐNG may-chu/do.js yeuCau): túi đồ tô nền xanh / đỏ sậm như client (thuốc: xanh). Sức mạnh /
// thân pháp: cả dòng xanh của đồ đang mặc (diemCo). Không xét ngũ hành / môn phái (anh 04/11 bỏ giới hạn — mang đồ thoải mái hơn)
export function canWear(hero, it) {
  if (isPotion(it)) return true;
  const g = ItemDB.base(it.k);
  if ((hero.lvl || 1) < (g.lv || 1) || g.reborn) return false;
  if (g.sex && g.sex !== hero.sex) return false;
  if (g.str || g.dex) { const c = diemCo(hero); if ((g.str && c.str < g.str) || (g.dex && c.dex < g.dex)) return false; }
  return true;
}
// ô món sẽ vào khi mặc (nhẫn: Ring1, Ring1 có rồi mà Ring2 trống thì Ring2 — như máy chủ)
export function slotFor(hero, it) {
  const x = ItemDB.item(it.k); let s = x && SLOT_OF[x.t];
  if (s === "Ring1" && hero.equip && hero.equip.Ring1 && !hero.equip.Ring2) s = "Ring2";
  return s || null;
}

// Chỉ số cộng từ đồ đang mặc: chỉ số gốc (do-goc.json) + dòng xanh có tác dụng (dòng ẩn chưa kích thì không). Ngựa chỉ tính khi đang
// cưỡi. Trả về B cho rules.heroStats.
export function equipStats(hero, riding) {
  const B = { str: 0, dex: 0, vit: 0, eng: 0, life: 0, mana: 0, stamina: 0, res: { fire: 0, cold: 0, light: 0, poison: 0, phys: 0 }, resAll: 0,
    wdmg: null, dmgAdd: 0, dmgPct: 0, elem: { poison: 0, cold: 0, fire: 0, light: 0 }, atkSpeed: 0, castSpeed: 0, moveSpeed: 0, ar: 0, arPct: 0, def: 0,
    lifeRegen: 0, lifeSteal: 0, thorns: 0, luck: 0, ignoreDef: 0, tgph: 0, tglc: 0, tgc: 0, tgtd: 0, dmg2mana: 0, manaRegen: 0, stRegen: 0, hutSinh: 0, hutNoi: 0,
    elemMagic: { physics: 0, cold: 0, fire: 0, light: 0, poison: 0 } };
  for (const [slot, it] of Object.entries(hero.equip || {})) {
    if (!it || !it.k || (slot === "Horse" && !riding) || it.ben === 0) continue; // độ bền 0: không còn tác dụng (may-chu/do.js)
    const g = ItemDB.base(it.k);
    if (slot === "Weapon" && g.dmg) B.wdmg = g.dmg;
    B.arPct += g.arPct || 0; B.def += g.def || 0; B.moveSpeed += g.move || 0; B.stamina += g.stamina || 0;
    B.life += g.life || 0; B.resAll += g.resAll || 0; B.lifeRegen += g.lifeRegen || 0;
    const kich = soKich(hero, slot, it);
    for (const [i, [k, v]] of (it.d || []).entries()) {
      if (!coTacDung(i, kich)) continue;
      if (RES_LINE[k]) B.res[RES_LINE[k]] += v;
      else if (ELEM_LINE[k]) B.elem[ELEM_LINE[k]] += v;
      else if (STAT_LINE[k]) B[STAT_LINE[k]] += v;
      else if (MAGIC_LINE[ItemDB.serDmg[k]]) B.elemMagic[MAGIC_LINE[ItemDB.serDmg[k]]] += v;
    }
  }
  return B;
}
// sức mạnh / thân pháp / sinh khí / nội công đang có = điểm gốc + điểm đã cộng + dòng xanh có tác dụng của đồ đang mặc — yêu cầu của món so với
// số này như client (engine KItemList::EnoughAttrib so với m_nCurStrength…, đã cộng đồ đang mặc; tháo đồ không bắt tháo món khác — anh 30/10
// "các dòng sinh khí sức mạnh thân pháp trên trang bị không cộng vào chỉ số như trên client"). GIỐNG may-chu/do.js diemCo
export function diemCo(hero) {
  const B = equipStats(hero, false), s = hero.start || {}, a = hero.attr || {};
  return { str: (s.str || 0) + (a.str || 0) + B.str, dex: (s.dex || 0) + (a.dex || 0) + B.dex, vit: (s.vit || 0) + (a.vit || 0) + B.vit, eng: (s.eng || 0) + (a.eng || 0) + B.eng };
}

// loại vũ khí đang cầm cho giới hạn vũ khí của võ công (skills.txt EqtLimit): −1 tay không (cả triền thủ — vũ khí quyền, p 6), 0 kiếm,
// 1 đao, 2 côn, 3 thương, 4 chùy, 5 song đao (p của món cận chiến), 100 + p ám khí (0 phi tiêu, 1 phi đao, 2 tụ tiễn)
export function weaponKind(hero) {
  const w = hero.equip && hero.equip.Weapon, x = w && ItemDB.item(w.k);
  if (!x) return -1;
  if (x.t === 1) return 100 + (x.p | 0);
  return (x.p | 0) === 6 ? -1 : x.p | 0;
}

// đang cầm ám khí (vũ khí tầm xa) -> đòn thường bắn đạn bay, sát thương theo Thân pháp
export function syncRanged(hero) {
  const w = hero.equip && hero.equip.Weapon, x = w && ItemDB.item(w.k);
  if (x && x.t === 1) hero.ranged = true; else delete hero.ranged;
}

// kiểu dáng đang hiện: đồ đang mặc, xuống ngựa (nút Lên xuống ngựa) thì bỏ ngựa
export const looksOf = (hero) => ({ ...(hero.looks || {}), ...(hero.rideOff ? { horse: 0 } : {}) });

// Công cụ thử: mặc món k (from = chỉ số món trong túi, hoặc null = món mới không dòng). Món cũ ở ô đó trả vào túi. Trả về ô đã mặc
// hoặc null nếu món không mặc được. main.js gửi kết quả lên máy chủ (tài khoản quản trị).
export function wear(hero, k, from = null) {
  const x = ItemDB.item(k); if (!x) return null;
  let slot = SLOT_OF[x.t]; if (!slot) return null;
  hero.equip = hero.equip || {};
  if (slot === "Ring1" && hero.equip.Ring1 && !hero.equip.Ring2) slot = "Ring2";
  const old = hero.equip[slot];
  let it = { k, d: [] };
  if (from != null && hero.bag && hero.bag[from] && hero.bag[from].k === k) it = hero.bag.splice(from, 1)[0];
  if (old) (hero.bag = hero.bag || []).push(old);
  hero.equip[slot] = it;
  hero.looks = hero.looks || {};
  const ox = old && ItemDB.item(old.k);
  if (ox && ox.g) delete hero.looks[ox.g];
  if (x.g) hero.looks[x.g] = x.id;
  syncRanged(hero);
  return slot;
}
// Công cụ thử: tháo món ở ô slot về túi
export function unwear(hero, slot) {
  const it = hero.equip && hero.equip[slot]; if (!it) return null;
  delete hero.equip[slot];
  const x = ItemDB.item(it.k);
  if (x && x.g && hero.looks) delete hero.looks[x.g];
  (hero.bag = hero.bag || []).push(it);
  syncRanged(hero);
  return it.k;
}
