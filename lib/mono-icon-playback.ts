import type { AnimatedMonoIconName } from "./mono-icons"
import { iconAnimations } from "./mono-icon-motion"

export type IconPlaybackState =
  "idle" | "scheduled" | "intro" | "hover" | "held" | "returning"
type Cancel = () => void

export type IconAnimationDriver = {
  paint: (progress: number) => void
  state: (state: IconPlaybackState) => void
  delay: (milliseconds: number, complete: () => void) => Cancel
  tween: (
    from: number,
    to: number,
    seconds: number,
    linear: boolean,
    update: (progress: number) => void,
    complete: () => void
  ) => Cancel
}

export type IconPlayer = {
  setVisible: (visible: boolean) => void
  setActive: (active: boolean) => void
  destroy: () => void
}

// The caller owns this Set so completed introductions survive React remounts.
export function createIconPlayer(
  name: AnimatedMonoIconName,
  viewed: Set<AnimatedMonoIconName>,
  driver: IconAnimationDriver,
  stagger = 0
): IconPlayer {
  let visible = false
  let active = false
  let destroyed = false
  let progress = 0
  let state: IconPlaybackState = "idle"
  let cancel: Cancel | undefined
  let generation = 0

  function setState(next: IconPlaybackState): void {
    state = next
    driver.state(next)
  }

  function paint(value: number): void {
    progress = value
    driver.paint(value)
  }

  function stop(): void {
    generation += 1
    cancel?.()
    cancel = undefined
  }

  function rest(): void {
    stop()
    paint(0)
    setState("idle")
  }

  function wait(milliseconds: number, complete: () => void): void {
    stop()
    const token = generation
    cancel = driver.delay(milliseconds, () => {
      if (!destroyed && token === generation) complete()
    })
  }

  function tween(
    to: number,
    seconds: number,
    linear: boolean,
    complete: () => void
  ): void {
    stop()
    const token = generation
    cancel = driver.tween(
      progress,
      to,
      seconds,
      linear,
      (value) => {
        if (!destroyed && token === generation) paint(value)
      },
      () => {
        if (!destroyed && token === generation) complete()
      }
    )
  }

  function finish(): void {
    viewed.add(name)
    rest()
  }

  function returnHome(): void {
    setState("returning")
    tween(0, Math.max(0.08, 0.3 * progress), false, finish)
  }

  function run(manual: boolean): void {
    setState(manual ? "hover" : "intro")
    if (name === "home") {
      tween(1, Math.max(0.08, 0.35 * (1 - progress)), false, () => {
        if (active) {
          viewed.add(name)
          setState("held")
        } else {
          wait(180, returnHome)
        }
      })
    } else {
      paint(0)
      tween(1, iconAnimations[name].duration, true, finish)
    }
  }

  function start(manual: boolean): void {
    if (stagger > 0 && progress === 0) {
      setState("scheduled")
      wait(stagger, () => {
        if (visible && (manual ? active : !viewed.has(name))) run(manual)
        else rest()
      })
    } else {
      run(manual)
    }
  }

  return {
    setVisible(next): void {
      if (destroyed || visible === next) return
      visible = next
      if (!visible) rest()
      else if (active) start(true)
      else if (!viewed.has(name)) start(false)
    },
    setActive(next): void {
      if (destroyed || active === next) return
      active = next
      if (!visible) return
      if (active) {
        if (name === "home") {
          if (state !== "held") start(true)
        } else if (state === "idle" || state === "scheduled") {
          stop()
          start(true)
        }
      } else if (name === "home" && state !== "idle") {
        returnHome()
      }
      // Cycle animations finish after exit; re-entry never queues another run.
    },
    destroy(): void {
      destroyed = true
      rest()
    },
  }
}
