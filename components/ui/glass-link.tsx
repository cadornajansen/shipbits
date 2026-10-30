"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactElement,
} from "react"

import { buttonVariants } from "@/components/ui/button"
import {
  createDisplacementMap,
  normalizeGlassSettings,
  type GlassSettings,
} from "@/lib/glass-optics"
import { cn } from "@/lib/utils"

type GlassLinkProps = ComponentPropsWithoutRef<"a"> & {
  settings?: Partial<GlassSettings>
  /** Set to "off" to use the CSS material without SVG backdrop refraction. */
  refractionMode?: "auto" | "off"
}

type GlassStyle = CSSProperties & Record<`--glass-${string}`, string>
type LensMap = { url: string; width: number; height: number }
type GlassSurfaceProps = ComponentPropsWithoutRef<"div"> & {
  settings?: Partial<GlassSettings>
  refractionMode?: "auto" | "off"
}

function materialStyle(settings: GlassSettings): GlassStyle {
  const {
    lightAngle,
    lightIntensity,
    splay,
    depth,
    frost,
    radius,
    tint,
    fillOpacity,
  } = settings
  const light = lightIntensity / 100
  const spread = splay / 100
  const angle = lightAngle + 180
  const radians = (lightAngle * Math.PI) / 180
  const x = -Math.sin(radians)
  const y = Math.cos(radians)
  const white = (alpha: number): string => `rgb(255 255 255 / ${alpha * light})`

  return {
    "--glass-radius": `${radius}px`,
    "--glass-frost": `blur(${frost}px)`,
    "--glass-tint": `color-mix(in srgb, ${tint} ${fillOpacity}%, transparent)`,
    "--glass-rim": `linear-gradient(${angle}deg, ${white(0.82)} 0%, ${white(0.16)} ${20 + spread * 15}%, ${white(0.025)} 45%, ${white(0.025)} 55%, ${white(0.12)} ${80 - spread * 15}%, ${white(0.56)} 100%)`,
    "--glass-sheen": `linear-gradient(${angle}deg, ${white(0.025 + spread * 0.035)}, transparent 45%, ${white(0.015)}, ${white(0.07 + spread * 0.04)})`,
    "--glass-bevel": `inset ${x}px ${y}px ${Math.max(1, depth * 0.35)}px ${white(0.045)}, inset ${-x * 2}px ${-y * 2}px ${Math.max(1, depth * 0.7)}px ${white(0.07)}, inset 0 0 1px ${white(0.1)}, 0 2px 5px rgb(0 0 0 / 0.06)`,
  }
}

export function GlassLink({
  settings,
  refractionMode = "auto",
  className,
  style,
  children,
  ...props
}: GlassLinkProps): ReactElement {
  return (
    <a
      {...props}
      style={{
        borderRadius: normalizeGlassSettings(settings).radius,
        ...style,
      }}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "group/glass relative min-h-11 border-0 bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground dark:hover:bg-transparent",
        className
      )}
    >
      <GlassSurface
        aria-hidden="true"
        settings={settings}
        refractionMode={refractionMode}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
      />
      <span className="relative">{children}</span>
    </a>
  )
}

export function GlassSurface({
  settings,
  refractionMode = "auto",
  className,
  style,
  children,
  ...props
}: GlassSurfaceProps): ReactElement {
  const glass = normalizeGlassSettings(settings)
  const { radius, depth, refraction, dispersion, frost } = glass
  const anchorRef = useRef<HTMLDivElement>(null)
  const filterId = `glass-${useId().replace(/:/g, "")}`
  const [map, setMap] = useState<LensMap | null>(null)
  const refractionEnabled = refractionMode === "auto" && refraction > 0

  useEffect(() => {
    // Parsing url() is not proof of rendering support. Keep WebKit/Firefox on CSS.
    const chromium =
      /Chrome\//.test(navigator.userAgent) &&
      !/EdgiOS|CriOS/.test(navigator.userAgent)
    const element = anchorRef.current
    if (!element || !chromium || !refractionEnabled) return

    let frame = 0
    const updateMap = (): void => {
      const { width, height } = element.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const generated = createDisplacementMap(width, height, radius, depth)
      const canvas = document.createElement("canvas")
      canvas.width = generated.width
      canvas.height = generated.height
      const context = canvas.getContext("2d")
      if (!context) return
      const image = context.createImageData(generated.width, generated.height)
      image.data.set(generated.pixels)
      context.putImageData(image, 0, 0)
      setMap({ url: canvas.toDataURL(), width, height })
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateMap)
    })
    observer.observe(element)
    return (): void => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [radius, depth, refractionEnabled])

  const enhanced = map !== null && refractionEnabled
  // Negative scale samples inward for a convex lens; max offset is half the scale.
  const scale =
    -(refraction / 100) *
    Math.min(depth, (map?.width ?? 162) / 2, (map?.height ?? 45) / 2) *
    1.2
  const split = (dispersion / 100) * 0.18
  const variables: GlassStyle = {
    ...materialStyle(glass),
    "--glass-backdrop": enhanced ? `url("#${filterId}")` : `blur(${frost}px)`,
    ...style,
  }

  return (
    <div
      {...props}
      ref={anchorRef}
      data-glass-renderer={enhanced ? "refractive" : "css"}
      style={variables}
      className={cn(
        "group/glass relative min-h-11 rounded-(--glass-radius) border-0 bg-transparent bg-clip-border text-foreground shadow-none transition-[transform,box-shadow] duration-200 hover:bg-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground focus-visible:outline-solid motion-reduce:transform-none motion-reduce:transition-none dark:hover:bg-transparent forced-colors:border forced-colors:border-[ButtonText] [@media(prefers-reduced-transparency:reduce)]:border [@media(prefers-reduced-transparency:reduce)]:border-foreground/30 [@media(prefers-reduced-transparency:reduce)]:bg-background! [@media(prefers-reduced-transparency:reduce)]:[&>[aria-hidden]]:hidden",
        className
      )}
    >
      {enhanced && (
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute size-0"
        >
          <defs>
            <filter
              id={filterId}
              x="-50%"
              y="-100%"
              width="200%"
              height="300%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={frost}
                edgeMode="duplicate"
                result="frosted"
              />
              <feImage
                href={map.url}
                x="0"
                y="0"
                width={map.width}
                height={map.height}
                preserveAspectRatio="none"
                result="lens"
              />
              <feDisplacementMap
                in="frosted"
                in2="lens"
                scale={scale * (1 + split)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="red-shift"
              />
              <feDisplacementMap
                in="frosted"
                in2="lens"
                scale={scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="green-shift"
              />
              <feDisplacementMap
                in="frosted"
                in2="lens"
                scale={scale * (1 - split)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="blue-shift"
              />
              <feColorMatrix
                in="red-shift"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="red"
              />
              <feColorMatrix
                in="green-shift"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="green"
              />
              <feColorMatrix
                in="blue-shift"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="blue"
              />
              <feBlend in="red" in2="green" mode="screen" result="red-green" />
              <feBlend in="red-green" in2="blue" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-(--glass-tint) [backdrop-filter:var(--glass-backdrop)] [-webkit-backdrop-filter:var(--glass-frost)] forced-colors:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] [box-shadow:var(--glass-bevel)] [background:var(--glass-sheen)] forced-colors:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] [mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] mask-exclude [mask-clip:content-box,border-box] p-px [background:var(--glass-rim)] forced-colors:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground/4 opacity-0 transition-opacity duration-200 group-hover/glass:opacity-100 group-active/glass:opacity-0 motion-reduce:transition-none forced-colors:hidden"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
