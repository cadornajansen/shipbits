"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactElement } from "react"
import { ChevronRight } from "lucide-react"
import { CatalogIcon } from "@/components/catalog-icon"
import {
  catalog,
  catalogGroups,
  gettingStarted,
  type CatalogEntry,
  type CatalogGroupId,
  type CatalogId,
  type MaterialId,
} from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function CollectionSidebar({
  activeEffect,
  activeComponent,
}: {
  activeEffect?: MaterialId
  activeComponent?: CatalogId
}): ReactElement {
  const pathname = usePathname()
  const strip = useRef<HTMLElement>(null)
  const [expandedGroups, setExpandedGroups] = useState<
    Partial<Record<CatalogGroupId, boolean>>
  >({})

  function isActive(entry: CatalogEntry): boolean {
    return (
      entry.id === activeEffect ||
      entry.id === activeComponent ||
      entry.href === pathname ||
      entry.studio === pathname
    )
  }
  useEffect(() => {
    const element = strip.current
    if (!element) return
    function updateFade(): void {
      if (!element) return
      element.style.setProperty(
        "--fade-start",
        element.scrollLeft > 2 ? "20px" : "0px"
      )
      element.style.setProperty(
        "--fade-end",
        element.scrollLeft + element.clientWidth < element.scrollWidth - 2
          ? "20px"
          : "0px"
      )
    }
    function centerActive(): void {
      if (!element || window.innerWidth > 900) return
      const active = element.querySelector<HTMLElement>('[aria-current="page"]')
      if (active)
        element.scrollLeft =
          active.offsetLeft -
          element.offsetLeft -
          (element.clientWidth - active.offsetWidth) / 2
      updateFade()
    }
    centerActive()
    element.addEventListener("scroll", updateFade, { passive: true })
    window.addEventListener("resize", centerActive)
    return () => {
      element.removeEventListener("scroll", updateFade)
      window.removeEventListener("resize", centerActive)
    }
  }, [pathname, activeEffect, activeComponent])
  return (
    <nav
      ref={strip}
      aria-label="Collection"
      className="sticky top-[84px] flex max-h-[calc(100dvh-108px)] min-w-0 [scrollbar-width:none] flex-col gap-4 overflow-y-auto pb-2 max-[900px]:relative max-[900px]:top-auto max-[900px]:max-h-none max-[900px]:flex-row max-[900px]:items-center max-[900px]:gap-1.5 max-[900px]:overflow-x-auto max-[900px]:[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%_-_var(--fade-end,0px)),transparent)] max-[900px]:pb-1 [&::-webkit-scrollbar]:hidden"
    >
      <div
        role="group"
        aria-labelledby="sidebar-getting-started"
        className="flex min-w-0 flex-col max-[900px]:hidden"
      >
        <h2
          id="sidebar-getting-started"
          className="px-3 py-[9px] text-[11px] leading-[14px] font-normal text-[#767676]"
        >
          Getting started
        </h2>
        <div className="flex min-w-0 flex-col gap-1">
          {gettingStarted.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={pathname === entry.href ? "page" : undefined}
              className={cn(
                "flex h-8 w-full items-center rounded-xl px-3 text-[13px] leading-4 font-normal text-[#ededed] transition-colors duration-150 hover:bg-white/[.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#cacaca]/70 motion-reduce:transition-none",
                pathname === entry.href && "bg-white/[.08] text-[#f5f5f5]"
              )}
            >
              {entry.title}
            </Link>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-labelledby="sidebar-collection"
        className="flex min-w-0 flex-col max-[900px]:flex-row max-[900px]:gap-1.5"
      >
        <h2
          id="sidebar-collection"
          className="px-3 py-[9px] text-[11px] leading-[14px] font-normal text-[#767676] max-[900px]:hidden"
        >
          Collection
        </h2>
        {catalogGroups.map((group) => {
          const entries = catalog.filter((entry) => entry.group === group.id)
          const expanded = expandedGroups[group.id] ?? entries.some(isActive)
          const contentId = `sidebar-${group.id}`
          return (
            <div
              key={group.id}
              className="flex min-w-0 flex-col max-[900px]:shrink-0 max-[900px]:flex-row"
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={contentId}
                className="flex h-8 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-[13px] leading-4 font-medium text-[#ededed] transition-colors duration-150 hover:bg-white/[.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#cacaca]/70 motion-reduce:transition-none max-[900px]:hidden"
                onClick={() =>
                  setExpandedGroups((current) => ({
                    ...current,
                    [group.id]: !expanded,
                  }))
                }
              >
                {group.title}
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-[#767676] transition-transform duration-150 motion-reduce:transition-none",
                    expanded && "rotate-90"
                  )}
                />
              </button>
              <div
                id={contentId}
                className={cn(
                  "grid min-w-0 transition-[grid-template-rows,opacity,visibility] duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none max-[900px]:visible max-[900px]:flex max-[900px]:opacity-100",
                  expanded
                    ? "visible grid-rows-[1fr] opacity-100"
                    : "invisible grid-rows-[0fr] opacity-0"
                )}
              >
                <div
                  className={cn(
                    "flex min-h-0 flex-col gap-1 overflow-hidden max-[900px]:flex-row max-[900px]:gap-1.5",
                    group.id === "components" && "min-[901px]:gap-0"
                  )}
                >
                  {entries.map((entry) => {
                    const active = isActive(entry)
                    return (
                      <Link
                        key={entry.id}
                        href={entry.href}
                        className={cn(
                          "flex h-10 w-full items-center gap-2 rounded-xl py-0 pr-2 pl-6 text-[13px] leading-[13px] font-medium whitespace-nowrap text-[#ededed] transition-colors duration-150 hover:bg-white/[.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#cacaca]/70 motion-reduce:transition-none max-[900px]:h-9 max-[900px]:w-auto max-[900px]:shrink-0 max-[900px]:bg-white/[.07] max-[900px]:px-3.5",
                          group.id === "components" && "min-[901px]:h-8",
                          active &&
                            "bg-white/[.08] text-[#f5f5f5] max-[900px]:bg-white/[.16]"
                        )}
                        aria-current={active ? "page" : undefined}
                        title={entry.title}
                      >
                        {group.id !== "components" && (
                          <CatalogIcon
                            id={entry.preview}
                            className="size-6! rounded-md! max-[900px]:hidden"
                          />
                        )}
                        <span className="min-w-0 truncate max-[900px]:overflow-visible">
                          {entry.title}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
