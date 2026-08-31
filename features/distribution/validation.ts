import { z } from "zod"
import {
  channelTypes,
  channelStatuses,
  pricingTypes,
  type DistributionFilters,
} from "./types"
import { normalizeUrl } from "./normalization"

const url = z
  .string()
  .trim()
  .max(2048)
  .transform((value, context) => {
    try {
      return normalizeUrl(value).url
    } catch {
      context.addIssue({
        code: "custom",
        message:
          "Use a valid http/https URL without credentials or custom ports.",
      })
      return z.NEVER
    }
  })
const score = z.number().int().min(0).max(100).nullable()
const tier = z.number().int().min(1).max(5).nullable()
const channelObject = z.object({
    name: z.string().trim().min(1).max(160),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    description: z.string().trim().max(10000),
    website_url: url,
    submission_url: url.nullable(),
    channel_type: z.enum(channelTypes).nullable(),
    pricing_type: z.enum(pricingTypes),
    price_amount: z.number().min(0).max(1000000).nullable(),
    price_currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
    requires_account: z.boolean().nullable(),
    requires_email_verification: z.boolean().nullable(),
    requires_manual_review: z.boolean().nullable(),
    requires_payment: z.boolean().nullable(),
    estimated_submission_minutes: z.number().int().min(1).max(10080).nullable(),
    backlink_possible: z.boolean().nullable(),
    dofollow_possible: z.boolean().nullable(),
    traffic_tier: tier,
    authority_score: score,
    quality_score: score,
    competition_score: score,
    submission_difficulty: tier,
    submission_requirements: z
      .record(z.string(), z.json())
      .refine(
        (value) => JSON.stringify(value).length <= 20000,
        "Requirements must be under 20,000 characters."
      ),
    status: z.enum(channelStatuses),
  })
export const channelSchema = channelObject
  .refine(
    (channel) => (channel.price_amount === null) === (channel.price_currency === null),
    { message: "Price amount and currency must both be set or both be unknown.", path: ["price_currency"] }
  )
  .strict()
export const tagsSchema = z
  .array(
    z
      .object({
        tag_id: z.uuid(),
        relevance_score: score,
        confidence_score: score,
      })
      .strict()
  )
  .max(100)
  .refine(
    (tags) => new Set(tags.map((tag) => tag.tag_id)).size === tags.length,
    "Select each tag once."
  )
export const saveSchema = z
  .object({
    id: z.uuid().nullable(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
    channel: channelSchema,
    tags: tagsSchema,
  })
  .strict()
export const quickSchema = z
  .object({
    id: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    patch: channelObject
      .pick({
        status: true,
        channel_type: true,
        pricing_type: true,
        quality_score: true,
      })
      .partial()
      .refine(
        (patch) => Object.keys(patch).length === 1,
        "Change one field at a time."
      ),
  })
  .strict()
const ids = z
  .array(z.uuid())
  .min(1)
  .max(500)
  .refine((items) => new Set(items).size === items.length)
export const bulkSchema = z.discriminatedUnion("operation", [
  z.object({
    ids,
    operation: z.literal("status"),
    value: z.enum(channelStatuses),
  }),
  z.object({ ids, operation: z.literal("type"), value: z.enum(channelTypes) }),
  z.object({
    ids,
    operation: z.literal("pricing"),
    value: z.enum(pricingTypes),
  }),
  z.object({
    ids,
    operation: z.enum(["add_tag", "remove_tag"]),
    value: z.uuid(),
  }),
  z.object({ ids, operation: z.literal("archive"), value: z.literal("") }),
])
export type BulkInput = z.infer<typeof bulkSchema>
export const verifySchema = z
  .object({
    ids: z.array(z.uuid()).max(10).optional(),
    stale: z.boolean().default(false),
  })
  .refine(
    (input) => input.stale !== Boolean(input.ids?.length),
    "Choose selected channels or stale channels."
  )

export function parseFilters(
  params: Record<string, string | string[] | undefined>
): DistributionFilters {
  const one = (key: string): string =>
    typeof params[key] === "string" ? params[key] : ""
  const positive = (key: string, fallback: number, max: number): number =>
    Math.min(max, Math.max(1, Math.floor(Number(one(key)) || fallback)))
  return {
    search: one("search").trim().slice(0, 160),
    type: channelTypes.find((item) => item === one("type")) ?? "",
    status: channelStatuses.find((item) => item === one("status")) ?? "",
    pricing: pricingTypes.find((item) => item === one("pricing")) ?? "",
    region: /^[a-z0-9-]{1,80}$/.test(one("region")) ? one("region") : "",
    sort:
      one("sort") === "quality_score"
        ? "quality_score"
        : one("sort") === "last_verified_at"
          ? "last_verified_at"
          : "name",
    direction: one("direction") === "desc" ? "desc" : "asc",
    page: positive("page", 1, 100000),
    pageSize: [25, 50, 100].includes(Number(one("pageSize")))
      ? Number(one("pageSize"))
      : 25,
  }
}
