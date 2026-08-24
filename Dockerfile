# syntax=docker/dockerfile:1
# 博客应用容器镜像：Next.js 16（App Router）+ Prisma 7 + PostgreSQL(Neon)
# 用途：部署到 CloudBase 云托管（容器型），前台/后台/API 一个容器全跑。

########################
# 阶段 1：安装依赖并构建
########################
FROM node:22-slim AS builder
WORKDIR /app

# 复制依赖清单 + prisma schema（postinstall 会运行 prisma generate，需要 schema 已存在）
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# 用 npm install 而非 npm ci：可选依赖（如 sharp 的 @emnapi/*）在 lock 缺失时
# npm ci 会直接失败，npm install 则按 package.json 解析，构建更稳健
RUN npm install --no-audit --no-fund

# 复制源码（排除见 .dockerignore）
COPY . .

# 构建 Next.js 生产包（页面均为 force-dynamic，构建时不会连接数据库）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

########################
# 阶段 2：精简运行镜像
########################
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# CloudBase 云托管要求进程以 root 运行且监听 3000；如改为非 root 需在云托管配置中放开端口权限
# RUN useradd --create-home nextjs && chown -R nextjs:nextjs /app
# USER nextjs

# 从构建阶段复制产物
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/middleware.js ./middleware.js
COPY --from=builder /app/jsconfig.json ./jsconfig.json
COPY --from=builder /app/AGENTS.md ./AGENTS.md

EXPOSE 3000
CMD ["npm", "run", "start"]
