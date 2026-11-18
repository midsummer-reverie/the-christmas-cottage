import { loadEnvConfig } from "@next/env";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { Resend } from "resend";
import * as authSchema from "@/lib/db/auth-schema";
import { requireDb } from "@/lib/db";
import { members } from "@/lib/db/schema";

loadEnvConfig(process.cwd());

async function sendAuthEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[local email preview] ${subject}\n${text}`);
      return;
    }
    throw new Error("Email is not configured. Set RESEND_API_KEY and EMAIL_FROM before enabling sign-up.");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, text });
  if (result.error) throw new Error(`Could not send authentication email: ${result.error.message}`);
}

export const auth = betterAuth({
  appName: "The Christmas Cottage",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  user: {
    additionalFields: {
      discordUsername: { type: "string", required: true, input: true },
      profileName: { type: "string", required: false, input: false },
    },
  },
  database: drizzleAdapter(requireDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail(user.email, "รีเซ็ตรหัสผ่าน The Christmas Cottage", `เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่:\n${url}`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail(user.email, "ยืนยันอีเมล The Christmas Cottage", `เปิดลิงก์นี้เพื่อยืนยันอีเมลของคุณ:\n${url}`);
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const memberValues = {
            authSubject: user.id,
            displayName: user.name,
            accountDisplayName: (typeof user.profileName === "string" ? user.profileName.trim() : "") || user.name,
            avatarUrl: user.image ?? null,
            discordUsername: typeof user.discordUsername === "string" ? user.discordUsername : "",
            email: user.email,
          } satisfies typeof members.$inferInsert;
          await requireDb().insert(members).values(memberValues).onConflictDoNothing();
        },
      },
    },
  },
});
