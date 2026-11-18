import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import {
  members,
  santaAssignmentUpdates,
  santaAssignments,
  santaEvents,
  santaParticipants,
  wishlistAlerts,
  wishlistItems,
} from "@/lib/db/schema";
import SecretSantaClient, { type SecretSantaPageData } from "./client";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

export default async function SecretSantaPage() {
  const access = await getActivityAccess("secret-santa");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="Secret Santa" note="ซานต้ากำลังเตรียมรายชื่อไว้ในถุงของขวัญ"/>;
  const member = await requireCurrentMember("/secret-santa");
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).orderBy(desc(santaEvents.createdAt)).limit(1);
  const isAdmin = member.role === "admin";
  const data: SecretSantaPageData = {
    memberName: member.accountDisplayName || member.displayName,
    memberRoleplayName: member.displayName,
    memberAvatarUrl: member.avatarUrl,
    isAdmin,
    event: event ? { id: event.id, name: event.name, status: event.status } : null,
    participation: null,
    wishlist: [],
    assignments: [],
    adminParticipants: [],
    adminAssignments: [],
    addressChangeNotices: [],
    alertQueue: [],
    incomingUpdates: [],
  };

  if (event) {
    const [participation] = await db.select().from(santaParticipants).where(and(
      eq(santaParticipants.eventId, event.id), eq(santaParticipants.memberId, member.id),
    )).limit(1);
    data.participation = participation ? {
      joinsOnline: participation.joinsOnline,
      joinsPhysical: participation.joinsPhysical,
      shippingAddress: participation.shippingAddress ?? "",
    } : null;
    const ownWishlist = await db.select().from(wishlistItems).where(and(
      eq(wishlistItems.eventId, event.id), eq(wishlistItems.memberId, member.id),
    )).orderBy(asc(wishlistItems.updatedAt));
    data.wishlist = ownWishlist.map(({ channel, item, isAvoid }) => ({ channel, item, isAvoid }));

    const myAssignments = await db.select().from(santaAssignments).where(and(
      eq(santaAssignments.eventId, event.id), eq(santaAssignments.giverMemberId, member.id),
    ));
    if (myAssignments.length) {
      const recipientIds = [...new Set(myAssignments.map((item) => item.recipientMemberId))];
      const [recipientMembers, recipientParticipants, recipientWishlist, myUpdates] = await Promise.all([
        db.select({ id: members.id, displayName: members.displayName, accountDisplayName: members.accountDisplayName, avatarUrl: members.avatarUrl }).from(members).where(inArray(members.id, recipientIds)),
        db.select().from(santaParticipants).where(and(
          eq(santaParticipants.eventId, event.id), inArray(santaParticipants.memberId, recipientIds),
        )),
        db.select().from(wishlistItems).where(and(
          eq(wishlistItems.eventId, event.id), inArray(wishlistItems.memberId, recipientIds),
        )),
        db.select().from(santaAssignmentUpdates).where(inArray(santaAssignmentUpdates.assignmentId, myAssignments.map((item) => item.id)))
          .orderBy(desc(santaAssignmentUpdates.createdAt)),
      ]);
      data.assignments = myAssignments.map((assignment) => {
        const recipient = recipientMembers.find((person) => person.id === assignment.recipientMemberId);
        const details = recipientParticipants.find((person) => person.memberId === assignment.recipientMemberId);
        const list = recipientWishlist.filter((item) => item.memberId === assignment.recipientMemberId && item.channel === assignment.channel);
        return {
          id: assignment.id,
          channel: assignment.channel,
          updates: myUpdates.filter((update) => update.assignmentId === assignment.id).map((update) => ({
            id: update.id, kind: update.kind, message: update.message,
            acknowledgedAt: update.acknowledgedAt?.toISOString() ?? null,
            createdAt: update.createdAt.toISOString(),
          })),
          recipientName: recipient?.displayName || details?.displayName || "สมาชิกในกิจกรรม",
          recipientAccountName: recipient?.accountDisplayName || recipient?.displayName || details?.displayName || "สมาชิกในกิจกรรม",
          recipientRoleplayName: recipient?.displayName || details?.displayName || "",
          recipientAvatarUrl: recipient?.avatarUrl ?? null,
          shippingAddress: assignment.channel === "physical" ? details?.shippingAddress ?? null : null,
          wants: list.filter((item) => !item.isAvoid).map((item) => item.item),
          avoids: list.filter((item) => item.isAvoid).map((item) => item.item),
        };
      });
    }

    const incoming = await db.select({
      id: santaAssignmentUpdates.id,
      kind: santaAssignmentUpdates.kind,
      message: santaAssignmentUpdates.message,
      acknowledgedAt: santaAssignmentUpdates.acknowledgedAt,
      createdAt: santaAssignmentUpdates.createdAt,
      channel: santaAssignments.channel,
      giverMemberId: santaAssignments.giverMemberId,
      recipientMemberId: santaAssignments.recipientMemberId,
    }).from(santaAssignmentUpdates).innerJoin(santaAssignments, eq(santaAssignmentUpdates.assignmentId, santaAssignments.id))
      .where(and(eq(santaAssignments.eventId, event.id), or(eq(santaAssignments.recipientMemberId, member.id), eq(santaAssignments.giverMemberId, member.id))))
      .orderBy(desc(santaAssignmentUpdates.createdAt));
    data.incomingUpdates = incoming.filter((update) => update.kind === "address_changed"
      ? update.giverMemberId === member.id
      : update.recipientMemberId === member.id).map((update) => ({
      ...update,
      createdAt: update.createdAt.toISOString(),
      acknowledgedAt: update.acknowledgedAt?.toISOString() ?? null,
    }));

    if (isAdmin) {
      const [roster, allWishlist, pendingAlerts, allAssignments, allUpdates] = await Promise.all([
        db.select({
          memberId: members.id,
          displayName: members.displayName,
          accountDisplayName: members.accountDisplayName,
          avatarUrl: members.avatarUrl,
          email: members.email,
          joinsOnline: santaParticipants.joinsOnline,
          joinsPhysical: santaParticipants.joinsPhysical,
          shippingAddress: santaParticipants.shippingAddress,
        }).from(santaParticipants).innerJoin(members, eq(santaParticipants.memberId, members.id))
          .where(eq(santaParticipants.eventId, event.id)).orderBy(asc(members.accountDisplayName), asc(members.displayName)),
        db.select().from(wishlistItems).where(eq(wishlistItems.eventId, event.id)),
        db.select({ displayName: members.displayName, channel: wishlistAlerts.channel, createdAt: wishlistAlerts.createdAt })
          .from(wishlistAlerts).innerJoin(members, eq(wishlistAlerts.memberId, members.id))
          .where(and(eq(wishlistAlerts.eventId, event.id), isNull(wishlistAlerts.processedAt)))
          .orderBy(asc(wishlistAlerts.createdAt)),
        db.select({
          id: santaAssignments.id,
          channel: santaAssignments.channel,
          giverMemberId: santaAssignments.giverMemberId,
          recipientMemberId: santaAssignments.recipientMemberId,
        }).from(santaAssignments).where(eq(santaAssignments.eventId, event.id)),
        db.select().from(santaAssignmentUpdates).innerJoin(santaAssignments, eq(santaAssignmentUpdates.assignmentId, santaAssignments.id))
          .where(eq(santaAssignments.eventId, event.id)).orderBy(desc(santaAssignmentUpdates.createdAt)),
      ]);
      data.adminParticipants = roster.map((person) => ({
        ...person,
        wishlist: allWishlist.filter((item) => item.memberId === person.memberId)
          .map(({ channel, item, isAvoid }) => ({ channel, item, isAvoid })),
      }));
      data.alertQueue = pendingAlerts.map((alert) => ({
        participantName: alert.displayName,
        channel: alert.channel,
        createdAt: alert.createdAt.toISOString(),
      }));
      const memberNames = new Map(roster.map((person) => [person.memberId, person.accountDisplayName || person.displayName]));
      data.adminAssignments = allAssignments.map((assignment) => ({
        ...assignment,
        giverName: memberNames.get(assignment.giverMemberId) ?? "สมาชิก",
        recipientName: memberNames.get(assignment.recipientMemberId) ?? "สมาชิก",
        updates: allUpdates.filter(({ santa_assignment_updates: update }) => update.assignmentId === assignment.id)
          .map(({ santa_assignment_updates: update }) => ({ kind: update.kind, message: update.message, acknowledgedAt: update.acknowledgedAt?.toISOString() ?? null, createdAt: update.createdAt.toISOString() })),
      }));
      data.addressChangeNotices = data.adminAssignments.flatMap((assignment) => assignment.updates
        .filter((update) => update.kind === "address_changed")
        .map((update) => ({ giverName: assignment.giverName, recipientName: assignment.recipientName, channel: assignment.channel, createdAt: update.createdAt })));
    }
  }

  return <SecretSantaClient data={data} />;
}
