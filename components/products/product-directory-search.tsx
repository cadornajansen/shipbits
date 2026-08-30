"use client"

import Form from "next/form"
import Link from "next/link"
import { SearchIcon, XIcon } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { DIRECTORY_SEARCH_MAX_LENGTH } from "@/features/products/search"

function SubmitAddon() {
  const { pending } = useFormStatus()
  return (
    <InputGroupAddon align="inline-end">
      {pending ? <Spinner /> : null}
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Search
      </Button>
    </InputGroupAddon>
  )
}

/**
 * URL-driven search box. Submitting navigates to `?q=`, so results stay
 * shareable and the form still works without JavaScript.
 */
export function ProductDirectorySearch({
  action,
  search,
}: {
  action: string
  search: string
}) {
  return (
    <Form action={action} scroll={false} className="w-full max-w-xl">
      <InputGroup className="h-10">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          key={search}
          type="search"
          name="q"
          defaultValue={search}
          maxLength={DIRECTORY_SEARCH_MAX_LENGTH}
          placeholder="Search products by name, tagline, or domain"
          aria-label="Search products"
        />
        <SubmitAddon />
      </InputGroup>
      {search ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing results for <span className="font-medium text-foreground">{search}</span>
          </span>
          <Link
            href={action}
            className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-900"
          >
            <XIcon className="size-3.5" />
            Clear
          </Link>
        </p>
      ) : null}
    </Form>
  )
}
