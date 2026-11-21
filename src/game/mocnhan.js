// Mộc nhân luyện công (anh 26/10): 5 cọc gỗ 5 hệ ở Ba Lăng huyện, chỗ trống 193/204 trên bản đồ nhỏ (cạnh cây hoa đào) — đánh thử chiêu.
// Bất tử: máu luôn đầy, không chết, không kinh nghiệm / rơi đồ; đứng yên không đánh trả nhưng vẫn dính độc / choáng / chậm / bùa hại
// (World.updateMob, World.hit). Bảng bên trái màn hình khi đứng gần: đếm sát thương / DPS từng con (cả độc) + chỉnh kháng, né tránh từng
// con (lưu trên máy người chơi — localStorage, chỉ là tiện lợi). Hình: Mộc nhân của client (木人, mẫu NPC 414, hình enemy179 — dữ liệu
// máy chủ còn đặt 10 con trang trí ở Ba Lăng, giữ nguyên).
//   datMocNhan(world, zone, P)     thêm 5 con vào world.mobs nếu bãi là Ba Lăng huyện
//   new MocNhanPanel(P).update(world)   gọi mỗi nhịp hud
import { mobStats } from "./rules.js";

const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const MAU_HE = ["#ffd54a", "#7ee07e", "#6ec6ff", "#ff7a5c", "#d2a86e"];
// bản đồ client 53 (Ba Lăng huyện): tọa độ client (x, y) của 5 con — hàng ngang cách 120 đơn vị, so le để tên không chồng
const CHO = { 53: [[49368, 104320], [49488, 104245], [49608, 104320], [49728, 104245], [49848, 104320]] };
const HINH = "enemy179";
const MAU = 1e6;             // máu hiện trên thanh (luôn đầy)
const NGHI = 5;              // không ăn đòn quá 5 giây: đòn sau tính lượt đánh mới (DPS lượt)
const GAN = 220;             // đứng ngay chỗ mộc nhân (trong 220 điểm ảnh quanh 1 con) thì hiện bảng — anh 30/10; bản trước 900: gần cả trung tâm Ba Lăng
const LUU = "vl_moc_nhan";
const KHANG = [["phys", "Vật lý"], ["cold", "Băng"], ["fire", "Hỏa"], ["light", "Lôi"], ["poison", "Độc"], ["def", "Né tránh"]];

const doc = () => { try { return JSON.parse(localStorage.getItem(LUU) || "null") || {}; } catch { return {}; } };
const ghi = (o) => { try { localStorage.setItem(LUU, JSON.stringify(o)); } catch {} };
const khangCua = (i) => ({ phys: 0, cold: 0, fire: 0, light: 0, poison: 0, def: 0, ...(doc().khang || [])[i] });
const dpsMoi = () => ({ total: 0, hits: 0, max: 0, t0: 0, last: -1e9, fight: 0 });

export function datMocNhan(world, zone, P) {
  const m = P.maps.maps[zone.map], c = m && m.client, L = c && c.region && CHO[c.id];
  if (!L) return;
  const s = P.maps.scale;
  L.forEach(([cx, cy], i) => {
    const x = (cx - c.region[0] * 512) * s, y = ((cy - c.region[1] * 1024) / 2) * s, K = khangCua(i);
    world.mobs.push({
      kind: "mob", dummy: true, uid: world.nextId++, id: -1, type: HINH, name: `Mộc nhân ${HE[i]}`, lvl: 1, boss: false, alive: true,
      x, y, home: [x, y], dir: 0, act: "stand", t: Math.random() * 2, series: i,
      hpMax: MAU, hp: MAU, exp: 0, ar: 1, def: K.def, dmg: [0, 0], res: { phys: K.phys, cold: K.cold, fire: K.fire, light: K.light, poison: K.poison },
      lifeRep: 0, reach: 0, vision: 0, active: 0, run: 0, walk: 0, atkGap: 1, hitRecover: 25, radius: 16,
      aggro: false, atkT: 0, hitDone: false, path: null, repath: 0, wander: 1e9, deadT: 0, atkDur: 1, hurtDur: P.npc.duration(HINH, "hurt") || 0.5,
      dps: dpsMoi(),
    });
  });
  P.npc.ensure(HINH);
}

// Đảo Tẩy Tủy (anh 28/10 — assets/data/tay-tuy.json, cong-cu/dung-tay-tuy.mjs): Cọc gỗ / Bao cát / Mộc nhân của client (client 3000 / 10000 /
// 30000 sinh lực — tên máy chủ ghi máu; anh nâng cả 3 loại 500000; Thích Minh: "để cho ngươi thử nghiệm hiệu quả tẩy tủy"). Đứng yên không
// đánh trả, có máu thật: đánh vỡ thì ngã, HOI_COC giây sau mọc lại đầy máu (không báo máy chủ, không kinh nghiệm / rơi đồ — World.updateMob,
// World.hit). Loại có soMau: số máu "còn/tối đa" trên đầu (World.drawMobLabel). Không vào bảng DPS (bảng chỉ cho 5 mộc nhân 5 hệ Ba Lăng).
export const HOI_COC = 5;
export function datCocDao(world, zone, P) {
  const T = P.tayTuy; if (!T || !T.coc) return;
  const hinh = new Set();
  for (const [loai, x, y] of T.coc) {
    const L = T.loaiCoc[loai]; if (!L) continue;
    world.mobs.push({
      kind: "mob", dummy: true, coc: true, soMau: !!L.soMau, uid: world.nextId++, id: -1, type: L.hinh, name: L.ten, lvl: 1, boss: false, alive: true,
      x, y, home: [x, y], dir: 0, act: "stand", t: Math.random() * 2, series: 0,
      hpMax: L.mau, hp: L.mau, exp: 0, ar: 1, def: 0, dmg: [0, 0], res: { phys: 0, cold: 0, fire: 0, light: 0, poison: 0 },
      lifeRep: 0, reach: 0, vision: 0, active: 0, run: 0, walk: 0, atkGap: 1, hitRecover: 25, radius: 16,
      aggro: false, atkT: 0, hitDone: false, path: null, repath: 0, wander: 1e9, deadT: 0, atkDur: 1, hurtDur: P.npc.duration(L.hinh, "hurt") || 0.5,
      dps: dpsMoi(),
    });
    hinh.add(L.hinh);
  }
  for (const h of hinh) P.npc.ensure(h);
}
// cọc đã vỡ đủ HOI_COC giây: mọc lại đầy máu (World.updateMob)
export function hoiCoc(world, m) { m.alive = true; m.hp = m.hpMax; m.deadT = 0; m.aggro = false; world.setAct(m, "stand"); }

// World.hit gọi khi mộc nhân ăn đòn: cộng sát thương, máu về đầy (cọc đảo Tẩy Tủy: mất máu thật, hết máu thì vỡ)
export function mocNhanTrung(world, m, v) {
  const d = m.dps, t = world.time;
  if (t - d.last > NGHI) { d.t0 = t; d.fight = 0; }
  d.fight += v; d.total += v; d.hits++; d.max = Math.max(d.max, v); d.last = t;
  if (!m.coc) { m.hp = m.hpMax; return; }
  if (m.hp > 0) return;
  m.hp = 0; m.alive = false; m.deadT = 0; world.setAct(m, "die");
  if (world.player.target === m) world.player.target = null;
}
// DPS lượt đang đánh: sát thương lượt / thời gian từ đòn đầu (đang đánh: tới giờ; nghỉ: tới đòn cuối), ít nhất 1 giây
const dpsLuot = (d, t) => (d.hits ? d.fight / Math.max(1, (t - d.last > NGHI ? d.last : t) - d.t0) : 0);
const so = (v) => Math.round(v).toLocaleString("vi-VN");

export class MocNhanPanel {
  constructor(P) {
    this.P = P;
    const el = (this.el = document.createElement("div"));
    el.className = "mn";
    el.innerHTML = `<div class="mn-head"><b>Mộc nhân luyện công</b><button data-act="khang">Kháng</button><button data-act="reset" title="Xóa số đếm">Đặt lại</button><button data-act="thu" title="Thu gọn">–</button></div>
      <table class="mn-dps"><thead><tr><th>Hệ</th><th>DPS</th><th>Tổng</th><th>Đòn</th><th>Lớn nhất</th></tr></thead><tbody></tbody></table>
      <div class="mn-khang"><table><thead><tr><th></th>${HE.map((h, i) => `<th style="color:${MAU_HE[i]}">${h}</th>`).join("")}</tr></thead><tbody>${KHANG.map(([k, n]) => `<tr><td>${n}</td>${HE.map((_, i) => `<td><input type="number" data-k="${k}" data-i="${i}" step="5"></td>`).join("")}</tr>`).join("")}</tbody></table>
        <div class="mn-r"><span>Theo quái cấp</span><input type="number" data-in="cap" value="80" min="1" max="200"><button data-act="theo">Lấy kháng</button><button data-act="ve0">Về 0</button></div>
        <div class="mn-note">Kháng % (âm = yếu); quái thật mỗi hệ kháng khác nhau theo script cấp quái của client — "Lấy kháng" điền theo cấp đó.</div></div>
      <div class="mn-note">Đếm cả độc; nghỉ ${NGHI} giây thì đòn sau tính lượt mới. Không tăng độ luyện kỹ năng (cọc trên đảo Tẩy Tủy thì có).</div>`;
    // trên HUD nhưng dưới bảng quản trị + cửa sổ client (cùng z-index 4, đứng trước chúng — anh 29/10: bảng đè mất khung F10); bản trước
    // z-index 6 gắn cuối trang nên đè cả túi đồ / khung hội thoại
    const sau = document.querySelector(".dv.qt") || document.getElementById("jxwin");
    if (sau && sau.parentNode === document.body) document.body.insertBefore(el, sau); else document.body.appendChild(el);
    el.addEventListener("click", (e) => { const b = e.target.closest("button[data-act]"); if (b) this.act(b.dataset.act); });
    el.addEventListener("change", (e) => { const t = e.target; if (t.dataset.k) this.dat(+t.dataset.i, t.dataset.k, +t.value || 0); });
    this.at = 0;
  }
  dummies() { return this.w ? this.w.mobs.filter((m) => m.dummy && !m.coc) : []; }
  act(a) {
    const L = this.dummies();
    if (a === "reset") for (const m of L) m.dps = dpsMoi();
    else if (a === "khang") { this.el.classList.toggle("khang"); this.fillKhang(); }
    else if (a === "thu") this.el.classList.toggle("thu");
    else if (a === "ve0" || a === "theo") {
      const cap = Math.max(1, Math.min(200, +this.el.querySelector('[data-in="cap"]').value || 80)), P = this.P, MS = P.mobstats, id = Object.keys(MS.mobs)[0];
      for (const m of L) {
        const r = a === "ve0" ? { phys: 0, cold: 0, fire: 0, light: 0, poison: 0, def: 0 } : (() => { const st = mobStats(P.mons[id] || {}, id, cap, false, 75, MS, m.series); return { ...st.res, def: st.def }; })();
        for (const [k] of KHANG) this.dat(m.series, k, r[k] || 0, true);
      }
      this.fillKhang();
    }
    this.update(this.w, true);
  }
  // đổi kháng / né tránh của con hệ i, lưu lại
  dat(i, k, v, im) {
    const m = this.dummies().find((x) => x.series === i); if (!m) return;
    if (k === "def") m.def = Math.max(0, v); else m.res[k] = Math.max(-100, Math.min(95, v));
    const o = doc(); o.khang = o.khang || []; o.khang[i] = { ...khangCua(i), [k]: k === "def" ? m.def : m.res[k] }; ghi(o);
    if (!im) this.fillKhang();
  }
  fillKhang() {
    for (const inp of this.el.querySelectorAll("input[data-k]")) {
      const m = this.dummies().find((x) => x.series === +inp.dataset.i); if (!m || document.activeElement === inp) continue;
      inp.value = inp.dataset.k === "def" ? m.def : m.res[inp.dataset.k];
    }
  }
  // an = đang mở khung che cùng chỗ (cửa hàng NPC ở góc trái) -> ẩn bảng
  update(world, force, an = false) {
    if (world !== this.w) { this.w = world; if (this.el.classList.contains("khang")) this.fillKhang(); } // đổi bãi: mộc nhân mới
    const L = this.dummies(), p = world && world.player;
    const on = !an && !!(p && L.length && L.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < GAN));
    this.el.classList.toggle("on", on);
    if (!on) return;
    const now = performance.now(); if (!force && now - this.at < 250) return; this.at = now;
    const t = world.time; let sd = 0, st = 0, sh = 0;
    const rows = L.map((m) => {
      const d = m.dps, v = dpsLuot(d, t); sd += v; st += d.total; sh += d.hits;
      return `<tr><td style="color:${MAU_HE[m.series]}">${HE[m.series]}</td><td>${so(v)}</td><td>${so(d.total)}</td><td>${d.hits}</td><td>${so(d.max)}</td></tr>`;
    });
    rows.push(`<tr class="mn-sum"><td>Cộng</td><td>${so(sd)}</td><td>${so(st)}</td><td>${sh}</td><td></td></tr>`);
    this.el.querySelector(".mn-dps tbody").innerHTML = rows.join("");
  }
}
