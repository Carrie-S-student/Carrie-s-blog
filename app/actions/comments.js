"use server";

import { revalidatePath } from "next/cache";
import { createComment, createReply, isRateLimited } from "@/lib/comments";
import { getClientIp } from "@/lib/request-ip";

const MAX_NICKNAME_LENGTH = 30;
const MAX_CONTENT_LENGTH = 1000;

export async function submitComment(prevState, formData) {
  const postId = formData.get("postId");
  const postPath = formData.get("postPath");
  const nickname = (formData.get("nickname") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();

  if (!postId || !postPath) {
    return { error: "缺少文章信息，请刷新页面重试。" };
  }
  if (!nickname) {
    return { error: "请填写一个昵称。" };
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return { error: `昵称太长了，最多 ${MAX_NICKNAME_LENGTH} 个字。` };
  }
  if (!content) {
    return { error: "评论内容不能为空。" };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `评论太长了，最多 ${MAX_CONTENT_LENGTH} 个字。` };
  }

  const ip = await getClientIp();
  if (await isRateLimited(ip)) {
    return { error: "评论太频繁了，过一会儿再试试。" };
  }

  await createComment({ postId, nickname, content, ip });
  revalidatePath(postPath);

  return { success: true };
}

/**
 * 回复某条评论（支持任意深度嵌套：可以回复任意评论）。
 * parentId 通过 bind 绑定，postPath 和 postId 放在 hidden input 里。
 */
export async function submitReply(parentId, prevState, formData) {
  const postId = formData.get("postId");
  const postPath = formData.get("postPath");
  const nickname = (formData.get("nickname") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();

  if (!parentId) {
    return { error: "缺少回复目标，请刷新页面重试。" };
  }
  if (!postId || !postPath) {
    return { error: "缺少文章信息，请刷新页面重试。" };
  }
  if (!nickname) {
    return { error: "请填写一个昵称。" };
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return { error: `昵称太长了，最多 ${MAX_NICKNAME_LENGTH} 个字。` };
  }
  if (!content) {
    return { error: "回复内容不能为空。" };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `回复太长了，最多 ${MAX_CONTENT_LENGTH} 个字。` };
  }

  const ip = await getClientIp();
  if (await isRateLimited(ip)) {
    return { error: "回复太频繁了，过一会儿再试试。" };
  }

  await createReply({ postId, parentId, nickname, content, ip });
  revalidatePath(postPath);

  return { success: true };
}
