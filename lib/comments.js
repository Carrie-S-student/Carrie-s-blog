import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 前台：获取一篇文章下所有"可见"的评论，按时间正序（像聊天记录一样从旧到新）。
 */
export async function getVisibleCommentsForPost(postId) {
  return prisma.comment.findMany({
    where: { postId, status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 简单防刷：同一个 IP 在时间窗口内评论次数超过限制就拒绝。
 * 不是很严格的方案，但对个人博客这种量级足够用了。
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_COMMENTS = 3;

export async function isRateLimited(ip) {
  if (!ip) return false;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.comment.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= RATE_LIMIT_MAX_COMMENTS;
}

export async function createComment({ postId, nickname, content, ip }) {
  return prisma.comment.create({
    data: { postId, nickname, content, ip },
  });
}

/**
 * 后台：获取全部评论（含隐藏的），关联文章标题，供评论管理列表用。
 */
export async function getAllCommentsForAdmin() {
  return prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { id: true, title: true, slug: true } } },
  });
}

export async function setCommentStatus(id, status) {
  return prisma.comment.update({ where: { id }, data: { status } });
}

export async function deleteComment(id) {
  return prisma.comment.delete({ where: { id } });
}
