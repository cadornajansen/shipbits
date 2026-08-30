"use client"

import { useEffect, useRef } from "react"
import { trackEvent } from "@/components/analytics/events"

type PageViewProps =
  | { event: "product_view"; properties: { productId: string } }
  | { event: "blog_view"; properties: { slug: string } }

export function PageView(props: PageViewProps) {
  const sent = useRef<string | null>(null)
  const identifier = props.event === "product_view"
    ? props.properties.productId
    : props.properties.slug

  useEffect(() => {
    const key = `${props.event}:${identifier}`
    if (sent.current === key) return
    sent.current = key
    if (props.event === "product_view") {
      trackEvent("product_view", { productId: identifier })
    } else {
      trackEvent("blog_view", { slug: identifier })
    }
  }, [props.event, identifier])

  return null
}
