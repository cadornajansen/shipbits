"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, RotateCcw, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonoIcon } from "@/components/ui/mono-icon"
import { cn } from "@/lib/utils"
import { validateIntakeFile } from "@/lib/precision-controls"

export type FileIntakeUpload = (
  file: File,
  options: { signal: AbortSignal; onProgress: (percent: number) => void }
) => Promise<void>
export type FileIntakeProps = {
  accept?: string
  maxBytes?: number
  maxFiles?: number
  onUpload?: FileIntakeUpload
  onFilesChange?: (files: readonly File[]) => void
  className?: string
}
type IntakeItem = {
  id: string
  file: File
  url?: string
  status: "selected" | "uploading" | "complete" | "error"
  progress: number
  error?: string
}

export function FileIntake({
  accept = "image/png,image/jpeg,image/webp,application/pdf",
  maxBytes = 10 * 1024 * 1024,
  maxFiles = 3,
  onUpload,
  onFilesChange,
  className,
}: FileIntakeProps): ReactElement {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<IntakeItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState("")
  const resources = useRef(
    new Map<string, { url?: string; controller?: AbortController }>()
  )
  const reduced = useReducedMotion()
  useEffect(() => {
    const owned = resources.current
    return () => {
      for (const resource of owned.values()) {
        resource.controller?.abort()
        if (resource.url) URL.revokeObjectURL(resource.url)
      }
      owned.clear()
    }
  }, [])

  async function upload(item: IntakeItem): Promise<void> {
    if (!onUpload) return
    const controller = new AbortController()
    resources.current.get(item.id)?.controller?.abort()
    resources.current.set(item.id, { url: item.url, controller })
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "uploading", error: undefined, progress: 0 }
          : entry
      )
    )
    try {
      await onUpload(item.file, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (!controller.signal.aborted && Number.isFinite(percent))
            setItems((current) =>
              current.map((entry) =>
                entry.id === item.id
                  ? { ...entry, progress: Math.max(0, Math.min(100, percent)) }
                  : entry
              )
            )
        },
      })
      if (!controller.signal.aborted)
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: "complete", progress: 100 }
              : entry
          )
        )
    } catch (error) {
      if (!controller.signal.aborted)
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Upload failed. Try again.",
                }
              : entry
          )
        )
    }
  }

  function add(files: File[]): void {
    const available = Math.max(0, maxFiles - items.length)
    const known = new Set(
      items.map(
        (item) =>
          `${item.file.name}:${item.file.size}:${item.file.lastModified}`
      )
    )
    const unique = files.filter((file) => {
      const identity = `${file.name}:${file.size}:${file.lastModified}`
      if (known.has(identity)) return false
      known.add(identity)
      return true
    })
    setNotice(
      unique.length > available
        ? `Choose up to ${maxFiles} files. Remove one to add another.`
        : ""
    )
    const incoming = unique.slice(0, available).map((file): IntakeItem => {
      const error = validateIntakeFile(file, accept, maxBytes)
      const item: IntakeItem = {
        id: crypto.randomUUID(),
        file,
        status: error ? "error" : "selected",
        error,
        progress: 0,
        url:
          !error && file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
      }
      resources.current.set(item.id, { url: item.url })
      return item
    })
    const next = [...items, ...incoming]
    setItems(next)
    onFilesChange?.(
      next
        .filter((item) => !validateIntakeFile(item.file, accept, maxBytes))
        .map((item) => item.file)
    )
    for (const item of incoming) if (!item.error) void upload(item)
  }

  function remove(item: IntakeItem): void {
    const resource = resources.current.get(item.id)
    resource?.controller?.abort()
    if (resource?.url) URL.revokeObjectURL(resource.url)
    resources.current.delete(item.id)
    const next = items.filter((entry) => entry.id !== item.id)
    setItems(next)
    setNotice("")
    onFilesChange?.(
      next
        .filter((entry) => !validateIntakeFile(entry.file, accept, maxBytes))
        .map((entry) => entry.file)
    )
  }

  function drop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setDragging(false)
    add(Array.from(event.dataTransfer.files))
  }

  return (
    <div className={cn("flex w-full max-w-md flex-col gap-3", className)}>
      <motion.div
        animate={{
          borderColor: dragging ? "#aaa" : "#333",
          backgroundColor: dragging ? "#242424" : "#1b1b1b",
        }}
        transition={{ duration: reduced ? 0 : 0.2 }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false)
        }}
        onDrop={drop}
        className="relative flex min-h-52 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-5 py-8"
      >
        <motion.div
          animate={{
            y: dragging && !reduced ? -6 : 0,
            rotate: dragging && !reduced ? -5 : 0,
          }}
          className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-lg"
        >
          <MonoIcon name="folder" width={38} height={38} />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" onClick={() => input.current?.click()}>
            <Upload data-icon="inline-start" />
            Choose files
          </Button>
          <p className="text-xs text-muted-foreground">
            or drop them here · {Math.round(maxBytes / 1024 / 1024)} MB each
          </p>
        </div>
        <input
          ref={input}
          id={inputId}
          className="sr-only"
          tabIndex={-1}
          type="file"
          aria-label="Choose files"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(event) => {
            add(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </motion.div>
      <div
        role="status"
        aria-live="polite"
        className={cn("text-xs text-muted-foreground", !notice && "sr-only")}
      >
        {notice ||
          (items.length
            ? `${items.length} ${items.length === 1 ? "file" : "files"} selected${onUpload ? "" : ", kept on this device"}.`
            : "No files selected")}
      </div>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-3 p-3">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
                  {item.url ? (
                    // Object URLs are local user files, not remote assets to optimize.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <MonoIcon name="book" width={26} height={26} />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-xs font-medium">
                    {item.file.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.status === "error"
                      ? item.error
                      : item.status === "uploading"
                        ? `Uploading · ${Math.round(item.progress)}%`
                        : item.status === "complete"
                          ? "Uploaded"
                          : `${Math.max(1, Math.round(item.file.size / 1024))} KB · Local preview`}
                  </span>
                </div>
                {item.status === "complete" && (
                  <Check
                    className="size-4 text-muted-foreground"
                    aria-label="Upload complete"
                  />
                )}
                {item.status === "error" &&
                  onUpload &&
                  !validateIntakeFile(item.file, accept, maxBytes) && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Retry ${item.file.name}`}
                      onClick={() => void upload(item)}
                    >
                      <RotateCcw />
                    </Button>
                  )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => remove(item)}
                >
                  <X />
                </Button>
              </div>
              {item.status === "uploading" && (
                <div
                  role="progressbar"
                  aria-label={`Uploading ${item.file.name}`}
                  aria-valuenow={Math.round(item.progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-0.5 bg-muted"
                >
                  <motion.div
                    animate={{ scaleX: item.progress / 100 }}
                    initial={{ scaleX: 0 }}
                    transition={{ duration: reduced ? 0 : 0.15 }}
                    className="h-full origin-left bg-foreground"
                  />
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
