"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
} from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ThinkingOrb,
  resolvePreset,
  type ModeFrame,
  type OrbFrame,
} from "thinking-orbs"
import {
  orbFrameFor,
  orbLookId,
  AI_ORB_LABELS,
  type AiOrbState,
  type AiOrbVariant,
  type AiOrbLook,
  type AiOrbAppearance,
} from "@/lib/ai-orb-frames"
import { cn } from "@/lib/utils"

export {
  AI_ORB_STATES,
  AI_ORB_LABELS,
  AI_ORB_VARIANTS,
  AI_ORB_LOOKS,
  AI_ORB_NAMES,
  type AiOrbState,
  type AiOrbVariant,
  type AiOrbLook,
} from "@/lib/ai-orb-frames"

const SIZES = {
  sm: { className: "size-5", px: 20 },
  md: { className: "size-8", px: 32 },
  lg: { className: "size-16", px: 64 },
} as const
const subscribeMounted = (): (() => void) => () => {}
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const readReducedMotion = (): boolean =>
  window.matchMedia(REDUCED_MOTION).matches

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

export type AiOrbProps = Omit<
  ComponentProps<"span">,
  "aria-hidden" | "aria-label" | "children" | "role"
> &
  AiOrbLook &
  AiOrbAppearance & {
    size?: keyof typeof SIZES
    speed?: number
    paused?: boolean
    settleMs?: number
    label?: string
    decorative?: boolean
  }

function OrbCanvas({
  state,
  variant,
  size = "lg",
  speed = 1,
  paused = false,
  settleMs = 5000,
  density = 1,
  dotSize = 1,
  tilt = 12,
  reduced,
}: Omit<AiOrbProps, "state" | "variant"> & {
  state: AiOrbState
  variant: AiOrbVariant
  reduced: boolean
}): ReactElement {
  const [settled, setSettled] = useState(false)
  const last = useRef<{
    size: number
    frame: OrbFrame
    source: ModeFrame
  } | null>(null)
  const frozen = paused || reduced || settled || state === "error"
  const pixels = SIZES[size].px
  const draw = useMemo(
    () => orbFrameFor(state, variant, { density, dotSize, tilt }),
    [state, variant, density, dotSize, tilt]
  )

  useEffect(() => {
    if (state !== "idle" || paused || reduced) return
    const timer = window.setTimeout(
      () => setSettled(true),
      Math.max(0, settleMs)
    )
    return () => window.clearTimeout(timer)
  }, [state, paused, reduced, settleMs])

  const frame = useCallback<ModeFrame>(
    (px, time, options) => {
      // The engine repaints once when paused changes. Retain the actual last pose.
      if (frozen && last.current?.size === px && last.current.source === draw)
        return last.current.frame
      const next = draw(px, frozen ? 0.6 : time, options)
      last.current = { size: px, frame: next, source: draw }
      return next
    },
    [draw, frozen]
  )

  // Custom sequences use seconds, independent of the engine's built-in preset pace.
  const pace =
    (Number.isFinite(speed) ? Math.max(0, speed) : 1) /
    resolvePreset("working", pixels).speed

  return (
    <ThinkingOrb
      aria-hidden="true"
      role="presentation"
      state="working"
      theme="dark"
      size={pixels}
      frame={frame}
      speed={pace}
      paused={frozen}
      data-orb-canvas={state}
      data-orb-variant={variant}
      data-paused={frozen}
    />
  )
}

export function AiOrb({
  state,
  variant = "default",
  size = "lg",
  speed = 1,
  paused = false,
  settleMs = 5000,
  density = 1,
  dotSize = 1,
  tilt = 12,
  label,
  decorative = false,
  className,
  ...rest
}: AiOrbProps): ReactElement {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false
  )
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false
  )
  return (
    <span
      {...rest}
      className={cn(
        "relative inline-block shrink-0 align-middle",
        SIZES[size].className,
        className
      )}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : (label ??
            AI_ORB_LABELS[state] +
              (variant === "default" ? "" : " · " + variant))
      }
      aria-hidden={decorative ? true : undefined}
      data-slot="ai-orb"
      data-state={state}
      data-orb-look={orbLookId(state, variant)}
    >
      {mounted ? (
        <AnimatePresence initial={false}>
          <motion.span
            key={`${state}:${variant}:${settleMs}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <OrbCanvas
              state={state}
              variant={variant}
              size={size}
              speed={speed}
              paused={paused}
              settleMs={settleMs}
              density={density}
              dotSize={dotSize}
              tilt={tilt}
              reduced={reduced}
            />
          </motion.span>
        </AnimatePresence>
      ) : null}
    </span>
  )
}

export default AiOrb
