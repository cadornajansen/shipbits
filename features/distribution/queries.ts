import "server-only"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/auth"
import {
  checkDatabaseError,
  getChannelEvidence,
  type ChannelEvidence,
  getStats,
  getTaxonomy,
  listChannels,
} from "./repository"
import {
  pricingTypes,
  type Channel,
  type ChannelTag,
  type DistributionFilters,
  type DistributionTag,
} from "./types"

export async function getDistributionAdminData(filters: DistributionFilters) {
  await requireAdmin()
  const db = createAdminClient()
  const [page, stats, taxonomy] = await Promise.all([
    listChannels(db, filters),
    getStats(db),
    getTaxonomy(db),
  ])
  return { page, stats, taxonomy }
}

const finderSchema = z.object({
  tagIds: z.array(z.uuid()).max(50).optional(),
  platform: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80)
    .optional(),
  region: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80)
    .optional(),
  pricing: z.enum(pricingTypes).optional(),
  minimumQuality: z.number().int().min(0).max(100).optional(),
  page: z.number().int().min(1).max(100000).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})
export type FinderFilters = z.input<typeof finderSchema>
export type FinderCandidate = Pick<
  Channel,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "website_url"
  | "submission_url"
  | "channel_type"
  | "pricing_type"
  | "price_amount"
  | "price_currency"
  | "quality_score"
  | "authority_score"
  | "traffic_tier"
  | "competition_score"
  | "submission_difficulty"
  | "requires_account"
  | "requires_email_verification"
  | "requires_manual_review"
  | "requires_payment"
  | "estimated_submission_minutes"
  | "backlink_possible"
  | "dofollow_possible"
  | "last_verified_at"
> & {
  tags: (ChannelTag & { tag: DistributionTag })[]
  source_count: number
  sources: ChannelEvidence["sources"]
}

// Public DTO has no raw provenance, private requirements, archive data, or leases.
// All requested tags must match. Quality ordering is explicit, not an AI score.
export async function findDistributionChannels(
  input: FinderFilters = {}
): Promise<{ rows: FinderCandidate[]; total: number }> {
  const filters = finderSchema.parse(input)
  const db = createAdminClient()
  const { data, count, error } = await db
    .rpc(
      "distribution_search",
      { p_filters: filters, p_public: true },
      { count: "exact" }
    )
    .select(
      "id,name,slug,description,website_url,submission_url,channel_type,pricing_type,price_amount,price_currency,quality_score,authority_score,traffic_tier,competition_score,submission_difficulty,requires_account,requires_email_verification,requires_manual_review,requires_payment,estimated_submission_minutes,backlink_possible,dofollow_possible,last_verified_at"
    )
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("id")
    .range(
      (filters.page - 1) * filters.pageSize,
      filters.page * filters.pageSize - 1
    )
  checkDatabaseError(error)
  const rows = (data ?? []) as Omit<
    FinderCandidate,
    "tags" | "sources" | "source_count"
  >[]
  if (!rows.length) return { rows: [], total: count ?? 0 }
  const evidence = new Map(
    (
      await getChannelEvidence(
        db,
        rows.map((row) => row.id)
      )
    ).map((item) => [item.channel_id, item])
  )
  return {
    rows: rows.map((row) => ({
      ...row,
      tags: evidence.get(row.id)?.tags ?? [],
      sources: evidence.get(row.id)?.sources ?? [],
      source_count: evidence.get(row.id)?.source_count ?? 0,
    })),
    total: count ?? 0,
  }
}
