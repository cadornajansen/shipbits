"use client"

import { usePathname } from "next/navigation"
import * as m from "motion/react-m"

import { motionEase } from "./reveal"

export function PageEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <PageEnterContent key={pathname}>{children}</PageEnterContent>
}

function PageEnterContent({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      data-motion-page-enter
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: motionEase }}
    >
      {children}
    </m.div>
  )
}
