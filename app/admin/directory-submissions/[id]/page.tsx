import { notFound } from "next/navigation"
import { CampaignTracker } from "@/components/directory-submissions/campaign-tracker"
import { getCampaign } from "@/features/directory-submissions/queries"

export default async function AdminDirectoryCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campaign = await getCampaign(id, true)
  if (!campaign) notFound()
  return <CampaignTracker campaign={campaign} admin />
}
