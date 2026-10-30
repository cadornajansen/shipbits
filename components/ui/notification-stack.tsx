"use client"

import { Toast } from "@base-ui/react/toast"
import { Check, X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export const useNotificationStack = Toast.useToastManager

export interface NotificationStackProps {
  children?: ReactNode
  className?: string
  timeout?: number
}

/** Place action controls inside the provider; useNotificationStack adds their feedback. */
export function NotificationStack({
  children,
  className,
  timeout = 0,
}: NotificationStackProps) {
  return (
    <Toast.Provider limit={3} timeout={timeout}>
      <div className={cn("flex w-full max-w-sm flex-col gap-6", className)}>
        {children}
        <NotificationViewport />
      </div>
    </Toast.Provider>
  )
}

function NotificationViewport() {
  const { toasts } = Toast.useToastManager()
  const viewport = useRef<HTMLDivElement>(null)
  const focusedToast = useRef<string | null>(null)
  useEffect(() => {
    const focused = toasts.find((toast) => toast.id === focusedToast.current)
    if (
      focusedToast.current &&
      (!focused || focused.transitionStatus === "ending")
    ) {
      if (document.activeElement === document.body)
        viewport.current?.focus({ preventScroll: true })
      focusedToast.current = null
    }
  }, [toasts])
  return (
    <Toast.Viewport
      ref={viewport}
      aria-label="Notifications"
      className="relative h-[300px] w-full outline-none"
    >
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          onFocusCapture={() => {
            focusedToast.current = toast.id
          }}
          swipeDirection="right"
          className="absolute top-0 left-0 z-[calc(10-var(--toast-index))] w-full origin-top translate-x-(--toast-swipe-movement-x) translate-y-[calc(var(--toast-index)*12px)] scale-[calc(1-var(--toast-index)*0.045)] rounded-2xl border border-border bg-card shadow-lg transition-[transform,translate,scale,opacity] duration-250 ease-out outline-none data-ending:translate-x-8 data-ending:opacity-0 data-expanded:translate-y-[calc(var(--toast-offset-y)+var(--toast-index)*12px)] data-expanded:scale-100 data-limited:pointer-events-none data-limited:opacity-0 data-starting:-translate-y-3 data-starting:opacity-0 data-swiping:transition-none motion-reduce:transition-none"
        >
          <Toast.Content className="flex items-start gap-3 p-4 transition-opacity duration-200 data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
              <Check aria-hidden className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-[13px] font-medium" />
              <Toast.Description className="mt-1 text-xs leading-relaxed text-muted-foreground" />
              {toast.actionProps && (
                <Toast.Action className="mt-2 rounded-md text-xs font-medium underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              )}
            </div>
            <Toast.Close
              aria-label="Dismiss notification"
              className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="size-3.5" />
            </Toast.Close>
          </Toast.Content>
        </Toast.Root>
      ))}
      {toasts.length === 0 && (
        <p className="pt-8 text-center text-xs text-muted-foreground">
          You’re all caught up.
        </p>
      )}
    </Toast.Viewport>
  )
}
