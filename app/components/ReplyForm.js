"use client";

import { useActionState } from "react";
import { replyToQuestionAction } from "@/app/actions/questions-admin";

export default function ReplyForm({ questionId }) {
  const action = replyToQuestionAction.bind(null, questionId);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state?.success) {
    return <p className="text-sm text-green-600 dark:text-green-400">回复成功，已公开显示。</p>;
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <textarea
        name="reply"
        placeholder="写下你的回复…"
        required
        maxLength={1000}
        rows={3}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="interactive rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "提交中…" : "回复并公开"}
      </button>
    </form>
  );
}
