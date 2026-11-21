// Đọc kho hình nhân vật (assets/char/) và vẽ nhân vật lên canvas.
// Định dạng kho: assets/char/README.md
//
//   const pack = await CharPack.load("assets/char/");
//   const look = pack.resolve({ sex: "m", armor: 5, helm: 3, weapon: 12, horse: 0 });
//   await pack.ensure(look, "attack");
//   pack.draw(ctx, look, { act: "attack", dir: 2, t: 0.15, x: 200, y: 300, scale: 2 });

// Chọn bộ hình theo "điểm lỗi hiển thị" (thấp hơn = tốt hơn):
// HOLE  — bộ này không vẽ được bộ phận đó (không hình thật, không thế chỗ, không mặc định) trong khi bộ kia CÓ hình thật.
//         Vd bộ B nam không có file tay trái nào -> mặc áo thường sẽ cụt tay. (Bộ kia chỉ có hình thế chỗ thì không tính:
//         vd áo bào #43 nam — bộ A cũng chỉ có tay thế chỗ, còn bộ B vẽ tay trong ống tay áo.)
// WRONG — bộ này phải dùng hình thế chỗ / mặc định trong khi bộ kia có hình thật.
// SET_PENALTY — bộ B ít động tác (không có bị đánh, chết, ra chiêu) và ít khung hơn.
const HOLE = { body: 100, horsem: 100, lhand: 50, rhand: 50, rweapon: 50, head: 40, lweapon: 30, horsef: 20, horseb: 20, hair: 5, shoulder: 5 };
const WRONG = { body: 40, horsem: 30, rweapon: 20, head: 15, lweapon: 10, rhand: 5, lhand: 5, horsef: 5, horseb: 5, hair: 3, shoulder: 3 };
const SET_PENALTY = { a: 0, b: 10 };
const PART_VI = { head: "đầu", hair: "tóc", shoulder: "vai", body: "thân", lhand: "tay trái", rhand: "tay phải", lweapon: "vũ khí trái", rweapon: "vũ khí phải", horsef: "ngựa trước", horsem: "ngựa giữa", horseb: "ngựa sau" };
const SEMANTIC = new Set(["stand", "run", "attack", "hurt", "die", "magic"]);
const RETRY_MS = 2000;

export class CharPack {
  static async load(base) {
    base = base.endsWith("/") ? base : base + "/";
    const res = await fetch(base + "pack.json");
    if (!res.ok) throw new Error(`Không đọc được ${base}pack.json (${res.status})`);
    const meta = await res.json();
    if (meta.format !== "vl-char-pack") throw new Error("pack.json không đúng định dạng vl-char-pack");
    return new CharPack(base, meta);
  }

  constructor(base, meta) {
    this.base = base;
    this.meta = meta;
    this.code = Object.fromEntries(Object.entries(meta.parts).map(([c, p]) => [p, +c]));
    this._items = new Map();  // "a/m/body_5" -> { p: Promise<json>, failed }
    this._json = new Map();   // "a/m/body_5" -> json đã tải
    this._imgs = new Map();   // url -> HTMLImageElement (đã decode)
    this._imgP = new Map();   // url -> { p: Promise<img>, failed }
  }

  // ---------- Tra cứu ----------
  partSex(part, sex) { return this.meta.groups.horse.includes(part) ? this.meta.horseSex : sex; }

  // Trạng thái 1 món trong 1 bộ: { real: true, acts } | { sub: id } | null
  entry(set, sex, part, id) {
    const e = (((this.meta.sets[set].items[this.partSex(part, sex)] || {})[part]) || {})[id];
    if (!e) return null;
    return Array.isArray(e) ? { real: true, acts: e } : e;
  }

  // Danh sách id của 1 bộ phận (cả 2 bộ), kèm trạng thái
  listIds(sex, part) {
    const ids = new Set();
    for (const set of ["a", "b"]) for (const id of Object.keys(((this.meta.sets[set].items[this.partSex(part, sex)] || {})[part]) || {})) ids.add(+id);
    return [...ids].sort((x, y) => x - y).map((id) => ({ id, a: this.entry("a", sex, part, id), b: this.entry("b", sex, part, id) }));
  }

  // Có hình thật ở bộ nào không (dùng khi chọn id cho 1 món đồ)
  isReal(sex, group, id) {
    return this.meta.groups[group].some((p) => ["a", "b"].some((s) => (this.entry(s, sex, p, id) || {}).real));
  }

  // Chọn id kiểu dáng cho 1 món đồ (từ item-looks.json): ưu tiên id có hình thật.
  // Thứ tự xét: kiểu theo bản 1 (gần bảng gốc nhất), rồi kiểu bản 2 chọn.
  pickLookId(sex, item) {
    const cands = [item.a, item.b, ...(item.bAlt || [])].filter((x) => x > 0);
    const real = cands.find((id) => this.isReal(sex, item.g, id));
    if (real) return { id: real, why: real === item.a ? "theo bản 1" : "theo bản 2" };
    if (cands.length) return { id: cands[0], why: "chưa có hình thật, dùng hình thế chỗ" };
    return { id: 0, why: "không có kiểu dáng" };
  }

  // ---------- Giải kiểu dáng: chọn bộ hình + id từng bộ phận ----------
  // req: { sex, armor, helm, weapon, horse, set: "auto" | "a" | "b" }
  // Tự chọn: bộ nào có điểm lỗi hiển thị thấp hơn thì dùng (xem HOLE / WRONG / SET_PENALTY ở đầu file); bằng nhau -> bộ A.
  // Không bao giờ trộn 2 bộ trên 1 nhân vật.
  resolve(req) {
    const sex = req.sex === "f" ? "f" : "m";
    const d = this.meta.defaults;
    const want = { armor: req.armor || d.armor, helm: req.helm || d.helm, weapon: req.weapon || d.weapon, horse: req.horse || 0 };
    const plans = {};
    for (const set of ["a", "b"]) plans[set] = this._plan(set, sex, want);
    const describe = (s) => plans[s].defects.length ? plans[s].defects.map((x) => x.text).join("; ") : "không có lỗi";
    let set, why;
    if (req.set === "a" || req.set === "b") { set = req.set; why = `chọn tay · lỗi bộ ${set.toUpperCase()}: ${describe(set)}`; }
    else {
      set = plans.a.cost <= plans.b.cost ? "a" : "b";
      const other = set === "a" ? "b" : "a";
      why = `điểm lỗi A ${plans.a.cost} · B ${plans.b.cost} — bộ ${other.toUpperCase()}: ${describe(other)}` +
        (plans[set].defects.length ? ` · bộ ${set.toUpperCase()}: ${describe(set)}` : "");
    }
    const plan = plans[set];
    const riding = !!plan.parts.horsem;
    // Kiểu đánh theo vũ khí đang cầm (kể cả khi hình vũ khí là hình thế chỗ, vd ám khí mượn hình tay không).
    // Chỉ khi bộ hình không có vũ khí này và phải vẽ vũ khí mặc định thì kiểu đánh theo vũ khí mặc định cho khớp hình.
    const wp = plan.parts.rweapon || plan.parts.lweapon;
    const wid = wp && wp.why === "mặc định" ? wp.id : want.weapon;
    const weapon = (this.meta.weapons[sex] || {})[wid] || { kind: "free" };
    return {
      set, why, sex, want, riding, weapon, weaponId: wid,
      parts: plan.parts, notes: plan.notes,
      cost: { a: plans.a.cost, b: plans.b.cost }, defects: { a: plans.a.defects, b: plans.b.defects },
      key: `${set}|${sex}|${JSON.stringify(plan.parts)}`,
    };
  }

  _plan(set, sex, want) {
    const other = set === "a" ? "b" : "a", S = set.toUpperCase(), O = other.toUpperCase();
    const parts = {}, notes = [], real = new Set(), defects = [];
    let cost = SET_PENALTY[set] || 0;
    // Vũ khí trái chỉ đáng kể với song binh; vũ khí 1 tay thì "vũ khí trái" chỉ là chấm nắm tay 3px -> không tính lỗi
    const double = ((this.meta.weapons[sex] || {})[want.weapon] || {}).kind === "double";
    const defect = (part, w, text) => { if (part === "lweapon" && !double) return; cost += w; defects.push({ part, w, text }); };
    for (const [group, list] of Object.entries(this.meta.groups)) {
      const id = want[group];
      if (!id) continue;
      for (const part of list) {
        const mine = this.entry(set, sex, part, id), theirs = this.entry(other, sex, part, id);
        if (!mine && !theirs) continue; // bộ phận này không thuộc kiểu dáng này
        const theirsReal = !!(theirs && theirs.real);
        if (mine && mine.real) { parts[part] = { id, real: true }; real.add(part); continue; }
        if (mine && mine.sub) {
          parts[part] = { id: mine.sub, real: false, want: id, why: "thế chỗ" };
          notes.push(`${PART_VI[part]} #${id}: bộ ${S} không có hình thật, dùng hình thế chỗ #${mine.sub}`);
          if (theirsReal) defect(part, WRONG[part], `${PART_VI[part]} #${id} dùng hình thế chỗ (bộ ${O} có hình thật)`);
          continue;
        }
        // Bộ này không có, bộ kia có -> không trộn 2 bộ: dùng kiểu mặc định của nhóm nếu có, không thì bỏ trống
        const def = this.meta.defaults[group];
        const de = def && this.entry(set, sex, part, def);
        if (de && (de.real || de.sub)) {
          parts[part] = { id: de.real ? def : de.sub, real: false, want: id, why: "mặc định" };
          notes.push(`${PART_VI[part]} #${id}: chỉ bộ ${O} có, bộ ${S} dùng kiểu mặc định #${def}`);
          if (theirsReal) defect(part, WRONG[part], `${PART_VI[part]} #${id} phải dùng kiểu mặc định (bộ ${O} có hình thật)`);
        } else {
          const noneAtAll = !((this.meta.sets[set].items[this.partSex(part, sex)] || {})[part]);
          notes.push(`${PART_VI[part]} #${id}: bộ ${S} ${noneAtAll ? "không có hình " + PART_VI[part] + " nào cho giới này" : "không có hình"}, bỏ trống`);
          if (theirsReal) defect(part, HOLE[part], `thiếu hẳn ${PART_VI[part]} (bộ ${O} có hình thật)`);
        }
      }
    }
    return { parts, notes, real, cost, defects };
  }

  // ---------- Động tác ----------
  // Danh sách động tác của 1 bộ phận trong look
  actsOf(look, part) {
    const p = look.parts[part];
    if (!p) return [];
    const e = this.entry(look.set, look.sex, part, p.id);
    return e && e.real ? e.acts : [];
  }
  refPart(look) { return look.parts.body ? "body" : look.parts.horsem ? "horsem" : Object.keys(look.parts)[0]; }

  // Đổi động tác ngữ nghĩa (stand/run/attack/hurt/die/magic) thành tên động tác thật có hình.
  // Trả về { act, sem, exact } hoặc null. act cụ thể (vd "MeleeWCut") thì dùng thẳng nếu có.
  actFor(look, want) {
    const have = new Set(this.actsOf(look, this.refPart(look)));
    if (!SEMANTIC.has(want)) return have.has(want) ? { act: want, sem: this._semOf(want), exact: true } : null;
    const k = this.meta.kinds;
    const table = look.riding ? look.weapon.ride || k.ride : look.weapon.acts || k[look.weapon.kind] || k.free;
    const kindTable = look.riding ? k.ride : k[look.weapon.kind] || k.free;
    for (const sem of [want, ...(this.meta.fallback[want] || [])]) {
      for (const act of [table[sem], kindTable[sem]]) {
        if (act && have.has(act)) return { act, sem, exact: sem === want && act === table[want] };
      }
    }
    return null;
  }
  _semOf(act) {
    for (const [sem, a] of Object.entries(this.meta.kinds.free)) if (a === act) return sem;
    if (/Stand/.test(act)) return "stand";
    if (/Run/.test(act)) return "run";
    if (/Wound/.test(act)) return "hurt";
    if (/Die/.test(act)) return "die";
    if (/Magic/.test(act)) return "magic";
    return "attack";
  }

  // ---------- Tải ----------
  _itemKey(look, part) { return `${look.set}/${this.partSex(part, look.sex)}/${part}_${look.parts[part].id}`; }
  // Tải có nhớ đệm. Lỗi thì cho thử lại sau RETRY_MS (không thử lại liên tục mỗi khung hình).
  _cached(map, key, make) {
    const c = map.get(key);
    if (c && (!c.failed || performance.now() - c.failed < RETRY_MS)) return c.p;
    const entry = { p: null, failed: 0 };
    entry.p = make().then((v) => { if (v == null) entry.failed = performance.now(); return v; },
      () => { entry.failed = performance.now(); return null; });
    map.set(key, entry);
    return entry.p;
  }
  _loadItem(key) {
    return this._cached(this._items, key, () => fetch(this.base + key + ".json")
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) this._json.set(key, j); return j; }));
  }
  // Chờ onload chứ không chờ img.decode(): decode() có thể treo mãi khi tab/khung đang ẩn (đã gặp thật).
  // decode() vẫn được gọi thêm để trình duyệt giải mã sớm, nhưng không chờ.
  _loadImg(url) {
    return this._cached(this._imgP, url, () => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth) return reject(new Error("Ảnh rỗng: " + url));
        this._imgs.set(url, img);
        if (img.decode) img.decode().catch(() => {});
        resolve(img);
      };
      img.onerror = () => reject(new Error("Không tải được ảnh: " + url));
      img.src = url;
    }));
  }
  _imgUrl(key, file) { return this.base + key.slice(0, key.lastIndexOf("/") + 1) + file; }

  // Tải đủ dữ liệu + ảnh để vẽ 1 động tác của look. Trả về tên động tác thật (hoặc null).
  async ensure(look, want) {
    const keys = Object.keys(look.parts).map((p) => this._itemKey(look, p));
    await Promise.all(keys.map((k) => this._loadItem(k)));
    const r = this.actFor(look, want);
    if (!r) return null;
    await Promise.all(keys.map((k) => {
      const a = (this._json.get(k) || { acts: {} }).acts[r.act];
      return a ? this._loadImg(this._imgUrl(k, a.img)) : null;
    }));
    return r;
  }

  // ---------- Vẽ ----------
  // Số khung của động tác (theo bộ phận chuẩn)
  frameCount(look, act) {
    const a = ((this._json.get(this._itemKey(look, this.refPart(look))) || { acts: {} }).acts || {})[act];
    return a ? a.n : 0;
  }

  // Độ dài 1 lượt động tác theo nhịp mặc định của bộ hình (giây)
  actDuration(look, act) {
    const ref = (this._json.get(this._itemKey(look, this.refPart(look))) || { acts: {} }).acts[act];
    if (!ref) return 0;
    const tm = this.meta.sets[look.set].timing, sem = this._semOf(act);
    const ms = look.set === "b" ? ref.i * tm.unitMs : tm.msPerFrame[sem] || tm.onceMsPerFrame;
    return (ref.n * ms) / 1000;
  }

  // Tên file ảnh của 1 bộ phận cho 1 động tác (đã tải), vd "a/m/ma_bd_001_st03.webp"
  partFile(look, part, act) {
    if (!look.parts[part]) return null;
    const key = this._itemKey(look, part);
    const a = (this._json.get(key) || { acts: {} }).acts[act];
    return a ? key.slice(0, key.lastIndexOf("/") + 1) + a.img : null;
  }

  // Vùng cắt [x, y, rộng, cao, lệchX, lệchY] của 1 động tác ở hướng dir, khi bộ phận chuẩn đang ở khung j / n.
  // - Lưới (bộ a): hàng = hướng, cột = khung.  - Tỉa (bộ b): f[hướng * n + khung].
  // - Có seg (tấm xếp 8 hướng trên 1 hàng, số khung mỗi hướng không đều): seg[hướng] = [khung đầu, số khung].
  _rect(a, dir, j, n) {
    let idx, row = 0;
    if (a.seg) {
      const [s0, len] = a.seg[dir];
      idx = s0 + Math.min(len - 1, Math.floor((j * len) / n));
    } else {
      const k = Math.min(a.n - 1, Math.floor((j * a.n) / n));
      row = a.d >= 8 ? dir : Math.floor((dir * a.d) / 8);
      idx = a.grid ? k : row * a.n + k;
    }
    if (a.grid) { const [w, h, ox, oy] = a.grid; return [idx * w, a.seg ? 0 : row * h, w, h, ox, oy]; }
    return a.f[idx];
  }

  // Khung k, hướng dir của 1 bộ phận: { w, h, ox, oy } (lệch so với điểm chân), hoặc null
  frameRect(look, part, act, dir = 0, k = 0) {
    if (!look.parts[part]) return null;
    const a = (this._json.get(this._itemKey(look, part)) || { acts: {} }).acts[act];
    if (!a) return null;
    const per = a.seg ? a.seg[dir][1] : a.n;
    const f = this._rect(a, dir, Math.min(k, per - 1), per);
    return { w: f[2], h: f[3], ox: f[4], oy: f[5] };
  }

  // Khung thứ mấy tại thời điểm t (giây). duration (giây) = độ dài động tác 1 lần, nếu game muốn ép.
  frameAt(look, act, t, duration) {
    const ref = (this._json.get(this._itemKey(look, this.refPart(look))) || { acts: {} }).acts[act];
    if (!ref) return 0;
    const sem = this._semOf(act), loop = !!this.meta.loop[sem], n = ref.n;
    if (!loop && duration > 0) return Math.min(n - 1, Math.floor((t / duration) * n));
    const tm = this.meta.sets[look.set].timing;
    const ms = look.set === "b" ? ref.i * tm.unitMs : tm.msPerFrame[sem] || tm.onceMsPerFrame;
    const j = Math.floor((t * 1000) / ms);
    return loop ? j % n : Math.min(j, n - 1);
  }

  // Thứ tự vẽ các bộ phận (mã) cho động tác/hướng/khung
  order(look, act, dir, j) {
    const tbl = this.meta.sets[look.set].order[look.sex] || {};
    const key = String(dir * 2 + 1);
    const t = tbl[act], def = tbl.DEFAULT || { dirs: {} };
    if (t && t.lines) {
      const mark = j * (this.meta.sets[look.set].lineStep || 1);
      const line = t.lines.find((l) => l[0] === mark);
      if (line) return line.slice(1);
    }
    return (t && t.dirs[key]) || def.dirs[key] || def.dirs["1"] || [this.code.body];
  }

  // Vẽ 1 nhân vật. opt: { act (ngữ nghĩa hoặc tên thật), dir 0..7, t (giây), duration, x, y (điểm chân), scale, alpha, frame (ép khung), snap }
  // Trả về { act, frame, n, top } hoặc null nếu chưa tải xong phần thân.
  draw(ctx, look, opt) {
    const r = this.actFor(look, opt.act);
    if (!r) return null;
    const act = r.act, dir = ((opt.dir | 0) % 8 + 8) % 8, scale = opt.scale || 1, snap = opt.snap !== false;
    const refKey = this._itemKey(look, this.refPart(look));
    const ref = (this._json.get(refKey) || { acts: {} }).acts[act];
    if (!ref) { this.ensure(look, opt.act); return null; }
    const n = ref.n;
    const j = opt.frame != null ? Math.min(n - 1, Math.max(0, opt.frame | 0)) : this.frameAt(look, act, opt.t || 0, opt.duration);
    const px = (v) => (snap ? Math.round(v) : v);
    let top = 0, drewRef = false, pending = false;
    const prevAlpha = ctx.globalAlpha, prevSmooth = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    ctx.imageSmoothingEnabled = false;
    for (const code of this.order(look, act, dir, j)) {
      const part = this.meta.parts[code];
      if (!part || !look.parts[part]) continue;
      const key = this._itemKey(look, part);
      const a = (this._json.get(key) || { acts: {} }).acts[act];
      if (!a) continue;
      const img = this._imgs.get(this._imgUrl(key, a.img));
      if (!img) { pending = true; continue; }
      const [sx, sy, w, hh, ox, oy] = this._rect(a, dir, j, n);
      ctx.drawImage(img, sx, sy, w, hh, px(opt.x + ox * scale), px(opt.y + oy * scale), w * scale, hh * scale);
      if (part === "body" || part === "head" || part === "horsem") top = Math.min(top, oy * scale);
      if (key === refKey) drewRef = true;
    }
    ctx.globalAlpha = prevAlpha;
    ctx.imageSmoothingEnabled = prevSmooth;
    if (pending) this.ensure(look, opt.act);
    return drewRef ? { act, sem: r.sem, exact: r.exact, frame: j, n, top } : null;
  }
}
