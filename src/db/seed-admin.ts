import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@ielts-flashcard.vn";
  const rawPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const fullName = "Quản trị viên Hệ thống";

  console.log("--------------------------------------------------");
  console.log("Khởi tạo tài khoản quản trị viên (Admin Seed)...");
  console.log(`Email: ${email}`);
  console.log("--------------------------------------------------");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUsers.length > 0) {
      await db
        .update(users)
        .set({
          passwordHash,
          role: "admin",
          fullName,
          mustChangePassword: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));
      console.log("✓ Cập nhật tài khoản Admin thành công (Yêu cầu đổi mật khẩu lần đầu: BẬT).");
    } else {
      await db.insert(users).values({
        email,
        passwordHash,
        fullName,
        role: "admin",
        mustChangePassword: true,
      });
      console.log("✓ Tạo mới tài khoản Admin thành công (Yêu cầu đổi mật khẩu lần đầu: BẬT).");
    }

    console.log("--------------------------------------------------");
    console.log("✓ Hoàn thành seed tài khoản Admin!");
    console.log(`Đăng nhập bằng: ${email}`);
    console.log("Sau khi đăng nhập, hệ thống sẽ tự động chuyển hướng sang trang đổi mật khẩu bắt buộc.");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản Admin:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();

