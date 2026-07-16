import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/**
 * 获取某个栏目下的所有标签，按创建时间正序。
 */
export async function getTagsBySection(section) {
  return prisma.tag.findMany({
    where: { section },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 获取某个栏目下的所有标签，并附带该栏目下已发布文章中使用该标签的文章数量。
 * 只统计已发布文章。
 */
export async function getTagsWithPostCount(section) {
  const tags = await prisma.tag.findMany({
    where: { section },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              post: { published: true, section },
            },
          },
        },
      },
    },
  });

  return tags.map((tag) => ({
    ...tag,
    postCount: tag._count.posts,
  }));
}

/**
 * 后台：获取全部标签（不区分栏目），供管理列表用。
 */
export async function getAllTagsForAdmin() {
  return prisma.tag.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
}

/**
 * 生成唯一的标签 slug（在当前 section 下唯一）。
 */
async function generateUniqueTagSlug(name, section, { excludeId } = {}) {
  const base = slugify(name) || "tag";
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.tag.findUnique({
      where: { slug_section: { slug: candidate, section } },
    });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
}

/**
 * 创建标签。
 */
export async function createTag({ name, section }) {
  const slug = await generateUniqueTagSlug(name, section);
  return prisma.tag.create({
    data: { name, slug, section },
  });
}

/**
 * 更新标签名称（slug 会自动更新）。
 */
export async function updateTag(id, { name }) {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("标签不存在，可能已被删除。");
  }

  const slug =
    name !== existing.name
      ? await generateUniqueTagSlug(name, existing.section, { excludeId: id })
      : existing.slug;

  return prisma.tag.update({
    where: { id },
    data: { name, slug },
  });
}

/**
 * 删除标签（级联删除关联的 PostTag 记录）。
 */
export async function deleteTag(id) {
  return prisma.tag.delete({ where: { id } });
}

/**
 * 获取一篇文章所关联的所有标签信息。
 */
export async function getTagsForPost(postId) {
  return prisma.postTag.findMany({
    where: { postId },
    include: { tag: true },
  });
}

/**
 * 批量设置一篇文章的标签（先删后建，事务保证一致性）。
 */
export async function setPostTags(postId, tagIds) {
  return prisma.$transaction(async (tx) => {
    // 删除旧的关联
    await tx.postTag.deleteMany({ where: { postId } });
    // 创建新的关联
    if (tagIds && tagIds.length > 0) {
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
      });
    }
  });
}
