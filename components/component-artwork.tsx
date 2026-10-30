"use client"

import type { ReactElement } from "react"
import { GlassSurface } from "@/components/ui/glass-link"
import { LiquidMetal } from "@/components/ui/liquid-metal"
import { Distressed } from "@/components/ui/distressed"
import { MaterialSurface } from "@/components/ui/material-surface"
import { AIChatThumbnail } from "@/components/ai-chat-thumbnail"
import { GlassFolderThumbnail } from "@/components/glass-folder-thumbnail"
import { AnimatedMonoIcon } from "@/components/ui/animated-mono-icon"
import { AiOrb } from "@/components/ui/ai-orb"
import type { CatalogId } from "@/lib/catalog"
import { isCollectionId } from "@/lib/collection-additions"
import { CollectionArtwork } from "@/components/collection-artwork"

export function ComponentArtwork({
  id,
  compact = false,
}: {
  id: CatalogId
  compact?: boolean
}): ReactElement {
  if (isCollectionId(id)) return <CollectionArtwork id={id} />
  const size = compact ? "size-[52px]" : "size-[160px] sm:size-[180px]"
  switch (id) {
    case "glass":
      return (
        <GlassSurface
          refractionMode="off"
          settings={{
            radius: compact ? 7 : 24,
            depth: 20,
            frost: 4,
            fillOpacity: 14,
          }}
          className={size}
        />
      )
    case "metal":
      return (
        <LiquidMetal
          shape={compact ? "circle" : "triangle"}
          decorative
          className={size}
        />
      )
    case "distressed":
      return (
        <Distressed
          shape={compact ? "square" : "text"}
          text="SHIPBITS"
          className={compact ? "w-[58px]" : "w-[75%] max-w-72"}
        />
      )
    case "foil":
    case "titanium":
      return (
        <MaterialSurface material={id} thumbnail={compact} className={size} />
      )
    case "ai-chat":
      return <AIChatThumbnail className="w-[75%] max-w-80" />
    case "thinking-orbs":
      return <AiOrb state="thinking" decorative />
    case "glass-folder":
      return <GlassFolderThumbnail className="h-auto w-[65%] max-w-56" />
    case "mono-icons":
      return (
        <div
          className="grid grid-cols-3 gap-4 p-5 sm:gap-5 sm:p-6"
          aria-hidden="true"
        >
          {(
            ["home", "pen", "folder", "settings", "coffee", "book"] as const
          ).map((name, index) => (
            <span key={name} data-mono-icon-preview className="flex">
              <AnimatedMonoIcon
                name={name}
                width={40}
                height={40}
                stagger={index * 80}
              />
            </span>
          ))}
        </div>
      )
  }
}
