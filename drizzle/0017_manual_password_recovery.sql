CREATE TABLE "password_recovery_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"issued_at" timestamp with time zone,
	"token_hash" text,
	"token_expires_at" timestamp with time zone,
	"token_used_at" timestamp with time zone
);
CREATE INDEX "password_recovery_email_created_idx" ON "password_recovery_requests" USING btree ("email", "created_at");
