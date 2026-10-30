"use client"

/* eslint-disable @next/next/no-img-element -- Keep this exported React primitive independent of Next.js image configuration. */
import { motion } from "motion/react"
import { GripVertical, ImageOff, RotateCcw } from "lucide-react"
import { useRef, useState, type ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { clampMediaValue, comparisonPosition } from "@/lib/collection-media"
import { cn } from "@/lib/utils"

export type ImageComparisonProps = {
  beforeSrc: string
  afterSrc: string
  alt: string
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export function ImageComparison(props: ImageComparisonProps): ReactElement {
  return (
    <ImageComparisonSurface
      key={`${props.beforeSrc}\u0000${props.afterSrc}`}
      {...props}
    />
  )
}

function ImageComparisonSurface({
  beforeSrc,
  afterSrc,
  alt,
  value,
  defaultValue = 50,
  onValueChange,
  beforeLabel = "Original",
  afterLabel = "Refined",
  className,
}: ImageComparisonProps): ReactElement {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const dragging = useRef(false)
  const handle = useRef<HTMLButtonElement>(null)
  const position = clampMediaValue(value ?? internalValue, 0, 100)
  function update(next: number): void {
    const bounded = clampMediaValue(next, 0, 100)
    setInternalValue(bounded)
    onValueChange?.(bounded)
  }
  return (
    <div
      className={cn(
        "relative aspect-3/2 w-full touch-pan-y overflow-hidden rounded-2xl border border-border bg-muted select-none",
        className
      )}
      data-image-comparison
      onPointerDown={(event) => {
        if (event.button !== 0 || failed) return
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        handle.current?.focus({ preventScroll: true })
        const rect = event.currentTarget.getBoundingClientRect()
        update(comparisonPosition(event.clientX, rect.left, rect.width))
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const rect = event.currentTarget.getBoundingClientRect()
        update(comparisonPosition(event.clientX, rect.left, rect.width))
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onLostPointerCapture={() => {
        dragging.current = false
      }}
    >
      <img
        key={`before-${attempt}`}
        src={beforeSrc}
        alt={alt}
        width={720}
        height={480}
        draggable={false}
        onError={() => setFailed(true)}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        transition={{ duration: 0 }}
      >
        <img
          key={`after-${attempt}`}
          src={afterSrc}
          alt=""
          width={720}
          height={480}
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </motion.div>
      <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
        {afterLabel}
      </span>
      <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      {!failed && (
        <motion.div
          className="absolute inset-y-0 w-px bg-white/75"
          animate={{ left: `${position}%` }}
          transition={{ duration: 0 }}
        >
          <button
            ref={handle}
            type="button"
            role="slider"
            aria-label="Image comparison position"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% ${afterLabel}`}
            aria-orientation="horizontal"
            className="absolute top-1/2 -left-4 flex h-11 w-8 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-white/40 bg-black/40 text-white shadow-lg backdrop-blur-md focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
            onKeyDown={(event) => {
              const step = event.shiftKey ? 10 : 1
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 100
                    : ["ArrowLeft", "ArrowDown"].includes(event.key)
                      ? position - step
                      : ["ArrowRight", "ArrowUp"].includes(event.key)
                        ? position + step
                        : undefined
              if (next !== undefined) {
                event.preventDefault()
                update(next)
              }
            }}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
      {failed && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted text-sm text-muted-foreground"
        >
          <ImageOff className="size-5" />
          Image could not load
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFailed(false)
              setAttempt((current) => current + 1)
            }}
          >
            <RotateCcw data-icon="inline-start" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
