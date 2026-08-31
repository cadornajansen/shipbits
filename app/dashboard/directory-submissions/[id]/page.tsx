import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CampaignTracker } from "@/components/directory-submissions/campaign-tracker"
import { getCampaign } from "@/features/directory-submissions/queries"

export default async function DirectoryCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) notFound()
  return (
    <DashboardShell
      active="directory-submissions"
      title="Directory submissions"
      description="Track your campaign progress and anything that needs attention."
    >
      <CampaignTracker campaign={campaign} />
    </DashboardShell>
  )
}
