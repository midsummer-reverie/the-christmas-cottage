import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { controlledActivities } from "@/lib/activity-catalog";
import { requireDb } from "@/lib/db";
import { activityLocks } from "@/lib/db/schema";
import ActivityControlClient from "./client";

export const dynamic = "force-dynamic";

export default async function ActivityControlPage() {
  const member = await getCurrentMember();
  if (member?.role !== "admin") redirect("/?view=activities");
  const locks = await requireDb().select().from(activityLocks);
  const lockMap = new Map(locks.map((lock) => [lock.activityId, lock.isLocked]));
  return <ActivityControlClient activities={controlledActivities.map((activity) => ({ ...activity, isLocked: lockMap.get(activity.id) ?? false }))}/>;
}
