"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createTag, updateTag, deleteTag } from "@/lib/tags";
import { VALID_SECTIONS } from "@/lib/utils";
const MAX_TAG_NAME_LENGTH = 20;

export async function createTagAction(prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();
  const section = (formData.get("section") || "").toString();

  if (!name) {
    return { error: "请填写标签名称。" };
  }
  if (name.length > MAX_TAG_NAME_LENGTH) {
    return { error: `标签名称最多 ${MAX_TAG_NAME_LENGTH} 个字。` };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { error: "请选择所属栏目。" };
  }

  await createTag({ name, section });

  revalidatePath("/admin/tags");
  revalidatePath("/learning");
  revalidatePath("/thinking");

  return { success: true };
}

export async function updateTagAction(id, prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();

  if (!name) {
    return { error: "请填写标签名称。" };
  }
  if (name.length > MAX_TAG_NAME_LENGTH) {
    return { error: `标签名称最多 ${MAX_TAG_NAME_LENGTH} 个字。` };
  }

  await updateTag(id, { name });

  revalidatePath("/admin/tags");
  revalidatePath("/learning");
  revalidatePath("/thinking");

  return { success: true };
}

export async function deleteTagAction(id) {
  await requireAdmin();

  await deleteTag(id);

  revalidatePath("/admin/tags");
  revalidatePath("/learning");
  revalidatePath("/thinking");
}
