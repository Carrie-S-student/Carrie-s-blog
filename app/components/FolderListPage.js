import Link from "next/link";
import { getFoldersWithPostCount } from "@/lib/folders";
import { sectionPath } from "@/lib/utils";

/**
 * 栏目入口页：访客先看到文件夹列表，点击文件夹后进入文件夹内文章列表。
 */
export default async function FolderListPage({ section, title, description }) {
  const sectionBase = sectionPath(section);
  const folders = await getFoldersWithPostCount(section);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>

      <div className="mt-8">
        {folders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border p-10 text-center text-sm text-muted">
            这个栏目还没有创建文件夹。
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`${sectionBase}/folder/${folder.slug}`}
                className="group rounded-xl border border-card-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-foreground group-hover:text-accent">
                  {folder.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {folder.postCount > 0 ? `${folder.postCount} 篇文章` : "还没有文章"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 全部文章入口 */}
      <div className="mt-8 flex justify-center">
        <Link
          href={`${sectionBase}/all`}
          className="rounded-full border border-card-border bg-card px-6 py-2.5 text-sm text-foreground transition hover:border-accent hover:text-accent"
        >
          查看全部文章 →
        </Link>
      </div>
    </div>
  );
}
