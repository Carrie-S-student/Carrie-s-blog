import { getAllTagsForAdmin } from "@/lib/tags";
import TagsManager from "./TagsManager";

export default async function AdminTagsPage() {
  const tags = await getAllTagsForAdmin();

  return <TagsManager tags={tags} />;
}
