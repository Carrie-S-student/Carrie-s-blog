"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitComment } from "@/app/actions/comments";
import ReplyForm from "@/app/components/ReplyForm";
import { formatDateTime } from "@/lib/utils";

const MAX_NEST_DEPTH = 6;

function countRecursive(comments) {
  let n = 0;
  for (const c of comments) {
    n += 1 + countRecursive(c.children || []);
  }
  return n;
}

/**
 * 递归评论项：渲染一条评论 + 它的所有子孙回复。
 */
function CommentItem({
  comment,
  postId,
  postPath,
  depth,
  replyTarget,
  setReplyTarget,
}) {
  const tooDeep = depth >= MAX_NEST_DEPTH;

  return (
    <div
      className={
        depth > 0
          ? "border-l-2 border-card-border pl-4"
          : "rounded-xl border border-card-border bg-card p-4"
      }
    >
      {depth > 0 && (
        <div className="rounded-lg bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {comment.nickname}
            </span>
            <span className="text-xs text-muted">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/85">
            {comment.content}
          </p>

          {!tooDeep && (
            <button
              onClick={() =>
                setReplyTarget(replyTarget === comment.id ? null : comment.id)
              }
              className="mt-1 text-xs text-accent transition hover:opacity-70"
            >
              {replyTarget === comment.id ? "取消回复" : "回复"}
            </button>
          )}

          {replyTarget === comment.id && (
            <ReplyForm
              parentId={comment.id}
              postId={postId}
              postPath={postPath}
              onCancel={() => setReplyTarget(null)}
            />
          )}
        </div>
      )}

      {depth === 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {comment.nickname}
            </span>
            <span className="text-xs text-muted">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
            {comment.content}
          </p>

          {!tooDeep && (
            <button
              onClick={() =>
                setReplyTarget(replyTarget === comment.id ? null : comment.id)
              }
              className="mt-2 text-xs text-accent transition hover:opacity-70"
            >
              {replyTarget === comment.id ? "取消回复" : "回复"}
            </button>
          )}

          {replyTarget === comment.id && (
            <ReplyForm
              parentId={comment.id}
              postId={postId}
              postPath={postPath}
              onCancel={() => setReplyTarget(null)}
            />
          )}
        </>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className={depth === 0 ? "mt-3 ml-4 space-y-3" : "mt-2 ml-4 space-y-2"}>
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              postPath={postPath}
              depth={depth + 1}
              replyTarget={replyTarget}
              setReplyTarget={setReplyTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, postPath, comments }) {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(submitComment, undefined);
  const [replyTarget, setReplyTarget] = useState(null);
  const total = countRecursive(comments);

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
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            postPath={postPath}
            depth={0}
            replyTarget={replyTarget}
            setReplyTarget={setReplyTarget}
          />
        ))}
      </div>

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
