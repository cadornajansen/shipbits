"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import { Check, Copy, FileText, AudioLines, X, ChevronDown } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "cn"
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentAction,
} from "../ui/attachment"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../ui/dropdown-menu"
import { avatarPixels } from "./state"
import type { ChatAttachment } from "./types"

export function AgentAvatar({
  seed = "shipbits",
  active = false,
}: {
  seed?: string
  active?: boolean
}): ReactElement {
  const pixels = avatarPixels(seed)
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 25 25"
      className="size-7 shrink-0 rounded-full data-[active=true]:animate-[sb-chat-avatar_6s_ease-in-out_infinite] motion-reduce:animate-none"
      data-active={active}
    >
      {pixels.map((pixel, index) => (
        <rect
          key={index}
          x={(index % 5) * 5}
          y={Math.floor(index / 5) * 5}
          width="5"
          height="5"
          fill={`hsl(${210 + (pixel % 100)} ${45 + (pixel % 25)}% ${32 + (pixel % 45)}%)`}
        />
      ))}
    </svg>
  )
}

export function CopyAction({
  text,
  label = "Copy",
  compact = false,
}: {
  text: string
  label?: string
  compact?: boolean
}): ReactElement {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      if (!mounted.current) return
      setState("copied")
    } catch {
      if (!mounted.current) return
      setState("failed")
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2200)
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-xs" : "sm"}
        title={state === "copied" ? "Copied" : label}
        aria-label={state === "copied" ? "Copied" : label}
        onClick={() => void copy()}
      >
        {state === "copied" ? (
          <Check data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        {!compact && (state === "copied" ? "Copied" : label)}
      </Button>
      <span
        role="status"
        className={state === "failed" ? "text-xs text-destructive" : "sr-only"}
      >
        {state === "failed"
          ? "Copy unavailable. Select the text to copy."
          : state === "copied"
            ? "Copied to clipboard"
            : ""}
      </span>
    </span>
  )
}

export function Choice({
  value,
  label,
  options,
  onChange,
  disabled = false,
}: {
  value: string
  label: string
  options: { id: string; label: string; description?: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button variant="ghost" size="sm" />}
        aria-label={`${label}: ${options.find((item) => item.id === value)?.label ?? value}`}
      >
        {options.find((item) => item.id === value)?.label ?? value}
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="min-w-44 motion-reduce:animate-none! motion-reduce:transition-none! motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!"
      >
        <DropdownMenuGroup aria-label={label}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onChange(option.id)}
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
              {option.id === value && <Check aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AudioPreview({
  attachment,
}: {
  attachment: ChatAttachment
}): ReactElement | null {
  const audio = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    if (!attachment.file || attachment.url) return
    const url = URL.createObjectURL(attachment.file)
    if (audio.current) audio.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [attachment.file, attachment.url])
  return (
    <audio
      ref={audio}
      controls
      preload="metadata"
      src={attachment.url}
      aria-label={`Play ${attachment.name}`}
      className="h-8 w-full min-w-0"
    />
  )
}

export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: ChatAttachment[]
  onRemove?: (id: string) => void
}): ReactElement {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {attachments.map((attachment) => (
        <Attachment
          key={attachment.id}
          size="xs"
          className="max-w-full"
          state="done"
        >
          <AttachmentMedia>
            {attachment.mediaType.startsWith("audio/") ? (
              <AudioLines aria-hidden="true" />
            ) : (
              <FileText aria-hidden="true" />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.name}</AttachmentTitle>
            <AttachmentDescription>
              {attachment.size < 1024 * 1024
                ? `${Math.max(1, Math.round(attachment.size / 1024))} KB`
                : `${(attachment.size / 1024 / 1024).toFixed(1)} MB`}
            </AttachmentDescription>
          </AttachmentContent>
          {onRemove && (
            <AttachmentAction
              type="button"
              aria-label={`Remove ${attachment.name}`}
              onClick={() => onRemove(attachment.id)}
            >
              <X />
            </AttachmentAction>
          )}
          {attachment.mediaType.startsWith("audio/") && (
            <div className="w-full min-w-0 px-2 pb-2">
              <AudioPreview attachment={attachment} />
            </div>
          )}
        </Attachment>
      ))}
    </div>
  )
}

export function ChatLoader({
  label = "Thinking",
  variant = "dots",
}: {
  label?: string
  variant?: "dots" | "bar" | "grid"
}): ReactElement {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const began = Date.now()
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - began) / 1000)),
      1000
    )
    return () => clearInterval(timer)
  }, [])
  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      aria-label={label}
    >
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-[3px] [&_i]:block [&_i]:size-[3px] [&_i]:animate-[sb-chat-pulse_1.4s_ease-in-out_infinite] [&_i]:rounded-full [&_i]:bg-current [&_i]:motion-reduce:animate-none",
          variant === "grid" &&
            "grid grid-cols-[repeat(3,3px)] gap-0.5 [&_i]:rounded-[1px]",
          variant === "bar" &&
            "h-[3px] w-11 overflow-hidden rounded-[3px] bg-border [&_i]:h-[3px] [&_i]:w-4 [&_i]:animate-[sb-chat-sweep_1.7s_ease-in-out_infinite]"
        )}
        aria-hidden="true"
      >
        {Array.from(
          { length: variant === "grid" ? 9 : variant === "bar" ? 1 : 3 },
          (_, index) => (
            <i key={index} style={{ animationDelay: `${index * 110}ms` }} />
          )
        )}
      </span>
      <span className="tabular-nums" aria-hidden="true">
        {seconds}s
      </span>
    </div>
  )
}
