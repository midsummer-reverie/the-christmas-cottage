import { asc, desc, eq } from "drizzle-orm";
import { requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { members, santaEvents, santaParticipants, wishlistItems } from "@/lib/db/schema";
import WishlistBookClient from "./client";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

export default async function SecretSantaWishlistBookPage() {
  const access = await getActivityAccess("secret-santa");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="สมุด Wishlist ของ Secret Santa" note="สมุดรายชื่อถูกผูกริบบิ้นไว้ รอวันเปิดกิจกรรมก่อนนะ"/>;
  const member = await requireCurrentMember("/secret-santa/wishlist-book");
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).orderBy(desc(santaEvents.createdAt)).limit(1);
  const people = event ? await db.select({
    memberId: members.id,
    accountDisplayName: members.accountDisplayName,
    displayName: members.displayName,
    avatarUrl: members.avatarUrl,
    joinsOnline: santaParticipants.joinsOnline,
    joinsPhysical: santaParticipants.joinsPhysical,
  }).from(santaParticipants).innerJoin(members, eq(santaParticipants.memberId, members.id))
    .where(eq(santaParticipants.eventId, event.id)).orderBy(asc(members.accountDisplayName), asc(members.displayName)) : [];
  const entries = event ? await db.select({
    id: wishlistItems.id,
    memberId: wishlistItems.memberId,
    channel: wishlistItems.channel,
    item: wishlistItems.item,
    isAvoid: wishlistItems.isAvoid,
  }).from(wishlistItems).where(eq(wishlistItems.eventId, event.id)) : [];

  return <WishlistBookClient
    eventName={event?.name ?? null}
    member={{ accountDisplayName: member.accountDisplayName || member.displayName, displayName: member.displayName, avatarUrl: member.avatarUrl }}
    people={people}
    entries={entries}
  />;
}
