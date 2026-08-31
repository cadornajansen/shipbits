import Image from "next/image"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

import { AccountButton } from "@/components/layout/account-button"
import { SiteContainer } from "@/components/layout/site-container"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/lib/supabase/auth"

export default async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header>
      <SiteContainer className="flex items-center justify-between py-4 md:py-5">
        <div className="flex min-w-0 items-center gap-5 md:gap-7">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-outfit">
            <Image
              src="/branding/shipbits-logo.png"
              alt="ShipBits Logo"
              width={1000}
              height={1000}
              className="size-8 object-contain"
            />

            <span className="text-base font-bold md:text-xl">ShipBits</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-5 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Browse
                <ChevronDownIcon className="size-3" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuItem asChild>
                  <Link href="/products">Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/products#categories">Categories</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/blog">Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/resources">Resources</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/directory-submission" className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-900">Submit to Directories</Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
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
      <SiteContainer className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3 text-sm md:hidden">
        <Link href="/products" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Browse</Link>
        <Link href="/products#categories" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Categories</Link>
        <Link href="/blog" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Blog</Link>
        <Link href="/resources" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Resources</Link>
        <Link href="/directory-submission" className="font-medium text-teal-700 transition-colors hover:text-teal-900">Submit to Directories</Link>
        {user ? <Link href="/dashboard" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link> : null}
      </SiteContainer>
    </header>
  )
}
