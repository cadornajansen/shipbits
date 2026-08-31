import assert from "node:assert/strict"
import test from "node:test"
import { createClient } from "@supabase/supabase-js"

import { saveNewsletterSubscription } from "../features/newsletter/persistence"
import {
  buildNewsletterConfirmationEmailHtml,
  buildNewsletterConfirmationEmailText,
} from "../features/newsletter/confirmation-email-template"
import {
  NEWSLETTER_SUCCESS_MESSAGE,
  newsletterSchema,
} from "../features/newsletter/validation"

test("newsletter emails are trimmed and normalized without stripping plus tags", () => {
  const result = newsletterSchema.parse({
    email: "  BUILDER+weekly@Example.com  ",
  })
  assert.equal(result.email, "builder+weekly@example.com")
})

test("newsletter confirmation email uses ShipBits branding and includes a plain-text fallback", () => {
  const html = buildNewsletterConfirmationEmailHtml()
  const text = buildNewsletterConfirmationEmailText()

  assert.match(html, /shipbits-email-logo\.png/)
  assert.match(html, /shipbits-email-preview\.jpg/)
  assert.match(
    html,
    /https:\/\/shipbits\.dev\/branding\/shipbits-email-logo\.png/
  )
  assert.match(html, /You&rsquo;re officially on the list\./)
  assert.match(html, /Explore ShipBits/)
  assert.match(text, /You\'re officially on the list\./)
  assert.match(text, /https:\/\/shipbits\.dev\/products/)
})

test("newsletter validation rejects invalid, oversized, or unexpected input", () => {
  for (const input of [
    { email: "" },
    { email: "not-an-email" },
    { email: "builder@example.com\nBcc:other@example.com" },
    { email: `${"x".repeat(255)}@example.com` },
    { email: "builder@example.com", status: "subscribed" },
    { email: ["builder@example.com"] },
    null,
  ]) {
    assert.equal(newsletterSchema.safeParse(input).success, false)
  }
})

test("signup uses one conflict-safe insert and never re-subscribes opted-out addresses", async () => {
  const records = new Map<string, string>([
    ["former@example.com", "unsubscribed"],
  ])
  let requests = 0
  const client = createClient(
    "https://newsletter-test.supabase.co",
    "test-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input, init) => {
          const request = new Request(input, init)
          const url = new URL(request.url)
          requests += 1
          assert.equal(request.method, "POST")
          assert.equal(url.pathname, "/rest/v1/newsletter_subscribers")
          assert.equal(url.searchParams.get("on_conflict"), "email")
          assert.equal(url.searchParams.get("select"), "id")
          assert.match(
            request.headers.get("Prefer") || "",
            /resolution=ignore-duplicates/
          )

          const body = (await request.json()) as {
            email: string
            status: string
          }
          assert.deepEqual(Object.keys(body).sort(), ["email", "status"])
          assert.equal(body.status, "subscribed")
          const existing = records.has(body.email)
          if (!existing) records.set(body.email, body.status)
          return Response.json(existing ? [] : [{ id: "subscriber-id" }], {
            status: 201,
          })
        },
      },
    }
  )

  const first = await saveNewsletterSubscription(client, {
    email: "new@example.com",
  })
  const duplicate = await saveNewsletterSubscription(client, {
    email: "new@example.com",
  })
  const optedOut = await saveNewsletterSubscription(client, {
    email: "former@example.com",
  })

  assert.deepEqual(first, {
    ok: true,
    message: NEWSLETTER_SUCCESS_MESSAGE,
    created: true,
  })
  assert.deepEqual(duplicate, {
    ok: true,
    message: NEWSLETTER_SUCCESS_MESSAGE,
    created: false,
  })
  assert.deepEqual(optedOut, {
    ok: true,
    message: NEWSLETTER_SUCCESS_MESSAGE,
    created: false,
  })
  assert.equal(requests, 3)
  assert.equal(records.size, 2)
  assert.equal(records.get("new@example.com"), "subscribed")
  assert.equal(records.get("former@example.com"), "unsubscribed")
})

test("newsletter persistence errors do not reveal provider details or subscriber data", async () => {
  const client = createClient(
    "https://newsletter-test.supabase.co",
    "test-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async () =>
          Response.json(
            {
              code: "PGRST000",
              message: "Private database details for builder@example.com",
            },
            { status: 400 }
          ),
      },
    }
  )

  const result = await saveNewsletterSubscription(client, {
    email: "builder@example.com",
  })
  assert.deepEqual(result, {
    ok: false,
    error: "We couldn't save your signup. Please try again shortly.",
  })
  assert.equal(JSON.stringify(result).includes("builder@example.com"), false)
  assert.equal(JSON.stringify(result).includes("PGRST000"), false)
})
