import { ClipboardListIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { ProductBoardData } from "@/features/imports/types"
import type { Category } from "@/features/products/types"

import { DraftProductCard, ImportQueueCard } from "./draft-product-card"

export function DraftColumn({
  categories,
  data,
}: {
  categories: Category[]
  data: Pick<ProductBoardData, "draftProducts" | "importQueue">
}) {
  const isEmpty = !data.draftProducts.length && !data.importQueue.length

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Drafts</h2>
        <p className="text-sm text-muted-foreground">
          Importing, generated, and review work.
        </p>
      </div>
      {isEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>No drafts yet</EmptyTitle>
            <EmptyDescription>
              Import a URL or add a product manually to begin.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {data.importQueue.map((item) => (
            <ImportQueueCard key={item.id} item={item} />
          ))}
          {data.draftProducts.map((product) => (
            <DraftProductCard
              key={product.id}
              categories={categories}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  )
}
