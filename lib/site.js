// 站点公开地址：运行时读取，兼容多平台部署。
//
// - Vercel / Netlify：构建时注入 NEXT_PUBLIC_SITE_URL（被 Next.js 构建期内联）。
// - CloudBase 云托管：构建时无法内联 NEXT_PUBLIC_*，通过运行时环境变量 SITE_URL 注入。
// 优先级：SITE_URL（CloudBase 运行时） > NEXT_PUBLIC_SITE_URL（Vercel/Netlify 构建内联） > 本地回退。
export function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}
