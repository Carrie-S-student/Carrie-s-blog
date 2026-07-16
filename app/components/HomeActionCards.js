import Link from "next/link";

export default function HomeActionCards() {
  return (
    <div className="space-y-6">
      {/* 提问箱 */}
      <Link
        href="/ask"
        className="group card flex flex-col p-6 transition interactive hover:border-accent/50"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">提问箱</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          有什么想问的？欢迎在这里留言，我看到后会认真回复。
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
          去提问
          <svg
            className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </Link>

      {/* 关于我 */}
      <Link
        href="/about"
        className="group card flex flex-col p-6 transition interactive hover:border-accent/50"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">关于我</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          了解站长的学习笔记、思考与生活点滴，欢迎来到关于页面。
        </p>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
          查看更多
          <svg
            className="ml-1 h-4 w-4 transition group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}
