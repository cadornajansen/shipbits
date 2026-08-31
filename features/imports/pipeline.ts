import "server-only"

import { createHash } from "node:crypto"

import { scrapeWebsite } from "@/lib/firecrawl/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { deleteProductObject, uploadRemoteProductImage } from "@/lib/storage/r2"
import { getNormalizedDomain, slugify } from "@/features/products/validation"
import {
  normalizeProductTags,
  toCanonicalProductTags,
} from "@/features/products/tags"

import type { ImportStatus } from "./types"
import { generateProductMetadataFromEvidence } from "./extraction"
import {
  canReplaceAssetFromImport,
  getDirectCoverImageUrls,
  getGoogleFaviconUrl,
  getImportedMediaUrls,
  importedAssetSource,
} from "./media"

const maxGoogleFaviconSizeBytes = 256 * 1024

export async function replaceImportedProductLogoWithGoogleFavicon({
  importId,
  productId,
}: {
  importId: string
  productId: string
}) {
  const supabase = createAdminClient()
  const { data: importJob, error: importError } = await supabase
    .from("product_imports")
    .select("id, product_id, source_url")
    .eq("id", importId)
    .eq("product_id", productId)
    .maybeSingle()

  if (importError || !importJob) {
    return { error: importError?.message || "Imported product not found.", ok: false } as const
  }

  try {
    const uploaded = await uploadRemoteProductImage({
      imageUrl: getGoogleFaviconUrl(importJob.source_url as string),
      maxBytes: maxGoogleFaviconSizeBytes,
      productId,
      type: "logo",
    })
    const { data: existingAsset, error: existingAssetError } = await supabase
      .from("product_assets")
      .select("id, object_key")
      .eq("product_id", productId)
      .eq("type", "logo")
      .maybeSingle()

    if (existingAssetError) throw new Error(existingAssetError.message)

    const values = {
      mime_type: uploaded.mimeType,
      object_key: uploaded.objectKey,
      product_id: productId,
      public_url: uploaded.publicUrl,
      size_bytes: uploaded.sizeBytes,
      source: "admin_upload",
      type: "logo" as const,
    }
    const { error } = existingAsset
      ? await supabase.from("product_assets").update(values).eq("id", existingAsset.id)
      : await supabase.from("product_assets").insert(values)

    if (error) {
      if (existingAsset?.object_key !== uploaded.objectKey) {
        await deleteProductObject(uploaded.objectKey).catch(() => undefined)
      }
      throw new Error(error.message)
    }

    if (existingAsset?.object_key && existingAsset.object_key !== uploaded.objectKey) {
      await deleteProductObject(existingAsset.object_key).catch(() => undefined)
    }

    return { ok: true } as const
  } catch {
    console.error("Google favicon replacement failed", { importId, productId })
    return { error: "Unable to use the Google favicon.", ok: false } as const
  }
}

type ImportRow = {
  created_by_user_id: string | null
  id: string
  normalized_domain: string
  product_id: string | null
  source_url: string
}

type EvidenceRow = {
  markdown: string
  metadata: Record<string, unknown>
}

function fallbackName(domain: string) {
  return domain
    .split(".")[0]
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
}

function cleanError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500)
  }

  return "The import could not be completed."
}

async function setImportStatus(
  importId: string,
  status: ImportStatus,
  values: {
    completedAt?: string | null
    errorMessage?: string | null
    firecrawlJobId?: string | null
    productId?: string | null
  } = {}
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("product_imports")
    .update({
      completed_at: values.completedAt,
      error_message: values.errorMessage,
      firecrawl_job_id: values.firecrawlJobId,
      product_id: values.productId,
      status,
    })
    .eq("id", importId)

  if (error) {
    throw new Error(`Unable to update import status: ${error.message}`)
  }
}

async function getImport(importId: string): Promise<ImportRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_imports")
    .select("id, source_url, normalized_domain, product_id, created_by_user_id")
    .eq("id", importId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Import job not found.")
  }

  return data as ImportRow
}

async function saveEvidence(importJob: ImportRow) {
  const scraped = await scrapeWebsite(importJob.source_url)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("product_evidence")
    .upsert(
      {
        content_hash: createHash("sha256")
          .update(scraped.markdown)
          .digest("hex"),
        fetched_at: new Date().toISOString(),
        import_id: importJob.id,
        markdown: scraped.markdown,
        metadata: scraped.metadata,
        source_url: importJob.source_url,
        title: scraped.title,
      },
      { onConflict: "import_id" }
    )
    .select("markdown, metadata")
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Unable to save website evidence.")
  }

  await setImportStatus(importJob.id, "extracting", {
    firecrawlJobId: scraped.scrapeId,
  })

  return data as EvidenceRow
}

async function findCategoryId(suggestedCategory: string | null) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("categories").select("id, name")

  if (error || !data) {
    throw new Error(error?.message || "Unable to load categories.")
  }

  const categories = data as Array<{ id: string; name: string }>
  const category = categories.find(
    (item) =>
      item.name.toLowerCase() === suggestedCategory?.trim().toLowerCase()
  )
  const fallback = categories.find((item) => item.name === "Other")

  if (!category && !fallback) {
    throw new Error("The Other category is missing.")
  }

  return (category ?? fallback)!.id
}

async function getAvailableSlug(base: string) {
  const supabase = createAdminClient()
  const normalizedBase = slugify(base) || "product"

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix
      ? `${normalizedBase}-${suffix + 1}`
      : normalizedBase
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Unable to check product slug: ${error.message}`)
    }

    if (!data) {
      return candidate
    }
  }

  throw new Error("Unable to create an available product slug.")
}

async function attachImportedMedia({
  importId,
  metadata,
  productId,
  sourceUrl,
}: {
  importId: string
  metadata: Record<string, unknown>
  productId: string
  sourceUrl: string
}) {
  const warnings: string[] = []
  const mediaUrls = getImportedMediaUrls(metadata, sourceUrl)
  if (!mediaUrls.cover.length) {
    mediaUrls.cover = await getDirectCoverImageUrls(sourceUrl).catch(() => [])
  }
  const supabase = createAdminClient()

  for (const [type, imageUrls] of Object.entries(mediaUrls) as Array<
    ["logo" | "cover", string[]]
  >) {
    if (!imageUrls.length) continue

    let importError: unknown = null
    for (const imageUrl of imageUrls) {
      try {
        const { data: existingAsset, error: existingAssetError } =
          await supabase
            .from("product_assets")
            .select("id, object_key, source")
            .eq("product_id", productId)
            .eq("type", type)
            .maybeSingle()

        if (existingAssetError) {
          throw new Error(existingAssetError.message)
        }

        if (existingAsset && !canReplaceAssetFromImport(existingAsset.source)) {
          importError = null
          break
        }

        const uploaded = await uploadRemoteProductImage({
          imageUrl,
          maxBytes: imageUrl.startsWith("https://t0.gstatic.com/faviconV2?")
            ? maxGoogleFaviconSizeBytes
            : undefined,
          productId,
          type,
        })

        const existingObjectKey = existingAsset?.object_key
        const assetValues = {
          mime_type: uploaded.mimeType,
          object_key: uploaded.objectKey,
          product_id: productId,
          public_url: uploaded.publicUrl,
          size_bytes: uploaded.sizeBytes,
          source: importedAssetSource,
          type,
        }
        const { error } = existingAsset
          ? await supabase
              .from("product_assets")
              .update(assetValues)
              .eq("id", existingAsset.id)
          : await supabase.from("product_assets").insert(assetValues)

        if (error) {
          if (existingObjectKey !== uploaded.objectKey) {
            await deleteProductObject(uploaded.objectKey)
          }
          throw new Error(error.message)
        }

        if (existingObjectKey && existingObjectKey !== uploaded.objectKey) {
          await deleteProductObject(existingObjectKey).catch(() => undefined)
        }

        importError = null
        break
      } catch (error) {
        importError = error
      }
    }

    if (importError) {
      console.error("Imported product media fetch failed", {
        importId,
        productId,
        type,
      })
      warnings.push(
        `${type === "logo" ? "Logo" : "Cover"} import failed.`
      )
    }
  }

  return warnings.join(" ") || null
}

export async function runProductImportPipeline(importId: string) {
  let createdProductId: string | null = null

  try {
    const importJob = await getImport(importId)
    await setImportStatus(importId, "extracting", {
      completedAt: null,
      errorMessage: null,
    })
    const evidence = await saveEvidence(importJob)

    await setImportStatus(importId, "generating", { errorMessage: null })
    const generated = await generateProductMetadataFromEvidence({
      domain: importJob.normalized_domain,
      evidence: evidence.markdown,
    })
    const supabase = createAdminClient()
    const normalizedDomain = getNormalizedDomain(importJob.source_url)
    const { data: existingProduct, error: existingProductError } =
      await supabase
        .from("products")
        .select("id")
        .eq("normalized_domain", normalizedDomain)
        .maybeSingle()

    if (existingProductError) {
      throw new Error(
        `Unable to check existing product: ${existingProductError.message}`
      )
    }

    if (existingProduct) {
      throw new Error("A product with this website domain already exists.")
    }

    const name = generated.name.trim() || fallbackName(normalizedDomain)
    const shortDescription = generated.short_description.trim()
    const longDescription = generated.long_description.trim()
    const tagline = generated.tagline.trim()
    if (!shortDescription) {
      throw new Error("Generated short description was empty.")
    }
    if (!tagline) {
      throw new Error("Generated tagline was empty.")
    }

    const categoryId = await findCategoryId(generated.suggested_category)
    const { data: category } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", categoryId)
      .single()
    const tags = normalizeProductTags(toCanonicalProductTags(generated.tags), category, {
      generated: true,
    })
    const slug = await getAvailableSlug(name || normalizedDomain)
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        created_by_user_id: importJob.created_by_user_id,
        listing_source: "admin",
        long_description: longDescription || null,
        moderation_status: "draft",
        name,
        normalized_domain: normalizedDomain,
        short_description: shortDescription,
        slug,
        tagline,
        tags,
        website_url: importJob.source_url,
      })
      .select("id")
      .single()

    if (productError || !product) {
      throw new Error(
        productError?.message || "Unable to create imported product."
      )
    }

    createdProductId = product.id as string
    const warning = await attachImportedMedia({
      importId,
      metadata: evidence.metadata,
      productId: createdProductId,
      sourceUrl: importJob.source_url,
    })
    await setImportStatus(importId, "ready", {
      completedAt: new Date().toISOString(),
      errorMessage: warning,
      productId: createdProductId,
    })
  } catch (error) {
    if (createdProductId) {
      await createAdminClient()
        .from("products")
        .delete()
        .eq("id", createdProductId)
    }

    await setImportStatus(importId, "failed", {
      completedAt: new Date().toISOString(),
      errorMessage: cleanError(error),
    }).catch(() => undefined)
  }
}

export async function refreshEvidenceForImport(importId: string) {
  try {
    const importJob = await getImport(importId)
    await setImportStatus(importId, "extracting", {
      completedAt: null,
      errorMessage: null,
    })
    const evidence = await saveEvidence(importJob)
    const warning = importJob.product_id
      ? await attachImportedMedia({
          importId,
          metadata: evidence.metadata,
          productId: importJob.product_id,
          sourceUrl: importJob.source_url,
        })
      : null
    await setImportStatus(importId, "ready", {
      completedAt: new Date().toISOString(),
      errorMessage: warning,
      productId: importJob.product_id,
    })
  } catch (error) {
    await setImportStatus(importId, "failed", {
      completedAt: new Date().toISOString(),
      errorMessage: cleanError(error),
    }).catch(() => undefined)
  }
}

export async function regenerateProductDescription({
  field,
  importId,
  productId,
}: {
  field: "short_description" | "long_description"
  importId: string
  productId: string
}): Promise<{ error?: string; ok: boolean }> {
  try {
    const supabase = createAdminClient()
    const { data: importJob, error: importError } = await supabase
      .from("product_imports")
      .select("normalized_domain")
      .eq("id", importId)
      .eq("product_id", productId)
      .single()
    const { data: evidence, error: evidenceError } = await supabase
      .from("product_evidence")
      .select("markdown")
      .eq("import_id", importId)
      .single()

    if (importError || evidenceError || !importJob || !evidence) {
      throw new Error("Saved import evidence is unavailable.")
    }

    await setImportStatus(importId, "generating", { errorMessage: null })
    const generated = await generateProductMetadataFromEvidence({
      domain: (importJob as { normalized_domain: string }).normalized_domain,
      evidence: (evidence as { markdown: string }).markdown,
    })
    const value = generated[field].trim()

    if (!value) {
      throw new Error("Generated description was empty.")
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", productId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await setImportStatus(importId, "ready", {
      completedAt: new Date().toISOString(),
      productId,
    })
    return { ok: true }
  } catch (error) {
    const errorMessage = cleanError(error)
    await setImportStatus(importId, "failed", {
      completedAt: new Date().toISOString(),
      errorMessage,
      productId,
    }).catch(() => undefined)
    return { error: errorMessage, ok: false }
  }
}
