// Boss thế giới máu chung — phía trình duyệt (anh 31/10 — "quái chung" bước 1; máy chủ may-chu/boss-tg.js, kênh tức thời Net.ws*). Máy chủ
// gửi trạng thái từng boss b = { u, v, tpl, ten, he, lv, bai, tenBai, x, y, X, Y, mau, mauMax, het, top: [[tên, %]], cua (sát thương của mình máy chủ đã
// tính), nhan (máy chủ đã nhận, cả phần vượt hạn mức không tính), so, stK, vg, phat?, muc? (tên người boss đang đánh — mucTieu), ket?: "chet" | "roi" } qua
// kênh WebSocket (hoặc kèm nhịp). Anh 13/11 (lượt 86): nhiều boss mỗi khung giờ (danh sách ds — capNhat nhận mảng; bản 1 boss vẫn nhận), máu tăng theo người
// tham gia (mauMax đổi), sát thương boss + stK % (nhân vào đòn của boss), vòng sáng chủ độc quanh boss (vg — vong: mỗi nhịp theo % máu boss trúng độc nếu
// đứng trong tầm), miễn choáng (m.mienChoang — vocong.js mobTick), đòn thường trừ kháng độc (m.heSt — world.js updateMob). Ở đúng bãi:
// sinh boss tại chỗ của nó (World.spawnMob — mẫu Boss Hoàng Kim, cấp 95, hệ của boss); máu boss = máu chung trừ phần mình vừa đánh mà máy chủ
// chưa nhận (đoán trước — khỏi giật). Đánh trúng (World.hit -> onBtg) cộng dồn, gửi mỗi 250 ms qua kênh (kênh chưa mở: kèm nhịp — layNhip).
// Máy mình không tự hạ boss (máu ≥ 1): máy chủ báo chết thì boss ngã. Bảng trên giữa màn (game.css #btg): tên + bãi, thanh máu chung, phần của
// mình, 5 người đánh nhiều nhất (boss gần mình nhất ở bãi này — chinh); boss khác 1 dòng; ở bãi khác chỉ dòng gọn. Điện thoại: chỉ ở bãi có boss — thanh
// gọn (tên + tọa độ, thanh máu) ngay dưới tên bãi, chạm thanh mới hiện phần của mình + 5 người. Boss chết: khung kết quả (thuong).
//   BossTG.ganWorld(world) lúc vào bãi · capNhat(ds | b) · b (boss chính — Trợ Thủ / công cụ) · trung(m, v) · layNhip() -> [[u, d]] | null · tick() mỗi 250 ms ·
//   thuong(ds) · thoat()
import { Net } from "./net.js";
import { ldist } from "./map.js";
import { kindOf } from "./vocong.js";
import { khangThat } from "./rules.js";
import { VaDoi } from "./vadoi.js"; // boss cuối Vượt Ải: người trong ải (bảng boss phụ — anh 18/11)
import { VdDoi } from "./viemde.js"; // boss cuối Viêm Đế (Lương Mi Nhi): đợt loai "cuoi" của phòng

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const so = (n) => Math.max(0, Math.round(n)).toLocaleString("vi-VN");
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const VHD_CHIEU = 69, VHD_TRUNG = "90ea0e899f"; // Vô Hình Độc (Ngũ Độc): chiêu 69 (trạng thái vòng bám chân) + hình trúng của đạn 94 "Vòng tròn gây sát thương" — siêu boss (anh 18/11)
const BO_CHO = 1500; // phần đã gửi mà sau 1,5 giây máy chủ vẫn chưa nhận (mất trên đường) coi như bị bỏ
// phái của từng Boss Hoàng Kim (anh 13/11 lượt 86 — "vòng xanh này xấu quá, cho boss xài kĩ năng 90 nội ngoại của các phái tương ứng"): theo Skill1–4 của mẫu
// trong client settings\npcs.txt (vd 741 Đường Bất Nhiễm 302 / 351 / 342 = Đường Môn; 742 Bạch Doanh Doanh 353 / 355 = Ngũ Độc) -> boss ra đủ chiêu 90 tấn công của phái đó
// (bỏ bùa / hồi máu); mẫu lạ: 1 trong 2 phái cùng hệ (như quái có võ công)
const BOSS_PHAI = { 741: "tangmen", 742: "wudu", 744: "cuiyan", 745: "gaibang", 746: "wudang", 747: "kunlun", 748: "tianwang", 565: "tianren", 582: "wudu", 567: "cuiyan",
  562: "wudang", 563: "tianren", 566: "tianwang", 568: "emei", 511: "wudang", 1358: "wudu" };

// bảng boss mẫu C (anh 17/11): kháng theo ngũ hành client [khóa, chữ, màu, hệ] — Kim = vật lý, Mộc = độc, Thủy = hàn, Hỏa = hỏa, Thổ = lôi; chân dung ANH × ANH điểm (1:1)
const KHANG = [["phys", "Vật lý", "#e9dcc0", 0], ["poison", "Độc", "#86ff6a", 1], ["cold", "Hàn", "#7fd3ff", 2], ["fire", "Hỏa", "#ff8a5a", 3], ["light", "Lôi", "#ffe25a", 4]];
const ANH = 46;
const SAT_TAM = 900; // bảng Boss Sát thủ (anh 18/11): con gần nhất trong chừng này (px logic — hơn nửa màn một chút)

export const BossTG = {
  ds: [], w: null, mobs: new Map(), g: new Map(), daXong: new Set(), el: null, anh: new Map(), // anh: chân dung đã cắt theo mã boss (anhCua)
  api: null, // { msg(chữ, màu), bao(html), ketQua(ds), tenMon(k), fmt(số) } — main.js

  // boss chính (Trợ Thủ thẻ Boss Hoàng Kim, đi tới boss, công cụ thử): boss còn sống ở bãi mình gần nhất -> boss còn sống đầu tiên -> boss vừa xong
  get b() { return this.chinh(); },
  chinh() {
    const L = this.ds; if (!L.length) return null;
    const w = this.w, song = L.filter((b) => !b.ket), o = w ? song.filter((b) => b.bai === w.zone.id) : [];
    if (o.length) { const p = w.player; return o.reduce((a, b) => (ldist(p.x, p.y, a.x, a.y) <= ldist(p.x, p.y, b.x, b.y) ? a : b)); }
    return song[0] || L[0];
  },

  ganWorld(w) { this.w = w; this.mobs = new Map(); this.dat(); },
  thoat() { this.w = null; this.mobs = new Map(); this.ds = []; this.g = new Map(); this.anh = new Map(); this.ve(); this.veSat(); },

  // x: danh sách boss (máy chủ ds) | 1 boss (bản cũ) | null
  capNhat(x) {
    const L = Array.isArray(x) ? x : x ? [x] : [], moi = [];
    for (const b of L) {
      if (!b || b.u == null) continue;
      const cu = this.ds.find((o) => o.u === b.u);
      if (cu && b.v < cu.v) { moi.push(cu); continue; } // nhịp tới chậm hơn kênh: giữ bản mới hơn
      if (!this.g.has(b.u)) this.g.set(b.u, { cho: 0, gui: b.nhan || 0, luc: performance.now(), vongT: 0 }); // vào lại giữa trận: tính từ phần máy chủ đã nhận
      moi.push(b);
    }
    for (const u of [...this.g.keys()]) if (!moi.some((b) => b.u === u)) this.g.delete(u);
    this.ds = moi;
    this.dat();
    this.ve();
  },

  // phần mình đã đánh boss b mà máy chủ chưa nhận (đang trên đường / chưa gửi) — b.nhan: máy chủ đã nhận, cả phần vượt hạn mức không tính
  doan(b) {
    const g = b && this.g.get(b.u); if (!g || b.ket) return 0; // boss đã chết / rời: chỉ còn phần máy chủ đã tính
    const da = b.nhan ?? b.cua;
    if (g.gui > da && performance.now() - g.luc > BO_CHO) g.gui = da; // gửi đi mà máy chủ không nhận được (kênh đứt giữa chừng): thôi đoán
    return Math.max(0, g.gui - da) + g.cho;
  },

  // sinh / cập nhật / hạ các boss trên World đang chơi
  dat() {
    const w = this.w; if (!w) return;
    const o = this.ds.filter((b) => b.bai === w.zone.id), us = new Set(o.map((b) => b.u));
    for (const m of w.mobs.filter((x) => x.btg && !us.has(x.btg))) { if (m.alive) w.mobs.splice(w.mobs.indexOf(m), 1); this.mobs.delete(m.btg); } // boss khác / hết boss
    for (const b of o) {
      let m = this.mobs.get(b.u); if (m && !w.mobs.includes(m)) m = null;
      if (!m) m = w.mobs.find((x) => x.btg === b.u) || null;
      if (b.ket) { // chết / rời: ngã tại chỗ (rời: biến mất)
        if (m && m.alive) { if (b.ket === "chet") w.kill(m); else w.mobs.splice(w.mobs.indexOf(m), 1); }
        this.daXong.add(b.u); this.mobs.delete(b.u); continue;
      }
      if (!m) {
        if (this.daXong.has(b.u)) continue;
        m = w.spawnMob(false, 0, { id: b.tpl, lvl: b.lv, series: b.he, at: [b.x, b.y], ten: b.ten, btg: true });
        if (!m) continue;
        Object.assign(m, { btg: b.u, dacBiet: true, name: b.ten, mienChoang: 1, heSt: "poison" }); // lượt 86: miễn choáng, đòn chủ độc (khi chưa có chiêu)
        // siêu boss sự kiện (anh 18/11 — may-chu/boss-tg.js goiSk): hình boss của client anh chọn (b.hinh — boss193), miễn chậm, chiêu 90 mọi phái (ganChieu)
        if (b.sk) { const P = w.P; Object.assign(m, { sk: 1, mienCham: 1, type: b.hinh || m.type, radius: Math.round((m.radius || 20) * 1.5) }); if (P.npc) { P.npc.ensure(m.type); m.hurtDur = P.npc.duration(m.type, "hurt") || 0.5; } this.vongVhd(m, b); }
        this.ganChieu(m, b);
      }
      this.capMob(m, b);
      this.mobs.set(b.u, m);
    }
    if (this.daXong.size > 40) this.daXong = new Set([...this.daXong].slice(-20));
  },
  // chiêu 90 của phái boss (World.ganChieuDs — đòn đánh thường của boss thành chiêu của phái, đạn / hình như người chơi ra chiêu; quái có võ công tắt thì đánh thường)
  ganChieu(m, b) {
    const w = this.w, P = w && w.P; if (!P || !w.ganChieuDs) return;
    const db = P.skillDb || {}, key = BOSS_PHAI[b.tpl] || (((w.quaiVC && w.quaiVC.phai) || {})[b.he] || [])[Math.abs(b.tpl | 0) % 2];
    if (b.sk) { // siêu boss (anh 18/11 "dùng kĩ năng ngũ hành các phái (skill 90)"): chiêu 90 tấn công của cả 10 phái
      const ds = (P.factions || []).flatMap((f) => ((f.books && f.books[90]) || []).filter((id) => db[id] && kindOf(db[id], db) === "attack"));
      if (ds.length) { w.ganChieuDs(m, ds, 1); if (m.vcDs) m.phaiBoss = "Thập đại môn phái"; }
      return;
    }
    const f = (P.factions || []).find((x) => x.key === key), ds = ((f && f.books && f.books[90]) || []).filter((id) => db[id] && kindOf(db[id], db) === "attack");
    if (ds.length) { w.ganChieuDs(m, ds, 1); if (m.vcDs) m.phaiBoss = f.n; }
  },
  // máu (máu tối đa tăng theo người tham gia), mục tiêu, sát thương + stK %
  capMob(m, b) {
    m.hpMax = Math.max(1, b.mauMax); m.hp = Math.max(1, Math.min(m.hpMax, b.mau - this.doan(b)));
    m.muc = this.mucTieu(b);
    if (!m.dmgGoc && Array.isArray(m.dmg)) m.dmgGoc = m.dmg.slice();
    if (m.dmgGoc) { const k = (1 + Math.max(0, +b.stK || 0) / 100) * (b.sk ? Math.max(1, +b.stX || 1) : 1); m.dmg = m.dmgGoc.map((v) => Math.round(v * k)); } // siêu boss: × stX (anh 18/11)
    if (b.sk) m.skMinhDanh = this.daDanh(b);
  },
  // mình đã đánh boss b chưa (máy chủ đã tính / đã gửi / đang chờ gửi) — siêu boss chỉ đánh người đã đánh nó (anh 18/11)
  daDanh(b) { const g = this.g.get(b.u); return !!((b.cua || 0) > 0 || (b.nhan || 0) > 0 || (g && (g.gui > 0 || g.cho > 0))); },

  // mục tiêu chung máy chủ chọn (b.muc — tên nhân vật, anh 31/10 "boss đánh không cùng 1 mục tiêu"): mình -> world.player, người khác cùng bãi
  // -> world.others (World.updateMob: đuổi người đó, chỉ trừ máu khi là mình); chưa có / không thấy người đó -> null (boss về chỗ)
  mucTieu(b) {
    const w = this.w; if (!w || !b || !b.muc || b.ket) return null;
    return b.muc === w.hero.name ? w.player : w.others.get(b.muc) || null;
  },

  // World.hit: sát thương mình gây cho boss m
  trung(m, v) { const b = this.ds.find((x) => x.u === m.btg); if (b && !b.ket) { const g = this.g.get(b.u); if (g) g.cho += v; } },

  // kênh chưa mở: phần chưa gửi đi kèm nhịp
  layNhip() {
    if (Net.wsOk) return null;
    const r = [];
    for (const b of this.ds) {
      const g = this.g.get(b.u); if (!g || !(g.cho > 0) || b.ket) continue;
      r.push([b.u, Math.round(g.cho)]); g.gui += g.cho; g.cho = 0; g.luc = performance.now();
    }
    return r.length ? r : null;
  },

  tick() {
    const now = performance.now();
    for (const b of this.ds) {
      const g = this.g.get(b.u); if (!g) continue;
      if (g.cho > 0 && !b.ket && Net.wsGui({ t: "bst", u: b.u, d: Math.round(g.cho) })) { g.gui += g.cho; g.cho = 0; g.luc = now; }
      const m = this.mobs.get(b.u);
      if (m && !b.ket && m.alive) { this.capMob(m, b); this.vong(b, m, g, now); if (b.sk) this.buaSk(b, m, g, now); }
    }
    this.hetBuaSk();
    this.ve();
    this.veSat(); // Boss Sát thủ (anh 18/11)
  },

  // sát thương vùng chủ độc của boss (anh 13/11 lượt 86): mỗi nhịp (b.vg.nhip [[≤ % máu, giây]] — 100 %: 3 giây, ≤ 50 %: 2, ≤ 25 %: 1, ≤ 10 %: 0,5) mình đứng trong tầm
  // vg.r quanh boss thì trúng độc = đòn thường của boss (đã + stK %) × vg.hs, trừ kháng độc, không né được. Anh xem bản đầu: "chủ yếu là cái vòng xanh lá em làm xấu, có thể
  // bỏ, còn sát thương" -> không vẽ vòng (chỉ hiện số trừ máu); chiêu 90 của phái là đòn chủ động của boss (ganChieu), không thay vùng này. Khu an toàn / ẩn thân /
  // trọng thương: không trúng
  vong(b, m, g, now) {
    const w = this.w, V = b.vg, p = w && w.player, D = b.sk ? b.vd || {} : null;
    if (D) this.vongVhd(m, b);
    const R = D && D.r > 0 ? +D.r : V && V.r, HS = D && D.hs >= 0 ? +D.hs : V && V.hs;
    if (!V || !(R > 0) || !(HS > 0) || !p) return;
    const pct = (b.mau * 100) / Math.max(1, b.mauMax), L = (Array.isArray(V.nhip) ? V.nhip : []).filter((x) => Array.isArray(x)).slice().sort((a, c) => a[0] - c[0]);
    const giay = Math.max(0.25, +((L.find(([moc]) => pct <= moc) || L[L.length - 1] || [100, 3])[1]) || 3);
    if (!g.vongT) { g.vongT = now + giay * 1000; return; } // vừa thấy boss: chờ 1 nhịp
    if (now < g.vongT) return;
    g.vongT = now + giay * 1000;
    // siêu boss (anh 18/11 tối — vùng độc cố định): trúng khi đứng trong vùng quanh chỗ boss xuất hiện (b.x, b.y — bán kính R, đúng chỗ 12 vòng) hoặc sát chân boss
    // (D.rChan — vòng giữa đi theo boss); Boss Hoàng Kim: quanh boss như cũ
    const trong = D ? ldist(p.x, p.y, +b.x, +b.y) <= R || ldist(p.x, p.y, m.x, m.y) <= (+D.rChan > 0 ? +D.rChan : 150) : ldist(p.x, p.y, m.x, m.y) <= R;
    if (p.hp <= 0 || p.hideUntil > w.time || w.map.an(p.x, p.y) || !trong) return;
    if (b.sk && !this.daDanh(b)) return; // siêu boss (anh 18/11): vòng độc chỉ trúng người đã đánh nó
    const res = khangThat((p.res && p.res.poison) || 0, p.resCap ? p.resCap.poison ?? 75 : 75), d = Array.isArray(m.dmg) ? m.dmg : [1, 1];
    const v = Math.max(1, Math.floor((ri(d[0], d[1] ?? d[0]) * HS * (100 - res)) / 100));
    if (D && w.heroDoc) { // siêu boss (anh 18/11 "vô hình độc làm sát thương AOE theo thời gian"): 1 lớp độc tổng v ngấm D.giay giây, mỗi D.moi giây trừ 1 lần (vocong.js heroDoc —
      // bùa Túy Hồ Chú "thời gian trúng độc +100 %" kéo dài gấp đôi = tổng độc gấp đôi) + hình trúng "Vòng tròn gây sát thương" (đạn 94 của Vô Hình Độc) trên người mình
      const f = Math.max(18, Math.round((+D.giay || 4) * 18)), e = Math.max(1, Math.min(f, Math.round((+D.moi || 0.5) * 18)));
      w.heroDoc(m, v, { f, e });
      if (w.vfxAt) w.vfxAt(VHD_TRUNG, null, p, 0);
      return;
    }
    w.hit(m, p, { v, poison: true });
  },
  // hình vòng Vô Hình Độc (chiêu 69 của Ngũ Độc — trạng thái 6 "无形蛊", bám chân) dưới chân siêu boss; cấu hình sieuBoss.vongDoc: to = cỡ vòng giữa, rai = số vòng nhỏ rải
  // khắp vùng độc cố định quanh chỗ boss xuất hiện (bán kính r — vocong.js vcVeVungDoc), toRai = cỡ vòng nhỏ, rChan = tầm độc sát chân boss
  vongVhd(m, b) {
    const P = this.w && this.w.P, k = P && P.vc && P.vc.sk(VHD_CHIEU); if (!k || !k.state) return;
    if (!m.vongSt) { m.vongSt = k.state; try { P.vc.warm(VHD_CHIEU); } catch {} }
    const D = (b && b.vd) || {};
    m.vongTo = Math.max(0.3, Math.min(6, +D.to || 1)); m.vongRai = Math.max(0, Math.min(24, +D.rai | 0)); m.vongToRai = Math.max(0.3, Math.min(4, +D.toRai || 1.7)); m.vongR = Math.max(50, +D.r || 500);
    if (b && Number.isFinite(+b.x) && Number.isFinite(+b.y)) { m.vongX = +b.x; m.vongY = +b.y; } // vùng độc cố định ở chỗ boss xuất hiện (anh 18/11 tối)
  },

  // bùa hại của siêu boss (anh 18/11 "bùa hại trừ kháng tất cả, giảm hồi máu và bùa thời gian trúng độc"): mỗi b.bua.nhip giây, mình đã đánh boss và đứng trong b.bua.r ->
  // p.skBua { until, attrs: toàn kháng −khang, thời gian trúng độc +doc % (world.js bonus cộng như bùa), giamHoi: hồi sinh lực −% (world.js hoiK) } giữ b.bua.giay giây; tính lại chỉ số
  buaSk(b, m, g, now) {
    const w = this.w, p = w && w.player, U = b.bua || {}; if (!p || !(U.nhip > 0)) return;
    if (!g.buaT) { g.buaT = now + U.nhip * 1000; return; }
    if (now < g.buaT) return;
    g.buaT = now + U.nhip * 1000;
    if (p.hp <= 0 || !this.daDanh(b) || w.map.an(p.x, p.y) || ldist(p.x, p.y, m.x, m.y) > (+U.r || 700)) return;
    p.skBua = { until: w.time + Math.max(1, +U.giay || 10), giamHoi: Math.max(0, Math.min(100, +U.giamHoi || 0)), attrs: { allres_p: [-Math.max(0, +U.khang || 0)], poisontimereduce_p: [-Math.max(0, +U.doc || 0)] } };
    w.refreshStats(false);
    w.text(p, "Túy Hồ Chú", "#c78bff");
    if (this.api) this.api.msg(`${b.ten} thi triển bùa hại: toàn kháng −${+U.khang || 0}, hồi sinh lực −${+U.giamHoi || 0}%, thời gian trúng độc +${+U.doc || 0}% trong ${+U.giay || 10} giây`, "canh");
  },
  hetBuaSk() { const w = this.w, p = w && w.player; if (p && p.skBua && p.skBua.until <= w.time) { p.skBua = null; w.refreshStats(false); } },

  // thưởng (nhịp — may-chu/boss-tg.js nhanThuong): [{ ten, hang, pct, kn, len, mon: [{ k, n }], kich?, day, cho, bang, so, tenNv, khongDu?, chiXem?, lai, xu? }] — vài dòng
  // tin + khung kết quả (windows.js ketQuaBoss: bảng xếp hạng + ô thưởng); lai = phần đồ chờ (lần trước túi đầy) nay mới vào túi: chỉ dòng tin
  thuong(ds) {
    const A = this.api; if (!A) return;
    const mon = (L) => L.map((m) => `${A.tenMon(m.k)}${m.n > 1 ? ` ×${m.n}` : ""}`).join(", ");
    for (const r of ds) {
      const K = r.kich, monK = (K && K.mon) || [];
      if (r.sk && !r.lai && !r.chiXem) { // siêu boss (anh 18/11): kinh nghiệm chia đều, quà theo hạng + quà tham gia (hết giờ chưa hạ: ½)
        A.msg(`Siêu boss ${r.ten}${r.nua ? " (hết giờ chưa hạ — nhận một nửa)" : ""}: hạng ${r.hang}/${r.so} (${String(r.pct).replace(".", ",")}% sát thương) — nhận ${A.fmt(r.kn)} điểm kinh nghiệm (chia đều).`, "kn");
        if (r.mon && r.mon.length) A.msg(`Siêu boss ${r.ten}: nhận ${mon(r.mon)}.`, "tien");
        if (r.day) A.msg(`Siêu boss ${r.ten}: hành trang đầy — dọn chỗ để nhận phần đồ (giữ 30 phút).`, "canh");
        continue;
      }
      if (r.lai) { if (r.mon.length || monK.length) A.msg(`Boss thế giới ${r.ten}: đã nhận phần đồ còn chờ ${mon([...r.mon, ...monK])}.`, "tien"); continue; }
      if (r.kn) A.msg(`Boss thế giới ${r.ten}: hạng ${r.hang} (${String(r.pct).replace(".", ",")}% sát thương) — nhận ${A.fmt(r.kn)} điểm kinh nghiệm.`, "kn");
      if (r.mon && r.mon.length) A.msg(`Boss thế giới ${r.ten}: quà xếp hạng ${mon(r.mon)}.`, "tien");
      if (K && K.kn) A.msg(`Boss thế giới ${r.ten}: đòn kết liễu — thêm ${A.fmt(K.kn)} điểm kinh nghiệm.`, "kn");
      if (monK.length) A.msg(`Boss thế giới ${r.ten}: quà kích sát ${mon(monK)}.`, "tien");
      if (r.khongDu) A.msg(`Boss thế giới ${r.ten}: bạn chưa đủ ${r.khongDu}% sát thương — không có quà xếp hạng.`);
      // quà tham gia (anh 11/11, 13/11 lên 2 rương — may-chu/boss-tg.js r.tg): Bảo rương đồ xanh vào túi ở nhịp (hàng chờ — túi đầy thì dọn túi là vào)
      if (r.tg) A.msg(`Boss thế giới ${r.ten}: quà tham gia ${r.tg} ${A.tenMon("ms:1884")}.`, "tien");
      if (r.xu) A.msg(`Boss thế giới ${r.ten}: may mắn nhận được ${r.xu} Xu!`, "tien"); // lượt 86: mỗi người tham gia xuTl % được 1 Xu
      if (r.day) A.msg(`Boss thế giới ${r.ten}: hành trang đầy — dọn chỗ để nhận phần đồ (giữ 30 phút).`, "canh");
    }
    const kq = ds.filter((r) => !r.lai);
    if (kq.length && A.ketQua) A.ketQua(kq);
  },

  // bảng trên giữa màn: boss chính (ở bãi mình — bảng đủ; boss khác cùng bãi / bãi khác: 1 dòng gọn mỗi con, tối đa 3)
  ve() {
    const b = this.chinh();
    if (!b || (!this.w && this.ds.every((x) => x.ket))) { if (this.el) { this.el.style.display = "none"; this.el.dataset.sig = ""; this._day(); } return; }
    // điện thoại: chạm bảng = hiện / ẩn 5 người đánh nhiều nhất (game.css .mo)
    // bảng chi tiết (anh 17/11 chọn mẫu C): máy tính bấm "Chi tiết ▾", điện thoại chạm bảng — bật lớp .mo, nhớ ở máy này
    if (!this.el) {
      this.el = document.createElement("div"); this.el.id = "btg";
      try { this.el.classList.toggle("mo", localStorage.getItem("vl_btgMo") === "1"); } catch { /* không đọc được thì đóng */ }
      this.el.onclick = (e) => { if (!document.body.classList.contains("dt") && !(e.target.closest && e.target.closest(".btg-nut"))) return; const mo = this.el.classList.toggle("mo"); try { localStorage.setItem("vl_btgMo", mo ? "1" : "0"); } catch { /* bỏ qua */ } this._day(); };
      document.body.appendChild(this.el);
    }
    const tai = !!this.w && this.w.zone.id === b.bai;
    const gio = (x) => { const con = Math.max(0, Math.round((x.het - Date.now()) / 1000)); return `${Math.floor(con / 3600)}:${String(Math.floor((con % 3600) / 60)).padStart(2, "0")}:${String(con % 60).padStart(2, "0")}`; };
    const ketCua = (x) => (x.ket === "chet" ? "Đã bị tiêu diệt" : x.ket === "roi" ? "Đã rời đi" : `còn ${gio(x)}`);
    const mau = b.ket === "chet" ? 0 : Math.max(0, b.mau - (tai ? this.doan(b) : 0)), pct = b.mauMax ? (mau * 100) / b.mauMax : 0;
    const khac = this.ds.filter((x) => x !== b && !x.ket).slice(0, 3);
    const m = tai ? this.mobs.get(b.u) : null, tt = m ? this.trangThaiQuai(m) : [], kh = m ? this.khangQuai(m) : [];
    const sig = [b.u, b.v, tai, Math.round(pct * 10), ketCua(b), (this.g.get(b.u) || {}).cho > 0, khac.map((x) => `${x.u}:${Math.round((x.mau * 100) / Math.max(1, x.mauMax))}`).join(","),
      tt.map((x) => `${x.k}:${Math.ceil(x.s)}`).join(","), kh.map((x) => x.v).join(","), !!(this.anh.get(b.u) || {}).ok].join("|");
    if (this.el.dataset.sig === sig) return;
    this.el.dataset.sig = sig;
    this.el.classList.toggle("gon", !tai);
    this.el.style.display = "";
    if (tai) { this.el.innerHTML = this._veC(b, m, mau, pct, ketCua(b), tt, kh) + this._dongKhac(khac); const o = this.el.querySelector(".btg-anh"); if (o) o.appendChild(this.anhCua(b.u, m)); this._day(); return; }
    // ở bãi khác: 1 dòng gọn — tên + bãi (x/y) · giờ còn (b.noi: chỗ ở thôn / thành — anh 02/11 "ngoài Cổng Nam"); boss khác còn sống: 1 dòng mỗi con
    const noi = (x) => (x.noi ? ` ${esc(x.noi)}` : "");
    this.el.innerHTML = `<div class="btg-ten">${b.sk ? "Siêu boss" : "Boss thế giới"}: ${esc(b.ten)} <em>${esc(b.tenBai)}${noi(b)} (${b.X}/${b.Y}) · ${ketCua(b)}</em></div>` + this._dongKhac(khac);
    this._day();
  },
  _dongKhac(khac) {
    const noi = (x) => (x.noi ? ` ${esc(x.noi)}` : "");
    return khac.length ? `<div class="btg-khac">${khac.map((x) => `${esc(x.ten)} <em>${esc(x.tenBai)}${noi(x)} (${x.X}/${x.Y}) ${Math.max(1, Math.round((x.mau * 100) / Math.max(1, x.mauMax)))}%</em>`).join(" · ")}</div>` : "";
  },

  // ---------- bảng boss mẫu C (anh 17/11 — "cái này khá ổn, chỉ là avt con boss hơi mờ"): thanh gọn — chân dung · tên · cấp · hệ · BOSS · giờ còn, thanh máu chung,
  // trạng thái boss đang dính (hình trạng thái client + giây bên cạnh); bảng chi tiết (.mo): kháng 5 hệ theo ngũ hành client (Kim = vật lý, Mộc = độc, Thủy = hàn,
  // Hỏa, Thổ = lôi — số sau bùa giảm kháng, giảm thì chữ xanh), sát thương / tỉ lệ / hạng của mình (b.hg — máy chủ cũ chưa gửi: hạng trong top 5), người đánh,
  // chỗ, boss + % sát thương, top 5 + dòng của mình khi ngoài top. Số máu / người đánh / top là máu chung của máy chủ (may-chu/boss-tg.js)
  _veC(b, m, mau, pct, con, tt, kh) {
    const p1 = (x) => (+x).toFixed(1).replace(".", ",");
    const cua = (b.cua || 0) + this.doan(b), tl = b.mauMax ? (cua * 100) / b.mauMax : 0, ten = this.w && this.w.hero ? this.w.hero.name : "";
    const top = Array.isArray(b.top) ? b.top : [], o = top.findIndex(([t]) => t === ten), hg = b.hg || (o >= 0 ? o + 1 : 0);
    return this.bangC({ ten: b.ten, lv: b.lv, he: b.he, tag: b.sk ? "SIÊU BOSS" : "BOSS", goc: con.replace(/^còn/, "Còn"), mau, mauMax: b.mauMax, pct, tt, kh,
      trai: `Sát thương của bạn: <b class="xanh">${so(cua)}</b><br>Tỉ lệ: <b class="xanh">${p1(tl)}%</b>${hg ? ` · hạng <b class="vang">${hg}</b>` : ""}<br>Người đánh: <b class="vang">${b.so || 0}</b>`
        + `${b.stK ? `<br>Boss +${b.stK}% sát thương` : ""}<br><span class="lam">${esc(b.tenBai)}${b.noi ? ` ${esc(b.noi)}` : ""} (${b.X}/${b.Y})</span>`,
      phai: `<ol class="btg-top">${top.map(([t, p], i) => `<li${t === ten ? ' class="minh"' : ""}><em>${i + 1}.</em><b>${esc(t)}</b>${p1(p)}%</li>`).join("")}`
        + `${o < 0 && hg ? `<li class="minh"><em>${hg}.</em><b>${esc(ten)}</b>${p1(tl)}%</li>` : ""}${!top.length && !hg ? `<li class="trong">Chưa ai đánh</li>` : ""}</ol>` });
  },
  // bộ vẽ bảng mẫu C dùng chung (boss thế giới _veC, Boss Sát thủ veSat — anh 18/11; sau này boss Viêm Đế / Vượt Ải): D = { ten, lv, he, tag (nhãn đỏ), goc (chữ góc phải:
  // giờ còn / tọa độ), mau, mauMax, pct, tt (trangThaiQuai), kh (khangQuai), trai / phai (HTML 2 cột của bảng chi tiết) }
  bangC(D) {
    const p1 = (x) => (+x).toFixed(1).replace(".", ","), P = this.w && this.w.P, heAnh = (s) => { const im = P && P.hud && P.hud.seriesImg ? P.hud.seriesImg(s) : null; return im ? `<img class="btg-he" src="${im.src}" alt="">` : ""; };
    const tip = (n, s) => esc(`<color=Yellow>${n}<color>\nCòn ${Math.ceil(s)} giây`);
    const ttHtml = D.tt.map((x) => x.img ? `<span class="btg-st" data-tip="${tip(x.n, x.s)}"><img src="${x.img}" alt=""><b>${Math.ceil(x.s)}s</b></span>`
      : `<span class="btg-st chu ${x.cls}" data-tip="${tip(x.n, x.s)}">${x.chu}<b>${Math.ceil(x.s)}s</b></span>`).join("");
    return `<div class="btg-c"><div class="btg-anh"></div><div class="btg-p">`
      + `<div class="btg-d1"><span class="btg-tn">${esc(D.ten)}</span><span class="btg-lv">Lv.${D.lv | 0}</span>${heAnh(D.he | 0)}<span class="btg-tag">${esc(D.tag)}</span><span class="btg-gio">${esc(D.goc || "")}</span></div>`
      + `<div class="btg-mau"><i style="width:${D.pct.toFixed(1)}%"></i><span>${so(D.mau)} / ${so(D.mauMax)} (${p1(D.pct)}%)</span></div>`
      + `<div class="btg-d3">${ttHtml}<span class="btg-nut"><span class="mo-c">Chi tiết ▾</span><span class="mo-o">Thu gọn ▴</span></span></div></div></div>`
      + `<div class="btg-chi"><div class="btg-kh">${D.kh.map((k) => `<span>${heAnh(k.he)}<em style="color:${k.c}">${k.n}</em> <i${k.v < k.goc ? ' class="giam"' : ""}>${k.v}%</i></span>`).join("")}</div>`
      + `<div class="btg-l">${D.trai || ""}</div>${D.phai || ""}</div>`;
  },

  // ---------- bảng boss phụ #bsat (anh 18/11): boss cuối Viêm Đế / Vượt Ải ("thêm cho boss cuối viêm đế và vượt ải đi em") — luôn hiện khi còn sống ở bãi, ưu tiên;
  // rồi Boss Sát thủ ("cho boss sát thủ hiện cái thanh tên như boss thế giới"): bảng mẫu C riêng (#bsat — dưới bảng boss thế giới nếu cùng lúc) cho
  // Boss Sát thủ còn sống gần nhất trong SAT_TAM quanh mình (đang nhắm con nào thì con đó) — boss chung của bản quái chung (quaichung.js: máu chung máy chủ,
  // m.qc) hoặc boss riêng nhiệm vụ (main.js datBossSat). Máy chủ không gửi người đánh / top của Boss Sát thủ -> chi tiết: kháng, sát thương của mình (đếm ở máy
  // — World.hit m.cuaMinh, cả độc), tỉ lệ trên máu tối đa, máu chung / riêng, chỗ. Mỗi nhịp tick (250 ms)
  veSat() {
    const w = this.w, p = w && w.player;
    let m = null;
    if (w && p && !this.tatSat) {
      const muc = p.target && p.target.alive && (p.target.sat || this.bossCuoi(p.target)) ? p.target : null;
      if (muc) m = muc;
      else m = w.mobs.find((x) => this.bossCuoi(x)) || null;
      if (!m) { let dm = SAT_TAM; for (const x of w.mobs) if (x.sat && x.alive && x.hp > 0) { const d = ldist(p.x, p.y, x.x, x.y); if (d < dm) { dm = d; m = x; } } }
    }
    if (!m) { if (this.elSat && this.elSat.style.display !== "none") { this.elSat.style.display = "none"; this.elSat.dataset.sig = ""; this._day(); } return; }
    if (!this.elSat) {
      const e = (this.elSat = document.createElement("div")); e.id = "bsat";
      try { e.classList.toggle("mo", localStorage.getItem("vl_btgMo") === "1"); } catch { /* không đọc được thì đóng */ }
      e.onclick = (ev) => { if (!document.body.classList.contains("dt") && !(ev.target.closest && ev.target.closest(".btg-nut"))) return; const mo = e.classList.toggle("mo"); try { localStorage.setItem("vl_btgMo", mo ? "1" : "0"); } catch { /* bỏ qua */ } this._day(); };
      document.body.appendChild(e);
    }
    const P = w.P, mm = P && P.hud && P.hud.mmMap, xy = mm && mm.toClient ? mm.toClient(m.x, m.y) : null, tt = this.trangThaiQuai(m), kh = this.khangQuai(m);
    const cuoi = this.bossCuoi(m), R = cuoi ? (m.vd ? VdDoi.p : VaDoi.p) : null, nguoi = R && Array.isArray(R.tv) ? R.tv.filter((x) => x[1]).length : 0;
    const mau = Math.max(0, Math.round(m.hp)), mauMax = Math.max(1, Math.round(m.hpMax)), pct = (mau * 100) / mauMax, cua = Math.round(m.cuaMinh || 0), k = cuoi ? `cuoi:${m.type}` : `sat:${m.sat}:${m.type}`;
    const sig = [k, Math.round(pct * 10), mauMax, xy ? xy.join("/") : "", cua, nguoi, tt.map((x) => `${x.k}:${Math.ceil(x.s)}`).join(","), kh.map((x) => x.v).join(","), !!(this.anh.get(k) || {}).ok].join("|");
    this.elSat.style.display = "";
    // dòng giữa trên của ải / thuyền (hud setThuyen — "Lương Mi Nhi · boss còn 1 con · 29:52"): bảng xuống ngay dưới dòng đó (game.css #bsat --thuyen-day)
    const th = P && P.hud && P.hud.thuyenOn && P.hud.el ? P.hud.el.querySelector(".jx-thuyen") : null, rt = th ? th.getBoundingClientRect() : null;
    this.elSat.style.setProperty("--thuyen-day", rt && rt.height ? Math.round(rt.bottom + 4) + "px" : "0px");
    if (this.elSat.dataset.sig === sig) return;
    this.elSat.dataset.sig = sig;
    this.elSat.dataset.loai = cuoi ? "cuoi" : "sat";
    const p1 = (x) => (+x).toFixed(1).replace(".", ","), cho = `${esc((w.zone && w.zone.n) || "")}${xy ? ` (${xy[0]}/${xy[1]})` : ""}`;
    this.elSat.innerHTML = cuoi ? this.bangC({ ten: String(m.name || ""), lv: m.lvl, he: m.series, tag: "BOSS", goc: "Ải cuối", mau, mauMax, pct, tt, kh,
      trai: `Sát thương của bạn: <b class="xanh">${so(cua)}</b><br>Tỉ lệ: <b class="xanh">${p1((cua * 100) / mauMax)}%</b>${nguoi ? `<br>Người trong ải: <b class="vang">${nguoi}</b>` : ""}<br><span class="lam">${cho}</span>`,
      phai: `<div class="btg-l">Boss cuối ${m.vd ? "Bảo tàng Viêm Đế" : "Vượt Ải"} — máu chung cả đội</div>` })
      : this.bangC({ ten: String(m.name || "").replace(/^BOSS Sát thủ - /, ""), lv: m.lvl, he: m.series, tag: "Sát thủ", goc: xy ? `${xy[0]}/${xy[1]}` : "", mau, mauMax, pct, tt, kh,
      trai: `Sát thương của bạn: <b class="xanh">${so(cua)}</b><br>Tỉ lệ: <b class="xanh">${p1((cua * 100) / mauMax)}%</b><br><span class="lam">${cho}</span>`,
      phai: `<div class="btg-l">${m.qc ? "Boss chung của bản quái chung — mọi người cùng đánh, máu chung" : "Boss riêng của nhiệm vụ của bạn"}<br><span class="mo">Phân thân không gây sát thương lên Boss Sát thủ</span></div>` });
    const o = this.elSat.querySelector(".btg-anh"); if (o) o.appendChild(this.anhCua(k, m));
    this._day();
  },
  // boss cuối: Lương Mi Nhi (Viêm Đế — đợt loai "cuoi" của phòng VdDoi, quái m.vd + m.vaBoss) / boss cuối Vượt Ải (m.bossCuoi — main.js VaDoi.api.sinh gắn)
  bossCuoi(m) { return !!m && m.alive && m.hp > 0 && (!!m.bossCuoi || (!!m.vd && !!m.vaBoss && !!VdDoi.p && VdDoi.p.loai === "cuoi")); },
  // kháng của boss sau bùa giảm kháng (World.mobRes — vocong.js), thứ tự ngũ hành client
  khangQuai(m) {
    const w = this.w; if (!w || !m.res) return [];
    return KHANG.map(([k, n, c, he]) => { const goc = m.res[k] || 0, v = w.mobRes ? Math.round(w.mobRes(m, k)) : goc; return { k, n, c, he, v, goc }; });
  },
  // trạng thái boss đang dính: bùa hại có hình trạng thái client (assets/ui/trang-thai.json — mã = võ công gây trạng thái), trúng độc, làm chậm, hoảng loạn, choáng
  trangThaiQuai(m) {
    const w = this.w, P = w && w.P, T = (P && P.trangThai && P.trangThai.ds) || {}, t = w ? w.time : 0, L = [];
    for (const c of m.curse || []) if (c.until > t && c.st && T[c.st] && !L.some((x) => x.k === c.st)) L.push({ k: c.st, img: "assets/ui/" + T[c.st][2], n: T[c.st][0], s: c.until - t });
    if (m.poison && m.poison.until > t) L.push({ k: "doc", chu: "Độc", cls: "doc", n: "Trúng độc", s: m.poison.until - t });
    if ((m.slowUntil || 0) > t) L.push({ k: "cham", chu: "Chậm", cls: "cham", n: "Làm chậm", s: m.slowUntil - t });
    if ((m.hlUntil || 0) > t) L.push({ k: "hoang", chu: "Hoảng", cls: "hoang", n: "Hoảng loạn", s: m.hlUntil - t });
    if ((m.stunUntil || 0) > t) L.push({ k: "choang", chu: "Choáng", cls: "choang", n: "Choáng", s: m.stunUntil - t });
    return L.slice(0, 7);
  },
  // chân dung: client không có chân dung boss -> cắt đầu + vai từ chính hình quái của client (đứng yên, hướng 0, khung đầu), ĐÚNG CỠ (1:1, không co giãn —
  // bản mẫu thu nhỏ bị mờ). Vẽ 1 lần mỗi boss; tấm hình chưa tải thì lần ve() sau vẽ lại
  anhCua(k, m) { // k: khóa chân dung (mã boss thế giới / "sat:<số hiệu>:<hình>")
    let c = this.anh.get(k);
    if (!c) { c = document.createElement("canvas"); c.width = c.height = ANH; c.className = "btg-cv"; c.thu = 0; this.anh.set(k, c); if (this.anh.size > 12) this.anh.delete(this.anh.keys().next().value); }
    const P = this.w && this.w.P; if (c.ok || !m || !P || !P.npc || c.thu > 60) return c;
    c.thu++;
    const N = 320, off = document.createElement("canvas"); off.width = off.height = N; const o = off.getContext("2d");
    const r = ["stand1", "fightStand", "stand"].reduce((x, act) => x || P.npc.draw(o, m.type, { act, dir: 0, frame: 0, x: N / 2, y: N - 10 }), null);
    if (!r) return c;
    // đỉnh đầu: hàng đầu tiên có ≥ 6 điểm trong dải ±10 quanh trục thân (x neo chân của hình = N/2) — bỏ qua đầu vũ khí / cờ nhô lên cạnh người; rồi canh giữa
    // ô theo phần đầu (trung bình x của 12 hàng từ đỉnh đầu, trong dải ±16)
    const A = (x, y) => d[(y * N + x) * 4 + 3] > 60, cx0 = N / 2, d = o.getImageData(0, 0, N, N).data;
    let y0 = -1, y1 = 0;
    for (let y = 0; y < N; y++) { let n = 0; for (let x = cx0 - 10; x <= cx0 + 10; x++) if (A(x, y)) n++; if (n >= 6) { if (y0 < 0) y0 = y; y1 = y; } }
    if (y0 < 0) return c;
    let sx = 0, n = 0;
    for (let y = y0; y < y0 + 12; y++) for (let x = cx0 - 16; x <= cx0 + 16; x++) if (A(x, y)) { sx += x; n++; }
    // ô vuông đầu + vai (cạnh ≈ nửa chiều cao thân, không nhỏ hơn ANH): chỉ THU NHỎ về ANH (màn mật độ cao: tới ANH × 2), không phóng to — phóng to là mờ
    const H = y1 - y0, dp = Math.max(1, Math.min(2, Math.round(globalThis.devicePixelRatio || 1))), side = Math.max(ANH, Math.min(ANH * 3, Math.round(H * (this.catTl || 0.5)))), ra = Math.min(ANH * dp, side);
    c.width = c.height = ra;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = ra < side; g.imageSmoothingQuality = "high"; g.clearRect(0, 0, ra, ra);
    g.drawImage(off, Math.round((n ? sx / n : cx0) - side / 2), Math.max(0, Math.round(y0 - side * 0.08)), side, side, 0, 0, ra, ra);
    c.ok = true; return c;
  },

  // dòng thông báo của quản trị (.qt-loa, top 92, 1–2 dòng) xuống dưới bảng khi bảng nằm ở phần trên màn (máy tính top 46, điện thoại dọc 116 /
  // ngang 70 — game.css --btg-day)
  _day() {
    const r = this.el && this.el.style.display !== "none" ? this.el.getBoundingClientRect() : null;
    document.documentElement.style.setProperty("--btg-day", r && r.height && r.top < 150 ? Math.round(r.bottom + 6) + "px" : "0px");
    // bảng Boss Sát thủ (#bsat — nằm dưới #btg nhờ --btg-day): dòng thông báo của quản trị xuống dưới cả bảng này (game.css .qt-loa --bsat-day)
    const q = this.elSat && this.elSat.style.display !== "none" ? this.elSat.getBoundingClientRect() : null;
    document.documentElement.style.setProperty("--bsat-day", q && q.height && q.top < 200 ? Math.round(q.bottom + 6) + "px" : "0px");
  },
};
