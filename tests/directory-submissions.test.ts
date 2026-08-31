import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import {
  directoryPlans,
  directoryProgress,
  planKeys,
} from "../features/directory-submissions/config"
import { matchDirectories } from "../features/directory-submissions/matching"
import { campaignCsv } from "../features/directory-submissions/report"
import type {
  Campaign,
  Directory,
} from "../features/directory-submissions/types"

const directory = (
  id: string,
  topics: string[],
  priority = 0,
  active = true
): Directory => ({
  id,
  slug: id,
  name: id,
  topics,
  priority,
  is_active: active,
  website_url: "https://example.com",
  submission_url: null,
  description: "",
  requires_account: null,
  requires_payment: null,
  requires_manual_review: true,
})

test("directory plans use the production prices and submission counts", () => {
  assert.deepEqual(
    planKeys.map((key) => [
      directoryPlans[key].priceCentavos,
      directoryPlans[key].targetCount,
    ]),
    [
      [19900, 10],
      [69900, 50],
      [149900, 100],
      [299900, 100],
    ]
  )
  assert.equal(directoryPlans.launch.popular, true)
  assert.equal(directoryPlans.done_for_you.priceSuffix, "+")
})
test("matching prioritizes relevant active directories then general options deterministically", () => {
  const catalog = [
    directory("general", ["general"], 99),
    directory("ai", ["ai"], 10),
    directory("developer", ["developer"]),
    directory("inactive", ["ai"], 99, false),
  ]
  assert.deepEqual(
    matchDirectories(catalog, "AI Tools", [], 2).map((item) => item.id),
    ["ai", "general"]
  )
  assert.deepEqual(
    matchDirectories(catalog, "Education", ["API Testing"], 2).map(
      (item) => item.id
    ),
    ["developer", "general"]
  )
  assert.deepEqual(
    matchDirectories(catalog, "Education", [], 100).map((item) => item.id),
    ["general"]
  )
  assert.equal(matchDirectories(catalog, "AI Tools", [], 0).length, 0)
  assert.deepEqual(
    matchDirectories(catalog, "AI Tools", [], 10, ["ai"]).map(
      (item) => item.id
    ),
    ["general"]
  )
})
test("matching respects every target and never duplicates excluded jobs", () => {
  const catalog = Array.from({ length: 150 }, (_, index) =>
    directory(`directory-${index}`, ["general"])
  )
  for (const key of planKeys)
    assert.equal(
      matchDirectories(catalog, "Other", [], directoryPlans[key].targetCount)
        .length,
      directoryPlans[key].targetCount
    )
})
test("progress counts processing jobs but not queued jobs", () => {
  const progress = directoryProgress(
    [
      ...Array.from({ length: 2 }, () => ({
        status: "processing" as const,
        submitted_at: null,
      })),
      ...Array.from({ length: 8 }, () => ({
        status: "queued" as const,
        submitted_at: null,
      })),
    ],
    10
  )
  assert.equal(progress.total, 10)
  assert.equal(progress.processed, 2)
  assert.equal(progress.percent, 20)
  assert.equal(progress.unassigned, 0)
})
test("progress counts every non-queued job except skipped", () => {
  const progress = directoryProgress(
    [
      { status: "live", submitted_at: "2026-08-31" },
      { status: "submitted", submitted_at: "2026-08-31" },
      { status: "needs_action", submitted_at: null },
      { status: "processing", submitted_at: null },
      { status: "skipped", submitted_at: null },
      { status: "rejected", submitted_at: null },
      { status: "queued", submitted_at: null },
    ],
    10
  )
  assert.equal(progress.total, 7)
  assert.equal(progress.processed, 5)
  assert.equal(progress.unassigned, 3)
  assert.equal(progress.counts.needs_action, 1)
  assert.equal(progress.counts.skipped, 1)
  assert.equal(progress.percent, 50)
})
test("progress handles zero targets and clamps percentages to 100", () => {
  const zeroTarget = directoryProgress([], 0)
  assert.equal(zeroTarget.total, 0)
  assert.equal(zeroTarget.processed, 0)
  assert.equal(zeroTarget.percent, 0)
  assert.ok(Number.isFinite(zeroTarget.percent))

  const overTarget = directoryProgress(
    Array.from({ length: 3 }, () => ({
      status: "processing" as const,
      submitted_at: null,
    })),
    2
  )
  assert.equal(overTarget.percent, 100)
})
test("seed contains 24 unique real-directory slugs and is an upsert", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260830170202_seed_directory_catalog.sql",
      import.meta.url
    ),
    "utf8"
  )
  const records = [...sql.matchAll(/^\('([^']+)','([^']+)','(https:[^']+)'/gm)]
  assert.equal(records.length, 24)
  assert.equal(
    new Set(records.map((record) => record[1].toLowerCase())).size,
    24
  )
  assert.equal(new Set(records.map((record) => record[2])).size, 24)
  for (const record of records)
    assert.match(record[2], /^[a-z0-9]+(-[a-z0-9]+)*$/)
  assert.match(sql, /on conflict\(slug\) do update/)
})
test("CSV escapes formulas, quotes, and never includes admin notes", () => {
  const campaign = {
    directory_submissions: [
      {
        directories: { name: '=HYPERLINK("bad")' },
        status: "needs_action",
        submitted_at: null,
        published_at: null,
        result_url: null,
        rejection_reason: null,
        action_required_message: "Verify email",
        admin_notes: "PRIVATE",
      },
    ],
  } as Campaign
  const csv = campaignCsv(campaign)
  assert.ok(csv.includes("'=HYPERLINK"))
  assert.ok(csv.includes('""bad""'))
  assert.ok(csv.includes("Verify email"))
  assert.ok(!csv.includes("PRIVATE"))
})
