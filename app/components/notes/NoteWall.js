"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StickyNote from "./StickyNote";
import NoteDetail from "./NoteDetail";
import NoteComposer from "./NoteComposer";
import { placeNote, toggleNoteLikeAction } from "@/app/actions/notes";
import { formatDateTime } from "@/lib/utils";
import { getNoteColor, normalizeNoteShape } from "@/lib/note-styles";

// 无限画布：世界尺寸 = 视口 × 倍率（纸条可放在任何位置，缩放/平移查看任意区域）
const WORLD_W_MULT = 4; // 世界宽 = 视口宽 × 4
const WORLD_H_MULT = 3; // 世界高 = 视口高 × 3
const MIN_SCALE = 0.15;
const MAX_SCALE = 4;

// 凌乱模式墙上一屏最多展示的纸条数（防止纸条过多导致动画卡顿）
const WALL_LIMIT = 80;

const clamp = (v) => Math.min(100, Math.max(0, v));
const round2 = (v) => Math.round(v * 100) / 100;

// 已点赞纸条 id 的本地持久化 key（刷新后仍保持已赞状态）
const LIKES_STORAGE_KEY = "wall-liked-notes";

export default function NoteWall({ notes, currentVisitorId, isAdmin }) {
  const router = useRouter();
  const wallRef = useRef(null); // 视口容器
  const worldRef = useRef(null); // 无限画布
  const dragRef = useRef(null); // 纸条拖拽起点
  const panRef = useRef(null); // 画布平移起点
  const suppressClickRef = useRef(false); // 拖动结束后抑制紧随的 click，避免误开详情
  const spaceHeldRef = useRef(false); // 是否按住空格（拖动画布）
  const toastTimerRef = useRef(null);

  const [mode, setMode] = useState("wall"); // wall | timeline
  const [openNote, setOpenNote] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [placingId, setPlacingId] = useState(null); // 待放置的新纸条 id
  const [localNotes, setLocalNotes] = useState([]); // 本地待审核纸条
  const [positionOverrides, setPositionOverrides] = useState({}); // 拖拽后的本地位置
  const [dragPos, setDragPos] = useState(null); // 拖拽中的实时位置
  const [toast, setToast] = useState("");
  // 点赞状态（本地覆盖）：{ [noteId]: { liked, likes } }，未覆盖时以服务端 note.likes 为准
  const [likeState, setLikeState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LIKES_STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return {};
      const map = {};
      for (const id of saved) map[id] = { liked: true };
      return map;
    } catch {
      return {};
    }
  });

  const persistLikes = (map) => {
    try {
      const ids = Object.entries(map)
        .filter(([, v]) => v.liked)
        .map(([id]) => id);
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage 不可用时忽略，不影响点赞
    }
  };

  // 单张纸条的点赞状态与数量
  const getLikeInfo = (note) => {
    const local = likeState[note.id];
    return {
      liked: local?.liked ?? false,
      likes: local?.likes ?? note.likes ?? 0,
    };
  };

  // 点赞：每个访客对同一张纸条只能赞一次，重复点击不再取消，点赞数只增不减
  const toggleLike = async (note) => {
    if (note.status === "PENDING") return;
    const prevLiked = likeState[note.id]?.liked ?? false;
    const prevLikes = likeState[note.id]?.likes ?? note.likes ?? 0;
    if (prevLiked) {
      showToast("你已经点过赞啦");
      return;
    }
    // 乐观更新：先本地 +1，再以服务端结果校准
    const optimistic = {
      ...likeState,
      [note.id]: { liked: true, likes: prevLikes + 1 },
    };
    setLikeState(optimistic);
    persistLikes(optimistic);

    const res = await toggleNoteLikeAction(note.id);
    if (res?.success) {
      setLikeState((cur) => {
        const next = { ...cur, [note.id]: { liked: res.liked, likes: res.likes } };
        persistLikes(next);
        return next;
      });
    } else {
      setLikeState((cur) => {
        const next = { ...cur, [note.id]: { liked: prevLiked, likes: prevLikes } };
        persistLikes(next);
        return next;
      });
      showToast(res?.error || "点赞失败，请重试");
    }
  };

  // 画布视图：translate(px) + scale（世界坐标 = 视口坐标，经 view 换算）
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  const [worldSize, setWorldSize] = useState(null); // { w, h } 世界像素尺寸
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // 编辑/删除权限：管理员，或登录访客本人的纸条；未登录游客（currentVisitorId 为 null）不可编辑删除
  const canEdit = (note) =>
    isAdmin || (currentVisitorId != null && note.visitorId === currentVisitorId);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  /* ---------- 初始化画布：按视口建世界并适应屏幕 ---------- */
  // 根据纸条实际分布计算合适的视图：有纸条时 fit 内容，没纸条时展示整个画布
  const computeFitView = (size, notes, vw, vh) => {
    if (!size) return { x: 0, y: 0, scale: 1 };
    if (notes.length === 0) {
      const scale = 1.0;
      return {
        x: (vw - size.w * scale) / 2,
        y: (vh - size.h * scale) / 2,
        scale,
      };
    }
    const pad = 64; // 视口四边留白
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    notes.forEach((note) => {
      const pos = getPosition(note);
      const shapeKey = normalizeNoteShape(note.shape);
      const nw = shapeKey === "square" ? 162 : 188;
      const nh = shapeKey === "square" ? 162 : 122;
      const px = (pos.x / 100) * size.w;
      const py = (pos.y / 100) * size.h;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px + nw);
      maxY = Math.max(maxY, py + nh);
    });
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const availW = Math.max(1, vw - pad * 2);
    const availH = Math.max(1, vh - pad * 2);
    // 最大放大到 150%，避免单张纸条撑满整个屏幕
    const scale = Math.min(availW / contentW, availH / contentH, MAX_SCALE, 1.5);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      x: vw / 2 - cx * scale,
      y: vh / 2 - cy * scale,
      scale,
    };
  };

  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = { w: vw * WORLD_W_MULT, h: vh * WORLD_H_MULT };
      setWorldSize(size);
      const rect = wallRef.current?.getBoundingClientRect();
      const viewW = rect?.width ?? vw;
      const viewH = rect?.height ?? vh;
      const v = computeFitView(size, wallNotes, viewW, viewH);
      setView({ x: round2(v.x), y: round2(v.y), scale: round2(v.scale) });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fitView = () => {
    if (!worldSize) return;
    const rect = wallRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? window.innerWidth;
    const vh = rect?.height ?? window.innerHeight;
    const v = computeFitView(worldSize, wallNotes, vw, vh);
    setView({ x: round2(v.x), y: round2(v.y), scale: round2(v.scale) });
  };

  /* ---------- 按住空格可拖动画布 ---------- */
  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space") {
        spaceHeldRef.current = true;
        if (e.target === document.body) e.preventDefault();
      }
    };
    const up = (e) => {
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ---------- 滚轮缩放（以鼠标位置为中心） ---------- */
  useEffect(() => {
    const el = wallRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = viewRef.current;
      // 鼠标所在的世界坐标点，缩放后保持该点不动
      const wx = (mx - v.x) / v.scale;
      const wy = (my - v.y) / v.scale;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      setView({ x: mx - wx * scale, y: my - wy * scale, scale });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // 凌乱模式展示的纸条：已公开的最新 WALL_LIMIT 张 + 本地待审核纸条（按 id 去重）
  const wallNotes = useMemo(() => {
    const localIds = new Set(localNotes.map((n) => n.id));
    const published = [...notes]
      .filter((n) => !localIds.has(n.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, WALL_LIMIT);
    return [...localNotes, ...published];
  }, [notes, localNotes]);

  // 纸条位置：优先拖拽实时位置 → 本地覆盖 → 数据库位置 → 稳定伪随机兜底
  const getPosition = (note) => {
    if (dragPos && dragPos.id === note.id) return { x: dragPos.x, y: dragPos.y };
    if (positionOverrides[note.id]) return positionOverrides[note.id];
    if (note.posX != null && note.posY != null) return { x: note.posX, y: note.posY };
    const hash = [...note.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return { x: 15 + (hash % 70), y: 12 + ((hash * 7) % 72) };
  };

  /* ---------- 纸条拖拽 + 画布平移 ---------- */
  useEffect(() => {
    const handleMove = (e) => {
      // 平移画布
      const p = panRef.current;
      if (p) {
        const nx = p.origX + (e.clientX - p.startX);
        const ny = p.origY + (e.clientY - p.startY);
        p.moved = p.moved || Math.abs(e.clientX - p.startX) + Math.abs(e.clientY - p.startY) > 4;
        if (p.moved) setView((v) => ({ ...v, x: nx, y: ny }));
        return;
      }

      // 拖拽纸条（世界坐标 = 视口位移 ÷ 缩放比例）
      const r = dragRef.current;
      if (!r) return;
      const rect = worldRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dxPct = ((e.clientX - r.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - r.startY) / rect.height) * 100;
      const nx = clamp(r.origX + dxPct);
      const ny = clamp(r.origY + dyPct);
      const moved = r.moved || Math.abs(e.clientX - r.startX) + Math.abs(e.clientY - r.startY) > 6;
      r.moved = moved;
      r.lastX = nx;
      r.lastY = ny;
      if (moved) setDragPos({ id: r.id, x: nx, y: ny });
    };

    const handleUp = () => {
      const p = panRef.current;
      if (p) {
        panRef.current = null;
        setPanning(false);
        return;
      }

      const r = dragRef.current;
      dragRef.current = null;
      setDragPos(null);
      if (!r) return;

      if (!r.moved) return; // 未拖动 = 点击，交给 onClick 打开详情

      // 拖动过：抑制浏览器随后自动触发的 click，避免误开详情弹窗
      suppressClickRef.current = true;

      const x = round2(r.lastX);
      const y = round2(r.lastY);
      setPositionOverrides((prev) => ({ ...prev, [r.id]: { x, y } }));

      const all = [...notes, ...localNotes];
      const note = all.find((n) => n.id === r.id);
      // 自己的纸条，或游客刚贴的待审核纸条，都可以保存位置
      const canMove =
        note && (canEdit(note) || (note.status === "PENDING" && note.visitorId === null));
      if (canMove) {
        placeNote(r.id, x, y).then((res) => {
          if (!res?.success) showToast(res?.error || "位置保存失败");
        });
      } else {
        showToast("这是 TA 的纸条，拖动只在当前页面临时生效");
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [notes, localNotes, canEdit]);

  const startDrag = (e, note) => {
    if (placingId) return;
    if (e.button !== undefined && e.button !== 0) return;
    suppressClickRef.current = false; // 新一轮交互开始，重置抑制标记
    e.preventDefault();
    const pos = getPosition(note);
    dragRef.current = {
      id: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      lastX: pos.x,
      lastY: pos.y,
      moved: false,
    };
  };

  // 空白处左键 / 中键：直接拖拽平移画布（按住空格时从纸条上也能拖动画布）
  const handleViewportPointerDown = (e) => {
    if (placingId) return;
    if (e.button !== 0 && e.button !== 1) return;
    // 左键点在纸条上：交给纸条拖拽，不启动画布平移（除非按住空格）
    if (e.button === 0 && !spaceHeldRef.current && e.target.closest("[data-wall-note]")) {
      return;
    }
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: viewRef.current.x,
      origY: viewRef.current.y,
      moved: false,
    };
    setPanning(true);
    e.preventDefault();
  };

  /* ---------- 放置模式：写完纸条后点击画布选位置 ---------- */
  const handleWallClick = (e) => {
    if (!placingId || !worldSize) return;
    const rect = wallRef.current?.getBoundingClientRect();
    if (!rect) return;
    const v = viewRef.current;
    // 屏幕坐标 → 世界坐标 → 百分比
    const wx = (e.clientX - rect.left - v.x) / v.scale;
    const wy = (e.clientY - rect.top - v.y) / v.scale;
    const x = round2(clamp((wx / worldSize.w) * 100));
    const y = round2(clamp((wy / worldSize.h) * 100));

    placeNote(placingId, x, y).then((res) => {
      if (res?.success) {
        setLocalNotes((prev) =>
          prev.map((n) => (n.id === placingId ? { ...n, posX: x, posY: y } : n))
        );
        setPlacingId(null);
        showToast("贴好啦！等博主审核通过，大家就能看到这张纸条");
      } else {
        setPlacingId(null);
        showToast(res?.error || "放置失败");
      }
    });
  };

  /* ---------- 提交后进入放置模式 ---------- */
  const handleComposerSubmitted = (id, draft) => {
    setComposerOpen(false);
    setLocalNotes((prev) => [
      ...prev,
      {
        ...draft,
        id,
        status: "PENDING",
        authorType: "VISITOR",
        visitorId: currentVisitorId,
        createdAt: new Date().toISOString(),
      },
    ]);
    setPlacingId(id);
  };

  /* ---------- 自己的纸条：编辑 / 删除后同步本地与服务器数据 ---------- */
  const handleNoteUpdated = (updated) => {
    setOpenNote(updated);
    setLocalNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
    router.refresh(); // 重新拉取服务器端纸条，让墙上其他引用同步
  };

  const handleNoteDeleted = (id) => {
    setOpenNote(null);
    setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    router.refresh();
  };

  const openDetail = (note) => {
    if (suppressClickRef.current) {
      // 刚拖动过这张纸条，忽略这次 click
      suppressClickRef.current = false;
      return;
    }
    setOpenNote(note);
  };

  /* ---------- 时间轴模式数据 ---------- */
  const timelineNotes = useMemo(() => {
    const localIds = new Set(localNotes.map((n) => n.id));
    return [...localNotes, ...notes.filter((n) => !localIds.has(n.id))].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [notes, localNotes]);

  return (
    <div>
      {/* 工具栏：标题居中 + 右上角操作区 */}
      <div className="relative flex items-center justify-end gap-2">
        <h1 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-3xl font-bold text-foreground">
          留言墙
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "wall" ? "timeline" : "wall")}
            className="interactive rounded-full border border-card-border bg-card px-4 py-2 text-sm text-muted transition hover:text-foreground"
          >
            {mode === "wall" ? "按时间排序" : "回到凌乱墙"}
          </button>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="interactive rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition"
          >
            ＋ 写一张
          </button>
        </div>
      </div>

      {mode === "wall" ? (
        <div
          ref={wallRef}
          onPointerDown={handleViewportPointerDown}
          style={{
            height: "calc(100dvh - 9rem)",
            cursor: panning ? "grabbing" : "grab",
            touchAction: "none",
          }}
          className="relative mt-5 overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-[#fdf1e6] via-[#f6eef7] to-[#e9f2f6] dark:from-[#201a14] dark:via-[#1c1722] dark:to-[#141b22]"
        >
          {/* 无限画布：占视口 4 倍宽 / 3 倍高，可缩放平移，无边界 */}
          <div
            ref={worldRef}
            className={`absolute left-0 top-0 origin-top-left ${placingId ? "wall-blurred" : ""}`}
            style={{
              width: worldSize?.w,
              height: worldSize?.h,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              backgroundImage: "radial-gradient(rgba(120,120,150,0.16) 1.2px, transparent 1.2px)",
              backgroundSize: "26px 26px",
            }}
          >
            {worldSize && wallNotes.length === 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <p className="text-sm text-muted">墙上还空空的，点右上角写第一张纸条吧</p>
              </div>
            )}
            {worldSize &&
              wallNotes.map((note) => {
                const pos = getPosition(note);
                const like = getLikeInfo(note);
                return (
                  <StickyNote
                    key={note.id}
                    note={note}
                    x={pos.x}
                    y={pos.y}
                    isOwner={canEdit(note)}
                    isPending={note.status === "PENDING"}
                    isDragging={dragPos?.id === note.id}
                    likes={like.likes}
                    isLiked={like.liked}
                    onLike={() => toggleLike(note)}
                    onPointerDown={(e) => startDrag(e, note)}
                    onTap={() => openDetail(note)}
                  />
                );
              })}
          </div>

          {/* 放置模式遮罩：整面墙虚化 + 点击选位置 */}
          {placingId && (
            <div
              onClick={handleWallClick}
              className="absolute inset-0 z-50 flex cursor-crosshair flex-col items-center justify-center gap-2 bg-black/25"
            >
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg">
                点击墙上任意位置贴纸条
              </span>
              <span className="text-xs text-white/90">点哪儿，纸条就飞到哪儿</span>
            </div>
          )}

          {/* 画布操作提示 */}
          <div className="pointer-events-none absolute left-3 top-3 z-[60] rounded-full bg-black/45 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            滚轮缩放 · 直接拖拽背景移动画布 · 按住空格可从纸条上拖动
          </div>

          {/* 视图控制：缩放百分比 + 适应屏幕 */}
          <div className="absolute bottom-3 right-3 z-[60] flex items-center gap-2 rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs text-muted shadow backdrop-blur">
            <button
              type="button"
              onClick={fitView}
              className="interactive font-medium text-foreground transition hover:opacity-70"
            >
              适应屏幕
            </button>
            <span className="tabular-nums">{Math.round(view.scale * 100)}%</span>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted">按时间顺序整理好的留言（共 {timelineNotes.length} 张）</p>
          {timelineNotes.length === 0 && (
            <p className="text-sm text-muted">还没有纸条，来写第一张吧。</p>
          )}
          {timelineNotes.map((note) => {
            const { text } = getNoteColor(note.color);
            const isAuthor = note.authorType === "ADMIN";
            const like = getLikeInfo(note);
            return (
              <div
                key={note.id}
                className="flex w-full items-start gap-3 rounded-xl border border-card-border bg-card p-4 text-left"
              >
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: text }} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{note.nickname || "匿名"}</span>
                    {isAuthor && (
                      <span
                        className="rounded-full px-1.5 py-px text-[10px] font-bold text-white"
                        style={{ background: text }}
                      >
                        博主
                      </span>
                    )}
                    {note.status === "PENDING" && (
                      <span className="rounded-full bg-yellow-100 px-1.5 py-px text-[10px] text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                        待审核
                      </span>
                    )}
                    <span className="text-xs text-muted">{formatDateTime(note.createdAt)}</span>
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap text-sm text-foreground/90">
                    {note.content}
                  </span>
                  {note.status !== "PENDING" && (
                    <span className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => toggleLike(note)}
                        title={like.liked ? "已点过赞" : "点赞"}
                        aria-label={like.liked ? "已点过赞" : "点赞"}
                        className={`interactive flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition hover:opacity-80 ${
                          like.liked
                            ? "border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/30"
                            : "border-card-border text-muted hover:text-red-400"
                        }`}
                      >
                        <span className="text-sm leading-none">{like.liked ? "♥" : "♡"}</span>
                        <span className="tabular-nums">{like.likes}</span>
                        <span className="text-muted">赞</span>
                      </button>
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {openNote && (
        <NoteDetail
          note={openNote}
          isOwner={canEdit(openNote)}
          onUpdated={handleNoteUpdated}
          onDeleted={handleNoteDeleted}
          onClose={() => setOpenNote(null)}
        />
      )}
      {composerOpen && (
        <NoteComposer onSubmitted={handleComposerSubmitted} onClose={() => setComposerOpen(false)} />
      )}

      {/* 轻提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 animate-page-enter rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
