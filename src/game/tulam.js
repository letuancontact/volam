// Trợ Thủ tự làm nhiệm vụ ngày — phía trình duyệt (anh 03/11: "thiết kế tiện ích tự hoàn thành dã tẩu trong ngày, tự săn sát thủ … mở khóa xong là dc
// dùng trong ngày, ngắt quãng cũng k sao => auto tự làm tự mua các item cần thiết và hoàn thành nhiệm vụ, boss sát thủ thì chọn loại bằng cấp nhân vật,
// làm chỉnh chu và cẩn thận, tránh lỗi với các phần khác"). Bật ở Trợ Thủ → Tiện ích → Nhiệm vụ ngày (hero.auto.tuLam); máy chủ may-chu/tu-lam.js mở
// khóa trong ngày bằng Xu và làm từng bước ở NPC (cùng luật hội thoại — da-tau.js / sat-thu.js buocTu). Chạy khi đang tự đánh, đi lại như người chơi:
//   - cần gặp NPC (Dã Tẩu: chưa nhận, xong chờ thưởng, nhiệm vụ mua / tìm / xem vật phẩm, nhiệm vụ đánh quái đã đủ; Sát thủ: chưa nhận) -> ở bãi thì
//     về thành bằng Thổ Địa Phù (việc ở thành của Trợ Thủ như thường: bán, sửa, mua thuốc, cất rương, dưỡng sức) — Sát thủ về Ba Lăng huyện (Nhiếp Thí
//     Trần chỉ ở đó), Dã Tẩu về thành Trợ Thủ về (Ba Lăng / Biện Kinh đều có Dã Tẩu); ở thành khác thì Xa phu sang; chạy tới NPC rồi gọi bước tới khi
//     phải đi đánh
//   - Boss Sát thủ đã nhận -> Xa phu "Đưa ta đến bản đồ nhiệm vụ sát thủ" (bản quái chung), chạy tới chỗ boss, World nhắm boss nhiệm vụ trước (satUu);
//     bị hạ 3 lần ở cùng 1 boss thì thôi săn sát thủ hôm đó; tới chỗ boss 5 phút không thấy boss thì cũng thôi
//   - Dã Tẩu thu thập địa đồ -> bãi của nhiệm vụ; nâng cấp kinh nghiệm / Sơn Hà Xã Tắc -> bãi treo máy (không bật thì bãi vừa đánh) — đánh như thường
//   - xong hết trong ngày (hoặc đã thôi, hoặc đang chờ Dã Tẩu hết phạt 10 phút) -> về bãi treo máy (anh 03/11 lượt 18: "sau khi xong dã tẩu hoặc săn sát thủ
//     thì phải tự động quay lại bãi treo"): bãi của "Treo ở" (thẻ Đánh quái); không bật thì đúng chỗ đang đánh lúc Trợ Thủ đưa đi (auto.tuLam.nha — lưu theo
//     nhân vật, tải lại trang vẫn nhớ): ở bãi khác -> Thổ Địa Phù về thành (việc ở thành) -> Xa phu về đúng chỗ; tới nơi thì xóa
//   - đang tự làm (có việc / đang về bãi) thì bỏ qua "theo sau" của tổ đội (anh 03/11 lượt 18: "lúc làm dã tẩu nếu đang trong pt hay đang cài đặt theo sau
//     thì mặc định đc phép bỏ qua theo sau, khi nào xong cái tự động, quay lại bãi thì tiếp tục theo sau") — main.js World.theo hỏi TuLam.chiem
// Không chen vào: đang tải bản đồ, việc ở thành / đi Xa phu của Trợ Thủ đang chạy, boss thế giới (đang đánh / đang đưa đi), Vượt Ải, thuyền, đảo.
//   TuLam.api = main.js; TuLam.tick() mỗi khung (tự giãn 0,4 giây); TuLam.sauThanh() (main.js onRested: true = việc tiếp theo do đây lo);
//   TuLam.batDau() (nút Bắt đầu tự làm); TuLam.dang (chữ việc đang làm — Trợ Thủ hiện)
import { Net } from "./net.js";
import { ldist } from "./map.js";

const BA_LANG = 53;
const CHET_TOI_DA = 3;          // bị hạ ở cùng 1 boss Sát thủ chừng này lần -> thôi săn hôm đó
const CHO_BOSS = 300000;        // tới chỗ Boss Sát thủ quá chừng này ms không thấy boss -> thôi
const TOI_NPC = 40000;          // chạy tới NPC quá chừng này ms (kẹt) thì vẫn nói chuyện như việc ở thành
const CHO_RO = 2500, NHAT_TOI_DA = 20000; // vừa hạ Boss Sát thủ: ở lại ít nhất CHO_RO ms chờ đồ rơi tới, lâu nhất NHAT_TOI_DA ms nhặt đồ (anh 10/11)
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
const ngayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

export const TuLam = {
  // main.js: { hero(), world(), msg(t), canh(t), ban() -> đang bận việc khác, veThanh(lý do, mã thành) -> đã đi?, lamThanh(lý do) (việc ở thành ngay
  //   tại thành đang đứng), xe(việc: { thanh } | { bai, c } | { sat: 1 }) (chạy tới Xa phu rồi lên xe), veNha({ z, c, x?, y? }) (Xa phu về đúng chỗ),
  //   baiTreo() -> { z, c } | null, thanhVe() -> mã thành Trợ Thủ về, laThanh(bãi), laBai(bãi), laQc(mã bãi), moBai(mã bãi) -> đủ cấp vào, npcDt(world),
  //   npcSat(world), satBoss(nv) -> boss sat-thu.json, applyServer(j), luu() (lưu nhân vật), batAuto() }
  api: null,
  // trạng thái trong ngày: dtDung / stDung (lý do thôi), dtHet / stHet, chet { nv, n }, choDt (lúc Dã Tẩu giao lại), tui (lần túi đầy liền), chay (hôm nay
  // đã làm gì đó), xongBao
  s: { ngay: "" },
  // loai: đang làm "dt" | "st" (bảng nhiệm vụ góc trái); chiem: đang tự làm / đang về bãi treo — World bỏ qua "theo sau" (main.js w.theo)
  dang: "", loai: null, ban: false, luc: 0, toiT: null, bossT: null, chetDem: false, chiem: false,

  tl(h) { const t = h.tl, r = h.tuLam || {}; return t && t.ngay === ngayVN() ? t : { dt: r.ngay === ngayVN() ? r.dt | 0 : 0, st: r.ngay === ngayVN() ? r.st | 0 : 0 }; },
  ngayMoi() { const d = ngayVN(); if (this.s.ngay !== d) this.s = { ngay: d }; },
  // có dùng tự làm hôm nay (đã bật + đã mở khóa ít nhất 1 loại — kể cả đã xong / đã thôi)
  dung(h) { const L = h.auto && h.auto.tuLam, t = this.tl(h); return !!(L && ((L.dt.on && t.dt) || (L.st.on && t.st))); },
  // đang bật + đã mở khóa + chưa phải thôi
  bat(h) {
    const L = h.auto && h.auto.tuLam, t = this.tl(h);
    return { dt: !!(L && L.dt.on && t.dt && !this.s.dtDung && !this.s.dtHet), st: !!(L && L.st.on && t.st && !this.s.stDung && !this.s.stHet) };
  },
  // việc cần làm: { npc: "dt" | "st" } | { sat: boss } | { danh: mã bãi | null } | null
  canGi(h, B) {
    const S = h.satThu || {}, toiDa = S.toiDa || 8;
    if (B.st && !S.nv && (S.dem | 0) >= toiDa) { this.s.stHet = true; B.st = false; this.api.msg(`Trợ Thủ: hôm nay đã hạ đủ ${toiDa} Boss Sát thủ`); }
    const D = h.dtc || { buoc: 0, nhanNgay: 0, gioiHan: 40 }, choDt = this.s.choDt && performance.now() < this.s.choDt;
    let dt = null;
    if (B.dt && !choDt) {
      if (D.buoc === 1) dt = D.tienDo && D.tienDo[0] < D.tienDo[1] ? { danh: D.bai ?? null } : { npc: "dt" };
      else if (D.buoc === 2 || (D.nhanNgay | 0) < (D.gioiHan || 40)) dt = { npc: "dt" };
      else { this.s.dtHet = true; this.api.msg(`Trợ Thủ: hôm nay đã làm đủ ${D.gioiHan || 40} nhiệm vụ Dã Tẩu`); }
    }
    // gặp NPC trước (đang ở thành thì làm luôn cả hai), rồi boss Sát thủ, rồi đánh quái cho Dã Tẩu (đánh boss cũng có kinh nghiệm / đồ chí)
    if (dt && dt.npc) return dt;
    if (B.st && !S.nv) return { npc: "st" };
    if (B.st && S.nv) { const b = this.api.satBoss(S.nv); if (b) return { sat: b }; }
    return dt;
  },

  batDau() {
    const A = this.api, h = A && A.hero(); if (!h) return;
    this.ngayMoi();
    const L = h.auto.tuLam, t = this.tl(h);
    if (!L.dt.on && !L.st.on) return A.msg("Trợ Thủ: tích Tự làm Dã Tẩu / Tự săn Boss Sát thủ trước");
    if ((L.dt.on && !t.dt) || (L.st.on && !t.st)) return A.msg("Trợ Thủ: mở khóa hôm nay trước (nút Mở khóa)");
    delete this.s.dtDung; delete this.s.stDung; delete this.s.xongBao; this.s.tui = 0; this.s.chet = null;
    A.batAuto();
    A.msg("Trợ Thủ: bắt đầu tự làm nhiệm vụ ngày");
    this.luc = 0;
  },

  // đang chạy loại này (đã bật + đã mở khóa + chưa phải thôi + đang tự đánh)
  chay(loai) { const A = this.api, h = A && A.hero(), w = A && A.world(); if (!h || !h.auto) return false; this.ngayMoi(); return !!(this.bat(h)[loai] && w && w.auto); },
  // nút Bắt đầu / Dừng riêng từng loại (anh 08/11 "thêm nút bấm để bắt đầu hoặc dừng dã tẩu, vì hiện tại nhiều khi phù về thành xong là nó không tiếp tục nữa"):
  // Bắt đầu: bật, xóa các dấu đã thôi / đang chờ, gỡ việc ở thành đang kẹt, bật tự đánh; Dừng: tắt (còn đang ở xa thì tick đưa về bãi treo máy như thường)
  nut(loai) {
    const A = this.api, h = A && A.hero(); if (!h) return;
    const L = h.auto.tuLam[loai], ten = loai === "dt" ? "Dã Tẩu" : "Boss Sát thủ";
    if (this.chay(loai)) { L.on = 0; A.luu(); this.dang = ""; A.msg(`Trợ Thủ: dừng ${ten}`); return; }
    L.on = 1; A.luu();
    delete this.s[loai + "Dung"]; delete this.s[loai + "Het"]; delete this.s.xongBao; if (loai === "dt") delete this.s.choDt;
    this.s.tui = 0; this.s.chet = null; this.toiT = null; this.ban = false;
    A.boKet(); A.batAuto(); A.msg(`Trợ Thủ: bắt đầu ${ten}`);
    this.luc = 0;
  },

  // dưỡng sức xong ở thành (main.js onRested): còn việc thì đây lo bước tiếp (không đi Xa phu về bãi treo máy)
  sauThanh() {
    const A = this.api, h = A && A.hero(), w = A && A.world(); if (!h || !w || !w.auto) return false;
    this.ngayMoi();
    const B = this.bat(h);
    if (!((B.dt || B.st) && this.canGi(h, B)) && !((this.dung(h) || this.chiem) && this.conVe(h, w))) return false;
    w.holdMove = false; this.luc = 0;
    return true;
  },
  // bãi treo máy để về khi xong (auto.tuLam.nha): ghi 1 lần lúc Trợ Thủ sắp đưa đi — bãi của "Treo ở"; không bật thì chỗ đang đánh (bãi luyện công); đang
  // ở thành thì bãi vừa đánh
  ghiNha(h, w) {
    const L = h.auto.tuLam; if (L.nha) return;
    const T = h.auto.treo, A = this.api;
    if (T.on && T.bai != null) L.nha = { z: T.bai, c: T.chung ? 1 : 0 };
    else if (A.laBai(w.zone)) L.nha = { z: w.zone.id, c: w.chung ? 1 : 0, x: Math.round(w.player.x), y: Math.round(w.player.y) };
    else if (h.farmZone != null) L.nha = { z: h.farmZone, c: h.farmChung ? 1 : 0 };
    if (L.nha) A.luu();
  },
  // còn phải về bãi treo máy (có nha mà chưa đứng ở bãi đó, đúng bản quái chung / riêng)
  conVe(h, w) {
    const o = h.auto.tuLam.nha;
    return !!o && !(w.zone.id === o.z && (!this.api.laQc(o.z) || !!w.chung === !!o.c));
  },

  tick() {
    const A = this.api; if (!A) return;
    const h = A.hero(), w = A.world(); if (!h || !w || !h.auto) return;
    const t = performance.now(); if (t - this.luc < 400) return;
    this.luc = t;
    this.ngayMoi();
    const B = this.bat(h), S = h.satThu || {};
    if (this.nvCu && !S.nv) this.vuaHa = t; // nhiệm vụ Sát thủ vừa xong (máy chủ bỏ S.nv lúc boss chết)
    this.nvCu = S.nv | 0;
    w.satUu = !!(B.st && w.auto && S.nv);
    this.demChet(h, w);
    if (!w.auto) { this.dang = ""; this.loai = null; this.chiem = false; return; }
    if (this.ban || A.ban()) return;
    const can = B.dt || B.st ? this.canGi(h, B) : null;
    if (!can) {
      // không dùng tự làm hôm nay (tắt / chưa mở khóa) mà không đang trên đường về: bỏ chỗ về cũ (khỏi kéo người chơi về bãi của hôm trước)
      if (!this.dung(h) && !this.chiem) { const L = h.auto.tuLam; if (L.nha) { L.nha = null; A.luu(); } this.dang = ""; this.loai = null; return; }
      this.chiem = this.conVe(h, w);
      return this.veNha(h, w);
    }
    this.chiem = true;
    this.s.chay = true; this.loai = can.npc || (can.sat ? "st" : "dt");
    if (can.npc) return this.diNpc(h, w, can.npc);
    if (can.sat) return this.diBoss(h, w, can.sat);
    return this.diDanh(h, w, can.danh);
  },

  // không còn việc (xong / đã thôi / chờ Dã Tẩu hết phạt): báo 1 lần; còn nha thì về bãi treo máy — ở bãi khác: Thổ Địa Phù về thành (việc ở thành, dưỡng
  // sức -> onRested -> sauThanh) rồi Xa phu về đúng chỗ; tới nơi thì xóa nha (theo sau lại chạy)
  veNha(h, w) {
    const A = this.api, L = h.auto.tuLam, o = L.nha, cho = this.s.choDt && performance.now() < this.s.choDt;
    this.dang = cho ? `chờ Dã Tẩu giao nhiệm vụ (${Math.ceil((this.s.choDt - performance.now()) / 60000)} phút nữa)` : ""; this.loai = cho ? "dt" : null;
    if (this.s.chay && !cho && !this.s.xongBao && !this.s.dtDung && !this.s.stDung) { this.s.xongBao = true; A.msg("Trợ Thủ: xong nhiệm vụ ngày đã bật — về bãi treo máy"); }
    if (!o) return;
    if (!this.conVe(h, w)) { L.nha = null; A.luu(); this.chiem = false; return; }
    if (!A.moBai(o.z)) { L.nha = null; A.luu(); return; } // bãi không còn vào được: thôi
    if (A.laThanh(w.zone)) { this.dang = "về bãi treo máy"; A.veNha(o); return; }
    if (A.laBai(w.zone)) {
      if (this.choNhat(w)) { this.dang = "nhặt đồ boss rơi"; return; }
      this.dang = "về bãi treo máy"; A.veThanh(cho ? "chờ Dã Tẩu — về bãi treo máy đánh quái" : "xong nhiệm vụ ngày — về bãi treo máy", null);
    }
  },

  // gặp NPC: ở bãi -> về thành (Thổ Địa Phù + việc ở thành); thành khác -> Xa phu; tới nơi thì gọi bước
  diNpc(h, w, loai) {
    const A = this.api, ten = loai === "st" ? "Nhiếp Thí Trần" : "Dã Tẩu";
    let tz = loai === "st" ? BA_LANG : A.thanhVe();
    if (A.laBai(w.zone)) {
      if (this.choNhat(w)) { this.dang = "nhặt đồ boss rơi"; return; }
      this.dang = `về thành gặp ${ten}`; this.ghiNha(h, w);
      if (!A.veThanh(`gặp ${ten}`, tz)) this.thoi(loai, "không về thành được (hết Thổ Địa Phù?)");
      return;
    }
    if (!A.laThanh(w.zone)) { this.dang = ""; return; } // ải, đảo, thuyền…: chờ ra
    if (loai === "dt" && A.npcDt(w)) tz = w.zone.id; // Dã Tẩu ở cả Ba Lăng huyện và Biện Kinh
    if (w.zone.id !== tz) { this.dang = `đi Xa phu tới ${ten}`; this.ghiNha(h, w); A.xe({ thanh: tz }); return; }
    const n = loai === "st" ? A.npcSat(w) : A.npcDt(w);
    if (!n) { this.thoi(loai, `không thấy ${ten} ở ${w.zone.n}`); return; }
    this.dang = `gặp ${ten}`;
    if (!this.toi(w, n)) return;
    this.goi(h, loai);
  },
  // vừa hạ Boss Sát thủ (anh 10/11 "làm nv sát thủ xong thì nhặt đồ boss rơi ra đã rồi mới về thành"): còn ở lại khi mới hạ chưa quá CHO_RO, hoặc chưa quá NHAT_TOI_DA mà còn đồ
  // Trợ Thủ sẽ nhặt ở gần (World.nearestLoot — theo thẻ Nhặt đồ). Tự đánh đang bật nên World tự chạy đi nhặt
  choNhat(w) {
    if (!this.vuaHa) return false;
    const da = performance.now() - this.vuaHa;
    if (da < CHO_RO) return true;
    if (da < NHAT_TOI_DA && w.nearestLoot(null)) return true;
    this.vuaHa = 0;
    return false;
  },
  // chạy tới NPC (đứng dậy nếu đang ngồi): tới gần (80) hoặc chạy quá TOI_NPC (kẹt) -> true
  toi(w, n) {
    const p = w.player, d = ldist(p.x, p.y, n.x, n.y);
    if (!this.toiT || this.toiT.n !== n) this.toiT = { n, t0: performance.now() };
    // vừa sang bản đồ (Thổ Địa Phù / Xa phu tới ngay cạnh NPC): chờ ≥ 1,5 giây cho nhịp báo bản đồ mới tới máy chủ rồi mới gọi (máy chủ kiểm đứng gần NPC — soát 13/11)
    if ((d <= 80 || performance.now() - this.toiT.t0 > TOI_NPC) && w.time >= 1.5) { this.toiT = null; p.path = null; p.goal = null; return true; }
    w.resting = false; if (p.sit) w.sit(false);
    if (p.target) { p.target = null; p.path = null; }
    if (!p.goal) w.walkTo(n.x, n.y);
    return false;
  },
  // gọi bước ở máy chủ (lặp khi "lai" — nhận, mua, nộp, chọn thưởng, nhận tiếp… liền một lượt đứng trước NPC)
  async goi(h, loai) {
    const A = this.api;
    this.ban = true;
    try {
      for (let i = 0; i < 40; i++) {
        const L = h.auto.tuLam.dt;
        const j = await Net.tuLam(h.slot | 0, loai === "dt" ? { viec: "dt", thuong: L.thuong, giuHuy: L.giuHuy, gian: L.gian, huy: L.huy } : { viec: "st" });
        A.applyServer(j);
        for (const c of j.tin || []) A.msg(c.replace(/<color=?\w*>/g, ""));
        if (j.tiep === "lai") { this.s.tui = 0; await ngu(300); continue; }
        if (j.tiep === "tui") {
          this.s.tui = (this.s.tui | 0) + 1;
          if (this.s.tui > 2) this.thoi(loai, "hành trang không còn đủ 5 ô trống");
          else { A.msg("Trợ Thủ: hành trang sắp đầy — bán / cất đồ rồi gặp lại " + (loai === "st" ? "Nhiếp Thí Trần" : "Dã Tẩu")); A.lamThanh("hành trang sắp đầy"); }
        } else if (j.tiep === "het") { if (loai === "dt") this.s.dtHet = true; else this.s.stHet = true; if (j.ly) A.msg("Trợ Thủ: " + j.ly); }
        else if (j.tiep === "cho") { this.s.choDt = performance.now() + (j.giay | 0) * 1000; A.msg(`Trợ Thủ: ${j.ly || "Dã Tẩu chưa giao nhiệm vụ"} — làm việc khác, ${Math.ceil((j.giay | 0) / 60)} phút sau quay lại`); }
        else if (j.tiep === "dung") this.thoi(loai, j.ly || "dừng");
        else this.s.tui = 0; // "danh": đi đánh
        break;
      }
    } catch (e) {
      if (e && e.ma !== "het-phien") A.msg("Trợ Thủ: " + ((e && e.message) || e));
      if (e && /mở khóa/.test(e.message || "")) this.thoi(loai, e.message);
      this.luc = performance.now() + 4000;
    } finally { this.ban = false; }
  },
  // thôi làm 1 loại trong ngày (bấm Bắt đầu tự làm để thử lại)
  thoi(loai, ly) {
    if (loai === "dt") this.s.dtDung = ly; else this.s.stDung = ly;
    this.api.canh(`Trợ Thủ thôi ${loai === "dt" ? "tự làm Dã Tẩu" : "tự săn Boss Sát thủ"}: ${ly}`);
  },

  // Boss Sát thủ đã nhận: ở bãi của boss (bản quái chung nếu bãi có) -> chạy tới chỗ boss, đứng gần thì World nhắm boss; không thì về thành / Xa phu
  diBoss(h, w, b) {
    const A = this.api, p = w.player, dung = w.zone.id === b.bai && (!A.laQc(b.bai) || w.chung);
    if (!dung) {
      this.bossT = null;
      if (!A.moBai(b.bai)) { this.thoi("st", `bãi có ${b.ten} chưa đủ cấp vào`); return; }
      this.ghiNha(h, w);
      if (A.laThanh(w.zone)) { this.dang = `đi Xa phu tới ${b.ten}`; A.xe({ sat: 1 }); return; }
      if (A.laBai(w.zone)) { this.dang = `về thành đi hạ ${b.ten}`; if (!A.veThanh(`đi hạ ${b.ten}`, null)) this.thoi("st", "không về thành được (hết Thổ Địa Phù?)"); }
      return;
    }
    const nv = (h.satThu || {}).nv | 0, m = w.mobs.find((x) => x.alive && x.sat === nv);
    const xa = ldist(p.x, p.y, b.x, b.y);
    if (m && ldist(p.x, p.y, m.x, m.y) <= 700) { this.dang = `đánh ${b.ten}`; this.bossT = null; return; } // World.nearestMob nhắm boss (satUu)
    if (!this.bossT || this.bossT.nv !== nv) this.bossT = { nv, t0: 0 };
    this.dang = m ? `chạy tới ${b.ten}` : xa > 200 ? `chạy tới chỗ ${b.ten}` : `chờ ${b.ten} xuất hiện`;
    if (xa <= 200) {
      if (!this.bossT.t0) this.bossT.t0 = performance.now();
      if (!m && performance.now() - this.bossT.t0 > CHO_BOSS) this.thoi("st", `chờ ${b.ten} quá 5 phút không thấy`);
      return;
    }
    if (!p.goal && !p.target) w.walkTo(m ? m.x : b.x, m ? m.y : b.y);
  },
  // bị hạ khi đang có nhiệm vụ Sát thủ ở bãi của boss: đếm, đủ CHET_TOI_DA thì thôi
  demChet(h, w) {
    const S = h.satThu || {}, chet = w.player.hp <= 0;
    if (chet && !this.chetDem) {
      const b = S.nv && this.api.satBoss(S.nv);
      if (b && w.zone.id === b.bai && this.bat(h).st) {
        const c = (this.s.chet = this.s.chet && this.s.chet.nv === S.nv ? this.s.chet : { nv: S.nv, n: 0 });
        if (++c.n >= CHET_TOI_DA) this.thoi("st", `bị ${b.ten} hạ ${c.n} lần`);
      }
    }
    this.chetDem = chet;
  },

  // đánh quái cho Dã Tẩu: thu thập địa đồ ở bãi của nhiệm vụ; còn lại ở bãi treo máy (đang ở bãi luyện công nào cũng được)
  diDanh(h, w, bai) {
    const A = this.api;
    if (A.laBai(w.zone) && (bai == null || w.zone.id === bai)) { this.dang = "đánh quái cho nhiệm vụ Dã Tẩu"; return; }
    if (A.laThanh(w.zone)) {
      this.ghiNha(h, w);
      const o = bai != null ? { z: bai, c: 0 } : A.baiTreo();
      if (!o) { this.thoi("dt", "chưa có bãi để đánh quái (chọn bãi treo máy ở thẻ Đánh quái)"); return; }
      if (!A.moBai(o.z)) { this.thoi("dt", "bãi của nhiệm vụ chưa đủ cấp vào"); return; }
      this.dang = "đi Xa phu tới bãi đánh quái cho Dã Tẩu"; A.xe({ bai: o.z, c: o.c });
      return;
    }
    if (A.laBai(w.zone)) { this.dang = "đổi bãi cho nhiệm vụ Dã Tẩu"; this.ghiNha(h, w); if (!A.veThanh("đổi bãi cho Dã Tẩu", null)) this.thoi("dt", "không về thành được (hết Thổ Địa Phù?)"); }
  },
};
