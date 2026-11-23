(function () {
  "use strict";
  if (window.VLAfk) return;

  const st = {
    active: false, panel: false, charKey: "", startAt: Date.now(), lastSync: 0,
    exp: 0, gold: 0, kills: 0, items: 0, rares: 0, recent: [],
    info: { name: "", lvl: 1, map: "", hp: 0, hpMax: 1, mp: 0, mpMax: 1, exp: 0, expMax: 0, auto: false, gold: 0 },
    wakeLock: null, unlockTap: 0
  };

  const fmtN = (n) => Math.round(Number(n) || 0).toLocaleString("vi-VN");
  const fmtVan = (n) => {
    n = Math.round(Number(n) || 0);
    if (n >= 10000) return (n / 10000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, "") + " vạn";
    return fmtN(n) + " lượng";
  };
  const fmtDur = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
    const pad = (v) => (v < 10 ? "0" + v : "" + v);
    return (h > 0 ? pad(h) + ":" : "") + pad(m) + ":" + pad(sc);
  };
  const esc = (t) => String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
  const cssColor = (c) => Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : (typeof c === "string" && c ? c : "#e8e3d0");

  const style = document.createElement("style");
  style.textContent = `
    #vl-qkbar { position: fixed; left: 6px; top: 112px; z-index: 12; display: none; gap: 5px; pointer-events: auto; font-family: var(--jx, "VK Sans Serif 13", "IBM Plex Mono", monospace); }
    body:not(.dt) #vl-qkbar { left: 8px; top: 24px; }
    body.dt.dt-ngang #vl-qkbar { left: 6px; top: 88px; }
    #vl-qkbar button { padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(212,175,92,.62); background: rgba(11,19,16,.78); color: #f6e3ad; font: 12px/16px var(--jx), monospace; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.6); backdrop-filter: blur(4px); }
    #vl-qkbar button.on { background: linear-gradient(180deg,#8d6721,#4a310a); border-color: #ffe28a; color: #fff8dc; }
    #vl-farm { position: fixed; left: 6px; top: 142px; z-index: 13; width: min(290px, calc(100vw - 12px)); display: none; padding: 10px 11px; border-radius: 12px; border: 1px solid rgba(212,175,92,.65); background: rgba(8,14,12,.92); color: #ece6d2; box-shadow: 0 8px 24px rgba(0,0,0,.78); backdrop-filter: blur(8px); font: 12px/17px var(--jx), "IBM Plex Mono", monospace; pointer-events: auto; }
    body:not(.dt) #vl-farm { left: 8px; top: 54px; }
    #vl-farm .vf-hd { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(212,175,92,.35); padding-bottom: 5px; margin-bottom: 6px; color: #ffd978; font-weight: 700; }
    #vl-farm .vf-act { display: flex; gap: 6px; }
    #vl-farm .vf-act button { padding: 1px 7px; border-radius: 6px; border: 1px solid rgba(212,175,92,.5); background: rgba(34,46,40,.9); color: #ffe7a8; font: 11px/15px var(--jx), monospace; cursor: pointer; }
    #vl-farm .vf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 8px; }
    #vl-farm .vf-box { padding: 4px 6px; border-radius: 7px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); }
    #vl-farm .vf-box small { display: block; color: #9fc9b5; font-size: 11px; }
    #vl-farm .vf-box b { color: #fff6d6; font-weight: 600; }
    #vl-farm .vf-list { margin-top: 7px; padding-top: 6px; border-top: 1px dashed rgba(212,175,92,.3); max-height: 112px; overflow-y: auto; }
    #vl-farm .vf-it { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; line-height: 17px; }
    #vl-afk { position: fixed; inset: 0; z-index: 95; display: none; flex-direction: column; justify-content: space-between; align-items: center; padding: max(22px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom)); background: #030504; color: #d5d0be; font-family: var(--jx, "VK Sans Serif 13", "IBM Plex Mono", monospace); user-select: none; -webkit-user-select: none; touch-action: manipulation; }
    #vl-afk.on { display: flex; }
    #vl-afk .va-top { text-align: center; width: 100%; max-width: 420px; }
    #vl-afk .va-clock { font-size: 38px; line-height: 42px; color: #f0d793; letter-spacing: 2px; font-family: var(--jx, "VK Sans Serif 13", "IBM Plex Mono", monospace); font-variant-numeric: tabular-nums; }
    #vl-afk .va-sub { margin-top: 4px; font-size: 13px; color: #8fb4a2; }
    #vl-afk .va-card { width: 100%; max-width: 420px; padding: 14px; border-radius: 16px; border: 1px solid rgba(212,175,92,.32); background: rgba(15,24,20,.65); }
    #vl-afk .va-name { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #ffe291; margin-bottom: 10px; }
    #vl-afk .va-bars { display: grid; gap: 6px; margin-bottom: 12px; }
    #vl-afk .va-bar { position: relative; height: 15px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
    #vl-afk .va-bar i { position: absolute; inset: 0 auto 0 0; border-radius: 999px; }
    #vl-afk .va-bar span { position: relative; z-index: 1; display: block; text-align: center; font-size: 11px; line-height: 15px; color: #fff; text-shadow: 0 1px 2px #000; }
    #vl-afk .va-hp i { background: linear-gradient(90deg,#991b1b,#dc2626); }
    #vl-afk .va-mp i { background: linear-gradient(90deg,#1d4ed8,#2563eb); }
    #vl-afk .va-xp i { background: linear-gradient(90deg,#925c0b,#eab308); }
    #vl-afk .va-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    #vl-afk .va-st { padding: 7px 9px; border-radius: 10px; background: rgba(0,0,0,.38); border: 1px solid rgba(255,255,255,.06); }
    #vl-afk .va-st small { display: block; color: #86ab99; font-size: 11px; }
    #vl-afk .va-st b { color: #f6ebd0; font-size: 13px; }
    #vl-afk .va-drops { margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(212,175,92,.25); font-size: 12px; line-height: 18px; }
    #vl-afk .va-warn { margin-top: 8px; padding: 6px 10px; border-radius: 8px; background: rgba(185,28,28,.25); border: 1px solid #ef4444; color: #fca5a5; text-align: center; font-size: 12px; display: none; }
    #vl-afk .va-unlock { width: 100%; max-width: 320px; padding: 12px 18px; border-radius: 999px; border: 1px solid rgba(212,175,92,.55); background: rgba(25,36,30,.75); color: #f5df9c; font: 14px/18px var(--jx), monospace; cursor: pointer; text-align: center; }
  `;
  document.head.appendChild(style);

  const bar = document.createElement("div");
  bar.id = "vl-qkbar";
  bar.innerHTML = `<button type="button" id="vl-btn-farm">Farm</button><button type="button" id="vl-btn-afk">Treo pin</button>`;
  const farmEl = document.createElement("div");
  farmEl.id = "vl-farm";
  const afkEl = document.createElement("div");
  afkEl.id = "vl-afk";
  afkEl.innerHTML = `
    <div class="va-top"><div class="va-clock" id="va-clock">00:00</div><div class="va-sub" id="va-sub">Chế độ treo máy tiết kiệm pin · GPU nghỉ</div></div>
    <div class="va-card">
      <div class="va-name"><span id="va-name">Nhân vật</span><span id="va-auto">Tự đánh</span></div>
      <div class="va-bars">
        <div class="va-bar va-hp"><i id="va-hp-i" style="width:100%"></i><span id="va-hp-t">HP</span></div>
        <div class="va-bar va-mp"><i id="va-mp-i" style="width:100%"></i><span id="va-mp-t">MP</span></div>
        <div class="va-bar va-xp"><i id="va-xp-i" style="width:0%"></i><span id="va-xp-t">EXP</span></div>
      </div>
      <div class="va-stats">
        <div class="va-st"><small>EXP / giờ</small><b id="va-xph">0</b></div>
        <div class="va-st"><small>Dự kiến lên cấp</small><b id="va-eta">Đang đo...</b></div>
        <div class="va-st"><small>Bạc / giờ</small><b id="va-gph">0</b></div>
        <div class="va-st"><small>Quái · Đồ hiếm</small><b id="va-km">0 · 0</b></div>
      </div>
      <div class="va-drops" id="va-drops"></div>
      <div class="va-warn" id="va-warn">Cảnh báo: Nhân vật đã trọng thương (HP = 0)!</div>
    </div>
    <button type="button" class="va-unlock" id="va-unlock">Chạm 2 lần để mở khóa màn hình</button>
  `;

  function mount() {
    if (!document.body || bar.parentNode) return;
    document.body.appendChild(bar);
    document.body.appendChild(farmEl);
    document.body.appendChild(afkEl);
    document.getElementById("vl-btn-farm").onclick = () => { st.panel = !st.panel; render(); };
    document.getElementById("vl-btn-afk").onclick = () => setAfk(true);
    document.getElementById("va-unlock").onclick = () => {
      const now = Date.now();
      if (now - st.unlockTap < 900) { st.unlockTap = 0; setAfk(false); }
      else {
        st.unlockTap = now;
        const b = document.getElementById("va-unlock");
        if (b) b.textContent = "Chạm thêm 1 lần nữa để mở khóa...";
        setTimeout(() => { if (st.active && Date.now() - st.unlockTap >= 850) { const x = document.getElementById("va-unlock"); if (x) x.textContent = "Chạm 2 lần để mở khóa màn hình"; } }, 950);
      }
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();

  async function reqWake() {
    try { if (navigator.wakeLock && !st.wakeLock) st.wakeLock = await navigator.wakeLock.request("screen"); } catch {}
  }
  function relWake() {
    try { if (st.wakeLock) { st.wakeLock.release(); st.wakeLock = null; } } catch {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && st.active) reqWake(); });

  function setAfk(on) {
    mount();
    st.active = !!on;
    afkEl.classList.toggle("on", st.active);
    document.body.classList.toggle("afk-mode", st.active);
    const b = document.getElementById("va-unlock");
    if (b) b.textContent = "Chạm 2 lần để mở khóa màn hình";
    if (st.active) reqWake(); else relWake();
    render();
  }

  function resetStats() {
    st.startAt = Date.now(); st.exp = 0; st.gold = 0; st.kills = 0; st.items = 0; st.rares = 0; st.recent = [];
    render();
  }

  function calcRates() {
    const el = Math.max(1000, Date.now() - st.startAt);
    const hrs = el / 3600000;
    const xph = el >= 5000 ? st.exp / hrs : 0;
    const gph = el >= 5000 ? st.gold / hrs : 0;
    const kph = el >= 5000 ? st.kills / hrs : 0;
    let eta = "Đang đo...";
    if (st.info.expMax > 0 && isFinite(st.info.expMax)) {
      const rem = Math.max(0, st.info.expMax - st.info.exp);
      if (rem <= 0) eta = "Sẵn sàng lên cấp";
      else if (xph > 10 && el >= 15000) {
        const h = rem / xph;
        eta = h > 999 ? ">999 giờ" : h >= 1 ? `${Math.floor(h)}g ${Math.round((h % 1) * 60)}p` : `${Math.max(1, Math.round(h * 60))} phút`;
      }
    }
    return { el, xph, gph, kph, eta };
  }

  function render() {
    if (!bar.parentNode) return;
    const inGame = Date.now() - st.lastSync < 3500 && !!st.info.name;
    bar.style.display = "none";
    const bf = document.getElementById("vl-btn-farm");
    if (bf) bf.classList.toggle("on", st.panel);
    if (!inGame) { farmEl.style.display = "none"; if (st.active) setAfk(false); return; }
    const r = calcRates();

    if (st.panel && !st.active) {
      farmEl.style.display = "block";
      const dropsHtml = st.recent.length
        ? st.recent.slice(0, 6).map((x) => `<div class="vf-it" style="color:${x.col}">• ${esc(x.ten)}</div>`).join("")
        : `<div class="vf-it" style="color:#7d9589">Chưa nhặt trang bị xanh/hiếm nào</div>`;
      farmEl.innerHTML = `
        <div class="vf-hd"><span>Thống kê bãi · ${fmtDur(r.el)}</span><span class="vf-act"><button type="button" id="vf-rst">Đặt lại</button><button type="button" id="vf-cls">✕</button></span></div>
        <div class="vf-grid">
          <div class="vf-box"><small>EXP / giờ</small><b>${fmtN(r.xph)}</b></div>
          <div class="vf-box"><small>Lên cấp dự kiến</small><b>${esc(r.eta)}</b></div>
          <div class="vf-box"><small>Bạc / giờ</small><b>${fmtVan(r.gph)}</b></div>
          <div class="vf-box"><small>Quái hạ (${fmtN(r.kph)}/g)</small><b>${fmtN(st.kills)} con</b></div>
          <div class="vf-box"><small>Tổng EXP phiên</small><b>+${fmtN(st.exp)}</b></div>
          <div class="vf-box"><small>Đồ nhặt (hiếm)</small><b>${st.items} (${st.rares})</b></div>
        </div>
        <div class="vf-list">${dropsHtml}</div>
      `;
      const br = document.getElementById("vf-rst"); if (br) br.onclick = resetStats;
      const bc = document.getElementById("vf-cls"); if (bc) bc.onclick = () => { st.panel = false; render(); };
    } else {
      farmEl.style.display = "none";
    }

    if (st.active) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0"), mm = String(now.getMinutes()).padStart(2, "0");
      const inf = st.info;
      const hpP = Math.max(0, Math.min(100, (inf.hp / Math.max(1, inf.hpMax)) * 100));
      const mpP = Math.max(0, Math.min(100, (inf.mp / Math.max(1, inf.mpMax)) * 100));
      const xpP = inf.expMax > 0 && isFinite(inf.expMax) ? Math.max(0, Math.min(100, (inf.exp / inf.expMax) * 100)) : 0;
      const set = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
      const wid = (id, p) => { const e = document.getElementById(id); if (e) e.style.width = p.toFixed(1) + "%"; };
      set("va-clock", `${hh}:${mm}`);
      set("va-sub", `Đã treo ${fmtDur(r.el)} · ${inf.map || "Đang luyện công"}`);
      set("va-name", `${inf.name} · Cấp ${inf.lvl}`);
      set("va-auto", inf.auto ? "Tự đánh: Bật" : "Tự đánh: Tắt");
      wid("va-hp-i", hpP); set("va-hp-t", `Sinh lực: ${fmtN(inf.hp)} / ${fmtN(inf.hpMax)}`);
      wid("va-mp-i", mpP); set("va-mp-t", `Nội lực: ${fmtN(inf.mp)} / ${fmtN(inf.mpMax)}`);
      wid("va-xp-i", xpP); set("va-xp-t", `Kinh nghiệm: ${xpP.toFixed(1)}%`);
      set("va-xph", fmtN(r.xph));
      set("va-eta", r.eta);
      set("va-gph", fmtVan(r.gph));
      set("va-km", `${fmtN(st.kills)} quái · ${st.rares} hiếm`);
      const dr = document.getElementById("va-drops");
      if (dr) dr.innerHTML = st.recent.length
        ? `<div style="color:#9fc9b5;margin-bottom:3px">Đồ vừa nhặt gần nhất:</div>` + st.recent.slice(0, 5).map((x) => `<div style="color:${x.col}">• ${esc(x.ten)}</div>`).join("")
        : `<div style="color:#6d8579">Đang chờ nhặt trang bị xanh / vật phẩm hiếm...</div>`;
      const wn = document.getElementById("va-warn");
      if (wn) wn.style.display = inf.hp <= 0 ? "block" : "none";
    }
  }

  setInterval(render, 1000);

  window.VLAfk = {
    get active() { return st.active; },
    setActive: setAfk,
    get farmOpen() { return st.panel; },
    toggleFarm(v) { mount(); st.panel = (v == null ? !st.panel : !!v); render(); return st.panel; },
    sync(info) {
      if (!info || !info.name) return;
      const key = String(info.name);
      if (st.charKey && st.charKey !== key) resetStats();
      st.charKey = key;
      st.info = info;
      st.lastSync = Date.now();
      if (bar.style.display === "none" && !st.active) render();
    },
    addExp(v) { v = Number(v) || 0; if (v > 0) st.exp += v; },
    addGold(v) { v = Number(v) || 0; if (v > 0) st.gold += v; },
    addKill(v) { v = Number(v) || 0; if (v > 0) st.kills += v; },
    addItem(m, col) {
      if (!m) return;
      st.items++;
      const ten = m.sl ? `${m.sl} ${m.n}` : (m.n || "Vật phẩm") + (m.d ? ` (${m.d} dòng)` : "");
      const isRare = (m.d | 0) >= 1 || /hoàng kim|bạch kim|thủy tinh|tinh hồng|bí kíp|lệnh|tiên thảo|quế hoa|phúc duyên|huyền tinh|rương|đại thành|chiếu dạ|phi vân|bôn tiêu|phiên vũ/i.test(ten);
      if (isRare) {
        st.rares++;
        st.recent.unshift({ ten, col: cssColor(col) });
        if (st.recent.length > 20) st.recent.length = 20;
      }
    }
  };
})();
