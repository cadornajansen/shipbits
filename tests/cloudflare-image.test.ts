import assert from "node:assert/strict"
import test from "node:test"

import { optimizedProductCoverUrl } from "../lib/images/cloudflare"

test("R2 cover URLs use the Cloudflare Images transformation endpoint", () => {
  assert.equal(
    optimizedProductCoverUrl(
      "https://assets.shipbits.dev/submissions/0595aab6-d1a4-4260-a585-01a4637a0bdc/cover.jpg"
    ),
    "https://assets.shipbits.dev/cdn-cgi/image/width=960,quality=80,format=auto,fit=cover/submissions/0595aab6-d1a4-4260-a585-01a4637a0bdc/cover.jpg"
  )
})

test("non-cover URLs remain unchanged", () => {
  const logoUrl =
    "https://assets.shipbits.dev/submissions/0595aab6-d1a4-4260-a585-01a4637a0bdc/logo.png"

  assert.equal(optimizedProductCoverUrl(logoUrl), logoUrl)
})
