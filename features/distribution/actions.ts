"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { logServerError } from "@/lib/observability/logger"
import { normalizeUrl } from "./normalization"
import { bulkSchema, quickSchema, saveSchema, verifySchema } from "./validation"
import { checkDatabaseError, getChannelDetail } from "./repository"
import { verifyChannels, type VerificationSummary } from "./verification"
import type { ActionResult, ChannelDetail, Channel } from "./types"

function failure(error: unknown): { ok: false; error: string } {
  if (error instanceof z.ZodError)
    return {
      ok: false,
      error: error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    }
  const message = error instanceof Error ? error.message : "Unknown error"
  logServerError("distribution_mutation_failed", { message })
  if (/duplicate key/.test(message))
    return {
      ok: false,
      error:
        "This website or slug already exists, possibly in the archive. Edit the existing channel or use a different slug.",
    }
  if (/Channel changed|Selection changed|Channel not found/.test(message))
    return { ok: false, error: message }
  return {
    ok: false,
    error: "Unable to save this change. Please retry or refresh the page.",
  }
}

export async function loadDistributionChannelAction(
  id: string
): Promise<ActionResult<ChannelDetail>> {
  await requireAdmin()
  try {
    return {
      ok: true,
      data: await getChannelDetail(createAdminClient(), z.uuid().parse(id)),
    }
  } catch (error) {
    return failure(error)
  }
}

export async function saveDistributionChannelAction(
  input: unknown
): Promise<ActionResult<string>> {
  await requireAdmin()
  try {
    const admin = await requireAdmin()
    const value = saveSchema.parse(input)
    const { data, error } = await createAdminClient().rpc("distribution_save", {
      p_id: value.id,
      p_data: {
        ...value.channel,
        canonical_url: normalizeUrl(value.channel.website_url).canonical,
      },
      p_tags: value.tags,
      p_expected: value.expectedUpdatedAt,
      p_actor: admin.id,
    })
    checkDatabaseError(error)
    revalidatePath("/admin/distribution")
    return { ok: true, data: (data as { id: string }).id }
  } catch (error) {
    return failure(error)
  }
}

export async function quickEditDistributionChannelAction(
  input: unknown
): Promise<ActionResult<Pick<Channel, "updated_at">>> {
  const admin = await requireAdmin()
  try {
    const value = quickSchema.parse(input)
    const db = createAdminClient()
    const saved = await db.rpc("distribution_save", {
      p_id: value.id,
      p_data: value.patch,
      p_tags: null,
      p_expected: value.expectedUpdatedAt,
      p_actor: admin.id,
    })
    checkDatabaseError(saved.error)
    // Keep inline edits local; a full table revalidation would disrupt editing.
    return { ok: true, data: saved.data as Pick<Channel, "updated_at"> }
  } catch (error) {
    return failure(error)
  }
}

export async function bulkDistributionAction(
  input: unknown
): Promise<ActionResult<number>> {
  const admin = await requireAdmin()
  try {
    const value = bulkSchema.parse(input)
    const { data, error } = await createAdminClient().rpc("distribution_bulk", {
      p_ids: value.ids,
      p_operation: value.operation,
      p_value: value.value,
      p_actor: admin.id,
    })
    checkDatabaseError(error)
    revalidatePath("/admin/distribution")
    return { ok: true, data: data as number }
  } catch (error) {
    return failure(error)
  }
}

export async function verifyDistributionAction(
  input: unknown
): Promise<ActionResult<VerificationSummary>> {
  const admin = await requireAdmin()
  try {
    const value = verifySchema.parse(input)
    const data = await verifyChannels(createAdminClient(), value, admin.id)
    revalidatePath("/admin/distribution")
    return { ok: true, data }
  } catch (error) {
    return failure(error)
  }
}
