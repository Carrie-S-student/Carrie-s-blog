import Link from "next/link";
import PostCard from "./PostCard";
import FolderCard from "./FolderCard";
import {
  getChildFoldersWithPostCount,
  getFolderWithBreadcrumb,
} from "@/lib/folders";
import { getPublishedPosts } from "@/lib/posts";
import { getTagsBySection } from "@/lib/tags";
import { formatDate, SECTION_LABELS } from "@/lib/utils";
import TagFilter from "./TagFilter";

/**
 * 前台栏目内容页：
 * - 传 folderSlug：展示某个文件夹内的子文件夹与文章（带面包屑）；
 * - 不传 folderSlug（如 /learning/all）：展示该栏目的全部文章（不按文件夹过滤）。
 */
export default async function SectionListPage({
  section,
  folderSlug,
  tagSlug,
  title,
  description,
}) {
  const sectionLabel = SECTION_LABELS[section] || section;
  const sectionHref = section === "FINANCE" ? "finance" : "learning";

  const folderData = folderSlug
    ? await getFolderWithBreadcrumb(section, folderSlug)
    : null;

  if (folderSlug && !folderData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">文件夹不存在</h1>
        <Link href={`/${sectionHref}`} className="mt-4 inline-block text-accent hover:underline">
          返回{sectionLabel}
        </Link>
      </div>
    );
  }

  const currentFolder = folderData?.folder || null;
  const ancestors = folderData?.ancestors || [];

  const [childFolders, posts, tags] = await Promise.all([
    folderSlug
      ? getChildFoldersWithPostCount(section, currentFolder.id)
      : Promise.resolve([]),
    getPublishedPosts(section, { folderSlug, tagSlug }),
    getTagsBySection(section),
  ]);

  const currentTag = tagSlug ? tags.find((t) => t.slug === tagSlug) : null;
  const baseHref = folderSlug
    ? `/${sectionHref}/folder/${folderSlug}`
    : `/${sectionHref}/all`;
  const pageTitle = folderSlug ? currentFolder.name : title || sectionLabel;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* 面包屑 */}
      <nav className="mb-6 text-sm text-muted">
        <Link href={`/${sectionHref}`} className="hover:text-accent hover:underline">
          {sectionLabel}
        </Link>
        {ancestors.map((f) => (
          <span key={f.id}>
            <span className="mx-2">/</span>
            <Link
              href={`/${sectionHref}/folder/${f.slug}`}
              className="hover:text-accent hover:underline"
            >
              {f.name}
            </Link>
          </span>
        ))}
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {folderSlug ? currentFolder.name : "全部文章"}
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {pageTitle}
        </h1>
        {folderSlug ? (
          <p className="mt-2 text-sm text-muted">
            创建于 {formatDate(currentFolder.createdAt)}
          </p>
        ) : (
          description && <p className="mt-3 text-lg text-muted">{description}</p>
        )}
      </header>

      <TagFilter tags={tags} />

      {childFolders.length === 0 && posts.length === 0 && !currentTag ? (
        <div className="mt-10 rounded-xl border border-card-border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold text-foreground">暂无文章</h2>
          <p className="mt-2 text-muted">这里还没有文章，敬请期待。</p>
        </div>
      ) : (
        <div className="mt-10">
          {childFolders.length > 0 && (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {childFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  href={`/${sectionHref}/folder/${folder.slug}`}
                />
              ))}
            </section>
          )}

          {posts.length > 0 && (
            <section className={childFolders.length > 0 ? "mt-10" : ""}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
