import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type { ProductBoardData } from "./types"

export async function getProductBoardData(): Promise<ProductBoardData> {
  const supabase = createAdminClient()
  const [importsResult, draftsResult, publishedResult] = await Promise.all([
    supabase
      .from("product_imports")
      .select(
        "id, product_id, source_url, normalized_domain, status, error_message, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(
        "id, name, slug, category_id, normalized_domain, website_url, tagline, short_description, long_description, listing_source, moderation_status, created_at, categories(name), product_assets(public_url, type)"
      )
      .eq("moderation_status", "draft")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(
        "id, name, slug, category_id, normalized_domain, website_url, tagline, short_description, long_description, listing_source, moderation_status, created_at, published_at, categories(name), product_assets(public_url, type)"
      )
      .eq("moderation_status", "published")
      .is("archived_at", null)
      .order("published_at", { ascending: false }),
  ])

  if (importsResult.error || draftsResult.error || publishedResult.error) {
    throw new Error(
      importsResult.error?.message ||
        draftsResult.error?.message ||
        publishedResult.error?.message ||
        "Unable to load the product board."
    )
  }

  type ImportRow = {
    created_at: string
    error_message: string | null
    id: string
    normalized_domain: string
    product_id: string | null
    source_url: string
    status: ProductBoardData["importQueue"][number]["status"]
  }
  type ProductRow = {
    category_id?: string
    categories: Array<{ name: string }>
    created_at: string
    id: string
    listing_source: "admin" | "paid"
    long_description?: string | null
    moderation_status: "draft" | "published" | "rejected"
    name: string
    normalized_domain: string
    product_assets: Array<{
      public_url: string
      type: "logo" | "cover" | "screenshot"
    }>
    published_at?: string | null
    short_description: string
    slug?: string
    tagline?: string
    website_url?: string
  }

  const imports = importsResult.data as unknown as ImportRow[]
  const latestImportByProductId = new Map<string, ImportRow>()
  for (const item of imports) {
    if (item.product_id && !latestImportByProductId.has(item.product_id)) {
      latestImportByProductId.set(item.product_id, item)
    }
  }

  const toProductListItem = (product: ProductRow) => ({
    categoryName: product.categories[0]?.name ?? "Other",
    createdAt: product.created_at,
    domain: product.normalized_domain,
    id: product.id,
    logoUrl:
      product.product_assets.find((asset) => asset.type === "logo")
        ?.public_url ?? null,
    moderationStatus: product.moderation_status,
    name: product.name,
    source: product.listing_source,
  })

  const draftProducts = (draftsResult.data as unknown as ProductRow[]).map(
    (product) => {
      const importJob = latestImportByProductId.get(product.id)
      return {
        ...toProductListItem(product),
        categoryId: product.category_id ?? "",
        importId: importJob?.id ?? null,
        importStatus: importJob?.status ?? null,
        longDescription: product.long_description ?? null,
        shortDescription: product.short_description,
        sourceUrl: importJob?.source_url ?? null,
        slug: product.slug ?? "",
        tagline: product.tagline ?? "",
        warning: importJob?.error_message ?? null,
        websiteUrl: product.website_url ?? "",
      }
    }
  )

  return {
    draftProducts,
    importQueue: imports
      .filter((item) => !item.product_id)
      .map((item) => ({
        createdAt: item.created_at,
        domain: item.normalized_domain,
        errorMessage: item.error_message,
        id: item.id,
        productId: item.product_id,
        sourceUrl: item.source_url,
        status: item.status,
      })),
    publishedProducts: (publishedResult.data as unknown as ProductRow[]).map(
      (product) => ({
        ...toProductListItem(product),
        categoryId: product.category_id ?? "",
        coverUrl:
          product.product_assets.find((asset) => asset.type === "cover")
            ?.public_url ?? null,
        importId: latestImportByProductId.get(product.id)?.id ?? null,
        longDescription: product.long_description ?? null,
        publishedAt: product.published_at ?? null,
        shortDescription: product.short_description,
        slug: product.slug ?? "",
        tagline: product.tagline ?? "",
        websiteUrl: product.website_url ?? "",
      })
    ),
  }
}
