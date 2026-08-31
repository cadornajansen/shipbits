import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  Channel,
  ChannelDetail,
  ChannelPage,
  ChannelRow,
  ChannelTag,
  DistributionFilters,
  DistributionStats,
  DistributionTag,
} from "./types"

export function checkDatabaseError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export type ChannelEvidence = {
  channel_id: string
  source_count: number
  sources: {
    source_url: string
    observed_at: string
    extraction_method: string
  }[]
  tags: (ChannelTag & { tag: DistributionTag })[]
}
export async function getChannelEvidence(
  db: SupabaseClient,
  ids: string[]
): Promise<ChannelEvidence[]> {
  if (!ids.length) return []
  const chunks: string[][] = []
  for (let index = 0; index < ids.length; index += 100)
    chunks.push(ids.slice(index, index + 100))
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await db.rpc("distribution_evidence", { p_ids: chunk })
      checkDatabaseError(error)
      return data as ChannelEvidence[]
    })
  )
  return results.flat()
}

export async function listChannels(
  db: SupabaseClient,
  filters: DistributionFilters
): Promise<ChannelPage> {
  const columns =
    "id,name,website_url,channel_type,pricing_type,quality_score,submission_difficulty,status,last_verified_at,updated_at"
  const offset = (filters.page - 1) * filters.pageSize
  const { data, count, error } = await db
    .rpc("distribution_search", { p_filters: filters }, { count: "exact" })
    .select(columns)
    .order(filters.sort, {
      ascending: filters.direction === "asc",
      nullsFirst: false,
    })
    .order("id")
    .range(offset, offset + filters.pageSize - 1)
  if (error?.code === "PGRST103" && filters.page > 1) {
    const totalResult = await db.rpc("distribution_search", { p_filters: filters }, { count: "exact", head: true })
    checkDatabaseError(totalResult.error)
    const lastPage = Math.max(1, Math.ceil((totalResult.count ?? 0) / filters.pageSize))
    return listChannels(db, { ...filters, page: Math.min(filters.page - 1, lastPage) })
  }
  checkDatabaseError(error)
  const total = count ?? 0
  const page = Math.max(
    1,
    Math.min(filters.page, Math.ceil(total / filters.pageSize))
  )
  if (page !== filters.page) return listChannels(db, { ...filters, page })
  const rows = (data ?? []) as Omit<ChannelRow, "regions" | "source_count">[]
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
      source_count: evidence.get(row.id)?.source_count ?? 0,
      regions:
        evidence
          .get(row.id)
          ?.tags.filter(({ tag }) => tag.type === "region")
          .map(({ tag }) => tag.name) ?? [],
    })),
    total,
    page,
    pageSize: filters.pageSize,
  }
}

export async function getTaxonomy(
  db: SupabaseClient
): Promise<DistributionTag[]> {
  const { data, error } = await db
    .from("distribution_tags")
    .select("id,type,slug,name")
    .order("name")
    .limit(1000)
  checkDatabaseError(error)
  return data as DistributionTag[]
}

export async function getStats(db: SupabaseClient): Promise<DistributionStats> {
  const statuses = ["total", "active", "unverified", "broken", "stale"] as const
  const counts = await Promise.all(
    statuses.map(async (status) => {
      let query = db
        .from("distribution_channels")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
      if (status !== "total") query = query.eq("status", status)
      const { count, error } = await query
      checkDatabaseError(error)
      return count ?? 0
    })
  )
  return {
    total: counts[0],
    active: counts[1],
    unverified: counts[2],
    broken: counts[3],
    stale: counts[4],
  }
}

export async function getChannelDetail(
  db: SupabaseClient,
  id: string
): Promise<ChannelDetail> {
  const [channel, tags, verifications, evidence] = await Promise.all([
    db
      .from("distribution_channels")
      .select("*")
      .eq("id", id)
      .is("archived_at", null)
      .single(),
    db
      .from("distribution_channel_tags")
      .select("tag_id,relevance_score,confidence_score")
      .eq("channel_id", id),
    db
      .from("distribution_channel_verifications")
      .select("id,checked_at,website,submission,result,method")
      .eq("channel_id", id)
      .order("checked_at", { ascending: false })
      .limit(20),
    db
      .from("distribution_channel_field_evidence")
      .select(
        "id,field_name,source_url,resulting_value,source_value,raw_value,extraction_method,observed_at,enriched_at"
      )
      .eq("channel_id", id)
      .order("observed_at", { ascending: false })
      .limit(50),
  ])
  for (const result of [channel, tags, verifications, evidence])
    checkDatabaseError(result.error)
  return {
    channel: channel.data as Channel,
    tags: tags.data ?? [],
    verifications: verifications.data ?? [],
    evidence: evidence.data ?? [],
  } as ChannelDetail
}
