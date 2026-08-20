"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { deleteNote, createAdminNote } from "@/lib/notes";
import {
  NOTE_COLOR_KEYS,
  NOTE_SHAPE_KEYS,
  NOTE_MAX_CONTENT,
  NOTE_MAX_NICKNAME,
} from "@/lib/note-styles";

export async function deleteNoteAction(id) {
  await requireAdmin();
  await deleteNote(id);
  revalidatePath("/wall");
  revalidatePath("/admin/notes");
}

/**
 * 博主在后台添加纸条：直接公开，位置随机落在墙上（之后可去前台拖拽调整）。
 */
export async function createAdminNoteAction(prevState, formData) {
  await requireAdmin();

  const nickname = (formData.get("nickname") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const color = (formData.get("color") || "").toString();
  const shape = (formData.get("shape") || "").toString();

  if (nickname.length > NOTE_MAX_NICKNAME) {
    return { error: `昵称太长了，最多 ${NOTE_MAX_NICKNAME} 个字。` };
  }
  if (!content) {
    return { error: "纸条内容不能为空。" };
  }
  if (content.length > NOTE_MAX_CONTENT) {
    return { error: `纸条太长了，最多 ${NOTE_MAX_CONTENT} 个字。` };
  }
  if (!NOTE_COLOR_KEYS.includes(color)) {
    return { error: "请选择纸条颜色。" };
  }
  if (!NOTE_SHAPE_KEYS.includes(shape)) {
    return { error: "请选择纸条形状。" };
  }

  // 后台看不到墙，先随机放一个位置，博主之后可以到前台拖拽调整
  const posX = Math.round((12 + Math.random() * 76) * 100) / 100;
  const posY = Math.round((10 + Math.random() * 72) * 100) / 100;

  await createAdminNote({ nickname, content, color, shape, posX, posY });
  revalidatePath("/wall");
  revalidatePath("/admin/notes");
  return { success: true };
}
