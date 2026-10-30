export type MaterialKind = "foil" | "titanium"
export type MaterialQuality = "auto" | "high"
export type SurfaceShape = "rectangle" | "circle" | "pill" | "text" | "diamond"
export type MaterialSettings = {
  [key: string]: number | string
  lightAngle: number
  lightElevation: number
  lightIntensity: number
  speed: number
  pointerInfluence: number
}

export type Control = {
  key: string
  label: string
  kind?: "range" | "color" | "select"
  min?: number
  max?: number
  step?: number
  unit?: string
  info?: string
  options?: { value: string; label: string }[]
}
export type ControlGroup = { title: string; controls: Control[] }
export type MaterialPreset<T extends MaterialSettings = MaterialSettings> = {
  name: string
  settings: T
}

export function normalizeMaterialSettings<T extends MaterialSettings>(
  input: Partial<T>,
  defaults: T,
  groups: ControlGroup[]
): T {
  const result: MaterialSettings = { ...defaults }
  for (const control of groups.flatMap((group) => group.controls)) {
    const value = input[control.key]
    if (control.kind === "color") {
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
        result[control.key] = value.toLowerCase()
      }
    } else if (control.kind === "select") {
      if (control.options?.some((option) => option.value === value)) {
        result[control.key] = value as string
      }
    } else if (typeof value === "number" && Number.isFinite(value)) {
      result[control.key] = Math.max(
        control.min ?? -Infinity,
        Math.min(control.max ?? Infinity, value)
      )
    }
  }
  return result as T
}

export function materialUniforms(
  settings: MaterialSettings,
  groups: ControlGroup[]
): Record<string, number | number[]> {
  const uniforms: Record<string, number | number[]> = {}
  for (const control of groups.flatMap((group) => group.controls)) {
    const value = settings[control.key]
    if (control.kind === "color" && typeof value === "string") {
      uniforms[`u_${control.key}`] = [1, 3, 5].map(
        (start) => parseInt(value.slice(start, start + 2), 16) / 255
      )
    } else if (control.kind === "select") {
      uniforms[`u_${control.key}`] = Math.max(
        0,
        control.options?.findIndex((option) => option.value === value) ?? 0
      )
    } else if (typeof value === "number") {
      uniforms[`u_${control.key}`] = value
    }
  }
  return uniforms
}
