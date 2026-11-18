ALTER TABLE "members" ADD COLUMN "discord_username" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "discord_username" text DEFAULT '' NOT NULL;