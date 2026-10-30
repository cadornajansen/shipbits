import { collectionEntries, type CollectionId } from "./collection-additions"
import { monoIcons } from "./mono-icons"

export type MaterialId = "glass" | "metal" | "distressed" | "foil" | "titanium"
export type CatalogId =
  | MaterialId
  | "ai-chat"
  | "thinking-orbs"
  | "glass-folder"
  | "mono-icons"
  | CollectionId

export const catalogGroups = [
  { id: "effects", title: "Effects" },
  { id: "ai-agents", title: "AI artifacts" },
  { id: "components", title: "Components" },
  { id: "icons", title: "Icons" },
] as const
export type CatalogGroupId = (typeof catalogGroups)[number]["id"]

export type Installation =
  | { kind: "registry"; path: string; requirements: string; usage: string }
  | {
      kind: "source"
      command?: string
      files: readonly string[]
      requirements: string
      usage: string
    }

export type CatalogEntry = {
  id: CatalogId
  group: CatalogGroupId
  title: string
  description: string
  summary: string
  href: string
  preview: CatalogId
  installation: Installation
  studio?: `/studio/${MaterialId | "thinking-orbs"}`
}

const materialFiles = [
  "components/ui/material-surface.tsx",
  "lib/materials/ (all files)",
  "lib/shaders/ (both shaders)",
  "lib/utils.ts",
] as const

// Only working, reviewed components belong here. Array order is the public navigation order.
export const catalog: readonly CatalogEntry[] = [
  {
    id: "glass",
    group: "effects",
    title: "Glass",
    summary: "Light, depth, and a little frost",
    description: "A glass surface with adjustable light, depth, and frost.",
    href: "/glass",
    preview: "glass",
    studio: "/studio/glass",
    installation: {
      kind: "source",
      files: [
        "components/ui/glass-link.tsx",
        "components/ui/button.tsx",
        "lib/glass-optics.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19, Tailwind CSS 4, cn, class-variance-authority, @base-ui/react, and lucide-react. Keep the shared theme tokens from app/globals.css.",
      usage:
        'import { GlassLink } from "@/components/ui/glass-link"\n\nexport function Example() {\n  return <GlassLink href="/explore">Browse</GlassLink>\n}',
    },
  },
  {
    id: "metal",
    group: "effects",
    title: "Liquid metal",
    summary: "Chrome that moves with the light",
    description:
      "Flowing chrome with adjustable reflections, contour, and motion.",
    href: "/metal",
    preview: "metal",
    studio: "/studio/metal",
    installation: {
      kind: "source",
      files: [
        "components/ui/liquid-metal.tsx",
        "lib/liquid-metal.ts",
        "lib/metal-shapes.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19, Tailwind CSS 4, cn, and @paper-design/shaders 0.0.81. WebGL renders the live material; the component includes a fallback.",
      usage:
        'import { LiquidMetal } from "@/components/ui/liquid-metal"\n\nexport function Example() {\n  return <LiquidMetal shape="triangle" className="size-64" />\n}',
    },
  },
  {
    id: "distressed",
    group: "effects",
    title: "Distressed",
    summary: "Texture with a rougher edge",
    description: "Grain, worn edges, and textured shapes made with SVG.",
    href: "/distressed",
    preview: "distressed",
    studio: "/studio/distressed",
    installation: {
      kind: "source",
      files: [
        "components/ui/distressed.tsx",
        "lib/distressed.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19, Tailwind CSS 4, and cn. SVG filters create the texture without a canvas dependency.",
      usage:
        'import { Distressed } from "@/components/ui/distressed"\n\nexport function Example() {\n  return <Distressed shape="text" text="SHIPBITS" className="w-80" />\n}',
    },
  },
  {
    id: "foil",
    group: "effects",
    title: "Holographic foil",
    summary: "Color hidden in every reflection",
    description:
      "Fine grooves, embossed details, and light that reveals color.",
    href: "/foil",
    preview: "foil",
    studio: "/studio/foil",
    installation: {
      kind: "source",
      files: ["components/ui/holographic-foil.tsx", ...materialFiles],
      requirements:
        "React 19, Tailwind CSS 4, cn, and @paper-design/shaders 0.0.81. Keep the material registry and both shaders together.",
      usage:
        'import { HolographicFoil } from "@/components/ui/holographic-foil"\n\nexport function Example() {\n  return <HolographicFoil className="h-48 w-72" />\n}',
    },
  },
  {
    id: "titanium",
    group: "effects",
    title: "Titanium",
    summary: "Brushed metal, polished edges",
    description:
      "Directional brushing, polished edges, and precise reflections.",
    href: "/titanium",
    preview: "titanium",
    studio: "/studio/titanium",
    installation: {
      kind: "source",
      files: ["components/ui/titanium.tsx", ...materialFiles],
      requirements:
        "React 19, Tailwind CSS 4, cn, and @paper-design/shaders 0.0.81. Keep the material registry and both shaders together.",
      usage:
        'import { Titanium } from "@/components/ui/titanium"\n\nexport function Example() {\n  return <Titanium className="h-48 w-72" />\n}',
    },
  },
  ...collectionEntries.filter((entry) => entry.group === "effects"),
  {
    id: "ai-chat",
    group: "ai-agents",
    title: "AI Chat",
    summary: "From the first prompt to the artifact",
    description:
      "A complete conversation. Messages, tools, approvals, sources, and a working composer.",
    href: "/components/ai-chat",
    preview: "ai-chat",
    installation: {
      kind: "registry",
      path: "/r/ai-chat.json",
      requirements:
        "React 19 and Tailwind CSS 4 with shadcn’s Base UI preset configured. The registry installs editable source and its dependencies. The demo runs locally; connect your own backend for real responses.",
      usage:
        '"use client"\n\nimport { AIChatDemo } from "@/components/ai-chat/demo"\n\nexport default function Example() {\n  return <AIChatDemo />\n}',
    },
  },
  {
    id: "thinking-orbs",
    group: "ai-agents",
    title: "Thinking orbs",
    summary: "A little motion for a train of thought",
    description:
      "Distinct dotted-sphere states for working, reasoning, searching, and coordinating.",
    href: "/components/thinking-orbs",
    preview: "thinking-orbs",
    studio: "/studio/thinking-orbs",
    installation: {
      kind: "source",
      command: "pnpm add thinking-orbs@0.3.2",
      files: [
        "components/ui/ai-orb.tsx",
        "lib/ai-orb-frames.ts",
        "lib/utils.ts",
      ],
      requirements:
        "React 19, Tailwind CSS 4, Motion, cn, and thinking-orbs 0.3.2. Shipbits supplies the particle geometry; the MIT-licensed thinking-orbs package supplies the canvas renderer. This project already has Motion and cn. In a new project also run pnpm add motion cn.",
      usage:
        'import { AiOrb } from "@/components/ui/ai-orb"\n\nexport function Example() {\n  return (\n    <div className="flex items-center gap-6">\n      <AiOrb state="working" variant="gyro" />\n      <AiOrb state="orchestrating" />\n    </div>\n  )\n}',
    },
  },
  ...collectionEntries.filter((entry) => entry.group === "ai-agents"),
  {
    id: "glass-folder",
    group: "components",
    title: "Glass folder",
    summary: "A place for your next idea",
    description:
      "Layered files behind frosted glass. Open, explore, and add something.",
    href: "/components/glass-folder",
    preview: "glass-folder",
    installation: {
      kind: "source",
      files: [
        "components/ui/glass-folder-cards.tsx",
        "lib/folder-art.ts",
        "lib/folder-geometry.ts",
        "lib/utils.ts",
        "folder-* keyframes from app/globals.css",
      ],
      requirements:
        "React 19, Tailwind CSS 4, cn, and lucide-react. Preserve the attribution in the source and the folder animation keyframes.",
      usage:
        'import GlassFolder from "@/components/ui/glass-folder-cards"\n\nexport function Example() {\n  return <GlassFolder label="Project files" art="aurora"\n    files={[{ name: "Brief.pdf", meta: "PDF" }]} />\n}',
    },
  },
  ...collectionEntries.filter((entry) => entry.group === "components"),
  {
    id: "mono-icons",
    group: "icons",
    title: "Mono icons",
    summary: `${monoIcons.length} little shapes, ready to use`,
    description: `${monoIcons.length} monochrome SVG icons. Editable layers, distinct hover animations, and static SVG downloads.`,
    href: "/icons/mono-icons",
    preview: "mono-icons",
    installation: {
      kind: "source",
      files: ["components/ui/mono-icon.tsx", "lib/mono-icons.ts"],
      requirements:
        "React 19 for the MonoIcon wrapper. Each icon stays an inline SVG with editable shapes. The standalone SVG files in public/icons/mono/ work without a framework.",
      usage:
        'import { MonoIcon } from "@/components/ui/mono-icon"\n\nexport function Example() {\n  return <MonoIcon name="home" width={24} height={24} aria-label="Home" />\n}',
    },
  },
]

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return catalog.find((entry) => entry.id === id)
}

export const gettingStarted = [
  { title: "Introduction", href: "/introduction" },
  { title: "Installation", href: "/installation" },
  { title: "Accessibility", href: "/accessibility" },
] as const
