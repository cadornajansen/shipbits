import type { Json, PricingType } from "../types"

export type EnrichmentField = "pricing_type" | "submission_url"

export type SourceObservationInput = {
  id?: string
  source_record_id: string
  source_url: string
  observed_at: string
  raw_data: Json
  submission_url?: string | null
}

export type FieldEvidence = {
  field: EnrichmentField
  value: PricingType | string
  raw_value: Json
  extraction_method: string
  source_observation_id?: string
  source_record_id: string
  source_url: string
  observed_at: string
}

export type SourceClaim = {
  claim: string
  observed_at: string | null
}

export type NormalizedRawData = {
  pricing_type: PricingType | null
  submission_url: string | null
  source_claim: SourceClaim | null
  source_category: string | null
  notes: string | null
  evidence: FieldEvidence[]
  rejected: { field: string; value: Json; reason: string }[]
}

export type EnrichmentCandidate = {
  channel_id: string
  updates: Partial<Record<EnrichmentField, PricingType | string>>
  evidence: FieldEvidence[]
  rejected: NormalizedRawData["rejected"]
  has_source_claim: boolean
}
