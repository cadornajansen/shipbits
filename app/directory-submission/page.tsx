import Link from "next/link"
import {
  ArrowRight,
  Check,
  Globe,
  Layers,
  ListChecks,
  Repeat2,
} from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { MarketingPreviewCard } from "@/components/directory-submissions/marketing-preview-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  directoryPlans,
  formatDirectoryPrice,
  planKeys,
  submissionDisclaimer,
} from "@/features/directory-submissions/config"
import { createPageMetadata } from "@/lib/seo/metadata"

export const metadata = createPageMetadata({
  title: "Directory Submission",
  description:
    `Submit once. Get discovered everywhere. ShipBits distributes your product to relevant directories, with transparent submission tracking. Packages from ${formatDirectoryPrice(directoryPlans.starter.priceCentavos)}.`,
  path: "/directory-submission",
})

const benefits = [
  {
    title: "Get discovered",
    text: "Reach people browsing directories for new tools, startups, and software.",
    icon: Globe,
  },
  {
    title: "Expand your web presence",
    text: "Create more places where your product can be discovered and referenced.",
    icon: Layers,
  },
  {
    title: "Skip repetitive forms",
    text: "Prepare your product information once and reuse it across submissions.",
    icon: Repeat2,
  },
  {
    title: "Track every submission",
    text: "See what’s queued, submitted, live, rejected, or waiting for action.",
    icon: ListChecks,
  },
]
export default function DirectorySubmissionPage() {
  return (
    <main className="py-12 sm:py-20">
      <SiteContainer className="grid gap-16 sm:gap-24">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase">
              ShipBits Directory Submission
            </p>
            <h1 className="mt-5 max-w-xl font-outfit text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Submit once.
              <br />
              Get discovered everywhere.
            </h1>
            <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
              Launch your product across relevant startup, SaaS, AI, developer,
              and niche directories without filling out the same forms over and
              over.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-teal-700 text-white hover:bg-teal-800"
              >
                <Link href="/dashboard/directory-submissions/new">
                  Submit my product <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="#pricing">See pricing</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              From {formatDirectoryPrice(directoryPlans.starter.priceCentavos)} · Human-reviewed submissions · Your product profile,
              reused
            </p>
          </div>
          <MarketingPreviewCard />
        </section>
        <section
          aria-label="Why submit with ShipBits"
          className="grid gap-7 border-y py-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {benefits.map(({ title, text, icon: Icon }) => (
            <div key={title}>
              <Icon className="mb-4 size-5 text-teal-700" aria-hidden="true" />
              <h2 className="font-outfit text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </section>
        <section>
          <h2 className="font-outfit text-3xl font-semibold tracking-tight">
            One profile. A clear path to distribution.
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Add your product",
                "Use your ShipBits product, or enter its URL and prepare a profile with autocomplete.",
              ],
              [
                "Choose your package",
                "Pick the submission count that fits your launch. Pay securely with QR Ph.",
              ],
              [
                "ShipBits distributes it",
                "We match relevant directories and handle submissions, with manual review.",
              ],
              [
                "Track every submission",
                "Follow progress, open result links, and see when a directory needs your input.",
              ],
            ].map(([title, copy], index) => (
              <li key={title}>
                <span className="font-mono text-sm text-teal-700">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {copy}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border bg-muted/20 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-outfit text-2xl font-semibold">
                Relevant places. Not a random spreadsheet.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                ShipBits distributes your product to relevant startup, SaaS, AI,
                developer, and niche directories. We check fit before
                submission; not every product belongs in every directory.
              </p>
            </div>
            <div className="flex flex-wrap content-center gap-2">
              {[
                "Startup directories",
                "SaaS directories",
                "AI directories",
                "Developer directories",
                "Productivity directories",
                "General software",
                "Open-source directories",
              ].map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="bg-background px-3 py-1.5"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Submissions are assigned in batches. Your tracker shows remaining
            slots while we verify additional relevant directories, including
            local options where available.
          </p>
        </section>
        <section id="pricing" className="scroll-mt-8">
          <header className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase">
              Simple packages
            </p>
            <h2 className="mt-3 font-outfit text-3xl font-semibold tracking-tight">
              Choose your next launch step.
            </h2>
            <p className="mt-3 text-muted-foreground">
              One-time payment. Transparent progress. No promises we can’t
              control.
            </p>
          </header>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {planKeys.map((key) => {
              const plan = directoryPlans[key]
              return (
                <article
                  key={key}
                  className={`flex flex-col rounded-xl border p-5 ${plan.popular ? "border-teal-600 bg-teal-50/30" : ""}`}
                >
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    <h3 className="font-medium">{plan.name}</h3>
                    {plan.popular ? (
                      <Badge className="bg-teal-700 text-white">
                        Most Popular
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-5 font-outfit text-4xl font-semibold tracking-tight">
                    {formatDirectoryPrice(plan.priceCentavos)}
                    <span className="text-2xl">{plan.priceSuffix}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.targetCount} submissions
                    {key === "done_for_you" ? " + manual handling" : ""}
                  </p>
                  <ul className="my-6 grid gap-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-teal-700"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.popular ? "default" : "outline"}
                    className="mt-auto"
                  >
                    <Link
                      href={`/dashboard/directory-submissions/new?plan=${key}`}
                    >
                      Choose {plan.name}
                    </Link>
                  </Button>
                </article>
              )
            })}
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {submissionDisclaimer} Packages cover ShipBits’ submission work, not
            third-party directory fees. Additional fees or Done For You scope
            require your agreement before any extra charge.
          </p>
        </section>
        <section className="flex flex-col items-start justify-between gap-5 border-t pt-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-outfit text-2xl font-semibold">
              Spend less time submitting. Keep building.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your next launch starts with the product you already have.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/directory-submissions/new">
              Submit my product <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </section>
      </SiteContainer>
    </main>
  )
}
