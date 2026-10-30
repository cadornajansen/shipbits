"use client"

import type { ReactElement } from "react"
import { MaterialSurface, type MaterialSurfaceProps } from "./material-surface"
import type { TitaniumSettings } from "@/lib/materials/titanium"

export type TitaniumProps = Omit<
  MaterialSurfaceProps,
  "material" | "settings"
> & { settings?: Partial<TitaniumSettings> }
export function Titanium(props: TitaniumProps): ReactElement {
  return <MaterialSurface material="titanium" {...props} />
}
