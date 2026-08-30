"use server"

import { revalidatePath } from "next/cache"
import { invalidatePublicProducts } from "@/features/products/public-cache"
import { randomUUID } from "node:crypto"

import { extractProductMetadata } from "@/features/imports/extraction"
import {
  getNormalizedDomain,
  normalizeWebsiteUrl,
} from "@/features/products/validation"
import {
  attachQrPhPayment,
  createQrPhPayment,
  retrievePaymentIntent,
} from "@/lib/paymongo/qrph"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import {
  deleteProductObject,
  uploadRemoteSubmissionImage,
  uploadSubmissionImage,
  validateProductImage,
} from "@/lib/storage/r2"

import { listingSubmissionSchema } from "./validation"

export type SubmissionActionResult =
  | { error: string; fieldErrors?: Record<string, string[]>; ok: false }
  | { id: string; mediaWarning?: string; ok: true }

type CheckoutResult =
  | {
      amountCentavos: number
      paymentId: string
      qrExpiresAt: string
      qrImageUrl: string
      ok: true
    }
  | { error: string; ok: false }

function pesosToCentavos(value: string) {
  const amount = value.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) return null

  const [wholePesos, decimalPesos = ""] = amount.split(".")
  const whole = Number(wholePesos)
  const cents = Number(decimalPesos.padEnd(2, "0"))
  const amountCentavos = whole * 100 + cents

  return Number.isSafeInteger(amountCentavos) && amountCentavos >= 100
    ? amountCentavos
    : null
}

function hasPaymentReadyDetails(submission: {
  category_id: string | null
  name: string | null
  short_description: string | null
  tagline: string | null
}) {
  return Boolean(
    submission.category_id && submission.name && submission.short_description && submission.tagline
  )
}

function getPaymentDescription(submission: {
  id: string
  name: string | null
}) {
  return `ShipBits listing ${submission.name || submission.id}`.slice(0, 255)
}

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null
}

async function replaceSubmissionAsset({
  file,
  imageUrl,
  productId,
  submissionId,
  supabase,
  type,
}: {
  file: File | null
  imageUrl: string | null
  productId: string | null
  submissionId: string
  supabase: ReturnType<typeof createAdminClient>
  type: "logo" | "cover"
}) {
  if (!file && !imageUrl) return

  const uploaded = file
    ? await uploadSubmissionImage({ file, submissionId, type })
    : await uploadRemoteSubmissionImage({
        imageUrl: imageUrl!,
        submissionId,
        type,
      })
  const { data: existing, error: existingError } = await supabase
    .from("listing_submission_assets")
    .select("id, object_key")
    .eq("submission_id", submissionId)
    .eq("type", type)
    .maybeSingle()

  if (existingError) {
    await deleteProductObject(uploaded.objectKey)
    throw new Error(existingError.message)
  }

  const values = {
    mime_type: uploaded.mimeType,
    object_key: uploaded.objectKey,
    public_url: uploaded.publicUrl,
    size_bytes: uploaded.sizeBytes,
    submission_id: submissionId,
    type,
  }
  const { error: assetError } = existing
    ? await supabase
        .from("listing_submission_assets")
        .update(values)
        .eq("id", existing.id)
    : await supabase.from("listing_submission_assets").insert(values)

  if (assetError) {
    await deleteProductObject(uploaded.objectKey)
    throw new Error(assetError.message)
  }

  if (productId) {
    const { data: productAsset, error: productAssetError } = await supabase
      .from("product_assets")
      .select("id")
      .eq("product_id", productId)
      .eq("type", type)
      .maybeSingle()
    if (productAssetError) throw new Error(productAssetError.message)

    const productValues = {
      mime_type: uploaded.mimeType,
      object_key: uploaded.objectKey,
      product_id: productId,
      public_url: uploaded.publicUrl,
      size_bytes: uploaded.sizeBytes,
      type,
    }
    const { error: productError } = productAsset
      ? await supabase
          .from("product_assets")
          .update(productValues)
          .eq("id", productAsset.id)
      : await supabase.from("product_assets").insert(productValues)
    if (productError) throw new Error(productError.message)
  }

  if (existing?.object_key && existing.object_key !== uploaded.objectKey) {
    await deleteProductObject(existing.object_key).catch(() => undefined)
  }
}

export async function startSubmissionPaymentAction(
  submissionId: string,
  amountPesos: string
): Promise<CheckoutResult> {
  const user = await requireUser()
  const amountCentavos = pesosToCentavos(amountPesos)
  if (!amountCentavos) {
    return {
      error: "Enter an amount of at least ₱1.00 with up to two decimals.",
      ok: false,
    }
  }

  const admin = createAdminClient()
  const { data: submission, error: submissionError } = await admin
    .from("listing_submissions")
    .select(
      "id, user_id, status, name, category_id, short_description, tagline, normalized_domain, archived_at"
    )
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (submissionError || !submission) {
    return { error: "This draft is no longer available.", ok: false }
  }

  if (submission.status === "submitted") {
    return { error: "This submission has already been paid.", ok: false }
  }

  if (submission.archived_at) {
    return { error: "This listing has been archived by ShipBits.", ok: false }
  }

  if (!hasPaymentReadyDetails(submission)) {
    return {
      error:
        "Add a name, short description, and category before continuing to payment.",
      ok: false,
    }
  }

  const { data: media, error: mediaError } = await admin
    .from("listing_submission_assets")
    .select("type")
    .eq("submission_id", submission.id)
    .in("type", ["logo", "cover"])

  if (mediaError || new Set((media ?? []).map((asset) => asset.type)).size !== 2) {
    return {
      error: "Add both a logo and an OG / cover image before continuing to payment.",
      ok: false,
    }
  }

  const { data: existingProduct } = await admin
    .from("products")
    .select("id")
    .eq("normalized_domain", submission.normalized_domain)
    .maybeSingle()

  if (existingProduct) {
    return {
      error:
        "This website is already listed in ShipBits and cannot be submitted again.",
      ok: false,
    }
  }

  const { data: paidPayment, error: paidPaymentError } = await admin
    .from("listing_payments")
    .select("id")
    .eq("submission_id", submission.id)
    .eq("status", "paid")
    .maybeSingle()

  if (paidPaymentError || paidPayment) {
    return { error: "This submission has already been paid.", ok: false }
  }

  const { data: activePayment } = await admin
    .from("listing_payments")
    .select("id, provider_payment_intent_id, amount_centavos")
    .eq("submission_id", submission.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activePayment?.provider_payment_intent_id.startsWith("pi_")) {
    try {
      const intent = await retrievePaymentIntent(
        activePayment.provider_payment_intent_id
      )
      const existingQr = intent.data.attributes.next_action?.code?.image_url
      const qr = existingQr
        ? {
            paymentIntentId: activePayment.provider_payment_intent_id,
            qrExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            qrImageUrl: existingQr,
          }
        : await attachQrPhPayment({
            clientKey: intent.data.attributes.client_key,
            idempotencyKey: `listing-payment:${activePayment.id}`,
            paymentIntentId: activePayment.provider_payment_intent_id,
          })

      await admin
        .from("listing_payments")
        .update({ qr_expires_at: qr.qrExpiresAt })
        .eq("id", activePayment.id)

      return {
        amountCentavos: activePayment.amount_centavos,
        paymentId: activePayment.id,
        qrExpiresAt: qr.qrExpiresAt,
        qrImageUrl: qr.qrImageUrl,
        ok: true,
      }
    } catch {
      // The prior attempt is terminal or unusable. A fresh attempt is created below.
      await admin
        .from("listing_payments")
        .update({ status: "expired" })
        .eq("id", activePayment.id)
    }
  }

  if (activePayment) {
    await admin
      .from("listing_payments")
      .update({ status: "failed" })
      .eq("id", activePayment.id)
  }

  const paymentId = randomUUID()
  const provisionalIntentId = `pending:${paymentId}`
  const { error: pendingError } = await admin.from("listing_payments").insert({
    amount_centavos: amountCentavos,
    currency: "PHP",
    id: paymentId,
    provider_payment_intent_id: provisionalIntentId,
    status: "pending",
    submission_id: submission.id,
    user_id: user.id,
  })

  if (pendingError) {
    return { error: "Unable to begin checkout. Please try again.", ok: false }
  }

  await admin
    .from("listing_submissions")
    .update({ status: "pending_payment" })
    .eq("id", submission.id)
    .eq("user_id", user.id)

  try {
    const qr = await createQrPhPayment({
      amountCentavos,
      description: getPaymentDescription(submission),
      idempotencyKey: `listing-payment:${paymentId}`,
    })
    const { error: saveIntentError } = await admin
      .from("listing_payments")
      .update({
        provider_payment_intent_id: qr.paymentIntentId,
        qr_expires_at: qr.qrExpiresAt,
      })
      .eq("id", paymentId)

    if (saveIntentError) {
      throw new Error("Unable to store the PayMongo payment attempt.")
    }

    return {
      amountCentavos,
      paymentId,
      qrExpiresAt: qr.qrExpiresAt,
      qrImageUrl: qr.qrImageUrl,
      ok: true,
    }
  } catch (error) {
    await Promise.all([
      admin
        .from("listing_payments")
        .update({ status: "failed" })
        .eq("id", paymentId),
      admin
        .from("listing_submissions")
        .update({ status: "draft" })
        .eq("id", submission.id)
        .eq("status", "pending_payment"),
    ])

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create a QR Ph payment.",
      ok: false,
    }
  }
}

export async function getSubmissionPaymentStatusAction(paymentId: string) {
  const user = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listing_payments")
    .select("status")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data)
    return { error: "Payment status is unavailable.", ok: false as const }

  return {
    ok: true as const,
    status: data.status as "pending" | "paid" | "failed" | "expired",
  }
}

export async function autocompleteSubmissionAction(websiteUrl: string): Promise<
  | {
      data: {
        longDescription: string
        name: string
        shortDescription: string
        tagline: string
        suggestedCategory: string
        coverImageUrl: string | null
        logoImageUrl: string | null
        websiteUrl: string
      }
      ok: true
    }
  | { error: string; ok: false }
> {
  await requireUser()

  try {
    const data = await extractProductMetadata(websiteUrl)
    return {
      data: {
        longDescription: data.long_description,
        name: data.name,
        shortDescription: data.short_description,
        tagline: data.tagline,
        suggestedCategory: data.suggested_category,
        coverImageUrl: data.media.cover[0] ?? null,
        logoImageUrl: data.media.logo[0] ?? null,
        websiteUrl: data.websiteUrl,
      },
      ok: true,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Autocomplete could not extract product details.",
      ok: false,
    }
  }
}

export async function saveSubmissionDraftAction(
  submissionId: string | null,
  formData: FormData
): Promise<SubmissionActionResult> {
  const user = await requireUser()
  const parsed = listingSubmissionSchema.safeParse({
    categoryId: formData.get("category_id"),
    longDescription: formData.get("long_description"),
    name: formData.get("name"),
    shortDescription: formData.get("short_description"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    websiteUrl: formData.get("website_url"),
  })

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      ok: false,
    }
  }

  const websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl)
  const values = {
    category_id: parsed.data.categoryId,
    long_description: parsed.data.longDescription,
    name: parsed.data.name,
    normalized_domain: getNormalizedDomain(websiteUrl),
    short_description: parsed.data.shortDescription,
    slug: parsed.data.slug,
    tagline: parsed.data.tagline,
    website_url: websiteUrl,
  }
  const logo = getOptionalFile(formData.get("logo"))
  const cover = getOptionalFile(formData.get("cover"))
  const imageErrors = (
    await Promise.all([
      logo ? validateProductImage(logo, "Logo") : null,
      cover ? validateProductImage(cover, "OG / cover image") : null,
    ])
  ).filter((error): error is string => Boolean(error))
  if (imageErrors.length) return { error: imageErrors[0], ok: false }

  const supabase = createAdminClient()
  const existingSubmission = submissionId
    ? await supabase
        .from("listing_submissions")
        .select("id, product_id, status, archived_at")
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .maybeSingle()
    : null

  if (existingSubmission?.error || (submissionId && !existingSubmission?.data)) {
    return { error: "This submission is no longer available.", ok: false }
  }
  if (existingSubmission?.data?.status === "pending_payment") {
    return {
      error: "Finish or let the current payment expire before changing this listing.",
      ok: false,
    }
  }
  if (existingSubmission?.data?.archived_at) {
    return {
      error: "This listing has been archived by ShipBits and can no longer be edited.",
      ok: false,
    }
  }

  const productId = existingSubmission?.data?.product_id ?? null
  if (productId) {
    const { error: productError } = await supabase
      .from("products")
      .update({
        category_id: values.category_id,
        long_description: values.long_description,
        name: values.name,
        normalized_domain: values.normalized_domain,
        short_description: values.short_description,
        slug: values.slug,
        tagline: values.tagline,
        website_url: values.website_url,
      })
      .eq("id", productId)
      .eq("listing_source", "paid")
    if (productError) {
      return { error: "Unable to update the live listing: " + productError.message, ok: false }
    }
  }

  const result = submissionId
    ? await supabase
        .from("listing_submissions")
        .update(values)
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("listing_submissions")
        .insert({ ...values, status: "draft", user_id: user.id })
        .select("id")
        .single()

  if (result.error || !result.data) {
    return {
      error: result.error?.message || "This submission is no longer available.",
      ok: false,
    }
  }

  const savedSubmissionId = result.data.id as string
  const importedLogoUrl = String(formData.get("imported_logo_url") || "") || null
  const importedCoverUrl = String(formData.get("imported_cover_url") || "") || null
  const mediaWarnings: string[] = []
  for (const [type, file, imageUrl] of [
    ["logo", logo, logo ? null : importedLogoUrl],
    ["cover", cover, cover ? null : importedCoverUrl],
  ] as const) {
    try {
      await replaceSubmissionAsset({
        file,
        imageUrl,
        productId,
        submissionId: savedSubmissionId,
        supabase,
        type,
      })
    } catch (error) {
      mediaWarnings.push(
        `${type === "logo" ? "Logo" : "OG / cover image"} was not saved: ${error instanceof Error ? error.message : "unknown upload error"}`
      )
    }
  }

  // Older paid submissions were created as admin-review drafts. Once their owner
  // supplies both required images, bring that linked listing live as well.
  if (productId && existingSubmission?.data?.status === "submitted") {
    const { data: savedMedia } = await supabase
      .from("listing_submission_assets")
      .select("type")
      .eq("submission_id", savedSubmissionId)
      .in("type", ["logo", "cover"])
    if (new Set((savedMedia ?? []).map((asset) => asset.type)).size === 2) {
      const { error: publishError } = await supabase
        .from("products")
        .update({
          moderation_status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("moderation_status", "draft")
      if (publishError) {
        mediaWarnings.push(`Listing was updated but could not be published: ${publishError.message}`)
      }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/admin/products")
  invalidatePublicProducts()
  return {
    id: savedSubmissionId,
    mediaWarning: mediaWarnings.length ? mediaWarnings.join(" ") : undefined,
    ok: true,
  }
}
