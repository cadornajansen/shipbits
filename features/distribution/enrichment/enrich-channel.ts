import type { PricingType } from "../types"
import { normalizeRawData } from "./normalize-raw-data"
import type {
  EnrichmentCandidate,
  EnrichmentField,
  FieldEvidence,
  SourceObservationInput,
} from "./types"

type CurrentChannel = {
  id: string
  pricing_type: PricingType
  submission_url: string | null
}

export function enrichChannel(
  channel: CurrentChannel,
  observations: SourceObservationInput[],
  enrichedFields: EnrichmentField[] = []
): EnrichmentCandidate {
  const normalized = observations.map(normalizeRawData)
  const updates: EnrichmentCandidate["updates"] = {}
  const evidence: FieldEvidence[] = []

  for (const field of ["pricing_type", "submission_url"] as const) {
    const current = channel[field]
    const eligible =
      field === "pricing_type"
        ? current === "unknown" || enrichedFields.includes(field)
        : current == null || enrichedFields.includes(field)
    if (!eligible) continue
    const candidate = normalized
      .flatMap((item) => item.evidence)
      .find((item) => item.field === field)
    if (candidate && current !== candidate.value) {
      updates[field] = candidate.value
      evidence.push(candidate)
    }
  }

  return {
    channel_id: channel.id,
    updates,
    evidence,
    rejected: normalized.flatMap((item) => item.rejected),
    has_source_claim: normalized.some((item) => item.source_claim != null),
  }
}
