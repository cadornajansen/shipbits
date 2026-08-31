import assert from "node:assert/strict"
import test from "node:test"

import {
  canReplaceAssetFromImport,
  getGoogleFaviconUrl,
  getHtmlCoverImageUrls,
  getImportedMediaUrls,
} from "../features/imports/media"
import {
  parsePublicUrl,
  safeFetchBuffer,
  type SafeFetchDependencies,
} from "../lib/security/safe-fetch"

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
])

test("Google favicon URL uses the normalized root and encodes it", () => {
  const result = getGoogleFaviconUrl(
    "https://www.example.com/products?campaign=a&next=/admin#section"
  )
  const url = new URL(result)

  assert.equal(url.origin, "https://t0.gstatic.com")
  assert.equal(url.pathname, "/faviconV2")
  assert.equal(url.searchParams.get("url"), "https://www.example.com/")
  assert.match(result, /url=https%3A%2F%2Fwww\.example\.com%2F/)
  assert.equal(result.includes("campaign"), false)
})

test("Google favicon is first and extracted metadata remains the fallback", () => {
  const media = getImportedMediaUrls(
    { favicon: "https://example.com/icon.png" },
    "https://example.com/product"
  )

  assert.match(media.logo[0], /^https:\/\/t0\.gstatic\.com\/faviconV2\?/)
  assert.deepEqual(media.logo.slice(1), [
    "https://example.com/icon.png",
    "https://example.com/favicon.ico",
  ])
})

test("extracts direct OG and Twitter cover fallbacks from page HTML", () => {
  const html = `
    <meta property="og:image" content="/images/social.png">
    <meta property="og:image:url" content="https://cdn.example.com/duplicate.png">
    <meta name="twitter:image" content="https://cdn.example.com/twitter.jpg">
  `

  assert.deepEqual(
    getHtmlCoverImageUrls(html, "https://example.com/products/payments"),
    [
      "https://example.com/images/social.png",
      "https://cdn.example.com/duplicate.png",
      "https://cdn.example.com/twitter.jpg",
    ]
  )
})

test("recognizes alternate Firecrawl OG metadata keys", () => {
  const media = getImportedMediaUrls(
    { "og:image:url": "/og.png", og_image: "/alternate.png" },
    "https://example.com/product"
  )

  assert.deepEqual(media.cover, [
    "https://example.com/og.png",
    "https://example.com/alternate.png",
  ])
})

test("favicon fetch keeps image bytes and forwards image response limits", async () => {
  const dependencies: SafeFetchDependencies = {
    resolve: async () => [{ address: "1.1.1.1", family: 4 }],
    transport: async (_url, _address, options) => {
      assert.equal(options.accept, "image/*")
      assert.equal(options.maxBytes, 256 * 1024)
      return {
        body: png,
        headers: { "content-type": "image/png" },
        status: 200,
      }
    },
  }
  const response = await safeFetchBuffer(
    getGoogleFaviconUrl("https://example.com/path"),
    { accept: "image/*", maxBytes: 256 * 1024 },
    dependencies
  )

  assert.deepEqual(response.body, png)
})

test("favicon fetch rejects oversized responses", async () => {
  await assert.rejects(
    safeFetchBuffer(
      getGoogleFaviconUrl("https://example.com"),
      { accept: "image/*", maxBytes: 16 },
      {
        resolve: async () => [{ address: "1.1.1.1", family: 4 }],
        transport: async () => ({
          body: Buffer.alloc(17),
          headers: { "content-type": "image/png" },
          status: 200,
        }),
      }
    ),
    { code: "too_large" }
  )
})

test("import retries replace only explicitly import-owned assets", () => {
  assert.equal(canReplaceAssetFromImport("product_import"), true)
  assert.equal(canReplaceAssetFromImport(null), false)
  assert.equal(canReplaceAssetFromImport("admin_upload"), false)
})

test("import source URL validation rejects localhost and private IPs", () => {
  for (const value of [
    "http://localhost/product",
    "http://127.0.0.1/product",
    "http://10.0.0.1/product",
    "http://169.254.169.254/latest/meta-data",
  ]) {
    assert.throws(() => parsePublicUrl(value), { code: "blocked_target" })
  }
})
