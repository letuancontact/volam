// Phân Thân (anh 05/11 — luật may-chu/phan-than.js, khung thuê src/game/phanthan.js): nhân vật máy theo người thuê ở bãi train (chính / phụ).
// KHÔNG phải Đồng hành của client (làm sau, theo client). Cài thêm hàm vào World (installNhanVatMay):
//  - datPhanThan(tt): main.js gọi khi phân thân đang theo đổi (trạng thái máy chủ tt = { ra: [mã], ds: [{ id, snap }] }) và mỗi lần vào bãi;
//    ngoài bãi train thì bỏ hết. Mỗi phân thân dựng từ bản chụp lúc thuê (snap: cấp, hệ, phái, tiềm năng, trang bị, kỹ năng, ngoại hình, ô chiêu,
//    cài đặt chiêu Trợ Thủ) -> chỉ số như người đó tự tính (rules.heroStats + equipStats + skillB: bị động, bùa lợi coi như luôn có, vòng sáng);
//  - tên "<người thuê> (<người bị sao chép> Phân Thân)", phe = phe đang theo của người thuê (anh 05/11 "màu tên đảm bảo cho người thuê được hưởng
//    vòng sáng của phân thân") -> vòng sáng hỗ trợ của phân thân (danh.vong + xoay / ô tay phải, kèm vòng ghép) vào World.vongDoi như đồng đội;
//  - hỗ trợ: chiêu hồi máu (ô hồi máu của Trợ Thủ, không chọn thì chiêu hồi máu đã học) khi sinh lực người thuê dưới % (hoiDoi / hoi, mặc định
//    60), cách ≥ 3 giây; bùa lợi dùng được lên người khác (target.ally) mà người thuê chưa có / còn ≤ 3 giây -> thi pháp dùng lên (buffOn ở cấp
//    phân thân, tối đa 40 như World.buaTuDoi);
//  - đánh quái quanh người thuê (≤ PT_TAM): con người thuê đang đánh > con đang giữ > con đang đuổi người thuê > (đang tự đánh) con gần người
//    thuê nhất — chiêu đánh chính Trợ Thủ / ô tay trái (đã học, đúng vũ khí; không có thì chiêu đánh cấp cao nhất), không có chiêu thì đòn thường.
//    Đạn thật của chiêu (vocong.js fire, ptA): sát thương theo chỉ số phân thân (vocong.js ptTrung), đòn ghi cho phân thân -> giết: người thuê đủ
//    kinh nghiệm, không tiền / đồ (World.hit ptGiet -> r[7]). Vòng sáng đánh địch (Vô Hình Độc) phát mỗi giây khi đang đánh;
//  - không tốn sinh lực / nội lực, quái không đánh phân thân; không đánh boss thế giới / quái nhiệm vụ / mộc nhân (World.hit);
//  - Boss Sát thủ (anh 13/11 — chọn "không đánh boss, chỉ hỗ trợ"): không nhắm, đạn / vòng sáng chạm boss không gây sát thương (vocong.js ptTrung — bùa hại
//    vẫn vào); người thuê đang đánh Boss Sát thủ (ptTimBoss) thì phân thân thôi đánh: Nga My đứng hồi máu (≥ 80 %), phái có bùa hại ra bùa lên boss
//    (ptBuaHai — ô Bùa hại Trợ Thủ của người bị sao chép, chưa chọn thì mọi bùa hại đã học), còn lại đứng cạnh giữ vòng sáng / bùa lợi;
//  - cách người thuê > PT_DICH (dịch chuyển, chạy xa) hoặc kẹt 1,5 giây thì hiện lại cạnh người thuê.
import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import * as R from "./rules.js";
import { equipStats, weaponKind, syncRanged } from "./itemdb.js";
import { BOSS_TAM, laBoss } from "./auto.js"; // đánh boss phải ở gần (anh 16/11)
import { skillB, mergeB, skillSupport, kindOf, auraGhep, lvAttrs, statsOnly, eqtOk, isHeal, ANIM, CAST_T } from "./vocong.js";

const TICK = 1 / 18, SCALE = 0.75;
const RUN = 10 * 18 * SCALE;          // px logic / giây (RunSpeed 10 — như world.js)
const HIT_AT = 0.55;                  // ra đòn ở 55 % động tác (như world.js / vocong.js)
const PT_TAM = 400;                   // đánh quái cách người thuê ≤ chừng này (px logic — đủ cho người thuê đánh xa ở mép tầm chiêu)
const PT_XICH = 540;                  // đang đuổi quái mà cách người thuê quá chừng này: bỏ con đó, về
const PT_DICH = 900;                  // cách người thuê quá chừng này (dịch chuyển, đổi chỗ): hiện lại cạnh người thuê
const PT_CACH = 40;                   // đứng cạnh: lệch chỗ đứng quá chừng này mới chạy theo
const VI_TRI = [[-46, 16], [46, 16], [0, 44], [-84, -6], [84, -6], [-40, -34], [40, -34], [0, -58]]; // chỗ đứng phân thân: 2 con đầu sau-trái / sau-phải người thuê; con thứ 3+ (chỉ quản trị — anh 18/11) quanh người thuê (px web)
const BUA_MAX = 40;                   // cấp bùa dùng lên người khác tối đa (World.buaTuDoi)
const HOI_GIAN = 3;                   // hồi máu cách ≥ 3 giây
const VONG_DICH = 1.04;               // tầm vòng sáng đánh địch × 1,04 (vocong.js VONG_TAM — lượt 86 giảm 20 % từ × 1,3)
const PT_BOSS = 600;                  // Boss Sát thủ cách người thuê ≤ chừng này, đang đánh nhau / người thuê đang nhắm: phân thân chỉ hỗ trợ (anh 13/11)
const NGA_MY = 4;                     // mã phái Nga My (skills.json factions) — lúc đánh Boss Sát thủ chỉ đứng hồi máu
const HOI_BOSS = 80;                  // Nga My lúc đánh Boss Sát thủ: hồi máu khi người thuê dưới chừng này % (ít nhất — cài đặt Trợ Thủ cao hơn thì theo cài đặt)

export function installNhanVatMay(World) {
  Object.assign(World.prototype, {
    // phân thân đang theo đổi / vào bãi mới (main.js): giữ con cũ (vị trí, động tác), dựng con mới; ngoài bãi train bỏ hết
    datPhanThan(tt) {
      const db = this.P.skillDb, ra = (tt && tt.ra) || [], ds = (tt && tt.ds) || [];
      if (!this.baiTrain || !db || !this.P.chr || this.tk) { this.phanThan = []; return; } // Tống Kim: phân thân không theo vào trận (thiết kế mục 3)
      const cu = this.phanThan || [];
      this.phanThan = ra.map((id, i) => {
        const x = ds.find((d) => d.id === id); if (!x || !x.snap) return null;
        const khoa = id + "|" + x.lvl + "|" + JSON.stringify(x.snap).length;
        let a = cu.find((c) => c.ptKhoa === khoa);
        if (!a) { try { a = this.dungPhanThan(x, i); a.ptKhoa = khoa; } catch (e) { console.warn("phân thân:", e); return null; } }
        a.slot = i; return a;
      }).filter(Boolean);
    },
    // dựng 1 phân thân từ bản chụp x.snap (đứng cạnh người thuê)
    dungPhanThan(x, slot) {
      const S = x.snap, db = this.P.skillDb, sex = S.sex === "f" ? "f" : "m", series = S.series | 0;
      const start = S.start && S.start.str != null ? S.start : (this.P.chr.start || []).find((s) => s.series === series && s.sex === (sex === "f" ? 1 : 0)) || { str: 0, dex: 0, vit: 0, eng: 0 };
      const H = { name: S.name, lvl: S.lvl || 1, sex, series, fac: S.fac ?? null, start, attr: S.attr || {}, equip: S.equip || {}, skills: S.skills || {},
        looks: { ...(S.looks || {}), horse: 0 }, oChieu: S.oChieu || {}, auto: { danh: S.danh || {} } }; // không cưỡi ngựa: chiêu cấm cưỡi ngựa vẫn ra được
      syncRanged(H);
      const D = H.auto.danh, O = H.oChieu, lv = (id) => (H.skills[id] | 0), sk = (id) => (id ? db[id] : null);
      // vòng sáng hỗ trợ: Trợ Thủ chọn (vong + xoay) / ô tay phải; chưa chọn thì vòng hỗ trợ cấp cao nhất đã học. Kèm vòng ghép (auraGhep)
      const hoTro = (s) => s && s.aura && !(s.target && s.target.enemy);
      let chon = [D.vong, ...(D.xoay || []), O.phai].filter((id) => hoTro(sk(id)) && lv(id) > 0).map(Number);
      if (!chon.length) { const L = Object.keys(H.skills).filter((id) => hoTro(sk(id)) && lv(id) > 0).sort((a, b) => lv(b) - lv(a)); if (L.length) chon = [+L[0]]; }
      const vs = [], themV = (id, l) => { if (l > 0 && !vs.some((v) => v[0] === +id)) vs.push([+id, l]); };
      for (const id of chon) { themV(id, lv(id)); for (const [g, gl] of auraGhep(db[id], lv(id), H.skills)) themV(g, gl); }
      // vòng sáng đánh địch ở ô tay phải (Ngũ Độc Vô Hình Độc)
      const au = sk(O.phai), vongDich = au && au.aura && au.target && au.target.enemy && lv(O.phai) > 0 ? { id: +O.phai, lv: lv(O.phai) } : null;
      // bùa lợi đã học: bùa Trợ Thủ chọn + mọi bùa dùng được lên người khác — phân thân coi như luôn có (chỉ số); loại target.ally dùng lên người thuê
      const laBua = (id) => { const s = sk(id); return !!s && lv(id) > 0 && kindOf(s, db) === "buff"; };
      const buaIds = [...new Set([...(D.bua || []).filter(laBua), ...Object.keys(H.skills).filter((id) => laBua(id) && db[id].target && db[id].target.ally)].map(Number))];
      const luon = buaIds.filter((id) => !isHeal(db[id], lv(id))); // chiêu hồi máu ngắn không tính là bùa luôn có
      const buffs = new Map(luon.map((id) => [id, { id, lv: lv(id), attrs: statsOnly(lvAttrs(db[id], lv(id))), until: Infinity }]));
      // cd: hồi chiêu của chiêu đó (anh 08/11 "phân thân võ đang thì nó dùng kĩ năng 120 liên tục không CD, khá là imba" — trước chỉ cách 1,5 giây); giai: chiêu xóa
      // trạng thái xấu (Xuất Ứ Bất Nhiễm) — chỉ dùng khi người thuê đang dính
      const buaDoi = buaIds.filter((id) => db[id].target && db[id].target.ally).map((id) => { const A0 = lvAttrs(db[id], lv(id)); return { id, lv: Math.min(lv(id), BUA_MAX), ngan: isHeal(db[id], lv(id)), lai: 0, cd: ((A0.skill_mintimepercast_v && A0.skill_mintimepercast_v[0]) || 0) * TICK, giai: !!A0.ignorenegativestate_p }; });
      // hồi máu: chiêu ô hồi máu của Trợ Thủ; chưa chọn thì chiêu hồi máu (dùng được lên người khác) cấp cao nhất đã học
      const laHoi = (id) => { const s = sk(id); return !!s && !s.aura && s.target && s.target.ally && lv(id) > 0 && isHeal(s, lv(id)); };
      const Hh = D.hoi, HD = D.hoiDoi;
      let hoiId = Hh && laHoi(Hh.id) ? +Hh.id : 0;
      if (!hoiId) { const L = Object.keys(H.skills).filter(laHoi).sort((a, b) => lv(b) - lv(a)); if (L.length) hoiId = +L[0]; }
      const hoi = hoiId ? { id: hoiId, lv: Math.min(lv(hoiId), BUA_MAX), pct: (HD && HD.on && HD.pct) || (Hh && Hh.on && Hh.pct) || 60 } : null;
      // bùa hại (anh 13/11 "côn lôn nếu có bùa hại thì dùng cho boss, tương tự cho các phân thân phái có bùa hại"): ô Bùa hại Trợ Thủ của người bị sao chép
      // (danh.hai); chưa chọn thì mọi bùa hại đã học, cấp cao trước, tối đa 3 — chỉ dùng lên Boss Sát thủ (ptBuaHai)
      const laHai = (id) => { const s = sk(id); return !!s && lv(id) > 0 && kindOf(s, db) === "curse" && !!(this.P.vc && this.P.vc.sk(id)); };
      let haiIds = [...new Set((D.hai || []).filter(laHai).map(Number))];
      if (!haiIds.length) haiIds = Object.keys(H.skills).filter(laHai).map(Number).sort((x, y) => lv(y) - lv(x)).slice(0, 3);
      const buaHai = haiIds.map((id) => ({ id, lv: lv(id), lai: 0 }));
      // chỉ số: đồ + bị động + bùa (luôn có) + vòng sáng của mình
      const wk = weaponKind(H), B = mergeB(equipStats(H, false), skillB(H, db, wk, buffs, null, vs));
      const st = R.heroStats(H, this.P.chr, B), p = Object.assign({ pt: 1, buffs, cd: {} }, st, this.weaponAtk.call({ P: this.P, hero: H }));
      p.atkDur = R.atkFrames(18, st.atkSpeed) * TICK;
      const a = { kind: "other", pt: 1, id: x.id, name: `${this.hero.name} (${S.name} Phân Thân)`, sex, lvl: H.lvl, look: this.P.jx.look({ sex, ...H.looks }),
        x: this.player.x, y: this.player.y, dir: this.player.dir, t: 0, act: "stand", fight: false, attack: "Attack1", cp: this.pheMinh(), hp: 100, qt: false,
        vs: vs.length ? vs : null, bl: luon.length ? luon.slice(0, 8) : null, H, p, wk, sup: skillSupport(H, db), toc: RUN * (1 + (st.moveSpeed || 0) / 100),
        buaDoi, hoi, hoiT: 0, buaHai, ngaMy: H.fac != null && +H.fac === NGA_MY, vongDich, target: null, path: null, goal: null, repath: 0, chonT: 0, hoTroT: 0, tienK: null, boQua: new Map(), slot };
      a.chieu = this.ptChieu(a);
      a.tam = a.chieu ? this.ptTamChieu(a.chieu) : p.reach;
      [a.x, a.y] = this.ptCho(a);
      return a;
    },
    // chiêu đánh của phân thân: chiêu đánh chính Trợ Thủ / ô tay trái; không được thì chiêu đánh cấp cao nhất đã học. Lướt (Đoạn Hồn Thích) / di
    // hình (Mê Ảnh Tung): bỏ — phân thân đứng đánh. null = đòn thường
    ptChieu(a) {
      const db = this.P.skillDb, V = this.P.vc, H = a.H, D = H.auto.danh, O = H.oChieu || {};
      const dung = (id) => {
        const s = id && db[id], k = s && V && V.sk(id), lv = H.skills[id] | 0;
        if (!s || !k || lv < 1 || s.aura || s.style === 3 || kindOf(s, db) !== "attack" || !eqtOk(s, a.wk) || s.horse === 2) return null;
        if (s.style === 1 && (k.form === 11 || k.form === 13)) return null;
        return { id: +id, lv, s, k };
      };
      for (const id of [D.chieu, O.trai]) { const c = dung(id); if (c) return c; }
      const L = Object.keys(H.skills).map(dung).filter(Boolean).sort((x, y) => y.lv - x.lv);
      return L[0] || null;
    },
    // tầm ra chiêu (như atkPlan: chiêu nổ quanh người ra chiêu thì đứng trong vùng nổ)
    ptTamChieu(c) { const zr = this.zoneReach(c.id), r = this.skRange(c.id, c.lv); return zr != null ? Math.min(r, zr) : r; },
    // chỗ đứng cạnh người thuê (đi được; không thì chỗ người thuê)
    ptCho(a) {
      const p = this.player, [dx, dy] = VI_TRI[a.slot % VI_TRI.length];
      for (const [x, y] of [[p.x + dx, p.y + dy], [p.x - dx, p.y + dy], [p.x + dx, p.y - dy]]) if (this.map.walkable(x, y)) return [x, y];
      return [p.x, p.y];
    },
    ptDatCanh(a) { [a.x, a.y] = this.ptCho(a); a.path = null; a.goal = null; a.target = null; a.fight = false; a.tienK = null; this.setAct(a, "stand"); },
    // mỗi bước (World.update)
    capNhatPhanThan(dt) { this._ptBoss = this.phanThan.length ? this.ptTimBoss() : null; for (const a of this.phanThan) this.ptBuoc(a, dt); },
    // Boss Sát thủ người thuê đang đánh (anh 13/11 "phân thân không đánh boss sát thủ, chỉ hỗ trợ"): còn sống, trong bãi, cách người thuê ≤ PT_BOSS, người
    // thuê đang nhắm hoặc boss đang đánh nhau (aggro) — null nếu không
    ptTimBoss() {
      const p = this.player; if (p.hp <= 0) return null;
      const gan = (m) => !!m && m.sat && m.alive && this.mobs.includes(m) && ldist(p.x, p.y, m.x, m.y) <= PT_BOSS;
      if (gan(p.target)) return p.target;
      for (const m of this.mobs) if (m.aggro && gan(m)) return m;
      return null;
    },
    ptBuoc(a, dt) {
      a.t += dt; a.cp = this.pheMinh(); a.hoTroT -= dt; a.chonT -= dt; // đếm cả lúc đang vung đòn (thử 05/11: đánh liên tục thì không tới lượt hồi máu)
      const p = this.player;
      if (ldist(a.x, a.y, p.x, p.y) > PT_DICH) { a.don = null; return this.ptDatCanh(a); } // cả lúc đang vung đòn: bỏ đòn, hiện lại cạnh
      if (a.act === "attack") {
        if (!a.hitDone && a.t >= a.hitAt) { a.hitDone = true; const f = a.don; a.don = null; if (f && p.hp > 0) f(); }
        if (a.t < a.atkDur) return;
        this.setAct(a, "stand");
      }
      if (p.hp <= 0) { a.target = null; a.path = null; a.fight = false; this.setAct(a, "stand"); return; } // người thuê trọng thương: đứng chờ
      this.ptVongDich(a, dt);
      if (a.hoTroT <= 0) { a.hoTroT = 0.5; if (this.ptHoTro(a)) return; }
      const B = this._ptBoss;
      if (B) { // đang đánh Boss Sát thủ (anh 13/11): phân thân thôi đánh — Nga My đứng hồi máu, phái có bùa hại ra bùa lên boss, còn lại đứng cạnh (vòng sáng / bùa lợi vẫn có)
        a.target = null; a.fight = false;
        if (this.ptBuaHai(a, B, dt)) return;
        return this.ptTheo(a, dt);
      }
      if (this.ptDanh(a, dt)) return;
      this.ptTheo(a, dt);
    },
    // hồi máu / bùa lợi lên người thuê -> true khi vừa thi pháp
    ptHoTro(a) {
      const p = this.player, db = this.P.skillDb, t = this.time;
      if (!this.P.vc || !db || p.an) return false;
      const gan = (id) => ldist(a.x, a.y, p.x, p.y) <= ((db[id] && db[id].radius) || 400) * SCALE;
      const H = a.hoi;
      const pct = H && this._ptBoss && a.ngaMy ? Math.max(H.pct, HOI_BOSS) : H ? H.pct : 0; // Nga My lúc đánh Boss Sát thủ: hồi sớm hơn (anh 13/11 "chỉ đứng và hỗ trợ hồi máu")
      if (H && t >= a.hoiT && p.hp < (p.hpMax * pct) / 100 && gan(H.id)) { a.hoiT = t + HOI_GIAN; return this.ptThiPhap(a, H.id, () => this.buffOn(H.id, H.lv)); }
      for (const b of a.buaDoi) {
        if (b.id === (H && H.id) || t < b.lai) continue;
        const c = p.buffs.get(b.id); if (c && (c.until - t > 3 || (c.lv | 0) > b.lv)) continue; // bùa cấp cao hơn (của người thuê): để Trợ Thủ người thuê dùng lại
        const AD = this.hero.auto && this.hero.auto.danh; if (this.auto && AD && (AD.bua || []).includes(b.id) && this.skLv(b.id) >= b.lv) continue; // người thuê tự đánh, tự dùng bùa này cấp ≥: nhường
        if (b.ngan && p.hp > p.hpMax * 0.6) continue; // bùa hồi máu ngắn (≤ 5 giây): chỉ khi sinh lực < 60 % (như Trợ Thủ autoBuff)
        if (b.giai && !((p.slowUntil || 0) > t || (p.stunUntil || 0) > t || p.poison)) continue; // Xuất Ứ Bất Nhiễm: chỉ khi người thuê đang dính trạng thái xấu
        if (!gan(b.id)) continue;
        b.lai = t + Math.max(1.5, b.cd); // hồi chiêu đúng của chiêu (anh 08/11)
        return this.ptThiPhap(a, b.id, () => { const c2 = this.player.buffs.get(b.id); if (!c2 || (c2.lv | 0) <= b.lv) this.buffOn(b.id, b.lv); }); // kiểm lại lúc bùa vào (soát 05/11)
      }
      return false;
    },
    // động tác thi pháp quay về người thuê; fn chạy ở nhịp ra đòn
    ptThiPhap(a, id, fn) {
      const p = this.player, k = this.P.vc.sk(id);
      a.attack = "Magic"; a.atkDur = R.atkFrames(CAST_T, a.p.castSpeed || 0) * TICK; a.hitAt = a.atkDur * HIT_AT; a.don = fn;
      a.dir = dirOf(p.x - a.x, (p.y - a.y) * 2); a.path = null; a.act = "attack"; a.t = 0; a.hitDone = false; a.atkN = (a.atkN || 0) + 1;
      if (k && k.pre) this.vfxAt(k.pre, null, a, 0);
      return true;
    },
    // quái phân thân đánh (≤ PT_TAM quanh người thuê)
    ptMuc(a) {
      const p = this.player, AD = this.hero.auto && this.hero.auto.danh, neSat = !AD || AD.neSat !== false;
      const B = a.boQua, t = this.time; if (B.size > 20) for (const [m, het] of B) if (het <= t || !m.alive) B.delete(m);
      const ok = (m) => !!m && m.alive && !m.dummy && !m.coc && !m.btg && !m.nhim && !m.mcv && !m.ph && !m.sat && !((B.get(m) || 0) > t) && ldist(p.x, p.y, m.x, m.y) <= PT_TAM;
      const trongBai = (m) => !!m && this.mobs.includes(m); // con đã bị gỡ khỏi bãi (quái xa, đồng bộ quái chung) mà còn "sống": bỏ
      if (trongBai(p.target) && ok(p.target)) return p.target;
      if (trongBai(a.target) && ok(a.target)) return a.target;
      let best = null, bd = Infinity;
      for (const m of this.mobs) if (ok(m) && m.aggro) { const d = ldist(a.x, a.y, m.x, m.y); if (d < bd) { bd = d; best = m; } }
      if (best || !this.auto || p.an) return best;
      for (const m of this.mobs) if (ok(m) && !(m.sat && neSat)) { const d = ldist(p.x, p.y, m.x, m.y); if (d < bd) { bd = d; best = m; } } // né Boss Sát thủ như Trợ Thủ người thuê (danh.neSat)
      return best;
    },
    // đánh -> true khi đang lo việc đánh (chạy tới / đứng chờ hồi chiêu / ra đòn)
    ptDanh(a, dt) {
      const p = this.player;
      if (a.chonT <= 0 || (a.target && !a.target.alive)) { a.chonT = 0.25; a.target = this.ptMuc(a); }
      const m = a.target; a.fight = !!m;
      if (!m) return false;
      if (ldist(a.x, a.y, p.x, p.y) > PT_XICH) { a.target = null; a.fight = false; return false; }
      const c = a.chieu, d = ldist(a.x, a.y, m.x, m.y);
      if (d <= (laBoss(m) ? Math.min(a.tam, BOSS_TAM * SCALE) : a.tam) + m.radius) { // boss (anh 16/11): phân thân tầm xa cũng vào trong BOSS_TAM
        a.path = null; a.tienK = null; a.dir = dirOf(m.x - a.x, (m.y - a.y) * 2);
        if (c && (a.p.cd[c.id] || 0) > this.time) { this.setAct(a, "stand"); return true; } // chờ hồi chiêu
        this.ptRaDon(a, m);
        return true;
      }
      this.ptChay(a, m.x, m.y, dt);
      return true;
    },
    // bắt đầu 1 đòn: chiêu (động tác như castStart — ngoại công đánh 1 / 2, nội công thi pháp; đánh nhiều đòn theo nhịp đòn) hoặc đòn thường
    ptRaDon(a, m) {
      const c = a.chieu;
      if (c) {
        const spd = c.s.phys ? a.p.atkSpeed || 0 : a.p.castSpeed || 0;
        let dur = R.atkFrames(CAST_T, spd) * TICK, hit = dur * HIT_AT;
        if (c.s.style === 1 && c.k.form === 12 && c.k.genData > 0) { const sw = this.manyGap(c.id, c.k) * TICK; dur = Math.max(1, c.k.num || 1) * sw; hit = HIT_AT * sw; }
        a.attack = c.s.phys ? (c.k.anim === 9 || c.k.anim === 10 ? ANIM[c.k.anim] : a.attack === "Attack1" ? "Attack2" : "Attack1") : ANIM[c.k.anim] || "Magic";
        a.atkDur = dur; a.hitAt = hit; a.don = () => this.ptBan(a, m);
        if (c.k.pre) this.vfxAt(c.k.pre, null, a, 0);
      } else {
        a.attack = a.attack === "Attack1" ? "Attack2" : "Attack1";
        a.atkDur = a.p.atkDur; a.hitAt = a.p.atkDur * HIT_AT; a.don = () => this.ptDonThuong(a, m);
      }
      a.act = "attack"; a.t = 0; a.hitDone = false; a.atkN = (a.atkN || 0) + 1;
    },
    // bùa hại của phân thân lên Boss Sát thủ (ptBuoc lúc đánh boss): bùa nào boss chưa mang (hoặc còn ≤ 1 giây), hết hồi chiêu, thử lại cách ≥ 3 giây thì ra;
    // ngoài tầm thì chạy lại gần. Nga My không ra (chỉ đứng hồi máu). -> true khi đang lo việc ra bùa
    ptBuaHai(a, m, dt) {
      if (a.ngaMy || !a.buaHai || !a.buaHai.length || !this.P.vc) return false;
      const t = this.time;
      for (const b of a.buaHai) {
        if (t < b.lai || (a.p.cd[b.id] || 0) > t) continue;
        if ((m.curse || []).some((c) => c.id === b.id && c.until > t + 1)) continue;
        if (ldist(a.x, a.y, m.x, m.y) > Math.min(this.skRange(b.id, b.lv), laBoss(m) ? BOSS_TAM * SCALE : Infinity) + (m.radius || 14)) { this.ptChay(a, m.x, m.y, dt); return true; } // boss: trong BOSS_TAM (anh 16/11)
        b.lai = t + 3;
        return this.ptRaBua(a, m, b);
      }
      return false;
    },
    // ra 1 bùa hại: động tác thi pháp quay về boss, đạn thật mang ptA ở nhịp ra đòn (vocong.js ptTrung -> curseOn), hồi chiêu như castPay
    ptRaBua(a, m, b) {
      const s = this.skDef(b.id), k = this.P.vc.sk(b.id); if (!s || !k) return false;
      a.attack = s.phys ? "Attack1" : ANIM[k.anim] || "Magic"; a.atkDur = R.atkFrames(CAST_T, (s.phys ? a.p.atkSpeed : a.p.castSpeed) || 0) * TICK; a.hitAt = a.atkDur * HIT_AT;
      a.dir = dirOf(m.x - a.x, (m.y - a.y) * 2); a.path = null; a.tienK = null; a.act = "attack"; a.t = 0; a.hitDone = false; a.atkN = (a.atkN || 0) + 1;
      a.don = () => {
        const A = lvAttrs(s, b.lv), cdT = (A.skill_mintimepercast_v && A.skill_mintimepercast_v[0]) || k.tpc || 0; if (cdT) a.p.cd[b.id] = this.time + cdT * TICK;
        const pt = [m.x, m.y]; if (this.P.vc.warm) this.P.vc.warm(b.id);
        this.fire(b.id, b.lv, { root: b.id, x: a.x, y: a.y, tgt: m.alive ? m : null, pt, goc: a, ptA: a });
        if (this.onChieu) this.onChieu(b.id, b.lv, a.x, a.y, pt, a.slot);
      };
      if (k.pre) this.vfxAt(k.pre, null, a, 0);
      return true;
    },
    // ra chiêu ở nhịp ra đòn: đạn thật mang ptA (vocong.js ptTrung), hồi chiêu như castPay (không tốn nội lực)
    ptBan(a, m) {
      const c = a.chieu, A = lvAttrs(c.s, c.lv), cdT = (A.skill_mintimepercast_v && A.skill_mintimepercast_v[0]) || c.k.tpc || 0;
      if (cdT) a.p.cd[c.id] = this.time + cdT * TICK;
      const pt = m ? [m.x, m.y] : [a.x + 1, a.y]; // con vừa chết trước nhịp ra đòn: vẫn tung vào chỗ nó
      if (this.P.vc.warm) this.P.vc.warm(c.id);
      this.fire(c.id, c.lv, { root: c.id, x: a.x, y: a.y, tgt: m && m.alive ? m : null, pt, goc: a, ptA: a });
      if (this.onChieu) this.onChieu(c.id, c.lv, a.x, a.y, pt, a.slot); // người cùng bãi vẽ lại từ phân thân này (ws.js "chieu" pt)
    },
    // đòn thường (như World.land, không hút sinh lực / nội lực)
    ptDonThuong(a, m) {
      if (!m || !m.alive || m.sat || ldist(a.x, a.y, m.x, m.y) > (laBoss(m) ? Math.min(a.p.reach, BOSS_TAM * SCALE) : a.p.reach) + m.radius + 20) return; // Boss Sát thủ: không gây sát thương (anh 13/11); boss khác: ám khí cũng trong BOSS_TAM (anh 16/11)
      const d = R.heroDamage(a.p, m);
      this.hit(a.p, m, d);
      if (d.miss) return;
      if (d.cold > 0) this.voiPhanThan(a, () => this.slowMob(m, this.quaiVC ? this.khungCham(null) : null));
      if (m.vaDoi && this.onVaTT) this.onVaTT(m);
      if (d.doc > 0 && m.alive) this.docDon(m, d.doc, a.p);
      if (this.P.fx) this.spawnFx(a.p.atkFx, m);
    },
    // vòng sáng đánh địch (Vô Hình Độc) của phân thân: mỗi giây khi đang đánh, mọi quái trong tầm × 1,3 quanh phân thân trúng chiêu con (vcUpdate)
    ptVongDich(a, dt) {
      const V = a.vongDich; if (!V || !this.P.vc || !a.fight || (a.vdT = (a.vdT || 0) + dt) < 1) return;
      a.vdT = 0;
      const k = this.P.vc.sk(V.id) || {}, ck = k.kid ? this.P.vc.sk(k.kid) : null, R2 = this.skRange(V.id, V.lv) * VONG_DICH;
      const ds = this.mobs.filter((e) => e.alive && !(e.dummy || e.coc || e.btg || e.nhim || e.mcv || e.ph || e.sat) && ldist(a.x, a.y, e.x, e.y) <= R2); if (!ds.length) return; // Boss Sát thủ: không (anh 13/11)
      if (ck) { const d = (ck.mis && this.P.vc.mi(ck.mis)) || { a: [], b: [], snd: [] }, kl = k.kidLv > 0 ? k.kidLv : V.lv; for (const e of ds) this.ptTrung({ src: { id: k.kid, lv: kl, root: V.id, k: ck, enemy: true, depth: 1, ptA: a }, d, hit: new Map(), t: 0 }, e); }
      else this.fire(V.id, V.lv, { root: V.id, x: a.x, y: a.y, tgt: null, pt: null, goc: a, ptA: a });
    },
    // theo người thuê: lệch chỗ đứng quá PT_CACH thì chạy tới
    ptTheo(a, dt) {
      const [x, y] = this.ptCho(a);
      if (ldist(a.x, a.y, x, y) > (a.act === "run" ? 8 : PT_CACH)) return this.ptChay(a, x, y, dt);
      a.path = null; a.tienK = null; this.setAct(a, "stand");
    },
    // chạy tới (x, y): tìm đường lại mỗi 0,4 giây / khi đích dời; nhanh hơn người thuê 15 % để bắt kịp. Kẹt (vật cản, quái ở chỗ không tới được —
    // thử 05/11: trượt dọc tường mãi không tới): 2 giây không lại gần đích được 6 px -> bỏ con đang đuổi 6 giây (boQua) / hiện lại cạnh người thuê
    ptChay(a, x, y, dt) {
      // đích dời (người thuê / quái đang chạy) mà đường là 1 đoạn thẳng: chỉ dời điểm cuối; tìm đường (A*) lại theo nhịp 0,4 giây (soát 05/11: bản
      // trước tìm lại mỗi lần đích dời 20 px — 7–10 lần / giây mỗi phân thân lúc người thuê chạy, nặng cho điện thoại)
      const g = a.goal, lech = g ? Math.abs(g[0] - x) + Math.abs(g[1] - y) : Infinity; // đích đổi hẳn (> 120 — đang theo -> đuổi quái): tìm ngay
      if (a.path && a.path.length === 1 && lech > 20 && lech <= 120) { a.path[0] = [x, y]; a.goal = [x, y]; }
      else if (!a.path || !a.path.length || (a.repath -= dt) <= 0 || lech > 120) { a.repath = 0.4; a.goal = [x, y]; a.path = this.map.path(a.x, a.y, x, y, 4000) || [[x, y]]; }
      const p = this.player, sp = Math.max(a.toc, RUN * (1 + (p.moveSpeed || 0) / 100)) * 1.15;
      if (this.follow(a, a.path, sp, dt)) a.path = null;
      this.setAct(a, "run");
      const k = a.target || p, d = ldist(a.x, a.y, x, y);
      if (a.tienK !== k || d < a.tienD - 6) { a.tienK = k; a.tienD = d; a.tienT = 0; }
      else if ((a.tienT += dt) > 2) {
        a.tienK = null;
        if (a.target) { a.boQua.set(a.target, this.time + 6); a.target = null; a.fight = false; a.path = null; } else this.ptDatCanh(a);
      }
    },
  });
}
