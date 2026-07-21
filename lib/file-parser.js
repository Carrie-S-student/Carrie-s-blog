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

// ==================== Markdown 解析 ====================

/**
 * 注册 marked 扩展，通过自定义 inline token 处理 Obsidian 高亮语法 ==text==。
 * 对比纯正则预处理，扩展不会被错误地触发热内代码块和行内代码中。
 */
const highlightExtension = {
  name: "ob-highlight",
  level: "inline",
  start(src) {
    return src.indexOf("==");
  },
  tokenizer(src) {
    const rule = /^==([\s\S]+?)==/;
    const match = rule.exec(src);
    if (match) {
      // 排除 HTML 实体开始或已转换的 <mark>，避免重复处理
      const raw = match[0];
      if (raw.startsWith("&lt;mark&gt;")) return undefined;
      return { type: "obHighlight", raw, text: match[1] };
    }
    return undefined;
  },
  renderer(token) {
    // 对内部文字递归解析行内 Markdown（支持 **加粗** 等嵌套格式）
    const inner = marked.parseInline(token.text).trim();
    return `<mark>${inner}</mark>`;
  },
};

// 注册扩展（全局单例，在 marked.parse 之前调用一次）
let extensionsRegistered = false;
function ensureExtensionsRegistered() {
  if (extensionsRegistered) return;
  marked.use({ extensions: [highlightExtension] });
  extensionsRegistered = true;
}

/**
 * 预处理 Obsidian 特有语法（非标准 Markdown，marked 无法直接处理）：
 * 1. 维基链接 [[Page]] → [Page](Page)
 * 2. 别名 [[Page|Text]] → [Text](Page)
 * 3. 图片嵌入 ![[image.png]] → ![image.png](image.png)
 * 4. 带尺寸图片 ![[image.png|300]] → ![image.png](image.png)
 * 5. Obsidian 注释 %%text%% → 移除（包括跨行注释）
 * 6. Obsidian 标签 #tag → 保留原样（marked 会当作文本）
 *
 * 注意：==text== 高亮已通过 marked extension 处理，此处不重复。
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
 * - marked 扩展处理 ==高亮==
 * - marked GFM 自动处理 表格 / 任务列表 / 删除线
 * - 后处理 Callout 块
 * - 收集需手动上传的本地图片引用
 *
 * 返回 { html, imagesToUpload }
 */
export async function parseMarkdownToHtml(content) {
  // 注册 marked 扩展（高亮 ==text==）
  ensureExtensionsRegistered();

  // 预处理 Obsidian 特有语法
  const processed = preprocessObsidianMarkdown(content);

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
