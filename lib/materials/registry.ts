import {
  defaultFoilSettings,
  foilControlGroups,
  foilPresets,
  normalizeFoilSettings,
} from "./foil"
import {
  defaultTitaniumSettings,
  titaniumControlGroups,
  titaniumPresets,
  normalizeTitaniumSettings,
} from "./titanium"
import type {
  ControlGroup,
  MaterialKind,
  MaterialPreset,
  MaterialSettings,
  SurfaceShape,
} from "./types"

export type MaterialDefinition = {
  title: string
  description: string
  component: string
  componentFile: string
  settingsType: string
  defaults: MaterialSettings
  normalize: (settings: Partial<MaterialSettings>) => MaterialSettings
  groups: ControlGroup[]
  presets: MaterialPreset[]
  shapes: { value: SurfaceShape; label: string }[]
}
const surfaceShapes: MaterialDefinition["shapes"] = [
  { value: "rectangle", label: "Tile" },
  { value: "circle", label: "Disc" },
  { value: "pill", label: "Pill" },
]

export const materialDefinitions: Record<MaterialKind, MaterialDefinition> = {
  foil: {
    title: "Holographic foil",
    description:
      "Fine grooves, embossed details, and light that reveals color.",
    component: "HolographicFoil",
    componentFile: "holographic-foil",
    settingsType: "FoilSettings",
    defaults: defaultFoilSettings,
    normalize: normalizeFoilSettings,
    groups: foilControlGroups,
    presets: foilPresets,
    shapes: surfaceShapes,
  },
  titanium: {
    title: "Titanium",
    description:
      "Directional brushing, polished edges, and precise reflections.",
    component: "Titanium",
    componentFile: "titanium",
    settingsType: "TitaniumSettings",
    defaults: defaultTitaniumSettings,
    normalize: normalizeTitaniumSettings,
    groups: titaniumControlGroups,
    presets: titaniumPresets,
    shapes: surfaceShapes,
  },
}
