"use client"

import { Check, Copy, RotateCcw } from "lucide-react"
import {
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from "react"
import { MaterialSurface } from "@/components/ui/material-surface"
import { MaterialExamples } from "@/components/material-examples"
import { materialDefinitions } from "@/lib/materials/registry"
import type {
  Control,
  MaterialKind,
  MaterialQuality,
  MaterialSettings,
  SurfaceShape,
} from "@/lib/materials/types"
import { cn } from "@/lib/utils"

const rangeClass =
  "block h-7 w-full cursor-pointer appearance-none rounded-sm bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-foreground [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:linear-gradient(to_right,var(--foreground)_var(--range-progress),var(--border)_var(--range-progress))] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground forced-colors:[&::-webkit-slider-runnable-track]:[background:CanvasText] forced-colors:[&::-webkit-slider-thumb]:bg-[Highlight] forced-colors:[&::-moz-range-thumb]:bg-[Highlight] forced-colors:[&::-moz-range-track]:bg-[CanvasText]"
const pillClass =
  "rounded-full bg-foreground/5 px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2"

function subscribeMotion(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}
function reducedSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
function serverSnapshot(): boolean {
  return true
}

function NumericControl({
  control,
  value,
  onChange,
}: {
  control: Control
  value: number
  onChange: (value: number) => void
}): ReactElement {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const min = control.min ?? 0
  const max = control.max ?? 100
  const step = control.step ?? 1
  const progress = ((value - min) / (max - min)) * 100
  function update(next: number): void {
    if (Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next)))
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          title={control.info}
          className="text-xs text-foreground/85"
        >
          {control.label}
        </label>
        <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground tabular-nums">
          <input
            aria-label={`${control.label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft ?? Number(value.toFixed(3))}
            onFocus={() => setDraft(String(value))}
            onBlur={() => setDraft(null)}
            onChange={(event) => {
              setDraft(event.target.value)
              if (event.target.value !== "") update(event.target.valueAsNumber)
            }}
            className="w-14 [appearance:textfield] rounded-sm bg-transparent py-1 text-right outline-none hover:bg-foreground/5 focus:bg-foreground/5 focus:ring-1 focus:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {control.unit && (
            <span aria-hidden="true" className="min-w-2">
              {control.unit}
            </span>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value}${control.unit ?? ""}`}
        onChange={(event) => {
          setDraft(null)
          update(event.target.valueAsNumber)
        }}
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
        className={rangeClass}
      />
    </div>
  )
}

function SettingControl({
  control,
  value,
  onChange,
}: {
  control: Control
  value: number | string
  onChange: (value: number | string) => void
}): ReactElement {
  const id = useId()
  if (control.kind === "color")
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <label htmlFor={id} className="text-xs text-foreground/85">
          {control.label}
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground uppercase">
            {value}
          </span>
          <input
            id={id}
            type="color"
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-1 focus-visible:outline-2 [&::-webkit-color-swatch]:rounded-xs [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          />
        </div>
      </div>
    )
  if (control.kind === "select")
    return (
      <div className="py-1.5">
        <p id={id} className="mb-2 text-xs text-foreground/85">
          {control.label}
        </p>
        <div
          role="group"
          aria-labelledby={id}
          className="flex flex-wrap gap-1.5"
        >
          {control.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                pillClass,
                value === option.value && "bg-foreground/10 text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    )
  return (
    <NumericControl
      control={control}
      value={Number(value)}
      onChange={onChange}
    />
  )
}

export function MaterialLab({
  material,
}: {
  material: MaterialKind
}): ReactElement {
  const definition = materialDefinitions[material]
  const [settings, setSettings] = useState<MaterialSettings>(() => ({
    ...definition.defaults,
  }))
  const [shape, setShape] = useState<SurfaceShape>(
    material === "titanium" ? "circle" : "rectangle"
  )
  const [quality, setQuality] = useState<MaterialQuality>("auto")
  const [background, setBackground] = useState<"dark" | "light" | "grid">(
    "dark"
  )
  const [showCode, setShowCode] = useState<boolean>(false)
  const [copiedCode, setCopiedCode] = useState<string>("")
  const [copyFailed, setCopyFailed] = useState<boolean>(false)
  const reduced = useSyncExternalStore(
    subscribeMotion,
    reducedSnapshot,
    serverSnapshot
  )
  const paused = reduced
  const activePreset = definition.presets.find((preset) =>
    Object.keys(settings).every((key) => preset.settings[key] === settings[key])
  )?.name
  const backgrounds: ("dark" | "light" | "grid")[] = ["dark", "light", "grid"]
  const code = `import { ${definition.component} } from "@/components/ui/${definition.componentFile}"\nimport type { ${definition.settingsType} } from "@/lib/materials/${material}"\n\nconst material = ${JSON.stringify(settings, null, 2)} satisfies ${definition.settingsType}\n\nexport function Example() {\n  return (\n    <${definition.component}\n      settings={material}\n      shape="${shape}"\n      quality="${quality}"\n      paused={false}\n      className="h-64 w-80 max-w-full"\n    />\n  )\n}`

  const copied = copyFailed ? "failed" : copiedCode === code ? "copied" : "idle"

  function update(next: MaterialSettings): void {
    setSettings(definition.normalize(next))
    setCopyFailed(false)
  }
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
      setShowCode(true)
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div role="group" aria-label="View" className="flex gap-1">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={showCode === value}
              onClick={() => setShowCode(value)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
                showCode === value && "bg-foreground/10 text-foreground"
              )}
            >
              {value ? "Code" : "Preview"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-full border bg-foreground/5 px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {copied === "copied" ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied === "copied" ? "Copied" : "Copy code"}
        </button>
      </div>
      <p
        role="status"
        className={
          copied === "failed" ? "mb-4 text-xs text-muted-foreground" : "sr-only"
        }
      >
        {copied === "copied"
          ? "Code copied."
          : copied === "failed"
            ? "Clipboard unavailable. Select and copy the code below."
            : ""}
      </p>
      {showCode ? (
        <section
          aria-label={`${definition.title} code`}
          className="min-w-0 rounded-2xl bg-muted/30 p-5 dark:bg-[#171717]"
        >
          <pre
            tabIndex={0}
            className="max-h-[650px] overflow-auto rounded-lg font-mono text-xs leading-7 text-foreground/80 focus-visible:outline-2"
          >
            <code>{code}</code>
          </pre>
          <p className="mt-5 text-xs text-muted-foreground">
            Uses the {definition.component} component and shader files in this
            project.
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:grid-rows-[auto_1fr]">
          <section
            aria-label={`Live ${definition.title.toLowerCase()} preview`}
            className={cn(
              "relative flex h-80 min-w-0 items-center justify-center overflow-hidden rounded-2xl px-8 sm:h-90 xl:h-110",
              background === "light" ? "bg-[#dedede]" : "bg-[#171717]",
              background === "grid" &&
                "bg-[linear-gradient(#ffffff06_1px,transparent_1px),linear-gradient(90deg,#ffffff06_1px,transparent_1px)] bg-size-[24px_24px]"
            )}
          >
            <MaterialSurface
              material={material}
              settings={settings}
              shape={shape}
              quality={quality}
              paused={paused}
              className={cn(
                "max-w-full",
                shape === "circle" || shape === "diamond"
                  ? "size-52 sm:size-60"
                  : shape === "pill"
                    ? "h-20 w-64"
                    : "h-52 w-72 sm:h-60 sm:w-80"
              )}
            />
            <div
              className={cn(
                "absolute inset-x-4 bottom-4 flex items-center justify-end text-xs",
                background === "light" ? "text-[#333]" : "text-white/60"
              )}
            >
              <div
                role="group"
                aria-label="Preview background"
                className="flex gap-1"
              >
                {backgrounds.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} background`}
                    title={`${value} background`}
                    aria-pressed={background === value}
                    onClick={() => setBackground(value)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full focus-visible:outline-2",
                      background === value && "ring-1 ring-current/30"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3.5 rounded-full border border-current/20",
                        value === "dark"
                          ? "bg-[#171717]"
                          : value === "light"
                            ? "bg-[#ddd]"
                            : "bg-[conic-gradient(#333_25%,#222_0_50%,#333_0_75%,#222_0)] bg-size-[6px_6px]"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section
            aria-label={`${definition.title} controls`}
            className="min-w-0 rounded-2xl border border-border/50 bg-card/50 p-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto dark:bg-[#1b1b1b]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs text-muted-foreground">Preset</h2>
              <button
                type="button"
                aria-label="Reset settings"
                title="Reset settings"
                onClick={() => update({ ...definition.defaults })}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 focus-visible:outline-2"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
            <div
              role="group"
              aria-label="Material presets"
              className="mb-5 flex flex-wrap gap-1.5"
            >
              {definition.presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={activePreset === preset.name}
                  onClick={() => update({ ...preset.settings })}
                  className={cn(
                    pillClass,
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
                {definition.shapes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={shape === option.value}
                    onClick={() => {
                      setShape(option.value)
                      setCopyFailed(false)
                    }}
                    className={cn(
                      pillClass,
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
              {definition.groups.map((group) => (
                <fieldset key={group.title} className="min-w-0">
                  <legend className="mb-3 text-xs text-muted-foreground">
                    {group.title}
                  </legend>
                  <div className="space-y-1.5">
                    {group.controls.map((control) => (
                      <SettingControl
                        key={control.key}
                        control={control}
                        value={settings[control.key]}
                        onChange={(value) =>
                          update({ ...settings, [control.key]: value })
                        }
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <details className="mt-5 text-xs text-muted-foreground">
              <summary className="cursor-pointer rounded-sm py-1 focus-visible:outline-2">
                Rendering
              </summary>
              <div
                role="group"
                aria-label="Render quality"
                className="mt-3 flex gap-1.5"
              >
                {(["auto", "high"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={quality === value}
                    onClick={() => setQuality(value)}
                    className={cn(
                      pillClass,
                      quality === value && "bg-foreground/10 text-foreground"
                    )}
                  >
                    {value === "auto" ? "Auto" : "High"}
                  </button>
                ))}
              </div>
            </details>
          </section>
          <div className="min-w-0 xl:col-start-1 xl:row-start-2">
            <MaterialExamples
              material={material}
              settings={settings}
              paused={paused}
              quality={quality}
            />
          </div>
        </div>
      )}
    </>
  )
}
