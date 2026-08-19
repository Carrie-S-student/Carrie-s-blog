"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  createVisitorToken,
  SESSION_COOKIE_NAME,
  VISITOR_SESSION_DURATION_SECONDS,
} from "@/lib/session";

/** 校验跳转目标必须是站内路径，防止开放重定向。 */
function safeFrom(from) {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }
  return from === "/gate" ? "/" : from;
}

/**
 * 访客登录：输入密码（钥匙），匹配到唯一访客后签发 30 天会话 cookie。
 */
export async function visitorLogin(prevState, formData) {
  const password = (formData.get("password") || "").toString().trim();
  const from = safeFrom(formData.get("from"));

  if (!password) {
    return { error: "请输入密码。" };
  }

  const visitor = await prisma.visitor.findUnique({ where: { password } });
  if (!visitor) {
    return { error: "密码不对，你不是我邀请的人吧？" };
  }

  const token = await createVisitorToken(visitor.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_SESSION_DURATION_SECONDS,
  });

  redirect(from);
}

/**
 * 访客退出登录（清掉会话 cookie，回到门禁页）。
 */
export async function visitorLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/gate");
}
