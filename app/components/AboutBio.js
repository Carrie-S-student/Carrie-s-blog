/**
 * 关于我页面右侧文字区域。
 * 所有文字内容均通过 props 从后端站点设置动态获取，
 * 可在后台随时更新而无需修改前端代码。
 */
export default function AboutBio({ title, paragraph1, paragraph2 }) {
  return (
    <div className="space-y-4 text-sm leading-7 text-foreground/90">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p>{paragraph1}</p>
      <p>{paragraph2}</p>
    </div>
  );
}
