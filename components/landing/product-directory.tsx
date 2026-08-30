import { ExternalLinkIcon } from "lucide-react"

import { ProductDirectoryList } from "@/components/products/product-directory-list"
import type { PublicDirectoryProduct } from "@/features/products/public-queries"

export function ProductDirectory({
  products,
  startRank = 1,
}: {
  products: PublicDirectoryProduct[]
  startRank?: number
}) {
  return (
    <section className="mt-10 w-full border-t border-slate-200 pt-10 sm:mt-10 sm:pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-outfit text-xs font-semibold tracking-[0.2em] text-teal-700 uppercase">
            More to discover
          </p>
          <h2 className="mt-2 font-outfit text-3xl font-bold tracking-tight sm:text-4xl">
            More products from Filipino builders
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Newly published tools made by Filipino builders.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {products.length} published {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {products.length ? (
        <ProductDirectoryList products={products} startRank={startRank} className="mt-6" />
      ) : (
        <div className="mt-6 flex min-h-36 flex-col items-center justify-center border-y border-dashed border-slate-300 px-6 text-center">
          <ExternalLinkIcon className="size-5 text-muted-foreground" />
          <p className="mt-3 font-medium">No published products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Published listings will appear here automatically.
          </p>
        </div>
      )}
    </section>
  )
}
