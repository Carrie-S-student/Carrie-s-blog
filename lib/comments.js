import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 前台：获取一篇文章下所有"可见"的评论（顶级 + 回复），按时间正序。
 * 返回格式：顶级评论数组，每条评论包含 children（回复列表）。
 */
export async function getVisibleCommentsForPost(postId) {
  const all = await prisma.comment.findMany({
    where: { postId, status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });

  // 分离顶级评论和回复
  const parents = [];
  const childMap = new Map();

  for (const c of all) {
    if (c.parentId) {
      const siblings = childMap.get(c.parentId) || [];
      siblings.push(c);
      childMap.set(c.parentId, siblings);
    } else {
      parents.push(c);
    }
  }

  // 将回复挂到对应父评论下
  return parents.map((p) => ({
    ...p,
    children: childMap.get(p.id) || [],
  }));
}

/**
 * 简单防刷：同一个 IP 在时间窗口内评论次数超过限制就拒绝。
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
 * 创建一条回复（对某条评论的回复，只能回复顶级评论，不能嵌套回复回复）。
 */
export async function createReply({ postId, parentId, nickname, content, ip }) {
  return prisma.comment.create({
    data: { postId, parentId, nickname, content, ip },
  });
}

/**
 * 后台：获取全部评论（含隐藏的），关联文章标题，供评论管理列表用。
 * 包含 parentId 和 children，方便后台展示嵌套关系。
 */
export async function getAllCommentsForAdmin() {
  const all = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { id: true, title: true, slug: true, section: true } },
    },
  });

  // 按 parentId 分组
  const parents = [];
  const childMap = new Map();

  for (const c of all) {
    if (c.parentId) {
      const siblings = childMap.get(c.parentId) || [];
      siblings.push(c);
      childMap.set(c.parentId, siblings);
    } else {
      parents.push(c);
    }
  }

  return parents.map((p) => ({
    ...p,
    children: childMap.get(p.id) || [],
  }));
}

export async function setCommentStatus(id, status) {
  return prisma.comment.update({ where: { id }, data: { status } });
}

export async function deleteComment(id) {
  return prisma.comment.delete({ where: { id } });
}
