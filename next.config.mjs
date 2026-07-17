/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify/通用 serverless 环境需要把 pg 标为外部包，避免打包问题
  serverExternalPackages: ["pg"],
};

export default nextConfig;
