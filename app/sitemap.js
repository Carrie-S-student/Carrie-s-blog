import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.vercel.app";

export default async function sitemap() {
  // 静态页面
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/learning`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/thinking`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/research`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/ask`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
  ];

  // 动态：已发布文章
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, section: true, updatedAt: true },
  });

  const postPages = posts.map((post) => ({
    url: `${BASE_URL}/${post.section === "LEARNING" ? "learning" : "thinking"}/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...postPages];
}
