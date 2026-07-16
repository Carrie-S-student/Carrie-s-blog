"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { createTagAction, updateTagAction, deleteTagAction } from "@/app/actions/tags";
import { formatDateTime, SECTION_LABELS } from "@/lib/utils";

const SECTION_OPTIONS = [
  { value: "LEARNING", label: SECTION_LABELS.LEARNING },
  { value: "THINKING", label: SECTION_LABELS.THINKING },
];

function CreateTagForm() {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(createTagAction, undefined);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">标签名称</label>
        <input
          name="name"
          required
          maxLength={20}
          placeholder="例如 React"
          className="w-40 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">所属栏目</label>
        <select
          name="section"
          defaultValue="LEARNING"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "创建中…" : "创建标签"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-green-600">创建成功！</p>}
    </form>
  );
}

function EditTagForm({ tag, onDone }) {
  const [state, formAction, pending] = useActionState(updateTagAction.bind(null, tag.id), undefined);

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        defaultValue={tag.name}
        required
        maxLength={20}
        className="w-32 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        autoFocus
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        {pending ? "保存…" : "保存"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        取消
      </button>
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

export default function TagsManager({ tags: initialTags }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">标签管理</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        标签相当于每个栏目下的文件夹，用于对文章进行分类。在编辑文章时可以选择一个或多个标签。
      </p>

      {/* 新建标签表单 */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">新建标签</h2>
        <CreateTagForm />
      </div>

      {/* 标签列表 */}
      <div className="mt-6 space-y-3">
        {initialTags.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有创建任何标签。</p>
        )}
        {initialTags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {editingId === tag.id ? (
              <EditTagForm tag={tag} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {tag.name}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {SECTION_LABELS[tag.section]}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {tag._count?.posts ?? 0} 篇文章
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(tag.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(tag.id)}
                    className="text-sm text-neutral-700 underline dark:text-neutral-300"
                  >
                    编辑
                  </button>
                  <form
                    action={deleteTagAction.bind(null, tag.id)}
                    onSubmit={(e) => {
                      if (!window.confirm("确定要删除这个标签吗？文章不会被删除，只会移除标签关联。")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <button type="submit" className="text-sm text-red-600 underline dark:text-red-400">
                      删除
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
