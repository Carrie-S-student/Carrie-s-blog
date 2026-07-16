"use client";

import { useEffect, useState } from "react";

/**
 * 深色模式切换按钮。实际的 class 切换逻辑很简单：
 * 给 <html> 加/去掉 "dark" class，并存进 localStorage 记住用户的选择。
 * 首屏不闪烁的关键在 app/layout.js 里的那段内联脚本（在 React 加载前就跑）。
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换深色模式"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-foreground transition hover:bg-card interactive"
    >
      {isDark === null ? null : isDark ? (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.36-6.36-1.06 1.06M6.7 17.66l-1.06 1.06m0-13.44 1.06 1.06m11.6 11.6 1.06 1.06M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      )}
    </button>
  );
}
