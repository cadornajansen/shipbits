"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaymentDialog } from "@/components/submissions/payment-dialog"
import { PublicSubmissionDialog } from "@/components/submissions/public-submission-dialog"
import type { Category } from "@/features/products/types"
import type { Submission } from "@/features/submissions/queries"

const statusLabel: Record<Submission["status"], string> = {
  draft: "Draft",
  pending_payment: "Pending payment",
  submitted: "Published",
}

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(updatedAt)
  )
}

export function DashboardSubmissions({
  categories,
  submissions,
}: {
  categories: Category[]
  submissions: Submission[]
}) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [paymentSubmission, setPaymentSubmission] = useState<Submission | null>(
    null
  )

  return (
    <>
      <div className="grid gap-3">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className="rounded-xl border bg-card p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate font-medium">
                  {submission.name || submission.normalizedDomain}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {submission.normalizedDomain}
                </p>
              </div>
              <Badge variant="secondary">
                {submission.archivedAt
                  ? "Archived"
                  : statusLabel[submission.status]}
              </Badge>
            </div>
            {submission.shortDescription ? (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {submission.shortDescription}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{submission.categoryName ?? "Uncategorized"}</span>
              <span>Updated {formatUpdatedAt(submission.updatedAt)}</span>
            </div>
            {submission.archivedAt ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Archived by ShipBits
              </p>
            ) : submission.status === "submitted" ? (
              <p className="mt-3 text-sm font-medium">Paid · Published</p>
            ) : null}
            {!submission.archivedAt &&
            (submission.status === "draft" || submission.status === "submitted") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
                {submission.status === "draft" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPaymentSubmission(submission)}
                    disabled={!submission.logoUrl || !submission.coverUrl}
                  >
                    Continue to payment
                  </Button>
                ) : null}
              </div>
            ) : submission.status === "pending_payment" ? (
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPaymentSubmission(submission)}
                >
                  Resume payment
                </Button>
              </div>
            ) : null}
            {!submission.archivedAt &&
            submission.status === "draft" &&
            (!submission.logoUrl || !submission.coverUrl) ? (
              <p className="mt-3 text-xs text-muted-foreground">
                A logo and OG / cover image are required before payment.
              </p>
            ) : null}
          </article>
        ))}
      </div>
      {selectedSubmission ? (
        <PublicSubmissionDialog
          categories={categories}
          open={Boolean(selectedSubmission)}
          onOpenChange={(open) => {
            if (!open) setSelectedSubmission(null)
          }}
          submission={selectedSubmission}
          websiteUrl={selectedSubmission.websiteUrl}
        />
      ) : null}
      {paymentSubmission ? (
        <PaymentDialog
          open={Boolean(paymentSubmission)}
          onOpenChange={(open) => {
            if (!open) setPaymentSubmission(null)
          }}
          submission={paymentSubmission}
        />
      ) : null}
    </>
  )
}
