import "server-only";
import { eq } from "drizzle-orm";
import { getCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { activityLocks } from "@/lib/db/schema";
import type { ControlledActivityId } from "@/lib/activity-catalog";

export async function getActivityAccess(activityId: ControlledActivityId) {
  const [member, [lock]] = await Promise.all([
    getCurrentMember(),
    requireDb().select({ isLocked: activityLocks.isLocked }).from(activityLocks).where(eq(activityLocks.activityId, activityId)).limit(1),
  ]);
  return { isLocked: lock?.isLocked ?? false, isAdmin: member?.role === "admin", member };
}

export async function activityIsLocked(activityId: ControlledActivityId) {
  const [lock] = await requireDb().select({ isLocked: activityLocks.isLocked }).from(activityLocks).where(eq(activityLocks.activityId, activityId)).limit(1);
  return lock?.isLocked ?? false;
}
