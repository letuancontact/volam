// Quản lý chế độ giao diện Kiếm hiệp hiện đại / Cổ điển (mặc định: modern)
// Giữ nguyên 100% hình ảnh icon gốc của game, chỉ thêm nhãn phím tắt gọn cho PC.
const KEY = "vl_ui_theme";

let rafId = 0;
function scheduleSync() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    syncHudBadges();
  });
}

function syncHudBadges() {
  // Dọn sạch lớp SVG thay icon của bản cũ nếu còn sót trong DOM
  document.querySelectorAll(".ui-m-btn, .ui-m-ic, .ui-m-sk").forEach((el) => el.remove());
  document.querySelectorAll(".has-ui-m").forEach((el) => el.classList.remove("has-ui-m"));

  const jx = document.getElementById("jxhud");
  if (!jx) return;

  // Nhãn phím số 1–9 góc trên phải ở thanh dùng nhanh PC
  jx.querySelectorAll(".jx-bot .jx-slot[data-slot]").forEach((el) => {
    if (!el.querySelector(".ui-m-hk")) {
      const idx = (parseInt(el.dataset.slot, 10) || 0) + 1;
      const hk = document.createElement("span");
      hk.className = "ui-m-hk";
      hk.textContent = String(idx);
      el.appendChild(hk);
    }
  });

  // Nhãn T / P dưới vòng kỹ năng PC
  jx.querySelectorAll(".jx-bot .jx-skill[data-skill]").forEach((el) => {
    if (!el.querySelector(".ui-m-sktag")) {
      const tag = document.createElement("span");
      tag.className = "ui-m-sktag";
      tag.textContent = el.dataset.skill === "left" ? "T" : "P";
      el.appendChild(tag);
    }
  });
}

export function getUiTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "classic" ? "classic" : "modern";
  } catch {
    return "modern";
  }
}

export function applyUiTheme(mode) {
  const m = mode === "classic" ? "classic" : "modern";
  const on = m === "modern";
  if (document.documentElement) document.documentElement.classList.toggle("ui-modern", on);
  if (document.body) document.body.classList.toggle("ui-modern", on);
  scheduleSync();
  return m;
}

export function setUiTheme(mode) {
  const m = applyUiTheme(mode);
  try { localStorage.setItem(KEY, m); } catch {}
  return m;
}

let obsStarted = false;
function boot() {
  applyUiTheme(getUiTheme());
  if (obsStarted || !document.body) return;
  obsStarted = true;
  const target = document.getElementById("hud") || document.body;
  const obs = new MutationObserver(() => scheduleSync());
  obs.observe(target, { childList: true, subtree: true });
  scheduleSync();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
