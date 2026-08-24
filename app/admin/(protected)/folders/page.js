import FoldersManager from "@/app/admin/(protected)/folders/FoldersManager";
import { getAllFoldersForAdmin } from "@/lib/folders";

export const metadata = {
  title: "文件夹管理",
};

export default async function FoldersPage() {
  const folders = await getAllFoldersForAdmin();

  return <FoldersManager folders={folders} />;
}
