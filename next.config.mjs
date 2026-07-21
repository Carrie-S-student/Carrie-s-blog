/** @type {import('next').NextConfig} */
const nextConfig = {
  // @neondatabase/serverless 包含 WebSocket 原生模块，不能被 Next.js 打包
  serverExternalPackages: ["@neondatabase/serverless"],
  // 注意：不要在 env 块里放秘密值！它们会被构建工具内联到输出文件中。
  // Netlify 环境变量在运行时可通过 process.env.XXX 直接访问，无需在此声明。
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
