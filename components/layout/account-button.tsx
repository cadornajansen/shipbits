"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { useEffect, useState } from "react"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function AccountButton() {
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
      <>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard"
          aria-label="Open dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="size-5" />
        </Link>
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setAuthDialogOpen(true)}
        aria-label="Sign in"
      >
        <User className="size-5" />
      </Button>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        redirectPath="/dashboard"
      />
    </>
  )
}
