import assert from "node:assert/strict"
import test from "node:test"

import {
  hashGuestUpvoteToken,
  isGuestUpvoteToken,
} from "../features/upvotes/guest"

test("guest upvote visitor tokens are validated and stored only as stable hashes", () => {
  const token = "a1b2c3d4-0000-4000-8000-000000000000"
  const secret = "test-secret"

  assert.equal(isGuestUpvoteToken(token), true)
  assert.equal(isGuestUpvoteToken("not-a-token"), false)
  assert.equal(isGuestUpvoteToken(undefined), false)

  const hash = hashGuestUpvoteToken(token, secret)
  assert.match(hash, /^[a-f0-9]{64}$/)
  assert.notEqual(hash, token)
  assert.equal(hash, hashGuestUpvoteToken(token, secret))
  assert.notEqual(hash, hashGuestUpvoteToken(token, "another-secret"))
})
