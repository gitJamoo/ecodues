import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Social crawlers (X, LinkedIn, Slack) respect robots.txt when
        // fetching card images — /api/share-card must stay allowed.
        allow: ["/", "/api/share-card"],
        disallow: [
          "/api/",
          "/dashboard",
          "/providers",
          "/donations",
          "/settings",
          "/onboarding",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
