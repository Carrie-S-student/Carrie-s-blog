"use client";

import { useActionState, useEffect, useState } from "react";
import { createAdminNoteAction } from "@/app/actions/notes-admin";
import {
  NOTE_COLORS,
  NOTE_SHAPES,
  NOTE_MAX_CONTENT,
  NOTE_MAX_NICKNAME,
} from "@/lib/note-styles";

/**
 * 后台"博主添加纸条"表单：添加即公开，位置随机落在墙上，之后可去前台拖拽调整。
 */
export default function AdminNoteForm() {
  const [state, formAction, pending] = useActionState(createAdminNoteAction, undefined);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("pink");
  const [shape, setShape] = useState("rectangle");

  useEffect(() => {
    if (state?.success) {
      setNickname("");
      setContent("");
      setColor("pink");
      setShape("rectangle");
    }
  }, [state]);

  return (
    <form action={formAction} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          博主添加纸条（添加即公开，前台显示带博主标记）
        </h2>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NOTE_MAX_NICKNAME}
          placeholder="落款昵称（可不填，默认匿名）"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <div className="relative">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={NOTE_MAX_CONTENT}
            rows={2}
            required
            placeholder={`纸条内容（${NOTE_MAX_CONTENT} 字以内）`}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 pr-14 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <span className="absolute bottom-2 right-3 text-xs text-neutral-400">
            {content.length}/{NOTE_MAX_CONTENT}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => setColor(c.key)}
              className={`h-6 w-6 rounded-md border-2 transition ${
                color === c.key ? "scale-110" : "opacity-60 hover:opacity-100"
              }`}
              style={{ background: c.bg, borderColor: color === c.key ? c.text : "transparent" }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {NOTE_SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setShape(s.key)}
              className={`rounded-md border px-2 py-1 text-xs transition ${
                shape === s.key
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="shape" value={shape} />

      {state?.error && <p className="mt-3 text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="mt-3 text-sm text-green-600">纸条已贴上墙，可在前台 /wall 页面看到并拖拽调整位置。</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="interactive mt-3 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "添加中…" : "贴上墙"}
      </button>
    </form>
  );
}
