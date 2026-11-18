import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import LogoutButton from "@/app/account/logout-button";
import ProfileAvatar from "@/components/profile-avatar";
import { requireDb } from "@/lib/db";
import { christmasWeekProgress, christmasWeekTasks, members } from "@/lib/db/schema";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

const expressStops = [
  { place: "Elysian Village", region: "Lake Tahoe, California" },
  { place: "Redwood National Park", region: "California, USA" },
  { place: "Cape Perpetua", region: "Oregon Coast, USA" },
  { place: "Royal Botanic Gardens, Kew", region: "London, England" },
  { place: "Zollverein", region: "Essen, Germany" },
  { place: "Sighișoara Citadel", region: "Transylvania, Romania" },
  { place: "Lake Inari", region: "Finnish Lapland" },
  { place: "Santa Claus Village", region: "Rovaniemi, Finland" },
];

export default async function WeekProgressPage() {
  const access = await getActivityAccess("christmas-checklist");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="12 Days of Christmas" note="รถไฟคริสต์มาสยังจอดพัก รอเสียงระฆังเรียกขบวนก่อนนะ"/>;
  const member = access.member;
  const db = requireDb();
  const [tasks, people, entries] = await Promise.all([
    db.select().from(christmasWeekTasks).where(eq(christmasWeekTasks.isPublished, true)).orderBy(asc(christmasWeekTasks.sortOrder)),
    db.select({ id: members.id, name: members.accountDisplayName, roleplayName: members.displayName, avatar: members.avatarUrl }).from(members).orderBy(asc(members.accountDisplayName)),
    db.select({ id: christmasWeekProgress.id, taskId: christmasWeekProgress.taskId, memberId: christmasWeekProgress.memberId, postNumber: christmasWeekProgress.postNumber, url: christmasWeekProgress.url }).from(christmasWeekProgress),
  ]);
  const roots = tasks.filter((task) => !task.parentTaskId);
  const childrenOf = (id: string) => tasks.filter((task) => task.parentTaskId === id);

  return <main className="week-page week-progress-page">
    <header className="snack-header"><Link href="/christmas-checklist">← กลับไป 12 Days of Christmas</Link><span>✳ THE CHRISTMAS COTTAGE</span><div>{member ? <><ProfileAvatar value={member.avatarUrl} className="snack-avatar"/><b>{member.accountDisplayName || member.displayName}</b><Link href="/account">บัญชี</Link><LogoutButton/></> : <Link href={`/sign-in?returnTo=${encodeURIComponent("/christmas-checklist/progress")}`}>เข้าสู่ระบบ</Link>}</div></header>
    <div className="week-content"><section className="week-hero"><div className="week-garland" aria-hidden="true">✦　🕯️　🎄　🕯️　✦</div><span>OUR LITTLE WINTER JOURNAL</span><h1>The Christmas Express</h1><p>รถไฟของแต่ละคนกำลังเดินทาง แวะดูได้ว่าเพื่อน ๆ ไปถึงสถานีไหนกันแล้ว</p><div className="week-hero-stats"><b>🚂 {people.length} ขบวน</b><i/><b>✍️ {entries.length} โพสต์ที่ฝากไว้</b><i/><b>❄️ {roots.length} สถานี</b></div></section>
      {!people.length ? <div className="week-empty">ชานชาลายังเงียบอยู่ รอผู้โดยสารคนแรกมาขึ้นรถไฟนะ 🎄</div> : <div className="week-train-people">{people.map((person, personIndex) => {
        const own = entries.filter((entry) => entry.memberId === person.id);
        const stations = roots.map((root) => {
          const children = childrenOf(root.id);
          const subtasks = children.length ? children : [root];
          const expected = subtasks.reduce((sum, task) => sum + task.requiredPosts, 0);
          const submitted = subtasks.reduce((sum, task) => sum + own.filter((entry) => entry.taskId === task.id).length, 0);
          return { root, subtasks, expected, submitted, reached: submitted >= expected };
        });
        const totalExpected = stations.reduce((sum, station) => sum + station.expected, 0);
        const totalSubmitted = Math.min(totalExpected, stations.reduce((sum, station) => sum + station.submitted, 0));
        const percent = totalExpected ? Math.round(totalSubmitted / totalExpected * 100) : 0;
        const stopPercent = (index: number) => index / (expressStops.length - 1) * 100;
        const currentStopIndex = expressStops.reduce((current, _stop, index) => percent >= stopPercent(index) ? index : current, 0);
        return <article className="week-train-card" key={person.id} style={{ "--train-order": personIndex } as React.CSSProperties}>
          <header className="week-train-owner"><span className="week-train-avatar">{person.avatar ? <img src={person.avatar} alt=""/> : "🎄"}</span><div><h2>{person.name || person.roleplayName}</h2><p>{percent === 100 && totalExpected ? "ถึง Santa Claus Village แล้ว!" : `${totalSubmitted} จาก ${totalExpected} โพสต์ · ${percent}% ของการเดินทาง`}</p></div>{percent === 100 && totalExpected ? <span className="week-arrival-stamp" aria-label="ถึง Santa Claus Village แล้ว"><i>✦</i><b>ARRIVED</b><small>SANTA VILLAGE</small></span> : <span className="week-train-ticket">กำลังเดินทาง</span>}</header>
          <div className="week-current-stop"><small>{percent === 100 ? "ARRIVED AT THE FINAL STOP" : "NOW TRAVELLING FROM"}</small><b>{expressStops[currentStopIndex].place}</b><span>{expressStops[currentStopIndex].region}</span></div>
          <div className="week-route-scroll"><div className="week-route" aria-label={`Christmas Express progress ${percent}%`}><div className="week-route-line"><i style={{ width: `${percent}%` }}/></div>{expressStops.map((stop, stopIndex) => { const position = stopPercent(stopIndex); const reached = percent >= position; return <span className={`week-route-stop ${reached ? "is-reached" : ""}`} key={stop.place} style={{ left: `${position}%` }}><i>{reached ? "✦" : "·"}</i><small><b>{stop.place}</b><em>{stop.region}</em></small></span>})}<span className="week-locomotive" style={{ left: `${percent}%` }}>🚂</span></div></div>
          <details className="week-journey-details"><summary><span>📖</span> เปิดสมุดบันทึกการเดินทาง <i>⌄</i></summary><div className="week-journey-stations">{stations.map((station, index) => <section className={`week-journey-station ${station.reached ? "is-reached" : ""}`} key={station.root.id}><header><span>{station.reached ? "✓" : String(index + 1).padStart(2, "0")}</span><div><b>{station.root.title}</b><small>{station.submitted}/{station.expected} โพสต์</small></div>{station.reached && <span className="week-completion-stamp" aria-label="ภารกิจเสร็จสมบูรณ์"><i>✦</i><b>DONE</b></span>}</header>{station.subtasks.map((task, subIndex) => { const links = own.filter((entry) => entry.taskId === task.id).sort((a, b) => a.postNumber - b.postNumber); const complete = links.length >= task.requiredPosts; return <div className={`week-journey-task ${complete ? "is-complete" : ""}`} key={task.id}><div className="week-journey-task-title"><b>{station.subtasks.length > 1 ? `${index + 1}.${subIndex + 1} ` : ""}{task.title}</b><span className="week-journey-task-status">{complete ? <span className="week-completion-stamp" aria-label="ภารกิจเสร็จสมบูรณ์"><i>✦</i><b>DONE</b></span> : <small>{links.length}/{task.requiredPosts}</small>}</span></div>{links.length > 0 && <div className="week-journey-links">{links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.id}>โพสต์ที่ {link.postNumber} <span>เปิดดู ↗</span></a>)}</div>}</div>})}</section>)}</div></details>
        </article>;
      })}</div>}
      <footer className="week-footer">แต่ละขบวนมีจังหวะเดินทางของตัวเอง ขอบคุณที่แวะมาแบ่งปันโมเมนต์ดี ๆ ด้วยกัน ❄</footer>
    </div>
  </main>;
}
