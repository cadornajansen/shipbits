import Link from "next/link"
import { ArrowRight, SearchCheck } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { Badge } from "@/components/ui/badge"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Builder resources",
  description: "Practical ShipBits resources for checking a launch, sharing a published listing, and planning product distribution.",
  path: "/resources",
})

const resources = [
  { href: "/resources/seo-checker", title: "SEO / Launch Checker", description: "Check 12 observable launch signals with deterministic scoring.", icon: SearchCheck, available: true },
] as const

export default function ResourcesPage() {
  return (
    <main className="py-10 sm:py-14">
      <SiteContainer className="flex flex-col gap-9">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">For builders</p>
          <h1 className="mt-2 font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">Useful checks, without the busywork</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">Small, transparent tools for launching and sharing your product. No ranking promises and no black-box scores.</p>
        </header>
        <ul className="grid gap-4 md:grid-cols-2">
          {resources.map(({ href, title, description, icon: Icon, available }) => {
            const content = <><div className="flex items-start justify-between gap-3"><Icon className="size-5" aria-hidden="true" />{available ? <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /> : <Badge variant="secondary">Coming soon</Badge>}</div><h2 className="font-outfit text-lg font-semibold">{title}</h2><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></>
            return <li key={title}>{href ? <Link href={href} className="flex h-full flex-col gap-4 rounded-xl border p-5 transition-colors hover:border-foreground/30">{content}</Link> : <div className="flex h-full flex-col gap-4 rounded-xl border border-dashed p-5">{content}</div>}</li>
          })}
        </ul>
      </SiteContainer>
    </main>
  )
}
