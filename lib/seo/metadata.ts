import type { Metadata } from "next"

import { absoluteUrl, SITE_NAME } from "@/lib/site"

type PageMetadata = {
  title: string
  description: string
  path: string
  image?: string | null
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  noIndex?: boolean
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex = false,
}: PageMetadata): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  const imageUrl = absoluteUrl(image || "/opengraph-image")
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "en_PH",
      type,
      images: [{ url: imageUrl, alt: title }],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  }
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
