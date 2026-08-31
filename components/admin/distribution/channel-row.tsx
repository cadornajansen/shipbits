"use client"

import { memo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  MoreHorizontal,
  Pencil,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  loadDistributionChannelAction,
  quickEditDistributionChannelAction,
  verifyDistributionAction,
} from "@/features/distribution/actions"
import {
  channelStatuses,
  channelTypes,
  pricingTypes,
  type ChannelRow as Row,
  type ChannelStatus,
} from "@/features/distribution/types"
import { DistributionSelect, displayLabel } from "./controls"

type QuickField = "status" | "channel_type" | "pricing_type" | "quality_score"
export const ChannelTableRow = memo(function ChannelTableRow({
  row,
  selected,
  disabled,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  row: Row
  selected: boolean
  disabled: boolean
  onSelect: (id: string, selected: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (before: ChannelStatus, after: ChannelStatus) => void
}) {
  const [current, setCurrent] = useState(row)
  const [quality, setQuality] = useState(String(row.quality_score ?? ""))
  const [saving, setSaving] = useState<QuickField | "verification" | null>(null)
  const [feedback, setFeedback] = useState("")
  const [submission, setSubmission] = useState<string | null | undefined>(
    undefined
  )
  const skipBlurSave = useRef(false)
  async function save(field: QuickField, value: string | number | null) {
    if (saving || current[field] === value) return
    const previous = current
    setCurrent({ ...current, [field]: value })
    setSaving(field)
    setFeedback("Saving…")
    try {
      const result = await quickEditDistributionChannelAction({
        id: row.id,
        expectedUpdatedAt: current.updated_at,
        patch: { [field]: value },
      })
      if (!result.ok) throw new Error(result.error)
      setCurrent((record) => ({
        ...record,
        updated_at: result.data.updated_at,
      }))
      setFeedback("Saved")
      if (field === "status")
        onStatusChange(previous.status, value as ChannelStatus)
      toast.success(displayLabel(field) + " saved")
    } catch (error) {
      setCurrent(previous)
      setQuality(String(previous.quality_score ?? ""))
      setFeedback("Not saved")
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save; previous value restored."
      )
    } finally {
      setSaving(null)
    }
  }
  async function verify() {
    setSaving("verification")
    try {
      const result = await verifyDistributionAction({
        ids: [row.id],
        stale: false,
      })
      if (!result.ok) throw new Error(result.error)
      if (result.data.failed.length || !result.data.checked)
        toast.warning(
          "Check unavailable. A verification may already be running."
        )
      else
        toast.success(
          result.data.unhealthy
            ? "Check completed — review the results in the editor."
            : "Channel check completed."
        )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed."
      )
    } finally {
      setSaving(null)
    }
  }
  const inactive = disabled || Boolean(saving)
  const stop = {
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onKeyDown: (event: React.KeyboardEvent) => event.stopPropagation(),
  }
  const select = (
    field: "status" | "channel_type" | "pricing_type",
    values: readonly string[]
  ) => (
    <DistributionSelect
      compact
      quiet
      label={row.name + ": " + displayLabel(field)}
      value={current[field] ?? ""}
      emptyLabel={field === "channel_type" ? "Unknown" : undefined}
      options={values}
      disabled={inactive}
      status={field === "status"}
      onValueChange={(value) => void save(field, value || null)}
      className={
        field === "channel_type" ? "w-36" : field === "status" ? "w-32" : "w-28"
      }
    />
  )
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="group h-14 cursor-pointer transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/70"
      onClick={() => {
        if (!inactive) onEdit(row.id)
      }}
    >
      <TableCell className="w-10 pl-4" {...stop}>
        <Checkbox
          aria-label={"Select " + row.name}
          checked={selected}
          disabled={inactive}
          onCheckedChange={(checked) => onSelect(row.id, checked === true)}
        />
      </TableCell>
      <TableCell className="w-56 max-w-56 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="block max-w-full cursor-pointer truncate text-left text-sm font-medium focus-visible:outline-ring"
              disabled={inactive}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(row.id)
              }}
            >
              {row.name}
            </button>
          </TooltipTrigger>
          <TooltipContent>{row.name}</TooltipContent>
        </Tooltip>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {new URL(row.website_url).hostname.replace(/^www\./, "")}
          {row.source_count > 0 &&
            " · " +
              row.source_count +
              " source" +
              (row.source_count === 1 ? "" : "s")}
        </span>
        <span className="sr-only" role="status">
          {feedback}
        </span>
      </TableCell>
      <TableCell className="px-1" {...stop}>
        {select("channel_type", channelTypes)}
      </TableCell>
      <TableCell className="px-1" {...stop}>
        {select("pricing_type", pricingTypes)}
      </TableCell>
      <TableCell className="max-w-28 truncate text-xs text-muted-foreground">
        {row.regions.join(", ") || "—"}
      </TableCell>
      <TableCell className="px-1" {...stop}>
        <Input
          className="h-8 w-16 border-transparent bg-transparent text-center shadow-none hover:border-input focus-visible:border-ring"
          type="number"
          min={0}
          max={100}
          step={1}
          placeholder="—"
          value={quality}
          disabled={inactive}
          aria-label={row.name + ": quality score"}
          onChange={(event) => setQuality(event.target.value)}
          onBlur={() => {
            if (skipBlurSave.current) {
              skipBlurSave.current = false
              return
            }
            const value = quality === "" ? null : Number(quality)
            if (
              value !== null &&
              (!Number.isInteger(value) || value < 0 || value > 100)
            ) {
              setQuality(String(current.quality_score ?? ""))
              toast.error("Quality must be an integer from 0 to 100.")
              return
            }
            void save("quality_score", value)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              skipBlurSave.current = true
              setQuality(String(current.quality_score ?? ""))
              event.currentTarget.blur()
            }
          }}
        />
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground">
        {row.submission_difficulty === null
          ? "—"
          : row.submission_difficulty <= 2
            ? "Easy"
            : row.submission_difficulty === 3
              ? "Medium"
              : "Hard"}
      </TableCell>
      <TableCell className="px-1" {...stop}>
        {select("status", channelStatuses)}
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
        {row.last_verified_at ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <time tabIndex={0} dateTime={row.last_verified_at}>
                {new Date(row.last_verified_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </TooltipTrigger>
            <TooltipContent>
              {new Date(row.last_verified_at).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        ) : (
          "Never"
        )}
      </TableCell>
      <TableCell className="w-10 pr-3" {...stop}>
        <DropdownMenu
          onOpenChange={(open) => {
            if (open && submission === undefined)
              loadDistributionChannelAction(row.id)
                .then((result) => {
                  if (result.ok)
                    setSubmission(result.data.channel.submission_url)
                })
                .catch(() => toast.error("Could not load the submission link."))
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={"Actions for " + row.name}
              disabled={inactive}
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MoreHorizontal />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onEdit(row.id)}>
                <Pencil />
                Edit channel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void verify()}>
                <ShieldCheck />
                Verify channel
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={row.website_url} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Open website
                </a>
              </DropdownMenuItem>
              {submission ? (
                <DropdownMenuItem asChild>
                  <a href={submission} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Open submission page
                  </a>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <ExternalLink />
                  {submission === undefined
                    ? "Loading submission link…"
                    : "No submission page"}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(row.id)}
              >
                <Trash2 />
                Delete channel
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})
