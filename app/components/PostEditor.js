"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState, useEffect } from "react";
import FileImportButton from "@/app/components/FileImportButton";

/**
 * 后台文章正文的所见即所得编辑器。
 * 图片/视频通过 Vercel Blob 上传，返回公开 URL 后插入编辑器。
 *
 * Props:
 *   initialContent  - 初始 HTML 内容
 *   replaceContent  - 当此值变化时，用新 HTML 替换编辑器全部内容
 *   onChange        - 内容变化回调
 *   onImportTitle   - 导入文档时提取到的标题回调
 *   onImportInfo    - 导入完成后的附加信息回调（图片警告等）
 */
export default function PostEditor({
  initialContent = "",
  replaceContent,
  onChange,
  onImportTitle,
  onImportInfo,
}) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [importInfo, setImportInfo] = useState(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      Youtube.configure({ nocookie: true }),
      Placeholder.configure({ placeholder: "开始写点什么…" }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "post-content min-h-[300px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // 当 replaceContent 变化时，替换编辑器全部内容
  useEffect(() => {
    if (editor && replaceContent != null) {
      editor.commands.setContent(replaceContent);
      onChange?.(replaceContent);
    }
  }, [replaceContent]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 通用文件上传：FormData 发送文件到 /api/admin/upload，返回公网 URL */
  async function uploadFile(file) {
    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "上传失败，请重试。");
      }
      return data.url;
    } finally {
      setUploading(false);
    }
  }

  async function handleImageChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      const url = await uploadFile(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setUploadError(err.message || "上传失败，请检查网络后重试。");
    }
  }

  async function handleVideoChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      const url = await uploadFile(file);
      // 插入视频元素：用 <video> 标签嵌入
      const videoHtml = `<video controls style="max-width:100%;border-radius:8px;" src="${url}"></video>`;
      editor.chain().focus().insertContent(videoHtml).run();
    } catch (err) {
      setUploadError(err.message || "上传失败，请检查网络后重试。");
    }
  }

  function addYoutubeLink() {
    const url = window.prompt("粘贴 YouTube 视频链接：");
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }

  function addLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("链接地址：", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function handleImport({ html, title, format, imagesToUpload, imagesExtracted, warnings }) {
    if (editor) {
      editor.commands.setContent(html);
      onChange?.(html);
    }
    if (title) onImportTitle?.(title);

    const info = { format, imagesToUpload, imagesExtracted, warnings };
    setImportInfo(info);
    onImportInfo?.(info);
  }

  if (!editor) {
    return (
      <div className="min-h-[340px] rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
        编辑器加载中…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-card-border p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          粗体
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          斜体
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          删除线
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          标题 2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          标题 3
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          无序列表
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          有序列表
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          引用
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          代码块
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} onClick={addLink}>
          链接
        </ToolbarButton>
        <ToolbarButton onClick={() => imageInputRef.current?.click()} disabled={uploading}>
          {uploading ? "上传中…" : "上传图片"}
        </ToolbarButton>
        <ToolbarButton onClick={() => videoInputRef.current?.click()} disabled={uploading}>
          {uploading ? "上传中…" : "上传视频"}
        </ToolbarButton>
        <ToolbarButton onClick={addYoutubeLink}>YouTube</ToolbarButton>
        <div className="ml-2 border-l border-card-border pl-2">
          <FileImportButton onImported={handleImport} />
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChosen}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoChosen}
        />
      </div>
      {uploadError && <p className="px-3 pt-2 text-sm text-red-500">{uploadError}</p>}
      {uploading && <p className="px-3 pt-2 text-sm text-muted">文件上传中，请稍候…</p>}
      {importInfo && (
        <ImportInfoPanel info={importInfo} onDismiss={() => setImportInfo(null)} />
      )}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, active, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 text-sm transition disabled:opacity-50 ${
        active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-background"
      }`}
    >
      {children}
    </button>
  );
}

function ImportInfoPanel({ info, onDismiss }) {
  const { format, imagesToUpload, imagesExtracted, warnings } = info;
  const label = format === "docx" ? "Word 文档" : "Markdown";

  return (
    <div className="mx-4 mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">{label} 导入成功</p>
          {imagesExtracted > 0 && (
            <p className="mt-1">
              已从文档中提取并上传 <strong>{imagesExtracted}</strong> 张图片到云存储。
            </p>
          )}
          {imagesToUpload && imagesToUpload.length > 0 && (
            <div className="mt-2 rounded bg-white/60 p-2 dark:bg-blue-900/40">
              <p className="font-medium">以下图片引用来自本地文件，需手动上传：</p>
              <ul className="mt-1 list-inside list-disc text-xs opacity-80">
                {imagesToUpload.map((img, i) => (
                  <li key={i}>{img}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs opacity-70">
                请使用工具栏「上传图片」按钮逐一替换这些图片占位符。
              </p>
            </div>
          )}
          {warnings && warnings.length > 0 && (
            <p className="mt-1 text-xs opacity-70">
              {warnings.length} 条警告（格式兼容性提示，通常不影响使用）
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-blue-500 hover:text-blue-700 dark:text-blue-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
