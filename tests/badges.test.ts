import assert from "node:assert/strict"
import test from "node:test"

import {
  getVerifiedBadgePath,
  resolveBadgeVariant,
} from "../features/products/badges"
import { readFile } from "node:fs/promises"

test("badge variants allow only known values and otherwise use default", () => {
  assert.equal(resolveBadgeVariant("default"), "default")
  assert.equal(resolveBadgeVariant("monochrome"), "monochrome")
  assert.equal(resolveBadgeVariant("yellow"), "yellow")
  assert.equal(resolveBadgeVariant("mono"), "default")
  assert.equal(resolveBadgeVariant("YELLOW"), "default")
  assert.equal(resolveBadgeVariant(""), "default")
  assert.equal(resolveBadgeVariant(null), "default")
})

test("default badge URL stays clean while other variants use the query", () => {
  assert.equal(
    getVerifiedBadgePath("example", "default"),
    "/badges/listed/example.svg"
  )
  assert.equal(
    getVerifiedBadgePath("example", "monochrome"),
    "/badges/listed/example.svg?variant=monochrome"
  )
  assert.equal(
    getVerifiedBadgePath("example", "yellow"),
    "/badges/listed/example.svg?variant=yellow"
  )
})

test("all badge artwork templates remain available", async () => {
  for (const variant of ["default", "monochrome", "yellow"] as const) {
    const svg = await readFile(
      new URL(`../public/badges/${variant}.svg`, import.meta.url),
      "utf8"
    )
    assert.match(svg, /<svg\b/)
    assert.match(svg, /viewBox="0 0 254 54"/)
  }
})
