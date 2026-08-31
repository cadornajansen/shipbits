import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DistributionFinder } from "@/components/resources/distribution-finder"
import { SiteContainer } from "@/components/layout/site-container"
import { Reveal } from "@/components/motion/reveal"
import { getTaxonomy } from "@/features/distribution/repository"
import { createPageMetadata } from "@/lib/seo/metadata"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = createPageMetadata({
  title: "Distribution Finder",
  description:
    "Find relevant directories, launch platforms, marketplaces, and communities for your product.",
  path: "/tools/distribution-finder",
})

export default async function DistributionFinderPage() {
  const taxonomy = await getTaxonomy(createAdminClient())
  return (
    <main className="py-10 sm:py-14">
      <SiteContainer>
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <Reveal>
            <header className="max-w-2xl">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Resources
              </Link>
              <h1 className="mt-4 font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">
                Distribution Finder
              </h1>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Paste your product. Find the best directories, launch platforms,
                marketplaces, communities, and distribution channels for it.
              </p>
            </header>
          </Reveal>
          <Reveal>
            <DistributionFinder taxonomy={taxonomy} />
          </Reveal>
        </div>
      </SiteContainer>
    </main>
  )
}
