import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client.ts";

// Next.js hot-reloads server modules in dev, which would otherwise create a
// new PrismaClient (and a new connection pool) on every edit. Stashing the
// instance on `globalThis` keeps a single client alive across reloads.
//
// 使用 @prisma/adapter-pg 配合显式 Pool 配置：
// - max: 1 → 每个 serverless 实例只维护 1 个 TCP 连接，防止耗尽数据库连接上限
// - connectionTimeoutMillis: 30000 → Neon 免费库休眠后冷启动较慢，留足 30 秒连接窗口
// - idleTimeoutMillis: 0 → serverless 环境不需要空闲连接回收
const globalForPrisma = globalThis;

/**
 * 归一化 Neon 连接串：Neon 的 PgBouncer（pooler）模式不支持 `channel_binding=require`，
 * 该参数会让 node-postgres 在认证阶段挂起直到超时（timeout exceeded when trying to connect）。
 * 这里统一剔除，仅保留 sslmode=require 等安全参数。
 */
function sanitizeConnectionString(raw) {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: sanitizeConnectionString(process.env.DATABASE_URL),
    max: 1,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 0,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
