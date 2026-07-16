import { getAllResearch } from "@/lib/research";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Research",
  description: "学术论文记录",
};

export default async function ResearchPage() {
  const records = await getAllResearch();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Research</h1>
      <p className="mt-2 text-muted">学术论文记录</p>

      {records.length === 0 ? (
        <p className="mt-12 text-center text-muted">暂无论文记录。</p>
      ) : (
        <ul className="mt-10 space-y-6">
          {records.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-card-border bg-card p-5 transition hover:border-accent/30"
            >
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span>{item.journal}</span>
                <span>{formatDate(item.publishedDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
