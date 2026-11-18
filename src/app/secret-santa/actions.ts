"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { and, eq, inArray } from "drizzle-orm";
import { requireAdmin, requireCurrentMember } from "@/lib/current-member";
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

type ActionResult = { ok: boolean; message: string };
type Channel = "online" | "physical";
type UpdateKind = "wishlist_request" | "sent" | "delivered_all" | "partially_delivered" | "custom";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function makeDerangement<T>(items: T[]) {
  // Sattolo's shuffle creates one cycle, so nobody is assigned themselves.
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = textValue(formData, "name");
  if (name.length < 3 || name.length > 80) return { ok: false, message: "ตั้งชื่อกิจกรรม 3–80 ตัวอักษรนะ" };
  const db = requireDb();
  const [existingEvent] = await db.select({ id: santaEvents.id }).from(santaEvents).limit(1);
  if (existingEvent) return { ok: false, message: "Secret Santa นี้มีเพียงกิจกรรมเดียว ไม่สามารถสร้างรอบซ้ำได้" };
  await db.insert(santaEvents).values({ name });
  revalidatePath("/secret-santa");
  return { ok: true, message: `สร้างกิจกรรม “${name}” แล้ว` };
}

export async function saveParticipation(formData: FormData): Promise<ActionResult> {
  const member = await requireCurrentMember();
  const eventId = textValue(formData, "eventId");
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).where(eq(santaEvents.id, eventId)).limit(1);
  if (!event) return { ok: false, message: "ไม่พบกิจกรรม Secret Santa นี้" };
  const [existingParticipation] = await db.select().from(santaParticipants).where(and(
    eq(santaParticipants.eventId, eventId), eq(santaParticipants.memberId, member.id),
  )).limit(1);
  const shippingAddress = textValue(formData, "shippingAddress");

  if (event.status !== "open") {
    if (!existingParticipation) return { ok: false, message: "ปิดรับสมัครกิจกรรมนี้แล้ว" };
    if (existingParticipation.joinsPhysical && (shippingAddress.length < 8 || shippingAddress.length > 600)) {
      return { ok: false, message: "ใส่ที่อยู่จัดส่งให้ครบถ้วน (ไม่เกิน 600 ตัวอักษร)" };
    }
    const storedShippingAddress = existingParticipation.joinsPhysical ? shippingAddress.replace(/\r?\n/g, "<br>") : null;
    await db.update(santaParticipants).set({
      shippingAddress: storedShippingAddress,
    }).where(and(eq(santaParticipants.eventId, eventId), eq(santaParticipants.memberId, member.id)));

    let notificationMessage = "อัปเดตข้อมูลจัดส่งแล้ว ผู้ให้ของจะเห็นที่อยู่ล่าสุด";
    if (formData.get("notifyGiver") === "on") {
      if (event.status !== "drawn") {
        notificationMessage = "บันทึกที่อยู่ใหม่แล้ว เมื่อสุ่มจับคู่เสร็จจึงจะแจ้งผู้ให้ของได้";
      } else {
        const assignments = await db.select({ id: santaAssignments.id, giverMemberId: santaAssignments.giverMemberId })
          .from(santaAssignments).where(and(
            eq(santaAssignments.eventId, eventId),
            eq(santaAssignments.recipientMemberId, member.id),
            eq(santaAssignments.channel, "physical"),
          ));
        if (assignments.length) {
          await db.insert(santaAssignmentUpdates).values(assignments.map((assignment) => ({
            assignmentId: assignment.id, kind: "address_changed" as const,
            message: "ผู้รับของคุณอัปเดตที่อยู่จัดส่งแล้ว กรุณาเปิด Secret Santa เพื่อดูที่อยู่ล่าสุด",
          })));
          const [giverRows, adminRows] = await Promise.all([
            db.select({ email: members.email }).from(members).where(inArray(members.id, assignments.map((item) => item.giverMemberId))),
            db.select({ email: members.email }).from(members).where(eq(members.role, "admin")),
          ]);
          const apiKey = process.env.RESEND_API_KEY;
          const from = process.env.EMAIL_FROM;
          let emailsDelivered = false;
          if (apiKey && from) {
            try {
              const resend = new Resend(apiKey);
              const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
              const recipientEmails = [...new Set(giverRows.map((row) => row.email))];
              const adminEmails = [...new Set(adminRows.map((row) => row.email))];
              const results = await Promise.all([
                ...recipientEmails.map((email) => resend.emails.send({
                  from, to: email, subject: "Secret Santa: shipping address updated",
                  text: `Your Secret Santa recipient updated their shipping address. Sign in to view the latest details: ${siteUrl}/secret-santa`,
                })),
                ...adminEmails.map((email) => resend.emails.send({
                  from, to: email, subject: "Secret Santa: a shipping address was updated",
                  text: `A participant updated their Secret Santa shipping address. Review the latest address and activity in the admin dashboard: ${siteUrl}/secret-santa`,
                })),
              ]);
              emailsDelivered = results.length > 0 && results.every((result) => !result.error);
            } catch {
              emailsDelivered = false;
            }
          }
          notificationMessage = emailsDelivered
            ? "บันทึกที่อยู่แล้ว และส่งอีเมลแจ้งผู้ให้ของกับแอดมินที่ตั้งค่าไว้ พร้อมเพิ่มแจ้งเตือนในระบบ"
            : "บันทึกที่อยู่แล้ว ระบบแจ้งผู้ให้ของและแอดมินไว้ในหน้า Secret Santa แล้ว";
        } else {
          notificationMessage = "บันทึกที่อยู่แล้ว แต่ไม่พบคู่ของขวัญจริง กรุณาติดต่อแอดมินเพื่อช่วยตรวจสอบ";
        }
      }
    }
    revalidatePath("/secret-santa");
    revalidatePath("/secret-santa/wishlist-book");
    return { ok: true, message: notificationMessage };
  }

  const joinsOnline = formData.get("joinsOnline") === "on";
  const joinsPhysical = formData.get("joinsPhysical") === "on";
  const displayName = member.displayName.trim();
  if (!joinsOnline && !joinsPhysical) return { ok: false, message: "เลือกเข้าร่วมอย่างน้อยหนึ่งแบบก่อนนะ" };
  if (joinsOnline && (displayName.length < 2 || displayName.length > 60)) {
    return { ok: false, message: "เพิ่ม Display Name ในหน้าโปรไฟล์ก่อนเลือกของขวัญบนเว็บนะ" };
  }
  if (joinsPhysical && (shippingAddress.length < 8 || shippingAddress.length > 600)) {
    return { ok: false, message: "ใส่ที่อยู่จัดส่งให้ครบถ้วน (ไม่เกิน 600 ตัวอักษร)" };
  }
  const storedShippingAddress = shippingAddress.replace(/\r?\n/g, "<br>");

  await db.insert(santaParticipants).values({
    eventId, memberId: member.id, joinsOnline, joinsPhysical,
    displayName: joinsOnline ? displayName : null,
    shippingAddress: joinsPhysical ? storedShippingAddress : null,
  }).onConflictDoUpdate({
    target: [santaParticipants.eventId, santaParticipants.memberId],
    set: { joinsOnline, joinsPhysical, displayName: joinsOnline ? displayName : null, shippingAddress: joinsPhysical ? storedShippingAddress : null },
  });
  revalidatePath("/secret-santa");
  return { ok: true, message: "บันทึกการเข้าร่วมแล้ว" };
}

export async function saveWishlist(formData: FormData): Promise<ActionResult> {
  const member = await requireCurrentMember();
  const eventId = textValue(formData, "eventId");
  const groups: { channel: Channel; value: string; isAvoid: boolean }[] = [
    { channel: "online", value: textValue(formData, "onlineWants"), isAvoid: false },
    { channel: "online", value: textValue(formData, "onlineAvoids"), isAvoid: true },
    { channel: "physical", value: textValue(formData, "physicalWants"), isAvoid: false },
    { channel: "physical", value: textValue(formData, "physicalAvoids"), isAvoid: true },
  ];
  for (const group of groups) {
    const plainLines = group.value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/\[[^\]]*\]/g, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const listItems = (group.value.match(/\[\*\]/gi) ?? []).length;
    if (group.value.length > 4000 || Math.max(plainLines.length, listItems) > 20 || plainLines.some((line) => line.length > 180)) {
      return { ok: false, message: "แต่ละช่องใส่ได้ไม่เกิน 20 บรรทัด และข้อความแต่ละบรรทัดไม่เกิน 180 ตัวอักษร" };
    }
  }

  const db = requireDb();
  const [participation] = await db.select().from(santaParticipants).where(and(
    eq(santaParticipants.eventId, eventId), eq(santaParticipants.memberId, member.id),
  )).limit(1);
  if (!participation) return { ok: false, message: "ลงทะเบียนเข้าร่วมก่อนเพิ่ม wishlist นะ" };

  const rows = groups.filter(({ value }) => value.length > 0).map(({ channel, value, isAvoid }) => ({
    eventId, memberId: member.id, channel, item: value.replace(/\r?\n/g, "<br>"), isAvoid,
  }));
  await db.delete(wishlistItems).where(and(eq(wishlistItems.eventId, eventId), eq(wishlistItems.memberId, member.id)));
  if (rows.length) await db.insert(wishlistItems).values(rows);
  revalidatePath("/secret-santa");
  return { ok: true, message: "บันทึก wishlist แล้ว" };
}

export async function lockEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).where(eq(santaEvents.id, eventId)).limit(1);
  if (!event || event.status !== "open") return { ok: false, message: "กิจกรรมนี้ไม่ได้อยู่ในช่วงเปิดรับสมัคร" };
  await db.update(santaEvents).set({ status: "locked" }).where(eq(santaEvents.id, eventId));
  revalidatePath("/secret-santa");
  return { ok: true, message: "ปิดรับสมัครแล้ว ตรวจรายชื่อก่อนสุ่มได้เลย" };
}

export async function reopenEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).where(eq(santaEvents.id, eventId)).limit(1);
  if (!event || event.status !== "locked") return { ok: false, message: "เปิดรับสมัครใหม่ได้เฉพาะกิจกรรมที่ปิดรับสมัครและยังไม่สุ่ม" };
  await db.update(santaEvents).set({ status: "open" }).where(eq(santaEvents.id, eventId));
  revalidatePath("/secret-santa");
  return { ok: true, message: "เปิดรับสมัครอีกครั้งแล้ว" };
}

export async function drawEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = requireDb();
  const [event] = await db.select().from(santaEvents).where(eq(santaEvents.id, eventId)).limit(1);
  if (!event || event.status !== "locked") return { ok: false, message: "ปิดรับสมัครก่อนเริ่มสุ่ม" };
  const participants = await db.select().from(santaParticipants).where(eq(santaParticipants.eventId, eventId));
  const online = participants.filter((person) => person.joinsOnline).map((person) => person.memberId);
  const physical = participants.filter((person) => person.joinsPhysical).map((person) => person.memberId);
  const groups = [["online", online], ["physical", physical]] as const;
  const tooSmall = groups.filter(([, group]) => group.length === 1).map(([channel]) => channel === "online" ? "ของออนไลน์" : "ของจริง");
  if (!online.length && !physical.length) return { ok: false, message: "ยังไม่มีผู้เข้าร่วมให้สุ่มจับคู่" };
  if (tooSmall.length) return { ok: false, message: `รูปแบบ ${tooSmall.join(" และ ")} ต้องมีผู้เข้าร่วมอย่างน้อย 2 คน` };

  const assignments: { eventId: string; giverMemberId: string; recipientMemberId: string; channel: Channel }[] = [];
  for (const [channel, group] of groups.filter(([, people]) => people.length >= 2)) {
    const recipients = makeDerangement(group);
    group.forEach((giverMemberId, index) => assignments.push({
      eventId, giverMemberId, recipientMemberId: recipients[index], channel,
    }));
  }
  try {
    await db.insert(santaAssignments).values(assignments);
  } catch {
    return { ok: false, message: "บันทึกผลสุ่มไม่สำเร็จ กรุณารีเฟรชหน้าแล้วตรวจสถานะกิจกรรม" };
  }
  await db.update(santaEvents).set({ status: "drawn" })
    .where(and(eq(santaEvents.id, eventId), eq(santaEvents.status, "locked")));
  revalidatePath("/secret-santa");
  return { ok: true, message: "จับคู่ Secret Santa เรียบร้อยแล้ว" };
}

export async function sendWishlistAlert(eventId: string): Promise<ActionResult> {
  const member = await requireCurrentMember();
  const db = requireDb();
  const outgoing = await db.select({ channel: santaAssignments.channel, giverId: santaAssignments.giverMemberId })
    .from(santaAssignments).where(and(
      eq(santaAssignments.eventId, eventId), eq(santaAssignments.recipientMemberId, member.id),
    ));
  if (!outgoing.length) return { ok: false, message: "แจ้งผู้ให้ของได้หลังจากสุ่มจับคู่แล้ว" };

  const channels = [...new Set(outgoing.map((item) => item.channel))] as Channel[];
  const giverIds = [...new Set(outgoing.map((item) => item.giverId))];
  const givers = await db.select({ email: members.email }).from(members).where(inArray(members.id, giverIds));
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let emailSent = false;
  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      const results = await Promise.all(givers.map((giver) => resend.emails.send({
        from, to: giver.email, subject: "Secret Santa: wishlist updated",
        text: `Your Secret Santa recipient updated their wishlist. Visit ${siteUrl}/secret-santa to see the latest list.`,
      })));
      emailSent = results.every((result) => !result.error);
    } catch {
      emailSent = false;
    }
  }
  const now = new Date();
  await db.insert(wishlistAlerts).values(channels.map((channel) => ({
    eventId, memberId: member.id, channel, createdAt: now, processedAt: emailSent ? now : null,
  })));
  revalidatePath("/secret-santa");
  return {
    ok: true,
    message: emailSent ? "ส่งแจ้งเตือนแบบไม่ระบุชื่อให้ผู้ให้ของแล้ว" : "บันทึกแจ้งเตือนไว้ให้แอดมินตรวจแล้ว",
  };
}

export async function sendAssignmentUpdate(assignmentId: string, kind: UpdateKind, message = ""): Promise<ActionResult> {
  const member = await requireCurrentMember();
  const allowed: UpdateKind[] = ["wishlist_request", "sent", "delivered_all", "partially_delivered", "custom"];
  if (!allowed.includes(kind)) return { ok: false, message: "สถานะนี้ไม่ถูกต้อง" };
  const note = message.trim();
  if (kind === "wishlist_request" && (note.length < 4 || note.length > 300)) {
    return { ok: false, message: "ช่วยระบุรายละเอียดที่อยากให้เพิ่ม 4–300 ตัวอักษรนะ" };
  }
  if (kind === "custom" && (note.length < 2 || note.length > 300)) return { ok: false, message: "ข้อความที่กำหนดเองต้องมี 2–300 ตัวอักษร" };
  if (kind !== "wishlist_request" && note.length > 300) return { ok: false, message: "ข้อความยาวได้ไม่เกิน 300 ตัวอักษร" };
  const db = requireDb();
  const [assignment] = await db.select({ id: santaAssignments.id, giverMemberId: santaAssignments.giverMemberId })
    .from(santaAssignments).where(eq(santaAssignments.id, assignmentId)).limit(1);
  if (!assignment || assignment.giverMemberId !== member.id) return { ok: false, message: "ไม่พบการจับคู่ของคุณ" };
  await db.insert(santaAssignmentUpdates).values({ assignmentId, kind, message: note });
  revalidatePath("/secret-santa");
  return { ok: true, message: kind === "wishlist_request" ? "ส่งคำขอ wishlist เพิ่มเติมแบบไม่ระบุชื่อแล้ว" : "ส่งอัปเดตสถานะให้ผู้รับแล้ว" };
}

export async function acknowledgeAssignmentUpdate(updateId: string): Promise<ActionResult> {
  const member = await requireCurrentMember();
  const db = requireDb();
  const [update] = await db.select({
    id: santaAssignmentUpdates.id,
    kind: santaAssignmentUpdates.kind,
    acknowledgedAt: santaAssignmentUpdates.acknowledgedAt,
    giverMemberId: santaAssignments.giverMemberId,
    recipientMemberId: santaAssignments.recipientMemberId,
  }).from(santaAssignmentUpdates).innerJoin(santaAssignments, eq(santaAssignmentUpdates.assignmentId, santaAssignments.id))
    .where(eq(santaAssignmentUpdates.id, updateId)).limit(1);
  const expectedRecipient = update?.kind === "address_changed" ? update.giverMemberId : update?.recipientMemberId;
  if (!update || expectedRecipient !== member.id) return { ok: false, message: "ไม่พบการแจ้งเตือนนี้" };
  if (!update.acknowledgedAt) {
    await db.update(santaAssignmentUpdates).set({ acknowledgedAt: new Date() }).where(eq(santaAssignmentUpdates.id, updateId));
  }
  revalidatePath("/secret-santa");
  return { ok: true, message: "รับทราบแล้ว" };
}
