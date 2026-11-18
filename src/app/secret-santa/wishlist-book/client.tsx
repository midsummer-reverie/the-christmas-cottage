"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RichText } from "@/components/rich-text";
import ProfileAvatar from "@/components/profile-avatar";
import LogoutButton from "@/app/account/logout-button";

type Person = {
  memberId: string;
  accountDisplayName: string;
  displayName: string;
  avatarUrl: string | null;
  joinsOnline: boolean;
  joinsPhysical: boolean;
};
type Entry = { id: string; memberId: string; channel: "online" | "physical"; item: string; isAvoid: boolean };

export default function WishlistBookClient({
  eventName,
  member,
  people,
  entries,
}: {
  eventName: string | null;
  member: { accountDisplayName: string; displayName: string; avatarUrl: string | null };
  people: Person[];
  entries: Entry[];
}) {
  const [selected, setSelected] = useState<Person | null>(null);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  const selectedEntries = selected ? entries.filter((entry) => entry.memberId === selected.memberId) : [];

  return <main className="santa-page wishlist-book-page">
    <div className="santa-page-decor" aria-hidden="true"><span className="santa-decor-santa">🎅🏻</span><span className="santa-decor-gifts">🎁 ✨ 🎁</span></div>
    <header className="santa-header">
      <Link href="/secret-santa" className="santa-back">← กลับไป Secret Santa</Link>
      <div className="santa-brand"><span>✳</span> THE CHRISTMAS COTTAGE</div>
      <div className="santa-header-actions"><ProfileAvatar value={member.avatarUrl} className="santa-header-avatar"/><span className="santa-account">{member.accountDisplayName}<small>RoleplayTH: {member.displayName}</small></span><Link className="santa-account-link" href="/account">บัญชี</Link><LogoutButton /></div>
    </header>
    <div className="santa-content">
      <div className="santa-title-block"><div className="santa-kicker">A SHARED LITTLE BOOK</div><h1>สมุดรวม Wishlist</h1><p>เปิดดูความชอบของเพื่อน ๆ ได้ โดยไม่มีข้อมูลการจับคู่ Secret Santa อยู่ในหน้านี้</p></div>
      {!eventName ? <section className="santa-card empty-event"><span className="santa-card-icon">📖</span><h2>ยังไม่มีสมุด Wishlist</h2><p>รอแอดมินเปิดกิจกรรม Secret Santa ก่อนนะ</p></section> : <>
        <section className="santa-card wishlist-book-intro"><span>🎄</span><div><b>{eventName}</b><p>{people.length} รายชื่อ · แสดงเฉพาะชื่อกับ Wishlist ที่เจ้าของเพิ่มไว้</p></div><span className="book-stamp">NORTHWOOD<br/>CHRISTMAS POST</span></section>
        <section className="wishlist-book-list" aria-label="รายชื่อสมาชิกและ Wishlist">
          {people.map((person, index) => <article className={`wishlist-book-entry book-tone-${index % 4}`} key={person.memberId}>
            <div className="book-note-header"><ProfileAvatar value={person.avatarUrl} className="book-avatar"/><span className="book-owner"><b>{person.accountDisplayName || person.displayName}</b><small>RoleplayTH: {person.displayName}</small></span><span className="book-channels">{[person.joinsOnline && "บนเว็บ", person.joinsPhysical && "ของจริง"].filter(Boolean).join(" · ")}</span><button className={`book-toggle ${selected?.memberId === person.memberId ? "is-selected" : ""}`} type="button" aria-label={`เปิด Wishlist ของ ${person.accountDisplayName || person.displayName}`} onClick={() => setSelected(person)}>＋</button></div>
            <button className="book-note-open" type="button" onClick={() => setSelected(person)}>เปิดดู Wishlist <span>✦</span></button>
          </article>)}
          {!people.length && <div className="santa-card empty-event"><p>ยังไม่มีรายชื่อผู้เข้าร่วม</p></div>}
        </section>
      </>}
      <footer className="santa-footer">รวมความชอบเล็ก ๆ ไว้ในสมุดเล่มเดียว ✦</footer>
    </div>

    {selected && <div className="wishlist-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="wishlist-modal wishlist-book-modal" role="dialog" aria-modal="true" aria-labelledby="wishlist-book-modal-title">
        <button className="wishlist-modal-close" type="button" onClick={() => setSelected(null)} aria-label="ปิด Wishlist">×</button>
        <div className="wishlist-modal-kicker">A LITTLE CHRISTMAS GIFT GUIDE</div>
        <div className="wishlist-postcard-owner"><ProfileAvatar value={selected.avatarUrl} className="book-avatar"/><div><h2 id="wishlist-book-modal-title">Wishlist ของ {selected.accountDisplayName || selected.displayName}</h2><p>RoleplayTH: {selected.displayName}</p></div><span>✉</span></div>
        <div className="wishlist-modal-lists">
          {selected.joinsOnline && <section className="wishlist-postcard-channel"><h3>💌 ของขวัญบนเว็บ</h3><BookList title="♡ อยากได้" rows={selectedEntries.filter((entry) => entry.channel === "online" && !entry.isAvoid)}/><BookList title="✧ ไม่อยากได้" rows={selectedEntries.filter((entry) => entry.channel === "online" && entry.isAvoid)} empty="ไม่ได้ระบุ" avoid/></section>}
          {selected.joinsPhysical && <section className="wishlist-postcard-channel"><h3>📦 ของขวัญจริง</h3><BookList title="♡ อยากได้" rows={selectedEntries.filter((entry) => entry.channel === "physical" && !entry.isAvoid)}/><BookList title="✧ ไม่อยากได้" rows={selectedEntries.filter((entry) => entry.channel === "physical" && entry.isAvoid)} empty="ไม่ได้ระบุ" avoid/></section>}
          {!selectedEntries.length && <p className="book-empty">ยังไม่ได้เพิ่ม Wishlist ไว้ในสมุดเล่มนี้</p>}
        </div>
        <div className="wishlist-modal-footer">With warm wishes from Northwood ✦</div>
      </section>
    </div>}
  </main>;
}

function BookList({ title, rows, empty = "ยังไม่ได้เพิ่มรายการ", avoid = false }: { title: string; rows: Entry[]; empty?: string; avoid?: boolean }) {
  return <div className={`book-list-section ${avoid ? "book-avoid" : ""}`}><b>{title}</b>{rows.length ? <ul>{rows.map((row) => <li key={row.id}><RichText value={row.item}/></li>)}</ul> : <p>{empty}</p>}</div>;
}
