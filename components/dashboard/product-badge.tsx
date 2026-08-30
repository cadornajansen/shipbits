"use client"

import Image from "next/image"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"

import { trackEvent } from "@/components/analytics/events"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type BadgeVariant,
  getVerifiedBadgePath,
} from "@/features/products/badges"
import { absoluteUrl } from "@/lib/site"

type CopyTarget = "html" | "markdown" | "url"

export function ProductBadge({
  productId,
  slug,
}: {
  productId: string
  slug: string
}) {
  const [copied, setCopied] = useState<CopyTarget | null>(null)
  const [variant, setVariant] = useState<BadgeVariant>("default")
  const productUrl = absoluteUrl(`/products/${slug}`)
  const badgePath = getVerifiedBadgePath(slug, variant)
  const badgeUrl = absoluteUrl(badgePath)
  const values: Record<CopyTarget, string> = {
    html: `<a href="${productUrl}"><img src="${badgeUrl}" alt="Featured on ShipBits" width="250" height="54"></a>`,
    markdown: `[![Featured on ShipBits](${badgeUrl})](${productUrl})`,
    url: badgeUrl,
  }

  async function copy(target: CopyTarget) {
    await navigator.clipboard.writeText(values[target])
    setCopied(target)
    trackEvent("badge_copied", {
      productId,
      format: target === "url" ? "badge_url" : target,
    })
    window.setTimeout(
      () => setCopied((current) => (current === target ? null : current)),
      1500
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <CopyIcon data-icon="inline-start" />
          Copy badge
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ShipBits Badge</DialogTitle>
          <DialogDescription>
            Add the badge to your product website.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={variant}
          onValueChange={(value) => {
            setVariant(value as BadgeVariant)
            setCopied(null)
          }}
          className="gap-3"
        >
          <TabsList aria-label="Badge style" className="h-8">
            <TabsTrigger value="default" className="px-3 text-xs">
              Default
            </TabsTrigger>
            <TabsTrigger value="monochrome" className="px-3 text-xs">
              Mono
            </TabsTrigger>
            <TabsTrigger value="yellow" className="px-3 text-xs">
              Yellow
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex min-h-24 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
          <Image
            src={badgePath}
            alt="Featured on ShipBits badge preview"
            width={250}
            height={54}
            unoptimized
            className="h-[54px] w-[250px] max-w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {(
            [
              ["html", "Copy HTML"],
              ["markdown", "Copy Markdown"],
              ["url", "Copy URL"],
            ] as const
          ).map(([target, label]) => (
            <Button
              key={target}
              type="button"
              size="sm"
              variant="outline"
              className="min-w-[7.5rem] flex-1"
              onClick={() => copy(target)}
            >
              {copied === target ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied === target ? "Copied" : label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
