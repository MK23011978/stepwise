CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"friendship_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"filtered" boolean DEFAULT false NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"friendship_id" text NOT NULL,
	"message_id" text,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" text PRIMARY KEY NOT NULL,
	"a_id" text NOT NULL,
	"b_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"status" text NOT NULL,
	"a_parent_ok" boolean DEFAULT false NOT NULL,
	"b_parent_ok" boolean DEFAULT false NOT NULL,
	"blocked_by" text,
	"a_read_at" timestamp with time zone,
	"b_read_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shared_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"friendship_id" text NOT NULL,
	"shared_by" text NOT NULL,
	"style_id" text NOT NULL,
	"question" jsonb NOT NULL,
	"attempts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "show_online" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "chat_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_friendship_id_friendships_id_fk" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_friendship_id_friendships_id_fk" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_a_id_users_id_fk" FOREIGN KEY ("a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_b_id_users_id_fk" FOREIGN KEY ("b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_questions" ADD CONSTRAINT "shared_questions_friendship_id_friendships_id_fk" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_questions" ADD CONSTRAINT "shared_questions_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("friendship_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_reports_status_idx" ON "chat_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_uq" ON "friendships" USING btree ("a_id","b_id");--> statement-breakpoint
CREATE INDEX "friendships_b_idx" ON "friendships" USING btree ("b_id");--> statement-breakpoint
CREATE INDEX "shared_questions_friendship_idx" ON "shared_questions" USING btree ("friendship_id");