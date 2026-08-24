import Link from "next/link";
import { getFolderColor, DEFAULT_FOLDER_COLOR } from "@/lib/folderColors";

export default function FolderCard({ folder, href }) {
  const hasChildren = folder.childCount && folder.childCount > 0;
  const hasPosts = folder.postCount && folder.postCount > 0;
  const color = getFolderColor(folder.color || DEFAULT_FOLDER_COLOR);

  return (
    <Link href={href} className="card group overflow-hidden">
      {/* 顶部视觉区：文件夹 + 层叠纸页 */}
      <div className={`relative h-48 w-full overflow-hidden bg-gradient-to-br ${color.bg}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-24 w-36">
            {/* 后层纸页 */}
            <div className="absolute -top-6 left-2 h-20 w-24 rounded-lg border border-neutral-100 bg-white/90 shadow-sm dark:border-neutral-700 dark:bg-neutral-300 transform -rotate-6 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-8deg]" />

            {/* 中层纸页 */}
            <div className="absolute -top-8 left-6 h-20 w-24 rounded-lg border border-neutral-100 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-200 transform rotate-3 transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-5">
              <div className="mt-4 space-y-2 px-4">
                <div className="h-1.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-500" />
                <div className="h-1.5 w-1/2 rounded bg-neutral-200 dark:bg-neutral-500" />
                <div className="h-1.5 w-2/3 rounded bg-neutral-200 dark:bg-neutral-500" />
              </div>
            </div>

            {/* 文件夹主体 */}
            <div className={`relative z-10 h-20 w-36 rounded-lg rounded-tr-sm bg-gradient-to-br ${color.folder} shadow-lg transition-transform duration-300 group-hover:scale-[1.02]`}>
              {/* 文件夹标签 */}
              <div className={`absolute -top-3 left-0 h-5 w-16 rounded-t-lg ${color.tab}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 内容区：与 PostCard 对齐 */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-accent/90">文件夹</span>
          <span className="text-xs text-muted">
            {hasPosts ? `${folder.postCount} 篇文章` : "暂无文章"}
          </span>
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {folder.name}
        </h3>
        <p className="mt-2 text-sm text-muted line-clamp-3">
          {hasChildren
            ? `包含 ${folder.childCount} 个子文件夹`
            : "按主题整理的文章集合"}
        </p>
      </div>
    </Link>
  );
}
