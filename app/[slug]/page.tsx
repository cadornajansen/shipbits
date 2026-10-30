import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactElement } from "react"
import { ArrowLeft } from "lucide-react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { getPlannedPage, plannedPages } from "@/lib/planned-pages"
import { getInformationPage, informationPages } from "@/lib/information-pages"

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = false
export function generateStaticParams(): { slug: string }[] {
  return [...informationPages, ...plannedPages].map(({ slug }) => ({ slug }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const information = getInformationPage(slug)
  const page = information ?? getPlannedPage(slug)
  return {
    title: `${page?.title || "Page"} — Shipbits`,
    description: information?.description,
    alternates: information ? { canonical: `/${slug}` } : undefined,
    robots: { index: Boolean(information), follow: true },
  }
}
export default async function PlannedDestination({
  params,
}: Props): Promise<ReactElement> {
  const slug = (await params).slug
  const information = getInformationPage(slug)
  const page = information ?? getPlannedPage(slug)
  if (!page) notFound()
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[200px_minmax(0,1fr)] items-start gap-x-14 px-3 pt-8 pb-24 max-[900px]:grid-cols-1 max-[900px]:gap-y-6 max-[900px]:pt-4 sm:px-6">
      <CollectionSidebar />
      <main
        id="main-content"
        className="relative max-w-[686px] min-w-0 text-base leading-[25px] outline-none [&_a:not([class])]:underline [&_a:not([class])]:underline-offset-[3px] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:leading-[25px] [&_h2]:font-medium [&_section_p]:text-[#c5c5c5] [&_section+section]:mt-8 [&>a]:mt-7 [&>p]:mt-4 [&>p]:text-[#c5c5c5]"
        tabIndex={-1}
      >
        {!information && (
          <span className="mb-6 inline-flex rounded-3xl bg-[#202020] px-3 py-[5px] text-xs leading-[18px] text-[#aaa] shadow-(--site-ring)">
            Not available yet
          </span>
        )}
        <h1 className="font-heading text-[36px] leading-[42px] font-medium tracking-[-.18px] text-white max-sm:text-[32px] max-sm:leading-[38px]">
          {page.title}
        </h1>
        {information ? (
          <>
            <p>{information.description}</p>
            {information.updated && (
              <p className="text-xs! text-[#969696]!">
                Updated {information.updated}
              </p>
            )}
            {information.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.content}
              </section>
            ))}
          </>
        ) : (
          <>
            <p>{"purpose" in page && page.purpose}</p>
            <p>
              While this page is being planned, the working collection and
              Studio are ready to explore.
            </p>
          </>
        )}
        <Link
          className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#2a2a2a] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
          href="/#experiments"
        >
          <ArrowLeft size={14} />
          Browse components
        </Link>
      </main>
    </div>
  )
}
