import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { SearchXIcon } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { ProductDirectoryList } from "@/components/products/product-directory-list"
import { ProductDirectorySearch } from "@/components/products/product-directory-search"
import { DirectoryPagination } from "@/components/products/public-product-list"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  DIRECTORY_MAX_PAGE_SIZE,
  getPublicDirectoryProducts,
  getPublicProductCount,
} from "@/features/products/public-queries"
import { directoryPageHref, parseDirectoryPage } from "@/features/products/pagination"
import { parseDirectorySearch } from "@/features/products/search"
import { createPageMetadata } from "@/lib/seo/metadata"

type Props = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>
}

export const revalidate = 60

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams
  const page = parseDirectoryPage(query.page)
  const search = parseDirectorySearch(query.q)
  if (!page) {
    return createPageMetadata({
      title: "Products",
      description: "Browse published products from Filipino builders.",
      path: "/products",
      noIndex: true,
    })
  }
  if (search) {
    return createPageMetadata({
      title: `Search: ${search}`,
      description: `Published products matching “${search}” from Filipino builders.`,
      path: directoryPageHref("/products", page, { q: search }),
      noIndex: true,
    })
  }
  return createPageMetadata({
    title: page === 1 ? "Products" : `Products, page ${page}`,
    description: page === 1
      ? "Browse published apps, SaaS, developer tools, and software products from Filipino builders."
      : `Browse published apps, tools, and software products from Filipino builders on page ${page} of the ShipBits directory.`,
    path: directoryPageHref("/products", page),
  })
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = await searchParams
  const page = parseDirectoryPage(query.page)
  if (!page) notFound()
  const search = parseDirectorySearch(query.q)
  // Keep one canonical URL per result set: no `page=1`, no blank or unnormalized `q`.
  const pageIsCanonical = query.page === undefined ? page === 1 : page > 1
  const searchIsCanonical = query.q === undefined ? true : search !== "" && query.q === search
  if (!pageIsCanonical || !searchIsCanonical) {
    redirect(directoryPageHref("/products", page, search ? { q: search } : undefined))
  }

  const [products, count] = await Promise.all([
    getPublicDirectoryProducts({ page, pageSize: DIRECTORY_MAX_PAGE_SIZE, search }),
    getPublicProductCount(undefined, search),
  ])
  const pageCount = Math.max(1, Math.ceil(count / DIRECTORY_MAX_PAGE_SIZE))
  if (page > pageCount) notFound()

  return (
    <main className="py-10 sm:py-14">
      <SiteContainer className="flex flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="font-outfit text-xs font-semibold tracking-[0.2em] text-teal-700 uppercase">
                Public directory
              </p>
              <h1 className="mt-2 font-outfit text-3xl font-bold tracking-tight sm:text-4xl">
                Products worth discovering
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Explore published apps, tools, and software from Filipino builders.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {count} {search ? "matching" : "published"} {count === 1 ? "product" : "products"}
            </p>
          </div>
          <ProductDirectorySearch action="/products" search={search} />
        </header>

        {products.length ? (
          <ProductDirectoryList
            products={products}
            startRank={(page - 1) * DIRECTORY_MAX_PAGE_SIZE + 1}
          />
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>
                {search ? `No products match “${search}”` : "No published products yet"}
              </EmptyTitle>
              <EmptyDescription>
                {search
                  ? "Try a shorter term, a different spelling, or browse the full directory."
                  : "Have something to share? Your product could be next."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href={search ? "/products" : "/#submit-product"}>
                  {search ? "Clear search" : "List your product"}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        <DirectoryPagination
          page={page}
          pageCount={pageCount}
          path="/products"
          params={search ? { q: search } : undefined}
        />
      </SiteContainer>
    </main>
  )
}
