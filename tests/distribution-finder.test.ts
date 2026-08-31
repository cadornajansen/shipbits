import assert from "node:assert/strict"
import test from "node:test"
import { classifyChannel } from "../features/distribution/classification"
import {
  inferDistributionProductProfile,
  rankDistributionChannels,
  submissionFriction,
  type FinderChannel,
} from "../features/distribution/finder"
import type { DistributionTag } from "../features/distribution/types"
import { extractDistributionProductEvidence } from "../features/distribution/url-analysis-evidence"

const tags = [
  ["product_type", "ai-tool"],
  ["product_type", "saas"],
  ["product_type", "developer-tool"],
  ["product_type", "api"],
  ["product_type", "browser-extension"],
  ["product_type", "mobile-app"],
  ["product_type", "open-source"],
  ["product_type", "ecommerce"],
  ["product_type", "consumer-app"],
  ["product_type", "b2b-software"],
  ["category", "artificial-intelligence"],
  ["category", "developer-tools"],
  ["category", "software-discovery"],
  ["category", "software-reviews"],
  ["category", "app-marketplace"],
  ["category", "browser-extensions"],
  ["category", "ecommerce"],
  ["category", "open-source"],
  ["audience", "developers"],
  ["audience", "businesses"],
  ["audience", "consumers"],
  ["audience", "founders"],
  ["platform", "web"],
  ["platform", "api"],
  ["platform", "browser"],
  ["platform", "android"],
  ["platform", "ios"],
  ["platform", "github"],
  ["platform", "shopify"],
  ["region", "global"],
  ["region", "philippines"],
] as const
const taxonomy = tags.map(([type, slug]) => ({
  id: `${type}-${slug}`,
  type,
  slug,
  name: slug.replaceAll("-", " "),
})) as DistributionTag[]

function channel(
  name: string,
  tagKeys: string[],
  overrides: Partial<FinderChannel> = {}
): FinderChannel {
  return {
    id: name,
    name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    description: "",
    website_url: "https://example.com",
    submission_url: null,
    channel_type: "directory",
    pricing_type: "unknown",
    quality_score: null,
    authority_score: null,
    requires_account: null,
    requires_email_verification: null,
    requires_manual_review: null,
    requires_payment: null,
    estimated_submission_minutes: null,
    tags: tagKeys.map((key) => {
      const tag = taxonomy.find((item) => `${item.type}:${item.slug}` === key)
      if (!tag) throw new Error(`Unknown test tag ${key}`)
      return {
        tag_id: tag.id,
        relevance_score: 100,
        confidence_score: 100,
        tag,
      }
    }),
    ...overrides,
  }
}

test("classifier recognizes browser stores from their canonical identity", () => {
  const result = classifyChannel(
    {
      id: "chrome",
      name: "Chrome Web Store",
      description: "Official app store.",
      canonical_url: "https://chromewebstore.google.com",
      channel_type: "app_store",
    },
    taxonomy
  )
  assert.deepEqual(
    result
      .filter((item) => item.tag.type === "platform")
      .map((item) => item.tag.slug),
    ["browser"]
  )
  assert.ok(result.some((item) => item.tag.slug === "browser-extension"))
})

test("product text is normalized into controlled taxonomy", () => {
  const profile = inferDistributionProductProfile({
    name: "Open API",
    description: "An open-source API for developer teams",
    productTypes: [],
    categories: [],
    audiences: [],
    platforms: [],
    regions: ["global"],
  })
  assert.deepEqual(profile.productTypes.sort(), [
    "api",
    "developer-tool",
    "open-source",
  ])
  assert.deepEqual(profile.audiences, ["developers"])
})

test("URL extraction prefers Open Graph metadata and returns only controlled taxonomy tags", () => {
  const analysis = extractDistributionProductEvidence(
    `<!doctype html><html><head><title>Fallback name</title><meta property="og:title" content="Dev Console" /><meta property="og:description" content="An AI developer tool for API teams." /></head><body><h1>Fallback heading</h1></body></html>`,
    "https://example.com/",
    taxonomy
  )
  assert.equal(analysis.name, "Dev Console")
  assert.equal(analysis.description, "An AI developer tool for API teams.")
  assert.ok(analysis.productTypes.includes("ai-tool"))
  assert.ok(analysis.productTypes.includes("developer-tool"))
  assert.ok(analysis.productTypes.includes("api"))
  assert.deepEqual(analysis.categories, [
    "artificial-intelligence",
    "developer-tools",
  ])
})

test("URL extraction ignores inline scripts when deriving visible page text", () => {
  const analysis = extractDistributionProductEvidence(
    "<html><head><title>Study space</title></head><body><script>const internalToken = 'do-not-show'</script><main>A calm study workspace for students.</main></body></html>",
    "https://example.com/",
    taxonomy
  )
  assert.equal(analysis.description, "A calm study workspace for students.")
  assert.ok(!analysis.description.includes("internalToken"))
})

test("exact category and platform matches outrank unrelated channels with unknown quality", () => {
  const ranked = rankDistributionChannels(
    {
      name: "Extension",
      description: "A browser extension for consumers",
      productTypes: [],
      categories: [],
      audiences: [],
      platforms: [],
      regions: ["global"],
    },
    [
      channel("Chrome", [
        "product_type:browser-extension",
        "category:browser-extensions",
        "platform:browser",
        "region:global",
      ]),
      channel("G2", [
        "product_type:saas",
        "category:software-reviews",
        "audience:businesses",
        "platform:web",
        "region:global",
      ]),
    ]
  )
  assert.equal(ranked[0]?.name, "Chrome")
  assert.ok(ranked[0]!.matchScore > ranked[1]!.matchScore)
})

test("audience and region matches add positive score while global remains eligible", () => {
  const ranked = rankDistributionChannels(
    {
      name: "Developer tool",
      description: "A developer tool",
      productTypes: [],
      categories: [],
      audiences: [],
      platforms: [],
      regions: ["philippines"],
    },
    [
      channel("Philippine Dev", [
        "product_type:developer-tool",
        "category:developer-tools",
        "audience:developers",
        "region:philippines",
      ]),
      channel("Global Dev", [
        "product_type:developer-tool",
        "category:developer-tools",
        "audience:developers",
        "region:global",
      ]),
    ]
  )
  assert.equal(ranked[0]?.name, "Philippine Dev")
  assert.ok(ranked[1]!.matchScore > 0)
})

test("unknown friction is neutral and known paid friction is mild", () => {
  const neutral = submissionFriction(channel("Unknown", []))
  const paid = submissionFriction(
    channel("Paid", [], { pricing_type: "paid", requires_payment: true })
  )
  assert.equal(neutral, 2.5)
  assert.ok(paid > 0 && paid < neutral)
})

test("sorting is deterministic and stable for equal candidates", () => {
  const ranked = rankDistributionChannels(
    {
      name: "SaaS",
      description: "A SaaS",
      productTypes: [],
      categories: [],
      audiences: [],
      platforms: [],
      regions: ["global"],
    },
    [
      channel("Zulu", ["product_type:saas", "region:global"]),
      channel("Alpha", ["product_type:saas", "region:global"]),
    ]
  )
  assert.deepEqual(
    ranked.map((item) => item.name),
    ["Alpha", "Zulu"]
  )
})

test("ten product archetypes produce taxonomy-led, distinct top channels", () => {
  const candidates = [
    channel("AI Directory", [
      "product_type:ai-tool",
      "category:artificial-intelligence",
      "audience:founders",
      "platform:web",
      "region:global",
    ]),
    channel("B2B Reviews", [
      "product_type:b2b-software",
      "category:software-reviews",
      "audience:businesses",
      "platform:web",
      "region:global",
    ]),
    channel("Dev Launch", [
      "product_type:developer-tool",
      "category:developer-tools",
      "audience:developers",
      "platform:web",
      "region:global",
    ]),
    channel("API Market", [
      "product_type:api",
      "category:app-marketplace",
      "audience:developers",
      "platform:api",
      "region:global",
    ]),
    channel("Browser Store", [
      "product_type:browser-extension",
      "category:browser-extensions",
      "audience:consumers",
      "platform:browser",
      "region:global",
    ]),
    channel("Mobile Store", [
      "product_type:mobile-app",
      "category:app-marketplace",
      "audience:consumers",
      "platform:android",
      "region:global",
    ]),
    channel("Open Source Hub", [
      "product_type:open-source",
      "category:open-source",
      "audience:developers",
      "platform:github",
      "region:global",
    ]),
    channel("Shopify Store", [
      "product_type:ecommerce",
      "category:ecommerce",
      "audience:businesses",
      "platform:shopify",
      "region:global",
    ]),
    channel("Consumer Discovery", [
      "product_type:consumer-app",
      "category:software-discovery",
      "audience:consumers",
      "platform:web",
      "region:global",
    ]),
    channel("Philippine Launch", [
      "product_type:saas",
      "category:software-discovery",
      "audience:founders",
      "platform:web",
      "region:philippines",
    ]),
  ]
  const cases: Array<[string, string, string]> = [
    ["AI SaaS", "AI Directory", "An AI SaaS for founders"],
    ["B2B SaaS", "B2B Reviews", "B2B software for businesses"],
    ["developer tool", "Dev Launch", "A developer tool for developers"],
    ["API", "API Market", "An API for developers"],
    ["browser extension", "Browser Store", "A browser extension for consumers"],
    ["mobile app", "Mobile Store", "An Android mobile app for consumers"],
    ["open source", "Open Source Hub", "An open-source project"],
    ["Shopify app", "Shopify Store", "A Shopify ecommerce app for businesses"],
    ["consumer web app", "Consumer Discovery", "A consumer web app"],
    [
      "Philippines startup",
      "Philippine Launch",
      "A Philippines SaaS for founders",
    ],
  ]
  for (const [label, expected, description] of cases) {
    const ranked = rankDistributionChannels(
      {
        name: label,
        description,
        productTypes: [],
        categories: [],
        audiences: [],
        platforms: [],
        regions: label.includes("Philippines") ? ["philippines"] : ["global"],
      },
      candidates
    )
    assert.equal(ranked[0]?.name, expected, label)
  }
})
