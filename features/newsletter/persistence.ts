import type { SupabaseClient } from "@supabase/supabase-js"

import {
  NEWSLETTER_SUCCESS_MESSAGE,
  type NewsletterInput,
  type NewsletterResult,
} from "./validation"

export async function saveNewsletterSubscription(
  client: SupabaseClient,
  input: NewsletterInput
): Promise<NewsletterResult> {
  const { error } = await client.from("newsletter_subscribers").upsert(
    { email: input.email, status: "subscribed" },
    // A duplicate signup must not reactivate a previously unsubscribed address.
    { onConflict: "email", ignoreDuplicates: true }
  )

  if (error) {
    return {
      ok: false,
      error: "We couldn't save your signup. Please try again shortly.",
    }
  }

  // Never disclose whether the address already exists or its current status.
  return { ok: true, message: NEWSLETTER_SUCCESS_MESSAGE }
}
