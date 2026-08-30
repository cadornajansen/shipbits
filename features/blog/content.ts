import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"
import { z } from "zod"

export const articleSlugSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const articleDateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    }, "Use a valid calendar date.")
)

const articleFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    slug: articleSlugSchema,
    description: z.string().trim().min(1).max(240),
    publishedAt: articleDateSchema,
    updatedAt: articleDateSchema.optional(),
    author: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(60),
    cover: z
      .string()
      .refine((value) => {
        if (/^\/(?!\/)/.test(value)) return !value.includes("\\")
        try {
          const url = new URL(value)
          return url.protocol === "https:" && !url.username && !url.password
        } catch {
          return false
        }
      }, "Cover must be a local image path or an HTTPS URL.")
      .optional(),
    draft: z.boolean(),
  })
  .refine(
    (value) => !value.updatedAt || value.updatedAt >= value.publishedAt,
    { path: ["updatedAt"], message: "Updated date cannot precede publication." }
  )

export type ArticleHeading = {
  id: string
  text: string
  depth: 2 | 3
  line: number
}

export type BlogArticle = z.infer<typeof articleFrontmatterSchema> & {
  content: string
  headings: ArticleHeading[]
  readingMinutes: number
  wordCount: number
}

function plainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`~]/g, "")
    .trim()
}

export function getArticleHeadings(content: string): ArticleHeading[] {
  const headings: ArticleHeading[] = []
  const usedIds = new Set<string>()
  let fence: { marker: string; length: number } | null = null

  content.split(/\r?\n/).forEach((line, index) => {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (!fence) fence = { marker, length: fenceMatch[1].length }
      else if (marker === fence.marker && fenceMatch[1].length >= fence.length) {
        fence = null
      }
      return
    }
    if (fence) return

    const match = line.match(/^ {0,3}(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (!match) return

    const text = plainText(match[2])
    const base =
      text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "") || "section"
    let id = base
    let suffix = 2
    while (usedIds.has(id)) id = `${base}-${suffix++}`
    usedIds.add(id)

    headings.push({ id, text, depth: match[1].length as 2 | 3, line: index + 1 })
  })

  return headings
}

export function parseArticle(source: string, filename: string): BlogArticle {
  const { data, content } = matter(source)
  const result = articleFrontmatterSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Invalid blog frontmatter in ${filename}: ${result.error.message}`)
  }
  if (!content.trim()) throw new Error(`Blog article ${filename} has no content.`)

  const wordCount = plainText(content).split(/\s+/).filter(Boolean).length
  return {
    ...result.data,
    content,
    headings: getArticleHeadings(content),
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 200)),
  }
}

export async function readArticleFiles(directory: string): Promise<BlogArticle[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const articles = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
      .map(async (entry) => {
        // File paths come only from directory entries, never from route parameters.
        const source = await readFile(path.join(directory, entry.name), "utf8")
        return parseArticle(source, entry.name)
      })
  )
  const slugs = new Set<string>()
  for (const article of articles) {
    if (slugs.has(article.slug)) throw new Error(`Duplicate blog slug: ${article.slug}`)
    slugs.add(article.slug)
  }
  return articles
}

export function publishedArticles(
  articles: readonly BlogArticle[],
  now: Date = new Date()
): BlogArticle[] {
  return articles
    .filter((article) => !article.draft && Date.parse(article.publishedAt) <= now.getTime())
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug))
}

export function findPublishedArticle(
  articles: readonly BlogArticle[],
  slug: string,
  now: Date = new Date()
): BlogArticle | null {
  if (!articleSlugSchema.safeParse(slug).success) return null
  return publishedArticles(articles, now).find((article) => article.slug === slug) ?? null
}

export function formatArticleDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`))
}
