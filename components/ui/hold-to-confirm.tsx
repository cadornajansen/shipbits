"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react"
import { Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type HoldToConfirmProps = {
  onConfirm: () => void
  label?: string
  confirmedLabel?: string
  holdMs?: number
  disabled?: boolean
  className?: string
}

export function HoldToConfirm({
  onConfirm,
  label = "Hold to archive",
  confirmedLabel = "Archived",
  holdMs = 1200,
  disabled = false,
  className,
}: HoldToConfirmProps): ReactElement {
  const progress = useMotionValue(0)
  const width = useTransform(progress, [0, 1], ["0%", "100%"])
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const active = useRef(false)
  const confirmed = useRef(false)
  const [holding, setHolding] = useState(false)
  const [complete, setComplete] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const reduced = useReducedMotion()
  const duration = Number.isFinite(holdMs) ? Math.max(300, holdMs) : 1200

  const cancel = useCallback((): void => {
    if (!active.current) return
    active.current = false
    controls.current?.stop()
    progress.set(0)
    setHolding(false)
  }, [progress])

  useEffect(() => {
    const leave = (): void => {
      if (document.hidden) cancel()
    }
    window.addEventListener("blur", cancel)
    document.addEventListener("visibilitychange", leave)
    return () => {
      controls.current?.stop()
      window.removeEventListener("blur", cancel)
      document.removeEventListener("visibilitychange", leave)
    }
  }, [cancel])
  useEffect(() => {
    if (disabled) cancel()
  }, [disabled, cancel])

  function finish(): void {
    if (confirmed.current || disabled) return
    confirmed.current = true
    active.current = false
    controls.current?.stop()
    progress.set(1)
    setHolding(false)
    setComplete(true)
    setDialogOpen(false)
    onConfirm()
  }

  function start(): void {
    if (active.current || confirmed.current || disabled) return
    active.current = true
    setHolding(true)
    controls.current = animate(progress, 1, {
      duration: duration / 1000,
      ease: "linear",
      onComplete: finish,
    })
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <button
        type="button"
        disabled={disabled || complete}
        aria-label={
          complete
            ? confirmedLabel
            : `${label}. Hold for ${duration / 1000} seconds, or use the confirmation dialog below.`
        }
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return
          event.preventDefault()
          event.currentTarget.focus()
          event.currentTarget.setPointerCapture(event.pointerId)
          start()
        }}
        onPointerUp={cancel}
        onPointerMove={(event) => {
          if (!active.current) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            cancel()
        }}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onPointerLeave={cancel}
        onBlur={cancel}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault()
            if (!event.repeat) start()
          }
          if (event.key === "Escape") cancel()
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault()
            cancel()
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
        className="relative flex h-14 min-w-56 touch-none items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-6 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60"
      >
        <motion.span
          aria-hidden
          style={{ width }}
          className="absolute inset-y-0 left-0 bg-foreground/10"
        />
        <motion.span
          animate={{ scale: holding && !reduced ? 0.9 : 1 }}
          className="relative"
        >
          {complete ? (
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
              <motion.path
                d="m5 12 4 4L19 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduced ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduced ? 0 : 0.22 }}
              />
            </svg>
          ) : (
            <Fingerprint className="size-5 text-muted-foreground" />
          )}
        </motion.span>
        <span className="relative">
          {complete ? confirmedLabel : holding ? "Keep holding…" : label}
        </span>
      </button>
      <span role="status" className="sr-only">
        {complete
          ? confirmedLabel
          : holding
            ? "Confirmation in progress"
            : "Ready"}
      </span>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button variant="link" size="sm" disabled={disabled || complete} />
          }
        >
          Confirm without holding
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm this action?</DialogTitle>
            <DialogDescription>
              You can confirm with a single click instead of holding the button.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={finish}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
