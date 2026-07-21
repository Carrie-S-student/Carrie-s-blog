"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitReply } from "@/app/actions/comments";

export default function CommentReplyForm({ parentId, postId, postPath, onCancel }) {
  const formRef = useRef(null);
  const action = submitReply.bind(null, parentId);
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (state?.success) {
    return <p className="mt-2 text-xs text-green-600">回复成功！</p>;
  }

  return (
    <form ref={formRef} action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="postPath" value={postPath} />
      <input
        name="nickname"
        placeholder="昵称"
        required
        maxLength={30}
        className="w-full rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent sm:w-48"
      />
      <textarea
        name="content"
        placeholder="写下你的回复…"
        required
        maxLength={1000}
        rows={3}
        className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="interactive rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition disabled:opacity-60"
        >
          {pending ? "提交中…" : "提交回复"}
        </button>
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
