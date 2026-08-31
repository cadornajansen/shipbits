import { normalizeUrl } from "../normalization"
import type { Json, PricingType } from "../types"
import type {
  FieldEvidence,
  NormalizedRawData,
  SourceObservationInput,
} from "./types"

function objectValue(raw: Json): Record<string, Json> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
}

export function normalizePricing(value: Json): PricingType | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase().replaceAll("_", " ")
  if (normalized === "free") return "free"
  if (normalized === "freemium") return "freemium"
  if (normalized === "paid" || normalized === "paid listing") return "paid"
  return null
}

function text(value: Json): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function sourceClaimDate(value: Json): string | null {
  const input = text(value)
  if (!input || !/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(input))
    return null
  const date = new Date(input.length === 7 ? `${input}-01T00:00:00.000Z` : `${input}T00:00:00.000Z`)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

export function normalizeSubmissionUrl(value: Json): string | null {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    return normalizeUrl(value).url
  } catch {
    return null
  }
}

export function normalizeRawData(
  observation: SourceObservationInput
): NormalizedRawData {
  const raw = objectValue(observation.raw_data)
  const rejected: NormalizedRawData["rejected"] = []
  const evidence: FieldEvidence[] = []
  const pricing = normalizePricing(raw.pricing)
  if (raw.pricing != null && pricing == null && text(raw.pricing)?.toLowerCase() !== "unknown")
    rejected.push({ field: "pricing", value: raw.pricing, reason: "unsupported pricing value" })
  if (pricing)
    evidence.push({
      field: "pricing_type",
      value: pricing,
      raw_value: raw.pricing,
      extraction_method: "raw_data.pricing",
      source_observation_id: observation.id,
      source_record_id: observation.source_record_id,
      source_url: observation.source_url,
      observed_at: observation.observed_at,
    })

  const suppliedSubmission = observation.submission_url ?? raw.submission_url
  const submission = normalizeSubmissionUrl(suppliedSubmission)
  if (suppliedSubmission != null && text(suppliedSubmission) && !submission)
    rejected.push({ field: "submission_url", value: suppliedSubmission, reason: "malformed or unsafe URL" })
  if (submission)
    evidence.push({
      field: "submission_url",
      value: submission,
      raw_value: suppliedSubmission,
      extraction_method: observation.submission_url ? "import.submission_url" : "raw_data.submission_url",
      source_observation_id: observation.id,
      source_record_id: observation.source_record_id,
      source_url: observation.source_url,
      observed_at: observation.observed_at,
    })

  const claim = text(raw.verification_status)
  return {
    pricing_type: pricing,
    submission_url: submission,
    source_claim: claim
      ? { claim, observed_at: sourceClaimDate(raw.verification_date) }
      : null,
    source_category: text(raw.source_category),
    notes: text(raw.notes),
    evidence,
    rejected,
  }
}
