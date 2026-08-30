"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/supabase/auth"
import {
  deleteProductObject,
  uploadProfileImage,
  validateProductImage,
} from "@/lib/storage/r2"

import { profileSchema } from "./validation"

export type ProfileActionResult =
  | { error: string; fieldErrors?: Record<string, string[]>; ok: false }
  | { ok: true }

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null
}

export async function saveProfileAction(
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse({
    bio: formData.get("bio"),
    displayName: formData.get("display_name"),
    githubUrl: formData.get("github_url"),
    handle: formData.get("handle"),
    headline: formData.get("headline"),
    linkedinUrl: formData.get("linkedin_url"),
    location: formData.get("location"),
    role: formData.get("role"),
    websiteUrl: formData.get("website_url"),
  })

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      ok: false,
    }
  }

  const avatar = getOptionalFile(formData.get("avatar"))
  const imageError = avatar
    ? await validateProductImage(avatar, "Profile image")
    : null
  if (imageError) return { error: imageError, ok: false }

  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("avatar_object_key")
    .eq("user_id", user.id)
    .maybeSingle()
  if (existingError) return { error: existingError.message, ok: false }

  let uploadedAvatar: Awaited<ReturnType<typeof uploadProfileImage>> | null =
    null
  try {
    if (avatar) {
      uploadedAvatar = await uploadProfileImage({
        file: avatar,
        userId: user.id,
      })
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        avatar_object_key: uploadedAvatar?.objectKey,
        avatar_url: uploadedAvatar?.publicUrl,
        bio: parsed.data.bio,
        display_name: parsed.data.displayName,
        github_url: parsed.data.githubUrl,
        handle: parsed.data.handle,
        headline: parsed.data.headline,
        linkedin_url: parsed.data.linkedinUrl,
        location: parsed.data.location,
        role: parsed.data.role,
        user_id: user.id,
        website_url: parsed.data.websiteUrl,
      },
      { onConflict: "user_id" }
    )

    if (error) throw new Error(error.message)
  } catch (error) {
    if (uploadedAvatar) await deleteProductObject(uploadedAvatar.objectKey)
    return {
      error:
        error instanceof Error ? error.message : "Unable to save your profile.",
      ok: false,
    }
  }

  const previousObjectKey = existing?.avatar_object_key as string | null
  if (
    uploadedAvatar &&
    previousObjectKey &&
    previousObjectKey !== uploadedAvatar.objectKey
  ) {
    await deleteProductObject(previousObjectKey).catch(() => undefined)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/profile")
  return { ok: true }
}

export async function saveProfileSettingsAction(
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await requireUser()
  const supabase = createAdminClient()
  const { error } = await supabase.from("profiles").upsert(
    {
      email_payment_updates: formData.get("email_payment_updates") === "on",
      email_product_updates: formData.get("email_product_updates") === "on",
      profile_visible: formData.get("profile_visible") === "on",
      user_id: user.id,
    },
    { onConflict: "user_id" }
  )

  if (error) return { error: error.message, ok: false }

  revalidatePath("/dashboard/settings")
  return { ok: true }
}
