// Hướng dẫn hoạt động (anh 05/11 — chọn mẫu A: đúng khung client "Giao diện hướng dẫn hoạt động", ui\ui3\uiactivityguide\activityguide.ini +
// activitycalendar.ini; nút ô thứ 3 cột icon = icon_bar.ini [Icon_1] — hình: cong-cu/dung-huong-dan.mjs). 4 thẻ:
//   Lịch trình hoạt động: trái trên hoạt động theo giờ (giờ · trạng thái theo giờ máy chủ), trái dưới hoạt động hằng ngày (NPC · số lần hôm nay của
//     nhân vật), phải trên chi tiết hoạt động đang chọn, phải dưới 4 ô Sắp diễn ra (chỗ "phần thưởng độ năng động" của client), dòng đầu: việc hằng ngày
//     đã làm + thanh tiến độ. Lịch: POST /api/lich-hd mỗi 60 giây + khi máy chủ báo "lichHd" (GM đổi lịch ở F10 — may-chu/lich-hd.js).
//   Tra cứu: rương & hộp quà · rơi đồ từ quái · hoạt động · vật phẩm (GET /api/tra-cuu, ETag — may-chu/tra-cuu.js dựng từ cấu hình đang chạy);
//     ô tìm (bỏ dấu), mục bên trái, nội dung bên phải. Phần thưởng: nhóm thưởng của Tra cứu. Tin cập nhật: mở khung Tin cập nhật.
// Điện thoại dọc (anh chọn chữ 16 px): lớp riêng hết màn — Lịch trình (theo giờ -> chi tiết -> hằng ngày), Tra cứu = danh sách -> chạm mục -> trang
// chi tiết ("‹" quay lại). Điện thoại ngang / máy tính: khung client (điện thoại ngang: dienthoai.js co cho vừa màn).
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// chữ của Tra cứu: thoát HTML rồi đổi 3 thẻ màu <y> vàng, <g> xanh, <c> cam
const md = (t) => esc(t).replace(/&lt;(\/?)(y|g|c)&gt;/g, (_, d, k) => (d ? "</span>" : `<span class="hd-${k}">`));
const boDau = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"], THU_NGAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN = 7 * 3600e3, p2 = (n) => String(n).padStart(2, "0");
const vnD = (t) => new Date(t + VN);
const hmCua = (t) => { const d = vnD(t); return p2(d.getUTCHours()) + ":" + p2(d.getUTCMinutes()); };
const ngayCua = (t) => vnD(t).toISOString().slice(0, 10);
const con = (ms) => {
  const p = Math.max(0, Math.ceil(ms / 60000));
  if (p >= 1440) return `${Math.floor(p / 1440)} ngày`;
  return p >= 60 ? `${Math.floor(p / 60)} giờ${p % 60 ? " " + (p % 60) : ""}` : `${p} phút`;
};
// hoạt động hằng ngày: [khóa số lần (may-chu/lich-hd.js cuaToi), tên, NPC đối thoại, từ khóa tìm mục Tra cứu]
const NGAY = [
  ["vuotAi", "Vượt Ải", "Nhiếp Thí Trần", "vượt ải"], ["satThu", "Nhiệm vụ Sát thủ", "Nhiếp Thí Trần", "sát thủ"], ["daTau", "Nhiệm vụ Dã Tẩu", "Dã Tẩu", "dã tẩu"],
  ["minhChu", "Võ Lâm Minh Chủ", "Hắc Bạch Sứ Giả", "minh chủ"], ["sanNhim", "Săn Nhím (bắt nhím)", "Nhím quanh thành", "săn nhím"],
  ["online", "Online nhận thưởng", "Nút Nhận thưởng", "online"], ["laHan", "Thiết La Hán", "Dùng trong túi", "thiết la hán"],
  ["uyThac", "Ủy thác", "Tự đánh rồi thoát game", "ủy thác"], ["dangNhap", "Đăng nhập nhận thưởng", "Nút Nhận thưởng", "đăng nhập"],
];
const THE = ["Lịch trình hoạt động", "Tra cứu", "Phần thưởng", "Tin cập nhật", "Ngũ hành"], THE_X = [18, 123, 229, 334, 439]; // Ngũ hành: anh 08/11 (trước ở Trợ Thủ → Tiện ích)

export class HuongDan {
  constructor(W, api) {
    this.W = W; this.api = api; this.tab = 0; this.chon = null; this.L = null; this.lech = 0; this.TC = null; this.tcv = ""; this.tim = "";
    this.muc = { 1: null, 2: null }; this.dtMuc = null; this.taiTc = null;
    const B = "img/";
    W.M.huongdan = {
      n: "Hướng dẫn hoạt động", ini: "(game — khung client uiactivityguide\\activityguide.ini)", order: ["Main", ...THE.map((_, i) => "Tab" + i), "Close"],
      sec: {
        Main: { x: 187, y: 159, w: 650, h: 450, moveable: 1, trans: 0, img: { file: B + "hd_nen.png", w: 650, h: 450, n: 1 } },
        ...Object.fromEntries(THE.map((t, i) => ["Tab" + i, { x: THE_X[i], y: 34, w: 103, h: 18, labelYOffset: 1, font: 12, hAlign: 1, vAlign: 1, color: [169, 211, 190], overColor: [225, 213, 43],
          selectColor: [225, 213, 43], up: 1, down: 0, checkBox: 1, trans: 0, img: { file: B + "hd_the.png", w: 103, h: 18, n: 2 }, label: t }])),
        Close: { x: 247, y: 427, w: 155, h: 20, up: 0, down: 1, over: 2, overFrame: 2, trans: 0, img: { file: B + "hd_dong.png", w: 155, h: 20, n: 3 } },
      },
    };
    const w = (this.w = W.get("huongdan"));
    w.el.classList.add("hd-khung");
    THE.forEach((_, i) => w.on("Tab" + i, () => { this.api.P.audio.ui("click"); if (i === 3) { this.datThe(this.tab); return this.api.openTin(); } this.datThe(i); this.ve(); }));
    this.ngayEl = document.createElement("div"); this.ngayEl.className = "hd-ngay"; w.el.appendChild(this.ngayEl);
    this.trang = document.createElement("div"); this.trang.className = "hd-trang"; w.el.appendChild(this.trang);
    this.trang.addEventListener("click", (e) => this._bam(e));
    this.trang.addEventListener("input", (e) => { if (e.target.classList.contains("hd-o-tim")) { this.tim = e.target.value; this._veIdx(); } });
    w.cb.show = () => { this.api.dangMo(true); this.ve(); this.taiLich(); if (this.tab) this.layTc(); };
    w.cb.hide = () => this.api.dangMo(!!(this.dt && this.dt.isConnected));
    // nhịp: đếm ngược mỗi 15 giây, tải lại lịch mỗi 60 giây (cả lúc đóng khung — chấm đỏ của nút khi có hoạt động đang diễn ra)
    this._nhip = setInterval(() => { if (this.moi()) this._veGio(); }, 15000);
    this._tai = setInterval(() => this.taiLich(), 60000);
    // xoay điện thoại: dọc -> lớp hết màn, ngang -> khung client
    addEventListener("resize", () => {
      if (this.dt && this.dt.isConnected && !this.doc()) { this.dongDt(); this.open(this.tab); }
      else if (this.w.visible && this.doc()) { this.w.hide(); this.moDt(); }
    });
  }
  now() { return Date.now() + this.lech; }
  doc() { const b = document.body.classList; return b.contains("dt") && !b.contains("dt-ngang"); } // điện thoại dựng dọc
  moi() { return this.w.visible || !!(this.dt && this.dt.isConnected); }
  datThe(i) { this.tab = i; THE.forEach((_, k) => this.w.check("Tab" + k, k === i)); }
  open(tab, muc) {
    if (tab != null) this.tab = tab;
    if (muc) { this.muc[this.tab === 2 ? 2 : 1] = muc; this.dtMuc = muc; this.canThe(); }
    if (this.doc()) return this.moDt();
    const M = this.W.M.huongdan.sec.Main;
    if (!this.w.visible) Object.assign(this.w.el.style, { left: Math.round((1024 - M.w) / 2) + "px", top: Math.round((768 - M.h) / 2) + "px" });
    this.datThe(this.tab); this.w.show(); this.ve();
    if (this.tab) this.layTc();
  }
  toggle() { if (this.moi()) { this.w.hide(); this.dongDt(); } else this.open(); }
  // mục đang chờ mở thuộc nhóm Phần thưởng mà đang ở thẻ Tra cứu (hoặc ngược lại) -> sang đúng thẻ (dữ liệu chưa tải: làm lại khi tải xong)
  canThe() {
    if (!this.TC || (this.tab !== 1 && this.tab !== 2)) return;
    const id = this.muc[this.tab] || this.dtMuc, [g] = id ? this.timMuc(id) : [null]; if (!g) return;
    const can = g.id === "thuong" ? 2 : 1; if (can === this.tab) return;
    this.muc[can] = id; this.muc[this.tab] = null; this.datThe(can);
  }
  dong() { this.w.hide(); this.dongDt(); }

  // ---------- dữ liệu ----------
  async taiLich() {
    const h = this.api.hero(); if (!h || this._dangTai) return;
    this._dangTai = true;
    try {
      const L = await this.api.net.lichHd(h.slot | 0);
      this.L = L; this.lech = (L.t || Date.now()) - Date.now();
      const tcDoi = !!(L.tcv && this.TC && L.tcv !== this.TC.v); if (tcDoi) this.TC = null; // GM đổi lịch -> chữ Tra cứu đổi
      this.api.chamDo(L.ds.some((x) => x.dang));
      if (this.moi()) { if (this.tab === 0) this._veGio(); else if (tcDoi) this.ve(); }
    } catch (e) { if (e.ma !== "het-phien") console.warn("Lịch hoạt động:", e.message); }
    this._dangTai = false;
  }
  layTc() {
    if (this.TC) return Promise.resolve(this.TC);
    if (!this.taiTc) this.taiTc = this.api.net.traCuu().then((j) => { this.TC = j; this.taiTc = null; this.loiTc = ""; this.canThe(); if (this.moi()) { if (this.tab === 0) this._veGio(); else this.ve(); } if (this.api.tcXong) this.api.tcXong(); return j; })
      .catch((e) => { this.taiTc = null; this.loiTc = e.message; if (this.moi()) this.ve(); return null; });
    return this.taiTc;
  }
  nhom(id) { return this.TC ? (this.TC.nhom || []).find((n) => n.id === id) : null; }
  timMuc(id) { for (const n of (this.TC && this.TC.nhom) || []) { const m = n.muc.find((x) => x.id === id); if (m) return [n, m]; } return [null, null]; }
  // mục "hd" (hoặc "thuong") của 1 hoạt động: theo lịch (id) rồi theo từ khóa tên
  mucHd(id, tu) {
    const H = this.nhom("hd"), T = this.nhom("thuong");
    let m = H && H.muc.find((x) => x.lich === id);
    if (!m && tu) { const k = boDau(tu); m = [H, T].filter(Boolean).flatMap((n) => n.muc).find((x) => boDau(x.ten).includes(k)); }
    return m || null;
  }
  // tìm (bỏ dấu): tên, tóm tắt, từ khóa thêm
  loc(ds) {
    const q = boDau(this.tim.trim()); if (!q) return ds;
    const tu = q.split(/\s+/).filter(Boolean);
    return ds.filter((m) => { const s = boDau(m.ten + " " + (m.tom || "") + " " + (m.tim || "")); return tu.every((t) => s.includes(t)); });
  }

  // ---------- trạng thái hoạt động theo giờ ----------
  tt(x, now) {
    if (x.dang) return ["Đang diễn ra", "dang"];
    if (!x.bat) return ["Tạm dừng", "qua"];
    if (x.xongHom) return ["Đã kết thúc", "qua"];
    if (x.nghi) return ["Hôm nay nghỉ", "qua"];
    if (x.toi) return ["Còn " + con(x.toi - now), "sap"];
    return ["—", "qua"];
  }
  gio(x, now) {
    if (x.dang && x.tu) return hmCua(x.tu);
    if (x.id === "pld" && x.gio.length === 12 && x.gio.every((g, i) => g === p2(i * 2) + ":00") && !x.thu) return "Giờ chẵn";
    if (!x.toi) return x.gio[0] || "—";
    return this.gioToi(x, now);
  }
  // giờ lần tới thật (Sắp diễn ra, chi tiết — không viết tắt "Giờ chẵn"): hôm nay HH:MM, mai "Mai HH:MM", xa hơn "T7 HH:MM"
  gioToi(x, now) {
    if (!x.toi) return "";
    if (ngayCua(x.toi) === ngayCua(now)) return hmCua(x.toi);
    const mai = ngayCua(now + 86400e3) === ngayCua(x.toi);
    return (mai ? "Mai " : THU_NGAN[vnD(x.toi).getUTCDay()] + " ") + hmCua(x.toi);
  }
  dsGio() {
    const now = this.now(), L = (this.L && this.L.ds) || [];
    const k = (x) => (x.dang ? 0 : x.bat && x.toi ? 1 : 2) * 1e14 + (x.dang ? x.tu : x.toi || 9e13);
    return L.slice().sort((a, b) => k(a) - k(b));
  }
  soNgay(id) { const T = this.L && this.L.toi; return T ? T[id] : undefined; }
  chuNgay(id) {
    const v = this.soNgay(id);
    if (v === undefined) return id === "teDan" && this.L && this.L.toi ? ["—", "qua"] : ["…", ""]; // teDan: máy chủ chưa có bang hội đợt 2
    if (v === null) return id === "minhChu" ? ["Cấp 120", "qua"] : id === "teDan" ? ["Bang cấp 1", "qua"] : ["—", "qua"];
    if (typeof v === "boolean") return v ? ["Đã nhận", "du"] : ["Chưa nhận", "sap"];
    const [n, m] = v, s = `${n}/${m}${id === "uyThac" ? " giờ" : ""}`;
    return [s, n >= m ? "du" : ""];
  }
  tienDo() {
    let a = 0, b = 0;
    for (const [id] of NGAY) { const v = this.soNgay(id); if (Array.isArray(v) && id !== "uyThac") { a += Math.min(v[0], v[1]); b += v[1]; } else if (typeof v === "boolean") { a += v ? 1 : 0; b += 1; } }
    return [a, b];
  }
  sapToi() {
    const now = this.now(), o = [];
    for (const x of (this.L && this.L.ds) || []) {
      if (x.dang) o.push({ id: x.id, t: 0, gio: x.tu ? hmCua(x.tu) : "", ten: x.ten, chu: x.den ? "đang diễn ra — còn " + con(x.den - now) : "đang diễn ra", dang: 1 });
      else if (x.bat && x.toi) o.push({ id: x.id, t: x.toi, gio: this.gioToi(x, now), ten: x.ten, chu: "còn " + con(x.toi - now) });
    }
    return o.sort((a, b) => a.t - b.t).slice(0, 4);
  }
  // chi tiết 1 hoạt động: [tên, html]
  chiTiet(id) {
    const x = ((this.L && this.L.ds) || []).find((y) => y.id === id), d = NGAY.find((y) => y[0] === id);
    const m = this.mucHd(id, d ? d[3] : x ? x.ten : ""), ten = x ? x.ten : d ? d[1] : m ? m.ten : "";
    let h = "";
    if (x) {
      const now = this.now(), [t] = this.tt(x, now);
      const lich = x.id === "phuQuy" ? `quay số ${x.gio[0] || ""} mỗi ngày` : x.id === "pld" && this.gio(x, now) === "Giờ chẵn" ? "mỗi giờ chẵn"
        : x.id === "bauCua" && x.gio[0] && x.dai ? `${x.gio[0]} – ${hmCua(Date.UTC(2000, 0, 1) - VN + (+x.gio[0].slice(0, 2) * 60 + +x.gio[0].slice(3, 5) + x.dai) * 60000)}` : x.gio.join(", "); // Bầu Cua: giờ mở – giờ đóng
      h += `<p><span class="hd-y">Lịch:</span> ${esc(lich)}${x.thu ? " · " + esc(x.thu.map((k) => THU[k]).join(", ")) : x.id === "phuQuy" ? "" : " · mọi ngày"}</p>`;
      h += `<p><span class="hd-y">Bây giờ:</span> <span class="hd-${x.dang ? "g" : "c"}">${esc(x.chu || t)}</span>${!x.dang && x.bat && x.toi ? ` — lần tới ${esc(this.gioToi(x, now))}` : ""}</p>`;
    } else if (d) {
      const [s] = this.chuNgay(id); h += `<p><span class="hd-y">Hôm nay:</span> ${esc(s)}</p>`;
    }
    if (m && Array.isArray(m.ct)) h += m.ct.map(([k, v]) => `<p><span class="hd-y">${esc(k)}:</span> ${md(v)}</p>`).join("");
    else if (!this.TC) h += `<p class="hd-mo">${this.loiTc ? "Không tải được chi tiết: " + esc(this.loiTc) : "Đang tải chi tiết…"}</p>`;
    if (m) h += `<p class="hd-xem" data-muc="${esc(m.id)}">› Xem đầy đủ trong Tra cứu</p>`;
    return [ten, h];
  }

  // ---------- vẽ (máy tính / điện thoại ngang: khung client) ----------
  // thẻ Ngũ hành (TroThu.nguHanhDom): cách mặc đồ ngũ hành theo hệ vũ khí — bấm đổi hệ thì vẽ lại
  _veNh(el) {
    const h = this.api.hero(); if (!h || !h.auto) return;
    const N = this.api.nguHanh(h, () => this.ve()), o = document.createElement("div"); o.className = "hd-nh"; // bố cục: anh 09/11 chọn mẫu C — khung trang bị + danh sách theo hệ
    if (this.dt && this.dt.isConnected) { // điện thoại (anh 09/11 "làm theo phần nhân vật ấy, size = cái đó"): nút chọn hệ + khung trang bị đúng cỡ khung Nhân vật (dienthoai.js _xepCuaSo: to nhất × 1,3, vừa bề ngang)
      const K = Math.min(1.3, (innerWidth - 8) / 318), rong = Math.round(314 * K), k2 = rong / 296, cao = Math.round((parseFloat(N.bang.style.height) || 238) * k2);
      Object.assign(N.bang.style, { position: "absolute", left: 0, top: 0, margin: 0, transformOrigin: "0 0", transform: `scale(${k2})` });
      const hop = document.createElement("div"); Object.assign(hop.style, { position: "relative", width: rong + "px", height: cao + "px" }); hop.append(N.bang);
      o.style.width = rong + "px"; o.append(N.hang, hop); if (N.ghi) { N.ghi.className = "hd-nh-ghi"; o.append(N.ghi); }
      el.replaceChildren(o); return;
    }
    const bang = document.createElement("div"); bang.className = "hd-nh-bang"; bang.append(N.bang);
    const ds = document.createElement("div"); ds.className = "hd-nh-ds";
    ds.innerHTML = `<div class="hd-nh-tieu">Mặc đồ theo hệ</div>` + N.nhom.map((x) => `<div class="hd-nh-o" style="border-left-color:${x.mau}"><b style="color:${x.mau}">${esc(x.ten.toUpperCase())}</b><div>${x.o.map(esc).join(" · ")}</div></div>`).join("");
    if (N.ghi) { N.ghi.className = "hd-nh-ghi"; ds.append(N.ghi); }
    o.append(N.hang, bang, ds);
    el.replaceChildren(o);
  }
  ve() {
    if (this.dt && this.dt.isConnected) return this.veDt();
    if (!this.w.visible) return;
    const now = this.now(), d = vnD(now);
    this.ngayEl.textContent = `${THU[d.getUTCDay()]} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)} · ${hmCua(now)}`;
    this.trang.className = "hd-trang hd-t" + this.tab;
    if (this.tab === 0) this._veLich(); else if (this.tab === 4) this._veNh(this.trang); else this._veTc();
  }
  _veLich() {
    if (!this.L) this.taiLich();
    if (!this.TC) this.layTc(); // chi tiết hoạt động (thời gian, NPC, điều kiện, phần thưởng) lấy từ dữ liệu Tra cứu
    const now = this.now(), G = this.dsGio(), [a, b] = this.tienDo();
    if (!this.chon) this.chon = (G[0] && G[0].id) || "phongHoa";
    const dg = (x) => { const [t, c] = this.tt(x, now); return `<div class="hd-r${this.chon === x.id ? " on" : ""}" data-lich="${x.id}"><span class="c1">${esc(x.ten)}</span><span class="c2 hd-sap">${esc(this.gio(x, now))}</span><span class="c3 hd-${c}">${esc(t)}</span></div>`; };
    const dn = ([id, ten, npc]) => { const [t, c] = this.chuNgay(id); return `<div class="hd-r${this.chon === id ? " on" : ""}" data-lich="${id}"><span class="c1">${esc(ten)}</span><span class="c2">${esc(npc)}</span><span class="c3${c ? " hd-" + c : ""}">${esc(t)}</span></div>`; };
    const [ten, ct] = this.chiTiet(this.chon);
    this.trang.innerHTML = `<i class="hd-bieu"></i><div class="hd-tien">Việc hằng ngày đã làm: ${a}/${b}</div><div class="hd-thanh"><i style="width:${b ? Math.round((a * 100) / b) : 0}%"></i></div>` +
      `<div class="hd-nhan" style="top:40px">Hoạt động theo giờ</div><div class="hd-cot" style="top:54px"><span class="c1">Tên hoạt động</span><span class="c2">Giờ</span><span class="c3">Trạng thái</span></div>` +
      `<div class="hd-ds hd-gio" style="top:68px;height:136px">${this.L ? G.map(dg).join("") : '<div class="hd-mo">Đang tải lịch…</div>'}</div>` +
      `<div class="hd-nhan" style="top:204px">Hoạt động hằng ngày</div><div class="hd-cot" style="top:218px"><span class="c1">Tên hoạt động</span><span class="c2">NPC đối thoại</span><span class="c3">Hôm nay</span></div>` +
      `<div class="hd-ds hd-ngay2" style="top:232px;height:135px">${NGAY.map(dn).join("")}</div>` +
      `<div class="hd-ten" style="top:40px">${esc(ten)}</div><div class="hd-ct">${ct}</div>` +
      `<div class="hd-ten" style="top:203px">Sắp diễn ra</div>` +
      this.sapToi().map((s, i) => `<div class="hd-o" data-lich="${s.id}" style="top:${222 + i * 38}px"><i></i><b>${esc((s.gio ? s.gio + " " : "") + s.ten)}</b><em class="hd-${s.dang ? "g" : "sap"}">${esc(s.chu)}</em></div>`).join("");
  }
  // chỉ cập nhật chữ giờ (nhịp 15 giây) — vẽ lại cả trang nhưng giữ chỗ cuộn
  _veGio() {
    if (this.dt && this.dt.isConnected) { if (this.tab !== 0) return; const k = this.dt.querySelector(".hd-dt-noi"), y = k ? k.scrollTop : 0; this.veDt(); const k2 = this.dt.querySelector(".hd-dt-noi"); if (k2) k2.scrollTop = y; return; }
    if (!this.w.visible || this.tab !== 0) { if (this.w.visible) this.ngayEl.textContent = this.ngayEl.textContent.replace(/\d\d:\d\d$/, hmCua(this.now())); return; }
    const cu = [...this.trang.querySelectorAll(".hd-ds, .hd-ct")].map((e) => e.scrollTop);
    this.ve();
    [...this.trang.querySelectorAll(".hd-ds, .hd-ct")].forEach((e, i) => { e.scrollTop = cu[i] || 0; });
  }
  _veTc() {
    const n = this.tab === 2 ? "thuong" : null;
    if (!this.TC) { this.layTc(); this.trang.innerHTML = `<div class="hd-mo hd-mo-giua">${this.loiTc ? "Không tải được Tra cứu: " + esc(this.loiTc) : "Đang tải Tra cứu…"}</div>`; return; }
    const cu = this.trang.querySelector(".hd-o-tim");
    if (cu && cu.value !== this.tim) cu.value = this.tim;
    if (!cu || this.trang.dataset.tc !== String(this.tab)) {
      this.trang.dataset.tc = String(this.tab);
      this.trang.innerHTML = `<div class="hd-ten" style="left:6px;top:9px">${n ? "Phần thưởng" : "Tra cứu"}</div><input class="hd-o-tim" maxlength="40" spellcheck="false" placeholder="Tìm món, rương, hoạt động…" value="${esc(this.tim)}">` +
        `<div class="hd-ds hd-idx"></div><div class="hd-noi"></div>`;
    }
    this._veIdx();
  }
  dsTc() { // [[nhóm, [mục]]] của thẻ đang mở (đã lọc theo ô tìm)
    const L = ((this.TC && this.TC.nhom) || []).filter((g) => (this.tab === 2 ? g.id === "thuong" : g.id !== "thuong"));
    return L.map((g) => [g, this.loc(g.muc)]).filter(([, m]) => m.length);
  }
  _veIdx() {
    const idx = this.trang.querySelector(".hd-idx"), noi = this.trang.querySelector(".hd-noi"); if (!idx || !noi) return;
    const D = this.dsTc(), k = this.tab === 2 ? 2 : 1, tat = D.flatMap(([, m]) => m);
    if (!tat.find((m) => m.id === this.muc[k])) this.muc[k] = tat[0] ? tat[0].id : null;
    idx.innerHTML = D.length ? D.map(([g, ds]) => `<div class="hd-r n">${esc(g.ten)}</div>` + ds.map((m) => `<div class="hd-r${m.id === this.muc[k] ? " on" : ""}" data-muc="${esc(m.id)}">· ${esc(m.ten)}</div>`).join("")).join("")
      : `<div class="hd-mo">Không thấy mục nào khớp "${esc(this.tim)}"</div>`;
    const [, m] = this.timMuc(this.muc[k]);
    noi.innerHTML = m ? this.noiHtml(m) : "";
    noi.scrollTop = 0;
    const on = idx.querySelector(".on"); if (on && (on.offsetTop < idx.scrollTop || on.offsetTop > idx.scrollTop + idx.clientHeight - 17)) idx.scrollTop = on.offsetTop - 40;
  }
  noiHtml(m) {
    const khoi = (b) => {
      if (b.h) return `<div class="hd-h">${md(b.h)}</div>`;
      if (b.p) return `<p>${md(b.p)}</p>`;
      if (b.ds) return `<ul>${b.ds.map((x) => `<li>${md(x)}</li>`).join("")}</ul>`;
      if (b.bang) {
        // cột toàn ô ngắn (≤ 24 chữ): không xuống dòng, căn theo can (mặc định cột sau căn phải); cột có ô dài: căn trái, xuống dòng (bảng hẹp không ép cột đầu)
        const can = b.can || [], dai = (x) => String(x == null ? "" : x).replace(/<\/?[ygc]>/g, "").length;
        const ngan = (b.bang[0] || []).map((_, j) => b.bang.slice(1).every((r) => dai(r[j]) <= 24));
        const c = (i) => { const k = [((can[i] || (i ? "r" : "l")) === "r" && ngan[i]) ? "r" : "", ngan[i] ? "n" : ""].filter(Boolean).join(" "); return k ? ` class="${k}"` : ""; };
        return `<table class="hd-bang">${b.bang.map((r, i) => `<tr${i ? "" : ' class="h"'}>${r.map((x, j) => `<td${c(j)}>${md(x)}</td>`).join("")}</tr>`).join("")}</table>`;
      }
      return "";
    };
    return `<div class="hd-noi-ten">${m.ic ? `<img src="assets/web/icon/${esc(m.ic)}" alt="">` : ""}${esc(m.ten)}</div>${m.tom ? `<div class="hd-tom">${md(m.tom)}</div>` : ""}${(m.noi || []).map(khoi).join("")}`;
  }
  _bam(e) {
    const t = e.target.closest("[data-lich],[data-muc]"); if (!t) return;
    this.api.P.audio.ui("click");
    // anh 17/11 "bấm xong nó lại quay về cái khác, cái cần thì nó tụt xuống dưới": chọn dòng thì giữ chỗ cuộn của 2 danh sách (chi tiết bên phải về đầu);
    // chọn ở ô "Sắp diễn ra" mà dòng đó đang khuất thì cuộn danh sách tới dòng đó
    if (t.dataset.lich) {
      const cu = [...this.trang.querySelectorAll(".hd-ds")].map((x) => x.scrollTop), tuDs = !!t.closest(".hd-ds");
      this.chon = t.dataset.lich; this.ve();
      this.trang.querySelectorAll(".hd-ds").forEach((x, i) => { x.scrollTop = cu[i] || 0; });
      const on = !tuDs && this.trang.querySelector(".hd-ds .hd-r.on"), k = on && on.parentElement;
      if (k) { const r = on.getBoundingClientRect(), rk = k.getBoundingClientRect(); if (r.top < rk.top || r.bottom > rk.bottom) k.scrollTop = Math.max(0, k.scrollTop + r.top - rk.top - 20); }
      return;
    }
    const id = t.dataset.muc, [g] = this.timMuc(id);
    if (this.tab === 0 || (g && (g.id === "thuong") !== (this.tab === 2))) { this.tim = ""; this.datThe(g && g.id === "thuong" ? 2 : 1); this.muc[this.tab] = id; this.ve(); return; }
    this.muc[this.tab === 2 ? 2 : 1] = id; this._veIdx();
  }

  // ---------- điện thoại dọc: lớp hết màn, chữ 16 px ----------
  moDt() {
    if (!this.dt) {
      const d = (this.dt = document.createElement("div")); d.id = "hd-dt";
      d.addEventListener("click", (e) => this._bamDt(e));
      d.addEventListener("input", (e) => { if (e.target.classList.contains("hd-o-tim")) { this.tim = e.target.value; this._veDsDt(); } });
    }
    if (!this.dt.isConnected) {
      const jw = document.getElementById("jxwin"); document.body.insertBefore(this.dt, jw || null); this.api.dangMo(true);
      for (const w of this.W.open()) if (!w.sticky) w.hide(); // cửa sổ client cùng lớp nằm trên: đóng (vd mở từ Trợ Thủ → Tiện ích → Tra cứu)
      // máy tính cửa sổ hẹp (giao diện điện thoại): Esc đóng lớp này
      this._esc = this._esc || ((e) => { if (e.key === "Escape" && this.dt && this.dt.isConnected) { e.stopPropagation(); e.preventDefault(); this.dongDt(); } });
      addEventListener("keydown", this._esc, true);
    }
    if (this.tab === 3) this.tab = 0;
    this.taiLich(); if (this.tab) this.layTc();
    this.veDt();
  }
  dongDt() { if (this._esc) removeEventListener("keydown", this._esc, true); if (this.dt && this.dt.isConnected) { this.dt.remove(); this.api.dangMo(this.w.visible); } }
  veDt() {
    const d = this.dt; if (!d) return;
    d.innerHTML = `<div class="hd-dt-dau">Hướng dẫn hoạt động<b class="hd-dt-x" data-dt="x">✕</b></div><div class="hd-dt-the">${[["Lịch trình", 0], ["Tra cứu", 1], ["Phần thưởng", 2], ["Ngũ hành", 4]].map(([t, i]) => `<span data-dt="t${i}"${i === this.tab ? ' class="on"' : ""}>${t}</span>`).join("")}</div>` +
      `<div class="hd-dt-noi">${this.tab === 0 ? this._dtLich() : this.tab === 4 ? "" : this._dtTc()}</div>`;
    if (this.tab === 4) this._veNh(d.querySelector(".hd-dt-noi"));
    else if (this.tab !== 0) this._veDsDt();
  }
  _dtLich() {
    if (!this.TC) this.layTc();
    const now = this.now(), G = this.dsGio(), d = vnD(now), [a, b] = this.tienDo();
    if (this.chon == null) this.chon = (G[0] && G[0].id) || "phongHoa";
    const [ten, ct] = this.chon ? this.chiTiet(this.chon) : ["", ""], ctHtml = this.chon ? `<div class="hd-dt-ct"><div class="hd-dt-ten">${esc(ten)}</div>${ct}</div>` : "";
    let h = `<div class="hd-dt-nh">Hoạt động theo giờ · ${THU[d.getUTCDay()]} ${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)} · ${hmCua(now)}</div>`;
    if (!this.L) h += `<div class="hd-mo">Đang tải lịch…</div>`;
    let daCt = false;
    for (const x of G) {
      const [t, c] = this.tt(x, now);
      h += `<div class="hd-dt-r${this.chon === x.id ? " on" : ""}" data-lich="${x.id}"><span>${esc(x.ten)}</span><span class="hd-sap">${esc(this.gio(x, now))}</span><span class="hd-${c}">${esc(t)}</span></div>`;
      if (this.chon === x.id) { h += ctHtml; daCt = true; }
    }
    h += `<div class="hd-dt-nh">Hoạt động hằng ngày · đã làm ${a}/${b}</div>`;
    for (const [id, tn] of NGAY) {
      const [t, c] = this.chuNgay(id);
      h += `<div class="hd-dt-r${this.chon === id ? " on" : ""}" data-lich="${id}"><span>${esc(tn)}</span><span></span><span${c ? ` class="hd-${c}"` : ""}>${esc(t)}</span></div>`;
      if (this.chon === id && !daCt) h += ctHtml;
    }
    return h;
  }
  _dtTc() {
    if (!this.TC) { this.layTc(); return `<div class="hd-mo">${this.loiTc ? "Không tải được Tra cứu: " + esc(this.loiTc) : "Đang tải Tra cứu…"}</div>`; }
    const [g, m] = this.dtMuc ? this.timMuc(this.dtMuc) : [null, null];
    if (m && (g.id === "thuong") === (this.tab === 2)) return `<div class="hd-dt-lui" data-dt="lui">‹ ${esc(g.ten)}</div><div class="hd-dt-ct2">${this.noiHtml(m)}</div>`;
    const L = ((this.TC && this.TC.nhom) || []).filter((x) => (this.tab === 2 ? x.id === "thuong" : x.id !== "thuong"));
    if (!this.dtNhom || !L.find((x) => x.id === this.dtNhom)) this.dtNhom = L[0] ? L[0].id : null;
    return `<div class="hd-dt-tim"><input class="hd-o-tim" maxlength="40" spellcheck="false" placeholder="Tìm: rương, món, hoạt động…" value="${esc(this.tim)}"></div>` +
      (L.length > 1 ? `<div class="hd-dt-chip">${L.map((x) => `<span data-dt="n${esc(x.id)}"${x.id === this.dtNhom ? ' class="on"' : ""}>${esc(x.ten)}</span>`).join("")}</div>` : "") + `<div class="hd-dt-ds"></div>`;
  }
  _veDsDt() {
    const k = this.dt && this.dt.querySelector(".hd-dt-ds"); if (!k) return;
    const L = ((this.TC && this.TC.nhom) || []).filter((x) => (this.tab === 2 ? x.id === "thuong" : x.id !== "thuong"));
    const ds = this.tim.trim() ? L.flatMap((g) => this.loc(g.muc)) : this.loc((L.find((x) => x.id === this.dtNhom) || { muc: [] }).muc);
    k.innerHTML = ds.length ? ds.map((m) => `<div class="hd-dt-m" data-muc="${esc(m.id)}"><div><b>${esc(m.ten)}</b>${m.tom ? `<em>${md(m.tom)}</em>` : ""}</div><i>›</i></div>`).join("")
      : `<div class="hd-mo">Không thấy mục nào khớp "${esc(this.tim)}"</div>`;
    const chip = this.dt.querySelector(".hd-dt-chip"); if (chip) chip.style.display = this.tim.trim() ? "none" : "";
  }
  _bamDt(e) {
    const t = e.target.closest("[data-dt],[data-lich],[data-muc]"); if (!t) return;
    this.api.P.audio.ui("click");
    const k = t.dataset.dt, noi = () => this.dt.querySelector(".hd-dt-noi");
    if (k === "x") return this.dongDt();
    if (k && k[0] === "t") { this.tab = +k[1]; this.dtMuc = null; this.veDt(); if (this.tab) this.layTc(); return; }
    if (k && k[0] === "n") { this.dtNhom = k.slice(1); this.veDt(); return; }
    if (k === "lui") { this.dtMuc = null; this.veDt(); return; }
    if (t.dataset.lich) { this.chon = this.chon === t.dataset.lich ? "" : t.dataset.lich; const y = noi().scrollTop; this.veDt(); noi().scrollTop = y; return; }
    if (t.dataset.muc) {
      const [g] = this.timMuc(t.dataset.muc); if (!g) return;
      this.tab = g.id === "thuong" ? 2 : 1; this.dtMuc = t.dataset.muc; this.veDt(); noi().scrollTop = 0;
    }
  }
}
