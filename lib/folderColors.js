/**
 * 文件夹可选颜色（淡色系）。
 * 后台创建/编辑文件夹时选择，前台 FolderCard 按 key 渲染对应颜色。
 * 注意：Tailwind 需要静态类名，这里必须写完整的类名，不能动态拼接。
 */

export const DEFAULT_FOLDER_COLOR = "amber";

export const FOLDER_COLORS = [
  { key: "amber",   label: "琥珀",   folder: "from-amber-300 to-amber-400 dark:from-amber-600 dark:to-amber-700",   tab: "bg-amber-300 dark:bg-amber-600",   bg: "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900" },
  { key: "orange",  label: "橙子",   folder: "from-orange-300 to-orange-400 dark:from-orange-600 dark:to-orange-700", tab: "bg-orange-300 dark:bg-orange-600", bg: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900" },
  { key: "yellow",  label: "柠檬",   folder: "from-yellow-300 to-yellow-400 dark:from-yellow-600 dark:to-yellow-700", tab: "bg-yellow-300 dark:bg-yellow-600", bg: "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900" },
  { key: "lime",    label: "青柠",   folder: "from-lime-300 to-lime-400 dark:from-lime-600 dark:to-lime-700",       tab: "bg-lime-300 dark:bg-lime-600",     bg: "from-lime-50 to-lime-100 dark:from-lime-950 dark:to-lime-900" },
  { key: "green",   label: "薄荷",   folder: "from-green-300 to-green-400 dark:from-green-600 dark:to-green-700",   tab: "bg-green-300 dark:bg-green-600",   bg: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900" },
  { key: "emerald", label: "翡翠",   folder: "from-emerald-300 to-emerald-400 dark:from-emerald-600 dark:to-emerald-700", tab: "bg-emerald-300 dark:bg-emerald-600", bg: "from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900" },
  { key: "teal",    label: "青碧",   folder: "from-teal-300 to-teal-400 dark:from-teal-600 dark:to-teal-700",       tab: "bg-teal-300 dark:bg-teal-600",     bg: "from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900" },
  { key: "cyan",    label: "天青",   folder: "from-cyan-300 to-cyan-400 dark:from-cyan-600 dark:to-cyan-700",       tab: "bg-cyan-300 dark:bg-cyan-600",     bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900" },
  { key: "sky",     label: "晴空",   folder: "from-sky-300 to-sky-400 dark:from-sky-600 dark:to-sky-700",           tab: "bg-sky-300 dark:bg-sky-600",       bg: "from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900" },
  { key: "blue",    label: "湖蓝",   folder: "from-blue-300 to-blue-400 dark:from-blue-600 dark:to-blue-700",       tab: "bg-blue-300 dark:bg-blue-600",     bg: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" },
  { key: "indigo",  label: "靛蓝",   folder: "from-indigo-300 to-indigo-400 dark:from-indigo-600 dark:to-indigo-700", tab: "bg-indigo-300 dark:bg-indigo-600", bg: "from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900" },
  { key: "violet",  label: "紫罗兰", folder: "from-violet-300 to-violet-400 dark:from-violet-600 dark:to-violet-700", tab: "bg-violet-300 dark:bg-violet-600", bg: "from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900" },
  { key: "purple",  label: "香芋",   folder: "from-purple-300 to-purple-400 dark:from-purple-600 dark:to-purple-700", tab: "bg-purple-300 dark:bg-purple-600", bg: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900" },
  { key: "fuchsia", label: "洋红",   folder: "from-fuchsia-300 to-fuchsia-400 dark:from-fuchsia-600 dark:to-fuchsia-700", tab: "bg-fuchsia-300 dark:bg-fuchsia-600", bg: "from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-950 dark:to-fuchsia-900" },
  { key: "pink",    label: "樱花",   folder: "from-pink-300 to-pink-400 dark:from-pink-600 dark:to-pink-700",       tab: "bg-pink-300 dark:bg-pink-600",     bg: "from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900" },
  { key: "rose",    label: "玫瑰",   folder: "from-rose-300 to-rose-400 dark:from-rose-600 dark:to-rose-700",       tab: "bg-rose-300 dark:bg-rose-600",     bg: "from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900" },
];

export function getFolderColor(key) {
  return (
    FOLDER_COLORS.find((c) => c.key === key) ||
    FOLDER_COLORS.find((c) => c.key === DEFAULT_FOLDER_COLOR)
  );
}

export function isValidFolderColor(key) {
  return FOLDER_COLORS.some((c) => c.key === key);
}
