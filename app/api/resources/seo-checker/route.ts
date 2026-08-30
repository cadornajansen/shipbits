import { analyzeSeoPage } from "@/features/seo-checker/analyze"
import { seoCheckerInputSchema } from "@/features/seo-checker/validation"
import { enforcePublicRateLimit } from "@/lib/security/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/security/request"
import { SafeFetchError, parsePublicUrl } from "@/lib/security/safe-fetch"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" }
  try {
    const input = seoCheckerInputSchema.safeParse(await readJsonBody(request))
    if (!input.success) {
      return Response.json({ error: input.error.issues[0]?.message ?? "Enter a valid website URL." }, { status: 400, headers })
    }

    const url = parsePublicUrl(input.data.url)
    const limited = await enforcePublicRateLimit(request, "seo-checker")
    if (limited) return limited

    const result = await analyzeSeoPage(url.toString())
    return Response.json({ result }, { headers })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status, headers })
    }
    if (error instanceof SafeFetchError) {
      const status = ["invalid_url", "blocked_target"].includes(error.code) ? 400 : 422
      return Response.json({ error: error.message }, { status, headers })
    }
    // Deliberately omit submitted URLs, page bodies, network addresses, and raw errors.
    console.error("[seo-checker] Unexpected check failure.")
    return Response.json({ error: "The check could not be completed. Please try again shortly." }, { status: 500, headers })
  }
}
