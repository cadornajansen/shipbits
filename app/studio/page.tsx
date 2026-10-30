import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { ReactElement } from "react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { CatalogIcon } from "@/components/catalog-icon"
import { catalog } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "Studio — Shipbits",
  description:
    "Live component editors. Customize materials and thinking orbs, then copy your settings without an account.",
}
export default function StudioPage(): ReactElement {
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[200px_minmax(0,1fr)] items-start gap-x-14 px-3 pt-8 pb-24 max-[900px]:grid-cols-1 max-[900px]:gap-y-6 max-[900px]:pt-4 sm:px-6">
      <CollectionSidebar />
      <main
        className="relative min-w-0 outline-none"
        id="main-content"
        tabIndex={-1}
      >
        <h1 className="font-heading text-[36px] leading-[42px] font-medium tracking-[-.18px] text-white max-sm:text-[32px] max-sm:leading-[38px]">
          Studio
        </h1>
        <p className="mt-4 mb-8 max-w-[620px] text-base leading-[24.2px] text-[#cacaca]/70 max-sm:text-sm max-sm:leading-[22px]">
          Make it yours. Pick a component, adjust its settings, and copy the
          code. No account needed.
        </p>
        <div className="grid gap-3">
          {catalog
            .filter((entry) => entry.studio)
            .map((entry) => (
              <Link
                href={entry.studio!}
                className="flex items-center gap-4 rounded-[20px] bg-[#181818] p-5 shadow-(--site-ring) hover:bg-[#202020] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] max-sm:p-4 [&_h2]:text-[15px] [&_h2]:font-medium [&_p]:mt-1.5 [&_p]:text-[13px] [&_p]:text-[#cacaca]/70 [&>svg]:ml-auto [&>svg]:shrink-0 [&>svg]:text-[#cacaca]/70"
                key={entry.id}
              >
                <CatalogIcon id={entry.preview} />
                <div>
                  <h2>{entry.title}</h2>
                  <p>{entry.summary}</p>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
        </div>
      </main>
    </div>
  )
}
