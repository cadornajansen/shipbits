import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { getChannelEvidence, checkDatabaseError } from "./repository"
import { distributionProductProfileSchema, inferDistributionProductProfile, rankDistributionChannels, type FinderChannel } from "./finder"
import type { DistributionTag } from "./types"

export async function findRankedDistributionChannels(input: unknown) {
  const profile = inferDistributionProductProfile(distributionProductProfileSchema.parse(input))
  const db = createAdminClient()
  const { data: taxonomy, error: taxonomyError } = await db.from("distribution_tags").select("id,type,slug,name")
  checkDatabaseError(taxonomyError)
  const lookup = new Map((taxonomy as DistributionTag[]).map((tag) => [`${tag.type}:${tag.slug}`, tag.id]))
  const candidateTagIds = [
    ...profile.productTypes.map((slug) => lookup.get(`product_type:${slug}`)),
    ...profile.categories.map((slug) => lookup.get(`category:${slug}`)),
    ...profile.audiences.map((slug) => lookup.get(`audience:${slug}`)),
    ...profile.platforms.map((slug) => lookup.get(`platform:${slug}`)),
  ].filter((id): id is string => Boolean(id))
  const columns = "id,name,slug,description,website_url,submission_url,channel_type,pricing_type,quality_score,authority_score,requires_account,requires_email_verification,requires_manual_review,requires_payment,estimated_submission_minutes"
  const query = candidateTagIds.length
    ? db.rpc("distribution_finder_candidates", { p_tag_ids: candidateTagIds, p_limit: 500 }).select(columns)
    : db.rpc("distribution_search", { p_filters: {}, p_public: true }).select(columns).order("name").limit(100)
  const { data, error } = await query
  checkDatabaseError(error)
  const channels = (data ?? []) as FinderChannel[]
  const evidence = new Map((await getChannelEvidence(db, channels.map((channel) => channel.id))).map((item) => [item.channel_id, item]))
  return {
    profile,
    rows: rankDistributionChannels(profile, channels.map((channel) => ({ ...channel, tags: evidence.get(channel.id)?.tags ?? [] }))),
  }
}
