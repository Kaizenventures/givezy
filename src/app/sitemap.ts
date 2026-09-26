import { siteUrl } from "@/lib/env";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/donate`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
