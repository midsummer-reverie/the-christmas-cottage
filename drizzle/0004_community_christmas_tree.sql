CREATE TABLE "tree_ornaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"greeting" text NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tree_ornament_slot_unique" UNIQUE("slot")
);
--> statement-breakpoint
ALTER TABLE "tree_ornaments" ADD CONSTRAINT "tree_ornaments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;