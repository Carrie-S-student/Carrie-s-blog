import {
  getAllVisitorLogs,
  getUnreadLogCount,
} from "@/lib/visitors";
import {
  markLogReadAction,
  markAllLogsReadAction,
} from "@/app/actions/visitors-admin";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "通知中心",
};

export default async function AdminNotificationsPage() {
  const [logs, unreadCount] = await Promise.all([
    getAllVisitorLogs(),
    getUnreadLogCount(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">通知中心</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            访客修改密码、修改显示名的记录都会出现在这里。
          </p>
        </div>
        {logs.length > 0 && (
          <form action={markAllLogsReadAction}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              全部标记已读
            </button>
          </form>
        )}
      </div>

      {unreadCount > 0 && (
        <p className="mt-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          有 {unreadCount} 条未读通知
        </p>
      )}

      <div className="mt-4 space-y-3">
        {logs.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            还没有任何通知。
          </p>
        )}
        {logs.map((log) => (
          <div
            key={`${log.type}-${log.id}`}
            className={`flex items-center justify-between rounded-xl border p-4 ${
              log.read
                ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10"
            }`}
          >
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {log.visitorName}
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {log.type === "password" ? "修改了密码：" : "修改了显示名："}
                <span className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {log.oldValue}
                </span>
                →
                <span className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {log.newValue}
                </span>
              </div>
            </div>
            {!log.read && (
              <form action={markLogReadAction.bind(null, log.type, log.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  标记已读
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
