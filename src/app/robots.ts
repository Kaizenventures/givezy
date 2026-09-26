import type { MetadataRoute } from "next";
import { isProduction, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Staging serves the same pages on a different domain. Without this it would
  // compete with the real site in search results.
  if (!isProduction()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
