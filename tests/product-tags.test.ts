import assert from "node:assert/strict"
import test from "node:test"

import {
  normalizeProductTags,
  normalizeTag,
  parseProductTags,
  toCanonicalProductTags,
  validateProductTags,
} from "../features/products/tags"

test("product tags trim, collapse whitespace, and preserve display casing", () => {
  assert.equal(normalizeTag("  AI   Tutor  "), "AI Tutor")
})

test("manual tag validation rejects empty, duplicate, category, and oversized tags", () => {
  const category = { name: "Developer Tools", slug: "developer-tools" }
  assert.match(validateProductTags(["CLI", "cli"], category) ?? "", /unique/)
  assert.match(validateProductTags(["developer-tools"], category) ?? "", /category/)
  assert.match(validateProductTags([" "], category) ?? "", /empty/)
  assert.match(validateProductTags(["x".repeat(31)], category) ?? "", /30/)
  assert.equal(validateProductTags(["CLI", "API testing"], category), null)
})

test("product tags deduplicate, reject category overlap, and cap at five", () => {
  assert.deepEqual(
    normalizeProductTags(
      ["Education", " flashcards ", "AI Tutor", "ai tutor", "notes", "quiz", "planner", "extra"],
      { name: "Education", slug: "education" }
    ),
    ["flashcards", "AI Tutor", "notes", "quiz", "planner"]
  )
})

test("generated tags remove generic filler and invalid lengths", () => {
  assert.deepEqual(
    normalizeProductTags(
      ["software", "SaaS", "app", "website", "API testing", "x".repeat(31)],
      null,
      { generated: true }
    ),
    ["API testing"]
  )
})

test("AI tags are limited to canonical discovery tags", () => {
  assert.deepEqual(
    toCanonicalProductTags([
      " ai assistants ",
      "API Testing",
      "SaaS",
      "flashcards",
      "Workflow Automation",
    ]),
    ["AI Assistants", "API Testing", "Workflow Automation"]
  )
})

test("serialized product tags parse safely", () => {
  assert.deepEqual(parseProductTags('["CLI","code generation"]'), ["CLI", "code generation"])
  assert.deepEqual(parseProductTags("invalid"), [])
})
