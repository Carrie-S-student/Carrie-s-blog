"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { setCommentStatus, deleteComment, createReply } from "@/lib/comments";
import { prisma } from "@/lib/prisma";
import { sectionPath } from "@/lib/utils";

async function revalidatePostPage(postId) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { section: true, slug: true } });
  if (post) {
    revalidatePath(`${sectionPath(post.section)}/${post.slug}`);
  }
}

export async function hideCommentAction(id, postId) {
  await requireAdmin();
  await setCommentStatus(id, "HIDDEN");
  await revalidatePostPage(postId);
}

export async function showCommentAction(id, postId) {
  await requireAdmin();
  await setCommentStatus(id, "VISIBLE");
  await revalidatePostPage(postId);
}

export async function deleteCommentAction(id, postId) {
  await requireAdmin();
  await deleteComment(id);
  await revalidatePostPage(postId);
}

/**
 * 管理员回复评论（跳过限流，昵称固定为"博主"）。
 * 通过 bind 绑定 parentId，使用方式同 submitReply。
 */
export async function adminReplyComment(parentId, prevState, formData) {
  await requireAdmin();

  const postId = formData.get("postId");
  const postPath = formData.get("postPath");
  const content = (formData.get("content") || "").toString().trim();

  if (!parentId) {
    return { error: "缺少回复目标。" };
  }
  if (!postId || !postPath) {
    return { error: "缺少文章信息。" };
  }
  if (!content) {
    return { error: "回复内容不能为空。" };
  }
  if (content.length > 1000) {
    return { error: "回复太长了，最多 1000 个字。" };
  }

  await createReply({ postId, parentId, nickname: "博主", content, ip: null });
  revalidatePath(postPath);

  return { success: true };
}
