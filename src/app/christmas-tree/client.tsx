"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichText, RichTextEditor } from "@/components/rich-text";
import { treeDecorationSlots } from "@/lib/christmas-tree";
import { deleteTreeOrnament, submitTreeOrnament, updateTreeOrnament } from "./actions";

type Ornament = { id: string; memberId: string; displayName: string; roleplayName: string; imageUrl: string; greeting: string; pageNumber: number; slot: number };

export default function ChristmasTreeClient({ memberName, memberId, isAdmin, ornaments }: { memberName: string | null; memberId: string | null; isAdmin: boolean; ornaments: Ornament[] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Ornament | null>(null);
  const [editing, setEditing] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const stage = useRef<HTMLElement>(null);
  const pageCount = Math.max(1, ...ornaments.map((ornament) => ornament.pageNumber));
  const visiblePage = Math.min(currentPage, pageCount);
  const visibleOrnaments = ornaments.filter((ornament) => ornament.pageNumber === visiblePage);
  const bySlot = new Map(visibleOrnaments.map((ornament) => [ornament.slot, ornament]));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await submitTreeOrnament(new FormData(event.currentTarget));
    setMessage(result.message);
    if (result.ok) {
      form.current?.reset();
      setFormVersion((version) => version + 1);
      if (result.pageNumber) setCurrentPage(result.pageNumber);
      router.refresh();
      requestAnimationFrame(() => stage.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    setBusy(false);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalBusy(true);
    setModalMessage("");
    const result = await updateTreeOrnament(new FormData(event.currentTarget));
    if (result.ok) {
      setSelected(null);
      setEditing(false);
      setMessage(result.message);
      router.refresh();
    } else setModalMessage(result.message);
    setModalBusy(false);
  }

  async function removeSelected() {
    if (!selected || !window.confirm("ลบของตกแต่งชิ้นนี้ออกจากต้นคริสต์มาสใช่ไหม?")) return;
    setModalBusy(true);
    setModalMessage("");
    const result = await deleteTreeOrnament(selected.id);
    if (result.ok) {
      setSelected(null);
      setEditing(false);
      setMessage(result.message);
      router.refresh();
    } else setModalMessage(result.message);
    setModalBusy(false);
  }

  return <main className="christmas-tree-page">
    <header className="tree-header">
      <Link href="/?view=activities">← กลับไปรายการกิจกรรม</Link>
      <span>✳ THE CHRISTMAS COTTAGE</span>
      <span className="tree-count">{ornaments.length} ชิ้น · หน้า {visiblePage} / {pageCount}</span>
    </header>

    <div className="tree-content">
      <div className="tree-intro"><span>✦ LIVING ROOM ✦</span><h1>The Christmas Tree</h1><p>แขวนของตกแต่ง แล้วฝากคำอวยพรไว้ให้คนที่แวะมา</p></div>

      <section ref={stage} key={visiblePage} className="tree-stage tree-stage-page-turn" aria-label={`ต้นคริสต์มาสในห้องนั่งเล่น หน้า ${visiblePage}`}>
        <div className="tree-stage-wash"/>
        {treeDecorationSlots.map((slot) => {
          const ornament = bySlot.get(slot.id);
          const position = { left: `${slot.x}%`, top: `${slot.y}%`, animationDelay: `${(slot.id % 8) * 55}ms` };
          return ornament ? <button key={slot.id} className="tree-ornament" style={position} type="button" onClick={() => { setSelected(ornament); setEditing(false); setModalMessage(""); }} aria-label={`อ่านคำอวยพรจาก ${ornament.displayName}`} title="กดเพื่ออ่านคำอวยพร">
            <img src={ornament.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/>
          </button> : <span key={slot.id} className="tree-empty-slot" style={position} aria-hidden="true"/>;
        })}
        <div className="tree-stage-caption"><span>❄</span> Rockin' around the Christmas tree · Let the Christmas spirit ring <span>❄</span></div>
      </section>
      <nav className="tree-page-nav" aria-label="หน้าอัลบั้มต้นคริสต์มาส">
        <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, pageCount) - 1))} disabled={visiblePage <= 1}>← ก่อนหน้า</button>
        <div className="tree-page-indicator"><span>TURN THE PAGE</span><b>{String(visiblePage).padStart(2, "0")} <i>/</i> {String(pageCount).padStart(2, "0")}</b><small>{visibleOrnaments.length} / {treeDecorationSlots.length} ที่แขวนในหน้านี้</small></div>
        <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, Math.min(page, pageCount) + 1))} disabled={visiblePage >= pageCount}>หน้าถัดไป →</button>
      </nav>

      <div className="tree-lower-content">
        <section className="tree-form-card">
          <div className="tree-card-icon">🎀</div>
          <div className="tree-card-kicker">ADD A LITTLE MAGIC</div>
          <h2>มาช่วยตกแต่งต้นไม้กัน</h2>
          <p>วางลิงก์ภาพตกแต่ง PNG แล้วเขียนคำอวยพร ระบบจะหาหน้าที่มีช่องว่างให้เอง ถ้าทุกหน้าเต็มก็เปิดหน้าถัดไปให้โดยอัตโนมัติ</p>
          {memberName ? <form key={formVersion} ref={form} className="tree-form" onSubmit={submit}>
            <label className="tree-field"><span>ลิงก์ภาพตกแต่ง PNG</span><input name="imageUrl" type="url" inputMode="url" placeholder="https://example.com/ornament.png" maxLength={2048} required/></label>
            <label className="tree-field"><span>คำอวยพรของคุณ</span><RichTextEditor name="greeting" placeholder="ขอให้ฤดูหนาวนี้เต็มไปด้วยรอยยิ้ม…" maxLength={600} required rows={3}/></label>
            {message && <div className={`tree-message ${message.startsWith("แขวน") ? "tree-message-success" : ""}`} role="status" aria-live="polite">{message}</div>}
            <button className="tree-submit" disabled={busy}>{busy ? "กำลังแขวนของตกแต่ง…" : "แขวนบนต้นคริสต์มาส ✨"}</button>
          </form> : <div className="tree-sign-in"><span>🔐</span><p>เข้าสู่ระบบก่อน แล้วมาร่วมตกแต่งต้นคริสต์มาสด้วยกันนะ</p><Link href={`/sign-in?returnTo=${encodeURIComponent("/christmas-tree")}`}>เข้าสู่ระบบ</Link></div>}
        </section>
        <aside className="tree-note"><span>✧</span><h3>แตะของตกแต่งบนต้นไม้</h3><p>แต่ละชิ้นซ่อนคำอวยพรจากสมาชิกไว้ ลองกดดูได้เลย</p><div className="tree-note-stamp">MADE WITH LOVE<br/>IN ELYSIAN</div></aside>
      </div>
      <footer className="tree-footer">✦ THE CHRISMAS COTTAGE ✦</footer>
    </div>

    {selected && <div className="greeting-backdrop" role="presentation" onClick={() => { if (!modalBusy) { setSelected(null); setEditing(false); } }}>
      <section className="greeting-card" role="dialog" aria-modal="true" aria-labelledby="greeting-title" onClick={(event) => event.stopPropagation()}>
        <button className="greeting-close" type="button" onClick={() => { setSelected(null); setEditing(false); }} aria-label="ปิดคำอวยพร" disabled={modalBusy}>×</button>
        {editing ? <>
          <div className="greeting-sparkle">✦　แก้ไขของตกแต่ง　✧</div>
          <h2 id="greeting-title">แก้ไขของตกแต่ง</h2>
          <form key={selected.id} className="ornament-edit-form" onSubmit={saveEdit}>
            <input type="hidden" name="ornamentId" value={selected.id}/>
            <label>ลิงก์ภาพ PNG<input name="imageUrl" type="url" defaultValue={selected.imageUrl} maxLength={2048} required/></label>
            <label>คำอวยพร<RichTextEditor key={`${selected.id}-greeting`} name="greeting" defaultValue={selected.greeting} maxLength={600} required rows={4}/></label>
            {modalMessage && <div className="tree-message" role="alert">{modalMessage}</div>}
            <div className="greeting-actions"><button type="button" className="greeting-action secondary" onClick={() => { setEditing(false); setModalMessage(""); }} disabled={modalBusy}>ยกเลิก</button><button className="greeting-action" disabled={modalBusy}>{modalBusy ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}</button></div>
          </form>
        </> : <>
          <div className="greeting-sparkle">✦　❄　✧</div>
          <div className="greeting-image"><img src={selected.imageUrl} alt="ของตกแต่งคริสต์มาส" referrerPolicy="no-referrer"/></div>
          <h2 id="greeting-title">คำอวยพรจาก {selected.displayName}</h2>
          <div className="greeting-roleplay-name">RoleplayTH: {selected.roleplayName}</div>
          <div className="greeting-copy"><RichText value={selected.greeting}/></div>
          <div className="greeting-signoff">ส่งด้วยความอบอุ่น ✧</div>
          {modalMessage && <div className="tree-message" role="alert">{modalMessage}</div>}
          {(selected.memberId === memberId || isAdmin) && <div className="greeting-actions">
            {selected.memberId === memberId && <button type="button" className="greeting-action secondary" onClick={() => { setEditing(true); setModalMessage(""); }}>แก้ไขของตกแต่ง</button>}
            <button type="button" className="greeting-action danger" onClick={removeSelected} disabled={modalBusy}>{modalBusy ? "กำลังลบ…" : "ลบของตกแต่ง"}</button>
          </div>}
        </>}
      </section>
    </div>}
  </main>;
}
