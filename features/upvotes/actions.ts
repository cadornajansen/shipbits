"use server"

import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { invalidatePublicProducts } from "@/features/products/public-cache"

import {
  createGuestUpvoteToken,
  GUEST_UPVOTE_COOKIE,
  hashGuestUpvoteToken,
  isGuestUpvoteToken,
} from "@/features/upvotes/guest"
import {
  attachQrPhPayment,
  createQrPhPayment,
  retrievePaymentIntent,
} from "@/lib/paymongo/qrph"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
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

type UpvoteOwner =
  | { kind: "user"; rateLimitIdentifier: string; userId: string }
  | { kind: "visitor"; rateLimitIdentifier: string; visitorIdHash: string }

function getGuestUpvoteSecret() {
  const secret =
    process.env.UPVOTE_VISITOR_TOKEN_SECRET ||
    process.env.PUBLIC_RATE_LIMIT_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) throw new Error("Guest upvotes are not configured.")
  return secret
}

async function getUpvoteOwner(
  userId: string | undefined
): Promise<UpvoteOwner> {
  if (userId) {
    return {
      kind: "user",
      rateLimitIdentifier: userId,
      userId,
    }
  }

  const cookieStore = await cookies()
  const existingToken = cookieStore.get(GUEST_UPVOTE_COOKIE)?.value
  const token = isGuestUpvoteToken(existingToken)
    ? existingToken
    : createGuestUpvoteToken()

  if (token !== existingToken) {
    cookieStore.set(GUEST_UPVOTE_COOKIE, token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  const visitorIdHash = hashGuestUpvoteToken(token, getGuestUpvoteSecret())
  return {
    kind: "visitor",
    rateLimitIdentifier: visitorIdHash,
    visitorIdHash,
  }
}

function wholePesosToCentavos(value: string) {
  const amount = value.trim()
  if (!/^\d+$/.test(amount)) return null

  const amountCentavos = Number(amount) * 100

  return Number.isSafeInteger(amountCentavos) &&
    amountCentavos >= 100 &&
    amountCentavos <= 1_000_000
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
  const owner = await getUpvoteOwner(user?.id)
  const rateLimit = await consumeRateLimit({
    action: "upvote-payment",
    userId: owner.rateLimitIdentifier,
  })
  if (!rateLimit.allowed) {
    return {
      error: rateLimit.unavailable
        ? "Upvotes are temporarily unavailable. Please try again shortly."
        : "Too many payment attempts. Please try again later.",
      ok: false,
    }
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
  if (!product)
    return { error: "This product is no longer available.", ok: false }

  let activePaymentQuery = admin
    .from("product_upvotes")
    .select("id, amount_centavos, provider_payment_intent_id")
    .eq("product_id", productId)
    .eq("status", "pending")

  activePaymentQuery =
    owner.kind === "user"
      ? activePaymentQuery.eq("user_id", owner.userId)
      : activePaymentQuery.eq("visitor_id_hash", owner.visitorIdHash)

  const { data: activePayment } = await activePaymentQuery.maybeSingle()

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
    ...(owner.kind === "user"
      ? { user_id: owner.userId }
      : { visitor_id_hash: owner.visitorIdHash }),
  })
  if (pendingError) {
    return {
      error: "A payment is already being prepared. Please try again.",
      ok: false,
    }
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
  const owner = await getUpvoteOwner(user?.id)
  const admin = createAdminClient()
  let statusQuery = admin
    .from("product_upvotes")
    .select("status")
    .eq("id", paymentId)

  statusQuery =
    owner.kind === "user"
      ? statusQuery.eq("user_id", owner.userId)
      : statusQuery.eq("visitor_id_hash", owner.visitorIdHash)

  const { data, error } = await statusQuery.maybeSingle()
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
