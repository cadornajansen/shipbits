import "server-only"

import { classifyDistributionEvidence } from "@/lib/assemblyai/client"
import { safeFetchText, SafeFetchError } from "@/lib/security/safe-fetch"
import type { DistributionTag } from "./types"
import {
  distributionTaxonomySlugs,
  extractDistributionProductEvidence,
  filterDistributionTaxonomyValues,
  type UrlAnalysis,
} from "./url-analysis-evidence"

export type { UrlAnalysis } from "./url-analysis-evidence"

export async function analyzeDistributionProductUrl(
  value: string,
  tags: DistributionTag[]
): Promise<UrlAnalysis> {
  const response = await safeFetchText(value, {
    allowTruncated: true,
    maxBytes: 1_500_000,
    timeoutMs: 8_000,
    maxRedirects: 3,
  })
  const contentType = response.headers["content-type"]
    ?.toString()
    .split(";")[0]
    ?.toLowerCase()
  if (
    !contentType ||
    !["text/html", "application/xhtml+xml"].includes(contentType)
  ) {
    throw new SafeFetchError("invalid_response")
  }

  const parsed = extractDistributionProductEvidence(
    response.body,
    response.url,
    tags
  )
  const extracted = {
    ...parsed,
    status: response.truncated ? ("partial" as const) : parsed.status,
  }
  if (!process.env.ASSEMBLYAI_API_KEY) return extracted

  try {
    const taxonomy = distributionTaxonomySlugs(tags)
    const aiProfile = await classifyDistributionEvidence({
      domain: new URL(response.url).hostname,
      evidence: `${extracted.name}\n${extracted.description}\n${response.body}`,
      taxonomy,
    })
    return {
      ...extracted,
      productTypes: filterDistributionTaxonomyValues(
        aiProfile.productTypes,
        taxonomy.productTypes
      ),
      categories: filterDistributionTaxonomyValues(
        aiProfile.categories,
        taxonomy.categories
      ),
      audiences: filterDistributionTaxonomyValues(
        aiProfile.audiences,
        taxonomy.audiences
      ),
      platforms: filterDistributionTaxonomyValues(
        aiProfile.platforms,
        taxonomy.platforms
      ),
      regions: aiProfile.regions.length
        ? filterDistributionTaxonomyValues(aiProfile.regions, taxonomy.regions)
        : extracted.regions,
    }
  } catch {
    return extracted
  }
}
