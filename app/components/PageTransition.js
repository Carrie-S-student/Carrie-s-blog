"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 页面切换过渡动画包装器。
 * 路径变化时触发淡入 + 上移动画（400ms），模拟原生 App 般的页面过渡体验。
 *
 * 实现策略：
 * - 路径不变时直接渲染 children（无动画，避免初始加载/相同页面闪烁）
 * - 路径变化时先重置 key → 触发重新挂载 → CSS animation 自动播放
 * - 使用 useRef 追踪首次渲染，首次渲染不显示动画以避免初始闪烁
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [displayPath, setDisplayPath] = useState(pathname);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setDisplayPath(pathname);
  }, [pathname]);

  return (
    <div
      key={displayPath}
      className={isFirstRender.current ? "" : "animate-page-enter"}
    >
      {children}
    </div>
  );
}
