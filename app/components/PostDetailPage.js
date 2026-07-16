import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import CommentSection from "@/app/components/CommentSection";
import TagPill from "@/app/components/TagPill";
import { getPublishedPostBySlug } from "@/lib/posts";
import { getVisibleCommentsForPost } from "@/lib/comments";
import { formatDate } from "@/lib/utils";

export default async function PostDetailPage({ section, basePath, slug }) {
  let post, comments;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (e) {
    console.error("getPublishedPostBySlug failed:", slug, e);
    throw e;
  }
  if (!post || post.section !== section) {
    notFound();
  }

  try {
    comments = await getVisibleCommentsForPost(post.id);
  } catch (e) {
    console.error("getVisibleCommentsForPost failed:", post.id, e);
    throw e;
  }

  let safeHtml;
  try {
    safeHtml = DOMPurify.sanitize(post.content, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target"],
    });
  } catch (e) {
    console.error("DOMPurify.sanitize failed:", e);
    throw e;
  }

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
