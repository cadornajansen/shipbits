import type { SupabaseClient } from "@supabase/supabase-js"
import { checkDatabaseError } from "../repository"

export type EnrichmentOptions = {
  dryRun?: boolean
  limit?: number
  channelId?: string
  pageSize?: number
}

export type EnrichmentReport = {
  records_scanned: number
  records_changed: number
  updates_by_field: Record<string, number>
  records_with_usable_pricing: number
  records_with_usable_submission_urls: number
  records_with_source_verification_claims: number
  malformed_or_rejected_values: number
  records_still_unknown: number
  database_writes: number
}

const emptyReport = (): EnrichmentReport => ({
  records_scanned: 0,
  records_changed: 0,
  updates_by_field: {},
  records_with_usable_pricing: 0,
  records_with_usable_submission_urls: 0,
  records_with_source_verification_claims: 0,
  malformed_or_rejected_values: 0,
  records_still_unknown: 0,
  database_writes: 0,
})

export async function runDistributionEnrichment(
  db: SupabaseClient,
  options: EnrichmentOptions = {}
): Promise<EnrichmentReport> {
  const report = emptyReport()
  const pageSize = Math.min(options.pageSize ?? 100, 100)
  let after: string | null = null
  while (!options.limit || report.records_scanned < options.limit) {
    const batchLimit = Math.min(pageSize, (options.limit ?? Infinity) - report.records_scanned)
    const result = await db.rpc("distribution_enrichment_candidates", {
      p_after: after,
      p_limit: batchLimit,
      p_channel_id: options.channelId ?? null,
    })
    checkDatabaseError(result.error)
    const candidates = (result.data ?? []) as Array<{
      channel_id: string
      updates: Record<string, unknown>
      evidence: unknown[]
      usable_pricing: boolean
      usable_submission_url: boolean
      source_claim: boolean
      rejected_count: number
      still_unknown: boolean
    }>
    if (!candidates.length) break
    report.records_scanned += candidates.length
    const changed = candidates.filter((candidate) => Object.keys(candidate.updates).length)
    report.records_changed += changed.length
    for (const candidate of candidates) {
      if (candidate.usable_pricing) report.records_with_usable_pricing++
      if (candidate.usable_submission_url) report.records_with_usable_submission_urls++
      if (candidate.source_claim) report.records_with_source_verification_claims++
      report.malformed_or_rejected_values += candidate.rejected_count
      if (candidate.still_unknown) report.records_still_unknown++
      for (const field of Object.keys(candidate.updates))
        report.updates_by_field[field] = (report.updates_by_field[field] ?? 0) + 1
    }
    if (!options.dryRun && changed.length) {
      const applied = await db.rpc("distribution_apply_enrichment", { p_candidates: changed })
      checkDatabaseError(applied.error)
      report.database_writes += Number(applied.data ?? 0)
    }
    after = candidates.at(-1)?.channel_id ?? null
    if (options.channelId || candidates.length < batchLimit) break
  }
  return report
}

export async function enrichChannelById(
  db: SupabaseClient,
  channelId: string
): Promise<EnrichmentReport> {
  return runDistributionEnrichment(db, { channelId })
}
