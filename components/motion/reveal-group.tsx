"use client"

import type { ReactNode } from "react"
import type { Variants } from "motion/react"
import * as m from "motion/react-m"

import { motionEase } from "./reveal"

const groupVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
} satisfies Variants

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: motionEase },
  },
} satisfies Variants

export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "ul" | "ol"
}) {
  const props = {
    "data-motion-reveal": true,
    className,
    variants: groupVariants,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.18 },
  }
  return as === "ul" ? (
    <m.ul {...props}>{children}</m.ul>
  ) : as === "ol" ? (
    <m.ol {...props}>{children}</m.ol>
  ) : (
    <m.div {...props}>{children}</m.div>
  )
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "li"
}) {
  const props = { "data-motion-reveal": true, className, variants: itemVariants }
  return as === "li" ? (
    <m.li {...props}>{children}</m.li>
  ) : (
    <m.div {...props}>{children}</m.div>
  )
}
