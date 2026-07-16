import { requireAdmin } from "@/lib/dal";

// 图片最大 5MB（base64 编码后约 6.7MB），视频不支持 base64 内嵌
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

/**
 * 后台图片上传接口。将图片文件转为 base64 Data URL 直接嵌入文章内容，
 * 不依赖任何外部存储服务（Vercel Blob / Cloudinary 等）。
 */
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "未登录或登录已过期，请重新登录后台。" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return Response.json({ error: "没有收到文件。" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "仅支持 JPG、PNG、GIF、WebP、SVG 图片格式。" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ error: "图片太大了，最多支持 5MB。" }, { status: 400 });
  }

  // 将图片转为 base64 Data URL
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  return Response.json({ url: dataUrl });
}
