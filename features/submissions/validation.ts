import { z } from "zod"

import {
  categoryIdSchema,
  longDescriptionSchema,
  productNameSchema,
  shortDescriptionSchema,
  slugSchema,
  taglineSchema,
  websiteUrlSchema,
} from "@/features/products/validation"
import { MAX_PRODUCT_TAGS, parseProductTags } from "@/features/products/tags"

const optionalLongDescriptionSchema = z
  .union([longDescriptionSchema, z.literal("")])
  .transform((value) => value || null)

const optionalNameSchema = z
  .union([productNameSchema, z.literal("")])
  .transform((value) => value || null)

const optionalShortDescriptionSchema = z
  .union([shortDescriptionSchema, z.literal("")])
  .transform((value) => value || null)

const optionalSlugSchema = z
  .union([slugSchema, z.literal("")])
  .transform((value) => value || null)

const optionalTaglineSchema = z
  .union([taglineSchema, z.literal("")])
  .transform((value) => value || null)

export const submissionUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a product URL.")

export const listingSubmissionSchema = z.object({
  categoryId: z
    .union([categoryIdSchema, z.literal("")])
    .transform((value) => value || null),
  longDescription: optionalLongDescriptionSchema,
  name: optionalNameSchema,
  shortDescription: optionalShortDescriptionSchema,
  slug: optionalSlugSchema,
  tagline: optionalTaglineSchema,
  tags: z.preprocess(parseProductTags, z.array(z.string()).max(MAX_PRODUCT_TAGS)),
  websiteUrl: websiteUrlSchema,
})
