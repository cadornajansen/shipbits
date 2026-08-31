import { createHmac, randomUUID } from "node:crypto"

export const GUEST_UPVOTE_COOKIE = "shipbits_upvote_visitor"

export function createGuestUpvoteToken() {
  return randomUUID()
}

export function hashGuestUpvoteToken(token: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`guest-upvote:${token}`)
    .digest("hex")
}

export function isGuestUpvoteToken(value: string | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  )
}
