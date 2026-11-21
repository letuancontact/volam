// Dò công cụ tự động bên ngoài (anh 13/11 — công cụ "VÕ LÂM S2 PRO AUTO": tự làm Dã Tẩu "Free 100%", tự săn Boss Sát thủ / Nhím / boss thế giới, "chống đóng băng
// chạy ngầm 24/7"; anh chọn "chặn + bắt quả tang"): CHỈ BÁO về máy chủ kèm nhịp, không tự xử ai — máy chủ ghi cờ "Nghi dùng công cụ" cho bảng F10
// (may-chu/nghi-tool.js), anh tự quyết. Tín hiệu mạnh, rẻ (dữ liệu tra 13/11 — người chơi thật không có):
//   chu        — chữ của bảng công cụ trên trang (bỏ dấu, viết hoa, bỏ khoảng trắng): PROAUTO, FREE100, CHONGDONGBANG — chỉ xét phần tử ngoài khung game
//                (#jxhud có khung chat người chơi gõ chữ tự do, #dt điện thoại) + shadow root mở
//   an         — document.hidden / visibilityState / hasFocus bị ghi đè (thuộc tính riêng trên document, hoặc getter trên Document.prototype không phải hàm gốc)
//   fetch / xhr / ws — window.fetch, XMLHttpRequest.prototype.open / send, WebSocket.prototype.send bị thay (không phải hàm gốc của trình duyệt)
//   wd         — navigator.webdriver (trình duyệt điều khiển tự động)
// Chạy lúc bắt đầu + mỗi 60 giây + 3 giây sau khi trang thêm phần tử. main.js gửi layBaoCao() kèm nhịp (dct) — chỉ khi có mã mới hoặc 10 phút nhắc lại.
//   DoCongCu.batDau() · DoCongCu.layBaoCao() -> { ma: [mã], bc: "bằng chứng ≤ 80 chữ" } | null
const CHU = ["PROAUTO", "FREE100", "CHONGDONGBANG"];
// khung game có chữ người chơi gõ (chat), lớp cửa sổ client, + các bảng của game hiện TÊN NHÂN VẬT người khác (boss thế giới, Săn Nhím, Tống Kim, Phong Hỏa, Hướng dẫn
// điện thoại…) — tên tự đặt kiểu "ProAuto" lên bảng boss làm mọi máy người xem tự báo (soát 13/11; tên như vậy nay cũng bị cấm đặt — may-chu/api.js tenCam)
const BO_QUA = new Set(["jxhud", "dt", "jxwin", "hd-dt", "btg", "snh", "tktt", "tkls", "tkcb", "tkkq", "tkcb-nut", "phtt", "phkq", "cg-hanh", "dt-hanh", "dt-dich", "jw-dat"]);
// cửa sổ game (tên sạp, tin…), menu, khung ủng hộ, loa quản trị; bảng F10 / công cụ thử (.dv — bằng chứng trích chữ của công cụ: máy quản trị tự báo) + màn đăng
// nhập / chọn nhân vật (.screen — tên nhân vật người chơi tự đặt) — soát 13/11
const BO_QUA_CSS = ".jw, .jx-menu, .uhq, .qt-loa, .dv, .screen, .jw-sktip, .jw-hand, .tl-bao, .tt-xo, script, style, input, textarea, [contenteditable]";
const NHAC_LAI = 10 * 60 * 1000;
const chuan = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "D").toUpperCase().replace(/[^A-Z0-9]/g, "");
// hàm gốc của trình duyệt: Function.prototype.toString ra "[native code]" kèm đúng tên (Proxy / hàm viết lại thì khác hoặc mất tên)
const fnToString = Function.prototype.toString;
const goc = (f, ten) => { try { if (typeof f !== "function") return false; const s = fnToString.call(f); return s.includes("[native code]") && (!ten || s.includes(ten)); } catch { return false; } };

let ma = new Map(), daBao = new Map(), bang = "", hen = null, ob = null;
function ghi(m, bc) { if (!ma.has(m)) ma.set(m, Date.now()); if (bc && !bang) bang = String(bc).slice(0, 80); }
function soat() {
  try {
    // toString của trình duyệt bị thay (để che các móc bên dưới)
    if (!goc(fnToString, "toString")) ghi("an", "Function.prototype.toString bị thay");
    // ẩn / hiện trang bị ghi đè
    for (const k of ["hidden", "visibilityState", "hasFocus"]) {
      if (Object.prototype.hasOwnProperty.call(document, k)) ghi("an", `document.${k} bị ghi đè`);
      const d = Object.getOwnPropertyDescriptor(Document.prototype, k);
      if (d && ((d.get && !goc(d.get, k)) || (d.value && !goc(d.value, k)))) ghi("an", `Document.${k} không phải hàm gốc`);
    }
    // hàm mạng bị móc
    if (!goc(window.fetch, "fetch")) ghi("fetch", "window.fetch bị thay");
    if (window.XMLHttpRequest) for (const k of ["open", "send"]) if (!goc(XMLHttpRequest.prototype[k], k)) ghi("xhr", `XMLHttpRequest.${k} bị thay`);
    if (window.WebSocket && !goc(WebSocket.prototype.send, "send")) ghi("ws", "WebSocket.send bị thay");
    if (navigator.webdriver === true) ghi("wd", "navigator.webdriver");
    // bảng chữ của công cụ: duyệt phần tử (bỏ cả nhánh khung game — HUD / chat người chơi gõ, cửa sổ game, menu, điện thoại, khung ủng hộ), chỉ xét phần tử chữ
    // ngắn (≤ 300 — tiêu đề / dòng chọn của bảng công cụ), cả shadow root mở; thấy là ghi đúng dòng chữ đó làm bằng chứng
    const xetGoc = (goc) => {
      const tw = document.createTreeWalker(goc, NodeFilter.SHOW_ELEMENT, { acceptNode: (e) => (BO_QUA.has(e.id) || e.matches(BO_QUA_CSS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      let e, dem = 0;
      while ((e = tw.nextNode()) && dem++ < 8000) {
        if (e.shadowRoot && xetGoc(e.shadowRoot)) return true;
        const raw = e.textContent; if (!raw || raw.length > 300) continue;
        if (CHU.some((c) => chuan(raw).includes(c))) { ghi("chu", raw.replace(/\s+/g, " ").trim().slice(0, 80)); return true; }
      }
      return false;
    };
    if (!xetGoc(document.body)) for (const el of document.documentElement.children) if (el !== document.body && el !== document.head && xetGoc(el)) break;
  } catch {}
}
export const DoCongCu = {
  batDau() {
    if (hen) return;
    soat(); hen = setInterval(soat, 60 * 1000);
    try {
      let cho = null;
      ob = new MutationObserver(() => { if (!cho) cho = setTimeout(() => { cho = null; soat(); }, 3000); });
      ob.observe(document.documentElement, { childList: true, subtree: false }); ob.observe(document.body, { childList: true, subtree: false });
    } catch {}
  },
  // xem các mã đã dò được (không đánh dấu đã báo — công cụ thử)
  xem() { return { ma: [...ma.keys()], bc: bang, daBao: [...daBao.keys()] }; },
  // mã mới (chưa báo) hoặc đã báo quá 10 phút -> gửi lại; không có gì -> null. Chỉ đánh dấu đã báo khi nhịp mang báo cáo tới máy chủ (daGui — soát 13/11:
  // nhịp hỏng thì nhịp sau gửi lại ngay, không chờ 10 phút)
  layBaoCao() {
    const t = Date.now(), L = [...ma.keys()].filter((m) => !daBao.has(m) || t - daBao.get(m) > NHAC_LAI).slice(0, 8);
    return L.length ? { ma: L, bc: bang } : null;
  },
  daGui(bc) { const t = Date.now(); if (bc && Array.isArray(bc.ma)) for (const m of bc.ma) daBao.set(m, t); },
};
