import { z } from "zod"

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .transform((value) => value || null)

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine(
    (value) =>
      value === null ||
      (() => {
        try {
          const url = new URL(value)
          return url.protocol === "https:" || url.protocol === "http:"
        } catch {
          return false
        }
      })(),
    "Enter a valid http or https URL."
  )

export const profileSchema = z.object({
  bio: optionalText(500),
  displayName: optionalText(80),
  githubUrl: optionalUrl,
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => value || null)
    .refine(
      (value) =>
        value === null || /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(value),
      "Use 1–30 lowercase letters, numbers, or hyphens."
    ),
  headline: optionalText(120),
  linkedinUrl: optionalUrl,
  location: optionalText(100),
  role: optionalText(80),
  websiteUrl: optionalUrl,
})

export type ProfileInput = z.infer<typeof profileSchema>
