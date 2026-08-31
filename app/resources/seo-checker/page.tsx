import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { SeoChecker } from "@/components/resources/seo-checker"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Free SEO & launch checker",
  description: "Check a product page's title, description, social previews, headings, and discovery files with a simple, deterministic launch checklist.",
  path: "/resources/seo-checker",
})

export default function SeoCheckerPage() {
  return (
    <main className="py-10 sm:py-14">
      <SiteContainer>
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <header className="flex flex-col gap-3">
            <Link href="/resources" className="w-fit text-sm text-muted-foreground underline-offset-4 hover:underline">Resources</Link>
            <h1 className="font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">Free SEO and launch checker</h1>
            <p className="text-base leading-relaxed text-muted-foreground">Check one public page for observable title, description, canonical, headings, social preview, structured data, robots.txt, and sitemap signals. It is not a full-site crawler, backlink audit, or ranking prediction.</p>
          </header>
          <SeoChecker />
          <p className="text-sm text-muted-foreground">
            Need context? Read the <a className="underline underline-offset-4" href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noopener noreferrer">Google SEO Starter Guide</a> or browse our <Link href="/blog" className="underline underline-offset-4">launch articles</Link>.
          </p>
        </div>
      </SiteContainer>
    </main>
  )
}
