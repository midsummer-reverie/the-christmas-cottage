"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireAdmin, requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { christmasWeekProgress, christmasWeekTasks } from "@/lib/db/schema";

const refresh = () => revalidatePath("/christmas-checklist");

export async function submitWeekLink(taskId: string, url: string, postNumber: number) {
  const member = await requireCurrentMember("/christmas-checklist");
  const db = requireDb();
  const [task] = await db.select().from(christmasWeekTasks).where(eq(christmasWeekTasks.id, taskId)).limit(1);
  if (!task || !task.isPublished) return { ok: false, message: "ไม่พบภารกิจนี้" };
  const children = await db.select({ id: christmasWeekTasks.id }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, taskId)).limit(1);
  if (children.length) return { ok: false, message: "เลือกส่งลิงก์ในช่องของภารกิจย่อยนะ" };
  const parsed = URL.canParse(url) ? new URL(url) : null;
  if (!parsed || !["https:", "http:"].includes(parsed.protocol)) return { ok: false, message: "กรุณาใส่ลิงก์ที่ถูกต้อง" };
  if (!Number.isInteger(postNumber) || postNumber < 1 || postNumber > task.requiredPosts) return { ok: false, message: "หมายเลขโพสต์ไม่ถูกต้อง" };
  await db.insert(christmasWeekProgress).values({ taskId, memberId: member.id, postNumber, url: parsed.toString() })
    .onConflictDoUpdate({ target: [christmasWeekProgress.taskId, christmasWeekProgress.memberId, christmasWeekProgress.postNumber], set: { url: parsed.toString(), createdAt: new Date() } });
  refresh();
  return { ok: true, message: "บันทึกลิงก์แล้ว ✨" };
}

export async function saveWeekTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const parentTaskId = String(formData.get("parentTaskId") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requiredPosts = Number(formData.get("requiredPosts"));
  const isPublished = formData.get("isPublished") === "on";
  if (title.length < 2 || title.length > 100 || description.length > 1000 || !Number.isInteger(requiredPosts) || requiredPosts < 1 || requiredPosts > 10) return { ok: false, message: "ตรวจชื่อ รายละเอียด และจำนวนโพสต์ (1–10) อีกครั้ง" };
  const db = requireDb();
  const [existing] = id ? await db.select({ parentTaskId: christmasWeekTasks.parentTaskId }).from(christmasWeekTasks).where(eq(christmasWeekTasks.id, id)).limit(1) : [];
  if (id && !existing) return { ok: false, message: "ไม่พบภารกิจนี้" };
  if (parentTaskId) {
    if (parentTaskId === id) return { ok: false, message: "ภารกิจไม่สามารถเป็นหมวดย่อยของตัวเองได้" };
    const [parent] = await db.select({ id: christmasWeekTasks.id, parentTaskId: christmasWeekTasks.parentTaskId }).from(christmasWeekTasks).where(eq(christmasWeekTasks.id, parentTaskId)).limit(1);
    if (!parent || parent.parentTaskId) return { ok: false, message: "เลือกภารกิจหลักที่ไม่มีหมวดแม่อีกชั้นนะ" };
    const siblings = await db.select({ id: christmasWeekTasks.id, requiredPosts: christmasWeekTasks.requiredPosts }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, parentTaskId));
    const total = siblings.filter((task) => task.id !== id).reduce((sum, task) => sum + task.requiredPosts, 0) + requiredPosts;
    if (total > 10) return { ok: false, message: "จำนวนโพสต์รวมของภารกิจหลักเกิน 10 แล้ว" };
  }
  const existingChildren = id ? await db.select({ requiredPosts: christmasWeekTasks.requiredPosts }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, id)) : [];
  if (parentTaskId && existingChildren.length) return { ok: false, message: "ย้ายภารกิจหลักที่มีภารกิจย่อยไม่ได้" };
  const savedPostCount = !parentTaskId && existingChildren.length ? existingChildren.reduce((sum, child) => sum + child.requiredPosts, 0) : requiredPosts;
  if (id) {
    await db.update(christmasWeekTasks).set({ title, description, requiredPosts: savedPostCount, isPublished, parentTaskId }).where(eq(christmasWeekTasks.id, id));
  } else await db.insert(christmasWeekTasks).values({ title, description, requiredPosts: savedPostCount, isPublished, parentTaskId, sortOrder: 99 });
  if (parentTaskId) {
    const siblings = await db.select({ requiredPosts: christmasWeekTasks.requiredPosts }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, parentTaskId));
    await db.update(christmasWeekTasks).set({ requiredPosts: siblings.reduce((sum, task) => sum + task.requiredPosts, 0) }).where(eq(christmasWeekTasks.id, parentTaskId));
  }
  if (existing?.parentTaskId && existing.parentTaskId !== parentTaskId) {
    const siblings = await db.select({ requiredPosts: christmasWeekTasks.requiredPosts }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, existing.parentTaskId));
    await db.update(christmasWeekTasks).set({ requiredPosts: Math.max(1, siblings.reduce((sum, task) => sum + task.requiredPosts, 0)) }).where(eq(christmasWeekTasks.id, existing.parentTaskId));
  }
  refresh();
  return { ok: true, message: "บันทึกภารกิจแล้ว" };
}

export async function deleteWeekTask(id: string) {
  await requireAdmin();
  const db = requireDb();
  const [task] = await db.select({ parentTaskId: christmasWeekTasks.parentTaskId }).from(christmasWeekTasks).where(eq(christmasWeekTasks.id, id)).limit(1);
  if (!task) return { ok: false, message: "ไม่พบภารกิจนี้" };
  await db.delete(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, id));
  await db.delete(christmasWeekTasks).where(eq(christmasWeekTasks.id, id));
  if (task.parentTaskId) {
    const siblings = await db.select({ requiredPosts: christmasWeekTasks.requiredPosts }).from(christmasWeekTasks).where(eq(christmasWeekTasks.parentTaskId, task.parentTaskId));
    await db.update(christmasWeekTasks).set({ requiredPosts: Math.max(1, siblings.reduce((sum, child) => sum + child.requiredPosts, 0)) }).where(eq(christmasWeekTasks.id, task.parentTaskId));
  }
  refresh();
  revalidatePath("/christmas-checklist/progress");
  return { ok: true, message: "ลบภารกิจแล้ว" };
}

export async function deleteWeekLink(id: string) {
  const member = await requireCurrentMember("/christmas-checklist");
  const db = requireDb();
  const where = member.role === "admin" ? eq(christmasWeekProgress.id, id) : and(eq(christmasWeekProgress.id, id), eq(christmasWeekProgress.memberId, member.id));
  await db.delete(christmasWeekProgress).where(where);
  refresh();
  return { ok: true };
}
