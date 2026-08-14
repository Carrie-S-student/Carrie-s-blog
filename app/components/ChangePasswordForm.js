"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/app/actions/visitor-auth";
import { MAX_CHANGE_COUNT } from "@/lib/utils";

function PasswordField({ id, name, label, autoComplete, show, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 pr-16 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-muted transition hover:text-foreground"
        >
          {show ? "隐藏" : "显示"}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordForm({ visitor }) {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const remaining = Math.max(0, MAX_CHANGE_COUNT - visitor.changeCount);
  const exhausted = visitor.changeCount >= MAX_CHANGE_COUNT;

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-card-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">账户设置</h2>
      <p className="mt-1 text-sm text-muted">
        你的昵称由博主设置：<span className="font-medium text-foreground">{visitor.displayName || visitor.name}</span>
        ，你还剩 <span className="font-medium text-foreground">{remaining}</span> 次修改密码机会。
      </p>

      {/* 修改密码 */}
      <div className="mt-6 border-t border-card-border pt-4">
        <h3 className="text-sm font-medium text-foreground">修改密码</h3>
        {exhausted ? (
          <p className="mt-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-muted dark:bg-neutral-800">
            修改次数已用完，如确需修改请联系博主。
          </p>
        ) : (
          <form action={formAction} className="mt-2 space-y-3">
            <PasswordField
              id="currentPassword"
              name="currentPassword"
              label="当前密码"
              autoComplete="current-password"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
            <div>
              <PasswordField
                id="newPassword"
                name="newPassword"
                label="新密码"
                autoComplete="new-password"
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <p className="mt-1 text-xs text-muted">
                新密码不能和当前密码一样，也不能和其他人重复。修改后需要重新登录。
              </p>
            </div>
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "提交中…" : "确认修改并退出"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
