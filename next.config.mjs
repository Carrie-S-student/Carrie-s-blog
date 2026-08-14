/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg 包含原生 TCP 模块，不能被 Next.js/Turbopack 打包进 serverless 函数
  serverExternalPackages: ["pg"],
  // 注意：不要在 env 块里放秘密值！它们会被构建工具内联到输出文件中。
  // 环境变量（DATABASE_URL / SESSION_SECRET 等）在运行时通过 process.env.XXX 访问，无需在此声明。
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // 图片/视频统一存储在 Vercel Blob（Vercel 与 Netlify 双平台共用同一套存储）
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
