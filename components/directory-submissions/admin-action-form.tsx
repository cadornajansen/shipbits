"use client"

import { useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function AdminActionForm({
  action,
  children,
  label,
}: {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
  children?: ReactNode
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          try {
            const result = await action(data)
            if (!result.ok) {
              toast.error(result.error || "Unable to save changes.")
              return
            }
            toast.success("Saved.")
            router.refresh()
          } catch {
            toast.error("Unable to save changes. Refresh and try again.")
          }
        })
      }}
    >
      <fieldset disabled={pending} className="grid gap-3">
        {children}
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="justify-self-start"
        >
          {pending ? "Saving…" : label}
        </Button>
      </fieldset>
    </form>
  )
}
