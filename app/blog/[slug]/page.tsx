import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { PageView } from "@/components/analytics/page-view"
import { ArticleBody } from "@/components/blog/article-body"
import { ArticleList } from "@/components/blog/article-list"
import { SiteContainer } from "@/components/layout/site-container"
import { JsonLd } from "@/components/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatArticleDate } from "@/features/blog/content"
import { getArticleBySlug, getPublishedArticles, getRelatedArticles } from "@/features/blog/queries"
import { createPageMetadata } from "@/lib/seo/metadata"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

type BlogPageProps = { params: Promise<{ slug: string }> }

export const revalidate = 3600

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getPublishedArticles()).map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const article = await getArticleBySlug((await params).slug)
  if (!article) notFound()
  return createPageMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
    image: article.cover,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt ?? article.publishedAt,
  })
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const article = await getArticleBySlug((await params).slug)
  if (!article) notFound()
  const relatedArticles = await getRelatedArticles(article)
  const url = absoluteUrl(`/blog/${article.slug}`)

  return (
    <main className="py-8 sm:py-12">
      <PageView event="blog_view" properties={{ slug: article.slug }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt ?? article.publishedAt,
        author: { "@type": article.author === "ShipBits editorial team" ? "Organization" : "Person", name: article.author },
        publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        mainEntityOfPage: url,
        url,
        inLanguage: "en",
        articleSection: article.category,
        wordCount: article.wordCount,
        ...(article.cover ? { image: absoluteUrl(article.cover) } : {}),
      }} />
      <SiteContainer>
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="mb-7 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" aria-hidden="true" /> All articles
          </Link>
          <article>
            <header className="flex flex-col items-start gap-4">
              <Badge variant="secondary">{article.category}</Badge>
              <h1 className="font-outfit text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">{article.title}</h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{article.description}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <span>{article.author}</span>
                <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
                <span>{article.readingMinutes} min read</span>
                {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                  <span>Updated <time dateTime={article.updatedAt}>{formatArticleDate(article.updatedAt)}</time></span>
                ) : null}
              </div>
            </header>
            {article.cover ? (
              <div className="relative mt-8 aspect-video overflow-hidden rounded-xl border">
                <Image src={article.cover} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" unoptimized={article.cover.startsWith("https://")} />
              </div>
            ) : null}
            <Separator className="my-8" />
            {article.headings.length >= 3 ? (
              <nav aria-label="On this page" className="mb-8 rounded-lg border p-5">
                <p className="mb-3 text-sm font-semibold">On this page</p>
                <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {article.headings.filter((heading) => heading.depth === 2).map((heading) => (
                    <li key={heading.id}><a href={`#${heading.id}`} className="underline-offset-4 hover:text-foreground hover:underline">{heading.text}</a></li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <ArticleBody content={article.content} headings={article.headings} />
            <aside className="mt-10 flex flex-col items-start gap-3 rounded-xl border p-5 sm:p-6">
              <h2 className="font-outfit text-xl font-semibold">Ready to share what you&apos;re building?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">Give your product a home in the directory. Listings remain subject to our site policies.</p>
              <Button asChild><Link href="/#submit-product">List your product from ₱1 <ArrowRightIcon data-icon="inline-end" /></Link></Button>
            </aside>
          </article>
        </div>
        {relatedArticles.length ? (
          <section aria-labelledby="related-articles" className="mt-12 sm:mt-16">
            <Separator className="mb-8" />
            <h2 id="related-articles" className="mb-6 font-outfit text-2xl font-semibold tracking-tight">Keep building</h2>
            <ArticleList articles={relatedArticles} />
          </section>
        ) : null}
      </SiteContainer>
    </main>
  )
}
