"use client"

import { useId, useState, type ReactElement } from "react"
import { useSearchParams } from "next/navigation"
import { RotateCcw } from "lucide-react"
import {
  AI_ORB_NAMES,
  AI_ORB_STATES,
  AI_ORB_VARIANTS,
  type AiOrbLook,
  type AiOrbState,
} from "@/components/ui/ai-orb"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"
import { OrbUseCase } from "@/components/orb-use-case"
import {
  defaultOrbStudioSettings,
  orbStudioPresets,
  orbStudioCode,
  orbStudioLook,
  type OrbStudioSettings,
  type OrbPresentation,
} from "@/lib/ai-orb-studio"

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}): ReactElement {
  const id = useId()
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="text-[13px] text-muted-foreground">
        {label}
      </label>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next)
        }}
      >
        <SelectTrigger id={id} aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
function Range({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}): ReactElement {
  const id = useId()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span id={id} className="text-[13px] text-muted-foreground">
          {label}
        </span>
        <output className="font-mono text-xs">
          {Number(value.toFixed(2))}
          {suffix}
        </output>
      </div>
      <Slider
        aria-labelledby={id}
        thumbLabel={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}
const STATE_OPTIONS = AI_ORB_STATES.map((state) => ({
  value: state,
  label: AI_ORB_NAMES[state],
}))
const SIZE_OPTIONS = [
  { value: "sm", label: "20px" },
  { value: "md", label: "32px" },
  { value: "lg", label: "64px" },
]
const PRESENTATIONS = [
  { value: "badge", label: "Status badge" },
  { value: "inline", label: "Inline status" },
  { value: "orb", label: "Orb only" },
]
const PRESETS = [
  ...orbStudioPresets.map((p) => ({ value: p.name, label: p.name })),
  { value: "Custom", label: "Custom" },
]

export function ThinkingOrbsStudio(): ReactElement {
  const searchParams = useSearchParams()
  const look = orbStudioLook(
    searchParams.get("state"),
    searchParams.get("variant")
  )
  return (
    <OrbStudioEditor
      key={`${look.state}:${look.variant ?? "default"}`}
      initialLook={look}
    />
  )
}

function OrbStudioEditor({
  initialLook,
}: {
  initialLook: AiOrbLook
}): ReactElement {
  const [settings, setSettings] = useState<OrbStudioSettings>(() => ({
    ...defaultOrbStudioSettings,
    look: initialLook,
  }))
  const preset =
    orbStudioPresets.find(
      (p) => JSON.stringify(p.settings) === JSON.stringify(settings)
    )?.name ?? "Custom"
  const variants = AI_ORB_VARIANTS[settings.look.state].map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }))
  const code = orbStudioCode(settings)
  const number = (
    key: "speed" | "density" | "dotSize" | "tilt",
    value: number
  ): void => setSettings((current) => ({ ...current, [key]: value }))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <section
          aria-label="Live orb preview"
          data-orb-studio-stage
          className="flex min-h-[340px] min-w-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#171717] p-5 sm:min-h-[460px] xl:sticky xl:top-6"
        >
          <OrbUseCase
            {...settings.look}
            size={settings.size}
            speed={settings.speed}
            density={settings.density}
            dotSize={settings.dotSize}
            tilt={settings.tilt}
            presentation={settings.presentation}
          />
        </section>
        <aside
          aria-label="Orb settings"
          className="flex min-w-0 flex-col gap-6 rounded-[20px] bg-[#1b1b1b] p-5 shadow-(--site-ring)"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Customize</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reset orb settings"
              onClick={() => setSettings(defaultOrbStudioSettings)}
            >
              <RotateCcw />
            </Button>
          </div>
          <Choice
            label="Preset"
            value={preset}
            options={PRESETS}
            onChange={(value) => {
              const found = orbStudioPresets.find((p) => p.name === value)
              if (found) setSettings(found.settings)
            }}
          />
          <Choice
            label="State"
            value={settings.look.state}
            options={STATE_OPTIONS}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                look: { state: value as AiOrbState },
              }))
            }
          />
          <Choice
            label="Variant"
            value={settings.look.variant ?? "default"}
            options={variants}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                look: {
                  state: current.look.state,
                  variant: value,
                } as AiOrbLook,
              }))
            }
          />
          <Choice
            label="Use case"
            value={settings.presentation}
            options={PRESENTATIONS}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                presentation: value as OrbPresentation,
              }))
            }
          />
          <Choice
            label="Size"
            value={settings.size}
            options={SIZE_OPTIONS}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                size: value as OrbStudioSettings["size"],
              }))
            }
          />
          <Range
            label="Speed"
            value={settings.speed}
            min={0.25}
            max={2}
            step={0.05}
            suffix="×"
            onChange={(value) => number("speed", value)}
          />
          <Range
            label="Density"
            value={settings.density}
            min={0.5}
            max={1.5}
            step={0.1}
            suffix="×"
            onChange={(value) => number("density", value)}
          />
          <Range
            label="Dot size"
            value={settings.dotSize}
            min={0.6}
            max={1.6}
            step={0.05}
            suffix="×"
            onChange={(value) => number("dotSize", value)}
          />
          <Range
            label="Tilt"
            value={settings.tilt}
            min={-30}
            max={60}
            step={1}
            suffix="°"
            onChange={(value) => number("tilt", value)}
          />
        </aside>
      </div>
      <section
        aria-label="Generated orb code"
        className="min-w-0 rounded-[20px] bg-[#171717] p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-medium">Your component</h2>
          <CopyButton key={code} text={code} label="Copy code" />
        </div>
        <pre
          tabIndex={0}
          aria-label="Orb source code"
          className="overflow-x-auto rounded-xl bg-[#111] p-4 font-mono text-xs leading-5 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <code>{code}</code>
        </pre>
      </section>
    </div>
  )
}
