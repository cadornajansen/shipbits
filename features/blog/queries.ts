import "server-only"

import path from "node:path"
import { cache } from "react"

import {
  findPublishedArticle,
  publishedArticles,
  readArticleFiles,
  type BlogArticle,
} from "@/features/blog/content"

let productionCatalog: Promise<BlogArticle[]> | undefined

const getArticleCatalog = cache(async (): Promise<BlogArticle[]> => {
  const directory = path.join(process.cwd(), "content", "blog")
  if (process.env.NODE_ENV !== "production") return readArticleFiles(directory)

  // Repository content is immutable for a deployment; a redeploy publishes edits.
  productionCatalog ??= readArticleFiles(directory)
  return productionCatalog
})

export const getPublishedArticles = cache(async (): Promise<BlogArticle[]> => {
  return publishedArticles(await getArticleCatalog())
})

export const getArticleBySlug = cache(async (slug: string): Promise<BlogArticle | null> => {
  return findPublishedArticle(await getArticleCatalog(), slug)
})

export async function getRelatedArticles(article: BlogArticle): Promise<BlogArticle[]> {
  const articles = await getPublishedArticles()
  return articles
    .filter((candidate) => candidate.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 2)
}
