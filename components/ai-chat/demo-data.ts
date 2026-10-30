import type { ArtifactPart, ChatMessage, ChatPart, ChatSource } from "./types"

export const demoSources: ChatSource[] = [
  {
    id: "scroll",
    title: "Message Scroller",
    url: "https://ui.shadcn.com/docs/components/base/message-scroller",
    description:
      "Turn anchoring, streamed content, and preserving the reader’s position.",
  },
  {
    id: "recording",
    title: "MediaStream Recording API",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API",
    description:
      "Browser media recording and the lifecycle of a captured audio stream.",
  },
]

export const releasePatch = `--- a/components/composer.tsx
+++ b/components/composer.tsx
@@ -18,5 +18,6 @@
 function handleKeyDown(event) {
-  if (event.key === "Enter") {
+  if (event.key === "Enter" && !event.shiftKey
+      && !event.nativeEvent.isComposing) {
     event.preventDefault()
     sendMessage()
   }
`

export function releaseArtifact(approved: boolean): ArtifactPart {
  const preview = `# Release review\n\n${approved ? "Ready for a final human review." : "Patch held for revision."}\n\n## Included in this review\n\n- Reviewed the composer’s keyboard behavior.\n- Checked streaming and voice-note lifecycles.\n- ${approved ? "Accepted the proposed Enter-key guard in this local demonstration." : "Kept the proposed change out of the local preview."}\n\n## Next check\n\n${approved ? "Test Enter, Shift+Enter, and an active IME composition before shipping." : "Revise the patch, then request another review."}\n\n_No repository files were changed. This is the pack’s scripted frontend example._`
  return {
    type: "artifact",
    id: "release-note",
    title: approved ? "Release review.md" : "Revision notes.md",
    filename: approved ? "release-review.md" : "revision-notes.md",
    code: preview,
    preview,
    language: "markdown",
  }
}

export function reviewParts(): ChatPart[] {
  return [
    {
      type: "text",
      id: "summary",
      text: "The release is close. I found one keyboard detail worth fixing before it ships.\n\n**Keep the reader in control.** The transcript should follow new output only while they’re at the live edge.[1](#source-scroll) Voice notes should finish as local attachments, with the microphone released afterward.[2](#source-recording)",
      sources: demoSources,
    },
    {
      type: "reasoning",
      id: "reasoning",
      title: "Reviewed interaction boundaries",
      status: "success",
      detail:
        "Checked the supplied composer and transcript fixtures against their intended behavior. Focused on keyboard input, streaming interruptions, and recording cleanup.",
      elapsed: "1.4s",
    },
    {
      type: "tool",
      id: "tool",
      title: "inspect_component",
      status: "success",
      args: '{\n  "component": "Composer",\n  "checks": ["keyboard", "streaming", "recording"]\n}',
      result:
        "Fixture inspection complete. One Enter-key guard is proposed below. No files were modified.",
      elapsed: "0.8s",
    },
    {
      type: "tasks",
      id: "tasks",
      title: "Release checklist",
      items: [
        {
          id: "keyboard",
          label: "Review keyboard and composition input",
          status: "success",
        },
        {
          id: "scroll",
          label: "Check streaming and attachment boundaries",
          status: "success",
        },
        {
          id: "approval",
          label: "Get approval for the proposed patch",
          status: "pending",
        },
      ],
    },
    {
      type: "diff",
      id: "patch",
      filename: "components/composer.tsx",
      patch: releasePatch,
    },
    {
      type: "approval",
      id: "patch-approval",
      approveLabel: "Approve patch",
      title: "Apply this patch to the demo?",
      description:
        "Enter sends, Shift+Enter adds a line, and an active composition stays intact. Your decision updates this local preview only.",
    },
    { type: "sources", id: "sources", sources: demoSources },
  ]
}

export function initialConversation(): ChatMessage[] {
  return [
    {
      id: "initial-user",
      role: "user",
      createdAt: "2026-10-19T09:41:00Z",
      parts: [
        {
          type: "text",
          id: "request",
          text: "Review the release. Check the chat interactions and prepare a small patch if anything needs attention.",
        },
      ],
    },
    {
      id: "initial-assistant",
      role: "assistant",
      createdAt: "2026-10-19T09:41:02Z",
      parts: reviewParts(),
    },
  ]
}
