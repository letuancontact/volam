// Phím tắt của client (ui\autoexec.lua -> assets/ui/hud/hud.json hotkeys / phrases — tools/build-hud-pack.mjs).
// Đổi phím bấm sang tên phím client ("Ctrl+`", "Alt+1", "Shift+1", "F3", "NUM2", "Q", "Esc", "Del", "Left"…), tra việc client gắn với
// phím (Open([[status]]), Switch([[horse]]), ShortcutSkill(0), SayPhrase(3), MoveTo(16, 0), Zoom([[in]])…) rồi gọi việc tương ứng
// của game (act). Việc game chưa có -> báo 1 câu (act.todo).
//
//   const K = new Hotkeys(hud.hotkeys, act); addEventListener("keydown", (e) => K.handle(e));
//   act = { open(name), toggle(name), focusChat(), clearChat(), skill(i), useItem(i), phrase(i), move(dir8), turn(+1|-1), zoom(+1|-1),
//           exit(), screenshot(), todo(text) }

// e.code -> tên phím client
const CODE = { Escape: "Esc", Delete: "Del", Insert: "Insert", Tab: "Tab", Enter: "Enter", NumpadEnter: "Enter", ArrowLeft: "Left", ArrowRight: "Right",
  ArrowUp: "Up", ArrowDown: "Down", Backquote: "`", Equal: "=", Minus: "-", NumpadAdd: "+", NumpadSubtract: "-", PrintScreen: "PrintScreen", Space: "Space" };

export function keyName(e) {
  const c = e.code || "";
  let k = /^Key[A-Z]$/.test(c) ? c.slice(3) : /^Digit\d$/.test(c) ? c.slice(5) : /^Numpad\d$/.test(c) ? "NUM" + c.slice(6) : /^F\d{1,2}$/.test(c) ? c : CODE[c];
  if (!k) return null;
  let shift = e.shiftKey;
  if (c === "Equal" && shift) { k = "+"; shift = false; } // "+" của client = phím +, không tính Shift
  return (e.ctrlKey ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + (shift ? "Shift+" : "") + k;
}

// "Open([[status]])" -> ["Open", ["status"]]; "MoveTo(16, 0)" -> ["MoveTo", [16, 0]]
export function parseCmd(s) {
  const m = /^\s*(\w+)\((.*)\)\s*$/.exec(s || "");
  if (!m) return null;
  const args = m[2].trim() ? m[2].split(",").map((a) => { a = a.trim(); const t = /^\[\[(.*)\]\]$/.exec(a) || /^"(.*)"$/.exec(a); return t ? t[1] : +a; }) : [];
  return [m[1], args];
}

// tên việc client -> chữ hiện khi game chưa có
const TODO = {
  RequestScriptTable: "Bảng sự kiện", Replay: "Ghi hình", GMCommand_1: "Lệnh GM", SwitchPrivateMsgMode: "Chế độ tin mật", OpenFuLiBattleReportUi: "Chiến báo phúc lợi",
};

export class Hotkeys {
  constructor(list, act) {
    this.act = act;
    this.map = new Map();
    for (const h of list || []) if (!this.map.has(h.key)) this.map.set(h.key, h.cmd); // phím trùng: dòng đầu thắng
  }
  cmdOf(name) { return this.map.get(name) || null; }
  // true nếu phím có việc (đã chặn mặc định của trình duyệt)
  handle(e) {
    const name = keyName(e), cmd = name && this.map.get(name);
    if (!cmd) return false;
    const p = parseCmd(cmd);
    if (!p) return false;
    e.preventDefault();
    this.run(p[0], p[1], name);
    return true;
  }
  run(fn, a, key) {
    const act = this.act;
    switch (fn) {
      case "Open": return act.open(a[0], key);
      case "Switch": return act.toggle(a[0], key);
      case "Focus": return act.focusChat();
      case "ClearMessage": return act.clearChat();
      case "ShortcutSkill": return act.skill(a[0], key);
      case "ShortcutUseItem": return act.useItem(a[0], key);
      case "SayPhrase": return act.phrase(a[0]);
      case "MoveTo": return act.move(a[0] / 8); // client: 0, 8, 16 … 56 = 8 hướng × 8 (hướng engine 64 bậc)
      case "TurnTo": return act.turn(a[0] ? 1 : -1);
      case "Zoom": return act.zoom(a[0] === "in" ? 1 : -1);
      case "ExitGame": case "Exit": return act.exit();
      case "PrintScreen": return act.screenshot();
      default: return act.todo(`${key}: ${TODO[fn] || TODO[fn.replace(/_\d+$/, "_1")] || fn} — chưa có`);
    }
  }
}
