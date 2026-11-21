// Máy chủ GÓI Võ Lâm Idle - HuyHuyy: phát file game (may-chu/tep.js) + API tài khoản / lưu nhân vật (may-chu/api.js), dữ liệu ở du-lieu/.
// Mặc định chỉ nghe trên máy mình (127.0.0.1): người chơi ở nơi khác vào qua đường hầm (README — Cloudflare Tunnel), --lan: nghe cả
// mạng LAN. Chạy: node chay-game.js [cổng] [--lan] [--no-open]   (mặc định 8101) — hoặc bấm Chay_Game.bat.
// Tạo tài khoản: Tao_Tai_Khoan.bat hoặc node quan-tri.js (tài khoản đầu tiên là quản trị).
"use strict";
require("./may-chu/luoi-an-toan").cai(); // lỗi kết nối lọt ra ngoài không làm sập cả máy chủ (anh 12/11); lỗi khác vẫn thoát như cũ
const http = require("http");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { phatTep } = require("./may-chu/tep");
const { xuLyApi, tkWs } = require("./may-chu/api"); // tkWs: phiên như API, đang bảo trì thì chỉ tài khoản quản trị (may-chu/bao-tri.js)
const WS = require("./may-chu/ws"); // kênh tức thời GET /api/ws (anh 31/10 — boss thế giới máu chung)
const TN = require("./may-chu/tai-nguyen"); // phiên bản tài nguyên + gói tải trước lần đầu (service worker src/sw.js)
const D = require("./may-chu/du-lieu");
const CSC = require("./may-chu/chong-sao-chep"); // chống sao chép (anh 10/11): trang tên miền khác không dùng được tài nguyên / máy chủ này
const KTN = require("./may-chu/khoa-tai-nguyen"); // assets/ chỉ cho người đã đăng nhập — phiếu vl_tn (lượt 61)

const PORT = +process.argv.slice(2).find((a) => /^\d+$/.test(a)) || +process.env.PORT || 8101;
const LAN = process.argv.includes("--lan") || !!process.env.PORT, HOST = LAN ? "0.0.0.0" : "127.0.0.1";

// lỗi lọt ra ngoài API (kể cả lúc đang trả lỗi): trả 500 nếu còn trả được — không để lời hứa bị từ chối không ai bắt làm sập cả máy chủ (31/10)
const tra500 = (res) => { try { if (!res.headersSent && !res.destroyed) { res.writeHead(500); res.end(); } } catch {} };
function xuLy(req, res) {
  let p;
  try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400); return res.end(); }
  // đường dẫn lạ (rà soát lượt 61): ký tự NUL ("/src/%00" — fs.stat ném lỗi = SẬP máy chủ), gạch ngược, hoặc không chuẩn sau khi giải mã ("%2f..%2f",
  // "//", "/./" — lách khóa tài nguyên rồi tep.js chuẩn hóa ra tệp khác) -> 400. Trình duyệt thật không gửi kiểu này
  if (p.includes("\0") || p.includes("\\") || p !== path.posix.normalize(p)) { res.writeHead(400); return res.end(); }
  try {
    // chống sao chép (anh 10/11 — may-chu/chong-sao-chep.js): trang tên miền khác lấy hình / mã / API, nhúng game vào khung -> 403
    if (CSC.chan(req, p)) { res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("403"); }
    // danh sách gói tải trước (lộ đường dẫn MỌI tệp — công cụ chép trang dựa vào đây): chỉ khi đã đăng nhập (tải lúc vào game — đã có phiên).
    // Bảng phiên bản thư mục (/api/tai-nguyen — chỉ tên thư mục + mã) để công khai: service worker hỏi lúc mở trang cả khi chưa đăng nhập / đang
    // bảo trì; chặn thì nó dùng bảng cũ -> hình cũ sau khi cập nhật (rà soát lượt 60)
    if (p === "/api/tai-truoc") { // + làm mới phiếu tài nguyên (màn chọn nhân vật không gọi API nào khác — rà soát lượt 61)
      const tk = tkWs(req); if (!tk) { res.writeHead(401); return res.end(); }
      if (KTN.canLamMoi(req, tk.ten)) res.setHeader("Set-Cookie", KTN.cap(req, tk.ten));
    }
  } catch (e) { console.error(e); return tra500(res); } // lỗi bất ngờ ở lớp chặn: không làm sập máy chủ
  if (p === "/api/tai-nguyen" || p === "/api/tai-truoc") return TN.xuLy(req, res, p).catch(() => tra500(res));
  if (p.startsWith("/api/")) return xuLyApi(req, res, p).catch((e) => { console.error(e); tra500(res); });
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  // khóa tài nguyên sau đăng nhập (lượt 61 — may-chu/khoa-tai-nguyen.js): assets/ cần phiếu đăng nhập, trừ thứ màn đăng nhập cần; đếm theo tài khoản
  try {
    if (KTN.can(p)) {
      let ten = KTN.doc(req);
      // chưa có phiếu mà phiên đăng nhập còn hợp lệ (vừa lên bản này — người đang chơi chưa kịp nhịp; phiếu hết hạn lúc treo máy): vẫn phát + cấp phiếu
      // kèm câu trả lời này (đọc tệp tài khoản — chỉ tới khi trình duyệt nhận phiếu)
      if (!ten && /(?:^|;\s*)vl_phien=/.test(req.headers.cookie || "")) { const tk = tkWs(req); if (tk) { ten = tk.ten; res.setHeader("Set-Cookie", KTN.cap(req, tk.ten)); } }
      if (!ten) { res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); return res.end("401"); }
      KTN.dem(ten, p, req);
    }
    if (!/(?:^|;\s*)vl_phien=/.test(req.headers.cookie || "")) CSC.demTai(req, p); // chưa đăng nhập mà tải cả kho -> ghi nhật ký
    phatTep(req, res, p); // bọc bắt lỗi (rà soát lượt 61): lỗi đồng bộ khi tìm tệp không được làm sập máy chủ
  } catch (e) { console.error(e); return tra500(res); }
}
// Giữ kết nối lâu hơn đường hầm Cloudflare (cloudflared giữ kết nối rảnh 90 giây): Node mặc định đóng sau 5 giây -> đường hầm phải mở
// kết nối mới liên tục. Trên Windows "localhost" thử IPv6 (::1) trước: chỉ nghe 127.0.0.1 thì mỗi kết nối mới (đường hầm, trình duyệt
// mở localhost) chờ ~0,2 giây cho ::1 từ chối rồi mới sang IPv4 (đo 25/10: 0,205 s so với 0,0006 s) -> nghe cả ::1.
const taoMay = () => Object.assign(http.createServer(xuLy), { keepAliveTimeout: 100 * 1000, headersTimeout: 105 * 1000 });
const server = taoMay();
WS.gan(server, tkWs);
if (!LAN) { const s6 = taoMay(); WS.gan(s6, tkWs); s6.on("error", () => {}); s6.listen(PORT, "::1"); } // máy không có IPv6: bỏ qua

// sao lưu tài khoản lúc bật + mỗi 24 giờ (du-lieu/sao-luu/)
function saoLuu() { try { const d = D.saoLuu(); if (d) console.log("Đã sao lưu tài khoản: " + d); } catch (e) { console.error("Sao lưu lỗi: " + e.message); } }

server.on("error", (e) => { console.error(e.code === "EADDRINUSE" ? `Cổng ${PORT} đang bị dùng — chạy cổng khác: node chay-game.js 8111` : e.message); process.exit(1); });
TN.batDau(); // quét assets/ sẵn (không chặn) -> lần hỏi đầu trả ngay
server.listen(PORT, HOST, () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Máy chủ Võ Lâm Idle - HuyHuyy: ${url}  (giữ cửa sổ này trong lúc chơi; đóng = tắt)`);
  if (LAN) for (const l of Object.values(os.networkInterfaces())) for (const a of l || []) if (a.family === "IPv4" && !a.internal) console.log(`  Mạng LAN: http://${a.address}:${PORT}/`);
  const n = D.dsTk().length;
  console.log(n ? `${n} tài khoản. Thêm tài khoản: Tao_Tai_Khoan.bat` : "Chưa có tài khoản nào — bấm Tao_Tai_Khoan.bat để tạo (tài khoản đầu tiên là quản trị).");
  saoLuu(); setInterval(saoLuu, 24 * 3600 * 1000);
  if (!process.argv.includes("--no-open")) {
    const [cmd, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
    execFile(cmd, args, () => {});
  }
});
