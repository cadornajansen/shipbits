"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import {
  ActivityCapsule,
  type ActivityStatus,
  type ActivityStep,
} from "@/components/ui/activity-capsule"
import { Button } from "@/components/ui/button"

const LABELS = [
  "Read theme colors",
  "Collect typography",
  "Package token manifest",
]

export function ActivityCapsuleExample(): ReactElement {
  const [status, setStatus] = useState<ActivityStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const downloads = useRef(new Set<string>())
  const manifest = useRef("")
  useEffect(() => {
    const urls = downloads.current
    return () => {
      timers.current.forEach(clearTimeout)
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  function start(): void {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setOpen(true)
    setProgress(0)
    setStatus("running")
    const styles = getComputedStyle(document.documentElement)
    manifest.current = JSON.stringify(
      {
        name: "Shipbits theme",
        colors: Object.fromEntries(
          ["background", "foreground", "primary", "muted", "border"].map(
            (token) => [token, styles.getPropertyValue(`--${token}`).trim()]
          )
        ),
        typography: {
          sans: styles.getPropertyValue("--font-sans").trim(),
          heading: styles.getPropertyValue("--font-heading").trim(),
        },
      },
      null,
      2
    )
    // This is a local export; the short sequence makes the completed steps readable.
    ;[34, 68, 100].forEach((value, index) => {
      timers.current.push(
        setTimeout(
          () => {
            setProgress(value)
            if (value === 100) setStatus("complete")
          },
          (index + 1) * 650
        )
      )
    })
  }
  function download(): void {
    const url = URL.createObjectURL(
      new Blob([manifest.current], { type: "application/json" })
    )
    const link = document.createElement("a")
    downloads.current.add(url)
    link.href = url
    link.download = "shipbits-tokens.json"
    link.click()
    setTimeout(() => {
      URL.revokeObjectURL(url)
      downloads.current.delete(url)
    }, 1000)
  }
  const steps: ActivityStep[] = LABELS.map((label, index) => ({
    id: label,
    label,
    status:
      progress >= (index + 1) * 33
        ? "complete"
        : status === "running" && progress >= index * 33
          ? "running"
          : "pending",
  }))
  return (
    <div className="flex w-full flex-col items-center justify-center gap-8">
      <ActivityCapsule
        title="Design token export"
        status={status}
        progress={progress}
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        result={
          status === "complete"
            ? "shipbits-tokens.json · Generated locally"
            : undefined
        }
        actionLabel={
          status === "complete"
            ? "Download manifest"
            : status === "idle"
              ? "Export tokens"
              : undefined
        }
        onAction={status === "complete" ? download : start}
      />
      <Button
        variant="outline"
        className="rounded-full"
        onClick={start}
        disabled={status === "running"}
      >
        {status === "complete" ? "Export again" : "Export tokens"}
      </Button>
    </div>
  )
}
