// Công cụ thử trong game — máy chạy máy chủ (localhost / 127.0.0.1) hoặc tài khoản quản trị (main.js devOn — anh 26/10: thử từ máy khác
// qua Internet). Người chơi thường không mở được. Bật / tắt: phím ` hoặc Tùy chỉnh.
//   Nhân vật: cấp, kinh nghiệm (lên cấp theo bảng client assets/data/char.json exp), ngân lượng, hồi đầy, bất tử, 1 đòn chết,
//         đổi phái tự do + võ công lên tối đa / trả điểm + học / quên chiêu sách 90 / 120 / 150 (thử bảng Võ công).
//   Quái: sinh quái bất kỳ trong assets/data/monsters.json cạnh nhân vật (cấp, số lượng, trùm, lao vào đánh), giết / xóa hết,
//         dừng sinh quái.
//   Đồ: tìm trong kho đồ 3 server (assets/web/item, nạp khi mở thẻ Đồ; gói 1 server chỉ có đồ server đó), thêm vào túi (hero.bag — ô
//       hành trang làm ở M4),
//       mặc thử (đổi kiểu dáng trên người ngay). Tạo theo dòng… (anh 29/10): trang bị với ngũ hành + tối đa 6 dòng xanh tự chọn (thuộc tính,
//       cấp dòng, số) theo bảng client dong-xanh.json, đúng luật gieo dòng của máy chủ -> vào túi.
//   Bản đồ: đến bãi, dịch chuyển tới tọa độ (như ô tọa độ client) hoặc bấm đất, tốc độ game, lưới vật cản + đường đi.
//   Ủy thác (27/10): xem tốc độ giết máy chủ đo + giờ đã dùng hôm nay; thử ủy thác N giờ ngay (bảng tổng kết như lúc vào lại game).
//   Phong Lăng Độ (anh 27/10 "mở nhanh, ra quái…"): trạng thái chuyến chung / của nhân vật; lên thuyền ngay ở phút chọn (chuyến riêng, không
//         cần vé / giờ chẵn), tua chuyến, ra Thủy tặc / đầu lĩnh trên thuyền, sang bờ Bắc / về bờ Nam ngay, thêm vé (may-chu/phong-lang-do.js dev).
//   Dã Tẩu (anh 27/10): trạng thái chuỗi; xong ngay (khung thưởng), đổi loại nhiệm vụ, số nhiệm vụ hôm nay (thử thưởng 30 / 40), vị trí trong
//         chuỗi, +cơ hội hủy, bỏ phạt, xóa (may-chu/da-tau.js dev).
//   Thêm 27/10: không tốn nội lực, không hồi chiêu (World.dev — vocong.js skCost / castPay); độ bền đồ đang mặc: còn 1 / về 0 / đầy (ghi
//   lên máy chủ như túi đồ).
//   Lôi đài (anh 16/11 — THIET-KE-LOI-DAI.md mục 6): trận thử với bot Tống Kim — thể thức, bên, số bot 2 bên, cấp bot, giờ chuẩn bị / thi đấu; mở / hủy (api.ldThu).
// api = { P, world(), hero(), save(), gotoZone(zone), zones(), snapCam(), msg(text), applyLooks(), skillList(), refreshWin(), openSkills(),
//         uyThac(b) -> trạng thái, farmZones(), hoatDong(hd "pld" | "dt" | "st" | "va", b) -> trạng thái, pldLich(), laThuyen(), vaSong(), ldThu(b) -> kết quả máy chủ }
//   — main.js truyền vào.

import { ItemDB, SLOT_OF, GROUP_COL, wear, unwear, benMax } from "./itemdb.js";
import { capChieu, LUYEN, fixPoints } from "./rules.js";

export const DEV_ON = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

const MAX_LV = 200;
const SKILL_PTS = (h) => Math.max(0, (h.lvl || 1) - 1); // điểm kỹ năng = (cấp − 1) như client (rules.js SKILL_PTS_PER_LEVEL)
const LIST_MAX = 150;                    // số món hiện tối đa trong danh sách tìm
// bộ phận vẽ của từng nhóm đồ (như GROUP_OF của src/char/jx-char.js) — để báo đúng phần thiếu hình khi mặc thử
const PARTS = { helm: ["head", "hair"], armor: ["shoulder", "body", "lhand", "rhand"], weapon: ["lweapon", "rweapon"], horse: ["horsef", "horsem", "horseb"], mantle: ["mantle"] };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// tìm không dấu: "mong long" khớp "Mộng Long"
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
// loại món có dòng xanh: mã loại 0–10 của bảng dong-xanh.json (vũ khí cận chiến, ám khí, áo, nhẫn, dây chuyền, giày, đai, mũ, hộ uyển, ngọc bội, ngựa)
const DONG_LOAI = (x) => !!x && x.t >= 0 && x.t <= 10 && !!SLOT_OF[x.t];

export class DevTool {
  constructor(api) {
    this.api = api;
    this.el = null;
    this.tab = "char";
    this.pack = null;      // assets/web/item/items.json (src/game/itemdb.js, dùng chung với cửa sổ Đồ dùng)
    this.f = { q: "", sv: "hero", t: "", gr: "" };
    this.sel = null;       // khóa món đang xem
    this.mob = { q: "", id: null, lvl: "", n: 5, boss: false, aggro: false, series: "" };
    this.ut = { gio: 2, bai: null, boCap: true, tt: null }; // thẻ Ủy thác
    this.pl = { ben: 1, phut: 9, tt: null }; // thẻ Phong Lăng Độ
    this.st = { cap: 90, tt: null }; // thẻ Sát thủ
    this.dt = { tt: null }; // thẻ Dã Tẩu
    this.va = { cap: 1, dot: 1, tt: null }; // thẻ Vượt Ải (anh 28/10 "nhớ thêm vào dev tool")
    this.vd = { ai: 1, tt: null }; // thẻ Viêm Đế (anh 04/11 — may-chu/viem-de.js dev)
    this.sn = { mau: 20000, ngay: "" }; // Săn Nhím Béo Phì (anh 03/11 — may-chu/san-nhim.js) trong thẻ Boss TG
    this.btg = { mau: 2000000, tpl: "" }; // thẻ Boss TG — boss thế giới máu chung (anh 31/10 — may-chu/boss-tg.js)
    this.tkb = { bot: 20, tri: 3, cap: "", hs: "0.4", moi: false }; // thẻ Tống Kim — bãi thử bot + PK (anh 05/11 — may-chu/tong-kim.js, src/game/tongkim.js)
    this.ld = { che: 1, ben: 0, doiThu: 1, dongDoi: 0, cap: "", chuanBi: 10, thiDau: 180 }; // thẻ Lôi đài — trận thử với bot (anh 16/11 — may-chu/loi-dai.js thu, src/game/loidai.js)
    this.dn = { phut: 0.5, dua: 6, bot: 30, them: 20, dc: 978 }; // thẻ Đua ngựa — lượt thử (anh 16/11 — may-chu/dua-ngua.js thu, src/game/duangua.js)
    this.live = null;
  }

  get on() { return !!(this.el && this.el.classList.contains("on")); }
  toggle(force) {
    if (!this.el) this.build();
    const on = force ?? !this.on;
    this.el.classList.toggle("on", on);
    clearInterval(this.live);
    if (on) { this.render(); this.live = setInterval(() => this.refreshLive(), 400); }
  }

  build() {
    const el = (this.el = document.createElement("div"));
    el.className = "dv";
    el.innerHTML = `<div class="dv-head"><b>Công cụ thử</b>${[["char", "Nhân vật"], ["mob", "Quái"], ["item", "Đồ"], ["map", "Bản đồ"], ["ut", "Ủy thác"], ["pld", "Phong Lăng Độ"], ["dt", "Dã Tẩu"], ["st", "Sát thủ"], ["va", "Vượt Ải"], ["tk", "Tống Kim"], ["btg", "Boss TG"]]
      .map(([k, n]) => `<button class="dv-tab" data-tab="${k}">${n}</button>`).join("")}<button data-act="close" title="Đóng (phím \`)">✕</button></div><div class="dv-body"></div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab],[data-act]");
      if (!t) return;
      if (t.dataset.tab) { this.tab = t.dataset.tab; this.render(); return; }
      this.act(t.dataset.act, t);
    });
    el.addEventListener("input", (e) => this.onInput(e.target));
    el.addEventListener("change", (e) => this.onInput(e.target, true));
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") this.toggle(false); e.stopPropagation(); });
    // kéo bảng bằng thanh tiêu đề (màn nhỏ bảng che nhân vật)
    el.querySelector(".dv-head").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const mv = (ev) => { el.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - ox)) + "px"; el.style.top = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)) + "px"; };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
      e.preventDefault();
    });
  }

  // ---------- vẽ thẻ ----------
  render() {
    if (!this.el) return;
    this.el.querySelectorAll(".dv-tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === this.tab));
    const body = this.el.querySelector(".dv-body");
    body.innerHTML = this[{ char: "tabChar", mob: "tabMob", item: "tabItem", map: "tabMap", ut: "tabUt", pld: "tabPld", dt: "tabDt", st: "tabSt", va: "tabVa", vd: "tabVd", btg: "tabBtg", tk: "tabTk", ld: "tabLd", dn: "tabDn" }[this.tab]]();
    if (this.tab === "ut" && !this.ut.tt) this.utXem();
    if (this.tab === "pld" && !this.pl.tt) this.hd("pld", { viec: "xem" });
    if (this.tab === "dt" && !this.dt.tt) this.hd("dt", { viec: "xem" });
    if (this.tab === "st" && !this.st.tt) this.hd("st", { viec: "xem" });
    if (this.tab === "va" && !this.va.tt) this.hd("va", { viec: "xem" });
    if (this.tab === "vd" && !this.vd.tt) this.hd("vd", { viec: "xem" });
    if (this.tab === "mob") this.fillMobs();
    if (this.tab === "item") { if (!this.pack) this.loadPack(); else this.fillItems(); }
    this.refreshLive();
  }

  chk(k, label, on) { return `<label><input type="checkbox" data-flag="${k}"${on ? " checked" : ""}>${label}</label>`; }

  tabChar() {
    const w = this.api.world(), d = w.dev;
    return `<div class="r"><span class="k">Nhân vật</span><span data-live="who"></span></div>
      <div class="r"><span class="k">Kinh nghiệm</span><span data-live="exp"></span></div>
      <div class="r"><span class="k">Ngân lượng</span><span data-live="gold"></span></div>
      <div class="r"><span class="k">Cấp</span><input data-in="lvl" type="number" min="1" max="${MAX_LV}" style="width:64px" placeholder="1–${MAX_LV}">
        <button data-act="lvlSet">Đặt</button><button data-act="lvl" data-v="-1">−1</button><button data-act="lvl" data-v="1">+1</button><button data-act="lvl" data-v="10">+10</button></div>
      <div class="r"><span class="k">Thêm exp</span><button data-act="exp" data-v="0.1">10% cấp</button><button data-act="exp" data-v="0.5">50% cấp</button>
        <input data-in="exp" type="number" min="0" style="width:96px" placeholder="số exp"><button data-act="expN">Thêm</button></div>
      <div class="r"><span class="k">Thêm lượng</span><button data-act="gold" data-v="100000">10 vạn</button><button data-act="gold" data-v="10000000">1.000 vạn</button>
        <input data-in="gold" type="number" style="width:96px" placeholder="số lượng"><button data-act="goldN">Thêm</button></div>
      <div class="r"><span class="k">Máu</span><button data-act="heal">Hồi đầy</button>${this.chk("god", "Bất tử", d.god)}${this.chk("oneHit", "Một đòn chết", d.oneHit)}</div>
      <div class="r"><span class="k">Võ công</span>${this.chk("noMana", "Không tốn nội lực", d.noMana)}${this.chk("noCd", "Không hồi chiêu", d.noCd)}</div>
      <div class="r"><span class="k">Độ bền</span><button data-act="ben" data-v="1">Còn 1</button><button data-act="ben" data-v="0">Hỏng hết</button><button data-act="ben" data-v="-1">Đầy hết</button><span class="dv-note">đồ đang mặc</span></div>
      <div class="r"><span class="k">Môn phái</span><select data-in="fac">${this.facOptions()}</select><button data-act="facSet">Đổi</button></div>
      <div class="r"><span class="k">Võ công</span><button data-act="skMax">Tất cả lên tối đa</button><button data-act="skReset">Trả điểm</button><button data-act="skOpen">Mở bảng Võ công</button></div>
      <div class="r"><span class="k">Chiêu sách</span><button data-act="bookLearn">Học chiêu 90/120/150</button><button data-act="bookForget">Quên chiêu sách</button></div>
      <div class="dv-note">Đổi phái tự do để thử võ công (anh muốn 24/10): giữ nguyên hệ nhân vật, trả lại hết điểm kỹ năng đã cộng; chiêu hiện theo cấp (đổi cấp ở trên).</div>`;
  }
  facOptions() {
    const h = this.api.hero(), S = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
    return [`<option value=""${h.fac == null ? " selected" : ""}>Vô Môn Phái</option>`, ...this.api.P.factions.map((f) => `<option value="${f.id}"${h.fac === f.id ? " selected" : ""}>${esc(f.n)} (${S[f.series]})${f.nhap ? " — bản nháp" : ""}</option>`)].join("");
  }
  // đổi phái (công cụ thử): như NPC tiếp dẫn cho vào phái (phe theo phái, bậc bỏ), võ công cộng lại từ đầu
  setFaction(v) {
    const api = this.api, h = api.hero(), f = v === "" ? null : api.P.factions.find((x) => x.id === +v);
    h.fac = f ? f.id : null; h.facKey = f ? f.key : null;
    if (f) h.camp = f.camp; else delete h.camp;
    delete h.rank;
    h.skills = {}; h.books = []; h.skPts = SKILL_PTS(h); // chiêu sách của phái cũ bỏ luôn
    api.save(); api.refreshWin();
    api.msg(f ? `Vào ${f.n} (công cụ thử) · ${api.skillList().length} chiêu đang hiện ở cấp ${h.lvl} · ${h.skPts} điểm kỹ năng` : "Về Vô Môn Phái (công cụ thử)");
  }
  // chiêu 90 / 120 / 150 của phái đang chọn (kỹ năng 180 anh chốt 24/10 bỏ): học hết như đọc sách bí tịch (hero.books) / quên hết (trả
  // điểm đã cộng vào chúng)
  books(learn) {
    const api = this.api, h = api.hero(), f = h.fac == null ? null : api.P.factions.find((x) => x.id === h.fac);
    if (!f) return api.msg("Chưa có phái — chọn phái trước");
    if (!f.books) return api.msg("Gói võ công chưa có chiêu sách — chạy lại tools/build-skill-pack.mjs");
    const TS = [90, 120, 150], ids = TS.flatMap((t) => f.books[t] || []);
    if (learn) h.books = [...new Set([...(h.books || []), ...ids])];
    else { h.books = (h.books || []).filter((id) => !ids.includes(id)); for (const id of ids) delete (h.skills || {})[id]; }
    const spent = Object.values(h.skills || {}).reduce((t, x) => t + x, 0);
    h.skPts = Math.max(0, SKILL_PTS(h) - spent);
    api.save(); api.refreshWin();
    api.msg(learn ? `Học ${ids.length} chiêu sách của ${f.n}: ${TS.map((t) => `${t}: ${(f.books[t] || []).map((id) => api.P.skillDb[id] ? api.P.skillDb[id].n : id).join(", ")}`).join(" · ")}` : `Quên chiêu sách của ${f.n}`);
  }
  // mọi chiêu đang hiện lên cấp tối đa mà cấp nhân vật cho (rules.js capChieu — máy chủ cũng hạ về mức đó; bỏ qua điểm — điểm còn lại =
  // tổng − đã dùng, không âm)
  skillsMax(on) {
    const api = this.api, h = api.hero();
    // anh 17/11: "Tất cả lên tối đa" học luôn chiêu sách 90 / 120 / 150 của phái và đưa các chiêu luyện đó lên tối đa (cấp máy chủ giữ — api.luyenMax)
    const f = on && h.fac != null ? api.P.factions.find((x) => x.id === h.fac) : null, sach = f && f.books ? [90, 120, 150].flatMap((t) => f.books[t] || []) : [];
    if (sach.length) h.books = [...new Set([...(h.books || []), ...sach])];
    const list = api.skillList();
    if (!list.length) return api.msg(h.fac == null ? "Chưa có phái — chọn phái trước" : "Chưa có chiêu nào ở cấp này");
    const luyen = on ? Object.fromEntries(sach.filter((id) => LUYEN.has(+id) && api.P.skillDb[id]).map((id) => [id, api.P.skillDb[id].max || 20])) : {};
    if (Object.keys(luyen).length && api.luyenMax) { for (const [id, lv] of Object.entries(luyen)) (h.skills = h.skills || {})[id] = lv; api.luyenMax(luyen); }
    // chiêu luyện (sách 90 / 120 có cờ luyện — anh 29/10): cấp theo độ luyện do máy chủ giữ -> để nguyên
    const giu = Object.fromEntries(Object.entries(h.skills || {}).filter(([id]) => LUYEN.has(+id)));
    h.skills = { ...(on ? Object.fromEntries(list.filter((id) => !LUYEN.has(+id)).map((id) => [id, capChieu(h, api.P.skillDb[id], id)]).filter(([, lv]) => lv > 0)) : {}), ...giu };
    h.skPts = null; fixPoints(h);
    api.save(); api.refreshWin();
    api.msg(on ? `${list.length} chiêu lên cấp tối đa` : `Trả ${SKILL_PTS(h)} điểm kỹ năng`);
  }

  tabMob() {
    const w = this.api.world(), d = w.dev, M = this.mob;
    return `<div class="r"><input data-in="mobQ" placeholder="Tìm quái (tên / mã)…" value="${esc(M.q)}" style="flex:1"></div>
      <select data-in="mobId" size="8" class="dv-sel"></select>
      <div class="r" data-live="mobInfo"></div>
      <div class="r"><span class="k">Cấp</span><input data-in="mobLvl" type="number" min="1" max="200" style="width:64px" placeholder="theo bãi" value="${esc(M.lvl)}">
        <span class="k" style="min-width:0">Số con</span><input data-in="mobN" type="number" min="1" max="50" style="width:48px" value="${M.n}">
        <select data-in="mobSeries">${["Hệ ngẫu nhiên", "Kim", "Mộc", "Thủy", "Hỏa", "Thổ"].map((n, i) => `<option value="${i ? i - 1 : ""}"${String(M.series) === (i ? String(i - 1) : "") ? " selected" : ""}>${n}</option>`).join("")}</select>
        <label><input type="checkbox" data-in="mobBoss"${M.boss ? " checked" : ""}>Trùm</label><label><input type="checkbox" data-in="mobAggro"${M.aggro ? " checked" : ""}>Lao vào đánh</label></div>
      <div class="r"><button data-act="spawn">Sinh cạnh nhân vật</button><button data-act="bossZone">Gọi trùm bãi</button></div>
      <div class="r"><button data-act="killAll">Giết hết</button><button data-act="clearMobs">Xóa hết quái</button>${this.chk("noSpawn", "Dừng sinh quái", d.noSpawn)}</div>
      <div class="r"><span class="k">Trong bãi</span><span data-live="mobs"></span></div>`;
  }

  tabItem() {
    const F = this.f, h = this.api.hero();
    const types = this.pack ? Object.entries(this.pack.types).filter(([t]) => this.pack.items.some((x) => x.t === +t)) : [];
    const groups = this.pack ? [...new Set(Object.values(this.pack.groups))] : [];
    return `<div class="r"><input data-in="q" placeholder="Tìm đồ (không dấu cũng được)…" value="${esc(F.q)}" style="flex:1"></div>
      <div class="r"><select data-in="sv"><option value="hero">Server của nhân vật (S${h.server})</option>${this.api.P.only ? "" : '<option value="1">S1</option><option value="2">S2</option><option value="3">S3</option><option value="all">Mọi server</option>'}</select>
        <select data-in="t"><option value="">Mọi loại</option>${types.map(([t, n]) => `<option value="${t}">${esc(n)}</option>`).join("")}</select>
        <select data-in="gr"><option value="">Mọi nhóm</option>${groups.map((g) => `<option>${esc(g)}</option>`).join("")}</select></div>
      <div class="dv-note" data-live="itemCount">${this.pack ? "" : "Đang tải kho đồ…"}</div>
      <div class="dv-list" data-list="items"></div>
      <div class="dv-detail" data-detail></div>
      <div class="dv-dong" data-dong></div>
      <div class="r"><span class="k">Túi (thử)</span><span data-live="bag"></span><button data-act="looksReset">Bỏ đồ đang mặc</button></div>
      <div class="dv-list" data-list="bag" style="max-height:140px"></div>`;
  }

  // danh sách bản đồ có nhóm (anh 18/11 — main.js devZones: thành / thôn, bãi chính, bãi phụ, đảo); thành không ghi cấp
  zoneOpts(w) {
    const NHOM = { thôn: "Thành / thôn", thành: "Thành / thôn", chính: "Bãi luyện công", phụ: "Bãi phụ", đảo: "Đảo" }, by = new Map();
    for (const z of this.api.zones()) { const g = NHOM[z.kind] || "Khác"; if (!by.has(g)) by.set(g, []); by.get(g).push(z); }
    const o = (z) => `<option value="${z.id}"${z.id === w.zone.id ? " selected" : ""}>${esc(z.n)}${z.lo != null ? ` (cấp ${z.lo}–${z.hi})` : ""}</option>`;
    return [...by].map(([g, L]) => `<optgroup label="${esc(g)}">${L.map(o).join("")}</optgroup>`).join("");
  }
  tabMap() {
    const w = this.api.world(), d = w.dev, sp = this.api.P.dev.speed;
    return `<div class="r"><span class="k">Đến bãi</span><select data-in="zone">${this.zoneOpts(w)}</select><button data-act="zone">Đi</button></div>
      <div class="r"><span class="k">Tọa độ</span><span data-live="pos"></span></div>
      <div class="r"><span class="k">Dịch chuyển</span>X <input data-in="tx" type="number" style="width:56px"> Y <input data-in="ty" type="number" style="width:56px"><button data-act="tp">Đi</button></div>
      <div class="r"><span class="k"></span>${this.chk("tp", "Bấm đất = dịch chuyển", d.tp)}</div>
      <div class="r"><span class="k">Tốc độ game</span>${[1, 2, 5, 10].map((k) => `<button data-act="speed" data-v="${k}"${k === sp ? ' class="on"' : ""}>×${k}</button>`).join("")}</div>
      <div class="r"><span class="k">Soi</span>${this.chk("grid", "Lưới vật cản + đường đi", d.grid)}</div>`;
  }

  // ---------- ủy thác (máy chủ cày thay lúc vắng mặt — may-chu/do.js) ----------
  tabUt() {
    const U = this.ut, w = this.api.world(), zs = this.api.farmZones(), tt = U.tt;
    if (U.bai == null) U.bai = (tt && tt.baiId) ?? (zs.some((z) => z.id === w.zone.id) ? w.zone.id : zs[0] && zs[0].id);
    const st = tt ? `${tt.bai || "chưa có bãi"} · ${tt.toc ? fmt(tt.toc) + " quái / giờ (máy chủ đo)" : `chưa đo đủ 5 phút -> ${tt.mucDinh} quái / giờ`} × ${Math.round(tt.tiLe * 100)} % · ${tt.on ? "đang tự đánh" : "không tự đánh (thoát lúc này: không ủy thác)"}` : "đang hỏi máy chủ…";
    return `<div class="r"><span class="k">Trạng thái</span><span>${esc(st)}</span></div>
      <div class="r"><span class="k">Hôm nay</span><span>${tt ? `đã ủy thác ${(tt.dung / 3600).toFixed(2)} / ${tt.gioNgay} giờ` : ""}</span><button data-act="utXem">Hỏi lại</button></div>
      <div class="r"><span class="k">Bãi</span><select data-in="utBai">${zs.map((z) => `<option value="${z.id}"${z.id === U.bai ? " selected" : ""}>${esc(z.n)} (${z.lo}–${z.hi})</option>`).join("")}</select></div>
      <div class="r"><span class="k">Vắng</span><input data-in="utGio" type="number" min="0.05" max="48" step="0.5" style="width:64px" value="${U.gio}"> giờ
        <label><input type="checkbox" data-in="utBoCap"${U.boCap ? " checked" : ""}>Bỏ giới hạn hôm nay</label><button data-act="utThu">Thử ủy thác</button></div>
      <div class="dv-note">Như vừa thoát game N giờ rồi vào lại: máy chủ cày thay ở bãi chọn (đổi bãi thì tốc độ về mặc định tới khi đo lại), cộng kinh nghiệm / tiền / đồ thật vào nhân vật, hiện bảng tổng kết. Thật: chỉ khi lúc thoát đang tự đánh; vắng > 90 giây mới tính.</div>`;
  }
  utXem() { this.api.uyThac({ xem: 1 }).then((tt) => { this.ut.tt = tt; if (this.on && this.tab === "ut") this.render(); }).catch((e) => this.api.msg("Ủy thác: " + e.message)); }

  // ---------- Phong Lăng Độ (may-chu/phong-lang-do.js dev) ----------
  tabPld() {
    const L = this.pl, tt = L.tt, c = tt && tt.chung;
    const chung = c ? `chuyến ${c.gio} · phút ${c.t.toFixed(1)} — ${c.t < 10 ? "đang báo danh" : c.t < 39 ? "thuyền đang chạy" : "chờ chuyến giờ chẵn sau"}` : "đang hỏi máy chủ…";
    return `<div class="r"><span class="k">Chuyến chung</span><span>${esc(chung)}</span><button data-act="plXem">Hỏi lại</button></div>
      <div class="r"><span class="k">Nhân vật</span><span data-live="pldNv"></span></div>
      <div class="r"><span class="k">Trên thuyền</span><span data-live="pldT"></span></div>
      <div class="r"><span class="k">Lên thuyền</span>bến <select data-in="plBen">${[1, 2, 3].map((b) => `<option value="${b}"${b === L.ben ? " selected" : ""}>${b}</option>`).join("")}</select>
        ở phút <input data-in="plPhut" type="number" min="0" max="40" step="0.5" style="width:56px" value="${L.phut}"><button data-act="plLen">Lên ngay</button></div>
      <div class="r"><span class="k">Tua chuyến</span>${[[9.8, "thuyền chạy"], [24.8, "đầu lĩnh 1"], [29.8, "đầu lĩnh 2"], [34.8, "đầu lĩnh 3"], [38.8, "cập bờ"]].map(([m, n]) => `<button data-act="plTua" data-v="${m}" title="tới phút ${m}">${n}</button>`).join("")}</div>
      <div class="r"><span class="k">Ra quái</span><button data-act="plQuai" data-v="30">30 Thủy tặc</button><button data-act="plQuai" data-v="0">1 đầu lĩnh</button><span class="dv-note">trên thuyền</span></div>
      <div class="r"><span class="k">Đi ngay</span><button data-act="plBac">Sang bờ Bắc</button><button data-act="plNam">Về bờ Nam</button><button data-act="plVe">+1 Lệnh bài, +200 Mật đồ</button></div>
      <div class="dv-note">Lên ngay = chuyến riêng của nhân vật (không cần vé, không chờ giờ chẵn): phút &lt; 10 đang báo danh, phút 10 thuyền chạy, mỗi 5 phút (10–35) 1 đợt 30 Thủy tặc, phút 25 / 30 / 35 đầu lĩnh, phút 39 cập bờ Bắc. Bờ Bắc kinh nghiệm ×1,2, không dùng Thổ Địa Phù.</div>`;
  }
  // ---------- Dã Tẩu (may-chu/da-tau.js dev) ----------
  tabDt() {
    const tt = this.dt.tt;
    const st = !tt ? "đang hỏi máy chủ…" : !tt.buoc ? "chưa nhận chuỗi" : `nhiệm vụ thứ ${tt.tong + (tt.buoc === 1 ? 1 : 0)} · link ${tt.link} · chuỗi ${tt.chuoi} · vòng ${tt.vong} · trong chuỗi ${tt.lan}/19 · ${["", "đang làm", "xong — chờ chọn thưởng", "đã nhận thưởng"][tt.buoc]}`;
    return `<div class="r"><span class="k">Trạng thái</span><span>${esc(st)}</span><button data-act="dtXem">Hỏi lại</button></div>
      <div class="r"><span class="k">Nhiệm vụ</span><span>${esc(tt && tt.buoc === 1 ? `${tt.loai}: ${tt.nv || ""}` : "—")}</span></div>
      <div class="r"><span class="k">Hôm nay</span><span>${tt ? `${tt.soNgay}/${tt.gioiHan} nhiệm vụ · ${tt.huy} cơ hội hủy · phạt ${tt.phat} · ${tt.shxt} mảnh Sơn Hà Xã Tắc` : ""}</span></div>
      <div class="r"><span class="k">Làm nhanh</span><button data-act="dtXong">Xong ngay</button><button data-act="dtHuy">+1 cơ hội hủy</button><button data-act="dtPhat">Bỏ phạt</button><button data-act="dtLai">Xóa Dã Tẩu</button></div>
      <div class="r"><span class="k">Đổi loại</span>${["Mua", "Tìm", "Xem", "Địa đồ", "Kinh nghiệm", "Sơn Hà"].map((n, i) => `<button data-act="dtLoai" data-v="${i + 1}">${n}</button>`).join("")}</div>
      <div class="r"><span class="k">Hôm nay đã nhận</span><input data-in="dtSo" type="number" min="0" max="40" style="width:56px" placeholder="0–40"><button data-act="dtSo">Đặt</button><span class="dv-note">lượt nhận trong ngày (giới hạn ${tt ? tt.gioiHan : 40})</span></div>
      <div class="r"><span class="k">Mốc</span><span>${tt ? `xong hôm nay ${tt.xongNgay} · tổng đã xong ${tt.tongXong} · bậc ${tt.bac} (link khó ${tt.lk || "—"}) · mốc tổng kế ${tt.mocTong || "—"} · quà mốc nhiệm vụ kế (100 … 8000) ${tt.mocChuoi || "—"}` : ""}</span></div>
      <div class="r"><span class="k">Xong hôm nay</span><input data-in="dtXN" type="number" min="0" max="40" style="width:56px" placeholder="0–40"><button data-act="dtXN">Đặt</button><button data-act="dtXN" data-v="29">29</button><button data-act="dtXN" data-v="39">39</button><span class="dv-note">thử mốc ngày 30 / 40</span></div>
      <div class="r"><span class="k">Tổng đã xong</span><input data-in="dtTong" type="number" min="0" style="width:72px" placeholder="0–10000"><button data-act="dtTong">Đặt</button><button data-act="dtTong" data-v="499">499</button><button data-act="dtTong" data-v="999">999</button><button data-act="dtTong" data-v="4999">4999</button><button data-act="dtTong" data-v="9999">9999</button><span class="dv-note">thử mốc tổng, bậc khó</span></div>
      <div class="r"><span class="k">Trong chuỗi</span><input data-in="dtLan" type="number" min="0" max="19" style="width:56px" placeholder="0–19"><button data-act="dtLan">Đặt</button><span class="dv-note">19 = nhiệm vụ cuối chuỗi (quà mốc)</span></div>
      <div class="r"><span class="k">Online hôm nay</span>${[[3590, "59 phút 50 giây"], [7190, "1 giờ 59 phút"], [10790, "2 giờ 59 phút"], [0, "Đặt lại"]].map(([s, n]) => `<button data-act="onl" data-v="${s}">${n}</button>`).join("")}<span class="dv-note">thử Online nhận thưởng (may-chu/online.js): vài giây sau qua mốc 1 / 2 / 3 giờ — Nhận thưởng → Online nhận thưởng; mốc 3 giờ = Huyền Thiên Chùy mở Bảo rương thần bí (rương: Dã Tẩu mỗi 10 nhiệm vụ — Trong chuỗi 9 rồi Xong ngay)</span></div>
      <div class="r"><span class="k">Quà mốc tổng</span>${[100, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000].map((n) => `<button data-act="dtMoc" data-v="${n}">${n}</button>`).join("")}<span class="dv-note">nhiệm vụ đang làm thành thứ N (mỗi mốc 1 gói) — Xong ngay rồi chọn thưởng</span></div>
      <div class="r"><span class="k">Rương / chùy</span><button data-act="dtRuong">+1 Bảo rương thần bí</button><button data-act="dtChuy">+1 Huyền Thiên Chùy</button><button data-act="dtLenh">+1 Lệnh bài làm NV Dã Tẩu</button><button data-act="dtShxt">+100 mảnh Sơn Hà</button></div>
      <div class="r"><span class="k">Phúc duyên</span>${[[7190, "tích lũy 1 giờ 59 phút"], [21600, "tích lũy 6 giờ"]].map(([s, n]) => `<button data-act="pdTich" data-v="${s}">${n}</button>`).join("")}<button data-act="pdDiem" data-v="2000">+2000 điểm</button><button data-act="pdLai">Xóa phúc duyên</button><span class="dv-note">Nhận thưởng → Phúc duyên: đổi điểm (≥ 2 giờ; 6 giờ = 5 điểm), cửa hàng Liễu Ất</span></div>`;
  }
  // ---------- Boss Sát thủ (may-chu/sat-thu.js dev) ----------
  tabSt() {
    const L = this.st, tt = L.tt, S = tt && tt.st, b = tt && tt.boss, bac = (this.api.P.satThu || { bac: [] }).bac;
    return `<div class="r"><span class="k">Nhiệm vụ</span><span>${esc(!tt ? "đang hỏi máy chủ…" : b ? `${b.ten} (số ${S.nv}, cấp ${b.lv}, hệ ${["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"][S.he]}) — ${b.tenBai} ${b.X}/${b.Y}` : "chưa nhận")}</span><button data-act="stXem">Hỏi lại</button></div>
      <div class="r"><span class="k">Hôm nay</span><span>${S ? `đã hạ ${S.dem}/${S.toiDa || 8} boss` : ""}</span><button data-act="stLai">Đếm lại từ 0</button><button data-act="stHuy">Bỏ nhiệm vụ</button></div>
      <div class="r"><span class="k">Bậc</span><select data-in="stCap">${bac.map((x) => `<option value="${x.cap}"${x.cap === L.cap ? " selected" : ""}>cấp ${x.cap} (boss ${x.lv})</option>`).join("")}</select>
        <button data-act="stNhan">Nhận boss ngẫu nhiên</button><button data-act="stDi">Tới chỗ boss</button><button data-act="stLenh">+5 Sát Thủ lệnh</button></div>
      <div class="r"><span class="k">Boss trong bãi</span><span data-live="stBoss"></span></div>
      <div class="dv-note">Nhận = bỏ qua điều kiện cấp / số lần trong ngày. Có nhiệm vụ thì vào bãi của boss là boss đứng ở chỗ của nó (tên cam); hạ xong: 1 Sát Thủ lệnh + kinh nghiệm bậc 60–90 + 8 lượt đồ rơi. 5 lệnh cùng cấp hợp thành 1 Sát thủ giản ở Nhiếp Thí Trần (Ba Lăng).</div>`;
  }
  // ---------- Boss thế giới (may-chu/boss-tg.js — anh 31/10): gọi ở chỗ mình đứng để thử máu chung; trạng thái = bảng trên giữa màn ----------
  tabBtg() {
    const L = this.btg, ds = (this.api.bossDs && this.api.bossDs()) || [];
    return `<div class="r"><span class="k">Đang có</span><span data-live="btgT"></span></div>
      <div class="r"><span class="k">Boss</span><select data-in="btgTpl"><option value="">Ngẫu nhiên</option>${ds.map(([t, n]) => `<option value="${t}"${String(t) === String(L.tpl) ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>
        máu <input data-in="btgMau" type="number" min="1" style="width:96px" value="${L.mau}"></div>
      <div class="r"><span class="k">Gọi</span><button data-act="btgDay">Ở chỗ mình đứng</button><button data-act="btgLich">Chỗ theo lịch (Sa Mạc 1)</button><button data-act="btgHuy">Gọi về (không thưởng)</button></div>
      <div class="r"><span class="k">Săn nhím</span><span data-live="snT"></span></div>
      <div class="r"><span class="k">Mở đợt</span>máu <input data-in="snMau" type="number" min="1" style="width:80px" value="${this.sn.mau}"> tối đa / ngày <input data-in="snNgay" type="number" min="1" style="width:44px" value="${this.sn.ngay}" placeholder="10">
        <button data-act="snQuanh">3 con quanh mình</button><button data-act="snLich">Như lịch</button><button data-act="snHuy">Hủy đợt</button></div>
      <div class="dv-note">Săn Nhím Béo Phì: 3 con quanh mình = thử ngay ở chỗ đang đứng (bãi nào cũng được); như lịch = 5 con Ba Lăng huyện + 5 con Biện Kinh, chỗ ngẫu nhiên ngoài khu an toàn. Ô tối đa / ngày bỏ trống = theo cau-hinh.json sanNhim.ngay.</div>
      <div class="r"><span class="k">Phong Hỏa</span><span data-live="phT"></span></div>
      <div class="r"><span class="k">Mở trận</span><button data-act="phNgan">Thử ngắn (báo danh 1′, đánh 10′)</button><button data-act="phLich">Như lịch (5′ + 20′)</button><button data-act="phThang">Kết thúc: thắng</button><button data-act="phThua">Kết thúc: thua</button><button data-act="phHuy">Hủy trận</button><button data-act="phVao">Vào trận</button></div>
      <div class="dv-note">Phong Hỏa Liên Thành (may-chu/phong-hoa.js): mở trận ngay — người chơi vào bằng Vệ binh thành môn Biện Kinh (cấp ≥ cau-hinh phongHoa.cap, phí phongHoa.phi). Thật: hằng ngày phongHoa.gio. Kết thúc thắng: người trong trận đủ kinh nghiệm thì nhận thưởng thắng trận. Vào trận = như qua Vệ binh thành môn (đủ cấp, nộp phí) — vào thẳng đại doanh.</div>
      <div class="dv-note">Máu chung ở máy chủ: mở 2 máy / 2 tài khoản cùng đánh để thử. Thật: theo giờ cau-hinh.json bossTheGioi.gio, máu bossTheGioi.mau. Thưởng theo % sát thương vào nhịp sau khi boss chết.</div>`;
  }
  // ---------- Tống Kim bãi thử (anh 05/11 — đợt 1: bot + PK, chỉ quản trị) ----------
  tabTk() {
    const T = this.tkb;
    return `<div class="r"><span class="k">Trạng thái</span><span data-live="tkT"></span></div>
      <div class="r"><span class="k">Mở bãi thử</span>bot mỗi phe <input data-in="tkBot" type="number" min="1" max="60" style="width:50px" value="${T.bot}"> mức thông minh <input data-in="tkTri" type="number" min="1" max="3" style="width:40px" value="${T.tri}">
        cấp bot <input data-in="tkCap" type="number" min="0" max="200" style="width:56px" value="${T.cap}" placeholder="tự động"><label title="Bỏ trống: chỉ tài khoản quản trị vào bãi thử. Đánh dấu: ai ở bãi đó cũng vào trận (thử PK với tài khoản thường)"><input data-in="tkMoi" type="checkbox"${T.moi ? " checked" : ""}> cho cả người thường vào</label>
        <button data-act="tkMo">Mở ở chỗ mình đứng</button><button data-act="tkHuy">Đóng</button></div>
      <div class="r"><span class="k">Đang mở</span><button data-act="tkTong">Vào phe Tống</button><button data-act="tkKim">Vào phe Kim</button><button data-act="tkSoBot">Đổi số bot</button><button data-act="tkDoiTri">Đổi mức thông minh</button></div>
      <div class="r"><span class="k">Sát thương PK</span>hệ số <input data-in="tkHs" type="number" min="0.01" max="2" step="0.01" style="width:56px" value="${T.hs}"><button data-act="tkDoiHs">Đổi</button><span class="dv-note" style="margin:0 0 0 6px">mọi đòn người / bot trong trận × hệ số 0,01–2 (client 1; 0,4: mỗi mạng đánh vài giây)</span></div>
      <div class="dv-note">Bãi thử Tống Kim: mở ở bãi đang đứng (nên chọn bãi vắng) — doanh Tống bên trái, doanh Kim bên phải chỗ bạn đứng, mỗi doanh 1 vùng an toàn. Quái thường của bãi bỏ, ai vào bãi cũng vào trận (chia phe lệch tối đa 1 người). Bot: cấp = cấp cao nhất máy chủ ± 10 (ô cấp bot điền thì lấy cấp đó ± 10), mức thông minh 1–3. Máy chủ trận (chạy não bot) là máy tính đang mở tab; bảng điểm + khung hình / giây hiện dưới bản đồ nhỏ.</div>
      <div class="r"><span class="k">Trận thật</span><button data-act="tkTranMo">Mở trận thử ngay</button><button data-act="tkTranKet">Kết thúc trận</button><button data-act="tkTranHuy">Hủy trận</button><button data-act="tkTranVao">Vào trận (như Mộ binh quan)</button></div>
      <div class="r"><span class="k">Đo giật</span>${[["bot", "Ẩn bot"], ["quan", "Ẩn quân"], ["vat", "Ẩn nhà / cây"], ["fx", "Ẩn hiệu ứng"], ["ten", "Ẩn tên / máu"], ["nen", "Ẩn nền"]].map(([k, t]) => `<button data-act="tkAn" data-k="${k}" class="${(this.api.world() && (this.api.world().anVe || {})[k]) ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="dv-note">Đo giật (anh 06/11 — chỉ máy mình, chỉ để đo): bấm ẩn tạm từng loại hình, xem dòng FPS góc trái — loại nào ẩn đi mà FPS vọt lên là loại làm card đồ họa nặng. Bấm lại để hiện.</div>
      <div class="dv-note">Trận thật ở chiến trường 380 Xung phong (đợt 2 — may-chu/tong-kim.js): mở ngay bản thử ngắn — báo danh 1′, đánh 6′, Nguyên soái phe ít điểm phút 2, phe kia phút 3 (đóng bãi thử nếu đang mở). Báo danh / vào trận: Mộ binh quan ở Biện Kinh (cấp ≥ cau-hinh tongKim.cap, phí tongKim.phi). Kết thúc: tính thắng thua, phát thưởng, raSau giây sau tự về Biện Kinh. Thật: 4 trận / ngày theo tongKim.gio (F10 → Lịch hoạt động).</div>`;
  }
  // ---------- Lôi đài — trận thử với bot (anh 16/11 "dev tool cập nhật Công Bình Tử để anh test với bot" — THIET-KE-LOI-DAI.md mục 6, chỉ quản trị) ----------
  tabLd() {
    const L = this.ld, so = (k, v, min, max, w, ph) => `<input data-in="${k}" type="number" min="${min}" max="${max}" style="width:${w}px" value="${esc(v)}"${ph ? ` placeholder="${ph}"` : ""}>`;
    return `<div class="r"><span class="k">Thể thức</span><select data-in="ldChe">${[1, 2, 3, 4, 5, 6, 7, 8, 16].map((n) => `<option value="${n}"${n === L.che ? " selected" : ""}>${n} vs ${n}</option>`).join("")}</select>
        bạn ở bên <select data-in="ldBen"><option value="0"${L.ben ? "" : " selected"}>Giáp</option><option value="1"${L.ben ? " selected" : ""}>Ất</option></select></div>
      <div class="r"><span class="k">Bot</span>đối thủ ${so("ldDoiThu", L.doiThu, 1, L.che, 46)} đồng đội ${so("ldDongDoi", L.dongDoi, 0, L.che - 1, 46)} cấp bot ${so("ldCap", L.cap, 1, 200, 64, "cấp mình")}</div>
      <div class="r"><span class="k">Thời gian</span>chuẩn bị ${so("ldChuanBi", L.chuanBi, 5, 300, 56)} giây · thi đấu ${so("ldThiDau", L.thiDau, 30, 1800, 64)} giây</div>
      <div class="r"><span class="k">Trận thử</span><button data-act="ldMo">Mở trận thử</button><button data-act="ldHuy">Hủy trận thử</button></div>
      <div class="dv-note">Mở ở sân trống, vào thẳng bên đã chọn — miễn phí, không báo kênh hệ thống. Bot là bot Tống Kim chạy trên máy này (não + máu bot): người khác vào xem không thấy bot; bạn bị hạ thì bot vẫn đánh tiếp tới khi một bên hết người.</div>`;
  }
  // ---------- Đua ngựa — lượt thử (anh 16/11 "nhớ thêm vào công cụ thử" — may-chu/dua-ngua.js thu, chỉ quản trị) ----------
  tabDn() {
    const L = this.dn, so = (k, v, min, max, w, buoc) => `<input data-in="${k}" type="number" min="${min}" max="${max}"${buoc ? ` step="${buoc}"` : ""} style="width:${w}px" value="${esc(v)}">`;
    const DC = [[978, "Gia Tốc hoàn"], [990, "Lôi Tốc hoàn"], [979, "Băng Sương Hiệu giác"], [980, "Bạo Lôi Hiệu giác"], [981, "Huyễn Huân Hãm Tĩnh"], [982, "Huyền Thiên Hãm Tĩnh"], [983, "Sương Giáng Hãm Tĩnh"], [984, "Băng Phong Hãm Tĩnh"]];
    return `<div class="r"><span class="k">Lượt thử</span>báo danh ${so("dnPhut", L.phut, 0.25, 10, 54, 0.25)} phút · đua ${so("dnDua", L.dua, 1, 30, 46)} phút · bot ${so("dnBot", L.bot, 0, 120, 52)}<button data-act="dnMo">Mở lượt thử</button></div>
      <div class="r"><span class="k">Điều khiển</span><button data-act="dnBatDau">Xuất phát ngay</button><button data-act="dnHop">Thả hộp ngay</button><button data-act="dnBot">Thêm bot</button>${so("dnThem", L.them, 1, 120, 46)}<button data-act="dnKet">Hủy lượt</button><button data-act="dnXoa">Xóa lượt</button></div>
      <div class="r"><span class="k">Đạo cụ</span><select data-in="dnDc">${DC.map(([id, n]) => `<option value="${id}"${id === L.dc ? " selected" : ""}>${n}</option>`).join("")}</select><button data-act="dnDoCu">Cho mình 1 cái</button></div>
      <div class="r"><span class="k">Tới mốc</span>${[1, 2, 3, 4, 5].map((k) => `<button data-act="dnDi" data-k="${k}">Mốc ${k}</button>`).join("")}<button data-act="dnDi" data-k="dich">Đích</button></div>
      <div class="r"><span class="k">Trạng thái</span><span data-live="dnT"></span></div>
      <div class="dv-note">Lượt thử: không báo kênh hệ thống, không có thưởng, không xét chống gian lận; mở xong tự báo danh mình và vào thẳng vạch xuất phát (người khác báo danh được ở Truy Phong Sứ Giả Ba Lăng nếu đủ cấp). Bot do máy chủ chạy dọc đường ngắn nhất (82–100 % tốc đua), nhặt hộp, dùng đạo cụ trúng cả người thật, về đích có hạng — chỉ hiện trên thanh đua. Tới mốc: chỉ lượt thử. Tới giờ đua thật thì lượt thử tự hủy.</div>`;
  }
  // ---------- Vượt Ải (may-chu/vuot-ai.js dev) ----------
  tabVa() {
    const L = this.va, V = L.tt && L.tt.va, cap = (this.api.P.vuotAi || { cap: [] }).cap, van = (n) => (n / 10000).toLocaleString("vi-VN") + " vạn";
    return `<div class="r"><span class="k">Hôm nay</span><span>${esc(!V ? "đang hỏi máy chủ…" : `đã đi ${V.luot}/${V.toiDa} lần${V.phi ? ` · lần kế: ${V.phi.gian} Sát Thủ Giản + ${van(V.phi.tien)}` : ""}`)}</span><button data-act="vaXem">Hỏi lại</button><button data-act="vaLai">Đặt lại số lần</button></div>
      <div class="r"><span class="k">Trong ải</span><span data-live="vaT"></span></div>
      <div class="r"><span class="k">Vào thử</span><select data-in="vaCap">${cap.map((c) => `<option value="${c.cap}"${c.cap === L.cap ? " selected" : ""}>${c.cap === 2 ? "Cao cấp" : "Sơ cấp"} (cấp ${c.lo}–${c.hi})</option>`).join("")}</select>
        từ đám <input data-in="vaDot" type="number" min="1" max="28" style="width:52px" value="${L.dot}"><button data-act="vaVao">Vào ngay</button></div>
      <div class="r"><span class="k">Đang đánh</span><button data-act="vaCho">Bỏ chờ</button><button data-act="vaNhay">Nhảy tới đám trên</button><button data-act="vaXong">Hạ hết đám này</button><button data-act="vaRa">Rời ải</button></div>
      <div class="r"><span class="k">Phí / thưởng</span><button data-act="vaGian">+16 Sát Thủ Giản + đủ tiền 4 lần</button><button data-act="vaHop">+5 Hộp lễ vật vượt ải</button></div>
      <div class="dv-note">Vào ngay = không nộp phí, không tính lần (bậc chọn, không xét cấp) — vẫn chờ 1 phút chuẩn bị (Bỏ chờ = ra quái ngay); hết mỗi đám nghỉ 5 giây. Thật: Nhiếp Thí Trần (Ba Lăng) → Thử luyện sát thủ → Tham gia khiêu chiến; lần 1–4 trong ngày nộp 1 / 2 / 4 / 8 Sát Thủ Giản + 50 / 100 / 200 / 400 vạn (cau-hinh.json vuotAi). 28 đám, 30 phút; hạ hết đám = máy chủ cộng thưởng đám (kinh nghiệm + rơi đồ) rồi ra đám sau; xong ải thêm kinh nghiệm theo phút.</div>`;
  }
  // ---------- Viêm Đế (may-chu/viem-de.js dev — anh 04/11 "thêm tab thử như các hoạt động khác") ----------
  tabVd() {
    const L = this.vd, V = L.tt && L.tt.vd, D = V && V.dang;
    return `<div class="r"><span class="k">Hôm nay</span><span>${esc(!V ? "đang hỏi máy chủ…" : `đã đi ${V.luot}/${V.toiDa} lần · Hình nhân ${V.hn}`)}</span><button data-act="vdXem">Hỏi lại</button><button data-act="vdLai">Đặt lại số lần</button></div>
      <div class="r"><span class="k">Trong bảo tàng</span><span>${esc(!D ? "không" : `phòng ${D.phong}${D.ket ? " (đã kết thúc)" : ""}${D.lenh ? " · kinh nghiệm × 2" : ""}`)}</span></div>
      <div class="r"><span class="k">Vào thử</span>từ ải <input data-in="vdAi" type="number" min="1" max="10" style="width:52px" value="${L.ai}"><button data-act="vdVao">Vào ngay (bỏ chờ)</button><button data-act="vdVaoCho">Vào + chờ 60 giây</button></div>
      <div class="r"><span class="k">Đang đánh</span><button data-act="vdCho">Bỏ chờ</button><button data-act="vdNhay">Nhảy tới ải trên</button><button data-act="vdXong">Hạ hết đợt này</button><button data-act="vdNo">Tới 4 boss Nộ</button><button data-act="vdCuoi">Tới Lương Mi Nhi</button><button data-act="vdGio">Còn 10 giây</button><button data-act="vdRa">Rời lượt</button></div>
      <div class="r"><span class="k">Vật phẩm</span><button data-act="vdVe">+5 Thiếp + Lệnh + 2 loại chìa + 5 Bí Bảo + 3 Hình nhân</button></div>
      <div class="dv-note">Vào ngay = không nộp vé, không tính lần, không xét cấp / phái; có tổ đội thì kéo cả đội. Thật: đội trưởng nói chuyện Bình Bình cô nương (Biện Kinh). Mỗi ải: đệ tử rồi boss; ải 3 / 6 thêm boss Nộ; 10 ải -> 4 boss Nộ -> Lương Mi Nhi (cau-hinh.json viemDe).</div>`;
  }
  // gọi máy chủ (tài khoản quản trị) rồi vẽ lại thẻ với trạng thái mới
  hd(hd, b) {
    const the = { dt: this.dt, st: this.st, va: this.va, vd: this.vd }[hd] || this.pl, ten = { dt: "Dã Tẩu", st: "Sát thủ", va: "Vượt Ải", vd: "Viêm Đế" }[hd] || "Phong Lăng Độ";
    return this.api.hoatDong(hd, b).then((tt) => { the.tt = tt; if (this.on && this.tab === (hd === "dt" || hd === "st" || hd === "va" || hd === "vd" ? hd : "pld")) this.render(); })
      .catch((e) => this.api.msg(ten + " (thử): " + e.message));
  }

  // chữ thay đổi liên tục (đọc lại mỗi 0,4 giây khi bảng mở)
  refreshLive() {
    if (!this.on) return;
    const w = this.api.world(), h = this.api.hero(), P = this.api.P;
    if (!w || !h) return;
    const set = (k, v) => { const e = this.el.querySelector(`[data-live="${k}"]`); if (e && e.textContent !== v) e.textContent = v; };
    const need = P.chr.exp[h.lvl - 1] || 0;
    set("who", `${h.name} · cấp ${h.lvl} · máu ${fmt(w.player.hp)}/${fmt(w.player.hpMax)}`);
    set("exp", `${fmt(h.exp || 0)} / ${fmt(need)}`);
    set("gold", fmt(h.gold || 0));
    set("bag", `${(h.bag || []).length} món`);
    const alive = w.mobs.filter((m) => m.alive);
    set("mobs", `${alive.length} quái sống (${alive.filter((m) => m.boss).length} trùm) · đã giết ${w.kills}`);
    // Phong Lăng Độ: trạng thái máy chủ gửi kèm nhân vật (hero.pld — cập nhật cả khi đi thuyền thật / cập bờ / trọng thương)
    const PL = h.pld, L = this.api.pldLich && this.api.pldLich();
    set("pldNv", !PL ? "không ở thuyền / bờ Bắc" : PL.bac ? `ở bờ Bắc (bến ${PL.ben})` : `trên thuyền bến ${PL.ben} · đã giết ${PL.giet | 0} Thủy tặc · đầu lĩnh ${PL.dl | 0}/3${PL.thu ? " · chuyến thử" : ""}`);
    set("pldT", this.api.laThuyen && this.api.laThuyen() && L ? `phút ${((Date.now() + L.lech - L.chuyen) / 60000).toFixed(1)} (chuyến của nhân vật)` : "—");
    // Boss Sát thủ trong bãi: máu, cách bao xa
    const B = w.mobs.find((m) => m.sat);
    set("stBoss", B ? `${B.name} · ${B.alive ? `máu ${fmt(B.hp)}/${fmt(B.hpMax)} · cách ${Math.round(Math.hypot(B.x - w.player.x, (B.y - w.player.y) * 2))}` : "đã hạ"}` : "không có");
    // Vượt Ải: trạng thái máy chủ gửi kèm nhân vật (hero.va) + quái ải còn sống ở máy
    const VD = h.va && h.va.dang, song = this.api.vaSong && this.api.vaSong();
    const BT = this.api.bossTt && this.api.bossTt();
    const SN = this.api.nhimTt && this.api.nhimTt();
    set("snT", !SN ? "không có đợt" : `${SN.ket ? "vừa hết" : `còn ${SN.con}/${SN.so} con`} · hôm nay mình bắt ${SN.dem}/${SN.toiDa}${SN.ket ? "" : ` · ${SN.ds.filter((r) => !r[8]).map((r) => `${r[1] === w.zone.id ? "*" : ""}${r[1]}: ${fmt(r[5])}`).join(", ")}`}`);
    const PHL = this.api.phTt && this.api.phTt();
    set("phT", !PHL || !PHL.pha ? `chưa mở · lịch ${(PHL && PHL.gio) || "19:00"}` : PHL.pha === "xong" ? `vừa xong (${PHL.ket || ""})` : `${PHL.pha === "bd" ? "báo danh" : "đang đánh"} · ${PHL.mo ? "còn vào được" : "đã đóng báo danh"}`);
    set("btgT", !BT ? "không có" : `${BT.ten} · ${BT.tenBai} (${BT.X}/${BT.Y}) · máu ${fmt(BT.mau)}/${fmt(BT.mauMax)} · ${BT.so || 0} người đánh${BT.ket ? " · " + (BT.ket === "chet" ? "đã chết" : "đã rời") : ""}`);
    set("vaT", !VD ? "không ở trong ải" : `${VD.cap === 2 ? "cao cấp" : "sơ cấp"} · đám ${VD.dot}/${VD.tong} · máy chủ đã nhận ${(VD.giet || []).reduce((a, x) => a + (x | 0), 0)} con của đám${song != null ? ` · ${song} con sống` : ""}${VD.ket ? " · ĐÃ XONG" : ""}`);
    if (this.api.tkTt) set("tkT", this.api.tkTt());
    // đua ngựa: lượt đang có (trạng thái mới nhất của duangua.js)
    if (this.api.dnTt) { const S = this.api.dnTt(), me = S && S.toi; set("dnT", !S ? "không có lượt (hoặc chưa có tên trong lượt)" : `${S.thu ? "lượt thử" : "lượt thật"} · ${S.tt === "bd" ? "báo danh" : S.tt === "dua" ? "đang đua" : "kết thúc"} · ${S.n} người · về đích ${S.ve}/${S.soVe}${me ? ` · mình ${Math.round((me.p || 0) * 100)}% mốc ${me.moc}/5 hạng ${me.hang}${me.tui && me.tui.length ? ` · ${me.tui.length} đạo cụ` : ""}` : ""}`); }
    const mm = P.hud.mmMap;
    if (mm) { const [X, Y] = mm.toClient(w.player.x, w.player.y); set("pos", `${X}/${Y} — ${w.zone.n}`); }
  }

  // ---------- nhập ----------
  onInput(t, changed) {
    const k = t.dataset.in, F = this.f, M = this.mob;
    // "Một đòn chết" (anh 18/11 — boss / quái máu chung không chết vì khóa an toàn của trang đang đóng, vd sau khi máy chủ khởi động lại): máy chủ chỉ bỏ hạn mức sát
    // thương khi trang đã mở khóa an toàn (bao-mat.js qtMo) -> bật thì hỏi mật khẩu cấp 2 trước (đã mở: bật ngay)
    if (t.dataset.flag === "oneHit" && t.checked && changed && this.api.khoa) { const el = t; el.checked = false; this.api.khoa("Một đòn chết (boss, quái máu chung) cần mở khóa an toàn").then((ok) => { this.api.world().dev.oneHit = !!ok; el.checked = !!ok; this.api.msg(ok ? "Một đòn chết: Bật" : "Một đòn chết: chưa mở khóa an toàn — chưa bật"); }); return; }
    if (t.dataset.flag) { if (!changed) return; this.api.world().dev[t.dataset.flag] = t.checked; this.api.msg(`${t.parentElement.textContent}: ${t.checked ? "Bật" : "Tắt"}`); return; }
    if (!k) return;
    if (k.startsWith("dong")) return this.dongInput(t, changed);
    if (k === "q" || k === "sv" || k === "t" || k === "gr") { F[k] = t.value; this.fillItems(); }
    else if (k === "mobQ") { M.q = t.value; this.fillMobs(); }
    else if (k === "mobId" && changed) { M.id = +t.value; const z = this.zoneOf(M.id); if (z) { M.lvl = String(Math.round((z.lo + z.hi) / 2)); this.el.querySelector('[data-in="mobLvl"]').value = M.lvl; } this.mobInfo(); }
    else if (k === "mobLvl") M.lvl = t.value;
    else if (k === "mobN") M.n = Math.max(1, Math.min(50, +t.value || 1));
    else if (k === "mobSeries") M.series = t.value;
    else if (k === "mobBoss" && changed) M.boss = t.checked;
    else if (k === "mobAggro" && changed) M.aggro = t.checked;
    else if (k === "utBai") this.ut.bai = +t.value;
    else if (k === "utGio") this.ut.gio = Math.max(0.05, Math.min(48, +t.value || 1));
    else if (k === "utBoCap" && changed) this.ut.boCap = t.checked;
    else if (k === "plBen") this.pl.ben = +t.value || 1;
    else if (k === "plPhut") this.pl.phut = Math.max(0, Math.min(40, +t.value || 0));
    else if (k === "stCap") this.st.cap = +t.value || 20;
    else if (k === "vaCap") this.va.cap = +t.value === 2 ? 2 : 1;
    else if (k === "vaDot") this.va.dot = Math.max(1, Math.min(28, +t.value || 1));
    else if (k === "vdAi") this.vd.ai = Math.max(1, Math.min(10, +t.value || 1));
    else if (k === "btgMau") this.btg.mau = Math.max(1, Math.round(+t.value || 1));
    else if (k === "btgTpl") this.btg.tpl = t.value;
    else if (k === "snMau") this.sn.mau = Math.max(1, Math.round(+t.value || 1));
    else if (k === "snNgay") this.sn.ngay = t.value;
    else if (k === "tkBot") this.tkb.bot = Math.max(1, Math.min(60, Math.round(+t.value || 1))); // tối đa 60 bot mỗi phe (anh 06/11 — cau-hinh tongKim.soBotMax)
    else if (k === "tkTri") this.tkb.tri = Math.max(1, Math.min(3, Math.round(+t.value || 3)));
    else if (k === "tkCap") this.tkb.cap = t.value;
    else if (k === "tkHs") this.tkb.hs = t.value;
    else if (k === "tkMoi" && changed) this.tkb.moi = t.checked;
    // thẻ Lôi đài: đổi thể thức thì điền đủ 2 bên (đối thủ N, đồng đội N − 1 — sửa lại được); số bot kẹp như máy chủ (đối thủ 1..N, đồng đội 0..N − 1)
    else if (k === "ldChe") { if (!changed) return; const L = this.ld; L.che = [1, 2, 3, 4, 5, 6, 7, 8, 16].includes(+t.value) ? +t.value : 1; L.doiThu = L.che; L.dongDoi = L.che - 1; this.render(); }
    else if (k === "ldBen") this.ld.ben = +t.value ? 1 : 0;
    else if (k === "ldDoiThu") this.ld.doiThu = Math.max(1, Math.min(this.ld.che, Math.round(+t.value || 1)));
    else if (k === "ldDongDoi") this.ld.dongDoi = Math.max(0, Math.min(this.ld.che - 1, Math.round(+t.value || 0)));
    else if (k === "ldCap") this.ld.cap = t.value;
    else if (k === "ldChuanBi") this.ld.chuanBi = Math.max(5, Math.min(300, Math.round(+t.value || 10)));
    else if (k === "ldThiDau") this.ld.thiDau = Math.max(30, Math.min(1800, Math.round(+t.value || 180)));
    // thẻ Đua ngựa: kẹp như máy chủ (dua-ngua.js thu — báo danh 0,25–10 phút, đua 1–30 phút, bot 0–120)
    else if (k === "dnPhut") this.dn.phut = Math.max(0.25, Math.min(10, +t.value || 0.5));
    else if (k === "dnDua") this.dn.dua = Math.max(1, Math.min(30, Math.round(+t.value || 6)));
    else if (k === "dnBot") this.dn.bot = Math.max(0, Math.min(120, Math.round(+t.value || 0)));
    else if (k === "dnThem") this.dn.them = Math.max(1, Math.min(120, Math.round(+t.value || 20)));
    else if (k === "dnDc") this.dn.dc = +t.value || 978;
  }

  // ---------- việc ----------
  act(a, t) {
    const api = this.api, P = api.P, w = api.world(), h = api.hero(), p = w.player, v = +t.dataset.v;
    const val = (k) => this.el.querySelector(`[data-in="${k}"]`).value;
    switch (a) {
      case "close": return this.toggle(false);
      case "lvlSet": return this.setLevel(+val("lvl"));
      case "lvl": return this.setLevel(h.lvl + v);
      case "exp": return this.addExp(Math.round((P.chr.exp[h.lvl - 1] || 0) * v));
      case "expN": return this.addExp(Math.max(0, Math.floor(+val("exp") || 0)));
      case "gold": case "goldN": {
        const n = a === "gold" ? v : Math.floor(+val("gold") || 0);
        h.gold = Math.max(0, (h.gold || 0) + n); api.save(); api.msg(`Ngân lượng ${n >= 0 ? "+" : ""}${fmt(n)} → ${fmt(h.gold)}`); return this.refreshLive();
      }
      case "heal": p.hp = p.hpMax; p.mp = p.mpMax; if (p.act === "die") w.setAct(p, "stand"); return api.msg("Hồi đầy máu + nội lực");
      case "utXem": this.ut.tt = null; this.render(); return;
      // Phong Lăng Độ
      case "plXem": return this.hd("pld", { viec: "xem" });
      case "plLen": return this.hd("pld", { viec: "len", ben: this.pl.ben, phut: this.pl.phut });
      case "plTua": return this.hd("pld", { viec: "tua", phut: v });
      case "plBac": return this.hd("pld", { viec: "bac", ben: this.pl.ben });
      case "plNam": return this.hd("pld", { viec: "nam" });
      case "plVe": return this.hd("pld", { viec: "ve" });
      case "plQuai": { // quái trên thuyền (trình duyệt sinh như lúc thuyền chạy / tới giờ đầu lĩnh)
        if (!api.laThuyen()) return api.msg("Phong Lăng Độ (thử): chỉ ra quái được trên thuyền");
        let n = 0; for (let i = 0; i < (v || 1); i++) if (w.spawnMob(!v, 150)) n++;
        return api.msg(v ? `Ra ${n} Thủy tặc` : n ? "Thủy tặc đầu lĩnh đã xuất hiện." : "Không có chỗ đặt đầu lĩnh");
      }
      // Dã Tẩu
      case "dtXem": return this.hd("dt", { viec: "xem" });
      case "dtXong": return this.hd("dt", { viec: "xong" });
      case "dtLoai": return this.hd("dt", { viec: "loai", n: v });
      case "dtSo": return this.hd("dt", { viec: "soNgay", n: t.dataset.v != null ? v : +val("dtSo") });
      case "dtLan": return this.hd("dt", { viec: "lan", n: +val("dtLan") });
      case "dtXN": return this.hd("dt", { viec: "xongNgay", n: t.dataset.v != null ? v : +val("dtXN") });
      case "dtTong": return this.hd("dt", { viec: "tong", n: t.dataset.v != null ? v : +val("dtTong") });
      case "dtHuy": return this.hd("dt", { viec: "huy" });
      case "dtPhat": return this.hd("dt", { viec: "boPhat" });
      case "dtLai": return this.hd("dt", { viec: "datLai" });
      case "dtMoc": return this.hd("dt", { viec: "toiMoc", n: v });
      case "dtRuong": return this.hd("dt", { viec: "ruong" });
      case "dtChuy": return this.hd("dt", { viec: "chuy" });
      case "dtLenh": return this.hd("dt", { viec: "lenh" });
      case "dtShxt": return this.hd("dt", { viec: "shxtThem" });
      case "pdTich": return this.api.hoatDong("pd", { viec: "tich", n: v }).catch((e) => this.api.msg("Phúc duyên (thử): " + e.message));
      case "pdDiem": return this.api.hoatDong("pd", { viec: "diem", n: v }).catch((e) => this.api.msg("Phúc duyên (thử): " + e.message));
      case "pdLai": return this.api.hoatDong("pd", { viec: "datLai" }).catch((e) => this.api.msg("Phúc duyên (thử): " + e.message));
      case "onl": return this.api.hoatDong("onl", v ? { viec: "giay", n: v } : { viec: "datLai" }).catch((e) => this.api.msg("Online (thử): " + e.message));
      case "stXem": return this.hd("st", { viec: "xem" });
      case "stNhan": return this.hd("st", { viec: "nhan", cap: this.st.cap });
      case "stDi": return this.hd("st", { viec: "di" });
      case "stLenh": return this.hd("st", { viec: "lenh", cap: this.st.cap });
      case "stLai": return this.hd("st", { viec: "datLai" });
      case "stHuy": return this.hd("st", { viec: "huy" });
      // Vượt Ải
      case "vdXem": return this.hd("vd", { viec: "xem" });
      case "vdLai": return this.hd("vd", { viec: "datLai" });
      case "vdVao": return this.hd("vd", { viec: "vao", ai: this.vd.ai, ngay: 1 });
      case "vdVaoCho": return this.hd("vd", { viec: "vao", ai: this.vd.ai });
      case "vdCho": return this.hd("vd", { viec: "boCho" });
      case "vdNhay": return this.hd("vd", { viec: "ai", ai: this.vd.ai });
      case "vdNo": return this.hd("vd", { viec: "dot", dot: 21 });
      case "vdCuoi": return this.hd("vd", { viec: "dot", dot: 22 });
      case "vdGio": return this.hd("vd", { viec: "gio", s: 10 });
      case "vdXong": return this.hd("vd", { viec: "xong" });
      case "vdRa": return this.hd("vd", { viec: "ra" });
      case "vdVe": return this.hd("vd", { viec: "ve" });
      case "vaXem": return this.hd("va", { viec: "xem" });
      case "vaLai": return this.hd("va", { viec: "datLai" });
      case "vaVao": return this.hd("va", { viec: "vao", cap: this.va.cap, dot: this.va.dot });
      case "vaNhay": return this.hd("va", { viec: "dot", dot: this.va.dot });
      case "vaXong": return this.hd("va", { viec: "xong" });
      case "vaRa": return this.hd("va", { viec: "ra" });
      // Boss thế giới
      case "btgDay": return api.bossTg({ viec: "goi", tai: api.viTri(), mau: this.btg.mau, tpl: this.btg.tpl ? +this.btg.tpl : undefined }).catch((e) => api.msg("Boss thế giới: " + e.message));
      case "btgLich": return api.bossTg({ viec: "goi", mau: this.btg.mau, tpl: this.btg.tpl ? +this.btg.tpl : undefined }).catch((e) => api.msg("Boss thế giới: " + e.message));
      case "btgHuy": return api.bossTg({ viec: "huy" }).catch((e) => api.msg("Boss thế giới: " + e.message));
      // Săn Nhím Béo Phì
      case "snQuanh": return api.sanNhim({ viec: "mo", tai: api.nhimQuanh(3), mau: this.sn.mau, ngay: +this.sn.ngay || undefined }).catch((e) => api.msg("Săn nhím: " + e.message));
      case "snLich": return api.sanNhim({ viec: "mo", mau: this.sn.mau, ngay: +this.sn.ngay || undefined }).catch((e) => api.msg("Săn nhím: " + e.message));
      case "snHuy": return api.sanNhim({ viec: "huy" }).catch((e) => api.msg("Săn nhím: " + e.message));
      case "phNgan": return api.phongHoa({ viec: "mo", baoDanh: 1, danh: 10, chuSoai: 7 }).then(() => api.msg("Phong Hỏa: đã mở trận thử")).catch((e) => api.msg("Phong Hỏa: " + e.message));
      case "phLich": return api.phongHoa({ viec: "mo" }).then(() => api.msg("Phong Hỏa: đã mở trận như lịch")).catch((e) => api.msg("Phong Hỏa: " + e.message));
      case "phThang": return api.phongHoa({ viec: "ket", thang: 1 }).catch((e) => api.msg("Phong Hỏa: " + e.message));
      case "phThua": return api.phongHoa({ viec: "ket", thang: 0 }).catch((e) => api.msg("Phong Hỏa: " + e.message));
      case "phHuy": return api.phongHoa({ viec: "huy" }).catch((e) => api.msg("Phong Hỏa: " + e.message));
      case "phVao": return api.phVao();
      // Tống Kim bãi thử (may-chu/tong-kim.js quanTri)
      case "tkMo": return api.tkMo({ soBot: this.tkb.bot, tri: this.tkb.tri, cap: +this.tkb.cap || 0, ...(+this.tkb.hs > 0 ? { hs: +this.tkb.hs } : {}), ...(this.tkb.moi ? { moi: 1 } : {}) }).then(() => api.msg("Tống Kim: đã mở bãi thử ở bãi này — 2 doanh hai bên chỗ bạn đứng")).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkHuy": return api.tongKim({ viec: "huy" }).then(() => api.msg("Tống Kim: đã đóng bãi thử")).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkTong": return api.tongKim({ viec: "phe", phe: 0 }).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkKim": return api.tongKim({ viec: "phe", phe: 1 }).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkSoBot": return api.tongKim({ viec: "soBot", soBot: this.tkb.bot }).then(() => api.msg(`Tống Kim: ${this.tkb.bot} bot mỗi phe`)).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkDoiHs": return api.tongKim({ viec: "hs", hs: +this.tkb.hs }).then(() => api.msg(`Tống Kim: hệ số sát thương PK ${+this.tkb.hs}`)).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkDoiTri": return api.tongKim({ viec: "tri", tri: this.tkb.tri }).then(() => api.msg(`Tống Kim: mức thông minh ${this.tkb.tri}`)).catch((e) => api.msg("Tống Kim: " + e.message));
      // Tống Kim trận thật (đợt 2 — may-chu/tong-kim.js quanTri moTran / ketTran / huyTran; phút, cho phép số lẻ)
      case "tkTranMo": return api.tongKim({ viec: "moTran", baoDanh: 1, danh: 6, soai1: 2, soai2: 3 }).then(() => api.msg("Tống Kim: đã mở trận thử — báo danh 1 phút ở Mộ binh quan Biện Kinh, đánh 6 phút")).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkTranKet": return api.tongKim({ viec: "ketTran" }).then(() => api.msg("Tống Kim: đã kết thúc trận (tính thắng thua, phát thưởng)")).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkTranHuy": return api.tongKim({ viec: "huyTran" }).then(() => api.msg("Tống Kim: đã hủy trận (không thưởng)")).catch((e) => api.msg("Tống Kim: " + e.message));
      case "tkTranVao": return api.tkVao ? api.tkVao() : null;
      case "tkAn": { // đo giật: ẩn / hiện 1 loại hình (world.js draw — this.anVe)
        const w = api.world(), k = t && t.dataset && t.dataset.k; if (!w || !k) return;
        w.anVe = { ...(w.anVe || {}), [k]: !(w.anVe && w.anVe[k]) };
        if (t.classList) t.classList.toggle("on", w.anVe[k]);
        return api.msg(`Đo giật: ${t.textContent || k} — ${w.anVe[k] ? "đang ẩn" : "hiện lại"}`);
      }
      // Lôi đài trận thử với bot (main.js ldThu -> may-chu/loi-dai.js thu): mở -> vào sân như qua Công Bình Tử; câu máy chủ bỏ thẻ màu
      case "ldMo": case "ldHuy": {
        const L = this.ld, mo = a === "ldMo", cau = (j, mac) => api.msg(j && j.msg ? String(j.msg).replace(/<color(?:=[^>]*)?>/gi, "") : mac);
        const b = mo ? { viec: "mo", che: L.che, ben: L.ben, doiThu: Math.max(1, Math.min(L.che, L.doiThu)), dongDoi: Math.max(0, Math.min(L.che - 1, L.dongDoi)), cap: Math.max(0, Math.round(+L.cap || 0)), chuanBi: L.chuanBi, thiDau: L.thiDau } : { viec: "huy" };
        return api.ldThu(b).then((j) => cau(j, mo ? "Lôi đài: đã mở trận thử — đang vào sân" : "Lôi đài: đã hủy trận thử")).catch((e) => api.msg("Lôi đài: " + e.message));
      }
      // đua ngựa — lượt thử (may-chu/dua-ngua.js thu): kết quả (vào đường đua, tin, trạng thái) main.js dnApply đã áp
      case "dnMo": case "dnBatDau": case "dnHop": case "dnBot": case "dnKet": case "dnXoa": case "dnDoCu": case "dnDi": {
        if (!api.dnThu) return api.msg("Đua ngựa: trình duyệt cũ — F5");
        const L = this.dn, b = { dnMo: { viec: "mo", phut: L.phut, dua: L.dua, bot: L.bot }, dnBatDau: { viec: "batDau" }, dnHop: { viec: "hop" }, dnBot: { viec: "bot", n: L.them },
          dnKet: { viec: "ket" }, dnXoa: { viec: "xoa" }, dnDoCu: { viec: "doCu", id: L.dc }, dnDi: { viec: "di", moc: t.dataset.k } }[a];
        return api.dnThu(b).catch((e) => api.msg("Đua ngựa: " + e.message));
      }
      case "vaGian": return this.hd("va", { viec: "gian" });
      case "vaCho": return this.hd("va", { viec: "boCho" });
      case "vaHop": return this.hd("va", { viec: "hop" });
      case "utThu": return api.uyThac({ gio: this.ut.gio, bai: this.ut.bai, boCap: this.ut.boCap ? 1 : 0 }).then((tt) => { this.ut.tt = tt; this.render(); }).catch((e) => api.msg("Ủy thác: " + e.message));
      case "ben": { // độ bền đồ đang mặc (món có độ bền): v = 1 còn 1, 0 hỏng, −1 đầy — ghi lên máy chủ (api.save = devSave)
        let n = 0;
        for (const it of Object.values(h.equip || {})) { if (!benMax(it.k)) continue; if (v < 0) delete it.ben; else it.ben = v; n++; }
        w.applyLooks(); api.save(); return api.msg(`Độ bền ${n} món đang mặc: ${v < 0 ? "đầy" : v ? "còn 1" : "hỏng (0)"}`);
      }
      case "spawn": return this.spawn();
      case "bossZone": {
        if (w.zone.boss == null) return api.msg("Bãi này không có trùm");
        const b = w.spawnMob(true, 0, { near: [p.x, p.y] });
        return api.msg(b ? `${b.name} (cấp ${b.lvl}) xuất hiện` : "Không tìm được chỗ đặt trùm");
      }
      case "killAll": { const n = w.mobs.filter((m) => m.alive).length; for (const m of [...w.mobs]) if (m.alive) w.kill(m); return api.msg(`Giết ${n} quái`); }
      case "clearMobs": w.mobs = []; p.target = null; return api.msg("Xóa hết quái" + (w.dev.noSpawn ? "" : " (quái sẽ sinh lại — bật Dừng sinh quái để giữ trống)"));
      case "zone": {
        const z = api.zones().find((x) => x.id === +val("zone"));
        if (!z || z.id === w.zone.id) return;
        return api.gotoZone(z).then(() => { api.msg("Đến " + z.n); this.render(); });
      }
      case "tp": {
        const X = +val("tx"), Y = +val("ty"), mm = P.hud.mmMap;
        if (!Number.isFinite(X) || !Number.isFinite(Y) || !mm) return;
        const [x, y] = mm.fromClient(X, Y);
        if (w.teleport(x, y)) { api.snapCam(); api.msg(`Dịch chuyển tới ${X}/${Y}`); } else api.msg(`Không có chỗ đứng gần ${X}/${Y}`);
        return;
      }
      case "speed": P.dev.speed = v; api.msg(`Tốc độ game ×${v}`); return this.render();
      case "pick": this.sel = t.dataset.k; this.el.querySelectorAll('[data-list="items"] .dv-it').forEach((e) => e.classList.toggle("on", e.dataset.k === this.sel)); return this.showItem();
      case "bagAdd": return this.bagAdd(t.dataset.k);
      case "dongMo": {
        const x = this.item(this.sel); this.dong = this.dong && this.dong.k === this.sel ? null : x && { k: x.k, s: this.heCoDinh(x) ?? 0, L: [] };
        this.showItem(); if (this.dong) this.taiDx().then(() => { const b = this.el.querySelector("[data-dong]"); if (b) b.scrollIntoView({ block: "nearest" }); }).catch(() => {});
        return;
      }
      case "dongTao": return this.dongTao();
      case "dongMax": {
        const D = this.dong, x = D && this.item(D.k); if (!x || !this.dx) return;
        D.L.forEach((l, i) => { const g = this.dongChon(x.t, i, D.s).find((c) => c.a === l.a); if (g) { const r = this.dongRow(g, l.lv); l.v = Math.max(r.p[0][0], r.p[0][1]); } });
        return this.veDong();
      }
      case "wear": return this.wear(t.dataset.k, t.dataset.i == null ? null : +t.dataset.i);
      case "bagDel": { const i = +t.dataset.i; h.bag.splice(i, 1); api.save(); this.fillBag(); return this.refreshLive(); }
      case "facSet": return this.setFaction(val("fac"));
      case "skMax": return this.skillsMax(true);
      case "skReset": return this.skillsMax(false);
      case "skOpen": return api.openSkills();
      case "bookLearn": return this.books(true);
      case "bookForget": return this.books(false);
      case "looksReset": { const n = Object.keys(h.equip || {}).filter((s) => unwear(h, s)).length; h.looks = {}; api.applyLooks(); api.save(); this.fillBag(); this.refreshLive(); return api.msg(`Tháo ${n} món về túi`); }
    }
  }

  // đặt cấp: điểm tiềm năng / kỹ năng tính lại theo cấp mới (World.setLevel)
  setLevel(n) {
    const api = this.api, h = api.hero(), w = api.world();
    n = Math.max(1, Math.min(MAX_LV, Math.round(n) || 1));
    const up = n > h.lvl;
    w.setLevel(n);
    if (up) api.P.audio.ui("levelup");
    api.save(); api.msg(`Cấp ${n} · ${h.pts} điểm tiềm năng chưa cộng`); this.refreshLive();
  }

  // kinh nghiệm: như giết quái (World.gainExp — đủ mốc bảng client thì lên cấp, +5 tiềm năng +1 kỹ năng mỗi cấp)
  addExp(n) {
    const api = this.api, h = api.hero(), lv0 = h.lvl;
    api.world().gainExp(n);
    api.save();
    if (h.lvl === lv0) api.msg(`Kinh nghiệm +${fmt(n)}`);
    this.refreshLive();
  }

  // ---------- quái ----------
  zoneOf(id) { return this.api.P.maps.zones.find((z) => z.kind === "chính" && (z.m.includes(id) || z.boss === id)); }
  fillMobs() {
    const sel = this.el.querySelector('[data-in="mobId"]'); if (!sel) return;
    const P = this.api.P, w = this.api.world(), here = new Set([...w.zone.m, w.zone.boss]), q = fold(this.mob.q.trim());
    const list = Object.entries(P.mons).map(([id, d]) => ({ id: +id, d, here: here.has(+id) }))
      .filter((x) => !q || fold(x.d.n).includes(q) || String(x.id) === q)
      .sort((a, b) => b.here - a.here || a.d.n.localeCompare(b.d.n, "vi"));
    if (this.mob.id == null && list.length) this.mob.id = list[0].id;
    sel.innerHTML = list.map((x) => `<option value="${x.id}"${x.id === this.mob.id ? " selected" : ""}>${x.here ? "★ " : ""}${esc(x.d.n)} (#${x.id})</option>`).join("");
    this.mobInfo();
  }
  mobInfo() {
    const e = this.el.querySelector('[data-live="mobInfo"]'), d = this.api.P.mons[this.mob.id]; if (!e) return;
    if (!d) { e.textContent = ""; return; }
    const z = this.zoneOf(this.mob.id);
    e.textContent = `${d.n} · hình ${d.anim} · ${d.ranged ? "đánh xa" : "cận chiến"} · ${z ? (z.boss === this.mob.id ? "trùm " : "") + z.n + ` (${z.lo}–${z.hi})` : "không thuộc bãi nào"}`;
  }
  spawn() {
    const api = this.api, w = api.world(), p = w.player, M = this.mob;
    if (M.id == null || !api.P.mons[M.id]) return api.msg("Chọn quái trước");
    const lvl = M.lvl === "" ? undefined : Math.max(1, Math.min(200, +M.lvl || 1));
    let n = 0;
    const series = M.series === "" ? undefined : +M.series;
    for (let i = 0; i < M.n; i++) if (w.spawnMob(M.boss, 0, { id: M.id, lvl, series, near: [p.x, p.y], aggro: M.aggro })) n++;
    api.msg(`Sinh ${n} ${api.P.mons[M.id].n}${lvl ? " cấp " + lvl : ""}${series != null ? " hệ " + ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"][series] : ""}${M.boss ? " (trùm)" : ""}`);
  }

  // ---------- đồ ----------
  // kho đồ dùng chung (ItemDB nạp 1 lần; bấm lại thẻ Đồ khi đang tải không tải trùng)
  async loadPack() {
    try {
      const p = await ItemDB.load();
      for (const x of p.items) if (!x._f) x._f = fold(x.n + " " + x.ln);
      this.pack = p;
      if (this.on && this.tab === "item") this.render();
    } catch (e) { const n = this.el.querySelector('[data-live="itemCount"]'); if (n) n.textContent = "Không tải được kho đồ: " + e.message; }
  }
  item(k) { return ItemDB.item(k); }
  svText(x) { return [1, 2, 3].filter((s) => x.sv & (1 << (s - 1))).map((s) => "S" + s).join(","); }
  row(x, extra = "") {
    const g = this.pack.groups[x.gr] || "", col = GROUP_COL[g] || "#fff", ic = x.ic ? `<img loading="lazy" src="assets/web/icon/${esc(x.ic)}" alt="">` : "<img alt=\"\">";
    return `<div class="dv-it${x.k === this.sel ? " on" : ""}" data-act="pick" data-k="${esc(x.k)}">${ic}<div style="flex:1;min-width:0"><span style="color:${col}">${esc(x.n)}</span>` +
      `<small>${esc(this.pack.types[x.t] || "")} · cấp ${x.lv} · ${esc(g)} · ${this.svText(x)}${SLOT_OF[x.t] ? (x.g ? " · mặc được, hiện trên người" : " · mặc được") : ""}</small></div>${extra}</div>`;
  }
  fillItems() {
    const box = this.el.querySelector('[data-list="items"]'); if (!box || !this.pack) return;
    const F = this.f, h = this.api.hero(), q = fold(F.q.trim()).split(/\s+/).filter(Boolean);
    const svBit = F.sv === "all" ? 7 : 1 << ((F.sv === "hero" ? h.server : +F.sv) - 1);
    const hit = this.pack.items.filter((x) => (x.sv & svBit) && (F.t === "" || x.t === +F.t) && (!F.gr || this.pack.groups[x.gr] === F.gr) && q.every((w) => x._f.includes(w)));
    this.el.querySelector('[data-live="itemCount"]').textContent = `${fmt(hit.length)} món${hit.length > LIST_MAX ? ` — hiện ${LIST_MAX} món đầu, gõ thêm để lọc` : ""}`;
    box.innerHTML = hit.slice(0, LIST_MAX).map((x) => this.row(x)).join("");
    this.fillBag();
    if (this.sel) this.showItem();
  }
  fillBag() {
    const box = this.el.querySelector('[data-list="bag"]'), h = this.api.hero(); if (!box || !this.pack) return;
    box.innerHTML = (h.bag || []).map((b, i) => { const x = this.item(b.k); return x ? this.row(x, `${SLOT_OF[x.t] ? `<button data-act="wear" data-k="${esc(x.k)}" data-i="${i}">Mặc</button>` : ""}<button data-act="bagDel" data-i="${i}">Bỏ</button>`) : ""; }).join("") || '<div class="dv-note">Túi trống</div>';
  }
  async showItem() {
    const box = this.el.querySelector("[data-detail]"), x = this.item(this.sel); if (!box || !x) return;
    const h = this.api.hero(), g = this.pack.groups[x.gr] || "";
    const warn = [!(x.sv & (1 << (h.server - 1))) ? `không có ở S${h.server}` : "", x.x >= 0 && x.x !== (h.sex === "f" ? 1 : 0) ? (x.x ? "đồ nữ" : "đồ nam") : ""].filter(Boolean);
    const head = `<b style="color:${GROUP_COL[g] || "#fff"}">${esc(x.n)}</b>${warn.length ? ` <span class="t3">(${warn.join(", ")})</span>` : ""}\n` +
      `<span class="dv-note">${esc(x.k)} · ${esc(x.ln)}</span>`;
    const btn = `<div class="r"><button data-act="bagAdd" data-k="${esc(x.k)}">Thêm vào túi</button>${SLOT_OF[x.t] ? `<button data-act="wear" data-k="${esc(x.k)}">Mặc thử</button>` : ""}` +
      `${DONG_LOAI(x) ? `<button data-act="dongMo"${this.dong && this.dong.k === x.k ? ' class="on"' : ""}>Tạo theo dòng…</button>` : ""}</div>`;
    this.veDong();
    box.innerHTML = head + "\n…" + btn;
    try {
      const T = await ItemDB.text(x.k);
      if (this.sel !== x.k) return;
      box.innerHTML = head + [["t1", T[0]], ["t2", T[1]], ["t3", T[2]]].filter(([, s]) => s).map(([c, s]) => `\n<span class="${c}">${esc(s)}</span>`).join("") + btn;
    } catch (e) { box.innerHTML = head + `\n<span class="t3">Không tải được chữ món: ${esc(e.message)}</span>` + btn; }
  }
  bagAdd(k) {
    const api = this.api, h = api.hero(), x = this.item(k); if (!x) return;
    (h.bag = h.bag || []).push({ k, n: 1, dev: true });
    api.save(); api.msg(`Thêm ${x.n} vào túi`); this.fillBag(); this.refreshLive();
  }

  // ---------- tạo trang bị theo dòng tự chọn (anh 29/10 "dev tool thêm cái tạo trang bị theo dòng tự chọn") ----------
  // Bảng dòng xanh của client (assets/data/dong-xanh.json — magicattrib.txt, máy chủ gieo dòng từ chính bảng này: may-chu/do.js gieoDong). Luật
  // như máy chủ: dòng 1, 3, 5 tiền tố, 2, 4, 6 hậu tố (dòng ẩn — chỉ thuộc tính có hệ = hệ của món); thuộc tính có trọng số > 0 ở loại món
  // (w[t]); 1 món không có 2 dòng cùng thuộc tính; số trong khoảng của cấp dòng (p[0]). Món vào túi như "Thêm vào túi" (api.save -> máy chủ
  // quan-tri/nv, chỉ tài khoản quản trị; máy chủ giữ dòng vì khóa có trong bảng). Hệ cố định của món (do-goc series / ngựa) thì không chọn hệ.
  taiDx() { return (this._dx = this._dx || fetch("assets/data/dong-xanh.json").then((r) => r.json()).then((j) => { this.dx = j; })); }
  heCoDinh(x) { return ItemDB.base(x.k).series ?? (x.t === 10 && x.s >= 0 ? x.s : null); }
  // thuộc tính chọn được ở dòng i của món loại t, hệ s: [{ a, k, rows: [cấp tăng dần] }]
  dongChon(t, i, s) {
    const pre = i % 2 === 0 ? 1 : 0, by = new Map();
    for (const r of this.dx.rows) {
      if (!(r.w[t] > 0) || r.pre !== pre || (!pre && r.se !== s)) continue;
      if (!by.has(r.a)) by.set(r.a, { a: r.a, k: r.k, rows: [] });
      by.get(r.a).rows.push(r);
    }
    for (const g of by.values()) g.rows.sort((p, q) => p.lv - q.lv);
    return [...by.values()].sort((p, q) => this.tenDong(p.k).localeCompare(this.tenDong(q.k), "vi"));
  }
  // câu của dòng (magicdesc của client — tip.json) với chỗ số thay bằng x
  tenDong(k) {
    const M = (this.api.P.skillTip || {}).magic || {};
    return String(M[ItemDB.serDmg[k] || k] || k).replace(/<\/?color(?:=[^>]*)?>/gi, "").replace(/#[dsxm]1[+\-~]?/g, "x");
  }
  dongRow(g, lv) { return g.rows.find((r) => r.lv === lv) || g.rows[g.rows.length - 1]; }
  // đổi hệ: bỏ từ dòng đầu tiên không còn hợp (hậu tố của hệ cũ) trở đi
  dongSua() {
    const D = this.dong, x = this.item(D.k);
    const i = D.L.findIndex((l, j) => !this.dongChon(x.t, j, D.s).some((c) => c.a === l.a));
    if (i >= 0) D.L.length = i;
  }
  veDong() {
    const box = this.el && this.el.querySelector("[data-dong]"); if (!box) return;
    const D = this.dong, x = D && this.item(D.k);
    if (!x || D.k !== this.sel) { box.innerHTML = ""; return; }
    if (!this.dx) { box.innerHTML = `<div class="dv-note">Đang tải bảng dòng xanh…</div>`; this.taiDx().then(() => this.veDong()).catch((e) => { box.innerHTML = `<div class="dv-note">Không tải được bảng dòng xanh: ${esc(e.message)}</div>`; }); return; }
    const fixed = this.heCoDinh(x);
    let html = `<div class="r"><b>Tạo ${esc(x.n)} theo dòng tự chọn</b></div>
      <div class="r"><span class="k">Ngũ hành</span>${fixed != null ? `<span>${HE[fixed]} (cố định của món)</span>`
        : `<select data-in="dongS">${HE.map((n, i) => `<option value="${i}"${i === D.s ? " selected" : ""}>${n}</option>`).join("")}</select>`}</div>`;
    for (let i = 0; i < 6; i++) {
      if (i > 0 && !D.L[i - 1]) break; // dòng trước còn trống
      const C = this.dongChon(x.t, i, D.s), l = D.L[i], g = l && C.find((c) => c.a === l.a);
      const co = new Set(D.L.filter((q, j) => q && j !== i).map((q) => q.a)); // thuộc tính đã có ở dòng khác: không chọn trùng
      html += `<div class="r"><span class="k">Dòng ${i + 1} <small>${i % 2 ? "hậu tố" : "tiền tố"}</small></span>
        <select data-in="dongA" data-i="${i}" style="flex:1;min-width:0"><option value="">— không —</option>${C.map((c) => `<option value="${c.a}"${g && c.a === g.a ? " selected" : ""}${co.has(c.a) ? " disabled" : ""}>${esc(this.tenDong(c.k))}${co.has(c.a) ? " (đã có)" : ""}</option>`).join("")}</select>`;
      html += `</div>`;
      // cấp dòng + số ở hàng dưới (bảng công cụ hẹp — ô thuộc tính được rộng cả hàng)
      if (g) { const r = this.dongRow(g, l.lv); html += `<div class="r" style="padding-left:82px"><select data-in="dongLv" data-i="${i}">${g.rows.map((q) => `<option value="${q.lv}"${q.lv === r.lv ? " selected" : ""}>cấp dòng ${q.lv}</option>`).join("")}</select>
        <input data-in="dongV" data-i="${i}" type="number" style="width:72px" value="${l.v}"><small>khoảng ${r.p[0][0]}–${r.p[0][1]}</small></div>`; }
    }
    html += `<div class="dv-note">Dòng 1, 3, 5 tiền tố; 2, 4, 6 hậu tố = dòng ẩn (chỉ thuộc tính hợp hệ của món). 1 món không có 2 dòng cùng thuộc tính. Số mặc định = mức cao nhất của cấp dòng.</div>
      <div class="r"><button data-act="dongTao">Tạo vào túi</button><button data-act="dongMax">Mọi dòng số cao nhất</button></div>`;
    box.innerHTML = html;
  }
  dongInput(t, changed) {
    const D = this.dong, x = D && this.item(D.k); if (!x || !this.dx) return;
    const k = t.dataset.in, i = +t.dataset.i;
    if (k === "dongV") { if (D.L[i]) D.L[i].v = t.value; return; }
    if (!changed) return; // ô chọn: đợi change (vẽ lại thay ô)
    if (k === "dongS") { D.s = +t.value; this.dongSua(); }
    else if (k === "dongA") {
      const g = t.value === "" ? null : this.dongChon(x.t, i, D.s).find((c) => c.a === +t.value);
      if (!g) D.L.length = i; else { const r = g.rows[g.rows.length - 1]; D.L[i] = { a: g.a, lv: r.lv, v: r.p[0][1] }; }
    } else if (k === "dongLv" && D.L[i]) { const g = this.dongChon(x.t, i, D.s).find((c) => c.a === D.L[i].a), r = g && this.dongRow(g, +t.value); if (r) { D.L[i].lv = r.lv; D.L[i].v = r.p[0][1]; } }
    this.veDong();
  }
  dongTao() {
    const api = this.api, h = api.hero(), D = this.dong, x = D && this.item(D.k); if (!x || !this.dx) return;
    const s = this.heCoDinh(x) ?? D.s, d = [], dung = new Set();
    for (let i = 0; i < D.L.length; i++) {
      const l = D.L[i], g = this.dongChon(x.t, i, s).find((c) => c.a === l.a);
      if (!g) return api.msg(`Dòng ${i + 1}: thuộc tính không hợp vị trí / hệ của món — chọn lại`);
      if (dung.has(l.a)) return api.msg(`Dòng ${i + 1}: trùng thuộc tính với dòng trước (1 món không có 2 dòng cùng thuộc tính)`);
      dung.add(l.a);
      const [a, b] = this.dongRow(g, l.lv).p[0], lo = Math.min(a, b), hi = Math.max(a, b);
      d.push([g.k, Math.max(lo, Math.min(hi, Math.round(+l.v || 0)))]);
    }
    (h.bag = h.bag || []).push({ k: x.k, s, d, dev: true });
    api.save(); api.msg(`Tạo ${x.n} hệ ${HE[s]}, ${d.length} dòng vào túi`); this.fillBag(); this.refreshLive();
  }
  // mặc thử từ danh mục (from = null) hoặc mặc món trong túi (from = chỉ số túi; món cũ ở ô đó trả về túi)
  wear(k, from = null) {
    const api = this.api, h = api.hero(), x = this.item(k); if (!x) return;
    const slot = wear(h, k, from);
    if (!slot) return api.msg(`${x.n}: không mặc được`);
    const look = api.applyLooks();
    api.save(); this.fillBag(); this.refreshLive();
    const notes = x.g ? (look.notes || []).filter((s) => PARTS[x.g].includes(s.split(" ")[0])) : [];
    api.msg(`Mặc ${x.n} (ô ${slot}${x.g ? `, kiểu dáng ${x.g} #${x.id}` : ""})` + (notes.length ? " — thiếu hình: " + notes.join("; ") : ""));
  }
}
