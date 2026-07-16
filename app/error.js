"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-accent">500</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">出了点问题</h1>
        <p className="mt-2 text-sm text-muted">
          {error?.message || "页面加载时发生了意外错误，请稍后重试。"}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-full border border-card-border px-6 py-2 text-sm text-muted transition hover:text-foreground"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
