import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense, type ReactElement } from "react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { CatalogIcon } from "@/components/catalog-icon"
import { GlassLab } from "@/components/glass-lab"
import { MetalLab } from "@/components/metal-lab"
import { DistressedLab } from "@/components/distressed-lab"
import { MaterialLab } from "@/components/material-lab"
import { ThinkingOrbsStudio } from "@/components/thinking-orbs-studio"
import { catalog, getCatalogEntry } from "@/lib/catalog"

export function generateStaticParams(): { id: string }[] {
  return catalog.filter((entry) => entry.studio).map(({ id }) => ({ id }))
}
export const dynamicParams = false
type Props = { params: Promise<{ id: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getCatalogEntry((await params).id)
  return { title: `${entry?.title || "Component"} Studio — Shipbits` }
}
export default async function StudioEditorPage({
  params,
}: Props): Promise<ReactElement> {
  const entry = getCatalogEntry((await params).id)
  if (!entry?.studio) notFound()
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[200px_minmax(0,1fr)] items-start gap-x-14 px-3 pt-8 pb-24 max-[900px]:grid-cols-1 max-[900px]:gap-y-6 max-[900px]:pt-4 sm:px-6">
      <CollectionSidebar />
      <main
        id="main-content"
        className="relative min-w-0 outline-none"
        tabIndex={-1}
      >
        <div className="mb-7 flex items-start justify-between gap-4 max-sm:flex-col [&>a]:mt-1">
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
          <Link
            className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#2a2a2a] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
            href={entry.href}
          >
            View component
          </Link>
        </div>
        {entry.id === "glass" ? (
          <GlassLab />
        ) : entry.id === "metal" ? (
          <MetalLab />
        ) : entry.id === "distressed" ? (
          <DistressedLab />
        ) : entry.id === "foil" || entry.id === "titanium" ? (
          <MaterialLab material={entry.id} />
        ) : entry.id === "thinking-orbs" ? (
          <Suspense fallback={<div className="min-h-[460px]" />}>
            <ThinkingOrbsStudio />
          </Suspense>
        ) : null}
      </main>
    </div>
  )
}
