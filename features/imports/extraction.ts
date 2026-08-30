import "server-only"

import { generateProductFromEvidence } from "@/lib/assemblyai/client"
import { scrapeWebsite } from "@/lib/firecrawl/client"
import {
  getNormalizedDomain,
  normalizeWebsiteUrl,
} from "@/features/products/validation"

import { getImportedMediaUrls } from "./media"

export async function generateProductMetadataFromEvidence({
  domain,
  evidence,
}: {
  domain: string
  evidence: string
}) {
  return generateProductFromEvidence({ domain, evidence })
}

export async function extractProductMetadata(url: string) {
  const websiteUrl = normalizeWebsiteUrl(url)
  const scraped = await scrapeWebsite(websiteUrl)
  const generated = await generateProductMetadataFromEvidence({
    domain: getNormalizedDomain(websiteUrl),
    evidence: scraped.markdown,
  })

  return {
    ...generated,
    normalizedDomain: getNormalizedDomain(websiteUrl),
    media: getImportedMediaUrls(scraped.metadata, websiteUrl),
    websiteUrl,
  }
}
