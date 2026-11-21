// Chuyển đổi giao diện Kiếm hiệp hiện đại / Cổ điển (lưu theo máy, mặc định: modern)
const KEY = "vl_ui_theme";

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
  return m;
}

export function setUiTheme(mode) {
  const m = applyUiTheme(mode);
  try { localStorage.setItem(KEY, m); } catch {}
  return m;
}

applyUiTheme(getUiTheme());
