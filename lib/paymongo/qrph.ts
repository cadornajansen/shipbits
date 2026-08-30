import "server-only"

import { getPaymongoPublicKey, paymongoRequest } from "./client"
import type { PayMongoPaymentIntent, PayMongoResource } from "./types"

export async function createQrPhPayment({
  amountCentavos,
  description,
  idempotencyKey,
}: {
  amountCentavos: number
  description: string
  idempotencyKey: string
}) {
  const paymentIntent = await paymongoRequest<
    PayMongoResource<PayMongoPaymentIntent>
  >({
    body: {
      data: {
        attributes: {
          amount: amountCentavos,
          currency: "PHP",
          description,
          payment_method_allowed: ["qrph"],
        },
      },
    },
    idempotencyKey: `${idempotencyKey}:intent`,
    method: "POST",
    path: "/payment_intents",
  })

  return attachQrPhPayment({
    clientKey: paymentIntent.data.attributes.client_key,
    idempotencyKey,
    paymentIntentId: paymentIntent.data.id,
  })
}

export async function attachQrPhPayment({
  clientKey,
  idempotencyKey,
  paymentIntentId,
}: {
  clientKey: string
  idempotencyKey: string
  paymentIntentId: string
}) {
  const publicKey = getPaymongoPublicKey()
  const paymentMethod = await paymongoRequest<
    PayMongoResource<Record<string, never>>
  >({
    apiKey: publicKey,
    body: {
      data: {
        attributes: {
          expiry_seconds: 1800,
          type: "qrph",
        },
      },
    },
    idempotencyKey: `${idempotencyKey}:method`,
    method: "POST",
    path: "/payment_methods",
  })

  const attachedIntent = await paymongoRequest<
    PayMongoResource<PayMongoPaymentIntent>
  >({
    apiKey: publicKey,
    body: {
      data: {
        attributes: {
          client_key: clientKey,
          payment_method: paymentMethod.data.id,
        },
      },
    },
    idempotencyKey: `${idempotencyKey}:attach`,
    method: "POST",
    path: `/payment_intents/${paymentIntentId}/attach`,
  })

  const qrImageUrl = attachedIntent.data.attributes.next_action?.code?.image_url
  if (!qrImageUrl) {
    throw new Error("PayMongo did not return a QR Ph image.")
  }

  return {
    paymentIntentId,
    qrExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    qrImageUrl,
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return paymongoRequest<PayMongoResource<PayMongoPaymentIntent>>({
    path: `/payment_intents/${paymentIntentId}`,
  })
}
