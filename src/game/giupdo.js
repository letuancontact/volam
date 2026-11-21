// Nội dung khung Giúp đỡ (phím F1 / Esc → Giúp đỡ — windows.js _giupDo; anh 29/10: bản trước in 4 dòng phím tắt vào khung chat, "khá rối,
// cần thiết kế lại cho thân thiện với người chơi"). Khung HỖ TRỢ của client: mục bên trái, nội dung bên phải.
//   MUC_GIUP: [{ ten, dong(api) -> [dòng] }] — ten ngắn (ô mục rộng 121 điểm ảnh, ~17 chữ). Số lấy từ luật máy chủ (api.luat() — cau-hinh.json)
//   nên chỉnh số là hướng dẫn tự đúng. api = api của GameWindows (+ quanTri()).
//   giupHtml(dòng) -> HTML: "## chữ" tiêu đề nhỏ, "• chữ" gạch đầu dòng, *chữ* tô vàng (phím, NPC, nút), dòng khác = đoạn thường. Dùng chung cho
//   nội dung Tin cập nhật (assets/data/tin-cap-nhat.json).
import { fmtMoney } from "./money.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const vang = (t) => esc(t).replace(/\*([^*]+)\*/g, '<span class="gd-v">$1</span>');
export function giupHtml(dong) {
  return dong.map((d) => d.startsWith("## ") ? `<div class="gd-h">${vang(d.slice(3))}</div>`
    : d.startsWith("• ") ? `<div class="gd-b">• ${vang(d.slice(2))}</div>` : `<div class="gd-p">${vang(d)}</div>`).join("");
}
const L = (a) => (a.luat && a.luat()) || {};

export const MUC_GIUP = [
  { ten: "Bắt đầu chơi", dong: () => [
    "Mới vào game cứ làm lần lượt. Bảng *Nhiệm vụ* góc trái (điện thoại: dòng dưới bản đồ nhỏ) dẫn từng bước, bấm chữ xanh để làm.",
    "## 1. Ra bãi luyện công",
    "• Trong thành *không có quái*. Bấm *Tự đánh* (phím *Space*, hoặc chữ Tự đánh dưới bản đồ nhỏ): nhân vật tự chạy tới *Xa phu* và ra bãi đúng cấp.",
    "• Muốn tự chọn: nói chuyện *Xa phu* → *Khu vực luyện công* → chọn mốc cấp → chọn bãi. Cấp 1–10: *Dược Vương Cốc*. Bãi chỉ vào được khi đủ cấp.",
    "## 2. Tự đánh tới cấp 10",
    "• Ở bãi bấm *Tự đánh*: nhân vật tự tìm quái để đánh. Bấm đất để đi, bấm quái để đánh tay. Đồ rơi nằm dưới đất, bấm vào để nhặt.",
    "## 3. Nhận quà cấp 10",
    "• Nút *Nhận thưởng* → *Thưởng thăng cấp*: tiền, thuốc và *Thổ Địa Phù* để về thành.",
    "## 4. Về Ba Lăng nhập phái",
    "• Dùng *Thổ Địa Phù* về thành, gặp *đệ tử tiếp dẫn* của phái cùng hệ với mình (mỗi hệ 2 phái). Có phái mới có võ công.",
    "## 5. Cộng điểm, chọn chiêu",
    "• Lên cấp được điểm tiềm năng (*F3* Nhân vật, nút +) và điểm kỹ năng (*F5* Võ công, nút +).",
    "• Chọn chiêu đánh: bấm ô *T* (tay trái) ở thanh dưới, hoặc kéo chiêu từ bảng Võ công vào thanh dùng nhanh *1–9*.",
    "## 6. Mua sắm",
    "• Thuốc: *Ngô thần y* (Dược điếm Ba Lăng) → Giao dịch. *Thổ Địa Phù*: Tạp hóa (bấm phù trong túi rồi bấm ô 1–9 để đặt vào thanh dùng nhanh).",
    "• *Esc* → *Tin cập nhật*: xem nội dung game vừa thêm / sửa.",
  ] },
  { ten: "Tự đánh, Trợ Thủ", dong: () => [
    "## Tự đánh làm gì",
    "• *Ở bãi*: tự tìm quái để đánh. Bấm lại để tắt.",
    "• *Trong thành*: tự chạy tới *Xa phu* về bãi đang luyện dở, chưa có bãi thì ra bãi đúng cấp, tới nơi đánh tiếp.",
    "• Đứng ngay chỗ *mộc nhân* (Ba Lăng): đánh mộc nhân để thử chiêu, không có kinh nghiệm.",
    "## Trợ Thủ",
    "• Mở: phím *K* hoặc nút Trợ Thủ ở cột biểu tượng bên phải (chuột phải nút = bật / tắt tự đánh).",
    "## 6 thẻ",
    "• *Thuốc*: tự uống máu / nội lực dưới ngưỡng %, chọn loại thuốc ở ô xổ xuống (Bất kỳ = chồng ít bình nhất).",
    "• *Kỹ năng*: chiêu chính, bùa, vòng sáng, bùa hại.",
    "• *Đánh quái*: cách tìm quái, phạm vi đánh.",
    "• *Nhặt đồ*: nhặt tiền, thuốc, trang bị theo số dòng / bộ lọc.",
    "• *Về thành*: treo máy — túi đầy, hết thuốc, đồ sắp hỏng thì về thành bán, mua thuốc, sửa đồ, cất tiền rồi quay lại bãi.",
    "• *Khác*: hiển thị (ẩn bớt người chơi khác, ẩn sạp hàng cho đỡ giật), bảo vệ trang bị, bố cục màn hình.",
    "## Ghi nhớ",
    "• *Space* bật / tắt tự đánh. Thoát game lúc đang tự đánh ở bãi luyện công thì vào lại tự đánh tiếp.",
  ] },
  { ten: "Ủy thác", dong: (a) => {
    const U = L(a).uyThac || {};
    return [
      "## Ủy thác là gì",
      `• Đang *tự đánh* ở bãi luyện công mà rời game (đóng trang, tắt máy, mất mạng) quá ${U.vangGiay || 90} giây: máy chủ cày thay ở bãi đó.`,
      "• Vào lại game: bảng tổng kết thời gian, số quái, kinh nghiệm, ngân lượng, đồ giữ lại / đã bán.",
      "## Cách dùng",
      "• Bấm *Esc* → *Ủy thác* (hoặc *Trợ Thủ* → *Đánh quái* → nút *Ủy thác*): đang ở bãi thì rời game ngay; đang ở thành thì Trợ Thủ đưa ra bãi treo máy rồi tự ủy thác.",
      "• Hoặc ra bãi luyện công, bật *Tự đánh*, rồi cứ thoát game.",
      "## Luật",
      `• Tốc độ = ${Math.round((U.tiLe || 0.7) * 100)} % tốc độ giết quái thật của bạn ở bãi đó (máy chủ đo khi bạn chơi).`,
      `• Tối đa *${U.gioNgay || 12} giờ / ngày* (0 giờ tính lại).`,
      "• Cần giờ *Bạch Câu Hoàn*: mỗi viên Bạch Câu Hoàn Đặc Biệt (Kỳ Trân Các) +8 giờ. Rê chuột lên viên trong túi xem giờ còn.",
      "• Không tốn thuốc, không chết. Đồ nhặt theo thẻ *Nhặt đồ* của Trợ Thủ; túi đầy thì bán.",
      "• Ủy thác không tăng độ luyện kỹ năng.",
    ];
  } },
  { ten: "Kiếm đồ, kiếm tiền", dong: () => [
    "## Đồ từ quái",
    "• Quái ở bãi đúng cấp rơi đồ và ngân lượng xuống đất, phải *nhặt* trước khi biến mất. *Trợ Thủ* → *Nhặt đồ*: chọn loại muốn tự nhặt.",
    "• Trang bị xanh có 1–6 dòng, càng nhiều dòng càng hiếm. Quái cấp cao rơi đồ cấp cao, lên cấp thì mở bãi mới.",
    "## Đồ từ hoạt động",
    "• *Bảo rương đồ xanh*: mở ra món 3–6 dòng, có từ nhiệm vụ Võ Lâm Minh Chủ, cửa hàng Phúc duyên.",
    "• Boss, Tống Kim, Phong Lăng Độ và các hoạt động khác: nút cờ *Hướng dẫn hoạt động* xem lịch và phần thưởng.",
    "• Mua của người khác: *Chợ Trời*.",
    "• Tỉ lệ rơi từng bãi, từng rương: *Hướng dẫn hoạt động* → *Tra cứu*.",
    "## Kiếm tiền",
    "• Quái rơi ngân lượng. Đồ thừa bán ở cửa hàng, Trợ Thủ thẻ *Về thành* tự bán theo mức đã cài.",
    "• Đồ tốt bày bán ở *Chợ Trời*: *Định giá* trong Hành trang rồi *Rao bán* ở thành.",
  ] },
  { ten: "Phím tắt", dong: (a) => [
    "## Cửa sổ",
    "• *F1* Giúp đỡ · *F2* Tùy chọn · *F3* Nhân vật · *F4* Đồ dùng · *F5* Võ công · *F6* Hảo hữu · *F12* Nhiệm vụ",
    "• *P* Tổ đội · *Ctrl+B* Bang phái · *Alt+C* Phòng chat · *Ctrl+V* Túi hành trang · *K* Trợ Thủ",
    "• *Esc* đóng cửa sổ trên cùng; không còn cửa sổ nào thì mở bảng hệ thống.",
    "## Di chuyển, bản đồ",
    "• *Tab* bản đồ lớn / nhỏ (giữ chuột phải trên bản đồ để kéo xem chỗ khác) · *+ / −* phóng to / thu nhỏ.",
    "• Điện thoại: chạm bản đồ nhỏ góc phải = bản đồ lớn (bản đồ đầy đủ như Ba Lăng: kéo để xem chỗ khác); chạm chỗ nào nhân vật chạy tới đó, *✕* để đóng.",
    "• Phím số bên phải (*Num*) đi theo hướng · *M* lên / xuống ngựa · *V* ngồi thiền.",
    "## Đánh, dùng đồ",
    "• *Space* tự đánh · *1–9* thanh dùng nhanh (thuốc, chiêu, Thổ Địa Phù) · chuột phải thuốc trong túi = uống.",
    "• *T* (hoặc *O*) mở / đóng giao dịch · *Ctrl + chuột phải* vào người chơi: menu (Giao dịch, Tổ đội) · *F9* PK.",
    "## Hiển thị, chat",
    "• *F7* hiện tên · *F8* thanh máu · *Del* xóa chat · *Alt+0..9* nói nhanh · *Ctrl+M* tắt tiếng · *Alt+X* thoát game.",
    "• Khoe đồ: *Ctrl + bấm* món ở Hành trang / Trang bị (điện thoại: chạm món → nút *Khoe đồ*) — chữ *<tên đồ>* vào ô chat, gõ thêm rồi gửi. Người khác rê chuột / chạm chữ đó để xem món.",
    ...(a.dev ? ["• *`* công cụ thử."] : []), ...(a.quanTri && a.quanTri() ? ["• *F10* bảng quản trị."] : []),
    "Bảng phím của client: bấm *Hướng dẫn phím nóng!* phía trên danh sách mục.",
  ] },
  { ten: "Bãi luyện công", dong: () => [
    "• Đi: *Xa phu* → *Khu vực luyện công* → mốc cấp → bãi (chỉ hiện bãi đủ cấp). *Trở lại địa điểm cũ*: về đúng chỗ đã dùng Thổ Địa Phù.",
    "• Mỗi bãi có cấp thấp nhất; lên tới cấp mở bãi mới thì có thông báo.",
    "• Quái *tinh anh* (tên xanh dương) ra sau khoảng 50 con, *thủ lĩnh* (tên cam) sau khoảng 250 con: máu dày, kinh nghiệm và đồ rơi nhiều hơn.",
    "• *Trùm* bãi rất khỏe — nên đi đội hoặc chuẩn bị thuốc.",
    "• Quái biết dùng võ công của phái cùng hệ — xem mục Trạng thái, kháng.",
  ] },
  { ten: "Võ công, luyện", dong: (a) => {
    const nc = +L(a).noiCong || 0;
    return [
      "• *F5* mở bảng Võ công, nút *+* cộng điểm kỹ năng. Cấp chiêu tối đa = cấp nhân vật − cấp yêu cầu của chiêu + 1.",
      "• Chiêu 90 / 120 học bằng sách (Kỳ Trân Các → thẻ Bí Kíp): chiêu 90 cần cấp 80, chiêu 120 cần cấp 120.",
      "## Độ luyện",
      "• Đa số chiêu 90 và mọi chiêu 120 không cộng điểm mà lên cấp bằng *độ luyện*: chiêu đánh tăng mỗi lần trúng quái ở bãi luyện công, chiêu 120 tăng theo kinh nghiệm nhận được.",
      "• Rê chuột lên chiêu xem dòng *Mức độ luyện*.",
      "• Mộc nhân Ba Lăng không tăng độ luyện; cọc gỗ trên *đảo Tẩy Tủy* thì có.",
      "• *Đại Thành Bí Kíp* 90 / 120: đưa 1 chiêu đã học lên thẳng cấp 20.",
      ...(nc ? [`• Nội công: mỗi điểm +${String(nc).replace(".", ",")} % sát thương chiêu nội công.`] : []),
    ];
  } },
  { ten: "Trang bị, dòng ẩn", dong: () => [
    "• Đồ xanh rơi từ quái, có tới 6 dòng thuộc tính. Rê chuột lên món để xem.",
    "• Chuột phải món trong túi = mặc; chuột phải ô đang mặc = tháo.",
    "• Rê chuột lên trang bị trong túi: bên trái hiện món đang mặc cùng loại *(đã trang bị)* để so.",
    "## Dòng ẩn",
    "• Dòng 1, 3, 5 luôn có tác dụng. Dòng 2, 4, 6 là *dòng ẩn*: chữ xám = chưa được kích, chưa có tác dụng.",
    "• Cuối ô xem món ghi cách kích, vd *Cần hệ Thủy của Dây chuyền và Y phục để kích thuộc tính ẩn*.",
    "• Món đang mặc được kích bởi 3 nguồn: hệ của nhân vật và 2 món ở ô trang bị liên kết. Mỗi nguồn có hệ *sinh ra* hệ của món kích thêm 1 dòng ẩn (dòng 2 → 4 → 6).",
    "• Tương sinh: Kim sinh Thủy, Thủy sinh Mộc, Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim. Ô nào liên kết với ô nào: bấm *Hướng dẫn về ngũ hành!* phía trên danh sách mục.",
    "## Giữ đồ",
    "• Đồ có độ bền; sửa ở cửa hàng (nút *Sửa* rồi bấm món). *Shift + chuột phải* chồng đồ trong túi = tách.",
  ] },
  { ten: "Thuốc, cửa hàng", dong: (a) => {
    const R = L(a);
    return [
      `• *Ngô thần y* (Dược điếm Ba Lăng): thuốc máu, nội lực, cả hai. Mỗi lần mua tối đa ${R.mua || 60} bình; mang tối đa ${R.mang || 60} bình mọi loại.`,
      "• Nút *Mua tối đa* điền số bình còn mang được. *Shift + chuột phải* thuốc trong cửa hàng = mua ngay 1 bình.",
      "• Uống: chuột phải thuốc trong túi hoặc phím *1–9*; thẻ *Thuốc* của Trợ Thủ tự uống.",
      "• Bán: nút *Bán* của cửa hàng rồi bấm món. Sửa: nút *Sửa* rồi bấm trang bị.",
      "• *Tạp hóa*: Thổ Địa Phù… · *Thợ rèn*: vũ khí · *Mã phu* (Biện Kinh): ngựa.",
      "• *Chợ Trời*: nút hộp vàng ở thanh dưới (hoặc Chủ Chợ Trời ở Ba Lăng, Biện Kinh) — mua hàng người chơi bày bán; bày bán: Hành trang → Định giá → Lời rao → Rao bán (từ cấp 80).",
    ];
  } },
  { ten: "Rương, tiền", dong: (a) => {
    const T = L(a).tienTrang || {}, x = T.luongMotXu, y = T.luongBanXu, z = T.banXuNgay;
    return [
      "• *Rương chứa đồ* ở Ba Lăng (cạnh Tạp hóa): cất / lấy đồ, *Gửi tiền / Rút tiền*.",
      "• Khóa rương bằng mật mã (bàn phím số). Quên mật mã: *Lễ quan* → *Mở Pass Rương* (đăng ký, đúng ngày thứ 7 quay lại xác nhận).",
      "• *Túi tử mẫu* (nút Hành trang ở thanh dưới): túi phụ dùng ở mọi nơi, mở / gia hạn bằng *Tử Mẫu Lệnh* (+7 ngày).",
      ...(x ? [`• *Chủ tiền trang* (Ba Lăng, cùng hàng Lễ quan): đổi ngân lượng lấy Xu — ${fmtMoney(x)} = 1 Xu.${y > 0 && y < x ? ` Thu lại Xu: 1 Xu = ${fmtMoney(y)}, mỗi tài khoản tối đa ${z || 10} Xu mỗi ngày.` : ""}`] : []),
    ];
  } },
  { ten: "Tổ đội", dong: () => [
    "• *P* mở khung Lập nhóm: mời, nhận lời / từ chối, rời đội, trục xuất. Đội tối đa 8 người.",
    "• Đội trưởng rời đội hoặc thoát game thì đội giải tán.",
    "• Đồng đội cùng bãi, đứng gần nhau được *chia kinh nghiệm* như client.",
    "• *Vòng sáng* hỗ trợ (La Hán Trận, Thất Tinh Trận, các vòng Nga Mi…) có tác dụng cho đồng đội đứng trong tầm.",
    "• Kênh *Đội ngũ* ở khung chat: chỉ người cùng đội thấy. Bảng đội bên trái màn hình: bấm vào mở Lập nhóm.",
  ] },
  // giao dịch (anh 30/10 — may-chu/giao-dich.js, khung client 玩家间交易.ini)
  { ten: "Giao dịch", dong: () => [
    "## Mở giao dịch",
    "• Nút *Đóng mở giao dịch* ở thanh dưới (phím *T* / *O*; điện thoại: *Giao dịch* trong bảng Giang hồ). Đang mở thì trên đầu có *nguyên bảo*.",
    "• Người khác chỉ xin giao dịch được với người *đang mở giao dịch*, cùng bản đồ, đứng gần.",
    "• Xin giao dịch: *Ctrl + chuột phải* vào người đó → *Giao dịch* (điện thoại: *chạm giữ* người đó). Người kia bấm *Đồng ý* là khung giao dịch mở.",
    "## Trong khung",
    "• Bên phải là hành trang: bấm món rồi bấm ô ở lưới dưới bên trái để đặt (chuột phải: tự đặt vào ô trống; điện thoại: kéo thả). Ô tiền: gõ số hoặc nút *+ / −* (1 vạn mỗi lần) — đối phương thấy ngay số đang để.",
    "• Lưới trên là món + tiền của đối phương — rê chuột (chạm) vào món để xem.",
    "• *Đồng ý* = khóa phần của mình (không đổi được nữa; bấm lại để bỏ khóa — bỏ khóa thì cả 2 bên phải đồng ý lại). Hai bên cùng Đồng ý rồi bấm *Xác nhận*: bên sau xác nhận là giao.",
    "• Bên nào đổi tiền / món (kể cả sau khi bên kia đã Đồng ý) thì *cả 2 bên mất Đồng ý*, phải xem lại rồi Đồng ý lần nữa. Cạnh tên mỗi bên ghi *Chưa đồng ý / Đã đồng ý / Đã xác nhận*; tiền đối phương vừa đổi sẽ nháy đỏ.",
    "• *Hủy bỏ*, đóng khung, rời bản đồ hoặc thoát game: giao dịch hủy, đồ vẫn ở túi.",
    "• Túi không đủ chỗ / quá số bình thuốc mang được: chưa giao, dọn túi rồi xác nhận lại. Ngựa có hạn dùng không giao dịch được.",
    "## Khóa bảo hiểm",
    "• Vật phẩm nhận từ *Thưởng thăng cấp* và *Online nhận thưởng* được *khóa bảo hiểm vĩnh viễn* (dòng chữ xanh lá dưới tên món): không giao dịch, không bày bán, không vứt ra đất. Món mở ra từ món khóa cũng khóa.",
    "• Không cần nữa thì đến *Lễ quan* (Ba Lăng) → *Hủy vật phẩm*.",
    "## Vứt đồ ra đất",
    "• Món vứt ra đất (bấm món rồi bấm ra ngoài cửa sổ): mọi người cùng bản đồ đều thấy, ai nhặt trước được. Nằm khoảng 2 phút rồi mất.",
  ] },
  { ten: "Trạng thái, kháng", dong: (a) => {
    const Q = L(a).quaiVoCong || {};
    return [
      "• Biểu tượng góc trái trên: bùa / trạng thái đang có và thời gian còn. Rê chuột xem tác dụng.",
      "• Kháng ngũ hành giảm sát thương cùng hệ. *Bách Quả Lộ*: kháng tất cả +15 % trong 1 giờ.",
      ...(Q.bat ? [
        "## Quái có võ công",
        `• *Làm chậm* (chiêu băng): chạy và ra chiêu chậm một nửa ~${String(Math.round(((Q.cham || 60) / 18) * 10) / 10).replace(".", ",")} giây.`,
        "• *Trúng độc*: mất máu theo thời gian. *Choáng*: đứng im. *Giật*: bị ngắt chiêu đang ra.",
        "## Dòng đồ giảm",
        `• *Thời gian phục hồi* (giật — 100 là không giật), *Thời gian làm chậm* (tối đa ${Q.tglcToiDa || 77} %), *Thời gian choáng*, *Thời gian trúng độc*.`,
      ] : []),
    ];
  } },
  { ten: "Hoạt động", dong: () => [
    "• *Đăng nhập nhận thưởng* (nút cột bên phải): mỗi ngày nhận Xu, đăng nhập liên tục tới 42 ngày.",
    "• *Dã Tẩu* (Ba Lăng): nhiệm vụ chuỗi từ cấp 20, thưởng thêm theo mốc.",
    "• *Nhiếp Thí Trần* (Ba Lăng, cạnh Dã Tẩu): *Nhiệm vụ sát thủ* cấp 20–200 — hạ Boss Sát thủ nhận Sát Thủ Giản.",
    "• *Vượt Ải* (Nhiếp Thí Trần → Thử luyện sát thủ): ngày 4 lần, lần sau nộp gấp đôi (Sát Thủ Giản + ngân lượng); Sơ cấp 50–89, Cao cấp từ 90.",
    "• *Phong Lăng Độ*: thuyền theo lịch (mặc định mỗi giờ chẵn — xem *Hướng dẫn hoạt động*, nút cờ ở cột icon) ở bến Nam, báo danh 10 phút, cần môn phái + *Lệnh bài Phong Lăng Độ*; bờ Bắc +20 % kinh nghiệm.",
    "• *Đảo Tẩy Tủy* (Xa phu Ba Lăng → Đi đảo Tẩy Tủy): tẩy điểm kỹ năng (3 Thủy Tinh) / tiềm năng (6 Tinh Hồng Bảo Thạch), lần đầu miễn phí.",
    "• *Xếp hạng*: bấm ô Hạng ở dải trên màn hình.",
  ] },
  { ten: "Kỳ Trân Các, Xu", dong: () => [
    "• Nút *Bảo vật* ở thanh dưới mở Kỳ Trân Các: mua bằng *Xu*, chỉ mua ở thành / thôn (ở bãi vẫn xem được).",
    "• Xu có từ: Đăng nhập nhận thưởng, Chủ tiền trang (đổi ngân lượng), mã kích hoạt ở Lễ quan.",
    "• Có: lễ bao thuốc, Bạch Câu Hoàn (ủy thác), Tiên Thảo Lộ (kinh nghiệm ×2), sách võ công 90 / 120, bảo thạch, ngựa…",
  ] },
  { ten: "Lễ quan", dong: () => [
    "• *Lễ quan* ở Ba Lăng: *Nhập mã kích hoạt* để nhận quà.",
    "• *Mở Pass Rương*: quên mật mã rương thì đăng ký, đúng ngày thứ 7 sau đó quay lại xác nhận là rương mở khóa.",
    "• *Hủy vật phẩm*: đặt món trong hành trang vào khung rồi Xác nhận — hủy được mọi món, kể cả món khóa bảo hiểm. Đã hủy thì không lấy lại được.",
  ] },
  { ten: "Bố cục màn hình", dong: () => [
    "• *Trợ Thủ* → thẻ *Khác* → *Bố cục màn hình*: đánh dấu *Kéo thả bảng trên màn hình*.",
    "• Giữ chuột trái kéo bảng nhiệm vụ, đội ngũ, biểu tượng trạng thái, mộc nhân luyện công tới chỗ mới.",
    "• *Lưu bố cục*: giữ cho lần sau (theo nhân vật). *Mặc định*: về chỗ cũ.",
  ] },
];
