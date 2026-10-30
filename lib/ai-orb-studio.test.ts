import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import test from "node:test"
import ts from "typescript"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const frameSource = await readFile(
  new URL("./ai-orb-frames.ts", import.meta.url),
  "utf8"
)
const frames = ts.transpileModule(frameSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const { AI_ORB_LOOKS, AI_ORB_VARIANTS }: typeof import("./ai-orb-frames") =
  await import(
    `data:text/javascript;base64,${Buffer.from(frames).toString("base64")}`
  )
const source = await readFile(
  new URL("./ai-orb-studio.ts", import.meta.url),
  "utf8"
)
const output = ts
  .transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    '"./ai-orb-frames"',
    JSON.stringify(
      `data:text/javascript;base64,${Buffer.from(frames).toString("base64")}`
    )
  )
const {
  orbStudioCode,
  orbStudioPresets,
  orbStudioLook,
}: typeof import("./ai-orb-studio") = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
)
const requirePackage = createRequire(import.meta.url)

test("every gallery state/variant survives a Studio URL round trip", () => {
  for (const look of AI_ORB_LOOKS) {
    const query = new URLSearchParams({
      state: look.state,
      variant: look.variant,
    })
    const selected = orbStudioLook(query.get("state"), query.get("variant"))
    assert.equal(selected.state, look.state)
    assert.equal(selected.variant ?? "default", look.variant)
  }
})

test("Studio links safely default missing, invalid, and incompatible selections", () => {
  assert.deepEqual(orbStudioLook(null, null), { state: "orchestrating" })
  for (const state of ["unknown", "__proto__", "constructor"]) {
    assert.deepEqual(orbStudioLook(state, "gyro"), { state: "orchestrating" })
  }
  assert.deepEqual(orbStudioLook("waiting", "gyro"), { state: "waiting" })
  assert.deepEqual(orbStudioLook("working", null), { state: "working" })
  assert.deepEqual(orbStudioLook("orchestrating", "default"), {
    state: "orchestrating",
  })
})

test("Studio presets use valid state/variant pairs and supported settings", () => {
  for (const { settings } of orbStudioPresets) {
    const variants: readonly string[] = AI_ORB_VARIANTS[settings.look.state]
    assert.ok(variants.includes(settings.look.variant ?? "default"))
    assert.ok(settings.density >= 0.5 && settings.density <= 1.5)
    assert.ok(settings.dotSize >= 0.6 && settings.dotSize <= 1.6)
    assert.ok(settings.tilt >= -30 && settings.tilt <= 60)
  }
})

for (const presentation of ["badge", "inline", "orb"] as const) {
  test(`${presentation}: exported React code renders every look with the selected appearance and correct semantics`, () => {
    for (const look of AI_ORB_LOOKS) {
      const settings = {
        look,
        size: "md" as const,
        speed: 1.35,
        density: 1.2,
        dotSize: 0.8,
        tilt: 40,
        presentation,
      }
      const generated = orbStudioCode(settings)
      const compiled = ts.transpileModule(generated, {
        reportDiagnostics: true,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
      })
      assert.equal(compiled.diagnostics?.length ?? 0, 0)
      let received: Record<string, unknown> | undefined
      const compiledModule = {
        exports: {} as { Example: () => ReturnType<typeof createElement> },
      }
      new Function("require", "exports", "module", compiled.outputText)(
        (name: string): unknown => {
          if (name === "@/components/ui/ai-orb")
            return {
              AiOrb: (props: Record<string, unknown>) => {
                received = props
                return createElement("span", { "data-orb": props.state })
              },
            }
          if (name === "@/components/ui/badge")
            return {
              Badge: ({ children, ...props }: { children: React.ReactNode }) =>
                createElement("span", props, children),
            }
          return requirePackage(name)
        },
        compiledModule.exports,
        compiledModule
      )
      const html = renderToStaticMarkup(
        createElement(compiledModule.exports.Example)
      )
      assert.deepEqual(received, {
        state: look.state,
        variant: look.variant,
        size: settings.size,
        speed: settings.speed,
        density: settings.density,
        dotSize: settings.dotSize,
        tilt: settings.tilt,
        ...(presentation === "orb" ? {} : { decorative: true }),
      })
      if (presentation === "badge") assert.match(html, /rounded-full/)
      if (look.state === "orchestrating" && presentation !== "orb")
        assert.match(html, /Coordinating tasks/)
      assert.doesNotMatch(generated, /Pause|Resume|thinking-orbs-studio/)
    }
  })
}
