import SectionListPage from "@/app/components/SectionListPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "全部文章 · 学习与思考",
};

export default async function LearningAllPage({ searchParams }) {
  const params = await searchParams;
  return (
    <SectionListPage
      section="LEARNING"
      title="学习与思考"
      description="学到的知识、读过的书，以及一些零散的想法和总结，都记在这里。"
      tagSlug={params?.tag || undefined}
    />
  );
}
