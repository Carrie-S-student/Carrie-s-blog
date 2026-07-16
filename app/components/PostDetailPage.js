import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import CommentSection from "@/app/components/CommentSection";
import TagPill from "@/app/components/TagPill";
import { getPublishedPostBySlug } from "@/lib/posts";
import { getVisibleCommentsForPost } from "@/lib/comments";
import { formatDate } from "@/lib/utils";

export default async function PostDetailPage({ section, basePath, slug }) {
  let post, comments, safeHtml, errorMessage = null;

  // Step 1: 获取文章
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (e) {
    errorMessage = `获取文章失败(getPublishedPostBySlug): ${e.message}`;
  }

  if (!errorMessage && (!post || post.section !== section)) {
    notFound();
  }

  // Step 2: 获取评论
  if (!errorMessage) {
    try {
      comments = await getVisibleCommentsForPost(post.id);
    } catch (e) {
      errorMessage = `获取评论失败(getVisibleCommentsForPost): ${e.message}`;
    }
  }

  // Step 3: HTML 净化
  if (!errorMessage && post.content) {
    try {
      safeHtml = DOMPurify.sanitize(post.content, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target"],
      });
    } catch (e) {
      errorMessage = `HTML 净化失败(DOMPurify): ${e.message}`;
    }
  }

  // 调试模式：显示错误信息
  if (errorMessage) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">调试信息</h1>
        <p className="text-muted mb-2">slug: {slug}</p>
        <pre className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-sm whitespace-pre-wrap break-all">
          {errorMessage}
        </pre>
        {post && (
          <details className="mt-4">
            <summary className="cursor-pointer text-muted">文章数据</summary>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm whitespace-pre-wrap break-all mt-2">
              {JSON.stringify({ id: post.id, title: post.title, section: post.section, hasContent: !!post.content }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
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
