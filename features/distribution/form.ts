import { channelSchema } from "./validation"
import { channelSlug } from "./normalization"
import type { ChannelInput } from "./types"

export const booleanFields = [
  "requires_account",
  "requires_email_verification",
  "requires_manual_review",
  "requires_payment",
  "backlink_possible",
  "dofollow_possible",
] as const
export const numberFields = [
  "price_amount",
  "estimated_submission_minutes",
  "quality_score",
  "authority_score",
  "traffic_tier",
  "competition_score",
  "submission_difficulty",
] as const
export function channelFromForm(form: FormData): ChannelInput {
  const text = (key: string): string => String(form.get(key) ?? "").trim()
  const values = Object.fromEntries(
    [...form.entries()].filter(([key]) => !key.startsWith("tag-"))
  )
  const requirements: unknown = JSON.parse(
    text("submission_requirements") || "{}"
  )
  return channelSchema.parse({
    ...values,
    slug: text("slug") || channelSlug(text("name")),
    submission_url: text("submission_url") || null,
    channel_type: text("channel_type") || null,
    price_currency: text("price_currency").toUpperCase() || null,
    submission_requirements: requirements,
    ...Object.fromEntries(
      booleanFields.map((key) => [
        key,
        text(key) === "unknown" ? null : text(key) === "true",
      ])
    ),
    ...Object.fromEntries(
      numberFields.map((key) => [
        key,
        text(key) === "" ? null : Number(text(key)),
      ])
    ),
  })
}
