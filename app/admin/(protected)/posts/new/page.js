import { notFound } from "next/navigation";
import PostForm from "@/app/components/PostForm";
import { createPostAction } from "@/app/actions/posts";
import { getAllTagsForAdmin } from "@/lib/tags";
import { getAllFoldersForAdmin } from "@/lib/folders";
import { SECTION_LABELS } from "@/lib/utils";

const SECTION_BY_KEY = {
  learning: "LEARNING",
  finance: "FINANCE",
};

export default async function NewPostPage({ searchParams }) {
  const query = await searchParams;
  const sectionKey = query?.section;
  const defaultSection = sectionKey ? SECTION_BY_KEY[sectionKey] : undefined;
  if (sectionKey && !defaultSection) {
    notFound();
  }

  const [tags, folders] = await Promise.all([
    getAllTagsForAdmin(defaultSection),
    getAllFoldersForAdmin(defaultSection),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        写新文章{defaultSection ? ` · ${SECTION_LABELS[defaultSection]}` : ""}
      </h1>
      <div className="mt-6">
        <PostForm
          action={createPostAction}
          availableTags={tags}
          availableFolders={folders}
          defaultSection={defaultSection}
        />
      </div>
    </div>
  );
}
