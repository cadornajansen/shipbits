import { findRankedDistributionChannels } from "@/features/distribution/finder-queries"
import { enforcePublicRateLimit } from "@/lib/security/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/security/request"
import { logServerError } from "@/lib/observability/logger"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" }
  try {
    const limited = await enforcePublicRateLimit(request, "distribution-finder")
    if (limited) return limited
    const result = await findRankedDistributionChannels(await readJsonBody(request))
    return Response.json({ result }, { headers })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return Response.json({ error: error.message }, { status: error.status, headers })
    if (error instanceof Error && error.name === "ZodError")
      return Response.json({ error: "Enter a product name and a short description." }, { status: 400, headers })
    logServerError("distribution_finder_failed")
    return Response.json({ error: "The finder could not be completed. Please try again shortly." }, { status: 500, headers })
  }
}
