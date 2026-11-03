import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "learner"] })
    .notNull()
    .default("learner"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const topics = pgTable(
  "topics",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    isVisible: boolean("is_visible").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft-delete
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("topics_is_visible_idx").on(table.isVisible),
    index("topics_deleted_at_idx").on(table.deletedAt),
  ]
);

export const words = pgTable(
  "words",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    wordNormalized: text("word_normalized").notNull(),
    partOfSpeech: text("part_of_speech"),
    meaning: text("meaning").notNull(),
    pronunciation: text("pronunciation"),
    synonyms: jsonb("synonyms").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("words_topic_id_idx").on(table.topicId),
    index("words_word_normalized_idx").on(table.wordNormalized),
    // Deduplication constraint: same topic + word_normalized + part_of_speech
    uniqueIndex("words_dedup_idx").on(
      table.topicId,
      table.wordNormalized,
      sql`COALESCE(${table.partOfSpeech}, '')`
    ),
  ]
);

export const userWordProgress = pgTable(
  "user_word_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    isKnown: boolean("is_known").notNull().default(false),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    reviewCount: integer("review_count").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    incorrectCount: integer("incorrect_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_word_unique_idx").on(table.userId, table.wordId),
    index("user_progress_known_idx").on(table.userId, table.isKnown),
    index("user_progress_user_idx").on(table.userId),
  ]
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: text("mode", { enum: ["flip_card", "multiple_choice", "typing"] }).notNull(),
    topicIds: jsonb("topic_ids").$type<string[]>().notNull(),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers").notNull(),
    scorePercent: numeric("score_percent", { precision: 5, scale: 2 }).notNull(),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quiz_attempts_user_id_idx").on(table.userId),
    index("quiz_attempts_created_at_idx").on(table.createdAt),
  ]
);

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    quizAttemptId: text("quiz_attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userAnswer: text("user_answer"),
    correctAnswer: text("correct_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quiz_answers_attempt_id_idx").on(table.quizAttemptId),
  ]
);

export const importJobs = pgTable(
  "import_jobs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    status: text("status", { enum: ["pending", "processing", "completed", "failed"] })
      .notNull()
      .default("pending"),
    totalRows: integer("total_rows").notNull().default(0),
    addedRows: integer("added_rows").notNull().default(0),
    skippedRows: integer("skipped_rows").notNull().default(0),
    errorRows: integer("error_rows").notNull().default(0),
    errorDetails: jsonb("error_details").$type<Array<{ row: number; error: string; raw: Record<string, string> }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("import_jobs_user_id_idx").on(table.userId),
    index("import_jobs_created_at_idx").on(table.createdAt),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
export type UserWordProgress = typeof userWordProgress.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type ImportJob = typeof importJobs.$inferSelect;

