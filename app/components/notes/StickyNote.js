"use client";

import { useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { getNoteColor, normalizeNoteShape, estimateNoteSize } from "@/lib/note-styles";

export default function StickyNote({
  note,
  x,
  y,
  isOwner,
  isDragging,
  likes,
  isLiked,
  onLike,
  onPointerDown,
  onTap,
}) {
  const { bg, text, border } = getNoteColor(note.color);
  const shapeKey = normalizeNoteShape(note.shape);
  const { width } = estimateNoteSize(note);
  // 方形纸条短内容时保持正方形观感；长内容时由内容撑高
  const minHeight = shapeKey === "square" ? width : 116;
  const isAuthor = note.authorType === "ADMIN";

  // 每条纸条的飘动节奏随机（基于 id 稳定生成，避免每次渲染都变）
  const anim = useMemo(() => {
    const hash = [...note.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      duration: (3.2 + (hash % 20) / 10).toFixed(1), // 3.2s ~ 5.1s
      delay: ((hash % 30) / 10).toFixed(1), // 0s ~ 2.9s
    };
  }, [note.id]);

  return (
    <div
      data-wall-note
      className={`absolute select-none ${isDragging ? "note-dragging" : ""}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 60 : 10,
        cursor: "grab",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onClick={onTap}
      title="点击查看，拖拽调整位置"
    >
      <div
        className="note-float"
        style={{
          animationDuration: `${anim.duration}s`,
          animationDelay: `${anim.delay}s`,
        }}
      >
        <div
          className={`note-shape-${shapeKey} relative flex shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)]`}
          style={{
            width,
            minHeight,
            background: bg,
            color: text,
            border: isAuthor ? `3px solid ${text}` : `2px solid ${border}`,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            className="flex w-full flex-col"
            style={{
              padding: shapeKey === "square" ? "15px 15px 13px" : "13px 16px 11px",
              overflowWrap: "anywhere", // 长英文/URL 等自动换行，不撑破纸条
              wordBreak: "break-word",
            }}
          >
            <div className="flex items-center justify-between gap-1 text-[10px] opacity-75">
              <span className="truncate font-semibold">{note.nickname || "匿名"}</span>
              {isAuthor && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold text-white"
                  style={{ background: text }}
                >
                  博主
                </span>
              )}
            </div>

            {/* 内容完整展示：高度随内容自动增长，不截断 */}
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.45]">
              {note.content}
            </p>

            <div className="mt-1 flex items-center justify-between gap-1 text-[10px] opacity-70">
              <span>{formatDate(note.createdAt)}</span>
              <span className="flex items-center gap-1.5">
                {onLike && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike();
                    }}
                    title={isLiked ? "已点过赞" : "点赞"}
                    aria-label={isLiked ? "已点过赞" : "点赞"}
                    className={`interactive flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold transition hover:opacity-80 ${
                      isLiked ? "text-red-500" : "hover:text-red-400"
                    }`}
                  >
                    <span className="text-[11px] leading-none">{isLiked ? "♥" : "♡"}</span>
                    <span className="tabular-nums">{likes}</span>
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
