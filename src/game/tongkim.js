// Tống Kim — điều phối phía trình duyệt (anh 05/11, đợt 1 "bãi thử" chỉ quản trị mở: THIET-KE-TONG-KIM.md). Máy chủ: may-chu/tong-kim.js (phòng trong
// bộ nhớ, máu bot, điểm, chủ trận); bot + đòn PK: src/game/tkbot.js (World.tk = this.st khi mình ở trong trận).
//   - Quản trị mở phòng ở 1 bãi (công cụ thử → Tống Kim): máy chủ báo "tkMo" -> ai đang / vừa vào bãi đó gửi "tkVao" (máy chủ chia phe: lệch tối đa
//     1 người thật — anh 05/11), quái thường của bãi bỏ, không sinh thêm (World.suKien), phân thân không theo.
//   - Trạng thái "tk" (≤ 10 lần / giây): phe mình, chủ trận, doanh 2 phe, danh sách bot (dựng tất định — tkbot.js heroBot), máu bot, điểm, người
//     trong trận + bản chụp nhân vật của họ (chỉ số để tính chiêu họ phát lại trúng mình).
//   - Bot phe kia vào World.mobs (đánh được như quái), phe mình vào World.dongMinh; người phe kia có 1 "bản chọn mục tiêu" (kind mob, tkn) trong
//     World.mobs theo chỗ của họ (others) — bấm / Trợ Thủ / chiêu nhắm được, sát thương chiêu do máy họ tính (phát lại "tkc").
//   - Máy chủ trận (chu): chạy não bot, gửi vị trí bot "tkh" 10 lần / giây, chiêu bot "tkc", bot đánh bot "tkd", hồi máu bot "tkHoi", máu tối đa bot
//     vừa dựng "tkMau". Máy khác: vẽ bot theo "tkh", phát lại chiêu "tkc" (phe kia: đạn chỉ trúng mình), gửi sát thương mình gây cho bot "tkd",
//     choáng / chậm mình gây "tkd.st" (máy chủ chuyển cho chủ trận).
//   - Mình trọng thương: báo "tkChet" (người / bot vừa đánh mình — World.tkDon) -> máy chủ cộng điểm người kết liễu; 8 giây sau đứng dậy ở doanh
//     phe mình, không mất gì (thiết kế mục 3).
//   TongKim.api (main.js): { msg(t, mau), ten() tên nhân vật, o() ô nhân vật, dt() điện thoại, fps(), duoiMM(), taiLai() tải lại bãi đang đứng,
//     qt() quản trị, veBienKinh(câu) về Biện Kinh (hết trận / chưa báo danh / rời chiến trường) }
// ĐỢT 2 (anh 06/11 — đặc tả scratchpad tk2/dac-ta-dot2.md mục 3): TRẬN THẬT theo lịch ở chiến trường 380 Xung phong — anh 06/11 chọn (bai của
// tong-kim.json; map.json zone kind "tongkim"; phòng loai "tran"
// — bãi thử loai "thu" giữ nguyên như trên):
//   - dữ liệu assets/data/tong-kim.json (napDuLieu — tải khi cần, thiếu thì thử lại sau): hậu doanh 2 phe (khu an toàn = các hình chữ nhật hau.vung, điểm
//     hồi sinh hau.diem, Quân y, rương), bẫy cổng hậu doanh (ra.bay -> 1 điểm ra.toi ở đại doanh), bẫy đại doanh -> hậu doanh (ve.bay -> ve.toi), cổng
//     đại doanh (cong.bay — lúc báo danh đẩy về cong.lui), điểm quân đại doanh (dai) / dã ngoại (dong), chỗ Nguyên soái (soai); Biện Kinh: chỗ về (bienKinh.ra)
//   - pha (trạng thái máy chủ p.pha): "bd" báo danh — không ai đánh được ai (World.tkAnToan: T.hoa), cổng đại doanh đẩy về; "danh" — như bãi thử; "xong" —
//     Chiến báo kết quả (src/game/tkchienbao.js của gói giao diện: ChienBao.ketQua(ket) — có thì gọi), raSau giây sau tự về Biện Kinh
//   - bẫy: mình giẫm lên điểm bẫy của phe mình (≤ bayR logic) thì dịch chuyển (đặt chỗ + bỏ đường, không tải lại bãi); bot dùng bẫy ở máy chủ trận (tkbot.js)
//   - quân NPC 6 bậc + Nguyên soái (dòng "bi" khi mình chậm phiên bản bsv): dựng như quân Phong Hỏa (kind mob, tkb = mã ≥ 100000, tkq, binh = bậc, tkPhe;
//     hình / chỉ số mẫu 631–642 của monsters.json, máu + sát thương + chính xác + né tránh theo dòng máy chủ), phe kia vào World.mobs, phe mình vào
//     World.dongMinh; máy chủ trận chạy não quân (tkbot.js tkNaoBinh), máy khác vẽ theo "tkh" như bot (world.js _mocBot)
//   - máu bot + quân: "hp" (đủ cả danh sách, ≤ 1 lần / giây) | "hd" (chỉ dòng đổi) — cùng dạng [mã, máu, máu tối đa, chết, lần hồi sinh]
//   - chức trong trận cộng sinh lực % / kháng tất cả % (World.bonus — trạng thái 661 của client), buff Chiến cổ / Lệnh Bài cho người cùng phe đứng gần (tkDoi
//     của máy chủ -> "tkBuff"), Càn Khôn Tạo Hóa Đan hồi sinh lực + nội lực theo nhịp (tkHoi) — chỉ trong trận
//   - hết trận / không có tên trong trận / phòng đóng mà còn đứng ở chiến trường: về Biện Kinh (api.veBienKinh)
import { Net } from "./net.js";
import { ldist } from "./map.js";
import { napDong } from "./do-toc-do.js";
import { kindOf, isHeal } from "./vocong.js";
import { CHUC_TK, KHANG_5 } from "./tkbot.js";
import { khangThat } from "./rules.js";

const GUI_MS = 80, VT_MS = 100, DU_MS = 1000, SONG_MS = 2000, HOI_SINH = 8, XA = 1200, DUNG_MOI = 3, NHOM = 4;
const DON_MS = 30; // chủ trận báo bot vừa vung đòn cách nhau ≥ 30 ms (ngoài nhịp 100 ms — guiViTri don)
const PHE = ["Tống", "Kim"], MAU = ["#ffa85e", "#ff92ff"], CHUC = ["Binh sĩ", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng"];
const LS_MOC = [[2, "Song sát"], [3, "Tam sát"], [4, "Tứ sát"], [5, "Ngũ sát"], [8, "Đại sát tứ phương"], [12, "Thiên hạ vô địch"], [20, "Độc Cô Cầu Bại"]]; // mốc liên sát: [mạng, tên]
const chia = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const so = (v) => Math.round(+v || 0);
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
// ---------- trận thật (đợt 2) ----------
// chiến trường Tống Kim (map.json zone kind "tongkim"): bai của assets/data/tong-kim.json (napDuLieu đặt lại), chưa tải thì 380 (bản đồ client 380
// Xung phong — anh 06/11 chọn)
export let TK_BAI = 380;
const RA_SAU = 30;             // xong trận bao nhiêu giây thì tự về Biện Kinh (máy chủ gửi ra / raSau thì theo đó — anh 06/11: 30 giây)
const KHONG_TT = 15000;        // đứng ở chiến trường mà chưa vào phòng chừng này (ms — chưa báo danh / trận đã hết, máy chủ không trả trạng thái): về Biện Kinh
const KHANG_BINH = 50;         // kháng của quân NPC tối đa (như quân Phong Hỏa — phonghoa.js khang)
// Chiến cổ / Lệnh Bài: người cùng phe đứng trong chừng này (ldist — điểm bản đồ web, trục dọc × 2) quanh người dùng thì nhận buff: bán kính chiêu client 400
// × 0,75 (như World.buaDoi — đặc tả ghi 600; soát đầu-cuối 06/11 lấy 400 của client)
const BUFF_R = 400 * 0.75;
const BUFF_TEN = { tkChienCo: "Chiến cổ", tkLenhBai: "Lệnh Bài" };
const SCALE = 0.75;            // đơn vị client -> bản đồ web
// quân NPC theo bậc (0 binh … 5 Nguyên soái — npcs.txt 631–636 Tống, 637–642 Kim): tên, hình (khi monsters.json chưa có mẫu), tầm nhìn (client VisionRadius
// 400, Đại tướng 800, Nguyên soái 1800), tầm đánh tối thiểu (quân hạng cao ra chiêu xa ở client — game đánh thường, như phonghoa.js TAM_DANH), tầm hoạt
// động 700, Nguyên soái chỉ rời chỗ đứng 200 (đặc tả đợt 2 mục 3) — đơn vị client
const BINH_TEN = [["Tống binh", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng", "Nguyên Soái"], ["Kim binh", "Hiệu úy", "Thống lĩnh", "Phó tướng", "Đại tướng", "Nguyên Soái"]];
const BINH_HINH = [["enemy034", "enemy029", "enemy026", "enemy021", "enemy017", "enemy004"], ["enemy028", "enemy031", "enemy036", "enemy024", "enemy023", "enemy006"]];
const VO_LE = 150; // ra ngoài vùng đại doanh quá chừng này (logic) lúc báo danh thì kéo về — chừa chỗ cho góc doanh nằm ngoài bao lồi các điểm (bay — anh 12/11)
const BINH_NHIN = [400, 400, 400, 400, 800, 1800], BINH_TAM = [0, 0, 0, 120, 160, 330], BINH_HD = 700, SOAI_GIU = 200;
// tên Nguyên soái như boss thế giới (anh 06/11 "máu nguyên soái để = máu boss thế giới, form tên và màu cũng vậy"): tenBtg — world.js drawMobLabel vẽ như
// nhánh m.btg (tiền tố vàng "Boss Hoàng Kim - " + tên đỏ — không gắn m.btg: cờ đó là boss thế giới máu chung ở mọi chỗ khác); mauTen = màu tên đỏ của boss
// thế giới (world.js BTG_MAU) cho lúc vẽ 1 màu
const SOAI_MAU = "#ff3e3e";
const CHUC_TXT = (c, H) => { const v = H && Array.isArray(H[0]) ? [+H[0][c] || 0, +(H[1] || [])[c] || 0] : CHUC_TK[c] || [0, 0]; return `sinh lực +${v[0]}%${v[1] ? `, kháng tất cả +${v[1]}%` : ""}`; };

// zone là chiến trường Tống Kim
export const laZoneTk = (z) => !!z && (z.kind === "tongkim" || z.id === TK_BAI);
// (x, y) nằm trong 1 hình chữ nhật [x0, y0, x1, y1] của ds
export function trongVung(ds, x, y) {
  if (!Array.isArray(ds)) return false;
  for (const r of ds) if (r && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) return true;
  return false;
}
// điểm bẫy của ds gần (x, y) nhất trong R (logic — ldist) -> chỉ số | -1
export function bayCham(ds, x, y, R) {
  let k = -1, bd = R;
  for (let i = 0; i < (ds ? ds.length : 0); i++) { const d = ldist(x, y, ds[i][0], ds[i][1]); if (d <= bd) { bd = d; k = i; } }
  return k;
}
// đoạn (x0, y0)→(x1, y1) đi qua trong R (logic — trục dọc × 2) của 1 điểm của ds: bước dài (chạy ngựa, máy giật FPS thấp) nhảy qua dải bẫy cổng vẫn bắt
// (anh 12/11 "chưa khai chiến nhưng có thể bay ra ngoài")
export function doanCham(ds, x0, y0, x1, y1, R) {
  const ax = x0, ay = y0 * 2, dx = x1 - x0, dy = (y1 - y0) * 2, L2 = dx * dx + dy * dy;
  for (const p of ds || []) {
    const px = p[0], py = p[1] * 2, k = L2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
    if (Math.hypot(ax + k * dx - px, ay + k * dy - py) <= R) return true;
  }
  return false;
}
// bao lồi (chuỗi đơn điệu) của các điểm [x, y] -> đa giác ngược chiều kim đồng hồ | []
export function baoLoi(ds) {
  const P = [...(ds || [])].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  if (P.length < 3) return [];
  const duoi = [], tren = [];
  for (const p of P) { while (duoi.length >= 2 && cr(duoi[duoi.length - 2], duoi[duoi.length - 1], p) <= 0) duoi.pop(); duoi.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (tren.length >= 2 && cr(tren[tren.length - 2], tren[tren.length - 1], p) <= 0) tren.pop(); tren.push(p); }
  return duoi.slice(0, -1).concat(tren.slice(0, -1));
}
// (x, y) trong đa giác lồi vo, hoặc ngoài nhưng cách cạnh gần nhất ≤ le (logic — trục dọc × 2)
export function trongVo(vo, x, y, le = 0) {
  if (!vo || vo.length < 3) return true;
  let trong = true, gan = Infinity;
  for (let i = 0; i < vo.length; i++) {
    const a = vo[i], b = vo[(i + 1) % vo.length];
    if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < 0) trong = false;
    const ax = a[0], ay = a[1] * 2, dx = b[0] - ax, dy = b[1] * 2 - ay, L2 = dx * dx + dy * dy, k = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y * 2 - ay) * dy) / L2)) : 0;
    gan = Math.min(gan, Math.hypot(ax + k * dx - x, ay + k * dy - y * 2));
  }
  return trong || gan <= le;
}
// điểm của ds gần (x, y) nhất | null; 1 điểm ngẫu nhiên | null
export function ganNhat(ds, x, y) { let b = null, bd = Infinity; for (const p of ds || []) { const d = ldist(x, y, p[0], p[1]); if (d < bd) { bd = d; b = p; } } return b; }
export const chonNgau = (ds) => (Array.isArray(ds) && ds.length ? ds[Math.floor(Math.random() * ds.length)] : null);
const trungBinh = (ds) => (ds.length ? [ds.reduce((t, p) => t + p[0], 0) / ds.length, ds.reduce((t, p) => t + p[1], 0) / ds.length] : null);
// tong-kim.json -> dữ liệu dùng được (điểm [x, y] số hữu hạn, hình chữ nhật 4 số đã sắp, thiếu thì mảng rỗng; khung bao hậu doanh để xét nhanh) | null
export function chuanDuLieu(j) {
  if (!j || !Array.isArray(j.phe) || j.phe.length < 2) return null;
  const diem = (p) => (Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1]) ? [+p[0], +p[1]] : null);
  const ds = (a) => (Array.isArray(a) ? a.map(diem).filter(Boolean) : []);
  const hcn = (a) => (Array.isArray(a) ? a.filter((r) => Array.isArray(r) && r.length >= 4 && r.slice(0, 4).every((v) => Number.isFinite(+v)))
    .map((r) => { const [a0, b0, a1, b1] = r.map(Number); return [Math.min(a0, a1), Math.min(b0, b1), Math.max(a0, a1), Math.max(b0, b1)]; }) : []);
  const phe = j.phe.slice(0, 2).map((P0, i) => {
    const P = P0 || {}, H = P.hau || {}, ra = P.ra || {}, ve = P.ve || {}, cong = P.cong || {}, dai = P.dai || {};
    const o = { ten: typeof P.ten === "string" && P.ten ? P.ten : PHE[i], hau: { diem: ds(H.diem), quanY: diem(H.quanY), ruong: diem(H.ruong), vung: hcn(H.vung), bao: null },
      ra: { bay: ds(ra.bay), toi: ds(ra.toi) }, ve: { bay: ds(ve.bay), toi: ds(ve.toi) }, cong: { bay: ds(cong.bay), lui: ds(cong.lui) },
      dai: { tam: diem(dai.tam), diem: ds(dai.diem) }, dong: ds(P.dong), soai: diem(P.soai) };
    if (o.hau.vung.length) o.hau.bao = [Math.min(...o.hau.vung.map((r) => r[0])), Math.min(...o.hau.vung.map((r) => r[1])), Math.max(...o.hau.vung.map((r) => r[2])), Math.max(...o.hau.vung.map((r) => r[3]))];
    if (!o.dai.tam) o.dai.tam = trungBinh(o.dai.diem) || o.soai || o.hau.diem[0] || null;
    // vùng đại doanh (anh 12/11 — "chưa khai chiến nhưng có thể bay ra ngoài"): bao lồi của các điểm trong / trên rào đại doanh (cổng, chỗ đẩy về, quân, chỗ ra từ hậu doanh,
    // bẫy về hậu doanh) — lúc báo danh ra ngoài vùng này (+ VO_LE) thì kéo về (bay)
    o.dai.vo = baoLoi([...o.cong.bay, ...o.cong.lui, ...o.dai.diem, ...o.ra.toi, ...o.ve.bay]);
    if (!o.ve.toi.length) o.ve.toi = o.hau.diem.slice();
    return o;
  });
  const bk = j.bienKinh || {};
  return { bai: +j.bai || TK_BAI, phe, bayR: +j.bayR > 0 ? +j.bayR : 24, binh: j.binh && typeof j.binh === "object" ? j.binh : null, bienKinh: { ra: diem(bk.ra) } };
}

export const TongKim = {
  api: null, mo: null, w: null, st: null, p: null, DX: null, dangNap: false,
  rows: new Map(), cho: [], snap: new Map(), pheNguoi: new Map(), snKey: "",
  gui: { d: [], st: [], h: [], c: [], mau: [] }, guiLuc: 0, vtLuc: 0, duLuc: 0, songLuc: 0, hoiSinhLuc: 0, kk: [], tinLuc: 0, el: null, mmY: 0, mmLuc: 0,
  // trận thật (đợt 2): dữ liệu tong-kim.json (D), lệch giờ máy chủ (lech), buff Chiến cổ / Lệnh Bài (mã -> hết lúc, giờ máy — World.tkBuffs), hồi theo nhịp
  // Càn Khôn (hot), module Chiến báo (CB — tkchienbao.js), kết quả đã báo (kqKhoa), lúc tự về Biện Kinh (raLuc), bẫy (bayKhoa / bayTrong), World đã cho về
  // Biện Kinh (veW)
  D: null, _dP: null, _dLoi: 0, lech: 0, buffs: new Map(), hot: null, CB: null, _cbP: null, _cbLoi: 0, _cbCho: null, kqKhoa: null, raLuc: 0, daRa: false, raKhoa: 0, _raBao: 0,
  bayKhoa: 0, bayTrong: false, veW: null,

  laTo() { return !!(this.mo && this.w && this.st && this.w.zone.id === this.mo.bai); },
  // trận thật (chiến trường TK_BAI — loai "tran") | bãi thử ("thu")
  laTran() { return !!(this.st && this.st.tran); },
  // phòng đang mở có cho mình vào ở World w không: đúng bãi; trận thật: máy chủ xét danh sách báo danh (tkVao); bãi thử: đúng bản quái (riêng / chung)
  // người mở, người thường chỉ khi quản trị mở cho mọi người (moi)
  duocVao(w) {
    const m = this.mo; if (!m || !w || w.zone.id !== m.bai) return false;
    if (m.loai === "tran") return true;
    return !!w.chung === !!m.chung && (m.moi || this.api.qt());
  },
  laChu() { return !!(this.laTo() && this.st.chu); },
  gioSv() { return Date.now() + this.lech; },
  // dữ liệu trận (assets/data/tong-kim.json — gói bản đồ dựng): tải 1 lần khi cần; chưa có / lỗi thì 30 giây sau mới thử lại -> Promise<D | null>
  napDuLieu() {
    if (this.D) return Promise.resolve(this.D);
    if (this._dP) return this._dP;
    if (performance.now() < this._dLoi) return Promise.resolve(null);
    return (this._dP = fetch("assets/data/tong-kim.json").then((r) => (r.ok ? r.json() : null))
      .then((j) => { try { return chuanDuLieu(j); } catch (e) { console.warn("Tống Kim — tong-kim.json:", e); return null; } }, () => null)
      .then((D) => {
        this._dP = null;
        if (!D) { this._dLoi = performance.now() + 30000; return null; }
        this.D = D; TK_BAI = D.bai; if (this.st) this.st.D = D;
        return D;
      }));
  },
  // (x, y) trong hậu doanh phe (hình chữ nhật hau.vung — gói bản đồ dựng từ ô đi được quanh điểm hồi sinh; thiếu thì cách điểm hồi sinh ≤ 350)
  // trong doanh trại phe mình: hậu doanh hoặc vùng đại doanh (dai.vo + VO_LE — chuanDuLieu); thiếu dữ liệu vùng thì coi như trong
  trongDoanh(phe, x, y) {
    const D = this.D, P = D && D.phe[phe ? 1 : 0]; if (!P) return true;
    return this.trongHau(phe, x, y) || trongVo(P.dai.vo, x, y, VO_LE);
  },
  trongHau(phe, x, y) {
    const D = this.D, P = D && D.phe[phe ? 1 : 0]; if (!P) return false;
    const H = P.hau;
    if (H.vung.length) { const b = H.bao; if (b && (x < b[0] || x > b[2] || y < b[1] || y > b[3])) return false; return trongVung(H.vung, x, y); }
    for (const c of H.diem) if (ldist(x, y, c[0], c[1]) <= 350) return true;
    return false;
  },
  // ---------- phòng mở / đóng, vào / rời ----------
  // "tkMo" { bai, mo, loai? }: phòng mở ở bãi bai (mình đang ở đó thì vào) / đóng. Bãi thử đóng: bỏ hết, tải lại bãi cho quái thường về. Trận thật đóng
  // (hoặc không có trận) mà mình còn đứng ở chiến trường: về Biện Kinh (đăng nhập vào chỗ lưu ở chiến trường lúc không còn trận — đặc tả đợt 2)
  moPhong(m) {
    if (!m || !m.mo) {
      const co = !!this.st, w = this.w; this.mo = null; this.roi();
      if (w && laZoneTk(w.zone)) return this.veBienKinh("Trận Tống Kim đã kết thúc — mời về Biện Kinh.");
      if (co && this.api && this.api.taiLai) this.api.taiLai();
      return;
    }
    const bai = m.bai | 0;
    this.mo = { bai, moi: m.moi ? 1 : 0, chung: m.chung ? 1 : 0, loai: m.loai === "tran" || bai === TK_BAI ? "tran" : "thu" };
    if (this.mo.loai === "tran") this.napDuLieu();
    // trận thật: máy chủ không nhận mình (chưa báo danh trận này / khác nhân vật / trận đã xong mà chưa từng vào — tkVao trả "tkMo" kèm khong)
    if (m.khong && this.w && this.w.zone.id === bai) { this.roi(); return this.veBienKinh("Ngươi chưa báo danh trận Tống Kim này — mời về Biện Kinh (báo danh ở Mộ binh quan)"); }
    if (this.st && !this.duocVao(this.w)) { // phòng mở lại ở bãi khác / không cho mình
      this.roi();
      if (this.w && laZoneTk(this.w.zone)) return this.veBienKinh("Trận Tống Kim đã kết thúc — mời về Biện Kinh.");
      if (this.api.taiLai) this.api.taiLai();
      return;
    }
    // "tkMo" tới lúc nối lại kênh / vào bãi: đã trong trận thì xin vào lại luôn (soát 05/11: kết nối mới không có tkVao — rơi khỏi phòng)
    if (this.duocVao(this.w)) { if (!this.st) this.vao(this.w); else { this.p = null; this.xinVao(); } }
  },
  // về Biện Kinh (api.veBienKinh — main.js) 1 lần mỗi World: hết trận, không có tên trong trận, phòng đóng, rời chiến trường ở Quân y
  veBienKinh(cau) {
    const w = this.w; if (!w || this.veW === w || !this.api || !this.api.veBienKinh) return;
    this.veW = w; this.api.veBienKinh(cau);
  },
  // main.js loadZone: mỗi World mới. Chiến trường: tải dữ liệu, đếm giờ chờ trạng thái (tick — không vào được phòng thì về Biện Kinh)
  ganWorld(w) {
    if (this.w && this.w !== w) this.roi();
    this.w = w;
    if (w && laZoneTk(w.zone)) { this.napDuLieu(); this.vaoLuc0 = performance.now(); }
    if (this.duocVao(w)) this.vao(w);
  },
  vao(w) {
    const tran = !!(this.mo && this.mo.loai === "tran");
    // trận thật thêm: binh (quân NPC — mã -> thực thể), pha (bd báo danh / danh / xong), hoa = không ai đánh được ai (báo danh, đã xong — tkbot.js
    // tkAnToan), chức của mình (World.bonus), phe hạ Nguyên soái trước, lúc Nguyên soái 2 phe vừa bị đánh (World.time — bot về giữ soái), dữ liệu trận,
    // hau(phe, x, y) = điểm trong hậu doanh phe đó
    const st = { phe: 0, chu: false, trai: null, R: 220, tri: 3, bots: new Map(), binh: new Map(), nguoi: new Map(), nhom: new Map(),
      tran, pha: "", hoa: tran, chuc: 0, thang: null, soaiNguy: [-99, -99], D: this.D, hau: (phe, x, y) => this.trongHau(phe, x, y), lan: 0, // trận thật: chưa có trạng thái = chưa ai đánh ai
      // chiêu bot (chủ trận): chỉ gửi con ở gần người thật khác (≤ XA + 200 — người ở xa không vẽ, không bị trúng) — đỡ mạng + hạn mức tkc máy chủ
      guiChieu: (src, sk, lv, x, y, px, py, tgt) => { if (src && !this.ganNguoi(x, y)) return; this.gui.c.push([src, sk, lv, so(x), so(y), so(px), so(py), tgt || "", src ? 0 : 1]); }, // cờ pv (anh 12/11): chiêu của mình, máy mình tự tính trúng người
      danhBot: (id, v, ref) => this.gui.d.push([id, so(v), ref || ""]),
      hoiBot: (id, v) => this.gui.h.push([id, so(v)]),
      ttBot: (id, cg, cm, hl) => this.gui.st.push(hl > 0 ? [id, cg, cm, hl] : [id, cg, cm]),
      danhNguoi: (ten, d, ref, st) => Net.wsGui({ t: "tkn", ai: ten, v: so(d.v), crit: d.crit ? 1 : 0, ...(st ? { st } : d.cold > 0 ? { st: { cm: 27 } } : {}), src: ref || "" }),
      hoiNguoi: (ten, id, lv, bot) => Net.wsGui({ t: "tkHoiNg", b: "#" + bot, ai: ten, id, lv }) }; // chủ trận: bot hồi máu người cùng phe máy khác
    this.st = st; this.p = null; this.vaoLuc0 = performance.now(); this.tinLuc = 0; this.rows = new Map(); this.cho = []; this.snap = new Map(); this.pheNguoi = new Map(); this.snKey = ""; this.hoiSinhLuc = 0; this.kk = [];
    this.kqKhoa = null; this.raLuc = 0; this.daRa = false; this.raKhoa = 0; this.bayKhoa = 0; this.bayTrong = false; this.hot = null; this.buffs.clear(); this._cbCho = null; this.tinDa = 0;
    w.tk = st; w.tkBuffs = this.buffs; w.suKien = true; w.phanThan = [];
    w.mobs = w.mobs.filter((m) => m.tkb || m.tkn); // quái thường của bãi bỏ (bãi thử)
    if (!this.DX && !this.dangNap) { this.dangNap = true; napDong().then((DX) => { this.DX = DX; }, () => { this.dangNap = false; }); }
    w.refreshStats(false); // trạng thái vật phẩm Tống Kim / chức trong trận có tác dụng từ giờ (World.bonus)
    if (tran) { this.napDuLieu(); this.napCB(); } // vào trận thật: máy chủ cho rời tổ đội (may-chu/tong-kim.js tkVao)
    this.xinVao();
    this.api.msg(tran ? "Chiến trường Tống Kim — đang vào trận…" : "Bãi thử Tống Kim — đang vào trận…", "#ffd54a");
  },
  // "tkVao": gửi lúc vào bãi; kênh tức thời chưa mở / chưa có trạng thái thì tick gửi lại mỗi 2 giây
  xinVao() { this.vaoLuc = performance.now(); Net.wsGui({ t: "tkVao", o: this.api.o(), dt: this.api.dt() ? 1 : 0 }); },
  roi() {
    const w = this.w, co = !!this.st;
    if (w && w.tk === this.st) { // chỉ dọn World.tk của Tống Kim — sân lôi đài (loidai.js) gắn st riêng, "tkMo" mo 0 mỗi lần đổi vùng không được xóa (anh 15/11)
      w.tk = null; w.tkBuffs = null; w.mobs = w.mobs.filter((m) => !m.tkb && !m.tkn); w.dongMinh = w.dongMinh.filter((m) => !m.tkb); w.tkQuay = null;
      if (w.player.target && (w.player.target.tkb || w.player.target.tkn)) w.player.target = null;
      if (co) w.refreshStats(false); // ra khỏi trận: trạng thái vật phẩm Tống Kim / chức / buff đồng đội thôi tác dụng
    }
    this.st = null; this.p = null; this.buffs.clear(); this.hot = null;
    if (this.el) this.el.style.display = "none";
    this.veLienSat(0);
    if (co) this.goiCB("ve", null, null); // Chiến báo (tkchienbao.js): ẩn
  },
  // ---------- Chiến báo (src/game/tkchienbao.js — gói giao diện): ChienBao.ve(p, ctx) mỗi khung lúc ở trận thật (p = trạng thái máy chủ, null = ẩn),
  // ChienBao.ketQua(ket, ctx) 1 lần lúc xong trận; ctx = { ten, phe, tran, chu, dt, gioSv(), raLuc } — module chưa có thì bỏ qua ----------
  napCB() {
    if (this.CB || this._cbP || performance.now() < this._cbLoi) return;
    this._cbP = import("./tkchienbao.js").then((m) => {
      this.CB = (m && (m.ChienBao || m.default)) || null;
      if (this.CB && this._cbCho) { const k = this._cbCho; this._cbCho = null; this.goiCB("ketQua", k, this.ctxCB()); }
    }, () => { this._cbLoi = performance.now() + 60000; }).finally(() => { this._cbP = null; });
  },
  goiCB(fn, ...a) {
    const C = this.CB; if (!C || typeof C[fn] !== "function") return;
    try { C[fn](...a); } catch (e) { if (!this._cbBao) { this._cbBao = 1; console.warn("Tống Kim — Chiến báo:", e); } }
  },
  ctxCB() {
    const st = this.st;
    return { ten: this.api ? this.api.ten() : "", phe: st ? st.phe : 0, tran: !!(st && st.tran), chu: !!(st && st.chu), dt: document.body.classList.contains("dt"), gioSv: () => this.gioSv(), raLuc: this.raLuc };
  },

  // ---------- trạng thái máy chủ ----------
  capNhat(p) {
    const w = this.w, st = this.st;
    if (!p || !w || !st || !this.mo || w.zone.id !== p.bai) return;
    this.p = p; this.tinLuc = performance.now(); st.lan++;
    if (+p.gio > 0) this.lech = +p.gio - Date.now(); // giờ máy chủ (đếm giờ khai chiến / còn lại / về Biện Kinh)
    const me = this.api.ten(), phe = p.phe | 0;
    if (p.loai) st.tran = p.loai === "tran";
    // đổi chủ trận: mọi máy bỏ mốc vị trí bot cũ (đồng hồ chủ mới khác — soát 05/11: máy thứ 3 thấy bot đứng im tới 10 giây)
    if (p.chu !== st.chuTen) { st.chuTen = p.chu; for (const e of st.bots.values()) e.buf = []; for (const e of st.binh.values()) e.buf = []; if (this.w) delete this.w._dhBot; } // đồng hồ vẽ bot đo lại theo chủ trận mới (soát 06/11: máy thứ 3 giữ đồng hồ chủ cũ -> bot vẽ trễ tới vài giây)
    st.tri = p.tri || 3; st.hs = p.hs > 0 ? p.hs : 1; // hs: hệ số sát thương PK (tkbot.js nhanHs)
    // doanh 2 phe: bãi thử — tâm vòng an toàn (máy chủ gửi); trận thật — giữa đại doanh 2 phe (gói bản đồ — hướng tiến / lui của bot, Trợ Thủ)
    if (st.tran) { if (!st.D && this.D) st.D = this.D; st.trai = st.D ? st.D.phe.map((P) => P.dai.tam) : p.trai || null; if (st.trai && !(st.trai[0] && st.trai[1])) st.trai = null; }
    else { st.trai = p.trai; st.R = p.R || 220; }
    if (phe !== st.phe || !st.daBao) { st.daBao = 1; st.phe = phe; st._dich = null; this.api.msg(`${st.tran ? "Chiến trường" : "Bãi thử"} Tống Kim: bạn ở phe ${PHE[phe]}`, MAU[phe]); }
    const chu = p.chu === me;
    if (chu !== st.chu) this.doiChu(chu);
    if (Array.isArray(p.chucHs) && Array.isArray(p.chucHs[0])) { const cu = JSON.stringify(st.chucHs || null); st.chucHs = p.chucHs; if (cu !== JSON.stringify(p.chucHs)) w.refreshStats(false); } // [sinh lực %, kháng %] theo chức (cau-hinh chucMau / chucThu)
    // tin trong trận (máy chủ D.tin — Nguyên soái ra / bị hạ, sắp hết giờ…): [[mã, câu, màu]] — chỉ câu mới; báo trước câu "Về Biện Kinh sau … giây" của
    // capNhatTran (anh 06/11 hạ Nguyên soái là kết thúc ngay: "Nguyên Soái … bị hạ" -> "Trận … kết thúc" -> "Về Biện Kinh sau 30 giây")
    for (const r of Array.isArray(p.tin) ? p.tin : []) if (Array.isArray(r) && +r[0] > (this.tinDa | 0)) { this.tinDa = +r[0]; this.api.msg(String(r[1] || ""), typeof r[2] === "string" ? r[2] : "#ffd54a"); }
    if (st.tran) this.capNhatTran(p);
    if (p.mb) st.mauBot = p.mb; // nhân vật mẫu cho bot (anh 09/11 — tkbot.js tkTaoBot)
    if (p.b) this.datBot(p.b, p.vt);
    if (p.bi) this.datBinh(p.bi);
    if (p.sn) this.datSnap(p.sn);
    if (p.hp) this.datMau(p.hp); else if (p.hd) this.datMau(p.hd); // hp: đủ (≤ 1 lần / giây), hd: chỉ dòng đổi từ lần trước (trận thật)
    this.datNguoi(p.ng || []);
    this.xep();
    if (Array.isArray(p.kk)) this.kk = p.kk;
  },
  // trận thật: pha (báo danh / đánh / xong — không ai đánh ai ngoài lúc đánh), chức (sinh lực / kháng — World.bonus), phe hạ Nguyên soái trước, kết quả
  capNhatTran(p) {
    const st = this.st, w = this.w, pha = p.pha === "bd" || p.pha === "xong" ? p.pha : "danh";
    if (pha !== st.pha) { const cu = st.pha; st.pha = pha; st.hoa = pha !== "danh"; this.doiPha(cu, pha, p); }
    st.hoa = pha !== "danh";
    const chuc = Math.max(0, Math.min(4, ((p.me || [])[3]) | 0));
    if (chuc !== st.chuc) { const len = chuc > st.chuc; st.chuc = chuc; w.refreshStats(false); if (len) this.api.msg(`Thăng chức ${CHUC[chuc]} — ${CHUC_TXT(chuc, st.chucHs)}`, "#ffd54a"); }
    this.veLienSat(pha === "xong" ? 0 : (p.me || [])[6] | 0);
    if (p.thang === 0 || p.thang === 1) st.thang = p.thang; // câu báo hạ Nguyên soái / thắng: tin trong trận của máy chủ (p.tin)
    if (pha === "xong" && p.ket) { const k = String(p.kc || p.u || 1); if (this.kqKhoa !== k) { this.kqKhoa = k; this.ketQua(p); } }
  },
  // đổi pha: báo danh -> câu chờ khai chiến (khai chiến / kết thúc: tin trong trận của máy chủ); bỏ mục tiêu đang nhắm
  doiPha(cu, moi, p) {
    const w = this.w;
    if (moi === "bd") this.api.msg(`Chiến trường Tống Kim: đang báo danh — khai chiến sau ${mmss((+p.kc || 0) - this.gioSv())}. Chưa khai chiến thì chưa ra khỏi đại doanh được`, "#ffd54a");
    if (cu && w.player.target && (w.player.target.tkb || w.player.target.tkn)) w.player.target = null;
  },
  // hết trận: Chiến báo kết quả (tkchienbao.js ChienBao.ketQua — module chưa tải xong thì gọi khi xong) + giờ về Biện Kinh (máy chủ p.ra; raSau giây sau
  // tự về — tick)
  ketQua(p) {
    const ket = p.ket || {}, now = this.gioSv();
    this.raLuc = +p.ra > 0 ? +p.ra : +ket.ra > 0 ? +ket.ra : (+p.ketLuc > 0 ? +p.ketLuc : now) + (+p.raSau > 0 ? +p.raSau : RA_SAU) * 1000;
    // thưởng đã ghi lúc máy chủ kết thúc trận (may-chu/tong-kim.js traoThuong), nhịp kế tiếp đưa vào túi — không phải chờ về Biện Kinh (soát đầu-cuối 06/11)
    this.api.msg(`Về Biện Kinh sau ${Math.max(1, Math.round((this.raLuc - now) / 1000))} giây — thưởng cuối trận (người đủ điểm trận) đã gửi vào hành trang`, "#ffd54a");
    if (this.CB) this.goiCB("ketQua", ket, this.ctxCB()); else { this._cbCho = ket; this.napCB(); }
  },
  // đổi chủ trận: mình nhận -> não bot + quân chạy ở máy mình từ chỗ đang vẽ; mình thôi -> vẽ theo vị trí chủ mới báo
  doiChu(chu) {
    const st = this.st, w = this.w; st.chu = chu;
    delete w._dhBot; // đồng hồ vẽ bot (world.js _mocBot) đo lại theo chủ trận mới
    // máy không chạy não: vẽ đủ bùa (tkNaoMoi), động tác đánh theo tốc chiêu chính (tkTaoBot atkDur0 — não cũ có thể để lại độ dài đòn bùa / bị chậm)
    for (const e of st.bots.values()) { e.buf = []; e.path = null; e.ngoai = !chu; if (chu && e.alive) w.tkNaoMoi(e); else if (!chu) { e.bl = e.buaDs || null; if (e.atkDur0) e.atkDur = e.atkDur0; } }
    for (const e of st.binh.values()) { e.buf = []; e.path = null; e.goal = null; e.ngoai = !chu; e.B = null; e._tuyen = null; if (e.act === "attack" || e.act === "walk") w.setAct(e, "stand"); }
    if (chu && (!st.tran || this.api.qt())) this.api.msg(`${st.tran ? "Chiến trường" : "Bãi thử"} Tống Kim: máy bạn đang chạy não bot${st.tran ? " + quân" : ""} (chủ trận)`, "#9fd8ff");
  },
  // danh sách bot [id, tên, phe, phái, giới, cấp, hạt giống, máu tối đa] (+ vt [[id, x, y]]): thêm con mới vào hàng chờ dựng, bỏ con không còn
  datBot(rows, vt) {
    const st = this.st, w = this.w, moi = new Map(rows.map((r) => [r[0], r])), viTri = new Map((vt || []).map((v) => [v[0], [v[1], v[2]]]));
    // con bị bỏ: đánh dấu chết — bot khác còn giữ nó làm mục tiêu / hướng tiến (tkbot.js B.muc, B.dichG) thì thôi ngay (soát lần 2 06/11)
    for (const [id, e] of [...st.bots]) if (!moi.has(id)) { e.alive = false; st.bots.delete(id); if (w.player.target === e) w.player.target = null; }
    this.cho = this.cho.filter((id) => moi.has(id));
    for (const [id, r] of moi) {
      const cu = this.rows.get(id); this.rows.set(id, { r, vt: viTri.get(id) || (cu && cu.vt) || null });
      if (!st.bots.has(id) && !this.cho.includes(id)) this.cho.push(id);
    }
    for (const id of [...this.rows.keys()]) if (!moi.has(id)) this.rows.delete(id);
  },
  // dựng tối đa DUNG_MOI bot / khung (dựng 80 con 1 lúc giật hình)
  dungTiep() {
    if (!this.DX || !this.cho.length) return;
    const st = this.st, w = this.w;
    for (let n = 0; n < DUNG_MOI && this.cho.length; n++) {
      const id = this.cho.shift(), o = this.rows.get(id); if (!o || st.bots.has(id)) continue;
      const r = o.r, c = o.vt || this.diemDoanh(r[2] | 0);
      let e; try { e = w.tkTaoBot(r, this.DX, c[0], c[1]); } catch (err) { console.warn("Tống Kim — dựng bot lỗi:", err); continue; }
      e.ngoai = !st.chu;
      st.bots.set(id, e);
      if (!(r[7] > 0)) this.gui.mau.push([id, so(e.p.hpMax)]);
    }
    this.datNhom(); this.xep();
  },
  // nhóm 4 con mỗi phe theo thứ tự mã (tkbot.js tkDiNhom)
  datNhom() {
    const st = this.st; st.nhom = new Map();
    for (const phe of [0, 1]) {
      const L = [...st.bots.values()].filter((e) => e.tkPhe === phe).sort((a, b) => a.tkb - b.tkb);
      L.forEach((e, i) => { e.doi = Math.floor(i / NHOM); const k = phe * 1000 + e.doi; if (!st.nhom.has(k)) st.nhom.set(k, []); st.nhom.get(k).push(e); });
    }
  },
  // bản chụp nhân vật người trong trận (may-chu/phan-than.js chup): chỉ số để tính chiêu họ phát lại trúng mình + phòng thủ bản chọn mục tiêu
  datSnap(sn) {
    const w = this.w, P = w.P;
    for (const [ten, S] of Object.entries(sn || {})) {
      if (!S || ten === this.api.ten()) continue;
      const k = JSON.stringify(S).length + "|" + (S.lvl | 0); const cu = this.snap.get(ten); if (cu && cu.k === k) continue;
      try {
        const sex = S.sex === "f" ? "f" : "m", series = S.series | 0;
        const start = S.start && S.start.str != null ? S.start : (P.chr.start || []).find((s) => s.series === series && s.sex === (sex === "f" ? 1 : 0)) || { str: 0, dex: 0, vit: 0, eng: 0 };
        const H = { name: S.name || ten, lvl: S.lvl || 1, sex, series, fac: S.fac ?? null, start, attr: S.attr || {}, equip: S.equip || {}, skills: S.skills || {}, looks: { ...(S.looks || {}), horse: 0 }, oChieu: S.oChieu || {}, danh: S.danh || {} };
        const A = w.tkChiSo(H); A.p.tkRef = ten; A.k = k;
        this.snap.set(ten, A);
      } catch (err) { console.warn("Tống Kim — chỉ số", ten, err); }
    }
  },
  // máu bot / quân [id, máu, máu tối đa, chết, lần hồi sinh]: chết -> ngã; lần hồi sinh đổi -> sống lại (chủ trận đặt chỗ: bot ở doanh / hậu doanh, lính
  // bậc 1 ở chỗ sinh — dòng "bi" mới nhất). Trận thật: "hp" đủ hoặc "hd" chỉ dòng đổi — cùng dạng
  // ô liên sát (anh 09/11 chọn mẫu ô nhỏ bên phải, chọn lại mẫu B: bỏ dòng "thêm mấy mạng", nền nâu trong, nhỏ hơn, đặt ngay trên ô Chiến trường Tống Kim): hiện suốt chuỗi từ 2 mạng, số mạng + tên mốc + thanh tới mốc sau; lên mốc thì nháy. n = liên trảm hiện tại của máy chủ (me[6] —
  // client TAB_SERIESKILL: hạ chức quá thấp không tính; bị hạ thì về 0)
  veLienSat(n) {
    if (!this.lsEl) { if (n < 2) return; this.lsEl = document.createElement("div"); this.lsEl.id = "tkls"; document.body.appendChild(this.lsEl); this.lsTen = ""; }
    const e = this.lsEl;
    if (n < 2) { if (e.classList.contains("on")) { e.classList.remove("on", "nhay"); this.lsTen = ""; this.lsN = 0; } return; }
    if (n === this.lsN) return;
    this.lsN = n;
    let i = 0; for (let k = 0; k < LS_MOC.length; k++) if (n >= LS_MOC[k][0]) i = k;
    const [m0, ten] = LS_MOC[i], sau = LS_MOC[i + 1], pct = sau ? Math.round(((n - m0) / (sau[0] - m0)) * 100) : 100;
    e.innerHTML = `<div class="h"><div class="so">${n}</div><div><div class="nh">LIÊN SÁT</div><div class="ten">${ten}</div></div></div><div class="thanh"><i style="width:${pct}%"></i></div>`;
    e.classList.add("on");
    const tt = this.el && this.el.getBoundingClientRect(); if (tt && tt.top > 0) e.style.top = Math.round(tt.top - e.offsetHeight - 6) + "px"; // ngay trên ô Chiến trường Tống Kim
    if (ten !== this.lsTen) { this.lsTen = ten; e.classList.remove("nhay"); void e.offsetWidth; e.classList.add("nhay"); }
  },
  datMau(hp) {
    const st = this.st, w = this.w;
    for (const r of hp) {
      if (!Array.isArray(r)) continue;
      const [id, mau, mauMax, chet, hoi, chucB] = r, binh = st.binh.get(id), e = binh || st.bots.get(id);
      if (!e || !(mauMax > 0)) continue; // máy chủ chưa biết máu tối đa (chưa ai dựng xong — tkMau): giữ máu máy mình dựng
      e.hpMax = mauMax; e.chucTk = chucB | 0; // danh hiệu trên đầu bot (World.tkDanhHieu)
      if (chet) {
        if (e.alive) { e.alive = false; e.hp = 0; e.deadT = 0; w.setAct(e, "die"); e.path = null; if (e.B) e.B.muc = null; if (w.player.target === e) w.player.target = null; }
      } else {
        if (!e.alive || (e.hoiN != null && hoi !== e.hoiN)) {
          e.alive = true; e.deadT = 0; e.curse = []; e.poison = null; e.stunUntil = 0; e.slowUntil = 0; e.hlUntil = 0; e.buf = [];
          // hồi sinh: MỌI máy đặt bot về hậu doanh phe nó / quân về chỗ sinh (anh 15/11 — bot "CuồngLong": "cứ chết nó lại hồi sinh tại chỗ"). Trước chỉ chủ trận đặt chỗ
          // mới, máy khác dựng bot đứng dậy ngay chỗ vừa ngã rồi chờ dòng vị trí của chủ trận — chủ trận chậm / tab ẩn / điện thoại treo thì bot đứng mãi chỗ cũ và bị băm lại
          // ngay đó (máy chủ nhận sát thương bot không xét chỗ). Hậu doanh là khu an toàn (tkHit không đánh được); chủ trận gửi chỗ thật ngay sau, lệch vài bước thì nhảy theo
          const c = binh ? e.home : this.diemDoanh(e.tkPhe);
          if (Array.isArray(c)) { e.x = c[0]; e.y = c[1]; }
          e.path = null; e.goal = null; e._tuyen = null;
          if (st.chu) { if (binh) { e.B = null; if (Array.isArray(c)) e.nha = [c[0], c[1]]; e.atkT = 0; } else w.tkNaoMoi(e); }
          w.setAct(e, "stand");
        }
        if (binh && e.binh === 5 && mau < (e._mauSv ?? Infinity) && e._mauSv != null) st.soaiNguy[e.tkPhe] = w.time; // Nguyên soái mất máu: bot phe đó về giữ
        e.hp = Math.max(1, Math.min(e.hpMax, mau));
      }
      e._mauSv = chet ? null : mau;
      e.hoiN = hoi;
    }
  },
  // ---------- quân NPC trận thật: "bi" [[mã, phe, bậc, mẫu, cấp, máu tối đa, sát thương thấp, cao, chính xác, né tránh, x, y]] (đủ cả danh sách khi mình chậm
  // phiên bản bsv) — con mới dựng, con không còn bỏ; lính bậc 2–5 / Nguyên soái đã chết vẫn nằm trong danh sách (không hồi sinh) ----------
  datBinh(rows) {
    const st = this.st, w = this.w, co = new Set();
    for (const r of rows) {
      if (!Array.isArray(r) || !(+r[0] > 0)) continue;
      const id = +r[0]; co.add(id);
      const e = st.binh.get(id);
      if (e) { this.capBinh(e, r); continue; }
      const m = this.taoBinh(r); if (!m) continue;
      st.binh.set(id, m); // Nguyên soái ra / tướng xuất trận: tin trong trận của máy chủ (p.tin)
    }
    for (const [id, e] of [...st.binh]) if (!co.has(id)) { e.alive = false; st.binh.delete(id); if (w.player.target === e) w.player.target = null; }
  },
  // 1 quân từ dòng "bi": mẫu monsters.json (hình, tầm đánh, tốc chạy — như quân Phong Hỏa: World.spawnMob, bỏ võ công quái) — chưa có mẫu thì thân tối thiểu
  // hình client; máu / sát thương / chính xác / né tránh theo máy chủ (máu Nguyên soái = máu boss thế giới — anh 06/11), kháng ≤ KHANG_BINH; tên, màu tên
  // theo phe (Nguyên soái: như boss thế giới — SOAI_MAU, tenBtg); Nguyên soái hiện số máu
  taoBinh(r) {
    const w = this.w, P = w.P, [id0, phe0, bac0, tpl, lv0, mauMax, d0, d1, ar, def, x, y] = r;
    const id = +id0, phe = phe0 ? 1 : 0, bac = Math.max(0, Math.min(5, bac0 | 0)), lv = Math.max(1, lv0 | 0), at = [+x || 0, +y || 0];
    let m = null;
    if (P.mons && P.mons[tpl] && P.mobstats && P.mobstats.mobs && P.mobstats.mobs[tpl]) {
      try { m = w.spawnMob(bac === 5, 0, { id: tpl, lvl: lv, at, series: P.mons[tpl].s ?? 2 }); } catch (err) { console.warn("Tống Kim — dựng quân", tpl, err); m = null; } // hệ của mẫu (client: cả 12 mẫu hệ Thủy)
      if (m) { const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); } // xep() đặt vào mobs / dongMinh theo phe
    }
    if (!m) {
      const type = BINH_HINH[phe][bac];
      m = { kind: "mob", uid: 3e7 + id, id: tpl, def: { anim: type, n: BINH_TEN[phe][bac] }, type, lvl: lv, boss: bac === 5, alive: true, x: at[0], y: at[1], dir: Math.floor(Math.random() * 8), act: "stand",
        t: Math.random() * 2, series: 0, exp: 0, res: { phys: 0, cold: 0, fire: 0, light: 0, poison: 0 }, reach: 75 * SCALE, run: 7 * 18 * SCALE, walk: 7 * 18 * SCALE * 0.5,
        atkGap: 5 / 18, hitRecover: 30, radius: bac === 5 ? 24 : 16, hurtDur: 0.5, aggro: false, atkT: 0, hitDone: false, path: null, repath: 0, wander: 0, deadT: 0, atkDur: 1 };
      if (P.npc && P.npc.ensure) P.npc.ensure(type);
    }
    delete m.vc; // đánh thường như nhau ở mọi máy
    const T = this.D && this.D.binh && Array.isArray(this.D.binh.ten) ? this.D.binh.ten : null, ten = (T && T[phe] && T[phe][bac]) || BINH_TEN[phe][bac];
    Object.assign(m, { tkb: id, tkq: 1, binh: bac, tkPhe: phe, tkRef: "#" + id, name: ten, mauTen: bac === 5 ? SOAI_MAU : MAU[phe], tenBtg: bac === 5 ? 1 : 0, lvl: lv, home: at.slice(), nha: at.slice(), // Nguyên soái: tên như boss thế giới (SOAI_MAU)
      res: Object.fromEntries(Object.entries(m.res || {}).map(([k, v]) => [k, Math.min(v, KHANG_BINH)])), boss: bac === 5, soMau: bac >= 3, dacBiet: bac >= 1, mucTen: null,
      B: null, buf: [], gap: 0.1, lag: 0.3, off: 0, ngoai: !(this.st && this.st.chu), curse: m.curse || [], hoiN: null, _mauSv: null });
    m.vision = BINH_NHIN[bac] * SCALE; m.active = BINH_HD * SCALE; m.giu = SOAI_GIU * SCALE;
    // tầm đòn thường: tầm gốc của mẫu (World.spawnMob -> ganVoCong có thể nới tới tầm chiêu — đã bỏ chiêu, như phonghoa.js), quân hạng cao tối thiểu BINH_TAM
    m.reach = Math.max(((P.reach && P.reach[tpl]) || 75) * SCALE, BINH_TAM[bac] * SCALE);
    m.atkDur = (P.npc && P.npc.duration && P.npc.duration(m.type, "attack1")) || 1;
    this.capBinh(m, r, true);
    return m;
  },
  // chỉ số máy chủ (máu tối đa, sát thương, chính xác, né tránh) + chỗ sinh (lính bậc 1 hồi sinh ở chỗ mới — máy chủ đổi chỗ thì gửi lại "bi")
  capBinh(m, r, moi) {
    const [, , , , , mauMax, d0, d1, ar, def, x, y] = r, mx = Math.max(1, +mauMax || 1);
    m.hpMax = mx; m.hp = moi ? mx : Math.min(m.hp, mx);
    m.dmg = [Math.max(0, +d0 || 0), Math.max(0, +d1 || +d0 || 0)]; m.ar = Math.max(1, +ar || 1); m.def = Math.max(0, +def || 0);
    if (Number.isFinite(+x) && Number.isFinite(+y)) m.home = [+x, +y];
  },
  // người trong trận [tên, phe, điểm, hạ, chết, chức, đang online]: mọi người khác đang online có 1 "bản" (chỗ, máu %, phòng thủ) — bot nhắm được
  // (tkbot.js tkDichCua), người phe kia thêm vào World.mobs để mình chọn mục tiêu (xep)
  datNguoi(ng) {
    const st = this.st, me = this.api.ten(), co = new Set();
    this.pheNguoi = new Map(ng.map((r) => [r[0], r[1] | 0]));
    for (const [ten, phe, , , , chuc, online] of ng) {
      if (ten === me || !online) continue;
      co.add(ten);
      let n = st.nguoi.get(ten);
      if (!n) { n = { kind: "mob", tkn: ten, name: ten, uid: 2e7 + st.nguoi.size + Math.floor(Math.random() * 1e6), alive: false, hp: 100, hpMax: 100, x: 0, y: 0, radius: 14, curse: [], res: { phys: 0, cold: 0, fire: 0, light: 0, poison: 0 }, def: 0, series: 0, lvl: 1, dir: 0, act: "stand", t: 0, home: [0, 0] }; st.nguoi.set(ten, n); }
      n.tkPhe = phe | 0; n.chucTk = chuc | 0;
      // kháng theo bản chụp (+ kháng tất cả của chức trong trận thật — CHUC_TK, như World.bonus của máy họ), chặn trần kháng
      const H = st.chucHs, kc = !st.tran ? 0 : H && Array.isArray(H[1]) ? +H[1][chuc | 0] || 0 : (CHUC_TK[chuc | 0] || [0, 0])[1];
      // hệ / cấp theo bản chụp lúc vào phòng (kd không có) — lượt 86 lỡ đưa 2 dòng này vào sau "//" nên người phe kia luôn hệ Kim, cấp 1: ngũ hành tương khắc sai (anh 13/11
      // "ngũ độc yếu lắm, thiên nhẫn cái bang thả 2 cái vẹo"). Kháng / né: máy họ đã gửi số thật (dongBo — n._kd) thì giữ số đó
      const A = this.snap.get(ten);
      if (A) {
        const p = A.p; n.series = A.H.series | 0; n.lvl = A.H.lvl | 0;
        if (!n._kd) { n.res = Object.fromEntries(Object.keys(p.res).map((k) => [k, khangThat(p.res[k] + kc, p.resCap ? p.resCap[k] ?? 75 : 75)])); n.def = p.def;
          n.resGoc = Object.fromEntries(Object.keys(p.res).map((k) => [k, p.res[k] + kc])); n.resCap = p.resCap ? { ...p.resCap } : null; } // vocong.js mobRes: bùa giảm trên kháng gốc rồi chặn trần (rà soát 12/11)
      }
    }
    for (const ten of [...st.nguoi.keys()]) if (!co.has(ten)) { const n = st.nguoi.get(ten); n.alive = false; st.nguoi.delete(ten); if (this.w.player.target === n) this.w.player.target = null; } // rời trận: đánh dấu chết (bot đang giữ thì thôi)
  },
  // chỗ / máu bản chọn mục tiêu theo người chơi khác đang vẽ (others: hp %)
  dongBo() {
    const st = this.st, w = this.w;
    for (const n of st.nguoi.values()) {
      const o = w.others.get(n.name);
      if (!o) { n.alive = false; continue; }
      // đang ẩn thân (Ngự Tuyết Ẩn — world.js AN_BL, anh 12/11 "vào tống kim k có tác dụng"): như JX1 — không ai chọn làm mục tiêu được (mình, Trợ Thủ, bot, đạn bám), nhưng
      // vẫn trúng chiêu diện / đạn bay qua (rà soát 12/11: trước coi như vắng — đánh không trúng được)
      n.x = o.x; n.y = o.y; n.dir = o.dir; n.hp = o.hp ?? 100; n.alive = n.hp > 0 && o.act !== "die"; n.an = !!o.an;
      // bùa hại người đó đang dính (máy họ gửi kèm nhịp — o.bc): gắn lên bản chọn mục tiêu để sát thương của mình / đồng đội tính theo kháng đã giảm (anh 12/11);
      // chết / ẩn: bỏ bùa (hồi sinh thì Trợ Thủ ra bùa lại)
      if (!n.alive) { n.curse = null; n._bc = null; }
      else if ((o.bc || null) !== (n._bc || null)) { n._bc = o.bc || null; n.curse = w.buaTuXa(n.curse, o.bc); }
      // kháng / né thật họ đang có (máy họ gửi kèm nhịp — o.kd, anh 13/11 lượt 86: vòng sáng Nga My / Thiếu Lâm, bùa lợi của đồng đội giờ có tác dụng): thay số bản chụp (datNguoi)
      if (Array.isArray(o.kd) && o.kd.length === 11 && o.kd !== n._kd) {
        const kd = o.kd; n._kd = kd;
        n.resGoc = Object.fromEntries(KHANG_5.map((k, i) => [k, +kd[i] || 0])); n.resCap = Object.fromEntries(KHANG_5.map((k, i) => [k, +kd[5 + i] || 75]));
        n.res = Object.fromEntries(KHANG_5.map((k) => [k, khangThat(n.resGoc[k], n.resCap[k])])); n.def = Math.max(0, +kd[10] || 0);
      }
    }
  },
  // bot + quân NPC phe kia + người phe kia -> World.mobs; bot + quân phe mình -> World.dongMinh
  xep() {
    const st = this.st, w = this.w; if (!st || !w) return;
    const dich = [], ta = [];
    for (const e of st.bots.values()) (e.tkPhe === st.phe ? ta : dich).push(e);
    for (const e of st.binh.values()) (e.tkPhe === st.phe ? ta : dich).push(e);
    w.mobs = [...w.mobs.filter((m) => !m.tkb && !m.tkn), ...dich, ...[...st.nguoi.values()].filter((n) => n.tkPhe !== st.phe)];
    w.dongMinh = [...w.dongMinh.filter((m) => !m.tkb), ...ta];
  },
  // 2 doanh trại bãi thử (công cụ thử — main.js tkMo): 2 bên chỗ mình đứng, cách nhau ~1.400 logic (ít nhất ~1,3 × D), luôn trong bản đồ cách mép ≥ 160,
  // ô đi được, đi bộ tới nhau được (cùng vùng). Đứng sát mép thì dời tâm vào trong (thử 05/11: mở ở mép phải bãi 319 — doanh Kim bị kéo về sát chỗ đứng,
  // 2 doanh gần nhau, 1 phe kẹt trong doanh -> điểm 6.810 – 225). Ngang không được thì thử dọc / chéo, rồi khoảng ngắn hơn. -> [[x, y] Tống, [x, y] Kim] | null
  chonDoanh(w) {
    const m = w.map, p = w.player, MEP = 160;
    const tim = (x, y) => { if (m.walkable(x, y)) return [x, y]; const c = m.grid ? m.nearestCell(x, y, 40) : -1; return c >= 0 ? m.center(c) : null; };
    for (const D of [700, 600, 500, 450]) for (const [ux, uy] of [[1, 0], [0, 1], [0.7, 0.7], [0.7, -0.7]]) {
      const dx = ux * D, dy = (uy * D) / 2; // trục dọc: 1 điểm bản đồ = 2 logic
      const cx = Math.max(MEP + Math.abs(dx), Math.min(m.w - MEP - Math.abs(dx), p.x)), cy = Math.max(MEP + Math.abs(dy), Math.min(m.h - MEP - Math.abs(dy), p.y));
      const a = tim(cx - dx, cy - dy), b = tim(cx + dx, cy + dy);
      if (!a || !b || ldist(a[0], a[1], b[0], b[1]) < D * 1.3) continue;
      if (m.vung && m.vung(a[0], a[1]) !== m.vung(b[0], b[1])) continue;
      return [a.map(Math.round), b.map(Math.round)];
    }
    return null;
  },
  // có người thật khác (đang online trong trận) cách (x, y) ≤ XA + 200
  ganNguoi(x, y) { for (const n of this.st.nguoi.values()) if (ldist(x, y, n.x, n.y) <= XA + 200) return true; return false; },
  // điểm đứng trong doanh phe ph (lệch ngẫu nhiên, ô đi được). Trận thật: 1 điểm hồi sinh hậu doanh (hau.diem — lệch ≤ 40)
  diemDoanh(ph) {
    const st = this.st, w = this.w;
    if (st && st.tran && this.D) {
      const P = this.D.phe[ph ? 1 : 0], c0 = chonNgau(P.hau.diem) || P.dai.tam;
      if (c0) {
        for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 40, x = c0[0] + Math.cos(a) * r, y = c0[1] + Math.sin(a) * r * 0.5; if (w.map.walkable(x, y)) return [x, y]; }
        return [c0[0], c0[1]];
      }
    }
    const c = (st && st.trai && st.trai[ph]) || [w.player.x, w.player.y];
    for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 120, x = c[0] + Math.cos(a) * r, y = c[1] + Math.sin(a) * r * 0.5; if (w.map.walkable(x, y)) return [x, y]; } // rải trong doanh (anh 06/11 — không đứng chụm)
    return [c[0], c[1]];
  },

  // ---------- tin tức thời ----------
  // "tkh" (chủ trận báo vị trí bot): máy khác vẽ theo (World._moc như người chơi khác)
  viTri(q, ts, don) {
    const st = this.st, w = this.w; if (!this.laTo() || st.chu || !Array.isArray(q)) return;
    for (const r of q) {
      const e = st.bots.get(r[0]) || st.binh.get(r[0]); if (!e) continue; // bot / quân NPC (trận thật — cùng dạng dòng)
      w._moc(e, [[ts, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[9] ? 1 : 0]], !!don); // [8] lên / xuống ngựa theo chủ trận (anh 06/11) — đổi lúc vẽ tới mốc (World.updateOther)
    }
  },
  // "tkc" chiêu của bot (src "#mã") / người khác (tên): phe kia -> phát lại thật, đạn chỉ trúng mình (tkbot.js tkTrungMinh); cùng phe -> chỉ vẽ
  chieu(c) {
    const st = this.st, w = this.w; if (!this.laTo() || !Array.isArray(c)) return;
    const me = this.api.ten(), db = w.P.skillDb || {};
    for (const [src, sk, lv, x, y, px, py, tgt, pv] of c) {
      let goc, A, phe;
      if (typeof src === "string" && src[0] === "#") { const e = st.bots.get(+src.slice(1)); if (!e || !e.alive) continue; goc = e; A = e; phe = e.tkPhe; }
      else { if (!src || src === me) continue; goc = w.others.get(src); A = this.snap.get(src); phe = this.pheNguoi.get(src); if (!goc || phe == null) continue; }
      if (ldist(goc.x, goc.y, w.player.x, w.player.y) > XA) continue;
      const pt = [px - x + goc.x, py - y + goc.y], s = db[sk], k = w.P.vc && w.P.vc.sk(sk); if (!s || !k) continue;
      const kind = kindOf(s, db);
      if (kind === "buff") { if (k.pre && goc.tkb) w.vfxAt(k.pre, null, goc, 0); continue; } // bot dùng bùa lợi (tkbot.js tkBua — anh 06/11): chỉ hình vận công
      if (kind !== "attack" && kind !== "curse") continue;
      // người phe kia mang cờ pv (bản mới — anh 12/11): máy họ đã tự tính trúng mình và gửi "tkt" -> ở đây chỉ vẽ (máy chủ trận: mang tkA ao để bot thấy vùng chiêu mà né)
      if (phe !== st.phe && pv === 1 && src[0] !== "#") {
        if (w.P.vc.warm) w.P.vc.warm(sk);
        if (k.pre) w.vfxAt(k.pre, null, goc, 0);
        if (w.tk && st.chu) w.fire(sk, lv, { root: sk, x: goc.x, y: goc.y, tgt: null, pt, ao: true, goc, tkA: { phe, ao: 1, ref: src } });
        else w.chieuAo(sk, lv, goc, pt);
        continue;
      }
      if (phe !== st.phe && A && A.p) {
        if (w.P.vc.warm) w.P.vc.warm(sk);
        if (k.pre) w.vfxAt(k.pre, null, goc, 0);
        w.fire(sk, lv, { root: sk, x: goc.x, y: goc.y, tgt: tgt === me ? w.player : null, pt, goc, ptA: A, tkA: { phe, me: 1, ref: src } });
      } else if (src[0] !== "#" && w.tk && st.chu) {
        // người cùng phe với mình (máy chủ trận): chỉ vẽ (ao — không sát thương, như chieuAo) nhưng mang tkA phe người ra chiêu -> bot phe kia thấy
        // bãi lửa / vùng nổ của người đó mà né (tkbot.js tkVungDich — soát 06/11: chieuAo không có tkA, bot đứng trong lửa của người phe mình)
        if (w.P.vc.warm) w.P.vc.warm(sk);
        if (k.pre) w.vfxAt(k.pre, null, goc, 0);
        w.fire(sk, lv, { root: sk, x: goc.x, y: goc.y, tgt: null, pt, ao: true, goc, tkA: { phe, ao: 1, ref: src } });
      } else w.chieuAo(sk, lv, goc, pt);
    }
  },
  // "tkhn" bot cùng phe (Nga My…) hồi máu mình: chỉ nhận chiêu hồi máu (chiêu bùa lợi dùng lên người khác)
  hoiTu(m) {
    const w = this.w; if (!this.laTo() || !m || w.player.hp <= 0) return;
    const db = w.P.skillDb || {}, s = db[m.id], lv = Math.max(1, Math.min(40, m.lv | 0));
    if (!s || s.aura || !(s.target && s.target.ally) || !isHeal(s, lv)) return;
    w.buffOn(+m.id, lv);
  },
  // "tkt" đòn đánh thẳng vào mình (đòn thường người / bot phe kia)
  trungMinh(t) { if (this.laTo() && t) this.w.tkTrungThang(t); },
  // "tkst" (chủ trận): choáng / chậm người khác gây lên bot
  trangThai(L) {
    const st = this.st, w = this.w; if (!this.laTo() || !st.chu || !Array.isArray(L)) return;
    for (const [id, cg, cm, hl] of L) { const e = st.bots.get(id) || st.binh.get(id); if (!e || !e.alive) continue; if (cg > 0) e.stunUntil = Math.max(e.stunUntil || 0, w.time + cg / 1000); if (cm > 0) e.slowUntil = Math.max(e.slowUntil || 0, w.time + cm / 1000); if (hl > 0) e.hlUntil = Math.max(e.hlUntil || 0, w.time + hl / 1000); } // hl: hoảng loạn (Thiên Nhẫn 120)
  },
  // "tkk" [người hạ, người bị hạ, phe người hạ, điểm]
  giet(k) {
    if (!this.laTo() || !Array.isArray(k)) return;
    const [a, b, ph, d] = k, me = this.api.ten();
    this.kk = [...this.kk, [Date.now(), a, b, ph, d]].slice(-5);
    if (a === me) this.api.msg(`Bạn hạ ${b} +${d} điểm`, MAU[ph | 0]);
    else if (b === me) this.api.msg(`Bạn bị ${a} hạ`, "#ff8a80");
  },
  // mình trọng thương trong trận (World.onTkChet): báo người / bot vừa đánh mình (≤ 15 giây). Anh 13/11 tối: không tự đứng dậy sau 8 giây nữa — bảng trọng thương
  // của trận (main.js tkChetBox) bấm "Về doanh trại" thì hồi sinh (hoiSinhNgay); 30 giây không bấm (bảng bị đóng…) thì tự hồi sinh — khỏi kẹt
  giayHoiSinh() { return (this.p && this.p.hsinh) || HOI_SINH; },
  hoiSinhNgay() { if (this.laTo() && this.w && this.w.player.hp <= 0) this.hoiSinh(); },
  chet() {
    if (!this.laTo()) return;
    const w = this.w, st = this.st, d = w.tkDon && w.time - w.tkDon.t < 15 ? w.tkDon.ref : "", hs = (this.p && this.p.hsinh) || HOI_SINH; // giây hồi sinh: cau-hinh tongKim.hoiSinh (máy chủ gửi)
    Net.wsGui({ t: "tkChet", tu: d || "" });
    this.hoiSinhLuc = performance.now() + Math.max(30, hs * 3) * 1000; // dự phòng: không bấm bảng trọng thương
    if (st.tran) w.tkQuay = [w.player.x, w.player.y, w.time]; // Trợ Thủ: hồi sinh xong ra cổng hậu doanh rồi về chỗ vừa ngã (tkbot.js tkTuRa)
    this.api.msg(`Bạn bị trọng thương — bấm "Về doanh trại" để hồi sinh ở ${st.tran ? "hậu doanh" : "doanh trại"} phe ${PHE[st.phe]} — hiệu quả các loại hoàn đã mất, phải dùng lại`, "#ff8a80");
  },
  hoiSinh() {
    const w = this.w, p = w.player, c = this.diemDoanh(this.st.phe);
    p.hp = p.hpMax; p.mp = p.mpMax; p.deadT = 0; p.reviving = false; p.poison = null; p.stunUntil = 0; p.hlUntil = 0; p.slowUntil = 0; p.tkBua = null; p.matNoi = null; p.target = null; p.path = null; p.cast = null; p.potHp = p.potMp = null;
    p.jump = null; p.dash = null; p.queueAt = p.queueSelf = null; // khinh công / lướt dở lúc chết (anh 16/11 "vẫn hồi sinh tại chỗ" — jumpTick kéo về đường nhảy cũ)
    w.teleport(c[0], c[1]); w.setAct(p, "stand"); this.hoiSinhLuc = 0; w.tkDon = null;
    // vừa hồi sinh: cổng ra hậu doanh khóa giayHoiSinh() giây (anh 13/11 tối "về đại doanh 8 giây sau được ra" — Trợ Thủ cũng phải chờ, không lao ngay ra chỗ vừa ngã)
    if (this.st && this.st.tran) { const hs = this.giayHoiSinh(); this.raKhoa = performance.now() + hs * 1000; this.api.msg(`Đã về hậu doanh — ${hs} giây sau mới ra trận được`, "#9fd8ff"); }
    this.bayKhoa = performance.now() + 800; this.bayTrong = true; // vừa đặt ở hậu doanh: bẫy chỉ bắt khi bước vào lại
  },
  // ---------- bẫy (trận thật — mình; bot dùng bẫy ở máy chủ trận: tkbot.js tkRaHau / tkVe) ----------
  // giẫm lên điểm bẫy của phe mình (≤ bayR logic): cổng đại doanh lúc báo danh -> đẩy về trong đại doanh; cổng hậu doanh -> 1 điểm ra đại doanh; bẫy đại doanh
  // -> hậu doanh. Bẫy chỉ bắt lúc vừa bước vào (vừa dịch chuyển tới chỗ nằm trong vùng bẫy thì phải ra khỏi vùng đó trước — bayTrong)
  bay(now) {
    const st = this.st, D = this.D, w = this.w, p = w.player;
    if (!D || p.hp <= 0 || now < this.bayKhoa) return;
    const x0 = this._bayX, y0 = this._bayY; // chỗ lần xét trước (null: vừa dịch chuyển)
    if (x0 === p.x && y0 === p.y) return; // đứng yên: không xét lại
    this._bayX = p.x; this._bayY = p.y;
    const P = D.phe[st.phe ? 1 : 0], R = D.bayR, bd = st.pha === "bd";
    // chưa khai chiến (anh 12/11 "chưa khai chiến nhưng có thể bay ra ngoài"): ra khỏi doanh trại bằng bất cứ đường nào (chạy ngựa / máy giật nhảy qua dải bẫy
    // cổng, chiêu lướt…) -> kéo về như giẫm bẫy cổng
    if (bd && !this.trongDoanh(st.phe, p.x, p.y)) return this.dichChuyen(ganNhat(P.cong.lui, p.x, p.y) || chonNgau(P.dai.diem), "Chưa khai chiến — chưa ra khỏi doanh trại được");
    const cong = bd && (bayCham(P.cong.bay, p.x, p.y, R) >= 0 || (x0 != null && !this.bayTrong && doanCham(P.cong.bay, x0, y0, p.x, p.y, R))), ra = bayCham(P.ra.bay, p.x, p.y, R) >= 0, ve = bayCham(P.ve.bay, p.x, p.y, R) >= 0;
    if (!cong && !ra && !ve) { this.bayTrong = false; return; }
    if (this.bayTrong) return;
    if (cong) return this.dichChuyen(ganNhat(P.cong.lui, p.x, p.y) || chonNgau(P.dai.diem), "Chưa khai chiến — chưa ra khỏi doanh trại được");
    if (ra) {
      const con = (this.raKhoa || 0) - now; // vừa hồi sinh: chưa ra được (hoiSinh)
      if (con > 0) { if (now - (this._raBao || 0) > 1500) { this._raBao = now; this.api.msg(`Vừa hồi sinh — còn ${Math.ceil(con / 1000)} giây nữa mới ra khỏi hậu doanh được`, "#ffd54f"); } this._bayX = null; return; }
      return this.dichChuyen(chonNgau(P.ra.toi), "Rời hậu doanh — ra đại doanh");
    }
    if (ve) return this.dichChuyen(chonNgau(P.ve.toi), "Về hậu doanh — khu an toàn, Quân y bán thuốc");
  },
  // đặt mình tới điểm c (lệch ≤ 30, ô đi được): bỏ đường / mục tiêu (World.teleport), không tải lại bãi
  dichChuyen(c, cau) {
    if (!c) return;
    const w = this.w, p = w.player;
    let x = c[0], y = c[1];
    for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 30, nx = c[0] + Math.cos(a) * r, ny = c[1] + Math.sin(a) * r * 0.5; if (w.map.walkable(nx, ny)) { x = nx; y = ny; break; } }
    if (!w.teleport(x, y)) return;
    p.cast = null; w.holdMove = false; if (p.act !== "die") w.setAct(p, "stand");
    this.bayKhoa = performance.now() + 600; this.bayTrong = true; this._bayX = null;
    if (cau) this.api.msg(cau, "#9fd8ff");
  },
  // ---------- vật phẩm Tống Kim (đặc tả đợt 2 — máy chủ do.js dungVat) ----------
  // Chiến cổ / Lệnh Bài (tkDoi { k, giay }): buff mình + báo máy chủ chuyển người cùng phe ("tkBuff" — họ tự xét đứng gần trong BUFF_R)
  dungDoi(o) {
    if (!o || !/^tk[A-Za-z]{2,24}$/.test(o.k || "") || !this.laTo()) return;
    const giay = Math.max(1, Math.min(600, +o.giay || 180));
    this.datBuff(o.k, giay);
    Net.wsGui({ t: "tkBuff", k: o.k, giay });
    this.api.msg(`${BUFF_TEN[o.k] || "Buff"}: bạn và người cùng phe đứng gần nhận hiệu quả trong ${Math.round(giay / 60)} phút`, "#9fd8ff");
  },
  // "tkBuff" { k, giay, tu } của người cùng phe (máy chủ chỉ chuyển trong phòng, cùng phe): mình đứng trong BUFF_R quanh người đó thì nhận
  nhanBuff(m) {
    if (!m || !this.laTo() || !/^tk[A-Za-z]{2,24}$/.test(m.k || "") || m.tu === this.api.ten()) return;
    const w = this.w, p = w.player, o = m.tu && w.others.get(m.tu);
    if (!o || p.hp <= 0 || ldist(p.x, p.y, o.x, o.y) > BUFF_R) return;
    this.datBuff(m.k, Math.max(1, Math.min(600, +m.giay || 180)));
    this.api.msg(`${m.tu} dùng ${BUFF_TEN[m.k] || "vật phẩm"} — bạn nhận hiệu quả trong ${Math.round((+m.giay || 180) / 60)} phút`, "#9fd8ff");
  },
  datBuff(k, giay) { this.buffs.set(k, Date.now() + giay * 1000); if (this.w) this.w.refreshStats(false); },
  // Càn Khôn Tạo Hóa Đan (tkHoi { v, giay }): hồi v sinh lực + v nội lực mỗi nửa giây trong giay giây (dùng lại thì tính lại từ đầu)
  dungHoi(o) {
    if (!o || !(+o.v > 0) || !this.laTo()) return;
    const n = Math.max(1, Math.min(40, Math.round((+o.giay || 3) * 2)));
    this.hot = { v: Math.round(+o.v), n, luc: performance.now() };
  },
  // buff đồng đội hết hạn -> tính lại chỉ số; hồi theo nhịp
  tickBuff(now) {
    const w = this.w;
    if (this.buffs.size) { const t = Date.now(); let doi = false; for (const [k, het] of this.buffs) if (het <= t) { this.buffs.delete(k); doi = true; } if (doi) w.refreshStats(false); }
    const H = this.hot;
    if (H) {
      const p = w.player;
      while (H.n > 0 && now >= H.luc) { H.n--; H.luc += 500; if (p.hp > 0) { p.hp = Math.min(p.hpMax, p.hp + H.v); p.mp = Math.min(p.mpMax, p.mp + H.v); w.text(p, `+${H.v}`, "#7cff7c"); } }
      if (H.n <= 0) this.hot = null;
    }
  },

  // ---------- mỗi khung (main.js hud) ----------
  tick() {
    // đứng ở chiến trường mà chưa vào được phòng (chưa báo danh / không còn trận — máy chủ không trả trạng thái) KHONG_TT: về Biện Kinh
    if (this.w && laZoneTk(this.w.zone) && !this.laTo() && performance.now() - (this.vaoLuc0 || 0) > KHONG_TT) this.veBienKinh("Ngươi không có tên trong trận Tống Kim đang diễn ra — mời về Biện Kinh (báo danh ở Mộ binh quan)");
    if (!this.laTo()) { if (this.el && this.el.style.display !== "none") { this.el.style.display = "none"; this.veLienSat(0); } return; }
    const now = performance.now(), st = this.st, w = this.w;
    if (this.p && now - this.tinLuc > 5000) this.p = null; // 5 giây không có trạng thái (kênh đứt / bị rơi khỏi phòng): xin vào lại
    if (!this.p && now - (this.vaoLuc || 0) > 2000) this.xinVao();
    // 20 giây vẫn không có trạng thái: phòng đã mất (máy chủ khởi động lại…) — bỏ "phòng ma", tải lại bãi cho quái thường về (soát 05/11)
    if (!this.p && now - Math.max(this.tinLuc || 0, this.vaoLuc0 || 0) > 20000) { this.moPhong({ mo: 0 }); return; }
    this.dungTiep();
    this.dongBo();
    if (now - this.guiLuc >= GUI_MS) { this.guiLuc = now; this.guiTin(); }
    if (st.chu && now - this.vtLuc >= VT_MS) { this.vtLuc = now; this.guiViTri(now - this.duLuc >= DU_MS); }
    else if (st.chu && now - (this.donLuc || 0) >= DON_MS) { this.donLuc = now; this.guiViTri(false, true); } // bot vừa vung đòn: báo ngay (như quaichung.js — anh 06/11 "giật nhảy, không đều")
    if (now - this.songLuc >= SONG_MS) { this.songLuc = now; Net.wsGui({ t: "tkAn", an: document.hidden ? 1 : 0 }); }
    if (w.player.hp <= 0 && this.hoiSinhLuc && now >= this.hoiSinhLuc) this.hoiSinh();
    if (st.tran) {
      this.bay(now);
      // xong trận: raSau giây sau tự về Biện Kinh
      if (st.pha === "xong" && this.raLuc && !this.daRa && this.gioSv() >= this.raLuc) { this.daRa = true; this.veBienKinh("Trận Tống Kim đã kết thúc — mời về Biện Kinh."); }
    }
    this.tickBuff(now);
    this.ve();
    if (st.tran) this.goiCB("ve", this.p, this.ctxCB()); // Chiến báo (tkchienbao.js — gói giao diện)
  },
  guiTin() {
    const G = this.gui;
    if (G.d.length || G.st.length) { const d = G.d.splice(0), s = G.st.splice(0); for (const c of chia(d, 120)) Net.wsGui({ t: "tkd", d: c, ...(s.length ? { st: s.splice(0, 60) } : {}) }); if (s.length) Net.wsGui({ t: "tkd", d: [], st: s.slice(0, 60) }); }
    if (G.h.length) { const h = new Map(); for (const [id, v] of G.h.splice(0)) h.set(id, (h.get(id) || 0) + v); Net.wsGui({ t: "tkHoi", h: [...h] }); }
    if (G.c.length) for (const c of chia(G.c.splice(0), 60)) Net.wsGui({ t: "tkc", c });
    if (G.mau.length) Net.wsGui({ t: "tkMau", m: G.mau.splice(0) });
  },
  // vị trí bot (chủ trận): con đổi chỗ / động tác từ lần trước; mỗi DU_MS gửi đủ
  // don: chỉ con vừa vung đòn (số đòn đổi từ lần báo trước — máy khác vung đúng nhịp, không lệch 0–120 ms theo nhịp 100 ms; đo 06/11: sai lệch nhịp đòn ở
  // máy khác trung bình 170 ms)
  guiViTri(du, don) {
    const st = this.st, w = this.w, rows = [];
    for (const L of [st.bots, st.binh]) for (const e of L.values()) {
      if (don && (e._vtAtk == null || e._vtAtk === (e.atkN | 0))) continue;
      if (e.tkq && !e.alive && e.deadT > 3) continue; // quân đã ngã hẳn (bậc 2–5 / Nguyên soái không hồi sinh): thôi báo
      const B = e.B, m = B && B.muc, tgt = !m ? "" : m === w.player ? this.api.ten() : m.tkn || (m.tkb ? "#" + m.tkb : "");
      const act = !e.alive ? "die" : e.act === "walk" ? "run" : e.act; // quân đi bộ: máy chủ chỉ nhận stand / run / attack / hurt / die / sit
      const r = [e.tkb, so(e.x), so(e.y), e.dir | 0, act, e.atkN | 0, w.tkMaDon(e), e.fight ? 1 : 0, tgt, e.ngua ? 1 : 0], k = r.join(","); // [9] đang cưỡi ngựa (anh 06/11)
      if (!du && e._vtK === k) continue;
      e._vtK = k; e._vtAtk = e.atkN | 0; rows.push(r);
    }
    if (du) this.duLuc = performance.now();
    const ts = Math.round(performance.now());
    // d: tin báo đòn — máy khác không lấy làm mốc nhịp (world.js _mocBot lastReg; soát lần 2 06/11: đoán theo khoảng cách thì tin báo đòn 80–99 ms sau tin
    // theo nhịp bị coi là tin theo nhịp — đồng hồ vẽ chạy quá mốc của con đang chạy)
    for (const q of chia(rows, 120)) Net.wsGui({ t: "tkh", ts, q, ...(don ? { d: 1 } : {}) });
  },

  // ---------- bảng điểm (như bảng Phong Hỏa — dưới bản đồ nhỏ) ----------
  ve() {
    const p = this.p; if (!p) return;
    if (!this.el) {
      this.el = document.createElement("div"); this.el.id = "tktt"; document.body.appendChild(this.el);
      // nút Rời trận (anh 13/11 lượt 86 "thêm nút thoát tống kim giữa chừng"): hỏi lại bằng khung của game rồi về Biện Kinh (api.roiTran — main.js)
      this.el.onclick = (e) => { if (e.target.closest("[data-roi]") && this.api && this.api.roiTran) this.api.roiTran(); };
    }
    const st = this.st, me = p.me || [0, 0, 0, 0], song = [0, 0], tong = [0, 0];
    for (const e of st.bots.values()) { tong[e.tkPhe]++; if (e.alive) song[e.tkPhe]++; }
    const dong = (n, v, c = "") => `<div class="d"><span>${n}</span><i class="${c}">${v}</i></div>`;
    const chu = p.chu ? (p.chu === this.api.ten() ? "máy bạn" : p.chu) : "—";
    const t = Date.now(), kk = this.kk.filter((k) => t - k[0] < 8000).slice(-3).map((k) => `<div class="k"><span class="${k[3] ? "kim" : "song"}">${esc(k[1])}</span> hạ ${esc(k[2])} +${k[4]}</div>`).join("");
    // trận thật: pha + giờ (khai chiến sau / còn lại / về Biện Kinh), Nguyên soái 2 phe (chưa ra — ra sau / còn % máu / đã bị hạ), không hiện máy chủ trận /
    // khung hình (quản trị vẫn thấy)
    let tran = "";
    if (st.tran) {
      const now = this.gioSv(), th = p.thang === 0 || p.thang === 1 ? p.thang : null, soai = [null, null];
      for (const e of st.binh.values()) if (e.binh === 5) soai[e.tkPhe] = e;
      // chưa ra: giờ ra của phe đó (soaiLuc — máy chủ chốt lúc phút soai1), chưa chốt thì mốc sớm nhất (soaiMoc[0])
      const ns = (ph) => { const e = soai[ph], luc = (Array.isArray(p.soaiLuc) && +p.soaiLuc[ph]) || (Array.isArray(p.soaiMoc) && +p.soaiMoc[0]) || 0; return e ? (e.alive ? `${Math.max(1, Math.round((e.hp * 100) / Math.max(1, e.hpMax)))}%` : "đã hạ") : luc > now ? `sau ${mmss(luc - now)}` : "—"; };
      tran = st.pha === "bd" ? dong("Khai chiến sau", mmss((+p.kc || 0) - now))
        : st.pha === "xong" ? dong("Kết quả", th != null ? `${PHE[th]} thắng` : "—", th != null ? (th ? "kim" : "song") : "") + dong("Về Biện Kinh", mmss(this.raLuc - now))
          : dong("Còn lại", mmss((+p.het || 0) - now)) + dong("Nguyên soái", `<span class="song">${ns(0)}</span> · <span class="kim">${ns(1)}</span>`) + (th != null ? dong("Hạ soái trước", PHE[th], th ? "kim" : "song") : "");
    }
    const qt = !st.tran || this.api.qt();
    const h = `<div class="tt">${st.tran ? "Chiến trường Tống Kim" : "Tống Kim — bãi thử"}</div>`
      + `<div class="d"><span class="song">Tống ${(p.diem || [0, 0])[0]}</span><span class="kim">${(p.diem || [0, 0])[1]} Kim</span></div>` + tran
      + dong("Phe bạn", `<b class="${st.phe ? "kim" : "song"}">${PHE[st.phe]}</b>`)
      + dong("Bạn", `${me[0]} điểm · ${CHUC[me[3] | 0] || ""}`) + dong("Hạ / chết", `${me[1]} / ${me[2]}`)
      + (tong[0] + tong[1] ? dong("Bot sống", `${song[0]}/${tong[0]} · ${song[1]}/${tong[1]}`) : "") + (qt ? dong("Chủ trận", chu) + dong("Khung hình", `${this.api.fps()} / giây`) : "")
      + (this.cho.length ? dong("Đang dựng bot", String(this.cho.length)) : "") + kk
      + (st.tran && st.pha !== "xong" ? `<div class="roi"><span data-roi="1">Rời trận</span></div>` : ""); // hết trận: tự về Biện Kinh sau raSau giây
    if (this.el.dataset.sig !== h) { this.el.dataset.sig = h; this.el.innerHTML = h; }
    if (this.el.style.display === "none") this.el.style.display = "";
    const tl = performance.now(), dt = document.body.classList.contains("dt");
    if (!dt && this.api.duoiMM && tl - this.mmLuc > 300) { this.mmLuc = tl; const y = Math.round(this.api.duoiMM()) + 6; if (y > 6 && this.mmY !== y) { this.mmY = y; this.el.style.top = y + "px"; } }
  },
  // tóm tắt cho công cụ thử
  tomTat() {
    const p = this.p, st = this.st; if (!this.laTo() || !p) return this.mo ? `${this.mo.loai === "tran" ? "Trận thật" : "Phòng thử"} mở ở bãi ${this.mo.bai} — chưa vào` : "Chưa mở";
    const song = [0, 0], binh = [0, 0]; for (const e of st.bots.values()) if (e.alive) song[e.tkPhe]++;
    for (const e of st.binh.values()) if (e.alive) binh[e.tkPhe]++;
    const tran = st.tran ? ` · trận thật, ${st.pha === "bd" ? "báo danh" : st.pha === "xong" ? "đã xong" : "đang đánh"} · quân sống ${binh[0]} / ${binh[1]}${this.D ? "" : " · CHƯA có tong-kim.json"}` : "";
    return `Bãi ${p.bai} · phe bạn ${PHE[st.phe]} · Tống ${(p.diem || [0, 0])[0]} – ${(p.diem || [0, 0])[1]} Kim · bot sống ${song[0]} / ${song[1]}${tran} · chủ trận ${p.chu || "—"} · mức ${p.tri} · hệ số sát thương ${st.hs}`;
  },
};
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
