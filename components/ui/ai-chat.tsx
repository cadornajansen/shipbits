"use client"

import { memo, useId, useState, type ReactElement } from "react"
import {
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "./button"
import { Message, MessageContent, MessageFooter } from "./message"
import { Bubble, BubbleContent } from "./bubble"
import { Marker, MarkerContent } from "./marker"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "./message-scroller"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from "./popover"
import { AgentAvatar, CopyAction, ChatLoader } from "../ai-chat/atoms"
import { ChatComposer } from "../ai-chat/composer"
import { ChatPartView } from "../ai-chat/workbench"
import { activeParts, messageText } from "../ai-chat/state"
import type { AIChatProps, ChatMessage } from "../ai-chat/types"

export type * from "../ai-chat/types"

const ChatRow = memo(function ChatRow({
  message,
  busy,
  canRetry,
  onRetry,
  onFeedback,
  onSelectVersion,
  onApproval,
  renderArtifact,
}: { message: ChatMessage; busy: boolean; canRetry: boolean } & Pick<
  AIChatProps,
  "onRetry" | "onFeedback" | "onSelectVersion" | "onApproval" | "renderArtifact"
>): ReactElement {
  const user = message.role === "user"
  const parts = activeParts(message)
  const text = messageText(message)
  return (
    <Message align={user ? "end" : "start"} className="group/chat-message">
      {!user && (
        <span className="mt-0.5 hidden shrink-0 sm:block">
          <AgentAvatar />
        </span>
      )}
      <MessageContent>
        {user ? (
          <Bubble variant="secondary" align="end">
            <BubbleContent>
              <div className="flex min-w-0 flex-col gap-3">
                {parts.map((part) => (
                  <ChatPartView
                    key={part.id}
                    part={part}
                    messageId={message.id}
                  />
                ))}
              </div>
            </BubbleContent>
          </Bubble>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {parts.map((part) => (
              <ChatPartView
                key={part.id}
                part={part}
                messageId={message.id}
                onApproval={onApproval}
                renderArtifact={renderArtifact}
              />
            ))}
          </div>
        )}
        <MessageFooter className="gap-1 opacity-45 transition-opacity duration-200 group-focus-within/chat-message:opacity-100 group-hover/chat-message:opacity-100 [&_button[aria-pressed=true]]:bg-muted [&_button[aria-pressed=true]]:text-foreground [@media(hover:none)]:opacity-80">
          <time
            className="mr-2 text-[10px] font-normal text-muted-foreground/60"
            dateTime={message.createdAt}
          >
            {message.createdAt.slice(11, 16)}
          </time>
          {!user && (
            <>
              {text && <CopyAction compact label="Copy response" text={text} />}
              {onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title="Retry response"
                  aria-label="Retry response"
                  disabled={busy || !canRetry}
                  onClick={() => onRetry(message.id)}
                >
                  <RotateCcw />
                </Button>
              )}
              {onFeedback && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Helpful"
                    aria-label="Helpful"
                    aria-pressed={message.feedback === "up"}
                    onClick={() => onFeedback(message.id, "up")}
                  >
                    <ThumbsUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Not helpful"
                    aria-label="Not helpful"
                    aria-pressed={message.feedback === "down"}
                    onClick={() => onFeedback(message.id, "down")}
                  >
                    <ThumbsDown />
                  </Button>
                </>
              )}
              {!!message.versions?.length && onSelectVersion && (
                <span className="ml-1 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Previous response version"
                    disabled={busy || !(message.activeVersion ?? 0)}
                    onClick={() =>
                      onSelectVersion(
                        message.id,
                        (message.activeVersion ?? 0) - 1
                      )
                    }
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-[10px] tabular-nums">
                    {(message.activeVersion ?? 0) + 1}/{message.versions.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Next response version"
                    disabled={
                      busy ||
                      (message.activeVersion ?? 0) >=
                        message.versions.length - 1
                    }
                    onClick={() =>
                      onSelectVersion(
                        message.id,
                        (message.activeVersion ?? 0) + 1
                      )
                    }
                  >
                    <ChevronRight />
                  </Button>
                </span>
              )}
            </>
          )}
        </MessageFooter>
      </MessageContent>
    </Message>
  )
})

export function AIChat({
  messages,
  status,
  title = "Workspace",
  description = "Your ideas, a little further.",
  suggestions = [
    "Review a release",
    "Explain a code change",
    "Draft a launch note",
  ],
  context,
  onContextAction,
  capabilities,
  className,
  ...props
}: AIChatProps): ReactElement {
  const [draft, setDraft] = useState("")
  const [focusRequest, setFocusRequest] = useState(0)
  const titleId = useId()
  const busy = status === "submitted" || status === "streaming"
  const latestAssistant = messages.findLast(
    (message) => message.role === "assistant"
  )?.id
  const contextPercent =
    context && context.limit > 0
      ? Math.min(100, Math.max(0, (context.used / context.limit) * 100))
      : 0
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "isolate flex h-[min(740px,80dvh)] min-h-[480px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/25 font-[inherit] motion-reduce:animate-none! motion-reduce:transition-none! motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border/40 px-4 py-3 sm:px-6">
        <span className="flex size-6 items-center justify-center rounded-md border border-border/70">
          <Sparkles
            className="size-3 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <span id={titleId} className="text-xs font-medium">
          {title}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="size-1 rounded-full bg-foreground/40" />
          {status === "idle"
            ? "Ready"
            : status === "submitted"
              ? "Thinking"
              : status === "streaming"
                ? "Responding"
                : status === "awaiting-approval"
                  ? "Your decision"
                  : "Interrupted"}
        </span>
      </header>
      <MessageScrollerProvider autoScroll defaultScrollPosition="start">
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport className="max-[480px]:overscroll-y-auto">
            <MessageScrollerContent
              aria-live="off"
              className="mx-auto max-w-3xl gap-7 px-4 py-6 sm:px-8 sm:py-8"
            >
              {!messages.length ? (
                <MessageScrollerItem>
                  <div className="flex min-h-52 flex-col items-center justify-center gap-4 py-6 text-center">
                    <AgentAvatar />
                    <div>
                      <h2 className="text-xl font-medium tracking-tight">
                        What are we making?
                      </h2>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                </MessageScrollerItem>
              ) : (
                <MessageScrollerItem>
                  <Marker>
                    <MarkerContent className="text-[10px] text-muted-foreground/50">
                      {description}
                    </MarkerContent>
                  </Marker>
                </MessageScrollerItem>
              )}
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <ChatRow
                    message={message}
                    busy={busy}
                    canRetry={message.id === latestAssistant}
                    onRetry={props.onRetry}
                    onFeedback={
                      capabilities?.feedback === false
                        ? undefined
                        : props.onFeedback
                    }
                    onSelectVersion={props.onSelectVersion}
                    onApproval={props.onApproval}
                    renderArtifact={props.renderArtifact}
                  />
                </MessageScrollerItem>
              ))}
              {busy && (
                <MessageScrollerItem messageId="chat-processing">
                  <div className="flex items-center gap-3">
                    <AgentAvatar active />
                    <ChatLoader
                      label={
                        status === "submitted"
                          ? "Considering the request"
                          : "Working on the response"
                      }
                      variant={status === "submitted" ? "grid" : "bar"}
                    />
                  </div>
                </MessageScrollerItem>
              )}
              {props.error && (
                <MessageScrollerItem>
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 p-3 text-xs text-destructive"
                  >
                    {props.error}
                  </p>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton
            size="sm"
            variant="outline"
            className="w-auto gap-2 rounded-full px-3 text-xs"
          >
            Jump to latest
          </MessageScrollerButton>
        </MessageScroller>
      </MessageScrollerProvider>
      <footer className="shrink-0 px-3 pt-2 pb-3 sm:px-7 sm:pb-4">
        {!messages.length && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((text) => (
              <Button
                key={text}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(text)
                  setFocusRequest((value) => value + 1)
                }}
              >
                {text}
              </Button>
            ))}
          </div>
        )}
        <ChatComposer
          status={status}
          capabilities={capabilities}
          draft={draft}
          onDraftChange={setDraft}
          focusRequest={focusRequest}
          {...props}
        />
        <div className="mt-2 flex min-h-5 items-center justify-between gap-2 px-1 text-[9px] text-muted-foreground/60">
          <span>Enter to send · Shift + Enter for a new line</span>
          {context && context.limit > 0 && (
            <Popover>
              <PopoverTrigger
                className="inline-flex items-center gap-1.5 rounded-sm tabular-nums focus-visible:outline-2"
                aria-label={`Context usage ${Math.round(contextPercent)} percent`}
              >
                <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    opacity=".2"
                    strokeWidth="2"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${contextPercent * 0.377} 38`}
                    transform="rotate(-90 8 8)"
                  />
                </svg>
                {Math.round(contextPercent)}%
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="motion-reduce:animate-none! motion-reduce:transition-none! motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:scroll-auto! motion-reduce:[&_*]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::before]:transition-none!"
              >
                <PopoverTitle>Conversation context</PopoverTitle>
                <PopoverDescription className="mt-2 text-xs">
                  {context.used.toLocaleString()} of{" "}
                  {context.limit.toLocaleString()} tokens used. Supplied by your
                  application.
                </PopoverDescription>
                {onContextAction && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={onContextAction}
                  >
                    Start fresh
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </footer>
      <span role="status" className="sr-only">
        {status === "streaming"
          ? "Assistant is responding"
          : status === "awaiting-approval"
            ? "Approval requested"
            : status === "idle"
              ? "Ready"
              : status === "error"
                ? "Response interrupted"
                : "Request submitted"}
      </span>
    </section>
  )
}
