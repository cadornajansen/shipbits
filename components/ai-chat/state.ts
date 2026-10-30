import type { ChatAttachment, ChatMessage, ChatPart } from "./types"

export function activeParts(message: ChatMessage): ChatPart[] {
  return message.versions?.[message.activeVersion ?? 0]?.parts ?? message.parts
}

export function messageText(message: ChatMessage): string {
  return activeParts(message)
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n")
}

export function addVersion(
  message: ChatMessage,
  parts: ChatPart[],
  id: string
): ChatMessage {
  const versions = [
    ...(message.versions ?? [
      { id: `${message.id}-original`, parts: message.parts },
    ]),
    { id, parts },
  ]
  return {
    ...message,
    versions,
    activeVersion: versions.length - 1,
    feedback: undefined,
  }
}

export function decideApproval(
  message: ChatMessage,
  partId: string,
  decision: "approved" | "rejected"
): ChatMessage {
  const update = (parts: ChatPart[]): ChatPart[] =>
    parts.map((part) =>
      part.id === partId && part.type === "approval" && !part.decision
        ? { ...part, decision }
        : part
    )
  return message.versions
    ? {
        ...message,
        versions: message.versions.map((version, index) =>
          index === (message.activeVersion ?? 0)
            ? { ...version, parts: update(version.parts) }
            : version
        ),
      }
    : { ...message, parts: update(message.parts) }
}

export function validateAttachments(
  current: number,
  incoming: Pick<ChatAttachment, "size" | "name">[],
  maxCount = 5,
  maxBytes = 10 * 1024 * 1024
): string | null {
  if (current + incoming.length > maxCount)
    return `You can attach up to ${maxCount} files.`
  const oversized = incoming.find((file) => file.size > maxBytes)
  return oversized
    ? `${oversized.name} exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`
    : null
}

export interface DiffLine {
  kind: "context" | "add" | "remove" | "header"
  text: string
  oldLine?: number
  newLine?: number
}
export function parseDiff(patch: string): DiffLine[] {
  let oldLine = 0
  let newLine = 0
  return patch.split("\n").map((text): DiffLine => {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text)
    if (hunk) {
      oldLine = Number(hunk[1])
      newLine = Number(hunk[2])
      return { kind: "header", text }
    }
    if (/^(---|\+\+\+|diff |index |\\)/.test(text))
      return { kind: "header", text }
    if (text.startsWith("+"))
      return { kind: "add", text: text.slice(1), newLine: newLine++ }
    if (text.startsWith("-"))
      return { kind: "remove", text: text.slice(1), oldLine: oldLine++ }
    return {
      kind: "context",
      text: text.startsWith(" ") ? text.slice(1) : text,
      oldLine: oldLine++,
      newLine: newLine++,
    }
  })
}

export function avatarPixels(seed: string): number[] {
  let hash = 2166136261
  for (const letter of seed)
    hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619)
  return Array.from({ length: 25 }, () => {
    hash ^= hash << 13
    hash ^= hash >>> 17
    hash ^= hash << 5
    return hash >>> 0
  })
}

/** Invalidating a run prevents delayed work from changing a newer conversation. */
export function createRunGuard(): {
  next: () => number
  isCurrent: (id: number) => boolean
} {
  let current = 0
  return { next: () => ++current, isCurrent: (id) => id === current }
}
