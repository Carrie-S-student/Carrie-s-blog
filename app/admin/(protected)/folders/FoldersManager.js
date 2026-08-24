"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  createFolderAction,
  updateFolderAction,
  deleteFolderAction,
} from "@/app/actions/folders";
import { formatDateTime, SECTION_LABELS } from "@/lib/utils";
import { FOLDER_COLORS, DEFAULT_FOLDER_COLOR } from "@/lib/folderColors";

const SECTION_OPTIONS = [
  { value: "LEARNING", label: SECTION_LABELS.LEARNING },
  { value: "FINANCE", label: SECTION_LABELS.FINANCE },
];

/**
 * 把文件夹按 parentId 组织成树，返回树序扁平数组（带层级深度）。
 * section 用于只取某个栏目；excludeId 用于排除某个文件夹及其所有后代（防循环）。
 */
function buildFolderTree(folders, { section, excludeId } = {}) {
  const list = section ? folders.filter((f) => f.section === section) : folders;
  const byParent = new Map();
  for (const f of list) {
    if (!byParent.has(f.parentId)) byParent.set(f.parentId, []);
    byParent.get(f.parentId).push(f);
  }

  const excluded = new Set();
  if (excludeId) {
    const queue = [excludeId];
    while (queue.length) {
      const cur = queue.shift();
      excluded.add(cur);
      for (const f of list) {
        if (f.parentId === cur && !excluded.has(f.id)) queue.push(f.id);
      }
    }
  }

  const result = [];
  const walk = (parentId, depth) => {
    for (const f of byParent.get(parentId) || []) {
      if (excluded.has(f.id)) continue;
      result.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

function ParentFolderSelect({ folders, section, name, defaultValue }) {
  const options = buildFolderTree(folders, { section });
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    >
      <option value="">顶层文件夹</option>
      {options.map(({ folder, depth }) => (
        <option key={folder.id} value={folder.id}>
          {"　".repeat(depth)}
          {depth > 0 ? "└ " : ""}
          {folder.name}
        </option>
      ))}
    </select>
  );
}

function ColorPicker({ name = "color", defaultValue = DEFAULT_FOLDER_COLOR }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FOLDER_COLORS.map((c) => (
        <label key={c.key} title={c.label} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={c.key}
            defaultChecked={defaultValue === c.key}
            className="peer sr-only"
          />
          <span
            className={`block h-7 w-7 rounded-full bg-gradient-to-br ${c.folder} ring-2 ring-transparent transition peer-checked:ring-neutral-500 peer-checked:ring-offset-1 peer-checked:ring-offset-white dark:peer-checked:ring-white dark:peer-checked:ring-offset-neutral-900`}
          />
        </label>
      ))}
    </div>
  );
}

function CreateFolderForm({ folders, section: fixedSection }) {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(createFolderAction, undefined);
  const [selectedSection, setSelectedSection] = useState(fixedSection || "LEARNING");
  const section = fixedSection || selectedSection;

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
      {fixedSection ? (
        <input type="hidden" name="section" value={fixedSection} />
      ) : (
        <div>
          <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">所属栏目</label>
          <select
            name="section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {SECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">放在哪个文件夹下（选填）</label>
        <ParentFolderSelect folders={folders} section={section} name="parentId" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">文件夹颜色</label>
        <ColorPicker />
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

function EditFolderForm({ folder, folders, onDone }) {
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
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          defaultValue={folder.name}
          required
          maxLength={20}
          className="w-32 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          autoFocus
        />
        <ParentFolderSelect
          folders={folders}
          section={folder.section}
          name="parentId"
          defaultValue={folder.parentId || ""}
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
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">文件夹颜色</label>
        <ColorPicker defaultValue={folder.color || DEFAULT_FOLDER_COLOR} />
      </div>
    </form>
  );
}

/**
 * 文件夹管理。
 * 传入 section（LEARNING/FINANCE）时限定为单个栏目（隐藏栏目选择），
 * 用于「学习与思考 / 财经专栏」栏目管理页内嵌；不传时管理全部栏目。
 */
export default function FoldersManager({ folders: initialFolders, section }) {
  const [editingId, setEditingId] = useState(null);
  const tree = buildFolderTree(initialFolders, { section });

  return (
    <div>
      {section ? (
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">文件夹管理</h2>
      ) : (
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">文件夹管理</h1>
      )}
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        文件夹支持多级嵌套，用来在栏目下对文章做进一步分类。没有选文件夹的文章会直接显示在栏目页；
        文件夹被删除后，里面的文章保留并变为未分类，子文件夹会提升一级。
      </p>

      {/* 新建文件夹表单 */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">新建文件夹</h2>
        <CreateFolderForm folders={initialFolders} section={section} />
      </div>

      {/* 文件夹列表（按层级展示） */}
      <div className="mt-6 space-y-3">
        {tree.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">还没有创建任何文件夹。</p>
        )}
        {tree.map(({ folder, depth }) => (
          <div
            key={folder.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {editingId === folder.id ? (
              <EditFolderForm
                folder={folder}
                folders={initialFolders}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {"　".repeat(depth)}
                    {depth > 0 && <span className="text-neutral-400">└ </span>}
                    {folder.name}
                  </span>
                  {!section && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {SECTION_LABELS[folder.section]}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {folder._count?.posts ?? 0} 篇文章
                  </span>
                  <span className="text-xs text-neutral-400">
                    {folder._count?.children ?? 0} 个子文件夹
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
                          "确定要删除这个文件夹吗？文件夹下的文章会保留并变为未分类，子文件夹会提升一级。"
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
