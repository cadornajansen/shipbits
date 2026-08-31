import { load } from "cheerio"
import type { DistributionTaxonomySlugs } from "@/lib/assemblyai/client"
import {
  distributionProductProfileSchema,
  inferDistributionProductProfile,
} from "./finder"
import type { DistributionTag } from "./types"

export type UrlAnalysis = {
  canonicalUrl: string
  name: string
  description: string
  productTypes: string[]
  categories: string[]
  audiences: string[]
  platforms: string[]
  regions: string[]
  status: "success" | "partial"
}

function text(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function jsonLdText($: ReturnType<typeof load>): string {
  return $("script[type='application/ld+json']")
    .toArray()
    .flatMap((node) => {
      try {
        return JSON.stringify(JSON.parse($(node).text()) as unknown)
      } catch {
        return ""
      }
    })
    .join(" ")
}

export function distributionTaxonomySlugs(
  tags: DistributionTag[]
): DistributionTaxonomySlugs {
  const select = (type: DistributionTag["type"]) =>
    tags.filter((tag) => tag.type === type).map((tag) => tag.slug)
  return {
    productTypes: select("product_type"),
    categories: select("category"),
    audiences: select("audience"),
    platforms: select("platform"),
    regions: select("region"),
  }
}

export function filterDistributionTaxonomyValues(
  values: string[],
  allowed: string[]
): string[] {
  return [...new Set(values.filter((value) => allowed.includes(value)))].slice(
    0,
    8
  )
}

export function extractDistributionProductEvidence(
  document: string,
  responseUrl: string,
  tags: DistributionTag[]
): UrlAnalysis {
  const $ = load(document)
  const structuredData = jsonLdText($)
  $("script, style, noscript, template").remove()
  const metadata = (name: string) =>
    text($(`meta[name='${name}']`).attr("content"))
  const property = (name: string) =>
    text($(`meta[property='${name}']`).attr("content"))
  const heading = text($("h1").first().text())
  const visible = text($("main, article, body").first().text()).slice(0, 8_000)
  const name =
    property("og:title") ||
    metadata("twitter:title") ||
    text($("title").text()) ||
    heading
  const description =
    property("og:description") ||
    metadata("twitter:description") ||
    metadata("description") ||
    heading ||
    visible.slice(0, 280)
  const canonical = text($("link[rel='canonical']").attr("href"))
  const canonicalUrl = canonical
    ? new URL(canonical, responseUrl).toString()
    : responseUrl
  const returnedDescription = description || visible.slice(0, 280) || ""
  const taxonomy = distributionTaxonomySlugs(tags)
  const profile = inferDistributionProductProfile(
    distributionProductProfileSchema.parse({
      name: name || new URL(responseUrl).hostname,
      description:
        `${returnedDescription} ${heading} ${structuredData} ${visible}`.slice(
          0,
          1_000
        ),
      productTypes: [],
      categories: [],
      audiences: [],
      platforms: [],
      regions: ["global"],
    })
  )
  return {
    canonicalUrl,
    name: profile.name,
    description: returnedDescription,
    productTypes: filterDistributionTaxonomyValues(
      profile.productTypes,
      taxonomy.productTypes
    ),
    categories: filterDistributionTaxonomyValues(
      profile.categories,
      taxonomy.categories
    ),
    audiences: filterDistributionTaxonomyValues(
      profile.audiences,
      taxonomy.audiences
    ),
    platforms: filterDistributionTaxonomyValues(
      profile.platforms,
      taxonomy.platforms
    ),
    regions: filterDistributionTaxonomyValues(
      profile.regions,
      taxonomy.regions
    ),
    status: name && description ? "success" : "partial",
  }
}
