import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * 门禁策略：
 * - 首页 / 公开：未登录也能直接浏览文章列表
 * - 其他前台页面（文章详情 / 分类 / 关于等）：未登录 → 重定向到 /gate（你是谁呀？）
 * - /gate 页：已登录则直接进首页
 * - 后台 /admin：只允许管理员访问，否则去 /admin/login
 * - /api：放行，由各接口内部自行鉴权（后台接口已有 requireAdmin 校验）
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 公开静态文件直接放行（robots.txt / sitemap.xml / 微信验证 .txt / favicon.ico / 图片等）
  if (/\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 内部资源直接放行
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  const isAdmin = payload?.role === "admin";
  const isVisitor = payload?.type === "visitor";

  // 后台：仅管理员可访问；登录页本身放行
  if (pathname.startsWith("/admin")) {
    if (isAdmin) return NextResponse.next();
    if (pathname === "/admin/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // API 路由：内部自行鉴权
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 门禁页：已登录（访客或管理员）直接进首页
  if (pathname === "/gate") {
    if (isAdmin || isVisitor) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 首页公开：未登录也能直接浏览文章列表，点开文章时才需要验证
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 其余前台页面：需要访客或管理员会话
  if (!isAdmin && !isVisitor) {
    const url = new URL("/gate", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
