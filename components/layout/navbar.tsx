import Image from "next/image"
import Link from "next/link"

import { AccountButton } from "@/components/layout/account-button"
import { SiteContainer } from "@/components/layout/site-container"
import { getCurrentUser } from "@/lib/supabase/auth"

export default async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header>
      <SiteContainer className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-outfit">
          <Image
            src="/branding/shipbits-logo.png"
            alt="ShipBits Logo"
            width={1000}
            height={1000}
            className="size-8 object-contain"
          />

          <span className="text-base font-bold md:text-xl">ShipBits</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <nav aria-label="Primary" className="hidden items-center gap-5 md:flex">
            <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Browse</Link>
            <Link href="/blog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Blog</Link>
            <Link href="/resources" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Resources</Link>
          </nav>
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : null}
          <AccountButton isAuthenticated={Boolean(user)} />
        </div>
      </SiteContainer>
    </header>
  )
}
