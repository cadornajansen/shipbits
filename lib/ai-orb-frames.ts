import type { Dot, ModeFrame, OrbFrame } from "thinking-orbs"

export const AI_ORB_VARIANTS = {
  base: ["default"],
  working: ["default", "gyro"],
  reasoning: ["default", "twins"],
  searching: ["default", "lighthouse"],
  background: ["default", "spiral"],
  retrying: ["default", "surge"],
  compacting: ["default", "squeeze", "fuse"],
  waiting: ["default"],
  orchestrating: ["default"],
  idle: ["default"],
  thinking: ["default"],
  streaming: ["default"],
  error: ["default"],
} as const
export type AiOrbState = keyof typeof AI_ORB_VARIANTS
export type AiOrbVariant<S extends AiOrbState = AiOrbState> =
  (typeof AI_ORB_VARIANTS)[S][number]
export type AiOrbLook = {
  [S in AiOrbState]: { state: S; variant?: AiOrbVariant<S> }
}[AiOrbState]
export const AI_ORB_STATES = Object.keys(AI_ORB_VARIANTS) as AiOrbState[]
export const AI_ORB_NAMES: Record<AiOrbState, string> = {
  base: "Base",
  working: "Working",
  reasoning: "Reasoning",
  searching: "Searching",
  background: "Background",
  retrying: "Retrying",
  compacting: "Compacting",
  waiting: "Waiting",
  orchestrating: "Orchestrating",
  idle: "Idle",
  thinking: "Thinking",
  streaming: "Streaming",
  error: "Error",
}
export const AI_ORB_LABELS: Record<AiOrbState, string> = {
  base: "Assistant is ready",
  working: "Assistant is working",
  reasoning: "Assistant is reasoning",
  searching: "Assistant is searching",
  background: "Assistant is working in the background",
  retrying: "Assistant is retrying",
  compacting: "Assistant is compacting context",
  waiting: "Assistant is waiting",
  orchestrating: "Assistant is coordinating tasks",
  idle: "Assistant is ready",
  thinking: "Assistant is thinking",
  streaming: "Assistant is writing the answer",
  error: "Assistant ran into an error",
}
export const AI_ORB_LOOKS = [
  { state: "base", variant: "default", title: "Base" },
  { state: "working", variant: "default", title: "Working" },
  { state: "working", variant: "gyro", title: "Working · Gyro" },
  { state: "reasoning", variant: "default", title: "Reasoning" },
  { state: "reasoning", variant: "twins", title: "Reasoning · Twins" },
  { state: "searching", variant: "default", title: "Searching" },
  {
    state: "searching",
    variant: "lighthouse",
    title: "Searching · Lighthouse",
  },
  { state: "background", variant: "default", title: "Background" },
  { state: "background", variant: "spiral", title: "Background · Spiral" },
  { state: "retrying", variant: "default", title: "Retrying" },
  { state: "retrying", variant: "surge", title: "Retrying · Surge" },
  { state: "compacting", variant: "default", title: "Compacting" },
  { state: "compacting", variant: "squeeze", title: "Compacting · Squeeze" },
  { state: "compacting", variant: "fuse", title: "Compacting · Fuse" },
  { state: "waiting", variant: "default", title: "Waiting" },
  { state: "orchestrating", variant: "default", title: "Orchestrating" },
] as const satisfies readonly (AiOrbLook & { title: string })[]

const TAU = Math.PI * 2
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
type Vec3 = readonly [number, number, number]
type Seed = {
  id: number
  home: Vec3
  phase: number
  rate: number
  group: number
  tangent: Vec3
}
export type OrbParticle = Dot & { id: number }
export type OrbParticleFrame = Omit<OrbFrame, "dots"> & { dots: OrbParticle[] }
type Accent = { light: number; grow: number }
type Definition = {
  period: number
  layout?: "sparse" | "spiral"
  yaw?: (time: number) => number
  tilt?: (time: number) => number
  roll?: (time: number) => number
  point?: (seed: Seed, time: number) => Vec3
  accent?: (seed: Seed, point: Vec3, time: number, count: number) => Accent
}
export type AiOrbAppearance = {
  density?: number
  dotSize?: number
  tilt?: number
}
export function normalizeOrbAppearance(
  input: AiOrbAppearance = {}
): Required<AiOrbAppearance> {
  const number = (
    value: number | undefined,
    fallback: number,
    min: number,
    max: number
  ): number =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback
  return {
    density: number(input.density, 1, 0.5, 1.5),
    dotSize: number(input.dotSize, 1, 0.6, 1.6),
    tilt: number(input.tilt, 12, -30, 60),
  }
}
const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value))
const mod = (value: number, period: number): number =>
  ((value % period) + period) % period
const hash = (value: number): number =>
  mod(Math.sin(value * 127.1 + 17.3) * 43758.5453, 1)
const mix = (a: number, b: number, t: number): number => a + (b - a) * t
function smooth(value: number): number {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}
function between(time: number, start: number, end: number): number {
  return smooth((time - start) / (end - start))
}
function blend(a: Vec3, b: Vec3, t: number): Vec3 {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}
function multiply(p: Vec3, amount: number): Vec3 {
  return [p[0] * amount, p[1] * amount, p[2] * amount]
}
function rotate(p: Vec3, yaw: number, tilt = 0, roll = 0): Vec3 {
  const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw)
  const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw)
  const y = p[1] * Math.cos(tilt) - z * Math.sin(tilt)
  const depth = p[1] * Math.sin(tilt) + z * Math.cos(tilt)
  return [
    x * Math.cos(roll) - y * Math.sin(roll),
    x * Math.sin(roll) + y * Math.cos(roll),
    depth,
  ]
}
function bezier(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
  const u = 1 - t
  return [0, 1, 2].map(
    (axis) =>
      u ** 3 * a[axis] +
      3 * u * u * t * b[axis] +
      3 * u * t * t * c[axis] +
      t ** 3 * d[axis]
  ) as unknown as Vec3
}

// Bound caches while Studio explores different particle densities.
const seeds = new Map<string, readonly Seed[]>()
function particles(count: number, spiral = false): readonly Seed[] {
  const key = count + (spiral ? ":spiral" : ":sphere")
  const cached = seeds.get(key)
  if (cached) return cached
  const result = Array.from({ length: count }, (_, id): Seed => {
    const y = 1 - (2 * (id + 0.5)) / count
    const radius = Math.sqrt(1 - y * y)
    const angle = spiral ? ((id % 8) * TAU) / 8 + y * 3.2 : id * GOLDEN
    const home: Vec3 = [radius * Math.cos(angle), y, radius * Math.sin(angle)]
    return {
      id,
      home,
      phase: hash(id + 1) * TAU,
      rate: 0.7 + hash(id + 71) * 0.9,
      group: id % 4,
      tangent: [-Math.sin(angle), 0, Math.cos(angle)],
    }
  })
  if (seeds.size >= 12) seeds.delete(seeds.keys().next().value!)
  seeds.set(key, result)
  return result
}

const routes = new Map<number, readonly (readonly number[])[]>()
function reasoningRoutes(count: number): readonly (readonly number[])[] {
  const cached = routes.get(count)
  if (cached) return cached
  const points = particles(count)
  const nearest = points.map((p) =>
    points
      .filter((q) => p.id !== q.id)
      .sort(
        (a, b) =>
          distanceSquared(p.home, a.home) - distanceSquared(p.home, b.home)
      )
      .slice(0, 10)
      .map((q) => q.id)
  )
  const walks = [0, Math.floor(count / 2)].map((start, walker) => {
    const path = [start]
    for (let step = 0; step < 48; step += 1) {
      const current = path[path.length - 1]
      const choices = nearest[current].filter(
        (id) => !path.slice(-6).includes(id)
      )
      const next = (choices.length ? choices : nearest[current])[
        Math.floor(
          hash(step + walker * 83) * (choices.length || nearest[current].length)
        )
      ]
      path.push(next)
    }
    return [...path, ...path.slice(1, -1).reverse()]
  })
  if (routes.size >= 12) routes.delete(routes.keys().next().value!)
  routes.set(count, walks)
  return walks
}
function distanceSquared(a: Vec3, b: Vec3): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}
function reasoningAccent(
  seed: Seed,
  _point: Vec3,
  time: number,
  count: number,
  twins = false
): Accent {
  const walks = reasoningRoutes(count)
  const step = time / 0.22
  let spark = 0
  for (let walker = 0; walker < (twins ? 2 : 1); walker += 1) {
    const path = walks[walker]
    for (let tail = 0; tail < 6; tail += 1) {
      const id = path[mod(Math.floor(step) - tail, path.length)]
      if (id === seed.id)
        spark = Math.max(
          spark,
          tail === 0
            ? smooth(mod(step, 1))
            : clamp(1 - (tail - 1 + mod(step, 1)) / 5)
        )
    }
  }
  return { light: 0.32 + spark * 0.68, grow: 1 + spark * 0.9 }
}

function workingAccent(_seed: Seed, p: Vec3, time: number): Accent {
  const cycle = mod(time, 1.7)
  const at = mix(1.25, -1.25, smooth(cycle / 1.2))
  const q = p[1] * 0.85 + p[2] * 0.5 - p[0] * 0.12
  const glow =
    cycle < 1.2
      ? Math.exp(-Math.pow((q - at) / 0.18, 2)) *
        between(cycle, 0, 0.12) *
        (1 - between(cycle, 1.05, 1.2))
      : 0
  return { light: 0.68 + 0.32 * glow, grow: 1 + 0.55 * glow }
}
function gyroPoint(seed: Seed, time: number): Vec3 {
  return rotate(seed.home, Math.sin((TAU * time) / 2.6) * seed.home[1] * 0.75)
}
function searchAccent(_seed: Seed, p: Vec3, time: number): Accent {
  const step = Math.floor(time / 1.8)
  const t = smooth(clamp(mod(time, 1.8) / 0.72))
  const spot = (i: number): Vec3 => {
    const angle = i * 2.45
    return [Math.cos(angle) * 0.55, Math.sin(angle) * 0.5, 0.75]
  }
  const lens = blend(spot(step), spot(step + 1), t)
  const glow = Math.exp(-distanceSquared(p, lens) / 0.18)
  return { light: 0.35 + 0.65 * glow, grow: 1 + 0.85 * glow }
}
function lighthouseAccent(_seed: Seed, p: Vec3, time: number): Accent {
  const offset =
    mod(
      Math.atan2(p[0] - p[1] * 0.5, p[2]) - (TAU * time) / 2.5 + Math.PI,
      TAU
    ) - Math.PI
  const beam =
    offset < 0 ? clamp(1 + offset / 1.5) : Math.exp(-Math.pow(offset / 0.28, 2))
  return { light: 0.3 + 0.7 * beam, grow: 1 + 0.6 * beam }
}
function retryYaw(time: number): number {
  const cycle = 3.2,
    lap = Math.floor(time / cycle),
    t = mod(time, cycle)
  const advance = 2.1,
    back = 1.25
  const angle =
    t < 2
      ? t
      : t < 2.2
        ? 2 + 0.1 * (1 - (1 - (t - 2) / 0.2) ** 2)
        : t < 3
          ? advance - back * smooth((t - 2.2) / 0.8)
          : advance - back + 0.1 * ((t - 3) / 0.2) ** 2
  return ((lap * (advance - back + 0.1) + angle) * TAU) / 3
}
function surgeYaw(time: number): number {
  const cycle = time / 3.25
  return (Math.floor(cycle) + 1 - (1 - mod(cycle, 1)) ** 3) * TAU
}
function compression(seed: Seed, time: number, fuse = false): number {
  const cycle = mod(time, 2.8)
  const sweep = mix(-1.2, 1.2, clamp(cycle / 2))
  const release =
    cycle < 2
      ? 1
      : fuse
        ? (1 - (cycle - 2) / 0.8) ** 3
        : Math.exp((-5 * (cycle - 2)) / 0.8) *
            Math.cos((TAU * (cycle - 2)) / 0.8) -
          ((cycle - 2) / 0.8) * Math.exp(-5)
  return between(sweep - seed.home[0], -0.12, 0.16) * release
}
function compactPoint(seed: Seed, time: number): Vec3 {
  return multiply(seed.home, 1 - 0.28 * compression(seed, time))
}
function fusePoint(seed: Seed, time: number): Vec3 {
  return multiply(seed.home, 1 - 0.2 * compression(seed, time, true))
}
function squeezePoint(seed: Seed, time: number): Vec3 {
  const squeeze = (1 - Math.cos((TAU * time) / 2.6)) / 2
  const p = rotate(seed.home, seed.home[1] * squeeze * 1.4)
  return [p[0] * (1 + 0.08 * squeeze), p[1] * (1 - 0.35 * squeeze), p[2]]
}
function fuseAccent(seed: Seed, p: Vec3, time: number): Accent {
  const at = mix(-1.2, 1.2, clamp(mod(time, 2.8) / 2))
  const glow =
    Math.exp(-Math.pow((seed.home[0] - at) / 0.13, 2)) * clamp(p[2] + 0.3)
  return {
    light: 0.8 - compression(seed, time, true) * 0.35 + glow * 0.2,
    grow: 1 - compression(seed, time, true) * 0.25 + glow * 0.65,
  }
}
function waitingAccent(_seed: Seed, p: Vec3, time: number): Accent {
  const latitude = Math.sin((TAU * time) / 6) * 1.1
  const angle = (TAU * time) / 2
  const head: Vec3 = [
    Math.cos(latitude) * Math.cos(angle),
    Math.sin(latitude),
    Math.cos(latitude) * Math.sin(angle),
  ]
  const glow = Math.exp(-distanceSquared(p, head) / 0.09)
  const tail = Math.exp(-distanceSquared(p, rotate(head, -0.45)) / 0.2) * 0.4
  return { light: 0.35 + 0.65 * Math.max(glow, tail), grow: 1 + glow * 0.85 }
}

const CLUSTERS: readonly Vec3[] = [
  [0.48, 0.48, 0.48],
  [-0.48, -0.48, 0.48],
  [-0.48, 0.48, -0.48],
  [0.48, -0.48, -0.48],
]
function orchestratingPoint(seed: Seed, time: number): Vec3 {
  const t = mod(time, 12)
  const delay = hash(seed.id + 41) * 1.2
  const gather = between(t, 2 + delay, 4.5 + delay)
  const release = between(t, 8 + delay * 0.5, 10.8 + delay * 0.5)
  const join = gather * (1 - release)
  const wander = Math.sin((Math.PI * t) / 12) ** 2
  const angle = seed.phase + time * seed.rate
  const home = seed.home
  // A sparse shell maintains the globe silhouette while the interior organizes.
  if (seed.id % 7 === 0)
    return multiply(home, 1 + 0.025 * Math.sin(angle) * wander)
  const anchor = CLUSTERS[seed.group]
  // Retain an even local lattice so grouped dots do not collapse into a solid blob.
  const orbit = rotate(
    seed.home,
    time * (0.17 + seed.group * 0.025) + 0.14 * Math.sin(angle)
  )
  const target: Vec3 = [
    anchor[0] + orbit[0] * 0.3,
    anchor[1] + orbit[1] * 0.3,
    anchor[2] + orbit[2] * 0.3,
  ]
  const tangent = seed.tangent
  const controlA: Vec3 = [
    home[0] + tangent[0] * 0.3,
    home[1] + Math.sin(seed.phase) * 0.2,
    home[2] + tangent[2] * 0.3,
  ]
  const controlB: Vec3 = [
    target[0] - tangent[0] * 0.25,
    target[1] + Math.cos(seed.phase) * 0.18,
    target[2] - tangent[2] * 0.25,
  ]
  const path = bezier(home, controlA, controlB, target, smooth(join))
  const explore = (1 - join) * wander * 0.045
  return [
    path[0] + tangent[0] * Math.sin(angle) * explore,
    path[1] + Math.cos(angle * 0.8) * explore,
    path[2] + tangent[2] * Math.sin(angle) * explore,
  ]
}
function orchestratingAccent(seed: Seed, _p: Vec3, time: number): Accent {
  const message = mod(
    time / 1.8 - seed.group * 0.2 - hash(seed.id + 9) * 0.55,
    1
  )
  const offset = mod(message - 0.15 + 0.5, 1) - 0.5
  const pulse = Math.exp(-Math.pow(offset / 0.12, 2))
  return { light: 0.55 + pulse * 0.45, grow: 0.85 + pulse * 0.4 }
}

const DEFINITIONS = {
  base: { period: 6.5 },
  working: { period: 3, accent: workingAccent },
  "working-gyro": {
    period: 3,
    point: gyroPoint,
    tilt: (t: number) => 0.18 * Math.cos((TAU * t) / 5),
    roll: (t: number) => 0.2 * Math.sin((TAU * t) / 5),
  },
  reasoning: { period: 6.5, accent: reasoningAccent },
  "reasoning-twins": {
    period: 6.5,
    accent: (s: Seed, p: Vec3, t: number, n: number) =>
      reasoningAccent(s, p, t, n, true),
  },
  searching: { period: 13, accent: searchAccent },
  "searching-lighthouse": { period: 13, accent: lighthouseAccent },
  background: { period: 13, layout: "sparse" },
  "background-spiral": { period: 13, layout: "spiral" },
  retrying: { period: 4.5, yaw: retryYaw },
  "retrying-surge": { period: 3.25, yaw: surgeYaw },
  compacting: { period: 10, point: compactPoint },
  "compacting-squeeze": { period: 10, point: squeezePoint },
  "compacting-fuse": { period: 10, point: fusePoint, accent: fuseAccent },
  waiting: { period: 13, accent: waitingAccent },
  orchestrating: {
    period: 24,
    point: orchestratingPoint,
    accent: orchestratingAccent,
  },
  idle: {
    period: 0,
    point: (s: Seed, t: number) =>
      multiply(s.home, 0.96 + 0.03 * Math.sin((TAU * t) / 4)),
  },
  thinking: {
    period: 3.2,
    point: (s: Seed, t: number) =>
      rotate(s.home, ((TAU * t) / 3.2) * (s.home[1] > 0 ? 0.65 : -0.65)),
  },
  streaming: {
    period: 5.3,
    accent: (s: Seed, _p: Vec3, t: number) => ({
      light:
        0.5 +
        0.5 *
          ((1 + Math.cos(s.phase * 3 + s.home[1] * 5 - (TAU * t) / 2.4)) / 2) **
            3,
      grow: 1,
    }),
  },
  error: { period: 0 },
} satisfies Record<string, Definition>
export type OrbLookId = keyof typeof DEFINITIONS
export function orbLookId(
  state: AiOrbState,
  variant: AiOrbVariant = "default"
): OrbLookId {
  return (variant === "default" ? state : state + "-" + variant) as OrbLookId
}

function render(
  size: number,
  time: number,
  id: OrbLookId,
  appearance = normalizeOrbAppearance()
): OrbParticleFrame {
  const definition: Definition = DEFINITIONS[id]
  const t = id === "error" ? 0 : Math.max(0, Number.isFinite(time) ? time : 0)
  const normalCount = Math.round(
    (size >= 64 ? 280 : size >= 32 ? 132 : 64) * appearance.density
  )
  const count =
    definition.layout === "sparse" ? Math.round(normalCount / 4) : normalCount
  const points = particles(count, definition.layout === "spiral")
  const yaw =
    definition.yaw?.(t) ??
    (definition.period ? (TAU * t) / definition.period : 0.35)
  const tilt = (appearance.tilt * Math.PI) / 180 + (definition.tilt?.(t) ?? 0)
  const roll = definition.roll?.(t) ?? 0
  const dots: OrbParticle[] = []
  for (const seed of points) {
    const model = definition.point?.(seed, t) ?? seed.home
    const projected = rotate(model, yaw, tilt, roll)
    const length = Math.hypot(...projected)
    const p = length > 1.1 ? multiply(projected, 1.1 / length) : projected
    const depth = clamp((p[2] + 1) / 2)
    const accent = definition.accent?.(seed, p, t, count) ?? {
      light: 1,
      grow: 1,
    }
    if (
      id === "error" &&
      Math.abs(Math.sin(Math.atan2(p[1], p[0]) - 0.35)) < 0.18
    )
      continue
    const baseRadius = size >= 64 ? 0.95 : size >= 32 ? 0.72 : 0.55
    dots.push({
      id: seed.id,
      x: size / 2 + p[0] * size * 0.38,
      y: size / 2 + p[1] * size * 0.38,
      z: p[2],
      r: Math.max(
        0.35,
        baseRadius *
          (definition.layout === "sparse" ? 1.7 : 1) *
          (0.6 + 0.4 * depth) *
          accent.grow *
          appearance.dotSize
      ),
      white: 0.02 + 0.6 * Math.pow(1 - depth, 1.2),
      a: clamp((0.18 + 0.82 * depth) * accent.light),
    })
  }
  return { dots: dots.sort((a, b) => a.z - b.z || a.id - b.id), lines: [] }
}

export const AI_ORB_ANIMATIONS = Object.fromEntries(
  Object.keys(DEFINITIONS).map((id) => [
    id,
    (size: number, time: number): OrbParticleFrame =>
      render(size, time, id as OrbLookId),
  ])
) as Record<OrbLookId, (size: number, time: number) => OrbParticleFrame>
export const AI_ORB_FRAMES = Object.fromEntries<ModeFrame>(
  AI_ORB_STATES.map((state) => [state, AI_ORB_ANIMATIONS[state]])
) as Record<AiOrbState, ModeFrame>
export function orbFrameFor(
  state: AiOrbState,
  variant: AiOrbVariant = "default",
  appearance?: AiOrbAppearance
): ModeFrame {
  const id = orbLookId(state, variant)
  if (!appearance) return AI_ORB_ANIMATIONS[id] ?? AI_ORB_FRAMES[state]
  const normalized = normalizeOrbAppearance(appearance)
  return (size, time) =>
    render(size, time, id in DEFINITIONS ? id : state, normalized)
}
