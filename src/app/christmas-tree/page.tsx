import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { members, treeOrnaments } from "@/lib/db/schema";
import ChristmasTreeClient from "./client";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

export default async function ChristmasTreePage() {
  const access = await getActivityAccess("christmas-tree");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="ต้นคริสต์มาส" note="ต้นสนกำลังซ่อนของประดับไว้ รอวันจุดไฟพร้อมกันนะ"/>;
  const db = requireDb();
  const [member, rows] = await Promise.all([
    Promise.resolve(access.member),
    db.select({
      id: treeOrnaments.id,
      memberId: treeOrnaments.memberId,
      displayName: members.accountDisplayName,
      roleplayName: members.displayName,
      imageUrl: treeOrnaments.imageUrl,
      greeting: treeOrnaments.greeting,
      pageNumber: treeOrnaments.pageNumber,
      slot: treeOrnaments.slot,
    }).from(treeOrnaments).innerJoin(members, eq(treeOrnaments.memberId, members.id)).orderBy(asc(treeOrnaments.createdAt)),
  ]);

  return <ChristmasTreeClient memberName={member?.displayName ?? null} memberId={member?.id ?? null} isAdmin={member?.role === "admin"} ornaments={rows}/>;
}
