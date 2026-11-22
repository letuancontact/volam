// Chế độ điện thoại dựng dọc (anh 29/10: "đưa lên chơi trên web, điện thoại" — chọn mẫu 1 Cổ phong của mau-dien-thoai/, "đơn giản nhưng hiệu
// quả"): thanh trên (chân dung, tên, sinh lực / nội lực / kinh nghiệm, tiền), cảnh game ở giữa (bản đồ nhỏ, tự đánh, ô T · P · 1–6, cần điều
// khiển), bảng chức năng + 5 thẻ ở dưới. Cửa sổ client mở trong bảng dưới, co vừa bề ngang (2 cửa sổ: xếp cạnh nhau); khung hỏi / hội thoại
// NPC giữa màn hình. Chạm: chạm = bấm chuột trái, chạm giữ = chuột phải (món: nhấc lên để kéo), chạm món lần đầu = xem món + hàng nút việc
// làm (Mặc, Uống, Bán…). Xoay ngang: về giao diện máy tính. Bản máy tính không đổi gì — chỉ thêm lớp body.dt (game.css) khi bật.
// Sửa 29/10 lần 2 (anh thử Red Magic): bảng Giang hồ đè lên cảnh, hình game đứng yên khi mở / thu gọn; bỏ nút trùng (Nhận thưởng ở thanh trên,
// Giúp đỡ + Tin cập nhật ở Hệ thống); chạm chân dung = chọn chân dung (hiện một mình); khung chat riêng; nút việc làm của món; cần điều khiển.
// Sửa 30/10 (anh thử lần 2): Hành trang = Túi tử mẫu + Hành trang cạnh nhau (anh chọn mẫu A trong 2 bản nháp); mọi bảng đè lên cảnh, hình game
// không đổi; bảng của các thẻ (cả cửa sổ khác, khung chat) cao như nhau; kéo món tới ô muốn thả (bỏ giữ = mặc); nút Nói chuyện (chạm NPC trên
// cảnh không mở hội thoại nữa).
// Màn NGANG (anh 30/10: "chơi màn hình ngang thì sao — làm đa chiều cho người chơi tự do chọn", chọn mẫu 2 "Vòng kỹ năng" của
// mau-dien-thoai/dung-mau-ngang.cjs): điện thoại xoay ngang (cao ≤ NGANG_CAO) -> body.dt-ngang: thanh trạng thái góc trái trên, hàng icon
// (Nhận thưởng, Toàn màn hình, 5 thẻ) cạnh bản đồ nhỏ, ô T · P · 1–6 + Tự đánh xếp vòng góc phải dưới (hình kỹ năng cắt tròn), cần điều khiển
// góc trái dưới; mở thẻ = trang chức năng che cả màn (cột thẻ trái) — Hành trang: Trang bị + Túi tử mẫu + Hành trang cùng lúc; chat nửa trái.
// Sửa 30/10 lần 3 (anh thử màn ngang): vào game là thu gọn (dọc: bảng Giang hồ; ngang: hàng icon — nút Mở rộng / Thu gọn cạnh bản đồ nhỏ),
// Nhận thưởng vào bảng Giang hồ (anh sẽ gom thêm các loại thưởng vào đây), cỡ giao diện 100 / 90 / 85 / 80% (Trợ Thủ → Khác — _datCo).
// Sửa 30/10 lần 4: chạm bản đồ nhỏ = bản đồ lớn (kéo được nếu là bản đồ đầy đủ, chạm chỗ nào nhân vật chạy tới đó — _moBdl); nút Giao dịch (mở /
// đóng giao dịch) thay nút Bản đồ của bảng Giang hồ; chạm giữ người chơi khác = menu người chơi (main.js mouseAct); khung giao dịch kéo thả món.
// Sửa 30/10 lần 8: nút Nhặt (anh: "trên mobile thiếu nút nhặt đồ, đang bấm vào là nó nhặt — khỏi nhặt nhầm"): chạm vật trên đất = chạm đất
// (main.js mouseAct); có vật gần nhân vật -> nút Nhặt (tên vật, số vật quanh đó), bấm = đi tới nhặt vật gần nhất (_nutNhat).
// Sửa 31/10 lần 12 (anh: "thêm 1 ô khóa ... để thay đổi trạng thái gắn skill và trạng thái dùng skill hoặc vật phẩm, nếu không sẽ bị rối thao
// tác"; "đang kéo chiêu mà kéo thanh di chuyển thì nhân vật ưu tiên di chuyển"): nút khóa ô kỹ năng bên trái hàng ô dưới (datOKhoa); cần điều
// khiển được ưu tiên hơn ngắm chiêu (_ngam); ngón thứ hai (ngón kia giữ cần) chạm / kéo ô kỹ năng vẫn được (_cham g2, _ngam).
// Sửa 31/10 lần 14 (anh thử: "khung ô kĩ năng và vật phẩm cần thiết kế lại vị trí để tránh rối thao tác, phóng to hơn"; "chỗ chat và cái joystick
// điều chỉnh vị trí, bị cấn quá" — chọn kiểu B trong ảnh so): hàng chiêu to + hàng vật phẩm tách riêng (_xepO), cần lên cao lệch vào giữa, nút Chat
// lên trên; nút Vứt món trong túi (_hanh / _lam); dòng tin đủ chữ (game.css .dt-tin).
// Bật: điện thoại tự bật (anh 31/10 "cho phép mở link trên giao diện điện thoại" — laDienThoai); ?dt=0 tắt hẳn ở máy đó, ?dt=1 bật cả ở máy khác
// (nhớ ở máy — localStorage vl_dt "1" / "0").
// Máy tính dùng chuột (anh 02/11: "kéo hẹp trang web thì thay giao diện PC thành giao diện mobile — kéo vào thì quá nhỏ, khó đọc"): cửa sổ dựng
// dọc và hẹp hơn MT_RONG -> giao diện điện thoại dọc, kéo rộng lại -> giao diện máy tính (this.mt — không có màn ngang, cỡ giao diện luôn 100%
// vì trình duyệt máy tính bỏ qua viewport, cần điều khiển mặc định tắt). Chuột vẫn bấm NPC / vật trên đất như máy tính (main.js mouseAct).
//   DienThoai.bat() -> true | false;  DienThoai.cheDo() -> "dt" | "mt" | "" (main.js: dựng D khi khác "", api.mt khi "mt")
//   const D = new DienThoai(api); D.tick() mỗi khung; D.neoY() -> chỗ nhân vật theo chiều dọc màn hình (0..1)
//   D.can / D.datCan(true | false) — cần điều khiển (Trợ Thủ → Khác)
//   api = { P, cv, hero(), world(), GW(), TT(), toggleAuto(), facOf(h), tinMoi() -> [tin chưa xem], help(), joy([x, y] | null), vut() -> Promise (vứt món đang cầm — hỏi lại), fps(), ping() -> ms | null, online() -> số người trực tuyến }
import { fmtMoney } from "./money.js";
import { ItemDB } from "./itemdb.js";
import { BieuCam } from "./bieucam.js";
import { chuMau } from "./npcdlg.js"; // tin hệ thống có thẻ màu <color=…> (anh 13/11 mẫu C — soát: dải 2 dòng tin của điện thoại hiện thẻ thô)
import { kindOf } from "./vocong.js";
import { XUC_XAC, bauCuaChu } from "./baucua.js";
import { KY_NGAN } from "./an-ky.js"; // chữ ký bản gốc (anh 11/11) — ô nhỏ cùng hàng FPS / mạng / trực tuyến

const A = "assets/";
const TREN = 68, TAB = 58; // cao thanh trên / dải thẻ dưới
const HT_W = 432, HT_H = 474; // Túi tử mẫu + Hành trang cạnh nhau: rộng 2 khung client (+ 4 điểm hở), cao khung Hành trang
const O_TUI = 28; // 1 ô lưới túi / rương (windows.js UNIT)
const NOI_R = 200; // nút Nói chuyện: NPC trong tầm này (khoảng cách bản đồ như World — trục dọc × 2)
const NHAT_R = 300; // nút Nhặt: vật trên đất trong tầm này (đo như NOI_R)
const TIN_HIEN = 6000; // dòng tin trên cảnh (trên nút Chat) hiện chừng này ms kể từ tin mới nhất rồi mờ đi
const LECH = 40; // món đang kéo nổi trên ngón tay chừng này điểm (ngón khỏi che món + ô sẽ thả)
const NGANG_CAO = 500; // xoay ngang mà bề cao ≤ chừng này = điện thoại -> màn ngang; máy tính bảng / màn to: giao diện máy tính
const MT_RONG = 800; // máy tính: cửa sổ dựng dọc hẹp hơn chừng này -> giao diện điện thoại (giao diện máy tính 1024 phải thu dưới ~78%)
const RAY = 72; // màn ngang: cột thẻ bên trái của trang chức năng
// màn ngang — vòng kỹ năng góc phải dưới (tâm cách góc 62 điểm): [chọn ô, cỡ, vòng (0 giữa · 1 trong · 2 ngoài), góc (180 = bên trái tâm, 90 = trên)]
const O_VONG = [['.jx-skill[data-skill="left"]', 70, 0, 0], ['.jx-skill[data-skill="right"]', 52, 1, 180], ['.jx-slot[data-slot="2"]', 46, 1, 135],
  ['.jx-slot[data-slot="3"]', 46, 1, 90], ['.jx-slot[data-slot="0"]', 42, 2, 172], ['.jx-slot[data-slot="1"]', 42, 2, 150],
  ['.jx-slot[data-slot="4"]', 42, 2, 106], ['.jx-slot[data-slot="5"]', 42, 2, 84]];
// nút Lên / xuống ngựa (anh 10/11: "đưa nút lên xuống ngựa, thu nhỏ xíu ra màn hình chính để tiện thao tác trên mobile ngang dọc"): màn ngang = ô
// tròn vòng ngoài, chỗ nút Tự đánh cũ (Tự đánh lên thanh dưới tên bãi như màn dọc — anh: "chỗ bật/tắt tự đánh chưa có trên màn hình chính");
// màn dọc = bên trái nút khóa ô kỹ năng (--dt-ngr / --dt-ngt — _xepO). Chỉ hiện khi nhân vật đang mặc ngựa
const NGUA_VONG = [40, 2, 128];
const OK_VONG = [36, 2, 194]; // nút khóa ô kỹ năng (datOKhoa): vòng ngoài, dưới ô 1
// ổ khóa của nút khóa ô kỹ năng: quai đóng (.k — khóa: chỉ dùng) / quai nhấc, chân trái ra khỏi thân (.m — mở: chỉ gắn); game.css .dt-okhoa
const KHOA_SVG = '<svg viewBox="0 0 20 20" width="20" height="20"><path class="k" d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/><path class="m" d="M13.5 9V4.5a3.5 3.5 0 0 0-7 0V6"/><rect x="4" y="9" width="12" height="8.5" rx="1.5"/><rect class="lo" x="9" y="11.5" width="2" height="3.5" rx="1"/></svg>';
// cỡ giao diện điện thoại (Trợ Thủ → Khác — nhớ ở máy): 1 = như cũ; CO_MD = mặc định khi chưa chọn (anh 30/10 chọn 80% — ảnh so
// mau-dien-thoai/co-giao-dien.png)
const CO = [1, 0.9, 0.85, 0.8], CO_MD = 0.8;
const KHUNG = [30, 60, 0], KHUNG_MD = 60; // khung hình / giây tối đa (Trợ Thủ → Khác — datKhung); 0 = không giới hạn (anh 31/10: "máy mạnh thì max luôn, mặc định 60")
// khung hỏi, hội thoại NPC, chọn số lượng…: giữa màn hình, đè lên cảnh; cửa sổ khác vào bảng dưới
const GIUA = new Set(["hoi", "info2", "msgsel", "describe", "soluong", "nhapchu", "datmk", "doimk", "banphim", "money", "trade", "thuong", "loginprize", "giupdohinh", "xephang", "btgkq",
  "dinhgia", "loirao", "tienDo", "bhTao", "bhBoNhiem", "bhDanhHieu", "ldkq", "dnkq"]); // chợ trời (src/game/chotroi.js): khung Rao bán (giá), lời rao; tienDo: thanh Đang thu thập (nhiệm vụ Võ Lâm Minh Chủ); bh*: khung phụ Bang phái (anh 14/11 — Lập bang, Bổ nhiệm, Danh hiệu); ldkq: bảng kết quả lôi đài (windows.js ketQuaLoiDai — anh 15/11)
// cửa sổ hiện một mình trong bảng dưới (che cửa sổ đang mở): chọn chân dung — anh 29/10: trước xếp cạnh khung Nhân vật, cả 2 co nhỏ
const RIENG = new Set(["portrait"]);
const HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"], HE_MAU = ["#f3d35b", "#6fd46a", "#5fb8ff", "#ff6a3a", "#c8965a"];
const BTN = (f, n = 3) => ({ src: A + "ui/hud/btn/" + f + ".png", n }); // nút client: dải n khung (thường / nhấn / rê chuột)
const IMG = (p) => ({ src: A + p, n: 1 });
const IC = {
  nhiemvu: BTN("task"), todoi: BTN("team"), haohuu: BTN("friend"), bangphai: BTN("faction"),
  ktc: IMG("ui/win/img/jinqian_icon_017ex_121f1b65.png"), giaodich: BTN("exchange", 2), xephang: IMG("web/icon/item/questkey/006.png"),
  nhanthuong: BTN("nhanthuong"), ngoi: BTN("sit"), ngua: BTN("horse", 2), phongchat: BTN("chatroom"), hethong: BTN("options"), chat: BTN("chatroom"),
  giangho: IMG("web/icon/item/questkey/x_58624df3.png"), nhanvat: BTN("status"), vocong: BTN("skills"), hanhtrang: BTN("items"), trothu: BTN("trothu"),
  xu: IMG("ui/win/img/tongqian.png"), chotroi: BTN("chotroi"), huongdan: BTN("huongdan"), phanthan: BTN("phanthan"), zalo: IMG("ui/hud/btn/zalo.png"),
  khoaat: BTN("khoa_dong", 2), // ổ khóa an toàn của client (cong-cu/dung-o-khoa.js — anh 10/11)
};
// bảng Giang hồ: [chữ, icon, việc] — 2 hàng × 6 (anh 29/10 "các nút đừng dư thừa": Giúp đỡ + Tin cập nhật ở Hệ thống; bảng thấp lại ->
// nhân vật đứng giữa màn hình hơn). Túi tử mẫu: đã nằm trong thẻ Hành trang (30/10 — mẫu A). Nhận thưởng: chuyển từ thanh trên vào đây (30/10
// lần 3 — anh sẽ gom thêm các loại thưởng vào nút này). Giao dịch (30/10 lần 4): nút Đóng mở giao dịch của thanh dưới (sáng = đang mở — người khác
// chạm giữ mình -> Giao dịch) thay chỗ nút Bản đồ — bản đồ lớn giờ mở bằng chạm bản đồ nhỏ
// Hoạt động (anh 05/11 — Hướng dẫn hoạt động, icon client của cột icon): ô đầu bảng, bảng 7 cột vẫn 2 hàng
const LUOI = [
  ["Hoạt động", "huongdan", (D) => D.nut("HuongDan")], ["Nhiệm vụ", "nhiemvu", (D) => D.mo("Task")], ["Tổ đội", "todoi", (D) => D.mo("Team")], ["Hảo hữu", "haohuu", (D) => D.mo("Friend")],
  ["Bang phái", "bangphai", (D) => D.mo("Faction")], ["Kỳ Trân Các", "ktc", (D) => D.mo("Market")], ["Giao dịch", "giaodich", (D) => D.bat("Exchange")],
  ["Xếp hạng", "xephang", (D) => D.nut("XepHang")], ["Ngồi thiền", "ngoi", (D) => D.bat("Sit")], ["Lên ngựa", "ngua", (D) => D.bat("Horse")],
  ["Chợ Trời", "chotroi", (D) => D.nut("ChoTroi")], ["Hệ thống", "hethong", (D) => D.mo("Options")], ["Nhận thưởng", "nhanthuong", (D) => D.nut("NhanThuong")],
  ["Phân thân", "phanthan", (D) => D.nut("PhanThan")], // anh 05/11 — khung Phân Thân (src/game/phanthan.js), ô thứ 14 của bảng 7 × 2
  ["Nhóm Zalo", "zalo", (D) => D.nut("NhomZalo")], // anh 09/11 — mã QR vào nhóm Zalo (src/game/nhomzalo.js), ô đầu hàng 3
  ["Khóa an toàn", "khoaat", (D) => D.nut("KhoaAnToan")], // anh 10/11 — mật khẩu cấp 2 / đổi mật khẩu (src/game/khoaantoan.js); luôn là ô cuối (setKhoaAnToan)
]; // Chợ Trời (anh 02/11 — "dùng 1 icon mở giao diện chợ trời") thay chỗ Phòng chat (khung phòng chat cần máy chủ chưa làm — vẫn mở ở thẻ Phòng của khung chat)
const L_GIAODICH = 6, L_NGOI = 8, L_NGUA = 9, L_HETHONG = 11, L_NHANTHUONG = 12;
const LUOI_CAO = 220; // cao bảng Giang hồ (tiêu đề + 2 hàng nút + Việc cần làm) — đo lại khi bảng hiện (_doLuoi)
// dải thẻ dưới: [chữ, icon, cửa sổ, nút của thanh dưới máy tính]
const THE = [["Giang hồ", "giangho"], ["Nhân vật", "nhanvat", "status", "Status"], ["Võ công", "vocong", "skills", "Skills"], ["Hành trang", "hanhtrang", "items", "Items"], ["Trợ Thủ", "trothu", "trothu"]];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rgb = (c) => `rgb(${(c || [255, 255, 255]).join(",")})`;
// icon: dải nhiều khung -> khung f; ảnh đơn -> vừa ô
function ic(k, s, f = 0) {
  const o = IC[k], nen = o.n > 1 ? `background-size:${o.n * 100}% 100%;background-position:${(Math.min(f, o.n - 1) / (o.n - 1)) * 100}% 0` : "background-size:contain;background-position:center";
  return `<i class="dt-ic${o.n === 3 ? " f3" : ""}" style="width:${s}px;height:${s}px;background-image:url('${o.src}');${nen}"></i>`;
}
// 8 ô của thanh dưới máy tính giữ lại trên cảnh (góc phải dưới, 2 hàng × 4): hàng trên ô T, P, 5, 6 (anh 31/10 "2 ô trái phải nên để vào đây
// cho dễ" — chỗ ô 3, 4 cũ: kéo ngắm chiêu từ đó còn chỗ cho vòng điều khiển), hàng dưới ô 1–4; [chọn ô, chữ góc, cột tính từ phải, hàng tính từ dưới]
// — chỗ, cỡ: _xepO
const O_NHANH = [['.jx-slot[data-slot="3"]', "4", 0, 0], ['.jx-slot[data-slot="2"]', "3", 1, 0], ['.jx-slot[data-slot="1"]', "2", 2, 0], ['.jx-slot[data-slot="0"]', "1", 3, 0],
  ['.jx-slot[data-slot="5"]', "6", 0, 1], ['.jx-slot[data-slot="4"]', "5", 1, 1], ['.jx-skill[data-skill="right"]', "P", 2, 1], ['.jx-skill[data-skill="left"]', "T", 3, 1]];
// nút việc làm của món (anh 29/10: "chưa mang được đồ — quy tắc trên máy tính khác trên điện thoại, thiết kế cách mang đồ khác"): đọc từ dòng
// gợi ý của ô xem món (windows.js tipHint) — "Bấm: cầm lên · Chuột phải: mặc · Ctrl + chuột phải: bán" -> [Mặc] [Cầm lên] [Bán]; bấm nút =
// gửi đúng sự kiện chuột đó vào món (việc của chuột phải lên đầu). "Cầm lên" không thành nút: kéo món (30/10 — _cham)
const HANH =[[/^Alt \+ chuột phải: ?(.+)$/i, "contextmenu", { altKey: true }, 0], [/^Chuột phải(?: \(.*?\))?: ?(.+)$/i, "contextmenu", {}, 0], [/^Bấm(?: \(.*?\))?: ?(.+)$/i, "click", {}, 1], [/^Bấm (Mua) để mua$/i, "click", {}, 1],
  [/^Shift \+ chuột phải: ?(.+)$/i, "contextmenu", { shiftKey: true }, 2], [/^Ctrl \+ chuột phải: ?(.+)$/i, "contextmenu", { ctrlKey: true }, 2],
  [/^Ctrl \+ bấm: ?(.+)$/i, "click", { ctrlKey: true }, 3]]; // Khoe đồ (anh 12/11 — windows.js KHOE)
export function hanhDong(hint) {
  const ds = [];
  for (const dong of [].concat(hint || [])) for (const d of String(dong).split(" · ")) {
    for (const [re, loai, mod, th] of HANH) {
      const m = re.exec(d.trim()); if (!m) continue;
      const chu = m[1].split(/ \(| — /)[0].trim();
      if (chu && !/^cầm lên$/i.test(chu)) ds.push({ chu: chu[0].toUpperCase() + chu.slice(1), loai, mod, th });
      break;
    }
  }
  return ds.sort((a, b) => a.th - b.th);
}
// nút của hàng việc làm = nút trống của client, chữ do game vẽ (anh 31/10: "Tháo Đóng thô quá, hơi kém thẩm mĩ, mà còn to quá"): hình nút Mua
// của Kỳ Trân Các (奇珍阁界面.ini MarketGoods_Buy 53 × 20), Trước / Kế (帮会基础信息页面.ini 70 × 20), nút tác phường (帮会作坊信息页面.ini
// 98 × 20) — hình nhỏ nhất vừa chữ, chữ dài hơn thì giãn hình 98; khung 0 thường, khung 2 lúc nhấn (như nút Mua) — game.css #dt-hanh. Máy tính bảng dùng chung (chamgiu.js)
export function nutClient(W, b) {
  const M = W.M, F = M.faction.pages;
  const ds = [M.market.sec.MarketGoods_Buy.img, F.base.sec.BtnPrevPage.img, F.workshop.sec.BtnLearnWorkshop.img];
  for (const el of b.querySelectorAll(".dt-hn")) {
    el.style.width = ""; const can = el.scrollWidth; // chữ + đệm 2 bên
    const im = ds.find((x) => x.w >= can) || ds[ds.length - 1], w = Math.max(im.w, can);
    Object.assign(el.style, { width: w + "px", backgroundImage: `url(${W.base}${im.file})`, backgroundSize: `${w * im.n}px ${im.h}px` });
    el.style.setProperty("--w", w + "px");
  }
}

// ---------- toàn màn hình giữ cỡ giao diện (anh 31/10: "bật nút full màn hình thì hình ảnh game bị thay đổi theo, ý anh là kích thước, anh không
// muốn thế") ----------
// Cỡ giao diện (_datCo) dùng initial-scale của viewport; lúc toàn màn hình (Fullscreen API) Chromium ép tỉ lệ trang = 1 -> cảnh lẫn nút to ra 1 / cỡ
// lần. Bù: <html> zoom = cỡ (Z), và cho mã game thấy tọa độ như lúc tỉ lệ trang = cỡ: innerWidth / innerHeight, getBoundingClientRect, clientX /
// clientY (x / y) của sự kiện chuột / chạm thật chia Z, elementFromPoint nhân Z (zoom chuẩn của Chromium: 4 thứ đó theo điểm màn hình, còn kích
// thước CSS theo điểm đã zoom — đo 31/10). Sự kiện tự tạo (_cham…) đã mang tọa độ của game -> giữ nguyên. Z = 1: như trình duyệt
let Z = 1, daCai = false;
function caiZoom() {
  daCai = true;
  const d = (o, k) => Object.getOwnPropertyDescriptor(o, k);
  for (const k of ["innerWidth", "innerHeight"]) { const g = d(window, k).get; Object.defineProperty(window, k, { configurable: true, enumerable: true, get() { return g.call(window) / Z; } }); }
  const rect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () { const r = rect.call(this); return Z === 1 ? r : new DOMRect(r.x / Z, r.y / Z, r.width / Z, r.height / Z); };
  const efp = Document.prototype.elementFromPoint;
  Document.prototype.elementFromPoint = function (x, y) { return efp.call(this, x * Z, y * Z); };
  const doi = (P, k, thatThoi) => { const g = d(P, k).get; Object.defineProperty(P, k, { configurable: true, enumerable: true, get() { const v = g.call(this); return Z === 1 || (thatThoi && !this.isTrusted) ? v : v / Z; } }); };
  for (const k of ["clientX", "clientY", "x", "y"]) doi(MouseEvent.prototype, k, true);
  if (typeof Touch !== "undefined") for (const k of ["clientX", "clientY"]) doi(Touch.prototype, k, false);
}
function datZoom(z) {
  if (Math.abs(z - Z) < 1e-4) return;
  if (!daCai) caiZoom();
  Z = z; document.documentElement.style.zoom = z === 1 ? "" : String(z);
  dispatchEvent(new Event("resize"));
}

// máy là điện thoại: trình duyệt di động (Android … Mobile, iPhone) hoặc màn cảm ứng có cạnh ngắn < 600 điểm; máy tính bảng lớn (cạnh ngắn ≥ 600)
// giữ giao diện máy tính như trước (màn ngang thấp ≤ 500 vẫn theo _datMode)
function laDienThoai() {
  const ua = navigator.userAgent || "", nho = Math.min(screen.width, screen.height) < 600;
  return nho && (/iPhone|iPod|Android.+Mobile|Windows Phone|Mobile.+Safari/i.test(ua) || (navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches));
}

export class DienThoai {
  static datZoom(z) { datZoom(z); } // công cụ thử: giả lúc toàn màn hình (tỉ lệ trang 1 + zoom)
  static bat() {
    const q = new URLSearchParams(location.search).get("dt");
    try {
      if (q === "1" || q === "0") localStorage.setItem("vl_dt", q);
      const v = localStorage.getItem("vl_dt");
      return v === "1" || (v !== "0" && laDienThoai());
    } catch { return q === "1" || (q !== "0" && laDienThoai()); }
  }
  // "dt": điện thoại / link ?dt=1 (như trước); "mt": máy tính dùng chuột chưa tắt bằng ?dt=0 — chỉ bật khi cửa sổ dọc hẹp; "": không dựng (đã tắt,
  // máy tính bảng lớn giữ giao diện máy tính như trước)
  static cheDo() {
    if (DienThoai.bat()) return "dt";
    let tat = false; try { tat = localStorage.getItem("vl_dt") === "0"; } catch { /* không đọc được: coi như chưa tắt */ }
    return !tat && matchMedia("(pointer: fine)").matches ? "mt" : "";
  }
  constructor(api) {
    this.api = api; this.mode = ""; this.on = false; this.chat = false; this.sig = {}; this.luoiCao = LUOI_CAO; this.chatTab = "Tất cả"; this.neo = null;
    this.mt = !!api.mt; // máy tính: chỉ giao diện dọc khi cửa sổ hẹp (tick)
    this.thuTu = new Map(); this.soMo = 0; // thứ tự mở của cửa sổ trong bảng dưới (_xepCuaSo)
    try { this.can = this.mt ? localStorage.getItem("vl_dtCan") === "1" : localStorage.getItem("vl_dtCan") !== "0"; this.canKhoa = localStorage.getItem("vl_dtCanKhoa") === "1"; this.canCo = +localStorage.getItem("vl_dtCanCo") || 1; this.co = +localStorage.getItem("vl_dtCo") || CO_MD; const kh = localStorage.getItem("vl_dtKhung"); this.khung = kh == null ? KHUNG_MD : +kh; } catch { this.can = true; this.co = CO_MD; this.khung = KHUNG_MD; this.canCo = 1; }
    if (!KHUNG.includes(this.khung)) this.khung = KHUNG_MD;
    if (!CO.includes(this.co)) this.co = CO_MD;
    this.gon = true; this.hang = false; this.coHien = 1; // vào game: thu gọn (vaoGame); hàng icon màn ngang: thu lại; cỡ đang dùng (_datCo)
    this.oKhoa = true; // ô kỹ năng khóa (chỉ dùng) mỗi lần vào trang (datOKhoa)
    const H = this.H, C = H.M.chat;
    this.kenhDs = Object.keys(C.channels).filter((id) => id !== "CH_SYSTEM");
    const el = (this.el = document.createElement("div"));
    el.id = "dt";
    el.innerHTML = `
<div class="dt-tren">
  <div class="dt-chan" data-a="chan"><b class="dt-cap"></b></div>
  <div class="dt-ten"><span class="dt-tnv"></span><span class="dt-phai"></span></div>
  <div class="dt-h2"><div class="dt-tn dt-hp"><i></i><b></b></div><div class="dt-tn dt-mp"><i></i><b></b></div></div>
  <div class="dt-h3"><div class="dt-tn dt-ex"><i></i><b></b></div><div class="dt-tien">${ic("xu", 16)}<span></span></div></div>
  <div class="dt-nt" data-a="toan" style="right:6px"><i class="dt-toan"></i></div>
</div>
<div class="dt-bd"><span></span><em></em></div>
<div class="dt-mang"><b class="dt-fps"></b><b class="dt-ping"></b><b class="dt-onl"></b><b class="dt-ky" translate="no"></b></div>
<div class="dt-mm" data-a="mm"><canvas></canvas></div>
<div class="dt-tudanh" data-a="tudanh"></div>
<div class="dt-ngua" data-a="ngua">${ic("ngua", 28)}</div>
<div class="dt-bcua" data-a="baucua">${XUC_XAC}<span></span></div>
<div class="dt-kat" data-a="khoaat"></div>
<div class="dt-tmnut" data-a="tumau"><i></i><span>Túi tử mẫu</span></div>
<div class="dt-tin"></div>
<div class="dt-nutt" data-a="chat">${ic("chat", 20)}Chat</div>
<div class="dt-moidoi" data-a="moidoi" style="display:none"><i style="background-image:url('${A}ui/hud/btn/tin_doi.png')"></i><b></b><div class="dt-moip" data-a="moip" style="display:none"></div></div>
<div class="dt-can"><b><i></i></b></div>
<div class="dt-okhoa" data-a="okhoa">${KHOA_SVG}</div>
<div class="dt-noi" data-a="noi"><i></i><span><b></b><em></em></span></div>
<div class="dt-sap" data-a="sap"><i style="background-image:url('${A}ui/hud/cursor/8.png')"></i><span><b>Xem sạp</b><em></em></span></div>
<div class="dt-nhat" data-a="nhat"><i style="background-image:url('${A}ui/hud/cursor/3.png')"></i><span><b></b><em></em></span></div>
<div class="dt-mo" data-a="hang"><i></i></div>
<div class="dt-bdl"><div class="dt-bdl-dau"><span></span><em></em><b data-a="bdl">✕</b></div><div class="dt-bdl-cv"><canvas></canvas></div></div>
<div class="dt-bang">
  <div class="dt-dau"><span class="dt-bien"></span><span class="dt-nutda" data-a="gon"></span></div>
  <div class="dt-luoi">${LUOI.map(([t, k], i) => `<div class="dt-o" data-a="l${i}"><div class="dt-khung">${ic(k, 36)}<b class="dt-so"></b></div><span>${t}</span></div>`).join("")}</div>
  <div class="dt-viec"></div>
</div>
<div class="dt-chatp">
  <div class="dt-ctab">${C.tabs.list.map((t, i) => `<span data-a="kt${i}">${esc(t.label)}</span>`).join("")}</div>
  <div class="dt-ghim" style="display:none"></div>
  <div class="dt-clist"></div>
  <div class="dt-cin"><span class="dt-ckenh" data-a="kenh"></span><input class="dt-cgo" maxlength="${H.M.input.max || 80}" spellcheck="false" autocomplete="off" enterkeyhint="send" placeholder="Nói gì đó…"><span class="dt-cbtn bieucam" data-a="bieucam"></span><span class="dt-cbtn gui" data-a="gui"></span></div>
  <div class="dt-cmenu">${this.kenhDs.map((id, i) => { const c = C.channels[id]; return `<div data-a="kn${i}" style="color:${rgb(c.color)}">${c.menuImg ? `<i style="background-image:url('${A}ui/hud/${c.menuImg.file}')"></i>` : ""}${esc(c.menu)}</div>`; }).join("")}</div>
</div>
<div class="dt-tab">${THE.map(([t, k], i) => `<div data-a="t${i}"><div class="dt-tic">${ic(k, 30)}<b class="dt-so"></b></div><span>${t}</span></div>`).join("")}</div>`;
    document.body.appendChild(el);
    // hàng nút việc làm của món: lớp riêng trên cửa sổ client (#jxwin) và ô xem món
    const hd = (this.hanhEl = document.createElement("div"));
    hd.id = "dt-hanh";
    hd.addEventListener("click", (e) => this._bam(e));
    document.body.appendChild(hd);
    // khung vàng chỗ món đang kéo sẽ nằm (_oDich)
    const dc = (this.dichEl = document.createElement("div"));
    dc.id = "dt-dich";
    document.body.appendChild(dc);
    this.mmCv = el.querySelector(".dt-mm canvas");
    el.addEventListener("click", (e) => this._bam(e));
    el.querySelector(".dt-cgo").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); this._gui(); } });
    if (!document.fullscreenEnabled) el.querySelector('[data-a="toan"]').style.display = "none"; // iPhone: trình duyệt không cho toàn màn hình
    // ô dùng nhanh / ô kỹ năng của thanh dưới máy tính: giữ nguyên phần tử (hud.js vẫn vẽ icon, số bình, hồi chiêu), chỉ đặt chỗ mới (game.css .dt-o)
    for (const [sel, chu, , hang] of O_NHANH) {
      const o = H.bot.querySelector(sel); if (!o) continue;
      o.classList.add("dt-o"); o.dataset.dt = chu; o.dataset.hang = hang;
    }
    // nút thừa (đã có Đóng ✕ của bảng dưới): Trở lại của bảng Hệ thống (anh 29/10 "các nút đừng dư thừa")
    const tl = this.api.P.win.get("system").node("ContiumeGame"); if (tl) tl.classList.add("dt-thua");
    // câu cảnh báo (thiếu nội lực, sai vũ khí, đang cưỡi ngựa…) ghi vào ô tin hệ thống của khung chat máy tính (đã ẩn) -> hiện thêm ở dòng tin
    // trên cảnh, chữ đỏ, 6 giây
    const canh = H.canh.bind(H);
    H.canh = (t) => { canh(t); this.canhLuc = [String(t), performance.now()]; };
    // không cho trình duyệt phóng to khi chạm ô gõ chữ (iPhone tự phóng chữ dưới 16 px); cỡ giao diện đặt khi bật (_apDung)
    this.vp = document.querySelector('meta[name="viewport"]'); this._datCo(1);
    this._cham();
    this._chongPhong();
    this._ngam();
    document.addEventListener("fullscreenchange", () => this._zoomToan());
    if (window.visualViewport) visualViewport.addEventListener("resize", () => this._zoomToan());
    document.body.classList.toggle("dt-cankhoa", !!this.canKhoa);
    document.body.style.setProperty("--dt-cc", this.canCo);
    this._cuaCan();
    this._cuaBdl();
    this.tick();
  }

  // ---------- việc của nút ----------
  get H() { return this.api.P.hud; }
  nut(k) { this.H.cb.onButton(k, this.H.toggles[k]); }
  // mở cửa sổ của nút k (đóng cửa sổ khác trước — màn dọc chỉ đủ chỗ cho 1 bảng)
  mo(k) { const GW = this.api.GW(); if (GW) GW.closeAll(); this.nut(k); }
  // nút bật / tắt của thanh dưới máy tính (Ngồi, Ngựa)
  bat(k) { const on = !this.H.toggles[k]; this.H.setToggle(k, on); this.H.cb.onButton(k, on); }
  banDo() { this._moBdl(!this.bdlMo); }
  // cần điều khiển bật / tắt (Trợ Thủ → Khác) — nhớ ở máy này
  datCan(on) { this.can = !!on; try { localStorage.setItem("vl_dtCan", on ? "1" : "0"); } catch {} this.tick(); }
  // biểu tượng Bầu Cua (anh 10/11 lần 3 "icon đặt mọi nơi" — main.js nhịp "bcua"): thanh dưới nút Tự đánh, hiện quanh giờ mở, chữ đếm ngược ngắn
  setBauCua(s) {
    const e = this.el && this.el.querySelector(".dt-bcua"); if (!e) return;
    e.classList.toggle("hien", !!s); e.classList.toggle("dat", !!s && s.p === "dat");
    const chu = bauCuaChu(s, true), sp = e.lastElementChild; if (sp.textContent !== chu) sp.textContent = chu;
  }
  // ổ khóa an toàn (anh 10/11 — main.js KAT onDoi): hình client khóa / mở; chưa đặt mật khẩu cấp 2: hình mở + chấm đỏ nhắc
  setKhoaAnToan(tt) {
    const e = this.el && this.el.querySelector(".dt-kat"); if (!e || !tt) return;
    const dong = !!(tt.co && !tt.mo);
    e.classList.toggle("dong", dong); e.classList.toggle("chua", !tt.co);
    const o = this.el.querySelector(`[data-a="l${LUOI.length - 1}"] .dt-so`); if (o) { o.textContent = tt.co ? "" : "!"; o.style.display = tt.co ? "none" : "block"; }
  }
  // khóa cần (anh 31/10 "thêm cài đặt khóa hoặc không khóa cái joystick"): khóa = vòng đứng yên giữa vùng cần; không khóa = chạm đâu trong vùng
  // cần thì vòng hiện ở đó (_cuaCan)
  datCanKhoa(on) { this.canKhoa = !!on; try { localStorage.setItem("vl_dtCanKhoa", on ? "1" : "0"); } catch {} document.body.classList.toggle("dt-cankhoa", this.canKhoa); }
  // cỡ cần (anh 01/11 "cho phép phóng to thu nhỏ joystick trong cài đặt Trợ Thủ"): hệ số vòng + núm + tầm kéo (game.css --dt-cc, _cuaCan) — nhớ ở máy này
  datCanCo(v) { this.canCo = v; try { localStorage.setItem("vl_dtCanCo", String(v)); } catch {} document.body.style.setProperty("--dt-cc", v); }
  // khóa ô kỹ năng (anh 31/10 lần 2: "thêm 1 ô khóa hoặc chuyển đổi để thay đổi trạng thái gắn skill và trạng thái dùng skill hoặc vật phẩm, nếu
  // không sẽ bị rối thao tác"): khóa (mặc định mỗi lần vào trang) = chỉ dùng — chạm ô: dùng chiêu / thuốc (ô T / P: ra chiêu tay đó), kéo chiêu:
  // ngắm (_ngam), giữ: không mở bảng; mở khóa (body.dt-osua — ô viền vàng đứt) = chỉ gắn — chạm ô: bảng chọn chiêu / thuốc, kéo ô: đổi chỗ / gỡ
  // (main.js quickClick / skillPick / quickMenu / quickDown đọc oKhoa)
  datOKhoa(on, bao) {
    this.oKhoa = !!on; document.body.classList.toggle("dt-osua", !this.oKhoa);
    if (this._boNgam) this._boNgam();
    const pk = document.querySelector(".jx-skpick"), G = this.api.GW(); if (pk) pk.remove(); if (G) G._hideSkTip();
    if (bao) this.H.msg(this.oKhoa ? "Khóa ô kỹ năng: chạm ô để dùng chiêu / thuốc, kéo chiêu để ngắm" : "Mở khóa ô kỹ năng: chạm ô để gắn chiêu / thuốc, kéo ô để đổi chỗ / gỡ — xong chạm nút khóa");
  }
  nhacKhoa() { this.H.msg("Ô kỹ năng đang khóa (chỉ dùng) — chạm nút khóa cạnh ô để gắn chiêu / thuốc"); }
  // cỡ giao diện (Trợ Thủ → Khác — anh 30/10 "giao diện nhỏ hơn như kiểu zoom, bé hơn 10–20%") — nhớ ở máy này
  datCo(s) { if (!CO.includes(s)) return; this.co = s; try { localStorage.setItem("vl_dtCo", String(s)); } catch {} if (this.on && !this.mt) this._datCo(s); }
  // khung hình tối đa / giây lúc chơi trên điện thoại (main.js loop — anh 30/10 lần 2 "hao pin, nóng máy"): nhớ ở máy
  datKhung(v) { if (!KHUNG.includes(v)) return; this.khung = v; try { localStorage.setItem("vl_dtKhung", String(v)); } catch {} }
  // thu cả trang bằng initial-scale của viewport: trang giãn bề ngang theo tỉ lệ (dọc 372 -> 437 điểm ở 0,85), mọi thứ — nút, cửa sổ, cảnh — nhỏ
  // đều; khóa phóng bằng tay (min = max)
  _datCo(s) {
    this.coHien = s;
    const c = `width=device-width, initial-scale=${s}, minimum-scale=${s}, maximum-scale=${s}, viewport-fit=cover`;
    if (this.vp && this.vp.content !== c) this.vp.content = c;
    this._zoomToan();
  }
  // đang toàn màn hình: Chromium ép tỉ lệ trang = 1 (visualViewport.scale 1 — lúc thường = cỡ) -> html zoom = cỡ / tỉ lệ trang (datZoom) cho giao
  // diện giữ nguyên cỡ; trình duyệt nào vẫn giữ tỉ lệ thì ra 1 (không thu 2 lần). Thoát / giao diện máy tính: 1. Gọi lại khi tỉ lệ trang đổi (vv resize)
  _zoomToan() {
    const vv = window.visualViewport, z = this.on && document.fullscreenElement && vv ? Math.min(1, Math.max(0.5, this.coHien / vv.scale)) : 1;
    datZoom(Math.round(z * 1000) / 1000);
  }
  // vào game (main.js vaoGame): thu gọn — dọc: bảng Giang hồ, ngang: hàng icon (anh 30/10 "vào game mặc định thu gọn, người chơi cần thì mở")
  vaoGame() { this.gon = true; this.chat = false; this.gh = false; this.hang = false; this._moBdl(false); this.tick(); }
  _bam(e) {
    const a = e.target.closest("[data-a]"); if (!a) return;
    const k = a.dataset.a, GW = this.api.GW(), P = this.api.P, so = /^([a-z]+?)(\d+)$/.exec(k);
    if (so) return this._bamSo(so[1], +so[2]);
    if (k === "hang") { P.audio.ui("click"); this.hang = !this.hang; return this.tick(); } // màn ngang: hàng icon Mở rộng / Thu gọn
    if (k === "toan") { P.audio.ui("click"); return document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); }
    if (k === "tudanh") return this.api.toggleAuto();
    if (k === "ngua") { P.audio.ui("click"); return this.bat("Horse"); } // lên / xuống ngựa (main.js toggleHorse — như ô Lên ngựa của bảng Giang hồ)
    if (k === "baucua") { P.audio.ui("click"); return this.nut("BauCua"); } // biểu tượng Bầu Cua: bàn cược (anh 10/11 lần 3 "icon đặt mọi nơi")
    if (k === "khoaat") { P.audio.ui("click"); return this.nut("KhoaAnToan"); } // ổ khóa an toàn (anh 10/11 — mật khẩu cấp 2): dọc dưới nút Tự đánh, ngang cạnh nút Mở rộng
    if (k === "tumau") return this._moTuMau();
    if (k === "okhoa") { P.audio.ui("click"); return this.datOKhoa(!this.oKhoa, true); }
    if (k === "chat") { P.audio.ui("click"); this.chat = !this.chat; return this.tick(); }
    // lời mời tổ đội (anh 06/11 chiều "đừng mở hẳn 1 pop up … cũng cần làm trên mobile nữa nhé, cho đồng bộ" — hud.js moiDoi): chạm biểu tượng ->
    // hiện / ẩn bảng dòng lời mời cạnh biểu tượng (_game); chạm nút Đồng ý / Cự tuyệt / Xem nhẹ của dòng -> trả lời (hud.moiChon); chạm chữ: không gì
    if (k === "moidoi") { P.audio.ui("click"); return this.H.moiIcon(); }
    if (k === "moiv") return this.H.moiChon(+a.dataset.id, a.dataset.v);
    if (k === "moip") return;
    if (k === "mm") return this._moBdl(true); // chạm bản đồ nhỏ: bản đồ lớn (không chạy tới chỗ chạm nữa — anh 30/10)
    if (k === "bdl") return this._moBdl(false);
    // chạm chân dung thanh trên: khung chọn chân dung (anh 29/10), chạm lần nữa: đóng
    if (k === "chan") { P.audio.ui("click"); const w = P.win.get("portrait"); if (w.visible) return w.hide(); if (GW) GW.closeAll(); return w.show(); }
    if (k === "gon") {
      P.audio.ui("click");
      if (this.ngang) { if (GW) GW.closeAll(); this.chat = false; this.gh = false; return this.tick(); } // màn ngang: Đóng ✕ = về cảnh
      if (this.mode === "cs") return GW && GW.closeAll();
      if (this.mode === "chat") { this.chat = false; return this.tick(); }
      this.gon = !this.gon;
      return this.tick();
    }
    if (k === "kenh") { P.audio.ui("click"); return this.el.querySelector(".dt-chatp").classList.toggle("mo"); }
    if (k === "ghimAn") { P.audio.ui("click"); this.H.anGhim(!!this.sig.ghimBh); return this.tick(); } // × dòng ghim của quản trị / công cáo bang (thẻ Bang hội — anh 14/11)
    if (k === "gui") return this._gui();
    // biểu cảm (bieucam.js — anh 31/10): bảng chọn trên nút, mã vào ô gõ của khung chat điện thoại (không mở bàn phím)
    if (k === "bieucam") { const a = this.el.querySelector(".dt-cgo"); BieuCam.mo(this.el.querySelector(".dt-cbtn.bieucam"), (ma) => BieuCam.chen(a, ma)); return; }
    if (k === "hx") { P.audio.ui("click"); if (GW) GW._hideTip(); return; }
    if (k === "bo") { P.audio.ui("click"); if (GW) GW.drop(); return; }
    if (k === "noi") return this._noi();
    if (k === "sap") return this._sap();
    if (k === "nhat") return this._nhat();
    if (k[0] === "v") return this._viec(k.slice(1));
  }
  // nút có số: l = bảng Giang hồ, t = thẻ dưới, kt = thẻ lọc chat, kn = kênh nói, h = việc làm của món
  _bamSo(k, i) {
    const GW = this.api.GW(), P = this.api.P;
    if (k === "l") { P.audio.ui("click"); return LUOI[i][2](this); }
    if (k === "h") return this._lam(i);
    if (k === "kt") { P.audio.ui("click"); this.chatTab = this.H.M.chat.tabs.list[i].label; this.sig.chat = null; this.sig.chatCuoi = true; return; }
    if (k === "kn") { P.audio.ui("click"); this.H._setChannel(this.kenhDs[i]); this.el.querySelector(".dt-chatp").classList.remove("mo"); return; }
    if (k !== "t") return;
    const nut = THE[i][3];
    // màn ngang: Giang hồ = trang Giang hồ (đang mở thì về cảnh)
    if (!i && this.ngang) { P.audio.ui("click"); this.gh = this.mode !== "luoi"; this.chat = false; if (GW) GW.closeAll(); return this.tick(); }
    if (!i) { P.audio.ui("click"); if (this.mode === "cs" || this.mode === "chat") { if (GW) GW.closeAll(); this.chat = false; this.gon = false; } else this.gon = !this.gon; return this.tick(); }
    // chạm thẻ đang mở: đóng; thẻ khác: đổi sang (màn ngang — Trang bị nằm trong trang Hành trang: chạm Nhân vật lúc đó là đổi trang, không đóng)
    const TT = this.api.TT();
    if (this.mode === "cs" && this.sig.the === i) { P.audio.ui("click"); return GW && GW.closeAll(); }
    if (GW) GW.closeAll();
    this.gh = false;
    // Hành trang: màn ngang = Trang bị + Túi tử mẫu + Hành trang cạnh nhau (mẫu 2 — kéo đồ thẳng vào ô trang bị; mở Túi tử mẫu trước -> bên trái như máy
    // tính); màn dọc chỉ Hành trang (anh 03/11 lượt 18 — bản 30/10 mẫu A mở cả Túi tử mẫu), Túi tử mẫu mở bằng nút ở lề trái (_moTuMau)
    if (i === 3 && this.ngang) { const s = P.win.get("status"); s.show(); s.it.BtnEquipPage.fn(); }
    const tm = i === 3 && this.ngang && P.win.get("tumau"); if (tm) { tm.show(); if (GW) GW.refresh(true); }
    this.theMo = i; // thẻ đang mở trang (_dau — chạm cửa sổ khác trong trang không đổi thẻ sáng)
    if (nut) return this.nut(nut);
    P.audio.ui("click"); if (TT) TT.open();
  }
  // nút Túi tử mẫu (màn dọc, đang mở Hành trang — _xepCuaSo đặt chỗ): mở túi tử mẫu bên trái túi đồ (thứ tự mở nhỏ hơn túi đồ), mở rồi thì đóng bằng nút
  // Đóng của nó (nút này ẩn)
  _moTuMau() {
    const P = this.api.P, GW = this.api.GW(), tm = P.win.get("tumau"), it = P.win.get("items");
    if (!tm || !GW) return;
    if (tm.visible) { P.audio.ui("click"); return tm.hide(); }
    GW.toggleTuMau();
    const ti = this.thuTu.get(it); if (ti != null) this.thuTu.set(tm, ti - 0.5);
    this.tick();
  }
  _viec(k) {
    const P = this.api.P, GW = this.api.GW();
    P.audio.ui("click");
    if (k === "kn") return this.mo("Skills");
    if (k === "tn") { this.mo("Status"); return; }
    if (k === "tin" && GW) return GW.openTin();
    if (k === "nt") return this.nut("NhanThuong"); // khung chọn phần thưởng (main.js nhanThuong)
  }
  // ---------- bản đồ lớn (anh 30/10: "bản đồ đang thu nhỏ thì không bấm chọn điểm cho nhân vật tự chạy được — thay vào đó phóng to bản đồ, kéo
  // bản đồ nếu bản đồ đó là đầy đủ, rồi bấm vị trí thì nhân vật chạy tới") ----------
  // Chạm bản đồ nhỏ -> khung bản đồ lớn (dọc: cả bề ngang, từ dưới thanh trên tới trên dải thẻ; ngang: khung to giữa màn). Vẽ từ ảnh bản đồ nhỏ của
  // bãi (hud.js mmImg — như drawMinimap: quái đỏ, trùm cam, người chơi khác xanh, mình trắng, đường đang đi). Bản đồ bãi luyện công (ảnh 224 × 224)
  // phóng vừa khung, không kéo; bản đồ đầy đủ (Ba Lăng 1056 × 640, Phong Lăng Độ 1216 × 896…) to hơn khung -> giữ 1 : 1, kéo bằng ngón (không
  // quá mép ảnh); mở ra thì nhân vật ở giữa. Chạm (không kéo quá 10 điểm) = chạy tới chỗ đó + cờ đích; khung còn mở tới khi bấm ✕.
  _moBdl(on) {
    if (!!on === !!this.bdlMo) return;
    this.bdlMo = !!on; this.api.P.audio.ui("click");
    this.el.querySelector(".dt-bdl").classList.toggle("mo", this.bdlMo);
    document.body.classList.toggle("dt-bdlmo", this.bdlMo);
    this.bdl = this.bdlMo ? { im: undefined, luc: 0 } : null;
    if (this.bdlMo) this._veBdl(true);
  }
  _cuaBdl() {
    const cv = (this.bdlCv = this.el.querySelector(".dt-bdl canvas"));
    let c = null;
    cv.addEventListener("pointerdown", (e) => {
      const B = this.bdl; if (!B || c) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch {}
      c = { id: e.pointerId, x0: e.clientX, y0: e.clientY, vx: B.vx, vy: B.vy, keo: false };
    });
    cv.addEventListener("pointermove", (e) => {
      const B = this.bdl; if (!c || e.pointerId !== c.id || !B) return;
      const dx = e.clientX - c.x0, dy = e.clientY - c.y0;
      if (!c.keo && Math.hypot(dx, dy) > 10) c.keo = true;
      if (c.keo && B.keo) { B.vx = c.vx - dx / B.k; B.vy = c.vy - dy / B.k; this._veBdl(true); }
    });
    const tha = (e) => {
      if (!c || e.pointerId !== c.id) return;
      const B = this.bdl, keo = c.keo; c = null;
      if (!B || keo || e.type !== "pointerup" || !B.k) return;
      const r = cv.getBoundingClientRect(), H = this.H, s = H.M.minimap.scale;
      const px = B.vx + (e.clientX - r.left) / B.k, py = B.vy + (e.clientY - r.top) / B.k;
      if (px < 0 || py < 0 || px > B.iw || py > B.ih || !H.cb.onMapClick) return;
      H.cb.onMapClick(px / s, py / s);
      B.dich = [px / s, py / s]; this.api.P.audio.ui("click"); this._veBdl(true);
    };
    for (const t of ["pointerup", "pointercancel"]) cv.addEventListener(t, tha);
  }
  // vẽ bản đồ lớn (mỗi khung tối đa ~12 lần / giây; luon: vẽ ngay — đang kéo / vừa chạm)
  _veBdl(luon) {
    const B = this.bdl, w = this.api.world(), H = this.H; if (!B || !w) return;
    const t = performance.now(); if (!luon && t - B.luc < 80) return; B.luc = t;
    const cv = this.bdlCv, hop = cv.parentElement, W = hop.clientWidth, Hh = hop.clientHeight; if (!W || !Hh) return;
    const im = H.mmImg, MM = H.M.minimap, s = MM.scale, p = w.player;
    // ảnh mới (vừa mở / đổi bãi / ảnh vừa tải xong) hoặc khung đổi cỡ: tính lại tỉ lệ, nhân vật ở giữa
    if (B.im !== im || B.W !== W || B.H !== Hh) {
      const mw = H.mmMap && H.mmMap.w ? Math.round(H.mmMap.w * s) : 0, mh = H.mmMap && H.mmMap.h ? Math.round(H.mmMap.h * s) : 0, iw = mw || (im ? im.width : W), ih = mh || (im ? im.height : Hh), vua = Math.min(W / iw, Hh / ih);
      Object.assign(B, { im, W, H: Hh, iw, ih, k: vua >= 1 ? vua : 1, keo: vua < 1 });
      B.vx = p.x * s - W / B.k / 2; B.vy = p.y * s - Hh / B.k / 2;
    }
    const vw = W / B.k, vh = Hh / B.k;
    B.vx = B.iw > vw ? Math.max(0, Math.min(B.iw - vw, B.vx)) : (B.iw - vw) / 2;
    B.vy = B.ih > vh ? Math.max(0, Math.min(B.ih - vh, B.vy)) : (B.ih - vh) / 2;
    const dpr = Math.min(2, devicePixelRatio || 1), cw = Math.round(W * dpr), ch = Math.round(Hh * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    const g = cv.getContext("2d"), k = B.k * dpr, X = (x) => (x * s - B.vx) * k, Y = (y) => (y * s - B.vy) * k;
    g.fillStyle = "#000"; g.fillRect(0, 0, cw, ch);
    if (im) { g.imageSmoothingEnabled = true; g.drawImage(im, -B.vx * k, -B.vy * k, B.iw * k, B.ih * k); }
    if (p.path && p.path.length) {
      g.strokeStyle = rgb(MM.line); g.lineWidth = dpr; g.beginPath(); g.moveTo(X(p.x), Y(p.y));
      for (const [x, y] of p.path) g.lineTo(X(x), Y(y));
      g.stroke();
    }
    const cham = (x, y, r, mau) => { const a = Math.round(X(x)), b = Math.round(Y(y)); g.fillStyle = "#000"; g.fillRect(a - r - dpr, b - r - dpr, 2 * (r + dpr), 2 * (r + dpr)); g.fillStyle = mau; g.fillRect(a - r, b - r, 2 * r, 2 * r); };
    for (const m of w.mobs) if (m.alive) { const r = (m.boss || m.sat ? 2 : 1) * dpr; g.fillStyle = m.boss || m.sat ? "#ffb000" : "#ff3030"; g.fillRect(Math.round(X(m.x) - r), Math.round(Y(m.y) - r), 2 * r, 2 * r); }
    for (const o of w.others.values()) cham(o.x, o.y, 2 * dpr, "#4fc3ff");
    // chi danh dau cham xanh + nhan Loi ra cho 37 bai luyen cong (bo cham xanh du o Dich tram / Xa phu / Thuyen phu goc)
    for (const n of w.npcs || []) {
      if (!n.baiRa) continue;
      const ax = Math.round(X(n.x)), ay = Math.round(Y(n.y)), r = 3.5 * dpr;
      cham(n.x, n.y, r, "#4ade80");
      const lb = "Lối ra";
      g.font = `${Math.round(11 * dpr)}px "VK Sans Serif 12", "IBM Plex Mono", monospace`;
      g.textAlign = "center"; g.textBaseline = "bottom";
      g.fillStyle = "#000"; for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) g.fillText(lb, ax + dx * dpr, ay - r - 3 * dpr + dy * dpr);
      g.fillStyle = "#bbf7d0"; g.fillText(lb, ax, ay - r - 3 * dpr);
    }
    // cờ đích: vòng vàng ở chỗ vừa chạm — tới nơi thì bỏ
    if (B.dich && Math.hypot(p.x - B.dich[0], (p.y - B.dich[1]) * 2) < 40) B.dich = null;
    if (B.dich) {
      const a = X(B.dich[0]), b = Y(B.dich[1]), r = 6 * dpr;
      g.lineWidth = 2 * dpr; g.strokeStyle = "#000"; g.beginPath(); g.arc(a, b, r + dpr, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#ffe48a"; g.beginPath(); g.arc(a, b, r, 0, Math.PI * 2); g.stroke();
    }
    cham(p.x, p.y, 2.5 * dpr, "#ffffff");
    this._chu(".dt-bdl-dau span", H.mm.querySelector(".jx-mm-name").textContent);
    this._chu(".dt-bdl-dau em", H.mm.querySelector(".jx-mm-pos").textContent);
  }
  // gửi chat: chữ qua ô gõ của thanh dưới máy tính rồi hud.send (giới hạn gửi của kênh như client — gửi quá nhanh thì giữ lại chữ)
  _gui() {
    const H = this.H, a = this.el.querySelector(".dt-cgo"), b = H.bot.querySelector(".jx-input");
    if (!a.value.trim()) return;
    b.value = a.value; H.send(); a.value = b.value; b.value = "";
    this.sig.chat = null; this.sig.chatCuoi = true;
  }
  // việc làm i của món đang xem: sự kiện chuột vào đúng món đã chạm (món vẽ lại thì lấy phần tử ở chỗ đã chạm)
  _lam(i) {
    const h = this.hd && this.hd[i], m = this.mon, G = this.api.GW(); if (!h || !m || !G) return;
    const el = m.el.isConnected ? m.el : document.elementFromPoint(m.x, m.y); if (!el) return;
    const o = { bubbles: true, cancelable: true, view: window, clientX: m.x, clientY: m.y, ...h.mod };
    G._hideTip(); this.mon = null;
    if (h.loai === "contextmenu") return void el.dispatchEvent(new MouseEvent("contextmenu", { ...o, button: 2, buttons: 2 }));
    el.dispatchEvent(new MouseEvent("mousedown", { ...o, button: 0, buttons: 1 })); el.dispatchEvent(new MouseEvent("mouseup", { ...o, button: 0 })); el.dispatchEvent(new MouseEvent("click", { ...o, button: 0 }));
    // Vứt: bấm món như trên = cầm lên tay, rồi main.js throwHeld hỏi lại (Hủy bỏ: món về chỗ cũ); lúc hỏi không hiện hàng "Chạm ô muốn đặt"
    if (h.loai === "vut" && G.holding) { this.vutDang = true; Promise.resolve(this.api.vut()).finally(() => { this.vutDang = false; }); }
  }
  // phần tử el nằm trong lưới túi Hành trang (món vứt được — main.js throwHeld chỉ nhận món lấy từ túi)
  _laTui(el) { const w = this.api.P.win.get("items"), b = w && w.node("ItemBox"); return !!(b && el && el.isConnected && b.contains(el)); }
  // nút Nói chuyện (anh 30/10: "thêm nút nói chuyện với NPC, bỏ chạm là đối thoại trên mobile — dễ loạn"): đi tới NPC / Rương chứa đồ gần
  // nhất rồi nói chuyện như bấm NPC ở máy tính (World.clickNpc). Chạm NPC trên cảnh = chạm đất (main.js mouseAct)
  _noi() {
    const w = this.api.world(), n = this.npcNoi; if (!w || !n) return;
    this.api.P.audio.ui("click"); w.clickNpc(n);
  }
  // NPC (bỏ cọc gỗ / bao cát, sạp trông hộ — nút Xem sạp riêng: anh 10/11 "sạp đè lên NPC Dã Tẩu, tách nút nói chuyện và vào sạp") hoặc vật bản đồ gần nhân vật nhất trong NOI_R
  _npcGan(w) {
    const p = w.player; let best = null, bd = NOI_R;
    for (const n of w.npcs) { if (n.role === "dummy" || n.sap) continue; const d = Math.hypot(n.x - p.x, (n.y - p.y) * 2); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  // nút Xem sạp: sạp gần nhất trong NOI_R, trừ sạp của mình — NPC trông sạp (đứng chỗ đã dạt khỏi NPC thật) hoặc chủ sạp đang ngồi (World.sapDs — main.js sapTick)
  _sap() {
    const s = this.sapNoi, G = this.api.GW(); if (!s || !G) return;
    this.api.P.audio.ui("click"); G.cho.xemSap(s.k);
  }
  _sapGan(w) {
    const p = w.player, me = (this.api.hero() || {}).name; let best = null, bd = NOI_R;
    for (const s of w.sapDs || []) {
      if (s.ten === me) continue;
      const n = w.npcs.find((q) => q.sap === s.k), x = n ? n.x : s.x, y = n ? n.y : s.y, d = Math.hypot(x - p.x, (y - p.y) * 2);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  _nutSap(w, mode) {
    const s = (mode === "gon" || (mode === "luoi" && !this.ngang)) && w.player.hp > 0 ? this._sapGan(w) : null;
    if (this.sig.sap === s) return;
    this.sig.sap = this.sapNoi = s;
    const b = this.el.querySelector(".dt-sap");
    b.style.display = s ? "flex" : "none";
    document.body.classList.toggle("dt-sap-co", !!s); // nút Nhặt lên trên nút này
    if (s) b.querySelector("em").textContent = "Sạp của " + s.ten;
  }
  _nutNoi(w, mode) {
    const n = (mode === "gon" || (mode === "luoi" && !this.ngang)) && w.player.hp > 0 ? this._npcGan(w) : null;
    if (this.sig.noi === n) return;
    this.sig.noi = this.npcNoi = n;
    const b = this.el.querySelector(".dt-noi");
    b.style.display = n ? "flex" : "none";
    document.body.classList.toggle("dt-noi-co", !!n); // nút Nhặt lên trên nút này
    if (!n) return;
    b.firstChild.style.backgroundImage = `url('${A}ui/hud/cursor/${n.obj ? 8 : 2}.png')`; // hình con trỏ client: nói chuyện NPC / xem vật
    b.querySelector("b").textContent = n.viec === "ruong" || n.rtb ? "Mở rương" : n.mc && n.mc.cay ? "Thu thập" : n.dnHop ? "Nhận đạo cụ" : n.obj ? "Xem" : "Nói chuyện"; // n.rtb: Rương Thần Bí (main.js ruongDat); n.mc.cay: cây thu thập Võ Lâm Minh Chủ; n.dnHop: hộp Đạo cụ hỗ trợ đường đua (duangua.js)
    b.querySelector("em").textContent = n.name || "";
  }
  // nút Nhặt (anh 30/10: "trên mobile thiếu nút nhặt đồ, đang bấm vào là nó nhặt — làm nút nhặt đồ để khỏi nhặt nhầm"): đi tới vật trên đất gần
  // nhất rồi nhặt như bấm vật ở máy tính (World.clickDrop). Chạm vật trên cảnh = chạm đất (main.js mouseAct)
  _nhat() {
    const w = this.api.world(), d = this.vatNhat; if (!w || !d || d.picked) return;
    this.api.P.audio.ui("click"); w.clickDrop(d);
  }
  // vật trên đất gần nhân vật nhất trong NHAT_R (vật vừa nhặt hỏng — túi đầy / không tới được — xếp sau) + số vật trong tầm
  _vatGan(w) {
    const p = w.player; let best = null, bd = Infinity, n = 0;
    for (const d of w.drops) {
      if (d.picked) continue;
      const k = Math.hypot(d.x - p.x, (d.y - p.y) * 2); if (k >= NHAT_R) continue;
      n++;
      const s = k + (d.skip ? NHAT_R : 0); if (s < bd) { bd = s; best = d; }
    }
    return best ? { d: best, n } : null;
  }
  // hiện khi có vật trong tầm: "Nhặt (số vật)" + tên vật sẽ nhặt (màu như tên trên đất)
  _nutNhat(w, mode) {
    const v = (mode === "gon" || (mode === "luoi" && !this.ngang)) && w.player.hp > 0 ? this._vatGan(w) : null, d = v && v.d, n = v ? v.n : 0;
    if (this.sig.nhat === d && this.sig.nhatN === n) return;
    this.sig.nhat = this.vatNhat = d; this.sig.nhatN = n;
    const b = this.el.querySelector(".dt-nhat");
    b.style.display = d ? "flex" : "none"; if (!d) return;
    b.querySelector("b").textContent = n > 1 ? `Nhặt (${n})` : "Nhặt";
    const em = b.querySelector("em");
    em.textContent = d.name + (d.dong ? ` (${d.dong} dòng)` : ""); em.style.color = d.color || "";
  }

  // ---------- mỗi khung ----------
  // chỗ nhân vật (điểm màn hình từ đỉnh): như nhau ở mọi bảng — bảng đè lên cảnh, hình game không đổi (anh 29/10 "bấm Giang hồ thì hình game
  // không đổi", 30/10 "tất cả các tab cũng vậy"): nhân vật đứng ngay trên bảng Giang hồ, đầu + tên không bị che, ~giữa màn hình
  _dayLuoi(H) { return Math.max(TREN + 150, H - TAB - this.luoiCao); }
  _neoMuc(H) {
    const d = this._dayLuoi(H);
    return Math.max((TREN + d) / 2, Math.min((TREN + H - TAB) / 2, d - 80));
  }
  neoY() { return this.on && this.neo != null ? this.neo / innerHeight : 0.55; } // giao diện máy tính: 0.55 như cũ (main.js camTarget)
  tick() {
    const doc = innerHeight > innerWidth, ngang = !this.mt && !doc && innerHeight * this.coHien <= NGANG_CAO; // bề cao thật (cỡ giao diện làm trang cao ra)
    const bat = this.mt ? doc && innerWidth < MT_RONG : doc || ngang;
    if (bat) { if (!this.on || ngang !== this.ngang) this._apDung(true, ngang); } else if (this.on) this._apDung(false, false);
    if (!this.on) return;
    const P = this.api.P, h = this.api.hero(), w = this.api.world();
    // chế độ bảng dưới: cửa sổ đang mở (cs) · khung chat (chat) · bảng Giang hồ (luoi) · thu gọn (gon). Màn ngang: chơi = gon, trang Giang hồ =
    // luoi (chỉ khi chạm thẻ Giang hồ), trang cửa sổ = cs
    const ws = P.win.open(), bang = ws.filter((x) => !GIUA.has(x.key)), H = innerHeight;
    const mode = bang.length ? "cs" : this.chat ? "chat" : this.ngang ? (this.gh ? "luoi" : "gon") : this.gon ? "gon" : "luoi";
    this.day = this.ngang ? H : mode === "cs" || mode === "chat" ? this._dayCs(H) : mode === "luoi" ? this._dayLuoi(H) : H - TAB;
    if (mode !== this.mode) {
      document.body.classList.remove("dt-" + this.mode); document.body.classList.add("dt-" + mode);
      if (mode === "chat") { this.sig.chat = null; this.sig.chatCuoi = true; } else this.el.querySelector(".dt-chatp").classList.remove("mo");
      this.mode = mode;
      this.el.querySelector(".dt-nutda").textContent = this.ngang && mode === "cs" ? "✕" : mode === "cs" || mode === "chat" || this.ngang ? "Đóng ✕" : "Thu gọn ▾";
    }
    // cần: lúc thu gọn và lúc bảng Giang hồ mở (màn thấp — iPhone SE có thanh Safari — chỉ lúc thu gọn: không đủ chỗ cho cần + dòng tin + nút Chat)
    const can = this.can && (mode === "gon" || (!this.ngang && mode === "luoi" && this.day - 346 >= TREN + 30));
    if (this.sig.can !== can) { this.sig.can = can; document.body.classList.toggle("dt-cando", can); if (!can) this._thaCan(); }
    if (this.sig.day !== this.day) {
      this.sig.day = this.day; document.body.style.setProperty("--dt-day", this.day + "px");
      document.body.classList.toggle("dt-thap", !this.ngang && this.day - TREN < 300); // màn thấp (iPhone SE…): bỏ hàng ô trên, khỏi đè nút Tự đánh
    }
    if (this.ngang && this.sig.vongH !== H) { this.sig.vongH = H; this._vong(H); }
    if (!this.ngang && this.sig.oW !== innerWidth) { this.sig.oW = innerWidth; this._xepO(innerWidth); }
    // bề ngang / cao của game (toàn màn hình có zoom: 100vw trong CSS bị thu theo zoom — CSS dùng --vw100 / --vh100)
    if (this.sig.vw100 !== innerWidth || this.sig.vh100 !== H) { this.sig.vw100 = innerWidth; this.sig.vh100 = H; const S = document.body.style; S.setProperty("--vw100", innerWidth + "px"); S.setProperty("--vh100", H + "px"); }
    const hang = this.ngang && this.hang; // màn ngang: hàng icon đang mở rộng
    if (this.sig.hang !== hang) { this.sig.hang = hang; document.body.classList.toggle("dt-hang", hang); }
    // nhân vật trượt dần tới chỗ mới (~0,2 giây — không nhảy: đo lại cao bảng Giang hồ); xoay / đổi cỡ màn hình thì đặt ngay. Màn ngang: như máy tính
    const muc = this.ngang ? H * 0.55 : this._neoMuc(H), t = performance.now();
    this.neo = this.neo == null || this.sig.neoH !== H ? muc : this.neo + (muc - this.neo) * Math.min(1, ((t - this.tNeo) / 1000) * 12);
    this.tNeo = t; this.sig.neoH = H;
    if (this.joyD) this.api.joy(this.joyD);
    if (this.ngamTick) this.ngamTick(); // ngắm chiêu: còn giữ ngón thì đánh tiếp khi rảnh tay
    // bảng Mộc nhân luyện công (mocnhan.js — main.js dựng khi vào game): mặc định thu gọn ở điện thoại dọc (mở ra — nút – — thì che nhân vật)
    if (!this.mn) { this.mn = document.querySelector(".mn"); if (this.mn) this.mn.classList.add("thu"); }
    const tieuDe = mode === "cs" ? bang[0].def.n || "" : mode === "chat" ? "Chat" : "Giang hồ";
    this._chu(".dt-bien", tieuDe === "Đồ dùng" ? "Hành trang" : tieuDe);
    this._xepCuaSo(ws, bang);
    if (mode === "chat") this._xepChat();
    this._hanh();
    if (!h || !w) return;
    this._tren(h);
    this._game(w);
    if (this.bdlMo) this._veBdl();
    this._nutNoi(w, mode);
    this._nutSap(w, mode);
    this._nutNhat(w, mode);
    this._dau(h, ws);
    if (mode === "luoi" && !this.ngang && !this.daDo) this._doLuoi();
  }
  // ô thanh dưới trên cảnh dọc (anh 31/10 lần 3 chọn kiểu B "Hai hàng to" trong ảnh so bố cục): hàng chiêu T P 5 6 to, hàng vật phẩm 1–4 bên dưới
  // tách riêng (hở HO), nút khóa bên trái hàng vật phẩm; màn hẹp thì ô nhỏ lại cho cần còn chỗ. Mỗi ô: --dt-r (cách mép phải), --dt-y (đỉnh ô cách
  // đáy cảnh), --dt-s (cỡ); nút khóa: --dt-okr / --dt-okt; --dt-cum = bề rộng cụm tính từ mép phải (vùng cần dừng trước đó — game.css)
  _xepO(W) {
    const S = W >= 440 ? 56 : W >= 400 ? 52 : 48, I = W >= 400 ? 46 : 44, GS = 6, GI = 8, LE = 8, K = 34, DAY = 14, HO = 16;
    for (const [sel, , cot, hang] of O_NHANH) {
      const o = this.H.bot.querySelector(sel); if (!o) continue;
      const s = hang ? S : I;
      o.style.setProperty("--dt-s", s + "px"); o.style.setProperty("--dt-r", LE + cot * (s + (hang ? GS : GI)) + "px");
      o.style.setProperty("--dt-y", (hang ? DAY + I + HO + S : DAY + I) + "px");
    }
    const vat = 4 * I + 3 * GI, B = document.body.style;
    B.setProperty("--dt-okr", LE + vat + GI + "px"); B.setProperty("--dt-okt", DAY + (I + K) / 2 + "px");
    B.setProperty("--dt-cum", LE + Math.max(4 * S + 3 * GS, vat + GI + K) + "px");
    B.setProperty("--dt-ngr", LE + vat + GI + K + 6 + "px"); B.setProperty("--dt-ngt", DAY + (I + 36) / 2 + "px"); // nút ngựa: trái nút khóa, giữa hàng vật phẩm
  }
  // màn ngang: chỗ các ô của vòng kỹ năng (--ng-r / --ng-b = cách mép phải / mép dưới, --ng-s = cỡ) quanh tâm cách góc phải dưới 62 điểm; vòng
  // ngoài co lại khi màn thấp (thanh trình duyệt) cho khỏi đè tên bãi dưới bản đồ nhỏ
  _vong(H) {
    const R = [0, 88, Math.max(130, Math.min(150, H - 209))];
    const dat = (el, s, vong, g) => {
      if (!el) return;
      const a = (g * Math.PI) / 180, dx = R[vong] * Math.cos(a), dy = R[vong] * Math.sin(a);
      el.style.setProperty("--ng-r", Math.round(62 - dx - s / 2) + "px"); el.style.setProperty("--ng-b", Math.round(62 + dy - s / 2) + "px"); el.style.setProperty("--ng-s", s + "px");
    };
    for (const [sel, s, vong, g] of O_VONG) dat(this.H.bot.querySelector(sel), s, vong, g);
    dat(this.el.querySelector(".dt-ngua"), ...NGUA_VONG);
    dat(this.el.querySelector(".dt-okhoa"), ...OK_VONG);
  }
  // đáy phần cảnh (= đỉnh bảng) khi mở cửa sổ / khung chat: 1 chỗ cho mọi thẻ (anh 30/10 "cố định kích thước các tab, đổi tab không bị lệch
  // lên lệch xuống"): đủ cho Túi tử mẫu + Hành trang rộng hết bề ngang (cảnh còn ít nhất 100), màn cao thì ~1/4 phần giữa (ít nhất 150)
  _dayCs(H) {
    const goc = TREN + Math.max(150, Math.round((H - TREN - TAB) * 0.25));
    return Math.max(TREN + 100, Math.min(goc, H - TAB - 42 - Math.ceil(HT_H * Math.min(1.3, (innerWidth - 8) / HT_W))));
  }
  // cao thật của bảng Giang hồ (đáy dòng Việc cần làm — đã có chữ) khi bảng đang hiện
  _doLuoi() {
    const v = this.el.querySelector(".dt-viec");
    if (v.offsetHeight && v.textContent) { this.luoiCao = v.offsetTop + v.offsetHeight + 8; this.daDo = true; }
  }
  // xoay dọc: giao diện điện thoại dọc; xoay ngang: điện thoại -> màn ngang (body.dt-ngang), màn to -> về giao diện máy tính (bỏ biến đổi đã đặt
  // cho cửa sổ — uiwin.js layout đặt lại). Đổi dọc <-> ngang: đặt lại hết (chế độ, chỗ cửa sổ) theo bố cục mới
  _apDung(on, ngang) {
    const doi = this.on && on;
    this.on = on; this.ngang = !!ngang; this.neo = null;
    document.body.classList.toggle("dt", on);
    document.body.classList.toggle("dt-ngang", this.ngang);
    this._datCo(on && !this.mt ? this.co : 1);
    if (!on || doi) {
      document.body.classList.remove("dt-" + this.mode, "dt-thap", "dt-cando", "dt-hang", "dt-noi-co", "dt-sap-co"); this.mode = ""; this.sig = {}; this._thaCan(); this._thoiKeo(true);
      for (const w of Object.values(this.api.P.win.wins)) { w.el.style.transform = ""; w.el._dtTf = ""; w.el._dtAn = false; w.el.classList.remove("dt-an"); }
      this.hanhEl.style.display = "none"; this.thuTu.clear();
      if (!on) this._moBdl(false); // về giao diện máy tính: đóng bản đồ lớn (dọc <-> ngang: giữ, tự vẽ lại theo khung mới)
    }
    dispatchEvent(new Event("resize"));
  }
  _chu(sel, t) { const e = this.el.querySelector(sel); if (e && e.textContent !== t) e.textContent = t; }
  // cửa sổ trong bảng dưới: 2 cửa sổ trên cùng cạnh nhau theo thứ tự mở (mở trước bên trái — bấm vào cửa sổ đưa nó lên trên cùng mà không
  // đổi bên: bản trước cái trên cùng luôn sang phải -> chạm món là 2 cửa sổ đổi chỗ, kéo món giữa 2 cửa sổ hỏng — thấy khi thử 30/10), co cho
  // vừa (to nhất ×1,3); cửa sổ RIENG một mình (cửa sổ khác ẩn tới khi nó đóng); khung hỏi / hội thoại giữa màn hình
  _xepCuaSo(ws, bang) {
    for (const w of [...bang].reverse()) if (!this.thuTu.has(w)) this.thuTu.set(w, ++this.soMo); // mở cùng lúc: cái dưới (mở trước) trước
    for (const w of this.thuTu.keys()) if (!bang.includes(w)) this.thuTu.delete(w);
    const W = innerWidth, H = innerHeight, dat = (w, x, y, k) => {
      const t = `translate(${Math.round(x)}px,${Math.round(y)}px) scale(${k.toFixed(4)})`;
      if (w.el._dtTf !== t) { w.el._dtTf = t; w.el.style.transform = t; }
    };
    const rieng = bang.length > 0 && RIENG.has(bang[0].key), tmNut = this.el.querySelector(".dt-tmnut");
    let tmHien = false;
    for (const w of Object.values(this.api.P.win.wins)) {
      const an = rieng && w !== bang[0] && bang.includes(w);
      if (!!w.el._dtAn !== an) { w.el._dtAn = an; w.el.classList.toggle("dt-an", an); }
    }
    if (bang.length && this.ngang) {
      // màn ngang — trang chức năng: mọi cửa sổ cạnh nhau theo thứ tự mở (Hành trang: Trang bị · Túi tử mẫu · Hành trang), cao hết màn, giữa
      // khoảng từ cột thẻ tới nút ✕ góc phải
      const L = rieng ? [bang[0]] : bang.slice().sort((a, b) => this.thuTu.get(a) - this.thuTu.get(b)), co = (w) => [w.el.offsetWidth || 1, w.el.offsetHeight || 1];
      const x0 = RAY + 6, x1 = W - 48, tong = L.reduce((t, w) => t + co(w)[0], 0) + (L.length - 1) * 6, cao = Math.max(...L.map((w) => co(w)[1]));
      const k = Math.min(1.3, (x1 - x0) / tong, (H - 8) / cao), y = Math.max(4, (H - cao * k) / 2);
      let x = x0 + (x1 - x0 - tong * k) / 2;
      for (const w of L) { dat(w, x, y, k); x += (co(w)[0] + 6) * k; }
    } else if (bang.length) {
      const y0 = this.day + 38, cao = H - TAB - 4 - y0, hai = rieng ? [bang[0]] : bang.slice(0, 2).sort((a, b) => this.thuTu.get(a) - this.thuTu.get(b)), co = (w) => [w.el.offsetWidth || 1, w.el.offsetHeight || 1];
      const tong = hai.reduce((t, w) => t + co(w)[0], 0) + (hai.length - 1) * 4, k = Math.min(1.3, (W - 8) / tong, cao / Math.max(...hai.map((w) => co(w)[1])));
      let x = (W - tong * k) / 2;
      // chỉ mở Hành trang (túi tử mẫu chưa mở): nút Túi tử mẫu ở lề trái, ngang phần trên túi đồ
      if (!rieng && hai.length === 1 && hai[0].key === "items") { tmHien = true; Object.assign(tmNut.style, { left: Math.max(2, Math.round(x - 54)) + "px", top: Math.round(y0 + 34) + "px" }); }
      for (const w of hai) { dat(w, x, y0, k); x += (co(w)[0] + 4) * k; }
      if (!rieng) for (const w of bang.slice(2)) dat(w, (W - co(w)[0] * k) / 2, y0, k);
    }
    if (tmNut && tmNut.style.display !== (tmHien ? "block" : "none")) tmNut.style.display = tmHien ? "block" : "none";
    for (const w of ws.filter((x) => GIUA.has(x.key))) {
      const cw = w.el.offsetWidth || 1, ch = w.el.offsetHeight || 1;
      if (this.ngang) { const k = Math.min(1.15, (W - 8) / cw, (H - 8) / ch); dat(w, (W - cw * k) / 2, (H - ch * k) / 2, k); continue; } // màn ngang: giữa màn
      const k = Math.min(1.15, (W - 4) / cw, (H - TREN - TAB - 20) / ch);
      dat(w, (W - cw * k) / 2, Math.max(TREN + 6, Math.min(H - TAB - ch * k - 6, (H - ch * k) / 2 - 30)), k);
    }
  }
  // khung chat (anh 29/10: "thiếu nút, bố cục chưa đẹp"): thẻ lọc ở trên, tin ở giữa (vuốt để cuộn), hàng gõ chữ ở đáy — nút kênh nói, ô chữ,
  // biểu cảm, gửi (hình nút của thanh dưới client). Tin vẽ như khung chat máy tính (hud.js chatHtml)
  _xepChat() {
    const H = this.H, M = H.msgs, last = M[M.length - 1];
    if (this.sig.chat !== this.chatTab || this.sig.chatLast !== last || this.sig.chatN !== M.length) {
      const L = this.el.querySelector(".dt-clist"), cuoi = this.sig.chatCuoi || L.scrollHeight - L.scrollTop - L.clientHeight < 8;
      this.sig.chat = this.chatTab; this.sig.chatLast = last; this.sig.chatN = M.length; this.sig.chatCuoi = false;
      L.innerHTML = H.chatHtml(this.chatTab);
      if (cuoi) L.scrollTop = L.scrollHeight;
      this.el.querySelectorAll(".dt-ctab > span").forEach((s) => s.classList.toggle("on", s.textContent === this.chatTab));
    }
    // ghim của quản trị (anh 03/11 — hud.js ghimHien / anGhim): dòng [Ghim] dưới thẻ lọc, × ẩn trên máy này tới khi có ghim mới
    // thẻ Bang hội: công cáo bang ghim thay (anh 14/11 — hud.js ghimTab)
    const g = H.ghimTab ? H.ghimTab(this.chatTab) : H.ghimHien(), gk = g ? (g.bh ? "bh" : "") + g.id : 0;
    if (this.sig.ghim !== gk) {
      this.sig.ghim = gk; this.sig.ghimBh = !!(g && g.bh); const el = this.el.querySelector(".dt-ghim");
      el.innerHTML = g ? (g.bh ? `<b>[Công cáo]</b> ${esc(H.ghimChu(g))}` : `<b>[Ghim]</b> ${esc(g.t)}`) + `<span class="x" data-a="ghimAn">×</span>` : ""; el.style.display = g ? "" : "none";
    }
    const kk = H.channel + "|" + (H.matToi || ""); // tin mật (anh 13/11): đổi người nhận cũng vẽ lại
    if (this.sig.kenh !== kk) {
      this.sig.kenh = kk;
      const c = H.channel === "PRIVATE" ? H.M.chat.stranger : H.M.chat.channels[H.channel], k = this.el.querySelector(".dt-ckenh");
      k.style.backgroundImage = c && c.menuImg ? `url('${A}ui/hud/${c.menuImg.file}')` : "";
      const go = this.el.querySelector(".dt-cgo"); if (go) go.placeholder = H.channel === "PRIVATE" && H.matToi ? `Mật ${H.matToi}: …` : "Nói gì đó…";
      this.el.querySelectorAll(".dt-cmenu > div").forEach((d, i) => d.classList.toggle("on", this.kenhDs[i] === H.channel));
    }
  }
  // hàng nút việc làm: ô xem món đang hiện (sau lần chạm đầu vào món) -> nút theo dòng gợi ý, ngay dưới ô xem; đang cầm món trên tay -> "Chạm ô
  // muốn đặt" + Bỏ xuống, ở đỉnh phần cảnh (khỏi che túi)
  _hanh() {
    const G = this.api.GW(), b = this.hanhEl; if (!G) return;
    const t = G.itTip, xem = !!(t && t.style.display === "block");
    if (!xem && !(G.skTip && G.skTip.style.display === "block")) this.mon = null;
    // vừa thả món đang kéo mà 1 giây sau món còn trên tay (máy chủ không cho: hết chỗ, rương khóa…): món về chỗ cũ
    if (this.thaTay && (G.hand !== this.thaTay || performance.now() - this.thaLuc > 1000)) { if (G.hand === this.thaTay) G.drop(); this.thaTay = null; }
    const giu = !!G.holding && !this.keo && !this.thaTay && !this.vutDang, sig = giu ? "giu" : xem && this.mon ? t.dataset.k : "";
    if (sig !== this.sig.hanh) {
      this.sig.hanh = sig;
      this.hd = sig && !giu ? hanhDong(G.tipHint) : [];
      // món trong túi Hành trang: thêm Vứt (anh 31/10 lần 3: "thêm nút vất / bỏ trang bị để lỡ người chơi muốn ném ra") — _lam -> main.js throwHeld hỏi lại
      // món khóa bảo hiểm (thưởng, mua bằng Xu ở Kỳ Trân Các — anh 12/11) / thuốc Tống Kim: không vứt được -> không hiện nút (G.tipIt: món đang xem)
      const ti = G.tipIt, vutDuoc = !(ti && (ti.kbh || ti.tk));
      if (sig && !giu && this.mon && this._laTui(this.mon.el) && vutDuoc) this.hd.push({ chu: "Vứt", loai: "vut", mod: {}, th: 3 });
      b.innerHTML = giu ? `<span class="dt-hgo">Chạm ô muốn đặt</span><span class="dt-hn dt-hphu" data-a="bo">Bỏ xuống</span>`
        : this.hd.map((h, i) => `<span class="dt-hn${h.th ? " dt-hphu" : ""}" data-a="h${i}">${esc(h.chu)}</span>`).join("") + `<span class="dt-hn dt-hphu" data-a="hx">Đóng</span>`;
      b.style.display = sig && (giu || this.hd.length) ? "flex" : "none";
      if (b.style.display !== "none") this._nutClient(b);
    }
    if (b.style.display === "none") return;
    // ngay dưới ô xem (và ô món đang mặc để so, nếu nằm dưới); không đủ chỗ thì sát trên dải thẻ
    let y = TREN + 4;
    if (!giu) for (const x of [t, G.itTip2]) if (x && x.style.display === "block") y = Math.max(y, x.getBoundingClientRect().bottom + 6);
    y = Math.round(Math.min(y, innerHeight - TAB - b.getBoundingClientRect().height - 6)); // cao đã phóng (game.css #dt-hanh scale)
    if (this.sig.hanhY !== y) { this.sig.hanhY = y; b.style.top = y + "px"; }
  }
  _nutClient(b) { nutClient(this.api.P.win, b); }
  // thanh trên: chân dung (khung Chọn chân dung — chưa chọn: hình đầu theo giới), cấp, tên, môn phái · hệ, 3 thanh, tiền
  _tren(h) {
    const P = this.api.P, PT = P.win.portrait, L = (PT && PT.list) || [], im = L[(h.portrait || (h.sex === "f" ? 5 : 1)) - 1];
    const src = im ? P.win.base + im.file : "";
    if (this.sig.chan !== src) { this.sig.chan = src; this.el.querySelector(".dt-chan").style.backgroundImage = src ? `url(${src})` : ""; }
    let s = {}; try { s = JSON.parse(this.H.lastKey || "{}"); } catch {}
    this._chu(".dt-cap", String(s.lvl ?? h.lvl));
    this._chu(".dt-tnv", h.name || "");
    const f = this.api.facOf(h) || {}, he = f.series ?? h.series;
    this._chu(".dt-phai", `${f.n || ""} · ${HE[he] || ""}`);
    const phai = this.el.querySelector(".dt-phai"); if (phai.dataset.he !== String(he)) { phai.dataset.he = he; phai.style.color = HE_MAU[he] || ""; }
    const thanh = (sel, v, mx, chu) => {
      const r = mx > 0 ? Math.max(0, Math.min(1, v / mx)) : 0, b = this.el.querySelector(sel);
      const wpc = (r * 100).toFixed(1) + "%"; if (b.firstChild.style.width !== wpc) b.firstChild.style.width = wpc;
      if (b.lastChild.textContent !== chu(r)) b.lastChild.textContent = chu(r);
    };
    thanh(".dt-hp", s.life, s.lifeMax, () => `${Math.ceil(s.life || 0)}/${s.lifeMax || 0}`);
    thanh(".dt-mp", s.mana, s.manaMax, () => `${Math.ceil(s.mana || 0)}/${s.manaMax || 0}`);
    thanh(".dt-ex", s.exp, s.expMax, (r) => `Kinh nghiệm ${(r * 100).toFixed(1).replace(".", ",")}%`);
    this._chu(".dt-tien span", fmtMoney(h.gold || 0).replace(/ lượng$/, ""));
  }
  // trên cảnh: tên bãi + tọa độ, bản đồ nhỏ (chép từ bản đồ nhỏ của máy tính — hud.js vẽ mỗi khung), tự đánh, 2 dòng tin cuối (+ câu cảnh báo)
  _game(w) {
    const H = this.H;
    this._chu(".dt-bd span", H.mm.querySelector(".jx-mm-name").textContent);
    this._chu(".dt-bd em", H.mm.querySelector(".jx-mm-pos").textContent);
    // FPS + độ trễ tới máy chủ dưới thanh nhân vật (anh 30/10 lần 2 "thêm text tốc độ mạng và fps của game dưới thanh nhân vật để người chơi theo
    // dõi"): mỗi nửa giây; ô riêng cùng 1 hàng dưới chân dung (anh 31/10 "tách thành 2 cái khác nhau đặt ngay" — ảnh mũi tên chỗ dưới ô cấp —
    // rồi "vẫn tách nhưng nằm chung hàng ngang", thêm số người trực tuyến: Net.online của nhịp gửi máy chủ, như "Trực tuyến:" của máy tính);
    // mạng chậm (≥ 150 ms) chữ vàng, rất chậm / mất mạng chữ đỏ
    const t = performance.now();
    if (t - (this.mangLuc || 0) >= 500) {
      this.mangLuc = t;
      const ms = this.api.ping(), el = this.el.querySelector(".dt-ping");
      this._chu(".dt-fps", `FPS ${this.api.fps()}`);
      this._chu(".dt-ping", ms == null ? "Mất kết nối" : `Mạng ${Math.round(ms)} ms`);
      this._chu(".dt-onl", `Trực tuyến ${Math.max(1, (this.api.online && this.api.online()) | 0)}`);
      this._chu(".dt-ky", KY_NGAN);
      const lop = ms == null || ms >= 400 ? "mat" : ms >= 150 ? "cham" : "";
      if (el.dataset.lop !== lop) { el.dataset.lop = lop; el.classList.toggle("mat", lop === "mat"); el.classList.toggle("cham", lop === "cham"); }
    }
    const mm = this.el.querySelector(".dt-mm"), cv = this.mmCv, dpr = Math.min(2, devicePixelRatio || 1), cw = Math.round(mm.clientWidth * dpr), ch = Math.round(mm.clientHeight * dpr);
    if (cw > 0 && ch > 0) {
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      const g = cv.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(H.mmCv, 0, 0, cw, ch);
    }
    const td = this.el.querySelector(".dt-tudanh"), on = !!w.auto;
    if (td.dataset.on !== String(on)) { td.dataset.on = on; td.textContent = "Tự đánh: " + (on ? "Bật" : "Tắt"); td.classList.toggle("tat", !on); }
    const M = H.msgs, last = M[M.length - 1], canh = this.canhLuc && performance.now() - this.canhLuc[1] < 6000 ? this.canhLuc : null;
    // anh 31/10: "text thông báo kia nên hiển thị vài giây rồi mất" — 2 dòng tin cuối hiện TIN_HIEN ms kể từ tin mới nhất rồi mờ dần (vẫn đủ ở
    // khung chat — nút Chat)
    const tinEl = this.el.querySelector(".dt-tin");
    if (this.sig.tin !== last || this.sig.canh !== canh) {
      this.sig.tin = last; this.sig.canh = canh; this.tinLuc = performance.now(); tinEl.classList.remove("an");
      tinEl.innerHTML = M.slice(canh ? -1 : -2).map((m) => m.ch === "TIN" ? `<div class="tin">${esc(m.text)}</div>` : `<div${m.ch === "CH_SYSTEM" || (m.ch === "CH_TONG" && !m.name) ? ' class="ht"' : ""}><b>${esc(m.name || "")}</b>${m.name ? ": " : ""}${m.ch === "CH_SYSTEM" || (m.ch === "CH_TONG" && !m.name) ? chuMau(m.text) : BieuCam.html(m.text)}</div>`).join("")
        + (canh ? `<div class="canh">${esc(canh[0])}</div>` : "");
    } else if (performance.now() - (this.tinLuc || 0) > TIN_HIEN && !tinEl.classList.contains("an")) tinEl.classList.add("an");
    // nút lời mời tổ đội cạnh nút Chat (anh 06/11 — máy tính: biểu tượng góc phải dưới, hud.js moiDoi): có lời mời thì hiện, chưa xem thì nhấp nháy;
    // bảng mở (chạm nút — anh 06/11 chiều "cho đồng bộ" với máy tính): mỗi lời mời 1 dòng câu client + 3 nút Đồng ý / Cự tuyệt / Xem nhẹ bên phải nút
    const mt = H.moiTrangThai(), mSig = mt.n + "|" + mt.nhay + "|" + (mt.mo ? mt.ds.map((m) => m.id).join(",") : "");
    if (this.sig.moi !== mSig) {
      this.sig.moi = mSig; const md = this.el.querySelector(".dt-moidoi"), p = md.querySelector(".dt-moip");
      md.style.display = mt.n ? "" : "none"; md.classList.toggle("nhay", mt.nhay); md.querySelector(":scope > b").textContent = mt.n > 1 ? mt.n : "";
      md.classList.toggle("mo", !!mt.mo); // bảng đang mở: lên trên nút ô kỹ năng / ổ khóa ô (game.css .dt-moidoi.mo — anh 11/11 "popup mời pt đang bị icon khác đè")
      const nut = (m, v, t) => `<span class="dt-moin${v === "nhan" ? " nhan" : ""}" data-a="moiv" data-id="${m.id}" data-v="${v}">${t}</span>`;
      p.innerHTML = mt.mo ? mt.ds.map((m) => `<div class="dt-moil"><div class="dt-moic"><span>${esc(m.tu)}</span> ${m.bh != null ? `mời bạn gia nhập bang hội <span>${esc(m.bh)}</span>` : "mời bạn gia nhập nhóm của họ"}</div>${nut(m, "nhan", "Đồng ý")}${nut(m, "tuChoi", "Cự tuyệt")}${nut(m, "an", "Xem nhẹ")}</div>`).join("") : ""; // m.bh: lời mời vào bang (anh 14/11)
      p.style.display = mt.mo ? "" : "none";
    }
  }
  // số trên thẻ / ô (điểm kỹ năng, tiềm năng chưa cộng, tin mới), nút đang bật (Ngồi, Ngựa), thẻ đang mở, Việc cần làm
  _dau(h, ws) {
    const tin = this.api.tinMoi().length, kn = h.skPts | 0, tn = h.pts | 0;
    const so = (el, t) => { const b = el.querySelector(".dt-so"); if (b.textContent !== t) { b.textContent = t; b.style.display = t ? "block" : "none"; b.classList.toggle("moi", t === "Mới"); } };
    const the = this.el.querySelectorAll(".dt-tab > div"), luoi = this.el.querySelectorAll(".dt-luoi > .dt-o");
    so(the[1], tn ? String(tn) : ""); so(the[2], kn ? String(kn) : "");
    so(luoi[L_HETHONG], tin ? "Mới" : ""); // tin cập nhật chưa xem: nút Hệ thống (Tin cập nhật nằm trong đó)
    // phần thưởng đang chờ nhận (anh 03/11 — main.js capNhatThuong): số đỏ trên nút Nhận thưởng + thẻ Giang hồ, ô đầu Việc cần làm
    const nt = this.api.thuongCho ? this.api.thuongCho().length : 0;
    so(luoi[L_NHANTHUONG], nt ? String(nt) : ""); so(the[0], nt ? String(nt) : "");
    // thẻ sáng: thẻ đã mở trang (cửa sổ của nó còn mở) — không thì theo cửa sổ trên cùng; màn ngang lúc chơi: không thẻ nào
    const top = ws[0], moTheo = this.mode === "cs" && this.theMo && ws.some((x) => x.key === THE[this.theMo][2]);
    const dang = moTheo ? this.theMo : top ? (top.key === "trothu" ? 4 : top.key === "tumau" ? 3 : THE.findIndex((x) => x[2] === top.key)) : this.mode === "cs" || (this.ngang && this.mode === "gon") ? -1 : 0;
    if (this.sig.the !== dang) { this.sig.the = dang; the.forEach((el, i) => el.classList.toggle("on", i === dang)); }
    luoi[L_NGOI].classList.toggle("bat", !!this.H.toggles.Sit); luoi[L_NGUA].classList.toggle("bat", !!this.H.toggles.Horse);
    const ng = this.el.querySelector(".dt-ngua"); ng.classList.toggle("co", !!(h && h.looks && h.looks.horse)); ng.classList.toggle("bat", !!this.H.toggles.Horse); // nút ngựa trên cảnh: có ngựa mới hiện, đang cưỡi thì sáng
    luoi[L_GIAODICH].classList.toggle("bat", !!this.H.toggles.Exchange); // đang mở giao dịch
    // 1 dòng (bảng Giang hồ cao cố định — nhân vật không xê dịch): chữ ngắn
    const viec = [nt && ["nt", `Nhận thưởng ${nt}`], kn && ["kn", `Kỹ năng +${kn}`], tn && ["tn", `Tiềm năng +${tn}`], tin && ["tin", `${tin} tin mới`]].filter(Boolean);
    const sig = JSON.stringify(viec);
    if (this.sig.viec !== sig) {
      this.sig.viec = sig;
      const v = this.el.querySelector(".dt-viec");
      v.innerHTML = viec.length ? `<b>Việc cần làm:</b>` + viec.map(([k, t]) => `<span class="dt-chip" data-a="v${k}">${t}</span>`).join("") : `<b>Việc cần làm:</b><span class="dt-xong">không có — Trợ Thủ lo phần còn lại</span>`;
    }
  }

  // ---------- cần điều khiển (anh 29/10: "joystick để di chuyển bằng cách kéo, không dùng thì tự ẩn mờ đi"; 31/10: "đưa vào khu vực trung tâm như
  // mấy trò màn hình dọc, chỉnh thao tác cho mượt, thêm cài đặt khóa hoặc không khóa") ----------
  // Vùng cần = dải dưới phần cảnh từ mép trái tới cụm ô kỹ năng (game.css .dt-can); vòng nằm giữa vùng, mờ khi không dùng. Không khóa: đặt ngón
  // chỗ nào trong vùng thì vòng hiện ở đó (giữa vòng = chỗ đặt ngón); khóa (datCanKhoa): vòng đứng yên, chỉ chạm trong vòng. Kéo — hướng = từ giữa
  // vòng tới ngón (núm chạy tới mép vòng), chạy theo hướng đó tới khi nhả (main.js joyMove — chạy thẳng, vướng thì lệch dần). Lớp chạm (_cham) bỏ
  // qua vùng này
  _cuaCan() {
    const c = this.el.querySelector(".dt-can"), vong = c.firstElementChild, num = vong.firstElementChild;
    let id = null, o = null, R = 44, VR = 53;
    const keo = (e) => {
      const dx = e.clientX - o[0], dy = e.clientY - o[1], d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
      num.style.transform = `translate(${Math.round(dx * k)}px,${Math.round(dy * k)}px)`;
      this.joyD = d > 8 ? [dx / d, dy / d] : null;
      if (!this.joyD) this.api.joy(null);
    };
    c.addEventListener("pointerdown", (e) => {
      if (id != null || !this.on) return;
      R = 44 * (this.canCo || 1); VR = 53 * (this.canCo || 1);
      const vr = vong.getBoundingClientRect(), cx = vr.left + vr.width / 2, cy = vr.top + vr.height / 2;
      if (this.canKhoa && Math.hypot(e.clientX - cx, e.clientY - cy) > VR + 14) return;
      e.preventDefault(); id = e.pointerId;
      try { c.setPointerCapture(id); } catch {}
      if (this.canKhoa) o = [cx, cy];
      else { const r = c.getBoundingClientRect(); o = [e.clientX, e.clientY]; vong.style.transition = "none"; vong.style.left = e.clientX - r.left - VR + "px"; vong.style.top = e.clientY - r.top - VR + "px"; }
      c.classList.add("dang"); keo(e);
    });
    c.addEventListener("pointermove", (e) => { if (e.pointerId === id) keo(e); });
    const tha = (e) => { if (e.pointerId === id) { id = null; this._thaCan(); } };
    for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) c.addEventListener(t, tha);
    this._thaCan = () => { c.classList.remove("dang"); num.style.transform = ""; vong.style.transition = ""; vong.style.left = ""; vong.style.top = ""; if (this.joyD) { this.joyD = null; this.api.joy(null); } };
  }

  // ---------- kéo món (_cham) ----------
  // chỗ thả món đang cầm ở điểm (x, y): ô trang bị -> cả ô; lưới (túi, túi tử mẫu, rương…) -> ô trên trái = ô dưới điểm − chỗ đã cầm trong món
  // (như windows.js _handToBag), ngoai = món lòi ra ngoài lưới; không phải chỗ thả -> null
  _dich(x, y) {
    const G = this.api.GW(), H = G && G.hand, el = H && document.elementFromPoint(x, y); if (!el) return null;
    const slot = el.closest("#jxwin .jw-slot");
    if (slot) { const r = slot.getBoundingClientRect(); return { el, slot, r: [r.left, r.top, r.width, r.height] }; }
    const box = el.closest("#jxwin .jw-box"); if (!box || !box.offsetWidth) return null;
    const r = box.getBoundingClientRect(), o = O_TUI * (r.width / box.offsetWidth), [cw, ch] = (ItemDB.item(H.it.k) || {}).c || [1, 1];
    const x0 = Math.floor((x - r.left) / o) - H.grab[0], y0 = Math.floor((y - r.top) / o) - H.grab[1];
    const ngoai = x0 < 0 || y0 < 0 || x0 + cw > Math.round(box.offsetWidth / O_TUI) || y0 + ch > Math.round(box.offsetHeight / O_TUI);
    return { el, box, x0, y0, ngoai, r: [r.left + x0 * o, r.top + y0 * o, cw * o, ch * o] };
  }
  // khung vàng chỗ món đang kéo sẽ nằm khi nhả ở (x, y) — đỏ: lòi ra ngoài lưới (nhả = món về chỗ cũ); x null: ẩn
  _oDich(x, y) {
    const d = this.dichEl, t = x != null && this._dich(x, y);
    if (!t) { if (d.style.display !== "none") d.style.display = "none"; return; }
    Object.assign(d.style, { display: "block", left: t.r[0] + "px", top: t.r[1] + "px", width: t.r[2] + "px", height: t.r[3] + "px" });
    d.classList.toggle("ngoai", !!t.ngoai);
  }
  // thôi kéo: ẩn khung chỗ thả (tra: món đang kéo về chỗ cũ)
  _thoiKeo(tra) { if (tra && this.keo) { const G = this.api.GW(); if (G) G.drop(); } this.keo = false; this._oDich(null); }

  // ---------- ngắm chiêu (anh 31/10: "các kĩ năng chủ động, có thể làm cơ chế đè vào ô kĩ năng, hiển thị vùng thi triển như Liên Quân, trên điện
  // thoại thôi; nhân vật dùng kĩ năng theo hướng mình muốn ngay cả khi không có mục tiêu"; lần 2: "kéo chiêu vào vị trí thì nó đánh luôn chứ không
  // phải đợi thả ra mới đánh, đồng thời 2 ô trái phải" — "chưa đẹp, rất thô") ----------
  // Đặt ngón lên ô dùng nhanh có chiêu đánh / bùa hại / di hình, hoặc ô T / P (chiêu của tay đó) rồi kéo quá NGAM_DAU điểm: vòng điều khiển quanh
  // chỗ đặt ngón (núm = icon chiêu theo ngón, bán kính NGAM_R) + ô Hủy phía trên; trên cảnh (World.draw — world.ngam): vòng tầm chiêu quanh nhân vật,
  // dải + mũi tên tới chỗ ngắm = hướng kéo (màn hình và bản đồ cùng hướng), xa = độ kéo / NGAM_R × tầm chiêu (đo như World — trục dọc × 2). Kéo ra
  // là ra chiêu ngay vào chỗ ngắm, còn giữ thì đánh tiếp liên tục theo chỗ ngắm (World.castAt mỗi khi rảnh tay — không cần mục tiêu; bùa hại: con
  // gần chỗ ngắm nhất); kéo vào ô Hủy: dừng (đỏ); nhả: thôi. Chạm nhanh không kéo: dùng ô (ô dùng nhanh — con đang nhắm / gần nhất; ô T / P — ra
  // chiêu tay đó: main.js handUse). Chỉ lúc ô kỹ năng khóa (datOKhoa) — mở khóa thì kéo ô = đổi chỗ / gỡ.
  // Lần 3 (anh 31/10: "đang kéo chiêu mà kéo thanh di chuyển thì nhân vật ưu tiên di chuyển"): chỗ ngắm theo nhân vật (độ lệch ox / oy — nhân vật
  // chạy bằng cần thì vòng, mũi tên chạy theo); cần đang kéo (joyD) thì chưa đánh, nhả cần mà còn giữ ngón ngắm thì đánh tiếp. Ngón thứ hai (ngón
  // kia đang giữ cần) cũng ngắm được.
  _ngam() {
    const NGAM_DAU = 14, NGAM_R = 64, HUY = 150;
    let n = null; // lần ngắm: { id (ngón), s (chiêu), kind, x0, y0, on, huy, ox, oy (chỗ ngắm − nhân vật, đơn vị bản đồ), R (tầm chiêu), vong, huyEl }
    const chieuO = (el) => {
      if (!this.oKhoa) return null;
      const o = el && el.closest ? el.closest("#jxhud .jx-slot[data-slot], #jxhud .jx-skill[data-skill]") : null, h = this.api.hero(), P = this.api.P; if (!o || !h) return null;
      const O = h.oChieu || {}, id = o.dataset.skill ? (o.dataset.skill === "left" ? O.trai : O.phai) : ((Array.isArray(h.nhanh) ? h.nhanh[+o.dataset.slot] : null) || {}).s;
      const s = id && P.skillDb && P.skillDb[id], k = s && kindOf(s, P.skillDb);
      return k === "attack" || k === "curse" || k === "move" || k === "jump" ? { s: id, kind: k, o, ic: P.skillIcon && P.skillIcon[id] } : null;
    };
    const bo = () => { if (!n) return; if (n.vong) { n.vong.remove(); n.huyEl.remove(); } const w = this.api.world(); if (w) w.ngam = null; n = null; };
    this._boNgam = bo;
    // mỗi khung (tick) và mỗi lần kéo: vẽ chỗ ngắm theo nhân vật; ra chiêu vào đó lúc rảnh tay (không đang vung / ra chiêu / lướt) và cần không
    // đang kéo; thiếu nội lực, đang hồi chiêu…: báo 1 lần mỗi lần ngắm
    const ban = () => {
      const w = this.api.world(); if (!n || !n.on || n.ox == null || !w) return;
      const p = w.player, x = p.x + n.ox, y = p.y + n.oy;
      w.ngam = { R: n.R, x, y, huy: n.huy };
      if (n.huy || this.joyD || p.hp <= 0 || p.act === "attack" || p.cast || p.dash || p.queueAt) return;
      if (!(w.skLv(n.s) > 0)) { if (!n.bao) { n.bao = 1; this.H.msg(`Chưa học ${(this.api.P.skillDb[n.s] || {}).n || "chiêu này"}`); } return; }
      const c = w.skCan(n.s); if (!c.ok) { if (!n.bao) { n.bao = 1; this.H.canh(c.why); } return; }
      let m = null;
      if (n.kind === "curse") { let bd = 80; for (const o of w.mobs) { const dd = o.alive ? Math.hypot(o.x - x, (o.y - y) * 2) : Infinity; if (dd < bd) { bd = dd; m = o; } } if (!m) return; }
      w.castAt(n.s, m, x, y);
    };
    this.ngamTick = ban;
    addEventListener("pointerdown", (e) => {
      if (!this.on || e.pointerType !== "touch") return;
      if (e.isPrimary) bo(); else if (n) return; // ngón thứ hai (ngón kia giữ cần): ngắm được khi chưa ngắm
      const c = chieuO(e.target); if (!c) return;
      n = { ...c, id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, huy: false, ox: null, oy: null, R: 0 };
    }, true);
    addEventListener("pointermove", (e) => {
      if (!n || e.pointerId !== n.id) return;
      const w = this.api.world(), dx = e.clientX - n.x0, dy = e.clientY - n.y0, d = Math.hypot(dx, dy);
      if (!w) return bo();
      if (!n.on) {
        if (d < NGAM_DAU) return;
        n.on = true;
        n.vong = document.createElement("div"); n.vong.className = "dt-ngam"; n.vong.innerHTML = n.ic ? `<i><img src="assets/web/icon/${n.ic}" alt="" draggable="false"></i>` : "<i></i>";
        n.huyEl = document.createElement("div"); n.huyEl.className = "dt-ngam-huy"; n.huyEl.innerHTML = "<b>✕</b><span>Dừng</span>";
        Object.assign(n.vong.style, { left: n.x0 + "px", top: n.y0 + "px" }); Object.assign(n.huyEl.style, { left: n.x0 + "px", top: n.y0 - HUY + "px" });
        document.body.append(n.vong, n.huyEl);
      }
      const k = Math.min(d, NGAM_R), ux = dx / (d || 1), uy = dy / (d || 1);
      n.vong.firstChild.style.transform = `translate(${ux * k}px, ${uy * k}px)`;
      const hr = n.huyEl.getBoundingClientRect();
      n.huy = e.clientX >= hr.left - 8 && e.clientX <= hr.right + 8 && e.clientY >= hr.top - 8 && e.clientY <= hr.bottom + 8;
      n.huyEl.classList.toggle("on", n.huy);
      const R = w.skRange(n.s, w.skLv(n.s)), L = ((k / NGAM_R) * R) / (Math.hypot(ux, 2 * uy) || 1);
      n.R = R; n.ox = ux * L; n.oy = uy * L;
      ban();
    }, true);
    // nhả / mất ngón: thôi ngắm (đã ra đòn lúc kéo — ban)
    const xong = (e) => { if (n && e.pointerId === n.id) bo(); };
    addEventListener("pointerup", xong, true);
    addEventListener("pointercancel", xong, true);
  }

  // ---------- chạm ----------
  // Trình duyệt điện thoại tự đổi chạm thành chuột (mousemove, mousedown, click) nhưng mỗi máy một kiểu (iPhone: chạm vào chỗ có ô xem thì
  // chỉ hiện ô xem, không bấm). Chặn hẳn bản tự đổi đó (touchend preventDefault) rồi tự tạo sự kiện chuột như máy tính:
  //   chạm: mousemove -> mousedown -> mouseup -> click; chạm vào món (ô xem món / xem chiêu vừa hiện cái mới) lần đầu: chỉ xem (+ hàng nút việc
  //   làm — _hanh), chạm lần nữa: món kéo được vẫn chỉ xem (anh 31/10), chỗ khác: bấm; chạm chỗ khác trong cửa sổ: tắt ô xem;
  //   kéo món (anh 30/10: "bỏ đè vào trang bị là tự mặc — cho kéo trang bị tới ô cần thả, rương đồ cũng vậy"): đặt ngón lên món rồi kéo (giữ
  //   lâu rồi mới kéo cũng được; giữ yên không nhấc nữa — anh 30/10 lần 2) = bấm món như máy tính (cầm lên tay — windows.js _handPick); món nổi trên ngón tay LECH điểm, khung
  //   vàng = chỗ món sẽ nằm (_oDich); nhả trên ô của lưới / ô trang bị = bấm ô đó (đặt, đổi chỗ, cất rương, lấy ra, mặc, tháo); nhả chỗ khác,
  //   đúng chỗ cũ hoặc lòi ra ngoài lưới: món về chỗ cũ (không vứt xuống đất như bấm ra cảnh ở máy tính);
  //   chạm giữ 0,45 giây chỗ khác (ô dùng nhanh…): contextmenu (chuột phải của client) — Android tự bắn contextmenu khi giữ: chặn cái đó;
  //   kéo ngón tay: không bấm (để cuộn danh sách); danh sách client chỉ cuộn bằng lăn chuột (chọn chân dung…): kéo = lăn chuột.
  //   Cảnh game (canvas), cần điều khiển, ô nhập chữ / ô chọn: để nguyên (tự đọc pointer).
  // iPhone (anh 01/11 — người chơi iOS dùng Safari / Chrome: cả trang bị phóng to, chỉ thấy 1 góc cảnh): Safari iOS bỏ qua minimum / maximum-scale
  // của viewport với thao tác của người dùng (chụm 2 ngón) nên trang phóng to giữa lúc chơi (2 ngón cùng lúc: cần + ô kỹ năng…). Chặn chụm khi trang
  // đang đúng cỡ (touchmove ≥ 2 ngón, gesturestart / gesturechange — sự kiện riêng của Safari); đang bị phóng to rồi thì cho chụm để thu lại.
  // Chạm 2 lần phóng to: body.dt touch-action pan-x pan-y (game.css) + touchend đã chặn ở _cham
  _chongPhong() {
    const vv = window.visualViewport, to = () => !!vv && vv.scale > this.coHien * 1.02;
    const chan = (e) => { if (this.on && e.cancelable && !to()) e.preventDefault(); };
    addEventListener("touchmove", (e) => { if (e.touches.length > 1) chan(e); }, { capture: true, passive: false });
    for (const t of ["gesturestart", "gesturechange"]) document.addEventListener(t, chan, { passive: false });
  }
  _cham() {
    const GW = () => this.api.GW(), cv = this.api.cv;
    let g = null, luc = 0, nha = 0; // lần chạm đang giữ, lúc chạm / nhả gần nhất
    const tuNhien = (el) => el === cv || !!el.closest("input, select, textarea, option, label, .dt-can, .dt-bdl-cv"); // .dt-bdl-cv: bản đồ lớn tự đọc pointer (kéo / chạm)
    const ev = (el, type, x, y, o = {}) => el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0, buttons: 0, ...o }));
    const bam = (el, x, y) => { ev(el, "mousedown", x, y, { buttons: 1 }); ev(el, "mouseup", x, y); ev(el, "click", x, y); };
    const tip = () => { const G = GW(); if (!G) return ""; for (const t of [G.itTip, G.skTip]) if (t && t.style.display === "block") return t.dataset.k || "x"; return ""; };
    // phần tử (hoặc khung chứa nó) tự cuộn được bằng ngón tay (overflow auto / scroll, nội dung dài hơn khung)
    const cuonDuoc = (el) => { for (let x = el; x && x !== document.body; x = x.parentElement) { const o = getComputedStyle(x).overflowY; if ((o === "auto" || o === "scroll") && x.scrollHeight > x.clientHeight + 1) return true; } return false; };
    // món kéo được: món trong lưới (túi, túi tử mẫu, rương, khung Giao), ô trang bị đang mặc — trừ lúc cửa hàng đang Bán / Sửa (bấm món = bán / sửa)
    const monKeo = (el) => {
      const G = GW(), sh = G && G.W.get("shop"); if (!G || (sh && sh.visible && (G.shopMode === "sell" || G.shopMode === "repair"))) return null;
      const s = el.closest("#jxwin .jw-slot");
      return el.closest("#jxwin .jw-box .jw-it") || (s && s.querySelector("img.jw-icon") ? s : null);
    };
    // nhấc món: bấm món ở chỗ đặt ngón -> món dính theo ngón (túi vẽ lại ngay: nhớ lưới gốc trước)
    const nhac = (c) => {
      const G = GW(); if (!G || G.holding) return false;
      const sh = G.W.get("shop"); if (sh && sh.visible && sh.node("ItemBox").contains(c.mk)) return false; // hàng cửa hàng không kéo (bấm = mở khung mua)
      G._hideTip(); G._hideSkTip(); this.mon = null;
      const el = c.mk.isConnected ? c.mk : document.elementFromPoint(c.x, c.y); if (!el) return false;
      c.hop = el.closest(".jw-box");
      bam(el, c.x, c.y);
      if (!G.holding) return false;
      c.keo = this.keo = true;
      if (navigator.vibrate) navigator.vibrate(12);
      return true;
    };
    const keoToi = (x, y) => { document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, view: window, clientX: x, clientY: y - LECH })); this._oDich(x, y - LECH); };
    const thaMon = (c, x, y) => {
      const G = GW(), H = G && G.hand, t = H && this._dich(x, y - LECH);
      this._thoiKeo(); if (!H) return;
      const cu = t && t.box && t.box === c.hop && t.x0 === H.it.x && t.y0 === H.it.y;
      if (!t || cu || t.ngoai || (t.slot && H.from !== "bag")) return void G.drop();
      bam(t.el, x, y - LECH);
      if (G.hand === H) { this.thaTay = H; this.thaLuc = performance.now(); } // chờ máy chủ (_hanh: không cho thì món về chỗ cũ)
    };
    const boKeo = (c) => { if (!c.keo) return; this._thoiKeo(); const G = GW(); if (G) G.drop(); };
    addEventListener("pointerdown", (e) => {
      if (!this.on || e.pointerType !== "touch" || !e.isPrimary) return;
      luc = performance.now();
      const el = e.target, x = e.clientX, y = e.clientY;
      if (g) { clearTimeout(g.t); boKeo(g); }
      g = { id: e.pointerId, el, x, y, tn: tuNhien(el), tip: tip() };
      if (!g.el.closest(".jw, .jw-sktip, #dt-hanh")) { const G = GW(); if (G) { G._hideTip(); G._hideSkTip(); } }
      if (g.tn) return;
      g.mk = monKeo(el);
      g.t = setTimeout(() => {
        if (!g) return;
        // món: giữ không làm gì — không nhấc lên tại chỗ nữa (anh 30/10 lần 2: "đè vô làm item tự nổi lên và di chuyển khỏi vị trí, bỏ đi —
        // đã có đè và kéo thả"); kéo ngón đi (kể cả sau khi giữ) mới nhấc món, nhả tại chỗ = chạm (xem món)
        if (g.mk) return;
        // ô kỹ năng đang khóa (chỉ dùng — datOKhoa): giữ không mở bảng chọn ô (đè rồi kéo = ngắm chiêu, nhả tại chỗ = dùng ô)
        if (this.oKhoa && el.closest("#jxhud .jx-slot")) return;
        g.giu = true;
        const G = GW(); if (G) { G._hideTip(); G._hideSkTip(); }
        ev(el, "contextmenu", x, y, { button: 2, buttons: 2 });
        if (navigator.vibrate) navigator.vibrate(12);
      }, 450);
    }, true);
    addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      const xa = Math.hypot(e.clientX - g.x, e.clientY - g.y) > 10;
      if (g.keo) { if (xa) g.di = true; if (g.di) keoToi(e.clientX, e.clientY); return; } // nhấc bằng giữ: nổi lên khi ngón bắt đầu đi
      if (!g.di && xa) { g.di = true; clearTimeout(g.t); if (g.mk && !g.giu && nhac(g)) keoToi(e.clientX, e.clientY); }
    }, true);
    // ngón thứ hai (ngón kia đang giữ cần điều khiển / đang ngắm — anh 31/10 lần 2): chạm ô dùng nhanh / ô T, P vẫn bấm (nhả tại chỗ = bấm ô — dùng
    // hoặc gắn theo khóa ô); ngón đầu đi theo g ở trên
    let g2 = null;
    addEventListener("pointerdown", (e) => { if (this.on && e.pointerType === "touch" && !e.isPrimary) g2 = e.target.closest && e.target.closest("#jxhud .jx-slot") ? { id: e.pointerId, el: e.target, x: e.clientX, y: e.clientY } : null; }, true);
    addEventListener("pointermove", (e) => { if (g2 && e.pointerId === g2.id && Math.hypot(e.clientX - g2.x, e.clientY - g2.y) > 10) g2 = null; }, true);
    addEventListener("pointerup", (e) => { if (!g2 || e.pointerId !== g2.id) return; const c = g2; g2 = null; if (c.el.isConnected) bam(c.el, e.clientX, e.clientY); }, true);
    addEventListener("pointercancel", (e) => { if (g2 && e.pointerId === g2.id) g2 = null; }, true);
    // vuốt dọc trên danh sách chỉ cuộn bằng lăn chuột: mỗi 36 điểm = 1 nấc lăn. Đọc touchmove (trình duyệt nhận vuốt làm cuộn trang thì báo
    // pointercancel, ngừng pointermove — touchmove vẫn tới)
    let v = null;
    // ô thanh dưới (ô dùng nhanh, ô T / P): kéo = ngắm chiêu (_ngam), không đổi thành lăn chuột
    addEventListener("touchstart", (e) => { const t = e.touches[0]; v = this.on && e.touches.length === 1 && !monKeo(e.target) && !e.target.closest("#jxhud .jx-slot") ? { el: e.target, x: t.clientX, y: t.clientY, ly: t.clientY, lan: null } : null; }, { capture: true, passive: true });
    addEventListener("touchmove", (e) => {
      const t = e.touches[0]; if (!v || !t) return;
      if (v.lan == null) { if (Math.hypot(t.clientX - v.x, t.clientY - v.y) <= 10) return; v.lan = !tuNhien(v.el) && !v.el.closest("#dt") && !cuonDuoc(v.el); }
      if (v.lan && Math.abs(v.ly - t.clientY) >= 36) {
        const d = v.ly - t.clientY; v.ly = t.clientY;
        v.el.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, view: window, deltaY: d, deltaMode: 0, clientX: t.clientX, clientY: t.clientY }));
      }
    }, { capture: true, passive: true });
    addEventListener("pointercancel", (e) => { if (g && e.pointerId === g.id) { clearTimeout(g.t); boKeo(g); g = null; nha = performance.now(); } }, true);
    addEventListener("pointerup", (e) => {
      if (!g || e.pointerId !== g.id) return;
      clearTimeout(g.t);
      const c = g; g = null; nha = performance.now();
      if (c.keo) return c.di ? thaMon(c, e.clientX, e.clientY) : boKeo(c); // giữ rồi nhả tại chỗ: món về chỗ cũ
      if (c.tn || c.giu || c.di) return;
      // chỗ chạm vừa bị vẽ lại trong lúc chạm (bảng boss thế giới đổi máu ≤ 4 lần / giây…): bấm phần tử đang nằm dưới ngón
      const x = e.clientX, y = e.clientY, el = c.el.isConnected ? c.el : document.elementFromPoint(x, y) || c.el;
      // nút trên màn (ô dùng nhanh, ô kỹ năng, nút của bảng dọc), bảng chọn chiêu / thuốc cho ô (.jx-skpick — giữ để xem) và bảng chọn biểu cảm
      // (.bc-chon): bấm luôn, không hiện ô xem
      if (!el.closest("#jxhud .jx-slot, #dt, #dt-hanh, .jx-skpick, .bc-chon, #btg")) {
        ev(el, "mouseover", x, y); ev(el, "mousemove", x, y);
        const G = GW(), sau = tip();
        if (sau && sau !== c.tip && !(G && G.holding)) { this.mon = { el, x, y }; return; } // chạm đầu vào món / chiêu: chỉ xem
        // chạm lần nữa vào món kéo được (túi, rương, ô trang bị, khung Giao, hàng cửa hàng): vẫn chỉ xem, không bấm — bấm là cầm món lên tay
        // ("Chạm ô muốn đặt" — anh 31/10: "click vào 2 lần nó hiện như này, có thể bỏ"); cầm món: kéo; việc làm: hàng nút dưới ô xem
        if (c.mk && !(G && G.holding)) { if (sau) this.mon = { el, x, y }; return; }
        if (sau && sau === c.tip && this.mon && !this.mon.el.contains(el) && G) { G._hideTip(); G._hideSkTip(); }
      }
      ev(el, "mousedown", x, y, { buttons: 1 }); ev(el, "mouseup", x, y); ev(el, "click", x, y);
    }, true);
    // chặn sự kiện chuột trình duyệt tự đổi từ chạm (đã tạo ở trên) — trừ canvas, ô nhập chữ. touchend preventDefault không đủ: chạm làm vẽ
    // lại phần tử dưới ngón tay (cầm món -> túi vẽ lại) thì touchend tới phần tử đã gỡ, không qua window -> trình duyệt vẫn bắn mousedown / click
    // vào ô bên dưới (món vừa cầm bị đặt lại ngay — thấy khi thử 29/10). Nên chặn luôn sự kiện chuột thật trong lúc chạm và 0,8 giây sau khi nhả
    addEventListener("touchend", (e) => { v = null; if (this.on && !tuNhien(e.target)) e.preventDefault(); }, { capture: true, passive: false });
    const chanChuot = (e) => { if (this.on && e.isTrusted && (g || performance.now() - nha < 800) && !tuNhien(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
    for (const t of ["mouseover", "mousemove", "mousedown", "mouseup", "click", "dblclick"]) addEventListener(t, chanChuot, true);
    addEventListener("contextmenu", (e) => { if (this.on && e.isTrusted && performance.now() - luc < 2000) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    // giữ ngón trên hình (icon món, chân dung…): Android bắt đầu kéo hình -> pointercancel, mất chạm giữ (anh 29/10 "không mặc được đồ")
    addEventListener("dragstart", (e) => { if (this.on) e.preventDefault(); }, true);
  }
}

// cờ bật đọc ngay lúc tải trang (điện thoại / link ?dt=1 — nhớ vào máy từ đây): màn chọn nhân vật dựng dọc thu dãy nhân vật cho vừa (game.css html.dt-bat).
// Khóa cỡ trang ngay từ màn đăng nhập (anh 01/11 — iPhone vào game thấy cả trang phóng to): trước giao diện điện thoại chỉ dựng lúc vào game, màn
// đăng nhập / chọn / tạo nhân vật để viewport mặc định -> chạm ô Tài khoản, Mật khẩu, tên nhân vật (chữ < 16 px) Safari iOS tự phóng to rồi giữ
// luôn vào game. maximum-scale = 1: Safari không tự phóng khi chạm ô nhập chữ; chạm 2 lần / chụm: html.dt-bat touch-action (game.css)
if (DienThoai.bat()) {
  document.documentElement.classList.add("dt-bat");
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.content = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover";
}
