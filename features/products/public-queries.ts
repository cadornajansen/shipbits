import "server-only"

import { unstable_cache } from "next/cache"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCategories } from "@/features/products/queries"
import { PUBLIC_PRODUCTS_TAG } from "@/features/products/public-cache"

export type PublicDirectoryProduct = {
  categoryId: string
  categoryName: string
  categorySlug: string
  coverUrl: string | null
  domain: string
  id: string
  listingSource: "admin" | "paid"
  logoUrl: string | null
  name: string
  publishedAt: string | null
  shortDescription: string
  slug: string
  tagline: string
  updatedAt: string
  upvoteCount: number
  upvoteValuePesos: number
  websiteUrl: string
}

export type PublicProduct = PublicDirectoryProduct & { longDescription: string | null }

type PublicProductRow = {
  categories: { name: string; slug: string } | Array<{ name: string; slug: string }> | null
  category_id: string
  id: string
  listing_source: "admin" | "paid"
  long_description: string | null
  name: string
  normalized_domain: string
  product_assets: Array<{ public_url: string; type: "logo" | "cover" | "screenshot" }>
  product_upvotes: Array<{ amount_centavos: number; status: string }>
  published_at: string | null
  short_description: string
  slug: string
  tagline: string | null
  updated_at: string
  website_url: string
}

const publicProductSelection = "id, slug, name, tagline, short_description, long_description, website_url, normalized_domain, category_id, listing_source, published_at, updated_at, categories(name, slug), product_assets(public_url, type), product_upvotes(amount_centavos, status)"
export const DIRECTORY_PAGE_SIZE = 24

/** Returns the verified listing fee for each paid product. */
export async function getPaidListingAmountsByProductId(
  productIds: string[]
): Promise<Map<string, number>> {
  const amounts = new Map<string, number>()
  if (!productIds.length) return amounts

  const supabase = createAdminClient()
  const { data: submissions, error: submissionsError } = await supabase
    .from("listing_submissions")
    .select("id, product_id")
    .in("product_id", productIds)

  if (submissionsError) {
    throw new Error(
      `Unable to load listing payment amounts: ${submissionsError.message}`
    )
  }

  const submissionToProduct = new Map(
    (submissions ?? []).map((submission) => [
      submission.id as string,
      submission.product_id as string,
    ])
  )
  const submissionIds = [...submissionToProduct.keys()]
  if (!submissionIds.length) return amounts

  const { data: payments, error: paymentsError } = await supabase
    .from("listing_payments")
    .select("submission_id, amount_centavos, created_at")
    .in("submission_id", submissionIds)
    .eq("status", "paid")
    .order("created_at", { ascending: false })

  if (paymentsError) {
    throw new Error(
      `Unable to load listing payment amounts: ${paymentsError.message}`
    )
  }

  for (const payment of payments ?? []) {
    const productId = submissionToProduct.get(payment.submission_id as string)
    if (productId && !amounts.has(productId)) {
      amounts.set(
        productId,
        Math.floor((payment.amount_centavos as number) / 100)
      )
    }
  }

  return amounts
}

async function mapPublicProducts(rows: PublicProductRow[]): Promise<PublicProduct[]> {
  const listingAmounts = await getPaidListingAmountsByProductId(rows.map((product) => product.id))
  return rows.map((product) => {
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories
    const paidUpvotePesos = (product.product_upvotes ?? []).reduce(
      (total, upvote) => upvote.status === "paid" ? total + Math.floor(upvote.amount_centavos / 100) : total,
      0
    )
    return {
      categoryId: product.category_id,
      categoryName: category?.name ?? "Other",
      categorySlug: category?.slug ?? "other",
      coverUrl: product.product_assets.find((asset) => asset.type === "cover")?.public_url ?? null,
      domain: product.normalized_domain,
      id: product.id,
      listingSource: product.listing_source,
      logoUrl: product.product_assets.find((asset) => asset.type === "logo")?.public_url ?? null,
      longDescription: product.long_description,
      name: product.name,
      publishedAt: product.published_at,
      shortDescription: product.short_description,
      slug: product.slug,
      tagline: product.tagline?.trim() || product.short_description,
      updatedAt: product.updated_at,
      upvoteCount: paidUpvotePesos,
      upvoteValuePesos: (listingAmounts.get(product.id) ?? 1) + paidUpvotePesos,
      websiteUrl: product.website_url,
    }
  })
}

export const getPublicDirectoryProducts = unstable_cache(async (
  options: { categoryId?: string; page?: number } = {}
): Promise<PublicDirectoryProduct[]> => {
  const supabase = createAdminClient()
  const page = Math.max(1, Math.floor(options.page ?? 1))
  let query = supabase
    .from("products")
    .select(publicProductSelection)
    .eq("moderation_status", "published")
    .is("archived_at", null)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * DIRECTORY_PAGE_SIZE, page * DIRECTORY_PAGE_SIZE - 1)
  if (options.categoryId) query = query.eq("category_id", options.categoryId)
  const { data, error } = await query
  if (error) {
    throw new Error(`Unable to load the public directory: ${error.message}`)
  }
  return mapPublicProducts((data ?? []) as unknown as PublicProductRow[])
}, ["public-directory-v2"], { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] })

export const getPublicProductBySlug = cache(unstable_cache(async (slug: string): Promise<PublicProduct | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const { data, error } = await createAdminClient()
    .from("products")
    .select(publicProductSelection)
    .eq("slug", slug)
    .eq("moderation_status", "published")
    .is("archived_at", null)
    .maybeSingle()
  if (error) throw new Error(`Unable to load product: ${error.message}`)
  if (!data) return null
  return (await mapPublicProducts([data as unknown as PublicProductRow]))[0]
}, ["public-product-v1"], { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }))

export type PublicProductIndexEntry = {
  id: string
  slug: string
  name: string
  category_id: string
  updated_at: string
}

// Fetch in pages so Supabase's row limit cannot silently truncate the sitemap.
export const getPublicProductIndex = unstable_cache(async (): Promise<PublicProductIndexEntry[]> => {
  const products: PublicProductIndexEntry[] = []
  const supabase = createAdminClient()
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("products")
      .select("id, slug, name, category_id, updated_at")
      .eq("moderation_status", "published")
      .is("archived_at", null)
      .order("id")
      .range(offset, offset + 499)
    if (error) throw new Error(`Unable to load public product index: ${error.message}`)
    products.push(...(data as PublicProductIndexEntry[]))
    if (data.length < 500) break
  }
  return products
}, ["public-product-index-v1"], { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] })

export const getPublicCategories = unstable_cache(async () => {
  const [categories, products] = await Promise.all([getCategories(), getPublicProductIndex()])
  const counts = new Map<string, { count: number; updatedAt: string }>()
  for (const product of products) {
    const current = counts.get(product.category_id)
    counts.set(product.category_id, {
      count: (current?.count ?? 0) + 1,
      updatedAt: current && current.updatedAt > product.updated_at ? current.updatedAt : product.updated_at,
    })
  }
  return categories.map((category) => ({
    ...category,
    productCount: counts.get(category.id)?.count ?? 0,
    updatedAt: counts.get(category.id)?.updatedAt ?? null,
  }))
}, ["public-categories-v1"], { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] })

export async function getRelatedProducts(product: PublicProduct): Promise<PublicDirectoryProduct[]> {
  const products = await getPublicDirectoryProducts({ categoryId: product.categoryId })
  return products.filter((item) => item.id !== product.id).slice(0, 3)
}
