"use client";

import { useActionState, useState, useCallback } from "react";
import PostEditor from "@/app/components/PostEditor";
import TagPill from "@/app/components/TagPill";

const SECTION_OPTIONS = [
  { value: "LEARNING", label: "学习与输入" },
  { value: "THINKING", label: "思考与输出" },
];

/**
 * 新建/编辑文章共用的表单。action 是绑定好 postId（编辑时）的 Server Action。
 * availableTags: 后台可用的所有标签（用于标签选择器）
 */
export default function PostForm({ action, post, availableTags = [] }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [content, setContent] = useState(post?.content || "");
  const [selectedSection, setSelectedSection] = useState(post?.section || "LEARNING");

  // 受控标签选中状态：以 React state 为准，不再依赖 DOM defaultChecked
  const [selectedTagIds, setSelectedTagIds] = useState(
    post?.tagList?.map((t) => t.id).filter(Boolean) || []
  );

  // 当前选中栏目下的标签列表
  const sectionTags = availableTags.filter((tag) => tag.section === selectedSection);

  const toggleTag = useCallback((tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  // 切换栏目时：清除不属于新栏目的已选标签
  const handleSectionChange = useCallback(
    (section) => {
      setSelectedSection(section);
      const newSectionTagIds = availableTags
        .filter((t) => t.section === section)
        .map((t) => t.id);
      setSelectedTagIds((prev) => prev.filter((id) => newSectionTagIds.includes(id)));
    },
    [availableTags]
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
          defaultValue={post?.title || ""}
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
                defaultChecked={(post?.section || "LEARNING") === option.value}
                onChange={() => handleSectionChange(option.value)}
                className="accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
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
          <a href="/admin/tags" className="underline">标签管理</a>
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
        <label className="mb-1 block text-sm font-medium text-foreground">封面图链接（选填）</label>
        <input
          name="coverImage"
          defaultValue={post?.coverImage || ""}
          placeholder="在正文里上传图片后，把图片地址粘贴到这里作为封面"
          className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">正文</label>
        <PostEditor initialContent={post?.content || ""} onChange={setContent} />
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
