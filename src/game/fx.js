// Hiệu ứng trúng đòn của client (kho assets/web/fx — tools/build-fx-pack.mjs). Mỗi hiệu ứng = 1 đạn của settings/missles.txt:
// hình lúc trúng (AnimFile4) xếp ngang các khung, điểm neo cx / cy đặt vào điểm trúng, nâng lên MissleHeight; 1 khung mỗi `interval`
// vòng engine (18 vòng / giây); vẽ × scale như mọi hình kho web.
// Đòn thường của nhân vật theo vũ khí (clientweaponskill.txt): weaponFx(kiểu dáng vũ khí) -> đạn (63 tay không / kiếm / đao…, 64
// thương / côn); tiếng trúng của đạn (nếu client có file): sound(đạn) -> đường dẫn cho GameAudio.play.
// Ám khí (món loại "Vũ khí tầm xa"): basic(kiểu dáng, true) -> đạn 65 tầm 320, có hình bay (AnimFile2, 16 hướng) — drawFly vẽ đạn đang
// bay, flight(đạn) = tốc độ / thời gian sống theo client.
//   const FX = await FxPack.load(); FX.duration(63); FX.draw(ctx, 63, t, x, y)

const BASE = "assets/web/fx/";
const TICK = 1 / 18;

export class FxPack {
  static async load(base = BASE) {
    const r = await fetch(base + "fx.json");
    if (!r.ok) throw new Error("Không đọc được fx.json");
    const meta = await r.json(), imgs = {}, flyImgs = {};
    const img = (file, to, id) => new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = base + file; to[id] = im; });
    await Promise.all(Object.entries(meta.fx).flatMap(([id, f]) => [img(f.file, imgs, id), f.fly ? img(f.fly.file, flyImgs, id) : null]));
    return new FxPack(meta, imgs, flyImgs);
  }
  constructor(meta, imgs, flyImgs = {}) { this.M = meta; this.imgs = imgs; this.flyImgs = flyImgs; }
  has(id) { return !!this.M.fx[id]; }
  weaponFx(lookId) { return (this.M.weapon || {})[lookId] || 63; } // kiểu dáng ngoài bảng (đồ đời mới): đòn thường 53 -> đạn 63
  sound(id) { const f = this.M.fx[id]; return f && f.sound ? "../fx/" + f.sound : null; } // GameAudio.play tính từ assets/web/sound/
  // đòn thường theo vũ khí đang cầm: lookId = kiểu dáng vũ khí, ranged = món loại "Vũ khí tầm xa" (ám khí; kiểu dáng của ám khí lẫn với
  // vũ khí cận chiến nên phải xét loại món) -> { fx: đạn, range: AttackRadius của võ công (đơn vị client), fly: đạn bay tới mục tiêu }
  basic(lookId, ranged) {
    const id = ranged && this.M.ranged ? this.M.ranged : this.weaponFx(lookId), f = this.M.fx[id];
    const sk = Object.values(this.M.skill || {}).find((s) => s.fx === id);
    return { fx: id, range: sk ? sk.range : 75, fly: !!(f && f.fly) };
  }
  // đạn bay: { speed: đơn vị client / vòng engine, life: số vòng sống (hết vòng chưa tới mục tiêu thì mất) }
  flight(id) { const f = this.M.fx[id]; return f && f.fly ? { speed: f.speed, life: f.life } : null; }
  duration(id) { const f = this.M.fx[id]; return f ? f.n * f.interval * TICK : 0; }
  // t = giây từ lúc trúng; (x, y) = điểm trúng trên bản đồ; h = độ cao đạn (MissleHeight, đơn vị client)
  draw(ctx, id, t, x, y, h = 10) {
    const f = this.M.fx[id], im = this.imgs[id];
    if (!f || !im || !im.complete) return;
    const k = Math.floor(t / (f.interval * TICK));
    if (k >= f.n) return;
    const s = this.M.scale, prev = ctx.globalCompositeOperation;
    if (f.blend === "add") ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(im, k * f.w, 0, f.w, f.h, Math.round(x - f.cx * s), Math.round(y - (f.cy + h) * s), Math.round(f.w * s), Math.round(f.h * s));
    ctx.globalCompositeOperation = prev;
  }
  // đạn đang bay ở (x, y) trên mặt đất (nâng lên MissleHeight); (dx, dy) = hướng bay theo logic (dy đã × 2 như ldist); t = giây đã bay
  drawFly(ctx, id, dx, dy, t, x, y) {
    const f = this.M.fx[id], fl = f && f.fly, im = this.flyImgs[id];
    if (!fl || !im || !im.complete) return;
    const per = Math.max(1, Math.floor(fl.n / fl.dirs)), dir = dirOfN(dx, dy, fl.dirs);
    const k = dir * per + (Math.floor(t / (fl.interval * TICK)) % per);
    const s = this.M.scale, prev = ctx.globalCompositeOperation;
    if (fl.blend === "add") ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(im, k * fl.w, 0, fl.w, fl.h, Math.round(x - fl.cx * s), Math.round(y - (fl.cy + f.height) * s), Math.round(fl.w * s), Math.round(fl.h * s));
    ctx.globalCompositeOperation = prev;
  }
}

// hướng trong n hướng theo véc-tơ (dx, dy): 0 = xuống, theo chiều kim đồng hồ — giống dirOf của src/dir.js (n = 8)
const dirOfN = (dx, dy, n) => (Math.round(Math.atan2(-dx, dy) / ((Math.PI * 2) / n)) % n + n) % n;
