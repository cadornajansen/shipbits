import type { ReactElement } from "react"
import { AI_ORB_FRAMES } from "@/lib/ai-orb-frames"

// SVG serialization must match across server and browser math implementations.
const frame = AI_ORB_FRAMES.thinking(64, 0.6, {})

export function ThinkingOrbThumbnail({
  className,
}: {
  className?: string
}): ReactElement {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {frame.dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x.toFixed(4)}
          cy={dot.y.toFixed(4)}
          r={dot.r.toFixed(4)}
          fill="currentColor"
          opacity={((1 - dot.white) * (dot.a ?? 1)).toFixed(4)}
        />
      ))}
    </svg>
  )
}
