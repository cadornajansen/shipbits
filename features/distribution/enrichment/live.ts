import type { Channel, ChannelType, DistributionTag, UrlCheck } from "../types"
import type { SearchResult } from "./anysearch"

const submissionText = /\b(submit (?:a |your )?(?:product|tool|startup|app)|add (?:a |your )?(?:product|tool|listing|software)|list your product|publish (?:an? )?(?:app|extension)|vendor signup|developer console|create product|launch product)\b/i
const parkedText = /domain (?:is )?for sale|buy this domain|sedo domain parking|afternic|hugedomains/i
const purposes: { type: ChannelType; pattern: RegExp }[] = [
  { type: "app_store", pattern: /\b(app store|publish your app|developer console|app review)\b/i },
  { type: "marketplace", pattern: /\b(marketplace|sell (?:apps|software)|integration partner)\b/i },
  { type: "review_site", pattern: /\bsoftware reviews?|compare software|user reviews?\b/i },
  { type: "launch_platform", pattern: /\blaunch (?:your )?(?:product|startup)|new products? every day|makers?\b/i },
  { type: "forum", pattern: /\bdiscussion forum|message board|forum\b/i },
  { type: "community", pattern: /\bcommunity (?:for|of)|founder community|developer community\b/i },
  { type: "newsletter", pattern: /\bnewsletter|subscribe for weekly\b/i },
  { type: "directory", pattern: /\b(?:directory|catalog|database) of (?:ai |saas |software |startup |developer )?(?:tools|products|software|startups|apps)\b/i },
]
const taxonomyRules: [string, RegExp][] = [
  ["product_type:ai-tool", /\bAI tools?|artificial intelligence\b/i],
  ["product_type:saas", /\bSaaS\b/i],
  ["product_type:developer-tool", /\bdeveloper tools?|developer platform\b/i],
  ["product_type:mobile-app", /\bmobile apps?|iOS and Android\b/i],
  ["product_type:browser-extension", /\bbrowser extensions?|Chrome extensions?\b/i],
  ["product_type:open-source", /\bopen[ -]source\b/i],
  ["product_type:api", /\bAPIs?\b/],
  ["product_type:b2b-software", /\bB2B software\b/i],
  ["product_type:productivity", /\bproductivity (?:apps?|tools?|software)\b/i],
  ["audience:developers", /\bfor developers|developer community\b/i],
  ["audience:founders", /\bfor founders|founder community\b/i],
  ["audience:startups", /\bfor startups|startup community\b/i],
  ["audience:indie-hackers", /\bindie hackers?\b/i],
  ["audience:early-adopters", /\bearly adopters?\b/i],
  ["platform:ios", /\biOS\b/], ["platform:android", /\bAndroid\b/],
  ["platform:browser", /\bbrowser extensions?|Chrome extensions?\b/i],
  ["platform:api", /\bAPIs?\b/], ["region:global", /\bglobal(?:ly)?|worldwide\b/i],
  ["region:philippines", /\bPhilippines|Filipino\b/i], ["region:asia", /\bAsia(?:n)?\b/i],
]

export function analyzeLiveEvidence(input: {
  channel: Channel
  sourceUrl: string
  combined: string
  facts: { title: string; description: string; text: string; links: { text: string; href: string }[] }
  homepage: UrlCheck
  search: SearchResult[]
  taxonomy: Map<string, DistributionTag>
  observedAt: string
}) {
  const { channel, sourceUrl, combined, facts, homepage, search, taxonomy, observedAt } = input
  const parked = parkedText.test(combined)
  const dead = homepage.reachable && parked
  const type = purposes.find((rule) => rule.pattern.test(combined))?.type ?? null
  const relevant = type !== null
  const pageSubmit = facts.links.find((link) => submissionText.test(link.text) && new URL(link.href).protocol.startsWith("http"))
  const searchSubmit = search.find((result) => submissionText.test(`${result.title} ${result.snippet ?? ""}`)
    && !/\b(help|docs?|documentation|guide|how to|post|article|blog|finding)\b/i.test(`${result.title} ${new URL(result.url).pathname}`))
  const submitUrl = pageSubmit?.href ?? searchSubmit?.url ?? null
  return { parked, dead, type, relevant, pageSubmit, searchSubmit, submitUrl, taxonomyTagIds:
    taxonomyRules.filter(([, pattern]) => pattern.test(combined)).map(([key]) => taxonomy.get(key)?.id).filter((id): id is string => Boolean(id)),
    tagSourceValues: taxonomyRules.filter(([, pattern]) => pattern.test(combined)).map(([key]) => key),
    sourceUrl, observedAt, channel }
}
