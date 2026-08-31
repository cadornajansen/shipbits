import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import {
  directoryPlans,
  directoryProgress,
} from "@/features/directory-submissions/config"
import type { Campaign } from "@/features/directory-submissions/types"
import { DirectoryStatusBadge } from "./status-badge"
import { directoryDate } from "./campaign-tracker"
import { CampaignCancelDelete } from "./campaign-cancel-delete"

export function CampaignList({
  campaigns,
  admin = false,
}: {
  campaigns: Campaign[]
  admin?: boolean
}) {
  if (!campaigns.length)
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No campaigns yet. Choose a product and package to begin.
      </p>
    )
  return (
    <div className="divide-y rounded-xl border">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
        >
          <Link
            href={`${admin ? "/admin" : "/dashboard"}/directory-submissions/${campaign.id}`}
            className="min-w-0 transition-colors hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <h2 className="truncate font-medium">
              {campaign.products?.name ||
                campaign.listing_submissions?.name ||
                "Product draft"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {directoryPlans[campaign.plan].name} · {campaign.target_count}{" "}
              submissions · {directoryDate(campaign.created_at)}
            </p>
          </Link>
          <Link
            href={`${admin ? "/admin" : "/dashboard"}/directory-submissions/${campaign.id}`}
            className="text-sm tabular-nums hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            {
              directoryProgress(
                campaign.directory_submissions,
                campaign.target_count
              ).processed
            }{" "}
            / {campaign.target_count} processed
          </Link>
          <Link
            href={`${admin ? "/admin" : "/dashboard"}/directory-submissions/${campaign.id}`}
            className="focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <DirectoryStatusBadge status={campaign.status} />
          </Link>
          {campaign.products ? (
            <Link
              href={`/products/${campaign.products.slug}`}
              className="inline-flex items-center gap-1 justify-self-start text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-teal-700 sm:justify-self-end"
            >
              View product <ArrowRightIcon className="size-3.5" />
            </Link>
          ) : null}
          {!admin &&
          campaign.price_paid_centavos === 0 &&
          campaign.directory_submissions.length === 0 &&
          ["draft", "awaiting_payment", "cancelled"].includes(campaign.status) ? (
            <CampaignCancelDelete campaignId={campaign.id} />
          ) : null}
        </div>
      ))}
    </div>
  )
}
