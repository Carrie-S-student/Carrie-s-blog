"use client";

import { useActionState, useEffect, useState } from "react";
import { submitNote } from "@/app/actions/notes";
import {
  NOTE_COLORS,
  NOTE_SHAPES,
  NOTE_MAX_CONTENT,
  NOTE_MAX_NICKNAME,
} from "@/lib/note-styles";

/**
 * 添加纸条弹窗：昵称（可匿名）+ 内容（200 字内）+ 淡色系颜色 + 形状。
 * 提交成功后把纸条数据交回留言墙，进入"点击墙选位置"环节。
 */
export default function NoteComposer({ onSubmitted, onClose }) {
  const [state, formAction, pending] = useActionState(submitNote, undefined);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("pink");
  const [shape, setShape] = useState("rectangle");

  useEffect(() => {
    if (state?.success && state.id) {
      onSubmitted(state.id, { nickname, content, color, shape });
    }
  }, [state]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} />

      <form
        action={formAction}
        className="relative w-full max-w-md animate-page-enter rounded-2xl border border-card-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">写一张纸条</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="interactive flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <input
          name="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NOTE_MAX_NICKNAME}
          placeholder="昵称（可不填，默认匿名）"
          className="mt-5 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />

        <div className="relative mt-3">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={NOTE_MAX_CONTENT}
            rows={4}
            required
            placeholder="此刻的想法、几句感悟、想说的话…（200 字以内）"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-14 text-sm text-foreground outline-none focus:border-accent"
          />
          <span className="absolute bottom-2.5 right-3 text-xs text-muted">
            {content.length}/{NOTE_MAX_CONTENT}
          </span>
        </div>

        <div className="mt-4">
          <label className="text-xs text-muted">便签纸颜色</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                aria-label={c.label}
                onClick={() => setColor(c.key)}
                className={`h-8 w-8 rounded-lg border-2 transition ${
                  color === c.key ? "scale-110" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  background: c.bg,
                  borderColor: color === c.key ? c.text : "transparent",
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-muted">纸条形状</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {NOTE_SHAPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setShape(s.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                  shape === s.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-card-border text-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`inline-block bg-current note-shape-${s.key}`}
                  style={{ width: 18, height: 18 }}
                />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <input type="hidden" name="color" value={color} />
        <input type="hidden" name="shape" value={shape} />

        {state?.error && <p className="mt-3 text-sm text-red-500">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="interactive mt-5 w-full rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition disabled:opacity-60"
        >
          {pending ? "提交中…" : "贴上去，然后选个位置"}
        </button>
      </form>
    </div>
  );
}
