import type { ReactElement } from "react"
import { cn } from "cn"

export function AIChatThumbnail({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox={compact ? "0 0 32 32" : "0 0 320 220"}
      className={cn(
        "animate-[sb-chat-thumbnail_9s_ease-in-out_infinite] motion-reduce:animate-none",
        className
      )}
      fill="none"
    >
      {compact ? (
        <>
          <rect
            x="2"
            y="3"
            width="28"
            height="26"
            rx="8"
            fill="currentColor"
            opacity=".06"
          />
          <path
            d="M9 12h14M9 17h9"
            stroke="currentColor"
            strokeOpacity=".7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="23" cy="23" r="2" fill="currentColor" opacity=".5" />
        </>
      ) : (
        <>
          <rect
            x="12"
            y="10"
            width="296"
            height="200"
            rx="18"
            fill="currentColor"
            fillOpacity=".025"
            stroke="currentColor"
            strokeOpacity=".1"
          />
          <rect
            x="169"
            y="38"
            width="116"
            height="23"
            rx="8"
            fill="currentColor"
            opacity=".07"
          />
          <path
            d="M181 50h90"
            stroke="currentColor"
            strokeOpacity=".35"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="32"
            y="77"
            width="17"
            height="17"
            rx="6"
            fill="#9e9cba"
            fillOpacity=".65"
          />
          <path
            d="M61 83h165M61 94h133M61 105h151"
            stroke="currentColor"
            strokeOpacity=".24"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="61"
            y="119"
            width="134"
            height="20"
            rx="6"
            stroke="currentColor"
            strokeOpacity=".13"
          />
          <path
            d="m70 129 3 3 6-7M87 129h88"
            stroke="currentColor"
            strokeOpacity=".35"
            strokeLinecap="round"
          />
          <rect
            x="31"
            y="156"
            width="258"
            height="38"
            rx="12"
            fill="currentColor"
            fillOpacity=".025"
            stroke="#9d9bbb"
            strokeOpacity=".4"
          />
          <path
            d="M44 170h99"
            stroke="currentColor"
            strokeOpacity=".2"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="274" cy="179" r="7" fill="currentColor" opacity=".4" />
          <path
            d="m271 179 3-3 3 3M274 176v6"
            stroke="var(--background)"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
