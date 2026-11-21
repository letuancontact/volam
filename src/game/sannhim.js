// Săn Nhím Béo Phì — phía trình duyệt (anh 03/11; máy chủ may-chu/san-nhim.js, kênh tức thời Net.ws*). Máy chủ gửi s = { u (mã đợt), v, het, so,
// con, ket?: "het", dem (số con nhân vật mình bắt hôm nay), toiDa, lv, tpl, ten, ds: [[u, bãi, x, y, hệ, máu, máu tối đa, nhận (sát thương của
// mình máy chủ đã nhận), người bắt?]] } qua kênh WebSocket (hoặc kèm nhịp). Ở thôn / thành có nhím: sinh từng con tại chỗ của nó (World.spawnMob —
// mẫu Nhím của client; đứng yên, không đánh trả — World.updateMob m.nhim), máu = máu chung trừ phần mình vừa đánh mà máy chủ chưa nhận (đoán trước
// — khỏi giật). Đánh trúng (World.hit -> onNhim) cộng dồn, gửi mỗi 250 ms; máy mình không tự hạ nhím (máu ≥ 1): máy chủ báo bị bắt thì ngã. Đủ số
// con trong ngày: không gửi, báo 1 lần; Trợ Thủ thôi nhắm nhím (World.nhimDu). Dòng trạng thái trên giữa màn (game.css #snh) lúc có đợt; điện
// thoại: chỉ ở thôn / thành có nhím.
//   SanNhim.ganWorld(world) lúc vào bãi · capNhat(s) · trung(m, v) · layNhip() -> [[u, d]] | null · tick() mỗi 250 ms · thuong(ds) · thoat()
import { Net } from "./net.js";

const BO_CHO = 1500; // phần đã gửi mà sau 1,5 giây máy chủ vẫn chưa nhận (mất trên đường) coi như bị bỏ

export const SanNhim = {
  s: null, w: null, el: null,
  cho: new Map(),  // mã nhím -> sát thương chưa gửi
  don: new Map(),  // mã nhím -> số đòn trúng chưa gửi (anh 18/11 — nguồn sự kiện: mỗi đòn trúng nhím có tỉ lệ ra Trung Dược, máy chủ cắt theo thời gian)
  gui: new Map(),  // mã nhím -> { d: đã gửi (cộng dồn từ lúc vào đợt), luc }
  nga: new Set(),  // mã nhím đã ngã / biến mất ở bãi này (khỏi sinh lại)
  baoDu: 0,        // mã đợt đã báo "đủ số con trong ngày"
  api: null,       // { msg(chữ, màu), canh(chữ), tenMon(k), fmt(số), ten() } — main.js

  ganWorld(w) { this.w = w; this.nga.clear(); if (w) w.nhimDu = this.du(); this.dat(); },
  du() { const s = this.s; return !!s && !s.ket && s.dem >= s.toiDa; }, // đã bắt đủ số con trong ngày
  thoat() { this.w = null; this.s = null; this.cho.clear(); this.don.clear(); this.gui.clear(); this.nga.clear(); this.ve(); },

  capNhat(s) {
    if (s && this.s && s.u === this.s.u && s.v < this.s.v) return; // nhịp tới chậm hơn kênh: bỏ bản cũ
    if (!s || !this.s || s.u !== this.s.u) { // đợt mới / vào lại giữa đợt: tính từ phần máy chủ đã nhận
      this.cho.clear(); this.don.clear(); this.gui.clear(); this.nga.clear();
      if (s) for (const r of s.ds) this.gui.set(r[0], { d: r[7] || 0, luc: performance.now() });
    }
    this.s = s;
    if (this.w) this.w.nhimDu = this.du();
    this.dat();
    this.ve();
  },

  // phần mình đã đánh nhím u mà máy chủ chưa nhận (đang trên đường / chưa gửi); nhan = máy chủ đã nhận
  doan(u, nhan) {
    const g = this.gui.get(u);
    if (g && g.d > nhan && performance.now() - g.luc > BO_CHO) g.d = nhan; // gửi đi mà máy chủ không nhận được: thôi đoán
    return Math.max(0, (g ? g.d : 0) - nhan) + (this.cho.get(u) || 0);
  },

  // sinh / cập nhật / hạ nhím trên World đang chơi
  dat() {
    const w = this.w, s = this.s; if (!w) return;
    const z = w.zone.id, co = new Map(s ? s.ds.filter((r) => r[1] === z).map((r) => [r[0], r]) : []);
    for (const m of w.mobs.slice()) {
      if (!m.nhim || !m.alive) continue;
      const r = co.get(m.nhim);
      if (r && r[8]) { m.ai = r[8]; w.kill(m); this.nga.add(m.nhim); continue; } // bị bắt: ngã tại chỗ
      if (!r || s.ket) { w.mobs.splice(w.mobs.indexOf(m), 1); this.nga.add(m.nhim); } // hết đợt: chạy mất
    }
    if (!s || s.ket) return;
    for (const r of co.values()) {
      const [u, , x, y, he, mau, mauMax, nhan, ai] = r;
      if (ai || this.nga.has(u)) continue;
      let m = w.mobs.find((o) => o.nhim === u && o.alive);
      if (!m) {
        m = w.spawnMob(false, 0, { id: s.tpl, lvl: s.lv, series: he, at: [x, y] });
        if (!m) continue;
        Object.assign(m, { nhim: u, dacBiet: true, name: r[9] ? `${s.ten} ${r[9]}` : s.ten, hpMax: mauMax }); // r[9]: số thứ tự — "Nhím béo phì 3" (lượt 86)
      }
      m.hp = Math.max(1, Math.min(m.hpMax, mau - this.doan(u, nhan)));
    }
  },

  // World.hit: sát thương mình gây cho nhím (đủ số con trong ngày: không gửi — máy chủ cũng không tính)
  trung(m, v) {
    const s = this.s; if (!s || s.ket || !m.nhim) return;
    if (this.du()) {
      if (this.baoDu !== s.u && this.api) { this.baoDu = s.u; this.api.canh(`Hôm nay bạn đã bắt đủ ${s.toiDa} con ${s.ten} — đánh nữa không còn tác dụng, mai hãy quay lại.`); }
      return;
    }
    this.cho.set(m.nhim, (this.cho.get(m.nhim) || 0) + v);
    this.don.set(m.nhim, (this.don.get(m.nhim) || 0) + 1);
  },

  // kênh chưa mở: phần chưa gửi đi kèm nhịp
  layNhip() {
    if (!this.cho.size || !this.s || Net.wsOk) return null;
    const r = [];
    for (const [u, d] of this.cho) { if (d > 0) { r.push([u, Math.round(d), this.don.get(u) || 1]); this.daGui(u, d); } }
    this.cho.clear(); this.don.clear();
    return r.length ? r : null;
  },
  daGui(u, d) { const g = this.gui.get(u) || { d: 0, luc: 0 }; g.d += d; g.luc = performance.now(); this.gui.set(u, g); },

  tick() {
    const s = this.s;
    if (s && !s.ket) for (const [u, d] of [...this.cho]) if (d > 0 && Net.wsGui({ t: "nst", u, d: Math.round(d), k: this.don.get(u) || 1 })) { this.cho.delete(u); this.don.delete(u); this.daGui(u, d); }
    const w = this.w;
    if (w && s && !s.ket) for (const m of w.mobs) {
      if (!m.nhim || !m.alive) continue;
      const r = s.ds.find((x) => x[0] === m.nhim); if (r && !r[8]) m.hp = Math.max(1, Math.min(m.hpMax, r[5] - this.doan(r[0], r[7])));
    }
    this.ve();
  },

  // thưởng (nhịp — may-chu/san-nhim.js nhanThuong): [{ kn, len, mon: [{ k, n }], day, cho?, bai, tenBai, dem, toiDa, lai? }]
  thuong(ds) {
    const A = this.api; if (!A) return;
    const mon = (L) => L.map((m) => `${A.tenMon(m.k)}${m.n > 1 ? ` ×${m.n}` : ""}`).join(", ");
    const ten = (r) => `${(this.s && this.s.ten) || "Nhím béo phì"}${r.so ? " " + r.so : ""}`;
    for (const r of ds) {
      if (r.lai) { if (r.mon.length) A.msg(`Săn nhím: đã nhận phần quà còn chờ — ${mon(r.mon)}.`, "tien"); continue; }
      // anh 18/11 — nguồn sự kiện: đánh trúng nhím may mắn ra món sự kiện (Trung Dược)
      if (r.loai === "nsk") { if (r.mon.length) A.msg(`Săn nhím: may mắn nhận được ${mon(r.mon)}!`, "tien"); if (r.day) A.canh(`Săn nhím: hành trang đầy — dọn chỗ để nhận ${mon(r.cho || [])} (giữ 30 phút).`); continue; }
      // lượt 86: thưởng phát hiện (đánh trúng đầu tiên) / tham gia lúc nhím bị bắt — kinh nghiệm + Xu may mắn
      if (r.loai === "phat" || r.loai === "tham") {
        A.msg(`${r.loai === "phat" ? "Phát hiện" : "Tham gia bắt"} ${ten(r)} ở ${r.tenBai}${r.kn ? ` — nhận ${A.fmt(r.kn)} điểm kinh nghiệm` : ""}.`, "kn");
        if (r.xu) A.msg(`Săn nhím: may mắn nhận được ${r.xu} Xu!`, "tien");
        continue;
      }
      A.msg(`Bắt được ${ten(r)} ở ${r.tenBai} (con thứ ${r.dem}/${r.toiDa} hôm nay) — nhận ${A.fmt(r.kn)} điểm kinh nghiệm.`, "kn");
      if (r.mon.length) A.msg(`Quà săn nhím: ${mon(r.mon)}.`, "tien");
      if (r.day) A.canh(`Săn nhím: hành trang đầy — dọn chỗ để nhận ${mon(r.cho || [])} (giữ 30 phút).`);
    }
  },

  // dòng trạng thái trên giữa màn: đợt đang có (còn mấy con, giờ còn, mình đã bắt mấy con hôm nay) / vừa hết
  ve() {
    const s = this.s, w = this.w;
    const tai = !!w && !!s && s.ds.some((r) => r[1] === w.zone.id);
    if (!s || !w) { if (this.el) { this.el.style.display = "none"; this.el.dataset.sig = ""; } return; }
    if (!this.el) { this.el = document.createElement("div"); this.el.id = "snh"; document.body.appendChild(this.el); }
    const con = Math.max(0, Math.round((s.het - Date.now()) / 1000)), gio = `${Math.floor(con / 60)}:${String(con % 60).padStart(2, "0")}`;
    const sig = [s.u, s.v, s.ket || "", gio, tai].join("|");
    if (this.el.dataset.sig === sig) return;
    this.el.dataset.sig = sig;
    this.el.classList.toggle("tai", tai);
    this.el.style.display = "";
    this.el.innerHTML = s.ket
      ? `<b>Săn Nhím Béo Phì</b> <em>đã kết thúc</em>`
      : `<b>Săn Nhím Béo Phì</b> <span>còn ${s.con}/${s.so} con</span> <em>· ${gio}</em> <i class="${s.dem >= s.toiDa ? "du" : ""}">· hôm nay ${s.dem}/${s.toiDa}</i>`;
  },
};
