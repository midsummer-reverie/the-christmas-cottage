ALTER TABLE "santa_participants" ADD COLUMN "display_name" text;--> statement-breakpoint
UPDATE "santa_participants" AS participants
SET "display_name" = members."display_name"
FROM "members"
WHERE participants."member_id" = members."id"
  AND participants."display_name" IS NULL
  AND participants."joins_online";--> statement-breakpoint
ALTER TABLE "santa_participants" ADD CONSTRAINT "online_player_needs_display_name" CHECK (not "santa_participants"."joins_online" or "santa_participants"."display_name" is not null);
