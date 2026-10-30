import type { ReactNode } from "react"

export type ChatStatus =
  "idle" | "submitted" | "streaming" | "awaiting-approval" | "error"
export type ActivityStatus = "pending" | "running" | "success" | "error"
export type ChatMode = "chat" | "agent"
export interface ChatAttachment {
  id: string
  name: string
  size: number
  mediaType: string
  file?: File
  url?: string
}
export interface ChatSource {
  id: string
  title: string
  url: string
  description?: string
}
export interface ChatModel {
  id: string
  label: string
  description?: string
  efforts?: string[]
}
export interface TextPart {
  type: "text"
  id: string
  text: string
  sources?: ChatSource[]
}
export interface ActivityPart {
  type: "reasoning" | "tool"
  id: string
  title: string
  status: ActivityStatus
  detail?: string
  args?: string
  result?: string
  elapsed?: string
}
export interface TasksPart {
  type: "tasks"
  id: string
  title: string
  items: { id: string; label: string; status: ActivityStatus }[]
}
export interface ApprovalPart {
  type: "approval"
  id: string
  title: string
  description: string
  approveLabel?: string
  rejectLabel?: string
  decision?: "approved" | "rejected"
}
export interface DiffPart {
  type: "diff"
  id: string
  filename: string
  patch: string
}
export interface ArtifactPart {
  type: "artifact"
  id: string
  title: string
  language: string
  code: string
  preview?: string
  imageUrl?: string
  filename: string
}
export interface SourcesPart {
  type: "sources"
  id: string
  sources: ChatSource[]
}
export interface AttachmentsPart {
  type: "attachments"
  id: string
  attachments: ChatAttachment[]
}
export type ChatPart =
  | TextPart
  | ActivityPart
  | TasksPart
  | ApprovalPart
  | DiffPart
  | ArtifactPart
  | SourcesPart
  | AttachmentsPart
export interface ChatVersion {
  id: string
  parts: ChatPart[]
}
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  createdAt: string
  parts: ChatPart[]
  versions?: ChatVersion[]
  activeVersion?: number
  feedback?: "up" | "down"
}
export interface ChatSubmission {
  text: string
  attachments: ChatAttachment[]
  modelId: string
  effort: string
  mode: ChatMode
}
export interface ChatCapabilities {
  attachments?: boolean
  recording?: boolean
  mode?: boolean
  feedback?: boolean
}
export interface AIChatProps {
  messages: ChatMessage[]
  status: ChatStatus
  onSubmit: (submission: ChatSubmission) => void | Promise<void>
  onStop?: () => void
  onRetry?: (messageId: string) => void
  onFeedback?: (messageId: string, feedback: "up" | "down") => void
  onSelectVersion?: (messageId: string, version: number) => void
  onApproval?: (
    messageId: string,
    partId: string,
    decision: "approved" | "rejected"
  ) => void | Promise<void>
  onContextAction?: () => void
  renderArtifact?: (artifact: ArtifactPart) => ReactNode
  toolbar?: ReactNode
  models?: ChatModel[]
  suggestions?: string[]
  capabilities?: ChatCapabilities
  maxAttachments?: number
  maxAttachmentBytes?: number
  maxRecordingSeconds?: number
  context?: { used: number; limit: number }
  title?: string
  description?: string
  error?: string
  className?: string
}
