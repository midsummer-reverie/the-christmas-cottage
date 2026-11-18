import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { members } from "@/lib/db/schema";

export async function getCurrentMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const db = requireDb();
  const [member] = await db.select().from(members)
    .where(eq(members.authSubject, session.user.id)).limit(1);

  if (member) {
    const discordUsername = session.user.discordUsername ?? "";
    if (member.displayName !== session.user.name || member.email !== session.user.email || member.discordUsername !== discordUsername) {
      const [updated] = await db.update(members)
        .set({ displayName: session.user.name, email: session.user.email, discordUsername })
        .where(eq(members.id, member.id)).returning();
      return updated;
    }
    return member;
  }

  const [created] = await db.insert(members).values({
    authSubject: session.user.id,
    displayName: session.user.name,
    accountDisplayName: session.user.profileName?.trim() || session.user.name,
    avatarUrl: session.user.image ?? null,
    discordUsername: session.user.discordUsername ?? "",
    email: session.user.email,
  }).returning();
  return created;
}

export async function requireCurrentMember(returnTo = "/") {
  const member = await getCurrentMember();
  if (!member) redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  return member;
}

export async function requireAdmin() {
  const member = await requireCurrentMember();
  if (member.role !== "admin") redirect("/");
  return member;
}
