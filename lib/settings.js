import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAdminSettings() {
  return prisma.adminSettings.findUnique({ where: { id: 1 } });
}

export async function upsertAdminSettings(data) {
  // 读取现有记录以保留 passwordHash（创建时需要该字段）
  const existing = await getAdminSettings();
  return prisma.adminSettings.upsert({
    where: { id: 1 },
    update: data,
    create: {
      id: 1,
      ...data,
      passwordHash: existing?.passwordHash ?? null,
    },
  });
}
