import type { ProductListItem } from "@/features/products/types"

import type { importStatuses } from "./validation"

export type ImportStatus = (typeof importStatuses)[number]

export type ImportQueueItem = {
  createdAt: string
  domain: string
  errorMessage: string | null
  id: string
  productId: string | null
  sourceUrl: string
  status: ImportStatus
}

export type DraftBoardProduct = ProductListItem & {
  categoryId: string
  importId: string | null
  importStatus: ImportStatus | null
  longDescription: string | null
  shortDescription: string
  sourceUrl: string | null
  slug: string
  tagline: string
  tags: string[]
  websiteUrl: string
  warning: string | null
}

export type ProductBoardData = {
  draftProducts: DraftBoardProduct[]
  importQueue: ImportQueueItem[]
  publishedProducts: Array<
    ProductListItem & {
      categoryId: string
      coverUrl: string | null
      importId: string | null
      longDescription: string | null
      publishedAt: string | null
      shortDescription: string
      slug: string
      tagline: string
      tags: string[]
      websiteUrl: string
    }
  >
}

export type ImportActionResult =
  | { error: string; fieldErrors?: Record<string, string[]>; ok: false }
  | { importId: string; ok: true }

export type ProductMutationResult = { error: string; ok: false } | { ok: true }
