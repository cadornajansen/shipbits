export const channelTypes = [
  "directory",
  "review_site",
  "launch_platform",
  "community",
  "newsletter",
  "app_store",
  "marketplace",
  "forum",
] as const
export const pricingTypes = ["free", "freemium", "paid", "unknown"] as const
export const channelStatuses = [
  "active",
  "unverified",
  "stale",
  "broken",
  "inactive",
  "rejected",
] as const
export const tagTypes = [
  "product_type",
  "category",
  "audience",
  "platform",
  "region",
] as const
export type ChannelType = (typeof channelTypes)[number]
export type ChannelStatus = (typeof channelStatuses)[number]
export type PricingType = (typeof pricingTypes)[number]
export type TagType = (typeof tagTypes)[number]
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json }

export type DistributionTag = {
  id: string
  type: TagType
  slug: string
  name: string
}
export type ChannelTag = {
  tag_id: string
  relevance_score: number | null
  confidence_score: number | null
}
export type ChannelInput = {
  name: string
  slug: string
  description: string
  website_url: string
  submission_url: string | null
  channel_type: ChannelType | null
  pricing_type: PricingType
  price_amount: number | null
  price_currency: string | null
  requires_account: boolean | null
  requires_email_verification: boolean | null
  requires_manual_review: boolean | null
  requires_payment: boolean | null
  estimated_submission_minutes: number | null
  backlink_possible: boolean | null
  dofollow_possible: boolean | null
  traffic_tier: number | null
  authority_score: number | null
  quality_score: number | null
  competition_score: number | null
  submission_difficulty: number | null
  submission_requirements: { [key: string]: Json }
  status: ChannelStatus
}
export type Channel = ChannelInput & {
  id: string
  canonical_url: string
  created_at: string
  updated_at: string
  last_verified_at: string | null
  last_checked_at: string | null
  archived_at: string | null
}
export type ChannelRow = Pick<
  Channel,
  | "id"
  | "name"
  | "website_url"
  | "channel_type"
  | "pricing_type"
  | "quality_score"
  | "submission_difficulty"
  | "status"
  | "last_verified_at"
  | "updated_at"
> & { regions: string[]; source_count: number }
export type UrlCheck = {
  requested_url: string
  reachable: boolean
  http_status: number | null
  final_url: string | null
  failure: string | null
}
export type Verification = {
  id: string
  checked_at: string
  website: UrlCheck
  submission: UrlCheck | null
  result: "reachable" | "unreachable" | "broken" | "inconclusive" | null
  method: string | null
}
export type FieldEvidence = {
  id: string
  field_name: string
  source_url: string | null
  resulting_value: Json
  source_value: Json
  raw_value: Json
  extraction_method: string
  observed_at: string
  enriched_at: string
}
export type ChannelDetail = {
  channel: Channel
  tags: ChannelTag[]
  verifications: Verification[]
  evidence: FieldEvidence[]
}
export type DistributionFilters = {
  search: string
  type: string
  status: string
  pricing: string
  region: string
  sort: "name" | "quality_score" | "last_verified_at"
  direction: "asc" | "desc"
  page: number
  pageSize: number
}
export type ChannelPage = {
  rows: ChannelRow[]
  total: number
  page: number
  pageSize: number
}
export type DistributionStats = {
  total: number
  active: number
  unverified: number
  broken: number
  stale: number
}
export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string }
export function label(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ")
}
