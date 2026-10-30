"use client"

import { Combobox } from "@base-ui/react/combobox"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Command,
  Search,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface CommandPaletteAction {
  id: string
  label: string
  description?: string
  keywords?: readonly string[]
  category: string
  icon?: ReactNode
  shortcut?: string
  children?: readonly CommandPaletteAction[]
  onSelect?: () => void
}

export interface CommandPaletteProps {
  actions: readonly CommandPaletteAction[]
  placeholder?: string
  triggerLabel?: string
  shortcut?: boolean
  className?: string
}

export function CommandPalette({
  actions,
  placeholder = "Search anything…",
  triggerLabel = "Search workspace",
  shortcut = true,
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [path, setPath] = useState<CommandPaletteAction[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [announcement, setAnnouncement] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()
  const page = path.at(-1)
  const pageActions = page?.children ?? actions
  const categories = [
    "All",
    ...new Set(pageActions.map((action) => action.category)),
  ]
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = pageActions
    .filter(
      (action) =>
        (category === "All" || action.category === category) &&
        [action.label, action.description, ...(action.keywords ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
    )
    .toSorted((a, b) => {
      if (query || page) return 0
      const aIndex = recentIds.indexOf(a.id)
      const bIndex = recentIds.indexOf(b.id)
      return (
        (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
        (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
      )
    })

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery("")
      setCategory("All")
      setPath([])
    }
  }

  function goBack() {
    setPath((current) => current.slice(0, -1))
    setQuery("")
    setCategory("All")
    input.current?.focus()
  }

  useEffect(() => {
    if (!shortcut) return
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.isComposing
      ) {
        event.preventDefault()
        setOpen((current) => !current)
        setQuery("")
        setCategory("All")
        setPath([])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [shortcut])

  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "h-11 min-w-60 justify-start gap-3 rounded-xl bg-[#1b1b1b] px-3.5 text-muted-foreground shadow-sm",
                className
              )}
            />
          }
        >
          <Search aria-hidden className="size-4" />
          {triggerLabel}
          {shortcut && (
            <kbd className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              ⌘ K
            </kbd>
          )}
        </DialogTrigger>
        <DialogContent
          initialFocus={input}
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl bg-[#1d1d1d] p-0 shadow-2xl sm:max-w-[520px]"
        >
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search workspace actions. Use arrow keys to move and Enter to
            select.
          </DialogDescription>
          <Combobox.Root
            inline
            open={open}
            items={results}
            filteredItems={results}
            filter={null}
            value={null}
            inputValue={query}
            onInputValueChange={setQuery}
            autoHighlight
            itemToStringLabel={(action: CommandPaletteAction) => action.label}
            onOpenChange={(next, details) => {
              if (!next && details.reason === "escape-key") changeOpen(false)
            }}
            onValueChange={(action: CommandPaletteAction | null) => {
              if (!action) return
              if (action.children?.length) {
                setPath((current) => [...current, action])
                setQuery("")
                setCategory("All")
                input.current?.focus()
                return
              }
              action.onSelect?.()
              setRecentIds((current) =>
                [action.id, ...current.filter((id) => id !== action.id)].slice(
                  0,
                  5
                )
              )
              setAnnouncement(`${action.label} selected`)
              changeOpen(false)
            }}
          >
            <div className="flex h-16 items-center gap-3 border-b border-white/7 px-4">
              {page ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={goBack}
                  aria-label="Back to previous actions"
                >
                  <ArrowLeft aria-hidden />
                </Button>
              ) : (
                <Search
                  aria-hidden
                  className="size-[18px] shrink-0 text-muted-foreground"
                />
              )}
              <Combobox.Input
                ref={input}
                aria-label={page ? `Search ${page.label}` : "Search commands"}
                placeholder={page ? `${page.label}…` : placeholder}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && query === "" && page) {
                    event.preventDefault()
                    goBack()
                  }
                }}
              />
              <button
                type="button"
                aria-label="Close command palette"
                onClick={() => changeOpen(false)}
                className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                esc
              </button>
            </div>
            <div
              role="group"
              aria-label="Filter commands"
              className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-2"
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => {
                    setCategory(item)
                    input.current?.focus()
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item === category
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <motion.div
              animate={{
                height: results.length
                  ? Math.min(results.length, 5) * 56 + 16
                  : 136,
              }}
              transition={{
                duration: reduced ? 0 : 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden"
            >
              <Combobox.List className="max-h-[296px] scroll-py-2 overflow-y-auto p-2 outline-none">
                {results.map((action) => (
                  <Combobox.Item
                    key={action.id}
                    value={action}
                    className="group flex h-14 cursor-default items-center gap-3 rounded-xl px-3 outline-none data-highlighted:bg-white/7"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/6 bg-white/3 text-muted-foreground [&_svg]:size-4">
                      {action.icon ?? <Command />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {action.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {!query && recentIds.includes(action.id)
                          ? "Recently used"
                          : (action.description ?? action.category)}
                      </span>
                    </span>
                    {action.children?.length ? (
                      <ChevronRight
                        aria-hidden
                        className="size-3.5 text-muted-foreground"
                      />
                    ) : action.shortcut ? (
                      <kbd
                        aria-hidden
                        className="text-[10px] text-muted-foreground"
                      >
                        {action.shortcut}
                      </kbd>
                    ) : (
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 text-muted-foreground opacity-0 group-data-highlighted:opacity-100"
                      />
                    )}
                  </Combobox.Item>
                ))}
                <Combobox.Empty className="flex h-28 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Search aria-hidden className="size-5 opacity-50" />
                  No matching commands
                </Combobox.Empty>
              </Combobox.List>
            </motion.div>
            <div className="flex items-center justify-between border-t border-white/7 px-4 py-2.5 text-[10px] text-muted-foreground">
              <span>
                ↑ ↓ Navigate <span className="mx-2 opacity-35">/</span> ↵ Select
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden className="size-3" />
                Local workspace
              </span>
            </div>
          </Combobox.Root>
        </DialogContent>
      </Dialog>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </>
  )
}
