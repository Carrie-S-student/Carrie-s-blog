/**
 * 全站公共工具函数和常量。
 * 所有文件中的重复定义都应从这里统一导入。
 */

/**
 * 生成访客的初始密码：由用户名自动拼出（"我是优秀的" + 用户名）。
 * 例：用户名 "zhangsan" → 初始密码 "我是优秀的zhangsan"。
 */
export function generateInitialPassword(username) {
  return `我是优秀的${(username ?? "").trim()}`;
}

// ==================== 日期格式化 ====================

/**
 * 日期格式化，默认中文短格式（年月日）。
 * 传入 options 可覆盖格式（如附加时分秒）。
 */
export function formatDate(date, options) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    ...(options ?? { year: "numeric", month: "long", day: "numeric" }),
    // 固定使用北京时间，避免服务端（UTC）与本地时区不一致导致的时间偏移
    timeZone: "Asia/Shanghai",
  });
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
  LEARNING: "学习与思考",
  FINANCE: "财经专栏",
};

export const SECTION_HREF = {
  LEARNING: "/learning",
  FINANCE: "/finance",
};

export const VALID_SECTIONS = ["LEARNING", "FINANCE"];

/**
 * 根据栏目返回对应的前端路由前缀。
 */
export function sectionPath(section) {
  return section === "FINANCE" ? "/finance" : "/learning";
}
