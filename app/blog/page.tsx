import { ArticleList } from "@/components/blog/article-list"
import { SiteContainer } from "@/components/layout/site-container"
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup"
import { Separator } from "@/components/ui/separator"
import { getPublishedArticles } from "@/features/blog/queries"
import { createPageMetadata } from "@/lib/seo/metadata"
import { Reveal } from "@/components/motion/reveal"

export const revalidate = 3600

export const metadata = createPageMetadata({
  title: "Launch notes for builders",
  description:
    "Practical guides to launching a software product, choosing directories, and covering your SEO basics. Written for builders getting their work out into the world.",
  path: "/blog",
})

export default async function BlogPage() {
  const articles = await getPublishedArticles()

  return (
    <main className="py-10 sm:py-16">
      <SiteContainer>
        <Reveal>
          <header className="mb-10 flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              The ShipBits blog
            </p>
            <h1 className="font-outfit text-3xl font-bold tracking-tight sm:text-4xl">
              Build it. Launch it. Keep learning.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Practical notes on product launches, distribution, and getting the
              basics right. For builders, not algorithms.
            </p>
          </header>
        </Reveal>
        <Reveal>
          <ArticleList articles={articles} />
        </Reveal>
        <Reveal variant="fade">
          <Separator className="my-10 sm:my-14" />
        </Reveal>
        <Reveal>
          <NewsletterSignup />
        </Reveal>
      </SiteContainer>
    </main>
  )
}
