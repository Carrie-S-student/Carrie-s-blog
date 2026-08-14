"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { MAX_CHANGE_COUNT } from "@/lib/utils";
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
 * 访客修改密码（首页底部）：
 * - 必须已登录（通过会话识别身份）
 * - 需验证当前密码
 * - 新密码全站唯一、不能和当前密码相同
 * - 每人最多改 3 次
 * - 修改后写入通知中心，踢下线，用新密码重新登录
 */
export async function changePassword(prevState, formData) {
  const currentPassword = (formData.get("currentPassword") || "").toString().trim();
  const newPassword = (formData.get("newPassword") || "").toString().trim();

  if (!currentPassword) {
    return { error: "请输入当前密码。" };
  }
  if (!newPassword) {
    return { error: "请输入新密码。" };
  }
  if (newPassword === currentPassword) {
    return { error: "新密码和当前密码一样，换一个吧。" };
  }

  const session = await verifySession();
  if (!session || session.type !== "visitor" || !session.visitorId) {
    return { error: "登录状态已失效，请重新登录后再修改。" };
  }

  const visitor = await prisma.visitor.findUnique({
    where: { id: session.visitorId },
  });
  if (!visitor) {
    return { error: "用户不存在，可能已被管理员删除。" };
  }

  if (visitor.changeCount >= MAX_CHANGE_COUNT) {
    return { error: `修改次数已用完（最多 ${MAX_CHANGE_COUNT} 次）。` };
  }

  if (visitor.password !== currentPassword) {
    return { error: "当前密码不对。" };
  }

  const duplicate = await prisma.visitor.findUnique({ where: { password: newPassword } });
  if (duplicate) {
    return { error: "这个密码已经被其他人使用了，换一个吧。" };
  }

  await prisma.$transaction([
    prisma.visitor.update({
      where: { id: visitor.id },
      data: { password: newPassword, changeCount: visitor.changeCount + 1 },
    }),
    prisma.passwordChangeLog.create({
      data: {
        visitorId: visitor.id,
        oldPassword: currentPassword,
        newPassword,
      },
    }),
  ]);

  // 踢下线：清除会话，跳回门禁页并提示用新密码登录
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/gate?msg=changed");
}

/**
 * 访客退出登录（清掉会话 cookie，回到门禁页）。
 */
export async function visitorLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/gate");
}
