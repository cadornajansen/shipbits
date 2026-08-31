"use client"

import type { ComponentProps } from "react"
import { trackEvent } from "@/components/analytics/events"

export function ProductOutboundLink({
  productId,
  children,
  ...props
}: Omit<ComponentProps<"a">, "onClick" | "rel" | "target"> & { productId: string }) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer ugc"
      onClick={() => trackEvent("product_outbound_click", { productId })}
    >
      {children}
    </a>
  )
}
