"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireCurrentMember } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { user as authUser } from "@/lib/db/auth-schema";

export async function saveAccountProfile(formData: FormData): Promise<{ ok: boolean; message: string; displayName?: string; accountDisplayName?: string; avatarUrl?: string | null; discordUsername?: string }> {
  const member = await requireCurrentMember();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const accountDisplayName = String(formData.get("accountDisplayName") ?? "").trim();
  const rawAvatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const avatarUrl = rawAvatarUrl || null;
  const christmasEmojiChoices = ["🎄", "🎁", "🧸", "🦌", "☃️", "❄️", "🔔", "🍪", "🍭", "🧦", "🌟", "🕯️"];
  const rawDiscordUsername = String(formData.get("discordUsername") ?? "").trim();
  const discordUsername = rawDiscordUsername.startsWith("@") ? rawDiscordUsername : `@${rawDiscordUsername}`;
  if (displayName.length < 2 || displayName.length > 60) {
    return { ok: false, message: "Display Name ต้องยาว 2–60 ตัวอักษร" };
  }
  if (accountDisplayName.length < 2 || accountDisplayName.length > 40) return { ok: false, message: "ชื่อที่แสดงบนกระท่อมต้องยาว 2–40 ตัวอักษร" };
  if (avatarUrl?.startsWith("emoji:")) {
    if (!christmasEmojiChoices.includes(avatarUrl.slice(6))) return { ok: false, message: "เลือกอิโมจิจากรายการที่มีให้ก่อนนะ" };
  } else if (avatarUrl?.startsWith("data:")) {
    if (avatarUrl.length > 400_000 || !/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl)) return { ok: false, message: "รูปโปรไฟล์เดิมไม่ถูกต้อง" };
  } else if (avatarUrl) {
    if (avatarUrl.length > 2048) return { ok: false, message: "ลิงก์รูปยาวเกินไป" };
    try {
      const url = new URL(avatarUrl);
      if (url.protocol !== "https:" || url.username || url.password) return { ok: false, message: "ลิงก์รูปต้องเป็น https:// และไม่มีข้อมูลล็อกอินในลิงก์" };
    } catch {
      return { ok: false, message: "ใส่ลิงก์รูปภาพที่ถูกต้องก่อนนะ" };
    }
  }
  if (!/^@[A-Za-z0-9._]{2,32}$/.test(discordUsername)) {
    return { ok: false, message: "Discord Username ต้องมี 2–32 ตัวอักษร ใช้ตัวอักษร ตัวเลข จุด หรือ _" };
  }

  const db = requireDb();
  await db.update(authUser).set({ name: displayName, profileName: accountDisplayName, image: avatarUrl, discordUsername, updatedAt: new Date() })
    .where(eq(authUser.id, member.authSubject));
  await db.update(members).set({ displayName, accountDisplayName, avatarUrl, discordUsername })
    .where(eq(members.id, member.id));
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/secret-santa");
  revalidatePath("/secret-santa/wishlist-book");
  revalidatePath("/christmas-tree");
  return { ok: true, message: "อัปเดตข้อมูลบัญชีแล้ว", displayName, accountDisplayName, avatarUrl, discordUsername };
}
