import type { AnimatedMonoIconName } from "./mono-icons"

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function easeBetween(time: number, start: number, end: number): number {
  const value = clamp((time - start) / (end - start))
  return value * value * (3 - 2 * value)
}

export function homePose(progress: number): {
  front: string
  side: string
  roof: string
  opacity: number
} {
  const depth = 1.7 * clamp(progress)
  // Keep the original front untouched; only the extrusion behind it changes.
  const point = (x: number, y: number, back = false): string =>
    `${x + (back ? depth : 0)} ${y}`
  return {
    front: "matrix(1 0 0 1 0 0)",
    side: `M${point(20, 10.16)}L${point(20, 10.16, true)}L${point(20, 17, true)}Q${point(20, 19, true)} ${point(18, 19, true)}L${point(18, 19)}Q${point(20, 19)} ${point(20, 17)}Z`,
    roof: `M${point(12, 3.4)}L${point(12, 3.4, true)}L${point(21.3, 9.9, true)}L${point(21.3, 9.9)}Z`,
    opacity: clamp(progress * 4),
  }
}

export function penPose(progress: number): {
  head: string
  inkOpacity: number
  inkWidth: number
} {
  const time = clamp(progress)
  if (time === 0 || time === 1) {
    return {
      head: "translate(0 0) rotate(0 8 18)",
      inkOpacity: 1,
      inkWidth: 4.2,
    }
  }
  const approach = easeBetween(time, 0, 0.18)
  const lower = easeBetween(time, 0.18, 0.28)
  const write = easeBetween(time, 0.28, 0.7)
  const settle = easeBetween(time, 0.7, 1)
  const x = (-3.1 * approach + 3.9 * write) * (1 - settle)
  const y =
    (-0.4 * approach + 1.6 * lower) * (1 - settle) -
    Math.sin(settle * Math.PI) * 0.7
  const rotation = (-8 * approach + 3 * lower + 5 * write) * (1 - settle)
  return {
    head: `translate(${x} ${y}) rotate(${rotation} 8 18)`,
    inkOpacity: time < 0.28 ? 1 - easeBetween(time, 0, 0.15) : 1,
    inkWidth: time < 0.28 ? 4.2 : 4.2 * write,
  }
}

export function folderPose(progress: number): { paper: string; front: string } {
  const time = clamp(progress)
  const open = easeBetween(time, 0, 0.38) * (1 - easeBetween(time, 0.55, 1))
  const lift =
    easeBetween(time, 0.07, 0.48) * (1 - easeBetween(time, 0.57, 0.95))
  const a = 1 + 0.06 * open
  const c = -0.1 * open
  const d = 1 - 0.24 * open
  // Keep the bottom center at (12, 21) while the front panel hinges outward.
  return {
    paper: `translate(${0.3 * lift} ${-1.7 * lift}) rotate(${-3 * lift} 12 18)`,
    front: `matrix(${a} 0 ${c} ${d} ${12 * (1 - a) - 21 * c} ${21 * (1 - d)})`,
  }
}

export type IconPose = Record<string, Record<string, string | number>>
type IconAnimation = { duration: number; pose: (progress: number) => IconPose }

function clean(value: number): number {
  return Number(value.toFixed(5)) || 0
}

function move(x: number, y = 0): string {
  return `translate(${clean(x)} ${clean(y)})`
}

function turn(angle: number, x: number, y: number): string {
  return `rotate(${clean(angle)} ${x} ${y})`
}

function scaleAt(x: number, y: number, sx: number, sy: number): string {
  return `matrix(${clean(sx)} 0 0 ${clean(sy)} ${clean(x * (1 - sx))} ${clean(y * (1 - sy))})`
}

function pulse(
  t: number,
  start: number,
  peak: number,
  release: number,
  end: number
): number {
  return easeBetween(t, start, peak) * (1 - easeBetween(t, release, end))
}

function cycle(
  draw: (progress: number) => IconPose
): (progress: number) => IconPose {
  // Completed cycles use exact initial attributes, avoiding accumulated drift.
  return (progress) => draw(progress >= 1 ? 0 : clamp(progress))
}

function workPose(t: number): IconPose {
  const lift = pulse(t, 0.05, 0.24, 0.48, 0.8)
  const left = pulse(t, 0.16, 0.34, 0.4, 0.7)
  const right = pulse(t, 0.24, 0.42, 0.5, 0.8)
  const settle = pulse(t, 0.58, 0.74, 0.74, 1)
  return {
    "work-handle": { transform: move(0, -0.75 * lift) },
    "work-front": { transform: move(0, 0.3 * settle) },
    "strap-left": {
      transform: `${move(0, -1.3 * left)} ${turn(-8 * left, 9, 12)}`,
    },
    "strap-right": {
      transform: `${move(0, -1.3 * right)} ${turn(8 * right, 15, 12)}`,
    },
  }
}

function userPose(t: number): IconPose {
  const glance = pulse(t, 0, 0.25, 0.35, 0.7)
  const nod = pulse(t, 0.32, 0.5, 0.5, 0.8)
  const follow = pulse(t, 0.12, 0.37, 0.45, 0.9)
  return {
    head: { transform: move(0.9 * glance, -0.3 * glance + 0.7 * nod) },
    shoulders: { transform: move(0.35 * follow, -0.3 * follow) },
  }
}

function micPose(t: number): IconPose {
  const sound = pulse(t, 0.12, 0.3, 0.6, 0.9)
  const pose: IconPose = {
    "sound-wave-left": {
      opacity: clean(0.7 * sound),
      transform: move(-0.6 * sound),
    },
    "sound-wave-right": {
      opacity: clean(0.7 * sound),
      transform: move(0.6 * sound),
    },
  }
  for (const [index, row] of ["top", "middle", "bottom"].entries()) {
    const delay = index * 0.07
    const beat =
      pulse(t, 0.04 + delay, 0.18 + delay, 0.18 + delay, 0.36 + delay) +
      0.65 * pulse(t, 0.43 + delay, 0.55 + delay, 0.55 + delay, 0.8 + delay)
    for (const side of ["left", "right"] as const) {
      pose[`grille-${side}-${row}`] = {
        transform: scaleAt(side === "left" ? 7 : 17, 10, 1 + 0.42 * beat, 1),
      }
    }
  }
  return pose
}

function searchPose(t: number): IconPose {
  const sweep = easeBetween(t, 0.08, 0.85)
  const adjust = Math.sin(t * Math.PI * 2) * pulse(t, 0, 0.12, 0.65, 1)
  return {
    "search-handle": { transform: turn(4 * adjust, 13.7678, 12) },
    "lens-reflection": {
      transform: move(-8 + 16 * sweep),
      opacity: clean(0.55 * pulse(t, 0.08, 0.2, 0.68, 0.92)),
    },
  }
}

function settingsPose(t: number): IconPose {
  const angle = 368 * easeBetween(t, 0, 0.8) - 8 * easeBetween(t, 0.8, 1)
  const squeeze = pulse(t, 0.08, 0.3, 0.45, 0.7)
  const rebound = pulse(t, 0.65, 0.8, 0.8, 1)
  const scale = 1 - 0.06 * squeeze + 0.02 * rebound
  return {
    gear: { transform: turn(angle, 12, 12) },
    ring: { transform: scaleAt(12, 12, scale, scale) },
  }
}

function bellPose(t: number): IconPose {
  const envelope = pulse(t, 0, 0.1, 0.1, 1)
  const swing = Math.sin(t * Math.PI * 5) * envelope
  const clapper = Math.sin(Math.max(0, t - 0.05) * Math.PI * 5) * envelope
  return {
    "bell-shell": { transform: turn(10 * swing, 12, 4) },
    clapper: {
      transform: `${move(-0.65 * clapper)} ${turn(-12 * clapper, 12, 18)}`,
    },
  }
}

function mailPose(t: number): IconPose {
  const open = pulse(t, 0, 0.28, 0.64, 0.95)
  const peek = pulse(t, 0.22, 0.44, 0.53, 0.78)
  return {
    "mail-flaps": { transform: scaleAt(12, 5, 1, 1 - 1.25 * open) },
    letter: { transform: move(0, -3 * peek), opacity: clean(peek) },
  }
}

function calendarPose(t: number): IconPose {
  const pose: IconPose = {}
  for (let index = 0; index < 12; index += 1) {
    const column = index % 4
    const row = Math.floor(index / 4)
    const delay = (row + column) * 0.09
    const lift = pulse(t, delay, delay + 0.12, delay + 0.16, delay + 0.36)
    pose[`day-${index + 1}`] = { transform: move(0, -0.6 * lift) }
  }
  return pose
}

function coffeePose(t: number): IconPose {
  const press = pulse(t, 0, 0.1, 0.1, 0.23)
  const lift = pulse(t, 0.13, 0.3, 0.42, 0.7)
  const steam = pulse(t, 0.18, 0.34, 0.5, 0.87)
  const rise = easeBetween(t, 0.18, 0.87)
  const sleeve = pulse(t, 0.38, 0.57, 0.57, 0.85)
  return {
    "coffee-lid": { transform: move(0, 0.2 * press - 0.7 * lift) },
    "steam-left": {
      opacity: clean(0.6 * steam),
      transform: move(-0.15 * rise, -1.8 * rise),
    },
    "steam-right": {
      opacity: clean(0.6 * steam),
      transform: move(0.15 * rise, -1.6 * rise),
    },
    sleeve: { transform: move(0, 0.3 * sleeve) },
  }
}

function locationPose(t: number): IconPose {
  const lift = pulse(t, 0, 0.3, 0.4, 0.7)
  const land = pulse(t, 0.66, 0.78, 0.78, 1)
  return {
    "location-pin": { transform: move(0, -1.5 * lift + 0.2 * land) },
    shadow: {
      transform: scaleAt(
        12,
        21,
        1 - 0.2 * lift + 0.025 * land,
        1 - 0.12 * lift
      ),
      opacity: clean(1 - 0.35 * lift),
    },
  }
}

function imagePose(t: number): IconPose {
  const drift = pulse(t, 0, 0.4, 0.5, 1)
  const sun = pulse(t, 0.06, 0.37, 0.48, 0.92)
  const left = move(-0.45 * drift)
  const right = move(0.55 * drift)
  return {
    "mountain-left": { transform: left },
    "snow-left-group": { transform: left },
    "mountain-right": { transform: right },
    "snow-right-group": { transform: right },
    sun: { transform: move(1.2 * sun, -0.8 * Math.sin((sun * Math.PI) / 2)) },
  }
}

function bookPose(t: number): IconPose {
  const envelope = pulse(t, 0, 0.1, 0.65, 0.9)
  const riffle = Math.sin(t * Math.PI * 4) * envelope
  const ribbon = pulse(t, 0.15, 0.4, 0.5, 0.9)
  const flick = Math.sin(t * Math.PI * 3) * ribbon
  return {
    pages: { transform: move(0, -0.4 * riffle) },
    "page-line": { transform: move(0, 0.25 * riffle) },
    "bookmark-ribbon": {
      transform: `${move(0, -0.65 * ribbon)} ${turn(4 * flick, 9, 3)}`,
    },
  }
}

function agentsPose(t: number): IconPose {
  const glance = pulse(t, 0, 0.24, 0.52, 0.9)
  const leftBlink = pulse(t, 0.32, 0.41, 0.43, 0.54)
  const rightBlink = pulse(t, 0.38, 0.47, 0.49, 0.6)
  return {
    "agent-eyes": { transform: move(-1.25 * glance, 0.15 * glance) },
    "agent-eye-left": {
      transform: scaleAt(14.2406, 11.522, 1, 1 - 0.88 * leftBlink),
    },
    "agent-eye-right": {
      transform: scaleAt(17.961, 10.6071, 1, 1 - 0.88 * rightBlink),
    },
  }
}

function clockPose(t: number): IconPose {
  const press = pulse(t, 0, 0.12, 0.15, 0.3)
  const sweep = 360 * easeBetween(t, 0.16, 0.84)
  const click = pulse(t, 0.8, 0.88, 0.88, 1)
  return {
    "clock-crown": { transform: move(0, 0.55 * press) },
    "clock-button": { transform: move(-0.22 * click, 0.22 * click) },
    "clock-minute": { transform: turn(sweep + 4 * click, 12, 13.9153) },
    "clock-hour": {
      transform: turn(12 * pulse(t, 0.2, 0.62, 0.72, 1), 12, 13.9153),
    },
  }
}

function lightPose(t: number): IconPose {
  const idea = pulse(t, 0.12, 0.32, 0.5, 0.92)
  const anticipate = pulse(t, 0, 0.1, 0.1, 0.23)
  const pose: IconPose = {
    "light-bulb": {
      transform: scaleAt(12, 18, 1 + 0.035 * idea, 1 + 0.025 * idea),
      opacity: clean(1 - 0.15 * anticipate),
    },
    "light-highlight": {
      transform: move(-0.35 * idea, -0.25 * idea),
      opacity: clean(1 - 0.65 * anticipate),
      "stroke-width": clean(1 + 0.35 * idea),
    },
  }
  for (let index = 0; index < 4; index += 1) {
    const offset = index * 0.075
    const flash = pulse(
      t,
      0.12 + offset,
      0.25 + offset,
      0.34 + offset,
      0.67 + offset
    )
    pose[`light-ray-${index + 1}`] = {
      transform: move((-0.65 + index * 0.2) * flash, -0.35 * flash),
      opacity: clean(clamp(1 - 0.6 * anticipate - 0.22 * (idea - flash))),
    }
  }
  return pose
}

function touchPose(t: number): IconPose {
  const press = pulse(t, 0, 0.18, 0.24, 0.5)
  const release = pulse(t, 0.36, 0.56, 0.56, 0.8)
  const wave = pulse(t, 0.16, 0.32, 0.4, 0.68)
  const echo = pulse(t, 0.32, 0.48, 0.54, 0.9)
  return {
    "touch-finger": {
      transform: scaleAt(12.1063, 21, 1, 1 - 0.045 * press + 0.01 * release),
    },
    "touch-thumb": { transform: turn(-3.5 * press, 12.1, 21) },
    "touch-wave": {
      transform: `${move(0.25 * wave, -0.3 * wave)} ${scaleAt(12.1, 4, 1 + 0.14 * wave, 1 + 0.14 * wave)}`,
      opacity: clean(1 - 0.4 * press),
    },
    "touch-echo": {
      transform: `${move(0.7 * echo, -0.65 * echo)} ${scaleAt(12.1, 4, 1 + 0.2 * echo, 1 + 0.2 * echo)}`,
      opacity: clean(0.6 * echo),
    },
  }
}

function layersPose(t: number): IconPose {
  const rearrange = pulse(t, 0.15, 0.46, 0.57, 0.94)
  const follow = pulse(t, 0.22, 0.53, 0.61, 1)
  const lift = pulse(t, 0, 0.15, 0.65, 0.96)
  // The guide stays fixed while the two stacks independently change their order.
  return {
    "layer-left-top": { transform: move(-0.65 * lift, 4 * rearrange) },
    "layer-left-middle": { transform: move(-0.25 * lift, -4 * follow) },
    "layer-left-bottom": { transform: move(-0.5 * follow) },
    "layer-right-top": { transform: move(0.65 * lift, 4 * follow) },
    "layer-right-middle": { transform: move(0.35 * lift, 4 * rearrange) },
    "layer-right-bottom": { transform: move(0.8 * lift, -8 * follow) },
  }
}

type Point = readonly [number, number]

function cubicPoint(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t
  const coordinate = (axis: 0 | 1): number =>
    u ** 3 * a[axis] +
    3 * u ** 2 * t * b[axis] +
    3 * u * t ** 2 * c[axis] +
    t ** 3 * d[axis]
  return [coordinate(0), coordinate(1)]
}

function motionPathPose(t: number): IconPose {
  const travel = easeBetween(t, 0.04, 0.82)
  let point: Point
  if (travel < 0.1) {
    point = cubicPoint([3.5, 5.5], [4.1, 5.5], [4.5, 7], [5, 8], travel / 0.1)
  } else if (travel < 0.35) {
    point = cubicPoint(
      [5, 8],
      [5, 8],
      [8.63636, 11.9714],
      [8.63636, 17],
      (travel - 0.1) / 0.25
    )
  } else if (travel < 0.7) {
    point = cubicPoint(
      [8.63636, 17],
      [8.20886, 11.1103],
      [12.8732, 3.15311],
      [15.9091, 17],
      (travel - 0.35) / 0.35
    )
  } else if (travel < 0.95) {
    point = cubicPoint(
      [15.9091, 17],
      [16.8182, 11],
      [19.0909, 11],
      [20, 14],
      (travel - 0.7) / 0.25
    )
  } else {
    point = cubicPoint(
      [20, 14],
      [20.2, 14.8],
      [20.5, 15.5],
      [20.5, 16.5],
      (travel - 0.95) / 0.05
    )
  }
  const land = pulse(t, 0.72, 0.84, 0.84, 0.96)
  // Reposition only while invisible, then bring the original start dot back.
  const reset = t >= 0.9
  const opacity = reset
    ? easeBetween(t, 0.9, 1)
    : 1 - easeBetween(t, 0.79, 0.88)
  return {
    "motion-dot": {
      transform: reset ? move(0) : move(point[0] - 3.5, point[1] - 5.5),
      opacity: clean(opacity),
    },
    "motion-end": {
      transform: scaleAt(20.5, 16.5, 1 + 0.22 * land, 1 + 0.22 * land),
    },
    "motion-trace": {
      "stroke-dashoffset": clean(1 - clamp((travel - 0.1) / 0.85)),
      opacity: clean(0.9 * pulse(t, 0.08, 0.18, 0.78, 0.93)),
    },
  }
}

export const iconAnimations: Record<AnimatedMonoIconName, IconAnimation> = {
  home: {
    duration: 0.35,
    pose: (p) => {
      const pose = homePose(p)
      return {
        "home-front": { transform: pose.front },
        "home-depth": { opacity: pose.opacity },
        "side-wall": { d: pose.side },
        "roof-depth": { d: pose.roof },
      }
    },
  },
  pen: {
    duration: 0.9,
    pose: (p) => {
      const pose = penPose(p)
      return {
        "pen-head": { transform: pose.head },
        "ink-reveal": { opacity: pose.inkOpacity },
        "ink-clip": { width: pose.inkWidth },
      }
    },
  },
  folder: {
    duration: 0.85,
    pose: (p) => {
      const pose = folderPose(p)
      return {
        "paper-sheet": { transform: pose.paper },
        "folder-front": { transform: pose.front },
      }
    },
  },
  work: { duration: 0.95, pose: cycle(workPose) },
  user: { duration: 0.9, pose: cycle(userPose) },
  mic: { duration: 1.05, pose: cycle(micPose) },
  search: { duration: 0.9, pose: cycle(searchPose) },
  settings: { duration: 1, pose: cycle(settingsPose) },
  bell: { duration: 0.95, pose: cycle(bellPose) },
  mail: { duration: 1, pose: cycle(mailPose) },
  calendar: { duration: 0.9, pose: cycle(calendarPose) },
  coffee: { duration: 1.1, pose: cycle(coffeePose) },
  location: { duration: 0.9, pose: cycle(locationPose) },
  image: { duration: 1.1, pose: cycle(imagePose) },
  book: { duration: 0.95, pose: cycle(bookPose) },
  agents: { duration: 0.9, pose: cycle(agentsPose) },
  clock: { duration: 1.2, pose: cycle(clockPose) },
  light: { duration: 1.1, pose: cycle(lightPose) },
  touch: { duration: 0.95, pose: cycle(touchPose) },
  layers: { duration: 1.25, pose: cycle(layersPose) },
  "motion-path": { duration: 1.4, pose: cycle(motionPathPose) },
}

export function createIconPainter(
  svg: SVGSVGElement,
  name: AnimatedMonoIconName
): (progress: number) => void {
  const draw = iconAnimations[name].pose
  // Cache layer references once; Motion updates attributes without React renders.
  const parts = Object.keys(draw(0)).map((name) => {
    const element = svg.querySelector(`[data-part="${name}"]`)
    if (!element) throw new Error(`Missing Mono icon part: ${name}`)
    return { name, element }
  })
  return (progress) => {
    const pose = draw(progress)
    for (const { name, element } of parts) {
      for (const [attribute, value] of Object.entries(pose[name])) {
        element.setAttribute(attribute, String(value))
      }
    }
  }
}
