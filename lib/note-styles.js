// 留言墙纸条样式配置（前台/后台/server action 共用，纯数据无副作用）

// 淡色系便签纸配色：背景、文字、边框统一为淡色系，深色模式下也保持"纸"的质感
export const NOTE_COLORS = [
  { key: "pink", label: "樱花粉", bg: "#fde8ec", text: "#8a4a55", border: "#f2c9d2" },
  { key: "yellow", label: "奶油黄", bg: "#fdf3d7", text: "#7d6420", border: "#efe0ad" },
  { key: "mint", label: "薄荷绿", bg: "#ddf2ea", text: "#2f7661", border: "#bfe2d3" },
  { key: "blue", label: "天空蓝", bg: "#e0edfa", text: "#3a5f8a", border: "#c2d8ef" },
  { key: "purple", label: "淡紫", bg: "#ece5f9", text: "#5a4788", border: "#d5c9ed" },
  { key: "orange", label: "蜜桃橙", bg: "#fdeede", text: "#8a5a28", border: "#f0d8b6" },
];

// 纸条形状：rectangle 长方形（默认）/ square 正方形
export const NOTE_SHAPES = [
  { key: "rectangle", label: "长方形" },
  { key: "square", label: "正方形" },
];

// 历史数据兼容：早期可选的圆形，现在统一按长方形处理
export function normalizeNoteShape(key) {
  return key === "circle" ? "rectangle" : key;
}

export const NOTE_COLOR_KEYS = NOTE_COLORS.map((c) => c.key);
export const NOTE_SHAPE_KEYS = NOTE_SHAPES.map((s) => s.key);

// 按 key 取配置，找不到时用第一个兜底
export function getNoteColor(key) {
  return NOTE_COLORS.find((c) => c.key === key) ?? NOTE_COLORS[0];
}

export function getNoteShape(key) {
  return NOTE_SHAPES.find((s) => s.key === key) ?? NOTE_SHAPES[0];
}

// 纸条内容字数上限
export const NOTE_MAX_CONTENT = 200;
export const NOTE_MAX_NICKNAME = 30;

/* ================================================================
   纸条自适应尺寸
   ----------------------------------------------------------------
   宽度按内容长度分档（内容越多纸条越宽），高度由内容自然撑开
   （渲染时 minHeight + height:auto，不截断不溢出）。
   该函数为纯计算，NoteWall 的"适应屏幕"估算与实际渲染共用，
   保证缩放视图与实际纸条尺寸一致。
================================================================ */
const NOTE_WIDTH_TIERS = [
  { maxChars: 28, width: 158 }, // 短句：窄纸条
  { maxChars: 80, width: 194 }, // 中等：默认宽度
  { maxChars: Infinity, width: 240 }, // 长文：加宽纸条
];

// 两种形状的布局参数：square 整体比 rectangle 窄一些，保持"方形纸"的感觉
const NOTE_LAYOUT = {
  rectangle: { widthOffset: 0, padX: 32, padY: 26, fontSize: 13, lineHeight: 1.45 },
  square: { widthOffset: -20, padX: 30, padY: 28, fontSize: 13, lineHeight: 1.45 },
};

// 按内容字符数选择纸条宽度
export function getNoteWidth(shape, contentLength) {
  const key = normalizeNoteShape(shape);
  const offset = NOTE_LAYOUT[key]?.widthOffset ?? 0;
  const tier = NOTE_WIDTH_TIERS.find((t) => contentLength <= t.maxChars) ?? NOTE_WIDTH_TIERS[NOTE_WIDTH_TIERS.length - 1];
  return Math.max(120, tier.width + offset);
}

/**
 * 估算纸条渲染后的尺寸 { width, height }（px）。
 * 高度按中文字符宽度 ≈ 字号 0.95em、行高 lineHeight 估算行数得出，
 * 供 NoteWall 的 fit view / 边界计算使用；实际渲染时高度由内容自然撑开。
 */
export function estimateNoteSize(note) {
  const content = (note?.content || "").toString();
  const shapeKey = normalizeNoteShape(note.shape);
  const layout = NOTE_LAYOUT[shapeKey];
  const width = getNoteWidth(note.shape, content.length);

  // 内容区可用宽度 → 每行可容纳的字数 → 行数
  const contentWidth = width - layout.padX * 2;
  const perLine = Math.max(1, Math.floor(contentWidth / (layout.fontSize * 0.95)));
  const lines = Math.max(1, Math.ceil(content.length / perLine));

  // 高度 = 上下内边距 + 昵称行 + 内容行 × 行高 + 底部时间/点赞行
  const estimated =
    layout.padY * 2 + 18 + lines * layout.fontSize * layout.lineHeight + 24;
  // 短内容时方形纸条保持"正方形"观感，长方形保持基础高度
  const minHeight = shapeKey === "square" ? width : 116;
  return { width, height: Math.max(minHeight, estimated) };
}
