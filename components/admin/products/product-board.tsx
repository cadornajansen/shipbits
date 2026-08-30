"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import type { ProductBoardData } from "@/features/imports/types"
import type { Category } from "@/features/products/types"

import { DraftColumn } from "./draft-column"
import { PublishedColumn } from "./published-column"

export function ProductBoard({
  categories,
  data,
}: {
  categories: Category[]
  data: ProductBoardData
}) {
  const router = useRouter()
  const hasActiveImports =
    data.importQueue.some((item) => item.status !== "failed") ||
    data.draftProducts.some(
      (product) =>
        product.importStatus === "queued" ||
        product.importStatus === "extracting" ||
        product.importStatus === "generating"
    )

  useEffect(() => {
    if (!hasActiveImports) return

    const interval = window.setInterval(() => router.refresh(), 4_000)
    return () => window.clearInterval(interval)
  }, [hasActiveImports, router])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <DraftColumn categories={categories} data={data} />
      <PublishedColumn
        categories={categories}
        products={data.publishedProducts}
      />
    </div>
  )
}
