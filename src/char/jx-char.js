// Vẽ nhân vật bằng hình GỐC của client Võ Lâm 1 PC (assets/jxchar/). Định dạng kho + quy tắc + bằng chứng: assets/jxchar/README.md
//
//   const jx = await JxChar.load("assets/jxchar/");
//   const look = jx.look({ sex: "m", helm: 3, armor: 5, weapon: 12, horse: 0, mantle: 0 });
//   await jx.ensure(look, "FightStand");
//   jx.draw(ctx, look, { act: "FightStand", dir: 3, t: 0.4, x: 300, y: 260, scale: 1 });
//
// - id kiểu dáng = số hàng trong bảng client (tính từ 1), trùng id bộ A / B của assets/char/item-looks.json. 0 = không có
//   (ngựa, áo choàng). Mũ -> đầu + tóc; áo -> vai + thân + 2 tay; vũ khí -> 2 vũ khí (+ hiệu ứng); ngựa -> 3 phần ngựa (+ hiệu ứng).
// - Động tác: 14 tên logic của engine (FightStand, NormalStand1, NormalStand2, FightWalk, NormalWalk, FightRun, NormalRun, Wound,
//   Die, Attack1, Attack2, Magic, SitDown, JunpFly — chữ "Junp" ghi sai y như client, nhận cả "JumpFly") được đổi sang tên động tác
//   thật theo bảng ghép của HÀNG vũ khí (đi bộ / cưỡi ngựa). Truyền thẳng tên thật (vd "MeleeWCut") cũng được.
// - Hướng 0..7 theo src/dir.js (0 = nam, theo chiều kim đồng hồ). Khung hướng h = h × (số khung mỗi hướng) + k.
// - Thứ tự vẽ: dòng Line (mốc = số khung trên cả file thân) > Dir của động tác > [DEFAULT]. Bóng vẽ đầu tiên. Hiệu ứng vũ khí /
//   ngựa vẽ ngay sau bộ phận gốc, kiểu CỘNG SÁNG ("lighter"): file hiệu ứng là ảnh tối trên nền đen đục (đen = không thêm sáng);
//   hiệu ứng vũ khí nhuộm theo cột ChangeColor của bảng (màu điểm × màu nhuộm / 255).
// - Nhịp: client ghi nhịp 1 cho hầu hết động tác nhân vật (tốc độ do logic game quyết). Mặc định 1 khung mỗi vòng engine
//   (TICK_MS = 1000/18 ms); game muốn khác thì truyền opt.ms (ms / khung) hoặc opt.duration (giây / lượt) hoặc opt.frame.

import { decodeSpr, buildAtlas, anhLoc, TICK_MS } from "../jx/spr.js";
import { layTep } from "../tai-tep.js"; // tải có hạn "khựng 15 giây thì bỏ" (anh 28/10 — thanh tải kẹt)

const RETRY_MS = 2000;
const LOGICAL_ALIAS = { JumpFly: "JunpFly" };
const GROUP_OF = { head: "helm", hair: "helm", shoulder: "armor", body: "armor", lhand: "armor", rhand: "armor", lweapon: "weapon", rweapon: "weapon", horsef: "horse", horsem: "horse", horseb: "horse", mantle: "mantle" };
const LOOP = /Stand|Walk|Run/;
// Kiểu dáng khi KHÔNG mang đồ (nhân vật mới tạo): mũ #19 (Bố Cân), áo #19 (Áo vải thô), tay không (#1 "空手"). Bằng chứng:
// client settings/item/helmres.txt, armorres.txt dòng 1 -> bộ phận 20 (= kiểu #19, vì số bộ phận = số thường + 1),
// meleeres.txt dòng 1 -> 2 (= #1 tay không) — dòng 1 không ứng với món nào (món hàng r ở dòng r + 1); bản 2 js/jxparts.js
// JXLOOK.none = { armor: 19, helm: 19, weapon: 1 }. Mũ / áo #1 là đồ Thiếu Lâm (Sa Di Giới Cô, Sa Di phục) — không phải mặc định.
export const NONE = { helm: 19, armor: 19, weapon: 1 };
// Lễ phục (anh 15/11 — Phi Phong bị đè lên áo có sẵn tà áo): áo kiểu 43–46 là hình liền cả bộ (躯体 ma_lf_00..03 / fm_lf_00..03, không vai / tay
// riêng — Kinh Thiên giáp vẽ sẵn áo choàng đỏ, các bộ khác là áo dài lễ phục) -> không vẽ áo choàng (披风) lên. GIỐNG may-chu/do.js LE_PHUC.
export const LE_PHUC = new Set([43, 44, 45, 46]);

export class JxChar {
  static async load(base) {
    base = base.endsWith("/") ? base : base + "/";
    const r = await fetch(base + "jxchar.json");
    if (!r.ok) throw new Error(`Không đọc được ${base}jxchar.json (${r.status})`);
    const meta = await r.json();
    if (meta.format !== "vl-jxchar-pack" || meta.version !== 2) throw new Error("jxchar.json không đúng định dạng vl-jxchar-pack v2");
    return new JxChar(base, meta);
  }

  constructor(base, meta) {
    this.base = base;
    this.meta = meta;
    this.codePart = Object.fromEntries(Object.entries(meta.parts).map(([p, v]) => [v.code, p]));
    this.fxOf = {};
    for (const [fx, v] of Object.entries(meta.fx)) (this.fxOf[v.of] = this.fxOf[v.of] || []).push(fx);
    this._sheets = new Map(); // chỉ số file -> { canvas, rects }
    this._load = new Map();   // chỉ số file -> { p, failed }
    this._tint = new Map();   // "file|màu" -> tấm hiệu ứng đã nhuộm
  }

  // ---------- kiểu dáng ----------
  // req: { sex: "m" | "f", helm, armor, weapon, horse, mantle }; nhóm bỏ trống / 0 = không mang món đó (kiểu NONE).
  // Bộ phận không có hàng trong kho thì không vẽ (ghi vào notes).
  look(req) {
    const sex = req.sex === "f" ? "f" : "m", S = this.meta.sex[sex];
    const ids = { helm: req.helm || NONE.helm, armor: req.armor || NONE.armor, weapon: req.weapon || NONE.weapon, horse: req.horse || 0, mantle: req.mantle || 0 };
    if (LE_PHUC.has(ids.armor)) ids.mantle = 0; // lễ phục: không khoác áo choàng (anh 15/11)
    const parts = {}, notes = [];
    const add = (part, id) => {
      if (!id) return;
      if ((S.rows[part] || {})[id]) parts[part] = id;
      else if (((S.skipped || {})[part] || []).includes(id)) notes.push(`${part} #${id} (${S.names[part][id]}): client có hình nhưng không đóng gói — không món đồ nào (của client hay dữ liệu game) dùng kiểu này (đóng gói --all để có)`);
      // vai / tóc / vũ khí trái / hiệu ứng không có là bình thường (phần lớn kiểu dáng không có) -> không ghi chú
      else if ((S.names[part] || [])[id] && !/Fx$|^(shoulder|hair|lweapon)$/.test(part)) notes.push(`${part} #${id} (${S.names[part][id]}): client không có file nào`);
    };
    for (const [part, g] of Object.entries(GROUP_OF)) add(part, ids[g]);
    for (const [fx, v] of Object.entries(this.meta.fx)) add(fx, ids[GROUP_OF[v.of]]);
    // cưỡi ngựa khi có ít nhất 1 phần ngựa (nữ ngựa #18: client không có file phần giữa nhưng có phần trước / sau)
    const riding = !!(parts.horsef || parts.horsem || parts.horseb);
    return { sex, ids, parts, riding, notes, key: `${sex}|${JSON.stringify(parts)}` };
  }

  // ---------- động tác ----------
  logicalNames(sex = "m") { return this.meta.sex[sex].assoc.logical; }
  // Tên động tác thật (chỉ số trong meta.acts) cho 1 tên logic hoặc tên thật; -1 nếu vũ khí / trạng thái này không có động tác đó
  actIndex(look, want) {
    const A = this.meta.sex[look.sex].assoc;
    const j = A.logical.indexOf(LOGICAL_ALIAS[want] || want);
    if (j >= 0) {
      const tbl = look.riding ? A.ride : A.walk;
      const row = tbl[look.ids.weapon - 1] || tbl[0];
      return row[j];
    }
    return this.meta.acts.indexOf(want);
  }
  actName(look, want) { const ai = this.actIndex(look, want); return ai >= 0 ? this.meta.acts[ai] : null; }

  // ---------- file ----------
  file(fi) { return fi ? this.meta.files[fi - 1] : null; }
  fileUrl(fi) { return this.base + this.meta.prefix + this.meta.files[fi - 1][0] + ".spr"; }
  partFile(look, part, ai) { const id = look.parts[part]; return id ? ((this.meta.sex[look.sex].rows[part] || {})[id] || [])[ai] || 0 : 0; }
  shadowFile(look, ai) { return this.meta.sex[look.sex].shadow[ai] || 0; }
  // Bộ phận chuẩn quyết định số khung của động tác: thân, không có thì ngựa giữa, không có nữa thì bộ phận đầu tiên có file
  mainPart(look, ai) {
    for (const p of ["body", "horsem", ...Object.keys(this.meta.parts)]) if (this.partFile(look, p, ai)) return p;
    return null;
  }
  // Mọi file cần để vẽ 1 động tác
  filesFor(look, ai) {
    const out = new Set();
    for (const part of Object.keys(look.parts)) { const fi = this.partFile(look, part, ai); if (fi) out.add(fi); }
    const sh = this.shadowFile(look, ai); if (sh) out.add(sh);
    return [...out];
  }

  // ---------- tải ----------
  _sheet(fi) {
    const c = this._load.get(fi);
    if (c && (!c.failed || performance.now() - c.failed < RETRY_MS)) return c.p;
    const e = { p: null, failed: 0 };
    e.p = layTep(this.fileUrl(fi))
      .then((ab) => { const s = buildAtlas(decodeSpr(ab), this.file(fi)[3]); this._sheets.set(fi, s); return s; })
      .catch(() => { e.failed = performance.now(); return null; });
    this._load.set(fi, e);
    return e.p;
  }
  async ensure(look, want) {
    const ai = this.actIndex(look, want);
    if (ai < 0) return false;
    const r = await Promise.all(this.filesFor(look, ai).map((fi) => this._sheet(fi)));
    return r.every(Boolean);
  }

  // ---------- khung + thứ tự ----------
  // Số khung mỗi hướng của động tác (theo bộ phận chuẩn)
  frameCount(look, want) { const ai = this.actIndex(look, want), p = ai >= 0 && this.mainPart(look, ai); return p ? this.file(this.partFile(look, p, ai))[3] : 0; }
  loops(name) { return LOOP.test(name); }
  // Khung k (0..n-1) tại thời điểm t giây. ms = ms mỗi khung (mặc định 1 vòng engine); duration (giây / lượt) thì chia đều.
  frameAt(n, name, t, ms, duration) {
    if (!n) return 0;
    const step = duration > 0 ? (duration * 1000) / n : Math.max(ms || TICK_MS, 1);
    const j = Math.floor(((t || 0) * 1000) / step);
    return this.loops(name) ? ((j % n) + n) % n : Math.max(0, Math.min(j, n - 1));
  }
  // Hàng (hướng trong file) cho hướng 0..7
  row(F, dir) { const ud = F[2]; return ud >= 8 ? dir * (ud / 8) : Math.floor((dir * ud) / 8); }
  // Khung của 1 file khi bộ phận chuẩn ở khung k / n. Cùng số khung -> k. File 1 hướng / hiệu ứng có số khung khác -> vòng riêng.
  // Còn lại (vài file khác số khung thân, xem README) -> chia tỉ lệ.
  partFrame(F, dir, k, n, t, own) {
    const per = F[3];
    let kk;
    if (per === n) kk = k;
    else if (own) kk = t == null ? k % per : Math.floor((t * 1000) / TICK_MS) % per;
    else kk = Math.min(per - 1, Math.floor((k * per) / n));
    return this.row(F, dir) * per + kk;
  }
  // Thứ tự vẽ (mã bộ phận) cho động tác ai, hướng dir, khung trên cả file thân g
  order(sex, ai, dir, g) {
    const O = this.meta.sex[sex].order, a = O.act[ai];
    return (a && a.line && a.line[g]) || (a && a.dir && a.dir[dir]) || O.def[dir];
  }
  // Màu nhuộm hiệu ứng (cột ChangeColor, 0xRRGGBB) hoặc null (vẽ nguyên màu)
  fxColor(look, fx) { const c = ((this.meta.sex[look.sex].fxColor || {})[fx] || {})[look.parts[fx]]; return c == null ? null : c; }
  // Bản nhuộm màu của tấm hiệu ứng: màu điểm × màu nhuộm / 255 (giữ alpha). Nhớ đệm theo file + màu.
  _tinted(fi, S, color) {
    const key = fi + "|" + color;
    let c = this._tint.get(key);
    if (c) return c;
    const W = S.canvas.width, H = S.canvas.height;
    c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
    const g = c.getContext("2d");
    g.drawImage(S.canvas, 0, 0);
    g.globalCompositeOperation = "multiply";
    g.fillStyle = "#" + color.toString(16).padStart(6, "0");
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "destination-in";
    g.drawImage(S.canvas, 0, 0);
    this._tint.set(key, c);
    return c;
  }
  // Thứ tự trên lấy từ đâu: "line" | "dir" | "default"
  orderSource(sex, ai, dir, g) {
    const a = this.meta.sex[sex].order.act[ai];
    return a && a.line && a.line[g] ? "line" : a && a.dir && a.dir[dir] ? "dir" : "default";
  }

  // ---------- vẽ ----------
  // opt: { act, dir 0..7, t (giây) | frame, ms, duration, x, y (điểm chân), scale, alpha, shadow (mặc định true),
  //        orderFn(sex, ai, dir, g, k) -> [mã] (chỉ để trang xem so cách đọc khác; game không dùng) }
  // Trả về { act, frame, n, top, missing } hoặc null nếu chưa tải xong bộ phận chuẩn.
  draw(ctx, look, opt) {
    const ai = this.actIndex(look, opt.act);
    if (ai < 0) return null;
    const name = this.meta.acts[ai], main = this.mainPart(look, ai);
    if (!main) return null;
    const MF = this.file(this.partFile(look, main, ai)), n = MF[3];
    const dir = (((opt.dir | 0) % 8) + 8) % 8, sc = opt.scale || 1;
    const k = opt.frame != null ? Math.max(0, Math.min(n - 1, opt.frame | 0)) : this.frameAt(n, name, opt.t, opt.ms, opt.duration);
    const g = this.row(MF, dir) * n + k;
    const tOwn = opt.frame != null ? null : opt.t || 0;
    const pa = ctx.globalAlpha, ps = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    ctx.imageSmoothingEnabled = sc !== 1;
    let top = 0, pending = false, drewMain = false;
    const missing = [];
    // fx = null (bộ phận thường) | { color } (hiệu ứng: nhuộm màu nếu có rồi vẽ cộng sáng)
    const blit = (fi, own, fx) => {
      const F = this.file(fi), S = this._sheets.get(fi);
      if (!S) { pending = true; this._sheet(fi); return false; }
      const r = S.rects[this.partFrame(F, dir, k, n, tOwn, own)];
      if (!r) return false;
      const ax = F.length > 4 ? F[4] : this.meta.anchor[0], ay = F.length > 4 ? F[5] : this.meta.anchor[1];
      if (r.w && r.h) {
        // opt.loc: tô màu choáng / chậm / độc cả người (bản giữ sẵn — spr.js anhLoc; bộ phận hiệu ứng cộng sáng giữ nguyên)
        const src = fx && fx.color != null ? this._tinted(fi, S, fx.color) : opt.loc && !fx ? anhLoc(S, opt.loc) : S.canvas;
        if (fx) { ctx.save(); ctx.globalCompositeOperation = "lighter"; }
        ctx.drawImage(src, r.x, r.y, r.w, r.h, Math.round(opt.x + (r.ox - ax) * sc), Math.round(opt.y + (r.oy - ay) * sc), r.w * sc, r.h * sc);
        if (fx) ctx.restore();
      }
      return r;
    };
    if (opt.shadow !== false) { const sh = this.shadowFile(look, ai); if (sh) blit(sh, false); }
    for (const code of opt.orderFn ? opt.orderFn(look.sex, ai, dir, g, k) : this.order(look.sex, ai, dir, g)) {
      const part = this.codePart[code];
      if (!part || !look.parts[part]) continue;
      const fi = this.partFile(look, part, ai);
      if (!fi) { missing.push(part); continue; }
      const F = this.file(fi);
      const r = blit(fi, F[2] === 1 && F[3] !== n);
      if (r && (part === "body" || part === "head" || part === "horsem") && r.h) top = Math.min(top, (r.oy - this.meta.anchor[1]) * sc);
      if (r && part === main) drewMain = true;
      for (const fx of this.fxOf[part] || []) { const ff = this.partFile(look, fx, ai); if (ff) blit(ff, true, { color: this.fxColor(look, fx) }); }
    }
    ctx.globalAlpha = pa;
    ctx.imageSmoothingEnabled = ps;
    if (pending) this.ensure(look, opt.act);
    return drewMain ? { act: name, ai, frame: k, n, g, top, missing } : null;
  }
}
