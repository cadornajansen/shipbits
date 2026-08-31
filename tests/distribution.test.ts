import assert from "node:assert/strict"
import test from "node:test"
import { createClient } from "@supabase/supabase-js"
import { listChannels } from "../features/distribution/repository"
import { readFile } from "node:fs/promises"
import {
  normalizeUrl,
  duplicateIdentity,
  channelSlug,
} from "../features/distribution/normalization"
import {
  batchSchema,
  parseCsv,
  prepareRecord,
} from "../features/distribution/import"
import {
  bulkSchema,
  channelSchema,
  parseFilters,
  quickSchema,
  verifySchema,
} from "../features/distribution/validation"
import {
  channelFromForm,
  booleanFields,
  numberFields,
} from "../features/distribution/form"
import { displayLabel } from "../components/admin/distribution/controls"
import {
  normalizePricing,
  normalizeRawData,
  normalizeSubmissionUrl,
} from "../features/distribution/enrichment/normalize-raw-data"
import { enrichChannel } from "../features/distribution/enrichment/enrich-channel"
import { analyzeLiveEvidence } from "../features/distribution/enrichment/live"

test("URL identity merges scheme, www, root slash, fragments, trackers and query ordering", () => {
  assert.equal(
    normalizeUrl(" HTTP://WWW.Example.COM/?utm_source=x#section ").canonical,
    "https://example.com"
  )
  assert.equal(
    normalizeUrl("example.com/path/?b=2&gclid=x&a=1").canonical,
    "https://example.com/path?a=1&b=2"
  )
  assert.equal(
    normalizeUrl("http://example.com:80").canonical,
    "https://example.com"
  )
  assert.equal(
    duplicateIdentity(
      { website_url: "http://www.example.com" },
      { website_url: "https://example.com/" }
    ),
    true
  )
})
test("identity preserves tenant paths, meaningful query parameters and case-sensitive paths", () => {
  assert.notEqual(
    normalizeUrl("https://reddit.com/r/SaaS").canonical,
    normalizeUrl("https://reddit.com/r/startups").canonical
  )
  assert.equal(
    normalizeUrl("https://www.reddit.com/r/SaaS/").canonical,
    normalizeUrl("https://reddit.com/r/saas").canonical
  )
  assert.notEqual(
    normalizeUrl("https://example.com/A").canonical,
    normalizeUrl("https://example.com/a").canonical
  )
  assert.notEqual(
    normalizeUrl("https://example.com/?community=one").canonical,
    normalizeUrl("https://example.com/?community=two").canonical
  )
})
test("malformed URLs, credentials and unsafe protocols are rejected", () => {
  for (const value of [
    "",
    "ftp://example.com",
    "javascript:alert(1)",
    "https://user:secret@example.com",
    "https://example.com:1234",
    "https://exam ple.com",
    "https://example.com\\evil",
    "localhost",
  ]) {
    assert.throws(() => normalizeUrl(value), value)
  }
  assert.equal(channelSlug(" Dév Tools & APIs "), "dev-tools-apis")
})
const record = {
  name: "Example",
  website_url: "http://www.example.com/",
  source_record_id: "row-1",
  source_url: "https://github.com/example/data",
  observed_at: "2026-08-31T00:00:00.000Z",
  raw_data: { name: "Example", url: "http://www.example.com/" },
}

test("out-of-range PostgREST pages are clamped after deletion or a stale URL", async () => {
  let calls = 0
  const db = createClient("https://database.example.com", "test-key", {
    global: {
      fetch: async (_input, options) => {
        calls++
        if (calls === 1)
          return new Response(
            JSON.stringify({
              code: "PGRST103",
              message: "Requested range not satisfiable",
            }),
            { status: 416, headers: { "content-type": "application/json" } }
          )
        if (options?.method === "HEAD")
          return new Response(null, {
            status: 200,
            headers: { "content-range": "0-960/961" },
          })
        return new Response("[]", {
          status: 200,
          headers: {
            "content-type": "application/json",
            "content-range": "950-960/961",
          },
        })
      },
    },
  })
  const result = await listChannels(db, parseFilters({ page: "100000" }))
  assert.equal(result.page, 39)
  assert.equal(result.total, 961)
  assert.equal(calls, 3)
})
test("import identity and hashes are stable, duplicate names on different hosts stay separate", () => {
  const first = prepareRecord(record)
  const replay = prepareRecord({
    ...record,
    observed_at: "2026-09-01T00:00:00.000Z",
    raw_data: { url: record.raw_data.url, name: record.name },
  })
  assert.equal(first.content_hash, replay.content_hash)
  assert.equal(first.slug, replay.slug)
  assert.notEqual(
    first.slug,
    prepareRecord({ ...record, website_url: "https://another.example.com" })
      .slug
  )
  assert.equal(first.channel_type, null)
  assert.equal(first.submission_url, null)
  assert.notEqual(
    first.content_hash,
    prepareRecord({
      ...record,
      raw_data: { ...record.raw_data, pricing: "paid" },
    }).content_hash
  )
})
test("raw pricing and submission URLs normalize only supported evidence", () => {
  assert.equal(normalizePricing(" Free "), "free")
  assert.equal(normalizePricing("paid listing"), "paid")
  assert.equal(normalizePricing("contact us"), null)
  assert.equal(normalizeSubmissionUrl("example.com/submit?utm_source=x"), "https://example.com/submit")
  assert.equal(normalizeSubmissionUrl("javascript:alert(1)"), null)
})
test("source verification remains a dated claim and never becomes channel status", () => {
  const normalized = normalizeRawData({
    ...record,
    raw_data: {
      pricing: "freemium",
      verification_status: "verified-by-source",
      verification_date: "2026-07",
    },
  })
  assert.deepEqual(normalized.source_claim, {
    claim: "verified-by-source",
    observed_at: "2026-07-01T00:00:00.000Z",
  })
  assert.equal("status" in normalized, false)
})
test("enrichment is idempotent and does not overwrite manual values", () => {
  const observation = { ...record, raw_data: { pricing: "paid" } }
  const unknown = enrichChannel(
    { id: "channel", pricing_type: "unknown", submission_url: null },
    [observation]
  )
  assert.deepEqual(unknown.updates, { pricing_type: "paid" })
  assert.deepEqual(
    enrichChannel(
      { id: "channel", pricing_type: "paid", submission_url: null },
      [observation],
      ["pricing_type"]
    ).updates,
    {}
  )
  assert.deepEqual(
    enrichChannel(
      { id: "channel", pricing_type: "free", submission_url: "https://manual.example.com" },
      [observation]
    ).updates,
    {}
  )
})
test("malformed raw values remain rejected and unknown", () => {
  const normalized = normalizeRawData({
    ...record,
    raw_data: { pricing: "maybe", submission_url: "ftp://example.com" },
  })
  assert.equal(normalized.pricing_type, null)
  assert.equal(normalized.submission_url, null)
  assert.equal(normalized.rejected.length, 2)
})
test("live evidence stays conservative when purpose and submission workflow are absent", () => {
  const analysis = analyzeLiveEvidence({
    channel: {
      id: "channel", name: "Example", slug: "example", description: "", website_url: "https://example.com/",
      canonical_url: "https://example.com", submission_url: null, channel_type: "directory", pricing_type: "unknown",
      price_amount: null, price_currency: null, requires_account: null, requires_email_verification: null, requires_manual_review: null,
      requires_payment: null, estimated_submission_minutes: null, backlink_possible: null, dofollow_possible: null,
      traffic_tier: null, authority_score: null, quality_score: null, competition_score: null,
      submission_difficulty: null, submission_requirements: {}, status: "unverified", created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z", last_verified_at: null, last_checked_at: null, archived_at: null,
    },
    sourceUrl: "https://example.com/", combined: "A generic consulting business", facts: { title: "Example", description: "", text: "", links: [] },
    homepage: { requested_url: "https://example.com/", reachable: true, http_status: 200, final_url: "https://example.com/", failure: null },
    search: [], taxonomy: new Map(), observedAt: "2026-01-01T00:00:00Z",
  })
  assert.equal(analysis.relevant, false)
  assert.equal(analysis.submitUrl, null)
  assert.deepEqual(analysis.taxonomyTagIds, [])
})
test("live taxonomy uses concise official evidence instead of the homepage corpus", () => {
  const taxonomy = new Map([
    ["product_type:mobile-app", { id: "mobile", type: "product_type" as const, slug: "mobile-app", name: "Mobile app" }],
  ])
  const analysis = analyzeLiveEvidence({
    channel: {
      id: "channel", name: "Launch", slug: "launch", description: "", website_url: "https://example.com/",
      canonical_url: "https://example.com", submission_url: null, channel_type: "launch_platform", pricing_type: "unknown",
      price_amount: null, price_currency: null, requires_account: null, requires_email_verification: null, requires_manual_review: null,
      requires_payment: null, estimated_submission_minutes: null, backlink_possible: null, dofollow_possible: null,
      traffic_tier: null, authority_score: null, quality_score: null, competition_score: null,
      submission_difficulty: null, submission_requirements: {}, status: "unverified", created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z", last_verified_at: null, last_checked_at: null, archived_at: null,
    },
    sourceUrl: "https://example.com/", combined: "Launch new products every day", facts: {
      title: "Launch", description: "Launch new products every day", text: "Featured mobile apps", links: [],
    },
    homepage: { requested_url: "https://example.com/", reachable: true, http_status: 200, final_url: "https://example.com/", failure: null },
    search: [], taxonomy, observedAt: "2026-01-01T00:00:00Z",
  })
  assert.deepEqual(analysis.taxonomyTagIds, [])
})
test("review sites remain a distinct valid channel type for imports", () => {
  const reviewSite = batchSchema.parse({
    source: {
      name: "Example source",
      source_url: "https://example.com/source",
      license: "MIT",
      attribution: "Example attribution",
    },
    records: [{ ...record, channel_type: "review_site" }],
  }).records[0]
  assert.equal(prepareRecord(reviewSite).channel_type, "review_site")
  assert.equal(displayLabel("review_site"), "Review site")
})
test("CSV handles escaped quotes, commas, BOM and embedded newlines", () => {
  assert.deepEqual(
    parseCsv(
      '\uFEFFname,url\r\n"A, ""great"" tool",https://example.com\r\n"Multi\nline",https://other.com'
    ),
    [
      { name: 'A, "great" tool', url: "https://example.com" },
      { name: "Multi\nline", url: "https://other.com" },
    ]
  )
  assert.throws(() => parseCsv('name,url\n"unfinished,url'))
  assert.throws(() => parseCsv("name,url\nwrong"))
})
function validChannel() {
  const form = new FormData()
  for (const [key, value] of Object.entries({
    name: "Example",
    slug: "example",
    description: "",
    website_url: "https://example.com",
    submission_url: "",
    channel_type: "",
    pricing_type: "unknown",
    status: "unverified",
    submission_requirements: "{}",
  }))
    form.set(key, value)
  booleanFields.forEach((key) => form.set(key, "unknown"))
  numberFields.forEach((key) => form.set(key, ""))
  return channelFromForm(form)
}
test("validation preserves unknowns and rejects invalid scores, JSON, taxonomy and privileged fields", () => {
  const channel = validChannel()
  assert.equal(channel.quality_score, null)
  assert.equal(channel.requires_payment, null)
  assert.equal(
    channelSchema.safeParse({ ...channel, channel_type: "review_site" })
      .success,
    true
  )
  for (const patch of [
    { quality_score: 101 },
    { quality_score: -1 },
    { quality_score: 1.1 },
    { traffic_tier: 0 },
    { submission_difficulty: 6 },
    { estimated_submission_minutes: 0 },
    { price_amount: -1 },
    { price_amount: 10, price_currency: null },
    { price_amount: 10, price_currency: "usd" },
    { name: "" },
    { submission_requirements: [] },
    { archived_at: "2026-01-01" },
    { channel_type: "random-ai-tag" },
  ])
    assert.equal(
      channelSchema.safeParse({ ...channel, ...patch }).success,
      false
    )
  assert.equal(
    batchSchema.safeParse({
      source: {
        name: "x",
        source_url: "https://example.com",
        license: "MIT",
        attribution: "x",
      },
      records: Array.from({ length: 101 }, () => record),
    }).success,
    false
  )
})
test("quick/bulk/verification requests enforce limits and operation allowlists", () => {
  const id = "00000000-0000-4000-8000-000000000001"
  assert.equal(
    quickSchema.safeParse({
      id,
      expectedUpdatedAt: record.observed_at,
      patch: { quality_score: 50 },
    }).success,
    true
  )
  assert.equal(
    quickSchema.safeParse({
      id,
      expectedUpdatedAt: record.observed_at,
      patch: { status: "active", quality_score: 50 },
    }).success,
    false
  )
  for (const input of [
    { ids: [], operation: "status", value: "active" },
    { ids: [id, id], operation: "status", value: "active" },
    { ids: [id], operation: "drop", value: "" },
    { ids: [id], operation: "add_tag", value: "made-up" },
  ])
    assert.equal(bulkSchema.safeParse(input).success, false)
  assert.equal(
    verifySchema.safeParse({ stale: true, ids: [id] }).success,
    false
  )
  assert.equal(verifySchema.safeParse({ stale: false }).success, false)
  assert.equal(verifySchema.safeParse({ stale: true }).success, true)
  const filters = parseFilters({
    page: "-2",
    pageSize: "999999",
    sort: "injected",
    status: "anything",
    region: "a,b",
  })
  assert.equal(filters.page, 1)
  assert.equal(filters.pageSize, 25)
  assert.equal(filters.sort, "name")
  assert.equal(filters.region, "")
})
test("every exported admin action checks authorization before database work", async () => {
  const actions = await readFile("features/distribution/actions.ts", "utf8")
  const functions = actions.split("export async function ").slice(1)
  assert.equal(functions.length, 5)
  for (const fn of functions) {
    const guard = fn.indexOf("await requireAdmin()")
    assert.ok(guard >= 0)
    assert.ok(guard < fn.indexOf("try {"), fn.slice(0, 70))
  }
})
