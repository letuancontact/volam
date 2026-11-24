// Chỉ đường & Cẩm nang Tân thủ (PC + Mobile):
//   - Bảng Cẩm nang Tân thủ (#vl-tt-modal): kéo thả tự do trên PC, cuộn mượt không bị reset scrollTop mỗi nhịp 400ms,
//     tự nhường lớp hiển thị (hạ z-index / tự đóng trên Mobile) khi người chơi mở cửa sổ khác để không bao giờ che nội dung.
//   - Nút Cẩm nang (#vl-tt-fab): z-index: 3 (nằm dưới mọi cửa sổ #jxwin / .dv.qt / #hd-dt), kéo thả tự do sang góc bất kỳ.
//   - Mobile: thẻ mục tiêu có nút hành động 1 chạm (#dt .dt-chidan), chừa khoảng cho Khóa an toàn (.dt-kat).
const CAP_TOI = 60;
const BA_LANG = 53;
const XANH = [55, 231, 63], VANG = [255, 235, 120], XAM = [170, 165, 150];
const FAB_POS_KEY = "vl_tt_fab_pos";
const WIN_POS_KEY = "vl_tt_win_pos";
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rgb = (c) => `rgb(${c.join(",")})`;

function readPos(key) {
  try {
    if (typeof localStorage === "undefined") return null;
    const j = JSON.parse(localStorage.getItem(key) || "null");
    return j && Number.isFinite(j.x) && Number.isFinite(j.y) ? j : null;
  } catch { return null; }
}
function savePos(key, x, y) {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify({ x: Math.round(x), y: Math.round(y) })); } catch {}
}

export class TanThu {
  constructor(api) {
    this.api = api;
    this.tiepDan = [];
    this.dtEl = null;
    this.dtSig = "";
    this.fabEl = null;
    this.fabSig = "";
    this.modalEl = null;
    this.modalBox = null;
    this.modalOpen = false;
    this.modalTop = true;
    this.modalSig = "";
    this.modalTabRendered = "";
    this.tab = "loTrinh";
    this._heroKey = "";
    this._autoShown = new Set();
    this._autoTimer = null;
    this._escHandler = null;
    this._docDownHandler = null;
    this._lastWinSet = new Set();
    this._winPosInit = false;
  }

  nhom() {
    const A = this.api, h = A.hero(), w = A.world(); if (!h || !w) return null;
    const key = `${h.name || ""}:${h.slot ?? 0}`;
    if (this._heroKey !== key) {
      this._heroKey = key;
      if (this.modalOpen) this._dongModal();
      if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
    }
    const C = (h.chiDan = h.chiDan || {});
    const st = this._tinhTrang(h, w, C);
    const active = (h.lvl | 0) < CAP_TOI && !C.tat && !C.xong && st.buoc;
    const B = active ? st.buoc : null;
    w.chiDan = (B && B.mui) || null;

    // Tự mở Cẩm nang 1 lần duy nhất cho nhân vật mới cấp <= 5 khi chưa từng thấy
    if (B && (h.lvl | 0) <= 5 && !C.chao && !w.tk && !this._autoShown.has(key) && !this._autoTimer) {
      this._autoShown.add(key);
      this._autoTimer = setTimeout(() => {
        this._autoTimer = null;
        const h2 = this.api.hero(), w2 = this.api.world();
        if (!h2 || !w2 || w2.tk) return;
        const c2 = (h2.chiDan = h2.chiDan || {});
        if (c2.chao || c2.tat || c2.xong) return;
        c2.chao = 1;
        this.api.save();
        this.moCamNang("loTrinh");
      }, 750);
    }

    this._veDt(B, st);
    this._veFab(B, st, w);

    if (this.modalOpen) {
      this._kiemTraCuaSoKhac();
      if (this.modalOpen) this._veModal(st, false);
    }

    return B && {
      ten: `Tân thủ · Bước ${B.so} / ${B.tong}`,
      muc: [{
        ten: B.ten,
        dong: [
          ...B.dong,
          [["Mở Cẩm nang", VANG, "tt:mo"], ["  ·  ", XAM], ["Tắt", XAM, "tt:tat"]]
        ]
      }]
    };
  }

  _isMobile() {
    const D = this.api.DT && this.api.DT();
    return !!(D && D.on);
  }

  // Quét các cửa sổ khác đang mở để Cẩm nang tự nhường chỗ (không bao giờ đè lên)
  _dsCuaSoMo() {
    const out = new Set();
    if (typeof document === "undefined") return out;
    const addVis = (sel, prefix) => {
      document.querySelectorAll(sel).forEach((el, idx) => {
        const st = el.style;
        const vis = st.display !== "none" && el.offsetParent !== null;
        if (vis) out.add(prefix + ":" + (el.id || el.dataset.win || el.className || idx));
      });
    };
    addVis("#jxwin > *", "jw");
    addVis(".dv", "dv");
    const hd = document.getElementById("hd-dt");
    if (hd && hd.offsetParent !== null) out.add("hd-dt");
    const kat = document.getElementById("kat");
    if (kat && kat.offsetParent !== null) out.add("kat");
    const b = document.body;
    if (b && (b.classList.contains("dt-cs") || b.classList.contains("dt-chat") || b.classList.contains("dt-luoi"))) {
      out.add("dt-ui");
    }
    return out;
  }

  _kiemTraCuaSoKhac() {
    const cur = this._dsCuaSoMo();
    let hasNew = false;
    for (const k of cur) if (!this._lastWinSet.has(k)) { hasNew = true; break; }
    this._lastWinSet = cur;
    if (hasNew) {
      if (this._isMobile()) this._dongModal();
      else this._setModalTop(false);
    }
  }

  _setModalTop(on) {
    this.modalTop = !!on;
    if (this.modalEl) this.modalEl.classList.toggle("top", this.modalTop);
  }

  // đệ tử tiếp dẫn cùng hệ ở thành đang đứng, gần trước (mỗi hệ 2 phái)
  _dsTiepDan(h, w) {
    const A = this.api, p = w.player, keys = new Set((A.P.factions || []).filter((f) => f.series === h.series).map((f) => f.key));
    return w.npcs.filter((n) => n.key && keys.has(n.key)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  }

  _tinhTrang(h, w, C) {
    const A = this.api, z = w.zone, lv = h.lvl | 0 || 1, oBai = A.laBai(z), oThanh = A.laThanh(z), auto = !!w.auto;
    if (A.P && A.P.hud && A.P.hud.ttOpen && !C.tt) { C.tt = 1; A.save(); }
    const xp = oThanh ? A.xaPhu(w) : null, nutA = ["Tự đánh", XANH, "tt:auto"], nutXp = ["Xa phu", XANH, "tt:xp"];
    const b = A.baiTreo(), zb = b && A.zones().find((x) => x.id === b.z), tenBai = zb ? zb.n : "bãi luyện công", U = A.luat().uyThac || {};
    const nutDoc = (muc, k) => [["Xem thêm", XANH, "tt:st:" + muc], ["   "], ["Đã hiểu", XANH, "tt:ok:" + k]];
    const tiepDan = oThanh && z && z.id === BA_LANG ? (this.tiepDan = this._dsTiepDan(h, w)) : [];
    const tenPhai = tiepDan.slice(0, 2).map((n) => n.name).join(" / ") || "Đệ tử tiếp dẫn";

    const ds = [
      {
        ten: "Ra bãi luyện công",
        tomTat: `Trong thành không có quái. Bấm Tự đánh để nhân vật tự gặp Xa phu ra ${tenBai}.`,
        xong: oBai || h.farmZone != null || lv >= 10,
        chiTiet: () => (auto && oThanh
          ? {
              dong: [[["Đang chạy tới "], nutXp, [` để ra ${tenBai}`]]],
              dtText: `Đang chạy tới Xa phu để ra ${tenBai}`,
              actLabel: "Tới Xa phu", actKey: "tt:xp", mui: xp
            }
          : {
              dong: [[["Trong thành không có quái, phải ra bãi mới lên cấp."]], [["Bấm "], nutA, [` để tự chạy ra ${tenBai}`]], [["hoặc tới "], nutXp, [" → Khu vực luyện công"]]],
              dtText: `Ra ${tenBai} để bắt đầu luyện cấp`,
              actLabel: "Tự chạy ra bãi ▶", actKey: "tt:auto",
              secLabel: "Gặp Xa phu", secKey: "tt:xp", mui: xp
            })
      },
      {
        ten: "Luyện tới cấp 10",
        tomTat: "Bật Tự đánh (phím Space) để nhân vật tự đánh quái lên cấp 10. Chạm đồ rơi để nhặt.",
        xong: lv >= 10,
        chiTiet: () => (!oBai
          ? {
              dong: [[["Bấm "], nutA, [` để quay lại ${tenBai}`]]],
              dtText: `Cần ra ${tenBai} luyện lên cấp 10 (hiện cấp ${lv})`,
              actLabel: "Quay lại bãi ▶", actKey: "tt:auto", mui: xp
            }
          : auto
            ? {
                dong: [[["Đang tự đánh, cần lên cấp 10 (đang "], [String(lv), VANG], [")"]], [["Đồ rơi dưới đất: bấm vào để nhặt."]]],
                dtText: `Đang tự đánh lên cấp 10 (hiện cấp ${lv}/10)`,
                actLabel: `Đang luyện (${lv}/10)`, actKey: ""
              }
            : {
                dong: [[["Bấm "], nutA, [" (phím Space) để tự đánh quái"]]],
                dtText: `Bật Tự đánh để luyện lên cấp 10 (hiện cấp ${lv})`,
                actLabel: "Bật Tự đánh ▶", actKey: "tt:auto"
              })
      },
      {
        ten: "Nhận quà cấp 10",
        tomTat: "Nhận thưởng mốc cấp 10 để lấy ngân lượng, thuốc hồi phục và Thổ Địa Phù về thành.",
        xong: (Array.isArray(h.thuongCap) && h.thuongCap.includes(10)) || h.fac != null,
        chiTiet: () => ({
          dong: [[["Bấm "], ["Nhận quà cấp 10", XANH, "tt:thuong"], [": tiền, thuốc, Thổ Địa Phù"]]],
          dtText: "Đạt cấp 10! Nhận ngay tiền, thuốc và Thổ Địa Phù",
          actLabel: "Nhận quà cấp 10 ▶", actKey: "tt:thuong"
        })
      },
      {
        ten: "Về Ba Lăng nhập phái",
        tomTat: `Dùng Thổ Địa Phù về Ba Lăng huyện, gặp ${tenPhai} để gia nhập môn phái học võ công.`,
        xong: h.fac != null,
        chiTiet: () => {
          if (!oThanh) {
            return A.phu()
              ? {
                  dong: [[["Dùng "], ["Thổ Địa Phù", XANH, "tt:phu"], [" để về Ba Lăng huyện"]]],
                  dtText: "Dùng Thổ Địa Phù về Ba Lăng huyện nhập phái",
                  actLabel: "Dùng Thổ Địa Phù ▶", actKey: "tt:phu"
                }
              : {
                  dong: [[["Cần Thổ Địa Phù để về thành (Tạp hóa bán)."]]],
                  dtText: "Về Ba Lăng huyện để gia nhập môn phái",
                  actLabel: "Xem hướng dẫn", actKey: "tt:st:0"
                };
          }
          if (z.id !== BA_LANG) {
            return {
              dong: [[["Tới "], nutXp, [" → Những thành thị đã đi qua → Ba Lăng huyện"]]],
              dtText: "Gặp Xa phu để về Ba Lăng huyện nhập phái",
              actLabel: "Tới Xa phu ▶", actKey: "tt:xp", mui: xp
            };
          }
          const L = tiepDan, dong = [["Gặp "]];
          L.slice(0, 2).forEach((n, i) => { if (i) dong.push([" hoặc "]); dong.push([n.name, XANH, "tt:n:" + i]); });
          return {
            dong: [dong, [["để gia nhập môn phái."]]],
            dtText: `Gặp ${tenPhai} để nhập phái`,
            actLabel: L[0] ? `Gặp ${L[0].name} ▶` : "Tìm Đệ tử tiếp dẫn",
            actKey: L[0] ? "tt:n:0" : "",
            secLabel: L[1] ? `Gặp ${L[1].name}` : "",
            secKey: L[1] ? "tt:n:1" : "",
            mui: L[0] || null
          };
        }
      },
      {
        ten: "Cộng điểm, chọn chiêu",
        tomTat: "Mở Võ công (F5) cộng điểm kỹ năng, gắn chiêu vào ô tay trái T, rồi mở Nhân vật (F3) cộng tiềm năng.",
        xong: Object.values(h.skills || {}).some((v) => v > 0) && !!(h.oChieu || {}).trai,
        chiTiet: () => ({
          dong: [[["Mở "], ["Võ công", XANH, "tt:vc"], [" (F5) cộng điểm vào chiêu"]], [["Bấm ô T ở thanh dưới để chọn chiêu đánh"]], [["Mở "], ["Nhân vật", XANH, "tt:nv"], [" (F3) cộng điểm tiềm năng"]]],
          dtText: "Cộng điểm Võ công rồi chọn chiêu vào ô T",
          actLabel: "Mở Võ công ▶", actKey: "tt:vc",
          secLabel: "Mở Nhân vật", secKey: "tt:nv"
        })
      },
      {
        ten: "Cài Trợ Thủ (Auto)",
        tomTat: "Mở Trợ Thủ (phím K) để cài tự uống thuốc máu/nội lực, tự nhặt đồ xanh và tự về thành bán đồ.",
        xong: !!C.tt,
        chiTiet: () => ({
          dong: [[["Mở "], ["Trợ Thủ", XANH, "tt:tt"], [" (phím K) để cài tự uống thuốc,"]], [["tự nhặt đồ, tự về thành bán đồ mua thuốc."]]],
          dtText: "Cài tự uống thuốc & nhặt đồ trong Trợ Thủ",
          actLabel: "Mở Trợ Thủ ▶", actKey: "tt:tt"
        })
      },
      {
        ten: "Ủy thác khi tắt game",
        tomTat: `Đang tự đánh ở bãi mà thoát game: máy chủ tự cày ${Math.round((U.tiLe || 0.7) * 100)}% tốc độ (tối đa ${U.gioNgay || 12} giờ/ngày khi có giờ Bạch Câu Hoàn).`,
        xong: !!C.ut,
        chiTiet: () => ({
          dong: [[["Đang tự đánh ở bãi mà thoát game: máy chủ"]], [["cày thay "], [`${Math.round((U.tiLe || 0.7) * 100)}% tốc độ`, VANG], [`, tối đa ${U.gioNgay || 12} giờ mỗi ngày.`]], [["Cần giờ Bạch Câu Hoàn."]], nutDoc(2, "ut")],
          dtText: "Thoát game khi đang tự đánh sẽ tự cày ủy thác",
          actLabel: "Đã hiểu ✓", actKey: "tt:ok:ut",
          secLabel: "Xem chi tiết", secKey: "tt:st:2"
        })
      },
      {
        ten: "Kiếm đồ & Hoạt động",
        tomTat: "Quái ở bãi đúng cấp rơi trang bị xanh 1–6 dòng & ngân lượng. Bật nhặt đồ ở Trợ Thủ và xem lịch Hoạt động mỗi ngày.",
        xong: !!C.kd,
        chiTiet: () => ({
          dong: [[["Quái ở bãi đúng cấp rơi đồ xuống đất, phải"]], [["nhặt hoặc để Trợ Thủ nhặt. Đồ xanh có 1–6 dòng."]], nutDoc(3, "kd")],
          dtText: "Săn đồ xanh 1–6 dòng & tham gia hoạt động hằng ngày",
          actLabel: "Hoàn tất ✓", actKey: "tt:ok:kd",
          secLabel: "Xem chi tiết", secKey: "tt:st:3"
        })
      }
    ];

    const i = ds.findIndex((d) => !d.xong);
    const doneCount = ds.filter((d) => d.xong).length;
    if (i < 0 && !C.xong && (h.lvl | 0) < CAP_TOI) {
      C.xong = 1;
      A.save();
      A.msg("Đã hoàn tất toàn bộ 8 bước tân thủ — bấm Cẩm nang hoặc F1 để xem lại bất cứ lúc nào");
    }
    const buoc = i >= 0 ? { so: i + 1, tong: ds.length, ten: ds[i].ten, tomTat: ds[i].tomTat, ...ds[i].chiTiet() } : null;
    return { ds, idx: i, doneCount, tong: ds.length, buoc, C, h, w };
  }

  _host() {
    return (typeof document !== "undefined" && (document.getElementById("s-game") || document.body)) || null;
  }

  // Điện thoại: thẻ mục tiêu tân thủ gọn, có nút hành động lớn bấm 1 chạm
  _veDt(B) {
    const D = this.api.DT(), on = !!(D && D.on && B);
    if (!on) { if (this.dtEl) this.dtEl.style.display = "none"; this.dtSig = ""; return; }
    if (!this.dtEl) {
      const goc = typeof document !== "undefined" && document.getElementById("dt"); if (!goc) return;
      const el = (this.dtEl = document.createElement("div")); el.className = "dt-chidan";
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
      el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
      el.onclick = (e) => {
        e.stopPropagation();
        const k = e.target.closest("[data-k]");
        if (k && k.dataset.k) this.api.bam(k.dataset.k);
      };
      goc.appendChild(el);
    }
    const sig = [B.so, B.ten, B.dtText, B.actLabel, B.actKey].join("|");
    this.dtEl.style.display = "";
    if (sig === this.dtSig) return;
    this.dtSig = sig;
    const actBtn = B.actKey
      ? `<button type="button" class="dt-cd-go" data-k="${esc(B.actKey)}">${esc(B.actLabel)}</button>`
      : `<span class="dt-cd-ing">${esc(B.actLabel || "Đang thực hiện")}</span>`;
    this.dtEl.innerHTML =
      `<div class="dt-cd-main"><b>Tân thủ ${B.so}/${B.tong}: ${esc(B.ten)}</b><span>${esc(B.dtText || "")}</span></div>` +
      `<div class="dt-cd-ops">${actBtn}<button type="button" class="dt-cd-book" data-k="tt:mo" title="Mở Cẩm nang Tân thủ">Cẩm nang</button><i class="dt-chidan-x" data-k="tt:tat" title="Ẩn thanh nhắc">✕</i></div>`;
  }

  // Nút mở nhanh Cẩm nang (cả PC & Mobile): z-index 3 (dưới cửa sổ game), kéo thả tự do sang góc bất kỳ
  _veFab(B, st, w) {
    const host = this._host(); if (!host) return;
    if (!this.fabEl) {
      const el = (this.fabEl = document.createElement("button"));
      el.type = "button";
      el.id = "vl-tt-fab";
      el.className = "vl-tt-fab";
      const saved = readPos(FAB_POS_KEY);
      if (saved && typeof window !== "undefined") {
        const x = Math.max(6, Math.min(window.innerWidth - 110, saved.x));
        const y = Math.max(6, Math.min(window.innerHeight - 34, saved.y));
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.transform = "none";
      }
      let drag = null, moved = false;
      el.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        if (e.button && e.button !== 0) return;
        const r = el.getBoundingClientRect();
        drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
        moved = false;
        if (el.setPointerCapture) try { el.setPointerCapture(e.pointerId); } catch {}
      });
      el.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!moved && Math.hypot(dx, dy) > 6) moved = true;
        if (moved && typeof window !== "undefined") {
          const r = el.getBoundingClientRect();
          const nx = Math.max(4, Math.min(window.innerWidth - r.width - 4, drag.ox + dx));
          const ny = Math.max(4, Math.min(window.innerHeight - r.height - 4, drag.oy + dy));
          el.style.left = nx + "px";
          el.style.top = ny + "px";
          el.style.transform = "none";
          el.classList.add("keo");
        }
      });
      const endDrag = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (moved) {
          const r = el.getBoundingClientRect();
          savePos(FAB_POS_KEY, r.left, r.top);
          el.dataset.dragAt = String(Date.now());
        }
        el.classList.remove("keo");
        drag = null;
      };
      el.addEventListener("pointerup", endDrag);
      el.addEventListener("pointercancel", endDrag);
      el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
      el.onclick = (e) => {
        e.stopPropagation();
        if (Date.now() - (+el.dataset.dragAt || 0) < 250) return;
        this.api.P.audio.ui("click");
        if (this.modalOpen && this.modalTop) this._dongModal();
        else this.moCamNang("loTrinh");
      };
      host.appendChild(el);
    }
    const isDt = this._isMobile();
    const hide = !!w.tk;
    this.fabEl.style.display = hide ? "none" : "";
    this.fabEl.classList.toggle("co-buoc", !!B);
    this.fabEl.classList.toggle("dt-co-bar", isDt && !!B);
    const label = B ? `Cẩm nang (${B.so}/${B.tong})` : "Cẩm nang";
    const sig = label + "|" + (B ? 1 : 0) + "|" + (hide ? 1 : 0);
    if (sig === this.fabSig) return;
    this.fabSig = sig;
    this.fabEl.innerHTML = `<i>?</i><span>${esc(label)}</span>`;
    this.fabEl.title = "Bấm để mở/đóng Cẩm nang Tân thủ · Kéo giữ để di chuyển nút";
  }

  moCamNang(tab) {
    if (tab) this.tab = tab;
    this.modalOpen = true;
    this.modalTop = true;
    this.modalSig = "";
    const h = this.api.hero(), w = this.api.world();
    if (!h || !w) return;
    this._heroKey = `${h.name || ""}:${h.slot ?? 0}`;
    const C = (h.chiDan = h.chiDan || {});
    if (!C.chao) { C.chao = 1; this.api.save(); }
    this._lastWinSet = this._dsCuaSoMo();
    this._veModal(this._tinhTrang(h, w, C), true);
  }

  _dongModal() {
    this.modalOpen = false;
    this.modalSig = "";
    if (this.modalEl) {
      this.modalEl.classList.remove("on");
      this.modalEl.classList.remove("top");
    }
    if (this._escHandler && typeof removeEventListener === "function") {
      removeEventListener("keydown", this._escHandler, true);
      this._escHandler = null;
    }
    if (this._docDownHandler && typeof document !== "undefined") {
      document.removeEventListener("pointerdown", this._docDownHandler, true);
      this._docDownHandler = null;
    }
  }

  _datViTriBox() {
    const box = this.modalBox;
    if (!box || typeof window === "undefined") return;
    if (this._isMobile()) {
      box.style.left = "";
      box.style.top = "";
      box.style.transform = "";
      return;
    }
    const bw = Math.min(620, window.innerWidth - 24);
    const bh = Math.min(580, Math.round(window.innerHeight * 0.82));
    const saved = readPos(WIN_POS_KEY);
    const x = saved ? Math.max(8, Math.min(window.innerWidth - bw - 8, saved.x)) : Math.max(8, Math.round((window.innerWidth - bw) / 2));
    const y = saved ? Math.max(8, Math.min(window.innerHeight - 120, saved.y)) : Math.max(24, Math.round((window.innerHeight - bh) / 2));
    box.style.left = x + "px";
    box.style.top = y + "px";
    box.style.transform = "none";
  }

  _taoKhungModal(host) {
    const wrap = (this.modalEl = document.createElement("div"));
    wrap.id = "vl-tt-modal";
    wrap.className = "vl-tt-modal";
    wrap.innerHTML = `<div class="vtt-box" role="dialog" aria-label="Cẩm nang Tân thủ">
      <div class="vtt-head" title="Kéo thanh này để di chuyển cửa sổ">
        <div class="vtt-title"><b>Cẩm nang Tân thủ</b><span>Hướng dẫn khởi đầu · Kéo thanh tiêu đề để di chuyển</span></div>
        <button type="button" class="vtt-x" data-act="close" title="Đóng (Esc)">✕</button>
      </div>
      <div class="vtt-tabs">
        <button type="button" data-tab="loTrinh">Lộ trình 8 bước</button>
        <button type="button" data-tab="dieuKhien">Điều khiển</button>
        <button type="button" data-tab="meo">Mẹo cày nhanh</button>
      </div>
      <div class="vtt-body"></div>
      <div class="vtt-foot"></div>
    </div>`;

    const box = (this.modalBox = wrap.querySelector(".vtt-box"));
    const head = box.querySelector(".vtt-head");

    // Kéo thả cửa sổ Cẩm nang trên PC bằng thanh tiêu đề
    let drag = null;
    head.addEventListener("pointerdown", (e) => {
      if (this._isMobile() || (e.button && e.button !== 0)) return;
      if (e.target.closest("[data-act='close']")) return;
      e.stopPropagation();
      this._setModalTop(true);
      const r = box.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
      head.classList.add("keo");
      if (head.setPointerCapture) try { head.setPointerCapture(e.pointerId); } catch {}
    });
    head.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id || typeof window === "undefined") return;
      const r = box.getBoundingClientRect();
      const nx = Math.max(8, Math.min(window.innerWidth - r.width - 8, drag.ox + (e.clientX - drag.sx)));
      const ny = Math.max(8, Math.min(window.innerHeight - 64, drag.oy + (e.clientY - drag.sy)));
      box.style.left = nx + "px";
      box.style.top = ny + "px";
      box.style.transform = "none";
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const r = box.getBoundingClientRect();
      savePos(WIN_POS_KEY, r.left, r.top);
      head.classList.remove("keo");
      drag = null;
    };
    head.addEventListener("pointerup", endDrag);
    head.addEventListener("pointercancel", endDrag);

    box.addEventListener("pointerdown", (e) => { e.stopPropagation(); this._setModalTop(true); });
    box.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });

    wrap.onclick = (e) => {
      e.stopPropagation();
      if (e.target === wrap && this._isMobile()) return this._dongModal();
      const tabBtn = e.target.closest("[data-tab]");
      if (tabBtn) {
        this.api.P.audio.ui("click");
        this.tab = tabBtn.dataset.tab;
        const h = this.api.hero(), w = this.api.world();
        if (h && w) this._veModal(this._tinhTrang(h, w, h.chiDan || {}), true);
        return;
      }
      const act = e.target.closest("[data-act]");
      if (act) {
        const k = act.dataset.act;
        if (k === "close") { this.api.P.audio.ui("click"); return this._dongModal(); }
        if (k.startsWith("tt:")) {
          const [, a, x] = k.split(":");
          if (a !== "bat" && a !== "tat" && a !== "ok") this._dongModal();
          this.bam(a, x);
          const h = this.api.hero(), w = this.api.world();
          if (this.modalOpen && h && w) this._veModal(this._tinhTrang(h, w, h.chiDan || {}), true);
        }
      }
    };

    host.appendChild(wrap);
  }

  _veModal(st, force = false) {
    const host = this._host(); if (!host) return;
    if (!this.modalEl) this._taoKhungModal(host);

    if (!this._escHandler && typeof addEventListener === "function") {
      this._escHandler = (e) => {
        if (e.key === "Escape" && this.modalOpen && this.modalTop) {
          e.preventDefault(); e.stopPropagation(); this._dongModal();
        }
      };
      addEventListener("keydown", this._escHandler, true);
    }
    if (!this._docDownHandler && typeof document !== "undefined") {
      this._docDownHandler = (e) => {
        if (!this.modalOpen || !this.modalBox) return;
        const t = e.target;
        if (t && this.modalBox.contains(t)) return;
        if (t && t.closest && t.closest("#jxwin, .dv, #hd-dt, #kat")) {
          if (this._isMobile()) this._dongModal();
          else this._setModalTop(false);
        }
      };
      document.addEventListener("pointerdown", this._docDownHandler, true);
    }

    const wasOpen = this.modalEl.classList.contains("on");
    this.modalEl.classList.add("on");
    this.modalEl.classList.toggle("top", this.modalTop);
    if (!wasOpen || !this._winPosInit) {
      this._winPosInit = true;
      this._datViTriBox();
    }

    const B = st.buoc;
    const barOn = !st.C.tat && !st.C.xong && (st.h.lvl | 0) < CAP_TOI;
    const sig = [
      this.tab, st.doneCount, st.tong, st.idx,
      B ? B.so : 0, B ? B.ten : "", B ? B.tomTat : "",
      B ? B.actLabel : "", B ? B.actKey : "", B ? B.secLabel : "", B ? B.secKey : "",
      barOn ? 1 : 0, (st.h.lvl | 0) < CAP_TOI ? 1 : 0
    ].join("|");

    // Không ghi đè DOM khi dữ liệu chưa đổi -> giữ nguyên thanh cuộn mượt 100%
    if (!force && sig === this.modalSig) return;
    const sameTab = this.modalTabRendered === this.tab;
    this.modalSig = sig;
    this.modalTabRendered = this.tab;

    const bodyEl = this.modalBox.querySelector(".vtt-body");
    const footEl = this.modalBox.querySelector(".vtt-foot");
    const prevScroll = sameTab && bodyEl ? bodyEl.scrollTop : 0;

    this.modalBox.querySelectorAll(".vtt-tabs button").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.tab === this.tab);
    });

    const pct = Math.round((st.doneCount / st.tong) * 100);
    const ttLuat = (this.api.luat() || {}).tanThu || {};
    const utLuat = (this.api.luat() || {}).uyThac || {};
    let bodyHtml = "";

    if (this.tab === "loTrinh") {
      const heroBanner = B
        ? `<div class="vtt-cur">
            <div class="vtt-cur-tag">Việc cần làm ngay · Bước ${B.so}/${B.tong}</div>
            <div class="vtt-cur-title">${esc(B.ten)}</div>
            <div class="vtt-cur-desc">${esc(B.tomTat)}</div>
            <div class="vtt-cur-btns">
              ${B.actKey ? `<button type="button" class="vtt-btn-go" data-act="${esc(B.actKey)}">${esc(B.actLabel)}</button>` : `<span class="vtt-badge-ing">${esc(B.actLabel || "Đang thực hiện")}</span>`}
              ${B.secKey ? `<button type="button" class="vtt-btn-sec" data-act="${esc(B.secKey)}">${esc(B.secLabel)}</button>` : ""}
            </div>
          </div>`
        : `<div class="vtt-cur xong">
            <div class="vtt-cur-tag">Chúc mừng đại hiệp!</div>
            <div class="vtt-cur-title">Đã hoàn tất toàn bộ lộ trình Tân thủ (${st.doneCount}/${st.tong})</div>
            <div class="vtt-cur-desc">Bạn đã nắm đủ kỹ năng cơ bản để hành tẩu giang hồ. Có thể mở mục Hoạt động hoặc Hỗ trợ (F1) để khám phá Dã Tẩu, Vượt Ải, Sát Thủ, Tống Kim.</div>
          </div>`;

      const listHtml = st.ds.map((item, idx) => {
        const cls = item.xong ? "done" : idx === st.idx ? "now" : "next";
        const badge = item.xong ? "Đã xong" : idx === st.idx ? "Đang làm" : "Sắp tới";
        const ico = item.xong ? "✓" : String(idx + 1);
        return `<div class="vtt-step ${cls}">
          <div class="vtt-num">${ico}</div>
          <div class="vtt-step-body">
            <div class="vtt-step-head"><b>${esc(item.ten)}</b><em>${badge}</em></div>
            <p>${esc(item.tomTat)}</p>
          </div>
        </div>`;
      }).join("");

      bodyHtml = `<div class="vtt-prog">
          <div class="vtt-prog-txt"><span>Tiến độ Tân thủ</span><b>${st.doneCount}/${st.tong} bước (${pct}%)</b></div>
          <div class="vtt-prog-bar"><i style="width:${pct}%"></i></div>
        </div>
        ${heroBanner}
        <div class="vtt-list">${listHtml}</div>`;
    } else if (this.tab === "dieuKhien") {
      bodyHtml = `<div class="vtt-grid">
        <div class="vtt-card">
          <h3>Chơi trên Máy tính (PC)</h3>
          <ul>
            <li><b>Chuột trái</b>: Bấm đất để chạy, bấm quái để đánh, bấm đồ rơi để nhặt, bấm NPC để nói chuyện.</li>
            <li><b>Phím Space</b>: Bật / tắt Tự đánh (ở thành tự chạy tới Xa phu ra bãi).</li>
            <li><b>Phím F3 / F4 / F5</b>: Mở Nhân vật (cộng tiềm năng) · Hành trang · Võ công (cộng kỹ năng).</li>
            <li><b>Phím K</b>: Mở Trợ Thủ (cài tự uống thuốc, nhặt đồ, tự về thành bán đồ).</li>
            <li><b>Phím 1–9 / Q–E</b>: Dùng nhanh thuốc, Thổ Địa Phù hoặc đổi chiêu thức.</li>
            <li><b>Phím F1 / F12</b>: Xem bảng Hỗ trợ chi tiết · Bảng Nhiệm vụ.</li>
          </ul>
        </div>
        <div class="vtt-card">
          <h3>Chơi trên Điện thoại (Mobile)</h3>
          <ul>
            <li><b>Cần xoay bên trái</b>: Kéo để di chuyển nhân vật linh hoạt.</li>
            <li><b>Vòm cung bên phải</b>: Ô lớn đánh chính, các ô nhỏ dùng chiêu, thuốc, Ngựa và khóa ô kỹ năng.</li>
            <li><b>Nút Tự đánh</b> (góc phải trên): Bật 1 chạm để tự chạy ra bãi đánh quái.</li>
            <li><b>Nút Nói chuyện / Nhặt đồ</b>: Tự hiện phía trên cụm chiêu khi đứng gần NPC hoặc vật rơi.</li>
            <li><b>Thanh Giang hồ</b>: Mở nhanh Nhân vật, Hành trang, Võ công, Trợ Thủ, Hoạt động và Nhiệm vụ.</li>
          </ul>
        </div>
      </div>`;
    } else {
      bodyHtml = `<div class="vtt-tips">
        <div class="vtt-tip"><b>1. Vòng sáng Tân thủ miễn phí</b><p>Nhân vật dưới cấp ${ttLuat.capDuoi || 60} tự động có vòng sáng hồi sinh lực, nội lực mỗi giây và tăng tốc chạy — cứ yên tâm ra bãi luyện cấp mà ít tốn thuốc.</p></div>
        <div class="vtt-tip"><b>2. Đủ cấp 10 nhớ nhập phái ngay</b><p>Về Ba Lăng huyện gặp Đệ tử tiếp dẫn cùng hệ Ngũ Hành (Kim · Mộc · Thủy · Hỏa · Thổ) để học võ công. Cấp 10, 20, 30, 40, 50, 60 đều có chiêu mới mạnh hơn.</p></div>
        <div class="vtt-tip"><b>3. Tận dụng Trợ Thủ (phím K)</b><p>Bật tự uống thuốc khi sinh lực dưới 60%, lọc nhặt trang bị xanh nhiều dòng và bật tự về thành bán đồ/mua thuốc để treo máy rảnh tay.</p></div>
        <div class="vtt-tip"><b>4. Mua thuốc & Thổ Địa Phù ở đâu?</b><p>Gặp <b>Ngô Thần Y</b> (Dược điếm) để mua thuốc máu/mana; gặp <b>Tạp hóa</b> để mua Thổ Địa Phù giúp về thành tức thì khi đầy túi hoặc sắp hết máu.</p></div>
        <div class="vtt-tip"><b>5. Ủy thác cày cấp khi bận</b><p>Đang bật Tự đánh ngoài bãi mà đóng game, máy chủ tự động cày thay ${Math.round((utLuat.tiLe || 0.7) * 100)}% tốc độ (tối đa ${utLuat.gioNgay || 12} giờ/ngày khi còn giờ Bạch Câu Hoàn).</p></div>
      </div>`;
    }

    const toggleBtn = (st.h.lvl | 0) < CAP_TOI && st.buoc
      ? (barOn
          ? '<button type="button" class="vtt-ft-btn" data-act="tt:tat">Tạm ẩn thanh nhắc</button>'
          : '<button type="button" class="vtt-ft-btn hi" data-act="tt:bat">Hiện lại thanh nhắc Tân thủ</button>')
      : "";

    if (bodyEl) {
      bodyEl.innerHTML = bodyHtml;
      bodyEl.scrollTop = sameTab ? prevScroll : 0;
    }
    if (footEl) {
      footEl.innerHTML = `<div class="vtt-ft-left">
          ${toggleBtn}
          <button type="button" class="vtt-ft-btn" data-act="tt:st:0">Hỗ trợ chi tiết (F1)</button>
        </div>
        <button type="button" class="vtt-ft-close" data-act="close">Đóng</button>`;
    }
  }

  bam(a, x) {
    const A = this.api, w = A.world(), h = A.hero(), GW = A.GW(), D = A.DT(); if (!w || !h) return;
    const C = (h.chiDan = h.chiDan || {}), mo = (k) => (D && D.on ? D.mo(k) : GW && GW.toggle(k)), toi = (n, ten) => { if (n) { w.clickNpc(n); A.msg("Tìm đường tới " + ten); } };
    A.P.audio.ui("click");
    if (a === "mo") return this.moCamNang(x || "loTrinh");
    if (a === "dong") return this._dongModal();
    if (a === "bat") { C.tat = 0; C.xong = 0; A.save(); A.msg("Đã bật lại thanh nhắc Tân thủ"); return; }
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
    if (a === "tat") { C.tat = 1; A.save(); return A.msg("Đã ẩn thanh nhắc tân thủ — bấm nút Cẩm nang hoặc F1 để mở lại"); }
  }
}
