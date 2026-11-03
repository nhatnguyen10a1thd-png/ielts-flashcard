import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

// Lấy số lượng từ cần sinh từ tham số dòng lệnh (mặc định 1.000.000 từ)
const args = process.argv.slice(2);
let targetCount = 1000000;
for (const arg of args) {
  if (arg.startsWith("--count=")) {
    targetCount = parseInt(arg.split("=")[1], 10) || 1000000;
  }
}

const BATCH_SIZE = 5000; // 5.000 từ mỗi lô để tối ưu RAM và tốc độ PostgreSQL
const TOTAL_TOPICS = 50; // Phân bổ 1.000.000 từ vào 50 chủ đề (mỗi chủ đề ~20.000 từ)

const TOPIC_NAMES = [
  "Academic Writing & Discourse",
  "Environment & Climate Ecology",
  "Artificial Intelligence & Future Tech",
  "Economics, Banking & Global Trade",
  "Medical Sciences & Public Health",
  "Urban Planning & Smart Cities",
  "Psychology & Human Behavior",
  "History, Heritage & Archaeology",
  "Astronomy, Space & Astrophysics",
  "Marine Biology & Oceanography",
  "Sociology & Cultural Identity",
  "Education Reform & Pedagogy",
  "Media, Journalism & Information Ethics",
  "Renewable Energy & Power Grids",
  "Agriculture, Soil & Food Security",
  "Law, Human Rights & Governance",
  "Literature, Philosophy & Aesthetics",
  "Transportation, Logistics & Aviation",
  "Genetics, Biotechnology & CRISPR",
  "Linguistics & Cross-Cultural Communication",
  "Entrepreneurship & Corporate Strategy",
  "Architecture & Sustainable Construction",
  "Meteorology & Extreme Weather",
  "Neuroscience & Cognitive Computing",
  "Geopolitics & International Diplomacy",
  "Digital Security & Cryptography",
  "Materials Science & Nanotechnology",
  "Hydrology & Global Water Resources",
  "Anthropology & Ancient Civilizations",
  "Robotics & Automated Manufacturing",
  "Tourism, Ecotourism & Hospitality",
  "Demographics, Migration & Population",
  "Renewable Materials & Circular Economy",
  "Biomedical Engineering & Prosthetics",
  "Data Analytics & Big Data Ethics",
  "Ecosystem Services & Forest Conservation",
  "Labor Markets & The Gig Economy",
  "Disaster Management & Resilience",
  "Renewable Fuels & Clean Propulsion",
  "Urbanization & Megacity Infrastructure",
  "Cognitive Psychology & Memory",
  "Intellectual Property & Innovation Law",
  "Astrophysics & Deep Space Exploration",
  "Supply Chain Resilience & Maritime Shipping",
  "Public Policy & Social Welfare Systems",
  "Telecommunications & Satellite Networks",
  "Ethical Philosophy & Modern Moral Issues",
  "Geothermal & Hydroelectric Systems",
  "Pharmaceutical Innovations & Clinical Trials",
  "Comparative Politics & Democratic Institutions",
];

const PARTS_OF_SPEECH = ["noun", "verb", "adjective", "adverb"];

const PREFIXES = [
  "inter", "trans", "multi", "hyper", "ultra", "sub", "micro", "macro", "chrono", "bio",
  "geo", "psycho", "socio", "neuro", "crypto", "paleo", "omni", "tele", "thermo", "aero",
  "meta", "poly", "quasi", "proto", "retro", "infra", "pan", "para", "sym", "dia"
];

const ROOTS = [
  "connect", "struct", "morph", "gen", "phon", "graph", "scop", "ject", "sect", "port",
  "script", "tract", "vers", "duct", "spect", "stat", "fac", "pos", "tend", "dict",
  "sequ", "cogn", "corp", "voc", "cred", "flu", "rupt", "pel", "press", "mand"
];

const SUFFIXES = [
  "tion", "ology", "istic", "ified", "ment", "ivity", "ional", "izing", "ative", "eness",
  "ulate", "orous", "icide", "itude", "esque", "atory", "ance", "ence", "iable", "itude"
];

function formatProgressBar(current: number, total: number, width = 30): string {
  const percent = Math.min(100, (current / total) * 100);
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(Math.max(0, empty));
  return `[${bar}] ${percent.toFixed(1).padStart(5, " ")}% (${current.toLocaleString()} / ${total.toLocaleString()})`;
}

async function seedFakeWords() {
  console.log("==================================================================");
  console.log(`BẮT ĐẦU SINH DỮ LIỆU GIẢ: MỤC TIÊU ${targetCount.toLocaleString()} TỪ VỰNG`);
  console.log(`Lô ghi: ${BATCH_SIZE.toLocaleString()} từ/lô | Số chủ đề: ${TOTAL_TOPICS}`);
  console.log("==================================================================");

  const startTime = Date.now();
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // 1. Tạo 50 chủ đề chuẩn bị nạp từ
    console.log(`\n1. Kiểm tra hoặc khởi tạo ${TOTAL_TOPICS} chủ đề...`);
    const topicIds: string[] = [];

    for (let i = 0; i < TOTAL_TOPICS; i++) {
      const topicName = TOPIC_NAMES[i] || `IELTS Advanced Academic Vocab Part ${i + 1}`;
      const slug = `ielts-vocab-topic-${i + 1}`;

      const res = await client.query(
        `
        INSERT INTO topics (name, slug, description, is_visible, created_at, updated_at)
        VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET is_visible = true
        RETURNING id;
      `,
        [topicName, slug, `Bộ từ vựng IELTS chuyên sâu chủ đề: ${topicName}`]
      );

      topicIds.push(res.rows[0].id);
    }

    console.log(`✓ Đã sẵn sàng ${topicIds.length} chủ đề trong cơ sở dữ liệu.`);

    // 2. Sinh dữ liệu từ vựng theo từng lô
    console.log(`\n2. Bắt đầu ghi ${targetCount.toLocaleString()} từ vựng (Batch size: ${BATCH_SIZE})...`);

    let totalInserted = 0;
    let currentBatch: string[] = [];
    let batchIndex = 0;
    const totalBatches = Math.ceil(targetCount / BATCH_SIZE);

    // Mở transaction lớn theo khối 50.000 từ để giảm chi phí fsync WAL
    await client.query("BEGIN;");

    for (let i = 0; i < targetCount; i++) {
      const topicIndex = i % TOTAL_TOPICS;
      const topicId = topicIds[topicIndex];
      const wordIndexInTopic = Math.floor(i / TOTAL_TOPICS);

      const pfx = PREFIXES[wordIndexInTopic % PREFIXES.length];
      const root = ROOTS[(wordIndexInTopic >> 2) % ROOTS.length];
      const sfx = SUFFIXES[(wordIndexInTopic >> 4) % SUFFIXES.length];
      const seq = Math.floor(wordIndexInTopic / (PREFIXES.length * ROOTS.length));

      // Tạo từ tiếng Anh độc nhất trong chủ đề
      const baseWord = seq === 0 ? `${pfx}${root}${sfx}` : `${pfx}${root}${sfx}-${seq}`;
      const pos = PARTS_OF_SPEECH[wordIndexInTopic % PARTS_OF_SPEECH.length];
      const meaning = `Nghĩa học thuật của từ ${baseWord} trong ngữ cảnh ${TOPIC_NAMES[topicIndex].split("&")[0].trim()}`;
      const pronunciation = `/${pfx}.${root}.${sfx}/`;
      const synonymsJson = JSON.stringify([`${pfx}${root}`, `${root}${sfx}`]);

      // Định dạng SQL row
      const escapedTopicId = `'${topicId}'`;
      const escapedWord = `'${baseWord.replace(/'/g, "''")}'`;
      const escapedWordNorm = `'${baseWord.toLowerCase().replace(/'/g, "''")}'`;
      const escapedPos = `'${pos}'`;
      const escapedMeaning = `'${meaning.replace(/'/g, "''")}'`;
      const escapedPron = `'${pronunciation.replace(/'/g, "''")}'`;
      const escapedSynonyms = `'${synonymsJson.replace(/'/g, "''")}'::jsonb`;

      currentBatch.push(
        `(${escapedTopicId}, ${escapedWord}, ${escapedWordNorm}, ${escapedPos}, ${escapedMeaning}, ${escapedPron}, ${escapedSynonyms}, NOW())`
      );

      if (currentBatch.length >= BATCH_SIZE || i === targetCount - 1) {
        batchIndex++;
        const insertSql = `
          INSERT INTO words (topic_id, word, word_normalized, part_of_speech, meaning, pronunciation, synonyms, created_at)
          VALUES ${currentBatch.join(",\n")}
          ON CONFLICT (topic_id, word_normalized, COALESCE(part_of_speech, '')) DO NOTHING;
        `;

        await client.query(insertSql);
        totalInserted += currentBatch.length;
        currentBatch = [];

        // Commit transaction mỗi 50.000 dòng để giải phóng buffer
        if (totalInserted % 50000 === 0) {
          await client.query("COMMIT;");
          if (totalInserted < targetCount) {
            await client.query("BEGIN;");
          }
        }

        // In thanh tiến trình mỗi 5 lô hoặc lô cuối
        if (batchIndex % 5 === 0 || batchIndex === totalBatches) {
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speed = Math.round(totalInserted / elapsedSec);
          const etaSec = speed > 0 ? Math.round((targetCount - totalInserted) / speed) : 0;
          process.stdout.write(
            `\r${formatProgressBar(totalInserted, targetCount)} | ${elapsedSec.toFixed(1)}s | ${speed.toLocaleString()} từ/s | ETA: ${etaSec}s    `
          );
        }
      }
    }

    // Đảm bảo commit transaction cuối cùng
    try {
      await client.query("COMMIT;");
    } catch {
      // Đã commit trước đó
    }

    console.log("\n");

    // 3. Tối ưu thống kê PostgreSQL sau khi nạp khối lượng lớn
    console.log("3. Chạy ANALYZE words và VACUUM để PostgreSQL cập nhật thống kê query planner...");
    await client.query("ANALYZE words;");
    await client.query("ANALYZE topics;");

    // Đếm tổng số từ hiện có trong database
    const countRes = await client.query("SELECT COUNT(*) AS total FROM words;");
    const dbTotal = parseInt(countRes.rows[0].total, 10);

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("==================================================================");
    console.log(`✓ HOÀN THÀNH SINH DỮ LIỆU TRONG ${totalSeconds} GIÂY!`);
    console.log(`✓ Tổng số từ vựng thực tế trong cơ sở dữ liệu: ${dbTotal.toLocaleString()} từ.`);
    console.log("==================================================================");
  } catch (error) {
    console.error("Lỗi khi sinh dữ liệu giả:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedFakeWords();
