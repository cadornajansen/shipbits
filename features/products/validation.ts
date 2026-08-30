import { z } from "zod"

import { MAX_PRODUCT_TAGS, parseProductTags } from "@/features/products/tags"

export const productStatuses = ["draft", "published", "rejected"] as const

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const categoryIdSchema = z.string().uuid("Choose a category.")

export const longDescriptionSchema = z
  .string()
  .max(5000, "Long description must be 5,000 characters or fewer.")
  .transform((value) => value.trim() || null)

export const productNameSchema = z
  .string()
  .trim()
  .min(1, "Product name is required.")
  .max(120)

export const shortDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Short description is required.")
  .max(280, "Short description must be 280 characters or fewer.")

export const taglineSchema = z
  .string()
  .trim()
  .min(1, "Tagline is required.")
  .refine(
    (value) => value.split(/\s+/).filter(Boolean).length <= 15,
    "Tagline must be 15 words or fewer."
  )

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(120)
  .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens.")

export const websiteUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol
      return protocol === "http:" || protocol === "https:"
    } catch {
      return false
    }
  }, "URL must use http or https.")

export const normalizedDomainSchema = z
  .string()
  .min(1, "Website domain is required.")
  .max(253, "Website domain is too long.")
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    "Website domain is invalid."
  )

export const productSchema = z.object({
  categoryId: categoryIdSchema,
  longDescription: longDescriptionSchema,
  moderationStatus: z.enum(productStatuses),
  name: productNameSchema,
  shortDescription: shortDescriptionSchema,
  slug: slugSchema,
  tagline: taglineSchema,
  tags: z.preprocess(parseProductTags, z.array(z.string()).max(MAX_PRODUCT_TAGS)),
  websiteUrl: websiteUrlSchema,
})

export type ProductInput = z.infer<typeof productSchema>

export function normalizeWebsiteUrl(value: string) {
  const url = new URL(value.trim())
  url.hash = ""
  return url.toString()
}

export function getNormalizedDomain(value: string) {
  const hostname = new URL(value).hostname.toLowerCase()
  return hostname.replace(/^www\./, "")
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function suggestedSlugFromUrl(value: string) {
  try {
    return slugify(getNormalizedDomain(value).replace(/\.[a-z]+$/i, ""))
  } catch {
    return ""
  }
}
