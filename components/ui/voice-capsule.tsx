"use client"

import { motion, useReducedMotion } from "motion/react"
import { Mic, Check, AudioLines } from "lucide-react"
import { useId, useRef, type ReactElement } from "react"
import { clampMediaValue, useVisibleMediaMotion } from "@/lib/collection-media"
import { cn } from "@/lib/utils"

export type VoiceCapsuleState =
  "idle" | "listening" | "processing" | "transcript"
export type VoiceCapsuleProps = {
  state: VoiceCapsuleState
  level?: number
  transcript?: string
  label?: string
  tone?: "mono" | "ice"
  className?: string
}

const labels: Record<VoiceCapsuleState, string> = {
  idle: "Ready to listen",
  listening: "Listening…",
  processing: "Processing…",
  transcript: "Transcript ready",
}

export function VoiceCapsule({
  state,
  level = 0,
  transcript,
  label,
  tone = "mono",
  className,
}: VoiceCapsuleProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const active = useVisibleMediaMotion(ref)
  const reduced = useReducedMotion()
  const id = useId().replace(/:/g, "")
  const amplitude = active ? clampMediaValue(level) : 0.15
  const processing = active && state === "processing"
  return (
    <div
      ref={ref}
      data-voice-state={state}
      className={cn(
        "relative flex min-h-16 w-full max-w-sm items-center gap-4 overflow-hidden rounded-[28px] border border-border bg-card px-5 py-4 shadow-lg",
        className
      )}
    >
      <svg
        viewBox="0 0 360 64"
        preserveAspectRatio="none"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 size-full",
          tone === "ice" ? "text-sky-200" : "text-foreground"
        )}
      >
        <defs>
          <linearGradient id={`${id}-voice`}>
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M20 62Q180 65 340 62"
          fill="none"
          stroke={`url(#${id}-voice)`}
          animate={{
            opacity:
              state === "listening"
                ? 0.25 + amplitude * 0.7
                : processing
                  ? [0.15, 0.65, 0.15]
                  : 0,
            strokeWidth: state === "listening" ? 1 + amplitude * 3 : 2,
            x: processing ? [-70, 70, -70] : 0,
          }}
          transition={{
            duration: reduced ? 0 : processing ? 2 : 0.12,
            repeat: processing ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </svg>
      <div
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground"
      >
        {state === "idle" ? (
          <Mic className="size-5" />
        ) : state === "transcript" ? (
          <Check className="size-5" />
        ) : state === "processing" ? (
          <AudioLines className="size-5" />
        ) : (
          <svg viewBox="0 0 32 28" className="size-8">
            {[0.3, 0.65, 1, 0.8, 0.45].map((factor, index) => (
              <motion.rect
                key={index}
                x={index * 6 + 2}
                width="3"
                rx="1.5"
                fill="currentColor"
                animate={{
                  y: 14 - (4 + amplitude * 20 * factor) / 2,
                  height: 4 + amplitude * 20 * factor,
                }}
                transition={{ duration: reduced ? 0 : 0.12 }}
              />
            ))}
          </svg>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="min-w-0 flex-1 text-sm leading-6 text-foreground"
      >
        {state === "transcript"
          ? transcript || labels.transcript
          : label || labels[state]}
      </p>
      {state === "listening" && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-foreground"
        />
      )}
    </div>
  )
}
