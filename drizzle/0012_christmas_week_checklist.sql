CREATE TABLE "christmas_week_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"post_number" integer NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "christmas_week_progress_post_unique" UNIQUE("task_id","member_id","post_number")
);
--> statement-breakpoint
CREATE TABLE "christmas_week_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"required_posts" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "christmas_week_progress" ADD CONSTRAINT "christmas_week_progress_task_id_christmas_week_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."christmas_week_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "christmas_week_progress" ADD CONSTRAINT "christmas_week_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "christmas_week_tasks" ("title", "description", "required_posts", "sort_order") VALUES
('ส่งสัญญาณเริ่มเทศกาล', 'โพสต์ภาพหรือข้อความบอกว่าคริสต์มาสปีนี้เริ่มต้นแล้ว', 1, 1),
('ตกแต่งมุมคริสต์มาส', 'จัดมุมเล็ก ๆ ที่บ้าน โต๊ะทำงาน หรือในเกม แล้วแบ่งปันภาพ', 1, 2),
('เปิดเพลย์ลิสต์ฤดูหนาว', 'แชร์เพลงคริสต์มาสที่ฟังแล้วนึกถึงเทศกาลนี้', 1, 3),
('ทำหรือชิมขนมประจำฤดู', 'แบ่งปันภาพขนมหรือเครื่องดื่มอุ่น ๆ ที่ได้ลอง', 1, 4),
('ส่งคำขอบคุณให้ใครสักคน', 'เขียนข้อความขอบคุณหรือคำอวยพรสั้น ๆ ให้เพื่อน', 1, 5),
('ดูหนังคริสต์มาสด้วยกัน', 'เลือกหนังหนึ่งเรื่องแล้วแชร์เรื่องที่ดูหรือฉากโปรด', 1, 6),
('เก็บภาพความทรงจำส่งท้ายปี', 'โพสต์ภาพหรือเรื่องเล็ก ๆ ที่อยากจำจากคริสต์มาสปีนี้', 1, 7);
