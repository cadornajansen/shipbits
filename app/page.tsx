import Link from "next/link"
import type { ReactElement } from "react"
import { ArrowRight } from "lucide-react"
import { HeroTiles } from "@/components/hero-tiles"
import { HeroTextReveal } from "@/components/hero-text-reveal"
import { ComponentArtwork } from "@/components/component-artwork"
import { FeaturedInteractionPreview } from "@/components/featured-interaction-preview"
import { CatalogIcon } from "@/components/catalog-icon"
import { SiteFAQ } from "@/components/site-faq"
import { catalog, type CatalogId } from "@/lib/catalog"

const featuredIds = [
  "glass",
  "metal",
  "thinking-orbs",
  "agent-companions",
  "mono-icons",
  "precision-dial",
  "command-palette",
] as const satisfies readonly CatalogId[]

const featuredEntries = featuredIds
  .map((id) => catalog.find((entry) => entry.id === id))
  .filter((entry) => entry !== undefined)

const steps = [
  {
    title: "Find your component",
    description: "Explore the collection and try a working preview.",
  },
  {
    title: "Copy it into your project",
    description: "Use the Install tab or copy a prompt for your coding agent.",
  },
  {
    title: "Make it yours",
    description: "Tune a material in Studio and export your exact settings.",
  },
]

export default function Page(): ReactElement {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1240px] px-3 sm:px-6"
      tabIndex={-1}
    >
      <section
        className="relative flex w-full flex-col items-center pt-0 pb-32 text-center [--app-gutter:24px] [--hero-copy-inset:calc(32px-var(--app-gutter))] [--hero-tile-gap:16px] [--hero-tile:clamp(84px,calc((100svh-420px)/3),130px)] max-[760px]:min-h-[calc(100svh-68px)] max-[760px]:items-start max-[760px]:pt-6 max-[760px]:pb-8 max-[760px]:text-left max-sm:[--app-gutter:12px] min-[761px]:min-h-[689px]"
        aria-labelledby="hero-title"
      >
        <span className="relative z-[6] mb-3 inline-flex h-7 items-center rounded-3xl bg-[#181818] px-3 text-[13px] leading-[24.2px] font-normal text-[#b5b5b5] shadow-[0_1px_3px_rgb(0_0_0/.04),inset_0_1px_0_rgb(255_255_255/.02),inset_0_0_0_1px_rgb(196_196_196/.05)] max-[760px]:order-1 max-[760px]:mt-auto max-[760px]:ml-[var(--hero-copy-inset)] min-[761px]:mt-[210px]">
          <HeroTextReveal delay={0.06}>
            {catalog.length}
            <span className="ml-1 text-[#939393]">working components</span>
          </HeroTextReveal>
        </span>
        <h1
          className="relative z-[6] mt-0 max-w-[480px] text-center font-heading text-[42px] leading-[45px] font-medium tracking-[-0.21px] text-[#fefefe] max-[760px]:order-2 max-[760px]:max-w-none max-[760px]:self-stretch max-[760px]:pl-[var(--hero-copy-inset)] max-[760px]:text-left max-[639px]:text-[30px] max-[639px]:leading-[34px]"
          id="hero-title"
        >
          <HeroTextReveal delay={0.14} className="whitespace-nowrap">
            UI worth shipping.
          </HeroTextReveal>
          <HeroTextReveal delay={0.23} className="whitespace-nowrap">
            Made to be yours.
          </HeroTextReveal>
        </h1>
        <p className="relative z-[6] mt-3 max-w-[560px] text-center text-base leading-[24.2px] font-normal text-[#9e9e9e] max-[760px]:order-3 max-[760px]:self-stretch max-[760px]:pl-[var(--hero-copy-inset)] max-[760px]:text-left">
          <HeroTextReveal delay={0.32}>
            Glass, metal, and playful little components from my workbench. Take
            what you like, make it yours, and ship it.
          </HeroTextReveal>
        </p>
        <div className="relative z-[6] mt-5 flex items-center justify-center gap-2 max-[760px]:order-4 max-[760px]:justify-start max-[760px]:pl-[var(--hero-copy-inset)]">
          <HeroTextReveal
            delay={0.41}
            className="inline-flex items-center gap-2"
          >
            <Link
              className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#2a2a2a] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
              href="#experiments"
            >
              Browse
            </Link>
            <Link
              className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#0071fc] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#1a7dff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#0063e0] motion-reduce:transition-none"
              href="/studio"
            >
              Make your own
            </Link>
          </HeroTextReveal>
        </div>
        <HeroTiles />
      </section>
      <section
        id="experiments"
        className="mx-auto grid w-full max-w-[1008px] scroll-mt-6 grid-cols-6 gap-6 max-[1100px]:max-w-[664px] max-[1100px]:grid-cols-2 max-[740px]:max-w-none max-[740px]:grid-cols-1 max-[740px]:gap-4"
        aria-label="Collection"
      >
        {featuredEntries.map((entry) => (
          <article
            className="relative col-span-2 h-[344px] rounded-3xl bg-[#181818] shadow-(--site-ring) transition-colors duration-150 hover:bg-[#1c1c1c] motion-reduce:transition-none max-[1100px]:col-span-1 max-[740px]:h-[290px] [&:nth-child(-n+2)]:col-span-3 max-[1100px]:[&:nth-child(-n+2)]:col-span-1 [&:nth-last-child(-n+2)]:col-span-3 max-[1100px]:[&:nth-last-child(-n+2)]:col-span-1"
            key={entry.id}
            data-featured-preview-trigger
            data-mono-icon-trigger={entry.id === "mono-icons" ? "" : undefined}
          >
            <div
              className="absolute top-3 right-3 left-3 flex h-[254px] items-center justify-center overflow-hidden rounded-[14px] bg-[#131313] shadow-[inset_0_0_0_1px_rgb(255_255_255/.02),inset_0_0_0_1px_rgb(191_192_203/.1)] max-[740px]:h-[200px]"
              aria-hidden="true"
            >
              {entry.id === "thinking-orbs" ||
              entry.id === "agent-companions" ||
              entry.id === "precision-dial" ||
              entry.id === "command-palette" ? (
                <FeaturedInteractionPreview id={entry.id} />
              ) : (
                <ComponentArtwork id={entry.preview} />
              )}
            </div>
            <div className="absolute right-4 bottom-4 left-4 flex min-w-0 items-center gap-3 [&_h2]:text-sm [&_h2]:leading-[15px] [&_h2]:font-medium [&_h2]:text-[#ededed] [&_p]:mt-[9px] [&_p]:truncate [&_p]:text-sm [&_p]:leading-[15px] [&_p]:text-[#767676] [&>div]:min-w-0">
              <CatalogIcon id={entry.preview} />
              <div>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </div>
            <Link
              className="absolute inset-0 z-[6] rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed]"
              href={entry.href}
              aria-label={`Explore ${entry.title}`}
            />
          </article>
        ))}
      </section>
      <section
        className="mx-auto mt-24 w-full max-w-[1008px] text-left max-sm:mt-16 [&_h2]:mb-3.5 [&_h2]:text-left [&_h2]:text-[38px] [&_h2]:leading-[1.16] max-[900px]:[&_h2]:text-[30px] [&>p]:m-0 [&>p]:mb-10 [&>p]:max-w-[46ch] [&>p]:text-left [&>p]:text-base [&>p]:leading-6"
        aria-labelledby="home-how-title"
      >
        <h2
          id="home-how-title"
          className="mb-8 text-center font-heading text-[32px] leading-[38px] font-medium tracking-[-.16px] max-[740px]:text-[28px] max-[740px]:leading-[34px]"
        >
          Find a component.
          <br />
          Make it your own.
        </h2>
        <p className="mx-auto -mt-4 mb-8 max-w-[470px] text-center text-[15px] leading-[23px] text-[#cacaca]/70">
          Explore, copy, and customize. A working starting point for your next
          interface.
        </p>
        <ol className="mb-8 grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1 max-[900px]:gap-3 [&_h3]:text-[15px] [&_h3]:leading-5 [&_h3]:font-medium [&_li]:relative [&_li]:flex [&_li]:flex-col [&_li]:items-start [&_li]:gap-1.5 [&_li]:rounded-3xl [&_li]:bg-[#181818] [&_li]:p-8 [&_li]:shadow-(--site-ring) max-[900px]:[&_li]:p-6 [&_p]:text-sm [&_p]:leading-[22px] [&_p]:text-[#cacaca]/70">
          {steps.map(({ title, description }, index) => (
            <li key={title}>
              <span className="relative isolate mb-2.5 inline-flex size-[21px] items-center justify-center rounded-full bg-[#0071fc] text-[11px] leading-3 text-white shadow-(--site-ring) before:absolute before:-inset-[5.25px] before:-z-10 before:rounded-full before:bg-[#0071fc] before:opacity-20 before:content-['']">
                {index + 1}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/how-to-use"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-3xl border-0 bg-[#2a2a2a] px-3 text-[13px] leading-[13px] font-medium whitespace-nowrap text-white shadow-(--site-ring) transition-colors duration-150 hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] active:bg-[#262626] motion-reduce:transition-none"
        >
          How to use
          <ArrowRight size={14} />
        </Link>
      </section>
      <SiteFAQ />
    </main>
  )
}
