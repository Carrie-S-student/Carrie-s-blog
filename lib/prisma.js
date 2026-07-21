import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "./generated/prisma/client.ts";

// Next.js hot-reloads server modules in dev, which would otherwise create a
// new PrismaClient (and a new connection pool) on every edit. Stashing the
// instance on `globalThis` keeps a single client alive across reloads.
//
// 使用 @prisma/adapter-neon 而非 @prisma/adapter-pg：
// neon driver 基于 WebSocket/HTTP，兼容 Netlify/Vercel 等 serverless 环境，
// 不会像 pg (TCP) 在 serverless 中出现连接池异常。
const globalForPrisma = globalThis;

function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeon(sql);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
