import { Skeleton } from "@/components/ui/skeleton"

export default function DistributionLoading() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label="Loading distribution channels"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}
