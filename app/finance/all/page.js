import SectionListPage from "@/app/components/SectionListPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "全部文章 · 财经专栏",
};

export default async function FinanceAllPage({ searchParams }) {
  const params = await searchParams;
  return (
    <SectionListPage
      section="FINANCE"
      title="财经专栏"
      description="关注财经动态、投资理财相关的观点与记录。"
      tagSlug={params?.tag || undefined}
    />
  );
}
