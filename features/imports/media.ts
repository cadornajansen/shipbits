import { load } from "cheerio"

import { safeFetchText } from "@/lib/security/safe-fetch"

export type ImportedMediaUrls = {
  cover: string[]
  logo: string[]
}

const googleFaviconBaseUrl = "https://t0.gstatic.com/faviconV2"
export const importedAssetSource = "product_import"

export function canReplaceAssetFromImport(source: string | null | undefined) {
  return source === importedAssetSource
}

export function getGoogleFaviconUrl(websiteUrl: string) {
  const source = new URL(websiteUrl)
  source.pathname = "/"
  source.search = ""
  source.hash = ""

  return `${googleFaviconBaseUrl}?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(source.toString())}&size=64`
}

function asImageUrl(value: unknown, sourceUrl: string) {
  if (typeof value !== "string" || !value.trim()) return null

  try {
    const url = new URL(value, sourceUrl)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getImageCandidates(values: unknown[], sourceUrl: string) {
  return [...new Set(values.map((value) => asImageUrl(value, sourceUrl)))].filter(
    (value): value is string => Boolean(value)
  )
}

export function getHtmlCoverImageUrls(html: string, responseUrl: string) {
  const $ = load(html)
  return getImageCandidates(
    [
      $("meta[property='og:image']").first().attr("content"),
      $("meta[property='og:image:url']").first().attr("content"),
      $("meta[name='twitter:image']").first().attr("content"),
      $("meta[name='twitter:image:src']").first().attr("content"),
    ],
    responseUrl
  )
}

export async function getDirectCoverImageUrls(sourceUrl: string) {
  const response = await safeFetchText(sourceUrl, {
    maxBytes: 1_000_000,
    maxRedirects: 3,
    timeoutMs: 10_000,
  })
  const contentType = String(response.headers["content-type"] ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase()

  if (
    response.status < 200 ||
    response.status >= 300 ||
    !["text/html", "application/xhtml+xml"].includes(contentType) ||
    !response.body.trim()
  ) {
    return []
  }

  return getHtmlCoverImageUrls(response.body, response.url)
}

export function getImportedMediaUrls(
  metadata: Record<string, unknown>,
  sourceUrl: string
): ImportedMediaUrls {
  const scrapedMedia = asRecord(metadata.shipbits_media)
  const logo = getImageCandidates(
    [scrapedMedia?.logo, metadata.logo, metadata.favicon],
    sourceUrl
  )
  logo.unshift(getGoogleFaviconUrl(sourceUrl))
  logo.push(new URL("/favicon.ico", sourceUrl).toString())

  return {
    cover: getImageCandidates(
      [
        scrapedMedia?.cover,
        metadata.ogImage,
        metadata["og:image"],
        metadata["og:image:url"],
        metadata.og_image,
        metadata["twitter:image"],
        metadata["twitter:image:src"],
        metadata.image,
      ],
      sourceUrl
    ),
    logo,
  }
}
