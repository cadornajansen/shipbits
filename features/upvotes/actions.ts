"use server"

import { randomUUID } from "node:crypto"
import { invalidatePublicProducts } from "@/features/products/public-cache"

import { attachQrPhPayment, createQrPhPayment, retrievePaymentIntent } from "@/lib/paymongo/qrph"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { consumeRateLimit } from "@/lib/security/rate-limit"

type UpvoteCheckoutResult =
  | {
      amountCentavos: number
      paymentId: string
      qrExpiresAt: string
      qrImageUrl: string
      ok: true
    }
  | { error: string; ok: false }

function wholePesosToCentavos(value: string) {
  const amount = value.trim()
  if (!/^\d+$/.test(amount)) return null

  const amountCentavos = Number(amount) * 100

  return Number.isSafeInteger(amountCentavos) && amountCentavos >= 100 && amountCentavos <= 1_000_000
    ? amountCentavos
    : null
}

async function resumePendingUpvote({
  amountCentavos,
  paymentId,
  paymentIntentId,
}: {
  amountCentavos: number
  paymentId: string
  paymentIntentId: string
}): Promise<UpvoteCheckoutResult | null> {
  if (!paymentIntentId.startsWith("pi_")) return null

  const intent = await retrievePaymentIntent(paymentIntentId)
  const existingQr = intent.data.attributes.next_action?.code?.image_url
  const qr = existingQr
    ? {
        qrExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        qrImageUrl: existingQr,
      }
    : await attachQrPhPayment({
        clientKey: intent.data.attributes.client_key,
        idempotencyKey: `product-upvote:${paymentId}`,
        paymentIntentId,
      })

  return {
    amountCentavos,
    paymentId,
    qrExpiresAt: qr.qrExpiresAt,
    qrImageUrl: qr.qrImageUrl,
    ok: true,
  }
}

export async function startProductUpvotePaymentAction(
  productId: string,
  amountPesos: string
): Promise<UpvoteCheckoutResult> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to upvote a product.", ok: false }
  const rateLimit = await consumeRateLimit({ action: "upvote-payment", userId: user.id })
  if (!rateLimit.allowed) {
    return { error: "Too many payment attempts. Please try again later.", ok: false }
  }

  const amountCentavos = wholePesosToCentavos(amountPesos)
  if (!amountCentavos) {
    return {
      error: "Enter a whole-peso amount between ₱1 and ₱10,000.",
      ok: false,
    }
  }

  const admin = createAdminClient()
  const { data: product } = await admin
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .eq("moderation_status", "published")
    .is("archived_at", null)
    .maybeSingle()
  if (!product) return { error: "This product is no longer available.", ok: false }

  const { data: activePayment } = await admin
    .from("product_upvotes")
    .select("id, amount_centavos, provider_payment_intent_id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle()

  if (activePayment) {
    try {
      const resumed = await resumePendingUpvote({
        amountCentavos: activePayment.amount_centavos as number,
        paymentId: activePayment.id as string,
        paymentIntentId: activePayment.provider_payment_intent_id as string,
      })
      if (resumed) return resumed
    } catch {
      await admin
        .from("product_upvotes")
        .update({ status: "expired" })
        .eq("id", activePayment.id)
    }
  }

  const paymentId = randomUUID()
  const { error: pendingError } = await admin.from("product_upvotes").insert({
    amount_centavos: amountCentavos,
    id: paymentId,
    product_id: productId,
    provider_payment_intent_id: `pending:${paymentId}`,
    status: "pending",
    user_id: user.id,
  })
  if (pendingError) {
    return { error: "A payment is already being prepared. Please try again.", ok: false }
  }

  try {
    const qr = await createQrPhPayment({
      amountCentavos,
      description: `ShipBits upvote for ${product.name}`.slice(0, 255),
      idempotencyKey: `product-upvote:${paymentId}`,
    })
    const { error } = await admin
      .from("product_upvotes")
      .update({
        provider_payment_intent_id: qr.paymentIntentId,
        qr_expires_at: qr.qrExpiresAt,
      })
      .eq("id", paymentId)
    if (error) throw new Error("Unable to save the payment attempt.")

    return { amountCentavos, paymentId, ...qr, ok: true }
  } catch (error) {
    await admin
      .from("product_upvotes")
      .update({ status: "failed" })
      .eq("id", paymentId)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create a QR Ph payment.",
      ok: false,
    }
  }
}

export async function getProductUpvotePaymentStatusAction(paymentId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Sign in to view payment status.", ok: false as const }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_upvotes")
    .select("status")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (error || !data) {
    return { error: "Payment status is unavailable.", ok: false as const }
  }

  // Refreshing the browser must read totals that include this confirmed payment.
  if (data.status === "paid") invalidatePublicProducts()

  return {
    ok: true as const,
    status: data.status as "pending" | "paid" | "failed" | "expired",
  }
}
