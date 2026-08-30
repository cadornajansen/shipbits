import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ProductOutboundLink } from "@/components/products/product-outbound-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { PublicDirectoryProduct } from "@/features/products/public-queries"

export function PublicProductList({ products }: { products: PublicDirectoryProduct[] }) {
  if (!products.length) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No published products yet</EmptyTitle>
          <EmptyDescription>Have something to share? Your product could be next.</EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline"><Link href="/#submit-product">List your product</Link></Button>
      </Empty>
    )
  }

  return (
    <ul className="divide-y rounded-xl border px-4 sm:px-5">
      {products.map((product) => (
        <li key={product.id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap sm:gap-4">
          <Link href={`/products/${product.slug}`} className="flex size-11 shrink-0 items-center justify-center" aria-label={`About ${product.name}`}>
            {product.logoUrl ? (
              <Image src={product.logoUrl} alt="" width={44} height={44} unoptimized className="size-11 object-contain" />
            ) : <span className="font-outfit text-xl font-semibold">{product.name.slice(0, 1)}</span>}
          </Link>
          <div className="min-w-0 flex-1 basis-[70%] sm:basis-auto">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/products/${product.slug}`} className="font-outfit font-semibold hover:underline">{product.name}</Link>
              <Badge variant="secondary" asChild><Link href={`/categories/${product.categorySlug}`}>{product.categoryName}</Link></Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.tagline}</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <ProductOutboundLink productId={product.id} href={product.websiteUrl}>
              Visit<span className="sr-only"> {product.name}</span><ArrowUpRight data-icon="inline-end" />
            </ProductOutboundLink>
          </Button>
        </li>
      ))}
    </ul>
  )
}

export function DirectoryPagination({ page, pageCount, path }: { page: number; pageCount: number; path: string }) {
  if (pageCount < 2) return null
  return (
    <nav aria-label="Product pages" className="flex items-center justify-between gap-4">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={page > 2 ? `${path}?page=${page - 1}` : path} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={page <= 1 ? "pointer-events-none opacity-50" : undefined}>Previous</Link>
      </Button>
      <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
      <Button asChild variant="outline" size="sm" disabled={page >= pageCount}>
        <Link href={`${path}?page=${page + 1}`} aria-disabled={page >= pageCount} tabIndex={page >= pageCount ? -1 : undefined} className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}>Next</Link>
      </Button>
    </nav>
  )
}
