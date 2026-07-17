"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";

/**
 * 后台文章正文的所见即所得编辑器。
 * 工具栏上的按钮直接对应常见排版操作，图片/视频按钮会调用 /api/admin/upload 上传后插入。
 */
export default function PostEditor({ initialContent = "", onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  async function handleFileChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    // 视频不支持 base64 内嵌（太大），提示用 YouTube
    if (file.type.startsWith("video/")) {
      setUploadError("视频不支持直接上传，请用 YouTube 按钮嵌入视频链接。");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      // 用 FileReader 把图片文件转成 base64 data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.readAsDataURL(file);
      });

      // 把 base64 字符串 POST 到后端校验
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "上传失败，请重试。");
        return;
      }

      // data.url 就是 base64 data URL，直接插入编辑器
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch {
      setUploadError("上传失败，请检查网络后重试。");
    } finally {
      setUploading(false);
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
        <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "上传中…" : "上传图片"}
        </ToolbarButton>
        <ToolbarButton onClick={addYoutubeLink}>YouTube</ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChosen}
        />
      </div>
      {uploadError && <p className="px-3 pt-2 text-sm text-red-500">{uploadError}</p>}
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
