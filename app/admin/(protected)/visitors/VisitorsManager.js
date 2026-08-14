"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  addVisitorAction,
  updateVisitorAction,
  deleteVisitorAction,
} from "@/app/actions/visitors-admin";
import { formatDateTime, MAX_CHANGE_COUNT, generateInitialPassword } from "@/lib/utils";

const inputClass =
  "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

function CreateVisitorForm() {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(addVisitorAction, undefined);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const previewPassword = generateInitialPassword(username);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setUsername("");
      setDisplayName("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">用户名</label>
        <input
          name="username"
          required
          maxLength={30}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="例如 zhangsan"
          className={`${inputClass} w-full sm:w-80`}
        />
        <p className="mt-1 text-xs text-neutral-400">
          填用户名即可，初始密码自动生成。后台列表始终显示这个初始用户名。
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
          昵称（首页显示名，可选）
        </label>
        <input
          name="displayName"
          maxLength={30}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          type="text"
          placeholder={`不填默认用用户名（${username || "…"}）`}
          className={`${inputClass} w-full sm:w-80`}
        />
        <p className="mt-1 text-xs text-neutral-400">首页欢迎语用这个昵称，之后可在"编辑"里随时修改。</p>
      </div>
      <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        初始密码：<span className="font-medium text-neutral-900 dark:text-neutral-100">
          {previewPassword}
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "添加中…" : "添加访客"}
      </button>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">添加成功！</p>}
    </form>
  );
}

function EditVisitorForm({ visitor, onDone }) {
  const [state, formAction, pending] = useActionState(
    updateVisitorAction.bind(null, visitor.id),
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">
        初始用户名：<span className="font-medium text-neutral-900 dark:text-neutral-100">{visitor.name}</span>
        <span className="ml-1 text-xs text-neutral-400">（已锁定）</span>
      </span>
      <label className="text-xs text-neutral-400">昵称</label>
      <input
        name="displayName"
        defaultValue={visitor.displayName || visitor.name}
        maxLength={30}
        type="text"
        title="首页欢迎语显示的昵称，留空恢复为初始用户名"
        className={`${inputClass} w-32`}
      />
      <label className="text-xs text-neutral-400">密码</label>
      <input
        name="password"
        defaultValue={visitor.password}
        required
        maxLength={100}
        type="text"
        className={`${inputClass} w-44`}
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

export default function VisitorsManager({ visitors }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">访问用户</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        这里维护可以进入博客的访客名单。只需填写用户名，初始密码自动生成（"我是优秀的" + 用户名）。
        后台始终显示初始用户名；昵称（首页欢迎语显示的名字）由你在这里设置。
      </p>

      {/* 添加访客 */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">添加访客</h2>
        <CreateVisitorForm />
      </div>

      {/* 访客列表 */}
      <div className="mt-6 space-y-3">
        {visitors.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            还没有任何访客，先在上面添加一个吧。
          </p>
        )}
        {visitors.map((visitor) => (
          <div
            key={visitor.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {editingId === visitor.id ? (
              <EditVisitorForm visitor={visitor} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {visitor.name}
                    {visitor.displayName && visitor.displayName !== visitor.name && (
                      <span className="ml-2 text-xs font-normal text-neutral-400">
                        首页显示：{visitor.displayName}
                      </span>
                    )}
                  </span>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">
                    密码：
                    <span className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {visitor.password}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    已改密码 {visitor.changeCount}/{MAX_CHANGE_COUNT} 次
                  </span>
                  <span className="text-xs text-neutral-400">
                    访问 {visitor._count?.views ?? 0} 次
                  </span>
                  <span className="text-xs text-neutral-400">{formatDateTime(visitor.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(visitor.id)}
                    className="text-sm text-neutral-700 underline dark:text-neutral-300"
                  >
                    编辑
                  </button>
                  <form
                    action={deleteVisitorAction.bind(null, visitor.id)}
                    onSubmit={(e) => {
                      if (
                        !window.confirm(
                          `确定要删除访客“${visitor.name}”吗？该访客将无法再登录。`,
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
