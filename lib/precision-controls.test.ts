import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

const source = await readFile(
  new URL("./precision-controls.ts", import.meta.url),
  "utf8"
)
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const {
  snapValue,
  dialFraction,
  validateIntakeFile,
  counterCharacters,
}: typeof import("./precision-controls") = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
)

test("dial clamps and snaps decimal steps relative to the minimum", () => {
  assert.equal(snapValue(0.34, -0.3, 1, 0.1), 0.3)
  assert.equal(snapValue(100, 0, 10, 1), 10)
  assert.equal(snapValue(-9, 0, 10, 1), 0)
  assert.equal(snapValue(Number.NaN, 5, 10, 1), 5)
  assert.equal(snapValue(5, 0, 10, 0), 5)
})

test("dial pointer angles map endpoints and the dead zone consistently", () => {
  assert.equal(dialFraction(0, -1), 0.5)
  assert.equal(dialFraction(-1, 1), 0)
  assert.equal(dialFraction(1, 1), 1)
  assert.equal(dialFraction(-0.1, 1), 0)
  assert.equal(dialFraction(0.1, 1), 1)
})

test("intake validates size, MIME wildcards, exact MIME, and case-insensitive extensions", () => {
  const file = { name: "Photo.JPG", type: "image/jpeg", size: 1024 }
  assert.equal(validateIntakeFile(file, "image/*", 2048), undefined)
  assert.equal(validateIntakeFile(file, ".jpg,.png", 2048), undefined)
  assert.equal(validateIntakeFile(file, "image/jpeg", 2048), undefined)
  assert.match(
    validateIntakeFile(file, "application/pdf", 2048)!,
    /not supported/
  )
  assert.match(validateIntakeFile(file, "image/*", 512)!, /smaller/)
})

test("counter preserves place identities across the 999 to 1000 boundary", () => {
  const before = counterCharacters(999.9, 2)
  const after = counterCharacters(1000.1, 2)
  assert.equal(before.find((item) => item.key === "integer-0")?.character, "9")
  assert.equal(after.find((item) => item.key === "integer-0")?.character, "0")
  assert.equal(after.find((item) => item.key === "integer-3")?.character, "1")
  assert.deepEqual(
    before
      .filter((item) => item.key.startsWith("fraction"))
      .map((item) => item.key),
    after
      .filter((item) => item.key.startsWith("fraction"))
      .map((item) => item.key)
  )
})

test("counter handles negatives, fixed decimals, locale punctuation and nonfinite input", () => {
  assert.equal(
    counterCharacters(-1234.5, 2)
      .map((item) => item.character)
      .join(""),
    "-1,234.50"
  )
  assert.equal(
    counterCharacters(1234.5, 2, "de-DE")
      .map((item) => item.character)
      .join(""),
    "1.234,50"
  )
  assert.equal(
    counterCharacters(Infinity, 0)
      .map((item) => item.character)
      .join(""),
    "0"
  )
  assert.equal(
    counterCharacters(Number.NaN, Number.NaN)
      .map((item) => item.character)
      .join(""),
    "0.00"
  )
  assert.equal(
    new Set(counterCharacters(-1234.5, 2).map((item) => item.key)).size,
    counterCharacters(-1234.5, 2).length
  )
})
