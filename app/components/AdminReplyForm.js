"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminReplyComment } from "@/app/actions/comments-admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-neutral-800 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-200 dark:text-neutral-800 dark:hover:bg-neutral-300"
    >
      {pending ? "提交中…" : "回复"}
    </button>
  );
}

export default function AdminReplyForm({ parentId, postId, postPath, onCancel }) {
  const action = adminReplyComment.bind(null, parentId);
  const [state, formAction] = useActionState(action, undefined);

  if (state?.success) {
    return (
      <p className="mt-2 text-xs text-green-600 dark:text-green-400">回复成功！</p>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-1.5">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="postPath" value={postPath} />
      <textarea
        name="content"
        placeholder="以博主身份回复…"
        required
        maxLength={1000}
        rows={2}
        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none focus:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
      />
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <div className="flex items-center gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-500 underline transition hover:text-neutral-700 dark:text-neutral-400"
        >
          取消
        </button>
      </div>
    </form>
  );
}
