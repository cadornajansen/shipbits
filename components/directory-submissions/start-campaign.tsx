"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { PublicSubmissionDialog } from "@/components/submissions/public-submission-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { createDirectoryCampaignAction } from "@/features/directory-submissions/actions"
import {
  directoryPlans,
  formatDirectoryPrice,
  planKeys,
  submissionDisclaimer,
  type DirectoryPlan,
} from "@/features/directory-submissions/config"
import type { Category } from "@/features/products/types"
import type { Submission } from "@/features/submissions/queries"

export function DirectorySignIn() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Sign in to submit your product
      </Button>
      <AuthDialog
        open={open}
        onOpenChange={setOpen}
        redirectPath="/dashboard/directory-submissions/new"
      />
    </>
  )
}

export function StartCampaign({
  products,
  drafts,
  categories,
  initialProduct,
  initialPlan,
}: {
  products: { id: string; name: string }[]
  drafts: Submission[]
  categories: Category[]
  initialProduct?: string
  initialPlan?: string
}) {
  const router = useRouter()
  const [source, setSource] = useState(
    initialProduct && products.some((product) => product.id === initialProduct)
      ? `product:${initialProduct}`
      : products[0]
        ? `product:${products[0].id}`
        : drafts[0]
          ? `submission:${drafts[0].id}`
          : ""
  )
  const [plan, setPlan] = useState<DirectoryPlan>(
    planKeys.includes(initialPlan as DirectoryPlan)
      ? (initialPlan as DirectoryPlan)
      : "launch"
  )
  const [open, setOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [editing, setEditing] = useState<Submission | undefined>()
  const [pending, startTransition] = useTransition()
  const selectedDraft = drafts.find(
    (draft) => source === `submission:${draft.id}`
  )
  const selectedProduct = products.find(
    (product) => source === `product:${product.id}`
  )
  const selectedName = selectedProduct?.name || selectedDraft?.name || selectedDraft?.normalizedDomain
  const selectedDetail = selectedDraft
    ? `${selectedDraft.normalizedDomain} · Draft`
    : selectedProduct
      ? "Published product"
      : "Select a product or saved draft"
  const selectedPlan = directoryPlans[plan]
  return (
    <div className="grid w-full gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
        <Link href="/dashboard/directory-submissions">
          <ArrowLeftIcon data-icon="inline-start" />
          Directory submissions
        </Link>
      </Button>
      <section>
        <p className="text-xs font-semibold tracking-wider text-teal-700 uppercase">01 Product</p>
        <h2 className="mt-1 font-outfit text-xl font-semibold">Your product</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use an existing product or prepare its profile once. A new ShipBits
          listing is included with your package.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={selectorOpen}
                className="h-auto min-h-12 w-full flex-1 justify-between px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-outfit text-xs font-semibold">
                    {(selectedName || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{selectedName || "Choose a product"}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{selectedDetail}</span>
                  </span>
                </span>
                <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Search products..." />
                <CommandList className="max-h-64 overscroll-contain">
                  <CommandEmpty>No products found.</CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => {
                      const value = `product:${product.id}`
                      return (
                        <CommandItem
                          key={value}
                          value={`${product.name} published product`}
                          data-checked={source === value || undefined}
                          onSelect={() => {
                            setSource(value)
                            setSelectorOpen(false)
                          }}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">{product.name.slice(0, 2).toUpperCase()}</span>
                          <span className="min-w-0"><span className="block truncate">{product.name}</span><span className="block text-xs text-muted-foreground">Published product</span></span>
                        </CommandItem>
                      )
                    })}
                    {drafts.map((draft) => {
                      const value = `submission:${draft.id}`
                      const name = draft.name || draft.normalizedDomain
                      return (
                        <CommandItem
                          key={value}
                          value={`${name} ${draft.normalizedDomain} draft`}
                          data-checked={source === value || undefined}
                          onSelect={() => {
                            setSource(value)
                            setSelectorOpen(false)
                          }}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">{name.slice(0, 2).toUpperCase()}</span>
                          <span className="min-w-0"><span className="block truncate">{name}</span><span className="block truncate text-xs text-muted-foreground">{draft.normalizedDomain} · Draft</span></span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add product
          </Button>
          {selectedDraft ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(selectedDraft)
                setOpen(true)
              }}
            >
              Edit draft
            </Button>
          ) : null}
        </div>
        <PublicSubmissionDialog
          categories={categories}
          open={open}
          onOpenChange={setOpen}
          submission={editing}
          onSaved={(id) => {
            setSource(`submission:${id}`)
            router.refresh()
          }}
        />
      </section>
      <Separator />
      <fieldset>
        <legend>
          <span className="block text-xs font-semibold tracking-wider text-teal-700 uppercase">02 Package</span>
          <span className="mt-1 block font-outfit text-xl font-semibold">Choose a package</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {planKeys.map((key) => {
            const item = directoryPlans[key]
            return (
              <label
                key={key}
                className={`relative mt-4 flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/30 ${plan === key ? "border-teal-600 bg-teal-50/40" : ""}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.name}</span>
                  {item.popular ? <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">Most Popular</Badge> : null}
                  <input
                    type="radio"
                    name="plan"
                    value={key}
                    checked={plan === key}
                    onChange={() => setPlan(key)}
                    className="accent-teal-700"
                  />
                </span>
                <span className="font-outfit text-2xl font-semibold">
                  {formatDirectoryPrice(item.priceCentavos)}
                  {item.priceSuffix}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.targetCount} submissions
                  {key === "done_for_you" ? " + manual handling" : ""}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <Separator />
      <section>
        <p className="text-xs font-semibold tracking-wider text-teal-700 uppercase">03 Review</p>
        <h2 className="mt-1 font-outfit text-xl font-semibold">Review</h2>
        <dl className="mt-4 grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Product</dt><dd className="font-medium text-right">{selectedName || "Not selected"}</dd>
          <dt className="text-muted-foreground">Package</dt><dd className="font-medium text-right">{selectedPlan.name}</dd>
          <dt className="text-muted-foreground">Directory submissions</dt><dd className="font-medium text-right tabular-nums">{selectedPlan.targetCount}</dd>
          <dt className="border-t pt-2 text-muted-foreground">Total</dt><dd className="border-t pt-2 font-outfit font-semibold text-right">{formatDirectoryPrice(selectedPlan.priceCentavos)}{selectedPlan.priceSuffix}</dd>
        </dl>
        <div className="mt-4 w-full border-l-2 border-muted-foreground/30 pl-3 text-xs leading-relaxed text-muted-foreground">
          <p><span className="font-medium text-foreground">Important.</span> {submissionDisclaimer} Third-party fees are not included and always require your approval.</p>
          <p className="mt-1">Done For You starts at ₱2,999; additional scope is agreed separately. Directories are assigned in batches as relevant options are verified, and unassigned slots stay visible in your tracker.</p>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" size="sm"><Link href="/dashboard/directory-submissions">View campaigns</Link></Button>
        <Button
          className="w-full sm:w-auto"
          disabled={pending || !source}
          onClick={() =>
            startTransition(async () => {
              const [sourceType, sourceId] = source.split(":")
              const result = await createDirectoryCampaignAction({
                sourceId,
                sourceType: sourceType as "product" | "submission",
                plan,
              })
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              router.push(`/dashboard/directory-submissions/${result.id}`)
            })
          }
        >
          {pending ? "Creating campaign…" : "Continue to payment"}
        </Button>
        </div>
      </section>
    </div>
  )
}
