"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import { ArrowUpRight, RotateCcw, AudioLines, Check } from "lucide-react"
import {
  AgentCompanion,
  type AgentCompanionState,
  type AgentCompanionShape,
} from "@/components/ui/agent-companion"
import {
  VoiceCapsule,
  type VoiceCapsuleState,
} from "@/components/ui/voice-capsule"
import { ImageGenerationReveal } from "@/components/ui/image-generation-reveal"
import { ImageComparison } from "@/components/ui/image-comparison"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVisibleMediaMotion } from "@/lib/collection-media"
import { cn } from "@/lib/utils"

const agents: readonly {
  name: string
  role: string
  shape: AgentCompanionShape
}[] = [
  { name: "Lavender bot", role: "Research", shape: "lavender-bot" },
  { name: "Orange bot", role: "Planning", shape: "orange-bot" },
  { name: "Pink cat", role: "Writing", shape: "pink-cat" },
  { name: "Lime bloom", role: "Design", shape: "lime-bloom" },
]

export function AgentCompanionsExample(): ReactElement {
  const [states, setStates] = useState<AgentCompanionState[]>(() =>
    agents.map(() => "idle")
  )
  const [assigned, setAssigned] = useState<number | null>(null)

  function setAgentState(index: number, state: AgentCompanionState): void {
    setStates((current) =>
      current.map((value, agentIndex) => (agentIndex === index ? state : value))
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {agents.map((agent, index) => (
          <section
            key={agent.shape}
            data-agent-trigger
            aria-label={agent.name}
            className="group/agent flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/5 bg-[#171717] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.025)] transition-colors duration-200 focus-within:border-white/15 hover:border-white/12 motion-reduce:transition-none"
          >
            <div className="flex h-52 items-center justify-center sm:h-56">
              <div className="flex size-28 items-center justify-center">
                <AgentCompanion
                  shape={agent.shape}
                  state={states[index]}
                  size={112}
                  label={`${agent.name}, ${states[index]}`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 px-5 pb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 font-medium text-[#ededed]">
                    {agent.name}
                  </p>
                  <p className="text-xs leading-5 text-[#777]">
                    {agent.role} assistant
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="h-8 gap-1.5 rounded-full bg-white/5 px-3 text-xs text-[#bdbdbd] hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
                  aria-label={`${assigned === index ? "Assigned to" : "Assign"} ${agent.name}`}
                  onClick={() => {
                    setAssigned(index)
                    setAgentState(index, "working")
                  }}
                >
                  {assigned === index ? (
                    <Check className="size-3.5" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                  {assigned === index ? "Assigned" : "Assign"}
                </Button>
              </div>
              <Tabs
                value={states[index]}
                onValueChange={(value) => {
                  if (
                    value === "idle" ||
                    value === "working" ||
                    value === "sleeping"
                  ) {
                    setAgentState(index, value)
                  }
                }}
              >
                <TabsList
                  aria-label={`${agent.name} state`}
                  className="gap-1 rounded-full bg-transparent p-0"
                >
                  {(
                    [
                      ["idle", "Ready"],
                      ["working", "Working"],
                      ["sleeping", "Resting"],
                    ] as const
                  ).map(([value, label]) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="rounded-full px-3 text-xs text-[#777] data-active:bg-[#292929] data-active:text-[#ddd] dark:data-active:border-transparent dark:data-active:bg-[#292929] dark:data-active:text-[#ddd]"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-xs">
        <p className="font-medium text-[#999]">Product launch</p>
        <p role="status" className="text-[#777]">
          {assigned === null
            ? "Choose an assistant for the brief"
            : `Assigned to ${agents[assigned].name}`}
        </p>
      </div>
    </div>
  )
}

export function VoiceCapsuleExample(): ReactElement {
  const [state, setState] = useState<VoiceCapsuleState>("idle")
  const [level, setLevel] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const active = useVisibleMediaMotion(ref)
  useEffect(() => {
    if (state !== "listening" && state !== "processing") return
    const timer = setTimeout(
      () => setState(state === "listening" ? "processing" : "transcript"),
      state === "listening" ? 2600 : 900
    )
    return () => clearTimeout(timer)
  }, [state])
  useEffect(() => {
    if (!active || state !== "listening") return
    let frame = 0
    let lastFrame = 0
    const tick = (now: number): void => {
      if (now - lastFrame > 70) {
        setLevel(
          0.15 + Math.abs(Math.sin(now / 160) * Math.cos(now / 370)) * 0.75
        )
        lastFrame = now
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, state])
  return (
    <div ref={ref} className="flex w-full max-w-sm flex-col items-center gap-7">
      <VoiceCapsule
        state={state}
        level={level}
        transcript="A quiet place to make something good."
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">Sample audio</Badge>
        <Button
          variant="secondary"
          disabled={state === "listening" || state === "processing"}
          onClick={() => setState("listening")}
        >
          <AudioLines data-icon="inline-start" />
          Try sample
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset voice sample"
          onClick={() => {
            setState("idle")
            setLevel(0)
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}

export function ImageGenerationRevealExample(): ReactElement {
  const [version, setVersion] = useState(0)
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <ImageGenerationReveal
        key={version}
        src="/collection/sierra-refined.svg"
        alt="Original Shipbits illustration of a mountain lake at dusk"
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Sierra study</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Original vector artwork · 720 × 480
          </p>
        </div>
        <Button variant="outline" onClick={() => setVersion(version + 1)}>
          <RotateCcw data-icon="inline-start" />
          Reveal again
        </Button>
      </div>
    </div>
  )
}

export function ImageComparisonExample(): ReactElement {
  const [value, setValue] = useState(50)
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <ImageComparison
        beforeSrc="/collection/sierra-original.svg"
        afterSrc="/collection/sierra-refined.svg"
        alt="Mountain lake, comparing the original and refined color grade"
        value={value}
        onValueChange={setValue}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Sierra study{" "}
          <span className="ml-2 font-mono text-xs tabular-nums">
            {Math.round(value)}%
          </span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className={cn(value === 50 && "invisible")}
          onClick={() => setValue(50)}
        >
          Reset comparison
        </Button>
      </div>
    </div>
  )
}
