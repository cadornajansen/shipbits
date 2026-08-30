"use server"

import { revalidatePath } from "next/cache"
import { invalidatePublicProducts } from "@/features/products/public-cache"
import { after } from "next/server"

import { requireAdmin } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getNormalizedDomain,
  normalizeWebsiteUrl,
} from "@/features/products/validation"

import {
  refreshEvidenceForImport,
  regenerateProductDescription,
  runProductImportPipeline,
} from "./pipeline"
import type { ImportActionResult, ProductMutationResult } from "./types"
import { importUrlSchema } from "./validation"

function runAfterResponse(task: () => Promise<void>) {
  after(async () => {
    await task().catch(() => undefined)
  })
}

export async function createImportAction(
  formData: FormData
): Promise<ImportActionResult> {
  const admin = await requireAdmin()
  const parsed = importUrlSchema.safeParse(formData.get("website_url"))

  if (!parsed.success) {
    return {
      error: "Enter a valid product URL.",
      fieldErrors: { websiteUrl: parsed.error.flatten().formErrors },
      ok: false,
    }
  }

  const sourceUrl = normalizeWebsiteUrl(parsed.data)
  const normalizedDomain = getNormalizedDomain(sourceUrl)
  const supabase = createAdminClient()
  const { data: activeImport, error: activeImportError } = await supabase
    .from("product_imports")
    .select("id")
    .eq("normalized_domain", normalizedDomain)
    .in("status", ["queued", "extracting", "generating"])
    .maybeSingle()

  if (activeImportError) {
    return { error: activeImportError.message, ok: false }
  }

  if (activeImport) {
    return { importId: activeImport.id as string, ok: true }
  }

  const { data: previousImport, error: previousImportError } = await supabase
    .from("product_imports")
    .select("id, product_id, status")
    .eq("normalized_domain", normalizedDomain)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previousImportError) {
    return { error: previousImportError.message, ok: false }
  }

  if (previousImport?.product_id) {
    return {
      error: "A previous import already created a product for this domain.",
      ok: false,
    }
  }

  if (previousImport?.status === "failed") {
    const { error } = await supabase
      .from("product_imports")
      .update({ completed_at: null, error_message: null, status: "queued" })
      .eq("id", previousImport.id)

    if (error) {
      return { error: error.message, ok: false }
    }

    runAfterResponse(() =>
      runProductImportPipeline(previousImport.id as string)
    )
    revalidatePath("/admin/products")
    return { importId: previousImport.id as string, ok: true }
  }

  const { data: importJob, error } = await supabase
    .from("product_imports")
    .insert({
      created_by_user_id: admin.id,
      normalized_domain: normalizedDomain,
      source_url: sourceUrl,
      status: "queued",
    })
    .select("id")
    .single()

  if (error || !importJob) {
    return { error: error?.message || "Unable to queue the import.", ok: false }
  }

  runAfterResponse(() => runProductImportPipeline(importJob.id as string))
  revalidatePath("/admin/products")
  return { importId: importJob.id as string, ok: true }
}

export async function retryImportAction(
  importId: string
): Promise<ProductMutationResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_imports")
    .update({
      completed_at: null,
      error_message: null,
      status: "queued",
    })
    .eq("id", importId)
    .is("product_id", null)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return {
      error: error?.message || "This import is no longer available for retry.",
      ok: false,
    }
  }

  runAfterResponse(() => runProductImportPipeline(importId))
  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return { ok: true }
}

export async function dismissImportAction(
  importId: string
): Promise<ProductMutationResult> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("product_imports")
    .delete()
    .eq("id", importId)
    .is("product_id", null)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return {
      error: error?.message || "This import cannot be dismissed.",
      ok: false,
    }
  }

  revalidatePath("/admin/products")
  return { ok: true }
}

export async function refreshEvidenceAction(
  importId: string
): Promise<ProductMutationResult> {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from("product_imports")
    .update({ completed_at: null, error_message: null, status: "extracting" })
    .eq("id", importId)

  if (error) {
    return { error: error.message, ok: false }
  }

  runAfterResponse(() => refreshEvidenceForImport(importId))
  revalidatePath("/admin/products")
  return { ok: true }
}

export async function regenerateDescriptionAction({
  field,
  importId,
  productId,
}: {
  field: "short_description" | "long_description"
  importId: string
  productId: string
}): Promise<ProductMutationResult> {
  await requireAdmin()
  const result = await regenerateProductDescription({
    field,
    importId,
    productId,
  })
  if (!result.ok) {
    return {
      error: result.error || "Unable to regenerate the description.",
      ok: false,
    }
  }
  revalidatePath("/admin/products")
  return { ok: true }
}

export async function publishProductAction(
  productId: string
): Promise<ProductMutationResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      "id, name, website_url, normalized_domain, slug, short_description, category_id"
    )
    .eq("id", productId)
    .single()

  if (productError || !product) {
    return { error: productError?.message || "Product not found.", ok: false }
  }

  const requiredFields = [
    product.name,
    product.website_url,
    product.normalized_domain,
    product.slug,
    product.short_description,
    product.category_id,
  ]
  if (requiredFields.some((value) => !value)) {
    return {
      error: "Complete the required product fields before publishing.",
      ok: false,
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      moderation_status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (error) {
    return { error: error.message, ok: false }
  }

  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return { ok: true }
}
