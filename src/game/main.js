// Khởi động game: tải kho web -> đăng nhập máy chủ chung -> màn chọn nhân vật (3 ô, như bản 2) -> [ô trống: chọn server -> tạo
// nhân vật] -> vào bãi train; vòng lặp vẽ / cập nhật; HUD. Nhân vật lưu trên máy chủ (src/game/net.js — anh chốt 24/10: 10 người
// chơi chung 1 máy chủ; M5 làm cày khi tắt máy).

import { JxChar } from "../char/jx-char.js";
import { NpcPack } from "../npc/npc-pack.js";
import { GameMap, ldist } from "./map.js";
import { GameAudio } from "./audio.js";
import { World } from "./world.js";
import { Hud, popup } from "./hud.js";
import { DevTool, DEV_ON } from "./devtool.js";
import { QuanTri, loaThongBao } from "./quantri.js";
import { moUngHoQr } from "./ungho-qr.js";
import { DoCongCu } from "./do-cong-cu.js"; // dò công cụ tự động bên ngoài — chỉ báo kèm nhịp (anh 13/11 "S2 PRO AUTO") // ủng hộ duy trì máy chủ — khung 4 bước (anh 13/11)
import { UiWins } from "./uiwin.js";
import { GameWindows } from "./windows.js";
import { Hotkeys } from "./hotkeys.js";
import { FxPack } from "./fx.js";
import { RoiPack } from "./roi.js";
import { ItemDB, looksOf, syncRanged, isPotion, isPhu, benMax, benCua, weaponKind, laVatTk, laHoan } from "./itemdb.js";
import { NpcDialog, setTextColors, richText } from "./npcdlg.js";
import { fixPoints, mobStats, hamChieu, datLuyen, LUYEN, MOC, ccCong, capCong, skCong, noiCapChieu } from "./rules.js"; // ccCong / capCong / skCong: +cấp kỹ năng Báo Đáp Ân Sư (anh 16/11)
import { Net } from "./net.js";
import { fmtMoney } from "./money.js";
import { chuanAuto, oTrong, coCho, hopLoc } from "./auto.js";
import { TroThu } from "./trothu.js";
import { HuongDan } from "./huongdan.js"; // Hướng dẫn hoạt động: lịch, giờ, yêu cầu, tra cứu (anh 05/11)
import { TanThu } from "./tanthu.js"; // chỉ đường tân thủ từng bước trong bảng Nhiệm vụ (anh 10/11)
import { NhomZalo } from "./nhomzalo.js"; // khung mã QR nhóm Zalo (anh 09/11)
import { UngHo } from "./ungho.js"; // khung Ủng hộ tác giả: tâm thư + danh sách ủng hộ (anh 12/11 — Esc / Lễ quan)
import { PhanThan } from "./phanthan.js"; // Phân Thân: thuê phân thân của người chơi khác (anh 05/11 — khung Kiểu 2)
import { BauCua } from "./baucua.js"; // Bầu Cua: bàn cược ở Chủ sòng bạc (anh 10/11 — mẫu B)
import { KhoaAnToan, gioNgay } from "./khoaantoan.js";
import { datXemNguon } from "./itemtip.js"; // nguồn gốc món: chỉ quản trị thấy trong ô xem món (anh 18/11 tối) // Khóa an toàn: mật khẩu cấp 2 + tự đổi mật khẩu đăng nhập (anh 10/11 "Duyệt hết a")
import { VoCongPack, kindOf, isHeal, suaVoCong, auraGhep, KC_ID } from "./vocong.js";
import { ZoneLoading } from "./loading.js";
import { dungDangNhap, dungManCho, dungTrongGame, TIN_VAO, KY_NGAN, kyChuan, voKy, loiChao } from "./an-ky.js"; // ấn ký bản gốc: logo + chữ ký Heo Búy + cảnh báo bản nhái (anh 11/11)
import { datMocNhan, datCocDao, MocNhanPanel } from "./mocnhan.js";
import { dangKy as dangKySW, taiTruoc } from "./tai-truoc.js";
import { DienThoai } from "./dienthoai.js";
import { chamGiu } from "./chamgiu.js";
import { BieuCam } from "./bieucam.js";
import { BossTG } from "./bosstg.js";
import { SanNhim } from "./sannhim.js";
import { QuaiCanh } from "./quaicanh.js";
import { VaDoi } from "./vadoi.js";
import { ViemDe, VdDoi, laVd } from "./viemde.js"; // Viêm Đế Bảo Tàng (anh 04/11 — may-chu/viem-de.js)
import { CuongNo } from "./cuongno.js"; // anh 18/11 — Cuồng nộ liên kích (Vượt Ải / Viêm Đế) + boss cuối nổi giận
import { QuaiChung } from "./quaichung.js";
import { TuLam } from "./tulam.js";
import { PhongHoa } from "./phonghoa.js";
import { TongKim, laZoneTk } from "./tongkim.js"; // Tống Kim bãi thử — bot + PK (anh 05/11 — đợt 1, chỉ quản trị mở); đợt 2 (06/11): trận thật ở chiến trường 380 Xung phong — anh 06/11 chọn
import { LoiDai, laLd } from "./loidai.js"; // Lôi Đài Công Bình Tử (anh 15/11 — THIET-KE-LOI-DAI.md đợt 1): sân = vùng 2091–2095 (bản đồ c209), PvP theo đường Tống Kim, thanh tỉ số, kết quả
import { DuaNgua, laDn, phanMau } from "./duangua.js"; // Truy Phong Đại Loạn Đấu — đua ngựa (anh 16/11 — may-chu/dua-ngua.js): đường đua 863, thanh đua, ô đạo cụ 1–3, hộp / bẫy, tốc cố định
import { moPoster, posterAnHomNay } from "./poster.js"; // poster sự kiện lúc vào game (anh 17/11 — Báo Đáp Ân Sư)
let posterDa = false; // đã xét hiện poster ở trang này (mỗi lần tải trang / đăng nhập 1 lần)

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const SLOT_N = 3, SLOT_PTR = "vlidle.slot"; // ô đang chọn: nhớ theo máy
// cài đặt của máy (không theo nhân vật)
// bright / music / sound: thanh trượt 0..100 của cửa sổ Tùy chọn (50 = độ sáng gốc; nhạc 45, tiếng 70 = mặc định của audio.js)
// showName / showLife: phím F7 / F8 của client (hiện tên / thanh máu trên đầu nhân vật)
const SETTINGS_KEY = "vlidle.settings", SETTINGS_DEF = { mobShadow: true, bright: 50, music: 45, sound: 70, showName: true, showLife: false, muted: false, hieuUngNguoi: true, nguoiHien: -1, anSap: false }; // nguoiHien / anSap: ẩn bớt người chơi khác / sạp hàng (Trợ Thủ → Khác — anh 11/11, world.js nguoiHien)
// gói 1 server (assets/server.json — tools/build-server-packs.mjs) chỉ hiện đúng server đó (P.only)
// id 1 = gói luật Đồ xanh; khai mở lại thành S2 (anh 10/11: "giờ anh mở S2, S1 không cần nữa … người chơi sẽ cày lại từ đầu" — giữ luật S1,
// giữ tài khoản, nhân vật mới) -> chỉ đổi tên hiện ra, không đổi id (id 2 là gói Hoàng Kim môn phái chưa dựng)
const SERVERS = [
  { id: 1, n: "S2 · Đồ xanh", d: "Chỉ đồ xanh thuần + ngựa cổ điển tới Siêu Quang. Lối chơi nguyên bản." },
  { id: 2, n: "S2 · Hoàng Kim môn phái", d: "Thêm đồ Hoàng Kim môn phái, An Bang, Định Quốc…, Bạch Kim môn phái." },
  { id: 3, n: "S3 · Tất cả", d: "Mọi trang bị của client: Thanh Câu, Kim Ô, Bạch Hổ, Xích Lân…, ngựa mới." },
];
// tên máy chủ do máy chủ báo (anh 12/11: 2 máy chung mã — S1 chanlong.duckdns.org / S2 s343clgt.duckdns.org; may-chu/api.js VL_TEN_MAY): trang-thai
// ở màn đăng nhập, Net.me.sv sau khi đăng nhập -> đổi tên thẻ máy chủ cùng mã (màn đăng nhập, chọn nhân vật, chọn máy chủ, bảng nhân vật)
function tenMay(sv) {
  const s = sv && sv.name && SERVERS.find((x) => x.id === sv.server);
  if (s) s.n = String(sv.name).slice(0, 40);
}
// phái chỉ nhận 1 giới — client: Thiếu Lâm chỉ nam; Nga My, Thúy Yên chỉ nữ ({ shaolin: "m", emei: "f", cuiyan: "f" }). Anh 16/11 mở: nam vào Nga My / Thúy Yên,
// nữ vào Thiếu Lâm (bộ hình client có đủ động tác côn cho nữ, song đao cho nam) -> hệ Thủy có nam. Cùng luật ở may-chu/doi-phai.js, may-chu/quan-tri.js
const SEX_ONLY = {};
const SERIES = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const SERIES_COL = ["#f3d35b", "#6fd46a", "#5fb8ff", "#ff6a3a", "#c8965a"]; // màu tên theo hệ (bản 2 js/core.js)
const ACTS = ["NormalStand1", "FightStand", "NormalRun", "FightRun", "Attack1", "Attack2", "Magic", "Wound", "Die", "SitDown"]; // Magic: thi pháp (võ công CharAnimId 11)

const P = {}; // kho đã tải
let world = null, hero = null, cam = { x: 0, y: 0 };
const cv = $("#cv"), ctx = cv.getContext("2d");

function show(id) { $$(".screen").forEach((s) => s.classList.toggle("on", s.id === id)); $("#hud").classList.toggle("on", id === null); }

// chống sao chép (anh 10/11 — có người chép nguyên game đem lên chỗ khác): bản này chỉ chạy ở tên miền của máy chủ (so mã băm) + máy thử / mạng LAN
const bam32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
// mã băm: s343clgt.duckdns.org (máy chủ S2), chanlong.duckdns.org (máy chủ S1 — anh 12/11, máy AWS thứ 2 chạy song song; thêm cùng lúc net.js mienMay +
// world.js NHA_GIO)
const mienDung = (h) => [3220334552, 2208418873].includes(bam32(String(h).toLowerCase())) || /\.(localhost|onrender\.com)$/i.test(h) ||
  /^(localhost|127(\.\d+){3}|\[::1\]|::1|10(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2})$/.test(h);
async function boot() {
  if (!mienDung(location.hostname)) { // thông báo có đường link bấm được (rà soát lượt 60: chữ thường không chạm / chép được trên điện thoại)
    const m = $("#load-msg"), a = document.createElement("a");
    m.textContent = "Bản game này không chính thức — vào chơi tại ";
    a.href = "https://s343clgt.duckdns.org"; a.textContent = "s343clgt.duckdns.org"; a.style.cssText = "color:#ffd36b;text-decoration:underline;user-select:text;-webkit-user-select:text";
    m.append(a); return;
  }
  loiChao(); if (kyChuan() !== 0xdb5473f) { voKy("khởi động"); return; } // ấn ký bản gốc bị sửa: dừng (an-ky.js)
  P.dx = "DX·S2·5630e77e"; // dấu riêng của bản gốc (README lượt 60): bản chép nào có chuỗi này là chép từ máy chủ của anh
  dangKySW(); // service worker: giữ file assets/ đã tải trong trình duyệt (src/sw.js — anh 28/10)
  // chống sao chép (anh 10/11 lượt 61 — "nchung em làm sao ngta k còn copy của anh là dc"): ĐĂNG NHẬP TRƯỚC, TẢI KHO SAU — máy chủ chỉ phát assets/
  // (hình, tiếng, bảng dữ liệu) cho người đã đăng nhập (may-chu/khoa-tai-nguyen.js); màn đăng nhập chỉ cần assets/server.json (tên máy chủ),
  // ảnh nền, phông chữ (công khai). Cookie phiên còn hạn thì vào thẳng: tải kho rồi màn chọn nhân vật như cũ
  const pack = await fetch("assets/server.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  P.only = (pack && pack.server) || null;
  Net.onLost = kicked;
  let ok;
  try { ok = await Net.check(); } catch (e) { return loginScreen("Không vào được máy chủ: " + e.message); }
  if (ok) vaoSauDangNhap(); else loginScreen();
}
// tải kho 1 lần mỗi trang (đăng xuất / đăng nhập lại không tải lại) rồi màn đổi mật khẩu / chọn nhân vật
let khoTai = null;
const taiKho = () => khoTai || (khoTai = taiKhoThat().catch((e) => { khoTai = null; throw e; }));
async function vaoSauDangNhap() {
  try { await taiKho(); } catch (e) { return fail(new Error("Lỗi tải kho: " + e.message)); }
  sauDangNhap();
}
async function taiKhoThat() {
  const msg = (s) => ($("#load-msg").textContent = s);
  const j = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });
  // tải kho hình: cùng màn chờ với đổi bản đồ (anh 27/10 "đồng bộ") — thanh tải theo số kho đã tải xong
  const L = LOADING.start(null, "Đang tải kho hình…");
  try {
    msg("Đang tải kho hình…");
    const [jx, npc, maps, mons, chr, skills, audio, ui, hud, win, mobstats, fx, revive, maplist, full, npcDlg, skIcons, mapNpcs, skillTip, pack, , roi, vc, vatBanDo, trangThai, npcThem, pldData, satData, vaData, ttData, lkData, tinData, bcData, btgData, phData] = await Promise.all([
      JxChar.load("assets/web/jxchar/"), NpcPack.load("assets/web/npc/"), j("assets/web/map/map.json"),
      j("assets/data/monsters.json"), j("assets/data/char.json"), j("assets/web/skill/skills.json"), GameAudio.load(), j("assets/ui/ui.json"), Hud.load(), UiWins.load(),
      j("assets/data/mobstats.json"), // chỉ số quái theo cấp — chạy script cấp quái của client (tools/build-mob-stats.mjs)
      FxPack.load(), // hiệu ứng trúng đòn (tools/build-fx-pack.mjs)
      j("assets/data/revive.json"), // điểm hồi sinh của client (tools/build-revive.mjs)
      j("assets/data/maplist.json"), // thiết lập bản đồ của client: hệ quái… (tools/build-maplist.mjs)
      j("assets/web/map/full/index.json").catch(() => null), // bản đồ dựng nguyên từ client (tools/build-client-map.mjs) — có thể chưa dựng
      j("assets/data/npcdialog.json"), // hội thoại NPC tiếp dẫn 10 phái — chạy script client (tools/build-npc-dialogs.mjs)
      j("assets/web/icon/skill-icons.json"), // icon võ công của client (tools/build-client-icons.mjs)
      j("assets/data/mapnpcs.json").catch(() => null), // NPC đặt trên bản đồ — dữ liệu máy chủ (tools/build-map-npcs.mjs)
      j("assets/web/skill/tip.json").catch(() => null), // ô xem chiêu như client (tools/build-skill-tip.mjs)
      j("assets/server.json").catch(() => null), // gói 1 server (tools/build-server-packs.mjs): { server } — game-moi không có file này
      ItemDB.load(), // kho đồ + chỉ số gốc + bảng dòng xanh: chỉ số nhân vật tính theo đồ đang mặc ngay khi vào game
      RoiPack.load().catch(() => null), // đồ + tiền rơi trên đất (cong-cu/dung-vat-roi.mjs)
      VoCongPack.load().catch(() => null), // võ công trong trận (cong-cu/dung-vo-cong.mjs) — chưa dựng thì chỉ đòn thường
      j("assets/data/vat-ban-do.json").catch(() => null), // vật đặt trên bản đồ thành: rương chứa đồ (cong-cu/dung-vat-ban-do.js)
      j("assets/ui/trang-thai.json").catch(() => null), // hàng biểu tượng trạng thái như client (cong-cu/dung-trang-thai.mjs)
      j("assets/data/npc-them.json").catch(() => null), // NPC game thêm: Mã phu, Tiền trang Ba Lăng (anh 27/10)
      j("assets/data/phong-lang-do.json").catch(() => null), // Phong Lăng Độ: chỗ Xa phu thả, cập bờ Bắc, trên thuyền (cong-cu/dung-phong-lang-do.mjs)
      j("assets/data/sat-thu.json").catch(() => null), // Boss Sát thủ: 160 boss — bãi, chỗ đứng, mẫu quái (cong-cu/dung-sat-thu.mjs)
      j("assets/data/vuot-ai.json").catch(() => null), // Vượt Ải: 28 đám quái mỗi bậc, đội hình, chỗ vào / về (cong-cu/dung-vuot-ai.mjs)
      j("assets/data/tay-tuy.json").catch(() => null), // Đảo Tẩy Tủy: chỗ vào / về, cọc thử (cong-cu/dung-tay-tuy.mjs)
      j("assets/data/luyen-ky-nang.json").catch(() => null), // độ luyện cần mỗi cấp của chiêu luyện 90 / 120 (cong-cu/dung-luyen-ky-nang.mjs — anh 29/10)
      j("assets/data/tin-cap-nhat.json").catch(() => null), // tin cập nhật cho người chơi (Esc → Tin cập nhật — anh 29/10; viết tay)
      j("assets/ui/bieu-cam.json").catch(() => null), // biểu cảm chat như client (cong-cu/dung-bieu-cam.mjs — anh 31/10)
      j("assets/data/boss-tg.json").catch(() => null), // boss thế giới: danh sách Boss Hoàng Kim (cong-cu/dung-boss-tg.mjs — thẻ Boss TG của công cụ thử)
      j("assets/data/phong-hoa.json").catch(() => null), // Phong Hỏa Liên Thành: 3 đường, chỗ sinh quân, đại doanh (cong-cu/dung-phong-hoa.mjs — anh 04/11)
    ].map((p) => L.track(p, 1)));
    if (npcThem && npcDlg) Object.assign(npcDlg.scripts, npcThem.scripts || {});
    themXaPhuTayTuy(npcDlg); themLeQuan(npcDlg);
    BieuCam.nap(bcData);
    P.bossTg = btgData;
    P.phongHoa = phData; PhongHoa.D = phData;
    if (full) mergeFullMaps(maps, hud, full);
    if (skillTip) setTextColors(skillTip.colors); // tên màu <color=…> của chữ client = bảng màu engine
    Object.assign(P, { jx, npc, maps, mons: mons.mons, reach: mons.reach, chr, only: (pack && pack.server) || null, factions: skills.factions, skillDb: noiCapChieu(suaVoCong(skills.skills)),skillIcon: skIcons.skills, skillTip, npcDlg, mapNpcs, vatBanDo, trangThai, npcThem, pld: pldData, satThu: satData, vuotAi: vaData, tayTuy: ttData, luyenKy: (lkData && lkData.ky) || {}, tin: (tinData && tinData.tin) || [], ungHo: (tinData && tinData.ungHo) || null, audio, ui, hud, win, mobstats, fx, roi, vc, revive, maplist, settings: loadSettings(), dev: { speed: 1 } });
    datLuyen(P.skillDb, P.factions); // chiêu luyện (sách 90 / 120 có cờ luyện) — rules.js LUYEN
    P.audio.setVolume("music", P.settings.music / 100); P.audio.setVolume("sfx", P.settings.sound / 100); if (P.settings.muted) P.audio.setMuted(true); applyBright();
    // con trỏ chuột của client (assets/ui/hud/cursor) cho cả trang; trên quái đổi sang con trỏ tấn công
    document.documentElement.style.setProperty("--jxcur", P.hud.cursorCss(0));
    document.body.classList.add("jxcur");
    keys = new Hotkeys(P.hud.M.hotkeys, keyAct);
  } catch (e) { L.end(); throw e; } // vaoSauDangNhap báo lỗi + nút Tải lại (fail)
  addEventListener("pointerdown", () => P.audio.unlock(), { capture: true });
  addEventListener("keydown", () => P.audio.unlock(), { capture: true });
  // tải sẵn ảnh màn chọn máy chủ / chọn nhân vật / tạo nhân vật để hiện ngay
  for (const u of ["chon-may-chu/selectsever.webp", "chon_nv/nen_van_ngoc.webp", "tao_nv/newchar.webp", ...Object.values(P.ui.focus).map((x) => x.file)]) new Image().src = "assets/ui/" + u;
  Net.onLost = kicked;
  // Khóa an toàn (src/game/khoaantoan.js — anh 10/11): dựng lúc tải trang (xóa nhân vật ở màn chọn cũng hỏi mật khẩu cấp 2); ổ khóa đóng / mở theo
  // trạng thái máy chủ (nhịp km)
  KAT = new KhoaAnToan({ P, msg: (t) => { if (hudMounted && world) P.hud.msg(t); },
    onDoi: (tt) => { if (hudMounted && P.hud.setKhoaAnToan) P.hud.setKhoaAnToan(tt); if (DT) DT.setKhoaAnToan(tt); } });
  // quản trị bắt đổi mật khẩu lúc đang chơi (máy chủ trả 403 bat-doi-mk — net.js onBatDoiMk): dừng game, sang màn Đổi mật khẩu
  Net.onBatDoiMk = () => { if ($("#s-doimk").classList.contains("on")) return; if (KAT) KAT.dongHet(); if (world) stopGame(); hero = null; doiMkScreen(); };
  // boss thế giới (bosstg.js — anh 31/10): trạng thái qua kênh tức thời; câu báo thưởng như tin kinh nghiệm / tiền + khung kết quả (windows.js ketQuaBoss)
  Net.wsNghe("btg", (m) => BossTG.capNhat(m.ds !== undefined ? m.ds : m.b)); // ds: mọi boss (lượt 86 — nhiều boss mỗi khung giờ); b: bản 1 boss của máy chủ cũ
  Net.wsNghe("rtb", (m) => ruongNhan(m.ds)); // Rương Thần Bí (may-chu/ruong-tb.js — anh 03/11): rương đang có, mọi bãi
  Net.wsNghe("snh", (m) => SanNhim.capNhat(m.s)); // Săn Nhím Béo Phì (sannhim.js — anh 03/11): nhím, máu chung, số con mình đã bắt hôm nay
  Net.wsNghe("mcv", (m) => QuaiCanh.capNhat(m.s)); // quái canh cây nhiệm vụ Võ Lâm Minh Chủ (quaicanh.js — anh 03/11): máu chung, chết / sống lại
  // chiêu của người khác cùng bãi (anh 31/10): vẽ lại ở máy mình nếu bật Trợ Thủ → Khác "Hiệu ứng chiêu của người khác" (máy yếu tắt đi), người
  // đó đứng trong 1200 quanh mình
  Net.wsNghe("chieu", (m) => {
    const w = world; if (!w || P.settings.hieuUngNguoi === false || !hero || m.ten === hero.name) return;
    const e = m.pt != null ? [...w.ptKhac.values()].find((c) => c.chu === m.ten && c.so === m.pt) : w.others.get(m.ten); // pt: chiêu của phân thân người đó (Phân Thân — anh 05/11)
    if (!e || ldist(e.x, e.y, w.player.x, w.player.y) > 1200) return;
    const hien = w.nguoiHien(); if (hien && !hien.has(m.ten)) return; // người đang ẩn (Trợ Thủ → Khác — anh 11/11): không vẽ chiêu của họ / phân thân của họ
    w.chieuAo(m.id, m.lv, e, [m.px - m.x + e.x, m.py - m.y + e.y]);
  });
  BossTG.api = { msg: (t, k) => (k === "canh" ? P.hud.canh(t) : P.hud.msg(t, MAU_TIN[k])), bao: (h) => GW && GW.bao(h), ketQua: (ds) => GW && GW.ketQuaBoss(ds), tenMon: (k) => (ItemDB.item(k) || {}).n || k, fmt: fmtSo };
  SanNhim.api = { msg: (t, k) => P.hud.msg(t, MAU_TIN[k]), canh: (t) => P.hud.canh(t), tenMon: (k) => (ItemDB.item(k) || {}).n || k, fmt: fmtSo };
  // Trợ Thủ tự làm nhiệm vụ ngày (tulam.js — anh 03/11): đi lại / việc ở thành / Xa phu của Trợ Thủ
  TuLam.api = { hero: () => hero, world: () => world, msg: (t) => P.hud.msg(t), canh: (t) => P.hud.canh(t),
    boKet: () => { if (thanh && performance.now() - thanh.t0 > 20000) { thanh = null; if (world) { world.holdMove = false; world.resting = false; } } }, // bấm Bắt đầu (tulam.js nut): gỡ việc ở thành đang kẹt
    ban: () => !!(zoneLoad || thanh || diXe || bossDi || (world && world.bossGan(false))), veThanh, lamThanh: (why) => { thanh = { buoc: "di", t0: performance.now(), why }; },
    xe: (o) => { diXe = { z: o.thanh || o.bai || 0, t0: 0, c: !!o.c, ...(o.thanh ? { thanh: 1 } : {}), ...(o.sat ? { sat: 1 } : {}) }; },
    baiTreo, thanhVe: () => (shopTown() || townZone() || {}).id, laThanh: (z) => TOWN_KINDS.has(z.kind), laBai: (z) => FARM_KINDS.has(z.kind) && !z.chiThuyen, laQc: (id) => laQc({ id }), moBai: (id) => { const z = P.maps.zones.find((x) => x.id === id); return !!z && moBai(z); },
    npcDt: (w) => w.npcs.find((n) => n.script && /seasonnpc\.lua$/i.test(n.script)) || null, npcSat: (w) => w.npcs.find((n) => n.sat) || null,
    satBoss: (nv) => (P.satThu && P.satThu.boss[nv]) || null, applyServer, luu: save,
    veNha: (o) => { if (o.x != null) hero.diemCu = { z: o.z, x: o.x, y: o.y, ...(o.c ? { c: 1 } : {}) }; diXe = { z: o.z, t0: 0, c: !!o.c }; }, batAuto: () => { if (world && !world.auto) toggleAuto(true); } };
  // Vượt Ải tổ đội + quái chung (anh 31/10 — vadoi.js, may-chu/vuot-ai.js phòng): trạng thái phòng, chủ bãi báo vị trí / mục tiêu, choáng / chậm người khác gây
  Net.wsNghe("vt", (m) => { if (world) world.themMoc(m.ten, m.tr); }); // mốc vị trí người cùng bãi qua kênh tức thời (world.js themMoc)
  // vị trí gom theo bãi (máy chủ mỗi 50 ms 1 tin — ws.js gomVt, độ mượt bước 1 13/11 tối): [[tên, [mốc…]], …]
  Net.wsNghe("vtb", (m) => { if (world && Array.isArray(m.ds)) for (const d of m.ds) if (Array.isArray(d)) world.themMoc(d[0], d[1]); });
  Net.wsNghe("va", (m) => VaDoi.capNhat(m.p));
  Net.wsNghe("vah", (m) => VaDoi.viTri(m.q));
  Net.wsNghe("vat", (m) => VaDoi.trangThai(m.st));
  Net.wsNghe("vd", (m) => VdDoi.capNhat(m.p)); Net.wsNghe("vdh", (m) => VdDoi.viTri(m.q)); Net.wsNghe("vdt", (m) => VdDoi.trangThai(m.st)); // Viêm Đế Bảo Tàng (viemde.js)
  // quái chung ở bãi train (anh 02/11 — src/game/quaichung.js, may-chu/quai-chung.js): trạng thái / vị trí chủ bãi báo / choáng chậm người khác gây
  Net.wsNghe("qc", (m) => QuaiChung.capNhat(m.p));
  Net.wsNghe("qch", (m) => QuaiChung.viTri(m.q, m.ts, m.d)); // d: tin báo đòn
  Net.wsNghe("qct", (m) => QuaiChung.trangThai(m.st));
  // Phong Hỏa Liên Thành (anh 04/11 — src/game/phonghoa.js, may-chu/phong-hoa.js): trạng thái trận / vị trí chủ bãi báo / choáng chậm người khác gây
  Net.wsNghe("ph", (m) => PhongHoa.capNhat(m.p));
  Net.wsNghe("phh", (m) => PhongHoa.viTri(m.q, m.ts));
  Net.wsNghe("pht", (m) => PhongHoa.trangThai(m.st));
  Net.wsNghe("phLich", (m) => { PhongHoa.lich = m.l; });
  // Tống Kim bãi thử (anh 05/11 — src/game/tongkim.js, may-chu/tong-kim.js): phòng mở / đóng, trạng thái, vị trí bot, chiêu, đòn đánh thẳng, choáng / chậm lên bot, hạ
  Net.wsNghe("tkMo", (m) => TongKim.moPhong(m));
  Net.wsNghe("tk", (m) => TongKim.capNhat(m.p));
  Net.wsNghe("tkh", (m) => TongKim.viTri(m.q, m.ts, m.d)); // d: tin báo đòn
  Net.wsNghe("tkc", (m) => TongKim.chieu(m.c));
  Net.wsNghe("tkt", (m) => TongKim.trungMinh(m));
  Net.wsNghe("tkst", (m) => TongKim.trangThai(m.st));
  Net.wsNghe("tkk", (m) => TongKim.giet(m.k));
  Net.wsNghe("tkhn", (m) => TongKim.hoiTu(m)); // bot cùng phe hồi máu mình (Nga My… — chủ trận gửi qua máy chủ)
  Net.wsNghe("tkBuff", (m) => TongKim.nhanBuff(m)); // trận thật: người cùng phe dùng Chiến cổ / Lệnh Bài (đứng gần thì nhận buff — tongkim.js)
  // Lôi đài (anh 15/11 — src/game/loidai.js, may-chu/loi-dai.js): trạng thái sân (máy chủ gửi thành viên sân), đòn tuyển thủ bên kia đánh trúng mình (máy chủ đã kiểm)
  Net.wsNghe("ld", (m) => LoiDai.capNhat(m.p));
  Net.wsNghe("tt", (m) => { if (!hero) return; if (m.moi) ttMoiVe([m.moi]); if (m.het) ttAn(m.het); if (m.vao) ttVaoSan(m.vao); }); // tỉ thí (anh 17/11 — may-chu/ti-thi.js day)
  Net.wsNghe("ldt", (m) => LoiDai.trung(m));
  // đua ngựa (anh 16/11 — src/game/duangua.js, may-chu/dua-ngua.js): trạng thái lượt đua (người đua), tin trong lượt (Msg2MSAll của client)
  Net.wsNghe("dng", (m) => DuaNgua.capNhat(m.s));
  Net.wsNghe("dnt", (m) => DuaNgua.tin(m.text));
  Net.wsNghe("lichHd", () => { if (HD) HD.taiLich(); }); // GM đổi lịch hoạt động ở F10 (may-chu/lich-hd.js) — Tra cứu tự tải lại khi phiên bản đổi
  Net.wsNghe("bcua", () => { if (BC) BC.nhanWs(); }); // Bầu Cua: vừa mở ván / lắc xong (may-chu/bau-cua.js) — bàn cược đang mở thì tải lại
  Net.wsNghe("bcuaKq", (m) => P.hud.msg(`Bầu Cua ván ${m.k | 0}: ra ${m.kq} — không trúng, mất ${Number(m.dat) || 0} vạn`)); // người đặt mà thua (đặt ở ngoài sòng không thấy tin kết quả của bãi)
  PhongHoa.api = { msg: (t, mau) => P.hud.msg(t, typeof mau === "string" && mau[0] === "#" ? [1, 3, 5].map((i) => parseInt(mau.slice(i, i + 2), 16)) : undefined), veThanh: () => phVeThanh(),
    // đáy khối bản đồ nhỏ (bản đồ, tọa độ, nút Tự đánh… — phóng to thì dài ra): khung trạng thái máy tính đặt ngay dưới
    duoiMM: () => { const mm = P.hud && P.hud.mm; let b = 0; if (mm) for (const e of mm.querySelectorAll("*")) { if (!e.offsetParent) continue; const r = e.getBoundingClientRect(); if (r.height && r.bottom > b) b = r.bottom; } return b; } };
  TongKim.api = { msg: PhongHoa.api.msg, duoiMM: PhongHoa.api.duoiMM, ten: () => (hero ? hero.name : ""), o: () => (hero ? hero.slot | 0 : 0), dt: () => !!(DT && DT.on), fps: () => fpsLast,
    qt: () => !!(Net.me && Net.me.admin), // bãi thử: chỉ quản trị vào, trừ khi quản trị mở cho mọi người
    taiLai: () => { if (world && !zoneLoad) gotoZone(world.zone, { at: [world.player.x, world.player.y] }); }, // phòng thử đóng: tải lại bãi cho quái thường về
    veBienKinh: (cau) => tkVeBienKinh(cau), // trận thật: hết trận / không có tên trong trận / rời chiến trường -> Biện Kinh
    // nút Rời trận trên bảng điểm (anh 13/11 lượt 86): hỏi lại (khung của game) rồi về Biện Kinh như Quân y "Rời chiến trường"
    roiTran: () => { if (!GW || !world || !laTk(world.zone)) return; P.audio.ui("click");
      GW.hoi("Rời chiến trường về <color=yellow>Biện Kinh<color>?<enter>Vẫn giữ phe, điểm và chức — muốn quay lại thì nhờ Xa phu đưa đến Điểm báo danh Tống Kim (không phải nộp phí lần nữa). Thưởng cuối trận chỉ dành cho người còn trong chiến trường lúc hết trận.", "Về Biện Kinh", "Ở lại")
        .then((ok) => { if (ok && world && laTk(world.zone)) tkVeBienKinh(); }); } };
  // Lôi đài (anh 15/11 — loidai.js): tin (chuỗi | [[chữ, màu]]; màu "#rrggbb" | [r, g, b]), khung hỏi của game, áp kết quả máy chủ, về chỗ máy chủ đưa (ldVe), bảng kết quả
  LoiDai.api = { msg: (t, mau) => P.hud.msg(t, Array.isArray(mau) ? mau : typeof mau === "string" && mau[0] === "#" ? [1, 3, 5].map((i) => parseInt(mau.slice(i, i + 2), 16)) : undefined),
    canh: (t) => P.hud.canh(t), ten: () => (hero ? hero.name : ""), o: () => (hero ? hero.slot | 0 : 0),
    hoi: (html, ok, huy) => { if (!GW) return Promise.resolve(false); P.audio.ui("click"); return GW.hoi(html, ok, huy); },
    apply: (j) => { if (!j) return; applyServer(j); if (GW) GW.refresh(true); }, tenVung: (z) => (P.maps.zones.find((x) => x.id === z) || {}).n || "",
    veVe: (ve, cau) => ldVe(ve, cau), ketQua: (kq, o) => GW && GW.ketQuaLoiDai(kq, { ...o, veTen: ldTenVe(o && o.ve) }),
    dongKq: () => { try { if (!P.win || !P.win.M || !P.win.M.ldkq) return; const w = P.win.get("ldkq"); if (w && w.visible) w.hide(); } catch {} } }; // vào sân mới: đóng bảng kết quả trận trước (soát E2E 15/11; cửa sổ chỉ có sau lần kết quả đầu)
  // đua ngựa (anh 16/11 — duangua.js): tin (chuỗi | [[chữ, rgb]]), khung hỏi của game, hình NPC (hộp / bẫy), áp kết quả máy chủ (nv / túi / tin / vào đường đua / về)
  DuaNgua.api = { msg: (t, mau) => P.hud.msg(t, Array.isArray(mau) ? mau : undefined), canh: (t) => P.hud.canh(t), ten: () => (hero ? hero.name : ""), o: () => (hero ? hero.slot | 0 : 0),
    hoi: (html, ok, huy) => { if (!GW) return Promise.resolve(false); P.audio.ui("click"); return GW.hoi(html, ok, huy); },
    ensure: (type) => { P.npc.ensure(type, "stand1").catch(() => {}); }, apply: (j) => dnApply(j),
    ketQua: (d) => GW && GW.ketQuaDuaNgua(d) }; // bảng tổng kết (windows.js — khung 排名 như lôi đài)
  // bùa lợi đồng đội dùng lên mình (anh 02/11 — Trợ Thủ "Bùa lợi cho đồng đội", may-chu/to-doi.js "buaDoi"): như tự dùng bùa đó ở cấp người dùng
  Net.wsNghe("buaDoi", (m) => { if (world) world.buaTuDoi(m.id, m.lv); });
  Net.wsNghe("gd", (m) => { if (world && hero) gdApply(m.g); }); // giao dịch (anh 14/11): người kia vừa đổi tiền / món / Đồng ý… — máy chủ đẩy ngay (may-chu/giao-dich.js day)
  VaDoi.api = { sinh: (w, s, vt) => { const B = VaDoi.p && P.vuotAi && P.vuotAi.cap.find((c) => c.cap === VaDoi.p.cap); if (!B) return null; const m = vaQuai(w, B, { id: s[1], lv: s[2], he: s[3], ten: s[4], hp: s[5], boss: s[8], at: vt ? [vt.x, vt.y] : [s[6], s[7]] }); if (m) m.home = [s[6], s[7]];
    if (m && s[8] && VaDoi.p.dot === VaDoi.p.tong) { m.bossCuoi = 1; m.hung = 1; } // boss cuối Vượt Ải (Nhiếp Thí Trần — đám cuối, anh 18/11): bảng boss (bosstg.js) + nổi giận (cuongno.js)
    return m; } };
  // Viêm Đế Bảo Tàng (anh 04/11): quái ở chỗ máy chủ chọn, chỉ số theo quái bãi cấp 95 của S1 (máy chủ tính — s[9..12])
  VdDoi.api = { sinh: (w, s, vt) => { const m = vaQuai(w, { dot: [] }, { id: s[1], lv: s[2], he: s[3], ten: s[4], hp: s[5], boss: s[8], at: vt ? [vt.x, vt.y] : ViemDe.diem(w, s[6], s[7]) }); if (m) { m.home = ViemDe.diem(w, s[6], s[7]); m.vd = 1; m.dmg = [s[9], s[10]]; m.ar = s[11]; m.def = s[12]; if (s[13] > 0) m.res = Object.fromEntries(Object.entries(m.res).map(([k, r]) => [k, Math.min(r, s[13])])); if (VdDoi.p && VdDoi.p.loai === "cuoi") m.hung = 1; } return m; } }; // hung: Lương Mi Nhi nổi giận (cuongno.js — anh 18/11)
  ViemDe.api = { P, hero: () => hero, world: () => world, NPCD: () => NPCD, GW: () => GW, applyServer, diPld, richText, pulsing: () => pulsing, zoneLoad: () => zoneLoad, giayMs, dungVat: (b, them) => dungVat(b, them), MAU_KN: MAU_TIN.kn };
  Net.onWarn = (t) => { if (world && hudMounted) P.hud.msg(t); };
  L.end(); // vaoSauDangNhap dựng màn chọn nhân vật / đổi mật khẩu ngay sau (cùng nhịp vẽ — không chớp màn đen)
}

function fail(e) {
  console.error(e); LOADING.giu = false; LOADING.end(); show("s-load"); $("#load-msg").textContent = "Lỗi: " + (e && e.message || e);
  const b = $("#load-lai"); if (b) { b.style.display = ""; b.onclick = () => location.reload(); } // anh 09/11: màn lỗi có đường thoát (người chơi mới kẹt ở màn đen, điện thoại không có F5)
}

// ---------- đăng nhập máy chủ chung ----------
// (cookie phiên còn hạn thì vào thẳng — boot / vaoSauDangNhap, lượt 61)
// đăng nhập xong / vào thẳng bằng phiên cũ: tài khoản quản trị tạo / đặt lại mật khẩu (may-chu/bao-mat.js batDoiMk — anh 10/11) -> màn đổi mật khẩu
// trước, xong mới chọn nhân vật; ổ khóa an toàn: trang mới luôn khóa
function sauDangNhap() {
  if (KAT) KAT.capNhat({ co: Net.me && Net.me.co2 ? 1 : 0, mo: 0 });
  return Net.me && Net.me.batDoiMk ? doiMkScreen() : selectScreen();
}
// màn Đổi mật khẩu (game.html #s-doimk — như màn đăng nhập): mật khẩu quản trị cấp (rà soát 10/11: trước không hỏi — cookie còn sót ở máy quán net là
// đổi được mật khẩu), mật khẩu mới ≥ 6 ký tự, khác tên tài khoản. Ô username ẩn: trình duyệt cập nhật đúng mật khẩu đã lưu của tài khoản này. Đổi xong
// máy chủ cấp phiên mới (cookie mới) — đổi thành công là xong, tải lại thông tin hỏng mạng cũng vào màn chọn nhân vật
function doiMkScreen() {
  show("s-doimk");
  $("#dm-ten").value = (Net.me && Net.me.ten) || "";
  $("#dm-tk").textContent = (Net.me && Net.me.ten) || "";
  $("#dm-err").textContent = "";
  $("#dm-thoat").onclick = async () => { if (P.audio) P.audio.ui("click"); await Net.logout(); loginScreen(); };
  $("#dm-form").onsubmit = async (e) => {
    e.preventDefault();
    const cu = $("#dm-cu").value, moi = $("#dm-moi").value, lai = $("#dm-lai").value, ten = (Net.me && Net.me.ten) || "";
    const loi = !cu ? "Nhập mật khẩu quản trị cấp (mật khẩu vừa dùng để đăng nhập)" : moi.length < 6 ? "Mật khẩu mới ít nhất 6 ký tự" : moi.trim() !== moi ? "Mật khẩu không được có khoảng trắng ở đầu hoặc cuối"
      : moi.toLowerCase() === ten.toLowerCase() ? "Mật khẩu không được trùng tên tài khoản" : moi === cu ? "Mật khẩu mới phải khác mật khẩu quản trị cấp" : moi !== lai ? "2 lần nhập mật khẩu mới không giống nhau" : "";
    if (loi) { $("#dm-err").textContent = loi; return; }
    $("#dm-ok").disabled = true; $("#dm-err").textContent = "";
    try { await Net.baoMat({ viec: "doiMk1", cu, moi }); }
    catch (er) { $("#dm-ok").disabled = false; if (er.ma !== "het-phien") $("#dm-err").textContent = er.message; return; }
    for (const id of ["#dm-cu", "#dm-moi", "#dm-lai"]) $(id).value = "";
    P.audio.ui("click"); $("#dm-ok").disabled = false;
    if (Net.me) Net.me.batDoiMk = 0;
    await Net.check().catch(() => {});
    selectScreen();
  };
  $("#dm-cu").focus();
}
function loginScreen(err = "") {
  dungDangNhap();
  show("s-login");
  $("#lg-err").textContent = err;
  // máy chủ đang bảo trì (anh 31/10 khuya — may-chu/bao-tri.js): báo giờ mở ngay trên màn đăng nhập (tài khoản quản trị vẫn vào được)
  // chế độ duyệt (anh 11/11 khuya — may-chu/duyet.js): báo máy chủ chỉ cho tài khoản được duyệt
  if (!err) Net.call("GET", "trang-thai").then((j) => {
    if (j && j.sv) { tenMay(j.sv); $("#lg-sv").textContent = (SERVERS.find((s) => s.id === P.only) || {}).n || ""; } // tên máy chủ của máy này (S1 / S2)
    if (!j || $("#lg-err").textContent) return;
    if (j.baoTri) $("#lg-err").textContent = j.baoTri.cau;
    else if (j.duyet) $("#lg-err").textContent = "Máy chủ đang giới hạn người chơi — chỉ tài khoản được quản trị duyệt mới vào được.";
  }).catch(() => {});
  $("#lg-sv").textContent = (SERVERS.find((s) => s.id === P.only) || {}).n || "";
  if ($("#lg-ungho")) $("#lg-ungho").remove(); // trang chủ: Ủng hộ duy trì máy chủ (anh 13/11)
  if ($("#cs-ungho")) $("#cs-ungho").remove(); // màn Chọn nhân vật (anh 13/11 tối — game tự đăng nhập lại nên ít người thấy trang đăng nhập)
  let cheDoDk = false;
  const row2 = $("#lg-pass2-row"), inp2 = $("#lg-pass2"), nutMode = $("#lg-mode"), note = $("#lg-note");
  const datCheDo = (dk) => {
    cheDoDk = !!dk;
    $("#lg-err").textContent = "";
    $("#lg-ok").textContent = cheDoDk ? "Tạo tài khoản" : "Đăng nhập";
    if (nutMode) nutMode.textContent = cheDoDk ? "Quay lại đăng nhập" : "Đăng ký";
    if (row2) row2.style.display = cheDoDk ? "" : "none";
    if (inp2) inp2.value = "";
    $("#lg-pass").autocomplete = cheDoDk ? "new-password" : "current-password";
    if (note) note.innerHTML = cheDoDk
      ? "Tên tài khoản <b>3–20 ký tự</b> (chữ thường không dấu, số, dấu _). Mật khẩu ít nhất <b>6 ký tự</b>."
      : "Chưa có tài khoản? Bấm <b>Đăng ký</b> để tạo tài khoản mới ngay (3–20 ký tự chữ thường, số, dấu _).";
  };
  if (nutMode) nutMode.onclick = () => { if (P.audio) P.audio.ui("click"); datCheDo(!cheDoDk); $("#lg-name").focus(); };
  datCheDo(false);
  $("#lg-form").onsubmit = async (e) => {
    e.preventDefault();
    const ten = $("#lg-name").value.trim(), mk = $("#lg-pass").value;
    if (!ten || !mk) { $("#lg-err").textContent = "Nhập tên tài khoản và mật khẩu"; return; }
    if (cheDoDk) {
      if (!/^[a-z0-9_]{3,20}$/i.test(ten)) { $("#lg-err").textContent = "Tên tài khoản 3–20 ký tự: chữ thường không dấu, số, dấu _"; return; }
      if (mk.length < 6) { $("#lg-err").textContent = "Mật khẩu cần ít nhất 6 ký tự"; return; }
      if (mk.toLowerCase() === ten.toLowerCase()) { $("#lg-err").textContent = "Mật khẩu không được giống tên tài khoản"; return; }
      if (inp2 && mk !== inp2.value) { $("#lg-err").textContent = "Mật khẩu nhập lại không khớp"; return; }
    }
    $("#lg-ok").disabled = true; $("#lg-err").textContent = "";
    try {
      if (cheDoDk) await Net.register(ten, mk);
      else await Net.login(ten, mk);
      $("#lg-pass").value = ""; if (inp2) inp2.value = "";
      if (P.audio) P.audio.ui("click");
      vaoSauDangNhap();
    }
    catch (er) { $("#lg-err").textContent = er.message; }
    finally { $("#lg-ok").disabled = false; }
  };
  ($("#lg-name").value ? $("#lg-pass") : $("#lg-name")).focus();
}
// mất phiên (tài khoản vừa đăng nhập ở nơi khác): dừng game, không lưu nữa, về màn đăng nhập
function kicked(t) {
  if (KAT) KAT.dongHet();
  if (world) stopGame();
  hero = null;
  loginScreen(t);
}

// ---------- chọn nhân vật (theo bản 2 js/csel.js: 3 ô, ô đang chọn sáng + bệ vàng, bảng thông tin + nút ở dưới) ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CS = { sel: 0, del: -1, slots: [] };
// nhân vật chưa nhập môn (fac = null) -> Vô Môn Phái của hệ
const facOf = (h) => (h.fac == null ? { n: "Vô Môn Phái", series: h.series } : P.factions.find((x) => x.id === h.fac));

function selectScreen() {
  // ô mật khẩu đăng nhập (trình duyệt có thể tự điền sẵn khi vào thẳng bằng phiên cũ): xóa khi rời màn đăng nhập — khỏi bị Chrome gắn với ô
  // nhập số trong game rồi hỏi "Cập nhật mật khẩu?" (anh 27/10)
  $("#lg-pass").value = "";
  CS.slots = [...Array(SLOT_N).keys()].map(loadSlot);
  CS.del = -1;
  let ptr = -1; try { ptr = +localStorage.getItem(SLOT_PTR); } catch {}
  CS.sel = Number.isInteger(ptr) && CS.slots[ptr] ? ptr : Math.max(0, CS.slots.findIndex(Boolean));
  $("#cs-row").innerHTML = CS.slots.map((h, i) => {
    const f = h && facOf(h);
    if (!h || !f) return `<div class="cs-slot empty" data-i="${i}"><div class="cs-head"><div class="nm" style="color:#c5b89a">Vị Trí Trống</div><div class="lv">Tạo nhân vật mới</div></div><div class="cs-body"><div class="plus">+</div><div class="ped"></div></div></div>`;
    const sp = P.ui.focus[f.series + (h.sex === "f" ? "f" : "m")];
    return `<div class="cs-slot" data-i="${i}"><div class="cs-head"><div class="nm" style="color:${SERIES_COL[f.series]}">${esc(h.name)}</div><div class="lv">Cấp ${h.lvl | 0 || 1} · ${esc(f.n)}</div></div>` +
      `<div class="cs-body"><div class="cs-char"><i style="width:${sp.frames * 100}%;background-image:url('assets/ui/${sp.file}');animation:csWalk ${(sp.frames * 0.12).toFixed(2)}s steps(${sp.frames}) infinite"></i></div><div class="ped"></div></div></div>`;
  }).join("");
  $$("#cs-row .cs-slot").forEach((el) => {
    // điện thoại (anh 01/11 — người chơi iPhone "không bấm vô nhân vật được"): chạm nhân vật đang chọn lần nữa = vào game (máy tính: bấm đúp)
    el.onclick = () => { const i = +el.dataset.i; if (CS.sel !== i || CS.del >= 0) { CS.sel = i; CS.del = -1; P.audio.ui("click"); csPanel(); } else if (DienThoai.bat()) csEnter(); };
    el.ondblclick = () => { CS.sel = +el.dataset.i; csEnter(); };
  });
  show("s-select");
  csPanel();
  // vừa tự tải lại trang lúc đang chơi (lệnh quản trị Bắt cả máy chủ F5 / nút Tải lại ngay — taiLaiNgay): vào lại đúng nhân vật
  let vl = null; try { vl = sessionStorage.getItem("vl_vaoLai"); sessionStorage.removeItem("vl_vaoLai"); } catch {}
  if (vl != null && CS.slots[+vl]) { CS.sel = +vl; CS.del = -1; csPanel(); setTimeout(() => { if (document.querySelector("#s-select.on")) csEnter(); }, 300); }
}

function csPanel() {
  tenMay(Net.me && Net.me.sv);
  $$("#cs-row .cs-slot").forEach((el) => el.classList.toggle("on", +el.dataset.i === CS.sel));
  const h = CS.slots[CS.sel], f = h && facOf(h), del = CS.del === CS.sel;
  const sv = h && SERVERS.find((x) => x.id === h.server);
  const info = h && f
    ? `<div class="cs-info">
        <span class="k">Nhân vật</span><b style="color:${SERIES_COL[f.series]}">${esc(h.name)}</b>
        <span class="k">Môn phái</span><span>${esc(f.n)}</span>
        <span class="k">Đẳng cấp</span><span>${h.lvl | 0 || 1}</span>
        <span class="k">Ngũ hành</span><span style="color:${SERIES_COL[f.series]}">${SERIES[f.series]}</span>
        <span class="k">Ngân lượng</span><span>${fmtMoney(h.gold || 0)}</span>
        <span class="k">Lần chơi cuối</span><span>${h.last ? new Date(h.last).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "-"}</span>
        <span class="k">Máy chủ</span><span class="wide">${sv ? esc(sv.n) : "-"}</span>
      </div>`
    : `<div class="cs-empty">Vị trí ${CS.sel + 1} đang trống. Hãy tạo nhân vật để bước vào giang hồ.</div>`;
  // vừa bấm ủy thác (Esc → Ủy thác — anh 11/11, utRoi): dòng nhắc dưới bảng thông tin
  const ut = h && f ? utDang(CS.sel, h) : null;
  const utChu = ut ? `<div class="cs-ut">Đang ủy thác ở <b>${esc(ut.bai)}</b> từ ${new Date(ut.luc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — có thể đóng trang.<br>Vào lại nhân vật này để dừng và xem bảng tổng kết (vắng dưới ${(luat().uyThac || {}).vangGiay || 90} giây thì không tính).</div>` : "";
  $("#cs-panel").innerHTML = info + utChu +
    (del ? `<div class="cs-warn">Xác nhận xóa vĩnh viễn <b>${esc(h.name)}</b> (cấp ${h.lvl | 0 || 1})? Không thể khôi phục!</div>` : "") +
    `<div class="cs-btns">${h && f
      ? del ? '<button class="red" id="cs-dely">Đồng Ý Xóa</button><button id="cs-deln">Hủy Bỏ</button>'
            : '<button class="go" id="cs-go">Vào Trò Chơi</button><button class="red" id="cs-del">Xóa Nhân Vật</button>'
      : '<button class="go" id="cs-new">Tạo Nhân Vật</button>'}<button id="cs-mk" title="Đổi mật khẩu đăng nhập">Đổi Mật Khẩu</button><button id="cs-out" title="Tài khoản ${esc(Net.me.ten)}">Đăng Xuất</button></div>`;
  const on = (id, fn) => { const b = $(id); if (b) b.onclick = () => { P.audio.ui("click"); fn(); }; };
  on("#cs-go", csEnter);
  on("#cs-mk", () => { if (KAT) KAT.doiMk1(); });
  on("#cs-new", csEnter);
  on("#cs-del", () => { CS.del = CS.sel; csPanel(); });
  on("#cs-deln", () => { CS.del = -1; csPanel(); });
  on("#cs-dely", async () => {
    try { await Net.remove(CS.sel); selectScreen(); }
    catch (e) { // bấm Hủy ở khung mật khẩu cấp 2 (e.boQua): thôi, không báo; câu báo mới thay câu cũ (không chồng nhiều dòng)
      if (e.ma === "het-phien" || e.boQua) return;
      for (const w of $$("#cs-panel .cs-loi")) w.remove();
      $("#cs-panel").insertAdjacentHTML("afterbegin", `<div class="cs-warn cs-loi">${esc(e.message)}</div>`);
    }
  });
  on("#cs-out", async () => { await Net.logout(); loginScreen(); });
}

// csVao: đang vào game — điện thoại chạm nhân vật đang chọn = vào (anh 01/11), chạm 2 lần nhanh không vào 2 lần
let csVao = false;
function csEnter() {
  if (csVao) return;
  const h = CS.slots[CS.sel];
  try { localStorage.setItem(SLOT_PTR, String(CS.sel)); } catch {}
  if (!h) return serverScreen(CS.sel);
  if (utDang(CS.sel, h)) utXoa(); // vào lại nhân vật đang ủy thác: bỏ dòng nhắc (máy chủ trả bảng tổng kết ở nhịp đầu)
  hero = h; csVao = true; enterGame().catch(fail).finally(() => { csVao = false; });
}

addEventListener("keydown", (e) => {
  if (!$("#s-select").classList.contains("on")) return;
  if ((KAT && KAT.dangHoi()) || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return; // đang hỏi mật khẩu cấp 2 / đang gõ ô chữ
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") { CS.sel = (CS.sel + (e.key === "ArrowLeft" ? SLOT_N - 1 : 1)) % SLOT_N; CS.del = -1; csPanel(); }
  else if (e.key === "Enter") csEnter();
});

// ---------- chọn server ----------
function serverScreen(slot) {
  tenMay(Net.me && Net.me.sv);
  show("s-server");
  $("#servers").innerHTML = SERVERS.filter((s) => !P.only || s.id === P.only).map((s) => `<button class="card" data-id="${s.id}"><b>${s.n}</b><small>${s.d}</small></button>`).join("");
  $$("#servers .card").forEach((b) => (b.onclick = () => { P.audio.ui("click"); createScreen(+b.dataset.id, slot); }));
  $("#sv-back").onclick = () => selectScreen();
}

// ---------- tạo nhân vật (theo bản 2 js/ui.js pickFaction) ----------
// Chọn giới (bấm hình nam / nữ) + hệ ngũ hành (5 nút giữa) + ngoại hiệu. Nhân vật mới là Vô Môn Phái, nhập môn phái ở cấp
// NOVICE_LV như bản 2 / Võ Lâm 1. Hệ không có phái nào nhận giới đang chọn thì khóa nút OK.
const NOVICE_LV = 10;
// Chính / Tà / Trung lập theo client settings/faction/门派设定.ini (Camp)
const CAMP = { shaolin: "Chính phái", tianwang: "Trung lập", tangmen: "Trung lập", wudu: "Tà phái", emei: "Chính phái", cuiyan: "Trung lập",
  gaibang: "Chính phái", tianren: "Tà phái", wudang: "Chính phái", kunlun: "Trung lập", huashan: "Trung lập" };
// Câu tả hệ: lấy nguyên của bản 2 (FAC_DETAIL), phần danh sách môn phái sinh từ dữ liệu (10 phái — anh chốt 24/10 bỏ Hoa Sơn, Võ Hồn,
// Tiêu Dao: nam hệ Thủy không có phái nhận -> khóa nút OK, báo như bản 2)
const SERIES_FLAVOR = [
  "Ngoại công cương mãnh, cận chiến dũng mãnh vô song.",
  "Thân pháp phi phàm, ám khí cơ quan và độc sát trí mạng.",
  "Kiếm pháp băng sát làm chậm và trị liệu cứu nhân độ thế.",
  "Chưởng pháp và đao pháp bạo liệt, hỏa thiêu liên hoàn cuồng bạo.",
  "Kiếm khí lôi đình, nội lực hộ thể huyền diệu, quyền pháp vô song.",
];
const facAllowed = (f, sex) => !SEX_ONLY[f.key] || SEX_ONLY[f.key] === sex;
const GAME_VER = "0.1.0";

function createScreen(server, slot) {
  const st = { sex: "m", s: 0 };
  $("#cc-ver").textContent = "Ver. " + GAME_VER;
  $("#cc-name").value = ""; $("#cc-err").textContent = "";
  $("#cc-series").innerHTML = SERIES.map((n, i) => `<button class="cc-se s-${i}" data-se="${i}" title="Hệ ${n}">${n}</button>`).join("");
  const sync = () => {
    // phái bản nháp (Hoa Sơn 27/10 — cong-cu/dung-hoa-son.mjs, f.nhap): chưa có NPC tiếp dẫn -> chưa hiện ở đây, vào bằng công cụ thử
    const facs = P.factions.filter((f) => f.series === st.s && !f.nhap), ok = facs.some((f) => facAllowed(f, st.sex));
    $$("#s-create .cc-char").forEach((el) => {
      const sx = el.dataset.sx, sp = P.ui.focus[st.s + sx];
      el.classList.toggle("active", sx === st.sex); el.classList.toggle("inactive", sx !== st.sex);
      const i = el.querySelector("i");
      i.style.width = sp.frames * 100 + "%";
      i.style.backgroundImage = `url('assets/ui/${sp.file}')`;
      i.style.animation = `ccWalk ${(sp.frames * 0.12).toFixed(2)}s steps(${sp.frames}) infinite`;
    });
    $$("#cc-series .cc-se").forEach((b) => b.classList.toggle("active", +b.dataset.se === st.s));
    const list = facs.map((f) => {
      const note = CAMP[f.key] + (SEX_ONLY[f.key] ? (SEX_ONLY[f.key] === "m" ? " - chỉ nhận nam" : " - chỉ nhận nữ") : "");
      // tên như bản 2: bỏ chữ "phái" ở cuối (Thiếu Lâm phái -> Thiếu Lâm), "môn" viết hoa (Thúy Yên Môn)
      const t = `${esc(f.n.replace(/ phái$/, "").replace(/ môn$/, " Môn"))} (${note})`;
      return facAllowed(f, st.sex) ? t : `<s>${t}</s>`;
    });
    const join = list.length > 1 ? list.slice(0, -1).join(", ") + " hoặc " + list[list.length - 1] : list[0];
    $("#cc-detail").innerHTML = `Hệ ${SERIES[st.s]}: Có thể gia nhập ${join}. ${SERIES_FLAVOR[st.s]}`;
    $("#cc-warn").textContent = ok ? "" : `Hệ ${SERIES[st.s]} không có môn phái nhận đệ tử ${st.sex === "f" ? "nữ" : "nam"}. Hãy chọn lại giới tính hoặc hệ khác!`;
    $("#cc-ok").disabled = !ok;
  };
  $$("#s-create .cc-char").forEach((el) => (el.onclick = () => { st.sex = el.dataset.sx; P.audio.ui("click"); sync(); }));
  $$("#cc-series .cc-se").forEach((b) => (b.onclick = () => { st.s = +b.dataset.se; P.audio.ui("click"); sync(); }));
  $("#cc-cancel").onclick = () => { P.audio.ui("click"); selectScreen(); };
  const ok = async () => {
    if ($("#cc-ok").disabled) return;
    const name = $("#cc-name").value.trim().replace(/\s+/g, " ").slice(0, 14);
    if (name.length < 2) { $("#cc-err").textContent = "Tên nhân vật cần ít nhất 2 ký tự"; $("#cc-name").focus(); return; }
    const start = P.chr.start.find((s) => s.series === st.s && s.sex === (st.sex === "f" ? 1 : 0));
    // attr = điểm tiềm năng đã cộng, pts / skPts = điểm tiềm năng / kỹ năng chưa dùng (M2). Máy chủ kiểm tên (không trùng cả máy chủ)
    // rồi đặt ô, server, cấp 1, ngày tạo.
    const h = { v: 1, slot, name, server, sex: st.sex, fac: null, facKey: null, series: st.s, lvl: 1, exp: 0, gold: 0, start, looks: {}, attr: { str: 0, dex: 0, vit: 0, eng: 0 }, pts: 0, skPts: 0, zone: null };
    $("#cc-ok").disabled = true; $("#cc-err").textContent = "";
    try { await Net.create(slot, h); }
    catch (e) { if (e.ma !== "het-phien") { $("#cc-err").textContent = e.message; $("#cc-ok").disabled = false; $("#cc-name").focus(); } return; }
    hero = loadSlot(slot);
    P.audio.ui("levelup"); enterGame().catch(fail);
  };
  $("#cc-ok").onclick = ok;
  $("#cc-name").onkeydown = (e) => { if (e.key === "Enter") ok(); };
  sync();
  show("s-create");
  $("#cc-name").focus();
}

// ---------- vào game ----------
const mainZones = () => P.maps.zones.filter((z) => z.kind === "chính" && !z.chiThuyen).sort((a, b) => a.lo - b.lo); // bờ Bắc Phong Lăng Độ: chỉ tới bằng thuyền
// công cụ thử → Bản đồ (anh 18/11 "thêm full map cả biện kinh với ba lăng cho dev"): thành / thôn, bãi chính, bãi phụ, đảo — xếp theo nhóm rồi cấp. Không có bản đồ hoạt động có
// phòng riêng (ải, Viêm Đế, Tống Kim, lôi đài, đua ngựa, bến thuyền — vào bằng NPC / công cụ thử của hoạt động đó) và khu bang (máy chủ xét bang)
const DEV_KIND = ["thôn", "thành", "chính", "phụ", "đảo"];
const devZones = () => P.maps.zones.filter((z) => DEV_KIND.includes(z.kind) && !z.bang).sort((a, b) => DEV_KIND.indexOf(a.kind) - DEV_KIND.indexOf(b.kind) || (a.lo | 0) - (b.lo | 0));
// bãi train mở theo cấp (anh 25/10: đủ cấp mới lên bãi sau): cấp ≥ cấp thấp nhất của bãi − thieuCap (cau-hinh.json vaoBai, máy chủ gửi
// trong luat; máy chủ cũng không tính quái giết ở bãi chưa đủ cấp — may-chu/do.js capVao). Thành / thôn vào lúc nào cũng được.
const capVao = (z) => (FARM_KINDS.has(z.kind) ? Math.max(1, (z.lo | 0) - (luat().thieuCap | 0)) : 1);
const moBai = (z) => (hero.lvl || 1) >= capVao(z);
const chuaMo = (z) => `Cần đạt cấp ${capVao(z)} mới vào được ${z.n}`;
// vào game đứng ở bãi + chỗ lúc thoát (anh 26/10 — bỏ "luôn đứng ở Ba Lăng" của 24/10: về thành nay phải có Thổ Địa Phù), tắt tự đánh;
// chưa lưu chỗ / bãi không còn / chưa đủ cấp thì Ba Lăng huyện (START_ZONE — cũng là thành để về, có Xa phu)
const START_ZONE = 53;

// màn chờ (ảnh + thanh tải) phủ từ lúc bấm vào game tới khi giao diện dựng xong — tải bãi đầu tiên dùng tiếp màn đó (LOADING.giu).
// Lần đầu vào game (hoặc gói tài nguyên vừa đổi): tải trước giao diện / icon / võ công của phái trên cùng màn chờ (src/game/tai-truoc.js)
async function enterGame() {
  LOADING.start(null, "Đang vào game…"); LOADING.giu = true;
  try { await taiTruoc(LOADING, P, hero).catch(() => {}); LOADING.start(null, "Đang vào game…"); await vaoGame(); } finally { LOADING.giu = false; LOADING.end(); }
}
async function vaoGame() {
  show("s-load"); $("#load-msg").textContent = "Đang vào game…";
  syncRanged(hero); pending.kills.length = 0; pending.at.length = 0; pending.nhat.length = 0; pending.deaths = 0; pending.uong.clear();
  ptTheo = null; if (PT) PT.datLai(); // Phân Thân của nhân vật trước: bỏ (nhịp đầu của nhân vật này tải lại — phanthan.js nhip)
  if (BC) BC.datLai(); // bàn cược Bầu Cua của nhân vật trước: đóng
  chuanAuto(hero, potHp); thanh = null; diXe = null;
  thuongCho = []; thuongDau = true; thuongVe = -1; P.hud.datThuong(0); // phần thưởng đang chờ nhận: nhịp đầu của nhân vật này báo lại (capNhatThuong)
  ItemDB.vuKhi = luat().vuKhi || null; // độ bền + giá gốc vũ khí (cau-hinh.json doBen.vuKhi)
  if (hero.oChieu) delete hero.oChieu.phim; // gắn phím Q W E… bản đầu (đã bỏ) treoNghi.tui = treoNghi.thuoc = false; // Trợ Thủ (src/game/auto.js)
  const zs = mainZones(), v = hero.viTri, cu = v && P.maps.zones.find((z) => z.id === v.z && moBai(z) && vaoDuoc(z));
  // thoát ở chiến trường Tống Kim (đặc tả đợt 2): trận còn và mình có tên trong trận -> vào lại hậu doanh (không thu phí), không -> Biện Kinh
  const tkDi = v && P.maps.zones.some((z) => z.id === v.z && laTk(z)) ? await tkDangNhap() : null;
  // thoát ở sân lôi đài (anh 15/11): còn là tuyển thủ chưa tự rời của sân đang chuẩn bị -> vào lại (miễn phí), không -> chỗ Công Bình Tử đã vào (máy chủ — ldDangNhap)
  const ldDn = !tkDi && v && P.maps.zones.some((z) => z.id === v.z && laLd(z)) ? await ldDangNhap() : null;
  // thoát ở đường đua (anh 16/11): lượt còn và mình còn đang đua -> vào lại đúng chỗ cũ, không -> Ba Lăng huyện (dnDangNhap)
  const dnDn = !tkDi && !ldDn && v && P.maps.zones.some((z) => z.id === v.z && laDn(z)) ? await dnDangNhap(v) : null;
  const kbDi = !tkDi && !ldDn && !dnDn && v && P.maps.zones.some((z) => z.id === v.z && z.bang) ? await khuDangNhap(v) : null; // khu vực bang (đợt 4): máy chủ xét còn được ở khu không
  const zone = (tkDi && tkDi.zone) || (ldDn && ldDn.zone) || (dnDn && dnDn.zone) || (kbDi && kbDi.zone) || cu || P.maps.zones.find((z) => z.id === START_ZONE) || zs.find((z) => z.id === hero.farmZone) || [...zs].reverse().find((z) => z.lo <= hero.lvl) || zs[0];
  await gotoZone(zone, tkDi ? (tkDi.at ? { at: tkDi.at } : {}) : ldDn ? (ldDn.at ? { at: ldDn.at } : {}) : dnDn ? (dnDn.at ? { at: dnDn.at } : {}) : kbDi ? (kbDi.at ? { at: kbDi.at } : {}) : { ...(cu && Number.isFinite(v.x) && Number.isFinite(v.y) ? { at: [v.x, v.y] } : {}), ...(cu && v.c ? { chung: true } : {}) }); // thoát ở bản quái chung: vào lại bản chung
  world.auto = false;
  // vào game đứng yên (anh 29/10): bỏ đường đi / mục tiêu có được trong lúc màn chờ còn tải (World tạo ra đã tắt tự đánh — world.js)
  { const p = world.player; p.goal = null; p.path = null; p.target = null; p.loot = null; p.talkTo = null; p.manual = false; }
  // thoát lúc đang tự đánh (hero.tuDanh — save) mà vào lại ở bãi luyện công: tự đánh tiếp (anh 29/10 lần 2 "out game vào lại auto nên lưu"), bật
  // sau khi đã tải xong; vào ở thành thì vẫn đứng yên
  const tiepDanh = !!hero.tuDanh && FARM_KINDS.has(world.zone.kind) && world.player.hp > 0;
  if (tiepDanh) { world.auto = true; world.neo = [world.player.x, world.player.y]; }
  mountHud();
  if (DT) DT.vaoGame(); // điện thoại: vào game là thu gọn (anh 30/10 — người chơi cần thì mở)
  P.hud.datBoCuc(hero.auto.boCuc); // bố cục màn hình đã lưu của nhân vật này (Trợ Thủ → Khác — boCuc)
  setHudMap();
  // ô T / P: lần vào game đầu loadZone chạy trước mountHud nên chưa vẽ (anh 30/10 lần 2 "vào game thì không thấy kĩ năng đã gắn vào ô T P" —
  // phải đổi bãi / đổi chiêu mới hiện)
  skillHud();
  P.hud.setAuto(world.auto);
  P.hud.setToggle("Horse", !!(hero.looks && hero.looks.horse) && !hero.rideOff); // nút Lên xuống ngựa theo nhân vật vừa vào
  show(null);
  P.hud.msg(`${hero.name} vào ${world.zone.n}${world.chung ? ` (quái chung, +${qcPct()}% kinh nghiệm và ngân lượng)` : ""}. Bấm đất để đi, bấm quái để đánh · Space: tự đánh · F1: giúp đỡ · đi bãi luyện công: nói chuyện với Xa phu, về thành: Thổ Địa Phù`);
  if (tiepDanh) P.hud.msg("Tự đánh: Bật — lần trước thoát game lúc đang tự đánh (Space để tắt)");
  P.hud.msg(TIN_VAO, [255, 196, 120]); dungTrongGame(P.hud); // ấn ký bản gốc (anh 11/11 — an-ky.js): soát chữ ký ô góc trái
  for (const t of khuTinCho.splice(0)) P.hud.msg(t, MAU_TIN.tien); // khu vực bang (đợt 4 — khuDangNhap): lý do không vào khu / khu đã đổi
  // tin cập nhật chưa xem (anh 29/10): 1 dòng nhắc + chữ "Mới" ở nút Tin cập nhật của bảng Esc / chấm đỏ ở nút Tùy chỉnh thanh dưới
  { const moi = tinChuaXem(); GW.datTinMoi(moi.length > 0); if (moi.length) P.hud.msg(`Có ${moi.length} tin cập nhật mới — mới nhất: ${moi[0].ten} (${moi[0].ngay}). Bấm Esc → Tin cập nhật để xem.`, [255, 217, 78]); }
  // poster sự kiện (anh 17/11 — src/game/poster.js): lần đầu vào thế giới của trang này, sự kiện Báo Đáp Ân Sư đang mở (tu ≤ hôm nay < moHet, giờ Việt Nam — ngày máy
  // chủ gửi ở LUAT) và hôm nay chưa tích "Không hiển thị lại hôm nay". Quản trị xem trước khi sự kiện mở: thêm ?poster=1 vào địa chỉ trang. Anh 17/11 "event ngày mai có thể
  // cho hiển thị poster từ hnay, tối 00:00 reset là có thể tham gia": hiện từ 1 ngày TRƯỚC ngày mở (truoc1(tu)) — giới thiệu trước, 0 giờ hôm sau mới tham gia được
  if (!posterDa) {
    posterDa = true;
    const B = luat().baoDapAnSu, d = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), xemThu = /[?&]poster=1\b/.test(location.search);
    const truoc1 = (s) => { const t = Date.parse(String(s || "") + "T00:00:00Z"); return Number.isFinite(t) ? new Date(t - 864e5).toISOString().slice(0, 10) : String(s || ""); };
    if (B && (xemThu || (B.bat !== false && truoc1(B.tu) <= d && d < B.moHet && !posterAnHomNay("bdas"))))
      moPoster({ ma: "bdas", ngang: "assets/ui/su-kien/bao-dap-an-su-ngang-4.jpg", doc: "assets/ui/su-kien/bao-dap-an-su-doc-4.jpg" }); // -4 (anh 18/11 sáng): thêm Nguồn Trung Dược + khóa 72 giờ, sửa lỗi chính tả của -3; -3 (anh 18/11): poster đúng nguồn của game (chỉ 30 / ngày, Dã Tẩu 10 bình + 5 chỉ, Trung Dược ở Kỳ Trân Các); -2: luật hương bao mới (anh 17/11 tối) — tên mới để trình duyệt không giữ ảnh cũ (ảnh giữ 1 ngày — tep.js GIU)
  }
  // khóa an toàn (anh 10/11): ổ khóa theo trạng thái hiện tại; lần đăng nhập trước (mỗi lần đăng nhập báo 1 lần) — người chơi tự thấy có ai vào lén
  if (KAT) { if (P.hud.setKhoaAnToan) P.hud.setKhoaAnToan(KAT.tt); if (DT) DT.setKhoaAnToan(KAT.tt); }
  if (Net.me && Net.me.truoc && Net.me.truoc.luc && !Net.me.daBaoTruoc) {
    Net.me.daBaoTruoc = 1;
    P.hud.msg(`Lần đăng nhập trước: ${gioNgay(Net.me.truoc.luc)} · IP ${Net.me.truoc.ip || "?"} — không phải bạn thì đổi mật khẩu ngay (bấm ổ khóa an toàn)`, [180, 200, 255]);
  }
  // đã đăng ký xóa mật mã rương (Lễ quan — moPassRuong): nhắc ngày xác nhận như client (ResetBox:AnnounceResetBoxDate lúc vào game)
  if (hero.xoaMk) {
    const s = String(hero.xoaMk), so = (t) => +new Date(t).toISOString().slice(0, 10).replace(/-/g, "");
    const xoa = so(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) + 7 * 864e5), nay = so(Date.now() + 7 * 3600e3);
    if (nay === xoa) P.hud.msg("Hôm nay là ngày xác nhận xóa pass rương — đến Lễ quan (Ba Lăng huyện) để xác nhận, qua hôm nay đăng ký sẽ bị hủy");
    else if (nay < xoa) P.hud.msg(`Pass rương sẽ được xóa vào ngày ${ngayXoaMk(xoa)} — đúng ngày đó đến Lễ quan xác nhận, nếu không đăng ký xoá pass rương sẽ bị hủy bỏ`);
  }
  saveCleanup();
  if (!looping) { looping = true; requestAnimationFrame(loop); }
}

// Về màn chọn nhân vật: lưu (gửi lên máy chủ ngay), báo rời game (người khác thôi thấy), dừng bãi, tắt nhạc
function leaveGame() {
  P.audio.ui("click");
  save(); Net.flush();
  const o = hero.slot | 0;
  Net.leave(o, false, takePending()).then((j) => { if (j && j.nv && Net.me && Net.me.nv[o]) Object.assign(Net.me.nv[o], j.nv); });
  if (KAT) KAT.capNhat({ co: KAT.tt.co, mo: 0 }); // thoát game: máy chủ khóa lại khóa an toàn của trang này (nhịp s = null — bao-mat.js khoaTrang)
  stopGame();
  selectScreen();
}
function stopGame() {
  if (KAT) KAT.dongHet(); // khung hỏi mật khẩu cấp 2 đang mở (việc trong game): bỏ — không gửi lại việc đó ở màn chọn nhân vật
  zoom = 1; fpsEl.textContent = "";
  if (dev) dev.toggle(false);
  qt.toggle(false);
  Net.wsDong(); BossTG.thoat(); SanNhim.thoat(); QuaiCanh.thoat(); VaDoi.thoat(); VdDoi.thoat(); LoiDai.thoat(); DuaNgua.thoat(); // kênh tức thời + bảng boss thế giới + phòng Vượt Ải tổ đội + thanh tỉ số lôi đài + thanh đua ngựa
  if (HD) { HD.dong(); HD.L = null; HD.api.chamDo(false); } // Hướng dẫn hoạt động: lịch của nhân vật cũ
  if (mocNhan) mocNhan.update(null); // bảng mộc nhân Ba Lăng: không còn ở lại màn đăng nhập / chọn nhân vật
  P.hud.keoBang(false); // đang kéo thả bảng mà thoát: bỏ phần chưa lưu (vào lại lấy bố cục đã lưu — vaoGame)
  document.querySelector(".qt-loa")?.classList.remove("on"); // dòng thông báo của quản trị
  if (GW) GW.closeAll();
  if (NPCD) NPCD.close();
  bhThoat(); // bang hội của nhân vật cũ: dòng trên đầu, công cáo ghim, lời mời (anh 14/11)
  P.dev.speed = 1;
  world = null; simAt = 0; P.audio.stopMusic();
}

// Đổi bản đồ: màn chờ + thanh tải (src/game/loading.js — anh muốn 26/10: qua Internet chờ hơn 10 giây mà không thấy gì). Đang chuyển mà
// bấm chuyển nữa (hoặc Trợ Thủ tự đổi bãi) thì bỏ qua, trả lời hẹn của lần đang đi.
// tải lại trang theo lệnh quản trị / bản mới (anh 11/11 — may-chu/cau-hinh-qt.js tlNay, nhịp trả tl { v, g, b }): v lớn hơn lúc mở trang -> đếm ngược
// g giây (+ rải ngẫu nhiên 0–15 giây cho máy chủ khỏi dồn) rồi tự tải lại, vào lại đúng nhân vật (sessionStorage vl_vaoLai — selectScreen); b (mã bản
// trình duyệt) khác lúc mở trang (vừa lên VPS) -> dòng nhắc "có bản mới" + nút Tải lại ngay (không bắt)
let tlGoc = null, tlDem = false, tlNhac = false;
function tlXet(tl) {
  if (!tl) return;
  if (!tlGoc) { tlGoc = { v: tl.v | 0, b: tl.b || "" }; return; }
  if ((tl.v | 0) > tlGoc.v && !tlDem) { tlDem = true; batTaiLai(Math.max(5, tl.g | 0 || 30) + Math.floor(Math.random() * 16)); return; }
  if (tl.b && tlGoc.b && tl.b !== tlGoc.b && !tlNhac && !tlDem) { tlNhac = true; thanhTl("Đã có bản cập nhật mới của game — tải lại trang (F5) để dùng bản mới.", false); }
}
function thanhTl(text, dem) {
  let el = document.querySelector(".tl-bao");
  if (!el) {
    el = document.createElement("div"); el.className = "tl-bao"; el.setAttribute("translate", "no");
    el.innerHTML = `<span></span><button type="button" class="tl-ok">Tải lại ngay</button><button type="button" class="tl-x" title="Ẩn">✕</button>`;
    document.body.appendChild(el);
    el.querySelector(".tl-ok").onclick = () => taiLaiNgay(); el.querySelector(".tl-x").onclick = () => el.remove();
  }
  el.querySelector("span").textContent = text; el.querySelector(".tl-x").style.display = dem ? "none" : "";
}
function taiLaiNgay() {
  try { if (hero && world) sessionStorage.setItem("vl_vaoLai", String(hero.slot | 0)); } catch {}
  try { Net.flush(true); } catch {}
  setTimeout(() => location.reload(), 150);
}
function batTaiLai(giay) {
  let con = giay; const chu = () => `Máy chủ yêu cầu tải lại trang để cập nhật — tự tải lại sau ${con} giây (vào lại đúng nhân vật).`;
  if (P.hud) P.hud.msg(chu(), [255, 217, 78]); thanhTl(chu(), true);
  const t = setInterval(() => { con--; thanhTl(chu(), true); if (con <= 0) { clearInterval(t); taiLaiNgay(); } }, 1000);
}
const LOADING = new ZoneLoading();
dungManCho(LOADING.el); // logo + chữ ký trên màn chờ (an-ky.js)
const MAP_EST = 2.5e6, ACT_EST = 60e3, TILE_EST = 1.5e6; // ước lượng byte (ảnh bản đồ ~1–3,3 MB; thanh tải thay bằng số thật khi biết)
// Anh 28/10 "thanh loading kiểm tra kĩ, tránh lỗi dẫn đến không đồng bộ game" (ảnh: kẹt "Đang vào Thách thức thời gian (Cao cấp)… 100%"):
//   - mọi phần tải có hạn (map.js, npc-pack.js, jx-char.js, sw.js): mạng / đường hầm khựng 1 tệp không làm màn chờ treo mãi; phần không cần để
//     vào bãi (hình quái / NPC, hình nhân vật, ô ảnh quanh chỗ đứng) quá TAI_PHAN thì vào luôn, vẽ tới đâu tải tiếp tới đó;
//   - lỗi lúc tải bản đồ (trước khi đổi world) thì thử lại 1 lần, không đứng ở màn lỗi;
//   - zoneToi: trong lúc tải, nhịp báo máy chủ bãi ĐANG TỚI — bản đầu báo bãi cũ, tải quá 20 giây (qua đường hầm) thì máy chủ coi như đã rời
//     ải / thuyền và hủy (mất phí Vượt Ải).
let zoneLoad = null, zoneToi = null, chungToi = false; // chungToi: bãi đang tới là bản quái chung
const TAI_PHAN = { quai: 30000, nguoi: 20000, o: 15000 };
const DUNG_YEN = 10000; // thanh tải đứng yên chừng này (ms) thì thôi chờ phần đó
// p xong / lỗi, hoặc quá ms, hoặc thanh tải đứng yên DUNG_YEN (mỗi giai đoạn đếm từ lúc bắt đầu) — cái nào tới trước; chỉ báo console khi phải
// bỏ chờ thật (bản thử đầu báo cả lúc đã xong từ lâu)
const coHanP = (p, ms, ten, L) => {
  if (L) L.luc = performance.now();
  let xong = false;
  const bao = (t) => () => { if (!xong) console.warn(`Tải ${ten}: ${t} — vào bãi trước, tải tiếp sau`); };
  return Promise.race([Promise.resolve(p).catch((e) => console.warn("Tải " + ten + " lỗi:", e)), new Promise((r) => setTimeout(r, ms)).then(bao(`quá ${ms / 1000} giây`)),
    ...(L ? [L.dungYen(DUNG_YEN).then(bao(`thanh tải đứng yên ${DUNG_YEN / 1000} giây`))] : [])]).finally(() => { xong = true; });
};
function gotoZone(zone, opt = {}) {
  if (zoneLoad) return zoneLoad;
  const L = LOADING.start(zone.n);
  zoneToi = zone.id; chungToi = !!opt.chung && laQc(zone);
  zoneLoad = loadZone(zone, opt, L)
    .catch((e) => { console.warn("Đổi bản đồ lỗi — thử lại:", e); return new Promise((r) => setTimeout(r, 1500)).then(() => loadZone(zone, opt, LOADING.start(zone.n))); })
    .finally(() => { zoneLoad = null; zoneToi = null; chungToi = false; L.end(); });
  return zoneLoad;
}
// opt.revive: vào thành sau khi trọng thương — đứng ở điểm hồi sinh của client, sinh lực / nội lực REVIVE_HP, dưỡng sức rồi quay lại bãi.
// opt.chung: vào bản quái chung của bãi (anh 03/11 — bãi có trong luat().quaiChung.bai; không có thì bản quái riêng)
async function loadZone(zone, opt, L) {
  const chung = !!opt.chung && laQc(zone);
  // bỏ hình quái của bãi cũ (giữ loại của bãi mới) để bộ nhớ không cộng dồn qua các bãi; tải sẵn hình quái bãi mới
  // (cùng lúc với ảnh bản đồ) để vào bãi là thấy quái ngay, không chỉ thấy tên. NPC (anh 02/11 — Biện Kinh dựng nguyên 68 NPC: tải hết mọi động
  // tác lúc vào là ~20 MB): không tải trước ở đây — chỉ hình đứng (stand1, World.drawNpc) của NPC trong khung nhìn lúc vào (cuối hàm), NPC xa tải
  // khi đi tới gần (World chỉ vẽ trong khung nhìn — npc-pack draw tự tải)
  if (laTk(zone)) await coHanP(TongKim.napDuLieu(), 5000, "dữ liệu Tống Kim"); // chiến trường Tống Kim: NPC hậu doanh (Quân y, rương) theo tong-kim.json
  const npcs = zoneNpcs(zone);
  const mobTypes = [...(zone.m || []), ...(zone.boss != null ? [zone.boss] : [])].map((id) => P.mons[id] && P.mons[id].anim).filter(Boolean);
  const types = mobTypes.concat(npcs.map((n) => n.type).filter(Boolean)); // vật bản đồ: không có hình kho NPC
  P.npc.retain(types);
  if (NPCD) NPCD.close();
  // khung Giao vật phẩm / Chọn thưởng (Dã Tẩu, hợp Sát thủ giản) không theo sang bản đồ khác: đóng (lời hứa trả null — không gửi gì). Bấm Xác nhận ở bản đồ mới là
  // gọi việc của NPC từ bản đồ khác — máy chủ chặn + cờ (soát 13/11)
  if (GW) for (const k of ["giao", "thuong"]) { const x = GW.W.get(k); if (x && x.visible) x.hide(); }
  // phần việc của thanh tải đặt đủ từ đầu (thanh không tụt lùi): ảnh bản đồ, hình quái / NPC từng tấm, hình nhân vật, ô ảnh bản đồ thành
  const mapPart = L.part(MAP_EST), actPart = L.part(ACTS.length * ACT_EST), tilePart = (P.maps.maps[zone.map] || {}).tiles ? L.part(TILE_EST) : null;
  const [map] = await Promise.all([GameMap.load(P.maps, zone.map, undefined, mapPart).then((m) => { mapPart(1); return m; }), coHanP(P.npc.ensureAll(mobTypes, (p, b) => L.track(p, b)), TAI_PHAN.quai, "hình quái", L)]);
  // đổi bản đồ giữ sinh lực / nội lực đang có (như client — không hồi đầy khi qua bản đồ); hồi sinh ở thành: REVIVE_HP
  const cur = world && world.player.hp > 0 ? { hp: world.player.hp / world.player.hpMax, mp: world.player.mp / world.player.mpMax } : {};
  // chỗ đứng rơi vào ô vật cản (chỗ Xa phu thả / Thuyền phu đưa về ở bến Phong Lăng Độ nằm trên cầu tàu): ô đi được gần nhất trong 12 ô —
  // engine client cũng đẩy ra; không có thì như cũ (ngẫu nhiên / điểm hồi sinh)
  const oDi = (a) => { if (!a) return null; if (map.walkable(a[0], a[1])) return a; const i = map.grid ? map.nearestCell(a[0], a[1], 12) : -1; return i >= 0 ? map.center(i) : null; };
  const oVao = oDi(diemVao(zone)), atVao = opt.revive ? null : oVao;
  let atOpt = oDi(opt.at);
  if (atOpt && oVao && zone.bo && map.vung(atOpt[0], atOpt[1]) !== map.vung(oVao[0], oVao[1])) atOpt = null; // chỗ đứng cũ ở bờ kia sông: vào chỗ của bãi
  const docMang = opt.revive ? null : carryDoc();
  const w = new World(P, map, zone, hero, { npcs, vcOpen: vcOpen(), canBang: luat().canBang, noiCong: luat().noiCong, kyNang: luat().kyNangPhai, quaiVC: luat().quaiVoCong, tanThu: luat().tanThu, buffs: opt.revive ? null : carryBuffs(), diem: diemQuai(zone), suKien: laThuyen(zone) || laAi(zone) || laVd(zone) || laPh(zone) || laTk(zone) || laLd(zone) || laDn(zone) || chung,
    ...(opt.revive ? { at: atOpt || revivePoint(zone, map), hp: REVIVE_HP, rest: true } : { ...cur, ...(TOWN_KINDS.has(zone.kind) ? { at: revivePoint(zone, map) } : {}), ...(atVao ? { at: atVao } : {}), ...(atOpt ? { at: atOpt } : {}), ...(opt.rest ? { rest: true } : {}) }) });
  if (docMang) w.player.poison = docMang; // độc đang dính theo sang bản đồ mới (carryDoc)
  w.chung = chung; // bản quái chung: chỉ thấy người cùng bản (nhịp s.c — may-chu/the-gioi.js)
  w.qcManh = chung ? (luat().quaiChung || {}).manh || null : null; // quái bản chung mạnh hơn (anh 03/11 — quaichung.js: sát thương, tần suất đánh)
  w.satDat = (luat().satThu || {}).dat || null; // Boss Sát thủ chung bậc từ doKho.tuCap: sát thương / chính xác / né tránh đặt sẵn (quaichung.js)
  w.baiTrain = FARM_KINDS.has(zone.kind); w.tangIch = luat().tangIchDoi || null; // tăng ích tổ đội chỉ ở bãi train (World.tangIchDoi — anh 03/11)
  // bùa đồng đội dùng lên mình (World.buaTuDoi đánh dấu tuDoi) không theo sang bản riêng / bãi chưa có bản chung (anh 06/11 "buff chỉ có thể cộng ở bãi quái
  // chung" — soát 06/11: carryBuffs mang theo mọi bùa đang có)
  if (!w.chiaBuff()) { let bo = false; for (const [k, b] of w.player.buffs) if (b.tuDoi) { w.player.buffs.delete(k); bo = true; } if (bo) w.refreshStats(false); }
  datMocNhan(w, zone, P); // Ba Lăng huyện: 5 mộc nhân 5 hệ luyện công (mocnhan.js)
  if (laDao(zone)) datCocDao(w, zone, P); // Đảo Tẩy Tủy: Cọc gỗ / Bao cát / Mộc nhân của client (mocnhan.js)
  if (world) { w.auto = world.auto; w.dev = world.dev; w.doiTen = world.doiTen; w.luyenDem = world.luyenDem; } // giữ tự đánh + cờ công cụ thử + đồng đội (vòng sáng) + đòn luyện chưa gửi khi đổi bãi
  // Lôi đài (anh 15/11 — D9 "Trợ Thủ mất tác dụng trong sân: đánh tay 100%; ra sân chạy lại như cũ"): vào sân tắt tự đánh (nhớ lúc vào — LoiDai.autoTruoc); ra khỏi sân bằng
  // mọi đường (Rời sân, hết trận, không còn tên ở sân, quản trị đưa đi…) thì World mới nhận lại tự đánh ở đây — ở thôn / thành thì tạm dừng / Trợ Thủ làm việc ở thành (ldVe đặt
  // thanh) như sau Tống Kim (dưới: w.tamDung)
  if (laLd(zone)) {
    const dau = LoiDai.autoTruoc == null; // vừa từ ngoài vào sân (World mới trong sân thì không báo lại)
    if (dau) LoiDai.autoTruoc = !!w.auto;
    // báo 1 câu lúc vào khi Trợ Thủ đang bật hoặc có dòng tự uống thuốc đang bật (soát 16/11: trong sân cả tự uống cũng tắt — người đánh tay chỉ bật thuốc trước không được báo)
    if (hudMounted && (w.auto || (dau && hero.auto.thuoc.some((t) => t.on)))) P.hud.canh("Lôi đài: Trợ Thủ không hoạt động trong sân — đánh tay");
    // anh 17/11: trong sân không dùng thuốc / hoàn; hoàn đang có tạm mất tác dụng (world.js bonus — giờ dừng, rời sân có tác dụng lại) — báo 1 lần lúc vào nếu đang có
    if (hudMounted && dau) { const co = Object.keys(hero.buff || {}).filter((k) => hero.buff[k] > 0 && ItemDB.buffDef(k)).map((k) => String(ItemDB.buffDef(k).n || "").trim()).filter(Boolean);
      P.hud.msg(`Sân Công Bình Tử: không dùng được thuốc, hoàn${co.length ? ` — ${co.join(", ")} tạm mất tác dụng (dừng giờ), rời sân có tác dụng lại` : ""}`, "#ffd54a"); }
    w.auto = false; if (hudMounted) P.hud.setAuto(false);
  } else if (LoiDai.autoTruoc != null) {
    const bat = LoiDai.autoTruoc && !!world && !w.auto; LoiDai.autoTruoc = null;
    if (bat) { w.auto = true; if (hudMounted) { P.hud.setAuto(true); P.hud.msg("Tự đánh: Bật lại (đã rời lôi đài)"); } }
  }
  // đường đua (anh 16/11 — client racegame cấm võ công, Trợ Thủ không có việc gì): vào đường đua tắt tự đánh (nhớ lúc vào — DuaNgua.autoTruoc), ra khỏi thì World mới nhận lại
  if (laDn(zone)) {
    if (DuaNgua.autoTruoc == null) DuaNgua.autoTruoc = !!w.auto;
    if (hudMounted && w.auto) P.hud.canh("Đường đua: Trợ Thủ không hoạt động — tự chạy bằng chuột / bản đồ nhỏ");
    w.auto = false; if (hudMounted) P.hud.setAuto(false);
  } else if (DuaNgua.autoTruoc != null) {
    const bat = DuaNgua.autoTruoc && !!world && !w.auto; DuaNgua.autoTruoc = null;
    if (bat) { w.auto = true; if (hudMounted) { P.hud.setAuto(true); P.hud.msg("Tự đánh: Bật lại (đã rời đường đua)"); } }
  }
  if (world && !opt.revive && !laLd(zone)) { w.player.potHp = world.player.potHp; w.player.potMp = world.player.potMp; } // thuốc đang hồi — vào sân Công Bình Tử thì bỏ (anh 17/11: hiệu ứng có từ ngoài mất hiệu lực)
  w.onLevel = (lvl, n) => {
    const mo = mainZones().filter((z) => capVao(z) > lvl - n && capVao(z) <= lvl).map((z) => z.n);
    P.audio.ui("levelup"); P.hud.msg(`Lên cấp ${lvl}! +${n * 5} điểm tiềm năng, +${n} điểm kỹ năng${mo.length ? " · Đã mở bãi " + mo.join(", ") : ""}`); save();
    // vừa qua mốc thưởng thăng cấp (may-chu/thuong-cap.js — anh 02/11)
    const moc = (luat().thuongCap || []).filter((c) => c > lvl - n && c <= lvl);
    if (moc.length) P.hud.msg(`Đạt mốc thưởng thăng cấp ${moc.join(", ")} — mở Nhận thưởng → Thưởng thăng cấp để nhận quà`, MAU_TIN.tien);
  };
  // qua cổng thôn / thành (khu an toàn — World map.an, anh 02/11): báo trạng thái như client đổi khi qua trap cổng
  // Tống Kim trận thật: không báo ở đây — đổi pha báo danh / xong làm cả bản đồ "an toàn"; vào / ra hậu doanh đã báo lúc qua bẫy (tongkim.js dichChuyen)
  w.onAnToan = (an) => TongKim.laTran() || laTk(zone) || laLd(zone) || laDn(zone) ? null : TongKim.laTo() ? P.hud.msg(an ? "Vào doanh trại phe mình — khu an toàn, không đánh nhau được" : "Rời doanh trại — vào trận") : P.hud.msg(an ? `Vào khu vực an toàn của ${zone.n} — trạng thái phi chiến đấu, không thể đánh nhau` : `Rời khu vực an toàn — trạng thái chiến đấu`);
  // Rương chứa đồ (vật bản đồ — script client OpenBox()): mở khung rương + cửa sổ Đồ dùng
  w.onTalk = (n) => {
    if (n.viec === "ruong") return GW && GW.openStore();
    if (n.dnHop) return DuaNgua.hop(n); // đường đua (anh 16/11): hộp Đạo cụ hỗ trợ (client npc 1288 — npctoolitem.lua) — may-chu/dua-ngua.js viec "hop"
    if (n.bhVai) return khuNpc(n); // khu vực bang (đợt 4): Tổng quản / nhà tác phường, Tế Tửu, Xa phu khu, cột biểu tượng
    if (n.tkHau) return tkQuanY(n); // Tống Kim trận thật: Quân y hậu doanh (bán thuốc, rời chiến trường)
    // Điểm báo danh Tống Kim 325 (anh 09/11 "map vào tống kim, xa phu đi vào, có tống và kim như client"): Mộ binh quan / Quân Nhu quan mỗi phe (script client song_ / jin_ signup, shop)
    { const bd = /[\\/](song|jin)_(signup|shop)\.lua$/.exec(n.script || ""); if (bd) return tongKimNpc(bd[2] === "shop" ? { viec: "qn" } : { viec: "mo", phe: bd[1] === "jin" ? 1 : 0 }, n); }
    if (n.tk) return tongKimNpc({ viec: n.tk === "qn" ? "qn" : "mo" }, n); // Biện Kinh: Mộ binh quan (tk "mb") / Quân Nhu quan (tk "qn") — may-chu/tong-kim.js lam
    if (n.ph) return phNpc(n); // Phong Hỏa Liên Thành: Quân Nhu quan / Xa phu của đại doanh (anh 04/11)
    if (n.name === "Vệ binh Thành môn" && zone.id === PH_THANH) return phongHoaVe(n); // Biện Kinh: "Tham gia chiến dịch thủ thành" lúc trận nhận báo danh
    if (n.sap) return GW && GW.cho.xemSap(n.sap); // NPC trông sạp chợ trời (chủ vắng mặt — sapTick): khung RAO BÁN
    if (n.script && /seasonnpc\.lua$/i.test(n.script)) return daTau({ viec: "mo" }); // Dã Tẩu (anh 27/10 — may-chu/da-tau.js)
    if (n.script && /武林盟传人\.lua$/.test(n.script)) return phucDuyen({ viec: "mo" }); // Võ Lâm Truyền Nhân (Biện Kinh 02/11) — Phúc duyên như Nhận thưởng
    if (n.pld) return pld({ viec: "mo", bo: n.pld.bo, ben: n.pld.ben }); // Thuyền phu Phong Lăng Độ (anh 27/10 — may-chu/phong-lang-do.js)
    if (n.sat) return satThu({ viec: "mo" }); // Nhiếp Thí Trần — Boss Sát thủ (anh 27/10 — may-chu/sat-thu.js)
    if (n.pq) return phuQuy({ viec: "mo" }); // Thần Tài Biện Kinh — Phú Quý Cẩm Hạp (anh 03/11 — may-chu/phu-quy.js)
    if (n.bc || /赌场老板对话\.lua$/.test(n.script || "")) return null; // Chủ sòng bạc (Ba Lăng huyện, thành lớn của client) — Bầu Cua (anh 10/11)
    if (n.vd) return null; // Bình Bình cô nương — Viêm Đế Bảo Tàng (anh 04/11 — may-chu/viem-de.js)
    if (n.rtb) return moRuongTb(n.rtb); // Rương Thần Bí (anh 03/11 — may-chu/ruong-tb.js)
    if (n.mc) return n.mc === "su" ? minhChu({ viec: "mo" }) : n.mc === "thu" ? minhChu({ viec: "nguoi", ai: n.name }, n.name) : haiCay(n); // nhiệm vụ Võ Lâm Minh Chủ (anh 03/11)
    if (n.tay) return tayTuy({ viec: "mo" }); // Thích Minh — đảo Tẩy Tủy (anh 28/10 — may-chu/tay-tuy.js)
    if (n.bh) return bangHoiNpc(n); // Người hướng dẫn bang hội — Ba Lăng / Biện Kinh (anh 14/11 — Bang hội đợt 1)
    if (!NPCD || !NPCD.open(n)) P.hud.msg(`${n.name}: hội thoại chưa làm`);
  }; // TẠM câu báo (script chưa giải được)
  // giết quái / trọng thương: gom lại, nhịp sau gửi máy chủ tính (kinh nghiệm, ngân lượng, rơi đồ, phạt — applyServer báo kết quả)
  // r[7] = 1: phân thân ra đòn kết liễu (World.hit ptGiet — anh 05/11): máy chủ cho đủ kinh nghiệm, không tiền / đồ (may-chu/do.js)
  w.onKill = (m) => { pending.kills.push([zone.id, m.id, m.lvl, m.va ? 4 : m.sat ? 3 : m.boss ? 1 : m.ta ? 2 : 0, m.series, Math.round(m.x), Math.round(m.y), m.ptGiet ? 1 : 0]); pending.at.push([m.x, m.y, w]); };
  w.onDeath = () => { if (!laAi(zone) && !laVd(zone) && !laPh(zone) && !laTk(zone) && !laLd(zone) && !laDn(zone) && !TongKim.laTo()) pending.deaths++; }; // Vượt Ải: tử vong trong ải không mất kinh nghiệm (ải tắt phạt — player_death.lua); Phong Hỏa: SetPunish(0); Tống Kim: bị hạ không mất gì (thiết kế mục 3); lôi đài: không mất gì (D5)
  w.onTkChet = () => (LoiDai.laTo() ? LoiDai.chet() : TongKim.chet()); // Tống Kim: báo người kết liễu, 8 giây sau đứng dậy ở doanh (tongkim.js); lôi đài: báo bị hạ, thành người xem (loidai.js)
  w.onPick = (d) => pending.nhat.push(d.g); // nhặt vật trên đất: báo máy chủ kèm nhịp
  w.onSkMsg = (t) => P.hud.canh(t); // võ công: thiếu nội lực, chưa hồi chiêu, sai vũ khí, đang cưỡi ngựa… -> ô tin dưới khung chat
  w.potFull = () => potTotal() >= (luat().mang || 60); // mang đủ 60 bình thuốc: tự nhặt bỏ qua thuốc
  w.laQt = !!(Net.me && Net.me.admin); // tài khoản quản trị: tên vàng kim + vòng sáng Quán quân liên đấu (world.js QT_MAU / QT_VONG)
  datXemNguon(w.laQt); // ô xem món: dòng Nguồn gốc chỉ quản trị thấy (itemtip.js — anh 18/11 tối)
  w.bhMinh = bhVe; // dòng bang trên đầu mình (anh 14/11 — bhMinhApply; world.js drawHeroLabel)
  // tổ đội: người đang theo / chỗ đội trưởng đang đánh (World.theoSau, nearestMob); Trợ Thủ đang tự làm nhiệm vụ ngày / đang về bãi treo (tulam.js chiem): bỏ
  // qua theo sau (anh 03/11 lượt 18), về tới bãi thì theo tiếp
  w.theo = () => (TuLam.chiem ? null : theoCua(w));
  w.onBuaDoi = (ten, id, lv) => Net.wsGui({ t: "buaDoi", ten, id, lv }); // Trợ Thủ dùng bùa lợi lên đồng đội (World.buaDoi -> may-chu/to-doi.js)
  w.onBuaVung = (ds, id, lv) => Net.wsGui({ t: "buaDoi", ds, id, lv }); // bùa vùng lên đồng đội quanh mình (Võ Đang 120 — vocong.js buaVungDoi, lượt 88)
  w.onSkills = () => { skillHud(); save(); }; // Trợ Thủ đổi vòng sáng ở ô tay phải
  w.onSkillHud = () => skillHud(); // Trợ Thủ xoay vòng sáng Nga My (World.xoayVong — mỗi 0,5 giây: chỉ vẽ lại ô, không lưu)
  baiMoi = zone.id; // vào bãi: hỏi máy chủ vật còn nằm trên đất ở bãi này (rơi lúc trước, chưa nhặt)
  // trọng thương -> về thành dưỡng sức (anh chốt 23/10, như client); chưa có thành nào thì đứng dậy tại chỗ như trước
  const town = townZone();
  if (town) w.onRevive = () => deathBox(town);
  // dưỡng sức xong: đang tự đánh thì quay lại bãi train cũ (treo máy: bãi treo máy); đánh tay thì báo để tự chọn bãi
  w.onRested = () => {
    // Phong Hỏa Liên Thành: hồi sinh ở đại doanh xong — đứng lại (Trợ Thủ "ở lại trận": tự đánh tiếp); không bật thì Trợ Thủ về bãi treo như thường
    if (laPh(w.zone) && (!w.auto || phO())) { thanh = null; w.holdMove = false; return; }
    if (thanh && thanh.buoc !== "nghi") return; // Trợ Thủ còn đang đi bán / mua
    const treo = !!thanh; thanh = null;
    // anh 03/11: boss Hoàng Kim còn sống mà Trợ Thủ đang đưa đi / vừa đánh (boss.quay, boss.tuDi) -> đi tới boss; tự làm nhiệm vụ ngày còn việc (tulam.js)
    // -> nó lo bước tiếp (gặp NPC, Xa phu tới bãi / boss Sát thủ)
    if (world === w && w.auto && (bossSauThanh() || TuLam.sauThanh())) { w.holdMove = false; return; }
    veBai(w, treo);
  };
  // tới bãi luyện công: việc ở thành / đi Xa phu của Trợ Thủ đã xong hoặc bị bỏ dở (tắt tự đánh giữa chừng, tự đi Xa phu…) — xóa, không thì
  // treoTick coi như còn đang ở thành và không bao giờ xét tự về thành nữa (anh 31/10 khuya "đầy kho cũng không về")
  if (FARM_KINDS.has(zone.kind)) { thanh = null; diXe = null; }
  if (zone.bang) thanh = null; // khu vực bang không có cửa hàng: bỏ việc ở thành dở dang của Trợ Thủ (giữ diXe — đi Xa phu khu tiếp) — đợt 4
  world = w;
  if (ptTheo) w.datPhanThan(ptTheo); // Phân Thân (anh 05/11): phân thân đang theo hiện ở bãi train (nhanvatmay.js — ngoài bãi train bỏ)
  datBossSat();
  // boss thế giới máu chung (anh 31/10 — bosstg.js): sinh boss nếu đang ở bãi của nó; kênh tức thời báo bãi mới
  w.onBtg = (m, v) => BossTG.trung(m, v);
  w.onNhim = (m, v) => SanNhim.trung(m, v); // Săn Nhím Béo Phì (sannhim.js — anh 03/11): nhím ở Ba Lăng huyện / Biện Kinh
  // Vượt Ải tổ đội (vadoi.js): sát thương gửi lên máu chung, choáng / chậm mình gây chuyển cho máy khác
  w.onVaDoi = (m, v, pt) => (m.ph ? PhongHoa.trung(m, v) : m.qc ? QuaiChung.trung(m, v, pt) : m.vd ? VdDoi.trung(m, v) : VaDoi.trung(m, v)); // m.qc: quái chung bãi train; m.ph: quân Phong Hỏa; pt: sát thương phân thân (mục dp)
  w.onVaTT = (m) => (m.ph ? PhongHoa.ttMoi(m) : m.qc ? QuaiChung.ttMoi(m) : m.vd ? VdDoi.ttMoi(m) : VaDoi.ttMoi(m));
  w.onNgoai = (m, dt) => (m.ph ? PhongHoa.ngoai(m, dt) : QuaiChung.ngoai(m, dt)); // quái chung ở máy không làm chủ bãi: con không đuổi mình vẽ theo chủ bãi (World.updateMob m.ngoai)
  w.onDanhNpc = (m, p) => PhongHoa.danhNpc(m, p); // Phong Hỏa: lính <-> vệ binh / tướng quân (máy chủ bãi tính sát thương)
  // hiệu ứng chiêu cho người cùng bãi xem (vocong.js castFire -> onChieu; ws.js chuyển; nhận: Net.wsNghe("chieu") -> chieuAo)
  w.onChieu = (id, lv, x, y, pt, so) => TongKim.laTo() && w.tk ? w.tk.guiChieu("", id, lv, x, y, pt[0], pt[1], "") : Net.wsGui({ t: "chieu", id, lv, x: Math.round(x), y: Math.round(y), px: Math.round(pt[0]), py: Math.round(pt[1]), ...(so != null ? { pt: so } : {}) }); // so: chiêu của phân thân thứ mấy (nhanvatmay.js)
  BossTG.ganWorld(w);
  SanNhim.ganWorld(w);
  ruongDat(); // Rương Thần Bí của bãi mới
  w.onMcv = (m, v) => QuaiCanh.trung(m, v); // quái canh cây Võ Lâm Minh Chủ (quaicanh.js): sát thương gửi máy chủ
  QuaiCanh.ganWorld(w);
  // luôn gửi chung: máy chủ biết trang mới (may-chu/quai-chung.js qcVao); bdv: phiên bản bản đồ bãi trang này đang có (map.json zones bdv — anh 11/11
  // Thục Cương sơn 92 đổi khung: trang chưa tải lại có bản đồ cũ không được làm chủ bãi quái chung, không thì sinh quái theo lưới cũ)
  vtCuoi = ""; // vào bãi: mốc đầu tiên gửi luôn
  Net.wsMo({ t: "vao", o: hero.slot | 0, zone: zone.id, chung: chung ? 1 : 0, bdv: zone.bdv | 0, b: 1 }); // b: 1 — nhận vị trí gom theo bãi ("vtb")
  VaDoi.ganWorld(laAi(zone) ? w : null);
  VdDoi.ganWorld(laVd(zone) ? w : null);
  CuongNo.luat = luat; CuongNo.hudEl = P.hud; CuongNo.ganWorld(w, laAi(zone) || laVd(zone)); // Cuồng nộ liên kích (anh 18/11 — cuongno.js)
  w.buaVungAi = laAi(zone) || laVd(zone); // bùa lợi Côn Lôn / Bất Động Minh Vương tự dùng -> đồng đội quanh mình cũng nhận (anh 18/11 — vocong.js BUA_VUNG_AI)
  QuaiChung.ganWorld(chung ? w : null);
  PhongHoa.ganWorld(laPh(zone) ? w : null);
  TongKim.ganWorld(w); // Tống Kim bãi thử: phòng đang mở ở bãi này thì vào trận
  LoiDai.ganWorld(w); // sân lôi đài: gắn World.tk của sân (sau Tống Kim — tongkim.js roi chỉ dọn World.tk của nó)
  DuaNgua.ganWorld(w); // đường đua: cấm võ công, không quái / phân thân, hộp / bẫy (duangua.js)
  if (chung && hudMounted) P.hud.msg(`${zone.n} — bản quái chung: cùng đánh một bầy quái với người chơi khác, thêm ${qcPct()}% kinh nghiệm và ngân lượng`, MAU_TIN.kn);
  if (w.auto) w.neo = [w.player.x, w.player.y]; // Trợ Thủ "quanh chỗ bật tự đánh": vào bãi mới thì lấy chỗ đứng đầu tiên
  // vào thành / thôn lúc tự đánh đang bật (Thổ Địa Phù, trọng thương, Trợ Thủ về làm việc…): tạm dừng tự đánh — không lao vào đánh mộc nhân
  // (anh 31/10 khuya); ra bãi thì World mới tự đánh tiếp, bấm bật lại (Space 2 lần) thì đánh mộc nhân như thường. Trợ Thủ đang về làm việc ở
  // thành / đi Xa phu thì không báo. Boss thế giới đang ở thôn / thành này (anh 02/11 — ngoài cổng): báo chỗ, tới gần boss là tự đánh boss
  if (w.auto && TOWN_KINDS.has(zone.kind)) {
    w.tamDung = true;
    const bt = BossTG.b && !BossTG.b.ket && BossTG.b.bai === zone.id ? BossTG.b : null, sn = SanNhim.s && !SanNhim.s.ket && SanNhim.s.ds.some((r) => r[1] === zone.id && !r[8]);
    if (!thanh && !diXe) P.hud.msg(`Tự đánh tạm dừng ở ${zone.n} (không đánh mộc nhân) — ra bãi luyện công sẽ tự đánh tiếp, tắt rồi bật lại Tự đánh để tự về bãi${bt ? `; boss thế giới ${bt.ten} ${bt.noi || "ngoài thành"} — tới gần boss là tự đánh boss` : ""}${sn ? "; đang có Nhím béo phì ngoài thành — tới gần nhím là tự đánh nhím" : ""}`);
  }
  hero.zone = zone.id; save();
  const look = world.player.look;
  let nAct = 0;
  await coHanP(Promise.all(ACTS.map((a) => P.jx.ensure(look, a).finally(() => actPart(++nAct / ACTS.length)))), TAI_PHAN.nguoi, "hình nhân vật", L); // đã đổi world: không ném lỗi
  P.jx.ensure(look, "Jump").catch(() => {}); // hình khinh công (không chờ — nhảy lần đầu khỏi nháy)
  P.audio.playMapMusic(zone.map);
  snapCam();
  if (tilePart) { const tw = map.warm(cam, vw / zoom, vh / zoom); let n = 0; tilePart(tw.length ? 0 : 1); await coHanP(Promise.all(tw.map((p) => p.then(() => tilePart(++n / tw.length)))), TAI_PHAN.o, "ô ảnh bản đồ", L); }
  // hình đứng của NPC trong khung nhìn lúc vào (khung như World.draw): tải xong mới mở màn — vào là thấy NPC đứng sẵn, NPC xa tải khi tới gần
  const gan = world.npcs.filter((n) => n.type && !n.obj && n.x > cam.x - 200 && n.x < cam.x + vw / zoom + 200 && n.y > cam.y - 60 && n.y < cam.y + vh / zoom + 250);
  if (gan.length) await coHanP(Promise.all(gan.map((n) => P.npc.ensure(n.type, "stand1"))), TAI_PHAN.quai, "hình NPC", L);
  if (hudMounted) { setHudMap(); skillHud(); }
}

// ---------- võ công: ô kỹ năng T / P, bảng chọn chiêu, phím gắn chiêu (src/game/vocong.js) ----------
// Phái mở võ công (cau-hinh.json voCong.moPhai — máy chủ gửi trong luat; anh duyệt 25/10: làm bộ máy + 2 phái mẫu Thiếu Lâm, Nga My
// trước, anh xem xong mới mở 8 phái còn lại). Phái chưa mở: chiêu học được, đánh vẫn đòn thường.
function vcOpen() {
  const L = luat().voCong || ["shaolin", "emei"], f = hero && hero.fac != null && P.factions.find((x) => x.id === hero.fac);
  return !!f && (L.includes("*") || L.includes(f.key));
}
// bùa đang có giữ qua bản đồ (đồng hồ của World mới chạy lại từ 0)
function carryBuffs() {
  if (!world || world.player.hp <= 0 || !world.player.buffs.size) return null;
  const m = new Map(); for (const [k, b] of world.player.buffs) m.set(k, { ...b, until: b.until - world.time });
  return m;
}
// độc đang dính giữ qua bản đồ (anh 17/11 "bị ngũ độc đánh bùa lên ng … về thành r máu vẫn rút, k chết, nhưng rút đến khi hết tgian"): còn bao lâu rút bấy lâu
// ở bản đồ mới; khu an toàn không làm chết (vocong.js heroTick). Không giữ người gây độc (bản đồ mới không có họ)
function carryDoc() {
  const p = world && world.player, d = p && p.hp > 0 && p.poison, t = world && world.time; if (!d || !(d.until > t)) return null;
  const list = d.list.filter((l) => l.until > t).map((l) => ({ ...l, until: l.until - t }));
  return list.length ? { list, every: d.every, next: Math.max(0, d.next - t), until: d.until - t, src: null } : null;
}
// đòn thường theo vũ khí đang cầm như client settings/clientweaponskill.txt (anh 29/10 lần 2 — icon: cong-cu/dung-icon-don-thuong.mjs): tay không /
// kiếm / đao / song kiếm / song chùy: chiêu 53 "Công kích vật lý", trường côn (2) / trường thương (3): chiêu 1, ám khí: chiêu 2
const donThuong = () => { const k = weaponKind(hero); return k >= 100 ? 2 : k === 2 || k === 3 ? 1 : 53; };
const DON_TEN = { 53: "Công kích vật lý", 1: "Công kích vật lý (trường binh)", 2: "Công kích vật lý (ám khí)" };
const donO = () => { const id = donThuong(); return { ic: P.skillIcon[id] || null, n: DON_TEN[id], tip: `<color=Yellow>${DON_TEN[id]}<color>
Đòn thường của vũ khí đang cầm — ${id === 2 ? "sát thương theo Thân pháp" : "sát thương theo Sức mạnh"}
Bấm ô T để chọn chiêu khác` }; };
function skillHud() {
  if (!hudMounted || !hero) return;
  const O = hero.oChieu || {}, one = (id) => { const s = id && P.skillDb[id]; return s ? { ic: P.skillIcon[id] || null, n: s.n } : null; };
  P.hud.setSkills({ left: one(O.trai) || donO(), right: one(O.phai) }); // ô T trống: đòn thường của vũ khí
  if (P.vc) for (const id of [O.trai, O.phai, ...quick().map((q) => q && q.s)]) if (id) P.vc.warm(id);
}
// chiêu đã học dùng trong trận (bảng chọn chiêu, Trợ Thủ): [{ id, n, lv, kind }]
function skillsUsable() {
  if (!GW || !hero || !P.vc) return [];
  const cc = ccCong(hero), lvCo = (id) => capCong(P.skillDb[id], id, hero.skills[id] | 0, cc); // + cấp Báo Đáp Ân Sư (anh 16/11 — rules.js ccCong)
  return GW._skillList(hero).filter((id) => ((hero.skills || {})[id] | 0) > 0 && P.vc.sk(id)).map((id) => ({ id, n: P.skillDb[id].n, lv: lvCo(id), kind: kindOf(P.skillDb[id], P.skillDb), heal: isHeal(P.skillDb[id], lvCo(id)) }))
    .filter((x) => x.kind !== "passive" && x.kind !== "other");
}
// Khinh công (anh 10/11): ai đã vào phái đều có, không nằm trong hero.skills — chỉ thêm vào bảng chọn ô P và ô dùng nhanh (Trợ Thủ không dùng)
const kcChon = () => (hero && hero.fac != null && P.skillDb[KC_ID] ? [{ id: KC_ID, n: P.skillDb[KC_ID].n, lv: 1, kind: "jump", heal: false }] : []);
function setSkill(side, id) {
  const O = (hero.oChieu = hero.oChieu || {}), k = side === "left" ? "trai" : "phai";
  O[k] = id || 0;
  if (world) { world.player.once = null; world.refreshStats(false); } // vòng sáng ở ô tay phải đổi chỉ số
  skillHud(); save();
}
// Bảng chọn chiêu (bấm ô T / P như client). Trái: đòn thường + chiêu tấn công / bùa hại đặt được tay trái (LRSkill ≠ 2); phải: mọi chiêu
// dùng được (tấn công, bùa hại, bùa lợi, vòng sáng — vòng sáng ở ô phải là vòng sáng đang bật). Gắn phím Q W E… bản đầu đã bỏ (anh 25/10:
// không ổn) — chiêu hay dùng kéo vào thanh dùng nhanh 1–9.
function skillPick(side, anchor) {
  // điện thoại, ô kỹ năng đang khóa (dienthoai.js datOKhoa — chỉ dùng): chạm ô T / P = ra chiêu tay đó (handUse); mở khóa mới mở bảng chọn chiêu
  if (DT && DT.on && DT.oKhoa) return handUse(side);
  const old = document.querySelector(".jx-skpick"); if (old) { old.remove(); if (old.dataset.side === side) return; }
  if (!hero || hero.fac == null) return P.hud.msg("Chưa nhập môn phái — gặp đệ tử tiếp dẫn ở Ba Lăng huyện (cấp 10)");
  if (!P.vc) return P.hud.msg("Võ công: thiếu gói assets/web/vocong (node cong-cu/dung-vo-cong.mjs)");
  const O = (hero.oChieu = hero.oChieu || {}), cur = side === "left" ? O.trai : O.phai;
  const list = [...skillsUsable().filter((x) => side === "right" || ((x.kind === "attack" || x.kind === "curse") && (P.vc.sk(x.id) || {}).lr !== 2)), ...(side === "right" ? kcChon() : [])];
  const m = document.createElement("div"); m.className = "jx-skpick"; m.dataset.side = side;
  m.innerHTML = [{ id: 0, n: side === "left" ? "Đòn thường" : "Bỏ trống" }, ...list].map((x) => {
    const ic = x.id ? P.skillIcon[x.id] : side === "left" && P.skillIcon[donThuong()]; // ô 0 tay trái: icon đòn thường của vũ khí
    return `<div data-id="${x.id}" class="${(cur || 0) === x.id ? "on" : ""}">${ic ? `<img src="assets/web/icon/${ic}" alt="" draggable="false">` : `<span>${x.n}</span>`}</div>`;
  }).join("") + `<p>${list.length ? "Bấm để chọn · chiêu hay dùng: kéo từ bảng Võ công (F5) vào thanh dùng nhanh 1–9" : "Chưa học chiêu nào dùng được (F5 Võ công: cộng điểm)"}${vcOpen() ? "" : " · phái này đang soát võ công — đánh vẫn đòn thường"}</p>`;
  m.onclick = (e) => { const d = e.target.closest("[data-id]"); if (!d) return; P.audio.ui("click"); if (GW) GW._hideSkTip(); setSkill(side, +d.dataset.id); m.remove(); };
  // rê chuột lên chiêu trong bảng chọn: ô xem chiêu của game như bảng Võ công; điện thoại: chạm 1 lần là chọn, chạm giữ (contextmenu) để xem
  // (anh 30/10 "bấm vào thì nó ra thông tin kĩ năng, rất khó để chọn" — dienthoai.js không bắt chạm đầu chỉ xem ở .jx-skpick)
  m.onmousemove = (e) => { const d = e.target.closest("[data-id]"); if (!GW) return; if (d && +d.dataset.id) GW._skillTipAt(+d.dataset.id, e); else GW._hideSkTip(); };
  m.oncontextmenu = (e) => { e.preventDefault(); m.onmousemove(e); };
  m.onmouseleave = () => GW && GW._hideSkTip();
  popup(m, anchor.getBoundingClientRect(), "up");
}
// chọn chiêu / vật phẩm cho ô dùng nhanh i (anh 30/10: "các ô bấm nhanh chưa có cơ chế để đồ hay để kĩ năng vào, đè vào thì nó ra bảng cài
// đặt"): bảng như bảng chọn chiêu ô T / P — chiêu chủ động đã học + thuốc / Thổ Địa Phù đang có trong túi (số bình), ô đang có thì thêm "Gỡ
// khỏi ô". Bấm 1 lần là đặt (chiêu / món đó ở ô khác thì dời sang); xem: rê chuột / chạm giữ. Mở: bấm ô trống, chạm giữ ô (điện thoại)
function quickPick(i, anchor) {
  const old = document.querySelector(".jx-skpick"); if (old) { old.remove(); if (old.dataset.o === String(i)) return; }
  if (!hero || !anchor) return;
  const L = quick(), cur = L[i], sk = P.vc && hero.fac != null ? [...skillsUsable(), ...kcChon()] : [], mon = [];
  for (const b of hero.bag || []) if ((isPotion(b) || laPhu(b.k) || laDungNhanh(b.k)) && !mon.includes(b.k)) mon.push(b.k); // + vật phẩm dùng được (lượt 86)
  const o = (attr, inner, on) => `<div ${attr}${on ? ' class="on"' : ""}>${inner}</div>`, img = (ic) => `<img src="assets/web/icon/${esc(ic)}" alt="" draggable="false">`;
  const m = document.createElement("div"); m.className = "jx-skpick"; m.dataset.o = i;
  m.innerHTML = (cur ? o('data-go="1"', "<span>Gỡ khỏi ô</span>") : "")
    + sk.map((x) => o(`data-s="${x.id}"`, P.skillIcon[x.id] ? img(P.skillIcon[x.id]) : `<span>${esc(x.n)}</span>`, cur && cur.s === x.id)).join("")
    + mon.map((k) => o(`data-k="${esc(k)}"`, img(ItemDB.item(k).ic) + `<b>${potCount(k)}</b>`, cur && cur.k === k)).join("")
    + `<p>Ô ${i + 1}: ${sk.length || mon.length ? `bấm chiêu / thuốc / vật phẩm để đặt${DT && DT.on ? " · giữ để xem" : ""}` : "chưa có chiêu chủ động hay thuốc / vật phẩm dùng được trong túi"}</p>`;
  const tat = () => { if (GW) { GW._hideSkTip(); GW._hideTip(); } };
  m.onclick = (e) => {
    const d = e.target.closest("[data-s], [data-k], [data-go]"); if (!d) return;
    P.audio.ui("click"); tat(); m.remove();
    if (d.dataset.go) { L[i] = null; P.hud.msg(`Gỡ khỏi ô ${i + 1}`); }
    else {
      const q = d.dataset.s ? { s: +d.dataset.s } : { k: d.dataset.k }, was = L.findIndex((x) => x && (q.s ? x.s === q.s : x.k === q.k));
      if (was >= 0 && was !== i) L[was] = null;
      L[i] = q; if (q.s && P.vc) P.vc.warm(q.s);
      P.hud.msg(`Đặt ${q.s ? P.skillDb[q.s].n : ItemDB.item(q.k).n} vào ô ${i + 1}`);
    }
    save(); quickHud();
  };
  m.onmousemove = (e) => {
    const d = e.target.closest("[data-s], [data-k]"); if (!GW) return;
    if (d && d.dataset.s) { GW._hideTip(); GW._skillTipAt(+d.dataset.s, e); } else if (d && d.dataset.k) { GW._hideSkTip(); GW._showTip({ k: d.dataset.k, n: potCount(d.dataset.k) }, e); } else tat();
  };
  m.oncontextmenu = (e) => { e.preventDefault(); m.onmousemove(e); };
  m.onmouseleave = tat;
  popup(m, anchor.getBoundingClientRect(), "up");
}
// rê chuột lên ô kỹ năng T / P: ô xem chiêu của game (cùng khung với bảng Võ công / ô dùng nhanh); ô trống (đòn thường) thì không hiện
function skillSlotTip(side, e) {
  if (!GW) return;
  const O = (hero && hero.oChieu) || {}, id = side === "left" ? O.trai : side === "right" ? O.phai : null;
  if (id && P.skillDb[id]) GW._skillTipAt(id, e); else GW._hideSkTip();
}

// ---------- bản đồ dựng nguyên từ client (thôn / thành — anh muốn 23/10, thử Ba Lăng huyện) ----------
// gộp assets/web/map/full/index.json vào kho bản đồ: ảnh ô, lưới vật cản, bãi (kind thôn / thành), ảnh bản đồ nhỏ của client
function mergeFullMaps(maps, hud, full) {
  for (const [k, m] of Object.entries(full.maps)) {
    maps.maps[k] = m;
    if (m.mini) hud.M.minimap.maps[k] = { file: "../../web/map/" + m.mini.file, w: m.mini.w, h: m.mini.h, from: "client" }; // tính từ assets/ui/hud/
  }
  Object.assign(maps.jmo, full.jmo);
  for (const z of full.zones) if (!maps.zones.some((x) => x.map === z.map)) maps.zones.push(z);
}
const TOWN_KINDS = new Set(["thành", "thôn"]);

// ---------- trọng thương: về thành dưỡng sức ----------
const FARM_KINDS = new Set(["chính", "phụ"]);
const REVIVE_HP = 0.1; // TẠM: sinh lực / nội lực lúc hồi sinh ở thành (client không ghi số — engine); ngồi dưỡng sức tới khi đầy
// thành để về (trọng thương, Thổ Địa Phù): client hồi sinh ở điểm đã lưu (nhân vật mới: Giang Tân Thôn, bản đồ 20 — newplayerini
// irevivalid). Game: Ba Lăng huyện — vào game cũng đứng ở đây, có Xa phu / Dược điếm / Tạp hóa (bản trước về Biện Kinh: bản đồ không NPC,
// từ 26/10 chỉ đi bằng Xa phu thì kẹt)
const townZone = () => P.maps.zones.find((z) => z.id === START_ZONE) || P.maps.zones.find((z) => z.kind === "thành");
// bảng trọng thương của client (ui\ui3\提示2.ini — khung 1 nút; chữ G_MSG_RENASCENCE "Bạn đã bị trọng thương!", nút G_MSG_BACK_TO_TOWN
// "Về thành dưỡng sức" của stringtable_client). Bấm nút -> về thành. Đang tự đánh thì tự bấm sau AUTO_BACK giây (TẠM — bàn cùng auto).
const AUTO_BACK = 5;
// Tống Kim (anh 13/11 tối "chết ở tk, hiện ra bảng, bấm vào về đại doanh 8 giây sau được ra"): bảng trọng thương của trận — "Về doanh trại" hồi sinh ngay ở doanh phe
// mình (tongkim.js hoiSinhNgay — cổng ra hậu doanh khóa giayHoiSinh() giây); Trợ Thủ tự bấm sau AUTO_BACK giây như bảng về thành
function tkChetBox() {
  if (NPCD) NPCD.close();
  // anh 17/11: trọng thương mất hết hiệu quả hoàn (máy chủ bỏ ở nhịp kế — tong-kim.js hoanTran); bỏ ngay ở trình duyệt cho chỉ số đúng liền
  { const B = hero.buff || {}, bo = Object.keys(B).filter(laHoan); if (bo.length) { for (const k of bo) delete B[k]; if (world) world.refreshStats(false); } }
  const w = P.win.get("info2"), hs = TongKim.giayHoiSinh();
  w.sticky = true;
  w.set("Info", `Bạn đã bị trọng thương! Hiệu quả các loại hoàn đã mất — ra trận nhớ dùng lại. Về doanh trại phe mình hồi sinh — ${hs} giây sau mới ra khỏi hậu doanh được.`).set("OK", "Về doanh trại");
  const go = () => { clearTimeout(w._t); w.hide(); if (!world || world.player.hp > 0) return; P.audio.ui("click"); TongKim.hoiSinhNgay(); };
  w.on("OK", go); w.show();
  clearTimeout(w._t);
  if (world && world.auto) w._t = setTimeout(() => { if (w.visible) go(); }, AUTO_BACK * 1000);
}
// Lôi đài (anh 15/11 — D5 "người bị hạ ở lại sân làm người xem, có nút Rời sân, không mất gì"): bảng 1 nút của client (info2) — Xem tiếp: đứng dậy tại chỗ làm người xem
// (loidai.js thanhNguoiXem); muốn đi thì nút Rời sân trên thanh tỉ số. Trợ Thủ không chạy trong sân -> không tự bấm
function ldChetBox() {
  if (NPCD) NPCD.close();
  const w = P.win.get("info2");
  w.sticky = true;
  w.set("Info", "Bạn đã bị hạ — không mất gì. Ở lại sân xem tiếp (tuyển thủ không thấy bạn); muốn đi thì bấm Rời sân.").set("OK", "Xem tiếp");
  const go = () => { clearTimeout(w._t); w.hide(); if (!world || world.player.hp > 0) return; P.audio.ui("click"); LoiDai.thanhNguoiXem(); };
  w.on("OK", go); w.show();
  clearTimeout(w._t);
}
function deathBox(town) {
  if (TongKim.laTo()) return tkChetBox();
  if (LoiDai.laTo()) return ldChetBox();
  if (NPCD) NPCD.close(); // đang nói chuyện với NPC thì đóng (khung info2 dùng chung)
  const w = P.win.get("info2"), S = P.win.strings;
  w.sticky = true;
  w.set("Info", (S.G_MSG_RENASCENCE || "Bạn đã bị trọng thương!").trim()).set("OK", (S.G_MSG_BACK_TO_TOWN || "Về thành dưỡng sức").trim());
  // Viêm Đế Bảo Tàng (player_death.lua): có Hình nhân -> nút Hồi sinh ở nơi xuất phát, không có -> về Biện Kinh
  if (world && laVd(world.zone) && (hero.vd && hero.vd.hn) > 0) w.set("Info", "Trên hành trang đại hiệp có Hình nhân, có thể hồi sinh được 1 lần. Tại nơi xuất phát của bảo tàng bấm hồi sinh.").set("OK", "Hồi sinh");
  const go = () => {
    clearTimeout(w._t); w.hide();
    if (!world || world.player.hp > 0) return;
    if (laThuyen(world.zone)) { P.audio.ui("click"); return pld({ viec: "chet" }); } // Phong Lăng Độ: chết trên thuyền -> lên bờ Bắc (fld_death.lua)
    if (laAi(world.zone)) { P.audio.ui("click"); return vuotAi({ viec: "chet" }); } // Vượt Ải: tử vong -> rời ải, về Ba Lăng (player_death.lua)
    if (laVd(world.zone)) { P.audio.ui("click"); return ViemDe.goi({ viec: "chet" }); } // Viêm Đế: có Hình nhân hồi sinh ở đầu đường, không có về Biện Kinh (player_death.lua)
    if (laPh(world.zone)) { P.audio.ui("click"); return gotoZone(world.zone, { revive: true, at: phHoiSinh() }); } // Phong Hỏa: hồi sinh ở đại doanh (SetTempRevPos — không mất gì)
    if (FARM_KINDS.has(world.zone.kind)) { hero.farmZone = world.zone.chiThuyen ? world.zone.goc : world.zone.id; hero.farmChung = world.chung ? 1 : 0; }
    // Trợ Thủ (đang tự đánh — như tự về thành, không cần bật "Treo ở"; anh 31/10 khuya): về thành có Dược điếm, bán / mua thuốc + Thổ Địa Phù
    // rồi mới dưỡng sức
    const treo = world.auto, to = (treo && shopTown()) || town;
    if (treo) thanh = { buoc: "di", t0: performance.now(), why: "trọng thương" };
    P.audio.ui("click"); P.hud.msg(`Về ${to.n} dưỡng sức…`);
    gotoZone(to, { revive: true });
  };
  w.on("OK", go); w.show();
  clearTimeout(w._t);
  if (world.auto) w._t = setTimeout(() => { if (w.visible) go(); }, AUTO_BACK * 1000);
}
// điểm hồi sinh của thành (assets/data/revive.json = settings\revivepos.ini): tọa độ logic client -> bản đồ web như bản đồ nhỏ. Điểm rơi
// ngoài phần bản đồ đã cắt (Biện Kinh: cả 4 điểm, gần nhất — điểm 23 — lệch 48 điểm khỏi mép trái) thì kéo vào cách mép 150 điểm (đứng
// sát mép thì khung nhìn không đi tới, hình bị khuất) rồi lấy ô đi được gần nhất; lệch xa hơn 300 điểm thì bỏ. Không có thì ngẫu nhiên.
function revivePoint(zone, map) { const l = revivePoints(zone, map); return l.length ? l[Math.floor(Math.random() * l.length)] : null; }
function revivePoints(zone, map) {
  const m = P.maps.maps[zone.map], c = m && m.client, s = P.maps.scale, pts = c && c.region && P.revive.maps[c.id], out = [], E = 150;
  for (const [lx, ly] of Object.values(pts || {})) {
    const x = (lx - c.region[0] * 512) * s, y = ((ly - c.region[1] * 1024) / 2) * s;
    const cx = Math.min(map.w - E, Math.max(E, x)), cy = Math.min(map.h - E, Math.max(E, y));
    if (Math.hypot(cx - x, cy - y) > 300) continue;
    const i = map.nearestCell(cx, cy, 20);
    if (i >= 0) out.push(map.center(i));
  }
  return out;
}

// ---------- NPC của thôn / thành (anh chốt 23/10: NPC tiếp dẫn các phái ở Ba Lăng — 24/10 bỏ Hoa Sơn / Võ Hồn / Tiêu Dao, còn 10; nói chuyện, nghe giới thiệu môn phái, đồng ý là vào
// phái, nhân vật vẫn ở bản đồ đó) ----------
// Chỗ đứng = dữ liệu MÁY CHỦ (assets/data/mapnpcs.json — tools/build-map-npcs.mjs đọc ổ đĩa máy ảo anh gửi): tọa độ logic client -> bản
// đồ web như điểm hồi sinh. NPC phái (dlg = khóa phái) mở hội thoại script client (assets/data/npcdialog.json); NPC khác chưa có hội
// thoại (TẠM báo); cọc gỗ / mộc nhân / bao cát (bãi võ sư) chỉ đứng đó. Hướng đứng: dữ liệu máy chủ không có -> hướng 0 (TẠM).
// Nhân vật lưu trước khi đổi dữ liệu (anh chốt 24/10 bỏ Hoa Sơn / Võ Hồn / Tiêu Dao + kỹ năng 180): phái không còn trong gói võ công
// -> đã về Vô Môn Phái lúc nạp (fixLooks), ở đây báo 1 lần; chiêu không còn -> đã bỏ, trả điểm. Món không còn trong kho đồ + kiểu dáng
// theo đồ mặc: máy chủ sửa lúc nạp (may-chu/do.js chuan, 25/10).
function saveCleanup() {
  if (hero.lostFac) { P.hud.msg(`Phái ${hero.lostFac} đã bỏ (game còn 10 phái) — ${hero.name} về Vô Môn Phái, điểm kỹ năng đã trả lại`); delete hero.lostFac; save(); }
  if (hero.lostSkills) { P.hud.msg(`Bỏ ${hero.lostSkills} chiêu không còn trong game (kỹ năng 180…) — điểm kỹ năng đã trả lại`); delete hero.lostSkills; save(); }
  haChieu();
}
// chiêu cao hơn mức cấp nhân vật cho (anh 29/10 — cộng điểm như client, rules.js capChieu: nhân vật cộng trước 29/10, công cụ thử hạ cấp) ->
// hạ về đúng mức, trả lại điểm thừa, báo 1 lần; máy chủ cũng hạ lúc lưu (may-chu/api.js luuNv)
function haChieu() {
  const ha = hamChieu(hero, P.skillDb);
  if (!ha.length) return;
  for (const [id, cu, moi] of ha) {
    const ten = (P.skillDb[id].n || "").trim(), moc = MOC.get(id) || 0;
    P.hud.msg(!moi && hero.lvl < moc ? `${ten}: chiêu mốc ${moc} — cấp ${moc} mới học (như client), trả lại ${cu} điểm kỹ năng` : `${ten}: cấp ${cu} → ${moi} (cấp chiêu ≤ cấp nhân vật − ${P.skillDb[id].req || 0} + 1) — trả lại ${cu - moi} điểm kỹ năng`);
  }
  if (world) world.refreshStats(false);
  skillHud(); save();
  if (GW) GW.refresh(true);
}
// Vật đặt trên bản đồ thành (26/10 — assets/data/vat-ban-do.json, dữ liệu máy chủ: Rương chứa đồ Ba Lăng) vào cùng danh sách: { obj
// (DataID — hình kho vật), viec ("ruong"), name } — bấm như NPC
function zoneNpcs(zone) {
  const m = P.maps.maps[zone.map], c = m && m.client, s = P.maps.scale, them0 = (c && P.npcThem && P.npcThem.maps[c.id]) || [];
  // bản đồ chưa có NPC máy chủ (ải Vượt Ải — bản đồ client 464) vẫn có NPC game thêm (Phụng Phụng — nhiệm vụ Võ Lâm Minh Chủ, anh 03/11)
  if (laPh(zone)) return phNpcs(); // Phong Hỏa Liên Thành: NPC đại doanh (kịch bản thêm lúc mở trận — mission.lua)
  if (laTk(zone)) return tkNpcs(); // chiến trường Tống Kim: Quân y + Rương chứa đồ ở 2 hậu doanh (tong-kim.json)
  const L = c && c.region && ((P.mapNpcs && P.mapNpcs.maps[c.id]) || (them0.length ? { talk: [] } : null));
  if (!L) return [];
  const xy = (n) => ({ x: (n.x - c.region[0] * 512) * s, y: ((n.y - c.region[1] * 1024) / 2) * s });
  const vat = (P.vatBanDo && P.vatBanDo.maps[c.id]) || [], them = (P.npcThem && P.npcThem.maps[c.id]) || []; // NPC game thêm (assets/data/npc-them.json)
  // tk: Mộ binh quan ("mb") / Quân Nhu quan ("qn") Tống Kim ở Biện Kinh (anh 06/11 — đặc tả đợt 2)
  // bh: Người hướng dẫn bang hội (anh 14/11 — Bang hội đợt 1, npc-them.json cờ bh: 1, mẫu client 1783) — main.js bangHoiNpc
  // bhVai: NPC khu vực bang (đợt 4 — khuNpc); nhà / cột lọc theo cấp tác phường / cấp bang của bang mình (khuHien)
  // ld: Công Bình Tử (Ba Lăng, Biện Kinh — lôi đài, anh 15/11); ldRa: Trương Tam / Lý Tứ trong sân (hội thoại qua script "s1:loi-dai" / "s1:loi-dai-ra" — loiDaiFn)
  return [...[...L.talk, ...them.filter(khuHien)].map((n) => ({ key: n.dlg || null, script: n.script, name: n.name, type: n.res, role: n.kind, ...(n.pld ? { pld: n.pld } : {}), ...(n.sat ? { sat: 1 } : {}), ...(n.tay ? { tay: 1 } : {}), ...(n.pq ? { pq: 1 } : {}), ...(n.bc ? { bc: 1 } : {}), ...(n.vd ? { vd: 1 } : {}), ...(n.mc ? { mc: n.mc } : {}), ...(n.tk ? { tk: n.tk } : {}), ...(n.bh ? { bh: 1 } : {}), ...(n.viec ? { viec: n.viec } : {}), ...(n.bhVai ? { bhVai: n.bhVai } : {}), ...(n.ld ? { ld: n.ld } : {}), ...(n.ldRa ? { ldRa: 1 } : {}), ...(n.dn ? { dn: n.dn } : {}), ...xy(n) })), // viec "ruong": Thủ khố đảo Tẩy Tủy (lượt 86) mở rương; dn: Truy Phong Sứ Giả / Ông chủ đường đua (đua ngựa — hội thoại qua script "s1:dua-ngua" / "s1:dua-ngua-dich")
    ...vat.map((o) => ({ obj: o.id, viec: o.viec, script: o.script, name: o.ten, role: "talk", ...xy(o) }))];
}
// việc của script khi nhập phái (SetFaction / SetCamp / SetRank…, src/game/npcdlg.js) -> nhân vật
let NPCD = null;
function npcApi() {
  return {
    hero: () => hero, factions: () => P.factions, msg: (t) => P.hud.msg(t), click: () => P.audio.ui("click"),
    chat: (ch, name, t) => P.hud.chat(ch, name, t),
    // Vô Môn Phái đang chờ đổi phái (hero.doiPhai — may-chu/doi-phai.js): NPC môn phái nào ở Ba Lăng cũng mời bái nhập (khác hệ cũng được) -> doiPhaiFn
    doiPhaiCase: (key) => (hero && hero.fac == null && hero.doiPhai ? `DoiPhaiMoi:${key}` : null),
    join(key) {
      if (hero.doiPhai) return; // đang chờ đổi phái: bái nhập qua máy chủ (doiPhaiFn — chiêu 90 / 120 mang sang), không vào phái ở trình duyệt
      // đã có phái thì không đổi ở đây (soát 11/11: lệnh nhập phái chạy lại lúc khung NPC phái khác đang mở từng đổi phái ở trình duyệt)
      const f = P.factions.find((x) => x.key === key); if (!f || hero.fac != null) return;
      hero.fac = f.id; hero.facKey = f.key; hero.skills = hero.skills || {};
      fixPoints(hero); save();
      if (GW) GW.refresh(true);
    },
    setCamp: (n) => { hero.camp = n; save(); },
    sale: (id) => !!GW && GW.openShop(id),
    fn: (id, npc) => xaPhuFn(id) || chucNangFn(id, npc),
    // Xa phu "Đưa ta đến bản đồ nhiệm vụ sát thủ": chỉ hiện khi đang nhận nhiệm vụ (anh 03/11); "Đưa ta đến nơi làm nhiệm vụ Dã Tẩu": chỉ khi nhiệm vụ có bãi / NPC bán (anh 11/11)
    // "Khu vực bang hội" (đợt 4): chỉ thành viên bang, khu vực bang đang mở (luat().khuBang.bat)
    // Võ Sư "Hoạt động báo đáp ân sư" (anh 16/11): máy chủ chưa có sự kiện (LUAT không có baoDapAnSu) thì ẩn; có thì luôn hiện (ngoài ngày: báo đã kết thúc / chưa bắt đầu)
    anOpt: (id) => (id === "BanDoSatThu" && !satNv()) || (id === "NoiDaTau" && !coNoiDt()) || (id === "KhuBangHoi" && (!bhMinhCur || (luat().khuBang || {}).bat === 0)) || (id === "BaoDapAnSu" && !luat().baoDapAnSu) || ((id === "KhamNam" || id === "KhamNamHelp" || id === "KhamNam:hoan") && !luat().khamNam),
    setRank: (n) => { hero.rank = n; save(); },
    // lựa chọn đi bản đồ khác của script (NewWorld): game chưa có bản đồ đó -> báo (TẠM câu báo)
    travel: (id) => { const m = P.maplist.maps[id]; P.hud.msg(`${m ? m.name : "Bản đồ " + id}: chưa có trong game`); },
  };
}

// Bản đồ nhỏ: ảnh + đổi tọa độ bản đồ web <-> tọa độ hiện trên client (X = x logic / 256, Y = y logic / 512 — như ô tọa độ
// của client; x logic = vùng × 512 + x màn hình, y logic = vùng × 1024 + 2 × y màn hình; bản đồ web = màn hình client × 0.75)
function setHudMap() {
  const m = P.maps.maps[world.zone.map], c = m && m.client, reg = c && c.region ? c.region : [0, 0], s = P.maps.scale;
  const fromClient = (X, Y) => [((X + 0.5) * 256 - reg[0] * 512) * s, (((Y + 0.5) * 512 - reg[1] * 1024) / 2) * s];
  P.hud.setMap({ key: world.zone.map, name: world.zone.n + (world.chung ? " (chung)" : ""), toClient: (x, y) => [Math.floor((reg[0] * 512 + x / s) / 256), Math.floor((reg[1] * 1024 + (2 * y) / s) / 512)], fromClient });
  world.fromClient = fromClient; // Trợ Thủ tự đánh theo tọa độ
}

// ---------- giao diện client (nút, menu Tùy chỉnh, chat) ----------
let hudMounted = false;
// tính năng nhiều người: anh sẽ mở máy chủ chơi nội bộ (23/10) -> làm đầy đủ khi dựng máy chủ (Tổ đội, Hảo hữu, Bang phái, Phòng:
// có khung cửa sổ client — src/game/windows.js; PK: nút bật tắt của client). Giao dịch (anh 30/10): nút Exchange = mở / đóng giao dịch (gdLam)
const ONLINE = { PK: "PK", Rec: "Ghi hình" };
function mountHud() {
  if (hudMounted) return;
  hudMounted = true;
  P.hud.mount($("#hud"), {
    onButton(k, on) {
      P.audio.ui("click");
      if (GW.toggle(k)) return; // Nhân vật, Đồ dùng, Túi hành trang, Võ công, Nhiệm vụ, Tùy chỉnh (bảng hệ thống)
      if (k === "Horse") return toggleHorse(on);
      if (k === "Sit") {
        if (on && world.riding()) { P.hud.setToggle("Sit", false); return P.hud.canh("Lúc cỡi ngựa không thể thiền tọa!"); } // G_CORESHELL_1 — chữ đỏ ô tin như câu cảnh báo client
        if (!world.sit(on)) P.hud.setToggle("Sit", false);
        return;
      }
      if (k === "Auto") return toggleAuto();
      if (k === "TroThu") return TT && TT.toggle();
      if (k === "HuongDan") return HD && HD.toggle(); // Hướng dẫn hoạt động (anh 05/11 — ô 3 cột icon / ô Hoạt động bảng Giang hồ)
      if (k === "PhanThan") return PT && PT.toggle(); // Phân Thân (anh 05/11 — ô 4 cột icon / ô Phân thân bảng Giang hồ)
      if (k === "NhomZalo") return NZ && NZ.toggle(); // Nhóm Zalo (anh 09/11 — ô 5 cột icon / ô Nhóm Zalo bảng Giang hồ)
      if (k === "BauCua") return BC && BC.toggle(); // biểu tượng Bầu Cua (anh 10/11 lần 3 "icon đặt mọi nơi" — ô 6 cột icon / thanh dưới Tự đánh)
      if (k === "KhoaAnToan") return KAT && KAT.moKhung(); // ổ khóa an toàn (anh 10/11 — mật khẩu cấp 2): khung trạng thái + mở / khóa / đổi mật khẩu
      if (k === "NhanThuong") return nhanThuong();
      if (k === "XepHang") return GW.openXepHang();
      if (k === "SendBtn") return P.hud.send();
      // biểu cảm như client (bieucam.js): bảng chọn trên nút, bấm mặt -> mã vào ô gõ chat
      if (k === "Face") { const inp = P.hud.bot.querySelector(".jx-input"); if (!BieuCam.mo(P.hud.bot.querySelector('[data-k="Face"]'), (ma) => { BieuCam.chen(inp, ma); inp.focus(); })) P.hud.msg("Biểu cảm: thiếu gói assets/ui/bieu-cam (node cong-cu/dung-bieu-cam.mjs)"); return; }
      if (k === "Exchange") return gdLam({ viec: "mo", on: on ? 1 : 0 });
      if (k === "ChoTroi") return GW.cho.moBang(); // nút Chợ Trời (anh 02/11 — chỗ nút Chạy bộ cũ của thanh dưới, cong-cu/dung-nut-cho-troi.mjs): bảng Chợ Trời ở đâu cũng mở
      if (ONLINE[k]) return P.hud.msg(ONLINE[k] + ": cần máy chủ chơi nội bộ — làm khi dựng máy chủ");
    },
    onSend: sendChat,
    onKhoe: (it, e) => GW && (it ? GW._showTip(it, e) : GW._hideTip()), // rê / chạm chữ <tên đồ> của tin khoe đồ (khoeDo)
    onMapClick: (x, y) => world && world.clickGround(x, y),
    onMoi: moiTraLoi, // lời mời tổ đội: chữ trong ô tin hệ thống / biểu tượng (hud.js moiDoi)
    onGoto: diToaDo, onNhiemVu: bamNhiemVu, onDoi: () => { P.audio.ui("click"); P.win.get("team").show(); }, // bảng đội ngũ -> khung Lập nhóm
    onSlot: quickClick, onSlotMenu: quickMenu, onSlotTip: quickTip,
    onSkillSlot: skillPick, onSkillTip: skillSlotTip, onSlotDown: quickDown,
    onBoCuc: (k) => { P.audio.ui("click"); boCuc(k); }, // thanh Lưu bố cục · Mặc định · Hủy lúc kéo thả bảng
  });
  GW = new GameWindows(P.win, {
    // oThanh: Kỳ Trân Các chỉ mua ở thành / thôn; doi: tổ đội (khung Lập nhóm)
    uyThac: moUyThac, // Esc → Ủy thác (anh 11/11)
    khoe: khoeDo, // Ctrl + bấm món ở Hành trang / Trang bị: khoe đồ lên kênh chat (anh 12/11)
    P, hero: () => hero, world: () => world, hang: () => hangCap, save, saveSettings, oThanh: () => !!world && TOWN_KINDS.has(world.zone.kind), doi: (b) => doiLam(b), msg: (t) => P.hud.msg(t), leaveGame, toggleAuto, toggleSound, get dev() { return devOn() ? dev : null; }, applyBright, doItem, thuongDN, xepHang: () => Net.xepHang(),
    applyLooks: () => world && world.applyLooks(), help: showHelp, drink, dungPhu: (b) => dungPhu(b), dungVat: (b) => dungVat(b), luat, bought: quickAdd, troThu: () => TT && TT.open(), nhiemVu: () => (hero && world ? nhiemVuDs() : []), bamNv: (k) => bamNhiemVu(k),
    tin: () => P.tin || [], moUngHo: () => UH && UH.open(0), tinXem: () => (hero && hero.auto && hero.auto.tinXem) | 0, daXemTin, quanTri: () => !!(Net.me && Net.me.admin), qtBang: () => qt, // Tin cập nhật, Giúp đỡ (anh 29/10)
    gd: (b) => gdLam(b), // khung giao dịch (anh 30/10 — windows.js _giaoDich)
    khamNam: (b, o) => khamGoi(b, o), // khảm nạm Thủy tinh (o.sau: promise hiệu ứng — câu báo đợi xong) (anh 17/11 — windows.js _kham, may-chu/kham-nam.js)
    bh: (b, o) => bhLam(b, o), bhMinh: () => bhMinhCur, // Bang phái (anh 14/11 — windows.js _faction): việc POST /api/bang-hoi, bang của mình theo nhịp
    teDan: () => teDanMo(), leVat: () => leVatMo(), doiMk: () => KAT && KAT.doiMk1(), tacPhuong: (loai) => tacPhuongMo(loai), dacKy: () => dacKyBangMo(false), // Bang hội đợt 2: khung lời Tế Đàn (Ký lục → Mục tiêu tuần) / Tổng quản Lễ phẩm phường (Tác phường → Sử dụng)
    khuVao: () => khuVao(), khuTaoBanDo: () => khuChonMau(), khuThietLap: () => khuThietLap(), // đợt 4: khu vực bang (khung Bang phái — Vào bang này, Tạo bản đồ, Thiết lập khu vực)
    // khung chọn kiểu NPC (msgsel) cho khung Bang phái: chỉ số mục đã chọn, -1 = Hủy bỏ (Chuyển kiến thiết / Tự bù chiến bị — đợt 2)
    chon: (html, ds, ten) => new Promise((r) => { if (!NPCD || !hero) return r(-1); NPCD.choose("msgsel", "InfoText", richText(html, hero.name, ten || ""), [...ds.map((t, i) => [t, () => r(i)]), ["Hủy bỏ", () => r(-1)]]); }),
    cho: (b) => choLam(b), moSap: (on) => moSap(on), // chợ trời (anh 02/11 — src/game/chotroi.js)
    dragSkill: (e, id) => dragBegin(e, { s: id, ic: P.skillIcon[id] }),
    skillsChanged: (newId) => { if (world) world.refreshStats(false); skillHud(); if (newId && !(hero.oChieu || {}).trai) P.hud.msg(DT && DT.on ? "Chọn chiêu đánh: chạm nút khóa cạnh ô kỹ năng (mở khóa) rồi chạm ô T" : "Chọn chiêu đánh: bấm ô kỹ năng tay trái (T) ở thanh dưới"); },
  });
  // ô chữ góc trái dải trên: tên máy chủ của nhân vật, số người trực tuyến, ping tới máy chủ game
  NPCD = new NpcDialog(P.win, P.npcDlg, npcApi());
  TT = new TroThu(P.win, { P, net: Net, hoi: (...a) => GW.hoi(...a), hero: () => hero, world: () => world, save, saveSettings, msg: (t) => P.hud.msg(t), doItem, farmZones: () => P.maps.zones.filter((z) => FARM_KINDS.has(z.kind) && !z.chiThuyen).sort((a, b) => a.lo - b.lo || (a.kind === "chính" ? -1 : 1)), moBai: (z) => moBai(z), capVao, coChung: (z) => laQc(z), qcPct, treo: treoStart, uyThac: moUyThac, shown: (o) => P.hud.setTroThu(o),
    doi: () => doiTt, boCuc, dangKeo: () => !!P.hud.dangKeo, dt: () => DT, hz: () => rafHz, khungNen: () => khungNen, datKhungNen,
    skills: skillsUsable, skillsChanged: () => { if (world) world.refreshStats(false); skillHud(); },
    // anh 03/11: thẻ con Boss Hoàng Kim (trạng thái boss), Về thành (thành có bản đồ), Tiện ích → Nhiệm vụ ngày (tulam.js — mở khóa bằng Xu)
    bossTg: () => BossTG.b, phLich: () => PhongHoa.lich || null, coBai: (id) => P.maps.zones.some((z) => z.id === id), tl: () => hero && TuLam.tl(hero) && { ...TuLam.tl(hero), gia: (hero.tl && hero.tl.gia) || { dt: 10, st: 5 } },
    // Tiện ích → Tra cứu (anh 05/11): dữ liệu Tra cứu của khung Hướng dẫn hoạt động, mở bảng lớn ở 1 mục
    traCuu: () => (HD ? HD.TC : null), layTraCuu: () => HD && HD.layTc(), moTraCuu: (muc, q) => { if (!HD) return; HD.tim = q || ""; HD.open(1, muc); },
    lichHd: () => (HD ? HD.L : null), // lịch sống (giờ Boss Hoàng Kim GM đổi ở F10)
    moTl: moKhoaTuLam, tlNut: (loai) => { TuLam.nut(loai); if (TT) TT.render(); }, tlChay: (loai) => TuLam.chay(loai), tlBatDau: () => { TuLam.batDau(); if (TT) TT.render(); }, tlDang: () => TuLam.dang || (TuLam.s.dtDung ? "Đã thôi Dã Tẩu: " + TuLam.s.dtDung : TuLam.s.stDung ? "Đã thôi Sát thủ: " + TuLam.s.stDung : "") });
  HD = new HuongDan(P.win, { P, net: Net, hero: () => hero, nguHanh: (h, lai) => TT.nguHanhDom(h, lai), openTin: () => GW.openTin(), dangMo: (on) => P.hud.setHuongDan(on), chamDo: (co) => P.hud.chamHuongDan(co),
    tcXong: () => { if (TT && TT.w.visible) TT.render(); } });
  // Phân Thân (anh 05/11): khung thuê; phân thân đang theo đổi -> dựng / bỏ nhân vật máy ở bãi (phanThanTheo)
  NZ = new NhomZalo(P.win, { P, msg: (t) => P.hud.msg(t) });
  UH = new UngHo(P.win, { P, thu: () => P.ungHo, tai: () => Net.ungHo(), moQr: () => moUngHoQr() }); // moQr: khung 4 bước ủng hộ (anh 13/11 — dùng chung với trang chủ)
  PT = new PhanThan(P.win, { P, net: Net, hero: () => hero, msg: (t) => P.hud.msg(t), hoi: (...a) => GW.hoi(...a), bao: (h) => GW.bao(h),
    // khung chọn của game (gói thuê — anh 12/11): chỉ số nhãn đã chọn, -1 = Thôi
    chon: (html, ds) => new Promise((r) => { if (!NPCD) return r(-1); NPCD.choose("msgsel", "InfoText", richText(html, hero.name, "Phân Thân"), [...ds.map((t, i) => [t, () => r(i)]), ["Thôi", () => r(-1)]]); }),
    apply: (j) => { applyServer(j); if (GW) GW.refresh(true); }, doiTheo: (tt) => phanThanTheo(tt), dangMo: (on) => P.hud.setPhanThan(on) });
  BC = new BauCua(P.win, { P, net: Net, hero: () => hero, msg: (t) => P.hud.msg(t), hoi: (...a) => GW.hoi(...a), bao: (h) => GW.bao(h),
    apply: (j) => { applyServer(j); if (GW) GW.refresh(true); }, chonSo: (o) => GW.chonSo(o) }); // Bầu Cua (anh 10/11 — may-chu/bau-cua.js)
  P.hud.setInfo(() => ({ server: (SERVERS.find((s) => s.id === (hero && hero.server)) || {}).n || "-", online: Net.online || 1, ping: Net.ping, ky: KY_NGAN }));
  // điện thoại (anh 29/10 — mẫu 1 Cổ phong; anh 31/10: điện thoại tự bật, ?dt=0 tắt — src/game/dienthoai.js); máy tính dùng chuột: giao diện
  // điện thoại khi kéo cửa sổ dọc hẹp (anh 02/11 — mt)
  const dtChe = DienThoai.cheDo();
  TD = new TanThu({ P, hero: () => hero, world: () => world, save: () => save(), msg: (t) => P.hud.msg(t), GW: () => GW, DT: () => DT, laBai: (z) => FARM_KINDS.has(z.kind), laThanh: (z) => TOWN_KINDS.has(z.kind), xaPhu: (w) => xaPhuNpc(w), baiTreo: () => baiTreo(), zones: () => P.maps.zones, luat: () => luat(), toggleAuto: () => toggleAuto(), phu: () => phuTrongTui(), dungPhu: (b) => dungPhu(b), thuongCap: () => thuongCap({ viec: "mo" }), troThu: () => TT && TT.open(), bam: (k) => bamNhiemVu(k) });
  if (dtChe) DT = new DienThoai({ P, cv, hero: () => hero, world: () => world, GW: () => GW, TT: () => TT, toggleAuto, facOf, tinMoi: tinChuaXem, thuongCho: () => thuongCho, help: showHelp, joy: joyMove, vut: () => throwHeld(true),
    fps: () => fpsLast, ping: () => Net.ping, online: () => Net.online, mt: dtChe === "mt" });
  chamGiu(() => GW, () => !!(DT && DT.on), P.win); // máy tính bảng: đè giữ món / chiêu để xem + nút việc làm (anh 09/11)
}
let GW = null; // cửa sổ của các nút (src/game/windows.js)
let DT = null; // chế độ điện thoại dựng dọc (src/game/dienthoai.js) — null: giao diện máy tính
let hangCap = null; // thứ tự cấp trong máy chủ (nhịp — may-chu/xep-hang.js), ô Hạng dải trên
let buffLuc = 0; // lúc nhận hero.buff (trạng thái vật phẩm) từ máy chủ — đếm lùi giữa 2 nhịp
// anh 16/11 — Báo Đáp Ân Sư: số cấp kỹ năng Nhất Kỷ / Càn khôn đang cộng ở lần tính chỉ số gần nhất (rules.js ccCong — hero.ccKn máy chủ gửi kèm nv): đổi (vừa dùng / hết
// hạn lúc đang chơi — trangThaiHud mỗi 250 ms) -> tính lại chỉ số (chiêu bị động, vòng sáng, hỗ trợ), ô kỹ năng, bảng Võ công
let ccTruoc = 0;
function ccKiem() {
  if (!hero) return;
  const c = ccCong(hero); if (c === ccTruoc) return;
  ccTruoc = c;
  if (world) world.refreshStats(false);
  skillHud(); if (GW) GW.refresh(true);
}
// các trạng thái vật phẩm đang cộng chỉ số (Bách Quả Lộ — World.bonus): bật / hết hạn thì tính lại chỉ số
const buffChiSo = (b) => Object.keys(b || {}).filter((k) => { const T = b[k] > 0 && ItemDB.buffDef(k); return !!(T && (T.khang || T.attrs)); }).sort().join(); // + bùa Phong Hỏa (ItemDB.buffDef)
let TT = null; // khung Trợ Thủ (src/game/trothu.js)
let HD = null; // khung Hướng dẫn hoạt động (src/game/huongdan.js — anh 05/11)
let PT = null; // khung Phân Thân (src/game/phanthan.js — anh 05/11)
let BC = null; // bàn cược Bầu Cua (src/game/baucua.js — anh 10/11)
let NZ = null; // khung Nhóm Zalo (src/game/nhomzalo.js — anh 09/11)
let UH = null; // khung Ủng hộ tác giả (src/game/ungho.js — anh 12/11; danh sách ủng hộ: GET /api/ung-ho)
let KAT = null; // khóa an toàn — mật khẩu cấp 2 (src/game/khoaantoan.js — anh 10/11; dựng lúc tải trang, dùng cả ở màn chọn nhân vật)
// Phân Thân đang theo (phanthan.js doiTheo — trạng thái đầy đủ { ra, ds: [{ id, ten, snap }] }): World dựng / bỏ nhân vật máy ở bãi train
let ptTheo = null;
function phanThanTheo(tt) { ptTheo = tt; if (world && world.datPhanThan) world.datPhanThan(tt, hero); }
// Chat: kênh có máy chủ (may-chu/the-gioi.js) gửi cho mọi người — thế giới: cả máy chủ, phụ cận / thành thị: cùng bản đồ, đội ngũ (anh 28/10
// lần 5): người cùng đội. Tin của mình hiện ngay khi máy chủ nhận. Kênh khác (môn phái, bang…) chưa có: chỉ hiện ở máy mình như trước.
// CH_TONG: kênh Bang hội (anh 14/11 — Bang hội đợt 1, may-chu/the-gioi.js KENH): chỉ người cùng bang nhận; chưa có bang thì chặn ngay ở đây như kênh đội ngũ
const NET_CH = new Set(["CH_WORLD", "CH_NEARBY", "CH_CITY", "CH_TEAM", "CH_TONG", "PRIVATE"]); // PRIVATE: nhắn tin mật (anh 13/11 — hud.datMat)
function sendChat(ch, t) {
  if (ch === "CH_TEAM" && !doiTt) return P.hud.canh("Bạn chưa có đội ngũ — lập nhóm / vào nhóm rồi mới nói được ở Tần số đội ngũ");
  if (ch === "CH_TONG" && !bhMinhCur) return P.hud.canh("Bạn hiện giờ không thuộc bang hội nào!"); // tongleavepower.lua :28
  // khoe đồ (khoeDo): chữ còn <tên đồ> đã chèn -> gửi kèm mã món, máy chủ lấy món thật (may-chu/the-gioi.js monKhoe)
  const kd = P.hud.khoeDo, u = kd && t.includes(`<${kd.ten}>`) ? kd.u : null;
  P.hud.khoeDo = null;
  if (!NET_CH.has(ch)) { P.hud.chat(ch, hero.name, t, true); return P.hud.msg("Kênh này chưa có trên máy chủ — tin chỉ hiện ở máy mình. Nói với mọi người: kênh Phụ cận / Thành thị / Thế giới"); }
  const toi = ch === "PRIVATE" ? P.hud.matToi : null; // nhắn tin mật (anh 13/11): người nhận = tên đã chọn (Ctrl + bấm tên ở khung chat / menu người chơi)
  if (ch === "PRIVATE" && !toi) return P.hud.canh("Chưa chọn người nhận tin mật — Ctrl + bấm tên người đó ở khung chat, hoặc Ctrl + chuột phải vào người chơi → Nhắn tin mật");
  Net.chat(hero.slot | 0, ch, t, u, toi).then((j) => P.hud.chat(ch, hero.name, (j && j.text) || t, true, { ...(j && j.it ? khoeThem(j.it) : {}), ...(toi ? { toi } : {}) }))
    .catch((e) => { if (e.ma !== "het-phien") P.hud.msg("Chưa gửi được: " + e.message); });
}
// khoe đồ lên kênh chat (anh 12/11 "thêm chức năng post đồ trên kênh thế giới"): Ctrl + bấm món ở Hành trang / Trang bị (điện thoại: nút Khoe đồ
// của ô xem món — windows.js) -> chèn <tên đồ> vào ô chat (mỗi tin 1 món); gửi thì kèm mã món (sendChat). Người xem rê chuột / chạm chữ <tên đồ>
// trong khung chat -> ô xem món (hud.js chatHtml .jx-khoe -> onKhoe)
function khoeDo(it) {
  const x = it && ItemDB.item(it.k); if (!x || !P.hud) return;
  const ten = String(x.n).replace(/\s+/g, " ").trim();
  if (DT && DT.on) { if (GW) GW.closeAll(); DT.chat = true; DT.tick(); } // điện thoại: đóng túi, mở khung Chat (ô gõ ở đó)
  if (!P.hud.chenKhoe(ten)) return P.hud.canh("Ô chat đầy chữ — xóa bớt rồi khoe đồ");
  P.hud.khoeDo = { u: it.u, ten };
}
const khoeThem = (it) => ({ it, itMau: mauMon({ d: (it.d || []).length }) }); // màu chữ <tên đồ> như dòng nhặt đồ (xanh: món có dòng)
// Hẹn giờ chạy cả khi tab ẩn (anh 01/11: ẩn tab / thu nhỏ / cửa sổ khác che thì nhân vật tự chết): nhịp từ luồng phụ src/game/dong-ho-nen.js —
// bộ hẹn giờ của trang bị trình duyệt hãm tới 1 lần / phút khi ẩn lâu, game bù cả phút đánh nhau một lúc. Không tạo được luồng phụ thì setInterval
function henGio(fn, ms) {
  try { const w = new Worker(new URL("./dong-ho-nen.js", import.meta.url)); w.onmessage = () => fn(); w.postMessage(ms); return; } catch { /* trình duyệt chặn luồng phụ */ }
  setInterval(fn, ms);
}
// Thấy nhau trên bản đồ (anh muốn 25/10): ghi mốc vị trí / động tác 4 lần mỗi giây, gửi lên máy chủ tối đa 2 lần mỗi giây — các nhịp cách nhau
// ≥ NHIP_CACH ms (anh 01/11: bản trước tab ẩn gửi mỗi lần lấy mốc, trang có tiếng thì trình duyệt không hãm -> 4 nhịp / giây, máy chủ báo nghi tăng
// tốc; nd = 1: trang giữ nhịp như vậy — may-chu/chong-hack.js) kèm đồ đang mặc; nhận người khác cùng bản đồ (World.setOthers) + tin chat mới; đo
// ping + số người trực tuyến luôn ở đây. Mốc: [đồng hồ máy (ms), x, y, hướng, động tác, atkN, đòn 1|2|3 (3 = thi pháp), thế đánh 0|1] — may-chu/the-gioi.js.
// Anh 02/11 (quái chung: "giữa 2 acc vẫn còn khoảng lag và delay, không mượt như game gốc"): ghi mốc 10 lần / giây (bản trước 4) — người xem vẽ
// trễ ≈ khoảng cách 2 mốc + độ chậm mạng lúc nhanh lúc chậm (world.js updateOther): 0,48 giây -> khoảng 0,25 giây
// mốc 20 lần / giây (độ mượt bước 1, 13/11 tối — trước 10): chỉ gửi qua kênh tức thời khi mốc khác lần gửi trước (vtCuoi — đứng yên không gửi)
const SAMPLE_MS = 50, NHIP_CACH = 450, BOSS_MS = 250, VT_GIU_MS = 250; // VT_GIU_MS: đứng yên vẫn gửi mốc "vẫn ở đây" (đồng hồ vẽ máy người xem không tụt lại)
let vtCuoi = "", vtLuc = -1e9, mocCuoiT = -1; // mocCuoiT: đồng hồ mốc ghi gần nhất (simDen) — chưa có bước game mới thì không ghi mốc
const trail = [];
const ptTrail = new Map(); // Phân Thân (anh 05/11): mốc của từng phân thân đang theo (mã -> mốc) — gửi kèm nhịp s.pt, người cùng bãi thấy (may-chu/the-gioi.js)
let pulsing = false, nhipLuc = -1e9, bossLuc = -1e9;
henGio(async () => {
  if (!world || !hero || !Net.me) { trail.length = 0; return; }
  const bay = performance.now();
  if (bay - bossLuc >= BOSS_MS) { bossLuc = bay; BossTG.tick(); SanNhim.tick(); QuaiCanh.tick(); } // boss thế giới: gửi sát thương qua kênh tức thời, máu đoán trước, bảng trên giữa màn (4 lần / giây như cũ)
  const w = world, p = w.player;
  // chỗ + mã con đang nhắm (quái chung / Vượt Ải: mã chung cả bãi — m.vaDoi): đội viên bật "đánh cùng mục tiêu" đánh đúng con đó (theoCua)
  // mốc mang lúc game tính bước gần nhất (simDen — anh 14/11 nhảy cóc): tab ẩn game chỉ tính 4 lần / giây mà mốc lấy 20 lần / giây -> trước ghi 4 mốc cùng
  // chỗ rồi 1 mốc vọt 0,25 giây đường; nay chưa có bước mới thì không ghi / gửi mốc mới
  const tSim = Math.round(simDen || bay), coMoi = tSim > mocCuoiT;
  const moc = [tSim, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, p.dir, p.act, p.act === "jump" && p.jump ? p.jump.n : p.atkN || 0, p.attack === "Attack2" ? 2 : p.attack === "Magic" ? 3 : 1, p.target ? 1 : 0,
    ...(p.target ? [Math.round(p.target.x), Math.round(p.target.y), p.target.vaDoi | 0] : [])];
  if (coMoi) { mocCuoiT = tSim; trail.push(moc); if (trail.length > 12) trail.shift(); }
  if (w.phanThan.length || ptTrail.size) {
    for (const k of [...ptTrail.keys()]) if (!w.phanThan.some((a) => a.id === k)) ptTrail.delete(k);
    for (const a of w.phanThan) { const L = ptTrail.get(a.id) || ptTrail.set(a.id, []).get(a.id); if (coMoi) L.push([tSim, Math.round(a.x * 10) / 10, Math.round(a.y * 10) / 10, a.dir, a.act, a.atkN || 0, a.attack === "Attack2" ? 2 : a.attack === "Magic" ? 3 : 1, a.fight ? 1 : 0]); if (L.length > 12) L.shift(); }
  }
  // gửi ngay mốc vừa ghi qua kênh tức thời (anh 01/11 khuya "mọi người thao tác bị khựng" — người cùng bãi nhận liền, không chờ 2 nhịp;
  // may-chu/the-gioi.js "vt"); kênh chưa mở thì thôi, nhịp vẫn gửi đủ mốc
  // chỉ khi khác mốc vừa gửi (chạy, đổi hướng / động tác, ra đòn, đổi mục tiêu) — đứng yên không gửi, nhịp vẫn mang mốc (máy chủ gom theo bãi 50 ms — độ mượt bước 1)
  { const k = moc.slice(1).join(","); if (coMoi && (k !== vtCuoi || bay - vtLuc >= VT_GIU_MS) && Net.wsGui({ t: "vt", tr: [moc] })) { vtCuoi = k; vtLuc = bay; } }
  w.kenhSong = !!Net.wsOk; // người xem: kênh tức thời còn sống thì độ chậm tin tới chỉ đo theo kênh (world.js _moc)
  if (pulsing || bay - nhipLuc < NHIP_CACH) return;
  nhipLuc = bay; pulsing = true;
  const tr = trail.splice(0), bai = baiMoi, extra = takePending(bai);
  baiMoi = null;
  try {
    const daNhan = Net.tinId != null; // lần nhịp đầu nhận lại các tin gần nhất: thông báo cũ của quản trị không hiện lại giữa màn hình
    // auto: ủy thác (may-chu/do.js); hp / mp %: bảng đội ngũ của đồng đội; vs: vòng sáng hỗ trợ đang bật — đồng đội đứng gần được hưởng (anh 29/10)
    // dv: bản danh sách món người chơi vứt ra (chung cả bãi — anh 30/10) World này đang có; khác bản máy chủ thì máy chủ gửi dc
    const zn = zoneToi ?? w.zone.id, dv = datChung.w === w && datChung.z === zn ? datChung.v : -1, bst = BossTG.layNhip(), nst = SanNhim.layNhip(), mcv = QuaiCanh.layNhip(), vad = VaDoi.layNhip(), vdd = VdDoi.layNhip(), qcd = QuaiChung.layNhip(), phd = PhongHoa.layNhip();
    // chv: bản danh sách sạp chợ trời của bãi World này đang có (khác bản máy chủ thì máy chủ gửi cho — sapNhan)
    const chv = choV.w === w && choV.z === zn ? choV.v : 0;
    const dct = DoCongCu.layBaoCao(); // dò công cụ (anh 13/11): có dấu hiệu mới thì gửi kèm nhịp — máy chủ ghi cờ "Nghi dùng công cụ" cho F10, không tự xử
    const j = await Net.pulse(hero.slot | 0, { zone: zn, ...((zoneToi != null ? chungToi : w.chung) ? { c: 1 } : {}), lvl: hero.lvl, look: looksOf(hero), tr, auto: w.auto ? 1 : 0,
      hp: p.hp > 0 ? Math.max(1, Math.round((p.hp * 100) / p.hpMax)) : 0, mp: Math.round((p.mp * 100) / p.mpMax), vs: w.vongPhat(), /* hp: còn sống thì ≥ 1 % — dưới 0,5 % làm tròn 0 thì người khác coi như đã ngã, không đánh được tới khi hồi (soát lôi đài 15/11) */ bl: w.buaPhat(), bc: w.buaHaiPhat(), /* bùa hại đang dính (Tống Kim — anh 12/11) */ kd: w.tkKhangPhat(), /* kháng / né thật đang có (Tống Kim — lượt 86) */
      ...(w.phanThan.length ? { pt: w.phanThan.map((a) => ({ i: a.id, tr: (ptTrail.get(a.id) || []).splice(0), vs: a.vs || [], bl: a.bl || [] })) } : {}) }, { ...extra, dv, chv, tc: Math.round(performance.now()), nd: 1, ...(dct ? { dct } : {}), ...(bst ? { bst } : {}), ...(nst ? { nst } : {}), ...(mcv ? { mcv } : {}), ...(vad ? { vad } : {}), ...(vdd ? { vdd } : {}), ...(qcd ? { qcd } : {}), ...(phd ? { phd } : {}) }); // tc: đồng hồ trang — máy chủ dò tăng tốc (may-chu/chong-hack.js)
    if (dct) DoCongCu.daGui(dct); // nhịp tới máy chủ rồi mới đánh dấu đã báo (soát 13/11)
    if (world === w) { w.setOthers(j.ai); w.phe = j.cp ?? null; } // cp: phe đang theo của mình (màu tên, vòng sáng — World.pheMinh)
    tlXet(j.tl); // bắt cả máy chủ F5 / có bản mới (may-chu/cau-hinh-qt.js tlNay — anh 11/11)
    if (j.gh) ghimNhan(j.gh); // ghim của quản trị ở khung chat (anh 03/11)
    ghimDau = false;
    if ("doi" in j) doiApply(j.doi);
    if ("gd" in j) gdApply(j.gd);
    if ("bhMinh" in j) { bhCcCo = true; bhMinhApply(j.bhMinh); } // bang hội (anh 14/11 — THIET-KE-BANG-HOI 1.8): bang của mình (máy chủ có bang hội thì công cáo đi theo nhịp — bhCc), lời mời, công cáo ghim
    if ("bhMoi" in j) bhMoiApply(j.bhMoi);
    if ("bhCc" in j) bhCcApply(j.bhCc);
    if (j.dc && world === w && w.zone.id === zn) { w.datChung(j.dc.ds); Object.assign(datChung, { w, z: zn, v: j.dc.v }); }
    if (j.cho && world === w && w.zone.id === zn) { Object.assign(choV, { w, z: zn, v: j.cho.v }); sapNhan(w, j.cho.ds); }
    if (j.dat && world === w && w.zone.id === bai) for (const v of j.dat) w.drop(v.x, v.y, { g: v.g, tuoi: v.tuoi || 0.01, ...(v.tien ? { gold: v.tien } : { item: v }) });
    if (hudMounted) for (const m of j.tin) { P.hud.chat(m.ch, m.name, m.text, false, m.it ? khoeThem(m.it) : null); if (m.qt && daNhan) loaThongBao(m.text); } // qt: thông báo của quản trị (bảng quản trị); it: món khoe
    if (P.hud.setBauCua) P.hud.setBauCua(j.bcua || null); if (DT) DT.setBauCua(j.bcua || null); // biểu tượng Bầu Cua (anh 10/11 lần 3 — may-chu/bau-cua.js nhipCon)
    if (j.km && KAT) KAT.capNhat(j.km); // ổ khóa an toàn: máy chủ khởi động lại / khóa lại ở thẻ khác -> trang này khóa lại (may-chu/bao-mat.js trangThai)
    applyServer(j, extra && extra.at);
    if (utXem) hienUyThac(); // báo cáo ủy thác chưa bấm "Đã xem" mà bảng đã bị đóng: hiện lại
    nhipXong++; utSauNhip(); // ủy thác bằng nút (moUyThac): đủ nhịp báo máy chủ "đang tự đánh ở bãi" thì rời game
  } catch (e) {
    Net.ping = null;
    if (bai != null && baiMoi == null) baiMoi = bai;
    if (e.net && extra) { pending.kills.unshift(...extra.k); pending.at.unshift(...extra.at); pending.nhat.unshift(...extra.nhat); pending.deaths += extra.chet; for (const [u, n] of extra.uong) pending.uong.set(u, (pending.uong.get(u) || 0) + n); if (extra.luyen && world) for (const [id, n] of extra.luyen) world.luyenDem.set(id, (world.luyenDem.get(id) || 0) + n); } // mất mạng: gửi lại ở nhịp sau
  } finally { pulsing = false; }
}, SAMPLE_MS);
// quái đã giết / số lần trọng thương / thuốc đã uống (mã món -> số bình) chưa gửi (gửi kèm nhịp; rời game thì gửi kèm lần báo rời).
// at = chỗ từng con chết [x, y, bãi] (không gửi đi — máy chủ trả món / tiền rơi theo thứ tự con trong k, vẽ rơi đúng chỗ đó)
// nhat = mã vật trên đất vừa nhặt; bai = vừa vào bãi đó (máy chủ trả vật còn nằm trên đất ở bãi)
const pending = { kills: [], at: [], nhat: [], deaths: 0, uong: new Map() };
let baiMoi = null;
// danh sách món người chơi vứt ra (chung cả bãi): World + bãi + bản máy chủ đã vẽ (nhịp gửi dv)
const datChung = { w: null, z: null, v: -1 };
// danh sách sạp chợ trời của bãi (may-chu/cho-troi.js nhip): World + bãi + bản máy chủ đã gửi (nhịp gửi chv)
const choV = { w: null, z: null, v: 0 };
// hao = số lần [ra đòn, bị đánh trúng, sang vùng bản đồ khác] của World từ nhịp trước (máy chủ trừ độ bền — may-chu/do.js hao)
function takePending(bai) {
  const hz = world && world.hao, hao = hz && (hz[0] || hz[1] || hz[2]) ? hz.splice(0, 3, 0, 0, 0) : null;
  // luyen = số lần trúng quái của từng chiêu luyện từ nhịp trước (vocong.js misHit — máy chủ cộng độ luyện, anh 29/10)
  const lk = world && world.luyenDem && world.luyenDem.size ? [...world.luyenDem] : null;
  if (!pending.kills.length && !pending.deaths && !pending.uong.size && !pending.nhat.length && bai == null && !hao && !lk) return undefined;
  if (lk) world.luyenDem.clear();
  const r = { k: pending.kills.splice(0, 200), chet: pending.deaths, uong: [...pending.uong], nhat: pending.nhat.splice(0), ...(bai != null ? { bai } : {}), ...(hao ? { hao } : {}), ...(lk ? { luyen: lk } : {}) };
  pending.deaths = 0; pending.uong.clear();
  Object.defineProperty(r, "at", { value: pending.at.splice(0, r.k.length) }); // không đếm được -> không vào JSON gửi đi
  return r;
}
// màu tin trong khung chat (anh 27/10 "nhặt tiền màu gì, exp màu gì, đồ hiển thị thế nào — khá quan trọng"): tên đồ theo màu tên vật của client
// (settings\obj\ObjNameColor.ini — như tên đồ nằm trên đất: trắng / xanh lam có dòng / vàng cam đồ đặc biệt: đồ chí, mật đồ, vật phẩm Kỳ Trân Các);
// kinh nghiệm xanh lá của client (ObjNameColor 0,255,0), tiền xanh ngọc (anh chọn 27/10 — khác hẳn vàng của tin thường / tên đồ); câu cảnh báo đỏ ở
// ô tin dưới khung chat (hud.canh); tin mảnh Sơn Hà Xã Tắc / địa đồ chí và "hành trang đã đầy" đỏ như câu cảnh báo (anh 27/10). Dòng nhận kinh
// nghiệm khi đánh quái (riêng, chia đội, quái chung, Vượt Ải) và nhặt tiền gửi hud.msg(…, true): chỉ ở thẻ Khác (anh 02/11)
const MAU_TIN = { kn: [0, 255, 0], tien: [0, 220, 220], do: [255, 96, 96], ghim: [255, 154, 60] };
// ghim của quản trị (may-chu/quan-tri.js ghim — anh 03/11 chọn kiểu 1): dòng [Ghim] đầu khung chat (hud.js ghim; điện thoại: đầu khung chat —
// dienthoai.js). Ghim mới tới lúc đang chơi (không phải nhịp đầu sau khi vào trang) thì thêm 1 dòng tin cho người chơi để ý
let ghimDau = true;
function ghimNhan(g) {
  P.hud.ghim(g);
  if (g.t && !ghimDau) P.hud.msg(`[Ghim] ${g.t}`, MAU_TIN.ghim);
}
// phần thưởng đang chờ nhận (anh 03/11 — "nhân vật đủ điều kiện nhận thưởng nhưng họ quên thì làm sao nhắc", chọn kiểu 1 "chấm đỏ có số"):
// máy chủ gửi mỗi nhịp ntc = loại thưởng của nút Nhận thưởng còn nhận được (api.js). Số đỏ trên nút (máy tính: cột icon dưới bản đồ nhỏ — hud.js
// datThuong; điện thoại: nút Nhận thưởng + thẻ Giang hồ + ô đầu Việc cần làm — dienthoai.js _dau), mục còn quà trong khung chọn ghi "(có thể
// nhận)" (nhanThuong). Dòng tin: nhịp đầu sau khi vào game (còn mấy loại) + loại mới có trong lúc chơi (sang ngày, lên mốc cấp, đủ giờ phúc
// duyên — Online nhận thưởng đã có câu báo riêng lúc đủ mốc: may-chu/online.js)
const TEN_THUONG = { dn: "Đăng nhập nhận thưởng", cap: "Thưởng thăng cấp", onl: "Online nhận thưởng", pd: "Phúc duyên" };
let thuongCho = [], thuongDau = true, thuongVe = -1; // thuongVe: số đang vẽ trên nút (-1: chưa vẽ)
function capNhatThuong(ds) {
  if (!hudMounted) { thuongCho = ds; return; } // nhịp tới lúc thanh giao diện chưa dựng (lần vào game đầu — gotoZone trước mountHud): chờ nhịp sau
  const cu = thuongCho; thuongCho = ds;
  if (thuongVe !== ds.length) { thuongVe = ds.length; P.hud.datThuong(ds.length); }
  const moi = thuongDau ? ds : ds.filter((k) => !cu.includes(k) && k !== "onl");
  if (moi.length) P.hud.msg(`${thuongDau ? `Còn ${ds.length} phần thưởng chưa nhận` : "Có phần thưởng mới"}: ${moi.map((k) => TEN_THUONG[k]).join(", ")} — ${DT && DT.on ? "chạm Giang hồ → Nhận thưởng" : "bấm nút Nhận thưởng (dưới bản đồ nhỏ)"}.`, MAU_TIN.tien);
  thuongDau = false;
}
const mauMon = (m) => { const M = (P.roi && P.roi.M.mau) || []; return M[m.db ? 2 : m.d ? 3 : 0] || [255, 255, 255]; };
const fmtSo = (n) => Math.round(n).toLocaleString("vi-VN");
// Kết quả máy chủ tính (may-chu/do.js, 25/10): cấp / kinh nghiệm / ngân lượng, túi + đồ mặc, đồ vừa nhặt, phạt khi trọng thương.
// Bản ở máy (Net.me.nv) cập nhật luôn — không gọi save(): máy chủ không nhận các trường này từ trình duyệt.
// at = chỗ các con quái của lần báo giết này: món + tiền rơi xuống đất ở chỗ con đó (còn ở bãi đó); nhặt =
// kết quả nhặt vật trên đất; vut = món vừa vứt ra đất
function applyServer(j, at) {
  if (!j || !hero) return;
  // boss thế giới (bosstg.js — anh 31/10): trạng thái kèm nhịp (kênh tức thời chưa mở / dự phòng) + thưởng theo % sát thương
  if ("btgDs" in j) BossTG.capNhat(j.btgDs); else if ("btg" in j) BossTG.capNhat(j.btg); // btgDs: mọi boss (lượt 86)
  if (j.ntc) capNhatThuong(j.ntc); // phần thưởng đang chờ nhận (số đỏ trên nút Nhận thưởng)
  if (j.rtb) ruongNhan(j.rtb); // Rương Thần Bí đang có (kênh tức thời chưa mở / dự phòng)
  if (j.btgThuong) BossTG.thuong(j.btgThuong);
  // Săn Nhím Béo Phì (sannhim.js — anh 03/11): trạng thái kèm nhịp + thưởng người ra đòn kết liễu
  if ("snh" in j) SanNhim.capNhat(j.snh);
  if ("mcv" in j) QuaiCanh.capNhat(j.mcv); // quái canh cây Võ Lâm Minh Chủ
  if (j.snThuong) SanNhim.thuong(j.snThuong);
  // Vượt Ải tổ đội (may-chu/vuot-ai.js phòng): trạng thái phòng (kênh tức thời chưa mở), thưởng đám / xong ải + đồ rơi của quái chung (nằm đất ở
  // chỗ con chết — riêng mình), đội trưởng vừa báo danh cả đội -> vào ải
  if ("vaPhong" in j) VaDoi.capNhat(j.vaPhong);
  if (j.vaKq) {
    const r = j.vaKq;
    if (r.kn > 0) P.hud.msg(`Bạn nhận được ${fmtSo(r.kn)} điểm kinh nghiệm.`, MAU_TIN.kn, true);
    for (const t of r.tin || []) P.hud.msg(t);
    // anh 17/11: thưởng thêm mỗi ải Vượt Ải — dòng vàng ở kênh Khác (nhan: chỉ thẻ Khác, như dòng nhận kinh nghiệm) cho người đang trong ải
    for (const t of r.tinVa || []) P.hud.msg(String(t), [255, 213, 74], true);
    if (world) for (const m of r.nhan || []) if (world.zone.id === m.z) world.drop(m.x, m.y, { g: m.g, item: m });
  }
  if (j.vaDi) { for (const t of j.vaDi.tin || []) P.hud.msg(t); if (j.vaDi.di) diPld(j.vaDi.di); }
  // Viêm Đế Bảo Tàng (may-chu/viem-de.js phòng): như Vượt Ải tổ đội
  if ("vdPhong" in j) VdDoi.capNhat(j.vdPhong);
  if (j.vdKq) ViemDe.thuong(j.vdKq);
  if (j.vdDi) { for (const t of j.vdDi.tin || []) P.hud.msg(t); if (j.vdDi.di) diPld(j.vdDi.di); }
  // quái chung ở bãi train (may-chu/quai-chung.js nhanThuong): kinh nghiệm (người đánh nhiều nhất nhận trọn, người đánh phụ theo phần sát thương) +
  // món / tiền rơi ở chỗ con chết (riêng người nhận trọn)
  if (j.qcKq) {
    const r = j.qcKq;
    if (r.kn > 0) P.hud.msg(`Bạn nhận được ${fmtSo(r.kn)} điểm kinh nghiệm.`, MAU_TIN.kn, true);
    for (const t of r.tin || []) P.hud.msg(t);
    if (world) for (const m of r.nhan || []) if (world.zone.id === m.z) world.drop(m.x, m.y, { g: m.g, item: m });
    if (world) for (const o of r.roi || []) if (world.zone.id === o.z) world.drop(o.x, o.y, { g: o.g, gold: o.tien });
  }
  // Phong Hỏa Liên Thành (may-chu/phong-hoa.js nhanThuong): kinh nghiệm giết quái + thưởng thắng trận (câu riêng)
  if (j.phKq) {
    const r = j.phKq, kk = r.kn - (r.thang | 0);
    if (kk > 0) P.hud.msg(`Bạn nhận được ${fmtSo(kk)} điểm kinh nghiệm.`, MAU_TIN.kn, true);
    for (const t of r.tin || []) P.hud.msg(t, r.thang ? MAU_TIN.kn : undefined);
    if (world) for (const m of r.nhan || []) if (world.zone.id === m.z) world.drop(m.x, m.y, { g: m.g, item: m }); // rơi thêm (anh 04/11): nằm đất chỗ con chết
  }
  // luyện kỹ năng (anh 29/10 — may-chu/do.js luyen*): độ luyện + cấp các chiêu luyện (máy chủ quyết); vừa lên cấp: báo + tính lại chỉ số
  if (j.luyen) {
    hero.luyen = j.luyen.exp || {}; hero.skills = hero.skills || {};
    let doiCap = false;
    for (const [id, lv] of Object.entries(j.luyen.lv || {})) if ((hero.skills[id] | 0) !== lv) { hero.skills[id] = lv; doiCap = true; }
    if (doiCap) { if (world) world.refreshStats(false); skillHud(); if (GW) GW.refresh(true); }
  }
  for (const [id, cu, moi] of j.luyenLen || []) P.hud.msg(`${((P.skillDb[id] || {}).n || "Kỹ năng").trim()} luyện thành công: cấp ${cu} → ${moi}`, MAU_TIN.kn);
  // mua lại (lượt 88): giờ máy chủ lúc gửi -> lệch đồng hồ cho hạn 5 phút (windows.js dsMuaLai); không lưu vào nhân vật
  if (j.tui && "mlGio" in j.tui) { if (GW) GW.mlLech = (+j.tui.mlGio || Date.now()) - Date.now(); }
  if (j.tui) { Object.assign(hero, j.tui); delete hero.mlGio; bagMinus(pending.uong); syncRanged(hero); if (world) world.applyLooks(); skillHud(); } // đổi vũ khí: icon đòn thường ô T // thuốc uống mà chưa gửi: trừ lại
  if (j.nv) {
    const up = j.nv.lvl - (hero.lvl || 1);
    Object.assign(hero, j.nv);
    if (world && up > 0) world.levelUp(up);
    else if (world && up < 0) { fixPoints(hero); world.refreshStats(false); haChieu(); }
    ccKiem(); // anh 16/11 — Báo Đáp Ân Sư: Nhất Kỷ / Càn khôn (nv.ccKn) vừa thêm / hết -> tính lại chỉ số, bảng Võ công
  }
  const kq = j.kq;
  if (kq && kq.kn > 0) P.hud.msg(`Bạn nhận được ${fmtSo(kq.kn)} điểm kinh nghiệm.`, MAU_TIN.kn, true); // câu client MSG_GET_EXP (gộp các con của 1 nhịp)
  // tổ đội (may-chu/do.js chiaDoi): phần đồng đội giết chia cho + lên cấp thống soái
  if (j.chia && j.chia.kn > 0) P.hud.msg(`Bạn nhận được ${fmtSo(j.chia.kn)} điểm kinh nghiệm (tổ đội).`, MAU_TIN.kn, true);
  for (const t of (j.chia && j.chia.tin) || []) P.hud.msg(t);
  for (const t of j.mcTin || []) P.hud.msg(t); // nhiệm vụ Võ Lâm Minh Chủ: con quái nhiệm vụ đồng đội hạ giúp
  if (kq && kq.tin) for (const t of kq.tin) P.hud.msg(t); // Boss Sát thủ: xong nhiệm vụ, nhận Sát Thủ lệnh
  if (j.nv && world) datBossSat();
  if (kq) {
    const here = (i) => { const a = at && at[i]; return a && a[2] === world ? a : null; };
    for (const m of kq.nhan) { const a = here(m.i); if (a) world.drop(a[0], a[1], { g: m.g, item: m }); }
    for (const [i, g, id] of kq.roi || []) { const a = here(i); if (a) world.drop(a[0], a[1], { g: id, gold: g }); }
  }
  const n = j.nhat;
  if (n) {
    if (world) for (const m of n.nhan) if (m.hoi) world.hoiNgay(m.hoi); // bùa Phong Hỏa hồi ngay (may-chu/do.js nhatBua)
    for (const m of n.nhan) { if (m.tin) P.hud.msg(m.tin, MAU_TIN.do); else P.hud.msg([["Nhặt được "], [m.sl ? `${m.sl} ${m.n}` : m.n, mauMon(m)], [m.sl ? (m.con ? ` (còn ${m.con} bình trên đất)` : "") : m.d ? ` (${m.d} dòng)` : " (đồ trắng)"]]); if (world && !m.con) world.dropGone(m.g); }
    if (world) for (const g of n.du || []) world.dropBack(g);
    if ((n.du || []).length) P.hud.msg(`Đã mang đủ ${luat().mang || 60} bình thuốc (mọi loại) — thuốc còn lại vẫn nằm trên đất`);
    if (world) { for (const g of n.mat) world.dropGone(g); for (const g of n.day) world.dropBack(g); }
    if (n.day.length) P.hud.msg("Hành trang đã đầy — đồ vẫn nằm trên đất, dọn túi rồi bấm vào đồ để nhặt", MAU_TIN.do);
    if (world) for (const g of n.vang) world.dropGone(g);
    if (n.tien && world) world.text(world.player, `+${n.tien} lượng`, "#ffe680");
    if (n.tien) P.hud.msg(`Bạn nhận được ${fmtSo(n.tien)} lượng bạc!`, MAU_TIN.tien, true); // câu client MSG_EARN_MONEY
  }
  if (j.vut && world) world.drop(j.vut.x, j.vut.y, { g: j.vut.g, chung: 1, item: j.vut }); // món vứt ra: chung cả bãi (người khác nhặt thì nhịp bỏ đi)
  // độ bền: câu client — về 0: G_STR_ITEM_ABRADETOZERO (bản VNG: món tổn hại, không dùng được tới khi sửa); còn ≤ 5: MSG_ITEM_NEARLY_DAMAGED
  if (j.hao) {
    for (const n of j.hao.hong) P.hud.msg(`${n} đã tổn hại, không thể tiếp tục sử dụng — sửa ở cửa hàng (nút Sửa)`);
    for (const n of j.hao.sap) P.hud.msg(`Những thứ bạn trang bị ${n} đã sắp bị hao mòn, xin kịp thời xử lý`);
  }
  if (j.phat) P.hud.msg(`Bạn đã trọng thương: mất ${fmtN(j.phat.exp)} kinh nghiệm${j.phat.gold ? `, ${fmtMoney(j.phat.gold)}` : ""}`);
  if (j.uyThac) baoUyThac(j.uyThac);
  if (j.hang !== undefined) hangCap = j.hang;
  // sách / điểm từ vật phẩm Kỳ Trân Các (máy chủ giữ): nâng chiêu tới cấp tối thiểu, tính lại điểm chưa dùng
  // anh 16/11 — chỉ nhận đối tượng sách / điểm (api.js knCua): kn là SỐ (kinh nghiệm vừa nhận — Báo Đáp Ân Sư / hương bao) thì bỏ qua (đọc K.skMin của số -> lỗi, mất books)
  if (j.kn && typeof j.kn === "object") {
    const K = j.kn; Object.assign(hero, { books: K.books, skMin: K.skMin, kyNangThem: K.kyNangThem, tiemNangThem: K.tiemNangThem, mt: K.mt, tt: K.tt });
    hero.skills = hero.skills || {}; for (const [id, m] of Object.entries(K.skMin)) if ((hero.skills[id] | 0) < m) hero.skills[id] = m;
    hero.pts = null; hero.skPts = null; fixPoints(hero); if (world) world.refreshStats(false); skillHud(); save();
  }
  if (j.buff) { const cu = buffChiSo(hero.buff); hero.buff = j.buff; buffLuc = performance.now(); if (world && buffChiSo(j.buff) !== cu) world.refreshStats(false); } // trạng thái vật phẩm còn bao nhiêu giây (máy chủ — may-chu/do.js buffCon) // ô Hạng dải trên (thứ tự cấp trong máy chủ)
  // chợ trời (may-chu/cho-troi.js): sạp của mình (vừa định giá / thu hồi / mở / có người mua) + câu báo người bán
  if (j.sap && !(hero.sap && (hero.sap.v | 0) > (j.sap.v | 0))) hero.sap = j.sap; // bản cũ về muộn (2 việc liền nhau): bỏ
  for (const t of j.choTin || []) baoChoTin(t);
  if (j.tui || j.nv || j.sap) { if (Net.me) Net.me.nv[hero.slot | 0] = JSON.parse(JSON.stringify(hero)); if (GW) { GW.refresh(true); if (j.sap) GW.cho.ve(); } }
  // quà quản trị gửi (bảng quản trị — may-chu/quan-tri.js): túi / tiền đã cập nhật ở trên; báo ở khung tin + khung báo của client
  // he: quà hệ thống còn chờ vì túi đầy (boss vắng mặt, vượt ải, sự kiện — anh 16/11) — câu báo riêng, không phải "quà từ quản trị"
  const quaQt = (j.qua || []).filter((q) => !q.he), quaHe = (j.qua || []).filter((q) => q.he);
  if (quaQt.length) {
    for (const q of quaQt) P.hud.msg(`Quản trị gửi quà: ${q.ds.join(", ")}${q.loi ? ` — "${q.loi}"` : ""}`, MAU_TIN.tien);
    if (GW) GW.bao(`<color=yellow>Bạn nhận được quà từ quản trị<color>${quaQt.map((q) => `<enter>${q.ds.join(", ")}${q.loi ? `<enter>"${q.loi}"` : ""}`).join("")}`);
  }
  for (const q of quaHe) P.hud.msg(`Nhận phần thưởng còn chờ: ${q.ds.join(", ")}${q.loi ? ` — ${q.loi}` : ""}`, MAU_TIN.tien);
  // quản trị vừa đổi nhân vật (may-chu/quan-tri.js — anh 04/11): câu báo (cấp mới đã nhận ở j.nv); giải kẹt: về Ba Lăng ngay
  for (const t of j.qtTin || []) P.hud.msg(t, MAU_TIN.tien);
  if (j.qtDi) { P.hud.msg(j.qtDi.tin || "Quản trị đã đưa bạn về Ba Lăng", MAU_TIN.tien); diPld({ z: j.qtDi.z }); }
  // khu vực bang (đợt 4 — máy chủ khu-bang.js nhip): không còn được ở khu (rời / bị đuổi / bang giải tán / đổi lãnh địa / khu đóng) -> đi; đang tải sang bãi không phải bãi bang
  // (hoặc đang tải đúng bãi phải tới) thì bỏ qua. Đang tải VÀO bãi bang (nhịp lúc tải báo bãi đang tới — máy chủ đã xét): tải xong rồi đi (diPld chờ zoneLoad), không đợi lần gửi lại
  if (j.kbDi) {
    const d = j.kbDi, toiZ = zoneLoad && zoneToi != null ? P.maps.zones.find((x) => x.id === zoneToi) : null;
    if (d.khu) khuDl = d.khu;
    if (toiZ ? toiZ.bang && toiZ.id !== d.z : world && world.zone.bang) { if (d.tin) P.hud.msg(d.tin, MAU_TIN.tien); diPld({ z: d.z, ...(Array.isArray(d.at) ? { at: d.at } : {}) }); }
  }
  for (const t of j.onlBao || []) P.hud.msg(t, MAU_TIN.tien); // Online nhận thưởng: vừa đủ mốc giờ (may-chu/online.js)
  // Bảo rương đồ xanh chờ nhận vừa vào túi / túi đầy (may-chu/do.js nhanRuongCho — anh 04/11)
  for (const t of j.rxBao || []) P.hud.msg(t, MAU_TIN.tien);
  for (const t of j.kbhMo || []) P.hud.msg(t, MAU_TIN.tien); // khóa bảo hiểm có hạn vừa hết giờ (may-chu/do.js KBH_TAM — anh 11/11): túi mới đã ở j.tui
  if (j.pqBao) P.hud.msg(j.pqBao, MAU_TIN.tien); // Phú Quý Cẩm Hạp: đợt vừa quay có số trúng chưa nhận (may-chu/phu-quy.js bao)
  for (const t of j.bcTin || []) P.hud.msg(t, MAU_TIN.tien); // Bầu Cua: tiền thắng đã vào túi (may-chu/bau-cua.js — cả ván lúc đã thoát game)
  // tin riêng của GM (anh 10/11 "gửi tn trực tiếp qua bảng GM" — may-chu/quan-tri.js xu-ly nhan): dòng kênh Mật + khung báo giữa màn hình
  // có người nhập sai mật khẩu (cấp 2 / đăng nhập lúc đổi) ở phiên trước (may-chu/bao-mat.js baoSai — anh 10/11): báo chủ tài khoản ở lần vào sau
  if (j.mk2Bao) {
    const b = j.mk2Bao, t = `Có người nhập sai mật khẩu ${b.n | 0} lần, gần nhất lúc ${gioNgay(b.luc)} · IP ${b.ip || "?"}. Không phải bạn thì đổi mật khẩu đăng nhập ngay (bấm ổ khóa an toàn).`;
    P.hud.canh(t); if (GW) GW.bao(`<color=red>Cảnh báo bảo mật<color>: ${t}`);
  }
  if (Array.isArray(j.gmTin) && j.gmTin.length) {
    for (const m of j.gmTin) P.hud.chat("PRIVATE", "GM", String(m.t || ""));
    // chữ GM để nguyên — GW.bao (hoi) tự richText 1 lần (soát 11/11: trước richText 2 lần -> lần sau chuyển mã HTML của lần trước, hiện "&lt;span…", "&amp;")
    if (GW) GW.bao(j.gmTin.map((m) => `<color=yellow>Tin của GM<color>: ${String(m.t || "")}`).join("<enter>"));
  }
  // Phân Thân (may-chu/phan-than.js — anh 05/11): giờ còn lại / phân thân đang theo (khác phiên bản thì tải đầy đủ), câu báo (hết giờ, tiền công)
  if (j.pt && PT) PT.nhip(j.pt);
  for (const t of j.ptTin || []) P.hud.msg(t, MAU_TIN.tien);
  for (const t of j.tkMat || []) P.hud.msg(t, MAU_TIN.tien); // thuốc Tống Kim mất khi rời trận / hết trận (may-chu/tong-kim.js boThuocTk — túi mới đã ở j.tui)
  // Tống Kim trận thật (anh 06/11 — may-chu/tong-kim.js ketThuc ghi h.tkTin, nhịp gửi như quà quản trị): thưởng cuối trận — câu báo + khung báo của client
  // còn ở chiến trường (bảng kết quả Chiến báo đang mở — tkchienbao.js): chỉ in dòng tin, không mở khung báo đè lên bảng (thử 06/11: khung báo mở cùng lúc
  // bảng kết quả, che mất một phần). Dòng thưởng chỉ in ở đây (Chiến báo không in thưởng — khỏi lặp 2 lần)
  if (Array.isArray(j.tkTin) && j.tkTin.length) {
    const L = j.tkTin.map((t) => (typeof t === "string" ? t : t && (t.tin || t.t || t.text)) || "").filter(Boolean);
    for (const t of L) P.hud.msg(t.replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW && L.length && !TongKim.laTo()) GW.bao(`<color=yellow>Tống Kim — thưởng cuối trận<color>${L.map((t) => `<enter>${t}`).join("")}`);
  }
  // Lôi đài (anh 15/11 — may-chu/loi-dai.js nhip): đứng ở vùng lôi đài mà không còn tên ở sân nào -> về chỗ máy chủ đưa (đang tải bản đồ thì thôi — máy chủ gửi lại sau 5
  // giây nếu còn); câu báo riêng (hoàn phí… — tiền mới đã ở j.nv). Chỗ về đã biết của sân này trước (LoiDai.veCho — soát 16/11: máy chủ vừa khởi động lại trả mặc định Ba Lăng)
  if ("ttMoi" in j) ttMoiVe(j.ttMoi); // tỉ thí (anh 17/11): chiến thư đang chờ mình trả lời (nhịp — dự phòng kênh tức thời)
  if (j.ttVao) ttVaoSan(j.ttVao); // sân tỉ thí mình (người thách) chưa vào
  if (j.ldDi && world && laLd(world.zone) && !zoneLoad) ldVe(LoiDai.veCho || j.ldDi, "Lôi đài: bạn không còn tên ở sân này — mời về.");
  for (const t of Array.isArray(j.ldTin) ? j.ldTin : []) P.hud.msg(String(t).replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
  // đua ngựa (anh 16/11 — may-chu/dua-ngua.js nhip): đứng ở đường đua mà không còn lượt của mình -> về Ba Lăng (đang tải bản đồ thì thôi — máy chủ gửi lại sau 5 giây)
  if (j.dnDi && world && laDn(world.zone) && !zoneLoad) dnVe(j.dnDi, "Đường đua: bạn không còn tên trong lượt đua nào — mời về Ba Lăng huyện.");
}
// Nhận thưởng (nút cột icon phải / bảng Giang hồ điện thoại — anh 30/10 "gom các loại thưởng vào đây"): khung Say chọn Đăng nhập nhận thưởng
// hoặc Online nhận thưởng (anh 31/10 khuya — tích lũy online mốc 1 / 2 / 3 giờ). Khung Đăng nhập đang mở thì bấm lại = đóng như trước
function nhanThuong() {
  if (!hero || !NPCD) return;
  if (GW && GW.W.get("loginprize") && GW.W.get("loginprize").visible) return GW.openLoginPrize();
  const co = (k) => TEN_THUONG[k] + (thuongCho.includes(k) ? " <color=green>(có thể nhận)<color>" : ""); // mục còn quà chờ nhận (capNhatThuong)
  NPCD.choose("msgsel", "InfoText", richText("Đại hiệp, xin hãy chọn phần thưởng:", hero.name),
    [[co("dn"), () => GW.openLoginPrize()], [co("cap"), () => thuongCap({ viec: "mo" })], [co("onl"), () => thuongOnline({ viec: "mo" })], [co("pd"), () => phucDuyen({ viec: "mo" })], ["Kết thúc", null]]);
}
// Phúc duyên (anh 31/10 khuya lần 2 — may-chu/phuc-duyen.js, lời Võ Lâm Minh Truyền Nhân của client): say / talk / tin như Online nhận thưởng;
// shop: 93 = mở cửa hàng Thần bí Thương Nhân Liễu Ất (giá điểm phúc duyên — windows.js openShop(93, "pd"))
function phucDuyen(b) {
  if (!hero) return;
  Net.phucDuyen(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(t.replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW) GW.refresh(true);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name), j.say.opts.map(([nhan, viec]) => [nhan, viec ? () => phucDuyen({ viec }) : null]));
    if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name)), 0, () => phucDuyen({ viec: "mo" }));
    if (j.shop && GW) { if (NPCD.close) NPCD.close(); GW.openShop(j.shop, "pd"); P.hud.msg(`Thần bí Thương Nhân Liễu Ất: điểm phúc duyên hiện có ${j.diem | 0}`, MAU_TIN.tien); }
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// Phú Quý Cẩm Hạp — Thần Tài Biện Kinh (anh 03/11 — may-chu/phu-quy.js, câu theo script máy chủ fuguijinhe.lua): say { text, opts: [[nhãn, việc,
// số hộp mua]] } / talk (xong quay lại khung) / tin — như Phúc duyên
function phuQuy(b) {
  if (!hero) return;
  Net.phuQuy(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(t.replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW) GW.refresh(true);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, "Thần Tài"), j.say.opts.map(([nhan, viec, n]) => [nhan, viec ? () => phuQuy({ viec, n }) : null]));
    if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, "Thần Tài")), 0, () => phuQuy({ viec: "mo" }));
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// Nhiệm vụ Võ Lâm Minh Chủ hằng ngày (anh 03/11 — may-chu/minh-chu.js, câu theo script máy chủ activitysys\config\32): Hắc Bạch Sứ Giả (Biện Kinh,
// Ba Lăng — NPC cờ mc "su") / người nhận thư (Tiểu Chiêu, Phụng Phụng — mc "thu": b.ai = tên): say / talk / tin như Phú Quý; nói hết câu với sứ
// giả thì quay lại khung đầu
function minhChu(b, ten = "Hắc Bạch Sứ Giả") {
  if (!hero) return;
  Net.minhChu(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(t, MAU_TIN.tien);
    if (GW) GW.refresh(true);
    const tiep = (viec) => minhChu({ viec, ...(b.ai ? { ai: b.ai } : {}) }, ten);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, ten), j.say.opts.map(([nhan, viec]) => [nhan, viec ? () => tiep(viec) : null]));
    if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, ten)), 0, b.ai ? null : () => minhChu({ viec: "mo" }));
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// Hái cây (nhiệm vụ thu thập — gatherobj.lua): hỏi máy chủ hái được không -> thanh "Đang thu thập" (khung client progressbar.ini — windows.js
// tienDo) haiGiay giây; đi / đánh / bị đánh / chết là hỏng (progressconfig.txt dòng 1: EVENT_MOVE, EVENT_ATTACK, EVENT_ATTACKED, EVENT_DEATH…);
// đủ giờ -> máy chủ phát 1 cây; cây vừa hái ẩn cd giây (máy chủ cũng chặn hái lại)
let haiDang = null;
function haiCay(n) {
  if (!hero || !world || haiDang || !GW) return;
  const id = n.mc.cay;
  haiDang = { id };
  const p0 = world.player; p0.target = null; if (p0.act === "attack") world.setAct(p0, "stand"); // hái: thôi đánh mục tiêu cũ (vừa hạ quái canh)
  Net.minhChu(hero.slot | 0, { viec: "haiBat", cay: id }).then((j) => {
    const w = world, p = w && w.player;
    if (!p) { haiDang = null; return; }
    const x0 = p.x, y0 = p.y, hp0 = p.hp, t0 = performance.now(), ms = (j.haiGiay || 3) * 1000;
    let tm = 0;
    const het = (ok) => { clearInterval(tm); haiDang = null; GW.tienDo(null); if (!ok) P.hud.msg("Thu thập bị gián đoạn"); };
    GW.tienDo("Đang thu thập", 0);
    tm = setInterval(() => {
      const q = world && world.player;
      if (world !== w || !q || q.hp <= 0 || q.hp < hp0 || q.path || q.goal || Math.hypot(q.x - x0, q.y - y0) > 4 || /attack|magic/.test(q.act || "")) return het(false);
      const k = (performance.now() - t0) / ms;
      GW.tienDo("Đang thu thập", Math.min(1, k));
      if (k < 1) return;
      het(true);
      Net.minhChu(hero.slot | 0, { viec: "hai", cay: id }).then((r) => { applyServer(r); if (r.msg) P.hud.msg(r.msg, MAU_TIN.tien); if (GW) GW.refresh(true); anCay(w, id, r.cd); })
        .catch((e) => { if (e.ma !== "het-phien") P.hud.canh(e.message); });
    }, 50);
  }).catch((e) => { haiDang = null; if (e.ma !== "het-phien") P.hud.canh(e.message); });
}
// cây vừa hái: bỏ khỏi bãi giay giây rồi trả lại (như gatherobj.lua KillNpcWithIdx — cây mọc lại)
function anCay(w, id, giay) {
  const i = w.npcs.findIndex((q) => q.mc && q.mc.cay === id); if (i < 0) return;
  const n = w.npcs[i]; w.npcs.splice(i, 1);
  setTimeout(() => { if (world === w && !w.npcs.includes(n)) w.npcs.push(n); }, (giay || 60) * 1000);
}
// Thưởng thăng cấp (anh 02/11 — may-chu/thuong-cap.js): như Online nhận thưởng — say / talk (các trang mốc, xong quay lại khung) / tin
function thuongCap(b) {
  if (!hero) return;
  Net.thuongCap(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(t.replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW) GW.refresh(true);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name), j.say.opts.map(([nhan, viec]) => [nhan, viec ? () => thuongCap({ viec }) : null]));
    if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name)), 0, () => thuongCap({ viec: "mo" }));
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// Online nhận thưởng: máy chủ trả say { text, opts: [[nhãn, việc]] } | talk [câu] (xong quay lại khung), tin = câu báo khung tin
function thuongOnline(b) {
  if (!hero) return;
  Net.thuongOnline(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(t.replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW) GW.refresh(true);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name), j.say.opts.map(([nhan, viec]) => [nhan, viec ? () => thuongOnline({ viec }) : null]));
    if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name)), 0, () => thuongOnline({ viec: "mo" }));
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// Ủy thác (27/10 — may-chu/do.js): máy chủ vừa cày thay lúc vắng mặt -> bảng tổng kết trong khung hội thoại của client (khung Say)
const gioPhut = (s) => { const g = Math.floor(s / 3600), p = Math.floor((s % 3600) / 60); return g ? `${g} giờ${p ? ` ${p} phút` : ""}` : `${p} phút`; };
// Gọn trong 6 dòng của ô lời khung Say (377 × 96, chữ 14 — ~53 ký tự / dòng; anh 27/10 "giao diện kết thúc ủy thác hơi lỏ": bản đầu liệt kê
// từng món, tràn đè nút Đóng): đồ giữ lại gộp theo số dòng; tên từng món + số bán / bỏ qua đưa xuống khung tin hệ thống.
function baoUyThac(k) {
  const Y = (t) => `<color=Yellow>${t}<color>`, L = [], tien = fmtMoney(k.tien + k.banTien);
  L.push(`Trợ Thủ ủy thác ${Y(gioPhut(k.giay))} ở ${Y(k.bai)}${k.vang - k.giay >= 60 ? ` (vắng ${gioPhut(k.vang)})` : ""}.`);
  if (!k.giay) L.push(k.thieuBch ? "Không còn giờ Bạch Câu Hoàn — ủy thác cần Bạch Câu Hoàn (Kỳ Trân Các: Bạch Câu Hoàn Đặc Biệt, 8 giờ mỗi viên)." : `Hôm nay đã dùng hết ${luat().uyThac ? luat().uyThac.gioNgay : 12} giờ ủy thác — 0 giờ ngày mai tính lại.`);
  else {
    const dacBiet = [k.ta ? `${fmtN(k.ta)} tinh anh` : "", k.trum ? `${fmtN(k.trum)} thủ lĩnh` : ""].filter(Boolean).join(", ");
    L.push(`Giết ${Y(fmtN(k.quai))} quái${dacBiet ? ` (${dacBiet})` : ""} · ${fmtN(k.toc)}/giờ × ${Math.round(k.tiLe * 100)} %`);
    L.push(`Kinh nghiệm ${Y("+" + fmtN(k.kn))}${k.len ? ` · lên ${k.len} cấp` : ""}`);
    L.push(`Ngân lượng ${Y("+" + tien)}${k.ban + k.day ? ` (bán ${fmtN(k.ban + k.day)} món)` : ""}`);
    const D = k.giuD || k.giu.reduce((o, x) => ((o[x.d] = (o[x.d] || 0) + 1), o), {});
    const nhom = Object.entries(D).sort((a, b) => b[0] - a[0]).map(([d, n]) => `${+d ? d + " dòng" : "trắng"}: ${n}`).join(" · ");
    L.push(k.giuN ? `Giữ lại ${Y(k.giuN + " món")} — ${nhom}` : "Không giữ lại món nào");
  }
  L.push(`Hôm nay còn ${gioPhut(k.conGiay)} ủy thác · Bạch Câu Hoàn còn ${gioPhut(k.bch || 0)}${k.thieuBch && k.giay ? " (hết giữa chừng)" : ""}.`);
  // kênh Khác của khung chat: đủ báo cáo đợt ủy thác (anh 13/11 tối "hiển thị thêm ở kênh khác full thông tin đợt ủy thác vừa rồi") — xem lại lúc nào cũng được
  P.hud.msg(`—— Ủy thác vừa rồi (${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}) ——`, MAU_TIN.tien);
  for (const t of L) P.hud.msg(t.replace(/<color=?\w*>/g, ""));
  const DB = Object.entries(k.dacBiet || {}); // đồ chí, mật đồ, Thủy Tinh … (máy chủ nhặt luôn)
  if (DB.length) P.hud.msg(`Ủy thác nhặt được: ${DB.map(([n, c]) => `${c} ${n}`).join(", ")}`);
  if (k.giuN) P.hud.msg(`Đồ ủy thác giữ lại: ${k.giu.map((x) => `${x.n}${x.d ? ` (${x.d} dòng)` : ""}`).join(", ")}${k.giuN > k.giu.length ? ` … (${k.giuN} món)` : ""}`);
  if (k.ban + k.day || k.bo) P.hud.msg(`Ủy thác: bán ${fmtN(k.ban + k.day)} món được ${fmtMoney(k.banTien)}${k.day ? ` (${k.day} món vì túi đầy)` : ""}${k.bo ? ` · bỏ qua ${fmtN(k.bo)} món (bộ lọc nhặt)` : ""}`);
  // bảng giữ tới khi bấm "Đã xem" (anh 13/11 tối "lần sau log game bắt buộc phải hiện"): bị đóng giữa chừng (đổi bản đồ — loadZone đóng khung NPC, Trợ Thủ đi Xa
  // phu, khung khác đè) thì hienUyThac hiện lại sau nhịp kế, tối đa 4 lần
  utXem = { html: richText(L.join("<enter>"), hero.name), lan: 0 };
  hienUyThac();
}
let utXem = null;
function hienUyThac() {
  if (!utXem || !NPCD || !world || zoneLoad || utXem.lan >= 4) return;
  const m = P.win.get("msgsel"), i2 = P.win.get("info2");
  if ((m && m.visible) || (i2 && i2.visible)) return; // đang có khung thoại khác (hoặc bảng này đang mở): chờ
  utXem.lan++;
  NPCD.choose("msgsel", "InfoText", utXem.html, [["Đã xem", () => { utXem = null; }]]);
}
// ---------- Ủy thác bằng nút (anh 11/11 — người chơi rối vì ủy thác chỉ chạy khi "đang tự đánh ở bãi mà thoát game": "cho thêm chỗ bấm ủy thác
// trong bảng cài đặt này, để người chơi đỡ rối"): Esc → Ủy thác (windows.js _system), Trợ Thủ → Đánh quái → nút Ủy thác. Máy chủ không đổi: vẫn
// ủy thác khi nhân vật vắng mặt mà nhịp cuối đang tự đánh ở bãi (may-chu/do.js uyThacDo / uyThacVe).
//   - đứng ở bãi luyện công: bật tự đánh, chờ 2 nhịp báo máy chủ (nhịp thứ 2 chắc chắn gửi sau lúc bật) rồi về màn chọn nhân vật (leaveGame);
//     màn chọn nhân vật ghi dòng "đang ủy thác" (localStorage UT_KEY, theo tài khoản) tới lúc vào lại nhân vật đó
//   - ở thôn / thành: bật tự đánh = Trợ Thủ đi Xa phu ra bãi treo máy (tuVeBai); tới bãi đủ 2 nhịp thì tự ủy thác như trên (utCho — tắt tự
//     đánh hoặc quá 10 phút thì thôi)
//   - hết giờ Bạch Câu Hoàn / hết giờ trong ngày: báo lý do, không có nút ủy thác (máy chủ cũng không cày)
let nhipXong = 0, utDi = null, utCho = null;
const UT_KEY = "vl_uyThac", UT_CHO = 10 * 60e3;
function moUyThac(daTai) {
  if (!world || !hero || !NPCD) return;
  if (daTai !== true && HD && !HD.L) return void HD.taiLich().then(() => moUyThac(true)); // lịch hoạt động chưa tải (mới vào game < 60 giây): tải 1 lần để biết giờ ủy thác còn hôm nay
  const w = world, U = luat().uyThac || {}, Y = (t) => `<color=Yellow>${t}<color>`, bch = hero.bch | 0;
  const toi = HD && HD.L && HD.L.toi ? HD.L.toi.uyThac : null, con = Array.isArray(toi) ? Math.max(0, toi[1] - toi[0]) : null; // giờ ủy thác còn hôm nay (lịch hoạt động)
  const oBai = FARM_KINDS.has(w.zone.kind) && !zoneLoad, b = oBai ? null : baiTreo(), z = b && P.maps.zones.find((x) => x.id === b.z), O = [];
  // gọn trong 6 dòng của ô lời khung Say (~53 ký tự / dòng — như baoUyThac): dài hơn thì client chia trang ("Trang kế"), nút lựa chọn bị đẩy sang trang sau
  const L = ["Ủy thác: rời game — máy chủ đánh quái thay bạn.", `Tốc độ ${Y(Math.round((U.tiLe || 0.7) * 100) + " %")} lúc tự đánh · tối đa ${U.gioNgay || 12} giờ / ngày.`,
    `Bạch Câu Hoàn còn ${Y(bch ? gioPhut(bch) : "0 giờ")}${con != null ? ` · hôm nay còn ${Y(con + " giờ")}` : ""}.`];
  if (!bch) { L.push("Cần Bạch Câu Hoàn Đặc Biệt: 8 giờ ủy thác mỗi viên."); O.push(["Mở Kỳ Trân Các", () => { if (GW && !GW.W.get("market").visible) GW.toggle("Market"); }]); }
  else if (con === 0) L.push("Hôm nay đã hết giờ ủy thác — 0 giờ đêm nay tính lại.");
  else if (oBai) { L.push(`Bãi ${Y(w.zone.n + (w.chung ? " (quái chung)" : ""))} — vào lại để xem bảng tổng kết.`); O.push(["Ủy thác ngay (rời game)", uyThacNgay]); }
  else if (TOWN_KINDS.has(w.zone.kind) && z) { L.push(`Trợ Thủ đưa bạn ra ${Y(z.n)} rồi tự ủy thác.`); O.push(["Ra bãi rồi tự ủy thác", utRaBai]); }
  else L.push("Phải ra bãi luyện công mới ủy thác được.");
  if (utCho) O.unshift(["Thôi tự ủy thác", () => { utCho = null; P.hud.msg("Ủy thác: đã thôi — vẫn tự đánh như thường"); }]);
  O.push(["Để sau", null]);
  NPCD.choose("msgsel", "InfoText", richText(L.join("<enter>"), hero.name), O);
}
function uyThacNgay() {
  const w = world;
  if (!w || !hero || !FARM_KINDS.has(w.zone.kind) || zoneLoad) return P.hud.canh("Ủy thác: phải đứng ở bãi luyện công");
  if (!w.auto) toggleAuto(true); // đứng ở bãi rồi: chỉ bật, không đi đâu
  utCho = null; const d = (utDi = { moc: nhipXong, w });
  P.hud.msg(`Ủy thác ở ${w.zone.n}: đang báo máy chủ…`);
  setTimeout(() => { if (utDi === d) { utDi = null; P.hud.canh("Ủy thác: chưa báo được máy chủ (mạng chậm?) — thử lại Esc → Ủy thác"); } }, 8000);
}
function utRaBai() {
  const w = world; if (!w || !hero) return;
  utCho = { t0: performance.now(), toi: null };
  if (!w.auto) toggleAuto(true); // bật tự đánh, chưa đi — đi ở dưới
  if (!thanh && !diXe) tuVeBai(true); // ở thôn / thành: Trợ Thủ đi Xa phu ra bãi treo máy — đứng cạnh mộc nhân Ba Lăng cũng đi (bấm ủy thác là muốn ra bãi)
  P.hud.msg("Ủy thác: Trợ Thủ đưa ra bãi luyện công, tới nơi tự ủy thác — tắt tự đánh để thôi");
}
// sau mỗi nhịp thành công: đang chờ báo máy chủ (utDi) / đang chờ ra tới bãi (utCho)
function utSauNhip() {
  const w = world;
  if (utDi) {
    const d = utDi;
    if (w !== d.w || !hero || zoneLoad) { utDi = null; return P.hud.canh("Ủy thác: đã rời bãi — chưa ủy thác"); }
    if (!w.auto) { utDi = null; return P.hud.canh("Ủy thác: đã tắt tự đánh — chưa ủy thác"); }
    if (nhipXong >= d.moc + 2) { utDi = null; setTimeout(() => utRoi(w), 0); }
    return;
  }
  if (!utCho) return;
  if (!w || !hero) { utCho = null; return; }
  if (!w.auto || performance.now() - utCho.t0 > UT_CHO) { utCho = null; return P.hud.msg("Ủy thác: thôi chờ ra bãi (đã tắt tự đánh hoặc quá 10 phút)"); }
  if (!FARM_KINDS.has(w.zone.kind) || zoneLoad) { utCho.toi = null; return; }
  if (utCho.toi == null) { utCho.toi = nhipXong; P.hud.msg(`Đã tới ${w.zone.n} — ủy thác (rời game)…`); }
  else if (nhipXong >= utCho.toi + 2) { utCho = null; setTimeout(() => utRoi(w), 0); }
}
function utRoi(w) {
  if (w !== world || !hero || !w.auto || !Net.me) return;
  try { const M = JSON.parse(localStorage.getItem(UT_KEY) || "{}"); M[Net.me.ten] = { o: hero.slot | 0, ten: hero.name, bai: w.zone.n + (w.chung ? " (quái chung)" : ""), luc: Date.now() }; localStorage.setItem(UT_KEY, JSON.stringify(M)); } catch {}
  leaveGame();
}
// màn chọn nhân vật: nhân vật ô o vừa bấm ủy thác (utRoi) -> { o, ten, bai, luc } | null; utXoa: vào lại nhân vật đó thì bỏ dòng nhắc
function utDang(o, h) { try { const x = Net.me && JSON.parse(localStorage.getItem(UT_KEY) || "{}")[Net.me.ten]; return x && x.o === o && h && x.ten === h.name ? x : null; } catch { return null; } }
function utXoa() { try { const M = JSON.parse(localStorage.getItem(UT_KEY) || "{}"); if (Net.me && M[Net.me.ten]) { delete M[Net.me.ten]; localStorage.setItem(UT_KEY, JSON.stringify(M)); } } catch {} }
// ---------- Dã Tẩu (anh 27/10: "làm dã tẩu, tham khảo client") — luật ở máy chủ (may-chu/da-tau.js, theo script client seasonnpc.lua) ----------
// ---------- Phong Lăng Độ (anh 27/10 — may-chu/phong-lang-do.js, assets/data/phong-lang-do.json — cong-cu/dung-phong-lang-do.mjs) ----------
// Bản đồ 336 dựng nguyên 2 bờ (sông chặn giữa — lưới vật cản client): bờ Nam = bãi 336 (Xa phu thả ở chỗ waypoint của client), bờ Bắc = bãi
// 3360 (chiThuyen — chỉ tới bằng thuyền, kinh nghiệm +20 % máy chủ tính). Thuyền phu bờ Nam (script south_boatman*.lua): báo danh giờ chẵn
// 10 phút, vé qua khung Giao vật phẩm -> thuyền 337–339 (bãi "thuyền"). Trên thuyền mỗi người đánh quái của mình: đếm giờ theo lịch máy chủ
// (pldTick) — phút baoDanh thuyền chạy, sinh thuyTac Thủy tặc; các phút dauLinh mỗi lần 1 Thủy tặc đầu lĩnh; phút capBo hỏi máy chủ cập bờ ->
// bờ Bắc. Câu báo của fld_smalltimer.lua / mission.lua. Thuyền + bờ Bắc không dùng Thổ Địa Phù; Thuyền phu bờ Bắc đưa về bờ Nam (200 lượng).
const laThuyen = (z) => !!z && z.kind === "thuyền";
const laAi = (z) => !!z && z.kind === "ải"; // Vượt Ải (bãi 464 sơ cấp / 480 cao cấp — cong-cu/dung-vuot-ai.mjs)
const laDao = (z) => !!z && z.kind === "đảo"; // Đảo Tẩy Tủy (bản đồ 242 — cong-cu/dung-tay-tuy.mjs)
const laTk = (z) => laZoneTk(z); // chiến trường Tống Kim 380 (kind "tongkim" — chỉ vào qua Mộ binh quan Biện Kinh; tongkim.js)
const vaoDuoc = (z) => (z.bang || laPh(z) || laTk(z) || laLd(z) || laDn(z) ? false : laVd(z) ? !!(hero.vd && hero.vd.dang && !hero.vd.dang.ket) : laAi(z) ? !!(hero.va && hero.va.dang && !hero.va.dang.ket && P.maps.zones.some((x) => x.id === z.id && x.cap === hero.va.dang.cap)) : z.chiThuyen ? !!(hero.pld && hero.pld.bac) : !laThuyen(z));
const camPhu = () => !!(hero.pld && (hero.pld.bac || hero.pld.chuyen)) || (!!world && (laThuyen(world.zone) || !!world.zone.chiThuyen || laAi(world.zone) || laVd(world.zone) || laDao(world.zone) || laTk(world.zone) || laLd(world.zone) || laDn(world.zone))); // Tống Kim: rời trận ở Quân y hậu doanh; lôi đài: nút Rời sân; đường đua: bấm thanh đua
// chỗ vào bãi khi không có chỗ đứng sẵn: bờ Nam = chỗ Xa phu thả; bờ Bắc = chỗ cập bờ của bến; thuyền = 1 điểm ngẫu nhiên trên thuyền
function diemVao(z) {
  if (z.bang && Array.isArray(z.vao)) return z.vao; // khu vực bang (đợt 4): điểm vào client aMapEnterPosDef
  if (laAi(z)) return P.vuotAi ? P.vuotAi.vao : null;
  if (laDao(z)) return P.tayTuy ? P.tayTuy.vao : null;
  const D = P.pld; if (!D) return null;
  if (z.id === D.nam) return D.vao;
  if (z.id === D.bac) return D.doBo[(((hero.pld && hero.pld.ben) || 1) - 1) % D.doBo.length];
  if (laThuyen(z)) return D.thuyen[Math.floor(Math.random() * D.thuyen.length)] || null;
  return null;
}
// điểm đặt quái của bãi trên bản đồ dựng nguyên (assets/data/mapnpcs.json maps[mã client].mobs — quái của bãi), px bản đồ web
const DIEM = new Map();
function diemQuai(zone) {
  if (DIEM.has(zone.id)) return DIEM.get(zone.id);
  const m = P.maps.maps[zone.map], c = m && m.tiles && m.client, L = c && P.mapNpcs && P.mapNpcs.maps[c.id], s = P.maps.scale;
  const ids = new Set([...(zone.m || []), zone.boss]), out = L && L.mobs ? L.mobs.filter((q) => ids.has(q[0])).map(([, x, y]) => [(x - c.region[0] * 512) * s, ((y - c.region[1] * 1024) / 2) * s]) : null;
  DIEM.set(zone.id, out && out.length ? out : null);
  return DIEM.get(zone.id);
}
let pldLich = null; // lịch chuyến máy chủ gửi: { chuyen, t, gio, baoDanh, dauLinh, capBo, thuyTac } + lech (giờ máy chủ − giờ máy)
const datLich = (L) => { pldLich = { ...L, lech: L.gio - Date.now() }; };
function pld(b) {
  if (!hero) return;
  Net.pld(hero.slot | 0, b).then(xuLyPld).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// phản hồi Phong Lăng Độ (Thuyền phu hoặc công cụ thử)
function xuLyPld(j) {
  applyServer(j);
  if (j.lich) datLich(j.lich);
  for (const t of j.tin || []) P.hud.msg(t);
  if (GW) GW.refresh(true);
  if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, "Thuyền phu"), j.say.opts.map(([nhan, viec, ben]) => [nhan, viec ? () => pld({ viec, ben }) : null]));
  if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, "Thuyền phu")), 0, null);
  if (j.giao && GW) GW.giaoDo(j.giao).then((ds) => { if (ds) pld({ viec: j.giao.viec, ben: j.giao.ben, u: ds }); });
  if (j.di) diPld(j.di);
  return j;
}
// máy chủ bảo đi (đã thu vé / phí): đang tải dở bản đồ khác thì chờ tải xong rồi đi — gotoZone lúc đang tải bỏ qua lệnh mới (thử Vượt Ải 28/10:
// vừa về Ba Lăng bấm vào ải ngay -> mất phí, không sang ải)
function diPld(di) {
  const z = P.maps.zones.find((x) => x.id === di.z);
  // trình duyệt còn bản danh sách bãi cũ (chưa có bãi máy chủ vừa thêm — vd đảo Tẩy Tủy): báo, không đứng im (anh 28/10)
  if (!z) { P.hud.canh("Trình duyệt chưa có bản đồ này — tải lại trang (F5) rồi nói chuyện lại với NPC"); return; }
  if (NPCD) NPCD.close();
  const at = Array.isArray(di.at) ? di.at : null, di1 = () => gotoZone(z, di.hoiSinh ? { revive: true, at } : { ...(at ? { at } : {}), ...(di.chung ? { chung: true } : {}) }).catch(fail); // chung: bản quái chung (Boss Sát thủ — công cụ thử)
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di1); else di1();
}
// trên thuyền: báo giờ, sinh Thủy tặc / đầu lĩnh, tới giờ thì cập bờ (mỗi khung hình — chỉ làm khi tới mốc)
function pldTick() {
  const w = world; if (!w || !laThuyen(w.zone) || !pldLich || zoneLoad) { if (P.hud && P.hud.thuyenOn && !(w && (laAi(w.zone) || laVd(w.zone)))) P.hud.setThuyen(null); return; }
  const L = pldLich, t = (Date.now() + L.lech - L.chuyen) / 60000, phut = Math.floor(t), S = w._pld || (w._pld = { bao: new Set(), chay: false, ra: 0, cap: 0 });
  const bao = (k, txt) => { if (!S.bao.has(k)) { S.bao.add(k); P.hud.msg(txt); } };
  if (performance.now() - (S.hoi || (S.hoi = performance.now())) > 30000) { S.hoi = performance.now(); pld({ viec: "lich" }); } // hỏi lại lịch (lệch đồng hồ, máy chủ khởi động lại)
  const dot = L.dotThuyTac || [L.baoDanh], ra = L.dauLinh.filter((m) => t >= m).length, keDl = L.dauLinh.find((m) => t < m), keDot = dot.find((m) => t < m);
  // dòng đếm giờ giữa trên màn hình (anh 27/10 "hiển thị thời gian còn lại của thuyền với thời gian đầu lĩnh xuất hiện")
  const mmss = (m) => { const s = Math.max(0, Math.ceil(m * 60)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  P.hud.setThuyen(t < L.baoDanh ? `Thuyền rời bến sau ${mmss(L.baoDanh - t)}` : [`Đến bờ Bắc sau ${mmss(L.capBo - t)}`,
    keDl != null ? `Đầu lĩnh ${ra + 1}/${L.dauLinh.length} sau ${mmss(keDl - t)}` : `Đầu lĩnh đã ra đủ ${L.dauLinh.length}`,
    keDot != null ? `Thủy tặc đợt ${dot.length - dot.filter((m) => m > t).length + 1}/${dot.length} sau ${mmss(keDot - t)}` : `Thủy tặc đã ra đủ ${dot.length} đợt`].join("  ·  "));
  if (t < L.baoDanh) { if (phut > 0 && phut % 3 === 0) bao("r" + phut, `còn ${L.baoDanh - phut} phút rời bến`); return; } // báo danh: chưa đánh nhau
  if (!S.chay) { S.chay = true; S.dot = 0; P.hud.msg("Thuyền đi rồi! 30 phút sau sẽ đến bờ Bắc Phong Lăng Độ."); }
  // Thủy tặc theo đợt (cau-hinh.json phongLangDo.dotThuyTac — client 1 đợt 30 con lúc thuyền chạy): mỗi đợt thuyTac con, sống tối đa songToiDa
  const dotDen = dot.filter((m) => t >= m).length;
  while ((S.dot | 0) < dotDen) {
    S.dot = (S.dot | 0) + 1;
    const song = w.mobs.filter((m) => m.alive && !m.boss).length, con = Math.max(0, Math.min(L.thuyTac, (L.songToiDa || 45) - song));
    for (let i = 0; i < con; i++) w.spawnMob(false, 150);
    if (S.dot > 1) P.hud.msg(`Thủy tặc lại kéo lên thuyền (đợt ${S.dot}/${dot.length})!`);
  }
  if (keDl != null && keDl - t <= 1) bao("dl" + keDl, "Thủy tặc đầu lĩnh sắp xuất hiện (1 phút nữa)!");
  if (phut < L.capBo && (phut % 5 === 0 || phut === L.capBo - 1)) bao("c" + phut, `còn ${L.capBo - phut} phút sẽ đến bờ Bắc Phong Lăng Độ`);
  const daHa = (hero.pld && hero.pld.dl) | 0;
  while (S.ra < ra) { S.ra++; if (S.ra > daHa && w.spawnMob(true, 150)) P.hud.msg("Thủy tặc đầu lĩnh đã xuất hiện."); }
  if (t >= L.capBo && performance.now() - S.cap > 5000) { S.cap = performance.now(); pld({ viec: "cap" }); } // máy chủ chưa tới giờ thì 5 giây hỏi lại
}
// ---------- Phong Hỏa Liên Thành (anh 04/11 — src/game/phonghoa.js, may-chu/phong-hoa.js, assets/data/phong-hoa.json — cong-cu/dung-phong-hoa.mjs) ----------
// Vệ binh thành môn Biện Kinh (script\global\map_helper.lua) mở lối lúc trận nhận báo danh (19:00 — cau-hinh phongHoa.gio); bản S1 bỏ bản đồ báo danh 518: lời Tướng quân thủ thành
// (cd_signnpc.lua) ngay sau đó, nộp phí là vào đại doanh. Trong trận: Quân Nhu quan bán thuốc, Rương chứa đồ, Xa phu về Biện Kinh (cd_transer.lua).
// Trợ Thủ không tự đi (anh 04/11 "người chơi tự đi"); tùy chọn "ở lại trận" (hero.auto.ph.o): hồi sinh ở đại doanh tự ra đánh tiếp, sắp hết thuốc mua ở
// Quân Nhu quan, không về bãi treo; hết trận về Biện Kinh thì Trợ Thủ việc ở thành rồi về bãi treo như thường
const laPh = (z) => !!z && z.kind === "chiến" && !laTk(z); // không bao giờ là chiến trường Tống Kim (kind "tongkim" — đặc tả đợt 2)
const PH_THANH = 37; // Biện Kinh — thành phe Kim của kịch bản gốc
const phO = () => !!(hero && hero.auto && hero.auto.ph && hero.auto.ph.o);
const phHoiSinh = () => { const L = (P.phongHoa && P.phongHoa.hoiSinh) || []; return L.length ? L[Math.floor(Math.random() * L.length)] : null; };
function phNpcs() {
  const D = P.phongHoa; if (!D) return [];
  return [...D.quanNhu.map(([x, y]) => ({ name: "Quân Nhu quan", type: "enemy005", role: "talk", ph: "qn", x, y })),
    ...D.ruong.map(([x, y]) => ({ name: "Rương chứa đồ", type: "passerby198", role: "talk", viec: "ruong", x, y })),
    { name: "Xa phu", type: "passerby040_4", role: "talk", ph: "xp", x: D.xaPhu[0], y: D.xaPhu[1] }];
}
// về Biện Kinh (Xa phu đại doanh, hết trận, chưa báo danh): đang tự đánh thì Trợ Thủ việc ở thành rồi về bãi treo (như về thành dưỡng sức)
function phVeThanh() {
  const V = P.phongHoa && P.phongHoa.veThanh, z = V && P.maps.zones.find((x) => x.id === V.zone); if (!z) return;
  if (world && world.auto) thanh = { buoc: "di", t0: performance.now(), why: "rời Phong Hỏa Liên Thành" };
  gotoZone(z, { at: V.at });
}
function phNpc(n) {
  if (!NPCD) return;
  if (n.ph === "qn") return NPCD.choose("msgsel", "InfoText", richText("Quân nhu quan thủ thành: Chỗ ta có nhiều loại dược phẩm quý, những vật phẩm sử dụng chiến trường. Ngươi muốn mua thứ gì?", hero.name, n.name),
    [["Mua dược phẩm", () => GW && GW.openShop(39)], ["Hủy bỏ", null]]);
  if (n.ph === "xp") return NPCD.choose("msgsel", "InfoText", richText("Xa phu: Chiến tranh đang kịch liệt! Sớm biết ta đã báo danh đi tiền phương rồi! Đúng rồi! Ngươi có chuyện gì vậy?", hero.name, n.name),
    [["Ta có chuyện quan trọng báo với Tướng quân! Xin mời ông ta về hậu doanh!", () => { P.audio.ui("click"); phVeThanh(); }], ["Không có chi! Ta chỉ đến đây chơi.", null]]);
}
function phongHoaVe(n) {
  if (!hero) return;
  Net.phongHoa(hero.slot | 0, { viec: "mo" }).then((j) => {
    applyServer(j);
    const l = j.l || {}, ten = n.name, chuyen = () => { if (!NPCD.open(n)) P.hud.msg(`${ten}: hội thoại chưa làm`); };
    if (!l.mo || !NPCD) return chuyen();
    NPCD.choose("msgsel", "InfoText", richText(`${ten}: Tuy không phải là người trong giang hồ, nhưng hàng ngày ta thấy các ngươi qua lại rất nhiều lần. Không phải khoác lác vì hoàn cảnh các ngươi ta hiểu rất rõ.`, hero.name, ten),
      [["Tham gia chiến dịch thủ thành", () => phMuonDi(ten, j)], ["Tán gẫu", chuyen], ["Rời khỏi", null]]);
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
function phMuonDi(ten, j) {
  const l = j.l || {}, con = Math.max(1, Math.round(((l.het || 0) - (l.kc || 0)) / 60000)), gio = con % 60 ? `${con} phút` : `${con / 60} tiếng`;
  if ((hero.lvl | 0) < (l.cap | 0)) return NPCD.talk([richText(`${ten}: á? Ngươi cũng muốn tham gia chiến dịch thủ thành àh? Đẳng cấp chưa đủ ${l.cap} cấp đâu, tài nghệ như ngươi đây giúp không được gì đâu, có thể mất mạng như chơi nữa, thôi ở lại thành này đi!`, hero.name, ten)], 0, null);
  if (j.daNop) return phVao();
  NPCD.choose("msgsel", "InfoText", richText(`${ten}: Ngươi muốn đi giữ thành àh? Muốn lắm àh? úi! Ngươi vĩ đại thật đó! Nhưng nghe đâu tình huống cấp bách lắm thì phải! Trong thành chỉ còn thủ được ${gio} nữa thôi, nếu không kích lui được quân địch thì thất thủ rồi! Còn muốn tham gia chỉ có tướng quân mới quyết định được, ta có thể dẫn ngươi qua đó.`, hero.name, ten),
    [["Ta biết rồi! Mau dẫn ta qua đó đi!", () => phTuongQuan(j)], ["Để ta chuẩn bị đã!", null]]);
}
function phTuongQuan(j) {
  const ten = "Tướng quân thủ thành";
  NPCD.choose("msgsel", "InfoText", richText(`${ten}: à! Ngươi muốn giúp chúng ta chống lại kẻ địch? ái chà! Mấy tên này không giống binh sĩ tầm thường, bọn chúng võ nghệ cao cường, cưỡi ngựa rất tài, lại còn biết phóng ám khí.`, hero.name, ten),
    [["Tướng quân! Ông không sao chứ?", () => NPCD.choose("msgsel", "InfoText", richText(`${ten}: Được rồi! Không cần nói nhiều, nói chung ta cảm thấy lai lịch của bọn họ rất khả nghi. Số người tham gia thủ thành là <color=yellow>${j.soNguoi | 0}<color> người. Trước tiên phải nộp ${j.phiTxt || "lệ phí"} lệ phí báo danh, chuẩn bị sẵn sàng chưa?`, hero.name, ten),
      [["Đúng vậy!", phVao], ["Để ta chuẩn bị đã!", null]])]]);
}
function phVao() {
  Net.phongHoa(hero.slot | 0, { viec: "vao" }).then((j) => {
    applyServer(j);
    if (j.msg) P.hud.msg(j.msg);
    const z = j.vao && P.maps.zones.find((x) => x.id === j.vao.zone); if (!z) return;
    thanh = null; diXe = null;
    gotoZone(z, { at: j.vao.at });
  }).catch((e) => { if (e.ma !== "het-phien") { if (NPCD) NPCD.talk([richText(`Tướng quân thủ thành: ${e.message}`, hero.name, "Tướng quân thủ thành")], 0, null); else P.hud.msg(e.message); } });
}
// ---------- Tống Kim trận thật (anh 06/11 — đặc tả đợt 2: src/game/tongkim.js, may-chu/tong-kim.js lam, assets/data/tong-kim.json) ----------
// Biện Kinh: Mộ binh quan (npc-them.json tk "mb" — báo danh, chọn phe, nộp phí, vào lại trận) / Quân Nhu quan (tk "qn" — shop điểm Tống Kim, đúc Nhạc Vương
// Kiếm): máy chủ trả say { text, opts: [[nhãn, việc, x?]] } / talk { text } / vao { zone, at } / shop { hang: [[k, giá]], diem } / tin — khung hội thoại của client
const TK_THANH = 37; // Biện Kinh
function tongKimNpc(b, n) {
  if (!hero) return;
  const ten = (n && n.name) || (b.viec === "qn" || b.viec === "shop" || b.viec === "duc" || b.viec === "ducOk" ? "Quân Nhu quan" : "Mộ binh quan");
  Net.tongKim(hero.slot | 0, b).then((j) => {
    applyServer(j);
    for (const t of j.tin || []) P.hud.msg(String(t).replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (GW) GW.refresh(true);
    if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text || "", hero.name, ten), (j.say.opts || []).map(([nhan, viec, x]) => [nhan, viec ? () => tongKimNpc({ viec, ...(x != null ? { x } : {}) }, n) : null]));
    if (j.talk && NPCD) { const T = Array.isArray(j.talk) ? j.talk : Array.isArray(j.talk.text) ? j.talk.text : [j.talk.text || ""]; NPCD.talk(T.map((t) => richText(t, hero.name, ten)), 0, null); }
    // cửa hàng Quân Nhu quan: hàng + giá điểm Tống Kim (windows.js openShop tiền "tk" — mua qua act muaTk)
    if (j.shop && GW) {
      if (Number.isFinite(+j.shop.diem)) hero.diemTk = +j.shop.diem;
      ItemDB.shops[98] = (j.shop.hang || []).filter((r) => Array.isArray(r) && r[0]).map(([k, gia]) => ({ k, gia: +gia || 0 }));
      if (NPCD) NPCD.close();
      if (!GW.openShop(98, "tk")) P.hud.msg("Quân Nhu quan: cửa hàng chưa có hàng (trình duyệt chưa có vật phẩm Tống Kim — tải lại trang F5)");
      else P.hud.msg(`Quân Nhu quan: điểm Tống Kim hiện có ${fmtSo(hero.diemTk | 0)}`, MAU_TIN.tien);
    }
    if (j.vao) tkVaoTran(j.vao);
  }).catch((e) => { if (e.ma !== "het-phien") { if (NPCD) NPCD.talk([richText(`${ten}: ${e.message}`, hero.name, ten)], 0, null); else P.hud.msg(e.message); } });
}
// vào chiến trường (máy chủ đã nhận báo danh / cho vào lại): đang tải dở bản đồ khác thì tải xong rồi đi (như diPld)
function tkVaoTran(vao) {
  const z = P.maps.zones.find((x) => x.id === vao.zone);
  if (!z) { P.hud.canh("Trình duyệt chưa có bản đồ chiến trường Tống Kim — tải lại trang (F5) rồi nói chuyện lại với Mộ binh quan"); return; }
  if (NPCD) NPCD.close();
  thanh = null; diXe = null;
  const di = () => gotoZone(z, Array.isArray(vao.at) ? { at: vao.at } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// về Biện Kinh (hết trận / không có tên trong trận / rời chiến trường ở Quân y): chỗ về của gói bản đồ (tong-kim.json bienKinh.ra), không có thì điểm hồi
// sinh của thành; đang tự đánh thì Trợ Thủ làm việc ở thành rồi về bãi treo (như rời Phong Hỏa)
function tkVeBienKinh(cau) {
  const z = P.maps.zones.find((x) => x.id === TK_THANH); if (!z) return;
  if (cau) P.hud.msg(cau, MAU_TIN.tien);
  if (NPCD) NPCD.close();
  if (world && world.auto) thanh = { buoc: "di", t0: performance.now(), why: "rời chiến trường Tống Kim" };
  const ra = TongKim.D && TongKim.D.bienKinh && TongKim.D.bienKinh.ra;
  const di = () => gotoZone(z, ra ? { at: ra } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// vào game mà chỗ lưu ở chiến trường: hỏi máy chủ vào lại (viec "vao" — không thu phí; có tên trong trận đang báo danh / đánh thì trả chỗ ở hậu doanh) -> { zone,
// at } — không được thì Biện Kinh (chỗ về của gói bản đồ). Chờ tối đa 6 giây
async function tkDangNhap() {
  let j = null;
  try { j = await Promise.race([Net.tongKim(hero.slot | 0, { viec: "vao" }), new Promise((r) => setTimeout(() => r(null), 6000))]); } catch { j = null; }
  const z = j && j.vao && P.maps.zones.find((x) => x.id === j.vao.zone);
  if (z) return { zone: z, at: Array.isArray(j.vao.at) ? j.vao.at : null };
  await coHanP(TongKim.napDuLieu(), 4000, "dữ liệu Tống Kim");
  const bk = P.maps.zones.find((x) => x.id === TK_THANH), ra = TongKim.D && TongKim.D.bienKinh && TongKim.D.bienKinh.ra;
  return bk ? { zone: bk, at: ra || null } : null;
}
// NPC 2 hậu doanh (tong-kim.json phe[i].hau): Quân y (mẫu client 55 Tống / 49 Kim — bán thuốc, rời chiến trường) + Rương chứa đồ
function tkNpcs() {
  const D = TongKim.D; if (!D) return [];
  const L = [];
  D.phe.forEach((P0, i) => {
    const H = P0.hau;
    if (H.quanY) L.push({ name: "Quân y", type: i ? "enemy005" : "enemy022", role: "talk", tkHau: "qy", phe: i, x: H.quanY[0], y: H.quanY[1] });
    if (H.ruong) L.push({ name: "Rương chứa đồ", type: "passerby198", role: "talk", viec: "ruong", x: H.ruong[0], y: H.ruong[1] });
  });
  return L;
}
// Quân y hậu doanh (client marshal/doctor.lua: "Hậu doanh do ta phụ trách!…" + Sale thuốc): mua thuốc (cửa hàng thuốc 39 — lượng), rời chiến trường về Biện
// Kinh (vào lại ở Mộ binh quan: giữ phe, điểm, chức, không thu phí lần nữa)
function tkQuanY(n) {
  if (!NPCD || !hero) return;
  NPCD.choose("msgsel", "InfoText", richText("Quân y: Hậu doanh do ta phụ trách! Ngươi có cần giúp đỡ gì không?", hero.name, n.name),
    // thuốc Tống Kim đồng giá 1 lượng (lượt 86), rời trận tự mất (anh 12/11 — may-chu/do.js CAU_TK); trận đã xong (pha "xong" — 30 giây trước khi về Biện Kinh) máy chủ bán giá thường
    // thuốc thường -> cửa hàng thường (soát 12/11)
    [["Mua dược phẩm", () => GW && GW.openShop(39, null, TongKim.st && TongKim.st.pha === "xong" ? null : { tk: 1 })],
     ["Rời chiến trường", () => NPCD.choose("msgsel", "InfoText", richText("Quân y: Rời chiến trường về Biện Kinh? Muốn quay lại thì nhờ Xa phu đưa đến Điểm báo danh Tống Kim — vẫn giữ phe, điểm và chức, không phải nộp phí lần nữa.", hero.name, n.name),
       [["Về Biện Kinh", () => { P.audio.ui("click"); tkVeBienKinh(); }], ["Ở lại", null]])],
     ["Không cần", null]]);
}
// ---------- Lôi Đài Công Bình Tử (anh 15/11 — THIET-KE-LOI-DAI.md đợt 1: src/game/loidai.js, may-chu/loi-dai.js) ----------
// Công Bình Tử (Ba Lăng, Biện Kinh — npc-them.json script "s1:loi-dai", entry "LoiDai"): khung Describe có chân dung như Lễ quan; mỗi lựa chọn là 1 việc của máy chủ
// ("LoiDai:<viec>" — NpcDialog.show giữ khung tới khi máy chủ trả lời). POST /api/loi-dai { o, viec, khoa? } -> say { text, opts: [[nhãn, viec | null]] } | talk { text } |
// vao { zone, at, xem? } | ve { z, at } | msg | can "khoa" (thành viên cần số thứ tự đội trưởng đưa -> "nhap": khung nhập số của game, rồi vao kèm khoa). Lời / lựa chọn
// theo client do máy chủ dựng (phí, cấp theo cấu hình). Trương Tam / Lý Tứ trong sân (script "s1:loi-dai-ra", entry "LoiDaiRa"): hỏi rời đấu trường
const CBT = "<link=image[0,14]:\\spr\\npcres\\passerby\\passerby094\\passerby094_pst.spr>Công Bình Tử:<link> ";
// vào sân (máy chủ đã nhận — tuyển thủ / người xem): như tkVaoTran — dừng việc Trợ Thủ đang làm ở thành; trình duyệt thiếu vùng (map.json cũ) -> F5; đang tải dở bản đồ khác
// thì tải xong rồi đi. Nhớ thành vừa đi (chỗ về dự phòng)
function ldVaoTran(vao) {
  const z = vao && P.maps.zones.find((x) => x.id === vao.zone && laLd(x));
  if (!z) { P.hud.canh("Trình duyệt chưa có bản đồ lôi đài — tải lại trang (F5) rồi nói chuyện lại với Công Bình Tử"); return; }
  if (NPCD) NPCD.close();
  thanh = null; diXe = null;
  if (world && !laLd(world.zone)) LoiDai.tuZ = world.zone.id;
  const di = () => gotoZone(z, Array.isArray(vao.at) ? { at: vao.at } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// tên thành của chỗ về (bảng kết quả: "N giây nữa về …")
const ldTenVe = (ve) => (P.maps.zones.find((x) => x.id === ((ve && ve.z) || LoiDai.tuZ || START_ZONE)) || {}).n || "Ba Lăng huyện";
// về chỗ máy chủ đưa (Rời sân, hết trận, không còn tên ở sân, đăng nhập lại): ve = { z, at } — chỗ Công Bình Tử đã vào (37 Biện Kinh, còn lại Ba Lăng); thiếu thì thành vừa
// đi vào sân / Ba Lăng huyện. Tự đánh lúc vào sân đang bật (LoiDai.autoTruoc — loadZone bật lại ở World mới): Trợ Thủ làm việc ở thành rồi về bãi treo như rời Tống Kim
function ldVe(ve, cau) {
  const z = (ve && P.maps.zones.find((x) => x.id === ve.z && !laLd(x))) || P.maps.zones.find((x) => x.id === (LoiDai.tuZ || START_ZONE)) || townZone(); if (!z) return;
  if (cau) P.hud.msg(cau, MAU_TIN.tien);
  if (NPCD) NPCD.close();
  if (LoiDai.autoTruoc && TOWN_KINDS.has(z.kind)) thanh = { buoc: "di", t0: performance.now(), why: "rời lôi đài" };
  const at = ve && ve.z === z.id && Array.isArray(ve.at) ? ve.at : null;
  const di = () => gotoZone(z, at ? { at } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// vào game mà chỗ lưu ở sân lôi đài (như tkDangNhap): hỏi máy chủ (viec "dangNhap" — còn là tuyển thủ chưa tự rời của sân đang chuẩn bị thì vào lại, miễn phí) -> { zone, at }
// sân | chỗ về (ve) | null (Ba Lăng huyện — START_ZONE). Chờ tối đa 6 giây
async function ldDangNhap() {
  let j = null;
  try { j = await Promise.race([Net.loiDai(hero.slot | 0, { viec: "dangNhap" }), new Promise((r) => setTimeout(() => r(null), 6000))]); } catch { j = null; }
  const v = j && j.vao, z = v && P.maps.zones.find((x) => x.id === v.zone && laLd(x));
  if (z) return { zone: z, at: Array.isArray(v.at) ? v.at : null };
  const ve = j && j.ve, zv = ve && P.maps.zones.find((x) => x.id === ve.z && !laLd(x));
  return zv ? { zone: zv, at: Array.isArray(ve.at) ? ve.at : null } : null;
}
// ---------- Truy Phong Đại Loạn Đấu — đua ngựa (anh 16/11 — src/game/duangua.js, may-chu/dua-ngua.js) ----------
// Truy Phong Sứ Giả (Ba Lăng — npc-them.json script "s1:dua-ngua", entry "DuaNgua"): khung Describe có chân dung (mẫu client passerby092 — Lãng nhân) như Lễ quan / Công Bình Tử;
// mỗi lựa chọn là 1 việc của máy chủ ("DuaNgua:<viec>"). Ông chủ đường đua (đích — "s1:dua-ngua-dich", entry "DuaNguaDich"; client npc 228 không có chân dung): khung hỏi
// thường, nói chuyện = về đích (viec "dich"). POST /api/dua-ngua -> say { text, opts } | vao { zone, at } | ve { z, at } | tin [câu] | s (trạng thái)
const TPS = "<link=image[0,13]:\\spr\\npcres\\passerby\\passerby092\\passerby092_pst.spr>Truy Phong Sứ Giả:<link> ";
// kết quả /api/dua-ngua(-qt): nhân vật / túi, tin (thẻ màu -> khung tin), trạng thái, vào đường đua / về -> true nếu đã đi bản đồ khác
function dnApply(j) {
  if (!j) return false;
  applyServer(j);
  for (const t of Array.isArray(j.tin) ? j.tin : []) P.hud.msg(phanMauDn(t));
  if (j.msg) P.hud.msg(phanMauDn(j.msg));
  if (j.s) DuaNgua.capNhat(j.s);
  if (GW) GW.refresh(true);
  if (j.thuong && j.s && j.s.tt !== "ket" && Array.isArray(j.dnKq)) DuaNgua.moBang(j.s, false, j.dnKq); // người về đích cuối (đủ soVe — lượt kết thúc luôn): capNhat đã mở bảng cuối // vừa về đích (anh 16/11): bảng tổng kết — hạng, thời gian, thưởng, người đã về
  if (j.vao) { dnVao(j.vao); return true; }
  if (j.ve) { dnVe(j.ve); return true; }
  return false;
}
const phanMauDn = (t) => { const p = phanMau(t); return Array.isArray(p) ? p : String(p); };
// vào đường đua (báo danh / trở lại / lượt thử): như ldVaoTran — dừng việc Trợ Thủ đang làm ở thành; trình duyệt thiếu bãi 863 (map.json cũ) -> F5
function dnVao(vao) {
  const z = vao && P.maps.zones.find((x) => x.id === vao.zone && laDn(x));
  if (!z) { P.hud.canh("Trình duyệt chưa có bản đồ đường đua — tải lại trang (F5) rồi nói chuyện lại với Truy Phong Sứ Giả"); return; }
  if (NPCD) NPCD.close();
  thanh = null; diXe = null;
  if (world && !laDn(world.zone)) DuaNgua.tuZ = world.zone.id;
  const at = Array.isArray(vao.at) ? vao.at : null;
  // đang ở đường đua rồi (dịch chuyển tới mốc — công cụ thử): đặt lại chỗ đứng, không tải lại bản đồ
  if (world && world.zone.id === z.id && at && !zoneLoad) { world.teleport(at[0], at[1]); return; }
  const di = () => gotoZone(z, at ? { at } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// về Ba Lăng (về đích, rời, hết lượt, nhịp dnDi): Trợ Thủ đang bật lúc vào đường đua thì làm việc ở thành rồi về bãi treo như rời lôi đài
function dnVe(ve, cau) {
  const z = (ve && P.maps.zones.find((x) => x.id === ve.z && !laDn(x))) || P.maps.zones.find((x) => x.id === START_ZONE) || townZone(); if (!z) return;
  if (cau) P.hud.msg(cau, MAU_TIN.tien);
  if (NPCD) NPCD.close();
  DuaNgua.dangVe = true; // đang về: duangua.js tick không gọi về lần nữa (World mới đặt lại)
  if (DuaNgua.autoTruoc && TOWN_KINDS.has(z.kind)) thanh = { buoc: "di", t0: performance.now(), why: "rời đường đua" };
  const at = ve && ve.z === z.id && Array.isArray(ve.at) ? ve.at : null;
  const di = () => gotoZone(z, at ? { at } : {}).catch(fail);
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di); else di();
}
// vào game mà chỗ lưu ở đường đua (như ldDangNhap): hỏi máy chủ (viec "xem") — còn đang đua (chưa về đích / chưa rời, lượt chưa xong) thì vào lại đúng chỗ cũ -> { zone, at };
// không thì null (Ba Lăng huyện — START_ZONE). Chờ tối đa 6 giây
async function dnDangNhap(v) {
  let j = null;
  try { j = await Promise.race([Net.duaNgua(hero.slot | 0, { viec: "xem" }), new Promise((r) => setTimeout(() => r(null), 6000))]); } catch { j = null; }
  const s = j && j.s, me = s && s.toi, z = P.maps.zones.find((x) => x.id === v.z && laDn(x));
  if (!z || !me || me.ve || me.roi || s.tt === "ket" || (me.o != null && (me.o | 0) !== (hero.slot | 0))) return null; // me.o: ô nhân vật đang đua (tài khoản có nhiều nhân vật)
  DuaNgua.capNhat(s);
  return { zone: z, at: Number.isFinite(v.x) && Number.isFinite(v.y) ? [v.x, v.y] : Array.isArray(me.xp) ? me.xp : null };
}
// ---------- Báo Đáp Ân Sư (anh 16/11 — may-chu/bao-dap-an-su.js; sự kiện tháng 11 của client activitysys\config\22 "Đỗ Khang Tửu") ----------
// Võ Sư Ba Lăng (script client 巴陵县武师.lua): thêm "Hoạt động báo đáp ân sư" trước "Không có gì!…" (themBaoDapAnSu) -> khung Describe có chân dung (passerby097 — hình của
// chính Võ sư): lời client "Lại một năm sương phong mưa tuyết…" + Giới thiệu hoạt động / Mời võ sư dùng Đỗ Khang Tửu / Dâng tặng Ngũ Sắc Hương Bao / Rời khỏi.
// Chưởng Đăng Cung Nữ (NPC thêm — npc-them.json script "s1:chuong-dang", entry "ChuongDang"; client npc 1393 không có hình _pst): khung Describe không chân dung — lời
// client "Gần đây ta cần 1 ít Tây Hồ long tĩnh trà…" + đổi 3 loại hương bao (client ComposeDailog có hỏi số lượng), Mua Tơ Tằm (client: Hàng rong — S1 dời về đây).
// Mỗi việc là POST /api/bao-dap-an-su { o, viec, n?, loai? } (bdGoi); số lượng ở khung số của game (GW.chonSo — mặc định / tối đa = số đang có). Ngoài ngày sự kiện
// (tt / luat().baoDapAnSu.dang false): "Hoạt động báo đáp ân sư đã kết thúc" (Võ Sư vẫn nói chuyện bình thường ở các lựa chọn khác)
const VO_SU = "<link=image[0,13]:\\spr\\npcres\\passerby\\passerby097\\passerby097_pst.spr>Võ sư:<link> ";
// chân dung: client không có _pst.spr cho mẫu 1393 -> dải 14 khung hướng đầu của hình đứng zhangdenggongnv.spr, cắt sát (assets/ui/win/npc/zhangdenggongnv_pst_0_13.png
// — scratchpad bdas/chan-dung-cung-nu.mjs, anh 16/11); trình duyệt chỉ dùng tên trong thẻ để tìm ảnh
const CUNG_NU = "<link=image[0,13]:\\spr\\npcres\\passerby\\passerby254\\zhangdenggongnv_pst.spr>Chưởng Đăng Cung Nữ:<link> ";
const BD_MON = { ruou: "ms:2572", tra: "ms:2573", to: "ms:2574", chi: "ms:2575", duoc: "ms:2576", hbNs: "ms:2578" };
const BD_HB = { tt: ["ms:2577", "ms:2574"], ns: ["ms:2578", "ms:2575"], td: ["ms:2579", "ms:2576"] }; // loai -> [hương bao, nguyên liệu đi cùng 1 trà] (config.lua client [7]–[9])
// nguồn từng nguyên liệu (câu nhắc khi thiếu — DAC-TA mục 7, cau-hinh.json baoDapAnSu.nguon)
const BD_NGUON = {
  "ms:2572": "Đỗ Khang Tửu có từ Tống Kim (cuối trận), Thủy tặc đầu lĩnh Phong Lăng Độ, qua Vượt Ải, Online nhận thưởng mốc 1 giờ, Boss Hoàng Kim, Dã Tẩu mốc 40, Boss Sát thủ cấp 90 trở lên; Kỳ Trân Các bán Đỗ Khang Tửu lễ bao.",
  "ms:2573": "Tây Hồ Long Tĩnh Trà: mời Võ Sư (Ba Lăng huyện) dùng Đỗ Khang Tửu, mỗi bình được 3 hoặc 6 trà.",
  "ms:2574": "Tơ Tằm: mua ở chỗ ta.",
  "ms:2575": "Sợi chỉ màu: Kỳ Trân Các, rơi từ quái bãi luyện công cấp 90 trở lên (tối đa 30 sợi mỗi ngày), Dã Tẩu mốc 40 nhiệm vụ trong ngày (5 sợi).",
  "ms:2576": "Trung Dược: Kỳ Trân Các; Nhiệm vụ ngày lễ ở Võ Sư, Dã Tẩu mốc 20 / 30 / 40, Boss Sát thủ, Tống Kim, Online 3 giờ, Phong Lăng Độ (đầu lĩnh, cập bờ), Săn Nhím — xem Tra cứu.", // anh 18/11 — nguồn sự kiện
};
let bdTtCu = null; // trạng thái sự kiện máy chủ trả gần nhất (bdChuan) — luat() đè lên LUAT lúc vào game
const bdTen = (k) => String((ItemDB.item(k) || {}).n || k).trim();
const bdDem = (k) => ((hero && hero.bag) || []).reduce((t, o) => t + (o && o.k === k ? o.n || 1 : 0), 0);
const ngayVN = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10); // "YYYY-MM-DD" giờ Việt Nam (như máy chủ N.ngayVN)
// "YYYY-MM-DD" -> "dd/mm" (lui: lùi số ngày — den / moHet là ngày ĐÃ đóng, ngày cuối = lui 1)
const bdNgay = (s, lui = 0) => { const t = Date.parse(String(s || "") + "T00:00:00Z"); if (!Number.isFinite(t)) return "?"; const d = new Date(t - lui * 864e5); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
// kết quả viec "tt" -> { mo, moHb, tu, den, moHet, ruou: { kn, tran }, dangHb: { da, toiDa }, knHb: { da, tran }, giaTo }. bdas.dang của máy chủ là cờ sự kiện mở HOẶC
// { da, toiDa } số lần dâng hương bao (đặc tả ghi trùng khóa) — nhận cả 2 cách: thiếu cờ thì xét theo ngày tu <= hôm nay < den của máy chủ. B = null (máy chủ không trả
// lời): theo LUAT lúc vào game, qua ngày đóng thì đóng
function bdChuan(B) {
  const L = luat().baoDapAnSu || {}, co = !!B; B = B || {};
  const tu = B.tu || L.tu, den = B.den || L.den, moHet = B.moHet || L.moHet, nay = ngayVN(), trong = (x, y) => (!x || nay >= x) && (!y || nay < y);
  const dg = B.dang && typeof B.dang === "object" ? B.dang : B.dangHb && typeof B.dangHb === "object" ? B.dangHb : null;
  const mo = typeof B.dang === "boolean" ? B.dang : typeof B.mo === "boolean" ? B.mo : co && (tu || den) ? trong(tu, den) : !!L.dang && trong(tu, den);
  const moHb = typeof B.moHb === "boolean" ? B.moHb : co && (tu || moHet) ? trong(tu, moHet) : !!L.moHb && trong(tu, moHet);
  return { mo, moHb, tu, den, moHet, ruou: B.ruou || null, dangHb: dg, knHb: B.knHb || null, soMo: B.soMo || null, bao: B.bao || L.bao || null, giaTo: +B.giaTo > 0 ? +B.giaTo : 30000 };
}
// kết quả /api/bao-dap-an-su: kn ở đây là SỐ kinh nghiệm vừa nhận (applyServer coi kn là sách / điểm) -> tách ra; nv / tui / tin; câu báo ở khung tin
function bdApply(j) {
  if (!j) return j;
  const { kn, ...r } = j;
  applyServer(r);
  if (j.bdas) bdTtCu = bdChuan(j.bdas);
  const msg = typeof j.msg === "string" ? j.msg : "";
  if (msg) P.hud.msg(/<color/i.test(msg) ? phanMauDn(msg) : msg);
  if (+kn > 0 && !/kinh nghiệm/i.test(msg)) P.hud.msg(`Bạn nhận được ${fmtSo(+kn)} điểm kinh nghiệm.`, MAU_TIN.kn, true);
  for (const t of Array.isArray(j.tin) ? j.tin : []) P.hud.msg(phanMauDn(t));
  return j;
}
const bdGoi = (b) => Net.baoDapAnSu(hero.slot | 0, b).then(bdApply);
// trạng thái mới (viec "tt" — không cần đứng gần NPC); máy chủ chưa có / mất mạng: theo LUAT lúc vào game
const bdTt = () => bdGoi({ viec: "tt" }).then((j) => (j && j.bdas ? bdTtCu : bdChuan(null)), () => bdChuan(null));
// câu kết quả trong khung NPC: câu máy chủ (thẻ <color> khung NPC hiểu — richText) hoặc dựng từ kn / tra; không có gì thì câu mặc định mac
const bdKetQua = (j, mac = "") => {
  const L = []; j = j || {};
  if (typeof j.msg === "string" && j.msg) L.push(j.msg);
  else { if (+j.kn > 0) L.push(`Nhận được <color=yellow>${fmtSo(+j.kn)}<color> điểm kinh nghiệm.`); if (+j.tra > 0) L.push(`Nhận được <color=yellow>${+j.tra}<color> ${bdTen(BD_MON.tra)}.`); }
  return L.join("<enter>") || mac;
};
// sự kiện không mở: chưa tới ngày / đã kết thúc (+ hạn mở hương bao)
function bdHet(S) {
  const nay = ngayVN();
  if (S.tu && nay < S.tu) return `Hoạt động báo đáp ân sư chưa bắt đầu — từ <color=yellow>${bdNgay(S.tu)}<color> đến hết <color=yellow>${bdNgay(S.den, 1)}<color>.`;
  return `Hoạt động báo đáp ân sư đã kết thúc.${S.moHb && S.moHet ? `<enter>Hương bao vẫn mở được tới hết <color=yellow>${bdNgay(S.moHet, 1)}<color>.` : ""}`;
}
// Giới thiệu (client: "Vào thời gian từ 18/11/2010 đến 13/12/2010 là thời gian hoạt động báo đáp ân sư. Các hạ có thể xem cách tham gia ở trang chủ.") — ngày + cách tham gia của S1
// anh 17/11 tối: số lần mở tối đa mỗi loại + đã mở bao nhiêu (máy chủ tt.soMo [đã mở, tối đa]) + quà mốc ở cái cuối (bao)
function bdMoChu(S) {
  const M = S.soMo || {}, B = S.bao || {}, tenK = (k) => String((ItemDB.item(k) || {}).n || k).trim(), L = [["tt", "Tơ Tằm"], ["ns", "Ngũ Sắc"], ["td", "Trung Dược"]].filter(([l]) => Array.isArray(M[l]) && M[l][1] > 0);
  if (!L.length) return "";
  const moc = [["ns", "Ngũ Sắc"], ["td", "Trung Dược"]].filter(([l]) => Array.isArray(M[l]) && M[l][1] > 0 && (B[l] || []).length).map(([l, n]) => `cái thứ ${fmtSo(M[l][1])} ${n} chắc chắn ra <color=yellow>${B[l].map(tenK).join(" hoặc ")}<color> (món chưa có trước)`);
  return `. Mỗi nhân vật mở tối đa ${L.map(([l, n]) => `${fmtSo(M[l][1])} ${n}`).join(", ")} cả sự kiện — các hạ đã mở ${L.map(([l, n]) => `${n} ${fmtSo(M[l][0])}/${fmtSo(M[l][1])}`).join(", ")}${moc.length ? `; ${moc.join("; ")}` : ""}`;
}
function bdGioiThieu(S) {
  const R = S.ruou, D = S.dangHb, K = S.knHb;
  return [`Vào thời gian từ <color=yellow>${bdNgay(S.tu)}<color> đến hết <color=yellow>${bdNgay(S.den, 1)}<color> là thời gian hoạt động báo đáp ân sư.`,
    `• ${BD_NGUON[BD_MON.ruou]}`,
    `• Mời Võ Sư (Ba Lăng huyện) dùng Đỗ Khang Tửu: mỗi bình được kinh nghiệm và 3 hoặc 6 Tây Hồ Long Tĩnh Trà${R && R.tran ? ` (kinh nghiệm từ rượu tối đa ${fmtSo(R.tran)} mỗi ngày — hết vẫn nhận trà)` : ""}.`,
    `• Chưởng Đăng Cung Nữ (Ba Lăng huyện): 1 trà + 1 Tơ Tằm / Sợi chỉ màu / Trung Dược đổi 1 Tơ Tằm / Ngũ Sắc / Trung Dược Hương Bao. Tơ Tằm mua ở Cung Nữ (${fmtMoney(S.giaTo)}); Sợi chỉ màu, Trung Dược ở Kỳ Trân Các.`,
    `• Mở hương bao được kinh nghiệm (Ngũ Sắc, Trung Dược kèm 1 vật phẩm)${S.moHet ? `, mở được tới hết ${bdNgay(S.moHet, 1)}` : ""}${K && K.tran ? `; kinh nghiệm từ hương bao tối đa ${fmtSo(K.tran)} cả sự kiện` : ""}${bdMoChu(S)}.`,
    `• Hoặc dâng tặng Ngũ Sắc Hương Bao cho Võ Sư đổi kinh nghiệm${D && D.toiDa ? `, mỗi ngày tối đa ${D.toiDa} lần` : ""}.`].join("<enter>");
}
function bdasFn(id, npc) {
  if (!hero || !GW) return { close: true };
  const cn = /^ChuongDang/.test(id), [, viec = "", loai = ""] = id.split(":");
  if (cn) return cungNuFn(viec, loai, id, npc);
  const vs = (text, opts) => ({ desc: 1, text: VO_SU + text, opts });
  const lai = [["Trở lại", "BaoDapAnSu"], ["Rời khỏi", null]];
  const loi = (e) => (e && (e.ma === "het-phien" || e.boQua) ? { close: true } : vs(String((e && e.message) || "Lát nữa hãy quay lại."), lai));
  const ve = () => bdasFn("BaoDapAnSu", npc); // Hủy ở khung số -> trang chính
  if (viec === "gioiThieu") return bdTt().then((S) => vs(bdGioiThieu(S), lai));
  // anh 18/11 — Nhiệm vụ ngày lễ (máy chủ may-chu/nguon-su-kien.js nvLam — sườn dùng lại): xem / nhận / trả, mỗi ngày làm lại
  if (viec === "nvLe" || viec === "nvNhan" || viec === "nvTra") return bdGoi({ viec }).then((j) => {
    const V = (j && j.nvLe) || {}, nut = V.nut === "nhan" ? [["Nhận nhiệm vụ", "BaoDapAnSu:nvNhan"]] : V.nut === "tra" ? [["Trả nhiệm vụ", "BaoDapAnSu:nvTra"]] : [];
    return vs(`${V.text || ""}${V.chuoi ? `<enter><color=gray>Hôm nay: ${V.chuoi}<color>` : ""}`, [...nut, ...lai]);
  }, loi);
  if (viec === "ruou") {
    const co = bdDem(BD_MON.ruou);
    if (!co) return vs(`Hành trang không có Đỗ Khang Tửu.<enter>${BD_NGUON[BD_MON.ruou]}`, lai);
    const max = Math.min(co, 100); // máy chủ: tối đa 100 bình mỗi lần
    return GW.chonSo({ tieuDe: "Mời võ sư dùng Đỗ Khang Tửu", ten: `${bdTen(BD_MON.ruou)} (có ${co})`, toiDa: max, toiThieu: 1, san: max, thongTin: (n) => `Mời ${n} bình${co > 100 ? " — mỗi lần tối đa 100 bình" : ""}` })
      .then((n) => (n ? bdGoi({ viec: "moiRuou", n }).then((j) => vs(`${bdKetQua(j)}`,
        [...(bdDem(BD_MON.ruou) > 0 ? [["Mời thêm Đỗ Khang Tửu", "BaoDapAnSu:ruou"]] : []), ...lai]), loi) : ve()));
  }
  if (viec === "dang") return bdTt().then((S) => {
    const co = bdDem(BD_MON.hbNs), D = S.dangHb, con = D && D.toiDa ? Math.max(0, (D.toiDa | 0) - (D.da | 0)) : co;
    if (!co) return vs(`Hành trang không có ${bdTen(BD_MON.hbNs)}.<enter>Ngũ Sắc Hương Bao do Chưởng Đăng Cung Nữ (Ba Lăng huyện) làm từ 1 Tây Hồ Long Tĩnh Trà + 1 Sợi chỉ màu.`, lai);
    if (!S.mo) return vs(bdHet(S), lai);
    if (con <= 0) return vs(`Mỗi ngày chỉ có thể tặng ${D.toiDa} Ngũ Sắc Hương Bao !`, lai); // câu client (config.lua [23])
    const max = Math.min(co, con);
    return GW.chonSo({ tieuDe: "Dâng tặng Ngũ Sắc Hương Bao", ten: `${bdTen(BD_MON.hbNs)} (có ${co})`, toiDa: max, toiThieu: 1, san: max, thongTin: (n) => (D && D.toiDa ? `Dâng ${n} — hôm nay còn ${con} lần` : `Dâng ${n}`) })
      .then((n) => (n ? bdGoi({ viec: "dang", n }).then((j) => vs(bdKetQua(j, `Đã dâng tặng ${n} ${bdTen(BD_MON.hbNs)}.`), [...(bdDem(BD_MON.hbNs) > 0 ? [["Dâng tặng thêm", "BaoDapAnSu:dang"]] : []), ...lai]), loi) : ve()));
  });
  // trang chính (lựa chọn "Hoạt động báo đáp ân sư" ở khung Say của Võ sư)
  return bdTt().then((S) => {
    if (!S.mo) return vs(bdHet(S), [["Giới thiệu hoạt động báo đáp ân sư", "BaoDapAnSu:gioiThieu"], ["Rời khỏi", null]]);
    const R = S.ruou, D = S.dangHb;
    const hom = [R && R.tran ? `kinh nghiệm từ rượu <color=yellow>${fmtSo(+R.kn || 0)} / ${fmtSo(R.tran)}<color>` : "", D && D.toiDa ? `đã dâng <color=yellow>${D.da | 0} / ${D.toiDa}<color> hương bao` : ""].filter(Boolean).join(", ");
    return vs(`Lại một năm sương phong mưa tuyết, lại một năm đào lê tỏa hương,  Không biết đệ tử của ta hành tẩu giang hồ ra sao rồi?<enter>Trong hành trang: ${bdDem(BD_MON.ruou)} ${bdTen(BD_MON.ruou)} · ${bdDem(BD_MON.hbNs)} ${bdTen(BD_MON.hbNs)}${hom ? `<enter>Hôm nay: ${hom}.` : ""}`,
      [["Giới thiệu hoạt động báo đáp ân sư", "BaoDapAnSu:gioiThieu"], ...(hero.nsk ? [["Nhiệm vụ ngày lễ", "BaoDapAnSu:nvLe"]] : []), ["Mời võ sư dùng Đỗ Khang Tửu", "BaoDapAnSu:ruou"], ["Dâng tặng Ngũ Sắc Hương Bao", "BaoDapAnSu:dang"], ["Rời khỏi", null]]);
  });
}
// Chưởng Đăng Cung Nữ: viec "" (trang chính) | "doi" (loai tt / ns / td) | "muaTo" | "gioiThieu"
function cungNuFn(viec, loai, id, npc) {
  const cn = (text, opts) => ({ desc: 1, text: CUNG_NU + text, opts });
  const lai = [["Trở lại", "ChuongDang"], ["Rời khỏi", null]];
  const loi = (e) => (e && (e.ma === "het-phien" || e.boQua) ? { close: true } : cn(String((e && e.message) || "Lát nữa hãy quay lại."), lai));
  const ve = () => cungNuFn("", "", "ChuongDang", npc);
  if (viec === "gioiThieu") return bdTt().then((S) => cn(bdGioiThieu(S), lai));
  if (viec === "doi") {
    const [hb, nl] = BD_HB[loai] || []; if (!hb) return cn("Việc không rõ.", lai);
    const tra = bdDem(BD_MON.tra), co = bdDem(nl), max = Math.min(tra, co);
    if (max < 1) return cn(`Đổi 1 <color=yellow>${bdTen(hb)}<color> cần 1 <color=yellow>${bdTen(BD_MON.tra)}<color> + 1 <color=yellow>${bdTen(nl)}<color>. Trong hành trang có ${tra} ${bdTen(BD_MON.tra)}, ${co} ${bdTen(nl)}.<enter>${tra < 1 ? BD_NGUON[BD_MON.tra] : BD_NGUON[nl] || ""}`, lai);
    // ô số lượng của client hẹp (≈ 22 chữ / dòng — anh 17/11 ảnh "Cần 1 Tây Hồ Long Tĩnh" bị cắt): tiêu đề "Đổi hương bao", dòng cần dùng tên ngắn (trà + nguyên liệu)
    const ngan = { [BD_MON.to]: "Tơ Tằm", [BD_MON.chi]: "chỉ màu", [BD_MON.duoc]: "Trung Dược" }[nl] || bdTen(nl);
    return GW.chonSo({ tieuDe: "Đổi hương bao", ten: bdTen(hb), toiDa: max, toiThieu: 1, san: max, thongTin: (n) => `Cần ${n} trà + ${n} ${ngan}` })
      .then((n) => (n ? bdGoi({ viec: "doi", loai, n }).then((j) => cn(bdKetQua(j, `Ngươi nhận được ${n} ${bdTen(hb)}.`), [...(Math.min(bdDem(BD_MON.tra), bdDem(nl)) > 0 ? [["Đổi tiếp", id]] : []), ...lai]), loi) : ve()));
  }
  if (viec === "muaTo") {
    const gia = (bdTtCu && bdTtCu.giaTo) || 30000, vang = hero.gold || 0, max = Math.min(Math.floor(vang / gia), 999);
    if (max < 1) return cn(`Mỗi ${bdTen(BD_MON.to)} giá <color=yellow>${fmtMoney(gia)}<color> — ngân lượng mang theo không đủ (có ${fmtMoney(vang)}).`, lai);
    return GW.chonSo({ tieuDe: "Mua Tơ Tằm", ten: `${bdTen(BD_MON.to)} — ${fmtMoney(gia)} mỗi cái`, toiDa: max, toiThieu: 1, san: 1, thongTin: (n) => `Cần ${fmtMoney(n * gia)}` })
      .then((n) => (n ? bdGoi({ viec: "muaTo", n }).then((j) => cn(bdKetQua(j, `Ngươi đã mua ${n} ${bdTen(BD_MON.to)}.`), [["Mua thêm", "ChuongDang:muaTo"], ...lai]), loi) : ve()));
  }
  // trang chính
  return bdTt().then((S) => {
    if (!S.mo) return cn(bdHet(S), [["Giới thiệu hoạt động báo đáp ân sư", "ChuongDang:gioiThieu"], ["Rời khỏi", null]]);
    const co = [[BD_MON.tra, "trà"], [BD_MON.to, "Tơ Tằm"], [BD_MON.chi, "Sợi chỉ màu"], [BD_MON.duoc, "Trung Dược"]].map(([k, t]) => `${bdDem(k)} ${t}`).join(" · ");
    return cn(`Gần đây ta cần 1 ít Tây Hồ long tĩnh trà, tơ lụa, sợi chỉ màu, trung dược , ta rất cần gấp những thứ này, nếu như ngươi tặng ta những thứ trên, ta sẽ tặng cho ngươi phần thưởng<enter>Trong hành trang: ${co}`,
      [["Giới thiệu hoạt động báo đáp ân sư", "ChuongDang:gioiThieu"], ["Đổi tơ tằm hương bao (1 trà + 1 Tơ Tằm)", "ChuongDang:doi:tt"], ["Đổi ngũ sắc hương bao (1 trà + 1 Sợi chỉ màu)", "ChuongDang:doi:ns"], ["Đổi trung dược hương bao (1 trà + 1 Trung Dược)", "ChuongDang:doi:td"], // anh 17/11 "chỗ đổi quà chưa rõ ràng, k biết cần gì và gì": nhãn ghi nguyên liệu
        [`Mua Tơ Tằm (${fmtMoney(S.giaTo)})`, "ChuongDang:muaTo"], ["Rời khỏi", null]]);
  });
}
// ---------- Khảm nạm Thủy tinh (anh 16/11 tối, chốt 17/11 — may-chu/kham-nam.js; khung khảm client ui3 打造物品.ini — windows.js _kham) ----------
// Thợ rèn Ba Lăng / Biện Kinh (script client 巴陵县_铁匠对话.lua, 汴京_铁匠1对话.lua, 汴京_铁匠2对话.lua): thêm "Khảm nạm" / "Liên quan khảm nạm" sau "Giao dịch"
// (như client: Giao dịch · Khảm nạm · Liên quan khảm nạm · Không giao dịch — themKhamNam); máy chủ chưa có khảm (LUAT không có khamNam) thì ẩn (npcApi anOpt).
// Thương nhân thần bí (NPC thêm — npc-them.json script "s1:thuong-nhan", hình Thần Bí Thương Nhân Liễu Ất của client, có chân dung): bán Hoán Linh Thạch bằng Xu
const THO_REN = /(巴陵县_铁匠对话|汴京_铁匠[12]对话)\.lua$/;
const THUONG_NHAN = "<link=image[0,14]:\\spr\\npcres\\passerby\\passerby184\\passerby184_pst.spr>Thương nhân thần bí:<link> "; // chân dung: cong-cu/dung-chan-dung-npc.mjs THEM
const KN_HE = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
let knLuatCu = null; // luật khảm nạm máy chủ trả gần nhất (luat() đè bản lúc vào game)
const khamBao = (j) => {
  const msg = typeof j.msg === "string" ? j.msg : "";
  if (msg) { if (j.ok === 0) P.hud.canh(msg); else P.hud.msg(/<color/i.test(msg) ? phanMauDn(msg) : msg); } // thất bại: chữ đỏ ô tin như client ("Thao tác khảm nạm … thất bại!")
  for (const t of Array.isArray(j.tin) ? j.tin : []) P.hud.msg(phanMauDn(t));
};
// cho = promise (anh 17/11 lần 2 "hiệu ứng chạy 2 lần … xong mới hiện thông báo thành công hay thất bại"): túi / tiền cập nhật ngay (không giữ bản cũ — tránh đè số mới hơn),
// câu báo đợi hiệu ứng của khung khảm chạy xong (windows.js _khamHieuUng)
const khamApply = (j, cho) => {
  if (!j) return j;
  if (j.khamNam) knLuatCu = j.khamNam;
  applyServer(j);
  if (cho) Promise.resolve(cho).then(() => khamBao(j)); else khamBao(j);
  return j;
};
const khamGoi = (b, o) => Net.khamNam(hero.slot | 0, b).then((j) => khamApply(j, o && o.sau));
// Hoán hình / Hoán tính (anh 17/11 lần 2 — may-chu/kham-nam.js hoanHinh / hoanTinh): khung Giao vật phẩm của client (GW.giaoDo) — đặt 1 món + 1 phù / lệnh, Xác nhận;
// Hoán hình: khung chọn của NPC liệt kê 9 vũ khí khác cùng đẳng cấp (ItemDB — đồ xanh, cùng do-goc cl); Hoán tính: món đối giới cùng loại cùng cấp (ghép như máy chủ doiGioi);
// rồi khung hỏi của game (tỉ lệ, phí) -> POST /api/kham-nam; câu báo thành công / thất bại ở ô tin (khamApply)
const hoanXanh = () => (ItemDB.pack && Array.isArray(ItemDB.pack.items) ? ItemDB.pack.items : []).filter((x) => x && x.gr === "xanh" && ItemDB.base(x.k).cl);
function hoanDoiGioi(k) {
  const x = ItemDB.item(k); if (!x || x.gr !== "xanh" || !(x.x === 0 || x.x === 1) || x.t === 0 || x.t === 1) return null;
  const cl = ItemDB.base(k).cl, cung = hoanXanh().filter((y) => y.t === x.t && ItemDB.base(y.k).cl === cl);
  const A = cung.filter((y) => y.x === x.x).sort((a, b) => a.p - b.p), B = cung.filter((y) => y.x === 1 - x.x).sort((a, b) => a.p - b.p), i = A.findIndex((y) => y.k === k);
  return i >= 0 && i < B.length ? B[i].k : null;
}
function hoanMo(loai) {
  if (!GW || !hero) return;
  const hh = loai === "hh", L = luat().khamNam || {}, D = (hh ? L.hh : L.ht) || {}, tenDa = String((ItemDB.item(D.k) || {}).n || (hh ? "Hoán Hình Phù" : "Hoán Tính Lệnh")).trim();
  const tl = D.tl ?? 50, phi = fmtMoney(+D.phi || 0), tenM = (k) => String((ItemDB.item(k) || {}).n || k).trim();
  const loi = hh ? `Đặt vào khung 1 vũ khí (đồ xanh, tháo ra hành trang trước) và 1 <color=yellow>${tenDa}<color>, bấm Xác nhận rồi chọn vũ khí mới cùng đẳng cấp — giữ ngũ hành và các dòng. Thành công ${tl}%, phí ${phi}; trượt mất phù và phí, vũ khí giữ nguyên.`
    : `Đặt vào khung 1 trang bị (áo, mũ, dây chuyền, giày, hộ uyển, ngọc bội — tháo ra hành trang trước) và 1 <color=yellow>${tenDa}<color>: bản nam đổi thành bản nữ cùng đẳng cấp (hoặc ngược lại), giữ ngũ hành và các dòng. Thành công ${tl}%, phí ${phi}; trượt mất lệnh và phí, trang bị giữ nguyên.`;
  GW.giaoDo({ tieuDe: hh ? "Hoán hình vũ khí" : "Hoán tính trang bị", loi }).then((ds) => {
    if (!ds || !hero) return;
    const bag = hero.bag || [], L2 = ds.map((u) => bag.find((b) => b.u === u)).filter(Boolean), da = L2.find((b) => b.k === D.k), mon = L2.filter((b) => b.k !== D.k);
    if (!da) return P.hud.canh(`Chưa đặt ${tenDa} vào khung`);
    if (mon.length !== 1) return P.hud.canh(mon.length ? "Mỗi lần chỉ đổi 1 món" : (hh ? "Chưa đặt vũ khí vào khung" : "Chưa đặt trang bị vào khung"));
    const it = mon[0], x = ItemDB.item(it.k) || {}, vk = x.t === 0 || x.t === 1;
    if (x.gr !== "xanh" || !ItemDB.base(it.k).cl) return P.hud.canh("Chỉ đổi được trang bị đồ xanh");
    if (it.het) return P.hud.canh("Trang bị có hạn sử dụng không đổi được");
    const lam = (b, cau) => GW.hoi(cau, hh ? "Hoán hình" : "Hoán tính", "Thôi").then((ok) => { if (ok) { P.audio.ui("click"); khamGoi(b).catch((e) => P.hud.canh(String((e && e.message) || e))); } });
    if (hh) {
      if (!vk) return P.hud.canh(`${tenDa} chỉ dùng cho vũ khí — áo, mũ… đổi nam / nữ bằng Hoán Tính Lệnh`);
      const cl = ItemDB.base(it.k).cl, ds2 = hoanXanh().filter((y) => (y.t === 0 || y.t === 1) && y.k !== it.k && ItemDB.base(y.k).cl === cl);
      if (!ds2.length) return P.hud.canh("Không có vũ khí nào khác cùng đẳng cấp");
      const chon = (k) => lam({ viec: "hoanHinh", u: it.u, da: da.u, k }, `Hoán hình <color=yellow>${tenM(it.k)}<color> thành <color=yellow>${tenM(k)}<color> (${ItemDB.type(ItemDB.item(k)).toLowerCase()}), giữ ngũ hành và các dòng?<enter>Thành công ${tl}%, phí ${phi}. Trượt mất 1 ${tenDa} và phí, vũ khí giữ nguyên.`);
      NPCD.choose("msgsel", "InfoText", richText(`Thợ rèn: ${tenM(it.k)} (đẳng cấp ${cl}) có thể đổi sang các vũ khí sau. Đại hiệp chọn dáng nào?`, hero.name),
        [...ds2.map((y) => [`${tenM(y.k)} — ${ItemDB.type(y).toLowerCase()}`, () => chon(y.k)]), ["Để ta suy nghĩ lại", null]]);
      return;
    }
    if (vk) return P.hud.canh(`Vũ khí dùng chung nam nữ — đổi loại vũ khí bằng Hoán Hình Phù`);
    const k2 = hoanDoiGioi(it.k);
    if (!k2) return P.hud.canh(`${tenM(it.k)} không có bản ${x.x === 1 ? "nam" : x.x === 0 ? "nữ" : "khác giới"} cùng đẳng cấp (đai, nhẫn dùng chung nam nữ)`);
    lam({ viec: "hoanTinh", u: it.u, da: da.u }, `Hoán tính <color=yellow>${tenM(it.k)}<color> (${x.x === 0 ? "nam" : "nữ"}) thành <color=yellow>${tenM(k2)}<color> (${x.x === 0 ? "nữ" : "nam"}), giữ ngũ hành và các dòng?<enter>Thành công ${tl}%, phí ${phi}. Trượt mất 1 ${tenDa} và phí, trang bị giữ nguyên.`);
  });
}
// Trợ Thủ "ở lại trận": sắp hết thuốc (mức Treo máy) -> chạy về Quân Nhu quan gần nhất mua theo danh sách mua của Treo máy (không bán / cất); 60 giây
// mới thử lại 1 lần
let phMua = null, phMuaLuc = 0;
function phMuaTick() {
  const w = world, T = hero.auto.treo, p = w.player;
  if (!laPh(w.zone) || !w.auto || !phO() || p.hp <= 0) { if (phMua) { phMua = null; w.holdMove = false; } return; }
  if (!phMua) {
    const can = (T.thuocOn && hpPotions() <= T.thuoc) || (T.nlOn && mpPotions() <= T.nl);
    if (!can || !T.mua.some((m) => m.on) || performance.now() < phMuaLuc) return;
    const n = w.npcs.filter((x) => x.ph === "qn").sort((a, b) => ldist(p.x, p.y, a.x, a.y) - ldist(p.x, p.y, b.x, b.y))[0]; if (!n) return;
    phMua = { n, t0: performance.now() }; P.hud.msg("Trợ Thủ: sắp hết thuốc — về Quân Nhu quan mua");
  }
  w.holdMove = true; if (p.target) { p.target = null; p.path = null; }
  if (ldist(p.x, p.y, phMua.n.x, phMua.n.y) > 80 && performance.now() - phMua.t0 < 25000) { if (!p.goal) w.walkTo(phMua.n.x, phMua.n.y); return; }
  if (phMua.dang) return;
  phMua.dang = true;
  const truoc = hpPotions() + mpPotions();
  doItem({ act: "thanh", ban: 0, mua: T.mua.filter((m) => m.on).map((m) => [m.k, m.n]) }).finally(() => {
    for (const m of T.mua) if (m.on && potCount(m.k)) quickAdd(m.k);
    // không mua thêm được bình nào (thiếu tiền / túi đầy): 5 phút sau mới thử lại — không chạy đi chạy lại bỏ đánh
    const duoc = hpPotions() + mpPotions() > truoc;
    if (!duoc) P.hud.canh("Trợ Thủ: không mua được thuốc ở Quân Nhu quan (thiếu tiền hoặc hành trang đầy) — đánh tiếp, 5 phút sau thử lại");
    phMua = null; phMuaLuc = performance.now() + (duoc ? 60000 : 300000); if (world) world.holdMove = false;
  });
}
// ---------- Boss Sát thủ (anh 27/10 — may-chu/sat-thu.js, assets/data/sat-thu.json — cong-cu/dung-sat-thu.mjs) ----------
// Nhiếp Thí Trần (Ba Lăng): nhận nhiệm vụ theo bậc cấp, chọn 1 trong 20 boss, hợp thành Sát thủ giản. Có nhiệm vụ thì vào bãi của boss là boss
// đứng ở chỗ của nó (boss riêng từng người như quái bãi luyện công), tên cam "BOSS Sát thủ - tên"; hạ xong máy chủ trả thưởng (do.js loại 3).
function satThu(b) {
  if (!hero) return;
  const w0 = world; // bản đồ lúc hỏi: khung Giao vật phẩm chỉ gửi khi còn ở đó (soát 13/11)
  Net.satThu(hero.slot | 0, b).then((j) => xuLySatThu(j, w0)).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
function xuLySatThu(j, w0 = world) {
  applyServer(j);
  for (const t of j.tin || []) P.hud.msg(t);
  if (GW) GW.refresh(true);
  const ten = "Nhiếp Thí Trần";
  if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, ten), j.say.opts.map(([nhan, viec, x]) => [nhan, viec ? () => satThu({ viec, cap: x, id: x }) : null]));
  if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, ten)), 0, null);
  // khung Giao vật phẩm chỉ khi còn ở bản đồ lúc hỏi (trả lời tới sau khi đã đi: không mở; đổi bản đồ lúc đang mở: loadZone đóng) — máy chủ chặn việc của NPC gọi từ bản
  // đồ khác (soát 13/11)
  if (j.giao && GW) { if (world !== w0) P.hud.canh(`Đã rời chỗ ${ten} — nói chuyện lại`); else GW.giaoDo(j.giao).then((ds) => { if (ds && world === w0) satThu({ viec: j.giao.viec, u: ds }); }); }
  if (j.di) diPld(j.di);
  return j;
}
// boss của nhiệm vụ đang nhận ở bãi đang đứng: chưa có thì dựng ở chỗ của nó (mẫu, cấp, hệ máy chủ bốc); đổi / bỏ nhiệm vụ thì bỏ boss cũ
function datBossSat() {
  const w = world; if (!w || !hero) return;
  const S = hero.satThu, b = S && S.nv && P.satThu ? P.satThu.boss[S.nv] : null;
  const cu = w.mobs.find((m) => m.sat && m.alive && !m.vaDoi); // boss riêng (boss chung ở bản quái chung: quaichung.js — m.vaDoi)
  if (cu && (!b || cu.sat !== S.nv)) w.mobs.splice(w.mobs.indexOf(cu), 1);
  // bãi có bản quái chung (anh 03/11 "đưa boss sát thủ lên bãi chung hết"): boss chỉ ra ở bản chung, máy chủ sinh (may-chu/quai-chung.js satBai)
  if (!b || b.bai !== w.zone.id || laQc(w.zone) || (cu && cu.sat === S.nv) || w.mobs.some((m) => m.sat === S.nv && !m.alive && !m.vaDoi)) return;
  const m = w.spawnMob(false, 0, { id: b.tpl, lvl: b.lv, series: S.he | 0, at: [b.x, b.y], sat: S.nv, ten: `BOSS Sát thủ - ${b.ten}` });
  // máu × hệ số bậc (cau-hinh.json satThu.mau — đo tốc độ hạ 27/10; ngoài hệ số bãi canBang như quái thường)
  const k = ((luat().satThu || {}).mau || {})[b.cap];
  if (m && k > 0) { m.hpMax = Math.max(1, Math.round(m.hpMax * k)); m.hp = m.hpMax; }
  // bậc từ doKho.tuCap (anh 28/10: "boss sát thủ trên cấp 90 thấp nhất 3 triệu máu", phải có độ khó): máu, sát thương, chính xác, né tránh máy chủ
  // đặt theo quái thường cùng cấp (do.js SAT_DAT — mẫu boss client mượn cho bậc S1 thêm không theo cấp)
  const D = ((luat().satThu || {}).dat || {})[b.cap];
  if (m && D) { m.hpMax = D.mau; m.hp = D.mau; m.dmg = D.st.slice(); m.ar = D.ar; m.def = D.def; }
}
// ---------- Đảo Tẩy Tủy (anh 28/10 — may-chu/tay-tuy.js, assets/data/tay-tuy.json — cong-cu/dung-tay-tuy.mjs) ----------
// Xa phu Ba Lăng thêm lựa chọn "Đi đảo Tẩy Tủy" (client: script\global\station.lua GotoClearSkillMap — Xa phu 7 thành lớn; Xa phu thôn Ba
// Lăng không có) ngay trên "Không cần đâu"; trên đảo nói chuyện Thích Minh. Máy chủ trả lời (say / talk / tin), đi bản đồ (di), điểm sau khi
// tẩy (tay: { skills } | { attr } — ghi đè điểm của trình duyệt, tính lại điểm còn trống)
// + "Khu vực luyện công" đầu danh sách (anh 29/10: bãi chia theo cấp, bãi cùng cấp chung 1 ô — xaPhuFn KhuLuyenCong)
function themXaPhuTayTuy(D) {
  for (const [k, s] of Object.entries((D && D.scripts) || {})) {
    if (!/驿站车夫对话\.lua$/.test(k)) continue;
    const o = s.nodes && s.nodes.main && s.nodes.main.opts;
    if (o && !o.some((x) => x[1] === "GotoClearSkillMap")) o.splice(Math.max(0, o.length - 1), 0, ["Đi đảo Tẩy Tủy", "GotoClearSkillMap"]);
    if (o && !o.some((x) => x[1] === "KhuLuyenCong")) o.unshift(["Khu vực luyện công", "KhuLuyenCong"]);
    if (o && !o.some((x) => x[1] === "TkBaoDanh")) o.unshift(["Điểm báo danh Tống Kim", "TkBaoDanh"]); // anh 09/11 — xaPhuFn
    if (o && !o.some((x) => x[1] === "KhuBangHoi")) o.unshift(["Khu vực bang hội", "KhuBangHoi"]); // đợt 4 — chỉ hiện với thành viên (anOpt); máy chủ xét (xaPhuFn KhuBangHoi)
    if (o && !o.some((x) => x[1] === "BanDoSatThu")) o.unshift(["Đưa ta đến bản đồ nhiệm vụ sát thủ", "BanDoSatThu"]); // anh 03/11 — chỉ hiện khi đang nhận (NPCD anOpt)
    if (o && !o.some((x) => x[1] === "NoiDaTau")) o.unshift(["Đưa ta đến nơi làm nhiệm vụ Dã Tẩu", "NoiDaTau"]); // anh 11/11 (kiểu A) — đầu danh sách, chỉ hiện khi có nơi làm (anOpt)
  }
}
// Lễ quan (script client 路人_礼官.lua — Ba Lăng): thêm "Nhập mã kích hoạt" đầu danh sách (anh 29/10 — chucNangFn NhapMaKichHoat).
// Anh 29/10 lần 3 ("giao diện Lễ quan hơi trống, bấm Đêm Huy Hoàng nhảy ra khung khác không đồng nhất"): script mở menu bằng DailogClass:Show
// (CreateNewSayEx — lời mặc định "<npc>Chào mừng bạn đến với Võ Lâm Truyền Kỳ…", công cụ dựng dữ liệu không lấy được lời nên khung Say trống)
// -> menu chính cũng là khung Describe có chân dung + tên như các trang Đêm Huy Hoàng; thêm "Kết thúc đối thoại" cuối như DailogClass;
// "Mở Pass Rương" (ResetBox) chạy thật — moPassRuong
const LE_QUAN = "<link=image[0,13]:\\spr\\npcres\\passerby\\passerby181\\passerby181_pst.spr>Lễ quan:<link> ";
function themLeQuan(D) {
  for (const [k, s] of Object.entries((D && D.scripts) || {})) {
    if (!/路人_礼官\.lua$/.test(k)) continue;
    const m = s.nodes && s.nodes.main; if (!m) continue;
    m.t = "desc";
    m.text = [LE_QUAN + "Chào mừng bạn đến với <color=yellow>Võ Lâm Truyền Kỳ<color>!<enter>Ta lo việc ban thưởng của võ lâm: đại hiệp có <color=yellow>mã kích hoạt<color> thì nhập ở chỗ ta để nhận quà; quên mật mã rương chứa đồ thì tìm ta để mở pass rương; vật phẩm không cần nữa, kể cả vật phẩm <color=green>khóa bảo hiểm<color>, thì đưa ta hủy."];
    // anh 05/11: thêm "Hủy vật phẩm" (huyVatPham) trước "Kết thúc đối thoại"
    m.opts = [["Nhập mã kích hoạt", "NhapMaKichHoat"], ...(m.opts || []).filter((x) => x[1] !== "NhapMaKichHoat" && x[1] !== "HuyVatPham" && x[1] != null).map(([t, f]) => [t, t === "Mở Pass Rương" ? "MoPassRuong" : f]),
      ["Hủy vật phẩm", "HuyVatPham"], ["Kết thúc đối thoại", null]]; // anh 12/11: tâm thư (Esc → Ủng hộ tác giả)
  }
}
// Lễ quan → Hủy vật phẩm (anh 05/11: "thêm vào lễ quan 1 chức năng đó là hủy vật phẩm, có thể hủy tất cả các loại vật phẩm bao gồm khóa bảo
// hiểm") — như script client gm_tool\dispose_item.lua DisposeItem: khung Giao vật phẩm (GiveItemUI "Hủy vật phẩm" + câu dặn của script) -> đặt
// món của hành trang (mọi loại, cả món khóa bảo hiểm) -> Xác nhận. S1 hỏi lại 1 lần ở khung hỏi của game (kể tên món sẽ hủy) vì hủy rồi không
// lấy lại được; máy chủ may-chu/do.js act huy (nhật ký quản trị "huy"). Xong: câu client Msg2Player "Thao tác hủy vật phẩm thành công" + Talk
// "Thao tác thành công, kiểm tra lại!"
function huyVatPham() {
  if (!hero || !GW) return;
  const ten = (o) => { const x = ItemDB.item(o.k) || {}, d = (o.d || []).length; return `${o.n > 1 ? o.n + " " : ""}${String(x.n || o.k).trim()}${d ? ` (${d} dòng)` : ""}`; };
  GW.giaoDo({ tieuDe: "Hủy vật phẩm", loi: "Đại hiệp hãy cẩn trọng trong việc hủy vật phẩm, vật phẩm đã hủy không thể lấy lại được!" }).then((ds) => {
    if (!ds || !ds.length || !hero) return;
    // khung hỏi ~50 chữ / dòng, ngắt cả giữa từ -> 3 dòng ngắn: tên mọi món nếu vừa 1 dòng, không thì ≤ ~36 chữ + "và N món khác"
    const mon = ds.map((u) => (hero.bag || []).find((o) => o.u === u)).filter(Boolean), tat = mon.map(ten);
    // món + số lượng đúng như khung hỏi hiện (máy chủ từ chối nếu chồng đã đổi trong lúc khung hỏi đang mở — không hủy nhiều hơn số đã đồng ý)
    const chot = mon.map((o) => ({ u: o.u, k: o.k, n: o.n || 1 }));
    let ke = tat.join(", ");
    if (ke.length > 50) { const L = []; for (const t of tat) { if (L.length && [...L, t].join(", ").length > 36) break; L.push(t); } ke = L.join(", ") + ` và ${tat.length - L.length} món khác`; }
    return GW.hoi(`Hủy <color=yellow>${mon.length}<color> vật phẩm đã đặt vào khung:<enter><color=yellow>${ke}<color><enter>Vật phẩm đã hủy không thể lấy lại được!`, "Hủy vật phẩm", "Hủy bỏ").then((ok) => {
      if (!ok || !hero) return;
      return Net.doItem(hero.slot | 0, { act: "huy", ds: chot }).then((j) => {
        applyServer(j);
        P.hud.msg(j.msg || "Thao tác hủy vật phẩm thành công");
        P.audio.ui("click");
        GW.bao("Lễ quan: Thao tác thành công, kiểm tra lại!");
      });
    });
  }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua) GW.bao(`Lễ quan: ${e.message}`); });
}
// Lễ quan → Mở Pass Rương (anh 29/10 lần 3 — client script\vng_feature\resetbox.lua ResetBox; máy chủ may-chu/do.js act xoaMk): quên mật mã
// rương thì đăng ký xóa, đúng ngày thứ 7 sau ngày đăng ký quay lại xác nhận; quá ngày đó thì đăng ký bị hủy. Lời / lựa chọn như script client,
// hiện ở khung Describe có chân dung như các lời khác của Lễ quan. id: "MoPassRuong" (menu) | "MoPassRuong:dangKy" | ":xacNhan" | ":huy" |
// ":thoiGian" -> Promise trang kế cho NpcDialog (npcdlg.js show)
const ngayXoaMk = (so) => { const s = String(so); return `${+s.slice(6, 8)}-${+s.slice(4, 6)}-${s.slice(0, 4)}`; };
const henXoaMk = (so) => `Pass rương sẽ được xóa vào ngày <color=yellow>${ngayXoaMk(so)}<color><enter>Nếu sau 24h ngày <color=yellow>${ngayXoaMk(so)} <color>đại hiệp không xác nhận thì đăng ký xoá pass rương sẽ bị hủy bỏ!`;
function moPassRuong(id) {
  const viec = id.split(":")[1] || "xem", lai = [["Trở lại", "MoPassRuong"], ["Kết thúc đối thoại", null]];
  return Net.doItem(hero.slot | 0, { act: "xoaMk", viec: viec === "thoiGian" ? "xem" : viec }).then((j) => {
    applyServer(j);
    if (j.msg) P.hud.msg(j.msg);
    const x = j.xoaMk || {};
    hero.xoaMk = x.dk || 0;
    if (viec === "xacNhan" || viec === "huy") return { close: true };
    if (x.dk && (viec === "dangKy" || viec === "thoiGian")) return { desc: 1, text: LE_QUAN + henXoaMk(x.xoa), opts: lai };
    const opts = x.dk ? [...(x.xacNhan ? [["Xác nhận xóa pass rương", "MoPassRuong:xacNhan"]] : []), ["Xem thời gian hoàn thành xóa pass rương", "MoPassRuong:thoiGian"], ["Hủy xóa pass rương", "MoPassRuong:huy"]]
      : [["Đăng ký xóa pass rương", "MoPassRuong:dangKy"]];
    const them = x.dk ? `<enter>${henXoaMk(x.xoa)}` : `<enter>Quên mật mã rương chứa đồ: đăng ký xóa pass rương, đúng ngày thứ 7 sau ngày đăng ký đến gặp ta xác nhận thì mật mã được xóa.${x.coMk ? "" : "<enter><color=yellow>Rương chứa đồ của đại hiệp hiện chưa có mật mã.<color>"}`;
    return { desc: 1, text: LE_QUAN + "Đại hiệp tìm ta có việc gì?" + them, opts: [...opts, ["Thoát", null]] };
  }, (e) => (e.ma === "het-phien" ? { close: true } : { desc: 1, text: LE_QUAN + e.message, opts: lai }));
}
// khung nhập chữ của client -> máy chủ kiểm mã (may-chu/ma-qua.js) -> túi mới + khung báo quà như quà của quản trị
function nhapMaKichHoat() {
  if (!hero || !GW) return;
  GW.nhapChu({ tieuDe: "Nhập mã kích hoạt", toiDa: 32 }).then((ma) => {
    if (!ma || !hero) return;
    return Net.maQua(hero.slot | 0, ma).then((j) => {
      applyServer(j);
      P.audio.ui("levelup");
      P.hud.msg(`Kích hoạt mã thành công — nhận được: ${j.ds.join(", ")}`, MAU_TIN.kn);
      // mã khóa (anh 11/11 — may-chu/ma-qua.js j.khoa: có món thật sự khóa; j.khoaTru: món luôn không khóa có trong quà — Mật đồ thần bí)
      GW.bao(`Lễ quan: Kích hoạt mã thành công!<enter>Bạn nhận được: <color=yellow>${j.ds.join(", ")}<color>${j.khoa ? `<enter>Vật phẩm nhận được đã khóa bảo hiểm vĩnh viễn${j.khoaTru ? ` (trừ ${j.khoaTru})` : ""} — không giao dịch, bày bán được` : ""}${j.loi ? `<enter>${j.loi}` : ""}`);
    });
  }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua) GW.bao(`Lễ quan: ${e.message}`); });
}
// ---------- Đổi môn phái (anh 11/11 — may-chu/doi-phai.js): Tín vật môn phái (Kỳ Trân Các, 100 Xu) mang tới NPC môn phái của mình ở Ba Lăng ----------
// Lời đệ tử (cases.member) của 10 NPC môn phái thêm "Đổi môn phái" trước lựa chọn đóng. Khung NPC (npcdlg api.fn -> chucNangFn -> doiPhaiFn):
//   DoiMonPhai            hỏi xác nhận (chưa có Tín vật: dặn mua)        DoiMonPhaiXN   máy chủ roi -> Vô Môn Phái, chờ bái nhập (hero.doiPhai)
//   DoiPhaiMoi:<khóa>     Vô Môn Phái chờ đổi phái nói chuyện NPC phái <khóa> (npcdlg caseOf — mọi hệ): giới tính không hợp thì từ chối, không thì mời
//   DoiPhaiChon:<khóa>    có chiêu 90 mang sang: chọn chiêu 90 chính (nhận cấp cao nhất — anh chọn "đổi 1-1, tự chọn")
//   DoiPhaiNhap:<khóa>:<mã chiêu 90 chính | 0>   máy chủ nhap -> áp phái mới rồi chạy lệnh nhập phái của script (SetCamp / SetRank / câu chào…)
const TIN_VAT_PHAI = "ms:1670";
// cấp chiêu 90 / 120 đang chờ mang sang (hero.doiPhai — bản máy chủ: c90 [{ id, lv, e }], c120 { id, lv, e } | null)
const dpCap = (dp) => ({ c90: ((dp && dp.c90) || []).map((c) => (c && typeof c === "object" ? c.lv | 0 : c | 0)), c120: dp && dp.c120 != null ? (typeof dp.c120 === "object" ? dp.c120.lv | 0 : dp.c120 | 0) : null });
function tayTuy(b) {
  if (!hero) return;
  Net.tayTuy(hero.slot | 0, b).then(xuLyTayTuy).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
function xuLyTayTuy(j) {
  applyServer(j);
  for (const t of j.tin || []) P.hud.msg(t);
  if (j.tay) {
    if (j.tay.skills) hero.skills = { ...j.tay.skills };
    if (j.tay.attr) hero.attr = { ...j.tay.attr };
    hero.pts = null; hero.skPts = null; fixPoints(hero); if (world) world.refreshStats(false); skillHud(); save();
  }
  if (GW) GW.refresh(true);
  const ten = world && laDao(world.zone) ? "Thích Minh" : "Xa phu";
  if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, ten), j.say.opts.map(([nhan, viec]) => [nhan, viec ? () => tayTuy({ viec }) : null]));
  if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, ten)), 0, null);
  if (j.di) diPld(j.di);
  return j;
}
// ---------- Vượt Ải (anh 28/10 — may-chu/vuot-ai.js, assets/data/vuot-ai.json — cong-cu/dung-vuot-ai.mjs) ----------
// Nhiếp Thí Trần → Thử luyện sát thủ → Tham gia khiêu chiến: nộp Sát Thủ Giản + ngân lượng (lần thứ 1–4 trong ngày: 1 / 2 / 4 / 8 giản) -> bãi
// ải (bản đồ 杀手的试炼 của client). 28 đám quái lần lượt: máy chủ đếm từng con (do.js loại 4), hạ hết đám thì máy chủ thưởng + chuyển đám,
// trình duyệt thấy hero.va.dang.dot đổi thì sinh đám mới (vaTick). 30 phút; xong / hết giờ / tử vong -> về Ba Lăng. Câu báo theo kịch bản client.
function vuotAi(b) {
  if (!hero) return;
  Net.vuotAi(hero.slot | 0, b).then(xuLyVa).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
function xuLyVa(j) {
  applyServer(j);
  for (const t of j.tin || []) P.hud.msg(t);
  if (GW) GW.refresh(true);
  if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, "Nhiếp Thí Trần")), 0, null);
  if (j.di) diPld(j.di);
  return j;
}
const giayMs = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const vanLuong = (n) => (n % 10000 ? fmtSo(n) + " lượng" : n / 10000 + " vạn");
// sinh phần còn thiếu của đám D.dot (số con của nhóm − số máy chủ đã nhận): đội hình lineup<n> của client / điểm cố định. Tiểu boss mang tên +
// hệ người chơi ở lần đầu, sau đó tên dự phòng + hệ ngẫu nhiên (func_npc_getname / getseries — quái thường cùng đám theo hệ đó); đám cuối mỗi
// con 1 tên (func_npc_get_eachname). Máu × hero.va.mau[bậc] (cau-hinh.json vuotAi.mau — ải client làm cho đội 8 người). Quái đứng đội hình,
// chỉ lao vào khi người chơi tới gần va.nhin điểm / bị đánh, kéo theo con đứng trong va.keo quanh nó (World.keoNhom — anh 28/10)
function sinhDot(w, D) {
  const V = P.vuotAi, B = V && V.cap.find((c) => c.cap === D.cap), d = B && B.dot[D.dot - 1]; if (!d) return 0;
  const k = ((hero.va && hero.va.mau) || {})[D.cap] ?? 1, du = (i) => V.tenDu[i % V.tenDu.length];
  // máu đặt sẵn (cau-hinh.json vuotAi.mauDat — anh 28/10: sơ cấp quái 60–100 nghìn, boss 1–2 triệu; cao cấp gấp đôi): quái tăng dần theo đám,
  // tiểu boss tăng dần theo đám, Nhiếp Thí Trần mức cao, 8 sát thủ đám cuối mức thấp. Không khai thì máu client × hero.va.mau[bậc] như cũ
  const MD = ((hero.va && hero.va.mauDat) || {})[D.cap], soDot = B.dot.length;
  const mauDat = (g) => {
    if (!MD) return 0;
    const giua = (r, t) => Math.round(r[0] + (r[1] - r[0]) * Math.min(1, Math.max(0, t)));
    if (!g.boss) return giua(MD.quai, (D.dot - 1) / Math.max(1, soDot - 3));
    if (g.tenMoiNguoi) return MD.boss[0];
    if (g.tenNguoi) return giua(MD.boss, (D.dot - 4) / Math.max(1, soDot - 5));
    return MD.boss[1];
  };
  let tb = B.dot.slice(0, D.dot - 1).reduce((a, x) => a + x.ds.filter((g) => g.tenNguoi).length, 0), n = 0; // tiểu boss thứ mấy trong ải
  for (const [gi, g] of d.ds.entries()) {
    for (let i = D.giet[gi] | 0; i < g.n; i++) {
      const id = g.tpl || (() => { const [a, b] = g.tieuBoss[hero.sex === "f" ? 1 : 0]; return a + Math.floor(Math.random() * (b - a + 1)); })(); // nam / nữ theo người chơi
      const at = g.cho === "xep" ? (V.xep[g.n] || [])[i] : g.cho;
      const ten = g.ten || (g.tenNguoi ? (tb ? du(tb - 1) : hero.name) : g.tenMoiNguoi ? (i ? du(i - 1) : hero.name) : null);
      const he = g.he === "nguoi" ? (tb ? Math.floor(Math.random() * 5) : hero.series | 0) : g.he >= 0 ? g.he : Math.floor(Math.random() * 5);
      const md = mauDat(g);
      const m = vaQuai(w, B, { id, lv: g.lv, he, ten, boss: g.boss, hp: md, at: at ? (g.cho === "xep" ? at : [at[0] + (i % 3 - 1) * 30, at[1] + ((i / 3) | 0) * 15]) : null });
      if (!m) continue;
      if (!md && k > 0 && k !== 1) { m.hpMax = Math.max(1, Math.round(m.hpMax * k)); m.hp = m.hpMax; }
      if (g.cuoi && D.dot === soDot) { m.bossCuoi = 1; m.hung = 1; } // boss cuối Vượt Ải đi 1 mình (anh 18/11 — như VaDoi.api.sinh)
      n++;
    }
    if (g.tenNguoi) tb++;
  }
  return n;
}
// 1 con quái ải (bản 1 người sinhDot + tổ đội vadoi.js): o = { id, lv, he, ten, boss, hp (máu đặt sẵn | 0), at }. Tầm nhìn / kéo nhóm theo
// hero.va (anh 28/10), boss tên cam (Trợ Thủ ưu tiên). Nhóm quái bảng client không có sát thương thường (client đánh bằng võ công quái — chưa
// có; trước đây mỗi đòn chỉ 1 máu): lấy sát thương của tiểu boss cùng ải, cùng cấp (anh 28/10)
function vaQuai(w, B, o) {
  const m = w.spawnMob(false, 0, { id: o.id, lvl: o.lv, series: o.he, ...(o.at ? { at: o.at } : {}) });
  if (!m) return null;
  const V = hero.va || {};
  m.va = 1; if (o.ten) m.name = o.ten;
  if (V.nhin > 0) m.vision = V.nhin; // 0: tầm nhìn VisionRadius của client (rules.js mobStats — quái ải 375, boss 900 điểm; anh 31/10)
  m.keo = V.keo || 0;
  if (o.boss) { m.vaBoss = 1; m.dacBiet = true; }
  const nhomTB = B.dot.flatMap((x) => x.ds).find((x) => x.tieuBoss), tbId = nhomTB ? nhomTB.tieuBoss[0][0] : null;
  if (!m.dmg[0] && !m.dmg[1] && tbId != null) m.dmg = mobStats(w.P.mons[tbId] || {}, tbId, o.lv, false, 75, w.P.mobstats, o.he).dmg.slice();
  if (o.hp) { m.hpMax = o.hp; m.hp = o.hp; }
  return m;
}
// trong ải (mỗi khung hình): dòng giữa trên (đám / còn bao nhiêu con / còn bao lâu), sinh đám khi máy chủ chuyển đám, mỗi phút câu báo của
// timer_board.lua; xong -> 10 giây sau về Ba Lăng; hết giờ / máy chủ đã bỏ ải -> hỏi máy chủ "ra". Anh 28/10: vào ải chờ chuẩn bị (máy chủ đặt
// dang.bd = lúc ra quái — cau-hinh.json vuotAi.chuanBi) rồi mới ra quái; hết mỗi đám nghỉ VA_NGHI giây rồi mới ra đám sau
const VA_NGHI = 5;
// bãi có bản quái chung (anh 02/11 — cau-hinh.json quaiChung.bai, máy chủ gửi trong luat; anh 03/11: bãi chính mỗi dãy cấp có 2 bản, quái riêng +
// quái chung): ở bản chung World không tự sinh quái, QuaiChung lo (src/game/quaichung.js). qcPct: % kinh nghiệm / ngân lượng thêm ở bản chung
const laQc = (z) => !!z && (((luat().quaiChung || {}).bai) || []).includes(z.id);
const qcPct = () => Math.round((((luat().quaiChung || {}).thuong || 1) - 1) * 100);
function vaTick() {
  const w = world; if (!w || !laAi(w.zone) || zoneLoad || !P.vuotAi) return;
  if (hero.va && hero.va.dang && hero.va.dang.phong) return vaTickDoi(w, hero.va.dang);
  const V = hero.va, D = V && V.dang, B = D && P.vuotAi.cap.find((c) => c.cap === D.cap), bay = performance.now();
  const S = w._va || (w._va = { dot: 0, sinh: 0, ra: -1e9, phut: -1, ket: 0 });
  if (S.vaObj !== V) { S.vaObj = V; S.lech = V ? V.gio - Date.now() : 0; } // giờ máy chủ − giờ máy (lúc nhận)
  const hoiRa = () => { if (bay - S.ra > 5000 && !pending.kills.length && !pulsing) { S.ra = bay; vuotAi({ viec: "ra" }); } };
  if (!D || !B || D.cap !== w.zone.cap) { P.hud.setThuyen("Thách thức thời gian đã kết thúc"); return hoiRa(); }
  const now = Date.now() + S.lech, con = D.han - (now - D.bd) / 1000, song = w.mobs.filter((m) => m.va && m.alive).length;
  const ten = `Thách thức thời gian ${B.cap === 2 ? "cao cấp" : "sơ cấp"}`;
  if (D.ket) {
    S.ket = S.ket || bay;
    const sau = 10 - (bay - S.ket) / 1000;
    P.hud.setThuyen(`Đã vượt qua cả ${D.tong} đám quái! Về Ba Lăng sau ${Math.max(0, Math.ceil(sau))} giây`);
    if (sau <= 0) hoiRa();
    return;
  }
  if (now < D.bd) return P.hud.setThuyen(`${ten}  ·  Chuẩn bị — quái xuất hiện sau ${giayMs((D.bd - now) / 1000)}`); // chưa tính 30 phút
  if (con <= 0) { P.hud.setThuyen("Hết giờ — khiêu chiến thất bại"); return hoiRa(); }
  if (S.dot !== D.dot) { // đám mới (máy chủ đã chuyển): lần đầu / vào lại giữa chừng ra ngay, hết đám thì nghỉ VA_NGHI giây
    if (S.dot && !S.choDen) S.choDen = bay + VA_NGHI * 1000;
    if (S.choDen && bay < S.choDen) return P.hud.setThuyen(`${ten}  ·  Đã hạ đám ${S.dot} — đám ${D.dot} xuất hiện sau ${Math.ceil((S.choDen - bay) / 1000)} giây  ·  ${giayMs(con)}`);
    S.choDen = 0;
    for (const m of w.mobs) if (m.va && m.alive) { m.alive = false; if (w.player.target === m) w.player.target = null; } // quái đám cũ còn sống (công cụ thử nhảy đám)
    w.mobs = w.mobs.filter((m) => !m.va || m.hp <= 0);
    S.dot = D.dot; S.sinh = bay;
    const n = sinhDot(w, D); if (n) P.hud.msg(`Xuất hiện ${n} con quái!`);
  } else if (!song && bay - S.sinh > 4000 && !pending.kills.length && !pulsing) { S.sinh = bay; sinhDot(w, D); } // đã hạ hết mà máy chủ chưa nhận đủ: sinh lại phần thiếu
  const phut = Math.floor((D.han - con) / 60);
  if (phut > S.phut) { if (S.phut >= 0) P.hud.msg(`Nhiệm vụ 'Thách thức Thời gian' đã bắt đầu rồi ${phut} phút, bây giờ là đám quái thứ ${D.dot}, còn dư ${song} con quái.`); S.phut = phut; }
  P.hud.setThuyen(`${ten}  ·  Đám ${D.dot}/${D.tong}  ·  còn ${song} con  ·  ${giayMs(con)}`);
}
// Vượt Ải tổ đội (anh 31/10 — vadoi.js, may-chu/vuot-ai.js phòng): quái theo máy chủ (VaDoi.tick — sinh / máu / mục tiêu / vị trí), dòng giữa
// trên như bản 1 người + số người còn trong ải; xong -> 10 giây sau về Ba Lăng; hết giờ / phòng mất -> hỏi máy chủ "ra"
function vaTickDoi(w, D) {
  const S = w._va || (w._va = { ra: -1e9, phut: -1, ket: 0, dot: 0 }), bay = performance.now();
  const hoiRa = () => { if (bay - S.ra > 5000 && !pulsing) { S.ra = bay; vuotAi({ viec: "ra" }); } };
  VaDoi.tick();
  const p = VaDoi.p && VaDoi.p.id === D.phong && VaDoi.p.bai === w.zone.id ? VaDoi.p : null;
  if (!p) {
    if (D.ket || VaDoi.het) { P.hud.setThuyen("Thách thức thời gian đã kết thúc"); return hoiRa(); } // het: máy chủ báo phòng không còn (tắt máy chủ / đã bị đưa ra)
    VaDoi.xin();
    return P.hud.setThuyen("Thách thức thời gian (tổ đội) — đang nối máy chủ…");
  }
  const now = Date.now() + VaDoi.lech, con = p.han - (now - p.bd) / 1000, song = p.hp.filter((x) => x[1] > 0).length;
  const ten = `Thách thức thời gian ${p.cap === 2 ? "cao cấp" : "sơ cấp"} · tổ đội ${p.tv.filter((x) => x[1]).length} người`;
  if (p.ket && p.ket.xong) {
    S.ket = S.ket || bay;
    const sau = 10 - (bay - S.ket) / 1000;
    P.hud.setThuyen(`Đã vượt qua cả ${p.tong} đám quái! Về Ba Lăng sau ${Math.max(0, Math.ceil(sau))} giây`);
    if (sau <= 0) hoiRa();
    return;
  }
  if (p.ket || con <= 0) { P.hud.setThuyen("Hết giờ — khiêu chiến thất bại"); return hoiRa(); }
  if (now < p.bd) return P.hud.setThuyen(`${ten}  ·  Chuẩn bị — quái xuất hiện sau ${giayMs((p.bd - now) / 1000)}`); // chưa tính 30 phút
  if (now < p.sinh) return P.hud.setThuyen(`${ten}  ·  Đã hạ đám ${p.dot - 1} — đám ${p.dot} xuất hiện sau ${Math.ceil((p.sinh - now) / 1000)} giây  ·  ${giayMs(con)}`);
  if (S.dot !== p.dot) { S.dot = p.dot; P.hud.msg(`Xuất hiện ${song} con quái!`); }
  const phut = Math.floor((p.han - con) / 60);
  if (phut > S.phut) { if (S.phut >= 0) P.hud.msg(`Nhiệm vụ 'Thách thức Thời gian' đã bắt đầu rồi ${phut} phút, bây giờ là đám quái thứ ${p.dot}, còn dư ${song} con quái.`); S.phut = phut; }
  P.hud.setThuyen(`${ten}  ·  Đám ${p.dot}/${p.tong}  ·  còn ${song} con  ·  ${giayMs(con)}`);
}
// Máy chủ trả: say { text, opts: [[nhãn, việc, tham số]] } (khung Say của client) | talk [câu] (khung Talk, xong quay lại hỏi chuyện) | giao
// { tieuDe, loi } (khung Giao vật phẩm — đặt món rồi Xác nhận) | thuong { text, ds } (khung chọn phần thưởng); tin = câu báo khung tin
function daTau(b) {
  if (!hero) return;
  const w0 = world; // bản đồ lúc hỏi: khung Giao vật phẩm / Chọn thưởng chỉ gửi khi còn ở đó (soát 13/11)
  Net.daTau(hero.slot | 0, b).then((j) => xuLyDaTau(j, w0)).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// phản hồi Dã Tẩu (NPC hoặc công cụ thử) -> khung client
function xuLyDaTau(j, w0 = world) {
  applyServer(j);
  for (const t of j.tin || []) P.hud.msg(t.replace(/<color=?\w*>/g, ""));
  if (GW) GW.refresh(true);
  if (j.say && NPCD) NPCD.choose("msgsel", "InfoText", richText(j.say.text, hero.name, "Dã Tẩu"), j.say.opts.map(([nhan, viec, x]) => [nhan, viec ? () => daTau({ viec, ...(viec === "huy" ? { cach: x } : {}) }) : null]));
  if (j.talk && NPCD) NPCD.talk(j.talk.map((t) => richText(t, hero.name, "Dã Tẩu")), 0, () => daTau({ viec: "mo" }));
  // khung Giao vật phẩm / Chọn thưởng chỉ khi còn ở bản đồ lúc hỏi (như xuLySatThu — soát 13/11)
  const roi = world !== w0;
  if ((j.giao || j.thuong) && GW && roi) P.hud.canh("Đã rời chỗ Dã Tẩu — nói chuyện lại với Dã Tẩu");
  if (j.giao && GW && !roi) GW.giaoDo(j.giao).then((ds) => { if (ds && world === w0) daTau({ viec: "xong", u: ds }); });
  if (j.thuong && GW && !roi) GW.chonThuong(j.thuong).then((i) => { if (i != null && world === w0) daTau({ viec: "chon", i }); });
  return j;
}
// ---------- "Đưa ta đến nơi làm nhiệm vụ Dã Tẩu" (anh 11/11 — chọn kiểu B: dòng dưới nhiệm vụ ở bảng nhiệm vụ góc trái / khung Nhiệm vụ điện thoại, + kiểu A:
// Xa phu "NoiDaTau") ----------
// Máy chủ (may-chu/da-tau.js den) tính nơi đến từ nhiệm vụ đang nhận rồi kiểm: ở thôn / thành miễn phí như Xa phu; ở bãi luyện công hỏi dùng 1 Thổ Địa Phù (khung hỏi
// của game — đồng ý thì gửi lại phu: 1, máy chủ trừ); thuyền, bờ Bắc, ải, Tống Kim, Phong Hỏa, Viêm Đế, đảo… không cho (câu báo); đủ cấp vào bãi. xe: gọi từ Xa phu —
// câu báo hiện trong khung Xa phu (trả { text, opts } / { close } như xaPhuFn); không thì ở ô tin (chữ đỏ)
function denDaTau(xe, phu) {
  const xong = xe ? { close: true } : null, bao = (t) => { if (xe) return { text: t, opts: [] }; P.hud.canh(t); return null; };
  if (!hero || !world) return Promise.resolve(xong);
  const chan = zoneLoad ? "Đang chuyển bản đồ — tải xong rồi bấm lại" : world.player.hp <= 0 ? "Đang trọng thương — không đi được"
    : TuLam.chiem && TuLam.loai === "dt" ? `Trợ Thủ đang tự làm nhiệm vụ Dã Tẩu — tắt Tự đánh${DT && DT.on ? "" : " (Space)"} rồi bấm lại` : null; // Trợ Thủ cũng đang đưa đi: không kéo nhau
  if (chan) return Promise.resolve(bao(chan));
  const z0 = world.zone.id; // chỗ đứng lúc bấm (máy chủ xét theo chỗ này) — diDaTau: chờ trả lời mà đã bị đưa sang ải / đảo… thì thôi
  return Net.daTau(hero.slot | 0, { viec: "den", ...(phu ? { phu: 1 } : {}) }).then((j) => {
    applyServer(j);
    if (GW) GW.refresh(true);
    for (const t of j.tin || []) P.hud.msg(t);
    if (j.di) { diDaTau(j.di, z0); return xong; }
    if (j.hoiPhu) {
      if (NPCD) NPCD.close();
      if (GW) GW.hoi(`Dùng 1 <color=yellow>Thổ Địa Phù<color> để đi tới <color=yellow>${j.hoiPhu.ten}<color>?<enter>Trong hành trang có ${j.hoiPhu.co} tấm.`, "Đồng ý", "Hủy bỏ").then((ok) => { if (ok) denDaTau(false, true); });
      return xong;
    }
    return j.canh ? bao(j.canh) : xong;
  }).catch((e) => (e.ma === "het-phien" || e.boQua ? xong : bao(e.message)));
}
// máy chủ đã kiểm (ở bãi: đã trừ Thổ Địa Phù) -> đi bằng đường của Xa phu: bãi -> xeToi (chỗ vào bãi, ghi farmZone, đội viên vào cùng bản với đội trưởng); thôn / thành
// -> như "Những thành thị đã đi qua" rồi tự chạy tới NPC bán (di.ban = mã cửa hàng — npcBan; tới nơi mở hội thoại như bấm NPC). di.phu: vừa dùng phù ở bãi -> nhớ chỗ
// dùng như dùng phù trong túi (dungPhu — Xa phu "Trở lại địa điểm cũ"). Đang tải dở bản đồ khác: tải xong rồi đi (như diPld) — trừ khi trong lúc chờ đã sang
// bản đồ không đi được (z0: chỗ lúc bấm; đội trưởng báo danh Vượt Ải / Viêm Đế kéo vào ải, Xa phu ra đảo… — soát 11/11): ở lại đó, báo
function diDaTau(di, z0) {
  const z = P.maps.zones.find((x) => x.id === di.z);
  // thôi đi mà máy chủ đã trừ Thổ Địa Phù (di.phu): xin hoàn 1 tấm (may-chu/da-tau.js hoanPhu — soát 11/11)
  const hoan = () => { if (di.phu && hero) Net.daTau(hero.slot | 0, { viec: "hoanPhu" }).then((j) => { applyServer(j); if (GW) GW.refresh(true); for (const t of j.tin || []) P.hud.msg(t); }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua) P.hud.msg(e.message); }); };
  if (!z) { hoan(); return P.hud.canh("Trình duyệt chưa có bản đồ này — tải lại trang (F5) rồi bấm lại"); }
  if (NPCD) NPCD.close();
  if (di.phu && world && FARM_KINDS.has(world.zone.kind)) { const p = world.player; hero.diemCu = { z: world.zone.id, x: Math.round(p.x), y: Math.round(p.y), ...(world.chung ? { c: 1 } : {}) }; hero.farmZone = world.zone.id; hero.farmChung = world.chung ? 1 : 0; save(); }
  const toiNpc = () => {
    const w = world, p = w.player, n = w.npcs.filter((v) => npcBan(v, di.ban)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; // Biện Kinh có 2 Thợ rèn: gần nhất
    if (!n) return P.hud.msg(`Không thấy NPC bán món này ở ${w.zone.n}`);
    w.clickNpc(n); P.hud.msg(`Tìm đường tới ${n.name}`);
  };
  const di1 = () => {
    if (!world) return;
    if (world.zone.id === z.id) return di.ban ? toiNpc() : P.hud.msg(`Đang ở ${z.n} rồi`);
    const zn = world.zone; // đã sang bản đồ khác (không phải thôn / thành / bãi luyện công) trong lúc chờ: thôi đi
    if (z0 != null && zn.id !== z0 && !(TOWN_KINDS.has(zn.kind) || (FARM_KINDS.has(zn.kind) && !zn.chiThuyen))) { hoan(); return P.hud.canh(`Đã sang ${zn.n} — không đi tới nơi làm nhiệm vụ Dã Tẩu nữa`); }
    if (FARM_KINDS.has(z.kind)) return xeToi(z, null, false, hoan); // hoan: không đi được / tải bản đồ hỏng
    P.hud.msg(`Ngồi yên chưa? Chúng ta đi ${z.n}`); // câu client (SelStation) như Xa phu
    gotoZone(z).then(() => { if (di.ban && world && world.zone.id === z.id) toiNpc(); }).catch((e) => { hoan(); fail(e); });
  };
  if (zoneLoad) zoneLoad.catch(() => {}).finally(di1); else di1();
}
// NPC có bán cửa hàng id (lệnh Sale trong hội thoại script của NPC — assets/data/npcdialog.json: Thợ rèn 37, Tiệm tạp hóa 38, Mã phu 46); tính 1 lần mỗi script
const SALE_NPC = new Map();
function npcBan(n, id) {
  const k = n && n.script, S = NPCD && NPCD.D && NPCD.D.scripts;
  if (!k || !S) return false;
  if (!SALE_NPC.has(k)) { const ds = new Set(); for (const nd of Object.values((S[k] && S[k].nodes) || {})) for (const a of nd.alts || [nd]) for (const x of a.acts || []) if (x[0] === "Sale") ds.add(+x[1]); SALE_NPC.set(k, ds); }
  return SALE_NPC.get(k).has(id);
}
// tên nơi ở dòng "Đưa ta đến": bãi kèm cấp (ảnh mẫu anh duyệt: "Điểm Thương sơn 40-50"); NPC bán + thành (đang đứng ở thành có cửa hàng đó thì thành này — máy chủ
// cũng chọn vậy). Bảng hẹp phải xuống dòng: cấp dính với chữ cuối tên, không ngắt giữa "40-50" (khoảng trắng không ngắt + U+2060 sau gạch nối)
function tenDenDt(den) {
  const id = den.zs && world && den.zs.includes(world.zone.id) ? world.zone.id : den.z, z = P.maps.zones.find((x) => x.id === id);
  if (!z) return den.ten || "?";
  return den.ban ? `${den.ten} ${z.n}` : FARM_KINDS.has(z.kind) && z.hi ? `${z.n}\u00a0${z.lo}-\u2060${z.hi}` : z.n;
}
// Xa phu kiểu A: có nhiệm vụ đi tới được (bãi / NPC bán — không phải sạp Hệ thống)
const coNoiDt = () => !!(hero && hero.dtc && hero.dtc.den && hero.dtc.den.z != null);
// Chợ Trời thẻ Dã Tẩu (sạp Hệ thống — da-tau.js choHt: món nhiệm vụ đang làm đứng đầu, "Dã Tẩu: đang cần"); bảng mở ở đâu cũng được như nút Chợ Trời. Bỏ chữ ô tìm
// (đang lọc món khác thì món cần không hiện)
function moChoDt() {
  const C = GW && GW.cho; if (!C) return;
  C.the = 5; C.trang = 0; C.tim = ""; if (C._timEl) C._timEl.value = ""; // 5: thẻ Dã Tẩu (chotroi.js THE_DT)
  C.moBang();
}
// mặc / tháo / đặt / bán / bộ lọc tự bán: hỏi máy chủ (cửa sổ Đồ dùng, trang Trang bị — src/game/windows.js). Trả true nếu được.
function doItem(b) {
  if (!hero) return Promise.resolve(false);
  if (b.act === "xep" && b.kho === "tui") return xepTui(b);
  return Net.doItem(hero.slot | 0, b).then((j) => { applyServer(j); if (j.msg) P.hud.msg(j.msg); P.audio.ui("click"); return true; })
    .catch((e) => { if (e.ma !== "het-phien" && !e.boQua) P.hud.msg(e.message); return false; }); // boQua: bấm Hủy ở khung mật khẩu cấp 2
}
// Sắp xếp hành trang (anh 06/11 — máy chủ may-chu/do.js act xep dồn chồng thuốc: chồng bị dồn mất mã u). Thuốc đã uống mà chưa báo (pending.uong
// theo u) gửi kèm, máy chủ trừ trước khi dồn; chờ nhịp đang bay xong rồi giữ nhịp + không cho uống (xepBay) tới lúc có trả lời -> không lượt uống
// nào nhắc tới mã chồng đã dồn mất (mất bình / uống không trừ). Lỗi: trả lượt uống về pending như nhịp mất mạng
let xepBay = false;
async function xepTui(b) {
  for (let i = 0; pulsing && i < 60; i++) await new Promise((r) => setTimeout(r, 50));
  if (pulsing || xepBay) { P.hud.msg("Đang gửi dữ liệu — bấm Sắp xếp lại sau giây lát"); return false; }
  pulsing = xepBay = true;
  const uong = [...pending.uong]; pending.uong.clear();
  try { const j = await Net.doItem(hero.slot | 0, { ...b, uong }); applyServer(j); if (j.msg) P.hud.msg(j.msg); P.audio.ui("click"); return true; }
  catch (e) { for (const [u, n] of uong) pending.uong.set(u, (pending.uong.get(u) || 0) + n); if (e.ma !== "het-phien") P.hud.msg(e.message); return false; }
  finally { pulsing = xepBay = false; }
}
// dùng món Kỳ Trân Các (chuột phải trong túi — máy chủ may-chu/do.js dungVat, anh 27/10): sách / điểm -> lưu nhân vật trước (máy chủ kiểm
// điểm kỹ năng trên bản mới nhất); Đại Thành Bí Kíp: máy chủ trả chon -> chọn chiêu ở khung Say như script client (CreateTaskSay); lễ bao Hồi
// Thiên: trả hoiSo -> khung nhập số (AskClientForNumber "Xin mời nhập số cần rút")
async function dungVat(b, them = {}) {
  if (!hero || !b) return; // món không còn trong túi (thử 06/11: gọi với món đã dùng hết -> lỗi đọc b.k)
  const D = (ItemDB.item(b.k) || {}).dung;
  if (world && laLd(world.zone) && ldCamMon(b.k)) return ldCamDung(); // Lôi Đài Công Bình Tử (anh 17/11): hoàn / vật phẩm trạng thái — máy chủ cũng chặn (do.js dungVat)
  if (D && D.loai === "lenhDaTau") return daTau({ viec: "xongLenh", u: b.u }); // Lệnh bài làm NV Dã Tẩu (anh 10/11): hoàn thành ngay nhiệm vụ đang làm -> khung chọn thưởng (dùng đúng món đã bấm)
  if (D && /^(sach|sach120|daiThanh|matTich|tayTuy)$/.test(D.loai)) await Net.flush().catch(() => {});
  const j = await Net.doItem(hero.slot | 0, { act: "dung", u: b.u, ...them }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); return null; });
  if (!j) return;
  applyServer(j);
  // Bảo rương đồ xanh (anh 04/11): tên món mở ra tô màu đồ xanh như câu nhặt đồ
  if (j.moRuong) P.hud.msg([[`Mở ${((ItemDB.item(b.k) || {}).n || "rương").trim()}: nhận được `], [j.moRuong.n, mauMon({ d: j.moRuong.d })], [` (${j.moRuong.d} dòng)${j.moRuong.khoaGio ? ` — khóa bảo hiểm, tự mở khóa sau ${j.moRuong.khoaGio} giờ` : ""}${j.moRuong.cho ? " — hành trang không đủ chỗ đặt món này, món chờ nhận: dọn túi là tự vào" : ""}`]]); // khoaGio: rương khóa (anh 11/11 — do.js khoaRuong)
  else if (j.msg) P.hud.msg(typeof j.msg === "string" && /<color/i.test(j.msg) ? phanMauDn(j.msg) : j.msg); // anh 16/11 — Báo Đáp Ân Sư: hương bao / kinh nghiệm / kỹ năng… (có thể có thẻ màu — mau-tin.js)
  P.audio.ui("click");
  // anh 16/11 — Báo Đáp Ân Sư: Phong Lăng Truyền Tống Lệnh (pldBac — máy chủ đã đặt h.pld bờ Bắc) -> đi bờ Bắc như Thuyền phu (diPld: đang tải dở thì tải xong rồi đi)
  if (j.di) diPld(j.di);
  // Tống Kim trận thật (đặc tả đợt 2 — máy chủ do.js dungVat): Chiến cổ / Lệnh Bài -> buff mình + người cùng phe đứng gần; Càn Khôn Tạo Hóa Đan -> hồi theo nhịp
  if (j.tkDoi) TongKim.dungDoi(j.tkDoi);
  if (j.tkHoi) TongKim.dungHoi(j.tkHoi);
  // Tử Mẫu Lệnh (script client ib\zimudai.lua): khung Say "Túi tử mẫu có thời hạn sử dụng là …" -> Nạp 1 tuần / Hủy bỏ
  if (j.vdBao && !them.chon && NPCD) ViemDe.moBao(j.vdBao, b); // Viêm Đế Bí Bảo: hỏi dùng chìa nào (item\yandimibao.lua)
  if (j.tuMau !== undefined && !them.chon && NPCD) {
    const d = j.tuMau > Date.now() ? new Date(j.tuMau + 7 * 3600e3) : null, p = (n) => String(n).padStart(2, "0");
    NPCD.choose("msgsel", "InfoText", richText(`Túi tử mẫu có thời hạn sử dụng là: <color=yellow>${d ? `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} ngày ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}` : j.tuMau ? "Đã hết hạn" : "Chưa khởi động"}<color>`, hero.name),
      [["Nạp 1 tuần", () => dungVat(b, { chon: 1 })], ["Hủy bỏ", null]]);
  }
  // Dị Dung Bí Thuật — đổi giới tính (anh 16/11 — may-chu/do.js dungVat doiGioi): máy chủ kiểm xong (thành / thôn, đủ chỗ cất đồ chỉ giới cũ mặc được) trả doiGioi
  // -> khung hỏi trong game; Đồng ý -> đổi (trừ 1 món), gioiXong -> lưu rồi về màn chọn nhân vật (bản lưu cũ không ghi đè giới mới — api.js luuNv dpV)
  if (j.doiGioi && !them.chon && NPCD) {
    const G = { m: "nam", f: "nữ" }, g = j.doiGioi, ten = ((ItemDB.item(b.k) || {}).n || "").trim();
    NPCD.choose("msgsel", "InfoText", richText([`Dùng <color=yellow>${ten}<color> đổi giới tính từ ${G[g.tu]} sang <color=yellow>${G[g.sang]}<color>?`,
      ...(g.mon && g.mon.length ? [`Các món chỉ ${G[g.tu]} mặc được sẽ cất vào hành trang: ${g.mon.join(", ")}.`] : []),
      "Đổi xong sẽ về màn chọn nhân vật — vào lại game là diện mạo mới."].join("<enter>"), hero.name), [["Đồng ý", () => dungVat(b, { chon: 1 })], ["Hủy bỏ", null]]);
  }
  // trang giữ nhân vật trong bộ nhớ (màn chọn nhân vật vào lại bằng chính đối tượng này — csEnter): áp giới / chỉ số gốc / dpV mới trước khi lưu + rời game
  // (thử 16/11: không áp thì vào lại vẫn là giới cũ dù máy chủ đã đổi)
  if (j.gioiXong && j.gioiMoi && hero) { hero.sex = j.gioiMoi.sex === "f" ? "f" : "m"; if (j.gioiMoi.start) hero.start = { ...j.gioiMoi.start }; hero.dpV = j.gioiMoi.dpV | 0; }
  // soát 16/11: chỉ rời game khi vẫn đang ở đúng lượt chơi đó (#hud bật, cùng world) — tự thoát / vào lại / đăng xuất trong 1,5 giây thì không gọi
  if (j.gioiXong) { const w0 = world; setTimeout(() => { if (hero && world && world === w0 && $("#hud").classList.contains("on")) leaveGame(); }, 1500); }
  if (j.chon && NPCD) NPCD.choose("msgsel", "InfoText", richText("Chọn kỹ năng cần nâng cấp:", hero.name),[...j.chon.map(([id, n, lv]) => [`Nâng cấp ${n} (đang cấp ${lv})`, () => dungVat(b, { chon: id })]), ["Kết thúc đối thoại", null]]);
  // Phú quý cẩm hạp (anh 03/11 — may-chu/phu-quy.js): máy chủ đã kiểm điều kiện -> khung nhập số như g_AskClientNumberEx(10, 99, "Nhập số 10-99")
  // Pháo Hoa / Hoa hồng (anh 03/11): vẽ hiệu ứng quanh mình + gửi người cùng bãi (kênh tức thời "chieu" — vocong.js chieuAo nhận ra mã vật phẩm)
  if (j.hieuUng && world) { const p = world.player; world.hieuUng(j.hieuUng, p); if (world.onChieu) world.onChieu(j.hieuUng, 1, p.x, p.y, [p.x, p.y]); }
  if (j.hoiPq) GW.chonSo({ tieuDe: "Nhập số 10-99", ten: ((ItemDB.item(b.k) || {}).n || "").trim(), toiThieu: 10, toiDa: 99, san: 10, thongTin: () => `Đợt này còn ${j.hoiPq.con} lần chọn` }).then((n) => n && dungVat(b, { so: n }));
  if (j.hoiSo) { const th = ItemDB.item(((ItemDB.item(b.k) || {}).dung || {}).thuoc) || {}; GW.chonSo({ tieuDe: "Rút thuốc", ten: th.n || "", toiDa: j.hoiSo, san: j.hoiSo, thongTin: () => `Trong bao còn ${j.con} viên` }).then((n) => n && dungVat(b, { n })); }
}
// Đăng nhập nhận thưởng (khung loginprize — windows.js; máy chủ may-chu/do.js thuongDN): b = {} xem | { nhan: ngày, chon? }. Quá 42 ngày
// máy chủ trả hoi -> khung Say của client với câu + lựa chọn của script client (eventprizelang.lua). Trả { tt: { n, da } } | null
function thuongDN(b = {}) {
  if (!hero) return Promise.resolve(null);
  return Net.thuongDN(hero.slot | 0, b).then((j) => {
    applyServer(j);
    if (j.msg) P.hud.msg(j.msg);
    if (j.hoi && NPCD) {
      const phi = (luat().dangNhap || {}).phiTiep ?? 5;
      NPCD.choose("msgsel", "InfoText", richText(`Bạn đã đăng nhập liên tục trên 42 ngày, duy trì đăng nhập sẽ liên tục nhận được phần thưởng thứ 42, nhưng mỗi lần nhận phải trả ${phi} tiền đồng. Nếu như từ bỏ sẽ bắt đầu nhận lại từ ngày thứ 1`, hero.name),
        [[`Đồng ý trả ${phi} tiền đồng`, () => thuongDN({ ...b, chon: "tra" }).then((k) => k && k.tt && GW.loginPrizeFill(k.tt))],
         ["Tôi muốn bắt đầu nhận lại từ đầu", () => thuongDN({ ...b, chon: "lai" }).then((k) => k && k.tt && GW.loginPrizeFill(k.tt))], ["Hủy bỏ", null]]);
    }
    return j;
  }).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); return null; });
}
// hàng biểu tượng trạng thái góc trái trên (client 技能状态列表.ini — assets/ui/trang-thai.json, mã = võ công gây trạng thái): bùa đang có
// (còn bao lâu) + vòng sáng đang bật (client hiện trạng thái chiêu con của vòng sáng: Lưu Thủy -> 206; Bế Nguyệt Phất Trần -> mục cùng tên
// 718, kèm các vòng ghép) — vòng sáng không hết giờ nên không ghi thời gian
const ICON_VONG = new Map();
function iconVong(id) {
  if (ICON_VONG.has(id)) return ICON_VONG.get(id);
  const T = P.trangThai.ds, s = P.skillDb[id], c = s && s.sub && s.sub.child;
  const k = !s ? null : c && T[c] ? c : T[id] ? id : Object.keys(T).find((x) => T[x][0] === s.n) || null;
  ICON_VONG.set(id, k); return k;
}
// dòng bất lợi của bùa hại đang dính (thanh trạng thái — trangThaiHud): "Tốc độ di chuyển: -40%" …; dòng lạ bỏ qua
const BUA_CHU = { fastwalkrun_p: ["Tốc độ di chuyển", "%"], attackspeed_v: ["Tốc độ đánh ngoại công", ""], attackspeed_yan_v: ["Tốc độ đánh ngoại công", ""], castspeed_v: ["Tốc độ xuất chiêu nội công", ""],
  castspeed_yan_v: ["Tốc độ xuất chiêu nội công", ""], lifereplenish_v: ["Phục hồi sinh lực mỗi nửa giây", " điểm"], manareplenish_v: ["Phục hồi nội lực mỗi nửa giây", " điểm"],
  rangedamagereturn_p: ["Phản đòn tầm xa", "%"], meleedamagereturn_p: ["Phản đòn cận chiến", "%"], freezetimereduce_p: ["Thời gian làm chậm (âm = bị chậm lâu hơn)", "%"],
  stuntimereduce_p: ["Thời gian choáng (âm = bị choáng lâu hơn)", "%"], poisontimereduce_p: ["Thời gian trúng độc (âm = trúng độc lâu hơn)", "%"], adddefense_v: ["Né tránh", ""],
  physicsres_p: ["Kháng vật lý", "%"], coldres_p: ["Kháng băng", "%"], fireres_p: ["Kháng hỏa", "%"], lightingres_p: ["Kháng lôi", "%"], poisonres_p: ["Kháng độc", "%"], allres_p: ["Kháng tất cả", "%"],
  physicsresmax_p: ["Kháng vật lý tối đa", "%"], coldresmax_p: ["Kháng băng tối đa", "%"], fireresmax_p: ["Kháng hỏa tối đa", "%"], lightingresmax_p: ["Kháng lôi tối đa", "%"], poisonresmax_p: ["Kháng độc tối đa", "%"], allresmax_p: ["Kháng tất cả tối đa", "%"] };
const moTaBua = (A) => { const m = new Map(); for (const [k, v] of Object.entries(A || {})) { const c = BUA_CHU[k] || BUA_CHU[k.replace("_yan_p", "_p")]; if (c && v && v[0]) m.set(c[0], (m.get(c[0]) || [0, c[1]]).map((x, i) => (i ? x : x + v[0]))); }
  return [...m].map(([n, [v, dv]]) => `${n}: ${v > 0 ? "+" : ""}${v}${dv}`).join("\n") || "Bùa hại của đối phương"; };
let ttAt = 0;
function trangThaiHud() {
  if (!P.trangThai || !world || performance.now() - ttAt < 250) return;
  ttAt = performance.now();
  const T = P.trangThai.ds, L = [], co = new Set(), them = (k, t) => { const e = T[k]; if (e && !co.has(k)) { co.add(k); L.push({ img: e[2], t, n: e[0], d: e[1], xau: e[3] }); } };
  const au = hero.oChieu && hero.oChieu.phai, a = au && world.skLv(au) > 0 && P.skillDb[au];
  if (a && a.aura && !a.target.enemy) { them(iconVong(au), null); for (const [id] of auraGhep(a, world.skLv(au), skCong(hero, P.skillDb))) them(iconVong(id), null); } // skCong: + cấp Báo Đáp Ân Sư (anh 16/11)
  for (const id of world.vongHan ? world.vongHan.keys() : []) them(iconVong(id), null); // vòng vừa đổi / xoay (Nga My) còn tác dụng — World.vongCapNhat
  // vòng sáng của đồng đội đứng gần (World.vongDoi — anh 29/10): tên kèm người bật
  for (const [id, , ten] of world.vongDoiDs || []) { const k = iconVong(id), e = k && T[k]; if (e && !co.has(k)) { co.add(k); L.push({ img: e[2], t: null, n: `${e[0]} (${ten})`, d: e[1], xau: e[3] }); } }
  // bùa không có trong danh sách trạng thái của client (anh 01/11 "các buff khác của Côn Lôn không hiện": Nhất Khí Tam Thanh, Thiên Thanh Địa Trọc —
  // client ghi kiểu bị động nên 技能状态列表.ini không có, game mình dùng như bùa có thời hạn): hình của chính chiêu đó
  // vòng sáng tân thủ (anh 02/11 — cau-hinh.json tanThu): hình trạng thái "hồi sinh mệnh nội lực" của client (987)
  const TT = luat().tanThu;
  if (TT && (hero.lvl || 1) < TT.capDuoi && !world.laQt && T[987]) L.push({ img: T[987][2], t: null, n: "Vòng sáng tân thủ", d: `Dưới cấp ${TT.capDuoi}: hồi ${TT.hoiSinhLuc} sinh lực, ${TT.hoiNoiLuc} nội lực mỗi giây; tốc độ chạy +${TT.tocChay}%`, xau: 0 });
  // tăng ích tổ đội (anh 03/11 "cần thêm icon trên thanh trạng thái để xem được hiệu ứng cộng thêm của tổ đội theo tình trạng thực tế" — World.tangIchDoi):
  // hình nút Đội ngũ của client (队伍按钮.spr khung đầu, thu 24 điểm — assets/ui/trang-thai/to-doi.png)
  const TD = world.tangIchDoi(), TI = luat().tangIchDoi;
  if (TD.toc || TD.hoi) L.push({ img: "trang-thai/to-doi.png", t: null, n: "Tăng ích tổ đội", xau: 0,
    d: `${TD.n} người trong đội đứng cùng bãi quái chung: tốc độ di chuyển +${TD.toc}%, tốc độ đánh +${TD.toc}%\n` + (TD.hoi ? `Hồi sinh lực, nội lực +${TD.hoi} mỗi giây\n` : "")
      + `Kinh nghiệm +${TD.kn}%\nChỉ có ở bản quái chung` }); // World.tangIchDoi: bản riêng không có tăng ích (anh 06/11)
  for (const b of world.player.buffs.values()) {
    const con = Math.max(0, b.until - world.time), s = P.skillDb[b.id], ic = P.skillIcon[b.id];
    if (T[b.id]) them(b.id, con);
    else if (s && ic && !co.has("s:" + b.id)) { co.add("s:" + b.id); L.push({ img: "../web/icon/" + ic, t: con, n: s.n.trim(), d: (s.desc || "").trim(), xau: 0 }); }
  }
  // trạng thái từ vật phẩm Kỳ Trân Các (máy chủ đếm — chỉ trôi lúc đang chơi): Tiên Thảo Lộ = trạng thái 440 của client; may mắn (Thiên Sơn
  // Bảo Lộ / Quế Hoa Tửu — danh sách trạng thái client không có) dùng hình món
  // sân Công Bình Tử (anh 17/11): mọi trạng thái vật phẩm tạm mất tác dụng, máy chủ dừng giờ (do.js buffDem) -> hình xám (.hoi), giờ đứng yên, dòng chú thích
  const qua = (performance.now() - buffLuc) / 1000, ldTam = laLd(world.zone);
  for (const [k, s] of Object.entries(hero.buff || {})) {
    const B = ItemDB.buffDef(k) || {}, con = ldTam ? Math.max(0, s) : Math.max(0, s - qua), L0 = L.length;
    if (B.trangThai && T[B.trangThai]) them(B.trangThai, con);
    else if (B.ic && !co.has("b:" + k)) { co.add("b:" + k); L.push({ img: "../web/icon/" + B.ic, t: con, n: B.n, d: B.d + (B.tk && !TongKim.laTo() ? " (chỉ có tác dụng trong chiến trường Tống Kim)" : ""), xau: 0 }); }
    // anh 16/11 — Báo Đáp Ân Sư: Nến Bát Trân Phúc Nguyệt (buff "nen" — máy chủ nhân kinh nghiệm): ky-tran-cac.json chưa có buff.nen thì hình món ms:1817
    else if (k === "nen" && con > 0 && !co.has("b:nen")) { const x = ItemDB.item("ms:1817"); if (x && x.ic) { co.add("b:nen"); L.push({ img: "../web/icon/" + x.ic, t: con, n: String(x.n || "Nến Bát Trân Phúc Nguyệt").trim(), d: "Kinh nghiệm đánh quái × 2 cả tổ đội (nhân thêm với Tiên Thảo Lộ)", xau: 0 }); } }
    if (ldTam && L.length > L0) { const e = L[L.length - 1]; e.hoi = 1; e.d = `${e.d || ""}\n<color=Orange>Tạm mất tác dụng trong sân Công Bình Tử (thời gian dừng) — rời sân có tác dụng lại<color>`; }
  }
  // anh 16/11 — Báo Đáp Ân Sư: Nhất Kỷ Càn Khôn Phù / Càn khôn song tuyệt Bội (hero.ccKn [{ v, het }] — giờ thật, offline vẫn trôi): mỗi lần dùng 1 biểu tượng (hình món),
  // giờ còn lại; tổng cộng tối đa +3 cấp (rules.js ccCong). Ô chữ dưới biểu tượng theo hud.js (giờ), khung xem ghi "13 ngày 5 giờ"
  { const nay = Date.now(), cc = ccCong(hero, nay);
    for (const x of Array.isArray(hero.ccKn) ? hero.ccKn : []) {
      const con = x ? (+x.het - nay) / 1000 : 0, m = x && ItemDB.item((x.v | 0) >= 2 ? "ms:2219" : "ms:2126"); if (!(con > 0) || !m || !m.ic) continue;
      const ng = Math.floor(con / 86400), gi = Math.floor((con % 86400) / 3600), ph = Math.floor((con % 3600) / 60);
      L.push({ img: "../web/icon/" + m.ic, t: con, n: String(m.n || "").trim(), xau: 0,
        d: `Mọi kỹ năng đã học +${x.v | 0} cấp (cộng dồn tối đa +3 — đang +${cc})\nCòn ${ng > 0 ? `${ng} ngày ${gi} giờ` : gi > 0 ? `${gi} giờ ${ph} phút` : `${Math.max(1, ph)} phút`}` });
    }
  }
  ccKiem(); // hết hạn lúc đang chơi -> tính lại chỉ số
  // Tống Kim: Chiến cổ / Lệnh Bài của mình / người cùng phe (tongkim.js giữ — hết lúc theo giờ máy)
  if (TongKim.laTo()) for (const [k, het] of TongKim.buffs) {
    const B = ItemDB.buffDef(k) || {}, con = Math.max(0, (het - Date.now()) / 1000);
    if (con > 0 && B.ic && !co.has("b:" + k)) { co.add("b:" + k); L.push({ img: "../web/icon/" + B.ic, t: con, n: B.n || k, d: B.d || "", xau: 0 }); }
  }
  // trạng thái xấu do quái có võ công (bản mẫu — vocong.js heroCham / heroChoang / heroDoc): hình trạng thái của client (Hàn Băng Chi Nộ,
  // Lôi Kích Thuật, Bích Mộc Chi Nộ), số giây còn lại
  if (world.quaiVC) {
    const p = world.player, xau = (k, n, d, con) => { const e = T[k]; if (e && con > 0) L.push({ img: e[2], t: con, n, d, xau: 1 }); };
    xau(1563, "Làm chậm", "Tốc độ di chuyển và xuất chiêu giảm 50 %", (p.slowUntil || 0) - world.time);
    xau(349, "Choáng", "Không thể di chuyển, xuất chiêu", (p.stunUntil || 0) - world.time);
    xau(1562, "Trúng độc", "Mất sinh lực theo thời gian", p.poison ? p.poison.until - world.time : 0);
  }
  // hoảng loạn (Thiên Nhẫn 120 — vocong.js heroHoangLoan, anh 13/11): hình trạng thái 723 của client
  { const p = world.player, con = (p.hlUntil || 0) - world.time, e = T[723]; if (e && con > 0) L.push({ img: e[2], t: con, n: "Hoảng loạn", d: "Không thể di chuyển, xuất chiêu", xau: 1 }); }
  // anh 17/11 ("k biết khi nào trúng 12x của ngũ độc"): đang trúng Hấp Tinh Yểm (vocong.js heroMatNoi — mỗi giây mất % nội lực đang có) — hình trạng thái 719 của
  // client, không có thì hình chiêu 711
  { const p = world.player, M = p.matNoi, con = M ? M.het - world.time : 0, e = T[719], ic = P.skillIcon && P.skillIcon[711];
    if (con > 0 && (e || ic)) L.push({ img: e ? e[2] : "../web/icon/" + ic, t: con, n: "Hấp Tinh Yểm — mất nội lực", d: `Mỗi giây mất ${M.pct}% nội lực đang có`, xau: 1 }); }
  // bùa hại người / bot phe kia đang dính trên mình (p.tkBua — tkbot.js tkBuaMinh; anh 17/11 "có hiển thị đầy đủ hình ảnh ingame chứ"): hình trạng thái client của bùa
  // (iconVong) hoặc hình chiêu, giây còn lại, các dòng bất lợi — khung đỏ như trạng thái xấu
  { const p = world.player;
    if (world.tk && p.tkBua) for (const c of p.tkBua) {
      const con = c.until - world.time, s = P.skillDb[c.id]; if (!(con > 0) || !s || co.has("bh:" + c.id)) continue;
      const k = iconVong(c.id), e = k && T[k], ic = P.skillIcon && P.skillIcon[c.id]; if (!e && !ic) continue;
      co.add("bh:" + c.id); L.push({ img: e ? e[2] : "../web/icon/" + ic, t: con, n: `${String(s.n || "").trim()} (bùa hại)`, d: moTaBua(c.attrs), xau: 1 });
    }
  }
  { const c = CuongNo.hud(T); if (c && c.img) L.push(c); } // Cuồng nộ liên kích (anh 18/11 — cuongno.js)
  // anh 17/11 ("các phái có chiêu bị động mà cần thời gian hồi như lưỡng nghi hay của ngũ độc, chủ yếu các chiêu 12x … thêm cái đếm giờ và icon skill"): chiêu tự phát
  // đang hồi (vocong.js trigAuto — p.trigCd { mã chiêu bị động: lúc hết hồi }) — hình chiêu, giờ còn lại, hình xám (hud.js "hoi")
  { const p = world.player;
    for (const [sid, het] of Object.entries(p.trigCd || {})) {
      const con = het - world.time, s = P.skillDb[sid], ic = P.skillIcon && P.skillIcon[sid]; if (!(con > 0) || !s || !ic || co.has("cd:" + sid)) continue;
      co.add("cd:" + sid); L.push({ img: "../web/icon/" + ic, t: con, n: `${String(s.n || "").trim()} — đang hồi`, d: `Chiêu tự phát, còn ${Math.ceil(con)} giây mới phát lại được`, xau: 0, hoi: 1 });
    }
  }
  // đường đua (anh 16/11 — duangua.js hieuUng): tăng tốc (hình Gia Tốc hoàn), chậm / choáng do tù và / bẫy (hình trạng thái client Hàn Băng / Lôi Kích như quái võ công)
  for (const x of DuaNgua.hieuUng()) { const e = x.ma && T[x.ma]; if (e || x.ic) L.push({ img: e ? e[2] : "../web/icon/" + x.ic, t: x.t, n: x.n, d: x.d, xau: x.xau ? 1 : 0 }); }
  P.hud.setStates(L);
  doiHud();
}
// bảng đội ngũ góc trái (anh 29/10 — hud.setDoi): mọi người trong đội theo thứ tự máy chủ (đội trưởng trước); cùng bản đồ: thanh sinh lực /
// nội lực (của mình: số đang có; người khác: nhịp gần nhất — ai, không thì tv của tổ đội); khác bản đồ / rời mạng: chữ xám
function doiHud() {
  if (!doiTt || !world) return P.hud.setDoi([]);
  const p = world.player, pc = (v) => Math.max(0, Math.min(100, Math.round(v)));
  P.hud.setDoi(doiTt.tv.map((x) => {
    const toi = x.ten === hero.name, e = !toi && world.others.get(x.ten), cung = toi || (!!x.on && x.zone === world.zone.id && !x.c === !world.chung && (!world.zone.bang || !!e)); // khác bản (riêng / quái chung; khu vực bang của bang khác — đợt 4): xa
    const hp = toi ? (p.hp * 100) / p.hpMax : e ? e.hp : x.hp ?? 100, mp = toi ? (p.mp * 100) / p.mpMax : e ? e.mp : x.mp ?? 100;
    const bai = ((P.maps.zones.find((z) => z.id === x.zone) || {}).n || "—") + (x.c ? " (quái chung)" : ""), fac = x.fac == null ? "Vô Môn Phái" : (P.factions.find((f) => f.id === x.fac) || {}).n || "";
    const tip = `<color=Yellow>${x.ten}<color>${x.ten === doiTt.truong ? " (đội trưởng)" : ""}\nCấp ${x.lvl || "?"} · ${fac}\n${x.on ? bai : "Rời mạng"}${cung ? `\nSinh lực ${pc(hp)}% · Nội lực ${pc(mp)}%` : ""}`;
    return { ten: x.ten, truong: x.ten === doiTt.truong, toi, xa: !cung, hp: pc(hp), mp: pc(mp), tip };
  }), doiTt.toiDa);
}
// chạy tới tọa độ client X/Y của bãi đang đứng (ô tọa độ bản đồ nhỏ, bảng nhiệm vụ)
function diToaDo(X, Y) {
  if (!world) return;
  const [x, y] = P.hud.mmMap.fromClient(X, Y);
  if (world.map.walkable(x, y) || (world.map.grid && world.map.nearestCell(x, y, 30) >= 0)) { world.clickGround(x, y); P.hud.msg(`Tìm đường tới ${X}/${Y}`); } else P.hud.msg(`Không tới được ${X}/${Y}`);
}
// ---------- bảng nhiệm vụ góc trái (anh 28/10 — hud.js setNhiemVu) ----------
// Nhóm Chính tuyến / Phụ tuyến: game chưa có cốt truyện -> chưa hiện; Hằng ngày: Dã Tẩu (máy chủ gửi hero.dtc — may-chu/da-tau.js chiTiet),
// Boss Sát thủ (hero.satThu). Đoạn xanh lá bấm được: tên NPC -> đi tới nói chuyện (đang ở thành), tọa độ boss -> chạy tới (đang ở bãi đó)
const XANH = [55, 231, 63], XAM = [201, 191, 165], CAM = [255, 166, 59], DO_ = [255, 96, 96];
const tenBaiNv = (id) => (P.maps.zones.find((z) => z.id === id) || {}).n || "bãi " + id;
let nvAt = 0, TD = null; // TD: chỉ đường tân thủ (tanthu.js)
function nhiemVuHud() {
  if (!hero || !world || performance.now() - nvAt < 400) return;
  nvAt = performance.now();
  const ngay = nhiemVuDs(), td = TD ? TD.nhom() : null;
  P.hud.setNhiemVu([...(td ? [td] : []), ...(ngay.length ? [{ ten: "Hằng ngày", muc: ngay }] : [])]);
  if (GW && GW.taskVe) GW.taskVe(); // khung Nhiệm vụ đang mở: vẽ lại khi đổi
}
// nhiệm vụ hằng ngày ĐÃ NHẬN — bảng góc trái (hud.setNhiemVu: ten, phu, dong) và khung Nhiệm vụ (windows.js _task — anh 03/11 "nhiệm vụ trên mobile chỉ hiển
// thị như này khá xấu … nội dung thì hơi chán"; lượt 18: "nhiệm vụ chỉ hiển thị khi em nhận nv thôi, chứ k phải em quăng hết vào, vì cái này giống hoạt động
// hằng ngày hơn" — bản trước có cả dòng "Gặp … nhận nhiệm vụ", "đã xong hôm nay"): [{ k ("dt" | "st" | "va" | "mc"), ten, phu, dong: [[[chữ, màu?, khóa
// bấm?]…]…], icon (khóa món làm hình), hom: [đã xong hôm nay, tối đa], td: [có, cần] (tiến độ nhiệm vụ đang làm) | null, trang: "lam" đang làm | "tra" về
// trả / chọn thưởng }]
function nhiemVuDs() {
  const ngay = [];
  // Dã Tẩu: đang làm (bước 1) / xong chờ chọn thưởng (bước 2) — chưa nhận, đã thưởng chờ nhận tiếp: không hiện (hoạt động hằng ngày — anh 03/11 lượt 18)
  const D = hero.dtc;
  if (D && (D.buoc === 1 || D.buoc === 2)) {
    const dong = [];
    if (D.buoc === 1 && D.nv) {
      dong.push([[D.nv]]);
      // anh 11/11 (kiểu B — ảnh mẫu đã duyệt): ngay dưới lời nhiệm vụ, nơi làm do máy chủ tính (da-tau.js noiLam — D.den; đủ tiến độ thì máy chủ không gửi): bãi /
      // NPC bán -> "Đưa ta đến: …" (denDaTau); Tìm / Xem vật phẩm -> "Mua ở: sạp Hệ thống (Chợ Trời)" (Chợ Trời thẻ Dã Tẩu). Điện thoại: khung Nhiệm vụ dùng chung dòng này
      const den = D.den, du0 = D.tienDo && D.tienDo[0] >= D.tienDo[1];
      if (den && !du0) dong.push(den.cho ? [["Mua ở: "], [den.ten || "sạp Hệ thống (Chợ Trời)", XANH, "dt:cho"]] : [["Đưa ta đến: "], [tenDenDt(den), XANH, "dt:den"]]);
      if (D.tienDo) {
        const du = D.tienDo[0] >= D.tienDo[1];
        dong.push([["Tiến độ: "], [`${D.tienDo[0]}/${D.tienDo[1]}`, du ? XANH : null], ...(du ? [[" — đã đủ, về gặp "], ["Dã Tẩu", XANH, "npc:daTau"]] : [])]);
      }
    } else dong.push([["Gặp "], ["Dã Tẩu", XANH, "npc:daTau"], [" chọn phần thưởng"]]);
    dong.push([[`Hôm nay ${D.xongNgay}/${D.gioiHan}${D.mocNgay ? ` · mốc ngày ${D.mocNgay}` : ""}`, XAM]]);
    dong.push([[`Tổng ${D.tong}${D.mocTong ? ` · mốc kế ${D.mocTong}` : ""}${D.bac ? ` · bậc ${D.bac}` : ""}`, XAM]]);
    if (D.no) dong.push([["Còn quà mốc chưa nhận — gặp ", DO_], ["Dã Tẩu", XANH, "npc:daTau"]]);
    if (TuLam.dang && TuLam.loai === "dt") dong.push([[`Trợ Thủ: ${TuLam.dang}`, CAM]]); // tự làm nhiệm vụ ngày (tulam.js — anh 03/11)
    const du = D.buoc === 1 && D.tienDo && D.tienDo[0] >= D.tienDo[1];
    ngay.push({ k: "dt", ten: "Dã Tẩu", phu: D.thu ? `nhiệm vụ thứ ${D.thu}` : "", dong, icon: "ms:206", hom: [D.xongNgay | 0, D.gioiHan || 40], td: D.buoc === 1 && D.tienDo ? D.tienDo : null,
      trang: D.buoc === 1 && !du ? "lam" : "tra" });
  }
  // Boss Sát thủ: đang nhận boss
  const S = hero.satThu, b = S && S.nv && P.satThu ? P.satThu.boss[S.nv] : null, toiDa = (S && S.toiDa) || 8;
  if (b) {
    const dong = [[["Hạ "], [b.ten, CAM], [` ở ${tenBaiNv(b.bai)}${laQc({ id: b.bai }) ? " (quái chung)" : ""} `], [`(${b.X}/${b.Y})`, XANH, `toa:${b.bai}:${b.X}:${b.Y}`]],
      [[`Hôm nay ${S.dem | 0}/${toiDa}`, XAM]]];
    if (TuLam.dang && TuLam.loai === "st") dong.push([[`Trợ Thủ: ${TuLam.dang}`, CAM]]);
    ngay.push({ k: "st", ten: "Boss Sát thủ", phu: `cấp ${b.cap}`, dong, icon: "ms:399", hom: [S.dem | 0, toiDa], td: null, trang: "lam" });
  }
  // Vượt Ải (hero.va — may-chu/vuot-ai.js tomTat): đang trong ải -> đám / giờ (tổ đội: theo phòng — VaDoi.p, máy chủ gửi qua kênh tức thời; hero.va chỉ đổi
  // theo nhịp có nhân vật)
  const V = hero.va, VP = V && V.dang && V.dang.phong && VaDoi.p && VaDoi.p.id === V.dang.phong ? VaDoi.p : null;
  const VD = VP ? { ...V.dang, bd: VP.bd, dot: VP.dot, tong: VP.tong, han: VP.han, ket: VP.ket } : V && V.dang;
  if (VD && !VD.ket && laAi(world.zone)) {
    const vt = (Date.now() + (VP ? VaDoi.lech : (world._va && world._va.lech) || 0) - VD.bd) / 1000; // giây từ lúc ra quái (âm: đang chuẩn bị)
    const dong = [vt < 0 ? [["Chuẩn bị", CAM], [` · quái xuất hiện sau ${giayMs(-vt)}`]] : [[`Đám ${VD.dot}/${VD.tong}`, CAM], [` · còn ${giayMs(VD.han - vt)}`]], [[`Hôm nay ${V.luot}/${V.toiDa}`, XAM]]];
    // (Viêm Đế Bảo Tàng: khối riêng ngay dưới)
    ngay.push({ k: "va", ten: "Vượt Ải", phu: VD.cap === 2 ? "cao cấp" : "sơ cấp", dong, icon: "ms:400:90", hom: [V.luot | 0, V.toiDa | 0], td: VD.tong ? [Math.max(0, VD.dot - 1), VD.tong] : null, trang: "lam" });
  }
  ViemDe.nhiemVu(ngay, CAM, XAM, XANH);
  // anh 18/11 — Nhiệm vụ ngày lễ (hero.nsk — may-chu/nguon-su-kien.js tomTat): đang nhận -> giết quái x / y; đủ -> về gặp NPC sự kiện
  const NL = hero.nsk;
  if (NL && NL.nhan && NL.can) {
    const du = NL.dem >= NL.can, dong = [[["Tiêu diệt quái ở bãi luyện công "], [`${fmtSo(NL.dem)}/${fmtSo(NL.can)}`, du ? XANH : null], ...(du ? [[" — về gặp "], [NL.npc, XANH]] : [])],
      [[`Thưởng ${NL.so} ${NL.mon} · nhiệm vụ ${NL.bac + 1}/${NL.tong} hôm nay`, XAM]]];
    ngay.push({ k: "nsk", ten: "Nhiệm vụ ngày lễ", phu: NL.ten || "", dong, icon: "ms:2576", hom: [NL.bac | 0, NL.tong | 0], td: [Math.min(NL.dem, NL.can), NL.can], trang: du ? "tra" : "lam" });
  }
  // Võ Lâm Minh Chủ (hero.mc — may-chu/minh-chu.js tomTat; lúc vào game là h.mc nguyên): chỉ các nhiệm vụ đang nhận (sát quái, giao thư, thu thập)
  const M = hero.mc, gk = M && M.giet, th = M && M.thu, hi = M && M.hai;
  if (gk || th || hi) {
    const hom = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), xg = (M.ngay === hom && M.xong) || {}, sg = ["Hắc Bạch Sứ Giả", XANH, "npc:mc"], dong = [];
    const co = hi ? (hero.bag || []).reduce((t, o) => t + (o.k === hi.mon ? o.n || 1 : 0), 0) : 0;
    if (gk) dong.push([["Sát quái: "], [gk.ten, CAM], [` ở ${gk.tenBai} `], [`${gk.n}/${gk.can}`, gk.n >= gk.can ? XANH : null], ...(gk.n >= gk.can ? [[" — về gặp "], sg] : [])]);
    if (th) dong.push(th.da ? [["Giao thư: đã trao — về gặp "], sg] : [["Giao thư: "], [th.ai, CAM], [` (${th.noi})`]]);
    if (hi) {
      dong.push([["Thu thập: "], [hi.ten, XANH, `cay:${hi.loai}:${hi.bai}`], [` ngoài ${hi.tenBai} `], [`${co}/${hi.can}`, co >= hi.can ? XANH : null], ...(co >= hi.can ? [[" — về gặp "], sg] : [])]);
      if (co < hi.can) dong.push([[`hạ 2 ${(QuaiCanh.s && QuaiCanh.s.ten) || "quái"} canh giữ rồi mới hái`, XAM]]); // quái canh cây (quaicanh.js)
    }
    const nx = ["giet", "thu", "hai"].filter((k) => xg[k]).length, tra = (gk && gk.n >= gk.can) || (th && th.da) || (hi && co >= hi.can);
    ngay.push({ k: "mc", ten: "Võ Lâm Minh Chủ", phu: `xong ${nx}/3`, dong, icon: "ms:2571", hom: [nx, 3], td: gk ? [gk.n, gk.can] : hi ? [co, hi.can] : null, trang: tra ? "tra" : "lam" });
  }
  return ngay;
}
function bamNhiemVu(k) {
  if (!world) return;
  const [loai, a, X, Y] = k.split(":");
  if (loai === "tt") return TD && TD.bam(a, X); // chỉ đường tân thủ (tanthu.js)
  if (loai === "dt") return a === "cho" ? moChoDt() : void denDaTau(); // Dã Tẩu (anh 11/11): "Mua ở: sạp Hệ thống" / "Đưa ta đến: …"
  // Võ Lâm Minh Chủ: Hắc Bạch Sứ Giả (Biện Kinh / Ba Lăng) -> đi tới nói chuyện; tên cây -> đi tới cây gần nhất cùng loại (đang ở thành có cây)
  if (loai === "npc" && a === "mc") {
    const n = world.npcs.find((v) => v.mc === "su");
    if (n) { world.clickNpc(n); return P.hud.msg("Tìm đường tới Hắc Bạch Sứ Giả"); }
    return P.hud.msg("Hắc Bạch Sứ Giả ở Biện Kinh và Ba Lăng huyện — về thành rồi bấm lại");
  }
  if (loai === "cay") {
    const p = world.player, L = world.npcs.filter((v) => v.mc && v.mc.loai === +a).sort((u, v) => Math.hypot(u.x - p.x, u.y - p.y) - Math.hypot(v.x - p.x, v.y - p.y));
    if (L.length) { world.clickNpc(L[0]); return P.hud.msg(`Tìm đường tới ${L[0].name}`); }
    return P.hud.msg(`Cây ở ${tenBaiNv(+X)} — tới đó rồi bấm lại`);
  }
  if (loai === "vd") return ViemDe.bamRoi(); // Viêm Đế Bảo Tàng: "Rời bảo tàng" (khung hỏi của game — ViemDe.bamRoi)
  if (loai === "npc") {
    const ten = a === "sat" ? "Nhiếp Thí Trần" : "Dã Tẩu";
    const n = world.npcs.find((v) => (a === "sat" ? v.sat : v.script && /seasonnpc\.lua$/i.test(v.script)));
    if (n) { world.clickNpc(n); return P.hud.msg(`Tìm đường tới ${ten}`); }
    return P.hud.msg(`${ten} ở ${(townZone() || {}).n || "thành"} — về thành rồi bấm lại`);
  }
  if (loai === "toa") {
    if (world.zone.id !== +a) return P.hud.msg(`Boss ở ${tenBaiNv(+a)}${laQc({ id: +a }) ? " bản quái chung" : ""} (${X}/${Y}) — tới bãi đó rồi bấm lại (Xa phu: Đưa ta đến bản đồ nhiệm vụ sát thủ)`);
    if (laQc(world.zone) && !world.chung) P.hud.msg("Boss Sát thủ chỉ xuất hiện ở bản quái chung — đi Xa phu chọn bản Quái chung");
    diToaDo(+X, +Y);
  }
}
// Vứt món đang cầm trên tay (lấy từ túi) xuống đất cạnh nhân vật (anh muốn 25/10): nhặt lại được trong ~133 giây như vật rơi. Món quý (từ
// 4 dòng) hỏi lại — câu client G_STR_FORBIT_THROWITEM. Món đang mặc phải tháo vào túi trước. hoiLuon: nút Vứt của điện thoại (dienthoai.js
// _lam — anh 31/10 lần 3) — luôn hỏi, Hủy bỏ thì món về chỗ cũ. -> Promise<đã vứt?>
function throwHeld(hoiLuon) {
  const H = GW.hand; if (!H || !world) return Promise.resolve(false);
  if (KAT && KAT.dangHoi()) return Promise.resolve(false); // đang hỏi mật khẩu cấp 2 cho lần vứt trước: không gửi thêm
  if (H.from !== "bag" && H.from !== "giao") { P.hud.msg("Tháo món này vào túi trước rồi mới vứt ra đất được"); return Promise.resolve(false); } // giao: món từ lưới khung Giao (vẫn ở túi)
  // khóa bảo hiểm (anh 05/11 — thưởng thăng cấp / online): không vứt được như engine ServerThrowAwayItem (máy chủ cũng chặn — do.js CAU_KBH)
  if (H.it.kbh) {
    P.hud.msg("Nhằm bảo vệ tài sản cho bạn! Vật phẩm khóa bảo hiểm không được tùy ý vứt ra ngoài — không cần nữa thì đến Lễ quan (Ba Lăng) hủy vật phẩm.");
    if (hoiLuon && GW.hand === H) GW.drop();
    return Promise.resolve(false);
  }
  // khu vực bang (đợt 4): vật vứt theo mã bãi — chung mọi bản bang (máy chủ cũng chặn — do.js vut)
  if (world.zone.bang) { P.hud.msg("Khu vực bang hội không vứt vật phẩm ra đất được"); if (hoiLuon && GW.hand === H) GW.drop(); return Promise.resolve(false); }
  if (laLd(world.zone)) { P.hud.msg("Trong lôi đài không vứt vật phẩm ra đất được"); if (hoiLuon && GW.hand === H) GW.drop(); return Promise.resolve(false); } // lôi đài (anh 15/11 — máy chủ cũng chặn: do.js vut)
  const x = ItemDB.item(H.it.k), n = (H.it.d || []).length;
  const vut = () => {
    if (!world || GW.hand !== H) return;
    const p = world.player, a = Math.random() * Math.PI * 2;
    doItem({ act: "vut", u: H.it.u, z: world.zone.id, x: p.x + Math.cos(a) * 26, y: p.y + Math.sin(a) * 13 }).then((ok) => { if (ok && GW.hand === H) GW.drop(); });
  };
  const quy = n >= 4 && hero.auto && hero.auto.baoVe; // Trợ Thủ → Khác → Bảo vệ trang bị tắt: vứt luôn
  if (!quy && !hoiLuon) { vut(); return Promise.resolve(true); }
  // khung hỏi 2 nút của game (提示.ini — windows.js hoi); câu đầu là chữ client G_STR_FORBIT_THROWITEM
  const S = P.win.strings, cam = (S.G_STR_FORBIT_THROWITEM || "Nhằm bảo vệ tài sản cho bạn! Vật phẩm quý không được tùy ý vứt ra ngoài!").trim();
  return GW.hoi(quy ? `${cam}<enter>Vẫn vứt <color=yellow>${x.n} (${n} dòng)<color> ra đất?` : `Vứt <color=yellow>${x.n}<color> ra đất?<enter>Ai cùng bản đồ cũng nhặt được, khoảng 2 phút thì mất.`, "Vứt ra đất", "Hủy bỏ")
    .then((ok) => { if (ok) vut(); else if (hoiLuon && GW.hand === H) GW.drop(); return ok; });
}
// số bình mỗi chồng / mỗi lần mua, giá bán lại cho NPC: máy chủ gửi lúc đăng nhập (cau-hinh.json — may-chu/api.js SV.luat)
function luat() {
  const L = { chong: 60, mua: 60, banLai: 0.5, giaBan: 20, thieuCap: 0, ...((Net.me && Net.me.sv && Net.me.sv.luat) || {}) };
  // anh 16/11 — Báo Đáp Ân Sư: trạng thái mới nhất máy chủ trả (Võ Sư / Cung Nữ hỏi "tt" — bdTtCu) đè bản lúc vào game (LUAT chỉ gửi lúc vào — qua 0 giờ thì cũ)
  if (bdTtCu && L.baoDapAnSu) L.baoDapAnSu = { ...L.baoDapAnSu, dang: bdTtCu.mo, moHb: bdTtCu.moHb };
  // anh 17/11 — khảm nạm: luật mới nhất máy chủ trả (mọi lời /api/kham-nam có khamNam — khamApply) đè bản lúc vào game (quản trị bật / tắt ở F10 có hiệu lực ngay)
  if (knLuatCu && L.khamNam) L.khamNam = knLuatCu;
  return L;
}
// trừ bình ở túi trong máy (m: mã món -> số bình); chồng hết bình thì bỏ
function bagMinus(m) {
  if (!m.size || !hero.bag) return;
  for (const [u, n] of m) { const it = hero.bag.find((b) => b.u === u); if (it && it.n != null) it.n -= n; }
  hero.bag = hero.bag.filter((b) => b.n == null || b.n > 0);
}

// Lôi Đài Công Bình Tử (anh 17/11 "khi vào công bình tử, không được dùng các loại dược, hoàn"): trong sân (cả trận lôi đài lẫn tỉ thí, tuyển thủ lẫn người xem) không uống
// thuốc (drink), không dùng hoàn / vật phẩm trạng thái (Tiên Thảo Lộ, Bách Quả Lộ, các loại hoàn — dung.loai trangThai), Nhất Kỷ Càn Khôn Phù / Càn khôn song tuyệt Bội
// (kyNang) và món chỉ dùng trong Tống Kim. GIỐNG may-chu/do.js LD_CAM — sửa thì sửa cả 2. Câu báo tối đa 1 lần / 1,5 giây (giữ phím ô dùng nhanh)
const LD_CAM = new Set(["trangThai", "kyNang"]);
const ldCamMon = (k) => { const D = (ItemDB.item(k) || {}).dung; return !!(D && LD_CAM.has(D.loai)) || laVatTk(k); };
let ldCamLuc = 0;
function ldCamDung() {
  const t = performance.now(); if (t - ldCamLuc < 1500) return; ldCamLuc = t;
  P.hud.canh("Trong sân Công Bình Tử không dùng được thuốc, hoàn — rời sân rồi dùng");
}
// ---------- thuốc (25/10): uống ở máy (World.drink hồi sinh lực / nội lực), báo máy chủ trừ bình kèm nhịp ----------
// it = chồng thuốc trong túi. Trả true nếu đã uống.
function drink(it) {
  const x = it && ItemDB.item(it.k);
  if (!world || !x || !x.thuoc || !(it.n > 0) || xepBay) return false; // đang sắp xếp hành trang (xepTui): chờ máy chủ trả túi mới
  if (laLd(world.zone)) { ldCamDung(); return false; } // Lôi Đài Công Bình Tử (anh 17/11): trong sân không dùng được thuốc
  if (!world.drink(x)) return false;
  pending.uong.set(it.u, (pending.uong.get(it.u) || 0) + 1);
  bagMinus(new Map([[it.u, 1]]));
  P.audio.ui("click");
  if (GW) GW.refresh(true);
  return true;
}
// 9 ô đồ của thanh dưới (phím 1–9 như client ShortcutUseItem): hero.nhanh[i] = { k: thuốc } — lưu theo nhân vật (trình duyệt gửi, như
// điểm tiềm năng). Ô chỉ nhớ LOẠI thuốc: uống chồng ít bình nhất của loại đó trong túi (dùng hết chồng lẻ trước). Cầm thuốc trên tay
// (bấm thuốc trong túi) rồi bấm ô để đặt; mua loại mới thì tự vào ô trống đầu tiên (hết ô trống: ô có thuốc cùng loại sinh lực / nội lực
// đã hết bình). Tự uống: theo 3 dòng "SL / NL < x % uống <loại thuốc>" của Trợ Thủ (hero.auto.thuoc — src/game/auto.js; anh 29/10: trước là
// "dùng ô n"), uống khi tác dụng thuốc cùng loại đã hết (uống chồng lên thì mất phần đang hồi), không uống khi đang ngồi / dưỡng sức. Góc
// ô hiện ngưỡng của dòng tự uống đúng loại thuốc trong ô. Thổ Địa Phù (anh 29/10 "cho thổ địa phù có thể đặt vào ô thao tác nhanh"): ô
// { k: phù } — bấm / phím = dùng như chuột phải trong túi (về thành), tự uống không dùng.
// Võ công (anh 25/10): ô còn chứa chiêu — hero.nhanh[i] = { s: mã chiêu }: kéo chiêu từ bảng Võ công (F5) vào ô; bấm / phím = dùng
// (bùa lợi: lên mình, vòng sáng: bật / tắt ở ô tay phải, chiêu đánh: bấm phím — theo con trỏ chuột, bấm ô — con đang nhắm hoặc gần nhất). Gắn / gỡ tùy ý: kéo ô sang ô khác
// = đổi chỗ, kéo ra ngoài thanh hoặc chuột phải = gỡ khỏi ô (ô trống: chuột phải mở Trợ Thủ).
const quick = () => (hero.nhanh = Array.isArray(hero.nhanh) && hero.nhanh.length === 9 ? hero.nhanh : Array(9).fill(null));
const potTotal = () => (hero.bag || []).reduce((t, b) => t + (isPotion(b) ? b.n || 0 : 0), 0); // tổng bình thuốc (mang ≤ luat().mang)
const potCount = (k) => (hero.bag || []).reduce((t, b) => t + (b.k === k ? b.n || 0 : 0), 0);
const potHp = (k, hp) => { const x = ItemDB.item(k); return !!(x && x.thuoc && (hp ? x.hp : x.mp && !x.hp)); }; // thuốc sinh lực / chỉ nội lực
const laPhu = (k) => !!(ItemDB.item(k) || {}).phu; // Thổ Địa Phù
// vật phẩm dùng được (chuột phải trong túi = Dùng — Kỳ Trân Các / vật phẩm có công dụng: Tiên Thảo Lộ, rương, lệnh bài, Chiến cổ…): anh 13/11 lượt 86 "cho các vật phẩm có thể để
// vào ô dùng nhanh" — bấm ô / phím = dùng như chuột phải (dungVat), Trợ Thủ không tự dùng
const laDungNhanh = (k) => { const x = ItemDB.item(k); return !!(x && x.ktc && x.dung && !x.thuoc && !x.phu); };
// chồng ít bình nhất của loại k — thuốc Tống Kim trước (anh 12/11: rời trận là mất, uống trước thuốc thường)
const chongIt = (k) => (hero.bag || []).filter((b) => b.k === k && b.n > 0).sort((a, b) => !a.tk - !b.tk || a.n - b.n)[0];
const thuocHoi = (k, hp) => { const x = ItemDB.item(k); return !!(x && x.thuoc && (hp ? x.hp : x.mp)); }; // thuốc có hồi sinh lực / nội lực (kể cả thuốc hồi cả hai)
const caHai = (k) => { const x = ItemDB.item(k); return x && x.hp && x.mp ? 1 : 0; }; // thuốc hồi cả sinh lực lẫn nội lực (Ngũ Hoa, Hồi Thiên…)
function quickUse(i, auto, byKey) {
  if (DuaNgua.oDua(i)) return auto ? false : DuaNgua.dung(i); // đường đua (anh 16/11): ô 1–3 = ô đạo cụ đua (duangua.js)
  const q = quick()[i];
  if (!q) { if (!auto) P.hud.msg(`Ô ${i + 1} trống — bấm thuốc / vật phẩm trong túi rồi bấm ô này, hoặc kéo chiêu từ bảng Võ công (F5) vào`); return false; }
  if (q.s) return !auto && quickSkill(q.s, byKey);
  if (laDungNhanh(q.k)) { // vật phẩm dùng được (lượt 86): như chuột phải trong túi; chồng khóa bảo hiểm / ít nhất trước
    if (auto) return false;
    const b = (hero.bag || []).filter((o) => o.k === q.k).sort((a, c) => !a.kbh - !c.kbh || (a.n || 1) - (c.n || 1))[0];
    if (!b) { P.hud.msg(`Hết ${ItemDB.item(q.k).n}`); return false; }
    dungVat(b); return true;
  }
  if (laPhu(q.k)) {
    if (auto) return false;
    const b = chongIt(q.k);
    if (!b) { P.hud.msg(`Hết ${ItemDB.item(q.k).n}`); return false; }
    dungPhu(b); return true;
  }
  const st = chongIt(q.k);
  if (!st) { if (!auto) P.hud.msg(`Hết ${(ItemDB.item(q.k) || {}).n || "thuốc"}`); return false; }
  return drink(st);
}
// vừa mua thuốc k: loại chưa có ô thì đặt vào ô trống đầu tiên; hết ô trống thì ô có thuốc cùng loại (sinh lực / nội lực) đã hết bình
function quickAdd(k) {
  if (!isPotion({ k })) return; // chỉ thuốc tự vào ô dùng nhanh (ngựa / đồ mua ở Mã phu, Tạp hóa thì không — 27/10)
  const L = quick(); if (L.some((q) => q && q.k === k)) return;
  let i = L.indexOf(null);
  if (i < 0) i = L.findIndex((q) => q && q.k && isPotion({ k: q.k }) && !potCount(q.k) && potHp(q.k, true) === potHp(k, true));
  if (i < 0) return;
  L[i] = { k }; save();
  P.hud.msg(`Đặt ${ItemDB.item(k).n} vào ô ${i + 1} (phím ${i + 1})`);
}
// dùng chiêu ở ô dùng nhanh: bùa lợi lên mình, vòng sáng bật / tắt (ô tay phải), chiêu đánh / bùa hại theo CON TRỎ CHUỘT (anh 26/10 — bản
// đầu chạy tới con đang nhắm / gần nhất): quái dưới chuột thì đánh con đó, không thì ra ngay vào khoảng không chỗ trỏ (World.castAt).
// Bấm ô bằng chuột (con trỏ đang trên thanh dưới) / chuột chưa từng rê lên cảnh thì như cũ
function quickSkill(id, byKey) {
  if (!world || !P.vc) return false;
  const s = P.skillDb[id], k = kindOf(s, P.skillDb), p = world.player, O = (hero.oChieu = hero.oChieu || {});
  if (!s) return false;
  if (!(world.skLv(id) > 0)) { P.hud.msg(`Chưa học ${s.n}`); return false; }
  if (k === "aura") { const on = O.phai !== id; setSkill("right", on ? id : 0); P.hud.msg(`${s.n}: ${on ? "bật" : "tắt"}`); return true; }
  if (k === "buff") return world.castSelf(id);
  if (byKey && mouseC) { const x = mouseC[0] / zoom + cam.x, y = mouseC[1] / zoom + cam.y; return world.castAt(id, world.mobAt(x, y), x, y); }
  if (k === "jump") { const [x, y] = truocMat(world.skRange(id, 1)); return world.castAt(id, null, x, y); } // bấm ô bằng chuột / chạm ô: nhảy thẳng về phía trước
  const c = world.skCan(id); if (!c.ok) { P.hud.msg(c.why); return false; }
  // điện thoại: con gần trong tầm (mucGan) — không có thì chiêu đánh ra thẳng trước mặt, bùa hại báo; không chạy đi tìm con ở xa (handUse)
  if (DT && DT.on) {
    const R = world.skRange(id, world.skLv(id)), g = mucGan(R);
    if (g) return world.castAt(id, g, g.x, g.y);
    if (k === "curse") { P.hud.msg("Không có mục tiêu gần"); return false; }
    const [x, y] = truocMat(R); return world.castAt(id, null, x, y);
  }
  const m = p.target && p.target.alive ? p.target : world.nearestMob();
  if (!m) { P.hud.msg("Không có mục tiêu gần"); return false; }
  if (k === "move") return world.castAt(id, m, m.x, m.y); // di hình: tới con đang nhắm / gần nhất
  world.clickMob(m); p.once = id;
  return true;
}
// điện thoại, ô kỹ năng đang khóa (dienthoai.js datOKhoa — anh 31/10 lần 2): chạm ô T / P = ra chiêu tay đó vào con đang nhắm / gần nhất như chạm
// ô dùng nhanh có chiêu (tay trái trống: đánh thường; tay phải bùa lợi: lên mình, vòng sáng: báo đang bật — World.useLeft / useRight)
function handUse(side) {
  if (!world || !hero) return false;
  const O = hero.oChieu || {}, id = side === "left" ? O.trai : O.phai, s = id && P.skillDb[id], k = s && kindOf(s, P.skillDb), p = world.player;
  if (side === "right" && !s) { P.hud.msg("Ô tay phải chưa có chiêu — mở khóa ô kỹ năng (nút khóa cạnh ô) rồi chạm ô P để chọn"); return false; }
  if (k === "aura" || k === "buff") return world.useRight(null, p.x, p.y);
  if (k === "jump") { const [jx0, jy0] = truocMat(world.skRange(id, 1)); return world.useRight(null, jx0, jy0); } // chạm ô: nhảy thẳng về phía trước; kéo ô để ngắm chỗ nhảy (dienthoai.js _ngam)
  const R = s ? world.skRange(id, world.skLv(id)) : DON_THUONG_R, m = mucGan(R);
  if (m) return side === "left" ? world.useLeft(m, m.x, m.y) : world.useRight(m, m.x, m.y);
  if (k === "curse") { P.hud.msg("Không có mục tiêu gần"); return false; }
  const [x, y] = truocMat(R);
  return side === "left" ? world.useLeft(null, x, y) : world.useRight(null, x, y);
}
// điện thoại — chạm ô chiêu (không kéo): con đang nhắm hoặc con gần mình nhất trong tầm chiêu + MUC_GAN (anh 31/10 lần 3: "bấm kĩ năng thì nó tự
// chạy đi đâu ấy, nó tự kiếm mục tiêu à?" — trước dùng nearestMob của tự đánh: tìm quanh chỗ Trợ Thủ đang tới, ưu tiên boss thế giới ở xa ->
// nhân vật chạy đi xa); null: không con nào đủ gần
const MUC_GAN = 150, DON_THUONG_R = 80;
function mucGan(R) {
  const p = world.player, xa = (m) => ldist(p.x, p.y, m.x, m.y) - (m.radius || 0);
  if (p.target && p.target.alive && world.mobs.includes(p.target) && xa(p.target) <= R + MUC_GAN) return p.target;
  let best = null, bd = R + MUC_GAN;
  for (const m of world.mobs) { if (!m.alive) continue; const d = xa(m); if (d < bd) { bd = d; best = m; } }
  return best;
}
// chỗ trước mặt nhân vật cách R (hướng đang nhìn — src/dir.js: 0 xuống, 2 trái, 4 lên, 6 phải; trục dọc bản đồ = nửa trục màn hình như World)
function truocMat(R) { const p = world.player, a = ((p.dir | 0) * Math.PI) / 4; return [p.x - Math.sin(a) * R, p.y + (Math.cos(a) * R) / 2]; }
// kéo thả (chiêu từ bảng Võ công, ô dùng nhanh): bấm giữ + kéo quá 6 điểm mới tính là kéo; thả lên ô 1–9 = đặt / đổi chỗ, lên ô T P (chiêu)
// = chọn chiêu tay đó, chỗ khác = gỡ (khi kéo từ ô dùng nhanh)
let drag = null, dragEnd = 0;
function dragBegin(e, pay) {
  if (e.button !== 0 || !pay.ic) return;
  drag = { ...pay, x: e.clientX, y: e.clientY, moved: false };
}
function quickDown(i, e) {
  if (DuaNgua.oDua(i)) return; // đường đua (soát 16/11): ô 1–3 đang là ô đạo cụ đua — không kéo món / chiêu thật đang ẩn dưới ô
  const q = quick()[i]; if (!q || (GW && GW.holding)) return;
  // điện thoại: ô kỹ năng khóa (dienthoai.js datOKhoa — chỉ dùng) thì không kéo đổi chỗ / gỡ (kéo ô có chiêu đánh / bùa hại / di hình = ngắm chiêu —
  // dienthoai.js _ngam); mở khóa: kéo đổi chỗ / gỡ như máy tính
  if (DT && DT.on && e.pointerType === "touch" && DT.oKhoa) return;
  const x = q.k && ItemDB.item(q.k);
  dragBegin(e, { ...q, from: i, ic: q.s ? P.skillIcon[q.s] : x && x.ic });
}
addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.moved = true; if (GW) GW._hideTip();
    drag.el = Object.assign(document.createElement("img"), { className: "jx-dragic", src: "assets/web/icon/" + drag.ic, draggable: false });
    document.body.appendChild(drag.el);
  }
  drag.el.style.left = e.clientX - 16 + "px"; drag.el.style.top = e.clientY - 16 + "px";
});
addEventListener("pointerup", (e) => {
  const d = drag; drag = null;
  if (!d || !d.moved) return;
  d.el.remove(); dragEnd = performance.now();
  if (!hero) return;
  const t = document.elementFromPoint(e.clientX, e.clientY), slot = t && t.closest(".jx-slot[data-slot]"), side = t && t.closest(".jx-skill[data-skill]");
  const L = quick(), what = d.s ? (P.skillDb[d.s] || {}).n : (ItemDB.item(d.k) || {}).n;
  if (slot && DuaNgua.oDua(+slot.dataset.slot)) return P.hud.canh("Ô 1–3 đang là ô đạo cụ đua — chưa đặt được món / chiêu khác"); // đường đua (soát 16/11)
  if (slot) {
    const i = +slot.dataset.slot;
    if (d.from != null) { [L[i], L[d.from]] = [L[d.from], L[i]]; }
    else {
      if (d.s && kindOf(P.skillDb[d.s], P.skillDb) === "passive") return P.hud.msg(`${what}: chiêu bị động — tự có tác dụng, không cần đặt vào ô`);
      const was = L.findIndex((q) => q && (d.s ? q.s === d.s : q.k === d.k)); if (was >= 0) L[was] = null;
      L[i] = d.s ? { s: d.s } : { k: d.k };
      P.hud.msg(`Đặt ${what} vào ô ${i + 1} (phím ${i + 1})`);
      if (d.s && P.vc) P.vc.warm(d.s);
    }
    P.audio.ui("click"); save(); quickHud(); return;
  }
  if (side && d.s) {
    const sd = side.dataset.skill, ok = skillsUsable().find((x) => x.id === d.s && (sd === "right" || ((x.kind === "attack" || x.kind === "curse") && (P.vc.sk(x.id) || {}).lr !== 2)));
    if (!ok) return P.hud.msg(`${what}: không đặt được vào ô tay ${sd === "left" ? "trái" : "phải"}`);
    P.audio.ui("click"); return setSkill(sd, d.s);
  }
  if (d.from != null) { L[d.from] = null; P.audio.ui("click"); save(); quickHud(); P.hud.msg(`Gỡ ${what} khỏi ô ${d.from + 1}`); }
}, true);
// bấm ô: đang cầm thuốc / Thổ Địa Phù -> đặt vào ô (loại đó ở ô khác thì dời sang); tay trống -> dùng (vừa kéo xong thì bỏ qua lần bấm)
function quickClick(i, e) {
  if (performance.now() - dragEnd < 300) return;
  if (DuaNgua.oDua(i)) { if (GW && GW.holding) return P.hud.canh("Ô 1–3 đang là ô đạo cụ đua — chưa đặt được món khác"); DuaNgua.dung(i); return; } // đường đua: bấm / chạm ô = dùng đạo cụ đua
  const it = GW && GW.holding;
  // điện thoại (dienthoai.js datOKhoa — anh 31/10 lần 2 "đổi trạng thái gắn skill và dùng skill / vật phẩm, nếu không sẽ bị rối thao tác"): ô kỹ
  // năng khóa = chỉ dùng (ô trống: nhắc cách gắn), mở khóa = chạm ô mở bảng chọn chiêu / thuốc
  if (DT && DT.on && !it) {
    if (!DT.oKhoa) return quickPick(i, e && e.target && e.target.closest(".jx-slot"));
    return quick()[i] ? quickUse(i) : P.hud.msg(`Ô ${i + 1} trống — chạm nút khóa cạnh ô (mở khóa) rồi chạm ô để gắn chiêu / thuốc`);
  }
  if (!it && !quick()[i]) return quickPick(i, e && e.target && e.target.closest(".jx-slot")); // ô trống: bảng chọn chiêu / thuốc
  if (!it) return quickUse(i);
  if (!isPotion(it) && !laPhu(it.k) && !laDungNhanh(it.k)) return P.hud.msg("Ô phím tắt chỉ đặt được chiêu, thuốc, Thổ Địa Phù và vật phẩm dùng được (chuột phải = Dùng)");
  const L = quick(), was = L.findIndex((q) => q && q.k === it.k);
  if (was >= 0) L[was] = null;
  L[i] = { k: it.k };
  GW.drop(); save();
}
// chuột phải ô: gỡ khỏi ô (anh 25/10: chuột phải trước là uống, không gỡ được); ô trống: mở Trợ Thủ. Điện thoại (chạm giữ): bảng chọn chiêu /
// thuốc cho ô, có "Gỡ khỏi ô" (anh 30/10 — trước chạm giữ ô trống mở bảng cài đặt Trợ Thủ) — chỉ lúc mở khóa ô kỹ năng (dienthoai.js datOKhoa)
function quickMenu(i, e) {
  if (DuaNgua.oDua(i)) return P.hud.canh(`Ô đạo cụ đua ${i + 1} — phím ${i + 1} / bấm ô để dùng`); // đường đua: ô 1–3 không gỡ / đổi được
  if (DT && DT.on) return DT.oKhoa ? DT.nhacKhoa() : quickPick(i, e && e.target && e.target.closest(".jx-slot"));
  const L = quick(), q = L[i];
  if (q) { L[i] = null; save(); quickHud(); P.audio.ui("click"); P.hud.msg(`Gỡ ${q.s ? (P.skillDb[q.s] || {}).n : (ItemDB.item(q.k) || {}).n} khỏi ô ${i + 1}`); return GW && GW._hideTip(); }
  if (TT) TT.open(0);
}
// ngưỡng tự uống của ô i (dòng Trợ Thủ đang bật uống đúng loại thuốc trong ô); sân lôi đài: 0 — trong sân không tự uống (autoDrink), ô không hiện mức tự uống (soát 16/11)
const quickPct = (i) => { if (world && laLd(world.zone)) return 0; const q = quick()[i], r = q && q.k && hero.auto.thuoc.find((t) => t.on && t.k === q.k); return r ? r.pct : 0; };
function quickTip(i, e) {
  // đường đua (anh 16/11): ô 1–3 là ô đạo cụ đua — ô xem chữ của game (data-tip — windows.js _tipChu); ra khỏi đường đua thì gỡ chữ đó khỏi ô
  const oEl = e && e.target && e.target.closest ? e.target.closest(".jx-slot") : null;
  if (DuaNgua.oDua(i)) { if (GW) { GW._hideTip(); GW._hideSkTip(); } if (oEl) { oEl.dataset.tip = DuaNgua.tipChu(i); oEl.dataset.dn = "1"; } return; }
  if (oEl && oEl.dataset.dn) { delete oEl.dataset.tip; delete oEl.dataset.dn; }
  const q = i >= 0 && quick()[i];
  if (q && q.s) { if (GW) GW._skillTipAt(q.s, e); return; }
  if (GW) GW._hideSkTip();
  const x = q && ItemDB.item(q.k);
  if (!x) return GW && GW._hideTip();
  const n = potCount(q.k), pct = quickPct(i);
  if (x.phu) return GW._showTip({ k: q.k, n }, e, [`Còn ${n} tấm`, `Phím ${i + 1} / bấm: dùng (về thành) · chuột phải: gỡ khỏi ô · kéo: đổi ô`]);
  if (laDungNhanh(q.k)) return GW._showTip({ k: q.k, n }, e, [`Còn ${n}`, `Phím ${i + 1} / bấm: dùng · chuột phải: gỡ khỏi ô · kéo: đổi ô`]);
  GW._showTip({ k: q.k, n }, e, GW._potHint(x, n, [`Phím ${i + 1} / bấm: uống · chuột phải: gỡ khỏi ô · kéo: đổi ô`, world && laLd(world.zone) ? "Trong sân Công Bình Tử không dùng được thuốc" : `Tự uống: ${pct ? `khi dưới ${pct}%` : "tắt"} (Trợ Thủ → Thuốc)`]));
}
function quickHud() {
  P.hud.setQuick(quick().map((q, i) => {
    if (DuaNgua.oDua(i)) return DuaNgua.oHud(i); // đường đua: ô 1–3 hiện đạo cụ đua (trống = ô trống)
    if (q && q.s) return P.skillIcon[q.s] ? { ic: P.skillIcon[q.s], skill: 1 } : null;
    const x = q && ItemDB.item(q.k); return x ? { ic: x.ic, n: potCount(q.k), tu: quickPct(i) } : null;
  }));
}
// lớp hồi chiêu trên ô T / P và ô dùng nhanh có võ công (World p.cd = lúc hết hồi, p.cdLen = độ dài hồi chiêu)
function cooldownHud() {
  const p = world.player, O = hero.oChieu || {}, now = world.time;
  const cd = (id) => { const end = id && p.cd[id], len = id && p.cdLen && p.cdLen[id]; return end > now && len ? { k: Math.min(1, (end - now) / len), s: end - now } : null; };
  P.hud.setCooldowns({ left: cd(O.trai), right: cd(O.phai), slots: quick().map((q, i) => (q && q.s && !DuaNgua.oDua(i) ? cd(q.s) : null)) });
}
function autoDrink() {
  const p = world.player;
  if (p.hp <= 0 || p.sit || world.resting) return;
  if (laLd(world.zone)) return; // lôi đài (anh 15/11 D9): Trợ Thủ không hoạt động trong sân — không tự uống thuốc (uống tay vẫn được); cả lúc bù quãng tab ẩn (simulate)
  // Trợ Thủ thẻ PK (anh 06/11 — trong trận Tống Kim, đang tự đánh): uống theo mức "SL < / NL <" của thẻ PK thay mức từng dòng thẻ Thuốc (dòng tắt cũng
  // uống), loại thuốc vẫn theo dòng thẻ Thuốc
  const K = world.auto && world.pk ? world.pk() : null;
  for (const r of hero.auto.thuoc) {
    if (!r.on && !K) continue;
    // thẻ PK: mức SL / NL của thẻ; đang lui về doanh (World.pkLuiDang) thì uống tới mức ra trận lại = max(K.ra, K.vePct + 1) như World.pkLuiTick (soát
    // 06/11 — không thì đứng ở doanh mãi)
    const [v, max, e] = r.loai === "hp" ? [p.hp, p.hpMax, p.potHp] : [p.mp, p.mpMax, p.potMp], pct = K ? (r.loai === "hp" ? (world.pkLuiDang ? Math.max(K.sl, K.ra, K.vePct + 1) : K.sl) : K.nl) : r.pct;
    if (v * 100 < max * pct && !(e && e.n > 0)) {
      const c = r.k && chongIt(r.k);
      if (c && drink(c)) return;
      // chọn "bất kỳ" / hết loại đã chọn: uống thuốc khác trong túi có hồi loại đó — cả thuốc hồi cả hai (anh 03/11 "bất kì loại thuốc sinh / nội nào cũng
      // tác dụng với các loại hồi cả 2 như hồi thiên hay ngũ hoa"; bản trước dòng nội lực bỏ qua thuốc hồi cả hai): thuốc một loại trước, rồi thuốc hồi cả
      // hai (đắt — Vượt Ải / Kỳ Trân Các), mỗi nhóm chồng ít bình nhất trước
      const hp = r.loai === "hp", st = (hero.bag || []).filter((b) => b.n > 0 && thuocHoi(b.k, hp)).sort((a, b) => !a.tk - !b.tk || caHai(a.k) - caHai(b.k) || a.n - b.n)[0];
      if (st && drink(st)) return;
    }
  }
}

// ---------- Trợ Thủ: treo máy (hero.auto.treo — src/game/auto.js) ----------
// Đang tự đánh ở bãi train: SL dưới ngưỡng "về thành" -> rời bãi về thành dưỡng sức; túi còn ≤ n ô trống / thuốc sinh lực / nội lực còn
// ≤ n bình / trang bị sắp hỏng (độ bền ≤ n %) -> về thành (anh 28/10 lần 4: bản trước chỉ khi bật "Treo ở" — anh tưởng chưa có; nay chỉ cần
// đang tự đánh). Ở thành cất tiền vào rương, giữ lại treo.cat.giu lượng (anh 28/10 lần 4). Ở thành (cả khi trọng thương về): đi tới NPC có cửa hàng thuốc (Dược
// điếm) -> máy chủ bán đồ trong túi theo mức Tự bán + sửa đồ + mua thuốc đủ số (act "thanh" — may-chu/do.js) -> còn món mức Tự bán giữ lại
// (đủ dòng) thì chạy tới Rương chứa đồ cất vào (treo.catDo — act "catDo", anh 31/10) -> ngồi dưỡng sức -> quay lại bãi treo máy (onRested). Về thành vì túi /
// thuốc mà ra thành vẫn không đỡ (mức Tự bán không bán được gì, hết tiền) thì không về vì lý do đó nữa tới khi túi / thuốc khá lên.
let thanh = null;                     // { buoc: "di" | "mua" | "ruong" | "cat" | "nghi", t0 / t1: lúc bắt đầu đi (ms), why, truoc: túi / thuốc lúc tới }
const treoNghi = { tui: false, thuoc: false, nl: false, phu: false, sua: false };
// trang bị đang mặc có độ bền còn ≤ pct % độ bền tối đa (ít nhất 1 điểm) — Trợ Thủ về thành sửa (anh 26/10 "sửa đồ")
const doSap = (pct) => Object.values(hero.equip || {}).some((it) => { const mx = benMax(it.k); return mx > 0 && benCua(it) <= Math.max(1, Math.floor((mx * pct) / 100)); });
// Kim Tê trong túi (Kỳ Trân Các — sửa đồ tại chỗ, may-chu/do.js dungVat kimTe)
const kimTeTui = () => (hero.bag || []).find((b) => ((ItemDB.item(b.k) || {}).dung || {}).loai === "kimTe");
let kimTeLuc = -1e9;
const hpPotions = () => (hero.bag || []).reduce((t, b) => t + (potHp(b.k, true) ? b.n || 0 : 0), 0);
const mpPotions = () => (hero.bag || []).reduce((t, b) => { const x = ItemDB.item(b.k); return t + (x && x.thuoc && x.mp ? b.n || 0 : 0); }, 0); // thuốc có hồi nội lực
const freeCells = () => oTrong(hero.bag, (b) => (ItemDB.item(b.k) || {}).c || [1, 1]);
// hành trang còn chỗ cho 1 món to (Trợ Thủ → Về thành — anh 08/11 "đếm ô tổng, ở đây em đổi thành nếu k đủ 6 ô thì là 1 món 6 ô, k đủ 8 ô thì là món 8 ô"): 6 ô = 2 × 3, 8 ô = 2 × 4
const conChoMon = (T) => coCho(hero.bag, (b) => (ItemDB.item(b.k) || {}).c || [1, 1], 2, T.oMon === 8 ? 4 : 3);
// Về thành chỉ bằng Thổ Địa Phù (anh 26/10): hết phù thì báo 1 lần và ở lại bãi (treoNghi.phu) tới khi trong túi có phù. tz: mã thành muốn về (tự làm
// nhiệm vụ — tulam.js: Sát thủ về Ba Lăng huyện); không có thì thành Trợ Thủ về (shopTown). -> đã dùng phù đi?
function veThanh(why, tz) {
  const town = (tz && P.maps.zones.find((z) => z.id === tz)) || shopTown(); if (!town || thanh || zoneLoad) return false;
  if (camPhu()) { if (world && !world._phuBao) { world._phuBao = true; P.hud.msg(`Trợ Thủ: ${why} nhưng ở đây không dùng được Thổ Địa Phù (Phong Lăng Độ — về bờ Nam bằng Thuyền phu)`); } return false; }
  const b = phuTrongTui();
  if (!b) { if (!treoNghi.phu) P.hud.msg(`Trợ Thủ: ${why} nhưng hết Thổ Địa Phù — không về thành được (Tạp hóa Ba Lăng bán)`); treoNghi.phu = true; return false; }
  thanh = { buoc: "di", t0: performance.now(), why };
  P.hud.msg(`Trợ Thủ: ${why} — dùng Thổ Địa Phù về ${town.n}`);
  dungPhu(b, { rest: true, thanh: town }).then((ok) => { if (!ok) thanh = null; });
  return true;
}
const phuTrongTui = () => (hero.bag || []).find((b) => b.n > 0 && isPhu(b)) || null;
// Thổ Địa Phù (anh 26/10): dùng ở bãi luyện công -> về thành (thành Trợ Thủ về — shopTown: Ba Lăng huyện / Biện Kinh, anh 03/11; opt.thanh: thành
// khác — tự làm nhiệm vụ), nhớ chỗ dùng: Xa phu "Trở lại địa điểm cũ" đưa về đúng chỗ đó (client ReturnFromPortal). Máy chủ trừ 1 tấm (act "phu")
function dungPhu(b, opt = {}) {
  if (!world || !b || zoneLoad) return Promise.resolve(false);
  if (camPhu()) { P.hud.canh("Không thể sử dụng Thổ Địa Phù ở đây"); return Promise.resolve(false); } // thuyền / bờ Bắc Phong Lăng Độ (client G_ItemList_0)
  if (!FARM_KINDS.has(world.zone.kind)) { P.hud.msg("Đang ở thành — Thổ Địa Phù dùng ở bãi luyện công"); return Promise.resolve(false); }
  const { thanh: tz, ...o } = opt, town = tz || shopTown() || townZone(), p = world.player, cu = { z: world.zone.id, x: Math.round(p.x), y: Math.round(p.y), ...(world.chung ? { c: 1 } : {}) };
  if (!town) return Promise.resolve(false);
  return doItem({ act: "phu", u: b.u }).then((ok) => {
    if (!ok) return false;
    hero.diemCu = cu; hero.farmZone = cu.z; hero.farmChung = cu.c ? 1 : 0; save();
    P.audio.ui("click");
    return gotoZone(town, o).then(() => true);
  }).catch((e) => { fail(e); return false; });
}
// ---------- Xa phu (anh 26/10: bỏ đi bản đồ bằng chọn trên bản đồ nhỏ, chỉ đi bằng Xa phu) ----------
// Hàm của client script\global\station.lua: "Những nơi đã đi qua" (WayPointFun) — client: 3 nơi luyện công vừa đi qua; bản đồ game không
// nối nhau nên là mọi bãi luyện công đủ cấp, bãi cao trước; miễn phí như script (PrePay đã tắt). "Những thành thị đã đi qua" (StationFun) —
// client: thành có đường xe từ thành này (settings\stationprice.txt: Ba Lăng chỉ nối Tương Dương, Giang Tân Thôn, Nam Nhạc trấn); game (anh
// 02/11 — Biện Kinh dựng nguyên): mọi thôn / thành đã có bản đồ, trừ chỗ đang đứng, miễn phí như Những nơi đã đi qua; chưa có thì câu "chưa đi
// đâu cả" của client. "Trở lại địa điểm cũ" (TownPortalFun) — chỗ đã dùng Thổ Địa Phù, miễn phí như script
const XE_KHONG = "Xin lỗi!  Ta chỉ có thể đưa ngươi đến những nơi đã đi qua nhưng ngươi chưa đi đâu cả! ";
// Boss Sát thủ đang nhận (hero.satThu — may-chu/sat-thu.js tomTat): { b (assets/data/sat-thu.json), z (bãi) } | null
const satNv = () => { const S = hero && hero.satThu, b = S && S.nv && P.satThu ? P.satThu.boss[S.nv] : null, z = b && P.maps.zones.find((x) => x.id === b.bai); return z ? { b, z } : null; };
// Xa phu "Đưa ta đến bản đồ nhiệm vụ sát thủ" (anh 03/11 "khi nhận nv sát thủ xong, ở xa phu thêm 1 nút là đưa ta đến bản đồ làm nv sát thủ"):
// bản quái chung của bãi có boss (boss chỉ ra ở bản chung — may-chu/quai-chung.js satBai), đứng ở chỗ vào bãi như đi Xa phu thường
function xeSat({ b, z }) {
  if (zoneLoad) return;
  const c = laQc(z);
  P.hud.msg(`Ngồi yên chưa? Chúng ta đi ${z.n}${c ? " (bản quái chung)" : ""}`);
  hero.farmZone = z.id; hero.farmChung = c ? 1 : 0;
  gotoZone(z, c ? { chung: true } : {}).then(() => P.hud.msg(`Sát thủ ${b.ten} ở (${b.X}/${b.Y}) — bấm tọa độ ở bảng nhiệm vụ bên trái để tự chạy tới`)).catch(fail);
}
// Điểm báo danh Tống Kim (client NewWorld(325, x, y) — item\battles\rescript.lua, song_transport.lua): phe Vàng (Tống) 1541, 3178; phe Tím (Kim) 1570, 3085 -> tọa độ bản đồ web
const TK_BD = { z: 325, at: [[888, 2040], [1584, 924]] };
function xaPhuFn(id) {
  // Khu vực bang hội (đợt 4 — Xa phu các thành, chỉ thành viên): máy chủ xét (khu của bang, chỗ đang đứng) rồi trả di; không được thì câu máy chủ trong khung Xa phu
  if (id === "KhuBangHoi") return khuLam({ viec: "vao" }, true).then((j) => {
    if (!j || j.boQua || j.ma === "het-phien") return { close: true };
    if (j.loi) return { text: j.loi, opts: [["Đâu cũng không muốn đi!", null]] };
    for (const t of j.tin || []) P.hud.msg(t);
    if (j.di) diPld(j.di);
    return { close: true };
  });
  if (id === "TkBaoDanh") return { text: "Xin lựa chọn: ", opts: [["Vào điểm báo danh phe Vàng (T)", "TkBd0"], ["Vào điểm báo danh phe Tím (K)", "TkBd1"], ["Không đi đâu cả ", null]] };
  if (id === "TkBd0" || id === "TkBd1") {
    const z = P.maps.zones.find((x) => x.id === TK_BD.z);
    if (!z) return { text: "Trình duyệt chưa có bản đồ Điểm báo danh — tải lại trang (F5) rồi nói chuyện lại.", opts: [] };
    if (zoneLoad) return { close: true };
    P.hud.msg(`Ngồi yên chưa? Chúng ta đi ${z.n}`);
    gotoZone(z, { at: TK_BD.at[id === "TkBd1" ? 1 : 0] }).catch(fail);
    return { close: true };
  }
  if (id === "BanDoSatThu") {
    const v = satNv();
    if (!v) return { text: "Ngươi chưa nhận nhiệm vụ sát thủ — hãy gặp Nhiếp Thí Trần ở Ba Lăng huyện.", opts: [] };
    if (!moBai(v.z)) return { text: chuaMo(v.z), opts: [] };
    xeSat(v);
    return { close: true };
  }
  if (id === "NoiDaTau") return denDaTau(true); // anh 11/11 (kiểu A): máy chủ tính nơi + kiểm (Xa phu ở thành — miễn phí); khung giữ tới khi có trả lời
  if (id === "WayPointFun") {
    const zs = P.maps.zones.filter((z) => FARM_KINDS.has(z.kind) && !z.chiThuyen && moBai(z)).sort((a, b) => b.lo - a.lo || (a.kind === "chính" ? -1 : 1));
    if (!zs.length) return { text: XE_KHONG, opts: [] };
    return { text: "Xin lựa chọn: ", opts: [...zs.map((z) => [`${z.n} (cấp ${z.lo}–${z.hi})`, xeChon(z)]), ["Không đi đâu cả ", null]] };
  }
  // bãi có 2 bản (anh 03/11 — luat().quaiChung.bai): quái riêng như mọi bãi / quái chung cùng người khác, thêm % kinh nghiệm + ngân lượng
  if (/^BanBai:\d+$/.test(id)) {
    const z = P.maps.zones.find((x) => x.id === +id.split(":")[1]);
    if (!z || !moBai(z)) return { text: XE_KHONG, opts: [] };
    // khung lời client ngắt dòng giữa chữ (bản đầu "người chơi khá / c") -> tự xuống dòng, mỗi dòng ≤ ~50 ký tự
    return { text: `${z.n} có hai bản,<enter>ngươi muốn vào bản nào?<enter><color=yellow>Quái riêng<color>: quái của riêng ngươi, như các bãi khác.<enter><color=yellow>Quái chung<color>: đánh chung bầy quái với người khác,<enter>thêm <color=yellow>${qcPct()}%<color> kinh nghiệm và ngân lượng.`,
      opts: [["Quái riêng", () => xeToi(z, null, false)], [`Quái chung (+${qcPct()}%)`, () => xeToi(z, null, true)], ["Không đi đâu cả ", null]] };
  }
  // "Khu vực luyện công" (anh 29/10 — game thêm, client không có): ô = 1 mốc cấp (bãi cùng cấp vào, như bản đồ chia 1–10, 10–20 …), chọn ô
  // thì ra các bãi của mốc đó. Chỉ bãi đủ cấp vào; bờ Bắc Phong Lăng Độ chỉ tới bằng thuyền nên không có
  if (id === "KhuLuyenCong" || /^KhuLuyenCong:\d+$/.test(id)) {
    const zs = P.maps.zones.filter((z) => FARM_KINDS.has(z.kind) && !z.chiThuyen && moBai(z)).sort((a, b) => a.lo - b.lo || (a.kind === "chính" ? -1 : 1));
    if (!zs.length) return { text: XE_KHONG, opts: [] };
    const nhom = new Map();
    for (const z of zs) { const g = nhom.get(z.lo) || []; g.push(z); nhom.set(z.lo, g); }
    if (id === "KhuLuyenCong") {
      return { text: "Khu vực luyện công — xin chọn cấp: ", opts: [...[...nhom].reverse().map(([lo, g]) => [`Cấp ${lo} – ${Math.max(...g.map((z) => z.hi))} (${g.length} bãi)`, "KhuLuyenCong:" + lo]), ["Không đi đâu cả ", null]] };
    }
    const g = nhom.get(+id.split(":")[1]) || [];
    return { text: "Xin lựa chọn: ", opts: [...g.map((z) => [`${z.n} (cấp ${z.lo}–${z.hi})`, xeChon(z)]), ["Chọn cấp khác", "KhuLuyenCong"], ["Không đi đâu cả ", null]] };
  }
  if (id === "StationFun") {
    const zs = P.maps.zones.filter((z) => TOWN_KINDS.has(z.kind) && !z.tkBd && !z.bang && (!world || z.id !== world.zone.id)); // tkBd: Điểm báo danh Tống Kim chọn phe riêng (TkBaoDanh); bang: khu vực bang (đợt 4 — KhuBangHoi)
    if (!zs.length) return { text: XE_KHONG, opts: [] };
    return { text: "Xin lựa chọn: ", opts: [...zs.map((z) => [z.n, () => xeThanh(z)]), ["Không đi đâu cả ", null]] };
  }
  if (id === "GotoClearSkillMap") { tayTuy({ viec: "xaPhu" }); return { close: true }; } // đảo Tẩy Tủy (may-chu/tay-tuy.js)
  if (id === "TownPortalFun") {
    const d = hero.diemCu, z = d && P.maps.zones.find((x) => x.id === d.z);
    if (!z) return { text: "Ngươi chưa dùng Thổ Địa Phù — không có địa điểm cũ để trở lại.", opts: [] };
    xeToi(z, [d.x, d.y], !!d.c); // c: dùng phù ở bản quái chung
    return { close: true };
  }
  return null;
}
// Hàm script do game làm (anh 27/10): Thẩm Cửu Ba Lăng (script client 巴陵县_路人10商人对话.lua buy_addibox / box_help — client bán 1 rương
// mở rộng 20 tiền đồng; bản mình 3 rương 50 / 100 / 200 Xu — luat().ruong) và Tiền trang (NPC thêm — assets/data/npc-them.json: đổi ngân
// lượng mang theo lấy Xu, luat().tienTrang.luongMotXu mỗi Xu). Trả { text, opts } như xaPhuFn
function chucNangFn(id, npc) {
  const L = luat();
  if (id === "NhapMaKichHoat") { nhapMaKichHoat(); return { close: true }; } // Lễ quan Ba Lăng (anh 29/10)
  if (id === "HuyVatPham") { huyVatPham(); return { close: true }; } // Lễ quan: hủy vật phẩm (anh 05/11)
  if (/^MoPassRuong(:|$)/.test(id)) return moPassRuong(id); // Lễ quan: xóa mật mã rương (anh 29/10 lần 3)
  if (id === "buy_addibox") {
    const gia = (L.ruong || {}).moRong || [], n = hero.ruongMo | 0;
    if (n >= gia.length) return { text: `Thẩm Cửu: Ngươi đã có đủ ${gia.length} rương mở rộng rồi, ta không còn chiếc nào nữa.`, opts: [["Đa tạ", null]] };
    return { text: `Thẩm Cửu: Đây là chiếc rương được làm từ đá san hô xanh, có thể cho ngươi bỏ thêm vật phẩm, còn có thể khóa lại một cách an toàn.<enter>Rương mở rộng thứ <color=yellow>${n + 1}<color>: <color=yellow>${gia[n]} Xu<color> (trên người có ${hero.xu | 0} Xu).`,
      opts: [[`Dùng ${gia[n]} Xu để mua.`, () => doItem({ act: "moRuong" })], ["Đắt quá! Lần sau sẽ mua! ", null]] };
  }
  if (id === "box_help") {
    const gia = (L.ruong || {}).moRong || [];
    return { text: `Mỗi nhân vật mua được ${gia.length} rương mở rộng (${gia.join(" / ")} Xu), mỗi rương 60 ô, chức năng như rương ban đầu chỉ không cất được tiền bạc. Mua rồi thì có mật mã bảo vệ trang bị trên người cũng như trong rương: khóa lại thì trang bị trên người không mặc lên cũng như cởi bỏ được, đồ và tiền trong rương không lấy ra được.<enter>Ở rương chứa đồ: nút <color=yellow>Mật mã<color> để thiết lập / đổi mật mã (1 – 9 chữ số), nút <color=yellow>Khóa<color> để khóa / mở khóa, nút <color=yellow>Rương mở rộng<color> để đổi rương.`, opts: [["Đã hiểu", null]] };
  }
  // Chủ Chợ Trời (NPC game thêm — assets/data/npc-them.json, anh 02/11 chợ trời): bảng Chợ Trời + cách bày bán
  if (id === "choTroi") {
    const thue = (L.choTroi || {}).thue ?? 20, cap = (L.choTroi || {}).cap ?? 80, tMua = (L.choTroi || {}).thueMua ?? thue, tBan = (L.choTroi || {}).thueBan ?? 0; // thuế chia 2 bên (anh 18/11)
    // cách bày bán: từng trang ngắn trong khung lời NPC (anh 02/11 — bản đầu dồn cả đoạn vào khung báo nên tràn chữ); không viết hoa chữ có dấu (phông
    // khung lời của client thiếu chữ hoa có dấu — "RAO BÁN" hiện "RAO BeN")
    const huongDan = [
      "Bày bán: mở <color=yellow>Hành trang<color>, bấm <color=yellow>Định giá<color> rồi bấm món muốn bán, nhập giá niêm yết. Món sẽ lên sạp.",
      "Bấm <color=yellow>Lời rao<color> để viết chữ trên bảng hiệu (1 – 16 chữ).",
      `Đứng trong thôn hoặc thành (khu vực an toàn), bấm ô <color=yellow>Rao bán<color>: nhân vật ngồi xuống bày bán. Từ cấp <color=yellow>${cap}<color> mới được bày bán.`,
      "Đi luyện công hay thoát game, sạp vẫn mở — một người bán hàng đứng trông sạp thay. Bán được thì tiền vào thẳng hành trang, có dòng báo.",
      `Thuế <color=yellow>${thue}%<color> chia 2 bên: người mua trả giá niêm yết cộng <color=yellow>${tMua}%<color>${tBan ? `, người bán nhận giá niêm yết trừ <color=yellow>${tBan}%<color>` : ""}. Xem hàng: bấm vào người đang bày bán, hoặc mở bảng Chợ Trời bằng nút hộp vàng ở thanh dưới (điện thoại: bảng Giang hồ).`,
      "Trên sạp của mình: bấm món để định giá lại, chuột phải để không bán nữa (món về hành trang).",
    ];
    return { text: `Hàng của các sạp trong thôn, trong thành ta đều ghi vào sổ — cần món gì cứ xem, mua ngay tại đây cũng được. Quan phủ thu thuế <color=yellow>${thue}%<color> trên mỗi món bán được.`,
      opts: [["Xem Chợ Trời", () => GW.cho.moBang()], ["Cách bày bán", () => NPCD.talk(huongDan.map((t) => richText(t, hero.name)), 0, null)], ["Không có gì", null]] };
  }
  if (id === "tienTrang") {
    const gia = (L.tienTrang || {}).luongMotXu || 5000000, max = Math.floor((hero.gold || 0) / gia), doi = (n) => () => doItem({ act: "doiXu", n });
    const opts = [...[1, 10, 100].filter((n) => n < max).map((n) => [`Đổi ${n} Xu (${fmtMoney(n * gia)})`, doi(n)]), ...(max > 0 ? [[`Đổi hết: ${max} Xu (${fmtMoney(max * gia)})`, doi(max)],
      ["Chọn số Xu muốn đổi", () => GW.chonSo({ tieuDe: "Đổi Xu", ten: `Có thể đổi tối đa ${max} Xu`, toiDa: max, san: 1, thongTin: (n) => `Cần ${fmtMoney(n * gia)}` }).then((n) => n && doItem({ act: "doiXu", n }))]] : []), ["Nhân tiện ghé qua thôi", null]];
    return { text: `Bổn trang đổi <color=yellow>${fmtMoney(gia)}<color> lấy 1 Xu (tiền của Kỳ Trân Các).<enter>Trên người ngươi có ${fmtMoney(hero.gold || 0)}, ${hero.xu | 0} Xu.${max > 0 ? "" : "<enter>Ngân lượng mang theo chưa đủ đổi 1 Xu."}`, opts };
  }
  return null;
}
// lên xe tới bãi z (at = chỗ đứng: "Trở lại địa điểm cũ"; chung = bản quái chung). Đội viên mà đội trưởng đang ở bãi z: vào cùng bản với đội
// trưởng (anh 03/11 — bản khác thì không thấy nhau, không theo sau / chia kinh nghiệm được). khongDi: gọi khi không đi được (Đưa ta đến Dã Tẩu đã trừ
// Thổ Địa Phù -> xin hoàn — diDaTau)
function xeToi(z, at, chung, khongDi) {
  if (z.bang) { if (khongDi) khongDi(); return khuVao(); } // khu vực bang: vào qua máy chủ (đợt 4) — vd Trợ Thủ về "nhà" ở khu
  if (!moBai(z)) { if (khongDi) khongDi(); return P.hud.msg(chuaMo(z)); }
  if (zoneLoad) { if (khongDi) khongDi(); return; }
  const tr = banTruong(z), c = tr != null ? tr : !!chung && laQc(z);
  P.hud.msg(`Ngồi yên chưa? Chúng ta đi ${z.n}`); // câu client (SelStation)
  if (tr != null && laQc(z)) P.hud.msg(`Đội trưởng ${doiTt.truong} đang ở ${z.n} bản ${tr ? "quái chung" : "quái riêng"} — vào cùng bản`);
  if (at) delete hero.diemCu;
  hero.farmZone = z.id; hero.farmChung = c ? 1 : 0;
  gotoZone(z, { ...(at ? { at } : {}), ...(c ? { chung: true } : {}) }).catch((e) => { if (khongDi) khongDi(); fail(e); });
}
// mục bãi z ở Xa phu: bãi có bản quái chung -> hỏi bản (BanBai), trừ khi đội trưởng đang ở bãi đó (vào cùng bản — xeToi)
const xeChon = (z) => (laQc(z) && banTruong(z) == null ? "BanBai:" + z.id : () => xeToi(z));
// mình là đội viên, đội trưởng đang ở bãi z -> bản của đội trưởng (true: quái chung); không thì null
function banTruong(z) {
  if (!doiTt || doiTt.truong === hero.name) return null;
  const L = doiTt.tv.find((x) => x.ten === doiTt.truong);
  return L && L.on && L.zone === z.id ? !!L.c && laQc(z) : null;
}
// lên xe tới thôn / thành z ("Những thành thị đã đi qua"): đứng ở điểm hồi sinh của client như vào thành (loadZone); không đổi bãi luyện công
function xeThanh(z) {
  if (zoneLoad) return;
  P.hud.msg(`Ngồi yên chưa? Chúng ta đi ${z.n}`);
  gotoZone(z).catch(fail);
}
// Trợ Thủ đi Xa phu: ở thành thì chạy tới Xa phu gần nhất rồi lên xe (quá 30 giây chưa tới — kẹt — thì lên xe luôn; Biện Kinh có 4 Xa phu ở
// 2 trạm xe); còn ở bãi (đang dùng Thổ Địa Phù) thì chờ. Về đúng bãi đã dùng phù: "Trở lại địa điểm cũ"
let diXe = null; // { z: mã bãi, t0, c: bản quái chung, thanh: z là thôn / thành (Những thành thị đã đi qua), sat: tới bản đồ nhiệm vụ sát thủ — anh 03/11 }
const xaPhuNpc = (w) => { const p = w.player; return w.npcs.filter((n) => (n.script && /车夫/.test(n.script)) || n.bhVai === "xaPhu").sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || null; };
function xeTick() {
  const w = world, p = w.player, d = diXe;
  if (!TOWN_KINDS.has(w.zone.kind) || zoneLoad || p.hp <= 0) return;
  if (!d.t0) d.t0 = performance.now();
  const n = xaPhuNpc(w);
  w.resting = false; if (p.sit) w.sit(false);
  // tự đánh chỉ chạy (như giữ chuột — World.holdMove): không lao vào đánh mộc nhân ở Ba Lăng trên đường tới Xa phu
  w.holdMove = true; p.target = null;
  if (n && ldist(p.x, p.y, n.x, n.y) > 80 && performance.now() - d.t0 < 30000) { if (!p.goal) w.walkTo(n.x, n.y); return; }
  diXe = null; w.holdMove = false;
  // tự làm nhiệm vụ ngày (tulam.js) / Boss Hoàng Kim (bossTick): sang thôn / thành khác, tới bản đồ nhiệm vụ sát thủ (bản quái chung)
  if (d.sat) { const v = satNv(); if (v && moBai(v.z)) xeSat(v); else P.hud.msg("Trợ Thủ: chưa có nhiệm vụ sát thủ hoặc chưa vào được bãi của boss"); return; }
  const z = P.maps.zones.find((x) => x.id === d.z), c = hero.diemCu;
  if (z && d.thanh) return w.zone.bang && TOWN_KINDS.has(z.kind) ? khuXaPhu(z.id, true) : xeThanh(z); // khu vực bang: sang thành qua Xa phu khu (lộ phí — đợt 4); bãi luyện công / boss ở bãi: miễn phí
  if (z) xeToi(z, c && c.z === z.id ? [c.x, c.y] : null, d.c);
}
function treoTick() {
  const A = hero.auto, T = A.treo, w = world, p = w.player;
  if (diXe && w.auto) return xeTick();
  if (!w.auto || p.hp <= 0) return;
  if (treoNghi.phu && phuTrongTui()) treoNghi.phu = false;
  if (FARM_KINDS.has(w.zone.kind) && !thanh) {
    if (T.boss && w.bossGan(false)) return; // anh 31/10: đang đánh boss thế giới (đứng gần nó) — không tự về thành, vẫn tự uống thuốc
    if (A.veThanh.on && p.hp * 100 < p.hpMax * A.veThanh.pct) return veThanh("sinh lực thấp");
    // kieu (thẻ Nhặt đồ — anh 08/11): Nhặt rác / Train lọc đồ luôn về khi đầy túi; Train lọc đồ "cắm map là chính" — chỉ về khi đầy túi, hết thuốc sinh lực, sinh lực thấp
    const conCho = conChoMon(T), kieu = A.nhat.kieu, camMap = kieu === "train", pots = hpPotions(), mpots = mpPotions();
    if (treoNghi.tui && conCho) treoNghi.tui = false;
    if (treoNghi.thuoc && pots > T.thuoc) treoNghi.thuoc = false;
    if (treoNghi.nl && mpots > T.nl) treoNghi.nl = false;
    if (treoNghi.sua && !doSap(T.sua.pct)) treoNghi.sua = false;
    // Kim Tê trong túi (anh 31/10 "có kim tê trong túi thì không cần tới thợ rèn sửa"): sửa tại chỗ, không về thành (mỗi 10 giây thử 1 lần)
    if (T.sua.on && doSap(T.sua.pct)) { const kt = kimTeTui(); if (kt) { if (performance.now() - kimTeLuc > 10000) { kimTeLuc = performance.now(); dungVat(kt); } return; } }
    if (!camMap && T.sua.on && !treoNghi.sua && doSap(T.sua.pct)) return veThanh("trang bị sắp hỏng");
    if ((T.tuiOn || kieu !== "tu") && !treoNghi.tui && !conCho) return veThanh("hành trang sắp đầy");
    if (T.thuocOn && !treoNghi.thuoc && pots <= T.thuoc && T.mua.some((m) => m.on)) return veThanh("sắp hết thuốc");
    if (!camMap && T.nlOn && !treoNghi.nl && mpots <= T.nl && T.mua.some((m) => m.on)) return veThanh("sắp hết thuốc nội lực");
    return;
  }
  if (!thanh || !TOWN_KINDS.has(w.zone.kind)) return;
  // suốt lúc làm việc ở thành (chạy tới NPC, chờ máy chủ bán / mua, cất đồ, dưỡng sức) tự đánh chỉ chạy, không nhắm quái (World.holdMove) —
  // anh 31/10 khuya "về thành nó chạy thẳng ra mộc nhân Ba Lăng huyện": bản trước tới NPC là thả ra nên lúc chờ máy chủ / ngồi nghỉ nó lao vào
  // đánh mộc nhân, thiếu máu thì đánh mãi không ngồi nghỉ được, không bao giờ quay lại bãi. Xong việc: onRested (đi Xa phu: xeTick giữ tiếp)
  w.holdMove = true;
  if (p.target) { p.target = null; p.path = null; }
  // anh 08/11 ("nhiều khi phù về thành xong là nó không tiếp tục nữa"): bước dưỡng sức mà cờ nghỉ bị tắt -> bật lại (không thì onRested không chạy, Trợ Thủ đứng
  // mãi); việc ở thành quá 3 phút (kẹt ở bước nào đó) -> bỏ dở, đi tiếp như xong việc
  if (thanh.buoc === "nghi" && !w.resting) w.resting = true;
  if (performance.now() - thanh.t0 > 180000) { thanh = null; w.holdMove = false; w.resting = false; if (!(bossSauThanh() || TuLam.sauThanh())) veBai(w, true); return; }
  // chạy tới NPC / Rương chứa đồ; quá 30 giây chưa tới thì vẫn làm việc ở đó -> còn đang đi: true
  const chayToi = (n, t0) => {
    w.resting = false; if (p.sit) w.sit(false);
    if (n && ldist(p.x, p.y, n.x, n.y) > 80 && performance.now() - t0 < 30000) { if (!p.goal) w.walkTo(n.x, n.y); return true; }
    return false;
  };
  if (thanh.buoc === "di") {
    if (chayToi(shopNpc(w), thanh.t0)) return;
    thanh.buoc = "mua";
    thanh.truoc = { tui: freeCells(), thuoc: hpPotions(), nl: mpPotions() };
    const giu = A.nhat.kieu === "rac" ? giuRac(A.nhat) : null; // Nhặt rác (anh 08/11): máy chủ bán mọi trang bị trừ các món này
    doItem({ act: "thanh", ban: T.ban || !!giu, ...(giu ? { giu } : {}), sua: T.sua.thanh, mua: [...T.mua.filter((m) => m.on).map((m) => [m.k, m.n]), ...(T.phu && T.phu.on ? [["townportal:1", T.phu.n]] : [])], ...(T.cat.on ? { cat: T.cat.giu } : {}) }).then(() => {
      for (const m of T.mua) if (m.on && potCount(m.k)) quickAdd(m.k); // thuốc vừa mua vào ô phím tắt
      if (!thanh) return;
      // anh 31/10: bán xong còn món mức Tự bán giữ lại (đủ dòng) -> chạy tới Rương chứa đồ cất vào (act catDo); thành không có rương thì thôi
      if (giu ? giu.length && ruongNpc(world) : T.catDo && T.ban && hero.locDo > 0 && (hero.bag || []).some(giuLai) && ruongNpc(world)) { thanh.buoc = "ruong"; thanh.t1 = performance.now(); thanh.giu = giu; return; }
      nghiThanh(T);
    });
  } else if (thanh.buoc === "ruong") {
    if (chayToi(ruongNpc(w), thanh.t1)) return;
    thanh.buoc = "cat";
    doItem({ act: "catDo", ...(thanh.giu ? { ds: thanh.giu } : {}) }).then(() => { if (thanh) nghiThanh(T); });
  }
}
// dưỡng sức xong ở thành (World.onRested), tự làm nhiệm vụ ngày xong việc (tulam.js), boss chết (bossTick): đang tự đánh thì đi Xa phu về bãi treo
// máy (không bật: bãi vừa đánh); đánh tay thì báo để tự đi. treo: Trợ Thủ đang làm việc ở thành — bãi chưa mở / không có phù thì tắt tự đánh, ở lại
function veBai(w = world, treo = true, dau = "Đã hồi phục") {
  // Trợ Thủ xong việc mà ở lại thành (bãi chưa mở / không có phù): tắt tự đánh — để bật thì nó lao vào đánh mộc nhân ở thành
  const oLai = () => { w.holdMove = false; if (treo && world === w && w.auto) toggleAuto(); };
  const T = hero.auto.treo, theoT = T.on && T.bai != null, back = P.maps.zones.find((z) => z.id === (theoT ? T.bai : hero.farmZone));
  const bc = !!back && laQc(back) && (theoT ? !!T.chung : !!hero.farmChung), tenB = back ? back.n + (bc ? " (quái chung)" : "") : ""; // bc: về bản quái chung
  if (back && !moBai(back)) { P.hud.msg(`${dau} — ${chuaMo(back)}`); oLai(); }
  // anh 31/10 khuya ("lên map mà không mang theo thổ địa phù"): bật mua Thổ Địa Phù mà trong túi vẫn không có (túi đầy / thiếu tiền) thì ở
  // lại thành — ra bãi rồi không tự về thành được
  else if (back && world.auto && T.phu && T.phu.on && !phuTrongTui()) { P.hud.canh(`Trợ Thủ: không mua được Thổ Địa Phù (túi đầy hoặc thiếu tiền) — ở lại ${world.zone.n}, chưa ra ${tenB}`); oLai(); }
  else if (back && world.auto) { P.hud.msg(`${dau} — đi Xa phu về ${tenB}`); diXe = { z: back.id, t0: 0, c: bc }; }
  else { P.hud.msg(`${dau}${back ? ` — nói chuyện với Xa phu để về ${tenB}` : ""}`); oLai(); }
}
// bãi đánh quái của tự làm nhiệm vụ (tulam.js — Dã Tẩu kinh nghiệm / Sơn Hà Xã Tắc): bãi treo máy, không bật thì bãi vừa đánh, chưa có thì bãi vào được
// cao nhất -> { z, c } | null
function baiTreo() {
  const T = hero.auto.treo, z = P.maps.zones.find((x) => x.id === (T.on && T.bai != null ? T.bai : hero.farmZone));
  if (z && moBai(z)) return { z: z.id, c: laQc(z) && (T.on && T.bai != null ? !!T.chung : !!hero.farmChung) };
  const ds = P.maps.zones.filter((x) => FARM_KINDS.has(x.kind) && !x.chiThuyen && moBai(x)).sort((a, b) => b.lo - a.lo);
  return ds.length ? { z: ds[0].id, c: false } : null;
}
// việc ở thành xong: ra thành mà không đỡ được -> thôi về vì lý do đó; ngồi dưỡng sức (đầy sinh lực sẵn thì onRested chạy ngay)
function nghiThanh(T) {
  const t = thanh.truoc || {};
  if (!conChoMon(T) && freeCells() <= t.tui) treoNghi.tui = true;
  if (hpPotions() <= T.thuoc && hpPotions() <= t.thuoc) treoNghi.thuoc = true;
  if (mpPotions() <= T.nl && mpPotions() <= t.nl) treoNghi.nl = true;
  if (T.sua.on && doSap(T.sua.pct)) treoNghi.sua = true; // không đủ tiền sửa
  thanh.buoc = "nghi"; world.resting = true;
}
// món mức Tự bán giữ lại (như may-chu/do.js giuTuBan): không xếp chồng (không có n), không phải món Kỳ Trân Các / có hạn / món Dã Tẩu của sạp Hệ
// thống, đủ hero.locDo dòng
const giuLai = (b) => b.n == null && !b.het && !b.dt && !(ItemDB.item(b.k) || {}).ktc && (b.d || []).length >= (hero.locDo | 0);
// Nhặt rác (Trợ Thủ thẻ Nhặt đồ — anh 08/11): mã các món trong túi giữ lại — đúng dòng đã tích ở Lọc dòng; chưa tích dòng nào thì đồ xanh đủ số dòng tối thiểu
const giuRac = (N) => { const L = N.loc, co = L && L.on && Object.values(L.ds || {}).some((v) => v.on); return (hero.bag || []).filter((b) => { const d = b.d || []; return b.n == null && (co ? d.length > 0 && hopLoc(L, d) : d.length >= N.dong); }).map((b) => b.u); };
// Rương chứa đồ của thành (vật bản đồ — assets/data/vat-ban-do.json, viec "ruong")
const ruongNpc = (w) => w.npcs.find((n) => n.viec === "ruong") || null;
// NPC có cửa hàng (script NPC có Sale(n) mà game có hàng của cửa hàng n) trong danh sách NPC; thành / thôn có NPC đó. Thành Trợ Thủ về: treo.thanh (anh
// 03/11 "chỗ về thành cho chọn nơi lưu rương (ba lăng - biện kinh)"), không có thì Ba Lăng (START_ZONE) như trước
const banThuoc = (n) => { const s = n.script && P.npcDlg.scripts && P.npcDlg.scripts[n.script]; return !!s && Object.values(s.nodes || {}).some((nd) => (nd.acts || []).some((a) => a[0] === "Sale" && (ItemDB.shops[a[1]] || []).length)); };
// NPC bán thuốc (Dược điếm — Ba Lăng Ngô thần y, Biện Kinh Chủ dược điếm): Trợ Thủ chạy tới đó làm việc ở thành; không có thì NPC cửa hàng đầu tiên
const banThuocThat = (n) => { const s = n.script && P.npcDlg.scripts && P.npcDlg.scripts[n.script]; return !!s && Object.values(s.nodes || {}).some((nd) => (nd.acts || []).some((a) => a[0] === "Sale" && (ItemDB.shops[a[1]] || []).some((k) => (ItemDB.item(k) || {}).thuoc))); };
const shopNpc = (w) => w.npcs.find(banThuocThat) || w.npcs.find(banThuoc) || null;
let shopTownDs;
function shopTown() {
  const ds = (shopTownDs = shopTownDs || P.maps.zones.filter((z) => TOWN_KINDS.has(z.kind) && zoneNpcs(z).some(banThuoc))), muon = hero && hero.auto && hero.auto.treo ? hero.auto.treo.thanh : 0;
  return ds.find((z) => z.id === muon) || ds.find((z) => z.id === START_ZONE) || ds[0] || townZone() || null;
}
// Trợ Thủ → Tiện ích → Nhiệm vụ ngày: mở khóa tự làm Dã Tẩu ("dt") / tự săn Boss Sát thủ ("st") hôm nay — hỏi lại ở khung của game rồi máy chủ trừ Xu
// (may-chu/tu-lam.js)
function moKhoaTuLam(loai) {
  if (!hero) return;
  const t = (hero.tl && hero.tl.gia) || { dt: 10, st: 5 }, gia = loai === "st" ? t.st : t.dt, ten = loai === "st" ? "tự săn Boss Sát thủ" : "tự làm Dã Tẩu";
  if ((hero.xu | 0) < gia) return P.hud.canh(`Cần ${gia} Xu để mở khóa ${ten} hôm nay (trên người có ${hero.xu | 0} Xu)`);
  GW.hoi(`Mở khóa <color=yellow>${ten}<color> cả hôm nay: trừ <color=yellow>${gia} Xu<color>?<enter>Mở rồi dùng cả ngày (tới 0 giờ), tắt bật giữa chừng không mất.`).then((ok) => {
    if (!ok) return;
    Net.tuLam(hero.slot | 0, { viec: "mo", loai }).then((j) => { applyServer(j); if (j.msg) P.hud.msg(j.msg); P.audio.ui("click"); if (TT) TT.render(); })
      .catch((e) => { if (e.ma !== "het-phien") P.hud.canh(e.message); });
  });
}
// ---------- Boss Hoàng Kim (Trợ Thủ thẻ Đánh quái → Boss Hoàng Kim — anh 03/11 "đánh quái chia ra thêm 1 tab dùng để đánh boss hoàng kim, đang đánh
// hết máu xong nó về mua rồi lên lại bãi, rất là bất tiện") ----------
// bossTheo: mã boss (BossTG.b.u) đang đánh lúc tự đánh (đứng gần boss còn sống) — trọng thương / về thành, dưỡng sức xong: boss.quay -> đi lại tới boss
// thay vì về bãi treo máy (bossSauThanh). boss.tuDi: boss mới xuất hiện, đang tự đánh ở bãi luyện công, đủ cấp -> Thổ Địa Phù về thành (việc ở thành như
// thường) rồi đi tới boss. bossDi: đang đi tới boss { u, den (lúc tới bãi của boss), xe (đã gọi Xa phu sang thành của boss) }; bossVe: Trợ Thủ đã đưa đi
// đánh boss -> boss chết / hết giờ (boss.veBai): việc ở thành rồi về bãi treo máy (onRested -> veBai)
let bossTheo = 0, bossDi = null, bossVe = 0, bossDaDi = 0;
const bossSong = () => { const b = BossTG.b; return b && !b.ket ? b : null; };
function bossSauThanh() {
  const b = bossSong(), B = hero.auto.boss;
  if (!b || !(bossDi || (B.quay && bossTheo === b.u) || ((B.tuDi || (b.sk && B.sk !== 0)) && bossDaDi === b.u))) return false; // b.sk: siêu boss sự kiện (anh 18/11)
  bossDi = { u: b.u }; bossVe = b.u;
  P.hud.msg(`Trợ Thủ: đi tới boss thế giới ${b.ten} (${b.tenBai}${b.noi ? " " + b.noi : ""})`);
  return true;
}
function bossTick() {
  const w = world; if (!w || !hero || !hero.auto) return;
  const B = hero.auto.boss, b = bossSong(), p = w.player;
  if (!w.auto) { bossDi = null; return; }
  if (b && w.bossGan(false)) bossTheo = b.u;
  if (!b) { // boss chết / hết giờ: Trợ Thủ đã đưa đi -> việc ở thành rồi về bãi treo máy
    bossTheo = 0; bossDi = null;
    if (bossVe && B.veBai && TOWN_KINDS.has(w.zone.kind) && !thanh && !diXe && !zoneLoad) { bossVe = 0; P.hud.msg("Trợ Thủ: boss thế giới đã hết — bán / mua rồi về bãi treo máy"); thanh = { buoc: "di", t0: performance.now(), why: "boss thế giới đã hết" }; }
    else if (bossVe && !TOWN_KINDS.has(w.zone.kind)) bossVe = 0;
    return;
  }
  // siêu boss sự kiện (anh 18/11 — boss.sk mặc định bật, mọi cấp): đang ở thành thì đi thẳng tới boss (bãi luyện công: như tuDi bên dưới)
  // đang bán / mua ở thành (thanh): chỉ ghi nhận — xong việc onRested -> bossSauThanh đưa đi tới boss
  if (b.sk && B.sk !== 0 && bossDaDi !== b.u && TOWN_KINDS.has(w.zone.kind) && !diXe && !zoneLoad && p.hp > 0) {
    bossDaDi = b.u; bossVe = b.u;
    if (thanh) { P.hud.msg(`Trợ Thủ: siêu boss ${b.ten} xuất hiện — xong việc ở thành sẽ đi tới boss`); return; }
    bossDi = { u: b.u }; P.hud.msg(`Trợ Thủ: siêu boss ${b.ten} xuất hiện — đi tới boss (${b.tenBai}${b.noi ? " " + b.noi : ""})`);
    return;
  }
  // boss mới xuất hiện (mỗi boss 1 lần): tự đi từ bãi luyện công
  if (((B.tuDi && (hero.lvl || 1) >= B.cap) || (b.sk && B.sk !== 0)) && bossDaDi !== b.u && FARM_KINDS.has(w.zone.kind) && !w.zone.chiThuyen && !thanh && !diXe && !zoneLoad && !camPhu()) {
    bossDaDi = b.u;
    if (veThanh(`boss thế giới ${b.ten} xuất hiện`)) bossVe = b.u;
    return;
  }
  if (!bossDi || thanh || diXe || zoneLoad || p.hp <= 0) return;
  if (bossDi.u !== b.u) { bossDi = null; return; }
  // tới gần: tự đánh nhắm boss (World.nearestMob — cả khi tạm dừng ở thành). Hoạt động (anh 04/11 lượt 25): tự đánh chỉ trong phạm vi quanh mình
  // (World.hdR) -> đi tới cách boss 3/4 phạm vi mới thôi; boss đã thấy (BTG_GAN) thì đi thẳng tới nó (boss đuổi người khác ra xa chỗ xuất hiện)
  const bm = w.bossGan(false);
  if (bm && ldist(p.x, p.y, bm.x, bm.y) <= w.hdR() * 0.75) { bossDi = null; p.goal = null; p.path = null; return; }
  if (w.zone.id !== b.bai) {
    if (TOWN_KINDS.has(w.zone.kind) && !bossDi.xe) { bossDi.xe = 1; diXe = { z: b.bai, t0: 0, thanh: 1 }; }
    else if (FARM_KINDS.has(w.zone.kind)) veThanh(`đi tới boss thế giới ${b.ten}`);
    return;
  }
  if (!bossDi.den) bossDi.den = performance.now();
  if (performance.now() - bossDi.den > 180000) { P.hud.canh(`Trợ Thủ: 3 phút chưa tới được chỗ boss ${b.ten} — thôi tự đi tới boss`); bossDi = null; return; }
  if (!p.goal && !p.target) w.walkTo(bm ? bm.x : b.x, bm ? bm.y : b.y);
}
// nút "Bắt đầu treo máy": bật tự đánh, tới bãi treo máy
function treoStart() {
  if (world && laDn(world.zone)) return P.hud.canh("Đường đua: Trợ Thủ không hoạt động — tự chạy bằng chuột / bản đồ nhỏ"); // đua ngựa (anh 16/11)
  if (world && laLd(world.zone)) return P.hud.canh("Lôi đài: Trợ Thủ không hoạt động trong sân — đánh tay"); // anh 15/11 D9: không bật tự đánh, không dùng phù / đi Xa phu từ sân
  const T = hero.auto.treo, z = P.maps.zones.find((x) => x.id === T.bai), tc = !!z && laQc(z) && !!T.chung; // tc: treo ở bản quái chung (anh 03/11)
  if (z && !moBai(z)) return P.hud.msg("Trợ Thủ: " + chuaMo(z));
  if (!world.auto) toggleAuto(true);
  if (!z || (z.id === world.zone.id && tc === !!world.chung)) return P.hud.msg("Trợ Thủ: treo máy ở " + world.zone.n + (world.chung ? " (quái chung)" : ""));
  const ten = z.n + (tc ? " (quái chung)" : "");
  hero.farmZone = z.id; hero.farmChung = tc ? 1 : 0;
  // đi bằng Xa phu (anh 26/10): ở thành thì tới Xa phu; ở bãi khác (cả bản kia của bãi đang đứng) thì Thổ Địa Phù về thành trước
  // ở thành (anh 31/10 khuya "lên map mà không mang theo thổ địa phù, không tự chạy bán đồ"): làm việc ở thành trước như lúc tự về — bán đồ,
  // sửa, mua thuốc + Thổ Địa Phù, cất tiền / đồ — dưỡng sức xong mới đi Xa phu (onRested)
  if (TOWN_KINDS.has(world.zone.kind)) { thanh = { buoc: "di", t0: performance.now(), why: "chuẩn bị treo máy" }; return P.hud.msg(`Trợ Thủ: bán / mua ở ${world.zone.n} rồi đi Xa phu tới ${ten}`); }
  const b = phuTrongTui();
  if (!b) return P.hud.msg("Trợ Thủ: hết Thổ Địa Phù — không về thành đổi bãi được (Tạp hóa Ba Lăng bán)");
  thanh = { buoc: "di", t0: performance.now(), why: "đổi bãi treo máy" }; // về thành cũng bán / mua lại phù như trên rồi mới đi Xa phu
  dungPhu(b).then((ok) => { if (!ok) thanh = null; else P.hud.msg(`Trợ Thủ: về thành bán / mua rồi đi Xa phu tới ${ten}`); });
}

// công cụ thử đổi cấp / kinh nghiệm / tiền / túi / đồ mặc ở máy -> ghi lên máy chủ (chỉ tài khoản quản trị nhận; tài khoản khác thì
// máy chủ trả lại số cũ ở lần nhịp sau)
function devSave() {
  save();
  if (!hero || !Net.me || !Net.me.admin) return;
  Net.devSync(hero.slot | 0, { lvl: hero.lvl, exp: hero.exp, gold: hero.gold, bag: hero.bag, equip: hero.equip }).then(applyServer)
    .catch((e) => { if (e.ma !== "het-phien") P.hud.msg("Công cụ thử: " + e.message); });
}
// lưu định kỳ (kinh nghiệm giữa 2 lần lên cấp); ẩn / đóng trang thì gửi ngay, đóng trang thì báo rời game
setInterval(() => { if (world && hero) save(); }, 30000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) return; if (world && hero) save(); Net.flush(); });
addEventListener("pagehide", () => { if (world && hero) { save(); Net.leave(hero.slot | 0, true, takePending()); } Net.flush(true); });
// Lên / xuống ngựa (nút bật / tắt của client): chỉ khi đang mặc ngựa. Cách lần đổi trước ít nhất 3 giây (World.doiNgua — anh 28/10): chưa đủ
// thì báo câu client MSG_CANT_SWITCH_HORSE, chữ đỏ ở ô tin dưới khung chat như client
function toggleHorse(on) {
  if (!(hero.looks && hero.looks.horse)) { P.hud.setToggle("Horse", false); return P.hud.msg("Chưa có ngựa — mặc ngựa ở trang Trang bị"); }
  // như client: đang ngồi thì không lên ngựa được (stringtable_core MSG_CANT_SWITCH_HORSE_WHEN_SIT)
  if (on && world.player.sit) { P.hud.setToggle("Horse", false); return P.hud.canh("Bạn ngồi xuống rồi, không thể lên ngựa."); }
  // đường đua (anh 16/11 — thiết kế: tốc cố định, không lên / xuống ngựa): giữ nguyên như lúc vào
  if (laDn(world.zone)) { P.hud.setToggle("Horse", world.riding()); return P.hud.canh("Đường đua: không lên / xuống ngựa được — mọi người cùng một tốc độ"); }
  if (!world.doiNgua(on)) { P.hud.setToggle("Horse", world.riding()); return P.hud.canh("Bạn quá mệt rồi không thể tiếp tục lên hoặc xuống ngựa."); }
  save();
  P.hud.msg(on ? "Lên ngựa" : "Xuống ngựa");
}
// Trợ Thủ đi lại trong thành (tới NPC bán / mua / sửa, tới Rương chứa đồ, tới Xa phu — anh 28/10: "auto sửa đồ ở thợ rèn xong nó xuống ngựa chạy bộ"): có ngựa mà
// đang đi bộ (vừa xuống ngựa ngồi dưỡng sức) thì tự lên ngựa khi bắt đầu chạy (đủ 3 giây từ lần lên / xuống trước — World.doiNgua)
function nguaThanh() {
  const w = world, p = w.player;
  if (!w.auto || !(diXe || bossDi || TuLam.toiT || (thanh && (thanh.buoc === "di" || thanh.buoc === "ruong"))) || !TOWN_KINDS.has(w.zone.kind) || p.hp <= 0 || p.sit || w.resting) return;
  if (!w.riding() && hero.looks && hero.looks.horse && p.path && p.path.length) w.doiNgua(true);
}
// Trợ Thủ ưu tiên "Tinh anh / Thủ lĩnh / Boss" (anh 12/11 "auto đánh quái, nếu chọn ưu tiên đánh boss, tinh anh thì lên ngựa trong lúc di chuyển đến vị trí đó"):
// đang chạy tới con đặc biệt (tinh anh, thủ lĩnh, boss thế giới) còn xa ≥ NGUA_BOSS_XA -> lên ngựa (đủ 3 giây từ lần đổi trước — World.doiNgua); tới nơi chiêu cấm
// cưỡi ngựa thì Trợ Thủ tự xuống như cũ (vocong.js atkPlan). Không ở thành / Tống Kim / Phong Hỏa
// Soát 12/11: chiêu chính cấm cưỡi ngựa — atkPlan chỉ xuống ngựa khi mục tiêu đã gần tầm chiêu (vocong.js); ở đây chỉ lên khi mục tiêu còn xa hơn tầm chiêu
// ≥ 400 và không lên lại trong NGUA_BOSS_LAI giây kể từ lần lên trước (tránh lên / xuống liên tục khi đuổi con chạy quanh mép tầm)
const NGUA_BOSS_XA = 450, NGUA_BOSS_LAI = 10000;
let nguaBossLuc = -1e9;
function nguaBoss() {
  const w = world, p = w.player, A = hero.auto && hero.auto.danh, m = p.target;
  if (!w.auto || !A || A.uuTien !== "dacbiet" || !m || !m.alive || !(m.boss || m.dacBiet || m.btg) || p.manual || p.hp <= 0 || p.sit || w.resting) return;
  if (w.tk || laPh(w.zone) || laTk(w.zone) || TOWN_KINDS.has(w.zone.kind) || w.riding() || !(hero.looks && hero.looks.horse) || !(p.path && p.path.length)) return;
  const t = performance.now(); if (t - nguaBossLuc < NGUA_BOSS_LAI) return;
  const id = (A.chieu | 0) || ((hero.oChieu || {}).trai | 0), tam = id && w.skRange ? +w.skRange(id, w.skLv(id)) || 0 : 0;
  if (ldist(p.x, p.y, m.x, m.y) >= Math.max(NGUA_BOSS_XA, tam + 400) && w.doiNgua(true)) { nguaBossLuc = t; P.hud.msg("Trợ Thủ: lên ngựa chạy tới " + (m.name || "mục tiêu")); }
}
// ---------- Trợ Thủ tự dùng (thẻ Thuốc — anh 28/10 lần 4 "tự dùng tiên thảo lộ, bách quả lộ, thiên sơn bảo lộ" + "tự mở lễ bao hồi thiên tái tạo đơn") ----------
// Đang tự đánh: trạng thái của món hết (hero.buff — máy chủ đếm) mà trong túi còn thì dùng 1 bình; hết Hồi Thiên Tái Tạo Đơn mà có Hồi thiên
// tái tạo lễ bao thì rút dung.leBao.n viên (máy chủ do.js dungVat leBao — mang tối đa 60 bình thuốc). Mỗi lần 1 món; máy chủ không cho (đã có
// hiệu quả, đủ 60 bình…) thì món đó 5 phút sau mới thử lại
const HTD = "potion:44", LE_BAO_HTD = "ms:2527";
const tuDungLuc = new Map();
let tuDungDang = false;
function tuDungTick() {
  const w = world, A = hero.auto.dung, t = performance.now();
  if (!w || !w.auto || tuDungDang || w.player.hp <= 0 || zoneLoad) return;
  const conBuff = (b) => ((hero.buff || {})[b] || 0) - (performance.now() - buffLuc) / 1000 > 0;
  const thu = (k, lam, duoc) => {
    if (t < (tuDungLuc.get(k) || 0)) return false;
    tuDungLuc.set(k, t + 30000); tuDungDang = true;
    lam().finally(() => { tuDungDang = false; if (!duoc()) tuDungLuc.set(k, performance.now() + 300000); });
    return true;
  };
  // món đã chọn ở Trợ Thủ thẻ Thuốc (A.ds — lộ, hoàn; anh 31/10 lần 3 thanh xổ xuống): hết hiệu quả thì dùng 1 món
  for (const r of A.ds || []) {
    const D = r.on && (ItemDB.item(r.k) || {}).dung; if (!D || D.loai !== "trangThai" || conBuff(D.buff)) continue;
    if (laVatTk(r.k) && !TongKim.laTo()) continue; // hoàn Tống Kim: chỉ dùng trong chiến trường (ngoài trận máy chủ không cho — khỏi chờ 5 phút)
    const it = (hero.bag || []).find((x) => x.k === r.k && x.n > 0);
    if (it && thu(r.k, () => dungVat(it), () => conBuff(D.buff))) return;
  }
  const lb = A.leBao.on && !potCount(HTD) && (hero.bag || []).find((x) => x.k === LE_BAO_HTD);
  if (lb) thu(LE_BAO_HTD, () => dungVat(lb, { n: A.leBao.n }).then(() => { if (potCount(HTD)) quickAdd(HTD); }), () => potCount(HTD) > 0);
}

// ---------- Tổ đội (anh 28/10 lần 4 — may-chu/to-doi.js; khung Lập nhóm: windows.js _team; Trợ Thủ thẻ Đánh quái: hero.auto.doi) ----------
// Máy chủ gửi kèm mỗi nhịp: { truong, tv: [{ ten, lvl, fac, zone, on }], moi: [{ id, tu, het }], bao: [câu] } | null. Được mời: Trợ Thủ "Tự vào đội"
// (không bật "Luôn làm đội trưởng") lúc đang tự đánh thì vào luôn, không thì như client (anh 06/11): dòng "<tên> mời bạn gia nhập nhóm của họ  Đồng ý
// Cự tuyệt  Xem nhẹ" ở ô tin hệ thống + biểu tượng tổ đội nhấp nháy ở góc phải dưới (đang ở đội ≥ 2 người: chỉ biểu tượng — cả lời mời của Trợ Thủ
// tự mời, anh 06/11 chiều) — hud.js moiDoi; bấm biểu tượng: các dòng lời mời hiện ngay bên trái biểu tượng, bấm chữ trả lời luôn (không khung hỏi).
// Điện thoại: câu mời ở dòng tin trên cảnh (chưa có đội), nút biểu tượng -> bảng dòng + 3 nút (dienthoai.js). Trợ Thủ "Tự mời" (đang tự đánh):
// mỗi 3 giây mời 1 người chơi cùng bãi trong DOI_GAN chưa có trong đội (mỗi người 60 giây 1 lần) — mình chưa có đội thì thành đội trưởng.
const DOI_GAN = 600;
let doiTt = null, doiLuc = 0;
const moiDaHoi = new Set(), moiLuc = new Map(), moiTuVao = new Set();
function doiApply(d) {
  doiTt = d && d.tv ? d : null;
  if (world) world.coDoi = !!(doiTt && doiTt.mo && doiTt.truong === hero.name); // cờ đội trưởng trên đầu mình (đội còn nhận người)
  if (world) world.doiTen = doiTt ? new Set(doiTt.tv.map((x) => x.ten).filter((n) => n !== hero.name)) : null; // vòng sáng của đồng đội (World.vongDoi)
  for (const t of (d && d.bao) || []) P.hud.msg(t); // câu client MSG_TEAM_* (may-chu/to-doi.js)
  const cho = [];
  for (const m of (d && d.moi) || []) {
    if (!hero) break;
    if (!moiDaHoi.has(m.id)) {
      moiDaHoi.add(m.id);
      const D = hero.auto.doi;
      // Trợ Thủ "Tự vào đội" chỉ lúc đang tự đánh (anh 31/10 lần 3: "người khác pt cái là vào luôn mà không có thông báo hay hộp thoại hay icon — làm
      // theo client, để người chơi bấm vào hoặc có hội thoại để họ chọn"); tự chơi: luôn hỏi
      if (D.tuVao && !D.truong && world && world.auto && !(world.pk && world.pk()) && (!doiTt || doiTt.tv.length < 2)) { moiTuVao.add(m.id); doiLam({ viec: "nhan", id: m.id }); continue; } // thẻ PK (trận Tống Kim): không tự vào đội (anh 06/11)
      if (document.body.classList.contains("dt") && !(doiTt && doiTt.tv.length > 1)) P.hud.msg(`${m.tu} mời bạn gia nhập nhóm của họ`); // điện thoại: không có ô tin hệ thống; đang ở đội: chỉ biểu tượng
    }
    if (!moiTuVao.has(m.id)) cho.push(m);
  }
  moiDoiCho = cho; veMoi();
  if (GW && GW.teamFill) GW.teamFill(doiTt);
}
// lời mời tổ đội (moiDoiCho) + lời mời vào bang (moiBhCho — anh 14/11, bhMoiApply) chung 1 biểu tượng / ô tin hệ thống (hud.js moiDoi): lời mời bang luôn có dòng
// ở ô tin hệ thống (m.bh), lời mời đội chỉ khi chưa ở đội ≥ 2 người như cũ
let moiDoiCho = [], moiBhCho = [];
function veMoi() { if (hero) P.hud.moiDoi([...moiDoiCho, ...moiBhCho], !!(doiTt && doiTt.tv.length > 1)); }
// trả lời lời mời (hud.js moiChon — chữ bấm trong dòng): v "nhan" Đồng ý | "tuChoi" Cự tuyệt (người mời nghe câu client); m null: chỉ tiếng bấm
// (bấm biểu tượng, Xem nhẹ — bỏ ở máy này, không gửi). Anh 06/11 chiều "làm đơn giản chứ đừng mở hẳn 1 pop up … nếu anh muốn đổi pt thì anh sẽ bấm
// vào và đồng ý, còn không thì thôi": bỏ khung hỏi Say (moiHoi cũ) — đang ở đội ≥ 2 người mà Đồng ý thì rời đội đang ở, vào đội mới luôn (máy chủ kiểm
// hết điều kiện đội mới trước, không đủ thì giữ đội cũ — to-doi.js nhan). Lời mời đã trả lời / hết hạn -> không gửi lại
function moiTraLoi(m, v) { P.audio.ui("click"); if (m && v) moiGui(m, v); }
function moiGui(m, v) {
  if (!P.hud.moiCon(m.id)) { if (v !== "an") P.hud.msg("Lời mời đã hết hạn"); return; }
  P.hud.boMoi(m.id);
  if (v === "an") return;
  // lời mời vào bang (anh 14/11): trả lời bằng viec nhanMoi — giữ mục trong moiBhCho tới khi nhịp báo hết (đã bỏ ở máy này — boMoi), không thì nhịp tới trước khi máy chủ xử lý
  // làm lời mời hiện lại
  if (m.bh) { bhLam({ viec: "nhanMoi", id: m.bhId, dong: v === "nhan" ? 1 : 0 }); return; }
  doiLam({ viec: v, id: m.id });
}
// im: Trợ Thủ tự mời — không báo lỗi (người đó đã có đội…)
function doiLam(b, im) {
  if (!hero) return Promise.resolve(null);
  // lôi đài (anh 15/11): trong sân không lập / mời / vào / mở tổ đội (máy chủ cũng chặn — to-doi.js); rời đội, từ chối lời mời vẫn được
  if (world && laLd(world.zone) && b && ["lap", "moi", "nhan", "mo"].includes(b.viec)) { if (!im) P.hud.canh("Trong lôi đài không được lập / vào tổ đội"); return Promise.resolve(null); }
  if (world && laDn(world.zone) && b && ["lap", "moi", "nhan", "mo"].includes(b.viec)) { if (!im) P.hud.canh("Trên đường đua không được lập / vào tổ đội"); return Promise.resolve(null); } // đua ngựa (anh 16/11 — client SetCreateTeam(0))
  return Net.doi(hero.slot | 0, b).then((j) => { doiApply(j.doi); if (j.msg && !im) P.hud.msg(j.msg); return j; })
    .catch((e) => { if (e.ma !== "het-phien" && !im) P.hud.msg(e.message); return null; });
}
// ---------- giao dịch (anh 30/10 "làm cơ chế giao dịch, tham khảo client" — may-chu/giao-dich.js, khung 玩家间交易.ini: windows.js _giaoDich) ----------
// g = { mo, xin: [{ id, tu }], p: phiên, bao: [câu] } | null (mỗi nhịp + mỗi lần bấm). mo -> nút Đóng mở giao dịch thanh dưới + cờ nguyên bảo trên
// đầu mình (World.gdCo: 1 mở / 2 đang giao dịch); lời xin của người khác: khung hỏi 2 nút, câu client G_SysMsgCentre_3; phiên -> khung giao dịch
// g.s (anh 14/11 — may-chu/giao-dich.js dau): dấu thứ tự của máy chủ. Trạng thái tới bằng 2 đường (trả lời nhịp / bấm, và tin đẩy "gd" qua kênh tức
// thời) có thể lệch thứ tự -> bản cũ hơn bản đã áp thì bỏ (câu báo vẫn hiện — mỗi câu máy chủ gửi đúng 1 lần); cũ hơn cả phút = máy chủ đặt lại đồng hồ: nhận
const gdDaHoi = new Set();
let gdS = 0;
function gdApply(g) {
  for (const t of (g && g.bao) || []) P.hud.msg(t);
  if (g && g.s) { if (g.s < gdS && gdS - g.s < 60000) return; gdS = g.s; }
  const mo = !!(g && g.mo);
  if (!!P.hud.toggles.Exchange !== mo) P.hud.setToggle("Exchange", mo);
  if (world) world.gdCo = g && g.p ? 2 : mo ? 1 : 0;
  for (const x of (g && g.xin) || []) {
    if (gdDaHoi.has(x.id) || !GW) continue;
    gdDaHoi.add(x.id);
    if (world && laLd(world.zone)) { gdLam({ viec: "tuChoi", id: x.id }); continue; } // lôi đài (anh 15/11): không giao dịch trong sân — lời xin tự từ chối, không hỏi
    GW.hoi(`<color=yellow>${x.tu}<color> hy vọng cùng với bạn giao dịch`, "Đồng ý", "Từ chối").then((ok) => gdLam({ viec: ok ? "nhan" : "tuChoi", id: x.id }));
  }
  if (GW) GW.giaoDichVe(g && g.p);
}
function gdLam(b) {
  if (!hero) return Promise.resolve(null);
  // lôi đài (anh 15/11): trong sân không mở giao dịch / xin / nhận (máy chủ cũng chặn — giao-dich.js); đóng giao dịch, từ chối vẫn được
  if (world && laLd(world.zone) && b && (b.viec === "xin" || b.viec === "nhan" || (b.viec === "mo" && b.on))) { P.hud.canh("Trong lôi đài không được giao dịch"); if (b.viec === "mo") P.hud.setToggle("Exchange", false); return Promise.resolve(null); }
  return Net.giaoDich(hero.slot | 0, b).then((j) => { if (j.tui || j.nv) applyServer(j); gdApply(j.gd); if (j.msg) P.hud.msg(j.msg); return j; })
    .catch((e) => { if (e.ma !== "het-phien" && !e.boQua) P.hud.msg(e.message); return null; });
}
// menu người chơi (client Mouse_Menu — Ctrl + chuột phải vào người chơi; điện thoại: chạm giữ người chơi): tên + cấp, Giao dịch (G_UIGAME_2), Tổ đội
// (G_UIGAME_4 — mời vào nhóm), Xem trang bị (anh 03/11 — xemTrangBi). Người kia phải đang mở giao dịch (máy chủ kiểm tra, báo câu nếu chưa)
function menuNguoi(o, cx, cy) {
  document.querySelector(".jx-menu")?.remove();
  const m = document.createElement("div");
  m.className = "jx-menu jx-nguoi";
  const sap = sapCuaTen(o.name); // đang bày bán ở bãi này: Xem sạp (chợ trời)
  // "Mời vào bang" (anh 14/11 — Bang hội đợt 1): chỉ khi mình có quyền chiêu mộ (bang chủ / trưởng lão / đội trưởng); bot Tống Kim cũng có dòng này (trả lời như cự tuyệt)
  const moiBang = !!(bhMinhCur && ["chu", "lao", "doi"].includes(bhMinhCur.cv));
  const ld = !!world && laLd(world.zone); // lôi đài (anh 15/11): không Giao dịch / Tổ đội / Mời vào bang trong sân
  const tt = false; // bản chia sẻ: không có tỉ thí
  m.innerHTML = `<div class="dau">${esc(o.name)}${o.lvl ? ` · cấp ${o.lvl}` : ""}</div>${sap ? `<div data-v="sap">Xem sạp</div>` : ""}${ld ? "" : `<div data-v="gd">Giao dịch${o.gd === 1 ? "" : o.gd === 2 ? " <small>(đang giao dịch)</small>" : " <small>(chưa mở giao dịch)</small>"}</div><div data-v="doi">Tổ đội</div>`}${tt ? `<div data-v="tt">Tỉ thí</div>` : ""}${moiBang && !ld ? `<div data-v="bang">Mời vào bang${o.bh ? " <small>(đã có bang)</small>" : ""}</div>` : ""}${o.tkb ? "" : `<div data-v="mat">Nhắn tin mật</div>`}<div data-v="xem">Xem thông tin</div>`;
  m.onclick = (e) => {
    const d = e.target.closest("[data-v]"); if (!d) return;
    m.remove(); P.audio.ui("click");
    if (o.tkb) return menuBot(o, d.dataset.v); // bot Tống Kim (anh 06/11): xem như người chơi khác
    if (d.dataset.v === "sap") GW.cho.xemSap(sap.k);
    else if (d.dataset.v === "xem") xemTrangBi(o.name);
    else if (d.dataset.v === "mat") P.hud.datMat(o.name); // nhắn tin mật (anh 13/11)
    else if (d.dataset.v === "bang") bhLam({ viec: "moi", ten: o.name });
    else if (d.dataset.v === "tt") ttChon(o, cx, cy);
    else if (d.dataset.v === "gd") gdLam({ viec: "xin", ten: o.name }); else doiLam({ viec: "moi", ten: o.name });
  };
  popup(m, { left: cx, top: cy, bottom: cy }, "down");
}
// ---------- Tỉ thí (anh 17/11 — may-chu/ti-thi.js + loi-dai.js moTiThi; anh chọn mẫu C) ----------
// Menu người chơi → Tỉ thí -> bảng chọn câu khịa #ttChon (cạnh chỗ bấm; điện thoại: giữa màn): "Ngẫu nhiên 1 câu" + câu của luat().tiThi.cau; bấm 1 câu là gửi chiến thư
// (POST /api/ti-thi gui — máy chủ lấy chữ theo số thứ tự). Người nhận: thẻ CHIẾN THƯ #ttC giữa phía trên (tên · cấp · phái, câu khịa, luật, thanh đếm ngược, Nhận chiến /
// Từ chối) — kênh tức thời "tt" { moi } ngay, nhịp ttMoi dự phòng (rỗng / "tt" { het } -> ẩn). Nhận -> máy chủ mở sân lôi đài 1 vs 1 và đưa vào ngay (ldVaoTran). Người
// thách: "tt" { vao: mã trận } / nhịp ttVao -> POST /api/ti-thi vao (mỗi trận 1 lần). Trong sân là luật lôi đài (loidai.js — thanh tỉ số có dòng sát thương 2 bên)
let ttThe = null, ttVaoDa = 0;
const ttVaoLan = new Map(); // mã trận -> số lần đã thử vào (tối đa 3 — lỗi không lặp mỗi nhịp)
const ttDaTra = new Set(); // mã chiến thư đã bấm trả lời ở máy này (nhịp tới trước khi máy chủ xử không hiện lại)
const ttPhai = (k) => (k == null ? "" : ((P.factions || []).find((f) => f.id === +k || f.key === k) || {}).n || ""); // h.fac = mã phái (factions[].id)
const ttGio = (s) => { s = s | 0; return s % 60 === 0 ? `${s / 60} phút` : s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`; };
function ttLam(b) {
  if (!hero) return Promise.resolve(null);
  return Net.tiThi(hero.slot | 0, b).then((j) => {
    applyServer(j);
    if (j.msg) P.hud.msg(String(j.msg).replace(/<color=?\w*>/g, ""), MAU_TIN.tien);
    if (j.say && j.say.text) P.hud.canh(String(j.say.text).replace(/<color=?\w*>/g, "").replace(/<enter>/g, " ")); // lôi đài từ chối cho vào (lời của Công Bình Tử)
    if (j.vao) ldVaoTran(j.vao);
    if (GW) GW.refresh(true);
    return j;
  }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua) P.hud.canh(e.message); return null; });
}
function ttChon(o, x, y) {
  document.getElementById("ttChon")?.remove();
  const T = luat().tiThi || {}, cau = Array.isArray(T.cau) ? T.cau : [];
  if (T.bat === false) return P.hud.canh("Tỉ thí đang tạm đóng");
  const c = document.createElement("div"); c.id = "ttChon";
  c.innerHTML = `<div class="dau">Chiến thư gửi ${esc(o.name)} — chọn 1 câu<span class="x" data-x="1">✕</span></div><div class="ds"><div class="c ng" data-i="-1"><b>?</b>Ngẫu nhiên 1 câu</div>`
    + cau.map((t, i) => `<div class="c" data-i="${i}"><b>${i + 1}.</b>${esc(t)}</div>`).join("") + `</div>`
    + `<div class="chan">Bấm 1 câu là gửi · miễn phí · đối phương có ${T.cho | 0 || 30} giây trả lời · đấu 1 vs 1 ở Lôi đài Công Bình Tử</div>`;
  document.body.appendChild(c);
  if (!document.body.classList.contains("dt")) { // máy tính: cạnh chỗ bấm, tràn phải thì sang trái; điện thoại: game.css đặt giữa màn
    const r = c.getBoundingClientRect(); let l = x + 6, t = y - 60;
    if (l + r.width > innerWidth - 8) l = Math.max(8, x - r.width - 6);
    t = Math.max(8, Math.min(t, innerHeight - r.height - 8));
    Object.assign(c.style, { left: Math.round(l) + "px", top: Math.round(t) + "px" });
  }
  const ngoai = (e) => { if (!c.contains(e.target)) dong(); }, phim = (e) => { if (e.key === "Escape") { e.stopPropagation(); dong(); } };
  const dong = () => { c.remove(); removeEventListener("pointerdown", ngoai, true); removeEventListener("keydown", phim, true); };
  setTimeout(() => { if (c.isConnected) { addEventListener("pointerdown", ngoai, true); addEventListener("keydown", phim, true); } }, 0);
  c.onclick = (e) => {
    if (e.target.closest("[data-x]")) { P.audio.ui("click"); return dong(); }
    const d = e.target.closest("[data-i]"); if (!d) return;
    P.audio.ui("click"); dong();
    ttLam({ viec: "gui", ten: o.name, cau: +d.dataset.i });
  };
}
// chiến thư đang chờ mình (ds từ nhịp / kênh tức thời): hiện cái đầu, rỗng -> ẩn
function ttMoiVe(ds) {
  const m = (Array.isArray(ds) ? ds : []).find((x) => x && x.id && !ttDaTra.has(x.id));
  if (!m) { if (ttThe) ttAn(ttThe.id); return; }
  if (ttThe && ttThe.id === m.id) return; // đang hiện: giữ đồng hồ theo hạn lúc đầu
  ttHien(m);
}
function ttAn(id) { if (!ttThe || (id && ttThe.id !== id)) return; clearInterval(ttThe.hen); ttThe.el.remove(); ttThe = null; }
function ttHien(m) {
  if (ttThe) ttAn(ttThe.id);
  const T = luat().tiThi || {}, phai = ttPhai(m.fac), tong = Math.max(1, (T.cho | 0 || 30) * 1000), het = performance.now() + Math.max(0, +m.con || 0);
  const el = document.createElement("div"); el.id = "ttC";
  el.innerHTML = `<div class="tieu">⚔ CHIẾN THƯ ⚔</div><div class="ai"><span>${esc(m.tu)}</span>${m.cap ? ` · cấp ${m.cap | 0}` : ""}${phai ? ` · ${esc(phai)}` : ""} thách đấu bạn</div>`
    + `<div class="cau">“${esc(m.cau)}”</div><div class="luat">Lôi đài Công Bình Tử · đấu 1 vs 1 · miễn phí · chết không mất gì</div>`
    + `<div class="luat">Chuẩn bị ${ttGio(T.chuanBi || 60)}, đấu ${ttGio(T.thiDau || 300)} — hết giờ bên gây nhiều sát thương hơn thắng</div>`
    + `<div class="gio"><i></i></div><div class="giay"></div><div class="nut"><span class="tt-nut" data-v="nhan">Nhận chiến</span><span class="tt-nut do" data-v="tuChoi">Từ chối</span></div>`;
  document.body.appendChild(el);
  const bar = el.querySelector(".gio i"), giay = el.querySelector(".giay");
  const ve = () => { const c = het - performance.now(); if (c <= 0) return ttAn(m.id); bar.style.width = Math.max(0, Math.min(100, (c / tong) * 100)) + "%"; giay.textContent = `còn ${Math.ceil(c / 1000)} giây`; };
  ttThe = { id: m.id, el, hen: setInterval(ve, 250) }; ve();
  el.onclick = (e) => {
    const d = e.target.closest("[data-v]"); if (!d || el.dataset.ban) return;
    el.dataset.ban = "1"; ttDaTra.add(m.id); P.audio.ui("click");
    ttLam({ viec: d.dataset.v, id: m.id }).finally(() => ttAn(m.id));
  };
}
// người thách: sân tỉ thí đã mở, mình chưa vào -> vào (1 lần mỗi trận; lỗi thì nhịp sau thử lại)
function ttVaoSan(id) {
  if (!id || id === ttVaoDa || !hero || zoneLoad || (world && laLd(world.zone)) || (ttVaoLan.get(id) | 0) >= 3) return;
  ttVaoDa = id; ttVaoLan.set(id, (ttVaoLan.get(id) | 0) + 1);
  if (ttVaoLan.size > 20) ttVaoLan.delete(ttVaoLan.keys().next().value);
  ttLam({ viec: "vao" }).then((j) => { if (!j || !j.vao) setTimeout(() => { if (ttVaoDa === id) ttVaoDa = 0; }, 4000); });
}
// menu người chơi trên bot Tống Kim (anh 06/11 "cho xem thông tin của bot nữa, như xem người chơi khác"): Xem trang bị = khung Trang bị chỉ xem (soiDo)
// từ nhân vật bot dựng ở máy mình (tkbot.js heroBot — mọi máy cùng 1 con); Giao dịch / Tổ đội trả lời như người chơi chưa mở giao dịch / cự tuyệt mời
// (câu client — bot không đánh dấu là bot, anh 05/11 C4)
function menuBot(o, v) {
  const H = o.H || {};
  if (v === "xem") return GW && GW.soiDo({ name: o.name, lvl: o.lvl | 0 || H.lvl || 1, sex: H.sex === "f" ? "f" : "m", series: H.series | 0, fac: H.fac ?? null, start: H.start || {}, attr: H.attr || {},
    equip: Object.fromEntries(Object.entries(H.equip || {}).filter(([, it]) => it && it.k).map(([s, it]) => [s, { ...it }])) });
  if (v === "gd") return P.hud.msg(`${o.name} chưa mở giao dịch.`);
  if (v === "doi") { P.hud.msg(`Đã gửi lời mời tới ${o.name}`); setTimeout(() => P.hud.msg(`${o.name} cự tuyệt lời mời của nhóm Bạn!`), 1500 + Math.random() * 2500); }
  if (v === "bang") bhLam({ viec: "moi", ten: o.name, bot: 1 }); // máy chủ trả lời y hệt người thật cự tuyệt — cùng câu, kênh, màu, độ trễ (soát 14/11: câu tự làm ở đây khác màu / dấu, lộ bot)
}
// ---------- Bang hội đợt 1 (anh 14/11 — THIET-KE-BANG-HOI.md; máy chủ may-chu/bang-hoi.js POST /api/bang-hoi, khung windows.js _faction) ----------
// Nhịp (THIET-KE 1.8): bhMinh { id, ten, cv, v } | null — bang của mình: đổi (vào / rời / v mới) thì khung Bang phái đang mở tải lại (GW.bangTai); dòng bang trên đầu
// mình World.bhMinh.nhan = "Tên bang(Chức)" như máy chủ dựng cho người khác (danh hiệu riêng / chung thay chữ chức — lấy ở BangXem gần nhất, ẩn sỹ không hậu tố).
// bhMoi { id, ten, nguoi } | null — lời mời vào bang: như lời mời tổ đội (dòng "<người> mời bạn gia nhập bang hội <bang>  Đồng ý  Cự tuyệt  Xem nhẹ" ở ô tin hệ
// thống + biểu tượng — hud.js moiDoi), trả lời bằng viec nhanMoi. Công cáo ghim đầu thẻ Bang hội của khung chat (hud.js ghimBang): bhCc (chữ | { t } | null) nếu
// máy chủ gửi theo nhịp; không thì lấy congCao của BangXem (tải ngầm "xem" lúc vào game / khi bang đổi, cách nhau ≥ BH_TAI_MS).
let bhMinhCur = null, bhVe = null, bhXem = null, bhCcCo = false, bhGhimCu = null, bhTaiLuc = -1e9, bhTaiHen = 0, bhMoiKhoa = "", bhMoiSo = 0;
const BH_TAI_MS = 20000, BH_CV_TEN = { chu: "Bang chủ", lao: "Trưởng Lão", doi: "Đội trưởng", de: "Đệ tử", an: "ẩn sỹ" };
// việc bang hội -> trả lời (đã áp: tiền / túi, câu báo, khung Bang phái) | { loi } (o.im: không báo lỗi ở khung chat — khung tự hiện)
function bhLam(b, o = {}) {
  if (!hero) return Promise.resolve(null);
  return Net.bangHoi(hero.slot | 0, b).then((j) => { bhNhan(j); return j; })
    .catch((e) => { if (e.ma !== "het-phien" && !e.boQua && !o.im) P.hud.msg(e.message); return { loi: e.message || "Không làm được", ma: e.ma, boQua: !!e.boQua }; });
}
function bhNhan(j) {
  if (!j) return;
  if (j.nv || j.tui) applyServer(j);
  for (const t of j.tin || []) P.hud.msg(t);
  if (j.msg && !(j.tin || []).includes(j.msg)) P.hud.msg(j.msg); // câu đã có trong tin thì không hiện 2 lần (lập bang: "Sáng lập bang hội thành công!")
  if ("bh" in j) { bhXem = j.bh || null; bhXemLuc = performance.now(); bhVeLai(); if (!bhCcCo) bhGhim(j.bh ? j.bh.congCao : null, j.bh && j.bh.id); }
  if (GW && GW.bangFill && ("bh" in j || Array.isArray(j.ds))) GW.bangFill(j.bh, j.ds, j.cho); // cho: lúc hết thời gian chờ sau khi rời bang
  if (GW && (j.nv || j.tui)) GW.refresh(true);
}
// dòng bang trên đầu mình
function bhVeLai() {
  const m = bhMinhCur;
  let nhan = null;
  if (m && m.ten) {
    const t = bhXem && String(bhXem.id) === String(m.id) ? bhXem : null, toi = (t && t.toi) || {};
    const dh = m.dh || toi.dh || (m.cv === "de" && t && t.dhChung ? (hero && hero.sex === "f" ? t.dhChung.nu : t.dhChung.nam) : "") || "";
    nhan = m.nhan || (m.cv === "an" ? m.ten : `${m.ten}(${dh || BH_CV_TEN[m.cv] || ""})`);
  }
  bhVe = nhan ? { nhan, cv: m.cv } : null; // cv: màu chức vụ (world.js veDongBang — mẫu 4)
  if (world) world.bhMinh = bhVe;
}
function bhMinhApply(m) {
  m = m && m.id != null && m.ten ? m : null;
  const cu = bhMinhCur;
  bhMinhCur = m;
  if (!cu && !m) return;
  // chỉ chữ trên đầu đổi (vd hết Hộ Bang giữa tuần — bản bang không tăng): vẽ lại dòng bang, khỏi tải lại khung (soát 14/11)
  if (cu && m && String(cu.id) === String(m.id) && cu.v === m.v && cu.cv === m.cv && cu.ten === m.ten && cu.dh === m.dh) { if (cu.nhan !== m.nhan) bhVeLai(); return; }
  bhVeLai();
  if (!m) { bhXem = null; bhGhim(null); if (GW && GW.bangFill) GW.bangFill(null); return; } // rời bang / bị đuổi / bang giải tán (khung đang mở: bangFill tự tải danh sách bang)
  if (GW && GW.bangTai) GW.bangTai(); // khung Bang phái đang mở: tải lại
  bhTaiNgam();
  if (world && world.zone.bang) khuLamMoi(); // đợt 4: đang ở khu vực bang — cấp bang / tác phường đổi thì dựng lại nhà / cột (≤ 1 lần / 30 giây)
}
// tải ngầm BangXem (công cáo ghim + danh hiệu của mình) khi máy chủ không gửi công cáo theo nhịp (máy chủ bang hội 14/11 gửi bhCc + bhMinh.nhan: không cần);
// khung Bang phái đang mở thì nó đã tải
function bhTaiNgam() {
  if (bhCcCo) return;
  const con = BH_TAI_MS - (performance.now() - bhTaiLuc);
  if (con > 0) { if (!bhTaiHen) bhTaiHen = setTimeout(() => { bhTaiHen = 0; bhTaiNgam(); }, con); return; }
  if (!bhMinhCur || (P.win && P.win.get("faction").visible)) return;
  bhTaiLuc = performance.now();
  bhLam({ viec: "xem" }, { im: true });
}
// lời mời vào bang: mã âm cho khỏi trùng mã lời mời tổ đội (số dương — to-doi.js); lời mời mới (khác bang / khác người mời, hoặc sau khi lời mời cũ hết) mã mới
function bhMoiApply(m) {
  if (!m || m.id == null) { bhMoiKhoa = ""; if (moiBhCho.length) { moiBhCho = []; veMoi(); } return; }
  const k = m.id + "|" + (m.nguoi || "");
  if (k !== bhMoiKhoa) {
    bhMoiKhoa = k; bhMoiSo = -(Math.abs(bhMoiSo) + 1);
    if (document.body.classList.contains("dt")) P.hud.msg(`${m.nguoi || "?"} mời bạn gia nhập bang hội ${m.ten || ""}`); // điện thoại: không có ô tin hệ thống
  }
  moiBhCho = [{ id: bhMoiSo, tu: m.nguoi || "?", bh: m.ten || "", bhId: m.id }];
  veMoi();
}
// bhCc { id, t? } (id 0 = không có công cáo / không ở bang) — máy chủ chỉ gửi khi mã khác mã trình duyệt đang ghim (Net.pulse gửi bhcc như ghim quản trị gh)
function bhCcApply(cc) {
  bhCcCo = true;
  bhGhim(cc == null ? null : typeof cc === "string" ? cc : cc.id === 0 ? null : cc.t ?? cc.m ?? null, bhMinhCur && bhMinhCur.id);
}
// công cáo ghim: đổi (không phải lần đầu sau khi vào game) thì thêm 1 dòng ở kênh Bang hội cho thành viên để ý
function bhGhim(t, id) {
  const s = t ? String(t).trim() : "", k = s ? `${id ?? ""}|${s}` : "";
  if (k === bhGhimCu) return;
  const dau = bhGhimCu == null; bhGhimCu = k;
  let h = 0; for (let i = 0; i < k.length; i++) h = (Math.imul(h, 31) + k.charCodeAt(i)) | 0; // mã ghim (× ẩn trên máy này tới khi công cáo đổi)
  if (P.hud && P.hud.ghimBang) P.hud.ghimBang(s ? { id: "bh" + (h >>> 0).toString(36), t: s } : null);
  if (s && !dau && P.hud) P.hud.chat("CH_TONG", "", `<color=yellow>[Công cáo]<color> ${s.split(/\r?\n/)[0].slice(0, 120)}`);
}
function bhThoat() {
  bhMinhCur = null; bhVe = null; bhXem = null; bhCcCo = false; bhGhimCu = null; bhMoiKhoa = ""; moiBhCho = []; Net.bhcc = 0; // nhân vật sau: máy chủ gửi lại công cáo
  clearTimeout(bhTaiHen); bhTaiHen = 0; bhTaiLuc = -1e9;
  khuDl = null; khuTinCho = []; clearTimeout(khuMoiHen); khuMoiHen = 0; khuMoiLuc = -1e9; // khu vực bang (đợt 4): nhân vật sau không dùng dữ liệu bang cũ
  if (P.hud && P.hud.ghimBang) P.hud.ghimBang(null);
  if (GW && GW.bangXoa) GW.bangXoa();
}
// số bang hội máy chủ báo kèm luật (luat().bangHoi — nếu có) để viết lời NPC; thiếu thì số chung của thiết kế (cấp 80, khảo nghiệm 3 ngày, 100 vạn, chờ 24 giờ), riêng số
// người khảo nghiệm / thống soái (khác nhau giữa S1 và S2) không có thì viết không số — máy chủ báo đúng điều kiện thiếu khi lập
function bhLuat() {
  const L = luat().bangHoi || {}; // khóa như cau-hinh.json bangHoi (phiLap: lượng, roiCho: giờ)
  return { capLap: L.capLap ?? 80, tsLap: L.tsLap ?? null, khaoNgay: L.khaoNgay ?? 3, coKhao: (L.khaoNgay ?? 3) > 0, khaoIp: L.khaoIp ?? 1, khaoNguoi: L.khaoNguoi ?? null, tien: L.phiLap != null ? Math.round(L.phiLap / 10000) : 100, coTien: L.phiLap != null, cho: L.roiCho ?? 24 };
}
// Người hướng dẫn bang hội (mẫu client 1783 — script\global\帮会接引人.lua: "Xem tin tức hỗ trợ bang hội" 8 trang + "Mở giao diện chiêu mộ bang hội"); S1 lập bang luôn ở
// đây theo kingofkingsoft.lua của Kim Sơn Chưởng Môn (THIET-KE 1.1 — không bắt lên Hoa Sơn). Lời client giữ nguyên, chỗ điều kiện (trùng sinh, thanh vọng, 16 người…)
// viết lại theo luật S1, sửa lỗi chính tả khi chép (kq3 F.8)
function bangHoiNpc(n) {
  if (!NPCD || !hero) return;
  const noi = (t) => richText(t, hero.name, n.name);
  NPCD.choose("msgsel", "InfoText", noi("Vị thiếu hiệp này có muốn gia nhập bang hội không?"), [
    ["Xem tin tức hỗ trợ bang hội", () => bhTroGiup(n, 32)],
    ["Mở giao diện chiêu mộ bang hội", () => GW && GW.moBangPhai(bhMinhCur ? "zhaomu" : "otherzhaomu")],
    ...(bhMinhCur ? [["Tế Đàn bang hội", () => teDanMo()], ["Tổng quản Lễ phẩm phường", () => leVatMo()]] : []), // đợt 2 (Q20 — chưa có khu vực bang): thành viên
    ["Thành lập bang hội", () => bhLapNpc(n)],
    ["Kết thúc đối thoại", null]]);
}
// ---------- Bang hội đợt 2 (anh 14/11 — scratchpad bh2/HOP-DONG-DOT-2.md mục 10.2): Tế Đàn (script\tong\npc\jitan.lua) + Tổng quản Lễ phẩm phường
// (script\tong\workshop\ws_liwu.lua) — khung lời msgsel như NPC. Chưa có khu vực bang (đợt 3): mở từ Người hướng dẫn bang hội (thành viên), khung Bang phái → Ký lục → Mục
// tiêu tuần → nút Tế Đàn (Tế Đàn), Tác phường → Sử dụng (Lễ Vật); không bắt đứng gần NPC (Q20). Số liệu: BangXem gần nhất (bhXem — teDan, leVat, tp, toi, quyen); chưa có
// thì tải "xem" rồi mở. Việc: bhLam (máy chủ kiểm mọi điều kiện, trả msg / tin); kết quả / lỗi: lời của NPC rồi quay lại khung (bhXem đã mới — bhNhan)
const bhTenNpc = (s) => String(s ?? "").replace(/[<>]/g, ""); // tên người chơi đưa vào lời NPC (richText thoát HTML; bỏ < > cho khỏi thành thẻ màu)
let bhXemLuc = -1e9; // lúc nhận BangXem gần nhất (bhNhan) — khung lời dùng lại nếu mới hơn 15 giây, cũ hơn thì tải lại (điểm danh / hồng bao còn lại thay đổi theo người khác)
function bhCanXem(f) {
  if (!hero || !NPCD) return;
  if (!bhMinhCur) return NPCD.talk(["Bạn hiện giờ không thuộc bang hội nào!"], 0, null);
  if (bhXem && String(bhXem.id) === String(bhMinhCur.id) && performance.now() - bhXemLuc < 15000) return f(bhXem);
  bhLam({ viec: "xem" }, { im: true }).then((j) => {
    if (j && j.bh) f(j.bh);
    else if (j && "bh" in j) NPCD.talk(["Bạn hiện giờ không thuộc bang hội nào!"], 0, null); // vừa rời / bị đuổi (nhịp chưa kịp báo)
    else if (j && !j.boQua) NPCD.talk([j.loi || "Không tải được thông tin bang hội — thử lại sau"], 0, null);
  });
}
// việc của khung lời: lỗi / câu máy chủ (tin, msg) -> lời NPC (ten: tên người nói) -> lai() (mở lại khung)
function bhViecNpc(b, ten, lai) {
  return bhLam(b, { im: true }).then((j) => {
    if (!j || j.boQua) return lai(); // bấm Hủy ở khung mật khẩu cấp 2
    const L = j.loi ? [j.loi] : (j.tin && j.tin.length ? j.tin : j.msg ? [j.msg] : []);
    NPCD.talk([richText(`${ten}: ${L.join("<enter>") || "Xong"}`, hero.name, ten)], 0, lai);
  });
}
// Tế Đàn: điểm danh mỗi ngày, thưởng mục tiêu tuần cá nhân / bang, độ khó tuần sau (chu / lao 2005), xem Hộ Bang, rủ bạn, đua cấp
function teDanMo() {
  bhCanXem((B) => {
    const ten = "Tế Đàn", noi = (t) => richText(t, hero.name, ten), T = B.teDan, L = luat().bangHoi || {}, lai = () => teDanMo();
    if (!T) return NPCD.talk([noi(`${ten}: Đợt sau mới mở`)], 0, null); // máy chủ đợt 1
    const t = B.toi || {}, quan = t.cv === "chu" || (t.cv === "lao" && !!(B.quyen || {})["2005"]), lam = (b) => bhViecNpc(b, ten, lai);
    const HB = { so: 3, cong: 200, congMin: 1000, ngay: 7, ...(L.hoBang || {}) }, RB = { ngay: 7, hetNgay: 14, cong: 300, congMoi: 300, kt: 200, congCan: 300, ...(L.ruBan || {}) };
    const xem = (s) => NPCD.talk([noi(`${ten}: ${s}`)], 0, lai);
    const doKho = () => NPCD.choose("msgsel", "InfoText", noi(`${ten}: Mức độ khó mục tiêu tuần của bang hội là cấp <color=yellow>${T.doKhoSau || 1}<color>, Thiết lập độ khó mục tiêu tuần hiện tại sẽ có tác dụng vào tuần sau, muốn thiết lập lại độ khó của mục tiêu tuần không?`),
      [["Độ khó cấp 1", () => lam({ viec: "mtDoKho", doKho: 1 })], ["Độ khó cấp 2", () => lam({ viec: "mtDoKho", doKho: 2 })], ["Không cần đâu", lai]]);
    const hoBang = () => xem(Array.isArray(T.hoBang) && T.hoBang.length ? `Hộ Bang tuần trước của bổn bang: ${T.hoBang.map((x) => `<color=yellow>${bhTenNpc(x.ten)}<color> (${fmtSo(x.ct || 0)} điểm)`).join(", ")} — mỗi người nhận ${fmtSo(HB.cong)} điểm cống hiến và danh hiệu (Hộ Bang) ${HB.ngay} ngày.`
      : `Tuần trước bổn bang chưa có Hộ Bang. Mỗi thứ Hai, ${HB.so} thành viên có điểm cống hiến từ hoạt động trong tuần cao nhất (ít nhất ${fmtSo(HB.congMin)} điểm) được chọn: nhận ${fmtSo(HB.cong)} điểm cống hiến và danh hiệu (Hộ Bang) ${HB.ngay} ngày.`);
    const ruBan = () => xem(`Mời bằng hữu vào bang bằng lời mời (Ctrl + chuột phải vào người chơi → Mời vào bang). Người mới ở bang đủ ${RB.ngay} ngày và có ${fmtSo(RB.congCan)} điểm cống hiến từ hoạt động (trong ${RB.hetNgay} ngày đầu): người mời nhận ${fmtSo(RB.cong)}, người mới nhận ${fmtSo(RB.congMoi)} điểm cống hiến, bang thêm ${fmtSo(RB.kt)} vạn ngân sách kiến thiết. Mỗi tài khoản (mỗi chủ tài khoản) chỉ tính 1 lần; người mời và người mới phải là 2 người khác nhau.<enter>` +
      (Array.isArray(T.ruBan) && T.ruBan.length ? `Đang chờ: ${T.ruBan.map((x) => `<color=yellow>${bhTenNpc(x.ten)}<color> (còn ${x.con | 0} ngày)`).join(", ")}` : "Hiện chưa có người mới nào đang chờ."));
    const duaCap = () => { const d = T.duaCap || {}, ds = (c) => (Array.isArray(d[c]) && d[c].length ? d[c].map((x) => `<color=yellow>${bhTenNpc(x)}<color>`).join(", ") : "chưa có"); return xem(`Ba bang hội đầu tiên lên đẳng cấp kiến thiết 2 và 4 được ghi danh (phần thưởng lệnh gọi Boss mở ở đợt sau).<enter>Cấp 2: ${ds("2")}<enter>Cấp 4: ${ds("4")}`); };
    const dd = T.dd ? "<color=green>Hôm nay đã nhận thưởng điểm danh.<color>" : T.ly ? `<color=red>${bhTenNpc(T.ly)}<color>` : `Hôm nay chưa nhận thưởng: <color=yellow>${fmtSo(T.cong)}<color> điểm cống hiến.`;
    NPCD.choose("msgsel", "InfoText", noi(`${ten}: Ngươi tìm ta có việc gì?<enter>${dd}<enter>Cống hiến cá nhân: <color=yellow>${fmtSo(t.cong || 0)}<color>`), [
      ["Nhận phần thưởng điểm cống hiến mỗi ngày", () => lam({ viec: "diemDanh" })],
      ["Phần thưởng mục tiêu tuần cá nhân", () => lam({ viec: "mtLinh" })],
      ...(quan ? [["Thiết lập độ khó mục tiêu tuần", doKho], ["Phần thưởng mục tiêu tuần bang hội", () => lam({ viec: "mtBang" })]] : []),
      ["Hộ Bang tuần trước", hoBang], ["Rủ bạn vào bang", ruBan], ["Đua cấp bang hội", duaCap],
      ["<color=gray>Tự tiến cử chức bang chủ<color>", () => xem("Tự tiến cử chức bang chủ — Đợt sau mới mở")],
      ["Hủy bỏ", null]]);
  });
}
// Tổng quản Lễ phẩm phường (Khu Lễ vật): nhận hồng bao (mua là mở ngay — Q1), tặng hồng bao cho thành viên (mật khẩu cấp 2 — net.js tự hỏi), đổi lễ phẩm (cửa hàng — GW.moLePham)
function leVatMo() {
  bhCanXem((B) => {
    const ten = "Tổng quản Lễ phẩm phường", noi = (t) => richText(t, hero.name, ten), lai = () => leVatMo(), LV = B.leVat, x = (B.tp || {}).leVat;
    if (!B.tp) return NPCD.talk([noi(`${ten}: Đợt sau mới mở`)], 0, null); // máy chủ đợt 1
    if (!LV || !x) return NPCD.talk([noi(`${ten}: Bổn bang chưa thành lập Khu Lễ vật`)], 0, null);
    if (!x.mo) return NPCD.talk([noi(`${ten}: Bang hội ta chưa xây dựng tác phường này, muốn sử dụng phải đi tìm bang chủ hoặc trưởng lão khai mở.`)], 0, null); // ws SVR_CheckUse (đang đóng cửa)
    if (B.phi && B.phi.dung) return NPCD.talk([noi(`${ten}: Tác Phường đang tạm ngừng hoạt động.`)], 0, null);
    const hb = LV.hb || {}, lam = (b) => bhViecNpc(b, ten, lai);
    const nhan = () => {
      if ((hb.con | 0) <= 0) return NPCD.talk([noi(`${ten}: Thật đáng tiếc, hôm nay lễ phẩm đã phát xong, ngày mai hãy đến vậy!`)], 0, lai);
      NPCD.choose("msgsel", "InfoText", noi(`${ten}: Cần sử dụng <color=yellow>${fmtSo(hb.gia || 0)}<color> điểm cống hiến để đổi lấy 1 hồng bao`), [["Được.", () => lam({ viec: "hongBao" })], ["Không muốn", lai]]);
    };
    const MOI = 6;
    const tang = (trang = 0) => {
      const ds = (B.tv || []).filter((m) => m.ten !== hero.name).sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || String(a.ten).localeCompare(String(b.ten)));
      if (!ds.length) return NPCD.talk([noi(`${ten}: Bổn bang chưa có thành viên nào khác để tặng hồng bao`)], 0, lai);
      const n = Math.ceil(ds.length / MOI); trang = Math.max(0, Math.min(n - 1, trang));
      const O = ds.slice(trang * MOI, trang * MOI + MOI).map((m) => [`${bhTenNpc(m.ten)} (${BH_CV_TEN[m.cv] || ""}${m.on ? ", trên mạng" : ""})`, () => hoiTang(m, trang)]);
      if (trang > 0) O.push(["Trang trước", () => tang(trang - 1)]);
      if (trang < n - 1) O.push(["Trang sau", () => tang(trang + 1)]);
      O.push(["Không cần đâu", lai]);
      NPCD.choose("msgsel", "InfoText", noi(`${ten}: Tặng hồng bao thần bí cho thành viên nào? Giá <color=yellow>${fmtSo(hb.gia || 0)}<color> điểm cống hiến của ngươi; tuần này đã tặng ${hb.tang | 0} / ${hb.tangMax | 0}.${n > 1 ? ` (trang ${trang + 1}/${n})` : ""}`), O);
    };
    const hoiTang = (m, trang) => NPCD.choose("msgsel", "InfoText", noi(`${ten}: Dùng <color=yellow>${fmtSo(hb.gia || 0)}<color> điểm cống hiến tặng 1 hồng bao thần bí cho <color=yellow>${bhTenNpc(m.ten)}<color>? Phần thưởng mở ra giao thẳng cho người đó.`),
      [["Được.", () => lam({ viec: "tangHb", ten: m.ten })], ["Không muốn", () => tang(trang)]]);
    NPCD.choose("msgsel", "InfoText", noi(`${ten}: Ngày ngày tặng đại lễ, tháng tháng có tin vui. Tết nay không nhận lễ, có chăng nhận hồng bao!<enter>Hôm nay bang còn <color=yellow>${hb.con | 0}<color> / ${hb.max | 0} hồng bao · ngươi đã nhận ${hb.toi | 0} / ${hb.toiMax | 0}<enter>Cống hiến cá nhân: <color=yellow>${fmtSo((B.toi || {}).cong || 0)}<color>`), [
      ["Nhận hồng bao", nhan], ["Tặng hồng bao cho thành viên", () => tang(0)], ["Đổi lễ phẩm", () => GW && GW.moLePham()], ["Không cần đâu", null]]);
  });
}
// ---------- Khu vực bang (bang hội đợt 4 — scratchpad bh4/HOP-DONG-DOT-4.md mục 6; máy chủ may-chu/khu-bang.js POST /api/khu-bang) ----------
// Bãi bang = bãi có cờ bang trong map.json (586 Khu vực bang hội chung: mỗi bang một bản riêng, từ cấp 1; 590 Kinh Sư / 593 Giang Nam: lãnh địa bang chủ chọn 1 lần khi bang
// đạt bangCap 2). Vào: khung Bang phái → "Vào bang này" / Xa phu các thành → "Khu vực bang hội" (máy chủ xét rồi trả di). Ra: Xa phu khu (client tong_chefu.lua — bãi luyện
// công miễn phí; Ba Lăng huyện / Biện Kinh khuBang.xaPhu.gia lượng). Máy chủ đưa người không còn được ở khu đi (nhịp kbDi — applyServer), vào game ở chỗ cũ hỏi trước
// (khuDangNhap). NPC khu (npc-them.json bhVai — khuNpc): Tổng quản tác phường, nhà tác phường (hiện theo cấp tác phường — bhCapTP), Tế Tửu, Rương (viec "ruong"), Xa phu,
// cột biểu tượng (theo cấp bang — bhCapBang)
let khuDl = null;      // KhuXem (HOP-DONG-DOT-4 2.2) của bang mình — lọc nhà / cột (zoneNpcs), Xa phu khu; null = chưa có (ẩn nhà / cột)
let khuTinCho = [];    // câu báo lúc vào game (khuDangNhap) — in sau khi dựng giao diện
let khuXeLuc = -1e9;   // Trợ Thủ gọi Xa phu khu lần cuối (chặn gọi dồn khi thiếu tiền)
let khuMoiLuc = -1e9, khuMoiHen = 0; // lần hỏi lại KhuXem cuối (bang đổi lúc đang ở khu — ≤ 1 lần / 30 giây) + hẹn hỏi lại khi còn trong 30 giây
// việc khu vực bang (POST /api/khu-bang { o, viec, … }) -> trả lời (đã áp tiền / túi; có khóa khu thì khuDl theo máy chủ) | { loi, ma, boQua } (im: không báo lỗi ở khung
// chat — nơi gọi tự hiện câu máy chủ)
function khuLam(b, im) {
  if (!hero) return Promise.resolve({ loi: "Chưa vào game" });
  return Net.call("POST", "khu-bang", { o: hero.slot | 0, ...b }).then((j) => {
    j = j || {};
    if (j.nv || j.tui) applyServer(j);
    if ("khu" in j) khuDl = j.khu || null; // thành viên: KhuXem; không phải thành viên: null
    return j;
  }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua && !im) P.hud.msg(e.message); return { loi: e.message || "Không làm được", ma: e.ma, boQua: !!e.boQua }; });
}
// "Vào bang này" (khung Bang phái) / Trợ Thủ về "nhà" là bãi bang (xeToi): máy chủ xét (thành viên, bang có khu, chỗ đang đứng — HOP-DONG-DOT-4 2.1) rồi trả di
function khuVao() {
  if (!hero || !world) return;
  if (zoneLoad) return P.hud.msg("Đang chuyển bản đồ — tải xong rồi bấm lại");
  if (world.player.hp <= 0) return P.hud.msg("Đang trọng thương — không đi được");
  if (world.zone.bang) return P.hud.msg("Đang ở khu vực bang hội — muốn rời hãy nói chuyện với Xa phu");
  return khuLam({ viec: "vao" }).then((j) => {
    if (!j || j.loi) return;
    for (const t of j.tin || []) P.hud.msg(t);
    if (j.di) { const f = P.win.get("faction"); if (f && f.visible) f.hide(); diPld(j.di); } // khung Bang phái không che khu vừa tới
  });
}
// vào game mà chỗ lưu ở bãi bang (như tkDangNhap): hỏi máy chủ còn được ở khu không -> { zone, at } (đúng chỗ cũ / điểm vào khu mới) | null (vào ở Ba Lăng huyện —
// START_ZONE, câu báo khuTinCho). Chờ tối đa 6 giây
async function khuDangNhap(v) {
  let j = null;
  try { j = await Promise.race([khuLam({ viec: "dangNhap", z: v.z }, true), new Promise((r) => setTimeout(() => r(null), 6000))]); } catch { j = null; }
  const ve = (P.maps.zones.find((z) => z.id === START_ZONE) || {}).n || "Ba Lăng huyện";
  if (!j) { khuTinCho.push(`Máy chủ chưa trả lời về khu vực bang hội — vào game ở ${ve}`); return null; }
  if (j.loi) { if (!j.boQua && j.ma !== "het-phien") khuTinCho.push(`${j.loi} — vào game ở ${ve}`); return null; }
  for (const t of j.tin || []) khuTinCho.push(t);
  const z = j.vao && P.maps.zones.find((x) => x.id === j.vao.z && x.bang);
  if (!z) return null;
  return { zone: z, at: j.vao.z === v.z && Number.isFinite(v.x) && Number.isFinite(v.y) ? [v.x, v.y] : Array.isArray(j.vao.at) ? j.vao.at : null };
}
// NPC khu vực bang (npc-them.json bhVai): nhà tác phường theo cấp tác phường của bang mình (bhCapTP), cột biểu tượng theo cấp bang (bhCapBang); chưa có dữ liệu bang (khuDl
// null) -> ẩn nhà / cột. Lọc lúc dựng NPC của bãi (zoneNpcs — cả shopTown dò mọi bãi thành)
const khuHien = (n) => {
  if (!n.bhVai) return true;
  if (Array.isArray(n.bhCapTP)) { const c = khuDl && khuDl.tp ? khuDl.tp[n.bhVai.slice(4)] | 0 : 0; return c >= n.bhCapTP[0] && c <= n.bhCapTP[1]; }
  if (Array.isArray(n.bhCapBang)) { const c = khuDl ? khuDl.cap | 0 : 0; return c >= n.bhCapBang[0] && c <= n.bhCapBang[1]; }
  return true;
};
// hội thoại NPC khu theo bhVai (client: script\tong\npc\*.lua, *_zongguan.lua, tong_totempole.lua / city_totempole.lua). Rương (viec "ruong") đã mở kho ở w.onTalk như client OpenBox
// Cột biểu tượng bang — Đặc kỹ Bang hội (Gói 2A): nhận buff 4 giờ & lãnh đạo khai mở/nâng cấp bằng Kiến thiết
function dacKyBangMo(laThanh = false) {
  bhCanXem((B) => {
    const ten = laThanh ? "Cột biểu tượng thành thị" : "Cột biểu tượng bang";
    const noi = (t) => richText(t, hero.name, ten), lai = () => dacKyBangMo(laThanh);
    const ds = Array.isArray(B.dacKy) ? B.dacKy : [];
    if (!ds.length) return NPCD.talk([noi(`${ten}: Chưa nạp được danh sách đặc kỹ bang hội`)], 0, null);
    const t = B.toi || {}, q = B.quyen || {};
    const quan = t.cv === "chu" || (t.cv === "lao" && !!(q["2003"] || q["2005"]));
    const lam = (b) => bhViecNpc(b, ten, lai);
    const moTaDs = ds.map((d) => `• <color=yellow>${d.ten}<color> (cấp ${d.cap}/${d.max}): ${d.moTa}`).join("<enter>");
    const moNhan = () => {
      const daMo = ds.filter((d) => d.cap > 0);
      if (!daMo.length) return NPCD.talk([noi(`${ten}: Bổn bang chưa khai mở đặc kỹ nào. Bang chủ hoặc Trưởng lão có thể dùng Ngân sách kiến thiết để khai mở.`)], 0, lai);
      NPCD.choose("msgsel", "InfoText", noi(`${ten}: Chọn đặc kỹ muốn nhận (hiệu lực 4 giờ online · miễn phí lần đầu mỗi ngày, làm mới trong ngày tốn 10 cống hiến).<enter>Cống hiến cá nhân: <color=yellow>${fmtSo(t.cong || 0)}<color>`), [
        ...daMo.map((d) => [`${d.ten} (cấp ${d.cap})${d.daNhan ? " [Làm mới: 10 CH]" : " [Miễn phí]"}`, () => lam({ viec: "dkNhan", k: d.k })]),
        ["Quay lại", lai]
      ]);
    };
    const moNang = () => {
      NPCD.choose("msgsel", "InfoText", noi(`${ten}: Chọn đặc kỹ muốn khai mở / nâng cấp.<enter>Đẳng cấp bang: <color=yellow>${B.cap || 1}<color> · Ngân sách kiến thiết: <color=yellow>${fmtSo(B.kt || 0)} vạn<color>`), [
        ...ds.map((d) => [
          d.cap >= d.max ? `${d.ten} (Đã tối đa cấp ${d.max})` : `${d.cap === 0 ? "Khai mở" : "Nâng cấp"} ${d.ten} → cấp ${d.cap + 1} (${d.phiKt}v KT)`,
          () => lam({ viec: "dkLenCap", k: d.k })
        ]),
        ["Quay lại", lai]
      ]);
    };
    NPCD.choose("msgsel", "InfoText", noi(`${ten}: Đặc kỹ bang hội gia tăng thực lực cho toàn thể huynh đệ!<enter>${moTaDs}<enter>Cống hiến: <color=yellow>${fmtSo(t.cong || 0)}<color> · Kiến thiết: <color=yellow>${fmtSo(B.kt || 0)} vạn<color>`), [
      ["Nhận hiệu quả đặc kỹ bang", moNhan],
      ...(quan ? [["Khai mở / Nâng cấp đặc kỹ bang", moNang]] : []),
      ["Hủy bỏ", null]
    ]);
  });
}

// 6 Tác phường Bang hội (Gói 2B): Thí luyện, Hoạt động, Binh giáp, Thiên công, Thiên ý, Dị dung
function tacPhuongMo(loai) {
  if (loai === "leVat" || loai === "lePham") return leVatMo();
  bhCanXem((B) => {
    const ten = KHU_TQ[loai] || "Tổng quản tác phường";
    const noi = (t) => richText(t, hero.name, ten), lai = () => tacPhuongMo(loai);
    const x = (B.tp || {})[loai];
    if (!x) return NPCD.talk([noi(`${ten}: Không tìm thấy thông tin tác phường này`)], 0, null);
    const t = B.toi || {}, q = B.quyen || {}, quan = t.cv === "chu" || (t.cv === "lao" && !!q["2003"]);
    const lam = (b) => bhViecNpc(b, ten, lai);
    if (!x.mo || (x.cap | 0) < 1) {
      if (quan) {
        return NPCD.choose("msgsel", "InfoText", noi(`${ten}: <color=yellow>${x.ten}<color> hiện chưa khai mở. Ngươi có muốn khai mở tác phường này ngay không?`), [
          [`Khai mở ${x.ten}`, () => lam({ viec: "tpMoDong", tp: loai })],
          ["Để sau", null]
        ]);
      }
      return NPCD.talk([noi(`${ten}: ${x.ten} chưa được khai mở. Hãy báo Bang chủ hoặc Trưởng lão khai mở tại Bang phái → Tác phường.`)], 0, null);
    }
    const sd = Math.max(1, x.sd | 0), dem = B.tpNhat || {}, cong = fmtSo(t.cong || 0);
    const dung = (hanh, extra) => lam({ viec: "tpDung", tp: loai, hanh, ...(extra || {}) });

    if (loai === "thiLuyen") {
      const exp = Math.round((50000 + (hero.lvl || 1) * 15000) * (1 + (sd - 1) * 0.25));
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Nơi huynh đệ chuyên tâm tu luyện nội công!<enter>Cống hiến: <color=yellow>${cong}<color> · Hôm nay đã tu luyện ${dem.tlExp | 0}/3 lần`), [
        [`Tu luyện nhận ${fmtSo(exp)} EXP (30 cống hiến)`, () => dung("luyenExp")],
        [`Đổi 1 Tiên Thảo Lộ khóa (80 CH · cần cấp 2 · ${dem.tlTtl | 0}/1)`, () => dung("doiTtl")],
        ["Hủy bỏ", null]
      ]);
    }
    if (loai === "hoatDong") {
      const hs = 1 + (sd - 1) * 0.1;
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Hoàn thành nhiệm vụ bang hội hằng ngày để nhận điểm cống hiến và xây dựng ngân quỹ!<enter>Cống hiến: <color=yellow>${cong}<color> · Kiến thiết bang: <color=yellow>${fmtSo(B.kt || 0)} vạn<color>`), [
        [`Tuần tra khu bang (Miễn phí · +${Math.round(40 * hs)} CH · ${dem.hdTuan | 0}/1)`, () => dung("tuanTra")],
        [`Quyên vật tư chiến bị (5v lượng · +${Math.round(60 * hs)} CH · ${dem.hdVat | 0}/2)`, () => dung("quyenVatTu")],
        ["Hủy bỏ", null]
      ]);
    }
    if (loai === "binhGiap") {
      const lan = dem.bgSua | 0;
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Chuyên rèn sửa binh giáp và gia cố phòng ngự cho huynh đệ!<enter>Cống hiến: <color=yellow>${cong}<color>`), [
        [`Sửa toàn bộ trang bị đang mặc (${lan === 0 ? "Miễn phí hôm nay" : "10 cống hiến"})`, () => dung("suaDo")],
        [`Cường hóa chiến giáp 2h (+${sd * 200} HP, +${sd * 2}% Kháng · 25 CH)`, () => dung("buffGiap")],
        ["Hủy bỏ", null]
      ]);
    }
    if (loai === "thienCong") {
      const giaChuy = Math.max(40, 100 - sd * 8), giaBql = Math.max(30, 80 - sd * 6);
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Xưởng chế tác bảo vật đặc chế của bang hội (món đổi khóa vĩnh viễn)!<enter>Cống hiến: <color=yellow>${cong}<color>`), [
        [`Đổi 1 Huyền Thiên Chùy (${giaChuy} CH · ${dem.tcChuy | 0}/2 hôm nay)`, () => dung("doiChuy")],
        [`Đổi 1 Bách Quả Lộ (${giaBql} CH · cần cấp 2 · ${dem.tcBql | 0}/2)`, () => dung("doiBql")],
        ["Hủy bỏ", null]
      ]);
    }
    if (loai === "thienY") {
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Rút quẻ cầu phúc mỗi ngày nhận lộc ngân lượng và tăng May mắn đánh quái!<enter>Cống hiến: <color=yellow>${cong}<color> · Hôm nay: ${dem.tyQue | 0}/1 lần`), [
        [`Cầu phúc rút quẻ (20 CH · buff +${4 + sd * 2} May mắn 2h + lộc)`, () => dung("cauPhuc")],
        ["Hủy bỏ", null]
      ]);
    }
    if (loai === "diDung") {
      return NPCD.choose("msgsel", "InfoText", noi(`${ten} (cấp ${sd}): Thay đổi danh hiệu cá nhân và dưỡng thần gia tăng công lực!<enter>Cống hiến: <color=yellow>${cong}<color>`), [
        ["Đổi danh hiệu cá nhân trong bang (Miễn phí)", () => GW && GW.nhapChu({ tieuDe: "Nhập danh hiệu bang (tối đa 12 ký tự, để trống = xóa)", toiDa: 12 }).then((dh) => { if (dh != null) dung("doiDh", { dh }); })],
        [`Dưỡng thần 2h (+${sd * 30} Công kích vật lý, +${sd * 5} Tốc đánh · 20 CH)`, () => dung("buffThan")],
        ["Hủy bỏ", null]
      ]);
    }
  });
}
const KHU_TQ = { binhGiap: "Tổng quản Binh giáp phường", thienCong: "Tổng quản Thiên công phường", diDung: "Tổng quản Dị dung phường", thienY: "Tổng quản Thiên ý phường",
  thiLuyen: "Tổng quản Thí luyện phường", lePham: "Tổng quản Lễ phẩm phường", hoatDong: "Tổng quản Hoạt động phường" };
function khuNpc(n) {
  if (!NPCD || !hero) return;
  const v = n.bhVai, noi = (ten, t) => richText(`${ten}: ${t}`, hero.name, ten);
  if (v === "xaPhu") return khuXaPhuMo(n);
  if (v === "teDan") return teDanMo(); // Tế Tửu -> Tế Đàn (đợt 2)
  const loai = v.startsWith("tongQuan:") ? v.slice(9) : v.startsWith("nha:") ? v.slice(4) : null; // nhà = Tổng quản cùng loại (client building[] dùng script zongguan)
  if (loai === "lePham") return leVatMo(); // Khu Lễ vật -> Tổng quản Lễ phẩm phường (đợt 2)
  if (loai) return tacPhuongMo(loai);
  if (v === "cot") return dacKyBangMo(false);
  if (v === "cot:thanh") return dacKyBangMo(true);
  NPCD.talk([noi(n.name, "Đợt sau mới mở")], 0, null);
}
// Xa phu khu (client tong_chefu.lua): "Những nơi đã đi qua" = bãi luyện công (miễn phí như Xa phu thành — xaPhuFn WayPointFun); "Những thành thị đã đi qua" = Ba Lăng huyện /
// Biện Kinh, lộ phí khuBang.xaPhu.gia (máy chủ trừ — khuXaPhu)
function khuXaPhuMo(n) {
  if (!NPCD || !hero) return;
  const noi = (t) => richText(t, hero.name, n.name), X = (khuDl && khuDl.xaPhu) || (luat().khuBang || {}).xaPhu || { gia: 800, den: [] }, gia = X.gia ?? 800;
  const den = (X.den || []).map((d) => (typeof d === "number" ? { z: d, n: (P.maps.zones.find((z) => z.id === d) || {}).n || "" } : d)).filter((d) => d && d.n);
  NPCD.choose("msgsel", "InfoText", noi("Xa phu: Đại hiệp muốn đi đâu?"), [
    ["Những nơi đã đi qua", () => xeHien(xaPhuFn("WayPointFun"), n)],
    ["Những thành thị đã đi qua", () => NPCD.choose("msgsel", "InfoText", noi("Đại hiệp muốn đi đâu: "),
      [...den.map((d) => [gia > 0 ? `${d.n} [${fmtMoney(gia)}]` : d.n, () => khuXaPhu(d.z)]), ["Đâu cũng không muốn đi!", null]])],
    ["Đâu cũng không muốn đi!", null]]);
}
// hiện kết quả xaPhuFn ({ text, opts } | { close } | Promise) ở khung tự dựng (Xa phu khu): lựa chọn dạng chuỗi (vd "BanBai:225") đổi thành hàm — NPCD.show cần NPC đang mở
function xeHien(r, n) {
  if (!r || !NPCD || !hero) return;
  if (typeof r.then === "function") return void r.then((x) => xeHien(x, n), () => {});
  if (r.close) return;
  NPCD.choose("msgsel", "InfoText", richText(r.text, hero.name, n.name), (r.opts || []).map(([t, f]) => [t, typeof f === "string" ? () => xeHien(xaPhuFn(f), n) : f]));
}
// Xa phu khu -> thành z (máy chủ trừ lộ phí, trả di). troThu: Trợ Thủ đi Xa phu (xeTick) — lỗi (thiếu tiền…) báo đỏ "Trợ Thủ: …" rồi dừng; gọi lại trong 10 giây bỏ qua.
// Người bấm: lỗi thành lời Xa phu (câu client "Từ bang hội đến các đại thành thị cần 800 lượng…")
function khuXaPhu(z, troThu) {
  if (!hero || zoneLoad) return;
  if (troThu) { if (performance.now() - khuXeLuc < 10000) return; khuXeLuc = performance.now(); }
  khuLam({ viec: "xaPhu", den: z }, true).then((j) => {
    if (!j || j.boQua || j.ma === "het-phien") return;
    if (j.loi) {
      if (troThu) { P.hud.canh("Trợ Thủ: " + j.loi); diXe = null; }
      else if (NPCD && hero) NPCD.talk([richText(j.loi, hero.name, "Xa phu")], 0, null);
      return;
    }
    for (const t of j.tin || []) P.hud.msg(t);
    if (j.di) diPld(j.di);
  });
}
// "Tạo bản đồ" (khung Bang phái → Chức năng → trang 2 — client map_management.lua, không Thanh đồng đỉnh): bang chủ chọn lãnh địa 1 lần khi bang đạt cấp 2; đổi / bỏ: F10
function khuChonMau() {
  if (!hero || !NPCD || !GW) return;
  khuLam({ viec: "xem" }).then((j) => {
    if (!j || j.loi) return;
    const K = j.khu;
    if (!K) return P.hud.msg(j.ly || "Bạn hiện giờ không thuộc bang hội nào!");
    if (!K.chonDuoc) return GW.bao(K.lyChon || "Chưa chọn được lãnh địa");
    // khung hỏi ngắt dòng giữa chữ (như client) -> tự xuống dòng, mỗi dòng ≤ ~50 ký tự
    const chon = (m) => GW.hoi(`Ngươi xác định muốn chọn <color=yellow>${bhTenNpc(m.ten || m.n)}<color><enter>làm khu vực bang hội của bổn bang?<enter>Chỉ chọn được 1 lần — muốn đổi phải nhờ quản trị.`, "Xác nhận", "Hủy bỏ").then((ok) => {
      if (ok) khuLam({ viec: "chonMau", mau: m.z }, true).then((x) => {
        if (!x || x.boQua || x.ma === "het-phien") return;
        if (x.loi) return GW.bao(x.loi);
        if (x.msg) P.hud.msg(x.msg, MAU_TIN.tien);
        for (const t of x.tin || []) P.hud.msg(t);
      });
    });
    NPCD.choose("msgsel", "InfoText", richText("Hãy lựa chọn khu vực muốn xây dựng", hero.name), [...(K.mau || []).map((m) => [bhTenNpc(m.ten || m.n), () => chon(m)]), ["Hủy bỏ", null]]);
  });
}
// "Thiết lập khu vực" (Chức năng → trang 2): xem khu vực của bổn bang — máy chủ này không mở cấm địa / tham quan (chỉ thành viên vào)
function khuThietLap() {
  if (!GW) return;
  khuLam({ viec: "xem" }).then((j) => {
    if (!j || j.loi) return;
    const K = j.khu;
    if (!K) return GW.bao(j.ly || "Bạn hiện giờ không thuộc bang hội nào!");
    const L = K.lanhDia, Y = (t) => `<color=yellow>${bhTenNpc(t)}<color>`;
    // khung báo ngắt dòng giữa chữ (như client) -> mỗi dòng ≤ ~50 ký tự
    GW.bao([`Khu vực của bổn bang: ${K.z ? Y(K.tenKhu || K.z) : `<color=red>chưa có<color><enter>${bhTenNpc(K.ly || "")}`}`,
      L ? `Lãnh địa: ${Y(L.ten || L.mau)}, chọn lúc ${L.luc ? gioNgay(L.luc) : "?"}<enter>bởi ${bhTenNpc(L.ai || "?")}.` : "Lãnh địa: chưa chọn — bang chủ chọn ở nút<enter>Tạo bản đồ khi bang đạt cấp 2.",
      "Chỉ thành viên bổn bang vào được, mỗi bang<enter>một bản riêng (không mở cấm địa / tham quan).",
      "Muốn đổi lãnh địa: nhờ quản trị."].join("<enter>"));
  });
}
// đang ở khu mà bang đổi (nhịp bhMinh v mới — cấp bang / tác phường có thể vừa đổi — K12): hỏi lại KhuXem (≤ 1 lần / 30 giây), cấp / tác phường khác thì dựng lại khu tại chỗ
// (nhà / cột theo số mới)
function khuLamMoi() {
  if (!world || !world.zone.bang || !hero) return;
  const con = 30000 - (performance.now() - khuMoiLuc);
  if (con > 0) { if (!khuMoiHen) khuMoiHen = setTimeout(() => { khuMoiHen = 0; khuLamMoi(); }, con); return; }
  khuMoiLuc = performance.now();
  const cu = khuDl;
  khuLam({ viec: "xem" }, true).then((j) => {
    const K = j && !j.loi ? j.khu : null, w = world;
    if (!K || !w || !w.zone.bang || zoneLoad) return;
    if (cu && (cu.cap | 0) === (K.cap | 0) && JSON.stringify(cu.tp || {}) === JSON.stringify(K.tp || {})) return;
    gotoZone(w.zone, { at: [w.player.x, w.player.y] }).catch(fail);
  });
}
function bhTroGiup(n, i) {
  const noi = (t) => richText(t, hero.name, n.name), L = bhLuat(), sau = " <color=yellow>(mở ở đợt sau)<color>";
  // đợt 2 (trang 36 quỹ, 37 tiền thưởng 3 bậc, 39 mục tiêu tuần): số của máy chủ (luat().bangHoi — cau-hinh.json), thiếu thì số của hợp đồng đợt 2
  const B0 = luat().bangHoi || {}, g = (k, md) => ({ ...md, ...(B0[k] || {}) }), so1 = (x) => String(Math.round((+x || 0) * 100) / 100).replace(".", ",");
  const D2 = { chia: g("chia", { duTru: 0.15, kt: 0.06, cb: 0.04 }), quyenCong: B0.quyenCong ?? 1, quyenTuan: Array.isArray(B0.quyenTuan) && B0.quyenTuan.length ? B0.quyenTuan : [1000, 2000, 3000, 4000, 5000, 5000],
    baoTri: g("baoTri", { tv: 5, hoatDong: 7, dung: 7, tuBu: 10 }), teDan: g("teDan", { cb: 5 }), phatDu: g("phatDu", { toiDaLan: 500, nguoiTuan: 500 }), phatQuy: g("phatQuy", { vaoNgay: 7, moiNguoi: 500, nguoiTuan: 500, tuan: 5000 }),
    doiPhe: g("doiPhe", { phi: 1000000 }), mucTieu: { phanBang: 0.4, ds: ["vuotAi", "tongKim", "satThu"], ...(B0.mucTieu || {}),
      loai: { vuotAi: { ten: "Vượt Ải", can: [1500, 2500], thuong: [400, 720] }, tongKim: { ten: "Tống Kim", can: [300, 500], thuong: [425, 765] }, satThu: { ten: "Sát thủ", can: [150, 250], thuong: [375, 675] }, ...((B0.mucTieu || {}).loai || {}) } } };
  const khao = `${L.khaoNgay} ngày phải có ${L.khaoNguoi ? `ít nhất <color=yellow>${L.khaoNguoi}<color>` : "đủ số"} người chơi khác nhau gia nhập (khác chủ tài khoản${L.khaoIp ? ", khác mạng" : ""} — nhiều nhân vật của một người chỉ tính một)`; // khaoIp 0: máy chủ không gộp theo IP
  const TRANG = {
    33: "Sau khi hội đủ các điều kiện bên dưới, ngươi có thể đến gặp ta (ở Ba Lăng huyện hoặc Biện Kinh) để thành lập bang hội." + [`Không thuộc bang hội nào (rời bang phải chờ đủ ${L.cho} giờ)`,
      `Đẳng cấp <color=yellow>${L.capLap}<color> trở lên`,
      L.tsLap ? `Lực thống soái <color=yellow>${L.tsLap}<color> trở lên (lên khi làm đội trưởng dẫn đội có người chơi khác cùng đánh quái)` : L.tsLap === 0 ? "" : "Lực thống soái đạt yêu cầu của máy chủ (nếu có)",
      "Tín vật bang chủ — chiến lợi phẩm Tống Kim: Nhạc Vương Kiếm (100 Nhạc Vương Hồn Thạch đổi được 1 thanh ở Quân Nhu quan Tống Kim; hoặc mua Nhạc Vương Kiếm lễ bao ở Kỳ Trân Các mở ra để nhận)",
      `Tiền: ${L.tien} vạn lượng mang theo người`].filter(Boolean).map((d, i) => `<enter>${i + 1}. ${d}`).join(""),
    // đợt 4: luật khu vực bang của máy chủ này (lộ phí Xa phu khu: luat().khuBang.xaPhu.gia, thiếu thì 800 như client tong_chefu.lua)
    34: `Khu vực riêng của bang hội: bang cấp 1 có bản riêng của <color=yellow>Khu vực bang hội chung<color>; từ cấp 2 bang chủ chọn một lãnh địa riêng (Kinh Sư hoặc Giang Nam — chọn 1 lần, muốn đổi nhờ quản trị). Mỗi bang một bản, chỉ thành viên bổn bang vào được. Vào bằng nút <color=yellow>Vào bang này<color> ở khung Bang phái hoặc Xa phu các thành → <color=yellow>Khu vực bang hội<color>. Trong khu có Tổng quản tác phường, Tế Tửu, Rương chứa đồ, Xa phu (ra bãi luyện công miễn phí, về Ba Lăng huyện / Biện Kinh ${fmtMoney(((luat().khuBang || {}).xaPhu || {}).gia ?? 800)}).`,
    35: "Bang chủ có thể bổ nhiệm trưởng lão và đội trưởng, số người tối đa theo cấp bang. Trưởng lão làm được các việc bang chủ giao ở trang Phân quyền (bổ nhiệm, đặt danh hiệu, trục xuất, cho thoái ẩn, sửa công cáo). Trưởng lão, đội trưởng có thể được đặt danh hiệu riêng (tối đa 12 chữ); đệ tử nam / nữ dùng danh hiệu chung của bang. Đội trưởng, đệ tử có thể thoái ẩn.",
    36: `Quỹ bang hội là một hệ thống chung, dùng để cất giữ tài sản chung của bang hội:<enter>1. <color=yellow>Ngân quỹ<color>: ngân lượng thành viên nạp vào (khung Bang phái → Chức năng → Gửi). Không rút ra được — chỉ dùng phát thưởng theo 3 bậc, chuyển sang ngân sách kiến thiết, đổi phe (${fmtSo(D2.doiPhe.phi / 10000)} vạn).` +
      `<enter>2. <color=yellow>Ngân sách kiến thiết<color>: mỗi 10 điểm giá trị hoạt động của thành viên bang thêm ${so1(D2.chia.kt * 10)} vạn; quyên góp 1 vạn lượng = 1 vạn kiến thiết + ${so1(D2.quyenCong)} điểm cống hiến (bang nhận tối đa ${fmtSo(D2.quyenTuan[0])}–${fmtSo(Math.max(...D2.quyenTuan))} vạn mỗi tuần theo cấp, mỗi người 1/3). Dùng để thăng đẳng cấp kiến thiết, lập / nâng cấp / mở lại tác phường.` +
      `<enter>3. <color=yellow>Ngân sách chiến bị<color>: mỗi 10 điểm giá trị hoạt động bang thêm ${so1(D2.chia.cb * 10)} vạn; mỗi người điểm danh Tế Đàn thêm ${so1(D2.teDan.cb)} vạn. Từ cấp 1 trả phí bảo trì mỗi ngày: ${so1(D2.baoTri.tv)} vạn × số người vào game trong ${D2.baoTri.hoatDong} ngày + phí tác phường. Dưới ${D2.baoTri.dung} ngày phí thì bang tạm dừng (tác phường, Tế Đàn ngưng); dưới ${D2.baoTri.tuBu} ngày phí thì tự bù từ kiến thiết (khi bật).` +
      `<enter>4. <color=yellow>Cống hiến dự trữ<color>: ${Math.round(D2.chia.duTru * 100)}% giá trị hoạt động của thành viên; bang chủ / trưởng lão được giao quyền phát cho thành viên (mỗi người tối đa ${fmtSo(D2.phatDu.nguoiTuan)} điểm mỗi tuần).`,
    37: `Ngươi có thể thông qua phương thức tiền thưởng để phân chia quỹ cho các thành viên bang hội: bang chủ (hoặc trưởng lão được giao quyền Ngân quỹ) phát ngân quỹ cho 3 cấp bậc trưởng lão, đội trưởng và bang chúng — mỗi người mỗi lần tối đa ${fmtSo(D2.phatQuy.moiNguoi)} vạn, mỗi người nhận tối đa ${fmtSo(D2.phatQuy.nguoiTuan)} vạn mỗi tuần, cả bang phát tối đa ${fmtSo(D2.phatQuy.tuan)} vạn mỗi tuần. Người nhận phải vào bang đủ ${D2.phatQuy.vaoNgay} ngày và là người khác với người phát. Cần mật khẩu cấp 2.` +
      `<enter>Cống hiến dự trữ cũng phát được cho thành viên đang trên mạng theo chức vụ, hoặc cho từng người (mỗi lần tối đa ${fmtSo(D2.phatDu.toiDaLan)} điểm, không phát cho chính mình).`,
    38: "Ngươi cũng có thể liên kết với các bang hội khác lập thành liên minh bang hội, trong mỗi liên minh cần phải có một bang hội minh chủ, có ít nhất một bang hội thành viên, và không vượt quá 7 bang hội thành viên." + sau,
    39: `Mục tiêu bang hội hàng tuần: mỗi thứ Hai, bang hội đã qua khảo nghiệm nhận 1 mục tiêu ngẫu nhiên. Điểm cống hiến thành viên kiếm từ đúng hoạt động đó được cộng vào mục tiêu; cả bang đạt khi tổng ≥ ${Math.round(D2.mucTieu.phanBang * 100)}% × số người × mức mỗi người. Tuần sau tới Tế Đàn lĩnh thưởng: mỗi người đủ phần mình (vào bang trước tuần đó) nhận điểm cống hiến + kinh nghiệm; bang chủ / trưởng lão được giao quyền lĩnh ngân sách chiến bị cho bang. Độ khó cấp 1 / 2 đặt ở Tế Đàn, có tác dụng từ tuần sau.` +
      D2.mucTieu.ds.map((k) => { const x = D2.mucTieu.loai[k]; return x ? `<enter>${x.ten}: mỗi người ${(x.can || []).map(fmtSo).join(" / ")} điểm — thưởng ${(x.thuong || []).map(fmtSo).join(" / ")} điểm cống hiến` : ""; }).join(""),
    40: !L.coKhao ? "Máy chủ này không có kỳ khảo nghiệm — lập xong là bang hội chính thức. Bang chủ chỉ tự giải tán được khi bang chỉ còn mình bang chủ (không trả Nhạc Vương Kiếm, tiền lập bang không trả); giải tán xong 30 phút sau mới lập / vào bang khác." : `Bang hội mới lập sẽ vào kỳ khảo nghiệm: trong ${khao}. Hết hạn mà chưa đủ thì bang hội giải tán, Nhạc Vương Kiếm trả lại cho người lập (tiền lập bang không trả lại). Hãy tạo tình đoàn kết giữa các anh em trong bang.`,
  };
  if (i === 32) return NPCD.choose("msgsel", "InfoText", noi("Đã trải qua biết bao nhiêu ân oán giang hồ, ngươi có phải là đã có một đám huynh đệ tỷ muội đồng cam cộng khổ? Ngươi có muốn lãnh đạo họ, cùng nhau tạo ra một môn võ công Vạn Thế Bất Diệt, cướp đoạt quyền sở hữu bảy thành trì, để cho họ có thể cùng nhau hưởng vinh hoa phú quý. Vậy thì hãy lập ra bang hội riêng cho mình, viết vào đó các ân oán tình thù, nhi nữ tình trường, cướp thuyền, đoạt thành, cướp boss~"),
    [["Thành lập bang hội", 33], ["Khu vực bang hội", 34], ["kết cấu tổ chức", 35], ["quỹ của bang hội", 36], ["lợi nhuận của bang hội", 37], ["Liên minh bang hội", 38], ["Mục tiêu bang hội hàng tuần", 39], ["bang hội giải tán", 40]]
      .map(([t, k]) => [t, () => bhTroGiup(n, k)]).concat([["Kết thúc đối thoại", null]]));
  NPCD.choose("msgsel", "InfoText", noi(TRANG[i] || ""), [["Trở về", () => bhTroGiup(n, 32)], ["Kết thúc đối thoại", null]]);
}
// lập bang (kingofkingsoft.lua): có Nhạc Vương Kiếm trong túi -> 6 câu (:23) -> hỏi 100 vạn (:37) -> khung Lập bang hội (CreateTong — windows.js moTaoBang) -> POST lap;
// chưa có kiếm -> "Ngươi có chuyện gì không vậy?" + Hỏi về việc thành lập bang hội (about_tong :13). Máy chủ kiểm lại mọi điều kiện + phải đứng gần NPC (npc-gan.js)
// quản trị (anh 14/11 "cho admin quyền tạo bang bỏ qua điều kiện"): thêm lựa chọn lập không cần điều kiện — mở khóa an toàn rồi mở khung Lập bang hội gửi qt: 1 (máy chủ
// kiểm lại: bang-hoi.js lap); thuong = đi đường của người chơi
function bhLapNpc(n, thuong) {
  const noi = (t) => richText(t, hero.name, n.name), L = bhLuat();
  if (bhMinhCur) return NPCD.talk([noi("Thành viên bang hội không thể lập thêm một bang hội khác! Muốn lập bang mới thì phải rời bang trước (bang chủ phải chuyển vị trước).")], 0, null);
  if (!thuong && Net.me && Net.me.admin) return NPCD.choose("msgsel", "InfoText", noi("Quản trị có thể lập bang hội <color=yellow>không cần điều kiện<color>: không cần cấp, thống soái, Nhạc Vương Kiếm, tiền — không nộp gì; bang chính thức thành lập ngay, không có thời kỳ khảo nghiệm."), [
    ["Lập bang hội (quản trị)", () => (KAT ? KAT.dam("Lập bang hội không cần điều kiện cần mở khóa an toàn") : Promise.resolve(true)).then((ok) => { if (ok && GW) GW.moTaoBang((j) => bhChucMung(n, j), 1); })],
    ["Lập như người chơi", () => bhLapNpc(n, 1)],
    ["Kết thúc đối thoại", null]]);
  const khao = !L.coKhao ? "bang hội lập xong được giang hồ thừa nhận ngay, không có 'Thời kỳ khảo nghiệm'." // khaoNgay 0 (cau-hinh.json): không khảo nghiệm
    : `trong ${L.khaoNgay} ngày phải tìm ${L.khaoNguoi ? `ít nhất ${L.khaoNguoi}` : "đủ"} người cùng chí hướng gia nhập, nếu không cũng chẳng có cách nào. ${L.khaoNgay} ngày đó có thể gọi là 'Thời kỳ khảo nghiệm'.`;
  const duNguoi = !L.coKhao ? "" : `Sau khi bang hội của ngươi được ${L.khaoNguoi ? `ít nhất ${L.khaoNguoi}` : "đủ"} người chơi khác nhau, trên giang hồ sẽ thừa nhận bang hội này. Nếu sau ${L.khaoNgay} ngày vẫn chưa đủ thì bang hội sẽ giải tán, Nhạc Vương kiếm trả lại cho ngươi.`;
  if (!(hero.bag || []).some((x) => x && x.k === "qk:195")) {
    const veLap = () => NPCD.talk(["Ngươi hỏi lập bang hội cần có những điều kiện gì? Để từ từ ta giải thích cho nghe!",
      `Phải là người không ở trong bất cứ bang hội nào, đẳng cấp ${L.capLap} trở lên${L.tsLap ? `, lực thống soái thấp nhất ${L.tsLap} điểm` : ""}!`,
      "Sau khi hội đủ những yêu cầu trên, ngươi có thể tham gia chiến trường Tống Kim lấy được cây Nhạc Vương kiếm (100 Nhạc Vương Hồn Thạch đổi ở Quân Nhu quan, hoặc mở Nhạc Vương Kiếm lễ bao mua ở Kỳ Trân Các) để làm tín vật bang chủ, sau đó đến gặp ta để lập bang hội",
      "Trước tiên ngươi phải có năng lực, " + khao, duNguoi,
      `Cuối cùng! Để lập được bang phái thì cần phải có số vốn lớn — ${L.tien} vạn lượng. Hãy nỗ lực đạt được mục tiêu nhé!`].filter(Boolean).map(noi), 0, null);
    return NPCD.choose("msgsel", "InfoText", noi("Ngươi có chuyện gì không vậy?"), [["Hỏi về việc thành lập bang hội", veLap], ["Không có việc gì", null]]);
  }
  NPCD.talk(["Cho hỏi ta làm sao có thể giống như ngài, lập bang phái và làm bang chủ?", "Trước tiên ngươi phải có năng lực, " + khao, duNguoi,
    "Sau khi ngươi có đủ năng lực lãnh đạo và uy tín giang hồ, thì tìm một vật phẩm đặc biệt để làm tín vật của chưởng môn. Ví dụ như tham gia Tống Kim lấy được Nhạc Vương kiếm",
    "Nhạc Vương kiếm? Ngài nói là cây kiếm này phải không?", "Hoá ra ngươi đã có nó! Không sai! Quả là tuổi trẻ tài cao!"].filter(Boolean).map(noi), 0, () => {
    NPCD.choose("msgsel", "InfoText", noi(`Bây giờ chỉ cần ngươi có thêm số vốn lớn là được, có thể là ${L.tien} vạn lượng`), [
      [`Không thành vấn đề, ta đã có đủ ${L.tien} vạn lượng rồi.`, () => {
        if (L.coTien && (hero.gold || 0) < L.tien * 10000) return NPCD.talk([noi("Dường như ngươi không có đủ tiền, như thế không ổn, đợi khi ngươi có đủ tiền thì đến tìm ta.")], 0, null);
        if (GW) GW.moTaoBang((j) => bhChucMung(n, j));
      }],
      ["Sao nhiều thế? ít lại một chút được không?", () => NPCD.talk([noi("Để duy trì bang hội hoạt động bình thường thì mất rất nhiều tiền, nếu ngươi còn ở đây trả giá thì ta e bang hội sẽ khó thành lập")], 0, null)]]);
  });
}
// lập xong (after_tong.lua — 3 câu chúc mừng; số người khảo nghiệm lấy ở bang vừa lập)
function bhChucMung(n, j) {
  if (!NPCD || !hero) return;
  const L = bhLuat(), k = j && j.bh && j.bh.khao, can = (k && k.can) || L.khaoNguoi, noi = (t) => richText(t, hero.name, n.name);
  NPCD.talk(["Chúc mừng hiệp khách thành lập bang hội, hãy thực hiện hoài bão của bản thân đi!",
    !k ? "Bổn bang đã được giang hồ thừa nhận — hãy mau chiêu mộ huynh đệ cùng chí hướng!" : `Nhưng cũng cần nhắc thêm một chút: Ngươi phải có năng lực lãnh đạo và uy tín giang hồ. Trong vòng ${L.khaoNgay} ngày phải tìm được ${can ? can + " người" : "đủ người"} cùng chí hướng giúp đỡ. Nếu không trên giang hồ sẽ không thừa nhận bang hội của ngươi. Thời hạn ${L.khaoNgay} ngày có thể xem là 'Thời kỳ khảo nghiệm'`,
    "Mở khung Bang phái (nút Bang phái ở thanh dưới) để viết tin chiêu mộ, duyệt đơn xin gia nhập; mời người vào bang: Ctrl + chuột phải vào người chơi (điện thoại: giữ lâu) → Mời vào bang."].map(noi), 0, null);
}
// xem trang bị người chơi ở gần (anh 03/11 "thêm tính năng xem trang bị người ở gần" — may-chu/api.js xemDo: cùng bãi + cùng bản): khung Trang bị
// chỉ xem như Soi đồ của quản trị (windows.js soiDo — trỏ / chạm ô đồ xem chi tiết tính theo chính người đó)
function xemTrangBi(ten) {
  if (!hero || !GW) return;
  // anh 17/11 (mẫu B — thẻ Thuộc tính): nhãn bang trên đầu (máy chủ cũ chưa gửi bang) + chỗ đứng "Bãi (X/Y)" lúc bấm xem
  const o = world && world.others.get(ten), mm = P.hud.mmMap, xy = o && mm && mm.toClient ? mm.toClient(o.x, o.y) : null;
  const them = { bh: o && o.bh, noi: world ? `${world.zone.n}${xy ? ` (${xy[0]}/${xy[1]})` : ""}` : "" };
  Net.xemDo(hero.slot | 0, ten).then((j) => GW.soiDo(j.nv, them)).catch((e) => { if (e.ma !== "het-phien") P.hud.msg(e.message); });
}
// ---------- chợ trời (anh 02/11 — may-chu/cho-troi.js, src/game/chotroi.js: sạp Rao bán kiểu client + bảng Chợ Trời) ----------
// Sạp đang mở ở bãi (nhịp gửi khi đổi — choV): chủ sạp ngồi đúng chỗ sạp (≤ SAP_GAN) -> bảng hiệu trên đầu chủ (World.bangHieu); chủ vắng (đi luyện
// công, thoát game, đứng dậy đi chỗ khác) -> NPC trông sạp ở chỗ đó, bảng hiệu trên đầu NPC — không bao giờ 2 người giống nhau. Hình NPC: 1 trong 3
// hình bán hàng của client (anh: "1-2-3 random, không nhất thiết giống nhau" — máy chủ bốc s.hinh lúc mở sạp, mọi máy cùng 1 hình)
const SAP_HINH = ["passerby063_3", "passerby072_2", "passerby074_4"]; // thảm hàng · bàn hàng · ngồi chiếu
// câu báo người bán (lúc vắng mặt, máy chủ giữ trong nhân vật — nhịp đầu tiên sau khi vào game có thể tới trước khi khung chat dựng xong): chờ khung chat
function baoChoTin(t, lan = 0) { if (P.hud.el) P.hud.msg(t, MAU_TIN.tien); else if (lan < 60) setTimeout(() => baoChoTin(t, lan + 1), 500); }
const SAP_GAN = 40;
let sapLuc = 0;
function choLam(b) {
  if (!hero) return Promise.resolve(null);
  return Net.cho(hero.slot | 0, b).then((j) => {
    applyServer(j);
    if (j.msg) P.hud.msg(j.msg);
    for (const t of j.bao || []) P.hud.msg(t);
    return j;
  }).catch((e) => { if (e.ma !== "het-phien" && !e.boQua) P.hud.msg(e.message); return null; });
}
// nút Rao bán (ô đánh dấu của Hành trang): mở sạp ở chỗ đang đứng rồi ngồi xuống / đóng sạp. Như client: đang cưỡi ngựa không bày bán được
function moSap(on) {
  const w = world; if (!w || !hero) return Promise.resolve(null);
  if (on && w.riding()) { P.hud.msg("Trong lúc cỡi ngựa hoặc đang giao dịch với tổ đội không thể sắp đặt!"); return Promise.resolve(null); }
  if (on && w.zone.bang) { P.hud.msg("Khu vực bang hội không được bày bán — hãy tới thôn / thành"); return Promise.resolve(null); } // đợt 4: sạp theo mã bãi — chung mọi bản bang
  if (on && laLd(w.zone)) { P.hud.msg("Trong lôi đài không được bày bán — hãy tới thôn / thành"); return Promise.resolve(null); } // lôi đài (anh 15/11)
  const p = w.player;
  if (on && npcSat(w, p.x, p.y, SAP_CACH).length) { P.hud.msg("Chỗ này sát NPC — dời ra xa một chút rồi bày bán"); return Promise.resolve(null); }
  return choLam({ viec: "mo", on: on ? 1 : 0, bai: w.zone.id, x: Math.round(p.x), y: Math.round(p.y) }).then((j) => {
    if (j && on && world === w) { p.path = null; p.goal = null; w.sit(true); }
    if (j) { choV.v = 0; sapLuc = 0; } // danh sách sạp của bãi: hỏi lại ở nhịp kế tiếp
    return j;
  });
}
// danh sách sạp vừa nhận
function sapNhan(w, ds) { w.sapDs = ds || []; sapTick(true); }
// sạp đang mở của người tên ten ở bãi đang đứng | null
const sapCuaTen = (ten) => (world && world.sapDs && world.sapDs.find((s) => s.ten === ten)) || null;
// Rương Thần Bí (anh 03/11 — may-chu/ruong-tb.js): máy chủ gửi rương đang có [[mã, bãi, x, y]] (kênh tức thời "rtb" + nhịp); rương của bãi đang
// đứng thành NPC "Rương Thần Bí" (hình RUONG_HINH — Bảo rương đóng nắp của client, spr\obj\box\box002.spr) như NPC trông sạp: bấm (điện thoại: nút
// "Mở rương" — dienthoai.js) -> đi tới -> moRuongTb; đổi bãi thì loadZone dựng lại (ruongDat)
const RUONG_HINH = "passerby202";
let ruongDs = [];
function ruongNhan(ds) { ruongDs = Array.isArray(ds) ? ds : []; ruongDat(); }
function ruongDat() {
  const w = world; if (!w) return;
  const co = new Set();
  for (const [id, bai, x, y] of ruongDs) {
    if (bai !== w.zone.id) continue;
    co.add(id);
    if (!w.npcs.some((q) => q.rtb === id)) { w.npcs.push({ t: Math.random() * 2, dir: 4, kind: "npc", role: "talk", rtb: id, type: RUONG_HINH, name: "Rương Thần Bí", x, y }); P.npc.ensure(RUONG_HINH, "stand1").catch(() => {}); }
  }
  if (w.npcs.some((q) => q.rtb && !co.has(q.rtb))) w.npcs = w.npcs.filter((q) => !q.rtb || co.has(q.rtb));
}
function moRuongTb(id) {
  if (!hero) return;
  Net.ruongTb(hero.slot | 0, id).then((j) => { applyServer(j); if (j.msg) P.hud.msg(j.msg, MAU_TIN.tien); if (GW) GW.refresh(true); })
    .catch((e) => { if (e.ma !== "het-phien") P.hud.canh(e.message); });
}
// sạp không đứng đè NPC thật (anh 10/11 "sạp của người khác đè lên NPC Dã Tẩu"): NPC trông sạp dạt ra vòng SAP_CACH quanh NPC gần nhất, về phía sạp đang đứng, chỗ đi được không sát NPC khác;
// bày sạp mới sát NPC thì không cho (moSap). Chủ sạp ngồi ở chỗ cũ vẫn là chỗ cũ (bấm NPC thật luôn trước — mouseAct)
const SAP_CACH = 110;
const npcSat = (w, x, y, r) => w.npcs.filter((q) => !q.sap && q.role !== "dummy" && ldist(q.x, q.y, x, y) < r);
function sapDat(w, x, y) {
  const L = npcSat(w, x, y, SAP_CACH).sort((a, b) => ldist(a.x, a.y, x, y) - ldist(b.x, b.y, x, y));
  if (!L.length) return [x, y];
  const g = L[0], a0 = Math.atan2((y - g.y) * 2, x - g.x);
  for (let i = 0; i < 16; i++) {
    const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8), X = g.x + Math.cos(a) * SAP_CACH, Y = g.y + (Math.sin(a) * SAP_CACH) / 2;
    if (w.map.walkable(X, Y) && !npcSat(w, X, Y, SAP_CACH * 0.9).length) return [X, Y];
  }
  return [x, y];
}
// chủ sạp đang ngồi đúng chỗ sạp: bảng hiệu trên đầu chủ, không có NPC trông sạp
function sapTick(ngay) {
  const w = world, t = performance.now();
  if (!w || !w.sapDs || (!ngay && t - sapLuc < 300)) return;
  sapLuc = t;
  const bang = new Map(), giu = new Set();
  for (const s of w.sapDs) {
    const minh = s.ten === hero.name, chu = minh ? w.player : w.others.get(s.ten);
    if (chu && (minh ? chu.sit : chu.act === "sit") && ldist(chu.x, chu.y, s.x, s.y) <= SAP_GAN) { bang.set(s.ten, s.qc); continue; }
    giu.add(s.k);
    let n = w.npcs.find((q) => q.sap === s.k);
    if (!n) { n = { t: Math.random() * 2, dir: 4, kind: "npc", role: "talk", sap: s.k, type: SAP_HINH[(s.hinh | 0) % SAP_HINH.length], x: s.x, y: s.y }; w.npcs.push(n); P.npc.ensure(n.type, "stand1").catch(() => {}); }
    if (n.gx !== s.x || n.gy !== s.y) { const [X, Y] = sapDat(w, s.x, s.y); Object.assign(n, { gx: s.x, gy: s.y, x: X, y: Y }); } // sạp đè NPC thật: dạt ra
    Object.assign(n, { name: `Sạp của ${s.ten}`, qc: s.qc });
  }
  if (w.npcs.some((q) => q.sap && !giu.has(q.sap))) w.npcs = w.npcs.filter((q) => !q.sap || giu.has(q.sap));
  w.bangHieu = bang;
}
function doiTick() {
  const w = world, D = hero.auto.doi, t = performance.now();
  if (!w || !w.auto || !D.tuMoi || t - doiLuc < 3000 || (w.pk && w.pk())) return; // thẻ PK (trận Tống Kim): không tự mời (anh 06/11)
  doiLuc = t;
  if (doiTt && (doiTt.truong !== hero.name || doiTt.tv.length >= (doiTt.toiDa || 8))) return; // đội viên không mời được; đội đủ người theo sức thống soái
  // thôn / thành (anh 02/11 "không tự mời pt người trong thành / thôn"): mình đứng trong khu an toàn (bản đồ chưa có khu an toàn: cả thôn / thành)
  // thì không tự mời; ở ngoài cổng (vd đánh boss thế giới) chỉ mời người cũng đứng ngoài. Mời bằng tay (menu người chơi) vẫn được
  const thanh = TOWN_KINDS.has(w.zone.kind);
  if (thanh && (!w.map.anBits || w.player.an)) return;
  const p = w.player, trong = new Set((doiTt ? doiTt.tv : []).map((x) => x.ten)), xa = (e) => ldist(p.x, p.y, e.x, e.y);
  const o = [...w.others.values()].filter((e) => !trong.has(e.name) && xa(e) <= DOI_GAN && t - (moiLuc.get(e.name) ?? -1e9) > 60000 && !(thanh && w.map.an(e.x, e.y))).sort((a, b) => xa(a) - xa(b))[0];
  if (!o) return;
  moiLuc.set(o.name, t);
  doiLam({ viec: "moi", ten: o.name, tu: 1 }, true); // tu: Trợ Thủ tự mời — tới cả người đã có đội, máy họ chỉ hiện biểu tượng (anh 06/11 chiều: "vẫn sẽ hiện chứ không phải chặn")
}
// Trợ Thủ theo sau / đánh cùng mục tiêu (đang tự đánh): người đang theo (doi.theo.ten, "" = đội trưởng) cùng bãi -> { theo: 1, x, y }; đội
// trưởng đang đánh -> + tx, ty (chỗ con đội trưởng đang nhắm — mốc nhịp của người đó) + uid (mã con đó ở bãi quái chung / Vượt Ải — anh 02/11:
// World đánh đúng con đó); bãi quái riêng: World đánh con gần chỗ đó nhất
function theoCua(w) {
  const D = hero && hero.auto && hero.auto.doi;
  if (!D || !w.auto || !(D.theo.on || D.cungMuc) || (w.pk && w.pk())) return null; // thẻ PK: không theo đội (anh 06/11)
  const truong = doiTt && doiTt.truong !== hero.name ? doiTt.truong : null;
  const o = D.theo.on ? w.others.get(D.theo.ten || truong || "") : null, L = D.cungMuc && truong ? w.others.get(truong) : null;
  if (!o && !L) return null;
  const b = L && L.buf[L.buf.length - 1], muc = !!b && b.fight && b.tx != null;
  return { ...(o ? { theo: 1, x: o.x, y: o.y } : { x: L.x, y: L.y }), ...(L ? { cung: 1 } : {}), ...(muc ? { tx: b.tx, ty: b.ty, ...(b.uid ? { uid: b.uid } : {}) } : {}) };
}
// độ sáng (thanh trượt Tùy chọn): 50 = gốc
function applyBright() { cv.style.filter = P.settings.bright === 50 ? "" : `brightness(${(0.5 + P.settings.bright / 100).toFixed(2)})`; }
// công cụ thử (src/game/devtool.js) — máy chạy máy chủ (localhost) hoặc tài khoản quản trị đăng nhập ở máy nào cũng được (anh muốn 26/10:
// vào bằng máy khác qua Internet vẫn thử được). Ghi cấp / tiền / đồ lên máy chủ: máy chủ chỉ nhận từ tài khoản quản trị (/api/quan-tri/nv)
const devOn = () => DEV_ON || !!(Net.me && Net.me.admin);
const dev = new DevTool({
  // khoa: khóa an toàn (anh 18/11 — "Một đòn chết" cần trang đã mở khóa: máy chủ bao-mat.js qtMo mới bỏ hạn mức sát thương quái máu chung)
  // khoa: hỏi trạng thái khóa an toàn mới nhất ở máy chủ trước (máy chủ khởi động lại thì trang đã mở cũng thành khóa — anh 18/11 một đòn chết) rồi mới hỏi mật khẩu nếu cần
  P, khoa: (viec) => (KAT ? Net.baoMat({ viec: "xem" }).then((r) => KAT.capNhat(r)).catch(() => {}).then(() => KAT.dam(viec)) : Promise.resolve(true)), world: () => world, hero: () => hero, save: devSave, luyenMax: (m) => (hero && Net.me && Net.me.admin ? Net.devSync(hero.slot | 0, { skLuyen: m }).then(applyServer).catch((e) => { if (e.ma !== "het-phien") P.hud.msg("Công cụ thử: " + e.message); }) : null), // chiêu luyện 90 / 120 / 150 lên tối đa (anh 17/11)
  // anh 18/11 "toool dev tab bản đồ k dùng dc, bị mất r": ghi chú // ở dòng trên (17/11) từng nuốt mất gotoZone / zones / snapCam / msg -> tab Bản đồ hỏng, nút báo chữ lỗi.
  // zones: devZones — mọi bản đồ thường (thành / thôn gồm Biện Kinh, Ba Lăng, bãi chính / phụ, bờ Bắc Phong Lăng Độ, đảo) thay vì chỉ bãi chính
  gotoZone, zones: devZones, snapCam, msg: (t) => P.hud.msg(t),
  applyLooks: () => world && world.applyLooks(),
  // đổi phái thử võ công: danh sách chiêu đang hiện + làm mới / mở bảng Võ công (cửa sổ dựng khi vào game)
  skillList: () => (GW ? GW._skillList(hero) : []), refreshWin: () => GW && GW.refresh(true), openSkills: () => GW && (P.win.get("skills").show(), GW.refresh(true)),
  // ủy thác (thẻ Ủy thác): b = { gio, bai, boCap } -> máy chủ cày thay ngay (bảng tổng kết như lúc vào lại game); { xem: 1 } = trạng thái
  uyThac: (b) => Net.devUyThac(hero.slot | 0, b).then((j) => { applyServer(j); if (j.uyThac) baoUyThac(j.uyThac); else if (!b.xem) P.hud.msg("Không ủy thác được (bãi không còn / chưa đủ cấp / hết giờ trong ngày)"); return j.trangThai; }),
  farmZones: () => P.maps.zones.filter((z) => FARM_KINDS.has(z.kind) && !z.chiThuyen),
  // thẻ Phong Lăng Độ / Dã Tẩu (anh 27/10): hd "pld" | "dt" -> máy chủ (tài khoản quản trị) rồi xử lý như hội thoại NPC; trả trạng thái (dev)
  hoatDong: (hd, b) => Net.devHoatDong(hero.slot | 0, { hd, ...b }).then((j) => (hd === "dt" ? xuLyDaTau(j) : hd === "st" ? xuLySatThu(j) : hd === "va" ? xuLyVa(j) : hd === "vd" ? (ViemDe.xuLy(j), j)
    : hd === "onl" || hd === "pd" ? (applyServer(j), (j.tin || []).forEach((t) => P.hud.msg(t.replace(/<color=?\w*>/g, ""))), j) : xuLyPld(j)).dev),
  pldLich: () => pldLich, laThuyen: () => !!world && laThuyen(world.zone), vaSong: () => (world && laAi(world.zone) ? world.mobs.filter((m) => m.va && m.alive).length : null),
  // thẻ Boss TG (boss thế giới máu chung — anh 31/10): gọi / hủy (tài khoản quản trị), chỗ mình đứng (bãi + tọa độ bản đồ nhỏ), danh sách boss
  bossTg: (b) => Net.call("POST", "boss-tg", b).then((j) => { if (j && "dsBoss" in j) BossTG.capNhat(j.dsBoss); else if (j && "b" in j) BossTG.capNhat(j.b); return j; }),
  viTri: () => { const p = world.player, c = P.hud.mmMap && P.hud.mmMap.toClient ? P.hud.mmMap.toClient(p.x, p.y) : [0, 0]; return { bai: world.zone.id, x: Math.round(p.x), y: Math.round(p.y), X: c[0], Y: c[1] }; },
  bossDs: () => (P.bossTg && P.bossTg.ds ? P.bossTg.ds.map((b) => [b.tpl, b.ten]) : []), bossTt: () => BossTG.b,
  // Săn Nhím Béo Phì (anh 03/11 — may-chu/san-nhim.js): mở / hủy đợt (tài khoản quản trị); nhimQuanh(n) = n chỗ đi được quanh mình [[bãi, x, y]]
  sanNhim: (b) => Net.call("POST", "san-nhim", b).then((j) => { if (j && "s" in j) SanNhim.capNhat(j.s); return j; }), nhimTt: () => SanNhim.s,
  // Phong Hỏa Liên Thành (anh 04/11 — may-chu/phong-hoa.js): mở / kết thúc / hủy trận (tài khoản quản trị); lịch trận
  // Tống Kim bãi thử (anh 05/11): mở phòng ở bãi đang đứng — doanh Tống / Kim cách chỗ mình 700 điểm sang trái / phải (ô đi được gần nhất)
  tongKim: (b) => Net.tongKimQt(b), tkTt: () => TongKim.tomTat(),
  tkVao: () => tongKimNpc({ viec: "mo" }, { name: "Mộ binh quan" }), // trận thật: hội thoại Mộ binh quan ở bất kỳ đâu (thử báo danh / vào lại)
  tkMo: (o) => {
    const w = world; if (!w) return Promise.reject(new Error("Chưa vào game"));
    const trai = TongKim.chonDoanh(w); // 2 bên chỗ mình đứng, trong bản đồ, cách nhau đủ xa (tongkim.js)
    if (!trai) return Promise.reject(new Error("Bãi này không đủ chỗ đặt 2 doanh trại — sang bãi rộng hơn"));
    return Net.tongKimQt({ viec: "mo", bai: w.zone.id, trai, ...o });
  },
  // Lôi đài trận thử với bot (anh 16/11 — THIET-KE-LOI-DAI.md mục 6, chỉ quản trị — may-chu/loi-dai.js thu): b = { viec "mo" (che, ben, doiThu, dongDoi, cap, chuanBi,
  // thiDau) | "huy" }; vao -> vào sân như qua Công Bình Tử (ldVaoTran). Não + máu bot chạy ở máy này (loidai.js)
  ldThu: (b) => Net.loiDaiQt({ o: hero ? hero.slot | 0 : 0, ...b }).then((j) => { applyServer(j); if (j && j.vao) ldVaoTran(j.vao); return j; }),
  // đua ngựa — lượt thử (anh 16/11, chỉ quản trị — may-chu/dua-ngua.js thu): mở (tự báo danh mình, vào thẳng vạch xuất phát), bot, xuất phát, thả hộp, cho đạo cụ, tới mốc…
  dnThu: (b) => Net.duaNguaQt({ o: hero ? hero.slot | 0 : 0, ...b }).then((j) => { dnApply(j); return j; }), dnTt: () => DuaNgua.s,
  phongHoa: (b) => Net.phongHoaQt(b).then((j) => { if (j && j.s) PhongHoa.lich = j.s; return j; }), phTt: () => (PhongHoa.p && PhongHoa.p.u ? PhongHoa.p : PhongHoa.lich), phVao: () => phVao(),
  nhimQuanh: (n) => { const p = world.player, L = []; for (let i = 0; i < n; i++) { const c = world.spotNear(p.x, p.y, 160, 380); if (c) L.push([world.zone.id, Math.round(c[0]), Math.round(c[1])]); } return L; },
});
// bảng quản trị (src/game/quantri.js — anh 28/10): tài khoản quản trị, phím F10 — người chơi, khóa / đá, gửi quà, thông báo, nhật ký
const qt = new QuanTri({
  me: () => Net.me, msg: (t) => P.hud.msg(t),
  // khóa an toàn (anh 10/11): mở bảng phải mở khóa mật khẩu cấp 2 trước (chưa có thì đặt); Đổi mật khẩu của tôi -> khung Đổi mật khẩu đăng nhập
  khoa: (viec) => (KAT ? KAT.dam(viec) : Promise.resolve(true)), doiMk1: () => KAT && KAT.doiMk1(),
  khoaLai: (ma) => KAT && KAT.capNhat({ co: ma === "can-mk2" ? 1 : 0, mo: 0 }), // bảng gọi ngầm gặp can-mk2 (máy chủ khởi động lại / Khóa lại): trang đã khóa
  hoi: (html, ok, huy) => (GW ? GW.hoi(html, ok, huy) : Promise.resolve(false)),
  factions: () => P.factions || [], skill: (id) => (P.skillDb || {})[id] || null, // skill: tên chiêu cho thẻ Cấu hình → Kỹ năng phái
  facName: (fac, series) => (fac == null ? `Vô Môn Phái (${["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"][series | 0]})` : (P.factions.find((x) => x.id === fac) || {}).n || String(fac)),
  soiDo: (nv) => GW && GW.soiDo(nv),
  // dịch chuyển tới chỗ người chơi (anh 10/11 — bảng quản trị "Dịch chuyển tới"): sang bãi đó (cả bản quái chung) đứng đúng chỗ người đó
  toi: (z, x, y, chung) => { const Z = P.maps.zones.find((q) => q.id === z); if (!Z) return P.hud.msg("Không tìm thấy bãi của người chơi đó"); gotoZone(Z, { at: [x, y], ...(chung ? { chung: true } : {}) }).catch((e) => P.hud.msg(e.message || String(e))); },
  // nhật ký: trỏ tên món -> ô xem món (quantri.js monChu) như món trong túi của nhân vật không mặc gì — không hiện ô so với đồ quản trị đang mặc
  tipMon: (it, e) => GW && hero && GW._showTip(it, e, undefined, undefined, undefined, { ...hero, equip: {}, ten: "nhật ký", o: -1 }), anTip: () => GW && GW._hideTip(),
});
// ---------- phím tắt: bảng của client (ui\autoexec.lua -> hud.json hotkeys; src/game/hotkeys.js) ----------
// Game thêm (client không có): Space tự đánh, Ctrl+M tắt tiếng; máy dev: ` công cụ thử (client gắn ` cho Chiến báo — game chưa có).
const OPEN_BTN = { status: "Status", items: "Items", skills: "Skills", friend: "Friend", team: "Team", Tong: "Faction", ChatRoomList: "ChatRoom", ItemEx: "ItemEx", tasknote: "Task", NewTask: "Task" };
const OPEN_VI = { battlereport: "Chiến báo", battlestart: "Chiến trường", battlerecord: "Chiến tích", battlerank: "Xếp hạng chiến trường", equipupgrade: "Nâng cấp trang bị",
  PlayerNpc: "Ẩn / hiện NPC", MissleSame: "Hiệu ứng võ công", VisiblePlayer: "Ẩn / hiện người chơi", Chara: "Xem nhân vật người khác", Item: "Xem đồ người khác",
  Skill: "Xem võ công người khác", Talk: "Mật đàm", Attack: "Tấn công người chơi", Follow: "Đi theo", Call: "Gọi", Select: "Chọn người chơi", BossFightReport: "Chiến báo trùm" };
const SWITCH_BTN = { horse: "Horse", sit: "Sit", trade: "Exchange", pk: "PK" };
const ZOOMS = [1, 1.25, 1.5, 1.75, 2];
let keys = null, zoom = 1, lastTodo = {};
const todoMsg = (k, t) => { const now = performance.now(); if (now - (lastTodo[k] || 0) > 3000) { lastTodo[k] = now; P.hud.msg(t); } };
// F1 / Esc → Giúp đỡ (anh 29/10 "bấm vào khá rối, thiết kế lại cho thân thiện"): khung HỖ TRỢ của client (windows.js openGiupDo, nội dung
// src/game/giupdo.js) — bản trước in 4 dòng phím tắt vào khung chat
function showHelp() { if (GW) GW.openGiupDo(); }
// tin cập nhật (assets/data/tin-cap-nhat.json — Esc → Tin cập nhật, anh 29/10): id tin mới nhất đã xem lưu theo nhân vật (hero.auto.tinXem — save)
const tinChuaXem = () => (P.tin || []).filter((t) => (t.id | 0) > ((hero && hero.auto && hero.auto.tinXem) | 0));
function daXemTin() {
  const m = Math.max(0, ...(P.tin || []).map((t) => t.id | 0));
  if (hero && hero.auto && (hero.auto.tinXem | 0) < m) { hero.auto.tinXem = m; save(); }
  if (GW) GW.datTinMoi(false);
}
const keyAct = {
  open(n, key) {
    if (n === "options") return P.win.get("options").toggle();
    if (n === "help") return showHelp();
    if (n === "map") return P.hud._mmButton("SwitchBtn"); // client: bản đồ lớn — game có bản đồ nhỏ phóng ×2
    if (n === "FullScreen") return document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    if (OPEN_BTN[n]) return GW.toggle(OPEN_BTN[n]);
    todoMsg(key, `${key}: ${OPEN_VI[n] || n} — chưa có`);
  },
  toggle(n, key) {
    if (SWITCH_BTN[n]) return $(`#jxhud [data-k="${SWITCH_BTN[n]}"]`).click(); // như bấm nút thanh dưới
    if (n === "showplayername" || n === "showplayerlife") {
      const k = n === "showplayername" ? "showName" : "showLife";
      P.settings[k] = !P.settings[k]; saveSettings();
      return P.hud.msg(`${k === "showName" ? "Hiện tên nhân vật" : "Hiện thanh máu"}: ${P.settings[k] ? "Bật" : "Tắt"}`);
    }
    if (n === "run") return todoMsg(key, `${key}: nhân vật luôn chạy (đã bỏ đi bộ)`);
    todoMsg(key, `${key}: ${n} — chưa có`);
  },
  focusChat: () => $("#jxhud .jx-input").focus(),
  clearChat: () => P.hud.clearChat(),
  skill() {}, // ShortcutSkill (Q W E…): anh bỏ 25/10 — chiêu đặt vào thanh dùng nhanh 1–9
  useItem: (i) => quickUse(i, false, true),
  phrase(i) { const t = (P.hud.M.phrases || [])[i]; if (t) P.hud.chat(P.hud.channel, hero.name, t, true); },
  // số khóa: đi 1 đoạn theo hướng (client MoveTo: 8 hướng, 0 = xuống, theo chiều kim đồng hồ như src/dir.js)
  move(d) { const p = world.player, a = (d * Math.PI) / 4, R = 160; world.clickGround(p.x - Math.sin(a) * R, p.y + (Math.cos(a) * R) / 2); },
  turn(s) { const p = world.player; if (p.act === "stand" || p.act === "sit") p.dir = (p.dir + s + 8) % 8; },
  zoom(s) { const i = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + s)); if (ZOOMS[i] !== zoom) { zoom = ZOOMS[i]; snapCam(); P.hud.msg(`Phóng cảnh ×${zoom}`); } },
  exit: () => leaveGame(),
  // client chụp cả màn hình; game lưu cảnh (canvas) — giao diện là lớp trang web riêng, không nằm trong ảnh
  screenshot() {
    const d = new Date(), z = (n) => String(n).padStart(2, "0"), name = `VLIdle_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.png`;
    cv.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); P.hud.msg("Chụp cảnh: " + name); });
  },
  todo: (t) => todoMsg(t, t),
};
// khongDi === true: bật từ mã (Trợ Thủ, tự làm nhiệm vụ) đã tự lo đường đi; người chơi bấm Space / nút Tự đánh: trong thành thì tự về bãi (tuVeBai)
function toggleAuto(khongDi) {
  // lôi đài (anh 15/11 D9 "Trợ Thủ mất tác dụng trong sân: đánh tay 100%"): không bật được (Space, nút Tự đánh, Ủy thác, Trợ Thủ…); đang bật thì vẫn cho tắt
  if (world && laLd(world.zone) && !world.auto) { P.hud.setAuto(false); return P.hud.canh("Lôi đài: Trợ Thủ không hoạt động trong sân — đánh tay"); }
  if (world && laDn(world.zone) && !world.auto) { P.hud.setAuto(false); return P.hud.canh("Đường đua: Trợ Thủ không hoạt động — tự chạy bằng chuột / bản đồ nhỏ"); } // đua ngựa (anh 16/11)
  world.auto = !world.auto;
  if (world.auto) { world.neo = [world.player.x, world.player.y]; world.tamDung = false; }
  P.hud.setAuto(world.auto); P.hud.msg("Tự đánh: " + (world.auto ? "Bật" : "Tắt")); P.audio.ui("click");
  if (khongDi === true) return;
  if (world.auto) tuVeBai(); else if (diXe && TOWN_KINDS.has(world.zone.kind)) { diXe = null; world.holdMove = false; world.player.goal = null; world.player.path = null; } // tắt giữa đường tới Xa phu: đứng lại
}
// bấm Tự đánh trong thôn / thành (anh 10/11: "tự đánh trong thành sẽ tiếp tục đánh theo cái auto đã chọn, đang ở bãi thì phải tự chạy lên bãi, hoặc tiếp tục công việc dang dở"):
// Trợ Thủ treo máy đang bật -> như nút Bắt đầu treo máy (bán / mua rồi đi); không thì tới Xa phu về bãi vừa đánh, chưa có bãi thì bãi vào được cao nhất (người mới cấp 1: Dược Vương
// Cốc). Giữ nguyên: đang có việc dở (Trợ Thủ về thành, đi xe, đi boss, tự làm nhiệm vụ), boss thế giới / nhím đứng gần, đứng ngay chỗ mộc nhân (bấm tự đánh để thử chiêu — vùng hiện bảng đo sát thương của mocnhan.js)
const MOC_GAN = 220;
function tuVeBai(boMoc) { // boMoc: đi luôn dù đứng cạnh mộc nhân (Ủy thác → Ra bãi rồi tự ủy thác — utRaBai)
  const w = world, p = w.player;
  if (!TOWN_KINDS.has(w.zone.kind) || w.zone.id === TK_BD.z || !xaPhuNpc(w) || zoneLoad || p.hp <= 0 || thanh || diXe || bossDi || TuLam.dang || w.bossGan(false) || w.nhimGan(false)) return; // điểm báo danh Tống Kim: không kéo người đang chờ trận đi
  if (!boMoc && w.mobs.some((m) => m.dummy && !m.coc && Math.hypot(m.x - p.x, m.y - p.y) < MOC_GAN)) return P.hud.msg("Đang đứng cạnh mộc nhân: đánh mộc nhân để thử chiêu, không có kinh nghiệm");
  const T = hero.auto.treo, zt = T.on && T.bai != null && P.maps.zones.find((x) => x.id === T.bai);
  if (zt && moBai(zt)) return treoStart();
  const b = baiTreo(), z = b && P.maps.zones.find((x) => x.id === b.z);
  if (!z) return;
  P.hud.msg(`Tự đánh: đi Xa phu ra ${z.n}${b.c ? " (quái chung)" : ""}`);
  diXe = { z: b.z, t0: 0, c: b.c };
}
// tắt / bật tiếng — nhớ ở máy (P.settings.muted — anh 30/10 lần 2 "nhớ kĩ cài đặt game như tắt tiếng, lần sau vào phải giữ nguyên"; bản trước
// vào lại là có tiếng)
function toggleSound() { const m = !P.audio.muted; P.audio.setMuted(m); P.settings.muted = m; saveSettings(); P.hud.msg("Âm thanh: " + (m ? "Tắt" : "Bật")); }
addEventListener("keydown", (e) => {
  if (LOADING.on) { e.preventDefault(); return; } // đang chuyển bản đồ: chặn phím (màn chờ đã chặn chuột)
  if (!world || !keys || document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;
  const plain = !e.ctrlKey && !e.altKey && !e.shiftKey;
  if (e.code === "Space" && plain) { e.preventDefault(); return toggleAuto(); }
  if (e.code === "KeyM" && e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); return toggleSound(); }
  if (e.code === "Backquote" && plain && devOn()) { e.preventDefault(); return dev.toggle(); }
  if (e.code === "F10" && plain && Net.me && Net.me.admin) { e.preventDefault(); return qt.toggle(); } // bảng quản trị (F9 = PK như client)
  if (e.code === "KeyK" && plain && TT) { e.preventDefault(); return TT.toggle(); } // Trợ Thủ (game thêm — phím K client để trống)
  if (e.code === "Escape" && plain && GW) { e.preventDefault(); return GW.esc(); } // client Open([[system]]): đóng cửa sổ trên cùng, không còn thì bảng hệ thống
  if (e.code === "PrintScreen") return; // Windows chỉ gửi keyup cho PrintScreen
  keys.handle(e);
});
addEventListener("keyup", (e) => { if (world && e.code === "PrintScreen" && document.activeElement.tagName !== "INPUT") keyAct.screenshot(); });

// ---------- khung nhìn ----------
let vw = 0, vh = 0, dpr = 1;
// tỉ lệ vẽ rs (anh 06/11 Tống Kim "20 bot, 40 bot fps vẫn tụt" — máy Intel UHD 770: game chỉ tốn ~10 ms / khung mà mỗi khung 30–60 ms, trình duyệt chỉ cho
// 23 lần / giây -> card đồ họa tô không kịp ~1,7 triệu điểm ảnh đầy nhà trại, bot, hiệu ứng): ở trận Tống Kim, FPS < RS_THAP suốt 2 giây mà logic + vẽ
// chưa tới nửa thời gian khung thì canvas vẽ nhỏ lại từng nấc RS_NAC (tới RS_MIN — CSS phóng ra đủ màn, hơi mờ); ra khỏi trận về 1 (rsTick trong fpsTick)
// Anh 06/11 lần 2 ("dao động 20–80, không ổn định, hay bị nháy đen màn hình"): đổi cỡ canvas xóa trắng nó ngay sau khung vừa vẽ -> 1 khung đen; nâng lại
// nét khi FPS lên rồi tụt lại -> lên xuống liên tục. Nay: đổi cỡ đầu khung kế, ngay trước lúc vẽ (rsCho); trong trận chỉ HẠ nét (FPS < RS_THAP suốt
// 3 giây), không tự nâng lại giữa trận — ra khỏi trận mới về 1
// Anh 06/11 lần 3 ("vẫn bị giảm và hình ảnh bị mờ nữa"): hạ nét không cứu được FPS (game chỉ tốn ~9 ms / khung, trình duyệt vẫn chỉ cho 18 lần / giây — chậm
// ngoài game) mà lại mờ -> TẮT (RS_MIN = 1: không bao giờ hạ); giữ mã để bật lại nếu cần
const RS_NAC = 0.15, RS_MIN = 1, RS_THAP = 30;
let rs = 1, rsXau = 0, rsCho = null;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1); vw = innerWidth; vh = innerHeight;
  cv.width = Math.round(vw * dpr * rs); cv.height = Math.round(vh * dpr * rs);
}
function rsTick(f, jsMs) {
  const tk = !!(world && TongKim.laTo()), han = khungNenNay() || (DT && DT.on && DT.khung && DT.khung <= RS_THAP); // game tự hãm khung (cửa sổ nền / điện thoại): không tính
  let moi = rs;
  if (!tk) { moi = 1; rsXau = 0; }
  else if (!han && f < RS_THAP && jsMs < 500 / f) { if (++rsXau >= 6) { rsXau = 0; moi = Math.max(RS_MIN, Math.round((rs - RS_NAC) * 100) / 100); } }
  else rsXau = 0;
  if (moi !== rs) rsCho = moi; // đổi đầu khung kế (loop — ngay trước lúc vẽ, không lộ khung đen)
}
addEventListener("resize", resize); resize();
// khung nhìn theo px bản đồ: phóng cảnh (phím + / -) thì khung nhỏ lại. Khóa theo nhân vật như client, tính từ vị trí đã làm tròn
// và làm tròn tới điểm ảnh (người / quái / ô nền cũng vẽ ở điểm tròn) — trước là camera đuổi dần (10 % mỗi khung): dừng lại thì bản
// đồ còn trôi ~1 s và nhích từng điểm thưa dần (anh thấy khó chịu 23/10)
function camTarget() {
  const p = world.player, m = world.map, W = vw / zoom, H = vh / zoom, px = Math.round(p.x), py = Math.round(p.y);
  const cx = m.w <= W ? (m.w - W) / 2 : Math.max(0, Math.min(m.w - W, px - W / 2));
  const cy = m.h <= H ? (m.h - H) / 2 : Math.max(0, Math.min(m.h - H, py - H * (DT ? DT.neoY() : 0.55))); // điện thoại dọc: giữa phần cảnh còn thấy
  return [Math.round(cx), Math.round(cy)];
}
function snapCam() { [cam.x, cam.y] = camTarget(); }

// chuột trên cảnh theo bảng client: LButton Mouse_Action (đi / đánh), RButton + Shift+L/R Mouse_Force (đánh quái dưới chuột — võ công
// tay phải / trái làm ở M3); Ctrl + chuột phải Mouse_Menu = menu người chơi (giao dịch, tổ đội — anh 30/10); Ctrl + chuột trái / Alt + chuột (mật
// đàm, đồng hành, biểu cảm) -> báo chưa có
const mouseAt = (e) => [e.clientX / zoom + cam.x, e.clientY / zoom + cam.y];
// sạp chợ trời dưới chuột (anh 11/11 "trên pc treo bán như này bấm vào hay nhầm lắm, e đổi thành ctrl + chuột trái mới click xem sạp"): NPC trông sạp
// (chủ vắng — sapTick) -> { npc }; người đang ngồi bày bán (bảng hiệu trên đầu — World.bangHieu) -> { k }; không có -> null
function sapDuoi(x, y) {
  if (P.settings.anSap) return null; // sạp đang ẩn (Trợ Thủ → Khác — anh 11/11): xem hàng ở bảng Chợ Trời
  const n = world.npcAt(x, y, "chi"); // chỉ NPC trông sạp — sạp sát NPC thật vẫn bắt được (soát 11/11)
  if (n) return { npc: n };
  const o = world.bangHieu && world.bangHieu.size ? world.otherAt(x, y) : null, s = o && world.bangHieu.has(o.name) && sapCuaTen(o.name);
  return s ? { k: s.k } : null;
}
let sapNhac = false; // bấm thường vào sạp lần đầu (mỗi lần mở trang): nhắc Ctrl + chuột trái
cv.addEventListener("pointerdown", (e) => { mouseC = [e.clientX, e.clientY]; mouseAct(e); });
// điện thoại: chạm vào người chơi khác — giữ CHAM_GIU mà không xê dịch = menu người chơi; nhả sớm = chạm thường (chạy tới chỗ đó), kéo đi = giữ chạy
// theo ngón như chạm đất
const CHAM_GIU = 450;
let chamNguoi = null;
function mouseAct(e) {
  if (!world || (e.button !== 0 && e.button !== 2)) return;
  const name = (e.ctrlKey ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + (e.shiftKey ? "Shift+" : "") + (e.button ? "RButton" : "LButton");
  const cmd = (keys && keys.cmdOf(name)) || (e.button ? "" : "Mouse_Action()");
  // đang cầm món trên tay, bấm ra ngoài cửa sổ = vứt xuống đất (điện thoại dọc / đang giao dịch: món về chỗ cũ — chạm nhầm cảnh không mất món)
  if (GW && GW.holding && e.button === 0) return (DT && DT.on) || GW.gdMo ? GW.drop() : throwHeld();
  // điện thoại dọc: chạm NPC = chạm đất — nói chuyện bằng nút Nói chuyện (dienthoai.js — anh 30/10 "bỏ chạm là đối thoại trên mobile, dễ loạn");
  // chạm vật trên đất cũng = chạm đất — nhặt bằng nút Nhặt (anh 30/10 "đang bấm vào là nó nhặt, nhặt nhầm"). Chỉ với ngón tay: chuột (máy tính
  // kéo cửa sổ hẹp — giao diện điện thoại) bấm NPC / vật như giao diện máy tính
  const chamDt = DT && DT.on && e.pointerType === "touch";
  // sạp chợ trời (anh 11/11): Ctrl + chuột trái vào sạp = xem sạp (NPC trông sạp: đi tới rồi mở như nói chuyện; người ngồi bày bán: mở ngay — như bản
  // trước bấm thường). Ctrl + chuột trái ngoài sạp vẫn là Mouse_Say của client (mật đàm — chưa có). Bấm thường: bỏ qua sạp (npcAt coSap false) = bấm đất
  // máy tính bảng (giao diện máy tính, chạm — không có Ctrl, không có nút "Sạp của …" của điện thoại — soát 11/11): chạm thường vào sạp vẫn mở như trước
  const chamMay = !chamDt && !!e.pointerType && e.pointerType !== "mouse";
  if (!chamDt && e.button === 0 && (e.ctrlKey || chamMay) && !e.shiftKey && !e.altKey) {
    const [sx, sy] = mouseAt(e), s = sapDuoi(sx, sy);
    if (s) { if (s.npc) world.clickNpc(s.npc); else GW.cho.xemSap(s.k); return; }
  }
  const [x, y] = mouseAt(e), n = chamDt ? null : world.npcAt(x, y, false), m = n ? null : world.mobAt(x, y), d = n || m || chamDt ? null : world.dropAt(x, y);
  // chạm giữ người chơi / bot Tống Kim -> menu người chơi (anh 06/11: bot xem được như người); bot phe kia là "quái" (m): chạm nhanh vẫn đánh (chamNguoiXong)
  const tay = DT && DT.on && e.pointerType === "touch" && e.button === 0 && !d && /^Mouse_Action/.test(cmd);
  // anh 12/11 ("iOS đè vô người chơi xem thông tin không được"): ở bãi người chơi đứng lẫn trong quái — trước có quái dưới ngón là bỏ qua người chơi (chạm
  // giữ thành đánh quái). Nay xét người chơi cả khi có quái (vùng rộng tới tên trên đầu — otherAt rong); quái đó vẫn đánh ngay lúc chạm như trước
  const o = tay ? (m && m.tkb && !m.tkq ? m : world.otherAt(x, y, true) || world.botAt(x, y, true)) : null; // quân NPC Tống Kim (tkq): chạm = đánh như quái
  if (o) {
    if (chamNguoi) clearTimeout(chamNguoi.t);
    // bot phe kia (quái — m) / quái dưới ngón: đánh ngay lúc chạm như chạm quái (soát 06/11: trước chờ nhả tay mới đánh, chậm 1 nhịp lúc PK); giữ vẫn ra menu,
    // kéo = chạy theo ngón (xét o chứ không chỉ m: botAt bắt cả phần trên người / trên ngựa cao hơn ô quái mobAt — soát lần 2 06/11)
    const quai = o.tkb && o.alive && world.mobs.includes(o) ? o : m, danh = !!quai; if (danh) world.clickMob(quai);
    const c = (chamNguoi = { id: e.pointerId, o, cx: e.clientX, cy: e.clientY, x, y, danh });
    c.t = setTimeout(() => { if (chamNguoi !== c) return; chamNguoi = null; if (navigator.vibrate) navigator.vibrate(12); menuNguoi(o, c.cx, c.cy); }, CHAM_GIU);
    return;
  }
  // chợ trời: bấm thường vào sạp (người ngồi bày bán / NPC trông sạp) = bấm đất (anh 11/11 — trước mở sạp ngay, hay bấm nhầm); lần đầu nhắc Ctrl + chuột trái
  if (!sapNhac && !chamDt && e.pointerType === "mouse" && /^Mouse_Action/.test(cmd) && !n && !m && !d && sapDuoi(x, y)) { sapNhac = true; P.hud.msg("Xem sạp: giữ Ctrl rồi bấm chuột trái vào sạp"); }
  if (/^Mouse_Action/.test(cmd)) { if (n) world.clickNpc(n); else if (m) world.clickMob(m); else if (d) world.clickDrop(d); else { world.clickGround(x, y); world.clickFx = { x, y, at: world.time }; holdStart(e); } }
  else if (/^Mouse_Force1/.test(cmd)) { if (!world.useRight(m, x, y) && m) world.clickMob(m); } // chiêu tay phải (bùa: lên mình; đánh: quái dưới chuột / điểm)
  else if (/^Mouse_Force0/.test(cmd)) world.useLeft(m, x, y); // Shift + chuột trái: chiêu tay trái vào quái dưới chuột / khoảng không chỗ trỏ
  else if (/^Mouse_Force/.test(cmd)) { if (m) world.clickMob(m); }
  else if (/^Mouse_Menu/.test(cmd)) { const k = world.otherAt(x, y) || world.botAt(x, y); if (k) menuNguoi(k, e.clientX, e.clientY); } // + bot Tống Kim (anh 06/11)
  else if (cmd) todoMsg(name, `${name}: ${{ Mouse_Say: "mật đàm", Mouse_PartnerAction: "đồng hành", Mouse_Emote_Menu: "biểu cảm" }[cmd.replace(/\(.*$/, "")] || cmd} — chưa có`);
}
// chạm người chơi: nhả trước CHAM_GIU = chạm đất chỗ đó; kéo ngón đi = giữ chạy theo ngón
function chamNguoiXong(e, keo) {
  const c = chamNguoi; if (!c || e.pointerId !== c.id) return false;
  if (keo && Math.hypot(e.clientX - c.cx, e.clientY - c.cy) <= 10) return true;
  clearTimeout(c.t); chamNguoi = null;
  if (e.type === "pointercancel") return true;
  if (c.danh && !keo) return true; // đã đánh lúc chạm (bot đó chết trước lúc nhả tay thì thôi, không chạy tới chỗ chạm — soát lần 2 06/11)
  if (c.o.tkb && c.o.alive && world.mobs.includes(c.o) && !keo) { world.clickMob(c.o); return true; } // bot phe kia: chạm nhanh = đánh như quái
  world.clickGround(c.x, c.y); world.clickFx = { x: c.x, y: c.y, at: world.time };
  if (keo) holdStart({ button: 0, pointerId: c.id, clientX: e.clientX, clientY: e.clientY });
  return true;
}
cv.addEventListener("contextmenu", (e) => e.preventDefault());
// GIỮ chuột trái trên đất (anh 26/10, duyệt 27/10): nhân vật cứ chạy theo con trỏ, không phải bấm từng lần; con trỏ đứng yên ở mép màn
// hình thì cảnh trôi theo người nên vẫn chạy tiếp hướng đó. Mỗi HOLD_T giây đặt lại điểm đến theo chỗ con trỏ. Đang tự đánh: lúc giữ chỉ
// chạy, không nhắm quái / nhặt đồ / dùng bùa (World.holdMove); thả chuột là đứng lại đánh tiếp quanh chỗ mới (neo tự đánh dời theo).
// Đang giữ vẫn bấm được chuột phải (anh 26/10 — vd giữ chạy rồi bấm Đoạn Hồn Thích): trình duyệt không báo pointerdown cho nút bấm thêm
// khi nút khác đang giữ mà báo pointermove có button 2 -> mouseAct như bấm thường; trong lúc chiêu đó chạy tới / ra đòn / lướt thì tạm
// không đặt lại điểm đến (bản đầu 0,15 giây sau đã đè mất mục tiêu), xong chiêu lại chạy theo con trỏ
const HOLD_T = 0.15, HOLD_MIN = 12;
let hold = null;
function holdStart(e) {
  if (e.button !== 0) return;
  hold = { id: e.pointerId, cx: e.clientX, cy: e.clientY, at: performance.now() };
  try { cv.setPointerCapture(e.pointerId); } catch {}
  world.holdMove = true;
}
function holdEnd() {
  if (!hold) return;
  hold = null;
  if (!world) return;
  world.holdMove = false;
  if (world.auto) { const p = world.player; p.goal = null; p.path = null; p.manual = false; world.neo = [p.x, p.y]; }
}
function holdTick(now) {
  if (!hold || now - hold.at < HOLD_T * 1000 || hold.thang) return; // thang: cần đang chạy thẳng (joyMove)
  hold.at = now; world.holdMove = true; // (đổi bãi giữa lúc giữ: World mới)
  const p = world.player; if (p.hp <= 0 || p.dash || p.sit || (p.once && p.target && p.target.alive) || p.cast || p.queueSelf) return;
  const x = hold.cx / zoom + cam.x, y = hold.cy / zoom + cam.y;
  if (ldist(p.x, p.y, x, y) < HOLD_MIN) return; // con trỏ ngay trên người: đứng
  if (p.goal && ldist(p.goal[0], p.goal[1], x, y) < 6 && p.path && p.path.length) return;
  world.clickGround(x, y);
}
// cần điều khiển của giao diện điện thoại dọc (dienthoai.js — anh 29/10 "joystick để di chuyển bằng cách kéo"): giữ cần như giữ chuột trái trên đất,
// chỗ đến cách nhân vật JOY_R điểm màn hình theo hướng cần (d = [x, y] dài 1; dienthoai.js gọi mỗi khung lúc đang giữ); null = nhả như nhả chuột,
// đứng lại ngay (không chạy nốt tới chỗ đến cuối)
// Mượt (anh 31/10 "chỉnh thao tác cho mượt"): mỗi khung, đoạn thẳng JOY_DI trước mặt theo hướng cần đi được thì chạy thẳng tới đó (không tìm đường
// theo ô — khỏi gấp khúc, đổi hướng tức thì); vướng thì thử lệch ±30° / ±60° (trượt dọc tường); bí cả thì holdTick tìm đường như cũ.
// Anh 01/11 ("joystick kéo đi rất khựng, di chuyển và linh hoạt rất kém"): ở bãi nhiều cây / đá đoạn 150 thẳng hay vướng -> rơi xuống tìm đường
// theo ô mỗi 0,15 giây (giật, đường vòng). Nay thử thêm góc lệch ±15° … ±90° và đoạn ngắn hơn (JOY_DOAN) trước khi tìm đường
const JOY_R = 120, JOY_DI = 150, JOY_DOAN = [1, 0.6, 0.3], JOY_GOC = [0, 0.26, -0.26, 0.52, -0.52, 0.79, -0.79, 1.05, -1.05, 1.31, -1.31, 1.57, -1.57];
function joyMove(d) {
  if (!world) return;
  if (!d) { if (hold && hold.id === "joy") { holdEnd(); const p = world.player; p.goal = null; p.path = null; } return; }
  if (!hold || hold.id !== "joy") { holdEnd(); hold = { id: "joy", at: 0 }; world.holdMove = true; }
  const p = world.player, M = world.map;
  hold.cx = (p.x - cam.x) * zoom + d[0] * JOY_R; hold.cy = (p.y - cam.y) * zoom + d[1] * JOY_R; hold.thang = false;
  // cần được ưu tiên hơn chiêu (anh 31/10 lần 2 "đang kéo chiêu mà kéo thanh di chuyển thì nhân vật ưu tiên di chuyển"): bỏ đòn đang chờ — chiêu
  // nhắm 1 con (once: chạy tới con đó rồi ra), chiêu vào khoảng không chờ vung xong (queueAt); đang vung / ra chiêu dở thì xong mới chạy
  p.once = null; p.queueAt = null;
  // anh 04/11 lượt 25 ("đánh boss, kéo joystick nó k đi, phải bấm và đè ra chỗ khác thì nhân vật mới di chuyển"): bỏ mục tiêu / đồ / NPC đang tới cả
  // lúc đang vung / ra chiêu dở (như chạm đất — World.clickGround; chiêu dở vẫn ra vào con đã nhắm — p.cast.target). Trước chỉ bỏ khi đi thẳng được, mà
  // đang ra chiêu thì thoát sớm -> tự đánh ra chiêu kế liền vào boss (p.target còn), cần không bao giờ chạy
  if (p.hp > 0) { p.talkTo = null; p.target = null; p.loot = null; }
  if (p.hp <= 0 || p.dash || p.sit || p.cast || p.queueSelf) return;
  for (const f of JOY_DOAN) for (const a of JOY_GOC) {
    if (f < 1 && Math.abs(a) > 1.06) continue; // đoạn ngắn: chỉ lệch tới 60° (lệch 75–90° chỉ khi đoạn dài — trượt dọc tường)
    const c = Math.cos(a), s = Math.sin(a), ux = d[0] * c - d[1] * s, uy = d[0] * s + d[1] * c, k = (JOY_DI * f) / (Math.hypot(ux, 2 * uy) || 1), x = p.x + ux * k, y = p.y + uy * k;
    if (M.walkable(x, y) && M.clear(p.x, p.y, x, y)) { p.talkTo = null; p.target = null; p.loot = null; p.goal = [x, y]; p.path = [[x, y]]; p.manual = true; hold.thang = true; return; }
  }
}
cv.addEventListener("pointerup", (e) => { if (chamNguoiXong(e)) return; if (hold && e.pointerId === hold.id) holdEnd(); });
cv.addEventListener("pointercancel", (e) => { if (chamNguoiXong(e)) return; if (hold && e.pointerId === hold.id) holdEnd(); });
cv.addEventListener("lostpointercapture", (e) => { if (hold && e.pointerId === hold.id) holdEnd(); });
addEventListener("blur", holdEnd);
// con trỏ: trên NPC -> nói chuyện (CursorList 2), trên quái -> tấn công (1), trên đồ / tiền nằm đất -> nhặt đồ (3 拣物品), còn lại thường (0)
let curMob = null, mouseC = null; // mouseC: chỗ con trỏ trên cảnh lần cuối (tọa độ màn hình) — phím ô dùng nhanh ra chiêu theo đó
cv.addEventListener("pointermove", (e) => {
  mouseC = [e.clientX, e.clientY];
  if (!world) return;
  if (chamNguoi && chamNguoiXong(e, true)) return;
  if (hold && e.pointerId === hold.id) {
    hold.cx = e.clientX; hold.cy = e.clientY;
    if (e.button === 2 && e.buttons & 2) mouseAct(e); // bấm thêm chuột phải lúc đang giữ chuột trái
    if (!(e.buttons & 1)) holdEnd(); // nhả chuột trái mà chuột phải còn giữ: pointerup chỉ tới khi nhả hết nút
  }
  datConTro(e.clientX, e.clientY, e.ctrlKey, e.pointerType === "touch");
});
// con trỏ ở chỗ (cx, cy) màn hình. Sạp chợ trời (anh 11/11): chỉ khi giữ Ctrl mới thành con trỏ xem sạp 摆摊察看 (CursorList 9); không giữ Ctrl sạp như
// đất (bấm thường = đi tới). Nhấn / nhả Ctrl lúc chuột đứng yên trên sạp: tính lại (keydown / keyup bên dưới)
function datConTro(cx, cy, ctrl, cham) {
  if (!world) return;
  // giữ Ctrl: xét sạp trước NPC thật (như mouseAct — sạp sát NPC: Ctrl + chuột trái mở sạp nên con trỏ cũng là xem sạp — soát 11/11)
  const [x, y] = mouseAt({ clientX: cx, clientY: cy }), sap = ctrl && !cham && sapDuoi(x, y), nn = sap ? null : world.npcAt(x, y, false);
  const on = sap ? 9 : nn ? (nn.obj ? 8 : 2) : world.mobAt(x, y) ? 1 : world.dropAt(x, y) ? 3 : 0; // vật bản đồ: con trỏ 看obj
  if (on !== curMob) { curMob = on; cv.style.setProperty("--jxcur", P.hud.cursorCss(on)); }
}
// e.ctrlKey: trạng thái sau khi nhấn / nhả (còn giữ Ctrl bên kia thì vẫn true); rời cửa sổ (Ctrl+Tab…) mất keyup -> coi như nhả
for (const ev of ["keydown", "keyup"]) addEventListener(ev, (e) => { if (e.key === "Control" && mouseC) datConTro(mouseC[0], mouseC[1], e.ctrlKey); });
addEventListener("blur", () => { if (mouseC) datConTro(mouseC[0], mouseC[1], false); });

// ---------- vòng lặp ----------
// Logic chạy theo thời gian THẬT, chia bước STEP giây — không phụ thuộc tốc độ vẽ. Trang hiện: requestAnimationFrame vừa chạy
// logic vừa vẽ. Trang ẩn / thu nhỏ: trình duyệt ngừng requestAnimationFrame -> đồng hồ dự phòng chạy logic (trình duyệt cho
// ~1 lần / giây, ẩn lâu > 5 phút thì ~1 lần / phút), mỗi lần bù đủ thời gian đã trôi, tối đa CATCHUP giây. Trình duyệt cho trang
// ngủ hẳn (tiết kiệm pin / bộ nhớ, máy ngủ…) quá vangGiay (90 giây — máy chủ không nhận nhịp): máy chủ đã ủy thác thay khoảng đó
// (may-chu/do.js) nên không tua lại nữa — bản trước tua thêm tới 120 giây, tính 2 lần (27/10).
const STEP = 1 / 30, CATCHUP = 120;
let simAt = 0, rafAt = 0, simDen = 0; // simDen: lúc game tính bước gần nhất — mốc vị trí mang đúng lúc này (anh 14/11 nhảy cóc)
function simulate(now) {
  if (!simAt) simAt = now;
  const gap = (now - simAt) / 1000, vang = (luat().uyThac || {}).vangGiay || 90;
  let el = (gap > vang ? 0 : Math.min(CATCHUP, gap)) * P.dev.speed; // tốc độ game: công cụ thử
  simAt = now;
  // bù quãng dài (tab ngủ, điện thoại tắt màn hình — anh 01/11 "nhân vật tự chết"): tự uống thuốc giữa chừng mỗi 0,25 giây như lúc đang chơi —
  // trước chỉ uống 1 lần sau khi đã bù xong cả quãng
  let uong = 0;
  while (el > 1e-6) { const d = Math.min(STEP, el); world.update(d); el -= d; if (hudMounted && (uong += d) >= 0.25) { uong = 0; autoDrink(); } }
  simDen = now;
}
let looping = false, veLuc = 0;
// cửa sổ không đang dùng (anh 03/11 "treo có 1 con tụt fps … phóng to lên con khác cũng tụt" — đo: 1 khung chỉ ~2,5 ms ở 1887 × 994, 75 quái;
// tụt vì nhiều cửa sổ game trên 1 máy cùng vẽ hết tốc độ, Edge / Windows hãm cửa sổ treo): mất focus thì vẽ tối đa khungNen khung / giây
// (Trợ Thủ → Khác, nhớ ở máy này; 0 = như cửa sổ đang dùng) — trận đấu vẫn theo thời gian thật (simulate bù), chỉ bớt vẽ để nhường máy
const KHUNG_NEN = [20, 10, 0];
let khungNen = 20, coFocus = document.hasFocus();
try { const v = localStorage.getItem("vl_khungNen"); if (v != null && KHUNG_NEN.includes(+v)) khungNen = +v; } catch {}
addEventListener("focus", () => { coFocus = true; });
addEventListener("blur", () => { coFocus = false; });
function datKhungNen(v) { if (!KHUNG_NEN.includes(v)) return; khungNen = v; try { localStorage.setItem("vl_khungNen", String(v)); } catch {} }
// giới hạn lúc này (0 = không): điện thoại thật (DT không phải cửa sổ máy tính hẹp) chỉ 1 trang — không hãm theo focus
const khungNenNay = () => (!coFocus && khungNen && !(DT && DT.on && !DT.mt) ? khungNen : 0);
// số lần trình duyệt gọi vẽ mỗi giây, đếm trước khi giới hạn khung (anh 31/10: "bật 144 Hz mà game chỉ 60–61" — Trợ Thủ → Khác hiện "máy cho tối đa":
// ~60 là trình duyệt / máy giữ, không phải game); trang ẩn lâu rồi hiện lại thì đếm lại từ đầu
let rafDem = 0, rafMoc = 0, rafHz = 0;
function loop(now) {
  if (!world) { looping = false; return; }
  rafDem++;
  if (now - rafMoc >= 1000) { if (now - rafMoc < 2000) rafHz = Math.round((rafDem * 1000) / (now - rafMoc)); rafDem = 0; rafMoc = now; }
  // điện thoại: vẽ tối đa DT.khung khung / giây (anh 30/10 lần 2: "black shark hao pin, nóng máy" — màn 90–144 Hz thì trình duyệt gọi vẽ bấy nhiêu
  // lần mỗi giây; mặc định 60, Trợ Thủ → Khác chọn 30 / không giới hạn — DT.khung 0). Trận đấu vẫn theo thời gian thật (simulate bù phần đã trôi)
  const kDt = DT && DT.on && DT.khung ? DT.khung : 0, kNen = khungNenNay(), kh = kNen && (!kDt || kNen < kDt) ? kNen : kDt; // + cửa sổ không dùng
  if (kh && now - veLuc < 1000 / kh - 3) { requestAnimationFrame(loop); return; }
  veLuc = now;
  rafAt = now;
  holdTick(now);
  const tL = performance.now();
  simulate(now);
  fps.logic += performance.now() - tL; // logic (não bot, quân, đạn…) — dòng FPS (anh 06/11 Tống Kim "giật 3–9 fps": cần biết chậm ở logic hay vẽ)
  snapCam();
  if (rsCho != null) { rs = rsCho; rsCho = null; resize(); } // tỉ lệ vẽ mới (rsTick): đổi cỡ canvas rồi vẽ ngay trong cùng khung
  ctx.setTransform(dpr * rs * zoom, 0, 0, dpr * rs * zoom, 0, 0);
  const t0 = performance.now();
  world.draw(ctx, cam, vw / zoom, vh / zoom);
  fpsTick(now, performance.now() - t0);
  hud();
  const p = world.player;
  P.hud.drawMinimap({ player: p, mobs: world.mobs, others: [...world.others.values()].filter((e) => !e.an || world.thayAn(e)), /* ẩn thân: không hiện chấm (anh 12/11) */ path: p.path, dong: world.dongMinh, tk: TongKim.laTo() && TongKim.st ? { phe: TongKim.st.phe, pheNguoi: TongKim.pheNguoi } : LoiDai.mm(), diem: DuaNgua.mm() }); // Tống Kim: màu chấm theo phe (hud.js); lôi đài: tuyển thủ còn sống — bên kia đỏ, bên mình xanh lá (loidai.js mm); đường đua: hộp vàng, đích xanh lá (duangua.js mm)
  if (DT) DT.tick();
  requestAnimationFrame(loop);
}
// bộ đo FPS góc trái trên (anh muốn 23/10): khung hình / giây, thời gian 1 khung, thời gian vẽ cảnh, số quái đang sống
const fpsEl = document.createElement("div");
fpsEl.id = "fps";
document.body.appendChild(fpsEl);
const fps = { n: 0, at: 0, draw: 0, logic: 0 };
let fpsLast = 0;
function fpsTick(now, drawMs) {
  fps.n++; fps.draw += drawMs;
  if (!fps.at) fps.at = now;
  if (now - fps.at < 500) return;
  const f = (fps.n * 1000) / (now - fps.at);
  fpsLast = Math.round(f); // điện thoại: dòng FPS + mạng dưới thanh nhân vật (dienthoai.js _mang)
  // + vì sao ít khung (anh 03/11): cửa sổ không dùng (khungNen) / trình duyệt chỉ gọi vẽ ít lần (rafHz — Edge / Windows hãm, không phải game)
  rsTick(f, (fps.logic + fps.draw) / fps.n);
  fpsEl.textContent = `FPS ${Math.round(f)} · ${(1000 / f).toFixed(1)} ms · logic ${(fps.logic / fps.n).toFixed(1)} ms · vẽ ${(fps.draw / fps.n).toFixed(1)} ms · quái ${world.mobs.filter((m) => m.alive).length}`
    + (rs < 1 ? ` · nét ${Math.round(rs * 100)}%` : "")
    + (khungNenNay() ? ` · cửa sổ không dùng: tối đa ${khungNen}` : "") + (rafHz && rafHz < 30 ? ` · trình duyệt chỉ cho ${rafHz} lần / giây` : "");
  fpsEl.classList.toggle("low", f < 30);
  fps.n = 0; fps.draw = 0; fps.logic = 0; fps.at = now;
  datFps();
}
// dải trên rộng 1024 nằm giữa màn hình: cửa sổ không phóng to (anh 29/10 — rộng chừng 1100–1600 px) thì đầu dải lấn vào chỗ bộ đo, chữ
// đè chữ ô logo -> bộ đo xuống ngay dưới dải, hàng biểu tượng trạng thái + bảng bên trái lùi xuống 1 dòng (hud.datLech). Đủ chỗ thêm 30 px mới
// trả về chỗ cũ (số đổi làm chữ dài / ngắn không làm bộ đo nhảy qua lại). Bản trước chỉ đổi theo bề ngang < 1100 px (game.css)
let fpsDuoi = false;
function datFps() {
  if (!hudMounted || !fpsEl.textContent) return;
  const b = P.hud.top.getBoundingClientRect(), can = 4 + fpsEl.offsetWidth + 6 - b.left, duoi = can > 0 || (fpsDuoi && can > -30);
  if (duoi !== fpsDuoi) { fpsDuoi = duoi; P.hud.datLech(duoi ? FPS_CAO : 0); }
  fpsEl.style.top = duoi ? Math.ceil(b.bottom) + 1 + "px" : "";
}
const FPS_CAO = 15;
addEventListener("resize", datFps);
henGio(() => {
  const now = performance.now();
  if (world && now - rafAt > 400) { simulate(now); hud(); }
  if (world && now - rafAt > 1000) { fpsEl.textContent = "FPS 0 · trang ẩn (không vẽ, game vẫn chạy)"; fps.at = 0; fps.n = 0; fps.draw = 0; }
}, 250);

let mocNhan = null;
function hud() {
  if (!hudMounted) return; // vào game: bãi đã chạy (world có) mà thanh giao diện chưa dựng xong
  if (GW) GW.refresh();
  P.hud.tickInfo(performance.now());
  // nút Ngồi theo trạng thái nhân vật (đi / đánh / bị đánh thì tự đứng dậy)
  if (!!P.hud.toggles.Sit !== !!world.player.sit) P.hud.setToggle("Sit", !!world.player.sit);
  const riding = world.riding(); // tự dưỡng sức ở thành thì tự xuống ngựa (World.updateHero)
  if (!!P.hud.toggles.Horse !== riding) P.hud.setToggle("Horse", riding);
  autoDrink(); quickHud(); if (!TongKim.laTo()) treoTick(); if (!laPh(world.zone) && !TongKim.laTo()) { bossTick(); TuLam.tick(); } nguaThanh(); nguaBoss(); tuDungTick(); doiTick(); sapTick(); cooldownHud(); trangThaiHud(); nhiemVuHud(); pldTick(); vaTick(); ViemDe.tick(); CuongNo.tick(); if (QuaiChung.w && QuaiChung.w === world) QuaiChung.tick();
  world.phTuDanh = laPh(world.zone) && phO(); // Trợ Thủ "ở lại trận": World.nearestMob — hoạt động, chỉ đánh quanh nhân vật (anh 04/11 lượt 25)
  if (PhongHoa.w && PhongHoa.w === world) { PhongHoa.tick(); phMuaTick(); } PhongHoa.ve(world);
  TongKim.tick(); // Tống Kim bãi thử: gửi tin, vị trí bot (chủ trận), dựng bot, bảng điểm
  LoiDai.tick(); // lôi đài: "ldAn" (có mặt), bản chọn mục tiêu theo người đang vẽ, thanh tỉ số, tự về khi hết trận / không còn tên ở sân
  DuaNgua.tick(); // đường đua: tốc cố định / đứng chờ, hộp / bẫy, thanh đua, tự về khi xong lượt (duangua.js)
  // khung rương chỉ mở khi đứng cạnh Rương chứa đồ: đi xa (hoặc sang bản đồ khác) thì đóng
  // rương GẦN NHẤT (anh 12/11 "rươg chứa đồ trong tk, mobile k mở dc": Tống Kim / Phong Hỏa có 2 rương — trước chỉ đo tới rương đầu tiên (hậu doanh Tống) nên người
  // phe Kim mở rương ở hậu doanh mình là khung đóng ngay)
  if (GW && GW.storeOpen) { const p0 = world.player, gan = world.npcs.reduce((d, n) => (n.viec === "ruong" ? Math.min(d, ldist(p0.x, p0.y, n.x, n.y)) : d), Infinity); if (gan > 220) GW.W.get("store").hide(); }
  (mocNhan = mocNhan || new MocNhanPanel(P)).update(world, false, !!(GW && GW.W.get("shop").visible)); // bảng mộc nhân: hiện khi đứng gần (ẩn khi mở cửa hàng — cùng góc trái)
  const p = world.player, need = P.chr.exp[hero.lvl - 1] || 1;
  P.hud.update({ lvl: hero.lvl, life: p.hp, lifeMax: p.hpMax, mana: p.mp, manaMax: p.mpMax, stamina: p.st, staminaMax: p.stMax, exp: hero.exp || 0, expMax: need, rank: hangCap ?? "?" });
}

// ---------- lưu ----------
// cài đặt: theo máy (localStorage); nhân vật: trên máy chủ (Net.me.nv — bản mới nhất ở máy, Net.save gửi lên sau)
const fmtN = (n) => Math.round(n).toLocaleString("vi-VN");
function loadSettings() { try { return { ...SETTINGS_DEF, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return { ...SETTINGS_DEF }; } }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(P.settings)); } catch {} }
// bố cục màn hình (anh 29/10 lần 3 — Trợ Thủ → Khác: "kéo thả các tab trên màn hình … chọn lưu, lần sau vào lại acc đó lấy bố cục đó"): kéo
// thả ở hud.js keoBang, lưu theo nhân vật trên máy chủ (hero.auto.boCuc — save). viec: "bat" · "tat" (ô đánh dấu thẻ Khác: còn chỗ kéo chưa
// lưu thì hỏi bằng khung của game) · "luu" · "huy" (về bố cục đã lưu) · "macDinh" (đang kéo: các bảng về chỗ mặc định, bấm Lưu mới giữ; không
// kéo: về mặc định và lưu luôn)
function boCuc(viec) {
  const H = P.hud;
  if (!hero || !hero.auto) return;
  if (viec === "bat") H.keoBang(true);
  else if (viec === "tat") return H.boCucDoi() ? GW.hoi("Lưu bố cục các bảng vừa kéo?", "Lưu", "Không lưu").then((ok) => boCuc(ok ? "luu" : "huy")) : boCuc("huy");
  else if (viec === "luu") { hero.auto.boCuc = H.boCucNay(); save(); H.datBoCuc(hero.auto.boCuc); H.keoBang(false); H.msg("Đã lưu bố cục màn hình — lần sau vào lại nhân vật này vẫn giữ"); }
  else if (viec === "huy") { H.datBoCuc(hero.auto.boCuc); H.keoBang(false); }
  else if (viec === "macDinh") { H.boCucMacDinh(); if (!H.dangKeo) { hero.auto.boCuc = {}; save(); H.datBoCuc({}); H.msg("Đã trả bố cục màn hình về mặc định"); } }
  if (TT && TT.w.visible) TT.render();
}
// lưu kèm chỗ đứng (vào game lại đứng đúng bãi + chỗ đó — enterGame)
function save() {
  if (!hero) return;
  hero.last = Date.now();
  if (world && !zoneLoad) hero.tuDanh = world.auto ? 1 : 0; // vào lại ở bãi luyện công thì tự đánh tiếp (vaoGame)
  if (world && world.player && !zoneLoad) hero.viTri = { z: world.zone.id, x: Math.round(world.player.x), y: Math.round(world.player.y), ...(world.chung ? { c: 1 } : {}) }; // c: bản quái chung
  Net.save(hero);
}
function loadSlot(i) { const h = Net.me && Net.me.nv[i]; return h && h.v === 1 && h.name ? fixLooks(JSON.parse(JSON.stringify({ ...h, slot: i }))) : null; }
// looks = kiểu dáng các món ĐANG MẶC (trống = không mang đồ, xem NONE trong src/char/jx-char.js). Bản trước 23/10 tạo nhân vật
// với mũ / áo / vũ khí #1 (= đồ Thiếu Lâm Sa Di) -> đổi về không mang đồ.
function fixLooks(h) {
  // phái không còn trong gói võ công (anh chốt 24/10 bỏ Hoa Sơn / Võ Hồn / Tiêu Dao) -> về Vô Môn Phái, trả điểm kỹ năng (saveCleanup báo);
  // chiêu không còn trong phái (kỹ năng 180) -> bỏ, trả điểm (rules.fixPoints tính lại điểm còn = (cấp − 1) − tổng điểm đã cộng)
  const LOST = { 10: "Hoa Sơn", 11: "Võ Hồn", 12: "Tiêu Dao" };
  const f = h.fac != null && P.factions ? P.factions.find((x) => x.id === h.fac) : null;
  if (h.fac != null && P.factions && !f) { h.lostFac = LOST[h.fac] || `mã ${h.fac}`; h.fac = null; h.facKey = null; delete h.camp; delete h.rank; h.skills = {}; h.books = []; h.skPts = null; }
  else if (f) {
    const ok = new Set(f.skills), lost = new Set([...Object.keys(h.skills || {}).map(Number), ...(h.books || [])].filter((id) => !ok.has(id))).size;
    if (lost) { h.lostSkills = lost; h.skills = Object.fromEntries(Object.entries(h.skills || {}).filter(([id]) => ok.has(+id))); h.books = (h.books || []).filter((id) => ok.has(id)); h.skPts = null; }
  }
  const L = h.looks || {};
  if (L.helm === 1 && L.armor === 1 && L.weapon === 1 && !L.horse && !L.mantle) h.looks = {};
  return h;
}

// trang kiểm / trình duyệt điều khiển đọc trạng thái khi chạy ở máy dev
DoCongCu.batDau(); // dò công cụ tự động bên ngoài (anh 13/11 — chỉ báo về máy chủ)
if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) window.VL = { P, bdas: { fn: (id) => bdasFn(id, null), get tt() { return bdTtCu; }, cc: () => ccCong(hero) }, baoUyThac: (k) => baoUyThac(k), tkChetBox: () => tkChetBox(), get world() { return world; }, get hero() { return hero; }, get cam() { return cam; }, get zoom() { return zoom; }, get npcd() { return NPCD; }, get gw() { return GW; }, get dev() { return dev; }, get dt() { return DT; }, get tt() { return TT; }, get bc() { return BC; }, get pt() { return PT; }, get uh() { return UH; }, get va() { return VaDoi; }, get vdd() { return VdDoi; }, get vde() { return ViemDe; }, get sn() { return SanNhim; }, get net() { return Net; }, get tl() { return TuLam; }, get bt() { return BossTG; }, get bd() { return { bossDi, bossTheo, bossVe, bossDaDi, thanh, diXe }; }, satThu: (b) => satThu(b), tayTuy: (b) => tayTuy(b), doi: (b) => doiLam(b), get ph() { return PhongHoa; }, get tk() { return TongKim; }, get ld() { return LoiDai; }, get dn() { return DuaNgua; }, ldChetBox: () => ldChetBox(), ldVe: (ve) => ldVe(ve), phVao: () => phVao(), phongHoaVe: (n) => phongHoaVe(n), phVeThanh: () => phVeThanh(), diBai: (id, at, chung) => gotoZone(P.maps.zones.find((z) => z.id === id), { at, ...(chung ? { chung: true } : {}) }),
  // khu vực bang (đợt 4 — bài thử máy thử): KhuXem đang có, vào khu, hội thoại NPC khu, Xa phu khu, việc /api/khu-bang
  kb: { get dl() { return khuDl; }, vao: () => khuVao(), npc: (n) => khuNpc(n), xaPhu: (z) => khuXaPhu(z), lam: (b, im) => khuLam(b, im), chon: () => khuChonMau(), thietLap: () => khuThietLap() },
  // bang hội (anh 14/11 — công cụ thử / bài thử máy thử): áp tin nhịp giả, hội thoại NPC, gọi việc bang
  bh: { minh: (m) => bhMinhApply(m), moi: (m) => bhMoiApply(m), cc: (c) => bhCcApply(c), npc: (n) => bangHoiNpc(n || { name: "Người hướng dẫn bang hội" }), lam: (b) => bhLam(b), menu: (ten, x, y) => { const o = world && world.others.get(ten); if (o) menuNguoi(o, x || 400, y || 300); return !!o; }, get qt() { return qt; }, get minhNay() { return bhMinhCur; } } }; // chung: bản quái chung (công cụ thử)

boot();
