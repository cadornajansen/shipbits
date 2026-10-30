import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

async function loadModule(file: string): Promise<Record<string, unknown>> {
  const source = await readFile(new URL(file, import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  })
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  )
}
const art = (await loadModule(
  "./folder-art.ts"
)) as typeof import("./folder-art")
const geometry = (await loadModule(
  "./folder-geometry.ts"
)) as typeof import("./folder-geometry")

function paint(seed: number, rows: number): Uint8ClampedArray {
  const job = art.createArtJob(40, 32, art.ART_PRESETS.aurora, seed)
  while (!job.step(rows)) {
    /* Complete the same job in differently sized slices. */
  }
  return job.pixels
}

test("seeded artwork is deterministic regardless of frame slicing", () => {
  assert.deepEqual(paint(3, 1), paint(3, 100))
  assert.notDeepEqual(paint(3, 3), paint(4, 3))
  assert.ok(
    paint(3, 4).some((channel, index) => index % 4 !== 3 && channel > 0)
  )
  assert.ok(
    paint(3, 4).every((channel, index) => index % 4 !== 3 || channel === 255)
  )
})

test("artwork preserves recipes and bounds raster allocation", () => {
  const recipe = structuredClone(art.ART_PRESETS.ember)
  const before = structuredClone(recipe)
  const job = art.createArtJob(18, 14, recipe, 7)
  while (!job.step(4)) {
    /* Finish the job. */
  }
  assert.deepEqual(recipe, before)
  const bounded = art.createArtJob(9999, Infinity, recipe, 1)
  assert.equal(bounded.width, 512)
  assert.equal(bounded.height, 1)
  assert.equal(bounded.pixels.length, 512 * 4)
})

test("artwork cache evicts least recently used entries and never exceeds capacity", () => {
  const cache = new art.ArtworkCache<object>(2)
  const first = {},
    second = {},
    third = {}
  cache.set("first", first)
  cache.set("second", second)
  assert.equal(cache.get("first"), first)
  cache.set("third", third)
  assert.equal(cache.get("second"), undefined)
  assert.equal(cache.get("third"), third)
  assert.equal(cache.size, 2)
  for (let index = 0; index < 100; index++) cache.set(String(index), {})
  assert.equal(cache.size, 2)
  cache.delete("99")
  assert.equal(cache.size, 1)
  cache.set("shared", first)
  cache.set("shared", second)
  cache.delete("shared", first)
  assert.equal(cache.get("shared"), second)
  assert.throws(() => new art.ArtworkCache(0))
})

test("a single file stays centered and larger fans remain symmetric", () => {
  assert.equal(geometry.fanSlot(0, 0), 0)
  assert.equal(geometry.fanSlot(0, 1), 0)
  for (let count = 2; count <= geometry.MAX_VISIBLE_FILES; count++) {
    assert.equal(geometry.fanSlot(0, count), -1)
    assert.equal(geometry.fanSlot(count - 1, count), 1)
    for (let i = 0; i < count; i++)
      assert.ok(
        Math.abs(
          geometry.fanSlot(i, count) + geometry.fanSlot(count - 1 - i, count)
        ) < 1e-10
      )
  }
})

test("reserved frame contains the open fan including its jitter and rotation", () => {
  for (let index = 0; index < 4; index++) {
    const slot = geometry.fanSlot(index, 4)
    for (const jitterX of [-5, 5])
      for (const jitterAngle of [-1.6, 1.6]) {
        const angle = ((slot * 5 + jitterAngle) * Math.PI) / 180
        const originX = geometry.FOLDER_GUTTER + 34 + 136 + slot * 40 + jitterX
        const originY =
          geometry.FOLDER_HEADROOM + 96 - 96 - (3 - index) * 30 + 184
        for (const x of [-136, 136])
          for (const y of [-184, 0]) {
            const cornerX = originX + x * Math.cos(angle) - y * Math.sin(angle)
            const cornerY = originY + x * Math.sin(angle) + y * Math.cos(angle)
            assert.ok(cornerX >= 0 && cornerX <= geometry.FOLDER_FRAME_WIDTH)
            assert.ok(cornerY >= 0 && cornerY <= geometry.FOLDER_FRAME_HEIGHT)
          }
      }
  }
  for (const width of [240, 290, 354, 968]) {
    const scale = geometry.folderScale(width, 340)
    assert.ok(scale * geometry.FOLDER_FRAME_WIDTH <= width)
    assert.ok(scale <= 1)
  }
  assert.equal(geometry.folderScale(-1, 340), 0)
  assert.ok(Number.isFinite(geometry.folderScale(300, NaN)))
})

test("all three example exports are valid TSX with their required imports", async () => {
  const source = await readFile(
    new URL("../components/glass-folder-examples.tsx", import.meta.url),
    "utf8"
  )
  const constants = source.slice(
    source.indexOf("const projectFiles"),
    source.indexOf("function CopyCode")
  )
  const { outputText } = ts.transpileModule(
    constants + "\nexport { projectCode, archiveCode, smokedCode }",
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    }
  )
  const snippets: Record<string, string> = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  )
  for (const [name, snippet] of Object.entries(snippets)) {
    const file = ts.createSourceFile(
      `${name}.tsx`,
      snippet,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TSX
    )
    const diagnostics = (
      file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }
    ).parseDiagnostics
    assert.equal(diagnostics.length, 0, name)
    assert.ok(
      snippet.includes('from "@/components/ui/glass-folder-cards"'),
      name
    )
    assert.ok(!snippet.includes("undefined"), name)
  }
  assert.ok(snippets.projectCode.includes("onAdd="))
  assert.ok(snippets.archiveCode.includes("onOpenChange={setOpen}"))
  assert.ok(snippets.smokedCode.includes('"href": "/metal"'))
})
