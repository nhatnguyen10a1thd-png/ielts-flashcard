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

export const petSpecies = pgTable("pet_species", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  unlockCondition: text("unlock_condition")
    .notNull()
    .default("free"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userPets = pgTable(
  "user_pets",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    speciesId: text("species_id")
      .notNull()
      .references(() => petSpecies.id),
    petName: text("pet_name").notNull(),
    stage: text("stage", {
      enum: ["egg", "hatchling", "baby", "teen", "adult", "legendary"],
    })
      .notNull()
      .default("egg"),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    totalDaysActive: integer("total_days_active").notNull().default(0),
    lastActivityDate: text("last_activity_date"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_pets_user_id_idx").on(table.userId),
    index("user_pets_active_idx").on(table.userId, table.isActive),
  ]
);

export const dailyActivityLog = pgTable(
  "daily_activity_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: text("activity_date").notNull(),
    wordsStudied: integer("words_studied").notNull().default(0),
    quizzesCompleted: integer("quizzes_completed").notNull().default(0),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_activity_user_date_idx").on(table.userId, table.activityDate),
    index("daily_activity_user_idx").on(table.userId),
  ]
);

// -------------------------------------------------------------
// BẢNG QUẢN LÝ LỘ TRÌNH (ROADMAPS & STAGES)
// -------------------------------------------------------------

export const roadmaps = pgTable(
  "roadmaps",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    type: text("type", { enum: ["vocabulary", "grammar"] })
      .notNull()
      .default("vocabulary"),
    targetBand: text("target_band"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("roadmaps_type_idx").on(table.type),
    index("roadmaps_is_active_idx").on(table.isActive),
  ]
);

export const roadmapStages = pgTable(
  "roadmap_stages",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    roadmapId: text("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    stageNumber: integer("stage_number").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    bandRange: text("band_range").notNull(),
    description: text("description"),
    iconName: text("icon_name").notNull().default("Compass"),
    accentColor: text("accent_color").notNull().default("amber"),
    requiredKnownPercent: integer("required_known_percent").notNull().default(80),
    requiredQuizScore: integer("required_quiz_score").notNull().default(80),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("roadmap_stages_roadmap_id_idx").on(table.roadmapId),
    uniqueIndex("roadmap_stage_slug_idx").on(table.roadmapId, table.slug),
  ]
);

export const roadmapStageTopics = pgTable(
  "roadmap_stage_topics",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    stageId: text("stage_id")
      .notNull()
      .references(() => roadmapStages.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("stage_topics_stage_id_idx").on(table.stageId),
    index("stage_topics_topic_id_idx").on(table.topicId),
    uniqueIndex("stage_topic_unique_idx").on(table.stageId, table.topicId),
  ]
);

export const userRoadmapProgress = pgTable(
  "user_roadmap_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roadmapId: text("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    currentStageId: text("current_stage_id").references(() => roadmapStages.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ["in_progress", "completed"] })
      .notNull()
      .default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("user_roadmap_unique_idx").on(table.userId, table.roadmapId),
    index("user_roadmap_user_idx").on(table.userId),
  ]
);

export const userStageProgress = pgTable(
  "user_stage_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stageId: text("stage_id")
      .notNull()
      .references(() => roadmapStages.id, { onDelete: "cascade" }),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    isCompleted: boolean("is_completed").notNull().default(false),
    milestoneQuizAttemptId: text("milestone_quiz_attempt_id").references(
      () => quizAttempts.id,
      { onDelete: "set null" }
    ),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_stage_unique_idx").on(table.userId, table.stageId),
    index("user_stage_user_idx").on(table.userId),
  ]
);

// -------------------------------------------------------------
// BẢNG BÀI HỌC VÀ BÀI TẬP NGỮ PHÁP (GRAMMAR TRACK)
// -------------------------------------------------------------

export const grammarLessons = pgTable(
  "grammar_lessons",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    stageId: text("stage_id")
      .notNull()
      .references(() => roadmapStages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    targetBand: text("target_band"),
    summary: text("summary").notNull(),
    theoryMarkdown: text("theory_markdown").notNull(),
    tips: text("tips"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(15),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("grammar_lessons_stage_id_idx").on(table.stageId),
  ]
);

export const grammarExercises = pgTable(
  "grammar_exercises",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => grammarLessons.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    questionType: text("question_type", {
      enum: ["multiple_choice", "fill_blank"],
    })
      .notNull()
      .default("multiple_choice"),
    options: jsonb("options").$type<string[]>().default([]),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("grammar_exercises_lesson_id_idx").on(table.lessonId),
  ]
);

export const userGrammarProgress = pgTable(
  "user_grammar_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => grammarLessons.id, { onDelete: "cascade" }),
    isCompleted: boolean("is_completed").notNull().default(false),
    exerciseScore: integer("exercise_score").notNull().default(0),
    lastStudiedAt: timestamp("last_studied_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_grammar_unique_idx").on(table.userId, table.lessonId),
    index("user_grammar_user_idx").on(table.userId),
  ]
);

// -------------------------------------------------------------
// BẢNG TRUNG TÂM ĐỀ THI & KIỂM THỬ (STUDY4-STYLE TEST HUB)
// -------------------------------------------------------------

export const tests = pgTable(
  "tests",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    category: text("category", {
      enum: ["placement", "milestone", "mini_test", "mock_test"],
    })
      .notNull()
      .default("mock_test"),
    targetBand: text("target_band"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    totalQuestions: integer("total_questions").notNull().default(20),
    passingScorePercent: integer("passing_score_percent").notNull().default(70),
    description: text("description"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tests_category_idx").on(table.category),
    index("tests_is_published_idx").on(table.isPublished),
  ]
);

export const testQuestions = pgTable(
  "test_questions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    testId: text("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    partNumber: integer("part_number").notNull().default(1),
    contextText: text("context_text"),
    questionText: text("question_text").notNull(),
    questionType: text("question_type", {
      enum: ["multiple_choice", "fill_blank"],
    })
      .notNull()
      .default("multiple_choice"),
    options: jsonb("options").$type<string[]>().default([]),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("test_questions_test_id_idx").on(table.testId),
  ]
);

export const testSubmissions = pgTable(
  "test_submissions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    testId: text("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    totalCorrect: integer("total_correct").notNull().default(0),
    totalQuestions: integer("total_questions").notNull().default(0),
    scorePercent: numeric("score_percent", { precision: 5, scale: 2 }).notNull(),
    estimatedBand: numeric("estimated_band", { precision: 3, scale: 1 }).notNull(),
    answersDetail: jsonb("answers_detail").$type<
      Record<string, { userAnswer: string; isCorrect: boolean }>
    >().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("test_submissions_user_id_idx").on(table.userId),
    index("test_submissions_test_id_idx").on(table.testId),
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
export type PetSpecies = typeof petSpecies.$inferSelect;
export type NewPetSpecies = typeof petSpecies.$inferInsert;
export type UserPet = typeof userPets.$inferSelect;
export type NewUserPet = typeof userPets.$inferInsert;
export type DailyActivityLog = typeof dailyActivityLog.$inferSelect;
export type NewDailyActivityLog = typeof dailyActivityLog.$inferInsert;

export type Roadmap = typeof roadmaps.$inferSelect;
export type NewRoadmap = typeof roadmaps.$inferInsert;
export type RoadmapStage = typeof roadmapStages.$inferSelect;
export type NewRoadmapStage = typeof roadmapStages.$inferInsert;
export type RoadmapStageTopic = typeof roadmapStageTopics.$inferSelect;
export type UserRoadmapProgress = typeof userRoadmapProgress.$inferSelect;
export type UserStageProgress = typeof userStageProgress.$inferSelect;

export type GrammarLesson = typeof grammarLessons.$inferSelect;
export type NewGrammarLesson = typeof grammarLessons.$inferInsert;
export type GrammarExercise = typeof grammarExercises.$inferSelect;
export type NewGrammarExercise = typeof grammarExercises.$inferInsert;
export type UserGrammarProgress = typeof userGrammarProgress.$inferSelect;

export type Test = typeof tests.$inferSelect;
export type NewTest = typeof tests.$inferInsert;
export type TestQuestion = typeof testQuestions.$inferSelect;
export type NewTestQuestion = typeof testQuestions.$inferInsert;
export type TestSubmission = typeof testSubmissions.$inferSelect;
export type NewTestSubmission = typeof testSubmissions.$inferInsert;

export type PetStage = "egg" | "hatchling" | "baby" | "teen" | "adult" | "legendary";
export type PetSpeciesId = "owl" | "cat" | "dragon" | "bunny" | "fox" | "phoenix";


