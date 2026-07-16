"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitQuestion } from "@/app/actions/questions";

export default function AskForm() {
  const formRef = useRef(null);
  const [state, formAction, pending] = useActionState(submitQuestion, undefined);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-3">
      <input
        name="nickname"
        placeholder="昵称（可不填，默认匿名）"
        maxLength={30}
        className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent sm:w-64"
      />
      <textarea
        name="content"
        placeholder="想问点什么？"
        required
        maxLength={500}
        rows={4}
        className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600">
          提交成功！审核通过后会显示在下面的问答列表里。
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="interactive rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100"
      >
        {pending ? "提交中…" : "提交问题"}
      </button>
    </form>
  );
}


