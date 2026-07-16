import Link from "next/link";
import Image from "next/image";
import TagPill from "@/app/components/TagPill";
import { formatDate, SECTION_LABELS, SECTION_HREF } from "@/lib/utils";

export default function PostCard({ post }) {
  const sectionHref = SECTION_HREF[post.section] || "/";
  return (
    <Link href={`${sectionHref}/${post.slug}`} className="card group overflow-hidden">
      <div className="relative h-48 w-full overflow-hidden bg-card-border">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            无封面图
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-accent/90">{SECTION_LABELS[post.section] || ""}</span>
          <span className="text-xs text-muted">{formatDate(post.publishedAt)}</span>
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground">{post.title}</h3>
        <p className="mt-2 text-sm text-muted line-clamp-3">{post.excerpt}</p>

        {post.tagList && post.tagList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tagList.map((tag) => (
              <TagPill key={tag.id} name={tag.name} size="sm" />
            ))}
          </div>
        )}

        {typeof post.commentCount === "number" && (
          <div className="mt-3 text-sm text-muted">{post.commentCount} 条评论</div>
        )}
      </div>
    </Link>
  );
}
