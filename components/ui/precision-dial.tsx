"use client"

import {
  useId,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react"
import { motion, useReducedMotion } from "motion/react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { dialFraction, snapValue } from "@/lib/precision-controls"

export type PrecisionDialProps = {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  disabled?: boolean
  className?: string
}

export function PrecisionDial({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label = "Intensity",
  unit = "%",
  disabled = false,
  className,
}: PrecisionDialProps): ReactElement {
  const id = useId().replace(/:/g, "")
  const reduced = useReducedMotion()
  const current = snapValue(value, min, max, step)
  const fraction = max > min ? (current - min) / (max - min) : 0
  const angle = -135 + fraction * 270
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(current))

  function move(event: PointerEvent<HTMLDivElement>): void {
    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId))
      return
    const bounds = event.currentTarget.getBoundingClientRect()
    onValueChange(
      snapValue(
        min +
          dialFraction(
            event.clientX - bounds.left - bounds.width / 2,
            event.clientY - bounds.top - bounds.height / 2
          ) *
            (max - min),
        min,
        max,
        step
      )
    )
  }

  function key(event: KeyboardEvent<HTMLDivElement>): void {
    if (disabled) return
    const changes: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    }
    if (event.key === "Home" || event.key === "End" || event.key in changes) {
      event.preventDefault()
      onValueChange(
        snapValue(
          event.key === "Home"
            ? min
            : event.key === "End"
              ? max
              : current + changes[event.key],
          min,
          max,
          step
        )
      )
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5",
        disabled && "opacity-50",
        className
      )}
    >
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${current}${unit}`}
        aria-disabled={disabled}
        className="relative size-56 touch-none rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        onKeyDown={key}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return
          event.currentTarget.focus()
          event.currentTarget.setPointerCapture(event.pointerId)
          move(event)
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
      >
        <svg viewBox="0 0 224 224" className="size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.8" y2="1">
              <stop stopColor="#393939" />
              <stop offset="0.48" stopColor="#222" />
              <stop offset="1" stopColor="#191919" />
            </linearGradient>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#737373" />
              <stop offset="0.5" stopColor="#292929" />
              <stop offset="1" stopColor="#454545" />
            </linearGradient>
          </defs>
          {Array.from({ length: 49 }, (_, index) => (
            <line
              key={index}
              x1="112"
              y1={index % 4 === 0 ? 11 : 15}
              x2="112"
              y2="21"
              stroke={index / 48 <= fraction ? "#c7c7c7" : "#343434"}
              strokeWidth={index % 4 === 0 ? 1.6 : 1}
              strokeLinecap="round"
              transform={`rotate(${-135 + (index / 48) * 270} 112 112)`}
            />
          ))}
          <circle cx="112" cy="115" r="77" fill="#090909" opacity=".65" />
          <circle
            cx="112"
            cy="112"
            r="77"
            fill={`url(#${id}-body)`}
            stroke={`url(#${id}-rim)`}
          />
          <circle
            cx="112"
            cy="112"
            r="71"
            fill="none"
            stroke="#fff"
            strokeOpacity=".025"
          />
          <motion.g
            animate={{ rotate: angle }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 700, damping: 55 }
            }
            // Override Motion's fill-box default so the indicator turns around the dial center.
            className="origin-center [transform-box:view-box]!"
          >
            <line
              x1="112"
              y1="51"
              x2="112"
              y2="64"
              stroke="#eee"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </motion.g>
          <text
            x="112"
            y="119"
            textAnchor="middle"
            fill="#ededed"
            className="font-mono text-[27px] tracking-[-1px]"
          >
            {current}
            <tspan className="text-[12px]" fill="#888">
              {unit}
            </tspan>
          </text>
          <text
            x="112"
            y="142"
            textAnchor="middle"
            fill="#858585"
            className="text-[10px]"
          >
            {label}
          </text>
        </svg>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <label htmlFor={`${id}-value`}>Exact value</label>
        <Input
          id={`${id}-value`}
          aria-label={`${label} exact value`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={editing ? draft : current}
          onFocus={() => {
            setDraft(String(current))
            setEditing(true)
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            setEditing(true)
          }}
          onBlur={() => {
            if (draft.trim() !== "" && Number.isFinite(Number(draft)))
              onValueChange(snapValue(Number(draft), min, max, step))
            setEditing(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              setDraft(String(current))
              setEditing(false)
            }
          }}
          className="w-20 text-center font-mono"
        />
      </div>
    </div>
  )
}
