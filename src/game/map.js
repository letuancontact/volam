// Bản đồ trong game: ảnh nền + lưới vật cản của kho bản đồ web (assets/web/map, ×0.75 — xem assets/web/README.md).
//
//   const map = await GameMap.load(MAPS, "140");   // MAPS = assets/web/map/map.json, "140" = khóa ảnh bản đồ
//   map.drawBg(ctx, cam, vw, vh)                      // vẽ nền khung nhìn
// Bản đồ dựng nguyên từ client (assets/web/map/full — tools/build-client-map.mjs, vd Ba Lăng huyện "c53") không có 1 ảnh mà là ô
// ảnh 768×768 (m.tiles): chỉ tải ô quanh khung nhìn (+ 1 vòng ô kề để đi tới không thấy đen), chỉ giữ vừa đủ số ô đó trong bộ nhớ.
// Lớp che (m.objects): nhà / cây / tường / đồ vật là hình riêng — map.objectsIn(cam, vw, vh) trả các vật trong khung nhìn đã xếp theo
// chân vật, map.behind(e, o) = nhân vật / quái e đứng sau vật o (bị che), map.drawObj(ctx, o); world.js vẽ xen với thân người, quái.
//   map.walkable(x, y); map.path(ax, ay, bx, by); map.randomSpot(rand, avoid)
//   map.an(x, y) — ô thuộc khu an toàn (trong thôn / thành: phi chiến đấu như client — jmo.an, cong-cu/dung-khu-an-toan.mjs); map.cong = cổng
//
// Tọa độ = px của ảnh bản đồ web. Góc nhìn nghiêng của Võ Lâm: 1 px màn hình theo trục y = 2 đơn vị "logic" — mọi khoảng
// cách / tốc độ trong game tính theo logic (ldist) như engine client, nên đi dọc chậm hơn đi ngang trên màn hình.
//
// Vùng đi được: giống game idle cũ (js/mapobs.js) — ô trống nối 8 hướng, đi chéo chỉ khi 2 ô kề cạnh cũng trống; chỉ dùng vùng
// liên thông LỚN NHẤT (các vùng lẻ là chỗ kẹt / ngoài thành).

export const ldist = (ax, ay, bx, by) => Math.hypot(bx - ax, (by - ay) * 2);
const OB = 768;       // ô chia vật của lớp che (px)
// tìm đường: giữ mảng nháp giữa các lần chỉ khi lưới ≤ chừng này ô (map.path). Chiến trường Tống Kim 377 (anh 06/11 — 880 × 1504 = 1,32 triệu ô, 40–80 bot
// + ~70 quân tìm đường): giữ (~16 MB) — bản trước 1,2 triệu thì mỗi lần tìm cấp mới 3 mảng cỡ cả lưới, dọn rác liên tục; Biện Kinh (1,9 triệu ô) vẫn không giữ
const A_GIU = 1400000;
// tải có hạn (anh 28/10 "thanh loading kiểm tra kĩ, tránh lỗi dẫn đến không đồng bộ game"): bản đầu mạng / đường hầm khựng 1 yêu cầu là màn chờ
// đổi bản đồ treo mãi. KHUNG_MS: quá chừng đó không nhận thêm byte nào thì bỏ (rồi thử lại — thuLai); O_MS: chờ 1 ô ảnh / hình vật (warm) tối đa
// chừng đó rồi vào luôn — ô chưa có thì vẽ tới tải tiếp
const KHUNG_MS = 20000, O_MS = 15000;
// fetch có hạn "không nhận byte nào": trả { r, keo } — keo() gọi lại mỗi khi nhận thêm byte để gia hạn, xong thì keo(true)
function layCoHan(url, cache) {
  const ctl = new AbortController(); let t = 0;
  const keo = (xong) => { clearTimeout(t); if (!xong) t = setTimeout(() => ctl.abort(), KHUNG_MS); };
  keo();
  return fetch(url, { signal: ctl.signal, ...(cache ? { cache } : {}) }).then((r) => ({ r, keo }), (e) => { keo(true); throw e; });
}
// anh 09/11 (người chơi mới báo "Không tải được ảnh bản đồ 140.jpg", kẹt ở màn đen): bản trước chỉ thử lại 1 lần sau 1 giây. Nay thử tới THU_LAI lần, cách 1, 2, 3, 4 giây — qua được
// mạng chớp hoặc máy chủ khởi động lại; lỗi kiểu khựng đã tốn KHUNG_MS mỗi lần nên quá THU_MS thì thôi, màn chờ không kéo dài. f(lần thử: 0, 1, …)
const THU_LAI = 5, THU_MS = 30000;
const thuLai = async (f) => {
  const t0 = performance.now();
  for (let i = 0; ; i++) {
    try { return await f(i); }
    catch (e) { if (i + 1 >= THU_LAI || performance.now() - t0 > THU_MS) throw e; await new Promise((r) => setTimeout(r, (i + 1) * 1000)); }
  }
};

export class GameMap {
  // onp(daTai, tong): tiến độ tải ảnh bản đồ theo byte (thanh tải màn chờ — src/game/loading.js)
  static async load(meta, key, base = "assets/web/map/", onp = null) {
    const m = meta.maps[key];
    if (!m) throw new Error(`Không có bản đồ ${key}`);
    if (m.tiles) {
      const map = new GameMap(key, m, m.jmo ? meta.jmo[m.jmo] : null, null, meta, base);
      if (m.objects) {
        const j = await thuLai(async () => { const { r, keo } = await layCoHan(base + m.objects); try { if (!r.ok) throw new Error("Không tải được lớp vật " + m.objects); return await r.json(); } finally { keo(true); } });
        map.setObjects(j, base + m.tiles.dir);
      }
      if (onp) onp(1); // ô ảnh: tải theo khung nhìn (warm)
      return map;
    }
    const img = new Image(), url = base + "z/" + m.img;
    // tải bằng fetch để đếm byte (máy chủ gửi Content-Length); trình duyệt không đọc được dòng byte thì gán thẳng như cũ. Cả tải lẫn đọc ảnh đều được thử lại; từ lần 2 đi thẳng máy chủ
    // (service worker không đụng file có "?", no-store bỏ qua đệm trình duyệt) và xóa bản đã cất — bản lưu trong máy hỏng thì lần sau không vấp lại. Thông báo ghi mã HTTP / "không đọc được" để biết lỗi ở đâu
    await thuLai(async (lan) => {
      if (lan === 1 && self.caches) caches.open("vl-tn-1").then((c) => c.delete(new URL(url, location.href).pathname)).catch(() => {}); // KHO của src/sw.js
      const u = lan ? `${url}?l=${Date.now()}` : url;
      const blob = onp ? await layCoHan(u, lan ? "no-store" : "").then(async ({ r, keo }) => {
        try {
          if (!r.ok) throw new Error(`Không tải được ảnh bản đồ ${m.img} (mã ${r.status})`);
          const tot = +r.headers.get("content-length") || 0;
          if (!r.body || !tot) return await r.blob();
          const rd = r.body.getReader(), parts = []; let got = 0;
          for (;;) { const { done, value } = await rd.read(); if (done) break; keo(); parts.push(value); got += value.length; onp(got, tot); }
          return new Blob(parts, { type: r.headers.get("content-type") || "image/jpeg" });
        } finally { keo(true); }
      }) : null;
      const src = blob ? URL.createObjectURL(blob) : u;
      try {
        await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error(`Không đọc được ảnh bản đồ ${m.img}`)); img.src = src; });
        // giải mã trước để khung đầu không giật; decode() có lúc không bao giờ trả về (gặp khi nạp trang) -> chờ tối đa 2 giây
        await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 2000))]);
      } finally { if (blob) URL.revokeObjectURL(src); } // ảnh đã nạp xong, giữ trong thẻ img
    });
    return new GameMap(key, m, m.jmo ? meta.jmo[m.jmo] : null, img, meta);
  }

  // bản đồ ô ảnh: tải sẵn các ô + hình vật trong khung nhìn (cam, vw × vh) — màn chờ đợi xong mới mở, vào là thấy nền ngay, không đen.
  // Trả [promise, …] (lỗi tải cũng coi là xong)
  warm(cam, vw, vh) {
    if (!this.tiles) return [];
    const T = this.tiles, S = T.size, out = [];
    const wait = (im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); setTimeout(r, O_MS); }));
    for (let ty = Math.floor(cam.y / S); ty <= Math.floor((cam.y + vh) / S); ty++) for (let tx = Math.floor(cam.x / S); tx <= Math.floor((cam.x + vw) / S); tx++) {
      if (tx < 0 || ty < 0 || tx >= T.nx || ty >= T.ny) continue;
      const k = tx + "_" + ty; let im = T.cache.get(k);
      if (!im) { im = new Image(); im.src = T.base + T.dir + k + ".jpg"; T.cache.set(k, im); }
      out.push(wait(im));
    }
    for (const o of this.objectsIn(cam, vw, vh)) { const I = this.oImgs[o.i]; if (!I.im) { I.im = new Image(); I.im.src = I.src; } out.push(wait(I.im)); }
    return out;
  }

  constructor(key, m, j, img, meta, base = "assets/web/map/") {
    this.key = key;
    this.info = m;
    this.img = img;
    this.tiles = m.tiles ? { ...m.tiles, base, cache: new Map() } : null;
    this.w = m.w;
    this.h = m.h;
    if (!j) { // không có vật cản: đi tự do trong khung ảnh (chừa mép)
      this.grid = null;
      return;
    }
    this.gw = j.gw; this.gh = j.gh; this.cw = j.cw; this.ch = j.ch;
    // khu an toàn của thôn / thành (anh 02/11 — trap đổi trạng thái chiến đấu ở cổng của client): bit ô cùng lưới vật cản; cổng { ten, trong, ngoai }
    this.anBits = j.an ? Uint8Array.from(atob(j.an), (c) => c.charCodeAt(0)) : null;
    this.cong = j.cong || [];
    // ô vật cản nhảy qua được (khinh công — client Obstacle_Jump / JumpFly, cong-cu/dung-khinh-cong.mjs): chỉ bản đồ dựng nguyên từ client có
    this.nhayBits = j.nhay ? Uint8Array.from(atob(j.nhay), (c) => c.charCodeAt(0)) : null;
    const b = Uint8Array.from(atob(j.obs), (c) => c.charCodeAt(0));
    const n = j.gw * j.gh, free = new Uint8Array(n);
    for (let i = 0; i < n; i++) free[i] = (b[i >> 3] >> (i & 7)) & 1 ? 0 : 1;
    // thành phần liên thông (8 hướng, chéo khi 2 ô kề cạnh trống)
    const comp = new Int32Array(n).fill(-1), sizes = [];
    const q = new Int32Array(n);
    for (let s = 0; s < n; s++) {
      if (!free[s] || comp[s] >= 0) continue;
      const c = sizes.length; let head = 0, tail = 0; q[tail++] = s; comp[s] = c;
      while (head < tail) {
        const i = q[head++];
        for (const k of this._nb(i, free)) if (comp[k] < 0) { comp[k] = c; q[tail++] = k; }
      }
      sizes.push(tail);
    }
    // giữ vùng lớn nhất; bản đồ cần nhiều vùng tách rời (Phong Lăng Độ 2 bờ sông; thuyền: điểm sinh Thủy tặc nằm ở vùng nhỏ hơn — anh 27/10)
    // khai m.giu = [[x, y]…] (cong-cu/dung-phong-lang-do.mjs): giữ mọi vùng chứa các điểm đó (điểm trên ô chặn: ô trống gần nhất trong 12 ô)
    let giu = new Set([sizes.indexOf(Math.max(...sizes))]);
    if (m.giu && m.giu.length) {
      const k = new Set();
      for (const [x, y] of m.giu) {
        const cx = Math.floor(x / this.cw), cy = Math.floor(y / this.ch); let c = -1, bd = Infinity;
        for (let dy = -24; dy <= 24; dy++) for (let dx = -12; dx <= 12; dx++) {
          const X = cx + dx, Y = cy + dy, d = Math.hypot(dx * this.cw, dy * this.ch * 2);
          if (X >= 0 && Y >= 0 && X < j.gw && Y < j.gh && free[Y * j.gw + X] && d < bd) { bd = d; c = comp[Y * j.gw + X]; }
        }
        if (c >= 0) k.add(c);
      }
      if (k.size) giu = k;
    }
    this.grid = new Uint8Array(n);
    for (let i = 0; i < n; i++) this.grid[i] = free[i] && giu.has(comp[i]) ? 1 : 0;
    this.comp = comp;
    this.cells = [];
    for (let i = 0; i < n; i++) if (this.grid[i]) this.cells.push(i);
  }

  // ô kề đi được của ô i (8 hướng; chéo khi 2 ô kề cạnh cũng đi được)
  _nb(i, g = this.grid) {
    const W = this.gw, H = this.gh, x = i % W, y = (i / W) | 0, out = [];
    const ok = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && g[Y * W + X];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const X = x + dx, Y = y + dy;
      if (!ok(X, Y)) continue;
      if (dx && dy && !(ok(x + dx, y) && ok(x, y + dy))) continue;
      out.push(Y * W + X);
    }
    return out;
  }

  // lớp che: J = objects.json { imgs: [[file, w, h]], objs: [[ảnh, x, y, ax, ay(, bx, by)]] }; chia ô OB px theo góc trên-trái
  setObjects(J, dir) {
    this.oImgs = J.imgs.map(([file, w, h]) => ({ src: dir + file, w, h, im: null }));
    this.objs = J.objs.map(([i, x, y, ax, ay, bx, by]) => {
      const line = bx != null;
      return { i, x, y, w: J.imgs[i][1], h: J.imgs[i][2], ax, ay, bx, by, line, key: line ? (ay + by) / 2 : ay };
    });
    this.oCell = {};
    for (const o of this.objs) { const k = Math.floor(o.x / OB) + "_" + Math.floor(o.y / OB); (this.oCell[k] = this.oCell[k] || []).push(o); }
  }
  // vật chạm khung nhìn, xếp theo chân vật (vật lớn nhất ~ 530 px < OB: tìm thêm 1 ô về trái / lên trên)
  objectsIn(cam, vw, vh) {
    if (!this.objs) return [];
    const out = [], x0 = Math.floor(cam.x / OB) - 1, y0 = Math.floor(cam.y / OB) - 1, x1 = Math.floor((cam.x + vw) / OB), y1 = Math.floor((cam.y + vh) / OB);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (const o of this.oCell[cx + "_" + cy] || [])
      if (o.x < cam.x + vw && o.x + o.w > cam.x && o.y < cam.y + vh && o.y + o.h > cam.y) out.push(o);
    return out.sort((a, b) => a.key - b.key);
  }
  // e (người / quái, chân tại e.x, e.y) đứng sau vật o -> vẽ e trước, vật che lên. Vật điểm: so với điểm chân; vật đoạn thẳng (tường,
  // hàng rào, đá): so với điểm trên đoạn chân ở cùng x (ngoài 2 đầu đoạn thì lấy đầu gần nhất) — như cách xếp của client
  behind(e, o) {
    if (!o.line) return e.y < o.ay;
    const dx = o.bx - o.ax, t = dx ? Math.max(0, Math.min(1, (e.x - o.ax) / dx)) : 0.5;
    return e.y < o.ay + (o.by - o.ay) * t;
  }
  drawObj(ctx, o) {
    const I = this.oImgs[o.i];
    if (!I.im) { I.im = new Image(); I.im.src = I.src; }
    if (I.im.complete && I.im.naturalWidth) ctx.drawImage(I.im, o.x, o.y);
  }

  // nền trong khung nhìn (cam = góc trên-trái, vw × vh px bản đồ)
  drawBg(ctx, cam, vw, vh) {
    if (!this.tiles) {
      const sx = Math.max(0, cam.x), sy = Math.max(0, cam.y), sw = Math.min(vw, this.w - sx), sh = Math.min(vh, this.h - sy);
      if (sw > 0 && sh > 0) ctx.drawImage(this.img, sx, sy, sw, sh, sx - cam.x, sy - cam.y, sw, sh);
      return;
    }
    const T = this.tiles, S = T.size, C = T.cache;
    const tx0 = Math.floor(cam.x / S), ty0 = Math.floor(cam.y / S), tx1 = Math.floor((cam.x + vw) / S), ty1 = Math.floor((cam.y + vh) / S);
    const get = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= T.nx || ty >= T.ny) return null;
      const k = tx + "_" + ty; let im = C.get(k);
      if (im) C.delete(k); else { im = new Image(); im.src = T.base + T.dir + k + ".jpg"; } // ô chưa có file (ngoài bản đồ): lỗi tải -> bỏ qua
      C.set(k, im); // dùng gần đây nhất đứng cuối
      return im;
    };
    for (let ty = ty0 - 1; ty <= ty1 + 1; ty++) for (let tx = tx0 - 1; tx <= tx1 + 1; tx++) {
      const im = get(tx, ty);
      if (im && tx >= tx0 && tx <= tx1 && ty >= ty0 && ty <= ty1 && im.complete && im.naturalWidth) ctx.drawImage(im, Math.round(tx * S - cam.x), Math.round(ty * S - cam.y));
    }
    // giữ vừa đủ ô quanh khung nhìn (+ vòng kề + 4 ô dư) — bộ nhớ theo cỡ màn hình (1024×768: ~20 ô × 2,25 MB đã giải)
    const keep = (tx1 - tx0 + 3) * (ty1 - ty0 + 3) + 4;
    while (C.size > keep) C.delete(C.keys().next().value);
  }

  cellOf(x, y) {
    const cx = Math.floor(x / this.cw), cy = Math.floor(y / this.ch);
    return cx < 0 || cy < 0 || cx >= this.gw || cy >= this.gh ? -1 : cy * this.gw + cx;
  }
  // (x, y) trong khu an toàn của thôn / thành; bản đồ không khai khu an toàn: false (cả bản đồ đánh được như cũ)
  an(x, y) { if (!this.anBits) return false; const i = this.cellOf(x, y); return i >= 0 && ((this.anBits[i >> 3] >> (i & 7)) & 1) === 1; }
  // số vùng đi được của điểm (x, y) — 2 điểm khác số = không đi bộ tới nhau được (vd 2 bờ Phong Lăng Độ); -1 nếu ô chặn / ngoài bản đồ
  vung(x, y) { const i = this.grid ? this.cellOf(x, y) : -1; return i >= 0 && this.grid[i] ? this.comp[i] : -1; }
  center(i) { return [((i % this.gw) + 0.5) * this.cw, (((i / this.gw) | 0) + 0.5) * this.ch]; }

  walkable(x, y) {
    if (!this.grid) return x >= 20 && y >= 20 && x <= this.w - 20 && y <= this.h - 20;
    const i = this.cellOf(x, y);
    return i >= 0 && this.grid[i] === 1;
  }

  // khinh công bay qua được điểm (x, y): ô đi được hoặc vật cản loại nhảy (engine KNpc::NewJump chỉ dừng ở vật cản thường / bay)
  nhayQua(x, y) {
    if (!this.grid) return this.walkable(x, y);
    const i = this.cellOf(x, y);
    return i >= 0 && (this.grid[i] === 1 || (!!this.nhayBits && ((this.nhayBits[i >> 3] >> (i & 7)) & 1) === 1));
  }

  // Đường thẳng a -> b có đi được không: duyệt ĐÚNG mọi ô đoạn thẳng đi qua (Amanatides–Woo); đi chéo qua đúng góc ô thì 2 ô kề
  // cũng phải đi được (cùng luật với tìm đường). Trước đây chỉ lấy mẫu từng nửa ô nên có đoạn cắt qua góc vật cản -> nhân vật
  // chạy tới góc thì bị chặn, bỏ đường, tìm lại đúng đường cũ -> đứng khựng (tools/verify/stuck-check.js bắt được ở 12 / 20 bãi).
  clear(ax, ay, bx, by) {
    if (!this.grid) return this.walkable(ax, ay) && this.walkable(bx, by);
    const W = this.gw, H = this.gh, g = this.grid, cw = this.cw, ch = this.ch;
    const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y * W + x] === 1;
    let x = Math.floor(ax / cw), y = Math.floor(ay / ch);
    const x1 = Math.floor(bx / cw), y1 = Math.floor(by / ch), dx = bx - ax, dy = by - ay, sx = Math.sign(dx), sy = Math.sign(dy);
    if (!ok(x, y) || !ok(x1, y1)) return false;
    const tdx = dx ? Math.abs(cw / dx) : Infinity, tdy = dy ? Math.abs(ch / dy) : Infinity;
    let tx = dx ? (sx > 0 ? (x + 1) * cw - ax : ax - x * cw) / Math.abs(dx) : Infinity;
    let ty = dy ? (sy > 0 ? (y + 1) * ch - ay : ay - y * ch) / Math.abs(dy) : Infinity;
    for (let guard = W + H + 4; (x !== x1 || y !== y1) && guard > 0; guard--) {
      if (Math.abs(tx - ty) < 1e-9) { // qua đúng góc ô
        if (!ok(x + sx, y) || !ok(x, y + sy)) return false;
        x += sx; y += sy; tx += tdx; ty += tdy;
      } else if (tx < ty) { x += sx; tx += tdx; } else { y += sy; ty += tdy; }
      if (!ok(x, y)) return false;
    }
    return true;
  }

  // Ô đi được gần (x, y) nhất (tìm loang tối đa r ô)
  nearestCell(x, y, r = 12) {
    let i = this.cellOf(x, y);
    if (i >= 0 && this.grid[i]) return i;
    const cx = Math.floor(x / this.cw), cy = Math.floor(y / this.ch);
    let best = -1, bd = Infinity;
    for (let dy = -r * 2; dy <= r * 2; dy++) for (let dx = -r; dx <= r; dx++) {
      const X = cx + dx, Y = cy + dy;
      if (X < 0 || Y < 0 || X >= this.gw || Y >= this.gh || !this.grid[Y * this.gw + X]) continue;
      const d = Math.hypot(dx * this.cw, dy * this.ch * 2);
      if (d < bd) { bd = d; best = Y * this.gw + X; }
    }
    return best;
  }

  // A* trên lưới (chi phí theo logic: ô vuông cw × 2ch), rồi rút gọn điểm bằng clear(). Trả về [[x,y], …] (không gồm điểm đầu)
  // hoặc null nếu không tới được. maxNodes giới hạn công sức cho quái. nang > 1: A* nặng heuristic (đường có thể dài hơn chút, mở ít nút hơn nhiều — bấm NPC
  // ở xa: World.clickNpc tìm lại khi lần thường hết ngân sách)
  path(ax, ay, bx, by, maxNodes = 20000, nang = 1) {
    if (!this.grid) return [[bx, by]];
    if (this.clear(ax, ay, bx, by)) return [[bx, by]];
    const s = this.nearestCell(ax, ay), t = this.nearestCell(bx, by);
    if (s < 0 || t < 0) return null;
    // khác vùng liền (đảo, hậu doanh Tống Kim chỉ nối bằng bẫy dịch chuyển…): không bao giờ tới được — trả null ngay, khỏi tìm hết ngân sách (dựng lưới giữ nguyên cả
    // vùng liền: comp đúng với _nb trên lưới). Soát 13/11: Trợ Thủ "Theo sau" người đang ở hậu doanh -> walkTo tìm lại 150000 nút mỗi bước
    if (this.comp && this.comp[s] !== this.comp[t]) return null;
    const W = this.gw, n = W * this.gh, CW = this.cw, CH = this.ch * 2;
    // mảng nháp dùng lại giữa các lần tìm (Tống Kim bãi thử anh 05/11: 40–80 bot tìm đường — bản trước mỗi lần cấp mới 3 mảng cỡ cả lưới, bản đồ
    // Ba Lăng ~3 MB / lần, Biện Kinh ~17 MB / lần -> dọn rác liên tục, giật). Ô chỉ có giá trị khi dấu = lượt hiện tại (gen): không phải xóa cả lưới
    const S = n <= A_GIU ? (this._aStar && this._aStar.n === n ? this._aStar : (this._aStar = { n, g: new Float32Array(n), from: new Int32Array(n), dau: new Uint32Array(n), gen: 0 }))
      : { n, g: new Float32Array(n), from: new Int32Array(n), dau: new Uint32Array(n), gen: 0 };
    if (++S.gen >= 0x7ffffff0) { S.dau.fill(0); S.gen = 1; }
    const gen = S.gen * 2, g = S.g, from = S.from, dau = S.dau; // dau[i] = gen: đã thấy (g / from đúng), gen + 1: đã đóng
    const gOf = (i) => ((dau[i] | 1) === (gen | 1) ? g[i] : Infinity);
    const tx = t % W, ty = (t / W) | 0;
    const hh = (i) => Math.hypot(((i % W) - tx) * CW, (((i / W) | 0) - ty) * CH);
    const heap = new Heap();
    dau[s] = gen; g[s] = 0; from[s] = -1; heap.push(s, nang * hh(s));
    let seen = 0;
    while (heap.size) {
      const i = heap.pop();
      if (i === t) break;
      if (dau[i] === gen + 1) continue;
      dau[i] = gen + 1;
      if (++seen > maxNodes) return null;
      const x = i % W, y = (i / W) | 0, gi = g[i];
      for (const k of this._nb(i)) {
        const c = gi + Math.hypot(((k % W) - x) * CW, (((k / W) | 0) - y) * CH);
        if (c < gOf(k)) { if (dau[k] !== gen + 1) dau[k] = gen; g[k] = c; from[k] = i; heap.push(k, c + nang * hh(k)); } // nút đã đóng giữ dấu đóng (như bản cũ: closed riêng)
      }
    }
    const thay = (i) => (dau[i] | 1) === (gen | 1);
    if (s !== t && (!thay(t) || from[t] < 0)) return null;
    const cells = [];
    for (let i = t; i !== s && i >= 0; i = thay(i) ? from[i] : -1) cells.push(i);
    cells.reverse();
    const pts = cells.map((i) => this.center(i));
    pts[pts.length - 1] = this.walkable(bx, by) ? [bx, by] : pts[pts.length - 1];
    // rút gọn: từ điểm hiện tại nhảy tới điểm xa nhất còn đi thẳng được
    const out = [];
    let cx = ax, cy = ay, k = 0;
    while (k < pts.length) {
      let j = pts.length - 1;
      while (j > k && !this.clear(cx, cy, pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); [cx, cy] = pts[j]; k = j + 1;
    }
    return out;
  }

  // Điểm đi được ngẫu nhiên; avoid(x, y) trả true thì bỏ (vd quá gần người chơi / quái khác)
  randomSpot(rand, avoid, tries = 200) {
    for (let k = 0; k < tries; k++) {
      let x, y;
      if (this.grid) { [x, y] = this.center(this.cells[Math.floor(rand() * this.cells.length)]); }
      else { x = 150 + rand() * (this.w - 300); y = 150 + rand() * (this.h - 300); }
      if (!avoid || !avoid(x, y)) return [x, y];
    }
    return null;
  }
}

// Hàng đợi ưu tiên nhỏ nhất (đống nhị phân) cho A*
class Heap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, pri) {
    const K = this.k, V = this.v; let i = K.length; K.push(key); V.push(pri);
    while (i > 0) { const p = (i - 1) >> 1; if (V[p] <= V[i]) break; [K[p], K[i]] = [K[i], K[p]]; [V[p], V[i]] = [V[i], V[p]]; i = p; }
  }
  pop() {
    const K = this.k, V = this.v, top = K[0], lk = K.pop(), lv = V.pop();
    if (K.length) {
      K[0] = lk; V[0] = lv; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < K.length && V[l] < V[m]) m = l;
        if (r < K.length && V[r] < V[m]) m = r;
        if (m === i) break;
        [K[m], K[i]] = [K[i], K[m]]; [V[m], V[i]] = [V[i], V[m]]; i = m;
      }
    }
    return top;
  }
}
