CREATE TABLE "grammar_exercises" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" text NOT NULL,
	"question" text NOT NULL,
	"question_type" text DEFAULT 'multiple_choice' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_lessons" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"target_band" text,
	"summary" text NOT NULL,
	"theory_markdown" text NOT NULL,
	"tips" text,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grammar_lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "roadmap_stage_topics" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_stages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_id" text NOT NULL,
	"stage_number" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"band_range" text NOT NULL,
	"description" text,
	"icon_name" text DEFAULT 'Compass' NOT NULL,
	"accent_color" text DEFAULT 'amber' NOT NULL,
	"required_known_percent" integer DEFAULT 80 NOT NULL,
	"required_quiz_score" integer DEFAULT 80 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'vocabulary' NOT NULL,
	"target_band" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roadmaps_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" text NOT NULL,
	"part_number" integer DEFAULT 1 NOT NULL,
	"context_text" text,
	"question_text" text NOT NULL,
	"question_type" text DEFAULT 'multiple_choice' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_submissions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"test_id" text NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"score_percent" numeric(5, 2) NOT NULL,
	"estimated_band" numeric(3, 1) NOT NULL,
	"answers_detail" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text DEFAULT 'mock_test' NOT NULL,
	"target_band" text,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"total_questions" integer DEFAULT 20 NOT NULL,
	"passing_score_percent" integer DEFAULT 70 NOT NULL,
	"description" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_grammar_progress" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"exercise_score" integer DEFAULT 0 NOT NULL,
	"last_studied_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roadmap_progress" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"roadmap_id" text NOT NULL,
	"current_stage_id" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_stage_progress" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"milestone_quiz_attempt_id" text,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grammar_exercises" ADD CONSTRAINT "grammar_exercises_lesson_id_grammar_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."grammar_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_lessons" ADD CONSTRAINT "grammar_lessons_stage_id_roadmap_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."roadmap_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_stage_topics" ADD CONSTRAINT "roadmap_stage_topics_stage_id_roadmap_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."roadmap_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_stage_topics" ADD CONSTRAINT "roadmap_stage_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_stages" ADD CONSTRAINT "roadmap_stages_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_submissions" ADD CONSTRAINT "test_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_submissions" ADD CONSTRAINT "test_submissions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_lesson_id_grammar_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."grammar_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ADD CONSTRAINT "user_roadmap_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ADD CONSTRAINT "user_roadmap_progress_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ADD CONSTRAINT "user_roadmap_progress_current_stage_id_roadmap_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."roadmap_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stage_progress" ADD CONSTRAINT "user_stage_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stage_progress" ADD CONSTRAINT "user_stage_progress_stage_id_roadmap_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."roadmap_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stage_progress" ADD CONSTRAINT "user_stage_progress_milestone_quiz_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("milestone_quiz_attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grammar_exercises_lesson_id_idx" ON "grammar_exercises" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "grammar_lessons_stage_id_idx" ON "grammar_lessons" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "stage_topics_stage_id_idx" ON "roadmap_stage_topics" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "stage_topics_topic_id_idx" ON "roadmap_stage_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stage_topic_unique_idx" ON "roadmap_stage_topics" USING btree ("stage_id","topic_id");--> statement-breakpoint
CREATE INDEX "roadmap_stages_roadmap_id_idx" ON "roadmap_stages" USING btree ("roadmap_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roadmap_stage_slug_idx" ON "roadmap_stages" USING btree ("roadmap_id","slug");--> statement-breakpoint
CREATE INDEX "roadmaps_type_idx" ON "roadmaps" USING btree ("type");--> statement-breakpoint
CREATE INDEX "roadmaps_is_active_idx" ON "roadmaps" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "test_questions_test_id_idx" ON "test_questions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_submissions_user_id_idx" ON "test_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_submissions_test_id_idx" ON "test_submissions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "tests_category_idx" ON "tests" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tests_is_published_idx" ON "tests" USING btree ("is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "user_grammar_unique_idx" ON "user_grammar_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "user_grammar_user_idx" ON "user_grammar_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roadmap_unique_idx" ON "user_roadmap_progress" USING btree ("user_id","roadmap_id");--> statement-breakpoint
CREATE INDEX "user_roadmap_user_idx" ON "user_roadmap_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_stage_unique_idx" ON "user_stage_progress" USING btree ("user_id","stage_id");--> statement-breakpoint
CREATE INDEX "user_stage_user_idx" ON "user_stage_progress" USING btree ("user_id");