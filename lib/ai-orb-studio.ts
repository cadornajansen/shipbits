import {
  AI_ORB_VARIANTS,
  type AiOrbLook,
  type AiOrbState,
} from "./ai-orb-frames"

export function orbStudioLook(
  state: string | null,
  variant: string | null
): AiOrbLook {
  if (!state || !Object.hasOwn(AI_ORB_VARIANTS, state))
    return { state: "orchestrating" }
  const validState = state as AiOrbState
  const variants: readonly string[] = AI_ORB_VARIANTS[validState]
  if (!variant || variant === "default" || !variants.includes(variant))
    return { state: validState }
  return {
    state: validState,
    variant,
  } as AiOrbLook
}

export type OrbPresentation = "badge" | "inline" | "orb"
export type OrbStudioSettings = {
  look: AiOrbLook
  size: "sm" | "md" | "lg"
  speed: number
  density: number
  dotSize: number
  tilt: number
  presentation: OrbPresentation
}
export const defaultOrbStudioSettings: OrbStudioSettings = {
  look: { state: "orchestrating" },
  size: "lg",
  speed: 1,
  density: 1,
  dotSize: 1,
  tilt: 12,
  presentation: "badge",
}
export const orbStudioPresets: readonly {
  name: string
  settings: OrbStudioSettings
}[] = [
  { name: "Coordinated", settings: defaultOrbStudioSettings },
  {
    name: "Focused",
    settings: {
      ...defaultOrbStudioSettings,
      look: { state: "reasoning", variant: "twins" },
      density: 1.2,
      dotSize: 0.8,
    },
  },
  {
    name: "Gyroscope",
    settings: {
      ...defaultOrbStudioSettings,
      look: { state: "working", variant: "gyro" },
      speed: 0.75,
      tilt: 20,
    },
  },
  {
    name: "Quiet",
    settings: {
      ...defaultOrbStudioSettings,
      look: { state: "background" },
      size: "md",
      speed: 0.5,
      presentation: "inline",
    },
  },
]
export function orbStudioCode(settings: OrbStudioSettings): string {
  const { look, presentation, ...appearance } = settings
  const props = JSON.stringify(
    {
      state: look.state,
      ...(look.variant ? { variant: look.variant } : {}),
      ...appearance,
    },
    null,
    2
  )
  const badgeImport =
    presentation === "badge"
      ? '\nimport { Badge } from "@/components/ui/badge"'
      : ""
  const label =
    look.state === "orchestrating"
      ? "Coordinating tasks…"
      : look.state === "error"
        ? "Needs attention"
        : look.state === "base" || look.state === "idle"
          ? "Ready"
          : look.state.charAt(0).toUpperCase() + look.state.slice(1) + "…"
  const markup =
    presentation === "orb"
      ? "<AiOrb {...orb} />"
      : presentation === "badge"
        ? '<Badge variant="secondary" className="h-auto max-w-full gap-3 rounded-full border-white/5 bg-[#1b1b1b] px-4 py-2 font-normal text-muted-foreground">\n      <AiOrb {...orb} decorative />\n      <span className="' +
          (settings.size === "lg"
            ? "min-w-0 text-left text-lg whitespace-normal tracking-[-.2px]"
            : "min-w-0 text-left text-[13px] whitespace-normal") +
          '">' +
          label +
          "</span>\n    </Badge>"
        : '<span className="inline-flex max-w-full items-center gap-3 text-[13px] text-muted-foreground">\n      <AiOrb {...orb} decorative />\n      <span>' +
          label +
          "</span>\n    </span>"
  return (
    'import { AiOrb, type AiOrbProps } from "@/components/ui/ai-orb"' +
    badgeImport +
    "\n\nconst orb = " +
    props +
    " satisfies AiOrbProps\n\nexport function Example() {\n  return (\n    " +
    markup +
    "\n  )\n}"
  )
}
