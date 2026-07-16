import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import { getAllCommentsForAdmin } from "@/lib/comments";
import { getAllQuestionsForAdmin } from "@/lib/questions";

export const metadata = {
  title: "概览",
};

export default async function AdminHomePage() {
  const [posts, comments, questions] = await Promise.all([
    getAllPostsForAdmin(),
    getAllCommentsForAdmin(),
    getAllQuestionsForAdmin(),
  ]);

  const publishedCount = posts.filter((p) => p.published).length;
  const pendingQuestions = questions.filter((q) => q.status === "PENDING").length;

  const cards = [
    { href: "/admin/posts", label: "文章", value: `${publishedCount} / ${posts.length} 已发布` },
    { href: "/admin/comments", label: "评论", value: `共 ${comments.length} 条` },
    { href: "/admin/questions", label: "提问箱", value: `${pendingQuestions} 条待审核` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        欢迎回来
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        从左侧菜单选择要管理的内容：文章、评论或提问箱。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{card.label}</div>
            <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {card.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
