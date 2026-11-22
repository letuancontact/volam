// Thế giới trong 1 bãi train: người chơi, quái, tự đánh, AI quái, chữ sát thương. Vẽ bằng bộ vẽ đã kiểm (src/char/jx-char.js,
// src/npc/npc-pack.js) trên kho web ×0.75 — mọi tọa độ là px bản đồ web, khoảng cách / tốc độ theo logic (ldist, xem map.js).
//
// Nhịp động tác người chơi theo client settings/npc/player/basevalue.ini (đơn vị = vòng engine, 18 vòng/giây):
//   chạy 1 lượt 14 vòng, đứng 25 (nam) / 45 (nữ), đánh 18, bị đánh 12; tốc độ chạy 10 đơn vị logic / vòng.
// Chỉ số + chiến đấu theo client (M2, src/game/rules.js: nguồn từng phần) + chỉ số từ đồ đang mặc (itemdb.js equipStats). Giết quái:
// onKill(quái) -> main.js báo máy chủ; kinh nghiệm / lên cấp / ngân lượng / rơi đồ / phạt khi chết do máy chủ tính (may-chu/do.js, 25/10).
// Báo ra ngoài: onKill(quái), onLevel(cấp, số cấp vừa lên), onDeath(), onPick(vật trên đất vừa nhặt).
// Thuốc (25/10): drink(thuốc) — hồi đều mỗi nửa giây (lifepotion_v / manapotion_v của client, assets/data/thuoc.json hp / mp = [số hồi,
// số lần]); uống bình mới cùng loại (sinh lực / nội lực) thì thay tác dụng đang có, không cộng dồn. Trọng thương thì mất tác dụng.
// Đồ + tiền rơi trên đất (25/10, như client — src/game/roi.js): drop(x, y, { g, item | gold }) khi máy chủ báo con quái đó rơi gì (g =
// mã vật máy chủ giữ — may-chu/do.js). Anh chốt: phải đi tới chỗ rơi mới nhặt được — bấm vào vật (con trỏ nhặt đồ của client) thì đi tới
// nhặt; đang tự đánh thì xong con đang đánh là tự đi nhặt vật gần (≤ LOOT_R) trước khi tìm con mới (sau này có cài đặt tự động rõ hơn).
// Tới nơi (≤ PICK) -> onPick(vật) -> main.js báo máy chủ kèm nhịp; máy chủ báo túi đầy thì vật nằm lại (tự đánh bỏ qua vật đó). Vật nằm
// LifeTime của client (2400 vòng ≈ 133 giây) rồi mất; tối đa DROP_MAX vật. Tên vật: món — trắng / xanh lam (đồ xanh), tiền — "5049 lượng".
// Trợ Thủ (hero.auto — src/game/auto.js): tự đánh quanh chỗ bật (neo, danh.kc) hoặc lần lượt các tọa độ (danh.td — fromClient đổi tọa
// độ bản đồ nhỏ ra px, main.js đặt), đánh danh.doi giây mà không ra đòn được thì đổi con; tự nhặt theo bộ lọc nhat; tên vật trên đất theo
// hien.tenVat.
// Anh chốt 23/10: chết thì về thành dưỡng sức (onRevive — main.js đưa về thành; trong thành tự ngồi tới khi đầy sinh lực + nội lực rồi
// onRested), không tự hồi sinh lực / nội lực khi đứng (client không có số hồi gốc — chỉ thuốc, đồ, võ công), tỉ lệ trúng tối thiểu 5 %
// như engine, trùm thế giới ra như trùm thường. Hệ quái theo settings\maplist.ini của bản đồ.
// Đòn thường theo vũ khí (clientweaponskill.txt -> võ công -> đạn, src/game/fx.js basic): tầm = AttackRadius (tay không / kiếm / đao 75,
// thương / côn 100, ám khí 320). Ám khí: đứng xa phóng đạn 65 bay theo mục tiêu (Speed 16 / vòng, sống 20 vòng), tới nơi mới tính
// sát thương + tia trúng + tiếng; chỉ phóng khi đường thẳng tới quái không vướng vật cản.
// Võ công (25/10 — src/game/vocong.js cài thêm hàm vào World): đánh con đang nhắm bằng chiêu ô tay trái / chiêu đánh chính của Trợ Thủ
// (chuột phải: chiêu ô tay phải 1 lần), không dùng được (thiếu nội lực, chưa hồi chiêu, sai vũ khí) thì đòn thường. Bị động / bùa /
// vòng sáng (ô tay phải) cộng vào chỉ số (refreshStats); quái mang choáng / chậm / độc / bùa hại (mobTick, mobSpeedK, mobAtkK).

import { ldist } from "./map.js";
import { dirOf } from "../dir.js";
import * as R from "./rules.js";
import { ItemDB, looksOf, equipStats, isPotion, weaponKind, laBuffTk, laHoan } from "./itemdb.js";
import { installVoCong, skillB, mergeB, skillSupport, kindOf, auraGhep, addAttrs, vongGiu, KC_ID, KC_PHI, BUA_VUNG_AI } from "./vocong.js";
import { mocNhanTrung, hoiCoc, HOI_COC } from "./mocnhan.js";
import { nhatMon, BOSS_TAM, laBoss } from "./auto.js";
import { installNhanVatMay } from "./nhanvatmay.js";
import { installTkBot, CHUC_TK } from "./tkbot.js";

const TICK = 1 / 18;
const SCALE = 0.75;                   // kho web ×0.75 so với client
// chiêu 120 tác dụng vùng Trợ Thủ dùng khi có địch trong chừng này quanh mình (autoBuff): 715 Thiên Nhẫn Ma Âm Phệ Phách (vùng hoảng loạn ~±170), 716 Võ Đang Xuất Ứ Bất Nhiễm
const CHIEU_VUNG_120 = { 715: 220, 716: 400 };
const khoaVong = (L) => L.map((v) => v[0] + ":" + v[1]).sort().join(); // danh sách vòng sáng đồng đội -> khóa so sánh (World.vongDoi)
const RUN = 10 * 18 * SCALE;          // px logic / giây (RunSpeed 10)
const DUR = { run: 14 * TICK, stand: { m: 25 * TICK, f: 45 * TICK }, attack: 18 * TICK, hurt: 12 * TICK };
// 2 bot Tống Kim cùng phe giãn tối thiểu (separate — anh 06/11 "đứng chụm vào hết"; tkbot.js GIAN cho chỗ đứng đánh). Anh 06/11 lần 2 "hay đẩy nhau":
// chỉ nắn con đang chạy (đẩy nhẹ), con đứng / đang đánh không bao giờ bị đẩy trượt — giãn nhờ chỗ đứng (tkbot.js tkChoDanh, vòng quanh con đầu nhóm)
const BOT_GIAN = 44;
// Tống Kim (anh 06/11 "20 bot giật tưng bừng, 3–9 fps"): nhuộm màu choáng / chậm / độc bằng ctx.filter rất nặng (mỗi lần vẽ 1 lớp riêng, card đồ họa
// gánh) — bot / quân chỉ nhuộm con mình đang nhắm + tối đa TK_NHUOM con gần mình (≤ 260) mỗi khung (tkNhuom)
const TK_NHUOM = 4;
const PK_HAI = 2, PK_HAI_MAU = 0.35; // thẻ PK "Tự dùng bùa hại": tối đa 2 bùa / mục tiêu, mục tiêu dưới 35 % máu thì đánh luôn (pkHai)
// thẻ PK về doanh: 10 giây sinh lực không lên / cả lần chờ quá 90 giây (chỉ hồi nhỏ giọt) thì thôi chờ, ra trận lại (pkLuiTick)
const PK_LUI_CHO = 10, PK_LUI_TOI = 90;
// vòng chân lúc chạy theo tốc độ (anh 28/10 "ngựa chạy nhanh thì chân nhanh hơn chứ không chỉ tốc độ di chuyển tăng"): engine KNpc::DoRun —
// số khung 1 vòng chạy = RunFrame × RunSpeed / CurrentRunSpeed (CurrentRunSpeed = RunSpeed × (100 + % tốc độ) / 100, ít nhất 10), số nguyên
const RUN_FRAME = 14, RUN_SPEED = 10;
const runDur = (ms) => Math.max(1, Math.floor((RUN_FRAME * RUN_SPEED) / Math.max(10, Math.floor((RUN_SPEED * (100 + (ms || 0))) / 100)))) * TICK;
// lên / xuống ngựa cách nhau ít nhất NGUA_CHO giây (anh 28/10 — client MSG_CANT_SWITCH_HORSE "Bạn quá mệt rồi không thể tiếp tục lên hoặc xuống
// ngựa."): lần đổi gần nhất (performance.now — đổi bản đồ không đếm lại)
const NGUA_CHO = 3;
let nguaLuc = -1e9;
// bóng mờ khi ra chiêu (anh 28/10 "chiêu Thiên Vương thêm hiệu ứng bóng mờ như client"): engine KNpcRes 残影 — đang bật thì cứ BLUR_GAP (3 vòng)
// chụp lại hình đang vẽ ở chỗ đang đứng, giữ BLUR_MAX bản (MAX_BLUR_FRAME 7); bản mới đậm 128/255 (START_BLUR_ALPHA), mỗi BLUR_GAP nhạt 16/255
// (BLUR_ALPHA_CHANGE). Bật khi vung chiêu đánh nhiều đòn (KNpc::DoManyAttack — Thiên Vương …) hoặc chiêu có NeedShadow (vocong.js p.blur)
const BLUR_GAP = 3 * TICK, BLUR_MAX = 7, BLUR_A0 = 128, BLUR_DA = 16;
const HIT_AT = 0.55;                  // đòn trúng ở 55% động tác đánh
const HD_R = 550, HD_SAT = 250; // hoạt động (Phong Hỏa / boss thế giới): phạm vi tự đánh quanh nhân vật mặc định (Trợ Thủ danh.hd) / đứng sát vẫn đánh con đang bỏ qua (logic — nearestMob)
const BTG_TRONG = { x: 0, y: 0, hp: 0 }; // boss thế giới chưa có mục tiêu chung (updateMob: không thấy ai -> về chỗ)
// né Boss Sát thủ (Trợ Thủ danh.neSat — anh 03/11): hết quái mà boss đứng trong tầm boss thấy + NE_THEM -> sang chỗ cách boss tầm thấy + NE_XA
const NE_THEM = 300, NE_XA = 900;
const NHIM_GAN = 700;                 // nhím Săn Nhím Béo Phì (sannhim.js) cách mình ≤ chừng này: Trợ Thủ tạm dừng ở thôn / thành vẫn tự đánh nó (nhimGan)
const BTG_GAN = 900;                  // boss thế giới cách mình ≤ chừng này = đang đánh boss (Trợ Thủ: nhắm trước, không tự về thành — bossGan)
const CLICK_FX = 0.45;                // vòng sóng chỗ bấm đất sống 0,45 giây (World.draw)
const HIDE_ALPHA = 0.4;               // ẩn thân: nhân vật mình vẽ mờ 40 %
// ẩn thân báo cho người khác (anh 12/11 "tàng hình ng khác vẫn thấy, vào tống kim k có tác dụng"): mã giả trong danh sách bùa lợi gửi kèm nhịp (buaPhat — máy chủ
// lọc bl 1…99999, không cần sửa máy chủ); máy người khác thấy mã này thì không vẽ / không chọn được người đó (đồng đội thấy mờ), Tống Kim: bản chọn mục tiêu
// coi như vắng (tongkim.js dongBo)
export const AN_BL = 99990;
const TEXT_ROWS = 3, TEXT_MAX = 6;     // số sát thương bay trên 1 con: tối đa 3 hàng, 6 số cùng lúc (world.text)
const MOB_CAP = 16;                   // số quái cùng lúc trong bãi khi máy chủ không gửi canBang.soQuai (cau-hinh.json)
// quái đặc biệt (anh 27/10): tinh anh (tên xanh) sau mỗi tinhAnhMoi con, thủ lĩnh (trùm bãi, tên cam) sau mỗi thuLinhMoi con — đếm từ lúc hạ
// con trước (máy chủ gửi trong luat.canBang; GIỐNG may-chu/do.js gietQuai)
const TINH_ANH_MOI = 50, THU_LINH_MOI = 250;
// bản đồ dựng nguyên: quái sinh ở điểm đặt quái trong bán kính này quanh người chơi (khoảng cách ldist) — vùng ~ bằng ảnh cắt 7 × 7 vùng cũ
// (2688 × 2688 px, 65 con) để nhịp cày như bãi cũ
const DIEM_R = 2100;
const TA_MAU = "#6e96ff";            // tên tinh anh: xanh dương như quái hoàng kim của client
// màu tên người chơi theo phe đang theo (engine KNpc::PaintInfo, m_CurrentCamp — anh 31/10 "tên nhân vật hiển thị đúng màu chính tà trung lập theo
// client"): 0 chưa vào phái trắng, 1 chính phái cam 255,168,94, 2 tà phái hồng tím 255,146,255, 3 trung lập xanh lá 85,255,145
const PHE_MAU = ["#ffffff", "#ffa85e", "#ff92ff", "#55ff91"];
PHE_MAU[10] = "#ffa85e"; PHE_MAU[11] = "#ff92ff"; // Tống Kim (anh 05/11): phe Tống cam, phe Kim tím hồng như màu tên engine (máy chủ báo cp 10 / 11 — may-chu/the-gioi.js)
PHE_MAU[12] = "#ff92ff"; PHE_MAU[13] = "#55ff91"; // lôi đài (anh 15/11 — loidai.js): bên Giáp tím hồng, bên Ất xanh lục như client (máy chủ báo cp 12 / 13 cho tuyển thủ còn sống)
// tài khoản quản trị (anh 31/10 khuya "giữ nhân vật admin, thay đổi màu tên admin đặc trưng và vòng sáng admin" — chọn mẫu A): tên vàng kim + vòng
// sáng danh hiệu Võ lâm liên đấu Quán quân của client (vocong.js QT_VONG). Mình: World.laQt (main.js theo Net.me.admin); người khác: cờ qt máy chủ
// gửi (may-chu/the-gioi.js)
const QT_MAU = "#ffd700";
// Tọa Vọng Vô Ngã / nội lực hộ thân % (anh 14/11 chốt): hiệu lực tối đa 99 % dù tổng kỹ năng + trang bị cao hơn — mỗi đòn luôn trừ ít nhất 1 % (làm tròn lên) vào sinh lực (guard)
const HO_THAN_MAX = 99;
// dòng bang mẫu 4 (anh 14/11): màu chức vụ theo bậc — bang chủ đỏ cam, trưởng lão vàng, đội trưởng xanh trời, đệ tử / ẩn sỹ / khác trắng (tránh trùng màu tên 3 phe);
// BH_CV_CHU: chữ chức mặc định -> mã (khi máy chủ không gửi mã); BH_RONG: bề ngang chữ đã đo (phông 13 đã nạp)
const BH_CV_MAU = { chu: "#ff7a5c", lao: "#ffd84e", doi: "#6fd3ff" };
const BH_CV_CHU = { "Bang chủ": "chu", "Trưởng Lão": "lao", "Đội trưởng": "doi" };
const BH_RONG = new Map();
// tầm vòng sáng hỗ trợ của người khác = tầm chiêu của client × VONG_TAM (anh 31/10 "tăng hiệu quả vòng sáng nga mi, thiếu lâm, hiện tại phạm vi
// hơi nhỏ" — 180 -> 360 đơn vị client)
const VONG_TAM = 2;
// Trợ Thủ xoay vòng sáng Nga My (anh 03/11 — World.xoayVong): ô tay phải đổi vòng mỗi XOAY_GIAY giây; vòng vừa đổi còn tác dụng thêm thời gian
// trạng thái của client (vocong.js vongGiu) + VONG_DU (vòng sắp hết đúng lúc tới lượt thì khỏi chập chờn)
const XOAY_GIAY = 0.5, VONG_DU = 0.2;
const VONG_NM = 1.3; // vòng sáng Nga My: tầm × 1,3 nữa (anh 03/11 — World.tamVong)
// tên boss thế giới (drawMobLabel): tiền tố "Boss Hoàng Kim -" vàng 234,189,11 + tên đỏ 255,62,62 — 2 màu tên quái của engine KNpc::PaintInfo (quái
// hoàng kim / có vòng sáng; loại vàng 12–16 mạnh nhất); không trùng màu tên người chơi theo phe (cam / hồng tím / xanh lá)
const BTG_TIEN = "#eabd0b", BTG_MAU = "#ff3e3e", NHIM_MAU = "#ffd54a";
const RESPAWN = [4, 8];               // giây
const PLAYER_REVIVE = 3;
const DIE_TIME = 1.2;                 // hết động tác ngã (drawHero: Die 1,2 s) thì báo onRevive -> bảng "Bạn đã bị trọng thương!"
const HIT_FX = 63;                    // đạn của võ công đánh thường 53 (missles.txt "Công kích vật lý"): hình trúng đòn 刀剑爆炸.spr
const NAME_UP = 11;                   // chân chữ tên cao hơn đỉnh hình 11 điểm: dưới tên còn thanh máu (chân chữ + 5, cao 4) + 2
// WaitTime của skills.txt (đòn thường mã 53: 5) KHÔNG phải thời gian đứng chờ giữa 2 đòn: bảng mốc tốc độ của client (anh gửi 26/10) chỉ
// tính khung động tác (101 % = 8 khung = 2,25 đòn / giây). Bản đầu đứng thêm 5 vòng sau mỗi đòn / chiêu -> khựng, chậm hơn bảng (chỉ
// Tiểu Lý Phi Đao WaitTime 0 là đúng nhịp — anh báo 26/10)
const ATK_WAIT = 0;
const PICK = 30, DROP_MAX = 60;       // nhặt vật rơi khi tới cách ≤ 30 (px bản đồ web); số vật nằm trên đất tối đa
const LOOT_R = 360;                   // tự đánh: tự đi nhặt vật trong chừng này
// Trợ Thủ nhặt đồ (anh 27/10 "thấy bỏ đồ quá trời"; anh 28/10 "đánh 1 con quái xong lại khựng 1 lát"): hạ quái xong đánh con kế NGAY — bản
// 27/10 đứng chờ kết quả máy chủ (kèm nhịp sau, qua mạng chậm hơn) + 1,2 giây cho đồ rơi hẳn nên khựng sau mỗi con. Nay đồ rơi xuống đất
// xong thì bỏ dở con đang đánh (lúc giữa 2 đòn), đi nhặt hết trong phạm vi rồi mới đánh tiếp. Sinh lực dưới NHAT_MAU thì đánh tiếp, nhặt sau
const NHAT_MAU = 0.35;
// Trợ Thủ theo sau (tổ đội — anh 28/10 lần 4): cách người đang theo quá THEO_XA thì bỏ quái / đồ, chạy lại tới cách THEO_GAN; đứng gần thì đánh
// quái trong THEO_TIM quanh người đó. Đánh cùng mục tiêu với đội trưởng: bãi quái riêng -> con gần chỗ đội trưởng đang đánh nhất, trong
// THEO_MUC quanh chỗ đó; quái chung / Vượt Ải -> đúng con đội trưởng đang đánh (mã chung — World.mucDoi), đánh con đó thì chỉ bỏ khi cách người
// đang theo quá THEO_CUNG. Anh 02/11 ("theo sau cho đứng gần đội trưởng 1 chút, khoảng cách theo sau sát để đánh cùng 1 mục tiêu" — bản trước
// 260 / 110 / 420): không đánh, không nhặt mà cách quá THEO_SAT thì chạy lại sát người đó (cách THEO_GAN). Anh 03/11 ("nhặt đồ bị ảnh hưởng
// bởi theo sau … cho nó cơ chế nhặt xong rồi theo sau tiếp" — trước đi nhặt quá THEO_XA là bỏ chạy về, tới nơi lại đi nhặt mãi không tới): chỉ
// nhặt vật trong THEO_NHAT − 60 quanh người đang theo, đang đi nhặt thì chỉ bỏ khi cách người đó quá THEO_NHAT
const THEO_XA = 240, THEO_GAN = 45, THEO_SAT = 90, THEO_TIM = 160, THEO_CUNG = 360, THEO_MUC = 320, THEO_NHAT = 480;
// cờ đội trưởng (anh 28/10 lần 6): đội còn nhận người -> hình "đội ngũ mở" của client (\spr\npcres\style\menustate01.spr — cong-cu/dung-co-doi.js,
// dải khung + { w, h, cx, cy, n, ms }) trên đầu đội trưởng, như engine KNpcRes::DrawMenuState: tâm hình cao hơn khối tên / thanh máu 40 điểm
// client, chạy vòng các khung. Tải 1 lần lúc cần. Giao dịch (anh 30/10 — may-chu/giao-dich.js): đang mở giao dịch = menustate02, đang giao dịch =
// menustate03 (nguyên bảo) — engine chỉ có 1 trạng thái menu nên 1 cờ: đang giao dịch > mở giao dịch > đội mở
const CO = {};
function coAnh(ten) {
  if (!CO[ten]) {
    const C = (CO[ten] = { ok: false, img: new Image(), m: null });
    fetch(`assets/web/npc/${ten}.json`).then((r) => r.json()).then((m) => { C.m = m; C.img.onload = () => (C.ok = true); C.img.src = `assets/web/npc/${ten}.png`; }).catch(() => {});
  }
  return CO[ten].ok ? CO[ten] : null;
}
// nhẫn / dây chuyền / ngọc bội (mã loại món của client 3 / 4 / 9 — SLOT_OF): Trợ Thủ "chỉ nhặt trang sức"
const laTrangSuc = (k) => [3, 4, 9].includes((ItemDB.item(k) || {}).t);
// người chơi khác: vẽ trễ (giây) = độ chậm lớn nhất gần đây của tin tới (so với lần tới nhanh nhất) + khoảng cách 2 mốc + OTHER_DU — đủ để
// lúc nào cũng có 2 mốc mà nội suy; tối đa 3 giây. Độ chậm nhớ lâu rồi quên dần (× OTHER_LAG_KEEP mỗi lần nhận). Anh 02/11 ("giữa 2 acc vẫn
// còn khoảng lag và delay"): mốc 10 lần / giây (main.js SAMPLE_MS — bản trước 4), dư 0,05 (bản trước 0,1), nhớ × 0,98 (mốc dày hơn) -> vẽ trễ
// khoảng 0,25 giây thay vì 0,48
// OTHER_LAG_GIAM (độ mượt bước 1, 13/11 tối): độ chậm quên dần theo thời gian — × 0,76 mỗi giây (nửa đời ~2,5 giây), không theo số tin nhận (mốc 4–20 lần / giây)
const OTHER_DELAY_MAX = 3, OTHER_LAG_KEEP = 0.98, OTHER_DU = 0.05, OTHER_LAG_GIAM = 0.76;
// đồng hồ vẽ êm (anh 05/11 "nâng mượt thêm 1 xíu, sắp mở pk" — đo mạng lúc nhanh lúc chậm: 10 lần đứng hình / 19 giây, chạy bù 121–228 điểm/giây):
// thời điểm vẽ không nhảy theo độ chậm nữa mà bám dần — nhanh tối đa VE_NHANH, chậm tối đa VE_CHAM (theo lệch × VE_BAM mỗi giây); còn dưới VE_SAP_HET
// giây mốc phía trước thì chậm lại; hết mốc thì dừng ở mốc cuối (tin tới thì đi tiếp — không nhảy); lệch quá VE_DAT giây (mới thấy, tải lại trang,
// mất tin lâu) thì đặt thẳng. Dùng chung cho quái chung theo chủ bãi (quaichung.js). GIU_CHAY: dừng ngắn hơn chừng này vẫn giữ động tác chạy
export const VE_NHANH = 1.08, VE_CHAM = 0.85, VE_BAM = 2, VE_SAP_HET = 0.06, VE_DAT = 1;
// anh 06/11 ("quái đánh … không có tính đều đặn"): lệch dưới VE_LUOI giây thì đồng hồ vẽ chạy đúng nhịp (× 1) — không nhanh / chậm theo từng chút đổi
// của độ chậm mạng (nhịp vung đòn, bước chạy đều hơn); lệch hơn thì bám như cũ phần vượt
const VE_LUOI = 0.03;
// bot Tống Kim (World._mocBot — 1 đồng hồ cả trận): độ chậm quên chậm hơn (× BOT_NHO mỗi 0,1 giây), dư BOT_DU — máy chủ trận chạy não 20 bot hay hụt
// khung (tin cách 120–220 ms), đo thử: hết mốc 1,2 % -> 0,3 % khung, trễ thêm ~40 ms. Soát lần 2 06/11: trước đó quên theo từng dòng bot (nhanh hơn
// nhiều); sửa quên theo thời gian, đo lại (kt-tkm, 10 bot / phe, trễ giả): hết mốc 1,6 % -> 0 %, trễ vẽ trung vị ~280 -> ~370 ms
const BOT_NHO = 0.99, BOT_DU = 0.08;
const GIU_CHAY = 0.2;
// bước đồng hồ vẽ êm: vt = thời điểm đang vẽ, dich = thời điểm nên vẽ, cuoi = mốc mới nhất đã có, dt = thời gian trôi -> vt mới
export function buocVe(vt, dich, cuoi, dt) {
  if (vt == null || !Number.isFinite(vt) || Math.abs(dich - vt) > VE_DAT) return Math.min(dich, cuoi);
  const l = dich - vt, du = Math.sign(l) * Math.max(0, Math.abs(l) - VE_LUOI);
  let k = Math.max(VE_CHAM, Math.min(VE_NHANH, 1 + du * VE_BAM));
  if (cuoi - vt < VE_SAP_HET) k = Math.min(k, VE_CHAM);
  return Math.max(vt, Math.min(vt + dt * k, cuoi));
}
// thời gian 1 đòn thường: "Tốc độ đánh +%" của đồ rút ngắn (vd +25 % -> 18 / 1,25 vòng)
const atkDurOf = (st) => R.atkFrames(18, st.atkSpeed) * TICK; // mốc tốc độ đánh như client (rules.atkFrames)
// dòng của bùa hại người phe kia cộng vào chỉ số của mình (bonus — Tống Kim / lôi đài)
const BUA_CHI_SO = /^(fastwalkrun_p|attackspeed_v|attackspeed_yan_v|castspeed_v|castspeed_yan_v|lifereplenish_v|manareplenish_v|rangedamagereturn_p|meleedamagereturn_p)$/;

let seed = (Date.now() % 2147483647) || 1;
export const rand = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
const rnd = (a, b) => a + rand() * (b - a);
const pick = (a) => a[Math.floor(rand() * a.length)];

// Chữ kiểu client: font VK Sans Serif của client (Vn.fon, assets/ui/hud/font), viền đen 1 điểm quanh nét như
// KCanvas::DrawFontWithBorder. Tọa độ làm tròn để nét bitmap không nhòe.
// Anh 06/11 Tống Kim ("giật 3–9 fps", máy Intel UHD 770): mỗi chữ vẽ 9 lần (8 viền + 1) — trận ~100 bot / quân có tên + máu + chức là 900–1.800 lần
// vẽ chữ mỗi khung, card đồ họa gánh không nổi. Nay chữ (nội dung + màu + cỡ + căn lề) vẽ 1 lần rồi giữ lại, mỗi khung chỉ dán. Font client chưa nạp
// xong (document.fonts) thì vẽ thẳng như cũ, không giữ chữ font thay thế
// Anh đo lần 4 (06/11 — Công cụ thử "Đo giật"): ẩn tên / máu FPS 34 -> 58 dù đã giữ ảnh từng chữ — mỗi chữ 1 canvas riêng = 1 "texture" riêng, card đổi
// nguồn ~100 lần mỗi khung. Nay MỌI chữ vẽ chung vào 1 canvas lớn (BANG — xếp theo hàng; card dán từ cùng 1 nguồn, gộp 1 lượt); đầy thì xóa làm lại
// Anh 06/11 lần 5 ("tên của 1 số NPC và bot lỗi hay sao ấy" — ảnh: "Phó tướng" mất chữ "ướ" thành khối đen, tên bot có ô đen ở góc): soát trên chính máy anh
// (Edge, Intel UHD 770 — canvas vẽ bằng card đồ họa) đọc lại bảng chữ giữa trận bắt được ô hỏng ngay lúc vẽ: "_VoDanh_" thành "_Vo▮ê▮h_", "Kim binh (Chậm)"
// mất "ậ" — card thỉnh thoảng tô sai / sót nét ở lần tô màu (lần viền đen vẫn đủ). Vẽ thẳng mỗi khung thì khung sau vẽ lại nên không ai thấy; giữ trong bảng
// thì sai mãi. Nay chữ mới vẽ 9 lần trên canvas nháp vẽ bằng CPU (NHAP — willReadFrequently: không qua card đồ họa) rồi dán 1 lần vào ô đã xóa sạch của bảng;
// ô theo khung font (fontBoundingBox* của font + đường chân chữ đang dùng) × bề ngang chữ (measureText().width theo căn lề), cộng phần nét lấn ra ngoài
// (dấu chồng cao, ký hiệu font khác: †, ™, ๖ۣۜ …), chừa DEM điểm mỗi bên + bề dày viền; bảng đầy thì lấy canvas mới (không xóa canvas đang được dán dở trong
// khung); card mất ngữ cảnh thì bỏ bảng làm lại; chữ có ký tự thuộc phần font chưa nạp xong (IBM Plex Mono tách theo bảng mã) thì vẽ thẳng tới lúc nạp xong.
// Canvas vẽ phóng (điện thoại dpr 2, màn 125 %, phóng cảnh): ô chữ vẽ đúng tỉ lệ đó rồi dán khớp từng điểm ảnh màn (trước dán ảnh chữ 1× phóng lên -> mờ)
const BANG_W = 2048, BANG_H = 1024, VIEN = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]], DEM = 4;
let BANG = null, NHAP = null; // BANG: { c, g, x, y, h (cao hàng đang xếp), m: Map(khóa -> { c, sx, sy, w, h, ox, oy, tw }) }; NHAP: { c, g } canvas nháp CPU
const NAP = new Set(); // chữ đã nhờ document.fonts.load (phần font chưa nạp) — nhờ 1 lần
const chuFont = (px) => `${px}px "VK Sans Serif ${px}", "IBM Plex Mono", monospace`;
function veChu(g, s, x, y, color) { g.fillStyle = "#000"; for (const [dx, dy] of VIEN) g.fillText(s, x + dx, y + dy); g.fillStyle = color; g.fillText(s, x, y); }
function bangChu() {
  if (BANG && BANG.g.isContextLost && BANG.g.isContextLost()) BANG = null;
  if (!BANG) {
    const c = document.createElement("canvas"); c.width = BANG_W; c.height = BANG_H;
    const B = { c, g: c.getContext("2d"), x: 0, y: 0, h: 0, m: new Map() };
    c.addEventListener("contextlost", () => { if (BANG === B) BANG = null; });
    BANG = B;
  }
  if (!NHAP) { const c = document.createElement("canvas"); NHAP = { c, g: c.getContext("2d", { willReadFrequently: true }) }; }
  return BANG;
}
// chữ mới -> ô trong bảng { c, sx, sy, w, h, ox, oy (điểm neo trong ô, điểm ảnh màn), tw (bề ngang chữ) } | null (vẽ thẳng); k = tỉ lệ canvas đích
function oChu(B, khoa, s, font, color, px, al, bl, k) {
  if (!document.fonts.check(font, s)) { if (!NAP.has(font + s)) { if (NAP.size > 500) NAP.clear(); NAP.add(font + s); document.fonts.load(font, s).catch(() => {}); } return null; }
  const N = NHAP, g = N.g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = font; g.textAlign = al; g.textBaseline = bl;
  const m = g.measureText(s), tw = m.width;
  const fa = Number.isFinite(m.fontBoundingBoxAscent) ? m.fontBoundingBoxAscent : px, fd = Number.isFinite(m.fontBoundingBoxDescent) ? m.fontBoundingBoxDescent : px * 0.3;
  const x0 = al === "center" ? -tw / 2 : al === "right" || al === "end" ? -tw : 0; // mép trái chữ so với điểm neo (start / end: chữ trái -> phải)
  const L = Math.max(-x0, m.actualBoundingBoxLeft || 0), R = Math.max(x0 + tw, m.actualBoundingBoxRight || 0);
  const A = Math.max(fa, m.actualBoundingBoxAscent || 0), D = Math.max(fd, m.actualBoundingBoxDescent || 0);
  const p = DEM + Math.ceil(k), ox = p + Math.ceil(L * k), oy = p + Math.ceil(A * k), w = ox + Math.ceil(R * k) + p, h = oy + Math.ceil(D * k) + p;
  if (!(w > 0 && h > 0) || w > BANG_W || h > 256) return null;
  N.c.width = w; N.c.height = h; // đặt cỡ = xóa trắng nháp (trạng thái vẽ đặt lại dưới)
  g.font = font; g.textAlign = al; g.textBaseline = bl;
  g.setTransform(k, 0, 0, k, ox, oy); veChu(g, s, 0, 0, color); g.setTransform(1, 0, 0, 1, 0, 0);
  if (B.x + w > BANG_W) { B.x = 0; B.y += B.h + 1; B.h = 0; } // hàng mới
  if (B.y + h > BANG_H) { BANG = null; B = bangChu(); } // đầy: bảng mới
  B.g.clearRect(B.x, B.y, w, h);
  B.g.drawImage(N.c, 0, 0, w, h, B.x, B.y, w, h);
  const n = { c: B.c, sx: B.x, sy: B.y, w, h, ox, oy, tw }; B.m.set(khoa, n);
  B.x += w + 1; B.h = Math.max(B.h, h);
  return n;
}
function jxText(ctx, s, x, y, color, px = 13) {
  s = String(s);
  const font = chuFont(px), al = ctx.textAlign, bl = ctx.textBaseline;
  x = Math.round(x); y = Math.round(y);
  const T = typeof document !== "undefined" && document.fonts && ctx.getTransform ? ctx.getTransform() : null, k = T ? T.a : 0;
  if (k > 0 && T.d === k && !T.b && !T.c) { // canvas chỉ dời + phóng đều (cảnh game)
    const B = bangChu(), khoa = `${px}|${color}|${al}|${bl}|${k}|${s}`, n = B.m.get(khoa) || oChu(B, khoa, s, font, color, px, al, bl, k);
    if (n) { // dán ô: điểm neo rơi đúng điểm ảnh màn, 1 điểm ảnh ô = 1 điểm ảnh màn
      const dx = Math.round(k * x + T.e) - n.ox, dy = Math.round(k * y + T.f) - n.oy;
      ctx.drawImage(n.c, n.sx, n.sy, n.w, n.h, (dx - T.e) / k, (dy - T.f) / k, n.w / k, n.h / k);
      return n.tw; // -> bề ngang chữ (label)
    }
  }
  ctx.font = font;
  veChu(ctx, s, x, y, color);
  return ctx.measureText(s).width;
}
// bảng hiệu bày bán của client (摆摊广告条.ini — win.json bienhieu: mảnh trái 18 + giữa kéo dài + phải 18, cao 20, chữ vàng TextColor) — nạp 1 lần
let BH = null;
function bhAnh(P) {
  if (BH) return BH.ok ? BH : null;
  const M = P.win && P.win.M && P.win.M.bienhieu && P.win.M.bienhieu.sec.Main;
  if (!M) { BH = { ok: false }; return null; }
  BH = { ok: false, mau: `rgb(${(M.textColor || [255, 217, 78]).join(",")})` };
  let con = 3;
  for (const [k, f] of [["L", "headImageLeft"], ["M", "headImageMid"], ["R", "headImageRight"]]) { const im = new Image(); im.onload = () => { if (!--con) BH.ok = true; }; im.src = P.win.base + M[f].file; BH[k] = im; }
  return null;
}

// Bẫy bản nhái (anh 11/11: "thêm vào các câu troll, mỉa mai để khi họ copy về thì nó chạy trên web của họ" -> "Làm luôn" — README lượt 73): chạy ở
// tên miền KHÁC tên miền bản gốc / máy thử / mạng LAN (tự kiểm riêng bằng mã băm djb2 — không dùng chung main.js mienDung / net.js mienMay mà bản
// nhái đã gỡ) thì sau 15–25 phút chơi (bản nhái thử vài phút không thấy), cứ 6–10 phút 1 câu ở khung chat hệ thống (câu 1 + 5 thêm ở ô chữ đỏ dưới
// khung chat). Chỉ hiện chữ — không chặn, không phá máy / dữ liệu người chơi bên đó, không tự chuyển trang. Ở tên miền của anh: kiểm 1 lần rồi thôi.
// Câu viết dạng mã số (_mc, mỗi câu 1 khóa) — tìm chữ không ra. ĐỔI TÊN MIỀN BẢN GỐC thì thêm mã băm djb2 mới vào NHA_GIO (cùng lúc với
// main.js mienDung + net.js mienMay), không thì người chơi của anh cũng thấy câu.
const _d2 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0; return h; };
const NHA_GIO = [1080360492, 3152482207, 906931598, 244220258, 193442122]; // s343clgt.duckdns.org (S2), chanlong.duckdns.org (S1 — anh 12/11), localhost (cả *.localhost), [::1], ::1
const _mc = (a, k) => String.fromCharCode(...a.map((c, i) => c ^ ((k + i * 13) & 0xff)));
const CAU_GIO = [
  [0x2d, [126,95,53,34,4,28,91,230,117,219,143,223,161,7799,154,208,159,7849,121,4,82,86,162,40,69,17,7832,237,185,240,70,224,129,56,138,212,72,106,119,77,21,245,111,15,91,86,403,7747,189,242,214,170,185,254,143,151,37,90,122,67,25,4,169,25,77,22,103,249,143,142,249,7787,187,194,136,7725,106,44,3,67,14,126,100,7,29,25,255,182,193,199,220,167,189,136,128,46,98,104,64]], // Server này chạy bản chép của Võ Lâm Idle · S2 Đồ Xanh do Heo Búy làm. Bản gốc: s343clgt.duckdns.org
  [0x71, [50,22,98,232,133,213,222,161,188,198,135,104,225,58,73,92,32,32,51,68,85,225,231,117,217,150,466,352,7742,137,215,103,240,119,11,76,167,63,127,1,7842,239,179,203,197,73,233]], // Chép game thì nhanh, chép được cái tâm mới khó.
  [0x13, [81,7811,67,26,32,7813,2,78,13,7779,244,130,204,7697,185,246,141,152,7760,126,55,72,209,30,7828,120,372,144,6,172,250,85,147,174,170,187,158,212,8213,46,122,76,88,43,33,124,10,30,384,253,189,233,195,182,189,245,168,212,37,81,107,94,85,109,5,64,1,7893,234,186]], // Bản gốc vừa cập nhật là ở đây có ngay — admin chăm Ctrl+C, Ctrl+V lắm.
  [0x5b, [22,7871,28,162,227,7739,199,150,139,181,178,202,181,254,104,62,89,89,101,48,7932,2,89,235,7752,201,129,154,180,177,147,152,158,122,53,76,207,69,105,58,7874,25,93,173,228,69,223,217,235,172,7748,157,216,44,109,78,86,47,109,46,21,27,239,233,187,222,71,172,168,252,216,214,119,121,7842,68,80,106]], // Mỗi lần Heo Búy ra bản mới, server này lại 'sáng tạo' theo trong vòng 1 tiếng.
  [0x66, [43,6,7761,227,186,196,220,352,167,251,138,7766,108,47,123,7928,85,111,112,54,2,7864,237,177,253,195,7781,229,188,184,348,7716,111,51,84,76,26,36,60,136,30,65,168,230,145,155,143,170,186,132,132,211,110,98,71,90,90,37,43,75,29,13,235]], // Muốn chơi bản gốc, khỏi chờ người ta chép: s343clgt.duckdns.org
  [0x39, [116,7935,60,90,77,29,230,249,196,142,7780,232,452,0,150,220,101,99,215,94,29,41,63,7881,28,94,227,313,203,146,221,7791,183,198,148,7889,110,58,76,92,46,7917,53,15,85,179,175,232,192,7689,173,183,243]], // Mẹo: game ở đây luôn chậm hơn bản gốc khoảng 1 tiếng.
];
let _gio = null; // null: chưa kiểm · false: tên miền nhà — thôi · { t, i }: lúc câu kế, câu kế
function _nhipGio(P, t) {
  if (_gio === false) return;
  if (!_gio) {
    const h = String(location.hostname || "").toLowerCase(), p = h.split(".");
    const lan = p.length === 4 && p.every((x) => /^\d{1,3}$/.test(x)) && (p[0] === "127" || p[0] === "10" || (p[0] === "192" && p[1] === "168") || (p[0] === "172" && +p[1] >= 16 && +p[1] <= 31));
    if (lan || h.endsWith(".onrender.com") || NHA_GIO.includes(_d2(h)) || NHA_GIO.includes(_d2(p[p.length - 1]))) { _gio = false; return; }
    _gio = { t: t + (900 + Math.random() * 600) * 1000, i: 0 };
  }
  if (t < _gio.t || !P || !P.hud) return;
  const i = _gio.i++ % CAU_GIO.length, c = _mc(CAU_GIO[i][1], CAU_GIO[i][0]);
  try { P.hud.chat("CH_SYSTEM", "", c); if (i === 0 || i === 4) P.hud.canh(c); } catch {}
  _gio.t = t + (360 + Math.random() * 240) * 1000;
}

export class World {
  // P = { jx, npc, audio, mons (assets/data/monsters.json .mons) }, hero = nhân vật đã tạo,
  // opt = { at: [x, y] chỗ đứng, hp / mp: phần sinh lực / nội lực lúc vào (đổi bản đồ giữ nguyên; hồi sinh ở thành), rest: dưỡng sức
  // (tự ngồi tới khi đầy rồi onRested), canBang: cau-hinh.json canBang (máy chủ gửi trong luat) }
  constructor(P, map, zone, hero, opt = {}) {
    this.P = P; this.map = map; this.zone = zone; this.hero = hero;
    this.mobs = []; this.texts = []; this.fxs = []; this.time = 0; this.kills = 0; this.demTA = 0; this.demBoss = 0; this.nextId = 1;
    this.dongMinh = []; // Phong Hỏa Liên Thành: vệ binh / tướng quân phe mình (src/game/phonghoa.js — không làm mục tiêu, chiêu không trúng)
    this.luyenDem = new Map(); // mã chiêu luyện -> số lần trúng quái chưa gửi (vocong.js misHit, main.js takePending)
    // tự đánh tắt khi tạo (anh 29/10 "nhân vật lúc mới vào game tự động di chuyển ra ngoài Ba Lăng"): bản trước bật sẵn — vào game, main.js
    // gán world rồi còn chờ tải hình nhân vật / ô bản đồ (qua mạng vài giây tới 20 giây), đồng hồ dự phòng chạy World trong lúc đó nên nhân vật
    // tự nhắm mộc nhân / chạy tới tọa độ Trợ Thủ, tắt tự đánh xong vẫn đi tiếp đường cũ. Đổi bãi: main.js loadZone giữ trạng thái của bãi trước
    this.auto = false;
    // cờ của công cụ thử (src/game/devtool.js): bất tử, 1 đòn chết, dừng sinh quái, bấm đất = dịch chuyển, vẽ lưới vật cản + đường đi
    this.dev = { god: false, oneHit: false, noSpawn: false, tp: false, grid: false };
    const look = P.jx.look({ sex: hero.sex, ...looksOf(hero) });
    R.fixPoints(hero);
    this.wk = weaponKind(hero);
    this.vcOpen = opt.vcOpen !== false; // phái đã mở võ công (cau-hinh.json voCong.moPhai — main.js vcOpen)
    const st = R.heroStats(hero, P.chr, this.bonus(opt.buffs || new Map()));
    const [x, y] = opt.at || map.randomSpot(rand) || [map.w / 2, map.h / 2], k = opt.hp ?? 1;
    this.shots = [];
    this.drops = [];
    this.player = { kind: "hero", x, y, dir: 0, act: "stand", t: 0, look, ...st, ...this.weaponAtk(), atkDur: atkDurOf(st), hp: Math.max(1, Math.round(st.hpMax * k)), mp: Math.round(st.mpMax * (opt.mp ?? k)), st: st.stMax, target: null, path: null, goal: null, atkT: 0, hitDone: false, deadT: 0,
      cd: {}, buffs: opt.buffs || new Map(), once: null };
    // còn sống như quái (m.alive): đạn bám mục tiêu của quái có võ công nhắm người chơi (vocong.js misStep)
    Object.defineProperty(this.player, "alive", { get() { return this.hp > 0; } });
    this.vcSupport = skillSupport(hero, P.skillDb || {});
    this.onLevel = null; this.onDeath = null; this.onRevive = null; this.onRested = null; this.onTalk = null;
    // NPC thôn / thành (main.js đặt theo dữ liệu máy chủ): { key (khóa phái | null), name, type (hình kho NPC), role (talk | dummy), x, y, dir };
    // bấm -> đi tới gần -> onTalk(npc); cọc gỗ / bao cát (dummy) không bấm được. Vật bản đồ (rương chứa đồ — 26/10): { obj (DataID — hình kho
    // vật assets/web/roi), viec, name, x, y } cũng nằm trong danh sách này, bấm như NPC
    this.npcs = (opt.npcs || []).map((n) => ({ t: rand() * 2, dir: 0, ...n, kind: "npc" }));
    // độ bền đồ (anh 26/10 "sửa đồ"): số lần [ra đòn, bị đánh trúng mất máu, sang vùng bản đồ client khác] — main.js gửi kèm nhịp, máy chủ
    // trừ độ bền theo tỉ lệ client (may-chu/do.js hao)
    this.hao = [0, 0, 0]; this._atkN = 0; this._vung = null;
    this.others = new Map(); // người chơi khác cùng bản đồ (setOthers) — tên -> { kind: "other", … }
    this.phanThan = []; // phân thân đang theo mình ở bãi train (Phân Thân — anh 05/11, nhanvatmay.js datPhanThan; kind "other" + pt)
    this.tk = null; // Tống Kim: trạng thái trận khi mình ở trong trận (src/game/tongkim.js — bot, người phe kia, phe mình, máy chủ trận) | null
    this.bhMinh = null; // dòng bang trên đầu mình { nhan: "Tên bang(Chức)" } | null (anh 14/11 — main.js bhMinhApply)
    this.ptKhac = new Map(); // phân thân của người khác cùng bãi (setOthers mục pt — may-chu/the-gioi.js): chỉ vẽ, không vào others (mời đội, giao dịch, vòng sáng…)
    this.vongHan = new Map(); // vòng sáng hỗ trợ của mình còn tác dụng: mã -> { lv, het } (vongCapNhat)
    this.resting = !!opt.rest;
    // thiết lập bản đồ của client (assets/data/maplist.json): hệ quái tự động + tỉ lệ 5 hệ
    const mm = P.maps.maps[zone.map], cid = mm && mm.client ? mm.client.id : zone.jmo;
    this.mapInfo = (P.maplist && P.maplist.maps[cid]) || null;
    this.canBang = opt.canBang || null; // hệ số cân bằng theo bãi + luật trùm (spawnMob)
    this.tanThu = opt.tanThu || null; // vòng sáng tân thủ (cau-hinh.json tanThu — tanThuCong, vocong.js vcStateList)
    this.tanThuCong(this.player);
    this.kyNang = opt.kyNang || null; // % sát thương võ công theo phái / chiêu (cau-hinh.json kyNangPhai — F10 → Cấu hình, anh 11/11; vocong.js kyK)
    this.noiCong = +opt.noiCong || 0; // luật riêng S1 (anh 29/10): % sát thương chiêu nội công mỗi điểm Nội công (cau-hinh.json noiCong — vocong.js noiK)
    // quái có võ công (anh 29/10 lần 4 — bản mẫu, cau-hinh.json quaiVoCong; null = tắt): quái ra chiêu 1x / 6x của phái cùng hệ, giật / làm chậm /
    // choáng / độc lên người chơi, Băng sát lên quái như engine — vocong.js ganVoCong, quaiRaChieu, misHitHero
    this.quaiVC = opt.quaiVC && opt.quaiVC.bat && P.vc ? opt.quaiVC : null;
    // số quái cùng lúc (anh 27/10 "map hơi ít quái"): canBang.bai[mã].soQuai > canBang.soQuai > MOB_CAP
    const cb = this.canBang, sq = (cb && cb.bai && cb.bai[zone.id] && cb.bai[zone.id].soQuai) ?? (cb && cb.soQuai);
    this.cap = sq > 0 ? Math.round(sq) : MOB_CAP;
    // bản đồ dựng nguyên rất rộng (Phong Lăng Độ 14592 × 10752 — anh 27/10): quái sinh ở ĐIỂM ĐẶT QUÁI của máy chủ client (opt.diem — file vùng
    // mục 2, đúng bờ của bãi), chọn điểm quanh người chơi (DIEM_R), quái ở quá xa thì bỏ để sinh lại gần. suKien (thuyền Phong Lăng Độ): không
    // tự sinh / sinh lại, không thủ lĩnh / tinh anh — main.js sinh theo giờ của thuyền
    this.diem = opt.diem && opt.diem.length ? opt.diem : null;
    this.suKien = !!opt.suKien;
    if (zone.m && zone.m.length && !this.suKien) for (let i = 0; i < this.cap; i++) this.spawnMob(false, 200);
  }

  // ---------- quái ----------
  // opt (công cụ thử): id quái, lvl cấp, series hệ, near [x, y] = sinh quanh điểm đó (120–260 logic), aggro = lao vào đánh ngay.
  // Boss Sát thủ (main.js datBossSat): at [x, y] = đứng đúng chỗ đó, sat = số hiệu boss (báo giết loại 3), ten = tên hiện trên đầu.
  // quanh [x, y]: bản đồ dựng nguyên — chọn điểm đặt quái quanh chỗ đó thay vì quanh mình (quái chung: quanh 1 người trong bãi — quaichung.js thu).
  // Hệ mỗi con ngẫu nhiên, chia đều 5 hệ ở mọi bãi (anh 01/11 — mapSeries).
  spawnMob(boss, minDist = 320, opt = {}) {
    const Z = this.zone, id = opt.id ?? (boss ? Z.boss : Z.m && Z.m.length ? pick(Z.m) : null), def = this.P.mons[id];
    if (!def) return null;
    const p = this.player, c = opt.quanh || (p ? [p.x, p.y] : null);
    const tranh = (x, y) => (c && ldist(x, y, c[0], c[1]) < minDist) || this.mobs.some((m) => m.alive && ldist(x, y, m.x, m.y) < 90);
    const spot = opt.at ? [opt.at[0], opt.at[1]] : opt.near ? this.spotNear(opt.near[0], opt.near[1], 120, 260) : this.diem ? this.diemGan(tranh, c) : this.map.randomSpot(rand, tranh);
    if (!spot) return null;
    // cân bằng theo bãi (cau-hinh.json canBang — máy chủ gửi trong luat; anh 26/10 "cân bằng theo tốc độ giết thật"): máu / sát thương quái
    // × hệ số của bãi. Trùm bãi: chỉ số của quái thường đầu tiên của bãi cùng cấp × hệ số trùm, giữ hình / tên / tầm đánh của trùm (client
    // có trùm 300 nghìn – 12 triệu máu kèm 800.000 kinh nghiệm, có trùm y hệt quái thường)
    // chiSo = mã quái lấy chỉ số thay cho quái của bãi (bãi phụ có quái client lỗi số: Vi sơn đảo kinh nghiệm 1 / con)
    const cb = this.canBang, B = (cb && cb.bai && cb.bai[Z.id]) || {}, T = boss && cb && cb.trum && Z.m && Z.m.length ? cb.trum : null;
    // cấp ngẫu nhiên trong bãi; capQuai (máy chủ tính — cau-hinh.json doKho): bỏ cấp bảng client nhảy xuống (Sa Mạc 2: cấp 100 còn theo công
    // thức bãi 90–100, máu gấp 3)
    const lvl = opt.lvl ?? Math.round(rnd(...(B.capQuai || [Z.lo, Z.hi])));
    const series = opt.series ?? this.mapSeries();
    // tinh anh (opt.ta): quái thường của bãi × hệ số kiểu quái hoàng kim của bản đồ (client npcgoldtemplate.txt — vd "Thông dụng (thấp)": máu
    // × 20, sát thương × 2, chính xác × 1,5, phòng thủ × 2; kinh nghiệm × 10 máy chủ tính)
    const TA = opt.ta && !boss && cb && cb.ta ? cb.ta[Z.id] : null;
    // Boss Sát thủ (opt.sat) dùng chỉ số của chính nó — không lấy chiSo của bãi (anh 28/10: 8 boss ở Vi sơn đảo / Mạc Bắc yếu như quái thường)
    // boss thế giới (opt.btg — bosstg.js) cũng vậy: chỉ số mẫu Boss Hoàng Kim cấp 95
    const sid = !opt.sat && !opt.btg && B.chiSo && this.P.mobstats.mobs[B.chiSo] ? B.chiSo : T ? Z.m[0] : id;
    const st = R.mobStats(def, sid, lvl, boss, this.P.reach[id], this.P.mobstats, series);
    const km = (B.mau ?? 1) * (T ? T.mau ?? 1 : 1) * (TA ? TA.mau : 1), kd = (B.satThuong ?? 1) * (T ? T.satThuong ?? 1 : 1) * (TA ? TA.st : 1);
    st.hpMax = Math.max(1, Math.round(st.hpMax * km)); st.dmg = st.dmg.map((v) => Math.round(v * kd));
    // độ khó tăng dần theo bãi (anh 28/10 "map sau quái mạnh và nhiều máu hơn map trước" — máy chủ tính, cau-hinh.json doKho): chính xác / né
    // tránh × hệ số của bãi; từ cấp doKho.tuCap thủ lĩnh / tinh anh máu đặt sẵn theo bãi (1,5 triệu / 800 nghìn ở bãi đầu, bãi sau nhiều hơn)
    st.ar = Math.max(1, Math.round(st.ar * (B.chinhXac ?? 1))); st.def = Math.round(st.def * (B.neTranh ?? 1));
    if (T && B.mauThuLinh) st.hpMax = B.mauThuLinh;
    if (TA && B.mauTinhAnh) st.hpMax = B.mauTinhAnh;
    if (T) st.exp = Math.floor(st.exp * (T.kinhNghiem ?? 1));
    if (TA) { st.ar = Math.round(st.ar * (TA.ar || 1)); st.def = Math.round(st.def * (TA.def || 1)); }
    const m = {
      kind: "mob", uid: this.nextId++, id, def, type: def.anim, name: def.n, lvl, boss, alive: true,
      x: spot[0], y: spot[1], home: spot, dir: Math.floor(rand() * 8), act: "stand", t: rand() * 2,
      ...st, hp: st.hpMax, aggro: false, atkT: 0, hitDone: false, path: null, repath: 0, wander: rnd(1, 4), deadT: 0,
      atkDur: 1, hurtDur: this.P.npc.duration(def.anim, "hurt") || 0.5,
    };
    if (opt.aggro) m.aggro = true;
    if (TA) { m.ta = true; m.dacBiet = true; } // Trợ Thủ ưu tiên "Tinh anh / Thủ lĩnh / Boss"
    if (opt.sat) { m.sat = opt.sat; m.name = opt.ten || m.name; m.dacBiet = true; } // Boss Sát thủ: tên cam như trùm
    if (this.quaiVC) this.ganVoCong(m); // quái có võ công (bản mẫu — vocong.js)
    this.mobs.push(m);
    this.P.npc.ensure(m.type);
    return m;
  }

  // điểm đặt quái quanh người chơi / quanh c [x, y] (trong DIEM_R, nới dần nếu hết chỗ), tránh sát người / sát quái khác
  diemGan(tranh, c) {
    const D = this.diem;
    for (const r of [DIEM_R, DIEM_R * 1.6, Infinity]) {
      const ds = D.filter(([x, y]) => (!c || ldist(x, y, c[0], c[1]) <= r) && !tranh(x, y));
      if (ds.length) { const [x, y] = ds[Math.floor(rand() * ds.length)]; return [x, y]; }
    }
    return null;
  }
  // quái thường ở quá xa (người chơi đã đi chỗ khác trên bản đồ rộng) và chưa đánh nhau: bỏ để sinh lại quanh người chơi
  boQuaiXa() {
    const p = this.player, xa = DIEM_R + 600;
    this.mobs = this.mobs.filter((m) => !m.alive || m.boss || m.ta || m.sat || m.va || m.nhim || m.mcv || m.aggro || m === p.target || ldist(m.x, m.y, p.x, p.y) <= xa);
  }

  // hệ quái: chia đều 5 hệ ở mọi bãi (anh 01/11 "ngũ hành quái random đồng đều trên toàn bộ map, tránh map ra đa số toàn quái khắc hệ" —
  // Thục Cương sơn Mộc 80 %: Côn Lôn cấp 30 lên bị bu chết). Bản trước: bản đồ bật NpcSeriesAuto (settingsmaplist.ini) thì theo tỉ lệ 5 hệ của
  // client, không bật thì chia đều (anh chốt 23/10)
  mapSeries() { return Math.floor(rand() * 5); }

  // điểm đi được quanh (x, y), cách r0–r1 logic, đi thẳng tới được từ (x, y); không có thì ô đi được gần nhất
  spotNear(x, y, r0, r1) {
    for (let k = 0; k < 80; k++) {
      const a = rand() * Math.PI * 2, r = rnd(r0, r1), nx = x + Math.cos(a) * r, ny = y + (Math.sin(a) * r) / 2;
      if (this.map.walkable(nx, ny) && this.map.clear(x, y, nx, ny)) return [nx, ny];
    }
    if (!this.map.grid) return [x, y];
    const c = this.map.nearestCell(x, y, 30);
    return c >= 0 ? this.map.center(c) : null;
  }

  // ---------- công cụ thử ----------
  teleport(x, y) {
    const p = this.player;
    if (!this.map.walkable(x, y)) { if (!this.map.grid) return false; const c = this.map.nearestCell(x, y, 40); if (c < 0) return false; [x, y] = this.map.center(c); }
    p.x = x; p.y = y; p.path = null; p.goal = null; p.target = null; p.manual = false; p.stuckT = 0;
    // dịch chuyển (hồi sinh hậu doanh Tống Kim, bẫy cổng, Xa phu cùng bản đồ…) chấm dứt khinh công / lướt đang dở — trước đó nhịp sau jumpTick đặt lại
    // chỗ theo đường nhảy cũ (anh 16/11: "bị giết xong có báo về… mà nhân vật vẫn hồi sinh tại chỗ" — chết giữa lúc nhảy khinh công)
    if (p.jump) { p.jump = null; if (p.act === "jump") this.setAct(p, "stand"); }
    p.dash = null;
    return true;
  }
  // vẽ lại theo đồ đang mặc (hero.looks) + lên / xuống ngựa (hero.rideOff)
  applyLooks() { this.refreshStats(false); this.player.look = this.P.jx.look({ sex: this.hero.sex, ...looksOf(this.hero) }); return this.player.look; }
  // đòn thường theo vũ khí đang cầm: tầm (logic), đạn, có bay không (ám khí)
  weaponAtk() {
    const F = this.P.fx, b = F ? F.basic((this.hero.looks || {}).weapon || 1, !!this.hero.ranged) : { fx: HIT_FX, range: 75, fly: false };
    return { reach: b.range * SCALE, atkFx: b.fx, ranged: b.fly };
  }

  // ---------- điều khiển ----------
  // nút Ngồi của thanh dưới; trả về false nếu không ngồi được (đang chết)
  sit(on) {
    const p = this.player, h = this.hero;
    if (on && p.hp <= 0) return false;
    // như client: đang cưỡi ngựa không ngồi được ("Lúc cỡi ngựa không thể thiền tọa!" — stringtable_core G_CORESHELL_1; bảng ghép
    // cưỡi ngựa cũng không có động tác ngồi: SitDown = −1) -> main.js báo; phải xuống ngựa trước
    if (on && this.riding()) return false;
    p.sit = !!on;
    if (on) { p.target = null; p.path = null; p.goal = null; p.manual = false; this.setAct(p, "sit"); } else if (p.act === "sit") this.setAct(p, "stand");
    return true;
  }
  riding() { const h = this.hero; return !!(h.looks && h.looks.horse) && !h.rideOff; }
  // lên (on) / xuống ngựa — mọi đường đổi (nút, phím, Trợ Thủ tự xuống dưỡng sức / ra chiêu cấm ngựa, tự lên ngựa trong thành): đổi được (hoặc đã
  // đúng trạng thái) thì true; chưa đủ NGUA_CHO giây từ lần đổi trước thì false — người gọi báo câu client / chờ
  doiNgua(on) {
    const h = this.hero; if (!(h.looks && h.looks.horse)) return false;
    if (!!on === this.riding()) return true;
    const t = performance.now(); if (t - nguaLuc < NGUA_CHO * 1000) return false;
    nguaLuc = t; h.rideOff = !on; this.applyLooks();
    return true;
  }
  clickGround(x, y) {
    const p = this.player;
    p.talkTo = null;
    p.sit = false;
    if (this.dev.tp) { this.teleport(x, y); return; }
    if (p.hp <= 0) return;
    p.target = null; p.loot = null; p.goal = [x, y]; p.path = this.map.path(p.x, p.y, x, y); p.manual = true;
  }
  clickMob(m) {
    const p = this.player; if (p.hp <= 0 || !m.alive) return;
    p.talkTo = null;
    p.sit = false;
    p.target = m; p.loot = null; p.goal = null; p.path = null; p.manual = true;
  }
  // NPC dưới chuột (khung chọn như quái thường). coSap = false: bỏ qua NPC trông sạp chợ trời (anh 11/11 — máy tính bấm thường vào sạp = bấm đất,
  // Ctrl + chuột trái mới xem sạp: main.js mouseAct / sapDuoi); coSap = "chi": chỉ NPC trông sạp (soát 11/11: sạp đứng sát NPC thật — khung bấm chồng
  // nhau thì NPC thật thắng, Ctrl + chuột trái không mở được sạp)
  npcAt(x, y, coSap = true) {
    let best = null, bd = Infinity;
    for (const n of this.npcs) {
      if (n.role === "dummy" || (!coSap && n.sap) || (coSap === "chi" && !n.sap) || (n.sap && this.P.settings.anSap)) continue; // anSap: sạp đang ẩn (Trợ Thủ → Khác)
      // vật bản đồ: khung theo hình đã vẽ (đống rương rộng ~80 điểm)
      const hit = n.obj ? Math.abs(x - n.x) < 40 && y < n.y + 14 && y > (n.top ?? n.y - 70) : Math.abs(x - n.x) < 28 && y < n.y + 12 && y > n.y - 95;
      // sạp trông hộ đứng sát NPC (anh 10/11 — "sạp hàng nằm cùng Dã Tẩu, bấm toàn bị nhầm"): xét cả chiều ngang, sạp kém NPC thật 1 khoảng (bản cũ chỉ so chiều dọc)
      if (hit) { const d = Math.abs(x - n.x) + Math.abs(y - (n.y - 45)) * 0.35 + (n.sap ? 14 : 0); if (d < bd) { bd = d; best = n; } }
    }
    return best;
  }
  clickNpc(n) {
    const p = this.player; if (p.hp <= 0) return;
    if (p.sit) this.sit(false);
    // NPC đứng trên ô vật cản (sau quầy, sát tường…) -> đi tới ô đi được gần nhất
    const k = this.map.walkable(n.x, n.y) ? -1 : this.map.nearestCell(n.x, n.y, 6), [gx, gy] = k >= 0 ? this.map.center(k) : [n.x, n.y];
    // đường thường hết 20000 nút (thành lớn: bấm NPC từ xa ≥ 2500 ở Biện Kinh / Ba Lăng hay hỏng -> đứng im 1,2 giây rồi mở thoại từ xa — nay máy chủ chặn việc
    // của NPC khi đứng xa, soát 13/11): tìm lại A* nặng heuristic ×2, ngân sách 150000 nút (đo 13/11: mọi điểm hỏng đều ra đường, TB 4–11 ms, lâu nhất ~30 ms)
    p.target = null; p.loot = null; p.talkTo = n; p.goal = [gx, gy]; p.path = this.map.path(p.x, p.y, gx, gy) || this.map.path(p.x, p.y, gx, gy, 150000, 2) || []; p.manual = true;
  }
  // ẩn bớt người chơi khác (anh 11/11 — người chơi kêu "về Tân Thủ Thôn lag quá"; Trợ Thủ → Khác → Hiển thị, P.settings.nguoiHien — nhớ ở máy):
  // chưa đặt / < 0 = hiện hết; n = chỉ vẽ n người gần mình nhất; 0 = ẩn hết. Đồng đội và người đang nhắm luôn hiện; trận Tống Kim luôn hiện hết.
  // -> Set tên người đang hiện (phân thân theo chủ), null = hiện hết. Tính lại mỗi 0,5 giây; người đang hiện được ưu tiên giữ chỗ (2 người cách
  // ngang nhau không nhấp nháy đổi qua lại)
  nguoiHien() {
    const n = this.P.settings.nguoiHien;
    if (!(n >= 0) || this.tk) return null;
    if (this._hien && this._hienN === n && this.time - this._hienT < 0.5 && this.time >= this._hienT) return this._hien;
    const p = this.player, doi = this.doiTen, tg = p.target, cu = this._hien || new Set(), ds = [];
    for (const e of this.others.values()) if (!(doi && doi.has(e.name)) && e !== tg) ds.push([ldist(e.x, e.y, p.x, p.y) * (cu.has(e.name) ? 0.85 : 1), e.name]);
    ds.sort((a, b) => a[0] - b[0]);
    const hien = new Set(ds.slice(0, n).map((x) => x[1]));
    if (doi) for (const t of doi) hien.add(t);
    if (tg && tg.kind === "other") hien.add(tg.name);
    this._hien = hien; this._hienN = n; this._hienT = this.time;
    return hien;
  }
  // người chơi khác dưới chuột / ngón tay (menu người chơi — giao dịch, mời vào nhóm: main.js menuNguoi). rong (chạm giữ trên điện thoại — anh 12/11
  // "iOS đè vô người chơi xem thông tin không được"): vùng rộng hơn, lên tới cả tên trên đầu (người cưỡi ngựa cao hơn)
  // người khác đang ẩn thân (e.an — AN_BL): chỉ đồng đội còn thấy (mờ như chính họ thấy)
  thayAn(e) { const d = this.doiTen; return !!(d && e && d.has(e.name)); }
  otherAt(x, y, rong) {
    let best = null, bd = Infinity;
    const hien = this.nguoiHien(); // người đang ẩn (nguoiHien): không bấm trúng người mình không thấy
    for (const e of this.others.values()) {
      if (hien && !hien.has(e.name)) continue;
      if (e.an && !this.thayAn(e)) continue; // đang ẩn thân: không bấm trúng
      const tren = rong ? Math.max((e.top ?? e.y - 95) - 30, e.y - 175) : Math.max(e.top ?? e.y - 95, e.y - 110);
      if (Math.abs(x - e.x) < (rong ? 34 : 28) && y < e.y + (rong ? 18 : 12) && y > tren) { const d = Math.abs(x - e.x) + Math.abs(y - (e.y - 45)); if (d < bd) { bd = d; best = e; } }
    }
    return best;
  }
  // bot Tống Kim dưới chuột / ngón tay (anh 06/11 "cho xem thông tin của bot như xem người chơi khác" — main.js menuNguoi): cả 2 phe, còn sống, vùng
  // bấm như người (cưỡi ngựa cao hơn)
  botAt(x, y, rong) { // rong: chạm giữ trên điện thoại — vùng rộng tới tên (như otherAt)
    const T = this.tk; if (!T || !T.bots) return null;
    let best = null, bd = Infinity;
    for (const e of T.bots.values()) {
      if (!e.alive || Math.abs(x - e.x) >= (rong ? 34 : 28) || y >= e.y + (rong ? 18 : 12) || y <= e.y - (e.ngua ? 130 : 110) - (rong ? 30 : 0)) continue;
      const d = Math.abs(x - e.x) + Math.abs(y - (e.y - 45)); if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  mobAt(x, y) {
    let best = null, bd = Infinity;
    for (const m of this.mobs) {
      if (!m.alive || m.an) continue; // m.an: người phe kia đang ẩn thân (Tống Kim) — không bấm chọn được
      const h = m.boss ? 130 : 90, w = m.boss ? 40 : 28;
      if (Math.abs(x - m.x) < w && y < m.y + 12 && y > m.y - h) { const d = Math.abs(y - (m.y - h / 2)); if (d < bd) { bd = d; best = m; } }
    }
    return best;
  }

  // ---------- người chơi khác (máy chủ chung, anh muốn 25/10: thấy nhau trên bản đồ) ----------
  // list = [{ name, sex, lvl, look, tr: [[ts, x, y, hướng, động tác, atkN, đòn 1|2|3 (3 = thi pháp), thế đánh 0|1], …] }] cùng bản đồ — main.js nhận 2 lần
  // mỗi giây, mỗi người kèm các mốc gần nhất (4 mốc / giây, ts = đồng hồ máy người đó, ms). updateOther vẽ người đó ở thời điểm (bây giờ
  // − trễ) theo đồng hồ của họ, nội suy giữa 2 mốc -> đi đều, dừng đúng lúc họ dừng (bản 25/10 sáng đổi động tác ngay khi nhận mà vị trí
  // còn đuổi theo -> đứng yên mà vẫn trượt). Quái vẫn của riêng từng máy; Ctrl + chuột phải / chạm giữ vào người khác: menu người chơi (otherAt).
  setOthers(list) {
    const seen = new Set();
    for (const s of list) {
      const tr = s.tr || [], f = tr[tr.length - 1];
      if (!f) continue;
      seen.add(s.name);
      const M = s.pt ? this.ptKhac : this.others; // phân thân của người khác (pt — anh 05/11): danh sách riêng
      let e = M.get(s.name);
      if (!e) { e = { kind: "other", name: s.name, x: f[1], y: f[2], dir: f[3], t: 0, act: "stand", buf: [], gap: 0.1, lag: 0.2, off: 0, ...(s.pt ? { pt: 1 } : {}) }; M.set(s.name, e); }
      if (s.pt) { e.chu = s.chu; e.so = s.so | 0; } // người thuê + thứ tự phân thân (chiêu của phân thân — main.js "chieu")
      const key = s.sex + JSON.stringify(s.look);
      if (e.lookKey !== key) { e.lookKey = key; e.sex = s.sex; e.look = this.P.jx.look({ sex: s.sex, ...s.look }); }
      e.lvl = s.lvl; e.co = !!s.co; e.gd = s.gd | 0; e.cp = s.cp ?? this.campPhai(s.fac); // cp: phe đang theo (máy chủ — màu tên, vòng sáng) // co: đội trưởng của đội đang mở, gd: 1 mở giao dịch / 2 đang giao dịch -> cờ trên đầu
      e.cc = s.cc | 0; // vầng trăng Nhất Kỷ / Càn khôn đang có (anh 16/11 — bit 1 Hồng Nguyệt, 2 Lam Nguyệt: vocong.js TRANG_CC; máy chủ the-gioi.js ccDau)
      e.hp = s.hp ?? 100; e.mp = s.mp ?? 100; e.vs = s.vs || null; e.qt = !!s.qt; // % sinh lực / nội lực (bảng đội ngũ), vòng sáng hỗ trợ đang bật (vongDoi)
      e.bh = typeof s.bh === "string" && s.bh ? s.bh : null; // dòng bang trên đầu "Tên bang(Chức)" (anh 14/11 — máy chủ dựng 1 lần ở nhịp người đó; Tống Kim / phân thân không có)
      e.bhc = e.bh && typeof s.bhc === "string" ? s.bhc : null; // mã chức (chu / lao / doi / de / an) — màu chức vụ (veDongBang)
      e.an = !!(s.bl && s.bl.includes(AN_BL)); // đang ẩn thân (AN_BL)
      e.kd = s.kd || null; // kháng / né thật họ đang có (Tống Kim — tkbot.js tkKhangPhat, lượt 86)
      e.bc = s.bc || null; // bùa hại họ đang dính (Tống Kim — tkbot.js buaHaiPhat; tongkim.js dongBo gắn lên bản chọn mục tiêu)
      e.bl = s.bl ? s.bl.filter((id) => id !== AN_BL) : null; if (e.bl && !e.bl.length) e.bl = null; // bùa lợi đang có (buaPhat — vẽ hình trạng thái)
      if (e.an && !this.thayAn(e) && this.player && this.player.target === e) this.player.target = null;
      this._moc(e, tr);
    }
    for (const k of [...this.others.keys()]) if (!seen.has(k)) this.others.delete(k);
    for (const k of [...this.ptKhac.keys()]) if (!seen.has(k)) this.ptKhac.delete(k);
  }
  // nối các mốc mới của người khác vào hàng chờ vẽ — từ nhịp (setOthers) hoặc kênh tức thời (themMoc, mốc tới ngay khi họ ghi — anh 01/11 khuya
  // "mọi người thao tác bị khựng"); mốc đã có (nhịp gửi lại mốc kênh tức thời đã mang tới) thì bỏ, không tính vào độ trễ
  // nhanh: mốc qua kênh tức thời (themMoc); không: mốc nhịp bù (setOthers — tới chậm hơn, nhịp 0,45 giây). Độ mượt bước 1 (13/11 tối): trang mới không gửi mốc lúc
  // đứng yên -> đứng một lúc rồi chạy tiếp thì thêm mốc "còn ở chỗ cũ" ngay trước mốc mới (không trượt chậm suốt quãng nghỉ, khoảng cách mốc không phình -> vẽ trễ
  // không tăng đúng lúc bắt đầu chạy); độ chậm tin tới chỉ đo theo kênh tức thời khi kênh còn sống (mốc nhịp bù tới muộn làm vẽ trễ phình)
  _moc(e, tr, don, nhanh) {
    if (e.tkb) return this._mocBot(e, tr, don);
    const now = this.time;
    let got = false;
    for (const [ms, x, y, dir, act, atkN, atk, fight, tx, ty, uid] of tr) {
      const ts = ms / 1000, last = e.buf[e.buf.length - 1];
      if (last && ts <= last.ts && ts > last.ts - 10) continue; // mốc đã có
      // nhảy cóc (anh 14/11): người đó đang chạy mà mốc cùng chỗ = máy họ chưa tính bước mới (tab ẩn: game tính 4 lần / giây, trang cũ lấy mốc 20 lần / giây)
      // -> bỏ mốc đó (giữ lại nếu cùng chỗ quá 0,6 giây — kẹt chân thật)
      const dangDi = !!last && (last.act === "run" || last.act === "jump");
      if (dangDi && (act === "run" || act === "jump") && x === last.x && y === last.y && ts - last.ts < 0.6) continue;
      // mới thấy / người đó tải lại trang (đồng hồ chạy lại từ 0) / mất tin lâu: bắt đầu lại
      if (!last || ts <= last.ts - 10 || ts - last.ts > 10) { e.buf = []; e.off = now - ts; }
      // nghỉ rồi chạy tiếp: chèn mốc "còn ở chỗ cũ" ngay trước mốc mới — chỉ khi mốc trước là lúc đứng (đứng / đánh / ngồi…); mốc trước đang chạy mà mốc thưa
      // (tab ẩn 4 mốc / giây, máy yếu) thì nội suy liền — trước chèn cả lúc này: đứng 0,2 giây rồi vọt 0,05 giây (nhảy cóc, anh 14/11)
      else if (ts - last.ts > (dangDi ? Math.max(0.6, e.gap * 3) : Math.max(0.15, e.gap * 2))) { if (last.x !== x || last.y !== y) e.buf.push({ ...last, ts: ts - Math.min(0.1, Math.max(0.03, e.gap)) }); }
      // khoảng cách mốc: chỉ học lúc người đó đang di chuyển — mốc "vẫn ở đây" lúc đứng yên (cách 250 ms) mà học vào thì gap phình, vẽ trễ phình (soát t56 14/11);
      // mốc thưa đi (tab ẩn) thì học nhanh (2–3 mốc — vẽ trễ đủ để luôn có 2 mốc mà nội suy), dày lại thì bớt dần
      else if (dangDi || last.x !== x || last.y !== y) { const g = Math.min(1, ts - last.ts); e.gap = g > e.gap ? e.gap * 0.5 + g * 0.5 : e.gap * 0.8 + g * 0.2; }
      e.buf.push({ ts, x, y, dir, act, atkN, atk: atk === 2 ? "Attack2" : atk === 3 ? "Magic" : "Attack1", fight: !!fight, ...(tx != null ? { tx, ty } : {}), ...(uid > 0 ? { uid } : {}) });
      got = true;
    }
    if (e.buf.length > 60) e.buf.splice(0, e.buf.length - 60);
    if (got) {
      const age = now - e.buf[e.buf.length - 1].ts;
      e.off = Math.min(e.off, age);                           // lệch đồng hồ 2 máy: lấy lần tin tới nhanh nhất
      if (nhanh || !this.kenhSong) { const dl = Math.min(10, Math.max(0, now - (e.lagLuc ?? now))); e.lagLuc = now; e.lag = Math.max(e.lag * OTHER_LAG_GIAM ** dl, age - e.off); } // tin tới chậm hơn lần nhanh nhất bao lâu (kênh tức thời; kênh đứt: cả nhịp)
    }
  }
  // bot Tống Kim ở máy không chạy não (anh 06/11 "bot di chuyển vẫn chán … đánh vẫn lag và giật nhảy"): chủ trận chỉ báo con đổi (tongkim.js guiViTri)
  // nên mốc từng con thưa — trước đo trễ / khoảng cách mốc riêng từng con: con vừa đứng yên thì khoảng cách mốc phình (trễ 0,38–0,6 giây, khác
  // nhau từng con), đồng hồ vẽ con đó dừng ở mốc cuối rồi tụt lại sau, đi lại thì trượt chậm suốt quãng nghỉ. Nay như quái chung (quaichung.js
  // viTri / dongHoVe): 1 đồng hồ cho cả trận (_dhBot — đo trễ theo mọi tin chủ trận, mốc mới nhất = tin gần nhất: con không có trong tin là không
  // đổi), con đứng yên một lúc mà nay báo chỗ khác thì thêm mốc "còn ở chỗ cũ" ngay trước — không trượt chậm suốt quãng nghỉ
  // don: tin báo đòn (tongkim.js guiViTri — chỉ con vừa vung): không lấy làm mốc nhịp
  _mocBot(e, tr, don) {
    const now = performance.now() / 1000; // đồng hồ thật lúc tin tới (this.time chỉ nhích theo bước logic — lệch tới 1 khung)
    for (const [ms, x, y, dir, act, atkN, atk, fight, ngua] of tr) {
      const ts = ms / 1000;
      // nho = 1: các dòng cùng 1 tin (cùng ts) không quên thêm — chỉ tin mới hơn mới quên theo thời gian (soát lần 2 06/11: trước mỗi dòng × BOT_NHO, 20
      // bot / tin là quên ~0,82 mỗi tin chứ không phải 0,99 mỗi 0,1 giây)
      let D = this._dhBot, nho = 1;
      if (!D || ts <= D.last - 10 || ts - D.last > 10) { // đổi chủ trận / mất tin lâu: đồng hồ mới (mã tăng mãi — tongkim.js có thể xóa _dhBot); bỏ mốc cũ của mọi bot
        D = this._dhBot = { id: (this._dhBotN = (this._dhBotN || 0) + 1), off: now - ts, lag: 0.15, gap: 0.1, last: ts, lastReg: ts, vt: null, luc: null };
        if (this.tk && this.tk.bots) for (const b of this.tk.bots.values()) if (b.dhBot !== D.id) { b.buf = []; b.dhBot = D.id; } // soát 06/11: con không có trong tin này giữ mốc đồng hồ cũ -> vẽ sai
        if (this.tk && this.tk.binh) for (const b of this.tk.binh.values()) if (b.dhBot !== D.id) { b.buf = []; b.dhBot = D.id; } // + quân NPC trận thật (cùng đồng hồ)
      }
      else if (ts > D.last) {
        // tin theo nhịp 100 ms (không có dấu tin báo đòn d, cách tin theo nhịp trước ≥ 80 ms — chủ trận bản cũ không đánh dấu): đo khoảng cách mốc +
        // lastReg = mốc cuối đồng hồ vẽ được bám tới (soát lần 2 06/11: tin báo đòn đẩy D.last lên trước mốc của con đang chạy)
        const kc = ts - D.last, kr = ts - (D.lastReg ?? D.last);
        if (!don && kr >= 0.08) { D.gap = D.gap * 0.8 + Math.min(1, kr) * 0.2; D.lastReg = ts; }
        nho = BOT_NHO ** Math.min(10, kc / 0.1); D.last = ts;
      }
      const age = now - ts; D.off = Math.min(D.off, age); D.lag = Math.max(D.lag * nho, age - D.off);
      if (e.dhBot !== D.id) { e.dhBot = D.id; e.buf = []; }
      const z = e.buf[e.buf.length - 1];
      if (z && ts <= z.ts) continue; // mốc đã có / tin cũ
      if (z && ts - z.ts > D.gap * 1.5 + 0.05 && (z.x !== x || z.y !== y)) e.buf.push({ ...z, ts: ts - D.gap });
      e.buf.push({ ts, x, y, dir, act, atkN, atk: atk === 2 ? "Attack2" : atk === 3 ? "Magic" : "Attack1", fight: !!fight, ngua: !!ngua });
    }
    if (e.buf.length > 60) e.buf.splice(0, e.buf.length - 60);
  }
  // đồng hồ vẽ chung của bot Tống Kim: bước 1 lần mỗi World.update (buocVe — mốc mới nhất = tin chủ trận gần nhất)
  _veBot() {
    const D = this._dhBot, now = performance.now() / 1000;
    if (D.luc !== this.time) { D.vt = buocVe(D.vt, now - D.off - Math.min(OTHER_DELAY_MAX, D.lag + D.gap + BOT_DU), D.lastReg ?? D.last, D.wl == null ? 0 : Math.min(0.25, now - D.wl)); D.wl = now; D.luc = this.time; } // mốc cuối = tin theo nhịp gần nhất (_mocBot)
    return D.vt;
  }
  // mốc qua kênh tức thời (main.js Net.wsNghe("vt") — may-chu/the-gioi.js): người chưa thấy qua nhịp thì bỏ (nhịp tạo người, đồ mặc…)
  themMoc(name, tr) { const e = this.others.get(name); if (e && Array.isArray(tr)) this._moc(e, tr, false, true); }
  // Đang dịch chuyển giữa 2 mốc thì chạy, hướng theo đường đi; đứng giữa 2 mốc thì theo động tác người đó báo (đứng / ngồi / chết / bị
  // đánh). Đòn mới (atkN đổi) đánh lại từ khung đầu, đánh hết đòn mới đổi động tác khác.
  updateOther(e, dt) {
    e.t += dt;
    const B = e.buf; if (!B.length) return;
    // thời điểm vẽ (đồng hồ người đó): bám êm thời điểm nên vẽ (buocVe — không nhảy lùi khi tin tới muộn, không nhảy tới khi tin tới lại)
    // người đó đang đứng yên (2 mốc cuối trùng chỗ — độ mượt bước 1, 13/11 tối): đồng hồ vẽ chạy theo thời gian thật, không dừng ở mốc cuối (lúc đứng yên mốc chỉ tới
    // mỗi 250 ms — trước đồng hồ tụt ~0,2 giây rồi bắt đầu chạy mới đuổi theo); đang chạy thì như cũ (không vẽ quá mốc mới nhất)
    const Bc = B[B.length - 1], Bt = B[B.length - 2], tinh = !Bt || (Math.abs(Bc.x - Bt.x) < 0.5 && Math.abs(Bc.y - Bt.y) < 0.5), dichVe = this.time - e.off - Math.min(OTHER_DELAY_MAX, e.lag + e.gap + OTHER_DU);
    const rt = e.tkb && this._dhBot && e.dhBot === this._dhBot.id ? this._veBot() : (e.vt = buocVe(e.vt, dichVe, tinh && !e.tkb ? Math.max(Bc.ts, dichVe + VE_SAP_HET) : Bc.ts, dt));
    while (B.length > 1 && B[1].ts <= rt) B.shift();
    const a = B[0], b = B[1];
    // bot Tống Kim lên / xuống ngựa đúng lúc vẽ tới mốc đó (soát lần 2 06/11: trước đổi ngay lúc tin tới — ngựa mất trước khi bot vẽ tới chỗ đứng đánh 0,2–0,4 giây)
    if (e.tkb && e.coNgua && a.ngua != null && a.ngua !== !!e.ngua) { e.ngua = a.ngua; e.look = e.ngua ? e.lookNgua : e.lookBo; }
    let moving = false;
    if (b && rt > a.ts) {
      const k = (rt - a.ts) / (b.ts - a.ts);
      e.x = a.x + (b.x - a.x) * k; e.y = a.y + (b.y - a.y) * k;
      moving = Math.hypot(b.x - a.x, b.y - a.y) > 2;
      if (moving) e.chayLuc = this.time;
      if (moving) e.dir = dirOf(b.x - a.x, (b.y - a.y) * 2);
    } else { e.x = a.x; e.y = a.y; }
    e.fight = a.fight;
    if (a.act === "attack" && a.atkN !== e.atkN) { e.atkN = a.atkN; e.attack = a.atk; e.dir = a.dir; e.act = "attack"; e.t = 0; return; }
    if (e.act === "attack" && e.t < (e.tkb && e.atkDur ? e.atkDur : DUR.attack)) return; // bot Tống Kim: độ dài đòn theo tốc đánh của bot (tkbot.js tkTaoBot)
    if (a.act === "jump") { e.jumpN = a.atkN | 0; this.setAct(e, "jump"); return; } // khinh công của người khác: số vòng nhảy đi kèm mốc (main.js)
    // dừng ngắn (< GIU_CHAY — giữa 2 mốc gần trùng, tin tới chậm) mà người đó không báo ngồi / chết / bị đánh: giữ động tác chạy, không chớp chạy -> đứng -> chạy
    const giuChay = !moving && !["sit", "die", "hurt"].includes(a.act) && a.act !== "attack" && this.time - (e.chayLuc ?? -9) < GIU_CHAY;
    if (!moving && !giuChay) e.dir = a.dir;
    this.setAct(e, moving || giuChay ? "run" : ["sit", "die", "hurt"].includes(a.act) ? a.act : "stand");
  }

  // ---------- cập nhật ----------
  update(dt) {
    _nhipGio(this.P, performance.now()); // bẫy bản nhái (đầu file): tên miền nhà -> thôi ngay
    this.time += dt;
    this.updateHero(dt);
    this.demHao();
    for (const m of this.mobs) this.updateMob(m, dt);
    for (const m of this.dongMinh) this.updateMob(m, dt);
    this.separate();
    // quái chết: mờ dần rồi bỏ; giữ đủ số quái
    this.mobs = this.mobs.filter((m) => m.alive || m.coc || m.tkb || m.tkn || m.deadT < 2.5); // cọc đảo Tẩy Tủy giữ lại để mọc lại; bot / người phe kia Tống Kim: tongkim.js giữ danh sách
    if (this.dongMinh.length) this.dongMinh = this.dongMinh.filter((m) => m.alive || m.tkb || m.deadT < 2.5);
    if (this.diem && !this.suKien && (this._xaT = (this._xaT || 0) + dt) > 2) { this._xaT = 0; this.boQuaiXa(); }
    if (this.respawnT == null) this.respawnT = 0;
    const alive = this.mobs.filter((m) => m.alive && !m.boss).length;
    if (alive < this.cap && !this.dev.noSpawn && !this.suKien && this.zone.m && this.zone.m.length) { this.respawnT -= dt; if (this.respawnT <= 0) { this.spawnMob(false); this.respawnT = rnd(...RESPAWN) / Math.max(1, this.cap - alive); } }
    for (const n of this.npcs) n.t += dt;
    for (const e of this.others.values()) this.updateOther(e, dt);
    for (const e of this.ptKhac.values()) this.updateOther(e, dt);
    if (this.phanThan.length) this.capNhatPhanThan(dt);
    for (const t of this.texts) { t.t += dt; t.y -= 38 * dt; }
    if (this.drops.length) this.updateDrops(dt);
    if (this.shots.length) this.updateShots(dt);
    if (this.P.vc) this.vcUpdate(dt);
    for (const f of this.fxs) f.t += dt;
    if (this.fxs.length) this.fxs = this.fxs.filter((f) => f.t < f.dur);
    this.texts = this.texts.filter((t) => t.t < 1.1);
  }

  // đếm hao mòn: ra đòn = atkN tăng (đòn thường + chiêu); vùng bản đồ client 512 × 1024 logic = 512 × scale điểm bản đồ web mỗi chiều
  // (bản đồ web bắt đầu đúng mép vùng — main.js zoneNpcs)
  demHao() {
    const p = this.player, n = p.atkN || 0, V = 512 * this.P.maps.scale, vk = Math.floor(p.x / V) * 65536 + Math.floor(p.y / V);
    if (n > this._atkN) this.hao[0] += n - this._atkN;
    this._atkN = n;
    if (this._vung != null && vk !== this._vung) this.hao[2]++;
    this._vung = vk;
  }

  // uống thuốc x (ItemDB.item của thuốc): lần hồi đầu ngay khi uống. Trả false nếu đang trọng thương.
  // hệ số hồi sinh lực: bùa hại của siêu boss (anh 18/11 "giảm hồi máu" — bosstg.js buaSk p.skBua.giamHoi %) — thuốc, tự hồi, ngồi, hút máu, hồi ngay
  hoiK() { const b = this.player && this.player.skBua; return b && b.until > this.time ? Math.max(0, 1 - (b.giamHoi || 0) / 100) : 1; }
  drink(x) {
    const p = this.player; if (p.hp <= 0) return false;
    if (x.hp) p.potHp = { v: x.hp[0], n: x.hp[1], t: 0.5 };
    if (x.mp) p.potMp = { v: x.mp[0], n: x.mp[1], t: 0.5 };
    return true;
  }

  updateHero(dt) {
    const p = this.player, h = this.hero, K = this.quaiVC ? this.heroK() : 1; // K: đang bị làm chậm (quái có võ công) thì động tác + chạy 50 %
    p.t += dt * K;
    if (p.hp <= 0) {
      p.potHp = p.potMp = null; this.pkLuiDang = this.pkLuiBo = false; this.pkVe = null; // thẻ PK: trọng thương thì thôi về doanh / ra lại (hồi sinh ở doanh)
      // chết giữa lúc khinh công / lướt / chiêu đang chờ: bỏ hết (anh 16/11 — Tống Kim hồi sinh tại chỗ: nhánh này return trước jumpTick nên cú nhảy dở còn
      // nguyên, hồi sinh xong nhịp đầu kéo nhân vật từ hậu doanh về đường nhảy cũ; chiêu chờ thì bắn ngay sau khi đứng dậy)
      p.jump = null; p.dash = null; p.queueAt = p.queueSelf = null;
      p.act = "die"; p.deadT += dt;
      if (this.onRevive && p.deadT > DIE_TIME && !p.reviving) { p.reviving = true; this.onRevive(); }
      if (p.deadT > PLAYER_REVIVE) {
        if (this.onRevive) return; // main.js: bảng trọng thương -> về thành dưỡng sức
        const s = this.map.randomSpot(rand, (x, y) => this.mobs.some((m) => m.alive && ldist(x, y, m.x, m.y) < 260));
        if (s) [p.x, p.y] = s;
        p.hp = p.hpMax; p.mp = p.mpMax; p.deadT = 0; this.setAct(p, "stand"); p.target = null; p.path = null;
      }
      return;
    }
    // khu an toàn của thôn / thành (anh 02/11 "phân định rõ khu vực đánh quái được / không được — trong client có"): trong khu (map.an — trong
    // các cổng có trap đổi trạng thái chiến đấu) là phi chiến đấu như client: không ra đòn / chiêu tấn công (dưới: mục tiêu, castAt, useLeft);
    // qua cổng thì báo (onAnToan — lần đầu vào bản đồ không báo)
    const an = this.map.an(p.x, p.y) || (!!this.tk && (this.tk.xem || this.tkAnToan(p, this.tk.phe))); // Tống Kim: doanh phe mình cũng là khu an toàn (không đánh ra — soát 05/11); lôi đài: người xem / đã bị hạ (loidai.js st.xem) không đánh được
    if (an !== p.an) { const dau = p.an === undefined; p.an = an; if (!dau && this.onAnToan) this.onAnToan(an); }
    // dưỡng sức ở thành sau khi trọng thương: đang tự đánh và không đi đâu thì tự ngồi; đầy sinh lực + nội lực thì đứng dậy, báo onRested
    // "Phục hồi sinh lực mỗi nửa giây" của đồ: hồi cả khi đứng / đánh (đứng không tự hồi chỉ là khi không có đồ — anh chốt 23/10)
    if (p.lifeRegen > 0 && p.hp < p.hpMax) p.hp = Math.min(p.hpMax, p.hp + ((p.lifeRegen * 2 * dt * (100 + (p.lifeRegenPct || 0))) / 100) * this.hoiK());
    // bùa giảm hồi sinh lực quá mức hồi (Bắc Minh Đáo Hải, Túy Tiên Tá Cốt — anh 17/11): sinh lực tụt dần như bùa hút máu trên quái, không làm chết (giữ ≥ 1)
    else if (p.lifeRegen < 0 && p.buaK && p.hp > 1) p.hp = Math.max(1, p.hp + p.lifeRegen * 2 * dt);
    // "Phục hồi thể lực mỗi nửa giây" của đồ: hồi lúc không chạy (engine KNpc: m_CurrentStamina += m_CurrentStaminaGain khi m_Doing != do_run)
    if (p.stRegen > 0 && p.act !== "run" && p.st < p.stMax) p.st = Math.min(p.stMax, p.st + p.stRegen * 2 * dt);
    for (const [k, v, max] of [["potHp", "hp", "hpMax"], ["potMp", "mp", "mpMax"]]) {
      const e = p[k]; if (!e) continue;
      for (e.t += dt; e.t >= 0.5 && e.n > 0; e.t -= 0.5, e.n--) p[v] = Math.min(p[max], p[v] + (v === "hp" ? e.v * this.hoiK() : e.v));
      if (e.n <= 0) p[k] = null;
    }
    if (this.quaiVC && this.heroTick(dt)) return; // quái có võ công: trúng độc mất máu; choáng thì đứng yên, bỏ chiêu đang ra (vocong.js)
    if (this.resting) {
      if (p.hp >= p.hpMax && p.mp >= p.mpMax) { this.resting = false; if (p.sit) this.sit(false); if (this.onRested) this.onRested(); }
      // tự dưỡng sức (phần tự đánh): đang cưỡi thì xuống ngựa trước như người chơi phải làm, rồi ngồi thiền
      else if (!p.sit && this.auto && !p.goal && !(p.path && p.path.length) && (!this.riding() || this.doiNgua(false))) this.sit(true); // chưa đủ 3 giây từ lần lên ngựa: chờ
    }
    // ngồi: hồi sinh lực 6 % / nội lực 9 % mỗi giây (TẠM — client chỉ ghi thể lực khi ngồi: stamina.ini SitAdd 10 ‰; số hồi sinh lực /
    // nội lực khi ngồi nằm trong engine), tự đánh tạm dừng; đi / đánh / bị đánh thì đứng dậy. Đứng thì không tự hồi (như client).
    if (p.jump) { this.jumpTick(p, dt); return; }
    // đường đua (anh 16/11 — duangua.js): chờ xuất phát / đang bị choáng thì đứng yên — bỏ mọi đường đi (bấm đất, giữ chuột, cần điều khiển, đi tới NPC), nhắc 1 câu
    if (this.giuYen) {
      if ((p.path && p.path.length) || p.goal || p.talkTo) { if (this.onGiu) this.onGiu(); }
      p.path = null; p.goal = null; p.talkTo = null; p.loot = null; p.target = null;
      if (p.act !== "stand" && p.act !== "sit") this.setAct(p, "stand");
      return;
    }
    if (p.sit) {
      p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.06 * dt * this.hoiK()); p.mp = Math.min(p.mpMax, p.mp + p.mpMax * 0.09 * dt);
      if (p.act !== "sit") this.setAct(p, "sit");
      return;
    }
    // xong động tác trong vòng này thì đi tiếp luôn (ra đòn / chiêu kế ngay, không lóe 1 khung đứng giữa 2 chiêu)
    if (p.act === "attack" && !this.heroAttacking(p, dt)) return;
    if (p.dash) return; // đang lướt tới mục tiêu (võ công MisslesForm 11 — vocong.js vcUpdate di chuyển)
    if (p.act === "hurt" && p.t < (p.hurtDur ?? DUR.hurt)) return; // giật: dài theo Thời gian phục hồi (vocong.js giatHero)
    if (p.queueSelf) { const id = p.queueSelf; p.queueSelf = null; if (this.castSelf(id)) return; } // bùa bấm lúc đang vung đòn
    if (p.queueAt) { const q = p.queueAt; p.queueAt = null; if (this.castAt(q.id, null, q.pt[0], q.pt[1])) return; } // chiêu vào khoảng không bấm lúc đang vung
    // đang giữ chuột chạy theo con trỏ (main.js holdTick — anh 26/10): tự đánh tạm chỉ chạy — không dùng bùa, nhặt đồ, nhắm quái.
    // tamDung (main.js loadZone — anh 31/10 khuya "về thành nó chạy thẳng ra mộc nhân Ba Lăng"): vào thành lúc tự đánh đang bật thì tạm
    // dừng như thế tới khi bấm bật lại (đánh mộc nhân) hoặc ra bãi. Boss thế giới ở thôn / thành (anh 02/11 — ngoài cổng Ba Lăng / Biện Kinh):
    // đang tạm dừng mà boss còn sống đứng gần (bossGan) thì vẫn tự đánh, chỉ nhắm boss (nearestMob)
    const tu = this.auto && !this.holdMove && (!this.tamDung || !!this.bossGan(false) || !!this.nhimGan(false));
    if (this.P.vc && tu && p.atkT <= 0 && this.autoBuff()) return; // Trợ Thủ: tự dùng bùa / bật vòng sáng / bùa hại trước
    // đang đi tới NPC: đủ gần (70 logic) hoặc đã tới ô đi được gần NPC nhất thì đứng lại, quay mặt, mở hội thoại
    if (p.talkTo) {
      const n = p.talkTo;
      if (ldist(p.x, p.y, n.x, n.y) <= 70 || !p.goal) { p.path = null; p.goal = null; p.manual = false; p.talkTo = null; p.dir = dirOf(n.x - p.x, (n.y - p.y) * 2); this.setAct(p, "stand"); if (this.onTalk) this.onTalk(n); return; }
    }
    // nhặt đồ: tới nơi thì nhặt; đi hết đường mà chưa tới (vật sát vật cản) thì thôi. Con đang đánh vừa chết -> nhặt trước rồi mới tìm con mới
    if (p.target && (!p.target.alive || p.target.an || (this.tk && (p.target.tkb || p.target.tkn) && this.tkAnToan(p.target, p.target.tkPhe)))) p.target = null; // Tống Kim: địch vào doanh của họ thì thôi
    // Trợ Thủ thẻ PK (anh 06/11 — chỉ trong trận Tống Kim, pk()): sinh lực thấp thì về doanh (lui), không nhặt đồ; ưu tiên "kẻ đang đánh mình" / "người
    // chơi trước" thì đổi sang con đó giữa 2 đòn (pkDoi)
    // trận thật Tống Kim (anh 06/11 — đặc tả đợt 2): Trợ Thủ đứng ở hậu doanh lúc đang đánh -> tự ra cổng hậu doanh (bẫy), ra rồi về chỗ vừa ngã (tkbot.js tkTuRa)
    const PK = tu ? this.pk() : null, lui = this.pkLuiTick(p, PK, dt) || (tu && !!this.tk && this.tk.tran && this.tkTuRa(p, dt));
    if (PK && !lui) this.pkDoi(p, PK);
    if (p.loot) {
      const d = p.loot, k = ldist(p.x, p.y, d.x, d.y);
      if (d.picked || !this.drops.includes(d)) p.loot = null;
      else if (k <= PICK || (!(p.path && p.path.length) && k <= PICK * 3)) { d.picked = true; p.loot = null; p.goal = null; p.path = null; p.manual = false; if (this.onPick) this.onPick(d); }
      else if (!p.goal) { d.skip = true; p.loot = null; }
    }
    const theoDi = tu && !p.manual && this.theoSau(p); // theo sau: đang chạy lại gần người đang theo thì chưa tìm đồ / quái
    // đánh cùng mục tiêu ở bãi quái chung / Vượt Ải (anh 02/11): đội trưởng đổi con thì đổi theo ngay (giữa 2 đòn, không đang nhặt đồ)
    if (!theoDi && tu && !p.manual && !p.loot && p.target && p.act !== "attack" && !p.cast) { const muc = this.mucDoi(); if (muc && muc !== p.target) { p.target = muc; p.tgtT = 0; p.tgtD = null; p.path = null; } }
    if (!theoDi && !PK && !p.loot && !p.goal && tu && !p.manual && this.drops.length && (!p.target || p.hp > p.hpMax * NHAT_MAU)) {
      const th = this.theo ? this.theo() : null, d = this.nearestLoot(th && th.theo ? [th.x, th.y, THEO_NHAT - 60] : null); // theo sau: vật gần người đang theo
      if (d) this.goLoot(d, false);
    }
    // mục tiêu
    if (!theoDi && !lui && !p.target && !p.goal && tu && (!p.manual || !p.path)) { p.manual = false; p.target = this.nearestMob(); p.tgtT = 0; p.tgtD = null; if (!p.target && !p.loot) this.autoIdle(p); }
    if (PK && p.target && !p.manual && this.P.vc && p.atkT <= 0 && this.pkHai(PK, p.target)) return; // PK: mục tiêu vừa nhắm / vừa đổi (pkDoi) — bùa hại trước đòn đầu
    // Trợ Thủ "Đổi mục tiêu": danh.doi giây không lại gần được (kẹt, bị chắn, quái đứng chỗ không tới được) mà cũng chưa ra đòn được vào con
    // đang nhắm -> bỏ con đó 5 giây, chọn con khác. Đang chạy tới (khoảng cách còn giảm) thì không tính — bản đầu tính cả lúc chạy tới con
    // xa nên ở bãi rộng nhân vật chạy qua chạy về giữa 2 con (anh báo 25/10).
    if (p.target && this.auto && !p.manual) {
      const A = this.hero.auto && this.hero.auto.danh, d = ldist(p.x, p.y, p.target.x, p.target.y);
      if (p.tgtD == null || d < p.tgtD - 8) { p.tgtD = d; p.tgtT = 0; } else p.tgtT = (p.tgtT || 0) + dt;
      if (A && p.tgtT > A.doi) { this.boMuc(p.target); p.target = null; p.path = null; }
    }
    if (p.target) {
      const m = p.target, d = ldist(p.x, p.y, m.x, m.y);
      // võ công: chiêu dùng được thì đánh theo tầm chiêu. Tính cả lúc đang chờ giữa
      // 2 chiêu — bản đầu lúc chờ lấy tầm đòn thường nên mỗi lần chờ lại chạy sát vào quái, chiêu tầm xa thành đánh áp sát (anh báo 25/10).
      // Trợ Thủ "Tiếp cận" (thẻ Đánh quái, anh 27/10 — người chơi tự điền, mặc định 75): khi tự đánh chạy tới cách quái chừng đó (đơn vị
      // client) rồi mới ra chiêu / đánh, cả chiêu tầm xa; tầm chiêu / đòn thường ngắn hơn thì theo tầm đó; 0 = đứng ở tầm chiêu. Thẻ PK (anh 06/11 "auto PK
      // thêm 1 ô tiếp cận để ng chơi chọn, thêm nút tích đồng bộ với phạm vi kĩ năng"): tích Theo phạm vi kỹ năng (PK.tiepTam) = tới tầm chiêu mà đánh; bỏ
      // tích = Tiếp cận của thẻ PK (PK.tiep, cùng đơn vị) — không theo ô Tiếp cận của thẻ Đánh quái
      const plan = this.P.vc ? this.atkPlan() : null, AD = this.hero.auto && this.hero.auto.danh;
      // chiêu không hợp vũ khí đang cầm / cấm cưỡi ngựa: đứng yên (đã báo), như client — không chạy vào đánh tay không
      if (plan && plan.block) { p.path = null; p.dir = dirOf(m.x - p.x, (m.y - p.y) * 2); this.setAct(p, "stand"); return; }
      // anh 16/11: Tiếp cận tối đa = tầm chiêu xa nhất của phái (vocong.js tamPhai — số cũ lưu lớn hơn thì kẹp); đánh boss (auto.js laBoss): tự đánh hay đánh
      // tay, phái tầm xa phải vào trong BOSS_TAM rồi mới đánh (phái áp sát tầm ≤ 75 không đổi) — đòn từ xa hơn cũng không tính (hit / misHit: gầnBoss)
      const tc0 = PK ? (PK.tiepTam ? 0 : PK.tiep) : AD && AD.tiep, tc = tc0 > 0 ? Math.min(tc0, this.tamPhai()) : 0, tiep = this.auto && !p.manual && tc > 0 ? tc * SCALE : Infinity;
      const reach = Math.min(plan ? plan.range : p.reach, tiep, PK && this.pkTam && !p.manual ? this.pkTam : Infinity, laBoss(m) ? BOSS_TAM * SCALE : Infinity); // PK: còn bùa hại chưa ra thì tới tầm bùa trước (pkHai)
      // trong tầm là đánh — đạn (võ công, ám khí) bay qua vật cản nên không cần đường thẳng trống (bản trước phải chạy vòng tìm góc trống).
      // Đứng trong khu an toàn: chưa đánh — con ở ngoài thì đi ra khỏi cổng rồi mới đánh (như client: qua trap cổng mới sang trạng thái chiến
      // đấu); con cũng ở trong khu an toàn thì bỏ, báo
      if (p.an && this.map.an(m.x, m.y)) { p.target = null; p.path = null; this.setAct(p, "stand"); this.skMsg("Khu vực an toàn — không thể chiến đấu"); return; }
      const inRange = d <= reach + m.radius && !p.an;
      if (inRange && (p.atkT > 0 || (plan && plan.wait))) { p.path = null; p.dir = dirOf(m.x - p.x, (m.y - p.y) * 2); this.setAct(p, "stand"); if (p.atkT > 0) p.atkT -= dt * K; return; }
      if (inRange && plan) { p.path = null; this.castStart(plan.id, plan.lv, m, null); return; }
      if (inRange) { p.hideUntil = 0; p.path = null; p.blur = false; p.dir = dirOf(m.x - p.x, (m.y - p.y) * 2); this.setAct(p, "attack"); p.attack = p.attack === "Attack1" ? "Attack2" : "Attack1"; p.atkN = (p.atkN || 0) + 1; p.hitDone = false; this.P.audio.missile(1, 0, 0.5); return; }
      // tìm lại đường theo nhịp 0,4 s (quái di chuyển) hoặc ngay khi đã đi hết đường mà chưa tới tầm đánh
      p.repath = (p.repath || 0) - dt;
      if (p.repath <= 0 || !p.path || !p.path.length) {
        p.repath = 0.4;
        const path = this.map.path(p.x, p.y, m.x, m.y, 6000);
        if (path) p.path = path; else { p.path = []; if (!p.manual) { this.boMuc(m); p.target = null; } }
      }
    } else if (p.goal && !p.path) p.goal = null;
    const x0 = p.x, y0 = p.y;
    if (p.path && p.path.length) {
      if (this.follow(p, p.path, this.tocEp != null ? this.tocEp : RUN * (1 + (p.moveSpeed || 0) / 100) * K, dt)) { p.path = null; if (p.goal) { p.goal = null; p.manual = false; } } // "Tốc độ di chuyển +%": giày, ngựa; đường đua: tốc cố định (tocEp — duangua.js)
      this.setAct(p, "run");
    } else this.setAct(p, "stand");
    this.unstick(p, x0, y0, dt);
  }

  // Chống kẹt người chơi: đang có mục tiêu / điểm đến mà 1,2 giây không nhích được (và không đang đánh) -> tự đánh thì bỏ mục tiêu
  // đó 5 giây (chọn con khác), đi tay thì bỏ điểm đến; đứng lọt ô chặn (bị đẩy) thì kéo về ô đi được gần nhất.
  unstick(p, x0, y0, dt) {
    const busy = (p.target && p.target.alive) || p.goal;
    if (!busy || Math.abs(p.x - x0) + Math.abs(p.y - y0) > 0.3) { p.stuckT = 0; return; }
    if ((p.stuckT = (p.stuckT || 0) + dt) < 1.2) return;
    p.stuckT = 0;
    if (!this.map.walkable(p.x, p.y) && this.map.grid) { const c = this.map.nearestCell(p.x, p.y, 20); if (c >= 0) [p.x, p.y] = this.map.center(c); }
    if (p.target && !p.manual) { this.boMuc(p.target); p.target = null; }
    else { p.goal = null; p.target = null; p.manual = false; }
    p.path = null; p.repath = 0;
  }

  // trả true khi động tác vừa xong ở vòng này (updateHero làm tiếp ngay)
  heroAttacking(p, dt) {
    const m = p.target;
    if (p.cast) { // võ công: ra chiêu ở nhịp trúng của động tác
      if (!p.hitDone && p.t >= (p.castHit ?? p.castDur * HIT_AT)) { p.hitDone = true; p.tgtT = 0; this.castFire(); }
      if (p.t >= p.castDur) { this.setAct(p, "stand"); p.atkT = 0; p.cast = null; return true; }
      return false;
    }
    if (!p.hitDone && p.t >= p.atkDur * HIT_AT) {
      p.hitDone = true; p.tgtT = 0;
      const d = m && m.alive ? ldist(p.x, p.y, m.x, m.y) : Infinity;
      if (d !== Infinity && d <= p.reach + m.radius + 20) {
        if (p.ranged) this.shoot(p, m, p.atkFx);
        else this.land(p, m, p.atkFx);
      }
    }
    if (p.t >= p.atkDur) { this.setAct(p, "stand"); p.atkT = ATK_WAIT; return true; }
    return false;
  }

  // đòn thường trúng: sát thương + hiệu ứng trúng của đạn (63 tay không / kiếm / đao…, 64 thương / côn, 65 ám khí) + tiếng nếu client có
  land(p, m, id) {
    const d = R.heroDamage(p, m);
    this.hit(p, m, d);
    if (!d.miss && d.cold > 0) this.slowMob(m, this.quaiVC ? this.khungCham(null) : null); // băng sát của đòn thường (đồ, Như Lai Thiên Diệp…) cũng làm chậm
    if (!d.miss && m.vaDoi && this.onVaTT) this.onVaTT(m); // Vượt Ải tổ đội: chậm vừa gây chuyển cho máy khác cùng ải (vadoi.js)
    // đòn thường là ngoại công: "Hút sinh lực / Hút nội lực %" của đồ (engine chỉ tính ở đòn ngoại công) + hút của võ công bị động
    const hs = (p.lifeSteal || 0) + (p.hutSinh || 0), hn = p.hutNoi || 0;
    const dv = this.tk && ((m.tkb && !m.tkq) || m.tkn) ? Math.max(1, Math.round(d.v * (this.tk.hs > 0 ? this.tk.hs : 1))) : d.v; // Tống Kim: hút theo sát thương đã nhân hệ số PK (soát 05/11); quân NPC (tkq) không nhân
    if (!d.miss && hs > 0 && p.hp > 0) p.hp = Math.min(p.hpMax, p.hp + ((dv * hs) / 100) * this.hoiK());
    if (!d.miss && hn > 0 && p.hp > 0) p.mp = Math.min(p.mpMax, p.mp + (dv * hn) / 100);
    if (!d.miss && d.doc > 0 && m.alive && !m.tkn) this.docDon(m, d.doc); // người phe kia: không gắn độc lên bản chọn mục tiêu (không ai trừ — dồn mãi)
    if (!d.miss && this.P.fx) { this.spawnFx(id, m); const snd = this.P.fx.sound(id); if (snd) this.P.audio.play(snd, 0.6); }
  }
  // độc của đòn thường ("Độc sát - ngoại công: +N điểm/lần" của đồ — anh 30/10 "các dòng của đồ xanh phải có tác dụng như client"): engine
  // KNpcAttribModify gắn độc của đồ N điểm mỗi 10 vòng trong 60 vòng (defPOISON_DAMAGE_INTERVAL / TIME) — bản trước trừ ngay 1 lần N (chỉ 1/6).
  // Mỗi đòn trúng 1 lớp độc như chiêu (vocong.js mobTick); chưa có võ công (P.vc) thì trừ ngay
  docDon(m, v, pt) { // pt: chỉ số phân thân ra đòn (nhanvatmay.js — lớp độc ghi nguồn, vocong.js mobTick)
    if (!this.P.vc) return this.hit(pt || this.player, m, { v, poison: true });
    const ev = 10 * TICK, layer = { v, until: this.time + 60 * TICK + ev / 2, ...(pt ? { pt } : {}) }, P0 = m.poison && m.poison.until > this.time ? m.poison : null; // dư nửa nhịp: đủ 6 lần (vocong.js)
    m.poison = P0 ? { ...P0, list: [...P0.list, layer], every: Math.min(P0.every, ev), until: Math.max(P0.until, layer.until) } : { list: [layer], every: ev, next: this.time + ev, until: layer.until };
  }
  // phóng đạn bay (ám khí) từ chỗ người chơi tới quái m
  shoot(p, m, id) {
    const fl = this.P.fx && this.P.fx.flight(id);
    if (!fl) return this.land(p, m, id);
    this.shots.push({ id, from: p, m, x: p.x, y: p.y, dx: m.x - p.x, dy: (m.y - p.y) * 2, t: 0, speed: fl.speed * 18 * SCALE, life: fl.life * TICK });
  }
  // đạn bay bám theo mục tiêu (ColFollowTarget = 1); chạm thân quái (bán kính m.radius) thì trúng — đứng ở mép tầm (tầm 240 + bán kính)
  // đạn bay vừa đủ 240 = 20 vòng × 16; hết thời gian sống chưa chạm (quái chạy xa) hoặc mục tiêu chết thì mất
  updateShots(dt) {
    this.shots = this.shots.filter((s) => {
      s.t += dt;
      if (!s.m.alive) return false;
      const lx = s.m.x - s.x, ly = (s.m.y - s.y) * 2, d = Math.hypot(lx, ly), step = s.speed * dt;
      if (d <= step + s.m.radius) { this.land(s.from, s.m, s.id); return false; }
      if (s.t > s.life) return false;
      s.x += (lx / d) * step; s.y += (ly / d) * step / 2; s.dx = lx; s.dy = ly;
      return true;
    });
  }

  // quái gần nhất (đang đánh mình ưu tiên); Trợ Thủ: chỉ quái trong vùng — quanh tọa độ đang tới (danh.tim) / quanh chỗ bật (danh.kc);
  // ưu tiên "dacbiet": có tinh anh / thủ lĩnh / Boss Hoàng Kim trong vùng thì nhắm con gần nhất trong số đó trước (game hiện chỉ có trùm
  // bãi — m.boss; loại quái đặc biệt về sau gắn m.dacBiet), không có mới tới quái thường
  nearestMob() {
    const p = this.player, A = this.hero.auto && this.hero.auto.danh, pt = this.diemTd(), th = this.auto && this.theo ? this.theo() : null;
    // Hoạt động (anh 04/11 lượt 25 — "vào phong hoả hay các hoạt động như boss, khi nào mình bật auto chuyên biệt cho hoạt động lên, thì nó chỉ tự đánh
    // trong phạm vi 500-600 thôi, như v ng chơi kéo đi đâu cũng k bị khựng, khi nào quái tới phạm vi mới đánh"; "auto trong phong hoả rất lạ, nó cứ chạy
    // đi đâu ấy"): Phong Hỏa có bật Trợ Thủ "ở lại trận" / đứng gần boss thế giới (hoatDong) -> chỉ con trong hdR() quanh chỗ nhân vật đang đứng — không
    // neo, không giữ cổng (bản lượt 19c: quân trong 800 quanh cổng thành / 650 quanh chỗ kéo tới), hết quái thì đứng chờ (autoIdle). Thứ tự: boss thế giới
    // (Trợ Thủ ưu tiên boss) > chiến xa / con đang đánh mình (gần × 0,5 / × 0,6) > gần nhất
    const hd = this.hoatDong();
    if (hd) {
      const R = this.hdR(), uuBoss = !!(A && A.boss);
      if (hd === "tk" && this.pk()) return this.pkChon(this.pk()); // thẻ PK: chọn theo ưu tiên của thẻ (anh 06/11)
      let b = null, bd = Infinity;
      for (const m of this.mobs) {
        if (!m.alive || m.an || m.dummy || m.nhim || (hd === "ph" && !m.ph) || (hd === "tk" && (!(m.tkb || m.tkn) || this.tkAnToan(m, m.tkPhe))) || this.neBoss(m)) continue;
        const d = ldist(p.x, p.y, m.x, m.y); if (d > R) continue;
        if (this.boQua(m) && d > HD_SAT) continue; // con vừa đuổi không tới bị bỏ qua (boMuc) — đứng sát bên thì vẫn đánh (anh 04/11 "quái đây mà auto k đánh")
        const k = m.btg && uuBoss ? -1 : d * (m.vai === "xe" ? 0.5 : m.muc === p ? 0.6 : 1);
        if (k < bd) { bd = k; b = m; }
      }
      return b;
    }
    if (this.tamDung) return this.bossGan() || this.nhimGan(); // tự đánh tạm dừng ở thôn / thành: chỉ boss thế giới / nhím đứng gần (không mộc nhân)
    // tổ đội: đánh cùng mục tiêu -> quái chung / Vượt Ải: đúng con đội trưởng đang đánh; bãi quái riêng: quanh chỗ đội trưởng đang đánh, gần chỗ
    // đó nhất trước; theo sau -> quanh người đang theo
    const dung = this.mucDoi(); if (dung) return dung;
    // theo sau + đánh cùng mục tiêu mà đội trưởng chưa đánh con nào (đang đi): không tự tìm con khác, theo sát — chỉ đánh trả con đang đuổi mình
    // (anh 02/11)
    if (th && th.theo && th.cung && th.tx == null) return this.mobs.find((m) => m.alive && !this.boQua(m) && !this.neBoss(m) && (m.vaDoi || m.btg ? m.muc === p : m.aggro) && ldist(p.x, p.y, m.x, m.y) <= THEO_TIM) || null;
    const goc = th && th.tx != null ? [th.tx, th.ty] : null;
    const [cx, cy, R] = goc ? [goc[0], goc[1], THEO_MUC] : th && th.theo ? [th.x, th.y, THEO_TIM] : pt ? [pt[0], pt[1], A.tim] : A && A.kc > 0 && this.neo ? [this.neo[0], this.neo[1], A.kc] : [0, 0, Infinity];
    // boss thế giới đứng gần (bossGan) trong vùng đánh: nhắm nó trước mọi con khác (Trợ Thủ danh.boss — anh 31/10 "đánh boss không ổn")
    if (A && A.boss) { const b = this.bossGan(); if (b && !(R < Infinity && ldist(cx, cy, b.x, b.y) > R)) return b; }
    // Trợ Thủ tự săn Boss Sát thủ (anh 03/11 — main.js đặt satUu khi src/game/tulam.js đang đưa đi hạ boss): boss nhiệm vụ của mình đứng gần thì nhắm
    // nó trước, cả ngoài vùng đánh
    if (this.satUu) { const nv = (this.hero.satThu || {}).nv | 0, b = nv && this.mobs.find((m) => m.alive && m.sat === nv && !this.boQua(m) && ldist(p.x, p.y, m.x, m.y) <= BTG_GAN); if (b) return b; }
    const dacBiet = A && A.uuTien === "dacbiet" && this.mobs.some((m) => m.alive && (m.boss || m.dacBiet) && !this.boQua(m) && !this.neBoss(m) && !(R < Infinity && ldist(cx, cy, m.x, m.y) > R));
    let best = null, bd = Infinity;
    for (const m of this.mobs) {
      // nhím (sannhim.js): chỉ con mình đã tới gần (Trợ Thủ không dò nhím khắp thành), chưa bắt đủ số con trong ngày (nhimDu)
      if (!m.alive || this.boQua(m) || this.neBoss(m) || (m.nhim && (this.nhimDu || ldist(p.x, p.y, m.x, m.y) > NHIM_GAN))) continue; // neBoss: Boss Sát thủ phải né
      if (R < Infinity && ldist(cx, cy, m.x, m.y) > R) continue;
      if (dacBiet && !(m.boss || m.dacBiet)) continue;
      const d = goc ? ldist(goc[0], goc[1], m.x, m.y) : ldist(p.x, p.y, m.x, m.y) * (m.aggro ? 0.6 : 1); // quái đang đánh mình ưu tiên trước
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  // con không tới được (đổi mục tiêu / kẹt / không có đường): bỏ qua 5 giây, lần sau với chính con đó gấp đôi tới 2 phút (anh 01/11 "map Kiếm
  // Các chạy qua chạy lại góc này liên tục, kẹt con quái góc này" — trước luôn 5 giây: hết 5 giây con đó lại gần nhất, chạy tới rồi kẹt tiếp).
  // Đánh trúng được thì xóa (World.hit)
  boMuc(m) { m.unreach = this.time; m.boQuaT = Math.min(120, 5 * 2 ** (m.unreachN | 0)); m.unreachN = (m.unreachN | 0) + 1; }
  // con đội trưởng đang đánh ở bãi quái chung / Vượt Ải (mã chung cả bãi — theoCua uid; anh 02/11) còn sống, chưa bỏ qua | null
  mucDoi() { const th = this.auto && this.theo ? this.theo() : null; return (th && th.uid && this.mobs.find((m) => m.alive && m.vaDoi === th.uid && !this.boQua(m))) || null; }
  boQua(m) { return !!m.unreach && this.time - m.unreach < (m.boQuaT || 5); }

  // boss thế giới còn sống cách mình ≤ BTG_GAN; boQua: bỏ con vừa không tới được (unreach 5 giây — nhắm mục tiêu), không bỏ khi xét "đang đánh boss"
  bossGan(boQua = true, r = BTG_GAN) {
    const p = this.player;
    for (const m of this.mobs) if (m.btg && m.alive && !(boQua && this.boQua(m)) && ldist(p.x, p.y, m.x, m.y) <= r) return m;
    return null;
  }
  // đang ở hoạt động (anh 04/11 lượt 25 — tự đánh chỉ quanh nhân vật, nearestMob / autoIdle): "ph" Phong Hỏa có bật Trợ Thủ "ở lại trận" (main.js
  // phTuDanh) | "boss" boss thế giới còn sống đứng gần (BTG_GAN) | null
  hoatDong() { return this.tk ? "tk" : this.phTuDanh ? "ph" : this.bossGan(false) ? "boss" : null; } // tk: trong trận Tống Kim (Trợ Thủ tự đánh phe kia gần nhất — anh 05/11)
  // phạm vi tự đánh ở hoạt động: Trợ Thủ danh.hd (cùng đơn vị "Quanh chỗ bật, phạm vi"), mặc định HD_R
  hdR() { const K = this.pk(); if (K) return K.hd; const A = this.hero.auto && this.hero.auto.danh; return A && A.hd > 0 ? A.hd : HD_R; }
  // ---------- Trợ Thủ thẻ PK (anh 06/11 — auto.js pk; "bấm vào PK thì sẽ mặc định ở PK thôi, không lẫn lộn các hoạt động khác") ----------
  // cài đặt PK khi đang trong trận Tống Kim và bật | null (ngoài trận thẻ PK không có tác dụng)
  pk() { const K = this.tk && this.hero.auto && this.hero.auto.pk; return K && K.on ? K : null; }
  // mục tiêu phe kia trong K.hd quanh nhân vật (bỏ con đứng trong doanh của họ, con vừa đuổi không tới — trừ khi đứng sát): "gan" gần nhất | "mau" sinh
  // lực % thấp nhất (người phe kia: hp đã là %) | "tra" kẻ đang đánh mình (World.tkDon) còn trong phạm vi, không thì gần nhất | "nguoi" người chơi trước bot
  // K.boBinh (anh 13/11 lượt 86 "auto pk, thêm cái bỏ qua quái nhỏ (kim binh tống binh npc)"): bỏ qua quân NPC của trận (tkq — Tống binh / Kim binh … Đại tướng), Nguyên
  // soái (binh 5) vẫn đánh
  pkChon(K) {
    const p = this.player, L = [];
    for (const m of this.mobs) {
      if (!m.alive || m.an || !(m.tkb || m.tkn) || this.tkAnToan(m, m.tkPhe) || (K.boBinh && m.tkq && m.binh !== 5)) continue;
      const d = ldist(p.x, p.y, m.x, m.y); if (d > K.hd || (this.boQua(m) && d > HD_SAT)) continue;
      L.push([m, d]);
    }
    if (!L.length) return null;
    const gan = (ds) => ds.reduce((a, b) => (b[1] < a[1] ? b : a))[0], pct = (m) => m.hp / Math.max(1, m.hpMax);
    if (K.uu === "tra") { const e = this.pkKeDanh(); if (e && L.some(([m]) => m === e)) return e; }
    if (K.uu === "mau") return L.reduce((a, b) => (pct(b[0]) < pct(a[0]) - 1e-4 || (Math.abs(pct(b[0]) - pct(a[0])) <= 1e-4 && b[1] < a[1]) ? b : a))[0];
    if (K.uu === "nguoi") { const n = L.filter(([m]) => m.tkn); if (n.length) return gan(n); }
    return gan(L);
  }
  // người / bot phe kia vừa đánh mình (≤ 6 giây — World.tkDon) còn sống | null
  pkKeDanh() { const D = this.tkDon; if (!D || this.time - D.t > 6) return null; const e = this.tkThucThe(D.ref); return e && e.alive ? e : null; }
  // đang đánh con khác mà kẻ đánh mình ("tra") / người chơi phe kia ("nguoi" — đang đánh bot) vào phạm vi: đổi sang (giữa 2 đòn, mỗi 0,5 giây xét 1 lần)
  pkDoi(p, K) {
    if (p.manual || !p.target || p.act === "attack" || p.cast || (K.uu !== "tra" && K.uu !== "nguoi") || this.time - (this.pkDoiT || 0) < 0.5) return;
    this.pkDoiT = this.time;
    const m = this.pkChon(K);
    if (m && m !== p.target && (K.uu === "tra" ? m === this.pkKeDanh() : m.tkn && !p.target.tkn)) { p.target = m; p.tgtT = 0; p.tgtD = null; p.path = null; }
  }
  // bùa hại đã học (dùng được ở bản này), tính lại mỗi giây
  pkBuaHai() {
    if (this._pkHai && this.time - this._pkHaiT < 1) return this._pkHai;
    const db = this.P.skillDb || {}; this._pkHaiT = this.time;
    return (this._pkHai = Object.keys(this.hero.skills || {}).map(Number).filter((id) => this.skLv(id) > 0 && db[id] && this.P.vc && this.P.vc.sk(id) && kindOf(db[id], db) === "curse"));
  }
  // bùa hại lên mục tiêu trước khi đánh: K.hai "tu" mọi bùa hại đã học | mã 1 bùa | 0 không. Bùa nào mục tiêu chưa mang (hoặc sắp hết) thì ra; mỗi bùa
  // thử lại trên cùng con sau ≥ 3 giây (trượt / bị kháng). Còn bùa chưa ra mà đứng ngoài tầm bùa: pkTam = tầm bùa (updateHero tới gần đủ tầm rồi mới
  // đánh). Trả true khi vừa ra bùa
  // "Tự dùng": tối đa PK_HAI bùa cấp cao nhất mỗi mục tiêu; mục tiêu còn dưới PK_HAI_MAU máu thì đánh luôn (soát 06/11: 4 bùa hại x ~1 giây thi pháp — đồng
  // đội hạ mục tiêu trước, 14 giây ra 11 bùa mới được 1 đòn)
  pkHai(K, m) {
    const p = this.player; if (!m || !m.alive || p.an) return false;
    const mau = m.tkn ? (m.hp ?? 100) / 100 : m.hp / Math.max(1, m.hpMax); if (mau < PK_HAI_MAU) return false;
    // K.hai "tu": tự chọn | ô 1–3 (anh 12/11 thêm 2 ô: K.hai2, K.hai3) — bùa cụ thể, bỏ trùng, ra lần lượt theo thứ tự ô
    for (const id of K.hai === "tu" ? [...this.pkBuaHai()].sort((a, b) => this.skLv(b) - this.skLv(a)).slice(0, PK_HAI) : K.hai ? [...new Set([K.hai, K.hai2, K.hai3].filter(Boolean).map(Number))] : []) {
      const lv = this.skLv(id); if (lv < 1) continue;
      if ((m.curse || []).some((c) => c.id === id && c.until > this.time + 1)) continue;
      const thu = (m.buaThu = m.buaThu || {}); if (thu[id] && this.time - thu[id] < 3) continue;
      if (!this.skCan(id).ok) continue;
      const tam = Math.min(this.skRange(id, lv), laBoss(m) ? BOSS_TAM * SCALE : Infinity); // boss (Nguyên soái…): bùa hại cũng trong BOSS_TAM (anh 16/11)
      if (ldist(p.x, p.y, m.x, m.y) > tam + m.radius) { this.pkTam = Math.min(this.pkTam || Infinity, tam); continue; }
      thu[id] = this.time; this.castStart(id, lv, m, null); return true;
    }
    return false;
  }
  // về doanh (K.ve): sinh lực dưới K.vePct % -> thôi đánh, chạy về giữa doanh phe mình (khu an toàn), đứng đó (thuốc — main.js autoDrink, hồi sinh lực
  // của đồ) tới khi đủ K.ra % mới ra lại — 2 mức cách nhau nên không chạy ra chạy vào. Ra lại: chạy về chỗ đang đánh lúc lui (pkVe — doanh thường xa
  // chỗ đánh, đứng ở doanh thì không thấy ai trong phạm vi), gặp địch trong phạm vi trên đường thì đánh luôn. Người chơi tự bấm đi / đánh thì để họ;
  // trọng thương thì thôi (updateHero). -> đang lui
  // Trận thật Tống Kim (đặc tả đợt 2): khu an toàn là hậu doanh — lui = chạy tới bẫy đại doanh -> hậu doanh gần nhất (tkbot.js tkDiemAn; tongkim.js dịch
  // chuyển khi giẫm lên), tới hậu doanh là đứng chờ; ra lại: tkTuRa đưa ra cổng hậu doanh trước, rồi mới về chỗ cũ (đường xa theo lưới điểm — tkDuongDai)
  pkLuiTick(p, K, dt) {
    const T = this.tk, tran = !!(T && T.tran), c = T && this.tkDiemAn(p);
    if (!K || !K.ve || !c) { this.pkLuiDang = this.pkLuiBo = false; this.pkVe = null; return false; }
    const pct = (p.hp * 100) / Math.max(1, p.hpMax), R = T.R || 220, an = tran ? this.tkTrongAn(p) : ldist(p.x, p.y, c[0], c[1]) <= R;
    const duong = (x, y) => (tran ? this.tkDuongDai(x, y) : this.map.path(p.x, p.y, x, y)) || [[x, y]];
    // đã thôi chờ (pkLuiBo): không lui lại tới khi sinh lực lên lại ≥ K.vePct (hồi nhỏ giọt) hoặc trọng thương (updateHero) — soát lần 2 06/11: thôi chờ
    // mà máu vẫn dưới K.vePct thì khung sau lại lui, 10 giây lại ra 1 khung -> vẫn đứng doanh cả trận
    if (this.pkLuiBo && pct >= K.vePct) this.pkLuiBo = false;
    if (!this.pkLuiDang && !this.pkLuiBo && pct < K.vePct) {
      this.pkLuiDang = true; this.pkVe = !an ? [p.x, p.y, this.time] : null;
      p.target = null; p.path = null; p.goal = null; this.pkLuiRe = 0; this.pkLuiMax = pct; this.pkLuiT = this.pkLuiT0 = this.time; this.skMsg("Sinh lực thấp — về doanh");
    } else if (this.pkLuiDang && pct >= Math.max(K.ra, K.vePct + 1)) { this.pkLuiDang = false; p.path = null; if (this.pkVe) this.pkVe[2] = this.time; }
    // đang lui: main.js autoDrink uống tới mức ra lại; máu không lên PK_LUI_CHO giây (hết thuốc…) hoặc cả lần quá PK_LUI_TOI giây (chỉ hồi nhỏ giọt) thì
    // thôi chờ, ra trận lại (soát 06/11: chờ đủ K.ra mà không gì hồi tới đó -> treo máy đứng ở doanh cả trận). Bị đánh tụt máu trên đường về thì mốc so
    // hạ theo (hồi lại sau đó vẫn tính là máu lên)
    else if (this.pkLuiDang) {
      if (pct < (this.pkLuiMax ?? pct)) this.pkLuiMax = pct;
      if (pct > this.pkLuiMax + 0.5) { this.pkLuiMax = pct; this.pkLuiT = this.time; }
      else if (this.time - (this.pkLuiT ?? this.time) > PK_LUI_CHO || this.time - (this.pkLuiT0 ?? this.time) > PK_LUI_TOI) {
        this.pkLuiDang = false; this.pkLuiBo = pct < K.vePct; p.path = null; if (this.pkVe) this.pkVe[2] = this.time; this.skMsg("Sinh lực không lên — ra trận lại");
      }
    }
    if (!this.pkLuiDang) {
      // ra lại: tới chỗ cũ (≤ 60) / có mục tiêu / người chơi tự đi / quá 20 giây thì thôi
      const v = this.pkVe;
      if (v && (p.target || p.manual || ldist(p.x, p.y, v[0], v[1]) <= 60 || this.time - v[2] > (tran ? 40 : 20))) this.pkVe = null;
      else if (v && tran && an) { /* còn trong hậu doanh: tkTuRa đưa ra cổng hậu doanh trước */ }
      else if (v && ((this.pkLuiRe = (this.pkLuiRe || 0) - dt) <= 0 || !p.path || !p.path.length)) { this.pkLuiRe = 1; p.path = duong(v[0], v[1]); }
      return false;
    }
    if (p.manual) return false;
    p.target = null; p.loot = null;
    if (tran ? an : ldist(p.x, p.y, c[0], c[1]) <= (T.R || 220) * 0.5) { if (p.path && p.path.length && !p.goal) p.path = null; return true; }
    if ((this.pkLuiRe = (this.pkLuiRe || 0) - dt) <= 0 || !p.path || !p.path.length) { this.pkLuiRe = 1; p.path = duong(c[0], c[1]); }
    return true;
  }

  // Boss Sát thủ Trợ Thủ phải né (danh.neSat — anh 03/11 "không đánh boss"): mọi Boss Sát thủ trừ boss nhiệm vụ của mình (hero.satThu.nv)
  neBoss(m) { const A = this.auto && this.hero.auto && this.hero.auto.danh; return !!m.sat && !!A && A.neSat !== 0 && m.sat !== ((this.hero.satThu || {}).nv | 0); }
  // hết quái để đánh mà Boss Sát thủ phải né đứng gần (anh 03/11 "đánh xong quái quanh boss thì đi góc khác"): theo tọa độ -> sang tọa độ kế; quanh
  // chỗ bật -> dời chỗ bật ra xa boss (hướng từ boss ra mình, vướng thì lệch dần); không giới hạn -> chạy ra xa. Trả true khi đã cho đi
  neDi(p, pt) {
    const b = this.mobs.find((m) => m.alive && this.neBoss(m) && ldist(p.x, p.y, m.x, m.y) <= (m.vision || 400) + NE_THEM);
    if (!b) return false;
    const bao = () => { if (this._neBao !== b) { this._neBao = b; this.P.hud.msg(`Trợ Thủ: né ${b.name} — sang chỗ khác đánh quái`); } };
    if (pt) { this.tdI++; const q = this.diemTd(); if (q && this.walkTo(q[0], q[1])) { bao(); return true; } return false; }
    const A = this.hero.auto.danh, R = (b.vision || 400) + NE_XA, a0 = Math.atan2((p.y - b.y) * 2, p.x - b.x);
    for (const da of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, Math.PI]) {
      const x = b.x + Math.cos(a0 + da) * R, y = b.y + (Math.sin(a0 + da) * R) / 2;
      if (!this.map.walkable(x, y) || !this.walkTo(x, y)) continue;
      if (A.kc > 0 && this.neo) this.neo = [x, y];
      bao(); return true;
    }
    return false;
  }
  // nhím Săn Nhím Béo Phì còn sống cách mình ≤ NHIM_GAN (chưa bắt đủ số con trong ngày — nhimDu); đứng trong khu an toàn thì không (treo máy
  // trong thành không tự bắt nhím ra gần cổng — phải tự đi ra); boQua như bossGan
  nhimGan(boQua = true) {
    const p = this.player; if (this.nhimDu || this.map.an(p.x, p.y)) return null;
    for (const m of this.mobs) if (m.nhim && m.alive && !(boQua && this.boQua(m)) && ldist(p.x, p.y, m.x, m.y) <= NHIM_GAN) return m;
    return null;
  }

  updateMob(m, dt) {
    if (m.tkb) return this.tkCapNhatBot(m, dt); // bot Tống Kim (tkbot.js): máy chủ trận chạy não, máy khác vẽ theo vị trí báo
    if (m.tkn) return; // người phe kia (Tống Kim): chỗ đứng theo người chơi khác (tongkim.js dongBo)
    m.t += dt;
    if (!m.alive) { m.deadT += dt; if (m.coc && m.deadT >= HOI_COC) hoiCoc(this, m); return; } // cọc đảo Tẩy Tủy mọc lại
    // mộc nhân luyện công (mocnhan.js): đứng yên, không đánh trả — chỉ chạy độc / bùa / choáng, bị đánh xong về đứng
    // nhím Săn Nhím Béo Phì (m.nhim — sannhim.js, anh 03/11) cũng vậy: đứng yên, không đánh trả
    if (m.dummy || m.nhim) { if (this.P.vc) this.mobTick(m, dt); if (m.act === "hurt" && m.t >= m.hurtDur) this.setAct(m, "stand"); return; }
    // quái chung ở máy không làm chủ bãi (anh 02/11 — src/game/quaichung.js ngoai): con không đuổi mình thì chỗ đứng / động tác vẽ theo chủ bãi
    // báo (nội suy như người chơi khác), không tự chạy; độc / bùa mình gây vẫn tính ở đây (mobTick)
    if (m.ngoai && this.onNgoai) { if (this.P.vc) this.mobTick(m, dt); this.onNgoai(m, dt); return; }
    if (this.P.vc && this.mobTick(m, dt)) return; // độc, bùa hút máu, choáng
    // hoảng loạn (dòng randmove — Thiên Nhẫn Ma Âm Phệ Phách: "không thể tấn công và di chuyển" 4 giây)
    if (this.P.vc && this.mobMod(m, "randmove") > 0) { m.path = null; if (m.act !== "hurt") this.setAct(m, "stand"); return; }
    // boss thế giới (m.btg — bosstg.js, anh 31/10 "boss đánh không cùng 1 mục tiêu"): đuổi mục tiêu chung máy chủ chọn (m.muc = mình / người khác
    // cùng bãi — others, hp là % sinh lực; chưa có thì về chỗ); chỉ máy của người bị đánh trừ máu, máy khác chỉ thấy boss ra đòn. Quái Vượt Ải tổ
    // đội (m.vaDoi — vadoi.js, anh 31/10) cũng vậy: máy chủ bãi chọn mục tiêu từng con, chưa có mục tiêu thì đứng (máy chủ bãi báo vị trí)
    const p = m.btg || m.vaDoi ? m.muc || BTG_TRONG : this.player, minh = p === this.player;
    // ẩn thân / đứng trong khu an toàn của thôn / thành (anh 02/11 — trạng thái phi chiến đấu): quái không thấy, bỏ đuổi về chỗ
    const alive = p.hp > 0, spk = this.P.vc ? this.mobSpeedK(m) : 1, seen = alive && !(p.hideUntil > this.time) && !this.map.an(p.x, p.y);
    // quân Phong Hỏa có chiêu (vocong.js ganChieuDs — anh 04/11 lượt 25): chiêu vào người chơi ở tầm chiêu (m.reach), đánh NPC phe kia đòn thường ở tầm cũ
    const tam = p.kind === "mob" && m.reachNpc ? m.reachNpc : m.reach;
    if (m.vaDoi) { m.aggro = !!m.muc && seen; m.leash = false; }
    // quái KHÔNG tự hồi máu (anh chốt 23/10: "đánh được bao nhiêu thì bấy nhiêu") — bỏ cả LifeReplenish của npcs.txt (m.lifeRep, chưa rõ
    // client tính theo giây hay theo nhịp) lẫn hồi máu lúc bỏ đuổi về chỗ cũ
    if (m.act === "attack") {
      if (!m.hitDone && m.t >= m.atkDur * HIT_AT) {
        m.hitDone = true;
        // quái có võ công (bản mẫu): ra chiêu — sát thương / trạng thái khi đạn trúng người chơi (vocong.js misHitHero)
        if (seen && minh && m.vc && ldist(m.x, m.y, p.x, p.y) <= m.reach + 30 && this.quaiChieuLuotNay(m)) this.quaiRaChieu(m, p);
        // Phong Hỏa Liên Thành: đòn trúng NPC phe kia (lính <-> vệ binh / tướng quân) — máy chủ bãi tính sát thương (phonghoa.js danhNpc)
        else if (seen && !minh && p.kind === "mob" && this.onDanhNpc && ldist(m.x, m.y, p.x, p.y) <= tam + 30) this.onDanhNpc(m, p);
        else if (seen && minh && ldist(m.x, m.y, p.x, p.y) <= m.reach + 30) {
          // boss thế giới chủ độc (m.heSt "poison" — bosstg.js, lượt 86): đòn thường trừ kháng độc thay kháng vật lý
          const mm = this.P.vc ? { ...m, ar: m.ar * (1 + this.mobMod(m, "attackratingenhance_p") / 100) } : m, d = m.heSt ? R.mobDamageHe(mm, p, m.heSt) : R.mobDamage(mm, p);
          if (!d.miss) this.guard(m, p, d); // võ công: giảm theo hệ, triệt tiêu, nội lực hộ thân, bùa giảm sát thương trên quái
          this.hit(m, p, d);
          if (!d.miss) this.spawnFx(HIT_FX, p);
          this.phanDon(m, d); // "Phản đòn cận chiến / tầm xa" của đồ và võ công (Dịch Cân Kinh, La Hán Trận…) — số cam
        }
      }
      if (m.t >= m.atkDur) { this.setAct(m, "stand"); m.atkT = m.atkGap / ((this.P.vc ? this.mobAtkK(m) : 1) * (m.tocDanh || 1)); } // tocDanh: quái bản chung (quaichung.js)
      return;
    }
    if (m.act === "hurt" && m.t < m.hurtDur) return;
    m.atkT -= dt;
    const dp = ldist(m.x, m.y, p.x, p.y), dh = ldist(m.x, m.y, m.home[0], m.home[1]);
    // boss thế giới: máy chủ đã chọn mục tiêu (theo sát thương / đứng gần) -> đuổi luôn, trừ khi người đó ở ngoài tầm đuổi quanh chỗ boss
    if (!m.vaDoi && seen && !m.leash && !m.aggro && (m.btg ? ldist(p.x, p.y, m.home[0], m.home[1]) <= m.active + m.reach : dp < m.vision)) { m.aggro = true; this.keoNhom(m); }
    // quái Vượt Ải (m.va): đã lao vào thì không bỏ đuổi về chỗ cũ (anh 28/10 "bu vào xong 1 lúc lại tự quay về chỗ cũ, trông chán")
    // quân Phong Hỏa (m.ph): không tự về chỗ — bỏ đuổi thì đi tiếp đường / về chỗ đứng do phonghoa.js đặt
    if (!seen || (dh > m.active && !m.va && !m.ph)) { m.aggro = false; m.leash = !m.va && !m.ph && dh > 30; }
    if (m.leash) { // về chỗ cũ (không hồi máu)
      if ((m.repath -= dt) <= 0) { m.path = this.map.path(m.x, m.y, m.home[0], m.home[1], 3000) || []; m.repath = 1; }
      const x0 = m.x, y0 = m.y;
      if (!m.path || !m.path.length || this.follow(m, m.path, m.run * spk, dt)) { m.leash = false; m.path = null; m.repath = 0; this.setAct(m, "stand"); }
      else this.setAct(m, "run");
      // về chỗ cũ mà 3 giây không nhích được -> đặt thẳng về chỗ sinh (như quái client "về vị trí")
      if (m.leash && Math.abs(m.x - x0) + Math.abs(m.y - y0) <= 0.3 && (m.stuckT = (m.stuckT || 0) + dt) > 3) { m.stuckT = 0; [m.x, m.y] = m.home; m.leash = false; m.path = null; }
      return;
    }
    if (m.aggro) {
      if (dp <= tam + 14) {
        m.path = null; m.dir = dirOf(p.x - m.x, (p.y - m.y) * 2);
        if (m.atkT <= 0) {
          m.atkAct = rand() < 0.7 ? "attack1" : "attack2";
          m.atkDur = (this.P.npc.duration(m.type, m.atkAct) || 1) / (m.tocDanh || 1); // quái bản chung đánh nhanh hơn (quaichung.js tocDanh)
          m.atkN = (m.atkN | 0) + 1; // quái chung: chủ bãi báo số đòn -> máy khác vung theo (quaichung.js)
          this.setAct(m, "attack"); m.hitDone = false; this.P.audio.npc(m.type, m.atkAct, 0.45);
        }
        else this.setAct(m, "stand");
        return;
      }
      if ((m.repath -= dt) <= 0) { m.path = this.map.path(m.x, m.y, p.x, p.y, 2500) || []; m.repath = 0.5 + rand() * 0.3; }
      const x0 = m.x, y0 = m.y;
      if (m.path && m.path.length) { this.follow(m, m.path, m.run * spk, dt); this.setAct(m, "run"); } else this.setAct(m, "stand");
      // đuổi mà 2 giây không nhích được (bị chặn, không có đường) -> thôi đuổi, về chỗ cũ
      if (Math.abs(m.x - x0) + Math.abs(m.y - y0) > 0.3) m.stuckT = 0;
      else if ((m.stuckT = (m.stuckT || 0) + dt) > 2) { m.stuckT = 0; if (m.ph) m.mucTen = null; else if (!m.va) { m.aggro = false; m.leash = true; } m.path = null; m.repath = 0; } // Vượt Ải: tìm đường lại, không về; Phong Hỏa: bỏ mục tiêu đó
      return;
    }
    // Vượt Ải tổ đội: không mục tiêu thì đi bộ theo đường vadoi.js đặt (chủ bãi: đi loanh quanh chỗ đứng; máy khác: tới chỗ chủ bãi báo), không có
    // đường thì đứng
    if (m.vaDoi) {
      if (m.path && m.path.length) { if (this.follow(m, m.path, m.walk * spk, dt)) m.path = null; this.setAct(m, "walk"); }
      else this.setAct(m, "stand");
      return;
    }
    // đi lang thang quanh chỗ sinh
    m.wander -= dt;
    if (m.wander <= 0 && !(m.path && m.path.length)) {
      m.wander = rnd(3, 8);
      const a = rand() * Math.PI * 2, r = rnd(30, 110), tx = m.home[0] + Math.cos(a) * r, ty = m.home[1] + Math.sin(a) * r * 0.5;
      if (this.map.walkable(tx, ty) && this.map.clear(m.x, m.y, tx, ty)) m.path = [[tx, ty]];
    }
    if (m.path && m.path.length) { if (this.follow(m, m.path, m.walk * spk, dt)) m.path = null; this.setAct(m, "walk"); }
    else this.setAct(m, "stand");
  }

  // Vượt Ải (anh 28/10 "chỉ nên bu vào theo bộ phận hoặc khoảng cách người chơi tiếp cận"): quái ải vừa lao vào (người chơi tới gần / bị
  // đánh) kéo theo các con cùng ải đứng trong m.keo quanh nó — chỉ 1 lớp (con bị kéo không kéo tiếp), không kéo cả đội hình
  keoNhom(m) {
    if (!m.va || !m.keo) return;
    for (const o of this.mobs) if (o !== m && o.va && o.alive && !o.aggro && ldist(o.x, o.y, m.x, m.y) <= m.keo) { o.aggro = true; o.leash = false; }
  }

  // Đi theo đường; trả true khi tới nơi
  follow(e, path, speed, dt) {
    let step = speed * dt;
    while (step > 0 && path.length) {
      const [tx, ty] = path[0], d = ldist(e.x, e.y, tx, ty);
      if (d > 0.01) e.dir = dirOf(tx - e.x, (ty - e.y) * 2);
      if (d <= step) { e.x = tx; e.y = ty; path.shift(); step -= d; continue; }
      const k = step / d, nx = e.x + (tx - e.x) * k, ny = e.y + (ty - e.y) * k;
      if (this.map.walkable(nx, ny)) { e.x = nx; e.y = ny; }
      else if (this.map.walkable(nx, e.y)) e.x = nx;      // trượt dọc tường
      else if (this.map.walkable(e.x, ny)) e.y = ny;
      else { path.length = 0; return true; }
      step = 0;
    }
    return !path.length;
  }

  // Tách quái chồng lên nhau (đẩy nhẹ theo logic). Mộc nhân / cọc thử không bị đẩy nên bỏ khỏi phép so từng cặp (đảo Tẩy Tủy có 486 cọc).
  // Anh 01/11 ("quái kẹt nhau" — từng cặp sói đứng trùng khít): 2 con đuổi cùng 1 đường dừng đúng 1 điểm nút (follow đặt thẳng vào điểm) ->
  // cách nhau 0, bản trước bỏ qua cặp đó (không có hướng đẩy) nên trùng mãi. Nay trùng khít thì đẩy theo hướng lấy từ mã 2 con; đang đánh mà
  // chồng quá nửa thân cũng đẩy (trước con đang đánh không bị đẩy)
  separate() {
    const L = [...this.mobs, ...this.dongMinh].filter((m) => m.alive && !m.dummy && !m.ngoai && !m.tkn); // quái chung vẽ theo chủ bãi (m.ngoai): chủ bãi đã đẩy; người phe kia Tống Kim: chỗ của họ
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      // 2 bot Tống Kim (anh 06/11 "đứng chụm vào hết, vèo cái chết sạch"): giãn tới BOT_GIAN, đẩy nhẹ cả lúc đang đánh (bản trước 22 điểm như quái)
      const a = L[i], b = L[j], bb = !!(a.tkb && b.tkb && a.tkPhe === b.tkPhe), d = ldist(a.x, a.y, b.x, b.y), need = bb ? BOT_GIAN : (a.radius + b.radius) * 0.8; // cùng phe (2 phe khác nhau vẫn áp sát đánh nhau được)
      if (d >= need) continue;
      const g = ((a.uid * 7 + b.uid * 13) % 16) * (Math.PI / 8), [ux, uy] = d < 0.001 ? [Math.cos(g), Math.sin(g) / 2] : [(b.x - a.x) / d, (b.y - a.y) / d];
      const push = bb ? (need - d) * 0.06 : (need - d) / 2, dx = ux * push, dy = uy * push, sat = !bb && d < need / 2;
      const day = (m) => (bb ? m.act === "run" : m.act !== "attack" || sat); // 2 bot cùng phe: chỉ con đang chạy
      if (day(a) && this.map.walkable(a.x - dx, a.y - dy)) { a.x -= dx; a.y -= dy; }
      if (day(b) && this.map.walkable(b.x + dx, b.y + dy)) { b.x += dx; b.y += dy; }
    }
  }

  setAct(e, act) { if (e.act !== act) { e.act = act; e.t = 0; } }

  // anh 16/11 — đánh boss phải đứng gần: người ra đòn là mình / phân thân thì phải cách boss ≤ BOSS_TAM (đơn vị client) + thân + 40 dư (đạn bay, boss chạy);
  // nguồn khác (quái, không rõ) không xét
  ganBoss(src, m) { const a = src && (src === this.player || src.pt) ? src : null; return !a || !Number.isFinite(a.x) || ldist(a.x, a.y, m.x, m.y) <= BOSS_TAM * SCALE + (m.radius || 0) + 40; }
  hit(src, dst, dmg) {
    if (dst.coc && !dst.alive) return; // cọc đảo Tẩy Tủy đã vỡ, chờ mọc lại
    // boss (auto.js laBoss): đòn từ xa hơn BOSS_TAM không tính — bắn chiêu vào đất từ xa, vòng sáng hại… (anh 16/11); độc / phản đòn đã dính từ trước vẫn tính
    // quản trị bật "Một đòn chết" (công cụ thử): đánh từ xa cũng tính (anh 18/11 — siêu boss không chết 1 đòn trên máy thật)
    if (laBoss(dst) && !dmg.poison && !dmg.reflect && !(this.dev.oneHit && src === this.player) && !this.ganBoss(src, dst)) return;
    // công cụ thử "Một đòn chết" (anh 18/11 "tất cả quái boss admin đều có thể 1 đòn chết"): bot / quân Tống Kim (máu chung máy chủ — người chơi phe kia không tính)
    if (this.dev.oneHit && dst.tkb && src === this.player) dmg = { v: Math.max(1, Math.ceil(Math.max(dst.hp || 0, dst.hpMax || 0) * 2)), crit: true };
    if (dst.tkb || dst.tkn) return this.tkHit(src, dst, dmg); // Tống Kim: bot (máu chung ở máy chủ) / người phe kia (đòn thường gửi thẳng) — tkbot.js
    // đòn của phân thân (src.pt — nhanvatmay.js, anh 05/11): không đánh mộc nhân / cọc, boss thế giới, nhím, quái canh cây nhiệm vụ, quân Phong Hỏa
    const pt = !!(src && src.pt);
    if (pt && dst.kind === "mob" && (dst.dummy || dst.btg || dst.nhim || dst.mcv || dst.ph)) return;
    if (this.dev.god && dst.kind === "hero") dmg = { v: 0 };
    // quái máu chung ở máy chủ (boss thế giới / siêu boss, nhím, quái chung, Vượt Ải / Viêm Đế, quái canh, Phong Hỏa): gửi gấp đôi máu tối đa — máy chủ (quản trị đã mở khóa an toàn)
    // bỏ hạn mức sát thương / giây, cắt theo máu còn (anh 18/11). Trước: chỉ trừ máu ở máy mình, máy chủ cắt theo giây nên boss máu chung không chết 1 đòn
    else if (this.dev.oneHit && dst.kind === "mob") { const chung = !!(dst.btg || dst.nhim || dst.vaDoi || dst.mcv); dmg = { v: Math.max(1, Math.ceil(chung ? Math.max(dst.hp || 0, dst.hpMax || 0) * 2 : dst.hp)), crit: true }; }
    if (dmg.miss) { this.text(dst, "Né", "#cfd8dc"); return; }
    if (dmg.none) return;
    if (dst.unreachN && src === this.player) dst.unreachN = 0; // đánh trúng được: thôi tính bỏ qua dài (boMuc)
    if (dst.kind === "hero" && this.P.vc && dmg.v > 0) dmg = { ...dmg, v: this.shieldTake(dmg.v) }; // Lưỡng Nghi Chân Khí: nội lực đỡ đòn
    // "Nội lực hộ thân +N điểm" (dòng dynamicmagicshield_v — Côn Lôn Huyền Thiên Vô Cực; anh 09/11 "côn lôn còn 1 chiêu này nữa, em xem có bỏ sót hay k"): engine KNpc — mỗi đòn
    // bớt N / 5 điểm, tối đa 40 % đòn; đòn PK nhân hệ số sát thương PK của trận. Độc không tính
    if (dst.kind === "hero" && dst.noiHoThan > 0 && dmg.v > 0 && !dmg.poison) dmg = { ...dmg, v: Math.max(0, Math.ceil(dmg.v - Math.min((dst.noiHoThan / 5) * ((this.tk && this.tk.hs) || 1), dmg.v * 0.4))) };
    if (dst.kind === "hero" && dmg.v > 0 && !dmg.poison) this.hao[1]++; // bị đánh trúng mất máu: mũ / áo / đai / bao tay hao (engine Abrade Defend); độc thì không
    // "Chuyển hóa sát thương thành nội lực %" của đồ (anh 30/10): mất bao nhiêu sinh lực thì hồi chừng ấy % nội lực, không quá nội lực tối đa — engine
    // KNpc::ReceiveDamage: m_CurrentMana += m_CurrentDamage2Mana * nDamage / 100 (nDamage ≤ sinh lực còn)
    if (dst.kind === "hero" && dst.dmg2mana > 0 && dmg.v > 0 && dst.hp > 0) dst.mp = Math.min(dst.mpMax, dst.mp + Math.floor((Math.min(dmg.v, dst.hp) * dst.dmg2mana) / 100));
    dst.hp -= dmg.v;
    this.text(dst, String(dmg.v), dst.kind === "hero" ? "#ff6b5b" : dmg.reflect ? "#ffa94d" : dmg.poison ? "#8bff6a" : dmg.crit ? "#ffd54a" : "#ffffff", dmg.crit);
    if (dst.kind === "mob") {
      // Vượt Ải tổ đội: máy chủ bãi quyết con nào đuổi ai (vadoi.js chonMuc) — đánh trúng không tự lao vào / kéo nhóm ở máy mình
      if (!dst.vaDoi) { const moi = !dst.aggro; dst.aggro = true; dst.leash = false; if (moi) this.keoNhom(dst); }
      this.P.audio.missile(1, 1, pt ? 0.3 : 0.55);
      if (dst.dummy) { mocNhanTrung(this, dst, dmg.v); if (dst.alive && dst.act !== "hurt" && !dmg.poison && rand() * 100 < (dmg.hurt || dst.hitRecover)) this.setAct(dst, "hurt"); return; } // bất tử (cọc đảo: có máu), đếm DPS
      // boss thế giới (bosstg.js — máu chung ở máy chủ, anh 31/10): ghi sát thương gửi lên; máy mình không tự hạ boss — máy chủ báo chết
      if (dst.btg) { if (this.onBtg && dmg.v > 0) this.onBtg(dst, dmg.v); if (dst.hp < 1) dst.hp = 1; }
      // nhím Săn Nhím Béo Phì (sannhim.js — máu chung ở máy chủ, anh 03/11): như boss thế giới — máy chủ báo ai bắt được
      if (dst.nhim) { if (this.onNhim && dmg.v > 0) this.onNhim(dst, dmg.v); if (dst.hp < 1) dst.hp = 1; }
      // Vượt Ải tổ đội (vadoi.js — máu chung ở máy chủ, anh 31/10): như boss thế giới — gửi sát thương, máy chủ báo chết
      if (dst.vaDoi) { if (this.onVaDoi && dmg.v > 0) this.onVaDoi(dst, dmg.v, pt); if (dst.hp < 1) dst.hp = 1; } // pt: sát thương phân thân (quái chung gửi riêng — quaichung.js)
      // quái canh cây nhiệm vụ Võ Lâm Minh Chủ (quaicanh.js — máu chung ở máy chủ, anh 03/11): như boss thế giới — máy chủ báo chết
      if (dst.mcv) { if (this.onMcv && dmg.v > 0) this.onMcv(dst, dmg.v); if (dst.hp < 1) dst.hp = 1; }
      if ((dst.sat || dst.vaBoss || dst.bossCuoi) && src && src.kind === "hero" && dmg.v > 0) dst.cuaMinh = (dst.cuaMinh || 0) + dmg.v; // Boss Sát thủ / boss ải Vượt Ải, Viêm Đế: sát thương của mình (bảng boss phụ — bosstg.js veSat, anh 18/11)
      if (dst.hp <= 0) { dst.ptGiet = pt; return this.kill(dst); } // ptGiet: phân thân ra đòn kết liễu -> main.js onKill r[7] (người thuê đủ kinh nghiệm, không tiền / đồ)
      if (dst.act !== "attack" && !dst.jump && !dmg.poison && rand() * 100 < (dmg.hurt || dst.hitRecover)) this.setAct(dst, "hurt"); // DoHurt của chiêu
    } else {
      dst.sit = false;
      if (this.tk && src && src.tkRef != null) this.tkDon = { ref: src.tkRef, t: this.time }; // Tống Kim: người / bot vừa đánh mình (máy chủ cộng điểm người kết liễu)
      if (dst.hp <= 0) { dst.hp = 0; if (this.P.vc) this.trigAuto("autodeathskill", null); this.setAct(dst, "die"); dst.deadT = 0; dst.target = null; this.deathPenalty(); if (this.tk && this.onTkChet) this.onTkChet(); return; }
      // chiêu 120 tự phát khi bị đánh (Thiếu Lâm Đại Thừa Như Lai Chú -> Sư Tử Hống) / khi sinh lực < 25 % (Côn Lôn Lưỡng Nghi Chân Khí)
      const keDanh = src && src.kind === "mob" ? src : this.tk && src && src.tkRef != null ? this.tkThucThe(src.tkRef) : null; // Tống Kim: người / bot vừa đánh (soát 05/11)
      if (this.P.vc && keDanh && !dmg.poison) { this.trigAuto("autoreplyskill", keDanh); if (dst.hp < dst.hpMax * 0.25) this.trigAuto("autorescueskill", keDanh); }
      // giật: quái có võ công (bản mẫu) -> mọi đòn trúng có thể ngắt động tác, dài theo Thời gian phục hồi (vocong.js giatHero); không thì chỉ
      // động tác bị đánh lúc đứng yên như trước
      if (this.quaiVC) { if (src && src.kind === "mob" && !dmg.poison && dmg.v > 0) this.giatHero(src, dmg); }
      else if (dst.act === "stand" && rand() < 0.25) this.setAct(dst, "hurt");
    }
  }

  // quái chết: kinh nghiệm / ngân lượng / rơi đồ do máy chủ tính (25/10) — onKill(m) để main.js báo lên máy chủ
  kill(m) {
    if (m.tkb || m.tkn) return; // Tống Kim: máy chủ báo bot chết (tongkim.js), người phe kia tự báo
    // boss thế giới: máy chủ báo chết (bosstg.js) — không báo giết như quái thường, không đếm thủ lĩnh / tinh anh
    if (m.btg) { m.alive = false; m.hp = 0; this.setAct(m, "die"); m.deadT = 0; this.P.audio.npc(m.type, "die", 0.6); if (this.player.target === m) this.player.target = null; this.text(m, "Hạ boss thế giới!", "#ffd54a", true); return; }
    // nhím Săn Nhím Béo Phì: máy chủ báo bị bắt (sannhim.js — m.ai = người bắt); thưởng máy chủ phát cho người ra đòn kết liễu
    if (m.nhim) { m.alive = false; m.hp = 0; this.setAct(m, "die"); m.deadT = 0; this.P.audio.npc(m.type, "die", 0.6); if (this.player.target === m) this.player.target = null; if (m.ai && m.ai === this.hero.name) this.text(m, "Bắt được nhím!", NHIM_MAU, true); return; }
    // quái Vượt Ải tổ đội: máy chủ báo chết (vadoi.js) — thưởng đám / đồ rơi máy chủ phát cho từng người, không báo giết loại 4
    if (m.vaDoi) { m.alive = false; m.hp = 0; this.setAct(m, "die"); m.deadT = 0; this.P.audio.npc(m.type, "die", 0.6); if (this.player.target === m) this.player.target = null; return; }
    // quái canh cây (quaicanh.js): máy chủ báo chết — không kinh nghiệm, không rơi đồ, không báo giết
    if (m.mcv) { m.alive = false; m.hp = 0; this.setAct(m, "die"); m.deadT = 0; this.P.audio.npc(m.type, "die", 0.6); if (this.player.target === m) this.player.target = null; return; }
    m.alive = false; m.hp = 0; this.setAct(m, "die"); m.deadT = 0;
    this.kills++;
    this.demBoss = m.boss ? 0 : this.demBoss + 1; this.demTA = m.ta ? 0 : this.demTA + 1;
    this.P.audio.npc(m.type, "die", 0.6);
    if (this.onKill) this.onKill(m);
    if (this.player.target === m) this.player.target = null;
    if (m.boss) this.text(m, "Hạ thủ lĩnh!", "#ffd54a", true);
    else if (m.ta) this.text(m, "Hạ tinh anh!", TA_MAU, true);
    const cb = this.canBang || {}, Z = this.zone;
    if (this.suKien) return; // thuyền Phong Lăng Độ: đầu lĩnh ra theo giờ (main.js), không thủ lĩnh / tinh anh
    if (!m.boss && this.demBoss >= (cb.thuLinhMoi || THU_LINH_MOI) && Z.boss != null && !this.mobs.some((x) => x.boss && x.alive)) {
      const b = this.spawnMob(true, 400);
      if (b) this.text(this.player, `Thủ lĩnh ${b.name} xuất hiện!`, "#ffb74d", true);
    }
    if (!m.ta && this.demTA >= (cb.tinhAnhMoi || TINH_ANH_MOI) && cb.ta && cb.ta[Z.id] && Z.m && Z.m.length && !this.mobs.some((x) => x.ta && x.alive)) {
      const t = this.spawnMob(false, 400, { ta: true });
      if (t) this.text(this.player, `Tinh anh ${t.name} xuất hiện!`, TA_MAU, true);
    }
  }

  // ---------- kinh nghiệm / cấp ----------
  // Kinh nghiệm giết quái máy chủ tính (may-chu/do.js: bảng client × hệ số, luật chênh cấp ±10 của anh chốt 23/10). gainExp / setLevel
  // còn cho công cụ thử (main.js gửi kết quả lên máy chủ — tài khoản quản trị).
  need(lvl = this.hero.lvl) { return this.P.chr.exp[lvl - 1] || Infinity; }
  // cộng kinh nghiệm; đủ mốc bảng client (level_exp.txt) thì lên cấp: +5 tiềm năng, +1 kỹ năng, đầy sinh lực / nội lực
  gainExp(n) {
    const h = this.hero; if (!n) return;
    h.exp = (h.exp || 0) + n;
    let up = 0;
    while (h.lvl < R.MAX_LEVEL && h.exp >= this.need()) { h.exp -= this.need(); h.lvl++; up++; }
    if (h.lvl >= R.MAX_LEVEL) h.exp = Math.min(h.exp, this.need() - 1);
    if (up) this.levelUp(up);
  }
  // vừa lên up cấp (máy chủ báo, hoặc công cụ thử): điểm tiềm năng / kỹ năng tính lại theo cấp, đầy sinh lực / nội lực, chữ "Lên cấp"
  levelUp(up) {
    R.fixPoints(this.hero); this.refreshStats(true);
    this.text(this.player, "Lên cấp " + this.hero.lvl + "!", "#ffd54a", true);
    if (this.onLevel) this.onLevel(this.hero.lvl, up);
  }
  // đặt cấp (công cụ thử): điểm tiềm năng / kỹ năng tính lại theo cấp mới
  setLevel(n) {
    const h = this.hero;
    h.lvl = Math.max(1, Math.min(R.MAX_LEVEL, n | 0)); h.exp = 0; h.pts = null; h.skPts = null;
    const used = Object.values(h.attr || {}).reduce((a, b) => a + b, 0);
    if (used > R.PTS_PER_LEVEL * (h.lvl - 1)) h.attr = { str: 0, dex: 0, vit: 0, eng: 0 }; // hạ cấp dưới số điểm đã cộng: trả lại hết
    R.fixPoints(h); this.refreshStats(true);
  }
  // cộng 1 điểm tiềm năng vào str | dex | vit | eng
  addPoint(k, n = 1) {
    const h = this.hero; n = Math.min(n, h.pts || 0); if (n <= 0) return 0;
    h.attr[k] = (h.attr[k] || 0) + n; h.pts -= n; this.refreshStats(false); return n;
  }
  // tính lại chỉ số từ nhân vật (giữ tỉ lệ máu hiện tại, full = hồi đầy)
  // vòng sáng tân thủ (anh 02/11): dưới capDuoi cấp hồi sinh lực / nội lực mỗi giây (lifeRegen / manaRegen cộng mỗi nửa giây -> / 2) + tốc độ chạy %.
  // Gọi sau mỗi lần đặt chỉ số (dựng World — this.player lấy thẳng heroStats, refreshStats)
  tanThuCong(p) {
    const TT = this.tanThu;
    if (TT && (this.hero.lvl || 1) < (TT.capDuoi | 0)) { p.lifeRegen = (p.lifeRegen || 0) + (TT.hoiSinhLuc || 0) / 2; p.manaRegen = (p.manaRegen || 0) + (TT.hoiNoiLuc || 0) / 2; p.moveSpeed = (p.moveSpeed || 0) + (TT.tocChay || 0); }
  }
  refreshStats(full) {
    this.wk = weaponKind(this.hero);
    this.vcSupport = skillSupport(this.hero, this.P.skillDb || {});
    const p = this.player, st = R.heroStats(this.hero, this.P.chr, this.bonus(p.buffs)), kh = p.hp / p.hpMax, km = p.mp / p.mpMax;
    Object.assign(p, st, this.weaponAtk(), { atkDur: atkDurOf(st) });
    this.tanThuCong(p);
    // full (lên cấp): đầy sinh lực chỉ khi đang sống (soát 16/11 — lên cấp lúc đang nằm chết thì đứng dậy tại chỗ, bảng trọng thương bấm không còn tác dụng)
    if (full && p.hp > 0) { p.hp = p.hpMax; p.mp = p.mpMax; p.st = p.stMax; }
    else if (full) { p.st = p.stMax; }
    else if (p.hp > 0) { p.hp = Math.max(1, Math.round(p.hpMax * kh)); p.mp = Math.round(p.mpMax * km); p.st = Math.min(p.st, p.stMax); }
  }
  // chết (PK 0): mất 10 ‰ kinh nghiệm cần để lên cấp (tối đa 500.000, được âm như client), 50 ‰ ngân lượng mang theo — máy chủ trừ
  // (may-chu/do.js chet), main.js báo lên qua onDeath
  deathPenalty() { if (this.onDeath) this.onDeath(); }
  // hồi ngay sinh lực / nội lực (bùa Phong Hỏa Hành quân đơn / Tiểu hoàn đơn / Ngũ Hoa Lộ — may-chu/do.js nhatBua: { hp?, mp? })
  hoiNgay(o) {
    const p = this.player; if (!p || p.hp <= 0 || !o) return;
    if (o.hp > 0) { const v = Math.round(o.hp * this.hoiK()); p.hp = Math.min(p.hpMax, p.hp + v); this.text(p, `+${v}`, "#7cff7c"); }
    if (o.mp > 0) p.mp = Math.min(p.mpMax, p.mp + o.mp);
  }

  // hiệu ứng trúng đòn bám theo người bị đánh (đạn client ColFollowTarget = 1)
  spawnFx(id, e) { const F = this.P.fx; if (F && F.has(id)) this.fxs.push({ id, e, t: 0, dur: F.duration(id) }); }

  // vật rơi ở (x, y): o = { g (mã vật của máy chủ), item: { k, n, d } | gold: số lượng, tuoi: giây đã nằm (vào lại bãi — nằm sẵn, không
  // chạy hình rơi) }
  drop(x, y, o) {
    const R = this.P.roi; if (!R || this.drops.some((d) => d.g === o.g)) return;
    const id = o.item ? R.ofItem(o.item.k) : R.ofMoney(o.gold); if (id == null) return;
    // nhiều vật cùng 1 con: xòe ra quanh chỗ quái chết như client
    const n = o.tuoi ? 0 : this.drops.filter((d) => d.x0 === x && d.y0 === y).length, a = n * 2.4, r = n ? 14 + 4 * n : 0;
    this.drops.push({ g: o.g, id, x0: x, y0: y, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.5, t: o.tuoi ? R.fallTime(id) + o.tuoi : 0,
      // sl: số bình của món thuốc rơi thành chồng -> "<số> <tên>"
      life: R.fallTime(id) + (R.M.vat[id].life || 2400) * TICK, name: o.item ? (o.item.sl > 1 ? o.item.sl + " " : "") + o.item.n : `${o.gold} lượng`, color: R.color(o.item && o.item.db ? 2 : o.item && o.item.d ? 3 : 0),
      loai: o.gold ? "tien" : isPotion(o.item) ? "thuoc" : o.item && o.item.db ? "db" : "do", dong: (o.item && o.item.d) | 0, k: o.item && o.item.k, dl: o.item && o.item.dl,
      chung: !!o.chung }); // chung: món người chơi vứt ra — cả bãi thấy (datChung)
    if (this.drops.length > DROP_MAX) this.drops.shift();
    const snd = !o.tuoi && R.sound(id); if (snd) this.P.audio.play(snd, 0.5);
    if (!o.tuoi && !o.chung && this.P.audio && this.P.audio.playChime) { const moi = this.drops[this.drops.length - 1]; const tr = this._dropTier(moi); if (tr >= 1) this.P.audio.playChime(tr); }
  }
  // món người chơi vứt ra của cả bãi (máy chủ gửi khi danh sách đổi — anh 30/10 "người khác cùng máy chủ không thấy"): thêm món mới, bỏ món chung
  // không còn (người khác nhặt rồi / hết hạn) — trừ món mình đang chờ máy chủ trả lời nhặt
  datChung(ds) {
    const con = new Set(ds.map((v) => v.g));
    this.drops = this.drops.filter((d) => !d.chung || con.has(d.g) || d.picked);
    for (const v of ds) this.drop(v.x, v.y, { g: v.g, tuoi: v.tuoi || 0.01, chung: 1, item: v });
  }
  // vật đã nhặt xong (máy chủ nhận) / đã mất: bỏ; túi đầy: nằm lại, tự đánh không đi nhặt vật đó nữa
  dropGone(g) { this.drops = this.drops.filter((d) => d.g !== g); }
  dropBack(g) { const d = this.drops.find((x) => x.g === g); if (d) { d.picked = false; d.skip = true; } }
  updateDrops(dt) { this.drops = this.drops.filter((d) => (d.t += dt) < d.life + (d.picked ? 30 : 0)); }
  // vật dưới chuột (hình + tên)
  dropAt(x, y) {
    let best = null, bd = Infinity;
    for (const d of this.drops) if (!d.picked && Math.abs(x - d.x) < 26 && y > (d.top ?? d.y - 30) - 16 && y < d.y + 10) { const k = Math.abs(x - d.x) + Math.abs(y - d.y); if (k < bd) { bd = k; best = d; } }
    return best;
  }
  clickDrop(d) { const p = this.player; if (p.hp <= 0) return; if (p.sit) this.sit(false); this.goLoot(d, true); }
  goLoot(d, manual) {
    const p = this.player, M = this.map;
    // vật nằm trên ô vật cản (xòe ra sát tường…) -> đi tới ô đi được gần nhất
    const k = M.walkable(d.x, d.y) ? -1 : M.nearestCell(d.x, d.y, 6), [gx, gy] = k >= 0 ? M.center(k) : [d.x, d.y];
    const path = M.path(p.x, p.y, gx, gy);
    if (!path) { d.skip = true; return false; }
    p.target = null; p.talkTo = null; p.loot = d; p.goal = [gx, gy]; p.path = path; p.manual = manual;
    return true;
  }
  // vật gần nhất đáng nhặt theo thẻ Nhặt đồ của Trợ Thủ (nhat: bật tắt, phạm vi, tiền / thuốc / đồ trắng, đồ xanh từ dong dòng, chỉ trang sức, lọc
  // dòng, danh sách không nhặt — auto.js nhatMon). gan = [x, y, R]: chỉ vật trong R quanh (x, y) (theo sau — quanh người đang theo)
  nearestLoot(gan) {
    const p = this.player, R = this.P.roi, N = this.hero.auto && this.hero.auto.nhat;
    if (N && !N.on) return null;
    let best = null, bd = N ? N.r : LOOT_R;
    const muon = (d) => nhatMon(N, { loai: d.loai, ten: d.name, k: d.k, dong: d.dong, dl: d.dl }, laTrangSuc);
    const du = this.potFull && this.potFull(); // đã mang đủ 60 bình thuốc: không đi nhặt thuốc
    for (const d of this.drops) { if (d.picked || d.skip || d.t < R.fallTime(d.id) || !muon(d) || (du && d.loai === "thuoc") || (gan && ldist(gan[0], gan[1], d.x, d.y) > gan[2])) continue; const k = ldist(p.x, p.y, d.x, d.y); if (k < bd) { bd = k; best = d; } }
    return best;
  }
  // tự đánh theo tọa độ: tọa độ đang tới (px bản đồ) — chỉ khi danh.td ghi cho bãi này. Tọa độ không còn ở chỗ đi được của bản đồ thì bỏ qua (anh 11/11:
  // bãi đổi bản đồ — Thục Cương sơn 92 dời khung, tọa độ lưu trước ra ngoài bản đồ -> trước đứng yên mãi, bị đánh không đánh trả); không còn tọa độ nào
  // dùng được -> null (đánh như "cả bãi") + báo 1 lần đặt lại lúc Trợ Thủ đang bật (dùng chiêu tay cũng hỏi quái gần nhất — không báo). Điểm tới = tâm ô tọa
  // độ, tâm rơi vào vật cản thì ô đi được gần nhất (≤ 8 ô, như walkTo) — trước trả tâm ô: ô đi được gần nhất xa > 40 thì autoIdle đi tới đó rồi vẫn thấy
  // "chưa tới" (so với tâm), đứng mãi không sang tọa độ kế (soát 11/11: 15–26% ô tọa độ ở bãi 92 / 42 / 2 / 21). Xét lại khi danh sách / bản đồ đổi
  diemTd() {
    const A = this.hero.auto && this.hero.auto.danh, L = A && A.cach === "td" && A.td.bai === this.zone.id ? A.td.ds : null, M = this.map;
    if (!L || !L.length || !this.fromClient || !M) return null;
    const k = L.join(";");
    if (this._tdK !== k || this._tdM !== M) {
      this._tdK = k; this._tdM = M; this._tdBao = false;
      this._tdPt = L.map(([X, Y]) => {
        const [x, y] = this.fromClient(X, Y); if (M.walkable(x, y)) return [x, y];
        const c = M.grid ? M.nearestCell(x, y, 8) : -1; return c >= 0 ? M.center(c) : null;
      });
    }
    for (let n = 0; n < L.length; n++) {
      this.tdI = (this.tdI || 0) % L.length;
      if (this._tdPt[this.tdI]) return this._tdPt[this.tdI];
      this.tdI++;
    }
    if (!this._tdBao && this.auto && this.P && this.P.hud) { this._tdBao = true; this.P.hud.msg("Trợ Thủ: tọa độ đã lưu không còn ở chỗ đi được của bãi này (bản đồ bãi đã đổi) — đang đánh cả bãi, đặt lại tọa độ trong Trợ Thủ"); }
    return null;
  }
  // tự đánh mà không có con nào trong vùng: theo tọa độ -> tới tọa độ, tới rồi vẫn trống thì sang tọa độ kế; quanh chỗ bật -> về chỗ bật
  // Trợ Thủ theo sau: xa người đang theo quá THEO_XA -> bỏ quái / đồ, chạy lại (đường đi tính lại khi người đó đi xa chỗ đang tới); tới cách
  // THEO_GAN thì thôi chạy. Trả true khi đang chạy theo (updateHero khỏi tìm quái / đồ, vẫn đi theo đường ở cuối vòng)
  theoSau(p) {
    const th = this.theo ? this.theo() : null;
    if (!th || !th.theo) { p.theoDi = false; return false; }
    const k = ldist(p.x, p.y, th.x, th.y);
    if (p.theoDi && k <= THEO_GAN) { p.theoDi = false; p.path = null; p.goal = null; this.setAct(p, "stand"); return false; }
    // đang đánh con đội trưởng đánh (quái chung: đúng mã; quái riêng: gần chỗ đội trưởng nhắm): bỏ khi quá THEO_CUNG; đánh / nhặt con khác: quá
    // THEO_XA; rảnh: quá THEO_SAT là chạy lại sát
    const cung = !!p.target && th.tx != null && (th.uid ? p.target.vaDoi === th.uid : ldist(p.target.x, p.target.y, th.tx, th.ty) <= THEO_MUC);
    const xa = cung ? THEO_CUNG : p.loot ? THEO_NHAT : p.target ? THEO_XA : THEO_SAT;
    if (!p.theoDi && k <= xa) return false;
    if (!p.theoDi || !p.goal || ldist(p.goal[0], p.goal[1], th.x, th.y) > THEO_GAN) { p.target = null; p.loot = null; p.talkTo = null; this.walkTo(th.x, th.y); }
    p.theoDi = true;
    return true;
  }
  autoIdle(p) {
    if (this.hoatDong()) return; // hoạt động (Phong Hỏa / boss — anh 04/11 lượt 25): đứng chờ quái tới phạm vi, không về chỗ bật / tọa độ
    const A = this.hero.auto && this.hero.auto.danh, pt = this.diemTd(), th = this.theo ? this.theo() : null;
    if (th && th.theo) return; // theo sau: đứng gần người đang theo chờ quái (theoSau lo chạy lại khi người đó đi xa)
    if (this.neDi(p, pt)) return; // Boss Sát thủ phải né đứng gần (danh.neSat)
    if (pt) {
      if (ldist(p.x, p.y, pt[0], pt[1]) > 40) { if (!this.walkTo(pt[0], pt[1])) this.tdI++; return; } // không có đường tới (khác vùng): sang tọa độ kế
      this.tdI++;
      return;
    }
    if (A && A.kc > 0 && this.neo && ldist(p.x, p.y, this.neo[0], this.neo[1]) > 60) this.walkTo(this.neo[0], this.neo[1]);
  }
  // đi tới (x, y) (ô vật cản -> ô đi được gần nhất), không phải bấm tay
  walkTo(x, y) {
    const p = this.player, M = this.map, k = M.walkable(x, y) ? -1 : M.nearestCell(x, y, 8), [gx, gy] = k >= 0 ? M.center(k) : [x, y];
    // hết ngân sách thường: tìm lại nặng heuristic như clickNpc (soát 13/11); hỏng thì 2 giây sau mới thử lại cách nặng với cùng điểm đến (Trợ Thủ gọi mỗi khung)
    let path = M.path(p.x, p.y, gx, gy);
    const H = this._dxHong;
    if (!path && !(H && H.x === gx && H.y === gy && this.time - H.t < 2 && this.time >= H.t)) { path = M.path(p.x, p.y, gx, gy, 150000, 2); this._dxHong = path ? null : { x: gx, y: gy, t: this.time }; }
    if (path) { p.goal = [gx, gy]; p.path = path; }
    return !!path;
  }

  // chữ bay trên đầu; nhiều số cùng lúc trên 1 con (chiêu vùng, nhiều đạn — anh báo 25/10 số chèn lên nhau) thì xếp chồng lên trên
  text(e, s, color, big) {
    // bắt đầu ngay trên tên + thanh máu (đỉnh hình đã vẽ — quái cao như Kim Điêu không đè lên tên)
    // nhiều số cùng lúc: tối đa TEXT_ROWS hàng cách 15 điểm (hàng thấp nhất còn trống — số gần nhất ở hàng đó đã cũ hơn 0,2 s; hết hàng
    // trống thì hàng có số cũ nhất), mỗi con giữ tối đa TEXT_MAX số đang bay. Bản trước số mới luôn đặt trên số mới nhất -> quái bị trúng
    // dồn dập (đạn xuyên, độc, phản đòn…) thì cột số dài tới mép trên màn hình (anh báo 26/10)
    const y0 = e.top != null ? e.top - NAME_UP - 16 : e.y - (e.kind === "hero" ? 95 : e.boss ? 130 : 80);
    const mine = this.texts.filter((t) => t.e === e), last = Array(TEXT_ROWS).fill(Infinity);
    for (const t of mine) last[t.row] = Math.min(last[t.row], t.t);
    let row = last.findIndex((a) => a > 0.2);
    if (row < 0) row = last.indexOf(Math.max(...last));
    if (mine.length >= TEXT_MAX) this.texts.splice(this.texts.indexOf(mine.reduce((a, b) => (a.t > b.t ? a : b))), 1);
    this.texts.push({ e, x: e.x + rnd(-10, 10), y: y0 - row * 15, row, s, color, big, t: 0 });
  }

  // ngắm chiêu trên điện thoại (dienthoai.js _ngam — this.ngam = { R tầm chiêu, x, y chỗ ngắm, huy }). Anh 31/10 lần 3: bản trước (vòng nét đứt +
  // mũi tên đặc vàng) "thật sự rất khó chấp nhận" — chọn kiểu 1 "Liên Quân" trong ảnh so: vẽ trên mặt đất (trục dọc ÷ 2) vòng tầm chiêu sáng mờ dần
  // ra mép + viền mảnh, dải trắng trong mờ đậm dần về phía chỗ ngắm + đầu mũi tên; kéo vào ô Hủy: đỏ
  veNgam(ctx) {
    const ng = this.ngam, p = this.player, c = ng.huy ? "255,110,90" : "236,246,255";
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(0, 0, ng.R * 0.15, 0, 0, ng.R);
    g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.8, `rgba(${c},.06)`); g.addColorStop(1, `rgba(${c},.17)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ng.R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = `rgba(${c},.5)`; ctx.stroke();
    // dải rộng DAI từ gần chân nhân vật tới đầu mũi tên (dài DAU, rộng gấp đôi dải)
    const dx = ng.x - p.x, dy = (ng.y - p.y) * 2, L = Math.hypot(dx, dy), DAI = 26, DAU = 40;
    if (L > 30) {
      ctx.rotate(Math.atan2(dy, dx));
      const gb = ctx.createLinearGradient(0, 0, L, 0); gb.addColorStop(0, `rgba(${c},.04)`); gb.addColorStop(1, `rgba(${c},.32)`);
      if (L > DAU + 18) { ctx.fillStyle = gb; ctx.fillRect(18, -DAI / 2, L - DAU - 18, DAI); }
      ctx.beginPath(); ctx.moveTo(L - DAU, -DAI); ctx.lineTo(L, 0); ctx.lineTo(L - DAU, DAI); ctx.lineTo(L - DAU + 12, 0); ctx.closePath();
      ctx.fillStyle = `rgba(${c},.55)`; ctx.fill();
    }
    ctx.restore();
  }
  // ---------- vẽ ----------
  draw(ctx, cam, vw, vh) {
    const P = this.P, map = this.map;
    // nền: chỉ phần ảnh trong khung nhìn (1 ảnh, hoặc ô ảnh của bản đồ dựng nguyên từ client)
    ctx.fillStyle = "#0b0d0e"; ctx.fillRect(0, 0, vw, vh);
    // đo giật (anh 06/11 Tống Kim — Công cụ thử → Tống Kim "Đo giật", chỉ máy mình): ẩn tạm từng loại hình để biết loại nào làm card đồ họa nặng
    const AN = this.anVe || {};
    if (!AN.nen) map.drawBg(ctx, cam, vw, vh);
    ctx.save(); ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    if (this.dev.grid) this.drawGrid(ctx, cam, vw, vh);
    // vòng chọn mục tiêu
    const tg = this.player.target;
    if (tg && tg.alive) { ctx.strokeStyle = "rgba(255,90,70,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tg.x, tg.y, tg.radius + 8, (tg.radius + 8) / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (this.ngam) this.veNgam(ctx); // ngắm chiêu trên điện thoại
    // chỗ vừa bấm đất (main.js — anh 26/10: vòng xanh nằm mãi ở điểm đến "hơi xấu"): 1 vòng sóng vàng nhạt loang ra rồi tắt trong
    // CLICK_FX giây; giữ chuột chạy theo con trỏ thì chỉ hiện ở cái bấm đầu
    const cf = this.clickFx, ct = cf && (this.time - cf.at) / CLICK_FX;
    if (ct >= 0 && ct < 1) {
      const r = 5 + 11 * Math.sqrt(ct);
      ctx.strokeStyle = `rgba(255,232,160,${(0.85 * (1 - ct)).toFixed(3)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cf.x, cf.y, r, r / 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // vật rơi nằm trên mặt đất: vẽ trước mọi thân (tên vẽ cùng tên người / quái)
    const inView = (e) => e.x > cam.x - 200 && e.x < cam.x + vw + 200 && e.y > cam.y - 60 && e.y < cam.y + vh + 250;
    const drops = this.drops.filter((d) => !d.picked && inView(d));
    for (const d of drops) { this._drawDropBeam(ctx, d); d.top = this.P.roi.draw(ctx, d.id, d.t, d.x, d.y); }
    // ẩn bớt người chơi khác + phân thân của họ (nguoiHien) / sạp hàng — NPC trông sạp (anSap) — Trợ Thủ → Khác → Hiển thị (anh 11/11 "về Tân Thủ
    // Thôn lag quá"): không vẽ thân, tên, vòng sáng của người đang ẩn
    const hien = this.nguoiHien(), anSap = !!this.P.settings.anSap;
    const nguoi = [...this.others.values()].filter((e) => (!hien || hien.has(e.name)) && (!e.an || this.thayAn(e))), ptK = hien ? [...this.ptKhac.values()].filter((e) => hien.has(e.chu)) : this.ptKhac.values();
    // Tống Kim: người phe kia (e.tkn) đã vẽ ở others — bỏ bản để chọn mục tiêu; bot chết quá 2,5 giây thì ẩn tới lúc hồi sinh
    const list = [...this.mobs, ...this.dongMinh, ...(anSap ? this.npcs.filter((n) => !n.sap) : this.npcs), ...nguoi, ...ptK, ...this.phanThan, this.player].filter((e) => !e.tkn && !(e.tkb && !e.alive && e.deadT > 2.5) && !(AN.bot && e.tkb && !e.tkq) && !(AN.quan && e.tkq) && e.x > cam.x - 200 && e.x < cam.x + vw + 200 && e.y > cam.y - 60 && e.y < cam.y + vh + 250).sort((a, b) => a.y - b.y);
    // bóng tự vẽ cho quái mà hình client không vẽ sẵn bóng (npc.json types[k].shadow) — anh duyệt 23/10; tắt được trong Tùy chỉnh.
    // Vẽ trước mọi thân: bóng nằm trên mặt đất, không đè lên con khác.
    if (this.P.settings.mobShadow) for (const e of list) if (e.kind === "mob" && (!e.tkb || e.tkq) && !(this.P.npc.type(e.type) || {}).shadow) this.P.npc.drawShadow(ctx, e.type, this.mobDrawOpt(e)); // quân NPC Tống Kim (tkq): bóng như quái
    // NPC: bóng như quái (cùng cài đặt Bóng quái)
    if (this.P.settings.mobShadow) for (const e of list) if (e.kind === "npc" && !e.obj && !(this.P.npc.type(e.type) || {}).shadow) this.P.npc.drawShadow(ctx, e.type, { act: "stand1", dir: e.dir, t: e.t, x: e.x, y: e.y });
    // vùng Vô Hình Độc cố định của siêu boss (vocong.js vcVeVungDoc — anh 18/11): sát đất, trước mọi thân
    if (this.P.vc) for (const e of list) if (e.vongRai > 0) this.vcVeVungDoc(ctx, e);
    // thân người / quái xen với vật của lớp che (bản đồ dựng nguyên từ client): vật xếp theo chân vật; trước mỗi vật vẽ những ai đứng
    // sau nó (vật che lên họ), còn lại vẽ sau cùng. Tên + thanh máu vẽ sau hết để nhà / cây không che mất (như client).
    // hình trạng thái của võ công (bùa, vòng sáng, bùa hại): dưới chân + khung "sau lưng" của hình trên thân vẽ trước thân, còn lại sau thân
    const vc = !!this.P.vc, body = (e) => {
      if (vc && (e.kind === "hero" || e.kind === "mob" || e.kind === "other")) this.vcDrawStates(ctx, e, true); // other: vòng sáng người khác đang bật (e.vs)
      if ((e.kind === "hero" || e.kind === "other") && !this.tk) this._drawAura(ctx, e);
      if (e.kind === "hero" || e.kind === "other" || (e.tkb && !e.tkq)) this.drawHeroBody(ctx, e); else if (e.kind === "npc") this.drawNpcBody(ctx, e); else this.drawMobBody(ctx, e); // bot Tống Kim: vẽ như người; quân NPC (tkq): như quái
      if (vc && (e.kind === "hero" || e.kind === "mob" || e.kind === "other")) this.vcDrawStates(ctx, e, false);
    };
    const objs = !AN.vat && map.objectsIn ? map.objectsIn(cam, vw, vh) : [];
    if (objs.length) {
      const left = new Set(list);
      for (const o of objs) {
        for (const e of list) if (left.has(e) && map.behind(e, o)) { body(e); left.delete(e); }
        map.drawObj(ctx, o);
      }
      for (const e of list) if (left.has(e)) body(e);
    } else for (const e of list) body(e);
    if (vc && !AN.fx) this.vcDraw(ctx); // đạn võ công đang bay + hình vận công / trúng / tan
    if (!this.hero.auto || this.hero.auto.hien.tenVat) for (const d of drops) if (d.top != null) this.label(ctx, d.x, d.top - 4, d.name, d.color);
    if (!AN.ten) for (const e of list) e.kind === "hero" || e.kind === "other" || (e.tkb && !e.tkq) ? this.drawHeroLabel(ctx, e) : e.kind === "npc" ? this.drawNpcLabel(ctx, e) : this.drawMobLabel(ctx, e);
    if (this.chiDan) this.veChiDan(ctx, this.chiDan); // chỉ đường tân thủ (tanthu.js)
    if (this.veThem) this.veThem(ctx, jxText); // lớp vẽ thêm của hoạt động trên cảnh (đua ngựa — duangua.js veDem: đồng hồ đếm ngược trên 2 cổng Hậu doanh, anh 16/11)
    for (const s of this.shots) this.P.fx.drawFly(ctx, s.id, s.dx, s.dy, s.t, s.x, s.y);
    for (const f of this.fxs) this.P.fx.draw(ctx, f.id, f.t, f.e.x, f.e.y);
    // chữ
    ctx.textAlign = "center"; ctx.lineJoin = "round";
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, 1.6 - t.t * 1.4);
      jxText(ctx, t.s, t.x, t.y, t.color, t.big ? 16 : 13);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // công cụ thử: ô bị chặn (đỏ) trong khung nhìn + đường đi của nhân vật (xanh lá) và quái đang đuổi / về chỗ (cam)
  drawGrid(ctx, cam, vw, vh) {
    const M = this.map;
    if (M.grid) {
      const x0 = Math.max(0, Math.floor(cam.x / M.cw)), y0 = Math.max(0, Math.floor(cam.y / M.ch));
      const x1 = Math.min(M.gw - 1, Math.floor((cam.x + vw) / M.cw)), y1 = Math.min(M.gh - 1, Math.floor((cam.y + vh) / M.ch));
      ctx.fillStyle = "rgba(255,40,40,.28)";
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!M.grid[y * M.gw + x]) ctx.fillRect(x * M.cw, y * M.ch, M.cw, M.ch);
    }
    const line = (e, path, color) => {
      if (!path || !path.length) return;
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y);
      for (const [x, y] of path) ctx.lineTo(x, y);
      ctx.stroke();
    };
    for (const m of this.mobs) if (m.alive) line(m, m.path, "rgba(255,170,60,.8)");
    line(this.player, this.player.path, "rgba(120,255,120,.95)");
  }

  // p = nhân vật mình (kind "hero") hoặc người chơi khác (kind "other": giới / thế đánh do máy chủ báo)
  drawHeroBody(ctx, p) {
    const jx = this.P.jx, other = p.kind === "other" || !!p.tkb, sex = other ? p.sex : this.hero.sex; // bot Tống Kim (tkb): vẽ như người khác
    const fight = other ? p.fight : !!p.target;
    const A = { stand: fight ? "FightStand" : "NormalStand1", run: fight ? "FightRun" : "NormalRun", attack: p.attack || "Attack1", hurt: "Wound", die: "Die", sit: "SitDown", jump: "Jump" }[p.act];
    // khinh công: độ cao như engine KNpc::ServeJump (v0 = 10 × (số vòng − 1) / 2, cao = (v0 × f − 10 × f² / 2) / 8) × 0,75 của kho web; bóng đất: client không có hình bóng cho động tác nhảy
    const kcN = p.act === "jump" ? (other ? p.jumpN : p.jump ? p.jump.n : 0) || 0 : 0, kcF = p.t * 18, kcZ = kcN ? Math.max(0, (5 * (kcN - 1) * kcF - 5 * kcF * kcF) / 8) * SCALE : 0;
    // ngồi: 1 khung mỗi vòng engine như client, hết khung thì giữ khung cuối (động tác không lặp)
    const dur = { stand: DUR.stand[sex], run: other ? DUR.run : runDur(p.moveSpeed), attack: other ? p.atkDur || DUR.attack : p.cast ? p.castDur : p.atkDur, hurt: other ? DUR.hurt : p.hurtDur ?? DUR.hurt, die: 1.2, sit: undefined, jump: (kcN || 18) / 18 }[p.act];
    // võ công đánh nhiều đòn (Thiên Vương…): động tác đánh lặp lại mỗi đòn (p.swing giây)
    const sw = !other && p.act === "attack" && p.cast && p.swing;
    // bóng mờ khi vung chiêu (BLUR_* ở đầu tệp): chụp hình đang vẽ mỗi BLUR_GAP, vẽ các bản cũ mờ dần dưới thân
    if (!other) {
      const tt = sw ? p.t % p.swing : p.t, dd = sw ? p.swing : dur, B = p.blurs || (p.blurs = []);
      if (p.blur && p.act === "attack" && this.time - (p.blurAt ?? -9) >= BLUR_GAP) { p.blurAt = this.time; B.push({ x: p.x, y: p.y, dir: p.dir, act: A, t: tt, dur: dd, at: this.time }); if (B.length > BLUR_MAX) B.shift(); }
      for (let i = 0; i < B.length; ) { // cũ trước, mới sau
        const g = B[i], a = (BLUR_A0 - BLUR_DA * Math.floor((this.time - g.at) / BLUR_GAP)) / 255;
        if (a <= 0) { B.splice(i, 1); continue; }
        jx.draw(ctx, p.look, { act: g.act, dir: g.dir, t: g.t, duration: g.dur, x: g.x, y: g.y, alpha: a, shadow: false }); i++;
      }
    }
    // bóng mờ khi lướt (Đoạn Hồn Thích): bản sao nhạt dần ở các chỗ vừa đi qua
    if (!other && p.ghosts && p.ghosts.length) for (const g of p.ghosts) { const a = 0.4 * (1 - (this.time - g.at) / 0.3); if (a > 0) jx.draw(ctx, p.look, { act: A, dir: g.dir, t: g.t, duration: dur, x: g.x, y: g.y, alpha: a, shadow: false }); }
    // ẩn thân (Ngự Tuyết Ẩn): mình thấy mờ, quái không thấy — độ mờ truyền vào jx.draw (hàm này tự đặt globalAlpha, đặt ngoài bị đè:
    // anh 26/10 "ẩn thân nhưng hình không mờ")
    const hid = other ? p.kind === "other" && !!p.an : p.hideUntil > this.time || (p === this.player && !!(this.tk && this.tk.xem)); // người khác đang ẩn thân: chỉ đồng đội còn thấy (mờ); lôi đài: mình là người xem (loidai.js — anh 15/11) cũng vẽ mờ
    // bị quái có võ công làm chậm / choáng / trúng độc: nhuộm màu như quái (mobTint)
    // nhuộm bằng bản tô màu giữ sẵn (loc — spr.js anhLoc), không đặt ctx.filter mỗi khung (anh 06/11: "bị làm chậm mà chạy thì fps tụt không phanh")
    const nTT = other && !p.tkb ? this.nguoiTT(p) : null; // người khác vừa bị mình đánh trúng độc / chậm / choáng (anh 17/11 — nguoiTT)
    const tint = nTT ? nTT.tint : (!other || p.tkb) && this.quaiVC && this.tkNhuom(p) ? this.mobTint(p) : ""; // bot Tống Kim: nhuộm choáng / chậm / độc như quái (giới hạn — tkNhuom)
    let r = jx.draw(ctx, p.look, { act: A, dir: p.dir, t: sw ? p.t % p.swing : p.t, duration: sw ? p.swing : dur, x: p.x, y: p.y - kcZ, alpha: hid ? HIDE_ALPHA : 1, ...(tint ? { loc: tint } : {}) });
    if (!r && kcN) r = jx.draw(ctx, p.look, { act: fight ? "FightRun" : "NormalRun", dir: p.dir, t: p.t, duration: DUR.run, x: p.x, y: p.y - kcZ, alpha: hid ? HIDE_ALPHA : 1, shadow: false }); // hình nhảy đang tải: tạm hình chạy, không biến mất
    p.top = p.y - kcZ + (r ? Math.max(-150, r.top) : -90);
  }
  // Phan loai do hiem vat roi: 0 = thuong/tien/thuoc, 1 = do xanh 1-4 dong, 2 = cuc pham/hiem/do xanh >=5 dong
  _dropTier(d) {
    if (!d || d.loai === "tien" || d.loai === "thuoc") return 0;
    if (d.loai === "db" || (d.dong | 0) >= 5) return 2;
    const nm = String(d.name || "");
    if (/hoàng kim|bạch kim|an bang|định quốc|hiệp cốt|nhu tình|thủy tinh|tinh hồng|phúc duyên|bí kíp|lệnh bài|tiên thảo|quế hoa|bách quả|huyền tinh|huyền thiên|rương|đại thành|chiếu dạ|phi vân|bôn tiêu|phiên vũ|xích thố/i.test(nm)) return 2;
    if (d.loai === "do" && (d.dong | 0) >= 1) return 1;
    return 0;
  }
  // Cot anh sang roi do hiem (chi bat o giao dien Hien dai)
  _drawDropBeam(ctx, d) {
    try {
      if (typeof document === "undefined" || !document.body || !document.body.classList.contains("ui-modern")) return;
      const tier = this._dropTier(d); if (tier < 1) return;
      const R = this.P && this.P.roi; if (R && d.t < R.fallTime(d.id) * 0.75) return;
      const pulse = 0.78 + 0.22 * Math.sin(this.time * (tier >= 2 ? 4.8 : 3.2) + d.x * 0.05);
      const h = tier >= 2 ? 70 : 40, w = tier >= 2 ? 14 : 9;
      const cTop = tier >= 2 ? "rgba(255,214,92,0)" : "rgba(104,188,255,0)";
      const cMid = (tier >= 2 ? "rgba(255,214,96," : "rgba(106,190,255,") + (tier >= 2 ? 0.30 * pulse : 0.20 * pulse).toFixed(3) + ")";
      const cBot = (tier >= 2 ? "rgba(255,240,176," : "rgba(150,218,255,") + (tier >= 2 ? 0.70 * pulse : 0.44 * pulse).toFixed(3) + ")";
      ctx.save(); ctx.strokeStyle = cBot; ctx.lineWidth = tier >= 2 ? 1.8 : 1.2;
      ctx.beginPath(); ctx.ellipse(d.x, d.y + 1, (tier >= 2 ? 15 : 10) * (0.94 + 0.08 * pulse), (tier >= 2 ? 7 : 4.8) * (0.94 + 0.08 * pulse), 0, 0, Math.PI * 2); ctx.stroke();
      const g = ctx.createLinearGradient(d.x, d.y - h, d.x, d.y + 2); g.addColorStop(0, cTop); g.addColorStop(0.55, cMid); g.addColorStop(1, cBot);
      ctx.fillStyle = g; ctx.fillRect(d.x - w / 2, d.y - h, w, h + 2);
      if (tier >= 2) {
        ctx.fillStyle = "rgba(255,246,198,0.85)";
        for (let i = 0; i < 3; i++) {
          const ph = (this.time * 0.75 + i * 0.33 + (d.x % 17) * 0.05) % 1;
          ctx.globalAlpha = (1 - ph) * 0.85; ctx.beginPath(); ctx.arc(d.x + Math.sin(ph * 6.28 + i * 2) * 7, d.y - 4 - ph * (h * 0.85), 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    } catch {}
  }
  // Hao quang danh hieu duoi chan (Bang chu/Quan tri, Ho Bang, Truong lao/Duong chu, Cao thu >= 80)
  _drawAura(ctx, e) {
    try {
      if (typeof document === "undefined" || !document.body || !document.body.classList.contains("ui-modern")) return;
      const other = e.kind === "other"; if (other ? e.an : e.hideUntil > this.time) return;
      const cv = other ? e.bhc : (this.bhMinh && this.bhMinh.cv);
      const nhan = String((other ? e.bh : (this.bhMinh && this.bhMinh.nhan)) || "");
      const isChu = cv === "chu" || (other ? !!e.qt : !!this.laQt);
      const isHoBang = /hộ bang/i.test(nhan);
      const isQuan = cv === "lao" || cv === "duong";
      const isCaoThu = !other && !!(this.hero && (this.hero.lvl | 0) >= 80);
      if (!isChu && !isHoBang && !isQuan && !isCaoThu) return;
      const r = (e.look && e.look.horse) || e.horse ? 33 : 24;
      const pulse = 0.72 + 0.28 * Math.sin(this.time * 3.4 + (e.x || 0) * 0.02);
      const c = isChu ? [255, 214, 92] : isHoBang ? [94, 234, 212] : isQuan ? [132, 232, 174] : [220, 214, 178];
      const rgba = (a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
      ctx.save();
      const gr = ctx.createRadialGradient(e.x, e.y + 3, r * 0.2, e.x, e.y + 3, r * 1.18);
      gr.addColorStop(0, rgba(0.14 * pulse)); gr.addColorStop(0.72, rgba(0.30 * pulse)); gr.addColorStop(1, rgba(0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, r * 1.18, r * 0.54, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(0.76 * pulse); ctx.lineWidth = isChu ? 1.8 : 1.3;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, r, r * 0.46, 0, 0, Math.PI * 2); ctx.stroke();
      if (isChu) { ctx.strokeStyle = "rgba(255,244,192," + (0.42 * pulse).toFixed(3) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, r + 4.5, (r + 4.5) * 0.46, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    } catch {}
  }

  drawHeroLabel(ctx, p) {
    // F7 (client showplayername): tên; F8 (showplayerlife): thanh máu dưới tên như client. Người khác: không có thanh máu
    // (máy chủ chưa báo sinh lực)
    // Tống Kim: thanh máu cả người khác (hp % — nhịp) và bot (máu chung)
    const other = p.kind === "other" || !!p.tkb, life = this.P.settings.showLife && (!other || (!!this.tk && (p.tkb ? p.alive : true)));
    const top = p.top ?? p.y - 90, S = this.P.settings, ny = top - (life ? NAME_UP : 8);
    // ẩn thân: tên ghi "(Ẩn thân)" như client (KNpc::PaintInfo nối "(隐)" sau tên)
    // màu tên theo phe đang theo (PHE_MAU — người khác: cp máy chủ gửi; mình: pheMinh)
    const mauTen = (other ? p.qt : this.laQt) ? QT_MAU : PHE_MAU[other ? p.cp | 0 : this.pheMinh()] || "#ffffff";
    if (S.showName !== false) this.label(ctx, p.x, ny, other ? p.name + ((this.nguoiTT(p) || {}).chu || "") : this.hero.name + (this.tk && this.tk.xem ? " (Người xem)" : p.hideUntil > this.time ? " (Ẩn thân)" : ""), mauTen); // lôi đài: "(Người xem)" (loidai.js st.xem)
    // dòng bang (anh 14/11 — Bang hội đợt 1; vị trí như engine KNpc::PaintInfo :8897): ngay trên tên một dòng, viền đen. Kiểu chữ: mẫu 4 anh chọn 14/11 "Chức · Tên bang"
    // (veDongBang). Người khác: chuỗi máy chủ dựng "Tên bang(Chức)" + mã chức (setOthers e.bh / e.bhc); mình: main.js bhVeLai (World.bhMinh { nhan, cv }). Trong Tống
    // Kim không vẽ (bot không có bang — không để lộ ai là bot). Có dòng bang thì danh hiệu Tống Kim / bảng hiệu sạp / cờ đội dời lên 1 dòng (dB)
    const bh = this.tk || S.showName === false ? null : other ? (p.kind === "other" ? p.bh : null) : this.bhMinh && this.bhMinh.nhan;
    if (bh) this.veDongBang(ctx, p.x, ny - 14, bh, mauTen, other ? p.bhc : this.bhMinh && this.bhMinh.cv);
    const dB = bh ? 14 : 0;
    if (this.tk && S.showName !== false) { const dh = this.tkDanhHieu(p, other); if (dh) this.label(ctx, p.x, ny - 14 - dB, dh, "rgb(236,73,242)"); } // danh hiệu Tống Kim (màu client playertitle.txt — anh 09/11)
    // chợ trời: đang ngồi đúng chỗ sạp của mình -> bảng hiệu lời rao trên tên (main.js sapTick — World.bangHieu: tên -> lời rao)
    const qc = this.bangHieu && !(other && S.anSap) && this.bangHieu.get(other ? p.name : this.hero.name); // anSap: ẩn bảng hiệu người khác (Trợ Thủ → Khác — anh 11/11)
    if (qc) this.veBangHieu(ctx, p.x, ny - 14 - dB, qc);
    if (life) this.lifeBar(ctx, p.x, ny, !other ? p.hp / p.hpMax : p.tkb ? p.hp / Math.max(1, p.hpMax) : (p.hp ?? 100) / 100, other && this.tkDichVe(p));
    // cờ đội trưởng: mình — main.js doiApply đặt coDoi; người khác — máy chủ gửi co (setOthers). Cờ giao dịch: mình — main.js gdApply đặt gdCo,
    // người khác — gd (1 mở giao dịch / 2 đang giao dịch). Đỉnh khối tên ≈ chân chữ − 12
    const gd = other ? p.gd : this.gdCo, C = gd === 2 ? coAnh("menustate03") : gd === 1 ? coAnh("menustate02") : (other ? p.co : this.coDoi) && coAnh("menustate01");
    if (C) {
      const M = C.m, k = SCALE, f = Math.floor((this.time * 1000) / M.ms) % M.n, ay = ny - 12 - dB - 40 * k;
      ctx.drawImage(C.img, f * M.w, 0, M.w, M.h, Math.round(p.x - M.cx * k), Math.round(ay - M.cy * k), M.w * k, M.h * k);
    }
  }

  mobDrawOpt(m) {
    const act = { stand: m.aggro ? "fightStand" : "stand1", walk: "walk", run: "run", attack: m.atkAct || "attack1", hurt: "hurt", die: "die" }[m.act];
    // quái bản chung đánh nhanh hơn (m.tocDanh — quaichung.js): hình vung đòn chạy nhanh theo, vừa khít atkDur đã rút
    return { act, dir: m.dir, t: m.act === "attack" && m.tocDanh ? m.t * m.tocDanh : m.t, x: m.x, y: m.y, alpha: m.alive ? 1 : Math.max(0, 1 - Math.max(0, m.deadT - 1.2) / 1.3) };
  }

  // NPC: động tác đứng của kho NPC, tên trên đầu (TẠM màu vàng nhạt — client chưa tìm được màu tên NPC hội thoại)
  drawNpcBody(ctx, n) {
    if (n.obj) { const top = this.P.roi ? this.P.roi.draw(ctx, n.obj, n.t, n.x, n.y) : null; n.top = top ?? n.y - 70; return; } // vật bản đồ: hình lặp của kho vật
    const r = this.P.npc.draw(ctx, n.type, { act: "stand1", dir: n.dir, t: n.t, x: n.x, y: n.y });
    n.top = r ? Math.max(n.y - 220, r.top) : n.y - 90;
  }
  // tên vật bản đồ: màu tên vật client (ObjNameColor 0 — trắng)
  // mũi tên vàng nhấp nhô trên tên NPC của bước tân thủ (mẫu anh chọn 10/11)
  veChiDan(ctx, n) {
    const x = n.x, y = (n.top ?? n.y - 90) - 26 - Math.abs(Math.sin(this.time * 3)) * 8;
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - 13, y - 21); ctx.lineTo(x + 13, y - 21); ctx.lineTo(x, y); ctx.closePath();
    ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(40,20,0,.9)"; ctx.stroke(); ctx.fillStyle = "#ffd84e"; ctx.fill(); ctx.restore();
  }
  drawNpcLabel(ctx, n) {
    this.label(ctx, n.x, (n.top ?? n.y - 90) - 6, n.name, n.obj ? "#ffffff" : "#ffe680");
    if (n.qc) this.veBangHieu(ctx, n.x, (n.top ?? n.y - 90) - 20, n.qc); // NPC trông sạp chợ trời (main.js sapTick): bảng hiệu lời rao của chủ sạp
  }
  // bảng hiệu bày bán (chân bảng ở yDay): 3 mảnh hình client, chữ giữa
  veBangHieu(ctx, x, yDay, s) {
    const B = bhAnh(this.P); if (!B) return;
    ctx.font = `13px "VK Sans Serif 13", "IBM Plex Mono", monospace`;
    const w = Math.max(40, Math.ceil(ctx.measureText(s).width) + 10), x0 = Math.round(x - w / 2), y0 = Math.round(yDay - 20);
    ctx.drawImage(B.L, x0 - B.L.width, y0);
    ctx.drawImage(B.M, x0, y0, w, B.M.height);
    ctx.drawImage(B.R, x0 + w, y0);
    ctx.textAlign = "center";
    jxText(ctx, s, x, y0 + 15, B.mau, 13);
  }
  // quái đang trúng trạng thái của võ công: đóng băng / làm chậm xanh lam, trúng độc xanh lá, choáng sáng nhạt (client: hình "Special"
  // của bảng hình trạng thái — gói NPC không có -> nhuộm màu)
  // được nhuộm màu không (TK_NHUOM): ngoài Tống Kim / không phải bot, quân Tống Kim -> luôn được
  tkNhuom(e) {
    if (!this.tk || !e.tkb) return true;
    const p = this.player; if (e === p.target) return true;
    if (this._nhuomT !== this.time) { this._nhuomT = this.time; this._nhuomN = 0; }
    if (this._nhuomN >= TK_NHUOM || ldist(e.x, e.y, p.x, p.y) > 260) return false;
    this._nhuomN++; return true;
  }
  mobTint(m) { // cả nhân vật mình (quái có võ công — drawHeroBody)
    if (!m.alive || !this.P.vc) return "";
    if ((m.stunUntil || 0) > this.time) return "brightness(1.45) saturate(0.35)";
    if ((m.slowUntil || 0) > this.time) return "sepia(1) saturate(3.5) hue-rotate(165deg) brightness(1.05)";
    if (m.poison && m.poison.until > this.time) return "sepia(1) saturate(3) hue-rotate(55deg)";
    return "";
  }
  // người chơi khác trong Tống Kim / lôi đài (anh 17/11): trạng thái mình vừa đánh trúng họ (tkbot.js tkTrungNguoi — hienDoc / hienCham / hienChoang / hienMatNoi trên
  // bản chọn mục tiêu cùng tên) -> { tint, chu } | null
  nguoiTT(p) {
    const n = p && p.kind === "other" && this.tk && this.tk.nguoi && this.tk.nguoi.get(p.name); if (!n) return null;
    const t = this.time, L = [];
    if ((n.hienChoang || 0) > t) L.push("Choáng");
    const buaCham = (n.curse || []).some((c) => c.until > t && c.attrs.fastwalkrun_p && c.attrs.fastwalkrun_p[0] < 0); // bùa giảm tốc chạy (Ki Bán phù…) đang gắn
    if ((n.hienCham || 0) > t || buaCham) L.push("Chậm");
    if ((n.hienDoc || 0) > t) L.push("Độc");
    if ((n.hienMatNoi || 0) > t) L.push("Mất nội lực");
    if (!L.length) return null;
    const tint = (n.hienChoang || 0) > t ? "brightness(1.45) saturate(0.35)" : (n.hienCham || 0) > t || buaCham ? "sepia(1) saturate(3.5) hue-rotate(165deg) brightness(1.05)" : (n.hienDoc || 0) > t ? "sepia(1) saturate(3) hue-rotate(55deg)" : "";
    return { tint, chu: ` (${L.join(", ")})` };
  }
  // trạng thái võ công trong ngoặc sau tên quái như client (anh dặn 25/10): "Hắc Cẩu (Choáng, Chậm, Độc)"
  mobStatus(m) {
    if (!m.alive || !this.P.vc) return "";
    const L = [];
    if ((m.stunUntil || 0) > this.time) L.push("Choáng");
    if (this.mobMod(m, "randmove") > 0 || (m.hlUntil || 0) > this.time) L.push("Hoảng");
    if ((m.slowUntil || 0) > this.time || this.mobMod(m, "fastwalkrun_p") < 0) L.push("Chậm");
    if (m.poison && m.poison.until > this.time) L.push("Độc");
    return L.length ? ` (${L.join(", ")})` : "";
  }
  drawMobBody(ctx, m) {
    const tint = this.tkNhuom(m) ? this.mobTint(m) : ""; // bản tô màu giữ sẵn (loc), không ctx.filter mỗi khung
    const r = this.P.npc.draw(ctx, m.type, tint ? { ...this.mobDrawOpt(m), loc: tint } : this.mobDrawOpt(m));
    m.top = r ? Math.max(m.y - 220, r.top) : m.y - 80;
  }
  drawMobLabel(ctx, m) {
    if (!m.alive) return;
    const top = m.top ?? m.y - 80;
    // như client (ảnh anh gửi 23/10): tên trắng, không kèm cấp; ngũ hành sau tên; thanh máu xanh luôn hiện, dưới tên. Thủ lĩnh (trùm) tên
    // cam, tinh anh tên xanh dương (anh 27/10).
    // boss thế giới (Boss Hoàng Kim — bosstg.js; anh 31/10 "tên boss xấu quá … đổi màu chữ đẹp hơn để phân biệt với boss sát thủ, thêm tiền tố
    // Boss Hoàng Kim -"): tiền tố vàng + tên đỏ (boss Sát thủ / thủ lĩnh: cam)
    const ly = top - NAME_UP, w = m.btg || m.tenBtg ? this.label2(ctx, m.x, ly, [m.sk ? "Siêu boss sự kiện - " : "Boss Hoàng Kim - ", BTG_TIEN], [m.name + this.mobStatus(m), BTG_MAU])
      : this.label(ctx, m.x, ly, m.name + this.mobStatus(m), m.mauTen || (m.nhim ? NHIM_MAU : m.boss || m.sat || m.vaBoss || m.mcv ? "#ffb74d" : m.ta ? TA_MAU : "#ffffff")); // nhím Săn Nhím: vàng; Phong Hỏa: m.mauTen (phonghoa.js)
    this.lifeBar(ctx, m.x, ly, m.hp / m.hpMax, !!m.tkq && this.tkDichVe(m)); // quân NPC Tống Kim phe kia: thanh đỏ
    // số máu "còn/tối đa" một dòng trên tên, màu thanh máu (anh 28/10: cọc đảo Tẩy Tủy "500000/500000" — mocnhan.js datCocDao soMau; rồi
    // "thêm vào cho tinh anh, thủ lĩnh, boss, tiểu boss, sát thủ, vv": trùm bãi / Thủy tặc đầu lĩnh m.boss, tinh anh / Boss Sát thủ / boss,
    // tiểu boss, sát thủ Vượt Ải m.dacBiet). Quái thường không có
    if (m.soMau || m.boss || m.dacBiet) this.label(ctx, m.x, ly - 15, `${Math.ceil(m.hp)}/${m.hpMax}`, "#00ff00");
    // ngũ hành (ui\npcbobo.ini [Series]) ngay sau tên như client: cách chữ 2 điểm, hình 18×18 đặt từ đường chân chữ − 13 (đo trên
    // ảnh client anh gửi: giữa hình ngang giữa chữ hoa); không thu nhỏ — chữ tên cũng vẽ cỡ thật
    const im = this.P.hud && this.P.hud.seriesImg(m.series);
    if (im) ctx.drawImage(im, Math.round(m.x + w / 2 + 2), Math.round(ly) - 13);
  }

  // thanh máu dưới tên như client: xanh lá thuần (ảnh client 0,252,0 = 255 ở màu 16 bit), 41 × 4 điểm giữa theo x, đỉnh = chân chữ + 5
  // (đo ảnh client anh gửi, thu ×0,8: rộng 33, cao ~3,2, cách chữ ~4). Ảnh chỉ có lúc đầy máu — mất máu thì thanh ngắn dần từ phải.
  lifeBar(ctx, x, ly, k, dich) {
    const X = Math.round(x) - 20, Y = Math.round(ly) + 5, W = Math.round(41 * Math.max(0, Math.min(1, k)));
    if (!dich) { ctx.fillStyle = "#00ff00"; ctx.fillRect(X, Y, W, 4); return; }
    // Tống Kim: thanh máu phe địch màu đỏ (anh 18/11 "cho dễ nhìn") — kiểu tkThanh: A đỏ thuần; B đỏ + nền tối thấy phần máu đã mất + viền đen; C như B, dày 5 + vệt sáng
    const kieu = this.tkThanh || "B";
    if (kieu === "A") { ctx.fillStyle = "#ff2020"; ctx.fillRect(X, Y, W, 4); return; }
    const h = kieu === "C" ? 5 : 4;
    ctx.fillStyle = "#000000"; ctx.fillRect(X - 1, Y - 1, 43, h + 2);
    ctx.fillStyle = "#4a0a0a"; ctx.fillRect(X, Y, 41, h);
    ctx.fillStyle = kieu === "C" ? "#ff3b30" : "#ff2020"; ctx.fillRect(X, Y, W, h);
    if (kieu === "C" && W > 0) { ctx.fillStyle = "#ffa0a0"; ctx.fillRect(X, Y, W, 1); }
  }
  // Tống Kim / lôi đài: p thuộc phe kia của mình (bot, quân NPC: tkPhe; người khác: bản chọn mục tiêu tongkim.js st.nguoi — tkPhe máy chủ chia)
  tkDichVe(p) {
    const T = this.tk; if (!T) return false;
    if (p.tkb) return p.tkPhe !== T.phe;
    const n = p.kind === "other" && T.nguoi ? T.nguoi.get(p.name) : null;
    return !!(n && n.tkPhe !== T.phe);
  }

  // chữ giữa tại (x, y = đường chân chữ); trả về bề ngang chữ
  label(ctx, x, y, s, color) {
    ctx.textAlign = "center";
    return jxText(ctx, s, x, y, color, 13); // bề ngang chữ (jxText giữ sẵn — không đo lại mỗi khung)
  }
  // dòng bang mẫu 4 (anh 14/11 chọn — "Chức · Tên bang"): chức vụ màu theo bậc (BH_CV_MAU theo mã chức máy chủ gửi — danh hiệu tự đặt / Hộ Bang vẫn đúng màu bậc;
  // thiếu mã thì đoán theo chữ mặc định), dấu · xám nhạt, tên bang màu tên nhân vật. Chuỗi máy chủ vẫn "Tên bang(Chức)" như engine (tên bang không có "(") — tách ở đây.
  // Ẩn sỹ (không chức): chỉ tên bang, chữ trắng (engine :8890). Bề ngang từng phần giữ sẵn (BH_RONG) khi phông đã nạp — không đo lại mỗi khung
  veDongBang(ctx, x, y, bh, mauTen, cv) {
    const m = /^([^(]*)\((.+)\)$/.exec(bh);
    if (!m) return this.label(ctx, x, y, bh, "#ffffff");
    // có mã chức thì chỉ theo mã (đệ tử được đặt danh hiệu chung "Bang chủ" vẫn chữ trắng); chữ đoán chỉ khi thiếu mã
    const P = [[m[2], (cv ? BH_CV_MAU[cv] : BH_CV_MAU[BH_CV_CHU[m[2]]]) || "#ffffff"], [" · ", "#c8c8c8"], [m[1], mauTen]], font = chuFont(13);
    let w = 0;
    const ws = P.map(([s]) => {
      let v = BH_RONG.get(s);
      if (v == null) { ctx.font = font; v = ctx.measureText(s).width; if (typeof document === "undefined" || !document.fonts || document.fonts.check(font, s)) { if (BH_RONG.size > 3000) BH_RONG.clear(); BH_RONG.set(s, v); } }
      w += v; return v;
    });
    ctx.textAlign = "left";
    let x0 = x - w / 2;
    P.forEach(([s, c], i) => { jxText(ctx, s, x0, y, c, 13); x0 += ws[i]; });
    ctx.textAlign = "center";
    return w;
  }
  // tên 2 màu (boss thế giới: tiền tố + tên), giữa theo x — [[chữ, màu], …] -> tổng bề rộng
  label2(ctx, x, y, ...phan) {
    ctx.font = `13px "VK Sans Serif 13", "IBM Plex Mono", monospace`;
    const ws = phan.map(([s]) => ctx.measureText(s).width), w = ws.reduce((a, b) => a + b, 0);
    ctx.textAlign = "left";
    let x0 = x - w / 2;
    phan.forEach(([s, c], i) => { jxText(ctx, s, x0, y, c, 13); x0 += ws[i]; });
    ctx.textAlign = "center";
    return w;
  }

  // ---------- võ công: chỉ số / phòng thủ / Trợ Thủ / chuột phải ----------
  // chỉ số cộng = đồ đang mặc + chiêu bị động (đúng vũ khí) + bùa đang có + vòng sáng ở ô tay phải + trạng thái vật phẩm Kỳ Trân Các còn
  // hạn (máy chủ đếm — hero.buff; Bách Quả Lộ = trạng thái 442 của client: allres_p 15 -> kháng tất cả +15 %)
  bonus(buffs) {
    const eq = equipStats(this.hero, this.riding()), db = this.P.skillDb, au = this.hero.oChieu && this.hero.oChieu.phai;
    this.vongDoiDs = this.vongDoi(); const vm = this.vongMinh(), TD = this.tangIchDoi(); // vm: vòng của mình còn tác dụng (vừa đổi / xoay); TD: tăng ích tổ đội
    this._vdKey = khoaVong([...this.vongDoiDs, ...vm]) + "|" + TD.toc + "/" + TD.hoi;
    const B = !db || !this.P.vc || !this.vcOpen ? eq : mergeB(eq, skillB(this.hero, db, this.wk, buffs, au && db[au] && db[au].aura ? au : null, [...this.vongDoiDs, ...vm]));
    // Tống Kim (anh 06/11 — đặc tả đợt 2): trạng thái vật phẩm Tống Kim (khóa tk… — hoàn 3 phút) chỉ có tác dụng trong trận (this.tk), ngoài trận bỏ qua
    // Lôi Đài Công Bình Tử (anh 17/11 "các hiệu ứng có trước từ ngoài sẽ không có tác dụng, tự động mất hiệu lực — rời khỏi công bình tử sẽ tiếp tục có tác dụng"): trong sân
    // (World.tk của lôi đài — loidai.js, loai "ld") mọi trạng thái vật phẩm (hoàn, Bách Quả Lộ, bùa Phong Hỏa…) không cộng; máy chủ dừng giờ (may-chu/do.js buffDem)
    const tk = !!this.tk, ld = tk && this.tk.loai === "ld", coTac = (k) => !ld && (tk || !laBuffTk(k));
    for (const [k, s] of Object.entries(this.hero.buff || {})) { const T = ItemDB.buffDef(k); if (T && T.khang && s > 0 && coTac(k)) B.resAll = (B.resAll || 0) + T.khang; }
    // các loại hoàn của Kỳ Trân Các (anh 31/10 "chỉ số của dược cộng đúng như client"): dòng thuộc tính của chiêu trạng thái client (Trường Mệnh
    // lifemax_v 500, Phi Tốc attackspeed_v 50, 4 loại Phòng kháng 50 % …) — cộng như bùa của võ công (vocong.js addAttrs)
    for (const [k, s] of Object.entries(this.hero.buff || {})) { const T = ItemDB.buffDef(k); if (T && T.attrs && s > 0 && coTac(k)) { B.lifePct = B.lifePct || 0; addAttrs(B, T.attrs, laHoan(k)); } } // laHoan: sát thương hệ của hoàn chỉ cộng vào chiêu đúng hệ (anh 17/11) // + bùa Phong Hỏa (ItemDB.buffDef)
    if (tk) {
      B.lifePct = B.lifePct || 0; B.resAll = B.resAll || 0; // B = đồ đang mặc (chưa có võ công): thiếu trường % sinh lực
      // Chiến cổ / Lệnh Bài của mình / người cùng phe đứng gần (tongkim.js giữ — hết hạn thì tính lại chỉ số)
      const now = Date.now();
      if (this.tkBuffs && !ld) for (const [k, het] of this.tkBuffs) { const T = het > now ? ItemDB.buffDef(k) : null; if (T && T.attrs) addAttrs(B, T.attrs); }
      // chức trong trận (client trạng thái 661: lifemax_p + allres_p — tkbot.js CHUC_TK; máy chủ gửi chucHs [sinh lực %, kháng %] theo cau-hinh thì theo
      // đó); máy chủ báo chức đổi -> tongkim.js tính lại chỉ số
      const c = this.tk.chuc | 0, H = this.tk.chucHs, C = H && Array.isArray(H[0]) ? [+H[0][c] || 0, +(H[1] || [])[c] || 0] : CHUC_TK[c];
      if (C && (C[0] || C[1])) addAttrs(B, { lifemax_p: [C[0]], allres_p: [C[1]] });
      // bùa hại người / bot phe kia đang gắn lên mình (p.tkBua — tkbot.js tkBuaMinh; anh 17/11 "bùa hại của côn lôn k có tác dụng"): dòng tốc chạy / tốc đánh / hồi
      // sinh lực, nội lực / phản đòn tầm xa vào chỉ số như bùa (Ki Bán phù, Khi Hàn Ngạo Tuyết, Bắc Minh Đáo Hải, Thúc Phược Chú, Túy Tiên Tá Cốt…). Kháng / né /
      // thời gian choáng, chậm, độc của bùa đã tính ở tkThu / tkMod — không cộng ở đây kẻo trùng. vocong.js heroTick tính lại chỉ số khi bùa đổi
      const p0 = this.player, now2 = this.time;
      if (p0 && p0.tkBua) for (const c of p0.tkBua) if (c.until > now2) addAttrs(B, Object.fromEntries(Object.entries(c.attrs).filter(([k]) => BUA_CHI_SO.test(k))));
    }
    // bùa hại của siêu boss sự kiện (anh 18/11 — bosstg.js buaSk p.skBua): toàn kháng −, thời gian trúng độc +
    { const p1 = this.player; if (p1 && p1.skBua && p1.skBua.until > this.time) { B.lifePct = B.lifePct || 0; B.resAll = B.resAll || 0; addAttrs(B, p1.skBua.attrs); } }
    if (TD.toc) { B.moveSpeed = (B.moveSpeed || 0) + TD.toc; B.atkSpeed = (B.atkSpeed || 0) + TD.toc; B.castSpeed = (B.castSpeed || 0) + TD.toc; } // tăng ích tổ đội: tốc chạy + tốc đánh (ngoại / nội công)
    if (TD.hoi) { B.lifeRegen = (B.lifeRegen || 0) + TD.hoi / 2; B.manaRegen = (B.manaRegen || 0) + TD.hoi / 2; } // + hồi sinh lực / nội lực mỗi giây (lifeRegen tính mỗi nửa giây -> / 2)
    return B;
  }
  // vòng sáng hỗ trợ của đồng đội (anh 29/10 "nhân vật có chiêu vòng sáng có tác dụng cho đồng đội thì đồng đội cũng được hưởng nếu trong phạm
  // vi hiệu quả, như Nga My, Thiếu Lâm"): engine KNpc mỗi nhịp phát chiêu con của vòng sáng (cả các vòng ghép) tại chỗ người bật -> trạng
  // thái lên mọi người phe mình trong tầm của chiêu (skills: target ally, AttackRadius 180 — Bế Nguyệt Phất Trần 320). Người khác gửi vs = [[mã,
  // cấp chạy]] qua nhịp (main.js vongPhat -> may-chu/the-gioi.js); người cùng bãi, còn sống, đứng trong tầm của từng vòng -> [[mã, cấp, tên
  // người bật]]. skillB cộng như vòng của mình (cùng vòng thì lấy cấp cao nhất, không cộng dồn).
  // Anh 31/10: "vòng sáng chỉ tác dụng với cùng màu, vào pt thì đổi sang màu của chủ pt, nhân vật chữ trắng = chưa vô phái được hưởng vòng sáng
  // của các màu khác" (engine: chiêu con nhắm ally — cùng m_CurrentCamp) -> mọi người cùng bãi cùng phe đang theo (cp), không chỉ đồng đội; mình
  // chưa vào phái (phe 0): nhận của mọi phe. Tầm × VONG_TAM.
  vongDoi() {
    const p = this.player, db = this.P.skillDb, L = [], phe = this.pheMinh();
    if (!db || !this.others || p.hp <= 0) return L; // others chưa có: World đang dựng (bonus lần đầu)
    // phân thân đang theo (Phân Thân — anh 05/11 "màu tên đảm bảo cho người thuê được hưởng vòng sáng của phân thân"): phe = phe người thuê
    for (const a of this.phanThan || []) {
      const d = ldist(p.x, p.y, a.x, a.y);
      for (const [id, lv] of a.vs || []) { const s = db[id]; if (s && s.aura && !(s.target && s.target.enemy) && d <= this.tamVong(s)) L.push([id, lv, a.name]); }
    }
    if (!this.chiaBuff()) return L; // bãi train bản riêng: không nhận vòng sáng người khác (anh 06/11 — chiaBuff)
    for (const e of this.others.values()) {
      if (!e.vs || e.hp === 0 || (phe && (e.cp | 0) !== phe)) continue;
      const d = ldist(p.x, p.y, e.x, e.y);
      for (const [id, lv] of e.vs) { const s = db[id]; if (s && s.aura && !(s.target && s.target.enemy) && d <= this.tamVong(s)) L.push([id, lv, e.name]); }
    }
    return L;
  }
  // phe theo phái (factions[].camp: 1 chính, 2 tà, 3 trung lập; chưa vào phái 0)
  campPhai(fac) { return fac == null ? 0 : ((this.P.factions || []).find((f) => f.id === +fac) || {}).camp | 0; }
  // phe đang theo của mình: máy chủ báo qua nhịp (this.phe — trong đội: phe đội trưởng); chưa có thì theo phái mình
  pheMinh() { return this.phe ?? this.campPhai(this.hero.fac); }
  // vòng sáng hỗ trợ của mình còn tác dụng (đang bật ở ô tay phải + vòng ghép — auraGhep, + vòng vừa đổi chưa hết hạn — vongCapNhat) gửi qua
  // nhịp cho đồng đội: [[mã, cấp chạy]] | null (máy chủ giữ tối đa 6 — Nga My cả 6 vòng)
  vongPhat() {
    const L = this.vongMinh();
    return L.length ? L : null;
  }
  vongMinh() { return this.vongHan ? [...this.vongHan].map(([id, v]) => [id, v.lv]) : []; }
  // bùa lợi đang có mà có hình trạng thái (của mình + đồng đội dùng lên — Côn Lôn Thanh Phong phù…) gửi qua nhịp: người khác vẽ như vòng sáng
  // (anh 03/11 "buff côn lôn cho đồng đội chưa hiển thị đều như nga mi" — may-chu/the-gioi.js bl) -> [mã] | null
  buaPhat() {
    const p = this.player; if (p.hp <= 0) return null;
    const L = [...p.buffs.values()].filter((b) => b.st && b.until > this.time).map((b) => b.id);
    if (p.hideUntil > this.time) L.unshift(AN_BL); // ẩn thân: đứng đầu để không bị cắt (máy chủ giữ 8 mã)
    return L.length ? L.slice(0, 8) : null;
  }
  // tầm vòng sáng hỗ trợ của người bật (client × VONG_TAM; Nga My thêm × VONG_NM — anh 03/11 "tăng phạm vi hiệu quả của nga mi lên thêm 30%")
  tamVong(s) {
    if (!this._vongNM) this._vongNM = new Set(((this.P.factions || []).find((f) => f.key === "emei") || {}).skills || []);
    return (s.radius || 180) * SCALE * VONG_TAM * (this._vongNM.has(+s.id) ? VONG_NM : 1);
  }
  // tăng ích tổ đội (anh 03/11 "mỗi người chơi vào đội sẽ tăng thêm tốc độ di chuyển 5% và tốc đánh 5%, chỉ có tác dụng trên bãi train" — "max
  // 40% khi tổ đội max 8 người", "chỉ tính đứng cùng bãi, đang online"; luật cau-hinh.json tangIchDoi): ở bãi train (main.js baiTrain — chính /
  // phụ) trong đội mà có ≥ 2 người cùng bãi (mình + đồng đội đang thấy trên bản đồ — cùng bản) -> mỗi người toc % tốc độ di chuyển + tốc độ đánh;
  // kinh nghiệm: bản quái chung mỗi mốc moc +kn % (máy chủ cộng — may-chu/do.js tangIchKn; ở đây để hiện thanh trạng thái). Anh 03/11 lần 2 ("mỗi
  // giây hồi phục sinh lực nội lực 2 điểm 1 người, tối đa 8 người thì tăng 16 điểm"): hoi = n × T.hoi sinh lực + nội lực mỗi giây. -> { n, toc, kn, hoi }
  // Anh 06/11 ("buff chỉ có thể cộng ở bãi quái chung"): cả tốc độ / hồi phục cũng chỉ ở bản quái chung (chiaBuff) — bản riêng không còn tăng ích.
  tangIchDoi() {
    const T = this.tangIch;
    if (!T || !this.baiTrain || !this.chiaBuff() || !this.doiTen || !this.doiTen.size || this.player.hp <= 0) return { n: 0, toc: 0, kn: 0, hoi: 0 };
    let n = 1; for (const t of this.doiTen) if (this.others.has(t)) n++;
    if (n < 2) return { n, toc: 0, kn: 0, hoi: 0 };
    return { n, toc: n * (+T.toc || 0), kn: this.chung ? (T.moc || []).filter((m) => n >= m).length * (+T.kn || 0) : 0, hoi: n * (+T.hoi || 0) };
  }
  // vòng sáng hỗ trợ của mình còn tác dụng (anh 03/11 — xoay vòng Nga My): engine KNpc phát chiêu con của vòng đang bật (cả vòng ghép) mỗi 0,5
  // giây, trạng thái sống p2 khung (vocong.js vongGiu: Phật Tâm Từ Hữu 8 giây, vòng khác 1 giây) -> đổi vòng thì vòng trước còn tác dụng tới hết
  // hạn. Gọi mỗi bước (vocong.js vcUpdate); trọng thương / võ công chưa mở: mất hết
  vongCapNhat() {
    const H = this.vongHan, db = this.P.skillDb, t = this.time;
    if (!db || this.player.hp <= 0 || !this.P.vc || !this.vcOpen || this.camVc) { H.clear(); return; } // camVc: đường đua — vòng sáng không có tác dụng (client cấm)
    const au = this.hero.oChieu && this.hero.oChieu.phai, a = au && db[au], lv = a ? this.skLv(au) : 0;
    if (a && a.aura && !(a.target && a.target.enemy) && lv > 0) for (const [id, l] of [[+au, lv], ...auraGhep(a, lv, R.skCong(this.hero, db))]) H.set(+id, { lv: l, het: t + vongGiu(db[id], l) + VONG_DU }); // R.skCong: + cấp Báo Đáp Ân Sư (anh 16/11)
    for (const [id, v] of H) if (v.het <= t) H.delete(id);
  }
  // mỗi 0,5 giây (vocong.js vcUpdate): vòng đồng đội đổi (lại gần / ra xa / bật / tắt) hoặc vòng của mình hết hạn / thêm, số người tăng ích tổ
  // đội đổi -> tính lại chỉ số; vòng người khác đang được hưởng (vongNguoiKhac)
  vongKiem() {
    const TD = this.tangIchDoi();
    if (khoaVong([...this.vongDoi(), ...this.vongMinh()]) + "|" + TD.toc + "/" + TD.hoi !== (this._vdKey || "")) this.refreshStats(false);
    if (this.others && this.others.size) this.vongNguoiKhac();
  }
  // vòng sáng người khác đang được hưởng (anh 03/11 "chưa thấy vòng sáng hiển thị cho đồng đội"): engine phát trạng thái chiêu con lên mọi người
  // cùng phe trong tầm -> người đứng trong vòng của người khác (hoặc của mình) cũng mang hình trạng thái đó (vcStateList — e.vn = [mã vòng]).
  // Như vongDoi: người bật còn sống, cùng phe đang theo (cp; chưa vào phái nhận của mọi phe), trong tầm × VONG_TAM
  vongNguoiKhac() {
    const db = this.P.skillDb, p = this.player; if (!db) return;
    if (!this.chiaBuff()) { for (const e of this.others.values()) e.vn = null; return; } // bãi train bản riêng: không ai nhận vòng của người khác (chiaBuff)
    const phat = [...this.others.values()].filter((e) => e.vs && e.hp !== 0).map((e) => [e, e.cp | 0, e.vs]), minh = this.vongPhat();
    if (minh) phat.push([p, this.pheMinh(), minh]);
    for (const e of this.others.values()) {
      let L = null;
      if (e.hp !== 0) for (const [c, phe, vs] of phat) {
        if (c === e || ((e.cp | 0) && phe !== (e.cp | 0))) continue;
        const d = ldist(e.x, e.y, c.x, c.y);
        for (const [id] of vs) { const s = db[id]; if (s && s.aura && !(s.target && s.target.enemy) && d <= this.tamVong(s) && !(L && L.includes(+id))) (L = L || []).push(+id); }
      }
      e.vn = L;
    }
  }
  // buff giữa người chơi (anh 06/11 "fix lại buff chỉ có thể cộng ở bãi quái chung, tôi 1 acc ở riêng 1 acc ở chung mà vẫn dc buff"): ở bãi train
  // (chính / phụ) chỉ bản quái chung mới nhận vòng sáng, bùa lợi, hồi máu của người khác và tăng ích tổ đội; bản riêng (cả bãi chưa có bản chung)
  // thì không. Thành, Vượt Ải, Phong Hỏa, thuyền, Tống Kim… như cũ. Phân thân của mình không phải người khác — vẫn nhận (vongDoi)
  chiaBuff() { return !!this.tk || !this.baiTrain || !!this.chung; }
  laNgaMy() { return this.hero.fac != null && ((this.P.factions || []).find((f) => f.id === +this.hero.fac) || {}).key === "emei"; }
  // Trợ Thủ xoay vòng sáng (anh 03/11 "đặt nhiều vòng sáng cho nga mi, có thể đặt tối đa 3 vòng sáng cùng lúc … ô kĩ năng tay phải nó sẽ thay
  // đổi mỗi 1 giây hay 0.5 giây"): Nga My chọn ở thẻ Kỹ năng (auto.danh.vong + xoay) -> các vòng hỗ trợ đã học, không trùng; ≥ 2 vòng thì
  // đang tự đánh ô tay phải đổi vòng mỗi XOAY_GIAY (theo đồng hồ, không dồn trễ). Vòng vừa đổi còn tác dụng (vongCapNhat) -> 3 vòng cùng lúc
  vongXoay() {
    const A = this.hero.auto && this.hero.auto.danh, db = this.P.skillDb, L = [];
    if (!A || !db || !this.laNgaMy()) return L;
    for (const id of [A.vong, ...(A.xoay || [])]) { const s = id && db[id]; if (s && s.aura && !(s.target && s.target.enemy) && this.skLv(id) > 0 && !L.includes(+id)) L.push(+id); }
    return L;
  }
  xoayVong() {
    const L = this.auto && this.player.hp > 0 && this.P.vc && this.vcOpen ? this.vongXoay() : [];
    if (L.length < 2) return;
    const O = (this.hero.oChieu = this.hero.oChieu || {}), id = L[Math.floor(this.time / XOAY_GIAY) % L.length];
    if (O.phai !== id) { O.phai = id; if (this.onSkillHud) this.onSkillHud(); } // chỉ vẽ lại ô (không lưu mỗi 0,5 giây — Net.save chờ 1,5 giây mới gửi)
  }
  // quái đánh trúng mình: giảm theo "Giảm sát thương đến từ hệ X", bùa giảm sát thương trên quái, triệt tiêu điểm; nội lực hộ thân gánh
  // phần % (còn nội lực)
  guard(m, p, d) {
    let v = d.v * (1 - (p.fromSeries[m.series] || 0) / 100) * (1 + (this.P.vc ? this.mobMod(m, "addphysicsdamage_p") : 0) / 100) - (p.sorb || 0);
    v = Math.max(1, Math.floor(v));
    // Nội lực hộ thân % (Tọa Vọng Vô Ngã — anh 14/11 chốt công thức): tỷ lệ tổng = kỹ năng + bị động + trang bị (rules.js manaShield — giữ tổng, không chặn);
    // hiệu lực thực tế = MIN(HO_THAN_MAX 99 %, tổng) — không bao giờ miễn hết sát thương vào sinh lực. Sinh lực mất tối thiểu = CEIL(D × (100 − tỷ lệ) / 100)
    // (số nguyên — không lệch làm tròn); nội lực cần = D − phần đó; nội lực thực mất = MIN(nội lực đang có, nội lực cần); thiếu nội lực thì hết nội lực, phần
    // còn lại trừ vào sinh lực (không phạt thêm). Nội lực tốn khi thi triển chiêu tính riêng (castPay)
    if (p.manaShield > 0 && p.mp > 0) {
      const ty = Math.min(HO_THAN_MAX, p.manaShield), can = v - Math.ceil((v * (100 - ty)) / 100), a = Math.min(Math.floor(p.mp), Math.max(0, can));
      p.mp -= a; v -= a;
    }
    d.v = Math.max(0, v);
  }
  // Trợ Thủ (hero.auto.danh): vòng sáng chọn -> đặt ô tay phải; bùa chọn hết (còn < 3 giây) -> dùng lại (chiêu hồi máu ngắn — Từ Hàng
  // Phổ Độ: tác dụng ≤ 5 giây — chỉ dùng khi sinh lực < 60 %); bùa hại (tối đa 3 — anh 26/10 "bùa hại nếu có trên 2"): con đang nhắm chưa
  // mang bùa đó (hoặc bùa sắp hết) -> ra lần lượt trước khi đánh; mỗi bùa thử lại trên cùng con sau ≥ 3 giây (trượt / bị kháng thì không ra
  // mãi). Trả true khi vừa ra chiêu (bỏ lượt)
  autoBuff() {
    const A = this.hero.auto && this.hero.auto.danh, p = this.player, K = this.pk();
    this.pkTam = null;
    if (!A || p.hp <= 0 || this.resting || p.sit) return false;
    const O = (this.hero.oChieu = this.hero.oChieu || {}), H = A.hoi;
    // Nga My (anh 25/10): chiêu hồi máu khi sinh lực dưới x %
    if (H && H.on && H.id && !(this.P.skillDb[H.id] || {}).aura && this.skLv(H.id) > 0 && p.hp < (p.hpMax * H.pct) / 100 && this.skCan(H.id).ok) return this.castSelf(H.id); // cài cũ chọn nhầm vòng sáng (vocong.js isHeal): bỏ
    if (K && (this.pkLuiDang || (K.ve && !this.pkLuiBo && p.hp * 100 < p.hpMax * K.vePct))) return false; // PK đang / sắp về doanh (pkLuiTick ngay sau): chỉ hồi máu (dòng trên), không ra bùa mới; đã thôi chờ (pkLuiBo) thì dùng bùa lại
    if (A.vong && O.phai !== A.vong && this.skLv(A.vong) > 0 && this.vongXoay().length < 2) { O.phai = A.vong; this.refreshStats(false); if (this.onSkills) this.onSkills(); } // Nga My xoay ≥ 2 vòng: xoayVong lo
    for (const id of (K && K.bua.some((x) => x) ? K.bua : A.bua) || []) { // PK: bùa lợi của thẻ PK (chưa chọn bùa nào: của thẻ Kỹ năng)
      if (!id || this.skLv(id) < 1) continue;
      const b = p.buffs.get(id); if (b && b.until - this.time > 3) continue;
      // chiêu 120 tác dụng vùng (anh 13/11 lượt 88 "auto hỗ trợ dùng 120 thiên nhẫn, võ đang … xem có hoạt động đúng chưa"): Thiên Nhẫn Ma Âm Phệ Phách (hoảng loạn địch
      // quanh mình) / Võ Đang Xuất Ứ Bất Nhiễm (giải + miễn trạng thái xấu cho mình và đồng đội quanh mình) — dùng khi có địch quanh mình, hết hồi chiêu là dùng lại.
      // Trước: lọt vào luật "bùa ≤ 5 giây chỉ dùng khi sinh lực < 60 %" (của chiêu hồi máu ngắn) nên gần như không bao giờ tự dùng
      const vung = CHIEU_VUNG_120[id];
      if (vung) { if (!this.coDichGan(vung)) continue; }
      else if (this.buffDur(id) <= 5 && p.hp > p.hpMax * 0.6) continue;
      if (this.skCan(id).ok) return this.castSelf(id);
    }
    if (this.buaDoi(A, H)) return true;
    const m = p.target;
    if (K) return this.pkHai(K, m); // PK: bùa hại theo thẻ PK (người chơi phe kia cũng ra — không theo "dùng lên" của thẻ Kỹ năng)
    // mục tiêu của từng bùa hại (anh 03/11 — danh.haiMuc): "db" chỉ tinh anh / thủ lĩnh / Boss Sát thủ / Boss Hoàng Kim / boss khác; "nguoi" người chơi
    // (chưa có PK — không ra lên quái)
    const dacBiet = !!m && !!(m.boss || m.dacBiet || m.ta || m.sat || m.btg);
    if (m && m.alive) for (const [i, id] of (A.hai || []).entries()) {
      const muc = (A.haiMuc || [])[i] || "tat"; if (muc === "nguoi" || (muc === "db" && !dacBiet)) continue;
      const lv = id ? this.skLv(id) : 0; if (lv < 1) continue;
      if ((m.curse || []).some((c) => c.id === id && c.until > this.time + 1)) continue;
      const thu = (m.buaThu = m.buaThu || {}); if (thu[id] && this.time - thu[id] < 3) continue;
      if (ldist(p.x, p.y, m.x, m.y) > Math.min(this.skRange(id, lv), laBoss(m) ? BOSS_TAM * SCALE : Infinity) + m.radius || !this.skCan(id).ok) continue; // boss: bùa hại trong BOSS_TAM (anh 16/11)
      thu[id] = this.time; this.castStart(id, lv, m, null); return true;
    }
    return false;
  }
  // có địch (quái đánh được / người, bot, quân phe kia trong Tống Kim) còn sống trong R quanh mình (Trợ Thủ — chiêu 120 tác dụng vùng)
  coDichGan(R) {
    const p = this.player;
    if (this.tk) return this.tkDichCua(this.tk.phe).some((e) => e !== p && ldist(p.x, p.y, e.x, e.y) <= R);
    return this.mobs.some((m) => m.alive && !m.dummy && !m.an && ldist(p.x, p.y, m.x, m.y) <= R);
  }
  // Trợ Thủ "Bùa lợi cho đồng đội" (anh 02/11 "thêm tùy chọn buff bùa lợi cho đồng đội trong pt"): bùa lợi đã chọn mà client cho dùng lên người
  // khác (skills.json target.ally — Côn Lôn Thanh Phong phù / Thiên Thanh Địa Trọc / Nhất Khí Tam Thanh, Thiếu Lâm Bất Động Minh Vương) -> đồng
  // đội cùng bãi, còn sống, đứng trong tầm chiêu mà mình chưa dùng lên họ (hoặc còn ≤ 3 giây) thì quay về phía họ dùng; chiêu hồi máu của ô hồi
  // máu (Nga My Từ Hàng Phổ Độ) -> đồng đội sinh lực dưới % của ô đó (mỗi người cách ≥ 3 giây). Máy họ cộng bùa ở cấp của mình (castFire ->
  // main.js onBuaDoi -> may-chu/to-doi.js "buaDoi" -> buaTuDoi). Trả true khi vừa ra chiêu
  buaDoi(A, H) {
    // hồi máu đồng đội (anh 03/11 — danh.hoiDoi { on, pct }, chiêu của ô hồi máu): riêng 1 ô, không cần bật "Bùa lợi cho đồng đội"; làm trước bùa,
    // người sinh lực thấp nhất trước
    const D = this.hero.auto && this.hero.auto.doi, p = this.player, db = this.P.skillDb, HD = A.hoiDoi;
    const coBua = !!(D && D.bua), coHoi = !!(HD && HD.on && H && H.id && db && !(db[H.id] || {}).aura);
    if ((!coBua && !coHoi) || !this.doiTen || !this.doiTen.size || !db || !this.chiaBuff()) return false; // bãi train bản riêng: không bùa / hồi máu lên người khác
    const da = (this.daBuaDoi = this.daBuaDoi || new Map()); // tên đồng đội -> Map(mã bùa -> lúc dùng lại được)
    // Vượt Ải / Viêm Đế (anh 18/11 — "8 người thì tự buff 3 bùa cho mỗi nhân vật, buff liên tục, rất bất hợp lý"): bùa vùng (vocong.js BUA_VUNG_AI) mình tự dùng
    // đã lan cho cả đội quanh mình (buaVungDoi) -> không quay sang dùng riêng từng người; chỉ giữ bùa của mình (vòng bùa ở trên)
    const ds = [...(coHoi ? [[H.id, HD.pct || 50]] : []), ...(coBua ? (A.bua || []).filter((id) => id && !(this.buaVungAi && BUA_VUNG_AI.has(+id))).map((id) => [id, 0]) : [])];
    if (!ds.length) return false;
    const tv = [...this.doiTen].sort((a, b) => ((this.others.get(a) || {}).hp ?? 100) - ((this.others.get(b) || {}).hp ?? 100));
    for (const ten of tv) {
      const e = this.others.get(ten);
      if (!e || !(e.hp > 0) || e.act === "die") { da.delete(ten); continue; } // chết / không ở bãi: bùa đã mất, gặp lại thì dùng lại
      const M = da.get(ten) || da.set(ten, new Map()).get(ten), d = ldist(p.x, p.y, e.x, e.y);
      for (const [id, pct] of ds) {
        const s = db[id]; if (!s || !s.target || !s.target.ally || this.skLv(id) < 1 || d > (s.radius || 400) * SCALE) continue;
        if (pct ? e.hp >= pct || (M.get(id) || 0) > this.time : (M.get(id) || 0) - this.time > 3) continue;
        if (!this.skCan(id).ok) continue;
        this.castStart(id, this.skLv(id), null, [e.x, e.y]); if (p.cast) p.cast.ally = ten;
        M.set(id, this.time + (pct ? 3 : this.buffDur(id)));
        return true;
      }
    }
    return false;
  }
  // bùa lợi đồng đội vừa dùng lên mình (main.js "buaDoi" — máy chủ đã kiểm cùng đội, cùng bãi): như mình dùng bùa đó ở cấp của người dùng
  buaTuDoi(id, lv) {
    const s = this.P.skillDb && this.P.skillDb[id];
    if (!this.P.vc || !s || !s.target || !s.target.ally || !(lv > 0) || this.player.hp <= 0 || !this.chiaBuff()) return; // bản riêng của bãi train: không nhận (chiaBuff)
    this.buffOn(+id, Math.min(lv | 0, 40));
    const b = this.player.buffs.get(+id); if (b) b.tuDoi = 1; // bùa của đồng đội: sang bản riêng của bãi train thì bỏ (main.js loadZone — soát 06/11)
  }
  // chuột phải: chiêu ô tay phải — bùa lợi: dùng lên mình; tấn công / bùa hại: quái dưới chuột (1 lần), đất: tung NGAY vào chỗ trỏ như
  // Shift + chuột trái (castAt — anh 26/10; bản đầu đi bộ tới tầm rồi mới ra). Đoạn Hồn Thích: lướt ngay về hướng đó (tầm lướt 310 đơn vị)
  // Khinh công (anh 10/11 — engine KNpc::NewJump / ServeJump / OnJump): nhảy thẳng tới điểm, 12 đơn vị mỗi vòng, xa nhất tầm 400; vật cản thường dừng trước vật cản, vật cản loại nhảy
  // (map.nhayQua) bay qua được; chỉ đáp xuống ô đi được cùng vùng với chỗ nhảy (không sang bờ bên kia Phong Lăng Độ, không kẹt trong vách — engine không xét, S1 thêm để khỏi kẹt)
  khinhCong(x, y) {
    const p = this.player, M = this.map;
    if (p.hp <= 0 || p.jump || p.dash) return true;
    if (this.riding()) { this.skMsg("Đang cưỡi ngựa không dùng được Khinh công"); return true; }
    if (p.act === "attack" || (p.act === "hurt" && p.t < (p.hurtDur ?? DUR.hurt))) { p.queueAt = { id: KC_ID, pt: [x, y] }; return true; }
    if (p.st < KC_PHI) { this.skMsg("Không đủ thể lực"); return true; }
    const V = 12 * SCALE, dx = x - p.x, dy = (y - p.y) * 2, L = Math.hypot(dx, dy); if (L < 1) return true;
    const ux = dx / L, uy = dy / L, n = Math.floor(Math.min(L, 400 * SCALE) / V), vung = M.vung(p.x, p.y);
    let ok = 0;
    for (let i = 1; i <= n; i++) {
      const tx = p.x + ux * V * i, ty = p.y + (uy * V * i) / 2;
      if (!M.nhayQua(tx, ty)) break;
      if (M.walkable(tx, ty) && (vung < 0 || M.vung(tx, ty) === vung)) ok = i;
    }
    if (ok < 1) { this.skMsg("Không nhảy tới chỗ đó được"); return true; }
    if (p.sit) this.sit(false);
    p.st = Math.max(0, p.st - KC_PHI);
    p.target = null; p.path = null; p.goal = null; p.talkTo = null; p.loot = null; p.once = null; p.manual = true;
    p.dir = dirOf(dx, dy);
    p.jump = { map: M, x0: p.x, y0: p.y, ux, uy: uy / 2, v: V * 18, n: ok, t: 0, dur: ok / 18 };
    this.setAct(p, "jump");
    return true;
  }
  // 1 nhịp khinh công (updateHero): bay đều tới chỗ đáp, không bị đánh gián đoạn giữa không trung (giữa đường có thể đang trên vách — ngắt là kẹt); chết thì thôi
  jumpTick(p, dt) {
    const J = p.jump;
    if (p.hp <= 0 || J.map !== this.map) { p.jump = null; return; }
    J.t += dt;
    const k = Math.min(J.t, J.dur);
    p.x = J.x0 + J.ux * J.v * k; p.y = J.y0 + J.uy * J.v * k;
    if (J.t >= J.dur) { p.jump = null; p.manual = false; if (p.act === "jump") this.setAct(p, "stand"); }
  }
  useRight(mob, x, y) {
    const p = this.player, id = this.hero.oChieu && this.hero.oChieu.phai, s = id && this.skDef(id);
    if (!s || p.hp <= 0 || !this.P.vc) return false;
    if (kindOf(s, this.P.skillDb) === "aura") { this.skMsg(`${s.n}: vòng sáng đang bật (ô tay phải)`); return true; }
    return this.castAt(id, mob, x, y);
  }
  // Shift + chuột trái (client Mouse_Force0 — anh 26/10): chiêu ô tay trái vào quái dưới chuột hoặc vào khoảng không chỗ trỏ; ô trái trống
  // (đòn thường): có quái thì đánh, không thì vung tay về hướng đó
  useLeft(mob, x, y) {
    const p = this.player, id = this.hero.oChieu && this.hero.oChieu.trai, s = id && this.skDef(id);
    if (p.hp <= 0) return false;
    if (this.camVc) { this.skMsg(this.camVc); return true; } // đường đua (duangua.js): không đòn / chiêu
    if (s && this.P.vc) return this.castAt(id, mob, x, y);
    if (mob) { this.clickMob(mob); return true; }
    if (p.act === "attack" || p.dash) return true;
    if (p.an) { this.skMsg("Khu vực an toàn — không thể chiến đấu"); return true; } // trong thôn / thành (map.an): không vung đòn
    if (p.sit) this.sit(false);
    p.target = null; p.path = null; p.goal = null; p.manual = true;
    p.dir = dirOf(x - p.x, (y - p.y) * 2); this.setAct(p, "attack"); p.attack = p.attack === "Attack1" ? "Attack2" : "Attack1"; p.atkN = (p.atkN || 0) + 1; p.hitDone = false;
    return true;
  }
  // ra chiêu id không cần mục tiêu (Shift + chuột trái, phím ô dùng nhanh — anh 26/10): có quái dưới chuột thì đánh con đó (đi tới tầm như
  // bấm quái); không thì như engine KNpc::DoSkill với điểm đất — ra NGAY theo hướng con trỏ, không chạy tới tầm; điểm xa hơn tầm chiêu
  // thì lấy điểm ở mép tầm trên đường tới đó. Đang vung đòn / bị đánh: chờ xong (queueAt). Bùa lợi: lên mình; vòng sáng: bên gọi tự lo
  castAt(id, mob, x, y) {
    const p = this.player, s = this.skDef(id);
    if (!s || p.hp <= 0 || !this.P.vc) return false;
    if (this.camVc) { this.skMsg(this.camVc); return true; } // đường đua (duangua.js): cấm mọi võ công — cả Khinh công, di hình, bùa
    const kind = kindOf(s, this.P.skillDb);
    if (kind === "jump") return this.khinhCong(x, y);
    if (kind === "buff") return this.castSelf(id);
    const c = this.skCan(id); if (!c.ok) { this.skMsg(c.why); return true; }
    if (p.sit) this.sit(false);
    // di hình (Mê Ảnh Tung): tới ngay chỗ trỏ / con quái dưới chuột
    if (kind === "move") { if (p.act === "attack" || p.dash) return true; this.castStart(id, this.skLv(id), null, mob && mob.alive ? [mob.x, mob.y] : [x, y]); return true; }
    if (mob && mob.alive) { this.clickMob(mob); p.once = id; return true; }
    if (p.dash) return true;
    if (p.an) { this.skMsg("Khu vực an toàn — không thể chiến đấu"); return true; } // trong thôn / thành (map.an): không tung chiêu vào khoảng không
    if (p.act === "attack" || (p.act === "hurt" && p.t < (p.hurtDur ?? DUR.hurt))) { p.queueAt = { id, pt: [x, y] }; return true; }
    const lv = this.skLv(id), R = this.skRange(id, lv), d = ldist(p.x, p.y, x, y);
    if (d > R) { x = p.x + ((x - p.x) * R) / d; y = p.y + ((y - p.y) * R) / d; }
    this.castStart(id, lv, null, [x, y]);
    return true;
  }
}

installVoCong(World);
installNhanVatMay(World);
installTkBot(World); // Tống Kim — bot + PK (anh 05/11 — src/game/tkbot.js)
