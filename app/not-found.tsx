import type { Metadata } from "next"
import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="py-20">
      <SiteContainer className="flex max-w-2xl flex-col items-start gap-4">
        <p className="font-mono text-sm text-teal-700">404</p>
        <h1 className="font-outfit text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">The page may have moved, remained unpublished, or never existed.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/products">Browse products</Link></Button>
          <Button asChild variant="outline"><Link href="/">Return home</Link></Button>
        </div>
      </SiteContainer>
    </main>
  )
}
