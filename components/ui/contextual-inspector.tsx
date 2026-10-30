"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, X } from "lucide-react"
import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface InspectorItem {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  metadata: readonly { label: string; value: string }[]
  actionLabel?: string
  onAction?: () => void
}

export interface ContextualInspectorProps {
  items: readonly InspectorItem[]
  label?: string
  onSelect?: (id: string | null) => void
  className?: string
}

function subscribeMobile(callback: () => void): () => void {
  const media = window.matchMedia("(max-width: 639px)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}
const mobileSnapshot = () => window.matchMedia("(max-width: 639px)").matches
const desktopSnapshot = () => false

export function ContextualInspector({
  items,
  label = "Project files",
  onSelect,
  className,
}: ContextualInspectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const mobile = useSyncExternalStore(
    subscribeMobile,
    mobileSnapshot,
    desktopSnapshot
  )
  const reduced = useReducedMotion()
  const panelId = useId()

  function close() {
    setSelectedId(null)
    onSelect?.(null)
    trigger.current?.focus({ preventScroll: true })
  }

  return (
    <div
      className={cn("flex w-full max-w-2xl items-start gap-3", className)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && selected) {
          event.preventDefault()
          close()
        }
      }}
    >
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-2">
        <p className="px-3 pt-2 pb-3 text-xs text-muted-foreground">{label}</p>
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-expanded={selectedId === item.id}
              aria-controls={
                selectedId === item.id && !mobile ? panelId : undefined
              }
              aria-haspopup={mobile ? "dialog" : undefined}
              onClick={(event) => {
                trigger.current = event.currentTarget
                setSelectedId(item.id)
                onSelect?.(item.id)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedId === item.id ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground [&_svg]:size-4">
                {item.icon ?? <ArrowUpRight aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                  {item.subtitle}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {!mobile && (
        <AnimatePresence initial={false}>
          {selected && (
            <motion.aside
              id={panelId}
              key="inspector"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                duration: reduced ? 0 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="shrink-0 overflow-hidden"
              aria-label={`${selected.title} details`}
            >
              <div className="w-[220px] rounded-2xl border border-border bg-card p-4">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">File details</p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close inspector"
                    onClick={close}
                  >
                    <X />
                  </Button>
                </div>
                <InspectorDetails item={selected} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      )}
      {mobile && (
        <Dialog
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) close()
          }}
        >
          <DialogContent
            finalFocus={trigger}
            className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none p-6 motion-reduce:animate-none"
          >
            <DialogTitle>{selected?.title ?? "File details"}</DialogTitle>
            <DialogDescription className="sr-only">
              Metadata and actions for the selected file.
            </DialogDescription>
            {selected && <InspectorDetails item={selected} hideTitle />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function InspectorDetails({
  item,
  hideTitle = false,
}: {
  item: InspectorItem
  hideTitle?: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      {!hideTitle && (
        <p className="truncate text-sm font-medium">{item.title}</p>
      )}
      <dl className="flex flex-col gap-3">
        {item.metadata.map((entry) => (
          <div key={entry.label} className="flex justify-between gap-4 text-xs">
            <dt className="text-muted-foreground">{entry.label}</dt>
            <dd className="text-right">{entry.value}</dd>
          </div>
        ))}
      </dl>
      {item.onAction && (
        <Button variant="outline" size="sm" onClick={item.onAction}>
          {item.actionLabel ?? "Open file"}
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      )}
    </div>
  )
}
