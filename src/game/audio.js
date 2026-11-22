// Âm thanh trong game: kho assets/web/sound (sound.json — xem assets/web/README.md).
//   Nhạc nền: 1 thẻ <audio> lặp, đổi bài theo bản đồ. Tiếng hiệu ứng: Web Audio, giải mã 1 lần rồi nhớ đệm; cùng 1 tiếng
//   phát dồn dập (nhiều quái chết cùng lúc) thì chỉ phát lại sau GAP giây để khỏi ồn và đỡ tốn.
// Trình duyệt chỉ cho phát tiếng sau khi người chơi bấm / gõ lần đầu -> unlock() gọi trong sự kiện bấm.

const GAP = 0.06;
const MAX_VOICES = 12;

export class GameAudio {
  static async load(base = "assets/web/sound/") {
    const r = await fetch(base + "sound.json");
    if (!r.ok) throw new Error("Không đọc được sound.json");
    return new GameAudio(base, await r.json());
  }

  constructor(base, meta) {
    this.base = base;
    this.meta = meta;
    this.ctx = null;
    this.buf = new Map();    // file -> Promise<AudioBuffer|null>
    this.last = new Map();   // file -> thời điểm phát gần nhất
    this.voices = 0;
    this.music = new Audio();
    this.music.loop = true;
    this.musicFile = null;
    this.vol = { music: 0.45, sfx: 0.7 };
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
      this._applyVol();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (this.musicFile && this.music.paused && !this.muted) this.music.play().catch(() => {});
  }

  setMuted(m) { this.muted = m; this._applyVol(); if (m) this.music.pause(); else if (this.musicFile) this.music.play().catch(() => {}); }
  // âm lượng nhạc nền / tiếng (0..1) — thanh trượt của cửa sổ Tùy chọn
  setVolume(kind, v) { this.vol[kind] = Math.max(0, Math.min(1, v)); this._applyVol(); }
  _applyVol() {
    this.music.volume = this.muted ? 0 : this.vol.music * (this._musicVol || 1);
    if (this.out) this.out.gain.value = this.muted ? 0 : this.vol.sfx;
  }

  // Nhạc nền của bản đồ (khóa ảnh bản đồ, như music trong sound.json)
  playMapMusic(mapKey) {
    const m = this.meta.music[mapKey];
    if (!m || m.file === this.musicFile) return;
    this.musicFile = m.file;
    this._musicVol = (m.vol || 100) / 100;
    this.music.src = this.base + m.file;
    this._applyVol();
    if (!this.muted) this.music.play().catch(() => {}); // chưa bấm lần nào thì trình duyệt chặn -> unlock() phát lại
  }

  stopMusic() { this.music.pause(); this.musicFile = null; }

  _get(file) {
    let p = this.buf.get(file);
    if (!p) {
      p = fetch(this.base + file).then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((ab) => (ab && this.ctx ? this.ctx.decodeAudioData(ab) : null)).catch(() => null);
      this.buf.set(file, p);
    }
    return p;
  }

  // Phát 1 file (đường dẫn trong sound.json). vol 0..1
  play(file, vol = 1) {
    if (!file || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime, l = this.last.get(file);
    if (l != null && now - l < GAP) return;
    if (this.voices >= MAX_VOICES) return;
    this.last.set(file, now);
    this._get(file).then((b) => {
      if (!b) { this.buf.delete(file); return; }
      const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
      s.buffer = b; g.gain.value = vol;
      s.connect(g).connect(this.out);
      this.voices++;
      s.onended = () => { this.voices--; };
      s.start();
    });
  }

  // Tiếng NPC / quái theo loại hình + động tác (die, attack1, attack2, magic…); không có thì tiếng dự phòng theo họ
  npc(type, act, vol = 0.8) {
    const t = String(type).toLowerCase(), own = this.meta.npc[t];
    const fam = (/^[a-z]+/.exec(t) || [""])[0], fb = this.meta.npcFallback[fam];
    this.play((own && own[act]) || (fb && fb[act]), vol);
  }
  ui(name, vol = 0.8) { this.play(this.meta.ui[name], vol); }
  // tiếng đòn thường: missile(1, 0) lúc vung, missile(1, 1) lúc trúng (sound.json missile[1] — tiếng đạn 1 của client)
  missile(id, k = 0, vol = 0.8) { const f = this.meta.missile[id]; this.play(f && f[Math.min(k, f.length - 1)], vol); }

  // Chuông ngọc khi rơi trang bị xanh (tier 1) hoặc cực phẩm/đồ hiếm (tier 2) — dùng Web Audio, tự theo nút tắt tiếng & âm lượng SFX
  playChime(tier = 1) {
    if (this.muted || !this.ctx || !this.out || this.ctx.state !== "running") return;
    const key = "chime:" + tier, now = this.ctx.currentTime;
    if ((this.last.get(key) || 0) + 0.25 > now) return;
    this.last.set(key, now);
    const notes = tier >= 2 ? [[1046.5, 0, 0.36, 0.14], [1567.98, 0.08, 0.45, 0.13]] : [[880, 0, 0.22, 0.08]];
    for (const [freq, dl, dur, vol] of notes) {
      try {
        const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + dl);
        g.gain.setValueAtTime(0.0001, now + dl);
        g.gain.exponentialRampToValueAtTime(vol, now + dl + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dl + dur);
        osc.connect(g); g.connect(this.out);
        osc.start(now + dl); osc.stop(now + dl + dur + 0.02);
      } catch {}
    }
  }
}
