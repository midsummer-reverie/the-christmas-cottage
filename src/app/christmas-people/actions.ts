"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getCurrentMember, requireAdmin, requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { christmasPeople, christmasPeopleMessages } from "@/lib/db/schema";

type Result = { ok: boolean; message: string };

function validate(name: string, imageUrl: string): Result | null {
  if (name.length < 2 || name.length > 60) return { ok: false, message: "ชื่อยาวได้ 2–60 ตัวอักษรนะ" };
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:" || url.username || url.password || imageUrl.length > 2048) return { ok: false, message: "ลิงก์รูปต้องเป็น https:// และยาวไม่เกิน 2048 ตัวอักษร" };
    } catch {
      return { ok: false, message: "ใส่ลิงก์รูปภาพที่ถูกต้องก่อนนะ" };
    }
  }
  return null;
}

export async function saveChristmasPerson(id: string | null, rawName: string, rawImageUrl: string): Promise<Result> {
  await requireAdmin();
  const name = rawName.trim();
  const imageUrl = rawImageUrl.trim();
  const error = validate(name, imageUrl);
  if (error) return error;
  const db = requireDb();
  if (id) await db.update(christmasPeople).set({ name, imageUrl: imageUrl || null }).where(eq(christmasPeople.id, id));
  else await db.insert(christmasPeople).values({ name, imageUrl: imageUrl || null });
  revalidatePath("/christmas-people");
  return { ok: true, message: id ? "อัปเดตการ์ดแล้ว" : "เพิ่มการ์ดแล้ว" };
}

export async function deleteChristmasPerson(id: string): Promise<Result> {
  await requireAdmin();
  await requireDb().delete(christmasPeople).where(eq(christmasPeople.id, id));
  revalidatePath("/christmas-people");
  return { ok: true, message: "ลบการ์ดรายชื่อแล้ว" };
}

const paperColors = new Set(["cream", "rose", "mint", "blue", "lavender"]);

export async function addChristmasPeopleMessage(input: {
  personId: string;
  message: string;
  paperColor: string;
}): Promise<Result> {
  const member = await requireCurrentMember("/christmas-people");
  const message = input.message.trim();
  if (message.length < 1 || message.length > 4000) return { ok: false, message: "ข้อความต้องมี 1–4,000 ตัวอักษรนะ" };
  if (!paperColors.has(input.paperColor)) return { ok: false, message: "เลือกสีกระดาษจากตัวเลือกที่มีนะ" };
  const db = requireDb();
  const [person] = await db.select({ id: christmasPeople.id }).from(christmasPeople).where(eq(christmasPeople.id, input.personId)).limit(1);
  if (!person) return { ok: false, message: "หารูปในอัลบั้มนี้ไม่เจอแล้ว" };
  await db.insert(christmasPeopleMessages).values({
    personId: person.id,
    memberId: member.id,
    message,
    paperColor: input.paperColor,
    inkColor: "forest",
    isBold: false,
    isItalic: false,
    isUnderline: false,
  });
  revalidatePath("/christmas-people");
  return { ok: true, message: "แปะกระดาษโน้ตแล้ว ✨" };
}

export async function deleteChristmasPeopleMessage(id: string): Promise<Result> {
  const member = await getCurrentMember();
  if (!member) return { ok: false, message: "เข้าสู่ระบบก่อนลบข้อความนะ" };
  const db = requireDb();
  const [note] = await db.select({ id: christmasPeopleMessages.id, memberId: christmasPeopleMessages.memberId }).from(christmasPeopleMessages).where(eq(christmasPeopleMessages.id, id)).limit(1);
  if (!note) return { ok: false, message: "ข้อความนี้ถูกลบไปแล้ว" };
  if (note.memberId !== member.id && member.role !== "admin") return { ok: false, message: "ลบได้เฉพาะข้อความของตัวเองนะ" };
  await db.delete(christmasPeopleMessages).where(eq(christmasPeopleMessages.id, note.id));
  revalidatePath("/christmas-people");
  return { ok: true, message: "ลบกระดาษโน้ตแล้ว" };
}
