"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-member";
import { controlledActivities, type ControlledActivityId } from "@/lib/activity-catalog";
import { requireDb } from "@/lib/db";
import { activityLocks } from "@/lib/db/schema";

export async function setActivityLock(activityId: string, isLocked: boolean) {
  await requireAdmin();
  if (!controlledActivities.some((activity) => activity.id === activityId)) return { ok: false, message: "ไม่พบกิจกรรมนี้" };
  await requireDb().insert(activityLocks).values({ activityId: activityId as ControlledActivityId, isLocked, updatedAt: new Date() })
    .onConflictDoUpdate({ target: activityLocks.activityId, set: { isLocked, updatedAt: new Date() } });
  revalidatePath("/");
  for (const activity of controlledActivities) revalidatePath(activity.href);
  revalidatePath("/activity-control");
  return { ok: true, message: isLocked ? "ล็อกกิจกรรมไว้ก่อนเปิดเผยแล้ว 🎁" : "เปิดกิจกรรมให้ทุกคนเข้าชมแล้ว ✨" };
}
