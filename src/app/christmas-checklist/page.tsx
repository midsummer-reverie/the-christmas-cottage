import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import LogoutButton from "@/app/account/logout-button";
import ProfileAvatar from "@/components/profile-avatar";
import { requireDb } from "@/lib/db";
import { christmasWeekProgress, christmasWeekTasks, members } from "@/lib/db/schema";
import WeekChecklistClient, { type ChecklistProgress, type ChecklistTask } from "./client";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

export default async function WeekBeforeChristmasPage() {
  const access = await getActivityAccess("christmas-checklist");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="12 Days Before Christmas" note="รถไฟคริสต์มาสยังจอดพัก รอเสียงระฆังเรียกขบวนก่อนนะ"/>;
  const member = access.member;
  const db = requireDb();
  const [taskRows, progressRows] = await Promise.all([
    db.select().from(christmasWeekTasks).where(member?.role === "admin" ? undefined : eq(christmasWeekTasks.isPublished, true)).orderBy(asc(christmasWeekTasks.sortOrder), asc(christmasWeekTasks.createdAt)),
    db.select({ id: christmasWeekProgress.id, taskId: christmasWeekProgress.taskId, memberId: christmasWeekProgress.memberId, postNumber: christmasWeekProgress.postNumber, url: christmasWeekProgress.url, createdAt: christmasWeekProgress.createdAt, name: members.accountDisplayName, roleplayName: members.displayName, avatar: members.avatarUrl })
      .from(christmasWeekProgress).innerJoin(members, eq(christmasWeekProgress.memberId, members.id)).orderBy(asc(christmasWeekProgress.createdAt)),
  ]);
  const tasks: ChecklistTask[] = taskRows.map(({ id, parentTaskId, title, description, requiredPosts, isPublished }) => ({ id, parentTaskId, title, description, requiredPosts, isPublished }));
  const progress: ChecklistProgress[] = progressRows.map((row) => ({ ...row, name: row.name || row.roleplayName, createdAt: row.createdAt.toISOString() }));

  return <main className="week-page">
    <header className="snack-header"><Link href="/?view=activities">← กลับไปกระดานกิจกรรม</Link><span>✳ THE CHRISTMAS COTTAGE</span><div>{member ? <><ProfileAvatar value={member.avatarUrl} className="snack-avatar"/><b>{member.accountDisplayName || member.displayName}</b><Link href="/account">บัญชี</Link><LogoutButton/></> : <Link href={`/sign-in?returnTo=${encodeURIComponent("/christmas-checklist")}`}>เข้าสู่ระบบ</Link>}</div></header>
    <WeekChecklistClient tasks={tasks} progress={progress} memberId={member?.id ?? null} isAdmin={member?.role === "admin"}/>
  </main>;
}
