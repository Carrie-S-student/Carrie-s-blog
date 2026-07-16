import Link from "next/link";
import TagPill from "@/app/components/TagPill";
import { formatDate, SECTION_LABELS, SECTION_HREF } from "@/lib/utils";

function formatCompactDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function TimelineCard({ post }) {
  const sectionHref = SECTION_HREF[post.section] || "/";
  const sectionLabel = SECTION_LABELS[post.section] || "";

  return (
    <Link
      href={`${sectionHref}/${post.slug}`}
      className="group card flex flex-col gap-3 p-5 interactive"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold leading-snug text-foreground transition group-hover:text-accent">
          {post.title}
        </h3>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
          {post.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {post.commentCount}
            </span>
          )}
          <span>{formatCompactDate(post.publishedAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sectionLabel && (
          <span className="text-xs font-medium text-accent">{sectionLabel}</span>
        )}
        {post.tagList?.map((tag) => (
          <TagPill key={tag.id} name={tag.name} size="sm" />
        ))}
      </div>
    </Link>
  );
}

export default function PostTimeline({ posts }) {
  if (!posts || posts.length === 0) return null;

  const groups = Object.entries(
    posts.reduce((acc, post) => {
      const year = new Date(post.publishedAt).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(post);
      return acc;
    }, {})
  ).sort((a, b) => Number(b[0]) - Number(a[0]));

  return (
    <div className="relative">
      {/* 纵向时间轴线 */}
      <div className="absolute bottom-0 left-5 top-5 w-0.5 bg-accent/30" />

      {groups.map(([year, yearPosts]) => (
        <div key={year} className="relative mb-12 last:mb-0">
          {/* 年份标记 */}
          <div className="flex items-center gap-3">
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {year.toString().slice(-2)}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{year}</span>
              <span className="text-sm text-muted">{yearPosts.length} 篇</span>
            </div>
          </div>

          {/* 该年份文章卡片 */}
          <div className="ml-14 mt-5 space-y-4">
            {yearPosts.map((post) => (
              <TimelineCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
