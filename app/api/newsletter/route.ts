import { saveNewsletterSubscription } from "@/features/newsletter/persistence"
import { newsletterSchema } from "@/features/newsletter/validation"
import { enforcePublicRateLimit } from "@/lib/security/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/security/request"
import { createAdminClient } from "@/lib/supabase/admin"
import { logServerError } from "@/lib/observability/logger"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
  const limited = await enforcePublicRateLimit(request, "newsletter")
  if (limited) return limited

  try {
    const parsed = newsletterSchema.safeParse(await readJsonBody(request, 1024))
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      )
    }

    const result = await saveNewsletterSubscription(
      createAdminClient(),
      parsed.data
    )
    return Response.json(result, {
      status: result.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      )
    }

    // Do not include an email address or provider error payload in public logs.
    logServerError("newsletter_signup_failed")
    return Response.json(
      {
        ok: false,
        error: "Signup is temporarily unavailable. Try again shortly.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
