import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 记录一次文章访问（每次刷新文章页调用一次）。
 * visitorId 为 null 表示管理员访问。
 * 记录失败不影响页面展示，因此静默吞掉异常。
 */
export async function recordPostView({ postId, visitorId }) {
  try {
    await prisma.postView.create({
      data: { postId, visitorId: visitorId || null },
    });
  } catch {
    // 忽略统计失败
  }
}

/**
 * 后台：每篇文章的点击量汇总（总次数 + 最近访问时间）。
 * 只统计已发布过的文章。
 */
export async function getPostViewStats() {
  const grouped = await prisma.postView.groupBy({
    by: ["postId"],
    _count: { _all: true },
    _max: { viewedAt: true },
  });

  const byPostId = new Map(
    grouped.map((g) => [g.postId, { count: g._count._all, lastViewedAt: g._max.viewedAt }])
  );

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      section: true,
      published: true,
    },
  });

  return posts.map((post) => ({
    ...post,
    viewCount: byPostId.get(post.id)?.count ?? 0,
    lastViewedAt: byPostId.get(post.id)?.lastViewedAt ?? null,
  }));
}

/**
 * 后台：最近的访问明细（谁 / 哪篇文章 / 时间）。
 */
export async function getRecentPostViews(limit = 200) {
  return prisma.postView.findMany({
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: {
      post: { select: { id: true, title: true } },
      visitor: { select: { id: true, name: true, displayName: true } },
    },
  });
}

/**
 * 后台：按访客统计的总访问次数（用于访客管理列表展示）。
 */
export async function getVisitorViewCount(visitorId) {
  return prisma.postView.count({ where: { visitorId } });
}
