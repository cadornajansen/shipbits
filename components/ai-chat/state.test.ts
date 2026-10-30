import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"
import type { ChatMessage, ChatPart } from "./types"

const source = await readFile(new URL("./state.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
})
const state = (await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
)) as typeof import("./state")
const original: ChatMessage = {
  id: "a",
  role: "assistant",
  createdAt: "2026-10-19T00:00:00Z",
  parts: [
    { type: "text", id: "text", text: "Original" },
    {
      type: "approval",
      id: "approve",
      title: "Review",
      description: "A local change",
    },
  ],
}

test("retry preserves the original and selects the new response", () => {
  const next = state.addVersion(
    original,
    [{ type: "text", id: "alternate", text: "Alternative" }],
    "v2"
  )
  assert.equal(next.versions?.length, 2)
  assert.equal(next.activeVersion, 1)
  assert.equal(state.messageText(next), "Alternative")
  assert.equal(state.messageText({ ...next, activeVersion: 0 }), "Original")
  assert.equal(original.versions, undefined)
})

test("repeated retry appends versions without deleting earlier responses", () => {
  const next = state.addVersion(
    state.addVersion(original, [], "v2"),
    [{ type: "text", id: "t", text: "Third" }],
    "v3"
  )
  assert.equal(next.versions?.length, 3)
  assert.equal(state.messageText(next), "Third")
  assert.equal(state.messageText({ ...next, activeVersion: 0 }), "Original")
})

test("an approval resolves once and cannot be reversed by a duplicate callback", () => {
  const approved = state.decideApproval(original, "approve", "approved")
  const duplicate = state.decideApproval(approved, "approve", "rejected")
  const approval = state
    .activeParts(duplicate)
    .find((part) => part.type === "approval")
  assert.equal(approval?.decision, "approved")
  assert.equal(
    state.activeParts(original).find((part) => part.type === "approval")
      ?.decision,
    undefined
  )
})

test("approval modifies only the selected response version", () => {
  const next = state.addVersion(original, original.parts, "v2")
  const result = state.decideApproval(next, "approve", "rejected")
  assert.equal(
    result.versions?.[0].parts.find((part) => part.type === "approval")
      ?.decision,
    undefined
  )
  assert.equal(
    result.versions?.[1].parts.find((part) => part.type === "approval")
      ?.decision,
    "rejected"
  )
})

test("attachment limits accept the boundary and reject count or size overflow", () => {
  const bytes = 10 * 1024 * 1024
  assert.equal(
    state.validateAttachments(4, [{ name: "ok", size: bytes }]),
    null
  )
  assert.match(
    state.validateAttachments(5, [{ name: "extra", size: 1 }])!,
    /up to 5/
  )
  assert.match(
    state.validateAttachments(0, [{ name: "large.wav", size: bytes + 1 }])!,
    /large.wav/
  )
  assert.equal(
    state.validateAttachments(0, [{ name: "custom", size: 20 }], 1, 20),
    null
  )
})

test("avatars are stable, distinct, and have exactly 25 cells", () => {
  assert.deepEqual(
    state.avatarPixels("shipbits"),
    state.avatarPixels("shipbits")
  )
  assert.notDeepEqual(
    state.avatarPixels("shipbits"),
    state.avatarPixels("other")
  )
  assert.equal(state.avatarPixels("shipbits").length, 25)
  assert.ok(
    state
      .avatarPixels("")
      .every((value) => value >= 0 && Number.isInteger(value))
  )
})

test("unified diff hunks keep independent old/new line numbers", () => {
  const lines = state.parseDiff(
    "--- a/a.ts\n+++ b/a.ts\n@@ -8,2 +8,3 @@\n keep\n-old\n+new\n+more"
  )
  assert.deepEqual(lines[3], {
    kind: "context",
    text: "keep",
    oldLine: 8,
    newLine: 8,
  })
  assert.deepEqual(lines[4], { kind: "remove", text: "old", oldLine: 9 })
  assert.deepEqual(lines[5], { kind: "add", text: "new", newLine: 9 })
  assert.deepEqual(lines[6], { kind: "add", text: "more", newLine: 10 })
})

test("starting or cancelling a run invalidates every delayed update from the old run", async () => {
  const guard = state.createRunGuard()
  const oldRun = guard.next()
  let messages: ChatPart[] = []
  const staleUpdate = Promise.resolve().then(() => {
    if (guard.isCurrent(oldRun))
      messages = [{ type: "text", id: "stale", text: "Stale response" }]
  })
  const currentRun = guard.next()
  await staleUpdate
  assert.deepEqual(messages, [])
  assert.equal(guard.isCurrent(currentRun), true)
  guard.next()
  assert.equal(guard.isCurrent(currentRun), false)
})

test("built pack is self-contained with inline styles, global animation definitions, and demo", async () => {
  const registry = JSON.parse(
    await readFile(
      new URL("../../public/r/ai-chat.json", import.meta.url),
      "utf8"
    )
  ) as {
    files: { path: string; content: string; target: string }[]
    css: Record<string, unknown>
  }
  assert.equal(
    registry.files.some((file) => file.path.endsWith(".css")),
    false
  )
  for (const rule of [
    "@property --sb-chat-angle",
    "@keyframes sb-chat-beam",
    "@keyframes sb-chat-pulse",
    "@keyframes sb-chat-sweep",
    "@keyframes sb-chat-avatar",
  ])
    assert.ok(
      registry.css[rule],
      `Missing required registry animation: ${rule}`
    )
  assert.ok(
    registry.files.some((file) => file.path.endsWith("ai-chat/demo.tsx"))
  )
  for (const file of registry.files) {
    assert.doesNotMatch(
      file.content,
      /from ["'](?:next(?:\/[^"']*)?|@\/lib\/materials|@\/components\/site-)/
    )
    assert.ok(
      file.target.startsWith("@components/") || file.target.startsWith("@ui/")
    )
  }
})
