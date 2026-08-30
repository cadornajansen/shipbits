import { ArrowUpRightIcon, ExternalLinkIcon } from "lucide-react"

import { ProductUpvoteButton } from "@/components/landing/product-upvote-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PublicDirectoryProduct } from "@/features/products/public-queries"

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

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
        <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {products.map((product, index) => (
            <li
              key={product.id}
              className="grid grid-cols-[1.75rem_2rem_minmax(0,1fr)] gap-2 py-4 sm:grid-cols-[2rem_2rem_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="pt-2 font-outfit text-lg font-semibold text-teal-700 sm:pt-0 sm:text-xl">
                {String(index + startRank).padStart(2, "0")}
              </span>
              <ProductUpvoteButton
                productId={product.id}
                productName={product.name}
                upvoteCount={product.upvoteCount}
              />
              <div className="flex items-center min-w-0 gap-3">
                <Avatar className="group/avatar mt-0.5 size-10 rounded-md border  bg-white p-1 after:hidden">
                  {product.logoUrl ? (
                    <AvatarImage className="size-full rounded-none object-cover" src={product.logoUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="rounded-none text-xs">
                    {initials(product.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate font-outfit text-base font-semibold sm:text-lg">
                      {product.name}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      • ₱{product.upvoteValuePesos.toLocaleString("en-PH")}
                    </span>
                    <span className="rounded-full bg-teal-700/8 px-2 py-0.5 text-xs font-medium text-teal-800">
                      {product.categoryName}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {product.tagline}
                  </p>
                </div>
              </div>
              <a
                className="col-start-3 mt-1 inline-flex w-fit items-center gap-1 text-sm font-medium text-teal-700 transition-colors hover:text-teal-900 sm:col-start-4 sm:row-start-1 sm:mt-0 sm:justify-self-end"
                href={product.websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Visit
                <ArrowUpRightIcon className="size-4" />
                <span className="sr-only">{product.name}</span>
              </a>
            </li>
          ))}
        </ol>
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
