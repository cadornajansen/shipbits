"use client"

import { Check, Copy, Grid2X2, RotateCcw } from "lucide-react"
import { useState, type ReactElement } from "react"

import { GlassControls } from "@/components/glass-controls"
import { GlassExamples } from "@/components/glass-examples"
import { Button } from "@/components/ui/button"
import { GlassLink } from "@/components/ui/glass-link"
import { defaultGlassSettings, type GlassSettings } from "@/lib/glass-optics"
import { cn } from "@/lib/utils"

type CopyState = "idle" | "copied" | "failed"

const presets: { name: string; settings: GlassSettings }[] = [
  { name: "Original", settings: { ...defaultGlassSettings } },
  {
    name: "Clear",
    settings: {
      ...defaultGlassSettings,
      frost: 0,
      fillOpacity: 5,
      refraction: 95,
      dispersion: 65,
      radius: 30,
      lightIntensity: 90,
    },
  },
  {
    name: "Frosted",
    settings: {
      ...defaultGlassSettings,
      frost: 14,
      tint: "#a8b4b1",
      fillOpacity: 28,
      refraction: 45,
      dispersion: 10,
      splay: 50,
      lightIntensity: 65,
    },
  },
]

function codeFor(settings: GlassSettings): string {
  return `import { GlassLink } from "@/components/ui/glass-link"\nimport type { GlassSettings } from "@/lib/glass-optics"\n\nconst glass = ${JSON.stringify(settings, null, 2)} satisfies GlassSettings\n\nexport function GlassExample() {\n  return (\n    <GlassLink\n      href="#experiments"\n      settings={glass}\n      className="h-[60px] w-[210px] text-lg font-normal"\n    >\n      Browse\n    </GlassLink>\n  )\n}`
}

export function GlassLab(): ReactElement {
  const [settings, setSettings] = useState<GlassSettings>({
    ...defaultGlassSettings,
  })
  const [showGrid, setShowGrid] = useState<boolean>(false)
  const [showCode, setShowCode] = useState<boolean>(false)
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const activePreset = presets.find((preset) =>
    (Object.keys(settings) as (keyof GlassSettings)[]).every(
      (key) => preset.settings[key] === settings[key]
    )
  )?.name
  const code = codeFor(settings)

  function updateSettings(next: GlassSettings): void {
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
          <button
            type="button"
            aria-pressed={!showCode}
            onClick={() => setShowCode(false)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
              !showCode && "bg-foreground/10 text-foreground"
            )}
          >
            Preview
          </button>
          <button
            type="button"
            aria-pressed={showCode}
            onClick={() => setShowCode(true)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2",
              showCode && "bg-foreground/10 text-foreground"
            )}
          >
            Code
          </button>
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
          aria-label="Glass code"
          className="min-w-0 rounded-2xl bg-muted/30 p-5 dark:bg-[#171717]"
        >
          <pre
            tabIndex={0}
            aria-label="Glass component code"
            className="max-h-[650px] overflow-auto rounded-lg font-mono text-xs leading-7 text-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <code>{code}</code>
          </pre>
          <p className="mt-5 text-xs text-muted-foreground">
            Uses this project’s GlassLink. Copy to keep your settings.
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:grid-rows-[auto_1fr]">
          <section
            aria-label="Live glass preview"
            className="min-w-0 overflow-hidden rounded-2xl bg-[#171717]"
          >
            <div className="relative flex h-[240px] items-center justify-center bg-[radial-gradient(ellipse_at_24%_30%,rgba(255,255,255,0.035)_0%,transparent_58%),radial-gradient(ellipse_at_76%_72%,rgba(255,255,255,0.025)_0%,transparent_55%)] sm:h-[300px] xl:h-[440px]">
              {showGrid && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(#ffffff30_1px,transparent_1px),linear-gradient(90deg,#ffffff30_1px,transparent_1px)] bg-size-[24px_24px]"
                />
              )}
              <GlassLink
                href="/#experiments"
                settings={settings}
                className="h-[60px] w-[210px] text-lg font-normal text-white focus-visible:outline-white [@media(prefers-reduced-transparency:reduce)]:text-foreground [@media(prefers-reduced-transparency:reduce)]:focus-visible:outline-foreground"
              >
                Browse
              </GlassLink>
              <button
                type="button"
                aria-label="Show grid"
                title="Show grid"
                aria-pressed={showGrid}
                onClick={() => setShowGrid(!showGrid)}
                className={cn(
                  "absolute right-4 bottom-4 flex size-8 items-center justify-center rounded-full text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  showGrid && "bg-white/15 text-white"
                )}
              >
                <Grid2X2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </section>

          <section
            aria-label="Glass controls"
            className="min-w-0 rounded-2xl border border-border/50 bg-card/50 p-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto dark:bg-[#1b1b1b]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs text-muted-foreground">Preset</h2>
              <button
                type="button"
                aria-label="Reset settings"
                title="Reset settings"
                onClick={() => updateSettings({ ...defaultGlassSettings })}
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
              {presets.map((preset) => (
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
            <GlassControls settings={settings} onChange={updateSettings} />
          </section>
          <div className="min-w-0 xl:col-start-1 xl:row-start-2">
            <GlassExamples settings={settings} />
          </div>
        </div>
      )}
    </>
  )
}
