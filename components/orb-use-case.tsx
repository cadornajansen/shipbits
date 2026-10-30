"use client"

import type { ReactElement } from "react"
import { AiOrb, AI_ORB_NAMES, type AiOrbProps } from "@/components/ui/ai-orb"
import { Badge } from "@/components/ui/badge"
import type { OrbPresentation } from "@/lib/ai-orb-studio"

export function OrbUseCase({
  presentation = "badge",
  ...props
}: AiOrbProps & { presentation?: OrbPresentation }): ReactElement {
  const text =
    props.state === "orchestrating"
      ? "Coordinating tasks…"
      : props.state === "base" || props.state === "idle"
        ? "Ready"
        : props.state === "error"
          ? "Needs attention"
          : AI_ORB_NAMES[props.state] + "…"
  if (presentation === "orb") return <AiOrb {...props} />
  if (presentation === "inline")
    return (
      <span className="inline-flex max-w-full items-center gap-3 text-[13px] text-muted-foreground">
        <AiOrb {...props} decorative />
        <span>{text}</span>
      </span>
    )
  return (
    <Badge
      variant="secondary"
      className="h-auto max-w-full gap-3 rounded-full border-white/5 bg-[#1b1b1b] px-4 py-2 font-normal text-muted-foreground"
    >
      <AiOrb {...props} decorative />
      <span
        className={
          props.size === "lg" || !props.size
            ? "min-w-0 text-left text-lg tracking-[-.2px] whitespace-normal"
            : "min-w-0 text-left text-[13px] whitespace-normal"
        }
      >
        {text}
      </span>
    </Badge>
  )
}
