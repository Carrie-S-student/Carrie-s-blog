import PostDetailPage, { generatePostMetadata } from "@/app/components/PostDetailPage";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return generatePostMetadata({ slug: decodeURIComponent(slug) });
}

export default async function ThinkingPostPage({ params }) {
  const { slug } = await params;
  return <PostDetailPage section="THINKING" basePath="/thinking" slug={decodeURIComponent(slug)} />;
}
