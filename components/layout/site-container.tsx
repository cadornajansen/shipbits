import { cn } from "@/lib/utils"

type SiteContainerProps = {
  children: React.ReactNode
  className?: string
}

export function SiteContainer({ children, className }: SiteContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  )
}
