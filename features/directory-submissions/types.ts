import type { CampaignStatus, DirectoryPlan, JobStatus } from "./config"

export type Directory = {
  id: string
  name: string
  slug: string
  website_url: string
  submission_url: string | null
  description: string
  topics: string[]
  priority: number
  is_active: boolean
  requires_account: boolean | null
  requires_payment: boolean | null
  requires_manual_review: boolean
}
export type DirectoryJob = {
  id: string
  campaign_id: string
  directory_id: string
  status: JobStatus
  submitted_at: string | null
  published_at: string | null
  result_url: string | null
  rejection_reason: string | null
  action_required_message: string | null
  admin_notes?: string | null
  directories: Directory
}
export type Campaign = {
  id: string
  user_id: string
  product_id: string | null
  submission_id: string | null
  plan: DirectoryPlan
  target_count: number
  price_centavos: number
  price_paid_centavos: number
  status: CampaignStatus
  created_at: string
  products: { name: string; slug: string; website_url: string } | null
  listing_submissions: { name: string | null; website_url: string } | null
  directory_submissions: DirectoryJob[]
}
