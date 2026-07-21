import Link from "next/link";
import { getAllCommentsForAdmin } from "@/lib/comments";
import { hideCommentAction, showCommentAction, deleteCommentAction } from "@/app/actions/comments-admin";
import { formatDateTime, sectionPath } from "@/lib/utils";

function postHref(post) {
  return `${sectionPath(post.section)}/${post.slug}`;
}

export const metadata = {
  title: "评论管理",
};

export default async function AdminCommentsPage() {
  const comments = await getAllCommentsForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">评论管理</h1>

      <div className="mt-6 space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有任何评论。</p>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{comment.nickname}</span>
                <span className="text-neutral-400">评论于</span>
                <Link
                  href={postHref(comment.post)}
                  target="_blank"
                  className="text-neutral-500 underline dark:text-neutral-400"
                >
                  {comment.post?.title || "（文章已删除）"}
                </Link>
              </div>
              <span className="text-neutral-400">{formatDateTime(comment.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
              {comment.content}
            </p>

            {/* 回复列表 */}
            {comment.children && comment.children.length > 0 && (
              <div className="mt-3 ml-4 space-y-2 border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
                {comment.children.map((reply) => (
                  <div key={reply.id} className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {reply.nickname}
                      </span>
                      <span className="text-neutral-400">{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-400">
                      {reply.content}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span
                        className={
                          reply.status === "VISIBLE"
                            ? "rounded-full bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "rounded-full bg-neutral-100 px-1.5 py-0.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }
                      >
                        {reply.status === "VISIBLE" ? "显示" : "隐藏"}
                      </span>
                      {reply.status === "VISIBLE" ? (
                        <form
                          action={async () => {
                            "use server";
                            await hideCommentAction(reply.id, reply.postId);
                          }}
                        >
                          <button type="submit" className="text-neutral-500 underline dark:text-neutral-400">
                            隐藏
                          </button>
                        </form>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await showCommentAction(reply.id, reply.postId);
                          }}
                        >
                          <button type="submit" className="text-neutral-500 underline dark:text-neutral-400">
                            显示
                          </button>
                        </form>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          await deleteCommentAction(reply.id, reply.postId);
                        }}
                      >
                        <button type="submit" className="text-red-500 underline dark:text-red-400">
                          删除
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-sm">
              <span
                className={
                  comment.status === "VISIBLE"
                    ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                }
              >
                {comment.status === "VISIBLE" ? "显示中" : "已隐藏"}
              </span>
              {comment.status === "VISIBLE" ? (
                <form
                  action={async () => {
                    "use server";
                    await hideCommentAction(comment.id, comment.postId);
                  }}
                >
                  <button type="submit" className="text-neutral-700 underline dark:text-neutral-300">
                    隐藏
                  </button>
                </form>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await showCommentAction(comment.id, comment.postId);
                  }}
                >
                  <button type="submit" className="text-neutral-700 underline dark:text-neutral-300">
                    重新显示
                  </button>
                </form>
              )}
              <form
                action={async () => {
                  "use server";
                  await deleteCommentAction(comment.id, comment.postId);
                }}
              >
                <button type="submit" className="text-red-600 underline dark:text-red-400">
                  删除
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
