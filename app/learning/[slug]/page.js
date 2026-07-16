import PostDetailPage, { generatePostMetadata } from "@/app/components/PostDetailPage";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return generatePostMetadata({ slug: decodeURIComponent(slug) });
}

export default async function LearningPostPage({ params }) {
  const { slug } = await params;
  return <PostDetailPage section="LEARNING" basePath="/learning" slug={decodeURIComponent(slug)} />;
}
