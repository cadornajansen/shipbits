import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { PageView } from "@/components/analytics/page-view"
import { SiteContainer } from "@/components/layout/site-container"
import { ProductOutboundLink } from "@/components/products/product-outbound-link"
import { PublicProductList } from "@/components/products/public-product-list"
import { JsonLd } from "@/components/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getPublicProductBySlug, getRelatedProducts } from "@/features/products/public-queries"
import { createPageMetadata } from "@/lib/seo/metadata"
import { absoluteUrl } from "@/lib/site"

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 60
export function generateStaticParams() { return [] }

export async function generateMetadata({ params }: Props) {
  const product = await getPublicProductBySlug((await params).slug)
  if (!product) notFound()
  return createPageMetadata({
    title: product.name,
    description: product.shortDescription,
    path: `/products/${product.slug}`,
    image: product.coverUrl || `/products/${product.slug}/og`,
  })
}

export default async function ProductPage({ params }: Props) {
  const product = await getPublicProductBySlug((await params).slug)
  if (!product) notFound()
  const related = await getRelatedProducts(product)
  const image = product.coverUrl || product.logoUrl || absoluteUrl(`/products/${product.slug}/og`)

  return (
    <main>
      <PageView event="product_view" properties={{ productId: product.id }} />
      <JsonLd data={{
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
      }} />
      <SiteContainer className="flex flex-col gap-9 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/products" className="hover:underline">Products</Link><span aria-hidden="true">/</span>
          <Link href={`/categories/${product.categorySlug}`} className="hover:underline">{product.categoryName}</Link><span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">{product.name}</span>
        </nav>
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="flex min-w-0 gap-4">
            {product.logoUrl ? <Image src={product.logoUrl} alt={`${product.name} logo`} width={64} height={64} unoptimized className="size-14 shrink-0 object-contain sm:size-16" /> : null}
            <div className="min-w-0 max-w-2xl">
              <Badge variant="secondary" asChild><Link href={`/categories/${product.categorySlug}`}>{product.categoryName}</Link></Badge>
              <h1 className="mt-2 break-words font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{product.shortDescription}</p>
            </div>
          </div>
          <Button asChild className="w-fit shrink-0">
            <ProductOutboundLink href={product.websiteUrl} productId={product.id}>Visit product<ArrowUpRight data-icon="inline-end" /></ProductOutboundLink>
          </Button>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-7">
            {product.coverUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
                <Image src={product.coverUrl} alt={`${product.name} preview`} fill unoptimized sizes="(max-width: 1024px) 100vw, 720px" className="object-contain" />
              </div>
            ) : null}
            <section aria-labelledby="about-product">
              <h2 id="about-product" className="font-outfit text-xl font-semibold">About {product.name}</h2>
              <div className="mt-4 flex flex-col gap-4 text-sm leading-7 text-muted-foreground">
                {(product.longDescription || product.shortDescription).split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index} className="whitespace-pre-line break-words">{paragraph}</p>)}
              </div>
            </section>
          </div>
          <aside className="flex flex-col gap-5 rounded-xl border p-5 text-sm">
            <h2 className="font-semibold">Listing details</h2>
            <dl className="flex flex-col gap-4">
              <div><dt className="text-muted-foreground">Website</dt><dd className="mt-1 break-all"><ProductOutboundLink productId={product.id} href={product.websiteUrl} className="underline underline-offset-4">{product.domain}</ProductOutboundLink></dd></div>
              {product.publishedAt ? <div><dt className="text-muted-foreground">Published</dt><dd className="mt-1"><time dateTime={product.publishedAt}>{new Date(product.publishedAt).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}</time></dd></div> : null}
              <div><dt className="text-muted-foreground">Listing + support on ShipBits</dt><dd className="mt-1 font-semibold">₱{product.upvoteValuePesos.toLocaleString("en-PH")}</dd></div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">This is listing and community support value, not the product’s price. Admin-added listings start with a ₱1 credit.</p>
            <Separator />
            <Link href={`/resources/badges?product=${encodeURIComponent(product.slug)}`} className="text-sm underline underline-offset-4">Get the Listed on ShipBits badge</Link>
          </aside>
        </div>
        {related.length ? <section className="flex flex-col gap-4"><h2 className="font-outfit text-2xl font-semibold">More in {product.categoryName}</h2><PublicProductList products={related} /></section> : null}
      </SiteContainer>
    </main>
  )
}
