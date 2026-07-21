import "server-only";
import mammoth from "mammoth";
import { marked } from "marked";
import { put } from "@vercel/blob";

// ==================== 公共工具 ====================

const ALLOWED_MIME = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/markdown": "md",
  "text/x-markdown": "md",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 将 File 对象转为 Buffer
 */
async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 将图片 Buffer 上传到 Vercel Blob，返回公开 URL。
 * 失败时返回 null（不中断整个文档解析）。
 */
async function uploadImageBuffer(buffer, filename) {
  try {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    console.error("Blob upload failed for image:", filename, err);
    return null;
  }
}

// ==================== Markdown 解析 ====================

/**
 * 预处理 Obsidian 语法：
 * 1. 维基链接 [[Page]] → [Page](#)
 * 2. 别名 [[Page|Text]] → [Text](#)
 * 3. 图片嵌入 ![[image.png]] → ![image.png](image.png)
 * 4. 带大小的图片 ![[image.png|300]] → ![image.png](image.png)
 *
 * 图片引用会被标记，前端提示用户手动上传。
 */
function preprocessObsidianMarkdown(md) {
  let result = md;

  // Obsidian 图片嵌入 ![[image.png]] 或 ![[image.png|300]]
  result = result.replace(
    /!\[\[([^\]]+?)\]\]/g,
    (_match, ref) => {
      const parts = ref.split("|");
      const filename = parts[0].trim();
      return `![${filename}](${filename})`;
    }
  );

  // 维基链接 [[Page]] 或 [[Page|Text]]
  result = result.replace(
    /\[\[([^\]]+?)\]\]/g,
    (_match, ref) => {
      const parts = ref.split("|");
      const page = parts[0].trim();
      const text = parts.length > 1 ? parts[1].trim() : page;
      return `[${text}](${page})`;
    }
  );

  return result;
}

/**
 * 收集 HTML 中所有以文件名引用的图片 URL（本地相对路径或纯文件名），
 * 返回这些引用的列表，供前端展示“需手动上传的图片”。
 */
function collectLocalImageRefs(html) {
  const refs = [];
  const regex = /<img[^>]+src="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    // 判断是否为本地引用（非 http/https/data:）
    if (!/^(https?:|data:|\/\/)/.test(src)) {
      refs.push(src);
    }
  }
  return refs;
}

/**
 * 解析 Markdown 为 HTML：
 * - 预处理 Obsidian 语法
 * - 用 marked 转换
 * - 代码高亮（可选）
 * - 返回 { html, imagesToUpload }
 */
export async function parseMarkdownToHtml(content) {
  const processed = preprocessObsidianMarkdown(content);

  // 配置 marked：安全的输出，支持 GFM 表格和任务列表
  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  const html = await marked.parse(processed);
  const imagesToUpload = collectLocalImageRefs(html);

  return { html, imagesToUpload };
}

// ==================== Word 文档解析 ====================

/**
 * 解析 Word (.docx) 文件为 HTML。
 * 内嵌图片自动上传到 Vercel Blob，替换为公开 URL。
 * 返回 { html, title, imagesExtracted }
 */
export async function parseDocxToHtml(file) {
  const buffer = await fileToBuffer(file);

  let imageCount = 0;
  const imageMap = new Map(); // contentType + index → blobUrl

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      // 自定义图片处理：提取后上传到 Vercel Blob
      convertImage: async (image) => {
        try {
          const contentType = image.contentType || "image/png";
          const ext = contentType.split("/")[1] || "png";
          const filename = `docx-image-${imageCount}.${ext}`;

          const imgBuffer = await image.read();
          const url = await uploadImageBuffer(imgBuffer, filename);

          if (url) {
            imageMap.set(`${contentType}-${imageCount}`, url);
            imageCount++;
            return { src: url };
          }
        } catch (err) {
          console.error("docx image extraction failed:", err);
        }
        // 返回空 src 作为兜底
        return { src: "" };
      },
    }
  );

  // 从 HTML 中尝试提取标题（第一个 h1/h2）
  const titleMatch = result.value.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

  return {
    html: result.value,
    title,
    imagesExtracted: imageCount,
    warnings: result.messages,
  };
}

// ==================== 统一入口 ====================

/**
 * 根据 MIME 类型和 Buffer 选择解析器，返回 { html, title?, imagesToUpload?, imagesExtracted?, warnings? }
 */
export async function parseFile(file) {
  const mime = file.type;
  const format = ALLOWED_MIME[mime];

  if (!format) {
    throw new Error(`不支持的文件格式：${mime || "未知"}。请上传 .md 或 .docx 文件。`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件太大了，最大支持 50MB。");
  }

  if (file.size === 0) {
    throw new Error("文件内容为空。");
  }

  if (format === "md") {
    const text = await file.text();
    return {
      ...(await parseMarkdownToHtml(text)),
      format: "md",
    };
  }

  if (format === "docx") {
    return {
      ...(await parseDocxToHtml(file)),
      format: "docx",
    };
  }
}
