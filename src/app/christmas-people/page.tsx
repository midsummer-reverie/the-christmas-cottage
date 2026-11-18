import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import LogoutButton from "@/app/account/logout-button";
import ProfileAvatar from "@/components/profile-avatar";
import { getCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { christmasPeople, christmasPeopleMessages, members } from "@/lib/db/schema";
import ChristmasPeopleClient, { type AlbumMessage, type Person } from "./client";

export const dynamic = "force-dynamic";

export default async function ChristmasPeoplePage() {
  const currentMember = await getCurrentMember();
  const db = requireDb();
  const [peopleRows, messageRows] = await Promise.all([
    db.select({ id: christmasPeople.id, name: christmasPeople.name, imageUrl: christmasPeople.imageUrl }).from(christmasPeople).orderBy(asc(christmasPeople.createdAt)),
    db.select({ id: christmasPeopleMessages.id, personId: christmasPeopleMessages.personId, memberId: christmasPeopleMessages.memberId, message: christmasPeopleMessages.message, paperColor: christmasPeopleMessages.paperColor, inkColor: christmasPeopleMessages.inkColor, isBold: christmasPeopleMessages.isBold, isItalic: christmasPeopleMessages.isItalic, isUnderline: christmasPeopleMessages.isUnderline, createdAt: christmasPeopleMessages.createdAt, senderName: members.accountDisplayName, roleplayName: members.displayName, avatarUrl: members.avatarUrl })
      .from(christmasPeopleMessages).innerJoin(members, eq(christmasPeopleMessages.memberId, members.id)).orderBy(asc(christmasPeopleMessages.createdAt)),
  ]);
  const people: Person[] = peopleRows;
  const messages: AlbumMessage[] = messageRows.map((row) => ({ ...row, senderName: row.senderName || row.roleplayName, createdAt: row.createdAt.toISOString() }));

  return <main className="people-page">
    <div className="album-room-lights" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>
    <div className="album-room-decor" aria-hidden="true"><span className="album-room-star">✦</span><span className="album-room-mug">☕</span><span className="album-room-sprig">❧</span><span className="album-room-gift">🎁</span></div>
    <header className="people-header">
      <Link href="/?view=activities">← กลับไปกระดานกิจกรรม</Link>
      <span>✳ THE CHRISTMAS COTTAGE</span>
      <div>{currentMember ? <><ProfileAvatar value={currentMember.avatarUrl} className="people-header-avatar"/><b>{currentMember.accountDisplayName || currentMember.displayName}</b><Link href="/account">บัญชี</Link><LogoutButton/></> : <Link href={`/sign-in?returnTo=${encodeURIComponent("/christmas-people")}`}>เข้าสู่ระบบ</Link>}</div>
    </header>
    <div className="people-content">
      <section className="people-intro"><span>OUR LITTLE CHRISTMAS COMMUNITY</span><h1>อัลบั้มชาวคอทเทจ</h1><p>เก็บภาพและชื่อของเพื่อนร่วมฤดูหนาวไว้ในเล่มเดียว · {people.length} คน</p><i aria-hidden="true">✦　❧　✦</i></section>
      <section className="photo-album" aria-label="อัลบั้มภาพชาวกระท่อมคริสต์มาส">
        <div className="album-cover-edge"><span>THE CHRISTMAS COTTAGE · WINTER FRIENDS</span></div>
        <div className="album-pages"><span className="album-spine" aria-hidden="true"/><span className="album-spine-sparkle" aria-hidden="true">✦<i>❄</i>✦</span><span className="album-page-sticker album-page-sticker-left" aria-hidden="true">❄</span><span className="album-page-sticker album-page-sticker-right" aria-hidden="true">✦</span><span className="album-page-sticker album-page-sticker-top-right" aria-hidden="true">🎀</span><span className="album-page-sticker album-page-sticker-bottom-left" aria-hidden="true">🌿</span><ChristmasPeopleClient people={people} messages={messages} currentMemberId={currentMember?.id ?? null} isAdmin={currentMember?.role === "admin"}/><footer className="people-footer">ผูกมิตรไว้ด้วยด้ายแดง และแบ่งปันความสุขในฤดูหนาว ✦</footer></div>
      </section>
    </div>
  </main>;
}
