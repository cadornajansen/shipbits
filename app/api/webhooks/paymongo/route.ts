import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { invalidatePublicProducts } from "@/features/products/public-cache"

import { slugify } from "@/features/products/validation"
import { retrievePaymentIntent } from "@/lib/paymongo/qrph"
import {
  getWebhookPaymentIntentId,
  parsePayMongoWebhook,
  verifyPayMongoWebhook,
} from "@/lib/paymongo/webhooks"
import { createAdminClient } from "@/lib/supabase/admin"

function paymentIdFromEvent(event: ReturnType<typeof parsePayMongoWebhook>) {
  const resource = event.data.attributes.data
  return resource?.type === "payment" ? (resource.id ?? null) : null
}

async function getAvailableSlug({
  base,
  supabase,
}: {
  base: string
  supabase: ReturnType<typeof createAdminClient>
}) {
  const normalizedBase = (slugify(base) || "listing").slice(0, 110)

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix
      ? `${normalizedBase.slice(0, 120 - String(suffix).length - 1)}-${suffix}`
      : normalizedBase
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (!data) return candidate
  }

  throw new Error("Unable to generate a unique product slug.")
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signatureHeader =
    request.headers.get("paymongo-signature") ??
    request.headers.get("x-paymongo-signature")

  if (!verifyPayMongoWebhook({ rawBody, signatureHeader })) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    )
  }

  let event: ReturnType<typeof parsePayMongoWebhook>
  try {
    event = parsePayMongoWebhook(rawBody)
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    )
  }

  const eventType = event.data.attributes.type
  const paymentIntentId = getWebhookPaymentIntentId(event)
  const eventId = event.data.id
  if (!paymentIntentId || !eventId) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const { data: payment } = await supabase
    .from("listing_payments")
    .select("id, amount_centavos, currency, status, submission_id")
    .eq("provider_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (!payment) {
    const { data: upvote } = await supabase
      .from("product_upvotes")
      .select("id, amount_centavos, currency, status")
      .eq("provider_payment_intent_id", paymentIntentId)
      .maybeSingle()

    if (!upvote) return NextResponse.json({ received: true })

    if (eventType === "payment.failed" || eventType === "qrph.expired") {
      await supabase
        .from("product_upvotes")
        .update({
          provider_event_id: eventId,
          status: eventType === "qrph.expired" ? "expired" : "failed",
        })
        .eq("id", upvote.id)
        .eq("status", "pending")
      return NextResponse.json({ received: true })
    }

    if (eventType !== "payment.paid" || upvote.status === "paid") {
      return NextResponse.json({ received: true })
    }

    try {
      const intent = await retrievePaymentIntent(paymentIntentId)
      const attributes = intent.data.attributes
      if (
        attributes.status !== "succeeded" ||
        attributes.amount !== upvote.amount_centavos ||
        attributes.currency !== upvote.currency
      ) {
        console.error("PayMongo product upvote verification failed", {
          paymentIntentId,
          upvoteId: upvote.id,
        })
        return NextResponse.json({ received: true })
      }

      const { error } = await supabase
        .from("product_upvotes")
        .update({
          paid_at: new Date().toISOString(),
          provider_event_id: eventId,
          provider_payment_id: paymentIdFromEvent(event),
          status: "paid",
        })
        .eq("id", upvote.id)
        .eq("status", "pending")
      if (error) {
        console.error("PayMongo product upvote fulfillment failed", {
          error: error.message,
          upvoteId: upvote.id,
        })
      } else {
        invalidatePublicProducts()
      }
    } catch (error) {
      console.error("PayMongo product upvote webhook handling failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        upvoteId: upvote.id,
      })
    }

    return NextResponse.json({ received: true })
  }

  if (eventType === "payment.failed" || eventType === "qrph.expired") {
    await supabase
      .from("listing_payments")
      .update({
        provider_event_id: eventId,
        status: eventType === "qrph.expired" ? "expired" : "failed",
      })
      .eq("id", payment.id)
      .eq("status", "pending")

    await supabase
      .from("listing_submissions")
      .update({ status: "draft" })
      .eq("id", payment.submission_id)
      .eq("status", "pending_payment")

    return NextResponse.json({ received: true })
  }

  if (eventType !== "payment.paid" || payment.status === "paid") {
    return NextResponse.json({ received: true })
  }

  try {
    const intent = await retrievePaymentIntent(paymentIntentId)
    const attributes = intent.data.attributes
    if (
      attributes.status !== "succeeded" ||
      attributes.amount !== payment.amount_centavos ||
      attributes.currency !== payment.currency
    ) {
      console.error("PayMongo payment intent verification failed", {
        paymentId: payment.id,
        paymentIntentId,
      })
      return NextResponse.json({ received: true })
    }

    const { data: submission } = await supabase
      .from("listing_submissions")
      .select("name, normalized_domain, slug")
      .eq("id", payment.submission_id)
      .maybeSingle()

    if (!submission) {
      console.error("Submission missing during PayMongo fulfillment", {
        paymentId: payment.id,
      })
      return NextResponse.json({ received: true })
    }

    const productSlug = await getAvailableSlug({
      base: submission.slug || submission.name || submission.normalized_domain,
      supabase,
    })
    const { error: fulfillmentError } = await supabase.rpc(
      "fulfill_listing_payment",
      {
        p_listing_payment_id: payment.id,
        p_product_slug: productSlug,
        p_provider_event_id: eventId,
        p_provider_payment_id: paymentIdFromEvent(event),
      }
    )

    if (fulfillmentError) {
      console.error("PayMongo fulfillment failed", {
        error: fulfillmentError.message,
        paymentId: payment.id,
      })
    } else {
      invalidatePublicProducts()
      revalidatePath("/admin/products")
      revalidatePath("/dashboard")
    }
  } catch (error) {
    console.error("PayMongo webhook handling failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      paymentId: payment.id,
    })
  }

  return NextResponse.json({ received: true })
}
