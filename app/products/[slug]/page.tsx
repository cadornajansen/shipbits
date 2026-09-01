import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Globe2,
  Sparkles,
  UserRound,
} from "lucide-react"

import { PageView } from "@/components/analytics/page-view"
import { ProductDirectoryOwnerLink } from "@/components/directory-submissions/product-owner-link"
import { ProductUpvoteButton } from "@/components/landing/product-upvote-button"
import { SiteContainer } from "@/components/layout/site-container"
import { ProductOutboundLink } from "@/components/products/product-outbound-link"
import { PublicProductList } from "@/components/products/public-product-list"
import { ProductUpvoteActivity } from "@/components/products/product-upvote-activity"
import { JsonLd } from "@/components/seo/json-ld"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getPublicProductBySlug,
  getRecentPublicProductUpvotes,
  getRelatedProducts,
} from "@/features/products/public-queries"
import { createPageMetadata } from "@/lib/seo/metadata"
import { breadcrumbJsonLd } from "@/lib/seo/structured-data"
import { absoluteUrl } from "@/lib/site"
import { Reveal } from "@/components/motion/reveal"

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 60
export function generateStaticParams() {
  return []
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value))
}

export async function generateMetadata({ params }: Props) {
  const product = await getPublicProductBySlug((await params).slug)
  if (!product) notFound()
  return createPageMetadata({
    title: `${product.name} - ${product.categoryName}`,
    description:
      product.shortDescription ||
      `${product.name} is listed in ${product.categoryName} on ShipBits.`,
    path: `/products/${product.slug}`,
    image: product.coverUrl || `/products/${product.slug}/og`,
  })
}

export default async function ProductPage({ params }: Props) {
  const product = await getPublicProductBySlug((await params).slug)
  if (!product) notFound()
  const [related, recentUpvotes] = await Promise.all([
    getRelatedProducts(product),
    getRecentPublicProductUpvotes(product.id),
  ])
  const image =
    product.coverUrl ||
    product.logoUrl ||
    absoluteUrl(`/products/${product.slug}/og`)

  return (
    <main>
      <PageView event="product_view" properties={{ productId: product.id }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": absoluteUrl(`/products/${product.slug}#product`),
          url: absoluteUrl(`/products/${product.slug}`),
          name: product.name,
          description: product.shortDescription,
          category: product.categoryName,
          image,
          sameAs: product.websiteUrl,
          // Listing/support payments are not the software's retail price or ratings.
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          {
            name: product.categoryName,
            path: `/categories/${product.categorySlug}`,
          },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
      <SiteContainer className="flex flex-col gap-9 py-8 sm:py-12">
        <Reveal variant="fade">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/products" className="hover:underline">
              Products
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/categories/${product.categorySlug}`}
              className="hover:underline"
            >
              {product.categoryName}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground" aria-current="page">
              {product.name}
            </span>
          </nav>
        </Reveal>
        <Reveal>
          <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex min-w-0 gap-4">
              {product.logoUrl ? (
                <Image
                  src={product.logoUrl}
                  alt={`${product.name} logo`}
                  width={64}
                  height={64}
                  unoptimized
                  className="size-14 shrink-0 object-contain sm:size-16"
                />
              ) : null}
              <div className="max-w-2xl min-w-0">
                <Badge variant="secondary" asChild>
                  <Link href={`/categories/${product.categorySlug}`}>
                    {product.categoryName}
                  </Link>
                </Badge>
                <h1 className="mt-2 font-outfit text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                  {product.name}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {product.shortDescription}
                </p>
              </div>
            </div>
            <Button asChild className="w-fit shrink-0">
              <ProductOutboundLink
                href={product.websiteUrl}
                productId={product.id}
              >
                Visit product
                <ArrowUpRight data-icon="inline-end" />
              </ProductOutboundLink>
            </Button>
          </header>
        </Reveal>
        <Reveal>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
            <div className="flex min-w-0 flex-col gap-7">
              {product.coverUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
                  <Image
                    src={product.coverUrl}
                    alt={`${product.name} preview`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <section aria-labelledby="about-product">
                <h2
                  id="about-product"
                  className="font-outfit text-xl font-semibold"
                >
                  About {product.name}
                </h2>
                <div className="mt-4 flex flex-col gap-4 text-sm leading-7 text-muted-foreground">
                  {(product.longDescription || product.shortDescription)
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="break-words whitespace-pre-line"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </section>
              {product.tags.length ? (
                <section aria-labelledby="product-tags">
                  <h2
                    id="product-tags"
                    className="font-outfit text-xl font-semibold"
                  >
                    Tags
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <li key={tag}>
                        <Badge variant="outline">{tag}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
            <div className="flex flex-col gap-6">
              <aside className="flex flex-col rounded-xl border bg-card p-4 text-sm shadow-sm sm:p-5">
                <h2 className="font-semibold tracking-tight">
                  Listing details
                </h2>
                <dl className="mt-4 flex flex-col gap-4">
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Globe2 className="size-3.5" /> Website
                    </dt>
                    <dd className="mt-1.5 min-w-0">
                      <ProductOutboundLink
                        productId={product.id}
                        href={product.websiteUrl}
                        className="group inline-flex max-w-full items-center gap-1 font-medium underline-offset-4 hover:underline"
                      >
                        <span className="truncate">{product.domain}</span>
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </ProductOutboundLink>
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <UserRound className="size-3.5" /> Published by
                    </dt>
                    <dd className="mt-1.5 min-w-0">
                      {product.listingSource === "admin" ? (
                        <span className="inline-flex items-center gap-2 font-medium">
                          <Sparkles className="size-3.5 text-muted-foreground" />{" "}
                          Curated by ShipBits
                        </span>
                      ) : product.publisher ? (
                        <span className="flex min-w-0 items-center gap-2 font-medium">
                          <Avatar size="sm">
                            {product.publisher.avatarUrl ? (
                              <AvatarImage
                                src={product.publisher.avatarUrl}
                                alt=""
                              />
                            ) : null}
                            <AvatarFallback>
                              {initials(product.publisher.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className="truncate"
                            title={product.publisher.name}
                          >
                            {product.publisher.name}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium">Founder</span>
                      )}
                    </dd>
                  </div>
                  {product.publishedAt ? (
                    <div>
                      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="size-3.5" /> Published
                      </dt>
                      <dd className="mt-1.5 font-medium">
                        <time dateTime={product.publishedAt}>
                          {formatPublishedDate(product.publishedAt)}
                        </time>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-5 border-t pt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Community support
                    </p>
                    <p className="font-semibold tabular-nums">
                      ₱{product.upvoteValuePesos.toLocaleString("en-PH")}
                    </p>
                  </div>
                  <div className="mt-3">
                    <ProductUpvoteButton
                      productId={product.id}
                      productName={product.name}
                      upvoteCount={product.upvoteCount}
                      buttonLabel="Upvote this for ₱1"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Each ₱1 supports this listing and adds one ShipBits upvote
                    after payment is confirmed.
                  </p>
                </div>
                <ProductDirectoryOwnerLink productId={product.id} />
              </aside>
              <ProductUpvoteActivity
                productName={product.name}
                totalUpvotes={product.upvoteCount}
                upvotes={recentUpvotes}
              />
            </div>
          </div>
        </Reveal>
        {related.length ? (
          <Reveal>
            <section className="flex flex-col gap-4">
              <h2 className="font-outfit text-2xl font-semibold">
                More in {product.categoryName}
              </h2>
              <PublicProductList products={related} />
            </section>
          </Reveal>
        ) : null}
      </SiteContainer>
    </main>
  )
}
