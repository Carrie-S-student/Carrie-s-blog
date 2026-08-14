import Hero from "@/app/components/Hero";
import PostTimeline from "@/app/components/PostTimeline";
import HomeActionCards from "@/app/components/HomeActionCards";
import ChangePasswordForm from "@/app/components/ChangePasswordForm";
import { getLatestPosts } from "@/lib/posts";
import { getCurrentVisitor } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, visitor] = await Promise.all([
    getLatestPosts(6),
    getCurrentVisitor(),
  ]);

  return (
    <div>
      <Hero visitorName={visitor?.displayName || visitor?.name} />

      <section id="latest-posts" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* 左侧：纵向时间轴 */}
          <div>
            <h2 className="mb-8 text-2xl font-semibold text-foreground">最新文章</h2>
            {posts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-card-border p-10 text-center text-sm text-muted">
                还没有发布任何文章，去后台写第一篇吧。
              </p>
            ) : (
              <PostTimeline posts={posts} />
            )}
          </div>

          {/* 右侧：提问箱 + 关于我 */}
          <aside>
            <h2 className="mb-8 text-2xl font-semibold text-foreground">探索</h2>
            <HomeActionCards />
          </aside>
        </div>
      </section>

      {/* 底部：访客修改密码（登录后可见） */}
      {visitor && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <ChangePasswordForm visitor={visitor} />
        </section>
      )}
    </div>
  );
}
