import SectionListPage from "@/app/components/SectionListPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "思考与输出",
};

export default async function ThinkingPage({ searchParams }) {
  const params = await searchParams;
  return (
    <SectionListPage
      section="THINKING"
      title="思考与输出"
      description="一些零散的想法、观点和总结。"
      tagSlug={params?.tag || undefined}
    />
  );
}
