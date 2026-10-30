"use client"

import { useSyncExternalStore, type RefObject } from "react"
import { useInView, useReducedMotion } from "motion/react"

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

export function useVisibleMediaMotion(ref: RefObject<Element | null>): boolean {
  const visible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => false
  )
  const inView = useInView(ref, { amount: 0.2 })
  const reduced = useReducedMotion()
  return visible && inView && reduced === false
}

export function clampMediaValue(value: number, min = 0, max = 1): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
}

export function comparisonPosition(
  clientX: number,
  left: number,
  width: number
): number {
  return width > 0
    ? clampMediaValue(((clientX - left) / width) * 100, 0, 100)
    : 50
}
