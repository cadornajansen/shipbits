"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { z } from "zod"
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  ShieldCheck,
  CircleCheck,
  CircleDashed,
  CircleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  loadDistributionChannelAction,
  saveDistributionChannelAction,
  verifyDistributionAction,
} from "@/features/distribution/actions"
import { channelFromForm } from "@/features/distribution/form"
import {
  channelStatuses,
  channelTypes,
  pricingTypes,
  tagTypes,
  type ChannelDetail,
  type ChannelTag,
  type DistributionTag,
  type UrlCheck,
} from "@/features/distribution/types"
import { TagPicker } from "./tag-picker"
import { DistributionSelect, UnknownCheckbox, displayLabel } from "./controls"

function CheckSummary({
  title,
  result,
}: {
  title: string
  result: UrlCheck | null | undefined
}) {
  const Icon = !result
    ? CircleDashed
    : result.reachable
      ? CircleCheck
      : CircleAlert
  return (
    <div className="flex items-start gap-2 py-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">
          {!result
            ? "Not checked"
            : result.http_status
              ? "HTTP " + result.http_status
              : displayLabel(result.failure ?? "Could not check")}
        </span>
      </div>
    </div>
  )
}
function Evidence({ detail }: { detail: ChannelDetail | null }) {
  const evidence = detail?.evidence ?? []
  return (
    <FieldSet>
      <FieldLegend className="mb-0">
        Field evidence{" "}
        <span className="ml-1 text-muted-foreground">· {evidence.length}</span>
      </FieldLegend>
      {!evidence.length ? (
        <p className="text-sm text-muted-foreground">
          No field evidence has been recorded.
        </p>
      ) : (
        <div className="divide-y">
          {evidence.map((item) => {
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {displayLabel(item.field_name)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {displayLabel(item.extraction_method)} · observed {new Date(item.observed_at).toLocaleDateString()}
                    </p>
                  </div>
                  {item.source_url && <Button type="button" variant="ghost" size="sm" asChild>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View source
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Result: {JSON.stringify(item.resulting_value)}
                </p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Advanced · recorded values
                  </summary>
                  <div className="mt-2 flex flex-col gap-3">
                    <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 break-all whitespace-pre-wrap">
                      {JSON.stringify({ source_value: item.source_value, raw_value: item.raw_value, enriched_at: item.enriched_at }, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )
          })}
        </div>
      )}
    </FieldSet>
  )
}

function EditorForm({
  detail,
  taxonomy,
  onCancel,
  onSaved,
  onBusy,
  onRefresh,
}: {
  detail: ChannelDetail | null
  taxonomy: DistributionTag[]
  onCancel: () => void
  onSaved: () => void
  onBusy: (busy: boolean) => void
  onRefresh: () => Promise<void>
}) {
  const channel = detail?.channel
  const [tags, setTags] = useState<ChannelTag[]>(detail?.tags ?? [])
  const [error, setError] = useState("")
  const [dirty, setDirty] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [pending, startTransition] = useTransition()
  const busy = pending || verifying
  const markDirty = () => setDirty(true)
  const field = (name: string, title: string, control: React.ReactNode) => (
    <Field key={name}>
      <FieldLabel htmlFor={name}>{title}</FieldLabel>
      {control}
    </Field>
  )
  const text = (
    name: "name" | "slug" | "website_url" | "submission_url",
    title: string,
    required = false
  ) =>
    field(
      name,
      title,
      <Input
        className="h-9"
        id={name}
        name={name}
        defaultValue={channel?.[name] ?? ""}
        required={required}
        maxLength={name.includes("url") ? 2048 : 160}
      />
    )
  const numeric = (
    name:
      | "price_amount"
      | "estimated_submission_minutes"
      | "quality_score"
      | "authority_score"
      | "competition_score",
    title: string,
    max: number,
    min = 0
  ) =>
    field(
      name,
      title,
      name === "price_amount" || name === "estimated_submission_minutes" ? (
        <InputGroup className="h-9">
          <InputGroupInput
            id={name}
            name={name}
            type="number"
            min={min}
            max={max}
            step={name === "price_amount" ? "0.01" : "1"}
            defaultValue={channel?.[name] ?? ""}
            placeholder="Unknown"
          />
          <InputGroupAddon align="inline-end">
            {name === "price_amount" ? channel?.price_currency ?? "currency" : "min"}
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Input
          id={name}
          name={name}
          className="h-9"
          type="number"
          min={min}
          max={max}
          step={1}
          defaultValue={channel?.[name] ?? ""}
          placeholder="—"
        />
      )
    )
  const boolean = (
    name:
      | "requires_account"
      | "requires_email_verification"
      | "requires_manual_review"
      | "requires_payment"
      | "backlink_possible"
      | "dofollow_possible",
    title: string
  ) => (
    <UnknownCheckbox
      key={name}
      name={name}
      label={title}
      defaultValue={channel?.[name] ?? null}
      disabled={busy}
      onDirty={markDirty}
    />
  )
  const enumeration = (
    name: "channel_type" | "pricing_type" | "status",
    title: string,
    values: readonly string[],
    fallback: string
  ) =>
    field(
      name,
      title,
      <DistributionSelect
        id={name}
        name={name}
        label={title}
        options={values}
        defaultValue={channel?.[name] ?? fallback}
        emptyLabel={name === "channel_type" ? "Unknown" : undefined}
        disabled={busy}
        onValueChange={markDirty}
        status={name === "status"}
      />
    )
  const tier = (
    name: "traffic_tier" | "submission_difficulty",
    title: string
  ) =>
    field(
      name,
      title,
      <DistributionSelect
        id={name}
        name={name}
        label={title}
        defaultValue={
          channel?.[name] === null || !channel ? "" : String(channel[name])
        }
        options={["1", "2", "3", "4", "5"]}
        emptyLabel="Unknown"
        disabled={busy}
        onValueChange={markDirty}
        optionLabels={
          name === "submission_difficulty"
            ? {
                "1": "1 · Very easy",
                "2": "2 · Easy",
                "3": "3 · Medium",
                "4": "4 · Hard",
                "5": "5 · Very hard",
              }
            : undefined
        }
      />
    )
  async function verify() {
    if (!channel || dirty) return
    setVerifying(true)
    onBusy(true)
    setError("")
    try {
      const result = await verifyDistributionAction({
        ids: [channel.id],
        stale: false,
      })
      if (!result.ok) throw new Error(result.error)
      if (!result.data.checked || result.data.failed.length)
        throw new Error(
          "Check unavailable or not saved. Retry after any running verification finishes."
        )
      toast.success(
        result.data.unhealthy
          ? "Check completed. Some URLs need review."
          : "Channel check completed."
      )
      await onRefresh()
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Verification failed. Please retry."
      setError(message)
      toast.error(message)
    } finally {
      setVerifying(false)
      onBusy(false)
    }
  }
  return (
    <form
      className="flex min-h-0 flex-1 flex-col overflow-clip"
      onChange={markDirty}
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        const form = new FormData(event.currentTarget)
        startTransition(async () => {
          onBusy(true)
          try {
            const input = channelFromForm(form)
            const result = await saveDistributionChannelAction({
              id: channel?.id ?? null,
              expectedUpdatedAt: channel?.updated_at ?? null,
              channel: input,
              tags,
            })
            if (!result.ok) {
              setError(result.error)
              toast.error(result.error)
              return
            }
            toast.success(channel ? "Channel updated" : "Channel created")
            onSaved()
          } catch (caught) {
            const message =
              caught instanceof z.ZodError
                ? caught.issues
                    .map((issue) => issue.path.join(".") + ": " + issue.message)
                    .join("; ")
                : "Check the form and enter a valid JSON object for requirements."
            setError(message)
            toast.error(message)
          } finally {
            onBusy(false)
          }
        })
      }}
    >
      {error && (
        <div className="shrink-0 px-6 pt-4">
          <Alert variant="destructive">
            <AlertDescription role="alert">{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1 overflow-clip">
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-6 p-6">
          <FieldSet>
            <FieldLegend className="mb-0">General</FieldLegend>
            <FieldGroup className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              {text("name", "Name", true)}
              {text("slug", "Slug")}
              {text("website_url", "Website URL", true)}
              {text("submission_url", "Submission URL")}
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={channel?.description ?? ""}
                  maxLength={10000}
                  rows={3}
                  placeholder="What makes this channel useful?"
                />
                <FieldDescription>
                  A slug is generated from the name when left blank.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend className="mb-0">Classification</FieldLegend>
            <FieldGroup className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              {enumeration("channel_type", "Channel type", channelTypes, "")}
              {tagTypes.map((type) => {
                const available = taxonomy.filter((tag) => tag.type === type)
                return (
                  <Field
                    key={type}
                    className={
                      type === "product_type" || type === "category"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <FieldLabel htmlFor={"taxonomy-" + type}>
                      {displayLabel(type)}
                    </FieldLabel>
                    <TagPicker
                      id={"taxonomy-" + type}
                      label={displayLabel(type)}
                      tags={available}
                      disabled={busy}
                      selected={tags
                        .filter((tag) =>
                          available.some((item) => item.id === tag.tag_id)
                        )
                        .map((tag) => tag.tag_id)}
                      onChange={(ids) => {
                        markDirty()
                        setTags((current) => [
                          ...current.filter(
                            (tag) =>
                              !available.some((item) => item.id === tag.tag_id)
                          ),
                          ...ids.map(
                            (id) =>
                              current.find((tag) => tag.tag_id === id) ?? {
                                tag_id: id,
                                relevance_score: null,
                                confidence_score: null,
                              }
                          ),
                        ])
                      }}
                    />
                  </Field>
                )
              })}
            </FieldGroup>
            {tags.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Advanced · tag relevance and confidence
                </summary>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 text-muted-foreground">
                    <span>Tag</span>
                    <span>Relevance</span>
                    <span>Confidence</span>
                  </div>
                  {tags.map((tag) => (
                    <div
                      key={tag.tag_id}
                      className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2"
                    >
                      <span className="truncate">
                        {displayLabel(
                          taxonomy.find((item) => item.id === tag.tag_id)
                            ?.slug ?? "Tag"
                        )}
                      </span>
                      {(["relevance_score", "confidence_score"] as const).map(
                        (key) => (
                          <Input
                            key={key}
                            className="h-8"
                            name={"tag-" + tag.tag_id + "-" + key}
                            aria-label={
                              (taxonomy.find((item) => item.id === tag.tag_id)
                                ?.name ?? "Tag") +
                              " " +
                              displayLabel(key)
                            }
                            type="number"
                            min={0}
                            max={100}
                            placeholder="—"
                            value={tag[key] ?? ""}
                            onChange={(event) =>
                              setTags((current) =>
                                current.map((item) =>
                                  item.tag_id === tag.tag_id
                                    ? {
                                        ...item,
                                        [key]:
                                          event.target.value === ""
                                            ? null
                                            : Number(event.target.value),
                                      }
                                    : item
                                )
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend className="mb-0">Submission</FieldLegend>
            <FieldGroup className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              {enumeration("pricing_type", "Pricing", pricingTypes, "unknown")}
              {numeric("price_amount", "Price", 1000000)}
              {field("price_currency", "Currency", <Input className="h-9 uppercase" id="price_currency" name="price_currency" defaultValue={channel?.price_currency ?? ""} maxLength={3} placeholder="Unknown" />)}
              {numeric(
                "estimated_submission_minutes",
                "Estimated time",
                10080,
                1
              )}
              {tier("submission_difficulty", "Difficulty")}
            </FieldGroup>
            <FieldGroup className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {boolean("requires_account", "Requires account")}
              {boolean("requires_email_verification", "Email verification")}
              {boolean("requires_manual_review", "Manual review")}
              {boolean("requires_payment", "Requires payment")}
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              A dash means unknown. Use the reset icon to clear a known answer.
            </p>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend className="mb-0">Quality &amp; reach</FieldLegend>
            <FieldGroup className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              {numeric("quality_score", "Quality", 100)}
              {numeric("authority_score", "Authority", 100)}
              {numeric("competition_score", "Competition", 100)}
              {tier("traffic_tier", "Traffic tier")}
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              Deterministic ShipBits scores use 0–100. Leave unmeasured values blank.
            </p>
            <FieldGroup className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {boolean("backlink_possible", "Backlink possible")}
              {boolean("dofollow_possible", "Dofollow possible")}
            </FieldGroup>
          </FieldSet>
          <Separator />
          <FieldSet>
            <FieldLegend className="mb-0">Verification</FieldLegend>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {enumeration("status", "Status", channelStatuses, "unverified")}
              <Field>
                <FieldLabel>Last checked</FieldLabel>
                <p className="flex h-9 items-center text-sm text-muted-foreground">
                  {channel?.last_checked_at
                    ? new Date(channel.last_checked_at).toLocaleString()
                    : "Never"}
                </p>
              </Field>
            </FieldGroup>
            <div className="divide-y">
              <CheckSummary
                title="Website"
                result={detail?.verifications[0]?.website}
              />
              <CheckSummary
                title="Submission page"
                result={detail?.verifications[0]?.submission}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={!channel || busy || dirty}
                onClick={() => void verify()}
              >
                {verifying ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <ShieldCheck data-icon="inline-start" />
                )}
                {verifying ? "Verifying…" : "Verify channel"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {dirty
                  ? "Save changes before verifying."
                  : !channel
                    ? "Save this channel before verifying."
                    : "Checks saved URLs; does not approve the channel."}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last successful check:{" "}
              {channel?.last_verified_at
                ? new Date(channel.last_verified_at).toLocaleString()
                : "Never"}
            </p>
            {!!detail?.verifications.length && (
              <details className="text-xs">
                <summary className="flex cursor-pointer items-center gap-1 text-muted-foreground">
                  Verification history · latest {detail.verifications.length}
                  <ChevronDown className="size-3" />
                </summary>
                <div className="mt-3 divide-y">
                  {detail.verifications.map((verification) => (
                    <div
                      key={verification.id}
                      className="flex flex-col gap-1 py-3"
                    >
                      <p className="font-medium">
                        {new Date(verification.checked_at).toLocaleString()}
                      </p>
                      <CheckSummary
                        title="Website"
                        result={verification.website}
                      />
                      <CheckSummary
                        title="Submission page"
                        result={verification.submission}
                      />
                      <details className="text-muted-foreground">
                        <summary className="cursor-pointer">
                          URL details
                        </summary>
                        <p className="mt-1 break-all">
                          {verification.website.requested_url} →{" "}
                          {verification.website.final_url ??
                            "No destination recorded"}
                          {verification.website.failure
                            ? " · " + displayLabel(verification.website.failure)
                            : ""}
                        </p>
                        {verification.submission && (
                          <p className="mt-1 break-all">
                            {verification.submission.requested_url} →{" "}
                            {verification.submission.final_url ??
                              "No destination recorded"}
                            {verification.submission.failure
                              ? " · " +
                                displayLabel(verification.submission.failure)
                              : ""}
                          </p>
                        )}
                      </details>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </FieldSet>
          <Separator />
          <Evidence detail={detail} />
          <Separator />
          <FieldSet>
            <FieldLegend className="mb-0">Requirements</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="submission_requirements">
                  Structured requirements &amp; notes
                </FieldLabel>
                <Textarea
                  id="submission_requirements"
                  name="submission_requirements"
                  className="font-mono text-xs"
                  rows={5}
                  defaultValue={JSON.stringify(
                    channel?.submission_requirements ?? {},
                    null,
                    2
                  )}
                  aria-describedby="requirements-help"
                />
                <FieldDescription id="requirements-help">
                  Use a JSON object, for example:{" "}
                  {JSON.stringify({
                    notes: "Manual review needed",
                    assets: ["logo", "screenshots"],
                  })}
                  .
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </fieldset>
      </ScrollArea>
      <Separator />
      <DialogFooter className="shrink-0 px-6 py-4 sm:justify-between">
        <span className="hidden self-center text-xs text-muted-foreground sm:block">
          {dirty ? "Unsaved changes" : "Unknown details can stay blank"}
        </span>
        <div className="flex justify-end gap-2">
          <Button
            className="h-9"
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button className="h-9" type="submit" disabled={busy}>
            {pending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

export function ChannelEditor({
  id,
  taxonomy,
  onClose,
}: {
  id: string | null
  taxonomy: DistributionTag[]
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ChannelDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    loadDistributionChannelAction(id)
      .then((result) => {
        if (cancelled) return
        if (result.ok) setDetail(result.data)
        else setError(result.error)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load channel. Please retry.")
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, retry])
  async function refreshDetail() {
    if (!id) return
    const result = await loadDistributionChannelAction(id)
    if (!result.ok) throw new Error(result.error)
    setDetail(result.data)
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        className="flex h-[min(85dvh,820px)] max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={!busy}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 gap-1.5 px-6 py-5 pr-12">
          <DialogTitle>
            {id ? "Edit distribution channel" : "Add distribution channel"}
          </DialogTitle>
          <DialogDescription>
            {id
              ? "Review channel details, submission requirements, and source evidence."
              : "Add a new directory, platform, community, or distribution source."}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {loading ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    setError("")
                    setLoading(true)
                    setRetry((value) => value + 1)
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <EditorForm
            key={detail?.channel.updated_at ?? "new"}
            detail={detail}
            taxonomy={taxonomy}
            onCancel={onClose}
            onSaved={onClose}
            onBusy={setBusy}
            onRefresh={refreshDetail}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
