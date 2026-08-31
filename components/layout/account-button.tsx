"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { useEffect, useState } from "react"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function AccountButton({
  onNavigate,
  showLoginLabel = false,
}: {
  onNavigate?: () => void
  showLoginLabel?: boolean
}) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(Boolean(user))
    })
  }, [])

  if (isAuthenticated) {
    return (
      <div className="flex items-center">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mr-3"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="Open dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="size-5" />
        </Link>
      </div>
    )
  }

  return (
    <>
      <Button
        className="flex items-center"
        type="button"
        variant="ghost"
        size={showLoginLabel ? "sm" : "icon-sm"}
        onClick={() => setAuthDialogOpen(true)}
        aria-label={showLoginLabel ? undefined : "Sign in"}
      >
        {showLoginLabel ? "Log in" : <User className="size-5" />}
      </Button>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        redirectPath="/dashboard"
      />
    </>
  )
}
