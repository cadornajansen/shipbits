import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DirectoryStatusBadge } from "./status-badge"
import { CampaignCheckout } from "./campaign-checkout"
import { AdminActionForm } from "./admin-action-form"
import {
  assignDirectoryJobsAction,
} from "@/features/directory-submissions/actions"
import {
  directoryPlans,
  directoryProgress,
  formatDirectoryPrice,
  jobStatuses,
  statusLabels,
  submissionDisclaimer,
} from "@/features/directory-submissions/config"
import type { Campaign } from "@/features/directory-submissions/types"
import { ManageSubmissionDialog } from "./manage-submission-dialog"

export function directoryDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeZone: "Asia/Manila",
      }).format(new Date(value))
    : "—"
}

export function CampaignTracker({
  campaign,
  admin = false,
}: {
  campaign: Campaign
  admin?: boolean
}) {
  const progress = directoryProgress(
    campaign.directory_submissions,
    campaign.target_count
  )
  const paid = campaign.price_paid_centavos > 0
  const product = campaign.products ?? campaign.listing_submissions
  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link href={`${admin ? "/admin" : "/dashboard"}/directory-submissions`}>
          <ArrowLeftIcon data-icon="inline-start" />
          All directory submissions
        </Link>
      </Button>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-outfit text-2xl font-semibold tracking-tight">
            {product?.name || "Your product"}
          </h1>
          <DirectoryStatusBadge status={campaign.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
            {directoryPlans[campaign.plan].name} · {campaign.target_count}{" "}
            directories ·{" "}
            {paid
              ? formatDirectoryPrice(campaign.price_paid_centavos)
              : `${formatDirectoryPrice(campaign.price_centavos)} due`}{" "}
            · {directoryDate(campaign.created_at)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {campaign.products ? (
            <Link
              href={`/products/${campaign.products.slug}`}
              className="text-sm text-teal-700 underline underline-offset-4"
            >
              View product ↗
            </Link>
          ) : null}
          {admin && product ? (
            <a
              href={product.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Product website ↗
            </a>
          ) : null}
        </div>
      </header>
      {!admin && campaign.status === "awaiting_payment" ? (
        <CampaignCheckout
          campaignId={campaign.id}
          priceCentavos={campaign.price_centavos}
        />
      ) : null}
      <section
        className="rounded-lg border p-4"
        aria-label="Submission progress"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">
            {progress.processed} / {campaign.target_count} processed
          </h2>
          <span className="text-sm text-muted-foreground">
            {progress.percent}%
          </span>
        </div>
        <progress
          className="mt-3 h-2 w-full appearance-none overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-teal-700 [&::-moz-progress-bar]:bg-teal-700"
          value={progress.processed}
          max={campaign.target_count}
          aria-label="Submissions processed"
        />
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3">
          {jobStatuses.map((status) => (
            <div
              key={status}
              className={
                ["needs_action", "rejected", "skipped"].includes(status) &&
                progress.counts[status] === 0
                  ? "flex items-baseline gap-1 opacity-50"
                  : "flex items-baseline gap-1"
              }
            >
              <dt className="text-xs text-muted-foreground">
                {statusLabels[status]}
              </dt>
              <dd className="font-outfit text-sm font-semibold tabular-nums">
                {progress.counts[status]}
              </dd>
            </div>
          ))}
        </dl>
        {progress.unassigned ? (
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            {progress.unassigned} slots{" "}
            {paid
              ? "awaiting directory matching"
              : "will be assigned after payment"}
            . Processing and resolved entries count toward tracker progress;
            queued and skipped entries do not.
          </p>
        ) : null}
      </section>
      {admin && campaign.status === "active" && progress.unassigned > 0 ? (
        <AdminActionForm
          action={assignDirectoryJobsAction.bind(null, campaign.id)}
          label="Assign more matching directories"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-outfit text-lg font-semibold">
          Directory submissions
        </h2>
        <Button asChild size="sm" variant="ghost">
          <a
            href={`${admin ? "/admin" : "/dashboard"}/directory-submissions/${campaign.id}/report`}
          >
            <DownloadIcon data-icon="inline-start" />
            Export CSV
          </a>
        </Button>
      </div>
      {campaign.directory_submissions.length ? (
        <div className="overflow-hidden rounded-lg border">
          <div className={`hidden gap-3 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground md:grid ${admin ? "grid-cols-[minmax(0,1fr)_8.5rem_8rem_7rem_auto]" : "grid-cols-[minmax(0,1fr)_8.5rem_8rem_7rem]"}`}>
            <span>Directory</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Result</span>
            {admin ? <span className="text-right">Action</span> : null}
          </div>
          <div className="divide-y">
          {[...campaign.directory_submissions]
            .sort((a, b) =>
              a.directories.slug.localeCompare(b.directories.slug)
            )
            .map((job) => (
              <article
                key={job.id}
                className={job.status === "needs_action" ? "bg-amber-50/50 px-3 py-3" : "px-3 py-3"}
              >
                <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 md:items-center ${admin ? "md:grid-cols-[minmax(0,1fr)_8.5rem_8rem_7rem_auto]" : "md:grid-cols-[minmax(0,1fr)_8.5rem_8rem_7rem]"}`}>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{job.directories.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {job.directories.topics.join(" · ").replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="justify-self-end md:justify-self-start">
                    <DirectoryStatusBadge status={job.status} />
                  </div>
                  <div className="text-xs text-muted-foreground md:text-sm">
                    <span className="md:sr-only">Updated: </span>
                    {directoryDate(job.submitted_at)}
                  </div>
                  <div className="justify-self-end text-sm md:justify-self-start">
                    {job.result_url ? (
                      <a
                        href={job.result_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 underline underline-offset-4"
                      >
                        View <ExternalLink className="size-3" />
                      </a>
                    ) : job.status === "submitted" ? (
                      "Pending review"
                    ) : (
                      "—"
                    )}
                  </div>
                  {admin && paid ? (
                    <div className="col-span-2 justify-self-end md:col-span-1">
                      <ManageSubmissionDialog job={job} />
                    </div>
                  ) : null}
                </div>
                {job.status === "needs_action" ? (
                  <div className="mt-2 border-t border-amber-200 pt-2 text-sm text-amber-950">
                    <p className="font-medium">Action required</p>
                    <p className="mt-1 break-words whitespace-pre-wrap">
                      {job.action_required_message}
                    </p>
                    <p className="mt-1 text-xs">
                      Never share passwords or verification codes in this
                      tracker.
                    </p>
                  </div>
                ) : null}
                {job.status === "rejected" ? (
                  <p className="mt-2 border-t pt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                    {job.rejection_reason}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {paid
            ? "No eligible directories assigned yet. ShipBits will verify relevant options before processing."
            : "Your submission records will appear after confirmed payment."}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {submissionDisclaimer} Third-party fees require your approval and are
        not included in your package.
      </p>
    </div>
  )
}
