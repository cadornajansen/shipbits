import { CircleCheckIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { ProductBoardData } from "@/features/imports/types"
import type { Category } from "@/features/products/types"

import { PublishedProductCard } from "./published-product-card"

export function PublishedColumn({
  categories,
  products,
}: {
  categories: Category[]
  products: ProductBoardData["publishedProducts"]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Published</h2>
        <p className="text-sm text-muted-foreground">
          Live directory products.
        </p>
      </div>
      {!products.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleCheckIcon />
            </EmptyMedia>
            <EmptyTitle>No published products</EmptyTitle>
            <EmptyDescription>
              Publish a ready draft to make it live.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <PublishedProductCard
              categories={categories}
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  )
}
