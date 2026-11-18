"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { treeOrnaments } from "@/lib/db/schema";
import { treeDecorationSlots } from "@/lib/christmas-tree";
import { and, eq } from "drizzle-orm";

function ornamentContent(formData: FormData): { ok: true; imageUrl: string; greeting: string } | { ok: false; message: string } {
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const greeting = String(formData.get("greeting") ?? "").trim();
  if (imageUrl.length > 2048) return { ok: false, message: "ลิงก์ภาพยาวเกินไป" };
  if (greeting.length < 2 || greeting.length > 600) return { ok: false, message: "เขียนคำอวยพร 2–600 ตัวอักษรนะ" };
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || !url.pathname.toLowerCase().endsWith(".png") || url.username || url.password) {
      return { ok: false, message: "ใช้ลิงก์ภาพ PNG ที่ปลอดภัยและขึ้นต้นด้วย https:// นะ" };
    }
  } catch {
    return { ok: false, message: "ใส่ลิงก์ภาพ PNG ที่ถูกต้องก่อนนะ" };
  }
  return { ok: true, imageUrl, greeting: greeting.replace(/\r?\n/g, "<br>") };
}

export async function submitTreeOrnament(formData: FormData): Promise<{ ok: boolean; message: string; pageNumber?: number }> {
  const member = await requireCurrentMember();
  const content = ornamentContent(formData);
  if (!content.ok) return { ok: false, message: content.message };

  const db = requireDb();
  const occupiedRows = await db.select({ pageNumber: treeOrnaments.pageNumber, slot: treeOrnaments.slot }).from(treeOrnaments);
  const lastPage = Math.max(1, ...occupiedRows.map((row) => row.pageNumber));
  let targetPage = 1;
  let available = treeDecorationSlots.filter((slot) => !occupiedRows.some((row) => row.pageNumber === targetPage && row.slot === slot.id));
  while (targetPage <= lastPage && !available.length) {
    targetPage += 1;
    available = treeDecorationSlots.filter((slot) => !occupiedRows.some((row) => row.pageNumber === targetPage && row.slot === slot.id));
  }
  if (!available.length) {
    targetPage = lastPage + 1;
    available = [...treeDecorationSlots];
  }
  while (available.length) {
    const index = randomInt(available.length);
    const [slot] = available.splice(index, 1);
    const [created] = await db.insert(treeOrnaments).values({
      memberId: member.id,
      imageUrl: content.imageUrl,
      greeting: content.greeting,
      pageNumber: targetPage,
      slot: slot.id,
    }).onConflictDoNothing({ target: [treeOrnaments.pageNumber, treeOrnaments.slot] }).returning({ id: treeOrnaments.id });
    if (created) {
      revalidatePath("/christmas-tree");
      revalidatePath("/");
      return { ok: true, message: "แขวนของตกแต่งบนต้นคริสต์มาสแล้ว ✨", pageNumber: targetPage };
    }
  }

  return { ok: false, message: "ต้นคริสต์มาสเต็มแล้ว ไว้เพิ่มคำอวยพรหลังมีพื้นที่ว่างนะ" };
}

export async function updateTreeOrnament(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const member = await requireCurrentMember();
  const id = String(formData.get("ornamentId") ?? "");
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    return { ok: false, message: "หาของตกแต่งชิ้นนี้ไม่เจอ" };
  }
  const content = ornamentContent(formData);
  if (!content.ok) return { ok: false, message: content.message };

  const db = requireDb();
  const [ornament] = await db.select({ memberId: treeOrnaments.memberId }).from(treeOrnaments)
    .where(eq(treeOrnaments.id, id)).limit(1);
  if (!ornament) return { ok: false, message: "ของตกแต่งชิ้นนี้อาจถูกลบไปแล้ว" };
  if (ornament.memberId !== member.id) return { ok: false, message: "แก้ไขได้เฉพาะของตกแต่งที่คุณส่งมาเท่านั้น" };

  await db.update(treeOrnaments).set({ imageUrl: content.imageUrl, greeting: content.greeting })
    .where(and(eq(treeOrnaments.id, id), eq(treeOrnaments.memberId, member.id)));
  revalidatePath("/christmas-tree");
  return { ok: true, message: "แก้ไขของตกแต่งแล้ว" };
}

export async function deleteTreeOrnament(id: string): Promise<{ ok: boolean; message: string }> {
  const member = await requireCurrentMember();
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    return { ok: false, message: "หาของตกแต่งชิ้นนี้ไม่เจอ" };
  }
  const db = requireDb();
  const [ornament] = await db.select({ memberId: treeOrnaments.memberId }).from(treeOrnaments)
    .where(eq(treeOrnaments.id, id)).limit(1);
  if (!ornament) return { ok: false, message: "ของตกแต่งชิ้นนี้อาจถูกลบไปแล้ว" };
  if (ornament.memberId !== member.id && member.role !== "admin") {
    return { ok: false, message: "ลบได้เฉพาะของตกแต่งของคุณเท่านั้น" };
  }
  await db.delete(treeOrnaments).where(eq(treeOrnaments.id, id));
  revalidatePath("/christmas-tree");
  return { ok: true, message: "ลบของตกแต่งออกจากต้นแล้ว" };
}
