import { requireAdmin } from "@/lib/dal";
import { parseFile } from "@/lib/file-parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 上传+解析+图片上传最长 60 秒

/**
 * POST /api/admin/parse-file
 * 接收 FormData 中的 .md 或 .docx 文件，解析为 HTML 并返回。
 * Word 文档中的内嵌图片会自动上传到 Vercel Blob。
 */
export async function POST(request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json(
      { error: "未登录或登录已过期，请重新登录后台。" },
      { status: 401 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "请求格式错误，需要 multipart/form-data 格式。" },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "没有收到文件。" }, { status: 400 });
  }

  try {
    const result = await parseFile(file);

    return Response.json({
      success: true,
      html: result.html,
      title: result.title || "",
      format: result.format,
      imagesToUpload: result.imagesToUpload || [],
      imagesExtracted: result.imagesExtracted || 0,
      warnings: result.warnings?.map((w) => w.message) || [],
    });
  } catch (error) {
    console.error("文件解析失败:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "文件解析失败，请重试。" },
      { status: 400 }
    );
  }
}
