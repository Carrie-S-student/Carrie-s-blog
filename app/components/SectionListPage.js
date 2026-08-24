import { Suspense } from "react";
import Link from "next/link";
import PostCard from "@/app/components/PostCard";
import TagFilter from "@/app/components/TagFilter";
import { getPublishedPosts } from "@/lib/posts";
import { getTagsWithPostCount } from "@/lib/tags";
import { getFolderBySlug } from "@/lib/folders";
import { sectionPath } from "@/lib/utils";

/**
 * 栏目下的文章列表页。
 * - 无 folderSlug：栏目下全部文章（/learning/all、/finance/all）
 * - 有 folderSlug：某个文件夹内的文章（/learning/folder/[slug]、/finance/folder/[slug]）
 */
export default async function SectionListPage({ section, title, description, tagSlug, folderSlug }) {
  const sectionBase = sectionPath(section);

  // 文件夹模式下先解析文件夹（不存在则走全部文章逻辑由页面处理 404）
  const folder = folderSlug ? await getFolderBySlug(section, folderSlug) : null;

  const [posts, tags] = await Promise.all([
    getPublishedPosts(section, { tagSlug: tagSlug || undefined, folderSlug: folderSlug || undefined }),
    getTagsWithPostCount(section),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* 面包屑：栏目 → 文件夹 */}
      {folder && (
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Link href={sectionBase} className="transition hover:text-foreground">
            {title}
          </Link>
          <span>/</span>
          <Link href={`${sectionBase}/all`} className="transition hover:text-foreground">
            全部文章
          </Link>
          <span>/</span>
          <span className="text-foreground">{folder.name}</span>
        </nav>
      )}

      <h1 className="text-2xl font-semibold text-foreground">
        {folder ? folder.name : title}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {folder ? `「${title}」下的「${folder.name}」文件夹，共 ${posts.length} 篇文章。` : description}
      </p>

      {/* 标签筛选栏 */}
      <Suspense fallback={null}>
        <TagFilter tags={tags} />
      </Suspense>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-card-border p-10 text-center text-sm text-muted">
          {tagSlug
            ? "该标签下还没有文章。"
            : folder
              ? "这个文件夹里还没有文章。"
              : "这个栏目还没有文章。"}
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
