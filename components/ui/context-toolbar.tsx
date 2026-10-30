"use client"

import { Toolbar } from "@base-ui/react/toolbar"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { type ComponentType, type ReactElement } from "react"
import { cn } from "@/lib/utils"

export type ContextTool = {
  id: string
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  disabled?: boolean
}
export type ContextToolbarProps = {
  tools: readonly ContextTool[]
  value: string
  onValueChange: (value: string) => void
  label?: string
  className?: string
}

export function ContextToolbar({
  tools,
  value,
  onValueChange,
  label = "Editing tools",
  className,
}: ContextToolbarProps): ReactElement {
  const reduced = useReducedMotion()
  return (
    <Toolbar.Root
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-lg",
        className
      )}
    >
      {tools.map(({ id, label: title, icon: Icon, disabled }) => (
        <Toolbar.Button
          key={id}
          aria-label={title}
          aria-pressed={value === id}
          disabled={disabled}
          onClick={() => onValueChange(id)}
          className={cn(
            "flex h-10 min-w-10 items-center justify-center gap-0 rounded-xl px-3 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
            value === id && "bg-muted text-foreground shadow-xs"
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <AnimatePresence initial={false}>
            {value === id && (
              <motion.span
                key="label"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overflow-hidden text-xs font-medium whitespace-nowrap"
              >
                <span className="pl-2">{title}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Toolbar.Button>
      ))}
    </Toolbar.Root>
  )
}
