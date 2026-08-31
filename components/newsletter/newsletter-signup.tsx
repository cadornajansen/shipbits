"use client"

import Link from "next/link"
import { useId, useRef, useState, type FormEvent } from "react"

import { trackEvent } from "@/components/analytics/events"
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
import {
  NEWSLETTER_SUCCESS_MESSAGE,
  newsletterSchema,
} from "@/features/newsletter/validation"
import { cn } from "@/lib/utils"

type NewsletterSignupProps = {
  className?: string
  compact?: boolean
}

export function NewsletterSignup({
  className,
  compact = false,
}: NewsletterSignupProps) {
  const id = useId()
  const submitting = useRef(false)
  const [email, setEmail] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault()
    if (submitting.current) return

    const parsed = newsletterSchema.safeParse({ email })
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message || "Enter a valid email address."
      )
      setMessage(null)
      return
    }

    submitting.current = true
    setIsPending(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const result = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
      }
      if (!response.ok || result.ok !== true) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "We couldn't save your signup. Please try again."
        )
        return
      }

      setEmail("")
      setMessage(
        typeof result.message === "string"
          ? result.message
          : NEWSLETTER_SUCCESS_MESSAGE
      )
      trackEvent("newsletter_signup", {})
    } catch {
      setError("We couldn't reach the signup service. Please try again.")
    } finally {
      submitting.current = false
      setIsPending(false)
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id={`${id}-title`}
          className={cn(
            "font-outfit font-semibold",
            compact ? "text-lg" : "text-2xl"
          )}
        >
          ShipBits Weekly
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The best new products, founder stories, and launch resources. Once a
          week, when we launch.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Newsletter signup">
        <FieldGroup className="gap-2">
          <Field data-invalid={Boolean(error)} data-disabled={isPending}>
            <FieldLabel htmlFor={`${id}-email`}>Email address</FieldLabel>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                disabled={isPending}
                aria-invalid={Boolean(error)}
                aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ""}`}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {isPending ? "Saving…" : "Subscribe"}
              </Button>
            </div>
            {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
            <FieldDescription id={`${id}-privacy`}>
              By subscribing, you opt in to ShipBits Weekly and receive a
              confirmation email. Read our{" "}
              <Link href="/privacy#newsletter">privacy policy</Link>.
            </FieldDescription>
          </Field>
          {message ? (
            <p role="status" className="text-sm leading-relaxed">
              {message}
            </p>
          ) : null}
        </FieldGroup>
      </form>
    </section>
  )
}
