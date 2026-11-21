// Vượt Ải tổ đội + quái chung — phía trình duyệt (anh 31/10: "Vượt Ải theo tổ đội + quái chung — ưu tiên làm cái này, quái chung cho tổ đội như
// chúng ta thảo luận"; máy chủ may-chu/vuot-ai.js phòng, kênh tức thời Net.ws*). Máy chủ gửi trạng thái phòng p = { id, cap, bai, bd (lúc ra đám
// 1), dot, tong, han, sinh (lúc ra đám hiện tại), ket?, giet, sv (bản danh sách quái), chu (tên nhân vật máy chủ bãi), tv: [[tên, còn trong ải
// 0 | 1]], hp: [[uid, máu]], dan: [[uid, thứ tự người vừa đánh trong tv]], ack (số tin sát thương của mình máy chủ đã nhận), gio, q?: [[uid, mẫu,
// cấp, hệ, tên, máu tối đa, x, y, boss]] + vt?: [[uid, x, y, mục tiêu]] (đủ — lúc vào bãi / đám mới) }.
// Mọi máy sinh cùng các con (uid) ở cùng chỗ và tự chạy quái như bản 1 người, nhưng:
//   - mục tiêu từng con do máy chủ bãi chọn (chonMuc: người vừa đánh nó / người đứng trong tầm nhìn nhin, kéo con đứng trong keo quanh nó như bản
//     1 người; đã lao vào thì không bỏ — mục tiêu chết / rời ải thì đuổi người gần nhất); chủ bãi báo vị trí + mục tiêu 5 lần / giây, máy khác kéo
//     về đúng chỗ (theoChu — con đang đuổi chính mình thì để máy mình tự chạy cho đòn trúng đúng chỗ);
//   - chỉ máy của người bị đánh trừ máu người đó (World.updateMob — như boss thế giới);
//   - máu = máu chung − phần mình vừa đánh mà máy chủ chưa nhận (đoán trước), máy mình không tự hạ (≥ 1) — máy chủ báo chết; choáng / chậm mình
//     gây gửi kèm sát thương, máy khác đặt theo (trangThai).
//   VaDoi.ganWorld(w) · capNhat(p) · viTri(q) · trangThai(st) · trung(m, v) · ttMoi(m) · tick() mỗi khung hình · layNhip() · thoat()
import { Net } from "./net.js";
import { ldist } from "./map.js";

const GUI_MS = 80, VT_MS = 200, CHON_MS = 250, DAT_MS = 250, BO_CHO = 1500;
// lệch so với chỗ chủ bãi báo: quá KEO_GAN thì đặt thẳng; đứng yên lệch quá KEO_CHAY thì chạy tới; đang đuổi người khác lệch quá KEO_DUOI thì kéo nửa đường
const KEO_GAN = 400, KEO_CHAY = 20, KEO_DUOI = 140;
// chủ bãi: con chưa có mục tiêu thỉnh thoảng đi loanh quanh chỗ đứng (như quái thường — World.updateMob đi lang thang: 3–8 giây, 30–110 điểm)
const LANG_GIAY = [3, 8], LANG_R = [30, 110];

// Viêm Đế Bảo Tàng (anh 04/11) dùng lại nguyên khối này: T = tên tin kênh tức thời của phòng { vao, dan, vt, an }
export function taoDoi(T) { const D = {
  p: null, het: false, w: null, spec: null, mob: new Map(), vt: new Map(), lech: 0, seq: 0, cho: new Map(), st: new Map(), daTT: new Map(), gui: [], dan: new Map(),
  guiLuc: 0, vtLuc: 0, chonLuc: 0, datLuc: 0, xinLuc: 0,
  api: null, // { sinh(w, s, vt) -> con quái — main.js vaQuai }

  // World đang ở đúng bãi của phòng
  laTo() { return !!(this.p && this.w && this.w.zone.id === this.p.bai); },
  laChu() { return this.laTo() && this.p.chu === this.w.hero.name; },
  ganWorld(w) {
    this.w = w; this.mob = new Map(); this.vt = new Map(); this.cho.clear(); this.st.clear(); this.daTT.clear(); this.dan.clear(); this.gui = [];
    if (this.laTo()) { this.xin(); Net.wsGui({ t: T.an, an: document.hidden ? 1 : 0 }); }
  },
  thoat() { this.p = null; this.spec = null; this.ganWorld(null); },
  // xin máy chủ gửi lại đủ trạng thái (vào bãi, nối lại kênh, chưa có danh sách quái của đám)
  xin() { const t = performance.now(); if (t - this.xinLuc > 1000) { this.xinLuc = t; Net.wsGui({ t: T.vao }); } },

  // p = null: máy chủ báo mình không còn trong phòng nào (phòng mất khi tắt máy chủ, đã bị đưa ra) -> het: main.js hỏi máy chủ "ra"
  capNhat(p) {
    if (!p) { this.p = null; this.spec = null; this.het = true; return; }
    this.het = false;
    if (this.p && p.id === this.p.id && p.gio < this.p.gio) return; // nhịp tới chậm hơn kênh: bỏ bản cũ
    this.lech = p.gio - Date.now();
    if (p.q) { this.spec = { id: p.id, sv: p.sv, q: p.q }; const t = performance.now(); for (const r of p.vt || []) this.vt.set(r[0], { x: r[1], y: r[2], i: r[3], luc: t }); }
    for (const [u, i] of p.dan || []) this.dan.set(u, i);
    this.p = p;
    this.gui = this.gui.filter((g) => g.s > (p.ack | 0));
    this.dat();
  },

  // phần mình đã đánh con uid mà máy chủ chưa nhận (chưa gửi + đang trên đường)
  doan(uid) { let v = this.cho.get(uid) || 0; for (const g of this.gui) v += g.d.get(uid) || 0; return v; },

  // sinh / bỏ / hạ / đặt máu các con trên World theo trạng thái máy chủ
  dat() {
    const w = this.w, p = this.p; if (!this.laTo()) return;
    this.datLuc = performance.now();
    for (const [u, m] of this.mob) {
      if (Math.floor(u / 1000) === p.dot && m.vaPhong === p.id) continue;
      if (m.alive) { m.alive = false; const i = w.mobs.indexOf(m); if (i >= 0) w.mobs.splice(i, 1); if (w.player.target === m) w.player.target = null; } // đám đã qua / phòng khác
      this.mob.delete(u);
    }
    if (!this.spec || this.spec.id !== p.id || this.spec.sv !== p.sv) return this.xin();
    if (p.ket || Date.now() + this.lech < p.sinh) return; // chưa tới lúc ra đám / ải đã kết thúc
    const hp = new Map(p.hp);
    for (const s of this.spec.q) {
      const uid = s[0], mau = hp.get(uid) ?? 0;
      let m = this.mob.get(uid);
      if (!m) {
        if (mau <= 0 || !this.api) continue;
        m = this.api.sinh(w, s, this.vt.get(uid)); if (!m) continue;
        Object.assign(m, { vaDoi: uid, vaPhong: p.id, mucTen: null, muc: null, aggro: false });
        // anh 16/11: sát thương quái / boss × hệ số tổ đội của phòng (máy chủ vuot-ai.js hsDoi — máu máy chủ đã nhân sẵn)
        const hs = +p.hs || 1; if (hs !== 1 && Array.isArray(m.dmg)) m.dmg = m.dmg.map((v) => Math.round(v * hs));
        this.mob.set(uid, m);
      }
      if (!m.alive) continue;
      if (mau <= 0) { w.kill(m); continue; }
      m.hp = Math.max(1, Math.min(m.hpMax, mau - this.doan(uid)));
    }
  },

  // chủ bãi báo vị trí + mục tiêu: [[uid, x, y, thứ tự người trong tv | -1]]
  viTri(q) { const t = performance.now(); for (const r of q || []) this.vt.set(r[0], { x: r[1], y: r[2], i: r[3], luc: t }); },
  // choáng / chậm người khác gây: [[uid, choáng ms, chậm ms]]
  trangThai(st) {
    const w = this.w; if (!w) return;
    for (const [uid, a, b] of st || []) {
      const m = this.mob.get(uid); if (!m || !m.alive) continue;
      if (a > 0) m.stunUntil = Math.max(m.stunUntil || 0, w.time + a / 1000);
      if (b > 0) m.slowUntil = Math.max(m.slowUntil || 0, w.time + b / 1000);
      this.daTT.set(uid, [m.stunUntil || 0, m.slowUntil || 0]); // không gửi lại cái vừa nhận
    }
  },

  // World.hit: sát thương mình gây cho con m (đã trừ ở máy mình)
  trung(m, v) {
    if (!this.p || m.vaPhong !== this.p.id) return;
    this.cho.set(m.vaDoi, (this.cho.get(m.vaDoi) || 0) + v);
    if (this.laChu() && !m.mucTen) { m.mucTen = this.w.hero.name; this.keo(m); } // chủ bãi đánh con chưa có mục tiêu: nó đuổi mình ngay
  },
  // vocong.js / World: con m vừa bị choáng / làm chậm ở máy mình -> gửi kèm sát thương (chỉ khi dài hơn lần đã gửi / đã nhận)
  ttMoi(m) {
    const w = this.w; if (!w || !this.p || m.vaPhong !== this.p.id) return;
    const su = m.stunUntil || 0, sl = m.slowUntil || 0, cu = this.daTT.get(m.vaDoi) || [0, 0];
    if (su <= cu[0] + 0.05 && sl <= cu[1] + 0.05) return;
    this.daTT.set(m.vaDoi, [Math.max(su, cu[0]), Math.max(sl, cu[1])]);
    this.st.set(m.vaDoi, [Math.max(0, Math.round((su - w.time) * 1000)), Math.max(0, Math.round((sl - w.time) * 1000))]);
  },
  // kênh chưa mở: phần chưa gửi đi kèm nhịp (b.vad)
  layNhip() {
    if (Net.wsOk || !this.laTo() || (!this.cho.size && !this.st.size)) return null;
    const r = this.goi();
    return r;
  },
  goi() {
    const s = ++this.seq, d = [...this.cho].map(([u, v]) => [u, Math.round(v)]), st = [...this.st].map(([u, [a, b]]) => [u, a, b]);
    this.gui.push({ s, d: new Map(this.cho), luc: performance.now() }); this.cho.clear(); this.st.clear();
    return { s, d, ...(st.length ? { st } : {}) };
  },

  // mỗi khung hình (main.js vaTick)
  tick() {
    if (!this.laTo()) return;
    const t = performance.now();
    if (t - this.datLuc >= DAT_MS) this.dat();
    if ((this.cho.size || this.st.size) && t - this.guiLuc >= GUI_MS && Net.wsOk) { this.guiLuc = t; Net.wsGui({ t: T.dan, ...this.goi() }); }
    if (this.gui.length && t - this.gui[0].luc > BO_CHO) this.gui = this.gui.filter((g) => t - g.luc <= BO_CHO); // gửi mà máy chủ không nhận (kênh đứt): thôi đoán
    if (this.laChu()) {
      if (t - this.chonLuc >= CHON_MS) { this.chonLuc = t; this.chonMuc(); this.langThang(t); }
      if (t - this.vtLuc >= VT_MS) { this.vtLuc = t; this.baoViTri(); }
    } else this.theoChu();
    const w = this.w, ten = w.hero.name;
    for (const m of this.mob.values()) if (m.alive) m.muc = m.mucTen ? (m.mucTen === ten ? w.player : w.others.get(m.mucTen) || null) : null;
  },

  // người còn trong ải, còn sống, đang thấy ở bãi: [[tên, đối tượng World]]
  ungVien() {
    const w = this.w, trong = new Set(this.p.tv.filter((x) => x[1]).map((x) => x[0])), ds = [];
    if (w.player.hp > 0 && trong.has(w.hero.name)) ds.push([w.hero.name, w.player]);
    for (const [n, o] of w.others) if (trong.has(n) && o.hp > 0 && o.act !== "die") ds.push([n, o]);
    return ds;
  },
  // chủ bãi: chọn mục tiêu cho từng con
  chonMuc() {
    const ds = this.ungVien(), co = (n) => n && ds.some((x) => x[0] === n), tv = this.p.tv;
    const gan = (m, R) => { let b = null, bd = R; for (const x of ds) { const d = ldist(m.x, m.y, x[1].x, x[1].y); if (d <= bd) { bd = d; b = x; } } return b; };
    const dan = this.dan; this.dan = new Map();
    for (const m of this.mob.values()) {
      if (!m.alive || co(m.mucTen)) continue;
      const di = dan.get(m.vaDoi), nd = di != null && tv[di] ? tv[di][0] : null;
      const moi = !m.mucTen;
      if (co(nd)) m.mucTen = nd; // người vừa đánh nó
      else { const g = gan(m, m.mucTen ? Infinity : m.vision || 160); m.mucTen = g ? g[0] : null; } // mục tiêu cũ chết / rời ải: người gần nhất
      if (moi && m.mucTen) this.keo(m);
    }
  },
  // anh 31/10 ("quái có vẻ đứng yên, nhìn khá là đơ"): con chưa có mục tiêu đi loanh quanh chỗ đứng (m.home — đội hình) như quái thường; máy khác
  // thấy qua vị trí chủ bãi báo (theoChu — đi bộ tới chỗ đó)
  langThang(t) {
    const w = this.w;
    for (const m of this.mob.values()) {
      if (!m.alive || m.mucTen || (m.path && m.path.length) || !m.home) continue;
      if (!m.langLuc) { m.langLuc = t + (LANG_GIAY[0] + Math.random() * (LANG_GIAY[1] - LANG_GIAY[0])) * 1000; continue; }
      if (t < m.langLuc) continue;
      m.langLuc = t + (LANG_GIAY[0] + Math.random() * (LANG_GIAY[1] - LANG_GIAY[0])) * 1000;
      const a = Math.random() * Math.PI * 2, r = LANG_R[0] + Math.random() * (LANG_R[1] - LANG_R[0]), tx = m.home[0] + Math.cos(a) * r, ty = m.home[1] + Math.sin(a) * r * 0.5;
      if (w.map.walkable(tx, ty) && w.map.clear(m.x, m.y, tx, ty)) m.path = [[tx, ty]];
    }
  },
  // vừa lao vào: kéo các con chưa có mục tiêu đứng trong m.keo quanh nó — 1 lớp như World.keoNhom
  keo(m) { if (!m.keo) return; for (const o of this.mob.values()) if (o !== m && o.alive && !o.mucTen && ldist(o.x, o.y, m.x, m.y) <= m.keo) o.mucTen = m.mucTen; },
  baoViTri() {
    const tv = this.p.tv, so = (n) => tv.findIndex((x) => x[0] === n), q = [];
    for (const m of this.mob.values()) if (m.alive) q.push([m.vaDoi, Math.round(m.x), Math.round(m.y), m.mucTen ? so(m.mucTen) : -1]);
    if (q.length) Net.wsGui({ t: T.vt, q });
  },
  // máy không phải chủ bãi: mục tiêu theo chủ bãi, vị trí kéo dần về chỗ chủ bãi báo
  theoChu() {
    const w = this.w, tv = this.p.tv, ten = w.hero.name;
    for (const [uid, v] of this.vt) {
      const m = this.mob.get(uid); if (!m || !m.alive) continue;
      m.mucTen = v.i >= 0 && tv[v.i] ? tv[v.i][0] : null;
      if (v.xong) continue; // vị trí này đã dùng — chờ lần báo sau
      v.xong = true;
      const d = ldist(m.x, m.y, v.x, v.y);
      if (d > KEO_GAN) { m.x = v.x; m.y = v.y; m.path = null; continue; }
      if (m.mucTen === ten) continue; // đang đuổi chính mình: máy mình tự chạy
      if (m.mucTen) { if (d > KEO_DUOI) { m.x += (v.x - m.x) / 2; m.y += (v.y - m.y) / 2; } continue; }
      if (d > KEO_CHAY && w.map.walkable(v.x, v.y)) m.path = [[v.x, v.y]];
    }
  },
};
  // tab ẩn (trình duyệt chạy chậm): báo máy chủ để chọn người khác làm chủ bãi
  document.addEventListener("visibilitychange", () => { if (D.laTo()) Net.wsGui({ t: T.an, an: document.hidden ? 1 : 0 }); });
  return D;
}
export const VaDoi = taoDoi({ vao: "vaVao", dan: "vad", vt: "vah", an: "vaAn" });
