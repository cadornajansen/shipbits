import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { invalidatePublicProducts } from "@/features/products/public-cache"

import { slugify } from "@/features/products/validation"
import { retrievePaymentIntent } from "@/lib/paymongo/qrph"
import { logServerError, logServerWarning } from "@/lib/observability/logger"
import {
  getWebhookPaymentIntentId,
  parsePayMongoWebhook,
  verifyPayMongoWebhook,
} from "@/lib/paymongo/webhooks"
import { createAdminClient } from "@/lib/supabase/admin"
import { confirmDirectoryPayment } from "@/features/directory-submissions/payments"
import { readTextBody, RequestBodyError } from "@/lib/security/request"

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
  let rawBody: string
  try {
    rawBody = await readTextBody(request)
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    )
  }
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
  const { data: payment, error: paymentLookupError } = await supabase
    .from("listing_payments")
    .select("id, amount_centavos, currency, status, submission_id, campaign_id")
    .eq("provider_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (paymentLookupError)
    return NextResponse.json(
      { error: "Payment lookup failed." },
      { status: 500 }
    )
  if (payment?.campaign_id) {
    try {
      if (eventType === "payment.paid") {
        if (!(await confirmDirectoryPayment(payment.id, eventId))) {
          return NextResponse.json(
            { error: "Payment confirmation is pending." },
            { status: 503 }
          )
        }
      } else if (
        eventType === "payment.failed" ||
        eventType === "qrph.expired"
      ) {
        // A late failure notification must never undo an already succeeded intent.
        if (!(await confirmDirectoryPayment(payment.id, eventId))) {
          const { error } = await supabase
            .from("listing_payments")
            .update({
              status: eventType === "qrph.expired" ? "expired" : "failed",
              provider_event_id: eventId,
            })
            .eq("id", payment.id)
            .eq("status", "pending")
          if (error) throw error
        }
      }
      return NextResponse.json({ received: true })
    } catch (error) {
      logServerError("paymongo_directory_webhook_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        eventId,
        paymentId: payment.id,
        paymentIntentId,
      })
      return NextResponse.json(
        { error: "Campaign fulfillment failed; retry required." },
        { status: 500 }
      )
    }
  }

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
        logServerWarning("paymongo_upvote_verification_failed", {
          eventId,
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
        logServerError("paymongo_upvote_fulfillment_failed", {
          error: error.message,
          eventId,
          paymentIntentId,
          upvoteId: upvote.id,
        })
      } else {
        invalidatePublicProducts()
      }
    } catch (error) {
      logServerError("paymongo_upvote_webhook_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        eventId,
        paymentIntentId,
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
      logServerWarning("paymongo_listing_verification_failed", {
        eventId,
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
      logServerWarning("paymongo_listing_submission_missing", {
        eventId,
        paymentId: payment.id,
        paymentIntentId,
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
      logServerError("paymongo_listing_fulfillment_failed", {
        error: fulfillmentError.message,
        eventId,
        paymentId: payment.id,
        paymentIntentId,
      })
    } else {
      invalidatePublicProducts()
      revalidatePath("/admin/products")
      revalidatePath("/dashboard")
    }
  } catch (error) {
    logServerError("paymongo_listing_webhook_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      eventId,
      paymentId: payment.id,
      paymentIntentId,
    })
  }

  return NextResponse.json({ received: true })
}
