// Tải 1 tệp có hạn "không nhận thêm byte nào quá ms" (anh 28/10 "thanh loading kiểm tra kĩ, tránh lỗi dẫn đến không đồng bộ game"): mạng /
// đường hầm khựng thì bỏ (lỗi — người gọi tải lại lúc cần), nhả kết nối ngay. Tính theo lúc khựng chứ không theo tổng thời gian: tệp lớn trên
// mạng chậm vẫn tải được miễn còn nhận byte. Thử 28/10: trình duyệt chỉ mở 6 kết nối tới 1 máy chủ http (HTTP/1.1) — 6 yêu cầu khựng mà chờ
// mãi (hay chờ 60 giây) là chặn luôn mọi yêu cầu khác (hình nhân vật, ô bản đồ, cả lúc đổi bản đồ sau đó).
//   const ab = await layTep(url);          // ArrayBuffer; lỗi / khựng: ném lỗi
export async function layTep(url, ms = 15000) {
  const ctl = new AbortController(); let t = 0;
  const keo = () => { clearTimeout(t); t = setTimeout(() => ctl.abort(), ms); };
  keo();
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    if (!r.body || !r.body.getReader) return await r.arrayBuffer();
    const rd = r.body.getReader(), parts = []; let n = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; keo(); parts.push(value); n += value.length; }
    const out = new Uint8Array(n); let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out.buffer;
  } finally { clearTimeout(t); }
}
