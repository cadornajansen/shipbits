"use client"

import { LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut()
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signOut}
      disabled={isPending}
    >
      {isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <LogOutIcon data-icon="inline-start" />
      )}
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
