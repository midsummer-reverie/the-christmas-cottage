CREATE TABLE "activity_locks" (
	"activity_id" text PRIMARY KEY NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
