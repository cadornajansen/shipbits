"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { saveProfileAction } from "@/features/profile/actions"
import type { UserProfile } from "@/features/profile/queries"

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileForm({
  defaultDisplayName,
  profile,
}: {
  defaultDisplayName: string
  profile: UserProfile | null
}) {
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const displayName = profile?.displayName || defaultDisplayName

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await saveProfileAction(formData)
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success("Profile saved.")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="avatar">Profile image</FieldLabel>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-full">
              {avatarPreview || profile?.avatarUrl ? (
                <AvatarImage
                  src={avatarPreview ?? profile?.avatarUrl ?? ""}
                  alt=""
                />
              ) : null}
              <AvatarFallback>{initials(displayName || "SB")}</AvatarFallback>
            </Avatar>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="max-w-sm"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setAvatarPreview(file ? URL.createObjectURL(file) : null)
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP, or GIF · up to 5 MB.
          </p>
        </Field>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.displayName?.length)}>
            <FieldLabel htmlFor="display_name">Name</FieldLabel>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={displayName}
            />
            {fieldErrors.displayName?.[0] ? (
              <FieldError>{fieldErrors.displayName[0]}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(fieldErrors.handle?.length)}>
            <FieldLabel htmlFor="handle">Handle</FieldLabel>
            <Input
              id="handle"
              name="handle"
              defaultValue={profile?.handle ?? ""}
              placeholder="your-name"
            />
            {fieldErrors.handle?.[0] ? (
              <FieldError>{fieldErrors.handle[0]}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.headline?.length)}>
            <FieldLabel htmlFor="headline">Title</FieldLabel>
            <Input
              id="headline"
              name="headline"
              defaultValue={profile?.headline ?? ""}
              placeholder="Building thoughtful tools"
            />
            {fieldErrors.headline?.[0] ? (
              <FieldError>{fieldErrors.headline[0]}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(fieldErrors.role?.length)}>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <Input
              id="role"
              name="role"
              defaultValue={profile?.role ?? ""}
              placeholder="Founder, designer, engineer…"
            />
            {fieldErrors.role?.[0] ? (
              <FieldError>{fieldErrors.role[0]}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.bio?.length)}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="A short introduction about what you make."
          />
          {fieldErrors.bio?.[0] ? (
            <FieldError>{fieldErrors.bio[0]}</FieldError>
          ) : null}
        </Field>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.location?.length)}>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              name="location"
              defaultValue={profile?.location ?? ""}
              placeholder="Manila, Philippines"
            />
            {fieldErrors.location?.[0] ? (
              <FieldError>{fieldErrors.location[0]}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(fieldErrors.websiteUrl?.length)}>
            <FieldLabel htmlFor="website_url">Personal website</FieldLabel>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={profile?.websiteUrl ?? ""}
              placeholder="https://you.com"
            />
            {fieldErrors.websiteUrl?.[0] ? (
              <FieldError>{fieldErrors.websiteUrl[0]}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.githubUrl?.length)}>
            <FieldLabel htmlFor="github_url">GitHub</FieldLabel>
            <Input
              id="github_url"
              name="github_url"
              type="url"
              defaultValue={profile?.githubUrl ?? ""}
              placeholder="https://github.com/you"
            />
            {fieldErrors.githubUrl?.[0] ? (
              <FieldError>{fieldErrors.githubUrl[0]}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(fieldErrors.linkedinUrl?.length)}>
            <FieldLabel htmlFor="linkedin_url">LinkedIn</FieldLabel>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              defaultValue={profile?.linkedinUrl ?? ""}
              placeholder="https://linkedin.com/in/you"
            />
            {fieldErrors.linkedinUrl?.[0] ? (
              <FieldError>{fieldErrors.linkedinUrl[0]}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </FieldGroup>
    </form>
  )
}
