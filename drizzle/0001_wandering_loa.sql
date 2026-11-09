CREATE TABLE "daily_activity_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"activity_date" text NOT NULL,
	"words_studied" integer DEFAULT 0 NOT NULL,
	"quizzes_completed" integer DEFAULT 0 NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_species" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"unlock_condition" text DEFAULT 'free' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_pets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"species_id" text NOT NULL,
	"pet_name" text NOT NULL,
	"stage" text DEFAULT 'egg' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_days_active" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_activity_log" ADD CONSTRAINT "daily_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pets" ADD CONSTRAINT "user_pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pets" ADD CONSTRAINT "user_pets_species_id_pet_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."pet_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_activity_user_date_idx" ON "daily_activity_log" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "daily_activity_user_idx" ON "daily_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_pets_user_id_idx" ON "user_pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_pets_active_idx" ON "user_pets" USING btree ("user_id","is_active");