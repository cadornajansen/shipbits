import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { FeaturedProductPreview } from "@/components/landing/featured-product-preview"
import { ProductUpvoteButton } from "@/components/landing/product-upvote-button"
import { ProductOutboundLink } from "@/components/products/product-outbound-link"
import type { PublicDirectoryProduct } from "@/features/products/public-queries"

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export default function FeaturedSection({
  products,
}: {
  products: PublicDirectoryProduct[]
}) {
  const lcpProductId = products.find(
    (product) => product.coverUrl ?? product.logoUrl
  )?.id

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 rounded-full px-4 py-2 font-outfit font-medium">
        <Image
          src="/icons/crown.png"
          alt=""
          width={64}
          height={64}
          className="size-16 -rotate-10 object-contain"
        />
        <span className="rounded-full bg-white px-4 py-2 text-base font-bold">
          Top #3 Featured
        </span>
      </div>
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
        {products.map((product) => {
          const previewUrl = product.coverUrl ?? product.logoUrl

          return (
            <div
              key={product.id}
              className="relative flex min-w-0 flex-col items-center"
            >
              <Link
                href={`/products/${product.slug}`}
                aria-label={`About ${product.name}`}
                className="absolute inset-0 z-10 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <div className="group relative aspect-video w-full overflow-hidden rounded-xl border">
                {previewUrl ? (
                  <FeaturedProductPreview
                    src={previewUrl}
                    alt={`${product.name} preview`}
                    preload={product.id === lcpProductId}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted font-outfit text-2xl font-semibold text-muted-foreground">
                    {product.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pointer-events-none relative z-20 mt-2 flex w-full items-center justify-center gap-2">
                <span
                  className="min-w-0 truncate font-outfit font-semibold"
                  title={product.name}
                >
                  {product.name}
                </span>
                <Link
                  href={`/products/${product.slug}`}
                  title={`₱${product.upvoteValuePesos.toLocaleString("en-PH")} listing + community support`}
                  className="pointer-events-auto shrink-0 font-outfit font-medium text-green-600"
                >
                  • ₱{product.upvoteValuePesos.toLocaleString("en-PH")}
                  <span className="sr-only"> listing + community support</span>
                </Link>
                <div className="pointer-events-auto shrink-0">
                  <ProductUpvoteButton
                    productId={product.id}
                    productName={product.name}
                    upvoteCount={product.upvoteCount}
                    size="xs"
                  />
                </div>
              </div>
              <p
                title={product.tagline}
                className="mt-0.5 w-full truncate text-center text-xs font-medium text-muted-foreground"
              >
                {product.tagline}
              </p>
              <div className="pointer-events-none relative z-20 mt-3 flex w-full flex-wrap items-center justify-center gap-2">
                <ProductOutboundLink
                  productId={product.id}
                  className="pointer-events-auto flex max-w-full min-w-0 items-center gap-1 rounded-full border bg-white px-3 py-1 font-outfit text-xs text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  href={product.websiteUrl}
                >
                  {product.logoUrl ? (
                    <Image
                      src={product.logoUrl}
                      alt=""
                      width={20}
                      height={20}
                      unoptimized
                      className="size-5 object-contain"
                    />
                  ) : null}
                  <span className="truncate">
                    {domainFromUrl(product.websiteUrl)}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0" />
                </ProductOutboundLink>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
