import "server-only"

import { unstable_cache } from "next/cache"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCategories } from "@/features/products/queries"
import { PUBLIC_PRODUCTS_TAG } from "@/features/products/public-cache"
import { toDirectorySearchPattern } from "@/features/products/search"

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
  tags: string[]
  updatedAt: string
  upvoteCount: number
  upvoteValuePesos: number
  websiteUrl: string
}

export type PublicProductPublisher = {
  avatarUrl: string | null
  name: string
}

type PublicProductData = PublicDirectoryProduct & {
  longDescription: string | null
}

export type PublicProduct = PublicProductData & {
  publisher: PublicProductPublisher | null
}

type PublicProductRow = {
  categories:
    | { name: string; slug: string }
    | Array<{ name: string; slug: string }>
    | null
  category_id: string
  id: string
  listing_source: "admin" | "paid"
  long_description: string | null
  name: string
  normalized_domain: string
  product_assets: Array<{
    public_url: string
    type: "logo" | "cover" | "screenshot"
  }>
  product_upvotes: Array<{ amount_centavos: number; status: string }>
  published_at: string | null
  short_description: string
  slug: string
  tagline: string | null
  tags: string[]
  updated_at: string
  website_url: string
}

const publicProductSelection =
  "id, slug, name, tagline, tags, short_description, long_description, website_url, normalized_domain, category_id, listing_source, published_at, updated_at, categories(name, slug), product_assets(public_url, type), product_upvotes(amount_centavos, status)"
export const DIRECTORY_PAGE_SIZE = 24
/** Hard ceiling for a single directory request so one page can never fetch unbounded rows. */
export const DIRECTORY_MAX_PAGE_SIZE = 100

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

/** PostgREST `or(...)` filter matching a term against the searchable text columns. */
function directorySearchFilter(term: string): string {
  const pattern = toDirectorySearchPattern(term)
  return ["name", "tagline", "short_description", "normalized_domain"]
    .map((column) => `${column}.ilike.${pattern}`)
    .join(",")
}

async function mapPublicProducts(
  rows: PublicProductRow[]
): Promise<PublicProductData[]> {
  const listingAmounts = await getPaidListingAmountsByProductId(
    rows.map((product) => product.id)
  )
  return rows.map((product) => {
    const category = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories
    const paidUpvotePesos = (product.product_upvotes ?? []).reduce(
      (total, upvote) =>
        upvote.status === "paid"
          ? total + Math.floor(upvote.amount_centavos / 100)
          : total,
      0
    )
    return {
      categoryId: product.category_id,
      categoryName: category?.name ?? "Other",
      categorySlug: category?.slug ?? "other",
      coverUrl:
        product.product_assets.find((asset) => asset.type === "cover")
          ?.public_url ?? null,
      domain: product.normalized_domain,
      id: product.id,
      listingSource: product.listing_source,
      logoUrl:
        product.product_assets.find((asset) => asset.type === "logo")
          ?.public_url ?? null,
      longDescription: product.long_description,
      name: product.name,
      publishedAt: product.published_at,
      shortDescription: product.short_description,
      slug: product.slug,
      tagline: product.tagline?.trim() || product.short_description,
      tags: product.tags ?? [],
      updatedAt: product.updated_at,
      upvoteCount: paidUpvotePesos,
      upvoteValuePesos: (listingAmounts.get(product.id) ?? 1) + paidUpvotePesos,
      websiteUrl: product.website_url,
    }
  })
}

async function getPublicProductPublisher(
  productId: string
): Promise<PublicProductPublisher | null> {
  const supabase = createAdminClient()
  const { data: builders, error: buildersError } = await supabase
    .from("product_builders")
    .select("user_id, is_primary")
    .eq("product_id", productId)
    .eq("role", "owner")
    .order("is_primary", { ascending: false })
    .limit(1)

  if (buildersError) {
    throw new Error(
      `Unable to load the product publisher: ${buildersError.message}`
    )
  }

  const ownerId = builders?.[0]?.user_id as string | undefined
  if (!ownerId) return null

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url, display_name, profile_visible")
    .eq("user_id", ownerId)
    .maybeSingle()

  if (profileError) {
    throw new Error(
      `Unable to load the product publisher: ${profileError.message}`
    )
  }

  const name = profile?.display_name?.trim()
  if (!profile?.profile_visible || !name) return null

  return { avatarUrl: profile.avatar_url as string | null, name }
}

export const getPublicDirectoryProducts = unstable_cache(
  async (
    options: {
      categoryId?: string
      page?: number
      pageSize?: number
      search?: string
    } = {}
  ): Promise<PublicDirectoryProduct[]> => {
    const supabase = createAdminClient()
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const pageSize = Math.min(
      DIRECTORY_MAX_PAGE_SIZE,
      Math.max(1, Math.floor(options.pageSize ?? DIRECTORY_PAGE_SIZE))
    )
    // Fetch the complete filtered set before paginating. Upvote totals are
    // returned as a nested relation, so pagination must happen after the
    // server calculates and sorts by confirmed paid upvotes.
    const rows: PublicProductRow[] = []
    for (let offset = 0; ; offset += 500) {
      let query = supabase
        .from("products")
        .select(publicProductSelection)
        .eq("moderation_status", "published")
        .is("archived_at", null)
        .order("published_at", { ascending: false })
        .order("id")
        .range(offset, offset + 499)
      if (options.categoryId) query = query.eq("category_id", options.categoryId)
      if (options.search) query = query.or(directorySearchFilter(options.search))
      const { data, error } = await query
      if (error) {
        throw new Error(`Unable to load the public directory: ${error.message}`)
      }
      rows.push(...((data ?? []) as unknown as PublicProductRow[]))
      if (!data || data.length < 500) break
    }
    const products = await mapPublicProducts(rows)
    products.sort((a, b) => {
      // Rank by the same accumulated peso value shown in the UI: the verified
      // listing amount plus confirmed paid community upvotes.
      const valueDifference = b.upvoteValuePesos - a.upvoteValuePesos
      if (valueDifference) return valueDifference
      const publishedDifference =
        (b.publishedAt ? Date.parse(b.publishedAt) : 0) -
        (a.publishedAt ? Date.parse(a.publishedAt) : 0)
      return publishedDifference || a.id.localeCompare(b.id)
    })
    const start = (page - 1) * pageSize
    return products.slice(start, start + pageSize)
  },
  ["public-directory-v5-peso-ranking"],
  { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
)

export const getPublicProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<PublicProduct | null> => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120)
        return null
      const { data, error } = await createAdminClient()
        .from("products")
        .select(publicProductSelection)
        .eq("slug", slug)
        .eq("moderation_status", "published")
        .is("archived_at", null)
        .maybeSingle()
      if (error) throw new Error(`Unable to load product: ${error.message}`)
      if (!data) return null
      const product = (
        await mapPublicProducts([data as unknown as PublicProductRow])
      )[0]
      return {
        ...product,
        publisher:
          product.listingSource === "paid"
            ? await getPublicProductPublisher(product.id)
            : null,
      }
    },
    ["public-product-v1"],
    { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
  )
)

/** One-based position in the same publication-recency order as the public directory. */
export const getPublicProductRank = unstable_cache(
  async (
    product: Pick<PublicProduct, "id" | "publishedAt">
  ): Promise<number | null> => {
    if (!product.publishedAt) return null
    const { count, error } = await createAdminClient()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "published")
      .is("archived_at", null)
      .or(
        `published_at.gt.${product.publishedAt},and(published_at.eq.${product.publishedAt},id.lt.${product.id})`
      )
    if (error)
      throw new Error(`Unable to rank public product: ${error.message}`)
    return (count ?? 0) + 1
  },
  ["public-product-rank-v1"],
  { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
)

export type PublicProductIndexEntry = {
  id: string
  slug: string
  name: string
  category_id: string
  updated_at: string
}

// Fetch in pages so Supabase's row limit cannot silently truncate the sitemap.
export const getPublicProductIndex = unstable_cache(
  async (): Promise<PublicProductIndexEntry[]> => {
    const products: PublicProductIndexEntry[] = []
    const supabase = createAdminClient()
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, category_id, updated_at")
        .eq("moderation_status", "published")
        .is("archived_at", null)
        .order("id")
        .range(offset, offset + 499)
      if (error)
        throw new Error(`Unable to load public product index: ${error.message}`)
      products.push(...(data as PublicProductIndexEntry[]))
      if (data.length < 500) break
    }
    return products
  },
  ["public-product-index-v1"],
  { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
)

export const getPublicProductCount = unstable_cache(
  async (categoryId?: string, search?: string): Promise<number> => {
    let query = createAdminClient()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "published")
      .is("archived_at", null)
    if (categoryId) query = query.eq("category_id", categoryId)
    if (search) query = query.or(directorySearchFilter(search))
    const { count, error } = await query
    if (error)
      throw new Error(`Unable to count public products: ${error.message}`)
    return count ?? 0
  },
  ["public-product-count-v2"],
  { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
)

export const getPublicCategories = unstable_cache(
  async () => {
    const [categories, products] = await Promise.all([
      getCategories(),
      getPublicProductIndex(),
    ])
    const counts = new Map<string, { count: number; updatedAt: string }>()
    for (const product of products) {
      const current = counts.get(product.category_id)
      counts.set(product.category_id, {
        count: (current?.count ?? 0) + 1,
        updatedAt:
          current && current.updatedAt > product.updated_at
            ? current.updatedAt
            : product.updated_at,
      })
    }
    return categories.map((category) => ({
      ...category,
      productCount: counts.get(category.id)?.count ?? 0,
      updatedAt: counts.get(category.id)?.updatedAt ?? null,
    }))
  },
  ["public-categories-v1"],
  { revalidate: 60, tags: [PUBLIC_PRODUCTS_TAG] }
)

export async function getPublicCategoryBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  return (
    (await getPublicCategories()).find((category) => category.slug === slug) ??
    null
  )
}

export async function getRelatedProducts(
  product: PublicProduct
): Promise<PublicDirectoryProduct[]> {
  const products = await getPublicDirectoryProducts({
    categoryId: product.categoryId,
  })
  return products.filter((item) => item.id !== product.id).slice(0, 3)
}
