import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup"
import { Reveal } from "@/components/motion/reveal"

const linkGroups = [
  {
    title: "Explore",
    links: [
      ["Products", "/products"],
      ["Categories", "/products#categories"],
      ["Blog", "/blog"],
      ["Resources", "/resources"],
    ],
  },
  {
    title: "For builders",
    links: [
      ["List product", "/#submit-product"],
      ["Directory Submission", "/directory-submission"],
      ["SEO Checker", "/resources/seo-checker"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Refund Policy", "/refund-policy"],
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <Reveal>
        <SiteContainer className="grid gap-9 py-10 lg:grid-cols-[minmax(16rem,1.25fr)_2fr] lg:gap-16">
          <NewsletterSignup compact />
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold">{group.title}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </SiteContainer>
      </Reveal>
      <SiteContainer className="border-t py-5 text-xs text-muted-foreground">
        © {new Date().getUTCFullYear()} ShipBits. Built for people who ship.
      </SiteContainer>
    </footer>
  )
}
