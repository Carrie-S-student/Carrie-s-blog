import FolderListPage from "@/app/components/FolderListPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "学习与思考",
};

export default function LearningPage() {
  return (
    <FolderListPage
      section="LEARNING"
      title="学习与思考"
      description="学到的知识、读过的书，以及一些零散的想法和总结，都记在这里。"
    />
  );
}
