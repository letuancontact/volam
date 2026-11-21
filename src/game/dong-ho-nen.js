// Đồng hồ nền (anh 01/11: "ẩn tab, thu nhỏ hay ứng dụng khác che game thì nhân vật tự chết"): luồng phụ (Web Worker) báo nhịp mỗi n ms cho
// main.js henGio. Bộ hẹn giờ của trang bị trình duyệt hãm khi tab ẩn (1 lần / giây, ẩn quá 5 phút mà trang không phát tiếng: 1 lần / phút ->
// game bù cả phút đánh nhau một lúc, không kịp uống thuốc), bộ hẹn giờ của luồng phụ thì không.
//   postMessage(n) -> mỗi n ms gửi lại 1 tin (n ≤ 0: dừng)
let id = 0;
onmessage = (e) => {
  clearInterval(id);
  if (e.data > 0) id = setInterval(() => postMessage(0), e.data);
};
