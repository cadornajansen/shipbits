"use client"

import { Menu } from "@base-ui/react/menu"
import { ChevronDown, ChevronUp } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { Fragment, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface MorphingMenuAction {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  separatorBefore?: boolean
  onSelect: () => void
}

export interface MorphingActionMenuProps {
  actions: readonly MorphingMenuAction[]
  label?: string
  className?: string
}

/** The popup grows from the trigger's exact origin; Base UI owns menu focus. */
export function MorphingActionMenu({
  actions,
  label = "Actions",
  className,
}: MorphingActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [present, setPresent] = useState(false)
  const controls = useRef<Menu.Root.Actions>(null)
  const reduced = useReducedMotion()
  const height =
    52 +
    actions.length * 36 +
    actions.filter((action) => action.separatorBefore).length * 9

  return (
    <Menu.Root
      open={open}
      actionsRef={controls}
      onOpenChange={(next, details) => {
        if (next) setPresent(true)
        else details.preventUnmountOnClose()
        setOpen(next)
      }}
    >
      <Menu.Trigger
        className={cn(
          "inline-flex h-10 w-36 items-center justify-between rounded-[20px] border border-white/10 bg-[#242424] px-4 text-sm font-medium text-foreground shadow-sm transition-colors outline-none hover:bg-[#2c2c2c] focus-visible:ring-2 focus-visible:ring-ring",
          present && "opacity-0",
          className
        )}
      >
        {label}
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="start"
          side="bottom"
          sideOffset={-40}
          className="z-50"
        >
          <Menu.Popup
            className="origin-top-left overflow-hidden rounded-[20px] border border-white/10 bg-[#242424] text-foreground shadow-2xl outline-none"
            render={
              <motion.div
                initial={{ width: 144, height: 40 }}
                animate={{
                  width: open ? 248 : 144,
                  height: open ? height : 40,
                }}
                transition={{
                  duration: reduced ? 0 : open ? 0.26 : 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onAnimationComplete={() => {
                  if (!open) {
                    controls.current?.unmount()
                    setPresent(false)
                  }
                }}
              />
            }
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={() => controls.current?.close()}
              aria-label={`Close ${label.toLowerCase()} menu`}
              className="flex h-10 w-full items-center justify-between px-4 text-sm font-medium text-foreground outline-none"
            >
              {label}
              <ChevronUp
                aria-hidden
                className="size-3.5 text-muted-foreground"
              />
            </button>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: open ? 1 : 0, y: open ? 0 : -4 }}
              transition={{
                duration: reduced ? 0 : 0.14,
                delay: open && !reduced ? 0.06 : 0,
              }}
              className="w-[246px] px-1.5 pb-1.5"
            >
              <Menu.Group>
                {actions.map((action) => (
                  <Fragment key={action.id}>
                    {action.separatorBefore && (
                      <Menu.Separator className="mx-2 my-1 h-px bg-white/8" />
                    )}
                    <Menu.Item
                      disabled={action.disabled}
                      onClick={action.onSelect}
                      label={action.label}
                      className={cn(
                        "flex h-9 cursor-default items-center gap-2.5 rounded-xl px-2.5 text-sm outline-none data-highlighted:bg-white/7 data-disabled:pointer-events-none data-disabled:opacity-35 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
                        action.destructive &&
                          "text-red-300 [&_svg]:text-red-300/80"
                      )}
                    >
                      {action.icon}
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <kbd
                          aria-hidden
                          className="font-mono text-[10px] tracking-wide text-muted-foreground"
                        >
                          {action.shortcut}
                        </kbd>
                      )}
                    </Menu.Item>
                  </Fragment>
                ))}
              </Menu.Group>
            </motion.div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
