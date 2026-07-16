import PostForm from "@/app/components/PostForm";
import { createPostAction } from "@/app/actions/posts";
import { getAllTagsForAdmin } from "@/lib/tags";

export default async function NewPostPage() {
  const tags = await getAllTagsForAdmin();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">写新文章</h1>
      <div className="mt-6">
        <PostForm action={createPostAction} availableTags={tags} />
      </div>
    </div>
  );
}
