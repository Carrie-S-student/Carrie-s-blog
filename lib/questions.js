import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 前台提问箱页面：只展示"已审核公开"的问答，按回复时间倒序（最新回复的在前面）。
 */
export async function getPublishedQuestions() {
  return prisma.question.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { repliedAt: "desc" },
  });
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_QUESTIONS = 3;

export async function isQuestionRateLimited(ip) {
  if (!ip) return false;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.question.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= RATE_LIMIT_MAX_QUESTIONS;
}

export async function createQuestion({ nickname, content, ip }) {
  return prisma.question.create({
    data: { nickname: nickname || null, content, ip },
  });
}

/**
 * 后台：获取全部提问（待审核/已公开/已拒绝），按提交时间倒序。
 */
export async function getAllQuestionsForAdmin() {
  return prisma.question.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 回复并公开一条提问。
 */
export async function replyToQuestion(id, reply) {
  return prisma.question.update({
    where: { id },
    data: { reply, status: "PUBLISHED", repliedAt: new Date() },
  });
}

export async function rejectQuestion(id) {
  return prisma.question.update({
    where: { id },
    data: { status: "REJECTED" },
  });
}

export async function deleteQuestion(id) {
  return prisma.question.delete({ where: { id } });
}
