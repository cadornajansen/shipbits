"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactElement } from "react"
import { Coffee, Menu, X } from "lucide-react"
import { SiteBrand } from "@/components/site-brand"
import { catalog } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

const navigation = [
  { title: "Collection", href: "/#experiments" },
  { title: "How to use", href: "/how-to-use" },
  { title: "Skill", href: "/skill" },
  { title: "Studio", href: "/studio" },
] as const

export function SiteHeader(): ReactElement {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    mobileRef.current?.querySelector<HTMLAnchorElement>("a")?.focus()
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileOpen(false)
        triggerRef.current?.focus()
      }
      if (event.key !== "Tab") return
      const links = mobileRef.current?.querySelectorAll<HTMLAnchorElement>("a")
      if (!links?.length) return
      const first = links[0]
      const last = links[links.length - 1]
      if (
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault()
        triggerRef.current?.focus()
      } else if (document.activeElement === triggerRef.current) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    function onResize(): void {
      if (window.innerWidth > 639) setMobileOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
    }
  }, [mobileOpen])

  function active(href: string): boolean {
    return href === "/#experiments"
      ? catalog.some((entry) => entry.href === pathname)
      : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <header className="relative z-50 mx-auto w-full max-w-[1240px] px-3 sm:px-6">
      <a
        className="fixed -top-25 left-4 z-[100] rounded-xl bg-[#2a2a2a] p-3 text-[13px] focus:top-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="relative z-[3] flex items-center justify-between gap-2 py-4 sm:gap-4">
        <div className="flex min-w-0 items-center gap-4 min-[1001px]:gap-[34px]">
          <SiteBrand />
          <nav
            aria-label="Main"
            className="hidden items-center min-[1001px]:gap-2 sm:flex"
          >
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active(link.href) ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-full px-2.5 text-[13px] leading-4 font-medium whitespace-nowrap text-[#cacaca]/70 transition-colors duration-150 hover:bg-white/[.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none min-[1001px]:px-3.5",
                  active(link.href) && "bg-white/[.06] text-white"
                )}
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {site.coffeeUrl && (
            <Link
              href={site.coffeeUrl}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ffdd00] px-3 text-[13px] leading-4 font-medium whitespace-nowrap text-[#191919] transition-colors duration-150 hover:bg-[#ffe64d] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none sm:px-4"
              aria-label="Buy me a coffee"
            >
              <Coffee size={16} aria-hidden="true" />
              <span className="hidden min-[420px]:inline">Buy me a coffee</span>
              <span className="min-[420px]:hidden">Coffee</span>
            </Link>
          )}
          <Link
            href={site.repository}
            className="hidden h-9 items-center justify-center gap-1.5 rounded-full bg-white/[.07] px-3 text-[13px] leading-4 font-medium whitespace-nowrap text-[#cacaca]/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none min-[901px]:inline-flex"
            aria-label="GitHub"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="16"
              height="16"
            >
              <path d="M12 .75a11.25 11.25 0 0 0-3.557 21.923c.563.104.77-.244.77-.542 0-.267-.01-.975-.015-1.914-3.13.68-3.791-1.508-3.791-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.078-.685.078-.685 1.13.079 1.724 1.16 1.724 1.16 1.004 1.72 2.634 1.223 3.275.936.102-.728.393-1.223.715-1.504-2.498-.284-5.124-1.25-5.124-5.563 0-1.23.44-2.233 1.16-3.02-.116-.284-.503-1.43.11-2.978 0 0 .945-.303 3.094 1.154a10.787 10.787 0 0 1 5.625 0c2.148-1.457 3.092-1.154 3.092-1.154.614 1.548.228 2.694.112 2.978.722.787 1.158 1.79 1.158 3.02 0 4.324-2.63 5.276-5.136 5.555.404.35.766 1.043.766 2.1 0 1.517-.014 2.741-.014 3.114 0 .3.203.65.774.54A11.25 11.25 0 0 0 12 .75Z" />
            </svg>
            <span>GitHub</span>
          </Link>
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[.07] text-[#cacaca]/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none sm:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div
          ref={mobileRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 overflow-y-auto bg-[#121212]/95 px-8 pt-22 pb-8 backdrop-blur-xl"
        >
          <nav
            aria-label="Mobile"
            className="flex flex-col gap-3"
            onClick={() => setMobileOpen(false)}
          >
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active(link.href) ? "page" : undefined}
                className="font-heading text-[28px] leading-9 focus-visible:outline-2 focus-visible:outline-offset-3"
              >
                {link.title}
              </Link>
            ))}
            <div className="mt-7 grid grid-cols-2 gap-5 text-sm text-[#cacaca]/70">
              <Link
                href={site.repository}
                className="focus-visible:outline-2 focus-visible:outline-offset-3"
              >
                GitHub
              </Link>
              {site.coffeeUrl && (
                <Link
                  href={site.coffeeUrl}
                  className="focus-visible:outline-2 focus-visible:outline-offset-3"
                >
                  Buy me a coffee
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
