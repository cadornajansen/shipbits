"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { useState } from "react"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"

export function AccountButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        aria-label="Open dashboard"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="size-5" />
      </Link>
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
