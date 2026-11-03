"use server";

import { db } from "@/db";
import { topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${normalized}-${Date.now().toString(36)}`;
}

export async function createTopicAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const isVisible = formData.get("isVisible") === "true";

  if (!name) {
    return { success: false, error: "Vui lòng nhập tên chủ đề." };
  }

  try {
    const slug = slugify(name);
    await db.insert(topics).values({
      name,
      slug,
      description,
      isVisible,
    });

    revalidatePath("/admin/chu-de");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Create topic error:", err);
    return { success: false, error: "Lỗi khi tạo chủ đề mới." };
  }
}

export async function updateTopicAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const isVisible = formData.get("isVisible") === "true";

  if (!id || !name) {
    return { success: false, error: "Tên chủ đề không được để trống." };
  }

  try {
    await db
      .update(topics)
      .set({
        name,
        description,
        isVisible,
        updatedAt: new Date(),
      })
      .where(eq(topics.id, id));

    revalidatePath("/admin/chu-de");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Update topic error:", err);
    return { success: false, error: "Lỗi khi cập nhật chủ đề." };
  }
}

export async function toggleTopicVisibilityAction(id: string, isVisible: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  try {
    await db
      .update(topics)
      .set({
        isVisible,
        updatedAt: new Date(),
      })
      .where(eq(topics.id, id));

    revalidatePath("/admin/chu-de");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Toggle topic visibility error:", err);
    return { success: false, error: "Lỗi khi đổi trạng thái hiển thị." };
  }
}

/**
 * Xoá mềm (soft-delete): đánh dấu deleted_at = new Date()
 * Có thể khôi phục trong vòng 30 ngày
 */
export async function deleteTopicAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  try {
    await db
      .update(topics)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(topics.id, id));

    revalidatePath("/admin/chu-de");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Delete topic error:", err);
    return { success: false, error: "Lỗi khi xoá chủ đề." };
  }
}

/**
 * Khôi phục chủ đề đã bị xoá mềm
 */
export async function restoreTopicAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Không có quyền thực hiện." };
  }

  try {
    await db
      .update(topics)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(topics.id, id));

    revalidatePath("/admin/chu-de");
    revalidatePath("/chu-de");
    return { success: true };
  } catch (err) {
    console.error("Restore topic error:", err);
    return { success: false, error: "Lỗi khi khôi phục chủ đề." };
  }
}

