import { Separator } from "@/components/ui/separator"
import type { PublicProductUpvoteActivity } from "@/features/products/public-queries"

function formatRelativeTime(value: string) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 1_000)
  )

  if (elapsedSeconds < 60) return "Just now"
  if (elapsedSeconds < 3_600) {
    const minutes = Math.floor(elapsedSeconds / 60)
    return `${minutes}m ago`
  }
  if (elapsedSeconds < 86_400) {
    const hours = Math.floor(elapsedSeconds / 3_600)
    return `${hours}h ago`
  }
  if (elapsedSeconds < 604_800) {
    const days = Math.floor(elapsedSeconds / 86_400)
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value))
}

export function ProductUpvoteActivity({
  productName,
  totalUpvotes,
  upvotes,
}: {
  productName: string
  totalUpvotes: number
  upvotes: PublicProductUpvoteActivity[]
}) {
  if (!upvotes.length) return null

  const shownUpvotes = upvotes.reduce(
    (total, upvote) => total + upvote.amountPesos,
    0
  )
  const moreUpvotes = Math.max(0, totalUpvotes - shownUpvotes)

  return (
    <section aria-labelledby="recent-community-support" className="px-1">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2
            id="recent-community-support"
            className="font-outfit text-lg font-semibold"
          >
            Recent community support
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Confirmed upvotes for {productName}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums">
          {totalUpvotes.toLocaleString("en-PH")} upvotes
        </p>
      </div>

      <ul className="mt-3 flex flex-col">
        {upvotes.map((upvote, index) => (
          <li key={`${upvote.paidAt}-${index}`}>
            {index > 0 ? <Separator /> : null}
            <div className="flex items-baseline justify-between gap-3 py-3 text-sm">
              <p className="min-w-0 text-muted-foreground">
                A community member supported {productName} with{" "}
                <span className="font-medium text-foreground">
                  ₱{upvote.amountPesos.toLocaleString("en-PH")}
                </span>
              </p>
              <time
                dateTime={upvote.paidAt}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {formatRelativeTime(upvote.paidAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {moreUpvotes > 0 ? (
        <p className="text-sm text-muted-foreground">
          Plus {moreUpvotes.toLocaleString("en-PH")} more community upvote
          {moreUpvotes === 1 ? "" : "s"}.
        </p>
      ) : null}
    </section>
  )
}
