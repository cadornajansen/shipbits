export type ImportedMediaUrls = {
  cover: string[]
  logo: string[]
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

export function getImportedMediaUrls(
  metadata: Record<string, unknown>,
  sourceUrl: string
): ImportedMediaUrls {
  const scrapedMedia = asRecord(metadata.shipbits_media)
  const logo = getImageCandidates(
    [scrapedMedia?.logo, metadata.logo, metadata.favicon],
    sourceUrl
  )

  if (!logo.length) {
    logo.push(new URL("/favicon.ico", sourceUrl).toString())
  }

  return {
    cover: getImageCandidates(
      [
        scrapedMedia?.cover,
        metadata.ogImage,
        metadata["og:image"],
        metadata["twitter:image"],
        metadata.image,
      ],
      sourceUrl
    ),
    logo,
  }
}
