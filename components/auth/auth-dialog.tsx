"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

type Provider = "google" | "github"

function GoogleLogo() {
  return (
    <svg data-icon="inline-start" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.18c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.69 2.9-4.18 2.9-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 21.7c2.62 0 4.82-.87 6.43-2.35l-3.15-2.52c-.87.59-1.99.94-3.28.94-2.52 0-4.65-1.7-5.41-3.99H3.34v2.6A9.7 9.7 0 0 0 12 21.7Z"
      />
      <path
        fill="#FBBC05"
        d="M6.59 13.78A5.84 5.84 0 0 1 6.28 12c0-.62.11-1.21.31-1.78v-2.6H3.34A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.03 1.04 4.38l3.25-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.23c1.43 0 2.7.49 3.71 1.45l2.78-2.78C16.81 3.34 14.61 2.3 12 2.3a9.7 9.7 0 0 0-8.66 5.32l3.25 2.6C7.35 7.93 9.48 6.23 12 6.23Z"
      />
    </svg>
  )
}

function GitHubLogo() {
  return (
    <svg
      data-icon="inline-start"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.71c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.35 1.09 2.92.84.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-2 1.03-2.71-.1-.25-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.03A9.55 9.55 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.39.2 2.43.1 2.68.64.71 1.03 1.61 1.03 2.71 0 3.85-2.34 4.69-4.57 4.94.36.31.68.9.68 1.81v2.68c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

export function AuthDialog({
  onOpenChange,
  open,
  redirectPath = "/",
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  redirectPath?: "/" | "/dashboard" | "/dashboard/directory-submissions/new"
}) {
  const [provider, setProvider] = useState<Provider | null>(null)

  async function continueWith(providerName: Provider) {
    setProvider(providerName)
    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    if (redirectPath !== "/") {
      callbackUrl.searchParams.set("next", redirectPath)
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: providerName,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

    if (error) {
      setProvider(null)
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Continue to ShipBits</DialogTitle>
          <DialogDescription>
            Sign in to submit and manage your products.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => continueWith("google")}
            disabled={provider !== null}
          >
            {provider === "google" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <GoogleLogo />
            )}
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => continueWith("github")}
            disabled={provider !== null}
          >
            {provider === "github" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <GitHubLogo />
            )}
            Continue with GitHub
          </Button>
          <p className="pt-1 text-center text-xs text-muted-foreground">
            {redirectPath !== "/"
              ? "You’ll be taken to your dashboard after sign-in."
              : "Your product URL will be waiting for you after sign-in."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
