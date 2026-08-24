import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import { getAllTagsForAdmin } from "@/lib/tags";
import { getAllFoldersForAdmin } from "@/lib/folders";
import { SECTION_LABELS } from "@/lib/utils";
import SectionPostsTable from "./SectionPostsTable";
import TagsManager from "@/app/admin/(protected)/tags/TagsManager";
import FoldersManager from "@/app/admin/(protected)/folders/FoldersManager";

const SECTION_BY_KEY = {
  learning: "LEARNING",
  finance: "FINANCE",
};

const TABS = [
  { key: "posts", label: "文章" },
  { key: "tags", label: "标签" },
  { key: "folders", label: "文件夹" },
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { section } = await params;
  const sectionValue = SECTION_BY_KEY[section];
  if (!sectionValue) return { title: "栏目管理" };
  return { title: `${SECTION_LABELS[sectionValue]}管理` };
}

export default async function SectionAdminPage({ params, searchParams }) {
  const { section } = await params;
  const sectionValue = SECTION_BY_KEY[section];
  if (!sectionValue) {
    notFound();
  }

  const query = await searchParams;
  const tab = TABS.some((t) => t.key === query?.tab) ? query.tab : "posts";

  const [posts, tags, folders] = await Promise.all([
    getAllPostsForAdmin(sectionValue),
    getAllTagsForAdmin(sectionValue),
    getAllFoldersForAdmin(sectionValue),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {SECTION_LABELS[sectionValue]}管理
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        在这里管理「{SECTION_LABELS[sectionValue]}」栏目的文章、标签和文件夹。没有选文件夹的文章会直接显示在前台栏目页。
      </p>

      {/* Tab 切换 */}
      <div className="mt-6 flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((t) => {
          const count =
            t.key === "posts" ? posts.length : t.key === "tags" ? tags.length : folders.length;
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`?tab=${t.key}`}
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                active
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {t.label}（{count}）
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "posts" && <SectionPostsTable posts={posts} sectionKey={section} />}
        {tab === "tags" && <TagsManager tags={tags} section={sectionValue} />}
        {tab === "folders" && <FoldersManager folders={folders} section={sectionValue} />}
      </div>
    </div>
  );
}
