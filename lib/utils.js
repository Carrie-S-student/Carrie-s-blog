/**
 * 全站公共工具函数和常量。
 * 所有文件中的重复定义都应从这里统一导入。
 */

// ==================== 日期格式化 ====================

/**
 * 日期格式化，默认中文短格式（年月日）。
 * 传入 options 可覆盖格式（如附加时分秒）。
 */
export function formatDate(date, options) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(
    "zh-CN",
    options ?? { year: "numeric", month: "long", day: "numeric" },
  );
}

/**
 * 日期格式化（含时分秒），用于后台管理列表。
 */
export function formatDateTime(date) {
  return formatDate(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==================== 栏目常量 ====================

export const SECTION_LABELS = {
  LEARNING: "学习与输入",
  THINKING: "思考与输出",
};

export const SECTION_HREF = {
  LEARNING: "/learning",
  THINKING: "/thinking",
};

export const VALID_SECTIONS = ["LEARNING", "THINKING"];

/**
 * 根据栏目返回对应的前端路由前缀。
 */
export function sectionPath(section) {
  return section === "THINKING" ? "/thinking" : "/learning";
}
