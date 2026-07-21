import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import CommentSection from "@/app/components/CommentSection";
import TagPill from "@/app/components/TagPill";
import PostContentRenderer from "@/app/components/PostContentRenderer";
import TableOfContents from "@/app/components/TableOfContents";
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
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "iframe",
      "img",
      "span",
      "div",
      "svg",
      "path",
      "mark",
      "del",
      "sup",
      "sub",
      "section",
      "figure",
      "figcaption",
      // KaTeX 内部元素
      "annotation",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "mfrac",
      "msqrt",
      "mover",
      "munder",
      "mtable",
      "mtr",
      "mtd",
      "mspace",
      "mpadded",
      "mphantom",
      "menclose",
      "mstyle",
      // Mermaid / 通用 SVG 元素
      "g",
      "defs",
      "line",
      "rect",
      "circle",
      "ellipse",
      "polygon",
      "polyline",
      "text",
      "tspan",
      "title",
      "desc",
      "use",
      "linearGradient",
      "radialGradient",
      "stop",
      "filter",
      "feColorMatrix",
      "feGaussianBlur",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      iframe: ["src", "allow", "allowfullscreen", "frameborder", "width", "height"],
      img: ["src", "alt", "width", "height", "loading"],
      div: ["class", "id", "style"],
      span: ["class", "id", "style"],
      code: ["class"],
      pre: ["class"],
      section: ["class", "id"],
      figure: ["class", "id"],
      figcaption: ["class"],
      // SVG 通用属性
      svg: ["xmlns", "viewBox", "width", "height", "class", "style", "id", "role", "aria*"],
      path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "class", "id", "marker-end", "style"],
      g: ["class", "id", "transform", "fill", "stroke", "stroke-width", "font*", "text-anchor", "style"],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "stroke-linecap", "class", "id", "marker-end"],
      rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width", "class", "id"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "class", "id"],
      ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width", "class", "id"],
      polygon: ["points", "fill", "stroke", "stroke-width", "class", "id"],
      polyline: ["points", "fill", "stroke", "stroke-width", "class", "id", "marker-end"],
      text: ["x", "y", "dx", "dy", "fill", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "class", "id", "style"],
      tspan: ["x", "y", "dx", "dy", "fill", "font-size", "font-family", "font-weight", "class"],
      use: ["href", "x", "y", "width", "height", "class", "id"],
      defs: ["id"],
      linearGradient: ["id", "x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform"],
      radialGradient: ["id", "cx", "cy", "r", "fx", "fy", "gradientUnits"],
      stop: ["offset", "stop-color", "stop-opacity"],
      filter: ["id", "x", "y", "width", "height", "filterUnits"],
      feColorMatrix: ["in", "type", "values", "result"],
      feGaussianBlur: ["in", "stdDeviation", "result"],
      // 通用全局属性
      "*": ["id", "class", "style", "data-*"],
    },
    },
    allowedClasses: {
      // KaTeX 会生成大量动态 class（katex-*, mord, mbin, strut 等），
      // 白名单方式不现实，允许所有 class 在这些元素上。
      span: ["*"],
      div: ["*"],
      svg: ["*"],
      path: ["*"],
      pre: ["*"],
      code: ["*"],
      figure: ["*"],
      figcaption: ["*"],
      section: ["*"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "player.bilibili.com"],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 顶部：标题 + 元信息 */}
      <div className="mx-auto max-w-3xl">
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
      </div>

      {/* 正文区域：左侧大纲 + 右侧文章 */}
      <div className="mt-8 flex gap-10">
        {/* 左侧：交互式文档大纲（桌面端固定定位） */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <TableOfContents contentSelector=".post-content" />
          </div>
        </aside>

        {/* 右侧：文章正文 */}
        <article className="min-w-0 flex-1">
          <PostContentRenderer html={safeHtml} />
          <CommentSection
            postId={post.id}
            postPath={`${basePath}/${slug}`}
            comments={comments}
          />
        </article>
      </div>
    </div>
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
