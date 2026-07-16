import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-accent">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">页面不存在</h1>
        <p className="mt-2 text-sm text-muted">
          你访问的页面可能已被移除，或链接地址有误。
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
