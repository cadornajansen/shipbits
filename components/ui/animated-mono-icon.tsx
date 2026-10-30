"use client"

import { useEffect, useRef, type ReactElement } from "react"
import { animate, hover } from "motion"
import { MonoIcon, type MonoIconProps } from "@/components/ui/mono-icon"
import type { AnimatedMonoIconName } from "@/lib/mono-icons"
import { createIconPlayer } from "@/lib/mono-icon-playback"
import { createIconPainter } from "@/lib/mono-icon-motion"

// Client effects are the only writers. A real reload creates a fresh set.
const viewedIcons = new Set<AnimatedMonoIconName>()

export type AnimatedMonoIconProps = Omit<MonoIconProps, "name" | "ref"> & {
  name: AnimatedMonoIconName
  stagger?: number
}

export function AnimatedMonoIcon({
  name,
  stagger = 0,
  ...props
}: AnimatedMonoIconProps): ReactElement {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const trigger = svg.closest<HTMLElement>("[data-mono-icon-trigger]") ?? svg
    const preview = svg.closest("[data-mono-icon-preview]") ?? svg
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const paint = createIconPainter(svg, name)
    let inView = false
    let pointerInside = false
    let keyboardInside = false
    const player = createIconPlayer(
      name,
      viewedIcons,
      {
        paint,
        state: (state) => svg.setAttribute("data-motion-state", state),
        delay: (milliseconds, complete) => {
          const timer = window.setTimeout(complete, milliseconds)
          return () => window.clearTimeout(timer)
        },
        tween: (from, to, seconds, linear, onUpdate, onComplete) => {
          const controls = animate(from, to, {
            duration: seconds,
            ease: linear ? "linear" : [0.22, 1, 0.36, 1],
            onUpdate,
            onComplete,
          })
          return () => controls.stop()
        },
      },
      stagger
    )

    function updateVisibility(): void {
      player.setVisible(inView && !document.hidden && !media.matches)
    }
    function updateInteraction(): void {
      player.setActive(!media.matches && (pointerInside || keyboardInside))
    }
    function focusIn(event: FocusEvent): void {
      keyboardInside =
        event.target instanceof Element &&
        event.target.matches(":focus-visible")
      updateInteraction()
    }
    function focusOut(event: FocusEvent): void {
      if (
        event.relatedTarget instanceof Node &&
        trigger.contains(event.relatedTarget)
      )
        return
      keyboardInside = false
      updateInteraction()
    }
    function motionPreferenceChanged(): void {
      updateVisibility()
      updateInteraction()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5
        updateVisibility()
      },
      { threshold: [0, 0.5] }
    )
    const stopHover = hover(trigger, () => {
      pointerInside = true
      updateInteraction()
      return () => {
        pointerInside = false
        updateInteraction()
      }
    })
    trigger.addEventListener("focusin", focusIn as EventListener)
    trigger.addEventListener("focusout", focusOut as EventListener)
    document.addEventListener("visibilitychange", updateVisibility)
    media.addEventListener("change", motionPreferenceChanged)
    observer.observe(preview)
    paint(0)

    return () => {
      observer.disconnect()
      stopHover()
      trigger.removeEventListener("focusin", focusIn as EventListener)
      trigger.removeEventListener("focusout", focusOut as EventListener)
      document.removeEventListener("visibilitychange", updateVisibility)
      media.removeEventListener("change", motionPreferenceChanged)
      player.destroy()
    }
  }, [name, stagger])

  return (
    <MonoIcon ref={svgRef} name={name} data-motion-state="idle" {...props} />
  )
}
