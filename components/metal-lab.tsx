"use client"

import { Check, Copy, RotateCcw } from "lucide-react"
import {
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from "react"

import { Button } from "@/components/ui/button"
import { MetalExamples } from "@/components/metal-examples"
import { LiquidMetal } from "@/components/ui/liquid-metal"
import {
  defaultMetalSettings,
  metalPresets,
  type MetalSettings,
  type MetalShape,
} from "@/lib/liquid-metal"
import { cn } from "@/lib/utils"

type CopyState = "idle" | "copied" | "failed"
type Background = "dark" | "light" | "transparent"
type NumericSetting = Exclude<keyof MetalSettings, "tint">
type RangeControl = {
  key: NumericSetting
  label: string
  min: number
  max: number
  step: number
  unit: "%" | "°" | "×"
}

const controlGroups: { title: string; controls: RangeControl[] }[] = [
  {
    title: "Surface",
    controls: [
      {
        key: "contour",
        label: "Contour",
        min: 0,
        max: 1,
        step: 0.01,
        unit: "%",
      },
      {
        key: "softness",
        label: "Softness",
        min: 0,
        max: 1,
        step: 0.01,
        unit: "%",
      },
      {
        key: "scale",
        label: "Scale",
        min: 0.3,
        max: 1.2,
        step: 0.05,
        unit: "×",
      },
    ],
  },
  {
    title: "Reflections",
    controls: [
      { key: "liquid", label: "Liquid", min: 0, max: 1, step: 0.01, unit: "%" },
      {
        key: "patternDensity",
        label: "Pattern density",
        min: 1,
        max: 10,
        step: 0.1,
        unit: "×",
      },
      { key: "angle", label: "Angle", min: 0, max: 360, step: 1, unit: "°" },
      {
        key: "aberration",
        label: "Aberration",
        min: 0,
        max: 1,
        step: 0.01,
        unit: "%",
      },
    ],
  },
  {
    title: "Motion",
    controls: [
      { key: "speed", label: "Speed", min: 0, max: 2, step: 0.05, unit: "×" },
    ],
  },
]

const shapes: { value: MetalShape; label: string }[] = [
  { value: "triangle", label: "Triangle" },
  { value: "circle", label: "Circle" },
  { value: "diamond", label: "Diamond" },
  { value: "apple", label: "Apple" },
  { value: "github", label: "GitHub" },
]

const backgrounds: { value: Background; label: string; swatch: string }[] = [
  { value: "dark", label: "Dark", swatch: "bg-[#171717]" },
  { value: "light", label: "Light", swatch: "bg-[#e5e5e5]" },
  {
    value: "transparent",
    label: "Transparent",
    swatch:
      "bg-[conic-gradient(#333_25%,#222_0_50%,#333_0_75%,#222_0)] bg-size-[8px_8px]",
  },
]

function subscribeToMotion(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

function getReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getServerReducedMotion(): boolean {
  return true
}

function codeFor(
  settings: MetalSettings,
  shape: MetalShape,
  paused: boolean
): string {
  return `import { LiquidMetal } from "@/components/ui/liquid-metal"\nimport type { MetalSettings } from "@/lib/liquid-metal"\n\nconst metal = ${JSON.stringify(settings, null, 2)} satisfies MetalSettings\n\nexport function MetalExample() {\n  return (\n    <LiquidMetal\n      settings={metal}\n      shape="${shape}"\n      paused={${paused}}\n      className="size-60 sm:size-72"\n    />\n  )\n}`
}

export function MetalLab(): ReactElement {
  const id = useId()
  const [settings, setSettings] = useState<MetalSettings>({
    ...defaultMetalSettings,
  })
  const [shape, setShape] = useState<MetalShape>("triangle")
  const [background, setBackground] = useState<Background>("dark")
  const [showCode, setShowCode] = useState<boolean>(false)
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotion,
    getServerReducedMotion
  )
  const paused = reducedMotion
  const activePreset = metalPresets.find((preset) =>
    (Object.keys(settings) as (keyof MetalSettings)[]).every(
      (key) => preset.settings[key] === settings[key]
    )
  )?.name
  const code = codeFor(settings, shape, false)

  function updateSettings(next: MetalSettings): void {
    setSettings(next)
    setCopyState("idle")
  }

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
      setShowCode(true)
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div role="group" aria-label="View" className="flex items-center gap-1">
          {[false, true].map((isCode) => (
            <button
              key={String(isCode)}
              type="button"
              aria-pressed={showCode === isCode}
              onClick={() => setShowCode(isCode)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
                showCode === isCode && "bg-foreground/10 text-foreground"
              )}
            >
              {isCode ? "Code" : "Preview"}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyCode}
          className="gap-2 rounded-full bg-foreground/5 text-xs"
        >
          {copyState === "copied" ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copyState === "copied" ? "Copied" : "Copy code"}
        </Button>
      </div>
      <p
        role="status"
        className={cn(
          "text-xs text-muted-foreground",
          copyState === "failed" ? "mb-4" : "sr-only"
        )}
      >
        {copyState === "copied"
          ? "Code copied to clipboard."
          : copyState === "failed"
            ? "Clipboard is unavailable. Select and copy the code below."
            : ""}
      </p>

      {showCode ? (
        <section
          aria-label="Liquid metal code"
          className="min-w-0 rounded-2xl bg-muted/30 p-5 dark:bg-[#171717]"
        >
          <pre
            tabIndex={0}
            aria-label="Liquid metal component code"
            className="max-h-[650px] overflow-auto rounded-lg font-mono text-xs leading-7 text-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <code>{code}</code>
          </pre>
          <p className="mt-5 text-xs text-muted-foreground">
            Uses this project’s LiquidMetal component. Copy to keep your
            settings.
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:grid-rows-[auto_1fr]">
          <section
            aria-label="Live liquid metal preview"
            className="min-w-0 overflow-hidden rounded-2xl"
          >
            <div
              className={cn(
                "relative flex h-[320px] items-center justify-center text-white sm:h-[360px] xl:h-[440px]",
                background === "dark" && "bg-[#171717]",
                background === "light" && "bg-[#e5e5e5] text-[#171717]",
                background === "transparent" &&
                  "bg-[conic-gradient(#202020_25%,#171717_0_50%,#202020_0_75%,#171717_0)] bg-size-[24px_24px]"
              )}
            >
              <LiquidMetal
                settings={settings}
                shape={shape}
                paused={paused}
                className="size-60 sm:size-72"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-end gap-3">
                <div
                  role="group"
                  aria-label="Preview background"
                  className="flex items-center gap-1"
                >
                  {backgrounds.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={`${option.label} background`}
                      title={`${option.label} background`}
                      aria-pressed={background === option.value}
                      onClick={() => setBackground(option.value)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full opacity-50 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                        background === option.value &&
                          "opacity-100 ring-1 ring-current/30"
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 rounded-full border border-current/20",
                          option.swatch
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            aria-label="Liquid metal controls"
            className="min-w-0 rounded-2xl border border-border/50 bg-card/50 p-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto dark:bg-[#1b1b1b]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs text-muted-foreground">Preset</h2>
              <button
                type="button"
                aria-label="Reset settings"
                title="Reset settings"
                onClick={() => updateSettings({ ...defaultMetalSettings })}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
            <div
              role="group"
              aria-label="Material presets"
              className="mb-5 flex flex-wrap gap-1.5"
            >
              {metalPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={activePreset === preset.name}
                  onClick={() => updateSettings({ ...preset.settings })}
                  className={cn(
                    "rounded-full bg-foreground/5 px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2",
                    activePreset === preset.name &&
                      "bg-foreground/10 text-foreground"
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <fieldset className="mb-5 min-w-0">
              <legend className="mb-3 text-xs text-muted-foreground">
                Shape
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {shapes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={shape === option.value}
                    onClick={() => {
                      setShape(option.value)
                      setCopyState("idle")
                    }}
                    className={cn(
                      "rounded-full bg-foreground/5 px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2",
                      shape === option.value &&
                        "bg-foreground/10 text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

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
                        ((value - control.min) / (control.max - control.min)) *
                        100
                      const displayValue =
                        control.unit === "%"
                          ? Math.round(value * 100)
                          : Number(value.toFixed(2))
                      const valueText = `${displayValue}${control.unit}`
                      const style = {
                        "--range-progress": `${progress}%`,
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
                              {valueText}
                            </output>
                          </div>
                          <input
                            id={inputId}
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={value}
                            aria-valuetext={valueText}
                            onChange={(event) =>
                              updateSettings({
                                ...settings,
                                [control.key]:
                                  event.currentTarget.valueAsNumber,
                              })
                            }
                            style={style}
                            className="block h-7 w-full cursor-pointer appearance-none rounded-sm bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-foreground forced-colors:[&::-moz-range-progress]:bg-[Highlight] [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground forced-colors:[&::-moz-range-thumb]:bg-[Highlight] [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border forced-colors:[&::-moz-range-track]:bg-[CanvasText] [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:linear-gradient(to_right,var(--foreground)_var(--range-progress),var(--border)_var(--range-progress))] forced-colors:[&::-webkit-slider-runnable-track]:[background:CanvasText] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground forced-colors:[&::-webkit-slider-thumb]:bg-[Highlight]"
                          />
                        </div>
                      )
                    })}
                    {group.title === "Reflections" && (
                      <div className="flex items-center justify-between gap-3 pt-1.5">
                        <label
                          htmlFor={`${id}-tint`}
                          className="text-xs text-foreground/85"
                        >
                          Tint
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
                              updateSettings({
                                ...settings,
                                tint: event.currentTarget.value,
                              })
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
          </section>
          <div className="min-w-0 xl:col-start-1 xl:row-start-2">
            <MetalExamples settings={settings} paused={paused} />
          </div>
        </div>
      )}
    </>
  )
}
