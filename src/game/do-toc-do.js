// Đo tốc độ giết thật — công cụ cân bằng (anh 26/10: "cân bằng theo tốc độ giết thật, làm tới bản đồ cao nhất"; THIET-KE-S1.md mục 2).
// Dựng World ẩn ở 1 bãi với NHÂN VẬT MẪU (cấp, phái theo 1 lộ võ công phổ biến, điểm tiềm năng, điểm kỹ năng = cấp − 1, đồ xanh điển
// hình mọi ô), bật tự đánh như Trợ Thủ, tua logic từng STEP giây KHÔNG VẼ, không gửi gì lên máy chủ. Đếm quái / trùm giết, trọng thương,
// thuốc uống -> mỗi giờ; kinh nghiệm theo luật máy chủ (may-chu/do.js gietQuai: bảng client × hệ số, chênh cấp ±10), tiền ước theo
// cau-hinh.json (kỳ vọng, không gieo).
// Chạy trong trình duyệt khi đang ở trong game (P đã nạp đủ):
//   const T = await import("/src/game/do-toc-do.js"); await T.napDong();
//   const kq = await T.doBai(VL.P, zone, T.nhanVatMau(VL.P, "emei", 95), { phut: 10 });
import { World } from "./world.js";
import { GameMap } from "./map.js";
import { ItemDB, wear } from "./itemdb.js";
import { AUTO_DEF } from "./auto.js";
import { kindOf, eqtOk, isHeal } from "./vocong.js";

const STEP = 1 / 30;                     // như main.js simulate
const PHAT_CHET = 60;                    // giây mất mỗi lần trọng thương: về thành, dưỡng sức, quay lại bãi — TẠM
// Lộ võ công mẫu mỗi phái (lộ phổ biến): vk = vũ khí [loại món, kiểu] (items.json t / p), kieu = cách cộng điểm tiềm năng,
// chieu = chiêu đánh chính theo mốc [cấp học, mã] — chiêu mốc cao hơn thay chiêu thấp khi đủ cấp
export const LO = {
  shaolin: { vk: [0, 1], kieu: "ngoai", chieu: [[10, 10], [50, 19], [80, 321]] },           // đao: Kim Cang Phục Ma → Ma Ha Vô Lượng → Vô Tướng Trảm
  tianwang: { vk: [0, 3], kieu: "ngoai", chieu: [[10, 30], [30, 35], [60, 41], [80, 323]] }, // thương: Hồi Phong Lạc Nhạn → Dương Quan Tam Điệp → Huyết Chiến Bát Phương → Truy Tinh Trục Nguyệt
  tangmen: { vk: [1, 1], kieu: "xa", chieu: [[10, 45], [30, 50], [60, 249], [80, 339]] },    // phi đao: Tích Lịch Đơn → Truy Tâm Tiễn → Tiểu Lý Phi Đao → Nhiếp Hồn Nguyệt Ảnh
  wudu: { vk: [0, 1], kieu: "noi", chieu: [[10, 63], [30, 68], [60, 71], [80, 353]] },       // chưởng độc: Độc Sa → U Minh Khô Lâu → Thiên Cương Địa Sát → Âm Phong Thực Cốt
  emei: { vk: [0, 0], kieu: "noi", chieu: [[10, 80], [30, 82], [60, 91], [80, 380]] },       // chưởng: Phiêu Tuyết → Tứ Tượng Đồng Quy → Phật Quang Phổ Chiếu → Phong Sương Toái Ảnh
  cuiyan: { vk: [0, 1], kieu: "noi", chieu: [[10, 102], [30, 113], [60, 111], [80, 337]] },  // băng: Phong Quyển Tàn Tuyết → Phù Vân Tán Tuyết → Bích Hải Triều Sinh → Băng Tâm Tiên Tử
  gaibang: { vk: [0, 2], kieu: "noi", chieu: [[10, 122], [50, 128], [80, 357]] },            // chưởng: Kiến Nhân Thần Thủ → Kháng Long Hữu Hối → Phi Long Tại Thiên
  tianren: { vk: [0, 3], kieu: "noi", chieu: [[10, 145], [30, 138], [60, 148], [80, 362]] }, // ma: Đơn Chỉ Liệt Diệm → Thôi Sơn Điền Hải → Ma Diệm Thất Sát → Thiên Ngoại Lưu Tinh
  wudang: { vk: [0, 0], kieu: "noi", chieu: [[10, 153], [30, 164], [60, 165], [80, 365]] },  // khí: Nộ Lôi Chỉ → Bác Cấp Nhi Phục → Vô Ngã Vô Kiếm → Thiên Địa Vô Cực
  kunlun: { vk: [0, 0], kieu: "noi", chieu: [[10, 179], [30, 172], [60, 182], [80, 375]] },  // sét: Cuồng Lôi Chấn Địa → Thiên Tế Tấn Lôi → Ngũ Lôi Chánh Pháp → Lôi Động Cửu Thiên
};
// chia 5 điểm tiềm năng mỗi cấp (TẠM — kiểu cộng phổ biến): ngoại công cận chiến, ngoại công tầm xa (Thân pháp), nội công
const DIEM = { ngoai: { str: 0.45, dex: 0.25, vit: 0.3 }, xa: { dex: 0.5, str: 0.15, vit: 0.35 }, noi: { eng: 0.3, vit: 0.5, dex: 0.2 } };
// ô trang bị ngoài vũ khí: [loại món items.json, ô]
const O_DO = [[2, "Cloth"], [7, "Cap"], [5, "Shoes"], [6, "Sash"], [8, "Bangle"], [3, "Ring1"], [3, "Ring2"], [4, "Necklace"], [9, "Pendant"]];
const SO_DONG = 2;                       // đồ điển hình: 2 dòng xanh mỗi món (dòng 2 là dòng ẩn — có tác dụng khi được kích)
const CONG_DONG = 3;                     // cau-hinh.json capDong.cong: cấp dòng trong [1, cấp đồ + 3]
// thuốc tự uống theo cấp (Dược điếm Ba Lăng): [cấp từ, sinh lực, nội lực]
const THUOC = [[1, "potion:2", "potion:7"], [30, "potion:3", "potion:8"], [60, "potion:4", "potion:9"]];
const SL_UONG = 0.5, NL_UONG = 0.3;      // ngưỡng tự uống (Trợ Thủ mặc định)

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chonTrongSo = (w) => { let r = Math.random() * w.reduce((t, v) => t + v, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; };
const nhuong = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); }); // không bị hãm như setTimeout khi trang ẩn

let DX = null; // bảng dòng xanh client (assets/data/dong-xanh.json)
export async function napDong() { if (!DX) DX = await fetch("assets/data/dong-xanh.json").then((r) => r.json()); return DX; }
// gieo n dòng cho món loại t cấp đồ cl hệ s — như may-chu/do.js gieoDong
function gieoDong(t, cl, s, n) {
  const d = [], used = new Set(), top = Math.min(10, cl + CONG_DONG);
  for (let i = 0; i < n; i++) {
    const pre = i % 2 === 0 ? 1 : 0, M = ri(1, top), best = new Map();
    for (const r of DX.rows) {
      if (!(r.w[t] > 0) || r.pre !== pre || r.lv > M || used.has(r.a) || (!pre && r.se !== s)) continue;
      const c = best.get(r.a); if (!c || r.lv > c.lv) best.set(r.a, r);
    }
    const cands = [...best.values()]; if (!cands.length) break;
    const r = cands[chonTrongSo(cands.map((x) => x.w[t]))];
    used.add(r.a); d.push([r.k, ri(r.p[0][0], r.p[0][1])]);
  }
  return d;
}
// món nền cho nhân vật cấp L: món xanh loại t (kiểu p), yêu cầu cấp ≤ L, cấp đồ cao nhất mà quái tới cấp L rơi được (≤ ⌊L / 10⌋)
function chonNen(L, t, p) {
  const ok = ItemDB.pack.items.filter((x) => x.gr === "xanh" && x.t === t && (p == null || x.p === p) && (ItemDB.base(x.k).lv || 1) <= L);
  if (!ok.length) return null;
  const cap = Math.max(1, Math.min(10, Math.floor(L / 10))), cls = ok.map((x) => ItemDB.base(x.k).cl || 1).filter((c) => c <= cap);
  const cl = cls.length ? Math.max(...cls) : Math.min(...ok.map((x) => ItemDB.base(x.k).cl || 1));
  const L2 = ok.filter((x) => (ItemDB.base(x.k).cl || 1) === cl);
  return L2[Math.floor(Math.random() * L2.length)];
}
function mac(h, L, t, p) {
  const x = chonNen(L, t, p); if (!x) return;
  const slot = wear(h, x.k); if (!slot) return;
  const s = ri(0, 4);
  Object.assign(h.equip[slot], { u: ++h.uN, s, d: gieoDong(t, ItemDB.base(x.k).cl || 1, s, SO_DONG), m: L });
}

// Nhân vật mẫu phái fac (khóa skills.json factions) cấp L. Dưới cấp 10 (chưa nhập phái): không võ công, đánh đòn thường.
export function nhanVatMau(P, fac, L) {
  const F = P.factions.find((f) => f.key === fac), lo = LO[fac], series = F ? F.series : 0;
  const st = P.chr.start.find((s) => s.series === series && s.sex === 0) || P.chr.start[0];
  const h = { name: "Mẫu " + fac + " " + L, sex: "m", series, start: { ...st }, lvl: L, exp: 0, gold: 0, attr: { str: 0, dex: 0, vit: 0, eng: 0 },
    equip: {}, bag: [], looks: {}, uN: 0, skills: {}, oChieu: {}, books: [], auto: AUTO_DEF(), mau: { fac, L } };
  if (F && L >= 10) { h.fac = F.id ?? P.factions.indexOf(F); h.facKey = fac; }
  // điểm tiềm năng
  const tot = 5 * (L - 1), plan = DIEM[lo.kieu]; let used = 0;
  for (const [k, f] of Object.entries(plan)) { h.attr[k] = Math.floor(tot * f); used += h.attr[k]; }
  h.attr.vit += tot - used;
  // đồ: vũ khí đúng lộ + 9 ô
  mac(h, L, lo.vk[0], lo.vk[1]);
  for (const [t] of O_DO) mac(h, L, t, null); // nhẫn thứ 2: wear tự vào Ring2
  if (h.facKey) chiaDiem(P, h, fac, L);
  return h;
}

// điểm kỹ năng (cấp − 1): chiêu chính tối đa → chiêu hỗ trợ chiêu chính (addskilldamage) → bị động hợp vũ khí → 3 bùa lợi → vòng sáng →
// chiêu hồi máu → 1 bùa hại; mỗi chiêu tới cấp tối đa của nó
function chiaDiem(P, h, fac, L) {
  const db = P.skillDb, F = P.factions.find((f) => f.key === fac), lo = LO[fac], wk = vuKhi(h);
  const coThe = F.skills.filter((id) => db[id] && (db[id].req || 0) <= L && (db[id].req || 0) <= 120);
  let con = L - 1;
  const sk = h.skills, them = (id, cap = 20) => { if (!id || !db[id] || sk[id] || con <= 0) return; const n = Math.min(cap, db[id].max || 20, con); if (n > 0) { sk[id] = n; con -= n; } };
  const ch = [...lo.chieu].reverse().find(([r]) => r <= L), main = ch ? ch[1] : 0;
  them(main);
  const hoTro = coThe.filter((id) => Object.entries(db[id].lv || {}).some(([k, a]) => /^addskilldamage\d+$/.test(k) && a.some((p) => p && p[0] === main)));
  for (const id of hoTro) them(id);
  for (const id of coThe) if (kindOf(db[id], db) === "passive" && eqtOk(db[id], wk)) them(id);
  const bua = coThe.filter((id) => kindOf(db[id], db) === "buff" && !isHeal(db[id], 1) && eqtOk(db[id], wk)).slice(-3);
  for (const id of bua) them(id);
  const vong = coThe.filter((id) => kindOf(db[id], db) === "aura").pop();
  them(vong);
  const hoi = coThe.find((id) => kindOf(db[id], db) === "buff" && isHeal(db[id], 1));
  them(hoi);
  // bùa hại ra trước lên con mới nhắm (Trợ Thủ "Bùa hại trước"): chiêu bùa hại học được cao nhất
  const hai = coThe.filter((id) => kindOf(db[id], db) === "curse" && eqtOk(db[id], wk)).pop();
  them(hai);
  const A = h.auto.danh;
  A.chieu = main; A.bua = [0, 1, 2].map((i) => (bua[i] && sk[bua[i]] ? bua[i] : 0)); A.vong = vong && sk[vong] ? vong : 0; A.hai = [hai && sk[hai] ? hai : 0, 0, 0];
  A.hoi = hoi && sk[hoi] ? { on: 1, id: hoi, pct: 50 } : { on: 0, id: 0, pct: 50 };
  h.oChieu = { trai: main, phai: A.vong || 0 };
}
function vuKhi(h) {
  const w = h.equip && h.equip.Weapon, x = w && ItemDB.item(w.k);
  if (!x) return -1;
  if (x.t === 1) return 100 + (x.p | 0);
  return (x.p | 0) === 6 ? -1 : x.p | 0;
}

const IM = new Proxy({}, { get: () => () => null }); // âm thanh tắt
// Chạy bãi zone với nhân vật h trong `phut` phút game. heSo = hệ số kinh nghiệm (cau-hinh.json kinhNghiem), canBang = cau-hinh.json
// canBang (hệ số theo bãi + trùm — như máy chủ). Trả số mỗi giờ.
export async function doBai(P, zone, h, { phut = 10, heSo = 3.5, canBang = null, cfg = {}, noiCong = 0 } = {}) {
  const CB = (canBang && canBang.bai && canBang.bai[zone.id]) || {};
  await napDong();
  const T = { tiLeTien: 0.25, tienTB: 10, tienTrum: 50, roiThuong: 0.01, roiTrum: 0.2, giaBan: 20, dongThuong: 0.39, dongTrum: 1.6, ...cfg };
  const Ps = Object.create(P); Ps.audio = IM; Ps.npc = Object.create(P.npc); Ps.npc.ensure = () => {}; // không tải hình quái
  const map = await GameMap.load(P.maps, zone.map);
  const w = new World(Ps, map, zone, h, { npcs: [], vcOpen: true, canBang, noiCong }); // noiCong: luật riêng S1 Nội công (cau-hinh.json)
  w.auto = true; w.neo = [w.player.x, w.player.y];
  const L = h.lvl, need = P.chr.exp[L - 1] || Infinity, kq = { quai: 0, trum: 0, kn: 0, tien: 0, chet: 0, sl: 0, nl: 0, tienThuoc: 0, giay: 0 };
  w.onKill = (m) => {
    kq[m.boss ? "trum" : "quai"]++;
    const dl = m.lvl - L, k = dl <= -10 ? 0.5 : dl >= 10 ? 0.1 : 1;
    kq.kn += Math.floor((m.exp || 0) * k * heSo * (CB.kinhNghiem ?? 1)); // trùm: m.exp đã nhân hệ số trùm (World.spawnMob)
    kq.tien += m.boss ? m.lvl * T.tienTrum * (CB.tien ?? 1) + T.roiTrum * T.giaBan * m.lvl * (1 + 2 * T.dongTrum)
      : T.tiLeTien * m.lvl * T.tienTB * (CB.tien ?? 1) + T.roiThuong * T.giaBan * m.lvl * (1 + 2 * T.dongThuong);
  };
  let chet = false;
  w.onRevive = () => { chet = true; };
  const th = (THUOC.filter(([c]) => L >= c).pop() || THUOC[0]), xSL = ItemDB.item(th[1]), xNL = ItemDB.item(th[2]);
  const end = phut * 60, p = w.player;
  let t = 0;
  while (t < end) {
    for (let i = 0; i < 1800 && t < end; i++) {
      w.update(STEP); t += STEP;
      if (chet) {
        chet = false; kq.chet++; t += PHAT_CHET;
        kq.kn -= Math.min(500000, Math.floor((need * 10) / 1000));
        const s = map.randomSpot(Math.random); if (s) [p.x, p.y] = s;
        p.hp = p.hpMax; p.mp = p.mpMax; p.deadT = 0; p.reviving = false; p.target = null; p.path = null; p.cast = null; w.setAct(p, "stand");
        w.neo = [p.x, p.y];
        for (const m of w.mobs) { m.aggro = false; m.target = null; }
      }
      if (p.hp > 0 && !p.potHp && p.hp < p.hpMax * SL_UONG && xSL && w.drink(xSL)) { kq.sl++; kq.tienThuoc += xSL.gia || 0; }
      if (p.hp > 0 && !p.potMp && p.mp < p.mpMax * NL_UONG && xNL && w.drink(xNL)) { kq.nl++; kq.tienThuoc += xNL.gia || 0; }
    }
    await nhuong();
  }
  kq.giay = t;
  const g = 3600 / t, r = (v) => Math.round(v * g);
  return {
    bai: zone.n, lo: zone.lo, hi: zone.hi, fac: h.mau && h.mau.fac, cap: L,
    quaiGio: r(kq.quai + kq.trum), trumGio: r(kq.trum), chetGio: +(kq.chet * g).toFixed(2), knGio: r(kq.kn), tienGio: r(kq.tien),
    thuocGio: r(kq.sl + kq.nl), tienThuocGio: r(kq.tienThuoc), mau: p.hpMax, dmg: p.dmg, chieu: h.auto.danh.chieu, kyNang: { ...h.skills },
    // độ bền (26/10): số lần ra đòn / bị đánh trúng mất máu / sang vùng bản đồ khác mỗi giờ (World.hao — may-chu/do.js hao)
    danhGio: r(w.hao[0]), trungGio: r(w.hao[1]), vungGio: r(w.hao[2]),
    // luyện kỹ năng (29/10): số lần chiêu luyện trúng quái mỗi giờ (World.luyenDem — vocong.js misHit)
    luyenGio: Object.fromEntries([...(w.luyenDem || new Map())].map(([id, n]) => [id, r(n)])),
  };
}

// Đo cả loạt: mỗi bãi chính (bai = danh sách mã bãi: cả bãi phụ), nhân vật cấp giữa bãi (cấp thấp nhất + 5) của 10 phái -> trung vị mỗi
// bãi. onTien(số lượt xong)
export async function doCacBai(P, { phut = 15, heSo = 3.5, canBang = null, bai = null, onTien = null } = {}) {
  await napDong();
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const zones = P.maps.zones.filter((z) => (bai ? bai.includes(z.id) : z.kind === "chính")).sort((a, b) => a.lo - b.lo), out = [];
  let n = 0;
  for (const z of zones) {
    const L = Math.min(200, z.lo + 5), rs = [];
    for (const f of L < 10 ? ["shaolin"] : Object.keys(LO)) { rs.push(await doBai(P, z, nhanVatMau(P, f, L), { phut, heSo, canBang })); if (onTien) onTien(++n); }
    const k = (key) => med(rs.map((r) => r[key]));
    out.push({ id: z.id, bai: z.n, cap: L, lo: z.lo, hi: z.hi, quaiGio: k("quaiGio"), quaiMin: Math.min(...rs.map((r) => r.quaiGio)), quaiMax: Math.max(...rs.map((r) => r.quaiGio)),
      chetGio: k("chetGio"), knGio: k("knGio"), tienGio: k("tienGio"), tienThuocGio: k("tienThuocGio"), phai: Object.fromEntries(rs.map((r) => [r.fac, r.quaiGio])) });
  }
  return out;
}
