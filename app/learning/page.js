import SectionListPage from "@/app/components/SectionListPage";

export const metadata = {
  title: "学习与输入",
};

export default async function LearningPage({ searchParams }) {
  const params = await searchParams;
  return (
    <SectionListPage
      section="LEARNING"
      title="学习与输入"
      description="学到的知识、读过的书、上过的课，都记在这里。"
      tagSlug={params?.tag || undefined}
    />
  );
}
