import Link from "next/link";
import PostCard from "./PostCard";
import FolderCard from "./FolderCard";
import { getChildFoldersWithPostCount } from "@/lib/folders";
import { getPublishedPosts } from "@/lib/posts";
import { SECTION_LABELS } from "@/lib/utils";

export default async function FolderListPage({ section }) {
  const sectionLabel = SECTION_LABELS[section] || section;
  const sectionHref = section === "FINANCE" ? "finance" : "learning";

  const [folders, uncategorizedPosts] = await Promise.all([
    getChildFoldersWithPostCount(section, null),
    getPublishedPosts(section, { uncategorized: true }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {sectionLabel}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {section === "FINANCE"
            ? "财经观察、投资思考与市场笔记。"
            : "学习笔记、阅读思考与知识沉淀。"}
        </p>
      </header>

      {folders.length === 0 && uncategorizedPosts.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold text-foreground">暂无内容</h2>
          <p className="mt-2 text-muted">该栏目下还没有发布文章或文件夹。</p>
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  href={`/${sectionHref}/folder/${folder.slug}`}
                />
              ))}
            </section>
          )}

          {uncategorizedPosts.length > 0 && (
            <section className={folders.length > 0 ? "mt-10" : ""}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorizedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-12 text-center">
        <Link
          href={`/${sectionHref}/all`}
          className="btn btn-secondary inline-flex items-center"
        >
          查看全部文章
        </Link>
      </div>
    </div>
  );
}
