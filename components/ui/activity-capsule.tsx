"use client"

import { useId, useState, type ReactElement, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown, Circle, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ActivityStatus = "idle" | "running" | "complete" | "error"
export type ActivityStep = {
  id: string
  label: string
  status: "pending" | "running" | "complete"
}
export type ActivityCapsuleProps = {
  title: string
  status: ActivityStatus
  progress?: number
  steps?: readonly ActivityStep[]
  result?: ReactNode
  actionLabel?: string
  onAction?: () => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/** The application owns the task; this disclosure only presents its progress. */
export function ActivityCapsule({
  title,
  status,
  progress = 0,
  steps = [],
  result,
  actionLabel,
  onAction,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: ActivityCapsuleProps): ReactElement {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const expanded = open ?? internalOpen
  const panelId = useId()
  const reduce = useReducedMotion()
  const amount = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, progress))
    : 0
  const transition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 330, damping: 32 }
  function toggle(): void {
    setInternalOpen(!expanded)
    onOpenChange?.(!expanded)
  }
  return (
    <motion.div
      data-slot="activity-capsule"
      initial={false}
      animate={{
        width: expanded ? 360 : 272,
        borderRadius: expanded ? 24 : 32,
      }}
      transition={transition}
      className={cn(
        "max-w-full overflow-hidden border border-white/10 bg-[#202020] text-foreground shadow-[0_16px_48px_-24px_#000,inset_0_1px_0_#ffffff0a]",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className="flex min-h-16 w-full items-center gap-3 rounded-[inherit] px-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span
          className="relative flex size-8 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {status === "complete" ? (
            <Check className="size-5" />
          ) : status === "error" ? (
            <TriangleAlert className="size-5" />
          ) : (
            <svg viewBox="0 0 32 32" className="size-8 -rotate-90 fill-none">
              <circle
                cx="16"
                cy="16"
                r="12"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity=".15"
              />
              <motion.circle
                cx="16"
                cy="16"
                r="12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                initial={false}
                animate={{
                  strokeDashoffset:
                    1 - (status === "idle" ? 0.07 : amount / 100),
                }}
                transition={transition}
              />
              <circle cx="16" cy="16" r="3" fill="currentColor" opacity=".8" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">
            {title}
          </span>
          <span
            className="block text-[11px] text-muted-foreground"
            role="status"
          >
            {status === "idle"
              ? "Ready when you are"
              : status === "running"
                ? "In progress"
                : status === "complete"
                  ? "Completed"
                  : "Something needs attention"}
          </span>
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={transition}
          aria-hidden="true"
        >
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            inert={!expanded}
          >
            <div className="flex flex-col gap-5 px-5 pb-5">
              <div className="h-px bg-white/8" />
              <ol className="flex flex-col gap-3" aria-label="Task steps">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-3 text-xs">
                    {step.status === "complete" ? (
                      <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle
                        className={cn(
                          "size-3.5 shrink-0",
                          step.status === "running"
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        "flex-1",
                        step.status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="sr-only">{step.status}</span>
                  </li>
                ))}
              </ol>
              {status === "running" && (
                <div
                  role="progressbar"
                  aria-label={title}
                  aria-valuenow={Math.round(amount)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1 overflow-hidden rounded-full bg-white/10"
                >
                  <motion.div
                    className="h-full origin-left rounded-full bg-foreground"
                    initial={false}
                    animate={{ scaleX: amount / 100 }}
                    transition={transition}
                  />
                </div>
              )}
              {result && (
                <div className="rounded-xl border border-white/5 bg-background/40 p-3 text-xs text-muted-foreground">
                  {result}
                </div>
              )}
              {actionLabel && onAction && (
                <Button
                  variant="secondary"
                  className="w-full rounded-full"
                  onClick={onAction}
                >
                  {actionLabel}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
