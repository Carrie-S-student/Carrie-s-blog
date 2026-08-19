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
