"use client"

/* eslint-disable @next/next/no-img-element -- This installable React pack does not depend on Next Image. */

import { useEffect, useRef, useState, type ReactElement } from "react"
import { cn } from "cn"
import {
  Check,
  X,
  ChevronRight,
  Circle,
  LoaderCircle,
  FileCode2,
  ArrowUpRight,
  Download,
  ShieldCheck,
  ListChecks,
  Brain,
  Terminal,
} from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { CopyAction, AttachmentList } from "./atoms"
import { RichText, CodeBlock, Sources, safeLink } from "./content"
import { parseDiff } from "./state"
import type {
  ActivityStatus,
  AIChatProps,
  ApprovalPart,
  ArtifactPart,
  ChatPart,
  DiffPart,
} from "./types"

export function StatusMark({
  status,
}: {
  status: ActivityStatus
}): ReactElement {
  const Icon =
    status === "success"
      ? Check
      : status === "error"
        ? X
        : status === "running"
          ? LoaderCircle
          : Circle
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0",
        status === "running" && "animate-spin motion-reduce:animate-none"
      )}
    />
  )
}

function Approval({
  part,
  onDecide,
}: {
  part: ApprovalPart
  onDecide?: (decision: "approved" | "rejected") => void | Promise<void>
}): ReactElement {
  const [localDecision, setLocalDecision] = useState<"approved" | "rejected">()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const locked = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const resolvedLabel = useRef<HTMLSpanElement>(null)
  const decision = part.decision ?? localDecision
  useEffect(() => {
    if (decision && locked.current) resolvedLabel.current?.focus()
  }, [decision])
  async function decide(value: "approved" | "rejected"): Promise<void> {
    if (locked.current || decision || !onDecide) return
    locked.current = true
    setPending(true)
    setError("")
    try {
      await onDecide(value)
      if (mounted.current) setLocalDecision(value)
    } catch {
      locked.current = false
      if (mounted.current) setError("Decision was not saved. Please try again.")
    } finally {
      if (mounted.current) setPending(false)
    }
  }
  return (
    <section
      className="rounded-xl border border-foreground/9 bg-foreground/2 p-3"
      aria-label="Approval request"
    >
      <div className="flex items-center gap-2 text-xs font-medium">
        <ShieldCheck
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        {part.title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {part.description}
      </p>
      <div className="mt-4 flex items-center gap-2" aria-live="polite">
        {decision ? (
          <span
            ref={resolvedLabel}
            tabIndex={-1}
            className="flex items-center gap-2 rounded-sm text-xs outline-none focus-visible:outline-2"
          >
            <StatusMark
              status={decision === "approved" ? "success" : "error"}
            />
            {decision === "approved" ? "Approved" : "Rejected"}
          </span>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              disabled={pending || !onDecide}
              onClick={() => void decide("approved")}
            >
              {pending ? "Saving…" : (part.approveLabel ?? "Approve")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !onDecide}
              onClick={() => void decide("rejected")}
            >
              {part.rejectLabel ?? "Reject"}
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

function Diff({ part }: { part: DiffPart }): ReactElement {
  const lines = parseDiff(part.patch)
  return (
    <Collapsible className="overflow-hidden rounded-xl border border-foreground/9 bg-foreground/2 p-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger
          render={<Button variant="ghost" size="sm" />}
          className="group min-w-0 flex-1 justify-start"
        >
          <FileCode2 data-icon="inline-start" />
          <span className="truncate text-xs">{part.filename}</span>
          <ChevronRight
            className="ml-auto transition-transform group-data-open:rotate-90 motion-reduce:transition-none"
            data-icon="inline-end"
          />
        </CollapsibleTrigger>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          +{lines.filter((line) => line.kind === "add").length} −
          {lines.filter((line) => line.kind === "remove").length}
        </span>
        <CopyAction compact text={part.patch} label="Copy patch" />
      </div>
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height,opacity] duration-200 motion-reduce:transition-none data-closed:h-0 data-closed:opacity-0">
        <div
          className="max-h-72 overflow-auto border-t border-border/60 py-2 font-mono text-[11px] leading-6"
          aria-label={`Diff for ${part.filename}`}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid min-w-max grid-cols-[2rem_2rem_1rem_1fr] pr-4 data-[kind=add]:bg-[#68a68d]/10 data-[kind=header]:text-muted-foreground data-[kind=remove]:bg-[#bc7f88]/10"
              data-kind={line.kind}
            >
              <span className="text-center text-muted-foreground/50 select-none">
                {line.oldLine}
              </span>
              <span className="text-center text-muted-foreground/50 select-none">
                {line.newLine}
              </span>
              <span aria-hidden="true">
                {line.kind === "add" ? "+" : line.kind === "remove" ? "−" : ""}
              </span>
              <span className="whitespace-pre">{line.text}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Artifact({
  part,
  renderArtifact,
}: {
  part: ArtifactPart
  renderArtifact?: AIChatProps["renderArtifact"]
}): ReactElement {
  function download(): void {
    const url = URL.createObjectURL(
      new Blob([part.code], { type: "text/plain;charset=utf-8" })
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = part.filename
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const hasPreview = !!(part.preview || part.imageUrl || renderArtifact)
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" />}
        className="h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-4 py-4"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted">
          <FileCode2 aria-hidden="true" className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <span className="truncate text-xs font-medium">{part.title}</span>
          <span className="text-[10px] text-muted-foreground">
            {part.filename} · Open artifact
          </span>
        </span>
        <ArrowUpRight data-icon="inline-end" />
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden motion-reduce:animate-none! motion-reduce:transition-none! sm:max-w-3xl motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!">
        <DialogHeader>
          <DialogTitle>{part.title}</DialogTitle>
          <DialogDescription>{part.filename}</DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue={hasPreview ? "preview" : "code"}
          className="min-h-0 overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              {hasPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            <div className="flex gap-1">
              <CopyAction text={part.code} label="Copy artifact" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={download}
              >
                <Download data-icon="inline-start" />
                Download
              </Button>
            </div>
          </div>
          {hasPreview && (
            <TabsContent
              value="preview"
              className="max-h-[55dvh] overflow-auto rounded-xl border border-border/60 p-5 sm:p-8"
            >
              {renderArtifact ? (
                renderArtifact(part)
              ) : part.imageUrl && safeLink(part.imageUrl) ? (
                <img
                  src={safeLink(part.imageUrl)}
                  alt={part.title}
                  className="max-h-96 max-w-full rounded-lg object-contain"
                />
              ) : (
                <RichText text={part.preview ?? ""} />
              )}
            </TabsContent>
          )}
          <TabsContent value="code" className="min-h-0 overflow-auto">
            <CodeBlock code={part.code} language={part.language} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function ChatPartView({
  part,
  messageId,
  onApproval,
  renderArtifact,
}: {
  part: ChatPart
  messageId: string
  onApproval?: AIChatProps["onApproval"]
  renderArtifact?: AIChatProps["renderArtifact"]
}): ReactElement {
  switch (part.type) {
    case "text":
      return <RichText text={part.text} sources={part.sources} />
    case "attachments":
      return <AttachmentList attachments={part.attachments} />
    case "sources":
      return <Sources sources={part.sources} />
    case "approval":
      return (
        <Approval
          part={part}
          onDecide={
            onApproval
              ? (decision) => onApproval(messageId, part.id, decision)
              : undefined
          }
        />
      )
    case "artifact":
      return <Artifact part={part} renderArtifact={renderArtifact} />
    case "diff":
      return <Diff part={part} />
    case "tasks":
      return (
        <Collapsible className="rounded-xl border border-foreground/9 bg-foreground/2 p-3">
          <CollapsibleTrigger
            render={<Button variant="ghost" size="sm" />}
            className="group w-full justify-start"
          >
            <ListChecks data-icon="inline-start" />
            <span className="flex-1 text-left text-xs">{part.title}</span>
            <span className="text-[10px] text-muted-foreground">
              {part.items.filter((item) => item.status === "success").length}/
              {part.items.length}
            </span>
            <ChevronRight
              data-icon="inline-end"
              className="transition-transform group-data-open:rotate-90 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height,opacity] duration-200 motion-reduce:transition-none data-closed:h-0 data-closed:opacity-0">
            <ul className="mt-3 flex flex-col gap-3 px-2">
              {part.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <StatusMark status={item.status} />
                  <span>{item.label}</span>
                  <span className="sr-only">{item.status}</span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )
    case "tool":
    case "reasoning":
      return (
        <Collapsible className="border-b border-foreground/6 pb-1">
          <CollapsibleTrigger
            render={<Button variant="ghost" size="sm" />}
            className="group h-auto w-full justify-start py-2"
          >
            <StatusMark status={part.status} />
            <span className="flex-1 text-left text-xs">{part.title}</span>
            {part.elapsed && (
              <span className="text-[10px] text-muted-foreground">
                {part.elapsed}
              </span>
            )}
            <Badge variant="secondary" className="text-[9px]">
              {part.status}
            </Badge>
            <ChevronRight
              data-icon="inline-end"
              className="transition-transform group-data-open:rotate-90 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height,opacity] duration-200 motion-reduce:transition-none data-closed:h-0 data-closed:opacity-0">
            <div className="mt-2 ml-3 flex flex-col gap-3 border-l border-border pl-4 text-xs leading-relaxed text-muted-foreground">
              <span className="flex items-center gap-2 text-[10px]">
                {part.type === "reasoning" ? (
                  <Brain className="size-3" />
                ) : (
                  <Terminal className="size-3" />
                )}
                {part.type === "reasoning"
                  ? "Activity summary"
                  : "Tool details"}
              </span>
              {part.detail && <p>{part.detail}</p>}
              {part.args && (
                <div>
                  <p className="mb-1 text-[10px]">Arguments</p>
                  <CodeBlock code={part.args} language="json" />
                </div>
              )}
              {part.result && (
                <div>
                  <p className="mb-1 text-[10px]">Result</p>
                  <p className="whitespace-pre-wrap">{part.result}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
  }
}
