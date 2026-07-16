import "server-only";
import { headers } from "next/headers";

/**
 * 获取访客 IP，用于简单的评论/提问防刷限流。
 * Vercel 部署时请求会带 x-forwarded-for，本地开发时通常拿不到，返回 null 也没关系
 * （限流函数对 null 直接放行）。
 */
export async function getClientIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || null;
}
