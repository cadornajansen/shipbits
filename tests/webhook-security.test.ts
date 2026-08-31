import assert from "node:assert/strict"
import test from "node:test"

import { RequestBodyError, readTextBody } from "../lib/security/request"

test("webhook bodies are rejected once their streamed size exceeds the limit", async () => {
  const request = new Request("https://shipbits.dev/api/webhooks/paymongo", {
    method: "POST",
    body: "x".repeat(65),
  })
  await assert.rejects(
    () => readTextBody(request, 64),
    (error: unknown) =>
      error instanceof RequestBodyError && error.status === 413
  )
})
