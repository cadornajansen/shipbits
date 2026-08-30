"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PublicProductForm } from "@/components/submissions/public-product-form"
import type { Category } from "@/features/products/types"
import type { Submission } from "@/features/submissions/queries"

export function PublicSubmissionDialog({
  categories,
  onOpenChange,
  open,
  submission,
  websiteUrl = "",
}: {
  categories: Category[]
  onOpenChange: (open: boolean) => void
  open: boolean
  submission?: Submission
  websiteUrl?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(42rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle>
            {submission ? "Edit your listing" : "Submit your product"}
          </DialogTitle>
          <DialogDescription>
            {submission?.status === "submitted"
              ? "Changes update your live ShipBits listing."
              : "Save your details and media before continuing to payment."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <PublicProductForm
            key={`${submission?.id ?? "new"}:${websiteUrl}`}
            categories={categories}
            initialWebsiteUrl={websiteUrl}
            submission={submission}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
