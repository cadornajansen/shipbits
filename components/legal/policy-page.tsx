import Link from "next/link"
import type { ReactNode } from "react"

import { SiteContainer } from "@/components/layout/site-container"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { getSupportEmail } from "@/lib/site"
import { Reveal } from "@/components/motion/reveal"

type PolicyPageProps = {
  title: string
  description: string
  path: "/privacy" | "/terms" | "/refund-policy"
  children: ReactNode
}

export function PolicyPage({
  title,
  description,
  path,
  children,
}: PolicyPageProps) {
  return (
    <main>
      <SiteContainer className="py-10 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Reveal>
            <header className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                ShipBits site policies
              </p>
              <h1 className="font-outfit text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="leading-relaxed text-muted-foreground">
                {description}
              </p>
              <p className="text-sm text-muted-foreground">
                Prepared <time dateTime="2026-08-30">August 30, 2026</time>
              </p>
            </header>
          </Reveal>

          <nav
            aria-label="Site policies"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
          >
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund-policy", label: "Refund policy" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={path === item.href ? "page" : undefined}
                className="underline-offset-4 hover:underline aria-[current=page]:font-semibold aria-[current=page]:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Reveal variant="fade">
            <Alert>
              <AlertTitle>Site policy · operator review required</AlertTitle>
              <AlertDescription>
                These policies describe ShipBits and have not received legal
                review. The operator must confirm the policy commitments and
                contact details before promoting the service publicly.
              </AlertDescription>
            </Alert>
          </Reveal>

          <Reveal>
            <div className="flex flex-col gap-8 leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_p]:text-muted-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
              {children}
            </div>
          </Reveal>

          <Separator />
          <PolicySection id="contact" title="Questions or a request?">
            <PolicyContact />
          </PolicySection>
        </div>
      </SiteContainer>
    </main>
  )
}

export function PolicySection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      id={id}
      className="flex scroll-mt-8 flex-col gap-3"
    >
      <h2 id={`${id}-title`} className="font-outfit text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function PolicyContact() {
  const email = getSupportEmail()

  if (!email) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        The operator&apos;s support contact has not been configured yet. A
        working privacy and payment-support contact must be published here
        before the public launch. Do not send payment or identity documents
        through a public listing.
      </p>
    )
  }

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      Contact ShipBits at{" "}
      <a className="underline underline-offset-4" href={`mailto:${email}`}>
        {email}
      </a>
      . Include the relevant product URL and a short explanation. Never send a
      password, one-time code, API key, or full bank account credentials.
    </p>
  )
}
