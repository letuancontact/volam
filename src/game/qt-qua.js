// Nhãn tiếng Việt cho thẻ Cấu hình của bảng quản trị F10 (anh 17/11 lần 2: "mấy cái như ủy thác còn tiếng việt anh còn hiểu, còn cái kia anh mở vô k dám
// sửa luôn" · "tab này khá khó hiểu" · "xem thử có cái quà nào mình bỏ sót k") — dùng ở src/game/qt-cauhinh.js.
//   DINH[mã mục của cau-hinh.json] = {
//     ten: tên trang, gt: 1–2 câu nói mục này làm gì,
//     f:   [[đường dẫn trong mục, nhãn, gợi ý]] — các ô hiện ở trang gọn (phần thưởng); còn lại ở "Mọi thông số (nâng cao)",
//     cot: nhãn khóa con — "a.b" (bỏ số thứ tự dòng; khóa là số thì viết "*") hoặc tên khóa; giá trị: chữ | [nhãn, gợi ý] | hàm(khóa) -> chữ,
//     dong: chữ đầu mỗi dòng của danh sách nhóm ("Mốc 1", "Bậc 2" — mặc định "Dòng"),
//     bang: tiêu đề cột của bảng [[…], […]] — chữ | { t, tong: 1 (dòng Tổng) | ts: 1 (trọng số: hiện ≈ % từng dòng) },
//     so:   nhãn từng ô của danh sách số — mảng chữ | hàm(i) | { nhan, tong: 1 } }.
//   Nghĩa từng số tra ở lời ghi của cau-hinh.json (_mục) và mã máy chủ; chỗ chưa chắc nghĩa thì để tên khóa gốc (không đoán).
//   NHOM_QUA: các nhóm của trang "🎁 Quà & thưởng". CHUNG: nhãn khóa hay gặp. TU: chữ của ô loại trong bảng ("kn", "xu"…).

export const TU = { kn: "Kinh nghiệm", mon: "Vật phẩm", xu: "Xu", tien: "Ngân lượng", biKip: "Bí kíp võ công 90 (ngẫu nhiên)" };

export const CHUNG = {
  bat: "Bật", cap: "Cấp tối thiểu", kn: "Kinh nghiệm", knCap: ["Kinh nghiệm theo cấp", "0,1 = 10 % kinh nghiệm lên 1 cấp của cấp đang có"],
  tien: "Ngân lượng", xu: "Xu", do: "Vật phẩm (nhận hết)", mon: "Vật phẩm", chon: "Bốc ngẫu nhiên 1 món trong", mot: "Bốc ngẫu nhiên 1 món trong",
  toiDa: "Tối đa", phi: "Phí", ruongXanh: "Bảo rương đồ xanh (số rương)", baoTruoc: "Báo trước (phút)", baoDanh: "Thời gian báo danh (phút)", k: "Vật phẩm",
};

const T100 = { t: "Tỉ lệ %", tong: 1 };
const BAN_DO = { 53: "Ba Lăng huyện", 37: "Biện Kinh" };

export const DINH = {
  // ---------- Nhận thưởng ----------
  thuongCap: {
    ten: "Thưởng thăng cấp",
    gt: "Esc → Nhận thưởng → Thưởng thăng cấp. Mỗi mốc cấp mỗi nhân vật nhận 1 lần (đủ cấp là nhận, đã qua mốc thì nhận bù). Thêm / bớt mốc: nút + Thêm dòng / Xóa dòng.",
    f: [[["bat"], "Bật"], [["moc"], "Các mốc cấp"]],
    cot: { "moc.cap": "Cấp", "moc.tien": "Ngân lượng", "moc.xu": "Xu", "moc.do": "Vật phẩm (nhận hết)", "moc.chon": ["Bốc ngẫu nhiên 1 món trong", "người nhận được 1 trong các món này"] },
    dong: { moc: "Mốc" },
  },
  thuongOnline: {
    ten: "Online nhận thưởng",
    gt: "Mỗi ngày (giờ Việt Nam) nhân vật online đủ số giờ của mốc thì nhận 1 lần ở Esc → Nhận thưởng → Online nhận thưởng. Ủy thác không tính giờ.",
    f: [[["bat"], "Bật"], [["moc"], "Các mốc giờ online"]],
    cot: { "moc.gio": "Online đủ (giờ)", "moc.kn": "Kinh nghiệm", "moc.tien": "Ngân lượng", "moc.xu": "Xu", "moc.do": "Vật phẩm (nhận hết)" },
    dong: { moc: "Mốc" },
  },
  dangNhap: {
    ten: "Đăng nhập nhận thưởng",
    gt: "Đăng nhập liên tục mỗi ngày nhận Xu theo ngày thứ 1 → 42 (mỗi tài khoản 1 lần / ngày). Bỏ 1 ngày thì về lại ngày 1. Qua 42 ngày: trả phí Xu để nhận tiếp thưởng ngày 42, hoặc nhận lại từ ngày 1.",
    f: [[["xu"], "Xu thưởng theo ngày"], [["gio"], "Giờ sang ngày mới", "giờ sáng, giờ Việt Nam"], [["phiTiep"], "Phí nhận tiếp sau ngày 42 (Xu)"]],
    cot: { xu: "Xu thưởng theo ngày", gio: ["Giờ sang ngày mới", "giờ sáng, giờ Việt Nam"], phiTiep: "Phí nhận tiếp sau ngày 42 (Xu)" },
    so: { xu: (i) => `Ngày ${i + 1}` },
  },
  phucDuyen: {
    ten: "Phúc duyên",
    gt: "Thời gian online đổi ra điểm phúc duyên ở Esc → Nhận thưởng → Phúc duyên; điểm tiêu ở cửa hàng của Thương nhân thần bí Liễu Ất.",
    f: [[["bat"], "Bật"], [["batDau"], "Điểm tặng lần đầu mở"], [["moiDiem"], "Số giây online đổi 1 điểm", "3600 = 1 giờ"],
      [["toiThieu"], "Phải tích lũy ít nhất (giây) mới đổi được", "7200 = 2 giờ"],
      [["suyGiam"], "Online quá chừng này giây thì chậm lại", "14400 = 4 giờ — sau đó gấp đôi số giây mới được 1 điểm"],
      [["lan2Them"], "Lần đổi thứ 2 trong ngày tặng thêm (điểm)"], [["toiDaMoiLan"], "Tối đa mỗi lần đổi (điểm)"]],
  },
  tanThu: {
    ten: "Vòng sáng tân thủ",
    gt: "Nhân vật dưới cấp đặt ở đây tự có vòng sáng: hồi sinh lực, nội lực mỗi giây và chạy nhanh hơn.",
    f: [[["capDuoi"], "Có vòng sáng khi dưới cấp"], [["hoiSinhLuc"], "Hồi sinh lực mỗi giây"], [["hoiNoiLuc"], "Hồi nội lực mỗi giây"], [["tocChay"], "Tốc độ chạy thêm (%)"]],
    cot: { vong: "Hình vòng sáng (mã trạng thái client)" },
  },
  // ---------- Rương ----------
  ruongXanh: {
    ten: "Bảo rương đồ xanh",
    gt: "Mở ra 1 món trang bị xanh ngẫu nhiên (cấp món theo cấp người mở, ngũ hành ngẫu nhiên). Số rương mỗi nơi phát sửa ở trang của nơi đó: Vượt Ải, Dã Tẩu (xong 40 nhiệm vụ / ngày), Boss thế giới, Phong Hỏa, Võ Lâm Minh Chủ, Viêm Đế.",
    f: [[["soDong"], "Tỉ lệ ra số dòng (%)", "tổng nên bằng 100"], [["oTrong"], "Hành trang cần trống ít nhất (ô) mới mở được"]],
    cot: { k: "Vật phẩm rương", viemDe: ["Viêm Đế (không dùng)", "số rương Viêm Đế sửa ở trang Viêm Đế Bảo Tàng"] },
    so: { soDong: { nhan: (i) => `${i} dòng`, tong: 1 } },
  },
  ruongThanBi: {
    ten: "Rương Thần Bí",
    gt: "Đúng giờ mỗi ngày ra vài rương ở bãi train ngẫu nhiên (bãi cấp 90 trở lên); người đủ cấp đứng gần bấm mở trước được 1 phần thưởng bốc theo trọng số.",
    f: [[["bat"], "Bật"], [["gio"], "Giờ ra rương (giờ Việt Nam)"], [["so"], "Số rương mỗi lần"], [["capMo"], "Cấp tối thiểu để mở"],
      [["song"], "Rương còn trong (phút)", "không ai mở thì biến mất"], [["thuong"], "Phần thưởng (bốc 1 theo trọng số)", "trọng số càng lớn càng dễ ra"]],
    cot: { gan: "Khoảng cách mở rương", vuaCap: ["Chỉ ra ở bãi người chơi đủ cấp vào được", "bỏ chọn: mọi bãi từ cấp 90"] },
    bang: { thuong: ["Loại", "Giá trị / vật phẩm", { t: "Trọng số", ts: 1 }] },
  },
  // ---------- Nhiệm vụ hằng ngày ----------
  daTau: {
    ten: "Dã Tẩu",
    gt: "Quà nhiệm vụ Dã Tẩu: hệ số kinh nghiệm / tiền mỗi nhiệm vụ, quà theo số nhiệm vụ xong trong ngày, quà mốc chuỗi (như client), quà theo tổng từ trước tới nay, và Bảo rương thần bí của Dã Tẩu.",
    f: [[["heSoKn"], "Hệ số kinh nghiệm mỗi nhiệm vụ", "2 = gấp đôi client"], [["heSoTien"], "Hệ số tiền mỗi nhiệm vụ", "2 = gấp đôi client"],
      [["mocNgay"], "Quà theo số nhiệm vụ xong trong ngày"],
      [["mocChuoi"], "Quà mốc chuỗi nhiệm vụ (như client)", "có dòng Đúng mốc N thì nhận gói đó; không thì gói Mỗi N lớn nhất chia hết"],
      [["mocTong"], "Quà theo tổng nhiệm vụ đã xong từ trước tới nay"],
      [["thuongBac"], "Thưởng thêm mỗi bậc", "0,05 = +5 % mỗi bậc (bậc = tổng đã xong / số mỗi bậc)"],
      [["ruong", "moi"], "Mỗi … nhiệm vụ được 1 Bảo rương thần bí"], [["ruong", "chuy"], "Số Huyền Thiên Chùy để mở 1 rương"],
      [["ruong", "bang"], "Quà trong Bảo rương thần bí (bốc 1)"], [["oVatCoDinh"], "Ô Vật phẩm: món có tỉ lệ cố định", "bốc trước; trượt thì chọn như client"]],
    cot: {
      "mocNgay.*": (k) => `Xong ${k} nhiệm vụ trong ngày`, "mocTong.*": (k) => `Tổng ${k} nhiệm vụ`,
      "mocChuoi.moi": ["Mỗi N nhiệm vụ", "gói lặp lại ở mọi bội số"], "mocChuoi.moc": ["Đúng mốc N nhiệm vụ", ""],
      capNhan: "Cấp nhận nhiệm vụ", gioiHan: "Tối đa nhiệm vụ mỗi ngày", moiBac: "Số nhiệm vụ mỗi bậc", bacToiDa: "Bậc tối đa",
      khoBac: ["Mỗi … bậc nhiệm vụ khó lên 1 nấc", "0 = tắt"], boThuong: "Loại món bỏ khỏi bảng thưởng",
      ruong: "Bảo rương thần bí", "ruong.moi": "Mỗi … nhiệm vụ được 1 rương", "ruong.chuy": "Số Huyền Thiên Chùy để mở", "ruong.bang": "Quà trong rương (bốc 1)",
      oVatCoDinh: "Ô Vật phẩm: món có tỉ lệ cố định", heSoKn: "Hệ số kinh nghiệm mỗi nhiệm vụ", heSoTien: "Hệ số tiền mỗi nhiệm vụ", thuongBac: "Thưởng thêm mỗi bậc",
      xongNhanh: "Hoàn thành ngay (nộp Sơn Hà Xã Tắc)", "xongNhanh.shxt": "Số mảnh Sơn Hà Xã Tắc", "xongNhanh.lenh": "Lệnh bài",
      choHt: "Giá sạp Hệ thống (Chợ trời)", tamBo: "Món tạm không giao (Tìm vật phẩm)",
    },
    dong: { mocChuoi: "Mốc" },
    bang: { "ruong.bang": ["Vật phẩm / loại", "Số", T100], oVatCoDinh: ["Vật phẩm", "Tỉ lệ %"] },
    pt: { thuongBac: 1 },
  },
  minhChu: {
    ten: "Võ Lâm Minh Chủ",
    gt: "3 nhiệm vụ hằng ngày ở Hắc Bạch Sứ Giả (Biện Kinh / Ba Lăng), mỗi loại 1 lần mỗi ngày: Tiêu Diệt Ác Bá, Giao Thư Tuyệt Mật, Thu Thập Nguyên Liệu.",
    f: [[["bat"], "Bật"], [["cap"], "Cấp tối thiểu"], [["ruongXanh"], "Bảo rương đồ xanh mỗi nhiệm vụ trả xong"],
      [["giet", "kn"], "Tiêu Diệt Ác Bá: kinh nghiệm"], [["giet", "can"], "Tiêu Diệt Ác Bá: số quái cần hạ"],
      [["thu", "kn"], "Giao Thư Tuyệt Mật: kinh nghiệm"], [["hai", "kn"], "Thu Thập Nguyên Liệu: kinh nghiệm"], [["hai", "can"], "Thu Thập Nguyên Liệu: số cây cần hái"]],
    cot: {
      giet: "Tiêu Diệt Ác Bá", thu: "Giao Thư Tuyệt Mật", hai: "Thu Thập Nguyên Liệu", ve: "Quái canh cây",
      "giet.can": "Số quái cần hạ", "giet.duoi": "Bãi thấp hơn tối đa (cấp)", "giet.bao": "Báo tiến độ mỗi (con)", "thu.mon": "Thư nhận",
      "hai.can": "Số cây cần hái", "hai.giay": "Mỗi lần hái (giây)", "hai.hoi": "Cây mọc lại sau (giây)", "hai.gan": "Khoảng cách hái",
      "ve.ten": "Tên", "ve.tpl": "Mẫu quái (hình)", "ve.lv": "Cấp", "ve.mau": "Máu", "ve.hoi": "Sống lại sau (giây)", "ve.hoiCum": "Cả cụm sống lại cùng lúc",
      "ve.thay": "Tầm thấy người", "ve.stGiay": "Sát thương tối đa nhận mỗi giây / người", "ve.gan": "Khoảng cách tính sát thương",
      ruongXanh: "Bảo rương đồ xanh mỗi nhiệm vụ trả xong",
    },
  },
  phongLangDo: {
    ten: "Phong Lăng Độ",
    gt: "Thuyền Phong Lăng Độ giờ chẵn: hạ Thủy tặc đầu lĩnh được kinh nghiệm; bờ Bắc đánh quái được thêm kinh nghiệm.",
    f: [[["thuongDauLinh"], "Hạ Thủy tặc đầu lĩnh: kinh nghiệm", "số client"], [["bacKinhNghiem"], "Bờ Bắc: hệ số kinh nghiệm", "1,2 = +20 %"],
      [["veNamGia"], "Thuyền về bờ Nam: giá (lượng)"], [["matDoCan"], "Vé thay bằng Mật đồ thần bí (số)"]],
    cot: {
      gio: "Giờ có thuyền (giờ Việt Nam)", toiDa: "Người tối đa mỗi thuyền", thuyTac: "Thủy tặc mỗi đợt", dotThuyTac: "Các phút ra Thủy tặc",
      songToiDa: "Thủy tặc sống tối đa trên thuyền", dauLinh: "Các phút ra đầu lĩnh", capBo: "Phút cập bờ Bắc", lenhBai: "Lệnh bài", matDo: "Mật đồ thần bí",
      thuongDauLinh: "Hạ Thủy tặc đầu lĩnh: kinh nghiệm", bacKinhNghiem: "Bờ Bắc: hệ số kinh nghiệm", veNamGia: "Thuyền về bờ Nam: giá (lượng)", matDoCan: "Vé thay bằng Mật đồ thần bí (số)",
    },
  },
  // ---------- Hoạt động theo giờ ----------
  bossTheGioi: {
    ten: "Boss thế giới",
    gt: "Boss Hoàng Kim theo giờ ở Ba Lăng / Biện Kinh. Kinh nghiệm chia theo % sát thương; quà theo hạng sát thương; người kết liễu thêm quà; đồ hiếm xét riêng từng món; ai có sát thương nhận quà tham gia.",
    f: [[["kn"], "Tổng kinh nghiệm", "chia theo % sát thương"], [["knIt"], "Kinh nghiệm ít nhất"], [["nguong"], "… cho người đạt từ (% sát thương)"],
      [["thamGia"], "Quà tham gia: Bảo rương đồ xanh mỗi người"], [["xuTl"], "Quà tham gia: tỉ lệ được 1 Xu (%)"],
      [["hang"], "Quà theo hạng sát thương", "mỗi người lấy bậc đầu tiên có Tới hạng ≥ hạng của mình"], [["kich"], "Quà người kết liễu"],
      [["hiem"], "Đồ hiếm (xét riêng từng món)"], [["danhMa"], "Tỉ lệ ra ngựa danh mã (%)", "trong quà kết liễu khi Xét ngựa danh mã = 1"]],
    cot: {
      "hang.den": "Tới hạng", "hang.mon": "Nhận hết", "hang.mot": "Bốc ngẫu nhiên 1 món trong", "hang.hiem": ["Xét đồ hiếm", "1 = có, 0 = không"],
      kich: "Quà người kết liễu", "kich.kn": "Kinh nghiệm", "kich.mon": "Nhận hết", "kich.mot": "Bốc ngẫu nhiên 1 món trong", "kich.hiem": ["Xét đồ hiếm", "1 = có"], "kich.ma": ["Xét ngựa danh mã", "1 = có"],
      bat: "Bật lịch", gio: "Giờ xuất hiện (giờ Việt Nam)", song: "Boss sống (phút)", mau: "Máu gốc", so: "Số boss mỗi khung giờ",
      mauNguoi: "Máu thêm mỗi người tham gia", stNguoi: "Sát thương boss thêm mỗi người tham gia (%)", stGiay: "Sát thương tối đa máy chủ nhận mỗi giây / người",
      thamGia: "Quà tham gia: Bảo rương đồ xanh mỗi người", xuTl: "Quà tham gia: tỉ lệ được 1 Xu (%)", kn: ["Tổng kinh nghiệm", "chia theo % sát thương"], knIt: "Kinh nghiệm ít nhất",
      nguong: "… cho người đạt từ (% sát thương)", hang: "Quà theo hạng sát thương", hiem: "Đồ hiếm (xét riêng từng món)", danhMa: "Tỉ lệ ra ngựa danh mã (%)",
      vong: "Độc vùng quanh boss", nhin: "Tầm nhắm người lúc chưa ai đánh", duoi: "Tầm boss đuổi", vung: "Ra khỏi vùng này boss bỏ hẳn", cho: "Chỗ xuất hiện",
    },
    dong: { hang: "Bậc", cho: "Chỗ" },
    bang: { hiem: ["Vật phẩm", "Số", "Tỉ lệ %"] },
  },
  sanNhim: {
    ten: "Săn Nhím Béo Phì",
    gt: "Theo giờ, nhím béo phì xuất hiện rải rác ở Ba Lăng / Biện Kinh. Người ra đòn kết liễu được kinh nghiệm + 1 món; người phát hiện (đánh trúng đầu tiên) và người tham gia cũng có thưởng.",
    f: [[["bat"], "Bật lịch"], [["gio"], "Giờ mở đợt (giờ Việt Nam)"], [["ngay"], "Mỗi người bắt tối đa (con / ngày)"],
      [["kn"], "Người kết liễu: kinh nghiệm"], [["mon"], "Người kết liễu: bốc 1 món trong"], [["hiemTl"], "Tỉ lệ bốc món hiếm thay vào (%)"], [["hiem"], "Món hiếm"],
      [["phatKn"], "Người phát hiện: kinh nghiệm"], [["phatXu"], "Người phát hiện: tỉ lệ được 1 Xu (%)"],
      [["thamKn"], "Người tham gia: kinh nghiệm"], [["thamXu"], "Người tham gia: tỉ lệ được 1 Xu (%)"]],
    cot: {
      phut: "Mỗi đợt kéo dài (phút)", so: "Số nhím mỗi đợt", "so.*": (k) => BAN_DO[k] || `Bản đồ ${k}`, tpl: "Mẫu quái (hình)", ten: "Tên", lv: "Cấp nhím", mau: "Máu mỗi con",
      stGiay: "Sát thương tối đa nhận mỗi giây / người", gan: "Khoảng cách đánh", ngay: "Mỗi người bắt tối đa (con / ngày)", hiemTl: "Tỉ lệ bốc món hiếm (%)", hiem: "Món hiếm",
      kn: "Người kết liễu: kinh nghiệm", mon: "Người kết liễu: bốc 1 món trong", phatKn: "Người phát hiện: kinh nghiệm", phatXu: "Người phát hiện: tỉ lệ được 1 Xu (%)",
      thamKn: "Người tham gia: kinh nghiệm", thamXu: "Người tham gia: tỉ lệ được 1 Xu (%)",
    },
  },
  phuQuy: {
    ten: "Phú Quý Cẩm Hạp",
    gt: "Thần Tài (Biện Kinh) bán Phú quý cẩm hạp; dùng hộp chọn 1 số 10–99 và được kinh nghiệm. Đúng giờ quay máy chủ bốc 9 số thường + 1 số đặc biệt; ai trúng đến Thần Tài nhận thưởng.",
    f: [[["bat"], "Bật"], [["gia"], "Giá 1 hộp (Xu)"], [["cap"], "Cấp tối thiểu"], [["toiDa"], "Tối đa hộp mỗi nhân vật mỗi đợt"], [["kn"], "Dùng hộp: kinh nghiệm"],
      [["quay"], "Giờ quay số (giờ Việt Nam)"], [["hetNhan"], "Hạn nhận thưởng (giờ hôm sau)"],
      [["thuong", "kn"], "Trúng số thường: kinh nghiệm"], [["thuong", "mon"], "Trúng số thường: vật phẩm"], [["thuong", "toiDa"], "Trúng số thường: tối đa lần nhận mỗi đợt"],
      [["dacBiet", "kn"], "Trúng số đặc biệt: kinh nghiệm"], [["dacBiet", "mon"], "Trúng số đặc biệt: vật phẩm"], [["dacBiet", "toiDa"], "Trúng số đặc biệt: tối đa lần nhận mỗi đợt"]],
    cot: {
      mon: "Hộp bán", gia: "Giá 1 hộp (Xu)", baiNpc: "Chỗ Thần Tài", thuong: "Trúng số thường", dacBiet: "Trúng số đặc biệt", quay: "Giờ quay số", hetNhan: "Hạn nhận thưởng (giờ hôm sau)",
      toiDa: "Tối đa hộp mỗi nhân vật mỗi đợt", "thuong.mon": "Vật phẩm trúng thưởng", "dacBiet.mon": "Vật phẩm trúng thưởng", // soát chéo: trước rơi về nhãn "Hộp bán"
      "thuong.toiDa": "Tối đa lần nhận mỗi đợt", "dacBiet.toiDa": "Tối đa lần nhận mỗi đợt", "thuong.kn": "Kinh nghiệm", "dacBiet.kn": "Kinh nghiệm",
    },
  },
  tongKim: {
    ten: "Tống Kim",
    gt: "Thưởng cuối trận cho người đã báo danh có đủ điểm: điểm Tống Kim, kinh nghiệm, Nhạc Vương Hồn Thạch, Huân công bài; Quân Nhu quan (Biện Kinh) đổi điểm Tống Kim lấy vật phẩm.",
    f: [[["thuong", "diemMin"], "Điểm trận tối thiểu để có thưởng"], [["thuong", "thang"], "Phe thắng: điểm Tống Kim cộng thêm"], [["thuong", "thua"], "Phe thua: điểm Tống Kim cộng thêm"],
      [["thuong", "knHs"], "Hệ số kinh nghiệm", "kinh nghiệm = điểm trận × (700 + 100 mỗi 5 cấp trên 40) × hệ số"], [["thuong", "knToiDa"], "Kinh nghiệm tối đa mỗi trận"],
      [["thuong", "ht"], "Nhạc Vương Hồn Thạch"], [["thuong", "htMoc"], "Hồn Thạch: thêm khi đạt (điểm trận)"], [["thuong", "htThem"], "Hồn Thạch: số thêm"],
      [["thuong", "htSoai"], "Hồn Thạch: người đánh Nguyên Soái địch nhiều nhất thêm"], [["thuong", "hcDiem"], "Huân công bài: phe thắng, từ (điểm trận)"],
      [["thuong", "hcNgay"], "Huân công bài: tối đa mỗi ngày"],
      [["quanNhu"], "Quân Nhu quan: vật phẩm và giá"], [["duc", "can"], "Đúc Nhạc Vương Kiếm: số Hồn Thạch"]],
    cot: {
      thuong: "Thưởng cuối trận", "thuong.khoa": ["Khóa bảo hiểm Hồn Thạch", "0 = không khóa"], "thuong.htMon": "Hồn Thạch", "thuong.hcMon": "Huân công bài",
      "thuong.roiGiu": "Rời trận chưa quá (giây) vẫn có thưởng", "thuong.diemMin": "Điểm trận tối thiểu để có thưởng", "thuong.thang": "Phe thắng: điểm cộng thêm",
      "thuong.thua": "Phe thua: điểm cộng thêm", "thuong.knHs": "Hệ số kinh nghiệm", "thuong.knToiDa": "Kinh nghiệm tối đa mỗi trận", "thuong.ht": "Nhạc Vương Hồn Thạch",
      "thuong.htMoc": "Hồn Thạch: thêm khi đạt (điểm trận)", "thuong.htThem": "Hồn Thạch: số thêm", "thuong.htSoai": "Hồn Thạch: người đánh Nguyên Soái nhiều nhất thêm",
      "thuong.hcDiem": "Huân công bài: từ (điểm trận)", "thuong.hcNgay": "Huân công bài: tối đa mỗi ngày",
      // soát chéo 17/11: máy chủ lấy bảng kinh nghiệm của Huân công bài ở món ms:1773 (ky-tran-cac.json dung.kn) — số ở đây không dùng
      "thuong.hcKn": ["Huân công bài: kinh nghiệm (không dùng)", "bảng thật nằm ở món Huân công bài (ky-tran-cac.json) — sửa ở đây không có tác dụng"],
      quanNhu: "Quân Nhu quan: vật phẩm và giá", duc: "Đúc Nhạc Vương Kiếm", "duc.can": "Số Hồn Thạch", "duc.mon": "Món đúc ra", gio: "Giờ mở (giờ Việt Nam)",
    },
    so: { "thuong.ht": ["Thắng", "Thua"] },
    bang: { "thuong.hcKn": ["Kinh nghiệm", "Tỉ lệ (không dùng)"], quanNhu: ["Vật phẩm", "Giá (điểm Tống Kim)"] },
  },
  phongHoa: {
    ten: "Phong Hỏa Liên Thành",
    gt: "Thủ thành theo giờ. Thắng trận: người còn trong trận nhận kinh nghiệm theo mức kiếm được trong trận (+ Bảo rương đồ xanh khi đạt mức cao); hạ quân địch có thể rơi đồ và Xu.",
    f: [[["thuong", "nhan"], "Thắng: nhân thưởng ×"], [["thuong", "duoi"], "Kinh nghiệm kiếm trong trận từ (mức thấp)", "số client"],
      [["thuong", "tren"], "Kinh nghiệm kiếm trong trận từ (mức cao — nhận tối đa)", "số client"], [["thuong", "toiDa"], "Thưởng kinh nghiệm tối đa"],
      [["thuong", "ruongXanh"], "Thắng + đạt mức cao: Bảo rương đồ xanh mỗi người"],
      [["roi", "ds"], "Hạ quân: rơi đồ cho người đánh nhiều nhất", "0,005 = 0,5 %"], [["roi", "xu"], "Hạ quân: Xu vào thẳng", "tỉ lệ 0,001 = 0,1 %"]],
    cot: {
      thuong: "Thưởng thắng trận", "thuong.nhan": "Nhân thưởng ×", "thuong.duoi": "Kinh nghiệm trong trận từ (mức thấp)", "thuong.tren": "Kinh nghiệm trong trận từ (mức cao)",
      "thuong.toiDa": "Thưởng kinh nghiệm tối đa", roi: "Rơi khi hạ quân", "roi.loai": "Loại quân có rơi", "roi.ds": "Đồ rơi", "roi.xu": "Xu vào thẳng",
      gio: "Giờ mở (giờ Việt Nam)", danh: "Thời gian đánh (phút)",
    },
    bang: { "roi.ds": [{ t: "Tỉ lệ", pt: 1 }, "Vật phẩm (bốc 1)"] },
    so: { "roi.xu": ["Tỉ lệ", "Ít nhất", "Nhiều nhất"] },
  },
  duaNgua: {
    ten: "Đua ngựa",
    // soát chéo 17/11: vật phẩm và Xu chung 1 lần bốc (dua-ngua.js: 1 số ngẫu nhiên 0–100 đi qua bảng Vật phẩm rồi bảng Xu)
    gt: "Truy Phong Đại Loạn Đấu: người về đích theo hạng nhận kinh nghiệm; hạng 1–10 bốc thêm 1 lần: HOẶC vật phẩm HOẶC Xu (không khóa) — trúng vật phẩm thì không có Xu.",
    f: [[["kn"], "Kinh nghiệm theo hạng"], [["mon"], "Hạng 1–10: bốc vật phẩm", "chung 1 lần bốc với bảng Xu — tổng % Vật phẩm + Xu ≤ 100"],
      [["xu"], "Hạng 1–10: bốc Xu", "chỉ xét khi không trúng vật phẩm — cùng 1 lần bốc"], [["soVe"], "Số người về đích có thưởng"],
      [["capMin"], "Cấp tối thiểu"], [["toiDa"], "Số người tối đa mỗi lượt"]],
    cot: {
      bat: "Bật lịch", gio: "Giờ mở báo danh (giờ Việt Nam)", dua: "Đua tối đa (phút)", dongTruoc: "Đóng báo danh trước giờ chạy (giây)", capMin: "Cấp tối thiểu", toiDa: "Số người tối đa mỗi lượt",
      soVe: "Số người về đích có thưởng", kn: "Kinh nghiệm theo hạng", mon: "Hạng 1–10: bốc vật phẩm", xu: "Hạng 1–10: bốc Xu",
      hopDau: "Đợt hộp đầu sau xuất phát (giây)", hopMoi: "Giữa 2 đợt hộp (giây)", hopSong: "Hộp còn (giây)", hopSo: "Số hộp mỗi đợt", hopGan: "Khoảng cách nhận hộp",
      tui: "Số ô đạo cụ đua", ten: "Tên hoạt động",
    },
    so: { kn: ["Hạng 1–10", "Hạng 11–20", "Hạng 21 trở đi"] }, // tới "Số người về đích có thưởng"
    bang: { mon: ["Vật phẩm", "Số", "Tỉ lệ %"], xu: ["Số Xu", "Tỉ lệ %"] },
  },
  // ---------- Phó bản tổ đội ----------
  vuotAi: {
    ten: "Vượt Ải",
    gt: "Thưởng Vượt Ải tổ đội: kinh nghiệm mỗi đám / xong ải (theo phút như client) nhân các hệ số; boss ải rơi hộp lễ bao; quái ải rơi thuốc; xong trọn ải mỗi người được Bảo rương đồ xanh và cả đội quay Xu.",
    f: [[["kinhNghiem"], "Hệ số kinh nghiệm chung"], [["doiTruong"], "Hệ số đội trưởng", "đi 1 mình cũng là đội trưởng"], [["caoCap"], "Hệ số ải bậc cao"],
      [["ruongXanh"], "Xong trọn ải: Bảo rương đồ xanh mỗi người"], [["xuDoi"], "Xong trọn ải: tỉ lệ quay Xu", "× (số người − 1); 0,05 = 5 %"],
      [["xuSo"], "Xong trọn ải: trúng thì mỗi người nhận (Xu)"],
      [["leBao", "roi"], "Boss ải: tỉ lệ rơi hộp lễ bao", "0,38 = 38 %"], [["leBao", "kn"], "Mở hộp: kinh nghiệm"], [["leBao", "tiLeXu"], "Mở hộp: tỉ lệ ra Xu", "0,05 = 5 %"],
      [["leBao", "xu"], "Mở hộp ra Xu: mấy Xu (trọng số)"], [["leBao", "tiLeTtl"], "Mở hộp: tỉ lệ ra Tiên Thảo Lộ", "0,05 = 5 %"],
      [["thuoc", "tiLe"], "Quái ải: tỉ lệ rơi thuốc", "0,08 = 8 %"], [["thuoc", "n"], "Quái ải: số bình thuốc"]],
    cot: {
      "leBao.xu.*": (k) => `${k} Xu`, luot: "Số lượt", gian: "Nộp Sát Thủ Giản theo lần", tien: "Nộp ngân lượng theo lần", leBao: "Hộp lễ bao", "leBao.k": "Hộp",
      "leBao.ttl": "Tiên Thảo Lộ", "leBao.roi": "Boss ải: tỉ lệ rơi hộp", "leBao.tiLeXu": "Tỉ lệ ra Xu", "leBao.xu": "Mấy Xu (trọng số)", "leBao.tiLeTtl": "Tỉ lệ ra Tiên Thảo Lộ",
      thuoc: "Thuốc rơi từ quái ải", "thuoc.k": "Thuốc", "thuoc.n": "Số bình", "thuoc.tiLe": "Tỉ lệ rơi", toiThieu: "Số người tối thiểu", heSo: "Độ mạnh quái theo số người",
      "heSo.goc": "Hệ số gốc", "heSo.them": "Mỗi người thêm", kinhNghiem: "Hệ số kinh nghiệm chung", doiTruong: "Hệ số đội trưởng", caoCap: "Hệ số ải bậc cao",
      xuDoi: "Xong trọn ải: tỉ lệ quay Xu", xuSo: "Xong trọn ải: Xu mỗi người", ruongXanh: "Xong trọn ải: Bảo rương đồ xanh mỗi người",
    },
    so: { gian: (i) => `Lần ${i + 1}`, tien: (i) => `Lần ${i + 1}`, "thuoc.n": ["Ít nhất", "Nhiều nhất"] },
    pt: { "leBao.roi": 1, "leBao.tiLeXu": 1, "leBao.tiLeTtl": 1, "thuoc.tiLe": 1, xuDoi: 1 },
  },
  viemDe: {
    ten: "Viêm Đế Bảo Tàng",
    gt: "Phó bản tổ đội. Kinh nghiệm theo boss hạ được; qua ải được Viêm Đế Bí Bảo (mở bằng chìa Như Ý / Vàng ra kinh nghiệm); hạ Lương Mi Nhi mỗi người được Bảo rương đồ xanh, cả đội quay Xu.",
    f: [[["kn", "boss"], "Boss ải: kinh nghiệm", "số client, quy theo cấp"], [["kn", "noAi"], "Boss Nộ ải 3 / 6: kinh nghiệm"], [["kn", "no"], "4 boss Nộ trung tâm: kinh nghiệm"],
      [["kn", "cuoi"], "Lương Mi Nhi: kinh nghiệm"], [["kn", "lenh"], "Vào bằng Viêm Đế Lệnh: kinh nghiệm ×"],
      [["ruongXanh"], "Hạ Lương Mi Nhi: Bảo rương đồ xanh mỗi người"], [["doi", "xuTl"], "Hạ Lương Mi Nhi: tỉ lệ quay Xu", "× (số người − 1); 0,05 = 5 %"],
      [["doi", "xu"], "Hạ Lương Mi Nhi: trúng thì mỗi người nhận (Xu)"], [["biBaoAi"], "Qua các ải này mỗi người +1 Viêm Đế Bí Bảo"],
      [["moKhoa", "nhuY"], "Mở Bí Bảo bằng chìa Như Ý (bốc 1)"], [["moKhoa", "vang"], "Mở Bí Bảo bằng chìa Vàng (bốc 1)"],
      [["ngaHoa", "boss"], "Boss ải rơi thuốc (bình, chia đều)"], [["ngaHoa", "no"], "Boss Nộ trung tâm rơi thuốc (bình)"],
      [["hinhNhanTl", "boss"], "Boss ải: tỉ lệ rơi Hình nhân", "0,5 = 50 %"], [["hinhNhanTl", "no"], "Boss Nộ trung tâm: tỉ lệ rơi Hình nhân", "1 = chắc chắn"]],
    cot: {
      kn: "Kinh nghiệm", "kn.capGoc": "Cấp gốc quy đổi kinh nghiệm", "kn.boss": "Boss ải", "kn.noAi": "Boss Nộ ải 3 / 6", "kn.no": "4 boss Nộ trung tâm", "kn.cuoi": "Lương Mi Nhi",
      "kn.lenh": "Vào bằng Viêm Đế Lệnh ×", moKhoa: "Mở Viêm Đế Bí Bảo", "moKhoa.nhuY": "Chìa Như Ý", "moKhoa.vang": "Chìa Vàng", ngaHoa: "Thuốc rơi", "ngaHoa.k": "Thuốc",
      "ngaHoa.boss": "Boss ải (bình)", "ngaHoa.no": "Boss Nộ trung tâm (bình)", hinhNhanTl: "Tỉ lệ rơi Hình nhân", "hinhNhanTl.boss": "Boss ải", "hinhNhanTl.no": "Boss Nộ trung tâm",
      biBaoAi: "Qua các ải này +1 Viêm Đế Bí Bảo", doi: "Theo số người trong đội", "doi.toiThieu": "Số người tối thiểu", "doi.goc": "Hệ số gốc", "doi.them": "Mỗi người thêm",
      "doi.xuTl": "Tỉ lệ quay Xu", "doi.xu": "Xu mỗi người", ruongXanh: "Hạ Lương Mi Nhi: Bảo rương đồ xanh mỗi người",
    },
    // soát chéo 17/11: cột 2 là TRỌNG SỐ (viem-de.js chonBang bốc theo tổng) — hiện ≈ % thật từng dòng
    bang: { "moKhoa.nhuY": ["Kinh nghiệm (số client)", { t: "Trọng số", ts: 1 }], "moKhoa.vang": ["Kinh nghiệm (số client)", { t: "Trọng số", ts: 1 }] },
    pt: { "doi.xuTl": 1, "hinhNhanTl.boss": 1, "hinhNhanTl.no": 1 },
  },
  // ---------- Sự kiện ----------
  baoDapAnSu: {
    ten: "Báo Đáp Ân Sư (sự kiện)",
    gt: "Sự kiện tháng 11: mời Võ Sư (Ba Lăng) rượu Đỗ Khang Tửu, dâng và mở các loại Hương Bao để nhận kinh nghiệm và vật phẩm. Quản trị vào được cả ngoài ngày sự kiện.",
    // soát chéo 17/11: den / moHet là mốc KẾT THÚC (máy chủ: ngày < den) — sự kiện chạy tới hết ngày trước đó
    f: [[["bat"], "Bật"], [["tu"], "Bắt đầu từ ngày", "năm-tháng-ngày, giờ Việt Nam"], [["den"], "Kết thúc lúc 0 giờ ngày", "không gồm ngày này — muốn chạy hết ngày X thì đặt X + 1"],
      [["moHet"], "Hết mở hương bao lúc 0 giờ ngày", "không gồm ngày này"], [["ruou", "kn"], "Đỗ Khang Tửu: mỗi bình bốc 1 dòng"],
      [["ruou", "knNgay"], "Đỗ Khang Tửu: kinh nghiệm tối đa mỗi ngày", "hết trần vẫn nhận trà"], [["dang", "kn"], "Dâng Ngũ Sắc Hương Bao: kinh nghiệm mỗi cái"],
      [["dang", "lanNgay"], "Dâng Ngũ Sắc Hương Bao: tối đa lần mỗi ngày"], [["knHbToiDa"], "Mở hương bao: kinh nghiệm tối đa cả sự kiện / nhân vật", "0 = không giới hạn (anh 17/11: giới hạn theo số lần mở bên dưới)"],
      [["moToiDa", "tt"], "Tơ Tằm Hương Bao: mở tối đa (cái / nhân vật cả sự kiện)", "0 = không giới hạn"], [["moToiDa", "ns"], "Ngũ Sắc Hương Bao: mở tối đa", "cái cuối chắc chắn ra 1 món ở dòng quà mốc"],
      [["moToiDa", "td"], "Trung Dược Hương Bao: mở tối đa", "cái cuối chắc chắn ra 1 món ở dòng quà mốc"], [["bao", "tt"], "Tơ Tằm: quà mốc (cái cuối)", "món chưa từng mở ra; có đủ thì ngẫu nhiên"], [["bao", "ns"], "Ngũ Sắc: quà mốc (cái cuối)", "món chưa từng mở ra; có đủ thì ngẫu nhiên"],
      [["bao", "td"], "Trung Dược: quà mốc (cái cuối)", "món chưa từng mở ra; có đủ thì ngẫu nhiên"],
      [["hb", "tt", "kn"], "Tơ Tằm Hương Bao: kinh nghiệm (bốc 1)"], [["hb", "tt", "mon"], "Tơ Tằm Hương Bao: vật phẩm (bốc thêm 1)", "tổng dưới 100 % thì phần còn lại không ra món (anh 18/11)"], [["hb", "ns", "kn"], "Ngũ Sắc Hương Bao: kinh nghiệm (bốc 1)"],
      [["hb", "ns", "mon"], "Ngũ Sắc Hương Bao: vật phẩm (bốc thêm 1)"], [["hb", "td", "kn"], "Trung Dược Hương Bao: kinh nghiệm (bốc 1)"],
      [["hb", "td", "mon"], "Trung Dược Hương Bao: vật phẩm (bốc thêm 1)"], [["loaKn"], "Báo cả máy chủ khi 1 lần mở được từ (kinh nghiệm)"]],
    cot: {
      tu: "Bắt đầu từ ngày", den: ["Kết thúc lúc 0 giờ ngày", "không gồm ngày này"], moHet: ["Hết mở hương bao lúc 0 giờ ngày", "không gồm ngày này"], ruou: "Đỗ Khang Tửu", "ruou.kn": "Mỗi bình bốc 1 dòng", "ruou.knNgay": "Kinh nghiệm tối đa mỗi ngày",
      dang: "Dâng Ngũ Sắc Hương Bao", "dang.kn": "Kinh nghiệm mỗi cái", "dang.lanNgay": "Tối đa lần mỗi ngày", knHbToiDa: ["Mở hương bao: kinh nghiệm tối đa cả sự kiện", "0 = không giới hạn"], moToiDa: "Số lần mở tối đa (cả sự kiện)", "moToiDa.tt": "Tơ Tằm Hương Bao", "moToiDa.ns": "Ngũ Sắc Hương Bao", "moToiDa.td": "Trung Dược Hương Bao", bao: "Quà mốc (cái cuối)", "bao.ns": "Ngũ Sắc Hương Bao", "bao.td": "Trung Dược Hương Bao",
      hb: "Hương bao", "hb.tt": "Tơ Tằm Hương Bao", "hb.ns": "Ngũ Sắc Hương Bao", "hb.td": "Trung Dược Hương Bao", "hb.tt.kn": "Kinh nghiệm (bốc 1)", "hb.ns.kn": "Kinh nghiệm (bốc 1)",
      "hb.td.kn": "Kinh nghiệm (bốc 1)", "hb.ns.mon": "Vật phẩm (bốc thêm 1)", "hb.td.mon": "Vật phẩm (bốc thêm 1)", nguon: "Nguồn Đỗ Khang Tửu", "nguon.chiNgay": "Sợi chỉ màu rơi từ quái: tối đa / ngày", "nguon.daTau40": "Dã Tẩu mốc 40: số bình rượu", "nguon.daTau40Chi": "Dã Tẩu mốc 40: số Sợi chỉ màu", nen: "Nến Bát Trân Phúc Nguyệt",
      "nen.giay": "Thời gian (giây)", "nen.heSo": "Kinh nghiệm đánh quái ×", kyNang: "Kỹ năng cộng thêm", "kyNang.toiDa": "Tổng cấp kỹ năng cộng thêm tối đa",
      loa: "Món mở ra thì báo cả máy chủ", loaKn: "Báo cả máy chủ khi 1 lần mở được từ (kinh nghiệm)",
    },
    bang: {
      "ruou.kn": [T100, "Kinh nghiệm", "Tây Hồ Long Tĩnh Trà"], "hb.tt.kn": [T100, "Kinh nghiệm"], "hb.ns.kn": [T100, "Kinh nghiệm"], "hb.td.kn": [T100, "Kinh nghiệm"],
      "hb.ns.mon": ["Vật phẩm / loại", "Số", T100], "hb.td.mon": ["Vật phẩm / loại", "Số", T100],
    },
  },
  // ---------- soát chéo 17/11: nguồn quà còn sót (Boss Sát thủ, rơi đồ đặc biệt, quái tinh anh, bang hội) ----------
  satThu: {
    ten: "Boss Sát thủ (Nhiếp Thí Trần)",
    gt: "Nhiệm vụ Sát thủ ở Nhiếp Thí Trần (Ba Lăng): hạ boss được Sát Thủ lệnh + kinh nghiệm (số client) + vài lượt bốc bảng rơi của bậc; đủ lệnh cùng cấp hợp thành Sát thủ giản. Tỉ lệ các món quý (Thủy Tinh, Bảo thạch…) sửa ở trang Rơi đồ đặc biệt.",
    f: [[["moiNgay"], "Mỗi ngày hạ tối đa (boss)"], [["luot"], "Số lượt bốc bảng rơi mỗi boss"], [["gop"], "Số Sát Thủ lệnh cùng cấp hợp thành 1 Sát thủ giản"]],
    cot: {
      moiNgay: "Mỗi ngày hạ tối đa (boss)", luot: "Số lượt bốc bảng rơi mỗi boss", gop: "Số Sát Thủ lệnh hợp thành 1 giản", toiThieuGiay: "Nhận nhiệm vụ ít nhất (giây) mới tính giết",
      hoiSinh: "Boss sống lại sau (giây)", boChung: "Không ai cần quá (giây) thì bỏ boss", mau: "Hệ số máu boss theo bậc", "mau.*": (k) => `Bậc ${k}`,
    },
  },
  roiDacBiet: {
    ten: "Rơi đồ đặc biệt (thủ lĩnh, Boss Sát thủ)",
    gt: "Bảo thạch, Thủy Tinh, các loại lộ, Võ Lâm Mật Tịch, Tẩy Tủy Kinh, bí kíp võ công 90 không rơi từ quái thường — chỉ rơi từ thủ lĩnh bãi và Boss Sát thủ theo tỉ lệ mỗi con ở đây.",
    f: [[["thuLinh"], "Thủ lĩnh bãi: tỉ lệ mỗi con", "0,002 = 0,2 %"], [["satThu"], "Boss Sát thủ: tỉ lệ mỗi con (bậc 20)", "0,002 = 0,2 %"],
      [["satThuTangMoiBac"], "Boss Sát thủ: tỉ lệ tăng mỗi bậc trên bậc 20", "0,05 = +5 % mỗi bậc (bậc 90 × 1,35)"]],
    cot: { boKhoiBangClient: "Món bỏ khỏi bảng rơi của client", thuLinh: "Thủ lĩnh bãi", satThu: "Boss Sát thủ", satThuTangMoiBac: "Boss Sát thủ: tăng mỗi bậc" },
    pt: { "thuLinh.*": 1, "satThu.*": 1, satThuTangMoiBac: 1 },
  },
  quaiDacBiet: {
    ten: "Quái tinh anh / thủ lĩnh",
    gt: "Trong bãi train cứ vài chục con ra 1 tinh anh (tên xanh), vài trăm con ra 1 thủ lĩnh (tên cam); tinh anh rơi nhiều lượt đồ theo bảng client.",
    f: [[["tinhAnhRoiDo"], "Tinh anh: tỉ lệ ra 1 trang bị mỗi lượt rơi", "0,1 = 10 % (client ~90 %)"], [["tinhAnhMoi"], "Tinh anh ra sau mỗi (con)"], [["thuLinhMoi"], "Thủ lĩnh ra sau mỗi (con)"]],
    cot: { tinhAnhRoiDo: "Tinh anh: tỉ lệ ra 1 trang bị mỗi lượt", tinhAnhMoi: "Tinh anh ra sau mỗi (con)", thuLinhMoi: "Thủ lĩnh ra sau mỗi (con)" },
    pt: { tinhAnhRoiDo: 1 },
  },
  bangHoi: {
    ten: "Bang hội (quà)",
    gt: "Phần thưởng trong bang: hồng bao (bốc 1 theo trọng số), lễ phẩm đổi bằng cống hiến, điểm danh Tế Đàn, mục tiêu tuần, hộ bang, rủ bạn. Các luật khác của bang ở Mọi thông số (nâng cao).",
    f: [[["hongBao", "thuong"], "Hồng bao: phần thưởng (bốc 1 theo trọng số)"], [["hongBao", "ngayNv"], "Hồng bao: mỗi nhân vật nhận tối đa / ngày", "kể cả được tặng"],
      [["hongBao", "tangTuan"], "Hồng bao: tặng tối đa / tuần"], [["hongBao", "kbh"], "Hồng bao: khóa bảo hiểm đồ mở ra", "0 = không khóa, 2 = khóa vĩnh viễn"],
      [["lePham", "ds"], "Lễ phẩm: món đổi bằng cống hiến"], [["lePham", "rxTuan"], "Bảo rương đồ xanh tối đa / tuần", "tính chung hồng bao + lễ phẩm"],
      [["lePham", "kbh"], "Lễ phẩm: khóa bảo hiểm", "0 = không khóa, 2 = khóa vĩnh viễn"],
      [["teDan", "cong"], "Điểm danh Tế Đàn: cống hiến"], [["teDan", "cb"], "Điểm danh Tế Đàn: chiến bị cho bang (vạn)"],
      [["mucTieu", "loai"], "Mục tiêu tuần: từng loại"], [["mucTieu", "phanBang"], "Mục tiêu tuần: cả bang đạt khi đủ", "0,4 = 40 % × số người × mức cần"],
      [["mucTieu", "knHs"], "Mục tiêu tuần: hệ số kinh nghiệm", "kinh nghiệm = thưởng × (700 + 100 mỗi 5 cấp trên 40) × hệ số"],
      [["hoBang", "so"], "Hộ bang: số người (cống hiến tuần cao nhất)"], [["hoBang", "cong"], "Hộ bang: cống hiến thưởng"],
      [["ruBan", "cong"], "Rủ bạn: cống hiến cho người mời"], [["ruBan", "congMoi"], "Rủ bạn: cống hiến cho người mới"], [["ruBan", "kt"], "Rủ bạn: kiến thiết cho bang (vạn)"]],
    cot: {
      hongBao: "Hồng bao", "hongBao.gia": "Giá theo cấp Lễ Vật", "hongBao.heSo": "Hệ số lượt theo cấp Lễ Vật", "hongBao.ngayNv": "Mỗi nhân vật nhận tối đa / ngày", "hongBao.tangTuan": "Tặng tối đa / tuần",
      "hongBao.kbh": ["Khóa bảo hiểm đồ mở ra", "0 = không khóa, 2 = khóa vĩnh viễn"], "hongBao.thuong": "Phần thưởng (bốc 1)",
      lePham: "Lễ phẩm", "lePham.ds": "Món đổi bằng cống hiến", "lePham.ds.k": "Vật phẩm", "lePham.ds.gia": "Giá (cống hiến)", "lePham.ds.tuan": ["Giới hạn mỗi tuần", "0 = không giới hạn"],
      "lePham.ds.cap": "Cấp Lễ Vật cần", "lePham.ds.bat": ["Bật", "1 = có bán"], "lePham.rxTuan": "Bảo rương đồ xanh tối đa / tuần", "lePham.kbh": ["Khóa bảo hiểm", "0 = không, 2 = vĩnh viễn"],
      teDan: "Điểm danh Tế Đàn", "teDan.cong": "Cống hiến", "teDan.cb": "Chiến bị cho bang (vạn)", "teDan.capMin": "Bang đạt cấp tối thiểu", "teDan.vaoNgay": "Vào bang đủ (ngày) mới nhận",
      mucTieu: "Mục tiêu tuần", "mucTieu.ds": "Loại bốc mỗi tuần", "mucTieu.loai": "Từng loại", "mucTieu.loai.*": (k) => ({ vuotAi: "Vượt Ải", daTau: "Dã Tẩu", tongKim: "Tống Kim", satThu: "Sát thủ" }[k] || k),
      "mucTieu.loai.*.ten": "Tên", "mucTieu.loai.*.can": "Cống hiến cần mỗi người", "mucTieu.loai.*.thuong": "Thưởng cá nhân", "mucTieu.phanBang": "Cả bang đạt khi đủ", "mucTieu.knHs": "Hệ số kinh nghiệm",
      hoBang: "Hộ bang", "hoBang.so": "Số người (cống hiến tuần cao nhất)", "hoBang.cong": "Cống hiến thưởng", "hoBang.congMin": "Cống hiến việc làm tối thiểu trong tuần", "hoBang.ngay": "Danh hiệu giữ (ngày)",
      ruBan: "Rủ bạn", "ruBan.ngay": "Người mới ở bang đủ (ngày)", "ruBan.hetNgay": "Hết hạn xét (ngày)", "ruBan.cong": "Cống hiến cho người mời", "ruBan.congMoi": "Cống hiến cho người mới",
      "ruBan.kt": "Kiến thiết cho bang (vạn)", "ruBan.congCan": "Cống hiến việc làm người mới phải có",
    },
    dong: { "lePham.ds": "Món" },
    so: { "mucTieu.loai.*.can": ["Độ khó 1", "Độ khó 2"], "mucTieu.loai.*.thuong": ["Độ khó 1", "Độ khó 2"], "hongBao.gia": (i) => `Cấp ${i + 1}`, "hongBao.heSo": (i) => `Cấp ${i + 1}` },
    bang: { "hongBao.thuong": ["Loại", "Giá trị / vật phẩm", { t: "Trọng số", ts: 1 }, "Số lượng"] },
    pt: { "mucTieu.phanBang": 1 },
  },
  // ---------- không phải quà (trang ở cột trái) — chỉ nhãn ----------
  loiDai: {
    ten: "Lôi Đài Công Bình Tử",
    cot: {
      bat: "Nhận báo danh", soSan: ["Số sân dùng cùng lúc", "1–5"], chuanBi: ["Chuẩn bị sau báo danh (giây)", "10–1800"], thiDau: ["Thời gian thi đấu (giây)", "30–3600"],
      thiDau16: "Thời gian thi đấu trận 16 vs 16 (giây)", theThuc: ["Các thể thức N vs N được chọn", "1–8 và 16"], xemToiDa: ["Người xem tối đa mỗi sân", "0–200"],
      baoTu: ["Báo kênh hệ thống từ thể thức N vs N", "0 = tắt"], cap: "Cấp tối thiểu của tuyển thủ", phi: "Phí mỗi tuyển thủ mỗi lần vào sân (lượng)",
    },
  },
  // tỉ thí (anh 17/11 — may-chu/ti-thi.js; phiên tỉ thí thêm nhãn): sửa có hiệu lực ngay, câu khịa mới người chơi F5 mới thấy trong bảng chọn
  tiThi: {
    ten: "Tỉ thí",
    cot: {
      bat: "Bật tỉ thí", cap: ["Cấp tối thiểu (cả 2 người)", "1–200"], cho: ["Giây để trả lời chiến thư", "10–120"], chuanBi: ["Giây chuẩn bị trong sân", "10–600"],
      thiDau: ["Giây thi đấu", "30–1800 — hết giờ bên gây nhiều sát thương hơn thắng"], giuaLan: ["Giây chờ gửi lại cho cùng người", "sau khi bị từ chối / không trả lời"],
      bao: "Báo kênh thế giới lúc nhận lời + kết quả", cau: ["Câu khịa", "mỗi câu 1 dòng, tối đa 40 câu, 120 chữ / câu"],
    },
  },
};

export const NHOM_QUA = [
  ["Nhận thưởng (Esc → Nhận thưởng)", ["thuongCap", "thuongOnline", "dangNhap", "phucDuyen", "tanThu"]],
  ["Rương", ["ruongXanh", "ruongThanBi"]],
  ["Nhiệm vụ hằng ngày", ["daTau", "minhChu", "satThu", "phongLangDo"]],
  ["Hoạt động theo giờ", ["bossTheGioi", "sanNhim", "phuQuy", "tongKim", "phongHoa", "duaNgua"]],
  ["Phó bản tổ đội", ["vuotAi", "viemDe"]],
  ["Rơi đồ đặc biệt", ["roiDacBiet", "quaiDacBiet"]],
  ["Bang hội", ["bangHoi"]],
  ["Sự kiện", ["baoDapAnSu"]],
];
