"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/actions/auth";

// 使用客户端组件无法导出 metadata，在 layout 中设置默认即可

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        后台登录
      </h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        输入管理员密码进入后台
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="from" value={from} />
        <div>
          <label htmlFor="password" className="sr-only">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="密码"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {pending ? "登录中…" : "登录"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
