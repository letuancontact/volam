// Đọc kho quái (assets/mon/) và vẽ quái lên canvas. Định dạng kho: assets/mon/README.md
//
//   const mons = await MonPack.load("assets/mon/");
//   await mons.ensure(12, "at");
//   mons.draw(ctx, 12, { act: "at", dir: 3, t: 0.2, x: 300, y: 260, scale: 1 });
//
// Động tác: st (đứng), run (chạy), at (đánh), hurt (bị đánh), die (chết). Thiếu động tác -> dùng st (như game gốc).
// st, run lặp lại; at, hurt, die chạy 1 lượt rồi dừng ở khung cuối. Mỗi khung kéo dài `ms` mili giây.
// Hướng 0..7: hàng thứ `hướng` trong tấm ảnh (tấm ít hơn 8 hướng thì chia tỉ lệ). Quy ước + dirOf(dx, dy): src/dir.js

const RETRY_MS = 2000;

export class MonPack {
  static async load(base) {
    base = base.endsWith("/") ? base : base + "/";
    const r = await fetch(base + "mon.json");
    if (!r.ok) throw new Error(`Không đọc được ${base}mon.json (${r.status})`);
    const meta = await r.json();
    if (meta.format !== "vl-mon-pack") throw new Error("mon.json không đúng định dạng vl-mon-pack");
    return new MonPack(base, meta);
  }

  constructor(base, meta) {
    this.base = base;
    this.meta = meta;
    this._imgs = new Map();  // url -> Image đã tải
    this._load = new Map();  // url -> { p, failed }
  }

  // Quái theo id (số trong mon.json) hoặc tên hình động (vd "ani001")
  anim(monOrAnim) {
    const m = this.meta.mons[monOrAnim];
    return this.meta.anims[m ? m.anim : monOrAnim] || null;
  }
  sheet(monOrAnim, act) {
    const a = this.anim(monOrAnim);
    return a ? a[act] || a[this.meta.fallback] || null : null;
  }
  // Độ dài 1 lượt động tác (giây)
  duration(monOrAnim, act) { const s = this.sheet(monOrAnim, act); return s ? (s.n * s.ms) / 1000 : 0; }
  frameAt(monOrAnim, act, t) {
    const s = this.sheet(monOrAnim, act);
    if (!s) return 0;
    const j = Math.floor((t * 1000) / s.ms);
    return this.meta.once[act] ? Math.min(j, s.n - 1) : j % s.n;
  }

  _img(url) {
    const c = this._load.get(url);
    if (c && (!c.failed || performance.now() - c.failed < RETRY_MS)) return c.p;
    const e = { p: null, failed: 0 };
    e.p = new Promise((res) => {
      const im = new Image();
      im.onload = () => { if (im.naturalWidth) { this._imgs.set(url, im); res(im); } else { e.failed = performance.now(); res(null); } };
      im.onerror = () => { e.failed = performance.now(); res(null); };
      im.src = url;
    });
    this._load.set(url, e);
    return e.p;
  }
  // Tải ảnh cho 1 (hoặc mọi) động tác của quái
  async ensure(monOrAnim, act) {
    const a = this.anim(monOrAnim);
    if (!a) return false;
    const list = act ? [this.sheet(monOrAnim, act)] : Object.values(a);
    const r = await Promise.all(list.filter(Boolean).map((s) => this._img(this.base + "a/" + s.img)));
    return r.every(Boolean);
  }

  // Vùng cắt + vị trí vẽ của khung k, hướng dir.
  // legacy = true: cắt và đặt y như game gốc (theo thông số ghi sẵn, chưa sửa) — chỉ để kiểm chứng / so sánh.
  rect(s, k, dir, legacy = false) {
    const row = s.d >= 8 ? dir : Math.floor((dir * s.d) / 8);
    if (legacy) {
      const o = s.src, n = o.n ?? s.n, d = o.d ?? s.d;
      const kk = Math.min(k, n - 1), rr = d >= 8 ? dir : Math.floor((dir * d) / 8);
      // Game gốc (js/core.js) vá lúc khởi động: điểm neo âm / vượt khung -> giữa đáy khung (w/2, h-2)
      const bad = o.ax < 0 || o.ay < 0 || o.ax > o.w || o.ay > o.h * 1.2;
      return { sx: kk * o.w, sy: rr * o.h, sw: o.w, sh: o.h, ax: bad ? o.w / 2 : o.ax, ay: bad ? o.h - 2 : o.ay };
    }
    // Cắt theo kích thước thật của ảnh (rộng/n, cao/d), làm tròn biên khung; điểm neo tính trong khung thật
    const x0 = k * s.fw, y0 = row * s.fh;
    const sx = Math.round(x0), sy = Math.round(y0);
    return { sx, sy, sw: Math.round(x0 + s.fw) - sx, sh: Math.round(y0 + s.fh) - sy, ax: s.ax - (sx - x0), ay: s.ay - (sy - y0) };
  }

  // Vẽ 1 quái. opt: { act, dir, t (giây) | frame, x, y (điểm chân), scale, alpha, legacy, snap }
  // Trả về { act, frame, n, h } (h = chiều cao đã vẽ, để đặt thanh máu/tên) hoặc null nếu chưa tải xong.
  draw(ctx, monOrAnim, opt) {
    const s = this.sheet(monOrAnim, opt.act);
    if (!s) return null;
    const img = this._imgs.get(this.base + "a/" + s.img);
    if (!img) { this.ensure(monOrAnim, opt.act); return null; }
    const n = opt.legacy ? s.src.n ?? s.n : s.n;
    const k = opt.frame != null ? Math.min(n - 1, Math.max(0, opt.frame | 0)) : this.frameAt(monOrAnim, opt.act, opt.t || 0);
    const dir = ((opt.dir | 0) % 8 + 8) % 8, sc = opt.scale || 1;
    const r = this.rect(s, Math.min(k, n - 1), dir, !!opt.legacy);
    const px = (v) => (opt.snap === false ? v : Math.round(v));
    const pa = ctx.globalAlpha, ps = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, px(opt.x - r.ax * sc), px(opt.y - r.ay * sc), r.sw * sc, r.sh * sc);
    ctx.globalAlpha = pa;
    ctx.imageSmoothingEnabled = ps;
    return { act: this.anim(monOrAnim)[opt.act] ? opt.act : this.meta.fallback, frame: k, n, h: r.sh * sc };
  }
}
