"use client"

import { useId, type ReactElement } from "react"

import {
  normalizeDistressedSettings,
  type DistressedSettings,
  type DistressedShape,
} from "@/lib/distressed"
import { cn } from "@/lib/utils"

// The original vector from public/hero/motion-grain.svg.
const motionPath =
  "M47.5753 0L22.68 43.9612H0L19.4392 9.63463C22.4526 4.3136 29.9723 0 36.2353 0H47.5753ZM103.193 10.9903C103.193 4.92048 108.27 0 114.533 0C120.796 0 125.873 4.92048 125.873 10.9903C125.873 17.06 120.796 21.9806 114.533 21.9806C108.27 21.9806 103.193 17.06 103.193 10.9903ZM51.8278 0H74.5078L49.6125 43.9612H26.9325L51.8278 0ZM78.6147 0H101.295L81.8554 34.3266C78.8422 39.6477 71.3223 43.9612 65.0594 43.9612H53.7194L78.6147 0Z"

export function Distressed({
  settings,
  shape = "motion",
  text = "SHIPBITS",
  className,
}: {
  settings?: Partial<DistressedSettings>
  shape?: DistressedShape
  text?: string
  className?: string
}): ReactElement {
  const id = useId().replace(/:/g, "")
  const values = normalizeDistressedSettings(settings)
  const radians = (values.angle * Math.PI) / 180
  const dx = Math.cos(radians) / 2
  const dy = Math.sin(radians) / 2
  const grain = values.grain / 100
  const contrast = 1 + values.contrast / 25
  const label = text.trim().slice(0, 20) || "SHIPBITS"
  const shade = (factor: number): string =>
    `#${[1, 3, 5]
      .map((start) =>
        Math.round(parseInt(values.color.slice(start, start + 2), 16) * factor)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")}`

  return (
    <svg
      role="img"
      aria-label={
        shape === "motion"
          ? "Distressed Motion mark"
          : shape === "square"
            ? "Distressed square"
            : `Distressed ${shape}: ${label}`
      }
      viewBox={shape === "square" ? "-8 -8 60 60" : "-12 -12 150 68"}
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient
          id={`${id}-fill`}
          x1={0.5 - dx}
          y1={0.5 - dy}
          x2={0.5 + dx}
          y2={0.5 + dy}
        >
          <stop stopColor={values.color} />
          <stop offset="0.93" stopColor={shade(0.79)} />
          <stop offset="1" stopColor={shade(0.6)} />
        </linearGradient>
        <filter
          id={`${id}-texture`}
          x="-25%"
          y="-60%"
          width="150%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${0.6 / values.sizeX} ${1 / values.sizeY}`}
            numOctaves={3}
            seed={values.seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={values.radius * 2}
            xChannelSelector="R"
            yChannelSelector="G"
            result="distressed"
          />
          <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
          <feComponentTransfer in="mono" result="contrast">
            <feFuncR
              type="linear"
              slope={contrast}
              intercept={(1 - contrast) / 2}
            />
            <feFuncG
              type="linear"
              slope={contrast}
              intercept={(1 - contrast) / 2}
            />
            <feFuncB
              type="linear"
              slope={contrast}
              intercept={(1 - contrast) / 2}
            />
          </feComponentTransfer>
          <feColorMatrix
            in="contrast"
            type="matrix"
            values={`${grain} 0 0 0 ${1 - grain}  0 ${grain} 0 0 ${1 - grain}  0 0 ${grain} 0 ${1 - grain}  0 0 0 1 0`}
            result="grain"
          />
          <feBlend
            in="distressed"
            in2="grain"
            mode="multiply"
            result="textured"
          />
          <feComposite
            in="textured"
            in2="distressed"
            operator="in"
            result="surface"
          />
          {values.clipToShape && (
            <feComposite in="surface" in2="SourceAlpha" operator="in" />
          )}
        </filter>
      </defs>
      <g fill={`url(#${id}-fill)`} filter={`url(#${id}-texture)`}>
        {shape === "square" ? (
          <rect width="44" height="44" rx="6" />
        ) : shape === "motion" ? (
          <path d={motionPath} />
        ) : shape === "text" ? (
          <text
            x="63"
            y="31"
            textAnchor="middle"
            fontFamily="inherit"
            fontSize="25"
            fontWeight="750"
            textLength="122"
            lengthAdjust="spacingAndGlyphs"
          >
            {label}
          </text>
        ) : (
          <rect x="1" y="2" width="124" height="40" rx="20" />
        )}
      </g>
      {shape === "badge" && (
        <text
          x="63"
          y="26"
          textAnchor="middle"
          fontFamily="inherit"
          fontSize="10"
          fontWeight="600"
          fill="#171717"
          textLength={Math.min(98, label.length * 6)}
          lengthAdjust="spacingAndGlyphs"
        >
          {label}
        </text>
      )}
    </svg>
  )
}
