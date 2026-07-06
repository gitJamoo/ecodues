import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/methodology", priority: 0.8 },
    { path: "/how-donations-work", priority: 0.8 },
    { path: "/login", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];
  return pages.map(({ path, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
