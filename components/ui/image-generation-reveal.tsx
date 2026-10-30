"use client"

/* eslint-disable @next/next/no-img-element -- This source-copy primitive also runs in React projects without Next.js. */
import { useEffect, useRef, useState, type ReactElement } from "react"
import { useReducedMotion } from "motion/react"
import { ImageOff, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVisibleMediaMotion, clampMediaValue } from "@/lib/collection-media"
import { cn } from "@/lib/utils"

export type ImageGenerationRevealProps = {
  src: string
  alt: string
  duration?: number
  className?: string
}

export function ImageGenerationReveal(
  props: ImageGenerationRevealProps
): ReactElement {
  return <ImageRevealSurface key={props.src} {...props} />
}

function ImageRevealSurface({
  src,
  alt,
  duration = 1400,
  className,
}: ImageGenerationRevealProps): ReactElement {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const elapsed = useRef(0)
  const active = useVisibleMediaMotion(host)
  const reduced = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!loaded || revealed || (!active && !reduced)) return
    const surface = canvas.current
    const source = image.current
    if (!surface || !source) return
    const context = surface.getContext("2d")
    const sample = document.createElement("canvas")
    const sampleContext = sample.getContext("2d")
    let frame = 0
    let previous: number | undefined
    const length = clampMediaValue(duration, 200, 4000)
    const paint = (now: number): void => {
      if (previous !== undefined) elapsed.current += now - previous
      previous = now
      const progress =
        reduced || !context || !sampleContext
          ? 1
          : Math.min(1, elapsed.current / length)
      if (context && sampleContext) {
        // Both layers use the same cover crop, so the final reveal cannot jump.
        const ratio = Math.max(
          720 / source.naturalWidth,
          480 / source.naturalHeight
        )
        const sourceWidth = 720 / ratio
        const sourceHeight = 480 / ratio
        sample.width = Math.round(8 + Math.pow(progress, 2.6) * 712)
        sample.height = Math.max(1, Math.round((sample.width * 2) / 3))
        sampleContext.drawImage(
          source,
          (source.naturalWidth - sourceWidth) / 2,
          (source.naturalHeight - sourceHeight) / 2,
          sourceWidth,
          sourceHeight,
          0,
          0,
          sample.width,
          sample.height
        )
        context.imageSmoothingEnabled = false
        context.drawImage(sample, 0, 0, surface.width, surface.height)
      }
      if (progress < 1) frame = requestAnimationFrame(paint)
      else setRevealed(true)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [active, duration, loaded, reduced, revealed])

  return (
    <div
      ref={host}
      className={cn(
        "relative aspect-3/2 w-full overflow-hidden rounded-2xl border border-border bg-muted",
        className
      )}
      data-image-reveal={
        failed
          ? "error"
          : revealed
            ? "complete"
            : loaded
              ? "revealing"
              : "loading"
      }
      aria-busy={!revealed && !failed}
    >
      <img
        key={attempt}
        ref={image}
        src={src}
        alt={alt}
        width={720}
        height={480}
        className={cn(
          "absolute inset-0 size-full object-cover",
          revealed ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          setLoaded(true)
          setFailed(false)
        }}
        onError={() => setFailed(true)}
      />
      <canvas
        ref={canvas}
        width={720}
        height={480}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 size-full",
          revealed || failed ? "hidden" : "block"
        )}
      />
      {!loaded && !failed && (
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-8">
          {Array.from({ length: 48 }, (_, index) => (
            <span
              key={index}
              className={
                index % 3 === 0
                  ? "bg-foreground/5"
                  : index % 5 === 0
                    ? "bg-foreground/10"
                    : "bg-muted"
              }
            />
          ))}
        </div>
      )}
      {failed && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
        >
          <ImageOff className="size-6" />
          <span>Image could not load</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              elapsed.current = 0
              setFailed(false)
              setLoaded(false)
              setRevealed(false)
              setAttempt(attempt + 1)
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
