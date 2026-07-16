import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/dal";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB，够用来放文章配图和短视频
const ALLOWED_PREFIXES = ["image/", "video/"];

/**
 * 后台专用的图片/视频上传接口。用 Route Handler 而不是 Server Action，
 * 是因为 Server Action 默认限制请求体只有 1MB，放不下图片视频。
 *
 * 前端（Tiptap 编辑器工具栏）选好文件后，用 FormData 把文件 POST 到这里，
 * 上传成功后返回 { url }，前端再把这个 url 插入到文章内容里。
 */
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "未登录或登录已过期，请重新登录后台。" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "还没有配置 BLOB_READ_WRITE_TOKEN，暂时无法上传文件，请先在 .env 中配置 Vercel Blob。" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return Response.json({ error: "没有收到文件。" }, { status: 400 });
  }

  const isAllowedType = ALLOWED_PREFIXES.some((prefix) => file.type.startsWith(prefix));
  if (!isAllowedType) {
    return Response.json({ error: "只能上传图片或视频文件。" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ error: "文件太大了，最多支持 20MB。" }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return Response.json({ url: blob.url });
}
