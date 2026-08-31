"use client"

import type { ReactNode } from "react"
import type { Variants } from "motion/react"
import * as m from "motion/react-m"

export const motionEase = [0.22, 1, 0.36, 1] as const

const revealVariants = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "fade-up": {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.99 },
    visible: { opacity: 1, scale: 1 },
  },
} satisfies Record<string, Variants>

type RevealVariant = keyof typeof revealVariants

export function Reveal({
  children,
  className,
  variant = "fade-up",
}: {
  children: ReactNode
  className?: string
  variant?: RevealVariant
}) {
  return (
    <m.div
      data-motion-reveal
      className={className}
      variants={revealVariants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.4, ease: motionEase }}
    >
      {children}
    </m.div>
  )
}
