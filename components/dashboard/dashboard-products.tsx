"use client"

import { ExternalLinkIcon, PencilIcon } from "lucide-react"
import { useState } from "react"

import { PublicSubmissionDialog } from "@/components/submissions/public-submission-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { OwnedProduct } from "@/features/dashboard/queries"
import type { Category } from "@/features/products/types"
import type { Submission } from "@/features/submissions/queries"

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(updatedAt)
  )
}

export function DashboardProducts({
  categories,
  products,
  submissions,
}: {
  categories: Category[]
  products: OwnedProduct[]
  submissions: Submission[]
}) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const submissionsByProduct = new Map(
    submissions
      .filter((submission) => submission.productId)
      .map((submission) => [submission.productId, submission])
  )

  if (!products.length) return null

  return (
    <>
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-outfit text-xl font-semibold">My products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Listings connected to your ShipBits account.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {products.length}
          </span>
        </div>
        <div className="mt-4 divide-y rounded-xl border">
          {products.map((product) => {
            const submission = submissionsByProduct.get(product.id) ?? null
            return (
              <article
                key={product.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <Avatar className="size-11 shrink-0 rounded-md">
                  {product.logoUrl ? (
                    <AvatarImage
                      className="rounded-none object-contain"
                      src={product.logoUrl}
                      alt=""
                    />
                  ) : null}
                  <AvatarFallback className="rounded-md text-xs">
                    {initials(product.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-medium">{product.name}</h3>
                    <Badge variant="secondary">{product.categoryName}</Badge>
                    <Badge variant="outline">
                      {product.moderationStatus === "published"
                        ? "Published"
                        : product.moderationStatus === "rejected"
                          ? "Rejected"
                          : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {product.tagline}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ₱{product.upvoteValuePesos.toLocaleString("en-PH")} support
                    · Updated {formatUpdatedAt(product.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {submission ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={product.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit
                      <ExternalLinkIcon data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
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
    </>
  )
}
