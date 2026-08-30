"use client"

import { useState, useTransition } from "react"
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { refreshEvidenceAction } from "@/features/imports/actions"
import type { ProductBoardData } from "@/features/imports/types"
import {
  archiveProductAction,
  deleteProductAction,
  returnProductToDraftAction,
} from "@/features/products/actions"
import type { Category } from "@/features/products/types"

import { ProductForm } from "./product-form"

type MutationResult = { error: string; ok: false } | { ok: true }

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function PublishedProductCard({
  categories,
  product,
}: {
  categories: Category[]
  product: ProductBoardData["publishedProducts"][number]
}) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function run(
    mutation: () => Promise<MutationResult>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await mutation()
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(successMessage)
      router.refresh()
    })
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-start justify-between gap-3 px-4 pt-4 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-9">
              {product.logoUrl ? (
                <AvatarImage src={product.logoUrl} alt="" />
              ) : null}
              <AvatarFallback>{initials(product.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {product.domain}
              </p>
            </div>
          </div>
          <Badge variant="secondary">Published</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 px-4 pb-2 text-sm text-muted-foreground">
          <p className="line-clamp-2">{product.shortDescription}</p>
          <p className="text-xs">{product.categoryName}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-4 pt-0 pb-3">
          <p className="text-xs text-muted-foreground">
            {product.publishedAt
              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(product.publishedAt)
                )
              : "Published"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={isPending}
                  aria-label={`More actions for ${product.name}`}
                >
                  {isPending ? <Spinner /> : <MoreHorizontalIcon />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {product.importId ? (
                    <DropdownMenuItem
                      onSelect={() =>
                        run(
                          () => refreshEvidenceAction(product.importId!),
                          "Evidence refresh queued."
                        )
                      }
                    >
                      <RefreshCwIcon />
                      Refresh evidence
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () => returnProductToDraftAction(product.id),
                        "Product returned to drafts."
                      )
                    }
                  >
                    <RotateCcwIcon />
                    Return to draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
                    <ArchiveIcon />
                    Archive product
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <Trash2Icon />
                    Delete product
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit published product</DialogTitle>
            <DialogDescription>
              Update product details, logo, or OG / cover image without
              unpublishing it.
            </DialogDescription>
          </DialogHeader>
          {editOpen ? (
            <ProductForm
              categories={categories}
              product={product}
              onSuccess={() => setEditOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the listing from ShipBits while preserving the
              founder&apos;s submission, payment history, and managed media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() =>
                run(() => archiveProductAction(product.id), "Product archived.")
              }
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product, the linked founder
              submission, payment records, imported evidence, and managed R2
              assets. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                run(() => deleteProductAction(product.id), "Product deleted.")
              }
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
