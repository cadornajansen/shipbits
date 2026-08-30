"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { PublicSubmissionDialog } from "@/components/submissions/public-submission-dialog"
import type { Category } from "@/features/products/types"
import { createClient } from "@/lib/supabase/client"

const pendingUrlKey = "shipbits.pendingProductUrl"

function normalizeCandidateUrl(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`

  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function LandingSubmissionCta({
  categories,
}: {
  categories: Category[]
}) {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      const pendingUrl = window.sessionStorage.getItem(pendingUrlKey)
      const authFailed =
        new URLSearchParams(window.location.search).get("auth") === "failed"

      if (user && pendingUrl) {
        setWebsiteUrl(pendingUrl)
        setSubmissionDialogOpen(true)
        window.sessionStorage.removeItem(pendingUrlKey)
      } else if (authFailed) {
        toast.error("Sign-in could not be completed. Please try again.")
        if (pendingUrl) setAuthDialogOpen(true)
      }

      if (authFailed) window.history.replaceState({}, "", "/")
    })
  }, [])

  async function beginSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedUrl = normalizeCandidateUrl(websiteUrl)
    if (!normalizedUrl) {
      toast.error("Enter a valid http or https product URL.")
      return
    }

    const {
      data: { user },
    } = await createClient().auth.getUser()

    setWebsiteUrl(normalizedUrl)
    if (user) {
      setSubmissionDialogOpen(true)
      return
    }

    window.sessionStorage.setItem(pendingUrlKey, normalizedUrl)
    setAuthDialogOpen(true)
  }

  return (
    <>
      <form
        onSubmit={beginSubmission}
        className="flex w-full max-w-md items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-xs"
      >
        <input
          type="text"
          inputMode="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://yourproduct.com"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Product URL"
        />
        <Button type="submit" className="shrink-0 rounded-full px-5">
          Ship it for ₱1
        </Button>
      </form>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PublicSubmissionDialog
        categories={categories}
        open={submissionDialogOpen}
        onOpenChange={setSubmissionDialogOpen}
        websiteUrl={websiteUrl}
      />
    </>
  )
}
