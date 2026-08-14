import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 后台：获取全部访客用户，按创建时间倒序。
 */
export async function getAllVisitors() {
  return prisma.visitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { views: true } },
    },
  });
}

/**
 * 后台：新增访客用户。name（初始用户名）与 password（密码）都必须全局唯一。
 * displayName 不传时默认等于 name（初始显示名）。
 */
export async function createVisitor({ name, password, displayName }) {
  return prisma.visitor.create({
    data: { name, password, displayName: displayName || name },
  });
}

/**
 * 后台：按 id 查询访客（编辑时保留锁定的欢迎语名称用）。
 */
export async function getVisitorById(id) {
  return prisma.visitor.findUnique({ where: { id } });
}

/**
 * 后台：更新访客用户。可改密码、昵称（displayName），唯一性由数据库约束保证。
 */
export async function updateVisitor(id, { name, password, displayName }) {
  const data = { name, password };
  if (typeof displayName === "string") {
    data.displayName = displayName;
  }
  return prisma.visitor.update({
    where: { id },
    data,
  });
}

/**
 * 后台：删除访客用户。密码修改记录随之级联删除，访问记录保留（访客字段置空）。
 */
export async function deleteVisitor(id) {
  return prisma.visitor.delete({ where: { id } });
}

/**
 * 后台：获取全部通知（密码修改 + 改名记录），合并按时间倒序。
 * 统一结构：{ id, type: "password" | "name", visitorName, oldValue, newValue, read, createdAt }
 */
export async function getAllVisitorLogs() {
  const [passwordLogs, nameLogs] = await Promise.all([
    prisma.passwordChangeLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { visitor: { select: { name: true } } },
    }),
    prisma.nameChangeLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { visitor: { select: { name: true } } },
    }),
  ]);

  const logs = [
    ...passwordLogs.map((log) => ({
      id: log.id,
      type: "password",
      visitorName: log.visitor?.name || "（已删除的访客）",
      oldValue: log.oldPassword,
      newValue: log.newPassword,
      read: log.read,
      createdAt: log.createdAt,
    })),
    ...nameLogs.map((log) => ({
      id: log.id,
      type: "name",
      visitorName: log.visitor?.name || "（已删除的访客）",
      oldValue: log.oldName,
      newValue: log.newName,
      read: log.read,
      createdAt: log.createdAt,
    })),
  ];

  return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * 后台：将某条通知标记为已读（type: "password" | "name"）。
 */
export async function markLogRead(type, id) {
  if (type === "password") {
    return prisma.passwordChangeLog.update({ where: { id }, data: { read: true } });
  }
  return prisma.nameChangeLog.update({ where: { id }, data: { read: true } });
}

/**
 * 后台：将全部通知标记为已读（改密 + 改名）。
 */
export async function markAllLogsRead() {
  await prisma.$transaction([
    prisma.passwordChangeLog.updateMany({ data: { read: true } }),
    prisma.nameChangeLog.updateMany({ data: { read: true } }),
  ]);
}

/**
 * 后台：统计未读通知数量（改密 + 改名，概览页用）。
 */
export async function getUnreadLogCount() {
  const [passwordCount, nameCount] = await Promise.all([
    prisma.passwordChangeLog.count({ where: { read: false } }),
    prisma.nameChangeLog.count({ where: { read: false } }),
  ]);
  return passwordCount + nameCount;
}
