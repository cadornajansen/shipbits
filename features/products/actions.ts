"use server"

import { revalidatePath } from "next/cache"
import { invalidatePublicProducts } from "@/features/products/public-cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/auth"
import {
  deleteProductObject,
  uploadProductImage,
  validateProductImage,
} from "@/lib/storage/r2"

import type { ProductActionResult } from "./types"
import {
  getNormalizedDomain,
  normalizedDomainSchema,
  normalizeWebsiteUrl,
  productSchema,
} from "./validation"
import { normalizeProductTags, validateProductTags } from "./tags"

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null
}

function getConflictResult(message: string): ProductActionResult {
  if (message.includes("products_normalized_domain_key")) {
    return {
      error: "A product with this website domain already exists.",
      fieldErrors: { websiteUrl: ["This website domain is already listed."] },
      ok: false,
    }
  }

  if (message.includes("products_slug_key")) {
    return {
      error: "This slug is already in use.",
      fieldErrors: { slug: ["Choose a different slug."] },
      ok: false,
    }
  }

  return { error: "Unable to create the product. Please try again.", ok: false }
}

type ProductAdminActionResult = { error: string; ok: false } | { ok: true }

export async function returnProductToDraftAction(
  productId: string
): Promise<ProductAdminActionResult> {
  await requireAdmin()
  const { data, error } = await createAdminClient()
    .from("products")
    .update({ moderation_status: "draft", published_at: null })
    .eq("id", productId)
    .eq("moderation_status", "published")
    .is("archived_at", null)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return {
      error: error?.message || "This published product is no longer available.",
      ok: false,
    }
  }

  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return { ok: true }
}

export async function archiveProductAction(
  productId: string
): Promise<ProductAdminActionResult> {
  const admin = await requireAdmin()
  const supabase = createAdminClient()
  const archivedAt = new Date().toISOString()
  const { data: product, error: productError } = await supabase
    .from("products")
    .update({ archived_at: archivedAt, archived_by: admin.id })
    .eq("id", productId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle()

  if (productError || !product) {
    return {
      error: productError?.message || "This product is no longer available.",
      ok: false,
    }
  }

  const { error: submissionError } = await supabase
    .from("listing_submissions")
    .update({ archived_at: archivedAt, archived_by: admin.id })
    .eq("product_id", productId)

  if (submissionError) {
    return {
      error: `The product was archived, but its founder record could not be updated: ${submissionError.message}`,
      ok: false,
    }
  }

  invalidatePublicProducts()
  revalidatePath("/admin/products")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteProductAction(
  productId: string
): Promise<ProductAdminActionResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const [
    { data: assets, error: assetsError },
    { data: imports, error: importsError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase
      .from("product_assets")
      .select("object_key")
      .eq("product_id", productId),
    supabase.from("product_imports").select("id").eq("product_id", productId),
    supabase
      .from("listing_submissions")
      .select("id")
      .eq("product_id", productId),
  ])

  if (assetsError || importsError || submissionsError) {
    return {
      error:
        assetsError?.message ||
        importsError?.message ||
        submissionsError?.message ||
        "Unable to prepare this product for deletion.",
      ok: false,
    }
  }

  const submissionIds = (submissions ?? []).map((submission) => submission.id)
  const { data: submissionAssets, error: submissionAssetsError } =
    submissionIds.length
      ? await supabase
          .from("listing_submission_assets")
          .select("object_key")
          .in("submission_id", submissionIds)
      : { data: [], error: null }

  if (submissionAssetsError) {
    return {
      error: `Unable to prepare founder media for deletion: ${submissionAssetsError.message}`,
      ok: false,
    }
  }

  const { data: deletedProduct, error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .select("id")
    .maybeSingle()

  if (productError || !deletedProduct) {
    return {
      error: productError?.message || "This product is no longer available.",
      ok: false,
    }
  }

  const importIds = (imports ?? []).map((item) => item.id as string)
  if (importIds.length) {
    const { error: importError } = await supabase
      .from("product_imports")
      .delete()
      .in("id", importIds)

    if (importError) {
      console.error("Unable to remove deleted product import records", {
        importIds,
        productId,
      })
    }
  }

  await Promise.allSettled(
    [
      ...new Set([
        ...(assets ?? []).map((asset) => asset.object_key),
        ...(submissionAssets ?? []).map((asset) => asset.object_key),
      ]),
    ].map((objectKey) => deleteProductObject(objectKey))
  )

  invalidatePublicProducts()
  revalidatePath("/admin/products")
  revalidatePath("/dashboard")
  return { ok: true }
}

async function replaceProductAsset({
  file,
  productId,
  supabase,
  type,
}: {
  file: File
  productId: string
  supabase: ReturnType<typeof createAdminClient>
  type: "logo" | "cover"
}) {
  const uploadedAsset = await uploadProductImage({ file, productId, type })
  const { data: existingAsset, error: existingAssetError } = await supabase
    .from("product_assets")
    .select("id, object_key")
    .eq("product_id", productId)
    .eq("type", type)
    .maybeSingle()

  if (existingAssetError) {
    await deleteProductObject(uploadedAsset.objectKey)
    throw new Error(existingAssetError.message)
  }

  const existingObjectKey = existingAsset?.object_key
  const assetValues = {
    mime_type: uploadedAsset.mimeType,
    object_key: uploadedAsset.objectKey,
    product_id: productId,
    public_url: uploadedAsset.publicUrl,
    size_bytes: uploadedAsset.sizeBytes,
    source: "admin_upload",
    type,
  }
  const { error } = existingAsset
    ? await supabase
        .from("product_assets")
        .update(assetValues)
        .eq("id", existingAsset.id)
    : await supabase.from("product_assets").insert(assetValues)

  if (error) {
    if (existingObjectKey !== uploadedAsset.objectKey) {
      await deleteProductObject(uploadedAsset.objectKey)
    }
    throw new Error(`Unable to save ${type} metadata: ${error.message}`)
  }

  if (existingObjectKey && existingObjectKey !== uploadedAsset.objectKey) {
    await deleteProductObject(existingObjectKey).catch(() => undefined)
  }
}

export async function createProductAction(
  formData: FormData
): Promise<ProductActionResult> {
  const admin = await requireAdmin()

  const parsed = productSchema.safeParse({
    categoryId: formData.get("category_id"),
    longDescription: formData.get("long_description"),
    moderationStatus: formData.get("moderation_status"),
    name: formData.get("name"),
    shortDescription: formData.get("short_description"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    tags: formData.get("tags"),
    websiteUrl: formData.get("website_url"),
  })

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      ok: false,
    }
  }

  const logo = getOptionalFile(formData.get("logo"))
  const cover = getOptionalFile(formData.get("cover"))
  const imageErrors = (
    await Promise.all([
      logo ? validateProductImage(logo, "Logo") : null,
      cover ? validateProductImage(cover, "Cover image") : null,
    ])
  ).filter((error): error is string => Boolean(error))

  if (imageErrors.length) {
    return { error: imageErrors[0], ok: false }
  }

  const websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl)
  const normalizedDomain = getNormalizedDomain(websiteUrl)
  const validatedDomain = normalizedDomainSchema.safeParse(normalizedDomain)

  if (!validatedDomain.success) {
    return {
      error: "The website domain is invalid.",
      fieldErrors: { websiteUrl: validatedDomain.error.flatten().formErrors },
      ok: false,
    }
  }
  const supabase = createAdminClient()
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", parsed.data.categoryId)
    .maybeSingle()
  if (categoryError || !category) {
    return { error: "The selected category is unavailable.", ok: false }
  }
  const tagError = validateProductTags(parsed.data.tags, category)
  if (tagError) {
    return { error: tagError, fieldErrors: { tags: [tagError] }, ok: false }
  }
  const tags = normalizeProductTags(parsed.data.tags, category)

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: parsed.data.categoryId,
      created_by_user_id: admin.id,
      listing_source: "admin",
      long_description: parsed.data.longDescription,
      moderation_status: parsed.data.moderationStatus,
      name: parsed.data.name,
      normalized_domain: normalizedDomain,
      published_at:
        parsed.data.moderationStatus === "published"
          ? new Date().toISOString()
          : null,
      short_description: parsed.data.shortDescription,
      slug: parsed.data.slug,
      tagline: parsed.data.tagline,
      tags,
      website_url: websiteUrl,
    })
    .select("id")
    .single()

  if (productError || !product) {
    return getConflictResult(productError?.message ?? "")
  }

  const uploadedObjectKeys: string[] = []

  try {
    for (const [type, file] of [
      ["logo", logo],
      ["cover", cover],
    ] as const) {
      if (!file) {
        continue
      }

      const uploadedAsset = await uploadProductImage({
        file,
        productId: product.id,
        type,
      })
      uploadedObjectKeys.push(uploadedAsset.objectKey)

      const { error: assetError } = await supabase
        .from("product_assets")
        .insert({
          mime_type: uploadedAsset.mimeType,
          object_key: uploadedAsset.objectKey,
          product_id: product.id,
          public_url: uploadedAsset.publicUrl,
          size_bytes: uploadedAsset.sizeBytes,
          source: "admin_upload",
          type,
        })

      if (assetError) {
        throw new Error(
          `Unable to save ${type} metadata: ${assetError.message}`
        )
      }
    }
  } catch (error) {
    await Promise.allSettled(uploadedObjectKeys.map(deleteProductObject))
    await supabase.from("products").delete().eq("id", product.id)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to upload the product assets.",
      ok: false,
    }
  }

  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return { ok: true, productId: product.id }
}

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ProductActionResult> {
  await requireAdmin()
  const parsed = productSchema.safeParse({
    categoryId: formData.get("category_id"),
    longDescription: formData.get("long_description"),
    moderationStatus: "draft",
    name: formData.get("name"),
    shortDescription: formData.get("short_description"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    tags: formData.get("tags"),
    websiteUrl: formData.get("website_url"),
  })

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      ok: false,
    }
  }

  const logo = getOptionalFile(formData.get("logo"))
  const cover = getOptionalFile(formData.get("cover"))
  const imageErrors = (
    await Promise.all([
      logo ? validateProductImage(logo, "Logo") : null,
      cover ? validateProductImage(cover, "OG / cover image") : null,
    ])
  ).filter((error): error is string => Boolean(error))

  if (imageErrors.length) {
    return { error: imageErrors[0], ok: false }
  }

  const websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl)
  const normalizedDomain = getNormalizedDomain(websiteUrl)
  if (!normalizedDomainSchema.safeParse(normalizedDomain).success) {
    return {
      error: "The website domain is invalid.",
      fieldErrors: { websiteUrl: ["Enter a valid website domain."] },
      ok: false,
    }
  }

  const supabase = createAdminClient()
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", parsed.data.categoryId)
    .maybeSingle()
  if (categoryError || !category) {
    return { error: "The selected category is unavailable.", ok: false }
  }
  const tagError = validateProductTags(parsed.data.tags, category)
  if (tagError) {
    return { error: tagError, fieldErrors: { tags: [tagError] }, ok: false }
  }
  const tags = normalizeProductTags(parsed.data.tags, category)
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId,
      long_description: parsed.data.longDescription,
      name: parsed.data.name,
      normalized_domain: normalizedDomain,
      short_description: parsed.data.shortDescription,
      slug: parsed.data.slug,
      tagline: parsed.data.tagline,
      tags,
      website_url: websiteUrl,
    })
    .eq("id", productId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle()

  if (error) {
    return getConflictResult(error.message)
  }

  if (!data) {
    return { error: "Product not found.", ok: false }
  }

  try {
    if (logo) {
      await replaceProductAsset({
        file: logo,
        productId,
        supabase,
        type: "logo",
      })
    }
    if (cover) {
      await replaceProductAsset({
        file: cover,
        productId,
        supabase,
        type: "cover",
      })
    }
  } catch (assetError) {
    return {
      error:
        assetError instanceof Error
          ? `Product details were saved, but an image could not be updated: ${assetError.message}`
          : "Product details were saved, but an image could not be updated.",
      ok: false,
    }
  }

  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return { ok: true, productId }
}
