"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin, requireUser } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { logServerError } from "@/lib/observability/logger"
import { createQrPhPayment, retrievePaymentIntent } from "@/lib/paymongo/qrph"
import { consumeRateLimit } from "@/lib/security/rate-limit"
import { directoryPlans, jobStatuses, planKeys } from "./config"
import {
  getActiveDirectories,
  getCampaign,
  getMatchingProfile,
} from "./queries"
import { matchDirectories } from "./matching"
import { confirmDirectoryPayment } from "./payments"

const uuid = z.uuid()
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      )
    } catch {
      return false
    }
  }, "Use a valid http or https URL.")
  .transform((value) => value || null)

export async function createDirectoryCampaignAction(input: {
  sourceId: string
  sourceType: "product" | "submission"
  plan: string
}) {
  const user = await requireUser()
  const rateLimit = await consumeRateLimit({ action: "directory-campaign", userId: user.id })
  if (!rateLimit.allowed)
    return { ok: false as const, error: "Too many campaign attempts. Please try again later." }
  const parsed = z
    .object({
      sourceId: uuid,
      sourceType: z.enum(["product", "submission"]),
      plan: z.enum(planKeys),
    })
    .safeParse(input)
  if (!parsed.success)
    return { ok: false as const, error: "Choose your product and package." }
  const { sourceId, sourceType, plan } = parsed.data
  const db = createAdminClient()
  if (sourceType === "product") {
    const { data, error } = await db
      .from("product_builders")
      .select("product_id,products!inner(archived_at)")
      .eq("product_id", sourceId)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .is("products.archived_at", null)
      .maybeSingle()
    if (error || !data)
      return { ok: false as const, error: "Choose a product you own." }
  } else {
    const { data, error } = await db
      .from("listing_submissions")
      .select(
        "id,name,short_description,tagline,category_id,product_id,normalized_domain,listing_submission_assets(type)"
      )
      .eq("id", sourceId)
      .eq("user_id", user.id)
      .is("archived_at", null)
      .single()
    if (
      error ||
      data.product_id ||
      !data.name ||
      !data.short_description ||
      !data.tagline ||
      !data.category_id ||
      new Set(data.listing_submission_assets.map((asset) => asset.type)).size <
        2
    )
      return {
        ok: false as const,
        error:
          "Finish your product details, logo, and cover before choosing a package.",
      }
    const { data: duplicate } = await db
      .from("products")
      .select("id")
      .eq("normalized_domain", data.normalized_domain)
      .maybeSingle()
    if (duplicate)
      return {
        ok: false as const,
        error:
          "This website is already listed. Select your existing product instead.",
      }
  }
  const column = sourceType === "product" ? "product_id" : "submission_id"
  const { data: existing } = await db
    .from("directory_campaigns")
    .select("id,plan")
    .eq("user_id", user.id)
    .eq(column, sourceId)
    .eq("status", "awaiting_payment")
    .maybeSingle()
  const config = directoryPlans[plan]
  if (existing) {
    if (existing.plan !== plan) {
      const { error } = await db.rpc("change_directory_campaign_plan", {
        p_campaign_id: existing.id,
        p_user_id: user.id,
        p_plan: plan,
        p_target: config.targetCount,
        p_price: config.priceCentavos,
      })
      if (error)
        return {
          ok: false as const,
          error:
            "Checkout has already started for this campaign. Open it from Directory Submissions to continue with its original package.",
        }
      revalidatePath("/dashboard/directory-submissions", "layout")
    }
    return { ok: true as const, id: existing.id as string }
  }
  const { data, error } = await db
    .from("directory_campaigns")
    .insert({
      user_id: user.id,
      [column]: sourceId,
      plan,
      target_count: config.targetCount,
      price_centavos: config.priceCentavos,
    })
    .select("id")
    .single()
  if (error)
    return {
      ok: false as const,
      error:
        "Unable to create the campaign. Check your campaigns before trying again.",
    }
  revalidatePath("/dashboard/directory-submissions")
  return { ok: true as const, id: data.id as string }
}

export async function cancelAndDeleteDirectoryCampaignAction(campaignId: string) {
  const user = await requireUser()
  const parsed = uuid.safeParse(campaignId)
  if (!parsed.success)
    return { ok: false as const, error: "Campaign not found." }

  const db = createAdminClient()
  const { data: payments, error: paymentError } = await db
    .from("listing_payments")
    .select("id,status,provider_payment_intent_id,qr_expires_at")
    .eq("campaign_id", parsed.data)
  if (paymentError)
    return { ok: false as const, error: "Unable to check the QR payment." }

  for (const payment of payments ?? []) {
    if (payment.status === "paid")
      return {
        ok: false as const,
        error: "This campaign has already been paid and cannot be deleted.",
      }
    if (payment.status !== "pending") continue
    if (!payment.provider_payment_intent_id.startsWith("pi_"))
      return {
        ok: false as const,
        error: "Checkout is still being prepared. Refresh and try again.",
      }

    const intent = await retrievePaymentIntent(payment.provider_payment_intent_id)
    if (intent.data.attributes.status === "succeeded")
      return {
        ok: false as const,
        error: "This QR was paid and cannot be deleted.",
      }
    if (
      !payment.qr_expires_at ||
      Date.parse(payment.qr_expires_at) > Date.now()
    )
      return {
        ok: false as const,
        error:
          "Your old QR is still active. Do not scan it; you can delete this campaign after it expires.",
      }

    const { error: expireError } = await db
      .from("listing_payments")
      .update({ status: "expired" })
      .eq("id", payment.id)
      .eq("status", "pending")
    if (expireError)
      return { ok: false as const, error: "Unable to expire the old QR." }
  }

  const { error } = await db.rpc(
    "cancel_and_delete_directory_campaign",
    {
      p_campaign_id: parsed.data,
      p_user_id: user.id,
    }
  )
  if (error)
    return {
      ok: false as const,
      error:
        "This campaign can no longer be deleted because payment or processing has started.",
    }

  revalidatePath("/dashboard/directory-submissions", "layout")
  return { ok: true as const }
}

export async function startDirectoryPaymentAction(campaignId: string) {
  const campaign = await getCampaign(campaignId)
  if (!campaign || campaign.status !== "awaiting_payment")
    return {
      ok: false as const,
      error: "This campaign is not awaiting payment.",
    }
  const rateLimit = await consumeRateLimit({ action: "directory-payment", userId: campaign.user_id })
  if (!rateLimit.allowed)
    return { ok: false as const, error: "Too many payment attempts. Please try again later." }
  const db = createAdminClient()
  try {
    const lookup = await db
      .from("listing_payments")
      .select("id,provider_payment_intent_id,qr_expires_at")
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .maybeSingle()
    if (lookup.error) throw lookup.error
    let payment = lookup.data
    if (!payment) {
      const id = randomUUID()
      const inserted = await db
        .from("listing_payments")
        .insert({
          id,
          campaign_id: campaignId,
          user_id: campaign.user_id,
          amount_centavos: campaign.price_centavos,
          provider_payment_intent_id: `pending:${id}`,
        })
        .select("id,provider_payment_intent_id,qr_expires_at")
        .single()
      if (inserted.error)
        throw new Error(
          "Checkout is already being prepared or a listing payment is pending. Refresh and try again."
        )
      payment = inserted.data
    }
    if (payment.provider_payment_intent_id.startsWith("pi_")) {
      if (await confirmDirectoryPayment(payment.id))
        return { ok: true as const, paid: true as const }
      const intent = await retrievePaymentIntent(
        payment.provider_payment_intent_id
      )
      const qrImageUrl = intent.data.attributes.next_action?.code?.image_url
      if (
        !qrImageUrl ||
        (payment.qr_expires_at &&
          Date.parse(payment.qr_expires_at) <= Date.now())
      )
        throw new Error(
          "This QR has expired or is processing. Refresh payment status; a new QR is available after PayMongo confirms expiry."
        )
      return {
        ok: true as const,
        paid: false as const,
        qrImageUrl,
        expiresAt: payment.qr_expires_at as string,
      }
    }
    // Keep uncertain requests pending. Retrying the same provider idempotency key
    // recovers the original intent instead of risking a second charge.
    const qr = await createQrPhPayment({
      amountCentavos: campaign.price_centavos,
      description: `ShipBits directory campaign ${campaign.id} (${campaign.plan})`,
      idempotencyKey: `directory-campaign:${payment.id}`,
      metadata: {
        campaign_id: campaign.id,
        product_id: campaign.product_id ?? "",
        submission_id: campaign.submission_id ?? "",
        plan: campaign.plan,
      },
    })
    const saved = await db
      .from("listing_payments")
      .update({
        provider_payment_intent_id: qr.paymentIntentId,
        qr_expires_at: qr.qrExpiresAt,
      })
      .eq("id", payment.id)
      .eq("status", "pending")
    if (saved.error) throw saved.error
    return {
      ok: true as const,
      paid: false as const,
      qrImageUrl: qr.qrImageUrl,
      expiresAt: qr.qrExpiresAt,
    }
  } catch (error) {
    logServerError("directory_checkout_failed", {
      campaignId,
      error: error instanceof Error ? error.message : "Unknown error",
      userId: campaign.user_id,
    })
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to prepare checkout. Please retry.",
    }
  }
}

export async function getDirectoryPaymentStatusAction(campaignId: string) {
  const campaign = await getCampaign(campaignId)
  if (!campaign) return { ok: false as const, error: "Campaign not found." }
  if (campaign.price_paid_centavos > 0)
    return { ok: true as const, status: "paid" }
  const { data, error } = await createAdminClient()
    .from("listing_payments")
    .select("id,status")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { ok: false as const, error: "Payment status unavailable." }
  try {
    if (data?.status === "pending" && (await confirmDirectoryPayment(data.id)))
      return { ok: true as const, status: "paid" }
  } catch {
    return {
      ok: false as const,
      error:
        "Payment confirmation is temporarily unavailable. Do not pay again; refresh shortly.",
    }
  }
  return { ok: true as const, status: (data?.status ?? "unpaid") as string }
}

export async function updateDirectoryJobAction(formData: FormData) {
  await requireAdmin()
  const parsed = z
    .object({
      id: uuid,
      status: z.enum(jobStatuses),
      result_url: safeUrl,
      rejection_reason: optionalText(2000),
      action_required_message: optionalText(2000),
      admin_notes: optionalText(5000),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message }
  const job = parsed.data
  if (job.status === "live" && !job.result_url)
    return { ok: false, error: "Live submissions need a result URL." }
  if (job.status === "rejected" && !job.rejection_reason)
    return { ok: false, error: "Provide the rejection reason." }
  if (job.status === "needs_action" && !job.action_required_message)
    return { ok: false, error: "Describe what the founder needs to do." }
  const { error } = await createAdminClient().rpc(
    "update_directory_submission",
    {
      p_job_id: job.id,
      p_status: job.status,
      p_result_url: job.result_url,
      p_rejection_reason: job.rejection_reason,
      p_action_message: job.action_required_message,
      p_admin_notes: job.admin_notes,
    }
  )
  if (error)
    return {
      ok: false,
      error: "Unable to update submission. Ensure the campaign is paid.",
    }
  revalidatePath("/admin/directory-submissions", "layout")
  revalidatePath("/dashboard/directory-submissions", "layout")
  return { ok: true }
}

export async function assignDirectoryJobsAction(campaignId: string) {
  const campaign = await getCampaign(campaignId, true)
  if (!campaign || campaign.status !== "active")
    return { ok: false, error: "Choose an active, paid campaign." }
  const profile = await getMatchingProfile(campaign)
  const matches = matchDirectories(
    await getActiveDirectories(),
    profile.category,
    profile.tags,
    campaign.target_count - campaign.directory_submissions.length,
    campaign.directory_submissions.map((job) => job.directory_id)
  )
  if (!matches.length)
    return {
      ok: false,
      error:
        "No more eligible unassigned directories. Add verified directories to the catalog first.",
    }
  const { error } = await createAdminClient()
    .from("directory_submissions")
    .upsert(
      matches.map((directory) => ({
        campaign_id: campaignId,
        directory_id: directory.id,
      })),
      { onConflict: "campaign_id,directory_id", ignoreDuplicates: true }
    )
  if (error)
    return {
      ok: false,
      error: "Assignment changed concurrently. Refresh before trying again.",
    }
  revalidatePath("/admin/directory-submissions", "layout")
  revalidatePath("/dashboard/directory-submissions", "layout")
  return { ok: true }
}

export async function addDirectoryAction(formData: FormData) {
  await requireAdmin()
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(100),
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .max(120),
      website_url: safeUrl,
      submission_url: safeUrl,
      topics: z.string().max(200),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success || !parsed.data.website_url)
    return {
      ok: false,
      error: "Provide a name, clean slug, and valid website URL.",
    }
  const { topics, ...data } = parsed.data
  const allowedTopics = [
    "general",
    "startup",
    "saas",
    "ai",
    "developer",
    "productivity",
    "open_source",
  ]
  const values = [
    ...new Set(
      topics
        .split(",")
        .map((topic) => topic.trim())
        .filter((topic) => allowedTopics.includes(topic))
    ),
  ]
  if (!values.length)
    return { ok: false, error: "Choose at least one supported topic." }
  const { error } = await createAdminClient()
    .from("directories")
    .insert({ ...data, topics: values })
  if (error)
    return {
      ok: false,
      error: "Unable to add directory. Its name or slug may already exist.",
    }
  revalidatePath("/admin/directory-submissions")
  return { ok: true }
}
