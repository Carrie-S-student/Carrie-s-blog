"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 交互式文档大纲（Table of Contents）
 *
 * 从页面 DOM 中提取 h1/h2/h3 标题，生成可点击的导航列表。
 * 支持：
 * - 平滑滚动到对应标题
 * - 高亮当前阅读位置（IntersectionObserver）
 * - 移动端折叠/展开
 */
export default function TableOfContents({ contentSelector = ".post-content" }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const observerRef = useRef(null);

  // 提取页面中的标题元素
  const extractHeadings = useCallback(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headingElements = container.querySelectorAll("h1, h2, h3");
    const items = [];
    let counter = 0;

    headingElements.forEach((el) => {
      // 跳过 callout 标题
      if (el.closest(".callout")) return;

      const id = el.id || `heading-${counter++}`;
      if (!el.id) el.id = id;

      items.push({
        id,
        text: el.textContent || "",
        level: parseInt(el.tagName.charAt(1), 10),
      });
    });

    setHeadings(items);
  }, [contentSelector]);

  // IntersectionObserver：高亮当前可见的标题
  useEffect(() => {
    extractHeadings();

    // 监听 DOM 变化（SPA 路由切换时重新提取）
    const mutationObserver = new MutationObserver(() => {
      extractHeadings();
    });

    const container = document.querySelector(contentSelector);
    if (container) {
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    return () => mutationObserver.disconnect();
  }, [extractHeadings, contentSelector]);

  // 标题可见性监听
  useEffect(() => {
    if (headings.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个进入视口的标题
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [headings]);

  // 点击跳转到对应标题
  const scrollToHeading = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="文档大纲">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          目录
        </h2>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-muted hover:text-foreground transition md:hidden"
          aria-label={collapsed ? "展开目录" : "收起目录"}
        >
          {collapsed ? "展开" : "收起"}
        </button>
      </div>

      <ul
        className={`toc__list space-y-1 ${
          collapsed ? "hidden md:block" : "block"
        }`}
      >
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <button
              onClick={() => scrollToHeading(id)}
              className={`toc__link block w-full text-left text-sm leading-relaxed transition-colors truncate ${
                activeId === id
                  ? "text-accent font-medium"
                  : "text-muted hover:text-foreground"
              }`}
              style={{
                paddingLeft: `${(level - 1) * 0.75}rem`,
              }}
              title={text}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
