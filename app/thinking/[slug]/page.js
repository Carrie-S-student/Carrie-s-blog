import PostDetailPage, { generatePostMetadata } from "@/app/components/PostDetailPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    return generatePostMetadata({ slug: decodeURIComponent(slug) });
  } catch {
    return { title: "文章" };
  }
}

export default async function ThinkingPostPage({ params }) {
  const { slug } = await params;
  return <PostDetailPage section="THINKING" basePath="/thinking" slug={decodeURIComponent(slug)} />;
}
