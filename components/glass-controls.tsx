"use client"

import { useId, type CSSProperties, type ReactElement } from "react"

import type { GlassSettings } from "@/lib/glass-optics"

type GlassControlsProps = {
  settings: GlassSettings
  onChange: (settings: GlassSettings) => void
}

type NumericSetting = Exclude<keyof GlassSettings, "tint">

type RangeControl = {
  key: NumericSetting
  label: string
  min: number
  max: number
  step?: number
  unit: "°" | "%" | "px"
}

type ControlGroup = {
  title: string
  controls: RangeControl[]
}

const controlGroups: ControlGroup[] = [
  {
    title: "Light",
    controls: [
      { key: "lightAngle", label: "Angle", min: -180, max: 180, unit: "°" },
      {
        key: "lightIntensity",
        label: "Intensity",
        min: 0,
        max: 100,
        unit: "%",
      },
      { key: "splay", label: "Splay", min: 0, max: 100, unit: "%" },
    ],
  },
  {
    title: "Optics",
    controls: [
      { key: "refraction", label: "Refraction", min: 0, max: 100, unit: "%" },
      { key: "depth", label: "Depth", min: 0, max: 30, step: 0.5, unit: "px" },
      { key: "dispersion", label: "Dispersion", min: 0, max: 100, unit: "%" },
      { key: "frost", label: "Frost", min: 0, max: 20, step: 0.5, unit: "px" },
    ],
  },
  {
    title: "Surface",
    controls: [
      { key: "radius", label: "Corner radius", min: 0, max: 30, unit: "px" },
      {
        key: "fillOpacity",
        label: "Tint opacity",
        min: 0,
        max: 100,
        unit: "%",
      },
    ],
  },
]

export function GlassControls({
  settings,
  onChange,
}: GlassControlsProps): ReactElement {
  const id = useId()

  return (
    <div className="space-y-5">
      {controlGroups.map((group) => (
        <fieldset key={group.title} className="min-w-0">
          <legend className="mb-3 text-xs text-muted-foreground">
            {group.title}
          </legend>
          <div className="space-y-1.5">
            {group.controls.map((control) => {
              const value = settings[control.key]
              const inputId = `${id}-${control.key}`
              const progress =
                ((value - control.min) / (control.max - control.min)) * 100
              const style = {
                "--range-progress": `${Math.min(100, Math.max(0, progress))}%`,
              } as CSSProperties

              return (
                <div key={control.key}>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={inputId}
                      className="text-xs text-foreground/85"
                    >
                      {control.label}
                    </label>
                    <output
                      htmlFor={inputId}
                      aria-live="off"
                      className="font-mono text-[11px] text-muted-foreground tabular-nums"
                    >
                      {value}
                      {control.unit}
                    </output>
                  </div>
                  <input
                    id={inputId}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step ?? 1}
                    value={value}
                    aria-valuetext={`${value}${control.unit}`}
                    onChange={(event) =>
                      onChange({
                        ...settings,
                        [control.key]: event.currentTarget.valueAsNumber,
                      })
                    }
                    style={style}
                    className="block h-7 w-full cursor-pointer appearance-none rounded-sm bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-foreground forced-colors:[&::-moz-range-progress]:bg-[Highlight] [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground forced-colors:[&::-moz-range-thumb]:bg-[Highlight] [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border forced-colors:[&::-moz-range-track]:bg-[CanvasText] [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:linear-gradient(to_right,var(--foreground)_var(--range-progress),var(--border)_var(--range-progress))] forced-colors:[&::-webkit-slider-runnable-track]:[background:CanvasText] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground forced-colors:[&::-webkit-slider-thumb]:bg-[Highlight]"
                  />
                </div>
              )
            })}
            {group.title === "Surface" && (
              <div className="flex items-center justify-between gap-3 pt-1.5">
                <label
                  htmlFor={`${id}-tint`}
                  className="text-xs text-foreground/85"
                >
                  Tint color
                </label>
                <div className="flex items-center gap-2.5">
                  <output
                    htmlFor={`${id}-tint`}
                    aria-live="off"
                    className="font-mono text-[11px] text-muted-foreground uppercase"
                  >
                    {settings.tint}
                  </output>
                  <input
                    id={`${id}-tint`}
                    type="color"
                    value={settings.tint}
                    onInput={(event) =>
                      onChange({ ...settings, tint: event.currentTarget.value })
                    }
                    className="size-7 cursor-pointer overflow-hidden rounded-md border border-border bg-transparent p-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&::-moz-color-swatch]:rounded-xs [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-xs [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                  />
                </div>
              </div>
            )}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
