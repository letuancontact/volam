// Giải file .spr của engine Võ Lâm 1 ngay trong trình duyệt + xếp khung vào 1 tấm (canvas). Dùng chung cho src/npc/ và src/char/.
// Cùng thuật toán với tools/lib/jxspr.js (định dạng ghi ở đó); đã kiểm từng điểm: tools/verify/npc-fidelity.html,
// tools/verify/jxchar-fidelity.html.
// decodeSpr(ArrayBuffer) -> { h: đầu file, frames: [{ w, h, ox, oy, rgba }] }; lỗi định dạng thì ném lỗi (không đoán).

// Nhịp tối thiểu = 1 vòng lặp của engine (18 vòng/giây — game gốc ghi FPS_JX = 18)
export const TICK_MS = 1000 / 18;
const ATLAS_W = 2048;

export function decodeSpr(ab) {
  const o = openSpr(ab), frames = [];
  for (let i = 0; i < o.h.frames; i++) frames.push(o.frame(i));
  return { h: o.h, frames };
}

// Mở file .spr, giải TỪNG khung khi cần (hình hiệu ứng võ công lớn — vd 320 khung 240×240 — chỉ giải các khung thật sự vẽ):
// openSpr(ArrayBuffer) -> { h, frame(i) -> { w, h, ox, oy, rgba } }
export function openSpr(ab) {
  const b = new Uint8Array(ab), v = new DataView(ab);
  if (b.length < 32 || b[0] !== 83 || b[1] !== 80 || b[2] !== 82 || b[3] !== 0) throw new Error("không phải SPR");
  const h = { w: v.getUint16(4, true), h: v.getUint16(6, true), cx: v.getInt16(8, true), cy: v.getInt16(10, true), frames: v.getUint16(12, true), colors: v.getUint16(14, true), dirs: v.getUint16(16, true), interval: v.getUint16(18, true) };
  const pal = 32, tab = 32 + h.colors * 3, data0 = tab + h.frames * 8;
  const frame = (i) => {
    const off = data0 + v.getUint32(tab + i * 8, true), len = v.getUint32(tab + i * 8 + 4, true), end = off + len;
    if (end > b.length) throw new Error(`SPR cụt (khung ${i})`);
    const w = v.getUint16(off, true), fh = v.getUint16(off + 2, true), ox = v.getInt16(off + 4, true), oy = v.getInt16(off + 6, true);
    const rgba = new Uint8ClampedArray(w * fh * 4), total = w * fh;
    let p = off + 8, px = 0;
    while (px < total) {
      if (p + 2 > end) throw new Error(`khung ${i}: RLE cụt`);
      const n = b[p++], a = b[p++];
      if (a === 0) { px += n; continue; }
      if (p + n > end) throw new Error(`khung ${i}: RLE cụt`);
      for (let k = 0; k < n; k++) {
        const c = b[p++];
        if (c >= h.colors) throw new Error(`khung ${i}: màu ngoài bảng`);
        const q = px++ * 4, s = pal + c * 3;
        rgba[q] = b[s]; rgba[q + 1] = b[s + 1]; rgba[q + 2] = b[s + 2]; rgba[q + 3] = a;
      }
    }
    if (px !== total || p !== end) throw new Error(`khung ${i}: RLE lệch`);
    return { w, h: fh, ox, oy, rgba };
  };
  return { h, frame };
}

// Xếp khung vào 1 tấm: từng hướng bắt đầu 1 kệ mới, kệ đầy (rộng > 2048) thì xuống kệ dưới. Trả về { canvas, rects }.
// per = số khung mỗi hướng (mặc định theo đầu file).
export function buildAtlas(spr, per) {
  per = per || Math.floor(spr.h.frames / spr.h.dirs) || 1;
  let x = 0, y = 0, shelf = 0, W = 1;
  const rects = spr.frames.map((f, i) => {
    if (x > 0 && (x + f.w > ATLAS_W || i % per === 0)) { y += shelf; x = 0; shelf = 0; }
    const r = { x, y, w: f.w, h: f.h, ox: f.ox, oy: f.oy };
    x += f.w; shelf = Math.max(shelf, f.h); W = Math.max(W, x);
    return r;
  });
  const H = Math.max(1, y + shelf);
  const cv = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
  const g = cv.getContext("2d");
  spr.frames.forEach((f, i) => { if (f.w && f.h) g.putImageData(new ImageData(f.rgba, f.w, f.h), rects[i].x, rects[i].y); });
  // anh 06/11 Tống Kim (máy Intel UHD 770, "giật"): tấm hình là OffscreenCanvas thì mỗi lần vẽ trình duyệt có thể phải chép lên card; đổi sang ImageBitmap
  // (bất biến — lên card 1 lần, dùng mãi). Nơi dùng chỉ vẽ từ tấm này + đọc width / height (jx-char.js, npc-pack.js) — ImageBitmap đủ
  return { canvas: cv.transferToImageBitmap ? cv.transferToImageBitmap() : cv, rects };
}
// Bản tô màu cả tấm theo bộ lọc CSS (choáng / chậm / độc — world.js mobTint): làm 1 lần mỗi tấm + bộ lọc rồi giữ lại (S._loc). Anh 06/11 Tống Kim: "nhất là lúc
// mình bị làm chậm, fps tụt không phanh" — trước đặt ctx.filter rồi vẽ mỗi khung: mỗi mảnh hình qua bộ lọc là 1 lớp riêng trên card đồ họa
export function anhLoc(S, loc) {
  const M = S._loc || (S._loc = new Map());
  let c = M.get(loc); if (c) return c;
  const W = S.canvas.width, H = S.canvas.height;
  const cv = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
  const g = cv.getContext("2d"); g.filter = loc; g.drawImage(S.canvas, 0, 0);
  c = cv.transferToImageBitmap ? cv.transferToImageBitmap() : cv;
  M.set(loc, c); return c;
}
