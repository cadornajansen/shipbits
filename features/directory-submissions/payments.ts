import "server-only"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { retrievePaymentIntent } from "@/lib/paymongo/qrph"
import { invalidatePublicProducts } from "@/features/products/public-cache"
import { getActiveDirectories, getMatchingProfile } from "./queries"
import { matchDirectories } from "./matching"

export async function confirmDirectoryPayment(
  paymentId: string,
  eventId: string | null = null
): Promise<boolean> {
  const db = createAdminClient()
  const { data: payment, error } = await db
    .from("listing_payments")
    .select(
      "id,campaign_id,amount_centavos,currency,status,provider_payment_intent_id"
    )
    .eq("id", paymentId)
    .single()
  if (error || !payment.campaign_id)
    throw new Error("Campaign payment not found.")
  if (payment.status === "paid") return true
  if (!payment.provider_payment_intent_id.startsWith("pi_")) return false
  const intent = await retrievePaymentIntent(payment.provider_payment_intent_id)
  const attributes = intent.data.attributes
  if (attributes.status !== "succeeded") return false
  if (
    attributes.amount !== payment.amount_centavos ||
    attributes.currency !== payment.currency
  )
    throw new Error("Payment amount or currency mismatch.")
  const { data: campaign, error: campaignError } = await db
    .from("directory_campaigns")
    .select("id,product_id,submission_id,target_count")
    .eq("id", payment.campaign_id)
    .single()
  if (campaignError) throw new Error("Campaign not found.")
  const [profile, catalog] = await Promise.all([
    getMatchingProfile(campaign),
    getActiveDirectories(),
  ])
  const matches = matchDirectories(
    catalog,
    profile.category,
    profile.tags,
    campaign.target_count
  )
  const { error: fulfillmentError } = await db.rpc(
    "fulfill_directory_payment",
    {
      p_payment_id: payment.id,
      p_event_id: eventId,
      p_provider_payment_id: attributes.payments?.[0]?.id ?? null,
      p_product_slug:
        `${profile.slug || "product"}-${campaign.submission_id?.slice(0, 8) ?? campaign.id.slice(0, 8)}`.slice(
          0,
          120
        ),
      p_directory_ids: matches.map((directory) => directory.id),
    }
  )
  if (fulfillmentError) throw new Error(fulfillmentError.message)
  invalidatePublicProducts()
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/directory-submissions", "layout")
  revalidatePath("/admin/directory-submissions", "layout")
  return true
}
