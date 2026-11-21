// Hội thoại NPC theo đúng script client (assets/data/npcdialog.json — tools/build-npc-dialogs.mjs đã chạy script máy chủ có trong client
// qua từng trường hợp người chơi). Khung của client (assets/ui/win), chữ = font chữ ảnh của client (src/game/uiwin.js ASF_WINS):
//   Talk -> info2 (提示2.ini: chỉ có lời, bấm vào khung sang câu kế — như ảnh client anh gửi 23/10), Say -> msgsel (滚动选择界面.ini),
//   Describe -> describe (npc描述界面.ini).
// Lời giữ thẻ màu client <color=…>…<color>, <enter> = xuống dòng; {TEN} / %s = tên nhân vật.
//   const D = new NpcDialog(W, dialogs, api); D.open(npc)   // npc = { key (khóa phái), name }
//   api = { hero(), factions(), msg(t), chat(kênh, tên, lời), join(khóa phái), setCamp(phe), setRank(bậc), travel(mã bản đồ), click(),
//           sale(mã cửa hàng) -> false nếu game chưa có hàng của cửa hàng đó, fn(tên hàm, npc) -> hàm script game tự làm | null }

import { asfPx, shadow } from "./uiwin.js";

// tên màu <color=…> -> số màu: bảng của engine (engine.dll, tools/build-skill-tip.mjs -> tip.json colors; main.js gọi setTextColors)
const COLOR = {};
export function setTextColors(c) { for (const [k, v] of Object.entries(c || {})) COLOR[k.toLowerCase()] = `rgb(${v.join(",")})`; }
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// chữ client -> HTML: <color=x>…<color>, <enter>, bỏ <#> và phần "Tên NPC<#>:" đầu câu, bỏ thẻ chân dung + tên người nói
// "<link=image[…]:…_pst.spr>Tên<link><#>:" (client hiện chân dung ở ô Image của khung Describe — TẠM chưa hiện); {NPC} = tên NPC
export function richText(s, name, npcName = "") {
  s = String(s || "").replace(/\{TEN\}|%s/g, name).replace(/\{NPC\}/g, npcName)
    .replace(/^\s*(<#>)?\s*<link=[^>]*>[^<]*<link>\s*(<#>)?\s*:?\s*/i, "").replace(/<link=[^>]*>([^<]*)<link>/gi, "$1")
    .replace(/^[^<]*<#>\s*:\s*/, "").replace(/<#>|<dec>|<npc>/gi, "");
  let out = "", open = false;
  for (const part of s.split(/(<color(?:=[^>]*)?>|<enter>)/i)) {
    const m = /^<color(?:=([^>]*))?>$/i.exec(part);
    if (m) { if (open) { out += "</span>"; open = false; } if (m[1]) { out += `<span style="color:${COLOR[m[1].toLowerCase()] || m[1]}">`; open = true; } continue; }
    if (/^<enter>$/i.test(part)) { out += "<br>"; continue; }
    out += esc(part);
  }
  return out + (open ? "</span>" : "");
}

// tin hệ thống có thẻ màu (anh 13/11 "đừng để thông báo toàn màu đỏ như vậy, tên nv và thưởng đổi màu cho dễ nhìn" — như kịch bản client Msg2SubWorld("…<color=yellow>"
// ..GetName().."<color>…")): chỉ đọc <color=tên>…<color> (tên trong bảng màu engine, hoặc #rgb / #rrggbb — tên lạ thì bỏ), còn lại là chữ thường (đã thoát HTML).
// boMau: bỏ thẻ (loa thông báo quản trị — quantri.js)
export function chuMau(s) {
  let out = "", open = false;
  for (const part of String(s ?? "").split(/(<color(?:=[^>]*)?>)/i)) {
    const m = /^<color(?:=([^>]*))?>$/i.exec(part);
    if (m) {
      if (open) { out += "</span>"; open = false; }
      const k = (m[1] || "").trim(), c = COLOR[k.toLowerCase()] || (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(k) ? k : null);
      if (c) { out += `<span style="color:${c}">`; open = true; }
      continue;
    }
    out += esc(part);
  }
  return out + (open ? "</span>" : "");
}
export const boMau = (s) => String(s ?? "").replace(/<color(?:=[^>]*)?>/gi, "");

// chân dung trong lời NPC: thẻ "<link=image[a,b]:\spr\npcres\…\TÊN_pst.spr>" -> { src: dải khung a..b (cong-cu/dung-chan-dung-npc.mjs), n } | null
export function chanDung(s) {
  const m = /<link=image\[(\d+),(\d+)\]:[^>]*?([^\\/>]+_pst)\.spr>/i.exec(String(s || ""));
  return m ? { src: `assets/ui/win/npc/${m[3].toLowerCase()}_${m[1]}_${m[2]}.png`, n: +m[2] - +m[1] + 1 } : null;
}

// thanh cuộn kiểu client cho ô danh sách box của khung w (W = bộ khung uiwin — đo tỉ lệ thu phóng); dùng chung với windows.js (khung xếp
// hạng) -> { list, sync } (sync: đặt lại nút kéo sau khi đổi nội dung)
export function ganCuon(W, w, box, bar) {
  const list = w.node(box), tr = w.item(bar), b = w.item(bar + "_Btn");
  if (!list || !tr || !b) return null;
  tr.el.appendChild(b.el);
  b.el.style.left = "0px";
  Object.assign(list.style, { overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", pointerEvents: "auto" });
  const top = 0, end = Math.max(top, tr.s.h - b.s.h);
  const max = () => list.scrollHeight - list.clientHeight;
  const sync = () => { const m = max(); b.el.style.top = Math.round(m > 1 ? top + ((end - top) * list.scrollTop) / m : top) + "px"; };
  list.addEventListener("scroll", sync);
  b.el.addEventListener("mousedown", (e) => {
    e.preventDefault(); e.stopPropagation();
    const k = W.root.getBoundingClientRect().width / 1024, y0 = e.clientY, t0 = list.scrollTop;
    const mv = (ev) => { list.scrollTop = t0 + (((ev.clientY - y0) / k) * max()) / Math.max(1, end - top); };
    const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); };
    addEventListener("mousemove", mv); addEventListener("mouseup", up);
  });
  return { list, sync };
}

// Lời dài hơn ô chữ -> chia trang vừa ô như client (anh 06/11 "chỗ giới thiệu của NPC đang lỗi bố cục": Mộ binh quan "Tìm hiểu quy tắc Tống Kim" tràn khỏi
// khung, đè nút). Client chia sẵn trong script (battleinfo.lua: Say(trang 1, 1, "Trang kế /…") … trang cuối mới có lựa chọn); ở đây đo chữ thật trong ô
// đang hiện (font / thu phóng nào cũng đúng): ngắt ở đầu đoạn (<enter>) khi trang đã đầy quá nửa, không thì sau dấu cách cuối còn vừa — không cắt đôi chữ.
// box = ô chữ (cao cố định), lab = chữ trong ô (cao theo chữ) -> [html từng trang]; xong lab giữ trang 1
export function chiaTrang(box, lab, html) {
  lab.innerHTML = html;
  const T = [];
  for (let n = 0; n < 40; n++) {
    const r = catTrang(box, lab);
    if (!r) { T.push(lab.innerHTML); break; }
    T.push(r[0]); lab.innerHTML = r[1];
  }
  lab.innerHTML = T[0];
  return T;
}
// trang đầu vừa ô của lab -> [html trang đầu, html phần còn lại] | null (vừa ô)
function catTrang(box, lab) {
  if (!box.clientHeight || lab.offsetHeight <= box.clientHeight + 1) return null;
  // getClientRects chứ không getBoundingClientRect: điện thoại toàn màn hình (dienthoai.js caiZoom — zoom trang Z) đè getBoundingClientRect (chia Z) mà
  // Range.getClientRects (day) thì không -> 2 hệ tọa độ lệch nhau, đo sai, không chia trang, chữ vẫn đè nút (soát 11/11)
  const rb = box.getClientRects()[0], rl = lab.getClientRects()[0]; if (!rb || !rl) return null;
  const k = rb.height / box.offsetHeight || 1, H = box.clientHeight * k + 0.5, top = rl.top; // điểm màn
  const N = [], doan = []; let tong = 0, sauBr = false; // N: [nút chữ, chỉ số ký tự đầu]; doan: chỉ số ký tự đầu mỗi đoạn (sau <br>)
  const tw = document.createTreeWalker(lab, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let nd = tw.nextNode(); nd; nd = tw.nextNode()) {
    if (nd.nodeType === 1) { if (nd.tagName === "BR") sauBr = true; continue; }
    if (!nd.data.length) continue;
    if (sauBr) { doan.push(tong); sauBr = false; }
    N.push([nd, tong]); tong += nd.data.length;
  }
  if (!tong) return null;
  const R = document.createRange();
  const cho = (i) => { let a = 0, b = N.length - 1; while (a < b) { const m = (a + b + 1) >> 1; if (N[m][1] <= i) a = m; else b = m - 1; } return [N[a][0], i - N[a][1]]; };
  const ky = (i) => { const [nd, o] = cho(i); return nd.data[o]; };
  const day = (i) => { // đáy dòng của ký tự i (ký tự không có khung — dấu ghép …: lấy ký tự kế)
    for (let j = i; j < tong; j++) { const [nd, o] = cho(j); R.setStart(nd, o); R.setEnd(nd, o + 1); const q = R.getClientRects(); if (q.length && q[0].height > 0) return q[q.length - 1].bottom - top; }
    return Infinity;
  };
  let a = 0, b = tong; // ký tự đầu tiên rơi xuống dưới đáy ô
  while (a < b) { const m = (a + b) >> 1; if (day(m) > H) b = m; else a = m + 1; }
  const cat = a;
  if (cat <= 0 || cat >= tong) return null;
  let c = 0;
  for (const p of doan) if (p <= cat && p > 0 && day(p - 1) >= H / 2) c = p; // đầu đoạn, trang đã đầy quá nửa
  for (const re of [/[.!?;]/, /[,)]/]) for (let j = cat - 1; !c && j > 1 && day(j - 1) >= H / 2; j--) if (/\s/.test(ky(j)) && re.test(ky(j - 1))) c = j + 1; // hết câu (. ! ? ;), rồi dấu phẩy — trang đã đầy quá nửa
  if (!c) for (let j = cat - 1; j > 0 && j >= cat - 160; j--) if (/\s/.test(ky(j))) { c = j + 1; break; } // sau dấu cách
  if (!c) c = cat;
  let d = c; while (d < tong && /\s/.test(ky(d))) d++; // trang sau không mở đầu bằng dấu cách
  if (d >= tong) return null;
  const html = (s, e) => { R.setStart(...s); R.setEnd(...e); const x = document.createElement("div"); x.appendChild(R.cloneContents()); return x.innerHTML; };
  const dau = [lab, 0], cuoi = [lab, lab.childNodes.length];
  return [html(dau, cho(c)), html(cho(d), cuoi).replace(/^(\s|<br\s*\/?>)+/i, "")];
}

export class NpcDialog {
  constructor(W, D, api) {
    this.W = W; this.D = D; this.api = api; this.cur = null;
    this.bars = [];
    // thanh cuộn: lời (Msg_Scroll) và lựa chọn (Select_Scroll)
    for (const [k, box, bar] of [["msgsel", "Select_List", "Select_Scroll"], ["describe", "Select_List", "Select_Scroll"], ["describe", "MessageList", "Msg_Scroll"]]) this.scrollBar(W.get(k), box, bar);
  }
  // Thanh cuộn như client: nền khung không vẽ rãnh, chỉ có nút kéo (<tên>_Btn, hình 13 × 27 viên ngọc xanh). Ảnh client (anh gửi 23/10,
  // khung Say 4 lựa chọn — chưa cần cuộn): nút vẫn hiện, nằm ở gốc ô thanh cuộn (đo: x 415, y 19 = Left / Top của Select_Scroll). Khi
  // cuộn: nút chạy từ gốc tới đáy ô (TẠM — SlideBegin / SlideEnd của ini chưa rõ nghĩa ở đây). Lăn chuột trên danh sách hoặc kéo nút.
  scrollBar(w, box, bar) { const r = ganCuon(this.W, w, box, bar); if (r) this.bars.push({ w, ...r }); }
  // sau khi điền chữ: về đầu danh sách, đặt lại nút kéo (khung đang hiện mới đo được chiều cao)
  syncBars(w) { for (const x of this.bars) if (x.w === w) { x.list.scrollTop = 0; x.sync(); } }
  // trường hợp người chơi -> nút mở đầu (như điều kiện trong script: cùng hệ, cấp ≥ 10, chưa phái…)
  caseOf(n, key) {
    // Vô Môn Phái đang chờ đổi phái bằng Tín vật môn phái (anh 11/11 — main.js doiPhaiFn): mọi NPC môn phái mời bái nhập, khác hệ cũng được
    const dp = this.api.doiPhaiCase && this.api.doiPhaiCase(key); if (dp) return dp;
    const h = this.api.hero(), mine = h.fac == null ? null : this.facKey(h.fac);
    if (mine === key) return n.cases.member;
    if (mine) return n.cases.other[mine];
    if (h.series !== this.series(key)) return n.cases.otherSeries;
    return h.lvl >= 10 ? n.cases.eligible : n.cases.low;
  }
  facKey(id) { const f = this.api.factions().find((x) => x.id === id); return f ? f.key : null; }
  series(key) { const f = this.api.factions().find((x) => x.key === key); return f ? f.series : -1; }

  // NPC phái (npc.key = khóa phái): theo trường hợp người chơi; NPC thường (npc.script): hội thoại của script đó từ hàm main
  open(npc) {
    if (npc.key) { const n = this.D.npcs[npc.key]; if (!n) return false; this.cur = { npc, n }; this.show(this.caseOf(n, npc.key)); return true; }
    const s = npc.script && this.D.scripts && this.D.scripts[npc.script];
    if (!s) return false;
    this.cur = { npc, n: s };
    this.show(s.entry);
    return true;
  }
  close() { for (const k of ["info2", "msgsel", "describe"]) this.W.get(k).hide(); this.W.get("info2").el.onclick = null; this.cur = null; }
  get open_() { return !!this.cur; }

  show(id) {
    const c = this.cur; if (!c) return;
    // hàm script do game tự làm (Xa phu — script\global\station.lua: WayPointFun / StationFun / TownPortalFun): api.fn(tên hàm, npc) trả
    // { text, opts: [[nhãn, hàm | null]] } (Say của script: lựa chọn gọi hàm của game, null = đóng) hoặc { close } (đã làm, đóng khung);
    // desc: 1 -> khung Describe như lời NPC có chân dung (Lễ quan — anh 29/10 lần 3). Hàm phải hỏi máy chủ trước (Mở Pass Rương) trả Promise:
    // khung đang mở giữ nguyên tới khi có trả lời
    const f = this.api.fn && this.api.fn(id, c.npc);
    if (f && typeof f.then === "function") return void f.then((r) => { if (this.cur === c) r ? this.fnHien(r) : this.close(); }, () => this.close());
    if (f) return this.fnHien(f);
    for (const k of ["info2", "msgsel", "describe"]) this.W.get(k).hide();
    let node = id && c.n.nodes[id];
    if (!node) return this.close();
    // hàm có random() của script: nhiều câu -> chọn ngẫu nhiên 1 câu mỗi lần như client
    if (node.t === "rand") node = node.alts[Math.floor(Math.random() * node.alts.length)];
    for (const a of node.acts || []) this.act(a);
    // lựa chọn chỉ để đi bản đồ khác (vd "Nhờ sư huynh đưa ta về núi!"): game chưa có bản đồ đó -> báo, nhân vật ở lại. Nhập phái cũng
    // có NewWorld (về phái) — bỏ qua như anh chốt (nhân vật vẫn ở bản đồ đó).
    const go = (node.acts || []).find((a) => a[0] === "NewWorld");
    if (go && !node.acts.some((a) => a[0] === "SetFaction")) this.api.travel(+go[1]);
    const name = this.api.hero().name, txt = (node.text || []).map((t) => richText(t, name, c.npc.name));
    if (node.t === "act") return node.next ? this.show(node.next) : this.close();
    if (node.t === "talk") return this.talk(txt, 0, node.next);
    // lựa chọn game thêm chỉ hiện lúc đủ điều kiện (api.anOpt(việc) — vd Xa phu "Đưa ta đến bản đồ nhiệm vụ sát thủ" khi đang nhận nhiệm vụ)
    const opts = this.api.anOpt ? (node.opts || []).filter((o) => !this.api.anOpt(o[1])) : node.opts;
    if (node.t === "say") return this.choose("msgsel", "InfoText", txt.join("<br>"), opts);
    if (node.t === "desc") return this.choose("describe", "MessageList", txt.join("<br>"), opts, c.npc.name, chanDung((node.text || [])[0]));
  }
  // kết quả hàm của game (show): { text, opts, desc? } | { close }
  fnHien(f) {
    const c = this.cur; if (!c) return;
    for (const k of ["info2", "msgsel", "describe"]) this.W.get(k).hide();
    if (f.close) return this.close();
    const html = richText(f.text, this.api.hero().name, c.npc.name);
    if (f.desc) return this.choose("describe", "MessageList", html, f.opts, c.npc.name, chanDung(f.text));
    this.choose("msgsel", "InfoText", html, f.opts);
  }
  // ô chân dung của khung Describe (npc描述界面.ini Image 64 × 82): hình đứng của NPC (thẻ <link=image[a,b]:…_pst.spr> đầu lời — chanDung), khung
  // a..b chạy lặp 10 khung / giây, canh giữa, sát đáy ô, nền trong suốt + viền đen quanh hình (anh 29/10 lần 4 — bản trước nền tối); tên NPC
  // (ô Text — cùng ô với Image) xuống ngay dưới chân dung. Lời không có chân dung: tên giữa ô như trước
  datChanDung(w, anh, ten) {
    const im = w.item("Image"), tx = w.item("Text"); if (!im || !tx) return;
    // tên dài hơn ô 112 điểm (anh 16/11 — "Chưởng Đăng Cung Nữ"): vẫn 1 dòng (dưới chân dung chỉ đủ 1 dòng trước danh sách lựa chọn), chữ nhỏ lại 11 điểm;
    // tên ngắn (Lễ quan, Võ sư, Công Bình Tử…) như cũ
    const dai = !!anh && String(ten || "").length > 13;
    if (tx._fs == null) tx._fs = tx.lab.style.fontSize;
    tx.lab.style.fontSize = dai ? "11px" : tx._fs;
    let a = im.el.querySelector(".jw-npcanh");
    if (!a) { a = document.createElement("i"); a.className = "jw-npcanh"; im.el.appendChild(a); }
    a.style.display = anh ? "" : "none";
    // có chân dung: ô tên (Text 64 điểm ảnh — chữ ASF 16 ~8 điểm / chữ) nới 112, lệch trái 24 (vẫn giữa dưới chân dung, mép phải 130 < MessageList 136), 1 dòng — anh 15/11:
    // "Công Bình Tử" bị cắt còn "Công Bìn"; "Lễ quan" ngắn hơn ô nên như cũ. Không chân dung: ô gốc của ini, ngắt dòng như uiwin.js đặt lúc dựng (_ws / _wb)
    if (tx._ws == null) { tx._ws = tx.lab.style.whiteSpace; tx._wb = tx.lab.style.wordBreak; }
    Object.assign(tx.el.style, anh ? { top: tx.s.y + tx.s.h + 8 + "px", height: "18px", left: tx.s.x - 24 + "px", width: tx.s.w + 48 + "px" } : { top: tx.s.y + "px", height: tx.s.h + "px", left: tx.s.x + "px", width: tx.s.w + "px" });
    Object.assign(tx.lab.style, anh ? { whiteSpace: "nowrap", wordBreak: "normal" } : { whiteSpace: tx._ws, wordBreak: tx._wb });
    if (!anh || a.dataset.src === anh.src) return;
    a.dataset.src = anh.src;
    const hinh = new Image();
    hinh.onload = () => {
      if (a.dataset.src !== anh.src) return;
      const fw = Math.round(hinh.naturalWidth / anh.n);
      Object.assign(a.style, { width: fw + "px", height: hinh.naturalHeight + "px", backgroundImage: `url(${anh.src})`, backgroundSize: `${hinh.naturalWidth}px ${hinh.naturalHeight}px`,
        animation: `jw-npcanh ${(anh.n / 10).toFixed(1)}s steps(${anh.n}, jump-none) infinite` });
    };
    hinh.src = anh.src;
  }
  // Talk: từng câu một. Ảnh client (anh gửi 23/10): khung chỉ có lời, không hiện chữ nút -> bấm vào khung sang câu kế; hết câu thì
  // sang hàm kế của script (hoặc đóng)
  talk(txt, i, next) {
    const w = this.W.get("info2"), it = w.item("Info");
    w.sticky = false; // khung này cũng là bảng trọng thương (main.js deathBox — Esc không đóng); hội thoại thì Esc đóng được
    w.show();
    // câu dài hơn ô Info (5 dòng chữ 14 — anh 06/11: lời tràn đè dòng nút): chia trang (chiaTrang), Tiếp tục sang trang kế như sang câu kế
    const T = chiaTrang(it.el, it.lab, txt[i] || "");
    if (T.length > 1) txt = [...txt.slice(0, i), ...T, ...txt.slice(i + 1)];
    // anh 27/10 "đối thoại NPC xem có nút đóng chưa": dòng nút dưới khung ghi Tiếp tục (còn câu / còn hàm kế) hoặc Kết thúc đối thoại
    w.set("OK", i + 1 < txt.length || next ? "Tiếp tục" : "Kết thúc đối thoại");
    // next: hàm kế của script (id) hoặc hàm của game (Dã Tẩu — main.js)
    // hết câu, không có hàm kế: đóng (như show(undefined) -> close; gọi từ lựa chọn của hàm game — khung Say đã đóng, không còn cur — vẫn đóng được)
    const go = () => { this.api.click(); i + 1 < txt.length ? this.talk(txt, i + 1, next) : typeof next === "function" ? (w.hide(), next()) : next ? this.show(next) : this.close(); };
    w.on("OK", go);
    w.el.onclick = (e) => { e.stopPropagation(); go(); };
  }
  // Say / Describe: lời + danh sách lựa chọn, như ảnh client: dòng đang chọn (mặc định dòng đầu; rê chuột để đổi — TẠM) = chữ SelColor
  // viền SelBorderColor trên thanh SelBgColor (đo ảnh: phủ ~50 %), dòng khác chữ MsgColor viền tối; mỗi dòng cao cỡ chữ + 1 (ảnh: 15
  // điểm ở cỡ 14), dòng dài ngắt theo ký tự như lời. HighLightColor (xanh lá) chưa rõ client dùng lúc nào — chưa dùng.
  choose(win, textItem, html, opts, title, anh) {
    const w = this.W.get(win), sec = w.def.sec.Select_List, list = w.node("Select_List"), rgb = (c) => `rgb(${c.join(",")})`;
    if (win === "describe") this.datChanDung(w, anh, title);
    // lời: ô nhiều dòng (InfoText MultiLine — uiwin.js đặt cỡ dòng / ngắt dòng) hoặc danh sách tin (MessageList MsgLineCount)
    const ti = w.item(textItem), ts = ti.s;
    ti.lab.innerHTML = html;
    // Say: ảnh client (anh gửi 23/10) lời nằm sát mép trên ô InfoText (dòng đầu cách mép khung 16 = Top), dù ini ghi VAlign=1 — khác
    // khung Talk (lời canh giữa theo chiều dọc, đo ảnh: khớp)
    // lời dài hơn ô thì không tràn đè danh sách lựa chọn: cắt trong ô, cuộn bằng bánh xe chuột (27/10 — bảng tổng kết ủy thác)
    if (win === "msgsel") { Object.assign(ti.el.style, { alignItems: "flex-start", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", pointerEvents: "auto" }); ti.el.scrollTop = 0; }
    if (ts.msgLineCount) {
      Object.assign(ti.el.style, { overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", pointerEvents: "auto" });
      Object.assign(ti.lab.style, { height: "auto", overflow: "visible", color: rgb(ts.msgColor || [202, 255, 202]), lineHeight: asfPx(ts.font || 12) + "px", whiteSpace: "break-spaces", wordBreak: "break-all" });
    }
    if (title != null && w.item("Text")) w.set("Text", title);
    const lh = asfPx(sec.font || 12) + 1;
    // Say của script không có lựa chọn (vd Thiên Nhẫn Tử Sĩ): thêm "Kết thúc đối thoại" như các Say khác của client — khỏi kẹt khung
    if (!(opts || []).length) opts = [["Kết thúc đối thoại", null]];
    const datLuaChon = (L) => {
      list.textContent = "";
      const rows = [];
      const pick = (j) => rows.forEach((d, k) => {
        const on = k === j;
        d.style.color = rgb((on ? sec.selColor : sec.msgColor) || (on ? [255, 253, 122] : [202, 230, 171]));
        d.style.textShadow = shadow(on && sec.selBorderColor ? sec.selBorderColor : [0, 0, 0]);
        d.style.background = on && sec.selBgColor ? `rgba(${sec.selBgColor.join(",")},.5)` : "";
      });
      L.forEach(([label, next], j) => {
        const d = document.createElement("div");
        d.className = "jw-opt";
        d.innerHTML = richText(label, this.api.hero().name, this.cur && this.cur.npc.name);
        Object.assign(d.style, { lineHeight: lh + "px", minHeight: lh + "px", cursor: "inherit", whiteSpace: "break-spaces", wordBreak: "break-all" });
        d.onmouseenter = () => pick(j);
        d.onmousedown = (e) => e.preventDefault();
        // next.giu: "Trang kế" — giữ khung, sang trang lời kế
        d.onclick = (e) => { e.stopPropagation(); this.api.click(); if (typeof next === "function" && next.giu) next(); else if (typeof next === "function") { this.close(); next(); } else if (next) this.show(next); else this.close(); };
        list.appendChild(d); rows.push(d);
      });
      pick(0);
    };
    w.show();
    // tên dài hơn ô dưới chân dung (anh 16/11 — "Truy Phong Sứ Giả" bị cắt còn "Truy Phong Sứ"): đo sau khi hiện khung, ép ngang chữ vừa ô (tối thiểu 70 %); tên vừa ô / không chân dung: như cũ
    if (win === "describe" && w.item("Text")) {
      const tx = w.item("Text"); Object.assign(tx.lab.style, { transform: "", width: "", marginLeft: "" });
      const sw = tx.lab.scrollWidth, cw = tx.el.clientWidth; // ô chữ cắt phần tràn (overflow hidden): nới ô bằng bề ngang chữ, canh giữa ô gốc rồi ép
      if (anh && cw > 0 && sw > cw + 1) Object.assign(tx.lab.style, { width: sw + "px", marginLeft: Math.round((cw - sw) / 2) + "px", transformOrigin: "center", transform: `scaleX(${Math.max(0.7, cw / sw).toFixed(3)})` });
    }
    // lời dài hơn ô InfoText (6 dòng chữ 14): chia trang như client (chiaTrang) — trang trước chỉ có "Trang kế" (battleinfo.lua), trang cuối mới có lựa chọn
    const T = win === "msgsel" ? chiaTrang(ti.el, ti.lab, html) : [html];
    const trang = (i) => {
      if (i) { ti.lab.innerHTML = T[i]; ti.el.scrollTop = 0; }
      if (i + 1 < T.length) { const ke = () => trang(i + 1); ke.giu = 1; datLuaChon([["Trang kế", ke]]); } else datLuaChon(opts);
      this.syncBars(w);
    };
    trang(0);
  }
  // việc script làm
  act([a, ...p]) {
    const api = this.api, name = api.hero().name, fill = (s) => String(s || "").replace(/%s|\{TEN\}/g, name);
    if (a === "SetFaction") api.join(p[0]);
    else if (a === "SetCamp") api.setCamp(+p[0]);
    else if (a === "SetRank") api.setRank(+p[0]);
    else if (a === "Msg2Player") api.msg(fill(p[0]).replace(/<color(=[^>]*)?>/gi, ""));
    else if (a === "Sale") { if (!api.sale(+p[0])) api.msg(`${this.cur ? this.cur.npc.name : "Cửa hàng"}: chưa bày hàng`); } // Dược điếm: thuốc (25/10); TẠM thợ rèn, tạp hóa
    else if (a === "Msg2Faction") api.chat("CH_FACTION", name, fill(this.series(p[0]) >= 0 ? p[1] : p[0]).replace(/<color(=[^>]*)?>/gi, ""));
    // AddNote (sổ nhiệm vụ), SetRevPos (điểm hồi sinh ở phái), learn (add_xx — chiêu tự hiện theo cấp, xem windows.js): chưa cần
  }
}
