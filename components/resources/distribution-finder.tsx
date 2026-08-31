"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState, type CSSProperties, type FormEvent } from "react"
import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { TagPicker } from "@/components/admin/distribution/tag-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  priceLabel,
  type RankedDistributionChannel,
} from "@/features/distribution/finder"
import type { DistributionTag, TagType } from "@/features/distribution/types"

type FinderResponse = {
  result?: { rows: RankedDistributionChannel[] }
  error?: string
}
type AnalysisResponse = {
  result?: {
    canonicalUrl: string
    name: string
    description: string
    productTypes: string[]
    categories: string[]
    audiences: string[]
    platforms: string[]
    regions: string[]
    status: "success" | "partial"
  }
  error?: string
}

type ProfileTags = {
  productTypes: string[]
  categories: string[]
  audiences: string[]
  platforms: string[]
  regions: string[]
}

const emptyProfileTags: ProfileTags = {
  productTypes: [],
  categories: [],
  audiences: [],
  platforms: [],
  regions: ["global"],
}
const taxonomyFields: Array<{
  key: keyof ProfileTags
  label: string
  type: TagType
}> = [
  { key: "productTypes", label: "Product types", type: "product_type" },
  { key: "categories", label: "Categories", type: "category" },
  { key: "audiences", label: "Audiences", type: "audience" },
  { key: "platforms", label: "Platforms", type: "platform" },
  { key: "regions", label: "Regions", type: "region" },
]

const matchScoreChartConfig = {
  score: { color: "var(--score-color)", label: "Match score" },
} satisfies ChartConfig

function displayLabel(value: string): string {
  const labels: Record<string, string> = {
    api: "API",
    ios: "iOS",
    macos: "macOS",
    saas: "SaaS",
    "ai-tool": "AI tool",
    "b2b-software": "B2B software",
    "developer-tool": "Developer tool",
    review_site: "Review site",
  }
  return (
    labels[value] ??
    value
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/^./, (letter) => letter.toUpperCase())
  )
}

function conciseReason(reason: string): string {
  return reason.replace(
    /^(Strong category match|Reaches|Fits|Relevant product type|Available in):\s*/,
    ""
  )
}

function faviconUrl(websiteUrl: string): string {
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(websiteUrl)}&size=64`
}

function productRootUrl(value: string): string {
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
    )
    return ["http:", "https:"].includes(url.protocol)
      ? new URL("/", url.origin).toString()
      : value
  } catch {
    return value
  }
}

function MatchScore({ score }: { score: number }) {
  const color =
    score >= 90
      ? "var(--color-emerald-600)"
      : score >= 70
        ? "var(--color-emerald-500)"
        : "var(--color-amber-500)"
  const chartData = [{ fill: "var(--color-score)", score }]
  return (
    <div className="size-12" aria-label={`${score} percent match`}>
      <ChartContainer
        config={matchScoreChartConfig}
        className="size-12"
        style={{ "--score-color": color } as CSSProperties}
      >
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={-270}
          innerRadius={16}
          outerRadius={22}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[22, 16]}
          />
          <RadialBar dataKey="score" background cornerRadius={5} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null
                }
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-[10px] font-semibold"
                    >
                      {score}
                    </tspan>
                  </text>
                )
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}

export function DistributionFinder({
  taxonomy,
}: {
  taxonomy: DistributionTag[]
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [profileTags, setProfileTags] = useState<ProfileTags>(emptyProfileTags)
  const [showProfile, setShowProfile] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)
  const edited = useRef({ description: false, name: false, tags: false })
  const analyzedUrl = useRef("")
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RankedDistributionChannel[] | null>(
    null
  )

  const updateTags = (key: keyof ProfileTags, ids: string[]) => {
    edited.current.tags = true
    const tagsById = new Map(taxonomy.map((tag) => [tag.id, tag.slug]))
    setProfileTags((current) => ({
      ...current,
      [key]: ids.flatMap((id) => tagsById.get(id) ?? []),
    }))
  }

  async function findChannels(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !description.trim()) {
      setError("Enter your product name and a short description.")
      return
    }
    setRunning(true)
    setError(null)
    setResults(null)
    try {
      const response = await fetch("/api/tools/distribution-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, ...profileTags }),
      })
      const payload = (await response.json()) as FinderResponse
      if (!response.ok || !payload.result)
        throw new Error(payload.error ?? "The finder could not be completed.")
      setResults(payload.result.rows)
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "The finder could not be completed."
      setError(message)
      toast.error(message)
    } finally {
      setRunning(false)
    }
  }

  async function analyzeUrl(input = url) {
    const value = productRootUrl(input.trim())
    if (!value || analyzedUrl.current === value || analyzing) return
    if (value !== url) setUrl(value)
    setAnalyzing(true)
    setAnalysisMessage("Analyzing your public landing page…")
    try {
      const response = await fetch("/api/tools/distribution-finder/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      })
      const payload = (await response.json()) as AnalysisResponse
      if (!response.ok || !payload.result) throw new Error(payload.error)
      analyzedUrl.current = value
      if (!edited.current.name) setName(payload.result.name)
      if (!edited.current.description)
        setDescription(payload.result.description)
      if (!edited.current.tags)
        setProfileTags({
          productTypes: payload.result.productTypes,
          categories: payload.result.categories,
          audiences: payload.result.audiences,
          platforms: payload.result.platforms,
          regions: payload.result.regions.length
            ? payload.result.regions
            : ["global"],
        })
      setShowProfile(true)
      setAnalysisMessage(
        payload.result.status === "success"
          ? "Details and matching signals were found. Review them before searching."
          : "We found some details. Add or adjust anything that is missing."
      )
    } catch (caught) {
      setAnalysisMessage(
        caught instanceof Error
          ? caught.message
          : "We couldn't read this site automatically. Add the product details below."
      )
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Tell us about your product</CardTitle>
          <CardDescription>
            Start with a URL, or enter the details manually.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">URL first</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={findChannels} noValidate aria-busy={running}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="finder-url">Product URL</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="finder-url"
                    value={url}
                    onChange={(event) => {
                      analyzedUrl.current = ""
                      setUrl(event.target.value)
                    }}
                    onBlur={() => void analyzeUrl(url)}
                    inputMode="url"
                    placeholder="https://yourproduct.com"
                    disabled={running || analyzing}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="sm"
                      variant="ghost"
                      onClick={() => void analyzeUrl()}
                      disabled={!url.trim() || analyzing}
                    >
                      {analyzing ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <Sparkles data-icon="inline-start" />
                      )}
                      {analyzing ? "Analyzing" : "Analyze"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  Paste your product URL and ShipBits will analyze it
                  automatically.
                </FieldDescription>
                {analysisMessage ? (
                  <p className="text-xs text-muted-foreground" role="status">
                    {analysisMessage}
                  </p>
                ) : null}
              </Field>
              <Separator />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="finder-name">Product name</FieldLabel>
                  <Input
                    id="finder-name"
                    value={name}
                    onChange={(event) => {
                      edited.current.name = true
                      setName(event.target.value)
                    }}
                    maxLength={120}
                    placeholder="Acme Analytics"
                    disabled={running}
                  />
                </Field>
                <Field data-invalid={Boolean(error)} className="sm:col-span-2">
                  <FieldLabel htmlFor="finder-description">
                    What does it do?
                  </FieldLabel>
                  <Textarea
                    id="finder-description"
                    value={description}
                    onChange={(event) => {
                      edited.current.description = true
                      setDescription(event.target.value)
                    }}
                    maxLength={1000}
                    rows={3}
                    placeholder="An AI SaaS that helps developer teams understand product analytics."
                    disabled={running}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              </div>
              <Collapsible open={showProfile} onOpenChange={setShowProfile}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit px-0 text-muted-foreground"
                  >
                    <ChevronDown
                      data-icon="inline-start"
                      className={showProfile ? "rotate-180" : ""}
                    />
                    Review matching signals
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                    {taxonomyFields.map((field) => {
                      const tags = taxonomy.filter(
                        (tag) => tag.type === field.type
                      )
                      const selected = profileTags[field.key]
                      return (
                        <Field
                          key={field.key}
                          className={
                            field.key === "regions"
                              ? "sm:col-span-2"
                              : undefined
                          }
                        >
                          <FieldLabel>{field.label}</FieldLabel>
                          <TagPicker
                            id={`finder-${field.key}`}
                            label={field.label}
                            tags={tags}
                            selected={selected.flatMap(
                              (slug) =>
                                tags.find((tag) => tag.slug === slug)?.id ?? []
                            )}
                            onChange={(ids) => updateTags(field.key, ids)}
                            disabled={running || analyzing}
                          />
                        </Field>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Button
                type="submit"
                className="w-full sm:w-fit"
                disabled={running}
              >
                {running ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Search data-icon="inline-start" />
                )}
                {running
                  ? "Building your shortlist…"
                  : "Find distribution channels"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {results ? (
        <section
          className="flex flex-col gap-5"
          aria-labelledby="finder-results-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="finder-results-title"
                className="font-outfit text-xl font-semibold"
              >
                Your launch shortlist
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The strongest active channels for this product profile.
              </p>
            </div>
            <Badge variant="secondary">{results.length} matches</Badge>
          </div>
          {results.length ? (
            <ol className="grid gap-3 md:grid-cols-2">
              {results.slice(0, 10).map((channel) => {
                const reasons = [...new Set(channel.reasons.map(conciseReason))]
                return (
                  <li key={channel.id}>
                    <Card size="sm" className="h-full">
                      <CardHeader>
                        <CardTitle className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-[10px] font-semibold text-muted-foreground">
                            <Image
                              src={faviconUrl(channel.website_url)}
                              alt=""
                              width={16}
                              height={16}
                              unoptimized
                            />
                          </span>
                          <span className="truncate">{channel.name}</span>
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-1.5 pt-1">
                          <Badge variant="outline">
                            {displayLabel(channel.channel_type ?? "directory")}
                          </Badge>
                          <Badge variant="secondary">
                            {priceLabel(channel.pricing_type)}
                          </Badge>
                        </CardDescription>
                        <CardAction>
                          <MatchScore score={channel.matchScore} />
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
                          {channel.description ||
                            "Submission details are available on this channel."}
                        </p>
                        {reasons.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {reasons.map((reason) => (
                              <Badge
                                key={reason}
                                variant="secondary"
                                className="font-normal"
                              >
                                {conciseReason(reason)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                      <CardFooter className="mt-auto border-t">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="-ml-2"
                        >
                          <a
                            href={channel.submission_url ?? channel.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open channel <ExternalLink data-icon="inline-end" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  </li>
                )
              })}
            </ol>
          ) : (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No matching channels yet</EmptyTitle>
                <EmptyDescription>
                  Try adding a clearer product type, audience, or platform in
                  the matching signals above.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {results.length ? (
            <Card size="sm" className="bg-muted/30">
              <CardHeader>
                <CardTitle>Want ShipBits to handle the submissions?</CardTitle>
                <CardDescription>
                  Submit once and we handle relevant directory submissions.
                  Approval, backlinks, and rankings are never guaranteed.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/dashboard/directory-submissions/new">
                    Start a directory submission{" "}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
