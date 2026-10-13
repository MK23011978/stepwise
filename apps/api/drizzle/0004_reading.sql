CREATE TABLE "reading_days" (
	"student_id" text NOT NULL,
	"day" date NOT NULL,
	"reviewed" integer DEFAULT 0 NOT NULL,
	"goal_met_at" timestamp with time zone,
	CONSTRAINT "reading_days_student_id_day_pk" PRIMARY KEY("student_id","day")
);
--> statement-breakpoint
CREATE TABLE "reading_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"shelf_id" text NOT NULL,
	"day" date NOT NULL,
	"minutes" integer NOT NULL,
	"from_page" integer,
	"to_page" integer,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_shelf" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"book_id" text,
	"title" text NOT NULL,
	"author" text,
	"total_pages" integer,
	"current_page" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'reading' NOT NULL,
	"summary" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vocab_words" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"shelf_id" text,
	"book_id" text,
	"word" text NOT NULL,
	"meaning" text NOT NULL,
	"example" text,
	"box" integer DEFAULT 0 NOT NULL,
	"due" date NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"wrong" integer DEFAULT 0 NOT NULL,
	"added_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "reading" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_days" ADD CONSTRAINT "reading_days_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_shelf_id_reading_shelf_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."reading_shelf"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_shelf" ADD CONSTRAINT "reading_shelf_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_shelf_id_reading_shelf_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."reading_shelf"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_logs_student_idx" ON "reading_logs" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "reading_shelf_student_idx" ON "reading_shelf" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vocab_student_word_uq" ON "vocab_words" USING btree ("student_id",lower("word"));--> statement-breakpoint
CREATE INDEX "vocab_due_idx" ON "vocab_words" USING btree ("student_id","due");