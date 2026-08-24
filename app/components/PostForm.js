"use client";

import { useActionState, useState, useCallback } from "react";
import PostEditor from "@/app/components/PostEditor";
import TagPill from "@/app/components/TagPill";
import Image from "next/image";

/** 封面图上传组件：直接上传到 Vercel Blob，上传后显示预览 */
function CoverImageUploader({ defaultUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [url, setUrl] = useState(defaultUrl || "");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

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

      setUrl(data.url);
      onChange(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:text-white"
      />
      {uploadError && <p className="mt-1 text-sm text-red-500">{uploadError}</p>}
      {uploading && <p className="mt-1 text-sm text-muted">上传中，请稍候…</p>}
      {url && (
        <div className="mt-2">
          <p className="text-xs text-muted mb-1">封面图预览：</p>
          <div className="relative h-40 w-full overflow-hidden rounded-lg bg-card-border">
            <Image
              src={url}
              alt="封面图预览"
              fill
              sizes="100vw"
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const SECTION_OPTIONS = [
  { value: "LEARNING", label: "学习与思考" },
  { value: "FINANCE", label: "财经专栏" },
];

/** 把文件夹按 parentId 组织成树，返回树序扁平数组（带层级深度），用于下拉框缩进展示 */
function buildFolderTree(folders) {
  const byParent = new Map();
  for (const f of folders) {
    if (!byParent.has(f.parentId)) byParent.set(f.parentId, []);
    byParent.get(f.parentId).push(f);
  }
  const out = [];
  const walk = (parentId, depth) => {
    for (const f of byParent.get(parentId) || []) {
      out.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/**
 * 新建/编辑文章共用的表单。action 是绑定好 postId（编辑时）的 Server Action。
 * availableTags: 后台可用的所有标签（用于标签选择器）
 * availableFolders: 后台可用的所有文件夹（用于文件夹选择器）
 * defaultSection: 新建文章时的默认栏目（来自栏目管理页的「写新文章」入口）
 */
export default function PostForm({
  action,
  post,
  availableTags = [],
  availableFolders = [],
  defaultSection,
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [content, setContent] = useState(post?.content || "");
  const [title, setTitle] = useState(post?.title || "");
  const [selectedSection, setSelectedSection] = useState(
    post?.section || defaultSection || "LEARNING"
  );
  const [selectedFolderId, setSelectedFolderId] = useState(post?.folderId || "");

  // 受控标签选中状态：以 React state 为准，不再依赖 DOM defaultChecked
  const [selectedTagIds, setSelectedTagIds] = useState(
    post?.tagList?.map((t) => t.id).filter(Boolean) || []
  );

  // 当前选中栏目下的标签列表
  const sectionTags = availableTags.filter((tag) => tag.section === selectedSection);
  // 当前选中栏目下的文件夹列表（按层级树序）
  const sectionFolders = buildFolderTree(
    availableFolders.filter((folder) => folder.section === selectedSection)
  );

  const toggleTag = useCallback((tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  // 切换栏目时：清除不属于新栏目的已选标签与文件夹
  const handleSectionChange = useCallback(
    (section) => {
      setSelectedSection(section);
      const newSectionTagIds = availableTags
        .filter((t) => t.section === section)
        .map((t) => t.id);
      setSelectedTagIds((prev) => prev.filter((id) => newSectionTagIds.includes(id)));
      const newSectionFolderIds = availableFolders
        .filter((f) => f.section === section)
        .map((f) => f.id);
      setSelectedFolderId((prev) => (newSectionFolderIds.includes(prev) ? prev : ""));
    },
    [availableTags, availableFolders]
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="content" value={content} />
      {/* 受控隐藏 input：确保 Server Action 能通过 formData.getAll("tagIds") 拿到选中项 */}
      {selectedTagIds.map((id) => (
        <input key={`tag-input-${id}`} type="hidden" name="tagIds" value={id} />
      ))}

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">标题</label>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">栏目</label>
        <div className="flex gap-4">
          {SECTION_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="section"
                value={option.value}
                defaultChecked={(post?.section || defaultSection || "LEARNING") === option.value}
                onChange={() => handleSectionChange(option.value)}
                className="accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* 文件夹选择：栏目下的二级分类，可选（未分类） */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">所属文件夹（选填）</label>
        <select
          name="folderId"
          value={selectedFolderId || ""}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">未分类（直接显示在栏目页）</option>
          {sectionFolders.map(({ folder, depth }) => (
            <option key={folder.id} value={folder.id}>
              {"　".repeat(depth)}
              {depth > 0 ? "└ " : ""}
              {folder.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">
          选「未分类」的文章会直接显示在栏目页；文件夹支持多级嵌套。需要管理文件夹请到
          <a
            href={`/admin/sections/${selectedSection.toLowerCase()}?tab=folders`}
            className="underline"
          >
            栏目管理 · 文件夹
          </a>
          。
        </p>
      </div>

      {/* 标签选择：使用 TagPill 组件，受控 state 驱动，支持多选 */}
      {sectionTags.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            选择标签（可多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {sectionTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <TagPill
                  key={tag.id}
                  name={tag.name}
                  selected={selected}
                  onClick={() => toggleTag(tag.id)}
                />
              );
            })}
          </div>
          {selectedTagIds.length > 0 && (
            <p className="mt-2 text-xs text-neutral-400">
              已选择 {selectedTagIds.length} 个标签
            </p>
          )}
        </div>
      )}
      {sectionTags.length === 0 && (
        <p className="text-xs text-neutral-400">
          当前栏目下还没有标签，请先在
          <a
            href={`/admin/sections/${selectedSection.toLowerCase()}?tab=tags`}
            className="underline"
          >
            栏目管理 · 标签
          </a>
          中创建。
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">摘要（选填）</label>
        <textarea
          name="excerpt"
          defaultValue={post?.excerpt || ""}
          maxLength={200}
          rows={2}
          placeholder="不填的话会自动从正文截取一段"
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">封面图（选填）</label>
        <CoverImageUploader
          defaultUrl={post?.coverImage || ""}
          onChange={(url) => {
            const input = document.getElementById("coverImageInput");
            if (input) input.value = url;
          }}
        />
        <input
          id="coverImageInput"
          type="hidden"
          name="coverImage"
          defaultValue={post?.coverImage || ""}
        />
        <p className="mt-1 text-xs text-muted">
          直接点击文件选择按钮上传图片到云存储。上传后如需更换，重新上传即可。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">正文</label>
        <PostEditor
          initialContent={post?.content || ""}
          onChange={setContent}
          onImportTitle={setTitle}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="accent-accent" />
          发布（取消勾选则保存为草稿，不会公开显示）
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
