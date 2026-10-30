import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"
import type {
  AgentCompanionState,
  AgentPose,
  AgentShape,
} from "./agent-companion-motion"

const repoRoot = fileURLToPath(new URL("../", import.meta.url))
const localRequire = createRequire(import.meta.url)
const modules = new Map<string, Record<string, unknown>>()

// Node's test runner cannot load TSX or the app's @/ alias directly.
function loadModule<T>(relativePath: string): T {
  const filename = resolve(repoRoot, relativePath)
  const cached = modules.get(filename)
  if (cached) return cached as T
  const compiled = { exports: {} as Record<string, unknown> }
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  })
  new Function("require", "module", "exports", outputText)(
    (specifier: string): unknown =>
      specifier.startsWith("@/")
        ? loadModule(`${specifier.slice(2)}.ts`)
        : localRequire(specifier),
    compiled,
    compiled.exports
  )
  modules.set(filename, compiled.exports)
  return compiled.exports as T
}

const {
  agentShapes,
  agentPose,
  agentIdleDurations,
  agentCycleDurations,
  agentGestureDurations,
  resolveAgentShape,
} = loadModule<typeof import("./agent-companion-motion")>(
  "lib/agent-companion-motion.ts"
)
const { AgentCharacterArt } = loadModule<
  typeof import("../components/ui/agent-character-art")
>("components/ui/agent-character-art.tsx")
const states: readonly AgentCompanionState[] = ["idle", "working", "sleeping"]
const workingDetails: Record<AgentShape, readonly string[]> = {
  "lavender-bot": ["work-scan"],
  "orange-bot": ["work-idea-a", "work-idea-b"],
  "pink-cat": [
    "work-paw-left",
    "work-paw-right",
    "work-key-left",
    "work-key-right",
  ],
  "lime-bloom": ["work-seed-a", "work-seed-b"],
}

// Compare positions rather than angle strings: 0 and 360 degrees are the same pose.
function transformPoint(
  transform: string | number | undefined,
  point: readonly [number, number]
): [number, number] {
  let [x, y] = point
  const operations = [
    ...String(transform ?? "").matchAll(/([a-z]+)\(([^)]*)\)/gi),
  ]
  for (const [, operation, rawValues] of operations.reverse()) {
    const values = rawValues
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    switch (operation) {
      case "matrix": {
        const [a, b, c, d, e, f] = values
        ;[x, y] = [a * x + c * y + e, b * x + d * y + f]
        break
      }
      case "translate":
        x += values[0]
        y += values[1] ?? 0
        break
      case "rotate": {
        const [degrees, cx = 0, cy = 0] = values
        const angle = (degrees * Math.PI) / 180
        const dx = x - cx
        const dy = y - cy
        x = cx + dx * Math.cos(angle) - dy * Math.sin(angle)
        y = cy + dx * Math.sin(angle) + dy * Math.cos(angle)
        break
      }
      case "scale":
        x *= values[0]
        y *= values[1] ?? values[0]
        break
      default:
        assert.fail(`Unsupported SVG transform: ${operation}`)
    }
  }
  return [x, y]
}

function layerSchema(pose: AgentPose): [string, string[]][] {
  return Object.entries(pose).map(([part, attributes]) => [
    part,
    Object.keys(attributes),
  ])
}

test("the four Figma characters preserve legacy shape aliases", () => {
  assert.deepEqual(agentShapes, [
    "lavender-bot",
    "orange-bot",
    "pink-cat",
    "lime-bloom",
  ])
  assert.equal(resolveAgentShape("pebble"), "lavender-bot")
  assert.equal(resolveAgentShape("arch"), "pink-cat")
  assert.equal(resolveAgentShape("satellite"), "lime-bloom")
  for (const shape of agentShapes) assert.equal(resolveAgentShape(shape), shape)
})

test("each character has the approved state and gesture timings", () => {
  assert.equal(
    new Set(Object.values(agentIdleDurations)).size,
    agentShapes.length
  )
  for (const shape of agentShapes) {
    assert.ok(agentIdleDurations[shape] >= 5 && agentIdleDurations[shape] <= 7)
  }
  assert.deepEqual(agentCycleDurations, {
    "lavender-bot": 3.8,
    "orange-bot": 3.2,
    "pink-cat": 3.6,
    "lime-bloom": 4.2,
  })
  assert.deepEqual(agentGestureDurations, {
    "lavender-bot": 0.9,
    "orange-bot": 1.2,
    "pink-cat": 1,
    "lime-bloom": 0.95,
  })
})

for (const shape of agentShapes) {
  for (const state of states) {
    const label = `${shape}/${state}`
    test(`${label}: deterministic finite poses target real internal SVG layers`, () => {
      const markup = renderToStaticMarkup(
        createElement(
          "svg",
          { viewBox: "0 0 113 113" },
          createElement(AgentCharacterArt, {
            shape,
            state,
            id: label.replace("/", "-"),
          })
        )
      )
      const layers = [...markup.matchAll(/data-agent-part="([^"]+)"/g)].map(
        (match) => match[1]
      )
      assert.equal(
        layers.length,
        new Set(layers).size,
        "Painter names must be unique"
      )
      const original = agentPose(shape, state)
      const period =
        state === "idle"
          ? agentIdleDurations[shape]
          : state === "sleeping"
            ? 4
            : agentCycleDurations[shape]
      assert.doesNotMatch(markup.match(/<svg\b[^>]*>/)![0], /\btransform=/)
      assert.doesNotMatch(markup, /<(?:image|canvas|script)\b/)
      for (let step = 0; step <= 40; step += 1) {
        const time = (step / 40) * period
        for (const gesture of [0, 0.2, 0.45, 0.7, 1]) {
          const gaze = { x: 2, y: -1 }
          const pose = agentPose(shape, state, time, gesture, gaze)
          assert.deepEqual(pose, agentPose(shape, state, time, gesture, gaze))
          assert.deepEqual(layerSchema(pose), layerSchema(original))
          for (const [part, attributes] of Object.entries(pose)) {
            assert.ok(layers.includes(part), `Missing SVG layer ${part}`)
            assert.notEqual(part, "root", "Root SVG must stay stationary")
            for (const [attribute, value] of Object.entries(attributes)) {
              if (typeof value === "number") assert.ok(Number.isFinite(value))
              else assert.doesNotMatch(value, /NaN|Infinity|undefined/)
              if (attribute === "opacity")
                assert.ok(Number(value) >= 0 && Number(value) <= 1)
            }
          }
        }
      }
      assert.deepEqual(
        agentPose(shape, state, period),
        original,
        "State loop must wrap cleanly"
      )
    })

    test(`${label}: completed gestures restore the current state rather than an idle pose`, () => {
      for (const time of [0, 0.38, 1.73, 4.46]) {
        const gaze = { x: -1.5, y: 0.5 }
        assert.deepEqual(
          agentPose(shape, state, time, 1, gaze),
          agentPose(shape, state, time, 0, gaze)
        )
      }
    })

    test(`${label}: static expression conveys the selected state without motion`, () => {
      const pose = agentPose(shape, state)
      const sleeping = state === "sleeping"
      const scanning = shape === "lavender-bot" && state === "working"
      const horizontal = shape === "lavender-bot" || shape === "lime-bloom"
      assert.equal(pose["normal-eyes"].opacity, sleeping || scanning ? 0 : 1)
      assert.equal(
        pose["alternate-eyes"].opacity,
        scanning || (sleeping && horizontal) ? 1 : 0
      )
      if (shape === "orange-bot") assert.equal(pose["star-eyes"].opacity, 0)
      if (shape === "orange-bot" || shape === "pink-cat") {
        assert.equal(pose["sleeping-eyes"].opacity, sleeping ? 1 : 0)
      }
      if (shape === "lavender-bot") {
        assert.equal(pose.visor.opacity, scanning ? 1 : 0)
        assert.equal(pose.screen.opacity, scanning ? 0 : 1)
      }
    })
  }

  test(`${shape}: Ready looks around, moves its body parts, and blinks without user input`, () => {
    const duration = agentIdleDurations[shape]
    const original = agentPose(shape, "idle")
    const nonEyeParts = new Set<string>()
    const gazeX: number[] = []
    const eyeScaleY: number[] = []
    for (let step = 0; step <= 200; step += 1) {
      const pose = agentPose(shape, "idle", (step / 200) * duration)
      const [x] = String(pose.gaze.transform)
        .slice(10, -1)
        .split(" ")
        .map(Number)
      gazeX.push(x)
      eyeScaleY.push(
        Number(String(pose["eye-left"].transform).slice(7, -1).split(" ")[3])
      )
      for (const [part, attributes] of Object.entries(pose)) {
        if (
          !part.includes("eye") &&
          part !== "gaze" &&
          JSON.stringify(attributes) !== JSON.stringify(original[part])
        ) {
          nonEyeParts.add(part)
        }
      }
    }
    assert.ok(Math.min(...gazeX) < -1, "Idle should look left on its own")
    assert.ok(Math.max(...gazeX) > 1, "Idle should look right on its own")
    assert.ok(
      Math.min(...eyeScaleY) < 0.15,
      "Idle should include a complete blink"
    )
    assert.ok(nonEyeParts.size > 0, "Idle should move more than the eyes")
    assert.deepEqual(agentPose(shape, "idle", duration), original)
    assert.deepEqual(agentPose(shape, "idle", duration * 2), original)
  })

  test(`${shape}: reduced-motion Resting uses closed eyes without a smile or hover expression`, () => {
    const pose = agentPose(shape, "sleeping")
    assert.equal(pose["normal-eyes"].opacity, 0)
    if (shape === "orange-bot" || shape === "pink-cat") {
      assert.equal(pose["sleeping-eyes"].opacity, 1)
      assert.equal(
        pose["alternate-eyes"].opacity,
        0,
        "Happy eyes must not substitute for sleep"
      )
    } else {
      assert.equal(pose["alternate-eyes"].opacity, 1)
    }
    if (shape === "lavender-bot") {
      assert.equal(
        pose.visor.opacity,
        0,
        "Resting must not show the active green visor"
      )
    }
    const markup = renderToStaticMarkup(
      createElement(
        "svg",
        null,
        createElement(AgentCharacterArt, {
          shape,
          state: "sleeping",
          id: `resting-${shape}`,
        })
      )
    )
    const eyePart =
      shape === "orange-bot" || shape === "pink-cat"
        ? "sleeping-eyes"
        : "alternate-eyes"
    assert.match(
      markup,
      new RegExp(`data-agent-part="${eyePart}"[^>]*opacity="1"`)
    )
  })

  test(`${shape}: working and greeting change several internal parts`, () => {
    const changed = (
      state: AgentCompanionState,
      greeting: boolean
    ): Set<string> => {
      const base = agentPose(shape, state)
      const parts = new Set<string>()
      for (let step = 1; step < 20; step += 1) {
        const fraction = step / 20
        const pose = agentPose(
          shape,
          state,
          greeting ? 0 : fraction * agentCycleDurations[shape],
          greeting ? fraction : 0
        )
        for (const [part, attributes] of Object.entries(pose)) {
          if (JSON.stringify(attributes) !== JSON.stringify(base[part]))
            parts.add(part)
        }
      }
      return parts
    }
    assert.ok(
      changed("working", false).size >= 2,
      "Working must move multiple parts"
    )
    assert.ok(
      changed("idle", true).size >= 2,
      "Greeting must move multiple parts"
    )
  })

  test(`${shape}: work details appear only during an active Working cycle`, () => {
    for (const part of workingDetails[shape]) {
      assert.equal(agentPose(shape, "working")[part].opacity, 0)
      const opacitySamples: number[] = []
      for (let step = 0; step <= 100; step += 1) {
        const time = (step / 100) * agentCycleDurations[shape]
        opacitySamples.push(
          Number(agentPose(shape, "working", time)[part].opacity)
        )
        for (const state of ["idle", "sleeping"] as const) {
          for (const gesture of [0, 0.3, 0.75, 1]) {
            assert.equal(
              agentPose(shape, state, time, gesture)[part].opacity,
              0,
              `${part} must remain hidden in ${state}, including during a greeting`
            )
          }
        }
      }
      assert.ok(
        Math.max(...opacitySamples) > 0.2,
        `${part} should become visible`
      )
      assert.ok(
        new Set(opacitySamples).size > 3,
        `${part} should fade smoothly`
      )
    }
  })

  test(`${shape}: Working positions and opacity remain continuous through the loop seam`, () => {
    const period = agentCycleDurations[shape]
    const original = agentPose(shape, "working")
    const anchors = [
      [0, 0],
      [56.5, 56.5],
      [113, 113],
    ] as const
    for (const time of [period * 0.00001, period * 0.99999]) {
      const pose = agentPose(shape, "working", time)
      for (const [part, attributes] of Object.entries(original)) {
        if ("transform" in attributes) {
          for (const anchor of anchors) {
            const before = transformPoint(attributes.transform, anchor)
            const after = transformPoint(pose[part].transform, anchor)
            assert.ok(
              Math.hypot(after[0] - before[0], after[1] - before[1]) < 0.025,
              `${part} must not jump as the clock wraps`
            )
          }
        }
        if ("opacity" in attributes) {
          assert.ok(
            Math.abs(Number(attributes.opacity) - Number(pose[part].opacity)) <
              0.001,
            `${part} must not flash as the clock wraps`
          )
        }
      }
    }
  })

  test(`${shape}: gaze affects Ready only`, () => {
    assert.notEqual(
      agentPose(shape, "idle", 0, 0, { x: 2, y: 1 }).gaze.transform,
      agentPose(shape, "idle").gaze.transform
    )
    for (const state of ["working", "sleeping"] as const) {
      assert.deepEqual(
        agentPose(shape, state, 0.4, 0, { x: 2, y: 1 }),
        agentPose(shape, state, 0.4)
      )
    }
  })
}

test("Working gives all four bodies distinct two-axis floating paths", () => {
  const trajectories = new Set<string>()
  for (const shape of agentShapes) {
    const points = Array.from({ length: 81 }, (_, step) => {
      const pose = agentPose(
        shape,
        "working",
        (step / 80) * agentCycleDurations[shape]
      )
      return transformPoint(pose.body.transform, [56.5, 56.5])
    })
    const xs = points.map(([x]) => x)
    const ys = points.map(([, y]) => y)
    assert.ok(
      Math.max(...xs) - Math.min(...xs) > 0.5,
      `${shape} should sway sideways`
    )
    assert.ok(
      Math.max(...ys) - Math.min(...ys) > 1,
      `${shape} should rise and settle`
    )
    trajectories.add(
      JSON.stringify(
        points.map((point) => point.map((value) => Number(value.toFixed(3))))
      )
    )
  }
  assert.equal(
    trajectories.size,
    agentShapes.length,
    "Each character needs its own flight path"
  )
})

test("repeated artwork instances have unique gradient and mask references", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "svg",
      null,
      ...[...agentShapes, ...agentShapes].map((shape, index) =>
        createElement(AgentCharacterArt, {
          key: index,
          id: `agent-${index}`,
          shape,
          state: "idle",
        })
      )
    )
  )
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length)
  for (const match of markup.matchAll(/url\(#([^\)]+)\)/g)) {
    assert.ok(ids.includes(match[1]), `Unresolved reference ${match[1]}`)
  }
})
