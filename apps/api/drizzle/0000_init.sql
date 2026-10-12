CREATE TYPE "public"."user_role" AS ENUM('admin', 'parent', 'student');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('F', 'H');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"client" text DEFAULT 'web' NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"key" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_version" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"delta" integer NOT NULL,
	"balance" integer NOT NULL,
	"reason" text NOT NULL,
	"by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_activity" (
	"student_id" text NOT NULL,
	"day" date NOT NULL,
	"questions" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_activity_student_id_day_pk" PRIMARY KEY("student_id","day")
);
--> statement-breakpoint
CREATE TABLE "daily_missions" (
	"student_id" text NOT NULL,
	"day" date NOT NULL,
	"missions" jsonb NOT NULL,
	"claimed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bonus_claimed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "daily_missions_student_id_day_pk" PRIMARY KEY("student_id","day")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"subject" text DEFAULT 'maths' NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"tier" "tier",
	"started_at" timestamp with time zone NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"questions" jsonb NOT NULL,
	"answers" jsonb,
	"marked" jsonb,
	"score" integer,
	"max" integer,
	"pct" integer,
	"grade" text,
	"by_strand" jsonb,
	"similar" jsonb,
	"xp" integer,
	"late" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"parent_id" text NOT NULL,
	"card_id" text NOT NULL,
	"card_name" text NOT NULL,
	"icon" text,
	"value_pounds" integer NOT NULL,
	"coins" integer NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"reply" text,
	"code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"target" integer NOT NULL,
	"reward" text NOT NULL,
	"baseline" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"achieved_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"style_id" text NOT NULL,
	"type" text NOT NULL,
	"body" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_pages" (
	"topic_id" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"kind" text DEFAULT 'lesson' NOT NULL,
	"style_id" text,
	"topic_id" text,
	"status" text NOT NULL,
	"free" boolean DEFAULT false NOT NULL,
	"example" jsonb,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idx" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mistakes" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"style_id" text NOT NULL,
	"question" jsonb NOT NULL,
	"source" text NOT NULL,
	"tries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"text" text,
	"icon" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seen" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"pack_id" text NOT NULL,
	"label" text NOT NULL,
	"amount_pence" integer NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"credits" integer NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_schedule" (
	"student_id" text NOT NULL,
	"style_id" text NOT NULL,
	"box" integer NOT NULL,
	"due" date NOT NULL,
	"last_at" timestamp with time zone,
	CONSTRAINT "review_schedule_student_id_style_id_pk" PRIMARY KEY("student_id","style_id")
);
--> statement-breakpoint
CREATE TABLE "strands" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"year_group" integer NOT NULL,
	"tier" "tier" DEFAULT 'H' NOT NULL,
	"target_grade" integer DEFAULT 7 NOT NULL,
	"targets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subjects" text[] DEFAULT '{}'::text[] NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"last_level" integer DEFAULT 1 NOT NULL,
	"milestones" integer DEFAULT 0 NOT NULL,
	"mistakes_fixed" integer DEFAULT 0 NOT NULL,
	"freezes" integer DEFAULT 0 NOT NULL,
	"frozen_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fixed_log" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"badges" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owned" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"equipped" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"gift_settings" jsonb
);
--> statement-breakpoint
CREATE TABLE "style_progress" (
	"student_id" text NOT NULL,
	"style_id" text NOT NULL,
	"done" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"incorrect" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"last_at" timestamp with time zone,
	CONSTRAINT "style_progress_student_id_style_id_pk" PRIMARY KEY("student_id","style_id")
);
--> statement-breakpoint
CREATE TABLE "styles" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"name" text NOT NULL,
	"intro" text NOT NULL,
	"source" text NOT NULL,
	"generator_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"board" text NOT NULL,
	"spec" text,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"tiers" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"task_id" text NOT NULL,
	"day" date NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "task_completions_task_id_day_pk" PRIMARY KEY("task_id","day")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"created_by" text,
	"created_by_role" text NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'custom' NOT NULL,
	"subject" text,
	"ref" text,
	"due_date" date NOT NULL,
	"due_time" text DEFAULT '' NOT NULL,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"until" date,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"strand_id" text NOT NULL,
	"year" integer NOT NULL,
	"term" integer NOT NULL,
	"tier" text DEFAULT 'FH' NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"spec_ref" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"username" text,
	"parent_id" text,
	"password_hash" text NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"avatar_color" text DEFAULT '#3b6cf6' NOT NULL,
	"free_access" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"parent_id" text PRIMARY KEY NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"free_lesson_used" boolean DEFAULT false NOT NULL,
	"card_verified" boolean DEFAULT false NOT NULL,
	"card_brand" text,
	"card_last4" text,
	"card_fingerprint" text,
	"card_verified_at" timestamp with time zone,
	"stripe_customer_id" text
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_missions" ADD CONSTRAINT "daily_missions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_tickets" ADD CONSTRAINT "gift_tickets_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_tickets" ADD CONSTRAINT "gift_tickets_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_style_id_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learn_pages" ADD CONSTRAINT "learn_pages_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strands" ADD CONSTRAINT "strands_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "style_progress" ADD CONSTRAINT "style_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "styles" ADD CONSTRAINT "styles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_strand_id_strands_id_fk" FOREIGN KEY ("strand_id") REFERENCES "public"."strands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_uq" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_key_uq" ON "certificates" USING btree ("student_id","key");--> statement-breakpoint
CREATE INDEX "ledger_parent_idx" ON "credit_ledger" USING btree ("parent_id","created_at");--> statement-breakpoint
CREATE INDEX "exams_student_idx" ON "exam_attempts" USING btree ("student_id","submitted_at");--> statement-breakpoint
CREATE INDEX "tickets_parent_idx" ON "gift_tickets" USING btree ("parent_id","status");--> statement-breakpoint
CREATE INDEX "tickets_student_idx" ON "gift_tickets" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "goals_student_idx" ON "goals" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "items_style_idx" ON "items" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "lessons_student_idx" ON "lessons" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "lessons_active_idx" ON "lessons" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX "mistakes_student_idx" ON "mistakes" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_student_idx" ON "notifications" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_parent_idx" ON "payments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_ref_uq" ON "payments" USING btree ("provider_ref");--> statement-breakpoint
CREATE INDEX "review_due_idx" ON "review_schedule" USING btree ("student_id","due");--> statement-breakpoint
CREATE INDEX "styles_topic_idx" ON "styles" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "tasks_student_idx" ON "tasks" USING btree ("student_id","due_date");--> statement-breakpoint
CREATE INDEX "topics_subject_idx" ON "topics" USING btree ("subject_id","year","term");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uq" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_parent_idx" ON "users" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "wallets_fingerprint_idx" ON "wallets" USING btree ("card_fingerprint");