"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import type { ShaderMount, ShaderMountUniforms } from "@paper-design/shaders"

import { materialDefinitions } from "@/lib/materials/registry"
import {
  materialUniforms,
  type MaterialKind,
  type MaterialQuality,
  type MaterialSettings,
  type SurfaceShape,
} from "@/lib/materials/types"
import { textMask } from "@/lib/materials/text-mask"
import { cn } from "@/lib/utils"

const shapeNumbers: Record<SurfaceShape, number> = {
  rectangle: 0,
  circle: 1,
  pill: 2,
  text: 3,
  diamond: 4,
}
const shaderLoaders = {
  foil: () => import("@/lib/shaders/foil"),
  titanium: () => import("@/lib/shaders/titanium"),
}
const emptySettings: Partial<MaterialSettings> = {}

export type MaterialSurfaceProps = {
  material: MaterialKind
  settings?: Partial<MaterialSettings>
  shape?: SurfaceShape
  text?: string
  paused?: boolean
  quality?: MaterialQuality
  thumbnail?: boolean
  className?: string
  children?: ReactNode
}

type MaterialSnapshot = {
  values: MaterialSettings
  shape: SurfaceShape
  text: string
  paused: boolean
  quality: MaterialQuality
  thumbnail: boolean
}

function surfaceUniforms(
  material: MaterialKind,
  current: MaterialSnapshot
): ShaderMountUniforms {
  const uniforms: ShaderMountUniforms = materialUniforms(
    current.values,
    materialDefinitions[material].groups
  )
  // Speed belongs to our clock; unused GLSL uniforms are removed by the compiler.
  delete uniforms.u_speed
  uniforms.u_shape = shapeNumbers[current.shape]
  uniforms.u_quality = current.thumbnail
    ? -1
    : current.quality === "high"
      ? 1
      : 0
  return uniforms
}

function maximumPixels(
  current: MaterialSnapshot,
  width: number,
  height: number
): number {
  const density = current.thumbnail ? 1 : current.quality === "high" ? 2 : 1.5
  const ceiling = current.thumbnail
    ? 12_544
    : current.quality === "high"
      ? 1_500_000
      : 900_000
  // Paper's minimum pixel ratio is a floor; a CSS-sized budget also caps high-DPR screens.
  return Math.max(
    1,
    Math.min(ceiling, Math.round(width * height * density ** 2))
  )
}

export function MaterialSurface({
  material,
  settings = emptySettings,
  shape = "rectangle",
  text = "SHIPBITS",
  paused = false,
  quality = "auto",
  thumbnail = false,
  className,
  children,
}: MaterialSurfaceProps): ReactElement {
  const definition = materialDefinitions[material]
  const values = useMemo(
    () => definition.normalize(settings),
    [definition, settings]
  )
  const outerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<ShaderMount | null>(null)
  const syncSettingsRef = useRef<() => void>(() => {})
  const syncMaskRef = useRef<(mask: HTMLImageElement) => void>(() => {})
  const phaseRef = useRef<number>(4)
  const latestRef = useRef<MaterialSnapshot>({
    values,
    shape,
    text,
    paused,
    quality,
    thumbnail,
  })
  const [near, setNear] = useState<boolean>(false)
  const [attempt, setAttempt] = useState<number>(0)
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  )

  useEffect(() => {
    latestRef.current = {
      values,
      shape,
      text,
      paused,
      quality,
      thumbnail,
    }
    syncSettingsRef.current()
  }, [
    values,
    shape,
    text,
    paused,
    quality,
    thumbnail,
    material,
    definition.groups,
  ])

  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatus("loading")
        setNear(entry.isIntersecting)
      },
      { rootMargin: "300px" }
    )
    observer.observe(outer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const outer = outerRef.current
    const container = canvasRef.current
    if (!near || !outer || !container) return
    let disposed = false
    let lost = false
    let visible = false
    let frame = 0
    let revealFrame = 0
    let lastTime = 0
    let lastDraw = 0
    let mount: ShaderMount | null = null
    let settingsPending = true
    let pendingMask: HTMLImageElement | undefined
    let pixelLimit = 0
    let width = container.clientWidth
    let height = container.clientHeight
    const point = [0, 0]
    const target = [0, 0]
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")

    function applyPixelBudget(): void {
      if (!mount || disposed || lost) return
      const nextPixelLimit = maximumPixels(latestRef.current, width, height)
      if (nextPixelLimit === pixelLimit) return
      pixelLimit = nextPixelLimit
      mount.setMaxPixelCount(pixelLimit)
    }

    function applyPendingSettings(): void {
      if (!mount || disposed || lost || !visible || document.hidden) return
      if (!settingsPending && !pendingMask) return
      const current = latestRef.current
      const uniforms = settingsPending ? surfaceUniforms(material, current) : {}
      if (pendingMask) uniforms.u_mask = pendingMask
      // Paper's uniform setter draws immediately, so invisible examples defer updates.
      mount.setUniforms(uniforms)
      applyPixelBudget()
      settingsPending = false
      pendingMask = undefined
    }

    function syncSettings(): void {
      settingsPending = true
      applyPendingSettings()
      wake()
    }

    function syncMask(mask: HTMLImageElement): void {
      pendingMask = mask
      applyPendingSettings()
      wake()
    }

    function wake(): void {
      if (
        !disposed &&
        !lost &&
        mount &&
        visible &&
        !document.hidden &&
        frame === 0
      ) {
        lastTime = 0
        frame = requestAnimationFrame(draw)
      }
    }
    function draw(now: number): void {
      frame = 0
      if (disposed || lost || !mount || !visible || document.hidden) return
      const current = latestRef.current
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0
      lastTime = now
      const animate =
        !current.paused && !motion.matches && current.values.speed > 0
      if (animate) phaseRef.current += dt * current.values.speed
      const targetX = motion.matches ? 0 : target[0]
      const targetY = motion.matches ? 0 : target[1]
      point[0] += (targetX - point[0]) * 0.14
      point[1] += (targetY - point[1]) * 0.14
      const moving =
        Math.abs(point[0] - targetX) + Math.abs(point[1] - targetY) > 0.001
      const interval = current.thumbnail ? 1000 / 15 : 0
      if (now - lastDraw >= interval || !animate) {
        // One uniform upload draws both the clock and pointer; no React frame updates.
        mount.setUniforms({
          u_materialTime: phaseRef.current,
          u_pointer: point.slice(),
        })
        lastDraw = now
      }
      if (animate || moving) frame = requestAnimationFrame(draw)
    }
    function changeVisibility(): void {
      cancelAnimationFrame(frame)
      frame = 0
      if (motion.matches) {
        point[0] = point[1] = target[0] = target[1] = 0
      }
      applyPendingSettings()
      wake()
    }
    function pointerMove(event: PointerEvent): void {
      if (
        event.pointerType === "touch" ||
        motion.matches ||
        latestRef.current.thumbnail
      )
        return
      const bounds = outer!.getBoundingClientRect()
      target[0] = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)
      )
      target[1] = Math.max(
        -1,
        Math.min(1, 1 - ((event.clientY - bounds.top) / bounds.height) * 2)
      )
      wake()
    }
    function pointerLeave(): void {
      target[0] = 0
      target[1] = 0
      wake()
    }
    function contextLost(event: Event): void {
      event.preventDefault()
      lost = true
      cancelAnimationFrame(frame)
      frame = 0
      mountRef.current = null
      setStatus("unavailable")
    }
    function contextRestored(): void {
      setAttempt((value) => value + 1)
    }
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      changeVisibility()
    })
    visibility.observe(outer)
    const sizing = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
      applyPixelBudget()
    })
    sizing.observe(container)
    outer.addEventListener("pointermove", pointerMove, { passive: true })
    outer.addEventListener("pointerleave", pointerLeave)
    document.addEventListener("visibilitychange", changeVisibility)
    motion.addEventListener("change", changeVisibility)
    syncSettingsRef.current = syncSettings
    syncMaskRef.current = syncMask

    async function initialize(): Promise<void> {
      try {
        const [shader, runtime] = await Promise.all([
          shaderLoaders[material](),
          import("@paper-design/shaders"),
        ])
        let mask: HTMLImageElement
        let maskedText: string
        do {
          maskedText = latestRef.current.text
          mask = await textMask(maskedText)
        } while (!disposed && maskedText !== latestRef.current.text)
        if (disposed) return
        const current = latestRef.current
        pixelLimit = maximumPixels(current, width, height)
        mount = new runtime.ShaderMount(
          container!,
          shader.default.replace(/\bu_time\b/g, "u_materialTime"),
          {
            ...surfaceUniforms(material, current),
            u_materialTime: phaseRef.current,
            u_pointer: [0, 0],
            u_mask: mask,
          },
          { alpha: true, premultipliedAlpha: true },
          0,
          0,
          current.thumbnail ? 1 : 2,
          pixelLimit,
          ["u_mask"]
        )
        settingsPending = false
        pendingMask = undefined
        mountRef.current = mount
        mount.canvasElement.addEventListener("webglcontextlost", contextLost)
        mount.canvasElement.addEventListener(
          "webglcontextrestored",
          contextRestored
        )
        revealFrame = requestAnimationFrame(() => {
          revealFrame = requestAnimationFrame(() => {
            if (disposed || lost || !mount) return
            const gl = mount.canvasElement.getContext("webgl2")
            const program = gl?.getParameter(
              gl.CURRENT_PROGRAM
            ) as WebGLProgram | null
            if (
              !gl ||
              !program ||
              !gl.getProgramParameter(program, gl.LINK_STATUS) ||
              mount.canvasElement.width === 0
            ) {
              setStatus("unavailable")
              return
            }
            setStatus("ready")
            wake()
          })
        })
      } catch (error: unknown) {
        if (disposed) return
        if (!mount) {
          // ShaderMount inserts its canvas before construction can fail.
          for (const canvas of container!.querySelectorAll("canvas")) {
            canvas
              .getContext("webgl2")
              ?.getExtension("WEBGL_lose_context")
              ?.loseContext()
            canvas.remove()
          }
        }
        setStatus("unavailable")
        console.warn(`${material} preview unavailable:`, error)
      }
    }
    void initialize()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(revealFrame)
      visibility.disconnect()
      sizing.disconnect()
      outer.removeEventListener("pointermove", pointerMove)
      outer.removeEventListener("pointerleave", pointerLeave)
      document.removeEventListener("visibilitychange", changeVisibility)
      motion.removeEventListener("change", changeVisibility)
      if (mount) {
        mount.canvasElement.removeEventListener("webglcontextlost", contextLost)
        mount.canvasElement.removeEventListener(
          "webglcontextrestored",
          contextRestored
        )
        const gl = mount.canvasElement.getContext("webgl2")
        mount.dispose()
        gl?.getExtension("WEBGL_lose_context")?.loseContext()
      }
      mountRef.current = null
      syncSettingsRef.current = () => {}
      syncMaskRef.current = () => {}
    }
  }, [material, near, attempt])

  useEffect(() => {
    if (shape !== "text") return
    let cancelled = false
    const timeout = setTimeout(() => {
      void textMask(text)
        .then((mask) => {
          if (!cancelled) syncMaskRef.current(mask)
        })
        .catch(() => {
          if (!cancelled) setStatus("unavailable")
        })
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [text, shape])

  const ready = near && status === "ready"
  return (
    <div
      ref={outerRef}
      data-material={material}
      data-renderer={ready ? "webgl" : status}
      className={cn("relative isolate min-h-12 w-full", className)}
    >
      <div
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
      {children && <div className="relative z-10 h-full">{children}</div>}
      {status === "unavailable" && !thumbnail && (
        <div className="absolute inset-x-0 bottom-2 z-20 text-center text-[11px] text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setStatus("loading")
              setAttempt((value) => value + 1)
            }}
            className="rounded bg-background/90 px-2 py-1 underline underline-offset-4 focus-visible:outline-2"
          >
            Preview unavailable. Retry
          </button>
        </div>
      )}
    </div>
  )
}
