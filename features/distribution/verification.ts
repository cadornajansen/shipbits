import { randomUUID } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { safeFetchText, SafeFetchError } from "@/lib/security/safe-fetch"
import { checkDatabaseError } from "./repository"
import type { Channel, UrlCheck } from "./types"

export async function checkChannelUrl(url: string): Promise<UrlCheck> {
  try {
    const result = await safeFetchText(url, {
      timeoutMs: 6000,
      maxBytes: 512000,
      maxRedirects: 3,
    })
    return {
      requested_url: url,
      reachable: result.status >= 200 && result.status < 400,
      http_status: result.status,
      final_url: result.url,
      failure: result.status >= 400 ? `HTTP ${result.status}` : null,
    }
  } catch (error) {
    return {
      requested_url: url,
      reachable: false,
      http_status: null,
      final_url: null,
      failure: error instanceof SafeFetchError ? error.code : "fetch_failed",
    }
  }
}

export type VerificationSummary = {
  checked: number
  failed: { id: string; error: string }[]
  claimed: number
  unhealthy: number
}
export async function verifyChannels(
  db: SupabaseClient,
  input: { ids?: string[]; stale: boolean },
  actor: string | null
): Promise<VerificationSummary> {
  const token = randomUUID()
  const claimed = await db.rpc("distribution_claim_verification", {
    p_ids: input.ids ?? [],
    p_stale: input.stale,
    p_token: token,
  })
  checkDatabaseError(claimed.error)
  const channels = (claimed.data ?? []) as Channel[]
  const result: VerificationSummary = {
    checked: 0,
    failed: [],
    claimed: channels.length,
    unhealthy: 0,
  }
  let next = 0
  // Three workers, sequential website/submission requests: at most three sockets.
  await Promise.all(
    Array.from({ length: Math.min(3, channels.length) }, async () => {
      while (next < channels.length) {
        const channel = channels[next++]
        try {
          const website = await checkChannelUrl(channel.website_url)
          const submission = channel.submission_url
            ? await checkChannelUrl(channel.submission_url)
            : null
          const saved = await db.rpc("distribution_finish_verification", {
            p_id: channel.id,
            p_token: token,
            p_website: website,
            p_submission: submission,
            p_actor: actor,
          })
          checkDatabaseError(saved.error)
          if (!saved.data)
            throw new Error(
              "Channel was archived or its verification lease changed."
            )
          result.checked++
          if (!website.reachable || (submission && !submission.reachable))
            result.unhealthy++
        } catch {
          result.failed.push({
            id: channel.id,
            error:
              "Could not persist verification; retry after the five-minute lease expires.",
          })
        }
      }
    })
  )
  return result
}
