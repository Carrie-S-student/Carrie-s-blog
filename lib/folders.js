import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { DEFAULT_FOLDER_COLOR, isValidFolderColor } from "@/lib/folderColors";

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
 * 获取某个父文件夹下的直接子文件夹（parentId 为 null 时返回顶层文件夹），
 * 附带该文件夹下已发布文章数量与子文件夹数量。
 */
export async function getChildFoldersWithPostCount(section, parentId = null) {
  const folders = await prisma.folder.findMany({
    where: { section, parentId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: { published: true },
          },
          children: true,
        },
      },
    },
  });

  return folders.map((folder) => ({
    ...folder,
    postCount: folder._count.posts,
    childCount: folder._count.children,
  }));
}

/**
 * 兼容旧名：获取某个栏目下的全部文件夹，附带已发布文章数量。
 * 返回的是多级结构（含 parentId），供展示时自行组织层级。
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
 * 获取文件夹及其祖先链（从根到父级，不含自身），用于面包屑展示。
 * 返回 null 表示文件夹不存在。
 */
export async function getFolderWithBreadcrumb(section, slug) {
  const folder = await getFolderBySlug(section, slug);
  if (!folder) return null;

  const ancestors = [];
  let current = folder;
  while (current.parentId) {
    const parent = await prisma.folder.findUnique({
      where: { id: current.parentId },
    });
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return { folder, ancestors };
}

/**
 * 后台：获取全部文件夹（可按栏目过滤），供管理列表/表单用。
 * section 为空时不区分栏目返回全部。
 */
export async function getAllFoldersForAdmin(section) {
  return prisma.folder.findMany({
    where: section ? { section } : undefined,
    orderBy: [{ section: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { posts: true, children: true } },
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
 * 递归获取某文件夹的所有后代 id（不含自身），用于防循环校验。
 */
export async function getDescendantFolderIds(folderId) {
  const ids = [];
  const queue = [folderId];
  while (queue.length) {
    const current = queue.shift();
    const children = await prisma.folder.findMany({
      where: { parentId: current },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

/**
 * 创建文件夹，支持指定父文件夹（parentId 为空则为顶层文件夹）。
 */
export async function createFolder({ name, section, parentId, color }) {
  const slug = await generateUniqueFolderSlug(name, section);
  return prisma.folder.create({
    data: {
      name,
      slug,
      section,
      parentId: parentId || null,
      color: isValidFolderColor(color) ? color : DEFAULT_FOLDER_COLOR,
    },
  });
}

/**
 * 更新文件夹（可改名、可移动到其他父文件夹下），并做循环校验。
 */
export async function updateFolder(id, { name, parentId, color }) {
  const existing = await prisma.folder.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("文件夹不存在，可能已被删除。");
  }

  const newParentId = parentId || null;
  if (newParentId && newParentId !== existing.parentId) {
    if (newParentId === id) {
      throw new Error("不能把文件夹移动到它自己下面。");
    }
    const descendantIds = await getDescendantFolderIds(id);
    if (descendantIds.includes(newParentId)) {
      throw new Error("不能把文件夹移动到它的子文件夹下。");
    }
  }

  const slug =
    name !== existing.name
      ? await generateUniqueFolderSlug(name, existing.section, { excludeId: id })
      : existing.slug;

  return prisma.folder.update({
    where: { id },
    data: {
      name,
      slug,
      parentId: newParentId,
      ...(isValidFolderColor(color) ? { color } : {}),
    },
  });
}

/**
 * 删除文件夹：
 * - 直接子文件夹提升一级（继承被删文件夹的父级，保持层级紧凑）；
 * - 该文件夹下的文章保留，folderId 置空变为"未分类"，直接显示在栏目页。
 */
export async function deleteFolder(id) {
  return prisma.$transaction(async (tx) => {
    const folder = await tx.folder.findUnique({ where: { id } });
    if (!folder) return null;

    await tx.folder.updateMany({
      where: { parentId: id },
      data: { parentId: folder.parentId },
    });
    await tx.post.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });
    await tx.folder.delete({ where: { id } });
    return folder;
  });
}
