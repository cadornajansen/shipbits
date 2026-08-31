import { createHash } from "node:crypto"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeUrl, channelSlug } from "./normalization"
import { channelTypes, type ChannelType, type Json } from "./types"
import { checkDatabaseError } from "./repository"
import { enrichChannelById } from "./enrichment/run"

const sourceSchema = z
  .object({
    name: z.string().min(1).max(200),
    source_url: z.url(),
    license: z.string().min(1).max(200),
    attribution: z.string().min(1).max(2000),
  })
  .strict()
const recordSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    website_url: z.string(),
    submission_url: z.string().nullable().optional(),
    channel_type: z.enum(channelTypes).nullable().optional(),
    source_record_id: z.string().min(1).max(2048),
    source_url: z.url(),
    observed_at: z.iso.datetime({ offset: true }),
    raw_data: z.json(),
  })
  .strict()
export const batchSchema = z
  .object({
    source: sourceSchema,
    records: z.array(recordSchema).min(1).max(100),
  })
  .strict()
export type ImportBatch = z.infer<typeof batchSchema>
export type PreparedRecord = {
  name: string
  slug: string
  website_url: string
  canonical_url: string
  submission_url: string | null
  channel_type: ChannelType | null
  source_record_id: string
  source_url: string
  observed_at: string
  raw_data: Json
  content_hash: string
}

function stableJson(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`
  return JSON.stringify(value)
}

export function prepareRecord(
  input: ImportBatch["records"][number]
): PreparedRecord {
  const record = recordSchema.parse(input)
  const website = normalizeUrl(record.website_url)
  const submission = record.submission_url
    ? normalizeUrl(record.submission_url).url
    : null
  return {
    ...record,
    website_url: website.url,
    canonical_url: website.canonical,
    slug: `${channelSlug(record.name)}-${createHash("sha256").update(website.canonical).digest("hex").slice(0, 12)}`,
    submission_url: submission,
    channel_type: record.channel_type ?? null,
    content_hash: createHash("sha256")
      .update(stableJson(record.raw_data))
      .digest("hex"),
  }
}

export async function importBatch(
  db: SupabaseClient,
  input: unknown
): Promise<{ processed: number; inserted: number; observations: number }> {
  const batch = batchSchema.parse(input)
  const records = batch.records.map(prepareRecord)
  const { data, error } = await db.rpc("distribution_import", {
    p_source: batch.source,
    p_records: records,
  })
  checkDatabaseError(error)
  const result = data as {
    processed: number
    inserted: number
    observations: number
    channel_ids: string[]
  }
  for (const channelId of result.channel_ids ?? []) await enrichChannelById(db, channelId)
  return result
}

// RFC 4180 quoting, embedded newlines, BOM, CRLF and escaped double quotes.
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  const input = text.replace(/^\uFEFF/, "").replace(/\r\r\n/g, "\n")
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(field)
      field = ""
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++
      row.push(field)
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ""
    } else field += char
  }
  if (quoted) throw new Error("Unterminated CSV quoted field")
  row.push(field)
  if (row.some(Boolean)) rows.push(row)
  const headers = rows.shift()
  if (!headers) return []
  return rows.map((values, i) => {
    if (values.length !== headers.length)
      throw new Error(`CSV row ${i + 2}: expected ${headers.length} columns`)
    return Object.fromEntries(
      headers.map((header, index) => [header.trim(), values[index]])
    )
  })
}
