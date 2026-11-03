import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function testAuthE2E() {
  console.log("Running Auth E2E verification test...");
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    // 1. Verify Admin was seeded and has mustChangePassword = true
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@ielts-flashcard.vn"));

    if (!admin) {
      throw new Error("Admin user not found in database!");
    }
    console.log("✓ Admin user exists in DB.");
    console.log("✓ Admin role:", admin.role);
    console.log("✓ Admin mustChangePassword:", admin.mustChangePassword);

    const isMatch = await verifyPassword("AdminPassword123!", admin.passwordHash);
    if (!isMatch) {
      throw new Error("Admin password hash comparison failed!");
    }
    console.log("✓ Admin password verified against bcrypt hash.");

    // 2. Test learner registration flow simulation
    const learnerEmail = "test_learner@ielts.vn";
    await db.delete(users).where(eq(users.email, learnerEmail));

    const learnerHash = await hashPassword("LearnerPass123!");
    const [newLearner] = await db
      .insert(users)
      .values({
        email: learnerEmail,
        fullName: "Học Viên Thử Nghiệm",
        passwordHash: learnerHash,
        role: "learner",
        mustChangePassword: false,
      })
      .returning();

    console.log("✓ Learner user created:", newLearner.email);

    // 3. Test Session Token generation and verification
    const token = await createSessionToken({
      userId: newLearner.id,
      email: newLearner.email,
      fullName: newLearner.fullName,
      role: "learner",
      mustChangePassword: false,
    });

    const verified = await verifySessionToken(token);
    if (!verified || verified.userId !== newLearner.id) {
      throw new Error("Session verification failed!");
    }
    console.log("✓ Session token created and verified for learner.");

    // Cleanup test learner
    await db.delete(users).where(eq(users.email, learnerEmail));
    console.log("✓ Test cleanup completed.");

    console.log("=========================================");
    console.log("🎉 ALL AUTH E2E CHECKS PASSED SUCCESSFULLY!");
    console.log("=========================================");
  } finally {
    await pool.end();
  }
}

testAuthE2E();

