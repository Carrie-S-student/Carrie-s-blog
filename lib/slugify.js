/**
 * 把标题变成一个适合放进 URL 的 slug。
 * 中文标题会保留中文字符（现代浏览器 URL 里可以直接放中文，会自动编码），
 * 只去掉两边空格、把中间空格换成短横线、去掉一些特殊符号。
 */
export function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[/?#\\%<>"'`]/g, "")
    .slice(0, 80);
}
