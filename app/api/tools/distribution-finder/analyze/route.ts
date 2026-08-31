import { analyzeDistributionProductUrl } from "@/features/distribution/url-analysis"
import { enforcePublicRateLimit } from "@/lib/security/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/security/request"
import { SafeFetchError, parsePublicUrl } from "@/lib/security/safe-fetch"
import { logServerError } from "@/lib/observability/logger"
import { getTaxonomy } from "@/features/distribution/repository"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

function toProductRootUrl(url: URL): string {
  return new URL("/", url.origin).toString()
}

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" }
  try {
    const body = await readJsonBody(request)
    const url =
      typeof (body as { url?: unknown }).url === "string"
        ? (body as { url: string }).url.trim()
        : ""
    const normalized = parsePublicUrl(
      /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`
    )
    const limited = await enforcePublicRateLimit(request, "distribution-finder")
    if (limited) return limited
    const taxonomy = await getTaxonomy(createAdminClient())
    return Response.json(
      {
        result: await analyzeDistributionProductUrl(
          toProductRootUrl(normalized),
          taxonomy
        ),
      },
      { headers }
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers }
      )
    if (error instanceof SafeFetchError)
      return Response.json({ error: error.message }, { status: 422, headers })
    logServerError("distribution_finder_url_analysis_failed")
    return Response.json(
      {
        error:
          "We couldn't read this site automatically. Add the product details below.",
      },
      { status: 500, headers }
    )
  }
}
