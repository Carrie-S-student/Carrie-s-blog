"use client";

import { useEffect, useRef, useCallback } from "react";
import "katex/dist/katex.min.css";

/**
 * 客户端文章内容渲染器。
 *
 * 职责：
 * 1. 渲染服务端生成的 HTML（dangerouslySetInnerHTML）
 * 2. 在浏览器端渲染 Mermaid 图表（```mermaid 代码块 → SVG）
 * 3. 在浏览器端渲染 KaTeX 数学公式（.math 元素 → HTML/SVG）
 */
export default function PostContentRenderer({ html }) {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);

  const renderEnhancements = useCallback(async () => {
    const container = containerRef.current;
    if (!container || renderedRef.current) return;

    // ---- Mermaid 渲染 ----
    const mermaidBlocks = container.querySelectorAll(
      "pre code.language-mermaid"
    );
    if (mermaidBlocks.length > 0) {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "default",
          securityLevel: "loose",
          fontFamily: "var(--font-sans), sans-serif",
        });

        for (const block of mermaidBlocks) {
          try {
            const pre = block.parentElement;
            const code = block.textContent || "";
            // 生成唯一 ID，避免多次渲染冲突
            const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
            const { svg } = await mermaid.render(id, code);
            const wrapper = document.createElement("div");
            wrapper.className = "mermaid-wrapper my-6 flex justify-center";
            wrapper.innerHTML = svg;
            pre.replaceWith(wrapper);
          } catch (err) {
            console.error("Mermaid render error:", err);
            // 渲染失败时保留原始代码块，并添加错误提示
            const pre = block.parentElement;
            if (pre) {
              pre.insertAdjacentHTML(
                "beforebegin",
                '<p class="text-sm text-red-500 my-2">⚠️ Mermaid 图表渲染失败，请检查语法。</p>'
              );
            }
          }
        }
      } catch (err) {
        console.error("Mermaid import error:", err);
      }
    }

    // ---- KaTeX 渲染 ----
    const mathElements = container.querySelectorAll(".math");
    if (mathElements.length > 0) {
      try {
        const katex = (await import("katex")).default;

        for (const el of mathElements) {
          try {
            const isBlock = el.classList.contains("math-block");
            katex.render(el.textContent || "", el, {
              throwOnError: false,
              displayMode: isBlock,
              trust: true,
            });
          } catch (err) {
            console.error("KaTeX render error:", err);
            // 渲染失败时显示原始公式文本
            el.textContent = el.textContent || "";
            el.classList.add("katex-error");
          }
        }
      } catch (err) {
        console.error("KaTeX import error:", err);
      }
    }

    renderedRef.current = true;
  }, []);

  useEffect(() => {
    // 延迟一小段时间确保 DOM 就绪
    const timer = setTimeout(() => {
      renderEnhancements();
    }, 50);
    return () => clearTimeout(timer);
  }, [html, renderEnhancements]);

  // 当 html 变化时重置渲染标记
  useEffect(() => {
    renderedRef.current = false;
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="post-content mt-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
