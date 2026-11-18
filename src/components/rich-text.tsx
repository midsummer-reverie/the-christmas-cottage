"use client";

import { createElement, Fragment, useRef, useState, type ReactNode } from "react";

type Frame = { tag: string; children: ReactNode[]; value?: string };

function AlignIcon({ alignment }: { alignment: "left" | "center" | "right" }) {
  const lines: Record<typeof alignment, [number, number, number][]> = {
    left: [[2, 4, 14], [2, 8, 10], [2, 12, 13]],
    center: [[3, 4, 12], [5, 8, 8], [3.5, 12, 11]],
    right: [[2, 4, 14], [6, 8, 10], [3, 12, 13]],
  };
  return <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">{lines[alignment].map(([x, y, width]) => <path key={y} d={`M${x} ${y}h${width}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>)}</svg>;
}

const emojiSets = [
  { id: "holiday", label: "🎄 คริสต์มาส", items: ["🎄", "🎅", "🤶", "🧑‍🎄", "🦌", "⛄", "☃️", "❄️", "🌨️", "🎁", "🧦", "🕯️", "🔔", "⭐", "🌟", "✨", "🛷", "🍪", "🥛", "☕", "🏠", "🧣", "🧤", "🎀"] },
  { id: "smileys", label: "😊 ยิ้ม", items: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "😈", "👿", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖"] },
  { id: "people", label: "👋 คน", items: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "🧠", "🦷", "👀", "👁️", "👅", "👄", "💋", "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧔", "👵", "👴", "🧑‍🎄", "👮", "🕵️", "💂", "🥷", "👷", "🫅", "🤴", "👸", "👳", "👲", "🧕", "👼", "🤰", "🧑‍🍼", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "💃", "🕺", "🧘", "🛀", "🛌"] },
  { id: "hearts", label: "💖 หัวใจ", items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💋", "💍", "♡", "♥", "❥"] },
  { id: "animals", label: "🐻 สัตว์และธรรมชาติ", items: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐴", "🦄", "🐝", "🦋", "🐌", "🐞", "🐜", "🕷️", "🦂", "🐍", "🦎", "🦖", "🐙", "🦑", "🦐", "🦀", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐘", "🦒", "🦘", "🦥", "🦦", "🐿️", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃", "🍄", "🌹", "🌺", "🌸", "🌻", "🌞", "🌙", "⭐", "🌟", "✨", "⚡", "🔥", "🌈", "☀️", "☁️", "🌧️", "⛈️", "❄️", "🌊"] },
  { id: "food", label: "🍜 อาหารและเครื่องดื่ม", items: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕", "🫖", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🥄", "🍴", "🥢", "🧂"] },
  { id: "objects", label: "🎨 สิ่งของ", items: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "📷", "📸", "🎥", "📞", "📺", "📻", "🎙️", "⏰", "💡", "🏮", "📔", "📕", "📖", "📚", "📜", "📰", "💰", "🪙", "💳", "✉️", "📧", "📦", "📮", "✏️", "📝", "💼", "📁", "📆", "📈", "📊", "📋", "📌", "📎", "✂️", "🔒", "🔓", "🔑", "🔨", "🛠️", "🗡️", "⚔️", "🛡️", "🔧", "⚙️", "🔗", "🧰", "🧪", "🔬", "🔭", "💊", "🩹", "🩺", "🚪", "🛏️", "🛋️", "🛁", "🧴", "🧹", "🧺", "🧼", "🛒", "🎁", "🎈", "🎉", "🎊", "🎀", "🎗️", "🎟️", "🎫", "🎨", "🎭", "🎮", "🧸", "🪄", "🪅", "🪩"] },
  { id: "symbols", label: "🔣 สัญลักษณ์", items: ["✦", "✧", "♡", "♥", "☆", "★", "☾", "☀", "✚", "✿", "※", "◆", "◇", "♠", "♣", "♦", "♩", "♫", "♬", "░", "▒", "▓", "💯", "💢", "💥", "💫", "💦", "💨", "💬", "💭", "💤", "♨️", "🛑", "⚠️", "🚸", "⛔", "🚫", "🔞", "☢️", "☣️", "⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️", "↕️", "↔️", "↩️", "↪️", "🔃", "🔄", "🔙", "🔚", "🔛", "🔜", "🔝", "✡️", "☯️", "✝️", "☮️", "▶️", "⏩", "⏭️", "⏯️", "◀️", "⏪", "⏮️", "🔼", "⏬", "⏸️", "⏹️", "⏺️", "♀️", "♂️", "✖️", "➕", "➖", "➗", "♾️", "‼️", "⁉️", "❓", "❗", "〰️", "💲", "♻️", "⚜️", "🔱", "⭕", "✅", "☑️", "✔️", "❌", "❎", "©️", "®️", "™️", "#️⃣", "*️⃣", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "⬛", "⬜", "🔶", "🔷", "🔸", "🔹", "🔺", "🔻", "💠", "🔘", "➰", "➿", "〽️", "🔰", "🆗", "🆕", "🆒", "🆙", "🆓", "🆖", "🆘", "🆔", "🅿️", "🈳", "🈹", "🈴", "🈺", "🈯", "🉐", "🈶", "🈚", "🈸", "🈲", "🈵", "㊗️", "㊙️", "🈷️", "🈁", "🔠", "🔡", "🔢", "🔣", "🔤", "🔤"] },
];

const safeColor = (color: string) => /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color);

/** Render only the small BBCode subset supported by the cottage editor. Text is always React-escaped. */
export function RichText({ value }: { value: string }) {
  const source = String(value ?? "").replace(/<br\s*\/?\s*>/gi, "\n");
  const tokens = source.split(/(\[\/?(?:b|i|u|s|list|color|bg|mark|left|center|right|size)\]|\[\*\]|\[(?:color|bg|mark)=#[\da-f]{3,8}\]|\[size=\d{1,2}\]|\r?\n)/gi);
  const root: Frame = { tag: "root", children: [] };
  const stack: Frame[] = [root];
  let key = 0;

  const append = (node: ReactNode) => { stack[stack.length - 1].children.push(node); };
  const trimBreak = (frame: Frame) => {
    const last = frame.children[frame.children.length - 1];
    if (last && typeof last === "object" && "type" in last && last.type === "br") frame.children.pop();
  };
  const popFrame = () => {
    const frame = stack.pop();
    if (!frame) return;
    let node: ReactNode;
    if (frame.tag === "list") node = createElement("ul", { className: "rich-list", key: key++ }, ...frame.children);
    else if (frame.tag === "li") node = createElement("li", { key: key++ }, ...frame.children);
    else if (frame.tag === "color") node = createElement("span", { style: { color: frame.value }, key: key++ }, ...frame.children);
    else if (frame.tag === "bg" || frame.tag === "mark") node = createElement("mark", { className: "rich-highlight", style: { backgroundColor: frame.value }, key: key++ }, ...frame.children);
    else if (["left", "center", "right"].includes(frame.tag)) node = createElement("div", { className: `rich-align rich-align-${frame.tag}`, key: key++ }, ...frame.children);
    else if (frame.tag === "size") node = createElement("span", { className: "rich-size", style: { fontSize: `${frame.value}px` }, key: key++ }, ...frame.children);
    else node = createElement(({ b: "strong", i: "em", u: "u", s: "s" } as const)[frame.tag as "b" | "i" | "u" | "s"] ?? Fragment, { key: key++ }, ...frame.children);
    append(node);
  };

  const closeTo = (tag: string) => {
    const target = stack.map((frame) => frame.tag).lastIndexOf(tag);
    if (target < 1) return;
    while (stack.length - 1 >= target) {
      if (stack[stack.length - 1].tag === "li") trimBreak(stack[stack.length - 1]);
      popFrame();
    }
  };

  for (const token of tokens) {
    if (!token) continue;
    if (/^\r?\n$/.test(token)) {
      append(createElement("br", { key: key++ }));
      continue;
    }
    const opening = token.match(/^\[(b|i|u|s|list|left|center|right)\]$/i);
    if (opening) {
      const tag = opening[1].toLowerCase();
      if (tag === "list") {
        stack.push({ tag: "list", children: [] });
      } else stack.push({ tag, children: [] });
      continue;
    }
    const closing = token.match(/^\[\/(b|i|u|s|list|color|bg|mark|left|center|right|size)\]$/i);
    if (closing) {
      const tag = closing[1].toLowerCase();
      if (tag === "list") closeTo("list");
      else closeTo(tag);
      continue;
    }
    const colorTag = token.match(/^\[(color|bg|mark)=(#[\da-f]{3,8})\]$/i);
    if (colorTag && safeColor(colorTag[2])) {
      stack.push({ tag: colorTag[1].toLowerCase(), value: colorTag[2], children: [] });
      continue;
    }
    const sizeTag = token.match(/^\[size=(\d{1,2})\]$/i);
    if (sizeTag) {
      stack.push({ tag: "size", value: String(Math.min(40, Math.max(10, Number(sizeTag[1])))), children: [] });
      continue;
    }
    if (token.toLowerCase() === "[*]") {
      const listIndex = stack.map((frame) => frame.tag).lastIndexOf("list");
      if (listIndex > 0) {
        while (stack.length - 1 > listIndex) popFrame();
        const current = stack[listIndex].children;
        const last = current[current.length - 1];
        if (last && typeof last === "object" && "type" in last && last.type === "br") current.pop();
        if (stack[stack.length - 1].tag === "li") { trimBreak(stack[stack.length - 1]); popFrame(); }
        stack.push({ tag: "li", children: [] });
      } else append("• ");
      continue;
    }
    append(token);
  }

  while (stack.length > 1) popFrame();
  return <span className="rich-text">{root.children}</span>;
}

function editorValue(value: string) {
  return String(value ?? "").replace(/<br\s*\/?\s*>/gi, "\n");
}

export function RichTextEditor({
  name, defaultValue = "", placeholder, maxLength, required, minLength, rows = 4,
}: {
  name: string; defaultValue?: string; placeholder?: string; maxLength?: number;
  required?: boolean; minLength?: number; rows?: number;
}) {
  const [value, setValue] = useState(() => editorValue(defaultValue));
  const [textColor, setTextColor] = useState("#55785f");
  const [highlightColor, setHighlightColor] = useState("#ffe39a");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState("holiday");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });

  const rememberSelection = (field: HTMLTextAreaElement) => {
    selection.current = { start: field.selectionStart, end: field.selectionEnd };
  };

  const insert = (open: string, close: string, savedSelection = true) => {
    const field = textarea.current;
    if (!field) return;
    const start = savedSelection ? selection.current.start : field.selectionStart;
    const end = savedSelection ? selection.current.end : field.selectionEnd;
    const selected = value.slice(start, end) || "ข้อความ";
    const next = `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`;
    setValue(next);
    selection.current = { start: start + open.length, end: start + open.length + selected.length };
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(selection.current.start, selection.current.end);
    });
  };

  const insertPlainText = (text: string) => {
    const field = textarea.current;
    if (!field) return;
    const { start, end } = selection.current;
    setValue(`${value.slice(0, start)}${text}${value.slice(end)}`);
    selection.current = { start: start + text.length, end: start + text.length };
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(selection.current.start, selection.current.end); });
  };

  const listSelection = () => {
    const field = textarea.current;
    if (!field) return;
    const { start, end } = selection.current;
    const selected = value.slice(start, end) || "รายการ";
    const entries = selected.split(/\r?\n/).filter((line) => line.trim());
    const list = `[list]\n${entries.map((line) => `[*]${line}`).join("\n")}\n[/list]`;
    setValue(`${value.slice(0, start)}${list}${value.slice(end)}`);
    selection.current = { start: start + list.length, end: start + list.length };
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(selection.current.start, selection.current.end); });
  };

  return <div className="rich-editor">
    <div className="rich-toolbar" role="group" aria-label="จัดรูปแบบข้อความ">
      <button type="button" aria-label="ตัวหนา" title="ตัวหนา" onClick={() => insert("[b]", "[/b]")}><b>B</b></button>
      <button type="button" aria-label="ตัวเอียง" title="ตัวเอียง" onClick={() => insert("[i]", "[/i]")}><i>I</i></button>
      <button type="button" aria-label="ขีดเส้นใต้" title="ขีดเส้นใต้" onClick={() => insert("[u]", "[/u]")}><u>U</u></button>
      <button type="button" aria-label="ขีดฆ่า" title="ขีดฆ่า" onClick={() => insert("[s]", "[/s]")}><s>S</s></button>
      <button type="button" aria-label="แทรกลิสต์" title="แทรกลิสต์" onClick={listSelection}>•≡</button>
      <span className="rich-toolbar-divider" aria-hidden="true"/>
      <button type="button" className="rich-align-button" aria-label="จัดชิดซ้าย" title="จัดชิดซ้าย" onClick={() => insert("[left]", "[/left]")}><AlignIcon alignment="left"/></button>
      <button type="button" className="rich-align-button" aria-label="จัดกึ่งกลาง" title="จัดกึ่งกลาง" onClick={() => insert("[center]", "[/center]")}><AlignIcon alignment="center"/></button>
      <button type="button" className="rich-align-button" aria-label="จัดชิดขวา" title="จัดชิดขวา" onClick={() => insert("[right]", "[/right]")}><AlignIcon alignment="right"/></button>
      <select className="rich-size-select" aria-label="ขนาดตัวอักษร" title="ขนาดตัวอักษร" defaultValue="" onChange={(event) => { if (event.target.value) { insert(`[size=${event.target.value}]`, "[/size]", true); event.target.value = ""; } }}>
        <option value="">ขนาด</option>{[10, 12, 16, 20, 24, 32, 40].map((size) => <option key={size} value={size}>{size}px</option>)}
      </select>
      <label className="rich-color-control" title="เลือกสีตัวอักษร"><span>A</span><input aria-label="เลือกสีตัวอักษร" type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)}/></label>
      <button type="button" aria-label="ใช้สีตัวอักษร" title="ใช้สีตัวอักษรกับข้อความที่เลือก" onClick={() => insert(`[color=${textColor}]`, "[/color]", true)}>ใช้สี</button>
      <label className="rich-color-control rich-highlight-control" title="เลือกสีไฮไลต์"><span>H</span><input aria-label="เลือกสีไฮไลต์" type="color" value={highlightColor} onChange={(event) => setHighlightColor(event.target.value)}/></label>
      <button type="button" aria-label="ใช้สีไฮไลต์" title="ใช้ไฮไลต์กับข้อความที่เลือก" onClick={() => insert(`[bg=${highlightColor}]`, "[/bg]", true)}>ไฮไลต์</button>
      <button type="button" aria-label="เปิดคลังอีโมจิ" title="แทรกอีโมจิ" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((open) => !open)}>😀</button>
      <span className="rich-toolbar-hint">เลือกข้อความแล้วกดปุ่มเพื่อจัดรูปแบบ</span>
    </div>
    {emojiOpen && <div className="rich-emoji-panel">
      <div className="rich-emoji-categories" role="tablist" aria-label="หมวดอีโมจิ">{emojiSets.map((set) => <button key={set.id} type="button" role="tab" aria-selected={emojiCategory === set.id} onClick={() => setEmojiCategory(set.id)}>{set.label}</button>)}</div>
      <div className="rich-emoji-grid">{emojiSets.find((set) => set.id === emojiCategory)?.items.map((emoji, index) => <button key={`${emoji}-${index}`} type="button" aria-label={`แทรก ${emoji}`} onClick={() => insertPlainText(emoji)}>{emoji}</button>)}</div>
    </div>}
    <textarea ref={textarea} name={name} value={value} onChange={(event) => { setValue(event.target.value); rememberSelection(event.currentTarget); }} onSelect={(event) => rememberSelection(event.currentTarget)} onClick={(event) => rememberSelection(event.currentTarget)} onKeyUp={(event) => rememberSelection(event.currentTarget)} onBlur={(event) => rememberSelection(event.currentTarget)} placeholder={placeholder} maxLength={maxLength} minLength={minLength} required={required} rows={rows}/>
  </div>;
}
