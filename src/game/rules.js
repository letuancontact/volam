// Luật chỉ số + chiến đấu, SÁT CLIENT (M2 — anh muốn 23/10). Nguồn từng phần:
//  - Nhân vật — bảng client (assets/data/char.json: start = newplayerini, levelAdd = settings/npc/player/level_add.txt theo hệ):
//      Sinh lực = Sinh khí × LifePerVitality + cấp × LifePerLevel
//      Nội lực  = Nội công × ManaPerEnergy + cấp × ManaPerLevel        (2 công thức khớp 8 / 8 file newplayerini*.ini của client)
//      Thể lực  = Stamina<giới>Base + (cấp − 1) × Stamina<giới>PerLevel + Sinh khí × StaminaPerVitality (khớp thanh 1612 nữ cấp 180)
//      Kháng 5 hệ theo hệ (fireres …), tối đa 75 %.
//  - Hằng số engine (client không ghi trong bảng; theo mã nguồn engine Võ Lâm — bản 2 dùng đúng các số này): mỗi cấp +5 điểm tiềm
//    năng, +1 điểm kỹ năng; chính xác = Thân pháp × 4 − 28; né tránh = Thân pháp / 4; sát thương vũ khí + Sức mạnh / 5 (vũ khí tầm xa:
//    Thân pháp / 5); tỉ lệ trúng = chính xác / (chính xác + né tránh), giữ trong 5 %–95 %. Tay không: vũ khí 1–2 (như bản 2).
//  - Quái — assets/data/mobstats.json (tools/build-mob-stats.mjs chạy script cấp quái của client, đủ 5 hệ; mỗi con sinh ra hệ ngẫu
//    nhiên như máy chủ client — World.spawnMob). Đòn thường của quái = võ công 53 /
//    418 của client (theo vũ khí, +0 / +1 % sát thương — script\skill\special\近程物理攻击.lua, script\skill\npc\长兵物理攻击npc.lua)
//    -> MinDamage–MaxDamage. Quái không có sát thương vũ khí (trùm đánh bằng võ công, vd makeboss.lua): TẠM lấy sát thương nền lớn
//    nhất tới khi có võ công quái (M3).
//  - Chết (settings/npc/player/pkpunish.txt, dòng PK 0, đơn vị ‰): mất 10 ‰ kinh nghiệm cần để lên cấp (tối đa 500.000) — được âm
//    như client; mất 50 ‰ ngân lượng mang theo.
//  - Đồ (25/10): heroStats nhận B = chỉ số cộng từ đồ đang mặc (itemdb.js equipStats: chỉ số gốc + dòng xanh). Sát thương vũ khí của
//    món thay cho tay không; "Sát thương vật lý %" nhân cả phần vũ khí + Sức mạnh; độc / băng / hỏa / lôi sát cộng thẳng vào đòn, trừ
//    theo kháng hệ đó của quái (TẠM — client độc sát là sát thương theo thời gian).
//  - Võ công (25/10 — src/game/vocong.js): B còn cộng chỉ số của chiêu bị động / bùa / vòng sáng (sinh lực / nội lực %, mức kháng tối
//    đa, tốc độ đánh nội công, chí mạng, sát thương nội công theo hệ, hệ khắc, nội lực hộ thân, triệt tiêu / phản đòn %…). Chí mạng
//    ("Tăng tấn công chí mạng") × 2 cả đòn thường (TẠM). Kinh nghiệm chênh cấp (client không ghi — anh chốt 23/10): máy chủ tính.

const SCALE = 0.75;                    // kho web ×0.75: mọi khoảng cách client × SCALE
const TICK = 1 / 18;
export const PTS_PER_LEVEL = 5, SKILL_PTS_PER_LEVEL = 1, MAX_LEVEL = 200;
const HIT_MIN = 5, HIT_MAX = 95, PLAYER_RES_MAX = 75, STR_PER_DMG = 5, DEX_PER_DMG = 5;
// kháng thật của người chơi (anh 13/11: "sau khi max 75% kháng trần, mỗi 10% kháng thêm sẽ được tính là 75% + 1 (số 1 màu xanh lá như client), lúc đó kháng là
// 76% (vẫn hiển thị 75%+1%)"): dưới trần đúng số; vượt trần (75 % + kháng tối đa cộng thêm, đã trừ bùa giảm kháng tối đa) = trần + 1 % cho mỗi 10 % dư, cả thảy
// không quá 95 % (MAX_RESIST của engine). Dùng ở mọi chỗ tính sát thương lên người chơi (quái, boss, người / bot Tống Kim) + bảng chỉ số (windows.js khangO)
export const KHANG_TOI_DA = 95;
export const khangDu = (res, cap) => (res > cap ? Math.max(0, Math.min(Math.floor((res - cap) / 10), KHANG_TOI_DA - cap)) : 0);
export const khangThat = (res, cap = PLAYER_RES_MAX) => { res = +res || 0; cap = Number.isFinite(+cap) ? +cap : PLAYER_RES_MAX; return res <= cap ? res : cap + khangDu(res, cap); };
const BARE_HAND = [1, 2];
export const DEATH = { expPermille: 10, expCap: 500000, goldPermille: 50 };
export const RES_KEYS = ["fire", "cold", "light", "poison", "phys"]; // thứ tự = assets/data/mobstats.json res
const ELEM_KEYS = ["poison", "cold", "fire", "light"];
const NO_BONUS = { str: 0, dex: 0, vit: 0, eng: 0, life: 0, mana: 0, stamina: 0, res: {}, resAll: 0, wdmg: null, dmgAdd: 0, dmgPct: 0, elem: {}, atkSpeed: 0,
  moveSpeed: 0, ar: 0, arPct: 0, def: 0, lifeRegen: 0, lifeSteal: 0, thorns: 0, luck: 0, ignoreDef: 0 };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// chiêu LUYỆN (anh 29/10 — như engine: chiêu sách 90 / 120 / 150 có cờ IsExpSkill, skills.json exp = 1): không cộng điểm kỹ năng, lên cấp bằng
// độ luyện (máy chủ — may-chu/do.js luyen*; bảng assets/data/luyen-ky-nang.json). main.js datLuyen lúc nạp kho
export const LUYEN = new Set();
// cấp nhân vật có chiêu phái (MOC: mã chiêu -> cấp). Nhóm chiêu = skills_table.lua add_xx(lvl) của client (faction_def.lua tbSkillID — khớp đủ 10 phái,
// t120/so-moc.cjs): "if (lvl >= T)" phát nhóm T. Lúc vào phái client gọi add_xx(GetLevel()) (đệ tử tiếp dẫn — vào ở cấp 10: nhóm 10, chiêu nhập môn);
// nhóm 20…70 phát khi xong nhiệm vụ môn phái mốc trước: nhiệm vụ cấp N đòi GetLevel() >= N rồi add_xx(N + 10) (Võ Đang wdnpc04: 20级任务 cấp 20 ->
// add_wd(30); wdnpc05: cấp 30 -> add_wd(40); wdnpc08: cấp 50 -> add_wd(60)) — đúng cấp yêu cầu skills.txt của chiêu (nhóm T: y/c T − 10). S1 không có
// nhiệm vụ môn phái -> nhóm T có từ cấp T − 10 (nhóm 10 từ cấp 10): cấp 10 có chiêu nhập môn + chiêu hỗ trợ cấp 10 (Võ Đang quyền / kiếm pháp — thiếu
// thì Nộ Lôi Chỉ cấp 1 chỉ 1 điểm lôi sát), cấp 30 có chiêu 30… (anh 10/11 "lên cấp không có skill đúng như client … cấp 10 chỉ có chiêu chủ động mà k
// có chiêu hỗ trợ"). Bản 01/11 (anh "côn lôn mới cấp 10 mà mở skill của mấy cấp sau rồi") lấy cấp = mốc T nên mỗi nhóm trễ 1 mốc; lỗi thật lúc đó là
// Huyền Thiên Vô Cực (nhóm 70 nhưng y/c 1 trong skills.txt) — nay mốc 60 như cả nhóm. Máy chủ cùng luật: may-chu/do.js mocCua
export const MOC = new Map();
export const mocCua = (t) => (+t >= 20 ? +t - 10 : +t);
export function datLuyen(db, factions) {
  LUYEN.clear(); MOC.clear();
  for (const f of factions || []) {
    for (const id of Object.values(f.books || {}).flat()) if (db[id] && db[id].exp === 1) LUYEN.add(+id);
    for (const [t, ids] of Object.entries(f.tiers || {})) for (const id of ids) MOC.set(+id, mocCua(t));
  }
}

// điểm đã cộng + chưa cộng (nhân vật tạo trước M2 / tăng cấp bằng công cụ thử: bù đủ 5 điểm mỗi cấp đã qua)
// điểm kỹ năng như client: (cấp − 1) × 1 + Võ Lâm Mật Tịch (hero.mt — máy chủ giữ); đã dùng = phần trên cấp cho không (hero.skMin — sách /
// Đại Thành Bí Kíp) của chiêu KHÔNG luyện trong hero.skills { mã: cấp } (29/10 — trước tính cả chiêu sách: điểm đã cộng vào chiêu luyện nay trả
// lại). Tiềm năng: + hero.tiemNangThem (Tẩy Tủy Kinh)
export function fixPoints(hero) {
  hero.attr = hero.attr || { str: 0, dex: 0, vit: 0, eng: 0 };
  const used = hero.attr.str + hero.attr.dex + hero.attr.vit + hero.attr.eng, total = PTS_PER_LEVEL * ((hero.lvl || 1) - 1) + (hero.tiemNangThem | 0);
  if (hero.pts == null || used + hero.pts !== total) hero.pts = Math.max(0, total - used);
  const min = hero.skMin || {}, spent = Object.entries(hero.skills || {}).reduce((t, [id, v]) => t + (LUYEN.has(+id) ? 0 : Math.max(0, (v | 0) - (min[id] | 0))), 0);
  const skTotal = SKILL_PTS_PER_LEVEL * ((hero.lvl || 1) - 1) + (hero.mt | 0);
  if (hero.skPts == null || spent + hero.skPts !== skTotal) hero.skPts = Math.max(0, skTotal - spent);
  return hero;
}

// cấp chiêu tối đa lúc này như engine (KPlayer::AddSkillPoint — anh 29/10 "kĩ năng tăng giống client, không phải lên cấp 10 mở kĩ năng xong là
// tăng được max"): cấp chiêu ≤ cấp nhân vật − cấp yêu cầu của chiêu + 1 và ≤ cấp tối đa của chiêu — chiêu 10 tới cấp 29 mới lên được 20, chiêu 60
// tới cấp 79, chiêu 90 tới cấp 109. Cấp sách / Đại Thành Bí Kíp cho không (hero.skMin) giữ nguyên. Chưa tới mốc của chiêu (MOC) thì 0. s = chiêu trong skills.json
export const capChieu = (hero, s, id) => Math.max((hero.skMin || {})[id] | 0, (hero.lvl || 1) < (MOC.get(+id) || 0) ? 0 : Math.min(s.max || 20, (hero.lvl || 1) - (s.req || 0) + 1));
// Chiêu 90 có điều kiện nâng như client (skills.txt LevelUpScript -> script\skill\skilllvlup.lua SOSkillLevelUp — anh 31/10): mỗi chiêu cần các
// chiêu nhỏ của phái; nâng từ cấp m lên m + 1: mọi chiêu nhỏ ≥ 5 và ≥ m + 5 (m ≤ 15); từ cấp 16: chỉ xét chiêu nhỏ đầu ≥ 5; quá cấp 19 thì dừng
// (Tích Lịch Loạn Hoàn Kích 150: cấp tối đa của chiêu). [chiêu] = [chiêu nhỏ theo thứ tự của script]
export const CHIEU_TRUOC = {
  332: [93, 89, 86, 92, 282],    // Nga My — Phổ Độ Chúng Sinh: Từ Hàng Phổ Độ, Mộng Điệp, Lưu Thủy, Phật Tâm Từ Hữu, Thanh Âm Phạn Xướng
  351: [347, 303, 343, 345, 349], // Đường Môn — Loạn Hoàn Kích: Địa Diệm Hỏa, Độc Thích Cốt, Xuyên Tâm Thích, Hàn Băng Thích, Lôi Kích Thuật
  390: [67, 70, 64, 356, 72],    // Ngũ Độc — Đoạn Cân Hủ Cốt: Cửu Thiên Cuồng Lôi, Xích Diệm Thực Thiên, Băng Lam Huyền Tinh, Xuyên Y Phá Giáp, Xuyên Tâm Độc Thích
  391: [136, 137, 140, 364, 143], // Thiên Nhẫn — Nhiếp Hồn Loạn Tâm: Hỏa Liên Phần Hoa, Ảo Ảnh Phi Hồ, Phi Hồng Vô Tích, Bi Tô Thanh Phong, Lịch Ma Đoạt Hồn
  394: [392, 174, 393, 175, 90], // Côn Lôn — Túy Tiên Tá Cốt: Thúc Phược Chú, Ki Bán Phù, Bắc Minh Đảo Hải, Khi Hàn Ngạo Tuyết, Mê Tung Ảo Ảnh
  1110: [45, 351],               // Đường Môn 150 — Tích Lịch Loạn Hoàn Kích: Tích Lịch Đơn, Loạn Hoàn Kích
};
// câu chặn khi nâng chiêu id (null = được nâng) — câu của client (MESSAGES của skilllvlup.lua); ten(mã) -> tên chiêu
export function chanNang(skills, id, ten) {
  const L = CHIEU_TRUOC[id]; if (!L) return null;
  const m = (skills || {})[id] | 0;
  if (m > 19 && +id !== 1110) return "Cấp tu luyện của bạn đã tới đỉnh rồi, không thể nâng cao hơn nữa.";
  for (const p of L) {
    const pl = (skills || {})[p] | 0;
    if (pl < 5) return `Võ công cơ bản của [${ten(p)}] bạn quá thấp, hạn chế [${ten(id)}] luyện cấp.`;
    if (m > 15) return null;
    if (pl < m + 5) return `Võ công cơ bản của [${ten(p)}] bạn quá thấp, hạn chế [${ten(id)}] tăng cấp.`;
  }
  return null;
}
// anh 16/11 — Báo Đáp Ân Sư: Nhất Kỷ Càn Khôn Phù (+1) / Càn khôn song tuyệt Bội (+2) — hero.ccKn [{ v, het }] (máy chủ giữ, giờ thật: offline vẫn trôi,
// hết hạn thì thôi). Cộng min(CC_TOI_DA, tổng v còn hạn) cấp cho mọi chiêu ĐÃ HỌC (cấp > 0), trừ đòn thường 1 / 2 / 53 và Khinh công 210; chỉ tính lúc
// dùng (vocong.js skLv, các vòng đọc thẳng hero.skills, bảng Võ công) — KHÔNG ghi vào hero.skills (máy chủ kiểm điểm đã cộng: api.js diemDaDung — ghi
// vào thì mất chiêu). Kẹp theo số cấp có dữ liệu của chiêu (dòng dài nhất của bảng s.lv): chiêu hết dữ liệu thì không cộng
export const CC_TOI_DA = 3, CC_TRU = new Set([1, 2, 53, 210]);
export function ccCong(hero, t = Date.now()) {
  const L = hero && hero.ccKn; if (!Array.isArray(L) || !L.length) return 0;
  let v = 0; for (const x of L) if (x && +x.het > t) v += Math.max(0, x.v | 0);
  return Math.min(CC_TOI_DA, v);
}
// vầng trăng trên đầu (anh 16/11 "trên đầu nhân vật sẽ có icon đặc biệt… ng ta cũng thấy dc"): bit 1 = còn hiệu ứng +1 (Nhất Kỷ Càn Khôn Phù -> Hồng Nguyệt),
// bit 2 = còn hiệu ứng +2 (Càn khôn song tuyệt Bội -> Lam Nguyệt) — client gắn 2 trạng thái khác mã nên 2 vầng trăng cùng hiện được. Cùng luật với
// may-chu/the-gioi.js ccDau (cờ cc gửi người khác)
export function ccTrang(hero, t = Date.now()) {
  const L = hero && hero.ccKn; if (!Array.isArray(L)) return 0;
  let m = 0; for (const x of L) if (x && +x.het > t && (x.v | 0) > 0) m |= (x.v | 0) >= 2 ? 2 : 1;
  return m;
}
// bảng cấp của client phần lớn chỉ tới cấp tối đa + 1 (212 / 291 chiêu có 21 dòng) — +cấp kỹ năng cần thêm dòng: nối dài mỗi bảng s.lv tới max + 1 + them
// dòng theo bước tăng của 2 dòng cuối (số đầu mỗi ô [giá trị, …]; các số sau giữ như dòng cuối; không đổi dấu). Chạy 1 lần lúc nạp skills.json (main.js)
export function noiCapChieu(db, them = CC_TOI_DA) {
  const buoc = (p, q, k) => { const v = q + (q - p) * k; return (p >= 0 && q >= 0 && v < 0) || (p <= 0 && q <= 0 && v > 0) ? 0 : Number.isInteger(p) && Number.isInteger(q) ? Math.round(v) : v; };
  for (const s of Object.values(db || {})) {
    if (!s || !s.lv || typeof s.lv !== "object") continue;
    const can = ((s.max | 0) || 20) + 1 + them;
    for (const a of Object.values(s.lv)) {
      if (!Array.isArray(a) || a.length < 2 || a.length >= can) continue;
      const n = a.length, p = a[n - 2], q = a[n - 1];
      for (let i = n; i < can; i++) {
        const k = i - (n - 1);
        if (typeof p === "number" && typeof q === "number") a.push(buoc(p, q, k));
        else if (Array.isArray(p) && Array.isArray(q) && typeof p[0] === "number" && typeof q[0] === "number") a.push([buoc(p[0], q[0], k), ...q.slice(1)]);
        else a.push(Array.isArray(q) ? q.slice() : q);
      }
    }
  }
  return db;
}
const CC_SO_CAP = new WeakMap();
const soCapCo = (s) => {
  if (!s || typeof s !== "object") return 0;
  let n = CC_SO_CAP.get(s); if (n != null) return n;
  n = 0; for (const a of Object.values(s.lv || {})) if (Array.isArray(a) && a.length > n) n = a.length;
  CC_SO_CAP.set(s, n); return n;
};
// cấp dùng của chiêu id (s = chiêu trong skills.json) đã học lv khi đang được cộng cong cấp
export function capCong(s, id, lv, cong) {
  lv = lv | 0; if (!(cong > 0) || lv < 1 || CC_TRU.has(+id)) return lv;
  const n = soCapCo(s); return n > lv ? Math.min(lv + cong, n) : lv;
}
// bản xem { mã: cấp dùng } của hero.skills (không cộng thì trả chính hero.skills — không tạo đối tượng mới)
export function skCong(hero, db, cong = ccCong(hero)) {
  const sk = (hero && hero.skills) || {}; if (!(cong > 0)) return sk;
  const o = {}; for (const [id, lv] of Object.entries(sk)) o[id] = capCong(db && db[id], id, lv, cong);
  return o;
}
// chiêu đang cao hơn mức đó (nhân vật cộng điểm trước 29/10, công cụ thử hạ cấp) -> hạ về đúng mức; điểm thừa trả lại ở fixPoints. Trả
// [[mã, cấp cũ, cấp mới]] đã hạ
export function hamChieu(hero, db) {
  const ha = [];
  for (const [id, lv] of Object.entries(hero.skills || {})) {
    const s = db && db[id]; if (!s || LUYEN.has(+id)) continue; // chiêu luyện: cấp theo độ luyện
    const c = capChieu(hero, s, id);
    if ((lv | 0) > c) { ha.push([+id, lv | 0, c]); if (c > 0) hero.skills[id] = c; else delete hero.skills[id]; }
  }
  if (ha.length) { hero.skPts = null; fixPoints(hero); }
  return ha;
}

// chr = assets/data/char.json (levelAdd theo hệ), B = chỉ số cộng từ đồ đang mặc (itemdb.js equipStats; bỏ trống = không mặc gì)
export function heroStats(hero, chr, B = NO_BONUS) {
  const s = hero.start, A = chr.levelAdd[hero.series] || chr.levelAdd[0], lvl = hero.lvl || 1, a = hero.attr || {};
  const str = s.str + (a.str || 0) + B.str, dex = s.dex + (a.dex || 0) + B.dex, vit = s.vit + (a.vit || 0) + B.vit, eng = s.eng + (a.eng || 0) + B.eng;
  const vitGoc = s.vit + (a.vit || 0), engGoc = s.eng + (a.eng || 0); // sinh khí / nội công gốc + điểm cộng (không tính của đồ)
  const f = hero.sex === "f" ? "Female" : "Male";
  // sát thương vũ khí của món (tay không 1–2) + "Sát thương vật lý - ngoại công +điểm" + Sức mạnh / 5 (cầm ám khí: Thân pháp / 5);
  // × (1 + "Sát thương vật lý - ngoại công +%")
  const plus = (hero.ranged ? Math.floor(dex / DEX_PER_DMG) : Math.floor(str / STR_PER_DMG)) + B.dmgAdd, W = B.wdmg || BARE_HAND, k = 1 + B.dmgPct / 100;
  const res = (key, base) => base + (B.res[key] || 0) + B.resAll, RM = B.resMax || {}, cap = (key) => PLAYER_RES_MAX + (RM[key] || 0) + (RM.all || 0);
  return {
    lvl, str, dex, vit, eng,
    // sinh lực / nội lực như engine (anh 31/10 "làm theo client đi em, cho đỡ lỗi"): % (lifemax_p / manamax_p — KNpcAttribModify::LifeMaxP /
    // ManaMaxP) chỉ nhân phần gốc m_LifeMax = sinh khí gốc + điểm cộng (KPlayer::AddBaseVitality -> AddBaseLifeMax) + cấp; sinh khí của đồ
    // (ChangeCurVitality -> AddCurLifeMax) và sinh lực cộng thẳng (LifeMaxV — đồ, võ công, Trường Mệnh hoàn) cộng sau, không nhân %. Nội lực
    // cũng vậy (AddBaseManaMax / AddCurManaMax, ManaMaxV). Bản trước nhân % cả phần của đồ
    hpMax: Math.max(1, Math.floor((vitGoc * A.LifePerVitality + lvl * A.LifePerLevel) * (1 + (B.lifePct || 0) / 100)) + B.vit * A.LifePerVitality + B.life),
    mpMax: Math.max(1, Math.floor((engGoc * A.ManaPerEnergy + lvl * A.ManaPerLevel) * (1 + (B.manaPct || 0) / 100)) + B.eng * A.ManaPerEnergy + B.mana),
    stMax: A[`Stamina${f}Base`] + (lvl - 1) * A[`Stamina${f}PerLevel`] + vit * A.StaminaPerVitality + B.stamina,
    ar: Math.max(1, Math.round((dex * 4 - 28) * (1 + B.arPct / 100)) + B.ar),
    def: Math.max(0, Math.floor(dex / 4) + B.def),
    dmg: [Math.floor((W[0] + plus) * k), Math.floor((W[1] + plus) * k)],
    res: { fire: res("fire", A.fireres), cold: res("cold", A.coldres), light: res("light", A.lightingres), poison: res("poison", A.poisonres), phys: res("phys", A.physicres) },
    resCap: { fire: cap("fire"), cold: cap("cold"), light: cap("light"), poison: cap("poison"), phys: cap("phys") },
    elem: { ...B.elem }, atkSpeed: B.atkSpeed, moveSpeed: B.moveSpeed, lifeRegen: B.lifeRegen, lifeSteal: B.lifeSteal, thorns: B.thorns, luck: B.luck,
    ignoreDef: Math.min(100, B.ignoreDef),
    elemMagic: { ...(B.elemMagic || {}) }, hoanElem: { ...(B.hoanElem || {}) }, hoanMagic: { ...(B.hoanMagic || {}) }, enh: { ...(B.enh || {}) }, castSpeed: B.castSpeed || 0, crit: B.crit || 0, manaRegen: B.manaRegen || 0, manaSteal: B.manaSteal || 0,
    thornsPct: B.thornsPct || 0, rangeReturnPct: B.rangeReturnPct || 0, poisonRetPct: B.poisonRetPct || 0, phanBua: B.phanBua || 0, lifeRegenPct: B.lifeRegenPct || 0, manaShield: B.manaShield || 0 /* tổng kỹ năng + trang bị (hiện được quá 100) — world.js guard chặn hiệu lực ≤ 99 % (anh 14/11) */, noiHoThan: B.noiHoThan || 0, sorb: B.sorb || 0, vsSeries: { ...(B.vsSeries || {}) }, fromSeries: { ...(B.fromSeries || {}) },
    // chống trạng thái (quái có võ công — vocong.js giatHero / heroCham / heroChoang / heroDoc): Thời gian phục hồi, giảm thời gian làm chậm / choáng / trúng độc %
    tgph: B.tgph || 0, tglc: B.tglc || 0, tgc: B.tgc || 0, tgtd: B.tgtd || 0, boQuaDoc: B.boQuaDoc || 0, // bỏ qua độc phòng đối phương (vocong.js khangDoc — anh 17/11)
    dmg2mana: B.dmg2mana || 0, // "Chuyển hóa sát thương thành nội lực %" (World.hit)
    // dòng xanh: hút sinh lực / nội lực % (chỉ đòn ngoại công — World.land, vocong.js), "Phục hồi thể lực mỗi nửa giây" (World.updateHero)
    hutSinh: B.hutSinh || 0, hutNoi: B.hutNoi || 0, stRegen: B.stRegen || 0,
    reach: 75 * SCALE,           // tầm tay không (võ công 53: AttackRadius 75); vũ khí đổi tầm: World.weaponAtk (thương 100, ám khí 320)
    radius: 14,
  };
}

// def = quái của assets/data/monsters.json, MS = assets/data/mobstats.json, id = mã quái, reach = tầm đánh (logic),
// series = hệ của con này (0 Kim, 1 Mộc, 2 Thủy, 3 Hỏa, 4 Thổ; bỏ trống = hệ ghi trong npcs.txt)
export function mobStats(def, id, lvl, boss, reach, MS, series) {
  const M = MS.mobs[id], se = series ?? M.series, m = M.s[se], L = clamp(lvl, 1, MS.maxLevel), at = (i) => MS.pool[i][L - 1];
  let dmg = [at(m.min), at(m.max)];
  if (!dmg[0] && !dmg[1] && m.dmg) { const b = Math.max(...Object.values(m.dmg).map(at)); dmg = [b, b]; } // TẠM tới khi có võ công quái (M3)
  return {
    series: se,                                // ngũ hành: 0 Kim, 1 Mộc, 2 Thủy, 3 Hỏa, 4 Thổ
    hpMax: Math.max(1, at(m.life)), exp: at(m.exp), ar: Math.max(1, at(m.ar)), def: Math.max(0, at(m.def)), dmg,
    res: Object.fromEntries(RES_KEYS.map((k, i) => [k, Math.min(at(m.res[i]), M.resMax[i])])),
    lifeRep: at(m.lifeRep),
    reach: (reach || 75) * SCALE,
    vision: (def.vis || 400) * SCALE,          // VisionRadius
    active: 700 * SCALE,                       // ActiveRadius mặc định của bảng NPC client
    run: (def.run || 7) * 18 * SCALE,          // RunSpeed (đơn vị logic / vòng engine)
    walk: (def.run || 7) * 18 * SCALE * 0.5,
    atkGap: 5 * TICK,                          // WaitTime của võ công 53 / 418: 5 vòng giữa 2 đòn
    hitRecover: Math.min(60, M.hitRecover || def.hr || 30),
    radius: boss ? 24 : 16,
  };
}

// số khung (vòng engine) của 1 đòn / 1 lần thi pháp theo tốc độ % — như client: phần nguyên base × 100 / (100 + tốc độ), nên tốc độ chỉ
// có tác dụng khi qua mốc (bảng anh gửi 26/10, VLTK 1 Sơn Hà Xã Tắc: 0 % 18 khung, 1 % 17, 6 % 16, 13 % 15, 21 % 14 … 101 % 8, 501 % 2)
export const atkFrames = (base, spd) => Math.max(1, Math.floor((base * 100) / (100 + Math.max(-90, spd || 0))));
export const hitPercent = (ar, def) => clamp(ar + def > 0 ? (ar * 100) / (ar + def) : 50, HIT_MIN, HIT_MAX);
// sát thương vật lý sau kháng (kháng âm thì tăng sát thương như client)
const physHit = (dmg, res) => Math.max(1, Math.floor((ri(dmg[0], dmg[1]) * (100 - res)) / 100));

export function heroDamage(p, m) {
  if (Math.random() * 100 >= hitPercent(p.ar, m.def * (1 - (p.ignoreDef || 0) / 100))) return { miss: true }; // "Bỏ qua né tránh %"
  let v = physHit(p.dmg, m.res.phys), cold = 0, doc = 0;
  for (const k of ELEM_KEYS) if (p.elem && p.elem[k] > 0) {
    const x = Math.max(0, Math.floor((p.elem[k] * (100 - (m.res[k] || 0))) / 100));
    if (k === "poison") { doc = x; continue; } // độc: điểm / lần, mất dần theo nhịp (World.docDon — anh 30/10), không cộng vào đòn
    v += x; if (k === "cold") cold = x;
  }
  // võ công bị động: "Tăng sát thương đối với hệ X" (cả độc — như vocong.js serK), "Tăng tấn công chí mạng" (× 2 — TẠM)
  if (p.vsSeries && p.vsSeries[m.series]) { v = Math.floor(v * (1 + p.vsSeries[m.series] / 100)); doc = Math.floor(doc * (1 + p.vsSeries[m.series] / 100)); }
  const crit = p.crit > 0 && Math.random() * 100 < p.crit;
  // cold: phần băng sát (world.land làm chậm quái); doc: độc mỗi lần của đòn (world.land gắn lớp độc)
  return crit ? { v: v * 2, crit, cold, doc } : { v, cold, doc };
}
export function mobDamage(m, p) {
  if (Math.random() * 100 >= hitPercent(m.ar, p.def)) return { miss: true };
  return { v: physHit(m.dmg, khangThat(p.res.phys, p.resCap ? p.resCap.phys : PLAYER_RES_MAX)) };
}
// đòn của quái có võ công (bản mẫu — vocong.js misHitHero): như mobDamage nhưng trừ kháng hệ của chiêu (he: phys | cold | fire | light | poison)
export function mobDamageHe(m, p, he = "phys") {
  if (Math.random() * 100 >= hitPercent(m.ar, p.def)) return { miss: true };
  const res = p.res[he] ?? p.res.phys, cap = p.resCap ? p.resCap[he] ?? p.resCap.phys : PLAYER_RES_MAX;
  return { v: physHit(m.dmg, khangThat(res, cap)) };
}

// xưng hiệu môn phái (anh 17/11 "cái xưng hiệu có thể lấy xưng hiệu của môn phái … client có đó"): client settings\factiontitle.txt (RANKID -> chữ, cột FACTION)
// + kịch bản môn phái của client: nhập môn cấp 10 (bậc 1), nhiệm vụ cấp 10 / 20 / 30 / 40 / 50 mỗi lần lên 1 bậc (vd Thiếu Lâm 路人_玄悲 nhiệm vụ 20 -> SetRank(3)),
// xuất sư (cấp 60) -> mục 62–71, nhiệm vụ cấp 120 -> mục 72–81 (Đường Môn tmnpc07 SetRank(76) "Lục Các Trưởng Lão"). Game không có nhiệm vụ môn phái -> theo cấp:
// dưới 10 bậc 1, 10–19 bậc 2 … 50–59 bậc 6, 60–119 xuất sư, từ 120 trưởng lão. Chữ client viết hoa đầu từ (font TCVN3 không có hoa có dấu: "Vô ảnh" -> "Vô Ảnh");
// 2 chữ client hỏng: "Làng D" (Đường Môn bậc 2, cụt) -> "Gia Đinh" (家丁 — tạm, chờ anh xem), "Co Độc Tôn Giả" -> "Cổ Độc Tôn Giả". Không môn phái: mục 61
export const XUNG_HIEU = {
  shaolin: ["Tảo Địa Tăng", "Hộ Viện Võ Tăng", "Hộ Tự Kim Cang", "Hộ Pháp La Hán", "Truyền Kinh La Hán", "Phục Ma Thiên Vương", "Vô Lượng Giải Tôn", "Hộ Pháp Trưởng Lão"],
  wudang: ["Đạo Đồng", "Nhàn Tản Đạo Sư", "Thanh Tu Đạo Sư", "Tuần Sơn Đạo Nhân", "Nhập Quan Đạo Nhân", "Chưởng Kinh Đạo Nhân", "Huyền Võ Thần Thị", "Huyền Võ Chân Nhân"],
  emei: ["Bố Y Ni", "Vũ Y Ni", "Cẩm Y Ni", "Bạch Liên Tiên Tử", "Thanh Liên Tiên Tử", "Tản Hoa Thiên Nữ", "Kim Đỉnh Thánh Nữ", "Thánh Nữ"],
  kunlun: ["Phất Trần Đệ Tử", "Phụng Kiếm Đệ Tử", "Tử Vi Hộ Pháp", "Thái Vi Hộ Pháp", "Thiên Vi Hộ Pháp", "Thụ Phù Thiên Tướng", "Tiên Phù Chân Quân", "Hộ Phái Chân Quân"],
  tangmen: ["Tạp Dịch", "Gia Đinh", "Hộ Viện", "Giới Tiền Hộ Vệ", "Nhập Các Đệ Tử", "Tỷ Lão Môn Nhân", "Thiên Thủ Thần Vệ", "Lục Các Trưởng Lão"],
  cuiyan: ["Hoa Tì", "Tam Phẩm Hoa Sứ", "Nhị Phẩm Hoa Sứ", "Nhất Phẩm Hoa Sứ", "Hoa Tiên", "Hoa Tinh", "Hoa Thần", "Hoa Thần Sứ"],
  gaibang: ["Vô Đại Đệ Tử", "Chấp Đại Đệ Tử", "Chấp Bát Đệ Tử", "Chấp Bổng Đệ Tử", "Long Đầu", "Đại Long Đầu", "Tiêu Dao Thần Cái", "Cửu Đại Trưởng Lão"],
  tianwang: ["Thị Vệ", "Thị Vệ Trưởng", "Thủ Trại Hãn Tướng", "Chưởng Đá Đầu Lĩnh", "Thủy Đạo Thống Lĩnh", "Hộ Đảo Tướng Quân", "Kình Thiên Nguyên Soái", "Trấn Bang Nguyên Soái"],
  wudu: ["Ngũ Độc Đồng Tử", "Đoạt Hồn Tản Nhân", "Thôi Mệnh Sứ Giả", "Hắc Ám Diêm La", "Vô Động La Sát", "Cổ Độc Tôn Giả", "U Minh Quỷ Sứ", "U Minh Quỷ Vương"],
  tianren: ["Sát Thủ", "Vô Ảnh Sát Thủ", "Tử Sĩ", "U Minh Tử Sĩ", "Chưởng Kỳ Sứ", "Hộ Giáo Sứ", "Tát Mãn Pháp Vương", "Thánh Giáo Trưởng Lão"],
};
export function xungHieu(key, lvl) {
  const L = key && XUNG_HIEU[key]; if (!L) return "Vô Danh Tiểu Bối";
  const c = lvl | 0;
  return c >= 120 ? L[7] : c >= 60 ? L[6] : L[Math.max(0, Math.min(5, Math.floor(c / 10)))];
}
