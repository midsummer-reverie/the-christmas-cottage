CREATE TYPE "public"."santa_event_status" AS ENUM('open', 'locked', 'drawn');--> statement-breakpoint
CREATE TYPE "public"."gift_channel" AS ENUM('online', 'physical');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_auth_subject_unique" UNIQUE("auth_subject"),
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "mission_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"submitted_url" text NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "mission_submission_member_unique" UNIQUE("mission_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"external_url" text,
	"due_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santa_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"giver_member_id" uuid NOT NULL,
	"recipient_member_id" uuid NOT NULL,
	"channel" "gift_channel" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "santa_assignment_giver_channel_unique" UNIQUE("event_id","giver_member_id","channel"),
	CONSTRAINT "santa_assignment_recipient_channel_unique" UNIQUE("event_id","recipient_member_id","channel"),
	CONSTRAINT "santa_assignment_no_self_match" CHECK ("santa_assignments"."giver_member_id" <> "santa_assignments"."recipient_member_id")
);
--> statement-breakpoint
CREATE TABLE "santa_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "santa_event_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santa_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"joins_online" boolean DEFAULT false NOT NULL,
	"joins_physical" boolean DEFAULT false NOT NULL,
	"shipping_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "santa_participant_event_member_unique" UNIQUE("event_id","member_id"),
	CONSTRAINT "santa_participant_joins_at_least_one" CHECK ("santa_participants"."joins_online" or "santa_participants"."joins_physical"),
	CONSTRAINT "physical_player_needs_address" CHECK (not "santa_participants"."joins_physical" or "santa_participants"."shipping_address" is not null)
);
--> statement-breakpoint
CREATE TABLE "wishlist_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"channel" "gift_channel" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"channel" "gift_channel" NOT NULL,
	"item" text NOT NULL,
	"is_avoid" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santa_assignments" ADD CONSTRAINT "santa_assignments_event_id_santa_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."santa_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santa_assignments" ADD CONSTRAINT "santa_assignments_giver_member_id_members_id_fk" FOREIGN KEY ("giver_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santa_assignments" ADD CONSTRAINT "santa_assignments_recipient_member_id_members_id_fk" FOREIGN KEY ("recipient_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santa_participants" ADD CONSTRAINT "santa_participants_event_id_santa_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."santa_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santa_participants" ADD CONSTRAINT "santa_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_alerts" ADD CONSTRAINT "wishlist_alerts_event_id_santa_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."santa_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_alerts" ADD CONSTRAINT "wishlist_alerts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_event_id_santa_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."santa_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;