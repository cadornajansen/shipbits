"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ChannelStatus } from "@/features/distribution/types"

const labels: Record<string, string> = {
  product_type: "Product types",
  category: "Categories",
  audience: "Audiences",
  platform: "Platforms",
  region: "Regions",
  saas: "SaaS",
  "ai-tool": "AI tool",
  "developer-tool": "Developer tool",
  "b2b-software": "B2B software",
  api: "API",
  ios: "iOS",
  macos: "macOS",
  add_tag: "Add tag",
  remove_tag: "Remove tag",
  review_site: "Review site",
}
export function displayLabel(value: string): string {
  return (
    labels[value] ??
    value
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/^./, (letter) => letter.toUpperCase())
  )
}
export function StatusDot({ status }: { status: ChannelStatus }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full bg-muted-foreground/50",
        status === "active" && "bg-emerald-600",
        status === "broken" && "bg-destructive",
        status === "rejected" && "bg-destructive/60",
        status === "stale" && "bg-amber-500"
      )}
    />
  )
}

export function DistributionSelect({
  id,
  name,
  label,
  options,
  value,
  defaultValue = "",
  emptyLabel,
  onValueChange,
  disabled,
  className,
  compact = false,
  quiet = false,
  status = false,
  optionLabels,
}: {
  id?: string
  name?: string
  label: string
  options: readonly string[]
  value?: string
  defaultValue?: string
  emptyLabel?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  compact?: boolean
  quiet?: boolean
  status?: boolean
  optionLabels?: Record<string, string>
}) {
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <Select
        value={current || "__empty"}
        onValueChange={(next) => {
          const nextValue = next === "__empty" ? "" : next
          setInternal(nextValue)
          onValueChange?.(nextValue)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-label={label}
          size={compact ? "sm" : "default"}
          className={cn(
            "w-full",
            quiet &&
              "border-transparent bg-transparent shadow-none hover:bg-muted focus-visible:border-ring data-[state=open]:bg-muted [&>svg]:text-muted-foreground/50",
            className
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="max-h-72">
          <SelectGroup>
            {emptyLabel && (
              <SelectItem value="__empty">{emptyLabel}</SelectItem>
            )}
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {status && <StatusDot status={option as ChannelStatus} />}
                <span className="truncate">
                  {optionLabels?.[option] ?? displayLabel(option)}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

export function UnknownCheckbox({
  name,
  label,
  defaultValue,
  disabled,
  onDirty,
}: {
  name: string
  label: string
  defaultValue: boolean | null
  disabled?: boolean
  onDirty?: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <Field orientation="horizontal" className="min-h-9 gap-2">
      <input
        type="hidden"
        name={name}
        value={value === null ? "unknown" : String(value)}
      />
      <Checkbox
        id={name}
        className={
          value === null
            ? "before:absolute before:h-px before:w-2 before:bg-muted-foreground [&_svg]:invisible"
            : undefined
        }
        checked={value === null ? "indeterminate" : value}
        disabled={disabled}
        onCheckedChange={(checked) => {
          setValue(checked === true)
          onDirty?.()
        }}
        aria-describedby={name + "-state"}
      />
      <FieldLabel htmlFor={name} className="flex-1 font-normal">
        {label}
      </FieldLabel>
      <span id={name + "-state"} className="text-xs text-muted-foreground">
        {value === null ? "Unknown" : value ? "Yes" : "No"}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || value === null}
            aria-label={"Reset " + label.toLowerCase() + " to unknown"}
            onClick={() => {
              setValue(null)
              onDirty?.()
            }}
          >
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset to unknown</TooltipContent>
      </Tooltip>
    </Field>
  )
}
