"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { visitorLogin } from "@/app/actions/visitor-auth";

export default function GateForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const msg = searchParams.get("msg");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(visitorLogin, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-card-border bg-card p-8 shadow-sm">
          <div className="text-center">
            <div className="text-3xl">🌙</div>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">你是谁呀？</h1>
            <p className="mt-2 text-sm text-muted">
              这是一个私人博客，请输入密码进入。
            </p>
          </div>

          {msg === "changed" && (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              密码已修改，请用新密码重新登录。
            </p>
          )}

          <form action={formAction} className="mt-6">
            <input type="hidden" name="from" value={from} />
            <label htmlFor="gate-password" className="mb-1 block text-sm font-medium text-foreground">
              密码
            </label>
            <div className="relative">
              <input
                id="gate-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                placeholder="请输入你的密码"
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 pr-16 text-sm text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-muted transition hover:text-foreground"
              >
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
            {state?.error && (
              <p className="mt-2 text-sm text-red-500">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending || !password}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "验证中…" : "进入博客"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          没有密码？说明你还没被邀请。
        </p>
      </div>
    </div>
  );
}
