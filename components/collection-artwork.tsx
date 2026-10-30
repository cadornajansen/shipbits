import {
  Bell,
  Check,
  ChevronDown,
  Command,
  FileUp,
  Gauge,
  GripVertical,
  Image as ImageIcon,
  Info,
  Layers,
  Mic,
  MoreHorizontal,
  MousePointer2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { ReactElement } from "react"
import type { CollectionId } from "@/lib/collection-additions"
import { AgentCompanion } from "@/components/ui/agent-companion"
import { MonoIcon } from "@/components/ui/mono-icon"

const glyphs: Record<Exclude<CollectionId, "agent-companions">, LucideIcon> = {
  "activity-capsule": Layers,
  "morphing-action-menu": MoreHorizontal,
  "image-generation-reveal": ImageIcon,
  "command-palette": Command,
  "voice-capsule": Mic,
  "precision-dial": Gauge,
  "context-toolbar": SlidersHorizontal,
  "file-intake": FileUp,
  "notification-stack": Bell,
  "contextual-inspector": Info,
  "presence-group": Users,
  "precision-counter": Gauge,
  "image-comparison": GripVertical,
  "hold-to-confirm": ShieldCheck,
}
export function CollectionGlyph({ id }: { id: CollectionId }): ReactElement {
  if (id === "agent-companions") {
    return <MonoIcon name="agents" className="size-[75%]" aria-hidden="true" />
  }
  const Icon = glyphs[id]
  return <Icon className="size-[55%] text-[#c4c4c4]" strokeWidth={1.4} />
}

/** Lightweight, non-interactive catalog art. Full controls only mount on their detail page. */
export function CollectionArtwork({ id }: { id: CollectionId }): ReactElement {
  const surface =
    "border border-white/10 bg-[#202020] shadow-[0_16px_36px_-20px_#000]"
  switch (id) {
    case "activity-capsule":
      return (
        <div
          className={`flex w-[76%] max-w-60 items-center gap-3 rounded-full p-4 ${surface}`}
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-white/30">
            <Check className="size-4" />
          </span>
          <div className="flex flex-1 flex-col gap-1 text-xs">
            <span>Export complete</span>
            <span className="text-[10px] text-muted-foreground">
              shipbits-tokens.json
            </span>
          </div>
          <ChevronDown className="size-3" />
        </div>
      )
    case "command-palette":
      return (
        <div className={`w-[78%] max-w-64 rounded-xl p-3 ${surface}`}>
          <div className="flex gap-2 border-b border-white/8 pb-3 text-xs text-muted-foreground">
            <Search className="size-3.5" />
            Find anything
            <Command className="ml-auto size-3" />
          </div>
          {["Recent projects", "Design system", "New workspace"].map(
            (item, index) => (
              <div
                key={item}
                className={
                  index === 1
                    ? "mt-1 flex items-center gap-2 rounded-md bg-white/8 p-2 text-xs"
                    : "flex items-center gap-2 p-2 text-xs text-muted-foreground"
                }
              >
                <Layers className="size-3" />
                {item}
              </div>
            )
          )}
        </div>
      )
    case "morphing-action-menu":
      return (
        <div className={`w-44 rounded-2xl p-2 ${surface}`}>
          <div className="flex items-center justify-between px-2 py-3 text-xs">
            Project actions
            <MoreHorizontal className="size-4" />
          </div>
          {["Duplicate", "Add to collection", "Archive"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-lg p-2 text-xs text-muted-foreground"
            >
              <span className="size-1 rounded-full bg-current" />
              {item}
            </div>
          ))}
        </div>
      )
    case "precision-dial":
      return (
        <svg
          viewBox="0 0 160 160"
          className="size-36 fill-none"
          aria-hidden="true"
        >
          <circle cx="80" cy="80" r="51" stroke="#333" strokeWidth="2" />
          {Array.from({ length: 41 }, (_, i) => {
            return (
              <line
                key={i}
                x1="142"
                y1="80"
                x2="147"
                y2="80"
                // Let SVG rotate fixed coordinates so server/browser rounding cannot differ.
                transform={`rotate(${i * 6.75 + 135} 80 80)`}
                stroke={i < 28 ? "#ddd" : "#444"}
                strokeWidth="1.4"
              />
            )
          })}
          <circle cx="80" cy="80" r="44" fill="#252525" stroke="#494949" />
          <path
            d="M80 42v9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            transform="rotate(52 80 80)"
          />
          <text x="80" y="85" textAnchor="middle" fill="#eee" fontSize="21">
            68
          </text>
          <text x="80" y="102" textAnchor="middle" fill="#888" fontSize="8">
            EXPOSURE
          </text>
        </svg>
      )
    case "context-toolbar":
      return (
        <div className={`flex items-center gap-2 rounded-2xl p-2 ${surface}`}>
          <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs">
            <MousePointer2 className="size-4" />
            Select
          </span>
          <SlidersHorizontal className="mx-2 size-4 text-muted-foreground" />
          <ImageIcon className="mx-2 size-4 text-muted-foreground" />
        </div>
      )
    case "precision-counter":
      return (
        <div className="flex flex-col gap-3 text-center">
          <span className="font-mono text-[42px] tracking-[-3px] text-[#e5e5e5]">
            12,480<span className="text-muted-foreground">.64</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Storage used · GB
          </span>
        </div>
      )
    case "hold-to-confirm":
      return (
        <div
          className={`relative flex h-14 w-52 items-center justify-center gap-2 overflow-hidden rounded-full ${surface}`}
        >
          <span className="absolute inset-y-0 left-0 w-2/3 bg-white/10" />
          <ShieldCheck className="relative size-4" />
          <span className="relative text-xs">Hold to confirm</span>
        </div>
      )
    case "voice-capsule":
      return (
        <div
          className={`flex items-center gap-5 rounded-full px-5 py-4 ${surface}`}
        >
          <Mic className="size-4 text-muted-foreground" />
          <span className="flex h-7 items-center gap-[3px]">
            {[7, 14, 23, 17, 27, 19, 11, 23, 16, 8].map((h, i) => (
              <svg key={i} width="3" height="28" aria-hidden="true">
                <rect
                  y={(28 - h) / 2}
                  width="3"
                  height={h}
                  rx="1.5"
                  fill="#d7d7d7"
                />
              </svg>
            ))}
          </span>
          <span className="text-xs text-muted-foreground">0:12</span>
        </div>
      )
    case "presence-group":
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="flex -space-x-2">
            {["JL", "AM", "SK", "+4"].map((name, i) => (
              <div
                key={name}
                className={`flex size-12 items-center justify-center rounded-full border-[3px] border-[#131313] text-xs ${i === 1 ? "-translate-y-2 bg-[#80888b] text-white" : "bg-[#333] text-[#bbb]"}`}
              >
                {name}
              </div>
            ))}
          </div>
          <span className="rounded-full bg-[#222] px-3 py-1.5 text-[10px]">
            Alex Morgan · Online
          </span>
        </div>
      )
    case "notification-stack":
      return (
        <div className="relative w-[75%] max-w-60 pb-4">
          <div className="absolute inset-x-5 bottom-0 h-14 rounded-2xl border border-white/5 bg-[#1a1a1a]" />
          <div className="absolute inset-x-2.5 bottom-2 h-14 rounded-2xl border border-white/10 bg-[#1d1d1d]" />
          <div
            className={`relative flex items-center gap-3 rounded-2xl p-4 ${surface}`}
          >
            <Check className="size-4" />
            <div className="flex-1 text-xs">
              Changes saved
              <p className="mt-1 text-[10px] text-muted-foreground">
                Everything is up to date
              </p>
            </div>
            <span className="text-[10px]">Undo</span>
          </div>
        </div>
      )
    case "file-intake":
      return (
        <div className="flex w-[72%] max-w-60 flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 p-7">
          <FileUp className="size-8 text-muted-foreground" strokeWidth={1} />
          <span className="text-xs">Drop something good</span>
          <span className="text-[10px] text-muted-foreground">
            Images, documents, ideas
          </span>
        </div>
      )
    case "contextual-inspector":
      return (
        <div
          className={`flex h-36 w-[80%] max-w-64 overflow-hidden rounded-xl ${surface}`}
        >
          <div className="flex flex-1 items-center justify-center border-r border-white/10">
            <ImageIcon
              className="size-10 text-muted-foreground"
              strokeWidth={1}
            />
          </div>
          <div className="flex w-28 flex-col gap-3 p-3 text-[10px]">
            <span>Details</span>
            <span className="text-muted-foreground">Studio render</span>
            <span className="h-px bg-white/10" />
            <span className="text-muted-foreground">2048 × 2048</span>
            <span className="text-muted-foreground">SVG · Original</span>
          </div>
        </div>
      )
    case "agent-companions":
      return (
        <div className="grid grid-cols-2 gap-3">
          {(
            ["lavender-bot", "orange-bot", "pink-cat", "lime-bloom"] as const
          ).map((shape) => (
            <AgentCompanion
              key={shape}
              shape={shape}
              size={80}
              animated={false}
              decorative
            />
          ))}
        </div>
      )
    case "image-generation-reveal":
    case "image-comparison":
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-[78%] max-w-64 overflow-hidden rounded-xl"
          aria-hidden="true"
        >
          <image
            href="/collection/sierra-refined.svg"
            width="240"
            height="160"
          />
          {id === "image-comparison" ? (
            <>
              <svg width="120" height="160" overflow="hidden">
                <image
                  href="/collection/sierra-original.svg"
                  width="240"
                  height="160"
                />
              </svg>
              <path d="M120 0v160" stroke="#fff" />
              <circle cx="120" cy="80" r="12" fill="#eee" />
              <path d="M117 76v8m6-8v8" stroke="#222" />
            </>
          ) : (
            Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x={(i % 4) * 32}
                y={Math.floor(i / 4) * 32}
                width="32"
                height="32"
                fill={i % 2 ? "#3d4b55" : "#607581"}
                opacity=".8"
              />
            ))
          )}
        </svg>
      )
  }
}
