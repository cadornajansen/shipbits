"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import { animate, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, Check, Command, Layers, Search } from "lucide-react"
import { PrecisionDial } from "@/components/ui/precision-dial"
import { AgentCompanion } from "@/components/ui/agent-companion"
import { AiOrb, type AiOrbLook } from "@/components/ui/ai-orb"
import { agentShapes } from "@/lib/agent-companion-motion"
import { useVisibleMediaMotion } from "@/lib/collection-media"

const commands = ["Project overview", "Design system", "Design tokens"]
const dialStops = [68, 84, 42, 76, 68]
const orbLooks = [
  { state: "orchestrating" },
  { state: "working", variant: "gyro" },
  { state: "reasoning", variant: "twins" },
  { state: "searching", variant: "lighthouse" },
  { state: "background", variant: "spiral" },
  { state: "compacting", variant: "fuse" },
] as const satisfies readonly AiOrbLook[]

export function FeaturedInteractionPreview({
  id,
}: {
  id:
    "precision-dial" | "command-palette" | "agent-companions" | "thinking-orbs"
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [interacting, setInteracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [orbIndex, setOrbIndex] = useState(0)
  const canAnimate = useVisibleMediaMotion(ref)
  const reduced = useReducedMotion()
  const playing = interacting && canAnimate

  useEffect(() => {
    const card = ref.current?.closest("[data-featured-preview-trigger]")
    if (!card) return
    let hovered = false
    let focused = false
    const update = () => {
      const active = hovered || focused
      setInteracting(active)
      if (!active) setOrbIndex(0)
    }
    const enter = () => {
      hovered = true
      update()
    }
    const leave = () => {
      hovered = false
      update()
    }
    const focusIn = () => {
      focused = true
      update()
    }
    const focusOut = (event: Event) => {
      const next = (event as FocusEvent).relatedTarget
      if (next instanceof Node && card.contains(next)) return
      focused = false
      update()
    }
    card.addEventListener("pointerenter", enter)
    card.addEventListener("pointerleave", leave)
    card.addEventListener("focusin", focusIn)
    card.addEventListener("focusout", focusOut)
    return () => {
      card.removeEventListener("pointerenter", enter)
      card.removeEventListener("pointerleave", leave)
      card.removeEventListener("focusin", focusIn)
      card.removeEventListener("focusout", focusOut)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    if (id === "thinking-orbs") {
      const timer = window.setInterval(() => {
        setOrbIndex((index) => (index + 1) % orbLooks.length)
      }, 3000)
      return () => window.clearInterval(timer)
    }
    if (id === "agent-companions") return
    const controls = animate(0, 1, {
      duration: 2.8,
      ease: "linear",
      onUpdate: setProgress,
    })
    return () => controls.stop()
  }, [playing, id])

  const position = playing ? progress : 0
  const segment = Math.min(3, Math.floor(position * 4))
  const fraction = position * 4 - segment
  const eased = fraction * fraction * (3 - 2 * fraction)
  const value = Math.round(
    dialStops[segment] + (dialStops[segment + 1] - dialStops[segment]) * eased
  )
  const query = "design".slice(
    0,
    Math.max(0, Math.min(6, Math.floor((position - 0.18) * 22)))
  )
  const results = commands.filter((command) =>
    command.toLowerCase().includes(query)
  )
  const selected = position > 0.74 ? 1 : position > 0.08 && !query ? 1 : 0

  return (
    <div
      ref={ref}
      inert
      className="pointer-events-none flex w-full items-center justify-center"
      data-featured-preview={id}
    >
      {id === "thinking-orbs" ? (
        <AiOrb {...orbLooks[playing ? orbIndex : 0]} decorative />
      ) : id === "agent-companions" ? (
        <div className="grid grid-cols-2 gap-3">
          {agentShapes.map((shape) => (
            <AgentCompanion
              key={shape}
              shape={shape}
              size={80}
              state={playing ? "working" : "idle"}
              animated={playing}
              decorative
            />
          ))}
        </div>
      ) : id === "precision-dial" ? (
        <PrecisionDial
          value={value}
          onValueChange={() => undefined}
          label="Exposure"
          className="gap-0 [&_[role=slider]]:size-44 [&>div:last-child]:hidden"
        />
      ) : (
        <div className="w-[80%] max-w-72 overflow-hidden rounded-xl border border-white/10 bg-[#202020] text-xs shadow-[0_16px_36px_-20px_#000]">
          <div className="flex h-11 items-center gap-2 border-b border-white/8 px-3 text-muted-foreground">
            <Search className="size-3.5" />
            <span className={query ? "text-foreground" : ""}>
              {query || "Find anything"}
            </span>
            {playing && <span className="h-3.5 w-px bg-white/70" />}
            <Command className="ml-auto size-3" />
          </div>
          <motion.div
            initial={false}
            animate={{ height: results.length * 36 + 16 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="overflow-hidden p-2"
          >
            {results.map((command, index) => (
              <motion.div
                key={command}
                layout={reduced ? false : "position"}
                transition={{ duration: 0.2 }}
                className="relative flex h-9 items-center gap-2 rounded-lg px-2"
              >
                {index === selected && (
                  <motion.span
                    layoutId={id + "-selection"}
                    className="absolute inset-0 rounded-lg bg-white/8"
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  />
                )}
                <Layers className="relative size-3.5 shrink-0 text-muted-foreground" />
                <span className="relative truncate">{command}</span>
                {index === selected &&
                  (position > 0.92 ? (
                    <Check className="relative ml-auto size-3.5" />
                  ) : (
                    <ArrowUpRight className="relative ml-auto size-3.5 text-muted-foreground" />
                  ))}
              </motion.div>
            ))}
          </motion.div>
          <div className="flex items-center justify-between border-t border-white/7 px-3 py-2 text-[9px] text-muted-foreground">
            <span>↑ ↓ Navigate</span>
            <span>↵ Select</span>
          </div>
        </div>
      )}
    </div>
  )
}
