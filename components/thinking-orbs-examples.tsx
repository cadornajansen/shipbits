"use client"

import Link from "next/link"
import type { ReactElement } from "react"
import { AI_ORB_LOOKS } from "@/components/ui/ai-orb"
import { OrbUseCase } from "@/components/orb-use-case"

const EXAMPLES = AI_ORB_LOOKS.filter((look) => look.variant === "default").sort(
  (a, b) =>
    Number(b.state === "orchestrating") - Number(a.state === "orchestrating")
)

export function ThinkingOrbsExamples(): ReactElement {
  return (
    <section
      aria-label="Orb badge and interface examples"
      className="grid gap-4 sm:grid-cols-2"
    >
      {EXAMPLES.map((look) => (
        <Link
          key={look.title}
          href={{
            pathname: "/studio/thinking-orbs",
            query: { state: look.state, variant: look.variant },
          }}
          aria-label={`Customize ${look.title} in Studio`}
          data-orb-example={look.title}
          className="flex h-[260px] min-w-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#171717] px-4 transition-colors duration-150 hover:bg-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none sm:h-[290px] [&>[data-slot=badge]]:h-[82px] [&>[data-slot=badge]]:w-72 [&>[data-slot=badge]]:justify-start"
        >
          <OrbUseCase {...look} size="lg" presentation="badge" />
        </Link>
      ))}
    </section>
  )
}
