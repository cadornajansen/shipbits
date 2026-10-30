"use client"

import type { ReactElement, ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export function HeroTextReveal({
  children,
  delay,
  className,
}: {
  children: ReactNode
  delay: number
  className?: string
}): ReactElement {
  const reduced = useReducedMotion()

  return (
    <motion.span
      className={cn(
        "block motion-reduce:transform-none! motion-reduce:opacity-100!",
        className
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.6,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.span>
  )
}
