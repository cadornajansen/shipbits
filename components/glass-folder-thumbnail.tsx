import { useId, type ReactElement } from "react"
import { FOLDER_BACK_PATH, FOLDER_FRONT_PATH } from "@/lib/folder-geometry"
import { cn } from "@/lib/utils"

export function GlassFolderThumbnail({
  className,
}: {
  className?: string
}): ReactElement {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  return (
    <svg
      aria-hidden="true"
      viewBox="-12 -12 364 300"
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={`${id}-art`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#233655" />
          <stop offset=".38" stopColor="#ad6b69" />
          <stop offset=".55" stopColor="#e4d5d0" />
          <stop offset=".7" stopColor="#506b89" />
          <stop offset="1" stopColor="#c7d8e8" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2=".1" y2="1">
          <stop stopColor="#ffffff" stopOpacity=".82" />
          <stop offset=".55" stopColor="#f6f6f9" stopOpacity=".92" />
          <stop offset="1" stopColor="#eeeef2" />
        </linearGradient>
      </defs>
      <path d={FOLDER_BACK_PATH} fill={`url(#${id}-art)`} stroke="#ffffff55" />
      <rect
        x="24"
        y="45"
        width="285"
        height="190"
        rx="15"
        fill="#2b303b"
        stroke="#ffffff55"
      />
      <rect x="34" y="62" width="272" height="184" rx="15" fill="#fcfcfc" />
      <path
        d={FOLDER_FRONT_PATH}
        transform="translate(0 74)"
        fill={`url(#${id}-glass)`}
        stroke="#ffffffcc"
        strokeWidth="2"
      />
      <rect x="28" y="217" width="78" height="7" rx="3.5" fill="#252529" />
      <rect x="28" y="233" width="38" height="4" rx="2" fill="#aaaab0" />
      <rect
        x="263"
        y="201"
        width="54"
        height="54"
        rx="16"
        fill="#19191c"
        stroke="#ffffff44"
      />
      <path
        d="M280 228h20m-10-10v20"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
