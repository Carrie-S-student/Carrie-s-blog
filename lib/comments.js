import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 将扁平评论列表转为递归树结构。
 */
function buildTree(flatList) {
  const map = new Map();
  const roots = [];

  // 第一遍：所有节点放入 map，初始化 children
  for (const c of flatList) {
    map.set(c.id, { ...c, children: [] });
  }

  // 第二遍：挂载到父节点或放入 roots
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * 前台：获取一篇文章下所有"可见"的评论（支持任意深度嵌套），按时间正序。
 * 返回格式：递归树，每条评论有 children 数组。
 */
export async function getVisibleCommentsForPost(postId) {
  const all = await prisma.comment.findMany({
    where: { postId, status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });

  return buildTree(all);
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
 * 创建一条回复（支持任意深度嵌套：可以回复任意评论）。
 */
export async function createReply({ postId, parentId, nickname, content, ip }) {
  return prisma.comment.create({
    data: { postId, parentId, nickname, content, ip },
  });
}

/**
 * 后台：获取全部评论（含隐藏的），关联文章标题，供评论管理列表用。
 * 返回递归树结构，支持任意深度嵌套显示。
 */
export async function getAllCommentsForAdmin() {
  const all = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { id: true, title: true, slug: true, section: true } },
    },
  });

  return buildTree(all);
}

export async function setCommentStatus(id, status) {
  return prisma.comment.update({ where: { id }, data: { status } });
}

export async function deleteComment(id) {
  return prisma.comment.delete({ where: { id } });
}
