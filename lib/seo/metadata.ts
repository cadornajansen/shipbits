import type { Metadata } from "next"

import {
  canonicalUrl,
  DEFAULT_OG_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
} from "@/lib/site"

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
  const canonical = canonicalUrl(path)
  const usesDefaultImage = !image
  const imageUrl = canonicalUrl(image || DEFAULT_OG_IMAGE_PATH)
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: [
        {
          url: imageUrl,
          alt: title,
          ...(usesDefaultImage ? { width: 4800, height: 2520 } : {}),
        },
      ],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: imageUrl, alt: title }],
    },
  }
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
}
