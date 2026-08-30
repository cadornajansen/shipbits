import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type { Category, ProductListItem } from "./types"

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name")

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`)
  }

  return data as Category[]
}

export async function getAdminProducts(): Promise<ProductListItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, normalized_domain, listing_source, moderation_status, created_at, categories(name), product_assets(public_url, type)"
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Unable to load products: ${error.message}`)
  }

  type ProductRow = {
    categories: Array<{ name: string }>
    created_at: string
    id: string
    listing_source: "admin" | "paid"
    moderation_status: "draft" | "published" | "rejected"
    name: string
    normalized_domain: string
    product_assets: Array<{
      public_url: string
      type: "logo" | "cover" | "screenshot"
    }>
  }

  return (data as unknown as ProductRow[]).map((product) => ({
    categoryName: product.categories[0]?.name ?? "Uncategorized",
    createdAt: product.created_at,
    domain: product.normalized_domain,
    id: product.id,
    logoUrl:
      product.product_assets.find((asset) => asset.type === "logo")
        ?.public_url ?? null,
    moderationStatus: product.moderation_status,
    name: product.name,
    source: product.listing_source,
  }))
}
