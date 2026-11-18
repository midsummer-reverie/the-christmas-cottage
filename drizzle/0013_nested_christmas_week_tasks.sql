ALTER TABLE "christmas_week_tasks" ADD COLUMN "parent_task_id" uuid;
--> statement-breakpoint
UPDATE "christmas_week_tasks"
SET "title" = 'เตรียมขนมสำหรับปาร์ตี้คริสต์มาส',
    "description" = 'ออกไปเลือกขนม แล้วนำกลับมาเตรียมไว้ที่บ้านเมเปิลโร้ด',
    "required_posts" = 3
WHERE "title" = 'ทำหรือชิมขนมประจำฤดู';
--> statement-breakpoint
INSERT INTO "christmas_week_tasks" ("parent_task_id", "title", "description", "required_posts", "sort_order")
SELECT parent."id", child."title", child."description", child."required_posts", child."sort_order"
FROM "christmas_week_tasks" AS parent
CROSS JOIN (VALUES
  ('ไปที่ย่านการค้าเพื่อเลือกซื้อขนม', 'แวะร้านขนมและเลือกของอร่อยสำหรับงานปาร์ตี้', 2, 1),
  ('นำขนมมาไว้ที่บ้านเมเปิลโร้ด', 'จัดขนมที่เตรียมไว้ให้พร้อมสำหรับค่ำคืนคริสต์มาส', 1, 2)
) AS child("title", "description", "required_posts", "sort_order")
WHERE parent."title" = 'เตรียมขนมสำหรับปาร์ตี้คริสต์มาส';
