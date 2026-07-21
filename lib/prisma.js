import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client.ts";

// Next.js hot-reloads server modules in dev, which would otherwise create a
// new PrismaClient (and a new connection pool) on every edit. Stashing the
// instance on `globalThis` keeps a single client alive across reloads.
//
// 使用 @prisma/adapter-pg 配合显式 Pool 配置：
// - max: 1 → 每个 serverless 实例只维护 1 个 TCP 连接，防止耗尽数据库连接上限
// - connectionTimeoutMillis: 10000 → 避免冷启动时因数据库无响应而无限等待
// - idleTimeoutMillis: 0 → serverless 环境不需要空闲连接回收
const globalForPrisma = globalThis;

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 0,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
