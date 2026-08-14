"use client";

import { useState } from "react";
import TableOfContents from "@/app/components/TableOfContents";

/**
 * 文章正文布局（客户端组件，负责目录的显示/隐藏切换）。
 *
 * 行为：
 * - 文章有标题（h1-h6）时：默认显示左侧目录栏，可点「收起」隐藏；
 *   隐藏后正文居中，并可点「显示目录」恢复。
 * - 文章没有标题时：不显示目录栏，正文始终居中。
 */
export default function PostArticleLayout({ hasToc, children }) {
  const [tocVisible, setTocVisible] = useState(true);

  // 有目录且当前显示：左侧目录栏 + 右侧正文（与原来效果一致）
  if (hasToc && tocVisible) {
    return (
      <div className="mt-8 flex gap-10">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <TableOfContents
              contentSelector=".post-content"
              onHide={() => setTocVisible(false)}
            />
          </div>
        </aside>
        <article className="min-w-0 flex-1">{children}</article>
      </div>
    );
  }

  // 无目录，或目录被隐藏：正文居中
  return (
    <div className="mt-8">
      <div className="mx-auto max-w-3xl">
        {hasToc && (
          <button
            type="button"
            onClick={() => setTocVisible(true)}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm6-6a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 0110 5zm0 6a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 0110 11zm0 6a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 0110 17z"
                clipRule="evenodd"
              />
            </svg>
            显示目录
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
