"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { setCommentStatus, deleteComment } from "@/lib/comments";
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
