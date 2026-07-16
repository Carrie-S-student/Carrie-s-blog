"use client";

/**
 * 通用标签胶囊组件。
 * 支持两种模式：
 * - 可点击切换（PostForm 中选择标签）
 * - 纯展示 / 链接跳转（PostCard、PostDetailPage 等）
 *
 * Props:
 *   name        - 标签显示名称
 *   selected    - 是否选中（仅 clickable 模式生效，深色背景）
 *   active      - 是否处于激活状态（用于筛选栏，浅色背景带深色边框）
 *   postCount   - 文章数量（可选）
 *   onClick     - 点击回调（设置后进入可点击模式）
 *   href        - 跳转链接（设置后渲染为 <a> 链接模式）
 *   size        - "sm" | "md"（默认 md）
 *   className   - 额外样式
 */
export default function TagPill({ name, selected, active, postCount, onClick, href, size = "md", className = "" }) {
  const base =
    "inline-flex items-center rounded-full border font-medium transition interactive whitespace-nowrap";

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-0.5 text-xs"
      : "px-4 py-1.5 text-sm";

  const countEl = typeof postCount === "number" && (
    <span className="ml-1 text-xs opacity-60">{postCount}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${sizeClasses} ${
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-card-border bg-card text-foreground hover:border-foreground/50"
        } ${className}`}
      >
        {name}
        {countEl}
      </button>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={`${base} ${sizeClasses} border-card-border bg-card text-foreground hover:border-foreground/50 ${className}`}
      >
        {name}
        {countEl}
      </a>
    );
  }

  // 纯展示模式
  return (
    <span
      className={`${base} ${sizeClasses} ${
        active
          ? "border-foreground bg-card text-foreground"
          : selected
            ? "border-foreground bg-foreground text-background"
            : "border-card-border bg-card text-foreground"
      } ${className}`}
    >
      {name}
      {countEl}
    </span>
  );
}
