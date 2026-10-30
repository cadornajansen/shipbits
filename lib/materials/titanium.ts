import {
  normalizeMaterialSettings,
  type ControlGroup,
  type MaterialSettings,
} from "@/lib/materials/types"

export type TitaniumFinish = "linear" | "radial"

export type TitaniumSettings = MaterialSettings & {
  brushDirection: number
  brushDensity: number
  finish: TitaniumFinish
  anisotropy: number
  roughness: number
  scratchStrength: number
  bevelWidth: number
  bevelPolish: number
  tint: string
}

export const defaultTitaniumSettings: TitaniumSettings = {
  brushDirection: -16,
  brushDensity: 520,
  finish: "linear",
  anisotropy: 82,
  roughness: 26,
  scratchStrength: 34,
  bevelWidth: 1.2,
  bevelPolish: 82,
  tint: "#d0cfc9",
  lightAngle: -38,
  lightElevation: 54,
  lightIntensity: 100,
  speed: 0.16,
  pointerInfluence: 32,
}

export const titaniumPresets: { name: string; settings: TitaniumSettings }[] = [
  { name: "Natural", settings: { ...defaultTitaniumSettings } },
  {
    name: "Graphite",
    settings: {
      ...defaultTitaniumSettings,
      tint: "#777b84",
      roughness: 43,
      brushDensity: 880,
      scratchStrength: 26,
      bevelWidth: 1.2,
    },
  },
  {
    name: "Polished",
    settings: {
      ...defaultTitaniumSettings,
      tint: "#e1e2e5",
      finish: "radial",
      roughness: 16,
      anisotropy: 89,
      scratchStrength: 22,
      bevelPolish: 96,
      bevelWidth: 1.8,
    },
  },
]

export const titaniumControlGroups: ControlGroup[] = [
  {
    title: "Machining",
    controls: [
      {
        key: "finish",
        label: "Finish",
        kind: "select",
        options: [
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ],
      },
      {
        key: "brushDirection",
        label: "Brush direction",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
      },
      {
        key: "brushDensity",
        label: "Brush density",
        min: 80,
        max: 1600,
        step: 10,
        unit: "lines",
      },
      {
        key: "anisotropy",
        label: "Anisotropy",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      {
        key: "scratchStrength",
        label: "Scratches",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
    ],
  },
  {
    title: "Surface",
    controls: [
      {
        key: "roughness",
        label: "Roughness",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      {
        key: "bevelWidth",
        label: "Bevel width",
        min: 0,
        max: 12,
        step: 0.1,
        unit: "%",
      },
      {
        key: "bevelPolish",
        label: "Edge polish",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      { key: "tint", label: "Tint", kind: "color" },
    ],
  },
  {
    title: "Light & motion",
    controls: [
      {
        key: "lightAngle",
        label: "Direction",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
      },
      {
        key: "lightElevation",
        label: "Elevation",
        min: 5,
        max: 85,
        step: 1,
        unit: "°",
      },
      {
        key: "lightIntensity",
        label: "Intensity",
        min: 0,
        max: 200,
        step: 1,
        unit: "%",
      },
      {
        key: "speed",
        label: "Sweep speed",
        min: 0,
        max: 2,
        step: 0.01,
        unit: "×",
      },
      {
        key: "pointerInfluence",
        label: "Pointer influence",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
    ],
  },
]

export function normalizeTitaniumSettings(
  input: Partial<TitaniumSettings>
): TitaniumSettings {
  return normalizeMaterialSettings(
    input,
    defaultTitaniumSettings,
    titaniumControlGroups
  )
}
