import { notFound } from "next/navigation";
import { getPostByIdForAdmin } from "@/lib/posts";
import { getAllTagsForAdmin } from "@/lib/tags";
import { updatePostAction } from "@/app/actions/posts";
import PostForm from "@/app/components/PostForm";

export default async function EditPostPage({ params }) {
  const { id } = await params;
  const [post, tags] = await Promise.all([
    getPostByIdForAdmin(id),
    getAllTagsForAdmin(),
  ]);

  if (!post) {
    notFound();
  }

  const boundUpdateAction = updatePostAction.bind(null, id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">编辑文章</h1>
      <div className="mt-6">
        <PostForm action={boundUpdateAction} post={post} availableTags={tags} />
      </div>
    </div>
  );
}
