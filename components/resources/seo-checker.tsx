"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  CircleX,
  Search,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { trackEvent } from "@/components/analytics/events"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { seoCheckerInputSchema } from "@/features/seo-checker/validation"
import type {
  SeoCheckStatus,
  SeoCheckerResult,
} from "@/features/seo-checker/scoring"

const statusPresentation = {
  pass: { label: "Passed", icon: CheckCircle2, variant: "secondary" },
  warning: { label: "Review", icon: TriangleAlert, variant: "outline" },
  fail: { label: "Fix", icon: CircleX, variant: "destructive" },
} as const

function CheckStatus({ status }: { status: SeoCheckStatus }) {
  const { label, icon: Icon, variant } = statusPresentation[status]
  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  )
}

export function SeoChecker() {
  const [url, setUrl] = useState("")
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SeoCheckerResult | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestRef.current) return
    const parsed = seoCheckerInputSchema.safeParse({ url })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid website URL.")
      return
    }

    const controller = new AbortController()
    requestRef.current = controller
    setRunning(true)
    setError(null)
    setResult(null)
    trackEvent("seo_check_started", {})
    const timeout = setTimeout(() => controller.abort(), 30_000)

    try {
      const response = await fetch("/api/resources/seo-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      })
      const payload = (await response.json()) as {
        result?: SeoCheckerResult
        error?: string
      }
      if (!response.ok || !payload.result) {
        throw new Error(
          payload.error ?? "The check could not be completed. Please try again."
        )
      }
      setResult(payload.result)
      trackEvent("seo_check_completed", { score: payload.result.score })
    } catch (caught) {
      const message = controller.signal.aborted
        ? "The check timed out. Your URL is still here; please try again later."
        : caught instanceof Error
          ? caught.message
          : "The check could not be completed. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      clearTimeout(timeout)
      requestRef.current = null
      setRunning(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <form onSubmit={analyze} noValidate aria-busy={running}>
        <FieldGroup className="gap-3">
          <Field data-invalid={Boolean(error)} data-disabled={running}>
            <FieldLabel htmlFor="seo-checker-url">Your product URL</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="seo-checker-url"
                name="url"
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={2048}
                placeholder="https://yourproduct.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={running}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error
                    ? "seo-checker-error seo-checker-hint"
                    : "seo-checker-hint"
                }
              />
              <Button type="submit" disabled={running}>
                {running ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Search data-icon="inline-start" />
                )}
                {running ? "Analyzing…" : "Analyze"}
              </Button>
            </div>
            <FieldDescription id="seo-checker-hint">
              One public page, plus a small robots.txt and sitemap check. No
              sign-in required.
            </FieldDescription>
            {error ? (
              <FieldError id="seo-checker-error">{error}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </form>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {running
          ? "Checking the page and launch signals."
          : result
            ? `Check complete. Score ${result.score} out of 100, ${result.passed} passed, ${result.warnings} to review, ${result.failures} to fix.`
            : ""}
      </div>

      {result ? (
        <section
          aria-labelledby="seo-result-title"
          className="flex min-w-0 flex-col gap-5"
        >
          <div className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2
                id="seo-result-title"
                className="font-outfit text-xl font-semibold"
              >
                Your launch check
              </h2>
              <p
                className="mt-1 truncate text-sm text-muted-foreground"
                title={result.url}
              >
                {result.url}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{result.passed} passed</Badge>
                <Badge variant="outline">{result.warnings} to review</Badge>
                <Badge variant="destructive">{result.failures} to fix</Badge>
              </div>
            </div>
            <p className="shrink-0 font-outfit text-4xl font-semibold tabular-nums">
              {result.score}
              <span className="text-lg font-normal text-muted-foreground">
                {" "}
                / 100
              </span>
            </p>
          </div>

          <ul className="divide-y rounded-xl border px-4 sm:px-5">
            {result.checks.map((check) => (
              <li
                key={check.id}
                className="flex items-start gap-3 py-4 sm:gap-5"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{check.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {check.detail}
                  </p>
                </div>
                <CheckStatus status={check.status} />
              </li>
            ))}
          </ul>

          <p className="text-sm leading-relaxed text-muted-foreground">
            How the score works: 12 equally weighted checks; passed earns 1
            point, review earns ½, and fix earns 0. The percentage is rounded.
            This is a launch checklist, not a ranking forecast or a full
            technical SEO audit.
          </p>

          <Alert>
            <AlertTitle>Ready to get discovered?</AlertTitle>
            <AlertDescription>
              <p>
                Give people a place to find your product alongside other
                builders.
              </p>
              <Button asChild size="sm">
                <Link href="/#submit-product">
                  List your product from ₱1
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        </section>
      ) : null}

      <p className="text-sm leading-relaxed text-muted-foreground">
        We inspect the HTML the server sends, without running page JavaScript.
        Client-rendered tags, bot protection, slow responses, or a very large
        page can limit results. Missing optional signals do not mean your
        website cannot rank. We do not download the images or verify rich-result
        eligibility.
      </p>
    </div>
  )
}
