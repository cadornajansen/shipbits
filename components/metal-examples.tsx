"use client"

import Link from "next/link"
import { ArrowDownToLine, ArrowUpRight, Code2 } from "lucide-react"
import type { ReactElement } from "react"

import { LiquidMetal } from "@/components/ui/liquid-metal"
import type { MetalSettings } from "@/lib/liquid-metal"

export function MetalExamples({
  settings,
  paused,
}: {
  settings: MetalSettings
  paused: boolean
}): ReactElement {
  return (
    <section aria-label="Liquid metal examples" className="grid gap-4">
      <h2 className="sr-only">Examples</h2>
      <div className="grid grid-cols-2 gap-4">
        {(["apple", "github"] as const).map((shape) => (
          <figure
            key={shape}
            className="flex min-w-0 flex-col items-center justify-center gap-4 rounded-2xl bg-[#171717] px-4 py-8 sm:py-12"
          >
            <LiquidMetal
              settings={settings}
              shape={shape}
              paused={paused}
              className="size-28 sm:size-44"
            />
            <figcaption className="text-xs text-white/50">
              {shape === "apple" ? "Apple" : "GitHub"}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="flex flex-col items-start rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8">
          <div className="mb-6 flex w-full items-center justify-between">
            <LiquidMetal
              settings={settings}
              shape="apple"
              paused={paused}
              className="size-16"
            />
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
              Desktop
            </span>
          </div>
          <h3 className="text-base font-medium">Made for your next app.</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            A polished entry point for a desktop release.
          </p>
          <Link
            href="/how-to-use"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <ArrowDownToLine className="size-3.5" /> Installation guide
          </Link>
        </article>
        <article className="flex flex-col items-start rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8">
          <div className="mb-6 flex w-full items-center justify-between">
            <LiquidMetal
              settings={settings}
              shape="github"
              paused={paused}
              className="size-16"
            />
            <Code2 className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">shipbits /</p>
          <h3 className="mt-1 text-base font-medium">Your next component.</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            A repository card with a little more character.
          </p>
          <Link
            href="/#experiments"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Browse collection <ArrowUpRight className="size-3.5" />
          </Link>
        </article>
      </div>
    </section>
  )
}
