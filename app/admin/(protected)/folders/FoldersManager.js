"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  createFolderAction,
  updateFolderAction,
  deleteFolderAction,
} from "@/app/actions/folders";
import { formatDateTime, SECTION_LABELS } from "@/lib/utils";

const SECTION_OPTIONS = [
  { value: "LEARNING", label: SECTION_LABELS.LEARNING },
  { value: "FINANCE", label: SECTION_LABELS.FINANCE },
];

function CreateFolderForm() {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(createFolderAction, undefined);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">文件夹名称</label>
        <input
          name="name"
          required
          maxLength={20}
          placeholder="例如 读书笔记"
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
        {pending ? "创建中…" : "创建文件夹"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-green-600">创建成功！</p>}
    </form>
  );
}

function EditFolderForm({ folder, onDone }) {
  const [state, formAction, pending] = useActionState(
    updateFolderAction.bind(null, folder.id),
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        defaultValue={folder.name}
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

export default function FoldersManager({ folders: initialFolders }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">文件夹管理</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        文件夹用于在栏目下对文章做进一步分类。访客进入「学习与思考」或「财经专栏」时，会先看到文件夹列表，点击文件夹后才能看到里面的文章。
        在编辑文章时可以选择所属文件夹；文件夹删除后，里面的文章会保留并变为未分类。
      </p>

      {/* 新建文件夹表单 */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">新建文件夹</h2>
        <CreateFolderForm />
      </div>

      {/* 文件夹列表 */}
      <div className="mt-6 space-y-3">
        {initialFolders.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有创建任何文件夹。</p>
        )}
        {initialFolders.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {editingId === folder.id ? (
              <EditFolderForm folder={folder} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {folder.name}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {SECTION_LABELS[folder.section]}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {folder._count?.posts ?? 0} 篇文章
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(folder.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(folder.id)}
                    className="text-sm text-neutral-700 underline dark:text-neutral-300"
                  >
                    编辑
                  </button>
                  <form
                    action={deleteFolderAction.bind(null, folder.id)}
                    onSubmit={(e) => {
                      if (
                        !window.confirm(
                          "确定要删除这个文件夹吗？文件夹下的文章会保留，但会变为未分类。"
                        )
                      ) {
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
