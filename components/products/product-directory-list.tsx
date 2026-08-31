import { ArrowUpRightIcon } from "lucide-react"
import Link from "next/link"

import { ProductUpvoteButton } from "@/components/landing/product-upvote-button"
import { ProductOutboundLink } from "@/components/products/product-outbound-link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PublicDirectoryProduct } from "@/features/products/public-queries"
import { cn } from "@/lib/utils"

export function productInitials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** Ranked directory rows shared by the landing page and the public products directory. */
export function ProductDirectoryList({
  products,
  startRank = 1,
  className,
}: {
  products: PublicDirectoryProduct[]
  startRank?: number
  className?: string
}) {
  if (!products.length) return null

  return (
    <ol
      className={cn(
        "divide-y divide-slate-200 border-y border-slate-200",
        className
      )}
      start={startRank}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          className="group relative grid cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)] gap-2 py-4 transition-colors hover:bg-muted/30 focus-within:bg-muted/30 md:grid-cols-[2rem_minmax(0,1fr)_auto] md:items-center"
        >
          <Link
            href={`/products/${product.slug}`}
            className="absolute inset-0 z-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`About ${product.name}`}
          />
          <span className="pt-2 font-outfit text-lg font-semibold text-teal-700 sm:pt-0 sm:text-xl">
            {String(index + startRank).padStart(2, "0")}
          </span>
          <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-3">
            <Avatar className="group/avatar mt-0.5 size-10 rounded-md border bg-white p-1 after:hidden">
              {product.logoUrl ? (
                <AvatarImage
                  className="size-full rounded-none object-cover"
                  src={product.logoUrl}
                  alt=""
                />
              ) : null}
              <AvatarFallback className="rounded-none text-xs">
                {productInitials(product.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="truncate font-outfit text-base font-semibold sm:text-lg">
                  <Link
                    href={`/products/${product.slug}`}
                    className="pointer-events-auto hover:underline"
                  >
                    {product.name}
                  </Link>
                </h3>
                <Link
                  href={`/products/${product.slug}`}
                  title={`₱${product.upvoteValuePesos.toLocaleString("en-PH")} listing + community support`}
                  className="pointer-events-auto text-sm text-teal-700"
                >
                  • ₱{product.upvoteValuePesos.toLocaleString("en-PH")}
                  <span className="sr-only"> listing + community support</span>
                </Link>
                <Link
                  href={`/categories/${product.categorySlug}`}
                  className="pointer-events-auto rounded-full bg-teal-700/8 px-2 py-0.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-700/15"
                >
                  {product.categoryName}
                </Link>
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {product.tagline}
              </p>
            </div>
          </div>
          <div className="pointer-events-none relative z-10 col-start-2 mt-2 flex flex-wrap items-center gap-3 md:col-start-3 md:row-start-1 md:mt-0 md:justify-self-end">
            <div className="pointer-events-auto">
              <ProductUpvoteButton
                productId={product.id}
                productName={product.name}
                upvoteCount={product.upvoteCount}
              />
            </div>
            <ProductOutboundLink
              productId={product.id}
              href={product.websiteUrl}
              className="pointer-events-auto inline-flex w-fit items-center gap-1 text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
            >
              Visit
              <ArrowUpRightIcon className="size-4" />
              <span className="sr-only">{product.name}</span>
            </ProductOutboundLink>
          </div>
        </li>
      ))}
    </ol>
  )
}
