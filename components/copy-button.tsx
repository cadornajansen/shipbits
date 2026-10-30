"use client"

import { useState, type ReactElement } from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({
  text,
  label = "Copy",
  iconOnly = false,
}: {
  text: string
  label?: string
  iconOnly?: boolean
}): ReactElement {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
  }
  return (
    <>
      <button
        type="button"
        className={
          iconOnly
            ? "absolute top-1.5 right-1.5 flex size-[30px] items-center justify-center rounded-lg text-[#999] hover:bg-white/[.05] hover:text-white focus-visible:outline-2 focus-visible:outline-[#ededed]"
            : "inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#202020] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-[#ededed] shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
        }
        aria-label={status === "copied" ? "Copied" : label}
        onClick={copy}
      >
        {status === "copied" ? <Check size={16} /> : <Copy size={16} />}
        {!iconOnly && (status === "copied" ? "Copied" : label)}
      </button>
      <span className="sr-only" role="status">
        {status === "copied" ? "Copied to clipboard." : ""}
      </span>
      {status === "failed" && (
        <div
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-[640px] rounded-2xl border border-[#444] bg-[#202020] p-4 text-[13px] shadow-[0_12px_80px_#0009] [&_textarea]:my-3 [&_textarea]:block [&_textarea]:h-40 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:bg-[#151515] [&_textarea]:p-3 [&_textarea]:font-mono"
          role="status"
        >
          <p>Clipboard unavailable. Select and copy this text:</p>
          <textarea
            aria-label={`${label} manually`}
            readOnly
            value={text}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#2a2a2a] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
            type="button"
            onClick={() => setStatus("idle")}
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
