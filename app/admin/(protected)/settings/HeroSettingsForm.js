"use client";

import { useState, useActionState } from "react";
import { updateAdminSettingsAction } from "@/app/actions/settings";

function ImageUploader({ label, currentUrl, previewLabel, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      // 直接用 FormData 上传文件到 Vercel Blob
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

      onChange(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {label}
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      {uploading && <p className="mt-2 text-sm text-muted">上传中，请稍候…</p>}
      {currentUrl && (
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {previewLabel}：{currentUrl}
        </p>
      )}
    </div>
  );
}

export default function HeroSettingsForm({ settings }) {
  const [heroImage, setHeroImage] = useState(settings?.heroImage || "");
  const [heroTitle, setHeroTitle] = useState(settings?.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.heroSubtitle || "");
  const [aboutTitle, setAboutTitle] = useState(settings?.aboutTitle || "");
  const [aboutParagraph1, setAboutParagraph1] = useState(settings?.aboutParagraph1 || "");
  const [aboutParagraph2, setAboutParagraph2] = useState(settings?.aboutParagraph2 || "");
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState(settings?.aboutPhotoUrl || "");
  const [state, formAction, pending] = useActionState(updateAdminSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {/* ==================== 首页设置 ==================== */}
      <fieldset className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          首页设置
        </legend>

        <div className="space-y-5">
          <ImageUploader
            label="上传首页背景图"
            currentUrl={heroImage}
            previewLabel="当前首页背景图"
            onChange={setHeroImage}
          />

          {/* 隐藏域：把 URL 随表单一起提交 */}
          <input type="hidden" name="heroImage" value={heroImage} />

          <div>
            <label htmlFor="heroTitle" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              首页大标题
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              value={heroTitle}
              onChange={(event) => setHeroTitle(event.target.value)}
              placeholder="例如 Welcome to my blog"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label htmlFor="heroSubtitle" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              首页副标题
            </label>
            <textarea
              id="heroSubtitle"
              name="heroSubtitle"
              value={heroSubtitle}
              onChange={(event) => setHeroSubtitle(event.target.value)}
              placeholder="例如 记录学习与思考，欢迎评论交流。"
              rows={3}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </fieldset>

      {/* ==================== 关于我设置 ==================== */}
      <fieldset className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          关于我页面
        </legend>

        <div className="space-y-5">
          <ImageUploader
            label="上传关于我照片"
            currentUrl={aboutPhotoUrl}
            previewLabel="当前照片"
            onChange={setAboutPhotoUrl}
          />

          {/* 隐藏域：把 aboutPhotoUrl 随表单一起提交 */}
          <input type="hidden" name="aboutPhotoUrl" value={aboutPhotoUrl} />

          <div>
            <label htmlFor="aboutTitle" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              关于我标题
            </label>
            <input
              id="aboutTitle"
              name="aboutTitle"
              value={aboutTitle}
              onChange={(event) => setAboutTitle(event.target.value)}
              placeholder="例如 关于我"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label htmlFor="aboutParagraph1" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              关于我第一段
            </label>
            <textarea
              id="aboutParagraph1"
              name="aboutParagraph1"
              value={aboutParagraph1}
              onChange={(event) => setAboutParagraph1(event.target.value)}
              placeholder="第一段介绍文字"
              rows={4}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label htmlFor="aboutParagraph2" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              关于我第二段
            </label>
            <textarea
              id="aboutParagraph2"
              name="aboutParagraph2"
              value={aboutParagraph2}
              onChange={(event) => setAboutParagraph2(event.target.value)}
              placeholder="第二段介绍文字"
              rows={4}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存设置"}
      </button>

      {state?.success && <p className="text-sm text-green-600">保存成功！</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
