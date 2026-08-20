import "server-only";
import { prisma } from "@/lib/prisma";

// 凌乱模式下墙上一屏最多展示的纸条数（防止纸条过多导致动画卡顿）
export const WALL_MAX_NOTES = 80;

/**
 * 前台留言墙页面：只展示已公开的纸条，按创建时间升序。
 */
export async function getPublishedNotes() {
  return prisma.note.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
  });
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_NOTES = 3;

export async function isNoteRateLimited(ip) {
  if (!ip) return false;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.note.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= RATE_LIMIT_MAX_NOTES;
}

/**
 * 前台访客提交纸条：直接公开显示（无需后台审核）。
 */
export async function createVisitorNote({ visitorId, nickname, content, color, shape, ip }) {
  return prisma.note.create({
    data: {
      authorType: "VISITOR",
      visitorId,
      nickname: nickname || null,
      content,
      color,
      shape,
      ip,
      status: "PUBLISHED",
    },
  });
}

/**
 * 博主在后台（或前台）添加纸条：直接公开，带博主标记。
 */
export async function createAdminNote({ nickname, content, color, shape, posX, posY }) {
  return prisma.note.create({
    data: {
      authorType: "ADMIN",
      nickname: nickname || null,
      content,
      color,
      shape,
      posX,
      posY,
      status: "PUBLISHED",
    },
  });
}

/**
 * 点赞（幂等）：同一身份对同一纸条只能赞一次（NoteLike 唯一约束去重），
 * 重复点击不会取消，点赞数只增不减；不同身份各自 +1。
 * 计数使用冗余字段 likes 原子递增，正常使用下与记录保持一致。
 * 返回 { liked, likes }：liked 恒为 true（成功后），likes 为最新计数。
 */
export async function toggleNoteLike({ noteId, ip }) {
  if (!ip) {
    return { liked: false, likes: 0 };
  }
  const existing = await prisma.noteLike.findUnique({
    where: { noteId_ip: { noteId, ip } },
  });
  if (!existing) {
    try {
      await prisma.$transaction([
        prisma.noteLike.create({ data: { noteId, ip } }),
        prisma.note.update({ where: { id: noteId }, data: { likes: { increment: 1 } } }),
      ]);
    } catch (e) {
      // 并发下重复创建触发唯一约束冲突：已点过赞，无需再加
      if (e?.code !== "P2002") throw e;
    }
  }
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { likes: true },
  });
  return { liked: true, likes: Math.max(0, note?.likes ?? 0) };
}

/**
 * 保存纸条位置（拖拽/放置后调用）。返回是否成功更新。
 */
export async function updateNotePosition({ id, posX, posY }) {
  const result = await prisma.note.updateMany({
    where: { id },
    data: { posX, posY },
  });
  return result.count > 0;
}

/**
 * 后台：获取全部纸条，按提交时间倒序。
 */
export async function getAllNotesForAdmin() {
  return prisma.note.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteNote(id) {
  return prisma.note.delete({ where: { id } });
}
