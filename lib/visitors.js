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
 * displayName 不传时默认等于 name（用户名）。
 */
export async function createVisitor({ name, password, displayName }) {
  return prisma.visitor.create({
    data: { name, password, displayName: displayName || name },
  });
}

/**
 * 后台：按 id 查询访客（编辑时保留锁定的用户名）。
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
 * 后台：删除访客用户。访问记录保留（访客字段置空）。
 */
export async function deleteVisitor(id) {
  return prisma.visitor.delete({ where: { id } });
}
