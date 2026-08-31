import type { Channel, ChannelTag, DistributionTag, TagType } from "./types"

type ClassifiableChannel = Pick<
  Channel,
  "id" | "name" | "description" | "canonical_url" | "channel_type"
>

export type ClassifiedTag = ChannelTag & { tag: DistributionTag }

type TagSuggestion = {
  type: TagType
  slug: string
  relevance: number
  confidence: number
}

const channelTypeTags: Record<string, TagSuggestion[]> = {
  directory: [
    { type: "category", slug: "software-discovery", relevance: 85, confidence: 90 },
    { type: "platform", slug: "web", relevance: 80, confidence: 90 },
  ],
  review_site: [
    { type: "category", slug: "software-reviews", relevance: 100, confidence: 100 },
    { type: "category", slug: "software-discovery", relevance: 90, confidence: 95 },
    { type: "product_type", slug: "saas", relevance: 80, confidence: 85 },
    { type: "product_type", slug: "b2b-software", relevance: 80, confidence: 85 },
    { type: "audience", slug: "businesses", relevance: 85, confidence: 90 },
    { type: "audience", slug: "founders", relevance: 75, confidence: 85 },
    { type: "platform", slug: "web", relevance: 90, confidence: 95 },
  ],
  launch_platform: [
    { type: "category", slug: "product-launch", relevance: 100, confidence: 100 },
    { type: "category", slug: "software-discovery", relevance: 80, confidence: 90 },
    { type: "audience", slug: "founders", relevance: 95, confidence: 95 },
    { type: "audience", slug: "startups", relevance: 90, confidence: 95 },
    { type: "audience", slug: "early-adopters", relevance: 85, confidence: 90 },
    { type: "platform", slug: "web", relevance: 90, confidence: 95 },
  ],
  community: [
    { type: "category", slug: "software-discovery", relevance: 70, confidence: 80 },
    { type: "platform", slug: "web", relevance: 80, confidence: 90 },
  ],
  newsletter: [
    { type: "category", slug: "software-discovery", relevance: 70, confidence: 80 },
    { type: "platform", slug: "web", relevance: 80, confidence: 90 },
  ],
  app_store: [
    { type: "category", slug: "app-marketplace", relevance: 100, confidence: 100 },
  ],
  marketplace: [
    { type: "category", slug: "app-marketplace", relevance: 95, confidence: 95 },
    { type: "platform", slug: "web", relevance: 80, confidence: 90 },
  ],
  forum: [
    { type: "category", slug: "software-discovery", relevance: 70, confidence: 75 },
    { type: "platform", slug: "web", relevance: 85, confidence: 95 },
  ],
}

const keywordTags: Array<{ pattern: RegExp; tags: TagSuggestion[] }> = [
  { pattern: /\b(ai|artificial intelligence|machine learning|llm)\b/i, tags: [
    { type: "product_type", slug: "ai-tool", relevance: 90, confidence: 90 },
    { type: "category", slug: "artificial-intelligence", relevance: 95, confidence: 90 },
    { type: "category", slug: "ai-directory", relevance: 95, confidence: 90 },
  ] },
  { pattern: /\b(startup|founder)\b/i, tags: [
    { type: "category", slug: "startup-directory", relevance: 90, confidence: 85 },
    { type: "audience", slug: "founders", relevance: 85, confidence: 90 },
    { type: "audience", slug: "startups", relevance: 85, confidence: 90 },
  ] },
  { pattern: /\b(developer|programmer|devops|coding|code|sdk|framework)\b/i, tags: [
    { type: "product_type", slug: "developer-tool", relevance: 90, confidence: 90 },
    { type: "category", slug: "developer-tools", relevance: 95, confidence: 90 },
    { type: "audience", slug: "developers", relevance: 95, confidence: 95 },
  ] },
  { pattern: /\b(api|apis)\b/i, tags: [
    { type: "product_type", slug: "api", relevance: 95, confidence: 95 },
    { type: "category", slug: "api-marketplace", relevance: 90, confidence: 85 },
    { type: "platform", slug: "api", relevance: 95, confidence: 95 },
    { type: "audience", slug: "developers", relevance: 90, confidence: 90 },
  ] },
  { pattern: /\b(open[ -]source|repository|repositories)\b/i, tags: [
    { type: "product_type", slug: "open-source", relevance: 95, confidence: 95 },
    { type: "category", slug: "open-source", relevance: 95, confidence: 95 },
  ] },
  { pattern: /\b(browser extension|browser add-ons?|chrome extension|firefox add-ons?)\b/i, tags: [
    { type: "product_type", slug: "browser-extension", relevance: 100, confidence: 100 },
    { type: "category", slug: "browser-extensions", relevance: 100, confidence: 100 },
    { type: "platform", slug: "browser", relevance: 100, confidence: 100 },
  ] },
  { pattern: /\b(shopify|ecommerce|e-commerce)\b/i, tags: [
    { type: "product_type", slug: "ecommerce", relevance: 90, confidence: 90 },
    { type: "category", slug: "ecommerce", relevance: 95, confidence: 90 },
  ] },
  { pattern: /\b(wordpress|plugin)\b/i, tags: [
    { type: "category", slug: "plugins", relevance: 90, confidence: 90 },
  ] },
  { pattern: /\b(productivity|notes|task management|project management)\b/i, tags: [
    { type: "product_type", slug: "productivity", relevance: 85, confidence: 85 },
    { type: "category", slug: "productivity", relevance: 90, confidence: 85 },
  ] },
  { pattern: /\b(education|learning|student|course|lecture|flashcards?)\b/i, tags: [
    { type: "product_type", slug: "education", relevance: 90, confidence: 90 },
    { type: "category", slug: "education", relevance: 95, confidence: 90 },
    { type: "audience", slug: "students", relevance: 90, confidence: 85 },
  ] },
]

function platformIdentity(url: string): TagSuggestion[] {
  if (/chromewebstore\.google\.com|addons\.mozilla\.org|microsoftedge\.microsoft\.com\/addons/i.test(url)) return [
    { type: "product_type", slug: "browser-extension", relevance: 100, confidence: 100 },
    { type: "category", slug: "browser-extensions", relevance: 100, confidence: 100 },
    { type: "platform", slug: "browser", relevance: 100, confidence: 100 },
  ]
  if (/apps\.apple\.com/i.test(url)) return [
    { type: "product_type", slug: "mobile-app", relevance: 100, confidence: 100 },
    { type: "platform", slug: "ios", relevance: 100, confidence: 100 },
  ]
  if (/play\.google\.com|f-droid\.org/i.test(url)) return [
    { type: "product_type", slug: "mobile-app", relevance: 100, confidence: 100 },
    { type: "platform", slug: "android", relevance: 100, confidence: 100 },
  ]
  if (/flathub\.org/i.test(url)) return [
    { type: "product_type", slug: "open-source", relevance: 95, confidence: 95 },
    { type: "platform", slug: "linux", relevance: 100, confidence: 100 },
  ]
  if (/apps\.shopify\.com/i.test(url)) return [
    { type: "product_type", slug: "ecommerce", relevance: 100, confidence: 100 },
    { type: "category", slug: "ecommerce", relevance: 100, confidence: 100 },
    { type: "platform", slug: "shopify", relevance: 100, confidence: 100 },
  ]
  if (/wordpress\.org\/plugins/i.test(url)) return [
    { type: "category", slug: "plugins", relevance: 100, confidence: 100 },
    { type: "platform", slug: "wordpress", relevance: 100, confidence: 100 },
  ]
  if (/github\.com/i.test(url)) return [
    { type: "product_type", slug: "developer-tool", relevance: 90, confidence: 90 },
    { type: "product_type", slug: "open-source", relevance: 90, confidence: 90 },
    { type: "category", slug: "developer-tools", relevance: 90, confidence: 90 },
    { type: "platform", slug: "github", relevance: 100, confidence: 100 },
    { type: "audience", slug: "developers", relevance: 95, confidence: 95 },
  ]
  if (/devhunt\.org/i.test(url)) return [
    { type: "product_type", slug: "developer-tool", relevance: 100, confidence: 100 },
    { type: "category", slug: "developer-tools", relevance: 100, confidence: 100 },
    { type: "audience", slug: "developers", relevance: 100, confidence: 100 },
  ]
  if (/news\.ycombinator\.com/i.test(url)) return [
    { type: "product_type", slug: "developer-tool", relevance: 80, confidence: 90 },
    { type: "category", slug: "developer-tools", relevance: 85, confidence: 90 },
    { type: "audience", slug: "developers", relevance: 95, confidence: 95 },
    { type: "audience", slug: "founders", relevance: 80, confidence: 90 },
  ]
  if (/sourceforge\.net/i.test(url)) return [
    { type: "product_type", slug: "open-source", relevance: 100, confidence: 100 },
    { type: "category", slug: "open-source", relevance: 100, confidence: 100 },
  ]
  return []
}

export function classifyChannel(channel: ClassifiableChannel, taxonomy: DistributionTag[]): ClassifiedTag[] {
  const available = new Map(taxonomy.map((tag) => [`${tag.type}:${tag.slug}`, tag]))
  const suggestions = [
    ...(channel.channel_type ? (channelTypeTags[channel.channel_type] ?? []) : []),
    ...platformIdentity(channel.canonical_url),
    { type: "region" as const, slug: "global", relevance: 75, confidence: 85 },
  ]
  const text = `${channel.name} ${channel.description} ${channel.canonical_url}`
  for (const rule of keywordTags) if (rule.pattern.test(text)) suggestions.push(...rule.tags)

  const unique = new Map<string, TagSuggestion>()
  for (const suggestion of suggestions) {
    const key = `${suggestion.type}:${suggestion.slug}`
    const current = unique.get(key)
    if (!current || suggestion.relevance > current.relevance) unique.set(key, suggestion)
  }
  return [...unique.values()].flatMap((suggestion) => {
    const tag = available.get(`${suggestion.type}:${suggestion.slug}`)
    return tag ? [{ tag_id: tag.id, relevance_score: suggestion.relevance, confidence_score: suggestion.confidence, tag }] : []
  })
}
