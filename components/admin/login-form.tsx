"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      toast.success("Signed in successfully.")
      router.replace(
        nextPath?.startsWith("/admin") ? nextPath : "/admin/products"
      )
      router.refresh()
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={handleSubmit}
        className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-xl font-semibold">ShipBits admin</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with an administrator account.
          </p>
        </div>
        <FieldGroup className="mt-6 gap-4">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
    </main>
  )
}
