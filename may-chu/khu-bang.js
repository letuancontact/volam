"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do");
const BH = () => require("./bang-hoi");
const TG = () => require("./the-gioi");

const ZONES = (DO.NOI && DO.NOI.ZONES) || new Map();
const MAU_LIST = [
  { z: 590, ten: "Kinh Sư", n: "Kinh Sư" },
  { z: 593, ten: "Giang Nam", n: "Giang Nam" }
];
const CO_MAP_BANG = [586, 590, 593].some((id) => {
  const z = ZONES.get(id);
  if (!z || !z.bang) return false;
  const k = String(z.map || id);
  return fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "full", k)) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", k + ".jpg")) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", k + ".png"));
});

const CF = {
  bat: CO_MAP_BANG ? 1 : 0,
  xaPhu: { gia: 800, den: [53, 37] }
};

function loi(msg, code = 400) { const e = new Error(msg); e.code = code; throw e; }
function laKhu(z) { const o = ZONES.get(z | 0); return !!(o && o.bang); }
function cungBan(tkA, tkB, z) {
  if (!laKhu(z)) return true;
  const a = TG().bangCua ? TG().bangCua(tkA) : null;
  const b = TG().bangCua ? TG().bangCua(tkB) : null;
  return a != null && a === b;
}

function khuCua(B) {
  if (!B) return null;
  const zId = (B.khu && B.khu.mau) || 586;
  const coZ = laKhu(zId) && CO_MAP_BANG;
  return {
    z: coZ ? zId : null,
    tenKhu: coZ ? ((ZONES.get(zId) || {}).n || "Khu vực bang hội") : "",
    ly: coZ ? "" : "Bản đồ Khu vực bang hội chưa sẵn sàng",
    cap: B.cap | 0 || 1,
    tp: Object.fromEntries(Object.entries(B.tp || {}).map(([k, v]) => [k, v ? (v.cap | 0) : 0])),
    lanhDia: B.khu || null,
    chonDuoc: !!(coZ && !B.khu && (B.cap | 0) >= 2),
    lyChon: !coZ ? "Bản đồ Khu vực bang hội chưa sẵn sàng" : B.khu ? "Bổn bang đã chọn lãnh địa rồi" : "Cần đạt Đẳng cấp kiến thiết cấp 2 để chọn lãnh địa",
    mau: MAU_LIST,
    xaPhu: CF.xaPhu
  };
}

function lam(tk, h, o, b) {
  const viec = String((b && b.viec) || "");
  const cur = BH().cuaNv(tk.ten, o, h && h.name);
  const B = cur && cur.B, m = cur && cur.m;

  if (viec === "xem") {
    if (!B) return { khu: null, ly: "Bạn hiện giờ không thuộc bang hội nào!" };
    return { khu: khuCua(B) };
  }

  if (viec === "dangNhap") {
    if (!B || !CO_MAP_BANG) return { khu: B ? khuCua(B) : null, tin: ["Không thể vào khu vực bang hội — trở về Ba Lăng huyện"] };
    const k = khuCua(B);
    return { khu: k, vao: { z: k.z } };
  }

  if (viec === "vao") {
    if (!B) loi("Bạn hiện giờ không thuộc bang hội nào!");
    const k = khuCua(B);
    if (!k.z) loi(k.ly);
    return { khu: k, di: { z: k.z } };
  }

  if (viec === "xaPhu") {
    const den = b && (b.den | 0);
    if (![53, 37].includes(den)) loi("Điểm đến không hợp lệ");
    const gia = CF.xaPhu.gia | 0;
    if (gia > 0 && (h.gold | 0) < gia) loi(`Từ bang hội đến các đại thành thị cần ${gia} lượng, ngươi mang không đủ tiền`);
    if (gia > 0) h.gold -= gia;
    return { doi: gia > 0, di: { z: den } };
  }

  if (viec === "chonMau") {
    if (!B || !m || m.cv !== "chu") loi("Chỉ Bang chủ mới chọn được lãnh địa bang hội");
    const k = khuCua(B);
    if (!k.chonDuoc) loi(k.lyChon || "Chưa chọn được lãnh địa");
    const mau = MAU_LIST.find((x) => x.z === (b.mau | 0));
    if (!mau) loi("Mẫu lãnh địa không hợp lệ");
    BH().datKhu(B.id, { mau: mau.z, ten: mau.ten, luc: Date.now(), ai: h.name });
    return { khu: khuCua(B), msg: `Đã chọn ${mau.ten} làm lãnh địa của bang hội ${B.ten}!` };
  }

  loi("Thao tác khu vực bang chưa hỗ trợ: " + viec);
}

function nhip(tkTen, o, h, zoneId) {
  if (!laKhu(zoneId)) return null;
  const cur = BH().cuaNv(tkTen, o, h && h.name);
  if (cur && CO_MAP_BANG) return null;
  return { z: 53, tin: "Bạn không còn ở trong khu vực bang hội — đưa về Ba Lăng huyện", khu: null };
}

function quanTri(qt, b) {
  const B = BH().bangTheoId(b && b.id);
  if (!B) return { cf: CF };
  if (b && b.lam === "doiMau") {
    const mau = MAU_LIST.find((x) => x.z === (b.mau | 0));
    BH().datKhu(B.id, mau ? { mau: mau.z, ten: mau.ten, luc: Date.now(), ai: qt && qt.ten || "admin" } : null);
    return { msg: "Đã cập nhật lãnh địa bang hội", khu: khuCua(B) };
  }
  return { khu: khuCua(B) };
}

module.exports = { lam, nhip, cungBan, khuCua, laKhu, quanTri, CF };
