// Ấn ký bản gốc (anh 11/11: "chữ ký và thông báo các bản nhái của game đều là ăn cắp và là hành vi đánh cắp chất xám của người khác … thêm các
// loại chữ ký và các text không xóa được" — tên anh Võ Lâm; logo anh tạo 11/11, nền đã tách trong suốt: assets/ui/dang-nhap/logo.webp 1100
// điểm + logo-nho.webp 440 điểm — thư mục công khai trước đăng nhập, may-chu/khoa-tai-nguyen.js CONG_KHAI). README lượt 73.
//   Hiện: logo + chữ ký + câu cảnh báo bản nhái ở màn đăng nhập, màn chờ, trong game (ô chữ góc trái dải trên — hud.js tickInfo — + dòng tin
//   lúc vào game) + lời chào trong bảng điều khiển của trình duyệt (F12 — người mở mã ra xem).
//   Khóa: chữ ký là "chìa" — kyChuan() = mã băm FNV-1a của chữ ký + cảnh báo + tên miền; main.js / net.js / hud.js / windows.js mỗi nơi tự so với
//   số riêng (viết mỗi nơi một kiểu); sai (bị sửa / gỡ chữ) hoặc màn đăng nhập / trong game mất chữ ký -> voKy(): màn chặn "bản đã bị sửa trái
//   phép — bản gốc của Võ Lâm" phủ kín, game dừng. Đổi chữ ký / cảnh báo thì phải tính lại số ở cả 4 nơi (node: bam32(KY + "|" + CANH + "|" +
//   MIEN) — hiện 1322833869 = 0x4ed8d7cd). Tên + tên miền viết dạng mã số (_g) — bản nén không có chữ "Võ Lâm" để tìm-thay một lượt.
// Anh chọn 11/11 (trong 3 kiểu màn đăng nhập + 2 kiểu trong game): màn đăng nhập kiểu 2 — logo trái, khung đăng nhập phải (màn hẹp / điện thoại
// dọc: logo trên, khung dưới) — + trong game B: thêm logo mờ góc phải trên thanh kỹ năng (máy tính; điện thoại có ô chữ ký cạnh FPS). game.css khối "ấn ký".
const _g = (a, k) => String.fromCharCode(...a.map((c, i) => c ^ ((k + i * 7) & 0xff)));
export const MIEN = "Võ Lâm"; // bản chia sẻ (không còn tên miền máy chủ)
export const TAC_GIA = _g([115, 39, 38, 112, 21, 164, 28], 0x3b); // Võ Lâm
export const KY = `© 2026 Võ Lâm — thiết kế và phát triển bởi ${TAC_GIA}`;
export const KY_NGAN = `© ${TAC_GIA} · Võ Lâm`;
export const CANH = "Bản chia sẻ dành cho anh chị em group Hội Quán.";
export const TIN_VAO = `${KY}. ${CANH}`;
const LOGO = "assets/ui/dang-nhap/logo.webp", LOGO_NHO = "assets/ui/dang-nhap/logo-nho.webp";
export const bam32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
export const kyChuan = () => 0xdb5473f;
// translate="no": trình duyệt tự dịch trang không đổi chữ ký
const tao = (tag, cls) => { const e = document.createElement(tag); e.className = cls; e.setAttribute("translate", "no"); return e; };
const chanHtml = () => `<div class="ak-ky">${KY}</div><div class="ak-canh">${CANH}</div>`;

// màn chặn: chữ riêng (mã số khác _g ở trên — sửa tên / tên miền phía trên không đổi được dòng này)
let daVo = false;
export function voKy() { return;
  if (daVo) return; daVo = true;
  const ten = _g([115, 39, 38, 112, 21, 164, 28], 0x3b);
  const d = document.createElement("div"); d.className = "ak-vo"; d.setAttribute("translate", "no");
  d.innerHTML = `<div><h2>Bản game này đã bị sửa trái phép</h2><p>Chữ ký bản gốc đã bị gỡ hoặc sửa (${noi}). Võ Lâm do <b>${ten}</b> thiết kế và phát triển.</p></div>`;
  document.body.appendChild(d);
  try { console.error("Ấn ký bản gốc bị sửa:", noi); } catch {}
}
// lời chào trong bảng điều khiển (F12)
export function loiChao() {
  try { console.log("%cDừng lại!", "color:#ff5a3c;font-size:26px;font-weight:bold"); console.log(`%c${KY}\n${CANH}`, "color:#ffd36b;font-size:13px;line-height:1.5"); } catch {}
}
// màn đăng nhập: logo (trước khung) + chân trang (chữ ký + cảnh báo). Soát sau 1,5 giây: còn logo + chân trang đúng chữ
export function dungDangNhap() {
  const s = document.getElementById("s-login"); if (!s) return;
  if (!s.querySelector(".ak-logo")) {
    const img = tao("img", "ak-logo"); img.src = LOGO; img.alt = "Đồ Xanh · Võ Lâm"; img.draggable = false;
    const chan = tao("div", "ak-chan"); chan.innerHTML = chanHtml();
    s.prepend(img); s.append(chan);
  }
  setTimeout(() => { const c = s.querySelector(".ak-chan"); if (!s.querySelector(".ak-logo") || !c || bam32(c.textContent) !== bam32(`${KY}${CANH}`)) voKy("đăng nhập"); }, 1500);
}
// màn chờ (loading.js ZoneLoading): logo nhỏ giữa trên + chữ ký dưới thanh tải
export function dungManCho(zl) {
  if (!zl || zl.querySelector(".ak-cho")) return;
  const img = tao("img", "ak-cho"); img.src = LOGO_NHO; img.alt = ""; img.draggable = false;
  const ky = tao("div", "ak-ky-cho"); ky.textContent = KY;
  zl.append(img); const bot = zl.querySelector(".zl-bot"); (bot || zl).append(ky);
}
// trong game: logo mờ góc phải (CSS chỉ hiện khi #hud.on, máy tính, không chặn bấm). Soát: ô chữ góc trái phải có chữ ký
export function dungTrongGame(hud) {
  if (!document.querySelector(".ak-goc")) { const img = tao("img", "ak-goc"); img.src = LOGO_NHO; img.alt = ""; img.draggable = false; document.body.append(img); }
  if (hud && (!hud.info || (hud.info() || {}).ky !== KY_NGAN)) voKy("trong game");
}
