"use client"

import { useState } from "react"
import Image from "next/image"

import { optimizedProductCoverUrl } from "@/lib/images/cloudflare"

export function FeaturedProductPreview({
  alt,
  preload = false,
  src,
}: {
  alt: string
  preload?: boolean
  src: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 animate-pulse bg-muted transition-opacity duration-200 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <Image
        src={optimizedProductCoverUrl(src)}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        preload={preload}
        unoptimized
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className="object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-50"
      />
    </>
  )
}
