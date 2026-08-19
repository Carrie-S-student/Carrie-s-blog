import { getAdminSettings } from "@/lib/settings";
import Image from "next/image";

export default async function Hero() {
  const settings = await getAdminSettings();
  const heroImage = settings?.heroImage || null;
  const heroTitle = settings?.heroTitle || "Welcome to my blog";
  const heroSubtitle = settings?.heroSubtitle || "记录学习与思考，欢迎评论交流，提问箱提问。";

  return (
    <section className="relative h-screen overflow-hidden bg-slate-100">
      {heroImage ? (
        <Image src={heroImage} alt="首页背景" fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#f7f1ec] via-[#f2e7dd] to-[#ebe0d6]" />
      )}
      <div className="absolute inset-0 bg-black/25" />

      {/* 文字区域：全屏居中，留出导航栏和底部按钮的空间 */}
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 pt-20 pb-28 text-center text-white sm:px-6">
        <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">
          {heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
          {heroSubtitle}
        </p>
      </div>

      {/* Continue 按钮：底部居中，点击平滑滚动到文章列表 */}
      <a
        href="#latest-posts"
        className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition interactive hover:text-white"
      >
        <span className="text-xs font-medium tracking-[0.2em] uppercase">Continue</span>
        <svg
          className="h-4 w-4 animate-hero-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
