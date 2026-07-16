import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import { deletePostAction } from "@/app/actions/posts";
import { formatDateTime, SECTION_LABELS } from "@/lib/utils";

export const metadata = {
  title: "文章管理",
};

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          + 写新文章
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">标题</th>
              <th className="px-4 py-2.5 font-medium">栏目</th>
              <th className="px-4 py-2.5 font-medium">状态</th>
              <th className="px-4 py-2.5 font-medium">更新时间</th>
              <th className="px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  还没有任何文章，点右上角「写新文章」开始吧。
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100">{post.title}</td>
                <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                  {SECTION_LABELS[post.section]}
                </td>
                <td className="px-4 py-2.5">
                  {post.published ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      已发布
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      草稿
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(post.updatedAt)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/posts/${post.id}`} className="text-neutral-700 underline dark:text-neutral-300">
                      编辑
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deletePostAction(post.id);
                      }}
                    >
                      <button type="submit" className="text-red-600 underline dark:text-red-400">
                        删除
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
