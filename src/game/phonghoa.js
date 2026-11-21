// Phong Hỏa Liên Thành — phía trình duyệt (anh 04/11 — may-chu/phong-hoa.js; dữ liệu trận assets/data/phong-hoa.json — cong-cu/dung-phong-hoa.mjs).
// Dựng theo quái chung bãi train (src/game/quaichung.js): máy chủ gửi trạng thái p = { pha "bd" | "danh" | "xong", kc / cs / het (giờ máy chủ),
// diem, tq, soai, dich, xe, nguoi, lv, chu (tên máy chủ bãi), sv, hp | hd, dan, ack, gio, tin: [[mã, câu, màu]], me, ket?, bang?, ra?, khang,
// q? | qd?: dòng [mã, mẫu, cấp, hệ, máu tối đa, x, y, loại tên (0 trắng / 1 vàng / 2 lam), vai, đường, chặng, phe (1 = vệ binh / tướng quân), sát
// thương thấp, cao, chính xác, né tránh], vt?: [[mã, x, y, mục tiêu]] }.
//   - quân địch (phe 0) nằm trong World.mobs (đánh được như quái chung: m.vaDoi = mã, m.ph); vệ binh / tướng quân phe mình (phe 1) nằm riêng ở
//     World.dongMinh (không chọn làm mục tiêu, chiêu không trúng) — vẽ như quái, tên xanh lục;
//   - máy chủ bãi chạy cả 2 phe: lính chưa có mục tiêu đi theo đường (điểm đích từng chặng — trappos của client, tới gần thì sang chặng kế),
//     gặp người chơi / NPC phe mình trong tầm nhìn thì lao vào đánh (mục tiêu "#mã" = NPC), bỏ đuổi thì đi tiếp từ chỗ đó; Thần binh đứng canh doanh
//     trại; xe không đánh, tới cổng (chặng xeToi) thì báo "phx"; vệ binh / tướng quân đánh lính trong TAM_VE quanh chỗ đứng. Sát thương giữa NPC
//     (World.onDanhNpc — rules.mobDamage) gom gửi "phn"; vị trí + mục tiêu + số đòn + chặng gửi "phh" 10 lần / giây;
//   - máy khác: con đuổi mình thì máy mình tự chạy (đòn trúng mình trừ máu ở máy mình), con khác vẽ theo máy chủ bãi (ngoai — nội suy như người chơi khác);
//   - sát thương mình gây cho quân địch gửi "phd" (như qcd — đoán trước máu, đòn hạ gửi ngay).
//   PhongHoa.api (main.js gắn): veThanh() — đưa ra Biện Kinh (hết trận / chưa báo danh), msg(t, màu).
//   PhongHoa.ganWorld(w | null) · capNhat(p) · viTri(q, ts) · trangThai(st) · trung(m, v) · ttMoi(m) · ngoai(m, dt) · danhNpc(m, muc) · tick() · layNhip()
// Anh 04/11 lượt 25: dòng quân thêm [.., chiêu (mã chiêu | 0), hệ số sát thương chiêu, tốc độ hành quân] — quân hạng cao (Tiên phong / Chủ tướng / Chủ
// soái / Thần binh) ra chiêu vào người chơi (World.ganChieuDs — chỉ máy người bị đánh trừ máu; đánh NPC phe mình vẫn đòn thường ở máy chủ bãi), ưu
// tiên đuổi người chơi trong tầm nhìn (chonMuc — tối đa NHIN_NGUOI); lính đi đường = tốc độ chạy × toc của đợt (máy chủ: đợt sau đi nhanh hơn).
// Trợ Thủ không giữ cổng nữa (world.js nearestMob — hoạt động: chỉ quanh nhân vật) -> bỏ World.phCong
import { Net } from "./net.js";
import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import * as R from "./rules.js";

const GUI_MS = 80, VT_MS = 100, VT_DU_MS = 3000, CHON_MS = 250, DAT_MS = 250, BO_CHO = 1500, SONG_MS = 2000, DOAN_MS = 1500, NPC_MS = 250, DUONG_MS = 400;
const KEO_GAN = 400, TRON_MS = 300, VE_DU = 0.05, VE_MAX = 1, VE_NHO = 0.98, VE_GIU = 12;
const CHANG_R = 110;           // tới gần điểm đích chặng chừng này (logic) thì sang chặng kế
const TAM_VE = 300;            // vệ binh / tướng quân: đánh lính trong tầm này quanh chỗ đứng
const DUOI_X = 1.6;            // bỏ đuổi khi mục tiêu ra xa chỗ bắt đầu đánh quá tầm hoạt động × DUOI_X
const TAM_DANH = { cs: 150, tb: 160, ct: 120 }; // tầm đánh (logic) của tướng — kịch bản client dùng chiêu xa, game đánh thường
const UU_NGUOI = new Set(["tp", "ct", "cs", "tb"]), NHIN_NGUOI = 700; // quân hạng cao: thấy người chơi trong tầm nhìn (tối đa NHIN_NGUOI) thì đuổi người trước NPC
const MAU_TEN = ["#ffffff", "#ffb74d", "#6e96ff"], MAU_PHE = "#8dff8d";
const CHAN_R = 36, CHAN_MS = 1500; // trước khai chiến: bước vào dải trap chắn (trapline1013 / 2012 / 3012) thì bị đẩy về trong thành

export const PhongHoa = {
  api: null, D: null, p: null, w: null, spec: null, mob: new Map(), vt: new Map(), qb: new Map(), dh: null, hpSv: new Map(), lech: 0, seq: 0,
  cho: new Map(), st: new Map(), daTT: new Map(), gui: [], dan: new Map(), npc: new Map(), chuCu: null, tinDa: 0, daRa: false, chanLuc: 0,
  guiLuc: 0, vtLuc: 0, vtDuLuc: 0, chonLuc: 0, datLuc: 0, xinLuc: 0, songLuc: 0, npcLuc: 0, duongLuc: 0,

  laTo() { return !!(this.p && this.w && this.D && this.w.zone.id === this.D.bai && this.p.u); },
  laChu() { return this.laTo() && this.p.chu === this.w.hero.name && !this.p.ket; },
  ganWorld(w) {
    this.w = w; this.p = null; this.spec = null; this.mob = new Map(); this.vt = new Map(); this.qb = new Map(); this.dh = null; this.hpSv = new Map();
    this.cho.clear(); this.st.clear(); this.daTT.clear(); this.dan.clear(); this.npc.clear(); this.gui = []; this.chuCu = null; this.daRa = false;
    if (w) {
      w.dongMinh = []; this.xinLuc = 0; this.xin();
    }
  },
  xin() { const t = performance.now(); if (t - this.xinLuc > 1000) { this.xinLuc = t; this.songLuc = t; Net.wsGui({ t: "phVao", s: this.seq }); Net.wsGui({ t: "phAn", an: document.hidden ? 1 : 0 }); } },
  gioSv() { return Date.now() + this.lech; },

  capNhat(p) {
    if (!this.w || !this.D) return;
    if (!p || p.khong) { this.p = p; return this.roi(p && p.khong ? "Ngươi chưa báo danh trận này — mời về Biện Kinh." : "Trận Phong Hỏa Liên Thành đã kết thúc."); }
    if (this.p && this.p.u === p.u && p.gio < this.p.gio) return;
    this.lech = p.gio - Date.now();
    if (this.p && this.p.u !== p.u) { this.spec = null; this.hpSv.clear(); }
    if (p.q) { this.spec = { sv: p.sv, q: p.q }; const t = performance.now(); for (const r of p.vt || []) this.vt.set(r[0], { x: r[1], y: r[2], muc: r[3] || null, luc: t }); }
    else if (p.qd) {
      if (this.spec && this.spec.sv === p.qd.tu) {
        const M = new Map(this.spec.q.map((r) => [r[0], r]));
        for (const u of p.qd.x) { M.delete(u); this.hpSv.delete(u); }
        for (const r of p.qd.a) M.set(r[0], r);
        this.spec = { sv: p.sv, q: [...M.values()] };
      } else { this.xinLuc = 0; this.xin(); }
    }
    for (const [u, ten] of p.dan || []) this.dan.set(u, ten);
    if (p.hp) this.hpSv = new Map(p.hp); else for (const [u, v] of p.hd || []) this.hpSv.set(u, v);
    // tin trong trận (Msg2MSAll của kịch bản): hiện câu mới
    for (const [id, text, mau] of p.tin || []) if (id > this.tinDa) { this.tinDa = id; if (this.api) this.api.msg(text, mau || null); }
    this.p = p;
    this.gui = this.gui.filter((g) => g.s > (p.ack | 0));
    this.dat();
  },
  // đưa ra Biện Kinh 1 lần (hết trận, chưa báo danh, không có trận)
  roi(cau) { if (this.daRa || !this.api) return; this.daRa = true; if (cau) this.api.msg(cau); this.api.veThanh(); },

  doan(uid) { let v = this.cho.get(uid) || 0; for (const g of this.gui) v += g.d.get(uid) || 0; return v; },

  // dựng / bỏ / hạ / đặt máu các con trên World theo trạng thái máy chủ
  dat() {
    const w = this.w; if (!this.laTo() || !this.spec) return;
    const t = performance.now(), hp = this.hpSv, co = new Set(this.spec.q.map((s) => s[0])), K = this.p.khang ?? 50;
    this.datLuc = t;
    for (const [u, m] of this.mob) {
      if (co.has(u)) continue;
      const L = m.phe ? w.dongMinh : w.mobs, i = L.indexOf(m);
      if (i >= 0) L.splice(i, 1);
      if (w.player.target === m) w.player.target = null;
      this.mob.delete(u); this.qb.delete(u);
    }
    for (const s of this.spec.q) {
      const [uid, tpl, lv, he, hpMax, x0, y0, loai, vai, duong, cs, phe, st0, st1, ar, def, chieu, stChieu, toc] = s, mau = hp.get(uid) ?? 0;
      let m = this.mob.get(uid);
      if (m && !m.alive && m.duDoan && !m.daDem && mau > 0 && t - m.duDoan > DOAN_MS) { const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); this.mob.delete(uid); m = null; }
      if (!m) {
        if (mau <= 0) continue;
        const v = this.vt.get(uid), at = v ? [v.x, v.y] : [x0, y0];
        m = w.spawnMob(loai === 1, 0, { id: tpl, lvl: lv, series: he, at });
        if (!m) continue;
        if (phe) { const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); w.dongMinh.push(m); }
        const D = this.D, ten = (D.mau[{ th: "tieuHieu", dt: "doiTruong", tp: "tienPhong", ct: "chuTuong", cs: "chuSoai", xe: "xe", tb: "thanBinh", ve: "veBinh", tq: "tuongQuan" }[vai]] || {}).ten || m.name;
        Object.assign(m, { vaDoi: uid, ph: 1, phe, vai, duong, cs, hpMax, hp: Math.min(hpMax, mau), dmg: [st0, st1], ar, def, name: ten, mauTen: phe ? MAU_PHE : MAU_TEN[loai] || "#ffffff",
          res: Object.fromEntries(Object.entries(m.res).map(([k, r]) => [k, Math.min(r, K)])), home: phe || vai === "tb" ? [x0, y0] : [at[0], at[1]], nha: [x0, y0],
          mucTen: null, muc: null, aggro: false, walk: m.run * (toc > 0 ? toc : 1), boss: loai === 1, ta: loai === 2, dacBiet: loai !== 0, soMau: loai !== 0 || vai === "tq" });
        delete m.vc; // đánh thường như nhau ở mọi máy (sát thương giữa NPC tính ở máy chủ bãi)
        // tầm đòn thường (soát lượt 92): bỏ tầm chiêu mẫu World.spawnMob -> ganVoCong gán lúc sinh (tới 300 — đã bỏ chiêu mà còn tầm thì đánh thường từ xa,
        // ngoài tầm vệ binh / tướng quân chọn mục tiêu nên phe mình không đánh trả được) -> tầm gốc của mẫu (như rules.js mobStats), tướng theo TAM_DANH
        m.reach = TAM_DANH[vai] ? TAM_DANH[vai] * 0.75 : ((w.P.reach && w.P.reach[tpl]) || 75) * 0.75;
        // quân hạng cao: chiêu máy chủ chọn đánh người chơi (vocong.js ganChieuDs — tầm đứng đánh theo chiêu xa nhất)
        if (!phe && Array.isArray(chieu) && chieu.length && w.ganChieuDs) w.ganChieuDs(m, chieu, stChieu);
        if (vai === "xe") m.vision = 0;
        if (phe) m.active = TAM_VE * 0.75 * 2.2;
        this.mob.set(uid, m);
      }
      if (mau <= 0) { if (!m.daDem) { m.daDem = 1; if (m.alive) w.kill(m); } continue; }
      if (!m.alive) continue;
      m.hp = Math.max(1, Math.min(m.hpMax, mau - (m.phe ? 0 : this.doan(uid))));
      if (cs > (m.cs | 0)) m.cs = cs;
    }
  },

  viTri(q, ts) {
    const t = performance.now(), now = t / 1000, T = ts > 0 ? ts / 1000 : now, chu = this.p ? this.p.chu : null;
    let D = this.dh;
    if (!D || D.chu !== chu || T <= D.last - 10 || T - D.last > 10) { D = this.dh = { off: now - T, lag: 0.15, gap: VT_MS / 1000, last: T, chu }; this.qb.clear(); }
    else if (T > D.last) { D.gap = D.gap * 0.8 + Math.min(1, T - D.last) * 0.2; D.last = T; }
    const age = now - T; D.off = Math.min(D.off, age); D.lag = Math.max(D.lag * VE_NHO, age - D.off);
    for (const r of q || []) {
      this.vt.set(r[0], { x: r[1], y: r[2], muc: r[3] || null, luc: t });
      const m = this.mob.get(r[0]); if (m && (r[5] | 0) > (m.cs | 0)) m.cs = r[5] | 0;
      const B = this.qb.get(r[0]) || this.qb.set(r[0], []).get(r[0]), z = B[B.length - 1];
      if (z && T <= z.T) continue;
      if (z && T - z.T > D.gap * 1.5 + 0.05 && (z.x !== r[1] || z.y !== r[2])) B.push({ T: T - D.gap, x: z.x, y: z.y, n: z.n });
      B.push({ T, x: r[1], y: r[2], n: r[4] | 0 });
      if (B.length > VE_GIU) B.splice(0, B.length - VE_GIU);
    }
  },
  trangThai(st) {
    const w = this.w; if (!w) return;
    for (const [uid, a, b] of st || []) {
      const m = this.mob.get(uid); if (!m || !m.alive) continue;
      if (a > 0) m.stunUntil = Math.max(m.stunUntil || 0, w.time + a / 1000);
      if (b > 0) m.slowUntil = Math.max(m.slowUntil || 0, w.time + b / 1000);
      this.daTT.set(uid, [m.stunUntil || 0, m.slowUntil || 0]);
    }
  },

  // World.hit: sát thương mình gây cho quân địch m (đã trừ ở máy mình)
  trung(m, v) {
    if (!this.laTo() || !this.mob.has(m.vaDoi) || m.phe) return;
    this.cho.set(m.vaDoi, (this.cho.get(m.vaDoi) || 0) + v);
    if (this.laChu() && !m.mucTen && m.vai !== "xe") { m.mucTen = this.w.hero.name; m.home = [m.x, m.y]; }
    const mau = this.hpSv.get(m.vaDoi);
    if (mau != null && !m.duDoan && mau - this.doan(m.vaDoi) <= 0) { m.duDoan = performance.now(); this.guiNgay(); }
  },
  ttMoi(m) {
    const w = this.w; if (!this.laTo() || !this.mob.has(m.vaDoi)) return;
    const su = m.stunUntil || 0, sl = m.slowUntil || 0, cu = this.daTT.get(m.vaDoi) || [0, 0];
    if (su <= cu[0] + 0.05 && sl <= cu[1] + 0.05) return;
    this.daTT.set(m.vaDoi, [Math.max(su, cu[0]), Math.max(sl, cu[1])]);
    this.st.set(m.vaDoi, [Math.max(0, Math.round((su - w.time) * 1000)), Math.max(0, Math.round((sl - w.time) * 1000))]);
  },
  // World.updateMob: con m (máy chủ bãi tự chạy) vung trúng NPC muc (vệ binh / tướng quân hoặc lính) -> sát thương như quái đánh người (mobDamage),
  // gom gửi máy chủ; máu trên máy mình đoán trước (máy chủ báo lại)
  danhNpc(m, muc) {
    if (!this.laChu() || !muc || !muc.alive || !this.mob.has(muc.vaDoi) || !!m.phe === !!muc.phe) return;
    const d = R.mobDamage(m, muc);
    if (d.miss) { this.w.text(muc, "Né", "#cfd8dc"); return; }
    this.npc.set(muc.vaDoi, (this.npc.get(muc.vaDoi) || 0) + d.v);
    muc.hp = Math.max(1, muc.hp - d.v);
    this.w.text(muc, String(d.v), muc.phe ? "#ff6b5b" : "#ffffff");
  },
  layNhip() { return Net.wsOk || !this.laTo() || (!this.cho.size && !this.st.size) ? null : this.goi(); },
  goi() {
    const s = ++this.seq, d = [...this.cho].map(([u, v]) => [u, Math.round(v)]), st = [...this.st].map(([u, [a, b]]) => [u, a, b]);
    this.gui.push({ s, d: new Map(this.cho), luc: performance.now() }); this.cho.clear(); this.st.clear();
    return { s, d, ...(st.length ? { st } : {}) };
  },
  guiNgay() { if (Net.wsOk && (this.cho.size || this.st.size)) { this.guiLuc = performance.now(); Net.wsGui({ t: "phd", ...this.goi() }); } },

  // mỗi khung hình (main.js)
  tick() {
    if (!this.w || !this.D) return;
    const t = performance.now(), w = this.w;
    if (t - this.songLuc >= SONG_MS) { this.songLuc = t; Net.wsGui({ t: "phAn", an: document.hidden ? 1 : 0 }); }
    if (!this.laTo()) return this.xin();
    const P = this.p;
    if (P.ket && P.ra && this.gioSv() >= P.ra) return this.roi("Trận đã kết thúc — mời về Biện Kinh.");
    if (P.pha === "bd") this.chan(t);
    if (t - this.datLuc >= DAT_MS) this.dat();
    for (const m of this.mob.values()) if (m.alive && m.duDoan) w.kill(m);
    if ((this.cho.size || this.st.size) && t - this.guiLuc >= GUI_MS) this.guiNgay();
    if (this.gui.length && t - this.gui[0].luc > BO_CHO) this.gui = this.gui.filter((g) => t - g.luc <= BO_CHO);
    const chu = this.laChu();
    if (chu !== this.chuCu) { this.chuCu = chu; this.dh = null; this.qb.clear(); for (const m of this.mob.values()) { m.ngoai = false; m.tron = null; m.atkThay = null; m.path = null; } }
    if (chu) {
      if (t - this.chonLuc >= CHON_MS) { this.chonLuc = t; this.chonMuc(); }
      if (t - this.duongLuc >= DUONG_MS) { this.duongLuc = t; this.diDuong(); }
      if (t - this.vtLuc >= VT_MS) { this.vtLuc = t; this.baoViTri(t); }
      if (this.npc.size && t - this.npcLuc >= NPC_MS) { this.npcLuc = t; Net.wsGui({ t: "phn", d: [...this.npc].map(([u, v]) => [u, Math.round(v)]) }); this.npc.clear(); }
    } else this.theoChu();
    const ten = w.hero.name;
    for (const m of this.mob.values()) if (m.alive) m.muc = !m.mucTen ? null : m.mucTen[0] === "#" ? this.sang(m.mucTen) : m.mucTen === ten ? w.player : w.others.get(m.mucTen) || null;
  },
  sang(k) { const m = this.mob.get(+k.slice(1)); return m && m.alive ? m : null; },

  // dòng trạng thái lúc ở trận (game.css #phtt — anh 04/11 chọn: máy tính mẫu 2 = khung dọc dưới bản đồ nhỏ, nhãn trái số phải; điện thoại mẫu 3 = 2
  // dòng giữa trên, vạch điểm thủ thành + cờ tướng quân): báo danh -> giờ khai chiến; đang đánh -> giờ còn, điểm thủ thành, tướng quân còn, binh lực địch
  // (xe), Chủ soái, số con mình hạ; xong -> kết quả + giờ về Biện Kinh. Kết thúc: bảng kết quả (#phkq) — hạ / kinh nghiệm trong trận / thưởng
  ve(w) {
    const p = this.p, tai = !!w && this.w === w && this.laTo();
    if (!tai) { for (const el of [this.el, this.kq]) if (el && el.style.display !== "none") { el.style.display = "none"; el.dataset.sig = ""; } return; }
    if (!this.el) { this.el = document.createElement("div"); this.el.id = "phtt"; document.body.appendChild(this.el); }
    const now = this.gioSv(), mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
    const dt = document.body.classList.contains("dt"), kq = p.ket ? (p.ket === "thang" ? "thủ thành thành công" : p.ket === "huy" ? "trận đã hủy" : "thủ thành thất bại") : "";
    const dong = (n, v, c = "") => `<div class="d"><span>${n}</span><i class="${c}">${v}</i></div>`;
    const h2 = dt ? "" : p.ket ? `<div class="tt">Phong Hỏa Liên Thành</div>${dong("Kết quả", kq, p.ket === "thang" ? "" : "du")}${dong("Về Biện Kinh", mmss(p.ra - now))}`
      : p.pha === "bd" ? `<div class="tt">Phong Hỏa Liên Thành</div>${dong("Khai chiến sau", mmss(p.kc - now))}${dong("Viện binh", p.nguoi + " người")}`
        : `<div class="tt">Phong Hỏa Liên Thành</div>${dong("Thời gian còn", mmss(p.het - now))}${dong("Điểm thủ thành", p.diem + "/" + p.diemMax, p.diem <= 6 ? "du" : "")}${dong("Tướng quân", p.tq + "/" + p.tqTong, p.tq <= 1 ? "du" : "")}`
          + `${dong("Quân địch", p.dich + (p.xe ? ` (xe ${p.xe})` : ""))}${dong("Chủ soái", p.soaiRa ? p.soai + "/" + p.soaiTong : "sau " + mmss(p.cs - now))}${p.me ? dong("Bạn hạ", p.me.giet) : ""}`;
    const vach = dt && p.diemMax ? `<span class="vach">${Array.from({ length: p.diemMax }, (_, i) => `<u class="${i < p.diem ? (p.diem <= 6 ? "do" : "") : "mat"}"></u>`).join("")}</span>` : "";
    const co = `<span class="co">${Array.from({ length: p.tqTong || 3 }, (_, i) => `<u class="${i < p.tq ? "" : "mat"}"></u>`).join("")}</span>`;
    const h3 = !dt ? "" : p.ket ? `<div class="d1"><b>Phong Hỏa Liên Thành</b> <i class="${p.ket === "thang" ? "" : "du"}">${kq}</i></div><div class="d2"><em>về Biện Kinh sau ${mmss(p.ra - now)}</em></div>`
      : p.pha === "bd" ? `<div class="d1"><b>Phong Hỏa Liên Thành</b> <em>báo danh</em></div><div class="d2"><span>khai chiến sau</span> <em>${mmss(p.kc - now)}</em> <span>· viện binh ${p.nguoi} người</span></div>`
        : `<div class="d1"><b>Phong Hỏa Liên Thành</b> <em>${mmss(p.het - now)}</em> <span>· địch ${p.dich}${p.xe ? ` (xe ${p.xe})` : ""} · Chủ soái ${p.soaiRa ? p.soai + "/" + p.soaiTong : "sau " + mmss(p.cs - now)}${p.me ? ` · bạn hạ ${p.me.giet}` : ""}</span></div>`
          + `<div class="d2"><span>Thành</span> ${vach} <i class="${p.diem <= 6 ? "du" : ""}">${p.diem}</i> <span>· Tướng quân</span> ${co}</div>`;
    const out = dt ? h3 : h2, lop = dt ? "b3" : "b2";
    if (this.el.className !== lop) this.el.className = lop;
    // máy tính: ngay dưới khối bản đồ nhỏ (bản đồ nhỏ phóng to thì xuống theo — anh 04/11 "bảng thông tin bị đè lúc phóng to bản đồ"); điện thoại theo CSS
    const tl = performance.now();
    if (!dt && this.api && this.api.duoiMM && tl - (this.mmLuc || 0) > 300) { this.mmLuc = tl; const y = Math.round(this.api.duoiMM()) + 6; if (y > 6 && this.mmY !== y) { this.mmY = y; this.el.style.top = y + "px"; } }
    if (dt && this.mmY) { this.mmY = 0; this.el.style.top = ""; }
    if (this.el.dataset.sig !== out) { this.el.dataset.sig = out; this.el.style.display = ""; this.el.innerHTML = out; }
    // bảng kết quả lúc xong trận (bấm × để ẩn)
    if (!p.ket || !p.bang) return;
    if (!this.kq) {
      this.kq = document.createElement("div"); this.kq.id = "phkq"; document.body.appendChild(this.kq);
      this.kq.addEventListener("click", (e) => { if (e.target.closest(".x")) { this.kq.style.display = "none"; this.kq.dataset.an = String(this.p && this.p.u); } });
    }
    if (this.kq.dataset.an === String(p.u)) return;
    const vn = (n) => Math.round(n).toLocaleString("vi-VN"), ten = w.hero.name, esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
    const sig = p.u + "|" + p.ket + "|" + p.bang.length;
    if (this.kq.dataset.sig === sig) { if (this.kq.style.display === "none") this.kq.style.display = ""; return; }
    this.kq.dataset.sig = sig; this.kq.style.display = "";
    this.kq.innerHTML = `<div class="tt">Phong Hỏa Liên Thành — ${p.ket === "thang" ? "thủ thành thành công" : p.ket === "huy" ? "trận đã hủy" : "thủ thành thất bại"}<span class="x">×</span></div>`
      + `<div class="ly">${esc(p.lyDo || "")}</div><table><tr><th>Nhân vật</th><th>Hạ</th><th>Kinh nghiệm trong trận</th><th>Thưởng thắng trận</th></tr>`
      + p.bang.map(([n, g, k, t]) => `<tr${n === ten ? ' class="toi"' : ""}><td>${esc(n)}</td><td>${g}</td><td>${vn(k)}</td><td>${t ? vn(t) : "—"}</td></tr>`).join("") + `</table>`;
  },

  // trước khai chiến: người chơi bước vào dải chắn ra đường -> đẩy về trong thành (trap_onroad.lua — Talk + SetPos)
  chan(t) {
    const w = this.w, p = w.player, D = this.D; if (t - this.chanLuc < CHAN_MS || !D.chan) return;
    for (let r = 0; r < D.chan.length; r++) for (const [x, y] of D.chan[r]) if (ldist(p.x, p.y, x, y) <= CHAN_R) {
      this.chanLuc = t; p.x = D.chanVe[r][0]; p.y = D.chanVe[r][1]; p.path = null; p.target = null; w.holdMove = false;
      if (this.api) this.api.msg("Trước khi khai chiến các tướng sĩ trong thành đợi lệnh, chuẩn bị nghênh địch!");
      return;
    }
  },

  // người còn sống đang thấy ở trận: [[tên, đối tượng World]]
  ungVien() {
    const w = this.w, ds = [];
    if (w.player.hp > 0 && !w.map.an(w.player.x, w.player.y)) ds.push([w.hero.name, w.player]);
    for (const [n, o] of w.others) if (o.hp > 0 && o.act !== "die" && !w.map.an(o.x, o.y)) ds.push([n, o]);
    return ds;
  },
  // máy chủ bãi: mục tiêu từng con. Quân địch: giữ mục tiêu còn sống / chưa chạy quá xa chỗ bắt đầu đánh; không thì người vừa đánh nó, không thì
  // người / NPC phe mình gần nhất trong tầm nhìn (Thần binh: quanh chỗ đứng). Vệ binh / tướng quân: lính gần nhất trong TAM_VE quanh chỗ đứng
  chonMuc() {
    const nguoi = this.ungVien(), dich = [], phe = [];
    for (const m of this.mob.values()) if (m.alive) (m.phe ? phe : dich).push(m);
    const dan = this.dan; this.dan = new Map();
    const gan = (m, cx, cy, R, ds, nguoiDs) => {
      let b = null, bd = R;
      for (const [n, o] of nguoiDs) { const d = ldist(cx, cy, o.x, o.y); if (d <= bd) { bd = d; b = n; } }
      for (const o of ds) { const d = ldist(cx, cy, o.x, o.y); if (d <= bd) { bd = d; b = "#" + o.vaDoi; } }
      return b;
    };
    const conSong = (k) => (!k ? null : k[0] === "#" ? this.sang(k) : (nguoi.find((x) => x[0] === k) || [])[1] || null);
    for (const m of dich) {
      if (m.vai === "xe") { m.mucTen = null; continue; }
      const cu = conSong(m.mucTen), xa = (m.active || 525) * DUOI_X;
      if (cu && ldist(cu.x, cu.y, m.home[0], m.home[1]) <= xa) continue;
      if (cu) { m.mucTen = null; continue; }
      const nd = dan.get(m.vaDoi), moi = !m.mucTen;
      if (nd && conSong(nd)) m.mucTen = nd;
      else {
        const [cx, cy] = m.vai === "tb" ? m.nha : [m.x, m.y];
        // quân hạng cao (anh 04/11 lượt 25 — "quái k đánh người chơi mấy"): người chơi trong tầm nhìn trước, không có mới tới vệ binh / tướng quân
        m.mucTen = (UU_NGUOI.has(m.vai) && gan(m, cx, cy, Math.min(m.vision || 300, NHIN_NGUOI), [], nguoi)) || gan(m, cx, cy, m.vision || 300, phe, nguoi);
      }
      if (moi && m.mucTen && m.vai !== "tb") m.home = [m.x, m.y]; // bỏ đuổi thì đi tiếp từ chỗ này
    }
    for (const m of phe) {
      const cu = conSong(m.mucTen);
      if (cu && ldist(cu.x, cu.y, m.nha[0], m.nha[1]) <= TAM_VE * 0.75 * 1.5) continue;
      m.mucTen = gan(m, m.nha[0], m.nha[1], TAM_VE * 0.75, dich, []);
    }
  },
  // máy chủ bãi: con địch chưa có mục tiêu (và không đang về chỗ) đi tới điểm đích chặng hiện tại; tới gần thì sang chặng kế. Xe tới điểm của chặng
  // xeToi (dải trap trapline1014 / 2012 / 3013 của client nằm sát đó) thì báo máy chủ (3 giây báo lại nếu tin lạc — máy chủ xóa xe là thôi)
  diDuong() {
    const w = this.w, D = this.D, t = performance.now();
    for (const m of this.mob.values()) {
      if (!m.alive || m.phe || m.vai === "tb" || m.duong < 0 || m.mucTen || m.leash) continue;
      const L = D.duong[m.duong] || [];
      if (!m.dich || m.dichCs !== (m.cs | 0)) { const c = L[Math.min(m.cs | 0, L.length - 1)] || []; m.dich = c[Math.floor(Math.random() * c.length)] || [m.x, m.y]; m.dichCs = m.cs | 0; m.path = null; }
      if (ldist(m.x, m.y, m.dich[0], m.dich[1]) <= CHANG_R) {
        if (m.vai === "xe" && (m.cs | 0) >= D.xeToi[m.duong]) { if (t - (m.daBao || 0) > 3000) { m.daBao = t; Net.wsGui({ t: "phx", u: m.vaDoi }); } m.path = null; continue; }
        if ((m.cs | 0) < L.length - 1) { m.cs = (m.cs | 0) + 1; m.dich = null; m.home = [m.x, m.y]; continue; }
        m.path = null; continue; // cuối đường: đứng chờ (gặp vệ binh / tướng quân / người thì đánh)
      }
      if (!m.path || !m.path.length) { const d = w.map.path(m.x, m.y, m.dich[0], m.dich[1], 4000); m.path = d && d.length ? d : [[m.dich[0], m.dich[1]]]; m.home = [m.x, m.y]; }
    }
    // vệ binh / tướng quân không có mục tiêu, ở xa chỗ đứng: về chỗ
    for (const m of this.mob.values()) if (m.alive && m.phe && !m.mucTen && !m.leash && ldist(m.x, m.y, m.nha[0], m.nha[1]) > 40 && (!m.path || !m.path.length)) m.path = w.map.path(m.x, m.y, m.nha[0], m.nha[1], 3000) || null;
  },
  baoViTri(t) {
    const q = [], du = t - this.vtDuLuc >= VT_DU_MS;
    if (du) this.vtDuLuc = t;
    for (const m of this.mob.values()) {
      if (!m.alive) continue;
      const r = [m.vaDoi, Math.round(m.x), Math.round(m.y), m.mucTen || "", m.atkN | 0, m.cs | 0], c = m.baoCu;
      if (!du && c && c[1] === r[1] && c[2] === r[2] && c[3] === r[3] && c[4] === r[4] && c[5] === r[5]) continue;
      m.baoCu = r; q.push(r);
    }
    for (let i = 0; i < q.length; i += 120) Net.wsGui({ t: "phh", ts: Math.round(t), q: q.slice(i, i + 120) });
  },
  // máy không làm chủ bãi: con đuổi mình -> máy mình tự chạy, con khác -> vẽ theo chủ bãi
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
  // con m không đuổi mình (máy không làm chủ bãi): chỗ đứng nội suy theo chủ bãi báo, số đòn tăng thì vung đòn (không sát thương)
  ngoai(m, dt) {
    const w = this.w, B = this.qb.get(m.vaDoi), D = this.dh, t = performance.now();
    if (!B || !B.length || !D) { if (m.act !== "attack" || m.t >= m.atkDur) w.setAct(m, "stand"); return; }
    const rt = t / 1000 - D.off - Math.min(VE_MAX, D.lag + D.gap + VE_DU);
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
    if (m.act === "attack" && m.t < m.atkDur) return;
    if (d > 0.2) { m.diLuc = t; m.dir = dirOf(dx, dy * 2); w.setAct(m, m.mucTen ? "run" : "walk"); } // lính đi đường: đi bộ; đuổi mục tiêu: chạy (như máy chủ bãi)
    else if (t - (m.diLuc || 0) > 150) w.setAct(m, "stand");
  },
};

document.addEventListener("visibilitychange", () => { if (PhongHoa.w) Net.wsGui({ t: "phAn", an: document.hidden ? 1 : 0 }); });
