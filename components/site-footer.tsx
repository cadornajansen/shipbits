import Link from "next/link"
import type { ReactElement } from "react"
import { SiteBrand } from "@/components/site-brand"
import { site } from "@/lib/site"

const groups = [
  {
    title: "Collection",
    links: [
      { title: "Browse collection", href: "/#experiments" },
      { title: "Thinking orbs", href: "/components/thinking-orbs" },
      { title: "AI agents", href: "/components/agent-companions" },
      { title: "Mono icons", href: "/icons/mono-icons" },
    ],
  },
  {
    title: "Product",
    links: [
      { title: "Studio", href: "/studio" },
      { title: "How to use", href: "/how-to-use" },
      { title: "Skill", href: "/skill" },
      { title: "GitHub", href: site.repository },
    ],
  },
  {
    title: "Information",
    links: [
      { title: "Support", href: "/support" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
      { title: "Contact", href: "/contact" },
    ],
  },
]

export function SiteFooter(): ReactElement {
  return (
    <footer className="mx-auto mt-28 flex w-full max-w-[1240px] flex-col gap-[25px] px-3 pb-16 text-[13px] leading-[18.2px] max-sm:px-6 sm:px-6 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-3 [&_a]:focus-visible:outline-[#ededed]">
      <div className="flex flex-wrap justify-between gap-12 max-[720px]:flex-col max-[720px]:gap-8">
        <div className="flex max-w-[260px] flex-col gap-2.5 text-[#cacaca]/70 [&_a]:text-white [&_a]:opacity-70">
          <SiteBrand />
          <p>Crafted UI components, ready to make your own.</p>
        </div>
        <nav
          className="flex gap-14 max-[720px]:flex-wrap max-[720px]:gap-x-10 max-[720px]:gap-y-8"
          aria-label="Footer"
        >
          {groups.map((group) => (
            <div
              className="flex flex-col gap-2 [&_a]:text-[#cacaca]/70 [&_a]:transition-colors [&_a]:duration-150 [&_a]:hover:text-white [&_a]:motion-reduce:transition-none [&_h2]:mb-0.5 [&_h2]:text-[13px] [&_h2]:font-medium [&_h2]:text-[#cacaca]/50"
              key={group.title}
            >
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <p className="text-[11px] text-[#8f8f8f] [&_a]:underline [&_a]:underline-offset-2">
        Interface adapted from{" "}
        <a href="https://github.com/Jakubantalik/Libraries.dev">
          Libraries.dev
        </a>{" "}
        by Jakub Antalik, under the MIT license.
      </p>
    </footer>
  )
}
