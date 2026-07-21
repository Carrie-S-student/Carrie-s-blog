/** @type {import('next').NextConfig} */
const nextConfig = {
  // @neondatabase/serverless 包含 WebSocket 原生模块，不能被 Next.js 打包
  serverExternalPackages: ["@neondatabase/serverless"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
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
