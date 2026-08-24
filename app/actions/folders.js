"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createFolder, updateFolder, deleteFolder } from "@/lib/folders";
import { VALID_SECTIONS, sectionPath } from "@/lib/utils";
const MAX_FOLDER_NAME_LENGTH = 20;

/**
 * 创建文件夹后需要让对应栏目页（文件夹列表）与文章列表刷新。
 */
function revalidateFolderPaths(section) {
  const path = sectionPath(section);
  revalidatePath("/admin/folders");
  revalidatePath("/");
  revalidatePath(path);
  revalidatePath(`${path}/all`);
  revalidatePath(`${path}/folder`);
}

export async function createFolderAction(prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();
  const section = (formData.get("section") || "").toString();

  if (!name) {
    return { error: "请填写文件夹名称。" };
  }
  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    return { error: `文件夹名称最多 ${MAX_FOLDER_NAME_LENGTH} 个字。` };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { error: "请选择所属栏目。" };
  }

  await createFolder({ name, section });

  revalidateFolderPaths(section);

  return { success: true };
}

export async function updateFolderAction(id, prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();

  if (!name) {
    return { error: "请填写文件夹名称。" };
  }
  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    return { error: `文件夹名称最多 ${MAX_FOLDER_NAME_LENGTH} 个字。` };
  }

  const folder = await updateFolder(id, { name });

  revalidateFolderPaths(folder.section);

  return { success: true };
}

export async function deleteFolderAction(id) {
  await requireAdmin();

  const folder = await deleteFolder(id);
  if (folder) {
    revalidateFolderPaths(folder.section);
  }

  revalidatePath("/admin/posts");
}
