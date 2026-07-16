"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TagPill from "@/app/components/TagPill";

/**
 * 前台栏目页面的标签筛选栏。
 * 展示该栏目下所有标签（附带文章数量），点击标签通过 URL searchParams 切换筛选状态。
 * 不依赖任何外部状态，完全由 URL 驱动。
 */
export default function TagFilter({ tags = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag") || "";

  function handleTagClick(slug) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === activeTag) {
      // 再次点击已选中的标签 → 回到"全部"
      params.delete("tag");
    } else {
      params.set("tag", slug);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearTag() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (tags.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-1.5">
      <TagPill
        name="全部"
        selected={!activeTag}
        onClick={clearTag}
        size="sm"
      />
      {tags.map((tag) => (
        <TagPill
          key={tag.slug}
          name={tag.name}
          postCount={tag.postCount}
          selected={activeTag === tag.slug}
          onClick={() => handleTagClick(tag.slug)}
          size="sm"
        />
      ))}
    </div>
  );
}
