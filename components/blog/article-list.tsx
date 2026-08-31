import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatArticleDate, type BlogArticle } from "@/features/blog/content"
import { RevealGroup, RevealItem } from "@/components/motion/reveal-group"

export function ArticleList({ articles }: { articles: BlogArticle[] }) {
  if (!articles.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>More from the builders, soon.</EmptyTitle>
          <EmptyDescription>
            New launch guides will appear here when they are published.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <RevealGroup as="ul" className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {articles.map((article) => (
        <RevealItem as="li" key={article.slug} className="min-w-0">
          <article className="flex h-full flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{article.category}</Badge>
              <time dateTime={article.publishedAt}>
                {formatArticleDate(article.publishedAt)}
              </time>
              <span aria-hidden="true">·</span>
              <span>{article.readingMinutes} min read</span>
            </div>
            <h2 className="font-outfit text-xl leading-snug font-semibold tracking-tight sm:text-2xl">
              <Link
                href={`/blog/${article.slug}`}
                className="decoration-border underline-offset-4 hover:underline"
              >
                {article.title}
              </Link>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {article.description}
            </p>
            <Link
              href={`/blog/${article.slug}`}
              className="mt-auto inline-flex items-center gap-1 py-1 text-sm font-medium underline-offset-4 hover:underline"
              aria-label={`Read ${article.title}`}
            >
              Read guide{" "}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
