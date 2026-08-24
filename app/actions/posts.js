"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createPost, updatePost, deletePost, getPostByIdForAdmin } from "@/lib/posts";
import { setPostTags } from "@/lib/tags";
import { VALID_SECTIONS, sectionPath, sectionAdminPath } from "@/lib/utils";

function readPostFields(formData) {
  const title = (formData.get("title") || "").toString().trim();
  const excerpt = (formData.get("excerpt") || "").toString().trim();
  const content = (formData.get("content") || "").toString();
  const coverImage = (formData.get("coverImage") || "").toString().trim();
  const section = (formData.get("section") || "").toString();
  const folderId = (formData.get("folderId") || "").toString().trim();
  const published = formData.get("published") === "on";

  if (!title) {
    return { error: "请填写标题。" };
  }
  if (!content || content === "<p></p>") {
    return { error: "文章内容不能为空。" };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { error: "请选择一个栏目（学习与思考 / 财经专栏）。" };
  }

  return { fields: { title, excerpt, content, coverImage, section, folderId: folderId || null, published } };
}

function readTagIds(formData) {
  const tagIds = formData.getAll("tagIds");
  return tagIds.filter((id) => typeof id === "string" && id.length > 0);
}

// 新增/更新/删除文章后，让首页、前台栏目相关页面与后台栏目管理页刷新
function revalidatePostPaths(post) {
  const path = sectionPath(post.section);
  revalidatePath("/");
  revalidatePath(path);
  revalidatePath(`${path}/all`);
  revalidatePath(`${path}/folder`);
  revalidatePath(sectionAdminPath(post.section));
  revalidatePath(`${path}/${post.slug}`);
}

export async function createPostAction(prevState, formData) {
  await requireAdmin();

  const { error, fields } = readPostFields(formData);
  if (error) return { error };

  const post = await createPost(fields);

  // 关联标签
  const tagIds = readTagIds(formData);
  if (tagIds.length > 0) {
    await setPostTags(post.id, tagIds);
  }

  revalidatePostPaths(post);
  redirect(sectionAdminPath(post.section));
}

export async function updatePostAction(id, prevState, formData) {
  await requireAdmin();

  const { error, fields } = readPostFields(formData);
  if (error) return { error };

  const existing = await getPostByIdForAdmin(id);
  const post = await updatePost(id, fields);

  // 更新标签关联
  const tagIds = readTagIds(formData);
  await setPostTags(post.id, tagIds);

  revalidatePostPaths(post);
  if (existing && existing.section !== post.section) {
    revalidatePath(sectionAdminPath(existing.section));
    revalidatePath(`${sectionPath(existing.section)}/${existing.slug}`);
  }
  redirect(sectionAdminPath(post.section));
}

export async function deletePostAction(id) {
  await requireAdmin();

  const existing = await getPostByIdForAdmin(id);
  await deletePost(id);

  if (existing) {
    revalidatePath("/");
    revalidatePath(sectionPath(existing.section));
    revalidatePath(`${sectionPath(existing.section)}/all`);
    revalidatePath(`${sectionPath(existing.section)}/folder`);
    revalidatePath(sectionAdminPath(existing.section));
    revalidatePath(`${sectionPath(existing.section)}/${existing.slug}`);
  }
}
