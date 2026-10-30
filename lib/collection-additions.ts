import type { CatalogEntry } from "./catalog"

export const collectionIds = [
  "agent-companions",
  "activity-capsule",
  "morphing-action-menu",
  "image-generation-reveal",
  "command-palette",
  "voice-capsule",
  "precision-dial",
  "context-toolbar",
  "file-intake",
  "notification-stack",
  "contextual-inspector",
  "presence-group",
  "precision-counter",
  "image-comparison",
  "hold-to-confirm",
] as const
export type CollectionId = (typeof collectionIds)[number]
export function isCollectionId(id: string): id is CollectionId {
  return (collectionIds as readonly string[]).includes(id)
}

export const collectionEntries: readonly CatalogEntry[] = [
  {
    id: "agent-companions",
    group: "ai-agents",
    title: "AI agents",
    summary: "Four characters, ready to join your team",
    description:
      "Four expressive SVG characters with curious idle gestures, focused working states, and sleepy little personalities.",
    href: "/components/agent-companions",
    preview: "agent-companions",
    installation: {
      kind: "source",
      command: "pnpm add motion cn",
      files: [
        "components/ui/agent-companion.tsx",
        "components/ui/agent-character-art.tsx",
        "lib/agent-companion-motion.ts",
        "lib/collection-media.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4. Supply shape (lavender-bot, orange-bot, pink-cat, lime-bloom), state (idle, working, sleeping), and size. Layered SVG artwork is included. Mark an enclosing card with data-agent-trigger to react to hover and keyboard focus. Motion stops offscreen, in hidden tabs, and for reduced-motion preferences. animated={false} makes a static thumbnail. Legacy shapes pebble, arch, and satellite map to Lavender bot, Pink cat, and Lime bloom.",
      usage: `import { AgentCompanion } from "@/components/ui/agent-companion"

export function Example() {
  return <div data-agent-trigger tabIndex={0} aria-label="Lavender bot preview">
    <AgentCompanion shape="lavender-bot" state="working" size={112} label="Lavender bot is researching" />
  </div>
}`,
    },
  },
  {
    id: "activity-capsule",
    group: "components",
    title: "Activity capsule",
    summary: "A small space for the whole task",
    description:
      "A compact status expands into progress, completed steps, and a useful result.",
    href: "/components/activity-capsule",
    preview: "activity-capsule",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn",
      files: [
        "components/ui/activity-capsule.tsx",
        "components/ui/button.tsx",
        "lib/utils.ts",
      ],
      requirements:
        "React 19, Tailwind CSS 4, Motion, @base-ui/react, class-variance-authority, lucide-react, and cn. Your application supplies task status, progress, steps, and action callbacks. The preview exports real local theme tokens; no server is required.",
      usage:
        'import { ActivityCapsule } from "@/components/ui/activity-capsule"\n\nexport function Example() {\n  return <ActivityCapsule title="Preparing export" status="running" progress={42}\n    steps={[{ id: "assets", label: "Collect assets", status: "complete" },\n      { id: "package", label: "Package export", status: "running" }]} />\n}',
    },
  },
  {
    id: "morphing-action-menu",
    group: "components",
    title: "Morphing action menu",
    summary: "One surface, more possibilities",
    description:
      "A compact trigger grows into an action menu with aligned shortcuts and keyboard navigation.",
    href: "/components/morphing-action-menu",
    preview: "morphing-action-menu",
    installation: {
      kind: "source",
      command: "pnpm add motion @base-ui/react lucide-react cn",
      files: ["components/ui/morphing-action-menu.tsx", "lib/utils.ts"],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Pass actions with stable IDs, labels, and onSelect callbacks. Base UI handles focus and keyboard selection. Shortcut text is a label; register application shortcuts separately when needed.",
      usage: `"use client"

import { useState } from "react"
import { MorphingActionMenu } from "@/components/ui/morphing-action-menu"

export function Example() {
  const [archived, setArchived] = useState(false)
  return <>
    <MorphingActionMenu actions={[
      { id: "archive", label: archived ? "Restore project" : "Archive project", onSelect: () => setArchived(!archived) },
    ]} />
    <p role="status">{archived ? "Project archived" : "Project active"}</p>
  </>
}`,
    },
  },
  {
    id: "image-generation-reveal",
    group: "effects",
    title: "Image generation reveal",
    summary: "From first impression to final image",
    description:
      "Coarse pixels resolve into a loaded image while its framing stays aligned.",
    href: "/components/image-generation-reveal",
    preview: "image-generation-reveal",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn",
      files: [
        "components/ui/image-generation-reveal.tsx",
        "components/ui/button.tsx",
        "lib/collection-media.ts",
        "lib/utils.ts",
        "public/collection/sierra-refined.svg",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Provide src and alt; duration controls the reveal in milliseconds. The effect starts after the image loads and includes retry on failure. Replace the included original artwork with your own image. No image-generation service is included.",
      usage: `import { ImageGenerationReveal } from "@/components/ui/image-generation-reveal"

export function Example() {
  return <ImageGenerationReveal src="/collection/sierra-refined.svg" alt="Mountain lake at dusk" duration={1400} />
}`,
    },
  },
  {
    id: "command-palette",
    group: "components",
    title: "Command palette",
    summary: "Find your next action",
    description:
      "Workspace search with category filters, recent actions, nested commands, and a compact keyboard-first dialog.",
    href: "/components/command-palette",
    preview: "command-palette",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn tw-animate-css",
      files: [
        "components/ui/command-palette.tsx",
        "components/ui/dialog.tsx",
        "components/ui/button.tsx",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4. Keep the shared theme tokens and tw-animate-css global import. Actions need an ID, label, and category; provide onSelect for a leaf action or children for a nested menu. Search and recent actions stay in client memory. The default shortcut is Command/Ctrl K.",
      usage: `"use client"

import { useState } from "react"
import { CommandPalette } from "@/components/ui/command-palette"

export function Example() {
  const [view, setView] = useState("Overview")
  return <>
    <CommandPalette actions={[
      { id: "overview", label: "Open overview", category: "Pages", onSelect: () => setView("Overview") },
      { id: "drafts", label: "Open drafts", category: "Pages", onSelect: () => setView("Drafts") },
    ]} />
    <p role="status">Current view: {view}</p>
  </>
}`,
    },
  },
  {
    id: "voice-capsule",
    group: "ai-agents",
    title: "Voice capsule",
    summary: "A quiet surface for a conversation",
    description:
      "A sound-reactive capsule moves from listening through processing to a readable transcript.",
    href: "/components/voice-capsule",
    preview: "voice-capsule",
    installation: {
      kind: "source",
      command: "pnpm add motion lucide-react cn",
      files: [
        "components/ui/voice-capsule.tsx",
        "lib/collection-media.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Supply idle, listening, processing, or transcript state and a normalized level from 0 to 1. Microphone capture and transcription belong to your application; the preview is a scripted sample. Set tone to ice for the optional cool accent.",
      usage: `import { VoiceCapsule } from "@/components/ui/voice-capsule"

export function Example() {
  return <VoiceCapsule state="listening" level={0.6} label="Listening to your note…" />
}`,
    },
  },
  {
    id: "precision-dial",
    group: "components",
    title: "Precision dial",
    summary: "Small adjustments, exact values",
    description:
      "A finely marked circular control with pointer tracking, keyboard adjustment, and direct numeric entry.",
    href: "/components/precision-dial",
    preview: "precision-dial",
    installation: {
      kind: "source",
      command: "pnpm add motion @base-ui/react cn",
      files: [
        "components/ui/precision-dial.tsx",
        "components/ui/input.tsx",
        "lib/precision-controls.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. This controlled input requires value and onValueChange. Set min, max, step, label, and unit for your measurement. Click the value to type; arrow keys, Home, and End also adjust the dial.",
      usage: `"use client"

import { useState } from "react"
import { PrecisionDial } from "@/components/ui/precision-dial"

export function Example() {
  const [light, setLight] = useState(64)
  return <PrecisionDial value={light} onValueChange={setLight} min={0} max={100} step={1} label="Light" unit="%" />
}`,
    },
  },
  {
    id: "context-toolbar",
    group: "components",
    title: "Context toolbar",
    summary: "The right tool, in focus",
    description:
      "Compact tool icons expand into clear labels while neighboring actions move smoothly into place.",
    href: "/components/context-toolbar",
    preview: "context-toolbar",
    installation: {
      kind: "source",
      command: "pnpm add motion @base-ui/react lucide-react cn",
      files: ["components/ui/context-toolbar.tsx", "lib/utils.ts"],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Supply a controlled value, onValueChange, and tools with stable IDs, labels, and icon components. Base UI provides toolbar keyboard navigation. Update the content when a tool is selected.",
      usage: `"use client"

import { useState } from "react"
import { AlignLeft, AlignCenter } from "lucide-react"
import { ContextToolbar } from "@/components/ui/context-toolbar"

export function Example() {
  const [alignment, setAlignment] = useState("left")
  return <>
    <p className={alignment === "center" ? "text-center" : "text-left"}>A good idea starts here.</p>
    <ContextToolbar value={alignment} onValueChange={setAlignment} label="Text alignment" tools={[
      { id: "left", label: "Left", icon: AlignLeft },
      { id: "center", label: "Center", icon: AlignCenter },
    ]} />
  </>
}`,
    },
  },
  {
    id: "file-intake",
    group: "components",
    title: "File intake",
    summary: "From drop target to useful attachment",
    description:
      "A file drop surface with previews, validation, removal, and optional upload progress and retry.",
    href: "/components/file-intake",
    preview: "file-intake",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn",
      files: [
        "components/ui/file-intake.tsx",
        "components/ui/mono-icon.tsx",
        "components/ui/button.tsx",
        "lib/mono-icons.ts",
        "lib/precision-controls.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Without onUpload, files remain local. To upload, provide async onUpload(file, { signal, onProgress }) connected to your service. Respect the AbortSignal, report progress from 0 to 100, and reject on failure to enable Retry. accept, maxBytes, and maxFiles control validation.",
      usage: `"use client"

import { useState } from "react"
import { FileIntake } from "@/components/ui/file-intake"

export function Example() {
  const [files, setFiles] = useState<readonly File[]>([])
  return <>
    <FileIntake accept="image/png,image/jpeg,image/webp" maxBytes={5 * 1024 * 1024} maxFiles={3} onFilesChange={setFiles} />
    <p role="status">{files.length} local attachments</p>
  </>
}`,
    },
  },
  {
    id: "notification-stack",
    group: "components",
    title: "Notification stack",
    summary: "Feedback with a little depth",
    description:
      "Layered notifications expand into readable messages with dismissal, action buttons, and touch gestures.",
    href: "/components/notification-stack",
    preview: "notification-stack",
    installation: {
      kind: "source",
      command: "pnpm add @base-ui/react lucide-react cn",
      files: ["components/ui/notification-stack.tsx", "lib/utils.ts"],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Place controls inside NotificationStack, then call useNotificationStack from a child. The hook exposes Base UI's toast manager, including add and close. Supply actionProps for Undo or another action. timeout defaults to 0, so messages remain until dismissed.",
      usage: `"use client"

import { NotificationStack, useNotificationStack } from "@/components/ui/notification-stack"

function NotifyAction() {
  const { add } = useNotificationStack()
  return <button onClick={() => add({ title: "Preview notification", description: "Your notification stack is connected." })}>Send notification</button>
}

export function Example() {
  return <NotificationStack><NotifyAction /></NotificationStack>
}`,
    },
  },
  {
    id: "contextual-inspector",
    group: "components",
    title: "Contextual inspector",
    summary: "Details beside your selection",
    description:
      "An adjacent metadata panel follows your selection and becomes a focused bottom sheet on phones.",
    href: "/components/contextual-inspector",
    preview: "contextual-inspector",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn tw-animate-css",
      files: [
        "components/ui/contextual-inspector.tsx",
        "components/ui/dialog.tsx",
        "components/ui/button.tsx",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4. Keep shared theme tokens and the tw-animate-css global import. Pass items with IDs, titles, and metadata label/value pairs. Optional actionLabel and onAction supply an item action. Selection is local; onSelect reports changes. Closing restores focus to the selected item's trigger.",
      usage: `import { ContextualInspector } from "@/components/ui/contextual-inspector"

export function Example() {
  return <ContextualInspector label="Project files" items={[
    { id: "brief", title: "Launch brief", subtitle: "Document", metadata: [
      { label: "Owner", value: "You" },
      { label: "Status", value: "Draft" },
    ] },
    { id: "assets", title: "Campaign assets", subtitle: "Folder", metadata: [
      { label: "Files", value: "12" },
      { label: "Status", value: "In review" },
    ] },
  ]} />
}`,
    },
  },
  {
    id: "presence-group",
    group: "components",
    title: "Presence group",
    summary: "A sense of who is here",
    description:
      "A responsive group of initials with presence dots, a shared nameplate, and an accessible overflow list.",
    href: "/components/presence-group",
    preview: "presence-group",
    installation: {
      kind: "source",
      command: "pnpm add motion @base-ui/react cn tw-animate-css",
      files: [
        "components/ui/presence-group.tsx",
        "components/ui/popover.tsx",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4. Keep shared theme tokens and the tw-animate-css global import. Supply people with IDs, names, initials, and online/away/offline status. Your application owns presence data; no realtime service is included. maxVisible controls overflow and onSelect can open a profile.",
      usage: `import { PresenceGroup } from "@/components/ui/presence-group"

export function Example() {
  return <PresenceGroup maxVisible={3} people={[
    { id: "maya", name: "Maya Chen", initials: "MC", status: "online", activity: "Editing the brief" },
    { id: "alex", name: "Alex Park", initials: "AP", status: "away" },
    { id: "ren", name: "Ren Ortiz", initials: "RO", status: "online" },
    { id: "sam", name: "Sam Lee", initials: "SL", status: "offline" },
  ]} />
}`,
    },
  },
  {
    id: "precision-counter",
    group: "components",
    title: "Precision counter",
    summary: "Every change, clearly measured",
    description:
      "Directional rolling digits keep punctuation anchored and reserve space as a number grows.",
    href: "/components/precision-counter",
    preview: "precision-counter",
    installation: {
      kind: "source",
      command: "pnpm add motion cn",
      files: [
        "components/ui/precision-counter.tsx",
        "lib/precision-controls.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Update value to animate a change. decimals and locale control formatting; prefix, suffix, and label describe the measurement. minDigits reserves display slots. Extra space is retained when values grow so neighboring content stays in place.",
      usage: `"use client"

import { useState } from "react"
import { PrecisionCounter } from "@/components/ui/precision-counter"

export function Example() {
  const [usage, setUsage] = useState(128.64)
  return <>
    <PrecisionCounter value={usage} decimals={2} suffix="GB" label="Storage used" />
    <button onClick={() => setUsage((current) => current + 1)}>Add one gigabyte</button>
  </>
}`,
    },
  },
  {
    id: "image-comparison",
    group: "components",
    title: "Image comparison",
    summary: "See exactly what changed",
    description:
      "A precise divider reveals two registered images through dragging, touch, or keyboard adjustment.",
    href: "/components/image-comparison",
    preview: "image-comparison",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn",
      files: [
        "components/ui/image-comparison.tsx",
        "components/ui/button.tsx",
        "lib/collection-media.ts",
        "lib/utils.ts",
        "public/collection/sierra-original.svg",
        "public/collection/sierra-refined.svg",
      ],
      requirements:
        "React 19 and Tailwind CSS 4 with shared theme tokens. Supply beforeSrc, afterSrc, and alt. Use defaultValue for local control or value and onValueChange for application state. Both images use the same 3:2 cover crop; provide matching composition and dimensions. Replace the included original artwork with your own registered images if desired.",
      usage: `import { ImageComparison } from "@/components/ui/image-comparison"

export function Example() {
  return <ImageComparison beforeSrc="/collection/sierra-original.svg" afterSrc="/collection/sierra-refined.svg" alt="Mountain lake color grade comparison" defaultValue={50} />
}`,
    },
  },
  {
    id: "hold-to-confirm",
    group: "components",
    title: "Hold to confirm",
    summary: "A deliberate moment before the action",
    description:
      "A measured hold completes into confirmation, with clean cancellation and a click-based alternative.",
    href: "/components/hold-to-confirm",
    preview: "hold-to-confirm",
    installation: {
      kind: "source",
      command:
        "pnpm add motion @base-ui/react class-variance-authority lucide-react cn tw-animate-css",
      files: [
        "components/ui/hold-to-confirm.tsx",
        "components/ui/dialog.tsx",
        "components/ui/button.tsx",
        "lib/utils.ts",
      ],
      requirements:
        "React 19 and Tailwind CSS 4. Keep shared theme tokens and the tw-animate-css global import. Provide onConfirm for your application action. holdMs controls the duration; early release cancels. An alternative confirmation dialog supports users who cannot hold. The component confirms once per mount; use a new key to reset it after Undo.",
      usage: `"use client"

import { useState } from "react"
import { HoldToConfirm } from "@/components/ui/hold-to-confirm"

export function Example() {
  const [archived, setArchived] = useState(false)
  return <>
    <HoldToConfirm label="Hold to archive" confirmedLabel="Archived" onConfirm={() => setArchived(true)} />
    <p role="status">{archived ? "Project archived locally" : "Project active"}</p>
  </>
}`,
    },
  },
]
