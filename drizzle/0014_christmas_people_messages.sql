CREATE TABLE "christmas_people_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"message" text NOT NULL,
	"paper_color" text DEFAULT 'cream' NOT NULL,
	"ink_color" text DEFAULT 'forest' NOT NULL,
	"is_bold" boolean DEFAULT false NOT NULL,
	"is_italic" boolean DEFAULT false NOT NULL,
	"is_underline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "christmas_people_messages" ADD CONSTRAINT "christmas_people_messages_person_id_christmas_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."christmas_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "christmas_people_messages" ADD CONSTRAINT "christmas_people_messages_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;