"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react"
import { RotateCcw, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { AIChat } from "../ui/ai-chat"
import {
  activeParts,
  addVersion,
  createRunGuard,
  decideApproval,
} from "./state"
import {
  initialConversation,
  releaseArtifact,
  reviewParts,
  demoSources,
} from "./demo-data"
import type { ChatMessage, ChatPart, ChatStatus, ChatSubmission } from "./types"

function wait(milliseconds: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false)
      return
    }
    const abort = (): void => {
      clearTimeout(timer)
      resolve(false)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort)
      resolve(true)
    }, milliseconds)
    signal.addEventListener("abort", abort, { once: true })
  })
}

/** A local demo adapter; AIChat itself never invents a response or calls a service. */
export function AIChatDemo(): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation)
  const [status, setStatus] = useState<ChatStatus>("awaiting-approval")
  const [notice, setNotice] = useState("")
  const [resetKey, setResetKey] = useState(0)
  const controller = useRef<AbortController | null>(null)
  const guard = useRef(createRunGuard())
  const snapshot = useRef(messages)
  const decisions = useRef(new Set<string>())
  useEffect(() => {
    snapshot.current = messages
  }, [messages])
  useEffect(
    () => () => {
      controller.current?.abort()
      guard.current.next()
    },
    []
  )

  const stop = useCallback((): void => {
    controller.current?.abort()
    guard.current.next()
    const settle = (parts: ChatPart[]): ChatPart[] =>
      parts.map((part) =>
        (part.type === "tool" || part.type === "reasoning") &&
        part.status === "running"
          ? { ...part, status: "pending", title: `${part.title} · stopped` }
          : part
      )
    setMessages((current) =>
      current.map((message) =>
        activeParts(message).some(
          (part) =>
            (part.type === "tool" || part.type === "reasoning") &&
            part.status === "running"
        )
          ? message.versions
            ? {
                ...message,
                versions: message.versions.map((version, index) =>
                  index === (message.activeVersion ?? 0)
                    ? { ...version, parts: settle(version.parts) }
                    : version
                ),
              }
            : { ...message, parts: settle(message.parts) }
          : message
      )
    )
    setStatus("idle")
  }, [])

  async function streamResponse(
    messageId: string,
    parts: ChatPart[],
    version?: number
  ): Promise<void> {
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    const run = guard.current.next()
    const update = (next: ChatPart[]): void => {
      if (!guard.current.isCurrent(run)) return
      setMessages((current) =>
        current.map((message) =>
          message.id !== messageId
            ? message
            : version === undefined
              ? { ...message, parts: next }
              : {
                  ...message,
                  versions: message.versions?.map((item, index) =>
                    index === version ? { ...item, parts: next } : item
                  ),
                }
        )
      )
    }
    setStatus("submitted")
    update([
      {
        type: "reasoning",
        id: "running-reasoning",
        title: "Reviewing the supplied fixtures",
        status: "running",
        detail: "This demonstration uses a fixed local release-review fixture.",
      },
    ])
    if (!(await wait(650, abort.signal))) return
    update([
      {
        type: "tool",
        id: "running-tool",
        title: "inspect_component",
        status: "running",
        args: '{ "component": "Composer" }',
      },
    ])
    if (!(await wait(650, abort.signal))) return
    setStatus("streaming")
    const text = parts.find((part) => part.type === "text")
    if (text?.type === "text") {
      const words = text.text.split(" ")
      for (let index = 4; index < words.length + 4; index += 4) {
        update([{ ...text, text: words.slice(0, index).join(" ") }])
        if (!(await wait(65, abort.signal))) return
      }
    }
    update(parts)
    if (guard.current.isCurrent(run))
      setStatus(
        parts.some((part) => part.type === "approval" && !part.decision)
          ? "awaiting-approval"
          : "idle"
      )
  }

  function submit(submission: ChatSubmission, clear = false): void {
    stop()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const user: ChatMessage = {
      id: `${id}-user`,
      role: "user",
      createdAt: now,
      parts: [
        {
          type: "text",
          id: "prompt",
          text: submission.text || "Review this attachment.",
        },
        ...(submission.attachments.length
          ? [
              {
                type: "attachments" as const,
                id: "files",
                attachments: submission.attachments,
              },
            ]
          : []),
      ],
    }
    const assistant: ChatMessage = {
      id,
      role: "assistant",
      createdAt: now,
      parts: [],
    }
    setMessages((current) => [...(clear ? [] : current), user, assistant])
    setNotice(
      submission.attachments.length
        ? "Files stay in your browser. The scripted demo does not inspect their contents."
        : ""
    )
    const parts: ChatPart[] =
      submission.mode === "agent"
        ? reviewParts()
        : [
            {
              type: "text",
              id: "summary",
              text: "This is the scripted chat response. For this release review, I would start with **keyboard behavior**, then check scrolling and microphone cleanup.[1](#source-scroll)\n\nYour application can stream any response into this same interface through controlled messages and status.",
              sources: demoSources,
            },
            { type: "sources", id: "sources", sources: demoSources },
          ]
    void streamResponse(id, parts)
  }

  function retry(messageId: string): void {
    const original = snapshot.current.find(
      (message) => message.id === messageId
    )
    if (!original) return
    const next = addVersion(original, [], crypto.randomUUID())
    const version = next.activeVersion ?? 0
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? next : message))
    )
    const parts: ChatPart[] = [
      {
        type: "text",
        id: "alternate",
        text: "Here’s a shorter version of the review: **protect input first, then preserve reading position.**\n\n1. Send only on Enter outside an active composition.\n2. Keep Shift+Enter available for a new line.\n3. Release microphone tracks when a voice note finishes.\n\nThe original response is preserved. Use the version arrows below to compare.",
        sources: demoSources,
      },
      releaseArtifact(false),
    ]
    void streamResponse(messageId, parts, version)
  }

  function approve(
    messageId: string,
    partId: string,
    decision: "approved" | "rejected"
  ): void {
    const original = snapshot.current.find(
      (message) => message.id === messageId
    )
    const key = `${messageId}-${original?.activeVersion ?? 0}-${partId}`
    if (
      !original ||
      decisions.current.has(key) ||
      activeParts(original).some(
        (part) =>
          part.id === partId && part.type === "approval" && part.decision
      )
    )
      return
    stop()
    decisions.current.add(key)
    const resolved = decideApproval(original, partId, decision)
    const approved = decision === "approved"
    const completeTasks = (parts: ChatPart[]): ChatPart[] =>
      parts.map((part) =>
        part.type === "tasks"
          ? {
              ...part,
              items: part.items.map((item) =>
                item.id === "approval"
                  ? { ...item, status: approved ? "success" : "error" }
                  : item
              ),
            }
          : part
      )
    const updated = resolved.versions
      ? {
          ...resolved,
          versions: resolved.versions.map((version, index) =>
            index === (resolved.activeVersion ?? 0)
              ? { ...version, parts: completeTasks(version.parts) }
              : version
          ),
        }
      : { ...resolved, parts: completeTasks(resolved.parts) }
    const followup: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      createdAt: new Date().toISOString(),
      parts: [
        {
          type: "text",
          id: "decision-note",
          text: approved
            ? "Approved for the local preview. I’ve prepared the release review below; you can inspect, copy, or download it."
            : "Patch rejected. I’ve kept it out of the local preview and prepared revision notes instead.",
        },
        releaseArtifact(approved),
      ],
    }
    setMessages((current) => [
      ...current.map((message) =>
        message.id === messageId ? updated : message
      ),
      followup,
    ])
    setNotice(
      approved
        ? "Patch accepted in this local demo. No project files changed."
        : "Patch rejected in this local demo."
    )
  }

  function reset(): void {
    stop()
    setMessages([])
    decisions.current.clear()
    setNotice("")
    setResetKey((value) => value + 1)
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-[10px] text-muted-foreground">
          Scripted frontend demo · no AI service connected
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset()
              submit(
                {
                  text: "Review the release. Check the chat interactions and prepare a small patch.",
                  attachments: [],
                  modelId: "reasoning",
                  effort: "Standard",
                  mode: "agent",
                },
                true
              )
            }}
          >
            <RotateCcw data-icon="inline-start" />
            Replay workflow
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <Plus data-icon="inline-start" />
            New chat
          </Button>
        </div>
      </div>
      <AIChat
        key={resetKey}
        messages={messages}
        status={status}
        title="Release workspace"
        description="Release review · Shipbits / chat"
        models={[
          {
            id: "reasoning",
            label: "Reasoning",
            description: "Demo model configuration",
            efforts: ["Standard", "Deep"],
          },
          {
            id: "fast",
            label: "Fast",
            description: "Demo model configuration",
            efforts: ["Low", "Standard"],
          },
        ]}
        suggestions={[
          "Review the release",
          "Check the composer’s keyboard behavior",
          "Prepare a launch note",
        ]}
        onSubmit={submit}
        onStop={stop}
        onRetry={retry}
        onApproval={approve}
        onFeedback={(messageId, feedback) =>
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    feedback:
                      message.feedback === feedback ? undefined : feedback,
                  }
                : message
            )
          )
        }
        onSelectVersion={(messageId, version) => {
          stop()
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId && message.versions?.[version]
                ? { ...message, activeVersion: version }
                : message
            )
          )
        }}
        context={{ used: 1260 + messages.length * 180, limit: 32000 }}
        onContextAction={reset}
      />
      <p
        role="status"
        className="mt-3 min-h-4 px-1 text-[10px] text-muted-foreground"
      >
        {notice}
      </p>
    </div>
  )
}
