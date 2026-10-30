"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useState, type ReactElement } from "react"
import { counterCharacters } from "@/lib/precision-controls"
import { cn } from "@/lib/utils"

export type PrecisionCounterProps = {
  value: number
  decimals?: number
  locale?: string
  minDigits?: number
  prefix?: string
  suffix?: string
  label?: string
  className?: string
}

export function PrecisionCounter({
  value,
  decimals = 2,
  locale = "en-US",
  minDigits = 6,
  prefix,
  suffix,
  label,
  className,
}: PrecisionCounterProps): ReactElement {
  const current = Number.isFinite(value) ? value : 0
  const minimum = Math.min(100, Math.max(1, Math.trunc(minDigits) || 1))
  const [previous, setPrevious] = useState(current)
  const [direction, setDirection] = useState(1)
  const [reserved, setReserved] = useState(minimum)
  const reduced = useReducedMotion()
  const characters = counterCharacters(current, decimals, locale)
  if (previous !== current) {
    setPrevious(current)
    setDirection(current >= previous ? 1 : -1)
  }
  if (characters.length > reserved) setReserved(characters.length)
  return (
    <span
      role="img"
      aria-label={
        label ??
        `${prefix ?? ""}${characters.map((item) => item.character).join("")}${suffix ?? ""}`
      }
      className={cn(
        "relative inline-flex items-baseline justify-end font-mono tabular-nums",
        className
      )}
    >
      {prefix && (
        <span aria-hidden className="mr-1 text-muted-foreground">
          {prefix}
        </span>
      )}
      <span aria-hidden className="relative inline-flex justify-end">
        <span className="invisible inline-flex select-none">
          {Array.from({ length: Math.max(reserved, minimum) }, (_, index) => (
            <span key={index} className="w-[.62em]">
              0
            </span>
          ))}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-baseline">
          {characters.map(({ key, character, digit }) =>
            digit ? (
              <span
                key={key}
                className="relative inline-block h-[1.25em] w-[.62em] overflow-hidden align-bottom"
              >
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  <motion.span
                    key={character}
                    custom={direction}
                    variants={{
                      enter: (sign: number) => ({
                        y: reduced ? 0 : `${sign * 100}%`,
                        opacity: reduced ? 1 : 0,
                      }),
                      settled: { y: "0%", opacity: 1 },
                      leave: (sign: number) => ({
                        y: reduced ? 0 : `${sign * -100}%`,
                        opacity: reduced ? 1 : 0,
                      }),
                    }}
                    initial="enter"
                    animate="settled"
                    exit="leave"
                    transition={{
                      duration: reduced ? 0 : 0.34,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-x-0 top-0 text-center"
                  >
                    {character}
                  </motion.span>
                </AnimatePresence>
              </span>
            ) : (
              <span
                key={key}
                className="inline-block h-[1.25em] w-[.62em] text-center"
              >
                {character}
              </span>
            )
          )}
        </span>
      </span>
      {suffix && (
        <span aria-hidden className="ml-2 text-[.4em] text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  )
}
