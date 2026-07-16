"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  createResearchAction,
  updateResearchAction,
  deleteResearchAction,
} from "@/app/actions/research";
import { formatDate } from "@/lib/utils";

function CreateResearchForm() {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(createResearchAction, undefined);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
          论文题目
        </label>
        <input
          name="title"
          required
          placeholder="论文标题"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
            发表时间
          </label>
          <input
            name="publishedDate"
            type="date"
            required
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
            发表期刊/会议
          </label>
          <input
            name="journal"
            required
            placeholder="例如：CVPR 2024"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "添加中…" : "添加论文"}
      </button>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">添加成功！</p>}
    </form>
  );
}

function EditResearchForm({ record, onDone }) {
  const [state, formAction, pending] = useActionState(
    updateResearchAction.bind(null, record.id),
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="title"
        defaultValue={record.title}
        required
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        autoFocus
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="publishedDate"
          type="date"
          defaultValue={record.publishedDate?.split("T")[0] || ""}
          required
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <input
          name="journal"
          defaultValue={record.journal}
          required
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div className="flex items-center gap-2">
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
      </div>
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

export default function ResearchManager({ records: initialRecords }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Research 管理
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        在此添加学术论文记录，前台 Research 页面按发表时间倒序展示。
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          新增论文
        </h2>
        <CreateResearchForm />
      </div>

      <div className="mt-6 space-y-3">
        {initialRecords.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有添加任何论文记录。</p>
        )}
        {initialRecords.map((record) => (
          <div
            key={record.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {editingId === record.id ? (
              <EditResearchForm record={record} onDone={() => setEditingId(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {record.title}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{record.journal}</span>
                    <span>{formatDate(record.publishedDate)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(record.id)}
                    className="text-sm text-neutral-700 underline dark:text-neutral-300"
                  >
                    编辑
                  </button>
                  <form
                    action={deleteResearchAction.bind(null, record.id)}
                    onSubmit={(e) => {
                      if (!window.confirm("确定要删除这条论文记录吗？")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <button type="submit" className="text-sm text-red-600 underline dark:text-red-400">
                      删除
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
