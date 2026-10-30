import {
  normalizeMaterialSettings,
  type ControlGroup,
  type MaterialSettings,
} from "@/lib/materials/types"

export type FoilPattern = "straight" | "radial" | "crosshatch"

export type FoilSettings = MaterialSettings & {
  grooveSpacing: number
  grooveRotation: number
  pattern: FoilPattern
  spectralStrength: number
  embossDepth: number
  roughness: number
  micrograin: number
  bevel: number
  baseTint: string
}

export const defaultFoilSettings: FoilSettings = {
  grooveSpacing: 1.12,
  grooveRotation: -32,
  pattern: "straight",
  spectralStrength: 42,
  embossDepth: 40,
  roughness: 16,
  micrograin: 24,
  bevel: 0.8,
  baseTint: "#d9dce1",
  lightAngle: -45,
  lightElevation: 48,
  lightIntensity: 92,
  speed: 0.18,
  pointerInfluence: 35,
}

export const foilPresets: { name: string; settings: FoilSettings }[] = [
  { name: "Silver", settings: { ...defaultFoilSettings } },
  {
    name: "Security",
    settings: {
      ...defaultFoilSettings,
      pattern: "radial",
      grooveSpacing: 1.65,
      spectralStrength: 58,
      embossDepth: 55,
      roughness: 14,
      micrograin: 30,
    },
  },
  {
    name: "Spectrum",
    settings: {
      ...defaultFoilSettings,
      pattern: "crosshatch",
      grooveSpacing: 1.8,
      spectralStrength: 82,
      embossDepth: 14,
      roughness: 17,
      baseTint: "#c8cbd5",
    },
  },
]

export const foilControlGroups: ControlGroup[] = [
  {
    title: "Grating",
    controls: [
      {
        key: "pattern",
        label: "Pattern",
        kind: "select",
        options: [
          { value: "straight", label: "Straight" },
          { value: "radial", label: "Radial" },
          { value: "crosshatch", label: "Crosshatch" },
        ],
      },
      {
        key: "grooveSpacing",
        label: "Groove spacing",
        min: 0.35,
        max: 3,
        step: 0.01,
        unit: "μm",
      },
      {
        key: "grooveRotation",
        label: "Rotation",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
      },
      {
        key: "spectralStrength",
        label: "Spectrum",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      {
        key: "embossDepth",
        label: "Emboss depth",
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
        key: "micrograin",
        label: "Micrograin",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      { key: "bevel", label: "Bevel", min: 0, max: 12, step: 0.1, unit: "%" },
      { key: "baseTint", label: "Base tint", kind: "color" },
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

export function normalizeFoilSettings(
  input: Partial<FoilSettings>
): FoilSettings {
  return normalizeMaterialSettings(
    input,
    defaultFoilSettings,
    foilControlGroups
  )
}
