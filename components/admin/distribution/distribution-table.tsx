"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  RefreshCw,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DistributionSelect, displayLabel, StatusDot } from "./controls"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  bulkDistributionAction,
  verifyDistributionAction,
} from "@/features/distribution/actions"
import {
  channelStatuses,
  channelTypes,
  pricingTypes,
  type ChannelPage,
  type ChannelStatus,
  type DistributionFilters,
  type DistributionStats,
  type DistributionTag,
} from "@/features/distribution/types"
import { ChannelEditor } from "./channel-editor"
import { ChannelTableRow } from "./channel-row"
import { TagPicker } from "./tag-picker"

export function DistributionTable({
  page,
  stats,
  taxonomy,
  filters,
}: {
  page: ChannelPage
  stats: DistributionStats
  taxonomy: DistributionTag[]
  filters: DistributionFilters
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [navigating, startNavigation] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editor, setEditor] = useState<{ id: string | null } | null>(null)
  const [deleting, setDeleting] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<number | null>(null)
  const [bulkOperation, setBulkOperation] = useState("status")
  const [bulkValue, setBulkValue] = useState("active")
  const statsKey = `${stats.total}:${stats.active}:${stats.unverified}:${stats.broken}:${stats.stale}`
  const [statChanges, setStatChanges] = useState<{
    key: string
    values: Partial<Record<ChannelStatus, number>>
  }>({ key: statsKey, values: {} })
  const statDelta = statChanges.key === statsKey ? statChanges.values : {}
  const setStatDelta = (values: Partial<Record<ChannelStatus, number>>) =>
    setStatChanges({ key: statsKey, values })
  const disabled = busy || navigating
  const updateUrl = (
    changes: Record<string, string>,
    clearSelection = true
  ) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!("page" in changes)) next.set("page", "1")
    if (clearSelection) setSelected(new Set())
    setStatDelta({})
    startNavigation(() =>
      router.replace(`/admin/distribution?${next}`, { scroll: false })
    )
  }
  const onSelect = useCallback(
    (id: string, checked: boolean) =>
      setSelected((current) => {
        const next = new Set(current)
        if (checked) {
          if (next.has(id) || next.size < 500) next.add(id)
        } else next.delete(id)
        return next
      }),
    []
  )
  const onEdit = useCallback((id: string) => setEditor({ id }), [])
  const onDelete = useCallback((id: string) => setDeleting([id]), [])
  const onStatusChange = useCallback(
    (before: ChannelStatus, after: ChannelStatus) =>
      setStatChanges((previous) => {
        const current = previous.key === statsKey ? previous.values : {}
        return {
          key: statsKey,
          values: {
            ...current,
            [before]: (current[before] ?? 0) - 1,
            [after]: (current[after] ?? 0) + 1,
          },
        }
      }),
    [statsKey]
  )
  const refresh = () => {
    setStatDelta({})
    startNavigation(() => router.refresh())
  }
  async function bulk(operation: string, value: string, ids = [...selected]) {
    setBusy(true)
    setError("")
    try {
      const result = await bulkDistributionAction({ ids, operation, value })
      if (!result.ok) throw new Error(result.error)
      toast.success(
        `${result.data} channel${result.data === 1 ? "" : "s"} ${operation === "archive" ? "archived" : "updated"}`
      )
      setSelected(new Set())
      setStatDelta({})
      setDeleting(null)
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Bulk update failed; please retry."
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }
  async function verify(stale: boolean) {
    setBusy(true)
    setError("")
    setProgress(0)
    const ids = [...selected]
    let checked = 0
    let unhealthy = 0
    let failed = 0
    let claimed = 0
    const chunks = stale
      ? [[]]
      : Array.from({ length: Math.ceil(ids.length / 10) }, (_, index) =>
          ids.slice(index * 10, index * 10 + 10)
        )
    try {
      for (let index = 0; index < chunks.length; index++) {
        const result = await verifyDistributionAction(
          stale ? { stale: true } : { ids: chunks[index], stale: false }
        )
        if (!result.ok) throw new Error(result.error)
        checked += result.data.checked
        unhealthy += result.data.unhealthy
        failed += result.data.failed.length
        claimed += result.data.claimed
        setProgress(Math.round(((index + 1) / chunks.length) * 100))
      }
      const skipped = stale ? 0 : ids.length - claimed
      const message = `${checked} checked; ${unhealthy} need review${failed ? `; ${failed} could not be saved` : ""}${skipped ? `; ${skipped} busy or unavailable` : ""}.`
      if (failed || skipped) {
        setError(message)
        toast.warning(message)
      } else
        toast.success(
          checked
            ? message
            : "No stale channels available (or checks are already running)."
        )
      setStatDelta({})
    } catch (caught) {
      setError(
        `${checked} checks completed. ${caught instanceof Error ? caught.message : "Verification interrupted. Retry remaining channels."}`
      )
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }
  const allPage =
    page.rows.length > 0 && page.rows.every((row) => selected.has(row.id))
  const somePage = page.rows.some((row) => selected.has(row.id))

  const hasFilters = Boolean(
    filters.search ||
    filters.type ||
    filters.status ||
    filters.pricing ||
    filters.region
  )
  const clearFilters = () =>
    updateUrl({ search: "", type: "", status: "", pricing: "", region: "" })
  const filter = (
    name: "type" | "status" | "pricing",
    title: string,
    options: readonly string[],
    width: string
  ) => (
    <DistributionSelect
      label={"Filter by " + name}
      value={filters[name]}
      options={options}
      emptyLabel={title}
      disabled={disabled}
      onValueChange={(value) => updateUrl({ [name]: value })}
      className={width}
    />
  )
  const sort = (key: DistributionFilters["sort"], title: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8"
      disabled={disabled}
      onClick={() =>
        updateUrl(
          {
            sort: key,
            direction:
              filters.sort === key && filters.direction === "asc"
                ? "desc"
                : "asc",
          },
          false
        )
      }
    >
      {title}
      <ArrowUpDown data-icon="inline-end" />
      <span className="sr-only">
        {filters.sort === key ? filters.direction : "Sort"}
      </span>
    </Button>
  )
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Distribution Channels
            </h1>
            <span className="text-sm text-muted-foreground tabular-nums">
              {stats.total.toLocaleString()} channels
            </span>
          </div>
          <p className="-mt-1 text-sm text-muted-foreground">
            Manage discovery, submission details, verification, and evidence.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            {(["active", "unverified", "broken", "stale"] as const).map(
              (key) => (
                <span key={key} className="inline-flex items-center gap-2">
                  <StatusDot status={key} />
                  <span className="text-muted-foreground">
                    {displayLabel(key)}
                  </span>
                  <strong className="font-medium tabular-nums">
                    {stats[key] + (statDelta[key] ?? 0)}
                  </strong>
                </span>
              )
            )}
          </div>
        </header>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <form
              className="w-full sm:max-w-80"
              onSubmit={(event) => {
                event.preventDefault()
                updateUrl({
                  search: String(
                    new FormData(event.currentTarget).get("search") ?? ""
                  ),
                })
              }}
            >
              <InputGroup className="h-9 bg-background">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  key={filters.search}
                  name="search"
                  type="search"
                  defaultValue={filters.search}
                  placeholder="Search channels…"
                  aria-label="Search channels"
                  maxLength={160}
                  disabled={disabled}
                />
              </InputGroup>
            </form>
            <div className="flex shrink-0 items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9"
                    disabled={disabled}
                    onClick={() => void verify(true)}
                  >
                    <ShieldCheck data-icon="inline-start" />
                    Verify stale
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Check the next 10 channels never checked or last checked over
                  30 days ago.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9"
                    aria-label="Refresh table"
                    disabled={disabled}
                    onClick={refresh}
                  >
                    <RefreshCw
                      className={navigating ? "animate-spin" : undefined}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh channels</TooltipContent>
              </Tooltip>
              <Button
                className="ml-auto h-9"
                disabled={disabled}
                onClick={() => setEditor({ id: null })}
              >
                <Plus data-icon="inline-start" />
                Add channel
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal
              className="mr-1 hidden size-4 text-muted-foreground sm:block"
              aria-hidden
            />
            {filter("type", "All types", channelTypes, "w-36")}
            {filter("status", "All statuses", channelStatuses, "w-36")}
            {filter("pricing", "All pricing", pricingTypes, "w-32")}
            <DistributionSelect
              label="Filter by region"
              value={filters.region}
              options={taxonomy
                .filter((tag) => tag.type === "region")
                .map((tag) => tag.slug)}
              emptyLabel="All regions"
              disabled={disabled}
              onValueChange={(value) => updateUrl({ region: value })}
              className="w-36"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                className="h-9"
                disabled={disabled}
                onClick={clearFilters}
              >
                <X data-icon="inline-start" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <span className="mr-1 text-sm font-medium tabular-nums">
              {selected.size} selected
            </span>
            <Separator
              orientation="vertical"
              className="mx-1 hidden h-5 sm:block"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9" disabled={disabled}>
                  {bulkOperation === "status"
                    ? "Change status"
                    : bulkOperation === "type"
                      ? "Change type"
                      : bulkOperation === "pricing"
                        ? "Change pricing"
                        : displayLabel(bulkOperation)}
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={bulkOperation}
                  onValueChange={(value) => {
                    setBulkOperation(value)
                    setBulkValue(
                      value === "status"
                        ? "active"
                        : value === "type"
                          ? "directory"
                          : value === "pricing"
                            ? "unknown"
                            : ""
                    )
                  }}
                >
                  {["status", "type", "pricing", "add_tag", "remove_tag"].map(
                    (operation) => (
                      <DropdownMenuRadioItem key={operation} value={operation}>
                        {operation === "status"
                          ? "Change status"
                          : operation === "type"
                            ? "Change type"
                            : operation === "pricing"
                              ? "Change pricing"
                              : displayLabel(operation)}
                      </DropdownMenuRadioItem>
                    )
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {bulkOperation.endsWith("tag") ? (
              <div className="w-44">
                <TagPicker
                  id="bulk-tag"
                  label="Canonical tag"
                  single
                  disabled={disabled}
                  tags={taxonomy}
                  selected={bulkValue ? [bulkValue] : []}
                  onChange={(ids) => setBulkValue(ids[0] ?? "")}
                />
              </div>
            ) : (
              <DistributionSelect
                label="Bulk value"
                disabled={disabled}
                value={bulkValue}
                onValueChange={setBulkValue}
                className="w-36"
                status={bulkOperation === "status"}
                options={
                  bulkOperation === "status"
                    ? channelStatuses
                    : bulkOperation === "type"
                      ? channelTypes
                      : pricingTypes
                }
              />
            )}
            <Button
              variant="secondary"
              className="h-9"
              disabled={disabled || !bulkValue}
              onClick={() => void bulk(bulkOperation, bulkValue)}
            >
              Apply
            </Button>
            <Separator
              orientation="vertical"
              className="mx-1 hidden h-5 sm:block"
            />
            <Button
              variant="ghost"
              className="h-9"
              disabled={disabled}
              onClick={() => void verify(false)}
            >
              <ShieldCheck data-icon="inline-start" />
              Verify selected
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label="More bulk actions"
                  disabled={disabled}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting([...selected])}
                  >
                    <Trash2 />
                    Delete selected
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-9"
                  disabled={disabled}
                  aria-label="Clear selection"
                  onClick={() => setSelected(new Set())}
                >
                  <X />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear selection (up to 500 across pages)
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        {progress !== null && (
          <div role="status" className="flex items-center gap-3 text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>Verifying selected channels… {progress}%</span>
            <Progress value={progress} className="max-w-48" />
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription role="alert">{error}</AlertDescription>
          </Alert>
        )}
        <div
          className="overflow-hidden rounded-md border bg-background"
          aria-busy={disabled}
        >
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Select all channels on this page"
                    checked={
                      allPage ? true : somePage ? "indeterminate" : false
                    }
                    disabled={disabled || !page.rows.length}
                    onCheckedChange={(checked) =>
                      setSelected((current) => {
                        const next = new Set(current)
                        for (const row of page.rows) {
                          if (checked === true) {
                            if (next.has(row.id) || next.size < 500)
                              next.add(row.id)
                          } else next.delete(row.id)
                        }
                        return next
                      })
                    }
                  />
                </TableHead>
                <TableHead
                  className="w-56"
                  aria-sort={
                    filters.sort === "name"
                      ? filters.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {sort("name", "Name")}
                </TableHead>
                <TableHead className="w-36">Type</TableHead>
                <TableHead className="w-28">Pricing</TableHead>
                <TableHead className="w-24">Region</TableHead>
                <TableHead
                  className="w-20"
                  aria-sort={
                    filters.sort === "quality_score"
                      ? filters.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {sort("quality_score", "Quality")}
                </TableHead>
                <TableHead className="w-20 text-center">Difficulty</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead
                  className="w-24"
                  aria-sort={
                    filters.sort === "last_verified_at"
                      ? filters.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {sort("last_verified_at", "Verified")}
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.length ? (
                page.rows.map((row) => (
                  <ChannelTableRow
                    key={row.id + ":" + row.updated_at}
                    row={row}
                    selected={selected.has(row.id)}
                    disabled={disabled}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Empty className="py-16">
                      <EmptyHeader>
                        <EmptyTitle>
                          {hasFilters
                            ? "No channels match these filters"
                            : "No distribution channels yet"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {hasFilters
                            ? "Try a different search or clear your filters."
                            : "Add a channel or import a batch to start building your catalog."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <Button
                        variant="outline"
                        className="h-9"
                        onClick={
                          hasFilters
                            ? clearFilters
                            : () => setEditor({ id: null })
                        }
                      >
                        {hasFilters ? "Clear filters" : "Add channel"}
                      </Button>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p aria-live="polite">
            {navigating
              ? "Updating results…"
              : page.total
                ? (page.page - 1) * page.pageSize +
                  1 +
                  "–" +
                  Math.min(page.page * page.pageSize, page.total) +
                  " of " +
                  page.total +
                  " channels"
                : "0 channels"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DistributionSelect
              label="Rows per page"
              compact
              disabled={disabled}
              value={String(page.pageSize)}
              options={["25", "50", "100"]}
              optionLabels={{
                "25": "25 per page",
                "50": "50 per page",
                "100": "100 per page",
              }}
              className="w-32"
              onValueChange={(value) => updateUrl({ pageSize: value }, false)}
            />
            <span className="mx-2 tabular-nums">
              Page {page.page} of{" "}
              {Math.max(1, Math.ceil(page.total / page.pageSize))}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={disabled || page.page <= 1}
              onClick={() => updateUrl({ page: String(page.page - 1) }, false)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={disabled || page.page * page.pageSize >= page.total}
              onClick={() => updateUrl({ page: String(page.page + 1) }, false)}
            >
              Next
            </Button>
          </div>
        </div>
        {editor && (
          <ChannelEditor
            key={editor.id ?? "new"}
            id={editor.id}
            taxonomy={taxonomy}
            onClose={() => setEditor(null)}
          />
        )}
        <AlertDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => {
            if (!open && !busy) setDeleting(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {deleting?.length} channel
                {deleting?.length === 1 ? "" : "s"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                These channels will be archived and removed from results. Source
                evidence and verification history are preserved. Shared tags and
                datasets will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-9" disabled={busy}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="h-9"
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault()
                  if (deleting) void bulk("archive", "", deleting)
                }}
              >
                {busy && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {busy ? "Archiving…" : "Delete channels"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
