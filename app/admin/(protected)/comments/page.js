import { getAllCommentsForAdmin } from "@/lib/comments";
import AdminCommentCard from "./AdminCommentCard";

export const metadata = {
  title: "评论管理",
};

export default async function AdminCommentsPage() {
  const comments = await getAllCommentsForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">评论管理</h1>

      <div className="mt-6 space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有任何评论。</p>
        )}
        {comments.map((comment) => (
          <AdminCommentCard key={comment.id} comment={comment} depth={0} />
        ))}
      </div>
    </div>
  );
}
