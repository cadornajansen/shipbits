import type { ReactElement } from "react"
import { EffectIcon } from "@/components/effect-icon"
import { AIChatThumbnail } from "@/components/ai-chat-thumbnail"
import { GlassFolderThumbnail } from "@/components/glass-folder-thumbnail"
import { MonoIcon } from "@/components/ui/mono-icon"
import { ThinkingOrbThumbnail } from "@/components/thinking-orb-thumbnail"
import type { CatalogId } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { isCollectionId } from "@/lib/collection-additions"
import { CollectionGlyph } from "@/components/collection-artwork"

export function CatalogIcon({
  id,
  className,
}: {
  id: CatalogId
  className?: string
}): ReactElement {
  if (isCollectionId(id))
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-[#222] shadow-(--site-ring)",
          className
        )}
      >
        <CollectionGlyph id={id} />
      </span>
    )
  if (id === "mono-icons" || id === "thinking-orbs") {
    return (
      <span
        className={cn(
          "inline-flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-[#222] shadow-(--site-ring)",
          className
        )}
        aria-hidden="true"
      >
        {id === "thinking-orbs" ? (
          <ThinkingOrbThumbnail className="size-[85%] text-white" />
        ) : (
          <MonoIcon name="home" className="size-[75%]" />
        )}
      </span>
    )
  }
  if (id !== "ai-chat" && id !== "glass-folder") {
    return (
      <EffectIcon
        effect={id}
        className={cn("size-[46px] shrink-0 rounded-xl", className)}
      />
    )
  }
  return (
    <span
      className={cn(
        "inline-flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-[#222] shadow-(--site-ring)",
        className
      )}
      aria-hidden="true"
    >
      {id === "ai-chat" ? (
        <AIChatThumbnail compact className="size-[80%]" />
      ) : (
        <GlassFolderThumbnail className="size-[75%]" />
      )}
    </span>
  )
}
