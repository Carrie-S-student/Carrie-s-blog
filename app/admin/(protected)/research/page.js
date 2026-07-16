import { getAllResearchForAdmin } from "@/lib/research";
import ResearchManager from "@/app/components/ResearchManager";

export const metadata = {
  title: "Research 管理",
};

export default async function AdminResearchPage() {
  const records = await getAllResearchForAdmin();

  return <ResearchManager records={records} />;
}
