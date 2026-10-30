export type DistressedSettings = {
  sizeX: number
  sizeY: number
  radius: number
  grain: number
  contrast: number
  angle: number
  seed: number
  clipToShape: boolean
  color: string
}

export type DistressedShape = "motion" | "text" | "badge" | "square"

export const defaultDistressedSettings: DistressedSettings = {
  sizeX: 0.6,
  sizeY: 1,
  radius: 2,
  grain: 10,
  contrast: 30,
  angle: 90,
  seed: 9521,
  clipToShape: false,
  color: "#ffffff",
}

export const distressedPresets: {
  name: string
  settings: DistressedSettings
}[] = [
  { name: "Original", settings: { ...defaultDistressedSettings } },
  {
    name: "Soft",
    settings: {
      ...defaultDistressedSettings,
      radius: 0.8,
      grain: 6,
      contrast: 12,
    },
  },
  {
    name: "Worn",
    settings: {
      ...defaultDistressedSettings,
      sizeX: 1.2,
      sizeY: 1.6,
      radius: 4,
      grain: 45,
      contrast: 65,
    },
  },
]

function clamp(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
}

export function normalizeDistressedSettings(
  settings: Partial<DistressedSettings> = {}
): DistressedSettings {
  const defaults = defaultDistressedSettings
  return {
    sizeX: clamp(settings.sizeX, 0.2, 4, defaults.sizeX),
    sizeY: clamp(settings.sizeY, 0.2, 4, defaults.sizeY),
    radius: clamp(settings.radius, 0, 8, defaults.radius),
    grain: clamp(settings.grain, 0, 100, defaults.grain),
    contrast: clamp(settings.contrast, 0, 100, defaults.contrast),
    angle: clamp(settings.angle, 0, 360, defaults.angle),
    seed: Math.round(clamp(settings.seed, 1, 9999, defaults.seed)),
    clipToShape: settings.clipToShape ?? defaults.clipToShape,
    color:
      typeof settings.color === "string" &&
      /^#[0-9a-f]{6}$/i.test(settings.color)
        ? settings.color
        : defaults.color,
  }
}
