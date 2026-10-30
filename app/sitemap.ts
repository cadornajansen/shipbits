import type { MetadataRoute } from "next"
import { catalog } from "@/lib/catalog"
import { informationPages } from "@/lib/information-pages"
import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set([
    "/",
    "/how-to-use",
    "/studio",
    ...catalog.flatMap((entry) => [
      entry.href,
      ...(entry.studio ? [entry.studio] : []),
    ]),
    ...informationPages.map((page) => `/${page.slug}`),
  ])
  return [...paths].map((path) => ({ url: `${site.url}${path}` }))
}
