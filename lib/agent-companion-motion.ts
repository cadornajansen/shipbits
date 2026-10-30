export const agentShapes = [
  "lavender-bot",
  "orange-bot",
  "pink-cat",
  "lime-bloom",
] as const
export type AgentShape = (typeof agentShapes)[number]
export type AgentCompanionState = "idle" | "working" | "sleeping"
export type AgentCompanionShape = AgentShape | "pebble" | "arch" | "satellite"
export type AgentPose = Record<string, Record<string, string | number>>

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

export function resolveAgentShape(shape: AgentCompanionShape): AgentShape {
  if (shape === "pebble") return "lavender-bot"
  if (shape === "arch") return "pink-cat"
  if (shape === "satellite") return "lime-bloom"
  return shape
}

export function agentPose(
  shape: AgentShape,
  state: AgentCompanionState,
  time = 0,
  gesture = 0,
  gaze: { x: number; y: number } = { x: 0, y: 0 }
): AgentPose {
  const alternate =
    (state === "sleeping" &&
      (shape === "lavender-bot" || shape === "lime-bloom")) ||
    (shape === "lavender-bot" && state === "working")
  const pose: AgentPose = {
    ...Object.fromEntries(
      workingDetails[shape].map((part) => [
        part,
        { opacity: 0, transform: identity },
      ])
    ),
    body: { transform: identity },
    gaze: {
      transform: translate(
        state === "idle" ? gaze.x : 0,
        state === "idle" ? gaze.y : 0
      ),
    },
    "normal-eyes": {
      opacity: alternate || state === "sleeping" ? 0 : 1,
      transform: identity,
    },
    "alternate-eyes": { opacity: alternate ? 1 : 0, transform: identity },
    "eye-left": { transform: identity },
    "eye-right": { transform: identity },
    ...(shape === "lavender-bot"
      ? {
          visor: { opacity: state === "working" ? 1 : 0 },
          screen: { opacity: state === "working" ? 0 : 1 },
        }
      : {}),
    ...(shape === "orange-bot" ? { "star-eyes": { opacity: 0 } } : {}),
    ...(shape === "orange-bot" || shape === "pink-cat"
      ? { "sleeping-eyes": { opacity: state === "sleeping" ? 1 : 0 } }
      : {}),
  }

  const breath = (1 - Math.cos((time * Math.PI * 2) / 4)) / 2
  if (state === "sleeping") {
    pose.body.transform = scaleAt(
      1 + breath * 0.012,
      1 - breath * 0.018,
      56.5,
      95
    )
  }

  if (state === "idle") {
    const idlePhase =
      (time % agentIdleDurations[shape]) / agentIdleDurations[shape]
    const blink = Math.max(
      pulse(idlePhase, 0.64, 0.655, 0.665, 0.69),
      shape === "pink-cat" ? pulse(idlePhase, 0.73, 0.745, 0.755, 0.78) : 0
    )
    const eyeY =
      shape === "pink-cat"
        ? 60
        : shape === "lime-bloom"
          ? 53
          : shape === "lavender-bot"
            ? 38
            : 45
    pose["eye-left"].transform = scaleAt(1, 1 - blink * 0.93, 56.5, eyeY)
    pose["eye-right"].transform = scaleAt(1, 1 - blink * 0.93, 56.5, eyeY)
  }

  const phase = (time % agentCycleDurations[shape]) / agentCycleDurations[shape]
  const working = state === "working"
  const greet = pulse(gesture, 0, 0.22, 0.65, 1)
  switch (shape) {
    case "lavender-bot": {
      pose.head = { transform: translate(0, greet * 2.4) }
      pose["bar-top"] = {
        transform: identity,
        opacity: 1,
      }
      pose["bar-bottom"] = {
        transform: identity,
        opacity: 1,
      }
      const blink = pulse(gesture, 0.3, 0.39, 0.47, 0.62)
      if (blink > 0) {
        pose["normal-eyes"].transform = scaleAt(1, 1 - blink * 0.92, 56.5, 38)
        pose["alternate-eyes"].transform = scaleAt(
          1,
          1 - blink * 0.92,
          56.5,
          38
        )
      }
      break
    }
    case "orange-bot": {
      pose.head = { transform: identity }
      pose.antenna = { transform: identity }
      const stars = pulse(gesture, 0.06, 0.18, 0.4, 0.52)
      const happy = pulse(gesture, 0.43, 0.56, 0.74, 0.96)
      pose["star-eyes"].opacity = stars
      if (gesture > 0 && gesture < 1) {
        pose["normal-eyes"].opacity =
          (state === "sleeping" ? 0 : 1) * (1 - Math.max(stars, happy))
        pose["alternate-eyes"].opacity = happy
        pose["sleeping-eyes"].opacity =
          state === "sleeping" ? 1 - Math.max(stars, happy) : 0
      }
      break
    }
    case "pink-cat": {
      pose["ear-left"] = {
        transform: `rotate(${n(-greet * 4)} 30 35)`,
      }
      pose["ear-right"] = {
        transform: `rotate(${n(greet * 4)} 83 35)`,
      }
      pose["whiskers-left"] = { transform: identity }
      pose["whiskers-right"] = { transform: identity }
      pose["normal-eyes"].opacity = state === "sleeping" ? 0 : 1 - greet
      pose["alternate-eyes"].opacity = greet
      pose["sleeping-eyes"].opacity = state === "sleeping" ? 1 - greet : 0
      break
    }
    case "lime-bloom": {
      for (let index = 0; index < 4; index += 1)
        pose[`lobe-${index}`] = { transform: identity }
      // Squash toward the middle, leaving the SVG viewport and position fixed.
      if (greet > 0)
        pose.body.transform = scaleAt(
          1 + greet * 0.025,
          1 - greet * 0.08,
          56.5,
          56.5
        )
      if (!alternate) {
        pose["normal-eyes"].opacity = 1 - greet
        pose["alternate-eyes"].opacity = greet
      }
      break
    }
  }
  if (working) applyWorkingPose(pose, shape, phase, greet, gesture)
  if (state === "idle") applyIdlePose(pose, shape, time, greet, gaze)
  return pose
}

/** All curves close at the loop seam; each silhouette follows its own flight path. */
function applyWorkingPose(
  pose: AgentPose,
  shape: AgentShape,
  p: number,
  greet: number,
  gesture: number
): void {
  const angle = p * Math.PI * 2
  const lift = (1 - Math.cos(angle)) / 2
  const reveal = pulse(p, 0, 0.08, 0.92, 1)

  switch (shape) {
    case "lavender-bot": {
      // The heavier base follows the scanner head with a smaller counter-sway.
      const bank = Math.sin(angle) * 2.5
      pose.body.transform = `${translate(-Math.sin(angle) * 1.2, -lift * 2.6)} rotate(${n(-bank * 0.4)} 57 78)`
      pose.head.transform = `${translate(Math.sin(angle) * 2, -lift * 5 + greet * 2.4)} rotate(${n(bank)} 57 38)`
      const scan = pulse(p, 0.08, 0.3, 0.4, 0.62)
      const resolve = pulse(p, 0.38, 0.56, 0.7, 0.94)
      pose.gaze.transform = translate(Math.sin(angle) * 3.2, -lift * 0.8)
      pose["bar-top"].transform = scaleAt(1 - scan * 0.38, 1, 57, 70)
      pose["bar-top"].opacity = 1 - scan * 0.3
      pose["bar-bottom"].transform = scaleAt(1 - resolve * 0.46, 1, 56.5, 86)
      pose["bar-bottom"].opacity = 1 - resolve * 0.3
      pose["work-scan"].opacity = pulse(p, 0.06, 0.18, 0.75, 0.9) * 0.8
      pose["work-scan"].transform = translate(lift * 43, 0)
      break
    }
    case "orange-bot": {
      // A small figure-eight leads into an idea, then the antenna catches up.
      const idea = pulse(p, 0.53, 0.62, 0.72, 0.87)
      const think = pulse(p, 0.12, 0.24, 0.36, 0.49)
      pose.body.transform = `${translate(Math.sin(angle) * 1.5, -lift * 3.2)} ${scaleAt(1 + lift * 0.035, 1 - lift * 0.045, 57, 83)}`
      pose.head.transform = `${translate(Math.sin(angle * 2) * 2.1, -lift * 5.5 - idea * 1.2)} rotate(${n(Math.sin(angle) * 5 - idea * 2)} 57 45)`
      pose.antenna.transform = `rotate(${n((Math.sin(angle - 0.45) + Math.sin(0.45)) * -7)} 61 22)`
      pose.gaze.transform = translate(
        -think * 2.3 + idea * 1.1,
        think * 1.2 - idea
      )
      pose["eye-left"].transform = scaleAt(1, 1 - think * 0.42, 46, 45)
      pose["eye-right"].transform = scaleAt(1, 1 - think * 0.18, 68, 45)
      if (!(gesture > 0 && gesture < 1)) {
        pose["star-eyes"].opacity = idea
        pose["normal-eyes"].opacity = 1 - idea
      }
      pose["work-idea-a"].opacity = idea
      pose["work-idea-a"].transform =
        `${translate(idea * 1.2, -idea * 2)} rotate(${n(idea * 16)} 96 30) ${scaleAt(0.6 + idea * 0.4, 0.6 + idea * 0.4, 96, 30)}`
      const echo = pulse(p, 0.65, 0.74, 0.82, 0.98)
      pose["work-idea-b"].opacity = echo * 0.7
      pose["work-idea-b"].transform = translate(-echo, -echo * 2)
      break
    }
    case "pink-cat": {
      // Alternating paws make this a typist; ears and whiskers follow the taps.
      const leftTap = (1 - Math.cos(angle * 3)) / 2
      const rightTap = (1 - Math.cos(angle * 3 - Math.PI)) / 2
      const sway = Math.sin(angle) * 1.2
      pose.body.transform = `${translate(sway, -lift * 3.8)} rotate(${n(Math.sin(angle * 2) * 1.3)} 56.5 59)`
      pose.gaze.transform = translate(Math.sin(angle * 2) * 2.3, lift * 1.2)
      const blink = pulse(p, 0.75, 0.78, 0.8, 0.84)
      pose["eye-left"].transform = scaleAt(
        1,
        1 - lift * 0.12 - blink * 0.8,
        38,
        59
      )
      pose["eye-right"].transform = scaleAt(
        1,
        1 - lift * 0.12 - blink * 0.8,
        77,
        59
      )
      pose["ear-left"].transform =
        `rotate(${n(-leftTap * reveal * 5 - greet * 4)} 30 35)`
      pose["ear-right"].transform =
        `rotate(${n(rightTap * reveal * 5 + greet * 4)} 83 35)`
      pose["whiskers-left"].transform =
        `rotate(${n(leftTap * reveal * 3)} 22 84)`
      pose["whiskers-right"].transform =
        `rotate(${n(-rightTap * reveal * 3)} 91 84)`
      pose["work-paw-left"].opacity = reveal
      pose["work-paw-right"].opacity = reveal
      pose["work-paw-left"].transform = translate(sway, -leftTap * 3.8)
      pose["work-paw-right"].transform = translate(sway, -rightTap * 3.8)
      pose["work-key-left"].opacity = reveal * (0.2 + (1 - leftTap) * 0.65)
      pose["work-key-right"].opacity = reveal * (0.2 + (1 - rightTap) * 0.65)
      break
    }
    case "lime-bloom": {
      const x = Math.sin(angle) * 2.4
      const y = -lift * 4.6
      const bank = Math.sin(angle) * 4
      const flight = `${translate(x, y)} rotate(${n(bank)} 56.5 54)`
      pose.body.transform = `${flight} ${scaleAt(1 + greet * 0.025, 1 - greet * 0.08, 56.5, 56.5)}`
      const centers = [
        [39, 37],
        [39, 75],
        [76, 37],
        [76, 75],
      ] as const
      const order = [0, 3, 1, 2]
      centers.forEach(([cx, cy], index) => {
        const local = angle - (order[index] * Math.PI) / 2
        const curl = Math.sin(local) * reveal
        pose[`lobe-${index}`].transform =
          `rotate(${n(curl * 5)} 56.5 54) ${scaleAt(1 - curl * 0.085, 1 + curl * 0.07, cx, cy)}`
      })
      pose.gaze.transform = `${flight} ${translate(Math.sin(angle + 0.5) * reveal * 1.8, -lift * 0.7)}`
      const squint = pulse(p, 0.4, 0.48, 0.57, 0.69)
      if (!(gesture > 0 && gesture < 1)) {
        pose["normal-eyes"].opacity = 1 - squint
        pose["alternate-eyes"].opacity = squint
      }
      for (const [index, part] of ["work-seed-a", "work-seed-b"].entries()) {
        const orbit = angle + index * Math.PI
        pose[part].opacity = reveal * (0.55 + (Math.sin(orbit) + 1) * 0.2)
        pose[part].transform =
          `${translate(56.5 + Math.cos(orbit) * 46, 54 + Math.sin(orbit) * 43)} rotate(${n((orbit * 180) / Math.PI + 30)})`
      }
      break
    }
  }
}

/** Each character has its own unhurried idle loop; pointer gaze adds to it. */
function applyIdlePose(
  pose: AgentPose,
  shape: AgentShape,
  time: number,
  greet: number,
  gaze: { x: number; y: number }
): void {
  const p = (time % agentIdleDurations[shape]) / agentIdleDurations[shape]
  const left = pulse(p, 0.08, 0.2, 0.3, 0.42)
  const right = pulse(p, 0.48, 0.6, 0.73, 0.9)
  const drift = (1 - Math.cos(p * Math.PI * 2)) / 2
  const x = gaze.x + (right - left) * 2
  pose.gaze.transform = translate(x, gaze.y)
  switch (shape) {
    case "lavender-bot":
      pose.head.transform = translate(0, -drift * 1.8 + greet * 2.4)
      pose.body.transform = translate(0, -drift * 0.6)
      break
    case "orange-bot":
      pose.head.transform = `translate(0 ${n(-drift * 1.2)}) rotate(${n((right - left) * 2)} 57 60)`
      pose.antenna.transform = `rotate(${n((left - right) * 2)} 57 22)`
      break
    case "pink-cat":
      pose.body.transform = translate(0, -drift * 2.8)
      pose["ear-left"].transform = `rotate(${n(-left * 3 - greet * 4)} 30 35)`
      pose["ear-right"].transform = `rotate(${n(right * 3 + greet * 4)} 83 35)`
      break
    case "lime-bloom":
      pose.body.transform = `${translate(0, -drift * 3.2)} ${scaleAt(1 + greet * 0.025, 1 - greet * 0.08, 56.5, 56.5)}`
      pose.gaze.transform = translate(x, gaze.y - drift * 3.2)
      break
  }
}

export const agentIdleDurations: Record<AgentShape, number> = {
  "lavender-bot": 5.8,
  "orange-bot": 6.4,
  "pink-cat": 6,
  "lime-bloom": 5.6,
}

export const agentCycleDurations: Record<AgentShape, number> = {
  "lavender-bot": 3.8,
  "orange-bot": 3.2,
  "pink-cat": 3.6,
  "lime-bloom": 4.2,
}

export const agentGestureDurations: Record<AgentShape, number> = {
  "lavender-bot": 0.9,
  "orange-bot": 1.2,
  "pink-cat": 1,
  "lime-bloom": 0.95,
}

const identity = "matrix(1 0 0 1 0 0)"
const n = (value: number): string =>
  Math.abs(value) < 0.00001 ? "0" : value.toFixed(5)
const translate = (x: number, y: number): string => `translate(${n(x)} ${n(y)})`
const scaleAt = (x: number, y: number, cx: number, cy: number): string =>
  `matrix(${n(x)} 0 0 ${n(y)} ${n(cx * (1 - x))} ${n(cy * (1 - y))})`
const smooth = (value: number): number => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/** Smooth rise, hold, and fall; zero outside the requested interval. */
function pulse(
  t: number,
  start: number,
  rise: number,
  fall: number,
  end: number
): number {
  return (
    smooth((t - start) / (rise - start)) *
    (1 - smooth((t - fall) / (end - fall)))
  )
}
