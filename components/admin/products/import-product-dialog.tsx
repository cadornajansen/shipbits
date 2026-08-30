"use client"

import { useState, useTransition } from "react"
import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createImportAction } from "@/features/imports/actions"

export function ImportProductDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createImportAction(formData)
      if (!result.ok) {
        setError(result.fieldErrors?.websiteUrl?.[0] ?? result.error)
        toast.error(result.error)
        return
      }

      toast.success("Import queued. It will appear in Drafts shortly.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <DownloadIcon data-icon="inline-start" />
        Import from URL
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import product</DialogTitle>
          <DialogDescription>
            ShipBits will extract the homepage and prepare a draft product.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="website_url">Product URL</FieldLabel>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://example.com"
                aria-invalid={Boolean(error)}
                required
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isPending ? "Queueing..." : "Import product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
