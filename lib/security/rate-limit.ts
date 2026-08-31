import "server-only"

import { createHmac } from "node:crypto"
import { isIP } from "node:net"
import { logServerError } from "@/lib/observability/logger"
import { createAdminClient } from "@/lib/supabase/admin"

export type RateLimitAction =
  | "seo-checker"
  | "distribution-finder"
  | "newsletter"
  | "autocomplete"
  | "listing-payment"
  | "directory-campaign"
  | "directory-payment"
  | "import-generation"
  | "upvote-payment"

export const rateLimits: Record<
  RateLimitAction,
  { limit: number; windowSeconds: number; globalLimit: number }
> = {
  "seo-checker": { limit: 5, windowSeconds: 60, globalLimit: 100 },
  "distribution-finder": { limit: 10, windowSeconds: 60, globalLimit: 250 },
  newsletter: { limit: 5, windowSeconds: 3600, globalLimit: 200 },
  autocomplete: { limit: 5, windowSeconds: 600, globalLimit: 500 },
  "listing-payment": { limit: 5, windowSeconds: 600, globalLimit: 500 },
  "directory-campaign": { limit: 10, windowSeconds: 3600, globalLimit: 500 },
  "directory-payment": { limit: 5, windowSeconds: 600, globalLimit: 500 },
  "import-generation": { limit: 20, windowSeconds: 3600, globalLimit: 100 },
  "upvote-payment": { limit: 5, windowSeconds: 600, globalLimit: 500 },
}

function clientIdentifier(request: Request): string {
  // Enable only a header that YOUR reverse proxy overwrites. With no trusted
  // proxy configured, callers share one bucket instead of trusting spoofed IPs.
  const header = process.env.PUBLIC_TRUSTED_IP_HEADER
  const allowedHeaders = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"]
  if (!header || !allowedHeaders.includes(header)) return "shared"
  const address = request.headers.get(header)?.split(",")[0]?.trim()
  return address && isIP(address) ? address : "shared"
}

export async function consumeRateLimit({
  action,
  request,
  userId,
}: {
  action: RateLimitAction
  request?: Request
  userId?: string
}): Promise<
  | { allowed: true }
  | { allowed: false; retryAfter: number; unavailable: boolean }
> {
  try {
    const secret =
      process.env.PUBLIC_RATE_LIMIT_SALT ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) throw new Error("Rate limiter is not configured")
    const identifier = userId
      ? `user:${userId}`
      : request
        ? `client:${clientIdentifier(request)}`
        : "shared"
    const hash = createHmac("sha256", secret)
      .update(`${action}:${identifier}`)
      .digest("hex")
    const config = rateLimits[action]
    const { data, error } = await createAdminClient().rpc(
      "consume_public_rate_limit",
      {
        p_scope: action,
        p_identifier_hash: hash,
        p_window_seconds: config.windowSeconds,
        p_limit: config.limit,
        p_global_limit: config.globalLimit,
      }
    )
    if (error || !Array.isArray(data) || !data[0]) {
      throw new Error("Rate limiter unavailable")
    }
    const result = data[0] as { allowed: boolean; retry_after_seconds: number }
    if (result.allowed === true) return { allowed: true }
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Number(result.retry_after_seconds) || config.windowSeconds
      ),
      unavailable: false,
    }
  } catch {
    logServerError("rate_limit_unavailable", { action })
    return { allowed: false, retryAfter: 60, unavailable: true }
  }
}

export async function enforcePublicRateLimit(
  request: Request,
  action: "seo-checker" | "newsletter" | "distribution-finder"
): Promise<Response | null> {
  if (process.env.NODE_ENV === "development") return null
  const result = await consumeRateLimit({ action, request })
  if (result.allowed) return null
  if (!result.unavailable) {
    return Response.json(
      {
        error: `Too many requests. Please wait ${result.retryAfter} seconds and try again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "Cache-Control": "no-store",
        },
      }
    )
  }
  return Response.json(
    {
      error: "This tool is temporarily unavailable. Please try again shortly.",
    },
    {
      status: 503,
      headers: {
        "Retry-After": String(result.retryAfter),
        "Cache-Control": "no-store",
      },
    }
  )
}
