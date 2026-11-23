// Giao diện trong game giống client PC (kho assets/ui/hud — tools/build-hud-pack.mjs). Mọi tọa độ theo hệ 1024×768 của client:
//   - dải trên (dán mép trên): Cấp · Thể lực · Sinh lực · Nội lực · Kinh nghiệm · Hạng; bản đồ nhỏ góc phải (小地图_小.ini);
//   - dải dưới (dán mép dưới): 9 ô đồ, 2 ô kỹ năng T / P, ô chat + nút chọn kênh, nút chức năng, Kỳ Trân Các; khung chat nhiều kênh
//     + khung tin hệ thống (消息集合面板_左.ini).
// Hai dải căn giữa màn hình; bản đồ nhỏ dán góc phải trên, khung chat dán góc trái dưới của trình duyệt (anh muốn 23/10 — cách mép
// giữ như client ở 1024 px); cửa sổ hẹp hơn 1024 px thì thu nhỏ. Font: "VK Sans Serif 13/16" (Vn.fon của client).
//
//   const hud = await Hud.load(); hud.mount(el, { onButton(key, on), onSend(channel, text), onMapClick(x, y), onGoto(X, Y),
//     onSlot(i, e), onSlotMenu(i, e), onSlotTip(i, e) (i = -1: rời ô) });   9 ô đồ phím 1–9
//   hud.setQuick([{ ic, n, tu, skill } | null × 9])  ô dùng nhanh: icon, số bình, ngưỡng tự uống (%); skill = ô chứa võ công (không số);
//     cb.onSlotDown(i, e) bấm xuống ô (kéo sang ô khác / ra ngoài để gỡ)
//   hud.setSkills({ left, right: { ic, n, tip? } | null })  2 ô kỹ năng T / P (võ công 25/10): bấm -> cb.onSkillSlot("left" | "right", ô);
//     rê chuột -> cb.onSkillTip("left" | "right", e), rời ô -> cb.onSkillTip(null) (ô xem chiêu như client)
//   hud.setTroThu(mở)                  nút Trợ Thủ ở cột icon phải (bấm: onButton("TroThu"), chuột phải: onButton("Auto")) — khung nhấn khi mở
//     cột icon mép phải (như client icon_bar.ini — x 994, từ y 300, ô 25): Đăng nhập nhận thưởng (icon [Icon_5]): bấm -> onButton("NhanThuong")
//   hud.setPhanThan(mở)  ô 4 cột icon: Phân Thân (icon_bar.ini [Icon_4], 23 × 23 — anh 05/11): bấm -> onButton("PhanThan")
//   hud.setHuongDan(mở) / hud.chamHuongDan(có)  ô 3 cột icon: Hướng dẫn hoạt động (icon [Icon_1], 25 × 25 — anh 05/11): bấm -> onButton("HuongDan");
//     khung nhấn khi mở, chấm đỏ khi có hoạt động đang diễn ra (huongdan.js)
//   hud.setDoi([{ ten, truong, toi, xa, hp, mp, tip }], toiDa)  bảng đội ngũ góc trái dưới hàng biểu tượng trạng thái (29/10 — client
//     队伍一览信息.ini; dòng đầu thu gọn / mở, trên 4 người 2 cột); cb.onDoi() khi bấm 1 người
//   hud.datBoCuc(bc) · keoBang(bật) · boCucNay() · boCucDoi() · boCucMacDinh()  bố cục: kéo thả bảng nhiệm vụ / đội ngũ / biểu tượng trạng thái /
//     mộc nhân luyện công (29/10 lần 3 — Trợ Thủ → Khác); thanh Lưu bố cục · Mặc định · Hủy -> cb.onBoCuc("luu" | "macDinh" | "huy")
//   hud.setStates([{ img, t (giây còn lại | null), n, d, xau }])  hàng biểu tượng trạng thái góc trái trên (27/10 — client 技能状态列表.ini:
//     ô 24 × 24, 10 ô / hàng, chữ thời gian dưới ô "%dh" / "%dm" / "%ds" màu 55,231,63; rê chuột: tên vàng + tác dụng trong ô xem của game —
//     data-tip, windows.js _tipChu)
//   hud.setNhiemVu([{ ten, muc: [{ ten, phu, dong: [[[chữ, màu?, khóa bấm?], …], …] }] }])  bảng nhiệm vụ góc trái (anh 28/10): nhóm (Chính
//     tuyến / Phụ tuyến / Hằng ngày) -> mục (Dã Tẩu, Sát thủ …) -> dòng gồm các đoạn chữ; đoạn có khóa bấm được -> cb.onNhiemVu(khóa).
//     Nút mũi tên của client (sys_up / sys_down) ở đầu bảng: thu gọn / mở rộng (nhớ ở máy này)
//   hud.update({ lvl, life, lifeMax, mana, manaMax, stamina, staminaMax, exp, expMax, rank });
//   hud.msg(text)                       tin hệ thống (khung tin hệ thống, chữ vàng như client)
//   hud.chat(channel, name, text, self) tin chat theo kênh (khung chat; thẻ lọc theo kênh)
//   hud.setMap({ key, name, toClient(x, y) -> [X, Y], fromClient(X, Y) -> [x, y] }); hud.drawMinimap({ player, mobs, others, path, goal })
import { BieuCam } from "./bieucam.js";
import { chuMau } from "./npcdlg.js"; // tin hệ thống có thẻ màu <color=…> (anh 13/11)
import { XUC_XAC, bauCuaChu } from "./baucua.js";
import { kyChuan, voKy } from "./an-ky.js"; // ấn ký bản gốc (anh 11/11): ô chữ góc trái phải có chữ ký

const BASE = "assets/ui/hud/";
const css = (o) => Object.entries(o).map(([k, v]) => `${k}:${typeof v === "number" ? v + "px" : v}`).join(";");
const rgb = (c) => `rgb(${c.join(",")})`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// viền chữ 1 điểm (client: TextBorderColor / DrawFontWithBorder). Kênh không ghi màu viền (CH_SYSTEM — tin báo cả máy chủ: nhặt đồ 6 dòng,
// qua Vượt Ải) thì không viền — bản trước rgb(null) lỗi giữa nhịp, mất luôn kết quả giết quái của nhịp đó (thấy 28/10)
const border = (c) => { if (!c) return "text-shadow:none"; const k = rgb(c); return `text-shadow:1px 0 ${k},-1px 0 ${k},0 1px ${k},0 -1px ${k},1px 1px ${k},-1px -1px ${k},1px -1px ${k},-1px 1px ${k}`; };
// Thẻ lọc của khung chat. Client ghi mặt nạ kênh theo mã nội bộ của engine (không có trong dữ liệu) -> lọc theo nghĩa của thẻ.
// "TIN" = thông báo của game (hud.msg — nhặt đồ, vứt đồ, kinh nghiệm, Sơn Hà Xã Tắc, tin thuyền…): anh 27/10 "cho vô khung chat, ở kênh Khác",
// "Tất cả cũng phải hiển thị nội dung bên Khác vì nó là kênh tổng" -> thẻ Khác + Tất cả. Anh 01/11: "tách thông báo khác ra khỏi kênh tất cả,
// thêm kênh tổ đội, chat ở tần số nào thì hiển thị ở kênh tương ứng" -> Tất cả = mọi tin chat của người chơi; Khác = thông báo của game (TIN) +
// tin báo cả máy chủ / quản trị (CH_SYSTEM); thẻ Đội ngũ (CH_TEAM — thêm lúc nạp, Hud.load) như Mật / Phòng / Bang hội / Môn phái. Anh 02/11:
// "trừ nhận exp với tiền nằm cố định ở kênh Khác, các dòng nhận đồ, nhặt trang bị hay thông báo khác hiển thị ở kênh Tất cả" -> Tất cả = tin
// chat + mọi thông báo trừ dòng nhận kinh nghiệm / tiền khi đánh quái, nhặt tiền (m.nhan — hud.msg tham số nhan); Khác = mọi thông báo như cũ
const THONG_BAO = new Set(["TIN", "CH_SYSTEM"]);
// màu chữ nền của tin hệ thống (CH_SYSTEM — anh 13/11 chọn mẫu C "đừng để thông báo toàn màu đỏ"): vàng nhạt (Gold của bảng màu engine) thay đỏ 255,0,0 của
// client; tên nhân vật xanh ngọc / phần thưởng xanh lá là thẻ <color=…> trong chữ của tin (may-chu/mau-tin.js -> npcdlg.js chuMau)
const MAU_HE_THONG = [243, 194, 90];
const TAB_FILTER = {
  "Tất cả": (m) => !m.nhan,
  "Mật": (m) => m.ch === "PRIVATE",
  "Đội ngũ": (m) => m.ch === "CH_TEAM",
  "Phòng": (m) => m.ch === "CH_CHATROOM",
  "Bang hội": (m) => m.ch === "CH_TONG" || m.ch === "CH_TONGUNION",
  "Môn phái": (m) => m.ch === "CH_FACTION",
  "Khác": (m) => THONG_BAO.has(m.ch),
};

export class Hud {
  static async load() {
    const r = await fetch(BASE + "hud.json");
    if (!r.ok) throw new Error("Không đọc được hud.json");
    const meta = await r.json();
    // thẻ "Đội ngũ" sau thẻ Mật (anh 01/11 — client không có thẻ này); mỗi thẻ giữ bề rộng của client (60) — bản đầu thu hẹp cho cả dãy dài như cũ
    // thì chữ các thẻ lệch, khoảng cách không đều (anh 01/11 "bố cục text các kênh lệch")
    const T = meta.chat.tabs;
    if (!T.list.some((t) => t.label === "Đội ngũ")) T.list.splice(2, 0, { label: "Đội ngũ", type: 1, mask: 0 });
    for (const f of meta.fonts) document.fonts.add(await new FontFace(f.family, `url(${BASE}${f.file})`).load()); // nạp trước khi vẽ chữ lên canvas
    const hud = new Hud(meta);
    // biểu tượng ngũ hành cạnh tên quái (vẽ trên canvas nên nạp sẵn)
    hud.seriesImgs = ((meta.npc && meta.npc.series) || []).map((s) => { if (!s) return null; const im = new Image(); im.src = BASE + s.file; return im; });
    return hud;
  }
  // hình ngũ hành của hệ s (0 Kim, 1 Mộc, 2 Thủy, 3 Hỏa, 4 Thổ) hoặc null
  seriesImg(s) { const im = (this.seriesImgs || [])[s]; return im && im.complete && im.naturalWidth ? im : null; }

  constructor(meta) {
    this.M = meta; this.el = null; this.toggles = {};
    this.msgs = []; this.tab = "Tất cả"; this.channel = "CH_NEARBY"; this.lastSend = {}; this.matToi = null; // matToi: người nhận tin mật (datMat)
    this.mmImg = null; this.mmMap = null; this.mmBig = false;
  }

  mount(parent, cb = {}) {
    const M = this.M, B = M.buttons, F = M.frame, C = M.chat, MM = M.minimap;
    this.cb = cb;
    const root = document.createElement("div");
    root.id = "jxhud";
    const at = (r, cls, html = "", extra = {}, attrs = "") => `<div class="${cls}"${attrs} style="${css({ left: r.x, top: r.y, width: r.w, height: r.h, ...extra })}">${html}</div>`;
    const img = (s, f = 0) => ({ "background-image": `url(${BASE}${s.file})`, "background-size": `${s.w * s.frames}px ${s.h}px`, "background-position": `${-f * s.w}px 0` });

    // ---- dải trên + bản đồ nhỏ ----
    const top = document.createElement("div");
    top.className = "jx-top";
    top.style.cssText = css({ width: F.w, height: M.top.h, "background-image": `url(${BASE}${M.top.file})` });
    top.innerHTML =
      at({ x: M.logo.x, y: M.logo.y, w: M.level.x - M.logo.x - 50, h: 13 }, "jx-logo", M.logo.text) +
      at(M.level, "jx-lv") +
      M.bars.map((b) => at(b, `jx-bar ${b.key}`, `<i style="${css({ background: grad(b.color) })}"></i><span></span>`)).join("") +
      at(M.rank, "jx-rank");
    top.querySelectorAll(".jx-bar").forEach((el, i) => (el.title = M.bars[i].n));
    top.querySelector(".jx-lv").title = "Cấp";
    // ô Hạng: thứ tự cấp trong máy chủ (nhịp — may-chu/xep-hang.js); bấm: khung xếp hạng của client (排名.ini — anh 27/10, bước 7)
    const rk = top.querySelector(".jx-rank"); rk.title = "Hạng cấp trong máy chủ — bấm: bảng xếp hạng"; rk.onclick = () => cb.onButton && cb.onButton("XepHang");

    // ---- bản đồ nhỏ: khối riêng dán góc phải trên của trình duyệt (anh muốn 23/10); cách mép phải giữ như client ở 1024 px ----
    // ảnh + chấm vẽ trên canvas; dải tối mờ sau tên; tên bãi (bấm: chọn bãi); tọa độ (bấm: gõ tọa độ để đi tới); 4 nút
    const X0 = (this.mmX0 = Math.min(MM.x, MM.pos.x)), XM = (r) => ({ ...r, x: r.x - X0 });
    const mm = document.createElement("div");
    mm.className = "jx-mmbox";
    // cột icon bên phải như client (icon_bar.ini: x 994, ô 25 × 25, xếp dọc, 7 ô) — anh 27/10: "cho xuống dưới tí để tránh lúc phóng to bản
    // đồ, sau này còn thêm icon khác": đầu cột ở y 300, dưới bản đồ nhỏ phóng to (ruột 256 × 256 + dòng "Tự đánh" dời xuống tới y ~293). Icon
    // thêm sau xếp tiếp ICON_COT.o điểm một ô. Ô 1: Đăng nhập nhận thưởng (icon 23 × 23, 3 khung: 0 thường, 1 nhấn). Ô 2: Trợ Thủ (anh 27/10
    // "đồng bộ với icon điểm danh" — trước là nút tròn 20 × 20 cạnh chữ "Tự đánh"; hình ô cột icon: cong-cu/dung-khung-cua-hang.mjs)
    const ICON_COT = { x: 994, y: 300, o: 25 }, oCot = (i) => ({ x: ICON_COT.x + 1, y: ICON_COT.y + i * ICON_COT.o + 1, w: 23, h: 23 });
    // ô 3 (anh 05/11): Hướng dẫn hoạt động — icon client 25 × 25 lấp đủ ô (icon_bar.ini [Icon_1] guidebutton.spr: 0 thường, 1 nhấn / rê)
    // ô 4 (anh 05/11): Phân Thân — icon_bar.ini [Icon_4] \spr\Ui3\pet\icon.spr (hình người xanh như bóng — 23 × 23, 3 khung; cong-cu/dung-phan-than.mjs)
    // ô 5 (anh 09/11): Nhóm Zalo — mở mã QR (src/game/nhomzalo.js), hình 72 × 72 thu về ô 23
    // ô 6 (anh 10/11 lần 3 "icon đặt mọi nơi"): Bầu Cua — chỉ hiện từ 5 phút trước giờ mở tới hết giờ, chữ đếm ngược bên trái (setBauCua)
    const LP = oCot(0), TT = oCot(1), HD = { x: ICON_COT.x, y: ICON_COT.y + 2 * ICON_COT.o, w: 25, h: 25 }, PTB = oCot(3), ZL = oCot(4), BCB = oCot(5);
    mm.style.cssText = css({ width: F.w - X0, height: Math.max(MM.y + MM.h + 14, BCB.y + BCB.h) });
    mm.innerHTML =
      at(XM(MM.rect), "jx-mm", `<canvas width="${MM.rect.w}" height="${MM.rect.h}"></canvas>`) +
      at(XM(MM.shadow), "jx-mm-shadow", "", { background: `rgba(${MM.shadow.color.join(",")},${(MM.shadow.alpha / 255).toFixed(2)})` }) +
      at(XM(MM.name), "jx-mm-name", "", { color: rgb(MM.name.color), "text-align": MM.name.align === 2 ? "right" : MM.name.align === 1 ? "center" : "left" }) +
      at(XM(MM.pos), "jx-mm-pos", "", { color: rgb(MM.pos.color) }) +
      `<input class="jx-mm-input" maxlength="16" spellcheck="false" style="${css({ left: MM.pos.x - X0, top: MM.pos.y, width: MM.pos.w, height: MM.pos.h })}">` +
      Object.entries(MM.buttons).map(([k, b]) => `<div class="jx-btn jx-mmbtn" data-k="${k}" title="${esc(b.tip)}" style="${css({ left: b.x - X0, top: b.y, width: b.w, height: b.h, ...img(b, b.up) })}"></div>`).join("") +
      `<div class="jx-auto" style="${css({ left: MM.x - X0, top: MM.y + MM.h + 1, width: MM.w })}" title="Tự đánh (phím Z)"></div>`;
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-lpbtn" title="Đăng nhập nhận thưởng" style="${css({ left: LP.x - X0, top: LP.y, width: LP.w, height: LP.h, "background-image": `url(${BASE}btn/nhanthuong.png)`, "background-position": "0 0" })}"></div>`);
    // nút Trợ Thủ (game thêm): icon "Chủ động công kích" của thanh đồng hành client trong ô cột icon
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-ttbtn" title="Trợ Thủ — bấm: mở / đóng (phím K) · chuột phải: bật / tắt tự đánh" style="${css({ left: TT.x - X0, top: TT.y, width: TT.w, height: TT.h, "background-image": `url(${BASE}btn/trothu_cot.png)`, "background-position": "0 0" })}"></div>`);
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-hdbtn" title="Hướng dẫn hoạt động — lịch, giờ, yêu cầu, tra cứu rơi đồ và rương" style="${css({ left: HD.x - X0, top: HD.y, width: HD.w, height: HD.h, "background-image": `url(${BASE}btn/huongdan.png)`, "background-position": "0 0" })}"></div>`);
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-ptbtn" title="Phân Thân — thuê phân thân của cao thủ khác đi theo hỗ trợ, đánh quái" style="${css({ left: PTB.x - X0, top: PTB.y, width: PTB.w, height: PTB.h, "background-image": `url(${BASE}btn/phanthan.png)`, "background-position": "0 0" })}"></div>`);
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-zlbtn" style="${css({ left: ZL.x - X0, top: ZL.y, width: ZL.w, height: ZL.h, "background-image": `url(${BASE}btn/zalo.png)`, "background-size": "100% 100%" })}"></div>`);
    mm.insertAdjacentHTML("beforeend", `<div class="jx-bcbtn" style="${css({ left: BCB.x - X0, top: BCB.y, width: BCB.w, height: BCB.h })}">${XUC_XAC}</div><div class="jx-bcchu" style="${css({ left: BCB.x - X0 - 4, top: BCB.y + 2 })}"></div>`);
    // ổ khóa an toàn (anh 10/11 — mật khẩu cấp 2, src/game/khoaantoan.js): đúng chỗ client — securitylock_icon.ini Left 650 Top 20 ở màn 800 × 600 =
    // sát trái bản đồ nhỏ (小地图_小.ini Left 670), cách mép trên 20 -> ở khung 1024: x = bản đồ nhỏ - 21. Hình 19 × 23, 2 khung (0 thường, 1 rê chuột):
    // khoa_dong (đang khóa) / khoa_mo (đang mở hoặc chưa đặt mật khẩu cấp 2 — thêm chấm đỏ nhắc đặt). Bản đồ nhỏ phóng to: dời theo (_mmButton)
    mm.insertAdjacentHTML("beforeend", `<div class="jx-btn jx-katbtn" style="${css({ left: MM.rect.x - 21 - X0, top: 20, width: 19, height: 23, "background-image": `url(${BASE}btn/khoa_mo.png)`, "background-position": "0 0" })}"></div>`);
    mm.querySelector(".jx-mm-pos").title = MM.pos.tip;

    // ---- khung chat: khối riêng dán góc trái dưới của trình duyệt (anh muốn 23/10); cách mép như client ở 1024 px ----
    const S = C.strip;
    const yc = Math.min(C.list.y, C.tabs.y, ...Object.values(S).filter(Boolean).map((r) => r.y));
    const YC = (r) => ({ ...r, y: r.y - yc });
    const chat = document.createElement("div");
    chat.className = "jx-chatbox";
    chat.style.cssText = css({ width: Math.max(C.list.x + C.list.w, C.sys.x + C.sys.w, C.tabs.x + C.tabs.dx * C.tabs.list.length), height: F.h - yc });
    let ch = "";
    // thanh cuộn trái của khung chat: đỉnh, ruột lặp, nút bóng nền, đáy; nút khung tin hệ thống
    if (S.mid) ch += at(YC({ x: S.mid.x, y: S.mid.y, w: S.mid.w, h: S.shadow.y - S.mid.y }), "jx-strip", "", { "background-image": `url(${BASE}${S.mid.file})`, "background-repeat": "repeat-y" }, ' data-s="mid"');
    for (const k of ["top", "bottom"]) if (S[k]) ch += at(YC(S[k]), "jx-strip", "", img(S[k]), ` data-s="${k}"${k === "top" ? ' title="Kéo lên / xuống: đổi chiều cao khung chat"' : ""}`);
    for (const k of ["shadow", "sysUp", "sysDown", "sysOpen"]) if (S[k]) ch += at(YC(S[k]), "jx-btn jx-cbtn", "", img(S[k], S[k].up), ` data-c="${k}" title="${esc(S[k].tip)}"`);
    ch += at(YC(C.list), "jx-chat");
    ch += at(YC(C.sys), "jx-sys", "", { color: rgb(C.sys.color) });
    ch += C.tabs.list.map((t, i) => at(YC({ x: C.tabs.x + i * C.tabs.dx, y: C.tabs.y, w: C.tabs.w, h: C.tabs.h + 2 }), "jx-tab", esc(t.label), {}, ` data-t="${esc(t.label)}"`)).join("");
    chat.innerHTML = ch;

    // ---- dải dưới (căn giữa): ô chat gõ chữ, 9 ô đồ, 2 ô kỹ năng, nút ----
    const btns = Object.entries(B).filter(([k]) => k !== "InputBack");
    const y0 = Math.min(M.bot.y, ...btns.map(([, b]) => b.y));
    const bot = document.createElement("div");
    bot.className = "jx-bot";
    bot.style.cssText = css({ width: F.w, height: F.h - y0, "background-image": `url(${BASE}${M.bot.file})`, "background-position": `0 ${M.bot.y - y0}px` });
    const Y = (r) => ({ ...r, y: r.y - y0 });
    const ib = B.InputBack, inp = M.input;
    let html = "";
    html += `<div class="jx-inback" style="${css({ left: ib.x, top: ib.y - y0, width: ib.w, height: ib.h, "background-image": `url(${BASE}${ib.file})` })}"></div>` +
      `<input class="jx-input" maxlength="${inp.max || 80}" spellcheck="false" style="${css({ left: inp.x, top: inp.y - y0, width: inp.w, height: inp.h, color: `rgb(${inp.color})` })}">` +
      at(Y({ ...M.channel, w: 20, h: 20 }), "jx-chbtn", "");
    M.items.forEach((r, i) => (html += at(Y(r), "jx-slot", "", {}, ` data-slot="${i}"`)));
    for (const side of ["left", "right"]) html += at(Y(M.skills[side]), "jx-slot jx-skill", "", {}, ` data-skill="${side}"`);
    const CHAT_SVG = '<svg class="vl-chat-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 4.5h13.6a2.7 2.7 0 0 1 2.7 2.7v7.6a2.7 2.7 0 0 1-2.7 2.7H11l-4.6 3.1c-.5.35-1.2 0-1.2-.6v-2.5A2.7 2.7 0 0 1 2.5 14.8V7.2a2.7 2.7 0 0 1 2.7-2.7Z" fill="rgba(255,222,128,0.16)" stroke="#f6d884" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.6" cy="11" r="1.25" fill="#fff2c2"/><circle cx="12" cy="11" r="1.25" fill="#fff2c2"/><circle cx="15.4" cy="11" r="1.25" fill="#fff2c2"/></svg>';
    for (const [k, b] of btns) html += `<div class="jx-btn" data-k="${k}" title="${esc(b.tip)}" style="${css({ left: b.x, top: b.y - y0, width: b.w, height: b.h, ...img(b, b.up) })}">${k === "ChatRoom" ? CHAT_SVG : ""}</div>`;
    // trung tâm tin hệ thống (client 系统消息.ini KUiSysMsgCentre: biểu tượng [MsgIcon_*] 24 × 24 ở mép phải, dòng chữ [MsgText] bên trái — anh 06/11
    // chiều "cái icon này bỏ góc này đi em", mũi tên trong ảnh: từ cuối dòng ô tin hệ thống sang góc phải dưới, ngay trên nút Bảo vật): biểu tượng
    // 组队 (moiDoi) + bảng dòng lời mời bên trái biểu tượng, đáy ngang đáy biểu tượng (bấm biểu tượng: hiện / ẩn — moiIcon)
    const MK = B.Market, TIN = { x: MK ? Math.round(MK.x + MK.w / 2 - 12) : 902, y: MK ? MK.y - 30 : 650, w: 24, h: 24 };
    html += at(Y(TIN), "jx-tinic", "<b></b>", { "background-image": `url(${BASE}btn/tin_doi.png)` }, ' title="Lời mời tổ đội / bang hội — bấm để xem, trả lời"');
    html += `<div class="jx-moip" style="${css({ right: F.w - TIN.x - 4, bottom: F.h - TIN.y - TIN.h })}"></div>`;
    bot.innerHTML = html;
    // ---- hàng biểu tượng trạng thái: dán góc trái trên (ảnh client anh gửi 27/10: sát mép trái, ngay dưới dải trên) ----
    const sb = document.createElement("div");
    sb.className = "jx-stbar";
    // ---- bảng nhiệm vụ: góc trái, dưới hàng biểu tượng trạng thái (anh 28/10) ----
    const nv = document.createElement("div");
    nv.className = "jx-nvbang";
    nv.innerHTML = `<div class="jx-nv-dau"><span>Nhiệm vụ</span><i class="jx-nv-nut"></i></div><div class="jx-nv-than"></div>`;
    // ---- bảng đội ngũ: góc trái, dưới hàng biểu tượng trạng thái, trên bảng nhiệm vụ (anh 29/10 — setDoi) ----
    const doi = document.createElement("div");
    doi.className = "jx-doi";
    doi.onclick = (e) => { if (e.target.closest(".jx-doi-tv") && this.cb.onDoi) this.cb.onDoi(); };
    root.append(top, bot, chat, mm, sb, doi, nv);
    parent.appendChild(root);
    this.el = root; this.top = top; this.bot = bot; this.chatBox = chat; this.mm = mm; this.stBar = sb; this.nvBang = nv; this.doiBang = doi;
    this._nvBang(nv);

    // ---- nút: khung Up / Over / Down theo ini; nút bật / tắt giữ khung Down khi bật ----
    const wire = (el, b, key, onClick) => {
      const frame = (f) => (el.style.backgroundPositionX = `${-(f ?? b.up) * b.w}px`);
      const rest = () => { const on = !!(b.check && this.toggles[key]); frame(on ? b.down : b.up); el.classList.add("is-on-managed"); el.classList.toggle("is-on", on); };
      rest();
      el.onmouseenter = () => b.over != null && !(b.check && this.toggles[key]) && frame(b.over);
      el.onmouseleave = rest;
      el.onmousedown = (e) => { e.preventDefault(); b.down != null && frame(b.down); };
      el.onmouseup = rest;
      el.onclick = () => { if (b.check) { this.toggles[key] = !this.toggles[key]; rest(); } onClick(this.toggles[key]); };
      el._rest = rest;
    };
    bot.querySelectorAll(".jx-slot[data-slot]").forEach((el) => {
      const i = +el.dataset.slot;
      el.onclick = (e) => cb.onSlot && cb.onSlot(i, e);
      el.onpointerdown = (e) => cb.onSlotDown && cb.onSlotDown(i, e);
      el.oncontextmenu = (e) => { e.preventDefault(); if (cb.onSlotMenu) cb.onSlotMenu(i, e); };
      el.onmousemove = (e) => cb.onSlotTip && cb.onSlotTip(i, e);
      el.onmouseleave = () => cb.onSlotTip && cb.onSlotTip(-1);
    });
    bot.querySelectorAll(".jx-skill[data-skill]").forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); if (cb.onSkillTip) cb.onSkillTip(null); if (cb.onSkillSlot) cb.onSkillSlot(el.dataset.skill, el); };
      el.oncontextmenu = (e) => { e.preventDefault(); el.onclick(e); };
      el.onmousemove = (e) => cb.onSkillTip && cb.onSkillTip(el.dataset.skill, e);
      el.onmouseleave = () => cb.onSkillTip && cb.onSkillTip(null);
    });
    bot.querySelectorAll(".jx-btn[data-k]").forEach((el) => { const k = el.dataset.k; wire(el, B[k], k, (on) => cb.onButton && cb.onButton(k, on)); });
    mm.querySelectorAll(".jx-mmbtn").forEach((el) => { const k = el.dataset.k; wire(el, MM.buttons[k], k, () => this._mmButton(k)); });
    chat.querySelectorAll(".jx-cbtn").forEach((el) => { const k = el.dataset.c; wire(el, S[k], "c_" + k, (on) => this._chatButton(k, on)); });
    // ô tin hệ thống dưới khung chat (SysRoom của client — anh 27/10: "vũ khí không phù hợp, lên ngựa không đánh được, nội lực không đủ thì ở
    // dưới"): câu cảnh báo (hud.canh) — mở sẵn, nút bật / tắt của client
    this.toggles.c_sysOpen = true; chat.querySelector('[data-c="sysOpen"]')._rest();
    chat.querySelector(".jx-sys").addEventListener("click", (e) => { const a = e.target.closest(".moi:not(.tat) a[data-v]"); if (a) this.moiChon(+a.parentNode.dataset.id, a.dataset.v); });
    // biểu tượng lời mời tổ đội (góc phải dưới): bấm -> hiện / ẩn dòng lời mời bên trái (cb.onMoi(null, null): chỉ tiếng bấm); chữ trong dòng -> trả lời
    bot.querySelector(".jx-tinic").onclick = (e) => { e.stopPropagation(); this.moiIcon(); if (this.cb.onMoi) this.cb.onMoi(null, null); };
    bot.querySelector(".jx-moip").addEventListener("click", (e) => { e.stopPropagation(); const a = e.target.closest(".moi a[data-v]"); if (a) this.moiChon(+a.parentNode.dataset.id, a.dataset.v); });
    this._keoChat(chat);

    // ---- chat ----
    const input = bot.querySelector(".jx-input"), back = bot.querySelector(".jx-inback");
    input.onfocus = () => (back.style.backgroundPositionX = `${-ib.w}px`);
    input.onblur = () => (back.style.backgroundPositionX = "0px");
    input.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { this.send(); input.blur(); }
      if (e.key === "Escape") input.blur();
    };
    chat.querySelectorAll(".jx-tab").forEach((el) => (el.onclick = () => { this.tab = el.dataset.t; this._renderChat(); this._veGhim(); })); // thẻ Bang hội: ghim công cáo (ghimTab)
    bot.querySelector(".jx-chbtn").onclick = () => this._channelMenu();
    chat.querySelector(".jx-chat").onwheel = (e) => { e.currentTarget.scrollTop += e.deltaY; };
    // khoe đồ (anh 12/11 — main.js khoeDo): rê chuột (máy tính) / chạm (điện thoại — khung chat dienthoai.js cũng vẽ bằng chatHtml) chữ <tên đồ>
    // của tin -> ô xem món (cb.onKhoe); rời chữ -> ẩn
    let khoeDang = null;
    const khoeXem = (e, cham) => {
      const s = e.target && e.target.closest ? e.target.closest(".jx-khoe") : null, m = s && this.msgs.find((x) => x.kid === +s.dataset.kid);
      if (m && m.it) { khoeDang = s; if (this.cb.onKhoe) this.cb.onKhoe(m.it, e); if (cham) e.stopPropagation(); }
      else if (khoeDang && !cham) { khoeDang = null; if (this.cb.onKhoe) this.cb.onKhoe(null); }
    };
    addEventListener("mousemove", (e) => khoeXem(e, false), true);
    addEventListener("click", (e) => khoeXem(e, true), true);
    // nhắn tin mật (anh 13/11 "ctrl + click vào tên người đang rao để nhắn tin với họ"): Ctrl + bấm tên người nói ở khung chat; điện thoại (không có Ctrl):
    // chạm tên ở khung chat
    addEventListener("click", (e) => {
      const s = e.target && e.target.closest ? e.target.closest(".jx-ten") : null; if (!s) return;
      if (!e.ctrlKey && !document.body.classList.contains("dt")) return;
      e.stopPropagation(); e.preventDefault(); this.datMat(s.dataset.ten);
    }, true);
    this._setChannel(this.channel);
    this._renderChat();

    // ---- bản đồ nhỏ ----
    this.mmCv = mm.querySelector(".jx-mm canvas");
    this.mmCv.onclick = (e) => {
      if (!this.mmView) return;
      const r = this.mmCv.getBoundingClientRect(), k = this.mmCv.width / r.width;
      const px = (e.clientX - r.left) * k + this.mmView.x, py = (e.clientY - r.top) * k + this.mmView.y;
      cb.onMapClick && cb.onMapClick(px / MM.scale, py / MM.scale);
    };
    // bấm tên bãi: bản đồ lớn / nhỏ như phím Tab (anh 26/10: bỏ menu chọn bãi — đi bãi bằng Xa phu)
    const nameEl = mm.querySelector(".jx-mm-name");
    nameEl.onclick = () => this._mmButton("SwitchBtn");
    nameEl.title = "Bấm: bản đồ lớn / nhỏ (Tab)";
    // giữ chuột phải kéo: xem chỗ khác của bản đồ như client (Ba Lăng rộng) — khung đứng yên ở chỗ đã kéo; bấm chuột phải không kéo, phím
    // Tab hoặc đổi bản đồ thì về lại theo nhân vật. Bấm chuột trái vẫn là chạy tới chỗ bấm
    this.mmCv.oncontextmenu = (e) => e.preventDefault();
    this.mmCv.onpointerdown = (e) => {
      if (e.button !== 2 || !this.mmView) return;
      e.preventDefault(); e.stopPropagation();
      const r = this.mmCv.getBoundingClientRect(), k = this.mmCv.width / r.width, x0 = e.clientX, y0 = e.clientY, v0 = { ...this.mmView };
      let moved = false;
      const mv = (ev) => {
        const dx = (ev.clientX - x0) * k, dy = (ev.clientY - y0) * k;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        if (moved) this.mmFree = { x: v0.x - dx, y: v0.y - dy };
      };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); if (!moved) this.mmFree = null; };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
    };
    const posEl = mm.querySelector(".jx-mm-pos"), posIn = mm.querySelector(".jx-mm-input");
    posEl.onclick = () => { posIn.style.display = "block"; posIn.value = ""; posIn.placeholder = posEl.textContent; posIn.focus(); };
    posIn.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { const m = /^\s*(\d+)\s*[\/ ,.]\s*(\d+)\s*$/.exec(posIn.value); if (m && cb.onGoto) cb.onGoto(+m[1], +m[2]); else if (posIn.value.trim()) this.msg("Tọa độ ghi dạng 200/200"); hidePos(); }
      if (e.key === "Escape") hidePos();
    };
    // ẩn ngay (không đợi mất focus — trang ẩn / chưa focus được thì sự kiện blur không tới)
    const hidePos = () => { posIn.style.display = "none"; posIn.blur(); };
    posIn.onblur = hidePos;
    mm.querySelector(".jx-auto").onclick = () => cb.onButton && cb.onButton("Auto");
    const tt = (this.ttBtn = mm.querySelector(".jx-ttbtn"));
    tt.onmousedown = (e) => { e.preventDefault(); tt.style.backgroundPosition = "-23px 0"; };
    tt.onmouseleave = tt.onmouseup = () => this.setTroThu(this.ttOpen);
    tt.onclick = () => cb.onButton && cb.onButton("TroThu");
    tt.oncontextmenu = (e) => { e.preventDefault(); if (cb.onButton) cb.onButton("Auto"); };
    const lp = mm.querySelector(".jx-lpbtn");
    lp.onmousedown = (e) => { e.preventDefault(); lp.style.backgroundPosition = "-23px 0"; };
    lp.onmouseleave = lp.onmouseup = () => { lp.style.backgroundPosition = "0 0"; };
    lp.onclick = () => cb.onButton && cb.onButton("NhanThuong");
    const hd = (this.hdBtn = mm.querySelector(".jx-hdbtn"));
    hd.onmousedown = (e) => { e.preventDefault(); hd.style.backgroundPosition = "-25px 0"; };
    hd.onmouseleave = hd.onmouseup = () => this.setHuongDan(this.hdOpen);
    hd.onclick = () => cb.onButton && cb.onButton("HuongDan");
    // Phân Thân (anh 05/11): 3 khung — 0 thường, 1 rê / nhấn / khung đang mở
    const ptb = (this.ptBtn = mm.querySelector(".jx-ptbtn"));
    ptb.onmousedown = (e) => { e.preventDefault(); ptb.style.backgroundPosition = "-23px 0"; };
    ptb.onmouseenter = () => { ptb.style.backgroundPosition = "-23px 0"; };
    ptb.onmouseleave = ptb.onmouseup = () => this.setPhanThan(this.ptOpen);
    ptb.onclick = () => cb.onButton && cb.onButton("PhanThan");
    mm.querySelector(".jx-zlbtn").onclick = () => cb.onButton && cb.onButton("NhomZalo");
    for (const s of [".jx-bcbtn", ".jx-bcchu"]) mm.querySelector(s).onclick = () => cb.onButton && cb.onButton("BauCua");
    const kat = (this.katBtn = mm.querySelector(".jx-katbtn"));
    kat.onmouseenter = () => { kat.style.backgroundPosition = "-19px 0"; };
    kat.onmouseleave = () => { kat.style.backgroundPosition = "0 0"; };
    kat.onmousedown = (e) => e.preventDefault();
    kat.onclick = () => cb.onButton && cb.onButton("KhoaAnToan");
    this.setKhoaAnToan(this.katTt || { co: 0, mo: 0 });

    this.layout();
    addEventListener("resize", () => this.layout());
    return this;
  }

  // 9 ô đồ của dải dưới (phím 1–9, client ShortcutUseItem): q = { ic, n, tu } | null
  setQuick(list) {
    const sig = JSON.stringify(list);
    if (!this.bot || sig === this._qSig) return;
    this._qSig = sig;
    this.bot.querySelectorAll(".jx-slot[data-slot]").forEach((el) => {
      const q = list[+el.dataset.slot];
      el.innerHTML = q ? `<img class="jx-qi" src="assets/web/icon/${esc(q.ic)}" alt="" draggable="false">${q.skill ? "" : `<b class="jx-qn">${q.n}</b>`}${q.tu ? `<i class="jx-qa">${q.tu}%</i>` : ""}` : "";
      el.classList.toggle("empty", !!q && !q.skill && !q.n);
      el.classList.toggle("ky", !!(q && q.skill)); // ô đang là võ công (điện thoại ngang: hình cắt tròn — game.css)
    });
  }

  // 2 ô kỹ năng: icon chiêu đang chọn (chưa chọn: trống = đòn thường). Rê chuột: ô xem chiêu của game (cb.onSkillTip) — bản đầu là chữ
  // title của trình duyệt (anh 26/10 "hiển thị thông tin kĩ năng đồng bộ game")
  setSkills(o) {
    const sig = JSON.stringify(o);
    if (!this.bot || sig === this._sSig) return;
    this._sSig = sig;
    for (const side of ["left", "right"]) {
      const el = this.bot.querySelector(`.jx-skill[data-skill="${side}"]`), q = o[side]; if (!el) continue;
      el.innerHTML = q && q.ic ? `<img class="jx-qi" src="assets/web/icon/${esc(q.ic)}" alt="" draggable="false">` : "";
      if (q && q.tip) el.dataset.tip = q.tip; else delete el.dataset.tip; // ô T đang là đòn thường: chữ gợi ý (windows.js _tipChu)
    }
  }

  // lớp hồi chiêu trên ô có võ công (anh 26/10: Đoạn Hồn Thích có hồi chiêu mà người chơi không biết): c = { left, right, slots: [× 9] },
  // mỗi ô { k: phần còn lại 0..1, s: giây còn } | null — quạt tối quét theo chiều kim đồng hồ + số giây. Gọi mỗi khung (main.js hud)
  setCooldowns(c) {
    if (!this.bot) return;
    const put = (el, v) => {
      if (!el) return;
      let o = el.querySelector(".jx-cd");
      if (!v) { if (o) o.remove(); return; }
      if (!o) { o = document.createElement("i"); o.className = "jx-cd"; el.appendChild(o); }
      o.style.background = `conic-gradient(rgba(0,0,0,.62) ${(v.k * 360).toFixed(1)}deg, rgba(0,0,0,0) 0)`;
      const t = v.s >= 10 ? String(Math.ceil(v.s)) : v.s.toFixed(1);
      if (o.textContent !== t) o.textContent = t;
    };
    put(this.bot.querySelector('.jx-skill[data-skill="left"]'), c.left);
    put(this.bot.querySelector('.jx-skill[data-skill="right"]'), c.right);
    this.bot.querySelectorAll(".jx-slot[data-slot]").forEach((el) => put(el, (c.slots || [])[+el.dataset.slot]));
  }

  // ---------- ô chữ góc trái dải trên (mục DateTime của client) ----------
  // Lần lượt mỗi 3 giây: chữ logo · ngày giờ · máy chủ · số người trực tuyến · mạng (anh muốn 23/10). get() -> { server, online,
  // ping (ms | null) }. Mạng theo ngưỡng client: < SmoothPing "Hoạt động tốt", < CrowdPing "Quá đông người", còn lại "Bị gián đoạn".
  // Rê chuột: màu OverColor + chú thích của client; bấm: sang chữ kế.
  setInfo(get) {
    this.info = get; this.infoI = 0; this.infoAt = 0;
    const el = this.top.querySelector(".jx-logo"), L = this.M.logo;
    el.title = L.tip;
    el.onmouseenter = () => { this.infoOver = true; this.tickInfo(performance.now(), true); };
    el.onmouseleave = () => { this.infoOver = false; this.tickInfo(performance.now(), true); };
    el.onmousedown = () => (el.style.color = rgb(L.sel));
    el.onclick = () => { this.infoI++; this.infoAt = performance.now(); this.tickInfo(this.infoAt, true); };
  }
  netState(ms) { const N = this.M.logo.net; return ms == null ? N[N.length - 1] : N.find((n) => n.ping != null && ms < n.ping) || N[N.length - 1]; }
  tickInfo(now, force) {
    if (!this.el || !this.info) return;
    if (now - this.infoAt >= 3000) { this.infoI++; this.infoAt = now; force = true; }
    if (!force && now - (this.infoDrawn || 0) < 500) return;
    this.infoDrawn = now;
    const L = this.M.logo, s = this.info(), d = new Date(), z = (n) => String(n).padStart(2, "0");
    const net = this.netState(s.ping);
    const items = [
      [L.text, L.color],
      [`${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())} ${z(d.getDate())}-${z(d.getMonth() + 1)}-${d.getFullYear()}`, L.color],
      [s.server, L.color],
      [`Trực tuyến: ${s.online}`, L.color],
      [s.ping == null ? net.msg : `${net.msg} ${Math.round(s.ping)} ms`, net.color],
      // da an chu ky goc man hinh trong game
    ];
    const [t, c] = items[this.infoI % items.length], el = this.top.querySelector(".jx-logo");
    if (force && (!s.ky || ((kyChuan() ^ 0x5a5a1234) >>> 0) !== 1475302667)) voKy("dải trên");
    if (el.textContent !== t) el.textContent = t;
    el.style.color = rgb(this.infoOver ? L.over : c);
  }

  // con trỏ chuột của client (ui\ui3\公共.ini CursorList: 0 thường, 1 tấn công, 2 nói chuyện NPC, 3 nhặt đồ…) -> giá trị CSS cursor
  // đường dẫn đầy đủ: url() trong biến CSS được tính theo file CSS dùng biến đó (src/game/game.css), không theo trang
  cursorCss(i) { const c = (this.M.cursors || [])[i] || (this.M.cursors || [])[0]; return c ? `url("${new URL(BASE + c.file, location.href).href}") ${c.hx} ${c.hy}, auto` : "auto"; }
  // phím Del của client (ClearMessage): xóa tin trong khung chat
  clearChat() { this.msgs = []; this._renderChat(); }

  setToggle(k, on) { this.toggles[k] = on; const el = this.el.querySelector(`[data-k="${k}"]`); if (el && el._rest) el._rest(); }
  // hàng biểu tượng trạng thái (xem đầu file). Chỉ dựng lại khi danh sách / chữ thời gian đổi
  setStates(list) {
    if (!this.stBar) return;
    // ≥ 1 ngày: "13n" (anh 16/11 — Nhất Kỷ / Càn khôn 14 ngày: "335h" dài quá ô 24 điểm, chữ 2 biểu tượng dính nhau)
    const gio = (t) => (t == null ? "" : t >= 86400 ? Math.floor(t / 86400) + "n" : t >= 3600 ? Math.floor(t / 3600) + "h" : t >= 60 ? Math.floor(t / 60) + "m" : Math.max(0, Math.ceil(t)) + "s");
    const L = list.slice(0, 20).map((s) => [s.img, gio(s.t), s.n, s.d, s.xau ? 1 : s.hoi ? 2 : 0]), sig = JSON.stringify(L); // 2: chiêu tự phát đang hồi (anh 17/11 — hình xám)
    if (sig === this._stSig) return;
    this._stSig = sig;
    this.stBar.innerHTML = L.map(([img, g, n, d, xau], i) => `<div class="jx-st${xau === 1 ? " xau" : xau === 2 ? " hoi" : ""}" data-tip="${esc(`<color=Yellow>${n}<color>` + (d ? "\n" + d : ""))}" style="${css({ left: (i % 10) * 24, top: Math.floor(i / 10) * 36 })}"><img src="assets/ui/${img}" alt=""><span>${g}</span></div>`).join("");
  }
  // ---------- bảng nhiệm vụ góc trái ----------
  _nvBang(nv) {
    let gon = false;
    try { gon = localStorage.getItem("vl_nvGon") === "1"; } catch {}
    const nut = nv.querySelector(".jx-nv-nut"), dau = nv.querySelector(".jx-nv-dau");
    const ve = (f) => { nut.style.backgroundImage = `url(${BASE}btn/${this.nvGon ? "sys_down" : "sys_up"}.png)`; nut.style.backgroundPosition = `${-15 * f}px 0`; };
    const dat = (g) => { this.nvGon = g; nv.classList.toggle("gon", g); dau.dataset.tip = g ? "Bấm: mở rộng bảng nhiệm vụ" : "Bấm: thu gọn bảng nhiệm vụ"; ve(0); try { localStorage.setItem("vl_nvGon", g ? "1" : "0"); } catch {} this._nvCao(); };
    dau.onmouseenter = () => ve(2); dau.onmouseleave = () => ve(0);
    dau.onmousedown = (e) => { e.preventDefault(); ve(1); };
    dau.onclick = () => dat(!this.nvGon);
    const than = nv.querySelector(".jx-nv-than");
    than.onclick = (e) => { const k = e.target.closest("[data-k]"); if (k && this.cb.onNhiemVu) this.cb.onNhiemVu(k.dataset.k); };
    than.onwheel = (e) => { than.scrollTop += e.deltaY; e.stopPropagation(); };
    dat(gon);
  }
  // chỗ đứng các bảng bên trái: hàng biểu tượng trạng thái dưới dải trên; bảng đội ngũ + bảng nhiệm vụ dưới 2 hàng biểu tượng (bảng đo sát thương
  // của mộc nhân — mocnhan.js, góc trái trên — đang mở thì xuống dưới bảng đó). Bảng đã kéo chỗ khác (bố cục — keoBang) đứng theo chỗ đã kéo,
  // bảng còn lại xếp như trên. Chiều cao tối đa bảng nhiệm vụ: tới đỉnh khung chat (khung chat kéo cao được) nếu khung chat nằm dưới bảng, không
  // thì tới đáy màn hình; ít nhất 160
  _nvCao() {
    const nv = this.nvBang; if (!nv || !this.chatBox) return;
    const s = this._tiLe(), bc = this.bc || {}, mn = document.querySelector(".mn"), d = this.doiBang;
    const dat = (el, c, top) => { if (c) return this._dat(el, c, s); el.style.left = ""; el.style.top = top; };
    dat(this.stBar, bc.st, 28 + (this.lech || 0) + "px");
    if (mn) dat(mn, bc.mn, "");
    let y = 28 + (this.lech || 0) + (bc.st ? 4 : 76 * s);
    if (mn && !bc.mn && (mn.classList.contains("on") || mn.classList.contains("bc-keo"))) y = Math.max(y, mn.getBoundingClientRect().bottom + 6);
    // bảng đội ngũ (có đội) nằm ngay dưới, bảng nhiệm vụ xuống dưới nó
    if (d) { dat(d, bc.doi, Math.round(y) + "px"); if (!bc.doi && (d.classList.contains("on") || d.classList.contains("bc-keo"))) y += d.offsetHeight * s + 4; }
    dat(nv, bc.nv, Math.round(y) + "px");
    const r = nv.getBoundingClientRect(), c = this.chatBox.getBoundingClientRect(), day = r.left < c.right && r.top < c.top ? c.top : innerHeight;
    nv.querySelector(".jx-nv-than").style.maxHeight = Math.max(160, (day - r.top) / s - 18 - 6) + "px"; // khung chat kéo quá cao: vẫn chừa 160 (đè phần trống trên khung chat)
  }
  setNhiemVu(nhom) {
    if (!this.nvBang) return;
    const sig = JSON.stringify(nhom);
    if (sig === this._nvSig) return this._nvCao();
    this._nvSig = sig;
    const doan = ([t, mau, k]) => `<span${k ? ` class="bam" data-k="${esc(k)}"` : ""}${mau ? ` style="color:${rgb(mau)}"` : ""}>${esc(t)}</span>`;
    this.nvBang.querySelector(".jx-nv-than").innerHTML = nhom.length ? nhom.map((g) => `<div class="jx-nv-nhom">${esc(g.ten)}</div>` + g.muc.map((m) =>
      `<div class="jx-nv-muc"><div class="jx-nv-ten">${esc(m.ten)}${m.phu ? ` <span>${esc(m.phu)}</span>` : ""}</div>` +
      m.dong.map((d) => `<div class="jx-nv-dong">${d.map(doan).join("")}</div>`).join("") + "</div>").join("")).join("")
      : `<div class="jx-nv-dong trong">Chưa nhận nhiệm vụ nào</div>`;
    this._nvCao();
  }
  setTroThu(open) { this.ttOpen = !!open; if (this.ttBtn) this.ttBtn.style.backgroundPosition = open ? "-23px 0" : "0 0"; }
  setHuongDan(open) { this.hdOpen = !!open; if (this.hdBtn) this.hdBtn.style.backgroundPosition = open ? "-25px 0" : "0 0"; }
  chamHuongDan(co) { if (this.hdBtn) this.hdBtn.classList.toggle("co-moi", !!co); }
  // ô 4 cột icon: Phân Thân (anh 05/11) — khung đang mở: khung 1 (sáng)
  setPhanThan(open) { this.ptOpen = !!open; if (this.ptBtn) this.ptBtn.style.backgroundPosition = open ? "-23px 0" : "0 0"; }
  // biểu tượng Bầu Cua (anh 10/11 lần 3 "icon đặt mọi nơi" — nhịp "bcua", may-chu/bau-cua.js nhipCon): ô 6 cột icon + chữ đếm ngược; ngoài giờ ẩn
  setBauCua(s) {
    const b = this.mm && this.mm.querySelector(".jx-bcbtn"), c = this.mm && this.mm.querySelector(".jx-bcchu"); if (!b || !c) return;
    b.classList.toggle("hien", !!s); c.classList.toggle("hien", !!s); c.classList.toggle("dat", !!s && s.p === "dat");
    const chu = bauCuaChu(s); if (c.textContent !== chu) c.textContent = chu;
  }
  // ổ khóa an toàn (anh 10/11 — main.js KAT onDoi, nhịp km): { co: đã có mật khẩu cấp 2, mo: trang này đang mở } -> hình khóa / mở + chữ rê chuột
  setKhoaAnToan(tt) {
    this.katTt = tt; const b = this.katBtn; if (!b || !tt) return;
    const dong = !!(tt.co && !tt.mo);
    b.style.backgroundImage = `url(${BASE}btn/${dong ? "khoa_dong" : "khoa_mo"}.png)`;
    b.classList.toggle("co-moi", !tt.co);
    b.title = !tt.co ? "Khóa an toàn — chưa đặt mật khẩu cấp 2\nBấm để đặt: bảo vệ giao dịch, bày bán / mua ở Chợ Trời, vứt đồ, hủy vật phẩm, xóa nhân vật"
      : dong ? "Khóa an toàn — đang khóa\nBấm để mở khóa hoặc đổi mật khẩu" : "Khóa an toàn — đang mở (tới khi thoát game hoặc tải lại trang)\nBấm để khóa lại hoặc đổi mật khẩu";
  }
  // dòng đếm giờ trên thuyền Phong Lăng Độ (main.js pldTick — anh 27/10): giữa phía trên màn hình như dòng tin chạy của client
  // (新闻消息来了.ini: rộng 400, chữ cỡ 14 màu 255,253,122, nền bóng đen độ trong 80); text null = ẩn
  setThuyen(text) {
    if (!this.el) return;
    let d = this.el.querySelector(".jx-thuyen");
    if (!d) { d = document.createElement("div"); d.className = "jx-thuyen"; this.el.appendChild(d); }
    this.thuyenOn = !!text;
    d.style.display = text ? "" : "none";
    if (text && typeof text === "string" && this.thuyenThem) text += this.thuyenThem; // Cuồng nộ liên kích (cuongno.js — anh 18/11)
    if (text && d.textContent !== text) d.textContent = text;
  }
  // số phần thưởng đang chờ nhận trên nút Nhận thưởng (anh 03/11 chọn "chấm đỏ có số" — main.js capNhatThuong): như số đỏ thẻ điện thoại; 0 = ẩn
  datThuong(n) {
    const b = this.mm && this.mm.querySelector(".jx-lpbtn"); if (!b) return;
    let s = b.querySelector(".jx-ntso");
    if (!s) { s = document.createElement("b"); s.className = "jx-ntso"; b.appendChild(s); }
    s.textContent = n > 0 ? String(n) : ""; s.style.display = n > 0 ? "" : "none";
    b.title = n > 0 ? `Nhận thưởng — ${n} phần thưởng chưa nhận` : "Đăng nhập nhận thưởng";
  }
  setAuto(on) { const el = this.mm.querySelector(".jx-auto"); el.textContent = "Tự đánh: " + (on ? "Bật" : "Tắt"); el.classList.toggle("off", !on); }

  // bảng đội ngũ (anh 29/10 "sau khi vào pt cần hiện bảng thông tin nhân vật trong team, tham khảo client"): client 队伍一览信息.ini — mỗi người
  // 1 ô 135 × 17, chữ cỡ 12 màu 165,255,203 canh giữa trên nền \spr\ui3\frame_member.spr (bản client này thiếu file hình -> khung tối viền
  // mảnh), client đặt ở (10, 36) — chỗ đó đã là hàng biểu tượng trạng thái nên xuống ngay dưới hàng đó. Thêm thanh sinh lực / nội lực mỏng
  // dưới tên. rows = [{ ten, truong, toi (là mình), xa (khác bản đồ / rời mạng — chữ xám, không thanh), hp, mp (%), tip }] | [] (ẩn)
  // Anh 29/10 lần 2 ("đội 8 người sẽ chèn mất thanh nhiệm vụ"): dòng đầu "Đội ngũ n / tối đa" thu gọn / mở như bảng nhiệm vụ (mũi tên sys_up /
  // sys_down của client, nhớ ở localStorage vl_doiGon); đội trên 4 người xếp 2 cột (mỗi ô 105) — 8 người chỉ 4 hàng. toiDa = số người tối đa.
  // Anh 29/10 lần 3 ("8 người 2 cột … thu gọn lại để khi full cũng đỡ rối"): thử mỗi người 1 dòng (sinh lực làm nền đỏ sau tên) — anh xem ảnh 2
  // kiểu rồi chọn lại kiểu này ("thanh máu với mana chọn style này đẹp rồi")
  setDoi(rows, toiDa) {
    const d = this.doiBang; if (!d) return;
    const sig = JSON.stringify([rows, toiDa]);
    if (sig === this._doiSig) return;
    this._doiSig = sig;
    const on = !!(rows && rows.length);
    d.classList.toggle("on", on);
    if (!on) { d.innerHTML = ""; return this._nvCao(); }
    if (this.doiGon == null) { try { this.doiGon = localStorage.getItem("vl_doiGon") === "1"; } catch { this.doiGon = false; } }
    d.classList.toggle("gon", this.doiGon); d.classList.toggle("hai", rows.length > 4);
    d.innerHTML = `<div class="jx-nv-dau jx-doi-dau" data-tip="${this.doiGon ? "Bấm: mở bảng đội ngũ" : "Bấm: thu gọn bảng đội ngũ"}"><span>Đội ngũ ${rows.length}${toiDa ? " / " + toiDa : ""}</span><i class="jx-nv-nut"></i></div>
      <div class="jx-doi-ds">${rows.map((r) => `<div class="jx-doi-tv${r.toi ? " toi" : ""}${r.xa ? " xa" : ""}" data-tip="${esc(r.tip)}">
      <div class="jx-doi-ten">${r.truong ? '<b class="jx-doi-truong">★</b> ' : ""}${esc(r.ten)}</div>${r.xa ? "" : `<div class="jx-doi-hp"><i style="width:${r.hp}%"></i></div><div class="jx-doi-mp"><i style="width:${r.mp}%"></i></div>`}</div>`).join("")}</div>`;
    const dau = d.querySelector(".jx-doi-dau"), nut = dau.querySelector(".jx-nv-nut");
    const ve = (f) => { nut.style.backgroundImage = `url(${BASE}btn/${this.doiGon ? "sys_down" : "sys_up"}.png)`; nut.style.backgroundPosition = `${-15 * f}px 0`; };
    dau.onmouseenter = () => ve(2); dau.onmouseleave = () => ve(0);
    dau.onmousedown = (e) => { e.preventDefault(); ve(1); };
    dau.onclick = (e) => { e.stopPropagation(); this.doiGon = !this.doiGon; try { localStorage.setItem("vl_doiGon", this.doiGon ? "1" : "0"); } catch {} this._doiSig = null; this.setDoi(rows, toiDa); };
    ve(0);
    this._nvCao();
  }
  // bộ đo FPS phải xuống dưới dải trên (main.js datFps — cửa sổ không phóng to): hàng biểu tượng trạng thái + bảng bên trái lùi xuống px
  datLech(px) { this.lech = px; this._nvCao(); }

  // ---------- bố cục: kéo thả bảng (anh 29/10 lần 3 "cho phép kéo thả các tab trên màn hình … lưu, lần sau vào lại acc đó lấy bố cục đó") ----------
  // Bảng kéo được: nhiệm vụ, đội ngũ, biểu tượng trạng thái, mộc nhân luyện công. bc = { khóa: [x, y, neo phải] } theo đơn vị khung 1024 (chia
  // tỉ lệ thu nhỏ s): x tính từ mép trái, hoặc từ mép phải khi bảng nằm nửa phải màn hình (đổi cỡ cửa sổ vẫn bám đúng mép); y từ mép trên.
  // Bảng không có trong bc xếp như cũ (_nvCao). Lưu theo nhân vật ở máy chủ: main.js boCuc -> hero.auto.boCuc
  _tiLe() { return Math.min(1, innerWidth / this.M.frame.w); }
  _bangKeo() {
    return [["nv", "Nhiệm vụ", this.nvBang], ["doi", "Đội ngũ", this.doiBang], ["st", "Biểu tượng trạng thái", this.stBar], ["mn", "Mộc nhân luyện công", document.querySelector(".mn")]].filter((b) => b[2]);
  }
  // đặt bảng el theo chỗ đã lưu c (giữ trong màn hình: ít nhất 24 điểm ảnh của bảng còn thấy theo chiều dọc)
  _dat(el, c, s) {
    const r = el.getBoundingClientRect(), x = c[2] ? innerWidth - c[0] * s - r.width : c[0] * s;
    el.style.left = Math.round(Math.max(0, Math.min(innerWidth - r.width, x))) + "px";
    el.style.top = Math.round(Math.max(0, Math.min(innerHeight - Math.min(r.height, 24), c[1] * s))) + "px";
  }
  // chỗ bảng el đang đứng -> [x, y, neo phải]
  _cho(el, s) {
    const r = el.getBoundingClientRect(), phai = r.left + r.width / 2 > innerWidth / 2 ? 1 : 0;
    return [Math.round((phai ? innerWidth - r.right : r.left) / s), Math.round(r.top / s), phai];
  }
  datBoCuc(bc) { this.bcLuu = JSON.stringify(bc || {}); this.bc = JSON.parse(this.bcLuu); this._nvCao(); }
  boCucNay() { return JSON.parse(JSON.stringify(this.bc || {})); }
  boCucDoi() { return JSON.stringify(this.bc || {}) !== (this.bcLuu || "{}"); }
  boCucMacDinh() { this.bc = {}; this._nvCao(); }
  // chế độ kéo thả: bảng hiện khung vàng nét đứt (bảng đang ẩn — chưa có đội, xa mộc nhân — cũng hiện để đặt chỗ), giữ chuột trái kéo; thanh
  // giữa trên màn hình: Lưu bố cục · Mặc định · Hủy -> cb.onBoCuc("luu" | "macDinh" | "huy")
  keoBang(on) {
    on = !!on;
    if (on === !!this.dangKeo || !this.el) return;
    this.dangKeo = on;
    if (on) {
      const bar = (this.bcBar = document.createElement("div"));
      bar.className = "jx-bcbar";
      bar.innerHTML = `<span>Giữ chuột trái kéo các bảng có khung vàng tới chỗ mới</span><b data-k="luu">Lưu bố cục</b><b data-k="macDinh">Mặc định</b><b data-k="huy">Hủy</b>`;
      bar.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b && this.cb.onBoCuc) this.cb.onBoCuc(b.dataset.k); };
      this.el.appendChild(bar);
      // khung kéo nằm trong bảng; bảng vẽ lại ruột (setDoi / setStates thay innerHTML) thì gắn lại
      const lap = () => { if (!this.dangKeo) return; for (const [k, ten, el] of this._bangKeo()) this._khungKeo(k, ten, el); this._bcLap = requestAnimationFrame(lap); };
      lap();
    } else {
      cancelAnimationFrame(this._bcLap);
      for (const [, , el] of this._bangKeo()) { el.classList.remove("bc-keo"); const v = el.querySelector(":scope > .bc-vien"); if (v) v.remove(); }
      if (this.bcBar) { this.bcBar.remove(); this.bcBar = null; }
    }
    this._nvCao();
  }
  _khungKeo(k, ten, el) {
    if (!el.classList.contains("bc-keo")) { el.classList.add("bc-keo"); this._nvCao(); }
    if (el.querySelector(":scope > .bc-vien")) return;
    const v = document.createElement("div");
    v.className = "bc-vien";
    v.innerHTML = `<span>${esc(ten)}</span>`;
    // kéo theo chuột cả trang (khung có thể bị vẽ lại giữa chừng — thanh máu đồng đội đổi)
    v.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const r0 = el.getBoundingClientRect(), dx = e.clientX - r0.left, dy = e.clientY - r0.top;
      const mv = (ev) => {
        const r = el.getBoundingClientRect();
        el.style.left = Math.round(Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx))) + "px";
        el.style.top = Math.round(Math.max(0, Math.min(innerHeight - Math.min(r.height, 24), ev.clientY - dy))) + "px";
        this.bc = { ...this.bc, [k]: this._cho(el, this._tiLe()) };
        this._nvCao();
      };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); document.body.classList.remove("bc-dang-keo"); };
      addEventListener("pointermove", mv); addEventListener("pointerup", up); addEventListener("pointercancel", up);
      document.body.classList.add("bc-dang-keo");
    };
    el.appendChild(v);
  }
  // cửa sổ hẹp hơn 1024 px: thu nhỏ cho vừa (2 dải căn giữa; bản đồ nhỏ dán góc phải trên, khung chat dán góc trái dưới)
  layout() {
    const s = Math.min(1, innerWidth / this.M.frame.w);
    this.top.style.transform = `translateX(-50%) scale(${s})`;
    this.bot.style.transform = `translateX(-50%) scale(${s})`;
    this.mm.style.transform = this.chatBox.style.transform = this.stBar.style.transform = this.nvBang.style.transform = this.doiBang.style.transform = `scale(${s})`;
    this._nvCao();
  }

  update(s) {
    if (!this.el) return; // chưa dựng (đồng hồ dự phòng có thể gọi trước khi vào game xong)
    const M = this.M, key = JSON.stringify(s);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.top.querySelector(".jx-lv").textContent = s.lvl;
    this.top.querySelector(".jx-rank").textContent = s.rank ?? "?";
    const vals = { stamina: [s.stamina, s.staminaMax], life: [s.life, s.lifeMax], mana: [s.mana, s.manaMax], exp: [s.exp, s.expMax] };
    this.top.querySelectorAll(".jx-bar").forEach((el, i) => {
      const k = M.bars[i].key, [v0, mx0] = vals[k];
      const v = Number.isFinite(+v0) ? +v0 : 0, mx = Number.isFinite(+mx0) && +mx0 > 0 ? +mx0 : 0;
      const rawR = mx > 0 ? v / mx : 0, r = Math.max(0, Math.min(1, rawR));
      let px = Math.round(r * M.bars[i].w);
      if (k === "exp" && v > 0 && px < 2) px = 2;
      el.firstChild.style.width = px + "px";
      if (k === "exp") {
        el.classList.toggle("am", v < 0);
        el.classList.toggle("co-exp", v > 0);
        el.lastChild.textContent = (rawR * 100).toFixed(2) + "%";
        el.title = `Kinh nghiệm: ${Math.round(v).toLocaleString("vi-VN")} / ${Math.round(mx).toLocaleString("vi-VN")} (${(rawR * 100).toFixed(2)}%)${v < 0 ? " — đang âm kinh nghiệm do tử vong" : ""}`;
      } else {
        el.lastChild.textContent = `${Math.ceil(v)}/${mx}`;
      }
    });
  }

  // ---------- chat ----------
  // Tin hệ thống: khung chat thẻ "Khác" (chữ vàng 255,249,148 — MsgColor của khung tin client; đang xem thẻ khác thì chữ thẻ "Khác" đổi màu
  // SpecialColor của client tới khi bấm xem) + sổ ở ô tin hệ thống dưới khung chat (giữ tối đa theo ini)
  // text: chuỗi | [[chữ, màu?], …] (màu [r, g, b] — tô từng đoạn: tên đồ theo màu tên vật client…); mau: màu cả dòng (mặc định màu tin client);
  // nhan: dòng nhận kinh nghiệm / tiền khi đánh quái, nhặt tiền — chỉ ở thẻ Khác (thông báo khác hiện cả ở Tất cả). Thẻ Khác đổi màu khi có
  // dòng mới mà thẻ đang xem không hiện
  msg(text, mau, nhan = false) {
    if (!this.el) return;
    const parts = Array.isArray(text) ? text : null;
    if (this.tab !== "Khác" && (this.tab !== "Tất cả" || nhan)) this.tinMoi = true;
    this.chat("TIN", "", parts ? parts.map(([t]) => t).join("") : text, false, { parts, mau, ...(nhan ? { nhan: 1 } : {}) });
  }
  // ghim của quản trị (anh 03/11 "làm 1 cái ghim cho admin, để gửi thông báo code hay gì mới" — chọn kiểu 1; main.js ghimNhan): dòng "[Ghim] …"
  // chữ vàng nền tối viền vàng ở đầu danh sách chat, danh sách chừa khoảng trên bằng dòng ghim; × = ẩn trên máy này tới khi có ghim mới
  // (localStorage vl_ghimAn = mã ghim). Điện thoại vẽ ở khung chat của nó (dienthoai.js _xepChat — ghimHien / anGhim)
  ghim(g) { this.ghimTin = g && g.t ? g : null; this._veGhim(); }
  ghimHien() {
    if (this.ghimAn == null) { try { this.ghimAn = localStorage.getItem("vl_ghimAn") || ""; } catch { this.ghimAn = ""; } }
    const g = this.ghimTin; return g && this.ghimAn !== String(g.id) ? g : null;
  }
  // công cáo bang hội (anh 14/11 — Bang hội đợt 1, main.js bhGhim): ghim đầu thẻ Bang hội của khung chat (thẻ khác: ghim của quản trị như cũ); × ẩn trên máy này tới
  // khi công cáo đổi (localStorage vl_ghimBhAn). g = { id, t } | null
  ghimBang(g) { this.ghimBh = g && g.t ? g : null; this._veGhim(); }
  // ghim hiện ở thẻ tab: { id, t, bh? } | null (điện thoại dùng chung — dienthoai.js _xepChat)
  ghimTab(tab = this.tab) {
    const g = this.ghimBh;
    if (tab === "Bang hội" && g) {
      if (this.ghimBhAn == null) { try { this.ghimBhAn = localStorage.getItem("vl_ghimBhAn") || ""; } catch { this.ghimBhAn = ""; } }
      if (this.ghimBhAn !== String(g.id)) return { ...g, bh: 1 };
    }
    return this.ghimHien();
  }
  // chữ 1 dòng của ghim công cáo: bỏ thẻ màu, nối các dòng, cắt 160 chữ
  ghimChu(g) { const t = String(g.t || "").replace(/<color(?:=[^>]*)?>/gi, "").replace(/\s*\r?\n\s*/g, " · ").trim(); return t.length > 160 ? t.slice(0, 159) + "…" : t; }
  anGhim(bh) {
    if (bh) { const g = this.ghimBh; if (!g) return; this.ghimBhAn = String(g.id); try { localStorage.setItem("vl_ghimBhAn", this.ghimBhAn); } catch {} return this._veGhim(); }
    const g = this.ghimTin; if (!g) return;
    this.ghimAn = String(g.id); try { localStorage.setItem("vl_ghimAn", this.ghimAn); } catch {}
    this._veGhim();
  }
  _veGhim() {
    const box = this.chatBox, L = box && box.querySelector(".jx-chat"); if (!L) return;
    const g = this.ghimTab(); let el = box.querySelector(".jx-ghim");
    if (!g) { if (el) el.remove(); L.style.paddingTop = ""; return; }
    if (!el) { el = document.createElement("div"); el.className = "jx-ghim"; el.addEventListener("click", (e) => { if (e.target.closest(".x")) this.anGhim(el.dataset.bh === "1"); }); box.appendChild(el); }
    el.dataset.bh = g.bh ? "1" : "";
    el.innerHTML = g.bh ? `<b>[Công cáo]</b> ${esc(this.ghimChu(g))}<span class="x" title="Ẩn công cáo bang hội (công cáo đổi thì hiện lại)">×</span>`
      : `<b>[Ghim]</b> ${esc(g.t)}<span class="x" title="Ẩn dòng ghim (có ghim mới thì hiện lại)">×</span>`;
    Object.assign(el.style, { left: L.style.left, top: L.style.top, width: L.style.width });
    L.style.paddingTop = el.offsetHeight + "px";
  }
  // câu cảnh báo (thiếu nội lực, sai vũ khí, đang cưỡi ngựa, không dùng được Thổ Địa Phù…): ô tin hệ thống dưới khung chat, chữ đỏ, giữ tối đa theo ini
  canh(text) {
    if (!this.el) return;
    const box = this.chatBox.querySelector(".jx-sys"), d = document.createElement("div");
    d.textContent = text; d.style.color = "rgb(255,112,96)";
    box.appendChild(d);
    while (box.children.length > this.M.chat.sys.max) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  // ---------- trung tâm tin hệ thống: lời mời tổ đội (client 系统消息.ini KUiSysMsgCentre + ô tin hệ thống HitText — anh 06/11 "làm thông báo pt
  // theo client, sau đó nếu người đã có pt rồi, tổ đội khác pt thì vẫn hiện lời mời dưới dạng icon, bấm vào sẽ ra thông tin") ----------
  // moiDoi(ds, coDoi): ds = lời mời còn chờ [{ id, tu, het }] — danh sách của máy chủ (nhịp, to-doi.js cua().moi) là gốc: lời mời mất khỏi danh
  // sách (đã trả lời / hết hạn) thì dòng thôi bấm được, biểu tượng ẩn khi hết lời mời. Lời mời mới: chưa ở đội ≥ 2 người -> thêm dòng "<tên> mời
  // bạn gia nhập nhóm của họ  Đồng ý  Cự tuyệt  Xem nhẹ" (câu client G_SysMsgCentre_0, G_ACCEPT / REFUSE / IGNORE_WORD) vào ô tin hệ thống; đang
  // ở đội: chỉ biểu tượng. Biểu tượng 组队 (góc phải dưới, trên nút Bảo vật) nhấp nháy (khung 0 ↔ 1) khi có lời mời chưa xem; ≥ 2 lời mời: số nhỏ.
  // Anh 06/11 chiều "giao diện lúc bấm vào để đồng ý hay từ chối em cũng học theo client đi, làm đơn giản chứ đừng mở hẳn 1 pop up … nếu anh muốn
  // đổi pt thì anh sẽ bấm vào và đồng ý": bấm biểu tượng -> hiện / ẩn các dòng lời mời ngay bên trái biểu tượng (.jx-moip, cùng chữ bấm như ô tin hệ
  // thống — không mở khung giữa màn hình). Bấm chữ -> cb.onMoi(m, v): "nhan" / "tuChoi" = trả lời (đang ở đội: Đồng ý là rời đội đang ở, vào đội
  // mới — máy chủ kiểm điều kiện trước); "Xem nhẹ" = bỏ ở máy này (không gửi gì — boMoi). Điện thoại vẽ bảng riêng từ moiTrangThai (dienthoai.js)
  moiDoi(ds, coDoi) {
    if (!this.el) return;
    const S = this._moi || (this._moi = { ds: [], bo: new Set(), da: new Set(), chuaXem: false, mo: false });
    const con = new Set(ds.map((m) => m.id));
    for (const id of [...S.da]) if (!con.has(id)) { S.da.delete(id); S.bo.delete(id); }
    for (const m of ds) if (!S.da.has(m.id)) {
      S.da.add(m.id); if (S.bo.has(m.id)) continue;
      if (!S.mo) S.chuaXem = true; // bảng dòng đang mở: lời mời mới hiện luôn trong bảng, không nhấp nháy
      if (!coDoi || m.bh) this._dongMoi(m); // lời mời vào bang (m.bh — anh 14/11): luôn có dòng ở ô tin hệ thống
    }
    S.ds = ds.filter((m) => !S.bo.has(m.id));
    this._veMoi();
  }
  // 1 dòng lời mời: tên + câu client + 3 chữ bấm (ô tin hệ thống và bảng cạnh biểu tượng dùng chung). Lời mời vào bang (m.bh = tên bang — anh 14/11, client không có câu
  // này: theo mẫu câu mời tổ đội client.txt:212)
  _chuMoi(m) { return `<div class="moi" data-id="${m.id}">${esc(m.tu)} ${m.bh != null ? `mời bạn gia nhập bang hội <span class="bh">${esc(m.bh)}</span>` : "mời bạn gia nhập nhóm của họ"} <a data-v="nhan">Đồng ý</a> <a data-v="tuChoi">Cự tuyệt</a> <a data-v="an">Xem nhẹ</a></div>`; }
  _dongMoi(m) {
    const box = this.chatBox.querySelector(".jx-sys");
    box.insertAdjacentHTML("beforeend", this._chuMoi(m));
    while (box.children.length > this.M.chat.sys.max) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  // bấm chữ trong dòng (máy tính: ô tin hệ thống / bảng cạnh biểu tượng; điện thoại: nút của bảng — dienthoai.js)
  moiChon(id, v) {
    const m = ((this._moi || {}).ds || []).find((x) => x.id === id); if (!m) return;
    if (v === "an") { if (this.cb.onMoi) this.cb.onMoi(null, null); return this.boMoi(id); }
    if (this.cb.onMoi) this.cb.onMoi(m, v);
  }
  // bỏ lời mời ở máy này (Xem nhẹ / đã trả lời): dòng thôi bấm được, bớt khỏi biểu tượng + bảng
  boMoi(id) {
    const S = this._moi; if (!S) return;
    S.bo.add(id); S.ds = S.ds.filter((m) => m.id !== id);
    this._veMoi();
  }
  // bấm biểu tượng (điện thoại: nút — dienthoai.js): hiện / ẩn bảng dòng lời mời, thôi nhấp nháy
  moiIcon() {
    const S = this._moi; if (!S || !S.ds.length) return;
    S.mo = !S.mo; S.chuaXem = false; this._veMoi();
  }
  moiTrangThai() { const S = this._moi, n = S ? S.ds.length : 0; return { n, nhay: !!S && S.chuaXem && n > 0, mo: !!S && S.mo && n > 0, ds: S ? S.ds : [] }; }
  moiCon(id) { const S = this._moi; return !!S && S.ds.some((m) => m.id === id); } // lời mời còn chờ (chưa trả lời / chưa hết hạn / chưa Xem nhẹ)
  _veMoi() {
    const S = this._moi, n = S.ds.length, ic = this.bot.querySelector(".jx-tinic"), p = this.bot.querySelector(".jx-moip");
    if (!n) { S.chuaXem = false; S.mo = false; }
    ic.classList.toggle("hien", n > 0); ic.classList.toggle("nhay", S.chuaXem);
    ic.firstChild.textContent = n > 1 ? n : "";
    const sig = S.mo ? S.ds.map((m) => m.id).join(",") : ""; // vẽ lại bảng chỉ khi đổi danh sách (nhịp gọi mỗi giây — giữ chữ đang rê chuột)
    if (p.dataset.sig !== sig) { p.dataset.sig = sig; p.innerHTML = sig ? S.ds.map((m) => this._chuMoi(m)).join("") : ""; p.classList.toggle("hien", !!sig); }
    this.chatBox.querySelectorAll(".jx-sys .moi:not(.tat)").forEach((d) => { if (!S.ds.some((m) => m.id === +d.dataset.id)) d.classList.add("tat"); });
  }
  // kéo mẩu trên cùng của dải trái lên / xuống: danh sách chat cao thêm về phía trên (client 消息集合面板_左.ini SizeUp, WindowRange 26–640 —
  // đỉnh khung tới y 26); các phần dưới (thẻ, ô tin hệ thống, nút) giữ chỗ. Nhớ chiều cao ở máy này (localStorage)
  _keoChat(chat) {
    const C = this.M.chat;
    const H0 = parseFloat(chat.style.height), maxCao = Math.max(0, C.list.y - 26);
    const ve = (cao) => {
      this.chatCao = cao = Math.max(0, Math.min(maxCao, Math.round(cao)));
      chat.style.height = H0 + cao + "px";
      for (const el of chat.children) {
        if (el.classList.contains("jx-ghim")) continue; // dòng ghim: theo đỉnh danh sách (_veGhim)
        if (el._y0 == null) { el._y0 = parseFloat(el.style.top) || 0; el._h0 = parseFloat(el.style.height) || 0; }
        const s = el.dataset.s, list = el.classList.contains("jx-chat");
        el.style.top = (list || s === "top" ? el._y0 : s === "mid" ? el._y0 : el._y0 + cao) + "px";
        if (list || s === "mid") el.style.height = el._h0 + cao + "px";
      }
      this._veGhim();
      const box = chat.querySelector(".jx-chat"); box.scrollTop = box.scrollHeight;
    };
    let cao0 = 0; try { cao0 = +localStorage.getItem("vl_chatCao") || 0; } catch {}
    ve(cao0);
    const top = chat.querySelector('[data-s="top"]'); if (!top) return;
    top.style.cursor = "ns-resize";
    top.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      const y0 = e.clientY, c0 = this.chatCao || 0, sc = chat.getBoundingClientRect().height / chat.offsetHeight || 1;
      const mv = (ev) => ve(c0 + (y0 - ev.clientY) / sc);
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); try { localStorage.setItem("vl_chatCao", String(this.chatCao || 0)); } catch {} };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
    });
  }
  // Tin chat theo kênh (CH_NEARBY, CH_TEAM, CH_WORLD, …, PRIVATE): biểu tượng kênh + tên + chữ, màu / viền của kênh
  chat(ch, name, text, self = false, them = null) { // them: { parts, mau, nhan } của thông báo (msg); { it, itMau } của tin khoe đồ
    const moi = { ch, name, text, self, ...(them || {}) };
    if (moi.it) moi.kid = this._kid = (this._kid || 0) + 1; // tin khoe đồ: mã để chữ <tên đồ> tìm lại món (mount — khoeXem)
    this.msgs.push(moi);
    // tin chat, thông báo (TIN) và dòng nhận kinh nghiệm / tiền (TIN nhan) giữ riêng mỗi loại tối đa list.max dòng — dòng nhận dồn dập khi đánh
    // quái không đẩy mất thông báo nhặt đồ / tin chat
    const loai = (m) => (m.ch === "TIN" ? (m.nhan ? 2 : 1) : 0), cung = this.msgs.filter((m) => loai(m) === loai(moi));
    if (cung.length > this.M.chat.list.max) this.msgs.splice(this.msgs.indexOf(cung[0]), 1);
    this._renderChat();
  }
  send() {
    const input = this.bot.querySelector(".jx-input"), t = input.value.trim();
    if (!t) return;
    const c = this.M.chat.channels[this.channel] || { menu: "Mật", interval: 0, num: 0 }, now = performance.now(), last = this.lastSend[this.channel] || []; // PRIVATE (tin mật) không có trong bảng kênh
    // giới hạn gửi của kênh (SendMsgInterval ms cho SendMsgNum tin) như client
    const recent = last.filter((x) => now - x < (c.interval || 0));
    if (c.num && recent.length >= c.num) { this.canh(`${c.menu}: gửi quá nhanh, chờ ${Math.ceil(((c.interval || 0) - (now - recent[0])) / 1000)} giây`); return; }
    this.lastSend[this.channel] = [...recent, now];
    input.value = "";
    this.cb.onSend && this.cb.onSend(this.channel, t);
  }
  _setChannel(id) {
    if (id === "PRIVATE" && !this.matToi) id = "CH_NEARBY"; // tin mật cần người nhận (datMat)
    if (id !== "PRIVATE") this.matToi = null; // chọn kênh khác: thôi nhắn tin mật
    this.channel = id;
    const c = id === "PRIVATE" ? this.M.chat.stranger : this.M.chat.channels[id], el = this.bot.querySelector(".jx-chbtn"), inp = this.bot.querySelector(".jx-input");
    el.style.cssText += ";" + css({ "background-image": c && c.menuImg ? `url(${BASE}${c.menuImg.file})` : "none" });
    el.title = id === "PRIVATE" ? "Nhắn tin mật: " + this.matToi : "Kênh nói: " + c.menu;
    if (inp) inp.placeholder = id === "PRIVATE" ? `Mật ${this.matToi}: …` : "";
  }
  // nhắn tin mật (anh 13/11): Ctrl + bấm tên người nói ở khung chat / menu người chơi "Nhắn tin mật" -> nói ở kênh Mật với người đó (ô gõ ghi "Mật <tên>");
  // chọn kênh khác thì thôi. Máy chủ chỉ chuyển cho đúng người đó (may-chu/the-gioi.js chat — PRIVATE), không trực tuyến thì báo
  datMat(ten) {
    ten = String(ten || "").trim(); if (!ten) return;
    this.matToi = ten; this._setChannel("PRIVATE");
    this.msg(`Nhắn tin mật với ${ten} — gõ rồi Enter. Chọn kênh khác để thôi.`);
    const a = document.querySelector("body.dt .dt-cgo") || this.bot.querySelector(".jx-input"); if (a) a.focus();
  }
  _channelMenu() {
    document.querySelector(".jx-menu")?.remove();
    const C = this.M.chat, m = document.createElement("div");
    m.className = "jx-menu jx-chmenu";
    m.innerHTML = Object.entries(C.channels).filter(([id]) => id !== "CH_SYSTEM").map(([id, c]) =>
      `<div data-ch="${id}" style="color:${rgb(c.color)};${border(c.border)}">${c.menuImg ? `<i style="background-image:url(${BASE}${c.menuImg.file})"></i>` : ""}${esc(c.menu)}</div>`).join("");
    m.onclick = (e) => { const d = e.target.closest("[data-ch]"); if (d) { this._setChannel(d.dataset.ch); m.remove(); this.bot.querySelector(".jx-input").focus(); } };
    popup(m, this.bot.querySelector(".jx-chbtn").getBoundingClientRect(), "up");
  }
  _chatButton(k, on) {
    if (k === "shadow") this.chatBox.querySelector(".jx-chat").classList.toggle("shade", !!on);
    else if (k === "sysOpen") this.chatBox.querySelector(".jx-sys").style.visibility = on ? "visible" : "hidden";
    else if (k === "sysUp" || k === "sysDown") this.chatBox.querySelector(".jx-sys").scrollTop += k === "sysUp" ? -15 : 15;
  }
  _renderChat() {
    const C = this.M.chat, box = this.chatBox.querySelector(".jx-chat");
    this.chatBox.querySelectorAll(".jx-tab").forEach((el) => {
      if (el.dataset.t === "Khác" && this.tab === "Khác") this.tinMoi = false;
      const on = el.dataset.t === this.tab, moi = el.dataset.t === "Khác" && this.tinMoi && !on, c = on ? C.tabs.sel : moi ? C.tabs.special : C.tabs.color, b = on ? C.tabs.selBorder : C.tabs.border;
      el.style.cssText = el.style.cssText.replace(/;?color:[^;]*|;?text-shadow:[^;]*/g, "") + `;color:${rgb(c)};${border(b)}`;
    });
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 4;
    box.innerHTML = this.chatHtml(this.tab);
    if (atBottom || !this._chatInit) box.scrollTop = box.scrollHeight;
    this._chatInit = true;
  }
  // các dòng tin của thẻ lọc tab: khung chat máy tính + khung chat của giao diện điện thoại dọc (dienthoai.js)
  chatHtml(tab) {
    const C = this.M.chat, f = TAB_FILTER[tab] || TAB_FILTER["Tất cả"];
    return this.msgs.filter(f).map((m) => {
      if (m.ch === "TIN") return `<div style="color:${rgb(m.mau || C.sys.color)};${border([0, 0, 0])}">${m.parts ? m.parts.map(([t, c]) => (c ? `<span style="color:${rgb(c)}">${esc(t)}</span>` : esc(t))).join("") : esc(m.text)}</div>`;
      const c = m.ch === "PRIVATE" ? (m.self ? C.self : C.stranger) : C.channels[m.ch] || C.channels.CH_NEARBY;
      const ic = m.ch === "PRIVATE" ? c.img : m.self && C.self.img && m.ch === "CH_NEARBY" ? C.self.img : c.textImg;
      // chữ chat: mã biểu cảm (":)", "(kl)"…) thành hình động như client (bieucam.js)
      // tin hệ thống: thẻ màu (tên người, phần thưởng — anh 13/11); tin của bang không tên người nói (vào / rời, bổ nhiệm, khảo nghiệm, công cáo — anh 14/11) cũng vậy
      return `<div style="color:${rgb(m.ch === "CH_SYSTEM" ? MAU_HE_THONG : c.color)};${border(c.border)}">${ic ? `<i style="${css({ "background-image": `url(${BASE}${ic.file})`, width: ic.w, height: ic.h })}"></i>` : ""}${this._dauTin(m)}${m.it ? this._khoeHtml(m) : m.ch === "CH_SYSTEM" || (m.ch === "CH_TONG" && !m.name) ? chuMau(m.text) : BieuCam.html(m.text)}</div>`;
    }).join("");
  }
  // đầu dòng tin: tên người nói — Ctrl + bấm (điện thoại: chạm) để nhắn tin mật (anh 13/11); tin mật: "Bạn nói với X: " / "X nói với bạn: " (GM giữ "GM: ")
  _dauTin(m) {
    const ten = (n) => `<span class="jx-ten" data-ten="${esc(n)}">${esc(n)}</span>`;
    if (m.ch === "PRIVATE" && m.name !== "GM") return m.self ? `Bạn nói với ${m.toi ? ten(m.toi) : "?"}: ` : `${ten(m.name)} nói với bạn: `;
    return m.name ? `${m.self || m.name === "GM" ? esc(m.name) : ten(m.name)}: ` : "";
  }
  // tin khoe đồ: chữ <…> đầu tiên = chỗ rê / chạm xem món (màu theo món — main.js khoeThem)
  _khoeHtml(m) {
    const t = m.text, r = /<[^<>]{1,80}>/.exec(t); if (!r) return BieuCam.html(t);
    return BieuCam.html(t.slice(0, r.index)) + `<span class="jx-khoe" data-kid="${m.kid}" style="color:${rgb(m.itMau || [100, 180, 255])}">${esc(r[0])}</span>` + BieuCam.html(t.slice(r.index + r[0].length));
  }
  // chèn "<tên đồ>" vào ô chat đang dùng (điện thoại dọc: ô gõ của khung chat — dienthoai.js) — mỗi tin 1 món: bỏ <…> đã chèn trước; quá dài -> false
  chenKhoe(ten) {
    const dt = document.querySelector("body.dt .dt-cgo"), a = dt || this.bot.querySelector(".jx-input"); if (!a) return false;
    const the = `<${ten}>`, cu = a.value.replace(/<[^<>]*>/g, "").replace(/\s{2,}/g, " ").trim(), moi = cu ? `${cu} ${the}` : the;
    if (a.maxLength > 0 && moi.length > a.maxLength) return false;
    a.value = moi; a.focus(); a.setSelectionRange(moi.length, moi.length);
    return true;
  }

  // ---------- bản đồ nhỏ ----------
  setMap(m) {
    this.mmMap = m;
    const info = this.M.minimap.maps[m.key];
    this.mmImg = null; this.mmFree = null;
    if (info) { const im = new Image(); im.onload = () => (this.mmImg = im); im.src = BASE + info.file; }
    this.mm.querySelector(".jx-mm-name").textContent = m.name;
  }
  _mmButton(k) {
    if (k === "SwitchBtn") {
      this.mmBig = !this.mmBig; this.mmFree = null;
      const cv = this.mmCv, R = this.M.minimap.rect;
      // phóng to: khung ruột 2 lần (client có bản "浏览版" lớn hơn — ở đây giữ chỗ cũ, phóng ruột ra phía trái / dưới)
      const s = this.mmBig ? 2 : 1, dx = R.w * (s - 1), dy = R.h * (s - 1), MM = this.M.minimap;
      cv.width = R.w * s; cv.height = R.h * s;
      const X0 = this.mmX0;
      cv.parentElement.style.cssText += ";" + css({ left: R.x - dx - X0, width: R.w * s, height: R.h * s });
      // tên bãi + dải mờ giãn sang trái; tọa độ, 4 nút, "Tự đánh" dời xuống mép dưới
      const set = (sel, o) => this.mm.querySelectorAll(sel).forEach((el) => (el.style.cssText += ";" + css(o(el))));
      set(".jx-mm-shadow", () => ({ left: MM.shadow.x - dx - X0, width: MM.shadow.w + dx }));
      set(".jx-mm-name", () => ({ left: MM.name.x - dx - X0, width: MM.name.w + dx }));
      set(".jx-mm-pos, .jx-mm-input", () => ({ top: MM.pos.y + dy }));
      set(".jx-mmbtn", (el) => ({ top: MM.buttons[el.dataset.k].y + dy }));
      set(".jx-auto", () => ({ top: MM.y + MM.h + 1 + dy }));
      set(".jx-katbtn", () => ({ left: R.x - dx - 21 - X0 })); // ổ khóa an toàn: vẫn sát trái bản đồ nhỏ
      return;
    }
    const tip = { BtnFlag: "Cắm cờ: bấm lên bản đồ nhỏ để chạy tới chỗ đó", WorldMapBtn: "Bản đồ thế giới — chưa có", CaveMapBtn: "Bản đồ sơn động — chưa có" }[k];
    if (tip) this.msg(tip);
  }
  // vẽ mỗi khung: ảnh bản đồ nhỏ quanh người chơi + chấm quái / người chơi + đường đang đi; tọa độ client ở dưới
  drawMinimap(s) {
    if (!this.el || !this.mmMap) return;
    const MM = this.M.minimap, cv = this.mmCv, g = cv.getContext("2d"), k = MM.scale, p = s.player;
    const W = cv.width, H = cv.height, im = this.mmImg, iw = this.mmMap.w ? Math.round(this.mmMap.w * k) : (im ? im.width : 0), ih = this.mmMap.h ? Math.round(this.mmMap.h * k) : (im ? im.height : 0);
    // khung xem: theo nhân vật, hoặc chỗ đã kéo bằng chuột phải (mmFree — giữ trong ảnh)
    const F = this.mmFree, vx = Math.max(0, Math.min(iw - W, F ? F.x : p.x * k - W / 2)), vy = Math.max(0, Math.min(ih - H, F ? F.y : p.y * k - H / 2));
    this.mmView = { x: iw > W ? vx : (iw - W) / 2, y: ih > H ? vy : (ih - H) / 2 };
    if (F) { F.x = this.mmView.x; F.y = this.mmView.y; } // kéo quá mép: dừng ở mép (kéo ngược lại là đi ngay)
    const ox = -this.mmView.x, oy = -this.mmView.y;
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    if (im) g.drawImage(im, Math.round(ox), Math.round(oy), iw, ih);
    if (s.path && s.path.length) {
      g.strokeStyle = rgb(MM.line); g.lineWidth = 1; g.beginPath(); g.moveTo(ox + p.x * k, oy + p.y * k);
      for (const [x, y] of s.path) g.lineTo(ox + x * k, oy + y * k);
      g.stroke();
    }
    // Tống Kim (anh 06/11 "như client: quân chấm hồng nhạt, phe ta chấm xanh lá, quân địch màu đỏ"): s.tk = { phe, pheNguoi } — quân NPC (tkq) hồng nhạt,
    // bot / người phe kia đỏ, bot / người phe mình xanh lá (s.dong = World.dongMinh)
    const TK = s.tk, HONG = "#ffb3d1", XANH = "#35e05a";
    for (const m of s.mobs) {
      if (!m.alive) continue;
      g.fillStyle = TK && m.tkq ? HONG : m.boss || m.sat ? "#ffb000" : "#ff3030"; // trùm / Boss Sát thủ: chấm cam to
      const r = m.boss || m.sat ? 2 : 1;
      g.fillRect(Math.round(ox + m.x * k) - r, Math.round(oy + m.y * k) - r, r * 2 + 1, r * 2 + 1);
    }
    if (TK) for (const m of s.dong || []) { if (!m.alive) continue; g.fillStyle = m.tkq ? HONG : XANH; g.fillRect(Math.round(ox + m.x * k) - 1, Math.round(oy + m.y * k) - 1, 3, 3); }
    // người chơi khác cùng bản đồ (máy chủ chung): chấm xanh dương viền đen (Tống Kim: phe mình xanh lá — phe kia đã vẽ đỏ ở mobs)
    for (const o of s.others || []) {
      let c = "#4fc3ff";
      if (TK) { const ph = TK.pheNguoi && TK.pheNguoi.get(o.name); if (ph != null && ph !== TK.phe) continue; c = XANH; }
      const x = Math.round(ox + o.x * k), y = Math.round(oy + o.y * k);
      g.fillStyle = "#000"; g.fillRect(x - 2, y - 2, 5, 5);
      g.fillStyle = c; g.fillRect(x - 1, y - 1, 3, 3);
    }
    // điểm đánh dấu của hoạt động (đua ngựa — duangua.js mm: hộp Đạo cụ hỗ trợ vàng, Ông chủ đường đua xanh lá): [{ x, y, c, r, ten?, duoi? }] — ten: chữ trắng viền đen
    // như tên chỗ in sẵn trên ảnh bản đồ nhỏ (anh 16/11 "Điểm xuất phát", "Đích"), trên chấm (duoi: dưới chấm — khỏi đè tên in sẵn)
    for (const d of s.diem || []) {
      const x = Math.round(ox + d.x * k), y = Math.round(oy + d.y * k), r = d.r || 2; g.fillStyle = "#000"; g.fillRect(x - r - 1, y - r - 1, r * 2 + 3, r * 2 + 3); g.fillStyle = d.c || "#ffd94e"; g.fillRect(x - r, y - r, r * 2 + 1, r * 2 + 1);
      if (d.ten) {
        const ty = d.duoi ? y + r + 3 : y - r - 3; g.font = `12px "VK Sans Serif 12", "IBM Plex Mono", monospace`; g.textAlign = "center"; g.textBaseline = d.duoi ? "top" : "bottom";
        g.fillStyle = "#000"; for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(d.ten, x + a, ty + b);
        g.fillStyle = "#fff"; g.fillText(d.ten, x, ty);
      }
    }
    const hx = Math.round(ox + p.x * k), hy = Math.round(oy + p.y * k);
    g.fillStyle = "#000"; g.fillRect(hx - 2, hy - 2, 5, 5);
    g.fillStyle = "#ffffff"; g.fillRect(hx - 1, hy - 1, 3, 3);
    const [X, Y] = this.mmMap.toClient(p.x, p.y), t = `${X}/${Y}`;
    const pos = this.mm.querySelector(".jx-mm-pos");
    if (pos.textContent !== t) pos.textContent = t;
  }
}

// ruột thanh: sáng ở trên, tối dần xuống dưới (giống thanh client)
function grad([r, g, b]) {
  const k = (f) => `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
  return `linear-gradient(${k(1.35)} 0%, ${k(1)} 45%, ${k(0.62)} 100%)`;
}

// Đặt menu bật lên cạnh 1 phần tử ("up": bên trên, "down": bên dưới); bấm ra ngoài thì đóng
export function popup(m, anchor, dir = "up") {
  document.body.appendChild(m);
  m.style.left = Math.max(4, Math.min(innerWidth - m.offsetWidth - 4, anchor.left)) + "px";
  m.style.top = (dir === "up" ? anchor.top - m.offsetHeight - 4 : anchor.bottom + 4) + "px";
  setTimeout(() => addEventListener("pointerdown", function off(e) { if (!m.contains(e.target)) { m.remove(); removeEventListener("pointerdown", off); } }), 0);
}
