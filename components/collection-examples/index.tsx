"use client"

import type { ComponentType, ReactElement } from "react"
import { ActivityCapsuleExample } from "./activity"
import {
  AgentCompanionsExample,
  VoiceCapsuleExample,
  ImageGenerationRevealExample,
  ImageComparisonExample,
} from "./agent-media"
import {
  MorphingActionMenuExample,
  CommandPaletteExample,
  NotificationStackExample,
  ContextualInspectorExample,
  PresenceGroupExample,
} from "./overlays"
import {
  PrecisionDialExample,
  ContextToolbarExample,
  FileIntakeExample,
  PrecisionCounterExample,
  HoldToConfirmExample,
} from "./precision"
import type { CollectionId } from "@/lib/collection-additions"

const examples: Record<CollectionId, ComponentType> = {
  "agent-companions": AgentCompanionsExample,
  "activity-capsule": ActivityCapsuleExample,
  "morphing-action-menu": MorphingActionMenuExample,
  "image-generation-reveal": ImageGenerationRevealExample,
  "command-palette": CommandPaletteExample,
  "voice-capsule": VoiceCapsuleExample,
  "precision-dial": PrecisionDialExample,
  "context-toolbar": ContextToolbarExample,
  "file-intake": FileIntakeExample,
  "notification-stack": NotificationStackExample,
  "contextual-inspector": ContextualInspectorExample,
  "presence-group": PresenceGroupExample,
  "precision-counter": PrecisionCounterExample,
  "image-comparison": ImageComparisonExample,
  "hold-to-confirm": HoldToConfirmExample,
}

export function CollectionExample({ id }: { id: CollectionId }): ReactElement {
  const Example = examples[id]
  return (
    <div
      data-collection-example={id}
      className={
        id === "agent-companions"
          ? "min-w-0 text-foreground"
          : "flex min-h-[440px] min-w-0 items-center justify-center rounded-[20px] bg-[#171717] px-4 py-10 text-foreground sm:px-8"
      }
    >
      <Example />
    </div>
  )
}
