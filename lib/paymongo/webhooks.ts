import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import type { PayMongoWebhookEvent } from "./types"

function safeHexEqual(expected: string, received: string) {
  if (!/^[a-f\d]+$/i.test(received) || expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  )
}

export function verifyPayMongoWebhook({
  rawBody,
  signatureHeader,
}: {
  rawBody: string
  signatureHeader: string | null
}) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const directSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (safeHexEqual(directSignature, signatureHeader.trim())) return true

  const values = new Map(
    signatureHeader.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=")
      return [key, value.join("=")]
    })
  )
  const timestamp = values.get("t")
  const signedValue = timestamp ? `${timestamp}.${rawBody}` : ""
  const expectedSignature = timestamp
    ? createHmac("sha256", secret).update(signedValue).digest("hex")
    : ""

  return Boolean(
    expectedSignature &&
    [values.get("te"), values.get("li")].some(
      (signature) => signature && safeHexEqual(expectedSignature, signature)
    )
  )
}

export function parsePayMongoWebhook(rawBody: string) {
  return JSON.parse(rawBody) as PayMongoWebhookEvent
}

export function getWebhookPaymentIntentId(event: PayMongoWebhookEvent) {
  const resource = event.data.attributes.data
  const attributes = resource?.attributes
  if (resource?.type === "payment_intent") return resource.id ?? null
  if (attributes && "payment_intent_id" in attributes) {
    return attributes.payment_intent_id ?? null
  }

  return null
}
