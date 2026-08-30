"use client"

import { useState } from "react"
import { ChevronDownIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  MAX_PRODUCT_TAGS,
  normalizeProductTags,
  PRODUCT_TAG_OPTIONS,
} from "@/features/products/tags"

export function ProductTagInput({
  category,
  onChange,
  tags,
}: {
  category?: { name: string; slug: string } | null
  onChange: (tags: string[]) => void
  tags: string[]
}) {
  const [open, setOpen] = useState(false)
  const selected = new Set(tags.map((tag) => tag.toLowerCase()))
  const excluded = new Set(
    category ? [category.name.toLowerCase(), category.slug.toLowerCase()] : []
  )

  function toggleTag(tag: string) {
    if (selected.has(tag.toLowerCase())) {
      onChange(tags.filter((item) => item.toLowerCase() !== tag.toLowerCase()))
      return
    }
    if (tags.length >= MAX_PRODUCT_TAGS || excluded.has(tag.toLowerCase())) return
    onChange(normalizeProductTags([...tags, tag], category))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-transparent p-1.5">
      <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag.toLowerCase()} variant="secondary" className="gap-1 pr-1">
            {tag}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="size-4 rounded-full"
              onClick={() => toggleTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <XIcon className="size-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            disabled={tags.length >= MAX_PRODUCT_TAGS}
          >
            Add tag
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList
              className="max-h-64 overflow-y-auto overscroll-contain"
              onWheel={(event) => event.stopPropagation()}
            >
              <CommandEmpty>No matching tags.</CommandEmpty>
              <CommandGroup>
                {PRODUCT_TAG_OPTIONS.map((tag) => {
                  const isSelected = selected.has(tag.toLowerCase())
                  const isExcluded = excluded.has(tag.toLowerCase())
                  return (
                    <CommandItem
                      key={tag}
                      value={tag}
                      data-checked={isSelected || undefined}
                      disabled={isExcluded || (!isSelected && tags.length >= MAX_PRODUCT_TAGS)}
                      onSelect={() => toggleTag(tag)}
                    >
                      {tag}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
