"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { PublicSubmissionDialog } from "@/components/submissions/public-submission-dialog"
import { Button } from "@/components/ui/button"
import type { Category } from "@/features/products/types"

export function AddProductButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add product
      </Button>
      <PublicSubmissionDialog
        categories={categories}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
