"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { replyToQuestion, rejectQuestion, deleteQuestion } from "@/lib/questions";

export async function replyToQuestionAction(id, prevState, formData) {
  await requireAdmin();

  const reply = (formData.get("reply") || "").toString().trim();
  if (!reply) {
    return { error: "回复内容不能为空。" };
  }
  if (reply.length > 1000) {
    return { error: "回复太长了，最多 1000 个字。" };
  }

  await replyToQuestion(id, reply);
  revalidatePath("/ask");
  revalidatePath("/admin/questions");

  return { success: true };
}

export async function rejectQuestionAction(id) {
  await requireAdmin();
  await rejectQuestion(id);
  revalidatePath("/admin/questions");
}

export async function deleteQuestionAction(id) {
  await requireAdmin();
  await deleteQuestion(id);
  revalidatePath("/ask");
  revalidatePath("/admin/questions");
}
