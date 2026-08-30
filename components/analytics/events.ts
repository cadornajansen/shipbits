"use client"

type EventProperties = {
  product_view: { productId: string }
  product_outbound_click: { productId: string }
  blog_view: { slug: string }
  seo_check_started: { score?: number }
  seo_check_completed: { score: number }
  badge_copied: { productId: string; format: "html" | "markdown" }
  newsletter_signup: Record<string, never>
}

export type AnalyticsEvent = keyof EventProperties

// A vendor adapter can listen to this event later. No cookies, IDs, or network
// tracking are introduced here; do not add emails or submitted URLs to payloads.
export function trackEvent<Event extends AnalyticsEvent>(
  name: Event,
  properties: EventProperties[Event]
): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("shipbits:analytics", {
    detail: { name, properties },
  }))
}
