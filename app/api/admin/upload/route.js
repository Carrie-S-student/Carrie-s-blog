import { requireAdmin } from "@/lib/dal";

const MAX_BASE64_LENGTH = 5 * 1024 * 1024; // base64 字符串不超过 ~5MB（解码后约 3.7MB）
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

/**
 * 后台图片上传接口。采用 base64 内嵌方案：前端用 FileReader 把图片文件
 * 转成 data:image/xxx;base64,... 格式，通过 JSON POST 到这里校验后，
 * 返回同样的 data URL。这个 URL 可以直接嵌入文章 HTML 或站点设置字段，
 * 不需要任何云存储服务，适用于 Netlify 等平台。
 *
 * 缺点：base64 编码会使数据膨胀约 33%，图片直接存在数据库的文章正文里，
 * 会增加数据库体积。建议只上传小尺寸配图（几百 KB 以内）。
 */
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "未登录或登录已过期，请重新登录后台。" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求格式错误，需要 JSON 格式。" }, { status: 400 });
  }

  const dataUrl = body.data;

  if (!dataUrl || typeof dataUrl !== "string") {
    return Response.json({ error: "没有收到图片数据。" }, { status: 400 });
  }

  // 校验 data URL 格式：data:image/xxx;base64,...
  const match = dataUrl.match(/^data:(image\/[\w+-]+);base64,(.+)$/);
  if (!match) {
    return Response.json({ error: "图片数据格式不正确，需要 base64 编码的 data URL。" }, { status: 400 });
  }

  const mimeType = match[1];
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return Response.json(
      { error: `不支持的图片格式：${mimeType}，支持 png / jpeg / gif / webp / svg。` },
      { status: 400 },
    );
  }

  if (dataUrl.length > MAX_BASE64_LENGTH) {
    return Response.json({ error: "图片太大了，请压缩后再上传（建议 2MB 以内）。" }, { status: 400 });
  }

  // base64 方案：直接把 data URL 原样返回，前端插入到 HTML 中即可
  return Response.json({ url: dataUrl });
}
