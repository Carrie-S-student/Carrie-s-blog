import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * 数据访问层（DAL）：所有需要"管理员权限"的 Server Action / Route Handler
 * 都应该在真正读写数据库之前调用这里的函数再校验一次会话。
 *
 * Proxy（proxy.js）只是页面级别的"乐观检查"，避免没登录的人看到后台页面；
 * 但 Server Action 和 Route Handler 本质上是可以被直接调用的公开接口，
 * 所以这里必须再做一次真正的校验，不能只依赖 Proxy。
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return session;
});

/**
 * 用在 Server Action / Route Handler 里：不是管理员就直接抛错，中断执行。
 */
export async function requireAdmin() {
  const session = await verifySession();
  if (!session) {
    throw new Error("未登录或登录已过期，请重新登录后台。");
  }
  return session;
}

/**
 * 用在后台页面（Server Component）里：不是管理员就跳转去登录页。
 * proxy.js 已经会拦一次，这里是双重保险（比如直接命中 build 缓存等边缘情况）。
 */
export async function requireAdminOrRedirect() {
  const session = await verifySession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
