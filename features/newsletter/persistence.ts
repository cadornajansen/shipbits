import type { SupabaseClient } from "@supabase/supabase-js"

import { NEWSLETTER_SUCCESS_MESSAGE, type NewsletterInput } from "./validation"

export type NewsletterSaveResult =
  { ok: true; message: string; created: boolean } | { ok: false; error: string }

export async function saveNewsletterSubscription(
  client: SupabaseClient,
  input: NewsletterInput
): Promise<NewsletterSaveResult> {
  const { data, error } = await client
    .from("newsletter_subscribers")
    .upsert(
      { email: input.email, status: "subscribed" },
      // A duplicate signup must not reactivate a previously unsubscribed address.
      { onConflict: "email", ignoreDuplicates: true }
    )
    .select("id")

  if (error) {
    return {
      ok: false,
      error: "We couldn't save your signup. Please try again shortly.",
    }
  }

  // Never disclose whether the address already exists or its current status.
  return {
    ok: true,
    message: NEWSLETTER_SUCCESS_MESSAGE,
    created: data.length === 1,
  }
}
