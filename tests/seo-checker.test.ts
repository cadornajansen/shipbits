import assert from "node:assert/strict"
import test from "node:test"

import { scoreSeoPage } from "../features/seo-checker/scoring"
import { seoCheckerInputSchema } from "../features/seo-checker/validation"

const completeHtml = `<!doctype html><html><head>
  <title>A useful product for independent builders</title>
  <meta name="description" content="A practical product that helps independent builders plan launches and keep useful notes in one place.">
  <link rel="canonical" href="https://example.com/">
  <meta property="og:title" content="A useful product">
  <meta property="og:description" content="Plan your launch with a simple workspace.">
  <meta property="og:image" content="/cover.png">
  <link rel="icon" href="/favicon.svg">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Example"}</script>
  </head><body><h1>Plan your next launch</h1></body></html>`

test("all 12 known signals produce a stable score of 100", () => {
  const input = { html: completeHtml, url: "https://example.com/", robots: "found", sitemap: "found" } as const
  const result = scoreSeoPage(input)
  assert.equal(result.score, 100)
  assert.equal(result.checks.length, 12)
  assert.equal(result.passed, 12)
  assert.equal(result.failures, 0)
  assert.deepEqual(result, scoreSeoPage(input))
})

test("absent optional signals warn while essential missing tags fail", () => {
  const result = scoreSeoPage({ html: "<html><head></head><body></body></html>", url: "http://example.com/", robots: "missing", sitemap: "unavailable" })
  assert.equal(result.failures, 8)
  assert.equal(result.warnings, 4)
  assert.equal(result.score, 17)
  assert.equal(result.checks.find((check) => check.id === "favicon")?.status, "warning")
  assert.equal(result.checks.find((check) => check.id === "h1")?.status, "fail")
})

test("metadata length heuristics produce warnings rather than invented hard SEO failures", () => {
  const result = scoreSeoPage({ html: completeHtml.replace("A useful product for independent builders</title>", `${"Long ".repeat(30)}</title>`), url: "https://example.com/", robots: "found", sitemap: "found" })
  assert.equal(result.checks.find((check) => check.id === "title")?.status, "warning")
  assert.equal(result.score, 96)
  assert.match(result.checks.find((check) => check.id === "title")?.detail ?? "", /not a search-engine limit/)
})

test("invalid JSON-LD is a warning and is never evaluated", () => {
  const html = completeHtml.replace('{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Example"}', "window.alert('unsafe')")
  const result = scoreSeoPage({ html, url: "https://example.com/", robots: "found", sitemap: "found" })
  assert.equal(result.checks.find((check) => check.id === "structured-data")?.status, "warning")
})

test("noindex and site-wide crawler blocks are visible failures", () => {
  for (const input of [
    { html: completeHtml.replace("</head>", '<meta name="robots" content="noindex, follow"></head>') },
    { html: completeHtml, indexingBlocked: true },
  ]) {
    const result = scoreSeoPage({ ...input, url: "https://example.com/", robots: "found", sitemap: "found" })
    assert.equal(result.checks.find((check) => check.id === "robots")?.status, "fail")
  }
})

test("invalid canonical and image protocols do not count as usable metadata", () => {
  const html = completeHtml.replace('href="https://example.com/"', 'href="javascript:alert(1)"').replace('content="/cover.png"', 'content="data:text/html,unsafe"')
  const result = scoreSeoPage({ html, url: "https://example.com/", robots: "found", sitemap: "found" })
  assert.equal(result.checks.find((check) => check.id === "canonical")?.status, "fail")
  assert.equal(result.checks.find((check) => check.id === "og-image")?.status, "fail")
})

test("multiple h1 and canonical declarations are flagged for review", () => {
  const html = completeHtml.replace("</head>", '<link rel="canonical" href="/second"></head>').replace("</body>", "<h1>Another heading</h1></body>")
  const result = scoreSeoPage({ html, url: "https://example.com/", robots: "found", sitemap: "found" })
  assert.equal(result.checks.find((check) => check.id === "canonical")?.status, "warning")
  assert.equal(result.checks.find((check) => check.id === "h1")?.status, "warning")
})

test("normalizes protocol-less URLs and reuses authoritative http/https validation", () => {
  assert.equal(seoCheckerInputSchema.parse({ url: " example.com " }).url, "https://example.com")
  for (const url of ["", "not a url", "javascript:alert(1)", "ftp://example.com/", "x".repeat(2049)]) {
    assert.equal(seoCheckerInputSchema.safeParse({ url }).success, false)
  }
  assert.equal(seoCheckerInputSchema.safeParse({ url: "https://example.com", extra: true }).success, false)
})
