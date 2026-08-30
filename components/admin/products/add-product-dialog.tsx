"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Category } from "@/features/products/types"

import { ProductForm } from "./product-form"

export function AddProductDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add product
      </Button>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Add a curated product listing. It will stay in draft until you
            publish it.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ProductForm
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
