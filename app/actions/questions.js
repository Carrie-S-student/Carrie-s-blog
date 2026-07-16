"use server";

import { revalidatePath } from "next/cache";
import { createQuestion, isQuestionRateLimited } from "@/lib/questions";
import { getClientIp } from "@/lib/request-ip";

const MAX_NICKNAME_LENGTH = 30;
const MAX_CONTENT_LENGTH = 500;

export async function submitQuestion(prevState, formData) {
  const nickname = (formData.get("nickname") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();

  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return { error: `昵称太长了，最多 ${MAX_NICKNAME_LENGTH} 个字。` };
  }
  if (!content) {
    return { error: "提问内容不能为空。" };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `内容太长了，最多 ${MAX_CONTENT_LENGTH} 个字。` };
  }

  const ip = await getClientIp();
  if (await isQuestionRateLimited(ip)) {
    return { error: "提问太频繁了，过一会儿再试试。" };
  }

  await createQuestion({ nickname: nickname || null, content, ip });
  revalidatePath("/ask");

  return { success: true };
}
