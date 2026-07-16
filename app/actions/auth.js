"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/session";

/**
 * 后台登录：只有一个全站密码（存在环境变量 ADMIN_PASSWORD 里），
 * 密码对了就签发一个 session cookie。
 */
export async function login(prevState, formData) {
  const password = formData.get("password");
  const from = formData.get("from") || "/admin";

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: "服务器还没有配置管理员密码（ADMIN_PASSWORD），请检查 .env 文件。" };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "请输入密码。" };
  }

  if (password !== adminPassword) {
    return { error: "密码不对，再试一次。" };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  redirect(from);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
