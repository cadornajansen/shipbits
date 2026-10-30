"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useId, useRef, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface PresencePerson {
  id: string
  name: string
  initials: string
  status: "online" | "away" | "offline"
  activity?: string
}

export interface PresenceGroupProps {
  people: readonly PresencePerson[]
  maxVisible?: number
  onSelect?: (person: PresencePerson) => void
  className?: string
}

export function PresenceGroup({
  people,
  maxVisible = 4,
  onSelect,
  className,
}: PresenceGroupProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const focusedId = useRef<string | null>(null)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const reduced = useReducedMotion()
  const layoutId = useId()
  const visible = people.slice(0, Math.max(1, maxVisible))
  const overflow = people.slice(visible.length)
  const activeIndex = visible.findIndex((person) => person.id === activeId)
  return (
    <div
      className={cn("flex items-center", className)}
      role="group"
      aria-label="People in this workspace"
      onPointerLeave={() => setActiveId(focusedId.current)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focusedId.current = null
          setActiveId(null)
        }
      }}
    >
      {visible.map((person, index) => {
        const active = person.id === activeId
        const distance = Math.abs(index - activeIndex)
        return (
          <motion.button
            key={person.id}
            type="button"
            aria-label={`${person.name}, ${person.status}${person.activity ? `, ${person.activity}` : ""}`}
            aria-pressed={active}
            onPointerEnter={() => setActiveId(person.id)}
            onFocus={() => {
              focusedId.current = person.id
              setActiveId(person.id)
            }}
            onClick={() => {
              setActiveId(person.id)
              onSelect?.(person)
            }}
            animate={{
              y:
                reduced || activeIndex < 0
                  ? 0
                  : active
                    ? -9
                    : distance === 1
                      ? -3
                      : -1,
              x:
                reduced || activeIndex < 0 || active
                  ? 0
                  : (index < activeIndex ? -1 : 1) * (distance === 1 ? 3 : 1),
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 28,
              duration: reduced ? 0 : undefined,
            }}
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-background bg-muted text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
              index > 0 && "-ml-2",
              active && "z-10",
              index % 3 === 1 && "bg-[#424745]",
              index % 3 === 2 && "bg-[#49464f]"
            )}
          >
            {person.initials}
            <span
              aria-hidden
              className={cn(
                "absolute right-0 bottom-0 size-3 rounded-full border-2 border-background",
                person.status === "online"
                  ? "bg-[#bdd4c7]"
                  : person.status === "away"
                    ? "bg-[#cfc5aa]"
                    : "bg-muted-foreground"
              )}
            />
            <AnimatePresence>
              {active && (
                <motion.span
                  layoutId={reduced ? undefined : `${layoutId}-nameplate`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.12 }}
                  className="pointer-events-none absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-border bg-popover px-3 py-2 text-left whitespace-nowrap shadow-lg"
                >
                  <span className="text-xs font-medium">{person.name}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {person.activity ?? person.status}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
      {overflow.length > 0 && (
        <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
          <PopoverTrigger
            onFocus={() => {
              focusedId.current = null
              setActiveId(null)
            }}
            className="relative -ml-2 flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-background bg-card text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show ${overflow.length} more people`}
          >
            +{overflow.length}
          </PopoverTrigger>
          <PopoverContent
            className="w-56 rounded-2xl p-2 motion-reduce:animate-none"
            sideOffset={12}
          >
            <PopoverTitle className="px-2 pt-1 pb-2 text-xs text-muted-foreground">
              In this workspace
            </PopoverTitle>
            {overflow.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  onSelect?.(person)
                  setOverflowOpen(false)
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs">
                  {person.initials}
                </span>
                <span>
                  <span className="block text-xs font-medium">
                    {person.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {person.activity ?? person.status}
                  </span>
                </span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
