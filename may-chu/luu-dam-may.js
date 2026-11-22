// Đồng bộ thư mục du-lieu/ với Upstash Redis (REST API) để giữ dữ liệu vĩnh viễn trên Render.
// Khi KHÔNG đặt UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (chạy trên máy cá nhân): tự tắt, dùng ổ đĩa cục bộ 100%.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const layRoot = () => process.env.VL_DU_LIEU || path.join(__dirname, "..", "du-lieu");
const layUrl = () => String(process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/+$/, "");
const layToken = () => String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
const layHKey = () => String(process.env.VL_CLOUD_KEY || "vl:du-lieu:v1").trim();

const BO_QUA_GOC = new Set(["phong-giu.json"]);
const HOP_LE_RE = /^(tai-khoan\/[a-z0-9_]{3,20}\.json|[a-z0-9][a-z0-9_-]*\.(json|txt))$/i;
const CHU_KY_MS = 15000;
const GOM_MS = 3000;
const BATCH_DOC = 20;
const BATCH_GHI_MAX_SO = 10;
const BATCH_GHI_MAX_CHU = 250000;

let sanSang = false;
let dangChay = null;
let chayLai = false;
let henTimer = null;
let chuKyTimer = null;
const daLuu = new Map(); // rel -> { mtimeMs, size, hash }

const coCauHinh = () => !!(layUrl() && layToken());
const sha1 = (s) => crypto.createHash("sha1").update(s, "utf8").digest("hex");

function hopLe(rel) {
  if (typeof rel !== "string" || !rel || rel.includes("..") || rel.includes("\\") || rel.includes("\0") || rel.endsWith(".tmp")) return false;
  if (BO_QUA_GOC.has(rel)) return false;
  return HOP_LE_RE.test(rel);
}

async function lenh(args, lan = 0) {
  const url = layUrl(), token = layToken();
  if (!url || !token) throw new Error("Thiếu cấu hình Upstash Redis");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(15000)
    });
    const txt = await res.text();
    let j = null;
    try { j = JSON.parse(txt); } catch {}
    if (!res.ok || !j || j.error) {
      throw new Error((j && j.error) || `HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }
    return j.result;
  } catch (e) {
    if (lan < 1) {
      await new Promise((r) => setTimeout(r, 600));
      return lenh(args, lan + 1);
    }
    throw e;
  }
}

function ghiNguyenTu(full, noiDung) {
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const tmp = full + "." + process.pid + ".cloud.tmp";
  fs.writeFileSync(tmp, noiDung, "utf8");
  fs.renameSync(tmp, full);
}

function quetCucBo() {
  const root = layRoot();
  const kq = new Map();
  const them = (rel, full) => {
    if (!hopLe(rel)) return;
    try {
      const st = fs.statSync(full);
      if (st.isFile()) kq.set(rel, { full, mtimeMs: st.mtimeMs, size: st.size });
    } catch {}
  };
  try {
    for (const f of fs.readdirSync(root)) {
      if (f.endsWith(".json") || f.endsWith(".txt")) them(f, path.join(root, f));
    }
  } catch {}
  const tkDir = path.join(root, "tai-khoan");
  try {
    for (const f of fs.readdirSync(tkDir)) {
      if (f.endsWith(".json")) them("tai-khoan/" + f, path.join(tkDir, f));
    }
  } catch {}
  return kq;
}

async function khoiDong() {
  daLuu.clear();
  sanSang = false;
  if (!coCauHinh()) {
    console.log("Lưu đám mây (Upstash): tắt — chạy dữ liệu cục bộ du-lieu/");
    return { bat: false, phucHoi: 0 };
  }
  const root = layRoot(), hkey = layHKey();
  fs.mkdirSync(path.join(root, "tai-khoan"), { recursive: true });
  try {
    const rawKeys = await lenh(["HKEYS", hkey]);
    const keys = (Array.isArray(rawKeys) ? rawKeys : []).filter(hopLe).sort();
    let phucHoi = 0;
    for (let i = 0; i < keys.length; i += BATCH_DOC) {
      const lo = keys.slice(i, i + BATCH_DOC);
      const vals = await lenh(["HMGET", hkey, ...lo]);
      if (!Array.isArray(vals)) continue;
      for (let j = 0; j < lo.length; j++) {
        const rel = lo[j], val = vals[j];
        if (typeof val !== "string") continue;
        const full = path.join(root, ...rel.split("/"));
        ghiNguyenTu(full, val);
        try {
          const st = fs.statSync(full);
          daLuu.set(rel, { mtimeMs: st.mtimeMs, size: st.size, hash: sha1(val) });
          phucHoi++;
        } catch {}
      }
    }
    sanSang = true;
    console.log(`Lưu đám mây (Upstash): đã phục hồi ${phucHoi} tệp dữ liệu vào du-lieu/`);
    if (phucHoi === 0 && quetCucBo().size > 0) {
      const r = await dongBo(true);
      console.log(`Lưu đám mây (Upstash): đẩy dữ liệu khởi tạo ban đầu (${r.ghi || 0} tệp)`);
    }
    return { bat: true, phucHoi };
  } catch (e) {
    sanSang = false;
    console.error("Lưu đám mây (Upstash) lỗi khởi động — tạm khóa chiều ghi để bảo vệ dữ liệu đám mây:", e.message);
    return { bat: true, loi: e.message, phucHoi: 0 };
  }
}

async function thucHienDongBo() {
  const hkey = layHKey();
  const hien = quetCucBo();
  const canGhi = [];
  const canXoa = [];

  for (const [rel, info] of hien.entries()) {
    const cu = daLuu.get(rel);
    if (cu && cu.mtimeMs === info.mtimeMs && cu.size === info.size) continue;
    let noiDung;
    try { noiDung = fs.readFileSync(info.full, "utf8"); } catch { continue; }
    const h = sha1(noiDung);
    if (cu && cu.hash === h) {
      daLuu.set(rel, { mtimeMs: info.mtimeMs, size: info.size, hash: h });
      continue;
    }
    canGhi.push({ rel, noiDung, mtimeMs: info.mtimeMs, size: info.size, hash: h });
  }

  for (const rel of daLuu.keys()) {
    if (!hien.has(rel)) canXoa.push(rel);
  }

  let ghiSo = 0, xoaSo = 0;
  let batch = [], batchChu = 0;
  const xaBatch = async () => {
    if (!batch.length) return;
    const args = ["HSET", hkey];
    for (const item of batch) { args.push(item.rel, item.noiDung); }
    await lenh(args);
    for (const item of batch) {
      daLuu.set(item.rel, { mtimeMs: item.mtimeMs, size: item.size, hash: item.hash });
      ghiSo++;
    }
    batch = []; batchChu = 0;
  };

  for (const item of canGhi) {
    const doDai = item.rel.length + item.noiDung.length;
    if (batch.length >= BATCH_GHI_MAX_SO || (batch.length > 0 && batchChu + doDai > BATCH_GHI_MAX_CHU)) {
      await xaBatch();
    }
    batch.push(item);
    batchChu += doDai;
  }
  await xaBatch();

  for (let i = 0; i < canXoa.length; i += BATCH_DOC) {
    const lo = canXoa.slice(i, i + BATCH_DOC);
    await lenh(["HDEL", hkey, ...lo]);
    for (const rel of lo) { daLuu.delete(rel); xoaSo++; }
  }
  return { ghi: ghiSo, xoa: xoaSo };
}

async function dongBo(ep = false) {
  if (!sanSang || !coCauHinh()) return { boQua: true, ghi: 0, xoa: 0 };
  if (dangChay) {
    chayLai = true;
    if (ep) await dangChay;
    else return { cho: true, ghi: 0, xoa: 0 };
  }
  let tong = { ghi: 0, xoa: 0 };
  const chay = (async () => {
    do {
      chayLai = false;
      const r = await thucHienDongBo();
      tong.ghi += r.ghi;
      tong.xoa += r.xoa;
    } while (chayLai);
  })();
  dangChay = chay;
  try {
    await chay;
    return tong;
  } catch (e) {
    console.error("Lưu đám mây (Upstash) lỗi đồng bộ:", e.message);
    return { ...tong, loi: e.message };
  } finally {
    dangChay = null;
  }
}

function henDongBo(ms = GOM_MS) {
  if (!sanSang || !coCauHinh()) return;
  if (henTimer) return;
  henTimer = setTimeout(() => {
    henTimer = null;
    dongBo(false).catch(() => {});
  }, ms);
  if (henTimer.unref) henTimer.unref();
}

function batDauDongBo() {
  if (!sanSang || !coCauHinh() || chuKyTimer) return;
  chuKyTimer = setInterval(() => { dongBo(false).catch(() => {}); }, CHU_KY_MS);
  if (chuKyTimer.unref) chuKyTimer.unref();
}

async function tatMay() {
  if (henTimer) { clearTimeout(henTimer); henTimer = null; }
  if (chuKyTimer) { clearInterval(chuKyTimer); chuKyTimer = null; }
  if (!sanSang || !coCauHinh()) return { boQua: true };
  // Đợi nhẹ 120ms để các bộ hẹn ghi nhỏ kịp hoàn tất trước khi xả lên Upstash
  await new Promise((r) => setTimeout(r, 120));
  const r = await dongBo(true);
  console.log(`Lưu đám mây (Upstash): đã xả trước khi tắt (ghi ${r.ghi || 0}, xóa ${r.xoa || 0})`);
  return r;
}

module.exports = { khoiDong, dongBo, henDongBo, batDauDongBo, tatMay, coCauHinh, _thu: { hopLe, quetCucBo, daLuu } };
