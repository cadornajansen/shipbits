import "server-only"

import { parsePublicUrl } from "@/lib/security/safe-fetch"

export type ScrapedWebsite = {
  markdown: string
  metadata: Record<string, unknown>
  scrapeId: string | null
  title: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asHttpUrl(value: unknown, sourceUrl: string) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    const url = new URL(value, sourceUrl)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function getScrapedMedia({
  branding,
  images,
  metadata,
  sourceUrl,
}: {
  branding: unknown
  images: unknown
  metadata: Record<string, unknown>
  sourceUrl: string
}) {
  const brandingRecord = asRecord(branding)
  const brandingImages = asRecord(brandingRecord?.images)
  const pageImage = Array.isArray(images)
    ? images
        .map((image) => asHttpUrl(image, sourceUrl))
        .find((image): image is string => Boolean(image))
    : null

  return {
    cover:
      asHttpUrl(brandingImages?.ogImage, sourceUrl) ??
      asHttpUrl(metadata.ogImage, sourceUrl) ??
      asHttpUrl(metadata["og:image"], sourceUrl) ??
      asHttpUrl(metadata["og:image:url"], sourceUrl) ??
      asHttpUrl(metadata.og_image, sourceUrl) ??
      asHttpUrl(metadata["twitter:image"], sourceUrl) ??
      asHttpUrl(metadata["twitter:image:src"], sourceUrl) ??
      asHttpUrl(metadata.image, sourceUrl) ??
      pageImage,
    logo:
      asHttpUrl(brandingImages?.logo, sourceUrl) ??
      asHttpUrl(brandingRecord?.logo, sourceUrl) ??
      asHttpUrl(brandingImages?.favicon, sourceUrl) ??
      asHttpUrl(metadata.logo, sourceUrl) ??
      asHttpUrl(metadata.favicon, sourceUrl),
  }
}

function getApiKey() {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured.")
  }

  return apiKey
}

export async function scrapeWebsite(
  sourceUrl: string
): Promise<ScrapedWebsite> {
  const validatedSourceUrl = parsePublicUrl(sourceUrl).toString()
  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    body: JSON.stringify({
      formats: ["markdown", "branding", "images"],
      onlyMainContent: true,
      timeout: 30_000,
      url: validatedSourceUrl,
    }),
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(35_000),
  })

  const payload = (await response.json().catch(() => null)) as {
    data?: {
      branding?: unknown
      id?: string
      images?: unknown
      markdown?: string
      metadata?: Record<string, unknown>
      scrapeId?: string
    }
    error?: string
    success?: boolean
  } | null

  if (!response.ok || !payload?.success || !payload.data?.markdown?.trim()) {
    throw new Error(
      payload?.error || "Firecrawl could not extract page content."
    )
  }

  const resolvedSourceUrl =
    typeof payload.data.metadata?.sourceURL === "string"
      ? payload.data.metadata.sourceURL
      : validatedSourceUrl
  const metadata: Record<string, unknown> = {
    ...(payload.data.metadata ?? {}),
    shipbits_media: getScrapedMedia({
      branding: payload.data.branding,
      images: payload.data.images,
      metadata: payload.data.metadata ?? {},
      sourceUrl: resolvedSourceUrl,
    }),
  }
  const title = typeof metadata.title === "string" ? metadata.title : null
  const scrapeId =
    typeof payload.data.scrapeId === "string"
      ? payload.data.scrapeId
      : typeof payload.data.id === "string"
        ? payload.data.id
        : typeof metadata.scrapeId === "string"
          ? metadata.scrapeId
          : null

  return {
    markdown: payload.data.markdown,
    metadata,
    scrapeId,
    title,
  }
}
