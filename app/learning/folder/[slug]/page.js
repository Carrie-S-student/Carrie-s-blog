import { notFound } from "next/navigation";
import SectionListPage from "@/app/components/SectionListPage";
import { getFolderBySlug } from "@/lib/folders";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const folder = await getFolderBySlug("LEARNING", decodeURIComponent(slug));
  return {
    title: folder ? `${folder.name} · 学习与思考` : "文件夹",
  };
}

export default async function LearningFolderPage({ params, searchParams }) {
  const { slug } = await params;
  const folderSlug = decodeURIComponent(slug);
  const [folder, query] = await Promise.all([getFolderBySlug("LEARNING", folderSlug), searchParams]);

  if (!folder) {
    notFound();
  }

  return (
    <SectionListPage
      section="LEARNING"
      title="学习与思考"
      description="学到的知识、读过的书，以及一些零散的想法和总结，都记在这里。"
      folderSlug={folderSlug}
      tagSlug={query?.tag || undefined}
    />
  );
}
