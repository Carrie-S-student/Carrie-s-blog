import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/**
 * 从 HTML 正文里粗略提取一段纯文字摘要（去标签），用于没有手写摘要时的兜底。
 */
function excerptFromHtml(html, length = 100) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/**
 * 辅助：批量获取文章 IDs 对应的标签。
 * 返回 Map<postId, { id, name, slug }[]>
 */
async function batchFetchTags(postIds) {
  if (postIds.length === 0) return new Map();
  const postTags = await prisma.postTag.findMany({
    where: { postId: { in: postIds } },
    select: { postId: true, tag: true },
  });
  const map = new Map();
  for (const pt of postTags) {
    if (!map.has(pt.postId)) map.set(pt.postId, []);
    map.get(pt.postId).push({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug });
  }
  return map;
}

/**
 * 前台：获取某个栏目下已发布的文章列表，按发布时间倒序。
 * 支持按标签 slug 筛选（tagSlug 参数）。
 */
export async function getPublishedPosts(section, { take, skip, tagSlug } = {}) {
  const where = { section, published: true };

  if (tagSlug) {
    where.tags = { some: { tag: { slug: tagSlug, section } } };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      section: true,
      publishedAt: true,
      _count: { select: { comments: { where: { status: "VISIBLE" } } } },
    },
  });

  // 批量获取标签
  const tagMap = await batchFetchTags(posts.map((p) => p.id));

  return posts.map((post) => ({
    ...post,
    excerpt: post.excerpt || excerptFromHtml(post.content),
    commentCount: post._count.comments,
    tagList: tagMap.get(post.id) || [],
  }));
}

/**
 * 首页用：获取全站最新已发布文章（不区分栏目），默认取 6 篇。
 * 包含标签列表和评论数，用于时间轴卡片展示。
 */
export async function getLatestPosts(take = 6) {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      section: true,
      publishedAt: true,
      _count: { select: { comments: { where: { status: "VISIBLE" } } } },
    },
  });

  const tagMap = await batchFetchTags(posts.map((p) => p.id));

  return posts.map((post) => ({
    ...post,
    excerpt: post.excerpt || excerptFromHtml(post.content),
    commentCount: post._count.comments,
    tagList: tagMap.get(post.id) || [],
  }));
}

/**
 * 前台文章详情页：只能看到已发布的文章，其余情况返回 null（页面负责 404）。
 */
export async function getPublishedPostBySlug(slug) {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
  });
  if (!post) return null;

  const tagMap = await batchFetchTags([post.id]);
  return {
    ...post,
    excerpt: post.excerpt || excerptFromHtml(post.content),
    tagList: tagMap.get(post.id) || [],
  };
}

/**
 * 后台：获取全部文章（不管是否发布），供文章管理列表用。
 */
export async function getAllPostsForAdmin() {
  return prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * 后台：按 id 获取单篇文章（用于编辑器回填）。
 * 包含标签信息，供 PostForm 回填已选标签。
 */
export async function getPostByIdForAdmin(id) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return null;

  const tagMap = await batchFetchTags([post.id]);
  return {
    ...post,
    tagList: tagMap.get(post.id) || [],
  };
}

/**
 * 生成一个在数据库里唯一的 slug：标题相同时自动加数字后缀。
 */
async function generateUniqueSlug(title, { excludeId } = {}) {
  const base = slugify(title) || "post";
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
}

/**
 * 创建一篇新文章。
 */
export async function createPost({ title, excerpt, content, coverImage, section, published }) {
  const slug = await generateUniqueSlug(title);
  return prisma.post.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      section,
      published: Boolean(published),
      publishedAt: published ? new Date() : null,
    },
  });
}

/**
 * 更新一篇已存在的文章。
 */
export async function updatePost(id, { title, excerpt, content, coverImage, section, published }) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("文章不存在，可能已被删除。");
  }

  const slug =
    title && title !== existing.title ? await generateUniqueSlug(title, { excludeId: id }) : existing.slug;

  const willBePublished = Boolean(published);
  const publishedAt = willBePublished ? existing.publishedAt || new Date() : existing.publishedAt;

  return prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      section,
      published: willBePublished,
      publishedAt,
    },
  });
}

export async function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}
