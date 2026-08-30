"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { saveProfileSettingsAction } from "@/features/profile/actions"
import type { UserProfile } from "@/features/profile/queries"

import { SignOutButton } from "./sign-out-button"

function SettingToggle({
  defaultChecked,
  description,
  label,
  name,
}: {
  defaultChecked: boolean
  description: string
  label: string
  name: string
}) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <Field
      orientation="horizontal"
      className="items-start justify-between gap-5 rounded-lg border p-4"
    >
      <div>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
      />
    </Field>
  )
}

export function SettingsForm({
  profile,
  providers,
}: {
  profile: UserProfile | null
  providers: string[]
}) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await saveProfileSettingsAction(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Settings saved.")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <FieldGroup className="gap-5">
        <section>
          <h2 className="font-outfit text-xl font-semibold">Privacy</h2>
          <div className="mt-3">
            <SettingToggle
              defaultChecked={profile?.profileVisible ?? true}
              name="profile_visible"
              label="Show my builder profile"
              description="Keeps your prepared builder identity available for future public attribution."
            />
          </div>
        </section>
        <section>
          <h2 className="font-outfit text-xl font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign out on this browser when you are finished.
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </section>
        <section>
          <h2 className="font-outfit text-xl font-semibold">Email updates</h2>
          <div className="mt-3 grid gap-3">
            <SettingToggle
              defaultChecked={profile?.emailProductUpdates ?? true}
              name="email_product_updates"
              label="Product updates"
              description="Receive updates about your listings and moderation."
            />
            <SettingToggle
              defaultChecked={profile?.emailPaymentUpdates ?? true}
              name="email_payment_updates"
              label="Payment updates"
              description="Receive receipts and payment status updates."
            />
          </div>
        </section>
        <section>
          <h2 className="font-outfit text-xl font-semibold">
            Connected accounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your sign-in providers are managed through Supabase OAuth.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {providers.length ? (
              providers.map((provider) => (
                <span
                  key={provider}
                  className="rounded-full border px-3 py-1 text-sm capitalize"
                >
                  {provider}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No provider details available.
              </span>
            )}
          </div>
        </section>
        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </FieldGroup>
    </form>
  )
}
