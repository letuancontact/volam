"use strict";
const fs = require("fs");
const path = require("path");
const D = require("./du-lieu");
const DO = require("./do");
const TG = () => require("./the-gioi");

const VAN = 10000;
const DAY_MS = 86400000;
const TEN_CV = { chu: "Bang chủ", lao: "Trưởng Lão", doi: "Đội trưởng", de: "Đệ tử", an: "Ẩn sỹ" };
const TEN_PHE = { 1: "Chính phái", 2: "Tà phái", 3: "Trung lập" };
const QUYEN_MAC = {
  "1001": 1, "1002": 1, "1003": 1, "1004": 1, "1005": 1,
  "2001": 1, "2002": 1, "2003": 1, "2004": 1, "2005": 1
};
const TP_MAC = {
  leVat: { k: "leVat", ten: "Khu Lễ vật", cap: 1, sd: 1, mo: 1 },
  binhGiap: { k: "binhGiap", ten: "Binh giáp phường", cap: 0, sd: 0, mo: 0 },
  thienCong: { k: "thienCong", ten: "Thiên công phường", cap: 0, sd: 0, mo: 0 },
  diDung: { k: "diDung", ten: "Dị dung phường", cap: 0, sd: 0, mo: 0 },
  thienY: { k: "thienY", ten: "Thiên ý phường", cap: 0, sd: 0, mo: 0 },
  thiLuyen: { k: "thiLuyen", ten: "Thí luyện phường", cap: 0, sd: 0, mo: 0 },
  hoatDong: { k: "hoatDong", ten: "Hoạt động phường", cap: 0, sd: 0, mo: 0 }
};

function docCauHinh() {
  for (const p of [path.join(D.ROOT, "..", "cau-hinh.json"), path.join(D.ROOT, "cau-hinh.json")]) {
    try { const j = JSON.parse(fs.readFileSync(p, "utf8")); if (j && j.bangHoi) return j.bangHoi; } catch {}
  }
  return {};
}
const cfGoc = docCauHinh();
const CF = {
  bat: true,
  capLap: 10,
  tsLap: 0,
  phiLap: 10 * VAN,
  khaoNgay: 0,       // Chọn A: bỏ khảo nghiệm, lập xong thành bang chính thức ngay
  khaoNguoi: 0,
  khaoIp: 0,
  roiCho: 0,         // không bắt chờ 24h khi rời bang
  phiRoi: 0,
  maxTv: 80,
  quyenCong: 1,
  quyenTuan: [1000, 2000, 3000, 4000, 5000, 5000],
  chia: { duTru: 0.15, kt: 0.06, cb: 0.04 },
  baoTri: { tv: 5, hoatDong: 7, dung: 7, tuBu: 10 },
  teDan: { cong: 50, cb: 5 },
  phatDu: { toiDaLan: 500, nguoiTuan: 500 },
  phatQuy: { vaoNgay: 0, moiNguoi: 500, nguoiTuan: 500, tuan: 5000 },
  doiPhe: { phi: 100 * VAN },
  hoBang: { so: 3, cong: 200, congMin: 1000, ngay: 7 },
  ruBan: { ngay: 7, hetNgay: 14, cong: 300, congMoi: 300, kt: 200, congCan: 300 },
  ruongCanBang: 0,
  mucTieu: {
    phanBang: 0.4,
    ds: ["vuotAi", "tongKim", "satThu"],
    loai: {
      vuotAi: { ten: "Vượt Ải", can: [150, 300], thuong: [400, 720] },
      tongKim: { ten: "Tống Kim", can: [100, 200], thuong: [425, 765] },
      satThu: { ten: "Sát thủ", can: [50, 100], thuong: [375, 675] }
    }
  },
  ...cfGoc
};

const TEP = path.join(D.ROOT, "bang-hoi.json");
let kiemTenCam = null;
let khoaLyDo = null;
let luuHen = null;

function ngayVn(ms = Date.now()) {
  const d = new Date(ms + 7 * 3600000);
  return d.toISOString().slice(0, 10);
}
function tuanVn(ms = Date.now()) {
  const d = new Date(ms + 7 * 3600000);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function loi(msg, code = 400) { const e = new Error(msg); e.code = code; throw e; }
function keyNv(tk, o, ten) { return `${String(tk || "").toLowerCase()}|${o == null ? "" : (o | 0)}|${String(ten || "").toLowerCase()}`; }

// Trạng thái lưu trong du-lieu/bang-hoi.json
let DB = { nextId: 1, bangs: {}, moi: {}, cho: {}, phieu: {}, duaCap: { "2": [], "4": [] } };
// Chỉ mục tra cứu O(1)
const idxNv = new Map();     // "tk|o" và "tk||ten" -> { id, m }
const idxTen = new Map();    // tenBang.toLowerCase() -> id

function xayIndex() {
  idxNv.clear(); idxTen.clear();
  for (const [id, B] of Object.entries(DB.bangs || {})) {
    if (!B) continue;
    B.id = String(id);
    idxTen.set(String(B.ten || "").toLowerCase(), B.id);
    B.tv = Array.isArray(B.tv) ? B.tv : [];
    for (const m of B.tv) {
      if (!m || !m.tk) continue;
      const tkl = String(m.tk).toLowerCase();
      if (m.o != null) idxNv.set(`${tkl}|${m.o | 0}`, { id: B.id, m });
      if (m.ten) idxNv.set(`${tkl}||${String(m.ten).toLowerCase()}`, { id: B.id, m });
    }
  }
}

function nap() {
  try {
    if (fs.existsSync(TEP)) {
      const raw = JSON.parse(fs.readFileSync(TEP, "utf8"));
      if (raw && typeof raw === "object") {
        DB = {
          nextId: +raw.nextId || 1,
          bangs: raw.bangs && typeof raw.bangs === "object" ? raw.bangs : {},
          moi: raw.moi && typeof raw.moi === "object" ? raw.moi : {},
          cho: raw.cho && typeof raw.cho === "object" ? raw.cho : {},
          phieu: raw.phieu && typeof raw.phieu === "object" ? raw.phieu : {},
          duaCap: raw.duaCap && typeof raw.duaCap === "object" ? raw.duaCap : { "2": [], "4": [] }
        };
      }
    }
  } catch (e) {
    console.error("Bang hội — đọc tệp lỗi:", e.message);
  }
  xayIndex();
}
nap();

function ghiNgay() {
  if (luuHen) { clearTimeout(luuHen); luuHen = null; }
  try {
    fs.mkdirSync(path.dirname(TEP), { recursive: true });
    const tmp = TEP + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(DB, null, 2), "utf8");
    fs.renameSync(tmp, TEP);
  } catch (e) {
    console.error("Bang hội — ghi tệp lỗi:", e.message);
  }
}
function henGhi() {
  if (luuHen) return;
  luuHen = setTimeout(ghiNgay, 1200);
}
function xa() { ghiNgay(); }

function cuaNv(tk, o, ten) {
  if (!tk) return null;
  const tkl = String(tk).toLowerCase();
  let hit = o != null ? idxNv.get(`${tkl}|${o | 0}`) : null;
  if (!hit && ten) hit = idxNv.get(`${tkl}||${String(ten).toLowerCase()}`);
  if (!hit) return null;
  const B = DB.bangs[hit.id];
  if (!B) return null;
  if (ten && hit.m.ten && hit.m.ten !== ten && o != null) {
    const byTen = idxNv.get(`${tkl}||${String(ten).toLowerCase()}`);
    if (byTen && DB.bangs[byTen.id]) return { B: DB.bangs[byTen.id], m: byTen.m };
    return null;
  }
  return { B, m: hit.m };
}

function idCua(tk, o, ten) { const c = cuaNv(tk, o, ten); return c ? c.B.id : null; }
function bangTheoId(id) { return id != null ? DB.bangs[String(id)] || null : null; }

function danhHieuCua(B, m, sex) {
  if (m.cv === "an") return "";
  if (m.cv === "chu") return m.dh || "Bang chủ";
  if (m.cv === "lao" || m.cv === "doi") return m.dh || TEN_CV[m.cv] || "";
  const dc = B.dhChung || {};
  return m.dh || (sex === "f" ? dc.nu : dc.nam) || "Đệ tử";
}

function nhanText(B, m, sex) {
  if (m.cv === "an") return B.ten;
  const dh = danhHieuCua(B, m, sex);
  return dh ? `${B.ten}(${dh})` : B.ten;
}

function nhan(tk, o, h) {
  const c = cuaNv(tk, o, h && h.name);
  if (!c) return null;
  const { B, m } = c;
  return { id: B.id, bh: nhanText(B, m, h && h.sex), bhp: B.phe | 0 || 3, cv: m.cv };
}

function ghiSuKien(B, text) {
  B.suKien = Array.isArray(B.suKien) ? B.suKien : [];
  B.suKien.unshift({ luc: Date.now(), t: String(text || "").slice(0, 200) });
  if (B.suKien.length > 60) B.suKien.length = 60;
}
function tangV(B) { B.v = ((B.v | 0) + 1); }

function damBaoTuan(B) {
  const t = tuanVn();
  if (B.tuan === t) return;
  // Chọn Hộ Bang tuần trước
  const hbCfg = CF.hoBang || { so: 3, cong: 200, congMin: 1000 };
  const top = (B.tv || []).filter((x) => (x.congTuan | 0) >= (hbCfg.congMin | 0))
    .sort((a, b) => (b.congTuan | 0) - (a.congTuan | 0))
    .slice(0, hbCfg.so | 0 || 3);
  B.hoBang = top.map((x) => ({ ten: x.ten, ct: x.congTuan | 0 }));
  for (const x of top) {
    const tv = (B.tv || []).find((y) => y.ten === x.ten);
    if (tv) tv.cong = (tv.cong | 0) + (hbCfg.cong | 0);
  }
  const dsMt = (CF.mucTieu && CF.mucTieu.ds) || ["vuotAi", "tongKim", "satThu"];
  const idx = Math.floor(Date.now() / (7 * DAY_MS)) % dsMt.length;
  B.tuan = t;
  B.mt = {
    loai: dsMt[idx] || "vuotAi",
    doKho: B.doKhoSau || 1,
    tienDo: 0,
    linhBang: 0
  };
  for (const m of B.tv || []) {
    m.congTuan = 0; m.mtDiem = 0; m.mtLinh = 0; m.hbTang = 0; m.quyenTuan = 0;
  }
  tangV(B);
  henGhi();
}

function damBaoNgay(B) {
  const n = ngayVn();
  if (B.ngay === n) return;
  B.ngay = n;
  B.hbDaPhat = 0;
  for (const m of B.tv || []) {
    m.ddNgay = "";
    m.hbNhan = 0;
    m.quaiNgay = 0;
    m.quaiCong = 0;
    m.pldNgay = 0;
    m.nhimNgay = 0;
  }
  henGhi();
}

function taoShopLePham() {
  const items = (DO.NOI && DO.NOI.ITEMS) || {};
  const uutien = [
    ["townportal:1", 20, 1],
    ["qk:195", 800, 1]
  ];
  const ds = [];
  const daCo = new Set();
  for (const [k, gia, cap] of uutien) {
    if (items[k] && !daCo.has(k)) { ds.push({ k, gia, cap }); daCo.add(k); }
  }
  // Bổ sung tự động các vật phẩm tiêu hao/bùa/thuốc đang có thật trong vat-pham.json
  for (const [k, x] of Object.entries(items)) {
    if (ds.length >= 12) break;
    if (!x || daCo.has(k) || !x.n) continue;
    if (/phúc duyên|tiên thảo|quế hoa|thủy tinh|tinh hồng|tẩy tủy|lễ bao|thổ địa|hồi thành|đại bổ|cửu chuyển/i.test(x.n)) {
      const gia = Math.max(30, Math.min(500, Math.round((+x.gia || 5000) / 100)));
      ds.push({ k, gia, cap: 1 });
      daCo.add(k);
    }
  }
  if (!ds.length) {
    for (const [k, x] of Object.entries(items)) {
      if (ds.length >= 8) break;
      if (x && (x.thuoc || x.phu)) ds.push({ k, gia: 30, cap: 1 });
    }
  }
  return ds;
}
let SHOP_LE_PHAM = null;
function getShopLePham() {
  if (!SHOP_LE_PHAM) SHOP_LE_PHAM = taoShopLePham();
  return SHOP_LE_PHAM;
}

function onlineSet() {
  const s = new Set();
  try {
    const ds = TG().dsDangChoi ? TG().dsDangChoi() : [];
    for (const x of ds || []) if (x && x.name) s.add(String(x.name));
  } catch {}
  return s;
}

function xemBang(B, mToi) {
  damBaoTuan(B);
  damBaoNgay(B);
  const on = onlineSet();
  const mtCfg = (CF.mucTieu && CF.mucTieu.loai && CF.mucTieu.loai[B.mt.loai]) || { ten: "Vượt Ải", can: [150, 300], thuong: [400, 720] };
  const dkIdx = Math.max(0, Math.min(1, ((B.mt.doKho || 1) - 1)));
  const mtCan = (mtCfg.can && mtCfg.can[dkIdx]) || 150;
  const mtThuong = (mtCfg.thuong && mtCfg.thuong[dkIdx]) || 400;
  const lvTp = (B.tp && B.tp.leVat) || TP_MAC.leVat;
  const hbMax = 10 + (lvTp.sd | 0) * 5;
  const hbGia = Math.max(30, 100 - (lvTp.sd | 0) * 5);
  const ddRoi = mToi && mToi.ddNgay === ngayVn();
  return {
    id: B.id,
    ten: B.ten,
    phe: B.phe | 0 || 3,
    tenPhe: TEN_PHE[B.phe | 0] || "Trung lập",
    cap: B.cap | 0 || 1,
    bangCap: B.cap | 0 || 1,
    chu: B.chu,
    quy: B.quy | 0,
    kt: B.kt | 0,
    cb: B.cb | 0,
    duTru: B.duTru | 0,
    tuBu: B.tuBu ? 1 : 0,
    tongCong: (B.tv || []).reduce((s, x) => s + (x.congTong | 0), 0),
    congCao: B.congCao || "",
    ccId: B.ccId | 0,
    dhChung: B.dhChung || { nam: "Đệ tử", nu: "Đệ tử" },
    quyen: B.quyen || { ...QUYEN_MAC },
    cm: B.cm || { bat: 1, text: "", cap: 0, phai: "" },
    khao: B.khao || null,
    khu: B.khu || null,
    phi: { ngay: Math.max(0, (B.cap | 0) * 10), dung: 0 },
    tp: B.tp || JSON.parse(JSON.stringify(TP_MAC)),
    tv: (B.tv || []).map((x) => ({
      ten: x.ten,
      cv: x.cv,
      dh: x.dh || "",
      cap: x.cap | 0 || 1,
      phai: x.phai || "",
      cong: x.cong | 0,
      congTuan: x.congTuan | 0,
      vaoLuc: x.vaoLuc | 0,
      on: on.has(x.ten) ? 1 : 0
    })),
    don: (B.don || []).map((d) => ({ ten: d.ten, cap: d.cap | 0 || 1, phai: d.phai || "", luc: d.luc | 0 })),
    suKien: (B.suKien || []).slice(0, 30),
    mt: {
      loai: B.mt.loai,
      ten: mtCfg.ten,
      doKho: B.mt.doKho || 1,
      tienDo: B.mt.tienDo | 0,
      can: mtCan,
      thuong: mtThuong,
      linhBang: B.mt.linhBang ? 1 : 0,
      toi: mToi ? (mToi.mtDiem | 0) : 0,
      toiLinh: mToi && mToi.mtLinh ? 1 : 0
    },
    teDan: {
      dd: ddRoi ? 1 : 0,
      cong: (CF.teDan && CF.teDan.cong) || 50,
      ly: mToi && mToi.cv === "an" ? "Ẩn sỹ không thể điểm danh Tế Đàn" : "",
      doKhoSau: B.doKhoSau || 1,
      hoBang: B.hoBang || [],
      ruBan: [],
      duaCap: DB.duaCap || { "2": [], "4": [] }
    },
    leVat: {
      hb: {
        gia: hbGia,
        con: Math.max(0, hbMax - (B.hbDaPhat | 0)),
        max: hbMax,
        toi: mToi ? (mToi.hbNhan | 0) : 0,
        toiMax: 3,
        tang: mToi ? (mToi.hbTang | 0) : 0,
        tangMax: 5
      },
      shop: getShopLePham().map((s) => ({
        k: s.k,
        gia: s.gia,
        mo: (lvTp.sd | 0) < (s.cap | 0) ? 1 : 0,
        goi: (lvTp.sd | 0) < (s.cap | 0) ? `Cần Khu Lễ vật cấp ${s.cap}` : ""
      }))
    },
    toi: mToi ? {
      ten: mToi.ten,
      cv: mToi.cv,
      dh: mToi.dh || "",
      cong: mToi.cong | 0,
      congTuan: mToi.congTuan | 0,
      vaoLuc: mToi.vaoLuc | 0
    } : null,
    v: B.v | 0
  };
}

function dsBang() {
  return Object.values(DB.bangs || {}).map((B) => ({
    id: B.id,
    ten: B.ten,
    chu: B.chu,
    phe: B.phe | 0 || 3,
    tenPhe: TEN_PHE[B.phe | 0] || "Trung lập",
    cap: B.cap | 0 || 1,
    soTv: (B.tv || []).length,
    maxTv: CF.maxTv || 80,
    cm: B.cm || { bat: 1, text: "", cap: 0, phai: "" },
    khao: B.khao || null
  })).sort((a, b) => b.cap - a.cap || b.soTv - a.soTv);
}

function coQuyen(B, m, ma) {
  if (!m) return false;
  if (m.cv === "chu") return true;
  if (m.cv === "lao") return !ma || !!(B.quyen && B.quyen[String(ma)]);
  if (m.cv === "doi" && ma === "chieuMo") return true;
  return false;
}

function truKiem(h) {
  const bag = h.bag || [];
  const i = bag.findIndex((x) => x && x.k === "qk:195");
  if (i < 0) return false;
  if ((bag[i].n | 0) > 1) bag[i].n--;
  else bag.splice(i, 1);
  return true;
}

function lam(tk, h, o, b, qt) {
  if (!CF.bat) loi("Tính năng Bang hội đang tạm đóng");
  const viec = String((b && b.viec) || "");
  const cur = cuaNv(tk.ten, o, h.name);
  const B = cur && cur.B, m = cur && cur.m;

  if (viec === "ds") return { ds: dsBang(), cho: DB.cho[keyNv(tk.ten, o, h.name)] || 0 };

  if (viec === "xem") {
    if (!B) return { bh: null, ds: dsBang(), cho: DB.cho[keyNv(tk.ten, o, h.name)] || 0 };
    m.cap = h.lvl | 0 || m.cap || 1;
    m.phai = h.fac || m.phai || "";
    return { bh: xemBang(B, m) };
  }

  if (viec === "lap") {
    if (B) loi("Bạn đã ở trong một bang hội — phải rời bang trước mới lập bang mới");
    const ten = String(b.ten || "").trim().replace(/\s+/g, " ");
    if (ten.length < 2 || ten.length > 16) loi("Tên bang hội phải từ 2 đến 16 ký tự");
    if (kiemTenCam && kiemTenCam(ten)) loi("Tên bang hội chứa từ không hợp lệ");
    if (idxTen.has(ten.toLowerCase())) loi(`Tên bang hội "${ten}" đã tồn tại`);
    const phe = [1, 2, 3].includes(+b.phe) ? (+b.phe | 0) : 3;
    const boQua = !!(qt && b.qt);
    let doi = false;
    if (!boQua) {
      if ((h.lvl | 0) < (CF.capLap | 0)) loi(`Cần đạt cấp ${CF.capLap} trở lên mới được lập bang`);
      if (CF.tsLap && (h.leadLv | 0) < CF.tsLap) loi(`Cần lực thống soái từ ${CF.tsLap} trở lên`);
      const phi = CF.phiLap | 0;
      if (phi > 0 && (h.gold | 0) < phi) loi(`Không đủ ${Math.round(phi / VAN)} vạn lượng để lập bang`);
      const coKiem = (h.bag || []).some((x) => x && x.k === "qk:195");
      if (!coKiem) loi("Cần có Nhạc Vương Kiếm trong hành trang để lập bang");
      truKiem(h);
      if (phi > 0) h.gold = Math.max(0, (h.gold | 0) - phi);
      doi = true;
    }
    const id = String(DB.nextId++);
    const now = Date.now();
    const tv0 = { tk: tk.ten, o: o | 0, ten: h.name, cv: "chu", dh: "Bang chủ", cap: h.lvl | 0 || 1, phai: h.fac || "", cong: 200, congTong: 200, congTuan: 0, vaoLuc: now };
    const bangMoi = {
      id, ten, phe, cap: 1, chu: h.name,
      quy: 500, kt: 500, cb: 200, duTru: 100, tuBu: 1,
      congCao: `Chào mừng huynh đệ gia nhập bang hội ${ten}!`, ccId: now,
      dhChung: { nam: "Đệ tử", nu: "Đệ tử" },
      quyen: { ...QUYEN_MAC },
      cm: { bat: 1, text: `Bang hội ${ten} chiêu mộ hào kiệt giang hồ!`, cap: 1, phai: "" },
      khao: CF.khaoNgay > 0 ? { het: now + CF.khaoNgay * DAY_MS, can: CF.khaoNguoi || 3 } : null,
      khu: null,
      tp: JSON.parse(JSON.stringify(TP_MAC)),
      tv: [tv0], don: [], suKien: [], hoBang: [],
      tuan: tuanVn(now), ngay: ngayVn(now), doKhoSau: 1,
      mt: { loai: "vuotAi", doKho: 1, tienDo: 0, linhBang: 0 },
      hbDaPhat: 0, v: 1
    };
    ghiSuKien(bangMoi, `${h.name} sáng lập bang hội ${ten}.`);
    DB.bangs[id] = bangMoi;
    xayIndex();
    henGhi();
    try { TG().thongBao(`Chúc mừng hiệp khách ${h.name} sáng lập bang hội [${ten}]!`); } catch {}
    return { doi, bh: xemBang(bangMoi, tv0), tin: ["Sáng lập bang hội thành công!"], msg: "Sáng lập bang hội thành công!" };
  }

  if (viec === "xinVao") {
    if (B) loi("Bạn đã có bang hội");
    const target = bangTheoId(b.id);
    if (!target) loi("Bang hội không tồn tại");
    if (target.cm && !target.cm.bat) loi("Bang hội này hiện không mở chiêu mộ");
    if (target.cm && (target.cm.cap | 0) > (h.lvl | 0)) loi(`Bang hội yêu cầu cấp ${target.cm.cap} trở lên`);
    if ((target.tv || []).length >= (CF.maxTv || 80)) loi("Bang hội đã đủ thành viên");
    target.don = Array.isArray(target.don) ? target.don : [];
    if (target.don.some((d) => d.tk === tk.ten && (d.o | 0) === (o | 0))) loi("Bạn đã gửi đơn xin vào bang này rồi");
    target.don.push({ tk: tk.ten, o: o | 0, ten: h.name, cap: h.lvl | 0 || 1, phai: h.fac || "", luc: Date.now() });
    tangV(target);
    henGhi();
    try { TG().thongBaoBang(`${h.name} (cấp ${h.lvl | 0}) vừa gửi đơn xin gia nhập bang hội.`, target.id); } catch {}
    return { msg: `Đã gửi đơn xin gia nhập bang hội ${target.ten}`, ds: dsBang() };
  }

  if (viec === "nhanMoi") {
    const k = keyNv(tk.ten, o, h.name);
    const loiMoi = DB.moi[k];
    delete DB.moi[k];
    if (!b.dong) { henGhi(); return { msg: "Đã cự tuyệt lời mời vào bang hội" }; }
    if (B) loi("Bạn đã ở trong một bang hội khác");
    const target = bangTheoId(b.id || (loiMoi && loiMoi.id));
    if (!target) loi("Bang hội không còn tồn tại");
    if ((target.tv || []).length >= (CF.maxTv || 80)) loi("Bang hội đã đủ thành viên");
    const tvMoi = { tk: tk.ten, o: o | 0, ten: h.name, cv: "de", dh: "", cap: h.lvl | 0 || 1, phai: h.fac || "", cong: 50, congTong: 50, congTuan: 0, vaoLuc: Date.now() };
    target.tv.push(tvMoi);
    target.don = (target.don || []).filter((d) => !(d.tk === tk.ten && (d.o | 0) === (o | 0)));
    ghiSuKien(target, `${h.name} gia nhập bang hội.`);
    tangV(target);
    xayIndex();
    henGhi();
    try { TG().thongBaoBang(`Chào mừng ${h.name} gia nhập bang hội ${target.ten}!`, target.id); } catch {}
    return { bh: xemBang(target, tvMoi), msg: `Bạn đã gia nhập bang hội ${target.ten}!` };
  }

  // Các việc dưới đây yêu cầu đã ở trong bang
  if (!B || !m) loi("Bạn hiện giờ không thuộc bang hội nào!");
  damBaoTuan(B);
  damBaoNgay(B);

  if (viec === "moi") {
    if (!coQuyen(B, m, "chieuMo") && m.cv !== "chu" && m.cv !== "lao" && m.cv !== "doi") loi("Bạn không có quyền chiêu mộ thành viên");
    const tenDen = String(b.ten || "").trim();
    if (b.bot) return { msg: `${tenDen} cự tuyệt lời mời gia nhập bang hội của bạn.` };
    const found = TG().timTen ? TG().timTen(tenDen) : null;
    if (!found) loi(`Không tìm thấy ${tenDen} trên mạng`);
    if (idCua(found.tk, found.o, tenDen)) loi(`${tenDen} đã thuộc một bang hội khác`);
    DB.moi[keyNv(found.tk, found.o, tenDen)] = { id: B.id, ten: B.ten, nguoi: h.name, luc: Date.now() };
    henGhi();
    return { msg: `Đã gửi lời mời gia nhập bang hội ${B.ten} tới ${tenDen}` };
  }

  if (viec === "duyet") {
    if (!coQuyen(B, m, "1001") && m.cv !== "chu" && m.cv !== "lao" && m.cv !== "doi") loi("Bạn không có quyền duyệt đơn chiêu mộ");
    const tenDon = String(b.ten || "");
    const idx = (B.don || []).findIndex((d) => d.ten === tenDon);
    if (idx < 0) loi("Đơn xin gia nhập không còn tồn tại");
    const d = B.don.splice(idx, 1)[0];
    if (b.dong) {
      if (idCua(d.tk, d.o, d.ten)) loi(`${d.ten} đã gia nhập bang hội khác`);
      if ((B.tv || []).length >= (CF.maxTv || 80)) loi("Bang hội đã đủ thành viên");
      B.tv.push({ tk: d.tk, o: d.o | 0, ten: d.ten, cv: "de", dh: "", cap: d.cap | 0 || 1, phai: d.phai || "", cong: 50, congTong: 50, congTuan: 0, vaoLuc: Date.now() });
      ghiSuKien(B, `${m.ten} đã duyệt ${d.ten} gia nhập bang hội.`);
      xayIndex();
      try { TG().thongBaoBang(`Chào mừng ${d.ten} gia nhập bang hội ${B.ten}!`, B.id); } catch {}
    }
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: b.dong ? `Đã nhận ${d.ten} vào bang` : `Đã từ chối đơn của ${d.ten}` };
  }

  if (viec === "roi") {
    if (m.cv === "chu") loi("Bang chủ phải chuyển vị cho người khác hoặc giải tán bang hội");
    let doi = false;
    if ((CF.phiRoi | 0) > 0) {
      if ((h.gold | 0) < (CF.phiRoi | 0)) loi(`Cần ${Math.round(CF.phiRoi / VAN)} vạn lượng lộ phí rời bang`);
      h.gold -= CF.phiRoi | 0; doi = true;
    }
    B.tv = B.tv.filter((x) => x !== m);
    ghiSuKien(B, `${h.name} rời khỏi bang hội.`);
    tangV(B); xayIndex(); henGhi();
    try { TG().thongBaoBang(`${h.name} đã rời khỏi bang hội.`, B.id); } catch {}
    return { doi, bh: null, ds: dsBang(), msg: `Bạn đã rời khỏi bang hội ${B.ten}` };
  }

  if (viec === "giaiTan") {
    if (m.cv !== "chu") loi("Chỉ Bang chủ mới có quyền giải tán bang hội");
    const tenCu = B.ten;
    delete DB.bangs[B.id];
    xayIndex(); henGhi();
    try { TG().thongBao(`Bang hội [${tenCu}] đã giải tán!`); } catch {}
    return { bh: null, ds: dsBang(), msg: `Đã giải tán bang hội ${tenCu}` };
  }

  if (viec === "duoi") {
    if (!coQuyen(B, m, "1004")) loi("Bạn không có quyền trục xuất thành viên");
    const tv = B.tv.find((x) => x.ten === b.ten);
    if (!tv) loi("Không tìm thấy thành viên này trong bang");
    if (tv.cv === "chu" || tv === m) loi("Không thể trục xuất Bang chủ hoặc chính mình");
    if (m.cv !== "chu" && tv.cv === "lao") loi("Chỉ Bang chủ mới có quyền trục xuất Trưởng Lão");
    B.tv = B.tv.filter((x) => x !== tv);
    ghiSuKien(B, `${m.ten} trục xuất ${tv.ten} khỏi bang hội.`);
    tangV(B); xayIndex(); henGhi();
    try { TG().thongBaoBang(`${tv.ten} đã bị trục xuất khỏi bang hội.`, B.id); } catch {}
    return { bh: xemBang(B, m), msg: `Đã trục xuất ${tv.ten} khỏi bang hội` };
  }

  if (viec === "boNhiem") {
    if (!coQuyen(B, m, "1001")) loi("Bạn không có quyền bổ nhiệm chức vụ");
    const tv = B.tv.find((x) => x.ten === b.ten);
    if (!tv || tv.cv === "chu") loi("Không thể đổi chức vụ người này");
    const cv = String(b.cv || "de");
    if (!["lao", "doi", "de", "an"].includes(cv)) loi("Chức vụ không hợp lệ");
    if (cv === "lao" && m.cv !== "chu") loi("Chỉ Bang chủ mới bổ nhiệm được Trưởng Lão");
    tv.cv = cv;
    ghiSuKien(B, `${m.ten} bổ nhiệm ${tv.ten} làm ${TEN_CV[cv]}.`);
    tangV(B); henGhi();
    try { TG().thongBaoBang(`${tv.ten} được bổ nhiệm làm ${TEN_CV[cv]}.`, B.id); } catch {}
    return { bh: xemBang(B, m), msg: `Đã bổ nhiệm ${tv.ten} làm ${TEN_CV[cv]}` };
  }

  if (viec === "chuyenVi") {
    if (m.cv !== "chu") loi("Chỉ Bang chủ mới có quyền truyền vị");
    const tv = B.tv.find((x) => x.ten === b.ten && x !== m);
    if (!tv) loi("Không tìm thấy thành viên này trong bang");
    m.cv = "lao"; m.dh = "Trưởng Lão";
    tv.cv = "chu"; tv.dh = "Bang chủ";
    B.chu = tv.ten;
    ghiSuKien(B, `${m.ten} truyền vị Bang chủ cho ${tv.ten}.`);
    tangV(B); henGhi();
    try { TG().thongBaoBang(`${m.ten} đã truyền vị Bang chủ cho ${tv.ten}!`, B.id); } catch {}
    return { bh: xemBang(B, m), msg: `Đã truyền vị Bang chủ cho ${tv.ten}` };
  }

  if (viec === "danhHieu") {
    if (!coQuyen(B, m, "1003")) loi("Bạn không có quyền đổi danh hiệu");
    const tv = B.tv.find((x) => x.ten === b.ten);
    if (!tv) loi("Không tìm thấy thành viên");
    const dh = String(b.dh || "").trim().slice(0, 16);
    if (dh && kiemTenCam && kiemTenCam(dh)) loi("Danh hiệu chứa từ không hợp lệ");
    tv.dh = dh;
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã cập nhật danh hiệu cho ${tv.ten}` };
  }

  if (viec === "danhHieuChung") {
    if (!coQuyen(B, m, "1003")) loi("Bạn không có quyền đổi danh hiệu chung");
    B.dhChung = { nam: String(b.nam || "Đệ tử").trim().slice(0, 16) || "Đệ tử", nu: String(b.nu || "Đệ tử").trim().slice(0, 16) || "Đệ tử" };
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: "Đã cập nhật danh hiệu chung cho đệ tử" };
  }

  if (viec === "congCao") {
    if (!coQuyen(B, m, "1005")) loi("Bạn không có quyền sửa công cáo bang hội");
    B.congCao = String(b.text || "").trim().slice(0, 240);
    B.ccId = Date.now();
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: "Đã lưu công cáo bang hội" };
  }

  if (viec === "chieuMo") {
    if (!coQuyen(B, m, "1001")) loi("Bạn không có quyền sửa thông tin chiêu mộ");
    B.cm = { bat: b.bat ? 1 : 0, text: String(b.text || "").trim().slice(0, 200), cap: Math.max(0, Math.min(200, b.cap | 0)), phai: String(b.phai || "").slice(0, 40) };
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: "Đã lưu cài đặt chiêu mộ bang hội" };
  }

  if (viec === "quyen") {
    if (m.cv !== "chu") loi("Chỉ Bang chủ mới sửa được phân quyền Trưởng Lão");
    const q = b.quyen && typeof b.quyen === "object" ? b.quyen : {};
    B.quyen = {};
    for (const k of Object.keys(QUYEN_MAC)) B.quyen[k] = q[k] ? 1 : 0;
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: "Đã lưu phân quyền bang hội" };
  }

  if (viec === "doiPhe") {
    if (!coQuyen(B, m, "1002")) loi("Bạn không có quyền đổi phe bang hội");
    const phe = +b.phe | 0;
    if (![1, 2, 3].includes(phe)) loi("Phe không hợp lệ");
    if (B.phe === phe) loi("Bang hội đã ở phe này");
    const phi = (CF.doiPhe && CF.doiPhe.phi) || 0;
    const phiVan = Math.round(phi / VAN);
    if (phiVan > 0 && (B.quy | 0) < phiVan) loi(`Ngân quỹ bang không đủ ${phiVan} vạn lượng để đổi phe`);
    B.quy = Math.max(0, (B.quy | 0) - phiVan);
    B.phe = phe;
    ghiSuKien(B, `${m.ten} đổi phe bang hội sang ${TEN_PHE[phe]}.`);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã đổi phe bang hội sang ${TEN_PHE[phe]}` };
  }

  if (viec === "quyenTien" || viec === "napQuy") {
    const van = Math.max(1, Math.min(10000, b.van | 0));
    const luong = van * VAN;
    if ((h.gold | 0) < luong) loi(`Không đủ ${van} vạn lượng trong hành trang`);
    h.gold -= luong;
    B.quy = (B.quy | 0) + van;
    let congThem = 0;
    if (viec === "quyenTien") {
      congThem = Math.round(van * (CF.quyenCong ?? 1));
      m.cong = (m.cong | 0) + congThem;
      m.congTong = (m.congTong | 0) + congThem;
    }
    ghiSuKien(B, `${m.ten} ${viec === "quyenTien" ? "quyên" : "nạp"} ${van} vạn lượng vào ngân quỹ bang.`);
    tangV(B); henGhi();
    return { doi: true, bh: xemBang(B, m), msg: `Đã ${viec === "quyenTien" ? "quyên" : "nạp"} ${van} vạn lượng vào ngân quỹ${congThem ? ` (+${congThem} điểm cống hiến)` : ""}` };
  }

  if (viec === "chuyenKt" || viec === "chuyenNq") {
    if (!coQuyen(B, m, "2002")) loi("Bạn không có quyền quản lý ngân quỹ");
    const van = Math.max(1, b.van | 0);
    if ((B.quy | 0) < van) loi("Ngân quỹ bang không đủ");
    B.quy -= van;
    B.kt = (B.kt | 0) + van;
    ghiSuKien(B, `${m.ten} chuyển ${van} vạn từ ngân quỹ sang ngân sách kiến thiết.`);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã chuyển ${van} vạn sang ngân sách kiến thiết` };
  }

  if (viec === "tuBu") {
    if (!coQuyen(B, m, "2002")) loi("Bạn không có quyền cài đặt tự bù chiến bị");
    B.tuBu = b.bat ? 1 : 0;
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: B.tuBu ? "Đã bật tự bù ngân sách chiến bị" : "Đã tắt tự bù ngân sách chiến bị" };
  }

  if (viec === "lenCapBang") {
    if (!coQuyen(B, m, "2001")) loi("Bạn không có quyền tăng cấp bang hội");
    const capMoi = (B.cap | 0) + 1;
    if (capMoi > 5) loi("Bang hội đã đạt đẳng cấp tối đa (cấp 5)");
    const canKt = capMoi * 500;
    if ((B.kt | 0) < canKt) loi(`Cần ${canKt} vạn ngân sách kiến thiết để lên cấp ${capMoi}`);
    B.kt -= canKt;
    B.cap = capMoi;
    if ((capMoi === 2 || capMoi === 4) && !(DB.duaCap[String(capMoi)] || []).includes(B.ten) && (DB.duaCap[String(capMoi)] || []).length < 3) {
      DB.duaCap[String(capMoi)] = [...(DB.duaCap[String(capMoi)] || []), B.ten];
    }
    ghiSuKien(B, `Bang hội thăng lên Đẳng cấp kiến thiết ${capMoi}!`);
    tangV(B); henGhi();
    try { TG().thongBao(`Bang hội [${B.ten}] đã thăng lên Đẳng cấp kiến thiết ${capMoi}!`); } catch {}
    return { bh: xemBang(B, m), msg: `Chúc mừng bang hội lên cấp ${capMoi}!` };
  }

  if (viec === "phatDuTru" || viec === "phatCong") {
    if (!coQuyen(B, m, "2002")) loi("Bạn không có quyền phát quỹ dự trữ");
    const so = Math.max(1, b.van | 0);
    if ((B.duTru | 0) < so) loi("Quỹ dự trữ không đủ");
    const on = onlineSet();
    const nhanDs = B.tv.filter((x) => on.has(x.ten));
    if (!nhanDs.length) loi("Không có thành viên nào đang trên mạng");
    const moi = Math.max(1, Math.floor(so / nhanDs.length));
    const tong = moi * nhanDs.length;
    if (tong > B.duTru) loi("Quỹ dự trữ không đủ chia đều");
    B.duTru -= tong;
    for (const x of nhanDs) { x.cong = (x.cong | 0) + moi; x.congTong = (x.congTong | 0) + moi; }
    ghiSuKien(B, `${m.ten} phát ${tong} điểm từ quỹ dự trữ cho ${nhanDs.length} thành viên trên mạng.`);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã phát ${moi} điểm cống hiến cho ${nhanDs.length} thành viên trên mạng` };
  }

  if (viec === "phatQuy") {
    if (!coQuyen(B, m, "2002")) loi("Bạn không có quyền phát ngân quỹ");
    const so = Math.max(1, b.van | 0);
    if ((B.quy | 0) < so) loi("Ngân quỹ bang không đủ");
    const nhanDs = B.tv.filter((x) => x.cv !== "an");
    if (!nhanDs.length) loi("Chưa có thành viên đủ điều kiện nhận quỹ");
    const moi = Math.max(1, Math.floor(so / nhanDs.length));
    const tong = moi * nhanDs.length;
    if (tong > B.quy) loi("Ngân quỹ bang không đủ chia đều");
    B.quy -= tong;
    for (const x of nhanDs) { x.cong = (x.cong | 0) + moi; }
    ghiSuKien(B, `${m.ten} phát ${tong} vạn ngân quỹ cho ${nhanDs.length} thành viên.`);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã phát thưởng quỹ cho ${nhanDs.length} thành viên` };
  }

  if (viec === "tpMoDong" || viec === "tpLenCap" || viec === "tpCapSd") {
    if (!coQuyen(B, m, "2003")) loi("Bạn không có quyền quản lý tác phường");
    B.tp = B.tp || JSON.parse(JSON.stringify(TP_MAC));
    const tp = B.tp[String(b.tp || "leVat")];
    if (!tp) loi("Tác phường không tồn tại");
    if (viec === "tpMoDong") {
      if (tp.cap < 1) { tp.cap = 1; tp.sd = 1; tp.mo = 1; }
      else tp.mo = tp.mo ? 0 : 1;
      tangV(B); henGhi();
      return { bh: xemBang(B, m), msg: `${tp.ten}: đã ${tp.mo ? "khai mở" : "tạm đóng"}` };
    }
    if (viec === "tpLenCap") {
      if (tp.cap >= (B.cap | 0) * 2 + 1 || tp.cap >= 10) loi("Cần nâng đẳng cấp kiến thiết bang hội trước");
      const can = (tp.cap + 1) * 100;
      if ((B.kt | 0) < can) loi(`Cần ${can} vạn ngân sách kiến thiết`);
      B.kt -= can; tp.cap++; tp.sd = tp.cap; tp.mo = 1;
      tangV(B); henGhi();
      return { bh: xemBang(B, m), msg: `${tp.ten} đã lên cấp ${tp.cap}` };
    }
    if (viec === "tpCapSd") {
      const c = Math.max(1, Math.min(tp.cap | 0, b.cap | 0));
      tp.sd = c;
      tangV(B); henGhi();
      return { bh: xemBang(B, m), msg: `${tp.ten}: đặt cấp sử dụng ${c}` };
    }
  }

  // ---- Tế Đàn (Đợt 2) ----
  if (viec === "diemDanh") {
    if (m.cv === "an") loi("Ẩn sỹ không thể điểm danh Tế Đàn");
    if (m.ddNgay === ngayVn()) loi("Hôm nay ngươi đã nhận thưởng điểm danh rồi!");
    const cong = (CF.teDan && CF.teDan.cong) || 50;
    m.ddNgay = ngayVn();
    m.cong = (m.cong | 0) + cong;
    m.congTong = (m.congTong | 0) + cong;
    m.congTuan = (m.congTuan | 0) + cong;
    B.cb = (B.cb | 0) + ((CF.teDan && CF.teDan.cb) || 5);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Điểm danh Tế Đàn thành công: +${cong} điểm cống hiến!` };
  }

  if (viec === "mtDoKho") {
    if (!coQuyen(B, m, "2005")) loi("Bạn không có quyền thiết lập độ khó mục tiêu tuần");
    B.doKhoSau = (+b.doKho === 2) ? 2 : 1;
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã đặt độ khó mục tiêu tuần sau là cấp ${B.doKhoSau}` };
  }

  if (viec === "mtLinh") {
    const view = xemBang(B, m);
    if (m.mtLinh) loi("Tuần này ngươi đã lĩnh phần thưởng mục tiêu cá nhân rồi");
    if ((m.mtDiem | 0) < Math.max(10, Math.round(view.mt.can * 0.2))) loi(`Chưa đủ tiến độ mục tiêu tuần cá nhân (${m.mtDiem | 0}/${Math.max(10, Math.round(view.mt.can * 0.2))})`);
    m.mtLinh = 1;
    m.cong = (m.cong | 0) + view.mt.thuong;
    m.congTong = (m.congTong | 0) + view.mt.thuong;
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Đã nhận thưởng mục tiêu tuần cá nhân: +${view.mt.thuong} điểm cống hiến!` };
  }

  if (viec === "mtBang") {
    if (!coQuyen(B, m, "2005")) loi("Bạn không có quyền lĩnh thưởng mục tiêu tuần bang hội");
    const view = xemBang(B, m);
    if (B.mt.linhBang) loi("Tuần này bang hội đã lĩnh phần thưởng mục tiêu tuần rồi");
    if ((B.mt.tienDo | 0) < view.mt.can) loi(`Tiến độ bang chưa đạt (${B.mt.tienDo | 0}/${view.mt.can})`);
    B.mt.linhBang = 1;
    const thuongKt = Math.round(view.mt.thuong * 0.5);
    B.kt = (B.kt | 0) + thuongKt;
    ghiSuKien(B, `${m.ten} lĩnh thưởng mục tiêu tuần bang hội (+${thuongKt} vạn kiến thiết).`);
    tangV(B); henGhi();
    return { bh: xemBang(B, m), msg: `Bang hội nhận +${thuongKt} vạn ngân sách kiến thiết!` };
  }

  // ---- Tổng quản Lễ phẩm phường (Đợt 2) ----
  if (viec === "hongBao" || viec === "tangHb") {
    const view = xemBang(B, m);
    const hb = view.leVat.hb;
    if (viec === "hongBao") {
      if (hb.con <= 0) loi("Hôm nay lễ phẩm đã phát xong, ngày mai hãy đến vậy!");
      if (hb.toi >= hb.toiMax) loi(`Hôm nay ngươi đã nhận đủ ${hb.toiMax} hồng bao rồi`);
      if ((m.cong | 0) < hb.gia) loi(`Không đủ ${hb.gia} điểm cống hiến`);
      m.cong -= hb.gia;
      m.hbNhan = (m.hbNhan | 0) + 1;
      B.hbDaPhat = (B.hbDaPhat | 0) + 1;
      const thuongLuong = (2 + Math.floor(Math.random() * 6)) * VAN;
      h.gold = (h.gold | 0) + thuongLuong;
      tangV(B); henGhi();
      return { doi: true, bh: xemBang(B, m), msg: `Mở hồng bao thần bí nhận được ${Math.round(thuongLuong / VAN)} vạn lượng!` };
    } else {
      if (hb.tang >= hb.tangMax) loi(`Tuần này ngươi đã tặng đủ ${hb.tangMax} hồng bao`);
      if ((m.cong | 0) < hb.gia) loi(`Không đủ ${hb.gia} điểm cống hiến`);
      const tv = B.tv.find((x) => x.ten === b.ten && x !== m);
      if (!tv) loi("Không tìm thấy thành viên này trong bang");
      m.cong -= hb.gia;
      m.hbTang = (m.hbTang | 0) + 1;
      tv.cong = (tv.cong | 0) + Math.round(hb.gia * 0.8);
      ghiSuKien(B, `${m.ten} tặng hồng bao thần bí cho ${tv.ten}.`);
      tangV(B); henGhi();
      try { TG().thongBaoBang(`${m.ten} đã tặng 1 hồng bao thần bí cho ${tv.ten}!`, B.id); } catch {}
      return { bh: xemBang(B, m), msg: `Đã tặng hồng bao thần bí cho ${tv.ten}!` };
    }
  }

  if (viec === "lePham") {
    const k = String(b.k || ""), n = Math.max(1, Math.min(50, b.n | 0 || 1));
    const item = getShopLePham().find((x) => x.k === k);
    if (!item) loi("Lễ phẩm này không có trong cửa hàng");
    const tongGia = item.gia * n;
    if ((m.cong | 0) < tongGia) loi(`Không đủ ${tongGia} điểm cống hiến`);
    const dsNhan = DO.taoQua(h, { mon: [{ k, n }], ng: "Lễ phẩm bang hội" });
    m.cong -= tongGia;
    tangV(B); henGhi();
    return { doi: true, bh: xemBang(B, m), msg: `Đã đổi ${dsNhan.join(", ")} (-${tongGia} điểm cống hiến)` };
  }

  loi("Thao tác bang hội chưa hỗ trợ: " + viec);
}

function nhip(tkTen, o, h, b) {
  const out = {};
  const cur = cuaNv(tkTen, o, h && h.name);
  if (cur) {
    const { B, m } = cur;
    out.bhMinh = { id: B.id, ten: B.ten, cv: m.cv, dh: m.dh || "", nhan: nhanText(B, m, h && h.sex), v: B.v | 0 };
    const ccClient = +(b && b.bhcc) || 0;
    const ccId = B.congCao ? (B.ccId | 0) : 0;
    if (ccId !== ccClient) out.bhCc = ccId ? { id: ccId, t: B.congCao } : { id: 0 };
  } else {
    out.bhMinh = null;
    if (+(b && b.bhcc)) out.bhCc = { id: 0 };
  }
  const moi = DB.moi[keyNv(tkTen, o, h && h.name)];
  if (moi && Date.now() - (moi.luc || 0) < 5 * 60000 && bangTheoId(moi.id)) {
    out.bhMoi = { id: moi.id, ten: moi.ten, nguoi: moi.nguoi };
  } else {
    out.bhMoi = null;
  }
  return out;
}

function cong(tk, o, ten, nguon, gt, opt = {}) {
  const cur = cuaNv(tk, o, ten);
  if (!cur) return;
  const { B, m } = cur;
  if (m.cv === "an") return;
  damBaoTuan(B);
  damBaoNgay(B);
  let diem = gt != null ? (+gt | 0) : 0;
  if (gt == null) {
    if (nguon === "bossHk") diem = opt.hang <= 3 ? 100 : (opt.pct >= 1 ? 50 : 30);
    else if (nguon === "vuotAi") diem = (opt.dot | 0) >= 20 ? 10 : (opt.dot | 0) >= 10 ? 8 : 4;
    else if (nguon === "satThu") diem = 15;
    else if (nguon === "minhChu") diem = opt.kieu === "giet" ? 20 : 15;
    else if (nguon === "phongHoa") diem = opt.kieu === "thang" ? 100 : 50;
    else if (nguon === "pld") { if ((m.pldNgay | 0) >= 4) return; m.pldNgay = (m.pldNgay | 0) + 1; diem = 25; }
    else if (nguon === "sanNhim") { if ((m.nhimNgay | 0) >= 10) return; m.nhimNgay = (m.nhimNgay | 0) + 1; diem = 5; }
    else if (nguon === "tongKim") diem = (opt.diem | 0) >= 100 ? Math.min(150, Math.round((opt.diem | 0) * 0.03)) : 0;
    else diem = 10;
  }
  if (diem <= 0) return;
  m.cong = (m.cong | 0) + diem;
  m.congTong = (m.congTong | 0) + diem;
  m.congTuan = (m.congTuan | 0) + diem;
  B.duTru = (B.duTru | 0) + Math.max(1, Math.round(diem * ((CF.chia && CF.chia.duTru) || 0.15)));
  B.kt = (B.kt | 0) + Math.max(1, Math.round(diem * ((CF.chia && CF.chia.kt) || 0.06)));
  B.cb = (B.cb | 0) + Math.max(1, Math.round(diem * ((CF.chia && CF.chia.cb) || 0.04)));
  if (B.mt && B.mt.loai === nguon) {
    B.mt.tienDo = (B.mt.tienDo | 0) + diem;
    m.mtDiem = (m.mtDiem | 0) + diem;
  }
  henGhi();
}

function quai(tk, o, ten, nq) {
  const cur = cuaNv(tk, o, ten);
  if (!cur || !nq) return;
  const { B, m } = cur;
  if (m.cv === "an") return;
  damBaoNgay(B);
  m.quaiNgay = (m.quaiNgay | 0) + (nq | 0);
  const moi = Math.min(80, Math.floor(m.quaiNgay / 500) * 10);
  const chenh = moi - (m.quaiCong | 0);
  if (chenh > 0) {
    m.quaiCong = moi;
    cong(tk, o, ten, "quai", chenh);
  }
}

function xoaNv(tk, o, ten) {
  const cur = cuaNv(tk, o, ten);
  if (!cur) return null;
  const { B, m } = cur;
  if (m.cv === "chu") return `Nhân vật đang là Bang chủ bang hội ${B.ten} — hãy chuyển vị hoặc giải tán bang trước khi xóa`;
  B.tv = B.tv.filter((x) => x !== m);
  tangV(B); xayIndex(); henGhi();
  return null;
}

function xoaTk(tkTen) {
  const tkl = String(tkTen || "").toLowerCase();
  const kq = [];
  for (const [id, B] of Object.entries(DB.bangs || {})) {
    const truoc = (B.tv || []).length;
    const laChu = (B.tv || []).some((x) => String(x.tk || "").toLowerCase() === tkl && x.cv === "chu");
    B.tv = (B.tv || []).filter((x) => String(x.tk || "").toLowerCase() !== tkl);
    if (B.tv.length === truoc) continue;
    if (!B.tv.length) { delete DB.bangs[id]; kq.push(`giải tán ${B.ten}`); }
    else if (laChu) { B.tv[0].cv = "chu"; B.chu = B.tv[0].ten; kq.push(`chuyển chủ ${B.ten} -> ${B.chu}`); }
    else kq.push(`rời ${B.ten}`);
  }
  if (kq.length) { xayIndex(); henGhi(); }
  return kq;
}

function dsXepHang(tongMap) {
  return Object.values(DB.bangs || {}).map((B) => ({
    ten: B.ten,
    chu: B.chu,
    cap: B.cap | 0 || 1,
    n: (B.tv || []).length,
    tongCap: (tongMap && tongMap.get(B.id)) || (B.tv || []).reduce((s, x) => s + (x.cap | 0 || 1), 0)
  })).sort((a, b) => b.cap - a.cap || b.tongCap - a.tongCap || b.n - a.n);
}

function teDanNay(tk, o, ten) {
  const cur = cuaNv(tk, o, ten);
  if (!cur || cur.m.cv === "an") return null;
  return [cur.m.ddNgay === ngayVn() ? 1 : 0, 1];
}

function chanRtb(tk, h) {
  if (!CF.ruongCanBang) return null;
  if (!Object.keys(DB.bangs || {}).length) return null;
  const cur = cuaNv(tk && tk.ten, null, h && h.name);
  return cur ? null : "Cần gia nhập bang hội mới có thể mở Rương Thần Bí";
}

function datKhu(id, khu) {
  const B = bangTheoId(id);
  if (!B) return false;
  B.khu = khu;
  tangV(B); henGhi();
  return true;
}

function quanTri(qt, b) {
  const lamV = String((b && b.lam) || "ds");
  if (lamV === "ds") return { ds: dsBang() };
  const B = bangTheoId(b && b.id);
  if (lamV === "xem") return B ? { bh: xemBang(B, null) } : loi("Không thấy bang hội");
  if (lamV === "giaiTan") {
    if (!B) loi("Không thấy bang hội");
    const ten = B.ten;
    delete DB.bangs[B.id];
    xayIndex(); henGhi();
    return { msg: `Quản trị đã giải tán bang ${ten}`, ds: dsBang() };
  }
  if (lamV === "quaKhao") {
    if (!B) loi("Không thấy bang hội");
    B.khao = null; tangV(B); henGhi();
    return { msg: `Đã cho bang ${B.ten} qua khảo nghiệm`, bh: xemBang(B, null) };
  }
  if (lamV === "doiTen") {
    if (!B) loi("Không thấy bang hội");
    const ten = String(b.ten || "").trim();
    if (ten.length < 2 || ten.length > 16) loi("Tên bang 2–16 ký tự");
    if (idxTen.has(ten.toLowerCase()) && idxTen.get(ten.toLowerCase()) !== B.id) loi("Tên bang đã trùng");
    B.ten = ten; tangV(B); xayIndex(); henGhi();
    return { msg: `Đã đổi tên bang thành ${ten}`, bh: xemBang(B, null) };
  }
  if (lamV === "chuyenChu") {
    if (!B) loi("Không thấy bang hội");
    const tv = (B.tv || []).find((x) => x.ten === b.ten);
    if (!tv) loi("Không thấy thành viên này trong bang");
    for (const x of B.tv) if (x.cv === "chu") x.cv = "lao";
    tv.cv = "chu"; B.chu = tv.ten; tangV(B); henGhi();
    return { msg: `Đã chuyển Bang chủ ${B.ten} sang ${tv.ten}`, bh: xemBang(B, null) };
  }
  return { ds: dsBang() };
}

module.exports = {
  lam, nhip, nhan, idCua, cuaNv, datKhu, bangTheoId, xoaNv, xoaTk,
  khoaKho: () => khoaLyDo,
  quanTri, dsXepHang,
  ganKiemTen: (fn) => { kiemTenCam = typeof fn === "function" ? fn : null; },
  xa, CF, TEN_CV, TEN_PHE, cong, quai,
  nhanCho: () => null,
  chanRtb, teDanNay, VAN
};