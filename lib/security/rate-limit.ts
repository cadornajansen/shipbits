import "server-only"

import { createHmac } from "node:crypto"
import { isIP } from "node:net"
import { createAdminClient } from "@/lib/supabase/admin"

type PublicScope = "seo-checker" | "newsletter"

const limits: Record<PublicScope, { perClient: number; perHour: number }> = {
  "seo-checker": { perClient: 5, perHour: 100 },
  newsletter: { perClient: 5, perHour: 200 },
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

export async function enforcePublicRateLimit(
  request: Request,
  scope: PublicScope
): Promise<Response | null> {
  try {
    const secret = process.env.PUBLIC_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) throw new Error("Rate limiter is not configured")
    const hash = createHmac("sha256", secret)
      .update(`${scope}:${clientIdentifier(request)}`)
      .digest("hex")
    const { data, error } = await createAdminClient().rpc("consume_public_rate_limit", {
      p_scope: scope,
      p_identifier_hash: hash,
      p_window_seconds: 600,
      p_limit: limits[scope].perClient,
      p_global_limit: limits[scope].perHour,
    })
    if (error || !Array.isArray(data) || !data[0]) {
      throw new Error("Rate limiter unavailable")
    }
    const result = data[0] as { allowed: boolean; retry_after_seconds: number }
    if (result.allowed === true) return null
    const retryAfter = Math.max(1, Number(result.retry_after_seconds) || 600)
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    )
  } catch {
    // Fail closed: a database outage must not enable unlimited network work.
    console.error(`[public:${scope}] Rate limiter unavailable. Check the public content migration.`)
    return Response.json(
      { error: "This tool is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
    )
  }
}
