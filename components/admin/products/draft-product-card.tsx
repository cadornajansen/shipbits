"use client"

import { useState, useTransition } from "react"
import { GlobeIcon, MoreHorizontalIcon, RefreshCwIcon, RocketIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import {
  dismissImportAction,
  publishProductAction,
  refreshEvidenceAction,
  regenerateDescriptionAction,
  retryImportAction,
  applyGoogleFaviconAction,
} from "@/features/imports/actions"
import type {
  DraftBoardProduct,
  ImportQueueItem,
  ImportStatus,
  ProductMutationResult,
} from "@/features/imports/types"
import type { Category } from "@/features/products/types"

import { ProductForm } from "./product-form"

function statusVariant(status: ImportStatus | "draft") {
  if (status === "failed") return "destructive"
  if (status === "ready") return "secondary"
  return "outline"
}

function statusLabel(status: ImportStatus | "draft") {
  return status === "draft"
    ? "Draft"
    : status[0].toUpperCase() + status.slice(1)
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function useProductMutation() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function run(
    mutation: () => Promise<ProductMutationResult>,
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

  return { isPending, run }
}

export function ImportQueueCard({ item }: { item: ImportQueueItem }) {
  const { isPending, run } = useProductMutation()
  const isFailed = item.status === "failed"

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{item.domain}</p>
            <p className="truncate text-sm text-muted-foreground">
              {item.sourceUrl}
            </p>
          </div>
          <Badge variant={statusVariant(item.status)}>
            {statusLabel(item.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3 text-sm text-muted-foreground">
        {isFailed ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground">Import error</p>
            <p className="break-words">
              {item.errorMessage || "The import could not be completed."}
            </p>
          </div>
        ) : (
          "Importing website evidence..."
        )}
        <p className="mt-2">
          Queued{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(item.createdAt))}
        </p>
      </CardContent>
      {isFailed ? (
        <CardFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => retryImportAction(item.id), "Import retry queued.")
            }
          >
            {isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCwIcon data-icon="inline-start" />
            )}
            Retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              run(() => dismissImportAction(item.id), "Import dismissed.")
            }
          >
            Dismiss
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export function DraftProductCard({
  categories,
  product,
}: {
  categories: Category[]
  product: DraftBoardProduct
}) {
  const [editOpen, setEditOpen] = useState(false)
  const { isPending, run } = useProductMutation()
  const status = product.importStatus ?? "draft"

  return (
    <>
      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                {product.logoUrl ? (
                  <AvatarImage src={product.logoUrl} alt="" />
                ) : null}
                <AvatarFallback>{initials(product.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.domain}
                </p>
              </div>
            </div>
            <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-3">
          <p className="text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
          <p className="text-sm text-muted-foreground">
            {product.categoryName}
          </p>
          {product.warning ? (
            <p className="text-sm text-muted-foreground">{product.warning}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {product.importId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isPending}>
                  {isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <MoreHorizontalIcon data-icon="inline-start" />
                  )}
                  Regenerate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () =>
                          regenerateDescriptionAction({
                            field: "short_description",
                            importId: product.importId!,
                            productId: product.id,
                          }),
                        "Short description regenerated."
                      )
                    }
                  >
                    Short description
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () =>
                          regenerateDescriptionAction({
                            field: "long_description",
                            importId: product.importId!,
                            productId: product.id,
                          }),
                        "Long description regenerated."
                      )
                    }
                  >
                    Long description
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () => refreshEvidenceAction(product.importId!),
                        "Evidence refresh queued."
                      )
                    }
                  >
                    Refresh evidence
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      run(
                        () =>
                          applyGoogleFaviconAction({
                            importId: product.importId!,
                            productId: product.id,
                          }),
                        "Google favicon applied."
                      )
                    }
                  >
                    <GlobeIcon data-icon="inline-start" />
                    Use Google favicon
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            size="sm"
            disabled={isPending || (status !== "ready" && status !== "draft")}
            onClick={() =>
              run(() => publishProductAction(product.id), "Product published.")
            }
          >
            {isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RocketIcon data-icon="inline-start" />
            )}
            Publish
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit draft product</DialogTitle>
            <DialogDescription>
              Update the draft before publishing it.
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
    </>
  )
}
