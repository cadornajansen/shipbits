import { z } from "zod"
import type { Channel, ChannelTag, DistributionTag, PricingType } from "./types"

const profileTagSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)

export const distributionProductProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter your product name.").max(120),
  description: z.string().trim().min(1, "Describe what your product does.").max(1000),
  productTypes: z.array(profileTagSchema).max(8).default([]),
  categories: z.array(profileTagSchema).max(8).default([]),
  audiences: z.array(profileTagSchema).max(8).default([]),
  platforms: z.array(profileTagSchema).max(8).default([]),
  regions: z.array(profileTagSchema).max(8).default(["global"]),
  businessModel: z.string().trim().max(80).optional(),
}).strict()

export type DistributionProductProfile = z.infer<typeof distributionProductProfileSchema>

export type FinderChannel = Pick<
  Channel,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "website_url"
  | "submission_url"
  | "channel_type"
  | "pricing_type"
  | "quality_score"
  | "authority_score"
  | "requires_account"
  | "requires_email_verification"
  | "requires_manual_review"
  | "requires_payment"
  | "estimated_submission_minutes"
> & { tags: (ChannelTag & { tag: DistributionTag })[] }

export type RankedDistributionChannel = FinderChannel & {
  matchScore: number
  reasons: string[]
  submissionFriction: number
}

const keywordProfileRules: Array<{ pattern: RegExp; type: keyof Pick<DistributionProductProfile, "productTypes" | "categories" | "audiences" | "platforms">; slug: string }> = [
  { pattern: /\b(ai|artificial intelligence|machine learning|llm|chatbot)\b/i, type: "productTypes", slug: "ai-tool" },
  { pattern: /\b(ai|artificial intelligence|machine learning|llm|chatbot)\b/i, type: "categories", slug: "artificial-intelligence" },
  { pattern: /\b(developer|developer tool|coding|code|devops|sdk|framework)\b/i, type: "productTypes", slug: "developer-tool" },
  { pattern: /\b(developer|developer tool|coding|code|devops|sdk|framework)\b/i, type: "categories", slug: "developer-tools" },
  { pattern: /\b(developer|developer tool|coding|code|devops|sdk|framework)\b/i, type: "audiences", slug: "developers" },
  { pattern: /\b(api|apis)\b/i, type: "productTypes", slug: "api" },
  { pattern: /\b(api|apis)\b/i, type: "platforms", slug: "api" },
  { pattern: /\b(open[ -]source)\b/i, type: "productTypes", slug: "open-source" },
  { pattern: /\b(open[ -]source)\b/i, type: "categories", slug: "open-source" },
  { pattern: /\b(browser extension|chrome extension|firefox extension|edge extension)\b/i, type: "productTypes", slug: "browser-extension" },
  { pattern: /\b(browser extension|chrome extension|firefox extension|edge extension)\b/i, type: "platforms", slug: "browser" },
  { pattern: /\b(mobile app|ios app|iphone app|android app)\b/i, type: "productTypes", slug: "mobile-app" },
  { pattern: /\b(shopify)\b/i, type: "productTypes", slug: "ecommerce" },
  { pattern: /\b(shopify)\b/i, type: "platforms", slug: "shopify" },
  { pattern: /\b(wordpress)\b/i, type: "platforms", slug: "wordpress" },
  { pattern: /\b(b2b|business software|enterprise)\b/i, type: "productTypes", slug: "b2b-software" },
  { pattern: /\b(b2b|business software|enterprise)\b/i, type: "audiences", slug: "businesses" },
  { pattern: /\b(saas|software as a service)\b/i, type: "productTypes", slug: "saas" },
  { pattern: /\b(consumer)\b/i, type: "productTypes", slug: "consumer-app" },
  { pattern: /\b(consumer)\b/i, type: "audiences", slug: "consumers" },
  { pattern: /\b(study|student|learning|education|course|lecture|flashcards?)\b/i, type: "productTypes", slug: "education" },
  { pattern: /\b(study|student|learning|education|course|lecture|flashcards?)\b/i, type: "categories", slug: "education" },
  { pattern: /\b(study|student|learning|education|course|lecture|flashcards?)\b/i, type: "audiences", slug: "students" },
  { pattern: /\b(teacher|educator|teaching|classroom)\b/i, type: "audiences", slug: "educators" },
  { pattern: /\b(notes?|workspace|knowledge base|second brain)\b/i, type: "productTypes", slug: "productivity" },
  { pattern: /\b(notes?|workspace|knowledge base|second brain)\b/i, type: "categories", slug: "productivity" },
]

export function inferDistributionProductProfile(input: DistributionProductProfile): DistributionProductProfile {
  const profile = distributionProductProfileSchema.parse(input)
  const inferred = { ...profile, productTypes: [...profile.productTypes], categories: [...profile.categories], audiences: [...profile.audiences], platforms: [...profile.platforms], regions: [...profile.regions] }
  const text = `${profile.name} ${profile.description}`
  for (const rule of keywordProfileRules) if (rule.pattern.test(text) && !inferred[rule.type].includes(rule.slug)) inferred[rule.type].push(rule.slug)
  if (!inferred.regions.length) inferred.regions.push("global")
  if (inferred.regions.includes("philippines") && !inferred.regions.includes("global")) inferred.regions.push("global")
  return inferred
}

function relationshipWeight(tag: ChannelTag): number {
  return ((tag.relevance_score ?? 70) / 100) * ((tag.confidence_score ?? 70) / 100)
}

function matchDimension(
  profileSlugs: string[],
  channelTags: FinderChannel["tags"],
  type: DistributionTag["type"],
  maximum: number
): { score: number; tag: DistributionTag | null } {
  const matches = channelTags
    .filter(({ tag }) => tag.type === type && profileSlugs.includes(tag.slug))
    .map((tag) => ({
      tag: tag.tag,
      weight:
        type === "region" && tag.tag.slug === "global" && profileSlugs.some((slug) => slug !== "global")
          ? relationshipWeight(tag) * 0.7
          : relationshipWeight(tag),
    }))
    .sort((a, b) => b.weight - a.weight || a.tag.name.localeCompare(b.tag.name))
  const best = matches[0]
  return best ? { score: maximum * best.weight, tag: best.tag } : { score: 0, tag: null }
}

export function submissionFriction(channel: FinderChannel): number {
  const known = [channel.requires_account, channel.requires_email_verification, channel.requires_manual_review, channel.requires_payment, channel.estimated_submission_minutes, channel.pricing_type !== "unknown"]
  if (!known.some((value) => value !== null && value !== false)) return 2.5
  let score = 2.5
  if (channel.requires_account === true) score -= 0.5
  if (channel.requires_email_verification === true) score -= 0.25
  if (channel.requires_manual_review === true) score -= 1
  if (channel.requires_payment === true) score -= 0.75
  if (channel.estimated_submission_minutes !== null) score -= Math.min(1.25, channel.estimated_submission_minutes / 60)
  if (channel.pricing_type === "paid") score -= 0.25
  return Math.max(0, Math.min(5, score))
}

function qualityContribution(channel: FinderChannel): number {
  return channel.quality_score === null ? 5 : channel.quality_score / 10
}

function reason(label: string, tag: DistributionTag | null): string | null {
  return tag ? `${label}: ${tag.name}` : null
}

export function rankDistributionChannels(
  profileInput: DistributionProductProfile,
  channels: FinderChannel[]
): RankedDistributionChannel[] {
  const profile = inferDistributionProductProfile(profileInput)
  return channels.map((channel) => {
    const category = matchDimension(profile.categories, channel.tags, "category", 30)
    const audience = matchDimension(profile.audiences, channel.tags, "audience", 25)
    const platform = matchDimension(profile.platforms, channel.tags, "platform", 15)
    const region = matchDimension(profile.regions, channel.tags, "region", 10)
    const productType = matchDimension(profile.productTypes, channel.tags, "product_type", 5)
    const friction = submissionFriction(channel)
    const score = category.score + audience.score + platform.score + region.score + qualityContribution(channel) + productType.score + friction
    const reasons = [
      reason("Strong category match", category.tag),
      reason("Reaches", audience.tag),
      reason("Fits", platform.tag),
      reason("Relevant product type", productType.tag),
      reason("Available in", region.tag),
    ].filter((item): item is string => Boolean(item)).slice(0, 4)
    return { ...channel, matchScore: Math.round(score), reasons, submissionFriction: friction }
  }).sort((a, b) => b.matchScore - a.matchScore || (b.quality_score ?? -1) - (a.quality_score ?? -1) || (b.authority_score ?? -1) - (a.authority_score ?? -1) || a.name.localeCompare(b.name))
}

export function priceLabel(pricing: PricingType): string {
  return pricing === "unknown" ? "Pricing unknown" : pricing[0].toUpperCase() + pricing.slice(1)
}
