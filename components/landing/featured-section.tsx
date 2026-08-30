import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { FeaturedProductPreview } from "@/components/landing/featured-product-preview"
import { ProductUpvoteButton } from "@/components/landing/product-upvote-button"
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
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 rounded-full px-4 py-2 font-outfit font-medium">
          <Image
            src="/icons/crown.png"
            alt="Placeholder"
            width={200}
            height={200}
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
              <div key={product.id} className="flex min-w-0 flex-col items-center">
                <div className="group relative aspect-video w-full overflow-hidden rounded-xl border">
                  {previewUrl ? (
                    <FeaturedProductPreview
                      src={previewUrl}
                      alt={`${product.name} preview`}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted font-outfit text-2xl font-semibold text-muted-foreground">
                      {product.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="pointer-events-auto">
                      <ProductUpvoteButton
                        productId={product.id}
                        productName={product.name}
                        upvoteCount={product.upvoteCount}
                      />
                    </div>
                  </div>
                </div>
                <span className="mt-2 font-outfit font-semibold">
                  {product.name} •{" "}
                  <span className="text-green-600 font-medium">
                    ₱{product.upvoteValuePesos.toLocaleString("en-PH")}
                  </span>
                </span>
                <p
                  title={product.tagline}
                  className="mt-0.5 w-full truncate text-center text-xs font-medium text-muted-foreground"
                >
                  {product.tagline}
                </p>
                <Link
                  className="mt-2 flex items-center gap-1 rounded-full border bg-white px-3 py-1 font-outfit text-xs shadow-xs hover:bg-gray-100"
                  href={product.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
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
                  <span>{domainFromUrl(product.websiteUrl)}</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    )
}
