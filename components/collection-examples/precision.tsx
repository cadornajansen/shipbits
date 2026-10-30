"use client"

import { useState, type ReactElement } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ContextToolbar,
  type ContextTool,
} from "@/components/ui/context-toolbar"
import { FileIntake } from "@/components/ui/file-intake"
import { HoldToConfirm } from "@/components/ui/hold-to-confirm"
import { MonoIcon } from "@/components/ui/mono-icon"
import { PrecisionCounter } from "@/components/ui/precision-counter"
import { PrecisionDial } from "@/components/ui/precision-dial"
import { cn } from "@/lib/utils"

export function PrecisionDialExample(): ReactElement {
  const [value, setValue] = useState(64)
  return <PrecisionDial value={value} onValueChange={setValue} label="Light" />
}

const alignmentTools: readonly ContextTool[] = [
  { id: "left", label: "Left", icon: AlignLeft },
  { id: "center", label: "Center", icon: AlignCenter },
  { id: "right", label: "Right", icon: AlignRight },
]

export function ContextToolbarExample(): ReactElement {
  const [alignment, setAlignment] = useState("left")
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <div
        className={cn(
          "flex w-full flex-col gap-4 rounded-2xl border border-border bg-background p-7",
          alignment === "center"
            ? "text-center"
            : alignment === "right"
              ? "text-right"
              : "text-left"
        )}
      >
        <span className="text-[10px] tracking-[.2em] text-muted-foreground uppercase">
          Field notes · 001
        </span>
        <p className="font-heading text-2xl leading-tight tracking-tight">
          Make space
          <br />
          for a good idea.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Start with what matters.
          <br />
          Let the details follow.
        </p>
      </div>
      <ContextToolbar
        tools={alignmentTools}
        value={alignment}
        onValueChange={setAlignment}
        label="Text alignment"
      />
    </div>
  )
}

export function FileIntakeExample(): ReactElement {
  return <FileIntake />
}

export function PrecisionCounterExample(): ReactElement {
  const [value, setValue] = useState(128.64)
  return (
    <div className="flex w-full max-w-sm flex-col gap-7 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Storage used</span>
        <span className="size-1.5 rounded-full bg-foreground/60" aria-hidden />
      </div>
      <PrecisionCounter
        value={value}
        suffix="GB"
        minDigits={6}
        className="self-start text-[34px] sm:text-[40px]"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Remove one gigabyte"
            onClick={() =>
              setValue((current) =>
                Math.max(0, Number((current - 1).toFixed(2)))
              )
            }
          >
            <Minus />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Add one gigabyte"
            onClick={() =>
              setValue((current) => Number((current + 1).toFixed(2)))
            }
          >
            <Plus />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset storage"
          onClick={() => setValue(128.64)}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}

export function HoldToConfirmExample(): ReactElement {
  const [archived, setArchived] = useState(false)
  const [version, setVersion] = useState(0)
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-6">
      <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <MonoIcon name="folder" width={36} height={36} />
        <div className="min-w-0">
          <p className="text-sm font-medium">Autumn collection</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {archived ? "Archived locally" : "12 files · Personal workspace"}
          </p>
        </div>
      </div>
      <HoldToConfirm
        key={version}
        label="Hold to archive"
        onConfirm={() => setArchived(true)}
      />
      {archived && (
        <Button
          variant="outline"
          onClick={() => {
            setArchived(false)
            setVersion((current) => current + 1)
          }}
        >
          Undo archive
        </Button>
      )}
    </div>
  )
}
