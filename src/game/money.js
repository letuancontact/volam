// Tiền như client: "2 vạn 4499 lượng", "1 ức 2345 vạn lượng", "350 lượng" (ảnh túi đồ game thật 25/10; 1 vạn = 10.000, 1 ức = 1 trăm
// triệu — stringtable_core G_PLAYERTONG_15 "một ức (tức một trăm triệu) lượng"). GIỐNG may-chu/do.js tien() — sửa thì sửa cả 2.
// dv: đơn vị (mặc định "lượng"; dòng Xu của túi: "xu")
export function fmtMoney(n, dv = "lượng") {
  const neg = n < 0; n = Math.floor(Math.abs(n || 0));
  const uc = Math.floor(n / 1e8), van = Math.floor((n % 1e8) / 1e4), luong = n % 1e4, p = [];
  if (uc) p.push(uc + " ức");
  if (van) p.push(van + " vạn");
  if (luong || !p.length) p.push(String(luong));
  return (neg ? "-" : "") + p.join(" ") + " " + dv;
}
