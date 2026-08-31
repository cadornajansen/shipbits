import { z } from "zod"

export const newsletterSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Use an email address with 254 characters or fewer.")
    .email("Enter a valid email address."),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

export type NewsletterResult =
  { ok: true; message: string } | { ok: false; error: string }

export const NEWSLETTER_SUCCESS_MESSAGE =
  "You're on the list — check your inbox for a confirmation email."
