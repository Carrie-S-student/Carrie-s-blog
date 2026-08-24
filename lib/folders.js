import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

/**
 * 获取某个栏目下的所有文件夹，按创建时间正序。
 */
export async function getFoldersBySection(section) {
  return prisma.folder.findMany({
    where: { section },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 获取某个栏目下的所有文件夹，并附带该栏目下已发布文章的数量。
 */
export async function getFoldersWithPostCount(section) {
  const folders = await prisma.folder.findMany({
    where: { section },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: { published: true },
          },
        },
      },
    },
  });

  return folders.map((folder) => ({
    ...folder,
    postCount: folder._count.posts,
  }));
}

/**
 * 按 slug 获取某个栏目下的文件夹。
 */
export async function getFolderBySlug(section, slug) {
  return prisma.folder.findUnique({
    where: { slug_section: { slug, section } },
  });
}

/**
 * 后台：获取全部文件夹（不区分栏目），供管理列表用。
 */
export async function getAllFoldersForAdmin() {
  return prisma.folder.findMany({
    orderBy: [{ section: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { posts: true } },
    },
  });
}

/**
 * 生成唯一的文件夹 slug（在当前 section 下唯一）。
 */
async function generateUniqueFolderSlug(name, section, { excludeId } = {}) {
  const base = slugify(name) || "folder";
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.folder.findUnique({
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
 * 创建文件夹。
 */
export async function createFolder({ name, section }) {
  const slug = await generateUniqueFolderSlug(name, section);
  return prisma.folder.create({
    data: { name, slug, section },
  });
}

/**
 * 更新文件夹名称（slug 会自动更新）。
 */
export async function updateFolder(id, { name }) {
  const existing = await prisma.folder.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("文件夹不存在，可能已被删除。");
  }

  const slug =
    name !== existing.name
      ? await generateUniqueFolderSlug(name, existing.section, { excludeId: id })
      : existing.slug;

  return prisma.folder.update({
    where: { id },
    data: { name, slug },
  });
}

/**
 * 删除文件夹（文件夹下的文章保留，folderId 置空变为"未分类"）。
 */
export async function deleteFolder(id) {
  return prisma.$transaction(async (tx) => {
    await tx.post.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });
    await tx.folder.delete({ where: { id } });
  });
}
