import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { SiteContainer } from "@/components/layout/site-container"
import { ProductDirectoryList } from "@/components/products/product-directory-list"
import { DirectoryPagination } from "@/components/products/public-product-list"
import {
  DIRECTORY_PAGE_SIZE,
  getPublicCategoryBySlug,
  getPublicDirectoryProducts,
  getPublicProductCount,
} from "@/features/products/public-queries"
import { parseDirectoryPage } from "@/features/products/pagination"
import { createPageMetadata } from "@/lib/seo/metadata"
import { getCategoryDescription } from "@/lib/seo/categories"
import { breadcrumbJsonLd } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export const revalidate = 60
export function generateStaticParams() { return [] }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [category, query] = await Promise.all([
    getPublicCategoryBySlug((await params).slug),
    searchParams,
  ])
  if (!category || category.productCount === 0) notFound()
  const page = parseDirectoryPage(query.page)
  const description = getCategoryDescription(category)
  return createPageMetadata({
    title: page && page > 1 ? `${category.name} products, page ${page}` : `${category.name} products`,
    description: page && page > 1 ? `${description} Browse page ${page} of published listings on ShipBits.` : `${description} Discover published listings from Filipino builders on ShipBits.`,
    path: page && page > 1 ? `/categories/${category.slug}?page=${page}` : `/categories/${category.slug}`,
    noIndex: !page,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [category, query] = await Promise.all([
    getPublicCategoryBySlug((await params).slug),
    searchParams,
  ])
  if (!category || category.productCount === 0) notFound()
  const page = parseDirectoryPage(query.page)
  if (!page) notFound()
  if (page === 1 && query.page !== undefined) redirect(`/categories/${category.slug}`)

  const [products, count] = await Promise.all([
    getPublicDirectoryProducts({ categoryId: category.id, page }),
    getPublicProductCount(category.id),
  ])
  const pageCount = Math.max(1, Math.ceil(count / DIRECTORY_PAGE_SIZE))
  if (page > pageCount) notFound()

  return (
    <main className="py-10 sm:py-14">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        { name: category.name, path: `/categories/${category.slug}` },
      ])} />
      <SiteContainer className="flex flex-col gap-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link> <span aria-hidden="true">/</span> <Link href="/products" className="hover:underline">Products</Link> <span aria-hidden="true">/</span> <span aria-current="page">{category.name}</span>
        </nav>
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">Product category</p>
          <h1 className="mt-2 font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">{getCategoryDescription(category)} Browse {count} published {count === 1 ? "listing" : "listings"} from Filipino builders.</p>
        </header>
        <ProductDirectoryList
          products={products}
          startRank={(page - 1) * DIRECTORY_PAGE_SIZE + 1}
        />
        <DirectoryPagination page={page} pageCount={pageCount} path={`/categories/${category.slug}`} />
      </SiteContainer>
    </main>
  )
}
