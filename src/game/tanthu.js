// Chỉ đường tân thủ (anh 10/11 — mẫu B, "người mới không bị lạc ngay bước đầu"). Mỗi lúc 1 việc, đứng đầu bảng Nhiệm vụ góc trái (hud.setNhiemVu); điện thoại: 1 dòng dưới bản đồ nhỏ
// (#dt .dt-chidan). Chữ xanh bấm được (khóa tt:… — main.js bamNhiemVu -> bam), NPC của bước có mũi tên trên đầu (World.chiDan). Bước tự xong theo trạng thái nhân vật; 2 bước đọc (ủy
// thác, kiếm đồ) xong khi bấm Đã hiểu. Đọc kỹ hơn: F1, 4 mục đầu của giupdo.js (mẫu A). Chỉ hiện cho nhân vật dưới CAP_TOI cấp, chưa xong, chưa tắt.
//   new TanThu(api) · nhom() -> nhóm đầu bảng Nhiệm vụ | null (gọi mỗi nhịp bảng nhiệm vụ: đặt luôn mũi tên, dòng điện thoại) · bam(a, x) chữ xanh
//   hero.chiDan (trình duyệt lưu, không phải trường máy chủ giữ): { tt: đã mở Trợ Thủ, ut / kd: đã đọc ủy thác / kiếm đồ, tat: người chơi tắt, xong: hết bước }
const CAP_TOI = 60;
const BA_LANG = 53;
const XANH = [55, 231, 63], VANG = [255, 235, 120], XAM = [170, 165, 150];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rgb = (c) => `rgb(${c.join(",")})`;

export class TanThu {
  constructor(api) { this.api = api; this.tiepDan = []; this.dtEl = null; this.dtSig = ""; }

  nhom() {
    const A = this.api, h = A.hero(), w = A.world(); if (!h || !w) return null;
    const C = (h.chiDan = h.chiDan || {}), B = (h.lvl | 0) < CAP_TOI && !C.tat && !C.xong ? this._buoc(h, w, C) : null;
    w.chiDan = (B && B.mui) || null;
    this._veDt(B);
    return B && { ten: `Tân thủ · Bước ${B.so} / ${B.tong}`, muc: [{ ten: B.ten, dong: [...B.dong, [["Tắt chỉ dẫn", XAM, "tt:tat"]]] }] };
  }

  // đệ tử tiếp dẫn cùng hệ ở thành đang đứng, gần trước (mỗi hệ 2 phái)
  _dsTiepDan(h, w) {
    const A = this.api, p = w.player, keys = new Set((A.P.factions || []).filter((f) => f.series === h.series).map((f) => f.key));
    return w.npcs.filter((n) => n.key && keys.has(n.key)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  }

  _buoc(h, w, C) {
    const A = this.api, z = w.zone, lv = h.lvl | 0 || 1, oBai = A.laBai(z), oThanh = A.laThanh(z), auto = !!w.auto;
    if (A.P.hud.ttOpen && !C.tt) { C.tt = 1; A.save(); } // mở Trợ Thủ bằng nút / phím K cũng tính
    const xp = oThanh ? A.xaPhu(w) : null, nutA = ["Tự đánh", XANH, "tt:auto"], nutXp = ["Xa phu", XANH, "tt:xp"];
    const b = A.baiTreo(), zb = b && A.zones().find((x) => x.id === b.z), tenBai = zb ? zb.n : "bãi luyện công", U = A.luat().uyThac || {};
    const nutDoc = (muc, k) => [["Xem thêm", XANH, "tt:st:" + muc], ["   "], ["Đã hiểu", XANH, "tt:ok:" + k]];
    const ds = [
      ["Ra bãi luyện công", oBai || h.farmZone != null || lv >= 10, () => (auto && oThanh
        ? { dong: [[["Đang chạy tới "], nutXp, [` để ra ${tenBai}`]]], mui: xp }
        : { dong: [[["Trong thành không có quái, phải ra bãi mới lên cấp."]], [["Bấm "], nutA, [` để tự chạy ra ${tenBai}`]], [["hoặc tới "], nutXp, [" → Khu vực luyện công"]]], dt: [["Bấm "], nutA, [` để tự chạy ra ${tenBai}`]], mui: xp })],
      ["Luyện tới cấp 10", lv >= 10, () => (!oBai
        ? { dong: [[["Bấm "], nutA, [` để quay lại ${tenBai}`]]], mui: xp }
        : auto ? { dong: [[["Đang tự đánh, cần lên cấp 10 (đang "], [String(lv), VANG], [")"]], [["Đồ rơi dưới đất: bấm vào để nhặt."]]] }
          : { dong: [[["Bấm "], nutA, [" (phím Space) để tự đánh quái"]]], dt: [["Bấm "], nutA, [" để tự đánh quái"]] })],
      ["Nhận quà cấp 10", (Array.isArray(h.thuongCap) && h.thuongCap.includes(10)) || h.fac != null, () => ({ dong: [[["Bấm "], ["Nhận quà cấp 10", XANH, "tt:thuong"], [": tiền, thuốc, Thổ Địa Phù"]]] })],
      ["Về Ba Lăng nhập phái", h.fac != null, () => {
        if (!oThanh) return { dong: A.phu() ? [[["Dùng "], ["Thổ Địa Phù", XANH, "tt:phu"], [" để về Ba Lăng huyện"]]] : [[["Cần Thổ Địa Phù để về thành (Tạp hóa bán)."]]] };
        if (z.id !== BA_LANG) return { dong: [[["Tới "], nutXp, [" → Những thành thị đã đi qua → Ba Lăng huyện"]]], mui: xp };
        const L = (this.tiepDan = this._dsTiepDan(h, w)), dong = [["Gặp "]];
        L.slice(0, 2).forEach((n, i) => { if (i) dong.push([" hoặc "]); dong.push([n.name, XANH, "tt:n:" + i]); });
        return { dong: [dong, [["để gia nhập môn phái."]]], mui: L[0] || null };
      }],
      ["Cộng điểm, chọn chiêu", Object.values(h.skills || {}).some((v) => v > 0) && !!(h.oChieu || {}).trai, () => ({
        dong: [[["Mở "], ["Võ công", XANH, "tt:vc"], [" (F5) cộng điểm vào chiêu"]], [["Bấm ô T ở thanh dưới để chọn chiêu đánh"]], [["Mở "], ["Nhân vật", XANH, "tt:nv"], [" (F3) cộng điểm tiềm năng"]]],
        dt: [["Mở "], ["Võ công", XANH, "tt:vc"], [" cộng điểm, rồi mở khóa ô T để chọn chiêu"]] })],
      ["Cài Trợ Thủ", !!C.tt, () => ({ dong: [[["Mở "], ["Trợ Thủ", XANH, "tt:tt"], [" (phím K) để cài tự uống thuốc,"]], [["tự nhặt đồ, tự về thành bán đồ mua thuốc."]]], dt: [["Mở "], ["Trợ Thủ", XANH, "tt:tt"], [" để cài tự uống thuốc, tự nhặt đồ"]] })],
      ["Ủy thác khi tắt game", !!C.ut, () => ({ dong: [[["Đang tự đánh ở bãi mà thoát game: máy chủ"]], [["cày thay "], [`${Math.round((U.tiLe || 0.7) * 100)}% tốc độ`, VANG], [`, tối đa ${U.gioNgay || 12} giờ mỗi ngày.`]], [["Cần giờ Bạch Câu Hoàn."]], nutDoc(2, "ut")], dt: [["Thoát game lúc đang tự đánh: máy chủ cày thay. "], ...nutDoc(2, "ut")] })],
      ["Kiếm đồ", !!C.kd, () => ({ dong: [[["Quái ở bãi đúng cấp rơi đồ xuống đất, phải"]], [["nhặt hoặc để Trợ Thủ nhặt. Đồ xanh có 1–6 dòng."]], nutDoc(3, "kd")], dt: [["Quái rơi đồ xuống đất, phải nhặt hoặc để Trợ Thủ nhặt. "], ...nutDoc(3, "kd")] })],
    ];
    const i = ds.findIndex((d) => !d[1]);
    if (i < 0) { C.xong = 1; A.save(); A.msg("Đã xong chỉ dẫn tân thủ — cần xem lại: F1 → Bắt đầu chơi"); return null; }
    return { so: i + 1, tong: ds.length, ten: ds[i][0], ...ds[i][2]() };
  }

  // điện thoại: bảng Nhiệm vụ không nằm trên cảnh -> 1 dòng dưới bản đồ nhỏ
  _veDt(B) {
    const D = this.api.DT(), on = !!(D && D.on && B);
    if (!on) { if (this.dtEl) this.dtEl.style.display = "none"; this.dtSig = ""; return; }
    if (!this.dtEl) {
      const goc = document.getElementById("dt"); if (!goc) return;
      const el = (this.dtEl = document.createElement("div")); el.className = "dt-chidan";
      el.onclick = (e) => { const k = e.target.closest("[data-k]"); if (k) this.api.bam(k.dataset.k); };
      goc.appendChild(el);
    }
    const L = B.dt || B.dong[0], sig = B.so + JSON.stringify(L);
    this.dtEl.style.display = "";
    if (sig === this.dtSig) return;
    this.dtSig = sig;
    const doan = ([t, mau, k]) => `<span${k ? ` class="bam" data-k="${esc(k)}"` : ""}${mau ? ` style="color:${rgb(mau)}"` : ""}>${esc(t)}</span>`;
    this.dtEl.innerHTML = `<b>Tân thủ ${B.so}/${B.tong}:</b> ${L.map(doan).join("")}<i class="dt-chidan-x" data-k="tt:tat">✕</i>`;
  }

  bam(a, x) {
    const A = this.api, w = A.world(), h = A.hero(), GW = A.GW(), D = A.DT(); if (!w || !h) return;
    const C = (h.chiDan = h.chiDan || {}), mo = (k) => (D && D.on ? D.mo(k) : GW && GW.toggle(k)), toi = (n, ten) => { if (n) { w.clickNpc(n); A.msg("Tìm đường tới " + ten); } };
    A.P.audio.ui("click");
    if (a === "auto") { if (!w.auto) A.toggleAuto(); return; }
    if (a === "xp") return toi(A.xaPhu(w), "Xa phu");
    if (a === "n") { const n = this.tiepDan[+x]; return toi(n, n && n.name); }
    if (a === "thuong") return A.thuongCap();
    if (a === "phu") { const b = A.phu(); if (b) A.dungPhu(b); return; }
    if (a === "vc") return void mo("Skills");
    if (a === "nv") return void mo("Status");
    if (a === "tt") { C.tt = 1; A.save(); return D && D.on ? void mo("TroThu") : A.troThu(); }
    if (a === "st") return GW && GW.openGiupDo(+x);
    if (a === "ok") { C[x] = 1; return A.save(); }
    if (a === "tat") { C.tat = 1; A.save(); return A.msg("Đã tắt chỉ dẫn tân thủ — cần xem lại: F1 → Bắt đầu chơi"); }
  }
}
