import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots() {
  const BASE_URL = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
