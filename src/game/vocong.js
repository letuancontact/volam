// Võ công trong trận (anh duyệt 25/10: làm tới chiêu 120, 150 đợt sau; hình theo client, client thiếu file thì để trống như game thật).
// Dữ liệu: assets/web/vocong/vocong.json (cong-cu/dung-vo-cong.mjs — skills.txt, missles.txt, 状态图形对照表.txt của client; hình .spr
// gốc, trình duyệt tự giải từng khung) + chỉ số theo cấp của assets/web/skill/skills.json (P.skillDb — script Lua của client).
//
// Cách chạy (dựng lại theo cột dữ liệu client; engine máy chủ đã mã hóa nên phần ghi TẠM là em suy ra, đo rồi chỉnh):
//   - Kiểu chiêu (SkillStyle): 0 bắn đạn · 1 cận chiến nhiều đòn (gọi chiêu con num lần, cách genData vòng) · 2 bùa / vòng sáng · 3 bị
//     động. BaseSkill 0 = chiêu "vỏ": gọi chiêu con (ChildSkillId) ở cấp ChildSkillLevel (−1 = cấp chiêu cha).
//   - Kiểu bắn (MisslesForm): 0 tường (hàng ngang vuông góc hướng bắn) · 1 thẳng · 2 tỏa quạt · 3 vòng tròn quanh điểm phát · 4 ngẫu
//     nhiên · 5 rải trong vùng · 6 tại mục tiêu · 7 tại người ra chiêu. Cách ra (MslsGenerate): 2 = lần lượt, mỗi đạn cách genData vòng.
//   - Đạn (missles.txt): MoveKind 0 đứng yên · 1 bay thẳng · 5 bám mục tiêu · 7 ném vòng cung · 100 bay đi rồi quay về; Speed (điểm /
//     vòng), LifeTime (vòng); CollidRange / DmgRange tính theo ô 32 điểm (TẠM); IsRangeDmg = trúng thì sát thương cả vùng; ColVanish =
//     trúng là mất (không thì xuyên, mỗi con trúng lại sau DmgInterval vòng); đạn đứng yên có sát thương vùng: nổ lúc ra + mỗi
//     DmgInterval vòng; AutoExplode = bay hết giờ chưa trúng thì nổ vùng. Hình: AnimFile1 chờ · 2 bay · 3 tan · 4 trúng (B = lớp 2).
//   - Sự kiện: Start (lúc ra đạn), Fly (mỗi skill_flyevent p2 vòng khi bay), Collide (khi trúng), Vanished (khi tan) gọi chiêu khác ở cấp
//     skill_eventskilllevel.
//   - Sát thương (TẠM — công thức engine không có): chiêu có "Sát thương vật lý X%" = sát thương vũ khí (+ Sức mạnh / 5, × % ngoại công
//     của đồ + bị động) × (1 + X %) + sát thương vật lý điểm; băng / hỏa / lôi sát của chiêu + "… ngoại công" (đồ, bị động — chiêu
//     ngoại công) hoặc "… nội công" (bị động — chiêu nội công); mỗi phần trừ theo kháng hệ đó của quái. Độc sát = mất máu theo thời
//     gian. Nhân: × (1 + "Hỗ trợ từ các kỹ năng khác" — addskilldamage của chiêu đã học trỏ tới chiêu này) × (1 ± ngũ hành tương khắc
//     seriesdamage_p: + khi hệ chiêu khắc hệ quái, − khi hệ quái khắc hệ chiêu — anh 26/10) + "Tăng sát thương đối với hệ X". Chí mạng (deadlystrike_p + "Tăng tấn công chí mạng") × 2. Chiêu có
//     IsUseAR (ngoại công cận chiến) xét chính xác / né như đòn thường; còn lại luôn trúng.
//   - Băng sát làm chậm quái 1 giây × (1 + "Thời gian đóng băng %") (TẠM), choáng theo stun_p [tỉ lệ, số vòng], độc [điểm, số vòng, mỗi
//     n vòng]. Bùa hại (Côn Lôn phù, Ngũ Độc, Thiên Nhẫn…): dòng âm gắn lên quái trong p2 vòng (giảm kháng / né / tốc độ, hút máu…).
//   - Bùa lợi: dòng của chiêu gắn lên mình trong p2 vòng (dài nhất các dòng); vòng sáng: chiêu đặt ở ô tay phải là vòng sáng đang bật
//     (như client — LRSkill 2: bùa / vòng sáng chỉ đặt ô phải -> mỗi lúc 1 vòng sáng), không tốn nội lực, không hết giờ.
//   const VC = await VoCongPack.load(); installVoCong(World)   (World.prototype thêm: useSkill, castSelf, vcUpdate, vcDraw…)

import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import { openSpr } from "../jx/spr.js";
import { laBoss as laBossVc } from "./auto.js"; // đánh boss phải ở gần (anh 16/11 — bùa hại lên boss: misHit)
import { hitPercent, atkFrames, LUYEN, mobDamageHe, khangThat, ccCong, capCong, skCong, ccTrang } from "./rules.js"; // ccCong / capCong / skCong / ccTrang: +cấp kỹ năng Báo Đáp Ân Sư (anh 16/11)

const BASE = "assets/web/vocong/";
const TICK = 1 / 18, SCALE = 0.75;
const CELL = 32 * SCALE;                 // 1 ô bản đồ client (m_nCellWidth / m_nCellHeight = 32 đơn vị) — đơn vị của CollidRange / DmgRange
// quái mà ô của nó cách ô (x, y) không quá n ô theo cả 2 chiều — engine dò ô vuông quanh đạn (KMissle::CheckCollision / ProcessCollision)
const inCells = (x, y, e, n) => { const h = (n + 0.5) * CELL; return Math.abs(e.x - x) <= h && Math.abs(e.y - y) * 2 <= h; };
// vùng nổ (anh 27/10: "chiêu AOE quái đứng khá gần mà không mất máu, gần như đánh đơn"): engine ProcessCollision dò ±DmgRange/2 ô quanh
// tâm — DmgRange 3 chỉ 3 × 3 ô (±36 điểm), nhỏ hơn hình nổ (Phong Sương Toái Ảnh hình ±70). Client quái không đẩy nhau, dồn cục vào người
// chơi nên vùng nhỏ vẫn trúng cả đám; ở đây quái giữ khoảng cách (World.separate), đứng vòng quanh ở tầm đánh, bãi sinh thưa -> nới:
// ±DmgRange ô (tối đa VUNG_MAX ô — chiêu vùng lớn hơn giữ cỡ engine), tính tới mép thân quái (m.radius)
const VUNG_MAX = 6;
const VD_120 = 716; // Võ Đang Xuất Ứ Bất Nhiễm (buaVungDoi)
// anh 18/11 ("cho côn lôn buff bùa lợi trong viêm đế vượt ải cho đồng đội — nếu thiếu lâm buff bất động minh vương thì tổ đội cũng dc"): ở bãi Vượt Ải / Viêm Đế (World.buaVungAi —
// main.js) tự dùng các bùa lợi này lên mình thì đồng đội trong vùng quanh mình (10 ô — buaVungDoi) cũng nhận, như Võ Đang 120. Côn Lôn: 171 Thanh Phong phù, 173 Thiên Thanh
// Địa Trọc, 178 Nhất Khí Tam Thanh; Thiếu Lâm: 15 Bất Động Minh Vương. Máy chủ chỉ nhận danh sách đồng đội của các chiêu này ở 2 bãi đó (may-chu/to-doi.js BUA_VUNG_AI)
export const BUA_VUNG_AI = new Set([15, 171, 173, 178]); // world.js buaDoi: ở Vượt Ải / Viêm Đế không dùng riêng lên từng đồng đội (anh 18/11)
const DOC_TOI_DA = 1080; // độc lên mình tối đa 1080 khung (60 giây — tkbot.js DOC_MAX, may-chu/tong-kim.js) kể cả khi bị bùa kéo dài thời gian trúng độc (heroDoc)
// Tống Kim (anh 06/11 "giật 3–9 fps"; đo lần 4: ẩn hiệu ứng FPS 34 -> 58): tối đa 20 hình đạn / trúng của bot, quân, người khác mỗi khung (gần mình trước);
// bùa / vòng sáng bot xa > 420 không vẽ
// anh 06/11 lần 6 ("có thể ẩn những skill ở xa người chơi quá, cái này không vấn đề" — 10 bot / phe, muốn ổn định 50–60): hình chiêu của bot / quân / người khác
// xa mình hơn TK_FX_XA không vẽ
const TK_FX = 20, TK_BUA_XA = 420, TK_FX_XA = 650;
const vungO = (dmgR) => { const r = Math.max(1, dmgR || 1); return Math.max(Math.floor(r / 2), Math.min(r, VUNG_MAX)); };
const inVung = (x, y, e, n) => { const h = (n + 0.5) * CELL + (e.radius || 0); return Math.abs(e.x - x) <= h && Math.abs(e.y - y) * 2 <= h; };
const SLOW_T = 18, SLOW_K = 0.5;         // băng sát: chậm 50 % trong 18 vòng (1 giây) × (1 + coldenhance %) — TẠM (quái có võ công bật: khungCham như engine)
const CHAM_MIN = 60;                     // băng sát làm chậm ít nhất 60 vòng (engine defNORMAL_COLD_TIME — 3,3 giây) — khungCham
const HURT_T = 12 * TICK;                // động tác bị đánh của nhân vật (world.js DUR.hurt) — giật lúc quái có võ công (giatHero)
const WEAPON_MSG = "Vũ khí mà bạn trang bị không phù hợp với loại võ công mà bạn hiện đang sử dụng"; // client stringtable_core G_SkillList_1
// cột HorseLimited của skills.txt (s.horse): 1 = cưỡi ngựa không dùng được, 2 = phải cưỡi ngựa mới dùng được — câu báo G_SkillList_2 / 3
const HORSE_MSG = ["", "Võ công mà bạn sử dụng hiện giờ không thể cỡi ngựa!", "Võ công mà bạn hiện đang sử dụng cần phải cỡi ngựa!"];
const TURN = (Math.PI * 2) / 32;        // đạn bám mục tiêu (MoveKind 5) quay tối đa 1/32 vòng mỗi vòng engine — TẠM
const TRAP_MAX = 5, TRAP_LIFE = 180;     // bẫy: tối đa 5 cái mỗi loại (TẠM), đạn đứng yên trúng là mất sống ≥ 10 giây mới tính là bẫy
const AURA_T = 18;                       // vòng sáng đánh địch: phát chiêu con mỗi 18 vòng (1 giây — TẠM)
// tầm vòng sáng đánh địch (anh 01/11: Vô Hình Độc tăng phạm vi 30 % -> × 1,3; anh 13/11 lượt 86 "giảm vòng vô hình độc xuống 20% phạm vi" -> 1,3 × 0,8 = × 1,04 tầm client)
const VONG_TAM = 1.04;
// độ cao hiện tại của đạn (điểm): đạn rơi theo m.fall, ném vòng cung cộng m.z — hình nổ / trúng / tan vẽ ở độ cao này như client
// (KMissle::CreateSpecialEffect(…, m_nCurrentMapZ)); bản trước vẽ ở độ cao gốc -> băng Vũ Đả, thiên thạch nổ lơ lửng trên trời (anh 26/10)
const zNow = (m) => (m.fall ? Math.max(0, m.fall.h) : (m.d.h || 0) + (m.z || 0));
const FALL_COL_H = 20;                   // đạn rơi chỉ va chạm khi đã xuống ≤ 20 điểm (engine MISSLE_MAX_COLLISION_ZHEIGHT)
const ORBIT_W = (Math.PI * 2) / 64;       // đạn bay vòng (MoveKind 3): engine quay 1 hướng / vòng trên 64 hướng (KMissle MISSLE_MMK_Circle)
const RETARGET_R = 300 * SCALE;          // đạn bám mục tiêu mất mục tiêu: tìm con khác trong bán kính này (TẠM)
export const ANIM = { 9: "Attack1", 10: "Attack2", 11: "Magic" };
// vòng sáng của tài khoản quản trị (anh 31/10 khuya, mẫu A): hình danh hiệu Võ lâm liên đấu Quán quân (settings\playertitle.txt SpeicalGraphic 84
// = hình trạng thái 84 "武林大会光环4" — vocong.json st, cong-cu/dung-vo-cong.mjs); tên vàng kim: world.js QT_MAU
// vầng trăng trên đầu của Nhất Kỷ Càn Khôn Phù / Càn khôn song tuyệt Bội (anh 16/11 — client gắn trạng thái 979 Hồng Nguyệt / 980 Lam Nguyệt, chỉ là hình):
// [bit rules.js ccTrang, hình trạng thái] — 160 红月 \spr\skill\zhongqiu\zq_sl_003.spr, 161 蓝月 lanyue.spr (cong-cu/dung-vo-cong.mjs). Mình: hero.ccKn; người khác: cờ cc
const TRANG_CC = [[1, 160], [2, 161]];
const QT_VONG = 84; // CharAnimId -> động tác (bảng hình npc: 9 đánh 1, 10 đánh 2, 11 thi pháp)
export const CAST_T = 18;                // AttackFrame / CastFrame của client (settings/npc/player/basevalue.ini): 18 vòng
const HIT_AT = 0.55;                     // ra đòn ở 55 % động tác (như world.js)
const TV_SLOW = 1.25;                    // Thiên Vương đánh nhiều đòn chậm lại 20 % (anh 26/10: "tốc độ đánh của Thiên Vương quá nhanh, giảm 20 %")
const DASH_V = 31;                       // chạy tới đánh (Đoạn Hồn Thích): tốc độ chạy + 50, engine ServeMove chặn ở 31 đơn vị / vòng (dưới 1 ô)
const GHOST_T = 0.3;                     // bóng mờ khi lướt sống 0,3 giây
const KHAC = [1, 4, 3, 0, 2];            // hệ khắc: Kim -> Mộc, Mộc -> Thổ, Thủy -> Hỏa, Hỏa -> Kim, Thổ -> Thủy (0 Kim 1 Mộc 2 Thủy 3 Hỏa 4 Thổ)
const SERIES = ["metal", "wood", "water", "fire", "earth"];
const EV_KEY = { start: "skill_startevent", fly: "skill_flyevent", collide: "skill_collideevent", vanish: "skill_vanishedevent" };
const ELEM = { colddamage_v: "cold", firedamage_v: "fire", lightingdamage_v: "light" };
const DMG = /^(physicsenhance_p|physicsdamage_v|colddamage_v|firedamage_v|lightingdamage_v|poisondamage_v|magicdamage_v)$/;

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => (b > a ? a + Math.floor(Math.random() * (b - a + 1)) : a);
const mkCanvas = (w, h) => (typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h }));
// hướng trong n hướng theo véc-tơ logic (dx, dy đã × 2): 0 = xuống, theo chiều kim đồng hồ (giống src/dir.js, fx.js)
const dirN = (dx, dy, n) => (Math.round(Math.atan2(-dx, dy) / ((Math.PI * 2) / n)) % n + n) % n;
// Chỉnh riêng đạn của bản mình (anh duyệt), đè lên missles.txt client lúc tải:
// Nghiệp Hỏa Phàn Thành (đạn 170 — bãi lửa tầng 2 của Thiên Nhẫn Thiên Ngoại Lưu Tinh): client MoveKind 1 tốc 2 -> bãi lửa trôi 66 đơn vị
// theo hướng thiên thạch trong 33 vòng; anh 26/10 "lửa tự di chuyển, cố định nó" -> đứng yên tại chỗ thiên thạch nổ, đốt vùng ±2 ô mỗi 3 vòng
const SUA_DAN = { 170: { move: 0, speed: 0 } };
// Số lần nổ của chiêu theo cấp (chỉnh riêng của bản mình): hết đạn thì ra lại chiêu đó tại chỗ cho đủ số lần. Nghiệp Hỏa Phàn Thành (bãi
// lửa tầng 2 của Thiên Ngoại Lưu Tinh, cấp theo chiêu cha): từ cấp 16 nổ thêm 1 lần nữa tại chỗ (anh 26/10 "bãi lửa thứ 2 chính là Nghiệp
// Hỏa Phàn Thành, nó nổ thêm 1 lần nữa"). Ô xem chiêu ghi "Số lần nổ"
export const LAP_LAI = { 363: (lv) => (lv >= 16 ? 2 : 1) };
// Giới hạn đòn mỗi mục tiêu mỗi lần ra chiêu (chỉnh riêng của bản mình — anh 11/11 chốt 11 / 13; người chơi góp ý nội công quá mạnh): khóa = chiêu gốc
// (src.root), số = mỗi con chịu tối đa bao nhiêu đòn của MỖI tầng chiêu (mã chiêu của đạn — chiêu gốc / chiêu sự kiện) trong 1 lần ra chiêu. Vùng trúng giữ
// nguyên (inCells / vungO / misArea, chỗ bật đòn nổ, LAP_LAI, SUA_DAN). Lôi Động Cửu Thiên: lưới 4 × 4 = 16 tia + 16 Bình Địa Hám Lôi, 1 con đứng giữa ăn đủ
// 32 đòn (engine KMissle::ProcessCollision ±DmgRange/2 ô tại ô tia + chiêu va chạm bật tại chỗ tia: ~9 + 9) -> 11 + 11. Thiên Ngoại Lưu Tinh: 2 bãi lửa
// Nghiệp Hỏa (LAP_LAI) ~18 đòn lửa (client 1 bãi ~10) -> 13. Đo 11/11 (cấp 150, không đồ, mọi chiêu tối đa, 1 cọc, 20 giây): 272k -> 186k, 229k -> 169k;
// 9 con đứng gần: 531k -> 402k, 2,04 -> 1,50 triệu. Đòn bị chặn vẫn tính 1 lượt luyện kỹ năng (luyenKyNang.heSoChieu chỉnh theo số đòn cũ). Sổ đếm
// src.luot tạo ở emit lúc ra chiêu gốc, truyền xuống chiêu con như once; đòn quái (o.who), cú lướt / vòng sáng (dashHit, vcUpdate) không có sổ
export const GIOI_HAN_DON = { 375: 11, 362: 13 };
// đạn bay xuyên chỉ trúng mỗi mục tiêu 1 lần dù client ghi DmgInterval (anh 17/11 "thiếu lâm mạnh có phải là lỗi sát thương quá nhiều lần trong 1 đòn chém"): Vô Tướng
// Trảm (321 — Thiếu Lâm đao 90) đạn 136 DmgInterval 1 khung — engine KMissle::ProcessCollision tính lại mọi con trong vùng mỗi khung -> 1 đạo đao lướt qua người trúng
// ~3 lần, 2 đạo ~6 lần / chém (chiêu bay xuyên khác của các phái đều 4 khung, ~1 lần). Theo chiêu gốc (src.root): mỗi đạo đao trúng mỗi con 1 lần = tối đa 2 lần / chém
export const MOT_LAN_DAN = new Set([321]);
// chiêu hiệu ứng của vật phẩm (anh 03/11 — Pháo Hoa 251, Hoa hồng 285; magicscript cột kỹ năng): chỉ vẽ — hieuUng
const VAT_HIEU_UNG = new Set([251, 285]);

export class VoCongPack {
  static async load(base = BASE) {
    const r = await fetch(base + "vocong.json");
    if (!r.ok) throw new Error("Không đọc được vocong.json");
    return new VoCongPack(base, await r.json());
  }
  constructor(base, M) {
    this.base = base; this.M = M; this.files = new Map();
    for (const [id, r] of Object.entries(SUA_DAN)) if (M.mi && M.mi[id]) Object.assign(M.mi[id], r);
  }
  sk(id) { return this.M.sk[id] || null; }
  mi(id) { return this.M.mi[id] || null; }
  st(id) { return this.M.st[id] || null; }
  // hình k: tải + mở lần đầu dùng (khung giải khi vẽ); null khi chưa tải xong / lỗi
  spr(k) {
    if (!k || !this.M.spr[k]) return null;
    let e = this.files.get(k);
    if (!e) {
      e = { o: null, fr: [] }; this.files.set(k, e);
      fetch(this.base + "spr/" + k + ".spr").then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
        .then((ab) => { e.o = openSpr(ab); }).catch(() => { e.bad = true; });
    }
    return e.o ? e : null;
  }
  frames(k) { const e = this.spr(k); return e ? e.o.h.frames : 0; }
  frame(k, i) {
    const e = this.spr(k); if (!e) return null;
    const n = e.o.h.frames; if (!n) return null;
    i = ((i % n) + n) % n;
    let f = e.fr[i];
    if (!f) {
      const d = e.o.frame(i), cv = d.w && d.h ? mkCanvas(d.w, d.h) : null;
      if (cv) cv.getContext("2d").putImageData(new ImageData(d.rgba, d.w, d.h), 0, 0);
      f = e.fr[i] = { cv, w: d.w, h: d.h, ox: d.ox, oy: d.oy };
    }
    return f;
  }
  // vẽ khung i của hình k: điểm neo (cx, cy) của file đặt vào (x, y), nâng h (đơn vị client)
  draw(ctx, k, i, x, y, h = 0, alpha = 1, to = 1) {
    const f = this.frame(k, i); if (!f || !f.cv) return;
    const m = this.M.spr[k], s = (this.M.scale || SCALE) * to; // to: phóng hình (vòng Vô Hình Độc dưới chân siêu boss — bosstg.js vongVhd)
    let cx = m.cx, cy = m.cy;
    if (!cx && !cy) { cx = m.w / 2; cy = m.h * 0.6; } // file không ghi điểm neo (vd mag_bz_bin1 爆炸效果): giữa ngang, 60 % dọc — TẠM
    const pa = ctx.globalAlpha, pc = ctx.globalCompositeOperation;
    if (alpha !== 1) ctx.globalAlpha = pa * alpha;
    if (m.blend === "add") ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(f.cv, Math.round(x + (f.ox - cx) * s), Math.round(y + (f.oy - cy - h) * s), Math.round(f.w * s), Math.round(f.h * s));
    ctx.globalAlpha = pa; ctx.globalCompositeOperation = pc;
  }
  sound(k) { const f = k && this.M.snd[k]; return f ? "../vocong/snd/" + f : null; } // GameAudio.play tính từ assets/web/sound/
  // nạp sẵn hình của chiêu id (vận công, đạn, chiêu con / sự kiện, hình trạng thái) — lúc chọn chiêu, để lần ra chiêu đầu có hình
  warm(id, seen = new Set()) {
    const k = this.sk(id); if (!k || seen.has(id)) return; seen.add(id);
    this.spr(k.pre);
    const st = this.st(k.state); if (st) this.spr(st.spr);
    const d = k.mis && this.mi(k.mis);
    if (d) for (const a of [...d.a, ...d.b]) if (a) this.spr(a.spr);
    if (k.kid) this.warm(k.kid, seen);
    for (const v of Object.values(k.ev || {})) this.warm(v, seen);
  }
}

// ---------- dữ liệu chiêu ----------
// Chỉnh riêng của bản mình (anh duyệt), đè lên bảng chiêu client lúc tải (main.js) — ô xem chiêu và chỉ số cùng theo:
// [ĐÃ BỎ 17/11 — anh: lấy theo client] Ngũ Độc Kỳ Kinh (75 — trấn phái, anh 26/10: "tăng max mà tốc đánh nội công cao ác"): client cho nội công castspeed_v 1 → 59 (cấp 30) CỘNG
// thêm +32 % nội + 32 % ngoại "(Dương)" từ cấp 1 -> bỏ 3 dòng đó, thay bằng tốc đánh tăng đều theo cấp: anh 28/10 lần 3 cấp 30 (tối đa) ngoại
// công 21, nội công 21 (26/10: 40 / 30)
// Vô Hình Độc (69 + chiêu con 203 làm việc thật, anh 26/10): làm chậm client −10 → −42 % (cấp 20) -> thu theo tỉ lệ còn −20 % ở cấp 20
// (cấp 1 −5 %), giữ thời gian 2 giây
const VHD = { doi: { fastwalkrun_p: (p) => [Math.round((p[0] * 20) / 42), p[1], p[2]] } };
// Bách Độc Xuyên Tâm (384, anh 26/10 "đứng xa đánh không ăn"): đạn 190 bay vòng QUANH NGƯỜI (MoveKind 3, Param2 = 0 — engine
// MISSLE_MMK_Circle, bán kính Param3 64) + va chạm ±3 ô -> chỉ trúng quái trong ~176 quanh mình (cột AttackRadius client ghi 180), mà
// script cấp cho tầm 352 → 451 nên nhân vật đứng xa ra chiêu trượt -> tầm = 176 mọi cấp (ô xem chiêu cũng ghi 176)
const BDXT = 64 + 3.5 * 32;
// Đại Thừa Như Lai Chú (709 — Thiếu Lâm 120) bị đánh thì tự phát Sư Tử Hống: client shaolin.lua ghi {1, 10*18*256+0}, {25, 4*18*256+0} (hồi 10 → 4 giây,
// tỉ lệ +0), nội suy theo cấp làm byte tỉ lệ = 0 ở cấp lẻ (không bao giờ phát — engine GetRandomNumber(0,100) < tỉ lệ) và 128 ở cấp chẵn (luôn phát).
// Anh 10/11: "các cấp đều có tác dụng" -> mọi cấp tỉ lệ 100 % (bị đánh là phát nếu hết hồi), giữ thời gian hồi theo cấp của client; ô xem chiêu ghi 100 %
const DTNLC = { doi: { autoreplyskill: (p) => [p[0], p[1], p[2] - (p[2] & 0xff) + 100] } };
// Nộ Lôi Chỉ (153 — Võ Đang 10): anh 11/11 "vẫn gây 1 sát thương, em xem lại chứ không ổn cho người mới". Client lightingdamage_v 1–1 (cấp 1) …
// 5–75 (cấp 20), sức đánh Võ Đang dồn vào bị động Võ Đang quyền pháp (người mới không biết cộng -> mỗi đòn 1 điểm, ~159 đòn / con quái Hoa Sơn;
// chiêu tương ứng Cuồng Lôi Chấn Địa của Côn Lôn cấp 1 có 27). Chỉnh riêng: mỗi cấp chiêu cộng thêm 8 × cấp + 12 lôi sát, dừng ở +132 từ cấp 15
// (cấp cao giữ gần client — Võ Đang vốn mạnh nhất từ cấp chiêu 16): cấp 1 = 21–21, cấp 10 = 94–128, cấp 15 = 135–187, cấp 20 = 137–207
const NLC = { doi: { lightingdamage_v: (p, i) => { const c = 20 + 8 * Math.min(i, 14); return [p[0] + c, p[1], p[2] + c]; } } };
const SUA = {
  153: NLC,
  // 75 Ngũ Độc Kỳ Kinh: anh 17/11 "trấn phái ngũ độc lấy theo client, khôi phục tốc đánh" — số client: nội công castspeed_v 2 × cấp − 1 (1 → 59 ở cấp 30) + castspeed_yan_v
  // 32 + attackspeed_yan_v 32; anh 17/11 tối "cho tốc đánh nội công và ngoại công về mức 50 - 50": giữ 2 dòng 32 (Dương), phần tăng theo cấp cả nội lẫn ngoại 1 → 18
  // (cấp 1 / 10 / 20 / 30 = 33 / 38 / 44 / 50)
  75: { bo: ["castspeed_v"], them: { castspeed_v: (lv) => Math.round((lv * 18) / 30), attackspeed_v: (lv) => Math.round((lv * 18) / 30) } },
  709: DTNLC,
  69: VHD, 203: VHD,
  384: { doi: { skill_attackradius: (p) => [Math.min(p[0], BDXT), p[1], p[2]] } },
  // 375 Lôi Động Cửu Thiên (Côn Lôn 90): anh 17/11 "cho lôi động cửu thiên có thêm 3% làm chóag khi ở cấp 20" — client không có dòng choáng; thêm stun_p 3 % /
  // 20 khung (như Cuồng Phong Sậu Điện, Thiên Lôi Chấn Nhạc) từ cấp 20 trở lên, dưới 20 không có (dòng 0 — ô xem chiêu không hiện)
  375: { moi: { stun_p: (lv) => (lv >= 20 ? [3, 20, 0] : [0, 0, 0]) } },
};
// Khinh công (anh 10/11 — client settings\skills.txt 210, script\skill\special\轻功.lua): SkillStyle 1 kiểu Melee_Jump, tầm 400, 50 thể lực, chỉ tay phải (LRSkill 2), cấm cưỡi ngựa, trong
// thành dùng được; ai đã vào phái đều có (script\global\skills_table.lua AddMagic(210)) nên không nằm trong hero.skills, không tốn điểm. Cách nhảy: World.khinhCong (world.js)
export const KC_ID = 210, KC_PHI = 50;
const KHINH_CONG = { id: KC_ID, n: "Khinh công", prop: "", desc: "Tung mình tới chỗ chỉ định, tốn thể lực. Không dùng được khi đang cưỡi ngựa.", series: -1, req: 1, max: 1, style: 1, attrib: 0, eqt: -2, horse: 1, melee: 0, phys: 0, aura: 0, radius: 400, anim: 13, wait: 0, target: { enemy: 0, ally: 0, self: 0, only: 0 }, missileN: 0, missileLevel: -1, base: 0, exp: 0, cost: { type: 1, v: KC_PHI }, state: 0, sub: { child: 0, start: 0, fly: 0, collide: 0, vanish: 0 }, script: "", lv: { skill_cost_v: [[KC_PHI, 0, 0]] }, lvKeys: ["skill_cost_v"] };
// Ngự Tuyết Ẩn (Thúy Yên 120 — anh 12/11 "tàng hình của thúy yên 120 có thể dùng khi lên ngựa"): bỏ cờ cấm cưỡi ngựa của dữ liệu client (horse 1)
export const NGU_TUYET_AN = 713;
export function suaVoCong(db) {
  if (db) db[KC_ID] = KHINH_CONG;
  if (db && db[NGU_TUYET_AN]) db[NGU_TUYET_AN].horse = 0;
  for (const [id, r] of Object.entries(SUA)) {
    const s = db && db[id]; if (!s || !s.lv) continue;
    for (const [k, f] of Object.entries(r.doi || {})) if (s.lv[k]) s.lv[k] = s.lv[k].map(f);
    // dòng mới thêm cuối (moi: { tên: (cấp) => [p1, p2, p3] }) — chiêu client không có dòng đó (375 thêm choáng)
    if (r.moi) { const n = Math.max(...Object.values(s.lv).map((a) => a.length)); for (const [t, f] of Object.entries(r.moi)) { s.lv[t] = Array.from({ length: n }, (_, i) => f(i + 1)); if (Array.isArray(s.lvKeys) && !s.lvKeys.includes(t)) s.lvKeys.push(t); } }
    if (!r.bo) continue;
    // dòng mới đặt vào chỗ dòng bỏ đầu tiên (giữ thứ tự dòng trong ô xem chiêu)
    const n = Math.max(...Object.values(s.lv).map((a) => a.length)), lv = {};
    let them = false;
    for (const [k, a] of Object.entries(s.lv)) {
      if (!r.bo.includes(k)) { lv[k] = a; continue; }
      if (them) continue;
      them = true;
      for (const [t, f] of Object.entries(r.them)) lv[t] = Array.from({ length: n }, (_, i) => [f(i + 1), 0, 0]);
    }
    s.lv = lv;
  }
  return db;
}
// dòng thuộc tính của chiêu s ở cấp lv: { tên: [p1, p2, p3] } (cấp quá bảng: dòng cuối)
export function lvAttrs(s, lv) {
  const o = {}; if (!s || !s.lv || lv < 1) return o;
  for (const [k, a] of Object.entries(s.lv)) { const v = a[Math.min(a.length, lv) - 1]; if (v) o[k] = v; }
  return o;
}
const hasDmg = (s, db, seen = new Set()) => {
  if (!s || seen.has(s.id)) return false; seen.add(s.id);
  return Object.keys(s.lv || {}).some((k) => DMG.test(k)) || (s.sub && s.sub.child && hasDmg(db[s.sub.child], db, seen));
};
// loại chiêu: attack (tấn công) | curse (bùa hại: đánh địch mà không có dòng sát thương) | buff (bùa lợi / lên mình — kể cả chiêu
// đạn lên mình như Bất Động Minh Vương, Từ Hàng Phổ Độ, Thanh Phong phù) | aura (vòng sáng) | passive (bị động)
// client ghi kiểu 3 (bị động) mà tốn nội lực + dòng có thời hạn (p2 > 0): thật ra là bùa dùng lên mình (Côn Lôn: Thiên Thanh Địa Trọc,
// Nhất Khí Tam Thanh — bản đầu cộng vĩnh viễn như bị động, vd +215 % sát thương)
export const timedBuff = (s) => !!(s && s.style === 3 && s.lv && s.lv.skill_cost_v && Object.entries(s.lv).some(([k, a]) => !/^(skill_|addskill)/.test(k) && a[0] && a[0][1] > 0));
export function kindOf(s, db) {
  if (!s) return null;
  if (s.id === KC_ID) return "jump";
  if (s.aura) return "aura";
  if (s.style === 3) return timedBuff(s) ? "buff" : "passive";
  // di hình (kiểu 1 không nhắm địch — Đường Môn Mê Ảnh Tung): đặt được ô T / P / ô dùng nhanh, ra vào điểm (anh 26/10: bản đầu "khác" nên
  // không đặt được ô P)
  if (s.style === 1 && !s.target.enemy) return "move";
  if (!s.target.enemy) return s.style === 2 || s.style === 0 ? "buff" : "other";
  return hasDmg(s, db) ? "attack" : "curse";
}
// loại vũ khí đang cầm cho EqtLimit: −1 tay không (cả triền thủ — vũ khí quyền), 0 kiếm, 1 đao, 2 côn, 3 thương, 4 chùy, 5 song đao,
// 100 + n ám khí (phi tiêu / phi đao / tụ tiễn) — itemdb.js weaponKind
export const eqtOk = (s, wk) => s.eqt == null || s.eqt === -2 || s.eqt === wk;

// ---------- chỉ số cộng từ bị động / bùa / vòng sáng (B của rules.heroStats) ----------
const RES = { physicsres: "phys", coldres: "cold", fireres: "fire", poisonres: "poison", lightingres: "light" };
// hoan (anh 17/11 "các loại hoàn nội công chỉ tác dụng với đúng phái dùng nó … áp dụng cho cả hoàn thường và hoàn tống kim"): dòng sát thương hệ của
// HOÀN (Nội / Ngoại … hoàn, Kỳ Trân Các + Tống Kim — world.js bonus) để riêng B.hoanElem (ngoại công) / B.hoanMagic (nội công, cả vật lý nội) — chỉ cộng
// vào chiêu CÓ đúng hệ đó (elemOf / poisonOf / skDamage): Võ Đang, Côn Lôn nội = Lôi; Thúy Yên nội = vật lý nội + Băng; Nga My nội = Băng… Đồ (trang
// bị) giữ như engine: cộng vào mọi chiêu cùng loại nội / ngoại công
export function addAttrs(B, attrs, hoan = false) {
  for (const [k, v] of Object.entries(attrs)) {
    const x = v[0] || 0, m = /^(physicsres|coldres|fireres|poisonres|lightingres)(max)?(_yan)?_p$/.exec(k);
    if (m) { if (m[2]) B.resMax[RES[m[1]]] = (B.resMax[RES[m[1]]] || 0) + x; else B.res[RES[m[1]]] = (B.res[RES[m[1]]] || 0) + x; continue; }
    const e = /^add(cold|fire|lighting|poison)(damage|magic)_v$/.exec(k);
    if (e) { const t = e[1] === "lighting" ? "light" : e[1], o = hoan ? (e[2] === "magic" ? (B.hoanMagic = B.hoanMagic || {}) : (B.hoanElem = B.hoanElem || {})) : e[2] === "magic" ? B.elemMagic : B.elem; o[t] = (o[t] || 0) + x; continue; }
    const vs = /^me2(metal|wood|water|fire|earth)damage_p$/.exec(k), fr = /^(metal|wood|water|fire|earth)2medamage_p$/.exec(k);
    if (vs) { const i = SERIES.indexOf(vs[1]); B.vsSeries[i] = (B.vsSeries[i] || 0) + x; continue; }
    if (fr) { const i = SERIES.indexOf(fr[1]); B.fromSeries[i] = (B.fromSeries[i] || 0) + x; continue; }
    switch (k) {
      case "addphysicsdamage_p": B.dmgPct += x; break;
      case "addphysicsdamage_v": B.dmgAdd += x; break;
      // sát thương vật lý nội công (Nội Phổ hoàn, bị động Thúy Yên Băng Cốt Tuyết Tâm) — như dòng đồ (itemdb.js MAGIC_LINE), cộng ở chiêu nội công
      case "addphysicsmagic_v": { const o = hoan ? (B.hoanMagic = B.hoanMagic || {}) : B.elemMagic; o.physics = (o.physics || 0) + x; break; } // hoàn: chỉ chiêu nội công có phần vật lý (skDamage)
      case "attackratingenhance_p": B.arPct += x; break;
      case "attackratingenhance_v": B.ar += x; break;
      case "deadlystrikeenhance_p": B.crit += x; break;
      case "adddefense_v": B.def += x; break;
      case "lifemax_p": case "lifemax_yan_p": B.lifePct += x; break;
      case "lifemax_v": B.life += x; break;
      case "manamax_p": B.manaPct += x; break;
      case "manamax_v": B.mana += x; break;
      case "allres_p": case "allres_yan_p": B.resAll += x; break;
      case "allresmax_p": B.resMax.all = (B.resMax.all || 0) + x; break;
      case "attackspeed_v": case "attackspeed_yan_v": B.atkSpeed += x; break;
      case "castspeed_v": case "castspeed_yan_v": B.castSpeed += x; break;
      case "fastwalkrun_p": B.moveSpeed += x; break;
      case "lifereplenish_v": B.lifeRegen += x; break;
      case "manareplenish_v": B.manaRegen += x; break;
      case "coldenhance_p": B.enh.cold = (B.enh.cold || 0) + x; break;
      case "fireenhance_p": B.enh.fire = (B.enh.fire || 0) + x; break;
      case "lightingenhance_p": B.enh.light = (B.enh.light || 0) + x; break;
      case "poisonenhance_p": B.enh.poison = (B.enh.poison || 0) + x; break;
      case "meleedamagereturn_p": B.thornsPct += x; break;
      case "rangedamagereturn_p": B.rangeReturnPct += x; break;
      // Thiếu Lâm Đại Thừa Như Lai Chú (anh 10/11): phản độc (engine "Phan don doc sat" — World.phanDoc), phản bùa (KMissle m_ReturnSkill — tkbot.js tkPhanBua)
      case "poisondamagereturn_p": B.poisonRetPct += x; break;
      case "returnskill_p": B.phanBua += x; break;
      // Thiên Vương Đảo Hư Thiên: % hồi phục sinh lực (engine KNpc: m_CurrentLifeReplenish * (100 + p) / 100)
      case "lifereplenish_p": B.lifeRegenPct += x; break;
      case "steallife_p": B.lifeSteal += x; break;
      case "stealmana_p": B.manaSteal += x; break;
      case "manashield_p": B.manaShield += x; break;
      case "dynamicmagicshield_v": B.noiHoThan += x; break; // "Nội lực hộ thân +N điểm" (Côn Lôn Huyền Thiên Vô Cực — anh 09/11; World.hit)
      case "sorbdamage_yan_p": B.sorb += x; break;
      case "ignoredefense_p": B.ignoreDef += x; break;
      // "Bỏ qua độc phòng đối phương" (Ngũ Độc Kỳ Kinh — anh 17/11 "ngũ độc đánh quái thì dồn dame, đánh người thì không"): trừ thẳng vào kháng độc của mục tiêu (khangDoc)
      case "anti_poisonres_p": case "anti_poisonres_yan_p": B.boQuaDoc = (B.boQuaDoc || 0) + x; break;
      // chống trạng thái khi quái có võ công (anh 29/10 lần 4 — cau-hinh.json quaiVoCong): Thời gian phục hồi, giảm thời gian làm chậm / choáng / trúng độc
      case "fasthitrecover_v": case "fasthitrecover_yan_v": B.tgph = (B.tgph || 0) + x; break;
      case "freezetimereduce_p": B.tglc = (B.tglc || 0) + x; break;
      case "stuntimereduce_p": B.tgc = (B.tgc || 0) + x; break;
      case "poisontimereduce_p": B.tgtd = (B.tgtd || 0) + x; break;
      // còn lại: chỉ có nghĩa khi PK / tổ đội (phản đòn tầm xa, kháng choáng…) — giữ chữ trong ô xem chiêu, chưa tính
    }
  }
  return B;
}
// B trống (cùng trường rules.NO_BONUS) + cộng 2 B (đồ + võ công)
export const emptyB = () => ({ str: 0, dex: 0, vit: 0, eng: 0, life: 0, mana: 0, stamina: 0, res: {}, resAll: 0, resMax: {}, wdmg: null, dmgAdd: 0, dmgPct: 0,
  elem: {}, elemMagic: {}, hoanElem: {}, hoanMagic: {}, enh: {}, atkSpeed: 0, castSpeed: 0, moveSpeed: 0, ar: 0, arPct: 0, def: 0, lifeRegen: 0, manaRegen: 0, lifeSteal: 0, manaSteal: 0,
  thorns: 0, thornsPct: 0, rangeReturnPct: 0, poisonRetPct: 0, phanBua: 0, lifeRegenPct: 0, luck: 0, ignoreDef: 0, crit: 0, lifePct: 0, manaPct: 0, manaShield: 0, noiHoThan: 0, sorb: 0, vsSeries: {}, fromSeries: {},
  tgph: 0, tglc: 0, tgc: 0, tgtd: 0, boQuaDoc: 0 });
export function mergeB(a, b) {
  const o = emptyB();
  for (const src of [a, b]) for (const [k, v] of Object.entries(src || {})) {
    if (k === "wdmg") { if (v) o.wdmg = v; continue; }
    if (v && typeof v === "object") { for (const [kk, vv] of Object.entries(v)) o[k][kk] = (o[k][kk] || 0) + vv; } else o[k] = (o[k] || 0) + (v || 0);
  }
  return o;
}
// vòng sáng ghép của vòng sáng a (skill_appendskill — Nga My 120 Bế Nguyệt Phất Trần gồm Lưu Thủy, Mộng Điệp, Phật Tâm Từ Hữu, Thanh Âm
// Phạn Xướng, Phổ Độ Chúng Sinh): [[mã, cấp chạy]] — như engine KNpc (đa vòng sáng): chỉ chiêu ĐÃ HỌC, cấp = min((cấp vòng chính + cấp đã học)
// / 2, cấp vòng chính) ("đẳng cấp lấy theo kỹ năng hỗ trợ có cấp thấp nhất"). Bản 25/10 chỉ có Phổ Độ Chúng Sinh (gói chỉ giữ dòng cuối)
export function auraGhep(a, alv, sk) {
  const ap = a && alv > 0 && a.lv && a.lv.skill_appendskill; if (!ap) return [];
  const rows = [ap, ...(a.lvGhep || [])].map((g) => g[Math.min(alv, g.length) - 1]).filter((v) => v && v[0] > 0);
  return rows.map(([id]) => [id, (sk[id] | 0) > 0 ? Math.min((alv + (sk[id] | 0)) >> 1, alv) : 0]).filter(([, lv]) => lv > 0);
}
// chiêu bị động đã học (đúng vũ khí) + bùa đang có + vòng sáng đang bật (kèm các vòng sáng ghép — auraGhep) -> B. Thuộc tính điều khiển
// chiêu (skill_*, missle_*, addskilldamage…) không phải chỉ số.
const NOT_STAT = /^(skill_|missle_|addskill|autoattackskill|autoreplyskill|autorescueskill|autodeathskill)/;
export const statsOnly = (A) => Object.fromEntries(Object.entries(A).filter(([k]) => !NOT_STAT.test(k) && !DMG.test(k) && k !== "seriesdamage_p" && k !== "stun_p" && k !== "deadlystrike_p" && k !== "attackrating_p"));
// ngoai = vòng sáng hỗ trợ của đồng đội đứng trong tầm [[mã, cấp, …]] (anh 29/10 — World.vongDoi)
// anh 16/11 — Báo Đáp Ân Sư: cấp chiêu = cấp đã học + cấp Nhất Kỷ / Càn khôn đang có (rules.js skCong — không ghi vào hero.skills)
export function skillB(hero, db, wk, buffs, auraId, ngoai) {
  const B = emptyB(), sk = skCong(hero, db);
  for (const [id, lv] of Object.entries(sk)) { const s = db[id]; if (s && lv > 0 && s.style === 3 && !timedBuff(s) && eqtOk(s, wk)) addAttrs(B, statsOnly(lvAttrs(s, lv))); }
  for (const b of (buffs || new Map()).values()) addAttrs(B, b.attrs);
  const a = auraId && db[auraId], alv = auraId ? sk[auraId] | 0 : 0;
  // vòng sáng đánh địch (Ngũ Độc Vô Hình Độc: độc + giảm tốc lên quái quanh mình — vcUpdate phát theo nhịp): dòng là của quái, không cộng
  // cho mình (bản đầu cộng cả "giảm tốc độ di chuyển" vào nhân vật). Vòng của mình + của đồng đội: cùng 1 vòng thì lấy cấp cao nhất, không
  // cộng dồn (engine: cùng trạng thái thì lần phát sau thay lần trước)
  const vong = new Map(), them = (id, lv) => { if (db[id] && lv > 0) vong.set(+id, Math.max(vong.get(+id) || 0, lv)); };
  if (a && alv > 0 && !a.target.enemy) { them(auraId, alv); for (const [id, lv] of auraGhep(a, alv, sk)) them(id, lv); }
  for (const [id, lv] of ngoai || []) if (db[id] && !(db[id].target && db[id].target.enemy)) them(id, lv);
  for (const [id, lv] of vong) addAttrs(B, statsOnly(lvAttrs(db[id], lv)));
  return B;
}
// vòng sáng hỗ trợ: trạng thái chiêu con còn tác dụng bao lâu sau lần phát cuối (giây — anh 03/11 xoay vòng Nga My): p2 (số khung) của dòng
// thuộc tính (Phật Tâm Từ Hữu lifemax_p 144 = 8 giây, các vòng khác 18 = 1 giây); vòng chỉ có dòng skill_* (Bế Nguyệt Phất Trần — vòng ghép) 1 giây
const VONG_GIU = new Map();
export function vongGiu(s, lv) {
  const k = (s && s.id) + ":" + lv; if (VONG_GIU.has(k)) return VONG_GIU.get(k);
  const A = s ? lvAttrs(s, Math.max(1, lv)) : {}, f = Math.max(0, ...Object.entries(A).filter(([n]) => !/^skill_/.test(n)).map(([, v]) => (v && v[1] > 0 ? v[1] : 0)));
  const g = (f || 18) * TICK; VONG_GIU.set(k, g); return g;
}
// chiêu hồi máu (bùa lợi chỉ hồi sinh lực, tác dụng ≤ 5 giây — Từ Hàng Phổ Độ của Nga My). Vòng sáng không phải (anh 03/11: Mộng Điệp / Phổ Độ
// Chúng Sinh có dòng hồi sinh lực 18 khung -> bản trước coi là chiêu hồi máu, mất khỏi danh sách vòng sáng của Trợ Thủ)
export function isHeal(s, lv) {
  const A = lvAttrs(s, Math.max(1, lv)); if (!A.lifereplenish_v || (s && s.target && s.target.enemy) || (s && s.aura)) return false;
  return Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0))) <= 90;
}
// "Hỗ trợ từ các kỹ năng khác": { mã chiêu: % } từ dòng addskilldamageN = [mã, 0, %] của các chiêu đã học
export function skillSupport(hero, db) {
  const o = {}, dong = {};
  for (const [id, lv] of Object.entries(skCong(hero, db))) { // + cấp Báo Đáp Ân Sư (anh 16/11)
    if (!(lv > 0)) continue;
    for (const [k, v] of Object.entries(lvAttrs(db[id], lv))) if (/^addskilldamage\d+$/.test(k) && v[0]) { o[v[0]] = (o[v[0]] || 0) + (v[2] || 0); (dong[v[0]] = dong[v[0]] || []).push([+id, v[2] || 0]); }
  }
  Object.defineProperties(o, { dong: { value: dong }, nho: { value: new Map() } }); // dòng theo từng chiêu nhận (World.supDon) — không đếm khi duyệt { mã: % }
  return o;
}

// ---------- trận: cài vào World ----------
export function installVoCong(World) {
  Object.assign(World.prototype, {
    // cấp đang học của chiêu id (0 = chưa học); anh 16/11 — Báo Đáp Ân Sư: + cấp Nhất Kỷ / Càn khôn còn hạn (rules.js ccCong / capCong — chiêu đã học, trừ
    // đòn thường / Khinh công, kẹp theo dữ liệu chiêu). Cấp gốc (cộng điểm, chiêu luyện): this.hero.skills
    skLv(id) {
      if (id === KC_ID) return this.hero.fac != null ? 1 : 0;
      const lv = ((this.hero.skills || {})[id]) | 0, c = lv > 0 ? ccCong(this.hero) : 0;
      return c ? capCong(this.skDef(id), id, lv, c) : lv;
    },
    skDef(id) { return (this.P.skillDb || {})[id] || null; },
    // tầm ra chiêu (px logic): skill_attackradius theo cấp, không có thì AttackRadius
    skRange(id, lv) { const s = this.skDef(id), A = lvAttrs(s, lv); return ((A.skill_attackradius && A.skill_attackradius[0]) || (s && s.radius) || 75) * SCALE; },
    // tầm chiêu đánh xa nhất của môn phái mình (đơn vị client — anh 16/11: ô Tiếp cận của Trợ Thủ chỉ điền tới số này): chiêu đánh trong danh sách phái
    // (P.factions) có trong gói võ công (chiêu 150 chưa có gói thì bỏ), bỏ chiêu lướt / di chuyển (Đoạn Hồn Thích form 11, Mê Ảnh Tung form 13), tầm ở cấp
    // cao nhất. Chưa vào phái: 75 (đánh tay không)
    tamPhai() {
      if (!this.P.vc) return 2000; // gói võ công chưa nạp: không kẹp (khỏi lưu trần 75 sai — soát 16/11)
      const fac = this.hero && this.hero.fac; if (fac == null) return 75;
      if (this._tamPhai && this._tamPhai[0] === +fac) return this._tamPhai[1];
      const F = (this.P.factions || []).find((f) => f.id === +fac); let m = 75;
      for (const id of (F && F.skills) || []) {
        const s = this.skDef(id), k = this.P.vc && this.P.vc.sk(id);
        if (!s || !k || s.aura || k.form === 11 || k.form === 13 || kindOf(s, this.P.skillDb) !== "attack") continue;
        m = Math.max(m, Math.round(this.skRange(id, s.max || 20) / SCALE));
      }
      this._tamPhai = [+fac, m]; return m;
    },
    // tầm đánh thật của chiêu nổ quanh NGƯỜI RA CHIÊU (MisslesForm 7, đạn đứng yên — Phật Quang Phổ Chiếu…): chỉ trúng quái trong vùng nổ /
    // va chạm quanh mình -> phải đứng trong chừng đó, không phải ở mép tầm chiêu (400). Bản trước tự đánh đứng cách 400 nên chiêu nổ vào
    // khoảng không (đo tốc độ giết 26/10: Nga My cấp 65 ở Hoành Sơn 0 quái / giờ). null = chiêu không thuộc loại này
    zoneReach(id) {
      let k = this.P.vc && this.P.vc.sk(id);
      for (let i = 0; k && !k.mis && k.kid && i < 3; i++) k = this.P.vc.sk(k.kid);
      if (!k || k.style !== 0 || k.form !== 7) return null;
      const d = this.P.vc.mi(k.mis); if (!d || d.move !== 0) return null;
      // vùng nổ (inVung) đã tính tới mép thân quái; vùng va chạm (inCells) thì − bán kính thân quái (World: trong tầm = cách ≤ tầm + bán kính)
      const n = Math.max(1, k.num || 1), cells = d.range ? vungO(d.dmgR) : Math.max(1, d.colR);
      return Math.max(CELL, (n > 1 ? (n * CELL) / 2 : 0) + (cells + 0.5) * CELL - (d.range ? 0 : 16));
    },
    skCost(id, lv) { if (this.dev && this.dev.noMana) return 0; const A = lvAttrs(this.skDef(id), lv); return (A.skill_cost_v && A.skill_cost_v[0]) || 0; }, // công cụ thử: không tốn nội lực
    // dùng được chiêu id lúc này không: { ok } hoặc { why: câu báo }
    skCan(id, cost = true) {
      const s = this.skDef(id), k = this.P.vc && this.P.vc.sk(id), lv = this.skLv(id), p = this.player;
      if (this.camVc) return { why: this.camVc }; // đường đua (duangua.js): cấm võ công — bùa / Trợ Thủ / chiêu đánh
      if (!this.vcOpen) return { why: "Võ công phái này đang soát — sắp mở (tạm đánh đòn thường)" };
      if (!s || !k) return { why: "Chiêu này chưa dùng được" };
      if (lv < 1) return { why: `Chưa học ${s.n}` };
      if (!eqtOk(s, this.wk)) return { why: WEAPON_MSG, weapon: true };
      if (s.horse === 1 ? this.riding() : s.horse === 2 && !this.riding()) return { why: HORSE_MSG[s.horse], horse: s.horse };
      if ((p.cd[id] || 0) > this.time) return { why: `${s.n}: chưa hồi chiêu`, cd: true };
      if (cost) { const c = this.skCost(id, lv), t = s.cost ? s.cost.type : 0, have = t === 1 ? p.st : t === 2 ? p.hp - 1 : p.mp; if (have < c) return { why: t === 1 ? "Không đủ thể lực" : t === 2 ? "Không đủ sinh lực" : "Không đủ nội lực", mp: true }; }
      return { ok: true };
    },
    // chiêu sẽ đánh con đang nhắm: chiêu 1 lần (chuột phải) > chiêu đánh chính (Trợ Thủ) / ô tay trái; không dùng được -> đòn thường
    atkPlan() {
      const p = this.player, O = this.hero.oChieu || {}, A = this.hero.auto && this.hero.auto.danh;
      // đổi chiêu theo nội lực (anh 03/11 — Trợ Thủ danh.noi): nội lực dưới duoi % -> chiêu noi.id (0: đòn thường — vũ khí hút nội lực) tới khi
      // nội lực ≥ len % (hutNoi nhớ đang ở chiêu nào giữa 2 mức)
      const N = this.auto && !p.manual && A && A.noi && A.noi.on ? A.noi : null, mpPct = (p.mp * 100) / Math.max(1, p.mpMax);
      if (!N) this.hutNoi = false; else if (mpPct < N.duoi) this.hutNoi = true; else if (mpPct >= Math.max(N.len, N.duoi + 1)) this.hutNoi = false;
      if (this.hutNoi && !p.once && !N.id) return null;
      const K = this.auto && !p.manual && this.pk ? this.pk() : null; // Trợ Thủ thẻ PK (anh 06/11 — trong trận Tống Kim): chiêu đánh của thẻ PK, 0 = như thẻ Kỹ năng
      const want = p.once || (this.hutNoi && N.id) || (K && K.chieu) || (this.auto && !p.manual && A && A.chieu) || O.trai;
      if (!want || this.P.vc == null || !this.vcOpen) return null;
      const s = this.skDef(want), kd = s && kindOf(s, this.P.skillDb); if (!s || kd === "buff" || kd === "move" || s.aura || s.style === 3) return null;
      const c = this.skCan(want), lv = this.skLv(want), zr = this.zoneReach(want), range = zr != null ? Math.min(this.skRange(want, lv), zr) : this.skRange(want, lv);
      // đang hồi chiêu chốc lát (≤ 1 giây): vẫn giữ tầm chiêu, đứng chờ — không chạy sát vào đánh đòn thường
      // chiêu lướt: chờ trong tầm lướt (310 đơn vị) chứ không ở mép tầm chiêu (960) — lúc hồi chiêu thì đi lại gần như người chơi
      if (!c.ok && c.cd && (p.cd[want] || 0) - this.time <= 1) { const k = s.style === 1 && this.P.vc.sk(want); return { id: want, lv, range: k && k.form === 11 ? Math.min(range, this.dashReach(k)) : range, wait: true }; }
      // vũ khí không hợp chiêu (cầm đao mà chiêu kiếm…): báo như client, đứng yên — không chạy vào đánh đòn thường tay không (anh 26/10)
      if (!c.ok && c.weapon && p.once !== want) { this.skMsg(c.why); return { id: want, lv, range, block: true }; }
      // chiêu cấm cưỡi ngựa ở ô chính (anh 26/10): như vũ khí không hợp — báo câu của client, đứng yên, không đánh đòn thường; phải bấm
      // xuống ngựa (M) mới ra chiêu. Đang treo máy (Trợ Thủ tự đánh) thì tự xuống ngựa như lúc tự dưỡng sức (World.updateHero)
      // mục tiêu còn xa ngoài tầm chiêu (soát 12/11 — Trợ Thủ lên ngựa chạy tới tinh anh / boss, main.js nguaBoss): cứ cưỡi ngựa chạy tới, gần tầm chiêu mới xuống
      // (World.updateHero chỉ ra chiêu khi trong tầm ≤ range + bán kính — lúc đó đã vào nhánh xuống ngựa dưới)
      if (!c.ok && c.horse === 1 && this.auto && !p.manual && p.target && ldist(p.x, p.y, p.target.x, p.target.y) > range + (p.target.radius || 0) + 60) return { id: want, lv, range };
      if (!c.ok && c.horse === 1 && this.auto && !p.manual) { if (this.doiNgua(false)) return this.atkPlan(); return { id: want, lv, range, block: true }; } // chưa đủ 3 giây từ lần lên ngựa: đứng chờ
      if (!c.ok && c.horse && p.once !== want) { this.skMsg(c.why); return { id: want, lv, range, block: true }; }
      if (!c.ok) { if (p.once === want && !c.cd) { p.once = null; this.skMsg(c.why); } else if (c.mp) this.skMsg(c.why); return null; }
      return { id: want, lv, range };
    },
    skMsg(t) { if (this.onSkMsg && (this.time - (this._skMsgT || -9) > 3 || t !== this._skMsgL)) { this._skMsgT = this.time; this._skMsgL = t; this.onSkMsg(t); } },
    // bắt đầu ra chiêu id (đã đứng trong tầm): động tác đánh / thi pháp, hình vận công + tiếng hô; đạn ra ở HIT_AT của động tác (castFire)
    castStart(id, lv, target, point) {
      const p = this.player, s = this.skDef(id), k = this.P.vc.sk(id);
      p.hideUntil = 0; // ra chiêu là hiện hình
      const spd = s.phys ? p.atkSpeed || 0 : p.castSpeed || 0;
      p.cast = { id, lv, target, point };
      // động tác (anh báo 25/10: chiêu đánh khác động tác bùa — bản đầu theo đúng cột CharAnimId nên chiêu đao Thiếu Lâm, bổng Cái Bang,
      // phi đao Đường Môn… ghi 11 đều ra động tác thi pháp như bùa). Như engine: chiêu ngoại công (IsPhysical — đi nhánh đánh, tính theo
      // tốc độ đánh) ra bằng động tác đánh như đòn thường (đánh 1 / đánh 2 xen kẽ; cột ghi 9 / 10 thì theo cột); chiêu nội công + bùa:
      // thi pháp (cột 11)
      p.attack = s.phys ? (k.anim === 9 || k.anim === 10 ? ANIM[k.anim] : p.attack === "Attack1" ? "Attack2" : "Attack1") : ANIM[k.anim] || "Magic";
      p.atkN = (p.atkN || 0) + 1; p.hitDone = false;
      p.castDur = atkFrames(CAST_T, spd) * TICK; p.swing = 0; p.castHit = null; // mốc tốc độ như client (rules.atkFrames)
      if (target) p.dir = dirOf(target.x - p.x, (target.y - p.y) * 2); else if (point) p.dir = dirOf(point[0] - p.x, (point[1] - p.y) * 2);
      // chiêu cận chiến (SkillStyle 1) theo kiểu đánh của engine (MisslesForm 8 – 13 = kiểu đánh cận chiến): 12 đánh nhiều đòn (Thiên Vương,
      // Long Trảo Hổ Trảo…) — num đòn, mỗi đòn genData vòng, KHÔNG ăn tốc độ đánh (anh 26/10: "Thiên Vương không có tác dụng với tốc
      // đánh" — bản đầu cho 18 khung nhân tốc độ, đòn 2–5 ra sau khi đã hết động tác); 11 chạy tới đánh (Đoạn Hồn Thích): lướt ngay tới
      // quái rồi mới vung (vcUpdate)
      if (s.style === 1 && k.form === 12 && k.genData > 0) { const sw = this.manyGap(id, k) * TICK; p.swing = sw; p.castDur = Math.max(1, k.num || 1) * sw; p.castHit = HIT_AT * sw; }
      // bóng mờ khi vung (World.drawHeroBody — anh 28/10): chiêu đánh nhiều đòn (engine KNpc::DoManyAttack luôn bật SetBlur) hoặc chiêu có
      // NeedShadow (KNpc ra chiêu: IsNeedShadow -> SetBlur); chiêu khác tắt
      p.blur = (s.style === 1 && k.form === 12) || k.shadow > 0;
      // chạy tới đánh (Đoạn Hồn Thích) theo engine KNpc::DoRunAttack / OnRunAttack (anh 26/10: bản trước "lướt xa vãi" — lướt bằng cả tầm
      // chiêu, 960 ở cấp 20). Tầm chiêu ("Phạm vi hiệu quả") chỉ là khoảng cách được ra chiêu; cú lướt chạy DASH_V, lâu nhất dashN vòng
      // (10 vòng = 310 đơn vị), tới nơi / vướng vật cản / hết vòng thì đánh ngay tại chỗ (động tác 0 khung, không vung — dashEnd). Không cần
      // mục tiêu: lướt về điểm nhắm; có bóng mờ (NeedShadow)
      if (s.style === 1 && k.form === 11 && ((target && target.alive) || point)) {
        p.cast = null; this.castPay(id, lv);
        p.dash = { id, lv, tgt: target && target.alive ? target : null, to: target ? [target.x, target.y] : point, speed: DASH_V * SCALE, left: this.dashN(k) * TICK, gT: 0 };
        p.ghosts = []; p.atkT = 0; this.setAct(p, "run");
        const snd0 = this.P.vc.sound(this.hero.sex === "f" ? k.snd[1] || k.snd[0] : k.snd[0] || k.snd[1]); if (snd0) this.P.audio.play(snd0, 0.6);
        return;
      }
      // di hình (MisslesForm 13 — Đường Môn Mê Ảnh Tung; engine NewJump + DoSecMove): tới NGAY điểm nhắm, xa nhất skill_param1_v (520 ở cấp
      // 20); điểm không đi được thì lùi dần trên đường thẳng tới chỗ đi được. Bản đầu không có nhánh này: chỉ vung tay đứng yên (anh 26/10)
      if (s.style === 1 && k.form === 13) {
        p.cast = null;
        const A = lvAttrs(s, lv), R = ((A.skill_param1_v && A.skill_param1_v[0]) || 300) * SCALE;
        let [tx, ty] = target ? [target.x, target.y] : point || [p.x, p.y];
        const dd = ldist(p.x, p.y, tx, ty);
        if (dd > R) { const kk = R / dd; tx = p.x + (tx - p.x) * kk; ty = p.y + (ty - p.y) * kk; }
        // sân lôi đài (anh 15/11 — THIET-KE-LOI-DAI.md 3.2 #4): bục đấu và vòng người xem là 2 vùng đi được riêng — điểm tới phải cùng vùng với chỗ đứng (không nhảy từ chỗ xem
        // lên bục / từ bục xuống)
        const vg = this.zone && this.zone.kind === "lôi đài" && this.map.vung ? this.map.vung(p.x, p.y) : null, toi = (x, y) => this.map.walkable(x, y) && (vg == null || this.map.vung(x, y) === vg);
        for (let i = 0; i < 24 && !toi(tx, ty); i++) { tx = p.x + (tx - p.x) * 0.9; ty = p.y + (ty - p.y) * 0.9; }
        if (!toi(tx, ty) || ldist(p.x, p.y, tx, ty) < 8) return;
        this.castPay(id, lv);
        if (k.pre) this.vfxAt(k.pre, null, { x: p.x, y: p.y }, 0);
        p.ghosts = [{ x: p.x, y: p.y, dir: p.dir, t: p.t, at: this.time }];
        p.x = tx; p.y = ty; p.path = null; p.goal = null; p.atkT = 0; this.setAct(p, "stand");
        if (k.pre) this.vfxAt(k.pre, null, p, 0);
        return;
      }
      this.setAct(p, "attack");
      if (k.pre) this.vfxAt(k.pre, null, p, 0);
      const snd = this.P.vc.sound(this.hero.sex === "f" ? k.snd[1] || k.snd[0] : k.snd[0] || k.snd[1]);
      if (snd) this.P.audio.play(snd, 0.6); else this.P.audio.missile(1, 0, 0.5);
    },
    // trừ nội lực / thể lực / sinh lực, đặt hồi chiêu TimePerCast / skill_mintimepercast_v
    castPay(id, lv) {
      const p = this.player, s = this.skDef(id), k = this.P.vc.sk(id), A = lvAttrs(s, lv);
      const cost = this.skCost(id, lv), t = s.cost ? s.cost.type : 0;
      if (t === 1) p.st = Math.max(0, p.st - cost); else if (t === 2) p.hp = Math.max(1, p.hp - cost); else p.mp = Math.max(0, p.mp - cost);
      const cdT = (A.skill_mintimepercast_v && A.skill_mintimepercast_v[0]) || k.tpc || 0;
      if (cdT && !(this.dev && this.dev.noCd)) { p.cd[id] = this.time + cdT * TICK; (p.cdLen = p.cdLen || {})[id] = cdT * TICK; } // cdLen: độ dài hồi chiêu (lớp hồi chiêu trên ô); công cụ thử: không hồi chiêu
      if (p.once === id) p.once = null;
    },
    // tới nhịp ra đòn: trừ nội lực, ra chiêu (xong động tác là ra chiêu kế ngay — không đứng chờ)
    castFire() {
      const p = this.player, c = p.cast; if (!c) return;
      const s = this.skDef(c.id), k = this.P.vc.sk(c.id);
      this.castPay(c.id, c.lv);
      const kind = kindOf(s, this.P.skillDb);
      // bùa lợi dùng lên đồng đội (c.ally — Trợ Thủ "Bùa lợi cho đồng đội", world.js buaDoi): máy người đó cộng bùa, mình không
      // Võ Đang 120 Xuất Ứ Bất Nhiễm (716, chiêu phụ Start 738 — anh 08/11 "check xem có hiệu quả xóa trạng thái dị thường và miễn nhiễm chưa, như client"): dòng
      // của 716 (xác suất theo cấp) dành cho đồng đội; bản thân nhận từ chiêu phụ 738 (xác suất + thời gian miễn của nó) — đúng ô xem chiêu
      const stMien = kind === "buff" && !c.ally ? this.evOf(c.id, c.lv, "start") : 0, skMien = stMien && this.skDef(stMien);
      if (kind === "buff") { if (c.ally) { if (this.onBuaDoi) this.onBuaDoi(c.ally, c.id, c.lv); } else if (skMien && lvAttrs(skMien, c.lv).ignorenegativestate_p) { this.buffOn(stMien, c.lv); if (+c.id === VD_120) this.buaVungDoi(c.id, c.lv, k); } else { this.buffOn(c.id, c.lv); if (this.buaVungAi && BUA_VUNG_AI.has(+c.id)) this.buaVungDoi(c.id, c.lv, null); } }
      p.castWait = 0; // WaitTime không phải thời gian đứng chờ sau chiêu (world.js ATK_WAIT)
      const pt = c.point || (c.target ? [c.target.x, c.target.y] : null);
      this.fire(c.id, c.lv, { root: c.id, x: p.x, y: p.y, tgt: c.target, pt });
      if (this.onChieu) this.onChieu(c.id, c.lv, p.x, p.y, pt || [p.x + 1, p.y]); // main.js: gửi người cùng bãi vẽ lại (chieuAo)
    },
    // Võ Đang 120 Xuất Ứ Bất Nhiễm (anh 13/11 lượt 88 "chiêu này có tác dụng với đồng đội xung quanh nữa"): đạn 274 của chiêu là "Khu vực đồng đội" (friend, DmgRange 10 ô) ->
    // đồng đội đứng trong vùng đó quanh mình nhận dòng của 716 (máy họ cộng — main.js onBuaVung -> may-chu/to-doi.js "buaDoi" ds -> buaTuDoi). Đồng đội = cùng tổ đội; trong
    // Tống Kim (rời đội khi vào trận) = người cùng phe. Trước: chỉ bản thân nhận (chiêu phụ 738)
    buaVungDoi(id, lv, k) {
      if (!this.onBuaVung) return;
      const mi = k && k.mis && this.P.vc.mi(k.mis), n = vungO((mi && mi.dmgR) || 10), p = this.player, ds = [];
      if (this.tk) { for (const e of this.tk.nguoi.values()) if (e.alive && e.tkPhe === this.tk.phe && inVung(p.x, p.y, e, n)) ds.push(e.tkn || e.name); }
      else for (const ten of this.doiTen || []) { const e = this.others.get(ten); if (e && e.hp !== 0 && e.act !== "die" && inVung(p.x, p.y, e, n)) ds.push(ten); }
      if (ds.length) this.onBuaVung(ds.slice(0, 8), +id, lv);
    },
    // chiêu của người khác cùng bãi (anh 31/10 "cho người khác thấy hiệu ứng của người chơi khác khi đánh boss"): phát lại ở máy mình chỉ để vẽ
    // (ao — như chiêu ảnh động k.show: đạn bay, chạm quái hiện hình trúng / tan, không sát thương, không tốn nội lực / hồi chiêu), từ chỗ người đó
    // (goc — tâm đạn bay vòng / quay về cũng theo người đó). Chỉ chiêu đánh / bùa hại (bùa lợi, vòng sáng đã vẽ trên người — vs, trạng thái)
    chieuAo(id, lv, e, pt) {
      if (VAT_HIEU_UNG.has(id)) return this.hieuUng(id, e); // Pháo Hoa / Hoa hồng của người khác
      const s = this.skDef(id), k = this.P.vc && this.P.vc.sk(id); if (!s || !k) return;
      const kind = kindOf(s, this.P.skillDb); if (kind !== "attack" && kind !== "curse") return;
      if (this.P.vc.warm) this.P.vc.warm(id);
      if (k.pre) this.vfxAt(k.pre, null, e, 0);
      this.fire(id, lv, { root: id, x: e.x, y: e.y, tgt: null, pt, ao: true, goc: e });
    },
    // hiệu ứng của vật phẩm (anh 03/11 — Pháo Hoa chiêu 251, Hoa hồng 285 của client; do.js dungVat "hieuUng"): chỉ vẽ quanh người e, không thuộc
    // phái nào nên không cần skDef (fire / emit chịu được), không sát thương (ao)
    hieuUng(id, e) {
      const k = this.P.vc && this.P.vc.sk(id); if (!k) return;
      if (this.P.vc.warm) this.P.vc.warm(id);
      if (k.pre) this.vfxAt(k.pre, null, e, 0);
      this.fire(id, 1, { root: id, x: e.x, y: e.y, tgt: null, pt: [e.x, e.y], ao: true, goc: e });
    },
    // ra chiêu id ở cấp lv (đệ quy chiêu con / sự kiện). o = { root, x, y (điểm phát), tgt (quái), pt [x, y] (điểm nhắm), depth }; quái có võ
    // công (bản mẫu): o.who = con quái ra chiêu (đạn nhắm người chơi — misHitHero), o.once = { done } chung cả chiêu (1 lần sát thương / chiêu)
    fire(id, lv, o) {
      const k = this.P.vc.sk(id); if (!k || (o.depth || 0) > 6) return;
      // Tống Kim (anh 05/11 — src/game/tkbot.js): chiêu của mình trong trận mang tkA (phe + người ra đòn "") — trúng bot / người phe kia (vcDich, misHit)
      if (this.tk && !o.tkA && !o.ao && !o.who && !o.ptA) o = { ...o, tkA: { phe: this.tk.phe, ref: "" } };
      const sub = { ...o, depth: (o.depth || 0) + 1 }, goc = o.goc || o.who || this.player;
      if (o.who && !o.who.alive && (o.depth || 0) === 0) return;
      if (k.kid) {
        const kl = k.kidLv > 0 ? k.kidLv : lv, n = Math.max(1, k.num || 1);
        for (let i = 0; i < n; i++) {
          const go = () => this.fire(k.kid, kl, { ...sub, x: goc.x, y: goc.y, tgt: o.tgt && o.tgt.alive ? o.tgt : null });
          if (i && k.genData) this.later(i * (k.style === 1 && k.form === 12 ? this.manyGap(id, k) : k.genData) * TICK, go); else go();
        }
      } else if (k.mis) this.emit(id, lv, k, o);
      // chiêu Start: người ra chiêu phát cùng lúc, từ chỗ mình, cùng mục tiêu (Phong Sương Toái Ảnh: nổ ở quái + Kim Đỉnh Phật Quang
      // 1 -> 3 tia bay vòng từ người ra rồi bám vào quái; Tam Nga Tề Tuyết: kiếm bay + Ngọc Tuyền Tẩy Trần nổ quanh mình; Sư Tử Hống:
      // vòng Kim Ba tỏa từ mình). Bản đầu phát ở chỗ quái -> tia sinh ngay trên quái, trúng là tan, không thấy (anh báo 25/10)
      // cấp chiêu sự kiện: skill_eventskilllevel theo cấp nếu chiêu có, không thì CẤP CHIÊU CHA — cột EventSkillLevel (0 / 1 / −1) chỉ là cờ, bản đầu
      // đọc thành "cấp 1" nên bẫy Đường Môn, Thiên La Địa Võng, Tứ Tượng Đồng Quy… nổ theo ở cấp 1 (anh báo bẫy độc sai sát thương 26/10)
      const s = this.skDef(id), A = lvAttrs(s, lv), evLv = (A.skill_eventskilllevel && A.skill_eventskilllevel[0]) || lv, st = this.evOf(id, lv, "start");
      if (st) this.fire(st, evLv, sub);
    },
    // chiêu sự kiện (start / collide / vanish) của chiêu id ở cấp lv: engine KSkill::LoadSkillLevelData — dòng skill_<loại>event của dữ
    // liệu cấp [bật (> 0), −, mã] ĐÈ lên cột skills.txt; chiêu không có dòng đó thì theo cột. Nhiều chiêu 90 / 150 chỉ bật tầng 2 từ cấp 11
    // (Thiên Ngoại Lưu Tinh: bãi lửa Nghiệp Hỏa Phàn Thành; dòng skill_showevent của ô xem chiêu cùng mốc) — bản đầu bật mọi cấp (anh 26/10)
    evOf(id, lv, kind) {
      const k = this.P.vc.sk(id), col = (k && k.ev && k.ev[kind]) || 0, line = lvAttrs(this.skDef(id), lv)[EV_KEY[kind]];
      return line ? (line[0] > 0 ? line[2] || col : 0) : col;
    },
    // nhịp mỗi đòn của chiêu đánh nhiều đòn (vòng): genData, chiêu Thiên Vương × TV_SLOW
    manyGap(id, k) {
      if (!this._facOf) this._facOf = new Map((this.P.factions || []).flatMap((f) => f.skills.map((x) => [x, f.key])));
      return k.genData * (this._facOf.get(+id) === "tianwang" ? TV_SLOW : 1);
    },
    // số vòng lướt tối đa: OnRunAttack chạy tới khi m_nCurrentMeleeTime > GetMissleGenerateTime(0) (WaitTime, + MslsGenerateData nếu ra
    // đạn cùng lúc) — tính cả vòng đầu và vòng cuối là + 2 (Đoạn Hồn Thích: 3 + 5 + 2 = 10)
    dashN(k) { return (k.wait || 0) + (k.gen === 1 ? k.genData || 0 : 0) + 2; },
    // tầm lướt xa nhất (px logic)
    dashReach(k) { return DASH_V * SCALE * this.dashN(k); },
    // đòn cuối cú lướt: chiêu con (Đoạn Hồn Thích 224 -> đạn 284 đứng yên tại chỗ dừng) đánh vùng DmgRange ô (engine ±2 ô với DmgRange 5;
    // ở đây vùng nới như misArea) — mọi quái trong vùng trúng 1 lần; quái chạm phải trên đường lướt không trúng (engine không xét)
    dashEnd(D) {
      const p = this.player, kk = this.P.vc.sk(D.id) || {}, kid = kk.kid, kl = kk.kidLv > 0 ? kk.kidLv : D.lv; if (!kid) return;
      const ck = this.P.vc.sk(kid) || {}, mi = (ck.mis && this.P.vc.mi(ck.mis)) || {}, n = vungO(mi.dmgR);
      for (const e of this.mobs) if (e.alive && inVung(p.x, p.y, e, n)) this.dashHit(D.id, D.lv, kid, kl, e);
    },
    // lướt trúng quái: trúng bằng chiêu con (đạn giả để dùng chung misHit: sát thương, choáng, hút máu…) + hình trúng của vũ khí
    dashHit(id, lv, kid, kl, e) {
      const k = this.P.vc.sk(kid) || {}, d = (k.mis && this.P.vc.mi(k.mis)) || { a: [], b: [], snd: [] };
      this.misHit({ src: { id: kid, lv: kl, root: id, k, enemy: true, depth: 1 }, d, hit: new Map(), t: 0 }, e);
      const p = this.player; if (p.atkFx) { this.spawnFx(p.atkFx, e); const snd = this.P.fx && this.P.fx.sound(p.atkFx); if (snd) this.P.audio.play(snd, 0.6); }
    },
    later(sec, fn) { (this.vcLater = this.vcLater || []).push({ at: this.time + sec, fn }); },
    // phát đạn của chiêu id theo kiểu bắn
    emit(id, lv, k, o) {
      const d = this.P.vc.mi(k.mis); if (!d) return;
      const s = this.skDef(id), A = lvAttrs(s, lv);
      const n = Math.max(1, (A.skill_misslenum_v && A.skill_misslenum_v[0]) || k.num || 1);
      const speed = ((A.missle_speed_v && A.missle_speed_v[0]) || d.speed || 0) * SCALE, life = (A.missle_lifetime_v && A.missle_lifetime_v[0]) || d.life || 1;
      const tx = o.pt ? o.pt[0] : o.x + 1, ty = o.pt ? o.pt[1] : o.y, a0 = Math.atan2((ty - o.y) * 2, tx - o.x) || 0;
      const src = { id, lv, root: o.root, k, enemy: !!(s && s.target.enemy), depth: o.depth || 0, lap: o.lap || 1, who: o.who || null, once: o.once || null, ao: !!o.ao, goc: o.goc || null, ptA: o.ptA || null, tkA: o.tkA || null,
        luot: o.luot || ((o.depth || 0) === 0 && !o.who && GIOI_HAN_DON[id] ? { dem: new Map() } : null), // sổ giới hạn đòn mỗi lần ra chiêu (GIOI_HAN_DON)
        fe: A.skill_flyevent || (k.ev && k.ev.fly ? [1, 10, k.ev.fly] : null) }; // fe: sự kiện bay (misStep — tính sẵn) // ptA: phân thân / bot ra chiêu (nhanvatmay.js — ptTrung; tkbot.js — tkTrung); tkA: đòn Tống Kim
      // chiêu cận chiến đánh nhiều đòn (Thiên Vương…): MỌI đạn của 1 nhát dùng chung sổ "đã trúng" -> mỗi con chỉ ăn 1 lần / nhát (anh 28/10
      // lần 3: Phá Thiên Trảm 1 nhát ra 3 đạn xếp hàng, cả 3 trúng 1 con thành 3 số sát thương — "vô địch quá"; Truy Phong Quyết 3 đạn xòe cũng vậy)
      const rk = this.P.vc.sk(o.root), chung = rk && rk.style === 1 && rk.form === 12 ? new Map() : null;
      const mk = (x, y, a, delay = 0) => {
        const m = { src, d, x, y, x0: x, y0: y, a, speed, life, t: -delay, tgt: o.tgt || null, hit: chung || new Map(o.skip && d.move !== 0 ? [[o.skip, Infinity]] : []), n: 0 };
        // bay vòng quanh người ra chiêu (MoveKind 3 — Ngũ Độc Bách Độc Xuyên Tâm): bán kính Param3 của đạn (64), bắt đầu ở góc a
        if (d.move === 3) m.orbit = { R: (((d.p && d.p[2]) || 64) * SCALE), ang: a, w: ORBIT_W * (d.p && d.p[0] ? 1 : -1) };
        // ném vòng cung (MoveKind 7 — Đường Môn Tích Lịch Đơn): bay lên Zspeed, rơi theo Zacc (1/1024 điểm / vòng) -> chạm đất sau
        // 2 × Zspeed / Zacc vòng (Tích Lịch Đơn 4 vòng), rơi đúng điểm nhắm rồi nổ vùng. Bản đầu bay ngang 12 điểm / vòng suốt 60 vòng — chậm,
        // bay quá điểm nhắm (anh báo 26/10)
        // rơi từ trên cao (Zacc ≠ 0 — engine KMissle::ZAxisMove: mỗi vòng độ cao += Zspeed, Zspeed −= Zacc, đơn vị 1/1024 điểm; anh 26/10 "không
        // rơi băng"): Vũ Đả Lê Hoa cao 450 rơi dần ~30 vòng, Mục Dã Lưu Tinh / Thiên Ngoại Lưu Tinh lao xuống ~4 vòng. Chỉ va chạm khi đã
        // xuống ≤ 20 (MISSLE_MAX_COLLISION_ZHEIGHT), chạm đất thì nổ vùng (AutoExplode) rồi tan — gọi chiêu tan (Nghiệp Hỏa Phàn Thành)
        if (d.za && d.move !== 7) m.fall = { h: d.h || 0, v: (d.zs || 0) / 1024, a: d.za / 1024 };
        if (d.move === 7) {
          const T = Math.max(2, Math.min(life, Math.round((2 * (d.zs || 10240)) / Math.max(1, d.za || 5120)))), dx = tx - x, dy = (ty - y) * 2;
          m.lob = { T, x0: x, y0: y, x1: x + dx, y1: y + dy / 2, top: Math.max(30, Math.hypot(dx, dy) * 0.15) };
        }
        (this.mis = this.mis || []).push(m);
      };
      // MslsGenerate: 2 lần lượt (mỗi đạn cách genData vòng) · 5 từ giữa ra 2 bên (đạn giữa trước, mỗi cặp ra sau genData vòng)
      // 3 thứ tự ngẫu nhiên (Vũ Đả Lê Hoa, Ngũ Lôi Chánh Pháp…: mỗi đạn ra ở 1 nhịp genData ngẫu nhiên, không trùng)
      const ordered = k.gen === 2 && k.genData > 0, mid = (n - 1) / 2;
      const perm = k.gen === 3 ? [...Array(n).keys()].sort(() => Math.random() - 0.5) : null;
      const delay = (i) => (ordered ? i * k.genData : k.gen === 5 ? Math.round(Math.abs(i - mid)) * (k.genData || 0) : perm ? perm[i] * (k.genData || 0) : 0);
      // thời điểm ra đạn thứ no như engine KSkill::GetMissleGenerateTime (chưa cộng WaitTime): 1 cùng lúc sau genData, 2 lần lượt, 3 lần lượt
      // lệch ngẫu nhiên (+0..genData hoặc −0..genData/2), 4 ngẫu nhiên trong genData — dùng cho lưới đạn kiểu 6 / 7
      const G = k.genData || 0, rd = (x) => Math.floor(Math.random() * x);
      const genT = (no) => (k.gen === 1 ? G : k.gen === 2 ? no * G : k.gen === 3 ? Math.max(0, no * G + (Math.random() < 0.5 ? rd(G) : -rd(G / 2))) : k.gen === 4 ? rd(G) : k.gen === 5 ? delay(no) : 0);
      // bẫy (đạn đứng yên, trúng là mất, sống lâu — Đường Môn Địa Diệm Hỏa, Độc Thích Cốt…): mỗi loại giữ tối đa TRAP_MAX cái, đặt thêm thì
      // cái cũ nhất mất (TẠM — số của client chưa tìm thấy)
      if (d.move === 0 && d.colVanish && d.life >= TRAP_LIFE && !o.ao) {
        const mine = (this.mis || []).filter((x) => !x.done && x.src.id === id && !x.src.ao && (x.src.ptA || null) === (o.ptA || null)); // bẫy của phân thân đếm riêng (soát 05/11)
        for (let i = 0; i <= mine.length - TRAP_MAX; i++) this.misEnd(mine[i], true);
      }
      // Param1 / Param2 của skills.txt (cột ghi chú Param1Memo / Param2Memo): "Gian cách" (khoảng cách giữa 2 đạn, điểm); kiểu vòng tròn:
      // Param1 "Lấy mục tiêu làm trung tâm" (≠ 0) · Param2 "Bán kính"
      const P1 = (k.p && k.p[0]) || 0, P2 = (k.p && k.p[1]) || 0, gap = (P1 || 32) * SCALE;
      switch (k.form) {
        case 0: { // tường: hàng vuông góc hướng bắn, mỗi đạn cách Param1. Đạn bay (Tam Nga Tề Tuyết, Phá Thiên Trảm…) xếp hàng ngay
          // trước mặt rồi cùng bay tới; đạn đứng yên (Thôi Sơn Điền Hải…) dựng tường tại điểm nhắm
          const fly = d.move !== 0 && speed > 0;
          const cx = fly || !o.pt ? o.x : tx, cy = fly || !o.pt ? o.y : ty, px = -Math.sin(a0), py = Math.cos(a0);
          for (let i = 0; i < n; i++) { const off = (i - mid) * gap; mk(cx + px * off, cy + (py * off) / 2, a0, delay(i)); }
          break;
        }
        // tỏa quạt: mỗi đạn lệch Param1 / 64 vòng (hướng client chia 64), không ghi thì 2 / 64 (TẠM)
        case 2: { const st = ((P1 || 2) * Math.PI * 2) / 64; for (let i = 0; i < n; i++) mk(o.x, o.y, a0 + (i - mid) * st, delay(i)); break; }
        case 3: { // vòng tròn bán kính Param2 quanh mục tiêu (Param1 ≠ 0 — Tứ Tượng Đồng Quy: 4 đạn từ 4 phía bay dồn vào quái) hoặc quanh
          // người ra chiêu (Kim Ba của Sư Tử Hống tỏa ra; Kim Đỉnh Phật Quang: tia bay tỏa từ mình rồi vòng về bám quái)
          const onT = P1 && o.pt, cx = onT ? tx : o.x, cy = onT ? ty : o.y, R = P2 * SCALE;
          for (let i = 0; i < n; i++) { const b = a0 + (i * Math.PI * 2) / n; mk(cx + Math.cos(b) * R, cy + (Math.sin(b) * R) / 2, onT && R ? b + Math.PI : b, delay(i)); }
          break;
        }
        case 4: for (let i = 0; i < n; i++) mk(o.x, o.y, Math.random() * Math.PI * 2, delay(i)); break;
        case 5: for (let i = 0; i < n; i++) { const r = rnd(0, 3) * CELL, b = Math.random() * Math.PI * 2; mk(tx + Math.cos(b) * r, ty + (Math.sin(b) * r) / 2, a0, i * 2 + delay(i)); } break;
        // 6 tại điểm nhắm / 7 tại chỗ phát (người ra chiêu, hoặc chỗ đạn gọi sự kiện): engine KSkill::CastZone — N × N đạn (N = số đạn) xếp
        // lưới ô 32 đơn vị quanh tâm, Param1 = 1 bỏ góc thành hình tròn; đạn i·N + j ra theo genT. Bản đầu chỉ N đạn quanh vòng 32 -> Ngũ Lôi
        // Chánh Pháp, Lôi Động Cửu Thiên, Vũ Đả Lê Hoa (N = 4) chỉ 4 tia / mảnh dồn một chỗ thay vì 16 rải 4 × 4 ô trong vài giây (anh 26/10)
        case 6: case 7: {
          const cx = k.form === 6 ? tx : o.x, cy = k.form === 6 ? ty : o.y, hN = Math.floor(n / 2), lim = Math.floor((n * n) / 4);
          const bx = n === 1 ? cx : cx - (n * CELL) / 2, by = n === 1 ? cy : cy - (n * CELL) / 4;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (P1 === 1 && (i - hN) ** 2 + (j - hN) ** 2 > lim) continue;
            mk(bx + j * CELL, by + (i * CELL) / 2, a0, genT(i * n + j));
          }
          break;
        }
        default: // 1 thẳng: nhiều đạn nối đuôi theo hướng bắn (lần lượt: cùng chỗ, ra cách genData vòng; cùng lúc: cách Param1 điểm)
          for (let i = 0; i < n; i++) { const off = ordered || !P1 ? 0 : i * gap; mk(o.x + Math.cos(a0) * off, o.y + (Math.sin(a0) * off) / 2, a0, ordered ? delay(i) : P1 ? 0 : i * 3); }
      }
    },
    // ---------- cập nhật mỗi bước ----------
    vcUpdate(dt) {
      if (this.vcLater && this.vcLater.length) { const now = this.time, due = this.vcLater.filter((x) => x.at <= now); this.vcLater = this.vcLater.filter((x) => x.at > now); for (const x of due) x.fn(); }
      const p = this.player;
      // bùa hết giờ (hoặc trọng thương) -> bỏ, tính lại chỉ số
      if (p.buffs.size) { let ch = false; for (const [id, b] of p.buffs) if (b.until <= this.time || p.hp <= 0) { p.buffs.delete(id); ch = true; } if (ch) this.refreshStats(false); }
      // bùa hại người phe kia trên mình (p.tkBua) gắn / hết / bị xóa -> tính lại chỉ số (world.js bonus cộng dòng tốc chạy, tốc đánh, hồi phục, phản đòn — anh 17/11)
      const buaK = p.tkBua && p.tkBua.length ? p.tkBua.filter((c) => c.until > this.time).map((c) => `${c.id}:${c.lv}:${c.until}`).join(",") : "";
      if (buaK !== (p.buaK || "")) { p.buaK = buaK; this.refreshStats(false); }
      if (p.manaRegen > 0 && p.hp > 0 && p.mp < p.mpMax) p.mp = Math.min(p.mpMax, p.mp + p.manaRegen * 2 * dt);
      else if (p.manaRegen < 0 && buaK && p.hp > 0) p.mp = Math.max(0, p.mp + p.manaRegen * 2 * dt); // bùa giảm hồi nội lực quá mức hồi (Bắc Minh Đáo Hải…): nội lực tụt dần
      // vòng sáng (anh 29/10 đồng đội, 03/11 xoay vòng Nga My + vòng vừa đổi còn tác dụng): Trợ Thủ đổi vòng ở ô tay phải, giữ hạn vòng của mình
      // mỗi bước; mỗi 0,5 giây xem vòng đồng đội / vòng hết hạn -> tính lại chỉ số + vòng người khác đang được hưởng (World.vongKiem)
      this.xoayVong(); this.vongCapNhat();
      if ((this.vdT = (this.vdT || 0) + dt) >= 0.5) { this.vdT = 0; this.vongKiem(); }
      // vòng sáng đánh địch đang bật (ô tay phải — game chỉ có Vô Hình Độc: độc + giảm tốc): mỗi AURA_T vòng MỌI quái trong tầm vòng sáng × VONG_TAM
      // trúng chiêu con (anh 01/11: "vô hình độc chỉ ảnh hưởng đến 2 3 con, trong khi nguyên bản là ảnh hưởng trong phạm vi — tăng phạm vi thêm 30 %").
      // Bản trước phát đạn của chiêu con ở chỗ mình -> chỉ trúng vài con sát người
      const au = this.hero.oChieu && this.hero.oChieu.phai, as = au && this.skDef(au);
      if (as && as.aura && as.target.enemy && p.hp > 0 && this.skLv(au) > 0 && this.vcOpen && (this.vcAuraT = (this.vcAuraT || 0) + dt) >= AURA_T * TICK) {
        this.vcAuraT = 0;
        const lv = this.skLv(au), R = this.skRange(au, lv) * VONG_TAM, k = this.P.vc.sk(au) || {}, ck = k.kid ? this.P.vc.sk(k.kid) : null;
        if (ck) {
          const d = (ck.mis && this.P.vc.mi(ck.mis)) || { a: [], b: [], snd: [] }, kl = k.kidLv > 0 ? k.kidLv : lv;
          for (const e of this.mobs) if (e.alive && ldist(p.x, p.y, e.x, e.y) <= R) this.misHit({ src: { id: k.kid, lv: kl, root: au, k: ck, enemy: true, depth: 1 }, d, hit: new Map(), t: 0 }, e);
        } else if (this.mobs.some((e) => e.alive && ldist(p.x, p.y, e.x, e.y) <= R)) this.fire(au, lv, { root: au, x: p.x, y: p.y, tgt: null, pt: null });
      }
      // chiêu lướt (MisslesForm 11 — Thiên Vương Đoạn Hồn Thích): lao về mục tiêu / điểm nhắm DASH_V mỗi vòng; tới sát mục tiêu, vướng vật
      // cản hoặc hết số vòng lướt thì đánh tại chỗ (dashEnd)
      if (p.dash) {
        const D = p.dash, t = D.tgt && D.tgt.alive ? D.tgt : null, to = t ? [t.x, t.y] : D.to;
        const dx = to[0] - p.x, dy = (to[1] - p.y) * 2, dd = Math.hypot(dx, dy), stop = t ? t.radius : 0;
        const step = Math.min(D.speed * Math.min(dt, Math.max(0, D.left)) * 18, Math.max(0, dd - stop));
        D.left -= dt;
        const nx = dd > 0 ? p.x + (dx / dd) * step : p.x, ny = dd > 0 ? p.y + ((dy / dd) * step) / 2 : p.y;
        const blocked = step > 0 && !this.map.walkable(nx, ny);
        if (!blocked) { p.x = nx; p.y = ny; }
        if (dd - step <= stop + 0.5 || blocked || D.left <= 0 || p.hp <= 0) {
          p.dash = null;
          if (p.hp > 0) { if (dd > 0) p.dir = dirOf(dx, dy); this.dashEnd(D); this.setAct(p, "stand"); }
        } else {
          p.dir = dirOf(dx, dy); if (p.act !== "run") this.setAct(p, "run");
          if ((D.gT += dt) >= 0.05) { D.gT = 0; (p.ghosts = p.ghosts || []).push({ x: p.x, y: p.y, dir: p.dir, t: p.t, at: this.time }); } // bóng mờ (NeedShadow)
        }
      }
      if (p.ghosts && p.ghosts.length) p.ghosts = p.ghosts.filter((g) => this.time - g.at < GHOST_T);
      if (this.mis && this.mis.length) { for (const m of this.mis) this.misStep(m, dt * 18); this.mis = this.mis.filter((m) => !m.done); }
      if (this.vfx && this.vfx.length) { for (const f of this.vfx) f.t += dt; this.vfx = this.vfx.filter((f) => f.t < f.dur && !(f.e && f.e.kind === "mob" && !f.e.alive && f.e.deadT > 0.5)); }
    },
    misStep(m, dk) {
      const d = m.d;
      if (m.t < 0) { m.t += dk; if (m.t < 0) return; this.misSnd(d, 1, m); }
      const t0 = m.t; m.t += dk;
      // đạn bám mục tiêu mà con đó đã chết (vd tia Kim Đỉnh Phật Quang khi phát nổ Phong Sương giết quái trước): bám con gần nhất quanh
      // đó; không còn con nào thì tan tại chỗ — bản đầu bay thẳng ra 3 hướng không trúng ai (anh báo 25/10). Đạn của quái: chỉ nhắm người chơi
      if (d.move === 5 && m.src.enemy && !(m.tgt && m.tgt.alive)) {
        const had = !!m.tgt; m.tgt = m.src.who ? null : m.src.tkA && this.tk ? this.tkGanNhat(m, RETARGET_R) : this.vcNearMob(m.x, m.y, RETARGET_R); // Tống Kim: con gần nhất của phe kia
        if (!m.tgt && had) return this.misEnd(m, true);
      }
      // rơi (m.fall): chạm đất -> nổ + tan; còn cao hơn 20 thì chưa va chạm
      if (m.fall) {
        const F = m.fall; F.h += F.v * dk; F.v -= F.a * dk; m.z = Math.max(0, F.h) - (d.h || 0);
        if (F.h <= 0) { if (m.src.enemy && !m.src.k.show && !m.src.ao && d.explode) { this.misArea(m, m.x, m.y); this.misSnd(d, 3, m); } return this.misEnd(m, true); }
      }
      const high = m.fall && m.fall.h > FALL_COL_H;
      // bay
      if (m.lob) {
        const L = m.lob, k = Math.min(1, m.t / L.T);
        m.x = L.x0 + (L.x1 - L.x0) * k; m.y = L.y0 + (L.y1 - L.y0) * k; m.z = 4 * L.top * k * (1 - k); m.a = Math.atan2((L.y1 - L.y0) * 2, L.x1 - L.x0);
        if (k >= 1) { if (m.src.enemy && !m.src.k.show && !m.src.ao) { if (d.range) this.misArea(m, m.x, m.y); this.misSnd(d, 3, m); if (d.a[3] && !d.range) this.vfxAt(d.a[3].spr, d.a[3], { x: m.x, y: m.y }, d.h); } return this.misEnd(m, false); }
        return; // đang bay trên không: không va chạm
      }
      if (m.orbit) { const P = m.src.goc || m.src.who || this.player, R = m.orbit.R; m.orbit.ang += m.orbit.w * dk; m.x = P.x + Math.cos(m.orbit.ang) * R; m.y = P.y + (Math.sin(m.orbit.ang) * R) / 2; m.a = m.orbit.ang + Math.PI / 2; }
      else if (d.move === 1 || (d.move === 5 && !(m.tgt && m.tgt.alive))) { m.x += Math.cos(m.a) * m.speed * dk; m.y += (Math.sin(m.a) * m.speed * dk) / 2; }
      else if (d.move === 5) { // bám mục tiêu: quay dần về phía quái (mỗi vòng tối đa TURN) -> tia bay vòng cung, không quay ngoắt
        const want = Math.atan2((m.tgt.y - m.y) * 2, m.tgt.x - m.x);
        let da = want - m.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        // đã vào trong bán kính vòng quay (tốc độ / TURN) thì nhắm thẳng như engine (MISSLE_MMK_Follow nhắm lại thẳng mục tiêu mỗi 9 vòng) —
        // rẽ dần mãi thì đạn quay vòng quanh con đứng sát mà không chạm (Thiên Hạ Vô Cẩu, Phi Long Tại Thiên — anh 26/10)
        if (ldist(m.x, m.y, m.tgt.x, m.tgt.y) < (m.speed / TURN) * 1.5) m.a = want; else m.a += Math.max(-TURN * dk, Math.min(TURN * dk, da));
        m.x += Math.cos(m.a) * m.speed * dk; m.y += (Math.sin(m.a) * m.speed * dk) / 2;
      }
      else if (d.move === 100) { const G = m.src.goc || m.src.who || this.player, back = m.t > m.life / 2, a = back ? Math.atan2((G.y - m.y) * 2, G.x - m.x) : m.a; m.x += Math.cos(a) * m.speed * dk; m.y += (Math.sin(a) * m.speed * dk) / 2; }
      const moving = d.move !== 0 && m.speed > 0;
      // đạn bay QUA vật cản (cây, đá, nhà…), chỉ tan khi ra khỏi bản đồ (anh báo 26/10: chiêu mất khi quái đứng sát gốc cây). Vật cản của
      // client chia loại (file vùng: 4 bit cao = hình ô, 4 bit thấp = loại 1 / 2 / 4 — gần hết là loại 1 thường); lưới đi của gói chỉ còn
      // "chặn / không" nên không tách được loại chặn đạn (rất ít ô) -> bỏ hẳn, như ám khí đòn thường vẫn bay
      if (moving && (m.x < 0 || m.y < 0 || m.x > this.map.w || m.y > this.map.h)) return this.misEnd(m, true);
      // sự kiện bay: mỗi p2 vòng gọi chiêu (skill_flyevent [bật, mỗi n vòng, mã])
      const fe = m.src.fe !== undefined ? m.src.fe : lvAttrs(this.skDef(m.src.id), m.src.lv).skill_flyevent || (m.src.k.ev && m.src.k.ev.fly ? [1, 10, m.src.k.ev.fly] : null);
      // anh 17/11 ("tốc đánh đường môn cao mà cảm giác đánh chậm lắm, bão vũ"): như engine KMissle (fly event khi (m_nCurrentLife − m_nStartLifeTime) % FlyEventTime == 0)
      // phát NGAY khung bay đầu tiên rồi mỗi fe[1] khung — trước chỉ phát ở mốc fe[1]: Bạo Vũ Lê Hoa (sống 36, mỗi 30) mất đợt mưa đầu, còn 1 đợt và trễ 1,7 giây
      if (fe && fe[0] && fe[2] && fe[1] > 0 && (!m.fe0 || Math.floor(m.t / fe[1]) > Math.floor(t0 / fe[1])) && (m.fe0 = 1)) this.fire(fe[2], this.evLv(m), { ao: m.src.ao, goc: m.src.goc, ptA: m.src.ptA, tkA: m.src.tkA, root: m.src.root, x: m.x, y: m.y, tgt: m.tgt, pt: [m.x + Math.cos(m.a), m.y + Math.sin(m.a) / 2], depth: m.src.depth + 1, who: m.src.who, once: m.src.once, luot: m.src.luot });
      if (high) { /* đang rơi trên cao */ } else if (m.src.enemy && (m.src.k.show || m.src.ao)) {
        // chiêu "(ảnh động)" (ClientSend 2 — Phong Quyển Tàn Tuyết, Thiên Tế Tấn Lôi): chỉ vẽ, sát thương ở đạn chính. Chạm quái thì hiện
        // hình trúng / tan như đạn thật. Bản đầu tính sát thương cả 16 đạn ảnh động (Phong Quyển ~45 000 ở cấp 10)
        if (d.colVanish) for (const e of this.vcDich(m)) if (e.alive && inCells(m.x, m.y, e, Math.max(1, d.colR))) { this.misCollide(m, e); return this.misEnd(m, false); }
      } else if (m.src.enemy) {
        if (!moving && d.range && !d.colVanish) {
          // đạn đứng yên có sát thương vùng (Hàng Long Bất Vũ, Phật Quang Phổ Chiếu…): nổ lúc ra + mỗi DmgInterval vòng
          const k0 = d.dmgInt > 0 ? Math.floor(t0 / d.dmgInt) : 0, k1 = d.dmgInt > 0 ? Math.floor(m.t / d.dmgInt) : 0;
          if (t0 <= 0 || k1 > k0) this.misArea(m, m.x, m.y);
        } else {
          // đạn bay, hoặc đạn đứng yên trúng là mất (bẫy Đường Môn: nằm chờ tới khi quái bước vào ô va chạm thì nổ vùng quanh bẫy + gọi
          // chiêu va chạm rồi mất; bùa hại tại quái…)
          for (const e of this.vcDich(m)) {
            // va chạm: quái trong ±CollidRange ô quanh đạn (CollidRange 1: ±1 ô — CheckNearestCollision)
            if (!e.alive || !inCells(m.x, m.y, e, Math.max(1, d.colR))) continue;
            const last = m.hit.get(e); if (last != null && !(d.dmgInt > 0 && !MOT_LAN_DAN.has(m.src.root) && m.t - last >= d.dmgInt)) continue; // MOT_LAN_DAN: 1 lần / đạn
            // nổ vùng tâm tại CON TRÚNG. Engine nổ ở ô đạn (DmgRange > 1) mà vùng nổ ±DmgRange/2 ô nhỏ hơn vùng va chạm ±CollidRange ô
            // (2 cột thường ghi bằng nhau) -> con chạm ở mép vùng va chạm ngoài vùng nổ: đạn tan mà không mất máu (anh báo 26/10 Chu Cáp
            // Thanh Minh không sát thương, bẫy cũng vậy). Lấy tâm ở con trúng: con đó luôn ăn đòn, quái quanh nó trong vùng nổ cỡ engine
            if (d.range) this.misArea(m, e.x, e.y); else { m.hit.set(e, m.t); this.misHit(m, e); }
            this.misCollide(m, e);
            // trúng là tan (ColVanish): engine DoCollision -> hình tan + DoVanish -> vẫn gọi chiêu tan (skill_vanishedevent) — bản đầu bỏ qua
            // nên thiên thạch Thiên Ngoại Lưu Tinh nện trúng quái thì không ra bãi lửa Nghiệp Hỏa Phàn Thành (anh 26/10)
            if (d.colVanish) return this.misEnd(m, true);
            if (d.range) break;
          }
        }
      }
      if (m.t >= m.life) {
        if (moving && d.explode && d.range && !m.hit.size && m.src.enemy && !m.src.ao) this.misArea(m, m.x, m.y);
        this.misEnd(m, true);
      }
    },
    vcNearMob(x, y, R) { let best = null, bd = R; for (const e of this.mobs) { if (!e.alive || e.an) continue; const k = ldist(x, y, e.x, e.y); if (k < bd) { bd = k; best = e; } } return best; },
    // mục tiêu đạn có thể trúng: đạn người chơi -> quái; đạn của quái có võ công (m.src.who) -> người chơi; đạn Tống Kim (tkA) -> theo phe (tkbot.js tkDich)
    vcDich(m) { if (m.src.tkA && this.tk) return this.tkDich(m.src.tkA); return m.src.who ? (this.player.hp > 0 ? [this.player] : []) : this.mobs; },
    evLv(m) { const A = lvAttrs(this.skDef(m.src.id), m.src.lv); return (A.skill_eventskilllevel && A.skill_eventskilllevel[0]) || m.src.lv; },
    // sát thương vùng: ±DmgRange ô quanh tâm tới mép thân quái (vungO / inVung). 26/10 đã thu về đúng cỡ engine ±DmgRange/2 ô ("phạm vi cho
    // chính xác") -> 27/10 anh thấy chiêu vùng gần như đánh đơn (quái ở đây đứng thưa hơn client) nên nới lại
    misArea(m, x, y) {
      const n = vungO(m.d.dmgR);
      for (const e of this.vcDich(m)) {
        if (!e.alive || !inVung(x, y, e, n)) continue;
        const last = m.hit.get(e); if (last != null && !(m.d.dmgInt > 0 && !MOT_LAN_DAN.has(m.src.root) && m.t - last >= m.d.dmgInt)) continue;
        m.hit.set(e, m.t); this.misHit(m, e);
      }
      if (m.d.a[3] && m.d.move !== 0) this.vfxAt(m.d.a[3], m.d.a[3], { x, y }, zNow(m));
    },
    // trúng 1 con: hình trúng (bám theo con đó nếu ColFollowTarget), tiếng, sự kiện va chạm
    misCollide(m, e) {
      const d = m.d;
      if (d.a[3] && !d.range) this.vfxAt(d.a[3].spr, d.a[3], d.colFollow ? e : { x: e.x, y: e.y }, zNow(m));
      if (d.b[3] && d.multi) this.vfxAt(d.b[3].spr, d.b[3], d.colFollow ? e : { x: e.x, y: e.y }, zNow(m));
      this.misSnd(d, 3, m);
      const ce = this.evOf(m.src.id, m.src.lv, "collide");
      // đạn bay của chiêu va chạm không trúng lại con vừa va, hướng nối theo đạn cha (Thiên La Địa Võng tỏa 3 phi đao từ con trúng — bản
      // đầu 3 phi đao sinh ngay trên con đó, va luôn rồi tan, quái chết mới thấy bay ra — anh báo 26/10)
      if (ce) this.fire(ce, this.evLv(m), { ao: m.src.ao, goc: m.src.goc, ptA: m.src.ptA, tkA: m.src.tkA, root: m.src.root, x: e.x, y: e.y, tgt: e, skip: e, pt: [e.x + Math.cos(m.a) * 10, e.y + Math.sin(m.a) * 5], depth: m.src.depth + 1, who: m.src.who, once: m.src.once, luot: m.src.luot });
    },
    misEnd(m, vanish) {
      if (m.done) return; m.done = true;
      // đạn đứng yên chạy hình 1 lần (tia sét Ngũ Lôi Chánh Pháp, Lôi Động Cửu Thiên, Bình Địa Hám Lôi) trúng quái ngay khung đầu là tan:
      // client vẫn chiếu hết hình đạn tại chỗ (đạn chỉ bị xóa khi mọi hình đã chạy xong — KMissle::Paint) -> chiếu nốt hình bay; bản trước
      // tan liền nên chỉ thấy chớp nổ, không thấy sét đánh xuống (anh 26/10)
      const d = m.d;
      if (d.move === 0 && !d.loop && !m.fall && d.a[1] && m.t < m.life / 2) this.vfxAt(d.a[1].spr, d.a[1], { x: m.x, y: m.y }, zNow(m));
      if (vanish) {
        if (m.d.a[2]) this.vfxAt(m.d.a[2].spr, m.d.a[2], { x: m.x, y: m.y }, zNow(m));
        if (m.d.b[2] && m.d.multi) this.vfxAt(m.d.b[2].spr, m.d.b[2], { x: m.x, y: m.y }, zNow(m));
        this.misSnd(m.d, 2, m);
        const ve = this.evOf(m.src.id, m.src.lv, "vanish");
        if (ve) this.fire(ve, this.evLv(m), { ao: m.src.ao, goc: m.src.goc, ptA: m.src.ptA, tkA: m.src.tkA, root: m.src.root, x: m.x, y: m.y, tgt: m.tgt, pt: [m.x, m.y], depth: m.src.depth + 1, who: m.src.who, once: m.src.once, luot: m.src.luot });
        // nổ lại tại chỗ cho đủ số lần (LAP_LAI) — 1 lần cho cả loạt đạn
        const lap = LAP_LAI[m.src.id];
        if (lap && !m.src.lapDone && m.src.lap < lap(m.src.lv)) { m.src.lapDone = true; this.fire(m.src.id, m.src.lv, { ao: m.src.ao, goc: m.src.goc, ptA: m.src.ptA, tkA: m.src.tkA, root: m.src.root, x: m.x, y: m.y, tgt: m.tgt, pt: [m.x, m.y], depth: m.src.depth, lap: m.src.lap + 1, who: m.src.who, once: m.src.once, luot: m.src.luot }); }
      }
    },
    // tiếng đạn: đạn của quái có võ công nhỏ hơn (nhiều con cùng ra chiêu)
    misSnd(d, i, m) { const f = this.P.vc.sound(d.snd[i]); if (f) this.P.audio.play(f, m && (m.src.who || m.src.ao || m.src.ptA) ? 0.22 : 0.5); }, // đạn của quái / người khác / phân thân: nhỏ hơn
    // ---------- sát thương / trạng thái lên quái ----------
    misHit(m, e) {
      // giới hạn đòn mỗi mục tiêu mỗi lần ra chiêu (GIOI_HAN_DON — anh 11/11): đặt trước mọi nhánh (Tống Kim, phân thân, người chơi) để cùng luật. Vượt
      // giới hạn: không sát thương / trạng thái nhưng vẫn tính 1 lượt luyện kỹ năng như đòn trúng của người chơi (nhánh dưới), để tốc độ luyện không đổi
      const L = m.src.luot;
      if (L) {
        let c = L.dem.get(e); if (!c) L.dem.set(e, (c = {}));
        if ((c[m.src.id] = (c[m.src.id] || 0) + 1) > (GIOI_HAN_DON[m.src.root] || Infinity)) {
          if (!(m.src.tkA && this.tk) && !e.tkn && !m.src.who && !m.src.ptA && LUYEN.has(+m.src.root) && this.luyenDem && !(e.dummy && !e.coc)) this.luyenDem.set(+m.src.root, (this.luyenDem.get(+m.src.root) || 0) + 1);
          return;
        }
      }
      if (m.src.tkA && this.tk) return this.tkTrung(m, e); // Tống Kim: đạn của mình / bot / chiêu phe kia phát lại (tkbot.js)
      if (e.tkn && this.tk) return this.tkTrungNguoi(m, e); // Tống Kim: vòng sáng / cú lướt của mình trúng người phe kia — gửi thẳng (tkbot.js)
      if (m.src.who) return this.misHitHero(m); // đạn của quái có võ công trúng người chơi
      if (m.src.ptA) return this.ptTrung(m, e); // đạn của phân thân (Phân Thân — anh 05/11)
      const p = this.player, s = this.skDef(m.src.id), A = lvAttrs(s, m.src.lv);
      // boss (anh 16/11 — soát: trước chỉ chặn đòn trực tiếp, độc / bùa / choáng / hút vẫn dính): mình đứng xa hơn BOSS_TAM thì đạn trúng boss không gây gì cả
      if (e.kind === "mob" && laBossVc(e) && this.ganBoss && !this.ganBoss(p, e)) return;
      if (!Object.keys(A).some((k) => DMG.test(k))) return this.curseOn(e, m.src.id, m.src.lv, A); // bùa hại / chiêu chỉ gây trạng thái
      const r = this.skDamage(s, A, m.src, e);
      if (r.miss) return this.hit(p, e, r);
      this.hit(p, e, r);
      // hút sinh lực / nội lực: của võ công bị động mọi chiêu; của đồ (hutSinh / hutNoi) chỉ chiêu ngoại công (engine "Hut ... o ngoai cong");
      // + dòng hút của chính chiêu đang đánh (anh 12/11 "skill 90 của vân long kích không có tác dụng hút sinh nội lực" — steallife_p /
      // stealmana_p của Vân Long Kích, Thâu Thiên Hoán Nhật, Nhân Kiếm Hợp Nhất, chiêu 150; bản trước chỉ cộng của bị động + đồ).
      // Anh 13/11 lượt 87 ("nhân kiếm hợp nhất võ đang đánh quái k có hút mana"): hút ngay sau đòn trúng, cả đòn kết liễu — bản trước nằm sau "quái chết thì
      // thôi" nên đòn hạ quái (Nhân Kiếm Hợp Nhất 3 đạn, quái bãi thường chết ngay) không bao giờ hút; đòn thường (World.land) vốn hút cả đòn kết liễu
      this.hutChieu(s, A, r.v);
      // luyện kỹ năng (anh 29/10 — engine KNpc::ReceiveDamage "Luyen ky nang"): chiêu luyện trúng quái (cả cọc / mộc nhân như đảo Tẩy Tủy
      // của client) -> đếm theo chiêu gốc, gửi kèm nhịp (main.js takePending), máy chủ cộng độ luyện (may-chu/do.js luyenDon). 5 mộc nhân
      // Ba Lăng (mocnhan.js — dummy không phải cọc đảo) không tính (anh 29/10 lần 3: "đánh mộc nhân ở Ba Lăng không tính, trên đảo Tẩy Tủy thì được")
      if (LUYEN.has(+m.src.root) && this.luyenDem && !(e.dummy && !e.coc)) this.luyenDem.set(+m.src.root, (this.luyenDem.get(+m.src.root) || 0) + 1);
      if (!e.alive) return;
      // chiêu 120 tự phát khi đòn có độc / lửa (engine KNpc::ReceiveDamage autoattackskill — Ngũ Độc Hấp Tinh Yểm, Cái Bang Hỗn Thiên Khí Công)
      if (A.poisondamage_v || A.firedamage_v || (s.phys ? p.elem : p.elemMagic).fire > 0) this.trigAuto("autoattackskill", e);
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) e.stunUntil = Math.max(e.stunUntil || 0, this.time + (A.stun_p[1] || 9) * TICK);
      if (r.cold > 0) this.slowMob(e, this.quaiVC ? this.khungCham(A) : null);
      if (e.vaDoi && this.onVaTT) this.onVaTT(e); // Vượt Ải tổ đội: choáng / chậm vừa gây chuyển cho máy khác cùng ải (vadoi.js)
      if (A.poisondamage_v) {
        const po = this.poisonOf(s, A, m.src), res = this.khangDoc(e), dur = po.dur * (1 - this.mobMod(e, "poisontimereduce_p") / 100);
        // độc CỘNG DỒN (anh báo 26/10 bẫy độc sai sát thương — bản đầu mỗi lần trúng ghi đè độc cũ, bẫy Độc Thích Cốt nổ 5 lần mà quái chỉ
        // chịu 1 lớp): mỗi lần trúng là 1 lớp riêng (điểm / lần, hết hạn riêng), mỗi nhịp mất tổng các lớp còn hạn
        // hết hạn dư nửa nhịp: lần trúng đúng lúc hết thời gian vẫn tính — đủ thời gian / nhịp lần như engine (nTime đếm 60 → 0, trúng ở 50, 40 … 0
        // — 6 lần; bản trước bỏ mất lần cuối, chỉ 5) = số "Lực tay" đang hiện (anh 30/10)
        const ev = po.every * TICK, layer = { v: Math.max(1, Math.floor(((po.v * (100 - res)) / 100) * this.serK(s, A, m.src, e))), until: this.time + Math.max(1, dur) * TICK + ev / 2 };
        const P0 = e.poison && e.poison.until > this.time ? e.poison : null;
        e.poison = P0 ? { ...P0, list: [...P0.list, layer], every: Math.min(P0.every, ev), until: Math.max(P0.until, layer.until) } : { list: [layer], every: ev, next: this.time + ev, until: layer.until };
      } else {
        // chiêu không có độc mà đồ có "Độc sát - ngoại / nội công" (anh 30/10): engine vẫn gắn độc của đồ vào đòn — N điểm mỗi 10 vòng trong
        // 60 vòng (KNpcAttribModify defPOISON_DAMAGE_INTERVAL / TIME) — như đòn thường (World.docDon)
        // anh 17/11 ("CBR mang vũ khí độc sát nội đánh ra độc sát"): chỉ đồ NGOẠI công gắn độc vào chiêu ngoại không có độc; độc sát nội của đồ / hoàn chỉ vào chiêu nội CÓ độc (poisonOf)
        const add = s.phys ? p.elem.poison || 0 : 0;
        if (add > 0 && e.alive) this.docDon(e, Math.max(1, Math.floor(((add * (100 - this.khangDoc(e))) / 100) * this.serK(s, A, m.src, e))));
      }
      // chiêu không có bùa riêng mà có dòng âm (vd Vô Hình Độc làm chậm): gắn như bùa hại
      const neg = Object.fromEntries(Object.entries(A).filter(([k, v]) => !DMG.test(k) && v[1] > 0 && v[0] < 0 && !/^(skill_|missle_|addskill|seriesdamage|stun_p|deadlystrike)/.test(k)));
      if (Object.keys(neg).length) this.curseOn(e, m.src.id, m.src.lv, neg);
    },
    // hút sinh lực / nội lực của mình sau đòn chiêu gây v sát thương (misHit; Tống Kim: tkTrung — anh 12/11 "vân long kích … nhân kiếm hợp nhất … cơ chế hút,
    // nhưng chưa có hiệu quả": trong trận chiêu trúng bot / quân / người phe kia trước không hút gì, chỉ đòn thường có)
    hutChieu(s, A, v) {
      const p = this.player; if (!(v > 0) || p.hp <= 0) return;
      const hs = (p.lifeSteal || 0) + (s.phys ? p.hutSinh || 0 : 0) + ((A.steallife_p && A.steallife_p[0]) || 0);
      const hn = (p.manaSteal || 0) + (s.phys ? p.hutNoi || 0 : 0) + ((A.stealmana_p && A.stealmana_p[0]) || 0);
      if (hs > 0) p.hp = Math.min(p.hpMax, p.hp + ((v * hs) / 100) * this.hoiK());
      if (hn > 0) p.mp = Math.min(p.mpMax, p.mp + (v * hn) / 100);
    },
    // đạn của phân thân (Phân Thân — anh 05/11, src/game/nhanvatmay.js) trúng quái: như misHit nhưng sát thương / độc / băng tính bằng chỉ số + võ
    // công của người bị sao chép (voiPhanThan), đòn ghi cho phân thân (World.hit src.pt: quái chung gửi riêng mục dp, giết -> r[7] — người thuê đủ
    // kinh nghiệm, không tiền / đồ). Độc / bùa hại ghi nguồn pt (mobTick). Không luyện kỹ năng, không chiêu 120 tự phát, không hút sinh lực / nội lực
    ptTrung(m, e) {
      // mộc nhân / cọc, boss thế giới, nhím, quái canh cây, quân Phong Hỏa: phân thân không đánh (World.hit) -> cũng không choáng / chậm / độc / bùa hại
      // (soát 05/11: trước vẫn gắn độc -> mobTick ghi cả lượt độc cho phân thân, World.hit bỏ -> độc của người thuê lên boss mất theo)
      if (e.dummy || e.coc || e.btg || e.nhim || e.mcv || e.ph) return;
      const a = m.src.ptA, s = this.skDef(m.src.id), A = lvAttrs(s, m.src.lv);
      if (laBossVc(e) && this.ganBoss && !this.ganBoss(a, e)) return; // boss: phân thân cũng phải đứng trong BOSS_TAM (anh 16/11 — a có tọa độ, a.p chỉ là chỉ số)
      const buaPt = (B) => { const c = this.curseOn(e, m.src.id, m.src.lv, B); if (c) c.pt = a.p; };
      if (!Object.keys(A).some((k) => DMG.test(k))) return buaPt(A); // bùa hại / chiêu chỉ gây trạng thái
      if (e.sat) return; // Boss Sát thủ: phân thân chỉ hỗ trợ — bùa hại vào được, sát thương thì không (anh 13/11 — nhanvatmay.js ptTimBoss)
      const r = this.voiPhanThan(a, () => this.skDamage(s, A, m.src, e));
      this.hit(a.p, e, r);
      if (r.miss || !e.alive) return;
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) e.stunUntil = Math.max(e.stunUntil || 0, this.time + (A.stun_p[1] || 9) * TICK);
      if (r.cold > 0) this.voiPhanThan(a, () => this.slowMob(e, this.quaiVC ? this.khungCham(A) : null));
      if (e.vaDoi && this.onVaTT) this.onVaTT(e);
      const k = this.voiPhanThan(a, () => this.serK(s, A, m.src, e));
      if (A.poisondamage_v) {
        const po = this.voiPhanThan(a, () => this.poisonOf(s, A, m.src)), res = this.khangDoc(e, a.p), dur = po.dur * (1 - this.mobMod(e, "poisontimereduce_p") / 100);
        const ev = po.every * TICK, layer = { v: Math.max(1, Math.floor(((po.v * (100 - res)) / 100) * k)), until: this.time + Math.max(1, dur) * TICK + ev / 2, pt: a.p };
        const P0 = e.poison && e.poison.until > this.time ? e.poison : null;
        e.poison = P0 ? { ...P0, list: [...P0.list, layer], every: Math.min(P0.every, ev), until: Math.max(P0.until, layer.until) } : { list: [layer], every: ev, next: this.time + ev, until: layer.until };
      } else {
        const add = s.phys ? a.p.elem.poison || 0 : 0; // như trên: độc sát nội chỉ vào chiêu nội có độc (anh 17/11)
        if (add > 0) this.docDon(e, Math.max(1, Math.floor(((add * (100 - this.khangDoc(e, a.p))) / 100) * k)), a.p);
      }
      const neg = Object.fromEntries(Object.entries(A).filter(([key, v]) => !DMG.test(key) && v[1] > 0 && v[0] < 0 && !/^(skill_|missle_|addskill|seriesdamage|stun_p|deadlystrike)/.test(key)));
      if (Object.keys(neg).length) buaPt(neg);
    },
    // chạy fn với "người ra chiêu" là phân thân a (chỉ số a.p, võ công a.H, hỗ trợ từ kỹ năng khác a.sup, vũ khí a.wk): công thức sát thương
    // (skDamage, elemOf, poisonOf, serK, noiK, slowMob…) đọc this.player / this.hero -> dùng nguyên công thức; trả lại như cũ kể cả khi lỗi
    voiPhanThan(a, fn) {
      const P0 = this.player, H0 = this.hero, S0 = this.vcSupport, W0 = this.wk;
      this.player = a.p; this.hero = a.H; this.vcSupport = a.sup; this.wk = a.wk;
      try { return fn(); } finally { this.player = P0; this.hero = H0; this.vcSupport = S0; this.wk = W0; }
    },
    // kháng hệ k của quái sau bùa hại (giảm kháng + giảm mức kháng tối đa)
    mobRes(e, k) {
      const key = { phys: "physicsres", cold: "coldres", fire: "fireres", light: "lightingres", poison: "poisonres" }[k];
      // người phe kia Tống Kim (e.resGoc — tongkim.js datNguoi, rà soát 12/11): giảm trên kháng gốc rồi chặn trần của chính họ (như tkThu máy họ); quái / bot: như cũ (trần 95)
      const all = this.mobMod(e, "allres_yan_p") + this.mobMod(e, "allres_p"), cap = (e.resGoc ? (e.resCap ? e.resCap[k] ?? 75 : 75) : 95) + this.mobMod(e, key + "max_p") + this.mobMod(e, "allresmax_p");
      const v = ((e.resGoc ? e.resGoc[k] : e.res[k]) || 0) + this.mobMod(e, key + "_yan_p") + this.mobMod(e, key + "_p") + all;
      return e.resGoc ? khangThat(v, cap) : Math.min(cap, v); // người chơi phe kia: dư trần mỗi 10 % -> +1 % (rules.js khangThat — anh 13/11)
    },
    // kháng độc của mục tiêu e trước người đánh p (mặc định mình): trừ "bỏ qua độc phòng" của p (anh 17/11 — Ngũ Độc Kỳ Kinh)
    khangDoc(e, p = this.player) { return this.mobRes(e, "poison") - ((p && p.boQuaDoc) || 0); },
    mobMod(e, k) { let v = 0; if (e.curse) for (const c of e.curse) if (c.until > this.time && c.attrs[k]) v += c.attrs[k][0]; return v; },
    // ---------- chiêu 120 tự phát (anh 26/10) ----------
    // Dòng autoattackskill / autoreplyskill / autorescueskill của chiêu đã học (bị động, hoặc bùa đang bật) = [(mã << 8) + cấp, −1, (vòng hồi
    // << 8) + tỉ lệ %]: đủ tỉ lệ và hết hồi thì tự ra chiêu mã đó. Engine (KNpc::ReceiveDamage): autoreply khi bị địch đánh, autoattack khi đòn
    // của mình có độc / lửa, autorescue khi sinh lực < 25 % (bản máy chủ này để trống lời gọi — làm theo mô tả của chiêu)
    trigAuto(key, e) {
      const p = this.player, cd = (p.trigCd = p.trigCd || {});
      for (const [sid, lv] of Object.entries(skCong(this.hero, this.P.skillDb))) { // + cấp Báo Đáp Ân Sư (anh 16/11)
        const s = this.skDef(sid); if (!s || !(lv > 0)) continue;
        // autodeathskill (Thiên Nhẫn Ma Âm Phệ Phách — dòng không hết hạn, có từ lần ra chiêu đầu): chết thì tự phát chiêu Hoảng loạn (anh 10/11 soát chiêu 120)
        if (key === "autodeathskill" ? !(p.cd && p.cd[sid]) : s.style !== 3 && !p.buffs.has(+sid)) continue;
        const a = lvAttrs(s, lv)[key]; if (!a || !(a[0] >> 8)) continue;
        const id = (a[0] >> 8) & 0xffff, tl = a[0] & 0xff, wait = a[2] >> 8, rate = a[2] & 0xff;
        if ((cd[sid] || 0) > this.time || Math.random() * 100 >= rate) continue;
        cd[sid] = this.time + wait * TICK;
        this.trigCast(id, tl, e);
      }
    },
    // ra chiêu tự phát: chiêu lên mình (Lưỡng Nghi Chân Khí_Ma Pháp Độn + Gia Tốc) = bùa có hạn + chiêu Start của nó; chiêu đánh địch phát từ
    // chỗ mình (kiểu 7 — Sư Tử Hống) hoặc tại con vừa trúng (Quyết Chú: bùa hại + hình trạng thái trên quái)
    trigCast(id, lv, e) {
      const s = this.skDef(id), k = this.P.vc && this.P.vc.sk(id), p = this.player; if (!s || !k) return;
      if (!s.target.enemy) {
        this.buffOn(id, lv); const st = this.evOf(id, lv, "start"); if (st) this.buffOn(st, lv);
        // anh 13/11 lượt 88 (Côn Lôn 120 "khi kích phát … rất trâu bò"): báo cho thấy chiêu vừa tự phát (Lưỡng Nghi Chân Khí — nội lực đỡ sát thương 5 giây)
        if (p.buffs.has(id)) this.text(p, String(s.n || "").split("_")[0].trim() || "Kích phát", "#9fd8ff");
        return;
      }
      const at = k.form === 7 ? p : e || p;
      this.fire(id, lv, { root: id, x: at.x, y: at.y, tgt: e && e.alive ? e : null, pt: e ? [e.x, e.y] : [p.x + 1, p.y], depth: 1 });
      if (this.tk && this.tk.guiChieu) this.tk.guiChieu("", id, lv, p.x, p.y, e ? e.x : p.x + 1, e ? e.y : p.y, e && e.tkn ? e.tkn : ""); // Tống Kim: người phe kia phát lại (gốc = chỗ mình — anh 12/11)
      const snd = k.snd && this.P.vc.sound(this.hero.sex === "f" ? k.snd[1] || k.snd[0] : k.snd[0] || k.snd[1]); if (snd) this.P.audio.play(snd, 0.6);
    },
    // Lưỡng Nghi Chân Khí (staticmagicshield_p 50000 = "chống lại sát thương gấp 500 lần mức nội lực"): đòn trúng mình trừ nội lực thay sinh
    // lực, mỗi điểm nội lực đỡ p1 / 100 sát thương; hết nội lực thì phần còn lại vào sinh lực -> trả sát thương còn lại
    shieldTake(v) {
      const p = this.player; let k = 0;
      for (const b of p.buffs.values()) if (b.until > this.time && b.attrs.staticmagicshield_p) k = Math.max(k, b.attrs.staticmagicshield_p[0] / 100);
      if (!k || !(p.mp > 0)) return v;
      const need = v / k; if (p.mp >= need) { p.mp -= need; return 0; }
      const left = v - p.mp * k; p.mp = 0; return Math.ceil(left);
    },
    // ngũ hành 1 đòn của chiêu s: dòng của chiêu + cộng từ đồ (ngoại công p.elem, nội công p.elemMagic) -> [[loại, thấp, cao]]
    elemOf(s, A) {
      const p = this.player, extra = s.phys ? p.elem : p.elemMagic, hoan = (s.phys ? p.hoanElem : p.hoanMagic) || {}, out = [];
      for (const [key, t] of Object.entries(ELEM)) {
        // hoàn: chỉ khi chiêu có hệ này; đồ NỘI công cũng vậy (anh 17/11 "còn nội công thì theo luật anh đưa"), đồ ngoại công cộng mọi chiêu ngoại như engine
        const a = A[key], add = (s.phys ? extra[t] || 0 : 0) + (a ? (s.phys ? 0 : extra[t] || 0) + (hoan[t] || 0) : 0); if (!a && !add) continue;
        let lo = (a ? a[0] : 0) + add, hi = (a ? a[2] || a[0] : 0) + add;
        if (t === "fire") hi *= 1 + (p.enh.fire || 0) / 100;
        if (t === "light") lo = Math.min(hi, lo * (1 + (p.enh.light || 0) / 100));
        out.push([t, lo, hi]);
      }
      return out;
    },
    // độc 1 lần trúng (dòng poisondamage_v [điểm, thời gian, nhịp] của chiêu s): như engine KNpc::AppendSkillEffect — điểm của chiêu ×
    // (1 + "Hỗ trợ từ các kỹ năng khác") + độc cộng từ đồ / trấn phái (không nhân hỗ trợ). Bản đầu không nhân hỗ trợ nên chiêu độc cao
    // cấp (Âm Phong Thực Cốt +65 %, Huyền Âm Trảm +120 % ở cấp 20) yếu hơn game thật (anh 26/10). -> { v: điểm / nhịp, every, dur (vòng) }
    poisonOf(s, A, src) {
      const p = this.player, [v0, tm, every] = A.poisondamage_v, add = (s.phys ? p.elem.poison || 0 : p.elemMagic.poison || 0) + (((s.phys ? p.hoanElem : p.hoanMagic) || {}).poison || 0); // + hoàn Độc (chiêu có độc)
      const sup = this.supDon(src);
      return { v: (v0 * (1 + sup / 100) + add) * this.noiK(s) * this.kyK(s, src), every: Math.max(1, every || 9), dur: (tm || 54) * (1 + (p.enh.poison || 0) / 100) };
    },
    // luật riêng S1 (anh 29/10 "Nội công tăng sát thương nội công" — engine không có: Nội công chỉ cộng nội lực): chiêu nội công (không
    // IsPhysical) × (1 + Nội công × noiCong %), cả độc; chiêu ngoại công giữ như engine (Sức mạnh / 5 cộng vào sát thương vũ khí)
    noiK(s) { return s && !s.phys && this.noiCong > 0 ? 1 + ((this.player.eng || 0) * this.noiCong) / 100 : 1; },
    // thông số kỹ năng từng phái do quản trị chỉnh (anh 11/11 — cau-hinh.json kyNangPhai, F10 → Cấu hình → Kỹ năng phái): % của phái chiêu thuộc về × % của
    // chiêu (chiêu con tính theo chiêu gốc src.root / src.id); không có -> 1
    kyK(s, src) {
      const K = this.kyNang; if (!K || !s) return 1;
      const id = (src && (src.root || src.id)) || s.id;
      if (!this._facOf) this._facOf = new Map((this.P.factions || []).flatMap((f) => f.skills.map((x) => [x, f.key])));
      const fk = this._facOf.get(+id) || this._facOf.get(+s.id) || (this.hero && this.hero.facKey), p = K.phai && fk != null ? +K.phai[fk] : NaN, c = K.chieu ? +K.chieu[id] : NaN;
      return (p > 0 ? p / 100 : 1) * (c > 0 ? c / 100 : 1);
    },
    // "Lực tay trái / phải" của bảng Thuộc tính (engine KPlayer::GetEchoDamage — anh 26/10: bản đầu 2 ô cùng lực vũ khí, đổi chiêu không
    // đổi): 1 đòn của chiêu ở ô tay đó tính như skDamage (vật lý × % chiêu, ngũ hành của chiêu + đồ, × hỗ trợ từ kỹ năng khác) + trọn độc
    // của 1 lần trúng (engine: điểm × thời gian / nhịp); chưa trừ kháng / tương khắc / chí mạng. Chiêu không có dòng sát thương thì lấy chiêu
    // con (Thiên Vương…). Ô trống / chưa học: đòn thường (lực vũ khí); bùa / vòng sáng không gây sát thương: 0
    handDamage(id) {
      const p = this.player;
      let s = id && this.skDef(id), lv = id ? this.skLv(id) : 0;
      if (!s || lv < 1 || !this.P.vc) return [p.dmg[0], p.dmg[1]];
      for (let i = 0; s && i < 4 && !Object.keys(lvAttrs(s, lv)).some((k) => DMG.test(k)); i++) {
        const k = this.P.vc.sk(s.id); if (!k || !k.kid) { s = null; break; }
        lv = k.kidLv > 0 ? k.kidLv : lv; s = this.skDef(k.kid);
      }
      if (!s) return [0, 0];
      const A = lvAttrs(s, lv), e = A.physicsenhance_p ? 1 + A.physicsenhance_p[0] / 100 : 0, sup = 1 + ((this.vcSupport && this.vcSupport[id]) || 0) / 100;
      let lo = p.dmg[0] * e, hi = p.dmg[1] * e;
      if (A.physicsdamage_v) { lo += A.physicsdamage_v[0]; hi += A.physicsdamage_v[2] || A.physicsdamage_v[0]; }
      if (!s.phys && (A.physicsenhance_p || A.physicsdamage_v)) { const vn = ((p.elemMagic && p.elemMagic.physics) || 0) + ((p.hoanMagic && p.hoanMagic.physics) || 0); lo += vn; hi += vn; } // vật lý nội công của đồ + hoàn (skDamage)
      for (const [, l, h] of this.elemOf(s, A)) { lo += l; hi += h; }
      const kk = this.kyK(s, { root: id }); lo *= sup * this.noiK(s) * kk; hi *= sup * this.noiK(s) * kk;
      if (A.poisondamage_v) { const po = this.poisonOf(s, A, { root: id }), tot = po.v * Math.floor(po.dur / po.every); lo += tot; hi += tot; }
      return [Math.floor(lo), Math.floor(hi)];
    },
    // hệ số ngũ hành tương khắc của chiêu lên quái e: 1 + (X nếu hệ chiêu khắc hệ quái, −X nếu hệ quái khắc hệ chiêu) + "tăng sát thương
    // lên hệ …" của đồ / trấn phái. Engine nhân vào MỌI loại sát thương kể cả độc (KNpc::ReceiveDamage -> CalcDamage(…, SeriesDamage, …)) —
    // bản đầu chỉ nhân phần ra ngay, chiêu độc Ngũ Độc (Âm Phong Thực Cốt, Huyền Âm Trảm) không ăn tương khắc mà quái Kim lại kháng độc
    // âm (script cấp quái client) nên đánh Kim nhanh hơn hệ khác (anh 26/10)
    // % "Hỗ trợ từ các kỹ năng khác" của 1 đòn (anh 10/11 — người chơi báo chiêu 30 / 60 Côn Lôn, Nga My, Ngũ Độc không cộng cho chiêu 90): phần của chiêu gốc + dòng
    // nhắm đúng đòn con theo sự kiện (vd Thiên Cương Địa Sát -> Thiên Cương Độc Thủ, đòn nổ của Âm Phong Thực Cốt). Dòng ghi trùng số cho chiêu gốc (Kinh Lôi Trảm -> 322 và
    // 326) đã tính trong phần chiêu gốc; đòn ChildSkillId nhận thẳng phần chiêu gốc như engine (KNpc.cpp pChildSkill->m_nEnChance)
    supDon(src) {
      const S = this.vcSupport; if (!S) return 0;
      const goc = S[src.root] || 0; if (src.id === src.root || !S.dong) return goc;
      const k = src.root + "|" + src.id; let r = S.nho.get(k);
      if (r === undefined) {
        const rs = this.skDef(src.root), cua = S.dong[src.root] || [];
        r = rs && rs.sub && +rs.sub.child === +src.id ? 0 : (S.dong[src.id] || []).reduce((t, [sid, p]) => t + (cua.some(([s2, p2]) => s2 === sid && p2 === p) ? 0 : p), 0);
        S.nho.set(k, r);
      }
      return goc + r;
    },
    serK(s, A, src, e) {
      const p = this.player, rs = this.skDef(src.root), rA = src.root !== src.id ? lvAttrs(rs, this.skLv(src.root) || src.lv) : A;
      const se = s && s.series >= 0 ? s.series : rs && rs.series >= 0 ? rs.series : this.hero.series;
      const X = (A.seriesdamage_p && A.seriesdamage_p[0]) || (rA.seriesdamage_p && rA.seriesdamage_p[0]) || 0;
      const ser = (KHAC[se] === e.series ? X : KHAC[e.series] === se ? -X : 0) + (p.vsSeries[e.series] || 0);
      return Math.max(0.1, 1 + ser / 100);
    },
    skDamage(s, A, src, e) {
      const p = this.player, k = this.P.vc.sk(src.id) || {};
      if (k.useAR) {
        const ar = p.ar * (1 + ((A.attackrating_p && A.attackrating_p[0]) || 0) / 100), def = Math.max(0, e.def + this.mobMod(e, "adddefense_v"));
        if (Math.random() * 100 >= hitPercent(ar, def * (1 - Math.min(100, (p.ignoreDef || 0) + ((A.ignoredefense_p && A.ignoredefense_p[0]) || 0)) / 100))) return { miss: true };
      }
      let v = 0, cold = 0;
      // "Sát thương vật lý - nội công" của đồ (anh 30/10): cộng vào phần vật lý mỗi đòn của chiêu nội công (engine m_CurrentPhysicsMagicDamageV)
      // + Nội Phổ hoàn (anh 17/11): chỉ chiêu nội công CÓ phần vật lý (Thúy Yên song đao, Thiếu Lâm…); vật lý nội của đồ: mọi chiêu nội công như engine
      const vlNoi = s.phys || !(A.physicsenhance_p || A.physicsdamage_v) ? 0 : ((p.elemMagic && p.elemMagic.physics) || 0) + ((p.hoanMagic && p.hoanMagic.physics) || 0); // đồ + hoàn: chiêu nội có vật lý
      if (A.physicsenhance_p || A.physicsdamage_v || vlNoi) {
        let ph = A.physicsenhance_p ? ri(p.dmg[0], p.dmg[1]) * (1 + A.physicsenhance_p[0] / 100) : 0;
        if (A.physicsdamage_v) ph += ri(A.physicsdamage_v[0], A.physicsdamage_v[2] || A.physicsdamage_v[0]);
        ph += vlNoi;
        v += Math.max(0, (ph * (100 - this.mobRes(e, "phys"))) / 100);
      }
      for (const [t, lo, hi] of this.elemOf(s, A)) {
        const x = Math.max(0, (rnd(lo, hi) * (100 - this.mobRes(e, t))) / 100);
        v += x; if (t === "cold") cold = x;
      }
      const sup = this.supDon(src);
      // ngũ hành tương khắc của chiêu (seriesdamage_p, X %): đánh hệ mình khắc +X %, đánh hệ khắc mình −X % (anh 26/10: chiêu Kim đánh Mộc
      // đau hơn, đánh Hỏa nhẹ hơn — bản đầu chỉ cộng, mà quái Hỏa kháng vật lý âm theo script client nên Thiên Vương chém Hỏa nhanh hơn Mộc).
      // Hệ = hệ của chiêu (Thiên Vương: Kim), chiêu không hệ thì hệ nhân vật
      // Chiêu con (Thiên Vương: 405, 327…) không ghi tương khắc / hệ -> lấy của chiêu chính (src.root, cấp đang học) — bản đầu đọc ở chiêu
      // con nên chiêu Thiên Vương không có tương khắc
      // nhân riêng: (1 + hỗ trợ) × (1 ± tương khắc) — cộng chung với "Hỗ trợ từ các kỹ năng khác" (vd 195 %) thì −60 % gần như mất tác dụng
      v *= (1 + sup / 100) * this.serK(s, A, src, e) * this.noiK(s) * this.kyK(s, src);
      const crit = Math.random() * 100 < ((A.deadlystrike_p && A.deadlystrike_p[0]) || 0) + (p.crit || 0);
      if (crit) v *= 2;
      if (!v) return { v: 0, none: true }; // chỉ có độc: không hiện số (bản đầu hiện "1"), độc gắn sau ở misHit
      return { v: Math.max(1, Math.floor(v)), crit, cold, hurt: k.doHurt || 0 };
    },
    // bùa hại lên quái: dòng của chiêu (âm) trong p2 vòng (dài nhất); cùng chiêu thì thay
    curseOn(e, id, lv, A) {
      const dur = Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0)));
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) e.stunUntil = Math.max(e.stunUntil || 0, this.time + (A.stun_p[1] || 9) * TICK);
      if (e.vaDoi && this.onVaTT) this.onVaTT(e);
      if (!dur) return;
      e.curse = (e.curse || []).filter((c) => c.id !== id && c.until > this.time);
      const k = this.P.vc.sk(id);
      const c = { id, attrs: A, until: this.time + dur * TICK, st: k ? k.state : 0 };
      e.curse.push(c); e.aggro = true;
      return c; // ptTrung: ghi nguồn phân thân vào đúng mục này
    },
    // trạng thái của quái mỗi bước: độc mất máu, bùa hút máu (lifereplenish_v âm, mỗi nửa giây), choáng (đứng yên). Trả true khi đang
    // choáng (bỏ lượt hành động)
    mobTick(m, dt) {
      if (m.poison) {
        if (m.poison.until <= this.time) m.poison = null;
        else if (m.poison.next <= this.time) {
          m.poison.next += m.poison.every; m.poison.list = m.poison.list.filter((l) => l.until > this.time);
          const v = m.poison.list.reduce((t, l) => t + l.v, 0);
          // độc của phân thân (lớp pt — ptTrung / docDon): tách 2 đòn — phần của mình trước, phần của phân thân sau; con chết ở đòn nào ghi cho bên
          // đó (soát 05/11: bản gộp theo bên nhiều hơn làm 51 % độc phân thân thành phân thân giết, độc của mình lên boss mất theo đòn phân thân)
          const lp = m.poison.list.filter((l) => l.pt), vp = lp.reduce((t, l) => t + l.v, 0);
          if (v - vp > 0) { this.hit(this.player, m, { v: v - vp, poison: true }); if (!m.alive) return true; }
          if (vp > 0 && this.tk) { const by = new Map(); for (const l of lp) by.set(l.pt, (by.get(l.pt) || 0) + l.v); for (const [pt, v2] of by) { this.hit(pt, m, { v: v2, poison: true }); if (!m.alive) return true; } } // Tống Kim: mỗi kẻ đánh 1 đòn (soát 05/11)
          else if (vp > 0) { this.hit(lp[0].pt, m, { v: vp, poison: true }); if (!m.alive) return true; }
        }
      }
      if (m.curse && m.curse.length) {
        m.curse = m.curse.filter((c) => c.until > this.time);
        const drain = this.mobMod(m, "lifereplenish_v");
        if (drain < 0 && (m.drainT = (m.drainT || 0) + dt) >= 0.5) { // bùa hút máu: phần của mình / của phân thân tách 2 đòn như độc
          m.drainT -= 0.5;
          const cp = m.curse.filter((c) => c.pt && c.attrs.lifereplenish_v && c.attrs.lifereplenish_v[0] < 0), dp = -cp.reduce((t, c) => t + c.attrs.lifereplenish_v[0], 0);
          if (-drain - dp > 0) { this.hit(this.player, m, { v: -drain - dp, poison: true }); if (!m.alive) return true; }
          if (dp > 0 && this.tk) { const by = new Map(); for (const c of cp) by.set(c.pt, (by.get(c.pt) || 0) - c.attrs.lifereplenish_v[0]); for (const [pt, v2] of by) { this.hit(pt, m, { v: v2, poison: true }); if (!m.alive) return true; } }
          else if (dp > 0) { this.hit(cp[0].pt, m, { v: dp, poison: true }); if (!m.alive) return true; }
        }
      }
      if (m.mienChoang && m.stunUntil) m.stunUntil = 0; // miễn choáng (boss thế giới — anh 13/11 lượt 86, bosstg.js)
      if (m.mienCham && m.slowUntil) m.slowUntil = 0; // miễn chậm (siêu boss sự kiện — anh 18/11)
      if ((m.stunUntil || 0) > this.time) { if (m.act !== "hurt") this.setAct(m, "stand"); m.path = null; return true; }
      return false;
    },
    // đòn có băng sát (của chiêu, hoặc "Băng sát ngoại công / nội công" cộng thêm từ đồ, bùa — Như Lai Thiên Diệp trấn phái Thiếu Lâm)
    // trúng là làm chậm, kể cả đòn thường; "Thời gian làm chậm %" (coldenhance_p) kéo dài. Bản đầu chỉ làm chậm khi đạn ghi CanSlow —
    // cột đó là đạn CÓ BỊ làm chậm không (đạn bay), không phải gây làm chậm -> Kim Cang Phục Ma, Hàng Long Bất Vũ, Long Trảo Hổ Trảo,
    // Phong Sương… có băng sát mà quái không chậm (anh báo 25/10)
    // f = số khung chậm (khungCham — quái có võ công bật, như engine); null = cách cũ (TẠM)
    slowMob(e, f) {
      if (!e.alive) return;
      if (f == null) { e.slowUntil = Math.max(e.slowUntil || 0, this.time + SLOW_T * TICK * (1 + (this.player.enh.cold || 0) / 100)); return; }
      if (f <= 0 || (e.slowUntil || 0) > this.time) return; // engine: đang chậm thì trúng nữa không làm mới
      e.slowUntil = this.time + ((f * (100 - Math.min(77, this.mobMod(e, "freezetimereduce_p")))) / 100) * TICK;
    },
    // Băng sát làm chậm: số khung chậm = khung băng của chiêu (colddamage_v cột 2 — đa số chiêu = 0), ít nhất CHAM_MIN 60 khung (defNORMAL_COLD_TIME
    // của engine — mốc client, 3,3 giây) + "Thời gian trì hoãn" (coldenhance_p — cộng thẳng khung: Thúy Yên Băng Cốt Tuyết Tâm, Nga Mi Phật Pháp Vô
    // Biên, Kim Chung Tráo, Như Lai Thiên Diệp). Anh 31/10: "chỉ cần có băng sát — bị động, chiêu chủ động hay vũ khí — đều làm chậm" (bản 29/10:
    // chỉ đòn ngoại công có Băng sát của đồ mới có mốc 60, chiêu băng cấp thấp của Nga My không làm chậm). A = dòng của chiêu trúng (đòn thường: null)
    khungCham(A) {
      const p = this.player, enh = (p.enh && p.enh.cold) || 0, sk = (A && A.colddamage_v && A.colddamage_v[1]) || 0;
      return Math.max(sk, CHAM_MIN) + enh;
    },
    // ---------- quái có võ công (anh 29/10 lần 4 — BẢN MẪU: anh duyệt trên máy rồi mới bật ở máy chủ; cau-hinh.json quaiVoCong -> this.quaiVC) ----------
    // gán chiêu lúc sinh quái: 1 trong 2 phái cùng hệ ngũ hành với con quái (chọn theo mã quái + hệ -> mỗi loại quái cố định), chiêu 1x (quái
    // thường) / 6x (trùm, Boss Sát thủ) theo mã quái; cấp chiêu = cấp quái / capChieu (1–20). m.vc = { id, lv, he (hệ sát thương), doc { f, e }
    // (khung độc, mỗi e khung 1 lần), choang [% , khung], giat % | null }. Chiêu xa: quái đứng ở tầm chiêu (tối đa 400 đơn vị client)
    ganVoCong(m) {
      const C = this.quaiVC, db = this.P.skillDb || {}; if (!C || m.dummy) return;
      const ma = Math.abs(m.id | 0) + (m.series | 0), ph = (C.phai || {})[m.series] || [], fac = ph[ma % Math.max(1, ph.length)];
      const ds = ((m.boss || m.sat ? C.chieu6x : C.chieu1x) || {})[fac] || [], id = ds[ma % Math.max(1, ds.length)];
      if (!db[id] || !this.P.vc.sk(id)) return;
      const lv = Math.max(1, Math.min(20, Math.round((m.lvl || 1) / (C.capChieu || 5))));
      m.vc = { ...this.vcCua(id, lv), fac };
      const r = Math.min(this.skRange(id, lv), 400 * SCALE);
      if (r > m.reach) m.reach = r;
      this.P.vc.warm(id);
    },
    // dòng chiêu id cấp lv cho quái ra chiêu: { id, lv, he (hệ sát thương), doc { f, e }, choang [% , khung], giat % | null }
    vcCua(id, lv) {
      const C = this.quaiVC || {}, db = this.P.skillDb || {};
      // dòng của chiêu + chiêu con (đạn thật — Phiêu Tuyết Xuyên Vân ghi sát thương ở chiêu con), chiêu cha trước
      const A = {}; for (let s = db[id], n = 0; s && n < 4; s = s.sub && s.sub.child && db[s.sub.child], n++) for (const [k, v] of Object.entries(lvAttrs(s, lv))) if (!(k in A)) A[k] = v;
      const he = A.colddamage_v ? "cold" : A.poisondamage_v ? "poison" : A.lightingdamage_v ? "light" : A.firedamage_v ? "fire" : "phys";
      return { id, lv, he, doc: A.poisondamage_v ? { f: A.poisondamage_v[1] || 60, e: A.poisondamage_v[2] || 10 } : null,
        choang: A.stun_p && A.stun_p[0] > 0 ? [A.stun_p[0], A.stun_p[1] || 9] : he === "light" && C.choangLoi ? C.choangLoi : null, giat: A.skill_dohurt ? A.skill_dohurt[0] : null };
    },
    // Phong Hỏa Liên Thành — quân hạng cao (anh 04/11 lượt 25 — "mấy con quái cấp cao hay chủ tướng gì đó, em thiết kế skill 30-90 các phái cho nó đánh
    // người chơi"): chiêu máy chủ chọn (may-chu/phong-hoa.js chieuCua — ds mã chiêu: Tiên phong 3x / 4x, Chủ tướng 5x – 7x, Chủ soái / Thần binh 9x),
    // cấp chiêu như ganVoCong, st = sát thương mỗi chiêu × đòn thường (misHitHero). m.vcDs: mỗi lần ra bốc 1 chiêu đủ tầm tới mục tiêu (quaiRaChieu);
    // tầm đứng đánh = chiêu xa nhất (tối đa 400 đơn vị client). Chưa bật quái có võ công (quaiVC) thì đánh thường như cũ
    ganChieuDs(m, ds, st) {
      const C = this.quaiVC, db = this.P.skillDb || {}; delete m.vc; delete m.vcDs;
      if (!C || !this.P.vc || !Array.isArray(ds)) return;
      const lv = Math.max(1, Math.min(20, Math.round((m.lvl || 1) / (C.capChieu || 5)))), L = [];
      for (const id of ds) { if (!db[id] || !this.P.vc.sk(id)) continue; L.push({ ...this.vcCua(id, lv), st: st > 0 ? st : 1, r: Math.min(this.skRange(id, lv), 400 * SCALE) }); this.P.vc.warm(id); }
      if (!L.length) return;
      // tầm theo chiêu (bỏ tầm chiêu mẫu ganVoCong gán lúc sinh — chiêu cận chiến đứng xa thì hụt); tầm cũ giữ ở reachNpc: đánh NPC phe kia (đòn thường —
      // World.updateMob) vẫn theo tầm đó, không đứng 300 ngoài tầm vệ binh / tướng quân đánh trả (soát lượt 92)
      if (m.reachNpc == null) m.reachNpc = m.reach;
      m.vcDs = L; m.vc = L[0]; m.reach = Math.max(...L.map((v) => v.r));
    },
    // quái ra chiêu vào người chơi (World.updateMob nhịp trúng): đạn bay như chiêu của người chơi, trúng người chơi thì misHitHero. Nhiều chiêu (vcDs):
    // bốc 1 chiêu đủ tầm tới người chơi (không chiêu nào đủ: bốc trong tất cả); chiêu đã ra đi theo đạn (once.V — trúng tính theo đúng chiêu đó)
    quaiRaChieu(m, p) {
      if (m.vcDs && m.vcDs.length > 1) { const d = ldist(m.x, m.y, p.x, p.y), du = m.vcDs.filter((v) => v.r + 30 >= d), L = du.length ? du : m.vcDs; m.vc = L[Math.floor(Math.random() * L.length)]; }
      this.fire(m.vc.id, m.vc.lv, { root: m.vc.id, x: m.x, y: m.y, tgt: p, pt: [p.x, p.y], who: m, once: { done: false, V: m.vc } });
    },
    // đòn này quái ra chiêu không (anh 30/10 lần 2: "quái 1-10-20 rất mạnh, đánh skill rất nhanh, khống chế nhân vật liên tục — giảm tần suất ra
    // chiêu của quái dưới 80"): cau-hinh.json quaiVoCong.tanSuat [[cấp dưới, % đòn là chiêu], …]; trùm / Boss Sát thủ / cấp từ mốc cuối: mọi đòn.
    // Không ra chiêu thì đòn thường (World.updateMob — vật lý, không trạng thái)
    quaiChieuLuotNay(m) {
      const T = !m.boss && !m.sat && ((this.quaiVC && this.quaiVC.tanSuat) || []).find((x) => (m.lvl || 1) < x[0]);
      return !T || Math.random() * 100 < T[1];
    },
    // đạn của quái trúng người chơi: 1 lần sát thương / chiêu (once — chiêu nhiều đạn), = đòn thường của quái theo hệ của chiêu (trừ kháng hệ đó,
    // giảm như đòn quái — guard) + trạng thái: băng làm chậm cham khung (60 = engine defNORMAL_COLD_TIME, thời gian chậm mặc định của băng sát),
    // độc docPct % đòn rải theo khung độc của chiêu, choáng theo xác suất; giật ở World.hit (giatHero)
    misHitHero(m) {
      const p = this.player, q = m.src.who, V = (m.src.once && m.src.once.V) || (q && q.vc), C = this.quaiVC; if (!V || !C || p.hp <= 0) return;
      if (q && q.sk && !q.skMinhDanh) return; // siêu boss (anh 18/11): chiêu chỉ trúng người đã đánh nó (bosstg.js daDanh)
      if (m.src.once) { if (m.src.once.done) return; m.src.once.done = true; }
      // quân Phong Hỏa hạng cao: sát thương chiêu × st (ganChieuDs)
      const d = mobDamageHe(V.st > 0 && V.st !== 1 && q && Array.isArray(q.dmg) ? { ...q, dmg: [q.dmg[0] * V.st, q.dmg[1] * V.st] } : q, p, V.he);
      if (!d.miss) this.guard(q, p, d);
      this.hit(q, p, d);
      this.phanDon(q, d, V.he);
      if (d.miss || !(d.v > 0) || p.hp <= 0) return;
      // chậm / độc / choáng quái gây ra kéo dài tối đa hieuUngToiDa nhịp (anh 01/11 "giảm thời gian hiệu quả quái gây ra cho nhân vật, đồng loạt
      // 1,5 giây cho choáng chậm độc" — trước chậm 60 nhịp = 3,3 giây, độc theo chiêu; độc ngắn đi thì tổng máu mất giảm theo, mỗi nhịp như cũ).
      // Ngất (giật — giatHero) giữ như cũ
      const T = C.hieuUngToiDa ?? 27;
      if (V.he === "cold") this.heroCham(Math.min(C.cham ?? 60, T));
      if (V.doc) { const f = Math.min(V.doc.f, T); this.heroDoc(q, (((d.v * (C.docPct ?? 50)) / 100) * f) / Math.max(1, V.doc.f), { ...V.doc, f }); }
      if (V.choang && Math.random() * 100 < V.choang[0]) this.heroChoang(Math.min(V.choang[1], T));
    },
    // phản đòn (anh 10/11 "làm cái phản đòn của thiếu lâm cho đúng client" — engine KNpc::CalcDamage "Tinh phan don sat thuong"; trước đây đòn võ công của quái không phản, chỉ
    // đòn thường): đòn vật lý cận chiến theo Phản đòn cận chiến, vật lý tầm xa và đòn băng / hỏa / lôi theo Phản đòn tầm xa, độc theo phanDoc. Số cố định của đồ chỉ với đòn
    // cận chiến. Số phản không phản tiếp (dmg.reflect, cờ bReturn của engine). he: "phys" | "cold" | "fire" | "light" | "poison" | "mag"; xa: đòn tầm xa
    phanDon(q, d, he = "phys", xa = !!(q && q.def && q.def.ranged)) {
      const p = this.player; if (!q || q.alive === false || d.miss || !(d.v > 0)) return;
      if (he === "poison") return this.phanDoc(q, d.v);
      const pct = he === "phys" && !xa ? p.thornsPct : p.rangeReturnPct, v = (xa ? 0 : p.thorns || 0) + Math.floor((d.v * pct) / 100);
      if (v > 0) this.hit(p, q, { v, reflect: true });
    },
    // Đại Thừa Như Lai Chú (poisondamagereturn_p — engine "Phan don doc sat"): mỗi lần mất máu vì độc, kẻ gây độc chịu lại % đó (src: quái, hoặc { tkRef } trong Tống Kim)
    phanDoc(src, v) {
      const p = this.player, pct = p.poisonRetPct || 0; if (!(pct > 0) || !(v > 0) || !src) return;
      const q = src.kind === "mob" ? src : this.tk && src.tkRef != null ? this.tkThucThe(src.tkRef) : null;
      if (q && q.alive !== false) this.hit(p, q, { v: Math.max(1, Math.floor((v * pct) / 100)), reflect: true });
    },
    // giật (luật gốc của engine — client KNpc::DoHurt: động tác bị đánh × (100 − Thời gian phục hồi) / 100; máy chủ lậu sửa thành mốc 10): mỗi
    // đòn trúng giat % (chiêu có skill_dohurt thì theo đó); đang ra chiêu / đánh thì bị ngắt (chưa tới nhịp ra chiêu thì bỏ, chưa tốn nội lực)
    giatHero(q, dmg) {
      const p = this.player, C = this.quaiVC; if (!C || p.hp <= 0 || p.dash || p.jump || this.giaiXau() > 0) return;
      // chỉ quái hệ trong giatHe làm giật / thọ thương (anh 30/10 lần 2: "quái nào đánh cũng ngất người là không đúng, hệ Kim mới có" — Thổ choáng,
      // Thủy làm chậm, Mộc độc như cũ)
      if (Array.isArray(C.giatHe) && !C.giatHe.includes(q.series | 0)) return;
      const pct = q.vc && q.vc.giat != null ? q.vc.giat : C.giat ?? 25, tg = Math.max(0, Math.min(100, p.tgph || 0));
      if (tg >= 100 || Math.random() * 100 >= pct) return;
      p.cast = null; p.hurtDur = (HURT_T * (100 - tg)) / 100; p.act = "hurt"; p.t = 0;
    },
    // trạng thái của người chơi do quái có võ công: chậm (động tác + chạy 50 % — World.updateHero dùng heroK), choáng, độc (heroTick). Giảm theo
    // đồ: Thời gian làm chậm (tối đa tglcToiDa — engine 77 %) / choáng / trúng độc %. Đang chậm thì không làm mới (engine)
    heroK() { return (this.player.slowUntil || 0) > this.time ? SLOW_K : 1; },
    // mức dòng ignorenegativestate_p của bùa đang có (Võ Đang 120 — anh 08/11): 0 = không; > 0 xóa trạng thái xấu mỗi khung, không bị giật; > 1 (bản thân, chiêu phụ
    // 738) không dính trạng thái mới — engine KNpc: m_IgnoreNegativeState.nTime > 0 / nValue[0] > 1
    giaiXau() { let v = 0; for (const b of this.player.buffs.values()) if (b.until > this.time && b.attrs.ignorenegativestate_p) v = Math.max(v, b.attrs.ignorenegativestate_p[0]); return v; },
    heroCham(f) {
      if (this.giaiXau() > 1) return;
      const p = this.player, red = Math.min(this.quaiVC.tglcToiDa ?? 77, (p.tglc || 0) + this.tkMod("freezetimereduce_p"));
      if (f > 0 && !((p.slowUntil || 0) > this.time)) p.slowUntil = this.time + ((f * (100 - red)) / 100) * TICK;
    },
    // Hấp Tinh Yểm_Quyết Chú (poison2decmana_p [%, khung] — engine KNpc m_LoseMana, anh 12/11): mỗi 18 khung mất % nội lực đang có, trong p2 khung; xong thì miễn
    // gấp 3 thời gian đó (không dính liên tục). Xuất Ứ Bất Nhiễm (giaiXau > 1): miễn
    heroMatNoi(a) {
      if (this.giaiXau() > 1) return;
      const p = this.player; if (!a || !(a[0] > 0)) return;
      const f = a[1] > 0 ? a[1] : 54; if (p.matNoi && p.matNoi.mien > this.time) return;
      p.matNoi = { pct: a[0], next: this.time, het: this.time + f * TICK, mien: this.time + f * 3 * TICK };
    },
    // tổng 1 dòng của bùa người phe kia đang dính lên mình (Tống Kim — p.tkBua, tkbot.js tkBuaMinh): giảm thời gian choáng / chậm / độc âm = dính lâu hơn
    tkMod(k) { const p = this.player; let v = 0; if (p.tkBua) for (const c of p.tkBua) if (c.until > this.time && c.attrs[k]) v += c.attrs[k][0]; return v; },
    // hoảng loạn (Thiên Nhẫn 120 — chiêu phụ 723 randmove, tkbot.js tkBuaMinh): như choáng — đứng yên, không xuất chiêu — f khung; không giảm theo "giảm thời gian choáng"
    heroHoangLoan(f) { if (this.giaiXau() > 1) return; const p = this.player, t = f * TICK; if (t > 0) { p.hlUntil = Math.max(p.hlUntil || 0, this.time + t); this.text(p, "Hoảng loạn", "#e0a8ff"); } },
    heroChoang(f) { if (this.giaiXau() > 1) return; const p = this.player, t = ((f * (100 - Math.min(100, (p.tgc || 0) + this.tkMod("stuntimereduce_p")))) / 100) * TICK; if (t > 0) p.stunUntil = Math.max(p.stunUntil || 0, this.time + t); },
    heroDoc(q, tong, D) {
      if (this.giaiXau() > 1) return;
      const p = this.player, tg = Math.max(-300, Math.min(this.tk ? 77 : 100, (p.tgtd || 0) + this.tkMod("poisontimereduce_p")));
      if (tg >= 100 || !(tong > 0)) return;
      // mỗi nhịp giữ nguyên, thời gian dài / ngắn theo "Thời gian trúng độc" (anh 17/11: bùa Vạn Độc Thực Tâm −300 % = độc kéo dài gấp 4 — như đánh quái vocong.js
      // misHit; trước: dồn thêm độc vào đúng thời gian cũ nên độc vẫn hết nhanh, trông như bùa không có tác dụng). Tối đa DOC_TOI_DA khung (60 giây — như tkbot.js DOC_MAX)
      const e0 = Math.max(1, D.e), v1 = tong / Math.max(1, Math.floor(D.f / e0)), f = Math.min(DOC_TOI_DA, (D.f * (100 - tg)) / 100), ev = e0 * TICK;
      const layer = { v: Math.max(1, Math.round(v1)), until: this.time + f * TICK }, P0 = p.poison && p.poison.until > this.time ? p.poison : null;
      p.poison = P0 ? { ...P0, list: [...P0.list, layer], until: Math.max(P0.until, layer.until), src: q } : { list: [layer], every: ev, next: this.time + ev, until: layer.until, src: q };
    },
    // mỗi bước (World.updateHero): độc mất máu theo lớp; choáng -> đứng yên, bỏ chiêu đang ra. Trả true khi đang choáng
    heroTick(dt) {
      const p = this.player;
      // đang Xuất Ứ Bất Nhiễm: như engine KNpc — mỗi khung xóa độc, chậm, choáng; anh 17/11 ("chiêu 120 của võ đang sẽ xóa dc bùa và hiệu ứng bất lợi của ngũ độc"):
      // xóa cả bùa hại người phe kia đang gắn lên mình (p.tkBua — Vạn Độc Thực Tâm, Xuyên Tâm Độc Thích…)
      if (this.giaiXau() > 0) { p.poison = null; p.slowUntil = 0; p.stunUntil = 0; p.hlUntil = 0; p.matNoi = null; p.tkBua = null; }
      const LM = p.matNoi; // mất nội lực (heroMatNoi)
      if (LM) { if (this.time >= LM.het) { if (this.time >= LM.mien) p.matNoi = null; } else if (this.time >= LM.next) { LM.next += 18 * TICK; p.mp = Math.max(0, p.mp - (p.mp * LM.pct) / 100); } }
      if (p.poison) {
        if (p.poison.until <= this.time) p.poison = null;
        else if (p.poison.next <= this.time) {
          p.poison.next += p.poison.every; p.poison.list = p.poison.list.filter((l) => l.until > this.time);
          // khu an toàn (thành / thôn, doanh trại Tống Kim — p.an, World.updateHero): độc vẫn rút máu tới hết thời gian nhưng không làm chết, giữ ≥ 1 sinh lực
          // (anh 17/11 "về thành r máu vẫn rút, k chết, nhưng rút đến khi hết tgian")
          const tong = p.poison.list.reduce((t, l) => t + l.v, 0), v = p.an ? Math.min(tong, Math.max(0, Math.floor(p.hp) - 1)) : tong;
          if (v > 0) { const nguon = p.poison.src; this.hit(nguon, p, { v, poison: true }); this.phanDoc(nguon, v); if (p.hp <= 0) return true; }
        }
      }
      if ((p.stunUntil || 0) > this.time || (p.hlUntil || 0) > this.time) { // choáng / hoảng loạn
        if (p.sit) this.sit(false);
        p.cast = null; p.path = null;
        if (p.act !== "stand") this.setAct(p, "stand");
        return true;
      }
      return false;
    },
    // hệ số tốc độ chạy / đánh của quái (đóng băng chậm 50 %, bùa giảm tốc)
    mobSpeedK(m) { if (m.mienCham) return Math.max(1, 1 + this.mobMod(m, "fastwalkrun_p") / 100); return Math.max(0.2, ((m.slowUntil || 0) > this.time ? SLOW_K : 1) * (1 + this.mobMod(m, "fastwalkrun_p") / 100)); }, // mienCham: bùa giảm tốc chạy không làm chậm (siêu boss)
    mobAtkK(m) { return Math.max(0.3, ((m.slowUntil || 0) > this.time ? SLOW_K : 1) * (1 + (this.mobMod(m, "attackspeed_v") + this.mobMod(m, "castspeed_v") + this.mobMod(m, "attackspeed_yan_v")) / 200)); },
    // ---------- bùa lợi / vòng sáng ----------
    buffOn(id, lv) {
      const s = this.skDef(id); if (!s) return;
      const L0 = lvAttrs(s, lv), A = statsOnly(L0), dur = Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0)));
      if (!dur || !Object.keys(A).length) return;
      // dòng ignorenegativestate_p [mức, khung] + missle_missrate (client: đạn trượt = không có tác dụng): xác suất theo cấp như ô xem chiêu (anh 08/11)
      if (A.ignorenegativestate_p && L0.missle_missrate && Math.random() * 100 < L0.missle_missrate[0]) return;
      const k = this.P.vc.sk(id);
      this.player.buffs.set(id, { id, lv, attrs: A, until: this.time + dur * TICK, st: k ? k.state : 0 });
      // ẩn thân (dòng hide [1, vòng] — Thúy Yên Ngự Tuyết Ẩn, anh 26/10 "chiêu tàng hình lỗi": bản đầu bỏ qua dòng này): quái không thấy, thôi
      // đuổi; ra chiêu / đánh là hiện hình (engine KNpc::DoSkill: m_Hide.nTime = 0)
      if (A.hide && A.hide[1] > 0) this.player.hideUntil = this.time + A.hide[1] * TICK;
      this.refreshStats(false);
    },
    // thời gian tác dụng (giây) của bùa id ở cấp đang học: p2 dài nhất các dòng chỉ số
    buffDur(id) { const A = statsOnly(lvAttrs(this.skDef(id), this.skLv(id))); return Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0))) * TICK; },
    // dùng bùa lợi id lên mình (chuột phải / Trợ Thủ): như ra chiêu nhưng không cần mục tiêu; đang vung đòn thì chờ đòn xong (queueSelf)
    castSelf(id) {
      const p = this.player; if (p.hp <= 0) return false;
      if (p.act === "attack") { p.queueSelf = id; return true; }
      if (p.sit) this.sit(false);
      const c = this.skCan(id); if (!c.ok) { this.skMsg(c.why); return false; }
      this.castStart(id, this.skLv(id), null, null);
      return true;
    },
    // ---------- hình ----------
    // hình k (khung theo info { n, dirs, interval vòng } của đạn, hoặc theo đầu file: interval ms) bám vào e ({ x, y } hoặc người / quái)
    vfxAt(k, info, e, h = 0) {
      if (!k) return;
      const key = typeof k === "string" ? k : k.spr, M = this.P.vc.M.spr[key]; if (!M) return;
      const n = info && info.n ? info.n : M.n, per = info && info.interval ? info.interval * TICK : Math.max(20, M.interval || 50) / 1000;
      const k0 = (info && info.from) || 0; // vẽ tiếp từ khung k0 (đạn hết đời giữa chừng hình)
      (this.vfx = this.vfx || []).push({ k: key, n, k0, per, e, h, t: 0, dur: (n - k0) * per });
    },
    // vẽ: đạn đang bay + hình trúng / tan / vận công (sau thân người, trước chữ)
    // Tống Kim (anh 06/11 "20 bot giật tưng bừng, 3–9 fps"): 40 bot + quân xả chiêu 90 cùng lúc — hình đạn / trúng phủ kín màn, card đồ họa gánh không
    // nổi. Vẽ tối đa TK_FX hình của bot / quân / người khác mỗi khung (gần mình trước); đạn của mình hoặc nhắm vào mình luôn vẽ. Chỉ bớt vẽ — đạn vẫn bay,
    // vẫn trúng như cũ
    tkFxBo() {
      if (!this.tk) return null;
      const p = this.player, L = [], bo = new Set();
      const them = (x, d) => { if (d > TK_FX_XA) bo.add(x); else L.push([x, d]); }; // xa quá: bỏ luôn
      for (const m of this.mis || []) { if (m.t < 0) continue; const s = m.src || {}; if ((!s.ptA && !s.ao) || m.tgt === p) continue; them(m, ldist(m.x, m.y, p.x, p.y)); }
      for (const f of this.vfx || []) { if (!f.e || f.e === p) continue; them(f, ldist(f.e.x, f.e.y, p.x, p.y)); }
      if (L.length > TK_FX) { L.sort((a, b) => a[1] - b[1]); for (const [x] of L.slice(TK_FX)) bo.add(x); }
      return bo.size ? bo : null;
    },
    vcDraw(ctx) {
      const VC = this.P.vc, bo = this.tkFxBo();
      for (const m of this.mis || []) {
        if (m.t < 0 || (bo && bo.has(m))) continue;
        const d = m.d;
        // lớp B chỉ vẽ khi MultiShow = 1 (client: vụ nổ bẫy Địa Diệm Hỏa / Xuyên Tâm / Hàn Băng / Lôi Kích có lớp B "bz_du3" mà MultiShow 0
        // — bản đầu vẽ cả 2 lớp, anh báo "nổ 2 loại hiệu ứng")
        for (const an of [d.a[1] || d.a[0], d.multi ? d.b[1] || d.b[0] : null]) {
          if (!an) continue;
          // hình lặp (LoopPlay): mỗi khung an.interval vòng; hình chạy 1 lần: trải đều suốt đời đạn (Mạn Thiên Hoa Vũ 40 khung / 39 vòng,
          // Phong Sương 40 khung / 12 vòng — bản đầu 3 vòng / khung + vẽ nốt sau khi đạn hết -> rơi chậm 6–7 giây, anh báo 26/10)
          const dirs = an.dirs || 1, per = Math.max(1, Math.floor((an.n || VC.frames(an.spr)) / dirs));
          const f = d.loop ? Math.floor(m.t / (an.interval || 1)) % per : Math.min(per - 1, Math.floor((m.t / Math.max(1, m.life)) * per));
          const dir = dirs > 1 ? dirN(Math.cos(m.a), Math.sin(m.a), dirs) : 0;
          const z = m.z || 0; // ném vòng cung: độ cao (m.lob)
          VC.draw(ctx, an.spr, dir * per + f, m.x, m.y, d.h + z);
        }
      }
      for (const f of this.vfx || []) if (!(bo && bo.has(f))) VC.draw(ctx, f.k, Math.min(f.n - 1, (f.k0 || 0) + Math.floor(f.t / f.per)), f.e.x, f.e.y, f.h);
    },
    // bùa hại đang dính của người chơi khác e trong Tống Kim (bản chọn mục tiêu cùng tên — tongkim.js datNguoi) | null
    vcBuaNguoi(e) { const T = this.tk; if (!T || e.kind !== "other" || !T.nguoi) return null; const n = T.nguoi.get(e.name); return n && n.curse && n.curse.length ? n.curse : null; },
    // hình trạng thái bám người / quái (bùa, vòng sáng, bùa hại): part Foot vẽ dưới thân, còn lại trên thân
    vcStateList(e) {
      const L = [];
      if (e.kind === "hero") {
        for (const b of this.player.buffs.values()) if (b.st) L.push(b.st);
        const au = this.hero.oChieu && this.hero.oChieu.phai, ak = au && this.skLv(au) > 0 && this.P.vc.sk(au);
        if (ak && ak.aura && ak.state) L.push(ak.state);
        // vòng sáng ghép (Bế Nguyệt Phất Trần): engine phát chiêu con của từng vòng ghép -> trạng thái của chúng bám người (skCong: + cấp Báo Đáp Ân Sư — anh 16/11)
        if (ak && ak.aura) for (const [id] of auraGhep(this.skDef(au), this.skLv(au), skCong(this.hero, this.P.skillDb))) { const g = this.P.vc.sk(id); if (g && g.state && !L.includes(g.state)) L.push(g.state); }
        // vòng sáng của đồng đội đứng gần (World.vongDoi) + vòng của mình vừa đổi chưa hết hạn (World.vongHan — xoay vòng): trạng thái cũng bám người mình như engine
        for (const [id] of this.vongDoiDs || []) { const g = this.P.vc.sk(id); if (g && g.state && !L.includes(g.state)) L.push(g.state); }
        for (const id of this.vongHan ? this.vongHan.keys() : []) { const g = this.P.vc.sk(id); if (g && g.state && !L.includes(g.state)) L.push(g.state); }
        // Tống Kim: bùa hại của người / bot phe kia đang dính trên mình (tkBuaMinh — anh 13/11 lượt 86: thấy hình bùa trên người mình như trên quái)
        if (this.tk && this.player.tkBua) for (const c of this.player.tkBua) if (c.st && c.until > this.time && !L.includes(c.st)) L.push(c.st);
      } else if ((e.kind === "other" || (e.tkb && e.alive)) && (e.vs || e.vn || e.bl || this.vcBuaNguoi(e))) { // bot Tống Kim (tkbot.js): vòng sáng + bùa lợi như người
        // người chơi khác trong Tống Kim (anh 13/11 lượt 86 "bùa của ngũ độc vẫn chưa hiển thị lên người của kẻ địch"): hình bùa hại đang dính — bùa họ báo qua nhịp (bc)
        // + bùa mình vừa gắn (tạm 2,5 giây) đều nằm ở bản chọn mục tiêu (tongkim.js dongBo — buaTuXa / tkTrungNguoi); trước chỉ vẽ trên bản chọn mục tiêu (không vẽ) nên không thấy
        const bn = this.vcBuaNguoi(e); if (bn) for (const c of bn) if (c.st && c.until > this.time && !L.includes(c.st)) L.push(c.st);
        if (e.tkb && e.curse) for (const c of e.curse) if (c.st && c.until > this.time) L.push(c.st); // + bùa hại đang dính
        // người khác đang bật vòng sáng (e.vs) / đứng trong vòng của người khác hoặc của mình (e.vn — World.vongNguoiKhac, anh 03/11) / đang có
        // bùa lợi (e.bl — World.buaPhat: Côn Lôn dùng lên đồng đội…)
        for (const [id] of e.vs || []) { const g = this.P.vc.sk(id); if (g && g.state && !L.includes(g.state)) L.push(g.state); }
        for (const id of [...(e.vn || []), ...(e.bl || [])]) { const g = this.P.vc.sk(id); if (g && g.state && !L.includes(g.state)) L.push(g.state); }
      }
      else if (e.kind === "mob" && e.alive && (e.curse || e.vongSt)) {
        if (e.curse) for (const c of e.curse) if (c.st && c.until > this.time) L.push(c.st);
        if (e.vongSt && !L.includes(e.vongSt)) L.push(e.vongSt); // vòng Vô Hình Độc của siêu boss (bosstg.js vongVhd — anh 18/11)
      }
      // tài khoản quản trị (QT_VONG — vòng sáng danh hiệu Quán quân liên đấu): mình (World.laQt) / người khác (cờ qt máy chủ gửi)
      if ((e.kind === "hero" && this.laQt) || (e.kind === "other" && e.qt)) L.push(QT_VONG);
      // vầng trăng Nhất Kỷ / Càn khôn (TRANG_CC — anh 16/11): mình theo hero.ccKn còn hạn, người khác theo cờ cc máy chủ gửi (the-gioi.js ccDau); phân thân không có
      { const m = e.kind === "hero" ? ccTrang(this.hero) : e.kind === "other" && !e.pt ? e.cc | 0 : 0; if (m) for (const [b, id] of TRANG_CC) if (m & b) L.push(id); }
      // vòng sáng tân thủ (anh 02/11 — mẫu A vòng xanh lá, World.tanThu.vong): mình / người khác (cấp máy chủ gửi) dưới capDuoi cấp; quản trị giữ vòng riêng
      const TT = this.tanThu;
      // lôi đài (anh 15/11 — đỡ rối mắt khi đấu, tuyển thủ từ cấp 60 nên nhiều người dưới capDuoi): không vẽ vòng tân thủ trong sân
      if (TT && TT.vong && !(this.tk && this.tk.loai === "ld") && ((e.kind === "hero" && !this.laQt && (this.hero.lvl || 1) < TT.capDuoi) || (e.kind === "other" && !e.qt && (e.lvl || 1) < TT.capDuoi))) L.push(TT.vong);
      return L;
    },
    // Như engine KNpcRes::Draw:
    //  - thứ tự: hình trên thân đang ở khung "sau lưng" [behind[0], behind[1]) (cột 主角身后开始帧 / 结束帧 của bảng trạng thái) · hình dưới
    //    chân · THÂN · hình trên thân các khung còn lại · hình trên đầu. Kim Chung Tráo (khung 5–14 sau lưng) mới thấy chuông quay vòng QUANH
    //    người — bản trước vẽ mọi khung trước thân (anh 26/10 "chưa quay chính xác quanh người");
    //  - mỗi vòng engine 1 khung (KSprControl::GetNextFrame — bản trước theo nhịp ghi trong file hình);
    //  - độ cao: Head cao thêm 70 ("khoảng cách mặc định tới tên" — biểu tượng bùa nằm TRÊN tên; cưỡi ngựa +28, ngồi −20), Body cưỡi ngựa
    //    +38, Foot sát đất (bản đầu vẽ mọi loại ở độ cao 0 -> biểu tượng trấn phái đè lên người dưới tên — anh 26/10).
    // back = true: lượt vẽ trước thân, false: sau thân
    vcDrawStates(ctx, e, back) {
      // Tống Kim: hình bùa / vòng sáng của bot, quân ở xa mình (> TK_BUA_XA) không vẽ (cùng lý do TK_FX — 40 bot mỗi con 2–4 hình trạng thái)
      if (this.tk && e.tkb && ldist(e.x, e.y, this.player.x, this.player.y) > TK_BUA_XA) return;
      const VC = this.P.vc, hero = e.kind === "hero", ride = hero && this.riding();
      for (const id of this.vcStateList(e)) {
        const st = VC.st(id); if (!st || !st.spr) continue;
        const n = Math.max(1, st.n || VC.frames(st.spr) || 1), f = Math.floor((this.time + (e.uid || 0) * 0.37) / TICK) % n;
        const behind = st.part === "Foot" || (st.part === "Body" && st.behind && f >= st.behind[0] && f < st.behind[1]);
        if (behind !== back) continue;
        const h = st.part === "Head" ? 70 + (ride ? 28 : 0) - (hero && e.sit ? 20 : 0) : st.part === "Body" && ride ? 38 : 0;
        VC.draw(ctx, st.spr, f, e.x, e.y, h, 1, e.vongSt === id ? e.vongTo || 1 : 1);
      }
    },
    // vùng Vô Hình Độc của siêu boss (bosstg.js vongVhd — anh 18/11 mẫu C; 18/11 tối "cố định vòng độc, k di chuyển theo boss, chỉ cái dưới chân của nó là đi theo"): vongRai
    // vòng nhỏ (cỡ vongToRai) trên 2 elip 0,42 / 0,8 × bán kính vongR quanh chỗ boss xuất hiện (vongX, vongY) — đứng yên khi boss đuổi người; vẽ sát đất trước mọi thân
    // (World.draw — cùng lượt bóng) nên không đè lên người / quái. Vòng giữa (trạng thái bám chân) vẫn theo boss
    vcVeVungDoc(ctx, e) {
      if (!e.alive || !e.vongSt || !(e.vongRai > 0)) return;
      const VC = this.P.vc, st = VC.st(e.vongSt), n = st && st.spr ? Math.max(1, st.n || 1) : 0; if (!n) return;
      const f0 = Math.floor(this.time / TICK), N = e.vongRai | 0, N1 = Math.ceil(N / 2), R = e.vongR || 500, cx = e.vongX ?? e.x, cy = e.vongY ?? e.y;
      for (let i = 0; i < N; i++) {
        const ngoai = i >= N1, M = ngoai ? N - N1 : N1, a = ((ngoai ? i - N1 + 0.5 : i) / M) * 2 * Math.PI, k = ngoai ? 0.8 : 0.42;
        VC.draw(ctx, st.spr, (f0 + i * 5) % n, cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * 0.5 * k, 0, 0.9, e.vongToRai || 1.7);
      }
    },
  });
}
