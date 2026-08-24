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

export default async function FinancePostPage({ params }) {
  const { slug } = await params;
  return <PostDetailPage section="FINANCE" basePath="/finance" slug={decodeURIComponent(slug)} />;
}
