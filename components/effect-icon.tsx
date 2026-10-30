"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react"

import { Distressed } from "@/components/ui/distressed"
import { GlassSurface } from "@/components/ui/glass-link"
import { LiquidMetal } from "@/components/ui/liquid-metal"
import { MaterialSurface } from "@/components/ui/material-surface"
import type { MaterialKind } from "@/lib/materials/types"
import { defaultMetalSettings } from "@/lib/liquid-metal"
import { cn } from "@/lib/utils"

export type EffectKind = "glass" | "metal" | "distressed" | MaterialKind

const iconMetal = { ...defaultMetalSettings, scale: 1, speed: 0.25 }
const iconGrain = { radius: 1.5, grain: 55, contrast: 45 }

export function EffectIcon({
  effect,
  className,
}: {
  effect: EffectKind
  className?: string
}): ReactElement {
  const elementRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<boolean>(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    function updateMotion(): void {
      setActive(visible && !motion.matches && !document.hidden)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updateMotion()
    })
    observer.observe(element)
    motion.addEventListener("change", updateMotion)
    document.addEventListener("visibilitychange", updateMotion)
    return () => {
      observer.disconnect()
      motion.removeEventListener("change", updateMotion)
      document.removeEventListener("visibilitychange", updateMotion)
    }
  }, [])

  return (
    <div
      ref={elementRef}
      aria-hidden="true"
      data-effect={effect}
      style={
        {
          "--effect-play-state": active ? "running" : "paused",
        } as CSSProperties
      }
      className={cn(
        "relative size-7 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-[#202020]",
        className
      )}
    >
      {effect === "foil" || effect === "titanium" ? (
        <MaterialSurface
          material={effect}
          thumbnail
          paused={!active}
          className="absolute inset-[12%] size-[76%] min-h-0"
        />
      ) : effect === "metal" ? (
        <LiquidMetal
          shape="square"
          settings={iconMetal}
          paused={!active}
          decorative
          className="size-full"
        />
      ) : effect === "glass" ? (
        <GlassSurface
          refractionMode="off"
          settings={{ radius: 4, depth: 8, frost: 1, fillOpacity: 12 }}
          style={
            {
              "--glass-rim":
                "linear-gradient(var(--effect-icon-angle), rgb(255 255 255 / .85), rgb(255 255 255 / .06) 40%, rgb(255 255 255 / .06) 60%, rgb(255 255 255 / .55))",
              "--glass-sheen":
                "linear-gradient(var(--effect-icon-angle), rgb(255 255 255 / .22), transparent 55%, rgb(255 255 255 / .04))",
            } as CSSProperties
          }
          className="absolute inset-[18%] min-h-0 [animation:effect-light-turn_8s_linear_infinite] [animation-play-state:var(--effect-play-state)] motion-reduce:animate-none"
        />
      ) : (
        <>
          <Distressed
            shape="square"
            settings={iconGrain}
            className="absolute inset-0 size-full"
          />
          <Distressed
            shape="square"
            settings={{ ...iconGrain, seed: 724, angle: 110 }}
            className="absolute inset-0 size-full [animation:effect-grain-shift_4s_ease-in-out_infinite] opacity-0 [animation-play-state:var(--effect-play-state)] motion-reduce:animate-none"
          />
        </>
      )}
    </div>
  )
}
