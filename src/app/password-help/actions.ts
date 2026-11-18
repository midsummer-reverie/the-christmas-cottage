"use server";

import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-member";
import { requireDb } from "@/lib/db";
import { session, user } from "@/lib/db/auth-schema";
import { members, passwordRecoveryRequests } from "@/lib/db/schema";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function requestManualPasswordHelp(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "กรุณากรอกอีเมลให้ถูกต้อง" };
  }

  const db = requireDb();
  const [registered] = await db.select({ email: user.email })
    .from(user).where(eq(user.email, email)).limit(1);

  // Keep the response the same for registered and unregistered emails.
  if (registered) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recent] = await db.select({ id: passwordRecoveryRequests.id })
      .from(passwordRecoveryRequests)
      .where(and(eq(passwordRecoveryRequests.email, email), gt(passwordRecoveryRequests.createdAt, oneHourAgo)))
      .limit(1);
    if (!recent) await db.insert(passwordRecoveryRequests).values({ email });
  }
  return { ok: true, message: "รับคำขอแล้ว หากบัญชีนี้อยู่ในระบบ แอดมินจะติดต่อกลับทาง Discord ที่ผูกไว้" };
}

export async function issueManualResetLink(requestId: string) {
  await requireAdmin();
  const db = requireDb();
  const [request] = await db.select().from(passwordRecoveryRequests)
    .where(and(eq(passwordRecoveryRequests.id, requestId), isNull(passwordRecoveryRequests.tokenUsedAt))).limit(1);
  if (!request) return { ok: false, message: "ไม่พบคำขอ หรือคำขอนี้ถูกใช้ไปแล้ว" };

  const [registered] = await db.select({ email: user.email })
    .from(user).where(eq(user.email, request.email)).limit(1);
  if (!registered) return { ok: false, message: "ไม่พบบัญชีสำหรับคำขอนี้" };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.update(passwordRecoveryRequests).set({
    tokenHash: digest(token),
    tokenExpiresAt: expiresAt,
    issuedAt: new Date(),
    tokenUsedAt: null,
  }).where(eq(passwordRecoveryRequests.id, request.id));

  const baseUrl = (process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  if (!baseUrl) return { ok: false, message: "ยังไม่ได้ตั้ง BETTER_AUTH_URL ใน Environment Variables" };
  return { ok: true, email: request.email, link: `${baseUrl}/reset-password/manual?token=${encodeURIComponent(token)}`, expiresAt: expiresAt.toISOString() };
}

export async function consumeManualResetLink(token: string, newPassword: string) {
  if (!token || token.length > 200) return { ok: false, message: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว" };
  if (newPassword.length < 8 || newPassword.length > 128) return { ok: false, message: "รหัสผ่านต้องยาว 8–128 ตัวอักษร" };

  const passwordHash = await hashPassword(newPassword);
  const tokenHash = digest(token);
  const db = requireDb();
  const result = await db.execute<{ user_id: string }>(sql`
    WITH consumed AS (
      UPDATE password_recovery_requests
      SET token_used_at = now()
      WHERE token_hash = ${tokenHash}
        AND token_expires_at > now()
        AND token_used_at IS NULL
      RETURNING email
    ), target_user AS (
      SELECT u.id FROM "user" u JOIN consumed c ON lower(u.email) = c.email
    ), changed AS (
      UPDATE "account" a SET password = ${passwordHash}, updated_at = now()
      FROM target_user t
      WHERE a.user_id = t.id AND a.provider_id = 'credential'
      RETURNING a.user_id
    )
    SELECT user_id FROM changed
  `);
  const changedUser = result.rows[0];
  if (!changedUser) return { ok: false, message: "ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว กรุณาขอความช่วยเหลือจากแอดมินอีกครั้ง" };

  await db.delete(session).where(eq(session.userId, changedUser.user_id));
  return { ok: true, message: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย" };
}

export async function getPasswordHelpRequests() {
  await requireAdmin();
  const rows = await requireDb().select({
    id: passwordRecoveryRequests.id,
    email: passwordRecoveryRequests.email,
    createdAt: passwordRecoveryRequests.createdAt,
    issuedAt: passwordRecoveryRequests.issuedAt,
    tokenExpiresAt: passwordRecoveryRequests.tokenExpiresAt,
    tokenUsedAt: passwordRecoveryRequests.tokenUsedAt,
    accountDisplayName: members.accountDisplayName,
    displayName: members.displayName,
    discordUsername: members.discordUsername,
  }).from(passwordRecoveryRequests)
    .leftJoin(members, eq(members.email, passwordRecoveryRequests.email))
    .orderBy(desc(passwordRecoveryRequests.createdAt)).limit(50);
  return rows;
}

export async function closePasswordHelpRequest(requestId: string) {
  await requireAdmin();
  await requireDb().delete(passwordRecoveryRequests).where(eq(passwordRecoveryRequests.id, requestId));
  revalidatePath("/password-help");
  return { ok: true };
}
