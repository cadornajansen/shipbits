"use client"

// Drag and magnetic-hover behavior adapted from Libraries.dev (MIT).
import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactElement,
} from "react"
import { ChevronRight } from "lucide-react"
import { ComponentArtwork } from "@/components/component-artwork"
import { catalog, type CatalogEntry } from "@/lib/catalog"
import { generate, type GenerateRun } from "@/lib/vendor/ui-generation"
import { cn } from "@/lib/utils"

type Position = { x: number; y: number }
type Drag = {
  id: number
  startX: number
  startY: number
  origin: Position
  moved: boolean
  limits: { left: number; right: number; top: number; bottom: number }
}
const slots = ["beam", "metal", "orb", "gooey", "image"]
const positions = [
  "min-[761px]:top-[147px] min-[761px]:left-[calc(50%-min(481px,37.6vw))] max-[760px]:top-0 max-[760px]:left-3",
  "min-[761px]:top-[171px] min-[761px]:left-[calc(50%+min(317px,24.8vw))] max-[760px]:top-0 max-[760px]:left-[calc(100%-12px-var(--hero-tile))]",
  "min-[761px]:top-0 min-[761px]:left-[calc(50%-7px)] max-[760px]:top-[calc(var(--hero-tile)+var(--hero-tile-gap))] max-[760px]:left-[calc(50%-var(--hero-tile)/2)]",
  "min-[761px]:top-[432px] min-[761px]:left-[calc(50%-min(351px,27.4vw))] max-[760px]:top-[calc((var(--hero-tile)+var(--hero-tile-gap))*2)] max-[760px]:left-3",
  "min-[761px]:top-[475px] min-[761px]:left-[calc(50%+min(90px,7vw))] max-[760px]:top-[calc((var(--hero-tile)+var(--hero-tile-gap))*2)] max-[760px]:left-[calc(100%-12px-var(--hero-tile))]",
]

function HeroTile({
  entry,
  index,
}: {
  entry: CatalogEntry
  index: number
}): ReactElement {
  const tileRef = useRef<HTMLAnchorElement>(null)
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    function resetPosition(): void {
      setPosition({ x: 0, y: 0 })
    }
    window.addEventListener("resize", resetPosition)
    return () => window.removeEventListener("resize", resetPosition)
  }, [])

  function magnet(x: number, y: number): void {
    tileRef.current?.style.setProperty("--mx", `${x}px`)
    tileRef.current?.style.setProperty("--my", `${y}px`)
  }
  function begin(event: PointerEvent<HTMLAnchorElement>): void {
    if (event.button !== 0) return
    const tile = event.currentTarget.getBoundingClientRect()
    const box = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!box) return
    suppressClick.current = false
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      moved: false,
      limits: {
        left: box.left - tile.left + position.x,
        right: box.right - tile.right + position.x,
        top: box.top - tile.top + position.y,
        bottom: box.bottom - tile.bottom + position.y,
      },
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    magnet(0, 0)
  }
  function move(event: PointerEvent<HTMLAnchorElement>): void {
    const current = drag.current
    if (!current) {
      if (
        !window.matchMedia(
          "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
        ).matches
      )
        return
      const rect = event.currentTarget.getBoundingClientRect()
      const lean = (v: number): number => Math.max(-6, Math.min(6, v * 0.12))
      magnet(
        lean(event.clientX - rect.left - rect.width / 2),
        lean(event.clientY - rect.top - rect.height / 2)
      )
      return
    }
    if (current.id !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (Math.hypot(dx, dy) > 4) current.moved = true
    if (!current.moved) return
    setDragging(true)
    setPosition({
      x: Math.max(
        current.limits.left,
        Math.min(current.limits.right, current.origin.x + dx)
      ),
      y: Math.max(
        current.limits.top,
        Math.min(current.limits.bottom, current.origin.y + dy)
      ),
    })
  }
  function end(event: PointerEvent<HTMLAnchorElement>): void {
    if (drag.current?.id !== event.pointerId) return
    suppressClick.current = drag.current.moved
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return (
    <Link
      ref={tileRef}
      href={entry.href}
      aria-label={entry.title}
      draggable={false}
      className={cn(
        "group/tile pointer-events-auto absolute z-[5] block size-[130px] [translate:var(--mx,0px)_var(--my,0px)] [transform:translate(var(--drag-x,0px),var(--drag-y,0px))] touch-pan-y rounded-3xl bg-[#181818] no-underline shadow-(--site-ring) select-none [transition:background-color_.15s_ease,transform_350ms_cubic-bezier(.34,1.85,.64,1),translate_350ms_cubic-bezier(.2,.8,.2,1)] before:absolute before:inset-[calc(-1*var(--tile-safe,0px))] before:rounded-[calc(24px+var(--tile-safe,0px))] before:content-[''] hover:[transform:translate(var(--drag-x,0px),calc(var(--drag-y,0px)-6px))] hover:bg-[#1c1c1c] focus-visible:[transform:translate(var(--drag-x,0px),calc(var(--drag-y,0px)-6px))] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b5b5b5] data-[dragging=true]:z-[7] data-[dragging=true]:cursor-grabbing data-[dragging=true]:[transition:background-color_.15s_ease,translate_350ms_cubic-bezier(.2,.8,.2,1)] motion-reduce:[translate:none] motion-reduce:transition-none motion-reduce:hover:[transform:translate(var(--drag-x,0px),var(--drag-y,0px))] motion-reduce:focus-visible:[transform:translate(var(--drag-x,0px),var(--drag-y,0px))] max-[760px]:size-[var(--hero-tile)] max-[760px]:rounded-[calc(var(--hero-tile)*24/130)] min-[761px]:[--tile-safe:18px] min-[1161px]:[--tile-safe:30px]",
        positions[index]
      )}
      data-hero-slot={slots[index]}
      style={
        {
          "--drag-x": `${position.x}px`,
          "--drag-y": `${position.y}px`,
        } as CSSProperties
      }
      data-dragging={dragging || undefined}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={() => magnet(0, 0)}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        if (suppressClick.current) {
          event.preventDefault()
          suppressClick.current = false
        }
      }}
    >
      <span className="pointer-events-none absolute inset-[11px] flex items-center justify-center overflow-hidden rounded-[14px] bg-[#101010] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_rgb(255_255_255/.02),inset_0_0_0_1px_rgb(191_192_203/.1)] after:content-[''] max-[760px]:inset-[calc(var(--hero-tile)*11/130)] max-[760px]:rounded-[calc(var(--hero-tile)*14/130)]">
        {/* The build overlay can trace SVG geometry, including canvas-based art. */}
        <svg
          className="pointer-events-none absolute inset-0 size-full fill-none stroke-none"
          viewBox="0 0 108 108"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="108" height="108" rx="14" />
          {entry.id === "metal" ? (
            <circle cx="54" cy="54" r="26" />
          ) : (
            <rect
              x={entry.id === "distressed" ? 25 : 28}
              y={entry.id === "distressed" ? 25 : 28}
              width={entry.id === "distressed" ? 58 : 52}
              height={entry.id === "distressed" ? 58 : 52}
              rx={entry.id === "glass" ? 7 : 2}
            />
          )}
        </svg>
        <ComponentArtwork id={entry.preview} compact />
      </span>
      <span className="pointer-events-none absolute top-[calc(100%+12px)] left-1/2 inline-flex h-7 origin-top [translate:calc(var(--mx,0px)*-.5)_calc(var(--my,0px)*-.5)] [transform:translateX(-50%)_scale(.97)] items-center gap-0.5 rounded-3xl bg-[#2a2a2a] pr-1.5 pl-3 text-xs leading-[13px] font-medium whitespace-nowrap text-[#e8e8e8] opacity-0 shadow-(--site-ring) will-change-[transform,opacity] [transition:transform_150ms_cubic-bezier(.22,1,.36,1),opacity_150ms_cubic-bezier(.22,1,.36,1),translate_550ms_cubic-bezier(.2,.8,.2,1)] group-hover/tile:[transform:translateX(-50%)_scale(1)] group-hover/tile:opacity-100 group-hover/tile:duration-250 group-focus-visible/tile:[transform:translateX(-50%)_scale(1)] group-focus-visible/tile:opacity-100 group-focus-visible/tile:duration-250 motion-reduce:[translate:none] motion-reduce:transition-none max-[760px]:hidden">
        {entry.title}
        <ChevronRight size={16} className="text-[#9a9a9a]" />
      </span>
    </Link>
  )
}

export function HeroTiles(): ReactElement {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches) return
    const runs: GenerateRun[] = []
    const events = ["pointerdown", "keydown", "focusin"] as const
    function stop(): void {
      runs.forEach((run) => run.cancel())
      events.forEach((event) => document.removeEventListener(event, stop, true))
    }
    const frame = requestAnimationFrame(() => {
      const order = ["orb", "beam", "metal", "gooey", "image"]
      order.forEach((slot, index) => {
        const tile = root.current?.querySelector<HTMLElement>(
          `[data-hero-slot="${slot}"]`
        )
        if (tile)
          runs.push(
            generate(tile, {
              mode: "skeleton",
              duration: 1600,
              reveal: "fade",
              fadeDuration: 475,
              revealAt: 930,
              delay: index * 100,
            })
          )
      })
      events.forEach((event) => document.addEventListener(event, stop, true))
      void Promise.all(runs.map((run) => run.finished)).then(stop)
    })
    motion.addEventListener("change", stop)
    return () => {
      cancelAnimationFrame(frame)
      motion.removeEventListener("change", stop)
      stop()
    }
  }, [])
  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 max-[760px]:relative max-[760px]:inset-auto max-[760px]:order-first max-[760px]:h-[calc(var(--hero-tile)*3+var(--hero-tile-gap)*2)] max-[760px]:w-full max-[760px]:flex-none"
    >
      {catalog
        .filter((entry) => entry.studio)
        .slice(0, slots.length)
        .map((entry, index) => (
          <HeroTile key={entry.id} entry={entry} index={index} />
        ))}
    </div>
  )
}
