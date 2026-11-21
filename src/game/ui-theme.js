// Giao diện Kiếm hiệp hiện đại: quản lý chế độ Hiện đại / Cổ điển + thay diện mạo nút chức năng & nút đánh (PC + Mobile)
const KEY = "vl_ui_theme";

const SVG = {
  // PC bottom bar & Mobile Giang Ho / Tabs
  Status: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.2 0-7 2-7 4.5V20h14v-1.5C19 16 16.2 14 12 14z"/>',
  Items: '<path d="M9 5a3 3 0 0 1 6 0v1h3a2 2 0 0 1 2 2l-1 10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3L4 8a2 2 0 0 1 2-2h3V5zm2 1h2V5a1 1 0 0 0-2 0v1zm-2 5h6v2H9v-2z"/>',
  ItemEx: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4V7zm0 5h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6zm6 1v2h4v-2h-4z"/>',
  Skills: '<path d="M19.5 3.5L13 10l2.5 2.5 1.4-1.4 1.6 1.6-3.2 3.2-1.6-1.6 1-1L12 10.6l-5.6 5.6 1.2 1.2-1.6 1.6-2.8-2.8 1.6-1.6 1.2 1.2L11.6 10 8.5 6.9l1.4-1.4L13 8.6l5.1-5.1h1.4zM5 4l3 3-1.5 1.5L3.5 5.5 5 4z"/>',
  Task: '<path d="M6 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zm2 4v2h6V7H8zm0 4v2h6v-2H8z"/>',
  Friend: '<path d="M9 11a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 9 11zm6.5 0a2.7 2.7 0 1 0-2.7-2.7A2.7 2.7 0 0 0 15.5 11zM9 13c-3 0-5.5 1.6-5.5 3.6V19h11v-2.4C14.5 14.6 12 13 9 13zm6.5.5c-.8 0-1.5.1-2.1.4 1.3.8 2.1 1.9 2.1 3.2V19H21v-2.1c0-1.9-2.4-3.4-5.5-3.4z"/>',
  Team: '<path d="M12 2L4 5v6c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V5l-8-3zm0 4.2a2.3 2.3 0 1 1-2.3 2.3A2.3 2.3 0 0 1 12 6.2zm4 9.3H8v-1c0-1.7 2.7-2.6 4-2.6s4 .9 4 2.6v1z"/>',
  Faction: '<path d="M5 3h14v2l-1 1v13l-6-3-6 3V6L5 5V3zm7 4l-3 4h2v3h2v-3h2l-3-4z"/>',
  ChatRoom: '<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5zm4 4v2h8V9H8zm0-3v2h5V6H8z"/>',
  Options: '<path d="M19.4 13a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6zM13 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
  Sit: '<path d="M12 4a2.3 2.3 0 1 1-2.3 2.3A2.3 2.3 0 0 1 12 4zm-1 6h2l2.2 3.2 2.8.8-.6 2-3.4-.8L12 13l-2 2.2-3.4.8-.6-2 2.8-.8L11 10zm-4.5 7.5h11a1.5 1.5 0 0 1 0 3h-11a1.5 1.5 0 0 1 0-3z"/>',
  ChoTroi: '<path d="M4 6l2-3h12l2 3v3a2.5 2.5 0 0 1-2 2.4V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7.6A2.5 2.5 0 0 1 4 9V6zm4 6v6h4v-6H8zm6 0v3h2v-3h-2z"/>',
  Horse: '<path d="M18.5 5.5c-1.1-1-2.6-1.5-4.3-1.5-1.5 0-2.5.7-3.4 1.6L8 4l-.6 2.7L5 9.2l1.6 1.5 2.2-.8 1.2 1.4-2.5 3.7H5v2.2h3.4l2.1-3.1 2.7.7-.7 3.2h2.3l1-4.2 1.8.8V19h2.2v-5.2c0-1.6-.8-2.9-2.1-3.6l1.4-2.5-.6-2.2z"/>',
  Exchange: '<path d="M7 7h10.2l-2.1-2.1L16.5 3.5 21 8l-4.5 4.5-1.4-1.4L17.2 9H7V7zm10 10H6.8l2.1 2.1-1.4 1.4L3 16l4.5-4.5 1.4 1.4L6.8 15H17v2z"/>',
  Rec: '<circle cx="12" cy="12" r="5"/><path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>',
  PK: '<path d="M5 4l6.5 6.5L13 9 6.5 2.5 5 4zm14 0l-1.5-1.5L11 9l1.5 1.5L19 4zM4 18.5L5.5 20l4.5-4.5-1.5-1.5L4 18.5zm16 0L15.5 14 14 15.5 18.5 20 20 18.5zM9 12l3 3 3-3-3-3-3 3z"/>',
  Market: '<path d="M4 13c0-2.2 2.2-4 5-4h6c2.8 0 5 1.8 5 4v2c0 2.5-3.2 4.5-8 4.5S4 17.5 4 15v-2zm4-5a4 4 0 0 1 8 0H8z"/>',
  Face: '<path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm-3 6.5a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 9 9.5zm6 0a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 15 9.5zm-6.8 4.3h7.6a4 4 0 0 1-7.6 0z"/>',
  SendBtn: '<path d="M3 11.5L20.5 4 17 20l-4.8-5.3L8.5 18v-4.2l7-6.3-8.6 5.2L3 11.5z"/>',
  // Extra icons (Right column & Mobile)
  Gift: '<path d="M20 7h-2.2A3 3 0 0 0 12 4.2 3 3 0 0 0 6.2 7H4v4h1v9h14v-9h1V7zm-9 11H7v-7h4v7zm6 0h-4v-7h4v7z"/>',
  Auto: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
  Guide: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.8 6.2l-2 5.6-5.6 2 2-5.6 5.6-2z"/>',
  Clone: '<path d="M9 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm6 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 15 11zM9 12c-3 0-5 1.5-5 3.5V18h10v-2.5C14 13.5 12 12 9 12zm6 .8c-.7 0-1.3.1-1.8.3 1.1.7 1.8 1.6 1.8 2.9V18h5v-2c0-1.8-2-3.2-5-3.2z"/>',
  Rank: '<path d="M5 17h14v2H5v-2zm1-2L4 7l4.5 3L12 5l3.5 5L20 7l-2 8H6z"/>',
  GiangHo: '<path d="M12 2l2.6 5.4L20.5 8l-4.3 4.1 1 5.9L12 15.2 6.8 18l1-5.9L3.5 8l5.9-.6L12 2z"/>',
  Lock: '<path d="M17 10h-1V7a4 4 0 0 0-8 0v3H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-3a2 2 0 0 1 4 0v3h-4V7z"/>',
  Attack: '<path d="M19.5 3.5L13 10l2.2 2.2-1.4 1.4-2.2-2.2-4.6 4.6 1.5 1.5-1.5 1.5-3.5-3.5 1.5-1.5 1.5 1.5 4.6-4.6-2.2-2.2 1.4-1.4 2.2 2.2 5.6-5.6h1.4z"/>'
};

const PC_META = {
  Status:   { ic: "Status",   lb: "NV",    tone: "gold" },
  Items:    { ic: "Items",    lb: "T\u00fai",  tone: "amber" },
  ItemEx:   { ic: "ItemEx",   lb: "T\u00fai 2", tone: "amber" },
  Skills:   { ic: "Skills",   lb: "Chi\u00eau", tone: "crimson" },
  Task:     { ic: "Task",     lb: "NV\u1ee5",  tone: "emerald" },
  Friend:   { ic: "Friend",   lb: "B\u1ea1n",  tone: "sky" },
  Team:     { ic: "Team",     lb: "\u0110\u1ed9i",  tone: "sky" },
  Faction:  { ic: "Faction",  lb: "Bang",  tone: "gold" },
  ChatRoom: { ic: "ChatRoom", lb: "Ph\u00f2ng", tone: "sky" },
  Options:  { ic: "Options",  lb: "C\u00e0i",  tone: "slate" },
  Sit:      { ic: "Sit",      lb: "Ng\u1ed3i", tone: "emerald" },
  ChoTroi:  { ic: "ChoTroi",  lb: "Ch\u1ee3",  tone: "amber" },
  Horse:    { ic: "Horse",    lb: "Ng\u1ef1a", tone: "gold" },
  Exchange: { ic: "Exchange", lb: "GD",    tone: "sky" },
  Rec:      { ic: "Rec",      lb: "Ghi",   tone: "slate" },
  PK:       { ic: "PK",       lb: "PK",    tone: "crimson" },
  Market:   { ic: "Market",   lb: "K\u1ef3 Tr\u00e2n C\u00e1c", tone: "market" },
  Face:     { ic: "Face",     lb: "",      tone: "mini" },
  SendBtn:  { ic: "SendBtn",  lb: "",      tone: "mini" }
};

function normVi(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .toLowerCase()
    .trim();
}

const DT_MAP = [
  ["nhan vat",     { ic: "Status",   tone: "gold" }],
  ["hanh trang",   { ic: "Items",    tone: "amber" }],
  ["tui",          { ic: "Items",    tone: "amber" }],
  ["vo cong",      { ic: "Skills",   tone: "crimson" }],
  ["nhiem vu",     { ic: "Task",     tone: "emerald" }],
  ["to doi",       { ic: "Team",     tone: "sky" }],
  ["doi ngu",      { ic: "Team",     tone: "sky" }],
  ["hao huu",      { ic: "Friend",   tone: "sky" }],
  ["bang phai",    { ic: "Faction",  tone: "gold" }],
  ["bang hoi",     { ic: "Faction",  tone: "gold" }],
  ["ky tran cac",  { ic: "Market",   tone: "market" }],
  ["cho troi",     { ic: "ChoTroi",  tone: "amber" }],
  ["giao dich",    { ic: "Exchange", tone: "sky" }],
  ["xep hang",     { ic: "Rank",     tone: "gold" }],
  ["nhan thuong",  { ic: "Gift",     tone: "crimson" }],
  ["ngoi",         { ic: "Sit",      tone: "emerald" }],
  ["ngua",         { ic: "Horse",    tone: "gold" }],
  ["phong chat",   { ic: "ChatRoom", tone: "sky" }],
  ["he thong",     { ic: "Options",  tone: "slate" }],
  ["tuy chinh",    { ic: "Options",  tone: "slate" }],
  ["giang ho",     { ic: "GiangHo",  tone: "gold" }],
  ["tro thu",      { ic: "Auto",     tone: "emerald" }],
  ["hoat dong",    { ic: "Guide",    tone: "sky" }],
  ["phan than",    { ic: "Clone",    tone: "crimson" }],
  ["khoa an toan", { ic: "Lock",     tone: "amber" }]
];

function svgTag(name) {
  const d = SVG[name] || SVG.GiangHo;
  return '<svg class="ui-m-svg" viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>";
}

function matchDt(label) {
  const n = normVi(label);
  if (!n || n.includes("zalo")) return null;
  for (const [k, v] of DT_MAP) {
    if (n === k || n.includes(k)) return v;
  }
  return null;
}

let rafId = 0;
function scheduleEnhance() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    enhanceHud();
  });
}

function enhanceHud() {
  const jx = document.getElementById("jxhud");
  if (jx) {
    // 1. Nút chức năng thanh dưới PC (.jx-btn[data-k])
    jx.querySelectorAll(".jx-bot .jx-btn[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const meta = PC_META[k];
      if (!meta) return;
      if (!el.querySelector(".ui-m-btn")) {
        el.dataset.uiTone = meta.tone;
        const sp = document.createElement("span");
        sp.className = "ui-m-btn";
        sp.innerHTML = svgTag(meta.ic) + (meta.lb ? "<em>" + meta.lb + "</em>" : "");
        el.appendChild(sp);
      }
      // Đồng bộ trạng thái bật/tắt (Sit, Horse, PK, Exchange...)
      const isToggleKey = k === "Sit" || k === "Horse" || k === "PK" || k === "Exchange";
      if (isToggleKey && !el.classList.contains("is-on-managed")) {
        const bx = parseFloat(el.style.backgroundPositionX) || 0;
        el.classList.toggle("is-on", bx < -1);
      }
    });

    // 2. Cột icon bên phải PC (.jx-mmbox)
    const rightBtns = [
      [".jx-lpbtn", "Gift", "crimson"],
      [".jx-ttbtn", "Auto", "emerald"],
      [".jx-hdbtn", "Guide", "sky"],
      [".jx-ptbtn", "Clone", "gold"]
    ];
    for (const [sel, ic, tone] of rightBtns) {
      const el = jx.querySelector(".jx-mmbox " + sel);
      if (el && !el.querySelector(".ui-m-btn")) {
        el.dataset.uiTone = tone;
        const sp = document.createElement("span");
        sp.className = "ui-m-btn ui-m-right-ic";
        sp.innerHTML = svgTag(ic);
        el.appendChild(sp);
      }
    }

    // 3. 9 ô phím tắt 1-9: thêm nhãn phím 1..9 ở góc trên phải
    jx.querySelectorAll(".jx-bot .jx-slot[data-slot]").forEach((el) => {
      if (!el.querySelector(".ui-m-hk")) {
        const idx = (parseInt(el.dataset.slot, 10) || 0) + 1;
        const hk = document.createElement("span");
        hk.className = "ui-m-hk";
        hk.textContent = String(idx);
        el.appendChild(hk);
      }
    });

    // 4. 2 nút đánh / kỹ năng chính (T / P): thêm vòng hào quang + nhãn T / P + kiếm mờ khi trống
    jx.querySelectorAll(".jx-bot .jx-skill[data-skill]").forEach((el) => {
      const side = el.dataset.skill;
      if (!el.querySelector(".ui-m-sk")) {
        const sp = document.createElement("span");
        sp.className = "ui-m-sk";
        sp.innerHTML = svgTag(side === "left" ? "Attack" : "Skills");
        el.appendChild(sp);
      }
      if (!el.querySelector(".ui-m-sktag")) {
        const tag = document.createElement("span");
        tag.className = "ui-m-sktag";
        tag.textContent = side === "left" ? "T" : "P";
        el.appendChild(tag);
      }
      el.classList.toggle("ui-m-has-qi", !!el.querySelector(".jx-qi"));
    });
  }

  // 5. Mobile (#dt): nâng cấp toàn bộ icon nút chức năng Giang hồ + 5 thẻ
  const dt = document.getElementById("dt");
  if (dt) {
    dt.querySelectorAll(".dt-o, .dt-tab > div").forEach((wrap) => {
      const box = wrap.querySelector(".dt-khung, .dt-tic");
      const lbEl = wrap.querySelector("span");
      if (!box || !lbEl || box.querySelector(".ui-m-ic")) return;
      const meta = matchDt(lbEl.textContent);
      if (!meta) return;
      box.classList.add("has-ui-m");
      box.dataset.uiTone = meta.tone;
      const ic = document.createElement("span");
      ic.className = "ui-m-ic";
      ic.innerHTML = svgTag(meta.ic);
      box.appendChild(ic);
    });
  }
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
  scheduleEnhance();
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
  const obs = new MutationObserver(() => scheduleEnhance());
  obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
  scheduleEnhance();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
