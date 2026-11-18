ALTER TABLE "members" ADD COLUMN "account_display_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "user" SET "profile_name" = "name" WHERE "profile_name" = '';--> statement-breakpoint
UPDATE "members" SET "account_display_name" = "display_name" WHERE "account_display_name" = '';
