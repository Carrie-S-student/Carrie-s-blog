"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitComment, submitReply } from "@/app/actions/comments";
import { formatDateTime } from "@/lib/utils";

const MAX_NEST_DEPTH = 6; // 最大嵌套深度，超过后不再展示回复按钮

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

          {/* 回复按钮 — 超过最大深度时隐藏 */}
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

          {/* 内联回复表单 */}
          {replyTarget === comment.id && (
            <form
              action={submitReply.bind(null, comment.id)}
              className="mt-2 space-y-1.5"
            >
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="postPath" value={postPath} />
              <input
                name="nickname"
                placeholder="昵称"
                required
                maxLength={30}
                className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent sm:w-48"
              />
              <textarea
                name="content"
                placeholder="写下你的回复…"
                required
                maxLength={1000}
                rows={2}
                className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
              />
              <div className="flex items-center gap-2">
                <SubmitReplyButton />
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-xs text-muted underline transition hover:text-foreground"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 顶级评论：展示完整卡片 */}
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

          {/* 回复按钮 */}
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

          {/* 内联回复表单 */}
          {replyTarget === comment.id && (
            <form
              action={submitReply.bind(null, comment.id)}
              className="mt-2 space-y-2"
            >
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="postPath" value={postPath} />
              <input
                name="nickname"
                placeholder="昵称"
                required
                maxLength={30}
                className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent sm:w-48"
              />
              <textarea
                name="content"
                placeholder="写下你的回复…"
                required
                maxLength={1000}
                rows={3}
                className="w-full rounded border border-card-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
              />
              <div className="flex items-center gap-2">
                <SubmitReplyButton />
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-xs text-muted underline transition hover:text-foreground"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* 递归渲染子回复 */}
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

/**
 * 提交回复的按钮（需要用 useActionState 处理 pending 状态）。
 */
function SubmitReplyButton() {
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

export default function CommentSection({ postId, postPath, comments }) {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(submitComment, undefined);
  const [replyTarget, setReplyTarget] = useState(null); // 当前展开回复框的评论 id
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
