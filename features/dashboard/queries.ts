import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { getPaidListingAmountsByProductId } from "@/features/products/public-queries"

export type OwnedProduct = {
  categoryName: string
  id: string
  logoUrl: string | null
  moderationStatus: "draft" | "published" | "rejected"
  name: string
  tagline: string
  updatedAt: string
  upvoteValuePesos: number
  websiteUrl: string
}

export async function getUserProducts(userId: string): Promise<OwnedProduct[]> {
  const supabase = createAdminClient()
  const { data: builderLinks, error: builderLinksError } = await supabase
    .from("product_builders")
    .select("product_id")
    .eq("user_id", userId)

  if (builderLinksError) {
    throw new Error(
      `Unable to load your products: ${builderLinksError.message}`
    )
  }

  const productIds = (builderLinks ?? []).map(
    (link) => link.product_id as string
  )
  if (!productIds.length) return []

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, tagline, website_url, moderation_status, updated_at, categories(name), product_assets(public_url, type), product_upvotes(amount_centavos, status)"
    )
    .in("id", productIds)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })

  if (error) throw new Error(`Unable to load your products: ${error.message}`)

  type ProductRow = {
    categories: Array<{ name: string }> | { name: string } | null
    id: string
    moderation_status: OwnedProduct["moderationStatus"]
    name: string
    product_assets: Array<{
      public_url: string
      type: "logo" | "cover" | "screenshot"
    }>
    product_upvotes: Array<{
      amount_centavos: number
      status: "pending" | "paid" | "failed" | "expired"
    }>
    tagline: string
    updated_at: string
    website_url: string
  }

  const listingAmounts = await getPaidListingAmountsByProductId(productIds)

  return (data as unknown as ProductRow[]).map((product) => {
    const paidUpvotePesos = product.product_upvotes.reduce(
      (total, upvote) =>
        upvote.status === "paid"
          ? total + Math.floor(upvote.amount_centavos / 100)
          : total,
      0
    )

    const listingAmountPesos = listingAmounts.get(product.id) ?? 1

    return {
      categoryName: Array.isArray(product.categories)
        ? (product.categories[0]?.name ?? "Other")
        : (product.categories?.name ?? "Other"),
      id: product.id,
      logoUrl:
        product.product_assets.find((asset) => asset.type === "logo")
          ?.public_url ?? null,
      moderationStatus: product.moderation_status,
      name: product.name,
      tagline: product.tagline,
      updatedAt: product.updated_at,
      upvoteValuePesos: listingAmountPesos + paidUpvotePesos,
      websiteUrl: product.website_url,
    }
  })
}
