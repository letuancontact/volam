// Nói chuyện với máy chủ chung (chay-game.js + may-chu/api.js): đăng nhập, 3 ô nhân vật, lưu nhân vật, số người trực tuyến.
//   await Net.check()            -> đã đăng nhập (cookie phiên còn) hay chưa
//   await Net.login(tên, mk) / Net.logout()
//   Net.me = { ten, admin, nv: [nhân vật | null ×3], sv }   — nv là bản mới nhất ở máy (save cập nhật ngay, gửi lên sau)
//   await Net.create(ô, nhân vật) / Net.remove(ô)
//   Net.save(nhân vật)           gom các lần lưu liền nhau, gửi sau SAVE_DELAY; Net.flush(true) gửi ngay (đóng trang: keepalive)
//   await Net.pulse(ô, trạng thái, thêm)  thấy nhau trên bản đồ: gửi vị trí / động tác / đồ mặc (+ thêm: { k: quái đã giết, chet }),
//                                  nhận { ai: người cùng bản đồ, tin: chat mới, nv / kq / tui / phat: kết quả máy chủ tính }
//   Net.leave(ô, keepalive, thêm)  rời game (người khác thôi thấy ngay); await Net.chat(ô, kênh, chữ)
//   await Net.doItem(ô, việc)      mặc / tháo / bán / bộ lọc tự bán (may-chu/do.js); await Net.devSync(ô, nhân vật) công cụ thử (quản trị)
//   Khóa an toàn (may-chu/bao-mat.js — anh 10/11): mọi yêu cầu kèm mã trang (đầu x-trang); 403 can-mk2 / can-dat-mk2 -> Net.onBaoMat hỏi
//   (src/game/khoaantoan.js) rồi gửi lại 1 lần (opt.im: gọi ngầm, không hỏi); await Net.baoMat({ viec, … }) (không tự hỏi)
// Mất phiên (tài khoản vừa đăng nhập ở nơi khác; quản trị đá / khóa / đổi mật khẩu — ma "bi-da" / "bi-khoa", câu báo có lý do): gọi
// Net.onLost(câu báo). Lưu lỗi mạng: giữ lại, lần lưu sau gửi tiếp, Net.onWarn(câu báo).
//   await Net.quanTri(việc, dữ liệu)   bảng quản trị (src/game/quantri.js — may-chu/quan-tri.js): ds | tk | xu-ly | qua | mon | thong-bao | nhat-ky

import { kyChuan, voKy } from "./an-ky.js"; // ấn ký bản gốc (anh 11/11): đăng nhập soát chữ ký
const SAVE_DELAY = 1500;
const MAT_PHIEN = new Set(["het-phien", "bi-da", "bi-khoa", "bao-tri", "chua-duyet"]); // bao-tri: máy chủ bảo trì, chỉ tài khoản quản trị (may-chu/bao-tri.js); chua-duyet: chế độ duyệt, tài khoản chưa được duyệt (may-chu/duyet.js — anh 11/11 khuya)
// Khóa an toàn (may-chu/bao-mat.js — anh 10/11): mỗi lần tải trang 1 mã ngẫu nhiên gửi kèm mọi yêu cầu (đầu x-trang) — mở khóa mật khẩu cấp 2 chỉ
// có hiệu lực cho đúng trang này (tải lại / đóng trang là khóa lại). Máy chủ trả 403 ma "can-mk2" (cần mở khóa) / "can-dat-mk2" (chưa có mật khẩu
// cấp 2): Net.onBaoMat(ma, câu) hỏi người chơi (src/game/baomat.js) -> true thì gửi lại đúng yêu cầu đó 1 lần
// chống sao chép (anh 10/11): chỉ gọi máy chủ khi trang đang ở tên miền của máy chủ (so mã băm FNV — như main.js mienDung) / máy thử / mạng LAN
const mienMay = (h) => {
  let x = 2166136261; const s = String(h).toLowerCase();
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619) >>> 0;
  // mã băm: s343clgt.duckdns.org (S2), chanlong.duckdns.org (S1 — anh 12/11)
  return x === 3220334552 || x === 2208418873 || /\.(localhost|onrender\.com)$/.test(s) || /^(localhost|127(\.\d+){3}|\[::1\]|::1|10(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2})$/.test(s);
};
const TRANG = (() => {
  const a = new Uint8Array(18); crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
})();
const HOI_MO = new Set(["can-mk2", "can-dat-mk2"]);

export const Net = {
  // kênh tức thời WebSocket (may-chu/ws.js — anh 31/10, boss thế giới máu chung): wsMo({ t: "vao", o, zone }) lúc vào game / đổi bãi (tự nối
  // lại, chờ 1 → 30 giây), wsGui(obj) -> đã gửi chưa (chưa mở thì false — người gọi gửi kèm nhịp), wsNghe(loại, fn(tin)), wsDong() lúc thoát
  ws: null, wsOk: false, _wsVao: null, _wsLan: 0, _wsNghe: new Map(),
  wsMo(vao) {
    this._wsVao = vao;
    if (this.ws && this.ws.readyState <= 1) { if (this.wsOk) this.ws.send(JSON.stringify(vao)); return; }
    const u = new URL("api/ws", location.href);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    let ws;
    try { ws = new WebSocket(u); } catch { return; }
    this.ws = ws;
    ws.onopen = () => { this.wsOk = true; this._wsLan = 0; if (this._wsVao) ws.send(JSON.stringify(this._wsVao)); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } const fn = m && this._wsNghe.get(m.t); if (fn) fn(m); };
    ws.onclose = () => {
      if (this.ws === ws) { this.ws = null; this.wsOk = false; }
      if (this._wsVao && this.me && !this.ws) setTimeout(() => { if (this._wsVao && !this.ws) this.wsMo(this._wsVao); }, Math.min(30000, 1000 * 2 ** this._wsLan++));
    };
  },
  wsGui(obj) { if (this.wsOk && this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(obj)); return true; } return false; },
  wsNghe(loai, fn) { this._wsNghe.set(loai, fn); },
  wsDong() { this._wsVao = null; const ws = this.ws; this.ws = null; this.wsOk = false; if (ws) try { ws.close(); } catch {} },
  me: null, online: 0, ping: null, onLost: null, onWarn: null, onBaoMat: null, onBatDoiMk: null, trang: TRANG,
  tinId: null, // mã tin chat cuối đã nhận (null: lần nhịp đầu nhận các tin gần nhất)
  _dirty: new Set(), _busy: false, _again: false, _timer: 0, _warnAt: 0,

  async call(method, url, body, opt = {}) {
    let r;
    if (!mienMay(location.hostname)) throw Object.assign(new Error("Không kết nối được máy chủ"), { net: true }); // chống sao chép (anh 10/11)
    // opt.timeout (ms): quá thì bỏ yêu cầu (khung khóa an toàn — mạng điện thoại chập chờn không treo cả màn hình)
    const ab = opt.timeout ? new AbortController() : null, hen = ab ? setTimeout(() => ab.abort(), opt.timeout) : 0;
    try {
      r = await fetch("api/" + url, { method, credentials: "same-origin", cache: "no-store", keepalive: !!opt.keepalive, ...(ab ? { signal: ab.signal } : {}),
        headers: { "x-trang": TRANG, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    } catch { throw Object.assign(new Error("Không kết nối được máy chủ"), { net: true }); }
    finally { if (hen) clearTimeout(hen); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = Object.assign(new Error(j.loi || `Máy chủ báo lỗi ${r.status}`), { status: r.status, ma: j.ma });
      if (MAT_PHIEN.has(e.ma) && this.me) { this.me = null; this._dirty.clear(); if (this.onLost) this.onLost(e.message); }
      if (MAT_PHIEN.has(e.ma)) e.ma = "het-phien"; // nơi gọi chỉ cần biết "mất phiên" (câu báo đã qua onLost)
      // quản trị bắt đổi mật khẩu lúc đang chơi (dòng lệnh bat-doi-mk — rà soát 10/11): thôi lưu, sang màn Đổi mật khẩu (main.js onBatDoiMk)
      if (e.ma === "bat-doi-mk" && this.me && !opt.keepalive && this.onBatDoiMk) { this._dirty.clear(); this.me.batDoiMk = 1; this.onBatDoiMk(e.message); }
      // khóa an toàn: hỏi mở khóa / đặt mật khẩu cấp 2 rồi gửi lại (máy chủ chặn trước khi làm gì — gửi lại không làm 2 lần); không hỏi được / bỏ qua
      // thì báo lỗi như cũ (e.boQua = người chơi bấm Hủy: nơi gọi khỏi hiện thêm câu báo)
      if (HOI_MO.has(e.ma) && !opt.daHoi && !opt.keepalive && !opt.im && this.onBaoMat) { // im: gọi ngầm (F10 tự tải lại) — không hỏi
        const ok = await this.onBaoMat(e.ma, e.message).catch(() => false);
        if (ok) return this.call(method, url, body, { ...opt, daHoi: true });
        e.boQua = true;
      }
      throw e;
    }
    return j;
  },
  async check() {
    try { this.me = await this.call("GET", "toi"); return true; }
    catch (e) { if (e.ma === "het-phien") return false; throw e; }
  },
  quanTri(viec, b = {}, opt) { return this.call("POST", "quan-tri/" + viec, b, opt); },
  // khóa an toàn (may-chu/bao-mat.js): { viec: "xem" | "dat" (mk1, moi) | "mo" (mk) | "khoa" | "doi" (cu, moi) | "doiMk1" (cu?, moi) } -> { co, mo, batDoiMk, msg? }
  baoMat(b) { return this.call("POST", "bao-mat", b, { daHoi: true, timeout: 15000 }); },
  async login(ten, mk) { if (kyChuan() % 9973 !== 6683) { voKy("đăng nhập mạng"); throw new Error("Bản game đã bị sửa trái phép"); } this.me = await this.call("POST", "dang-nhap", { ten, mk }); return this.me; }, // ấn ký (an-ky.js)
  async register(ten, mk) { if (kyChuan() % 9973 !== 6683) { voKy("đăng ký mạng"); throw new Error("Bản game đã bị sửa trái phép"); } this.me = await this.call("POST", "dang-ky", { ten, mk }); return this.me; },
  async logout() { await this.flush(); try { await this.call("POST", "dang-xuat"); } catch {} this.me = null; },
  async create(o, hero) { const j = await this.call("POST", "nv/" + o, { hero }); this.me.nv[o] = j.hero; return j.hero; },
  async remove(o) { await this.call("DELETE", "nv/" + o); this.me.nv[o] = null; this._dirty.delete(o); },

  async pulse(o, s, extra) {
    const t0 = performance.now(), j = await this.call("POST", "nhip", { o, s, tin: this.tinId, gh: this.ghId || 0, bhcc: this.bhcc || 0, ...extra });
    this.ping = performance.now() - t0; this.tinId = j.tinId; this.online = j.online;
    if (j.gh) this.ghId = j.gh.id; // ghim của quản trị: máy chủ chỉ gửi khi mã khác mã đang có (may-chu/api.js nhip — main.js ghimNhan)
    if (j.bhCc) this.bhcc = +j.bhCc.id || 0; // công cáo bang hội ghim (soát 14/11: không "| 0" — mã của máy chủ cũ dài 48 bit, cắt đi thì nhịp nào cũng nhận lại cả công cáo) (anh 14/11 — may-chu/bang-hoi.js nhip): như ghim quản trị, gửi lại mã đang có (main.js bhCcApply)
    return j;
  },
  leave(o, keepalive, extra) { return this.me ? this.call("POST", "nhip", { o, s: null, tin: this.tinId, ...extra }, { keepalive }).catch(() => null) : Promise.resolve(null); },
  chat(o, ch, t, u, toi) { return this.call("POST", "chat", { o, ch, t, ...(u != null ? { u } : {}), ...(toi ? { toi } : {}) }); }, // toi: tên người nhận tin mật (anh 13/11) // u: mã món khoe (main.js khoeDo)
  doItem(o, b) { return this.call("POST", "do", { o, ...b }); },
  devSync(o, hero) { return this.call("POST", "quan-tri/nv", { o, hero }); },
  thuongDN(o, b) { return this.call("POST", "thuong-dn", { o, ...b }); }, // đăng nhập nhận thưởng: {} xem | { nhan, chon? } nhận
  maQua(o, ma) { return this.call("POST", "ma-qua", { o, ma }); },
  doiPhai(o, b) { return this.call("POST", "doi-phai", { o, ...b }); }, // đổi môn phái — NPC môn phái Ba Lăng (may-chu/doi-phai.js): b = { viec: roi | nhap, phai?, chon? } // mã kích hoạt — Lễ quan (may-chu/ma-qua.js): -> { ds, loi, nv, tui }
  xepHang() { return this.call("GET", "xep-hang"); },
  ungHo() { return this.call("GET", "ung-ho"); }, // danh sách ủng hộ tác giả (may-chu/ung-ho.js — anh 12/11) // bảng xếp hạng (may-chu/xep-hang.js)
  daTau(o, b) { return this.call("POST", "da-tau", { o, ...b }); }, // Dã Tẩu (may-chu/da-tau.js): { viec, … }
  thuongOnline(o, b) { return this.call("POST", "thuong-online", { o, ...b }); },
  diemDanh7(o, b) { return this.call("POST", "diem-danh-7", { o, ...b }); },
  thuongCap(o, b) { return this.call("POST", "thuong-cap", { o, ...b }); }, // Thưởng thăng cấp (may-chu/thuong-cap.js): { viec: "mo" | "xem" | "nhan" } // Online nhận thưởng (may-chu/online.js): { viec: "mo" | "xem" | "nhan" }
  phanThan(o, b) { return this.call("POST", "phan-than", { o, ...b }); }, // Phân Thân (may-chu/phan-than.js — anh 05/11): { viec: "mo" | "thue" | "goi" | "cat", id? } -> { pt, ds?, msg?, tui?, nv? }
  phucDuyen(o, b) { return this.call("POST", "phuc-duyen", { o, ...b }); }, // phúc duyên (may-chu/phuc-duyen.js): { viec: "mo" | "nhan" | "xem" | "about" | "shop" }
  pld(o, b) { return this.call("POST", "pld", { o, ...b }); }, // Phong Lăng Độ (may-chu/phong-lang-do.js): { viec, bo?, ben?, u? }
  satThu(o, b) { return this.call("POST", "sat-thu", { o, ...b }); }, // Boss Sát thủ — Nhiếp Thí Trần (may-chu/sat-thu.js): { viec, cap?, id?, u? }
  ruongTb(o, id) { return this.call("POST", "ruong-tb", { o, id }); }, // mở Rương Thần Bí (may-chu/ruong-tb.js)
  minhChu(o, b) { return this.call("POST", "minh-chu", { o, ...b }); }, // nhiệm vụ Võ Lâm Minh Chủ (may-chu/minh-chu.js): { viec, ai?, cay? }
  tuLam(o, b) { return this.call("POST", "tu-lam", { o, ...b }); },
  phongHoa(o, b) { return this.call("POST", "phong-hoa", { o, ...b }); }, // Phong Hỏa Liên Thành — Vệ binh thành môn Biện Kinh (may-chu/phong-hoa.js): { viec: "mo" | "vao" }
  lichHd(o) { return this.call("POST", "lich-hd", { o }); }, // Hướng dẫn hoạt động (may-chu/lich-hd.js — anh 05/11): lịch + trạng thái + số lần hôm nay
  // Tra cứu (may-chu/tra-cuu.js): giữ bản đã tải, gửi ETag — máy chủ trả 304 khi chưa đổi
  async traCuu() {
    let r;
    try { r = await fetch("api/tra-cuu", { credentials: "same-origin", cache: "no-store", headers: this._tcv && this._tc ? { "If-None-Match": this._tcv } : {} }); }
    catch { throw Object.assign(new Error("Không kết nối được máy chủ"), { net: true }); }
    if (r.status === 304 && this._tc) return this._tc;
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.loi || `Máy chủ báo lỗi ${r.status}`), { status: r.status, ma: j.ma }); }
    this._tc = await r.json(); this._tcv = r.headers.get("ETag") || this._tc.v; return this._tc;
  },
  phongHoaQt(b) { return this.call("POST", "phong-hoa-qt", b); }, // Phong Hỏa Liên Thành — quản trị thử: { viec: "mo" (baoDanh?, danh?, chuSoai?) | "huy" | "ket" | "xem" } // Trợ Thủ tự làm nhiệm vụ ngày (may-chu/tu-lam.js): { viec: "mo" (+ loai) | "dt" | "st", … }
  tongKimQt(b) { return this.call("POST", "tong-kim-qt", b); }, // Tống Kim bãi thử (chỉ quản trị — may-chu/tong-kim.js quanTri): { viec: "mo" (bai, trai, soBot, tri, cap, hs, moi) | "huy" | "xem" | "phe" | "soBot" | "tri" | "hs" } + trận thật (đợt 2): "moTran" (baoDanh, danh, soai1, soai2 — phút) | "ketTran" | "huyTran"
  // Tống Kim trận thật (anh 06/11 — may-chu/tong-kim.js lam): Mộ binh quan / Quân Nhu quan Biện Kinh: { viec: "mo" | "phe" (x = 0 Tống | 1 Kim) | "vao" | "luat" |
  // "qn" | "shop" | "duc" | "ducOk" } -> { say?: { text, opts: [[nhãn, việc, x?]] }, talk?: { text }, vao?: { zone, at }, shop?: { hang: [[k, giá]], diem }, tin?, nv?, tui? }
  tongKim(o, b) { return this.call("POST", "tong-kim", { o, ...b }); },
  // Lôi Đài Công Bình Tử (anh 15/11 — may-chu/loi-dai.js lam, THIET-KE-LOI-DAI.md 2.3): { viec: "mo" | "luat" | "bd" | "bd:N" | "vao" (khoa?) | "so" | "xem" | "xem:N" |
  // "roi" | "dangNhap" | "trangThai" } -> { say?: { text, opts: [[nhãn, viec | null]] }, talk?: { text }, vao?: { zone, at, xem? }, ve?: { z, at }, msg?, can?: "khoa",
  // ldp? (trạng thái như tin ws "ld"), nv }. opt: { im, timeout } của call (hỏi trạng thái ngầm — loidai.js)
  loiDai(o, b, opt) { return this.call("POST", "loi-dai", { o, ...b }, opt); },
  // Lôi đài trận thử với bot (anh 16/11 — chỉ quản trị, may-chu/loi-dai.js thu — THIET-KE-LOI-DAI.md mục 6): { viec: "mo", o, che, ben, doiThu, dongDoi, cap, chuanBi,
  // thiDau } | { viec: "huy" } -> { vao?: { zone, at }, msg?, nv? }
  loiDaiQt(b) { return this.call("POST", "loi-dai-qt", b); },
  // Tỉ thí (anh 17/11 — may-chu/ti-thi.js): { viec: "gui" (ten, cau) | "nhan" (id) | "tuChoi" (id) | "vao" | "luat" } -> { msg?, vao?: { zone, at }, ttGui?, tiThi?, nv }
  tiThi(o, b) { return this.call("POST", "ti-thi", { o, ...b }); },
  // Truy Phong Đại Loạn Đấu — đua ngựa (anh 16/11 — may-chu/dua-ngua.js lam): { viec: "mo" | "gioiThieu" | "baoDanh" | "hop" (u) | "dung" (i) | "dich" | "roi" | "nhan" | "xem" }
  // -> { say?: { text, opts: [[nhãn, viec | null]] }, vao?: { zone, at }, ve?: { z, at }, tin?: [câu], thuong?, s? (trạng thái như tin ws "dng"), nv, tui }
  duaNgua(o, b, opt) { return this.call("POST", "dua-ngua", { o, ...b }, opt); },
  // đua ngựa — lượt thử của công cụ thử (chỉ quản trị — dua-ngua.js thu): { viec: "mo" (phut, dua, bot) | "bot" (n) | "batDau" | "hop" | "doCu" (id) | "di" (moc) | "ket" | "xoa" | "xem" }
  duaNguaQt(b) { return this.call("POST", "dua-ngua-qt", b); },
  // Báo Đáp Ân Sư (anh 16/11 — may-chu/bao-dap-an-su.js lam): Võ Sư / Chưởng Đăng Cung Nữ (Ba Lăng): { viec: "tt" | "moiRuou" (n) | "dang" (n) | "doi" (loai tt|ns|td, n) |
  // "muaTo" (n) } -> { bdas? (tt: dang, moHb, tu, den, moHet, ruou { kn, tran }, dang { da, toiDa }, knHb { da, tran }, giaTo), msg?, kn? (số kinh nghiệm vừa nhận), tra?, nv, tui }
  baoDapAnSu(o, b, opt) { return this.call("POST", "bao-dap-an-su", { o, ...b }, opt); },
  // khảm nạm Thủy tinh (anh 17/11 — may-chu/kham-nam.js): { viec: tt | kham (u, da, oKham) | muaHl (n) } -> { ok?, loai?, u?, msg?, tin?, daiCat?, khamNam } + nv, tui
  khamNam(o, b, opt) { return this.call("POST", "kham-nam", { o, ...b }, opt); },
  phuQuy(o, b) { return this.call("POST", "phu-quy", { o, ...b }); }, // Phú Quý Cẩm Hạp — Thần Tài (may-chu/phu-quy.js): { viec, n? }
  bauCua(o, b) { return this.call("POST", "bau-cua", { o, ...b }); }, // Bầu Cua — Chủ sòng bạc (may-chu/bau-cua.js): { viec: "mo" | "luat" | "xem" | "dat" (cua, n) }
  tayTuy(o, b) { return this.call("POST", "tay-tuy", { o, ...b }); }, // đảo Tẩy Tủy — Xa phu / Thích Minh (may-chu/tay-tuy.js): { viec }
  vuotAi(o, b) { return this.call("POST", "vuot-ai", { o, ...b }); }, // Vượt Ải trong ải (may-chu/vuot-ai.js): { viec: "ra" | "chet" | "xem" }
  viemDe(o, b) { return this.call("POST", "viem-de", { o, ...b }); }, // Viêm Đế Bảo Tàng (may-chu/viem-de.js): { viec, n? }
  nhatChiaSe(o, b) { return this.call("POST", "nhat-chia-se", { o, ...b }); }, // tham khảo cài đặt Nhặt đồ (may-chu/nhat-chia-se.js): { viec: "ds" | "chiaSe" | "go", nhat? } -> { ds, toi }
  doi(o, b) { return this.call("POST", "doi", { o, ...b }); }, // tổ đội (may-chu/to-doi.js): { viec: "lap" | "moi" | "nhan" | "tuChoi" | "roi" | "duoi" | "giao" | "giai", ten?, id? }
  // bang hội (anh 14/11 — may-chu/bang-hoi.js, THIET-KE-BANG-HOI.md 1.8): { viec: "xem" | "ds" | "lap" (ten, phe) | "xin" / "huyXin" (id) | "duyet" (ten, dong) | "moi" (ten) |
  // "nhanMoi" (id, dong) | "roi" | "duoi" (ten) | "boNhiem" (ten, cv) | "chuyenVi" (ten) | "thoaiAn" | "huyAn" | "epAn" (ten) | "danhHieu" (ten, dh) | "dhChung" (nam, nu) |
  // "congCao" (m) | "chieuMo" (kh, hd, tin, tuNhan, tuChoi) | "quyen" (q) | "giaiTan" } -> { bh?: BangXem | null, ds?, msg?, tin?, nv?, tui? }. Việc cần mật khẩu cấp 2
  // (chuyển vị, giải tán, trục xuất): máy chủ trả 403 can-mk2 -> call tự hỏi rồi gửi lại
  bangHoi(o, b) { return this.call("POST", "bang-hoi", { o, ...b }); },
  // giao dịch (may-chu/giao-dich.js — anh 30/10): { viec: "mo" | "xin" | "nhan" | "tuChoi" | "dat" | "tien" | "khoa" | "xn" | "huy", ten?, id?, on?, ds?, n? } -> { gd, msg?, nv?, tui? }
  giaoDich(o, b) { return this.call("POST", "giao-dich", { o, ...b }); },
  xemDo(o, ten) { return this.call("POST", "xem-do", { o, ten }); }, // xem trang bị người chơi ở gần (may-chu/api.js xemDo) -> { nv }
  cho(o, b) { return this.call("POST", "cho", { o, ...b }); }, // chợ trời (may-chu/cho-troi.js): { viec: "toi" | "loiRao" | "dinhGia" | "thuHoi" | "mo" | "xem" | "mua" | "ds", … }
  devHoatDong(o, b) { return this.call("POST", "quan-tri/hoat-dong", { o, ...b }); }, // công cụ thử: { hd: "pld" | "dt" | "st" | "va", viec, … }
  devUyThac(o, b) { return this.call("POST", "quan-tri/uy-thac", { o, ...b }); }, // công cụ thử: ủy thác ngay / xem trạng thái ủy thác

  save(hero) {
    if (!this.me || !hero) return;
    const o = hero.slot | 0;
    this.me.nv[o] = JSON.parse(JSON.stringify(hero));
    this._dirty.add(o);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), SAVE_DELAY);
  },
  async flush(keepalive) {
    clearTimeout(this._timer);
    if (!this.me || !this._dirty.size) return;
    if (this._busy && !keepalive) { this._again = true; return; }
    const list = [...this._dirty]; this._dirty.clear(); this._busy = true;
    try {
      for (const o of list) {
        const h = this.me && this.me.nv[o]; if (!h) continue;
        try { const j = await this.call("PUT", "nv/" + o, { hero: h }, { keepalive }); if (j.online) this.online = j.online; }
        catch (e) {
          if (e.ma === "het-phien") return;
          if (e.net) this._dirty.add(o); // mất mạng: giữ lại, lần lưu sau gửi tiếp
          const t = Date.now();
          if (this.onWarn && t - this._warnAt > 30000) { this._warnAt = t; this.onWarn("Chưa lưu được lên máy chủ: " + e.message); }
        }
      }
    } finally {
      this._busy = false;
      if (this._again) { this._again = false; this.flush(); }
    }
  },
};
