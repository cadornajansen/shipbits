import { CampaignList } from "@/components/directory-submissions/campaign-list"
import { AdminActionForm } from "@/components/directory-submissions/admin-action-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getCampaigns } from "@/features/directory-submissions/queries"
import { addDirectoryAction } from "@/features/directory-submissions/actions"
import {
  campaignStatuses,
  statusLabels,
  type CampaignStatus,
} from "@/features/directory-submissions/config"

export default async function AdminDirectoryCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = campaignStatuses.includes(status as CampaignStatus)
    ? (status as CampaignStatus)
    : undefined
  const campaigns = await getCampaigns(true, filter)
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-outfit text-3xl font-semibold">
          Directory Submissions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manual processing · latest 100 campaigns. Submitted is not the same as
          approved.
        </p>
      </header>
      <form className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Campaign status
          <select
            name="status"
            defaultValue={filter ?? ""}
            className="h-9 rounded-md border bg-background px-3"
          >
            <option value="">All statuses</option>
            {campaignStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" type="submit">
          Filter
        </Button>
      </form>
      <CampaignList campaigns={campaigns} admin />
      <details className="rounded-xl border bg-background p-5">
        <summary className="cursor-pointer font-medium">
          Add a verified directory
        </summary>
        <div className="mt-4 max-w-xl">
          <p className="mb-4 text-sm text-muted-foreground">
            Check the real directory and its submission policy first. New
            records are manual-review candidates; fees and account requirements
            must be checked while processing.
          </p>
          <AdminActionForm action={addDirectoryAction} label="Add directory">
            <label className="grid gap-1 text-sm">
              Name
              <Input name="name" required maxLength={100} />
            </label>
            <label className="grid gap-1 text-sm">
              Slug
              <Input
                name="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={120}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Website
              <Input name="website_url" type="url" required />
            </label>
            <label className="grid gap-1 text-sm">
              Submission URL, if verified
              <Input name="submission_url" type="url" />
            </label>
            <label className="grid gap-1 text-sm">
              Topics, comma separated
              <Input name="topics" defaultValue="general" required />
            </label>
            <p className="text-xs text-muted-foreground">
              general, startup, saas, ai, developer, productivity, open_source
            </p>
          </AdminActionForm>
        </div>
      </details>
    </div>
  )
}
