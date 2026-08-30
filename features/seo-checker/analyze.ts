import "server-only"

import { SafeFetchError, safeFetchText, type SafeTextResponse } from "@/lib/security/safe-fetch"
import { scoreSeoPage, type FileProbe, type SeoCheckerResult } from "@/features/seo-checker/scoring"

function isSuccess(response: SafeTextResponse): boolean {
  return response.status >= 200 && response.status < 300
}

function robotsBlocksAll(body: string): boolean {
  let globalAgent = false
  return body.split(/\r?\n/).some((line) => {
    const directive = line.replace(/#.*$/, "").trim()
    const userAgent = /^user-agent:\s*(.+)$/i.exec(directive)
    if (userAgent) globalAgent = userAgent[1].trim() === "*"
    return globalAgent && /^disallow:\s*\/$/i.test(directive)
  })
}

async function probeRobots(origin: string): Promise<{ state: FileProbe; body: string }> {
  try {
    const response = await safeFetchText(`${origin}/robots.txt`, { maxBytes: 64_000, timeoutMs: 4_000, maxRedirects: 1, sameOrigin: origin })
    if (response.status === 404) return { state: "missing", body: "" }
    const recognizable = !/<(?:html|!doctype)/i.test(response.body) && /^(?:user-agent|sitemap):/im.test(response.body)
    return { state: isSuccess(response) && recognizable ? "found" : "unavailable", body: recognizable ? response.body : "" }
  } catch {
    return { state: "unavailable", body: "" }
  }
}

function getSitemapUrl(origin: string, robots: string): string {
  for (const line of robots.split(/\r?\n/)) {
    const declaration = /^sitemap:\s*(\S+)/i.exec(line.trim())
    if (!declaration) continue
    try {
      const candidate = new URL(declaration[1], origin)
      if (candidate.origin === origin) return candidate.toString()
    } catch {
      // Ignore malformed declarations; the standard same-origin location is tried below.
    }
  }
  return `${origin}/sitemap.xml`
}

async function probeSitemap(origin: string, robots: string): Promise<FileProbe> {
  try {
    const response = await safeFetchText(getSitemapUrl(origin, robots), { maxBytes: 256_000, timeoutMs: 4_000, maxRedirects: 1, sameOrigin: origin })
    if (response.status === 404) return "missing"
    return isSuccess(response) && /<(?:[\w.-]+:)?(?:urlset|sitemapindex)(?:\s|>)/i.test(response.body) ? "found" : "unavailable"
  } catch {
    return "unavailable"
  }
}

export async function analyzeSeoPage(value: string): Promise<SeoCheckerResult> {
  const page = await safeFetchText(value)
  const contentType = page.headers["content-type"]?.split(";")[0].trim().toLowerCase()
  if (!isSuccess(page) || !["text/html", "application/xhtml+xml"].includes(contentType ?? "") || !page.body.trim()) {
    throw new SafeFetchError("invalid_response")
  }

  const origin = new URL(page.url).origin
  const robots = await probeRobots(origin)
  const sitemap = await probeSitemap(origin, robots.body)
  const robotsHeader = page.headers["x-robots-tag"]
  const noindexHeader = /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,])/i.test(Array.isArray(robotsHeader) ? robotsHeader.join(",") : robotsHeader ?? "")

  return scoreSeoPage({ html: page.body, url: page.url, robots: robots.state, sitemap, indexingBlocked: noindexHeader || robotsBlocksAll(robots.body) })
}
