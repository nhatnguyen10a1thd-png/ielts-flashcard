import { adminAuth, adminDb } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || "admin@ielts-flashcard.vn";
const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
const adminFullName = process.env.ADMIN_NAME || "Quản Trị Viên Hệ Thống";

async function seedFirebaseAdmin() {
  console.log("==================================================================");
  console.log("KHỞI TẠO TÀI KHOẢN ADMIN TRÊN FIREBASE AUTH VÀ CLOUD FIRESTORE");
  console.log("==================================================================");

  try {
    let userRecord;

    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail);
      console.log(`Tài khoản Admin đã tồn tại trên Firebase Auth: ${userRecord.uid}`);
      // Cập nhật lại mật khẩu nếu cần
      await adminAuth.updateUser(userRecord.uid, {
        password: adminPassword,
        displayName: adminFullName,
      });
    } catch {
      // Chưa tồn tại -> Tạo mới
      userRecord = await adminAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminFullName,
        emailVerified: true,
      });
      console.log(`✓ Đã tạo người dùng mới trên Firebase Auth: ${userRecord.uid}`);
    }

    // Thiết lập Custom Claims cho Admin
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
    });
    console.log(`✓ Đã gán quyền Custom Claims: { role: 'admin' }`);

    // Lưu thông tin người dùng vào Firestore
    await adminDb.collection("users").doc(userRecord.uid).set(
      {
        email: adminEmail,
        fullName: adminFullName,
        role: "admin",
        mustChangePassword: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✓ Đã cập nhật bản ghi Admin trong collection 'users' với mustChangePassword = true`);
    console.log("\n==================================================================");
    console.log("🎉 KHỞI TẠO ADMIN FIREBASE THÀNH CÔNG!");
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Mật khẩu: ${adminPassword}`);
    console.log("- Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.");
    console.log("==================================================================");
  } catch (error) {
    console.error("Lỗi khi khởi tạo Admin trên Firebase:", error);
    process.exit(1);
  }
}

seedFirebaseAdmin();

