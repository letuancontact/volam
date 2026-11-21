// Tống Kim — bot + PK (anh 05/11, đợt 1 bãi thử chỉ quản trị: THIET-KE-TONG-KIM.md; máy chủ may-chu/tong-kim.js; điều phối src/game/tongkim.js).
// Cài thêm hàm vào World (installTkBot). World.tk = trạng thái trận do tongkim.js đặt khi mình ở trong trận ({ phe, chu, trai, R, tri, bots, nguoi,
// chiSo(ten), gui… } — null ngoài trận).
//  - BOT: nhân vật máy hai phe dựng TẤT ĐỊNH từ [phái, giới, cấp, hạt giống] máy chủ cấp (mọi máy dựng ra cùng 1 con): đồ xanh đủ ô 2–4 dòng,
//    điểm tiềm năng / kỹ năng theo lộ phổ biến của phái (như nhân vật mẫu src/game/do-toc-do.js; kỹ năng ≤ cấp − cấp học + 1), chỉ số như người
//    thật (rules.heroStats + equipStats + skillB, bùa lợi coi như luôn có — như Phân Thân nhanvatmay.js). Bot phe địch nằm trong World.mobs (bấm
//    chọn, chiêu, Trợ Thủ đánh được — như quái), phe mình trong World.dongMinh; vẽ như người (drawHeroBody, tên theo màu phe).
//    Máu bot giữ ở máy chủ như Boss thế giới (anh 05/11 "ai kill được thì tính điểm cho họ"): ai đánh trúng cũng gửi sát thương lên (tkHit), máy
//    mình giữ ≥ 1, máy chủ báo chết, người ra đòn kết liễu được điểm.
//  - NÃO BOT: chỉ máy chủ trận (World.tk.chu) chạy — chọn mục tiêu (ưu tiên người thật, máu thấp, người đang hồi máu; tối đa CAP_DUOI bot dí 1 người),
//    phản xạ trễ theo mức thông minh, dí người, đánh nhấp nhả (phái xa đứng mép tầm, lùi khi bị áp sát, bước ngang; cận chiến đánh vài đòn rồi lách),
//    uống thuốc (máu chung: báo máy chủ hồi), hết thuốc / máu thấp thì về doanh mua thuốc, cắn hoàn lúc ra trận, đi theo nhóm. Máy khác vẽ bot theo
//    vị trí máy chủ trận báo (updateOther như người chơi khác).
//  - ĐÒN TRÚNG NGƯỜI THẬT do máy người bị đánh tính: chiêu của bot / người phe kia phát lại ở máy mình (tkA.me — đạn chỉ trúng mình), sát thương
//    theo chỉ số người ra chiêu (voiPhanThan) trừ kháng / né / giảm của mình -> né được như thật, hình trúng khớp máu mất. Đòn thường đánh người
//    phe kia: máy người đánh tính rồi gửi thẳng (tkn). ĐÒN TRÚNG BOT do máy người ra đòn tính (bot đánh bot: máy chủ trận) rồi báo máy chủ.
//  - TRẬN THẬT (đợt 2, anh 06/11 — đặc tả tk2/dac-ta-dot2.md mục 3; World.tk.tran): khu an toàn = hậu doanh (hình chữ nhật của gói bản đồ — T.hau),
//    lúc báo danh / đã xong không ai đánh được ai (T.hoa); bot ra trận ở hậu doanh, ra cổng hậu doanh bằng bẫy (tkRaHau), về mua thuốc qua bẫy đại doanh
//    -> hậu doanh (tkVe), đánh cả quân NPC + Nguyên soái, nửa số nhóm về giữ Nguyên soái phe mình khi bị đánh; đường xa theo lưới điểm đại doanh / dã ngoại
//    (dungLuoi / timLuoi — tìm đường A* tối đa 3000 ô không tới nổi đích xa trên chiến trường). QUÂN NPC (tkq — tongkim.js datBinh): não ở máy chủ trận
//    (tkNaoBinh — đứng ở chỗ sinh, thấy địch trong tầm nhìn thì đánh, đuổi trong tầm hoạt động rồi về; lính bậc 1 trôi dần sang phe kia theo điểm dã ngoại);
//    quân đánh người thật: mình -> trừ ở máy mình (R.mobDamage), người khác -> "tkn" như đòn thường của bot; quân đánh bot / quân -> "tkd" nguồn "#mã".
//    Hệ số sát thương PK (hs) chỉ cho người / bot đánh người / bot — đòn có quân NPC không nhân (máu / sát thương quân đã theo cấp như quân Phong Hỏa)
import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import * as R from "./rules.js";
import { ItemDB, wear, equipStats, weaponKind, syncRanged } from "./itemdb.js";
import { skillB, mergeB, skillSupport, kindOf, auraGhep, lvAttrs, statsOnly, eqtOk, isHeal, ANIM, CAST_T } from "./vocong.js";
import { LO } from "./do-toc-do.js";
import { AUTO_DEF, laBoss } from "./auto.js";

const TICK = 1 / 18, SCALE = 0.75;
// độc người lên người (anh 17/11 — sát thương dồn của Ngũ Độc): kéo dài đủ thời gian chiêu, tối đa DOC_MAX khung (60 giây — như may-chu/tong-kim.js), không theo trần khống chế
const DOC_MAX = 1080;
const RUN = 10 * 18 * SCALE;            // px logic / giây (RunSpeed 10 — như world.js)
const HIT_AT = 0.55;                    // ra đòn ở 55 % động tác
const DMG = /^(physicsenhance_p|physicsdamage_v|colddamage_v|firedamage_v|lightingdamage_v|poisondamage_v|magicdamage_v)$/; // như vocong.js
const NHIN = 650;                       // bot thấy mục tiêu trong chừng này (logic)
const CAP_DUOI = [0, 4, 4, 3];          // tối đa bot dí cùng 1 người thật theo mức thông minh (không bị cả bầy dồn 1 chỗ — thiết kế mục 4)
const PHAN_XA = [0, [0.45, 0.75], [0.3, 0.5], [0.18, 0.32]]; // giây trễ khi thấy mục tiêu mới / giữa 2 lần nghĩ
const DUOI_T = [0, 4, 6, 9];            // giây dí người đang chạy xa (ngoài tầm) trước khi bỏ
const NGUONG = [0, 0.7, 0.7, 0.7];      // uống thuốc khi sinh lực dưới (anh 13/11 lượt 86 "tự ăn máu khi hp thấp hơn 70%" — trước 0,35 / 0,45 / 0,55 theo mức)
// xác suất ra chiêu xong bước ngang (đánh nhấp nhả) — anh 06/11 "tốc đánh chậm rì": bản trước 0,2 / 0,35 + lách sau mỗi 2–3 đòn cận chiến + lùi 60 %
// -> bot chỉ ra ~0,6–0,75 đòn mỗi giây so với 1 đòn của người cùng tốc đánh. Nay bước ngang hiếm, ngắn, vòng quanh mục tiêu (không ra khỏi tầm)
const NHAP = [0, 0, 0.05, 0.1];
const GIAN = 60;                        // khoảng cách 2 chỗ đứng đánh cạnh nhau quanh 1 mục tiêu (tkChoDanh — anh 06/11 "đứng chụm vào hết")
const CAP_BOT = 2;                      // tối đa bot cùng nhắm 1 bot phe kia (thử 06/11: 3 con dồn 1 con — bot sống trung vị ~5 giây dù hệ số PK 0,15–0,4)
const O_VUNG = 32 * SCALE, VUNG_TOI = 6; // ô bản đồ client + trần ô vùng nổ — như vocong.js CELL / VUNG_MAX (vungO / inVung) để né đúng cỡ vùng
// lui về hồi máu (anh 06/11 lần 2 "chạy tới chạy lui nhìn rất ngu"): còn dưới LUI_MAU máu + còn thuốc -> chạy hẳn về phía doanh, tới khi đủ LUI_DU máu
// (tối đa LUI_GIU giây) mới quay lại; tối đa 1 lần / LUI_CACH giây. Bản trước lui 200 điểm rồi dí lại ngay, thêm "dính đòn thì bước tránh" — bỏ
const LUI_MAU = 0.3, LUI_DU = 0.55, LUI_GIU = 6, LUI_CACH = 12;
const MUC_GIU = 1.5, MUC_HON = 150;     // giữ mục tiêu: vừa nhắm < 1,5 giây hoặc con mới không hơn hẳn 150 điểm thì không đổi (đổi qua lại = chạy tới lui)
const NGUA_CHO = 3;                     // lên / xuống ngựa cách nhau ≥ 3 giây (như World.doiNgua của người chơi)
// phái không đánh trên ngựa được: không đánh ai ≥ RANH_NGUA giây và không có địch trong NGUA_XA thì mới lên ngựa đi (thử 06/11: 2 giây / không xét địch -> 178
// lần lên xuống trong 30 giây, vừa lên ngựa thấy địch phải đứng chờ đủ 3 giây mới xuống đánh — tốc đánh tụt)
const RANH_NGUA = 4, NGUA_XA = 1000;
const NGUA_NGHI = 5; // bot đánh trên ngựa được mà xuống ngựa để dùng bùa / hồi máu cấm ngựa: 5 giây sau mới lên lại (soát 06/11: lên xuống mỗi 3 giây)
const BOT_GIAN_DOANH = 30;              // chỗ đến của bot nằm trong doanh mình: đẩy ra ngoài mép doanh thêm chừng này (trong doanh không đánh được)
// anh 13/11 (lượt 86 — "bot tống kim mặc định dùng hồi thiên 60 bình 1 rương"): mỗi lần ra trận / về doanh mua lại mang 1 rương = 60 bình Hồi Thiên Tái Tạo Đơn
// (potion:44 của Kỳ Trân Các — hồi 750 sinh lực + 750 nội lực mỗi nửa giây, 8 lần = 6000 như người chơi uống). Trước: 25 bình thuốc 4 % máu tối đa × 10
const BINH = 60, BINH_NL = 30;          // bình Hồi Thiên / bình nội lực mang theo mỗi lần ra trận (nội lực 30: phái nội công không hết nội lực giữa trận)
const THUOC = { v: 750, mp: 750, n: 8 }; // 1 bình Hồi Thiên Tái Tạo Đơn: v sinh lực + mp nội lực mỗi nửa giây, n lần
const HOI_DOI = 3;                      // hồi máu đồng đội cách ≥ 3 giây (như Phân Thân)
const BUA_NGAN = 5;                     // bùa lợi tác dụng ≤ chừng này giây: bot không dùng (như Trợ Thủ người chơi — world.js autoBuff; tkBua)
const DAU_SAI = 0.8;                    // bot nghỉ nghĩ dài hơn khi không có ai quanh (giây)
// trận thật (đợt 2): bot thấy Nguyên soái phe kia xa hơn; tối đa bot cùng nhắm 1 lính / 1 Nguyên soái; đích xa hơn XA_LUOI thì đi theo lưới điểm
const NHIN_SOAI = 1000, CAP_BINH = 2, CAP_SOAI = 8, XA_LUOI = 1400;
const SOAI_NGUY = 10;                   // Nguyên soái phe mình bị đánh trong chừng này giây: nửa số nhóm bot về giữ (tkDiNhom), địch quanh soái được ưu tiên
// chức trong trận Tống Kim (client trạng thái 661 "trạng thái trong chiến trường Tống Kim": lifemax_p + allres_p): [sinh lực %, kháng tất cả %] theo chức
// 0–4 — Hiệu úy +20 % sinh lực; Thống lĩnh +30 %, kháng +5 %; Phó tướng +40 % / +10 %; Đại tướng +50 % / +15 % (World.bonus; bot: máy chủ nhân máu)
export const CHUC_TK = [[0, 0], [20, 0], [30, 5], [40, 10], [50, 15]];
const DANH_HIEU = [["Tống binh", "Tống Hiệu úy", "Tống Thống lĩnh", "Tống Phó tướng", "Tống Đại tướng"], ["Kim binh", "Kim Hiệu úy", "Kim Thống lĩnh", "Kim Phó tướng", "Kim Đại tướng"]]; // client settings\playertitle.txt mã 89–98
// điểm gần (x, y) nhất trong ds [[x, y]…] | null
const ganNhatDs = (ds, x, y) => { let b = null, bd = Infinity; for (const p of ds || []) { const d = ldist(x, y, p[0], p[1]); if (d < bd) { bd = d; b = p; } } return b; };

// ---------- đường xa trên chiến trường (trận thật — chiến trường 380 Xung phong rộng 14592 × 8064 điểm — anh 06/11 chọn; đo 06/11 trên chiến trường 377
// cũ 21120 × 18048, nhiều đá / cây nhỏ: tìm đường A* tối đa 3000 ô không tới đích xa; A* đủ cả bản đồ ~200 nghìn ô mất ~50 ms; nối điểm quân bằng
// đường thẳng thì lưới rời 84 mảnh) ----------
// dungLuoi(điểm, bản đồ): điểm quân đại doanh + dã ngoại 2 phe (gói bản đồ — tong-kim.json) đặt lên ô đi được (bỏ điểm trùng < 60), chia ô R (logic) để tìm
// điểm gần -> { P, R, gan(x, y, r ≤ R, fn(chỉ số)) } — lính bậc 1 trôi dần theo các điểm này (tkBinhTroi)
export function dungLuoi(pts, map, R = 1100) {
  const P = [], o = new Map(), oCua = (x, y) => [Math.floor(x / R), Math.floor((y * 2) / R)];
  const gan = (x, y, r, fn) => {
    const [cx, cy] = oCua(x, y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const i of o.get(cx + dx + "," + (cy + dy)) || []) { const q = P[i]; if (ldist(x, y, q[0], q[1]) <= r) fn(i); }
  };
  for (const p of pts || []) {
    if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    let x = p[0], y = p[1];
    if (!map.walkable(x, y)) { const c = map.grid ? map.nearestCell(x, y, 4) : -1; if (c < 0) continue; [x, y] = map.center(c); }
    let trung = false; gan(x, y, 60, () => { trung = true; }); if (trung) continue;
    const [cx, cy] = oCua(x, y), k = cx + "," + cy;
    if (!o.has(k)) o.set(k, []);
    o.get(k).push(P.length); P.push([x, y]);
  }
  return { P, R, gan };
}
// lưới thô (k × k ô bản đồ / ô thô — k 4: 96 × 96 logic): ô thô đi được khi có ≥ nguong ô đi được; điểm đại diện = ô đi được gần tâm ô thô nhất; vùng thô =
// vùng đi được của bản đồ (map.comp) chứa ô đại diện -> { k, W, H, cw, ch, dd (Int32Array ô đại diện | -1), S (mảng nháp A*) }
export function dungTho(map, k = 4, nguong = 3) {
  if (!map.grid) return null;
  const W = Math.ceil(map.gw / k), H = Math.ceil(map.gh / k), dd = new Int32Array(W * H).fill(-1);
  for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) {
    let n = 0, best = -1, bd = Infinity;
    const tx = cx * k + (k - 1) / 2, ty = cy * k + (k - 1) / 2;
    for (let y = cy * k; y < Math.min(map.gh, cy * k + k); y++) for (let x = cx * k; x < Math.min(map.gw, cx * k + k); x++) {
      const i = y * map.gw + x; if (!map.grid[i]) continue;
      n++; const d = (x - tx) ** 2 + ((y - ty) * 2) ** 2; if (d < bd) { bd = d; best = i; }
    }
    if (n >= nguong) dd[cy * W + cx] = best;
  }
  return { k, W, H, cw: map.cw * k, ch: map.ch * k, dd, S: null };
}
// timTho: A* trên lưới thô (8 hướng, chéo khi 2 ô kề cạnh đi được; chỉ ô cùng vùng đi được với đích) từ ô thô chứa (ax, ay) tới ô chứa (bx, by) -> điểm mốc
// [[x, y]…] = tâm ô đại diện, cách nhau ~buoc ô thô, điểm cuối = ô đích | null (không nối được / quá maxN ô)
export function timTho(C, map, ax, ay, bx, by, buoc = 6, maxN = 40000) {
  const { W, H, dd } = C, N = W * H;
  const oCua = (x, y) => {
    const cx = Math.max(0, Math.min(W - 1, Math.floor(x / C.cw))), cy = Math.max(0, Math.min(H - 1, Math.floor(y / C.ch)));
    if (dd[cy * W + cx] >= 0) return cy * W + cx;
    for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = cx + dx, Y = cy + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && dd[Y * W + X] >= 0) return Y * W + X; }
    return -1;
  };
  const s = oCua(ax, ay), t = oCua(bx, by); if (s < 0 || t < 0) return null;
  const vung = (ci) => map.comp[dd[ci]], vt = vung(t);
  if (s === t) return [map.center(dd[t])];
  const S = C.S && C.S.n === N ? C.S : (C.S = { n: N, g: new Float32Array(N), from: new Int32Array(N), dau: new Uint32Array(N), gen: 0 });
  if (++S.gen >= 0x7ffffff0) { S.dau.fill(0); S.gen = 1; }
  const gen = S.gen * 2, g = S.g, from = S.from, dau = S.dau, CW = C.cw, CH = C.ch * 2;
  const tx = t % W, ty = (t / W) | 0, hh = (i) => Math.hypot(((i % W) - tx) * CW, (((i / W) | 0) - ty) * CH);
  const ok = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && dd[Y * W + X] >= 0 && vung(Y * W + X) === vt;
  const Q = new DongNho(); dau[s] = gen; g[s] = 0; from[s] = -1; Q.push(s, hh(s));
  let seen = 0, toi = false;
  while (Q.size) {
    const i = Q.pop(); if (i === t) { toi = true; break; }
    if (dau[i] === gen + 1) continue;
    dau[i] = gen + 1;
    if (++seen > maxN) return null;
    const x = i % W, y = (i / W) | 0, gi = g[i];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const X = x + dx, Y = y + dy; if (!ok(X, Y) || (dx && dy && !(ok(x + dx, y) && ok(x, y + dy)))) continue;
      const k = Y * W + X, c = gi + Math.hypot(dx * CW, dy * CH);
      if (dau[k] === gen + 1) continue;
      if (dau[k] !== gen || c < g[k]) { dau[k] = gen; g[k] = c; from[k] = i; Q.push(k, c + hh(k)); }
    }
  }
  if (!toi) return null;
  const o = []; for (let i = t; i >= 0 && i !== s; i = from[i]) o.push(i);
  o.reverse();
  const out = [];
  for (let j = buoc - 1; j < o.length - 1; j += buoc) out.push(map.center(dd[o[j]]));
  out.push(map.center(dd[t]));
  return out;
}
// hàng đợi ưu tiên nhỏ nhất (đống nhị phân — như map.js Heap)
class DongNho {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, pri) {
    const K = this.k, V = this.v; let i = K.length; K.push(key); V.push(pri);
    while (i > 0) { const p = (i - 1) >> 1; if (V[p] <= V[i]) break; [K[p], K[i]] = [K[i], K[p]]; [V[p], V[i]] = [V[i], V[p]]; i = p; }
  }
  pop() {
    const K = this.k, V = this.v, top = K[0], lk = K.pop(), lv = V.pop();
    if (K.length) {
      K[0] = lk; V[0] = lv; let i = 0;
      for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < K.length && V[l] < V[m]) m = l; if (r < K.length && V[r] < V[m]) m = r; if (m === i) break; [K[m], K[i]] = [K[i], K[m]]; [V[m], V[i]] = [V[i], V[m]]; i = m; }
    }
    return top;
  }
}

// ---------- dựng nhân vật bot (tất định theo hạt giống) ----------
function rngTu(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DIEM = { ngoai: { str: 0.45, dex: 0.25, vit: 0.3 }, xa: { dex: 0.5, str: 0.15, vit: 0.35 }, noi: { eng: 0.3, vit: 0.5, dex: 0.2 } }; // như do-toc-do.js
const O_DO = [[2, "Cloth"], [7, "Cap"], [5, "Shoes"], [6, "Sash"], [8, "Bangle"], [3, "Ring1"], [3, "Ring2"], [4, "Necklace"], [9, "Pendant"]];
const CONG_DONG = 3;
function gieoDong(DX, t, cl, s, n, rng) {
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1)), d = [], used = new Set(), top = Math.min(10, cl + CONG_DONG);
  for (let i = 0; i < n; i++) {
    const pre = i % 2 === 0 ? 1 : 0, M = ri(1, top), best = new Map();
    for (const r of DX.rows) {
      if (!(r.w[t] > 0) || r.pre !== pre || r.lv > M || used.has(r.a) || (!pre && r.se !== s)) continue;
      const c = best.get(r.a); if (!c || r.lv > c.lv) best.set(r.a, r);
    }
    const cands = [...best.values()]; if (!cands.length) break;
    const w = cands.map((x) => x.w[t]); let k = rng() * w.reduce((a, b) => a + b, 0), j = 0;
    for (; j < w.length - 1; j++) { k -= w[j]; if (k < 0) break; }
    const r = cands[j]; used.add(r.a); d.push([r.k, ri(r.p[0][0], r.p[0][1])]);
  }
  return d;
}
function chonNen(L, t, p, rng) {
  const ok = ItemDB.pack.items.filter((x) => x.gr === "xanh" && x.t === t && (p == null || x.p === p) && (ItemDB.base(x.k).lv || 1) <= L);
  if (!ok.length) return null;
  const cap = Math.max(1, Math.min(10, Math.floor(L / 10))), cls = ok.map((x) => ItemDB.base(x.k).cl || 1).filter((c) => c <= cap);
  const cl = cls.length ? Math.max(...cls) : Math.min(...ok.map((x) => ItemDB.base(x.k).cl || 1));
  const L2 = ok.filter((x) => (ItemDB.base(x.k).cl || 1) === cl);
  return L2[Math.floor(rng() * L2.length)];
}
function vuKhi(h) { const w = h.equip && h.equip.Weapon, x = w && ItemDB.item(w.k); if (!x) return -1; if (x.t === 1) return 100 + (x.p | 0); return (x.p | 0) === 6 ? -1 : x.p | 0; }
// ngựa của bot (anh 06/11 "mấy phái trên ngựa lại không lên ngựa đánh"): ngựa thường cấp cao nhất cưỡi được ở cấp L (màu ngẫu nhiên), 1/5 là danh mã
// (Đích Lô, Chiếu Dạ Ngọc Sư Tử, Phi Vân… — nhóm danhma_cu của kho đồ)
function chonNgua(L, rng) {
  const ok = ItemDB.pack.items.filter((x) => x.t === 10 && (x.lv || 1) <= L);
  const danh = ok.filter((x) => x.gr === "danhma_cu"), thuong = ok.filter((x) => x.gr === "ngua");
  if (danh.length && rng() < 0.2) return danh[Math.floor(rng() * danh.length)];
  if (!thuong.length) return danh[0] || null;
  const top = Math.max(...thuong.map((x) => x.lv || 0)), L2 = thuong.filter((x) => (x.lv || 0) === top);
  return L2[Math.floor(rng() * L2.length)];
}
// nhân vật bot phái fac (khóa skills.json), giới sex ("m" | "f"), cấp L — như nhanVatMau nhưng theo hạt giống, có giới, 2–4 dòng / món, kỹ năng ≤ cấp − cấp học + 1
export function heroBot(P, DX, fac, sex, L, seed) {
  const rng = rngTu(seed), F = P.factions.find((f) => f.key === fac), lo = LO[fac] || LO.shaolin, series = F ? F.series : 0;
  const st = P.chr.start.find((s) => s.series === series && s.sex === (sex === "f" ? 1 : 0)) || P.chr.start[0];
  const h = { name: "", sex: sex === "f" ? "f" : "m", series, start: { ...st }, lvl: L, exp: 0, gold: 0, attr: { str: 0, dex: 0, vit: 0, eng: 0 }, equip: {}, bag: [], looks: {}, uN: 0,
    skills: {}, oChieu: {}, books: [], auto: AUTO_DEF() };
  if (F && L >= 10) { h.fac = F.id ?? P.factions.indexOf(F); h.facKey = fac; }
  const tot = 5 * (L - 1), plan = DIEM[lo.kieu]; let used = 0;
  for (const [k, f] of Object.entries(plan)) { h.attr[k] = Math.floor(tot * f); used += h.attr[k]; }
  h.attr.vit += tot - used;
  const mac = (t, p) => {
    const x = chonNen(L, t, p, rng); if (!x) return;
    const slot = wear(h, x.k); if (!slot) return;
    const s = Math.floor(rng() * 5);
    Object.assign(h.equip[slot], { u: ++h.uN, s, d: gieoDong(DX, t, ItemDB.base(x.k).cl || 1, s, 2 + Math.floor(rng() * 3), rng), m: L });
  };
  mac(lo.vk[0], lo.vk[1]);
  for (const [t] of O_DO) mac(t, null);
  h.bag = [];
  if (h.facKey) chiaDiem(P, h, fac, L);
  // ~85 % bot có ngựa — bộ số ngẫu nhiên riêng (hạt giống khác), làm sau cùng: mọi lượt bốc khác giữ nguyên như bản trước (soát 06/11: máy còn bản cũ
  // trong lúc lên bản mới vẫn dựng ra cùng đồ / điểm, chỉ khác ngựa)
  const rngN = rngTu((seed ^ 0x5bd1e995) >>> 0);
  if (rngN() < 0.85) { const x = chonNgua(L, rngN); if (x && wear(h, x.k) === "Horse") { h.equip.Horse.u = ++h.uN; h.bag = []; } }
  return h;
}
function chiaDiem(P, h, fac, L) {
  const db = P.skillDb, F = P.factions.find((f) => f.key === fac), lo = LO[fac] || LO.shaolin, wk = vuKhi(h);
  const coThe = F.skills.filter((id) => db[id] && (db[id].req || 0) <= L && (db[id].req || 0) <= 120);
  let con = L - 1;
  const sk = h.skills, them = (id, cap = 20) => { if (!id || !db[id] || sk[id] || con <= 0) return; const n = Math.min(cap, db[id].max || 20, con, Math.max(1, L - (db[id].req || 1) + 1)); if (n > 0) { sk[id] = n; con -= n; } };
  const ch = [...lo.chieu].reverse().find(([r]) => r <= L), main = ch ? ch[1] : 0;
  // thứ tự cộng điểm như người chơi (anh 06/11 "bot chưa ổn, nó không buff trấn phái hay sao ấy, tốc đánh chậm rì"): chiêu chính -> kỹ năng tăng tốc
  // đánh / tốc xuất chiêu của phái (bùa hoặc bị động: Như Lai Thiên Diệp, Tuyết Ảnh, Thiên Ma Giải Thể, Phật Pháp Vô Biên, Thái Cực Thần Công, Tiêu
  // Diêu Công, Sương Ngạo Côn Lôn, Ngũ Độc Kỳ Kinh, Tâm Nhãn) -> vòng sáng -> bùa lợi -> hồi máu -> chiêu hỗ trợ chiêu chính -> bị động. Bản trước
  // cộng hỗ trợ + bị động trước: tới bùa / vòng thì hết điểm — cấp 90–120 gần như mọi bot không có bùa, không vòng sáng, không tăng tốc
  them(main);
  const TOC = ["attackspeed_v", "castspeed_v", "attackspeed_yan_v", "castspeed_yan_v"];
  const toc = coThe.filter((id) => { const k = kindOf(db[id], db); if ((k !== "buff" && k !== "passive") || !eqtOk(db[id], wk)) return false; const A = lvAttrs(db[id], 20) || {}; return TOC.some((x) => A[x] && A[x][0] > 0); });
  for (const id of toc) them(id);
  const vong = coThe.filter((id) => kindOf(db[id], db) === "aura").pop();
  them(vong);
  const bua = coThe.filter((id) => kindOf(db[id], db) === "buff" && !isHeal(db[id], 1) && eqtOk(db[id], wk)).slice(-3);
  for (const id of bua) them(id);
  const hoi = coThe.find((id) => kindOf(db[id], db) === "buff" && isHeal(db[id], 1));
  them(hoi);
  const hoTro = coThe.filter((id) => Object.entries(db[id].lv || {}).some(([k, a]) => /^addskilldamage\d+$/.test(k) && a.some((p) => p && p[0] === main)));
  for (const id of hoTro) them(id);
  for (const id of coThe) if (kindOf(db[id], db) === "passive" && eqtOk(db[id], wk)) them(id);
  const hai = coThe.filter((id) => kindOf(db[id], db) === "curse" && eqtOk(db[id], wk)).pop();
  them(hai);
  const A = h.auto.danh;
  A.chieu = main; A.bua = [0, 1, 2].map((i) => (bua[i] && sk[bua[i]] ? bua[i] : 0)); A.vong = vong && sk[vong] ? vong : 0; A.hai = [hai && sk[hai] ? hai : 0, 0, 0];
  A.hoi = hoi && sk[hoi] ? { on: 1, id: hoi, pct: 50 } : { on: 0, id: 0, pct: 50 };
  h.oChieu = { trai: main, phai: A.vong || 0 };
}
const capRes = (p) => Object.fromEntries(Object.keys(p.res).map((k) => [k, R.khangThat(p.res[k], p.resCap ? p.resCap[k] ?? 75 : 75)])); // dư trần 10 % -> +1 % (rules.js, anh 13/11)
// dòng bất lợi của bùa hại (giảm kháng / tốc / phòng thủ…, như mục neg của tkTrung) — gắn bùa của người lên người (anh 12/11 "bùa của ngũ độc k có tác dụng")
export const buaAm = (A) => Object.fromEntries(Object.entries(A || {}).filter(([key, v]) => !DMG.test(key) && v[1] > 0 && v[0] < 0 && !/^(skill_|missle_|addskill|seriesdamage|stun_p|deadlystrike)/.test(key)));
const KHANG_KEY = { phys: "physicsres", cold: "coldres", fire: "fireres", light: "lightingres", poison: "poisonres" };
export const KHANG_5 = ["phys", "cold", "fire", "light", "poison"]; // thứ tự kháng của kd (tkKhangPhat -> tongkim.js dongBo)
const rr = (a) => a[0] + Math.random() * (a[1] - a[0]);
// hệ số sát thương PK trong trận (máy chủ cau-hinh tongKim.heSoSt — quản trị chỉnh; client 1): nhân 1 lần ở chỗ đòn vào đích
const heSo = (T) => (T && T.hs > 0 ? T.hs : 1);
const nhanHs = (d, T) => { if (d && d.v > 0) { const k = heSo(T); if (k !== 1) d.v = Math.max(1, Math.round(d.v * k)); } return d; };
const maDon = (a) => (a === "Attack2" ? 2 : a === "Magic" ? 3 : 1); // động tác -> mã đòn vị trí (the-gioi.js moc)

export function installTkBot(World) {
  Object.assign(World.prototype, {
    // ---------- chỉ số ----------
    // chỉ số từ nhân vật H (bot vừa dựng / bản chụp người chơi khác — may-chu/phan-than.js chup): như Phân Thân dungPhanThan
    tkChiSo(H) {
      const db = this.P.skillDb; syncRanged(H);
      const D = (H.auto && H.auto.danh) || { chieu: H.danh && H.danh.chieu, bua: (H.danh && H.danh.bua) || [], vong: H.danh && H.danh.vong, xoay: (H.danh && H.danh.xoay) || [], hoi: H.danh && H.danh.hoi };
      const O = H.oChieu || {}, lv = (id) => ((H.skills || {})[id] | 0), sk = (id) => (id ? db[id] : null);
      const hoTro = (s) => s && s.aura && !(s.target && s.target.enemy);
      let chon = [D.vong, ...(D.xoay || []), O.phai].filter((id) => hoTro(sk(id)) && lv(id) > 0).map(Number);
      if (!chon.length) { const L = Object.keys(H.skills || {}).filter((id) => hoTro(sk(id)) && lv(id) > 0).sort((a, b) => lv(b) - lv(a)); if (L.length) chon = [+L[0]]; }
      const vs = [], themV = (id, l) => { if (l > 0 && !vs.some((v) => v[0] === +id)) vs.push([+id, l]); };
      for (const id of chon) { themV(id, lv(id)); for (const [g, gl] of auraGhep(db[id], lv(id), H.skills)) themV(g, gl); }
      const laBua = (id) => { const s = sk(id); return !!s && lv(id) > 0 && kindOf(s, db) === "buff"; };
      const buaIds = [...new Set([...(D.bua || []).filter(laBua), ...Object.keys(H.skills || {}).filter((id) => laBua(id) && db[id].target && db[id].target.ally)].map(Number))];
      const luon = buaIds.filter((id) => !isHeal(db[id], lv(id)));
      const buffs = new Map(luon.map((id) => [id, { id, lv: lv(id), attrs: statsOnly(lvAttrs(db[id], lv(id))), until: Infinity }]));
      const laHoi = (id) => { const s = sk(id); return !!s && !s.aura && s.target && s.target.ally && lv(id) > 0 && isHeal(s, lv(id)); };
      let hoiId = D.hoi && laHoi(D.hoi.id) ? +D.hoi.id : 0;
      if (!hoiId) { const L = Object.keys(H.skills || {}).filter(laHoi).sort((a, b) => lv(b) - lv(a)); if (L.length) hoiId = +L[0]; }
      const wk = weaponKind(H), B = mergeB(equipStats(H, false), skillB(H, db, wk, buffs, null, vs));
      const st = R.heroStats(H, this.P.chr, B), p = Object.assign({ buffs, cd: {} }, st, this.weaponAtk.call({ P: this.P, hero: H }));
      p.atkDur = R.atkFrames(18, st.atkSpeed) * TICK;
      return { H, p, wk, sup: skillSupport(H, db), vs, bl: luon.slice(0, 8), hoi: hoiId ? { id: hoiId, lv: Math.min(lv(hoiId), 40) } : null };
    },
    // chiêu đánh chính (như Phân Thân ptChieu): Trợ Thủ / ô tay trái, không được thì chiêu đánh cấp cao nhất; bỏ lướt / di hình; null = đòn thường
    tkChieu(H, wk) {
      const db = this.P.skillDb, V = this.P.vc, D = (H.auto && H.auto.danh) || H.danh || {}, O = H.oChieu || {};
      const dung = (id) => {
        const s = id && db[id], k = s && V && V.sk(id), lv = (H.skills || {})[id] | 0;
        if (!s || !k || lv < 1 || s.aura || s.style === 3 || kindOf(s, db) !== "attack" || !eqtOk(s, wk) || s.horse === 2) return null;
        if (s.style === 1 && (k.form === 11 || k.form === 13)) return null;
        return { id: +id, lv, s, k };
      };
      for (const id of [D.chieu, O.trai]) { const c = dung(id); if (c) return c; }
      return Object.keys(H.skills || {}).map(dung).filter(Boolean).sort((x, y) => y.lv - x.lv)[0] || null;
    },
    // chiêu phụ lúc chiêu chính đang hồi (anh 09/11 "tăng trí thông minh của bot"): chiêu đánh khác đã học, cấp cao nhất, tầm không ngắn hơn 3/4 tầm chiêu chính
    tkChieuPhu(H, wk, chinh) {
      if (!chinh) return null;
      const db = this.P.skillDb, V = this.P.vc, r0 = this.tkTamChieu(chinh), ds = [];
      for (const id of Object.keys(H.skills || {})) {
        const s = db[id], k = s && V && V.sk(id), lv = (H.skills || {})[id] | 0;
        if (+id === chinh.id || !s || !k || lv < 1 || s.aura || s.style === 3 || kindOf(s, db) !== "attack" || !eqtOk(s, wk) || s.horse === 2) continue;
        if (s.style === 1 && (k.form === 11 || k.form === 13)) continue;
        const c = { id: +id, lv, s, k };
        if (this.tkTamChieu(c) >= r0 * 0.75) ds.push(c);
      }
      return ds.sort((x, y) => y.lv - x.lv)[0] || null;
    },
    tkTamChieu(c) { const zr = this.zoneReach(c.id), r = this.skRange(c.id, c.lv); return zr != null ? Math.min(r, zr) : r; },
    // phòng thủ của người chơi mình (bản dùng cho công thức sát thương: kháng đã chặn trần, né tránh, hệ)
    // danh hiệu trên đầu trong trận như client (anh 09/11 "các danh hiệu trong tống kim như binh sĩ, hiệu úy này kia chưa làm" — battlehead.lua bt_RankEffect: Title_AddTitle):
    // other = người khác / bot; "" = không vẽ
    tkDanhHieu(p, other) {
      const T = this.tk; if (!T || T.khongDh) return ""; // khongDh: sân lôi đài (loidai.js — anh 15/11) không có danh hiệu Tống Kim
      let phe, c;
      if (!other) { phe = T.phe; c = T.chuc; }
      else if (p.tkb) { phe = p.tkPhe; c = p.chucTk; }
      else { const n = T.nguoi && T.nguoi.get(p.name); if (!n) return ""; phe = n.tkPhe; c = n.chucTk; }
      return DANH_HIEU[phe ? 1 : 0][Math.max(0, Math.min(4, c | 0))];
    },
    // kháng để hiện ở bảng chỉ số (windows.js khangO — anh 13/11 "75%+1%"): [kháng hiện có, trần] mỗi hệ; trong Tống Kim đã trừ bùa hại phe kia đang dính (như tkThu)
    khangHien(p = this.player) {
      const C = this.tk ? (p.tkBua || []).filter((c) => c.until > this.time) : [], md = (k) => C.reduce((t, c) => t + ((c.attrs[k] && c.attrs[k][0]) || 0), 0);
      return Object.fromEntries(Object.keys(p.res || {}).map((k) => { const kk = KHANG_KEY[k] || k;
        return [k, [(p.res[k] || 0) + md(kk + "_yan_p") + md(kk + "_p") + md("allres_yan_p") + md("allres_p"), (p.resCap ? p.resCap[k] ?? 75 : 75) + md(kk + "max_p") + md("allresmax_p")]]; }));
    },
    tkThu(p = this.player) {
      const C = (p.tkBua || []).filter((c) => c.until > this.time);
      if (!C.length) return { res: capRes(p), def: p.def, series: this.hero.series | 0, curse: [], lvl: this.hero.lvl, radius: p.radius };
      // bùa hại của người / bot phe kia đang dính (tkBuaMinh — anh 12/11): như mobRes của quái — giảm trên kháng gốc rồi mới chặn trần (trần cũng có thể bị giảm)
      const md = (k) => C.reduce((t, c) => t + ((c.attrs[k] && c.attrs[k][0]) || 0), 0);
      const res = Object.fromEntries(Object.keys(p.res).map((k) => { const kk = KHANG_KEY[k] || k, cap = (p.resCap ? p.resCap[k] ?? 75 : 75) + md(kk + "max_p") + md("allresmax_p");
        return [k, R.khangThat((p.res[k] || 0) + md(kk + "_yan_p") + md(kk + "_p") + md("allres_yan_p") + md("allres_p"), cap)]; }));
      return { res, def: Math.max(0, p.def + md("adddefense_v")), series: this.hero.series | 0, curse: [], lvl: this.hero.lvl, radius: p.radius };
    },
    // gắn bùa hại của người / bot phe kia lên mình (tin "tkt" st.bua, chiêu phát lại không sát thương): dòng bất lợi theo dữ liệu chiêu (buaAm) — tkThu dùng; Hấp
    // Tinh Yểm_Quyết Chú (poison2decmana_p): mất nội lực theo nhịp (heroMatNoi). Xuất Ứ Bất Nhiễm (giaiXau > 1): miễn
    tkBuaMinh(id, lv) {
      const p = this.player; if (!this.tk || p.hp <= 0 || this.giaiXau() > 1) return;
      const sd = this.skDef(id); if (!sd) return;
      const A = lvAttrs(sd, lv), neg = buaAm(A), dur = Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0)));
      if (A.poison2decmana_p) this.heroMatNoi(A.poison2decmana_p);
      // Thiên Nhẫn 120 Ma Âm Phệ Phách -> chiêu phụ 723 hoảng loạn (randmove [1, 72 khung]): không đi, không xuất chiêu (anh 13/11 "bùa 120 của thiên nhẫn k tác dụng lên
      // người khác") — dòng randmove không phải dòng âm nên buaAm bỏ qua
      if (A.randmove && A.randmove[0] > 0 && A.randmove[1] > 0) this.heroHoangLoan(A.randmove[1]);
      if (!(dur > 0) || !Object.keys(neg).length) return;
      const k = this.P.vc && this.P.vc.sk(id);
      p.tkBua = (p.tkBua || []).filter((c) => c.id !== id && c.until > this.time);
      p.tkBua.push({ id, lv, attrs: neg, until: this.time + dur * TICK, st: k ? k.state : 0 });
    },
    // kháng / né thật của mình (đã gồm vòng sáng của đồng đội, bùa lợi, chức — chưa trừ bùa hại: người đánh tự trừ theo bc) -> gửi kèm nhịp (main.js s.kd, anh 13/11 lượt 86 "vòng
    // sáng hỗ trợ ... có tác dụng cho đồng đội trong tống kim"): máy người đánh tính sát thương theo số này (tongkim.js dongBo) thay bản chụp lúc vào trận — trước đó vòng sáng /
    // bùa phòng thủ không giảm được đòn của người chơi khác. [kháng × 5, trần × 5, né] | null
    tkKhangPhat() {
      const p = this.player; if (!this.tk || p.hp <= 0 || !p.res) return null;
      return [...KHANG_5.map((k) => Math.round(p.res[k] || 0)), ...KHANG_5.map((k) => Math.round(p.resCap ? p.resCap[k] ?? 75 : 75)), Math.max(0, Math.round(p.def || 0))];
    },
    // bùa hại mình đang dính -> gửi kèm nhịp (main.js s.bc): [[mã, cấp, ms còn]] — người phe kia gắn lên bản chọn mục tiêu (buaTuXa) để sát thương tính theo kháng đã giảm
    buaHaiPhat() {
      const p = this.player; if (!this.tk || !p.tkBua || p.hp <= 0) return null;
      const L = p.tkBua.filter((c) => c.until > this.time).slice(0, 6).map((c) => [c.id, c.lv, Math.max(1, Math.round((c.until - this.time) * 1000))]);
      return L.length ? L : null;
    },
    // bùa hại người đó đang dính (theo máy họ — o.bc) gộp với bùa mình vừa gắn lên bản chọn mục tiêu (curseOn): bùa của mình giữ, bùa theo máy họ (xa) thay mỗi nhịp
    buaTuXa(cu, bc) {
      const giu = (cu || []).filter((c) => c.until > this.time && !c.xa);
      for (const [id, lv, ms] of Array.isArray(bc) ? bc : []) {
        const sd = this.skDef(id); if (!sd) continue;
        const A = buaAm(lvAttrs(sd, lv)); if (!Object.keys(A).length) continue;
        const until = this.time + ms / 1000, i = giu.findIndex((c) => c.id === id);
        if (i >= 0) { giu[i] = { ...giu[i], until }; continue; } // bùa mình gắn tạm (tkTrungNguoi) được máy họ xác nhận: theo thời gian thật của họ
        const k = this.P.vc && this.P.vc.sk(id);
        giu.push({ id, attrs: A, until, st: k ? k.state : 0, xa: 1 });
      }
      return giu;
    },

    // ---------- bot ----------
    // dựng 1 bot từ dòng máy chủ [id, tên, phe, phái, giới, cấp, hạt giống, máu tối đa] (DX = bảng dòng xanh — do-toc-do.js napDong)
    tkTaoBot(row, DX, x, y) {
      const [id, ten, phe, fac, sex, lvl, seed, mauMax, mb] = row;
      const H = heroBot(this.P, DX, fac, sex, lvl | 0 || 1, seed | 0); H.name = ten;
      // nhân vật mẫu (anh 09/11 — F10 "Làm mẫu bot", máy chủ tong-kim.js MAU_BOT): mặc đồ, kỹ năng, điểm, chiêu dùng y như nhân vật đó
      const M = mb >= 0 && this.tk && this.tk.mauBot && this.tk.mauBot[mb];
      if (M) { const c = JSON.parse(JSON.stringify(M)); Object.assign(H, { lvl: c.lvl, sex: c.sex, series: c.series, fac: c.fac, facKey: c.facKey, start: c.start, attr: c.attr, skills: c.skills, equip: c.equip, looks: c.looks || {}, oChieu: c.oChieu, bag: [] }); if (c.danh) H.auto = { ...H.auto, danh: c.danh }; }
      const S = this.tkChiSo(H), p = S.p; p.tkRef = "#" + id;
      const chieu = this.tkChieu(H, S.wk);
      // động tác đánh ở máy không chạy não (updateOther / drawHeroBody: other dùng e.atkDur): độ dài chiêu chính theo tốc đánh / tốc xuất chiêu của bot
      // (bản trước: máy khác vẽ mọi đòn của bot 18 khung — chậm hơn bot thật); máy chủ trận đặt lại mỗi đòn (tkRaDon)
      const atkDur = chieu ? R.atkFrames(CAST_T, chieu.s.phys ? p.atkSpeed || 0 : p.castSpeed || 0) * TICK : p.atkDur;
      // ngựa (anh 06/11): 2 hình (cưỡi / đi bộ) đổi qua lại như người chơi khác; chiêu chính không cấm ngựa (cột HorseLimited của client — chỉ Thiếu Lâm
      // Vô Tướng Trảm / Ma Ha Vô Lượng trong các chiêu chính) -> đánh trên ngựa; phái khác cưỡi ngựa lúc đi, tới đánh thì xuống ngựa (tkNgua)
      const coNgua = !!(H.equip && H.equip.Horse), nguaDanh = coNgua && (!chieu || (chieu.s.horse | 0) !== 1);
      const tocNgua = coNgua ? equipStats(H, true).moveSpeed - equipStats(H, false).moveSpeed : 0;
      const lookBo = this.P.jx.look({ sex: H.sex, ...H.looks, horse: 0 }), lookNgua = coNgua ? this.P.jx.look({ sex: H.sex, ...H.looks }) : lookBo;
      const e = { kind: "mob", tkb: id, uid: 1e7 + id, id: 0, type: null, name: ten, lvl, boss: false, alive: true, x, y, home: [x, y], dir: 4, act: "stand", t: 0, atkDur, atkDur0: atkDur,
        series: H.series, hpMax: mauMax > 0 ? mauMax : p.hpMax, hp: mauMax > 0 ? mauMax : p.hpMax, mpMax: p.mpMax, mp: p.mpMax, res: capRes(p), def: p.def, ar: p.ar, dmg: p.dmg,
        radius: 14, hitRecover: 0, curse: [], aggro: false, atkT: 0, path: null, repath: 0, deadT: 0, cp: 10 + (phe | 0),
        sex: H.sex, look: lookBo, lookBo, lookNgua, coNgua, nguaDanh, tocNgua, ngua: false, attack: "Attack1", fight: false, buf: [], gap: 0.1, lag: 0.3, off: 0,
        H, p, wk: S.wk, sup: S.sup, vs: S.vs.length ? S.vs : null, bl: S.bl.length ? S.bl : null, buaDs: S.bl.length ? S.bl : null, hoi: S.hoi, chieu, phu: this.tkChieuPhu(H, S.wk, chieu), tam: chieu ? this.tkTamChieu(chieu) : p.reach,
        toc: RUN * (1 + (p.moveSpeed || 0) / 100), tkPhe: phe | 0, fac, B: null };
      e.xa = e.tam >= 180; // phái đánh xa: đứng mép tầm, lùi khi bị áp sát
      this.tkNaoMoi(e);
      return e;
    },
    // não mới (ra trận / hồi sinh / máy mình vừa thành chủ trận): bùa lợi phải dùng lại (tkBua) — máy chủ trận chỉ vẽ hình bùa đã dùng (e.bl); máy
    // khác vẽ đủ bùa (bot luôn đã buff — không gửi trạng thái bùa từng con)
    tkNaoMoi(e) {
      e.B = { muc: null, mucT: 0, nghiT: 0, phanXaT: 0, che: "di", binh: BINH, binhNl: BINH_NL, pot: null, pot2: null, potNl: null, potT: 0, buoc: null, buocT: 0, danhN: 0, duoiT: 0, boQua: new Map(),
        dich: null, dichT: 0, hoiT: 0, hoanT: this.time + 180, ketT: 0, ketD: Infinity, luiT: 0, lach: false, buaHet: {}, o: null, nguaT: -9, danhT: this.time, luiDen: 0, luiVeT: 0 };
      e.ngua = false; e.look = e.lookBo || e.look; // ra trận / hồi sinh: đi bộ, dùng bùa ở doanh rồi mới lên ngựa (tkNao)
      e.toc = this.tkTocBot(e); // cắn Phi Tốc hoàn lúc ra trận (3 phút): chạy nhanh hơn
      e.mp = e.mpMax;
      e.bl = this.tk && this.tk.chu ? null : e.buaDs;
    },
    // tốc chạy của bot: chỉ số + ngựa (đang cưỡi) + Phi Tốc hoàn (3 phút đầu mỗi lần ra trận)
    tkTocBot(e) { const B = e.B; return RUN * (1 + ((e.p.moveSpeed || 0) + (e.ngua ? e.tocNgua || 0 : 0)) / 100) * (B && B.hoanT && this.time < B.hoanT ? 1.15 : 1); },
    // lên (on) / xuống ngựa — như World.doiNgua: đổi được (hoặc đã đúng) -> true; chưa đủ NGUA_CHO giây từ lần đổi trước -> false (người gọi chờ)
    tkNgua(e, on) {
      if (!e.coNgua || !!on === !!e.ngua) return true;
      const B = e.B, t = this.time; if (t - (B.nguaT ?? -9) < NGUA_CHO) return false;
      B.nguaT = t; e.ngua = !!on; e.look = on ? e.lookNgua : e.lookBo; e.toc = this.tkTocBot(e);
      return true;
    },
    // mỗi bước (World.updateMob): máy chủ trận chạy não; máy khác vẽ theo vị trí báo (updateOther) + độc / bùa của mình gây trên bot (mobTick)
    tkCapNhatBot(e, dt) {
      if (e.tkq) return this.tkCapNhatBinh(e, dt); // quân NPC trận thật (tkNaoBinh)
      if (!e.alive) { e.deadT += dt; if (e.act !== "die") this.setAct(e, "die"); e.t += dt; return; }
      const T = this.tk;
      if (!T || !T.chu) { e.ngoai = true; if (this.P.vc && (e.poison || (e.curse && e.curse.length))) this.mobTick(e, dt); this.updateOther(e, dt); return; }
      e.ngoai = false; e.t += dt;
      this.tkNao(e, dt);
    },

    // ---------- não bot (máy chủ trận) ----------
    tkNao(e, dt) {
      const B = e.B, t = this.time, T = this.tk, tri = T.tri || 3;
      if (this.P.vc && this.mobTick(e, dt)) { if (e.act === "attack") { e.don = null; this.setAct(e, "stand"); } return; } // độc / bùa hút máu / choáng
      if (this.P.vc && (this.mobMod(e, "randmove") > 0 || (e.hlUntil || 0) > this.time)) { e.path = null; if (e.act !== "hurt" && e.act !== "attack") this.setAct(e, "stand"); return; } // hoảng loạn
      // trận thật đang báo danh / đã xong (T.hoa): đứng yên, không nhắm ai
      if (T.hoa) { e.path = null; e.fight = false; e.don = null; B.muc = null; B.buoc = null; if (e.act !== "die") this.setAct(e, "stand"); return; }
      this.tkThuocBot(e, dt);
      if (e.act === "attack") {
        if (!e.hitDone && e.t >= e.hitAt) { e.hitDone = true; const f = e.don; e.don = null; if (f) f(); }
        if (e.t < e.atkDur) return;
        this.setAct(e, "stand");
        // ra chiêu xong: nhấp nhả — thỉnh thoảng bước ngang vòng quanh mục tiêu (vẫn trong tầm); cận chiến bị chen (đồng đội sát bên — tkDanh đặt lach)
        if (B.muc && (B.lach || Math.random() < NHAP[tri])) { B.lach = false; this.tkBuocNgang(e, B.muc); }
      }
      if (e.act === "hurt" && e.t < 0.25) return;
      if (t >= B.nghiT) { B.nghiT = t + rr(PHAN_XA[tri]) * (B.muc ? 1 : 1 + DAU_SAI); this.tkNghi(e); }
      if (B.che === "ve") return this.tkVe(e, dt);
      if (B.che === "mua") { this.setAct(e, "stand"); if (t >= B.muaT) { B.binh = BINH; B.binhNl = BINH_NL; B.che = "di"; B.hoanT = t + 180; e.toc = this.tkTocBot(e); } return; }
      if (B.hoanT && t > B.hoanT) { B.hoanT = 0; e.toc = this.tkTocBot(e); } // hết Phi Tốc hoàn
      if (tri >= 2 && this.tkTranh(e)) return this.tkDiBuoc(e, dt); // đứng trong vùng lửa / vùng nổ của phe kia: bước ra
      if (tri >= 2 && this.tkLui(e, dt)) return; // máu thấp còn thuốc: chạy hẳn về phía doanh tới khi đủ máu
      if (this.tkBua(e)) return;
      if (T.tran && B.che === "di" && this.tkTrongHau(e)) return this.tkRaHau(e, dt); // trận thật: ở hậu doanh (ra trận / hồi sinh / mua thuốc xong) -> ra cổng
      if (this.tkHoTro(e)) return;
      // ngựa: phái đánh trên ngựa được lên ngựa ngay (dùng bùa xong); phái khác không đánh ai ≥ RANH_NGUA giây thì lên ngựa đi (tkDanh xuống ngựa trước khi ra chiêu)
      // xét 2 lần / giây (soát 06/11: tkDichGan mỗi khung cho mọi bot rảnh); vừa xuống ngựa dùng bùa / hồi máu cấm ngựa thì nghỉ NGUA_NGHI giây mới lên lại
      if (e.coNgua && !e.ngua && t >= (B.nguaXet || 0) && t >= (B.nguaNghi || 0)) {
        B.nguaXet = t + 0.5;
        if (e.nguaDanh || (!B.muc && t - B.danhT >= RANH_NGUA && !this.tkDichGan(e, NGUA_XA))) this.tkNgua(e, true);
      }
      if (B.buoc) return this.tkDiBuoc(e, dt);
      if (B.muc) return this.tkDanh(e, B.muc, dt);
      this.tkDiNhom(e, dt);
    },
    // có địch (đánh được) trong R quanh bot e — lên ngựa đi đường khi địch còn xa (tkNao)
    tkDichGan(e, R0) { for (const c of this.tkDichCua(e.tkPhe)) if (ldist(e.x, e.y, c.x, c.y) <= R0) return true; return false; },
    // ai là địch còn đánh được của phe ph (bot / người thật / mình / quân NPC trận thật), không ở trong doanh an toàn của họ
    // khu an toàn: bãi thử — vòng doanh (T.trai, T.R); trận thật — hậu doanh phe đó (T.hau: hình chữ nhật gói bản đồ), lúc báo danh / đã xong cả bản đồ (T.hoa)
    tkAnToan(x, phe) {
      const T = this.tk; if (!T) return false;
      if (T.hoa) return true;
      if (T.tran) return !!T.hau && T.hau(phe, x.x, x.y);
      if (!T.trai) return false; const c = T.trai[phe]; return !!c && ldist(x.x, x.y, c[0], c[1]) <= (T.R || 220);
    },
    // bot / quân e đang đứng trong hậu doanh phe mình (trận thật)
    tkTrongHau(e) { const T = this.tk; return !!(T && T.tran && T.hau && T.hau(e.tkPhe, e.x, e.y)); },
    tkDichCua(phe) {
      const T = this.tk, L = []; if (T.hoa) return L;
      for (const b of T.bots.values()) if (b.alive && b.tkPhe !== phe && !this.tkAnToan(b, b.tkPhe)) L.push(b);
      const p = this.player;
      if (T.phe !== phe && p.hp > 0 && !(p.hideUntil > this.time) && !T.xem && !this.tkAnToan(p, T.phe)) L.push(p); // T.xem: mình là người xem trận thử lôi đài (loidai.js — anh 16/11), Tống Kim không có
      for (const n of T.nguoi.values()) if (n.alive && !n.an && n.tkPhe !== phe && !this.tkAnToan(n, n.tkPhe)) L.push(n); // n.an: đang ẩn thân — không chọn làm mục tiêu
      if (T.binh) for (const b of T.binh.values()) if (b.alive && b.tkPhe !== phe) L.push(b); // quân NPC: không bao giờ ở hậu doanh
      return L;
    },
    // Nguyên soái phe ph còn sống vừa bị đánh (≤ SOAI_NGUY giây — tongkim.js datMau / tkHit ghi T.soaiNguy) | null
    tkSoaiNguy(ph) {
      const T = this.tk; if (!T || !T.tran || !T.binh || !T.soaiNguy || this.time - (T.soaiNguy[ph] ?? -99) > SOAI_NGUY) return null;
      for (const b of T.binh.values()) if (b.binh === 5 && b.tkPhe === ph && b.alive) return b;
      return null;
    },
    // chọn mục tiêu: người thật trước (cảm giác — thiết kế mục 4), máu thấp, đang nhắm giữ lại; người thật đã có đủ CAP_DUOI bot dí thì thôi. Anh 06/11
    // ("đứng chụm vào hết"): con đã có nhiều đồng đội nhắm thì kém hấp dẫn (dàn mục tiêu, không cả nhóm dồn 1 con); bot phe kia đủ CAP_BOT con nhắm thì thôi
    tkNghi(e) {
      const B = e.B, T = this.tk, tri = T.tri || 3, t = this.time;
      if (B.che === "ve" || B.che === "mua" || B.luiDen) return;
      if (T.tran && this.tkTrongHau(e)) { if (B.muc) { B.muc = null; T._demT = -1; } return; } // trận thật ở hậu doanh: ra cổng trước (tkRaHau)
      if (e.hp < e.hpMax * 0.3 && B.binh <= 0) { B.che = "ve"; B.muc = null; e.path = null; return; } // hết thuốc, máu thấp: về doanh
      if (B.boQua.size > 30) for (const [k, het] of B.boQua) if (het <= t) B.boQua.delete(k);
      const dem = this.tkDemDuoi(), cu = B.muc, soai = T.tran ? this.tkSoaiNguy(e.tkPhe) : null;
      let best = null, bs = -Infinity, sCu = null, duPhong = null, dpD = Infinity;
      for (const c of this.tkDichCua(e.tkPhe)) {
        const binh = !!c.tkq, d = ldist(e.x, e.y, c.x, c.y); if (d > (binh && c.binh === 5 ? NHIN_SOAI : NHIN)) continue;
        if ((B.boQua.get(c) || 0) > t) continue;
        const nguoi = c === this.player || !!c.tkn, n = (dem.get(c) || 0) - (c === cu ? 1 : 0);
        if (c !== cu && n >= (nguoi ? CAP_DUOI[tri] : binh ? (c.binh === 5 ? CAP_SOAI : CAP_BINH) : CAP_BOT)) { if (!nguoi && d < dpD) { dpD = d; duPhong = c; } continue; }
        const pct = c === this.player ? c.hp / c.hpMax : c.tkn ? (c.hp || 0) / 100 : c.hp / Math.max(1, c.hpMax);
        let s = -d;
        if (tri >= 2) s += (1 - pct) * 260 + (nguoi ? 140 : 0) - n * 70;
        // quân NPC (trận thật): Nguyên soái phe kia — hạ trước là thắng. Anh 13/11 (lượt 86 "bot ưu tiên đánh người, quái đánh sau cùng (kim binh tống binh)"): lính / quan
        // quân NPC luôn sau người và bot — chỉ đánh khi quanh đây không còn người / bot nào (trước: lính đang đánh mình +110, lính khác −70)
        if (binh) s += c.binh === 5 ? 260 : -900;
        if (soai && ldist(c.x, c.y, soai.x, soai.y) <= 700) s += 160; // địch đang đánh Nguyên soái phe mình
        if (tri >= 3 && c.dangHoi && t - c.dangHoi < 3) s += 90; // người / bot đang hồi máu cho phe kia
        if (c === cu) { sCu = s; s += 120; } // sCu: điểm gốc (chưa cộng giữ) — đổi khi con mới hơn hẳn MUC_HON (soát 06/11: tính sau +120 thì phải hơn 270)
        if (s > bs) { bs = s; best = c; }
      }
      // anh 09/11 ("bot nhiều khi chạy k ra chạy, cứ đứng 1 chỗ"): mọi địch quanh đây đã đủ bot nhắm (CAP_*) thì trước đây bot không có việc gì, đứng yên -> đánh con gần
      // nhất (người thật vẫn giữ tối đa 3–4 bot dí)
      if (!best) best = duPhong;
      // giữ mục tiêu (anh 06/11 lần 2 "chạy tới chạy lui"): mục tiêu cũ còn đánh được thì chỉ đổi khi đã nhắm ≥ MUC_GIU giây và con mới hơn hẳn MUC_HON điểm
      if (cu && best && best !== cu && sCu != null && (t - B.mucT < MUC_GIU || bs - sCu < MUC_HON)) best = cu;
      if (best !== cu) {
        if (cu) dem.set(cu, Math.max(0, (dem.get(cu) || 1) - 1));
        if (best) dem.set(best, (dem.get(best) || 0) + 1);
        B.muc = best; B.mucT = t; B.duoiT = 0; B.danhN = 0; B.o = null; e.path = null; if (best && !cu) B.phanXaT = t + rr(PHAN_XA[tri]);
      }
    },
    // số bot đang nhắm từng mục tiêu — người thật lẫn bot (tính 1 lần / 0,25 giây; tkNghi cập nhật ngay khi đổi mục tiêu)
    tkDemDuoi() {
      const T = this.tk; if (T._dem && this.time - T._demT < 0.25) return T._dem;
      const m = new Map(); for (const b of T.bots.values()) if (b.alive && b.B && b.B.muc) m.set(b.B.muc, (m.get(b.B.muc) || 0) + 1);
      T._dem = m; T._demT = this.time; return m;
    },
    // chỗ đứng đánh m của bot e (anh 06/11 "đứng chụm vào hết"): mỗi con 1 góc quanh mục tiêu — góc gốc = hướng từ mục tiêu tới bot lúc bắt đầu đánh,
    // các con cùng nhắm 1 mục tiêu xòe ra theo thứ tự mã (tối thiểu ~GIAN điểm giữa 2 con); cận chiến đứng 80 % tầm, đánh xa 90 % tầm
    // Anh 06/11 lần 2 ("chạy tới chạy lui"): chỗ đứng cố định theo mã bot từ lúc bắt đầu nhắm tới khi đổi mục tiêu — bản trước xếp theo thứ tự các con đang
    // cùng nhắm, có con vào / ra là cả nhóm đổi chỗ chạy qua lại
    tkChoDanh(e, m) {
      const B = e.B;
      if (B.o && B.o.m === m) return B.o;
      const r = Math.max(30, (e.tam + (m.radius || 14)) * (e.xa ? 0.9 : 0.8)), goc0 = Math.atan2((e.y - m.y) * 2, e.x - m.x);
      const buoc = Math.max(0.5, 2 * Math.asin(Math.min(1, GIAN / 2 / r)));
      // nấc lệch cố định −2…+2 theo mã bot; chỗ đó trùng chỗ đứng của đồng đội cùng nhắm m (dưới nửa GIAN) thì lấy nấc trống gần nhất (soát 06/11: 2 con
      // trùng nấc đứng chồng 1 chỗ) — chọn 1 lần, giữ tới khi đổi mục tiêu
      const cho = (g, rr) => [m.x + Math.cos(g) * rr, m.y + (Math.sin(g) * rr) / 2], khac = [];
      for (const b of this.tk.bots.values()) if (b !== e && b.alive && b.tkPhe === e.tkPhe && b.B && b.B.o && b.B.o.m === m) khac.push(cho(b.B.o.goc, b.B.o.r));
      const goc1 = ((((e.tkb * 7) % 5) + 5) % 5) - 2;
      let goc = goc0 + goc1 * buoc * 0.6;
      for (const k of [0, 1, -1, 2, -2, 3, -3]) {
        const g = goc0 + (goc1 + k) * buoc * 0.6, [x, y] = cho(g, r);
        if (!khac.some(([u, v]) => ldist(x, y, u, v) < GIAN * 0.5)) { goc = g; break; }
      }
      B.o = { m, goc0, goc, r };
      return B.o;
    },
    // điểm (x, y) nằm trong doanh của phe ph thì đẩy ra ngoài mép doanh (+BOT_GIAN_DOANH) theo hướng từ tâm doanh — trong doanh không đánh được (anh 06/11
    // "bot đứng trong doanh trại không chạy ra": chỗ đứng đánh quanh mục tiêu đứng sát doanh rơi vào trong doanh mình -> bot tới đó đứng im)
    tkNgoaiDoanh(x, y, ph) {
      const T = this.tk, c = T.trai && T.trai[ph], R0 = (T.R || 220) + BOT_GIAN_DOANH; if (!c || T.tran) return [x, y]; // trận thật: hậu doanh là túi riêng (chỉ tới bằng bẫy)
      const dx = x - c[0], dy = (y - c[1]) * 2, d = Math.hypot(dx, dy); if (d >= R0) return [x, y];
      const ux = d > 1 ? dx / d : 1, uy = d > 1 ? dy / d : 0;
      for (const da of [0, 0.5, -0.5, 1, -1]) { const ca = Math.cos(da), sa = Math.sin(da), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, px = c[0] + vx * R0, py = c[1] + (vy * R0) / 2; if (this.map.walkable(px, py)) return [px, py]; }
      return [c[0] + ux * R0, c[1] + (uy * R0) / 2];
    },
    // bot cùng phe đứng sát bên (< GIAN) — cận chiến bị chen thì lách sang chỗ của mình
    tkChen(e) { for (const b of this.tk.bots.values()) if (b !== e && b.alive && b.tkPhe === e.tkPhe && ldist(e.x, e.y, b.x, b.y) < GIAN * 0.7) return true; return false; },
    tkDanh(e, m, dt) {
      const B = e.B, T = this.tk, t = this.time, tri = T.tri || 3;
      const song = m === this.player ? m.hp > 0 : m.alive, bo = () => { B.muc = null; T._demT = -1; }; // bỏ mục tiêu: đếm lại số bot nhắm từng con (tkDemDuoi)
      if (!song || this.tkAnToan(m, m === this.player ? T.phe : m.tkPhe)) return bo();
      const d = ldist(e.x, e.y, m.x, m.y), tam = e.tam + (m.radius || 14), trongDoanh = this.tkAnToan(e, e.tkPhe);
      if (d > tam || trongDoanh) {
        // ngoài tầm: dí. Người thật chạy xa quá DUOI_T giây thì bỏ (người đó chạy thoát)
        if (m === this.player || m.tkn) { if ((B.duoiT += dt) > DUOI_T[tri]) { B.boQua.set(m, t + 4); return bo(); } }
        // gần tới: chạy về chỗ đứng của mình quanh mục tiêu (tkChoDanh — không dồn cả nhóm vào 1 điểm); còn xa: chạy thẳng về phía mục tiêu
        const o = d <= tam + 180 ? this.tkChoDanh(e, m) : null, ox = o && m.x + Math.cos(o.goc) * o.r, oy = o && m.y + (Math.sin(o.goc) * o.r) / 2;
        // chỗ tới luôn ngoài doanh mình (tkNgoaiDoanh — trong doanh không đánh được: bản trước bot tới chỗ đứng nằm trong doanh rồi đứng im ở đó)
        const den = this.tkNgoaiDoanh(...(o && this.map.walkable(ox, oy) ? [ox, oy] : [m.x, m.y]), e.tkPhe);
        // chỗ tới nằm trong bãi lửa / vùng nổ của phe kia: không lao vào (soát 06/11: cận chiến dí vào lửa -> tkTranh né ra -> dí vào lại mãi) — nhắm
        // con khác 1,5 giây
        if (tri >= 2 && this.tkTrongVung(den[0], den[1], e.tkPhe)) { B.boQua.set(m, t + 1.5); return bo(); }
        return this.tkChay(e, den[0], den[1], dt);
      }
      B.duoiT = 0;
      e.path = null; e.dir = dirOf(m.x - e.x, (m.y - e.y) * 2); e.fight = true; B.danhT = t;
      if (t < B.phanXaT) { this.setAct(e, "stand"); return; } // phản xạ: vừa thấy thì chưa ra đòn
      // đang cưỡi ngựa mà chiêu chính cấm ngựa: xuống ngựa rồi mới đánh (như Trợ Thủ của người chơi); vừa lên ngựa < 3 giây thì đứng chờ
      if (e.ngua && !e.nguaDanh && !this.tkNgua(e, false)) { this.setAct(e, "stand"); return; }
      // phái xa bị áp sát (địch đánh gần trong nửa tầm): lùi ra rồi đánh (nhấp nhả) — xét tối đa 1 lần / 3 giây, 30 % (bản trước 1,5 giây, 60 %: bot
      // lùi suốt, ít ra đòn — anh 06/11 "tốc đánh chậm rì")
      if (e.xa && tri >= 2 && d < e.tam * 0.45 && !m.xa && t >= B.luiT) { B.luiT = t + 3; if (Math.random() < 0.3) { this.tkBuocLui(e, m, 110); return; } }
      // đứng chen sát đồng đội: lách sang chỗ của mình quanh mục tiêu (vẫn trong tầm) rồi đánh — tối đa 1 lần / 1,2 giây
      if (tri >= 2 && t >= (B.chenT || 0) && this.tkChen(e)) { B.chenT = t + 1.2; if (this.tkVeO(e, m)) return; }
      const c = e.chieu, cd = c ? (e.p.cd[c.id] || 0) - t : 0;
      // chiêu đang hồi: ≤ 1 giây thì đứng chờ như người (World.atkPlan); lâu hơn thì đánh đòn thường nếu với tới
      if (cd > 0) {
        // anh 09/11 ("cứ đứng 1 chỗ"): chiêu chính đang hồi -> chiêu phụ nếu tới tầm; không thì đánh thường (với tới) hoặc bước ngang quanh mục tiêu — trước đứng yên suốt thời gian hồi
        const p2 = e.phu;
        if (p2 && (e.p.cd[p2.id] || 0) <= t && d <= this.tkTamChieu(p2) + (m.radius || 14) && !(e.ngua && (p2.s.horse | 0) === 1)) { this.tkRaDon(e, m, false, p2); return; }
        if (cd > 1 && d <= e.p.reach + (m.radius || 14)) { this.tkRaDon(e, m, true); return; }
        if (cd > 0.5 && tri >= 2 && t >= (B.ngangT || 0)) { B.ngangT = t + 1 + Math.random() * 0.6; this.tkBuocNgang(e, m); if (B.buoc) return; }
        this.setAct(e, "stand"); return;
      }
      this.tkRaDon(e, m);
      // cận chiến: 2–3 đòn thì xét lách — chỉ khi bị chen (đồng đội đứng sát), không thì đánh liền như người
      if (!e.xa && tri >= 2 && ++B.danhN >= 2 + Math.floor(Math.random() * 2)) { B.danhN = 0; B.lach = this.tkChen(e); }
    },
    // bước về chỗ đứng của mình quanh mục tiêu m (tkChoDanh) nếu đang lệch > 18 điểm; trả true khi bắt đầu bước
    tkVeO(e, m) {
      const o = this.tkChoDanh(e, m), x = m.x + Math.cos(o.goc) * o.r, y = m.y + (Math.sin(o.goc) * o.r) / 2;
      if (ldist(e.x, e.y, x, y) <= 18 || !this.map.walkable(x, y)) return false;
      e.B.buoc = [x, y]; e.B.buocT = this.time + 0.6; return true;
    },
    // bắt đầu 1 đòn: chiêu (tốn nội lực như người — thiếu thì đòn thường; động tác như castStart) hoặc đòn thường (thuong: chiêu đang hồi lâu)
    tkRaDon(e, m, thuong, phu) {
      const c = thuong ? null : phu || e.chieu;
      if (c) {
        const A = lvAttrs(c.s, c.lv), phi = (A.skill_cost_v && A.skill_cost_v[0]) || 0;
        if (e.mp >= phi) {
          e.mp -= phi;
          const spd = c.s.phys ? e.p.atkSpeed || 0 : e.p.castSpeed || 0;
          let dur = R.atkFrames(CAST_T, spd) * TICK, hit = dur * HIT_AT;
          if (c.s.style === 1 && c.k.form === 12 && c.k.genData > 0) { const sw = this.manyGap(c.id, c.k) * TICK; dur = Math.max(1, c.k.num || 1) * sw; hit = HIT_AT * sw; }
          const ak = this.P.vc ? this.mobAtkK(e) : 1; dur /= ak; hit /= ak; // bị làm chậm: ra chiêu chậm như quái
          e.attack = c.s.phys ? (c.k.anim === 9 || c.k.anim === 10 ? ANIM[c.k.anim] : e.attack === "Attack1" ? "Attack2" : "Attack1") : ANIM[c.k.anim] || "Magic";
          e.atkDur = dur; e.hitAt = hit; e.don = () => this.tkBan(e, m, c);
          if (c.k.pre) this.vfxAt(c.k.pre, null, e, 0);
          e.act = "attack"; e.t = 0; e.hitDone = false; e.atkN = (e.atkN || 0) + 1;
          return;
        }
      }
      e.attack = e.attack === "Attack1" ? "Attack2" : "Attack1";
      const ak = this.P.vc ? this.mobAtkK(e) : 1;
      e.atkDur = e.p.atkDur / ak; e.hitAt = e.atkDur * HIT_AT; e.don = () => this.tkDonThuong(e, m);
      e.act = "attack"; e.t = 0; e.hitDone = false; e.atkN = (e.atkN || 0) + 1;
    },
    // ra chiêu ở nhịp ra đòn: đạn thật (tkA: phe + mã bot) ở máy chủ trận — trúng bot phe kia / mình; người khác phát lại từ tin "tkc" (chỉ trúng họ)
    tkBan(e, m, c0) {
      const c = c0 || e.chieu, A = lvAttrs(c.s, c.lv), cdT = (A.skill_mintimepercast_v && A.skill_mintimepercast_v[0]) || c.k.tpc || 0;
      if (cdT) e.p.cd[c.id] = this.time + cdT * TICK;
      const ok = m && (m === this.player ? m.hp > 0 : m.alive), pt = ok ? [m.x, m.y] : [e.x + 1, e.y];
      if (this.P.vc.warm) this.P.vc.warm(c.id);
      this.fire(c.id, c.lv, { root: c.id, x: e.x, y: e.y, tgt: ok ? m : null, pt, goc: e, ptA: e, tkA: { phe: e.tkPhe, ref: "#" + e.tkb } });
      const T = this.tk; if (T && T.guiChieu) T.guiChieu("#" + e.tkb, c.id, c.lv, e.x, e.y, pt[0], pt[1], !ok ? "" : m === this.player ? this.hero.name : m.tkn || (m.tkb ? "#" + m.tkb : ""));
    },
    // đòn thường của bot (không chiêu / hết nội lực): như World.land, không hút sinh lực
    tkDonThuong(e, m) {
      if (!m || ldist(e.x, e.y, m.x, m.y) > e.p.reach + (m.radius || 14) + 20) return;
      if (m === this.player) { if (m.hp <= 0 || this.tkAnToan(m, this.tk.phe)) return; const d = nhanHs(R.heroDamage(e.p, this.tkThu()), this.tk); if (!d.miss) this.guard({ series: e.series, curse: [] }, m, d); this.tkGhiDon(e.p.tkRef); this.hit(e.p, m, d); return; }
      if (!m.alive) return;
      if (m.tkb) { this.hit(e.p, m, R.heroDamage(e.p, m)); return; } // hệ số nhân ở tkHit
      if (m.tkn) { const d = nhanHs(R.heroDamage(e.p, m), this.tk); if (!d.miss && this.tk.danhNguoi) this.tk.danhNguoi(m.tkn, d, e.p.tkRef); }
    },
    // bùa lợi / hồi máu cho đồng đội (Nga My…): đồng đội (bot cùng phe / mình nếu cùng phe) dưới 60 % trong tầm chiêu -> thi pháp, máu chung báo máy chủ
    tkHoTro(e) {
      const B = e.B, H = e.hoi, t = this.time; if (!H || t < B.hoiT) return false;
      B.hoiT = t + 0.7;
      const R0 = ((this.P.skillDb[H.id] || {}).radius || 400) * SCALE, T = this.tk;
      let ai = null, it = 0.6;
      const xet = (x, pct) => { if (pct < it && ldist(e.x, e.y, x.x, x.y) <= R0) { it = pct; ai = x; } };
      for (const b of T.bots.values()) if (b.alive && b.tkPhe === e.tkPhe) xet(b, b.hp / Math.max(1, b.hpMax));
      const p = this.player; if (T.phe === e.tkPhe && p.hp > 0) xet(p, p.hp / p.hpMax);
      for (const n of T.nguoi.values()) if (n.alive && n.tkPhe === e.tkPhe) xet(n, (n.hp || 0) / 100);
      if (!ai) return false;
      if (((this.P.skillDb[H.id] || {}).horse | 0) === 1) { if (e.ngua && !this.tkNgua(e, false)) return false; B.nguaNghi = t + NGUA_NGHI; } // chiêu hồi máu cấm cưỡi ngựa: xuống ngựa trước, chưa lên lại ngay
      B.hoiT = t + HOI_DOI;
      e.dir = dirOf(ai.x - e.x, (ai.y - e.y) * 2); e.path = null; e.dangHoi = t;
      e.attack = "Magic"; e.atkDur = R.atkFrames(CAST_T, e.p.castSpeed || 0) * TICK; e.hitAt = e.atkDur * HIT_AT;
      e.don = () => {
        if (ai === this.player) { if (this.player.hp > 0) this.buffOn(H.id, H.lv); return; }
        if (ai.tkn) { if (T.hoiNguoi) T.hoiNguoi(ai.tkn, H.id, H.lv, e.tkb); return; } // người cùng phe máy khác: máy họ dùng chiêu hồi máu lên mình
        if (!ai.alive) return;
        const v = Math.round(ai.hpMax * 0.12 * (1 + H.lv / 40)); // hồi tức thì ≈ 12–24 % máu (chiêu hồi máu client là hồi theo nhịp — TẠM cho bot)
        ai.hp = Math.min(ai.hpMax, ai.hp + v); // không hiện số (như số sát thương — chỉ đòn của mình)
        if (T.hoiBot) T.hoiBot(ai.tkb, v);
      };
      const k = this.P.vc && this.P.vc.sk(H.id); if (k && k.pre) this.vfxAt(k.pre, null, e, 0);
      e.act = "attack"; e.t = 0; e.hitDone = false; e.atkN = (e.atkN || 0) + 1;
      return true;
    },
    // thuốc của bot: sinh lực dưới ngưỡng -> 1 bình hồi theo nhịp (máu chung: báo máy chủ hồi); dưới 35 % uống thêm bình thứ 2 chạy cùng lúc (người
    // thật bấm thuốc liên tục khi bị dồn — anh 06/11 "vèo cái chết sạch"), 2 bình cách ≥ 0,5 giây; nội lực dưới 40 % -> bình nội lực; nội lực hồi theo
    // chỉ số như người (manaRegen)
    tkThuocBot(e, dt) {
      const B = e.B, tri = (this.tk && this.tk.tri) || 3, T = this.tk, t = this.time;
      const binh = () => { B.binh--; B.potT = t; return { v: THUOC.v, mp: THUOC.mp, n: THUOC.n, t: 0.5 }; };
      if (!B.pot && B.binh > 0 && e.hp < e.hpMax * NGUONG[tri]) B.pot = binh();
      else if (tri >= 2 && B.pot && !B.pot2 && B.binh > 0 && e.hp < e.hpMax * 0.35 && t - B.potT >= 0.5) B.pot2 = binh();
      for (const k of ["pot", "pot2"]) {
        const P = B[k]; if (!P) continue;
        for (P.t -= dt; P.t <= 0 && P.n > 0; P.t += 0.5, P.n--) { const v = Math.min(P.v, e.hpMax - e.hp); if (v > 0) { e.hp += v; if (T.hoiBot) T.hoiBot(e.tkb, v); } if (P.mp > 0 && e.mp < e.mpMax) e.mp = Math.min(e.mpMax, e.mp + P.mp); }
        if (P.n <= 0) B[k] = null;
      }
      if (e.p.manaRegen > 0 && e.mp < e.mpMax) e.mp = Math.min(e.mpMax, e.mp + e.p.manaRegen * 2 * dt);
      if (!B.potNl && B.binhNl > 0 && e.mp < e.mpMax * 0.4) { B.binhNl--; B.potNl = { v: Math.max(1, Math.round(e.mpMax * 0.06)), n: 10, t: 0.5 }; }
      if (B.potNl) for (B.potNl.t -= dt; B.potNl.t <= 0 && B.potNl.n > 0; B.potNl.t += 0.5, B.potNl.n--) e.mp = Math.min(e.mpMax, e.mp + B.potNl.v);
      if (B.potNl && B.potNl.n <= 0) B.potNl = null;
    },
    // bùa lợi (anh 06/11 "nó không buff trấn phái hay sao ấy"): như người — ra trận / hồi sinh thì đứng thi pháp lần lượt từng bùa ở doanh, hết hạn thì
    // dùng lại; động tác thi pháp + hình vận công như người, máy khác thấy hình vận công qua "tkc" (tongkim.js chieu). Chỉ số bùa đã tính sẵn (tkChiSo);
    // hình trạng thái ở máy chủ trận hiện từ lúc dùng (e.bl). Trả true khi vừa bắt đầu thi pháp
    tkBua(e) {
      const B = e.B, t = this.time; if (!e.buaDs || e.act === "attack") return false;
      const db = this.P.skillDb, id = e.buaDs.find((i) => (B.buaHet[i] || 0) < t + 1); if (id == null) return false;
      const lv = (e.H.skills || {})[id] | 0, s = db[id];
      if (!s || lv < 1) { B.buaHet[id] = Infinity; return false; }
      const A = statsOnly(lvAttrs(s, lv)), dur = Math.max(0, ...Object.values(A).map((v) => (v[1] > 0 ? v[1] : 0))) * TICK || 60;
      // bùa quá ngắn (vd Võ Đang Xuất Ứ Bất Nhiễm 716 cấp 3: miễn trạng thái xấu 18 khung = 1 giây): bỏ hẳn — soát đầu-cuối 06/11: hết hạn ngay sau khi thi
      // pháp nên bot dùng lại mỗi 0,7 giây mãi, không bao giờ ra khỏi hậu doanh / không đánh ai
      if (dur <= BUA_NGAN) { B.buaHet[id] = Infinity; return false; }
      if ((s.horse | 0) === 1) { if (e.ngua && !this.tkNgua(e, false)) return false; B.nguaNghi = t + NGUA_NGHI; } // bùa cấm cưỡi ngựa: xuống ngựa trước (chưa đủ 3 giây thì để lượt sau), chưa lên lại ngay
      e.path = null; e.fight = false;
      e.attack = "Magic"; e.atkDur = R.atkFrames(CAST_T, e.p.castSpeed || 0) * TICK; e.hitAt = e.atkDur * HIT_AT;
      e.don = () => { B.buaHet[id] = this.time + dur; const L = e.buaDs.filter((i) => (B.buaHet[i] || 0) > this.time && B.buaHet[i] !== Infinity); e.bl = L.length ? L : null; };
      const k = this.P.vc && this.P.vc.sk(id); if (k && k.pre) this.vfxAt(k.pre, null, e, 0);
      const T = this.tk; if (T && T.guiChieu) T.guiChieu("#" + e.tkb, id, lv, e.x, e.y, e.x + 1, e.y, "");
      e.act = "attack"; e.t = 0; e.hitDone = false; e.atkN = (e.atkN || 0) + 1;
      return true;
    },
    // vùng sát thương đứng yên của 2 phe đang cháy (đạn đứng yên nổ mỗi DmgInterval — bãi lửa Nghiệp Hỏa Phàn Thành của Thiên Ngoại Lưu Tinh, Phong
    // Tuyết Băng Thiên…): tính 1 lần / bước -> [[phe, x, y, nửa cạnh vùng]]. Thử 06/11: các bãi lửa này gây phần lớn sát thương lên bot — cả đám đứng
    // trong lửa chết cùng lúc ("vèo cái chết sạch"); bãi Nghiệp Hỏa chỉ cháy 33 vòng (1,8 giây) mà đốt mỗi 3 vòng -> phải chạy ngay
    tkVungDich() {
      const T = this.tk; if (T._vg && T._vg.t === this.time) return T._vg.L;
      const L = [];
      for (const m of this.mis || []) {
        const d = m.d, A = m.src && m.src.tkA; if (!A || m.done || !d || !d.range || d.colVanish || !(d.dmgInt > 0) || (d.move !== 0 && m.speed > 0)) continue;
        if (m.t < 2 || m.life - m.t < 4) continue; // vừa rơi (< 2 vòng ≈ 0,11 giây) / sắp tắt: bỏ
        const r = Math.max(1, d.dmgR || 1), n = Math.max(Math.floor(r / 2), Math.min(r, VUNG_TOI));
        L.push([A.phe, m.x, m.y, (n + 0.5) * O_VUNG + 14]);
      }
      T._vg = { t: this.time, L }; return L;
    },
    // (x, y) nằm trong bãi lửa / vùng nổ đang cháy của phe kia đối với phe ph
    tkTrongVung(x, y, ph) { for (const [phe, vx, vy, h] of this.tkVungDich()) if (phe !== ph && Math.abs(x - vx) <= h && Math.abs(y - vy) * 2 <= h) return true; return false; },
    // né vùng (anh 06/11): bot đứng trong vùng sát thương của phe kia -> bước thẳng ra ngoài mép vùng (+30) theo hướng từ tâm vùng ra chỗ mình (bị chặn
    // thì xoay ±45°, ±90°). Trả true khi đang bước tránh (tkDiBuoc)
    tkTranh(e) {
      const B = e.B, t = this.time;
      if (B.buoc && B.tranhDang) return true;
      B.tranhDang = false;
      for (const [phe, x, y, h] of this.tkVungDich()) {
        if (phe === e.tkPhe || Math.abs(e.x - x) > h || Math.abs(e.y - y) * 2 > h) continue;
        const a0 = Math.abs(e.x - x) + Math.abs(e.y - y) < 1 ? Math.random() * Math.PI * 2 : Math.atan2((e.y - y) * 2, e.x - x);
        for (const da of [0, 0.8, -0.8, 1.6, -1.6]) {
          // đường ngắn nhất ra khỏi vùng vuông (±h theo x, ±h theo 2y — như vocong.js inVung) theo hướng này + 25 điểm
          const a = a0 + da, r = h / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)), 0.3) + 25, px = x + Math.cos(a) * r, py = y + (Math.sin(a) * r) / 2;
          if (this.map.walkable(px, py)) { B.buoc = [px, py]; B.buocT = t + 1.2; B.tranhDang = true; return true; }
        }
        return false;
      }
      return false;
    },
    // lui về hồi máu (anh 06/11 "vèo cái chết sạch"): đang đánh, máu dưới LUI_MAU, còn thuốc -> chạy ~200 điểm về phía doanh mình (thuốc đang uống —
    // tkThuocBot uống cả 2 bình dưới 35 %) rồi quay lại đánh; tối đa 1 lần / LUI_CACH giây. Trả true khi đang lui (tkDiBuoc)
    // Anh 06/11 lần 2: 1 lần lui rõ ràng — chạy về phía doanh tới khi đủ LUI_DU máu (thuốc đang uống) hoặc hết LUI_GIU giây, không đánh, không nhắm ai;
    // tới gần doanh thì đứng chờ. Trả true khi đang lui (tự chạy)
    tkLui(e, dt) {
      const B = e.B, t = this.time, T = this.tk, c = T.trai && T.trai[e.tkPhe];
      if (B.luiDen) {
        if (c && t < B.luiDen && e.hp < e.hpMax * LUI_DU) {
          if (ldist(e.x, e.y, c[0], c[1]) > (T.R || 220) * 0.7) this.tkChay(e, c[0], c[1], dt); else { e.path = null; this.setAct(e, "stand"); }
          return true;
        }
        B.luiDen = 0; B.luiVeT = t + LUI_CACH; return false;
      }
      if (!c || !B.muc || B.binh <= 0 || e.hp >= e.hpMax * LUI_MAU || t < (B.luiVeT || 0)) return false;
      if (ldist(e.x, e.y, c[0], c[1]) < (T.R || 220)) return false;
      B.luiDen = t + LUI_GIU; B.muc = null; B.o = null; B.buoc = null; T._demT = -1; e.fight = false;
      return true;
    },
    // về doanh mua thuốc: chạy về điểm doanh phe mình, đứng 2,5 giây ở Quân y rồi ra lại. Trận thật: tới bẫy đại doanh -> hậu doanh gần nhất (ve.bay —
    // dịch chuyển tới ve.toi), chạy tới Quân y đứng 2,5 giây, xong thì tkRaHau ra cổng hậu doanh
    tkVe(e, dt) {
      const T = this.tk, B = e.B;
      if (T.tran && T.D) {
        const P = T.D.phe[e.tkPhe ? 1 : 0], R0 = (T.D.bayR || 24) + 16; // + 16 như tkRaHau
        if (this.tkTrongHau(e)) {
          const q = P.hau.quanY || P.hau.diem[0];
          if (!q || ldist(e.x, e.y, q[0], q[1]) <= 70) { B.che = "mua"; B.muaT = this.time + 2.5; e.path = null; this.setAct(e, "stand"); return; }
          return this.tkChay(e, q[0], q[1], dt);
        }
        const c = ganNhatDs(P.ve.bay, e.x, e.y); if (!c) { B.che = "di"; return; }
        if (ldist(e.x, e.y, c[0], c[1]) <= R0) { this.tkDichChuyen(e, P.ve.toi.length ? P.ve.toi : P.hau.diem); return; }
        return this.tkChay(e, c[0], c[1], dt);
      }
      const c = T.trai && T.trai[e.tkPhe];
      if (!c) { B.che = "di"; return; }
      if (ldist(e.x, e.y, c[0], c[1]) <= 70) { B.che = "mua"; B.muaT = this.time + 2.5; e.path = null; this.setAct(e, "stand"); return; }
      this.tkChay(e, c[0], c[1], dt);
    },
    // không có mục tiêu: theo nhóm — con đầu nhóm đi tới điểm giữa trận (đổi điểm mỗi 8–14 giây), các con khác theo sau con đầu
    tkDiNhom(e, dt) {
      const B = e.B, T = this.tk, t = this.time;
      e.fight = false;
      if (!T.trai) { this.setAct(e, "stand"); return; }
      const ds = T.nhom && T.nhom.get(e.tkPhe * 1000 + (e.doi | 0)), dau = ds && ds.find((b) => b.alive && b.B && b.B.che === "di");
      if (dau && dau !== e) {
        // con đầu nhóm đang dí người thật mà mình không được nhắm (đủ CAP_DUOI bot dí người đó): đứng giãn ra vòng 180–260 quanh người đó, không vây sát
        // (thử 05/11: cả bầy đứng sát người bị dí trông như bị dồn — anh muốn tối đa 3–4 con)
        // theo con đầu nhóm: đứng vòng 95–155 quanh con đầu (anh 06/11 "đứng chụm vào hết" — bản trước 55, cả nhóm chụm 1 cục, 1 chiêu diện rộng chết sạch)
        const i = ds.indexOf(e), m = dau.B && dau.B.muc, nguoi = m && (m === this.player || m.tkn) ? m : null;
        const a = (i * 2.4 + (e.tkb % 7)) % (Math.PI * 2), r = nguoi ? 180 + (e.tkb % 5) * 20 : 95 + (i % 3) * 30, g = nguoi || dau, x = g.x + Math.cos(a) * r, y = g.y + (Math.sin(a) * r) / 2;
        if (ldist(e.x, e.y, x, y) > 40 && this.map.walkable(x, y)) return this.tkChay(e, x, y, dt);
        if (nguoi) e.dir = dirOf(nguoi.x - e.x, (nguoi.y - e.y) * 2);
        this.setAct(e, "stand"); return;
      }
      if (!B.dich || t > B.dichT || ldist(e.x, e.y, B.dich[0], B.dich[1]) < 50) {
        // tiến về phía địch gần nhất (anh 06/11 lần 2 "chạy tới chạy lui nhìn rất ngu": bản trước đi tới điểm ngẫu nhiên giữa trận, 8–14 giây đổi 1 lần — cả
        // nhóm đi qua đi lại); không còn địch ngoài doanh: tới trước doanh địch. Các nhóm lệch ngang theo số nhóm (không cùng dồn 1 điểm), luôn ngoài doanh mình
        const ta = T.trai[e.tkPhe], tb = T.trai[1 - e.tkPhe], ax = tb[0] - ta[0], ay = (tb[1] - ta[1]) * 2, dai = Math.hypot(ax, ay) || 1, lech = (((e.doi | 0) % 5) - 2) * 120;
        // hướng tiến giữ 1 địch tới khi con đó chết / vào doanh (đo 06/11: chọn lại địch gần nhất mỗi lần -> 2 con gần ngang nhau ở 2 phía thì cả nhóm quay đầu)
        // tàng hình: thôi theo; người / bot đã rời trận (không còn trong T.nguoi / T.bots — soát lần 2 06/11): thôi theo
        const hl = (c) => !!c && (c === this.player ? c.hp > 0 && !(c.hideUntil > t) && T.phe !== e.tkPhe && !this.tkAnToan(c, T.phe)
          : c.alive && c.tkPhe !== e.tkPhe && (c.tkq ? !!T.binh && T.binh.get(c.tkb) === c : c.tkb ? T.bots.get(c.tkb) === c : T.nguoi.get(c.tkn) === c) && !this.tkAnToan(c, c.tkPhe));
        // trận thật: Nguyên soái phe mình đang bị đánh -> nửa số nhóm (nhóm chẵn) về giữ soái (thiết kế mục 4 "về giữ Nguyên soái phe mình khi bị đánh")
        const giu = T.tran && (e.doi | 0) % 2 === 0 ? this.tkSoaiNguy(e.tkPhe) : null;
        let g = giu || (hl(B.dichG) ? B.dichG : null), gd = Infinity;
        if (!g) for (const c of this.tkDichCua(e.tkPhe)) { const d = ldist(e.x, e.y, c.x, c.y); if (d < gd) { gd = d; g = c; } }
        B.dichG = g === giu ? null : g;
        // không còn địch ngoài doanh: bãi thử — trước doanh địch (ngoài vòng an toàn); trận thật — tới giữa đại doanh phe kia (không an toàn — có Nguyên soái)
        const R0 = T.tran ? 0 : (T.R || 220) + 120, gx = g ? g.x : tb[0] - (ax / dai) * R0, gy = g ? g.y : tb[1] - ((ay / dai) * R0) / 2;
        const mx = gx - (ay / dai) * lech, my = gy + ((ax / dai) * lech) / 2;
        let pt = this.map.walkable(mx, my) ? [mx, my] : null;
        for (let i = 0; i < 8 && !pt; i++) { const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 140, x = mx + Math.cos(a) * r, y = my + Math.sin(a) * r * 0.5; if (this.map.walkable(x, y)) pt = [x, y]; }
        B.dich = this.tkNgoaiDoanh(...(pt || [gx, gy]), e.tkPhe); B.dichT = t + 1.5 + Math.random();
      }
      this.tkChay(e, B.dich[0], B.dich[1], dt);
    },
    // bước ngang một nhịp (nhấp nhả): vòng quanh mục tiêu ở cùng khoảng cách (vẫn trong tầm — anh 06/11 "tốc đánh chậm rì": bản trước bước ra ngoài
    // tầm 55–70 điểm rồi chạy vào lại); bị chen thì về chỗ của mình (tkVeO)
    tkBuocNgang(e, m) {
      if (this.tkChen(e) && this.tkVeO(e, m)) return;
      const d = Math.max(24, ldist(e.x, e.y, m.x, m.y)), r = Math.min(d, e.tam * 0.9 + (m.radius || 14));
      const a = Math.atan2((e.y - m.y) * 2, e.x - m.x) + (Math.random() < 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.3);
      const x = m.x + Math.cos(a) * r, y = m.y + (Math.sin(a) * r) / 2;
      if (this.map.walkable(x, y)) { e.B.buoc = [x, y]; e.B.buocT = this.time + 0.4; }
    },
    tkBuocLui(e, m, r) {
      const a = Math.atan2((e.y - m.y) * 2, e.x - m.x) + (Math.random() - 0.5) * 0.8, x = e.x + Math.cos(a) * r, y = e.y + (Math.sin(a) * r) / 2;
      if (this.map.walkable(x, y)) { e.B.buoc = [x, y]; e.B.buocT = this.time + 0.9; } else this.tkBuocNgang(e, m, r * 0.7);
    },
    tkDiBuoc(e, dt) {
      const B = e.B, [x, y] = B.buoc;
      if (this.time > B.buocT || ldist(e.x, e.y, x, y) < 8) { B.buoc = null; if (B.lach) B.lach = false; this.setAct(e, "stand"); return; }
      e.path = [[x, y]];
      if (this.follow(e, e.path, e.toc * (this.P.vc ? this.mobSpeedK(e) : 1), dt)) B.buoc = null;
      this.setAct(e, "run");
    },
    // chạy tới (x, y): đường thẳng nếu trống; tìm đường (A*) tối đa 1 lần / 0,7 giây mỗi con; kẹt 2 giây -> bỏ mục tiêu / đổi điểm đến
    // trận thật: đích xa hơn XA_LUOI -> tới điểm kế trên lưới điểm (tkMocLuoi), không tìm A* thẳng tới đích xa
    tkChay(e, x, y, dt) {
      const T = this.tk;
      if (T && T.tran && ldist(e.x, e.y, x, y) > XA_LUOI) { const m = this.tkMocLuoi(e, x, y); if (m) { x = m[0]; y = m[1]; } }
      const B = e.B, g = e.goal, lech = g ? Math.abs(g[0] - x) + Math.abs(g[1] - y) : Infinity;
      const het = !e.path || !e.path.length;
      if (e.path && e.path.length === 1 && lech > 16 && lech <= 140) { e.path[0] = [x, y]; e.goal = [x, y]; }
      else if ((het && this.time >= (B.timT || 0)) || (e.repath -= dt) <= 0 || lech > 140) {
        if (lech > 140) { B.ketD = Infinity; B.ketT = 0; } // đích đổi hẳn: tính kẹt lại từ đầu
        e.repath = 0.7 + Math.random() * 0.3; e.goal = [x, y]; B.timT = this.time + 0.35; e.path = this.map.path(e.x, e.y, x, y, 3000) || [[x, y]];
      }
      if (e.path && e.path.length && this.follow(e, e.path, e.toc * (this.P.vc ? this.mobSpeedK(e) : 1), dt)) e.path = [];
      this.setAct(e, "run");
      // kẹt: 2 giây không lại gần đích được 6 điểm -> bỏ mục tiêu 5 giây / đổi điểm đến
      const d = ldist(e.x, e.y, x, y);
      if (d < B.ketD - 6) { B.ketD = d; B.ketT = 0; }
      else if ((B.ketT += dt) > 2) { B.ketT = 0; B.ketD = Infinity; e.path = null; e._tuyen = null; if (B.muc) { B.boQua.set(B.muc, this.time + 5); B.muc = null; } else B.dich = null; }
    },
    // ---------- trận thật: bẫy, lưới điểm ----------
    // bot ở hậu doanh phe mình: chạy tới điểm bẫy cổng hậu doanh gần nhất (ra.bay), tới nơi (≤ bayR) thì dịch chuyển tới 1 điểm ra đại doanh (ra.toi) — như
    // người chơi (tongkim.js bay); bot chỉ dùng bẫy khi cố ý đi tới (không vô tình giẫm bẫy)
    tkRaHau(e, dt) {
      const T = this.tk, P = T.D && T.D.phe[e.tkPhe ? 1 : 0]; e.fight = false;
      const c = P && ganNhatDs(P.ra.bay, e.x, e.y); if (!c) { e.path = null; this.setAct(e, "stand"); return; }
      if (ldist(e.x, e.y, c[0], c[1]) <= (T.D.bayR || 24) + 16) { this.tkDichChuyen(e, P.ra.toi); return; } // + 16: điểm bẫy sát ô chặn — đường dừng ở tâm ô đi được gần nhất
      this.tkChay(e, c[0], c[1], dt);
    },
    // đặt bot / quân e tới 1 điểm ngẫu nhiên của ds (lệch ≤ 36, ô đi được) — bỏ đường, đích, tuyến lưới
    tkDichChuyen(e, ds) {
      const c = ds && ds.length ? ds[Math.floor(Math.random() * ds.length)] : null; if (!c) return false;
      let x = c[0], y = c[1];
      for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 36, nx = c[0] + Math.cos(a) * r, ny = c[1] + Math.sin(a) * r * 0.5; if (this.map.walkable(nx, ny)) { x = nx; y = ny; break; } }
      e.x = x; e.y = y; e.path = null; e.goal = null; e._tuyen = null;
      if (e.B) { e.B.dich = null; e.B.buoc = null; e.B.o = null; e.B.ketD = Infinity; e.B.ketT = 0; }
      this.setAct(e, "stand");
      return true;
    },
    // lưới của trận (dựng 1 lần mỗi bản đồ ở máy cần — máy chủ trận / người chơi đi xa): điểm đại doanh + dã ngoại + điểm ra đại doanh + chỗ Nguyên soái (G —
    // lính trôi) và lưới thô tìm đường xa (C)
    tkLuoiDung() {
      const T = this.tk; if (!T || !T.tran || !T.D) return null;
      if (T.luoi && T.luoi.map === this.map) return T.luoi;
      const pts = [];
      for (const P of T.D.phe) { pts.push(...P.dai.diem, ...P.dong, ...P.ra.toi); if (P.soai) pts.push(P.soai); if (P.dai.tam) pts.push(P.dai.tam); }
      let G = null, C = null;
      try { G = dungLuoi(pts, this.map); C = dungTho(this.map); } catch (err) { console.warn("Tống Kim — lưới đường:", err); }
      T.luoi = { map: this.map, G: G && G.P.length ? G : null, C };
      return T.luoi;
    },
    tkLuoi() { const L = this.tkLuoiDung(); return L ? L.G : null; },
    // điểm kế trên đường xa tới (gx, gy) theo lưới thô (giữ tuyến tới khi đích dời > 300 hoặc 6 giây; điểm sau đi thẳng tới được, cách ≤ 900 thì bỏ qua
    // điểm giữa — xét 2 lần / giây); null = đi thẳng / tìm đường thường. e: bot, quân hoặc người chơi (Trợ Thủ — tkDuongDai)
    tkMocLuoi(e, gx, gy) {
      const L = this.tkLuoiDung(), C = L && L.C; if (!C) return null;
      let R0 = e._tuyen;
      if (!R0 || ldist(R0.gx, R0.gy, gx, gy) > 300 || this.time > R0.het) R0 = e._tuyen = { gx, gy, ds: timTho(C, this.map, e.x, e.y, gx, gy) || [], i: 0, het: this.time + 6, xet: 0 };
      const ds = R0.ds;
      while (R0.i < ds.length && ldist(e.x, e.y, ds[R0.i][0], ds[R0.i][1]) < 80) R0.i++;
      if (this.time >= R0.xet) {
        R0.xet = this.time + 0.5;
        while (R0.i + 1 < ds.length && ldist(e.x, e.y, ds[R0.i + 1][0], ds[R0.i + 1][1]) <= 900 && this.map.clear(e.x, e.y, ds[R0.i + 1][0], ds[R0.i + 1][1])) R0.i++;
      }
      return R0.i < ds.length ? ds[R0.i] : null;
    },
    // đường đi cho người chơi (Trợ Thủ trận thật — về chỗ cũ / ra cổng): gần thì tìm đường thường, xa thì tới điểm kế trên lưới -> [[x, y]…] | null
    tkDuongDai(x, y) {
      const p = this.player, T = this.tk;
      if (T && T.tran && ldist(p.x, p.y, x, y) > XA_LUOI) { const m = this.tkMocLuoi(p, x, y); if (m) return this.map.path(p.x, p.y, m[0], m[1], 6000) || [[m[0], m[1]]]; }
      return this.map.path(p.x, p.y, x, y);
    },
    // ---------- Trợ Thủ của người chơi trong trận (world.js pkLuiTick / updateHero) ----------
    // mình đang ở khu an toàn phe mình: bãi thử — trong vòng doanh; trận thật — trong hậu doanh (không tính "cả bản đồ an toàn" lúc báo danh — T.hoa)
    tkTrongAn(p = this.player) {
      const T = this.tk; if (!T) return false;
      if (T.tran) return !!T.hau && T.hau(T.phe, p.x, p.y);
      const c = T.trai && T.trai[T.phe]; return !!c && ldist(p.x, p.y, c[0], c[1]) <= (T.R || 220);
    },
    // chỗ chạy về khi lui hồi máu: bãi thử — tâm doanh phe mình; trận thật — điểm bẫy đại doanh -> hậu doanh gần nhất (tongkim.js dịch chuyển khi giẫm lên)
    tkDiemAn(p = this.player) {
      const T = this.tk; if (!T) return null;
      if (T.tran) { const P = T.D && T.D.phe[T.phe ? 1 : 0]; return P ? ganNhatDs(P.ve.bay, p.x, p.y) : null; }
      return (T.trai && T.trai[T.phe]) || null;
    },
    // Trợ Thủ đang tự đánh, trận thật đang đánh: đứng trong hậu doanh (hồi sinh xong / lui hồi máu xong) -> tự đi ra điểm bẫy cổng hậu doanh gần nhất
    // (tongkim.js dịch chuyển ra đại doanh); ra rồi mà còn chỗ vừa ngã (World.tkQuay — tongkim.js chet, ≤ 60 giây) thì đi về đó, gặp địch trên đường thì
    // đánh. Người chơi tự bấm đi / đánh, thẻ PK đang lui hồi máu: thôi. Trả true khi đang đi ra cổng (updateHero khỏi tìm mục tiêu)
    tkTuRa(p, dt) {
      const T = this.tk; if (!T || !T.tran || T.pha !== "danh" || p.manual || p.hp <= 0 || this.pkLuiDang) return false;
      if (this.tkTrongAn(p)) {
        const P = T.D && T.D.phe[T.phe ? 1 : 0], c = P && ganNhatDs(P.ra.bay, p.x, p.y); if (!c) return false;
        p.target = null; p.loot = null;
        if ((this._tkRaT = (this._tkRaT || 0) - dt) <= 0 || !p.path || !p.path.length) { this._tkRaT = 1; p.path = this.map.path(p.x, p.y, c[0], c[1]) || [[c[0], c[1]]]; }
        return true;
      }
      const v = this.tkQuay;
      if (v) {
        if (p.target || ldist(p.x, p.y, v[0], v[1]) <= 80 || this.time - v[2] > 60) this.tkQuay = null;
        else if (!p.path || !p.path.length) p.path = this.tkDuongDai(v[0], v[1]) || null;
      }
      return false;
    },

    // ---------- quân NPC trận thật (đợt 2 — tongkim.js datBinh: kind mob, tkb = mã, tkq, binh = bậc 0–5, tkPhe; nha = chỗ giữ, home = chỗ sinh; tầm nhìn
    // m.vision, tầm hoạt động m.active, Nguyên soái giữ chỗ m.giu — đã nhân 0,75 như quái) ----------
    // máy chủ trận chạy não (tkNaoBinh); máy khác vẽ theo "tkh" như bot (updateOther) + độc / bùa của mình gây trên quân (mobTick)
    tkCapNhatBinh(m, dt) {
      const T = this.tk;
      if (!m.alive) { m.deadT += dt; m.t += dt; if (m.act !== "die") this.setAct(m, "die"); return; }
      if (!T || !T.chu) { m.ngoai = true; if (this.P.vc && (m.poison || (m.curse && m.curse.length))) this.mobTick(m, dt); this.updateOther(m, dt); return; }
      m.ngoai = false;
      this.tkNaoBinh(m, dt);
    },
    tkNaoBinh(m, dt) {
      const T = this.tk, t = this.time;
      m.t += dt;
      if (this.P.vc && this.mobTick(m, dt)) { if (m.act === "attack") this.setAct(m, "stand"); return; } // độc / bùa hút máu / choáng
      if (!m.alive) return; // vừa chết vì độc ở máy mình (máy chủ báo chết)
      if (this.P.vc && (this.mobMod(m, "randmove") > 0 || (m.hlUntil || 0) > this.time)) { m.path = null; if (m.act !== "hurt") this.setAct(m, "stand"); return; } // hoảng loạn (hlUntil: máy khác gây — tkst)
      const B = m.B || (m.B = { muc: null, neo: null, nghiT: 0, dich: null, dichT: t + 1 + Math.random() * 6 });
      if (T.hoa) { B.muc = null; m.path = null; m.fight = false; this.setAct(m, "stand"); return; } // báo danh / đã xong: đứng yên
      if (B.muc && !(B.muc === this.player ? B.muc.hp > 0 : B.muc.alive)) { B.muc = null; B.neo = null; } // mục tiêu vừa ngã: thôi ngay (không chờ lượt nghĩ)
      if (m.act === "attack") {
        if (!m.hitDone && m.t >= m.atkDur * HIT_AT) { m.hitDone = true; this.tkBinhDanh(m, B.muc); }
        if (m.t >= m.atkDur) { this.setAct(m, "stand"); m.atkT = (m.atkGap || 5 * TICK) / (this.P.vc ? this.mobAtkK(m) : 1); }
        return;
      }
      if (m.act === "hurt" && m.t < (m.hurtDur || 0.5)) return;
      m.atkT = (m.atkT || 0) - dt;
      if (t >= B.nghiT) { B.nghiT = t + 0.3 + Math.random() * 0.25; this.tkBinhNghi(m); }
      const c = B.muc;
      if (c) {
        const d = ldist(m.x, m.y, c.x, c.y), tam = m.reach + (c.radius || 14);
        if (d <= tam) {
          m.path = null; m.dir = dirOf(c.x - m.x, (c.y - m.y) * 2); m.fight = true; m.aggro = true;
          if (m.atkT <= 0) {
            m.atkAct = Math.random() < 0.7 ? "attack1" : "attack2";
            m.atkDur = this.P.npc.duration(m.type, m.atkAct) || 1;
            m.atkN = (m.atkN | 0) + 1; this.setAct(m, "attack"); m.hitDone = false;
            if (ldist(m.x, m.y, this.player.x, this.player.y) < 700) this.P.audio.npc(m.type, m.atkAct, 0.45);
          } else this.setAct(m, "stand");
          return;
        }
        return this.tkBinhDi(m, c.x, c.y, dt, m.run);
      }
      m.fight = false; m.aggro = false;
      // không có mục tiêu: lính bậc 1 trôi dần về phía phe kia theo điểm dã ngoại (tới điểm thì nghỉ 2–8 giây — chỗ đó thành chỗ giữ); quân khác về chỗ giữ
      if (m.binh === 0 && T.D) {
        if (B.dich && ldist(m.x, m.y, B.dich[0], B.dich[1]) > 60) return this.tkBinhDi(m, B.dich[0], B.dich[1], dt, m.walk);
        if (B.dich) { B.dich = null; B.dichT = t + 2 + Math.random() * 6; m.nha = [m.x, m.y]; }
        if (t >= B.dichT) { B.dich = this.tkBinhTroi(m); B.dichT = t + 4 + Math.random() * 4; }
      }
      if (!B.dich && ldist(m.x, m.y, m.nha[0], m.nha[1]) > 40) return this.tkBinhDi(m, m.nha[0], m.nha[1], dt, m.walk);
      m.path = null; this.setAct(m, "stand");
    },
    // chọn mục tiêu (0,3–0,55 giây / lần): giữ con cũ khi còn đánh được, chưa ra khỏi tầm hoạt động quanh chỗ bắt đầu đuổi (Nguyên soái: quanh chỗ đứng, chỉ
    // m.giu); không thì địch gần nhất trong tầm nhìn — người, bot, quân (tkDichCua — không ai ở hậu doanh)
    tkBinhNghi(m) {
      const B = m.B, T = this.tk, cu = B.muc, soai = m.binh === 5, neo = soai ? m.nha : B.neo || [m.x, m.y];
      const hd = (soai ? m.giu || 150 : m.active || 525) + m.reach;
      if (cu) {
        const song = cu === this.player ? cu.hp > 0 && !(cu.hideUntil > this.time) : cu.alive;
        if (song && !this.tkAnToan(cu, cu === this.player ? T.phe : cu.tkPhe) && ldist(cu.x, cu.y, neo[0], neo[1]) <= hd + (cu.radius || 14)) return;
        B.muc = null; B.neo = null;
      }
      const cx = soai ? m.nha[0] : m.x, cy = soai ? m.nha[1] : m.y;
      let best = null, bd = soai ? Math.min(m.vision || 1350, hd) : m.vision || 300;
      for (const c of this.tkDichCua(m.tkPhe)) { const d = ldist(cx, cy, c.x, c.y); if (d < bd) { bd = d; best = c; } }
      if (best) { B.muc = best; B.neo = soai ? m.nha : [m.x, m.y]; }
    },
    // quân m vung trúng c: mình -> trừ máu ở máy mình (như quái đánh người — R.mobDamage, giảm theo hệ / nội lực hộ thân); người khác -> "tkn" (như đòn thường
    // bot — máy người đó trừ); bot / quân phe kia -> World.hit (tkHit gửi "tkd" nguồn "#mã" quân). Không nhân hệ số PK
    tkBinhDanh(m, c) {
      const T = this.tk;
      if (!c || !(c === this.player ? c.hp > 0 : c.alive) || ldist(m.x, m.y, c.x, c.y) > m.reach + (c.radius || 14) + 30) return;
      if (c === this.player) { if (this.tkAnToan(c, T.phe)) return; const d = R.mobDamage(m, c); if (!d.miss) this.guard(m, c, d); this.hit(m, c, d); return; }
      // người phe kia / bot: n.res và capRes đã qua khangThat (dư trần +1 mỗi 10 %) — mobDamage chặn trần lần nữa thì mất phần cộng (soát 13/11): người tính từ kháng gốc +
      // trần của họ, bot giữ số đã tính (trần 95 = không chặn lại)
      const thuQ = (c) => (c.resGoc ? { def: c.def, res: c.resGoc, resCap: c.resCap || null } : { def: c.def, res: c.res, resCap: { phys: R.KHANG_TOI_DA } });
      if (c.tkn) { if (this.tkAnToan(c, c.tkPhe)) return; const d = R.mobDamage(m, thuQ(c)); if (!d.miss && d.v > 0 && T.danhNguoi) T.danhNguoi(c.tkn, d, "#" + m.tkb); return; }
      if (c.tkb) this.hit(m, c, R.mobDamage(m, thuQ(c)));
    },
    // quân đi tới (x, y) tốc toc: xa -> theo lưới điểm (tkMocLuoi); tìm đường A* ≤ 3000 ô tối đa 1 lần / 0,35 giây; kẹt 2 giây -> bỏ mục tiêu / điểm trôi
    tkBinhDi(m, x, y, dt, toc) {
      if (this.tk.tran && ldist(m.x, m.y, x, y) > XA_LUOI) { const w = this.tkMocLuoi(m, x, y); if (w) { x = w[0]; y = w[1]; } }
      const g = m.goal, lech = g ? Math.abs(g[0] - x) + Math.abs(g[1] - y) : Infinity, het = !m.path || !m.path.length;
      if (m.path && m.path.length === 1 && lech > 8 && lech <= 120) { m.path[0] = [x, y]; m.goal = [x, y]; }
      else if ((het || lech > 120 || (m.repath = (m.repath || 0) - dt) <= 0) && this.time >= (m.timT || 0)) {
        m.timT = this.time + 0.35; m.repath = 0.8 + Math.random() * 0.4; m.goal = [x, y]; m.path = this.map.path(m.x, m.y, x, y, 3000) || [[x, y]];
      }
      const x0 = m.x, y0 = m.y;
      if (m.path && m.path.length && this.follow(m, m.path, toc * (this.P.vc ? this.mobSpeedK(m) : 1), dt)) m.path = [];
      this.setAct(m, toc > (m.walk || 0) + 1 ? "run" : "walk");
      if (Math.abs(m.x - x0) + Math.abs(m.y - y0) > 0.3) m.stuckT = 0;
      else if ((m.stuckT = (m.stuckT || 0) + dt) > 2) { m.stuckT = 0; m.path = null; m._tuyen = null; if (m.B) { m.B.muc = null; m.B.neo = null; m.B.dich = null; } }
    },
    // lính bậc 1 không có mục tiêu: điểm kế trên đường sang phe kia — điểm quân (lưới điểm) cách 250–700, gần giữa đại doanh phe kia hơn chỗ đang đứng ≥ 150
    // và có đường A* ngắn tới được (bốc ngẫu nhiên trong 4 điểm tốt nhất); không có (góc dã ngoại — thử 06/11 bản đồ thật: điểm quanh góc đều ở phía sau) thì
    // mốc đầu trên lưới thô về phía đó (~600 logic); tới cách đại doanh phe kia ≤ 600 thì thôi trôi
    tkBinhTroi(m) {
      const T = this.tk, L = this.tkLuoiDung(), D = T.D; if (!L || !D) return null;
      const P = D.phe[m.tkPhe ? 0 : 1], dich = P.dai.tam || P.soai; if (!dich) return null;
      const d0 = ldist(m.x, m.y, dich[0], dich[1]); if (d0 <= 600) return null;
      const ds = [];
      if (L.G) L.G.gan(m.x, m.y, 700, (i) => { const p = L.G.P[i], d = ldist(m.x, m.y, p[0], p[1]); if (d < 250) return; const k = ldist(p[0], p[1], dich[0], dich[1]); if (k <= d0 - 150) ds.push([k + d * 0.3, p]); });
      ds.sort((a, b) => a[0] - b[0]);
      for (const [, p] of ds.slice(0, 4).sort(() => Math.random() - 0.5)) if (this.map.path(m.x, m.y, p[0], p[1], 3000)) return [p[0], p[1]];
      const r = L.C ? timTho(L.C, this.map, m.x, m.y, dich[0], dich[1]) : null;
      return r && r.length ? r[0] : null;
    },

    // ---------- đòn PK ----------
    // ghi người vừa đánh mình (máy chủ cộng điểm cho người / bot kết liễu — tongkim.js chet)
    tkGhiDon(ref) { if (ref != null && this.tk) this.tkDon = { ref, t: this.time }; },
    // đạn có tkA (vocong.js misHit): đạn của mình / bot (máy chủ trận) trúng bot / người phe kia, hoặc chiêu phát lại của người / bot phe kia trúng mình
    tkTrung(m, e) {
      const T = m.src.tkA, a = m.src.ptA || null; // a: bot / chỉ số người chơi khác (phát lại); null = mình ra chiêu
      const s = this.skDef(m.src.id); if (!s) return;
      const A = lvAttrs(s, m.src.lv), co = Object.keys(A).some((k) => DMG.test(k));
      // chiêu của mình trúng người phe kia (anh 12/11 "đánh k vào sát thương cho team bạn, k hiện số"): MÁY MÌNH quyết trúng / trật + sát thương theo bản chụp phòng
      // thủ của họ (+ bùa họ đang dính), hiện số, gửi thẳng "tkn" (tkTrungNguoi — như vòng sáng / cú lướt). Trước: máy họ phát lại chiêu trên chỗ đã cũ 0,5–1,3 giây
      // nên người đang chạy gần như không ăn đòn. Máy họ giờ chỉ vẽ chiêu phát lại (cờ pv của tin "tkc" — tongkim.js chieu). Hút sinh lực theo sát thương đã gửi
      if (e.tkn) { if (!a) { const v = this.tkTrungNguoi(m, e); if (v > 0 && co) this.hutChieu(s, A, v); } return; }
      const tinh = (fn) => (a ? this.voiPhanThan(a, fn) : fn());
      if (e === this.player) return this.tkTrungMinh(m, s, A, co, a, T);
      if (!e.tkb || !e.alive) return;
      if (!a && laBoss(e) && this.ganBoss && !this.ganBoss(this.player, e)) return; // Nguyên soái (anh 16/11 — như misHit): mình đứng ngoài BOSS_TAM thì không bùa / độc / hút / sát thương
      const bua = (B) => { const c = this.curseOn(e, m.src.id, m.src.lv, B); if (c && a) c.pt = a.p; this.tkTT(e); };
      if (!co) {
        // Thiên Nhẫn 120 -> 723 hoảng loạn lên bot / quân (soát 13/11): trượt theo missle_missrate, mỗi đạn tối đa missle_hitcount mục tiêu (6 — đếm chung với người phe kia,
        // tkTrungNguoi) như client; trước: bot / quân trong vùng dính hết, không trượt
        if (A.randmove && A.randmove[0] > 0 && !this.tkHlLuot(m, A)) return;
        return bua(A);
      }
      const r = tinh(() => this.skDamage(s, A, m.src, e));
      this.hit(a ? a.p : this.player, e, r);
      // chiêu của mình trúng bot / quân: hút sinh lực / nội lực (anh 12/11) — theo sát thương thật đã vào bot (bot: nhân hệ số PK như tkHit; quân NPC: không nhân)
      if (!a && !r.miss && !r.none && r.v > 0 && !this.tkAnToan(e, e.tkPhe) && !this.tkAnToan(this.player, this.tk.phe)) this.hutChieu(s, A, e.tkq ? r.v : nhanHs({ ...r }, this.tk).v);
      if (r.miss || !e.alive) return;
      // chiêu 120 tự phát khi đòn của mình có độc / lửa (Ngũ Độc Hấp Tinh Yểm… — anh 12/11: trong Tống Kim trước không bao giờ phát; như misHit đánh quái)
      if (!a && (A.poisondamage_v || A.firedamage_v || ((s.phys ? this.player.elem : this.player.elemMagic) || {}).fire > 0)) this.trigAuto("autoattackskill", e);
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) e.stunUntil = Math.max(e.stunUntil || 0, this.time + (A.stun_p[1] || 9) * TICK);
      if (r.cold > 0) tinh(() => this.slowMob(e, this.quaiVC ? this.khungCham(A) : null));
      if (A.poisondamage_v) {
        const po = tinh(() => this.poisonOf(s, A, m.src)), k = tinh(() => this.serK(s, A, m.src, e)), res = this.mobRes(e, "poison") - (tinh(() => this.player.boQuaDoc) || 0), dur = po.dur * (1 - this.mobMod(e, "poisontimereduce_p") / 100);
        const ev = po.every * TICK, layer = { v: Math.max(1, Math.floor(((po.v * (100 - res)) / 100) * k)), until: this.time + Math.max(1, dur) * TICK + ev / 2, ...(a ? { pt: a.p } : {}) };
        const P0 = e.poison && e.poison.until > this.time ? e.poison : null;
        e.poison = P0 ? { ...P0, list: [...P0.list, layer], every: Math.min(P0.every, ev), until: Math.max(P0.until, layer.until) } : { list: [layer], every: ev, next: this.time + ev, until: layer.until };
      }
      const neg = Object.fromEntries(Object.entries(A).filter(([key, v]) => !DMG.test(key) && v[1] > 0 && v[0] < 0 && !/^(skill_|missle_|addskill|seriesdamage|stun_p|deadlystrike)/.test(key)));
      if (Object.keys(neg).length) bua(neg);
      this.tkTT(e);
    },
    // chiêu của người / bot phe kia trúng mình: sát thương theo chỉ số người ra chiêu, trừ kháng / né / giảm của mình; choáng / chậm / độc tối đa
    // hieuUngToiDa nhịp như quái có võ công (anh 01/11 — tránh khống chế liên tục)
    tkTrungMinh(m, s, A, co, a, T) {
      const p = this.player; if (p.hp <= 0 || this.tkAnToan(p, this.tk.phe)) return;
      const tinh = (fn) => (a ? this.voiPhanThan(a, fn) : fn()), C = this.quaiVC, cap = (C && C.hieuUngToiDa) ?? 27, ref = T && T.ref != null ? T.ref : null;
      const src = (a && a.p) || { tkRef: ref };
      this.tkGhiDon(ref);
      if (!co) { // bùa hại lên mình: choáng / chậm + dòng bất lợi của bùa (tkBuaMinh — anh 12/11)
        if (p.phanBua > 0 && Math.random() * 100 < p.phanBua) return this.tkPhanBua(m, A, ref, cap); // Đại Thừa Như Lai Chú: bùa bật về người ra chiêu, mình không dính
        this.tkBuaMinh(m.src.id, m.src.lv); // dòng giảm tốc chạy của bùa vào chỉ số (world.js bonus) — không còn chậm 27 khung thay thế (anh 17/11)
        if (C && A.stun_p && Math.random() * 100 < A.stun_p[0]) this.heroChoang(Math.min(A.stun_p[1] || 9, cap));
        return;
      }
      const thu = this.tkThu(); // phòng thủ của mình — tính NGOÀI voiPhanThan (trong đó this.player là người ra chiêu — soát 05/11)
      const r = nhanHs(tinh(() => this.skDamage(s, A, m.src, thu)), this.tk);
      if (!r.miss && !r.none) this.guard({ series: a ? a.H.series | 0 : -1, curse: [] }, p, r);
      this.hit(src, p, r);
      if (!r.miss && !r.none) this.phanDon(this.tkThucThe(ref), r, s.phys ? "phys" : "mag", !s.melee); // phản đòn lên người / bot phe kia (anh 10/11)
      if (r.miss || p.hp <= 0 || !C) return; // chiêu chỉ có độc (r.none): vẫn gắn độc như misHit
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) this.heroChoang(Math.min(A.stun_p[1] || 9, cap));
      if (r.cold > 0) this.heroCham(Math.min(tinh(() => this.khungCham(A)), cap));
      if (A.poisondamage_v) {
        // độc đủ số nhịp như đánh quái (anh 12/11: trước chỉ tính trong hieuUngToiDa khung — 2 / 7 nhịp); anh 17/11 tối: KHÔNG còn dồn vào ≤ cap khung — độc kéo dài đủ thời gian chiêu (DOC_MAX), chồng lớp như đánh quái (trước: chống khống chế liên tục)
        const po = tinh(() => this.poisonOf(s, A, m.src)), res = (thu.res.poison || 0) - (tinh(() => this.player.boQuaDoc) || 0), f = Math.min(po.dur, DOC_MAX), /* bỏ qua độc phòng của người đánh (anh 17/11) */ e = Math.max(1, po.every), nTong = Math.max(1, Math.floor(po.dur / e + 0.5)), ks = tinh(() => this.serK(s, A, m.src, thu));
        this.heroDoc(src, ((po.v * (100 - res)) / 100) * ks * nTong * heSo(this.tk), { f, e });
      }
    },
    // đòn đánh thẳng vào mình (tin "tkt" — đòn thường của người / bot phe kia): t = { tu, ref, v, crit, st: { cg, cm, doc: [v, f, e] } }
    tkTrungThang(t) {
      const p = this.player; if (!this.tk || p.hp <= 0 || this.tkAnToan(p, this.tk.phe)) return;
      const C = this.quaiVC, cap = (C && C.hieuUngToiDa) ?? 27, d = { v: Math.max(0, t.v | 0), crit: !!t.crit };
      this.tkGhiDon(t.ref || t.tu || "");
      // gói 0 sát thương = chỉ độc / bùa hại (vòng sáng Vô Hình Độc, chiêu độc, bùa — anh 12/11): không hiện "Né"
      const st = t.st || {}, ke = this.tkThucThe(t.ref || t.tu || ""); // ke: bản chọn mục tiêu / bot của người đánh — hệ ngũ hành cho "giảm sát thương từ hệ" (rà soát 12/11)
      if (d.v > 0) { this.guard({ series: ke && ke.series != null ? ke.series | 0 : -1, curse: [] }, p, d); this.hit({ tkRef: t.ref || t.tu || "" }, p, d); }
      if (Array.isArray(st.bua) && p.hp > 0) { // bùa hại của người phe kia (máy họ quyết trúng — tkTrungNguoi)
        const sd = this.skDef(st.bua[0]);
        if (sd && p.phanBua > 0 && Math.random() * 100 < p.phanBua) this.tkPhanBua({ src: { id: st.bua[0], lv: st.bua[1] } }, lvAttrs(sd, st.bua[1]), t.ref || t.tu || "", cap);
        else this.tkBuaMinh(st.bua[0], st.bua[1]);
      }
      // st.ph: chính đòn này là đòn phản -> không phản tiếp; st.k loại đòn (tkTrungNguoi — bit 1 ngoại công, bit 2 cận chiến): phản đòn đúng loại như trước; không có (đòn thường) -> mặc định
      if (d.v > 0 && !st.ph) { if (st.k != null) this.phanDon(ke, d, st.k & 1 ? "phys" : "mag", !(st.k & 2)); else this.phanDon(ke, d); }
      if (!C || p.hp <= 0) return;
      if (st.cg > 0) this.heroChoang(Math.min(st.cg, cap));
      if (st.cm > 0) this.heroCham(Math.min(st.cm, cap));
      if (Array.isArray(st.doc) && st.doc[0] > 0) this.heroDoc({ tkRef: t.ref || "" }, st.doc[0], { f: Math.min(st.doc[1] || 27, DOC_MAX), e: Math.max(1, st.doc[2] || 9) }); // độc: đủ thời gian (DOC_MAX), không trần khống chế
    },
    // Đại Thừa Như Lai Chú (returnskill_p — engine KMissle: bùa chú bật về người ra chiêu): bot dính bùa như mình ra chiêu; người chơi khác nhận choáng / chậm gửi thẳng (bùa hại lên
    // người hiện chỉ có 2 loại này; đòn phải có sát thương mới qua được máy chủ nên kèm 1 điểm)
    tkPhanBua(m, A, ref, cap) {
      const e = ref != null ? this.tkThucThe(ref) : null; if (!e || e.alive === false) return;
      if (e.tkb) { this.curseOn(e, m.src.id, m.src.lv, A); return this.tkTT(e); }
      if (!e.tkn || !this.tk.danhNguoi) return;
      const st = { ph: 1 };
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) st.cg = Math.min(A.stun_p[1] || 9, cap);
      if (Object.entries(A).some(([k, v]) => /fastwalkrun_p/.test(k) && v[0] < 0)) st.cm = Math.min(60, cap);
      if (st.cg || st.cm) this.tk.danhNguoi(e.tkn, { v: 1 }, "", st);
    },
    // World.hit vào bot / người phe kia (dst.tkb / dst.tkn): máu bot ở máy chủ — gửi lên, máy mình giữ ≥ 1; người phe kia: đòn thường gửi thẳng
    tkHit(src, dst, dmg) {
      // số sát thương / "Né" chỉ hiện với đòn của mình (như client — thử 05/11: bot đánh bot hiện cả chồng số trên đầu, rối mắt)
      const minh = src === this.player;
      if (this.tk && (this.tkAnToan(dst, dst.tkPhe) || (minh && this.tkAnToan(this.player, this.tk.phe)))) return;
      if (minh && dst.unreachN) dst.unreachN = 0;
      if (dmg.miss) { if (minh) this.text(dst, "Né", "#cfd8dc"); return; }
      if (dmg.none || !(dmg.v > 0)) return;
      const T = this.tk, ref = src && src.tkRef != null ? src.tkRef : src === this.player ? "" : null;
      if (ref == null) return; // không rõ ai đánh (quái thường, phân thân): bỏ
      // đòn có quân NPC (trận thật — đánh quân / quân đánh): không nhân hệ số PK (máu / sát thương quân đã theo cấp như quân Phong Hỏa)
      dmg = dst.tkq || (src && src.tkq) || dmg.reflect ? { ...dmg } : nhanHs({ ...dmg }, T); // số phản đòn tính từ đòn đã nhân hệ số PK
      if (dst.tkn) { if (T && T.danhNguoi) T.danhNguoi(dst.tkn, dmg, ref, dmg.reflect ? { ph: 1 } : undefined); if (minh) this.text(dst, String(dmg.v), dmg.reflect ? "#ffa94d" : dmg.crit ? "#ffd54a" : "#ffffff", dmg.crit); return; }
      if (!dst.alive) return;
      if (minh) this.text(dst, String(dmg.v), dmg.reflect ? "#ffa94d" : dmg.poison ? "#8bff6a" : dmg.crit ? "#ffd54a" : "#ffffff", dmg.crit);
      if (dst.tkq && dst.binh === 5 && T && T.soaiNguy) T.soaiNguy[dst.tkPhe] = this.time; // Nguyên soái bị đánh: bot phe đó về giữ (tkDiNhom)
      dst.hp = Math.max(1, dst.hp - dmg.v);
      if (T && T.danhBot) T.danhBot(dst.tkb, dmg.v, ref);
      if (src === this.player) this.P.audio.missile(1, 1, 0.55);
    },
    // choáng / chậm mình vừa gây lên bot -> máy chủ trận (não bot ở đó) — tongkim.js gom gửi
    // choáng / chậm / hoảng loạn mình gây lên bot / quân phe kia -> chủ trận (máy chạy não — tongkim.js trangThai). Hoảng loạn (Thiên Nhẫn 120 — anh 13/11 "quái trong tống kim
    // vẫn di chuyển"): trước không gửi, quân / bot vẫn chạy ở máy chủ trận
    // hoảng loạn (723) trúng thêm 1 mục tiêu? missle_hitcount: mỗi đạn tối đa chừng ấy mục tiêu trúng (người + bot + quân); missle_missrate: % trượt (cấp 41–60 lúc chết: 0)
    tkHlLuot(m, A) {
      const nh = (A.missle_hitcount && A.missle_hitcount[0]) || 0; if (nh > 0 && (m.nHl || 0) >= nh) return false;
      if (Math.random() * 100 < ((A.missle_missrate && A.missle_missrate[0]) || 0)) return false;
      m.nHl = (m.nHl || 0) + 1; return true;
    },
    tkTT(e) {
      const T = this.tk; if (!T || T.chu || !T.ttBot) return;
      const t = this.time, cg = Math.max(0, (e.stunUntil || 0) - t), cm = Math.max(0, (e.slowUntil || 0) - t);
      const hl = Math.max(0, ...(e.curse || []).filter((c) => c.attrs && c.attrs.randmove && c.attrs.randmove[0] > 0).map((c) => c.until - t));
      if (cg > 0 || cm > 0 || hl > 0) T.ttBot(e.tkb, Math.round(cg * 1000), Math.round(cm * 1000), Math.round(hl * 1000));
    },
    // mục tiêu đạn (vocong.js vcDich) của đạn có tkA: phát lại chiêu phe kia -> chỉ mình; đạn bot (máy chủ trận) -> bot phe kia + mình (nếu khác phe);
    // đạn của mình -> bot + người phe kia (người: chỉ hình trúng — họ tự tính). Tính 1 lần / bước mỗi loại
    tkDich(A) {
      const T = this.tk; if (!T) return [];
      if (A.me) { const p = this.player; return p.hp > 0 && !this.tkAnToan(p, T.phe) ? [p] : []; }
      const k = A.ref && A.ref[0] === "#" ? "b" + A.phe : "n" + A.phe, C = T._dich || (T._dich = {});
      if (C.t !== this.time) { T._dich = { t: this.time }; }
      const D = T._dich; if (D[k]) return D[k];
      const L = [];
      for (const b of T.bots.values()) if (b.alive && b.tkPhe !== A.phe && !this.tkAnToan(b, b.tkPhe)) L.push(b);
      if (k[0] === "b") { const p = this.player; if (T.phe !== A.phe && p.hp > 0 && !this.tkAnToan(p, T.phe)) L.push(p); }
      else for (const n of T.nguoi.values()) if (n.alive && n.tkPhe !== A.phe && !this.tkAnToan(n, n.tkPhe)) L.push(n);
      if (T.binh && !T.hoa) for (const b of T.binh.values()) if (b.alive && b.tkPhe !== A.phe) L.push(b); // quân NPC phe kia (trận thật)
      return (D[k] = L);
    },
    // đòn của mình KHÔNG qua đạn tkA trúng người phe kia (vòng sáng đánh địch Vô Hình Độc, cú lướt — vocong.js misHit): máy mình tính sát thương theo
    // phòng thủ của họ (bản chụp), gửi thẳng ("tkn") kèm độc / chậm / choáng — soát 05/11: trước bỏ mất, độc dồn mãi trên bản chọn mục tiêu
    tkTrungNguoi(m, e) {
      const T = this.tk; if (!T || !e.alive || this.tkAnToan(e, e.tkPhe) || this.tkAnToan(this.player, T.phe)) return 0;
      const s = this.skDef(m.src.id); if (!s) return 0;
      const A = lvAttrs(s, m.src.lv), co = Object.keys(A).some((k) => DMG.test(k)), cap = (this.quaiVC && this.quaiVC.hieuUngToiDa) ?? 27, st = {};
      let r = co ? this.skDamage(s, A, m.src, e) : { v: 0, none: true };
      if (r.miss) { this.text(e, "Né", "#cfd8dc"); return 0; }
      r = nhanHs({ ...r }, T);
      if (A.stun_p && Math.random() * 100 < A.stun_p[0]) st.cg = Math.min(A.stun_p[1] || 9, cap);
      if (r.cold > 0 || (co && Object.entries(A).some(([k, v]) => /fastwalkrun_p/.test(k) && v[0] < 0))) st.cm = Math.min(60, cap); // bùa thuần giảm tốc (Ki Bán phù): không chậm 27 khung nữa — dòng bùa qua st.bua, máy họ giảm tốc chạy đúng % đủ thời gian (world.js bonus — anh 17/11)
      if (A.poisondamage_v) {
        // đủ số nhịp độc như đánh quái (anh 12/11: trước chỉ trong cap khung — 2 / 7 nhịp), dồn vào ≤ cap khung (máy chủ chặn khung ≤ ST_MAX)
        const po = this.poisonOf(s, A, m.src), res = this.khangDoc(e), f = Math.min(po.dur, DOC_MAX), ev = Math.max(1, po.every), n = Math.max(1, Math.floor(po.dur / ev + 0.5)), ks = this.serK(s, A, m.src, e);
        const tong = Math.round(((po.v * (100 - res)) / 100) * ks * n * heSo(T)); if (tong > 0) st.doc = [tong, f, ev]; // ks: khắc hệ như đòn đánh quái / bot (rà soát 12/11)
      }
      // bùa hại (chiêu không sát thương — Đoạn Cân Hủ Cốt, Vạn Độc Thực Tâm, Hấp Tinh Yểm_Quyết Chú…): máy họ gắn bùa theo dữ liệu chiêu (tkBuaMinh); mình gắn lên bản
      // chọn mục tiêu (pkHai biết đã dính, sát thương của mình tính theo kháng đã giảm)
      // bùa gắn trên bản chọn mục tiêu là TẠM 2,5 giây (rà soát 12/11): máy họ xác nhận qua nhịp (bc — buaTuXa kéo dài theo thời gian thật); bị bật lại / miễn / máy cũ thì tự hết
      // Thiên Nhẫn 120 -> 723 hoảng loạn lên người phe kia (anh 13/11): trước không gửi gì (randmove không phải dòng âm). Trượt theo missle_missrate của chiêu; máy chủ nhận
      // vì 723 do 715 sinh ra (may-chu/tong-kim.js BUA_GOC); máy họ: tkBuaMinh -> heroHoangLoan
      if (!co && A.randmove && A.randmove[0] > 0 && A.randmove[1] > 0) {
        if (!this.tkHlLuot(m, A)) return 0; // trượt / đạn đã đủ missle_hitcount mục tiêu (soát 13/11)
        st.bua = [m.src.id, m.src.lv]; this.text(e, "Hoảng loạn", "#e0a8ff");
      }
      if (!co) { const neg = buaAm(A); if (Object.keys(neg).length || A.poison2decmana_p) { st.bua = [m.src.id, m.src.lv]; if (Object.keys(neg).length) { const c = this.curseOn(e, m.src.id, m.src.lv, neg); if (c) c.until = Math.min(c.until, this.time + 2.5); } } }
      const v = r.none ? 0 : r.v | 0;
      if (v > 0) st.k = (s.phys ? 1 : 0) | (s.melee ? 2 : 0); // loại đòn cho phản đòn của máy họ (như tkTrungMinh trước: ngoại / nội, cận / xa)
      if (!(v > 0) && !st.doc && !st.bua && !st.cg && !st.cm) return 0; // bùa chỉ choáng / chậm (Khí Tâm phù…) vẫn gửi (rà soát 12/11)
      if (v > 0) this.text(e, String(v), r.crit ? "#ffd54a" : "#ffffff", r.crit);
      else if (st.doc) this.text(e, String(st.doc[0]), "#8bff6a"); // chỉ có độc (Vô Hình Độc, chiêu độc): tổng độc xanh — trước không hiện gì
      // anh 17/11 ("công bình tử k thấy đối phương có hiệu ứng trúng độc nhỉ. k biết khi nào trúng 12x của ngũ độc"): chỉ để HIỂN THỊ — đánh dấu trên bản chọn mục
      // tiêu (world.js nguoiTT: tô màu + "(Độc, Chậm, Choáng, Mất nội lực)" sau tên người đó); không đụng sát thương (máy họ tự tính độc / chậm)
      const hien = (k, giay) => { e[k] = Math.max(e[k] || 0, this.time + giay); };
      if (st.doc) hien("hienDoc", Math.max(Math.min(DOC_MAX, st.doc[1] * (1 - Math.max(-300, this.mobMod(e, "poisontimereduce_p")) / 100)), 54) * TICK); // bùa kéo dài độc đang gắn: máy họ cũng kéo dài (vocong.js heroDoc)
      if (st.cm) hien("hienCham", st.cm * TICK);
      if (st.cg) hien("hienChoang", st.cg * TICK);
      if (!co && A.poison2decmana_p) { hien("hienMatNoi", Math.max(1, A.poison2decmana_p[1] || 54) * TICK); this.text(e, String(s.n || "Hấp Tinh Yểm").split("_")[0].trim(), "#c58cff"); }
      if (T.danhNguoi) T.danhNguoi(e.tkn, { v, crit: r.crit }, "", Object.keys(st).length ? st : null);
      // chiêu 120 tự phát khi đòn có độc / lửa (Hấp Tinh Yểm — trước không bao giờ phát lên người trong Tống Kim)
      if (co && (A.poisondamage_v || A.firedamage_v || ((s.phys ? this.player.elem : this.player.elemMagic) || {}).fire > 0)) this.trigAuto("autoattackskill", e);
      return v;
    },
    // thực thể của người / bot theo mã đòn ("#mã" bot, tên người — bản chọn mục tiêu): chiêu 120 tự phát khi bị đánh (World.hit) nhắm vào đó
    tkThucThe(ref) { const T = this.tk; if (!T || ref == null || ref === "") return null; return ref[0] === "#" ? T.bots.get(+ref.slice(1)) || (T.binh && T.binh.get(+ref.slice(1))) || null : T.nguoi.get(ref) || null; },
    // đạn bám mục tiêu mất mục tiêu (vocong.js misStep): con gần nhất của phe kia trong R
    tkGanNhat(m, R0) {
      let best = null, bd = R0;
      for (const e of this.tkDich(m.src.tkA)) { if (!e.alive || e.an) continue; const k = ldist(m.x, m.y, e.x, e.y); if (k < bd) { bd = k; best = e; } }
      return best;
    },
    // mã đòn vị trí của động tác bot (tongkim.js gửi "tkh")
    tkMaDon(e) { return maDon(e.attack); },
  });
}
