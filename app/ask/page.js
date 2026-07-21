import { getPublishedQuestions } from "@/lib/questions";
import AskForm from "@/app/components/AskForm";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AskPage() {
  const questions = await getPublishedQuestions();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">提问箱</h1>
      <p className="mt-3 text-sm text-muted">
        有什么想问的都可以在这里留言，我看到后会审核回复，通过审核的问答会公开显示在下面。
      </p>

      <AskForm />

      <div className="mt-16 border-t border-card-border pt-10">
        <h2 className="text-lg font-semibold text-foreground">
          公开问答{questions.length > 0 ? ` (${questions.length})` : ""}
        </h2>

        <div className="mt-6 space-y-5">
          {questions.length === 0 && (
            <p className="text-sm text-muted">还没有公开的问答，来提第一个问题吧。</p>
          )}
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {question.nickname || "匿名"} 问：
                </span>
                <span className="text-xs text-muted">{formatDateTime(question.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                {question.content}
              </p>
              <div className="mt-3 rounded-lg bg-background/60 p-3">
                <span className="text-sm font-medium text-accent">回复：</span>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                  {question.reply}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
