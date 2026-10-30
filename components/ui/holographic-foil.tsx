"use client"

import type { ReactElement } from "react"
import { MaterialSurface, type MaterialSurfaceProps } from "./material-surface"
import type { FoilSettings } from "@/lib/materials/foil"

export type HolographicFoilProps = Omit<
  MaterialSurfaceProps,
  "material" | "settings"
> & { settings?: Partial<FoilSettings> }
export function HolographicFoil(props: HolographicFoilProps): ReactElement {
  return <MaterialSurface material="foil" {...props} />
}
