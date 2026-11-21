// Màn chờ (anh muốn 26/10: chơi qua Internet bấm đổi bãi phải chờ hơn 10 giây mà màn hình không đổi gì -> người chơi tưởng chưa bấm, bấm
// lại). Dùng chung cho mọi lúc chờ (anh 27/10 "lúc loading kho hình và chuyển map full hình, đồng bộ"): mở game tải kho hình, vào game, đổi
// bản đồ — cùng 1 kiểu: ảnh nền phủ kín màn hình + dòng chữ + thanh tải. Ảnh ngẫu nhiên trong assets/ui/loading/ (máy chủ liệt kê: GET
// /api/anh-cho — thả thêm ảnh .webp / .jpg / .png vào thư mục là có, không cần sửa code — trình duyệt hỏi 1 lần lúc mở trang, ảnh mới thả
// vào thì F5; mỗi lần chờ 1 ảnh khác ảnh lần trước. Máy chủ cũ chưa có đường này thì dùng loading1–8.webp của anh 26/10). Ảnh phủ kín
// (cover, cắt mép theo tỉ lệ màn): màn rộng hơn ảnh thì ảnh bị phóng to — muốn nét trên màn Full HD / 2K thì dùng ảnh rộng ≥ 1920 / 2560
// điểm (bản 26/10 giữ ảnh đúng cỡ ở giữa, mép nền mờ — anh muốn full hình). Thanh tải chạy theo số byte / số phần đã tải. Màn chờ phủ trên
// mọi khung -> trong lúc chờ không bấm được gì; main.js chặn thêm phím.
//   const L = LOADING.start("Thục Cương sơn");       // "Đang vào Thục Cương sơn…"; LOADING.start(null, "Đang tải kho hình…")
//   const set = L.part(2e6); set(daTai, tong);     // phần đo theo byte (tổng biết sau thì truyền tong)
//   L.track(promise, bytes);                        // xong promise = xong phần đó
//   L.end();
//   LOADING.giu = true                              // giữ màn chờ qua nhiều bước (vào game: tải bãi + dựng giao diện) — end() bỏ qua
const BASE = "assets/ui/loading/", MAC_DINH = Array.from({ length: 8 }, (_, i) => `loading${i + 1}.webp`);

export class ZoneLoading {
  constructor() {
    const el = (this.el = document.createElement("div"));
    el.className = "zl";
    el.innerHTML = `<div class="zl-bg"></div><div class="zl-bot"><div class="zl-t"><span class="zl-n"></span><span class="zl-p"></span></div><div class="zl-bar"><i></i></div><button class="zl-nut" type="button"></button></div>`;
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    document.body.appendChild(el);
    this.bg = el.querySelector(".zl-bg"); this.name = el.querySelector(".zl-n"); this.pct = el.querySelector(".zl-p"); this.bar = el.querySelector(".zl-bar i"); this.nutEl = el.querySelector(".zl-nut");
    this.on = false; this.giu = false; this.parts = []; this.last = null; this.next = null; this.hideT = 0;
    this.list = fetch("api/anh-cho").then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.anh && j.anh.length ? j.anh : MAC_DINH)).catch(() => MAC_DINH)
      .then((L) => { this.files = L; if (!this.on) { this.next = this._pick(); this._preload(this.next); } return L; });
    this.files = MAC_DINH;
  }
  // ảnh khác lần trước (còn 1 ảnh thì dùng lại)
  _pick() { const L = this.files.filter((f) => f !== this.last); const pool = L.length ? L : this.files; return pool[Math.floor(Math.random() * pool.length)]; }
  _preload(f) { if (f) new Image().src = BASE + f; }
  // đang hiện sẵn (vd vào game -> tải bãi) thì giữ ảnh, chỉ đổi chữ + thanh tải từ đầu
  start(name, text) {
    clearTimeout(this.hideT);
    if (!this.on || this.el.classList.contains("out")) {
      const f = this.next || this._pick();
      this.last = f; this.next = this._pick(); this._preload(this.next); // tải sẵn ảnh lần sau -> lần sau hiện ngay
      this.bg.style.backgroundImage = `url("${BASE}${f}")`;
    }
    this.name.textContent = text || `Đang vào ${name}…`;
    this.parts = []; this.k = 0; this.luc = performance.now(); this._draw();
    this.el.classList.remove("out"); this.el.classList.add("on"); this.on = true;
    return this;
  }
  // phần việc nặng w byte (ước lượng); trả hàm báo tiến độ (daTai, tong?) — tong có thì thay ước lượng
  part(w) {
    const o = { w: Math.max(1, w), k: 0 }; this.parts.push(o); this._draw();
    return (got, tot) => { if (tot > 0) o.w = tot; const k = Math.max(o.k, Math.min(1, tot > 0 ? got / tot : got)); if (k > o.k) this.luc = performance.now(); o.k = k; this._draw(); };
  }
  // xong khi thanh tải đứng yên quá ms (không phần nào tiến thêm — vd 1 tệp khựng mãi) hoặc màn chờ đã tắt: đổi bản đồ thì phần không cần để vào
  // bãi (hình quái / nhân vật / ô ảnh) vào luôn, tải tiếp sau (main.js loadZone — anh 28/10 "thanh loading kiểm tra kĩ")
  dungYen(ms) { return new Promise((r) => { const t = setInterval(() => { if (!this.on || performance.now() - this.luc > ms) { clearInterval(t); r(); } }, 500); }); }
  // đổi dòng chữ đang hiện (tải trước lần đầu: số MB / số tệp — src/game/tai-truoc.js)
  chu(t) { this.name.textContent = t; }
  // nút dưới thanh tải (label null = ẩn): tải trước lần đầu — "Vào game ngay"
  nut(label, fn) { const b = this.nutEl; b.style.display = label ? "block" : "none"; b.textContent = label || ""; b.onclick = label ? (e) => { e.stopPropagation(); fn(); } : null; }
  track(p, w) { const set = this.part(w); return Promise.resolve(p).finally(() => set(1)); }
  // 100%: thanh đầy ngay, không chạy dần (anh 30/10 "100% nhưng không đầy thanh": xong tải là dựng giao diện ngay, trình duyệt bận -> hiệu ứng
  // chạy dần 0,15 giây đứng lại giữa chừng, chữ đã 100% mà thanh còn thiếu tới lúc màn chờ tắt)
  _draw() {
    let all = 0, done = 0; for (const o of this.parts) { all += o.w; done += o.w * o.k; }
    const k = (this.k = Math.max(this.k || 0, all ? done / all : 0)); // không tụt lùi khi phần ước lượng đổi sang số byte thật
    this.bar.style.transition = k >= 1 ? "none" : "";
    this.bar.style.width = (k * 100).toFixed(1) + "%"; this.pct.textContent = Math.floor(k * 100) + "%";
  }
  end() {
    if (!this.on || this.giu) return;
    this.on = false; this.bar.style.transition = "none"; this.bar.style.width = "100%"; this.pct.textContent = "100%";
    this.el.classList.add("out");
    this.hideT = setTimeout(() => this.el.classList.remove("on", "out"), 250);
  }
}
