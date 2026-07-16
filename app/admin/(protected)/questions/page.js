import { getAllQuestionsForAdmin } from "@/lib/questions";
import { rejectQuestionAction, deleteQuestionAction } from "@/app/actions/questions-admin";
import ReplyForm from "@/app/components/ReplyForm";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "提问箱管理",
};

const STATUS_LABELS = {
  PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" },
  PUBLISHED: { text: "已公开", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  REJECTED: { text: "已拒绝", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
};

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestionsForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">提问箱</h1>

      <div className="mt-6 space-y-4">
        {questions.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有任何提问。</p>
        )}
        {questions.map((question) => {
          const status = STATUS_LABELS[question.status];
          return (
            <div
              key={question.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {question.nickname || "匿名"}
                </span>
                <span className="text-neutral-400">{formatDateTime(question.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {question.content}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.text}</span>
              </div>

              {question.status === "PUBLISHED" && question.reply && (
                <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">已回复：</span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                    {question.reply}
                  </p>
                </div>
              )}

              {question.status === "PENDING" && <ReplyForm questionId={question.id} />}

              <div className="mt-3 flex items-center gap-4 text-sm">
                {question.status === "PENDING" && (
                  <form
                    action={async () => {
                      "use server";
                      await rejectQuestionAction(question.id);
                    }}
                  >
                    <button type="submit" className="text-neutral-700 underline dark:text-neutral-300">
                      拒绝（不公开）
                    </button>
                  </form>
                )}
                <form
                  action={async () => {
                    "use server";
                    await deleteQuestionAction(question.id);
                  }}
                >
                  <button type="submit" className="text-red-600 underline dark:text-red-400">
                    删除
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
