import type { MetalIconShape } from "@/lib/metal-shapes"

export type MetalShape =
  "triangle" | "circle" | "diamond" | "square" | MetalIconShape

export type MetalSettings = {
  contour: number
  softness: number
  liquid: number
  patternDensity: number
  angle: number
  aberration: number
  speed: number
  scale: number
  tint: string
}

export const defaultMetalSettings: MetalSettings = {
  contour: 0.55,
  softness: 0.12,
  liquid: 0.08,
  patternDensity: 2,
  angle: 70,
  aberration: 0.22,
  speed: 0.35,
  scale: 0.85,
  tint: "#ffffff",
}

export const metalPresets: { name: string; settings: MetalSettings }[] = [
  { name: "Chrome", settings: { ...defaultMetalSettings } },
  {
    name: "Pearl",
    settings: {
      ...defaultMetalSettings,
      softness: 0.35,
      contour: 0.75,
      liquid: 0.2,
      aberration: 0.06,
      patternDensity: 3,
    },
  },
  {
    name: "Gold",
    settings: {
      ...defaultMetalSettings,
      tint: "#f4ce8a",
      aberration: 0.08,
      softness: 0.16,
      angle: 120,
    },
  },
]

function clamp(
  value: number,
  min: number,
  max: number,
  fallback: number
): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
}

export function normalizeMetalSettings(settings: MetalSettings): MetalSettings {
  return {
    contour: clamp(settings.contour, 0, 1, defaultMetalSettings.contour),
    softness: clamp(settings.softness, 0, 1, defaultMetalSettings.softness),
    liquid: clamp(settings.liquid, 0, 1, defaultMetalSettings.liquid),
    patternDensity: clamp(
      settings.patternDensity,
      1,
      10,
      defaultMetalSettings.patternDensity
    ),
    angle: clamp(settings.angle, 0, 360, defaultMetalSettings.angle),
    aberration: clamp(
      settings.aberration,
      0,
      1,
      defaultMetalSettings.aberration
    ),
    speed: clamp(settings.speed, 0, 2, defaultMetalSettings.speed),
    scale: clamp(settings.scale, 0.3, 1.2, defaultMetalSettings.scale),
    tint: /^#[0-9a-f]{6}$/i.test(settings.tint)
      ? settings.tint
      : defaultMetalSettings.tint,
  }
}
