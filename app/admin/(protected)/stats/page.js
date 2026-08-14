import { getPostViewStats, getRecentPostViews } from "@/lib/postviews";
import { formatDateTime, SECTION_LABELS } from "@/lib/utils";

export const metadata = {
  title: "访问统计",
};

export const dynamic = "force-dynamic";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}

export default async function AdminStatsPage() {
  const [postStats, recentViews] = await Promise.all([
    getPostViewStats(),
    getRecentPostViews(200),
  ]);

  const totalViews = postStats.reduce((sum, post) => sum + post.viewCount, 0);
  const viewedPosts = postStats.filter((post) => post.viewCount > 0).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">访问统计</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        每次刷新文章页面都会记录一条访问明细，这里按文章汇总点击量，并展示最近访问记录。
      </p>

      {/* 汇总卡片 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="总点击量" value={totalViews} />
        <StatCard label="被访问过的文章" value={viewedPosts} />
        <StatCard label="最近明细条数" value={recentViews.length} />
      </div>

      {/* 文章点击量表格 */}
      <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">文章点击量</h2>
        </div>
        {postStats.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            还没有任何文章。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  <th className="px-4 py-2 font-medium">文章标题</th>
                  <th className="px-4 py-2 font-medium">栏目</th>
                  <th className="px-4 py-2 text-right font-medium">点击量</th>
                  <th className="px-4 py-2 font-medium">最近访问</th>
                </tr>
              </thead>
              <tbody>
                {postStats.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100">
                      <span className={post.published ? "" : "text-neutral-400 dark:text-neutral-500"}>
                        {post.title}
                      </span>
                      {!post.published && (
                        <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          未发布
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                      {SECTION_LABELS[post.section] || post.section}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-neutral-900 dark:text-neutral-100">
                      {post.viewCount}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                      {post.lastViewedAt ? formatDateTime(post.lastViewedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 最近访问明细 */}
      <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            最近访问明细（最近 200 条）
          </h2>
        </div>
        {recentViews.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            还没有任何访问记录。
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentViews.map((view) => (
              <li key={view.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {view.visitor ? `欢迎${view.visitor.displayName || view.visitor.name}` : "管理员"}
                  </span>
                  <span className="mx-2 text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {view.post?.title || "（文章已删除）"}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                  {formatDateTime(view.viewedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
