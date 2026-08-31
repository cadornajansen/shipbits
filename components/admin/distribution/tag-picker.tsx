"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { DistributionTag } from "@/features/distribution/types"
import { cn } from "@/lib/utils"
import { displayLabel } from "./controls"

export function TagPicker({
  id,
  label,
  tags,
  selected,
  onChange,
  disabled,
  single = false,
}: {
  id: string
  label: string
  tags: DistributionTag[]
  selected: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  single?: boolean
}) {
  const [open, setOpen] = useState(false)
  const chosen = tags.filter((tag) => selected.includes(tag.id))
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5">
      {!single &&
        chosen.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="max-w-full gap-1 py-1 pr-1.5"
          >
            <span className="truncate">{displayLabel(tag.slug)}</span>
            <button
              type="button"
              aria-label={"Remove " + displayLabel(tag.slug)}
              className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring"
              disabled={disabled}
              onClick={() => onChange(selected.filter((id) => id !== tag.id))}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            className={cn(
              "h-9 border-dashed",
              single && "w-full justify-start border-solid"
            )}
          >
            <Plus data-icon="inline-start" />
            <span className="truncate">
              {single
                ? chosen[0]
                  ? displayLabel(chosen[0].slug)
                  : "Choose tag"
                : "Add " + label.toLowerCase()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 max-w-[calc(100vw-2rem)] p-0"
          align="start"
          collisionPadding={12}
        >
          <Command>
            <CommandInput placeholder={"Search " + label.toLowerCase() + "…"} />
            <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3rem))]">
              <CommandEmpty>No matching canonical tags.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={displayLabel(tag.slug) + " " + tag.type}
                    onSelect={() => {
                      onChange(
                        single
                          ? [tag.id]
                          : selected.includes(tag.id)
                            ? selected.filter((id) => id !== tag.id)
                            : [...selected, tag.id]
                      )
                      if (single) setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        selected.includes(tag.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{displayLabel(tag.slug)}</span>
                    {single && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {displayLabel(tag.type)}
                      </span>
                    )}
                    <span className="sr-only">
                      {selected.includes(tag.id) ? "Selected" : "Not selected"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
