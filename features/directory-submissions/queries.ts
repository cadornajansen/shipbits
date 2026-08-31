import "server-only"
import { requireAdmin, requireUser } from "@/lib/supabase/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Campaign, Directory } from "./types"
import type { CampaignStatus } from "./config"

const directoryColumns =
  "id,name,slug,website_url,submission_url,description,topics,priority,is_active,requires_account,requires_payment,requires_manual_review"
const jobColumns =
  "id,campaign_id,directory_id,status,submitted_at,published_at,result_url,rejection_reason,action_required_message"
const selection = (admin: boolean): string =>
  `id,user_id,product_id,submission_id,plan,target_count,price_centavos,price_paid_centavos,status,created_at,products(name,slug,website_url),listing_submissions(name,website_url),directory_submissions(${jobColumns}${admin ? ",admin_notes" : ""},directories(${directoryColumns}))`

export async function getCampaigns(
  admin = false,
  status?: CampaignStatus
): Promise<Campaign[]> {
  const user = admin ? await requireAdmin() : await requireUser()
  let query = createAdminClient()
    .from("directory_campaigns")
    .select(selection(admin))
    .order("created_at", { ascending: false })
    .limit(100)
  if (!admin) query = query.eq("user_id", user.id)
  if (status) query = query.eq("status", status)
  const { data, error } = await query
  if (error)
    throw new Error(
      "Unable to load directory campaigns. Check that the directory migrations are applied."
    )
  return data as unknown as Campaign[]
}

export async function getCampaign(
  id: string,
  admin = false
): Promise<Campaign | null> {
  const user = admin ? await requireAdmin() : await requireUser()
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  let query = createAdminClient()
    .from("directory_campaigns")
    .select(selection(admin))
    .eq("id", id)
  if (!admin) query = query.eq("user_id", user.id)
  const { data, error } = await query.maybeSingle()
  if (error) throw new Error("Unable to load this campaign.")
  return data as unknown as Campaign | null
}

export async function getActiveDirectories(): Promise<Directory[]> {
  const { data, error } = await createAdminClient()
    .from("directories")
    .select(directoryColumns)
    .eq("is_active", true)
    .order("slug")
  if (error) throw new Error("Unable to load directory catalog.")
  return data as Directory[]
}

export async function getMatchingProfile(campaign: {
  product_id: string | null
  submission_id: string | null
}): Promise<{ category: string; tags: string[]; slug: string }> {
  const { data, error } = await createAdminClient()
    .from(campaign.product_id ? "products" : "listing_submissions")
    .select("slug,tags,categories(name)")
    .eq("id", campaign.product_id ?? campaign.submission_id!)
    .single()
  if (error) throw new Error("Product information is unavailable.")
  const category = data.categories as unknown as { name: string } | null
  return {
    category: category?.name ?? "",
    tags: (data.tags ?? []) as string[],
    slug: data.slug as string,
  }
}
