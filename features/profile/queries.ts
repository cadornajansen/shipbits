import "server-only"

import { createClient } from "@/lib/supabase/server"

export type UserProfile = {
  avatarObjectKey: string | null
  avatarUrl: string | null
  bio: string | null
  displayName: string | null
  emailPaymentUpdates: boolean
  emailProductUpdates: boolean
  githubUrl: string | null
  handle: string | null
  headline: string | null
  linkedinUrl: string | null
  location: string | null
  profileVisible: boolean
  role: string | null
  websiteUrl: string | null
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "display_name, handle, headline, role, bio, location, website_url, github_url, linkedin_url, avatar_object_key, avatar_url, profile_visible, email_product_updates, email_payment_updates"
    )
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load your profile: ${error.message}`)
  }

  if (!data) return null

  return {
    avatarObjectKey: data.avatar_object_key as string | null,
    avatarUrl: data.avatar_url as string | null,
    bio: data.bio as string | null,
    displayName: data.display_name as string | null,
    emailPaymentUpdates: Boolean(data.email_payment_updates),
    emailProductUpdates: Boolean(data.email_product_updates),
    githubUrl: data.github_url as string | null,
    handle: data.handle as string | null,
    headline: data.headline as string | null,
    linkedinUrl: data.linkedin_url as string | null,
    location: data.location as string | null,
    profileVisible: Boolean(data.profile_visible),
    role: data.role as string | null,
    websiteUrl: data.website_url as string | null,
  }
}
