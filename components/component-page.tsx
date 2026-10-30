import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { ReactElement } from "react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { CatalogIcon } from "@/components/catalog-icon"
import { ComponentShowcase } from "@/components/component-showcase"
import { catalog, getCatalogEntry, type CatalogId } from "@/lib/catalog"

export function ComponentPage({ id }: { id: CatalogId }): ReactElement {
  const entry = getCatalogEntry(id)!
  const index = catalog.indexOf(entry)
  const previous = catalog[(index + catalog.length - 1) % catalog.length]
  const next = catalog[(index + 1) % catalog.length]
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[200px_minmax(0,1fr)] items-start gap-x-14 px-3 pt-8 pb-24 max-[900px]:grid-cols-1 max-[900px]:gap-y-6 max-[900px]:pt-4 sm:px-6">
      <CollectionSidebar />
      <main
        id="main-content"
        className="relative min-w-0 outline-none"
        tabIndex={-1}
      >
        <nav
          className="absolute top-0.5 right-0 flex gap-[15px] max-[900px]:hidden"
          aria-label="Component pages"
        >
          <Link
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 bg-white/[.07] p-0 text-[#cacaca]/70 transition-colors duration-150 hover:bg-white/10 hover:text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none"
            href={previous.href}
            aria-label={`Previous — ${previous.title}`}
          >
            <ArrowLeft size={16} />
          </Link>
          <Link
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 bg-white/[.07] p-0 text-[#cacaca]/70 transition-colors duration-150 hover:bg-white/10 hover:text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none"
            href={next.href}
            aria-label={`Next — ${next.title}`}
          >
            <ArrowRight size={16} />
          </Link>
        </nav>
        <div className="flex flex-col gap-[21px] pt-1">
          <CatalogIcon id={entry.preview} />
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-[36px] leading-[42px] font-medium tracking-[-.18px] text-white max-sm:text-[32px] max-sm:leading-[38px]">
              {entry.title}
            </h1>
            <p className="text-base leading-[24.2px] text-[#cacaca]/70 max-sm:text-sm max-sm:leading-[22px]">
              {entry.description}
            </p>
          </div>
        </div>
        <ComponentShowcase entry={entry} />
      </main>
    </div>
  )
}
