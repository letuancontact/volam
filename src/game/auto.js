// Trợ Thủ (auto trong game — anh muốn 25/10, tham khảo "Trợ Thủ Kiếm Hiệp" của VLTK 2.0; client mình không có khung này). Cài đặt lưu
// theo nhân vật (hero.auto — trình duyệt gửi lên máy chủ như điểm tiềm năng; sau này ủy thác lúc tắt máy dùng chung). Đợt 1:
//   thuoc   3 dòng như VLTK 2.0: "SL < x % uống k" ×2, "NL < x % uống k" — k = loại thuốc ("" = bất kỳ cùng loại). Anh 29/10: trước là
//           "dùng ô n" (9 ô phím tắt thanh dưới); dữ liệu cũ { o } -> k = thuốc đang ở ô đó (chuanAuto)
//   veThanh SL < x % thì rời bãi về thành dưỡng sức
//   danh    tự đánh: cach "kc" = quanh chỗ bật tự đánh trong kc điểm (0 = cả bãi) | "td" = lần lượt tối đa 5 tọa độ (tọa độ bản đồ nhỏ
//           của client, bãi td.bai), đánh quái trong tim quanh tọa độ rồi sang tọa độ kế; doi = giây không lại gần được / không ra đòn được mục tiêu thì đổi con;
//           uuTien = ưu tiên mục tiêu (anh muốn 25/10): "gan" gần nhất | "dacbiet" tinh anh / thủ lĩnh / Boss Hoàng Kim (game hiện có: trùm
//           bãi) | "nguoi" người chơi (chưa có PK — khóa); tiep = Tiếp cận (anh 27/10, thay ô "Chạy sát quái"): chạy tới cách mục tiêu
//           chừng này (đơn vị client như tầm chiêu — đánh tay không 75) rồi mới ra chiêu / đánh, tầm chiêu ngắn hơn thì theo tầm chiêu; 0 = đứng ở tầm chiêu
//           đợt 2 (võ công 25/10): chieu = chiêu đánh chính (0 = theo ô tay trái), bua = 3 bùa lợi tự dùng lại khi hết, vong = vòng sáng
//           (đặt vào ô tay phải), hai = 3 bùa hại ra lần lượt lên con đang nhắm trước khi đánh (0 = không; 26/10: phái có nhiều bùa hại), hoi = { on, id, pct } chiêu hồi máu (Nga My —
//           Từ Hàng Phổ Độ) khi sinh lực < pct %
//   nhat    tự nhặt: r = phạm vi, tien / thuoc / trang (đồ trắng) bật tắt, dong = đồ xanh từ chừng này dòng mới nhặt
//   treo    treo máy ở bãi bai (chung = 1: bản quái chung của bãi — anh 03/11): tự về thành khi túi còn ≤ tui ô trống / thuốc máu còn ≤ thuoc bình; ở thành bán đồ trong túi theo mức Tự bán
//           (hero.locDo — máy chủ giữ), mua thuốc đủ số (mua: [{ k, n }]) + Thổ Địa Phù đủ phu.n tấm, dưỡng sức rồi quay lại bãi.
//           Về thành bằng Thổ Địa Phù, quay lại bằng Xa phu (anh 26/10 — main.js veThanh / xeTick). sua (26/10): về thành khi trang bị
//           đang mặc còn ≤ pct % độ bền; sua.thanh: ở thành sửa hết đồ (đủ tiền). nlOn / nl (26/10): về thành khi thuốc nội lực còn ≤ nl bình
//   hien    tenVat: tên đồ / tiền nằm trên đất
//   baoVe   bảo vệ trang bị (anh 27/10, thẻ Khác): 1 = vứt / bán món từ 4 dòng phải xác nhận ở khung hỏi của game, 0 = vứt / bán luôn
//   soSanh  so sánh trang bị (anh 13/11 lượt 88, thẻ Khác): 1 = trỏ món chưa mặc thì hiện thêm ô món đang mặc cùng loại (windows.js _showTip), 0 = không
//   boCuc   bố cục màn hình (anh 29/10 lần 3, thẻ Khác — hud.js keoBang): { nv | doi | st | mn: [x, y, neo phải] } chỗ các bảng đã kéo (không có
//           = chỗ mặc định)
//   tinXem  id tin cập nhật mới nhất đã xem (anh 29/10 — Esc → Tin cập nhật, assets/data/tin-cap-nhat.json; main.js daXemTin)
// Anh 28/10 lần 4:
//   dung    tự dùng khi đang tự đánh: ttl / bql / tsbl = Tiên Thảo Lộ / Bách Quả Lộ / Thiên Sơn Bảo Lộ (hết hiệu quả thì dùng bình mới trong
//           túi); leBao = { on, n }: hết Hồi Thiên Tái Tạo Đơn thì rút n viên từ Hồi thiên tái tạo lễ bao
//   nhat    + trangSuc: đồ trang bị chỉ nhặt nhẫn / dây chuyền / ngọc bội; loc = { on, ds: { mã dòng: { on, n } } }: đồ xanh phải có ít nhất 1
//           dòng đã tích đạt mức n (LOC_DONG); boQua = [chữ]: món có tên chứa chữ đó thì không nhặt (nhatMon)
//   treo    + cat = { on, giu }: ở thành cất tiền vào rương, trên người giữ lại giu lượng (mặc định 10 vạn)
// Anh 31/10:
//   treo    + catDo: bán xong chạy tới Rương chứa đồ cất các món mức Tự bán giữ lại (đủ dòng — may-chu/do.js act catDo)
//   danh    + boss: boss thế giới còn sống trong BTG_GAN quanh mình (và trong vùng đánh) thì nhắm nó trước mọi con khác (anh 31/10 "auto đánh quái làm
//           tốt, nhưng đánh boss không ổn" — World.nearestMob)
//   dung    + ds = [{ k, on }]: món tự dùng chọn ở thanh xổ xuống (31/10 lần 3), thay cờ ttl / bql / tsbl — chuanAuto chuyển cài đặt cũ.
//           AUTO_DEF phải có ds: [] (01/11 mở máy: nhân vật mới tạo thiếu ds -> trothu.js _thuoc lỗi, thẻ Thuốc trống)
//   treo    + boss: đang đánh boss thế giới (nó còn sống trong BTG_GAN quanh mình) thì không tự về thành vì túi / thuốc / độ bền / sinh lực
//           ("đánh xong nó lại chạy về thành rất khó điều khiển" — main.js treoTick)
//   doi     tổ đội (may-chu/to-doi.js): tuMoi tự mời người chơi xung quanh, truong luôn làm đội trưởng (không tự vào đội người khác), tuVao
//           tự vào đội khi được mời, theo = { on, ten }: đi theo người đó ("" = đội trưởng), cungMuc: đánh quái quanh mục tiêu của đội trưởng,
//           bua: dùng bùa lợi đã chọn (loại client cho dùng lên người khác) + chiêu hồi máu lên đồng đội (anh 02/11 — world.js buaDoi)
// Anh 03/11:
//   danh    + xoay = [vòng 2, vòng 3]: Nga My xoay vòng sáng (cùng vong) — đang tự đánh ô tay phải đổi vòng mỗi 0,5 giây (world.js xoayVong);
//           hoiDoi = { on, pct }: Nga My hồi máu đồng đội sinh lực dưới pct % bằng chiêu của hoi (world.js buaDoi — trước dùng pct của hoi và phải
//           bật doi.bua); noi = { on, duoi, id, len }: nội lực dưới duoi % thì đánh chiêu id (0 = đòn thường — vũ khí hút nội) tới khi nội lực
//           ≥ len % rồi về chiêu đánh chính (vocong.js atkPlan)
//   danh    + neSat (mặc định bật): né Boss Sát thủ (anh 03/11 "chỉ né boss là được, có nghĩa là không đánh boss, đánh xong quái quanh boss thì đi
//           góc khác") — không nhắm Boss Sát thủ (trừ boss nhiệm vụ của mình), hết quái mà boss đứng gần thì sang chỗ khác (world.js autoIdle)
// Anh 03/11 lượt 17 (nâng cấp auto):
//   danh    + haiMuc = [mục tiêu của bùa hại 1–3]: "tat" mọi quái | "db" tinh anh, thủ lĩnh, Boss Sát thủ, Boss Hoàng Kim | "nguoi" người chơi (chưa có
//           PK — khóa) (world.js autoBuff)
//   treo    + thanh: thành Trợ Thủ về bằng Thổ Địa Phù để bán / mua / sửa / cất rương — 53 Ba Lăng huyện | 37 Biện Kinh (main.js shopTown)
//   boss    Boss Hoàng Kim (thẻ Đánh quái → Boss Hoàng Kim; danh.boss / treo.boss ở đó): quay = trọng thương / về thành lúc đang đánh boss thì xong việc
//           ở thành quay lại boss (không về bãi treo máy); tuDi = boss xuất hiện thì tự đi đánh (cấp ≥ cap); veBai = boss chết thì về bãi treo máy;
//           sk = siêu boss sự kiện xuất hiện thì tự đi đánh (anh 18/11 "mặc định tìm kiếm đến boss hoạt động, cả sv sẽ cùng đánh" — mặc định bật, mọi cấp, cả khi đang ở thành)
//   tuLam   tự làm nhiệm vụ ngày (thẻ Tiện ích → Nhiệm vụ ngày — src/game/tulam.js, máy chủ may-chu/tu-lam.js mở khóa trong ngày bằng Xu):
//           dt = { on, thuong ("kn" | "vat" | "tien" — ô thưởng ưu tiên), giuHuy (lấy ô cơ hội hủy khi còn < số này), gian (nộp Sát Thủ Giản trong túi),
//           huy ("dung" | "lai" — không làm được mà hết cơ hội hủy) }, st = { on }, nha = { z, c, x?, y? } bãi treo máy để về khi xong (lượt 18)
//   nh      thẻ Tiện ích → Ngũ hành: he = hệ vũ khí đang xem (-1: theo vũ khí đang cầm)
// Anh 04/11 lượt 25:
//   danh    + hd: phạm vi tự đánh ở hoạt động (Phong Hỏa có bật ph.o / đứng gần boss thế giới — world.js hoatDong / hdR): chỉ đánh con trong chừng này
//           quanh chỗ nhân vật đang đứng, hết quái thì đứng chờ ("chỉ tự đánh trong phạm vi 500-600 thôi, như v ng chơi kéo đi đâu cũng k bị khựng")
// Anh 06/11 (thẻ PK — "buff bùa lợi trước, xong bùa hại nếu cần hoặc không thì tự dùng kĩ năng bùa hại. Sau đó là các chức năng cần thiết như bơm máu";
// "bấm vào PK thì sẽ mặc định ở PK thôi, không lẫn lộn các hoạt động khác"): chỉ có tác dụng trong trận Tống Kim (World.tk — world.js pk())
//   pk      on: chỉ đánh phe kia (không nhặt đồ, về thành, nhiệm vụ ngày, tự mời / theo / vào đội); bua = 3 bùa lợi (đều 0 -> bùa lợi thẻ Kỹ năng);
//           hai: "tu" mọi bùa hại đã học | mã 1 bùa | 0 không; chieu: chiêu đánh (0 = như thẻ Kỹ năng); uu: "gan" | "mau" máu thấp nhất | "tra" kẻ
//           đang đánh mình | "nguoi" người chơi trước; hd: phạm vi chọn mục tiêu; sl / nl: % uống thuốc (thay mức thẻ Thuốc, cùng loại thuốc);
//           ve / vePct / ra: sinh lực dưới vePct % thì về doanh phe mình, đủ ra % mới ra lại
//           + tiep / tiepTam (anh 06/11 "auto PK thêm 1 ô tiếp cận để ng chơi chọn, thêm nút tích đồng bộ với phạm vi kĩ năng"): tiepTam 1 (mặc định) =
//           tới tầm chiêu mà đánh (không theo Tiếp cận của thẻ Đánh quái); 0 = Tiếp cận tiep của thẻ PK (đơn vị như danh.tiep — đánh tay không 75; tầm chiêu
//           ngắn hơn thì theo tầm chiêu; 0 = đứng ở tầm chiêu) — world.js updateHero
//   chuanAuto(hero) -> hero.auto đủ trường (nhân vật cũ: lấy ngưỡng tự uống từng ô của bản trước làm dòng thuốc)

// 40 dòng xanh của client (settings\item\004\magicattrib.txt — assets/data/dong-xanh.json), xếp theo nhóm tấn công / phòng thủ / khác; số mặc
// định = khoảng giữa giá trị dòng đó (dòng cấp 1–10), làm tròn (anh: "để 1 con số tầm trung, ai muốn điều chỉnh thì nhập bằng tay")
export const LOC_DONG = [
  ["addphysicsdamage_p", 50], ["addphysicsdamage_v", 25], ["addpoisondamage_v", 25], ["addcolddamage_v", 50], ["addfiredamage_v", 50], ["addlightingdamage_v", 50],
  ["metalskill_v", 100], ["woodskill_v", 100], ["waterskill_v", 100], ["fireskill_v", 100], ["earthskill_v", 25], ["attackratingenhance_v", 150], ["attackspeed_v", 20],
  ["castspeed_v", 15], // tốc độ đánh nội công của vũ khí — S1 thêm (anh 28/10 lần 7: cố định 10 / 20 %; cong-cu/dung-dong-xanh.js)
  ["steallifeenhance_p", 5], ["stealmanaenhance_p", 5], ["ignoredefense_p", 1], ["damage2addmana_p", 8],
  ["allres_p", 10], ["physicsres_p", 12], ["poisonres_p", 12], ["coldres_p", 12], ["fireres_p", 12], ["lightingres_p", 15],
  ["lifemax_v", 100], ["manamax_v", 100], ["staminamax_v", 100], ["lifereplenish_v", 3], ["manareplenish_v", 2], ["staminareplenish_v", 5],
  ["meleedamagereturn_v", 10], ["fasthitrecover_v", 30], ["stuntimereduce_p", 30], ["freezetimereduce_p", 30], ["poisontimereduce_p", 30],
  ["fastwalkrun_p", 25], ["strength_v", 10], ["dexterity_v", 10], ["vitality_v", 10], ["lucky_v", 5], ["indestructible_b", 1],
];
const LOC_DEF = () => Object.fromEntries(LOC_DONG.map(([k, n]) => [k, { on: 0, n }]));

export const AUTO_DEF = () => ({
  thuoc: [{ on: 1, loai: "hp", pct: 50, k: "" }, { on: 0, loai: "hp", pct: 25, k: "" }, { on: 1, loai: "mp", pct: 30, k: "" }],
  dung: { ds: [], leBao: { on: 0, n: 20 } },
  veThanh: { on: 0, pct: 15 },
  danh: { cach: "kc", kc: 0, doi: 8, tim: 300, uuTien: "gan", boss: 1, neSat: 1, tiep: 75, hd: 550, td: { bai: null, ds: [] }, chieu: 0, bua: [0, 0, 0], vong: 0, xoay: [0, 0], hai: [0, 0, 0], hoi: { on: 0, id: 0, pct: 50 },
    hoiDoi: { on: 0, pct: 50 }, noi: { on: 0, duoi: 30, id: 0, len: 90 }, haiMuc: ["tat", "tat", "tat"] },
  nhat: { kieu: "tu", on: 1, r: 360, tien: 1, thuoc: 1, trang: 1, dong: 1, trangSuc: 0, loc: { on: 0, ds: LOC_DEF() }, boQua: [] },
  treo: { on: 0, bai: null, chung: 0, tuiOn: 1, tui: 3, thuocOn: 1, thuoc: 5, nlOn: 1, nl: 5, ban: 1, mua: [{ on: 1, k: "potion:2", n: 40 }, { on: 1, k: "potion:7", n: 20 }], phu: { on: 1, n: 5 }, sua: { on: 1, pct: 20, thanh: 1 }, cat: { on: 1, giu: 100000 }, catDo: 1, boss: 1, thanh: 53 },
  boss: { quay: 1, tuDi: 0, cap: 90, veBai: 1, sk: 1 }, // sk: siêu boss sự kiện tự đi đánh (anh 18/11 — mặc định bật, mọi cấp)
  tuLam: { dt: { on: 0, thuong: "kn", giuHuy: 2, gian: 0, huy: "dung" }, st: { on: 0 } },
  nh: { he: -1 },
  pk: { on: 1, bua: [0, 0, 0], hai: "tu", chieu: 0, uu: "gan", hd: 550, sl: 60, nl: 40, ve: 1, vePct: 25, ra: 80, tiep: 75, tiepTam: 1, boBinh: 1 }, // thẻ PK (anh 06/11 — chỉ trong trận Tống Kim); boBinh: bỏ qua quân NPC (lượt 86)
  ph: { o: 1 }, // Phong Hỏa Liên Thành: tự đánh ở lại trận (anh 04/11 — main.js onRested / phMuaTick; lượt 25: chỉ đánh trong danh.hd quanh nhân vật)
  doi: { tuMoi: 0, truong: 0, tuVao: 0, theo: { on: 0, ten: "" }, cungMuc: 0, bua: 0 },
  hien: { tenVat: 1 },
  baoVe: 1,
  soSanh: 1,
  boCuc: {},
  tinXem: 0,
  v: 2,
});
const num = (v, a, b, d) => (Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.round(+v))) : d);
const bit = (v, d) => (v == null ? d : v ? 1 : 0);
// đánh boss (anh 16/11 "yêu cầu tất cả ng tham gia các loại boss đứng tiếp cận boss trong phạm vi 250 — phái áp sát 75 kệ, tay dài 250"): tự đánh hay đánh tay,
// phái tầm xa phải vào cách boss ≤ BOSS_TAM (đơn vị client, + bán kính thân) mới ra chiêu / đòn mới tính (world.js updateHero, hit). Boss = mọi loại có cờ
// boss: thủ lĩnh bãi / quái chung, Thủy tặc đầu lĩnh, Phong Hỏa, Nguyên soái Tống Kim (boss), Boss Hoàng Kim (btg), Boss Sát thủ (sat), boss Vượt Ải / Viêm Đế (vaBoss)
export const BOSS_TAM = 250;
export const laBoss = (m) => !!(m && (m.boss || m.btg || m.sat || m.vaBoss));

// món trên đất có đáng nhặt theo thẻ Nhặt đồ (World.nearestLoot; ủy thác ở máy chủ — may-chu/do.js uyThacMon làm y như vậy). m = { loai: "tien" |
// "thuoc" | "db" (đồ chí, mật đồ, Thủy Tinh, vật phẩm Kỳ Trân Các — luôn nhặt trừ khi có trong danh sách không nhặt) | "do", ten, k, dong, dl:
// [[mã dòng, số]] }; laTrangSuc(k) -> nhẫn / dây chuyền / ngọc bội
export function nhatMon(N, m, laTrangSuc) {
  if (!N) return true;
  if (m.loai === "tien") return !!N.tien;
  const ten = String(m.ten || "").normalize("NFC").toLowerCase();
  if ((N.boQua || []).some((t) => ten.includes(String(t).normalize("NFC").toLowerCase()))) return false;
  if (m.loai === "thuoc") return !!N.thuoc;
  if (m.loai === "db") return true;
  if (N.kieu === "rac") return true; // Nhặt rác (anh 08/11): mọi trang bị rơi — về thành bán, giữ món đúng dòng (main.js giuRac)
  if (N.trangSuc && !laTrangSuc(m.k)) return false;
  if (N.kieu === "train") return !!m.dong && m.dong >= N.dong && hopLoc(N.loc, m.dl); // Train lọc đồ (anh 08/11): chỉ đồ xanh qua bộ lọc, ít về thành
  if (!m.dong) return !!N.trang;
  return m.dong >= N.dong && hopLoc(N.loc, m.dl);
}
// bộ lọc dòng: bật và có dòng đã tích -> đồ xanh phải có ít nhất 1 dòng đã tích đạt mức (chưa tích dòng nào = như tắt)
export function hopLoc(L, dl) {
  if (!L || !L.on || !Object.values(L.ds || {}).some((v) => v.on)) return true;
  return (dl || []).some(([k, v]) => { const c = L.ds[k]; return !!c && !!c.on && v >= c.n; });
}

// cài đặt thẻ Nhặt đồ đủ trường, đúng khoảng (chuanAuto; áp dụng bản chia sẻ của người khác — trothu.js _ckApDung)
export function chuanNhat(n0) {
  const n = n0 && typeof n0 === "object" ? n0 : {}, lc = n.loc || {}, ds = lc.ds || {};
  return { kieu: ["rac", "train"].includes(n.kieu) ? n.kieu : "tu", on: bit(n.on, 1), r: num(n.r, 50, 3000, 360), tien: bit(n.tien, 1), thuoc: bit(n.thuoc, 1), trang: bit(n.trang, 1), dong: num(n.dong, 1, 6, 1), trangSuc: bit(n.trangSuc, 0),
    loc: { on: bit(lc.on, 0), ds: Object.fromEntries(LOC_DONG.map(([k, d]) => [k, { on: bit((ds[k] || {}).on, 0), n: num((ds[k] || {}).n, 0, 9999, d) }])) },
    boQua: (Array.isArray(n.boQua) ? n.boQua : []).map((x) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 30) };
}

export function chuanAuto(hero, isPotion) {
  const D = AUTO_DEF(), A = hero.auto && typeof hero.auto === "object" ? hero.auto : null;
  if (!A) {
    // bản trước: mỗi ô phím tắt có ngưỡng tự uống riêng (hero.nhanh[i].tu) -> dòng SL / NL đầu
    const L = Array.isArray(hero.nhanh) ? hero.nhanh : [], find = (hp) => L.findIndex((q) => q && isPotion(q.k, hp));
    const ih = find(true), im = find(false);
    if (ih >= 0) Object.assign(D.thuoc[0], { k: L[ih].k, pct: L[ih].tu || 50, on: L[ih].tu ? 1 : 0 });
    if (im >= 0) Object.assign(D.thuoc[2], { k: L[im].k, pct: L[im].tu || 30, on: L[im].tu ? 1 : 0 });
    hero.auto = D;
    return D;
  }
  // loại thuốc của dòng: k đã chọn; dữ liệu trước 29/10 lưu ô o (1–9) -> thuốc đang ở ô đó nếu đúng loại sinh lực / nội lực, không thì "bất kỳ"
  const t = (A.thuoc || []).slice(0, 3), Q = Array.isArray(hero.nhanh) ? hero.nhanh : [];
  const loaiThuoc = (r, d) => {
    if (typeof r.k === "string") return r.k.slice(0, 40);
    const q = Number.isInteger(r.o) ? Q[r.o - 1] : null;
    return q && q.k && isPotion(q.k, d.loai === "hp") ? q.k : "";
  };
  A.thuoc = D.thuoc.map((d, i) => { const r = t[i] || {}; return { on: bit(r.on, d.on), loai: d.loai, pct: num(r.pct, 1, 99, d.pct), k: loaiThuoc(r, d) }; });
  const du = A.dung || {}, lb = du.leBao || {};
  // ds: món tự dùng khi đang tự đánh (anh 31/10 lần 3 — thanh xổ xuống, trothu.js): [{ k: món có trạng thái, on }], tối đa 6. Cài đặt cũ (cờ ttl /
  // bql / tsbl = Tiên Thảo Lộ / Bách Quả Lộ / Thiên Sơn Bảo Lộ — 28/10, hoan { mã: 1 } — 31/10) chuyển sang ds
  const dungCu = Array.isArray(du.ds) ? du.ds : [...[["ttl", "ms:71"], ["bql", "ms:73"], ["tsbl", "ms:72"]].filter(([o]) => du[o]).map(([, k]) => ({ k, on: 1 })),
    ...Object.entries(du.hoan && typeof du.hoan === "object" ? du.hoan : {}).filter(([, v]) => v).map(([k]) => ({ k, on: 1 }))];
  const dungDs = [];
  for (const r of dungCu) { const k = r && typeof r.k === "string" && /^ms:\d{1,5}$/.test(r.k) ? r.k : null; if (k && !dungDs.some((x) => x.k === k) && dungDs.length < 6) dungDs.push({ k, on: bit(r.on, 1) }); }
  A.dung = { ds: dungDs, leBao: { on: bit(lb.on, 0), n: num(lb.n, 1, 60, 20) } };
  A.veThanh = { on: bit((A.veThanh || {}).on, 0), pct: num((A.veThanh || {}).pct, 1, 90, 15) };
  const da = A.danh || {}, td = da.td || {};
  const id = (v) => num(v, 0, 99999, 0);
  A.danh = { cach: da.cach === "td" ? "td" : "kc", kc: num(da.kc, 0, 5000, 0), doi: num(da.doi, 2, 60, 8), tim: num(da.tim, 50, 2000, 300), uuTien: da.uuTien === "dacbiet" ? "dacbiet" : "gan", boss: bit(da.boss, 1), neSat: bit(da.neSat, 1),
    tiep: num(da.tiep, 0, 2000, 75), hd: num(da.hd, 200, 1500, 550), chieu: id(da.chieu), bua: [0, 1, 2].map((i) => id((da.bua || [])[i])), vong: id(da.vong), hai: [0, 1, 2].map((i) => id((Array.isArray(da.hai) ? da.hai : [da.hai])[i])),
    hoi: { on: bit((da.hoi || {}).on, 0), id: id((da.hoi || {}).id), pct: num((da.hoi || {}).pct, 1, 99, 50) },
    xoay: [0, 1].map((i) => id((da.xoay || [])[i])),
    // hồi máu đồng đội: cài đặt cũ (bật "Bùa lợi cho đồng đội" + ô hồi máu) giữ như trước
    hoiDoi: { on: bit((da.hoiDoi || {}).on, (A.doi || {}).bua && (da.hoi || {}).on ? 1 : 0), pct: num((da.hoiDoi || {}).pct, 1, 99, num((da.hoi || {}).pct, 1, 99, 50)) },
    noi: { on: bit((da.noi || {}).on, 0), duoi: num((da.noi || {}).duoi, 1, 99, 30), id: id((da.noi || {}).id), len: num((da.noi || {}).len, 2, 100, 90) },
    haiMuc: [0, 1, 2].map((i) => { const v = (Array.isArray(da.haiMuc) ? da.haiMuc : [])[i]; return v === "db" || v === "nguoi" ? v : "tat"; }),
    td: { bai: td.bai ?? null, ds: (Array.isArray(td.ds) ? td.ds : []).filter((p) => Array.isArray(p) && p.length === 2).slice(0, 5).map(([x, y]) => [num(x, 0, 9999, 0), num(y, 0, 9999, 0)]) } };
  A.nhat = chuanNhat(A.nhat);
  const tr = A.treo || {};
  A.treo = { oMon: +tr.oMon === 8 ? 8 : 6, on: bit(tr.on, 0), bai: tr.bai ?? null, chung: bit(tr.chung, 0), tuiOn: bit(tr.tuiOn, 1), tui: num(tr.tui, 0, 30, 3), thuocOn: bit(tr.thuocOn, 1), thuoc: num(tr.thuoc, 0, 300, 5),
    nlOn: bit(tr.nlOn, 0), nl: num(tr.nl, 0, 300, 5), ban: bit(tr.ban, 1),
    mua: D.treo.mua.map((d, i) => { const m = (tr.mua || [])[i] || {}; return { on: bit(m.on, d.on), k: typeof m.k === "string" ? m.k : d.k, n: num(m.n, 1, 60, d.n) }; }), // mang tối đa 60 bình tổng
    phu: { on: bit((tr.phu || {}).on, 1), n: num((tr.phu || {}).n, 1, 60, 5) }, // Thổ Địa Phù giữ đủ n tấm (mua ở Tạp hóa khi về thành)
    sua: { on: bit((tr.sua || {}).on, 1), pct: num((tr.sua || {}).pct, 1, 90, 20), thanh: bit((tr.sua || {}).thanh, 1) }, // về thành khi độ bền ≤ pct %; ở thành sửa
    cat: { on: bit((tr.cat || {}).on, 1), giu: num((tr.cat || {}).giu, 0, 2e9, 100000) }, // ở thành cất tiền vào rương, giữ lại giu lượng
    catDo: bit(tr.catDo, 1), // bán xong cất món mức Tự bán giữ lại vào rương
    boss: bit(tr.boss, 1), // đang đánh boss thế giới: không tự về thành
    thanh: +tr.thanh === 37 ? 37 : 53 }; // thành Trợ Thủ về (Ba Lăng huyện / Biện Kinh)
  const bo = A.boss || {};
  A.boss = { quay: bit(bo.quay, 1), tuDi: bit(bo.tuDi, 0), cap: num(bo.cap, 1, 200, 90), veBai: bit(bo.veBai, 1), sk: bit(bo.sk, 1) };
  const tl = A.tuLam || {}, tdt = tl.dt || {};
  A.tuLam = { dt: { on: bit(tdt.on, 0), thuong: ["kn", "vat", "tien"].includes(tdt.thuong) ? tdt.thuong : "kn", giuHuy: num(tdt.giuHuy, 0, 10, 2), gian: bit(tdt.gian, 0), huy: tdt.huy === "lai" ? "lai" : "dung" },
    st: { on: bit((tl.st || {}).on, 0) },
    // bãi treo máy để về khi tự làm xong (tulam.js ghiNha) | null
    nha: tl.nha && Number.isFinite(+tl.nha.z) ? { z: +tl.nha.z, c: bit(tl.nha.c, 0), ...(Number.isFinite(+tl.nha.x) && tl.nha.x != null ? { x: num(tl.nha.x, 0, 1e6, 0), y: num(tl.nha.y, 0, 1e6, 0) } : {}) } : null };
  A.nh = { he: num((A.nh || {}).he, -1, 4, -1) };
  A.ph = { o: bit((A.ph || {}).o, 1) };
  const pk = A.pk || {}, vePct = num(pk.vePct, 1, 90, 25);
  A.pk = { on: bit(pk.on, 1), bua: [0, 1, 2].map((i) => id((pk.bua || [])[i])), hai: pk.hai === "tu" || pk.hai == null ? "tu" : id(pk.hai), hai2: id(pk.hai2), hai3: id(pk.hai3), chieu: id(pk.chieu), // hai2 / hai3: 2 ô bùa hại thêm (anh 12/11)
    uu: ["gan", "mau", "tra", "nguoi"].includes(pk.uu) ? pk.uu : "gan", hd: num(pk.hd, 200, 1500, 550), sl: num(pk.sl, 1, 99, 60), nl: num(pk.nl, 1, 99, 40),
    ve: bit(pk.ve, 1), vePct, ra: Math.max(vePct + 1, num(pk.ra, 10, 100, 80)),
    tiep: num(pk.tiep, 0, 2000, 75), tiepTam: bit(pk.tiepTam, 1), boBinh: bit(pk.boBinh, 1) }; // Tiếp cận của thẻ PK / theo phạm vi kỹ năng (anh 06/11); bỏ qua quân NPC (anh 13/11)
  const dd = A.doi || {}, th = dd.theo || {};
  A.doi = { tuMoi: bit(dd.tuMoi, 0), truong: bit(dd.truong, 0), tuVao: bit(dd.tuVao, 0), theo: { on: bit(th.on, 0), ten: typeof th.ten === "string" ? th.ten.slice(0, 32) : "" }, cungMuc: bit(dd.cungMuc, 0), bua: bit(dd.bua, 0) };
  A.hien = { tenVat: bit((A.hien || {}).tenVat, 1) };
  A.baoVe = bit(A.baoVe, 1);
  A.soSanh = bit(A.soSanh, 1);
  const bc = A.boCuc && typeof A.boCuc === "object" ? A.boCuc : {};
  A.boCuc = Object.fromEntries(["nv", "doi", "st", "mn"].filter((k) => Array.isArray(bc[k]) && bc[k].length >= 2).map((k) => [k, [num(bc[k][0], 0, 9999, 0), num(bc[k][1], 0, 9999, 0), bit(bc[k][2], 0)]]));
  A.tinXem = num(A.tinXem, 0, 1e9, 0);
  // anh 01/11 "không tự về thành mua mana": mặc định mới mua thuốc nội lực (dòng mua 2) + về thành khi thuốc nội lực còn ≤ 5 bình. Cài đặt lưu
  // trước đó còn nguyên mặc định cũ (dòng 2 tắt, 30 bình; về thành vì nội lực tắt, 5 bình) thì bật 1 lần (v 2)
  if ((A.v | 0) < 2) {
    const m = A.treo.mua[1];
    if (!m.on && m.k === "potion:7" && m.n === 30) m.on = 1;
    if (!A.treo.nlOn && A.treo.nl === 5) A.treo.nlOn = 1;
  }
  A.v = 2;
  return A;
}

// còn chỗ đặt 1 món w × h ô trong túi 6 × 10 không, theo chỗ thật của từng món (x, y) — anh 08/11 (Trợ Thủ → Về thành: đếm tổng ô trống thì túi lỗ chỗ vẫn tưởng còn chỗ)
export function coCho(bag, cellOf, w, h) {
  const W = 6, H = 10, g = new Uint8Array(W * H);
  for (const b of bag || []) {
    if (b.x == null) continue;
    const [bw, bh] = cellOf(b);
    for (let y = b.y; y < b.y + bh && y < H; y++) for (let x = b.x; x < b.x + bw && x < W; x++) g[y * W + x] = 1;
  }
  for (let y = 0; y + h <= H; y++) next: for (let x = 0; x + w <= W; x++) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j * W + i]) continue next;
    return true;
  }
  return false;
}
// số ô trống của túi 6 × 10 (món chiếm w × h ô — c của kho đồ)
export function oTrong(bag, cellOf) {
  let used = 0;
  for (const b of bag || []) { const [w, h] = cellOf(b); used += w * h; }
  return Math.max(0, 60 - used);
}
