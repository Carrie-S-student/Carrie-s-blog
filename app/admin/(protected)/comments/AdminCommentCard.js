"use client";

import { useState } from "react";
import Link from "next/link";
import AdminReplyForm from "@/app/components/AdminReplyForm";
import { hideCommentAction, showCommentAction, deleteCommentAction } from "@/app/actions/comments-admin";
import { formatDateTime, sectionPath } from "@/lib/utils";

function postHref(post) {
  return `${sectionPath(post.section)}/${post.slug}`;
}

const MAX_NEST_DEPTH = 6;

export default function AdminCommentCard({ comment, depth }) {
  const [showReply, setShowReply] = useState(false);
  const tooDeep = depth >= MAX_NEST_DEPTH;
  const isParent = depth === 0;
  const postLink = comment.post
    ? postHref(comment.post)
    : "#";

  return (
    <div>
      {/* 顶级评论：完整卡片 */}
      {isParent && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {comment.nickname}
              </span>
              <span className="text-neutral-400">评论于</span>
              <Link
                href={postLink}
                target="_blank"
                className="text-neutral-500 underline dark:text-neutral-400"
              >
                {comment.post?.title || "（文章已删除）"}
              </Link>
            </div>
            <span className="text-neutral-400">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {comment.content}
          </p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <StatusBadge status={comment.status} size="sm" />
            {comment.status === "VISIBLE" ? (
              <AdminHideButton id={comment.id} postId={comment.postId} />
            ) : (
              <AdminShowButton id={comment.id} postId={comment.postId} />
            )}
            <AdminDeleteButton id={comment.id} postId={comment.postId} />
            {!tooDeep && (
              <button
                type="button"
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-neutral-500 underline transition hover:text-neutral-700 dark:text-neutral-400"
              >
                {showReply ? "取消回复" : "回复"}
              </button>
            )}
          </div>

          {showReply && (
            <AdminReplyForm
              parentId={comment.id}
              postId={comment.postId}
              postPath={postLink}
              onCancel={() => setShowReply(false)}
            />
          )}

          {/* 子回复 */}
          {comment.children && comment.children.length > 0 && (
            <div className="mt-3 ml-4 space-y-2">
              {comment.children.map((child) => (
                <AdminCommentCard
                  key={child.id}
                  comment={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 深层回复：缩进显示 */}
      {!isParent && (
        <div className="border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
          <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {comment.nickname}
              </span>
              <span className="text-neutral-400">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-400">
              {comment.content}
            </p>

            <div className="mt-2 flex items-center gap-3 text-xs">
              <StatusBadge status={comment.status} size="xs" />
              {comment.status === "VISIBLE" ? (
                <AdminHideButton id={comment.id} postId={comment.postId} />
              ) : (
                <AdminShowButton id={comment.id} postId={comment.postId} />
              )}
              <AdminDeleteButton id={comment.id} postId={comment.postId} />
              {!tooDeep && (
                <button
                  type="button"
                  onClick={() => setShowReply(!showReply)}
                  className="text-neutral-500 underline transition hover:text-neutral-700 dark:text-neutral-400"
                >
                  {showReply ? "取消回复" : "回复"}
                </button>
              )}
            </div>

            {showReply && (
              <AdminReplyForm
                parentId={comment.id}
                postId={comment.postId}
                postPath={postLink}
                onCancel={() => setShowReply(false)}
              />
            )}
          </div>

          {/* 递归子回复 */}
          {comment.children && comment.children.length > 0 && (
            <div className="mt-2 ml-4 space-y-2">
              {comment.children.map((child) => (
                <AdminCommentCard
                  key={child.id}
                  comment={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, size }) {
  const baseClass =
    size === "xs"
      ? "rounded-full px-1.5 py-0.5 text-xs"
      : "rounded-full px-2 py-0.5 text-xs";
  const colorClass =
    status === "VISIBLE"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  return (
    <span className={`${baseClass} ${colorClass}`}>
      {status === "VISIBLE" ? "显示" : "隐藏"}
    </span>
  );
}

function AdminHideButton({ id, postId }) {
  return (
    <form
      action={async () => {
        "use server";
        await hideCommentAction(id, postId);
      }}
    >
      <button
        type="submit"
        className="text-neutral-700 underline dark:text-neutral-300 text-xs"
      >
        隐藏
      </button>
    </form>
  );
}

function AdminShowButton({ id, postId }) {
  return (
    <form
      action={async () => {
        "use server";
        await showCommentAction(id, postId);
      }}
    >
      <button
        type="submit"
        className="text-neutral-700 underline dark:text-neutral-300 text-xs"
      >
        重新显示
      </button>
    </form>
  );
}

function AdminDeleteButton({ id, postId }) {
  return (
    <form
      action={async () => {
        "use server";
        await deleteCommentAction(id, postId);
      }}
    >
      <button
        type="submit"
        className="text-red-600 underline dark:text-red-400 text-xs"
      >
        删除
      </button>
    </form>
  );
}
