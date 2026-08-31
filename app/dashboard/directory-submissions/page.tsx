import Link from "next/link"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CampaignList } from "@/components/directory-submissions/campaign-list"
import { Button } from "@/components/ui/button"
import { getCampaigns } from "@/features/directory-submissions/queries"

export default async function DirectoryCampaignsPage() {
  const campaigns = await getCampaigns()
  return (
    <DashboardShell
      active="directory-submissions"
      title="Directory submissions"
      description="Track active campaigns, progress, and anything that needs your attention."
      action={
        <Button asChild size="sm">
          <Link href="/dashboard/directory-submissions/new">
            Submit to directories
          </Link>
        </Button>
      }
    >
      <CampaignList campaigns={campaigns} />
    </DashboardShell>
  )
}
