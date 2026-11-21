// Đọc kho hình NPC / quái từ client (assets/npc/) và vẽ lên canvas. Định dạng kho: assets/npc/README.md
//
//   const npc = await NpcPack.load("assets/npc/");
//   await npc.ensure("ani001", "fightStand");
//   npc.draw(ctx, "ani001", { act: "fightStand", dir: 3, t: 0.4, x: 300, y: 260, scale: 1 });
//
// File .spr được giải ngay trong trình duyệt (src/jx/spr.js — cùng thuật toán với tools/lib/jxspr.js, đã kiểm từng khung:
// tools/verify/npc-fidelity.html), các khung xếp vào 1 tấm (canvas) để vẽ nhanh.
// Động tác thiếu -> "fightStand". hurt / die / attack1 / attack2 / magic / jump chạy 1 lượt rồi dừng ở khung cuối.
// Nhịp mỗi khung = max(nhịp trong kho, 1000/18 ms) — xem TICK_MS.
// Hướng 0..7 theo quy ước chung (src/dir.js). Khung của hướng h = khung h × (số khung / số hướng) + k (chia lấy nguyên, như engine).

import { decodeSpr, buildAtlas, anhLoc, TICK_MS } from "../jx/spr.js";
import { layTep } from "../tai-tep.js"; // tải có hạn "khựng 15 giây thì bỏ" (anh 28/10 — thanh tải kẹt)
export { TICK_MS };

const RETRY_MS = 2000;
// Nhịp tối thiểu = 1 vòng lặp của engine Võ Lâm (TICK_MS = 1000/18). 1.418 động tác ghi nhịp 1–3 (không thể là mili giây):
// engine tiến tối đa 1 khung mỗi vòng lặp nên nhịp nhỏ hơn 1 vòng = 1 khung mỗi vòng. (Suy luận.)

export class NpcPack {
  static async load(base) {
    base = base.endsWith("/") ? base : base + "/";
    const r = await fetch(base + "npc.json");
    if (!r.ok) throw new Error(`Không đọc được ${base}npc.json (${r.status})`);
    const meta = await r.json();
    if (meta.format !== "vl-npc-pack") throw new Error("npc.json không đúng định dạng vl-npc-pack");
    return new NpcPack(base, meta);
  }

  constructor(base, meta) {
    this.base = base;
    this.meta = meta;
    this._lc = new Map(Object.keys(meta.types).map((k) => [k.toLowerCase(), k]));
    this._sheets = new Map(); // khóa file -> { canvas, rects, file }
    this._load = new Map();   // khóa file -> { p, failed }
  }

  // Giải SPR (giữ tên cũ cho tools/verify/npc-fidelity.html)
  static decodeSpr(ab) { return decodeSpr(ab); }

  // ---------- tra cứu ----------
  key(type) { return this._lc.get(String(type).toLowerCase()) || null; }
  type(type) { const k = this.key(type); return k ? this.meta.types[k] : null; }
  // Động tác thật sẽ vẽ (thiếu -> fightStand); null nếu loại hình không có file nào
  act(type, act) {
    const T = this.type(type);
    if (!T) return null;
    if (T.acts[act]) return { name: act, ...T.acts[act] };
    const fb = this.meta.fallback;
    return T.acts[fb] ? { name: fb, ...T.acts[fb] } : null;
  }
  file(fk) { return this.meta.files[fk] || null; }
  // Nhịp hiệu lực (ms) của 1 động tác = max(nhịp ghi trong kho, 1 vòng lặp engine)
  ms(type, act) { const A = this.act(type, act); return A ? Math.max(A.ms, TICK_MS) : 0; }
  frameCount(type, act) { const A = this.act(type, act); return A ? this.file(A.file).per : 0; }
  duration(type, act) { const A = this.act(type, act); return A ? (this.file(A.file).per * this.ms(type, act)) / 1000 : 0; }
  frameAt(type, act, t) {
    const A = this.act(type, act);
    if (!A) return 0;
    const n = this.file(A.file).per, j = Math.floor((t * 1000) / this.ms(type, act));
    return this.meta.once.includes(A.name) ? Math.min(j, n - 1) : ((j % n) + n) % n;
  }
  // Hàng (hướng trong file) cho hướng 0..7
  row(F, dir) {
    dir = ((dir | 0) % 8 + 8) % 8;
    return F.dirs >= 8 ? dir * (F.dirs / 8) : Math.floor((dir * F.dirs) / 8);
  }

  // ---------- tải ----------
  _sheet(fk) {
    const c = this._load.get(fk);
    if (c && (!c.failed || performance.now() - c.failed < RETRY_MS)) return c.p;
    const e = { p: null, failed: 0 };
    e.p = layTep(this.base + fk)
      .then((ab) => { const s = this._build(fk, decodeSpr(ab)); this._sheets.set(fk, s); return s; })
      .catch(() => { e.failed = performance.now(); return null; });
    this._load.set(fk, e);
    return e.p;
  }
  _build(fk, spr) { return { ...buildAtlas(spr), file: this.file(fk) }; }
  // tải mọi tấm hình của các loại types; mỗi tấm báo onFile(promise, số byte) — màn chờ đổi bản đồ đếm tiến độ (src/game/loading.js)
  ensureAll(types, onFile) {
    const seen = new Set(), out = [];
    for (const t of types) { const T = this.type(t); if (T) for (const A of Object.values(T.acts)) if (A && !seen.has(A.file)) { seen.add(A.file); const p = this._sheet(A.file); out.push(p); if (onFile) onFile(p, (this.file(A.file) || {}).bytes || 50000); } }
    return Promise.all(out);
  }
  async ensure(type, act) {
    const T = this.type(type);
    if (!T) return false;
    const list = act ? [this.act(type, act)] : Object.values(T.acts);
    const r = await Promise.all(list.filter(Boolean).map((A) => this._sheet(A.file)));
    return r.every(Boolean);
  }

  // Chỉ giữ tấm hình (và tấm bóng) của các loại trong types — gọi khi đổi bãi để bộ nhớ chỉ tính quái của bãi đang đứng
  retain(types) {
    const keep = new Set();
    for (const t of types) { const T = this.type(t); if (T) for (const A of Object.values(T.acts)) keep.add(A.file); }
    for (const k of [...this._sheets.keys()]) if (!keep.has(k)) this._sheets.delete(k);
    for (const k of [...this._load.keys()]) if (!keep.has(k)) this._load.delete(k);
  }

  // ---------- vẽ ----------
  // opt: { act, dir, t (giây) | frame, x, y (điểm chân), scale, alpha }. Trả về { act, frame, n, top } hoặc null nếu chưa tải.
  draw(ctx, type, opt) {
    const A = this.act(type, opt.act);
    if (!A) return null;
    const S = this._sheets.get(A.file);
    if (!S) { this._sheet(A.file); return null; }
    const F = S.file, n = F.per;
    const k = opt.frame != null ? Math.min(n - 1, Math.max(0, opt.frame | 0)) : this.frameAt(type, opt.act, opt.t || 0);
    const idx = this.row(F, opt.dir || 0) * n + k;
    const r = S.rects[idx];
    if (!r) return null;
    const sc = opt.scale || 1;
    const dx = Math.round(opt.x + (r.ox - F.anchor[0]) * sc), dy = Math.round(opt.y + (r.oy - F.anchor[1]) * sc);
    const pa = ctx.globalAlpha, ps = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    ctx.imageSmoothingEnabled = sc !== 1;
    if (r.w && r.h) ctx.drawImage(opt.loc ? anhLoc(S, opt.loc) : S.canvas, r.x, r.y, r.w, r.h, dx, dy, r.w * sc, r.h * sc); // opt.loc: tô màu choáng / chậm / độc (giữ sẵn)
    ctx.globalAlpha = pa;
    ctx.imageSmoothingEnabled = ps;
    return { act: A.name, frame: k, n, top: opt.y + (F.bbox[1] - F.anchor[1]) * sc };
  }

  // Bóng đổ tự vẽ cho quái mà hình client không vẽ sẵn bóng — cùng kiểu bóng vẽ sẵn của client (đo trên Kim Tơ Hầu ani056):
  // hình bóng của chính khung đang vẽ, tô xám đều (35,35,35) độ đậm 144/255, ngả về sau bên phải (sáng từ trên trái): điểm cao h
  // trên chân -> lệch phải SHADOW.kx·h, lên SHADOW.ky·h. Vẽ TRƯỚC thân quái. opt giống draw().
  drawShadow(ctx, type, opt) {
    const A = this.act(type, opt.act);
    if (!A) return;
    const S = this._sheets.get(A.file);
    if (!S) return;
    const F = S.file, n = F.per;
    const k = opt.frame != null ? Math.min(n - 1, Math.max(0, opt.frame | 0)) : this.frameAt(type, opt.act, opt.t || 0);
    const r = S.rects[this.row(F, opt.dir || 0) * n + k];
    if (!r || !r.w || !r.h) return;
    if (!S.shadow) { // tấm bóng: cùng tấm hình, tô xám giữ alpha (làm 1 lần mỗi tấm)
      const W = S.canvas.width, H = S.canvas.height;
      const c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
      const g = c.getContext("2d");
      g.drawImage(S.canvas, 0, 0);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = SHADOW.color; g.fillRect(0, 0, W, H);
      S.shadow = c;
    }
    const sc = opt.scale || 1;
    ctx.save();
    ctx.globalAlpha = SHADOW.alpha * (opt.alpha == null ? 1 : opt.alpha);
    // gốc = điểm chân; x' = x - kx·y, y' = ky·y (y âm = phía trên chân)
    ctx.setTransform(...matMul(ctx.getTransform(), [1, 0, -SHADOW.kx, SHADOW.ky, Math.round(opt.x), Math.round(opt.y)]));
    ctx.drawImage(S.shadow, r.x, r.y, r.w, r.h, (r.ox - F.anchor[0]) * sc, (r.oy - F.anchor[1]) * sc, r.w * sc, r.h * sc);
    ctx.restore();
  }
}

// Bóng vẽ sẵn của client (Kim Tơ Hầu): màu (35,35,35), alpha 144; đỉnh thân cao ~39 px -> bóng lệch phải ~17 px, lên ~12 px
export const SHADOW = { color: "rgb(35,35,35)", alpha: 144 / 255, kx: 0.6, ky: 0.38 };
// nhân ma trận DOMMatrix hiện tại với [a b c d e f]
function matMul(m, [a, b, c, d, e, f]) {
  return [m.a * a + m.c * b, m.b * a + m.d * b, m.a * c + m.c * d, m.b * c + m.d * d, m.a * e + m.c * f + m.e, m.b * e + m.d * f + m.f];
}
