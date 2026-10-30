"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type Dispatch,
  type SetStateAction,
} from "react"
import { ArrowUp, Square, Plus, Mic, X, AudioLines } from "lucide-react"
import { Button } from "../ui/button"
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
} from "../ui/input-group"
import { AttachmentList, Choice } from "./atoms"
import { validateAttachments } from "./state"
import { useRecording } from "./use-recording"
import type { AIChatProps, ChatAttachment, ChatMode } from "./types"

export function ChatComposer({
  status,
  models = [],
  capabilities,
  maxAttachments = 5,
  maxAttachmentBytes = 10 * 1024 * 1024,
  maxRecordingSeconds = 120,
  onSubmit,
  onStop,
  toolbar,
  draft,
  onDraftChange: setDraft,
  focusRequest,
}: Pick<
  AIChatProps,
  | "status"
  | "models"
  | "capabilities"
  | "maxAttachments"
  | "maxAttachmentBytes"
  | "maxRecordingSeconds"
  | "onSubmit"
  | "onStop"
  | "toolbar"
> & {
  draft: string
  onDraftChange: Dispatch<SetStateAction<string>>
  focusRequest: number
}): ReactElement {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [modelId, setModelId] = useState(models[0]?.id ?? "")
  const [effort, setEffort] = useState(models[0]?.efforts?.[0] ?? "")
  const [mode, setMode] = useState<ChatMode>("agent")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const files = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  const id = useId()
  const busy = status === "submitted" || status === "streaming"
  const model = models.find((item) => item.id === modelId) ?? models[0]
  const selectedEffort = model?.efforts?.includes(effort)
    ? effort
    : (model?.efforts?.[0] ?? "")

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (focusRequest) input.current?.focus()
  }, [focusRequest])
  useEffect(() => {
    if (!input.current) return
    input.current.style.height = "auto"
    input.current.style.height = `${Math.min(input.current.scrollHeight, 216)}px`
  }, [draft])

  function addFiles(incoming: File[]): void {
    const failure = validateAttachments(
      attachments.length,
      incoming,
      maxAttachments,
      maxAttachmentBytes
    )
    if (failure) {
      setError(failure)
      return
    }
    setError("")
    const added = incoming.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      mediaType: file.type,
      file,
    }))
    setAttachments((current) => [...current, ...added])
  }
  const voice = useRecording((file) => addFiles([file]), maxRecordingSeconds)

  async function submit(): Promise<void> {
    if (
      busy ||
      submitting ||
      voice.recording ||
      voice.requesting ||
      (!draft.trim() && !attachments.length)
    )
      return
    setError("")
    setSubmitting(true)
    try {
      await onSubmit({
        text: draft.trim(),
        attachments,
        modelId: model?.id ?? "",
        effort: selectedEffort,
        mode,
      })
      if (mounted.current) {
        setDraft((current) => (current === draft ? "" : current))
        const sentIds = new Set(attachments.map((attachment) => attachment.id))
        setAttachments((current) =>
          current.filter((attachment) => !sentIds.has(attachment.id))
        )
        input.current?.focus()
      }
    } catch {
      if (mounted.current)
        setError("Message was not sent. Your draft is still here. Try again.")
    } finally {
      if (mounted.current) setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="relative rounded-[20px] bg-foreground/13 p-px before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] before:bg-[conic-gradient(from_var(--sb-chat-angle),transparent_35%,#779bb766_46%,#9c91bc99_52%,#b5bc9e66_58%,transparent_69%)] before:opacity-0 before:transition-opacity before:duration-[400ms] before:content-[''] data-[active=true]:before:animate-[sb-chat-beam_8s_linear_infinite] data-[active=true]:before:opacity-80 before:motion-reduce:animate-none before:motion-reduce:transition-none"
      data-active={busy}
    >
      <input
        ref={files}
        type="file"
        multiple
        hidden
        aria-label="Attach files"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />
      <InputGroup className="relative h-auto rounded-[19px] border-0 bg-[color-mix(in_oklab,var(--background)_96%,var(--foreground))]! opacity-100 shadow-[0_5px_22px_#0000000a]">
        {!!attachments.length && (
          <InputGroupAddon align="block-start">
            <AttachmentList
              attachments={attachments}
              onRemove={(attachmentId) =>
                setAttachments((current) =>
                  current.filter((item) => item.id !== attachmentId)
                )
              }
            />
          </InputGroupAddon>
        )}
        <label htmlFor={id} className="sr-only">
          Message
        </label>
        <InputGroupTextarea
          ref={input}
          id={id}
          value={draft}
          placeholder="Ask something. Make something."
          rows={2}
          className="field-sizing-fixed max-h-[216px] min-h-[74px] px-4 pt-4 pb-2 text-[13px] leading-6 max-[480px]:text-base md:text-[13px]"
          aria-describedby={error || voice.error ? `${id}-error` : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault()
              void submit()
            }
          }}
        />
        <InputGroupAddon
          align="block-end"
          className="gap-1 px-2 pt-[5px] pb-2 [&_button]:text-[11px] max-[480px]:[&_button]:px-1.5 max-[480px]:[&_button]:text-[10px]"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-0.5">
            {capabilities?.mode !== false && (
              <Choice
                label="Mode"
                value={mode}
                options={[
                  { id: "agent", label: "Agent" },
                  { id: "chat", label: "Chat" },
                ]}
                onChange={(value) => setMode(value as ChatMode)}
                disabled={busy}
              />
            )}
            {!!models.length && (
              <Choice
                label="Model"
                value={model?.id ?? ""}
                options={models}
                onChange={setModelId}
                disabled={busy}
              />
            )}
            {!!model?.efforts?.length && (
              <Choice
                label="Effort"
                value={selectedEffort}
                options={model.efforts.map((item) => ({
                  id: item,
                  label: item,
                }))}
                onChange={setEffort}
                disabled={busy}
              />
            )}
            {toolbar}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {capabilities?.attachments !== false && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Attach files"
                aria-label="Attach files"
                disabled={submitting}
                onClick={() => files.current?.click()}
              >
                <Plus />
              </Button>
            )}
            {capabilities?.recording !== false &&
              !voice.recording &&
              !voice.requesting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Record voice note"
                  aria-label="Record voice note"
                  disabled={
                    busy || submitting || attachments.length >= maxAttachments
                  }
                  onClick={() => void voice.start()}
                >
                  <Mic />
                </Button>
              )}
            {busy && onStop ? (
              <Button
                type="button"
                size="icon-sm"
                aria-label="Stop response"
                onClick={() => {
                  onStop()
                  input.current?.focus()
                }}
              >
                <Square />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                aria-label="Send message"
                disabled={
                  busy ||
                  submitting ||
                  voice.recording ||
                  voice.requesting ||
                  (!draft.trim() && !attachments.length)
                }
              >
                <ArrowUp />
              </Button>
            )}
          </div>
        </InputGroupAddon>
        {(voice.recording || voice.requesting) && (
          <InputGroupAddon align="block-end" className="gap-2">
            <AudioLines aria-hidden="true" />
            <span className="text-xs tabular-nums">
              {voice.requesting
                ? "Waiting for microphone…"
                : `Recording ${Math.floor(voice.seconds / 60)}:${String(voice.seconds % 60).padStart(2, "0")}`}
            </span>
            {voice.recording && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => voice.stop()}
              >
                Finish recording
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Cancel recording"
              onClick={() => voice.stop(true)}
            >
              <X />
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
      {(error || voice.error) && (
        <p
          role="alert"
          id={`${id}-error`}
          className="mt-2 text-xs text-destructive"
        >
          {error || voice.error}
        </p>
      )}
    </form>
  )
}
