"use client"

import {
  getShaderColorFromString,
  liquidMetalFragmentShader,
  LiquidMetalShapes,
  ShaderMount,
  toProcessedLiquidMetal,
  type ShaderMountUniforms,
} from "@paper-design/shaders"
import { useEffect, useRef, useState, type ReactElement } from "react"

import {
  defaultMetalSettings,
  normalizeMetalSettings,
  type MetalSettings,
  type MetalShape,
} from "@/lib/liquid-metal"
import { cn } from "@/lib/utils"
import { metalIconMasks, metalIconMaskUrl } from "@/lib/metal-shapes"

type LiquidMetalProps = {
  settings?: MetalSettings
  shape?: MetalShape
  paused?: boolean
  decorative?: boolean
  className?: string
}

type RenderState = {
  shape: MetalShape
  status: "loading" | "ready" | "unavailable"
}

function materialUniforms(settings: MetalSettings): ShaderMountUniforms {
  const values = normalizeMetalSettings(settings)
  return {
    u_colorTint: getShaderColorFromString(values.tint),
    u_contour: values.contour,
    u_softness: values.softness,
    u_distortion: values.liquid,
    u_repetition: values.patternDensity,
    u_angle: values.angle,
    u_shiftRed: values.aberration,
    u_shiftBlue: values.aberration,
    u_scale: values.scale,
  }
}

const maskCache = new Map<MetalShape, Promise<HTMLImageElement>>()

function createMask(shape: MetalShape): Promise<HTMLImageElement> {
  const cached = maskCache.get(shape)
  if (cached) return cached
  const pending = drawMask(shape).catch((error: unknown) => {
    maskCache.delete(shape)
    throw error
  })
  maskCache.set(shape, pending)
  return pending
}

async function drawMask(shape: MetalShape): Promise<HTMLImageElement> {
  // A small raster mask avoids the library's much larger SVG rasterization.
  const canvas = document.createElement("canvas")
  const builtIn = shape === "circle" || shape === "diamond"
  canvas.width = builtIn ? 2 : 512
  canvas.height = canvas.width
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")
  if (builtIn) {
    // Built-in shapes still need a valid texture and image aspect ratio.
    const image = new Image()
    image.src = canvas.toDataURL("image/png")
    await image.decode()
    return image
  }
  context.fillStyle = "white"
  if (shape === "apple" || shape === "github") {
    const icon = metalIconMasks[shape]
    const scale = 448 / Math.max(icon.width, icon.height)
    context.translate(
      (512 - icon.width * scale) / 2,
      (512 - icon.height * scale) / 2
    )
    context.scale(scale, scale)
    context.fill(new Path2D(icon.path), "evenodd")
  } else if (shape === "square") {
    context.beginPath()
    context.roundRect(48, 48, 416, 416, 64)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(256, 34)
    context.lineTo(496, 450)
    context.lineTo(16, 450)
    context.closePath()
    context.fill()
  }
  const { pngBlob } = await toProcessedLiquidMetal(
    canvas.toDataURL("image/png")
  )
  const url = URL.createObjectURL(pngBlob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function LiquidMetal({
  settings = defaultMetalSettings,
  shape = "triangle",
  paused = false,
  decorative = false,
  className,
}: LiquidMetalProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<ShaderMount | null>(null)
  const latest = useRef({ settings, paused })
  const reducedMotion = useRef<boolean>(true)
  const [attempt, setAttempt] = useState<number>(0)
  const [renderState, setRenderState] = useState<RenderState>({
    shape,
    status: "loading",
  })
  const ready = renderState.shape === shape && renderState.status === "ready"
  const unavailable =
    renderState.shape === shape && renderState.status === "unavailable"

  useEffect(() => {
    latest.current = { settings, paused }
    mountRef.current?.setUniforms(materialUniforms(settings))
    mountRef.current?.setSpeed(
      paused || reducedMotion.current
        ? 0
        : normalizeMetalSettings(settings).speed
    )
  }, [settings, paused])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let contextLost = false
    let revealFrame = 0
    let mount: ShaderMount | undefined
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    reducedMotion.current = motion.matches

    function updateMotion(): void {
      reducedMotion.current = motion.matches
      if (contextLost) return
      mount?.setSpeed(
        motion.matches || latest.current.paused
          ? 0
          : normalizeMetalSettings(latest.current.settings).speed
      )
    }

    function loseContext(event: Event): void {
      event.preventDefault()
      contextLost = true
      mount?.setSpeed(0)
      mountRef.current = null
      setRenderState({ shape, status: "unavailable" })
    }

    function restoreContext(): void {
      setAttempt((value) => value + 1)
    }

    async function initialize(): Promise<void> {
      try {
        const image = await createMask(shape)
        if (disposed || !container) return
        mount = new ShaderMount(
          container,
          liquidMetalFragmentShader,
          {
            ...materialUniforms(latest.current.settings),
            u_colorBack: [0, 0, 0, 0],
            u_image: image,
            u_shape:
              shape === "circle" || shape === "diamond"
                ? LiquidMetalShapes[shape]
                : LiquidMetalShapes.none,
            u_isImage: shape !== "circle" && shape !== "diamond",
            u_fit: 1,
            u_rotation: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_offsetX: 0,
            u_offsetY: 0,
            u_worldWidth: 0,
            u_worldHeight: 0,
          },
          undefined,
          0,
          12000,
          2,
          1_000_000,
          ["u_image"]
        )
        mountRef.current = mount
        mount.canvasElement.addEventListener("webglcontextlost", loseContext)
        mount.canvasElement.addEventListener(
          "webglcontextrestored",
          restoreContext
        )
        updateMotion()
        // Let the resize observer and first shader draw finish before revealing it.
        revealFrame = requestAnimationFrame(() => {
          revealFrame = requestAnimationFrame(() => {
            if (!disposed && !contextLost) {
              setRenderState({ shape, status: "ready" })
            }
          })
        })
      } catch (error: unknown) {
        if (disposed) return
        mount?.dispose()
        mountRef.current = null
        container?.replaceChildren()
        setRenderState({ shape, status: "unavailable" })
        console.warn("Liquid metal preview unavailable:", error)
      }
    }

    motion.addEventListener("change", updateMotion)
    void initialize()
    return () => {
      disposed = true
      cancelAnimationFrame(revealFrame)
      motion.removeEventListener("change", updateMotion)
      mount?.canvasElement.removeEventListener("webglcontextlost", loseContext)
      mount?.canvasElement.removeEventListener(
        "webglcontextrestored",
        restoreContext
      )
      mount?.dispose()
      mountRef.current = null
    }
  }, [shape, attempt])

  return (
    <div
      aria-hidden={decorative || undefined}
      className={cn("relative size-72 shrink-0", className)}
      data-renderer={ready ? "webgl" : unavailable ? "static" : "loading"}
    >
      <div
        role="img"
        aria-label={`Liquid metal ${shape}`}
        className="relative size-full"
      >
        {unavailable && (
          <div
            aria-hidden="true"
            style={
              shape === "apple" || shape === "github"
                ? {
                    maskImage: `url("${metalIconMaskUrl(shape)}")`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }
                : undefined
            }
            className={cn(
              "absolute inset-[12%] bg-[linear-gradient(140deg,#151515_4%,#d9d9df_24%,#fff_28%,#2c2c31_34%,#101013_50%,#f7f7fa_73%,#65656b_80%,#151515_95%)]",
              shape === "triangle" &&
                "[clip-path:polygon(50%_0,100%_87%,0_87%)]",
              shape === "circle" && "rounded-full",
              shape === "square" && "rounded-[18%]",
              shape === "diamond" &&
                "[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
            )}
          />
        )}
        <div
          ref={containerRef}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 transition-opacity motion-reduce:transition-none",
            ready ? "opacity-100 duration-300" : "opacity-0 duration-0"
          )}
        />
      </div>
      {unavailable && !decorative && (
        <div className="absolute inset-x-0 bottom-0 text-center text-[11px] text-muted-foreground">
          <p>Static preview. Animation is unavailable.</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-1 rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Retry preview
          </button>
        </div>
      )}
    </div>
  )
}
