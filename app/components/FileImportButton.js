"use client";

import { useState, useRef, useCallback } from "react";

/**
 * 文件导入按钮组件。
 * 支持点击选择或拖拽 .md / .docx 文件，
 * 上传到 /api/admin/parse-file 解析为 HTML 后回调 onImported。
 *
 * Props:
 *   onImported({ html, title, format, imagesToUpload, imagesExtracted, warnings })
 */
export default function FileImportButton({ onImported }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback(
    async (file) => {
      setError("");
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/parse-file", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "解析失败，请重试。");
        }

        onImported({
          html: data.html,
          title: data.title || "",
          format: data.format,
          imagesToUpload: data.imagesToUpload || [],
          imagesExtracted: data.imagesExtracted || 0,
          warnings: data.warnings || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传或解析失败，请重试。");
      } finally {
        setLoading(false);
      }
    },
    [onImported]
  );

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) processFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragOver(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="relative">
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`inline-flex items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-medium transition
          ${dragOver
            ? "border-accent bg-accent/10 text-accent"
            : "border-dashed border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-500"
          }
          disabled:opacity-50`}
      >
        {loading ? (
          <>
            <Spinner />
            解析中…
          </>
        ) : (
          <>
            <UploadIcon />
            导入文档
          </>
        )}
      </button>

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-accent/10 text-sm text-accent">
          松开以导入
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
