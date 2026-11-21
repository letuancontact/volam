// Ô xem chiêu như client (rê chuột lên chiêu ở bảng Võ công). Dữ liệu: assets/web/skill/tip.json (tools/build-skill-tip.mjs — khung,
// bảng màu engine, chữ [SkillAttrib] / [WeaponLimit] / G_Skills_* / magicdesc.ini, mô tả gốc) + skills.json (chỉ số theo cấp).
// Thứ tự dòng = engine vẽ — theo ảnh GAME THẬT (client + server của mình) anh gửi 24/10: Hạo Nhiên Chi Khí, Kim Quyên La Hán, Vi Đà
// Hiến Xử (khớp 86/86 dòng kể cả dòng trống; 3 ảnh đầu tiên anh gửi là bản client khác, chỉ dùng cho khung / màu / cách chia mô tả):
//   tên gốc(hệ …) (vàng) · "Đẳng cấp yêu cầu: N" khi nhân vật chưa đủ cấp / trống · mô tả · trống ×2 · lưu phái / trấn phái · trống
//   · Đẳng cấp hiện thời · [Hỗ trợ từ các kỹ năng khác: N%] · [Mức độ luyện — cột IsExpSkill] · trống · chỉ số cấp này (câu skill_desc
//   của Lua · ngũ hành tương khắc, tiêu hao, phạm vi, nhóm sát thương theo thứ tự engine · [trống] · thuộc tính khác theo thứ tự
//   skills.txt; số 0 thì ẩn · "Tầng thứ N" + chỉ số chiêu con) · trống ×2 · "Kỹ năng X: +y%" (chỉ X học được — xem
//   tools/build-skill-tip.mjs) · trống · Hạn chế vũ khí / cưỡi ngựa · trống · "Đẳng cấp tiếp theo" (đỏ; cả ở cấp tối đa) · trống · chỉ số
//   cấp sau (đỏ).
// Chữ canh giữa, font chữ ảnh cỡ 12 của client, dòng cao 13 (đo ảnh); chỉ mô tả dài mới xuống dòng (splitDesc), dòng khác giữ 1 dòng.
//   const html = skillTipHtml(tip, skills, id, lv, { heroLvl, heroSkills })   // lv = cấp hiện tại (0 = chưa học)

// nhóm sát thương: engine viết theo thứ tự này (ảnh: Độ chính xác -> Sát thương vật lý -> Lôi sát -> Hút nội lực -> Chí mạng)
import { LAP_LAI, GIOI_HAN_DON } from "./vocong.js";

const DMG = ["attackrating_v", "attackrating_p", "ignoredefense_p", "physicsdamage_v", "physicsenhance_p", "colddamage_v", "firedamage_v", "lightingdamage_v",
  "poisondamage_v", "magicdamage_v", "steallife_p", "stealmana_p", "stealstamina_p", "knockback_p", "deadlystrike_p", "fatallystrike_p", "stun_p"];
// không hiện (dữ liệu chạy của engine: đạn, sự kiện, độ luyện…) — ảnh client không có dòng nào cho chúng
const HIDE = /^missle_|^skill_(eventskilllevel|collideevent|startevent|showevent|flyevent|vanishedevent|skillexp_v|param\d_v|mintimepercastonhorse_v|dohurt)$|^addskillexp\d$/;
// Ảnh client Thái Cực Thần Công (38) không có 4 dòng chính xác cộng thêm / Nội lực tối đa (Dương) / tăng, giảm sát thương hệ Thủy mà
// skills.txt của mình có — ảnh đó là bản client khác (ảnh ghi "(Hệ Thổ)", "Kiếm Thủy Tinh Hà"; client mình "hệ Thổ", "Kiếm Thùy Tinh
// Hà") và magicdesc.ini của mình CÓ câu cho các thuộc tính đó -> hiện theo dữ liệu client mình (không giấu).
// Câu mẫu dùng tham số 4..9 (vd autoreplyskill "có #d9-% tỉ lệ tự động thi triển #l4- cấp #d7-"): giá trị gói nhiều phần — script
// client viết 16777216 + mã chiêu × 256 + cấp (tham số 1) và giây × 18 × 256 + tỉ lệ (tham số 3) -> 4 = mã chiêu, 5 = byte cao,
// 7 = cấp, 8 = thời gian (khung), 9 = tỉ lệ (TẠM: giải từ script\skill\wuhuntang.lua, chưa có ảnh client để so)
const SUB = { 4: (p) => (p[0] >> 8) & 0xffff, 5: (p) => p[0] >>> 24, 6: (p) => p[1], 7: (p) => p[0] & 0xff, 8: (p) => p[2] >> 8, 9: (p) => p[2] & 0xff };
const SERIES = ["G_S_GOLD", "G_S_WOOD", "G_S_WATER", "G_S_FIRE", "G_S_EARTH"];
const COST = ["G_Skills_45", "G_Skills_46", "G_Skills_47"]; // loại tiêu hao 0 nội lực / 1 thể lực / 2 sinh mệnh (TẠM thứ tự 1, 2)

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Mô tả dài: engine chia thành các phần ĐỀU NHAU theo byte (chữ TCVN3 1 byte), điểm cắt = tổng × i / số dòng, rơi giữa "chữ 2 byte" thì
// lùi 1 — engine đọc kiểu GBK: byte ≥ 0x81 là byte đầu, ghép với byte sau thành 1 chữ (chữ Việt có dấu ghép với ký tự kế tiếp). Khớp
// từng ký tự 2 ảnh client: 43 byte -> cắt 21 ("Kiếm pháp tuyệt đỉnh / , công thủ…"), 53 byte -> 26 rơi giữa "ả"+" " -> 25 ("…tăng kh / ả
// năng…"). Ảnh 36: 34 byte để 1 dòng -> ngưỡng chia trong 34..42 byte; DESC_MAX = 40 (TẠM giữa khoảng).
const DESC_MAX = 40;
// (ô xem món cũng chia câu mô tả y như vậy — ảnh game thật 25/10 Huyền Thiết Kiếm: 81 ký tự -> 3 dòng 27 "…nhọn v / à dài…"; Khinh
// Cát sam 38 ký tự -> 1 dòng; src/game/itemtip.js)
// câu skill_desc của script Lua (chiêu 120: Hỗn Thiên Khí Công…) có dòng rất dài -> ô xem chiêu tràn ngang màn hình (anh 26/10): xuống dòng
// theo chữ khi quá LVDESC_MAX ký tự hiện (không tính thẻ <color>), dòng sau mở lại màu đang dùng
const LVDESC_MAX = 46;
export function wrapRich(line, max) {
  const out = []; let cur = "", n = 0, col = null;
  for (const tok of line.split(/(<color(?:=[^>]*)?>|\s+)/i).filter((x) => x !== "")) {
    const tag = /^<color(?:=([^>]*))?>$/i.exec(tok);
    if (tag) { col = tag[1] ? tok : null; cur += tok; continue; }
    if (/^\s+$/.test(tok)) { if (n) { cur += " "; n++; } continue; }
    if (n && n + tok.length > max) { out.push(cur.trimEnd()); cur = col || ""; n = 0; }
    cur += tok; n += tok.length;
  }
  if (cur.trim()) out.push(cur.trimEnd());
  return out.length ? out : [line];
}
export function splitDesc(t) {
  const n = t.length; if (n <= DESC_MAX) return [t];
  const ok = new Set([0]); // vị trí được cắt (không giữa cặp byte đầu + byte sau)
  for (let i = 0; i < n; ) { i += t.charCodeAt(i) > 127 ? 2 : 1; ok.add(Math.min(i, n)); }
  const k = Math.ceil(n / DESC_MAX), out = [];
  let a = 0;
  for (let j = 1; j < k; j++) { let p = Math.floor((n * j) / k); while (p > a && !ok.has(p)) p--; out.push(t.slice(a, p)); a = p; }
  out.push(t.slice(a));
  return out;
}
// printf của chuỗi client: %d %s %%
const cf = (s, ...a) => { let i = 0; return String(s || "").replace(/%%|%[ds]/g, (m) => (m === "%%" ? "%" : String(a[i++] ?? ""))).replace(/\n+$/, ""); };

// opt.heroLvl: cấp nhân vật ("Đẳng cấp yêu cầu" khi chưa đủ); opt.heroSkills: { mã: cấp } ("Hỗ trợ từ các kỹ năng khác"); opt.luyen: { exp, can } chiêu luyện
export function skillTipHtml(T, skills, id, lv, opt = {}) {
  const s = skills[id]; if (!s) return "";
  const rgb = (n) => { const c = T.colors[Object.keys(T.colors).find((k) => k.toLowerCase() === String(n).toLowerCase())]; return c ? `rgb(${c.join(",")})` : null; };
  // chữ có thẻ <color=Tên>…<color> -> span màu engine
  const rich = (t) => {
    let out = "", open = false;
    for (const part of String(t).split(/(<color(?:=[^>]*)?>)/i)) {
      const m = /^<color(?:=([^>]*))?>$/i.exec(part);
      if (m) { if (open) { out += "</span>"; open = false; } const c = m[1] && rgb(m[1].trim()); if (c) { out += `<span style="color:${c}">`; open = true; } continue; }
      out += esc(part);
    }
    return out + (open ? "</span>" : "");
  };
  const name = (sid) => (skills[sid] ? skills[sid].n : T.names && T.names[sid] ? T.names[sid] : `#${sid}`);
  // "Kỹ năng X: +y%" chỉ hiện X là chiêu học được (anh chốt 24/10); chiêu con / chiêu bỏ đi vẫn nằm trong dữ liệu, khi đánh vẫn cộng
  const learn = new Set(T.learn || []);
  // đòn con theo sự kiện (bay / trúng / tan / lúc ra chiêu) — có dòng hỗ trợ riêng thì khi đánh được cộng (vocong.js supDon); đòn ChildSkillId là vỏ của chiêu gốc, không hiện
  const conChild = new Set(Object.values(skills).map((o) => o.sub && o.sub.child).filter(Boolean));
  const donSuKien = (o) => { const r = new Set(); for (const k of ["start", "fly", "collide", "vanish"]) if (o.sub && o.sub[k]) r.add(o.sub[k]); for (const [k, a] of Object.entries(o.lv || {})) if (/^skill_(start|fly|collide|vanished)event$/.test(k)) { const p = a[a.length - 1]; if (p && p[2]) r.add(p[2]); } return [...r]; };
  // câu mẫu magicdesc: #d1+ (số có dấu) #d1- / #d1~ (số) #d3 (tham số 3) #f (giây — TẠM chia 18) #l (tên võ công)
  // p = null: thuộc tính script client bỏ trống (skills.json lvEmpty) — game thật in "-0" (ảnh 1370 "…sát thương: -0%"; số không dấu: 0 — TẠM)
  const fill = (tpl, p) => tpl.replace(/#([dflksmx])(\d)([+\-~]?)/g, (m, t, n, sg) => {
    if (!p) return t === "d" && sg === "+" ? "-0" : "0";
    const v = +n <= 3 ? p[+n - 1] ?? 0 : SUB[n] ? SUB[n](p) : 0;
    if (t === "d") return sg === "+" && v >= 0 ? "+" + v : String(v);
    if (t === "f") return String(Math.round((v / 18) * 10) / 10);
    if (t === "l") return ` [ ${name(v)} ]`; // tên võ công: engine in " [ tên ]" (đo ảnh game thật Kim Quyên La Hán theo ô chữ 6 điểm ảnh)
    return String(v);
  });
  const at = (sk, k, L) => { const a = sk.lv && sk.lv[k]; return a && a[L - 1] ? a[L - 1] : null; };
  const zero = (p) => !p || p.every((v) => !v);
  // chỉ số của 1 võ công ở cấp L: g1 = ngũ hành / tiêu hao / phạm vi + nhóm sát thương (thứ tự engine), g2 = thuộc tính khác (thứ tự
  // skills.txt), bonus = "Kỹ năng X: +y%". Ở tầng (layer) bỏ ngũ hành / tiêu hao / phạm vi (ảnh: "Tầng thứ 2" chỉ có Độ chính xác, Băng sát).
  const G1 = ["seriesdamage_p", "skill_cost_v", "skill_attackradius"];
  const stats = (sk, L, layer) => {
    const g1 = [], g2 = [], bonus = [], keys = sk.lvKeys || Object.keys(sk.lv || {});
    const one = (k, dst) => {
      if (sk.lvEmpty && sk.lvEmpty.includes(k)) { if (T.magic[k] && !HIDE.test(k)) dst.push(fill(T.magic[k], null)); return; }
      const p = at(sk, k, L); if (zero(p) || HIDE.test(k)) return;
      if (k === "seriesdamage_p") return dst.push(cf(T.str.G_Skills_75, p[0]));
      if (k === "skill_cost_v") return dst.push(cf(T.str[COST[(sk.cost && sk.cost.type) || 0]] || T.str.G_Skills_45, p[0]));
      if (k === "skill_attackradius") return dst.push(cf(T.str.G_Skills_48, p[0]));
      // đòn con theo sự kiện có dòng riêng (chiêu này không ghi trùng số cho chiêu học được, tên không phải chữ Hán) cũng hiện — anh 10/11, người chơi so với client
      if (/^addskilldamage\d$/.test(k)) return learn.has(p[0]) || (skills[p[0]] && !conChild.has(p[0]) && !/[一-鿿]/.test(skills[p[0]].n) && !keys.some((k2) => { if (k2 === k || !/^addskilldamage\d$/.test(k2)) return false; const q = at(sk, k2, L); return q && learn.has(q[0]) && q[2] === p[2]; })) ? bonus.push(cf(T.str.G_Skills_49, name(p[0]), p[2])) : undefined;
      // chiêu đánh địch có dòng giảm tốc chạy (âm — Ngũ Độc Vô Hình Độc): client chỉ in "Tốc độ di chuyển: -42%", dễ hiểu nhầm là của
      // mình -> ghi rõ làm chậm đối phương + thời gian (anh 26/10)
      if (k === "fastwalkrun_p" && p[0] < 0 && sk.target && sk.target.enemy) {
        dst.push(`Làm chậm đối phương: ${p[0]}% tốc độ di chuyển`);
        if (p[1] > 0) dst.push(`Thời gian làm chậm: ${Math.round((p[1] / 18) * 10) / 10} giây`);
        return;
      }
      // chiêu ghép (Nga My 120 Bế Nguyệt Phất Trần: 5 dòng "Gồm kỹ năng" — gói giữ dòng 2 trở đi ở lvGhep). Câu client "đẳng cấp cao nhất: cấp
      // #d3" mà số thứ 3 của script luôn 0 -> in "cấp 0"; engine chạy chiêu ghép ở min((cấp chiêu + cấp đã học) / 2, cấp chiêu) -> cao nhất =
      // cấp chiêu này (L)
      if (k === "skill_appendskill") { for (const v of [p, ...(sk.lvGhep || []).map((g) => g[L - 1])]) if (!zero(v)) dst.push(fill(T.magic[k], [v[0], v[1], L])); return; }
      if (T.magic[k]) dst.push(fill(T.magic[k], p));
    };
    if (!layer) for (const k of G1) if (keys.includes(k)) one(k, g1);
    for (const k of DMG) if (keys.includes(k)) one(k, g1);
    for (const k of keys) if (!DMG.includes(k) && !G1.includes(k)) one(k, g2);
    return { g1, g2, bonus };
  };
  // phần chỉ số ở cấp L (ảnh game thật 24/10 Vi Đà Hiến Xử, Kim Quyên La Hán): câu skill_desc của script Lua (lvDesc) · g1 · [trống nếu có
  // cả g1 lẫn g2] · g2 · tầng: mỗi bit skill_showevent (1 start, 2 fly, 4 collide, 8 vanish) -> "Tầng thứ N: tên [cấp E]" (xanh, E =
  // skill_eventskilllevel) + chỉ số chiêu con ở cấp E. "" = dòng trống. Trả [dòng, dòng "Kỹ năng X"].
  const props = (L) => {
    const lines = [], d = s.lvDesc && s.lvDesc[L - 1];
    if (d) for (const l of d.replace(/\n+$/, "").split("\n")) lines.push(...wrapRich(l, LVDESC_MAX));
    const { g1, g2, bonus } = stats(s, L, false);
    lines.push(...g1); if (g1.length && g2.length) lines.push(""); lines.push(...g2);
    const se = at(s, "skill_showevent", L), el = at(s, "skill_eventskilllevel", L);
    let n = 0;
    if (se && se[0]) for (const [bit, k] of [[1, "start"], [2, "fly"], [4, "collide"], [8, "vanish"]]) {
      if (!(se[0] & bit)) continue;
      const es = skills[(s.subLv && s.subLv[k]) || (s.sub && s.sub[k])]; if (!es) continue;
      const E = el && el[0] > 0 ? el[0] : L, r = stats(es, E, true), lap = LAP_LAI[es.id] ? LAP_LAI[es.id](E) : 1;
      n++; lines.push(`${cf(T.str["G_Skills_" + (50 + n)])}<color=Blue>${es.n}${cf(T.str.G_ITEM_22, E)}<color>`, ...r.g1, ...r.g2);
      if (lap > 1) lines.push(`Số lần nổ: ${lap}`); // chỉnh riêng của bản mình (vocong.js LAP_LAI) — ghi rõ cho người chơi
    }
    // giới hạn đòn mỗi mục tiêu mỗi lần ra chiêu (chỉnh riêng của bản mình — vocong.js GIOI_HAN_DON, anh 11/11): ghi rõ cho người chơi
    if (GIOI_HAN_DON[s.id]) lines.push(...wrapRich(`Mỗi mục tiêu chịu tối đa ${GIOI_HAN_DON[s.id]} đòn mỗi tầng trong 1 lần xuất chiêu`, LVDESC_MAX));
    return [lines, bonus];
  };
  const out = []; // [html, màu]
  const W = rgb("White"), Y = rgb("Yellow"), R = rgb("Red");
  const push = (t, c = W) => out.push([t == null ? "" : rich(t), c]);
  const blank = () => out.push(["", W]);
  // tên gốc (giữ dấu cách cuối của skills.txt — tip.json nameRaw) + "(hệ X)" liền sau (ảnh game thật: "Vi Đà Hiến Xử(hệ Kim)")
  push(((T.nameRaw && T.nameRaw[id]) ?? s.n) + (s.series >= 0 && T.str[SERIES[s.series]] ? `(${T.str[SERIES[s.series]]})` : ""), Y);
  // dòng 2: "Đẳng cấp yêu cầu: N" khi nhân vật chưa đủ cấp, không thì trống (ảnh game thật nhân vật cấp 1: Kim Quyên La Hán 120). Đã học
  // (anh 29/10 — cấp chiêu theo cấp nhân vật như engine, rules.js capChieu): N = cấp nhân vật cần để cộng cấp kế = cấp yêu cầu + cấp đang có
  // chiêu luyện (opt.luyen — anh 29/10): lên cấp bằng độ luyện, không theo cấp nhân vật -> chỉ ghi cấp yêu cầu khi chưa học
  const can = lv > 0 ? (lv < (s.max || 20) && !opt.luyen ? (s.req || 0) + lv : 0) : s.req || 0;
  if (opt.heroLvl != null && can > opt.heroLvl) push(cf(T.str.G_SkillList_6, can)); else blank();
  for (const para of String(T.desc[id] ?? s.desc ?? "").split(/<enter>|\n/i)) for (const l of splitDesc(para)) push(l);
  // mô tả · 2 dòng trống · lưu phái · 1 dòng trống · cấp (3/3 ảnh game thật 24/10 đo theo dòng 13 điểm ảnh — TẠM: cả 3 ảnh là nhân vật cấp 1)
  blank(); blank();
  if (T.attrib[s.attrib]) push(T.attrib[s.attrib]);
  blank();
  // opt.lvGoc: cấp đã học khi đang được cộng cấp (Báo Đáp Ân Sư — Nhất Kỷ / Càn khôn, anh 16/11 "đưa chuột vào thì hiện 20+3, đúng bài") -> "20+3"
  push(cf(T.str.G_Skills_37, opt.lvGoc > 0 && lv > opt.lvGoc ? `${opt.lvGoc}+${lv - opt.lvGoc}` : lv));
  // "Hỗ trợ từ các kỹ năng khác: N%" = tổng "Kỹ năng <chiêu này>: +y%" của các chiêu khác đã học (ảnh: Vi Đà Hiến Xử 20% = Hoành Tảo
  // Thiên Quân cấp 20, các chiêu cấp 0 không tính)
  let sup = 0;
  for (const [sid, slv] of Object.entries(opt.heroSkills || {})) {
    const o = skills[sid]; if (!o || +sid === id || !(slv > 0)) continue;
    for (const [k, v] of Object.entries(o.lv || {})) { const p = /^addskilldamage\d$/.test(k) && v[Math.min(v.length, slv) - 1]; if (p && p[0] === id) sup += p[2]; }
  }
  if (sup > 0) push(cf(T.str.G_Skills_39, sup));
  // đòn con có hỗ trợ riêng (anh 10/11): chiêu 30 / 60 cộng cho đòn nổ / đòn tiếp của chiêu 90 — chiêu hỗ trợ ghi trùng số cho chiêu này thì đã nằm trong dòng trên
  if (skills[id]) for (const c of donSuKien(skills[id])) {
    let r = 0;
    for (const [sid, slv] of Object.entries(opt.heroSkills || {})) {
      const o = skills[sid]; if (!o || !(slv > 0)) continue;
      const cua = (t) => Object.entries(o.lv || {}).reduce((v, [k, a]) => { const p = /^addskilldamage\d$/.test(k) && a[Math.min(a.length, slv) - 1]; return p && p[0] === t ? v + p[2] : v; }, 0);
      const x = cua(c); if (x && x !== cua(id)) r += x;
    }
    if (r > 0 && !/[一-鿿]/.test(name(c))) push(`Hỗ trợ đòn ${name(c)}: ${r}%\n`);
  }
  // "Mức độ luyện" theo cột IsExpSkill (ảnh game thật 24/10: 1370 có dòng này dù không có skill_skillexp_v). Chiêu luyện (anh 29/10 — opt.luyen =
  // { exp, can }): như engine KSkill 当前熟练度 = độ luyện đã có / độ luyện cần ở cấp đang có; chiêu khác 0%
  if ((s.exp ?? !!(s.lv && s.lv.skill_skillexp_v)) && lv > 0) push(cf(T.str.G_Skills_40, opt.luyen && opt.luyen.can > 0 ? Math.floor((opt.luyen.exp * 100) / opt.luyen.can) : 0));
  blank();
  if (lv > 0) {
    const [l, b] = props(lv);
    for (const x of l) push(x);
    if (l.length) { blank(); blank(); }
    for (const x of b) push(x);
    if (b.length) blank();
  }
  const wl = s.eqt >= -1 && T.weapon[s.eqt] != null, hl = s.horse === 1 ? T.str.G_Skills_42 : s.horse === 2 ? T.str.G_Skills_43 : null;
  if (wl) out.push([rich(cf(T.str.G_Skills_41)) + rich(T.weapon[s.eqt]), W]);
  if (hl) push(cf(hl));
  if (wl || hl) blank();
  // ở cấp tối đa vẫn có "Đẳng cấp tiếp theo" (ảnh game thật 24/10: 1370 cấp 20/20); vượt tối đa nhờ đồ thì không (ảnh cũ Thái Cực 31/30)
  if (lv <= (s.max || 20)) {
    push(cf(T.str.G_Skills_44).replace(/^\n/, ""), R); // "<color=Red> Đẳng cấp tiếp theo" (chuỗi client)
    blank();
    const [l, b] = props(lv + 1);
    for (const x of l) push(x, R);
    if (b.length) { blank(); for (const x of b) push(x, R); }
  }
  while (out.length && !out[out.length - 1][0]) out.pop();
  const B = T.box;
  return { html: out.map(([h, c]) => `<div style="color:${c}">${h || "&nbsp;"}</div>`).join(""), box: B };
}
