ALTER TABLE "tree_ornaments" DROP CONSTRAINT "tree_ornament_slot_unique";--> statement-breakpoint
ALTER TABLE "tree_ornaments" ADD COLUMN "page_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tree_ornaments" ADD CONSTRAINT "tree_ornament_page_slot_unique" UNIQUE("page_number","slot");