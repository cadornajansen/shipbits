"use client"

import Link from "next/link"
import { ArrowUpRight, Layers, Search, X } from "lucide-react"
import { useId, useState, type ReactElement } from "react"

import { GlassSurface } from "@/components/ui/glass-link"
import type { GlassSettings } from "@/lib/glass-optics"

const destinations = [
  { title: "Glass", detail: "Materials", href: "/glass" },
  { title: "Liquid metal", detail: "Materials", href: "/metal" },
  { title: "How to use", detail: "Guide", href: "/how-to-use" },
]

export function GlassExamples({
  settings,
}: {
  settings: GlassSettings
}): ReactElement {
  const inputId = useId()
  const [query, setQuery] = useState<string>("")
  const results = destinations.filter((item) =>
    item.title.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <section aria-label="Glass examples" className="grid gap-4">
      <h2 className="sr-only">Examples</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="flex min-w-0 flex-col rounded-2xl bg-[#171717] p-5 text-white sm:p-6">
          <div className="relative flex min-h-80 flex-1 items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#ffffff0a,transparent_65%)]"
            />
            <GlassSurface
              settings={settings}
              className="w-full max-w-80 p-5 text-white"
            >
              <div className="mb-8 flex items-center justify-between">
                <Layers className="size-6 text-white/80" strokeWidth={1.25} />
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/60">
                  UI kit
                </span>
              </div>
              <h3 className="text-base font-medium">The component library</h3>
              <p className="mt-2 text-xs leading-5 text-white/50">
                A home for the details of your next project.
              </p>
              <Link
                href="/#experiments"
                className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Open collection <ArrowUpRight className="size-3.5" />
              </Link>
            </GlassSurface>
          </div>
          <p className="mt-5 text-xs text-white/45">Resource card</p>
        </article>
        <article className="flex min-w-0 flex-col rounded-2xl bg-[#171717] p-5 text-white sm:p-6">
          <div className="relative flex min-h-80 flex-1 items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,#ffffff0a,transparent_65%)]"
            />
            <div className="relative w-full max-w-80">
              <GlassSurface
                settings={settings}
                role="search"
                className="px-4 py-3 text-white focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-white/50"
              >
                <div className="flex items-center gap-3">
                  <Search
                    aria-hidden="true"
                    className="size-4 shrink-0 text-white/50"
                  />
                  <label htmlFor={inputId} className="sr-only">
                    Find a component or guide
                  </label>
                  <input
                    id={inputId}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setQuery("")
                    }}
                    placeholder="Find a component…"
                    aria-controls={`${inputId}-results`}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/45 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                      className="rounded-sm p-1 text-white/60 focus-visible:outline-2"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </GlassSurface>
              <ul
                id={`${inputId}-results`}
                aria-label="Matching pages"
                className="mt-4 min-h-36 space-y-1"
              >
                {results.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-xs hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <span>{item.title}</span>
                      <span className="text-[10px] text-white/35">
                        {item.detail}
                      </span>
                    </Link>
                  </li>
                ))}
                {results.length === 0 && (
                  <li className="px-3 py-3 text-xs text-white/50">
                    No matching pages.
                  </li>
                )}
              </ul>
              <span role="status" className="sr-only">
                {results.length} matching pages
              </span>
            </div>
          </div>
          <p className="mt-5 text-xs text-white/45">Quick search</p>
        </article>
      </div>
    </section>
  )
}
