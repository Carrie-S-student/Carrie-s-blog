import FolderListPage from "@/app/components/FolderListPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "财经专栏",
};

export default function FinancePage() {
  return (
    <FolderListPage
      section="FINANCE"
      title="财经专栏"
      description="关注财经动态、投资理财相关的观点与记录。"
    />
  );
}
