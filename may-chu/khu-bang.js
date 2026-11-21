"use strict";
const fs = require("fs");
const path = require("path");
const DO = require("./do");
const BH = () => require("./bang-hoi");
const TG = () => require("./the-gioi");

const ZONES = (DO.NOI && DO.NOI.ZONES) || new Map();
const MAU_LIST = [
  { z: 590, ten: "Kinh S?", n: "Kinh S?" },
  { z: 593, ten: "Giang Nam", n: "Giang Nam" }
];
const MAP_MAU_BANG = { 586: "c242", 590: "c325", 593: "c337" };

function coMapZone(id) {
  const zid = id | 0;
  const z = ZONES.get(zid);
  const k = String((z && z.map) || MAP_MAU_BANG[zid] || ("c" + zid));
  return fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "full", k)) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", k + ".jpg")) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", k + ".png")) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", zid + ".jpg")) ||
    fs.existsSync(path.join(__dirname, "..", "assets", "web", "map", "z", zid + ".png"));
}

function coMapBang() {
  return [586, 590, 593].some((id) => coMapZone(id));
}

const CF = {
  get bat() { return coMapBang() ? 1 : 0; },
  xaPhu: { gia: 800, den: [53, 37] }
};

function loi(msg, code = 400) { const e = new Error(msg); e.code = code; throw e; }
function laKhu(z) { const zid = z | 0; const o = ZONES.get(zid); return !!(o && o.bang) || Object.prototype.hasOwnProperty.call(MAP_MAU_BANG, zid); }
function cungBan(tkA, tkB, z) {
  if (!laKhu(z)) return true;
  const a = TG().bangCua ? TG().bangCua(tkA) : null;
  const b = TG().bangCua ? TG().bangCua(tkB) : null;
  return a != null && a === b;
}

function khuCua(B) {
  if (!B) return null;
  const zId = (B.khu && B.khu.mau) || 586;
  const sanSang = coMapBang();
  const coZ = laKhu(zId) && (coMapZone(zId) || sanSang);
  const zObj = ZONES.get(zId | 0);
  return {
    z: coZ ? zId : null,
    tenKhu: coZ ? ((zObj && zObj.n) || (zId === 590 ? "Khu v?c bang h?i Kinh S?" : zId === 593 ? "Khu v?c bang h?i Giang Nam" : "Khu v?c bang h?i chung")) : "",
    ly: coZ ? "" : "B?n ?? Khu v?c bang h?i ch?a s?n s?ng",
    cap: B.cap | 0 || 1,
    tp: Object.fromEntries(Object.entries(B.tp || {}).map(([k, v]) => [k, v ? (v.cap | 0) : 0])),
    lanhDia: B.khu || null,
    chonDuoc: !!(coZ && !B.khu && (B.cap | 0) >= 2),
    lyChon: !coZ ? "B?n ?? Khu v?c bang h?i ch?a s?n s?ng" : B.khu ? "B?n bang ?? ch?n l?nh ??a r?i" : "C?n ??t ??ng c?p ki?n thi?t c?p 2 ?? ch?n l?nh ??a",
    mau: MAU_LIST,
    xaPhu: CF.xaPhu
  };
}

function lam(tk, h, o, b) {
  const viec = String((b && b.viec) || "");
  const cur = BH().cuaNv(tk.ten, o, h && h.name);
  const B = cur && cur.B, m = cur && cur.m;

  if (viec === "xem") {
    if (!B) return { khu: null, ly: "B?n hi?n gi? kh?ng thu?c bang h?i n?o!" };
    return { khu: khuCua(B) };
  }

  if (viec === "dangNhap") {
    if (!B || !coMapBang()) return { khu: B ? khuCua(B) : null, tin: ["Kh?ng th? v?o khu v?c bang h?i ? tr? v? Ba L?ng huy?n"] };
    const k = khuCua(B);
    return { khu: k, vao: { z: k.z } };
  }

  if (viec === "vao") {
    if (!B) loi("B?n hi?n gi? kh?ng thu?c bang h?i n?o!");
    const k = khuCua(B);
    if (!k.z) loi(k.ly);
    return { khu: k, di: { z: k.z } };
  }

  if (viec === "xaPhu") {
    const den = b && (b.den | 0);
    if (![53, 37].includes(den)) loi("?i?m ??n kh?ng h?p l?");
    const gia = CF.xaPhu.gia | 0;
    if (gia > 0 && (h.gold | 0) < gia) loi(`T? bang h?i ??n c?c ??i th?nh th? c?n ${gia} l??ng, ng??i mang kh?ng ?? ti?n`);
    if (gia > 0) h.gold -= gia;
    return { doi: gia > 0, di: { z: den } };
  }

  if (viec === "chonMau") {
    if (!B || !m || m.cv !== "chu") loi("Ch? Bang ch? m?i ch?n ???c l?nh ??a bang h?i");
    const k = khuCua(B);
    if (!k.chonDuoc) loi(k.lyChon || "Ch?a ch?n ???c l?nh ??a");
    const mau = MAU_LIST.find((x) => x.z === (b.mau | 0));
    if (!mau) loi("M?u l?nh ??a kh?ng h?p l?");
    BH().datKhu(B.id, { mau: mau.z, ten: mau.ten, luc: Date.now(), ai: h.name });
    return { khu: khuCua(B), msg: `?? ch?n ${mau.ten} l?m l?nh ??a c?a bang h?i ${B.ten}!` };
  }

  loi("Thao t?c khu v?c bang ch?a h? tr?: " + viec);
}

function nhip(tkTen, o, h, zoneId) {
  if (!laKhu(zoneId)) return null;
  const cur = BH().cuaNv(tkTen, o, h && h.name);
  if (cur && coMapBang()) return null;
  return { z: 53, tin: "B?n kh?ng c?n ? trong khu v?c bang h?i ? ??a v? Ba L?ng huy?n", khu: null };
}

function quanTri(qt, b) {
  const B = BH().bangTheoId(b && b.id);
  if (!B) return { cf: CF };
  if (b && b.lam === "doiMau") {
    const mau = MAU_LIST.find((x) => x.z === (b.mau | 0));
    BH().datKhu(B.id, mau ? { mau: mau.z, ten: mau.ten, luc: Date.now(), ai: qt && qt.ten || "admin" } : null);
    return { msg: "?? c?p nh?t l?nh ??a bang h?i", khu: khuCua(B) };
  }
  return { khu: khuCua(B) };
}

module.exports = { lam, nhip, cungBan, khuCua, laKhu, quanTri, CF };
