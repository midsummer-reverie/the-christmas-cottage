"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/profile-avatar";
import { RichText, RichTextEditor } from "@/components/rich-text";
import { addChristmasPeopleMessage, deleteChristmasPeopleMessage, deleteChristmasPerson, saveChristmasPerson } from "./actions";

export type Person = { id: string; name: string; imageUrl: string | null };
export type AlbumMessage = { id: string; personId: string; memberId: string; message: string; paperColor: string; inkColor: string; isBold: boolean; isItalic: boolean; isUnderline: boolean; createdAt: string; senderName: string; avatarUrl: string | null };
type Draft = { name: string; imageUrl: string };
const paperChoices = [
  { id: "cream", label: "วานิลลา", color: "#fff0c9" }, { id: "rose", label: "กุหลาบ", color: "#f7dce0" },
  { id: "mint", label: "มินต์", color: "#dcebd5" }, { id: "blue", label: "ฟ้า", color: "#dce9f3" }, { id: "lavender", label: "ลาเวนเดอร์", color: "#e9e0f2" },
];
export default function ChristmasPeopleClient({ people, messages, currentMemberId, isAdmin }: { people: Person[]; messages: AlbumMessage[]; currentMemberId: string | null; isAdmin: boolean }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [turnDirection, setTurnDirection] = useState<"open" | "next" | "previous">("open");
  const [modalOpen, setModalOpen] = useState(false);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", imageUrl: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messagePerson, setMessagePerson] = useState<Person | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [messagePaper, setMessagePaper] = useState("cream");
  const [selectedMessage, setSelectedMessage] = useState<AlbumMessage | null>(null);
  const pageCount = Math.max(1, Math.ceil(people.length / 2));
  const currentPage = Math.min(page, pageCount - 1);
  const visiblePeople = people.slice(currentPage * 2, currentPage * 2 + 2);

  function openAdd() {
    setActivePerson(null);
    setDraft({ name: "", imageUrl: "" });
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(person: Person) {
    setActivePerson(person);
    setDraft({ name: person.name, imageUrl: person.imageUrl ?? "" });
    setMessage("");
    setModalOpen(true);
  }

  function openMessage(person: Person) {
    setMessagePerson(person);
    setMessageFeedback("");
    setMessagePaper("cream");
    setMessageModalOpen(true);
  }

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messagePerson) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    const result = await addChristmasPeopleMessage({ personId: messagePerson.id, message: String(data.get("message") ?? ""), paperColor: messagePaper });
    setBusy(false);
    if (!result.ok) { setMessageFeedback(result.message); return; }
    setMessageModalOpen(false);
    router.refresh();
  }

  async function removeMessage(note: AlbumMessage) {
    if (!window.confirm(`ลบกระดาษโน้ตของ ${note.senderName} ใช่ไหม?`)) return;
    const result = await deleteChristmasPeopleMessage(note.id);
    if (!result.ok) window.alert(result.message);
    else router.refresh();
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await saveChristmasPerson(activePerson?.id ?? null, draft.name, draft.imageUrl);
    setBusy(false);
    if (!result.ok) { setMessage(result.message); return; }
    setModalOpen(false);
    if (!activePerson) setPage(Math.floor(people.length / 2));
    router.refresh();
  }

  async function remove() {
    if (!activePerson || !window.confirm(`ลบรูปของ ${activePerson.name} ออกจากอัลบั้มใช่ไหม?`)) return;
    setBusy(true);
    const result = await deleteChristmasPerson(activePerson.id);
    setBusy(false);
    if (!result.ok) { setMessage(result.message); return; }
    setModalOpen(false);
    router.refresh();
  }

  return <>
    {isAdmin && <button className="album-admin-corner" type="button" onClick={openAdd} aria-label="เพิ่มรูปในอัลบั้ม" title="เพิ่มรูปในอัลบั้ม">＋<span>เพิ่มรูป</span></button>}
    {!people.length ? <div className="people-empty">📸<p>{isAdmin ? "กดปุ่มมุมอัลบั้มเพื่อเริ่มแปะรูปแรก" : "อัลบั้มกำลังรอภาพความทรงจำแรกอยู่"}</p></div> : <div className={`album-page-turn album-page-turn-${turnDirection}`} key={currentPage}><div className="people-grid">{visiblePeople.map((person, index) => {
      const personMessages = messages.filter((note) => note.personId === person.id);
      const sideMessages = personMessages.slice(0, 4);
      const overflowMessages = personMessages.slice(4);
      return <div className={`album-person-column person-column-${index % 2}`} key={person.id}><div className="person-album-row"><article className={`album-photo-card person-tone-${(currentPage * 2 + index) % 5}`}>
        <div className="polaroid-photo">{person.imageUrl ? <img src={person.imageUrl} alt={person.name} loading="lazy" referrerPolicy="no-referrer"/> : <span aria-hidden="true">🎄</span>}</div>
        <b className="polaroid-name">{person.name}</b>
        {isAdmin && <button className="photo-edit-corner" type="button" onClick={() => openEdit(person)} aria-label={`แก้ไขรูปของ ${person.name}`} title="แก้ไขรูปนี้">✎</button>}
      </article><aside className="person-note-rail" aria-label={`โน้ตถึง ${person.name}`}>
        {sideMessages.map((note, noteIndex) => <div className={`person-note-wrap note-tilt-${noteIndex % 3}`} key={note.id}>
          <button className={`person-note-peek paper-${note.paperColor}`} type="button" onClick={() => setSelectedMessage(note)} aria-label={`อ่านข้อความจาก ${note.senderName}`}>
            <span className="person-note-from">ข้อความจาก</span><ProfileAvatar value={note.avatarUrl} alt="" className="person-note-avatar"/><b>{note.senderName}</b>
          </button>
          {(note.memberId === currentMemberId || isAdmin) && <button className="person-note-delete" type="button" onClick={() => void removeMessage(note)} aria-label="ลบข้อความนี้" title="ลบโน้ต">×</button>}
        </div>)}
        <button className="person-note-add" type="button" onClick={() => openMessage(person)}>＋ ฝากโน้ต</button>
      </aside></div>{overflowMessages.length > 0 && <section className="person-note-overflow" aria-label={`โน้ตเพิ่มเติมถึง ${person.name}`}>
        {overflowMessages.map((note, noteIndex) => <div className={`person-note-wrap note-tilt-${noteIndex % 3}`} key={note.id}>
          <button className={`person-note-peek paper-${note.paperColor}`} type="button" onClick={() => setSelectedMessage(note)} aria-label={`อ่านข้อความจาก ${note.senderName}`}>
            <span className="person-note-from">ข้อความจาก</span><ProfileAvatar value={note.avatarUrl} alt="" className="person-note-avatar"/><b>{note.senderName}</b>
          </button>
          {(note.memberId === currentMemberId || isAdmin) && <button className="person-note-delete" type="button" onClick={() => void removeMessage(note)} aria-label="ลบข้อความนี้" title="ลบโน้ต">×</button>}
        </div>)}
      </section>}</div>;
    })}</div>{pageCount > 1 && <nav className="album-pagination" aria-label="หน้าอัลบั้ม"><button type="button" onClick={() => { setTurnDirection("previous"); setPage(Math.max(0, currentPage - 1)); }} disabled={currentPage === 0}>← ก่อนหน้า</button><span><b>{String(currentPage + 1).padStart(2, "0")}</b><i> / </i>{String(pageCount).padStart(2, "0")}<small>TURN THE PAGE</small></span><button type="button" onClick={() => { setTurnDirection("next"); setPage(Math.min(pageCount - 1, currentPage + 1)); }} disabled={currentPage >= pageCount - 1}>หน้าถัดไป →</button></nav>}</div>}
    {modalOpen && <div className="album-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModalOpen(false); }}>
      <section className="album-edit-modal" role="dialog" aria-modal="true" aria-labelledby="album-modal-title">
        <button className="album-modal-close" type="button" disabled={busy} onClick={() => setModalOpen(false)} aria-label="ปิด">×</button>
        <div className="album-modal-decor" aria-hidden="true">🎀　✦　❄</div>
        <span className="album-modal-kicker">A LITTLE MEMORY</span>
        <h2 id="album-modal-title">{activePerson ? "แก้ไขรูปในอัลบั้ม" : "แปะรูปลงอัลบั้ม"}</h2>
        <p>ใส่ชื่อกับลิงก์รูปภาพ แล้วเก็บไว้ในอัลบั้มความทรงจำของเรา</p>
        <form onSubmit={save}>
          <label>ชื่อที่เขียนใต้รูป<input autoFocus required minLength={2} maxLength={60} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="ชื่อเพื่อนในคอทเทจ"/></label>
          <label>ลิงก์รูปภาพ<input type="url" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder="https://…"/></label>
          <div className="album-modal-preview"><div className="polaroid-preview-card"><div className="polaroid-photo">{draft.imageUrl ? <img src={draft.imageUrl} alt="ตัวอย่างรูป"/> : <span aria-hidden="true">🎄</span>}</div><b className="polaroid-name">{draft.name || "ชื่อในอัลบั้ม"}</b></div></div>
          {message && <div className="album-modal-message" role="alert">{message}</div>}
          <div className="album-modal-actions"><button className="album-save-button" type="submit" disabled={busy}>{busy ? "กำลังบันทึก…" : activePerson ? "บันทึกการแก้ไข" : "✦ แปะลงอัลบั้ม"}</button>{activePerson && <button className="album-delete-button" type="button" disabled={busy} onClick={() => void remove()}>เอารูปออก</button>}</div>
        </form>
      </section>
    </div>}
    {messageModalOpen && messagePerson && <div className="album-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setMessageModalOpen(false); }}>
      <section className="album-edit-modal message-edit-modal" role="dialog" aria-modal="true" aria-labelledby="message-modal-title">
        <button className="album-modal-close" type="button" disabled={busy} onClick={() => setMessageModalOpen(false)} aria-label="ปิด">×</button>
        <div className="album-modal-decor" aria-hidden="true">💌　✦　🕯️</div><span className="album-modal-kicker">A LITTLE NOTE FOR</span>
        <h2 id="message-modal-title">{messagePerson.name}</h2><p>เขียนข้อความพร้อมตกแต่งได้เต็มที่ แล้วเลือกสีกระดาษ</p>
        {currentMemberId ? <form onSubmit={submitMessage}>
          <RichTextEditor name="message" placeholder="ฝากคำอวยพรหรือข้อความน่ารัก ๆ ไว้ตรงนี้…" maxLength={4000} minLength={1} required rows={6}/>
          <fieldset className="note-choice-field"><legend>เลือกสีกระดาษ</legend><div className="note-swatch-row">{paperChoices.map((choice) => <label className={`note-paper-swatch ${messagePaper === choice.id ? "selected" : ""}`} key={choice.id} title={choice.label}><input type="radio" name="paperColorChoice" value={choice.id} checked={messagePaper === choice.id} onChange={() => setMessagePaper(choice.id)}/><span style={{ background: choice.color }}/><small>{choice.label}</small></label>)}</div></fieldset>
          {messageFeedback && <div className="album-modal-message" role="alert">{messageFeedback}</div>}
          <div className="album-modal-actions"><button className="album-save-button" type="submit" disabled={busy}>{busy ? "กำลังแปะโน้ต…" : "✦ แปะโน้ตลงสมุด"}</button></div>
        </form> : <div className="note-signin-prompt"><p>เข้าสู่ระบบก่อน แล้วค่อยฝากโน้ตถึง {messagePerson.name} ได้นะ</p><Link className="album-save-button" href={`/sign-in?returnTo=${encodeURIComponent("/christmas-people")}`}>เข้าสู่ระบบเพื่อเขียนโน้ต</Link></div>}
      </section>
    </div>}
    {selectedMessage && <div className="album-modal-backdrop note-reading-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMessage(null); }}>
      <section className={`album-edit-modal note-reading-modal paper-${selectedMessage.paperColor}`} role="dialog" aria-modal="true" aria-labelledby="note-reading-title">
        <button className="album-modal-close" type="button" onClick={() => setSelectedMessage(null)} aria-label="ปิด">×</button>
        <div className="album-modal-decor" aria-hidden="true">💌　✦　❄</div><span className="album-modal-kicker">A LITTLE NOTE FOR</span>
        <h2 id="note-reading-title">{people.find((person) => person.id === selectedMessage.personId)?.name ?? "เพื่อนในอัลบั้ม"}</h2>
        <div className="note-reading-sender"><ProfileAvatar value={selectedMessage.avatarUrl} alt="" className="person-note-avatar"/><span>ข้อความจาก <b>{selectedMessage.senderName}</b></span></div>
        <div className="note-reading-content"><RichText value={selectedMessage.message}/></div>
        {(selectedMessage.memberId === currentMemberId || isAdmin) && <button className="album-delete-button note-reading-delete" type="button" onClick={() => { void removeMessage(selectedMessage); setSelectedMessage(null); }}>ลบโน้ตนี้</button>}
      </section>
    </div>}
  </>;
}
