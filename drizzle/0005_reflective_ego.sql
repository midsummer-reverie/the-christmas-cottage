CREATE TYPE "public"."santa_update_kind" AS ENUM('wishlist_request', 'sent', 'delivered_all', 'partially_delivered');--> statement-breakpoint
CREATE TABLE "santa_assignment_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"kind" "santa_update_kind" NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "santa_assignment_updates" ADD CONSTRAINT "santa_assignment_updates_assignment_id_santa_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."santa_assignments"("id") ON DELETE cascade ON UPDATE no action;