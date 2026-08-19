"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { generateInitialPassword } from "@/lib/utils";
import {
  createVisitor,
  updateVisitor,
  getVisitorById,
  deleteVisitor,
} from "@/lib/visitors";

const MAX_NAME_LENGTH = 30;
const MAX_PASSWORD_LENGTH = 100;

/** 将 Prisma 唯一约束错误翻译成友好提示。 */
function friendlyError(error) {
  if (error?.code === "P2002") {
    return "用户名或密码已经存在，请换一个。";
  }
  return error instanceof Error ? error.message : "操作失败，请重试。";
}

/**
 * 后台：新增访客用户。只填用户名（如 zhangsan），初始密码自动生成
 * （"我是优秀的" + 用户名），昵称可选（默认等于用户名），初始用户名添加后锁定。
 */
export async function addVisitorAction(prevState, formData) {
  await requireAdmin();

  const username = (formData.get("username") || "").toString().trim();
  const displayName = (formData.get("displayName") || "").toString().trim();

  if (!username) return { error: "请填写用户名。" };
  if (username.length > MAX_NAME_LENGTH) return { error: `用户名太长了，最多 ${MAX_NAME_LENGTH} 个字。` };
  if (displayName.length > MAX_NAME_LENGTH) return { error: `昵称太长了，最多 ${MAX_NAME_LENGTH} 个字。` };

  const password = generateInitialPassword(username);

  try {
    await createVisitor({ name: username, password, displayName: displayName || username });
  } catch (error) {
    return { error: friendlyError(error) };
  }

  revalidatePath("/admin/visitors");
  return { success: true };
}

/**
 * 后台：编辑访客用户。初始用户名锁定不变，可改密码和昵称。
 * 昵称留空则默认用初始用户名。
 */
export async function updateVisitorAction(id, prevState, formData) {
  await requireAdmin();

  const password = (formData.get("password") || "").toString().trim();
  const displayName = (formData.get("displayName") || "").toString().trim();

  if (!password) return { error: "密码不能为空。" };
  if (password.length > MAX_PASSWORD_LENGTH) return { error: `密码太长了，最多 ${MAX_PASSWORD_LENGTH} 个字符。` };
  if (displayName.length > MAX_NAME_LENGTH) return { error: `昵称太长了，最多 ${MAX_NAME_LENGTH} 个字。` };

  const visitor = await getVisitorById(id);
  if (!visitor) return { error: "该访客不存在，可能已被删除。" };

  try {
    await updateVisitor(id, {
      name: visitor.name,
      password,
      displayName: displayName || visitor.name,
    });
  } catch (error) {
    return { error: friendlyError(error) };
  }

  revalidatePath("/admin/visitors");
  return { success: true };
}

/**
 * 后台：删除访客用户。
 */
export async function deleteVisitorAction(id) {
  await requireAdmin();
  await deleteVisitor(id);
  revalidatePath("/admin/visitors");
}
