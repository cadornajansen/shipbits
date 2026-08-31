import { getPublishedArticles } from "@/features/blog/queries"
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const articles = await getPublishedArticles()
  const items = articles
    .map((article) => {
      const url = absoluteUrl(`/blog/${article.slug}`)
      return `<item><title>${xml(article.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><description>${xml(article.description)}</description><pubDate>${new Date(`${article.publishedAt}T00:00:00.000Z`).toUTCString()}</pubDate></item>`
    })
    .join("")

  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(`${SITE_NAME} Blog`)}</title><link>${xml(absoluteUrl("/blog"))}</link><description>${xml(SITE_DESCRIPTION)}</description><language>en</language>${items}</channel></rss>`

  return new Response(body, {
    headers: {
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}
