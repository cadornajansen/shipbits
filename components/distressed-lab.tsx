"use client"

import Link from "next/link"
import { Check, Copy, RotateCcw, Shuffle } from "lucide-react"
import { useId, useState, type CSSProperties, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Distressed } from "@/components/ui/distressed"
import {
  defaultDistressedSettings,
  distressedPresets,
  type DistressedSettings,
  type DistressedShape,
} from "@/lib/distressed"
import { cn } from "@/lib/utils"

type NumericSetting = Exclude<keyof DistressedSettings, "clipToShape" | "color">
const controls: {
  key: NumericSetting
  label: string
  min: number
  max: number
  step: number
  unit: string
}[] = [
  { key: "sizeX", label: "Size X", min: 0.2, max: 4, step: 0.1, unit: "" },
  { key: "sizeY", label: "Size Y", min: 0.2, max: 4, step: 0.1, unit: "" },
  { key: "radius", label: "Radius", min: 0, max: 8, step: 0.1, unit: "" },
  { key: "grain", label: "Grain", min: 0, max: 100, step: 1, unit: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 100, step: 1, unit: "%" },
  {
    key: "angle",
    label: "Gradient angle",
    min: 0,
    max: 360,
    step: 1,
    unit: "°",
  },
]
const shapes: { value: DistressedShape; label: string }[] = [
  { value: "motion", label: "Motion" },
  { value: "text", label: "Type" },
  { value: "badge", label: "Badge" },
]

export function DistressedLab(): ReactElement {
  const id = useId()
  const [settings, setSettings] = useState<DistressedSettings>({
    ...defaultDistressedSettings,
  })
  const [shape, setShape] = useState<DistressedShape>("motion")
  const [text, setText] = useState<string>("SHIPBITS")
  const [showCode, setShowCode] = useState<boolean>(false)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  )
  const preset = distressedPresets.find((item) =>
    (Object.keys(settings) as (keyof DistressedSettings)[]).every(
      (key) => settings[key] === item.settings[key]
    )
  )?.name
  const code = `import { Distressed } from "@/components/ui/distressed"\nimport type { DistressedSettings } from "@/lib/distressed"\n\nconst texture = ${JSON.stringify(settings, null, 2)} satisfies DistressedSettings\n\nexport function TextureExample() {\n  return (\n    <Distressed\n      settings={texture}\n      shape="${shape}"\n      text={${JSON.stringify(text)}}\n      className="w-80 max-w-full"\n    />\n  )\n}`

  function updateSettings(next: DistressedSettings): void {
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
        <div role="group" aria-label="View" className="flex gap-1">
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
        className={
          copyState === "failed"
            ? "mb-4 text-xs text-muted-foreground"
            : "sr-only"
        }
      >
        {copyState === "failed"
          ? "Clipboard unavailable. Select and copy the code below."
          : copyState === "copied"
            ? "Code copied."
            : ""}
      </p>
      {showCode ? (
        <section
          aria-label="Distressed code"
          className="min-w-0 rounded-2xl bg-muted/30 p-5 dark:bg-[#171717]"
        >
          <pre
            tabIndex={0}
            className="max-h-[650px] overflow-auto rounded-lg font-mono text-xs leading-7 text-foreground/80 focus-visible:outline-2"
          >
            <code>{code}</code>
          </pre>
          <p className="mt-5 text-xs text-muted-foreground">
            Uses this project’s Distressed component.
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:grid-rows-[auto_1fr]">
          <section
            aria-label="Live distressed preview"
            className="flex h-[300px] min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-[#171717] p-8 xl:h-[440px]"
          >
            <Distressed
              settings={settings}
              shape={shape}
              text={text}
              className="w-full max-w-96"
            />
          </section>
          <section
            aria-label="Distressed controls"
            className="min-w-0 rounded-2xl border border-border/50 bg-card/50 p-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto dark:bg-[#1b1b1b]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs text-muted-foreground">Preset</h2>
              <button
                type="button"
                aria-label="Reset settings"
                title="Reset settings"
                onClick={() => updateSettings({ ...defaultDistressedSettings })}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 focus-visible:outline-2"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
            <div
              role="group"
              aria-label="Texture presets"
              className="mb-5 flex flex-wrap gap-1.5"
            >
              {distressedPresets.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  aria-pressed={preset === item.name}
                  onClick={() => updateSettings({ ...item.settings })}
                  className={cn(
                    "rounded-full bg-foreground/5 px-3 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
                    preset === item.name && "bg-foreground/10 text-foreground"
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <fieldset className="mb-5 min-w-0">
              <legend className="mb-3 text-xs text-muted-foreground">
                Shape
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {shapes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={shape === item.value}
                    onClick={() => {
                      setShape(item.value)
                      setCopyState("idle")
                    }}
                    className={cn(
                      "rounded-full bg-foreground/5 px-3 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
                      shape === item.value && "bg-foreground/10 text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {shape !== "motion" && (
                <div className="mt-3">
                  <label
                    htmlFor={`${id}-text`}
                    className="mb-2 block text-xs text-muted-foreground"
                  >
                    Text
                  </label>
                  <input
                    id={`${id}-text`}
                    value={text}
                    maxLength={20}
                    onChange={(event) => {
                      setText(event.currentTarget.value)
                      setCopyState("idle")
                    }}
                    className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </div>
              )}
            </fieldset>
            <fieldset className="space-y-1.5">
              <legend className="mb-3 text-xs text-muted-foreground">
                Texture
              </legend>
              {controls.map((control) => (
                <div key={control.key}>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={`${id}-${control.key}`}
                      className="text-xs text-foreground/85"
                    >
                      {control.label}
                    </label>
                    <output
                      htmlFor={`${id}-${control.key}`}
                      aria-live="off"
                      className="font-mono text-[11px] text-muted-foreground tabular-nums"
                    >
                      {settings[control.key]}
                      {control.unit}
                    </output>
                  </div>
                  <input
                    id={`${id}-${control.key}`}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={settings[control.key]}
                    aria-valuetext={`${settings[control.key]}${control.unit}`}
                    onChange={(event) =>
                      updateSettings({
                        ...settings,
                        [control.key]: event.currentTarget.valueAsNumber,
                      })
                    }
                    style={
                      {
                        "--range-progress": `${((settings[control.key] - control.min) / (control.max - control.min)) * 100}%`,
                      } as CSSProperties
                    }
                    className="block h-7 w-full cursor-pointer appearance-none rounded-sm bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-foreground forced-colors:[&::-moz-range-progress]:bg-[Highlight] [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground forced-colors:[&::-moz-range-thumb]:bg-[Highlight] [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border forced-colors:[&::-moz-range-track]:bg-[CanvasText] [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:linear-gradient(to_right,var(--foreground)_var(--range-progress),var(--border)_var(--range-progress))] forced-colors:[&::-webkit-slider-runnable-track]:[background:CanvasText] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground forced-colors:[&::-webkit-slider-thumb]:bg-[Highlight]"
                  />
                </div>
              ))}
            </fieldset>
            <label className="mt-4 flex items-center gap-2.5 text-xs">
              <input
                type="checkbox"
                checked={settings.clipToShape}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    clipToShape: event.currentTarget.checked,
                  })
                }
                className="size-3.5 accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              Clip to shape
            </label>
            <div className="mt-5 flex items-center justify-between gap-3">
              <label
                htmlFor={`${id}-seed`}
                className="text-xs text-muted-foreground"
              >
                Seed
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${id}-seed`}
                  type="number"
                  min={1}
                  max={9999}
                  step={1}
                  value={settings.seed}
                  onChange={(event) => {
                    const seed = event.currentTarget.valueAsNumber
                    if (Number.isFinite(seed))
                      updateSettings({
                        ...settings,
                        seed: Math.max(1, Math.min(9999, Math.round(seed))),
                      })
                  }}
                  className="w-16 rounded-md border border-border bg-transparent px-2 py-1.5 font-mono text-[11px] focus-visible:outline-2"
                />
                <button
                  type="button"
                  aria-label="Shuffle texture"
                  title="Shuffle texture"
                  onClick={() =>
                    updateSettings({
                      ...settings,
                      seed: (settings.seed % 9999) + 1,
                    })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/5 focus-visible:outline-2"
                >
                  <Shuffle className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label
                htmlFor={`${id}-color`}
                className="text-xs text-muted-foreground"
              >
                Color
              </label>
              <input
                id={`${id}-color`}
                type="color"
                value={settings.color}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    color: event.currentTarget.value,
                  })
                }
                className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-1 focus-visible:outline-2"
              />
            </div>
          </section>
          <section
            aria-label="Distressed examples"
            className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-start-1 xl:row-start-2"
          >
            <article className="flex min-h-80 min-w-0 flex-col justify-between rounded-2xl bg-[#171717] p-6 text-white">
              <p className="text-xs text-white/45">Wordmark</p>
              <Distressed
                settings={settings}
                shape="text"
                text={text}
                className="my-10"
              />
              <p className="text-xs text-white/45">
                A little texture. A distinct identity.
              </p>
            </article>
            <article className="flex min-h-80 min-w-0 flex-col justify-between rounded-2xl bg-[#171717] p-6 text-white">
              <p className="text-xs text-white/45">Release badge</p>
              <Distressed
                settings={settings}
                shape="badge"
                text="NEW RELEASE"
                className="mx-auto my-8 max-w-60"
              />
              <Link
                href="/#experiments"
                className="w-fit text-xs text-white/70 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Explore the collection
              </Link>
            </article>
            <article className="relative flex min-h-64 min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-border/50 p-6 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Launch artwork</p>
              <Distressed
                settings={settings}
                shape="motion"
                className="my-6 w-48 self-center sm:w-64"
              />
              <div className="flex items-end justify-between gap-4">
                <h3 className="text-lg font-medium">
                  Small details.
                  <br />
                  Lasting impressions.
                </h3>
                <span className="text-xs text-muted-foreground">
                  Shipbits.dev
                </span>
              </div>
            </article>
          </section>
        </div>
      )}
    </>
  )
}
