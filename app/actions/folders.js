"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createFolder, updateFolder, deleteFolder } from "@/lib/folders";
import { VALID_SECTIONS, sectionPath, sectionAdminPath } from "@/lib/utils";
import { isValidFolderColor } from "@/lib/folderColors";
const MAX_FOLDER_NAME_LENGTH = 20;

/**
 * 创建/更新/删除文件夹后，让对应前台栏目页与后台栏目管理页刷新。
 */
function revalidateFolderPaths(section) {
  const path = sectionPath(section);
  revalidatePath("/");
  revalidatePath(path);
  revalidatePath(`${path}/all`);
  revalidatePath(`${path}/folder`);
  revalidatePath(sectionAdminPath(section));
}

export async function createFolderAction(prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();
  const section = (formData.get("section") || "").toString();
  const parentId = (formData.get("parentId") || "").toString().trim() || null;
  const color = (formData.get("color") || "").toString().trim() || undefined;

  if (!name) {
    return { error: "请填写文件夹名称。" };
  }
  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    return { error: `文件夹名称最多 ${MAX_FOLDER_NAME_LENGTH} 个字。` };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { error: "请选择所属栏目。" };
  }
  if (color && !isValidFolderColor(color)) {
    return { error: "请选择有效的文件夹颜色。" };
  }

  await createFolder({ name, section, parentId, color });

  revalidateFolderPaths(section);

  return { success: true };
}

export async function updateFolderAction(id, prevState, formData) {
  await requireAdmin();

  const name = (formData.get("name") || "").toString().trim();
  const parentId = (formData.get("parentId") || "").toString().trim() || null;
  const color = (formData.get("color") || "").toString().trim() || undefined;

  if (!name) {
    return { error: "请填写文件夹名称。" };
  }
  if (name.length > MAX_FOLDER_NAME_LENGTH) {
    return { error: `文件夹名称最多 ${MAX_FOLDER_NAME_LENGTH} 个字。` };
  }
  if (color && !isValidFolderColor(color)) {
    return { error: "请选择有效的文件夹颜色。" };
  }

  try {
    const folder = await updateFolder(id, { name, parentId, color });
    revalidateFolderPaths(folder.section);
  } catch (err) {
    return { error: err.message || "保存失败，请重试。" };
  }

  return { success: true };
}

export async function deleteFolderAction(id) {
  await requireAdmin();

  const folder = await deleteFolder(id);
  if (folder) {
    revalidateFolderPaths(folder.section);
  }
}
