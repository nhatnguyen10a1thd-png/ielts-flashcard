import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { petSpecies } from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

const SPECIES = [
  {
    id: "owl",
    name: "Cú Tri Thức",
    description: "Biểu tượng của sự uyên bác và kiên trì trong đêm khuya",
    unlockCondition: "free",
    sortOrder: 1,
  },
  {
    id: "cat",
    name: "Mèo Văn Chương",
    description: "Mèo quý tộc yêu thích ngồi trên sách cổ điển",
    unlockCondition: "free",
    sortOrder: 2,
  },
  {
    id: "bunny",
    name: "Thỏ Siêng Năng",
    description: "Thỏ trắng cần mẫn viết chữ từng ngày không nghỉ",
    unlockCondition: "free",
    sortOrder: 3,
  },
  {
    id: "dragon",
    name: "Rồng Ngôn Ngữ",
    description: "Rồng con phun lửa bằng sức mạnh ngôn từ",
    unlockCondition: "streak_7",
    sortOrder: 4,
  },
  {
    id: "fox",
    name: "Cáo Thông Minh",
    description: "Cáo tinh anh với chiến thuật ghi nhớ xuất sắc",
    unlockCondition: "streak_14",
    sortOrder: 5,
  },
  {
    id: "phoenix",
    name: "Phượng Hoàng Bất Khuất",
    description: "Tái sinh từ tro tàn, không bao giờ từ bỏ hành trình học",
    unlockCondition: "streak_30",
    sortOrder: 6,
  },
];

export async function seedPets() {
  console.log("--------------------------------------------------");
  console.log("Khởi tạo danh mục loài Thú Cưng (Pet Species Seed)...");
  console.log("--------------------------------------------------");

  const useSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const db = drizzle(pool);

  try {
    for (const species of SPECIES) {
      await db
        .insert(petSpecies)
        .values({
          id: species.id,
          name: species.name,
          description: species.description,
          unlockCondition: species.unlockCondition,
          sortOrder: species.sortOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: petSpecies.id,
          set: {
            name: species.name,
            description: species.description,
            unlockCondition: species.unlockCondition,
            sortOrder: species.sortOrder,
          },
        });
      console.log(`✓ Loài pet: ${species.name} (${species.id})`);
    }

    console.log("✓ Đã khởi tạo 6 loài thú cưng thành công!");
  } catch (error) {
    console.error("Lỗi khi khởi tạo danh mục pet:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith("seed-pets.ts")) {
  seedPets().catch(() => process.exit(1));
}

