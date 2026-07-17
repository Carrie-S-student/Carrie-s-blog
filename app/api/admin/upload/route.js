import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/dal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB（Vercel Blob 免费版上限）

/**
 * 后台文件上传接口。使用 Vercel Blob 存储，支持图片和视频。
 * 前端通过 FormData 直接发送文件，后端上传到 Blob 后返回公开 URL。
 */
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "未登录或登录已过期，请重新登录后台。" }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "请求格式错误，需要 multipart/form-data 格式。" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "没有收到文件。" }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: "文件内容为空。" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "文件太大了，最大支持 100MB。" }, { status: 400 });
  }

  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: `不支持的文件格式：${file.type}，支持图片（png/jpeg/gif/webp/svg）和视频（mp4/webm/ogg/mov）。` },
      { status: 400 },
    );
  }

  try {
    // 上传到 Vercel Blob，自动生成唯一文件名，设置公开访问
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return Response.json({ error: "上传到云存储失败，请重试。" }, { status: 500 });
  }
}
