// Quái chung ở bãi train — phía trình duyệt (anh 02/11: "em làm thử bãi Lâm Du Quan đi, anh check thử" — may-chu/quai-chung.js; dựng theo quái
// chung Vượt Ải tổ đội src/game/vadoi.js). Bãi trong luat().quaiChung.bai: World không tự sinh quái (suKien — main.js); máy chủ gửi trạng thái
// p = { bai, chu (tên máy chủ bãi), tv: [tên người trong bãi], cap (số quái), sv (bản danh sách), hp: [[mã, máu]], dan: [[mã, tên người vừa đánh]],
// ack, gio, q?: [[mã, mẫu, cấp, hệ, máu tối đa, x, y, thủ lĩnh, tinh anh, số hiệu Boss Sát thủ]], vt?: [[mã, x, y, tên mục tiêu]] }.
// Boss Sát thủ chung (anh 03/11 — may-chu/quai-chung.js satBai: máy chủ sinh khi có người trong bản chung đang nhận nhiệm vụ boss đó): dựng như
// boss nhiệm vụ cũ (main.js datBossSat — tên cam "BOSS Sát thủ - tên", chỉ số mẫu của chính nó, bậc từ doKho.tuCap: sát thương / chính xác / né
// tránh đặt sẵn — w.satDat), máu máy chủ gửi; không nhân quaiChung.manh, không tính vào số quái / đếm thủ lĩnh, tinh anh.
// Mọi máy sinh cùng các con (mã) ở cùng chỗ, nhưng:
//   - chủ bãi sinh quái khi thiếu (World.spawnMob thử rồi gửi mẫu / cấp / hệ / máu / chỗ — máy chủ cấp mã, gửi lại cho cả bãi), ra thủ lĩnh / tinh anh
//     theo số con đã hạ như World.kill, tự chạy quái như bản 1 người;
//   - mục tiêu từng con do chủ bãi chọn (người vừa đánh nó / người đứng trong tầm nhìn; mục tiêu chạy quá xa chỗ đứng của con đó thì bỏ), báo chỗ
//     đứng + mục tiêu + số đòn đã vung 10 lần / giây kèm đồng hồ máy chủ bãi (con nào đổi mới báo, mỗi giây báo đủ);
//   - máy khác (anh 02/11 "giữa 2 acc vẫn còn lag và delay, không mượt như game gốc" — bản đầu tự chạy quái rồi kéo nhảy về chỗ chủ bãi báo): con
//     đuổi chính mình thì máy mình tự chạy (đòn trúng đúng chỗ, không trễ); con khác vẽ theo chủ bãi — chỗ đứng nội suy giữa 2 lần báo ở thời điểm
//     (bây giờ − trễ) như người chơi khác (World.updateOther), số đòn tăng thì vung đòn (ngoai);
//   - chỉ máy của người bị đánh trừ máu người đó (World.updateMob — m.vaDoi như boss thế giới / Vượt Ải);
//   - máu = máu chung − phần mình vừa đánh mà máy chủ chưa nhận (đoán trước), máy mình không tự hạ (≥ 1) — máy chủ báo chết; đòn hạ (máu đoán ≤ 0)
//     thì gửi ngay + hạ luôn ở máy mình (máy chủ không nhận đòn đó thì DOAN_MS sau con đó hiện lại); choáng / chậm mình gây gửi kèm sát thương,
//     máy khác đặt theo.
//   QuaiChung.ganWorld(w | null) · capNhat(p) · viTri(q, ts) · trangThai(st) · trung(m, v) · ttMoi(m) · ngoai(m, dt) · tick() mỗi khung hình · layNhip()
// Anh 03/11 (bãi chính mỗi dãy cấp có bản quái riêng + bản quái chung — main.js loadZone opt.chung): máy chủ gửi gọn cho đỡ tốn mạng — máu chỉ con
// đổi (hd, đủ hp mỗi giây), danh sách chỉ phần đổi (qd = { tu: bản cũ, a: dòng q thêm, x: mã bỏ }); chủ bãi báo đủ vị trí mỗi VT_DU_MS. Bản đồ dựng
// nguyên (Phong Lăng Độ — World.diem): chủ bãi sinh quái quanh 1 người trong bãi chọn ngẫu nhiên, con ở quá xa mọi người thì xin bỏ ("qcBo")
import { Net } from "./net.js";
import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import { buocVe } from "./world.js"; // đồng hồ vẽ êm (anh 05/11 — như người chơi khác)

const GUI_MS = 80, VT_MS = 100, VT_DU_MS = 3000, CHON_MS = 250, DAT_MS = 250, BO_CHO = 1500, SINH_MS = 600, SONG_MS = 2000, DOAN_MS = 1500;
const XA_MS = 2000, XA_R = 2700; // bản đồ dựng nguyên: mỗi XA_MS xin bỏ con xa mọi người quá XA_R (world.js DIEM_R + 600 — boQuaiXa)
// con đuổi mình (máy mình tự chạy) mà lệch chỗ chủ bãi báo quá KEO_GAN thì đặt thẳng; vừa thôi đuổi mình thì trượt về chỗ chủ bãi trong TRON_MS
const KEO_GAN = 400, TRON_MS = 300;
// vẽ quái theo chủ bãi: trễ = khoảng cách 2 lần báo + độ chậm mạng lúc nhanh lúc chậm (nhớ × VE_NHO mỗi lần) + VE_DU — như người chơi khác
// (world.js OTHER_DU), tối đa VE_MAX giây; giữ VE_GIU lần báo mỗi con
const VE_DU = 0.05, VE_MAX = 1, VE_NHO = 0.98, VE_GIU = 12;
// anh 06/11 ("quái đánh vẫn lag và giật nhảy, không có tính đều đặn"): chủ bãi báo ngay con vừa vung đòn (cách nhau ≥ DON_MS — trước chờ nhịp 100 ms
// nên máy khác vung lệch 0–120 ms mỗi đòn); máy khác chọn đi / chạy theo tốc độ đoạn đang vẽ (không theo bước khung — khung lúc dài lúc ngắn làm
// chớp đi <-> chạy), đổi khi lệch quá DI_TRE so với ngưỡng giữa, tốc độ bám êm trong DI_BAM giây
const DON_MS = 30, DI_TRE = 0.15, DI_BAM = 0.2;
// chủ bãi: con chưa có mục tiêu thỉnh thoảng đi loanh quanh chỗ đứng (như quái thường — World.updateMob đi lang thang: 3–8 giây, 30–110 điểm)
const LANG_GIAY = [3, 8], LANG_R = [30, 110];
const THU_LINH_MOI = 250, TINH_ANH_MOI = 50; // như world.js khi bãi không ghi canBang.thuLinhMoi / tinhAnhMoi

export const QuaiChung = {
  p: null, w: null, spec: null, mob: new Map(), vt: new Map(), qb: new Map(), dh: null, hpSv: new Map(), lech: 0, seq: 0, cho: new Map(), choPt: new Map(), st: new Map(), // choPt: sát thương phân thân (anh 05/11 — gửi mục dp)
  daTT: new Map(), gui: [], dan: new Map(), chuCu: null,
  guiLuc: 0, vtLuc: 0, vtDuLuc: 0, donLuc: 0, chonLuc: 0, datLuc: 0, xinLuc: 0, sinhLuc: 0, songLuc: 0, xaLuc: 0, demBoss: 0, demTA: 0,

  laTo() { return !!(this.p && this.w && this.w.zone.id === this.p.bai); },
  laChu() { return this.laTo() && this.p.chu === this.w.hero.name; },
  ganWorld(w) {
    this.w = w; this.p = null; this.spec = null; this.mob = new Map(); this.vt = new Map(); this.qb = new Map(); this.dh = null; this.hpSv = new Map();
    this.cho.clear(); this.choPt.clear(); this.st.clear(); this.daTT.clear(); this.dan.clear(); this.gui = []; this.chuCu = null;
    this.demBoss = 0; this.demTA = 0;
    if (w) { this.xinLuc = 0; this.xin(); }
  },
  // xin máy chủ gửi đủ trạng thái (vào bãi, nối lại kênh) — kèm báo tab ẩn / hiện
  xin() { const t = performance.now(); if (t - this.xinLuc > 1000) { this.xinLuc = t; this.songLuc = t; Net.wsGui({ t: "qcVao", s: this.seq }); Net.wsGui({ t: "qcAn", an: document.hidden ? 1 : 0 }); } }, // s: số tin sát thương đã đếm (tải lại trang: 0)

  capNhat(p) {
    if (!this.w || !p || p.bai !== this.w.zone.id) return;
    if (this.p && p.gio < this.p.gio) return; // tin tới chậm: bỏ bản cũ
    this.lech = p.gio - Date.now();
    if (p.q) { this.spec = { sv: p.sv, q: p.q }; const t = performance.now(); for (const r of p.vt || []) this.vt.set(r[0], { x: r[1], y: r[2], muc: r[3] || null, luc: t }); }
    else if (p.qd) {
      // danh sách đổi từ bản qd.tu: áp lên bản đang có; lệch bản (vừa nối lại kênh…) -> xin đủ danh sách
      if (this.spec && this.spec.sv === p.qd.tu) {
        const M = new Map(this.spec.q.map((r) => [r[0], r]));
        for (const u of p.qd.x) { M.delete(u); this.hpSv.delete(u); }
        for (const r of p.qd.a) M.set(r[0], r);
        this.spec = { sv: p.sv, q: [...M.values()] };
      } else { this.xinLuc = 0; this.xin(); }
    }
    for (const [u, ten] of p.dan || []) this.dan.set(u, ten);
    if (p.hp) this.hpSv = new Map(p.hp); else for (const [u, v] of p.hd || []) this.hpSv.set(u, v); // hd: chỉ con đổi máu
    this.p = p;
    this.gui = this.gui.filter((g) => g.s > (p.ack | 0));
    this.dat();
  },

  // phần mình đã đánh con uid mà máy chủ chưa nhận (chưa gửi + đang trên đường)
  doan(uid) { let v = (this.cho.get(uid) || 0) + (this.choPt.get(uid) || 0); for (const g of this.gui) v += (g.d.get(uid) || 0) + ((g.dp && g.dp.get(uid)) || 0); return v; },

  // sinh / bỏ / hạ / đặt máu các con trên World theo trạng thái máy chủ
  dat() {
    const w = this.w; if (!this.laTo() || !this.spec) return;
    const t = performance.now(), hp = this.hpSv, co = new Set(this.spec.q.map((s) => s[0]));
    this.datLuc = t;
    for (const [u, m] of this.mob) {
      if (co.has(u)) continue;
      if (m.alive) { m.alive = false; const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); if (w.player.target === m) w.player.target = null; } // máy chủ đã dọn
      this.mob.delete(u); this.qb.delete(u);
    }
    for (const s of this.spec.q) {
      const uid = s[0], mau = hp.get(uid) ?? 0;
      let m = this.mob.get(uid);
      // đã hạ trước ở máy mình (đòn hạ — trung) mà máy chủ vẫn báo còn sống quá DOAN_MS (không nhận đòn đó): bỏ bản đã hạ, dựng lại con đó
      if (m && !m.alive && m.duDoan && !m.daDem && mau > 0 && t - m.duDoan > DOAN_MS) { const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); this.mob.delete(uid); m = null; }
      if (!m) {
        if (mau <= 0) continue;
        const v = this.vt.get(uid);
        const sb = s[9] && w.P.satThu ? w.P.satThu.boss[s[9]] : null; // Boss Sát thủ chung
        m = w.spawnMob(!!s[7], 0, { id: s[1], lvl: s[2], series: s[3], at: v ? [v.x, v.y] : [s[5], s[6]], ...(s[8] ? { ta: true } : {}), ...(sb ? { sat: s[9], ten: `BOSS Sát thủ - ${sb.ten}` } : {}) });
        if (!m) continue;
        Object.assign(m, { vaDoi: uid, qc: 1, hpMax: s[4], hp: Math.min(s[4], mau), home: [s[5], s[6]], mucTen: null, muc: null, aggro: false });
        const D = sb && w.satDat ? w.satDat[sb.cap] : null;
        if (D) { m.dmg = D.st.slice(); m.ar = D.ar; m.def = D.def; }
        // quái bản chung mạnh hơn (anh 03/11 "mạnh hơn 50% bao gồm cả tần suất tấn công" — luật quaiChung.manh; máu máy chủ đã nhân): sát thương ×
        // satThuong; tocDanh: vung đòn + chờ giữa 2 đòn ÷ tocDanh, hình vung đòn chạy nhanh theo (world.js updateMob / mobDrawOpt, ngoai). Boss
        // Sát thủ chung giữ chỉ số boss nhiệm vụ (không nhân)
        const K = sb ? null : w.qcManh;
        if (K) { m.dmg = m.dmg.map((v) => Math.round(v * (+K.satThuong || 1))); m.tocDanh = Math.max(1, +K.tocDanh || 1); }
        this.mob.set(uid, m);
      }
      if (mau <= 0) { if (!m.daDem) { m.daDem = 1; this.chet(m); } continue; }
      if (!m.alive) continue;
      m.hp = Math.max(1, Math.min(m.hpMax, mau - this.doan(uid)));
    }
  },
  // máy chủ báo chết: hạ trên World nếu chưa hạ trước (không báo giết — thưởng máy chủ phát); chủ bãi đếm để ra thủ lĩnh / tinh anh như World.kill
  chet(m) {
    const w = this.w; if (m.alive) w.kill(m);
    if (!this.laChu() || m.sat) return; // Boss Sát thủ chung: không đếm ra thủ lĩnh / tinh anh
    this.demBoss = m.boss ? 0 : this.demBoss + 1; this.demTA = m.ta ? 0 : this.demTA + 1;
    const cb = w.canBang || {}, Z = w.zone, song = [...this.mob.values()].filter((x) => x.alive), ds = [];
    if (!m.boss && this.demBoss >= (cb.thuLinhMoi || THU_LINH_MOI) && Z.boss != null && !song.some((x) => x.boss)) { const s = this.thu(true, {}); if (s) { ds.push(s); this.demBoss = 0; } }
    if (!m.ta && this.demTA >= (cb.tinhAnhMoi || TINH_ANH_MOI) && cb.ta && cb.ta[Z.id] && !song.some((x) => x.ta)) { const s = this.thu(false, { ta: true }); if (s) { ds.push(s); this.demTA = 0; } }
    if (ds.length) Net.wsGui({ t: "qcSinh", ds });
  },
  // chủ bãi: sinh thử 1 con trên World (chỗ đi được, tránh sát mình / sát quái khác, cấp / hệ / máu như quái riêng) rồi bỏ ra — gửi máy chủ cấp mã.
  // Bản đồ dựng nguyên (World.diem): quanh 1 người trong bãi chọn ngẫu nhiên — người đứng xa chủ bãi cũng có quái
  thu(boss, opt) {
    const w = this.w;
    if (w.diem) { const ds = [w.player, ...w.others.values()], c = ds[Math.floor(Math.random() * ds.length)]; opt = { ...opt, quanh: [c.x, c.y] }; }
    const m = w.spawnMob(boss, boss || opt.ta ? 400 : 200, opt); if (!m) return null;
    const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1);
    return [m.id, m.lvl, m.series, m.hpMax, Math.round(m.x), Math.round(m.y), boss ? 1 : 0, m.ta ? 1 : 0];
  },
  boSung() {
    const song = [...this.mob.values()].filter((m) => m.alive && !m.boss && !m.ta && !m.sat).length, thieu = Math.min(4, (this.p.cap | 0) - song), ds = [];
    for (let i = 0; i < thieu; i++) { const s = this.thu(false, {}); if (s) ds.push(s); }
    if (ds.length) Net.wsGui({ t: "qcSinh", ds });
  },
  // chủ bãi, bản đồ dựng nguyên: con thường chưa có mục tiêu đứng xa mọi người trong bãi quá XA_R -> xin máy chủ bỏ (boSung sinh lại quanh người)
  boXa() {
    const w = this.w, ds = [w.player, ...w.others.values()], u = [];
    for (const m of this.mob.values()) if (m.alive && !m.boss && !m.ta && !m.sat && !m.mucTen && !ds.some((o) => ldist(m.x, m.y, o.x, o.y) <= XA_R)) u.push(m.vaDoi);
    if (u.length) Net.wsGui({ t: "qcBo", u });
  },

  // chủ bãi báo (máy chủ chuyển — "qch"): q = [[mã, x, y, tên mục tiêu | "", số đòn đã vung]], ts = đồng hồ máy chủ bãi (ms) -> chỗ mới nhất + mục
  // tiêu (theoChu) và hàng chờ vẽ từng con (ngoai). Đo trễ như World._moc: lần tới nhanh nhất làm gốc, độ chậm nhớ × VE_NHO; con đứng yên một
  // lúc (chủ bãi không báo) mà nay báo chỗ khác: thêm mốc "còn ở chỗ cũ" ngay trước lần báo này — không trượt chậm suốt quãng nghỉ
  viTri(q, ts, don) {
    const t = performance.now(), now = t / 1000, T = ts > 0 ? ts / 1000 : now, chu = this.p ? this.p.chu : null;
    let D = this.dh, nho = VE_NHO;
    if (!D || D.chu !== chu || T <= D.last - 10 || T - D.last > 10) { D = this.dh = { off: now - T, lag: 0.15, gap: VT_MS / 1000, last: T, lastReg: T, chu }; this.qb.clear(); }
    else if (T > D.last) {
      // anh 06/11: tin báo đòn chen giữa nhịp 100 ms — khoảng cách mốc chỉ đo giữa các tin cách ≥ 0,8 nhịp (lastReg = tin theo nhịp gần nhất — đồng hồ vẽ
      // chỉ bám tới đó: tin báo đòn chỉ có con vừa vung, con đang chạy có mốc mới nhất ở tin theo nhịp — soát 06/11); độ chậm quên theo thời gian
      const kc = T - D.last, kr = T - (D.lastReg ?? D.last);
      if (!don && kr >= (VT_MS / 1000) * 0.8) { D.gap = D.gap * 0.8 + Math.min(1, kr) * 0.2; D.lastReg = T; } // don: tin báo đòn (dấu d — baoViTri)
      nho = VE_NHO ** Math.min(10, kc / (VT_MS / 1000)); D.last = T;
    }
    const age = now - T; D.off = Math.min(D.off, age); D.lag = Math.max(D.lag * nho, age - D.off);
    for (const r of q || []) {
      this.vt.set(r[0], { x: r[1], y: r[2], muc: r[3] || null, luc: t });
      const B = this.qb.get(r[0]) || this.qb.set(r[0], []).get(r[0]), z = B[B.length - 1];
      if (z && T <= z.T) continue;
      if (z && T - z.T > D.gap * 1.5 + 0.05 && (z.x !== r[1] || z.y !== r[2])) B.push({ T: T - D.gap, x: z.x, y: z.y, n: z.n });
      B.push({ T, x: r[1], y: r[2], n: r[4] | 0 });
      if (B.length > VE_GIU) B.splice(0, B.length - VE_GIU);
    }
  },
  // choáng / chậm người khác gây: [[mã, choáng ms, chậm ms]]
  trangThai(st) {
    const w = this.w; if (!w) return;
    for (const [uid, a, b] of st || []) {
      const m = this.mob.get(uid); if (!m || !m.alive) continue;
      if (a > 0) m.stunUntil = Math.max(m.stunUntil || 0, w.time + a / 1000);
      if (b > 0) m.slowUntil = Math.max(m.slowUntil || 0, w.time + b / 1000);
      this.daTT.set(uid, [m.stunUntil || 0, m.slowUntil || 0]); // không gửi lại cái vừa nhận
    }
  },

  // World.hit: sát thương mình (pt: của phân thân mình — gửi riêng mục dp) gây cho con m (đã trừ ở máy mình). Đòn hạ (máu chung − phần mình chưa được nhận ≤ 0 — anh 02/11 "delay"): gửi ngay,
  // khung kế hạ luôn ở máy mình (tick — đang giữa World.hit), không chờ máy chủ báo
  trung(m, v, pt) {
    if (!this.laTo() || !this.mob.has(m.vaDoi)) return;
    const C = pt ? this.choPt : this.cho; C.set(m.vaDoi, (C.get(m.vaDoi) || 0) + v);
    if (this.laChu() && !m.mucTen) { m.mucTen = this.w.hero.name; this.keo(m); } // chủ bãi đánh con chưa có mục tiêu: nó đuổi mình ngay
    const mau = this.hpSv.get(m.vaDoi);
    if (mau != null && !m.duDoan && mau - this.doan(m.vaDoi) <= 0) { m.duDoan = performance.now(); this.guiNgay(); }
  },
  // vocong.js / World: con m vừa bị choáng / làm chậm ở máy mình -> gửi kèm sát thương (chỉ khi dài hơn lần đã gửi / đã nhận)
  ttMoi(m) {
    const w = this.w; if (!this.laTo() || !this.mob.has(m.vaDoi)) return;
    const su = m.stunUntil || 0, sl = m.slowUntil || 0, cu = this.daTT.get(m.vaDoi) || [0, 0];
    if (su <= cu[0] + 0.05 && sl <= cu[1] + 0.05) return;
    this.daTT.set(m.vaDoi, [Math.max(su, cu[0]), Math.max(sl, cu[1])]);
    this.st.set(m.vaDoi, [Math.max(0, Math.round((su - w.time) * 1000)), Math.max(0, Math.round((sl - w.time) * 1000))]);
  },
  // kênh chưa mở: phần chưa gửi đi kèm nhịp (b.qcd — api.js)
  layNhip() { return Net.wsOk || !this.laTo() || (!this.cho.size && !this.choPt.size && !this.st.size) ? null : this.goi(); },
  goi() {
    const s = ++this.seq, d = [...this.cho].map(([u, v]) => [u, Math.round(v)]), dp = [...this.choPt].map(([u, v]) => [u, Math.round(v)]), st = [...this.st].map(([u, [a, b]]) => [u, a, b]);
    this.gui.push({ s, d: new Map(this.cho), dp: new Map(this.choPt), luc: performance.now() }); this.cho.clear(); this.choPt.clear(); this.st.clear();
    return { s, d, ...(dp.length ? { dp } : {}), ...(st.length ? { st } : {}) };
  },
  guiNgay() { if (Net.wsOk && (this.cho.size || this.choPt.size || this.st.size)) { this.guiLuc = performance.now(); Net.wsGui({ t: "qcd", ...this.goi() }); } },

  // mỗi khung hình (main.js hud — tab ẩn: theo đồng hồ nền)
  tick() {
    if (!this.w) return;
    const t = performance.now();
    if (t - this.songLuc >= SONG_MS) { this.songLuc = t; Net.wsGui({ t: "qcAn", an: document.hidden ? 1 : 0 }); } // báo sống: máy chủ chọn chủ bãi còn chạy
    if (!this.laTo()) return this.xin();
    if (t - this.datLuc >= DAT_MS) this.dat();
    for (const m of this.mob.values()) if (m.alive && m.duDoan) this.w.kill(m); // đòn hạ vừa đánh (trung)
    if ((this.cho.size || this.choPt.size || this.st.size) && t - this.guiLuc >= GUI_MS) this.guiNgay();
    if (this.gui.length && t - this.gui[0].luc > BO_CHO) this.gui = this.gui.filter((g) => t - g.luc <= BO_CHO); // gửi mà máy chủ không nhận (kênh đứt): thôi đoán
    // đổi chủ bãi: đồng hồ người báo khác — đo lại; mình làm chủ bãi thì mọi con tự chạy
    const chu = this.laChu();
    if (chu !== this.chuCu) { this.chuCu = chu; this.dh = null; this.qb.clear(); for (const m of this.mob.values()) { m.ngoai = false; m.tron = null; m.atkThay = null; } }
    if (chu) {
      if (t - this.chonLuc >= CHON_MS) { this.chonLuc = t; this.chonMuc(); this.langThang(t); }
      if (t - this.vtLuc >= VT_MS) { this.vtLuc = t; this.baoViTri(t); }
      else if (t - this.donLuc >= DON_MS) { this.donLuc = t; this.baoViTri(t, true); } // con vừa vung đòn: báo ngay (nhịp 100 ms giữ nguyên)
      if (t - this.sinhLuc >= SINH_MS) { this.sinhLuc = t; this.boSung(); }
      if (this.w.diem && t - this.xaLuc >= XA_MS) { this.xaLuc = t; this.boXa(); }
    } else { this.dongHoVe(t); this.theoChu(); }
    const w = this.w, ten = w.hero.name;
    for (const m of this.mob.values()) if (m.alive) m.muc = m.mucTen ? (m.mucTen === ten ? w.player : w.others.get(m.mucTen) || null) : null;
  },

  // người còn sống đang thấy ở bãi: [[tên, đối tượng World]]
  ungVien() {
    const w = this.w, ds = [];
    if (w.player.hp > 0) ds.push([w.hero.name, w.player]);
    for (const [n, o] of w.others) if (o.hp > 0 && o.act !== "die") ds.push([n, o]);
    return ds;
  },
  // chủ bãi: chọn mục tiêu cho từng con — người vừa đánh nó, không thì người gần nhất trong tầm nhìn; mục tiêu chạy quá xa chỗ đứng của con đó
  // (tầm đuổi × 1,5) thì bỏ, con đó về chỗ (langThang)
  chonMuc() {
    const ds = this.ungVien(), co = (n) => n && ds.find((x) => x[0] === n);
    const gan = (m, R) => { let b = null, bd = R; for (const x of ds) { const d = ldist(m.x, m.y, x[1].x, x[1].y); if (d <= bd) { bd = d; b = x; } } return b; };
    const dan = this.dan; this.dan = new Map();
    for (const m of this.mob.values()) {
      if (!m.alive) continue;
      const cu = co(m.mucTen);
      if (cu && m.home && ldist(cu[1].x, cu[1].y, m.home[0], m.home[1]) > (m.active || 600) * 1.5) { m.mucTen = null; continue; }
      if (cu) continue;
      const nd = dan.get(m.vaDoi), moi = !m.mucTen;
      if (co(nd)) m.mucTen = nd;
      else { const g = gan(m, m.mucTen ? Infinity : m.vision || 160); m.mucTen = g ? g[0] : null; }
      if (moi && m.mucTen) this.keo(m);
    }
  },
  // con chưa có mục tiêu đi loanh quanh chỗ đứng như quái thường; ở xa chỗ đứng (vừa bỏ đuổi) thì tìm đường về
  langThang(t) {
    const w = this.w;
    for (const m of this.mob.values()) {
      if (!m.alive || m.mucTen || (m.path && m.path.length) || !m.home) continue;
      if (ldist(m.x, m.y, m.home[0], m.home[1]) > 150) { m.path = w.map.path(m.x, m.y, m.home[0], m.home[1], 3000) || null; continue; }
      if (!m.langLuc) { m.langLuc = t + (LANG_GIAY[0] + Math.random() * (LANG_GIAY[1] - LANG_GIAY[0])) * 1000; continue; }
      if (t < m.langLuc) continue;
      m.langLuc = t + (LANG_GIAY[0] + Math.random() * (LANG_GIAY[1] - LANG_GIAY[0])) * 1000;
      const a = Math.random() * Math.PI * 2, r = LANG_R[0] + Math.random() * (LANG_R[1] - LANG_R[0]), tx = m.home[0] + Math.cos(a) * r, ty = m.home[1] + Math.sin(a) * r * 0.5;
      if (w.map.walkable(tx, ty) && w.map.clear(m.x, m.y, tx, ty)) m.path = [[tx, ty]];
    }
  },
  // vừa lao vào: kéo các con chưa có mục tiêu đứng trong m.keo quanh nó — 1 lớp như World.keoNhom
  keo(m) { if (!m.keo) return; for (const o of this.mob.values()) if (o !== m && o.alive && !o.mucTen && ldist(o.x, o.y, m.x, m.y) <= m.keo) o.mucTen = m.mucTen; },
  // chủ bãi báo: con đổi chỗ / mục tiêu / số đòn từ lần báo trước; mỗi VT_DU_MS báo đủ mọi con (người mới vào, tin lạc). don: chỉ con vừa vung đòn
  baoViTri(t, don) {
    const q = [], du = !don && t - this.vtDuLuc >= VT_DU_MS;
    if (du) this.vtDuLuc = t;
    for (const m of this.mob.values()) {
      if (!m.alive || (don && (!m.baoCu || m.baoCu[4] === (m.atkN | 0)))) continue;
      const r = [m.vaDoi, Math.round(m.x), Math.round(m.y), m.mucTen || "", m.atkN | 0], c = m.baoCu;
      if (!du && c && c[1] === r[1] && c[2] === r[2] && c[3] === r[3] && c[4] === r[4]) continue;
      m.baoCu = r; q.push(r);
    }
    // d: tin báo đòn — máy khác không lấy làm mốc nhịp (viTri; soát lần 2 06/11: đoán theo khoảng cách thì tin báo đòn 80–99 ms sau tin theo nhịp bị coi
    // là tin theo nhịp, tin theo nhịp ngay sau bị bỏ)
    if (q.length) Net.wsGui({ t: "qch", ts: Math.round(t), q, ...(don ? { d: 1 } : {}) });
  },
  // máy không làm chủ bãi: đồng hồ vẽ quái theo chủ bãi — 1 đồng hồ cho cả bãi, bước mỗi khung (world.js buocVe: bám êm, không nhảy lùi / nhảy tới;
  // mốc mới nhất = lần chủ bãi báo gần nhất D.last)
  dongHoVe(t) {
    const D = this.dh; if (!D) return;
    const dt = D.vtLuc ? Math.min(0.25, (t - D.vtLuc) / 1000) : 0; D.vtLuc = t;
    D.vt = buocVe(D.vt, t / 1000 - D.off - Math.min(VE_MAX, D.lag + D.gap + VE_DU), D.lastReg ?? D.last, dt); // mốc cuối = tin theo nhịp gần nhất (viTri)
  },
  // máy không phải chủ bãi: mục tiêu theo chủ bãi; con đuổi mình -> máy mình tự chạy (lệch quá KEO_GAN thì đặt lại chỗ chủ bãi báo), con khác -> vẽ
  // theo chủ bãi (m.ngoai — World.updateMob gọi ngoai), vừa thôi đuổi mình thì trượt dần từ chỗ đang đứng
  theoChu() {
    const ten = this.w.hero.name, t = performance.now();
    for (const [uid, v] of this.vt) {
      const m = this.mob.get(uid); if (!m || !m.alive) continue;
      m.mucTen = v.muc || null;
      const ng = m.mucTen !== ten;
      if (ng && !m.ngoai) m.tron = { x: m.x, y: m.y, luc: t };
      m.ngoai = ng;
      if (!ng && !v.xong) { v.xong = true; if (ldist(m.x, m.y, v.x, v.y) > KEO_GAN) { m.x = v.x; m.y = v.y; m.path = null; } }
    }
  },
  // máy không làm chủ bãi — con m không đuổi mình (World.updateMob gọi thay phần tự chạy): chỗ đứng = nội suy 2 lần chủ bãi báo ở thời điểm
  // (bây giờ − trễ), chạy / đi / đứng theo đó; số đòn tăng thì vung đòn (không sát thương — chỉ máy người bị đánh trừ máu), quay về phía mục tiêu
  ngoai(m, dt) {
    const w = this.w, B = this.qb.get(m.vaDoi), D = this.dh, t = performance.now();
    if (!B || !B.length || !D) { if (m.act !== "attack" || m.t >= m.atkDur) w.setAct(m, "stand"); return; }
    const rt = D.vt ?? t / 1000 - D.off - Math.min(VE_MAX, D.lag + D.gap + VE_DU); // đồng hồ vẽ êm (dongHoVe — mỗi khung)
    while (B.length > 1 && B[1].T <= rt) B.shift();
    const a = B[0], b = B[1];
    let x = a.x, y = a.y;
    if (b && rt > a.T) { const k = (rt - a.T) / (b.T - a.T); x = a.x + (b.x - a.x) * k; y = a.y + (b.y - a.y) * k; }
    if (m.tron) { const k = Math.min(1, (t - m.tron.luc) / TRON_MS); x = m.tron.x + (x - m.tron.x) * k; y = m.tron.y + (y - m.tron.y) * k; if (k >= 1) m.tron = null; }
    const dx = x - m.x, dy = y - m.y, d = ldist(m.x, m.y, x, y);
    m.x = x; m.y = y; m.path = null;
    if (m.atkThay == null || a.n < m.atkThay) m.atkThay = a.n;
    else if (a.n > m.atkThay) {
      m.atkThay = a.n;
      m.atkAct = Math.random() < 0.7 ? "attack1" : "attack2"; m.atkDur = (w.P.npc.duration(m.type, m.atkAct) || 1) / (m.tocDanh || 1); m.hitDone = true;
      if (m.muc) m.dir = dirOf(m.muc.x - m.x, (m.muc.y - m.y) * 2);
      w.setAct(m, "attack"); m.t = 0; w.P.audio.npc(m.type, m.atkAct, 0.45);
      return;
    }
    // tốc độ đoạn đang vẽ (điểm / giây đồng hồ chủ bãi), bám êm — chọn đi / chạy (anh 06/11: trước so bước khung / dt -> chớp đi <-> chạy)
    const vd = b && b.T > a.T ? ldist(a.x, a.y, b.x, b.y) / (b.T - a.T) : 0;
    // vừa bắt đầu đi (đang đứng / đánh): lấy ngay tốc độ đoạn này (soát 06/11: bám êm từ ~0 thì 0,4 giây đầu mỗi lần đuổi chạy mà vẽ động tác đi)
    m.vDi = m.vDi == null || (m.act !== "walk" && m.act !== "run") ? vd : m.vDi + (vd - m.vDi) * Math.min(1, dt / DI_BAM);
    if (m.act === "attack" && m.t < m.atkDur) return; // đang vung: giữ động tác
    if (d > 0.2) {
      m.diLuc = t; m.dir = dirOf(dx, dy * 2);
      const g = ((m.walk || 0) + (m.run || 0)) / 2, chay = m.act === "run" ? m.vDi > g * (1 - DI_TRE) : m.act === "walk" ? m.vDi > g * (1 + DI_TRE) : m.vDi > g;
      w.setAct(m, chay ? "run" : "walk");
    }
    else if (t - (m.diLuc || 0) > 150) w.setAct(m, "stand");
  },
};

// tab ẩn / hiện: báo máy chủ để chọn người tab hiện làm chủ bãi
document.addEventListener("visibilitychange", () => { if (QuaiChung.w) Net.wsGui({ t: "qcAn", an: document.hidden ? 1 : 0 }); });
