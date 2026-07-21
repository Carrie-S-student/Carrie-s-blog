"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitComment } from "@/app/actions/comments";
import CommentReplyForm from "@/app/components/CommentReplyForm";
import { formatDateTime } from "@/lib/utils";

function countAll(comments) {
  let n = 0;
  for (const c of comments) {
    n += 1 + (c.children?.length || 0);
  }
  return n;
}

export default function CommentSection({ postId, postPath, comments }) {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(submitComment, undefined);
  const [replyTarget, setReplyTarget] = useState(null); // 当前展开回复框的评论 id
  const total = countAll(comments);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="mt-16 border-t border-card-border pt-10">
      <h2 className="text-lg font-semibold text-foreground">
        评论{total > 0 ? ` (${total})` : ""}
      </h2>

      <div className="mt-6 space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-muted">还没有人评论，来写第一条吧。</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-card-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{comment.nickname}</span>
              <span className="text-xs text-muted">{formatDateTime(comment.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{comment.content}</p>

            {/* 回复按钮 */}
            <button
              onClick={() => setReplyTarget(replyTarget === comment.id ? null : comment.id)}
              className="mt-2 text-xs text-accent transition hover:opacity-70"
            >
              {replyTarget === comment.id ? "取消回复" : "回复"}
            </button>

            {/* 内联回复表单 */}
            {replyTarget === comment.id && (
              <CommentReplyForm
                parentId={comment.id}
                postId={postId}
                postPath={postPath}
                onCancel={() => setReplyTarget(null)}
              />
            )}

            {/* 已有回复列表 */}
            {comment.children && comment.children.length > 0 && (
              <div className="mt-3 ml-4 space-y-3 border-l-2 border-card-border pl-4">
                {comment.children.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-lg bg-background/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{reply.nickname}</span>
                      <span className="text-xs text-muted">{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/85">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 顶级评论表单 */}
      <form ref={formRef} action={formAction} className="mt-8 space-y-3">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="postPath" value={postPath} />
        <input
          name="nickname"
          placeholder="昵称"
          required
          maxLength={30}
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent sm:w-64"
        />
        <textarea
          name="content"
          placeholder="说点什么…"
          required
          maxLength={1000}
          rows={4}
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-600">评论成功！</p>}
        <button
          type="submit"
          disabled={pending}
          className="interactive rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100"
        >
          {pending ? "提交中…" : "发表评论"}
        </button>
      </form>
    </section>
  );
}
