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

// ==================== Obsidian Callout 后处理 ====================

const CALLOUT_ICONS = {
  note: "📝",
  warning: "⚠️",
  danger: "🔥",
  info: "ℹ️",
  tip: "💡",
  success: "✅",
  question: "❓",
  bug: "🐛",
  quote: "💬",
  example: "📌",
  todo: "📋",
  abstract: "📄",
  failure: "❌",
};

const CALLOUT_LABELS = {
  note: "笔记",
  warning: "警告",
  danger: "危险",
  info: "信息",
  tip: "提示",
  success: "完成",
  question: "问题",
  bug: "缺陷",
  quote: "引用",
  example: "示例",
  todo: "待办",
  abstract: "摘要",
  failure: "失败",
};

/**
 * 将 marked 输出的 <blockquote> 中符合 Obsidian Callout 格式
 * （以 `[!TYPE]` 开头）的块替换为带样式的 callout。
 *
 * marked 将 > [!note] Title\n> Content 解析为：
 * <blockquote><p>[!note] Title</p><p>Content</p></blockquote>
 *
 * 转换后：
 * <blockquote class="callout callout--note"><p class="callout__title">📝 笔记 — Title</p><p>Content</p></blockquote>
 */
function postprocessCallouts(html) {
  const calloutTypes = Object.keys(CALLOUT_ICONS).join("|");
  const re = new RegExp(
    `<blockquote>\\s*<p>\\[!(${calloutTypes})\\]\\s*(.*?)<\\/p>\\n?([\\s\\S]*?)<\\/blockquote>`,
    "gi"
  );

  return html.replace(re, (_full, type, title, body) => {
    const t = type.toLowerCase();
    const icon = CALLOUT_ICONS[t] || "";
    const label = CALLOUT_LABELS[t] || t;
    const heading = title
      ? `${icon} ${label} — ${title}`
      : `${icon} ${label}`;

    return [
      `<blockquote class="callout callout--${t}">`,
      `<p class="callout__title">${heading}</p>`,
      body,
      `</blockquote>`,
    ].join("\n");
  });
}

// ==================== 高亮预处理（==text== → <mark>text</mark>）====================

/**
 * 用占位符保护代码区域，避免把代码内的 == 误替换为高亮。
 * 原理：
 *   1. 提取所有围栏代码块（```...```）和缩进代码块 → 替换为占位符
 *   2. 提取所有行内代码（`...`）→ 替换为占位符
 *   3. 在保护后的文本中安全替换 ==text== → <mark>text</mark>
 *   4. 恢复占位符 → 原始代码内容
 */
function preprocessHighlight(md) {
  const placeholders = [];

  // ---- 1. 保护围栏代码块（```lang\n...\n```）和缩进代码块 ----
  // 围栏代码块
  let result = md.replace(/(```[\s\S]*?```)/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\x00CODEBLOCK_${idx}\x00`;
  });

  // 缩进代码块（行首至少 4 个空格/1 个 tab 的连续行，前后有空行）
  result = result.replace(
    /(^|\n\n)( {4,}|\t)([^\n]+(?:\n(?: {4,}|\t)[^\n]+)*)/g,
    (match) => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00CODEINDENT_${idx}\x00`;
    }
  );

  // ---- 2. 保护行内代码 ----
  // 匹配单反引号（允许内部包含双反引号 `foo``bar` → 整个捕获）
  result = result.replace(/(`+)([^`]+?)\1/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\x00INLINECODE_${idx}\x00`;
  });

  // ---- 3. 安全替换 ==text== → <mark>text</mark> ----
  // 确保 == 前后不是等号（排除 === 或 ==== 这类分割线标记）
  result = result.replace(
    /(?<!=)==(?!=)([\s\S]+?)(?<!=)==(?!=)/g,
    (_m, text) => `<mark>${text}</mark>`
  );

  // ---- 4. 恢复占位符 ----
  result = result.replace(/\x00CODEBLOCK_(\d+)\x00/g, (_m, idx) => placeholders[+idx]);
  result = result.replace(/\x00CODEINDENT_(\d+)\x00/g, (_m, idx) => placeholders[+idx]);
  result = result.replace(/\x00INLINECODE_(\d+)\x00/g, (_m, idx) => placeholders[+idx]);

  return result;
}

// ==================== Markdown 解析 ====================

/**
 * 预处理 Obsidian 特有语法（非标准 Markdown，marked 无法直接处理）：
 * 1. 维基链接 [[Page]] → [Page](Page)
 * 2. 别名 [[Page|Text]] → [Text](Page)
 * 3. 图片嵌入 ![[image.png]] → ![image.png](image.png)
 * 4. 带尺寸图片 ![[image.png|300]] → ![image.png](image.png)
 * 5. Obsidian 注释 %%text%% → 移除（包括跨行注释）
 * 6. Obsidian 标签 #tag → 保留原样（marked 会当作文本）
 *
 * 注意：==text== 高亮由 preprocessHighlight() 在标记后处理，此处不重复。
 * 注意：~~text~~ 删除线已由 marked GFM 自动处理。
 * 注意：- [ ] 任务列表 / 表格 / 脚注 已由 marked GFM 自动处理。
 *
 * 图片引用会被标记，前端提示用户手动上传。
 */
function preprocessObsidianMarkdown(md) {
  let result = md;

  // ---- 1. Obsidian 注释 %%...%%（支持跨行）先于其他步骤处理 ----
  result = result.replace(/%%.*?%%/gs, "");

  // ---- 2. Obsidian 图片嵌入 ![[image.png]] 或 ![[image.png|300]] ----
  result = result.replace(/!\[\[([^\]]+?)\]\]/g, (_match, ref) => {
    const parts = ref.split("|");
    const filename = parts[0].trim();
    return `![${filename}](${filename})`;
  });

  // ---- 3. 维基链接 [[Page]] 或 [[Page|Text]] ----
  result = result.replace(/\[\[([^\]]+?)\]\]/g, (_match, ref) => {
    const parts = ref.split("|");
    // 处理 [[Page#heading|Text]] 带锚点的链接
    const linkPart = parts[0].trim();
    const display = parts.length > 1 ? parts[1].trim() : linkPart;

    // 如果有 # 片段，保留为 URL hash
    const hashIdx = linkPart.indexOf("#");
    const page = hashIdx >= 0 ? linkPart.substring(0, hashIdx) : linkPart;
    const hash = hashIdx >= 0 ? linkPart.substring(hashIdx) : "";

    return `[${display}](${page}${hash})`;
  });

  // ---- 4. 处理可能遗留的 HTML 编码或非标准转义 ----
  // （预留扩展点）

  return result;
}

/**
 * 收集 HTML 中所有以文件名引用的图片 URL（本地相对路径或纯文件名），
 * 返回这些引用的列表，供前端展示"需手动上传的图片"。
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
 * - 预处理 Obsidian 语法（链接、图片、注释）
 * - 预处理高亮 ==text== → <mark>（占位符保护代码块）
 * - marked GFM 自动处理 表格 / 任务列表 / 删除线
 * - 后处理 Callout 块
 * - 收集需手动上传的本地图片引用
 *
 * 返回 { html, imagesToUpload }
 */
export async function parseMarkdownToHtml(content) {
  // 预处理 Obsidian 特有语法
  let processed = preprocessObsidianMarkdown(content);

  // 预处理高亮（==text== → <mark>），在 marked 之前完成，
  // 采用占位符保护避免代码块/行内代码被误替换
  processed = preprocessHighlight(processed);

  // marked 解析：GFM 表格 + 任务列表 + 删除线
  const rawHtml = await marked.parse(processed, {
    gfm: true,
    breaks: false,
  });

  // 后处理：Obsidian Callout
  const html = postprocessCallouts(rawHtml);

  // 收集需要手动上传的本地图片引用
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
