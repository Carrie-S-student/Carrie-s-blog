"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createPost, updatePost, deletePost, getPostByIdForAdmin } from "@/lib/posts";
import { setPostTags } from "@/lib/tags";
import { VALID_SECTIONS, sectionPath } from "@/lib/utils";

function readPostFields(formData) {
  const title = (formData.get("title") || "").toString().trim();
  const excerpt = (formData.get("excerpt") || "").toString().trim();
  const content = (formData.get("content") || "").toString();
  const coverImage = (formData.get("coverImage") || "").toString().trim();
  const section = (formData.get("section") || "").toString();
  const published = formData.get("published") === "on";

  if (!title) {
    return { error: "请填写标题。" };
  }
  if (!content || content === "<p></p>") {
    return { error: "文章内容不能为空。" };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { error: "请选择一个栏目（学习与输入 / 思考与输出）。" };
  }

  return { fields: { title, excerpt, content, coverImage, section, published } };
}

function readTagIds(formData) {
  const tagIds = formData.getAll("tagIds");
  return tagIds.filter((id) => typeof id === "string" && id.length > 0);
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

  revalidatePath("/");
  revalidatePath(sectionPath(post.section));
  redirect("/admin/posts");
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

  revalidatePath("/");
  revalidatePath(sectionPath(post.section));
  if (existing && existing.slug !== post.slug) {
    revalidatePath(`${sectionPath(existing.section)}/${existing.slug}`);
  }
  revalidatePath(`${sectionPath(post.section)}/${post.slug}`);
  redirect("/admin/posts");
}

export async function deletePostAction(id) {
  await requireAdmin();

  const existing = await getPostByIdForAdmin(id);
  await deletePost(id);

  if (existing) {
    revalidatePath("/");
    revalidatePath(sectionPath(existing.section));
    revalidatePath(`${sectionPath(existing.section)}/${existing.slug}`);
  }
}
