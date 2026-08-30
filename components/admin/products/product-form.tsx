"use client"

import Image from "next/image"
import { useEffect, useState, useTransition } from "react"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  createProductAction,
  updateProductAction,
} from "@/features/products/actions"
import type { Category } from "@/features/products/types"
import {
  productStatuses,
  suggestedSlugFromUrl,
} from "@/features/products/validation"

type EditableProduct = {
  categoryId: string
  coverUrl?: string | null
  id: string
  longDescription: string | null
  logoUrl?: string | null
  moderationStatus: (typeof productStatuses)[number]
  name: string
  shortDescription: string
  slug: string
  tagline: string
  websiteUrl: string
}

function updatePreview(
  file: File | null,
  setPreview: React.Dispatch<React.SetStateAction<string | null>>
) {
  setPreview((currentPreview) => {
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview)
    }

    return file ? URL.createObjectURL(file) : null
  })
}

function FieldMessage({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <FieldError>{errors[0]}</FieldError> : null
}

export function ProductForm({
  categories,
  onSuccess,
  product,
}: {
  categories: Category[]
  onSuccess: () => void
  product?: EditableProduct
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [websiteUrl, setWebsiteUrl] = useState(product?.websiteUrl ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(product))
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
  const [status, setStatus] =
    useState<(typeof productStatuses)[number]>("draft")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview, logoPreview])

  function handleUrlChange(value: string) {
    setWebsiteUrl(value)

    if (!slugWasEdited) {
      setSlug(suggestedSlugFromUrl(value))
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    const formData = new FormData(event.currentTarget)
    formData.set("category_id", categoryId)
    formData.set("moderation_status", product?.moderationStatus ?? status)

    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, formData)
        : await createProductAction(formData)

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success(
        product ? "Product updated." : "Product created as a draft."
      )
      router.refresh()
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(fieldErrors.websiteUrl?.length)}>
          <FieldLabel htmlFor="website_url">Product URL</FieldLabel>
          <Input
            id="website_url"
            name="website_url"
            type="url"
            value={websiteUrl}
            onChange={(event) => handleUrlChange(event.target.value)}
            placeholder="https://example.com"
            aria-invalid={Boolean(fieldErrors.websiteUrl?.length)}
            required
          />
          <FieldMessage errors={fieldErrors.websiteUrl} />
        </Field>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.name?.length)}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              aria-invalid={Boolean(fieldErrors.name?.length)}
              required
            />
            <FieldMessage errors={fieldErrors.name} />
          </Field>
          <Field data-invalid={Boolean(fieldErrors.slug?.length)}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugWasEdited(true)
                setSlug(event.target.value)
              }}
              placeholder="example"
              aria-invalid={Boolean(fieldErrors.slug?.length)}
              required
            />
            <FieldMessage errors={fieldErrors.slug} />
          </Field>
        </FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.tagline?.length)}>
          <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
          <Textarea
            id="tagline"
            name="tagline"
            defaultValue={product?.tagline}
            maxLength={120}
            aria-invalid={Boolean(fieldErrors.tagline?.length)}
            placeholder="A concise, memorable description of the product."
            required
          />
          <p className="text-xs text-muted-foreground">15 words maximum.</p>
          <FieldMessage errors={fieldErrors.tagline} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.shortDescription?.length)}>
          <FieldLabel htmlFor="short_description">Short description</FieldLabel>
          <Textarea
            id="short_description"
            name="short_description"
            defaultValue={product?.shortDescription}
            maxLength={280}
            aria-invalid={Boolean(fieldErrors.shortDescription?.length)}
            required
          />
          <FieldMessage errors={fieldErrors.shortDescription} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.longDescription?.length)}>
          <FieldLabel htmlFor="long_description">Long description</FieldLabel>
          <Textarea
            id="long_description"
            name="long_description"
            defaultValue={product?.longDescription ?? ""}
            maxLength={5000}
            aria-invalid={Boolean(fieldErrors.longDescription?.length)}
          />
          <FieldMessage errors={fieldErrors.longDescription} />
        </Field>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.categoryId?.length)}>
            <FieldLabel htmlFor="category_id">Category</FieldLabel>
            <input name="category_id" type="hidden" value={categoryId} />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                id="category_id"
                aria-invalid={Boolean(fieldErrors.categoryId?.length)}
                className="w-full"
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldMessage errors={fieldErrors.categoryId} />
          </Field>
          {!product ? (
            <Field data-invalid={Boolean(fieldErrors.moderationStatus?.length)}>
              <FieldLabel htmlFor="moderation_status">Status</FieldLabel>
              <input name="moderation_status" type="hidden" value={status} />
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as typeof status)}
              >
                <SelectTrigger id="moderation_status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {productStatuses.map((productStatus) => (
                      <SelectItem key={productStatus} value={productStatus}>
                        {productStatus[0].toUpperCase() +
                          productStatus.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field>
              <FieldLabel>Publication status</FieldLabel>
              <p className="text-sm text-muted-foreground">
                {product.moderationStatus[0].toUpperCase() +
                  product.moderationStatus.slice(1)}
              </p>
            </Field>
          )}
        </FieldGroup>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="logo">Logo</FieldLabel>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                updatePreview(file, setLogoPreview)
              }}
            />
            {logoPreview || product?.logoUrl ? (
              <div className="relative size-16 overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={logoPreview ?? product?.logoUrl ?? ""}
                  alt="Logo preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="cover">OG / cover image</FieldLabel>
            <Input
              id="cover"
              name="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                updatePreview(file, setCoverPreview)
              }}
            />
            {coverPreview || product?.coverUrl ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={coverPreview ?? product?.coverUrl ?? ""}
                  alt="OG image preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
          </Field>
        </FieldGroup>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {isPending
            ? "Saving..."
            : product
              ? "Save changes"
              : "Create product"}
        </Button>
      </div>
    </form>
  )
}
