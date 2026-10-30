import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"
import type { AnimatedMonoIconName, MonoIconName } from "./mono-icons"
import type {
  IconAnimationDriver,
  IconPlaybackState,
} from "./mono-icon-playback"

const localRequire = createRequire(import.meta.url)
const repoRoot = fileURLToPath(new URL("../", import.meta.url))
const loadedModules = new Map<string, Record<string, unknown>>()

// Node's test runner does not understand TSX or this project's path alias.
function loadModule<T>(relativePath: string): T {
  const filename = resolve(repoRoot, relativePath)
  const cached = loadedModules.get(filename)
  if (cached) return cached as T
  const compiledModule = { exports: {} as Record<string, unknown> }
  loadedModules.set(filename, compiledModule.exports)
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  })
  function requireSource(specifier: string): unknown {
    if (specifier.startsWith(".")) {
      return loadModule(resolve(dirname(filename), `${specifier}.ts`))
    }
    if (specifier.startsWith("@/"))
      return loadModule(`${specifier.slice(2)}.ts`)
    return localRequire(specifier)
  }
  new Function("require", "module", "exports", outputText)(
    requireSource,
    compiledModule,
    compiledModule.exports
  )
  return compiledModule.exports as T
}

const { monoIcons } =
  loadModule<typeof import("./mono-icons")>("lib/mono-icons.ts")
const { createIconPlayer } = loadModule<typeof import("./mono-icon-playback")>(
  "lib/mono-icon-playback.ts"
)
const motion = loadModule<typeof import("./mono-icon-motion")>(
  "lib/mono-icon-motion.ts"
)
const { MonoIcon } = loadModule<typeof import("../components/ui/mono-icon")>(
  "components/ui/mono-icon.tsx"
)

const cycleDurations = {
  home: 0.35,
  pen: 0.9,
  folder: 0.85,
  work: 0.95,
  user: 0.9,
  mic: 1.05,
  search: 0.9,
  settings: 1,
  bell: 0.95,
  mail: 1,
  calendar: 0.9,
  coffee: 1.1,
  location: 0.9,
  image: 1.1,
  book: 0.95,
  agents: 0.9,
  clock: 1.2,
  light: 1.1,
  touch: 0.95,
  layers: 1.25,
  "motion-path": 1.4,
} satisfies Record<MonoIconName, number>

const animatedNames = Object.keys(
  motion.iconAnimations
) as AnimatedMonoIconName[]

type Task = {
  cancelled: boolean
  finish: () => void
  update?: (value: number) => void
}

function setup(
  name: AnimatedMonoIconName,
  viewed = new Set<AnimatedMonoIconName>(),
  stagger = 0
) {
  const tasks: Task[] = []
  const durations: number[] = []
  const delays: number[] = []
  let progress = 0
  let state: IconPlaybackState = "idle"
  function queue(
    complete: () => void,
    update?: (value: number) => void,
    to = 0
  ): () => void {
    const task: Task = {
      cancelled: false,
      update,
      finish: () => {
        update?.(to)
        complete()
      },
    }
    tasks.push(task)
    return () => {
      task.cancelled = true
    }
  }
  const driver: IconAnimationDriver = {
    paint: (value) => {
      progress = value
    },
    state: (value) => {
      state = value
    },
    delay: (milliseconds, complete) => {
      delays.push(milliseconds)
      return queue(complete)
    },
    tween: (_, to, seconds, __, update, complete) => {
      durations.push(seconds)
      return queue(complete, update, to)
    },
  }
  return {
    player: createIconPlayer(name, viewed, driver, stagger),
    tasks,
    durations,
    delays,
    viewed,
    get progress() {
      return progress
    },
    get state() {
      return state
    },
    finish: () => {
      tasks.at(-1)!.finish()
    },
    finishIntroduction: () => {
      tasks.at(-1)!.finish()
      if (name === "home") {
        tasks.at(-1)!.finish() // Brief hold, then return.
        tasks.at(-1)!.finish()
      }
    },
  }
}

for (const name of animatedNames) {
  test(`${name}: introduction uses its duration and survives remounts until reload`, () => {
    const run = setup(name)
    assert.equal(run.tasks.length, 0)
    run.player.setVisible(true)
    assert.equal(run.durations[0], cycleDurations[name])
    run.finishIntroduction()
    assert.equal(run.state, "idle")
    assert.equal(run.progress, 0)
    assert.deepEqual([...run.viewed], [name])
    const completedTaskCount = run.tasks.length
    run.player.setVisible(false)
    run.player.setVisible(true)
    assert.equal(run.tasks.length, completedTaskCount)
    run.player.destroy()
    const remount = setup(name, run.viewed)
    remount.player.setVisible(true)
    assert.equal(remount.tasks.length, 0)
    const reload = setup(name)
    reload.player.setVisible(true)
    assert.equal(reload.tasks.length, 1)
  })

  test(`${name}: interrupted introductions reset, reject stale callbacks, and retry`, () => {
    const run = setup(name)
    run.player.setVisible(true)
    run.tasks[0].update?.(0.4)
    run.player.setVisible(false)
    assert.equal(run.progress, 0)
    assert.ok(run.tasks[0].cancelled)
    run.tasks[0].finish()
    assert.equal(run.viewed.size, 0)
    assert.equal(run.progress, 0)
    run.player.setVisible(true)
    assert.equal(run.tasks.length, 2)
    run.finishIntroduction()
    assert.ok(run.viewed.has(name))
  })

  test(`${name}: unmount stops active animation and rejects its late completion`, () => {
    const run = setup(name)
    run.player.setVisible(true)
    run.player.destroy()
    run.tasks[0].finish()
    run.player.setVisible(true)
    run.player.setActive(true)
    assert.equal(run.tasks.length, 1)
    assert.equal(run.viewed.size, 0)
    assert.equal(run.progress, 0)
    assert.equal(run.state, "idle")
  })

  if (name !== "home") {
    test(`${name}: pointer exit finishes the cycle; rapid re-entry never stacks runs`, () => {
      const run = setup(name, new Set([name]))
      run.player.setVisible(true)
      for (let index = 0; index < 8; index += 1) {
        run.player.setActive(true)
        run.player.setActive(false)
      }
      assert.equal(run.tasks.length, 1)
      assert.equal(run.tasks[0].cancelled, false)
      run.finish()
      assert.equal(run.state, "idle")
      assert.equal(run.progress, 0)
      run.player.setActive(true)
      assert.equal(run.tasks.length, 2)
    })
  }
}

test("Home introduces, holds for 180ms, then returns over 300ms", () => {
  const run = setup("home")
  run.player.setVisible(true)
  run.finish()
  assert.equal(run.progress, 1)
  assert.deepEqual(run.delays, [180])
  run.finish()
  assert.equal(run.state, "returning")
  assert.equal(run.durations.at(-1), 0.3)
  run.finish()
  assert.equal(run.progress, 0)
  assert.ok(run.viewed.has("home"))
})

test("Home interaction takes over and reverses a return without stale resets", () => {
  const run = setup("home")
  run.player.setVisible(true)
  run.tasks[0].update?.(0.5)
  run.player.setActive(true)
  assert.ok(run.tasks[0].cancelled)
  run.finish()
  assert.equal(run.state, "held")
  assert.equal(run.progress, 1)
  run.player.setActive(false)
  const returning = run.tasks.at(-1)!
  returning.update?.(0.4)
  run.player.setActive(true)
  returning.finish()
  assert.equal(run.progress, 0.4)
  run.finish()
  assert.equal(run.state, "held")
  run.player.setActive(false)
  run.finish()
  assert.equal(run.progress, 0)
})

test("unmount cancels homepage stagger timers and their late callbacks", () => {
  const run = setup("folder", new Set(), 160)
  run.player.setVisible(true)
  assert.equal(run.state, "scheduled")
  assert.deepEqual(run.delays, [160])
  run.player.destroy()
  run.finish()
  assert.equal(run.tasks.length, 1)
  assert.equal(run.progress, 0)
  assert.equal(run.viewed.size, 0)
})

test("completed memory is per icon, not per card or collection", () => {
  const viewed = new Set<AnimatedMonoIconName>(["home"])
  const seen = setup("home", viewed)
  const unseen = setup("pen", viewed)
  seen.player.setVisible(true)
  unseen.player.setVisible(true)
  assert.equal(seen.tasks.length, 0)
  assert.equal(unseen.tasks.length, 1)
})

type SvgShape = { tag: string; attributes: Record<string, string> }

function shapes(markup: string): Map<string, SvgShape> {
  const result = new Map<string, SvgShape>()
  for (const match of markup.matchAll(
    /<(path|rect|circle|ellipse|polygon|polyline|line)\b([^>]*)>/g
  )) {
    const attributes = Object.fromEntries(
      [...match[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1],
        attribute[2],
      ])
    )
    const name = attributes["data-part"]
    if (name) result.set(name, { tag: match[1], attributes })
  }
  return result
}

const rendered = new Map(
  monoIcons.map(({ name }) => [
    name,
    renderToStaticMarkup(createElement(MonoIcon, { name })),
  ])
)

for (const { name } of monoIcons) {
  test(`${name}: static React geometry matches its framework-independent SVG`, () => {
    const raw = readFileSync(
      resolve(repoRoot, `public/icons/mono/${name}.svg`),
      "utf8"
    )
    const staticShapes = shapes(rendered.get(name)!)
    for (const [part, original] of shapes(raw)) {
      assert.deepEqual(staticShapes.get(part), original, `${name}/${part}`)
    }
    assert.doesNotMatch(raw, /<(?:animate\w*|script|style|image)\b/)
    assert.match(raw, /viewBox="0 0 24 24"/)
    assert.doesNotMatch(
      rendered.get(name)!.match(/<svg\b[^>]*>/)![0],
      /\btransform=/
    )
  })
}

function primitiveSignatures(markup: string): string[] {
  return [
    ...markup.matchAll(
      /<(path|rect|circle|ellipse|polygon|polyline|line)\b([^>]*)>/g
    ),
  ].map(([, tag, attributes]) => {
    const geometry = [...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)]
      .map(([, name, value]) => [name, value])
      .filter(([name]) => name !== "id" && name !== "data-part")
      .sort(([left], [right]) => left.localeCompare(right))
    return JSON.stringify([tag, geometry])
  })
}

for (const name of [
  "clock",
  "light",
  "touch",
  "layers",
  "motion-path",
] as const) {
  test(`${name}: download primitives remain intact in React, including unlabelled shapes`, () => {
    const raw = readFileSync(
      resolve(repoRoot, `public/icons/mono/${name}.svg`),
      "utf8"
    )
    const available = primitiveSignatures(rendered.get(name)!)
    const originals = primitiveSignatures(raw)
    assert.ok(
      originals.length > 1,
      "The download must contain real SVG geometry"
    )
    for (const signature of originals) {
      const index = available.indexOf(signature)
      assert.notEqual(
        index,
        -1,
        `${name} changed or omitted an original primitive: ${signature}`
      )
      available.splice(index, 1)
    }
    assert.doesNotMatch(
      raw,
      /fill="(?:white|#fff(?:fff)?)"/i,
      "Do not reintroduce Figma's white frame"
    )
    assert.doesNotMatch(
      raw,
      /touch-echo|motion-trace/,
      "Downloads exclude animation-only layers"
    )
  })
}

for (const name of animatedNames) {
  test(`${name}: poses keep stable layers, finite attributes, and exact resting geometry`, () => {
    const definition = motion.iconAnimations[name]
    const rest = definition.pose(0)
    const shape = (pose: typeof rest) =>
      Object.entries(pose).map(([part, attributes]) => [
        part,
        Object.keys(attributes),
      ])
    assert.equal(definition.duration, cycleDurations[name])
    assert.ok(Object.keys(rest).length >= 2, "Animate individual layers")
    assert.ok(!Object.hasOwn(rest, name), "Do not move the icon's root group")
    if (name !== "home") assert.deepEqual(definition.pose(1), rest)
    let moved = false
    for (let step = 0; step <= 20; step += 1) {
      const progress = step / 20
      const pose = definition.pose(progress)
      assert.deepEqual(
        pose,
        definition.pose(progress),
        "Pose must be deterministic"
      )
      assert.deepEqual(shape(pose), shape(rest))
      if (JSON.stringify(pose) !== JSON.stringify(rest)) moved = true
      for (const attributes of Object.values(pose)) {
        for (const value of Object.values(attributes)) {
          if (typeof value === "number") assert.ok(Number.isFinite(value))
          else assert.doesNotMatch(value, /NaN|Infinity|undefined/)
        }
      }
    }
    assert.ok(moved, "The icon must visibly change during its cycle")
  })

  test(`${name}: painter targets existing internal layers without changing the SVG root`, () => {
    const parts = new Map<string, Map<string, string>>()
    for (const match of rendered.get(name)!.matchAll(/data-part="([^"]+)"/g)) {
      parts.set(match[1], new Map())
    }
    let queries = 0
    const svg = {
      setAttribute: () => assert.fail("Root SVG must stay stationary"),
      querySelector: (selector: string) => {
        queries += 1
        const match = /^\[data-part="([^"]+)"\]$/.exec(selector)
        assert.ok(match, "Only named internal layers may be selected")
        const attributes = parts.get(match[1])
        assert.ok(attributes, `${name} is missing layer ${match[1]}`)
        return {
          setAttribute: (key: string, value: string) =>
            attributes.set(key, value),
        }
      },
    } as unknown as SVGSVGElement
    const paint = motion.createIconPainter(svg, name)
    const cachedQueries = queries
    paint(0.3)
    paint(0.8)
    paint(0)
    assert.equal(queries, cachedQueries, "Layer references should be cached")
    for (const [part, attributes] of Object.entries(
      motion.iconAnimations[name].pose(0)
    )) {
      assert.deepEqual(
        Object.fromEntries(parts.get(part)!),
        Object.fromEntries(
          Object.entries(attributes).map(([key, value]) => [key, String(value)])
        )
      )
    }
  })
}

test("every catalog icon has an explicit animation definition", () => {
  assert.deepEqual(
    new Set(animatedNames),
    new Set(monoIcons.map(({ name }) => name))
  )
})

test("Agents only moves its eye layers, staggers blinks, and returns to the original pose", () => {
  const animation = motion.iconAnimations.agents
  const rest = animation.pose(0)
  const leftPeak = animation.pose(0.42)
  assert.deepEqual(Object.keys(rest), [
    "agent-eyes",
    "agent-eye-left",
    "agent-eye-right",
  ])
  assert.deepEqual(rest, animation.pose(1))
  assert.notEqual(
    leftPeak["agent-eyes"].transform,
    rest["agent-eyes"].transform
  )
  const matrix = (transform: string | number): number[] =>
    String(transform).slice(7, -1).split(" ").map(Number)
  assert.ok(
    matrix(leftPeak["agent-eye-left"].transform)[3] <
      matrix(leftPeak["agent-eye-right"].transform)[3],
    "The left eye closes before the right eye"
  )
  for (let step = 0; step <= 100; step += 1) {
    const pose = animation.pose(step / 100)
    assert.ok(!Object.hasOwn(pose, "agent-body"), "Body must remain stationary")
    const [tx, ty] = String(pose["agent-eyes"].transform)
      .slice(10, -1)
      .split(" ")
      .map(Number)
    for (const [part, cx, cy, rx, ry] of [
      ["agent-eye-left", 14.2406, 11.522, 1.33246, 2.47424],
      ["agent-eye-right", 17.961, 10.6071, 1, 2],
    ] as const) {
      const [a, b, c, d, e, f] = matrix(pose[part].transform)
      const rotation = (-11.328 * Math.PI) / 180
      for (let sample = 0; sample < 24; sample += 1) {
        const angle = (sample * Math.PI) / 12
        const x =
          cx +
          rx * Math.cos(angle) * Math.cos(rotation) -
          ry * Math.sin(angle) * Math.sin(rotation)
        const y =
          cy +
          rx * Math.cos(angle) * Math.sin(rotation) +
          ry * Math.sin(angle) * Math.cos(rotation)
        const px = a * x + c * y + e + tx
        const py = b * x + d * y + f + ty
        assert.ok(px >= 0 && px <= 24 && py >= 0 && py <= 24)
      }
    }
  }
})

test("Home's front never narrows, tilts, shifts, or rotates during the depth reveal", () => {
  const yCoordinates = (path: string): number[] =>
    (path.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) ?? [])
      .map(Number)
      .filter((_, index) => index % 2 === 1)
  const original = motion.homePose(0)
  for (const progress of [0, 0.1, 0.35, 0.5, 0.8, 1]) {
    const pose = motion.homePose(progress)
    assert.equal(pose.front, "matrix(1 0 0 1 0 0)")
    assert.deepEqual(yCoordinates(pose.side), yCoordinates(original.side))
    assert.deepEqual(yCoordinates(pose.roof), yCoordinates(original.roof))
  }
  assert.equal(motion.homePose(0).opacity, 0)
  assert.equal(motion.homePose(1).opacity, 1)
  assert.notEqual(motion.homePose(1).side, motion.homePose(0).side)
})

test("Clock presses its crown before sweeping the hand around a fixed face", () => {
  const draw = motion.iconAnimations.clock.pose
  const rest = draw(0)
  const pressed = draw(0.13)
  assert.notEqual(
    pressed["clock-crown"].transform,
    rest["clock-crown"].transform
  )
  assert.equal(
    pressed["clock-minute"].transform,
    rest["clock-minute"].transform
  )
  assert.notEqual(
    draw(0.5)["clock-minute"].transform,
    rest["clock-minute"].transform
  )
  assert.ok(!Object.hasOwn(rest, "clock-face"))
})

test("Light sends its rays out sequentially while its base stays fixed", () => {
  const draw = motion.iconAnimations.light.pose
  const rest = draw(0)
  const early = draw(0.2)
  assert.notEqual(early["light-ray-1"].transform, rest["light-ray-1"].transform)
  assert.equal(early["light-ray-4"].transform, rest["light-ray-4"].transform)
  assert.notEqual(
    draw(0.5)["light-ray-4"].transform,
    rest["light-ray-4"].transform
  )
  assert.ok(!Object.hasOwn(rest, "light-base"))
})

test("Touch presses an anchored finger before emitting its second ripple", () => {
  const draw = motion.iconAnimations.touch.pose
  const rest = draw(0)
  const press = draw(0.2)
  assert.notEqual(
    press["touch-finger"].transform,
    rest["touch-finger"].transform
  )
  assert.equal(press["touch-echo"].opacity, 0)
  assert.ok(Number(draw(0.5)["touch-echo"].opacity) > 0)
  assert.ok(!Object.hasOwn(rest, "touch-palm"))
})

function translation(transform: string | number): number[] {
  const match = /^translate\(([-\d.]+) ([-\d.]+)\)$/.exec(String(transform))
  assert.ok(match, `Expected an internal translation, received ${transform}`)
  return [Number(match[1]), Number(match[2])]
}

test("Layers reorder independently without moving the guide or leaving the viewBox", () => {
  const draw = motion.iconAnimations.layers.pose
  const bounds = {
    "layer-left-top": [4, 7, 10, 10],
    "layer-left-middle": [7, 11, 10, 14],
    "layer-left-bottom": [3, 15, 10, 18],
    "layer-right-top": [14, 7, 18, 10],
    "layer-right-middle": [14, 11, 22, 14],
    "layer-right-bottom": [14, 15, 18, 18],
  } as const
  const peak = draw(0.55)
  assert.ok(translation(peak["layer-left-top"].transform)[1] > 0)
  assert.ok(translation(peak["layer-left-middle"].transform)[1] < 0)
  assert.ok(translation(peak["layer-right-bottom"].transform)[1] < 0)
  for (let step = 0; step <= 100; step += 1) {
    const pose = draw(step / 100)
    assert.ok(!Object.hasOwn(pose, "layer-guide"))
    for (const [name, [x1, y1, x2, y2]] of Object.entries(bounds)) {
      const [dx, dy] = translation(pose[name].transform)
      assert.ok(
        x1 + dx >= 0 && y1 + dy >= 0 && x2 + dx <= 24 && y2 + dy <= 24,
        name
      )
    }
  }
})

test("Motion path carries its dot through the curve and hides it before resetting", () => {
  const draw = motion.iconAnimations["motion-path"].pose
  let rightmost = 0
  let lowest = 0
  for (let step = 0; step <= 100; step += 1) {
    const pose = draw(step / 100)
    const [dx, dy] = translation(pose["motion-dot"].transform)
    const [x, y] = [3.5 + dx, 5.5 + dy]
    rightmost = Math.max(rightmost, x)
    lowest = Math.max(lowest, y)
    assert.ok(x - 1.5 >= 0 && x + 1.5 <= 24 && y - 1.5 >= 0 && y + 1.5 <= 24)
    assert.ok(!Object.hasOwn(pose, "motion-track"))
    assert.ok(Number(pose["motion-trace"]["stroke-dashoffset"]) >= 0)
    assert.ok(Number(pose["motion-trace"]["stroke-dashoffset"]) <= 1)
  }
  assert.ok(rightmost >= 20, "The dot reaches the endpoint")
  assert.ok(lowest > 16, "The dot follows the downward bounces")
  assert.equal(draw(0.89)["motion-dot"].opacity, 0)
  assert.equal(draw(0.9)["motion-dot"].opacity, 0)
  assert.notEqual(
    draw(0.89)["motion-dot"].transform,
    draw(0.9)["motion-dot"].transform
  )
})

test("Folder's hinged panel stays within the viewBox throughout its cycle", () => {
  for (let step = 0; step <= 100; step += 1) {
    const matrix = motion
      .folderPose(step / 100)
      .front.slice(7, -1)
      .split(" ")
      .map(Number)
    const [a, b, c, d, e, f] = matrix
    for (const [x, y] of [
      [2, 8],
      [22, 8],
      [2, 21],
      [22, 21],
    ]) {
      const px = a * x + c * y + e
      const py = b * x + d * y + f
      assert.ok(px >= 0 && px <= 24 && py >= 0 && py <= 24)
    }
  }
})

test("temporary SVG embellishments are invisible in the static and resting versions", () => {
  const addedParts = {
    home: ["home-depth"],
    mic: ["sound-wave-left", "sound-wave-right"],
    search: ["lens-reflection"],
    mail: ["letter"],
    coffee: ["steam-left", "steam-right"],
    touch: ["touch-echo"],
    "motion-path": ["motion-trace"],
  } as const
  for (const [name, parts] of Object.entries(addedParts)) {
    const iconName = name as AnimatedMonoIconName
    for (const part of parts) {
      const tag = rendered
        .get(iconName)!
        .match(new RegExp(`<[^>]+data-part="${part}"[^>]*>`))
      assert.ok(tag, `Missing ${name}/${part}`)
      assert.match(tag[0], /opacity="0"/)
      assert.equal(
        Number(motion.iconAnimations[iconName].pose(0)[part].opacity),
        0
      )
    }
  }
})

test("multiple instances keep every mask and clip reference unique and resolvable", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      ...[...monoIcons, ...monoIcons].map(({ name }, index) =>
        createElement(MonoIcon, { key: `${name}-${index}`, name })
      )
    )
  )
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length)
  for (const match of markup.matchAll(/url\(#([^\)]+)\)/g)) {
    assert.ok(ids.includes(match[1]), `Unresolved SVG reference: ${match[1]}`)
  }
})
