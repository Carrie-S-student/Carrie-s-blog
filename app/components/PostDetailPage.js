import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import CommentSection from "@/app/components/CommentSection";
import TagPill from "@/app/components/TagPill";
import { getPublishedPostBySlug } from "@/lib/posts";
import { getVisibleCommentsForPost } from "@/lib/comments";
import { formatDate } from "@/lib/utils";

export default async function PostDetailPage({ section, basePath, slug }) {
  const post = await getPublishedPostBySlug(slug);
  if (!post || post.section !== section) {
    notFound();
  }

  const comments = await getVisibleCommentsForPost(post.id);

  const safeHtml = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["iframe", "img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      iframe: ["src", "allow", "allowfullscreen", "frameborder", "width", "height"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedIframeHostnames: ["www.youtube.com", "player.bilibili.com"],
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>
      <p className="mt-3 text-sm text-muted">{formatDate(post.publishedAt)}</p>

      {post.tagList && post.tagList.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tagList.map((tag) => (
            <TagPill
              key={tag.id}
              name={tag.name}
              href={`${basePath}?tag=${encodeURIComponent(tag.slug)}`}
            />
          ))}
        </div>
      )}

      <div className="post-content mt-8" dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <CommentSection postId={post.id} postPath={`${basePath}/${slug}`} comments={comments} />
    </article>
  );
}

export async function generatePostMetadata({ slug }) {
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}
