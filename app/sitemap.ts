import type { MetadataRoute } from "next";
import { SITE_URL, STATIC_ROUTES, SERVICE_SLUGS } from "@/lib/seo";
import { LOCATION_ROUTES } from "@/lib/locationRoutes";
import { GUIDES } from "@/lib/guidesContent";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const servicePages: MetadataRoute.Sitemap = SERVICE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const locationPages: MetadataRoute.Sitemap = LOCATION_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guidePages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticPages, ...servicePages, ...locationPages, ...guidePages];
}
