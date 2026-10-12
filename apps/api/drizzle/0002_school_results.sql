CREATE TABLE "school_results" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"unit" text,
	"taken_on" date NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"grade" text,
	"target_grade" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "school_results" ADD CONSTRAINT "school_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_results_student_idx" ON "school_results" USING btree ("student_id","taken_on");