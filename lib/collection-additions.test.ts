import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import ts from "typescript"
import type { CatalogEntry } from "./catalog"

const root = process.cwd()
const source = readFileSync(
  path.join(root, "lib/collection-additions.ts"),
  "utf8"
)
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const data = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
)
const entries: readonly CatalogEntry[] = data.collectionEntries

test("published usage examples typecheck against the actual component APIs", () => {
  const config = ts.readConfigFile(
    path.join(root, "tsconfig.json"),
    ts.sys.readFile
  )
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const examples = new Map(
    entries.map((entry) => [
      path.join(root, "__catalog_usage__", `${entry.id}.tsx`),
      entry.installation.usage,
    ])
  )
  const options = { ...parsed.options, noEmit: true, incremental: false }
  const host = ts.createCompilerHost(options)
  const read = host.readFile.bind(host)
  const exists = host.fileExists.bind(host)
  host.readFile = (file) => examples.get(path.normalize(file)) ?? read(file)
  host.fileExists = (file) => examples.has(path.normalize(file)) || exists(file)
  host.getSourceFile = (file, languageVersion) => {
    const contents = host.readFile(file)
    return contents === undefined
      ? undefined
      : ts.createSourceFile(file, contents, languageVersion, true)
  }
  const program = ts.createProgram([...examples.keys()], options, host)
  const errors = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  assert.equal(
    errors.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    })
  )
})

test("source-copy instructions include existing files and their local imports", () => {
  for (const entry of entries) {
    assert.equal(entry.installation.kind, "source")
    if (entry.installation.kind !== "source") continue
    const listed = new Set(entry.installation.files)
    for (const file of listed) {
      assert.ok(
        existsSync(path.join(root, file)),
        `${entry.id}: missing ${file}`
      )
      if (!/\.tsx?$/.test(file)) continue
      const contents = readFileSync(path.join(root, file), "utf8")
      for (const match of contents.matchAll(/\bfrom\s*["'](@\/[^"']+)["']/g)) {
        const stem = match[1].slice(2)
        const imported = [
          stem,
          `${stem}.ts`,
          `${stem}.tsx`,
          `${stem}/index.ts`,
          `${stem}/index.tsx`,
        ].find((candidate) => existsSync(path.join(root, candidate)))
        assert.ok(imported, `${entry.id}: unresolved ${match[1]}`)
        assert.ok(
          listed.has(imported),
          `${entry.id}: source instructions omit ${imported}`
        )
      }
    }
  }
})

test("every new catalog destination is unique, complete, and routable", () => {
  assert.equal(entries.length, 15)
  assert.deepEqual(
    new Set(entries.map((entry) => entry.id)),
    new Set(data.collectionIds)
  )
  assert.equal(new Set(entries.map((entry) => entry.href)).size, entries.length)
  for (const entry of entries) {
    assert.equal(entry.href, `/components/${entry.id}`)
    assert.equal(entry.preview, entry.id)
    assert.ok(["effects", "ai-agents", "components"].includes(entry.group))
    assert.ok(entry.description && entry.summary && entry.installation.usage)
  }
})
