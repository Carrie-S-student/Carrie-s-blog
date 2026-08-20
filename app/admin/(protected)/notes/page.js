import { getAllNotesForAdmin } from "@/lib/notes";
import { deleteNoteAction } from "@/app/actions/notes-admin";
import AdminNoteForm from "@/app/components/notes/AdminNoteForm";
import { formatDateTime } from "@/lib/utils";
import { getNoteColor, getNoteShape, normalizeNoteShape } from "@/lib/note-styles";

export const metadata = {
  title: "留言墙管理",
};

const STATUS_LABELS = {
  PENDING: { text: "待审核", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" },
  PUBLISHED: { text: "已公开", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  REJECTED: { text: "已拒绝", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
};

export default async function AdminNotesPage() {
  const notes = await getAllNotesForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">留言墙</h1>

      <div className="mt-6">
        <AdminNoteForm />
      </div>

      <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
        访客添加的纸条会直接公开显示，无需审核；如内容不合适，可点击下方「删除」移除。
      </p>

      <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        全部纸条（{notes.length}）
      </h2>

      <div className="mt-4 space-y-4">
        {notes.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有任何纸条。</p>
        )}
        {notes.map((note) => {
          const status = STATUS_LABELS[note.status];
          const { bg, text } = getNoteColor(note.color);
          const shape = getNoteShape(note.shape);
          const shapeKey = normalizeNoteShape(note.shape);
          const isAuthor = note.authorType === "ADMIN";
          return (
            <div
              key={note.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {/* 纸条样式预览 */}
                  <span
                    className={`inline-block h-8 w-8 ${`note-shape-${shapeKey}`}`}
                    style={{ background: bg, border: `2px solid ${text}` }}
                  />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {note.nickname || "匿名"}
                  </span>
                  {isAuthor && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: text }}>
                      博主添加
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">{shape.label}</span>
                </div>
                <span className="text-neutral-400">{formatDateTime(note.createdAt)}</span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {note.content}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.text}</span>
                {note.posX != null && (
                  <span className="text-xs text-neutral-400">
                    墙上的位置：({note.posX.toFixed(1)}%, {note.posY.toFixed(1)}%)
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <form
                  action={async () => {
                    "use server";
                    await deleteNoteAction(note.id);
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
