"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { ProductTagInput } from "@/components/products/product-tag-input"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  autocompleteSubmissionAction,
  deleteOwnedProductAction,
  saveSubmissionDraftAction,
} from "@/features/submissions/actions"
import type { Submission } from "@/features/submissions/queries"
import type { Category } from "@/features/products/types"
import { suggestedSlugFromUrl } from "@/features/products/validation"
import { normalizeProductTags } from "@/features/products/tags"

type FieldName =
  | "categoryId"
  | "longDescription"
  | "name"
  | "shortDescription"
  | "slug"
  | "tagline"
  | "tags"
  | "websiteUrl"

function FieldMessage({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <FieldError>{errors[0]}</FieldError> : null
}

export function PublicProductForm({
  categories,
  initialWebsiteUrl,
  onSuccess,
  submission,
}: {
  categories: Category[]
  initialWebsiteUrl: string
  onSuccess: (submissionId?: string) => void
  submission?: Submission
}) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [isAutocompleting, startAutocomplete] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [autocompletePhase, setAutocompletePhase] = useState<
    "extracting" | "generating" | null
  >(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [websiteUrl, setWebsiteUrl] = useState(
    submission?.websiteUrl ?? initialWebsiteUrl
  )
  const [name, setName] = useState(submission?.name ?? "")
  const [slug, setSlug] = useState(
    submission?.slug ?? suggestedSlugFromUrl(initialWebsiteUrl)
  )
  const [shortDescription, setShortDescription] = useState(
    submission?.shortDescription ?? ""
  )
  const [tagline, setTagline] = useState(submission?.tagline ?? "")
  const [longDescription, setLongDescription] = useState(
    submission?.longDescription ?? ""
  )
  const [categoryId, setCategoryId] = useState(submission?.categoryId ?? "")
  const [tags, setTags] = useState(submission?.tags ?? [])
  const [logoPreview, setLogoPreview] = useState(submission?.logoUrl ?? null)
  const [coverPreview, setCoverPreview] = useState(submission?.coverUrl ?? null)
  const [importedLogoUrl, setImportedLogoUrl] = useState<string | null>(null)
  const [importedCoverUrl, setImportedCoverUrl] = useState<string | null>(null)

  const categoryByName = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.name.toLowerCase(), category.id])
      ),
    [categories]
  )

  function markTouched(field: FieldName) {
    setTouched((current) => new Set(current).add(field))
  }

  function handleAutocomplete() {
    setFieldErrors({})
    setAutocompletePhase("extracting")
    const phaseTimer = window.setTimeout(
      () => setAutocompletePhase("generating"),
      700
    )

    startAutocomplete(async () => {
      const result = await autocompleteSubmissionAction(websiteUrl)
      window.clearTimeout(phaseTimer)
      setAutocompletePhase(null)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      if (!touched.has("websiteUrl")) setWebsiteUrl(result.data.websiteUrl)
      if (!touched.has("name")) setName(result.data.name)
      if (!touched.has("shortDescription"))
        setShortDescription(result.data.shortDescription)
      if (!touched.has("tagline")) setTagline(result.data.tagline)
      if (!touched.has("longDescription"))
        setLongDescription(result.data.longDescription)
      if (!touched.has("slug"))
        setSlug(suggestedSlugFromUrl(result.data.websiteUrl))
      if (!touched.has("categoryId")) {
        const suggestedCategoryId =
          categoryByName.get(result.data.suggestedCategory.toLowerCase()) ?? ""
        setCategoryId(suggestedCategoryId)
        if (!touched.has("tags")) {
          const category = categories.find((item) => item.id === suggestedCategoryId)
          setTags(normalizeProductTags(result.data.tags, category, { generated: true }))
        }
      } else if (!touched.has("tags")) {
        const category = categories.find((item) => item.id === categoryId)
        setTags(normalizeProductTags(result.data.tags, category, { generated: true }))
      }

      if (result.data.logoImageUrl) {
        setLogoPreview(result.data.logoImageUrl)
        setImportedLogoUrl(result.data.logoImageUrl)
      }
      if (result.data.coverImageUrl) {
        setCoverPreview(result.data.coverImageUrl)
        setImportedCoverUrl(result.data.coverImageUrl)
      }

      toast.success("Product details and available website media were found.")
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    const formData = new FormData(event.currentTarget)
    formData.set("category_id", categoryId)
    formData.set("tags", JSON.stringify(tags))
    if (importedLogoUrl) formData.set("imported_logo_url", importedLogoUrl)
    if (importedCoverUrl) formData.set("imported_cover_url", importedCoverUrl)

    startSaving(async () => {
      const result = await saveSubmissionDraftAction(
        submission?.id ?? null,
        formData
      )
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success(submission?.status === "submitted" ? "Live listing updated" : "Draft saved")
      if (result.mediaWarning) toast.warning(result.mediaWarning)
      router.refresh()
      onSuccess(result.id)
    })
  }

  const autocompleteLabel =
    autocompletePhase === "extracting"
      ? "Extracting..."
      : autocompletePhase === "generating"
        ? "Generating..."
        : "Autocomplete"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup className="gap-3">
        <Field data-invalid={Boolean(fieldErrors.websiteUrl?.length)}>
          <FieldLabel htmlFor="website_url">Product URL</FieldLabel>
          <Input
            id="website_url"
            name="website_url"
            value={websiteUrl}
            onChange={(event) => {
              markTouched("websiteUrl")
              setWebsiteUrl(event.target.value)
              if (!touched.has("slug"))
                setSlug(suggestedSlugFromUrl(event.target.value))
            }}
            placeholder="https://example.com"
            aria-invalid={Boolean(fieldErrors.websiteUrl?.length)}
            required
          />
          <FieldMessage errors={fieldErrors.websiteUrl} />
        </Field>
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(fieldErrors.name?.length)}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => {
                markTouched("name")
                setName(event.target.value)
              }}
              aria-invalid={Boolean(fieldErrors.name?.length)}
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
                markTouched("slug")
                setSlug(event.target.value)
              }}
              placeholder="example"
              aria-invalid={Boolean(fieldErrors.slug?.length)}
            />
            <FieldMessage errors={fieldErrors.slug} />
          </Field>
        </FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.tagline?.length)}>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
            <span className="text-xs text-muted-foreground">
              {tagline.split(/\s+/).filter(Boolean).length}/15 words
            </span>
          </div>
          <Input
            id="tagline"
            name="tagline"
            value={tagline}
            onChange={(event) => {
              markTouched("tagline")
              setTagline(event.target.value)
            }}
            maxLength={120}
            aria-invalid={Boolean(fieldErrors.tagline?.length)}
            placeholder="A concise, factual product summary"
          />
          <FieldMessage errors={fieldErrors.tagline} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.shortDescription?.length)}>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="short_description">
              Short description
            </FieldLabel>
            <span className="text-xs text-muted-foreground">
              {shortDescription.length}/280
            </span>
          </div>
          <Textarea
            id="short_description"
            name="short_description"
            value={shortDescription}
            onChange={(event) => {
              markTouched("shortDescription")
              setShortDescription(event.target.value)
            }}
            maxLength={280}
            className="min-h-20"
            aria-invalid={Boolean(fieldErrors.shortDescription?.length)}
          />
          <FieldMessage errors={fieldErrors.shortDescription} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.longDescription?.length)}>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="long_description">Long description</FieldLabel>
            <span className="text-xs text-muted-foreground">
              {longDescription.length}/5000
            </span>
          </div>
          <Textarea
            id="long_description"
            name="long_description"
            value={longDescription}
            onChange={(event) => {
              markTouched("longDescription")
              setLongDescription(event.target.value)
            }}
            maxLength={5000}
            className="min-h-24"
            aria-invalid={Boolean(fieldErrors.longDescription?.length)}
          />
          <FieldMessage errors={fieldErrors.longDescription} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.categoryId?.length)}>
          <FieldLabel htmlFor="category_id">Category</FieldLabel>
          <input name="category_id" type="hidden" value={categoryId} />
          <Select
            value={categoryId}
            onValueChange={(value) => {
              markTouched("categoryId")
              setCategoryId(value)
              const category = categories.find((item) => item.id === value)
              setTags((current) => normalizeProductTags(current, category))
            }}
          >
            <SelectTrigger
              id="category_id"
              className="w-full"
              aria-invalid={Boolean(fieldErrors.categoryId?.length)}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldMessage errors={fieldErrors.categoryId} />
        </Field>
        <Field data-invalid={Boolean(fieldErrors.tags?.length)}>
          <FieldLabel>Tags</FieldLabel>
          <input name="tags" type="hidden" value={JSON.stringify(tags)} />
          <ProductTagInput
            category={categories.find((category) => category.id === categoryId)}
            tags={tags}
            onChange={(value) => {
              markTouched("tags")
              setTags(value)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Up to 5 specific descriptors.
          </p>
          <FieldMessage errors={fieldErrors.tags} />
        </Field>
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="logo">
              Logo <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setImportedLogoUrl(null)
                setLogoPreview(URL.createObjectURL(file))
              }}
            />
            <div>
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border bg-muted/40">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="size-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {!logoPreview ? (
              <p className="text-xs text-muted-foreground">
                Required before payment.
              </p>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="cover">
              OG / cover image <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="cover"
              name="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setImportedCoverUrl(null)
                setCoverPreview(URL.createObjectURL(file))
              }}
            />
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-muted/40">
              {coverPreview ? (
                // This preview can be a temporary third-party Firecrawl URL before it is copied into R2.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="OG cover preview"
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-4 text-muted-foreground" />
              )}
            </div>
            {!coverPreview ? (
              <p className="text-xs text-muted-foreground">
                Required before payment.
              </p>
            ) : null}
          </Field>
        </FieldGroup>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="size-3" /> Autocomplete tries your site’s logo
          and OG image first; upload either one if it is missing.
        </p>
      </FieldGroup>
      <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:items-center">
        {submission?.productId && submission.name ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
            onClick={() => setDeleteOpen(true)}
            disabled={isSaving || isDeleting}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={handleAutocomplete}
          disabled={isSaving || isAutocompleting}
        >
          {isAutocompleting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {autocompleteLabel}
        </Button>
        <Button type="submit" disabled={isSaving || isAutocompleting}>
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          {isSaving ? "Saving..." : "Save draft"}
        </Button>
      </div>
      {submission?.productId && submission.name ? (
        <AlertDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeleteConfirmation("")
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {submission.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes this ShipBits listing and cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <label htmlFor="delete-product-confirmation" className="text-sm">
                To confirm, type{" "}
                <span className="font-semibold">{submission.name}</span>
              </label>
              <Input
                id="delete-product-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={
                  deleteConfirmation.trim() !== submission.name || isDeleting
                }
                onClick={(event) => {
                  event.preventDefault()
                  startDeleting(async () => {
                    const result = await deleteOwnedProductAction(
                      submission.id,
                      deleteConfirmation
                    )
                    if (!result.ok) {
                      toast.error(result.error)
                      return
                    }
                    toast.success("Product deleted.")
                    setDeleteOpen(false)
                    router.refresh()
                    onSuccess()
                  })
                }}
              >
                {isDeleting ? <Spinner data-icon="inline-start" /> : null}
                {isDeleting ? "Deleting..." : "Delete product"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </form>
  )
}
