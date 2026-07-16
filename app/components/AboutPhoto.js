import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * 关于我页面左侧照片区域。
 * 优先使用后端设置的 aboutPhotoUrl，其次检查 public/about.jpg 本地文件，
 * 都没有则显示占位提示。
 */
export default function AboutPhoto({ aboutPhotoUrl }) {
  const hasLocalPhoto = (() => {
    try {
      return fs.existsSync(path.join(process.cwd(), "public", "about.jpg"));
    } catch {
      return false;
    }
  })();

  const photoSrc = aboutPhotoUrl || (hasLocalPhoto ? "/about.jpg" : null);

  return (
    <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl border border-card-border bg-card">
      {photoSrc ? (
        <Image
          src={photoSrc}
          alt="站长照片"
          fill
          sizes="192px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-muted">
          提示：把你的照片放到 public/about.jpg，或去后台站点设置中上传。
        </div>
      )}
    </div>
  );
}
