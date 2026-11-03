import { db } from "@/db";
import { topics } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { ImportWizard } from "./ImportWizard";

export default async function AdminImportPage() {
  const activeTopics = await db
    .select({
      id: topics.id,
      name: topics.name,
    })
    .from(topics)
    .where(isNull(topics.deletedAt))
    .orderBy(topics.name);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-[var(--ink)]">
          Nhập Dữ liệu Từ vựng từ Tập tin
        </h2>
        <p className="text-xs text-[var(--ink-secondary)] mt-1">
          Hỗ trợ tải lên file CSV hoặc Excel (.xlsx). Mỗi tập tin tương ứng với một chủ đề. Hệ thống tự động loại bỏ từ trùng lặp theo chủ đề và loại từ.
        </p>
      </div>

      <ImportWizard topics={activeTopics} />
    </div>
  );
}

