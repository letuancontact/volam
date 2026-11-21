// Đồ + tiền rơi trên đất như client (anh muốn 25/10; kho assets/web/roi — cong-cu/dung-vat-roi.mjs từ \settings\obj\ObjData.txt):
// mỗi vật có hình đang rơi (chạy 1 lần) rồi hình nằm trên đất (lặp — vệt sáng lướt qua), điểm (cx, cy) đặt đúng chỗ rơi; khung theo
// mili-giây của file .spr; vẽ × scale như mọi hình kho web. Món -> vật theo bảng đồ client (cột 对应物件索引); tiền -> đống to nhỏ theo
// \settings\obj\MoneyObj.txt (≤ 200, ≤ 1000, ≤ 5000, ≤ 1 vạn, hơn nữa). Màu tên: \settings\obj\ObjNameColor.ini (0 trắng, 3 xanh lam).
//   const R = await RoiPack.load(); const id = R.ofItem(k) | R.ofMoney(lượng); R.draw(ctx, id, t, x, y) -> đỉnh hình; R.sound(id)

const BASE = "assets/web/roi/";

export class RoiPack {
  static async load(base = BASE) {
    const r = await fetch(base + "roi.json");
    if (!r.ok) throw new Error("Không đọc được roi.json");
    return new RoiPack(await r.json(), base);
  }
  constructor(meta, base) { this.M = meta; this.base = base; this.imgs = {}; }
  ofItem(k) { const id = this.M.mon[k]; return this.M.vat[id] ? id : null; }
  ofMoney(g) { const t = this.M.tien.find(([max]) => g <= max) || this.M.tien[this.M.tien.length - 1]; return t && this.M.vat[t[1]] ? t[1] : null; }
  // màu tên của vật: 0 trắng (đồ trắng, thuốc, tiền), 3 xanh lam (đồ xanh)
  color(i) { const c = this.M.mau[i] || [255, 255, 255]; return `rgb(${c.join(",")})`; }
  sound(id) { const v = this.M.vat[id]; return v && v.sound ? "../roi/" + v.sound : null; } // GameAudio.play tính từ assets/web/sound/
  // thời gian hình đang rơi (giây); vật không có hình rơi: nằm ngay
  fallTime(id) { const v = this.M.vat[id], f = v && v.roi; return f ? (f.n * f.ms) / 1000 : 0; }
  _img(f) { let im = this.imgs[f.file]; if (!im) { im = this.imgs[f.file] = new Image(); im.src = this.base + f.file; } return im.complete && im.naturalWidth ? im : null; }
  // t = giây từ lúc rơi; (x, y) = chỗ rơi trên bản đồ. Trả về y đỉnh hình (đặt tên vật), null nếu chưa có hình.
  draw(ctx, id, t, x, y) {
    const v = this.M.vat[id]; if (!v) return null;
    const ft = this.fallTime(id), f = t < ft ? v.roi : v.nam, im = f && this._img(f);
    if (!im) return null;
    const k = t < ft ? Math.min(f.n - 1, Math.floor((t * 1000) / f.ms)) : Math.floor(((t - ft) * 1000) / f.ms) % f.n;
    const s = this.M.scale, top = Math.round(y - v.nam.cy * s);
    ctx.drawImage(im, k * f.w, 0, f.w, f.h, Math.round(x - f.cx * s), Math.round(y - f.cy * s), Math.round(f.w * s), Math.round(f.h * s));
    return top;
  }
}
