// Quy ước 8 hướng, dùng chung cho nhân vật (src/char/) và quái (src/mon/) — giống hệt game gốc (bản 2 js/render.js: dirOf).
//
//   0 xuống · 1 chéo trái xuống · 2 trái · 3 chéo trái lên · 4 lên · 5 chéo phải lên · 6 phải · 7 chéo phải xuống
//
// Tọa độ màn hình: x sang phải, y xuống dưới. Hướng = hàng thứ `hướng` trong tấm ảnh.

// Hướng nhìn theo véc-tơ (dx, dy), vd từ quái tới mục tiêu: dirOf(target.x - x, target.y - y)
export const dirOf = (dx, dy) => (Math.round(Math.atan2(-dx, dy) / (Math.PI / 4)) % 8 + 8) % 8;
