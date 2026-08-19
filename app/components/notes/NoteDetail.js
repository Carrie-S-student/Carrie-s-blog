"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import {
  getNoteColor,
  normalizeNoteShape,
  NOTE_COLORS,
  NOTE_SHAPES,
  NOTE_MAX_CONTENT,
  NOTE_MAX_NICKNAME,
} from "@/lib/note-styles";
import { updateNote, deleteOwnNote } from "@/app/actions/notes";

/**
 * 点击纸条后放大的详情弹窗：
 * - 打开瞬间先放一轮彩色烟花（canvas 粒子，盖在遮罩上方清晰绽放），
 *   约 0.9s 后再淡入展开内容，避免内容卡片把烟花挡住。
 * - 背景遮罩在烟花阶段保持通透深色（不虚化），展开后再虚化。
 * - 自己的纸条（isOwner）可在此编辑内容 / 删除。
 */
export default function NoteDetail({ note, onClose, isOwner, onUpdated, onDeleted }) {
  const canvasRef = useRef(null);

  const [showContent, setShowContent] = useState(false); // 烟花阶段先隐藏内容
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false); // 删除二次确认
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState(note.nickname || "");
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);
  const [shape, setShape] = useState(normalizeNoteShape(note.shape));

  // 先放烟花，烟花绽放后再淡入展开内容
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 900);
    return () => clearTimeout(t);
  }, []);

  // 烟花粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // 烟花配色：纸条主色打底 + 一组亮色
    const { text: baseColor } = getNoteColor(note.color);
    const palette = [baseColor, "#ff8fa3", "#ffd166", "#8ecae6", "#95d5b2", "#c77dff", "#ffffff"];
    const particles = [];
    let raf = 0;

    const burst = (cx, cy) => {
      const count = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          decay: 0.008 + Math.random() * 0.014,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    // 从中央连续爆发三轮，错落有致
    const cx = width / 2;
    const cy = height / 2;
    burst(cx, cy);
    const timers = [
      setTimeout(() => burst(cx - 130 + Math.random() * 260, cy - 120 + Math.random() * 240), 220),
      setTimeout(() => burst(cx - 130 + Math.random() * 260, cy - 120 + Math.random() * 240), 460),
    ];

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 16.667, 2.5);
      last = now;
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.06 * dt; // 重力
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (particles.length > 0) {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [note.id, note.color]);

  // ESC 关闭
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { bg, text, border } = getNoteColor(color);
  const isAuthor = note.authorType === "ADMIN";

  const startEdit = () => {
    setNickname(note.nickname || "");
    setContent(note.content);
    setColor(note.color);
    setShape(note.shape);
    setError("");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await updateNote(note.id, { nickname, content, color, shape });
    setSaving(false);
    if (res?.success && res.note) {
      setEditing(false);
      onUpdated({ ...note, ...res.note });
    } else {
      setError(res?.error || "保存失败，请重试。");
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    const res = await deleteOwnNote(note.id);
    setSaving(false);
    if (res?.success) {
      onDeleted(note.id);
    } else {
      setConfirming(false);
      setError(res?.error || "删除失败，请重试。");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* 背景遮罩：烟花阶段保持通透深色（不虚化），内容出现后再虚化背景 */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          showContent ? "bg-black/55 backdrop-blur-md" : "bg-black/45"
        }`}
        onClick={onClose}
      />

      {/* 烟花画布盖在遮罩之上，让粒子在深色背景上清晰绽放 */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10 h-full w-full" />

      {/* 展开内容：烟花结束后淡入 */}
      <div
        className={`relative z-20 w-full max-w-md transition-all duration-500 ${
          showContent ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <div
          className="note-float rounded-2xl p-7 shadow-2xl"
          style={{
            background: bg,
            color: text,
            border: isAuthor ? `3px solid ${text}` : `2px solid ${border}`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="interactive absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg leading-none text-white shadow-lg"
          >
            ×
          </button>

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{note.nickname || "匿名"}</span>
            {isAuthor && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: text }}
              >
                博主
              </span>
            )}
          </div>

          {editing ? (
            /* ---------- 编辑自己的纸条 ---------- */
            <div className="mt-4 space-y-3">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={NOTE_MAX_NICKNAME}
                placeholder="昵称（可不填，默认匿名）"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.7)", borderColor: `${text}66` }}
              />
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={NOTE_MAX_CONTENT}
                  rows={4}
                  className="w-full resize-none rounded-lg border px-3 py-2 pr-10 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.7)", borderColor: `${text}66` }}
                />
                <span className="absolute bottom-2 right-3 text-xs opacity-60">
                  {content.length}/{NOTE_MAX_CONTENT}
                </span>
              </div>

              <div>
                <label className="text-xs opacity-70">便签纸颜色</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      title={c.label}
                      aria-label={c.label}
                      onClick={() => setColor(c.key)}
                      className={`h-7 w-7 rounded-lg border-2 transition ${
                        color === c.key ? "scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ background: c.bg, borderColor: color === c.key ? c.text : "transparent" }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs opacity-70">纸条形状</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {NOTE_SHAPES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setShape(s.key)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
                        shape === s.key ? "font-medium opacity-100" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ borderColor: shape === s.key ? text : `${text}55` }}
                    >
                      <span
                        className={`inline-block bg-current note-shape-${s.key}`}
                        style={{ width: 14, height: 14 }}
                      />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  className="opacity-70 transition hover:opacity-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="interactive rounded-full bg-foreground px-4 py-1.5 font-medium text-background transition disabled:opacity-50"
                >
                  {saving ? "保存中…" : "保存修改"}
                </button>
              </div>
            </div>
          ) : (
            /* ---------- 查看模式 ---------- */
            <>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed">{note.content}</p>

              <div className="mt-6 flex items-center justify-between gap-3 text-xs opacity-60">
                <span>{formatDateTime(note.createdAt)}</span>
                {isOwner && (
                  <span className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={startEdit}
                      className="opacity-80 transition hover:opacity-100"
                    >
                      编辑
                    </button>
                    {confirming ? (
                      <>
                        <span className="text-xs">确定删除？</span>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={saving}
                          className="font-semibold text-red-600 disabled:opacity-50"
                        >
                          {saving ? "删除中…" : "删除"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(false)}
                          className="opacity-70 transition hover:opacity-100"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="text-red-600/90 transition hover:text-red-600"
                      >
                        删除
                      </button>
                    )}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
