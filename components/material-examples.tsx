"use client"

import { useId, useState, type ReactElement, type ReactNode } from "react"
import { Check, Copy, Volume2, VolumeX } from "lucide-react"

import { MaterialSurface } from "@/components/ui/material-surface"
import type {
  MaterialKind,
  MaterialQuality,
  MaterialSettings,
} from "@/lib/materials/types"

type MaterialExamplesProps = {
  material: MaterialKind
  settings: MaterialSettings
  paused: boolean
  quality: MaterialQuality
}

const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
const rangeClass =
  "h-5 w-full cursor-pointer appearance-none bg-transparent accent-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/20 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
const componentNames: Record<MaterialKind, { name: string; file: string }> = {
  foil: { name: "HolographicFoil", file: "holographic-foil" },
  titanium: { name: "Titanium", file: "titanium" },
}

function exampleCode(
  props: MaterialExamplesProps,
  markup: string,
  state = "",
  icons: string[] = []
): string {
  const component = componentNames[props.material]
  const hooks = ["useId", "useState"].filter((hook) => state.includes(hook))
  const imports = [
    hooks.length ? `import { ${hooks.join(", ")} } from "react"` : "",
    icons.length ? `import { ${icons.join(", ")} } from "lucide-react"` : "",
    `import { ${component.name} } from "@/components/ui/${component.file}"`,
  ]
    .filter(Boolean)
    .join("\n")
  return `"use client"

${imports}

const settings = ${JSON.stringify(props.settings, null, 2)} as const
const materialProps = { settings, paused: ${props.paused}, quality: "${props.quality}" as const }

export default function Example() {
${state ? `${state}\n` : ""}  return (
${markup
  .replaceAll("$Surface", component.name)
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  )
}
`
}

function ExampleCard({
  title,
  code,
  children,
}: {
  title: string
  code: string
  children: ReactNode
}): ReactElement {
  const [copiedCode, setCopiedCode] = useState<string>("")
  const [showFallback, setShowFallback] = useState<boolean>(false)
  const copied = copiedCode === code
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setShowFallback(false)
    } catch {
      setShowFallback(true)
    }
  }
  return (
    <article className="min-w-0 rounded-2xl bg-[#171717] p-5 text-white">
      <div className="flex min-h-60 items-center justify-center">
        {children}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className="text-xs text-white/55">{title}</h3>
        <button
          type="button"
          aria-label={`Copy ${title.toLowerCase()} example`}
          onClick={() => void copy()}
          className={`rounded-md p-1.5 text-white/50 transition-colors hover:text-white ${focusClass}`}
        >
          {copied ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </button>
        <span role="status" className="sr-only">
          {showFallback
            ? "Clipboard unavailable. Select the code below to copy it manually."
            : copied
              ? `${title} code copied.`
              : ""}
        </span>
      </div>
      {showFallback && (
        <label className="mt-3 block text-xs text-white/65">
          Select and copy the code
          <textarea
            aria-label={`${title} example code`}
            readOnly
            value={code}
            onFocus={(event) => event.currentTarget.select()}
            className={`mt-2 h-32 w-full resize-y rounded-lg border border-white/15 bg-black/30 p-3 font-mono text-[11px] ${focusClass}`}
          />
        </label>
      )}
    </article>
  )
}

function FoilExamples(props: MaterialExamplesProps): ReactElement {
  const shared = { ...props }
  return (
    <>
      <ExampleCard
        title="Access credential"
        code={exampleCode(
          props,
          `<div className="flex h-40 w-full max-w-64 gap-5 rounded-xl border border-white/10 bg-[#202020] p-5 text-white">
  <div className="flex min-w-0 flex-1 flex-col justify-between">
    <p className="text-[9px] tracking-[0.2em] text-white/50">STUDIO / ACCESS</p>
    <div><p className="text-sm font-medium">Alex Morgan</p><p className="mt-1 text-[10px] text-white/45">Member 0024</p></div>
    <p className="text-[9px] tracking-widest text-white/70">ALL ACCESS</p>
  </div>
  <$Surface {...materialProps} className="h-full w-8 shrink-0" />
</div>`
        )}
      >
        <div className="flex h-40 w-full max-w-64 gap-5 rounded-xl border border-white/10 bg-[#202020] p-5 text-white">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <p className="text-[9px] tracking-[0.2em] text-white/50">
              STUDIO / ACCESS
            </p>
            <div>
              <p className="text-sm font-medium">Alex Morgan</p>
              <p className="mt-1 text-[10px] text-white/45">Member 0024</p>
            </div>
            <p className="text-[9px] tracking-widest text-white/70">
              ALL ACCESS
            </p>
          </div>
          <MaterialSurface {...shared} className="h-full w-8 shrink-0" />
        </div>
      </ExampleCard>
      <ExampleCard
        title="Authenticity seal"
        code={exampleCode(
          props,
          `<div className="w-full max-w-60 rounded-sm bg-[#d8d5cd] p-5 text-[#292825]">
  <p className="text-[9px] tracking-[0.18em] opacity-55">EDITION 01 / OBJECTS</p>
  <p className="mt-4 max-w-28 text-lg leading-tight">Certificate<br />of origin</p>
  <div className="mt-6 flex items-end justify-between border-t border-black/15 pt-3">
    <div className="text-[9px] leading-relaxed"><p>Hand-finished.</p><p className="opacity-50">Serial 0148 / 500</p></div>
    <$Surface {...materialProps} shape="circle" className="h-14 w-14">
      <div className="grid h-full place-items-center"><Check aria-label="Verified" className="size-5 text-black/70" strokeWidth={1.5} /></div>
    </$Surface>
  </div>
</div>`,
          "",
          ["Check"]
        )}
      >
        <div className="w-full max-w-60 rounded-sm bg-[#d8d5cd] p-5 text-[#292825]">
          <p className="text-[9px] tracking-[0.18em] opacity-55">
            EDITION 01 / OBJECTS
          </p>
          <p className="mt-4 max-w-28 text-lg leading-tight">
            Certificate
            <br />
            of origin
          </p>
          <div className="mt-6 flex items-end justify-between border-t border-black/15 pt-3">
            <div className="text-[9px] leading-relaxed">
              <p>Hand-finished.</p>
              <p className="opacity-50">Serial 0148 / 500</p>
            </div>
            <MaterialSurface {...shared} shape="circle" className="h-14 w-14">
              <div className="grid h-full place-items-center">
                <Check
                  aria-label="Verified"
                  className="size-5 text-black/70"
                  strokeWidth={1.5}
                />
              </div>
            </MaterialSurface>
          </div>
        </div>
      </ExampleCard>
      <ExampleCard
        title="Event ticket"
        code={exampleCode(
          props,
          `<div className="flex h-36 w-full max-w-64 overflow-hidden rounded-lg border border-white/10 bg-[#212121] text-white">
  <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
    <p className="text-[9px] tracking-widest text-white/45">ADMIT ONE</p>
    <p className="text-xl leading-tight">Studio<br />after hours.</p>
    <p className="text-[9px] text-white/50">02 NOV &nbsp; / &nbsp; 18:00</p>
  </div>
  <div className="flex w-16 shrink-0 flex-col items-center justify-between border-l border-dashed border-white/20 p-3">
    <$Surface {...materialProps} className="h-20 w-9" />
    <span className="font-mono text-[9px] text-white/60">024</span>
  </div>
</div>`
        )}
      >
        <div className="flex h-36 w-full max-w-64 overflow-hidden rounded-lg border border-white/10 bg-[#212121] text-white">
          <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
            <p className="text-[9px] tracking-widest text-white/45">
              ADMIT ONE
            </p>
            <p className="text-xl leading-tight">
              Studio
              <br />
              after hours.
            </p>
            <p className="text-[9px] text-white/50">
              02 NOV &nbsp; / &nbsp; 18:00
            </p>
          </div>
          <div className="flex w-16 shrink-0 flex-col items-center justify-between border-l border-dashed border-white/20 p-3">
            <MaterialSurface {...shared} className="h-20 w-9" />
            <span className="font-mono text-[9px] text-white/60">024</span>
          </div>
        </div>
      </ExampleCard>
      <ExampleCard
        title="Collectible edition"
        code={exampleCode(
          props,
          `<div className="w-40 rounded-lg border border-white/10 bg-[#242424] p-4 text-white">
  <div className="flex items-baseline justify-between"><span className="text-[8px] tracking-widest text-white/60">MONOGRAPH</span><span className="text-[8px] text-white/35">01</span></div>
  <$Surface {...materialProps} className="my-5 h-28 w-full"><div className="absolute inset-3 border border-black/25" /></$Surface>
  <div className="flex justify-between border-t border-white/10 pt-3 text-[8px] text-white/50"><span>First edition</span><span>024 / 200</span></div>
</div>`
        )}
      >
        <div className="w-40 rounded-lg border border-white/10 bg-[#242424] p-4 text-white">
          <div className="flex items-baseline justify-between">
            <span className="text-[8px] tracking-widest text-white/60">
              MONOGRAPH
            </span>
            <span className="text-[8px] text-white/35">01</span>
          </div>
          <MaterialSurface {...shared} className="my-5 h-28 w-full">
            <div className="absolute inset-3 border border-black/25" />
          </MaterialSurface>
          <div className="flex justify-between border-t border-white/10 pt-3 text-[8px] text-white/50">
            <span>First edition</span>
            <span>024 / 200</span>
          </div>
        </div>
      </ExampleCard>
    </>
  )
}

function TitaniumExamples(props: MaterialExamplesProps): ReactElement {
  const shared = { ...props }
  const [volume, setVolume] = useState<number>(64)
  const [enabled, setEnabled] = useState<boolean>(true)
  const [mode, setMode] = useState<string>("Photo")
  const [muted, setMuted] = useState<boolean>(false)
  const volumeId = useId()
  return (
    <>
      <ExampleCard
        title="Audio dial"
        code={exampleCode(
          props,
          `<div className="w-48 text-white">
  <div className="relative mx-auto h-28 w-28 rounded-full border border-white/15 bg-[#0e0e0e] p-1.5">
    <$Surface {...materialProps} shape="circle" className="h-full min-h-0 w-full" />
    <div aria-hidden="true" className="pointer-events-none absolute inset-4" style={{ transform: \`rotate(\${-135 + volume * 2.7}deg)\` }}><span className="absolute left-1/2 top-0 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-black/65" /></div>
  </div>
  <div className="mb-2 mt-6 flex items-center justify-between text-[11px]"><label htmlFor={volumeId} className="text-white/55">Output level</label><output htmlFor={volumeId} className="tabular-nums">{volume}%</output></div>
  <input id={volumeId} type="range" min={0} max={100} step={1} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="${rangeClass}" />
</div>`,
          `  const [volume, setVolume] = useState<number>(${volume})\n  const volumeId = useId()`
        )}
      >
        <div className="w-48 text-white">
          <div className="relative mx-auto h-28 w-28 rounded-full border border-white/15 bg-[#0e0e0e] p-1.5">
            <MaterialSurface
              {...shared}
              shape="circle"
              className="h-full min-h-0 w-full"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4"
              style={{ transform: `rotate(${-135 + volume * 2.7}deg)` }}
            >
              <span className="absolute top-0 left-1/2 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-black/65" />
            </div>
          </div>
          <div className="mt-6 mb-2 flex items-center justify-between text-[11px]">
            <label htmlFor={volumeId} className="text-white/55">
              Output level
            </label>
            <output htmlFor={volumeId} className="tabular-nums">
              {volume}%
            </output>
          </div>
          <input
            id={volumeId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className={rangeClass}
          />
        </div>
      </ExampleCard>
      <ExampleCard
        title="Hardware toggle"
        code={exampleCode(
          props,
          `<div className="w-52 text-white">
  <div className="relative mx-auto h-12 w-[88px] rounded-full border border-white/15 bg-[#0e0e0e] p-1">
    <div className="h-[38px] w-[38px] transition-transform motion-reduce:transition-none" style={{ transform: enabled ? "translateX(38px)" : "translateX(0)" }}><$Surface {...materialProps} shape="circle" className="h-full min-h-0 w-full" /></div>
    <button type="button" role="switch" aria-checked={enabled} aria-label="Noise cancellation" onClick={() => setEnabled(!enabled)} className="absolute inset-0 rounded-full ${focusClass}" />
  </div>
  <div className="mt-6 flex justify-between text-[11px]"><span className="text-white/55">Noise cancellation</span><span>{enabled ? "On" : "Off"}</span></div>
</div>`,
          `  const [enabled, setEnabled] = useState<boolean>(${enabled})`
        )}
      >
        <div className="w-52 text-white">
          <div className="relative mx-auto h-12 w-[88px] rounded-full border border-white/15 bg-[#0e0e0e] p-1">
            <div
              className="h-[38px] w-[38px] transition-transform motion-reduce:transition-none"
              style={{
                transform: enabled ? "translateX(38px)" : "translateX(0)",
              }}
            >
              <MaterialSurface
                {...shared}
                shape="circle"
                className="h-full min-h-0 w-full"
              />
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Noise cancellation"
              onClick={() => setEnabled(!enabled)}
              className={`absolute inset-0 rounded-full ${focusClass}`}
            />
          </div>
          <div className="mt-6 flex justify-between text-[11px]">
            <span className="text-white/55">Noise cancellation</span>
            <span>{enabled ? "On" : "Off"}</span>
          </div>
        </div>
      </ExampleCard>
      <ExampleCard
        title="Camera mode selector"
        code={exampleCode(
          props,
          `<div className="w-full max-w-64 text-white">
  <p className="mb-4 text-center text-[10px] tracking-[0.12em] text-white/40">CAPTURE MODE</p>
  <div role="group" aria-label="Camera mode" className="relative grid grid-cols-3 rounded-lg border border-white/10 bg-[#0e0e0e] p-1">
    <div className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%_-_8px)/3)] transition-transform motion-reduce:transition-none" style={{ transform: \`translateX(\${["Photo", "Video", "Pro"].indexOf(mode) * 100}%)\` }}><$Surface {...materialProps} className="h-full min-h-0 w-full" /></div>
    {["Photo", "Video", "Pro"].map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={\`relative z-10 h-10 rounded-md text-[11px] ${focusClass} \${mode === item ? "font-medium text-black/80" : "text-white/45"}\`}>{item}</button>)}
  </div>
  <p className="mt-4 text-center text-[10px] text-white/35" role="status">{mode === "Photo" ? "RAW · 24 MP" : mode === "Video" ? "4K · 60 FPS" : "Manual exposure"}</p>
</div>`,
          `  const [mode, setMode] = useState<string>(${JSON.stringify(mode)})`
        )}
      >
        <div className="w-full max-w-64 text-white">
          <p className="mb-4 text-center text-[10px] tracking-[0.12em] text-white/40">
            CAPTURE MODE
          </p>
          <div
            role="group"
            aria-label="Camera mode"
            className="relative grid grid-cols-3 rounded-lg border border-white/10 bg-[#0e0e0e] p-1"
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%_-_8px)/3)] transition-transform motion-reduce:transition-none"
              style={{
                transform: `translateX(${["Photo", "Video", "Pro"].indexOf(mode) * 100}%)`,
              }}
            >
              <MaterialSurface {...shared} className="h-full min-h-0 w-full" />
            </div>
            {["Photo", "Video", "Pro"].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
                className={`relative z-10 h-10 rounded-md text-[11px] ${focusClass} ${mode === item ? "font-medium text-black/80" : "text-white/45"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <p
            className="mt-4 text-center text-[10px] text-white/35"
            role="status"
          >
            {mode === "Photo"
              ? "RAW · 24 MP"
              : mode === "Video"
                ? "4K · 60 FPS"
                : "Manual exposure"}
          </p>
        </div>
      </ExampleCard>
      <ExampleCard
        title="Audio card"
        code={exampleCode(
          props,
          `<div className="flex w-full max-w-64 items-center gap-3 rounded-2xl border border-white/10 bg-[#111] p-3 text-white">
  <div className="relative h-12 w-12 shrink-0">
    <$Surface {...materialProps} shape="circle" className="h-full min-h-0 w-full" />
  </div>
  <div className="min-w-0 flex-1"><p className="text-xs">Studio session</p><p role="status" className="mt-1 text-[10px] text-white/40">{muted ? "Muted" : "Volume on"}</p></div>
  <button type="button" aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} onClick={() => setMuted(!muted)} className="rounded-lg p-2 text-white/55 ${focusClass}">{muted ? <VolumeX aria-hidden="true" className="size-4" /> : <Volume2 aria-hidden="true" className="size-4" />}</button>
</div>`,
          `  const [muted, setMuted] = useState<boolean>(${muted})`,
          ["Volume2", "VolumeX"]
        )}
      >
        <div className="flex w-full max-w-64 items-center gap-3 rounded-2xl border border-white/10 bg-[#111] p-3 text-white">
          <div className="relative h-12 w-12 shrink-0">
            <MaterialSurface
              {...shared}
              shape="circle"
              className="h-full min-h-0 w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs">Studio session</p>
            <p role="status" className="mt-1 text-[10px] text-white/40">
              {muted ? "Muted" : "Volume on"}
            </p>
          </div>
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            onClick={() => setMuted(!muted)}
            className={`rounded-lg p-2 text-white/55 ${focusClass}`}
          >
            {muted ? (
              <VolumeX aria-hidden="true" className="size-4" />
            ) : (
              <Volume2 aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </ExampleCard>
    </>
  )
}

export function MaterialExamples(props: MaterialExamplesProps): ReactElement {
  return (
    <section
      aria-label={`${componentNames[props.material].name} examples`}
      className="grid min-w-0 gap-4 sm:grid-cols-2"
    >
      {props.material === "foil" ? (
        <FoilExamples {...props} />
      ) : (
        <TitaniumExamples {...props} />
      )}
    </section>
  )
}
