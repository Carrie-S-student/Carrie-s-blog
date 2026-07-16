"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createResearch, updateResearch, deleteResearch } from "@/lib/research";

export async function createResearchAction(prevState, formData) {
  await requireAdmin();

  const title = (formData.get("title") || "").toString().trim();
  const publishedDate = (formData.get("publishedDate") || "").toString();
  const journal = (formData.get("journal") || "").toString().trim();

  if (!title) return { error: "请填写论文题目。" };
  if (!publishedDate) return { error: "请选择发表时间。" };
  if (!journal) return { error: "请填写发表期刊/会议。" };

  await createResearch({ title, publishedDate, journal });

  revalidatePath("/admin/research");
  revalidatePath("/research");

  return { success: true };
}

export async function updateResearchAction(id, prevState, formData) {
  await requireAdmin();

  const title = (formData.get("title") || "").toString().trim();
  const publishedDate = (formData.get("publishedDate") || "").toString();
  const journal = (formData.get("journal") || "").toString().trim();

  if (!title) return { error: "请填写论文题目。" };
  if (!publishedDate) return { error: "请选择发表时间。" };
  if (!journal) return { error: "请填写发表期刊/会议。" };

  await updateResearch(id, { title, publishedDate, journal });

  revalidatePath("/admin/research");
  revalidatePath("/research");

  return { success: true };
}

export async function deleteResearchAction(id) {
  await requireAdmin();

  await deleteResearch(id);

  revalidatePath("/admin/research");
  revalidatePath("/research");
}
