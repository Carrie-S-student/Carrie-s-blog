import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import { getAllCommentsForAdmin } from "@/lib/comments";
import { getAllQuestionsForAdmin } from "@/lib/questions";
import { getAllVisitors } from "@/lib/visitors";
import { getPostViewStats } from "@/lib/postviews";

export const metadata = {
  title: "概览",
};

export default async function AdminHomePage() {
  const [posts, comments, questions, visitors, viewStats] =
    await Promise.all([
      getAllPostsForAdmin(),
      getAllCommentsForAdmin(),
      getAllQuestionsForAdmin(),
      getAllVisitors(),
      getPostViewStats(),
    ]);

  const learningCount = posts.filter((p) => p.section === "LEARNING").length;
  const financeCount = posts.filter((p) => p.section === "FINANCE").length;
  const pendingQuestions = questions.filter((q) => q.status === "PENDING").length;
  const totalViews = viewStats.reduce((sum, s) => sum + s.viewCount, 0);

  const cards = [
    { href: "/admin/sections/learning", label: "学习与思考", value: `${learningCount} 篇文章` },
    { href: "/admin/sections/finance", label: "财经专栏", value: `${financeCount} 篇文章` },
    { href: "/admin/comments", label: "评论", value: `共 ${comments.length} 条` },
    { href: "/admin/questions", label: "提问箱", value: `${pendingQuestions} 条待审核` },
    { href: "/admin/visitors", label: "访问用户", value: `共 ${visitors.length} 位` },
    { href: "/admin/stats", label: "总访问量", value: `${totalViews} 次` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        欢迎回来
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        文章按「学习与思考」「财经专栏」两个栏目分别管理，每个栏目内整合文章、标签和文件夹。
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
