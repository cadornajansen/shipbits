"use client"

import Image from "next/image"
import Link from "next/link"
import {
  BookOpenIcon,
  ChevronDownIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  MenuIcon,
  SendIcon,
  ShapesIcon,
} from "lucide-react"
import { useState } from "react"

import { AccountButton } from "@/components/layout/account-button"
import { SiteContainer } from "@/components/layout/site-container"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const mobileLinks = [
  {
    label: "Browse",
    href: "/products",
    icon: LayoutGridIcon,
  },
  {
    label: "Categories",
    href: "/products#categories",
    icon: ShapesIcon,
  },
  {
    label: "Blog",
    href: "/blog",
    icon: BookOpenIcon,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FolderOpenIcon,
  },
]

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header>
      <SiteContainer className="flex items-center justify-between py-4 md:py-5">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-5 md:gap-7">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-outfit"
          >
            <Image
              src="/branding/shipbits-logo.png"
              alt="ShipBits Logo"
              width={32}
              height={32}
              className="size-8 object-contain"
              priority
            />

            <span className="text-base font-bold md:text-xl">ShipBits</span>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-5 md:flex"
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
                Browse
                <ChevronDownIcon className="size-3" aria-hidden="true" />
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-44" align="start">
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

            <Link
              href="/directory-submission"
              className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
            >
              Submit to Directories
            </Link>
          </nav>
        </div>

        {/* Desktop account */}
        <div className="hidden shrink-0 items-center md:flex">
          <AccountButton />
        </div>

        {/* Mobile navigation */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 md:hidden"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="flex w-[min(20rem,88vw)] flex-col gap-0 p-0"
          >
            {/* Brand */}
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle asChild>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-fit items-center gap-2 font-outfit"
                >
                  <Image
                    src="/branding/shipbits-logo.png"
                    alt="ShipBits"
                    width={28}
                    height={28}
                    className="size-7 object-contain"
                  />

                  <span className="text-base font-bold">ShipBits</span>
                </Link>
              </SheetTitle>
            </SheetHeader>

            {/* Navigation */}
            <div className="flex flex-1 flex-col px-3 py-4">
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Explore
              </p>

              <nav aria-label="Mobile primary" className="flex flex-col gap-1">
                {mobileLinks.map(({ label, href, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />

                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              {/* Directory Submission */}
              <div className="mt-5 border-t pt-5">
                <SheetClose asChild>
                  <Link
                    href="/directory-submission"
                    className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3 transition-colors hover:bg-teal-100"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
                      <SendIcon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-teal-950">
                        Submit to Directories
                      </p>

                      <p className="mt-0.5 text-xs leading-4 text-teal-700">
                        Get your product discovered.
                      </p>
                    </div>
                  </Link>
                </SheetClose>
              </div>
            </div>

            {/* Auth / Dashboard */}
            <div className="border-t bg-muted/20 p-3">
              <div className="rounded-lg px-2 py-1">
                <AccountButton
                  showLoginLabel
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </SiteContainer>
    </header>
  )
}
