import "server-only"

import { z } from "zod"

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().refine(
    (value) => process.env.NODE_ENV !== "production" || new URL(value).protocol === "https:",
    "must use HTTPS in production"
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PUBLIC_RATE_LIMIT_SALT: z.string().min(16),
})

const productionIntegrationEnvSchema = serverEnvSchema.extend({
  ASSEMBLYAI_API_KEY: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_BUCKET: z.string().min(1),
  CLOUDFLARE_R2_PUBLIC_URL: z.url().refine((value) => new URL(value).protocol === "https:"),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  FIRECRAWL_API_KEY: z.string().min(1),
  NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.email(),
  PAYMONGO_SECRET_KEY: z.string().min(1),
  PAYMONGO_WEBHOOK_SECRET: z.string().min(1),
  PUBLIC_TRUSTED_IP_HEADER: z.enum(["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]).optional(),
})

export function validateCoreServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")
    throw new Error(`Required server environment is invalid or missing: ${names}`)
  }
  return parsed.data
}

export function validateProductionServerEnv() {
  const parsed = productionIntegrationEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ")
    throw new Error(`Required production environment is invalid or missing: ${names}`)
  }
  return parsed.data
}
