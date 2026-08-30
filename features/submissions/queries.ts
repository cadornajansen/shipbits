import "server-only"

import { createClient } from "@/lib/supabase/server"

export type Submission = {
  categoryId: string | null
  categoryName: string | null
  archivedAt: string | null
  id: string
  longDescription: string | null
  name: string | null
  normalizedDomain: string
  coverUrl: string | null
  logoUrl: string | null
  paidAmountCentavos: number | null
  paymentId: string | null
  paymentStatus: "pending" | "paid" | "failed" | "expired" | null
  productId: string | null
  shortDescription: string | null
  slug: string | null
  tagline: string | null
  tags: string[]
  status: "draft" | "pending_payment" | "submitted"
  updatedAt: string
  websiteUrl: string
}

export async function getUserSubmissions(
  userId: string
): Promise<Submission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listing_submissions")
    .select(
      "id, website_url, normalized_domain, name, slug, tagline, tags, short_description, long_description, category_id, status, updated_at, archived_at, product_id, categories(name)"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`Unable to load submissions: ${error.message}`)
  }

  const submissionIds = (data ?? []).map(
    (submission) => submission.id as string
  )
  const { data: payments, error: paymentsError } = submissionIds.length
    ? await supabase
        .from("listing_payments")
        .select("id, submission_id, amount_centavos, status, created_at")
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null }

  if (paymentsError) {
    throw new Error(`Unable to load payment status: ${paymentsError.message}`)
  }

  const { data: assets, error: assetsError } = submissionIds.length
    ? await supabase
        .from("listing_submission_assets")
        .select("submission_id, type, public_url")
        .in("submission_id", submissionIds)
    : { data: [], error: null }
  if (assetsError) {
    throw new Error(`Unable to load submission media: ${assetsError.message}`)
  }

  const assetsBySubmissionId = new Map<
    string,
    { coverUrl: string | null; logoUrl: string | null }
  >()
  for (const asset of assets ?? []) {
    const current = assetsBySubmissionId.get(asset.submission_id as string) ?? {
      coverUrl: null,
      logoUrl: null,
    }
    if (asset.type === "logo") current.logoUrl = asset.public_url as string
    if (asset.type === "cover") current.coverUrl = asset.public_url as string
    assetsBySubmissionId.set(asset.submission_id as string, current)
  }

  const paymentBySubmissionId = new Map<
    string,
    {
      amountCentavos: number
      id: string
      status: Submission["paymentStatus"]
    }
  >()
  for (const payment of payments ?? []) {
    const current = paymentBySubmissionId.get(payment.submission_id as string)
    if (!current || payment.status === "paid") {
      paymentBySubmissionId.set(payment.submission_id as string, {
        amountCentavos: payment.amount_centavos as number,
        id: payment.id as string,
        status: payment.status as Submission["paymentStatus"],
      })
    }
  }

  return (data ?? []).map((submission) => {
    const row = submission as {
      categories: { name: string } | Array<{ name: string }> | null
      category_id: string | null
      archived_at: string | null
      id: string
      long_description: string | null
      name: string | null
      normalized_domain: string
      product_id: string | null
      short_description: string | null
      slug: string | null
      status: Submission["status"]
      tagline: string | null
      tags: string[]
      updated_at: string
      website_url: string
    }

    const payment = paymentBySubmissionId.get(row.id)
    const media = assetsBySubmissionId.get(row.id)

    return {
      archivedAt: row.archived_at,
      categoryId: row.category_id,
      categoryName: Array.isArray(row.categories)
        ? (row.categories[0]?.name ?? null)
        : (row.categories?.name ?? null),
      id: row.id,
      coverUrl: media?.coverUrl ?? null,
      longDescription: row.long_description,
      logoUrl: media?.logoUrl ?? null,
      name: row.name,
      normalizedDomain: row.normalized_domain,
      paidAmountCentavos:
        payment?.status === "paid" ? payment.amountCentavos : null,
      paymentId: payment?.id ?? null,
      paymentStatus: payment?.status ?? null,
      productId: row.product_id,
      shortDescription: row.short_description,
      slug: row.slug,
      status: row.status,
      tagline: row.tagline,
      tags: row.tags ?? [],
      updatedAt: row.updated_at,
      websiteUrl: row.website_url,
    }
  })
}
