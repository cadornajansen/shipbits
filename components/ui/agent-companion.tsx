"use client"

import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactElement,
} from "react"
import { animate, hover } from "motion"
import { cn } from "@/lib/utils"
import { useVisibleMediaMotion } from "@/lib/collection-media"
import {
  agentCycleDurations,
  agentIdleDurations,
  agentGestureDurations,
  agentPose,
  resolveAgentShape,
  type AgentCompanionState,
  type AgentCompanionShape,
} from "@/lib/agent-companion-motion"
import { AgentCharacterArt } from "@/components/ui/agent-character-art"

export type {
  AgentCompanionState,
  AgentCompanionShape,
} from "@/lib/agent-companion-motion"
export type AgentCompanionProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  shape?: AgentCompanionShape
  state?: AgentCompanionState
  size?: number
  label?: string
  decorative?: boolean
  animated?: boolean
}

export function AgentCompanion({
  shape = "lavender-bot",
  state = "idle",
  size = 80,
  label,
  decorative = false,
  animated = true,
  className,
  ...props
}: AgentCompanionProps): ReactElement {
  const character = resolveAgentShape(shape)
  const id = useId().replace(/:/g, "")
  const host = useRef<HTMLSpanElement>(null)
  const visible = useVisibleMediaMotion(host)
  const active = animated && visible

  useEffect(() => {
    const element = host.current
    if (!element) return
    const layers = new Map(
      Array.from(
        element.querySelectorAll<SVGGElement>("[data-agent-part]"),
        (layer) => [layer.dataset.agentPart!, layer]
      )
    )
    let time = 0
    let gesture = 0
    let running = false
    let disposed = false
    let stopGesture: (() => void) | undefined
    const gaze = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    function paint(): void {
      if (disposed) return
      gaze.x += (target.x - gaze.x) * 0.16
      gaze.y += (target.y - gaze.y) * 0.16
      const pose = agentPose(character, state, time, gesture, gaze)
      for (const [part, attributes] of Object.entries(pose)) {
        const layer = layers.get(part)
        if (!layer) continue
        for (const [attribute, value] of Object.entries(attributes)) {
          layer.setAttribute(attribute, String(value))
        }
      }
    }

    paint()
    element.dataset.agentMotion = active ? "state" : "static"
    if (!active) return

    const period =
      state === "idle"
        ? agentIdleDurations[character]
        : state === "sleeping"
          ? 4
          : agentCycleDurations[character]
    const clock = animate(0, period, {
      duration: period,
      repeat: Infinity,
      ease: "linear",
      onUpdate: (next) => {
        time = next
        paint()
      },
    })
    const trigger =
      element.closest<HTMLElement>("[data-agent-trigger]") ?? element

    function greet(): void {
      if (running || disposed) return
      running = true
      element!.dataset.agentMotion = "gesture"
      const control = animate(0, 1, {
        duration: agentGestureDurations[character],
        ease: "linear",
        onUpdate: (next) => {
          gesture = next
          paint()
        },
        onComplete: () => {
          gesture = 0
          running = false
          if (!disposed) element!.dataset.agentMotion = "state"
          paint()
        },
      })
      stopGesture = () => control.stop()
    }
    function trackPointer(event: PointerEvent): void {
      if (event.pointerType === "touch" || state !== "idle") return
      const rect = trigger.getBoundingClientRect()
      target.x = Math.max(
        -2,
        Math.min(2, ((event.clientX - rect.left) / rect.width - 0.5) * 4)
      )
      target.y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)
      )
    }
    function focusIn(event: FocusEvent): void {
      if (
        event.relatedTarget instanceof Node &&
        trigger.contains(event.relatedTarget)
      )
        return
      if (
        event.target instanceof Element &&
        event.target.matches(":focus-visible")
      )
        greet()
    }
    const stopHover = hover(trigger, () => {
      greet()
      return () => {
        target.x = 0
        target.y = 0
      }
    })
    trigger.addEventListener("pointermove", trackPointer)
    trigger.addEventListener("focusin", focusIn)

    return () => {
      clock.stop()
      stopGesture?.()
      stopHover()
      trigger.removeEventListener("pointermove", trackPointer)
      trigger.removeEventListener("focusin", focusIn)
      // Restore before a new state, an offscreen suspension, or an unmount.
      time = 0
      gesture = 0
      gaze.x = gaze.y = target.x = target.y = 0
      paint()
      element.dataset.agentMotion = "static"
      disposed = true
    }
  }, [active, character, state])

  return (
    <span
      {...props}
      ref={host}
      className={cn("inline-flex shrink-0", className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : (label ?? `${character.replaceAll("-", " ")} assistant, ${state}`)
      }
      data-agent-companion={character}
      data-agent-state={state}
      data-agent-animated={animated}
      data-agent-motion="static"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 113 113"
        fill="none"
        aria-hidden="true"
      >
        <AgentCharacterArt shape={character} state={state} id={id} />
      </svg>
    </span>
  )
}
