import { Suspense } from "react";
import PostCard from "@/app/components/PostCard";
import TagFilter from "@/app/components/TagFilter";
import { getPublishedPosts } from "@/lib/posts";
import { getTagsWithPostCount } from "@/lib/tags";

export default async function SectionListPage({ section, title, description, tagSlug }) {
  const [posts, tags] = await Promise.all([
    getPublishedPosts(section, { tagSlug: tagSlug || undefined }),
    getTagsWithPostCount(section),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>

      {/* 标签筛选栏 */}
      <Suspense fallback={null}>
        <TagFilter tags={tags} />
      </Suspense>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-card-border p-10 text-center text-sm text-muted">
          {tagSlug ? "该标签下还没有文章。" : "这个栏目还没有文章。"}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
