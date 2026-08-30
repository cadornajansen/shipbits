import { z } from "zod"

export const importStatuses = [
  "queued",
  "extracting",
  "generating",
  "ready",
  "failed",
] as const

export const importUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .refine((value) => {
    const protocol = new URL(value).protocol
    return protocol === "http:" || protocol === "https:"
  }, "URL must use http or https.")
