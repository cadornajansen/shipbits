import type { MetadataRoute } from "next"

import { getPublishedArticles } from "@/features/blog/queries"
import { getPublicCategories, getPublicProductIndex } from "@/features/products/public-queries"
import { absoluteUrl } from "@/lib/site"

export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, articles] = await Promise.all([
    getPublicProductIndex(),
    getPublicCategories(),
    getPublishedArticles(),
  ])
  const staticRoutes: MetadataRoute.Sitemap = [
    ["/", 1, "daily"],
    ["/products", 0.9, "daily"],
    ["/directory-submission", 0.9, "monthly"],
    ["/blog", 0.8, "weekly"],
    ["/resources", 0.7, "monthly"],
    ["/resources/seo-checker", 0.7, "monthly"],
    ["/privacy", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
    ["/refund-policy", 0.3, "yearly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: absoluteUrl(path as string),
    priority: priority as number,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
  }))

  return [
    ...staticRoutes,
    ...products.map((product) => ({ url: absoluteUrl(`/products/${product.slug}`), lastModified: product.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...categories.filter((category) => category.productCount > 0).map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), lastModified: category.updatedAt ?? undefined, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...articles.map((article) => ({ url: absoluteUrl(`/blog/${article.slug}`), lastModified: article.updatedAt ?? article.publishedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ]
}
