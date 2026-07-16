import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

// Next.js hot-reloads server modules in dev, which would otherwise create a
// new PrismaClient (and a new connection pool) on every edit. Stashing the
// instance on `globalThis` keeps a single client alive across reloads.
const globalForPrisma = globalThis;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
