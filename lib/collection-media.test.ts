import assert from "node:assert/strict"
import test from "node:test"
const { clampMediaValue, comparisonPosition } = (await import(
  new URL("./collection-media.ts", import.meta.url).href
)) as typeof import("./collection-media")

test("media levels reject non-finite values and stay within their range", () => {
  assert.equal(clampMediaValue(NaN), 0)
  assert.equal(clampMediaValue(Infinity), 0)
  assert.equal(clampMediaValue(-1), 0)
  assert.equal(clampMediaValue(2), 1)
  assert.equal(clampMediaValue(0.4), 0.4)
})

test("comparison tracks the pointer without overshooting either image edge", () => {
  assert.equal(comparisonPosition(150, 100, 200), 25)
  assert.equal(comparisonPosition(50, 100, 200), 0)
  assert.equal(comparisonPosition(500, 100, 200), 100)
  assert.equal(comparisonPosition(100, 100, 0), 50)
  assert.equal(comparisonPosition(100, 100, -10), 50)
  assert.equal(comparisonPosition(NaN, 100, 200), 0)
})
