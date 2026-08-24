import { notFound } from "next/navigation";
import SectionListPage from "@/app/components/SectionListPage";
import { getFolderBySlug } from "@/lib/folders";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const folder = await getFolderBySlug("FINANCE", decodeURIComponent(slug));
  return {
    title: folder ? `${folder.name} · 财经专栏` : "文件夹",
  };
}

export default async function FinanceFolderPage({ params, searchParams }) {
  const { slug } = await params;
  const folderSlug = decodeURIComponent(slug);
  const [folder, query] = await Promise.all([getFolderBySlug("FINANCE", folderSlug), searchParams]);

  if (!folder) {
    notFound();
  }

  return (
    <SectionListPage
      section="FINANCE"
      title="财经专栏"
      description="关注财经动态、投资理财相关的观点与记录。"
      folderSlug={folderSlug}
      tagSlug={query?.tag || undefined}
    />
  );
}
