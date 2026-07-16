import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "博客后台", template: "%s · 后台" },
  description: "博客后台管理系统",
};

const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/posts", label: "文章管理" },
  { href: "/admin/tags", label: "标签管理" },
  { href: "/admin/comments", label: "评论管理" },
  { href: "/admin/questions", label: "提问箱" },
  { href: "/admin/research", label: "Research" },
  { href: "/admin/settings", label: "站点设置" },
];

export default async function AdminLayout({ children }) {
  await requireAdminOrRedirect();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 px-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          博客后台
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            退出登录
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
