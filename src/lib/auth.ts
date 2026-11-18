import { loadEnvConfig } from "@next/env";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import * as authSchema from "@/lib/db/auth-schema";
import { requireDb } from "@/lib/db";
import { members } from "@/lib/db/schema";

loadEnvConfig(process.cwd());

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
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
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
