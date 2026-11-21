// Quái canh cây thu thập — nhiệm vụ Võ Lâm Minh Chủ (anh 03/11 lượt 2: "mỗi bãi 1 2 con quái đứng canh, mỗi con máu 1 triệu, k rơi đồ … tên với thanh
// máu đầy đủ … quái hồi sinh sau 5p khi bị giết"; máy chủ may-chu/minh-chu.js veTT / danhVe, kênh tức thời Net.ws*). Máy chủ gửi s = { v, ten, tpl, lv,
// thay, ds: [[u, bãi, x, y, máu, máu tối đa, nhận (sát thương của mình máy chủ đã nhận lần sống này), hồi (giây tới lúc sống lại — 0: đang sống), lần
// sống]] } qua kênh WebSocket (hoặc kèm nhịp). Ở bãi có quái canh: sinh từng con tại chỗ (World.spawnMob — mẫu tpl cấp lv; đánh trả, thấy người lại
// gần ≤ thay — như quái thường World.updateMob; tên + thanh máu + số máu như quái đặc biệt), máu = máu chung trừ phần mình vừa đánh mà máy chủ chưa nhận
// (đoán trước — khỏi giật). Đánh trúng (World.hit -> onMcv) cộng dồn, gửi mỗi 250 ms; máy mình không tự hạ (máu ≥ 1): máy chủ báo chết thì ngã, xác
// mất sau vài giây; sống lại (lần mới) thì sinh lại. Không kinh nghiệm / rơi đồ (World.kill m.mcv không báo giết).
//   QuaiCanh.ganWorld(world) lúc vào bãi · capNhat(s) · trung(m, v) · layNhip() -> [[u, d]] | null · tick() mỗi 250 ms · thoat()
import { Net } from "./net.js";

const BO_CHO = 1500; // phần đã gửi mà sau 1,5 giây máy chủ vẫn chưa nhận (mất trên đường) coi như bị bỏ
const XAC = 4;       // giây xác quái canh còn nằm (rồi mất, chờ sống lại)

export const QuaiCanh = {
  s: null, w: null,
  cho: new Map(),  // mã con -> sát thương chưa gửi
  gui: new Map(),  // mã con -> { d: đã gửi (cộng dồn trong lần sống này), luc, lan }

  ganWorld(w) { this.w = w; this.dat(); },
  thoat() { this.w = null; this.s = null; this.cho.clear(); this.gui.clear(); },

  capNhat(s) {
    if (s && this.s && s.v < this.s.v) return; // nhịp tới chậm hơn kênh: bỏ bản cũ
    this.s = s;
    // lần sống mới: tính từ phần máy chủ đã nhận (0), bỏ phần chưa gửi của lần trước
    if (s) for (const r of s.ds) { const g = this.gui.get(r[0]); if (!g || g.lan !== r[8]) { this.gui.set(r[0], { d: r[6] || 0, luc: performance.now(), lan: r[8] }); this.cho.delete(r[0]); } }
    this.dat();
  },

  // phần mình đã đánh con u mà máy chủ chưa nhận (đang trên đường / chưa gửi); nhan = máy chủ đã nhận
  doan(u, nhan) {
    const g = this.gui.get(u);
    if (g && g.d > nhan && performance.now() - g.luc > BO_CHO) g.d = nhan; // gửi đi mà máy chủ không nhận được: thôi đoán
    return Math.max(0, (g ? g.d : 0) - nhan) + (this.cho.get(u) || 0);
  },

  // sinh / cập nhật / hạ quái canh trên World đang chơi
  dat() {
    const w = this.w, s = this.s; if (!w || !s) return;
    for (const r of s.ds) {
      if (r[1] !== w.zone.id) continue;
      const [u, , x, y, mau, mauMax, nhan, hoi, lan] = r;
      const m = w.mobs.find((o) => o.mcv === u && o.mcvLan === lan);
      if (hoi > 0) { if (m && m.alive) w.kill(m); continue; } // máy chủ báo chết: ngã tại chỗ
      if (m) { if (m.alive) m.hp = Math.max(1, Math.min(m.hpMax, mau - this.doan(u, nhan))); continue; }
      for (const o of w.mobs.filter((q) => q.mcv === u)) w.mobs.splice(w.mobs.indexOf(o), 1); // xác lần trước
      const k = w.spawnMob(false, 0, { id: s.tpl, lvl: s.lv, at: [x, y] });
      if (!k) continue;
      Object.assign(k, { mcv: u, mcvLan: lan, dacBiet: true, name: s.ten, hpMax: mauMax, vision: s.thay });
      k.hp = Math.max(1, Math.min(mauMax, mau - this.doan(u, nhan)));
    }
  },

  // World.hit: sát thương mình gây cho quái canh
  trung(m, v) { if (m.mcv && this.s) this.cho.set(m.mcv, (this.cho.get(m.mcv) || 0) + v); },

  // kênh chưa mở: phần chưa gửi đi kèm nhịp
  layNhip() {
    if (!this.cho.size || !this.s || Net.wsOk) return null;
    const r = [];
    for (const [u, d] of this.cho) { if (d > 0) { r.push([u, Math.round(d)]); this.daGui(u, d); } }
    this.cho.clear();
    return r.length ? r : null;
  },
  daGui(u, d) { const g = this.gui.get(u) || { d: 0, luc: 0, lan: 0 }; g.d += d; g.luc = performance.now(); this.gui.set(u, g); },

  tick() {
    const s = this.s, w = this.w;
    if (s) for (const [u, d] of [...this.cho]) if (d > 0 && Net.wsGui({ t: "mcv", u, d: Math.round(d) })) { this.cho.delete(u); this.daGui(u, d); }
    if (!w || !s) return;
    for (const m of w.mobs.slice()) {
      if (!m.mcv) continue;
      if (!m.alive) { if (m.deadT > XAC) w.mobs.splice(w.mobs.indexOf(m), 1); continue; } // xác mất, chờ sống lại
      const r = s.ds.find((x) => x[0] === m.mcv); if (r && !r[7]) m.hp = Math.max(1, Math.min(m.hpMax, r[4] - this.doan(r[0], r[6])));
    }
  },
};
