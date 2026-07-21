"use client";

import { useActionState, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { submitReply } from "@/app/actions/comments";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="interactive rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition disabled:opacity-60"
    >
      {pending ? "提交中…" : "提交回复"}
    </button>
  );
}

export default function ReplyForm({ parentId, postId, postPath, onCancel, defaultNickname }) {
  const action = submitReply.bind(null, parentId);
  const [state, formAction] = useActionState(action, undefined);

  useEffect(() => {
    // 回复成功后 2 秒关闭表单
    if (state?.success) {
      const timer = setTimeout(() => onCancel?.(), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, onCancel]);

  if (state?.success) {
    return (
      <p className="mt-2 text-xs text-green-600">回复成功！</p>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-1.5">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="postPath" value={postPath} />
      {!defaultNickname && (
        <input
          name="nickname"
          placeholder="昵称"
          required
          maxLength={30}
          className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent sm:w-48"
        />
      )}
      {defaultNickname && <input type="hidden" name="nickname" value={defaultNickname} />}
      <textarea
        name="content"
        placeholder="写下你的回复…"
        required
        maxLength={1000}
        rows={2}
        className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <div className="flex items-center gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted underline transition hover:text-foreground"
        >
          取消
        </button>
      </div>
    </form>
  );
}
