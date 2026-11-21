// Câu mô tả thuộc tính — đúng luật của game gốc (bản 2 js/stats.js attrText / skPlusText), bỏ phần phụ thuộc nhân vật
// đang chơi (ghi chú "không thuộc môn phái" của skPlusText). Kiểm từng câu với hàm gốc: tools/verify/data-fidelity.html
//
//   const T = makeAttrText(attrJson, skillsJson.skills);   // assets/data/attr.json, assets/data/skills.json
//   T.text("lifemax_v", [120])        -> "Sinh lực tối đa: +120 điểm"
//   T.key(85)                          -> "lifemax_v"
//   T.range("lifemax_v", [[50, 80]])  -> { min: "...+50...", max: "...+80..." }

export function makeAttrText(attr, skills) {
  const DESC = {};
  for (const a of attr.attrs) if (a.vi != null) DESC[a.key] = a.vi;
  Object.assign(DESC, attr.descOnly);
  const SER = attr.serDmg || {};
  const key = (id) => (attr.attrs[id] ? attr.attrs[id].key : `#${id}`);
  // "Tất cả kỹ năng: +N cấp" / "Kỹ năng X: +N cấp"
  const skPlus = (t) => {
    const r = Math.round(t[0] || 0), e = t[2] || 0;
    if (!(e > 0)) return `Tất cả kỹ năng: +${r} cấp`;
    const s = skills[e];
    return `Kỹ năng ${s ? s.n : "#" + e}: +${r} cấp`;
  };
  // Mẫu: #<chữ><1|2|3|A><dấu> — số = tham số 1/2/3 (A = tham số 1 / 256); dấu "+" thêm "+" khi > 0, "~" thêm "-";
  // chữ "l" = tên võ công. Sau đó bỏ mẫu thừa, thẻ màu; "Kỹ năng N" -> tên võ công N.
  const text = (k, t) => {
    k = SER[k] || k;
    if (k === "allskill_v") return skPlus(t);
    const e = DESC[k];
    if (!e) return k + ": " + t.filter((s) => s).join(" / ");
    return e
      .replace(/#([a-zA-Z])([123A])([-+~%]?)/g, (s, o, a, c) => {
        const r = a === "A" ? Math.floor((t[0] || 0) / 256) : t[+a - 1] || 0;
        return o === "l" ? (skills[r] ? skills[r].n : "#" + r) : (c === "+" && r > 0 ? "+" : c === "~" && r > 0 ? "-" : "") + r;
      })
      .replace(/#[a-zA-Z][123A][-+~]?/g, "")
      .replace(/<\/?color(?:=[^>]*)?>|<color>/gi, "")
      .replace(/Kỹ năng (\d+)/, (s, o) => (skills[o] ? "Kỹ năng " + skills[o].n : s));
  };
  const range = (k, p) => ({ min: text(k, p.map((x) => x[0])), max: text(k, p.map((x) => x[1])) });
  return { text, key, range };
}
