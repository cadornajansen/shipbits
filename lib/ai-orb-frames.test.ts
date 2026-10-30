import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import test from "node:test"
import ts from "typescript"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const source = await readFile(
  new URL("./ai-orb-frames.ts", import.meta.url),
  "utf8"
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const frameExports: typeof import("./ai-orb-frames") = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
)
const {
  AI_ORB_FRAMES,
  AI_ORB_STATES,
  AI_ORB_LOOKS,
  AI_ORB_ANIMATIONS,
  orbLookId,
} = frameExports

for (const state of AI_ORB_STATES) {
  for (const size of [20, 32, 64]) {
    test(`${state} at ${size}px: deterministic, finite, depth-sorted, contained particles`, () => {
      for (let tick = 0; tick < 100; tick += 1) {
        const time = tick * 0.137
        const frame = AI_ORB_FRAMES[state](size, time, {})
        assert.deepEqual(frame, AI_ORB_FRAMES[state](size, time, {}))
        assert.ok(frame.dots.length > 10 && frame.dots.length < 300)
        assert.equal(frame.lines.length, 0)
        let previousDepth = -Infinity
        for (const dot of frame.dots) {
          assert.ok(Object.values(dot).every(Number.isFinite))
          assert.ok(dot.x - dot.r >= 0 && dot.x + dot.r <= size)
          assert.ok(dot.y - dot.r >= 0 && dot.y + dot.r <= size)
          assert.ok(dot.r > 0 && dot.a! >= 0 && dot.a! <= 1)
          assert.ok(dot.white >= 0 && dot.white <= 1)
          assert.ok(dot.z >= previousDepth)
          previousDepth = dot.z
        }
      }
    })
  }
  test(`${state}: small sizes reduce particle density`, () => {
    assert.ok(
      AI_ORB_FRAMES[state](20, 0, {}).dots.length <
        AI_ORB_FRAMES[state](64, 0, {}).dots.length
    )
  })
}

test("active states move; the error frame stays still", () => {
  for (const state of ["idle", "thinking", "streaming"] as const) {
    assert.notDeepEqual(
      AI_ORB_FRAMES[state](64, 0, {}),
      AI_ORB_FRAMES[state](64, 0.7, {})
    )
  }
  assert.deepEqual(
    AI_ORB_FRAMES.error(64, 0, {}),
    AI_ORB_FRAMES.error(64, 99, {})
  )
})

test("each state has distinct geometry", () => {
  const frames = AI_ORB_STATES.map((state) =>
    JSON.stringify(AI_ORB_FRAMES[state](64, 0.6, {}))
  )
  assert.equal(new Set(frames).size, AI_ORB_STATES.length)
})

for (const look of AI_ORB_LOOKS) {
  const id = orbLookId(look.state, look.variant)
  test(`${id}: complete animation stays finite and contained at all sizes`, () => {
    for (const size of [20, 32, 64]) {
      for (let step = 0; step < 128; step += 1) {
        const frame = AI_ORB_ANIMATIONS[id](size, step * 0.13)
        assert.ok(
          frame.dots.every((dot) => Object.values(dot).every(Number.isFinite))
        )
        assert.equal(
          new Set(frame.dots.map((dot) => dot.id)).size,
          frame.dots.length
        )
        for (const dot of frame.dots) {
          assert.ok(dot.x - dot.r >= 0 && dot.x + dot.r <= size)
          assert.ok(dot.y - dot.r >= 0 && dot.y + dot.r <= size)
          assert.ok(
            dot.a! >= 0 && dot.a! <= 1 && dot.white >= 0 && dot.white <= 1
          )
        }
      }
    }
  })
}

test("the gallery includes all 15 reference looks plus Orchestrating, with distinct sequences", () => {
  assert.equal(AI_ORB_LOOKS.length, 16)
  const signatures = AI_ORB_LOOKS.map((look) => {
    const draw = AI_ORB_ANIMATIONS[orbLookId(look.state, look.variant)]
    return JSON.stringify([0.6, 1.7, 3.4, 6.3].map((t) => draw(64, t)))
  })
  assert.equal(new Set(signatures).size, 16)
})

test("Studio appearance extremes remain finite and inside the canvas for every look and size", () => {
  for (const look of AI_ORB_LOOKS) {
    for (const size of [20, 32, 64]) {
      for (const density of [0.5, 1.5]) {
        for (const tilt of [-30, 60]) {
          const draw = frameExports.orbFrameFor(look.state, look.variant, {
            density,
            tilt,
            dotSize: 1.6,
          })
          for (const time of [0, 0.7, 2.4, 4.6, 6.5, 8.7, 11.8]) {
            for (const dot of draw(size, time, {}).dots) {
              assert.ok(Object.values(dot).every(Number.isFinite))
              assert.ok(dot.x - dot.r >= 0 && dot.x + dot.r <= size)
              assert.ok(dot.y - dot.r >= 0 && dot.y + dot.r <= size)
            }
          }
        }
      }
    }
  }
})

test("appearance normalization handles missing, invalid, and out-of-range values", () => {
  assert.deepEqual(frameExports.normalizeOrbAppearance(), {
    density: 1,
    dotSize: 1,
    tilt: 12,
  })
  assert.deepEqual(
    frameExports.normalizeOrbAppearance({
      density: NaN,
      dotSize: Infinity,
      tilt: -Infinity,
    }),
    { density: 1, dotSize: 1, tilt: 12 }
  )
  assert.deepEqual(
    frameExports.normalizeOrbAppearance({ density: 0, dotSize: 5, tilt: 90 }),
    { density: 0.5, dotSize: 1.6, tilt: 60 }
  )
})

test("appearance controls change actual particle count, radius, and projected coordinates, including static Error", () => {
  const draw = (appearance: import("./ai-orb-frames").AiOrbAppearance) =>
    frameExports.orbFrameFor("error", "default", appearance)(64, 0.6, {})
  const original = draw({})
  assert.ok(draw({ density: 1.5 }).dots.length > original.dots.length)
  const larger = draw({ dotSize: 1.6 })
  assert.ok(larger.dots.every((dot, index) => dot.r > original.dots[index].r))
  assert.notDeepEqual(draw({ tilt: 60 }), original)
})

function world(dot: import("./ai-orb-frames").OrbParticle): number[] {
  return [(dot.x - 32) / (64 * 0.38), (dot.y - 32) / (64 * 0.38), dot.z]
}
function separation(a: number[], b: number[]): number {
  return Math.hypot(...a.map((value, axis) => value - b[axis]))
}

test("Orchestrating keeps particle identities and gathers independently moving dots into four groups", () => {
  const start = AI_ORB_ANIMATIONS.orchestrating(64, 0).dots
  const grouped = AI_ORB_ANIMATIONS.orchestrating(64, 6.5).dots
  assert.deepEqual(
    start.map((p) => p.id).sort((a, b) => a - b),
    grouped.map((p) => p.id).sort((a, b) => a - b)
  )
  const averageWithin = (points: typeof start): number => {
    const group = points.filter((p) => p.id % 4 === 1 && p.id % 7 !== 0)
    let total = 0,
      pairs = 0
    for (let i = 0; i < group.length; i += 1)
      for (let j = i + 1; j < group.length; j += 1) {
        total += separation(world(group[i]), world(group[j]))
        pairs += 1
      }
    return total / pairs
  }
  assert.ok(averageWithin(grouped) < averageWithin(start) * 0.45)
  const returned = new Map(
    AI_ORB_ANIMATIONS.orchestrating(64, 12).dots.map((p) => [p.id, world(p)])
  )
  const p = start.find((p) => p.id === 1)!,
    q = start.find((p) => p.id === 5)!
  assert.ok(
    Math.abs(
      separation(world(p), world(q)) -
        separation(returned.get(1)!, returned.get(5)!)
    ) < 1e-10
  )
})

test("Orchestrating has continuous paths through the cycle seam", () => {
  const before = AI_ORB_ANIMATIONS.orchestrating(64, 12 - 0.001).dots
  const after = new Map(
    AI_ORB_ANIMATIONS.orchestrating(64, 12 + 0.001).dots.map((p) => [p.id, p])
  )
  assert.ok(
    before.every((p) => separation(world(p), world(after.get(p.id)!)) < 0.01)
  )
})

// @ts-expect-error A Gyro look is valid only for Working.
const invalidLook: import("./ai-orb-frames").AiOrbLook = {
  state: "waiting",
  variant: "gyro",
}
void invalidLook

test("error halo has two opposite gaps", () => {
  for (const point of AI_ORB_FRAMES.error(64, 0, {}).dots) {
    const angle = Math.atan2(point.y - 32, point.x - 32)
    assert.ok(Math.abs(Math.sin(angle - 0.35)) >= 0.18 - 1e-10)
  }
})

const requirePackage = createRequire(import.meta.url)
const componentSource = await readFile(
  new URL("../components/ui/ai-orb.tsx", import.meta.url),
  "utf8"
)
const compiledComponent = ts.transpileModule(componentSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const componentExports = {
  exports: {} as typeof import("../components/ui/ai-orb"),
}
new Function("require", "exports", "module", compiledComponent)(
  (name: string): unknown =>
    name === "@/lib/ai-orb-frames"
      ? frameExports
      : name === "@/lib/utils"
        ? requirePackage("cn")
        : requirePackage(name),
  componentExports.exports,
  componentExports
)
const { AiOrb } = componentExports.exports

for (const state of AI_ORB_STATES) {
  test(`${state}: server render has an accessible label and a stable box before canvas hydration`, () => {
    const html = renderToStaticMarkup(createElement(AiOrb, { state }))
    assert.match(html, /role="img"/)
    assert.ok(
      html.includes(`aria-label="${frameExports.AI_ORB_LABELS[state]}"`)
    )
    assert.match(html, /size-16/)
    assert.doesNotMatch(html, /<canvas/)
  })
}

test("decorative orbs hide redundant labels from assistive technology", () => {
  const html = renderToStaticMarkup(
    createElement(AiOrb, { state: "thinking", decorative: true, size: "sm" })
  )
  assert.match(html, /aria-hidden="true"/)
  assert.doesNotMatch(html, /aria-label=|role="img"/)
  assert.match(html, /size-5/)
})

test("custom accessible labels and standard span attributes pass through", () => {
  const html = renderToStaticMarkup(
    createElement(AiOrb, {
      state: "streaming",
      label: "Writing your draft",
      id: "draft-orb",
      size: "md",
    })
  )
  assert.match(html, /aria-label="Writing your draft"/)
  assert.match(html, /id="draft-orb"/)
  assert.match(html, /size-8/)
})

test("static thumbnail markup tolerates server/browser floating-point jitter", async () => {
  const thumbnailSource = await readFile(
    new URL("../components/thinking-orb-thumbnail.tsx", import.meta.url),
    "utf8"
  )
  const compiled = ts.transpileModule(thumbnailSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  function thumbnail(jitter: number): string {
    const output = {
      exports: {} as typeof import("../components/thinking-orb-thumbnail"),
    }
    new Function("require", "exports", "module", compiled)(
      (name: string): unknown =>
        name === "@/lib/ai-orb-frames"
          ? {
              AI_ORB_FRAMES: {
                thinking: () => ({
                  dots: AI_ORB_FRAMES.thinking(64, 0.6, {}).dots.map((dot) => ({
                    ...dot,
                    x: dot.x + jitter,
                    y: dot.y + jitter,
                    r: dot.r + jitter,
                    white: dot.white + jitter,
                  })),
                }),
              },
            }
          : requirePackage(name),
      output.exports,
      output
    )
    return renderToStaticMarkup(
      createElement(output.exports.ThinkingOrbThumbnail)
    )
  }
  assert.equal(thumbnail(0), thumbnail(1e-14))
})
